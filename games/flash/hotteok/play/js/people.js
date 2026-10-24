// 손님: folk.js 로 직접 그린 상반신 그림을 3D 장면에 세운 판(빌보드). 표정마다 얼굴 그림 한 장
// 10/24 사장님 "손님들이 너무 종이인형" → 뒷머리·몸·머리 세 장으로 나눠 머리를 목 축으로 따로 움직이고,
// 그림 테두리로 만든 둥근 볼륨(법선 지도)으로 전구 빛이 가장자리에서 돌아 떨어지게, 표정마다 몸짓
// game.js 와 맞물리는 겉모양(root·height·busy·play·mixer.update·setMood)은 그대로 둔다
(function () {
  const PE = (window.PEOPLE = {});
  const F = FOLK;
  PE.ready = {};
  const MOODS = ['idle', 'blink', 'happy', 'angry', 'wait'];
  const PX = 0.00125; // 그림 1px = 1.25mm
  function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  // 둥근 볼륨: 그림의 알파를 흐려 높이로 삼고 기울기를 법선으로(가장자리일수록 바깥으로 눕는 베개 모양)
  // 법선 지도는 장면 빛용, 그리고 노점 전구(왼쪽 위 앞)에서 오는 음영을 그림에 직접 구워 가장자리가 둥글게 돌아 떨어지게
  function volume(src, blur) {
    const w = src.width, h = src.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.filter = 'blur(' + blur + 'px)'; g.drawImage(src, 0, 0); g.filter = 'none';
    const a = g.getImageData(0, 0, w, h), d = a.data, H = new Float32Array(w * h), S = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) H[i] = Math.sqrt(d[i * 4 + 3] / 255);
    const K = 7, L = [-0.55, 0.62, 0.56]; // 빛 방향(오른쪽+, 위+, 앞+)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, l = H[i - (x > 0 ? 1 : 0)], r = H[i + (x < w - 1 ? 1 : 0)], u = H[i - (y > 0 ? w : 0)], dn = H[i + (y < h - 1 ? w : 0)];
      let nx = (l - r) * K, ny = (dn - u) * K, nz = 1; const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
      d[i * 4] = (nx * 0.5 + 0.5) * 255; d[i * 4 + 1] = (ny * 0.5 + 0.5) * 255; d[i * 4 + 2] = (nz * 0.5 + 0.5) * 255; d[i * 4 + 3] = 255;
      S[i] = (nx * L[0] + ny * L[1] + nz * L[2]) - (L[2]); // 평평한 안쪽은 0, 빛 쪽 가장자리 +, 반대쪽 −
    }
    g.putImageData(a, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
    return { nrm: t, S };
  }
  function bake(cv, S) {
    const g = cv.getContext('2d'), a = g.getImageData(0, 0, cv.width, cv.height), d = a.data;
    for (let i = 0; i < S.length; i++) {
      if (!d[i * 4 + 3]) continue; const s = S[i];
      const k = s >= 0 ? 1 + s * 0.8 : Math.max(0.45, 1 + s * 1.7); // 그늘 쪽을 더 깊게
      d[i * 4] = Math.min(255, d[i * 4] * k + (s > 0 ? s * 40 : 0)); d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] * k + (s > 0 ? s * 28 : 0)); d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] * (s >= 0 ? k : 1 + s * 0.8) + (s > 0 ? s * 10 : 0));
    }
    g.putImageData(a, 0, 0); return cv;
  }
  function matOf(tex, nrm) {
    return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.26, normalMap: nrm, normalScale: new THREE.Vector2(1.2, 1.2),
      transparent: true, alphaTest: 0.4, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  }
  function make(spec) {
    const W = F.W, Hh = F.H, w = W * PX, h = Hh * PX;
    const kid = spec.age === 'kid';
    const bottom = kid ? -0.36 : -0.18; // 판 아래 끝(허리)의 세상 높이: 조리대가 가린다
    const base = bottom + 0.9; // 판 아래 끝 높이(root 기준)
    const py = (px) => base + h - px * PX; // 그림 y(px) → 높이
    const cBody = F.draw(spec, 'idle', null, null, 'body'), cBack = F.draw(spec, 'idle', null, null, 'back'), cHead = F.draw(spec, 'idle', null, null, 'head');
    const vBody = volume(cBody, 18), vBack = volume(cBack, 12), vHead = volume(cHead, 16);
    const headTex = (m) => texOf(bake(m === 'idle' ? cHead : F.draw(spec, m, null, null, 'head'), vHead.S));
    const tex = { idle: headTex('idle') };
    const mBody = matOf(texOf(bake(cBody, vBody.S)), vBody.nrm), mBack = matOf(texOf(bake(cBack, vBack.S)), vBack.nrm), mHead = matOf(tex.idle, vHead.nrm);
    const geo = new THREE.PlaneGeometry(w, h);
    // 몸: 허리를 축으로 숨쉬기(어깨가 오르내림)
    const bodyG = new THREE.Group(); bodyG.position.y = base;
    const pBody = new THREE.Mesh(geo, mBody); pBody.position.y = h / 2; bodyG.add(pBody);
    // 머리: 목 위를 축으로 끄덕·갸웃. 뒷머리는 몸 뒤, 얼굴은 몸 앞
    const neck = py(F.neckY(spec));
    const headG = new THREE.Group(); headG.position.y = neck - base; bodyG.add(headG);
    const pBack = new THREE.Mesh(geo, mBack); pBack.position.set(0, base + h / 2 - neck, -0.006); headG.add(pBack);
    const pHead = new THREE.Mesh(geo, mHead); pHead.position.set(0, base + h / 2 - neck, 0.006); headG.add(pHead);
    // 머리가 몸에 드리우는 그림자(오른쪽 아래, 머리와 같이 움직임) — 층이 떠 보여 입체감
    const sc = document.createElement('canvas'); sc.width = W / 2; sc.height = Hh / 2; const sg = sc.getContext('2d'); sg.drawImage(cHead, 0, 0, W / 2, Hh / 2); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#fff'; sg.fillRect(0, 0, W, Hh); // 실루엣만(알파맵은 초록 값을 읽음)
    const sc2 = document.createElement('canvas'); sc2.width = W / 2; sc2.height = Hh / 2; const sg2 = sc2.getContext('2d'); sg2.fillStyle = '#000'; sg2.fillRect(0, 0, W, Hh); sg2.filter = 'blur(7px)'; sg2.drawImage(sc, 0, 0);
    const sMat = new THREE.MeshBasicMaterial({ color: 0x1a0c06, alphaMap: new THREE.CanvasTexture(sc2), transparent: true, opacity: 0.55, depthWrite: false });
    const pShade = new THREE.Mesh(geo, sMat); pShade.position.set(0.014, base + h / 2 - neck - 0.022, 0.002); pShade.renderOrder = 1; headG.add(pShade);
    const body = new THREE.Group(); body.add(bodyG); // body: game.js 가 걸을 때 쓰는 이름 그대로
    const root = new THREE.Group(); root.add(body); root.visible = false; RND.scene.add(root);
    // 머리 꼭대기 높이(그림 위에서 약 90px 아래)
    const headTopPx = kid ? 140 : 95;
    const height = py(headTopPx);
    let mood = 'idle', t = Math.random() * 10, blinkT = 2 + Math.random() * 3, walking = false, moodT = 0, look = 0, lookT = 1 + Math.random() * 2;
    const lag = { r: 0, y: 0 }; // 걸을 때 머리가 늦게 따라오는 몫
    const p = {
      id: spec.id, spec, root, body, plane: pBody, height, busy: false,
      play(n) { walking = n === 'walk'; },
      setMood(m) { if (m === null) { if (mood !== 'idle' && mood !== 'blink') m = 'idle'; else return; } if (m === mood) return; if (m !== 'blink' && !(mood === 'blink' && m === 'idle')) moodT = 0; mood = m; if (!tex[m]) tex[m] = headTex(m); mHead.map = tex[m]; mHead.emissiveMap = tex[m]; },
      mixer: {
        update(dt) {
          t += dt; moodT += dt;
          const ry = root.rotation.y;
          bodyG.rotation.y = -ry; // 그림은 늘 카메라 쪽
          let by = 0, bz = 0, sx = 1, sy = 1 + Math.sin(t * 2.2) * 0.012, hr = Math.sin(t * 1.3) * 0.035, hx = Math.sin(t * 0.7) * 0.03, hy = Math.sin(t * 2.2 + 0.6) * 0.004;
          if (walking) {
            const s = Math.sin(t * 9), up = Math.abs(s);
            by = up * 0.035; bz = s * 0.05 + (Math.abs(ry) > 0.6 ? -Math.sign(ry) * 0.06 : 0); // 걷는 쪽으로 기울며 통통
            sy = 1 + (up - 0.5) * 0.05; sx = 1 - (up - 0.5) * 0.03; // 디딜 때 살짝 눌림
            lag.r += ((-bz * 1.6) - lag.r) * Math.min(1, dt * 6); hr += lag.r; hy += (1 - up) * 0.006;
          } else {
            bz = Math.abs(ry) < 0.6 ? ry * 0.4 : 0; lag.r *= Math.max(0, 1 - dt * 5);
            if (mood === 'happy') { const k = Math.max(0, 1 - moodT / 1.2); by = Math.abs(Math.sin(moodT * 11)) * 0.045 * k; hr += Math.sin(moodT * 5) * 0.16 * (0.4 + k); sy += Math.sin(moodT * 11) * 0.02 * k; }
            else if (mood === 'angry') { const k = Math.max(0.25, 1 - moodT / 0.8); hx += Math.sin(moodT * 28) * 0.06 * k; hr += Math.sin(moodT * 28 + 1) * 0.12 * k; bz += Math.sin(moodT * 28) * 0.02 * k; } // 고개 도리도리, 어깨 들썩
            else if (mood === 'wait') { lookT -= dt; if (lookT < 0) { look = look ? 0 : (Math.random() < 0.5 ? -1 : 1); lookT = 0.7 + Math.random() * 1.2; } hx += look * 0.22; hr += look * 0.06; by = Math.abs(Math.sin(t * 7)) * 0.012; } // 두리번, 발 동동
            else hx += 0.06; // 평소엔 철판 쪽을 살짝 내려다봄
          }
          body.position.y = by; bodyG.rotation.z = bz; bodyG.scale.set(sx, sy, 1);
          headG.rotation.z = hr; headG.rotation.x = hx; headG.position.y = neck - base + hy;
          // 눈 깜빡임
          if (mood === 'idle' || mood === 'blink') { blinkT -= dt; if (blinkT < 0) { p.setMood('blink'); if (blinkT < -0.12) { p.setMood('idle'); blinkT = 2.5 + Math.random() * 3; } } }
        },
      },
    };
    p.warm = () => MOODS.forEach((m) => { if (!tex[m]) tex[m] = headTex(m); });
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
