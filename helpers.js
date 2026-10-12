const vm = require('vm'), fs = require('fs'), path = require('path');
function load(files) {
  const store = {};
  const ctx = { console, Buffer, Math, JSON, Date, Object, Array,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  (files || ['data', 'state', 'rules']).forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' }));
  return { A: ctx.A, store, ctx };
}
module.exports = { load };
