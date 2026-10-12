// Run after editing any game file:  node tools/stamp.js
// Rewrites sw.js with a content-hash VERSION and the full precache list.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const SKIP = new Set(['sw.js', 'README.md', 'package.json', '_headers', 'netlify.toml', 'vercel.json', '.nojekyll', '.gitignore']);
const SKIPDIR = new Set(['tests', 'tools', '.github', 'node_modules', '.git']);
function walk(d, base) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => { const rel = path.posix.join(base, e.name); if (e.isDirectory()) return SKIPDIR.has(e.name) ? [] : walk(path.join(d, e.name), rel); return SKIP.has(rel) ? [] : [rel]; }); }
const files = walk(root, '').sort();
const h = crypto.createHash('sha1'); files.forEach((f) => { h.update(f); h.update(fs.readFileSync(path.join(root, f))); });
const version = h.digest('hex').slice(0, 10);
let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
sw = sw.replace(/const VERSION = '.*?';/, "const VERSION = '" + version + "';").replace(/const PRECACHE = \[[\s\S]*?\];/, 'const PRECACHE = ' + JSON.stringify(['./'].concat(files.map((f) => './' + f)), null, 2) + ';');
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log('sw.js stamped: version ' + version + ', ' + (files.length + 1) + ' precached entries');
