// 베를레 물리 — 점·막대·충돌. 무겁고 느릿한 INSIDE 식 몸놀림은 여기 숫자에서 나온다
(function () {
  function makePoint(x, y, z, mass, radius) {
    return { x, y, z, px: x, py: y, pz: z, ax: 0, ay: 0, az: 0, im: mass > 0 ? 1 / mass : 0, r: radius || 0.08, pinned: false, contact: null, name: '' };
  }
  function setPos(p, x, y, z) { p.x = p.px = x; p.y = p.py = y; p.z = p.pz = z; }
  function integrate(p, dt, drag) {
    if (p.pinned) { p.ax = p.ay = p.az = 0; return; }
    const vx = (p.x - p.px) * drag, vy = (p.y - p.py) * drag, vz = (p.z - p.pz) * drag;
    p.px = p.x; p.py = p.y; p.pz = p.z;
    p.x += vx + p.ax * dt * dt; p.y += vy + p.ay * dt * dt; p.z += vz + p.az * dt * dt;
    p.ax = p.ay = p.az = 0;
  }
  // 거리 제약. mode: 0 = 정확히, 1 = 최소(밀어내기만), -1 = 최대(당기기만)
  function stick(a, b, len, stiff, mode) {
    let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    let d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < 1e-6) { dx = 0; dy = 1e-4; dz = 0; d = 1e-4; }
    if (mode === 1 && d >= len) return;
    if (mode === -1 && d <= len) return;
    const w = a.im + b.im; if (w === 0) return;
    const diff = (d - len) / d * (stiff === undefined ? 1 : stiff);
    const ka = a.im / w, kb = b.im / w;
    if (!a.pinned) { a.x += dx * diff * ka; a.y += dy * diff * ka; a.z += dz * diff * ka; }
    if (!b.pinned) { b.x -= dx * diff * kb; b.y -= dy * diff * kb; b.z -= dz * diff * kb; }
  }
  // 지형 충돌 + 마찰
  function collideTerrain(p, friction) {
    if (p.pinned) return;
    const c = TERRAIN.collidePoint(p, p.r);
    p.contact = c;
    if (c && c.push > 0) {
      // 접선 속도 줄이기 (마찰). 느리면 아예 멈춘다 (정지 마찰) — 완만한 선반에서 미끄러져 내려가지 않게
      let vx = p.x - p.px, vy = p.y - p.py, vz = p.z - p.pz;
      const vn = vx * c.nx + vy * c.ny + vz * c.nz;
      let tx = vx - vn * c.nx, ty = vy - vn * c.ny, tz = vz - vn * c.nz;
      const f = friction === undefined ? 0.35 : friction;
      const vt = Math.sqrt(tx * tx + ty * ty + tz * tz);
      const keep = vt < 0.006 ? 0 : (1 - f);
      // 파고드는 속도는 버린다 (튀지 않게)
      const vnk = vn < 0 ? 0 : vn;
      p.px = p.x - (tx * keep + vnk * c.nx);
      p.py = p.y - (ty * keep + vnk * c.ny);
      p.pz = p.z - (tz * keep + vnk * c.nz);
    }
  }
  function speed(p) { return Math.sqrt((p.x - p.px) ** 2 + (p.y - p.py) ** 2 + (p.z - p.pz) ** 2); }
  function velY(p) { return p.y - p.py; }
  window.PHYS = { makePoint, setPos, integrate, stick, collideTerrain, speed, velY };
})();
