/* 시바 병원 가는 날 — 아이템. 간식(뼈다귀)과 장난감(공) 두 가지.
 * 스테이지마다 집 안 어딘가에 간식 하나 또는 장난감 하나가 놓인다(무작위). 시바를 쫓다 밟으면 줍고, 안 쓰면 다음 판으로 쌓인다.
 * 시바 앞에서 키(1 간식 · 2 장난감)로 쓰면 앞에 내려놓고, 시바가 홀려서 잡기 쉬워진다. 한 번 쓰면 없어진다.
 * 단계가 오르면 시바가 먹기만 하고 달아나거나 장난감만 물고 도망간다. 가진 개수와 모은 총합은 브라우저에 저장한다. */
(function () {
  'use strict';
  const W = window.WORLD, KEY = 'shibavet.items';
  let inv = { treat: 0, toy: 0, tTreat: 0, tToy: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s.treat === 'number') inv = Object.assign(inv, s); } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(inv)); } catch (e) { } }

  const boneM = new THREE.MeshStandardMaterial({ color: 0xf7efdc, roughness: .8 });
  const ballM = new THREE.MeshStandardMaterial({ color: 0xc8f04a, roughness: .55 });
  const lineM = new THREE.MeshStandardMaterial({ color: 0xff5a8a, roughness: .55 });
  function build(cat) {
    const g = new THREE.Group();
    if (cat === 'treat') {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .2, 8), boneM); bar.rotation.z = Math.PI / 2; g.add(bar);
      [[-.1, .03], [-.1, -.03], [.1, .03], [.1, -.03]].forEach(p => { const k = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), boneM); k.position.set(p[0], 0, p[1]); g.add(k); });
    } else {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 14, 12), ballM));
      const r = new THREE.Mesh(new THREE.TorusGeometry(.09, .012, 6, 24), lineM); r.rotation.x = Math.PI / 2; g.add(r);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  let scene = null; const active = [];
  const I = {
    get inv() { return inv; },
    init(s) { scene = s; },
    count(cat) { return inv[cat]; },
    // 시바 앞에 놓기 — 앞쪽 2.2m. 그 자리가 막혔으면 가까운 쪽으로 당긴다
    use(cat, x, z, L, yaw) {
      if (!scene || inv[cat] <= 0) return null;
      // 연달아 누르면 앞쪽 여기저기에 흩어진다 — 모아 둔 걸 뿌려서 시바를 붙잡아 두는 용도
      const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), side = (Math.random() - .5) * 1.8; let tx = x, tz = z, ok = false;
      for (let d = 1.6 + Math.random() * 1.6; d >= .6; d -= .4) { const px = x + fx * d + rx * side, pz = z + fz * d + rz * side; if (W.passable(L, W.cellOf(px), W.cellOf(pz), true) && !W.inStair(px, pz)) { tx = px; tz = pz; ok = true; break; } }
      if (!ok) return null;
      inv[cat]--; save();
      const mesh = build(cat); scene.add(mesh);
      const it = { cat, x0: x, z0: z, x: tx, z: tz, L, mesh, t: 0, flying: true, taken: false };
      mesh.position.set(x, W.height(L, x, z) + 1.1, z); active.push(it); return it;
    },
    // 집 안 바닥 칸 하나에 놓아 둔다. 사람이 설 수 있는 칸, 계단 아님, 시바·주인 시작 자리에서 멀리
    spawn() {
      if (!scene) return null;
      const cat = Math.random() < .5 ? 'treat' : 'toy', cells = [];
      for (let L = 0; L < 2; L++) for (let cz = 0; cz < W.GZ; cz++) for (let cx = 0; cx < W.GX; cx++) {
        const x = (cx + .5) * W.CELL, z = (cz + .5) * W.CELL;
        if (!W.passable(L, cx, cz, false) || W.inStair(x, z) || !W.inHouse(x, z)) continue;
        if (Math.hypot(x - 16, z - 20.5) < 4) continue;
        cells.push({ L, x, z });
      }
      if (!cells.length) return null;
      const c = cells[Math.floor(Math.random() * cells.length)], mesh = build(cat); scene.add(mesh);
      const it = { cat, x: c.x, z: c.z, L: c.L, mesh, t: Math.random() * 6, flying: false, taken: false, pickup: true };
      mesh.position.set(c.x, W.height(c.L, c.x, c.z) + .25, c.z); active.push(it); return it;
    },
    // 주인이 밟으면 줍는다. 주운 종류를 돌려준다
    checkPickup(pl) {
      for (const it of active) {
        if (!it.pickup || it.L !== pl.L) continue;
        if (Math.hypot(it.x - pl.x, it.z - pl.z) < .85) { inv[it.cat]++; inv[it.cat === 'treat' ? 'tTreat' : 'tToy']++; save(); I.remove(it); return it.cat; }
      }
      return null;
    },
    update(dt) {
      for (const it of active) {
        if (it.pickup) { it.t += dt; it.mesh.position.y = W.height(it.L, it.x, it.z) + .25 + Math.sin(it.t * 3) * .06; it.mesh.rotation.y += dt * 1.6; continue; }
        if (!it.flying) continue;
        it.t += dt; const k = Math.min(1, it.t / .5), y0 = W.height(it.L, it.x0, it.z0) + 1.1, y1 = W.height(it.L, it.x, it.z) + .06;
        it.mesh.position.set(it.x0 + (it.x - it.x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * .5, it.z0 + (it.z - it.z0) * k);
        it.mesh.rotation.x += dt * 8;
        if (k >= 1) { it.flying = false; it.mesh.rotation.set(0, 0, 0); it.mesh.position.y = y1; }
      }
    },
    // 개가 볼 수 있는 가장 가까운 아이템 (땅에 놓인 것만, 같은 층)
    nearest(L, x, z, maxD) {
      let b = null, bd = maxD;
      for (const it of active) { if (it.flying || it.taken || it.pickup || it.L !== L) continue; const d = Math.hypot(it.x - x, it.z - z); if (d < bd) { bd = d; b = it; } }
      return b;
    },
    remove(it) { const i = active.indexOf(it); if (i >= 0) active.splice(i, 1); if (it.mesh && scene) scene.remove(it.mesh); },
    clear() { while (active.length) I.remove(active[0]); },
    mouthMesh(cat) { const g = build(cat); g.scale.setScalar(.85); return g; },
    active
  };
  window.ITEMS = I;
})();
