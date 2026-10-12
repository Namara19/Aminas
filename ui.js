/* Aminas — UI core. DOM rendering and input; all rules live in rules.js. */
(function (root) {
  'use strict';
  const A = root.A, D = A.Data, R = A.Rules, S = A.State, Art = A.Art, T = A.Story, Au = A.Audio;
  const UI = (A.UI = { queue: [], busy: false, screen: 'title', acts: {}, timers: {}, lastIdle: 0 });
  const $ = (s, r) => (r || document).querySelector(s);
  const st = () => S.state;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (a, b) => Math.max(0, Math.min(100, b ? (a / b) * 100 : 0));
  const I = Art.icon;
  const chip = (el) => '<span class="chip ' + el + '">' + D.ELEMENTS[el].name + '</span>';
  const artBox = (sp, cls) => '<div class="art ' + (cls || '') + '">' + Art.creature(sp) + '</div>';
  const silBox = (sp, cls) => '<div class="art sil ' + (cls || '') + '">' + Art.creature(sp) + '</div>';
  UI.h = { esc, pct, chip, artBox, silBox };

  /* ---------- modal system ---------- */
  UI.modal = function (html, o) {
    o = o || {};
    const ov = document.createElement('div'); ov.className = 'overlay'; ov.innerHTML = html;
    if (o.dismiss !== false) ov.addEventListener('click', (e) => { if (e.target === ov) UI.close(ov); });
    ov._onClose = o.onClose; $('#modal-root').appendChild(ov); return ov;
  };
  UI.close = function (ov) { if (!ov || !ov.parentNode) return; ov.remove(); if (ov._onClose) ov._onClose(); };
  UI.closeAll = () => { const r = $('#modal-root'); while (r.firstChild) UI.close(r.firstChild); };
  UI.modalOpen = () => !!$('#modal-root').firstChild;
  UI.sheet = (title, body, foot, cls) => '<div class="sheet panel ' + (cls || '') + '"><div class="sh-head"><h2>' + title + '</h2><button class="x" data-act="close" aria-label="Close">' + I('close') + '</button></div><div class="sh-body">' + body + '</div>' + (foot ? '<div class="sh-foot">' + foot + '</div>' : '') + '</div>';
  UI.confirm = function (title, text, yesLabel, onYes, danger) {
    const ov = UI.modal(UI.sheet(title, '<p style="margin:.2rem 0">' + text + '</p>', '<button class="btn ghost" data-act="close">Cancel</button><button class="btn ' + (danger ? '' : 'gold') + '" id="cf-yes">' + yesLabel + '</button>', 'narrow'));
    $('#cf-yes', ov).onclick = () => { UI.close(ov); onYes(); };
  };

  /* ---------- toasts / fx ---------- */
  UI.toast = function (text, mood) {
    const r = $('#toast-root'); r.innerHTML = '';
    const d = document.createElement('div'); d.className = 'toast panel';
    d.innerHTML = '<div class="ep">' + Art.entity(mood || 'n') + '</div><div>' + esc(text) + '</div>';
    r.appendChild(d);
    const kill = () => { if (!d.parentNode) return; d.classList.add('out'); setTimeout(() => d.remove(), 300); };
    d.onclick = kill; setTimeout(kill, 3800 + text.length * 45);
  };
  UI.sparkles = function (el, n, colors) {
    const rc = (el || $('#app')).getBoundingClientRect(), app = $('#app').getBoundingClientRect();
    for (let i = 0; i < (n || 12); i++) {
      const s = document.createElement('div'); s.className = 'spark';
      const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 70;
      s.style.cssText = 'left:' + (rc.left - app.left + rc.width / 2) + 'px;top:' + (rc.top - app.top + rc.height / 2) + 'px;background:' + (colors || ['#ffd86b', '#fff', '#ff9ee0', '#8fe6d6'])[i % 4] + ';--dx:' + Math.cos(ang) * dist + 'px;--dy:' + Math.sin(ang) * dist + 'px';
      $('#app').appendChild(s); setTimeout(() => s.remove(), 1000);
    }
  };
  UI.gainFloat = function (el, text, color) {
    const rc = (el || $('#app')).getBoundingClientRect(), app = $('#app').getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'gainf'; f.textContent = text;
    f.style.cssText = 'left:' + (rc.left - app.left + rc.width / 2 - 20) + 'px;top:' + (rc.top - app.top) + 'px;color:' + (color || '#ffd86b');
    $('#app').appendChild(f); setTimeout(() => f.remove(), 1200);
  };
  UI.banner = function (title, sub) {
    const d = document.createElement('div'); d.className = 'banner-fx'; d.innerHTML = '<h1>' + esc(title) + '</h1><p>' + (sub || '') + '</p>';
    $('#app').appendChild(d); setTimeout(() => d.remove(), 2000);
  };
  UI.levelFx = function (inst, from, to, anchor) {
    const sp = D.SPECIES[inst.sp], a = R.statsAt(inst.sp, from), b = R.statsAt(inst.sp, to);
    Au.play('level'); UI.sparkles(anchor, 22);
    UI.banner('LEVEL UP!', esc(sp.name) + ' Lv ' + from + ' → ' + to + ' &nbsp; HP +' + (b.hp - a.hp) + ' · ATK +' + (b.atk - a.atk) + ' · DEF +' + (b.def - a.def));
  };

  /* ---------- dialogue ---------- */
  UI.script = function (lines, done, opts) {
    opts = opts || {};
    const box = document.createElement('div'); box.className = 'dlg';
    box.innerHTML = '<button class="btn small ghost dlg-skip">Skip</button><div class="dlg-box panel"><div class="dlg-por"></div><div><div class="dlg-name"></div><div class="dlg-text"></div></div></div><div class="dlg-next">▼</div>';
    $('#app').appendChild(box);
    let i = -1, typing = false, tm = null, full = '', mood = null;
    const por = $('.dlg-por', box), nm = $('.dlg-name', box), tx = $('.dlg-text', box), nx = $('.dlg-next', box);
    const speed = { fast: 8, normal: 18, slow: 30 }[st().settings.textSpeed] || 18;
    const finish = () => { clearTimeout(tm); box.remove(); if (done) done(); };
    const next = () => {
      i++;
      if (i >= lines.length) return finish();
      const ln = lines[i], narr = ln[0] === '*';
      const m = narr ? (mood || 'n') : ln[0];
      if (m !== mood) { por.innerHTML = Art.entity(m); mood = m; }
      por.classList.toggle('dim', narr); tx.classList.toggle('stage', narr);
      nm.textContent = narr ? '' : (opts.name || 'The Entity');
      full = ln[1]; tx.textContent = ''; typing = true; nx.style.visibility = 'hidden';
      let c = 0;
      const step = () => { c++; tx.textContent = full.slice(0, c); if (c < full.length) tm = setTimeout(step, speed); else { typing = false; nx.style.visibility = 'visible'; } };
      step();
      if (!narr && /\.\.\.|…|—$/.test(ln[1].trim().slice(-2))) Au.play('hum');
    };
    box.addEventListener('click', (e) => {
      if (e.target.closest('.dlg-skip')) return finish();
      if (typing) { clearTimeout(tm); typing = false; tx.textContent = full; nx.style.visibility = 'visible'; } else next();
    });
    next();
  };
  UI.queueBeats = (beats) => { beats.forEach((b) => UI.queue.push(b)); UI.pump(); };
  UI.pump = function () {
    if (UI.busy || UI.screen === 'battle' || UI.screen === 'title') return;
    const b = UI.queue.shift(); if (!b) return;
    if (b.type === 'toast') { UI.toast(b.text, b.mood); return UI.pump(); }
    UI.busy = true;
    const done = () => { UI.busy = false; UI.refresh(); setTimeout(UI.pump, 80); };
    if (b.type === 'script') UI.script(b.lines, done);
    else if (b.type === 'reveal') UI.reveal(b.sp, done);
    else if (b.type === 'fn') b.fn(done);
    else done();
  };
  // Convert the rules' event queue into UI beats + sounds.
  UI.flush = function () {
    const evs = R.drain(), s = st(), batchDisc = {};
    evs.forEach((e) => { if (e.name === 'discover') batchDisc[e.data.sp] = true; });
    let lastToast = null;
    evs.forEach((ev) => {
      const d = ev.data;
      switch (ev.name) {
        case 'restored': Au.play('restore'); break;
        case 'missionReady': Au.play('ok'); break;
        case 'resonance': Au.play('hum'); break;
        case 'dungeonWin': Au.play('win'); break;
        case 'rankUp': UI.banner('RANK ' + d.rank, 'Caretaker rank increased'); Au.play('level'); break;
        case 'discover': if (s.starter && d.sp !== s.starter) { Au.play('discover'); UI.queue.push({ type: 'reveal', sp: d.sp }); } break;
        case 'hatched': Au.play('hatch'); if (!batchDisc[d.sp]) UI.queue.push({ type: 'reveal', sp: d.sp }); break;
        case 'eggStart': Au.play('ok'); break;
      }
      T.beats(s, ev).forEach((b) => { if (b.type === 'toast') lastToast = b; else UI.queue.push(b); });
    });
    if (lastToast) UI.queue.push(lastToast);
    UI.pump();
  };
  UI.afterAction = function () { R.after(st()); S.save(); UI.flush(); UI.refresh(); };

  UI.reveal = function (spId, done) {
    const sp = D.SPECIES[spId];
    const ov = UI.modal('<div class="sheet panel narrow vcard" style="padding:1rem"><h1>New Amina!</h1><div class="art" style="width:9rem;height:9rem;margin:.2rem auto">' + Art.creature(spId) + '</div><h2 style="margin:.2rem 0">' + esc(sp.name) + '</h2><div>' + chip(sp.el) + '</div><p class="muted" style="margin:.5rem 0 .8rem">' + esc(sp.pers) + '</p><button class="btn gold" data-act="close">Welcome, Kind Soul</button></div>', { onClose: done });
    UI.sparkles($('.art', ov), 26); Au.play('discover');
  };

  /* ---------- dispatcher ---------- */
  UI.act = (name, fn) => { UI.acts[name] = fn; };
  UI.act('close', (el) => UI.close(el.closest('.overlay')));
  UI.act('noop', () => {});
  function dispatch(e) {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = UI.acts[el.dataset.act]; if (!fn) return;
    Au.unlock(); Au.play('tap'); fn(el, e);
  }

  /* ---------- screens ---------- */
  function stage() { return $('#stage'); }
  function setScreen(name) { UI.screen = name; Object.values(UI.timers).forEach(clearInterval); UI.timers = {}; }
  function installBanner() {
    const standalone = root.navigator.standalone || (root.matchMedia && root.matchMedia('(display-mode: standalone)').matches);
    if (standalone) return '';
    const ios = /iphone|ipad|ipod/i.test(root.navigator.userAgent);
    if (UI.deferredPrompt) return '<div class="banner">Install Aminas on your device <button class="btn small gold" data-act="installNow">Install</button></div>';
    if (ios) return '<div class="banner">Play full screen: Share <b>⎙</b> → Add to Home Screen <button class="btn small ghost" data-act="installHelp">How</button></div>';
    return '';
  }
  UI.showTitle = function () {
    setScreen('title'); UI.queue.length = 0; UI.busy = false; UI.closeAll();
    const has = S.hasSave();
    stage().innerHTML = '<div class="screen">' + Art.titleBg() + '</div><div class="title-wrap"><div class="logo"><div class="a">AMINAS</div><div class="b">LIGHT <i>&amp;</i> SHADOW</div></div><div class="menu">' +
      (has ? '<button class="btn gold" data-act="continue">Continue</button>' : '') +
      '<button class="btn ' + (has ? '' : 'gold') + '" data-act="newgame">New Game</button><button class="btn ghost" data-act="howto">How to Play</button><button class="btn ghost" data-act="settings">Settings</button></div></div>' +
      installBanner() + '<div class="title-foot">v' + D.VERSION + ' · provisional title · saves on this device only</div>';
    Au.setMode('light');
  };
  UI.act('continue', () => { if (S.load() && st().starter) { UI.showIsland(true); } else UI.act_newgame(); });
  UI.act_newgame = function () { S.newGame(); UI.playIntro(); };
  UI.act('newgame', () => { if (S.hasSave()) UI.confirm('Start a new game?', 'This will erase your current save on this device.', 'Erase and begin', () => UI.act_newgame(), true); else UI.act_newgame(); });
  UI.act('howto', () => UI.modal(UI.sheet('How to Play',
    '<div class="section-t">The loop</div><ol class="steps"><li>Follow <b>The Entity’s</b> missions (top-left on the island). Rewards are claimed in the Missions list.</li><li><b>Restore ruins</b> by tapping them (gold). Restored habitats produce food and gold. Tap them to collect.</li><li><b>Feed</b> your companion to level it up. Starters evolve at level 12.</li><li><b>Explore</b> areas to meet new Aminas and befriend them with food.</li><li>Enter the <b>Overgrown Reliquary</b> with up to three Aminas. Battles are turn-based. Elements matter: Fire&gt;Nature&gt;Water&gt;Fire, Light and Dark counter each other.</li><li>Restore the <b>Old Hatchery</b> to breed Aminas (level 5+) and hatch eggs.</li></ol><p class="muted">Your progress saves automatically on this device. Settings has a backup code.</p>', '<button class="btn gold" data-act="close">Got it</button>', 'narrow')));
  UI.act('installNow', () => { if (UI.deferredPrompt) { UI.deferredPrompt.prompt(); UI.deferredPrompt = null; } });
  UI.act('installHelp', () => UI.modal(UI.sheet('Add to Home Screen (iPhone)', '<ol class="steps"><li>Open this page in <b>Safari</b> (not inside another app).</li><li>Tap the <b>Share</b> button (square with an arrow).</li><li>Scroll and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open <b>Aminas</b> from your Home Screen. It launches full screen and works offline after the first load.</li></ol><p class="muted">Tip: play it once while online so everything is cached.</p>', '<button class="btn gold" data-act="close">OK</button>', 'narrow')));

  /* ---- intro ---- */
  UI.playIntro = function () {
    setScreen('intro'); let i = 0; const cards = T.introCards;
    const draw = () => {
      stage().innerHTML = '<div class="intro"><div class="orb"></div><button class="btn small ghost skip" data-act="introSkip">Skip</button><p>' + esc(cards[i]) + '</p><div class="tapnote">tap to continue</div></div>';
    };
    draw();
    UI.introTap = () => { i++; if (i >= cards.length) UI.arrival(); else draw(); };
  };
  UI.act('introSkip', (el, e) => { e.stopPropagation(); UI.introTap = null; UI.arrival(); });
  document.addEventListener('click', (e) => { if (UI.screen === 'intro' && UI.introTap && !e.target.closest('[data-act]')) UI.introTap(); });

  UI.arrival = function () {
    setScreen('arrival'); st().phase = 'arrival'; S.save(); Au.setMode('light');
    stage().innerHTML = '<div id="scene" class="flicker"></div>'; UI.renderScene();
    setTimeout(() => UI.script(T.scripts.arrival, () => UI.starterSelect()), 500);
  };
  UI.starterSelect = function () {
    const opts = ['lumifern', 'umbrit']; let pick = null;
    const card = (id) => { const s = D.SPECIES[id]; return '<div class="card" data-act="pickStarter" data-id="' + id + '" style="padding:.6rem"><div class="art" style="width:8rem;height:8rem">' + Art.creature(id) + '</div><div class="nm" style="font-size:1.1rem">' + s.name + '</div><div>' + chip(s.el) + '</div><div class="muted" style="font-size:.78rem;margin-top:.3rem">' + esc(s.pers) + '</div></div>'; };
    const ov = UI.modal(UI.sheet('Choose your companion', '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem">' + card('lumifern') + card('umbrit') + '</div><p class="muted center" style="font-size:.8rem;margin:.5rem 0 0">Light and Dark are not good and evil. Both can be kind, and both can be wrong. You will meet the other one eventually.</p>',
      '<span class="muted" id="st-note">Tap one to choose</span><button class="btn gold off" id="st-go">Choose</button>', 'narrow wide'), { dismiss: false });
    ov.querySelector('.x').remove();
    UI.acts.pickStarter = (el) => { pick = el.dataset.id; ov.querySelectorAll('.card').forEach((c) => c.classList.toggle('sel', c === el)); $('#st-go', ov).classList.remove('off'); $('#st-go', ov).textContent = 'Choose ' + D.SPECIES[pick].name; $('#st-note', ov).textContent = D.SPECIES[pick].lore; };
    $('#st-go', ov).onclick = () => {
      if (!pick) return; UI.close(ov);
      const s = st(); s.starter = pick; s.phase = 'play'; R.addAmina(s, pick, 1); R.drain(); S.save(); Au.play('discover');
      UI.showIsland(false); UI.sparkles($('.comp .art'), 20);
      setTimeout(() => UI.script(T.scripts.starterChosen[pick], () => { UI.afterAction(); }), 400);
    };
  };

  /* ---------- island ---------- */
  UI.renderScene = function () { const sc = $('#scene'); if (sc) sc.innerHTML = Art.scene(st()); };
  function navBtn(act, icon, label, extra) { return '<button class="nbtn ' + (extra && extra.cls || '') + '" data-act="' + act + '">' + I(icon) + label + (extra && extra.badge ? '<span class="badge">' + extra.badge + '</span>' : '') + '</button>'; }
  UI.hudHtml = function () {
    const s = st(), a = R.active(s), cm = R.currentMission(s), ready = R.claimable(s), need = D.RANK_NEED(s.rank);
    let h = '<div class="hud-top"><div class="pill rank"><small>CARETAKER RANK ' + s.rank + '</small><div class="bar xp"><i style="width:' + pct(s.rankXp, need) + '%"></i></div></div>' +
      '<div class="pill res"><span class="gold" id="r-gold">' + I('gold') + '<b>' + s.res.gold + '</b></span><span class="food" id="r-food">' + I('food') + '<b>' + s.res.food + '</b></span><span class="gems" id="r-gems">' + I('gem') + '<b>' + s.res.gems + '</b></span></div>' +
      '<button class="round" data-act="ask" aria-label="Ask The Entity">' + I('chat') + '</button><button class="round" data-act="settings" aria-label="Settings">' + I('gear') + '</button></div>';
    if (cm) {
      const rdy = R.missionStatus(s, cm) === 'ready';
      h += '<button class="pill mission-pill ' + (rdy ? 'ready' : '') + '" data-act="missions"><b>' + (rdy ? 'Ready to claim' : 'Current task') + '</b>' + esc(cm.title) + '<span style="font-weight:600;color:#e8e0ff;font-size:.74rem">' + esc(rdy ? 'Open Missions to claim your reward.' : cm.hint) + '</span></button>';
    } else if (s.flags.arcDone) h += '<button class="pill mission-pill" data-act="missions"><b>Chapter One complete</b>Sanctuary tasks remain</button>';
    if (a) {
      const sp = D.SPECIES[a.sp], need2 = R.xpNeed(a.lv), cm_ = cm && cm.id === 'm_feed';
      h += '<div class="comp panel"><div class="art" data-act="detail" data-sp="' + a.sp + '">' + Art.creature(a.sp) + '</div><div class="nm">' + esc(sp.name) + ' ' + chip(sp.el) + '</div><div><div class="bar xp"><i style="width:' + (a.lv >= D.MAX_LEVEL ? 100 : pct(a.xp, need2)) + '%"></i></div><div class="xpl"><span>Lv ' + a.lv + '</span><span>' + (a.lv >= D.MAX_LEVEL ? 'MAX' : a.xp + ' / ' + need2 + ' xp') + '</span></div></div>' +
        '<div class="row"><button class="btn small gold ' + (cm_ ? 'pulse' : '') + '" data-act="feed" data-kind="snack">' + I('food') + 'Snack ' + D.SNACKS.snack.food + '</button><button class="btn small" data-act="feed" data-kind="feast">Feast ' + D.SNACKS.feast.food + '</button></div></div>';
    }
    const eggReady = s.egg && R.eggStatus(s).ready;
    h += '<div class="nav">' + navBtn('collection', 'paw', 'Creatures') + navBtn('missions', 'scroll', 'Tasks', { badge: ready || '' }) + navBtn('explore', 'compass', 'Explore') + navBtn('dungeons', 'gate', 'Dungeon') + navBtn('hatchery', 'egg', 'Hatchery', { cls: s.struct.hatchery ? '' : 'locked', badge: eggReady ? '!' : '' }) + '</div>';
    return h;
  };
  UI.renderHud = function () { const h = $('#hud'); if (h) h.innerHTML = UI.hudHtml(); };
  UI.refresh = function () { if (UI.screen === 'island') { UI.renderHud(); UI.renderScene(); } };
  UI.showIsland = function (resumed) {
    setScreen('island'); UI.closeAll();
    stage().innerHTML = '<div id="scene"></div><div class="hud" id="hud"></div>';
    Au.setMode('light'); R.tickHabitats(st()); UI.renderScene(); UI.renderHud();
    const stg = stage();
    stg.onclick = (e) => {
      const t = e.target.closest('[data-struct],[data-hit]'); if (!t || UI.screen !== 'island' || UI.busy) return;
      Au.unlock(); UI.sceneTap(t);
    };
    UI.timers.tick = setInterval(UI.tick, 1000);
    UI.timers.scene = setInterval(() => { if (!UI.modalOpen() && !UI.busy && UI.screen === 'island') { R.tickHabitats(st()); UI.renderScene(); } }, 15000);
    if (st().pendingR2) R.awakenSpire(st());
    UI.afterAction();
    if (resumed && !UI.queue.length && Date.now() - UI.lastIdle > 60000 && Math.random() < 0.6) { UI.lastIdle = Date.now(); UI.toast(T.pick(st(), 'idle'), 'n'); }
  };
  UI.tick = function () {
    const s = st(); if (UI.screen !== 'island') return;
    const e = s.egg && R.eggStatus(s);
    if (e && e.ready && !UI.eggNotified) { UI.eggNotified = true; UI.renderHud(); UI.toast('Something in the Hatchery is making noises. I’d look into it. Quietly.', 'a'); Au.play('ok'); }
    if (!s.egg) UI.eggNotified = false;
    if (UI.hatchTick) UI.hatchTick();
  };

  UI.sceneTap = function (t) {
    const s = st();
    if (t.dataset.struct) return UI.structPanel(t.dataset.struct);
    switch (t.dataset.hit) {
      case 'companion': { const a = R.active(s); if (a) UI.detail(a.sp, { uid: a.uid }); break; }
      case 'disturbance': { const r = R.investigate(s); if (r.ok) { UI.afterAction(); } break; }
      case 'stones': UI.toast('The stones are quiet now. Politely, almost. I wouldn’t trust it.', 'a'); break;
      case 'stone': {
        const r = R.examineStone(s);
        if (r.ok) UI.afterAction(); else UI.toast('Still humming. Only when you’re near it. Funny, that.', 'a');
        break;
      }
      case 'mark': UI.toast(T.pick(s, 'arrivalMark'), 'a'); break;
      case 'plot': UI.toast(T.pick(s, 'future'), 'w'); break;
    }
  };

  /* ---- feeding ---- */
  UI.doFeed = function (uid, kind, anchor) {
    const s = st(), inst = R.inst(s, uid); if (!inst) return null;
    const before = inst.lv, spBefore = inst.sp;
    const r = R.feed(s, uid, kind);
    if (!r.ok) {
      Au.play('no');
      if (r.reason === 'food') UI.gainFloat(anchor, 'Not enough food', '#ff9b8c');
      if (r.reason === 'max') UI.toast('Maximum level. There is nothing left to eat that will help. Not that it will stop them.', 't');
      UI.afterAction(); return r;
    }
    Au.play('feed'); UI.sparkles(anchor || $('.comp .art'), 8);
    UI.gainFloat(anchor, '+' + r.xp + ' xp', '#fff0a8');
    if (r.levels.length) UI.levelFx(inst, before, inst.lv, anchor || $('.comp .art'));
    S.save(); UI.flush(); UI.refresh();
    return r;
  };
  UI.act('feed', (el) => { const a = R.active(st()); if (a) UI.doFeed(a.uid, el.dataset.kind, el); });

  /* ---- structure panel ---- */
  function reqText(req) {
    if (!req) return '';
    if (req.struct) return 'Restore the ' + D.STRUCTURES[req.struct].name + ' first.';
    if (req.flag === 'r1') return 'Investigate the Resonance disturbance first.';
    if (req.flag === 'r2') return 'Something big has to wake up first.';
    if (req.rank) return 'Reach Caretaker Rank ' + req.rank + '.';
    return '';
  }
  UI.reqText = reqText;
  UI.structPanel = function (id, ovExisting) {
    const s = st(), d = D.STRUCTURES[id], state = R.structState(s, id);
    let body = '<p style="margin:.1rem 0 .5rem">' + esc(d.desc) + '</p>', foot = '';
    if (state === 'hidden') body += '<p class="muted"><b>Locked.</b> ' + esc(reqText(d.req)) + '</p>';
    else if (state === 'available') {
      const ok = s.res.gold >= d.cost;
      body += '<div class="kv"><b>Cost:</b> ' + I('gold') + ' ' + d.cost + ' gold &nbsp; <span class="' + (ok ? 'good' : 'bad') + '">' + (ok ? 'You can afford this.' : 'Need ' + (d.cost - s.res.gold) + ' more gold.') + '</span></div>';
      foot = '<button class="btn ghost" data-act="close">Not yet</button><button class="btn gold ' + (ok ? '' : 'off') + '" data-act="restore" data-id="' + id + '">Restore</button>';
    } else {
      body += '<p class="good" style="margin:.1rem 0 .4rem"><b>Restored.</b></p>';
      if (d.kind === 'habitat') {
        R.tickHabitats(s);
        const res = R.residentOf(s, id), per = R.perTick(s, id), stock = R.stockOf(s, id);
        body += '<div class="kv"><b>Resident:</b> ' + (res ? esc(D.SPECIES[res.sp].name) + ' Lv ' + res.lv + (id === 'hollow' ? ' (your companion)' : '') : 'nobody yet') + '</div>';
        body += '<div class="kv"><b>Produces:</b> ' + (per ? per.toFixed(1) + ' ' + d.produces + ' / min' : '—') + (d.affinity.length ? ' <span class="muted">(+50% if the resident is ' + d.affinity.map((e) => D.ELEMENTS[e].name).join(' or ') + ')</span>' : '') + '</div>';
        body += '<div class="kv"><b>Ready to collect:</b> ' + stock + ' ' + d.produces + '</div>';
        foot = (id !== 'hollow' ? '<button class="btn ghost" data-act="assignPick" data-id="' + id + '">' + (res ? 'Change resident' : 'Choose resident') + '</button>' : '') + '<button class="btn gold ' + (stock >= 1 ? '' : 'off') + '" data-act="collect" data-id="' + id + '">Collect</button>';
      } else if (id === 'hatchery') foot = '<button class="btn gold" data-act="hatchery">Open Hatchery</button>';
      else if (id === 'reliquarygate') foot = '<button class="btn gold" data-act="dungeons">Open Dungeons</button>';
    }
    const html = UI.sheet(esc(d.name), body, foot, 'narrow');
    if (ovExisting && ovExisting.parentNode) { ovExisting.innerHTML = html; return ovExisting; }
    return UI.modal(html);
  };
  UI.act('restore', (el) => {
    const r = R.restore(st(), el.dataset.id), ov = el.closest('.overlay');
    if (!r.ok) { Au.play('no'); return; }
    UI.close(ov); UI.afterAction();
    UI.sparkles($('#scene'), 24);
  });
  UI.act('collect', (el) => {
    const r = R.collect(st(), el.dataset.id), ov = el.closest('.overlay');
    if (r.ok) { Au.play('ok'); UI.gainFloat(el, '+' + r.n + ' ' + r.kind, '#fff'); S.save(); UI.flush(); UI.renderHud(); UI.structPanel(el.dataset.id, ov); }
  });
  UI.act('assignPick', (el) => {
    const id = el.dataset.id, s = st(), ovParent = el.closest('.overlay');
    const list = s.aminas.filter((a) => a.uid !== s.active);
    if (!list.length) { UI.toast('You need a second Amina to live here. Explore the meadow.', 't'); return; }
    const hab = D.STRUCTURES[id];
    const ov = UI.modal(UI.sheet('Choose a resident for the ' + esc(hab.name), '<div class="grid">' + list.map((a) => { const sp = D.SPECIES[a.sp], fits = hab.affinity.indexOf(sp.el) >= 0; return '<div class="card" data-act="assign" data-id="' + id + '" data-uid="' + a.uid + '">' + artBox(a.sp) + '<div class="nm">' + esc(sp.name) + '</div><div>' + chip(sp.el) + '</div><div class="lvl">Lv ' + a.lv + (fits ? ' · +50%' : '') + '</div></div>'; }).join('') + '</div>', '<button class="btn ghost" data-act="assignClear" data-id="' + id + '">Leave empty</button>', 'narrow'));
    ov._parent = ovParent;
  });
  UI.act('assign', (el) => { const ov = el.closest('.overlay'); R.assign(st(), el.dataset.id, +el.dataset.uid); S.save(); const p = ov._parent; UI.close(ov); if (p && p.parentNode) UI.structPanel(el.dataset.id, p); UI.renderScene(); });
  UI.act('assignClear', (el) => { const ov = el.closest('.overlay'); R.assign(st(), el.dataset.id, null); S.save(); const p = ov._parent; UI.close(ov); if (p && p.parentNode) UI.structPanel(el.dataset.id, p); UI.renderScene(); });

  /* ---- collection & detail ---- */
  UI.collection = function (ovEx) {
    const s = st();
    const cards = D.ROSTER.map((sp) => {
      const status = R.status(s, sp.id), mine = s.aminas.filter((a) => a.sp === sp.id), top = mine.reduce((m, a) => Math.max(m, a.lv), 0);
      if (status === 'unknown') return '<div class="card unknown" data-act="detail" data-sp="' + sp.id + '">' + silBox(sp.id) + '<div class="nm">???</div><div class="lvl">Undiscovered</div></div>';
      return '<div class="card" data-act="detail" data-sp="' + sp.id + '">' + (status === 'seen' ? silBox(sp.id) : artBox(sp.id)) + (mine.length > 1 ? '<span class="cnt">×' + mine.length + '</span>' : '') + '<div class="nm">' + esc(sp.name) + '</div><div>' + chip(sp.el) + '</div><div class="lvl">' + (status === 'owned' ? (top ? 'Lv ' + top : 'Befriended') : 'Sighted') + '</div></div>';
    }).join('');
    const html = UI.sheet('Creature Collection · ' + R.ownedCount(s) + ' / ' + D.ROSTER.length, '<div class="grid">' + cards + '</div>', '<span class="muted" style="margin-right:auto;font-size:.8rem">Tap any entry. Undiscovered entries tell you how to find them.</span><button class="btn gold" data-act="close">Close</button>', 'wide');
    if (ovEx && ovEx.parentNode) { const sc = $('.sh-body', ovEx).scrollTop; ovEx.innerHTML = html; $('.sh-body', ovEx).scrollTop = sc; return ovEx; }
    return UI.modal(html);
  };
  UI.act('collection', () => UI.collection());

  UI.effLines = function (el) {
    const strong = D.STRONG[el] || [], weak = Object.keys(D.STRONG).filter((k) => D.STRONG[k].indexOf(el) >= 0);
    return '<div class="kv"><b>Strong against:</b> ' + (strong.length ? strong.map((x) => D.ELEMENTS[x].name).join(', ') : '—') + ' &nbsp; <b>Weak to:</b> ' + (weak.length ? weak.map((x) => D.ELEMENTS[x].name).join(', ') : '—') + '</div>';
  };
  UI.detail = function (spId, o) {
    o = o || {}; const s = st();
    let inst = o.uid ? R.inst(s, o.uid) : null; if (inst) spId = inst.sp;
    const sp = D.SPECIES[spId], status = R.status(s, spId), mine = s.aminas.filter((a) => a.sp === spId);
    if (!inst && mine.length) inst = mine.slice().sort((a, b) => b.lv - a.lv)[0];
    let body;
    if (status === 'unknown') {
      body = '<div class="detail"><div class="big sil art">' + Art.creature(spId) + '</div><div><h2>???</h2><div class="kv"><b>How to find it:</b> ' + esc(sp.find) + '</div><p class="muted" style="font-size:.85rem">You have not met this Amina yet.</p></div></div>';
    } else if (status === 'seen') {
      body = '<div class="detail"><div class="big sil art">' + Art.creature(spId) + '</div><div><h2>' + esc(sp.name) + ' ' + chip(sp.el) + '</h2><p class="muted">Sighted, but not yet befriended.</p><div class="kv"><b>How to find it:</b> ' + esc(sp.find) + '</div>' + UI.effLines(sp.el) + '</div></div>';
    } else {
      const lv = inst.lv, stt = R.statsAt(spId, lv), next = lv < D.MAX_LEVEL ? R.statsAt(spId, lv + 1) : stt;
      const evo = sp.evo ? 'Evolves into <b>' + (s.owned[sp.evo.to] ? D.SPECIES[sp.evo.to].name : '???') + '</b> at level ' + sp.evo.lv : (sp.stage === 2 ? 'Fully evolved form' : 'Does not evolve');
      body = '<div class="detail"><div class="big art">' + Art.creature(spId) + '</div><div><h2>' + esc(sp.name) + ' ' + chip(sp.el) + '</h2>' +
        '<div class="stats">' + [['HP', 'hp'], ['ATK', 'atk'], ['DEF', 'def'], ['SPD', 'spd']].map((k) => '<div class="stat">' + k[0] + '<b>' + stt[k[1]] + '</b>' + (lv < D.MAX_LEVEL ? '<em>+' + (next[k[1]] - stt[k[1]]) + '</em>' : '') + '</div>').join('') + '</div>' +
        '<div class="kv"><b>Personality:</b> ' + esc(sp.pers) + '</div><div class="kv">' + esc(sp.lore) + '</div>' + UI.effLines(sp.el) +
        sp.abil.map((id) => { const ab = D.ABILITIES[id]; return '<div class="abil"><b>' + ab.name + '</b> ' + chip(ab.el) + ' <span class="muted">' + (ab.power ? 'Power ' + ab.power : 'Utility') + (ab.cd ? ' · every ' + (ab.cd + 1) + ' turns' : '') + '</span><br>' + esc(ab.desc) + '</div>'; }).join('') +
        '<div class="kv"><b>Evolution:</b> ' + evo + '</div><div class="kv"><b>Found:</b> ' + esc(sp.find) + '</div><div class="entnote"><div class="ep">' + Art.entity('n') + '</div><div>“' + esc(sp.ent) + '”</div></div></div></div>';
      body += '<div class="section-t">Your ' + esc(sp.name) + (mine.length > 1 ? 's' : '') + '</div>' + mine.map((a) => {
        const need = R.xpNeed(a.lv), isAct = a.uid === s.active;
        return '<div class="inst"><div class="art">' + Art.creature(a.sp) + '</div><div class="grow"><b>Lv ' + a.lv + '</b> ' + (isAct ? '<span class="chip light">Companion</span>' : '') + '<div class="bar xp" style="margin-top:.2rem"><i style="width:' + (a.lv >= D.MAX_LEVEL ? 100 : pct(a.xp, need)) + '%"></i></div><span class="muted" style="font-size:.7rem">' + (a.lv >= D.MAX_LEVEL ? 'MAX' : a.xp + ' / ' + need + ' xp') + '</span></div>' +
          '<button class="btn small gold" data-act="detailFeed" data-uid="' + a.uid + '" data-kind="snack">Snack ' + D.SNACKS.snack.food + '</button><button class="btn small" data-act="detailFeed" data-uid="' + a.uid + '" data-kind="feast">Feast ' + D.SNACKS.feast.food + '</button>' + (isAct ? '' : '<button class="btn small ghost" data-act="makeActive" data-uid="' + a.uid + '">Companion</button>') + '</div>';
      }).join('');
    }
    const html = UI.sheet(esc(status === 'unknown' ? 'Undiscovered Amina' : sp.name), body, '<button class="btn gold" data-act="close">Close</button>', 'wide');
    if (o.ov && o.ov.parentNode) { const sc = $('.sh-body', o.ov).scrollTop; o.ov.innerHTML = html; $('.sh-body', o.ov).scrollTop = sc; o.ov._sp = spId; return o.ov; }
    const ov = UI.modal(html, { onClose: () => UI.refresh() }); ov._sp = spId; ov._detail = true; return ov;
  };
  UI.act('detail', (el) => UI.detail(el.dataset.sp));
  UI.act('detailFeed', (el) => {
    const ov = el.closest('.overlay'), uid = +el.dataset.uid;
    UI.doFeed(uid, el.dataset.kind, el);
    const inst = R.inst(st(), uid); if (inst) UI.detail(inst.sp, { uid, ov });
    const col = [...$('#modal-root').children].find((x) => x !== ov && $('.sh-head h2', x) && /Collection/.test($('.sh-head h2', x).textContent)); if (col) UI.collection(col);
  });
  UI.act('makeActive', (el) => {
    const ov = el.closest('.overlay'), uid = +el.dataset.uid; R.setActive(st(), uid); S.save(); Au.play('ok');
    UI.detail(R.inst(st(), uid).sp, { uid, ov }); UI.refresh();
  });

  /* ---- missions ---- */
  UI.missions = function (ovEx) {
    const s = st();
    const row = (m) => {
      const status = R.missionStatus(s, m), [c, t] = R.progress(s, m), rw = m.reward;
      const rewards = ['gold', 'food', 'gems'].filter((k) => rw[k]).map((k) => '<span>' + I(k) + ' ' + rw[k] + '</span>').join('');
      return '<div class="mrow ' + (status === 'ready' ? 'ready' : status === 'claimed' ? 'done' : '') + '"><div><h3>' + esc(m.title) + (status === 'claimed' ? ' ✓' : '') + '</h3><p>' + esc(m.desc) + '</p>' + (status === 'active' && m.hint ? '<div class="hint">Hint: ' + esc(m.hint) + '</div>' : '') +
        (status !== 'claimed' ? '<div class="bar xp" style="margin:.3rem 0;max-width:14rem"><i style="width:' + pct(Math.min(c, t), t) + '%"></i></div><span class="muted" style="font-size:.72rem">' + Math.min(c, t) + ' / ' + t + '</span> ' : '') + '<div class="rw">' + rewards + '</div></div>' +
        (status === 'ready' ? '<button class="btn gold" data-act="claim" data-id="' + m.id + '">Claim</button>' : status === 'claimed' ? '' : '<span class="muted" style="font-size:.75rem">In progress</span>') + '</div>';
    };
    const vis = (m) => R.missionStatus(s, m) !== 'locked';
    const story = D.MISSIONS.filter((m) => !m.side && vis(m) && s.missions[m.id] !== 'claimed'), side = D.MISSIONS.filter((m) => m.side && vis(m) && s.missions[m.id] !== 'claimed');
    const done = D.MISSIONS.filter((m) => s.missions[m.id] === 'claimed');
    const body = '<div class="section-t">The Entity’s tasks</div>' + (story.map(row).join('') || '<p class="muted">Chapter One is complete.</p>') + (side.length ? '<div class="section-t">Sanctuary tasks</div>' + side.map(row).join('') : '') + (done.length ? '<div class="section-t">Completed</div>' + done.map(row).join('') : '');
    const html = UI.sheet('Missions', body, '<button class="btn gold" data-act="close">Close</button>', '');
    if (ovEx && ovEx.parentNode) { const sc = $('.sh-body', ovEx).scrollTop; ovEx.innerHTML = html; $('.sh-body', ovEx).scrollTop = sc; return ovEx; }
    return UI.modal(html);
  };
  UI.act('missions', () => UI.missions());
  UI.act('claim', (el) => {
    const ov = el.closest('.overlay'), r = R.claim(st(), el.dataset.id);
    if (!r.ok) return; Au.play('ok'); UI.sparkles(el, 14);
    UI.afterAction(); if (ov.parentNode) UI.missions(ov);
  });

  /* ---- explore ---- */
  UI.exArea = 'meadow';
  UI.explore = function (ovEx) {
    const s = st(), a = D.AREAS[UI.exArea], unlocked = R.areaUnlocked(s, UI.exArea);
    const tabs = D.AREA_ORDER.map((id) => { const u = R.areaUnlocked(s, id); return '<button class="tab ' + (id === UI.exArea ? 'on' : '') + (u ? '' : ' lock') + '" data-act="exTab" data-id="' + id + '">' + (u ? I('compass') : I('lock')) + esc(D.AREAS[id].name) + '</button>'; }).join('');
    const finds = a.steps.filter((x) => x[0] === 'find').map((x) => x[1]);
    const resid = finds.map((id) => '<div class="mini">' + (s.owned[id] ? artBox(id) : s.seen[id] ? silBox(id) : silBox(id)) + (s.owned[id] ? esc(D.SPECIES[id].name) : s.seen[id] ? esc(D.SPECIES[id].name) + '?' : '???') + '</div>').join('');
    let main;
    if (!unlocked) main = '<div class="areacard"><h2>' + esc(a.name) + '</h2><p class="muted">' + esc(a.blurb) + '</p><p><b>Locked.</b> ' + esc(UI.reqText(a.unlock)) + '</p></div>';
    else main = '<div class="areacard"><h2>' + esc(a.name) + '</h2><p class="muted" style="margin:.2rem 0">' + esc(a.blurb) + '</p><div class="muted" style="font-size:.78rem">Residents · ' + finds.filter((x) => s.owned[x]).length + ' / ' + finds.length + ' befriended</div><div class="res-list">' + resid + '</div>' +
      (s.pendingFind ? '<div class="result">Something is waiting for you. <button class="btn small gold" data-act="openFind">Meet it</button></div>' : '') +
      '<button class="btn gold" data-act="doExplore">' + I('compass') + ' Explore</button><div id="ex-result">' + (UI.exMsg || '') + '</div></div>';
    const html = UI.sheet('Explore', '<div class="explore"><div class="tabs">' + tabs + '</div>' + main + '</div>', '<span class="muted" style="margin-right:auto;font-size:.78rem">Befriending an Amina costs ' + D.BEFRIEND_COST + ' food. Exploring is free.</span><button class="btn gold" data-act="close">Close</button>', 'wide');
    if (ovEx && ovEx.parentNode) { ovEx.innerHTML = html; return ovEx; }
    UI.exMsg = ''; return UI.modal(html, { onClose: () => UI.refresh() });
  };
  UI.act('explore', () => UI.explore());
  UI.act('exTab', (el) => { UI.exArea = el.dataset.id; UI.exMsg = ''; UI.explore(el.closest('.overlay')); });
  UI.act('doExplore', (el) => {
    const ov = el.closest('.overlay'), r = R.explore(st(), UI.exArea);
    if (!r.ok) { Au.play('no'); return; }
    if (r.type === 'res') {
      UI.exMsg = '<div class="result">' + (r.note === 'known' ? 'You find a trail of familiar tracks and a few coins. ' : 'You gather supplies: ') + I('gold') + ' ' + r.gold + (r.food ? ' &nbsp; ' + I('food') + ' ' + r.food : '') + '</div>'; Au.play('ok');
      S.save(); R.after(st()); UI.flush(); UI.refresh(); UI.explore(ov);
    } else {
      Au.play('discover'); S.save(); UI.flush(); UI.explore(ov); UI.findModal(ov);
    }
  });
  UI.act('openFind', (el) => UI.findModal(el.closest('.overlay')));
  UI.findModal = function (parentOv) {
    const s = st(), f = s.pendingFind; if (!f) return; const sp = D.SPECIES[f.sp];
    const ov = UI.modal('<div class="sheet panel narrow vcard" style="padding:1rem"><h1 style="font-size:1.4rem">Something rustles…</h1><div class="art" style="width:8rem;height:8rem;margin:.2rem auto">' + Art.creature(f.sp) + '</div><h2>' + esc(sp.name) + '</h2><div>' + chip(sp.el) + '</div><p class="muted" style="margin:.4rem 0">' + esc(sp.pers) + '</p><div class="row-actions" style="justify-content:center"><button class="btn ghost" data-act="close">Not now</button><button class="btn gold ' + (s.res.food >= D.BEFRIEND_COST ? '' : 'off') + '" data-act="befriend">Offer ' + D.BEFRIEND_COST + ' food</button></div>' + (s.res.food >= D.BEFRIEND_COST ? '' : '<p class="bad" style="font-size:.8rem">You need ' + (D.BEFRIEND_COST - s.res.food) + ' more food. It will wait.</p>') + '</div>');
    ov._parent = parentOv;
  };
  UI.act('befriend', (el) => {
    const ov = el.closest('.overlay'), parent = ov._parent, r = R.befriend(st());
    if (!r.ok) { Au.play('no'); return; }
    ov._onClose = null; ov.remove(); UI.exMsg = '';
    UI.afterAction(); if (parent && parent.parentNode) UI.explore(parent);
  });

  /* ---- Ask The Entity ---- */
  UI.ask = function () {
    const s = st(); const topics = Object.keys(T.ask).filter((k) => !T.ask[k].gate || T.ask[k].gate(s));
    const ov = UI.modal(UI.sheet('Ask The Entity', '<div style="display:grid;grid-template-columns:7rem 1fr;gap:.8rem;align-items:start"><div style="width:7rem;height:7rem" id="ask-por">' + Art.entity('t') + '</div><div><div id="ask-say" class="panel" style="padding:.6rem .8rem;min-height:5rem;font-size:.95rem;line-height:1.4">“Hm? Yes? I’m very busy. Ask.”</div><div class="row-actions" style="margin-top:.6rem">' + topics.map((k) => '<button class="btn small" data-act="askTopic" data-k="' + k + '">' + esc(T.ask[k].label) + '</button>').join('') + '</div></div></div>', '<button class="btn gold" data-act="close">Thanks</button>', 'narrow wide'));
    ov._ask = true;
  };
  UI.act('ask', () => UI.ask());
  UI.act('askTopic', (el) => {
    const ov = el.closest('.overlay'), k = el.dataset.k, r = T.askLines(st(), k);
    if (r.lines) { UI.close(ov); UI.script(r.lines, () => S.save()); }
    else { $('#ask-say', ov).textContent = '“' + r.text + '”'; $('#ask-por', ov).innerHTML = Art.entity(['n', 'w', 't', 'a'][Math.floor(Math.random() * 4)]); S.save(); }
    if (k === 'you' && T.ask.you.slipAfter && st().story.asked.you === T.ask.you.slipAfter && !st().story.used.once_askslip) {
      st().story.used.once_askslip = [1]; setTimeout(() => { UI.close(ov); UI.script([['a', 'You know… I keep asking myself the same question.'], ['t', 'Never mind. Ask me something simpler. The weather. The tide.']], () => {}); }, 900);
    }
  });

  /* ---- Settings ---- */
  UI.settings = function (ovEx) {
    const s = st().settings, has = !!st().starter;
    const tog = (k, label) => '<div class="toggle"><span>' + label + '</span><button class="sw ' + (s[k] ? 'on' : '') + '" data-act="setPref" data-k="' + k + '" aria-label="' + label + '"></button></div>';
    const body = tog('music', 'Music') + tog('sfx', 'Sound effects') +
      '<div class="toggle"><span>Egg timer</span><span class="seg"><button class="' + (s.eggSpeed === 'fast' ? 'on' : '') + '" data-act="setSeg" data-k="eggSpeed" data-v="fast">20 sec (test)</button><button class="' + (s.eggSpeed === 'normal' ? 'on' : '') + '" data-act="setSeg" data-k="eggSpeed" data-v="normal">5 min</button></span></div>' +
      '<div class="toggle"><span>Text speed</span><span class="seg">' + ['slow', 'normal', 'fast'].map((v) => '<button class="' + (s.textSpeed === v ? 'on' : '') + '" data-act="setSeg" data-k="textSpeed" data-v="' + v + '">' + v + '</button>').join('') + '</span></div>' +
      '<div class="row-actions">' + (has ? '<button class="btn small" data-act="saveNow">Save now</button>' : '') + '<button class="btn small" data-act="backup">Backup / restore code</button><button class="btn small" data-act="installHelp">Add to Home Screen</button>' + (UI.deferredPrompt ? '<button class="btn small gold" data-act="installNow">Install app</button>' : '') + '<button class="btn small ghost" data-act="howto">How to play</button></div>' +
      '<div class="section-t">Danger zone</div><button class="btn small" style="background:#8a2a3a" data-act="resetAsk">Reset all progress</button><p class="muted" style="font-size:.75rem">Progress saves automatically on this device. Clearing Safari website data erases it, so keep a backup code if you care.</p>' +
      '<p class="muted center" style="font-size:.7rem" data-act="verTap">Aminas: Light &amp; Shadow v' + D.VERSION + ' · offline · no ads, no tracking</p>';
    const html = UI.sheet('Settings', body, (has ? '<button class="btn ghost" data-act="toTitle">Title screen</button>' : '') + '<button class="btn gold" data-act="close">Close</button>', 'narrow');
    if (ovEx && ovEx.parentNode) { ovEx.innerHTML = html; return ovEx; }
    return UI.modal(html);
  };
  UI.act('settings', () => UI.settings());
  UI.act('setPref', (el) => { const s = st().settings; s[el.dataset.k] = !s[el.dataset.k]; Au.setPrefs(s); S.save(); Au.unlock(); UI.settings(el.closest('.overlay')); });
  UI.act('setSeg', (el) => { st().settings[el.dataset.k] = el.dataset.v; S.save(); UI.settings(el.closest('.overlay')); });
  UI.act('saveNow', (el) => { S.save(); UI.gainFloat(el, 'Saved', '#8cffa0'); });
  UI.act('toTitle', () => { S.save(); UI.showTitle(); });
  UI.act('resetAsk', () => UI.confirm('Reset all progress?', 'Your island, Aminas, resources and story progress on this device will be erased. This cannot be undone.', 'Yes, erase everything', () => { UI.closeAll(); S.reset(); Au.setPrefs(st().settings); UI.showTitle(); }, true));
  UI.act('backup', () => {
    const ov = UI.modal(UI.sheet('Backup code', '<p class="muted" style="margin:0 0 .3rem;font-size:.82rem">Copy this code somewhere safe. Paste a code below and tap Restore to load a save.</p><textarea class="code" id="bk-code" readonly></textarea><div class="row-actions"><button class="btn small gold" data-act="copyCode">Copy</button></div><div class="section-t">Restore from code</div><textarea class="code" id="bk-in" placeholder="Paste a code starting with AMINAS1:"></textarea><div class="row-actions"><button class="btn small" id="bk-go">Restore</button><span id="bk-msg" class="muted" style="font-size:.8rem"></span></div>', '<button class="btn gold" data-act="close">Close</button>', 'narrow'));
    $('#bk-code', ov).value = st().starter ? S.exportCode() : 'Start a game first.';
    $('#bk-go', ov).onclick = () => { if (S.importCode($('#bk-in', ov).value)) { UI.closeAll(); UI.showIsland(false); } else $('#bk-msg', ov).textContent = 'That code did not work.'; };
  });
  UI.act('copyCode', (el) => { const ta = $('#bk-code', el.closest('.overlay')); ta.select(); try { (root.navigator.clipboard ? root.navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => UI.gainFloat(el, 'Copied', '#8cffa0'), () => document.execCommand && document.execCommand('copy')); } catch (e) { try { document.execCommand('copy'); } catch (e2) {} } });
  let verTaps = 0, verT = 0;
  UI.act('verTap', () => { verTaps++; clearTimeout(verT); verT = setTimeout(() => (verTaps = 0), 2000); if (verTaps >= 7) { verTaps = 0; UI.devPanel(); } });
  UI.devPanel = function () {
    if (!st().starter) return;
    UI.modal(UI.sheet('Developer testing panel', '<p class="muted" style="font-size:.8rem">Testing shortcuts. Nothing here runs unless you tap it. Reset the save from Settings to clear their effects.</p><div class="row-actions"><button class="btn small" data-act="dev" data-k="res">+500 gold, +200 food, +20 gems</button><button class="btn small" data-act="dev" data-k="lv">Companion +1 level</button><button class="btn small" data-act="dev" data-k="egg">Finish egg now</button><button class="btn small" data-act="dev" data-k="rank">+1 rank</button><button class="btn small" data-act="dev" data-k="all">Befriend every Amina (Lv 5)</button></div>', '<button class="btn gold" data-act="close">Close</button>', 'narrow'));
  };
  UI.act('dev', (el) => {
    const s = st(), k = el.dataset.k;
    if (k === 'res') R.addRes(s, { gold: 500, food: 200, gems: 20 });
    if (k === 'lv') { const a = R.active(s); if (a && a.lv < D.MAX_LEVEL) R.addXp(s, a, R.xpNeed(a.lv) - a.xp); }
    if (k === 'egg' && s.egg) s.egg.readyAt = Date.now() - 1;
    if (k === 'rank') R.gainRankXp(s, D.RANK_NEED(s.rank) - s.rankXp);
    if (k === 'all') D.ROSTER.forEach((sp) => { if (!s.owned[sp.id]) R.addAmina(s, sp.id, 5); });
    s.flags.dev = true; Au.play('ok'); UI.afterAction();
  });

  /* ---------- boot ---------- */
  UI.boot = function () {
    S.load(); Au.setPrefs(st().settings);
    document.addEventListener('click', dispatch);
    document.addEventListener('pointerdown', () => Au.unlock(), { once: true });
    const save = () => { if (st().starter) S.save(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    root.addEventListener('pagehide', save); root.addEventListener('beforeunload', save);
    UI.showTitle();
  };
})(typeof window !== 'undefined' ? window : globalThis);
