// Real-browser smoke test (Chromium via Playwright; NOT iOS Safari). Run: node tests/browser.test.js
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'); const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
let pass = 0, fail = 0; const errors = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await new Promise((r) => server.listen(0, r)); const url = 'http://localhost:' + server.address().port + '/';
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.waitForSelector(sel, { timeout: 4000 }); await page.click(sel); await sleep(120); };
  const skipDialogues = async () => { for (let i = 0; i < 12; i++) { if (await page.$('.dlg-skip')) { await page.click('.dlg-skip'); await sleep(250); } else break; } };
  const S = () => page.evaluate(() => JSON.parse(JSON.stringify(A.State.state)));

  await page.goto(url); await page.waitForSelector('.logo'); ok(true, 'title screen renders'); await page.screenshot({ path: '/tmp/b_title.png' });
  ok(!(await page.$('[data-act=continue]')), 'no Continue button before any save');
  await click('[data-act=newgame]'); await page.waitForSelector('.intro'); ok(true, 'intro cards shown'); await page.click('.intro p'); await sleep(200); await click('[data-act=introSkip]');
  await page.waitForSelector('.dlg'); ok(true, 'The Entity arrival dialogue shown'); await page.screenshot({ path: '/tmp/b_dialogue.png' });
  await page.click('.dlg-skip'); await page.waitForSelector('[data-act=pickStarter]'); ok(true, 'starter selection shown'); await page.screenshot({ path: '/tmp/b_starter.png' });
  await page.click('[data-id=umbrit]'); await click('#st-go'); await sleep(900); await skipDialogues();
  let s = await S(); ok(s.starter === 'umbrit' && s.aminas.length === 1 && s.phase === 'play', 'starter chosen and stored (Umbrit)');
  await page.waitForSelector('.comp'); await page.screenshot({ path: '/tmp/b_island0.png' });

  // restore hollow by tapping it in the scene
  await page.evaluate(() => document.querySelector('[data-struct=hollow]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForSelector('[data-act=restore]'); await click('[data-act=restore]'); await sleep(600); await skipDialogues();
  s = await S(); ok(s.struct.hollow === true && s.res.gold === 60, 'Sunlit Hollow restored for 40 gold');
  // feed
  await click('.comp [data-act=feed][data-kind=snack]'); s = await S(); ok(s.stats.fed === 1 && s.aminas[0].xp === 18 && s.res.food === 37, 'feeding consumes food and adds xp');
  await page.screenshot({ path: '/tmp/b_island1.png' });
  // mission claim
  await sleep(300); await skipDialogues(); await click('.nav [data-act=missions]'); await page.waitForSelector('[data-act=claim]'); await page.screenshot({ path: '/tmp/b_missions.png' }); await click('[data-act=claim]'); await sleep(300);
  s = await S(); ok(s.missions.m_hollow === 'claimed' && s.res.gold === 90, 'mission reward claimed (+30 gold)'); await page.click('.overlay .sh-foot [data-act=close]'); await sleep(200);
  // collection
  await click('.nav [data-act=collection]'); await page.waitForSelector('.grid .card'); ok((await page.$$('.grid .card')).length === 28, 'collection lists all 28 Aminas'); await page.screenshot({ path: '/tmp/b_collection.png' });
  await page.click('.grid .card.unknown'); await page.waitForSelector('.detail'); ok(/How to find/.test(await page.textContent('.detail')), 'undiscovered entry explains how to find it'); await page.click('.overlay:last-child .x'); await page.click('.overlay:last-child .x'); await sleep(200);

  // persistence: reload
  await page.reload(); await page.waitForSelector('[data-act=continue]'); await click('[data-act=continue]'); await page.waitForSelector('.comp'); await skipDialogues();
  s = await S(); ok(s.struct.hollow && s.stats.fed === 1 && s.missions.m_hollow === 'claimed', 'progress persists after reload (Continue)');
  ok(await page.evaluate(() => !!document.querySelector('[data-struct=hollow].restored')), 'restored structure still restored in the scene');

  // set up dungeon-ready state through game rules (testing shortcut), then play real battles through the UI
  await page.evaluate(() => { const st = A.State.state; st.struct.tidegate = st.struct.reliquarygate = true; st.flags.r1 = true; A.Rules.addAmina(st, 'mossbun', 4); A.Rules.addAmina(st, 'pebblop', 3); st.aminas[0].lv = 7; st.aminas[1].lv = 6; st.aminas[2].lv = 5; A.Rules.drain(); st.res.gold = 500; A.State.save(); A.UI.showIsland(false); });
  await sleep(500); await skipDialogues(); await click('.nav [data-act=dungeons]'); await page.waitForSelector('.dcard'); ok((await page.$$('.dcard')).length === 3, 'three dungeons listed'); ok((await page.$$('.tagp.sealed')).length === 2, 'two dungeons clearly shown as sealed/not playable'); await page.screenshot({ path: '/tmp/b_dungeons.png' });
  await click('[data-act=enterDungeon]'); await page.waitForSelector('#pp-go'); await page.screenshot({ path: '/tmp/b_party.png' }); await click('#pp-go');
  let cleared = false;
  for (let enc = 0; enc < 8 && !cleared; enc++) {
    await page.waitForSelector('#enc-go', { timeout: 4000 }); if (enc === 0) await page.screenshot({ path: '/tmp/b_encounter.png' }); await click('#enc-go'); await page.waitForSelector('#battle');
    let guard = 0;
    while (guard++ < 240 && !(await page.$('#v-go'))) {
      await sleep(250);
      const pend = await page.evaluate(() => A.UI.B && A.UI.B.b.pending);
      if (pend) { const idx = await page.evaluate(() => A.UI.B.b.party.findIndex((p) => p.hp > 0)); await page.evaluate((i) => document.querySelectorAll('.pm')[i].click(), idx); continue; }
      const btn = await page.$$('.abtn:not(.off):not(.swap)'); if (btn.length) { await btn[btn.length - 1].click(); await sleep(300); }
      if (enc === 1 && guard === 3) await page.screenshot({ path: '/tmp/b_battle.png' });
    }
    ok(!!(await page.$('#v-go')), 'battle ' + (enc + 1) + ' reaches a result screen');
    const lost = /overwhelmed/.test(await page.textContent('body')); if (lost) { await click('#v-go'); break; }
    if (/Dungeon cleared/.test(await page.textContent('body'))) { cleared = true; await page.screenshot({ path: '/tmp/b_victory.png' }); }
    await click('#v-go'); await sleep(500);
  }
  await sleep(800); for (let i = 0; i < 14; i++) { if (await page.$('.dlg-skip')) await page.click('.dlg-skip'); else if (await page.$('.overlay [data-act=close]')) await page.click('.overlay [data-act=close]'); else break; await sleep(300); }
  s = await S(); ok(cleared && s.dungeon.reliquary.clears === 1, 'first dungeon completed through real turn-based battles');
  ok(s.owned.relicwarden && s.res.gems >= 5, 'dungeon rewards granted (Relicwarden + gems)'); ok(s.flags.r2 === true, 'World Resonance event 2: Dormant Spire awakened after the dungeon'); ok(!!(await page.$('[data-hit=stone]')), 'new Silent Stone appears on the island');
  await page.screenshot({ path: '/tmp/b_island_r2.png' });

  // offline support
  const swReady = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.ready; return !!r.active; }); ok(swReady, 'service worker active');
  await page.reload(); await sleep(800); await ctx.setOffline(true); await page.reload(); await page.waitForSelector('.logo', { timeout: 8000 }); ok(true, 'game launches OFFLINE from the service-worker cache'); await click('[data-act=continue]'); await page.waitForSelector('.comp'); ok(true, 'continue works offline with saved progress');
  const mf = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json()); ok(mf.display === 'standalone' && mf.icons.length >= 3, 'manifest served offline with icons');
  await ctx.setOffline(false);
  ok(errors.length === 0, 'no console/page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); server.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('TEST CRASH', e); process.exit(2); });
