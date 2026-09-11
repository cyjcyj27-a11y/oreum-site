// 질감 — 전부 코드로 만든 타일 텍스처와 노멀맵 (풀밭, 아스팔트, 잎, 잔풀, 콘크리트). 그림 파일 없음
(function () {
  const N = NOISE.makeNoise(4242);
  const rng = NOISE.makeRng(2323); const R = () => rng();
  // 이어지는(토러스) 노이즈: 0..1
  function tnoise(u, v, f, oct) {
    const a1 = u * Math.PI * 2, a2 = v * Math.PI * 2, r = f / (Math.PI * 2) * 2;
    return 0.5 + 0.5 * N.fbm3(Math.cos(a1) * r, Math.sin(a1) * r + Math.cos(a2) * r * 0.7, Math.sin(a2) * r, oct || 4, 2.1, 0.5);
  }
  function canvas(W, Hh) { const c = document.createElement('canvas'); c.width = W; c.height = Hh || W; return c; }
  function tex(c, srgb) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  // 높이 캔버스(회색) → 노멀맵
  function normalFrom(hc, strength) {
    const W = hc.width, Hh = hc.height, src = hc.getContext('2d').getImageData(0, 0, W, Hh).data;
    const out = canvas(W, Hh), g = out.getContext('2d'), img = g.createImageData(W, Hh);
    const h = (x, y) => src[(((y + Hh) % Hh) * W + ((x + W) % W)) * 4] / 255;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const L = Math.hypot(dx, dy, 1); const i = (y * W + x) * 4;
      img.data[i] = (-dx / L * 0.5 + 0.5) * 255; img.data[i + 1] = (-dy / L * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / L * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return out;
  }
  function fill(c, fn) {
    const W = c.width, Hh = c.height, g = c.getContext('2d'), img = g.createImageData(W, Hh);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const p = fn(x / W, y / Hh, x, y); img.data[i] = p[0]; img.data[i + 1] = p[1]; img.data[i + 2] = p[2]; img.data[i + 3] = p.length > 3 ? p[3] : 255; }
    g.putImageData(img, 0, 0); return c;
  }

  const T = {};
  // 풀밭: 밝기 얼룩(정점색에 곱한다) + 요철
  function grass() {
    const S = 512;
    const hc = fill(canvas(S), (u, v) => { const a = tnoise(u, v, 6, 5), b = tnoise(u + 0.37, v + 0.11, 40, 3); const h = a * 0.6 + b * 0.4; const k = Math.floor(h * 255); return [k, k, k]; });
    const col = fill(canvas(S), (u, v) => { const a = tnoise(u, v, 6, 5), b = tnoise(u + 0.37, v + 0.11, 40, 3), c = tnoise(u + 0.7, v + 0.5, 120, 2); const l = 0.72 + 0.32 * (a * 0.5 + b * 0.3 + c * 0.2); const k = Math.min(255, l * 250); return [k * 1.02, k, k * 0.9]; });
    T.grass = tex(col, true); T.grassN = tex(normalFrom(hc, 2.2));
  }
  // 아스팔트: 잔 알갱이 + 얼룩 + 균열
  function asphalt() {
    const S = 512;
    const hc = fill(canvas(S), (u, v) => { const a = tnoise(u, v, 200, 2), b = tnoise(u + 0.2, v + 0.6, 9, 3); const h = a * 0.7 + b * 0.3; const k = Math.floor(h * 255); return [k, k, k]; });
    const col = fill(canvas(S), (u, v) => { const a = tnoise(u, v, 200, 2), b = tnoise(u + 0.2, v + 0.6, 9, 3); const l = 0.8 + 0.4 * (a * 0.6 + b * 0.4); const k = Math.min(255, l * 240); return [k, k, k * 1.03]; });
    // 균열 몇 줄
    const g = col.getContext('2d'); g.strokeStyle = 'rgba(70,70,72,0.35)'; g.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { g.beginPath(); let x = R() * S, y = R() * S; g.moveTo(x, y); for (let q = 0; q < 12; q++) { x += (R() - 0.5) * 40; y += (R() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    T.asphalt = tex(col, true); T.asphaltN = tex(normalFrom(hc, 1.2));
  }
  // 콘크리트/흙 (돌담·바위용 밝기 얼룩)
  function concrete() {
    const S = 256;
    const col = fill(canvas(S), (u, v) => { const a = tnoise(u, v, 30, 3), b = tnoise(u + 0.4, v + 0.2, 120, 2); const l = 0.82 + 0.36 * (a * 0.6 + b * 0.4); const k = Math.min(255, l * 240); return [k, k, k]; });
    const hc = fill(canvas(S), (u, v) => { const k = Math.floor(tnoise(u + 0.4, v + 0.2, 120, 2) * 255); return [k, k, k]; });
    T.concrete = tex(col, true); T.concreteN = tex(normalFrom(hc, 1.5));
  }
  // 잎 덩어리: 밝고 어두운 잎 얼룩 + 요철
  function leaf() {
    const S = 256;
    const hc = fill(canvas(S), (u, v) => { const k = Math.floor(tnoise(u, v, 60, 3) * 255); return [k, k, k]; });
    const col = fill(canvas(S), (u, v) => { const a = tnoise(u, v, 60, 3), b = tnoise(u + 0.3, v + 0.8, 14, 3); const l = 0.6 + 0.6 * (a * 0.6 + b * 0.4); const k = Math.min(255, l * 235); return [k * 0.95, k, k * 0.85]; });
    T.leaf = tex(col, true); T.leafN = tex(normalFrom(hc, 3));
  }
  // 잔풀 한 포기 (알파)
  function tuft() {
    const S = 128; const c = canvas(S, S), g = c.getContext('2d'); g.clearRect(0, 0, S, S);
    for (let k = 0; k < 26; k++) {
      const x0 = S * 0.5 + (R() - 0.5) * 40, top = S * (0.05 + R() * 0.35), lean = (R() - 0.5) * 50;
      const gcol = 'rgb(' + Math.floor(64 + R() * 50) + ',' + Math.floor(100 + R() * 55) + ',' + Math.floor(28 + R() * 30) + ')';
      g.strokeStyle = gcol; g.lineWidth = 2 + R() * 2.5; g.beginPath(); g.moveTo(x0, S); g.quadraticCurveTo(x0 + lean * 0.4, (S + top) / 2, x0 + lean, top); g.stroke();
    }
    // 꽃 몇 송이
    for (let k = 0; k < 3; k++) { if (R() < 0.8) continue; g.fillStyle = ['#f2d24a', '#f5f0e8', '#e86aa0'][k]; g.beginPath(); g.arc(S * 0.3 + R() * S * 0.4, S * 0.25 + R() * S * 0.3, 3.5, 0, 6.29); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; T.tuft = t;
  }
  // 창문 노멀맵: 창이 안으로 들어가 있다 (city.js 창 배치와 같은 8×8)
  function windowNormal(cw) {
    const S = 512; const hc = canvas(S), g = hc.getContext('2d'); g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, S, S);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const x = i * cw, y = j * cw; const wx = x + cw * 0.22, wy = y + cw * 0.2, ww = cw * 0.56, wh = cw * 0.52; g.fillStyle = '#707070'; g.fillRect(wx - 2, wy - 2, ww + 4, wh + 4); g.fillStyle = '#404040'; g.fillRect(wx, wy, ww, wh); g.fillStyle = '#d8d8d8'; g.fillRect(x, y + cw - 4, cw, 4); }
    // 콘크리트 알갱이
    const img = g.getImageData(0, 0, S, S); for (let k = 0; k < img.data.length; k += 4) { const n = (R() - 0.5) * 18; img.data[k] += n; img.data[k + 1] += n; img.data[k + 2] += n; } g.putImageData(img, 0, 0);
    T.windowN = tex(normalFrom(hc, 2.5));
  }
  function water() { const S = 256; const hc = fill(canvas(S), (u, v) => { const k = Math.floor((tnoise(u, v, 8, 4) * 0.6 + tnoise(u + 0.5, v + 0.3, 30, 3) * 0.4) * 255); return [k, k, k]; }); T.waterN = tex(normalFrom(hc, 2.0)); }
  // 늘 쓰는 질감만 미리 만든다. 풀·아스팔트·콘크리트는 사진(Poly Haven)이 대신하므로
  // 사진이 없을 때만 만든다 — 셋을 항상 만드느라 시작이 2초 넘게 늦었다 (사장님 2026-09-12 "좀 빠르게")
  function init() { leaf(); tuft(); water(); windowNormal(64); }
  function initFallback() { if (T.grass) return; grass(); asphalt(); concrete(); }

  // ── 사진 재질 (Poly Haven, CC0) — assets/tex/<이름>/map·normal·rough.jpg ──
  // 코드로 그린 위 질감 대신 진짜 사진을 쓴다. 땅·길·인도·벽·지붕·돌담.
  const P = {};
  function loadPBR(id) {
    const L = new THREE.TextureLoader(), base = 'assets/tex/' + id + '/';
    const one = (n, srgb) => new Promise(res => L.load(base + n + '.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
    return Promise.all([one('map', true), one('normal', false), one('rough', false)]).then(r => { P[id] = { map: r[0], normal: r[1], rough: r[2] }; });
  }
  const PHOTOS = ['asphalt_02', 'pavement_02', 'concrete_pavement', 'painted_plaster_wall', 'leafy_grass', 'forrest_ground_01', 'coast_sand_01', 'aerial_rocks_02', 'roof_09'];
  // file:// 로 열면 브라우저가 사진을 3D 재질로 못 올린다(보안). 그땐 사진을 건너뛰고 코드 질감을 쓴다. ?photos=0 도 같음
  function load() { if (location.protocol === 'file:' || new URLSearchParams(location.search).get('photos') === '0') { initFallback(); return Promise.resolve(); } return Promise.all(PHOTOS.map(loadPBR)).then(() => { if (!hasPhotos()) initFallback(); }); }
  function hasPhotos() { return !!(P.leafy_grass && P.leafy_grass.map); }
  // 같은 사진을 다른 반복 간격으로 쓸 때
  function rep(t, x, y) { if (!t) return null; const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; }
  window.TEX = Object.assign(T, { init, initFallback, load, hasPhotos, P, rep, tnoise, normalFrom, fill, canvas, tex });
})();
