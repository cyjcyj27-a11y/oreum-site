// world.js — 사막 땅·메사·선인장·마을·은신처·충돌
(function () {
  const { S, loadGLB, fitStatic } = CORE;
  const V3 = THREE.Vector3, PI = Math.PI;
  let seed = 20261001; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();
  const EDGE = 400; // 이 반지름 밖으로는 못 나간다

  // ── 은신처(현상범이 숨어 있는 곳) ──
  const SITES = {
    hay:    { x: 64,   z: 46,   kind: 'hay' },
    camp1:  { x: -96,  z: 84,   kind: 'camp' },
    flats:  { x: 38,   z: -124, kind: 'wreck' },
    camp2:  { x: -150, z: -60,  kind: 'camp' },
    ranch:  { x: 176,  z: 70,   kind: 'ranch' },
    wagon:  { x: -40,  z: 190,  kind: 'wagon' },
    canyon: { x: -250, z: -160, kind: 'camp' },
    mine:   { x: 254,  z: -150, kind: 'mine' },
    ghost:  { x: -270, z: 170,  kind: 'ghost' },
    tower:  { x: 150,  z: 250,  kind: 'tower' },
    gulch:  { x: -120, z: -290, kind: 'camp' },
    camp3:  { x: 300,  z: 120,  kind: 'camp' },
    grave:  { x: -330, z: -20,  kind: 'grave' },
    fort:   { x: 0,    z: -330, kind: 'fort' }
  };
  const TOWN = { board: new V3(-30, 0, -3.6), jail: new V3(-41.5, 0, -4.6), store: new V3(13, 0, 5.4), start: new V3(-22, 0, 1.5), horse: new V3(-17, 0, 3.2) };

  // ── 높이 ──
  const rawH = (x, z) => Math.sin(x * 0.013 + 1.3) * Math.cos(z * 0.011 - 0.4) * 2.4 + Math.sin(x * 0.031 + z * 0.027) * 0.8 + Math.sin(z * 0.05 - x * 0.02) * 0.35;
  const FLATS = [{ x: 0, z: 0, r: 72, h: 0 }];
  Object.values(SITES).forEach(s => FLATS.push({ x: s.x, z: s.z, r: s.kind === 'fort' ? 34 : s.kind === 'ghost' || s.kind === 'ranch' ? 30 : 18, h: rawH(s.x, s.z) }));
  const sm = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  function heightAt(x, z) {
    let h = rawH(x, z);
    for (let i = 0; i < FLATS.length; i++) { const f = FLATS[i], dx = x - f.x, dz = z - f.z, d2 = dx * dx + dz * dz, R = f.r + 26; if (d2 < R * R) { const t = sm(f.r, R, Math.sqrt(d2)); h = f.h + (h - f.h) * t; } }
    return h;
  }

  // ── 충돌: 타원(메사·바위·선인장)과 네모(건물). 20m 칸에 나눠 담는다 ──
  const COLS = [], GRID = new Map(), CELL = 20;
  function addCol(c) { // {x,z,rx,rz} 또는 {x0,x1,z0,z1}, tag
    COLS.push(c);
    const ex = c.bx || c.rx, ez = c.bz || c.rz;   // tab(울퉁불퉁 경계)이 있으면 그 바깥 끝까지 칸에 넣는다
    const x0 = c.rx !== undefined ? c.x - ex : c.x0, x1 = c.rx !== undefined ? c.x + ex : c.x1, z0 = c.rx !== undefined ? c.z - ez : c.z0, z1 = c.rx !== undefined ? c.z + ez : c.z1;
    for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) { const k = i * 4096 + j; let a = GRID.get(k); if (!a) GRID.set(k, a = []); a.push(c); }
    return c;
  }
  function removeCol(c) { c.dead = true; }
  // 메사처럼 각도마다 반지름이 다른 경계: 각도 a(타원 좌표)에서 경계 배율
  function tabF(c, a) { const N = c.tab.length, u = ((a / (Math.PI * 2)) % 1 + 1) % 1 * N, k = Math.floor(u), t = u - k; return c.tab[k % N] * (1 - t) + c.tab[(k + 1) % N] * t; }
  // (x,z) 가 들어가 있는 메사 경계(tab) 충돌체를 돌려준다(except 는 빼고, 없으면 null)
  function inTab(x, z, r, except) {
    const i0 = Math.floor((x - r) / CELL), i1 = Math.floor((x + r) / CELL), j0 = Math.floor((z - r) / CELL), j1 = Math.floor((z + r) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = GRID.get(i * 4096 + j); if (!a) continue;
      for (let n = 0; n < a.length; n++) { const c = a[n]; if (c === except || c.dead || !c.tab) continue;
        const dx = x - c.x, dz = z - c.z, an = Math.atan2(dz / c.rz, dx / c.rx), rn = Math.hypot(dx / c.rx, dz / c.rz), R = Math.hypot(Math.cos(an) * c.rx, Math.sin(an) * c.rz) || 1;
        if (rn < tabF(c, an) + r / R) return c; }
    }
    return null;
  }
  // 붙은 메사 사이(골짜기 양쪽 메사처럼 경계가 겹치는 곳): 한쪽(c)이 밀어낸 자리가 다른 쪽(c2) 속이면 번갈아 밀리다가 한 프레임에 30m 를 튕겨 절벽 반대편으로 넘어갔다
  // (10/6 사장님 "은행강도가 도망갈 때 절벽을 뚫고 지나간다"). 그럴 땐 밀어내지 않고, 각 메사 바깥쪽·두 메사를 잇는 선의 직각(골짜기 축)·그 사이 여덟 방향으로 0.2m 씩 더듬어
  // 어느 메사에도 안 들어간 가장 가까운 자리로 되돌린다(들어온 만큼만, 늘 골짜기 입구 쪽이라 벽 타기가 그쪽으로 돈다). 북쪽부터 돌아가며 찾으면 자리가 들쭉날쭉해 오목한 데서 제자리를 맴돌았다
  function seekFree(pos, r, c, c2) {
    const x0 = pos.x, z0 = pos.z, dirs = [], put = (dx, dz) => { const l = Math.hypot(dx, dz) || 1; dirs.push([dx / l, dz / l]); };
    put(x0 - c.x, z0 - c.z); put(x0 - c2.x, z0 - c2.z); const lx = c2.x - c.x, lz = c2.z - c.z; put(-lz, lx); put(lz, -lx);
    for (let i = 0; i < 4; i++) { const p = dirs[i], q = dirs[(i + 1) % 4]; put(p[0] + q[0], p[1] + q[1]); }
    let best = 1e9, bx = 0, bz = 0;
    // 빈자리는 그 방향으로 2m 더 트여 있어야 한다(골짜기 맨 안쪽의 손바닥만 한 빈틈으로 돌아가면 거기서 영영 못 나온다). 그런 자리가 없으면 트인 조건 없이 가장 가까운 빈자리
    for (let pass = 0; pass < 2 && best === 1e9; pass++)
      for (let k = 0; k < dirs.length; k++) { const sx = dirs[k][0], sz = dirs[k][1]; for (let d = 0.2; d <= 8 && d < best; d += 0.2) { const x = x0 + sx * d, z = z0 + sz * d; if (inTab(x, z, r, null)) continue;
        let ok = true; if (pass === 0) for (let e = 0.4; e <= 2.01; e += 0.4) if (inTab(x + sx * e, z + sz * e, r, null)) { ok = false; break; }
        if (ok) { best = d; bx = x; bz = z; break; } } }
    if (best < 1e9) { pos.x = bx; pos.z = bz; return true; } return false;
  }
  // pos 를 밀어내고 부딪힌 것의 tag 를 돌려준다(없으면 null)
  function collide(pos, r) {
    let hit = null;
    const i0 = Math.floor((pos.x - r) / CELL), i1 = Math.floor((pos.x + r) / CELL), j0 = Math.floor((pos.z - r) / CELL), j1 = Math.floor((pos.z + r) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = GRID.get(i * 4096 + j); if (!a) continue;
      for (let n = 0; n < a.length; n++) {
        const c = a[n]; if (c.dead) continue;
        if (c.tab) {   // 울퉁불퉁 경계(메사): 그 각도의 경계 밖으로 밀어낸다
          const dx = pos.x - c.x, dz = pos.z - c.z, a = Math.atan2(dz / c.rz, dx / c.rx), rn = Math.hypot(dx / c.rx, dz / c.rz), ca = Math.cos(a), sa = Math.sin(a), R = Math.hypot(ca * c.rx, sa * c.rz) || 1, fb = tabF(c, a) + r / R;
          if (rn < fb) { const nx = c.x + ca * c.rx * fb, nz = c.z + sa * c.rz * fb;
            const c2 = inTab(nx, nz, r, c); if (!c2 || !seekFree(pos, r, c, c2)) { pos.x = nx; pos.z = nz; }   // 밀어낸 자리가 다른 메사 속이면(붙은 메사 사이) 가장 가까운 빈자리로
            hit = c.tag || 'rock'; }
        } else if (c.rx !== undefined) {
          const ex = c.rx + r, ez = c.rz + r, ux = (pos.x - c.x) / ex, uz = (pos.z - c.z) / ez, l = ux * ux + uz * uz;
          if (l < 1) { const k = 1 / Math.sqrt(l || 1e-6); pos.x = c.x + ux * k * ex; pos.z = c.z + uz * k * ez; hit = c.tag || 'rock'; hit === 'cactus' && (collide.last = c); }
        } else if (pos.x > c.x0 - r && pos.x < c.x1 + r && pos.z > c.z0 - r && pos.z < c.z1 + r) {
          const dl = pos.x - (c.x0 - r), dr = (c.x1 + r) - pos.x, dt = pos.z - (c.z0 - r), db = (c.z1 + r) - pos.z, m = Math.min(dl, dr, dt, db);
          if (m === dl) pos.x = c.x0 - r; else if (m === dr) pos.x = c.x1 + r; else if (m === dt) pos.z = c.z0 - r; else pos.z = c.z1 + r;
          hit = c.tag || 'wall';
        }
      }
    }
    const d = Math.hypot(pos.x, pos.z); if (d > EDGE) { pos.x *= EDGE / d; pos.z *= EDGE / d; hit = hit || 'edge'; }
    return hit;
  }
  // 도망 길찾기용: 가까운 장애물에서 밀어내는 방향
  function avoid(x, z, look, out) {
    out.x = 0; out.z = 0;
    const i0 = Math.floor((x - look) / CELL), i1 = Math.floor((x + look) / CELL), j0 = Math.floor((z - look) / CELL), j1 = Math.floor((z + look) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = GRID.get(i * 4096 + j); if (!a) continue;
      for (let n = 0; n < a.length; n++) {
        const c = a[n]; if (c.dead || c.seen === avoid.n) continue; c.seen = avoid.n;
        let cx, cz, cr;
        if (c.tab) { cx = c.x; cz = c.z; const a = Math.atan2((z - cz) / c.rz, (x - cx) / c.rx); cr = tabF(c, a) * Math.hypot(Math.cos(a) * c.rx, Math.sin(a) * c.rz); }
        else if (c.rx !== undefined) { cx = c.x; cz = c.z; cr = Math.max(c.rx, c.rz); } else { cx = (c.x0 + c.x1) / 2; cz = (c.z0 + c.z1) / 2; cr = Math.hypot(c.x1 - c.x0, c.z1 - c.z0) / 2; }
        const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz) - cr;
        if (d < look) { const w = (1 - Math.max(0, d) / look) / (Math.hypot(dx, dz) || 1); out.x += dx * w; out.z += dz * w; }
      }
    }
    avoid.n++;
    const d = Math.hypot(x, z); if (d > EDGE - 40) { const w = (d - (EDGE - 40)) / 40 * 2.5 / d; out.x -= x * w; out.z -= z * w; }
    return out;
  }
  avoid.n = 1;

  // ── 도형 합치기(꼭짓점 색) ──
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _p = new V3();
  function M4(x, y, z, ry, rx, rz, sx, sy, sz) { _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e); return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx || 1, sy || sx || 1, sz || sx || 1)); }
  function bake(geo, m4, hex, jitter) {
    const g = geo.index ? geo.toNonIndexed() : geo; if (m4) g.applyMatrix4(m4);
    const n = g.attributes.position.count, c = new Float32Array(n * 3), col = new THREE.Color(hex);
    for (let i = 0; i < n; i += 3) { const k = jitter ? 1 + (rnd() - 0.5) * jitter : 1; for (let v = 0; v < 3; v++) { c[(i + v) * 3] = col.r * k; c[(i + v) * 3 + 1] = col.g * k; c[(i + v) * 3 + 2] = col.b * k; } }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
  }
  function merge(list, uv) {
    let n = 0; list.forEach(g => n += g.attributes.position.count);
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), U = uv ? new Float32Array(n * 2) : null; let o = 0;
    list.forEach(g => { const c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); if (U && g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); });
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3)); if (U) G.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    return G;
  }
  // 널빤지 무늬가 실제 크기(2m 에 한 번)로 깔리게 uv 를 면 크기만큼 늘린 상자
  function boxUV(w, h, d) {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / 2, uv.getY(i) * dims[f][1] / 2); }
    return g;
  }
  // 조립 통: wood(널빤지 무늬), plain(무늬 없음), glow(불 켜진 창)
  const BIN = { wood: [], plain: [], glow: [], dark: [] };
  class Kit {
    constructor(x, z, ry, y) { this.base = M4(x, y !== undefined ? y : heightAt(x, z), z, ry || 0); this.x = x; this.z = z; this.ry = ry || 0; }
    put(bin, geo, hex, x, y, z, o) { o = o || {}; const m = this.base.clone().multiply(M4(x, y, z, o.ry, o.rx, o.rz, o.sx, o.sy, o.sz)); BIN[bin].push(bake(geo, m, hex, o.j === undefined ? 0.1 : o.j)); return this; }
    box(w, h, d, hex, x, y, z, o) { return this.put((o && o.bin) || 'wood', boxUV(w, h, d), hex, x, y + h / 2, z, o); }
    cyl(r0, r1, h, hex, x, y, z, o) { return this.put((o && o.bin) || 'plain', new THREE.CylinderGeometry(r0, r1, h, (o && o.seg) || 8), hex, x, y + h / 2, z, o); }
    world(x, z) { const c = Math.cos(this.ry), s = Math.sin(this.ry); return { x: this.x + x * c + z * s, z: this.z - x * s + z * c }; }
    wall(x0, x1, z0, z1, tag) { // 건물 벽(축에 나란할 때만 정확) — 네 귀퉁이를 돌려 감싸는 네모
      const a = this.world(x0, z0), b = this.world(x1, z1), c = this.world(x0, z1), d = this.world(x1, z0);
      return addCol({ x0: Math.min(a.x, b.x, c.x, d.x), x1: Math.max(a.x, b.x, c.x, d.x), z0: Math.min(a.z, b.z, c.z, d.z), z1: Math.max(a.z, b.z, c.z, d.z), tag: tag || 'wall' });
    }
  }
  window.WORLD = { SITES, TOWN, EDGE, heightAt, collide, avoid, addCol, removeCol, COLS, rnd, rr };
  WORLD._ = { M4, bake, merge, boxUV, BIN, Kit, sm };
})();
