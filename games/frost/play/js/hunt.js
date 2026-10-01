// hunt.js — 장총으로 멧돼지 사냥 (사장님 2026-09-18 "표도르 아저씨가 멧돼지 잡아달라고 부탁하는걸로", "상점에 장총을 팔아")
//   · 상점에서 장총을 사면 등에 멘다. F(또는 마우스 오른쪽, 폰은 🎯)로 겨누면 어깨 너머로 당겨 보고 가운데 +
//   · 겨눈 채 클릭·E(폰은 행동 단추)로 쏜다: 총소리·불꽃·연기·반동, 장전 1.3초
//   · 맞은 멧돼지는 옆으로 쓰러지고 T.hunted 가 오른다 → 표도르에게 가면 부탁을 채운다. 쓰러진 멧돼지는 한참 뒤 제자리에서 다시 나온다
(function () {
  const V3 = THREE.Vector3, L = U.L;
  const RANGE = 70, RELOAD = 1.3;
  let scene = null, gun = null, flash = null, flashL = null, cross = null, aimBtn = null, fireBtn = null;
  let coolT = 0, flashT = 0;
  const smokes = [];
  const _a = new V3(), _b = new V3(), _d = new V3(), _o = new V3();

  // ── 장총: 호두나무 개머리판 + 검은 총열 + 가죽 멜빵 ──
  function gunMesh() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6a3e1e, roughness: 0.55 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.35, metalness: 0.85 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    // 총은 +z 로 겨눈다. 원점은 오른손(방아쇠 손잡이) 자리
    const stock = new THREE.Shape();
    stock.moveTo(-0.02, 0.02); stock.lineTo(-0.38, -0.06); stock.lineTo(-0.4, -0.16); stock.lineTo(-0.3, -0.15); stock.lineTo(-0.06, -0.06); stock.lineTo(0.3, -0.03); stock.lineTo(0.3, 0.02); stock.closePath();
    const sg = new THREE.ExtrudeGeometry(stock, { depth: 0.045, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 });
    sg.translate(0, 0, -0.0225); sg.rotateY(-Math.PI / 2);
    g.add(new THREE.Mesh(sg, wood));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.72, 10).rotateX(Math.PI / 2).translate(0, 0.012, 0.62), steel); g.add(barrel);
    const rcv = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.2).translate(0, 0.005, 0.12), steel); g.add(rcv);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.06, 6).rotateZ(Math.PI / 2).translate(0.04, 0.02, 0.08), steel); g.add(bolt);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.004, 4, 10, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI).translate(0, -0.03, 0.03), steel); g.add(guard);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.02, 0.01).translate(0, 0.032, 0.96), steel); g.add(sight);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.008, 3, 20, Math.PI).rotateY(Math.PI / 2).scale(1, 0.25, 1).translate(0, -0.06, 0.25), leather); g.add(strap);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  // 상점 그림
  function gunIcon() {
    const c = GEO.canvas(96, 96), g = c.getContext('2d');
    g.translate(48, 48); g.rotate(-0.5); g.translate(-48, -48);
    g.fillStyle = '#6a3e1e'; g.beginPath(); g.moveTo(8, 56); g.lineTo(34, 50); g.lineTo(50, 48); g.lineTo(50, 54); g.lineTo(30, 60); g.lineTo(10, 66); g.closePath(); g.fill();
    g.fillStyle = '#2a2c30'; g.fillRect(44, 46, 50, 4); g.fillRect(40, 45, 14, 7);
    g.strokeStyle = '#2a2c30'; g.lineWidth = 2; g.beginPath(); g.arc(42, 55, 4, 0, Math.PI); g.stroke();
    return '<img src="' + c.toDataURL() + '" style="width:1.4em;height:1.4em;vertical-align:middle">';
  }

  function build(sc) {
    scene = sc;
    gun = gunMesh(); gun.visible = false; scene.add(gun);
    // 총구 불꽃
    const fc = GEO.canvas(64, 64), fg = fc.getContext('2d');
    const gr = fg.createRadialGradient(32, 32, 1, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.3, 'rgba(255,190,80,.9)'); gr.addColorStop(1, 'rgba(255,90,0,0)');
    fg.fillStyle = gr; fg.fillRect(0, 0, 64, 64);
    flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: GEO.tex(fc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    flash.scale.setScalar(0.5); flash.visible = false; scene.add(flash);
    flashL = new THREE.PointLight(0xffc070, 0, 12, 1.6); scene.add(flashL);
    // 조준 + 표시와 폰 🎯 단추
    const st = document.createElement('style');
    st.textContent = '#cross{position:fixed;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;pointer-events:none;z-index:25;display:none}' +
      '#cross:before,#cross:after{content:"";position:absolute;background:#fff;box-shadow:0 0 3px #000}' +
      '#cross:before{left:16px;top:0;width:2px;height:34px}#cross:after{top:16px;left:0;height:2px;width:34px}#cross.show{display:block}#cross.hot:before,#cross.hot:after{background:#ff5a3a}' +
      '#bAim{right:calc(126px + env(safe-area-inset-right));bottom:184px;width:52px;height:52px;font-size:26px}#bAim.gone{display:none!important}#bAim.on2{border-color:#ffd46a}' +
      '#bFire{position:fixed;z-index:23;right:calc(126px + env(safe-area-inset-right));bottom:100px;width:72px;height:72px;border-radius:50%;background:rgba(200,40,30,.85);color:#fff;font:700 20px/72px sans-serif;text-align:center;display:none;user-select:none;-webkit-user-select:none;touch-action:none;box-shadow:0 0 16px rgba(255,80,60,.6)}#bFire.show{display:block}';
    document.head.appendChild(st);
    cross = document.createElement('div'); cross.id = 'cross'; document.body.appendChild(cross);
    const ref = document.getElementById('bBag');
    if (ref) {
      aimBtn = document.createElement('div'); aimBtn.id = 'bAim'; aimBtn.className = ref.className.replace(/\bgone\b/, '').trim(); aimBtn.textContent = '🎯';
      ref.parentNode.appendChild(aimBtn);
      aimBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
    }
    // 쏘기 단추 — 겨누는 동안만 (사장님 2026-09-20 "조준했을때만 쏘기버튼이 나오는거")
    fireBtn = document.createElement('div'); fireBtn.id = 'bFire'; fireBtn.textContent = L('쏘기', 'FIRE'); document.body.appendChild(fireBtn);
    fireBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fire(); });
    addEventListener('keydown', e => { if (!e.repeat && e.code === 'KeyF') toggle(); });
    addEventListener('mousedown', e => {
      if (T.mode !== 'play' || T.paused) return;
      if (e.button === 2) { if (can()) aim(true); }
      else if (e.button === 0 && PL.aim) fire();   // 포인터 잠금 없이도 쏜다 (사장님 2026-09-20 "F누르고 뭐 눌러야 총쏘냐")
    });
    addEventListener('mouseup', e => { if (e.button === 2 && PL.aim && PL.aimHold) aim(false); });
    addEventListener('contextmenu', e => { if (T.mode === 'play') e.preventDefault(); });
    const it = ITEMS.SHOP.find(s => s.id === 'rifle'); if (it) it.icon = gunIcon();
  }

  // 들소 위에서도 쏜다 (사장님 2026-09-19 "들소에 탄 채로 멧돼지 사냥") — 날뛰기·올라타기·줍기 중엔 안 된다
  const can = () => TOOLS.held('rifle') && T.mode === 'play' && !T.paused && !PL.swim && !PL.climb && !PL.act && !(T.items.boar > 0) && PL.state === 'ground' && (!PL.ride || (RIDE.calm && !RIDE.busy));
  function toggle() { if (PL.aim) aim(false); else if (can()) aim(true, true); }
  function aim(on, toggled) {
    PL.aim = on; PL.aimHold = on && !toggled;
    CAM.side = on ? (PL.ride ? 0.75 : 0.55) : 0; CAM.zoom = on ? 22 : 0; CAM.far = on ? (PL.ride ? 3.2 : 2.1) : (PL.ride ? 6.2 : 0);   // 들소 위에선 조금 뒤로
    cross.classList.toggle('show', on);
    if (aimBtn) aimBtn.classList.toggle('on2', on);
    if (fireBtn) fireBtn.classList.toggle('show', on);
    PL.vel.x = PL.vel.z = 0;
    if (on) PLAYER.play(PLAYER.CH.acts.aim ? 'aim' : 'idle', 0.2, { restart: true });
    else if (PL.ride) PLAYER.play('sit', 0.25, { restart: true, once: true, from: 9 });   // 등 위에 도로 앉은 자세 (동작 끝부분)
    else PLAYER.play('idle', 0.25);
  }

  // 겨누는 동안 hero.js step 대신: 제자리에서 카메라가 보는 쪽을 본다
  function step(dt, camYaw) {
    const IN = PLAYER.IN;
    IN.jumpEdge = false;
    if (!can() && !PL.act) { aim(false); return; }
    // 움직이려 하면 겨누기를 푼다
    if (Math.hypot(IN.f, IN.r) > 0.3 && !PL.aimHold) { aim(false); return; }
    PL.vel.x = PL.vel.z = 0; PL.running = false;
    PL.yaw += U.angDiff(PL.yaw, camYaw + Math.PI) * Math.min(1, dt * 14);
    const p = PL.pos; p.y = U.damp(p.y, WORLD.groundAt(p.x, p.z, p.y), 12, dt);
    PLAYER.CH.holder.position.copy(p);
    PLAYER.CH.holder.rotation.y = PL.yaw;
  }

  // 화면 가운데로 광선: 가장 가까운 멧돼지 (땅에 가리면 빗나감)
  function target(cam) {
    cam.getWorldPosition(_o); cam.getWorldDirection(_d);
    let best = null, bd = RANGE;
    for (const b of ANIMALS.boars) {
      if (b.dead) continue;
      _a.set(b.pos.x, b.pos.y + 0.62, b.pos.z).sub(_o);
      const t = _a.dot(_d); if (t < 0 || t > bd) continue;
      const miss = _a.addScaledVector(_d, -t).length();
      if (miss > 0.62) continue;
      let blocked = false;
      for (let s = 2; s < t - 0.5; s += 1.5) { const x = _o.x + _d.x * s, y = _o.y + _d.y * s, z = _o.z + _d.z * s; if (y < TER.H(x, z)) { blocked = true; break; } }
      if (!blocked) { bd = t; best = b; }
    }
    return best;
  }

  function fire() {
    if (!PL.aim || coolT > 0) return;
    coolT = RELOAD;
    const cam = T.camera;
    AUD.sfx('shot');
    setTimeout(() => AUD.sfx('tock', 0.8), 650);   // 노리쇠 당기는 소리
    CAM.pitch = U.clamp(CAM.pitch - 0.05, -0.45, 1.0);
    CAM.shake = Math.max(CAM.shake || 0, 0.35);
    flashT = 0.07;
    // 믹사모 Firing Rifle(서서 쏘기) 한 번 → 다시 겨누기
    if (PLAYER.CH.acts.fire) { PLAYER.play('fire', 0.05, { restart: true, once: true }); setTimeout(() => { if (PL.aim && PLAYER.CH.cur === 'fire') PLAYER.play('aim', 0.15); }, 330); }
    muzzle(_b); smoke(_b);
    const b = target(cam);
    if (b) kill(b);
  }
  function muzzle(out) { return gun.localToWorld(out.set(0, 0.012, 1.0)); }

  function kill(b) {
    b.dead = true; b.deadT = 0; b.state = 'dead'; b.speed = 0;
    AUD.sfx('boar', 0.8); setTimeout(() => AUD.sfx('grunt'), 200);
    T.hunted = (T.hunted || 0) + 1;
    T.kills = (T.kills || 0) + 1;   // 모두 몇 마리 잡았나 — 호수섬 다리 조건 (island.js)
    FX.pop('🐗', b.pos);
    U.save();
  }

  function smoke(at) {
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.45, depthWrite: false }));
      s.position.copy(at); s.userData.v = new V3((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4); s.userData.life = 1.2;
      scene.add(s); smokes.push(s);
    }
  }

  // 총 놓는 자리: 겨누면 두 손에, 아니면 등에 비스듬히
  function update(dt) {
    if (!gun) return;
    if (coolT > 0) coolT -= dt;
    const owned = TOOLS.held('rifle') && T.mode !== 'title';
    gun.visible = owned && !PL.swim && PL.ch && PL.ch.holder.visible;
    if (aimBtn) aimBtn.classList.toggle('gone', !owned || T.mode !== 'play');
    carryTick();
    const B = PLAYER.CH.bones;
    if (gun.visible && B.RightHand) {
      if (PL.aim) {
        // 믹사모 Rifle Aiming 자세: 오른손이 손잡이, 총열은 왼손을 지나 앞으로
        B.RightHand.getWorldPosition(_a); B.LeftHand.getWorldPosition(_b);
        _b.sub(_a).multiplyScalar(20).add(_a);
        gun.position.copy(_a);
        gun.lookAt(_b);
        cross.classList.toggle('hot', !!target(T.camera));
      } else {
        B.Spine2.getWorldPosition(_a);
        const y = PL.yaw;
        gun.position.set(_a.x - Math.sin(y) * 0.2, _a.y - 0.05, _a.z - Math.cos(y) * 0.2);
        gun.rotation.set(0, 0, 0); gun.rotation.order = 'YXZ';
        gun.rotation.y = y + Math.PI / 2; gun.rotation.x = -1.1; gun.rotation.z = 0.2;
      }
    }
    if (flashT > 0) {
      flashT -= dt; muzzle(_b);
      flash.visible = true; flash.position.copy(_b); flash.material.rotation = Math.random() * 6;
      flashL.position.copy(_b); flashL.intensity = 6;
    } else { flash.visible = false; flashL.intensity = 0; }
    for (let i = smokes.length - 1; i >= 0; i--) {
      const s = smokes[i]; s.userData.life -= dt; s.position.addScaledVector(s.userData.v, dt); s.scale.multiplyScalar(1 + dt * 1.5);
      s.material.opacity = 0.45 * Math.max(0, s.userData.life / 1.2);
      if (s.userData.life <= 0) { scene.remove(s); s.geometry.dispose(); s.material.dispose(); smokes.splice(i, 1); }
    }
  }

  // 표도르 부탁 안내: 총이 없으면 상점, 있으면 가장 가까운 멧돼지 (items.js guide)
  function goals(consider) {
    if (!T.shop.rifle) { const s = WORLD.NPCSPOT.shop; if (s) consider(s.x, s.z); return; }
    if (!TOOLS.held('rifle')) { const r = T.rest && T.rest.rifle; if (r) consider(r.x, r.z); return; }   // 놓아둔 장총부터
    for (const b of ANIMALS.boars) if (!b.dead) consider(b.pos.x, b.pos.z);
  }

  // 쓰러진 멧돼지 옆에서 E 🐗 — 통째로 어깨에 메고 간다. 표도르에게 판다(items.js). 꼬치구이는 뺐다 (2026-09-27)
  //   (사장님 2026-09-20 "멧돼지잡은걸 들고가서 표도르한테 파는걸로", "어깨에 매고가게") — 전엔 고기 한 덩이(🍖)만 떼 갔다
  function near() {
    if (PL.ride || PL.swim || PL.aim) return null;
    for (const b of ANIMALS.boars) {
      if (!b.dead || b.meat || !b.root.visible || Math.hypot(b.pos.x - PL.pos.x, b.pos.z - PL.pos.z) > 2.2) continue;
      return (T.items.boar || 0) >= 1 ? { kind: 'full', label: '🐗 1/1' } : { kind: 'boar', b, label: 'E 🐗' };
    }
    return null;
  }
  function take(b) {
    if (!b || b.meat || (T.items.boar || 0) >= 1) return;
    b.meat = true;
    PL.yaw = Math.atan2(b.pos.x - PL.pos.x, b.pos.z - PL.pos.z);
    PLAYER.doAct('pick', 1.1, { speed: 2.2, from: 0.6 });
    setTimeout(() => {
      T.items.boar = 1;
      b.deadT = Math.max(b.deadT, 44);   // 주검은 사라지고(animals.js 43초 규칙) 150초 뒤 제자리에서 다시 나온다
      FX.pop('🐗', PL.pos); AUD.sfx('pick'); U.save();
    }, 500);
  }
  // 어깨에 멘 멧돼지 — 등뼈(Spine2)를 따라간다 (feel.js 장작 등짐과 같은 방식). 물에선 안 보이고, 팔거나 구우면 없어진다
  let carry = null;
  const _cp = new V3();
  function carryTick() {
    const want = (T.items.boar || 0) > 0 && T.mode !== 'title';
    if (!want) { if (carry) { scene.remove(carry); carry = null; } return; }
    if (!carry) {
      const src = ANIMALS.boars[0];
      if (!src || !PLAYER.CH || !PLAYER.CH.bones) return;
      carry = new THREE.Group();
      const m = src.root.clone(true);
      m.visible = true; m.position.set(0, -0.62, 0); m.rotation.set(0, 0, 0);   // 배를 목 뒤에 얹고 다리는 앞뒤로 늘어진다
      m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      // 복제는 그 순간 모습 그대로다 — 달리던 중이면 들썩인 몸통·벌린 다리·숙인 머리까지 따라와 몸통과 다리가 떨어져 보였다 → 선 자세로 (2026-10-01)
      { const kids = src.root.children, bi = kids.indexOf(src.body);
        if (bi >= 0) { if (src.baseY != null) m.children[bi].position.y = src.baseY; const hi = src.body.children.indexOf(src.head); if (hi >= 0) m.children[bi].children[hi].rotation.x = 0.1; }
        src.legs.forEach(l => { const k = kids.indexOf(l); if (k >= 0) m.children[k].rotation.x = 0; }); }
      carry.add(m); carry.userData.m = m;
      scene.add(carry);
    }
    carry.visible = !PL.swim && !PL.ride && !PL.climb;
    if (!carry.visible) return;
    const sp = PLAYER.CH.bones.Spine2;
    sp.getWorldPosition(_cp);
    const s = Math.sin(PL.yaw), c = Math.cos(PL.yaw);
    _cp.x -= s * 0.10; _cp.z -= c * 0.10; _cp.y += 0.50;   // 등뼈(가슴 높이)에서 목 뒤 어깨 위로
    carry.position.copy(_cp);
    carry.rotation.set(0, PL.yaw + Math.PI / 2, 0);   // 어깨를 가로질러 눕힌다
  }

  window.HUNT = { build, step, update, fire, aim, goals, near, take, gunMesh, get cool() { return coolT; } };
})();
