/* Aminas — UI part 2: dungeons, battle, hatchery. */
(function (root) {
  'use strict';
  const A = root.A, D = A.Data, R = A.Rules, S = A.State, Art = A.Art, T = A.Story, Au = A.Audio, UI = A.UI;
  const { esc, pct, chip, artBox, silBox } = UI.h, I = Art.icon;
  const $ = (s, r) => (r || document).querySelector(s);
  const st = () => S.state;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const B = R.Battle;

  /* ---------- dungeons ---------- */
  UI.dungeons = function (ovEx) {
    const s = st();
    const cards = D.DUNGEON_ORDER.map((id) => {
      const d = D.DUNGEONS[id], unlocked = R.dungeonUnlocked(s, id), run = s.run && s.run.d === id;
      const cl = (s.dungeon[id] || {}).clears || 0;
      let right;
      if (!d.playable) right = '<span class="tagp sealed">Sealed</span>';
      else if (!unlocked) right = '<span class="tagp sealed">' + I('lock') + ' Locked</span>';
      else right = '<span class="tagp play">Playable</span>';
      let actions = '';
      if (d.playable && unlocked) actions = (run ? '<button class="btn gold" data-act="resumeRun" data-id="' + id + '">Resume run</button> <button class="btn small ghost" data-act="dropRun">Abandon run</button>' : '<button class="btn gold" data-act="enterDungeon" data-id="' + id + '">Enter</button>');
      const species = d.species ? '<div class="res-list">' + d.species.map((x) => '<div class="mini">' + silBox(x) + '???</div>').join('') + '</div>' : '';
      return '<div class="dcard ' + (d.playable ? '' : 'sealed') + '"><div><h3>' + esc(d.name) + ' ' + chip(d.el) + ' ' + right + '</h3><p>' + esc(d.theme) + '</p>' +
        '<p><b>Floors:</b> ' + d.floors.length + ' &nbsp; <b>Recommended level:</b> ' + d.recommended + (cl ? ' &nbsp; <b>Cleared:</b> ' + cl + '×' : '') + '</p>' +
        '<p><b>' + (d.playable && unlocked ? 'Status' : 'Unlock') + ':</b> ' + (d.playable ? (unlocked ? 'Open. ' : esc(d.unlockText)) : esc(d.unlockText) + ' <i>Not playable in this version. It arrives in a later chapter.</i>') + '</p>' +
        '<p><b>Rewards:</b> ' + esc(d.rewardText) + '</p>' + (d.playable ? '' : species) + '</div><div style="align-self:center;display:flex;flex-direction:column;gap:.4rem">' + actions + '</div></div>';
    }).join('');
    const html = UI.sheet('Dungeons', cards, '<span class="muted" style="margin-right:auto;font-size:.78rem">Battles are turn-based. Fire beats Nature beats Water beats Fire. Light and Dark counter each other.</span><button class="btn gold" data-act="close">Close</button>', 'wide');
    if (ovEx && ovEx.parentNode) { ovEx.innerHTML = html; return ovEx; }
    return UI.modal(html);
  };
  UI.act('dungeons', (el) => { const ov = el.closest('.overlay'); if (ov && /Restored/.test(ov.textContent)) UI.close(ov); UI.dungeons(); });
  UI.act('dropRun', (el) => { R.abandonRun(st()); S.save(); UI.dungeons(el.closest('.overlay')); });
  UI.act('resumeRun', (el) => { UI.close(el.closest('.overlay')); UI.nextEncounter(); });
  UI.act('enterDungeon', (el) => { const id = el.dataset.id; UI.partyPicker(id, el.closest('.overlay')); });

  UI.partyPicker = function (id) {
    const s = st(); let sel = (s.party && s.party.filter((u) => R.inst(s, u)).length ? s.party.filter((u) => R.inst(s, u)) : R.defaultParty(s)).slice(0, 3);
    const d = D.DUNGEONS[id];
    const ov = UI.modal('<div></div>');
    const draw = () => {
      const list = s.aminas.slice().sort((a, b) => b.lv - a.lv);
      const slots = [0, 1, 2].map((i) => { const a = R.inst(s, sel[i]); return '<div class="slot">' + (a ? artBox(a.sp) + '<b>' + esc(D.SPECIES[a.sp].name) + '</b>Lv ' + a.lv : '<span class="muted">Empty</span>') + '</div>'; }).join('');
      const avg = sel.length ? Math.round(sel.reduce((m, u) => m + R.inst(s, u).lv, 0) / sel.length) : 0;
      ov.innerHTML = UI.sheet('Choose your party · ' + esc(d.name),
        '<div class="party-row">' + slots + '<div class="muted" style="font-size:.8rem;align-self:center">Pick up to 3. The first one fights first. Recommended level ' + d.recommended + '. Your party average: <b class="' + (avg >= d.recommended ? 'good' : 'bad') + '">' + (avg || '–') + '</b>.<br>Foes here are Nature, Earth and Water types. Fire and Wind hit hard.</div></div><div class="grid">' +
        list.map((a) => { const sp = D.SPECIES[a.sp], on = sel.indexOf(a.uid); return '<div class="card ' + (on >= 0 ? 'sel' : '') + '" data-pp="' + a.uid + '">' + artBox(a.sp) + (on >= 0 ? '<span class="cnt">#' + (on + 1) + '</span>' : '') + '<div class="nm">' + esc(sp.name) + '</div><div>' + chip(sp.el) + '</div><div class="lvl">Lv ' + a.lv + '</div></div>'; }).join('') + '</div>',
        '<button class="btn ghost" data-act="close">Back</button><button class="btn gold ' + (sel.length ? '' : 'off') + '" id="pp-go">Enter the dungeon</button>', 'wide');
      ov.querySelectorAll('[data-pp]').forEach((c) => (c.onclick = () => { Au.play('tap'); const u = +c.dataset.pp, i = sel.indexOf(u); if (i >= 0) sel.splice(i, 1); else if (sel.length < 3) sel.push(u); draw(); }));
      const go = $('#pp-go', ov); if (go) go.onclick = () => { if (!sel.length) return; const r = R.startRun(s, id, sel); if (!r.ok) return; S.save(); UI.closeAll(); UI.nextEncounter(); };
    };
    draw();
  };

  UI.nextEncounter = function () {
    const s = st(), enc = R.encounter(s);
    if (!enc) { UI.showIsland(); return; }
    const sp = D.SPECIES[enc.spec.sp], boss = !!enc.spec.boss;
    const ov = UI.modal('<div class="sheet panel narrow vcard" style="padding:1rem"><div class="muted" style="letter-spacing:.12em;font-size:.78rem">FLOOR ' + (enc.floor + 1) + ' OF ' + enc.floors + ' · ' + esc(enc.floorName.toUpperCase()) + '</div><h1 style="font-size:1.5rem">' + (boss ? 'A guardian blocks the way' : 'Battle ' + (enc.battle + 1) + ' of ' + enc.battles) + '</h1><div class="art" style="width:7rem;height:7rem;margin:.2rem auto">' + Art.creature(enc.spec.sp) + '</div><h2>' + esc(enc.spec.title || sp.name) + ' · Lv ' + enc.spec.lv + '</h2><div>' + chip(sp.el) + '</div><p class="muted" style="font-size:.8rem;margin:.4rem 0">Strong against ' + (D.STRONG[sp.el].map((x) => D.ELEMENTS[x].name).join(', ') || 'nothing') + '.</p><div class="row-actions" style="justify-content:center"><button class="btn ghost" id="enc-retreat">Retreat</button><button class="btn gold" id="enc-go">Fight</button></div></div>', { dismiss: false });
    $('#enc-go', ov).onclick = () => { UI.close(ov); UI.startBattle(); };
    $('#enc-retreat', ov).onclick = () => UI.confirm('Retreat?', 'You return to the sanctuary. Nothing is lost, but this run ends.', 'Retreat', () => { UI.close(ov); R.abandonRun(st()); S.save(); UI.showIsland(); });
  };

  /* ---------- battle ---------- */
  function syncDisp() {
    const b = UI.B.b, p = B.cur(b), e = b.enemy;
    UI.B.disp = { pName: p.name, pSp: p.sp, pLv: p.lv, pHp: p.hp, pMax: p.hpMax, pEl: p.el, eName: e.name, eSp: e.sp, eLv: e.lv, eHp: e.hp, eMax: e.hpMax, eEl: e.el };
  }
  const hpCls = (a, m) => (a / m < 0.25 ? 'low' : a / m < 0.5 ? 'mid' : '');
  UI.startBattle = function () {
    const s = st(), enc = R.encounter(s);
    UI.screen = 'battle'; Object.values(UI.timers).forEach(clearInterval); UI.timers = {};
    Au.setMode('battle');
    const b = R.createBattle(s);
    UI.B = { b, busy: true, log: '', over: false };
    syncDisp();
    $('#stage').innerHTML = '<div class="battle" id="battle">' + Art.battleBg(enc.spec.boss ? 'boss' : '') +
      '<div class="b-field" id="b-field"><div class="b-spr e in" id="spr-e"></div><div class="b-spr p in" id="spr-p"></div></div>' +
      '<div class="b-top"><div class="b-panel" id="pan-e"></div><div style="display:flex;gap:.5rem;align-items:center;pointer-events:auto"><span class="pill" style="font-size:.78rem">Floor ' + (enc.floor + 1) + '/' + enc.floors + ' · ' + (enc.battle + 1) + '/' + enc.battles + '</span><button class="round" data-act="bRetreat" aria-label="Retreat">' + I('close') + '</button></div></div>' +
      '<div class="b-log" id="b-log"></div><div class="b-panel pp" id="pan-p"></div><div class="b-party" id="b-party"></div><div class="b-actions" id="b-actions"></div></div>';
    $('#spr-e').innerHTML = Art.creature(b.enemy.sp); $('#spr-p').innerHTML = Art.creature(B.cur(b).sp);
    bLog(enc.spec.title ? 'The ' + enc.spec.title + ' rises!' : 'A wild ' + b.enemy.name + ' appears!');
    bRender();
    setTimeout(() => { UI.B.busy = false; bRender(); }, 700);
  };
  function bLog(t) { const l = $('#b-log'); if (l) l.textContent = t; }
  function bRender() {
    const U = UI.B; if (!U || !$('#battle')) return;
    const b = U.b, d = U.disp, cur = B.cur(b);
    $('#pan-e').innerHTML = '<div class="nm">' + esc(d.eName) + ' ' + chip(d.eEl) + ' <span class="muted">Lv ' + d.eLv + '</span></div><div class="bar hp ' + hpCls(d.eHp, d.eMax) + '"><i style="width:' + pct(d.eHp, d.eMax) + '%"></i></div><div class="hpn">' + Math.max(0, d.eHp) + ' / ' + d.eMax + '</div>';
    $('#pan-p').innerHTML = '<div class="nm">' + esc(d.pName) + ' ' + chip(d.pEl) + ' <span class="muted">Lv ' + d.pLv + '</span></div><div class="bar hp ' + hpCls(d.pHp, d.pMax) + '"><i style="width:' + pct(d.pHp, d.pMax) + '%"></i></div><div class="hpn">' + Math.max(0, d.pHp) + ' / ' + d.pMax + '</div>';
    $('#b-party').innerHTML = b.party.map((f, i) => '<button class="pm ' + (i === b.pi && !b.pending ? 'cur' : '') + (f.hp <= 0 ? ' ko' : '') + (b.pending && f.hp > 0 ? ' tapme' : '') + '" data-act="bSwitch" data-i="' + i + '"><div class="art">' + Art.creature(f.sp) + '</div>' + esc(f.name.slice(0, 8)) + '<div class="bar hp ' + hpCls(f.hp, f.hpMax) + '"><i style="width:' + pct(f.hp, f.hpMax) + '%"></i></div></button>').join('');
    const off = U.busy || b.over;
    if (b.pending) $('#b-actions').innerHTML = '<div class="pill" style="grid-column:span 2;justify-content:center">Choose your next Amina</div>';
    else {
      const el = (id) => D.ABILITIES[id];
      $('#b-actions').innerHTML = B.legal(b).map((a) => {
        const ab = el(a.id), eff = ab.type === 'dmg' || ab.type === 'drain' || ab.type === 'weaken' ? R.elMult(ab.el, b.enemy.el) : 1;
        return '<button class="abtn ' + (off || !a.ready ? 'off' : '') + '" data-act="bAbility" data-id="' + a.id + '"><b>' + ab.name + '</b><small>' + chip(ab.el) + (ab.power ? 'Pow ' + ab.power : ab.type === 'heal' ? 'Heal' : 'Guard') + (eff > 1.01 ? ' <span class="good">▲ strong</span>' : eff < 0.99 ? ' <span class="bad">▼ weak</span>' : '') + '</small>' + (a.cd ? '<span class="cd">' + (a.cd + 0) + '</span>' : '') + '</button>';
      }).join('') + '<button class="abtn swap ' + (off || B.alive(b) < 2 ? 'off' : '') + '" data-act="bSwapOpen" style="grid-column:span 2;min-height:2.6rem"><b>' + I('swap') + ' Switch Amina</b><small>Uses your turn</small></button>';
    }
  }
  function floatAt(side, text, cls) {
    const spr = $('#spr-' + side), fld = $('#b-field'); if (!spr || !fld) return;
    const r = spr.getBoundingClientRect(), f = fld.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'float ' + cls; d.textContent = text;
    d.style.cssText = 'left:' + (r.left - f.left + r.width / 2 - 14) + 'px;top:' + (r.top - f.top + r.height * 0.2) + 'px';
    fld.appendChild(d); setTimeout(() => d.remove(), 1100);
  }
  function burstAt(side, el) {
    const spr = $('#spr-' + side), fld = $('#b-field'); if (!spr || !fld) return;
    const r = spr.getBoundingClientRect(), f = fld.getBoundingClientRect(), c = D.ELEMENTS[el].color;
    const d = document.createElement('div'); d.className = 'fxburst';
    d.style.cssText = 'left:' + (r.left - f.left + r.width / 2 - 56) + 'px;top:' + (r.top - f.top + r.height / 2 - 56) + 'px;background:radial-gradient(circle,#fff 0%,' + c + ' 40%,transparent 70%)';
    fld.appendChild(d); setTimeout(() => d.remove(), 600);
  }
  function cls(side, c, ms) { const e = $('#spr-' + side); if (!e) return; e.classList.remove(c); void e.offsetWidth; e.classList.add(c); setTimeout(() => e.classList.remove(c), ms || 500); }

  async function playEvents(ev) {
    const U = UI.B, d = U.disp;
    for (const e of ev) {
      if (!$('#battle')) return;
      switch (e.t) {
        case 'use':
          bLog(e.name + ' used ' + e.abName + '!'); cls(e.who, 'lunge-' + e.who, 450);
          if (D.ABILITIES[e.abil].type === 'guard') Au.play('guard');
          await sleep(480); break;
        case 'hit': {
          const side = e.who; burstAt(side, e.el); cls(side, 'hurt', 450);
          floatAt(side, '-' + e.dmg, e.eff);
          if (side === 'e') d.eHp = e.hp; else d.pHp = e.hp;
          Au.play(e.eff === 'super' ? 'super' : e.eff === 'weak' ? 'weak' : 'hit');
          bLog(e.eff === 'super' ? 'It’s super effective!' : e.eff === 'weak' ? 'It’s not very effective…' : (e.guarded ? 'The guard softened the blow.' : ''));
          bRender(); await sleep(e.eff === 'super' ? 800 : 620); break;
        }
        case 'heal':
          if (e.who === 'p') d.pHp = e.hp; else d.eHp = e.hp;
          floatAt(e.who === 'p' ? 'p' : 'e', '+' + e.amt, 'heal'); Au.play('heal'); bLog('Recovered ' + e.amt + ' health.'); bRender(); await sleep(560); break;
        case 'guard': bLog((e.who === 'p' ? d.pName : d.eName) + ' braces for impact.'); await sleep(450); break;
        case 'weak': bLog((e.who === 'p' ? d.pName : d.eName) + '’s attack fell!'); await sleep(450); break;
        case 'faint': { const sd = e.who; cls(sd, 'faint', 900); const el = $('#spr-' + sd); if (el) el.classList.add('faint'); Au.play('faint'); bLog((sd === 'p' ? d.pName : d.eName) + ' was defeated!'); await sleep(900); break; }
        case 'switch': {
          const f = U.b.party[e.idx];
          d.pName = f.name; d.pSp = f.sp; d.pLv = f.lv; d.pHp = e.hp; d.pMax = f.hpMax; d.pEl = f.el;
          const spr = $('#spr-p'); if (spr) { spr.classList.remove('faint'); spr.innerHTML = Art.creature(f.sp); cls('p', 'in', 500); }
          Au.play('ok'); bLog('Go, ' + f.name + '!'); bRender(); await sleep(560); break;
        }
        case 'needSwitch': bLog('Choose your next Amina.'); break;
      }
    }
  }
  async function bAct(action) {
    const U = UI.B; if (!U || U.busy || U.over) return;
    U.busy = true; bRender();
    const ev = B.act(U.b, action);
    await playEvents(ev);
    if (U.b.over) { U.over = true; return bFinish(); }
    U.busy = false; bRender();
  }
  UI.act('bAbility', (el) => bAct({ t: 'ab', id: el.dataset.id }));
  UI.act('bSwitch', (el) => {
    const U = UI.B; if (!U || U.busy || U.over) return; const i = +el.dataset.i, f = U.b.party[i];
    if (!f || f.hp <= 0 || (i === U.b.pi && !U.b.pending)) return; bAct({ t: 'sw', to: i });
  });
  UI.act('bSwapOpen', () => { const U = UI.B; if (U && !U.busy) UI.toast('Tap one of your Aminas in the bottom-left to switch. It uses your turn.', 'n'); });
  UI.act('bRetreat', () => { const U = UI.B; if (!U || U.busy) return; UI.confirm('Retreat from the dungeon?', 'You return to the sanctuary. Nothing is lost, but this run ends.', 'Retreat', () => { R.abandonRun(st()); S.save(); UI.B = null; UI.showIsland(); }); });

  async function bFinish() {
    const U = UI.B, s = st();
    await sleep(500);
    const out = R.resolveBattle(s, U.b); R.after(s); S.save();
    if (out.win) { Au.play('win'); UI.victory(out); } else { Au.play('lose'); UI.defeat(out); }
  }
  UI.victory = function (out) {
    const s = st();
    const rows = out.xp.map((x) => {
      const lvl = x.levels.length ? '<div class="lvlup">LEVEL UP! Lv ' + x.levels[0].from + ' → ' + x.levels[x.levels.length - 1].to + '</div>' : '';
      const evo = x.evolved ? '<div class="lvlup">Evolved into ' + esc(D.SPECIES[x.evolved.to].name) + '!</div>' : '';
      return '<div class="xprow"><div class="art">' + Art.creature(x.sp) + '</div><div class="grow"><b>' + esc(D.SPECIES[x.sp].name) + '</b> <span class="muted">+' + x.gained + ' xp' + (x.alive ? '' : ' (fainted: half)') + '</span>' + lvl + evo + '</div></div>';
    }).join('');
    const cleared = out.cleared;
    const body = '<div class="vcard"><h1>' + (cleared ? 'Dungeon cleared!' : out.boss ? 'Guardian defeated!' : 'Victory!') + '</h1><div class="rw" style="justify-content:center;font-size:1rem;margin-bottom:.4rem"><span>' + I('gold') + ' +' + out.gold + '</span><span>' + I('food') + ' +' + out.food + '</span></div>' +
      (cleared ? '<div class="panel" style="padding:.5rem;margin:.4rem 0"><b>Reliquary reward</b><div class="rw" style="justify-content:center;font-size:1rem">' + ['gold', 'food', 'gems'].filter((k) => out.reward[k]).map((k) => '<span>' + I(k) + ' +' + out.reward[k] + '</span>').join('') + '</div>' + (out.newSp.length ? '<div class="good" style="margin-top:.3rem">' + out.newSp.map((x) => esc(D.SPECIES[x].name)).join(', ') + ' joined your sanctuary!</div>' : '') + '</div>' : (out.floorDone ? '<div class="muted">The party rests at a glowing spring and recovers some health.</div>' : '')) + rows + '</div>';
    const ov = UI.modal(UI.sheet('Battle result', body, '<button class="btn gold" id="v-go">' + (cleared ? 'Return to the sanctuary' : 'Continue') + '</button>', 'narrow'), { dismiss: false });
    $('.x', ov).remove();
    UI.sparkles($('.vcard h1', ov), 20);
    $('#v-go', ov).onclick = () => { UI.close(ov); UI.B = null; if (cleared || !s.run) UI.showIsland(); else UI.nextEncounter(); };
  };
  UI.defeat = function (out) {
    const ov = UI.modal(UI.sheet('Defeated', '<div class="vcard"><h1 style="color:#c9b8ff">Your party was overwhelmed</h1><p class="muted">You retreat to the sanctuary. Nothing is lost. You keep every level you earned on the way, and a little food (+' + out.food + ') for the trouble.</p><p class="muted" style="font-size:.85rem">Tip: feed your Aminas, bring three, and use elements. Fire beats Nature.</p></div>', '<button class="btn gold" id="v-go">Return to the sanctuary</button>', 'narrow'), { dismiss: false });
    $('.x', ov).remove(); $('#v-go', ov).onclick = () => { UI.close(ov); UI.B = null; UI.showIsland(); };
  };

  /* ---------- hatchery ---------- */
  const REASONS = { noHatchery: 'Restore the Old Hatchery first.', egg: 'An egg is already incubating.', pick: 'Choose two parents.', same: 'Choose two different Aminas.', level: 'Both parents must be level ' + D.BREED_MIN_LEVEL + ' or higher.', incompat: 'These two don’t resonate. Try another pairing.', locked: 'This pairing needs the Dormant Spire to wake first.', cost: 'You need ' + D.BREED_COST.gold + ' gold and ' + D.BREED_COST.food + ' food.' };
  UI.hSel = [null, null];
  function eggSvg(pct_, ready) {
    const cracks = pct_ > 0.35 ? '<path d="M40 38l8 10-6 8 8 8" stroke="#8a6a3a" stroke-width="2" fill="none"/>' : '';
    return '<svg class="egg-svg ' + (ready ? 'ready' : 'wob') + '" viewBox="0 0 100 124"><defs><radialGradient id="eg" cx=".4" cy=".3"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#f1d6a0"/></radialGradient></defs><path d="M50 6C28 6 12 52 12 78a38 38 0 0 0 76 0C88 52 72 6 50 6z" fill="url(#eg)" stroke="#b8935a" stroke-width="3"/><circle cx="34" cy="64" r="6" fill="#ffb8d2" opacity=".8"/><circle cx="62" cy="52" r="5" fill="#9ad4ff" opacity=".8"/><circle cx="58" cy="86" r="7" fill="#b8e8a0" opacity=".8"/>' + cracks + (ready ? '<path d="M30 30l12 14-8 8 14 10 6-8 12 6" stroke="#8a6a3a" stroke-width="2.5" fill="none"/>' : '') + '</svg>';
  }
  function eggBox() {
    const s = st(), e = s.egg && R.eggStatus(s);
    if (!s.egg) return '<div class="eggbox" id="eggbox"><div class="muted" style="font-size:.85rem">No egg yet.<br>Choose two parents and start incubation.</div>' + eggSvg(0, false).replace('wob', '').replace('egg-svg ', 'egg-svg " style="opacity:.35') + '</div>';
    const secs = Math.ceil(e.left / 1000);
    return '<div class="eggbox" id="eggbox"><b>' + (e.ready ? 'It’s hatching!' : 'Incubating…') + '</b>' + eggSvg(e.progress, e.ready) + '<div class="bar xp"><i style="width:' + Math.round(e.progress * 100) + '%"></i></div><div class="muted" style="font-size:.8rem;margin:.3rem 0">' + (e.ready ? 'Ready!' : (secs >= 60 ? Math.floor(secs / 60) + 'm ' + (secs % 60) + 's' : secs + 's') + ' left') + '</div>' + (e.ready ? '<button class="btn gold" data-act="hHatch">Hatch!</button>' : '') + '</div>';
  }
  UI.hatchery = function (ovEx) {
    const s = st();
    if (!s.struct.hatchery) { UI.toast('The Old Hatchery is still in ruins. Restore it first (it unlocks after the Tide Gate).', 't'); return; }
    const parent = (i) => { const a = R.inst(s, UI.hSel[i]); return '<button class="slot" style="width:100%;background:rgba(0,0,0,.2)" data-act="hPick" data-i="' + i + '">' + (a ? artBox(a.sp) + '<b>' + esc(D.SPECIES[a.sp].name) + '</b>Lv ' + a.lv : I('plus') + '<span class="muted">Choose parent ' + (i + 1) + '</span>') + '</button>'; };
    const a = UI.hSel[0], b = UI.hSel[1], chk = R.breedCheck(s, a, b);
    let msg;
    if (chk.ok) { const known = s.recipes && s.recipes[chk.key]; msg = '<span class="good"><b>Compatible!</b></span> Egg: <b>' + (known ? esc(D.SPECIES[known].name) : 'a mystery egg') + '</b>. Cost: ' + I('gold') + ' ' + D.BREED_COST.gold + ' ' + I('food') + ' ' + D.BREED_COST.food + '. Incubation: ' + (D.EGG_SECONDS[s.settings.eggSpeed] >= 60 ? D.EGG_SECONDS[s.settings.eggSpeed] / 60 + ' min' : D.EGG_SECONDS[s.settings.eggSpeed] + ' sec') + '.'; }
    else msg = '<span class="' + (chk.reason === 'pick' ? 'muted' : 'bad') + '">' + (REASONS[chk.reason] || '') + '</span>';
    const html = UI.sheet('Old Hatchery', '<div class="hatch"><div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">' + parent(0) + parent(1) + '</div><div class="hint-line" style="margin:.5rem 0">' + msg + '</div><div class="row-actions"><button class="btn gold ' + (chk.ok ? '' : 'off') + '" data-act="hStart">' + I('egg') + ' Start incubation</button><button class="btn small ghost" data-act="hBook">Recipe book</button></div></div>' + eggBox() + '</div>',
      '<span class="muted" style="margin-right:auto;font-size:.78rem">Parents must be level ' + D.BREED_MIN_LEVEL + '+. Parents are not consumed. The result is decided by their elements.</span><button class="btn gold" data-act="close">Close</button>', 'wide');
    let ov = ovEx;
    if (ov && ov.parentNode) ov.innerHTML = html; else { ov = UI.modal(html, { onClose: () => { UI.hatchTick = null; UI.refresh(); } }); }
    UI.hatchTick = () => { const box = $('#eggbox', ov); if (!box || !ov.parentNode) { UI.hatchTick = null; return; } const wasReady = /Hatch!/.test(box.innerHTML); const n = document.createElement('div'); n.innerHTML = eggBox(); const nb = n.firstChild; if (!s.egg) return; const nowReady = /Hatch!/.test(nb.innerHTML); if (nowReady !== wasReady || true) box.replaceWith(nb); };
    return ov;
  };
  UI.act('hatchery', (el) => { const ov = el.closest('.overlay'); if (ov && /Restored/.test(ov.textContent) && !/Hatchery/.test($('.sh-head h2', ov).textContent.replace('Old Hatchery', ''))) UI.close(ov); UI.hatchery(); });
  UI.act('hPick', (el) => {
    const s = st(), i = +el.dataset.i, other = R.inst(s, UI.hSel[1 - i]), parentOv = el.closest('.overlay');
    const list = s.aminas.slice().sort((x, y) => y.lv - x.lv);
    const ov = UI.modal(UI.sheet('Choose parent ' + (i + 1), '<div class="grid">' + list.map((a) => {
      const sp = D.SPECIES[a.sp]; let why = '';
      if (a.lv < D.BREED_MIN_LEVEL) why = 'Lv ' + D.BREED_MIN_LEVEL + ' needed';
      else if (other && other.uid === a.uid) why = 'Already chosen';
      else if (other) { const r = R.recipeFor(sp.el, D.SPECIES[other.sp].el); if (!r) why = 'No match'; else if (r.locked && !s.flags.r2) why = 'Locked pairing'; }
      return '<div class="card ' + (why ? 'dis' : '') + '" data-act="hSet" data-i="' + i + '" data-uid="' + a.uid + '">' + artBox(a.sp) + '<div class="nm">' + esc(sp.name) + '</div><div>' + chip(sp.el) + '</div><div class="lvl">' + (why || 'Lv ' + a.lv) + '</div></div>';
    }).join('') + '</div>', '<button class="btn ghost" data-act="close">Cancel</button>', 'wide'));
    ov._parent = parentOv;
  });
  UI.act('hSet', (el) => { const ov = el.closest('.overlay'), p = ov._parent; UI.hSel[+el.dataset.i] = +el.dataset.uid; UI.close(ov); if (p && p.parentNode) UI.hatchery(p); });
  UI.act('hStart', (el) => {
    const s = st(), ov = el.closest('.overlay'), r = R.startBreed(s, UI.hSel[0], UI.hSel[1]);
    if (!r.ok) { Au.play('no'); return; }
    UI.hSel = [null, null]; S.save(); UI.flush(); UI.renderHud(); UI.hatchery(ov);
  });
  UI.act('hHatch', (el) => {
    const ov = el.closest('.overlay'), r = R.hatch(st());
    if (!r.ok) return; UI.afterAction(); UI.hatchery(ov);
  });
  UI.act('hBook', () => {
    const s = st(), keys = Object.keys(s.recipes || {});
    const total = Object.keys(D.BREED).length + 1, nm = (k) => k.split('+').map((e) => D.ELEMENTS[e].name).join(' + ');
    UI.modal(UI.sheet('Recipe book · ' + keys.length + ' / ' + total, keys.length ? keys.map((k) => '<div class="inst"><div class="art">' + Art.creature(s.recipes[k]) + '</div><div class="grow"><b>' + nm(k) + '</b><br><span class="muted">→ ' + esc(D.SPECIES[s.recipes[k]].name) + '</span></div></div>').join('') + '<p class="muted" style="font-size:.8rem">Some pairings stay hidden until the Dormant Spire wakes. Resonance Aminas pair with anything.</p>' : '<p class="muted">No recipes discovered yet. Hatch an egg to record its recipe.</p>', '<button class="btn gold" data-act="close">Close</button>', 'narrow'));
  });
})(typeof window !== 'undefined' ? window : globalThis);
