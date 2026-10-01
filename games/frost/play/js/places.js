// places.js — 명소 12곳 발견 (terrain.js PLACES, 모양은 world.js placesBuild)
//   가까이 가면 도감 📍 에 들어간다. 12/12 는 쿠팔라의 밤 조건.
//   다음에 갈 곳에는 하늘로 빛기둥을 세운다 (사장님 2026-09-17 "어디로 가야 될지 모르겠어")
(function () {
  const L = U.L;
  const list = () => TER.PLACES;
  function count() { let n = 0; for (const k in (T.places || {})) if (T.places[k]) n++; return n; }

  let beam = null, beamT = 0, goal = null;
  function build(scene) {
    // 빛기둥 — 아래는 진하고 위로 갈수록 옅다
    const c = GEO.canvas(8, 128), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 128, 0, 0);
    gr.addColorStop(0, 'rgba(255,230,140,0.9)'); gr.addColorStop(0.5, 'rgba(255,220,120,0.35)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
    const tex = GEO.tex(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    beam = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 60), mat);
      m.position.y = 30; m.rotation.y = i * Math.PI / 2;
      beam.add(m);
    }
    beam.visible = false;
    scene.add(beam);
  }

  let busy = false;
  function update(dt) {
    if (T.mode !== 'play') { if (beam) beam.visible = false; return; }
    const px = PL.pos.x, pz = PL.pos.z;
    if (!busy) {
      list().forEach((p, i) => {
        if (busy || T.places[i]) return;
        if (false && Math.hypot(p.x - px, p.z - pz) < p.r) discover(i);   // 명소 찾기는 뺐다 (사장님 2026-09-19 "새로운 장소 미션 빼고 황새 둥지 사진 미션도 빼")
      });
    }
    // 빛기둥: 다음 목표가 멀 때만
    beamT -= dt;
    if (beamT <= 0) { beamT = 0.25; goal = null; }   // 빛기둥은 뺐다 — 할 일은 주민 대사로 (사장님 2026-09-20 "빛기둥은 없애고 대사로 알려줘 언제나")
    if (beam) {
      const d = goal ? Math.hypot(goal.x - px, goal.z - pz) : 0;
      beam.visible = !!goal && d > 22 && !WORLD.inHouse(px, pz, PL.pos.y);
      if (beam.visible) {
        beam.position.set(goal.x, Math.max(TER.H(goal.x, goal.z), 0), goal.z);
        const s = U.clamp(d / 60, 1, 4);
        beam.scale.set(s, 1, s);
        beam.children.forEach(m => { m.material.opacity = U.clamp((d - 22) / 20, 0, 1) * (0.75 + Math.sin(T.time * 2.5) * 0.15); });
      }
    }
  }

  function discover(i) {
    const p = list()[i];
    busy = true;
    T.places[i] = true;
    T.coins += 25;
    const y = TER.H(p.x, p.z);
    AUD.sfx('new'); setTimeout(() => AUD.sfx('coin'), 300);
    HUD.card(HUD.emoji(p.icon), p.icon + ' ' + L(p.ko, p.en), 'p');
    HUD.praise(L('새 장소', 'NEW PLACE') + '  +25 🪙');
    ITEMS.checkAll();
    U.save();
    busy = false;
  }

  function pending() {
    let best = null, bd = 1e9;
    list().forEach((p, i) => {
      if (T.places[i]) return;
      const d = Math.hypot(p.x - PL.pos.x, p.z - PL.pos.z);
      if (d < bd) { bd = d; best = { x: p.x, z: p.z }; }
    });
    return best;
  }

  window.PLACES = { build, update, count, pending, get list() { return list(); } };
})();
