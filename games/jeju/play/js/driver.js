// 오픈카 두 사람(남/녀) — 달리면 차에 타고(앉기), 서면 차 옆에 내려 선다(Idle). 공식 GLTFLoader 스키닝.
// three 표준: 스케일은 gltf.scene(root) 에만. 스케일 후 스켈레톤 재바인딩(o.bind)으로 폭발 방지.
(function () {
  const occ = [];
  let scene = null, loaded = 0;
  const SEAT_Y = 1.32;

  function place1(url, side, tint) {
    GLB.load(url + '?c=3', {}).then(g => {
      let b = new THREE.Box3().setFromObject(g), sz = new THREE.Vector3(); b.getSize(sz);
      const s = 1.6 / (sz.y || 1);
      g.scale.setScalar(s); g.updateMatrixWorld(true);
      b = new THREE.Box3().setFromObject(g); const ctr = new THREE.Vector3(); b.getCenter(ctr);
      g.position.set(g.position.x - ctr.x, g.position.y - b.min.y, g.position.z - ctr.z);
      g.updateMatrixWorld(true);
      g.traverse(o => {
        if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.frustumCulled = false; if (tint && o.material) { o.material = o.material.clone(); o.material.color && o.material.color.multiply(new THREE.Color(tint)); } }
      });
      const holder = new THREE.Group(); holder.add(g); scene.add(holder);
      const mixer = g.userData.mixer; const clips = g.userData.clips || [];
      const find = re => clips.find(x => re.test(x.name));
      const actions = {
        sit: mixer && (find(/Sitting_Idle/) || find(/Driving/)) ? mixer.clipAction(find(/Sitting_Idle/) || find(/Driving/)) : null,
        stand: mixer && (find(/^Rig\|Idle_Loop/) || find(/Idle_Loop/)) ? mixer.clipAction(find(/^Rig\|Idle_Loop/) || find(/Idle_Loop/)) : null,
      };
      occ.push({ holder, mixer, actions, side, mode: '' });
      loaded++;
    }).catch(e => console.warn('탑승자 GLB 실패', e));
  }

  function init(sc) {
    scene = sc; if (!window.GLB) return;
    place1('assets/models/person.glb', -1, null);        // 왼쪽 사람
    place1('assets/models/person.glb',  1, 0xffb0c0);    // 오른쪽 사람(색 다름)
  }

  function setMode(o, mode) {
    if (o.mode === mode || !o.mixer) return;
    o.mode = mode;
    const next = mode === 'sit' ? o.actions.sit : o.actions.stand;
    o.mixer._actions.forEach(a => a.fadeOut(0.25));
    if (next) next.reset().fadeIn(0.25).play();
  }

  function update(dt) {
    if (!loaded) return;
    const show = PLAYER.car === 'open' && PLAYER.mode === 'ground';
    const yaw = PLAYER.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const parked = (PLAYER.kmh || 0) < 3;
    for (const o of occ) {
      o.holder.visible = show; if (!show) continue;
      if (o.mixer) o.mixer.update(dt);
      if (parked) {
        // 차 옆에 내려서 선다 (바닥), 바깥쪽을 보게
        setMode(o, 'stand');
        const sx = PLAYER.x + rx * o.side * 1.9 - fx * 1.2;
        const sz = PLAYER.z + rz * o.side * 1.9 - fz * 1.2;
        o.holder.position.set(sx, Math.max(0, ISLAND.H(sx, sz)), sz);
        o.holder.rotation.set(0, yaw + Math.PI, 0);   // 카메라(뒤) 쪽을 보게
      } else {
        // 달리면 좌석에 앉는다
        setMode(o, 'sit');
        o.holder.position.set(PLAYER.x + fx * 0.12 + rx * o.side * 0.42, PLAYER.y + SEAT_Y, PLAYER.z + fz * 0.12 + rz * o.side * 0.42);
        o.holder.rotation.set(0, yaw, 0);
      }
    }
  }

  window.DRIVER = { init, update, occ };
})();
