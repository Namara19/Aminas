/* Aminas — central game state + local save system (localStorage). */
(function (root) {
  'use strict';
  const A = (root.A = root.A || {});
  const D = A.Data;
  const S = (A.State = {});

  S.SCHEMA = 1;

  S.fresh = function () {
    return {
      schema: S.SCHEMA,
      created: Date.now(),
      phase: 'title',            // title | intro | starter | play
      introDone: false,
      starter: null,
      res: { gold: D.START.gold, food: D.START.food, gems: D.START.gems },
      rank: 1, rankXp: 0,
      aminas: [],                // {uid, sp, lv, xp}
      active: null,              // uid of the companion
      nextUid: 1,
      seen: {},                  // species encountered in battle
      owned: {},                 // species ever owned
      struct: {},                // restored structures {id:true}
      flags: {},                 // r1, r2, stone, arcDone, ...
      missions: {},              // id -> 'claimed'
      notified: {},              // mission ids already announced as complete
      stats: { fed: 0, wins: 0, losses: 0, hatched: 0, evolved: 0, explores: {} },
      dungeon: { reliquary: { clears: 0 } },
      pendingFind: null,         // {area, sp}
      pendingR2: false,
      egg: null,                 // {sp, parents:[spA,spB], readyAt, startedAt}
      habitats: {},              // structId -> {uid, last, stock}
      party: [],                 // last chosen party uids
      run: null,                 // active dungeon run
      recipes: {},               // breeding recipes discovered
      settings: { music: true, sfx: true, eggSpeed: 'fast', textSpeed: 'normal' },
      story: { used: {}, slips: {}, asked: {} },
      lastSaved: 0,
    };
  };

  S.state = S.fresh();

  function storage() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }

  S.hasSave = function () {
    const ls = storage();
    if (!ls) return false;
    try {
      const raw = ls.getItem(D.SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !!(s && s.phase && s.phase !== 'title' && s.starter);
    } catch (e) { return false; }
  };

  // Merge loaded data over a fresh state so older saves gain new fields.
  function merge(base, src) {
    for (const k of Object.keys(src)) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        merge(base[k], src[k]);
      } else base[k] = src[k];
    }
    return base;
  }

  S.load = function () {
    const ls = storage();
    if (!ls) return false;
    try {
      const raw = ls.getItem(D.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;
      S.state = merge(S.fresh(), data);
      S.sanitize(S.state);
      return true;
    } catch (e) {
      // Corrupted save: keep a copy for recovery, do not crash.
      try { ls.setItem(D.SAVE_KEY + '-corrupt', ls.getItem(D.SAVE_KEY)); } catch (e2) {}
      return false;
    }
  };

  S.sanitize = function (st) {
    st.aminas = (st.aminas || []).filter((a) => D.SPECIES[a.sp]);
    st.aminas.forEach((a) => {
      a.lv = Math.max(1, Math.min(D.MAX_LEVEL, a.lv | 0));
      a.xp = Math.max(0, a.xp | 0);
    });
    if (!st.aminas.find((a) => a.uid === st.active)) st.active = st.aminas.length ? st.aminas[0].uid : null;
    ['gold', 'food', 'gems'].forEach((k) => { st.res[k] = Math.max(0, st.res[k] | 0); });
    st.phase = st.phase === 'title' ? 'title' : st.phase;
  };

  S.save = function () {
    const ls = storage();
    if (!ls) return false;
    try {
      S.state.lastSaved = Date.now();
      ls.setItem(D.SAVE_KEY, JSON.stringify(S.state));
      return true;
    } catch (e) { return false; }
  };

  S.reset = function () {
    const ls = storage();
    if (ls) { try { ls.removeItem(D.SAVE_KEY); } catch (e) {} }
    const keep = S.state && S.state.settings ? Object.assign({}, S.state.settings) : null;
    S.state = S.fresh();
    if (keep) S.state.settings = keep;
    return S.state;
  };

  S.newGame = function () {
    S.reset();
    S.state.phase = 'intro';
    S.save();
    return S.state;
  };

  // Backup code: base64 of the JSON so players can move saves between devices / browsers.
  S.exportCode = function () {
    const json = JSON.stringify(S.state);
    const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
    return 'AMINAS1:' + b64;
  };
  S.importCode = function (code) {
    try {
      code = String(code || '').trim();
      if (code.indexOf('AMINAS1:') !== 0) return false;
      const b64 = code.slice(8);
      const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
      const data = JSON.parse(json);
      if (!data || !Array.isArray(data.aminas)) return false;
      S.state = merge(S.fresh(), data);
      S.sanitize(S.state);
      S.save();
      return true;
    } catch (e) { return false; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
