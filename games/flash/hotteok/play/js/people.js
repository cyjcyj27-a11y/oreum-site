// 손님: folk.js 로 직접 그린 상반신 그림을 3D 장면에 세운 판(빌보드). 표정마다 그림 한 장
// game.js 와 맞물리는 겉모양(root·height·busy·play·mixer.update·setMood)은 그대로 둔다
(function () {
  const PE = (window.PEOPLE = {});
  const F = FOLK;
  PE.ready = {};
  const MOODS = ['idle', 'blink', 'happy', 'angry', 'wait'];
  const PX = 0.00125; // 그림 1px = 1.25mm
  function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  function make(spec) {
    const tex = {};
    tex.idle = texOf(F.draw(spec, 'idle'));
    const mat = new THREE.MeshStandardMaterial({ map: tex.idle, emissiveMap: tex.idle, emissive: 0xffffff, emissiveIntensity: 0.38, transparent: true, alphaTest: 0.4, roughness: 1, metalness: 0, side: THREE.DoubleSide });
    const w = F.W * PX, h = F.H * PX;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const kid = spec.age === 'kid';
    const bottom = kid ? -0.36 : -0.18; // 판 아래 끝(허리)의 세상 높이: 조리대가 가린다
    plane.position.y = bottom + 0.9 + h / 2;
    const body = new THREE.Group(); body.add(plane);
    const root = new THREE.Group(); root.add(body); root.visible = false; RND.scene.add(root);
    // 머리 꼭대기 높이(그림 위에서 약 90px 아래)
    const headTopPx = kid ? 140 : 95;
    const height = bottom + 0.9 + h - headTopPx * PX;
    let mood = 'idle', t = Math.random() * 10, blinkT = 2 + Math.random() * 3, walking = false;
    const p = {
      id: spec.id, spec, root, body, plane, height, busy: false,
      play(n) { walking = n === 'walk'; },
      setMood(m) { if (m === null) { if (mood !== 'idle' && mood !== 'blink') m = 'idle'; else return; } if (m === mood) return; mood = m; if (!tex[m]) tex[m] = texOf(F.draw(spec, m)); mat.map = tex[m]; mat.emissiveMap = tex[m]; },
      mixer: {
        update(dt) {
          t += dt;
          // 숨쉬기 + 걸을 땐 통통 튀며 기울기
          const ry = root.rotation.y;
          plane.rotation.y = -ry; // 그림은 늘 카메라 쪽
          if (walking) { body.position.y = Math.abs(Math.sin(t * 9)) * 0.03; plane.rotation.z = Math.sin(t * 9) * 0.04; }
          else { body.position.y = 0; plane.rotation.z = Math.abs(ry) < 0.6 ? ry * 0.6 : 0; }
          plane.scale.y = 1 + Math.sin(t * 2.2) * 0.006;
          // 눈 깜빡임
          if (mood === 'idle' || mood === 'blink') { blinkT -= dt; if (blinkT < 0) { p.setMood('blink'); if (blinkT < -0.12) { p.setMood('idle'); blinkT = 2.5 + Math.random() * 3; } } }
        },
      },
    };
    p.warm = () => MOODS.forEach((m) => { if (!tex[m]) tex[m] = texOf(F.draw(spec, m)); });
    return p;
  }
  // 그림을 한 명씩 나눠 굽기(첫 화면이 멈추지 않게)
  PE.loadAll = function (onEach) {
    return new Promise((res) => {
      const list = F.PEOPLE.slice(); const out = [];
      const step = () => {
        const s = list.shift(); if (!s) { res(out); return; }
        const p = make(s); PE.ready[s.id] = p; out.push(p); if (onEach) onEach(p);
        setTimeout(() => { p.warm(); setTimeout(step, 0); }, 0);
      };
      step();
    });
  };
  PE.free = function () { const ids = Object.keys(PE.ready).filter((k) => !PE.ready[k].busy); return ids.length ? PE.ready[ids[Math.floor(Math.random() * ids.length)]] : null; };
})();
