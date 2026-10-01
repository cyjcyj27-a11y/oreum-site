// cook.js — 할머니 버섯 요리 (사장님 2026-09-18 "수집해온 버섯을 할머니한테 갖다주면 버섯요리가 나오게", "버섯은 돈벌기위해 따는걸로")
//   · 할머니 곁에서 E 🍲: 바구니 버섯을 전부 드리면 할머니가 아궁이로 걸어가 끓이고(김·보글보글), 식탁에 차린 뒤 제자리로 → 🍲 로 들고 간다
//   · 요리는 장터에서 버섯값의 두 배로 팔린다 (items.js sell)
//   · 벨라루스 버섯 요리 넷 — 그물버섯이 들면 구이, 여덟 개 넘으면 드라니키, 젖버섯이 많으면 절임, 나머지는 수프
(function () {
  const V3 = THREE.Vector3, L = U.L;
  const DISHES = {
    soup: { ko: '버섯 수프', en: 'Mushroom Soup' },
    pickle: { ko: '버섯 절임', en: 'Pickled Mushrooms' },
    draniki: { ko: '드라니키', en: 'Draniki' },
    roast: { ko: '그물버섯 구이', en: 'Roast Porcini' },
  };
  let scene = null, busy = false, show = null, job = null;
  const steam = [];

  function kindOf(list) {
    if (list.some(id => id === 4 || id === 11)) return 'roast';
    if (list.length >= 8) return 'draniki';
    if (list.filter(id => id === 6 || id === 10).length * 2 >= list.length) return 'pickle';
    return 'soup';
  }
  function value(list) { let v = 0; for (const id of list) v += ITEMS.SHROOMS[id].price; return v * 2; }

  // ── 식탁에 차리는 요리 모양 ──
  function mat(c, r) { return new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.6 : r }); }
  function dishMesh(k) {
    const g = new THREE.Group();
    if (k === 'soup' || k === 'pickle') {
      // 질그릇 사발 / 절임 유리병
      if (k === 'soup') {
        const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(0.05 + Math.sin(t * 1.5) * 0.11, t * 0.09)); }
        const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), mat(0x8a4a2a, 0.5)); bowl.material.side = THREE.DoubleSide; g.add(bowl);
        const soup = new THREE.Mesh(new THREE.CircleGeometry(0.155, 20), mat(0xc88a40, 0.3)); soup.rotation.x = -Math.PI / 2; soup.position.y = 0.075; g.add(soup);
        for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), mat(0x9a6a3a)); m.scale.y = 0.5; const a = i * 1.1; m.position.set(Math.cos(a) * 0.08, 0.08, Math.sin(a) * 0.08); g.add(m); }
        const cream = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 5), mat(0xf6f0e0, 0.4)); cream.scale.y = 0.35; cream.position.y = 0.08; g.add(cream);
        const dill = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 3), mat(0x4a8a2a)); dill.position.set(0.03, 0.085, 0.02); g.add(dill);
      } else {
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe8e0, roughness: 0.1, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
        jar.position.y = 0.1; g.add(jar);
        for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 7, 4), mat(i % 2 ? 0xe89040 : 0xf0ece0)); m.scale.y = 0.45; m.position.set(Math.cos(i * 2.3) * 0.035, 0.03 + i * 0.019, Math.sin(i * 2.3) * 0.035); g.add(m); }
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.02, 16), mat(0xc83a2a)); lid.position.y = 0.21; g.add(lid);
      }
    } else {
      // 나무 접시 위 드라니키 더미 / 그물버섯 구이
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.02, 20), mat(0xb08050, 0.7)); plate.position.y = 0.01; g.add(plate);
      if (k === 'draniki') {
        for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 12), mat(i % 2 ? 0xc8882a : 0xd89a3a, 0.5)); p.position.set(Math.cos(i * 1.3) * 0.06 * (i ? 1 : 0), 0.03 + i * 0.012, Math.sin(i * 1.3) * 0.06 * (i ? 1 : 0)); p.rotation.set(0.1 * i, 0, 0.08); g.add(p); }
        const cream = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 5), mat(0xf6f0e0, 0.4)); cream.scale.y = 0.4; cream.position.set(0, 0.1, 0); g.add(cream);
      } else {
        for (let i = 0; i < 5; i++) {
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6, 0, 6.3, 0, 1.6), mat(0x6a3a1a, 0.35)); cap.scale.y = 0.6;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.05, 8), mat(0xe8d8b0));
          const m = new THREE.Group(); stem.position.y = 0.025; cap.position.y = 0.05; m.add(stem, cap);
          m.rotation.z = 1.4; m.position.set(Math.cos(i * 1.25) * 0.07, 0.04, Math.sin(i * 1.25) * 0.07); m.rotation.y = i * 1.25; g.add(m);
        }
        const dill = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 3), mat(0x4a8a2a)); dill.position.set(0.02, 0.07, 0); g.add(dill);
      }
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  // ── 도감 카드·말풍선 그림 ──
  const icons = {};
  function icon(k) {
    if (icons[k]) return icons[k];
    const c = GEO.canvas(128, 128), g = c.getContext('2d');
    // 수놓은 식탁보
    g.fillStyle = '#f2ebdc'; g.beginPath(); g.arc(64, 70, 56, 0, 7); g.fill();
    g.strokeStyle = '#c83a2a'; g.lineWidth = 3; g.setLineDash([4, 4]); g.beginPath(); g.arc(64, 70, 50, 0, 7); g.stroke(); g.setLineDash([]);
    const sh = (x, y, rx, ry, c0, c1) => { const gr = g.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 1, x, y, Math.max(rx, ry)); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
    if (k === 'soup') {
      sh(64, 78, 40, 24, '#b0643a', '#6a3218');
      sh(64, 70, 34, 14, '#e0a858', '#b07830');
      for (let i = 0; i < 6; i++) sh(48 + (i * 11) % 34, 66 + (i % 3) * 4, 5, 3, '#a87848', '#6a4020');
      sh(66, 68, 7, 4, '#ffffff', '#e8e0d0');
      g.fillStyle = '#4a8a2a'; for (let i = 0; i < 5; i++) g.fillRect(58 + i * 3, 64 + (i % 2) * 3, 2, 2);
    } else if (k === 'pickle') {
      g.fillStyle = 'rgba(200,230,220,.55)'; g.beginPath(); g.roundRect(40, 34, 48, 64, 10); g.fill();
      for (let i = 0; i < 12; i++) sh(51 + (i % 3) * 13 + ((i / 3 | 0) % 2) * 4, 88 - (i / 3 | 0) * 13, 8, 5, i % 2 ? '#f0a050' : '#fbf6ea', i % 2 ? '#c06020' : '#d8d0c0');
      sh(64, 32, 27, 7, '#e05040', '#a02818');
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(46, 44); g.lineTo(46, 86); g.stroke();
    } else if (k === 'draniki') {
      sh(64, 82, 46, 20, '#c89a60', '#8a6034');
      for (let i = 0; i < 4; i++) sh(52 + i * 8, 76 - i * 6, 22, 9, '#f0b050', '#b0701e');
      sh(78, 54, 9, 5, '#ffffff', '#e8e0d0');
    } else {
      sh(64, 82, 46, 20, '#c89a60', '#8a6034');
      for (let i = 0; i < 4; i++) { const x = 44 + i * 13, y = 76 - (i % 2) * 6; g.fillStyle = '#efe2c0'; g.beginPath(); g.roundRect(x - 4, y - 2, 8, 14, 3); g.fill(); sh(x, y - 2, 12, 7, '#9a5a2a', '#4a2410'); }
      g.fillStyle = '#4a8a2a'; for (let i = 0; i < 6; i++) g.fillRect(50 + i * 5, 70 + (i % 2) * 4, 2, 2);
    }
    // 김 (절임 병은 식은 것)
    if (k !== 'pickle') {
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const x = 50 + i * 14; g.beginPath(); g.moveTo(x, 40); g.bezierCurveTo(x - 6, 30, x + 6, 22, x, 10); g.stroke(); }
    }
    return (icons[k] = c.toDataURL());
  }

  // 할머니네 페치카 위 무쇠솥 — 요리할 때 여기서 김이 나고 뚜껑이 달그락
  let pot = null;
  function build(sc) {
    scene = sc;
    const h = WORLD.HOME.h, sp = h && h.spots && h.spots.stove;
    if (!sp) return;
    const iron = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.55, metalness: 0.5, side: THREE.DoubleSide });
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(0.06 + Math.sin(t * 2.2) * 0.14, t * 0.24)); }
    pot = new THREE.Group();
    pot.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 18), iron));
    const lid = new THREE.Group();
    lid.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 6, 0, 6.3, 0, 0.9).translate(0, 0.1, 0), iron));
    lid.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.8 })));
    lid.position.y = 0.07; pot.add(lid); pot.userData.lid = lid;
    pot.position.set(sp[0], sp[1] - 0.05, sp[2]);
    pot.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(pot);
  }

  // 할머니 곁에서 (quests.js 가 부른다)
  function near(r) {
    if (busy || r.busy) return null;
    const list = T.basket;
    if (!list.length) return null;
    return { kind: 'cook', r, label: 'E 🍲' };
  }

  // 버섯을 요리로. list 를 넘기면 그 버섯만 (첫 부탁), 아니면 바구니 전부
  //   할머니: 아궁이 앞으로 걸어가 → 끓이고 → 식탁 앞으로 → 요리를 내려놓고 → 제자리로 (2026-09-18 "동작을 말이 되게")
  function cook(r, list) {
    if (busy) return;
    list = list || T.basket.splice(0);
    if (!list.length) { AUD.sfx('deny'); return; }
    busy = true;
    const k = kindOf(list), v = value(list), d = DISHES[k];
    const sp = r.h.spots || {};
    const home = { x: r.x, z: r.z }, fire = sp.fire ? { x: sp.fire[0], z: sp.fire[2] } : home, serve = sp.serve ? { x: sp.serve[0], z: sp.serve[2] } : home;
    r.busy = true;
    job = { r, k, v, d, legs: [fire, serve, home], leg: 0, wait: 0, phase: 'walk', tb: sp.table };
    AUD.sfx('pick');
    QUESTS.say(r.p, L(d.ko, d.en) + '!', 3);
    U.save();
  }
  // 걷기: 목표를 보고 걸어간다. 닿으면 true
  function walkTo(r, p, dt) {
    const h = r.holder, dx = p.x - h.position.x, dz = p.z - h.position.z, dd = Math.hypot(dx, dz);
    if (dd < 0.06) return true;
    const want = Math.atan2(dx, dz);
    h.rotation.y += U.angDiff(h.rotation.y, want) * Math.min(1, dt * 8);
    const st = Math.min(dd, 0.95 * dt);
    h.position.x += dx / dd * st; h.position.z += dz / dd * st;
    QUESTS.npcPlay(r, 'walk');
    return false;
  }
  function jobStep(dt) {
    const j = job, r = j.r;
    if (j.phase === 'walk') {
      if (walkTo(r, j.legs[j.leg], dt)) {
        QUESTS.npcPlay(r, 'idle');
        if (j.leg === 0) { j.phase = 'boil'; j.wait = 2.4; AUD.sfx('pour'); r.holder.rotation.y = Math.atan2(r.h.spots.stove[0] - r.holder.position.x, r.h.spots.stove[2] - r.holder.position.z); }
        else if (j.leg === 1) { j.phase = 'serve'; j.wait = 1.4; serveDish(j); }
        else { r.busy = false; job = null; if (!show) busy = false; }
      }
    } else {
      j.wait -= dt;
      if (j.phase === 'boil') {
        // 아궁이 위 솥에서 김·보글보글
        if (Math.random() < dt * 16 && r.h.spots.stove) puff(new THREE.Vector3(r.h.spots.stove[0], r.h.spots.stove[1] + 0.3, r.h.spots.stove[2]));
        if (pot) pot.userData.lid.position.y = 0.07 + Math.abs(Math.sin(T.time * 23)) * 0.015;
        if (Math.random() < dt * 5) AUD.sfx('plop', 0.3);
      }
      if (j.wait <= 0) { j.phase = 'walk'; j.leg++; if (pot) pot.userData.lid.position.y = 0.07; }
    }
  }
  function serveDish(j) {
    const tb = j.tb, m = dishMesh(j.k);
    if (tb) m.position.set(tb[0], tb[1] + 0.01, tb[2]); else m.position.copy(j.r.holder.position).setY(j.r.floor + 0.8);
    m.scale.setScalar(0.01);
    scene.add(m);
    show = { m, t: 0, k: j.k, v: j.v, d: j.d };
    AUD.sfx('tea');
  }
  function puff(at) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
    p.position.copy(at); p.position.x += (Math.random() - 0.5) * 0.2; p.position.z += (Math.random() - 0.5) * 0.2;
    scene.add(p); steam.push({ p, t: 0 });
  }

  function update(dt) {
    if (job) jobStep(dt);
    if (show) {
      const s = show; s.t += dt;
      const k = s.t < 0.4 ? s.t / 0.4 : 1;
      s.m.scale.setScalar(0.01 + (1 - Math.pow(1 - k, 3)) * 1.2);
      if (s.k !== 'pickle' && Math.random() < dt * 14) {
        puff(s.m.position.clone().setY(s.m.position.y + 0.12));
      }
      if (s.t > 2.6) {
        scene.remove(s.m);
        T.dishes = T.dishes || [];
        T.dishes.push({ k: s.k, v: s.v });
        T.cooked = T.cooked || {}; const first = !T.cooked[s.k]; T.cooked[s.k] = true;
        AUD.sfx(first ? 'new' : 'pick');
        HUD.card(icon(s.k), L(s.d.ko, s.d.en) + '  🪙' + s.v, 'd');
        FX.pop('🍲', PL.pos);
        show = null; if (!job) busy = false;
        U.save();
      }
    }
    for (let i = steam.length - 1; i >= 0; i--) {
      const e = steam[i]; e.t += dt;
      e.p.position.y += dt * 0.35; e.p.position.x += Math.sin(e.t * 5 + i) * dt * 0.05;
      e.p.scale.setScalar(1 + e.t * 2); e.p.material.opacity = 0.5 * (1 - e.t / 1.6);
      if (e.t > 1.6) { scene.remove(e.p); e.p.geometry.dispose(); e.p.material.dispose(); steam.splice(i, 1); }
    }
  }

  window.COOK = { build, near, cook, update, icon, DISHES, get busy() { return busy; } };
})();
