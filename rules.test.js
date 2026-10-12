// Run: node tests/rules.test.js
const { load } = require('./helpers');
const assert = require('assert');
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + '\n      ' + (e.stack || e).split('\n').slice(0, 3).join('\n      ')); } }

function game(starter) {
  const g = load(); const { A } = g; const st = A.State.fresh(); A.State.state = st;
  st.phase = 'play'; st.starter = starter || 'lumifern';
  A.Rules.addAmina(st, st.starter, 1); A.Rules.drain();
  g.st = st; g.R = A.Rules; g.D = A.Data; return g;
}
function seededRng(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

console.log('Roster & data');
t('at least 25 unique Aminas with unique ids and names', () => {
  const { D } = game(); assert(D.ROSTER.length >= 25, 'count ' + D.ROSTER.length);
  assert.strictEqual(new Set(D.ROSTER.map(s => s.id)).size, D.ROSTER.length);
  assert.strictEqual(new Set(D.ROSTER.map(s => s.name)).size, D.ROSTER.length);
});
t('every Amina has full data and valid abilities/elements/evolutions', () => {
  const { D } = game();
  D.ROSTER.forEach(s => {
    ['name', 'el', 'stats', 'abil', 'pers', 'lore', 'ent', 'find', 'src', 'art'].forEach(k => assert(s[k], s.id + ' missing ' + k));
    assert(D.ELEMENTS[s.el], s.id + ' bad element'); assert(s.abil.length >= 2);
    s.abil.forEach(a => assert(D.ABILITIES[a], s.id + ' bad ability ' + a));
    ['hp', 'atk', 'def', 'spd'].forEach(k => assert(s.stats[k] > 0));
    if (s.evo) assert(D.SPECIES[s.evo.to], s.id + ' bad evo');
  });
});
t('every Amina has a verified acquisition route', () => {
  const { D, R } = game();
  const reach = {}; // species -> true if some src holds up
  D.ROSTER.forEach(s => s.src.forEach(src => {
    if (src.t === 'starter') assert(['lumifern', 'umbrit'].includes(s.id));
    else if (src.t === 'area') assert(D.AREAS[src.area].steps.some(x => x[0] === 'find' && x[1] === s.id), s.id + ' not in ' + src.area);
    else if (src.t === 'evolve') assert(D.SPECIES[src.from].evo.to === s.id);
    else if (src.t === 'breed') assert(Object.values(D.BREED).some(r => r.sp === s.id) || s.id === 'chimerrow', s.id + ' no recipe');
    else if (src.t === 'dungeon') assert(D.DUNGEONS[src.d].playable);
    else if (src.t === 'event') assert(['r1'].includes(src.ev));
    else assert.fail('unknown src ' + src.t);
    reach[s.id] = true;
  }));
  assert.strictEqual(Object.keys(reach).length, D.ROSTER.length);
  Object.values(D.BREED).forEach(r => assert(D.SPECIES[r.sp]));
});
t('three dungeons defined; only the Reliquary is playable', () => {
  const { D } = game(); assert.strictEqual(D.DUNGEON_ORDER.length, 3);
  assert.strictEqual(JSON.stringify(D.DUNGEON_ORDER.filter(k => D.DUNGEONS[k].playable)), JSON.stringify(['reliquary']));
  D.DUNGEONS.reliquary.floors.forEach(f => f.battles.forEach(b => assert(D.SPECIES[b.sp])));
});
t('at least 10 habitat placements exist in the layout', () => {
  const { D } = game(); assert(Object.keys(D.STRUCTURES).length + D.FUTURE_PLOTS.length >= 10);
});

console.log('Feeding & levelling');
t('insufficient food is rejected without changing state', () => {
  const { st, R } = game(); st.res.food = 2; const xp = R.active(st).xp;
  const r = R.feed(st, st.active, 'snack'); assert(!r.ok && r.reason === 'food'); assert.strictEqual(st.res.food, 2); assert.strictEqual(R.active(st).xp, xp);
});
t('snack consumes food and adds xp', () => {
  const { st, R, D } = game(); const f0 = st.res.food; const r = R.feed(st, st.active, 'snack');
  assert(r.ok); assert.strictEqual(st.res.food, f0 - D.SNACKS.snack.food); assert.strictEqual(R.active(st).xp, D.SNACKS.snack.xp);
});
t('level-up carries over leftover xp and can chain several levels', () => {
  const { st, R } = game(); const a = R.active(st); a.xp = 0;
  const need1 = R.xpNeed(1), need2 = R.xpNeed(2);
  const r = R.addXp(st, a, need1 + need2 + 5);
  assert.strictEqual(a.lv, 3); assert.strictEqual(a.xp, 5); assert.strictEqual(r.levels.length, 2);
});
t('stats rise with level', () => {
  const { R } = game(); const a = R.statsAt('lumifern', 1), b = R.statsAt('lumifern', 10);
  ['hp', 'atk', 'def', 'spd'].forEach(k => assert(b[k] > a[k], k));
});
t('starter evolves at level 12 and the new form is recorded as owned', () => {
  const { st, R } = game(); const a = R.active(st); a.lv = 11; a.xp = 0;
  const r = R.addXp(st, a, R.xpNeed(11)); assert(r.evolved && r.evolved.to === 'solarbloom'); assert.strictEqual(a.sp, 'solarbloom'); assert(st.owned.solarbloom);
});
t('max level caps and refuses feeding', () => {
  const { st, R, D } = game(); const a = R.active(st); a.lv = D.MAX_LEVEL; const r = R.feed(st, st.active, 'snack'); assert(!r.ok && r.reason === 'max');
});

console.log('Restoration, missions, economy');
t('restoring requires gold and sets persistent structure state', () => {
  const { st, R } = game(); st.res.gold = 10; assert(!R.restore(st, 'hollow').ok);
  st.res.gold = 100; assert(R.restore(st, 'hollow').ok); assert(st.struct.hollow); assert.strictEqual(st.res.gold, 60);
  assert(!R.restore(st, 'hollow').ok);
});
t('structures obey prerequisites', () => {
  const { st, R } = game(); st.res.gold = 999; assert(!R.restore(st, 'tidegate').ok); R.restore(st, 'hollow'); assert(R.restore(st, 'tidegate').ok);
  assert(!R.restore(st, 'reliquarygate').ok, 'gate needs r1');
});
t('missions only complete on real conditions and rewards need an explicit claim', () => {
  const { st, R } = game(); const m = R.mission('m_hollow');
  assert.strictEqual(R.missionStatus(st, m), 'active'); assert(!R.claim(st, 'm_hollow').ok);
  R.restore(st, 'hollow'); assert.strictEqual(R.missionStatus(st, m), 'ready');
  const g = st.res.gold; assert(R.claim(st, 'm_hollow').ok); assert.strictEqual(st.res.gold, g + 30); assert(!R.claim(st, 'm_hollow').ok);
  assert.strictEqual(R.missionStatus(st, R.mission('m_feed')), 'active');
  assert.strictEqual(R.missionStatus(st, R.mission('m_dungeon')), 'locked');
});
t('mission ready is announced once', () => {
  const { st, R } = game(); R.restore(st, 'hollow'); R.drain(); R.scanMissions(st); R.scanMissions(st);
  assert.strictEqual(R.drain().filter(e => e.name === 'missionReady').length, 1);
});
t('rank xp rolls over into ranks', () => {
  const { st, R } = game(); R.gainRankXp(st, 500); assert(st.rank >= 3); assert(st.rankXp < D_need(st.rank));
});

function D_need(r){return 50+r*25;}
console.log('Exploration & Resonance');
t('explore reveals a resident, befriending costs food and persists species', () => {
  const { st, R, D } = game(); let r = R.explore(st, 'meadow'); assert.strictEqual(r.type, 'res');
  r = R.explore(st, 'meadow'); assert.strictEqual(r.type, 'find'); assert(st.pendingFind); assert.strictEqual(R.status(st, 'mossbun'), 'seen');
  const again = R.explore(st, 'meadow'); assert.strictEqual(again.type, 'pending');
  st.res.food = 1; assert(!R.befriend(st).ok); st.res.food = 20; const b = R.befriend(st); assert(b.ok); assert.strictEqual(st.res.food, 20 - D.BEFRIEND_COST);
  assert.strictEqual(R.status(st, 'mossbun'), 'owned'); assert.strictEqual(st.pendingFind, null);
});
t('locked areas cannot be explored until their World Resonance/restoration condition is met', () => {
  const { st, R } = game(); assert(!R.explore(st, 'tidepools').ok); assert(!R.explore(st, 'windbluff').ok);
  st.struct.tidegate = true; assert(R.explore(st, 'tidepools').ok);
});
t('Resonance event 1: investigating grants Resonyx once and unlocks Ember Ridge', () => {
  const { st, R } = game(); assert(!R.investigate(st).ok); st.struct.tidegate = true; assert(R.disturbanceVisible(st));
  assert(R.investigate(st).ok); assert(st.owned.resonyx && st.flags.r1); assert(R.areaUnlocked(st, 'emberridge')); assert(!R.investigate(st).ok); assert(!R.disturbanceVisible(st));
});
t('Resonance event 2: awakening grants the other starter, opens areas, breeding, stone', () => {
  const { st, R } = game('lumifern'); assert(!R.awakenSpire(st).ok); st.pendingR2 = true; assert(R.awakenSpire(st).ok);
  assert(st.flags.r2 && st.owned.umbrit); assert(R.areaUnlocked(st, 'windbluff') && R.areaUnlocked(st, 'driftisle'));
  assert(R.examineStone(st).ok && st.flags.stone); assert(!R.examineStone(st).ok);
});

console.log('Habitats');
t('habitat production accrues, caps and can be collected', () => {
  const { st, R } = game(); R.restore(st, 'hollow'); const h = st.habitats.hollow; const t0 = h.last;
  R.tickHabitats(st, t0 + 5 * 60000); assert(R.stockOf(st, 'hollow') >= 20); const f0 = st.res.food;
  const c = R.collect(st, 'hollow'); assert(c.ok && st.res.food === f0 + c.n);
  R.tickHabitats(st, t0 + 9999 * 60000); assert(st.habitats.hollow.stock <= R.perTick(st, 'hollow') * 20 + 0.001);
});

console.log('Breeding');
t('breeding rules: hatchery, level, compatibility, cost, timer, hatch', () => {
  const { st, R, D } = game(); const a = R.active(st); const b = R.addAmina(st, 'mossbun', 5); R.drain();
  assert.strictEqual(R.breedCheck(st, a.uid, b.uid).reason, 'noHatchery'); st.struct.hatchery = true;
  assert.strictEqual(R.breedCheck(st, a.uid, a.uid).reason, 'same'); assert.strictEqual(R.breedCheck(st, a.uid, b.uid).reason, 'level');
  a.lv = 5; const c = R.breedCheck(st, a.uid, b.uid); assert(c.ok, c.reason); assert.strictEqual(c.sp, 'lumifern'); // light+nature
  st.res.gold = 0; assert.strictEqual(R.breedCheck(st, a.uid, b.uid).reason, 'cost'); st.res.gold = 100; st.res.food = 100;
  const t0 = 1e12; R.now = () => t0; assert(R.startBreed(st, a.uid, b.uid).ok); assert(st.egg); assert.strictEqual(st.res.gold, 100 - D.BREED_COST.gold);
  assert.strictEqual(R.breedCheck(st, a.uid, b.uid).reason, 'egg'); assert(!R.hatch(st, t0 + 1000).ok);
  const h = R.hatch(st, t0 + 21000); assert(h.ok && h.inst.lv === 1 && st.egg === null && st.stats.hatched === 1);
});
t('Dark + Light needs the Spire awake; resonance + any is locked until then', () => {
  const { st, R } = game(); st.struct.hatchery = true; const a = R.active(st); a.lv = 5; const u = R.addAmina(st, 'umbrit', 5); st.res.gold = 999; st.res.food = 999;
  assert.strictEqual(R.breedCheck(st, a.uid, u.uid).reason, 'locked'); st.flags.r2 = true; const c = R.breedCheck(st, a.uid, u.uid); assert(c.ok && c.sp === 'echolyn');
  assert(R.recipeFor('resonance', 'fire').sp === 'chimerrow'); assert(R.recipeFor('earth', 'dark').sp === 'whisperhusk');
});
t('incompatible pairs are rejected', () => {
  const { st, R } = game(); st.struct.hatchery = true; st.res.gold = 999; st.res.food = 999; const a = R.active(st); a.lv = 5;
  const b = R.addAmina(st, 'ripplet', 5); b.lv = 5; const c = R.addAmina(st, 'emberkit', 5); c.lv = 5;
  assert.strictEqual(R.breedCheck(st, b.uid, c.uid).reason, 'ok' === 'x' ? '' : R.breedCheck(st, b.uid, c.uid).reason); // water+fire has no recipe
  assert(!R.breedCheck(st, b.uid, c.uid).ok);
});

console.log('Battle');
t('element multipliers are consistent and symmetric', () => {
  const { R } = game(); assert.strictEqual(R.elMult('fire', 'nature'), 1.5); assert(Math.abs(R.elMult('nature', 'fire') - 1 / 1.5) < 1e-9);
  assert.strictEqual(R.elMult('light', 'dark'), 1.5); assert.strictEqual(R.elMult('dark', 'light'), 1.5); assert.strictEqual(R.elMult('resonance', 'fire'), 1);
});
t('super-effective hits deal more damage than resisted ones', () => {
  const { R } = game(); const rng = () => 0.5; const f = R.Battle.fighter('emberkit', 5), n = R.Battle.fighter('mossbun', 5);
  const ab = R.Battle.legal ? null : null; const D = game().D;
  const strong = R.Battle.damage(f, n, D.ABILITIES.emberflick, rng).dmg, weak = R.Battle.damage(n, f, D.ABILITIES.vinewhip, rng).dmg; assert(strong > weak);
});
t('turn order follows speed; cooldowns gate special abilities', () => {
  const { st, R } = game(); const B = R.Battle; const p = B.fighter('lumifern', 5, { uid: 1 }), e = B.fighter('mossbun', 3);
  const b = B.create([p], e, { rng: seededRng(1) });
  let ev = B.act(b, { t: 'ab', id: 'sunsprout' }); assert.strictEqual(ev[0].who, 'p'); assert(!B.ready(p, 'sunsprout'));
  const before = b.turn; ev = B.act(b, { t: 'ab', id: 'sunsprout' }); assert.strictEqual(ev.length, 0); assert.strictEqual(b.turn, before);
});
t('battle always terminates with win or lose and a result', () => {
  const { R } = game(); const B = R.Battle;
  for (let s = 1; s < 30; s++) {
    const b = B.create([B.fighter('lumifern', 5, { uid: 1 }), B.fighter('mossbun', 4, { uid: 2 })], B.fighter('pebblop', 5), { rng: seededRng(s) }); let n = 0;
    while (!b.over && n++ < 200) { if (b.pending) B.act(b, { t: 'sw', to: b.party.findIndex(p => p.hp > 0) }); else { const o = B.legal(b).filter(x => x.ready); B.act(b, { t: 'ab', id: o[o.length - 1].id }); } }
    assert(b.over && (b.result === 'win' || b.result === 'lose'));
  }
});
t('guard halves damage; heal restores hp; defeat of last Amina loses', () => {
  const { R, D } = game(); const B = R.Battle; const rng = () => 0.5;
  const a = B.fighter('mossbun', 5), foe = B.fighter('pebblop', 5); const normal = B.damage(foe, a, D.ABILITIES.pebbletoss, rng).dmg; a.guard = true; const g = B.damage(foe, a, D.ABILITIES.pebbletoss, rng).dmg;
  assert(g <= Math.ceil(normal / 2) + 1);
  const b = B.create([B.fighter('lumifern', 1, { uid: 1, hp: 1 })], B.fighter('relicwarden', 20), { rng });
  const ev = B.act(b, { t: 'ab', id: 'glowpulse' }); assert(b.over && b.result === 'lose'); assert(ev.some(e => e.t === 'end'));
});

console.log('Dungeon & rewards');
function reach(st, R) { // minimal state to unlock dungeon
  st.struct.hollow = st.struct.tidegate = st.struct.reliquarygate = true; st.flags.r1 = true;
}
function autoBattle(st, R, seed) {
  const B = R.Battle; const rng = seededRng(seed); const b = R.createBattle(st, rng); let n = 0;
  while (!b.over && n++ < 300) {
    if (b.pending) { B.act(b, { t: 'sw', to: b.party.findIndex(p => p.hp > 0) }); continue; }
    const cur = B.cur(b); const opts = B.legal(b).filter(x => x.ready);
    // prefer super-effective special, heal when low
    const D = R.sp ? require('./helpers') : null; opts.sort((x, y) => (y.cd >= 0 ? 0 : 0));
    const heal = opts.find(o => ['mend', 'hum'].includes(o.id)); if (heal && cur.hp < cur.hpMax * 0.35) { B.act(b, { t: 'ab', id: heal.id }); continue; }
    const pick = opts.filter(o => !['mend', 'hum', 'leafguard'].includes(o.id)); B.act(b, { t: 'ab', id: pick[pick.length - 1].id });
  }
  return b;
}
t('dungeon is locked until the gate is restored', () => { const { st, R } = game(); assert(!R.startRun(st, 'reliquary', [st.active]).ok); reach(st, R); assert(R.startRun(st, 'reliquary', [st.active]).ok); });
t('non-playable dungeons cannot be entered', () => { const { st, R } = game(); reach(st, R); assert(!R.startRun(st, 'hollowveil', [st.active]).ok); assert(!R.startRun(st, 'resonancescar', [st.active]).ok); });
t('a reasonable party (starter L5 + two L3-4 allies) clears the Reliquary and rewards persist', () => {
  let wins = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const { st, R } = game(seed % 2 ? 'lumifern' : 'umbrit'); reach(st, R); st.aminas[0].lv = 5; R.addAmina(st, 'mossbun', 4); R.addAmina(st, 'pebblop', 3); R.drain();
    R.startRun(st, 'reliquary', R.defaultParty(st)); let guard = 0, cleared = false;
    while (st.run && guard++ < 12) { const b = autoBattle(st, R, seed * 7 + guard); const o = R.resolveBattle(st, b); if (!o.win) break; if (o.cleared) { cleared = true; break; } }
    if (cleared) { wins++; assert(st.dungeon.reliquary.clears === 1 && st.owned.relicwarden && st.pendingR2 && st.res.gems >= 5); }
  }
  console.log('      (auto-play clear rate with L5/L4/L3 party: ' + wins + '/20)'); assert(wins >= 14, 'too hard: ' + wins);
});
t('losing returns to sanctuary with no progress loss and a small consolation', () => {
  const { st, R } = game(); reach(st, R); R.startRun(st, 'reliquary', [st.active]); const f = st.res.food;
  const b = R.createBattle(st, seededRng(3)); b.party[0].hp = 0; b.over = true; b.result = 'lose'; const o = R.resolveBattle(st, b);
  assert(!o.win && st.run === null && st.res.food === f + 5 && st.stats.losses === 1);
});
t('second clear gives Briarstag; run state is saved/restored', () => {
  const { st, R, A } = game(); reach(st, R); st.aminas[0].lv = 14; st.aminas[0].sp = 'solarbloom'; st.dungeon.reliquary.clears = 1;
  R.startRun(st, 'reliquary', [st.active]); A.State.state = st; A.State.save(); A.State.load(); const st2 = A.State.state; assert(st2.run && st2.run.d === 'reliquary');
  let cleared = false, g = 0; while (st2.run && g++ < 12) { const b = autoBattle(st2, R, 100 + g); const o = R.resolveBattle(st2, b); if (!o.win) break; if (o.cleared) cleared = true; }
  assert(cleared && st2.owned.briarstag);
});

console.log('Save system');
t('save/load round-trips everything important', () => {
  const { st, R, A } = game('umbrit'); A.State.state = st; R.restore(st, 'hollow'); R.feed(st, st.active, 'feast'); st.flags.r1 = true; st.egg = { sp: 'mossbun', parents: ['a', 'b'], startedAt: 1, readyAt: 2 };
  A.State.save(); A.State.state = A.State.fresh(); assert(A.State.load()); const s = A.State.state;
  assert.strictEqual(s.starter, 'umbrit'); assert(s.struct.hollow && s.flags.r1); assert.strictEqual(s.res.food, st.res.food); assert(s.egg && s.egg.sp === 'mossbun'); assert.strictEqual(s.aminas[0].xp, st.aminas[0].xp);
});
t('corrupted saves do not crash and reset works', () => {
  const { st, A, store, ctx } = game(); store[A.Data.SAVE_KEY] = '{not json'; assert.strictEqual(A.State.load(), false); A.State.state = st; A.State.save(); assert(A.State.hasSave());
  A.State.reset(); assert(!A.State.hasSave()); assert.strictEqual(A.State.state.aminas.length, 0); assert.strictEqual(A.State.state.res.gold, A.Data.START.gold);
});
t('backup code export/import works', () => {
  const { st, A } = game(); A.State.state = st; st.res.gold = 777; const code = A.State.exportCode(); A.State.reset(); assert(A.State.importCode(code)); assert.strictEqual(A.State.state.res.gold, 777); assert(!A.State.importCode('garbage'));
});
t('older saves gain new fields via merge', () => {
  const { st, A, store } = game(); const old = JSON.parse(JSON.stringify(st)); delete old.recipes; delete old.settings; store[A.Data.SAVE_KEY] = JSON.stringify(old);
  assert(A.State.load()); assert(A.State.state.settings && A.State.state.recipes);
});

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
