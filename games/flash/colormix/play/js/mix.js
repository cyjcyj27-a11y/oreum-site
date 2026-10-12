// 물감 섞기 색 계산 — tools/mix.py 와 같은 식. 물감 다섯: 빨강 R, 노랑 Y, 파랑 B, 흰색 W, 검정 K
(function () {
  const C = [
    [[0, 0, 0], [0.97, 0.95, 0.90]], [[1, 0, 0], [0.85, 0.19, 0.17]], [[0, 1, 0], [0.98, 0.80, 0.18]], [[0, 0, 1], [0.13, 0.33, 0.70]],
    [[1, 1, 0], [0.95, 0.50, 0.14]], [[1, 0, 1], [0.47, 0.20, 0.55]], [[0, 1, 1], [0.22, 0.58, 0.26]], [[1, 1, 1], [0.30, 0.19, 0.11]],
  ];
  const WHITE = [0.97, 0.95, 0.90], BLACK = [0.10, 0.10, 0.11];
  function ryb(r, y, b) {
    const o = [0, 0, 0];
    C.forEach(([[i, j, k], c]) => {
      const w = (i ? r : 1 - r) * (j ? y : 1 - y) * (k ? b : 1 - b);
      for (let n = 0; n < 3; n++) o[n] += w * c[n];
    });
    return o;
  }
  function rgb(v) {
    const [R, Y, B, W, K] = v, s = R + Y + B + W + K;
    if (!s) return WHITE.slice();
    const m = Math.max(R, Y, B);
    const base = m ? ryb(R / m, Y / m, B / m) : WHITE;
    const ch = (R + Y + B) / s, t = W / s, k = K / s;
    return [0, 1, 2].map((n) => base[n] * ch + WHITE[n] * t + BLACK[n] * k);
  }
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  function norm(v) {
    const g = v.filter((x) => x).reduce(gcd, 0) || 1;
    return v.map((x) => x / g);
  }
  const key = (v) => norm(v).join('');
  const css = (c, a) => a == null ? `rgb(${c.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255)).join(',')})` : `rgba(${c.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255)).join(',')},${a})`;
  const shade = (c, f) => c.map((x) => (f < 0 ? x * (1 + f) : x + (1 - x) * f));
  window.MIX = { rgb, norm, key, css, shade, PIG: [[1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 0, 0, 0, 1]] };
})();
