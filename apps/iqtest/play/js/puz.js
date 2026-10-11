/* IQ 테스트 — 도형 행렬 문제 생성기.
   문제는 전부 코드로 만든다(남의 문제를 옮기지 않는다). 씨앗이 고정이라 누구나 같은 30문항을 푼다.
   가족 셋: A 도형 속성 행렬, L 선 겹치기, H 시곗바늘 회전. 규칙은 모두 "가로 줄"로 흐른다. */
(function () {
'use strict';

function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0; let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const pick = (R, a) => a[Math.floor(R() * a.length)];
function shuffle(R, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const bits = m => { let n = 0; while (m) { n += m & 1; m >>>= 1; } return n; };
const mod = (a, n) => ((a % n) + n) % n;
const clone = o => JSON.parse(JSON.stringify(o));
const key = o => JSON.stringify(o);

/* ---------------- A: 도형 속성 ---------------- */
const KIND = {
  center: { slots: [[50, 50]], R: 40, sw: 2.6 },
  grid4: { slots: [[28, 28], [72, 28], [28, 72], [72, 72]], R: 18.5, sw: 2.4, ring: [0, 1, 3, 2] },
  grid9: { slots: [[19, 19], [50, 19], [81, 19], [19, 50], [50, 50], [81, 50], [19, 81], [50, 81], [81, 81]], R: 13.8, sw: 2.1, ring: [0, 1, 2, 5, 8, 7, 6, 3] },
  out: { slots: [[50, 50]], R: 42, sw: 2.6 },
  in: { slots: [[50, 50]], R: 18, sw: 2.4 },
  left: { slots: [[26, 50]], R: 21, sw: 2.4 },
  right: { slots: [[74, 50]], R: 21, sw: 2.4 },
};
const SIZE = [0.42, 0.54, 0.66, 0.78, 0.9, 1.0];
const COLOR = ['#ffffff', '#d4d4d4', '#a6a6a6', '#787878', '#4a4a4a', '#141414'];
/* 같은 외접원이라도 원이 커 보이고 세모가 작아 보여서 눈 크기를 맞춘다 */
const TFIX = [1.12, 0.95, 1.0, 0.98, 0.86];

function domain(kind, at, rule) {
  if (at === 'type') return (rule && rule.indexOf('prog') === 0) ? [0, 1, 2, 3] : [0, 1, 2, 3, 4];
  if (at === 'size') {
    if (kind === 'center' || kind === 'left' || kind === 'right') return [0, 1, 2, 3, 4, 5];
    if (kind === 'out') return [5];
    if (kind === 'in') return [2, 5];
    return [3, 5];
  }
  if (at === 'color') return kind === 'out' ? [0] : [0, 1, 2, 3, 4, 5];
  if (at === 'number') return kind === 'grid4' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return [0];
}

function grid3(f) { return [0, 1, 2].map(r => [0, 1, 2].map(c => f(r, c))); }

/* 규칙 하나로 3x3 값을 만든다. dom 은 쓸 수 있는 값 */
function genRule(R, rule, dom, gap) {
  const L = dom.length;
  /* 크기·색은 세 값이 서로 두 칸 이상 떨어져야 눈으로 갈린다 */
  const three = () => {
    for (let t = 0; t < 200; t++) {
      const v = shuffle(R, dom.slice()).slice(0, 3);
      if (!gap || L < 5) return v;
      const s = v.map(x => dom.indexOf(x)).sort((a, b) => a - b);
      if (s[1] - s[0] >= gap && s[2] - s[1] >= gap) return v;
    }
    return null;
  };
  if (rule === 'const') { const v = pick(R, dom); return { g: grid3(() => v) }; }
  if (rule === 'constR') {
    if (L < 3) return null;
    const v = three(); if (!v) return null;
    return { g: grid3(r => v[r]) };
  }
  if (rule.indexOf('prog') === 0) {
    const step = rule === 'prog2' ? 2 : 1;
    const d = (rule === 'progU' || R() < 0.5) ? step : -step;
    if (L < 2 * step + 1) return null;
    const lo = d > 0 ? 0 : -2 * d, hi = d > 0 ? L - 1 - 2 * d : L - 1;
    const st = [0, 1, 2].map(() => ri(R, lo, hi));
    if (hi > lo && st[0] === st[1] && st[1] === st[2]) return null;
    return { g: grid3((r, c) => dom[st[r] + d * c]), d, step };
  }
  if (rule === 'd3') {
    if (L < 3) return null;
    const v = three(), sh = pick(R, [1, 2]); if (!v) return null;
    return { g: grid3((r, c) => v[mod(c + r * sh, 3)]) };
  }
  if (rule === 'add' || rule === 'sub') {
    const max = dom[L - 1];
    const rows = [];
    for (let r = 0; r < 3; r++) {
      let v0, v1, v2;
      if (rule === 'add') { v0 = ri(R, 1, max - 1); v1 = ri(R, 1, max - v0); v2 = v0 + v1; }
      else { v0 = ri(R, 2, max); v1 = ri(R, 1, v0 - 1); v2 = v0 - v1; }
      rows.push([v0, v1, v2]);
    }
    const isProg = x => x[1] - x[0] === x[2] - x[1];
    if (isProg(rows[0]) && isProg(rows[1])) return null;
    if (key(rows[0]) === key(rows[1])) return null;
    return { g: rows };
  }
  return null;
}

function randSet(R, n, k) {
  const p = shuffle(R, [...Array(n).keys()]).slice(0, k);
  return p.reduce((m, i) => m | (1 << i), 0);
}

function genPos(R, rule, K) {
  const n = K.slots.length, ring = K.ring, L = ring.length;
  const rs = k => randSet(R, n, k);
  if (rule === 'shift') {
    const step = pick(R, [1, -1]), k = n === 4 ? ri(R, 1, 2) : ri(R, 2, 3);
    const rows = [];
    for (let r = 0; r < 3; r++) {
      const idx = shuffle(R, [...Array(L).keys()]).slice(0, k);
      rows.push([0, 1, 2].map(c => idx.reduce((m, i) => m | (1 << ring[mod(i + step * c, L)]), 0)));
    }
    for (const row of rows) if (row[0] === row[1] || row[1] === row[2]) return null;
    if (rows[0][0] === rows[1][0]) return null;
    return { g: rows, step };
  }
  if (rule === 'or' || rule === 'diff') {
    const rows = [];
    for (let r = 0; r < 3; r++) {
      const ka = n === 4 ? 2 : ri(R, 3, 4), kb = n === 4 ? 2 : ri(R, 3, 4);
      const a = rs(ka), b = rs(kb);
      if (a === b || !(a & ~b) || !(b & ~a)) return null;
      const c = rule === 'or' ? (a | b) : (a & ~b);
      if (!c) return null;
      if (rule === 'diff' && !(a & b)) return null;
      rows.push([a, b, c]);
    }
    if (rule === 'or' && !(rows[0][0] & rows[0][1]) && !(rows[1][0] & rows[1][1])) return null;
    return { g: rows };
  }
  if (rule === 'd3') {
    const k = n === 4 ? 2 : ri(R, 3, 4);
    const v = [];
    while (v.length < 3) { const s = rs(k); if (v.indexOf(s) < 0) v.push(s); }
    const sh = pick(R, [1, 2]);
    return { g: grid3((r, c) => v[mod(c + r * sh, 3)]) };
  }
  return null;
}

function moveOne(R, m, n) {
  const on = [], off = [];
  for (let i = 0; i < n; i++) ((m >> i) & 1 ? on : off).push(i);
  if (!on.length || !off.length) return null;
  return (m & ~(1 << pick(R, on))) | (1 << pick(R, off));
}

/* 정답 패널에서 속성 하나를 그럴듯하게 틀린 값으로 바꾼 것 */
function altFor(R, a, ans) {
  const comp = ans.comps[a.ci];
  if (a.at === 'number') {
    const n = KIND[comp.k].slots.length, v = bits(comp.pos);
    const c = [v + 1, v - 1].filter(x => a.dom.indexOf(x) >= 0);
    if (!c.length) return null;
    const nv = pick(R, c), on = [], off = [];
    for (let i = 0; i < n; i++) ((comp.pos >> i) & 1 ? on : off).push(i);
    return nv > v ? comp.pos | (1 << pick(R, off)) : comp.pos & ~(1 << pick(R, on));
  }
  if (a.at === 'pos') {
    const K = KIND[comp.k], n = K.slots.length, g = a.g, A = g[2][0], B = g[2][1], v = comp.pos;
    let c = [];
    if (a.rule === 'or') c = [A ^ B, A & B, A, B];
    else if (a.rule === 'diff') c = [A ^ B, B & ~A, A | B, A & B];
    else if (a.rule === 'd3') c = [A, B];
    else if (a.rule === 'shift') {
      const L = K.ring.length; let m = 0;
      for (let i = 0; i < L; i++) if ((v >> K.ring[i]) & 1) m |= 1 << K.ring[mod(i + a.step, L)];
      c = [B, m];
    }
    c = shuffle(R, c.filter(x => x && x !== v && bits(x) > 0));
    if (c.length) return c[0];
    return moveOne(R, v, n);
  }
  const v = comp[a.at], dom = a.dom, i = dom.indexOf(v);
  let pri = [];
  if (a.g) for (const x of [a.g[2][0], a.g[2][1]]) if (x !== v) pri.push(x);
  if (a.d) pri.push(dom[i + a.d], dom[i - a.d]);
  if (a.rule === 'add' || a.rule === 'sub') pri.push(v + 1, v - 1);
  pri = pri.filter(x => x !== undefined && x !== v && dom.indexOf(x) >= 0);
  /* 규칙이 없는 크기·색은 한 칸 차이로 헷갈리게 하지 않는다 */
  if (a.rule === 'const' && a.at !== 'type') pri = pri.filter(x => Math.abs(dom.indexOf(x) - i) >= 2);
  if (!pri.length && a.at !== 'type') pri = dom.filter(x => x !== v && Math.abs(dom.indexOf(x) - i) >= 2 && Math.abs(dom.indexOf(x) - i) <= 3);
  if (!pri.length) pri = dom.filter(x => x !== v);
  if (!pri.length) return null;
  return pick(R, pri);
}

function applyAlt(p, a, alt) {
  if (a.at === 'number' || a.at === 'pos') p.comps[a.ci].pos = alt;
  else p.comps[a.ci][a.at] = alt;
}

function finish(R, P, opts, ans) {
  const o = shuffle(R, opts.slice());
  const k = key(ans);
  return { mat: P, opts: o, ans: o.findIndex(x => key(x) === k) };
}

function genA(spec, R) {
  for (let t = 0; t < 3000; t++) {
    const P = grid3(() => ({ f: 'A', comps: spec.c.map(cs => ({ k: cs.k, type: 0, size: 5, color: 0, pos: 1 })) }));
    const attrs = []; let bad = false;
    spec.c.forEach((cs, ci) => {
      if (bad) return;
      const K = KIND[cs.k], r = cs.r || {};
      for (const at of ['type', 'size', 'color']) {
        const rule = r[at] || 'const', dom = domain(cs.k, at, rule), G = genRule(R, rule, dom, at === 'type' ? 0 : 2);
        if (!G) { bad = true; return; }
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P[i][j].comps[ci][at] = G.g[i][j];
        attrs.push({ ci, at, rule, dom, g: G.g, d: G.d, gov: rule !== 'const' });
      }
      if (K.slots.length > 1) {
        if (r.pos) {
          const G = genPos(R, r.pos, K);
          if (!G) { bad = true; return; }
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P[i][j].comps[ci].pos = G.g[i][j];
          attrs.push({ ci, at: 'pos', rule: r.pos, g: G.g, step: G.step, gov: true });
        } else {
          const rule = r.number || 'const', dom = domain(cs.k, 'number'), G = genRule(R, rule, dom);
          if (!G) { bad = true; return; }
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P[i][j].comps[ci].pos = randSet(R, K.slots.length, G.g[i][j]);
          attrs.push({ ci, at: 'number', rule, dom, g: G.g, gov: rule !== 'const' });
        }
      }
    });
    if (bad) continue;
    /* 바깥 도형과 안 도형이 같은 모양이면 하나로 겹쳐 보여서 피한다 */
    if (spec.c.length === 2 && spec.c[0].k === 'out') {
      let same = false;
      for (const row of P) for (const p of row) if (p.comps[0].type === p.comps[1].type) same = true;
      if (same) continue;
    }
    const ans = P[2][2];
    const gov = shuffle(R, attrs.filter(a => a.gov));
    const con = shuffle(R, attrs.filter(a => !a.gov && (!a.dom || a.dom.length > 1)));
    const tree = gov.concat(con).slice(0, 3);
    if (tree.length < 3) continue;
    const alts = tree.map(a => altFor(R, a, ans));
    if (alts.some(x => x === null || x === undefined)) continue;
    const opts = [];
    for (let m = 0; m < 8; m++) { const p = clone(ans); tree.forEach((a, i) => { if ((m >> i) & 1) applyAlt(p, a, alts[i]); }); opts.push(p); }
    if (new Set(opts.map(key)).size < 8) continue;
    return finish(R, P, opts, ans);
  }
  throw new Error('genA fail');
}

/* ---------------- L: 선 겹치기 ---------------- */
const LP = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => [20 + 30 * (i % 3), 20 + 30 * Math.floor(i / 3)]);
const SEG = [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8], [4, 0], [4, 2], [4, 6], [4, 8]];
const FULL = (1 << SEG.length) - 1;
const OPS = {
  or: (a, b) => a | b, xor: (a, b) => a ^ b, and: (a, b) => a & b,
  diff: (a, b) => a & ~b & FULL, rdiff: (a, b) => b & ~a & FULL,
};

function genL(spec, R) {
  const f = OPS[spec.op];
  for (let t = 0; t < 4000; t++) {
    const rows = [];
    let bad = false;
    for (let r = 0; r < 3; r++) {
      const a = randSet(R, SEG.length, spec.k), b = randSet(R, SEG.length, spec.k + ri(R, -1, 1));
      const c = f(a, b);
      if (a === b || !(a & b) || !(a & ~b) || !(b & ~a) || bits(c) < 2) { bad = true; break; }
      rows.push([a, b, c]);
    }
    if (bad) continue;
    /* 위 두 줄만 보고도 규칙이 하나로 정해져야 한다 */
    let amb = false;
    for (const o in OPS) {
      if (o === spec.op) continue;
      if (rows.slice(0, 2).every(([a, b, c]) => OPS[o](a, b) === c)) amb = true;
    }
    if (amb) continue;
    const [A, B, Cc] = rows[2];
    const cand = [];
    const push = m => { if (m && m !== Cc && cand.indexOf(m) < 0) cand.push(m); };
    shuffle(R, Object.keys(OPS)).forEach(o => push(OPS[o](A, B)));
    push(A); push(B);
    const head = cand.length;
    shuffle(R, [...Array(SEG.length).keys()]).forEach(i => push(Cc ^ (1 << i)));
    const pickd = shuffle(R, cand.slice(0, head)).slice(0, 4);
    for (const m of cand) { if (pickd.length >= 7) break; if (pickd.indexOf(m) < 0) pickd.push(m); }
    if (pickd.length < 7) continue;
    const P = grid3((r, c) => ({ f: 'L', m: rows[r][c] }));
    const opts = [{ f: 'L', m: Cc }].concat(pickd.map(m => ({ f: 'L', m })));
    return finish(R, P, opts, { f: 'L', m: Cc });
  }
  throw new Error('genL fail');
}

/* ---------------- H: 시곗바늘 ---------------- */
function genH(spec, R) {
  const off = c => spec.acc ? c * (c + 1) / 2 : c;
  for (let t = 0; t < 3000; t++) {
    const face = ri(R, 0, 1);
    const CR = genRule(R, spec.ctr || 'const', [0, 1, 2, 3, 4, 5], 2);
    if (!CR) continue;
    const a0 = [0, 1, 2].map(() => ri(R, 0, 7)), b0 = [0, 1, 2].map(() => ri(R, 0, 7));
    if (a0[0] === a0[1] || a0[1] === a0[2]) continue;
    let bad = false;
    const P = grid3((r, c) => {
      const a = mod(a0[r] + spec.sa * off(c), 8);
      const b = spec.sb == null ? -1 : mod(b0[r] + spec.sb * off(c), 8);
      if (a === b) bad = true;
      return { f: 'H', face, a, b, ctr: CR.g[r][c] };
    });
    if (bad) continue;
    const ans = P[2][2];
    const last = s => s * (spec.acc ? 2 : 1);
    const handAlt = (v, s, other) => shuffle(R, [mod(v - last(s), 8), mod(v + s, 8), mod(v + 4, 8)].filter(x => x !== v && x !== other))[0];
    const tree = [{ at: 'a', alt: handAlt(ans.a, spec.sa, ans.b) }];
    if (spec.sb != null) tree.push({ at: 'b', alt: handAlt(ans.b, spec.sb, ans.a) });
    const ctrA = { ci: 0, at: 'ctr', rule: spec.ctr || 'const', dom: [0, 1, 2, 3, 4, 5], g: CR.g, d: CR.d };
    tree.push({ at: 'ctr', alt: altFor(R, ctrA, { comps: [{ ctr: ans.ctr }] }) });
    if (tree.length < 3) tree.push({ at: 'face', alt: 1 - face });
    if (tree.some(x => x.alt === undefined || x.alt === null)) continue;
    const opts = [];
    for (let m = 0; m < 8; m++) { const p = clone(ans); tree.forEach((x, i) => { if ((m >> i) & 1) p[x.at] = x.alt; }); opts.push(p); }
    if (new Set(opts.map(key)).size < 8) continue;
    return finish(R, P, opts, ans);
  }
  throw new Error('genH fail');
}

/* ---------------- 30문항 (쉬움 → 어려움) ---------------- */
const C = (k, r) => ({ k, r });
const SPECS = [
  { f: 'A', c: [C('center', { color: 'prog2' })] },
  { f: 'A', c: [C('center', { type: 'd3' })] },
  { f: 'A', c: [C('center', { size: 'prog2' })] },
  { f: 'H', sa: 2, sb: null },
  { f: 'A', c: [C('grid4', { number: 'progU' })] },
  { f: 'L', op: 'or', k: 3 },
  { f: 'A', c: [C('center', { type: 'd3', color: 'prog1' })] },
  { f: 'A', c: [C('out', { type: 'd3' }), C('in', { color: 'prog2' })] },
  { f: 'H', sa: 1, sb: -2 },
  { f: 'A', c: [C('grid9', { number: 'prog1', type: 'constR' })] },
  { f: 'L', op: 'xor', k: 4 },
  { f: 'A', c: [C('grid4', { pos: 'shift', color: 'd3' })] },
  { f: 'A', c: [C('center', { size: 'prog2', color: 'd3', type: 'd3' })] },
  { f: 'A', c: [C('grid9', { number: 'add', color: 'constR' })] },
  { f: 'L', op: 'and', k: 6 },
  { f: 'A', c: [C('left', { type: 'd3' }), C('right', { color: 'prog1' })] },
  { f: 'H', sa: 1, sb: 3, ctr: 'd3' },
  { f: 'A', c: [C('grid4', { pos: 'or', type: 'd3' })] },
  { f: 'A', c: [C('center', { color: 'add', type: 'd3', size: 'constR' })] },
  { f: 'L', op: 'diff', k: 5 },
  { f: 'A', c: [C('grid9', { number: 'd3', type: 'prog1', color: 'd3' })] },
  { f: 'A', c: [C('out', { type: 'prog1' }), C('in', { type: 'd3', color: 'add' })] },
  { f: 'H', sa: 2, sb: -1, ctr: 'prog1' },
  { f: 'A', c: [C('grid9', { pos: 'diff', color: 'prog2' })] },
  { f: 'L', op: 'xor', k: 6 },
  { f: 'A', c: [C('left', { size: 'prog2', color: 'd3' }), C('right', { type: 'prog1', color: 'sub' })] },
  { f: 'A', c: [C('grid4', { pos: 'd3', type: 'd3', color: 'prog1' })] },
  { f: 'H', sa: 1, sb: -1, ctr: 'd3', acc: true },
  { f: 'A', c: [C('center', { color: 'sub', type: 'prog1', size: 'd3' })] },
  { f: 'L', op: 'rdiff', k: 6 },
];

function one(i, off) {
  const s = SPECS[i];
  for (const o of [off || 0, 0]) {
    try {
      const R = rng(20261010 + i * 7919 + o * 104729);
      const q = s.f === 'A' ? genA(s, R) : s.f === 'L' ? genL(s, R) : genH(s, R);
      q.id = i; q.f = s.f;
      return q;
    } catch (e) { /* 이 씨앗으로 못 만들면 기본 씨앗으로 */ }
  }
}
function build(off) { return SPECS.map((s, i) => one(i, off)); }

/* ---------------- 그리기(SVG 조각) ---------------- */
const INK = '#141414';
function shape(t, x, y, r, fill, sw) {
  r *= TFIX[t];
  if (t === 4) return `<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
  const n = [3, 4, 5, 6][t], rot = t === 1 ? -Math.PI / 4 : -Math.PI / 2;
  const cy = t === 0 ? y + r * 0.12 : y;
  let pts = '';
  for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n; pts += (x + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2) + ' '; }
  return `<polygon points="${pts.trim()}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

function drawA(p) {
  let s = '';
  for (const c of p.comps) {
    const K = KIND[c.k];
    for (let i = 0; i < K.slots.length; i++) {
      if (!((c.pos >> i) & 1)) continue;
      const [x, y] = K.slots[i];
      s += shape(c.type, x, y, K.R * SIZE[c.size], COLOR[c.color], K.sw);
    }
  }
  return s;
}
function drawL(p) {
  let s = '';
  for (const [x, y] of LP) s += `<circle cx="${x}" cy="${y}" r="2.2" fill="#c9c4b6"/>`;
  SEG.forEach(([u, v], i) => {
    if (!((p.m >> i) & 1)) return;
    s += `<line x1="${LP[u][0]}" y1="${LP[u][1]}" x2="${LP[v][0]}" y2="${LP[v][1]}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  });
  return s;
}
function drawH(p) {
  let s = p.face ? `<rect x="9" y="9" width="82" height="82" rx="10" fill="#fff" stroke="${INK}" stroke-width="2.4"/>`
                 : `<circle cx="50" cy="50" r="41" fill="#fff" stroke="${INK}" stroke-width="2.4"/>`;
  for (let d = 0; d < 8; d++) {
    const an = (-90 + 45 * d) * Math.PI / 180;
    s += `<circle cx="${(50 + 35 * Math.cos(an)).toFixed(2)}" cy="${(50 + 35 * Math.sin(an)).toFixed(2)}" r="1.9" fill="#b9b3a3"/>`;
  }
  const hand = (d, len, w, tip) => {
    const an = (-90 + 45 * d) * Math.PI / 180, x = 50 + len * Math.cos(an), y = 50 + len * Math.sin(an);
    let o = `<line x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`;
    if (tip) o += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4.2" fill="${INK}"/>`;
    return o;
  };
  if (p.b >= 0) s += hand(p.b, 20, 7.5, false);
  s += hand(p.a, 31, 3.2, true);
  s += `<circle cx="50" cy="50" r="9" fill="${COLOR[p.ctr]}" stroke="${INK}" stroke-width="2.4"/>`;
  return s;
}
function svg(p) {
  const inner = p.f === 'A' ? drawA(p) : p.f === 'L' ? drawL(p) : drawH(p);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

window.IQ = { build, one, svg, N: SPECS.length };
})();
