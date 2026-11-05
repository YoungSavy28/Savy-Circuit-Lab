/* sim.js - circuit engine + SVG canvas editor.
   Physics: every terminal is a node; wires and closed switches are tiny resistors (0.01 ohm),
   bulbs are 10 ohm resistors, batteries are ideal sources with 0.05 ohm internal resistance.
   Node voltages come from nodal analysis (Gaussian elimination), so series, parallel and
   mixed circuits all work with any number of bulbs. */
(function () {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const GRID = 20, R_BULB = 10, R_INT = 0.05, WIRE_G = 100, LEAK = 1e-6;
const P_RATED = 9 * 9 / R_BULB;           // a bulb is "full brightness" at 9 V
const BLOW_AT = 2.5;                       // burns out above 2.5x rated power
const TERMS = { battery: [[-40, 0], [40, 0]], bulb: [[-40, 0], [40, 0]], 'switch': [[-40, 0], [40, 0]], junction: [[0, 0]] };
const NAMES = { battery: 'Battery', bulb: 'Light bulb', 'switch': 'Switch', junction: 'Junction' };
const ROT = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const ASPECT = 0.62;

const S = { parts: [], wires: [], nextId: 1, wireN: 1, sel: null, view: { x: 0, y: 0, w: 1000, h: 620 },
  opts: { flow: true, numbers: true }, color: 'r', faults: [], faultWires: new Set(), boomAt: {}, readOnly: false, hl: [], pending: null, preview: null, undo: [],
  stats: null, res: {}, wireI: {}, seen: new Set(), animate: false, drag: null, lastB: {} };
let svg, L = {}, cb = {}, insp, banner, toastEl, hint;

const byId = (parts, id) => parts.find(p => p.id === id);
const pidOf = t => +t.split(':')[0], kOf = t => +t.split(':')[1];
const clone = o => JSON.parse(JSON.stringify(o));
const fmt = x => { x = Math.abs(x); return x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2); };

function termPos(parts, tid) {
  const p = byId(parts, pidOf(tid)); if (!p) return null;
  const loc = TERMS[p.type][kOf(tid)]; if (!loc) return null;
  const [c, s] = ROT[p.rot || 0];
  const x = loc[0] * c - loc[1] * s, y = loc[0] * s + loc[1] * c, len = Math.hypot(x, y);
  return { x: p.x + x, y: p.y + y, dir: len ? [Math.round(x / len), Math.round(y / len)] : null };
}

/* ---------------- wire routing: pick the neatest right-angle path ---------------- */
function tidy(pts) {
  const o = []; for (const p of pts) { const l = o[o.length - 1]; if (!l || l[0] !== p[0] || l[1] !== p[1]) o.push(p); }
  const r = [o[0]];
  for (let i = 1; i < o.length - 1; i++) { const a = r[r.length - 1], b = o[i], c = o[i + 1]; if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) continue; r.push(b); }
  r.push(o[o.length - 1]); return r;
}
function route(parts, a, b) {
  const A = termPos(parts, a), B = termPos(parts, b); if (!A || !B) return null;
  const dx = B.x - A.x, dy = B.y - A.y;
  const pick = (x, y) => Math.abs(x) >= Math.abs(y) ? [Math.sign(x) || 1, 0] : [0, Math.sign(y) || 1];
  const da = A.dir, db = B.dir, ea = da || pick(dx, dy), eb = db || pick(-dx, -dy);
  const S0 = da ? 20 : 0, S1 = db ? 20 : 0;
  const p0 = [A.x + ea[0] * S0, A.y + ea[1] * S0], p1 = [B.x + eb[0] * S1, B.y + eb[1] * S1];
  const a0 = [A.x, A.y], b0 = [B.x, B.y], ext = 20;
  const xs = [(p0[0] + p1[0]) / 2, Math.min(p0[0], p1[0]) - ext, Math.max(p0[0], p1[0]) + ext, p0[0], p1[0]];
  const ys = [(p0[1] + p1[1]) / 2, Math.min(p0[1], p1[1]) - ext, Math.max(p0[1], p1[1]) + ext, p0[1], p1[1]];
  const c = [];
  xs.forEach(mx => c.push([a0, p0, [mx, p0[1]], [mx, p1[1]], p1, b0]));
  ys.forEach(my => c.push([a0, p0, [p0[0], my], [p1[0], my], p1, b0]));
  let best = null, bs = Infinity;
  for (const raw of c) {
    const pts = tidy(raw); let len = 0, pen = 0;
    for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    const n = pts.length;
    if (n > 2) {
      const f = [Math.sign(pts[1][0] - pts[0][0]), Math.sign(pts[1][1] - pts[0][1])];
      const l = [Math.sign(pts[n - 1][0] - pts[n - 2][0]), Math.sign(pts[n - 1][1] - pts[n - 2][1])];
      if (da && f[0] * da[0] + f[1] * da[1] < 0) pen += 2000;
      if (db && l[0] * db[0] + l[1] * db[1] > 0) pen += 2000;
    }
    const sc = len + 25 * (pts.length - 2) + pen;
    if (sc < bs) { bs = sc; best = pts; }
  }
  return best;
}
const pathD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');

/* ---------------- wire colours: red = positive (+), black = negative (-) ---------------- */
function nets(parts, wires) {
  const idx = new Map(), tl = []; parts.forEach(p => TERMS[p.type].forEach((_, k) => { idx.set(p.id + ':' + k, tl.length); tl.push(p.id + ':' + k); }));
  const d = [...Array(tl.length).keys()], f = x => d[x] === x ? x : (d[x] = f(d[x])), u = (a, b) => { d[f(a)] = f(b); };
  wires.forEach(w => { const a = idx.get(w.a), b = idx.get(w.b); if (a !== undefined && b !== undefined) u(a, b); });
  parts.forEach(p => { if (p.type === 'switch' && p.closed) u(idx.get(p.id + ':0'), idx.get(p.id + ':1')); });
  return { idx, f };
}
function autoColor(parts, wires) {           // gives older / preset wires a colour based on which side of the battery they are on
  if (!wires.some(w => !w.c)) return;
  const { idx, f } = nets(parts, wires), plus = new Set(), minus = new Set();
  parts.forEach(p => { if (p.type === 'battery') { plus.add(f(idx.get(p.id + ':0'))); minus.add(f(idx.get(p.id + ':1'))); } });
  wires.forEach(w => { if (w.c) return; const r = f(idx.get(w.a)), hp = plus.has(r), hm = minus.has(r); w.c = hm && !hp ? 'k' : 'r'; });
}

/* ---------------- physics ---------------- */
function gauss(A, n) {
  for (let c = 0; c < n; c++) {
    let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
    if (m !== c) { const t = A[c]; A[c] = A[m]; A[m] = t; }
    const d = A[c][c]; if (Math.abs(d) < 1e-30) continue;
    for (let r = c + 1; r < n; r++) { const f = A[r][c] / d; if (!f) continue; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
  }
  const V = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) { let s = A[r][n]; for (let k = r + 1; k < n; k++) s -= A[r][k] * V[k]; V[r] = Math.abs(A[r][r]) < 1e-30 ? 0 : s / A[r][r]; }
  return V;
}
function solve(parts, wires) {
  const idx = new Map(), tl = [];
  for (const p of parts) for (let k = 0; k < TERMS[p.type].length; k++) { idx.set(p.id + ':' + k, tl.length); tl.push(p.id + ':' + k); }
  const n = tl.length, res = {}, wireI = {};
  const A = Array.from({ length: n }, () => new Float64Array(n + 1));
  const stamp = (a, b, g) => { A[a][a] += g; A[b][b] += g; A[a][b] -= g; A[b][a] -= g; };
  for (let i = 0; i < n; i++) A[i][i] += LEAK;
  const dsu = [...Array(n).keys()], find = x => dsu[x] === x ? x : (dsu[x] = find(dsu[x])), uni = (a, b) => { dsu[find(a)] = find(b); };
  for (const w of wires) { const a = idx.get(w.a), b = idx.get(w.b); if (a === undefined || b === undefined || a === b) continue; stamp(a, b, WIRE_G); uni(a, b); }
  for (const p of parts) {
    const t0 = idx.get(p.id + ':0'), t1 = idx.get(p.id + ':1');
    if (p.type === 'switch' && p.closed) { stamp(t0, t1, WIRE_G); uni(t0, t1); }
    else if (p.type === 'bulb' && (p.state || 'ok') === 'ok') stamp(t0, t1, 1 / R_BULB);
    else if (p.type === 'battery' && (p.state || 'ok') === 'ok') { const v = p.v || 9, g = 1 / R_INT; stamp(t0, t1, g); A[t0][n] += v * g; A[t1][n] -= v * g; }
  }
  const V = gauss(A, n);
  for (const p of parts) {
    const t0 = idx.get(p.id + ':0'), t1 = idx.get(p.id + ':1');
    if (p.type === 'bulb') {
      const ok = (p.state || 'ok') === 'ok', vb = ok ? V[t0] - V[t1] : 0, P = vb * vb / R_BULB, pr = P / P_RATED;
      const b = ok ? Math.min(1, Math.pow(pr, 0.55)) : 0;
      res[p.id] = { V: Math.abs(vb), I: Math.abs(vb) / R_BULB, P, b, lit: b > 0.05, over: pr > 1.3, pr };
    } else if (p.type === 'switch') {
      const d = V[t0] - V[t1]; res[p.id] = { V: Math.abs(d), I: p.closed ? Math.abs(d) * WIRE_G : 0 };
    } else if (p.type === 'battery') {
      const vt = V[t0] - V[t1], v = p.v || 9, ok = (p.state || 'ok') === 'ok';
      res[p.id] = { V: ok ? vt : 0, I: ok ? (v - vt) / R_INT : 0, short: find(t0) === find(t1) };
    }
  }
  for (const w of wires) { const a = idx.get(w.a), b = idx.get(w.b); wireI[w.id] = (a === undefined || b === undefined) ? 0 : (V[a] - V[b]) * WIRE_G; }
  /* polarity faults: a net may not hold both a red and a black wire, red may not sit on the negative side,
     black may not sit on the positive side, and a battery's + and - may not be joined */
  const comp = [...Array(n).keys()], fc = x => comp[x] === x ? x : (comp[x] = fc(comp[x])), uc = (a, b) => { comp[fc(a)] = fc(b); };
  for (const w of wires) { const a = idx.get(w.a), b = idx.get(w.b); if (a !== undefined && b !== undefined) uc(a, b); }
  for (const p of parts) if (TERMS[p.type].length === 2) uc(idx.get(p.id + ':0'), idx.get(p.id + ':1'));
  const info = new Map(), get = r => { if (!info.has(r)) info.set(r, { cols: new Set(), wires: [], plus: 0, minus: 0, rep: r }); return info.get(r); };
  for (const w of wires) { const a = idx.get(w.a), b = idx.get(w.b); if (a === undefined || b === undefined) continue; const o = get(find(a)); o.cols.add(w.c || 'r'); o.wires.push(w); }
  const bats = parts.filter(p => p.type === 'battery');
  for (const p of bats) { get(find(idx.get(p.id + ':0'))).plus++; get(find(idx.get(p.id + ':1'))).minus++; }
  const faults = [], faultWires = new Set();
  const addFault = (kind, o, ws) => { ws.forEach(w => faultWires.add(w.id)); faults.push({ kind, comp: fc(o.rep), wires: ws.map(w => w.id) }); };
  for (const [, o] of info) {
    const join = o.plus > 0 && o.minus > 0;
    const shorted = bats.some(p => find(idx.get(p.id + ':0')) === find(idx.get(p.id + ':1')) && find(idx.get(p.id + ':0')) === find(o.rep));
    if (shorted) addFault('short', o, o.wires);
    else if (o.cols.has('r') && o.cols.has('k')) addFault('mix', o, o.wires);
    else if (!join && o.plus > 0 && o.cols.has('k')) addFault('wrong', o, o.wires.filter(w => w.c === 'k'));
    else if (!join && o.minus > 0 && o.cols.has('r')) addFault('wrong', o, o.wires.filter(w => w.c !== 'k'));
  }
  faults.forEach(f => { f.bats = bats.filter(p => fc(idx.get(p.id + ':0')) === f.comp).map(p => p.id); });
  return { res, wireI, faults, faultWires };
}
function compute(parts, wires) {
  let out, blew = [], blewBat = [];
  for (let pass = 0; pass < 5; pass++) {
    out = solve(parts, wires); let ch = false;
    for (const p of parts) if (p.type === 'bulb' && (p.state || 'ok') === 'ok' && out.res[p.id].pr > BLOW_AT) { p.state = 'blown'; ch = true; blew.push(p.id); }
    for (const f of out.faults) for (const id of f.bats) { const b = byId(parts, id); if (b && (b.state || 'ok') === 'ok') { b.state = 'blown'; ch = true; blewBat.push(id); } }
    if (!ch) break;
  }
  const bulbs = parts.filter(p => p.type === 'bulb').map(p => Object.assign({ id: p.id, state: p.state || 'ok' }, out.res[p.id]));
  const bats = parts.filter(p => p.type === 'battery');
  out.blew = blew; out.blewBat = blewBat;
  out.stats = {
    bulbs, lit: bulbs.filter(b => b.lit).length, blown: bulbs.filter(b => b.state === 'blown').length, off: bulbs.filter(b => b.state === 'off').length,
    batteries: bats.length, blownBat: bats.filter(p => p.state === 'blown').length, shorts: bats.filter(p => out.res[p.id].short).length,
    faults: out.faults.map(f => f.kind), wiresRed: wires.filter(w => w.c !== 'k').length, wiresBlack: wires.filter(w => w.c === 'k').length,
    switches: parts.filter(p => p.type === 'switch').map(p => ({ id: p.id, closed: !!p.closed })),
    junctions: parts.filter(p => p.type === 'junction').length, wires: wires.length, parts: parts.length, sel: null
  };
  return out;
}

/* ---------------- drawing ---------------- */
function partInner(p) {
  switch (p.type) {
    case 'battery': return ((S.boomAt[p.id] && Date.now() - S.boomAt[p.id] < 1300) ? '<circle class="boom" r="20"/><circle class="boom b2" r="20"/>' : '') + '<line class="pl" x1="-40" y1="0" x2="-15" y2="0"/><line class="pl" x1="15" y1="0" x2="40" y2="0"/>' +
      '<line class="pl pw" x1="-15" y1="-17" x2="-15" y2="17"/><line class="pl" x1="-5" y1="-9" x2="-5" y2="9"/>' +
      '<line class="pl pw" x1="5" y1="-17" x2="5" y2="17"/><line class="pl" x1="15" y1="-9" x2="15" y2="9"/>' +
      '<path class="spark" d="M-6 -24 L2 -12 L-3 -12 L6 2"/>';
    case 'bulb': {
      const st = p.state || 'ok', lb = S.lastB[p.id] || 0;
      return '<circle class="glow" r="74" fill="url(#glowGrad)" style="opacity:' + lb + '"/>' +
        '<line class="pl" x1="-40" y1="0" x2="-24" y2="0"/><line class="pl" x1="24" y1="0" x2="40" y2="0"/>' +
        '<circle class="glass ' + st + '" r="24"/><circle class="lit" r="24" style="opacity:' + lb * 0.9 + '"/>' +
        (st === 'blown' ? '<path class="fil broken" d="M-17 -17 L-4 -4 M4 4 L17 17 M17 -17 L4 -4 M-4 4 L-17 17"/>' : '<path class="fil" d="M-17 -17 L17 17 M17 -17 L-17 17"/>');
    }
    case 'switch': return '<line class="pl" x1="-40" y1="0" x2="-20" y2="0"/><line class="pl" x1="20" y1="0" x2="40" y2="0"/>' +
      '<circle class="pivot" cx="-20" cy="0" r="4"/><circle class="pivot" cx="20" cy="0" r="4"/>' +
      (p.closed ? '<line class="pl lever" x1="-20" y1="0" x2="20" y2="0"/>' : '<line class="pl lever" x1="-20" y1="0" x2="15" y2="-20"/>');
    case 'junction': return '<circle class="jn" r="6"/>';
  }
  return '';
}
function partMarkup(p, interactive) {
  const hit = p.type === 'junction' ? '<circle class="hit" r="14"/>' : '<rect class="hit" x="-32" y="-30" width="64" height="60"/>';
  return '<g class="part ' + p.type + (S.sel && S.sel.kind === 'part' && S.sel.id === p.id ? ' sel' : '') + '" ' + (interactive ? 'data-part="' + p.id + '" ' : '') +
    'id="pt-' + p.id + '" transform="translate(' + p.x + ',' + p.y + ') rotate(' + (p.rot || 0) * 90 + ')">' +
    '<rect class="selbox" x="-50" y="-36" width="100" height="72" rx="12"/>' + partInner(p) + (interactive ? hit : '') + '</g>';
}

function render() {
  const seen = S.seen, now = new Set();
  L.wires.innerHTML = S.wires.map(w => {
    const pts = route(S.parts, w.a, w.b); if (!pts) return '';
    const d = pathD(pts), isNew = S.animate && !seen.has(w.id); now.add(w.id);
    return '<g data-wire="' + w.id + '"><path class="wire ' + (w.c === 'k' ? 'k' : 'r') + (isNew ? ' draw' : '') + '" id="w-' + w.id + '" pathLength="1" d="' + d + '"/><path class="whit" d="' + d + '"/></g>';
  }).join('');
  S.wires.forEach(w => now.add(w.id)); S.seen = now;
  L.flow.innerHTML = S.wires.map(w => { const pts = route(S.parts, w.a, w.b); return pts ? '<path class="flow" id="f-' + w.id + '" d="' + pathD(pts) + '"/>' : ''; }).join('');
  L.parts.innerHTML = S.parts.map(p => partMarkup(p, !S.readOnly || true)).join('');
  let t = '';
  S.parts.forEach(p => TERMS[p.type].forEach((_, k) => {
    const tid = p.id + ':' + k, q = termPos(S.parts, tid), conn = S.wires.some(w => w.a === tid || w.b === tid);
    const cls = 'term' + (conn ? ' conn' : '') + (S.pending === tid ? ' pend' : '') + (S.hl.indexOf(tid) >= 0 ? ' hl' : '') + (p.type === 'junction' ? ' jt' : '');
    t += '<g class="' + cls + '" data-term="' + tid + '"><circle class="ring" cx="' + q.x + '" cy="' + q.y + '" r="13"/><circle class="dot" cx="' + q.x + '" cy="' + q.y + '" r="5.5"/><circle class="thit" cx="' + q.x + '" cy="' + q.y + '" r="15"/></g>';
  }));
  L.terms.innerHTML = t;
  hint.style.display = S.parts.length ? 'none' : '';
  buildInspector();
}

function paint() {
  const st = S.stats; if (!st) return;
  S.parts.forEach(p => {
    const r = S.res[p.id], g = document.getElementById('pt-' + p.id); if (!r || !g) return;
    if (p.type === 'bulb') {
      S.lastB[p.id] = r.b;
      const gl = g.querySelector('.glow'), li = g.querySelector('.lit'), fi = g.querySelector('.fil');
      gl.style.opacity = r.b; li.style.opacity = r.b * 0.9; gl.classList.toggle('over', r.over);
      fi.style.stroke = (p.state || 'ok') === 'blown' ? '' : 'rgba(255,' + (200 + Math.round(r.b * 40)) + ',' + (120 + Math.round(r.b * 100)) + ',' + (0.4 + 0.6 * r.b).toFixed(2) + ')';
    }
    if (p.type === 'battery') { g.classList.toggle('short', !!r.short && (p.state || 'ok') === 'ok'); g.classList.toggle('blown', (p.state || 'ok') === 'blown'); }
  });
  S.wires.forEach(w => {
    const I = S.wireI[w.id] || 0, el = document.getElementById('w-' + w.id); if (!el) return;
    el.classList.toggle('live', Math.abs(I) > 0.005);
    el.classList.toggle('fault', S.faultWires.has(w.id));
    el.classList.toggle('sel', !!(S.sel && S.sel.kind === 'wire' && S.sel.id === w.id));
  });
  let nums = '';
  S.parts.forEach(p => {
    const r = S.res[p.id], side = (p.rot || 0) % 2 === 1, lbl = (txt, dy) => side ? '<text class="num side" x="' + (p.x + 34) + '" y="' + (p.y + 5) + '">' + txt + '</text>' : '<text class="num" x="' + p.x + '" y="' + (p.y + dy) + '">' + txt + '</text>';
    if (!r) return;
    if (S.opts.numbers) {
      if (p.type === 'bulb') nums += ((p.state || 'ok') === 'ok' ? lbl(fmt(r.V) + ' V · ' + fmt(r.I) + ' A', 52) : lbl((p.state === 'blown' ? 'burnt out' : 'unscrewed'), 52));
      if (p.type === 'battery') nums += ((p.state || 'ok') === 'blown' ? lbl('destroyed', 44) : lbl((p.v || 9) + ' V · ' + fmt(r.I) + ' A out', 44));
    }
    if (p.type === 'battery') {
      [0, 1].forEach(k => { const q = termPos(S.parts, p.id + ':' + k), [c, s] = ROT[p.rot || 0], ox = 0 * c - (-16) * s, oy = 0 * s + (-16) * c;
        nums += '<text class="pm ' + (k ? 'neg' : 'pos') + '" x="' + (q.x + ox) + '" y="' + (q.y + oy + 5) + '">' + (k ? '−' : '+') + '</text>'; });
    }
  });
  L.nums.innerHTML = nums;
  const kinds = S.faults.map(f => f.kind), kind = kinds.indexOf('short') >= 0 ? 'short' : kinds.indexOf('mix') >= 0 ? 'mix' : kinds[0];
  if (kind) banner.innerHTML = BANNER[kind];
  banner.classList.toggle('show', !!kind);
  updateReadouts();
}

const BANNER = {
  short: '💥 <b>Short circuit.</b> The battery\'s + and − are joined with nothing in between, so it blew. Fix the wiring, then select the battery and press <b>Replace battery</b>.',
  mix: '💥 <b>Positive and negative mixed.</b> A red (+) wire is touching a black (−) wire, so the battery blew. Keep red and black apart, then <b>Replace battery</b>.',
  wrong: '💥 <b>Wrong wire color.</b> A black wire is on the positive side, or a red wire is on the negative side. Red goes to +, black goes to −. Fix it, then <b>Replace battery</b>.'
};

/* ---------------- flow animation ---------------- */
function tick(ms) {
  const t = ms / 1000;
  if (S.opts.flow) for (const w of S.wires) {
    const el = document.getElementById('f-' + w.id); if (!el) continue;
    const I = S.wireI[w.id] || 0, a = Math.abs(I);
    if (a < 0.005) { el.style.opacity = 0; continue; }
    el.style.opacity = 1;
    const v = 26 + Math.min(a, 3) * 22;
    el.setAttribute('stroke-dashoffset', (-(t * v * Math.sign(I)) % 1400).toFixed(2));
  } else for (const w of S.wires) { const el = document.getElementById('f-' + w.id); if (el) el.style.opacity = 0; }
  requestAnimationFrame(tick);
}

/* ---------------- inspector ---------------- */
function buildInspector() {
  const s = S.sel; if (!s || S.readOnly) { insp.innerHTML = ''; insp.classList.remove('show'); return; }
  insp.classList.add('show');
  if (s.kind === 'wire') { const w = S.wires.find(x => x.id === s.id); insp.innerHTML = '<div class="ih"><b>' + (w && w.c === 'k' ? 'Black (−) wire' : 'Red (+) wire') + '</b><button data-act="desel" aria-label="Close">×</button></div><div class="ib"><div class="row"><button data-act="wcol">Make it ' + (w && w.c === 'k' ? 'red (+)' : 'black (−)') + '</button><button data-act="del" class="danger">Delete wire</button></div></div>'; return; }
  const p = byId(S.parts, s.id); if (!p) { insp.innerHTML = ''; insp.classList.remove('show'); return; }
  let h = '<div class="ih"><b>' + NAMES[p.type] + '</b><button data-act="desel" aria-label="Close">×</button></div><div class="ib">';
  if (p.type === 'bulb') h += '<div class="ro"><span>Voltage across</span><b id="r-V">-</b></div><div class="ro"><span>Current</span><b id="r-I">-</b></div><div class="ro"><span>Power</span><b id="r-P">-</b></div><div class="ro"><span>Resistance</span><b>10 Ω</b></div>' +
    '<div class="row"><button data-act="bulb">' + ((p.state || 'ok') === 'ok' ? 'Unscrew bulb' : (p.state === 'blown' ? 'Replace bulb' : 'Screw bulb back in')) + '</button></div>';
  if (p.type === 'switch') h += '<div class="row"><button data-act="flip">' + (p.closed ? 'Open the switch' : 'Close the switch') + '</button></div><p class="tip">Tip: you can also just click the switch.</p>';
  if (p.type === 'battery' && (p.state || 'ok') === 'blown') h += '<p class="tip">This battery is destroyed. Fix the wiring first.</p><div class="row"><button data-act="bat">Replace battery</button></div>';
  if (p.type === 'battery') h += '<div class="ro"><span>Current out of +</span><b id="r-I">-</b></div><div class="chips">' +
    [1.5, 3, 6, 9, 12].map(v => '<button data-act="volt" data-v="' + v + '" class="' + ((p.v || 9) === v ? 'on' : '') + '">' + v + ' V</button>').join('') + '</div>';
  if (p.type === 'junction') h += '<p class="tip">A junction joins any number of wires at one point.</p>';
  if (p.type !== 'junction') h += '<div class="row"><button data-act="rot">Rotate (R)</button><button data-act="del" class="danger">Delete</button></div>';
  else h += '<div class="row"><button data-act="del" class="danger">Delete</button></div>';
  insp.innerHTML = h + '</div>';
}
function updateReadouts() {
  const s = S.sel; if (!s || s.kind !== 'part') return; const r = S.res[s.id], p = byId(S.parts, s.id); if (!r || !p) return;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  if (p.type === 'bulb') { set('r-V', fmt(r.V) + ' V'); set('r-I', fmt(r.I) + ' A'); set('r-P', fmt(r.P) + ' W'); }
  if (p.type === 'battery') set('r-I', fmt(r.I) + ' A');
}

/* ---------------- state changes ---------------- */
function pushUndo() { S.undo.push(JSON.stringify({ parts: S.parts, wires: S.wires, nextId: S.nextId, wireN: S.wireN })); if (S.undo.length > 60) S.undo.shift(); }
function refresh(why) {
  const out = compute(S.parts, S.wires); S.res = out.res; S.wireI = out.wireI; S.stats = out.stats; S.faults = out.faults; S.faultWires = out.faultWires;
  out.blewBat.forEach(id => { S.boomAt[id] = Date.now(); });
  S.stats.sel = S.sel && S.sel.kind === 'part' ? (byId(S.parts, S.sel.id) || {}).type || null : null;
  render(); void L.parts.getBoundingClientRect(); paint();
  if (out.blewBat.length) toast('💥 BOOM! Positive and negative were mixed, and the battery blew. Select it and press "Replace battery" after you fix the wiring.');
  else if (out.blew.length) toast('💥 A bulb burned out! Too much voltage. Select it and press "Replace bulb".');
  if (cb.onChange) cb.onChange(S.stats, why || 'edit');
}
function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 3800); }
function addWire(a, b) {
  if (a === b || pidOf(a) === pidOf(b) && false) return;
  if (S.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) { toast('Those two terminals are already wired.'); return; }
  pushUndo(); S.wires.push({ id: 'w' + (S.wireN++), a, b, c: S.color }); S.animate = true; refresh(); S.animate = false;
}
function removeSel() {
  if (!S.sel || S.readOnly) return; pushUndo();
  if (S.sel.kind === 'wire') S.wires = S.wires.filter(w => w.id !== S.sel.id);
  else { const id = S.sel.id; S.parts = S.parts.filter(p => p.id !== id); S.wires = S.wires.filter(w => pidOf(w.a) !== id && pidOf(w.b) !== id); }
  S.sel = null; refresh();
}
function rotateSel() { const p = S.sel && S.sel.kind === 'part' && byId(S.parts, S.sel.id); if (!p || p.type === 'junction') return; pushUndo(); p.rot = ((p.rot || 0) + 1) % 4; refresh(); }
function snap(v) { return Math.round(v / GRID) * GRID; }
function freeSpot() {
  const cx = snap(S.view.x + S.view.w / 2), cy = snap(S.view.y + S.view.h / 2), c = [];
  for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) c.push([cx + i * 120, cy + j * 100]);
  c.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
  return c.find(q => S.parts.every(p => Math.hypot(p.x - q[0], p.y - q[1]) > 110)) || [cx, cy];
}
function add(type) {
  if (S.readOnly) return; pushUndo(); const [x, y] = freeSpot();
  const p = { id: S.nextId++, type, x, y, rot: 0 };
  if (type === 'battery') { p.v = 9; p.state = 'ok'; } if (type === 'switch') p.closed = false; if (type === 'bulb') p.state = 'ok';
  S.parts.push(p); S.sel = { kind: 'part', id: p.id }; refresh();
}

/* ---------------- pointer interaction ---------------- */
function toWorld(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; }
function nearestTerm(x, y, skip) {
  const kpx = svg.clientWidth ? S.view.w / svg.clientWidth : 1; let best = null, bd = Math.max(24, 26 * kpx);
  S.parts.forEach(p => TERMS[p.type].forEach((_, k) => { const tid = p.id + ':' + k; if (tid === skip) return; const q = termPos(S.parts, tid), d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = tid; } }));
  return best;
}
function drawPreview() {
  const d = S.drag;
  if (!d || d.kind !== 'wire' || !d.moved) { L.over.innerHTML = ''; return; }
  const q = termPos(S.parts, d.from), tgt = d.snap ? termPos(S.parts, d.snap) : { x: d.x, y: d.y };
  L.over.innerHTML = '<line class="pv ' + S.color + '" x1="' + q.x + '" y1="' + q.y + '" x2="' + tgt.x + '" y2="' + tgt.y + '"/>' + (d.snap ? '<circle class="pvs" cx="' + tgt.x + '" cy="' + tgt.y + '" r="14"/>' : '');
}
function down(e) {
  if (S.readOnly) return;
  const t = e.target.closest ? e.target : null; if (!t) return;
  const [x, y] = toWorld(e), term = t.closest('[data-term]'), part = t.closest('[data-part]'), wire = t.closest('[data-wire]');
  svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
  if (term) S.drag = { kind: 'wire', from: term.dataset.term, x, y, moved: false, sx: e.clientX, sy: e.clientY };
  else if (part) { const id = +part.dataset.part, p = byId(S.parts, id); S.sel = { kind: 'part', id }; S.pending = null; S.drag = { kind: 'move', id, ox: p.x - x, oy: p.y - y, moved: false, sx: e.clientX, sy: e.clientY }; refresh('select'); }
  else if (wire) { S.sel = { kind: 'wire', id: wire.dataset.wire }; S.pending = null; refresh('select'); }
  else S.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y, moved: false };
}
function move(e) {
  const d = S.drag; if (!d) return;
  if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) d.moved = true;
  if (d.kind === 'wire') { const [x, y] = toWorld(e); d.x = x; d.y = y; d.snap = d.moved ? nearestTerm(x, y, d.from) : null; drawPreview(); }
  else if (d.kind === 'move' && d.moved) {
    const [x, y] = toWorld(e), p = byId(S.parts, d.id); if (!d.pushed) { pushUndo(); d.pushed = true; }
    const nx = snap(x + d.ox), ny = snap(y + d.oy); if (nx !== p.x || ny !== p.y) { p.x = nx; p.y = ny; refresh('move'); }
  } else if (d.kind === 'pan' && d.moved) {
    const k = 1 / svg.getScreenCTM().a; S.view.x = d.vx - (e.clientX - d.sx) * k; S.view.y = d.vy - (e.clientY - d.sy) * k; applyView();
  }
}
function up(e) {
  const d = S.drag; S.drag = null; if (!d) return;
  if (d.kind === 'wire') {
    L.over.innerHTML = '';
    if (d.moved) { if (d.snap) addWire(d.from, d.snap); S.pending = null; render(); }
    else { // tap-tap wiring for touch screens
      if (!S.pending) S.pending = d.from; else if (S.pending !== d.from) { const a = S.pending; S.pending = null; addWire(a, d.from); return; } else S.pending = null;
      render();
    }
  } else if (d.kind === 'move') {
    if (!d.moved) { const p = byId(S.parts, d.id); if (p && p.type === 'switch') { pushUndo(); p.closed = !p.closed; refresh('toggle'); } }
  } else if (d.kind === 'pan' && !d.moved) { S.sel = null; S.pending = null; refresh('select'); }
}
function applyView() { svg.setAttribute('viewBox', S.view.x + ' ' + S.view.y + ' ' + S.view.w + ' ' + S.view.h); }
function zoom(f, cx, cy) {
  const nw = Math.min(3200, Math.max(380, S.view.w * f)); if (nw === S.view.w) return;
  const r = svg.getBoundingClientRect(); cx = cx === undefined ? r.left + r.width / 2 : cx; cy = cy === undefined ? r.top + r.height / 2 : cy;
  const before = toWorld({ clientX: cx, clientY: cy }); S.view.w = nw; S.view.h = nw * ASPECT; applyView();
  const after = toWorld({ clientX: cx, clientY: cy }); S.view.x += before[0] - after[0]; S.view.y += before[1] - after[1]; applyView();
}
function fit() {
  if (!S.parts.length) { S.view = { x: 0, y: 0, w: 1000, h: 620 }; return applyView(); }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; S.parts.forEach(p => { x0 = Math.min(x0, p.x - 90); x1 = Math.max(x1, p.x + 90); y0 = Math.min(y0, p.y - 90); y1 = Math.max(y1, p.y + 90); });
  const w = Math.max(svg.clientWidth && svg.clientWidth < 700 ? 480 : 700, x1 - x0, (y1 - y0) / ASPECT); S.view = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - w * ASPECT / 2, w, h: w * ASPECT }; applyView();
}

/* ---------------- public API ---------------- */
function init(el, opts) {
  svg = el; cb = opts || {}; insp = document.querySelector(cb.inspector || '#inspector'); banner = document.querySelector(cb.banner || '#banner');
  toastEl = document.querySelector(cb.toast || '#toast'); hint = document.querySelector(cb.hint || '#emptyHint');
  svg.innerHTML = '<defs><radialGradient id="glowGrad"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb23e" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a3d" stop-opacity="0"/></radialGradient>' +
    '<pattern id="gridDots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,.10)"/></pattern></defs>' +
    '<rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#gridDots)"/>' +
    '<g id="Lw"></g><g id="Lf"></g><g id="Lp"></g><g id="Ln"></g><g id="Lt"></g><g id="Lo"></g>';
  L = { wires: svg.querySelector('#Lw'), flow: svg.querySelector('#Lf'), parts: svg.querySelector('#Lp'), nums: svg.querySelector('#Ln'), terms: svg.querySelector('#Lt'), over: svg.querySelector('#Lo') };
  svg.addEventListener('dragstart', e => e.preventDefault()); svg.addEventListener('selectstart', e => e.preventDefault()); svg.addEventListener('pointerdown', down); svg.addEventListener('pointermove', move); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9, e.clientX, e.clientY); }, { passive: false });
  insp.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || S.readOnly) return; const act = b.dataset.act, p = S.sel && S.sel.kind === 'part' && byId(S.parts, S.sel.id);
    if (act === 'desel') { S.sel = null; refresh('select'); }
    else if (act === 'del') removeSel(); else if (act === 'rot') rotateSel();
    else if (act === 'flip' && p) { pushUndo(); p.closed = !p.closed; refresh('toggle'); }
    else if (act === 'wcol' && S.sel && S.sel.kind === 'wire') { const w = S.wires.find(x => x.id === S.sel.id); if (w) { pushUndo(); w.c = w.c === 'k' ? 'r' : 'k'; refresh('edit'); } }
    else if (act === 'bat' && p) { pushUndo(); p.state = 'ok'; refresh('toggle'); }
    else if (act === 'bulb' && p) { pushUndo(); p.state = (p.state || 'ok') === 'ok' ? 'off' : 'ok'; refresh('toggle'); }
    else if (act === 'volt' && p) { pushUndo(); p.v = +b.dataset.v; refresh('edit'); }
  });
  document.addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || S.readOnly) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { removeSel(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') rotateSel();
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { undo(); e.preventDefault(); }
    else if (e.key === 'w' || e.key === 'W') setColor(S.color === 'r' ? 'k' : 'r');
    else if (e.key === 'Escape') { S.pending = null; S.sel = null; refresh('select'); }
  });
  document.querySelectorAll('[data-sim]').forEach(b => b.addEventListener('click', () => {
    const [a, v] = b.dataset.sim.split(':');
    if (a === 'add') add(v); else if (a === 'undo') undo(); else if (a === 'clear') clearAll(); else if (a === 'zin') zoom(0.8); else if (a === 'zout') zoom(1.25); else if (a === 'fit') fit();
  }));
  document.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => setColor(b.dataset.color)));
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.toggle; S.opts[k] = !S.opts[k]; b.classList.toggle('on', S.opts[k]); paint(); }));
  applyView(); requestAnimationFrame(tick); refresh('init');
}
function setColor(c) { S.color = c; document.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b.dataset.color === c)); }
function undo() { if (S.readOnly || !S.undo.length) return; const s = JSON.parse(S.undo.pop()); S.parts = s.parts; S.wires = s.wires; S.nextId = s.nextId; S.wireN = s.wireN; S.sel = null; refresh('undo'); }
function clearAll() { if (S.readOnly || !S.parts.length) return; pushUndo(); S.parts = []; S.wires = []; S.sel = null; S.pending = null; refresh('edit'); }
function setState(st, o) {
  o = o || {}; const c = clone(st || { parts: [], wires: [] });
  S.parts = c.parts || []; S.wires = c.wires || []; S.nextId = c.nextId || (Math.max(0, ...S.parts.map(p => p.id)) + 1);
  S.wireN = c.wireN || (Math.max(0, ...S.wires.map(w => +String(w.id).replace(/\D/g, '') || 0)) + 1);
  S.parts.forEach(p => { if ((p.type === 'bulb' || p.type === 'battery') && !p.state) p.state = 'ok'; });
  autoColor(S.parts, S.wires);
  S.sel = null; S.pending = null; S.undo = [];
  if (c.view && !o.keepView) { S.view = c.view; applyView(); }
  S.animate = !!o.animate; refresh(o.reason || 'load'); S.animate = false;
}
window.Sim = {
  init, setState, undo, add, fit, zoom, toast,
  getState: () => ({ parts: clone(S.parts), wires: clone(S.wires), nextId: S.nextId, wireN: S.wireN, view: Object.assign({}, S.view) }),
  setReadOnly: v => { S.readOnly = !!v; S.drag = null; svg && svg.classList.toggle('ro', S.readOnly); refresh('mode'); },
  setHighlight: a => { S.hl = a || []; render(); },
  get stats() { return S.stats; },
  evaluate: st => { const c = clone(st); c.parts.forEach(p => { if ((p.type === 'bulb' || p.type === 'battery') && !p.state) p.state = 'ok'; }); autoColor(c.parts, c.wires); return compute(c.parts, c.wires).stats; },
  thumb: st => {
    const c = clone(st); c.parts.forEach(p => { if ((p.type === 'bulb' || p.type === 'battery') && !p.state) p.state = 'ok'; }); autoColor(c.parts, c.wires); const out = compute(c.parts, c.wires); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    c.parts.forEach(p => { x0 = Math.min(x0, p.x - 60); x1 = Math.max(x1, p.x + 60); y0 = Math.min(y0, p.y - 60); y1 = Math.max(y1, p.y + 60); });
    const save = S.lastB; S.lastB = {}; c.parts.forEach(p => { if (p.type === 'bulb') S.lastB[p.id] = out.res[p.id].b; });
    const saveSel = S.sel; S.sel = null;
    const wires = c.wires.map(w => { const pts = route(c.parts, w.a, w.b); return pts ? '<path class="wire ' + (w.c === 'k' ? 'k' : 'r') + (Math.abs(out.wireI[w.id]) > 0.005 ? ' live' : '') + '" d="' + pathD(pts) + '"/>' : ''; }).join('');
    const parts = c.parts.map(p => partMarkup(p, false)).join(''); S.lastB = save; S.sel = saveSel;
    return '<svg class="thumb" viewBox="' + x0 + ' ' + y0 + ' ' + (x1 - x0) + ' ' + (y1 - y0) + '" aria-hidden="true">' + wires + parts + '</svg>';
  }
};
})();
