// 탈것 모델·성능표 — 승용차 여러 종, 트럭, 카트, ATV, 말, 자전거, 수레, 카약, 보트, 낚싯배, 서프보드, 잠수부, 패러글라이더, 잠수함, 여객선, 기차
(function () {
  const { mergeGeos, T } = GEO;
  const GLASS = [0.025, 0.035, 0.045], DARK = [0.035, 0.035, 0.04], HEAD = [1, 0.97, 0.85], TAIL = [0.95, 0.07, 0.04], BUMP = [0.16, 0.16, 0.17], BODY = [1, 1, 1], SKIN = [0.85, 0.7, 0.58], WOOD = [0.55, 0.4, 0.25];
  const TINT = [1, 0], NONE = [0, 0], GLOW = [0, 1], GLASSF = [0, -1], CHROME = [0, -2];
  // 유리 부품엔 유리 표식을 붙여 합친다
  function finish(L) { for (const it of L) if (it.c === GLASS) it.a = GLASSF; return mergeGeos(L); }
  const box = (w, h, d, x, y, z, c, a, ry) => ({ g: new THREE.BoxGeometry(w, h, d), m: T(x, y, z, 0, ry || 0, 0), c: c || BODY, a: a || TINT });
  const cyl = (r0, r1, h, x, y, z, rx, ry, rz, c, a, seg) => ({ g: new THREE.CylinderGeometry(r0, r1, h, seg || 10), m: T(x, y, z, rx || 0, ry || 0, rz || 0), c: c || DARK, a: a || NONE });
  const sph = (r, x, y, z, c, a, sx, sy, sz) => ({ g: new THREE.SphereGeometry(r, 10, 8), m: T(x, y, z, 0, 0, 0, sx || 1, sy || 1, sz || 1), c: c || BODY, a: a || NONE });
  function wheels(L, hx, zs, r, w) { for (const z of zs) for (const x of [-hx, hx]) { L.push(cyl(r, r, w || 0.26, x, r, z, 0, 0, Math.PI / 2, DARK, NONE, 14)); L.push(cyl(r * 0.58, r * 0.58, (w || 0.26) + 0.03, x, r, z, 0, 0, Math.PI / 2, [0.62, 0.63, 0.65], CHROME, 12)); } }
  function person(L, x, y, z, c) { L.push(box(0.42, 0.55, 0.28, x, y + 0.5, z, c || [0.2, 0.3, 0.6], NONE), sph(0.16, x, y + 0.95, z, SKIN)); }
  function lights(L, hx, zf, zb, y) { for (const x of [-hx, hx]) { L.push(box(0.42, 0.18, 0.08, x, y, zf, HEAD, GLOW), box(0.42, 0.16, 0.08, x, y, zb, TAIL, GLOW)); } }

  // 앞이 -z
  const G = {
    sedan() { const L = [box(1.78, 0.5, 4.4, 0, 0.68, 0), box(1.7, 0.5, 2.3, 0, 1.15, 0.15), box(1.74, 0.3, 2.34, 0, 1.13, 0.15, GLASS, NONE), { g: new THREE.BoxGeometry(1.5, 0.12, 0.9), m: T(0, 0.96, -1.5, 0.35), c: GLASS, a: NONE }]; lights(L, 0.62, -2.2, 2.2, 0.8); L.push(box(1.9, 0.18, 0.16, 0, 0.47, -2.2, BUMP, NONE), box(1.9, 0.18, 0.16, 0, 0.47, 2.2, BUMP, NONE)); wheels(L, 0.9, [-1.4, 1.4], 0.34); return finish(L); },
    sport() { const L = [box(1.86, 0.42, 4.5, 0, 0.6, 0), box(1.6, 0.4, 1.9, 0, 1.0, 0.3), box(1.64, 0.26, 1.94, 0, 0.98, 0.3, GLASS, NONE), { g: new THREE.BoxGeometry(1.5, 0.1, 1.0), m: T(0, 0.86, -1.3, 0.45), c: GLASS, a: NONE }, box(1.7, 0.08, 0.5, 0, 1.0, 2.2, DARK, NONE)]; lights(L, 0.66, -2.25, 2.25, 0.7); wheels(L, 0.95, [-1.45, 1.45], 0.36, 0.3); return finish(L); },
    suv() { const L = [box(1.9, 0.7, 4.7, 0, 0.85, 0), box(1.84, 0.7, 3.0, 0, 1.55, 0.3), box(1.88, 0.4, 3.04, 0, 1.55, 0.3, GLASS, NONE), box(1.2, 0.1, 2.4, 0, 1.95, 0.3, DARK, NONE)]; lights(L, 0.66, -2.35, 2.35, 1.0); L.push(box(2.0, 0.22, 0.2, 0, 0.55, -2.35, BUMP, NONE)); wheels(L, 0.95, [-1.5, 1.5], 0.42, 0.3); return finish(L); },
    camper() { const L = [box(1.9, 0.6, 5.4, 0, 0.8, 0), box(1.9, 1.5, 3.6, 0, 1.85, 0.6, [0.96, 0.95, 0.9], NONE), box(1.8, 0.8, 1.6, 0, 1.5, -1.9), box(1.84, 0.4, 1.64, 0, 1.55, -1.9, GLASS, NONE), box(0.6, 0.5, 1.2, 0.66, 1.9, 0.6, GLASS, NONE), box(2.6, 0.06, 2.0, 1.4, 2.7, 0.6, [0.9, 0.5, 0.3], NONE)]; lights(L, 0.66, -2.7, 2.7, 1.0); wheels(L, 0.95, [-1.8, 1.6], 0.4, 0.3); return finish(L); },
    open() { const L = [box(1.78, 0.5, 4.3, 0, 0.68, 0), { g: new THREE.BoxGeometry(1.5, 0.12, 0.9), m: T(0, 1.02, -1.0, 0.45), c: GLASS, a: NONE }, box(1.5, 0.35, 1.2, 0, 1.05, 0.5, [0.45, 0.3, 0.2], NONE)]; lights(L, 0.62, -2.15, 2.15, 0.8); wheels(L, 0.9, [-1.35, 1.35], 0.34); return finish(L); },   // 사람 둘은 뺐다 — 주인공 고양이가 탄다(pet.js)
    ev() { const L = [box(1.8, 0.52, 4.5, 0, 0.66, 0), { g: new THREE.BoxGeometry(1.7, 0.5, 2.8), m: T(0, 1.12, 0.1), c: BODY, a: TINT }, box(1.74, 0.32, 2.84, 0, 1.1, 0.1, GLASS, NONE), { g: new THREE.BoxGeometry(1.55, 0.1, 1.1), m: T(0, 0.95, -1.55, 0.5), c: GLASS, a: NONE }, box(1.4, 0.06, 0.1, 0, 0.82, -2.26, [0.6, 0.9, 1], GLOW), box(1.4, 0.06, 0.1, 0, 0.82, 2.26, TAIL, GLOW)]; wheels(L, 0.92, [-1.4, 1.4], 0.35); return finish(L); },
    truck() { const L = [box(1.8, 1.1, 1.7, 0, 1.25, -1.7), box(1.84, 0.4, 1.74, 0, 1.4, -1.7, GLASS, NONE), box(1.8, 0.55, 5.0, 0, 0.62, 0, [0.35, 0.36, 0.38], NONE), box(1.85, 0.12, 3.0, 0, 0.95, 0.75), box(0.06, 0.4, 3.0, -0.9, 1.2, 0.75), box(0.06, 0.4, 3.0, 0.9, 1.2, 0.75), box(1.85, 0.4, 0.06, 0, 1.2, 2.25)]; for (const x of [-0.65, 0.65]) L.push(box(0.36, 0.2, 0.08, x, 0.9, -2.56, HEAD, GLOW), box(0.3, 0.16, 0.08, x, 0.75, 2.52, TAIL, GLOW)); L.push(box(1.9, 0.2, 0.16, 0, 0.5, -2.55, BUMP, NONE)); wheels(L, 0.92, [-1.7, 1.5], 0.36); return finish(L); },
    bus() { const L = [box(2.3, 2.2, 9.5, 0, 1.6, 0), box(2.34, 0.8, 9.54, 0, 1.9, 0, GLASS, NONE), box(2.2, 1.6, 0.1, 0, 1.6, -4.76, GLASS, NONE)]; for (const x of [-0.8, 0.8]) L.push(box(0.4, 0.25, 0.08, x, 0.9, -4.78, HEAD, GLOW), box(0.4, 0.25, 0.08, x, 0.9, 4.78, TAIL, GLOW)); wheels(L, 1.05, [-3.2, 2.8], 0.45, 0.35); return finish(L); },
    kart() { const L = [box(0.9, 0.16, 1.8, 0, 0.3, 0), box(1.3, 0.14, 0.3, 0, 0.32, -0.95), box(1.3, 0.14, 0.3, 0, 0.32, 0.9), box(0.5, 0.4, 0.5, 0, 0.55, 0.35, [0.15, 0.15, 0.16], NONE), cyl(0.18, 0.18, 0.04, 0, 0.62, -0.25, 1.1, 0, 0, [0.1, 0.1, 0.1]), box(0.36, 0.5, 0.26, 0, 0.6, 0.4, [0.2, 0.3, 0.6], NONE), sph(0.16, 0, 1.02, 0.4, [0.9, 0.2, 0.2])]; wheels(L, 0.62, [-0.7, 0.75], 0.2, 0.24); return finish(L); },
    atv() { const L = [box(0.9, 0.5, 1.9, 0, 0.6, 0), box(0.6, 0.15, 0.7, 0, 0.9, 0.2, [0.15, 0.15, 0.16], NONE), cyl(0.03, 0.03, 0.8, 0, 1.05, -0.7, 0, 0, Math.PI / 2, DARK), box(1.2, 0.1, 0.5, 0, 0.5, -0.9, DARK, NONE), box(1.2, 0.1, 0.5, 0, 0.5, 0.9, DARK, NONE), box(0.36, 0.5, 0.26, 0, 1.2, 0.2, [0.3, 0.5, 0.2], NONE), sph(0.16, 0, 1.62, 0.2, [0.9, 0.9, 0.9])]; wheels(L, 0.55, [-0.75, 0.75], 0.32, 0.34); return finish(L); },
    horse() { const c = [0.45, 0.28, 0.16], d = [0.2, 0.12, 0.07]; const L = [box(0.5, 0.55, 1.3, 0, 1.15, 0.1, c, NONE), { g: new THREE.BoxGeometry(0.3, 0.7, 0.3), m: T(0, 1.6, -0.6, -0.5), c, a: NONE }, box(0.26, 0.28, 0.5, 0, 1.95, -0.85, c, NONE), box(0.1, 0.5, 0.1, 0, 1.75, -0.55, d, NONE), { g: new THREE.BoxGeometry(0.08, 0.6, 0.08), m: T(0, 1.15, 0.8, 0.5), c: d, a: NONE }, box(0.5, 0.08, 0.5, 0, 1.44, 0.05, [0.4, 0.25, 0.15], NONE), box(0.36, 0.5, 0.26, 0, 1.75, 0.05, [0.9, 0.4, 0.3], NONE), sph(0.16, 0, 2.18, 0.05, SKIN), cyl(0.18, 0.18, 0.06, 0, 2.3, 0.05, 0, 0, 0, [0.3, 0.25, 0.2], NONE, 12)]; for (const x of [-0.17, 0.17]) for (const z of [-0.45, 0.55]) L.push(box(0.14, 0.9, 0.14, x, 0.45, z, c, NONE)); return finish(L); },
    bicycle() { const L = [{ g: new THREE.TorusGeometry(0.34, 0.03, 6, 14), m: T(0, 0.34, -0.55, 0, Math.PI / 2, 0), c: DARK, a: NONE }, { g: new THREE.TorusGeometry(0.34, 0.03, 6, 14), m: T(0, 0.34, 0.55, 0, Math.PI / 2, 0), c: DARK, a: NONE }, { g: new THREE.BoxGeometry(0.04, 0.04, 0.9), m: T(0, 0.6, 0, 0.3), c: BODY, a: TINT }, { g: new THREE.BoxGeometry(0.04, 0.55, 0.04), m: T(0, 0.65, 0.2, 0.25), c: BODY, a: TINT }, { g: new THREE.BoxGeometry(0.04, 0.6, 0.04), m: T(0, 0.6, -0.45, -0.3), c: BODY, a: TINT }, box(0.5, 0.03, 0.03, 0, 0.95, -0.5, DARK, NONE), box(0.2, 0.05, 0.25, 0, 0.95, 0.25, DARK, NONE), box(0.36, 0.5, 0.26, 0, 1.25, 0.15, [0.9, 0.85, 0.3], NONE), sph(0.16, 0, 1.68, 0.05, SKIN)]; return finish(L); },
    cart() { const L = [box(1.2, 0.5, 1.6, 0, 0.55, 0.1, WOOD, NONE), box(1.1, 0.12, 1.5, 0, 0.9, 0.1, [0.9, 0.55, 0.15], NONE), box(0.6, 0.35, 0.5, 0, 0.5, -1.0), box(0.36, 0.5, 0.26, 0, 1.05, -0.95, [0.2, 0.5, 0.3], NONE), sph(0.16, 0, 1.48, -0.95, SKIN), cyl(0.15, 0.15, 0.06, 0, 1.1, -1.25, 0, 0, 0, [0.85, 0.75, 0.4], NONE, 12)]; wheels(L, 0.65, [-1.0, 0.5], 0.28, 0.2); return finish(L); },
    kayak() { const L = [sph(1, 0, 0.2, 0, BODY, TINT, 0.42, 0.22, 1.9), box(0.5, 0.15, 0.9, 0, 0.35, 0, [0.15, 0.15, 0.16], NONE), box(0.36, 0.45, 0.26, 0, 0.6, 0.1, [0.95, 0.5, 0.1], NONE), sph(0.16, 0, 0.98, 0.1, SKIN), cyl(0.02, 0.02, 2.2, 0, 0.75, -0.1, 0, 0, Math.PI / 2 - 0.35, [0.9, 0.9, 0.9]), box(0.3, 0.02, 0.15, -1.05, 1.1, -0.1, [0.9, 0.5, 0.1], NONE), box(0.3, 0.02, 0.15, 1.05, 0.4, -0.1, [0.9, 0.5, 0.1], NONE)]; return finish(L); },
    boat() { const L = [box(2.4, 0.9, 7.0, 0, 0.55, 0.3), { g: new THREE.ConeGeometry(1.2, 2.6, 4), m: T(0, 0.55, -4.4, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.75), c: BODY, a: TINT }, box(2.5, 0.12, 7.4, 0, 1.05, 0.2, [0.85, 0.75, 0.55], NONE), box(1.6, 0.9, 2.0, 0, 1.55, 0.6, [0.96, 0.96, 0.94], NONE), box(1.64, 0.4, 2.04, 0, 1.6, 0.6, GLASS, NONE), cyl(0.06, 0.08, 9, 0, 5.6, -0.6, 0, 0, 0, [0.9, 0.9, 0.9]), { g: new THREE.BoxGeometry(0.06, 7.5, 3.0), m: T(-0.1, 5.6, 0.9, 0, 0, 0), c: [0.97, 0.97, 0.95], a: NONE }]; person(L, 0, 1.1, 2.4); return finish(L); },
    fishing() { const L = [box(2.6, 1.0, 7.5, 0, 0.6, 0.3, [0.15, 0.3, 0.6], NONE), { g: new THREE.ConeGeometry(1.3, 2.6, 4), m: T(0, 0.6, -4.7, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.77), c: [0.15, 0.3, 0.6], a: NONE }, box(2.7, 0.12, 7.9, 0, 1.15, 0.2, [0.85, 0.75, 0.55], NONE), box(1.8, 1.4, 2.2, 0, 1.9, -1.2, [0.96, 0.96, 0.94], NONE), box(1.84, 0.5, 2.24, 0, 2.1, -1.2, GLASS, NONE), cyl(0.05, 0.05, 4, 0, 4.5, -1.2, 0, 0, 0, [0.8, 0.8, 0.8]), box(0.3, 0.3, 0.3, 0.9, 1.35, 2.5, [0.9, 0.5, 0.1], NONE), box(0.3, 0.3, 0.3, -0.9, 1.35, 2.5, [0.9, 0.5, 0.1], NONE)]; person(L, 0, 1.2, 1.8, [0.9, 0.7, 0.2]); return finish(L); },
    ferry() { const L = [box(6, 2.4, 22, 0, 1.5, 0, [0.95, 0.95, 0.93], NONE), { g: new THREE.ConeGeometry(3, 6, 4), m: T(0, 1.5, -13.5, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.8), c: [0.95, 0.95, 0.93], a: NONE }, box(6.2, 0.3, 23, 0, 0.5, 0, [0.15, 0.3, 0.6], NONE), box(5, 2.2, 12, 0, 3.8, 1, [0.97, 0.97, 0.95], NONE), box(5.1, 0.8, 12.1, 0, 4.2, 1, GLASS, NONE), box(3.6, 1.8, 4, 0, 5.8, -2, [0.97, 0.97, 0.95], NONE), cyl(0.5, 0.6, 2.5, 0, 7.5, 1.5, 0, 0, 0, [0.9, 0.2, 0.2], NONE, 12)]; return finish(L); },
    surf() { const L = [{ g: new THREE.BoxGeometry(0.6, 0.06, 2.4), m: T(0, 0.05, 0), c: BODY, a: TINT }, box(0.36, 0.5, 0.26, 0, 0.35, 0.1, [0.2, 0.2, 0.25], NONE), sph(0.16, 0, 0.78, 0.1, SKIN), box(0.12, 0.45, 0.12, -0.15, 0.1, 0.25, SKIN, NONE), box(0.12, 0.45, 0.12, 0.15, 0.1, -0.15, SKIN, NONE)]; return finish(L); },
    diver() { const L = [box(0.42, 0.7, 0.26, 0, 0, 0, [0.1, 0.12, 0.16], NONE), sph(0.16, 0, 0.5, 0, SKIN), box(0.3, 0.1, 0.05, 0, 0.5, -0.15, [0.3, 0.7, 0.9], NONE), box(0.12, 0.5, 0.1, -0.12, -0.6, 0, [0.1, 0.12, 0.16], NONE), box(0.12, 0.5, 0.1, 0.12, -0.6, 0, [0.1, 0.12, 0.16], NONE), box(0.16, 0.35, 0.03, -0.12, -0.98, 0, [0.9, 0.6, 0.1], NONE), box(0.16, 0.35, 0.03, 0.12, -0.98, 0, [0.9, 0.6, 0.1], NONE), sph(0.26, 0, 0.85, 0.4, [0.9, 0.5, 0.1], NONE, 1, 0.5, 1)]; return finish(L); },
    glider() { const L = []; for (let i = 0; i < 9; i++) { const a = (i - 4) / 4 * 0.9; L.push({ g: new THREE.BoxGeometry(1.35, 0.06, 2.2), m: T(Math.sin(a) * 5.2, 5.5 + Math.cos(a) * 1.4 - 1.4, 0, 0, 0, -a * 0.9), c: i % 2 ? [0.95, 0.3, 0.2] : [1, 0.85, 0.2], a: NONE }); } for (const x of [-4, -2, 0, 2, 4]) L.push(cyl(0.012, 0.012, 5, x * 0.9, 2.6, 0, 0, 0, x * 0.16, [0.9, 0.9, 0.9])); L.push(box(0.36, 0.5, 0.26, 0, 0.2, 0, [0.3, 0.3, 0.35], NONE), sph(0.16, 0, 0.65, 0, [0.9, 0.9, 0.9]), box(0.5, 0.4, 0.3, 0, -0.15, 0.1, [0.2, 0.25, 0.3], NONE)); return finish(L); },
    sub() { const L = [sph(1, 0, 0, 0, [0.95, 0.8, 0.1], NONE, 1.6, 1.4, 5), cyl(0.7, 0.7, 1.4, 0, 1.7, -0.5, 0, 0, 0, [0.95, 0.8, 0.1], NONE, 12), box(0.3, 0.6, 0.6, 0, 2.5, -0.5, [0.95, 0.8, 0.1], NONE), sph(0.35, 1.2, 0.2, -2, GLASS), sph(0.35, -1.2, 0.2, -2, GLASS), sph(0.35, 1.3, 0.2, 0, GLASS), sph(0.35, -1.3, 0.2, 0, GLASS), box(2.4, 0.08, 0.8, 0, 0, 4.6, [0.3, 0.3, 0.3], NONE)]; return finish(L); },
    train() { const L = [box(2.2, 2.2, 6, 0, 1.6, 0, [0.2, 0.55, 0.3], NONE), cyl(0.5, 0.5, 3, 0, 1.6, -1.5, Math.PI / 2, 0, 0, [0.15, 0.15, 0.15], NONE, 12), cyl(0.3, 0.4, 1.2, 0, 3.0, -2.3, 0, 0, 0, [0.15, 0.15, 0.15], NONE, 10), box(2.0, 1.6, 2.0, 0, 2.0, 1.6, [0.9, 0.75, 0.2], NONE), box(2.1, 0.7, 2.1, 0, 2.2, 1.6, GLASS, NONE)]; wheels(L, 1.0, [-1.8, 0, 1.8], 0.4, 0.2); return finish(L); },
  };
  const PARAMS = {
    car: { mesh: 'sedan', accel: 11, max: 52, rev: 9, grip: 7.5, steer: 0.62, tint: 0xd8321e },
    sport: { mesh: 'sport', accel: 15, max: 68, rev: 9, grip: 8.5, steer: 0.6, tint: 0xf2c218 },
    suv: { mesh: 'suv', accel: 9, max: 48, rev: 9, grip: 6, steer: 0.62, offroad: true, tint: 0x2f4f3f },
    camper: { mesh: 'camper', accel: 6, max: 36, rev: 7, grip: 6, steer: 0.55, tint: 0xf2efe6 },
    open: { mesh: 'open', accel: 12, max: 55, rev: 9, grip: 7.5, steer: 0.62, tint: 0xf2f2ef, glb: 'assets/models/bmw_open.glb', glbLen: 4.7, glbYaw: Math.PI, door: false },   // door: 한 덩어리 모델을 잘라 문을 만드는 방식(splitDoor) — 단면이 너덜거려 껐다(2026-09-08). 문 열린 별도 모델이 오면 바꿔치기로   // 오픈카 — Meshy 로 뽑은 남색 컨버터블(GLB, 앞이 모델 -x)
    ev: { mesh: 'ev', accel: 17, max: 60, rev: 9, grip: 8, steer: 0.62, quiet: true, tint: 0xe8ecef },
    kart: { mesh: 'kart', accel: 14, max: 24, rev: 4, grip: 12, steer: 0.85, tint: 0xd8321e, low: true },
    atv: { mesh: 'atv', accel: 9, max: 22, rev: 5, grip: 5, steer: 0.75, offroad: true, tint: 0xd8321e },
    horse: { mesh: 'horse', accel: 5, max: 13, rev: 2.5, grip: 9, steer: 0.9, offroad: true, tint: 0x6b4a2a, gallop: true },
    bicycle: { mesh: 'bicycle', accel: 3.5, max: 11, rev: 2, grip: 9, steer: 0.9, tint: 0x2a8ad4 },
    cart: { mesh: 'cart', accel: 4, max: 6, rev: 3, grip: 9, steer: 0.9, offroad: true, tint: 0x8a6a3a },
    kayak: { mesh: 'kayak', accel: 3, max: 7, rev: 2.5, grip: 1.6, steer: 0.9, water: true, tint: 0x3ad4d4 },
    boat: { mesh: 'boat', accel: 5, max: 18, rev: 3, grip: 2.2, steer: 0.5, water: true, tint: 0xf4f4f2 },
    fishing: { mesh: 'fishing', accel: 4, max: 13, rev: 3, grip: 2.2, steer: 0.5, water: true, tint: 0x2a4a8a },
    surf: { mesh: 'surf', accel: 7, max: 15, rev: 1.5, grip: 0.9, steer: 1.0, water: true, tint: 0xf2c218 },
    diver: { mesh: 'diver', accel: 4, max: 6, rev: 3, grip: 3, steer: 1.2, dive: true, tint: 0x111418 },
    glider: { mesh: 'glider', fly: true, tint: 0xffffff },
  };
  const mats = [];
  function material() {
    const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.08 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uGlow = { value: 0 }; m.userData.sh = sh;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aTint; attribute vec2 aCar; varying float vGlow; varying float vPaint; varying float vKind;').replace('#include <color_vertex>', '#include <color_vertex>\n vColor.rgb *= mix(vec3(1.0), aTint, aCar.x); vGlow = max(aCar.y, 0.0); vPaint = aCar.x; vKind = aCar.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow; varying float vGlow; varying float vPaint; varying float vKind;')
        .replace('float roughnessFactor = roughness;', 'float kGlass = step(vKind, -0.5) * step(-1.5, vKind); float kChrome = step(vKind, -1.5); float roughnessFactor = roughness; roughnessFactor = mix(roughnessFactor, 0.3, vPaint); roughnessFactor = mix(roughnessFactor, 0.05, kGlass); roughnessFactor = mix(roughnessFactor, 0.22, kChrome);')
        .replace('float metalnessFactor = metalness;', 'float metalnessFactor = metalness; metalnessFactor = mix(metalnessFactor, 0.55, vPaint); metalnessFactor = mix(metalnessFactor, 1.0, kChrome);')
        .replace('material.clearcoat = clearcoat;', 'material.clearcoat = clearcoat * max(vPaint, kGlass);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * vGlow * uGlow;');
    };
    mats.push(m); return m;
  }
  const GEOS = {};
  function geo(kind) { if (!GEOS[kind]) GEOS[kind] = G[kind](); return GEOS[kind]; }
  function makeMesh(kind, count) {
    const g = geo(kind).clone(); const tint = new Float32Array(count * 3);
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
    const m = new THREE.InstancedMesh(g, material(), count); m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; m.userData.tint = g.attributes.aTint; return m;
  }
  const _c = new THREE.Color();
  function setTint(mesh, i, color) { const a = mesh.userData.tint; _c.set(color); a.setXYZ(i, _c.r, _c.g, _c.b); a.needsUpdate = true; }
  function setNight(n) { for (const m of mats) if (m.userData.sh) m.userData.sh.uniforms.uGlow.value = 0.15 + 2.2 * n; }
  // 단독 메시 (소품용): 정점색만, 색조 지정
  function staticMesh(kind, color) { const m = makeMesh(kind, 1); setTint(m, 0, color || 0xffffff); return m; }

  window.CAR = { makeMesh, setTint, setNight, geo };
  window.VEH = { PARAMS, makeMesh, setTint, geo, staticMesh };
})();
