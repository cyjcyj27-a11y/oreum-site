/* 코드로 만드는 문항: 논리수학(수열·기호 식), 공간(도형 돌리기), 음악(음높이·바뀐 음·리듬), EQ 얼굴 그림 */
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
const INK = '#141414';

/* 정답 하나 + 그럴듯한 오답 셋을 섞어 돌려준다 */
function choices(R, ans, near) {
  const out = [];
  const add = v => { if (Number.isInteger(v) && v > 0 && v !== ans && out.indexOf(v) < 0) out.push(v); };
  shuffle(R, near.slice()).forEach(add);
  for (let k = 1; out.length < 3 && k < 40; k++) add(ans + (R() < 0.5 ? k : -k));
  const opts = shuffle(R, [ans].concat(out.slice(0, 3)));
  return { opts, ans: opts.indexOf(ans) };
}

/* ---------------- 논리수학 ---------------- */
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
const LOGIC = ['ar+', 'ar-', 'geo', 'alt', 'sq', 'diff', 'sym2', 'fib', 'x2p1', 'inter', 'sym3', 'x3m1', 'prime', 'cube', 'dbl'];
function logicItem(kind, R) {
  let seq, ans, near;
  switch (kind) {
    case 'ar+': { const a = ri(R, 2, 9), d = ri(R, 3, 7); seq = [0, 1, 2, 3, 4].map(i => a + d * i); ans = a + 5 * d; near = [ans + d, ans - 1, ans + 2, ans - d + 1]; break; }
    case 'ar-': { const a = ri(R, 50, 70), d = ri(R, 4, 8); seq = [0, 1, 2, 3, 4].map(i => a - d * i); ans = a - 5 * d; near = [ans - d, ans + 1, ans - 2, ans + d - 1]; break; }
    case 'geo': { const a = ri(R, 2, 4); seq = [0, 1, 2, 3, 4].map(i => a * Math.pow(2, i)); ans = a * 32; near = [a * 24, a * 30, a * 34, ans + a * 4]; break; }
    case 'alt': { const a = ri(R, 3, 9), p = ri(R, 5, 8), q = ri(R, 1, 3); seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? p : -q)); ans = seq[5] + p; near = [seq[5] - q, seq[5] + p - q, ans + 1, ans - 2]; break; }
    case 'sq': { const k = ri(R, 2, 4); seq = [0, 1, 2, 3, 4].map(i => (k + i) * (k + i)); ans = (k + 5) * (k + 5); near = [ans - 1, ans + 1, seq[4] + (seq[4] - seq[3]), ans + 2]; break; }
    case 'diff': { const a = ri(R, 1, 9), d = ri(R, 1, 3); seq = [a]; for (let i = 0; i < 5; i++) seq.push(seq[i] + d + i); ans = seq[5] + d + 5; near = [seq[5] + d + 4, ans + 1, ans + 2, ans - 2]; break; }
    case 'fib': { const a = ri(R, 1, 3), b = ri(R, 2, 5); seq = [a, b]; for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]); ans = seq[5] + seq[4]; near = [seq[5] + seq[4] - seq[3], ans + 1, seq[5] * 2, ans - 2]; break; }
    case 'x2p1': { const a = ri(R, 1, 4); seq = [a]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] * 2 + 1); ans = seq[4] * 2 + 1; near = [seq[4] * 2, seq[4] * 2 + 2, ans + 4, ans - 3]; break; }
    case 'inter': { const a = ri(R, 2, 6), d1 = ri(R, 2, 4), b = ri(R, 30, 40), d2 = ri(R, 2, 5);
      seq = []; for (let i = 0; i < 7; i++) seq.push(i % 2 ? b - d2 * ((i - 1) / 2) : a + d1 * (i / 2));
      ans = b - d2 * 3; near = [a + d1 * 4, ans - 1, ans + d2, seq[6] + d1]; break; }
    case 'x3m1': { const a = ri(R, 1, 3); seq = [a]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] * 3 - 1); ans = seq[4] * 3 - 1; near = [seq[4] * 3, seq[4] * 3 + 1, ans - 2, ans + 3]; break; }
    case 'prime': { const k = ri(R, 2, 6); seq = PRIMES.slice(k, k + 5); ans = PRIMES[k + 5]; near = [ans + 1, ans - 1, ans + 2, seq[4] + 2]; break; }
    case 'cube': { const k = ri(R, 1, 2); seq = [0, 1, 2, 3, 4].map(i => Math.pow(k + i, 3)); ans = Math.pow(k + 5, 3); near = [ans - 1, Math.pow(k + 5, 2) * (k + 4), ans + 9, ans - 25]; break; }
    case 'dbl': { const a = ri(R, 1, 5); seq = [a]; for (let i = 0; i < 5; i++) seq.push(seq[i] + Math.pow(2, i)); ans = seq[5] + 32; near = [seq[5] + 16, seq[5] + 31, ans + 1, ans - 2]; break; }
    case 'sym2': { const x = ri(R, 2, 9); let y; do { y = ri(R, 2, 9); } while (y === x);
      return Object.assign({ eqs: [[[0, 0], 2 * x], [[0, 1], x + y]], ask: 1 }, choices(R, y, [x, x + y, 2 * x - y, y + 1].filter(v => v !== y))); }
    case 'sym3': { const v = [ri(R, 2, 9), ri(R, 2, 9), ri(R, 2, 9)];
      if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) return logicItem(kind, R);
      return Object.assign({ eqs: [[[0, 1], v[0] + v[1]], [[1, 2], v[1] + v[2]], [[2, 0], v[2] + v[0]]], ask: 2 }, choices(R, v[2], [v[0], v[1], v[1] + v[2] - v[0], v[2] + 1])); }
  }
  return Object.assign({ seq }, choices(R, ans, near));
}
function glyph(t, x, y, s) {
  if (t === 0) return `<polygon points="${x},${y - s} ${x + s * 1.05},${y + s * .8} ${x - s * 1.05},${y + s * .8}" fill="${INK}"/>`;
  if (t === 1) return `<circle cx="${x}" cy="${y}" r="${s * .92}" fill="#fff" stroke="${INK}" stroke-width="${s * .32}"/>`;
  return `<rect x="${x - s * .85}" y="${y - s * .85}" width="${s * 1.7}" height="${s * 1.7}" fill="#a6a6a6" stroke="${INK}" stroke-width="${s * .26}"/>`;
}
function logicStem(it) {
  if (it.seq) return '<div class="seq">' + it.seq.map(v => '<b>' + v + '</b>').join('<i>,</i>') + '<i>,</i><b class="qm">?</b></div>';
  const rows = it.eqs.map(([ps, sum]) => {
    let s = '<svg viewBox="0 0 160 40">' + glyph(ps[0], 20, 20, 13) + '<text x="54" y="31" font-size="34" font-weight="900" text-anchor="middle" fill="' + INK + '">+</text>' + glyph(ps[1], 88, 20, 13) + '</svg>';
    return '<div class="eq">' + s + '<b>= ' + sum + '</b></div>';
  });
  rows.push('<div class="eq">' + '<svg viewBox="0 0 160 40">' + glyph(it.ask, 20, 20, 13) + '</svg><b>= <span class="qm">?</span></b></div>');
  return '<div class="eqs">' + rows.join('') + '</div>';
}
function logic() {
  return LOGIC.map((k, i) => { const it = logicItem(k, rng(77001 + i * 131)); it.stemHtml = logicStem(it); return it; });
}

/* ---------------- 공간: 같은 도형(돌린 것) 고르기, 나머지는 뒤집은 것 ---------------- */
const norm = cs => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(c => [c[0] - mx, c[1] - my]); };
const keyOf = (cs, dot) => { const n = norm(cs.concat(dot ? [dot] : [])); const d = dot ? n.pop() : null; return n.map(c => c.join(',')).sort().join(';') + '|' + (d ? d.join(',') : ''); };
const rot = c => [c[1], -c[0]];
const mir = c => [-c[0], c[1]];
function tf(cs, dot, r, m) {
  let a = cs.map(c => c.slice()), d = dot ? dot.slice() : null;
  if (m) { a = a.map(mir); if (d) d = mir(d); }
  for (let i = 0; i < r; i++) { a = a.map(rot); if (d) d = rot(d); }
  const all = norm(a.concat(d ? [d] : [])); const nd = d ? all.pop() : null;
  return { cs: all, dot: nd };
}
function poly(R, k) {
  for (let t = 0; t < 500; t++) {
    const cs = [[0, 0]], has = new Set(['0,0']);
    while (cs.length < k) {
      const b = pick(R, cs), d = pick(R, [[1, 0], [-1, 0], [0, 1], [0, -1]]), n = [b[0] + d[0], b[1] + d[1]];
      if (!has.has(n.join(','))) { has.add(n.join(',')); cs.push(n); }
    }
    const w = Math.max(...norm(cs).map(c => c[0])) + 1, h = Math.max(...norm(cs).map(c => c[1])) + 1;
    if (w > 4 || h > 4) continue;
    return norm(cs);
  }
}
function spaceItem(R, k, withDot) {
  for (let t = 0; t < 500; t++) {
    const cs = poly(R, k), dot = withDot ? pick(R, cs).slice() : null;
    const rk = [0, 1, 2, 3].map(r => keyOf(tf(cs, dot, r, 0).cs, tf(cs, dot, r, 0).dot));
    const mk = [0, 1, 2, 3].map(r => keyOf(tf(cs, dot, r, 1).cs, tf(cs, dot, r, 1).dot));
    if (new Set(rk).size < 4) continue;                       /* 돌려도 같으면 헷갈린다 */
    if (mk.some(x => rk.indexOf(x) >= 0)) continue;            /* 뒤집어도 같으면 정답이 둘 */
    const r = ri(R, 1, 3), mr = shuffle(R, [0, 1, 2, 3]).slice(0, 3);
    const opts = shuffle(R, [{ ok: 1, r, m: 0 }].concat(mr.map(x => ({ ok: 0, r: x, m: 1 }))));
    return { cs, dot, opts: opts.map(o => tf(cs, dot, o.r, o.m)), ans: opts.findIndex(o => o.ok) };
  }
}
function shapeSVG(s) {
  const w = Math.max(...s.cs.map(c => c[0])) + 1, h = Math.max(...s.cs.map(c => c[1])) + 1;
  const u = Math.min(84 / w, 84 / h), ox = 50 - w * u / 2, oy = 50 - h * u / 2;
  let o = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">`;
  for (const c of s.cs) o += `<rect x="${(ox + c[0] * u + 2.5).toFixed(1)}" y="${(oy + c[1] * u + 2.5).toFixed(1)}" width="${u}" height="${u}" fill="#c9c4b6"/>`;
  for (const c of s.cs) o += `<rect x="${(ox + c[0] * u).toFixed(1)}" y="${(oy + c[1] * u).toFixed(1)}" width="${u}" height="${u}" fill="#e6e1d4" stroke="${INK}" stroke-width="2.2"/>`;
  if (s.dot) o += `<circle cx="${(ox + (s.dot[0] + .5) * u).toFixed(1)}" cy="${(oy + (s.dot[1] + .5) * u).toFixed(1)}" r="${(u * .22).toFixed(1)}" fill="#d8404d"/>`;
  return o + '</svg>';
}
function space() {
  const out = [];
  for (let i = 0; i < 15; i++) {
    const k = Math.min(9, 5 + Math.floor(i / 3)), R = rng(88001 + i * 173);
    const it = spaceItem(R, k, i >= 9);
    it.stemSvg = shapeSVG({ cs: it.cs, dot: it.dot });
    it.optSvg = it.opts.map(shapeSVG);
    out.push(it);
  }
  return out;
}

/* ---------------- 음악: 가장 높은 음 · 바뀐 음 · 리듬 ---------------- */
const PENT = [60, 62, 64, 67, 69, 72, 74, 76];
function music() {
  const out = [], HI = [7, 4, 2, 1], DF = [5, 3, 2, 1];
  for (let lv = 0; lv < 4; lv++) {
    let R = rng(99001 + lv * 211);
    { const hi = ri(R, 66, 74), iv = HI[lv], t = shuffle(R, [hi - iv, hi - iv - ri(R, 2, 5)]);
      t.splice([0, 2, 1, 2][lv], 0, hi);   /* 정답 자리가 한쪽으로 몰리지 않게 */
      out.push({ mk: 'high', tones: t, n: 3, ans: t.indexOf(hi) }); }
    R = rng(99101 + lv * 211);
    { const mel = [];
      while (mel.length < 5) { const n = pick(R, PENT); if (n !== mel[mel.length - 1]) mel.push(n); }
      const p = ri(R, 1, 4), mel2 = mel.slice();
      let nv = mel[p] + (R() < 0.5 ? DF[lv] : -DF[lv]);
      if (nv === mel[p - 1] || nv === mel[p + 1]) nv = mel[p] * 2 - nv;
      mel2[p] = nv;
      out.push({ mk: 'diff', mel, mel2, n: 5, ans: p }); }
    R = rng(99201 + lv * 211);
    { const k = 3 + lv, steps = shuffle(R, [1, 2, 3, 4, 5, 6, 7]).slice(0, k - 1);
      const pat = steps.reduce((m, s) => m | (1 << s), 1);
      const alts = [];
      const push = m => { if (m !== pat && alts.indexOf(m) < 0 && (m & 1)) alts.push(m); };
      for (let t = 0; t < 60 && alts.length < 3; t++) {
        const on = [], off = [];
        for (let s = 1; s < 8; s++) ((pat >> s) & 1 ? on : off).push(s);
        const mode = lv < 2 ? pick(R, ['move', 'add', 'drop']) : 'move';
        if (mode === 'move' && on.length && off.length) {
          const a = pick(R, on), near = off.filter(b => Math.abs(b - a) === 1);
          const b = near.length && (lv >= 2 || R() < .5) ? pick(R, near) : pick(R, off);
          push((pat & ~(1 << a)) | (1 << b));
        } else if (mode === 'add' && off.length) push(pat | (1 << pick(R, off)));
        else if (mode === 'drop' && on.length > 1) push(pat & ~(1 << pick(R, on)));
      }
      const opts = shuffle(R, [pat].concat(alts.slice(0, 3)));
      out.push({ mk: 'rhy', pat, opts, n: 4, ans: opts.indexOf(pat) }); }
  }
  return out;
}
function rhythmSVG(m) {
  let o = '<svg viewBox="0 0 208 44" xmlns="http://www.w3.org/2000/svg">';
  for (let b = 0; b < 4; b++) o += `<rect x="${4 + b * 50}" y="4" width="48" height="36" rx="5" fill="${b % 2 ? '#f4f1e8' : '#fff'}" stroke="#c9c4b6" stroke-width="1.5"/>`;
  for (let s = 0; s < 8; s++) {
    const x = 16 + s * 25;
    o += (m >> s) & 1 ? `<rect x="${x - 8}" y="10" width="16" height="24" rx="3" fill="${INK}"/>` : `<circle cx="${x}" cy="22" r="2.6" fill="#b9b3a3"/>`;
  }
  return o + '</svg>';
}

/* ---------------- EQ 얼굴: 교과서 삽화처럼 먹선 한 벌 ---------------- */
const FACE = {
  joy:      { brow: [41, 40, 0], eye: 'happy', mouth: 'grin', cheek: 1 },
  sad:      { brow: [37, 44, 0], eye: [0.85, 0, 1.6], mouth: 'frown', tear: 1 },
  angry:    { brow: [47, 38, 0], eye: [0.62, 0, 0], mouth: 'teeth', crease: 1 },
  surprise: { brow: [37, 37, 0], eye: [1.55, 0, 0], mouth: 'o' },
  fear:     { brow: [36, 40, 0], eye: [1.45, 0, 0], mouth: 'scream', sweat: 1 },
  disgust:  { brow: [45, 41, 0], eye: [0.45, 0, 0], mouth: 'yuck', wrinkle: 1 },
  shy:      { brow: [39, 42, 0], eye: [0.8, 2.2, 1.6], mouth: 'wave', blush: 1, sweat: 1 },
  bored:    { brow: [44, 44, 0], eye: 'lid', look: [2.4, 0.6], mouth: 'flat', tilt: 7 },
  smug:     { brow: [42, 42, 1], eye: 'lid', look: [-1.6, 0], mouth: 'smirk', tilt: -5 },
};
function face(emo, alt) {
  const F = FACE[emo];
  let s = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
  s += `<path d="M10 101 Q12 84 34 81 L66 81 Q88 84 90 101 Z" fill="#e6e1d4" stroke="${INK}" stroke-width="2.2"/>`;
  s += `<rect x="43" y="74" width="14" height="10" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  s += `<g transform="rotate(${F.tilt || 0} 50 52)">`;
  if (alt) s += `<path d="M19 46 Q18 80 26 88 L32 70 Z M81 46 Q82 80 74 88 L68 70 Z" fill="#2b2b2b"/>`;
  s += `<ellipse cx="20" cy="56" rx="4.5" ry="7" fill="#fff" stroke="${INK}" stroke-width="2"/><ellipse cx="80" cy="56" rx="4.5" ry="7" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  s += `<ellipse cx="50" cy="53" rx="30" ry="33" fill="#fff" stroke="${INK}" stroke-width="2.4"/>`;
  s += `<path d="M66 28 Q82 44 79 64 Q74 80 56 85 Q72 70 70 50 Q69 36 66 28 Z" fill="#efebe1"/>`;
  s += alt ? `<path d="M19 50 Q16 20 50 17 Q84 20 81 48 Q72 29 54 28 Q44 32 30 31 Q22 34 19 48 Z" fill="#2b2b2b"/>`
           : `<path d="M20 48 Q18 18 50 16 Q82 18 80 46 Q78 31 70 28 Q66 33 58 30 Q52 34 44 30 Q36 33 30 29 Q23 32 20 46 Z" fill="#2b2b2b"/>`;
  s += `<path d="M38 22 Q50 18 62 22" fill="none" stroke="#5a5a5a" stroke-width="1.4" stroke-linecap="round"/>`;
  const [bi, bo, up] = F.brow;
  s += `<path d="M31 ${bo} Q38 ${Math.min(bi, bo) - 2} 45 ${bi}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
  s += `<path d="M69 ${bo - (up ? 5 : 0)} Q62 ${Math.min(bi, bo) - 2 - (up ? 5 : 0)} 55 ${bi - (up ? 3 : 0)}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
  for (const cx of [39, 61]) {
    if (F.eye === 'happy') { s += `<path d="M${cx - 6} 54 Q${cx} 46 ${cx + 6} 54" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`; continue; }
    if (F.eye === 'lid') {
      const [dx, dy] = F.look;
      s += `<ellipse cx="${cx}" cy="53" rx="5.4" ry="3.2" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`;
      s += `<circle cx="${cx + dx}" cy="${54 + dy}" r="2.3" fill="${INK}"/>`;
      s += `<path d="M${cx - 6.5} 51.5 L${cx + 6.5} 51.5" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
      continue;
    }
    const [op, dx, dy] = F.eye, ry = 4.2 * op;
    s += `<ellipse cx="${cx}" cy="53" rx="5.4" ry="${ry.toFixed(2)}" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`;
    s += `<circle cx="${cx + (cx < 50 ? dx : dx)}" cy="${53 + dy}" r="${op > 1.2 ? 1.8 : Math.min(2.5, ry * .7).toFixed(2)}" fill="${INK}"/>`;
  }
  s += `<path d="M50 56 Q48 62 50 64 Q52 65 54 63" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
  const M = {
    grin: `<path d="M36 67 Q50 82 64 67 Q50 71 36 67 Z" fill="${INK}"/><path d="M39 68.5 Q50 72 61 68.5 L60 71 Q50 74 40 71 Z" fill="#fff"/>`,
    frown: `<path d="M40 74 Q50 66 60 74" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    teeth: `<path d="M38 69 L62 69 L60 75 L40 75 Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M38.7 72 L61.3 72 M44 69 L44 75 M50 69 L50 75 M56 69 L56 75" stroke="${INK}" stroke-width="1.4"/>`,
    o: `<ellipse cx="50" cy="72" rx="5.5" ry="7.5" fill="${INK}"/>`,
    scream: `<path d="M37 70 Q50 66 63 70 Q64 77 61 79 Q50 75.5 39 79 Q36 77 37 70 Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M37.5 73.6 Q50 70.5 62.5 73.6 M44 68.4 L44 77.6 M50 67.8 L50 76.4 M56 68.4 L56 77.6" fill="none" stroke="${INK}" stroke-width="1.4"/>`,
    yuck: `<path d="M39 70 L58 66.5 Q63 69 60.5 75 L41 76 Q37 74 39 70 Z" fill="${INK}"/><path d="M45.5 75.6 Q49 85 54.5 75.2 Z" fill="#e88a92" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    wave: `<path d="M41 71 q2.2 -3 4.5 0 t4.5 0 t4.5 0 t4.5 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    flat: `<path d="M43 72 L58 71" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    smirk: `<path d="M41 72 Q52 74 60 66" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M59 64 Q62 66 60 69" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  };
  s += M[F.mouth];
  if (F.cheek) s += `<path d="M30 63 Q33 66 36 63 M64 63 Q67 66 70 63" fill="none" stroke="#9a9488" stroke-width="1.6" stroke-linecap="round"/>`;
  if (F.tear) s += `<path d="M34 59 Q31 65 33 68 Q36 70 37 66 Q37 63 34 59 Z" fill="#dfe6ec" stroke="${INK}" stroke-width="1.5"/>`;
  if (F.crease) s += `<path d="M48 43 L49 48 M52 43 L51 48" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
  if (F.sweat) s += `<path d="M75 35 Q71 42 73 45 Q76 47 78 44 Q79 41 75 35 Z" fill="#dfe6ec" stroke="${INK}" stroke-width="1.5"/>`;
  if (F.wrinkle) s += `<path d="M45 57 L47 59 M55 57 L53 59 M44 61 L46.5 61.5 M56 61 L53.5 61.5" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
  if (F.blush) for (const x of [30, 63]) s += `<path d="M${x} 66 L${x + 3} 61 M${x + 3.5} 66 L${x + 6.5} 61 M${x + 7} 66 L${x + 10} 61" stroke="#d8404d" stroke-width="1.8" stroke-linecap="round"/>`;
  return s + '</g></svg>';
}

/* 1교시 IQ 용: 같은 생성기, 다른 씨앗 */
function logicSet(kinds, seed) { return kinds.map((k, i) => { const it = logicItem(k, rng(seed + i * 131)); it.stemHtml = logicStem(it); return it; }); }
function spaceSet(ks, seed) {
  return ks.map((k, i) => { const it = spaceItem(rng(seed + i * 173), k, k >= 7); it.stemSvg = shapeSVG({ cs: it.cs, dot: it.dot }); it.optSvg = it.opts.map(shapeSVG); return it; });
}
/* 숫자 기억: 잠깐 보여 주고 가린 뒤 고르게 한다. 오답은 이웃 두 자리를 바꾸거나 한 자리를 바꾼 것 */
function memItem(R, len) {
  const d = []; while (d.length < len) { const x = ri(R, 1, 9); if (x !== d[d.length - 1]) d.push(x); }
  const s = d.join(''), out = [s];
  const swap = i => { const a = d.slice(); const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; return a.join(''); };
  for (let t = 0; t < 200 && out.length < 4; t++) {
    let c;
    if (out.length < 3) c = swap(ri(R, 1, len - 2));
    else { const a = d.slice(), i = ri(R, 1, len - 1); let v; do { v = ri(R, 1, 9); } while (v === a[i] || v === a[i - 1] || v === a[i + 1]); a[i] = v; c = a.join(''); }
    if (out.indexOf(c) < 0) out.push(c);
  }
  const opts = shuffle(R, out.slice());
  return { digits: s, opts, ans: opts.indexOf(s) };
}
window.GEN = { rng, shuffle, logic, space, shapeSVG, music, rhythmSVG, face, logicSet, spaceSet, memItem };
})();
