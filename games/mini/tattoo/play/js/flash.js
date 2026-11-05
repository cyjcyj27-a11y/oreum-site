// 타투 도안(올드스쿨 플래시): 100칸 상자 안의 경로 → 점 목록, 그리고 벽에 거는 도안 그림 그리기
// 도안 하나 = 모양 여러 개 {d: SVG 경로(M L C Q Z, 절대 좌표), f: 채울 색 k/r/o/y/g/b 또는 없음}
// 선은 전부 검정(스텐실 = 이 선), 색은 f 가 있는 모양 안쪽
(function () {
  const F = (window.FLASH = {});
  F.COL = { n: '#f8efd8', k: '#18171b', r: '#c8312b', o: '#e0702a', y: '#f0bf2e', g: '#2e8a4c', b: '#2a6aa6' };
  F.COLKEYS = ['k', 'r', 'o', 'y', 'g', 'b'];

  // ---------- 경로 읽기 ----------
  F.parse = function (d) {
    const tk = d.match(/[MLCQZ]|-?\d*\.?\d+/g) || [];
    const subs = []; let cur = null, i = 0, cmd = '', x = 0, y = 0;
    const num = () => parseFloat(tk[i++]);
    const push = (px, py) => { cur.pts.push([px, py]); x = px; y = py; };
    while (i < tk.length) {
      if (/[MLCQZ]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'M') { cur = { pts: [], closed: false }; subs.push(cur); push(num(), num()); cmd = 'L'; }
      else if (cmd === 'L') push(num(), num());
      else if (cmd === 'C') {
        const x0 = x, y0 = y, x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
        const n = Math.max(6, Math.ceil(Math.hypot(x3 - x0, y3 - y0) / 2.5));
        for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3); }
      } else if (cmd === 'Q') {
        const x0 = x, y0 = y, x1 = num(), y1 = num(), x2 = num(), y2 = num();
        const n = Math.max(5, Math.ceil(Math.hypot(x2 - x0, y2 - y0) / 2.5));
        for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push(u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2); }
      } else if (cmd === 'Z') { cur.closed = true; const p = cur.pts[0]; x = p[0]; y = p[1]; cmd = ''; }
      else i++;
    }
    return subs;
  };
  // 모양 만들기 도우미(경로 문자열)
  const f1 = (v) => Math.round(v * 10) / 10;
  F.circle = (cx, cy, r) => { let s = ''; for (let k = 0; k <= 32; k++) { const a = (k / 32) * Math.PI * 2; s += (k ? 'L' : 'M') + f1(cx + Math.cos(a) * r) + ' ' + f1(cy + Math.sin(a) * r) + ' '; } return s + 'Z'; };
  F.ellipse = (cx, cy, rx, ry, rot) => { let s = ''; const c = Math.cos(rot || 0), sn = Math.sin(rot || 0); for (let k = 0; k <= 32; k++) { const a = (k / 32) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; s += (k ? 'L' : 'M') + f1(cx + x * c - y * sn) + ' ' + f1(cy + x * sn + y * c) + ' '; } return s + 'Z'; };
  F.poly = (pts, closed) => pts.map((p, k) => (k ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join(' ') + (closed === false ? '' : ' Z');
  const mirror = (d) => d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (m, a, b) => f1(100 - parseFloat(a)) + ' ' + b);

  // ---------- 도안 ----------
  // 10/24 사장님 "도안은 둘째 사진처럼 더 정교하게": 안쪽 잔선(깃털·꽃잎·잎맥·밧줄·핏방울)을 넣고, 호랑이·나방·불타는 하트를 더함
  const D = {};
  // 하트: 안쪽 그늘선 + 작은 반짝 별
  D.heart = { ko: '하트', en: 'Heart', w: 3.6, shapes: [
    { d: 'M50 88 C30 74 10 58 9 36 C8 20 20 9 34 10 C42 11 47 16 50 23 C53 16 58 11 66 10 C80 9 92 20 91 36 C90 58 70 74 50 88 Z', f: 'r' },
    { d: 'M78 24 C84 32 84 46 76 58 C70 66 62 72 56 76', f: null },
    { d: 'M86 6 L88 11 L93 12 L88 14 L86 19 L84 14 L79 12 L84 11 Z', f: 'y' },
  ], hi: ['M22 30 C23 23 28 19 34 19', 'M20 40 C21 44 22 47 24 50'] };
  // 별(노티컬 스타): 뾰족 끝마다 반은 검정 반은 빨강 + 바깥 테 별
  {
    const cx = 50, cy = 53, R = 44, r = 18, O = [], I = [], O2 = [], I2 = [];
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * Math.PI * 2) / 5, b = a + Math.PI / 5; O.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); I.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); O2.push([cx + Math.cos(a) * (R + 5), cy + Math.sin(a) * (R + 5)]); I2.push([cx + Math.cos(b) * (r + 4), cy + Math.sin(b) * (r + 4)]); }
    const sh = [];
    const ring = []; for (let k = 0; k < 5; k++) { ring.push(O2[k]); ring.push(I2[k]); }
    sh.push({ d: F.poly(ring), f: null });
    for (let k = 0; k < 5; k++) { const pi = I[(k + 4) % 5]; sh.push({ d: F.poly([[cx, cy], pi, O[k]]), f: 'k' }); sh.push({ d: F.poly([[cx, cy], O[k], I[k]]), f: 'r' }); }
    D.star = { ko: '별', en: 'Star', w: 3.8, shapes: sh };
  }
  // 번개: 겹선 + 끝 불꽃
  D.bolt = { ko: '번개', en: 'Bolt', w: 3.0, shapes: [
    { d: 'M60 4 L26 56 L47 56 L36 96 L76 40 L54 40 L70 4 Z', f: 'y' },
    { d: 'M62 10 L36 51 L52 51 L44 82', f: null },
    { d: 'M24 86 L30 80 M20 76 L28 74 M30 94 L34 86', f: null },
    { d: 'M76 6 L82 2 M80 14 L88 12 M70 0 L72 -2', f: null },
  ], hi: ['M58 10 L36 50'] };
  // 체리: 잎맥 + 작은 잎 하나 더 + 꼭지
  D.cherry = { ko: '체리', en: 'Cherries', w: 3.8, shapes: [
    { d: 'M54 14 C62 8 76 6 88 12 C80 22 66 24 56 20 Z', f: 'g' },
    { d: 'M56 17 C66 15 76 13 86 12', f: null },
    { d: 'M52 16 C46 8 38 4 28 6 C32 14 42 18 52 18 Z', f: 'g' },
    { d: 'M52 17 C44 13 36 9 30 7', f: null },
    { d: 'M54 16 C44 30 34 48 30 60', f: null },
    { d: 'M54 16 C58 32 64 48 66 62', f: null },
    { d: F.circle(28, 75, 17), f: 'r' },
    { d: F.circle(68, 77, 17), f: 'r' },
    { d: 'M24 60 C27 58 31 58 34 60', f: null }, { d: 'M64 62 C67 60 71 60 74 62', f: null },
  ], hi: ['M17 71 C18 65 22 61 27 60', 'M57 73 C58 67 62 63 67 62'] };
  // 닻: 밧줄이 감김 + 고리 안 + 팔 끝 그늘
  D.anchor = { ko: '닻', en: 'Anchor', w: 5.0, shapes: [
    { d: F.circle(50, 12, 8), f: 'b' },
    { d: F.circle(50, 12, 3.6), f: null },
    { d: 'M45.5 20 L54.5 20 L54.5 84 L45.5 84 Z', f: 'b' },
    { d: 'M45.5 28 L30 28 C26 28 24 30.5 24 32 C24 33.5 26 36 30 36 L45.5 36 Z', f: 'b' },
    { d: 'M54.5 28 L70 28 C74 28 76 30.5 76 32 C76 33.5 74 36 70 36 L54.5 36 Z', f: 'b' },
    { d: 'M50 95 C30 95 18 82 17 64 L25 64 C26 77 36 85 45.5 84 L54.5 84 C64 85 74 77 75 64 L83 64 C82 82 70 95 50 95 Z', f: 'b' },
    { d: 'M9 68 L21 49 L31 66 Z', f: 'b' },
    { d: 'M91 68 L79 49 L69 66 Z', f: 'b' },
    // 밧줄: 고리에서 내려와 몸통을 감고 오른팔로 늘어짐
    { d: 'M44 10 C34 14 34 24 44 26 C58 28 62 38 52 42 C40 46 38 54 50 58 C62 62 62 70 52 74 C44 78 46 86 58 88 C68 90 76 84 80 74', f: null },
    { d: 'M41 13 C37 17 37 22 41 24 M57 31 C59 34 58 38 55 40 M42 49 C40 51 41 54 44 56 M58 63 C60 66 59 69 56 71', f: null },
  ], hi: ['M48 24 L48 80', 'M22 74 C26 84 34 90 44 91'] };
  // 제비: 깃털 줄 + 눈테 + 꼬리 깃
  D.swallow = { ko: '제비', en: 'Swallow', w: 5.4, shapes: [
    { d: 'M62 40 C54 22 36 6 6 2 C14 12 20 20 24 26 C30 28 34 30 36 34 C38 40 42 44 46 48 Z', f: 'b' },
    { d: 'M24 26 C30 22 36 22 40 26', f: null }, { d: 'M36 34 C42 30 48 31 52 35', f: null }, { d: 'M14 12 C22 12 30 16 34 22', f: null },
    { d: 'M66 41 C76 34 88 34 94 41 L100 44 L93 47 C90 54 82 58 72 58 C60 58 48 62 38 70 L33 84 L28 71 L14 78 L21 64 C28 54 46 44 66 41 Z', f: 'b' },
    { d: 'M72 49 C80 52 87 51 93 47 C90 54 82 58 72 58 C62 58 52 61 44 66 C52 58 62 52 72 49 Z', f: 'r' },
    { d: 'M30 72 L26 66 M26 70 L20 70', f: null },
    { d: 'M66 56 C60 70 52 84 40 96 C58 90 70 76 76 58 Z', f: 'b' },
    { d: 'M62 70 C58 76 54 82 50 86', f: null },
    { d: F.circle(86, 41, 3.2), f: 'y' }, { d: F.circle(86, 41, 1.5), f: 'k' },
  ], hi: ['M50 22 C40 14 30 10 22 8', 'M54 70 C50 78 46 84 42 90'] };
  // 장미: 뒤 꽃잎 둘 + 잎맥 + 가시
  D.rose = { ko: '장미', en: 'Rose', w: 5.4, shapes: [
    { d: 'M30 62 C18 63 8 72 5 86 C18 87 30 79 35 66 Z', f: 'g' },
    { d: 'M30 63 C22 70 14 78 7 85', f: null }, { d: 'M22 70 L18 66 M16 77 L12 74', f: null },
    { d: 'M68 62 C80 62 92 70 96 83 C82 85 70 77 64 66 Z', f: 'g' },
    { d: 'M68 63 C78 70 86 76 94 82', f: null }, { d: 'M78 70 L82 66 M85 76 L89 73', f: null },
    { d: 'M47 66 C46 74 45 83 44 94 L49 94 C50 83 51 74 53 66 Z', f: 'g' },
    { d: 'M45.5 78 L41 76 L45.3 81 Z', f: 'g' }, { d: 'M50.5 86 L55 84 L50.2 89 Z', f: 'g' },
    { d: 'M26 26 C14 28 9 40 13 52 C16 58 22 61 28 60 C23 50 22 38 26 26 Z', f: 'r' },
    { d: 'M74 26 C86 28 91 40 87 52 C84 58 78 61 72 60 C77 50 78 38 74 26 Z', f: 'r' },
    { d: 'M23 40 C21 22 37 11 52 12 C68 12 81 25 77 42 C74 57 62 67 50 67 C35 67 25 56 23 40 Z', f: 'r' },
    { d: 'M30 31 C36 19 63 16 72 28', f: null },
    { d: 'M40 34 C42 25 57 23 61 32 C56 39 46 41 40 34 Z', f: null },
    { d: 'M46 31 C49 28 54 28 56 31', f: null },
    { d: 'M24 40 C30 49 42 51 50 44', f: null },
    { d: 'M77 40 C71 49 59 51 50 44', f: null },
    { d: 'M29 55 C39 63 61 63 71 55', f: null },
  ], hi: ['M28 40 C28 33 31 27 36 23', 'M62 60 C66 58 69 55 71 51'] };
  // 단검: 손잡이 감은 줄 + 날 홈 + 날 끝 핏방울
  D.dagger = { ko: '단검', en: 'Dagger', w: 3.4, shapes: [
    { d: F.circle(50, 7, 5.5), f: 'y' }, { d: F.circle(50, 7, 2.2), f: 'r' },
    { d: 'M45 12.5 L55 12.5 L55 27 L45 27 Z', f: 'r' },
    { d: 'M45 13 L55 18 M45 18 L55 23 M45 23 L55 27', f: null },
    { d: 'M26 30 C26 26 30 25 34 27 L66 27 C70 25 74 26 74 30 C74 34 70 35 66 33 L34 33 C30 35 26 34 26 30 Z', f: 'y' },
    { d: F.circle(25, 30, 3), f: 'y' }, { d: F.circle(75, 30, 3), f: 'y' },
    { d: 'M42 33 L58 33 L55 80 L50 92 L45 80 Z', f: null },
    { d: 'M50 33 L50 86', f: null }, { d: 'M46 40 L47.5 72', f: null },
    { d: 'M50 92 C46 96 46 100 50 100 C54 100 54 96 50 92 Z', f: 'r' },
  ], hi: ['M53 40 L52 74'] };
  // 해골: 광대·금·콧구멍·턱 경첩 + 눈 속 빛
  D.skull = { ko: '해골', en: 'Skull', w: 4.4, shapes: [
    { d: 'M50 8 C26 8 14 26 16 46 C17 56 22 62 28 64 L31 77 L69 77 L72 64 C78 62 83 56 84 46 C86 26 74 8 50 8 Z', f: null },
    { d: 'M32 79 L68 79 L66 88 C60 94 40 94 34 88 Z', f: null },
    { d: 'M26 44 C26 34 44 34 44 44 C44 54 26 54 26 44 Z', f: 'k' },
    { d: 'M56 44 C56 34 74 34 74 44 C74 54 56 54 56 44 Z', f: 'k' },
    { d: 'M50 53 L44 65 L56 65 Z', f: 'k' },
    { d: 'M41 77 L41 89', f: null }, { d: 'M47 77 L47 91', f: null }, { d: 'M53 77 L53 91', f: null }, { d: 'M59 77 L59 89', f: null },
    { d: 'M22 34 C28 28 38 28 44 32 M56 32 C62 28 72 28 78 34', f: null },
    { d: 'M20 56 C24 60 28 62 34 62 M80 56 C76 60 72 62 66 62', f: null },
    { d: 'M60 10 L58 18 L63 22 L60 28', f: null },
    { d: 'M29 72 L33 74 M71 72 L67 74', f: null },
  ], hi: ['M26 24 C30 18 36 14 42 13', 'M31 41 C32 39 34 38 36 38', 'M61 41 C62 39 64 38 66 38'] };
  // 나비: 날개 안쪽 테·맥 + 몸 마디
  {
    const up = 'M49 40 C40 20 18 6 8 18 C2 31 14 46 47 48 Z', lo = 'M48 51 C30 53 15 66 20 80 C28 91 42 79 49 59 Z';
    const upV = 'M47 44 C36 36 24 28 14 22 M47 46 C34 44 22 40 12 34', loV = 'M48 56 C40 62 32 70 26 78';
    D.butterfly = { ko: '나비', en: 'Butterfly', w: 5.0, shapes: [
      { d: up, f: 'b' }, { d: mirror(up), f: 'b' }, { d: lo, f: 'y' }, { d: mirror(lo), f: 'y' },
      { d: upV, f: null }, { d: mirror(upV), f: null }, { d: loV, f: null }, { d: mirror(loV), f: null },
      { d: F.circle(24, 26, 6), f: 'y' }, { d: F.circle(76, 26, 6), f: 'y' },
      { d: F.circle(24, 26, 2.4), f: 'k' }, { d: F.circle(76, 26, 2.4), f: 'k' },
      { d: F.circle(32, 72, 4.5), f: 'r' }, { d: F.circle(68, 72, 4.5), f: 'r' },
      { d: 'M50 31 C53 31 54 35 54 41 L53 70 C52 76 48 76 47 70 L46 41 C46 35 47 31 50 31 Z', f: 'k' },
      { d: 'M49 32 C46 23 42 17 36 13', f: null }, { d: 'M51 32 C54 23 58 17 64 13', f: null },
      { d: F.circle(36, 13, 1.6), f: 'k' }, { d: F.circle(64, 13, 1.6), f: 'k' },
    ], hi: ['M14 20 C18 14 24 12 30 13'] };
  }
  // 뱀: S자 몸 + 배 띠(노랑) + 비늘 줄 + 머리 비늘 + 갈라진 혀
  {
    const N = 40, L = [], Rr = [], C = [], B = [];
    const cen = (t) => [50 + 26 * Math.sin(t * Math.PI * 2.1 - 0.5) * (0.55 + 0.45 * t), 94 - 74 * t];
    for (let k = 0; k <= N; k++) {
      const t = k / N, p = cen(t), q = cen(Math.min(1, t + 0.01)), o = cen(Math.max(0, t - 0.01));
      let tx = q[0] - o[0], ty = q[1] - o[1]; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
      const w = 1.2 + 6.2 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2);
      L.push([p[0] - ty * w, p[1] + tx * w]); Rr.push([p[0] + ty * w, p[1] - tx * w]); B.push([p[0] + ty * w * 0.25, p[1] - tx * w * 0.25]); C.push({ p, tx, ty, w });
    }
    const e = C[N], hx = e.p[0] + e.tx * 7, hy = e.p[1] + e.ty * 7;
    const head = []; for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + (k / 16) * Math.PI, ca = Math.cos(a), sa = Math.sin(a); const fx = ca * 11, fy = sa * 8.5; head.push([hx + e.tx * fx - e.ty * fy, hy + e.ty * fx + e.tx * fy]); }
    const body = L.concat(head.slice().reverse()).concat(Rr.slice().reverse());
    const sh = [{ d: F.poly(body), f: 'g' }];
    // 배 띠: 오른쪽 가장자리와 안쪽 선 사이(머리 앞에서 멈춤)
    const bandEnd = N - 2; sh.push({ d: F.poly(Rr.slice(2, bandEnd).concat(B.slice(2, bandEnd).reverse())), f: 'y' });
    for (let k = 6; k < N - 2; k += 4) { const c = C[k]; sh.push({ d: F.poly([[c.p[0] - c.ty * c.w * 0.92, c.p[1] + c.tx * c.w * 0.92], [c.p[0] + c.ty * c.w * 0.2, c.p[1] - c.tx * c.w * 0.2]], false), f: null }); }
    // 머리 비늘(눈썹 줄)
    sh.push({ d: F.poly([[hx - e.ty * 6, hy + e.tx * 6], [hx + e.tx * 5 - e.ty * 3, hy + e.ty * 5 + e.tx * 3]], false), f: null });
    const tip = [hx + e.tx * 11, hy + e.ty * 11], t1 = [tip[0] + e.tx * 7, tip[1] + e.ty * 7];
    sh.push({ d: F.poly([tip, t1, [t1[0] + e.tx * 3 - e.ty * 3, t1[1] + e.ty * 3 + e.tx * 3]], false), f: null });
    sh.push({ d: F.poly([t1, [t1[0] + e.tx * 3 + e.ty * 3, t1[1] + e.ty * 3 - e.tx * 3]], false), f: null });
    sh.push({ d: F.circle(hx + e.tx * 3 - e.ty * 3.5, hy + e.ty * 3 + e.tx * 3.5, 2.2), f: 'y' });
    sh.push({ d: F.circle(hx + e.tx * 3 - e.ty * 3.5, hy + e.ty * 3 + e.tx * 3.5, 1), f: 'k' });
    D.snake = { ko: '뱀', en: 'Snake', w: 4.6, shapes: sh, hi: [] };
  }
  // 하트를 꿰뚫은 단검 + 흐르는 핏방울
  D.heartdagger = { ko: '하트와 단검', en: 'Heart & Dagger', w: 5.0, shapes: [
    { d: 'M50 84 C34 73 18 60 17 42 C16 29 26 20 37 21 C44 22 48 26 50 32 C52 26 56 22 63 21 C74 20 84 29 83 42 C82 60 66 73 50 84 Z', f: 'r' },
    { d: 'M72 32 C77 40 76 52 70 60', f: null },
    { d: F.circle(50, 5, 4.2), f: 'y' },
    { d: 'M46.5 9 L53.5 9 L53.5 18 L46.5 18 Z', f: 'k' },
    { d: 'M34 20 C34 17.5 37 17 40 18.5 L60 18.5 C63 17 66 17.5 66 20 C66 22.5 63 23.5 60 22 L54.5 22 L52.5 27 L47.5 27 L45.5 22 L40 22 C37 23.5 34 22.5 34 20 Z', f: 'y' },
    { d: 'M46.5 80 L53.5 80 L50 96 Z', f: null },
    { d: 'M38 78 C35 82 35 86 38 86 C41 86 41 82 38 78 Z', f: 'r' },
    { d: 'M60 84 C57.5 88 57.5 91 60 91 C62.5 91 62.5 88 60 84 Z', f: 'r' },
  ], hi: ['M26 38 C27 32 31 28 36 28'] };
  // 호랑이 머리(올드스쿨 정면, 입 벌림)
  {
    const earL = 'M16 22 L24 30 C20 33 17 36 16 39 C12 33 13 27 16 22 Z';
    const eyeL = 'M28 44 C32 37 41 37 44 43 C40 48 33 49 28 44 Z';
    const strL = ['M13 50 C20 49 26 51 31 56 C24 57 18 56 13 54 Z', 'M11 62 C18 60 24 62 29 66 C22 67 16 67 12 65 Z', 'M20 30 C26 32 30 36 32 40 C27 38 23 35 20 30 Z'];
    const sh = [
      // 머리: 볼 털이 들쭉날쭉(지그재그)
      { d: 'M50 14 C62 14 72 18 78 24 L88 14 C93 25 91 34 86 40 L92 46 L87 50 L94 58 L88 61 L92 70 L84 72 L84 80 L74 82 L66 90 L50 96 L34 90 L26 82 L16 80 L16 72 L8 70 L12 61 L6 58 L13 50 L8 46 L14 40 C9 34 7 25 12 14 L22 24 C28 18 38 14 50 14 Z', f: 'o' },
      { d: earL, f: 'r' }, { d: mirror(earL), f: 'r' },
      { d: 'M50 50 C58 50 66 54 71 62 L76 66 L70 70 L72 76 L64 79 L58 84 L50 86 L42 84 L36 79 L28 76 L30 70 L24 66 L29 62 C34 54 42 50 50 50 Z', f: 'n' },
      { d: 'M28 30 L36 34 M72 30 L64 34 M44 46 L46 54 M56 46 L54 54', f: null },
      { d: 'M50 17 L45 27 L50 34 L55 27 Z', f: 'k' },
      ...strL.map((d) => ({ d, f: 'k' })), ...strL.map((d) => ({ d: mirror(d), f: 'k' })),
      { d: eyeL, f: 'y' }, { d: mirror(eyeL), f: 'y' },
      { d: F.ellipse(37, 43.5, 2, 3.5), f: 'k' }, { d: F.ellipse(63, 43.5, 2, 3.5), f: 'k' },
      { d: 'M26 38 C32 33 40 34 46 39 M74 38 C68 33 60 34 54 39', f: null },
      { d: 'M43 57 L57 57 L50 65 Z', f: 'k' },
      { d: 'M50 65 L50 69', f: null },
      { d: 'M37 70 C43 73 57 73 63 70 C61 80 55 87 50 87 C45 87 39 80 37 70 Z', f: 'r' },
      { d: 'M40 71 L43 79 L46 72 Z', f: null }, { d: 'M60 71 L57 79 L54 72 Z', f: null },
      { d: 'M36 62 L22 60 M36 65 L20 66 M64 62 L78 60 M64 65 L80 66', f: null },
    ];
    D.tiger = { ko: '호랑이', en: 'Tiger', w: 5.8, shapes: sh, hi: ['M32 22 C38 18 44 17 48 17', 'M31 41 C33 40 35 40 37 41'] };
  }
  // 나방(해골 무늬 등): 검은 앞날개·주황 뒷날개·노란 몸
  {
    const fw = 'M48 40 C38 28 20 18 5 21 C3 30 10 40 22 46 C32 50 42 50 48 47 Z', hw = 'M48 52 C38 54 25 60 21 71 C25 79 38 77 48 62 Z';
    const fwL = 'M44 42 C34 36 22 30 10 26 M42 46 C32 44 22 42 14 38', hwL = 'M46 56 C38 60 30 66 26 72';
    D.moth = { ko: '나방', en: 'Moth', w: 5.6, shapes: [
      { d: fw, f: 'k' }, { d: mirror(fw), f: 'k' }, { d: hw, f: 'o' }, { d: mirror(hw), f: 'o' },
      { d: fwL, f: null }, { d: mirror(fwL), f: null }, { d: hwL, f: null }, { d: mirror(hwL), f: null },
      { d: F.circle(18, 28, 3), f: 'y' }, { d: F.circle(82, 28, 3), f: 'y' },
      { d: 'M50 30 C54 30 55 36 55 42 L54 74 C53 82 47 82 46 74 L45 42 C45 36 46 30 50 30 Z', f: 'y' },
      { d: 'M46 56 L54 56 M46 62 L54 62 M47 68 L53 68', f: null },
      { d: F.circle(50, 41, 4.2), f: 'k' }, { d: F.circle(48.4, 40.3, 1), f: null }, { d: F.circle(51.6, 40.3, 1), f: null },
      { d: F.circle(50, 27, 3), f: 'k' },
      { d: 'M49 25 C44 16 38 12 30 11 M51 25 C56 16 62 12 70 11', f: null },
    ], hi: ['M12 23 C18 20 24 20 30 22'] };
  }
  // 불타는 하트: 불꽃(주황·노랑) + 가시관 + 빛줄기
  D.burnheart = { ko: '불타는 하트', en: 'Burning Heart', w: 5.0, shapes: [
    { d: 'M50 38 C42 30 40 20 46 10 C47 18 50 20 52 22 C54 14 58 8 62 4 C62 14 66 22 62 32 C60 36 56 38 50 38 Z', f: 'o' },
    { d: 'M50 36 C46 30 46 24 49 18 C51 24 54 26 55 30 C56 26 58 22 60 18 C61 26 58 32 54 36 Z', f: 'y' },
    { d: 'M50 94 C34 83 18 70 17 52 C16 39 26 30 37 31 C44 32 48 36 50 42 C52 36 56 32 63 31 C74 30 84 39 83 52 C82 70 66 83 50 94 Z', f: 'r' },
    { d: 'M20 56 C34 50 66 50 80 56 M20 62 C34 56 66 56 80 62', f: null },
    { d: 'M28 53 L25 47 M40 51 L39 45 M60 51 L61 45 M72 53 L75 47 M30 63 L28 69 M50 59 L50 65 M70 63 L72 69', f: null },
    { d: 'M14 36 L6 32 M12 50 L3 50 M86 36 L94 32 M88 50 L97 50 M24 22 L18 14 M76 22 L82 14', f: null },
  ], hi: ['M26 46 C27 40 31 36 36 36'] };
  F.D = D;
  F.KEYS = Object.keys(D);

  // 점 목록으로 풀어 둠(한 번만)
  F.get = function (id) {
    const ds = D[id];
    if (!ds._p) ds._p = ds.shapes.map((s) => ({ f: s.f || null, subs: F.parse(s.d) }));
    return ds;
  };

  // ---------- 벽에 거는 도안 그림 ----------
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pathOf = (g, subs, s, ox, oy) => { g.beginPath(); subs.forEach((sp) => { sp.pts.forEach((p, k) => (k ? g.lineTo(ox + p[0] * s, oy + p[1] * s) : g.moveTo(ox + p[0] * s, oy + p[1] * s))); if (sp.closed) g.closePath(); }); };
  // 누렇게 바랜 종이
  F.paper = function (g, w, h, seed) {
    const R = rng(seed || 3);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f3e5bf'); gr.addColorStop(1, '#e6d09e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 60; i++) { g.fillStyle = R() < 0.5 ? 'rgba(120,90,40,.07)' : 'rgba(255,250,230,.12)'; g.fillRect(R() * w, R() * h, 1 + R() * 2, 1); }
    for (let i = 0; i < 4; i++) { const x = R() * w, y = R() * h, r = (0.1 + R() * 0.25) * Math.max(w, h); const sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, 'rgba(150,110,50,.13)'); sg.addColorStop(1, 'rgba(150,110,50,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h); }
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(120,80,30,0)'); vg.addColorStop(1, 'rgba(120,80,30,.32)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  };
  // 도안 그리기: (x, y) 왼쪽 위, size 픽셀 = 100칸
  F.draw = function (g, id, x, y, size, opt) {
    opt = opt || {};
    const ds = F.get(id), s = size / 100, R = rng(id.length * 977 + 13);
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    // 색 칠하기
    if (opt.fill !== false) ds._p.forEach((sh) => { if (!sh.f) return; pathOf(g, sh.subs, s, x, y); g.fillStyle = F.COL[sh.f]; g.fill('evenodd'); });
    // 검은 점 그늘(오른쪽 아래가 짙게)
    if (opt.dots !== false && opt.fill !== false) {
      ds._p.forEach((sh) => {
        if (!sh.f || sh.f === 'k' || sh.f === 'n') return;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; sh.subs.forEach((sp) => sp.pts.forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }));
        g.save(); pathOf(g, sh.subs, s, x, y); g.clip('evenodd'); g.fillStyle = F.COL.k;
        const n = Math.round((x1 - x0) * (y1 - y0) * 0.5);
        for (let i = 0; i < n; i++) { const u = R(), v = R(); const w = Math.pow(Math.max(0, (u + v) - 1.05), 1.6) * 2.2; if (R() > w) continue; g.beginPath(); g.arc(x + (x0 + u * (x1 - x0)) * s, y + (y0 + v * (y1 - y0)) * s, Math.max(0.6, size * 0.006), 0, 7); g.fill(); }
        g.restore();
      });
    }
    // 흰 반짝 띠
    if (opt.hi !== false && opt.fill !== false && ds.hi) { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = size * 0.022; ds.hi.forEach((h) => { pathOf(g, F.parse(h), s, x, y); g.stroke(); }); }
    // 검은 선
    g.strokeStyle = opt.lineColor || F.COL.k; g.lineWidth = Math.max(1.2, size * (opt.lw || 0.03));
    ds._p.forEach((sh) => { pathOf(g, sh.subs, s, x, y); g.stroke(); });
    g.restore();
  };
  // 도안 상자 크기(100칸 안에서 실제로 쓰는 범위)
  F.bbox = function (id) {
    const ds = F.get(id); if (ds._bb) return ds._bb;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; ds._p.forEach((sh) => sh.subs.forEach((sp) => sp.pts.forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); })));
    return (ds._bb = { x0, y0, x1, y1 });
  };
})();
