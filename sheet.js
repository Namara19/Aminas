// Dev tool: render a contact sheet of all creatures + scene to PNG for visual checks.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const root = path.join(__dirname, '..');
  const html = '<html><body style="margin:0;background:#2a2f4a;font:12px sans-serif;color:#fff"><div id=g style="display:flex;flex-wrap:wrap"></div></body></html>';
  await p.setContent(html);
  for (const f of ['data', 'state', 'rules', 'story', 'art']) await p.addScriptTag({ content: fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8') });
  await p.evaluate(() => { const g = document.getElementById('g'); A.Data.ROSTER.forEach(s => { const d = document.createElement('div'); d.style.cssText = 'width:150px;text-align:center;padding:4px'; d.innerHTML = '<div style="width:130px;height:130px;margin:auto">' + A.Art.creature(s.id) + '</div>' + s.name; g.appendChild(d); }); const d = document.createElement('div'); d.style.cssText = 'width:130px;padding:4px;display:flex;gap:4px;flex-wrap:wrap'; ['n','t','s','a','w','c'].forEach(m => { const e = document.createElement('div'); e.style.cssText='width:60px'; e.innerHTML = A.Art.entity(m); d.appendChild(e); }); g.appendChild(d); });
  await p.screenshot({ path: '/tmp/sheet.png' });
  await p.setViewportSize({ width: 844, height: 390 });
  await p.evaluate(() => { document.body.innerHTML = '<div style="width:844px;height:390px">' + (()=>{ const st = A.State.fresh(); A.Rules.addAmina(st,'lumifern',1); st.struct.hollow=true; st.struct.tidegate=true; st.flags.r1=true; st.flags.r2=true; st.res.gold=999; return A.Art.scene(st); })() + '</div>'; document.querySelector('svg').style.cssText='width:100%;height:100%'; });
  await p.screenshot({ path: '/tmp/scene.png' });
  await b.close();
})();
