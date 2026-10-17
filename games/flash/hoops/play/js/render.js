// 그림: 어두운 오락실, 형광 카펫, 뒤에 흐린 기계 불빛. 앞에 농구 기계(빨간 옆판·LED 띠·그물 우리·경사로·투명 백보드·주황 림·흰 그물·점수판·네온 간판).
(function () {
  const T = THREE, P = PHY;
  const R = (window.RND = {});
  const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
  R.MOBILE = MOBILE;
  let renderer, scene, camera, cv;
  let glowT;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  function canvasTex(w, h, draw, srgb) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    t.userData.canvas = c;
    return t;
  }

  // ── 농구공: 주황 가죽 + 오돌토돌 + 검은 솔기(적도·자오선 + 휘는 줄 둘)
  function seamV(u, s) { return 0.5 + s * (0.5 - 0.30 * Math.cos(u * Math.PI * 4)) * 0.62; }
  function ballMaps(fire) {
    const W = 1024, H = 512;
    const col = canvasTex(W, H, (g) => {
      const base = fire ? '#ff7a1a' : '#e2671f';
      g.fillStyle = base; g.fillRect(0, 0, W, H);
      seed = 31;
      // 가죽 얼룩·결
      for (let k = 0; k < 900; k++) {
        const x = rnd() * W, y = rnd() * H, r = 8 + rnd() * 40;
        g.fillStyle = rnd() < 0.5 ? `rgba(255,170,90,${rnd() * 0.06})` : `rgba(90,25,0,${rnd() * 0.07})`;
        g.beginPath(); g.ellipse(x, y, r, r * 0.6, rnd() * 3, 0, 7); g.fill();
      }
      // 오돌토돌 점
      for (let k = 0; k < 26000; k++) {
        const x = rnd() * W, y = rnd() * H;
        g.fillStyle = rnd() < 0.55 ? 'rgba(255,190,120,0.16)' : 'rgba(80,20,0,0.18)';
        g.fillRect(x, y, 2, 2);
      }
      // 극 쪽은 지도 늘어남 → 살짝 어둡게(실제 공 그늘처럼 보이지 않게 아주 조금)
      g.strokeStyle = '#1b0f0a'; g.lineCap = 'round';
      g.lineWidth = 9;
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      [0.0, 0.5, 1.0].forEach((u) => { g.beginPath(); g.moveTo(u * W, 0); g.lineTo(u * W, H); g.stroke(); });
      [-1, 1].forEach((s) => {
        g.beginPath();
        for (let i = 0; i <= 200; i++) { const u = i / 200, y = seamV(u, s) * H; i ? g.lineTo(u * W, y) : g.moveTo(u * W, y); }
        g.stroke();
      });
      // 솔기 옆 홈 그늘
      g.strokeStyle = 'rgba(40,10,0,0.25)'; g.lineWidth = 18;
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      // 상표 자리(작은 금색 글자 대신 둥근 무늬)
      g.strokeStyle = 'rgba(30,12,4,0.55)'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(W * 0.25, H * 0.5 - 70, 46, 22, 0, 0, 7); g.stroke();
      g.fillStyle = 'rgba(30,12,4,0.5)'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('OREUM', W * 0.25, H * 0.5 - 70);
    });
    const bump = canvasTex(W, H, (g) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
      seed = 57;
      for (let k = 0; k < 42000; k++) { const v = rnd() < 0.5 ? 200 : 60; g.fillStyle = `rgb(${v},${v},${v})`; g.globalAlpha = 0.35; g.fillRect(rnd() * W, rnd() * H, 2, 2); }
      g.globalAlpha = 1; g.strokeStyle = '#101010'; g.lineWidth = 11; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      [0.0, 0.5, 1.0].forEach((u) => { g.beginPath(); g.moveTo(u * W, 0); g.lineTo(u * W, H); g.stroke(); });
      [-1, 1].forEach((s) => { g.beginPath(); for (let i = 0; i <= 200; i++) { const u = i / 200, y = seamV(u, s) * H; i ? g.lineTo(u * W, y) : g.moveTo(u * W, y); } g.stroke(); });
    }, false);
    return { col, bump };
  }

  // ── 형광 카펫(오락실 바닥)
  function carpetTex() {
    const t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#0d0b22'; g.fillRect(0, 0, w, h);
      seed = 91;
      for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
      const cols = ['#ff3fa4', '#2ef2ff', '#ffe23a', '#7c4dff', '#39ff7a'];
      for (let k = 0; k < 70; k++) {
        const x = rnd() * w, y = rnd() * h, c = cols[(rnd() * cols.length) | 0], s = 10 + rnd() * 22, a = rnd() * 6, tp = (rnd() * 4) | 0;
        g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 3.5; g.globalAlpha = 0.85;
        if (tp === 0) { g.beginPath(); g.arc(0, 0, s * 0.5, 0, 7); g.stroke(); }
        else if (tp === 1) { g.beginPath(); g.moveTo(-s / 2, s / 3); g.lineTo(0, -s / 2); g.lineTo(s / 2, s / 3); g.closePath(); g.stroke(); }
        else if (tp === 2) { g.beginPath(); for (let i = 0; i < 6; i++) { g.lineTo(-s / 2 + i * s / 5, (i % 2 ? -1 : 1) * s * 0.18); } g.stroke(); }
        else { g.fillRect(-s * 0.15, -s * 0.15, s * 0.3, s * 0.3); }
        g.restore();
      }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(10, 10);
    return t;
  }

  // ── 경사로: 짙은 고무 + 흰 줄 + 굴러오는 쪽 화살표
  function rampTex() {
    const t = canvasTex(256, 1024, (g, w, h) => {
      g.fillStyle = '#1f2a24'; g.fillRect(0, 0, w, h);
      seed = 13;
      for (let k = 0; k < 14000; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.12)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
      g.fillStyle = 'rgba(240,240,230,0.75)';
      g.fillRect(8, 0, 6, h); g.fillRect(w - 14, 0, 6, h);
      // 공이 굴러오는 쪽(플레이어 쪽 = 아래)을 가리키는 큰 화살표 하나
      g.fillStyle = 'rgba(255,170,40,0.6)';
      const y = 380; g.beginPath(); g.moveTo(w / 2 - 70, y); g.lineTo(w / 2, y + 120); g.lineTo(w / 2 + 70, y); g.lineTo(w / 2 + 70, y + 44); g.lineTo(w / 2, y + 164); g.lineTo(w / 2 - 70, y + 44); g.closePath(); g.fill();
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }

  // ── 그물(우리 옆·지붕): 마름모 그물코, 투명
  function netTex() {
    const t = canvasTex(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(230,230,235,1)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
      g.lineWidth = 2; g.strokeStyle = 'rgba(200,200,210,1)';
      g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); g.stroke();
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }

  // ── 투명 백보드 무늬: 흰 테 + 주황 슈터 네모
  function boardTex() {
    return canvasTex(512, 344, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
      g.strokeStyle = '#ff6a1a'; g.lineWidth = 12;
      const sw = w * 0.36, sh = h * 0.42; g.strokeRect(w / 2 - sw / 2, h - 18 - sh, sw, sh);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(14, 14, w - 28, h - 28);
    });
  }
  // ── 뒷벽: 검정 바탕 + 주황·빨강 햇살 무늬(투명판이 잘 보이게)
  function backTex() {
    return canvasTex(1024, 1024, (g, w, h) => {
      const bg = g.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h * 0.42, w * 0.7);
      bg.addColorStop(0, '#3a0c08'); bg.addColorStop(1, '#0a0406');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.save(); g.translate(w / 2, h * 0.42);
      for (let i = 0; i < 24; i++) { g.rotate(Math.PI * 2 / 24); g.fillStyle = i % 2 ? 'rgba(255,90,20,0.10)' : 'rgba(255,40,40,0.05)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -w); g.lineTo(60, -w); g.closePath(); g.fill(); }
      g.restore();
      // 농구공 실루엣 줄
      g.strokeStyle = 'rgba(255,120,40,0.18)'; g.lineWidth = 10;
      g.beginPath(); g.arc(w / 2, h * 0.42, 250, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(w / 2 - 250, h * 0.42); g.lineTo(w / 2 + 250, h * 0.42); g.stroke();
      g.beginPath(); g.moveTo(w / 2, h * 0.42 - 250); g.lineTo(w / 2, h * 0.42 + 250); g.stroke();
    });
  }
  // ── 옆판: 빨간 칠 + 흰·노랑 속도 줄 + 검은 테
  function sideTex() {
    return canvasTex(1024, 256, (g, w, h) => {
      const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, '#e2262a'); lg.addColorStop(0.6, '#b3141c'); lg.addColorStop(1, '#6e0a10');
      g.fillStyle = lg; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i === 1 ? '#ffd23a' : '#ffffff';
        g.beginPath(); const y = 70 + i * 34; g.moveTo(0, y); g.lineTo(w * 0.85 - i * 60, y); g.lineTo(w * 0.85 - i * 60 + 40, y + 14); g.lineTo(0, y + 14); g.closePath(); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 12, w, 12);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 12, w, 3);
    });
  }
  // ── LED 띠: 점 줄(오프셋을 움직여 흐르게)
  function ledTex() {
    const t = canvasTex(64, 16, (g, w, h) => {
      g.fillStyle = '#1a0606'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        const x = 8 + i * 16, c = ['#ffdd55', '#ff4a4a', '#ffdd55', '#ff9a2a'][i];
        const rg = g.createRadialGradient(x, 8, 0, x, 8, 7); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.35, c); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(x, 8, 7, 0, 7); g.fill();
      }
    });
    t.wrapS = T.RepeatWrapping;
    return t;
  }
  // ── 빛 번짐 스프라이트
  function glowTex() {
    return canvasTex(64, 64, (g, w) => {
      const rg = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(0, 0, w, w);
    });
  }
  // ── 7세그 숫자(점수판·HUD 와 같은 꼴)
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  function seg7(g, ch, x, y, w, h, on, off) {
    const t = Math.max(3, w * 0.17), s = SEG[ch] == null ? '' : SEG[ch];
    const hseg = (yy, k) => { g.fillStyle = s.includes(k) ? on : off; g.beginPath(); g.moveTo(x + t * 0.6, yy); g.lineTo(x + t, yy - t / 2); g.lineTo(x + w - t, yy - t / 2); g.lineTo(x + w - t * 0.6, yy); g.lineTo(x + w - t, yy + t / 2); g.lineTo(x + t, yy + t / 2); g.closePath(); g.fill(); };
    const vseg = (xx, y0, y1, k) => { g.fillStyle = s.includes(k) ? on : off; g.beginPath(); g.moveTo(xx, y0 + t * 0.6); g.lineTo(xx + t / 2, y0 + t); g.lineTo(xx + t / 2, y1 - t); g.lineTo(xx, y1 - t * 0.6); g.lineTo(xx - t / 2, y1 - t); g.lineTo(xx - t / 2, y0 + t); g.closePath(); g.fill(); };
    const m = y + h / 2;
    hseg(y + t / 2, 'a'); hseg(m, 'g'); hseg(y + h - t / 2, 'd');
    vseg(x + t / 2, y, m, 'f'); vseg(x + w - t / 2, y, m, 'b'); vseg(x + t / 2, m, y + h, 'e'); vseg(x + w - t / 2, m, y + h, 'c');
  }
  R.seg7 = seg7;
  function sbDraw(g, w, h, st) {
    g.fillStyle = '#070707'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a3a3a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#d9d9d9'; g.font = 'bold 30px "Ui", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SCORE', w * 0.2, 36); g.fillText('TIME', w * 0.5, 36); g.fillText('GOAL', w * 0.8, 36);
    const on = '#ff2d1f', off = 'rgba(255,45,31,0.09)', dw = 36, dh = 74;
    const num = (str, cx, col) => { for (let i = 0; i < str.length; i++) seg7(g, str[i], cx - (str.length * (dw + 10) - 10) / 2 + i * (dw + 10), 76, dw, dh, col || on, off); };
    num(String(st.score), w * 0.2);
    num(String(Math.ceil(st.time)).padStart(2, '0'), w * 0.5, st.time <= 10 ? '#ffd23a' : on);
    num(String(st.goal), w * 0.8, '#3dff6a');
  }

  // ── 공·림에 비칠 방(어두운 오락실, 여러 색 불빛)
  function buildEnv() {
    const es = new T.Scene();
    es.background = new T.Color(0x0b0a16);
    const box = new T.Mesh(new T.BoxGeometry(14, 6, 14), new T.MeshBasicMaterial({ color: 0x141226, side: T.BackSide }));
    box.position.y = 2.5; es.add(box);
    const cols = [[3, 0.6, 1.6], [0.4, 2.4, 3], [3, 2.6, 0.6], [2.6, 0.8, 0.3], [1.4, 0.6, 3]];
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2, c = cols[i % cols.length];
      const m = new T.Mesh(new T.PlaneGeometry(1.4, 0.9), new T.MeshBasicMaterial({ color: new T.Color(c[0], c[1], c[2]) }));
      m.position.set(Math.sin(a) * 6.5, 1.6 + (i % 3) * 0.6, Math.cos(a) * 6.5); m.lookAt(0, 1.6, 0); es.add(m);
    }
    const top = new T.Mesh(new T.PlaneGeometry(2.2, 2.2), new T.MeshBasicMaterial({ color: new T.Color(5, 4.6, 4) }));
    top.rotation.x = Math.PI / 2; top.position.set(0, 4.9, 0); es.add(top);
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(es, 0.04).texture;
  }

  let spot, hoopLight, pinkL, cyanL;
  function buildLights() {
    scene.add(new T.HemisphereLight(0x6a6aff, 0x2a1010, 0.55));
    spot = new T.SpotLight(0xfff0dc, 70, 12, 0.62, 0.55, 1.4);
    spot.position.set(0, 4.7, 1.3);
    spot.target.position.set(0, 1.4, -2.2);
    spot.castShadow = true;
    spot.shadow.mapSize.set(MOBILE ? 512 : 1024, MOBILE ? 512 : 1024); spot.shadow.bias = -0.0006; spot.shadow.radius = 3;
    spot.shadow.camera.near = 1; spot.shadow.camera.far = 11;
    scene.add(spot, spot.target);
    hoopLight = new T.PointLight(0xffd2a0, 5, 4.5, 1.6);
    scene.add(hoopLight);
    const handL = new T.PointLight(0xffe6c8, 2.2, 3.2, 1.5); handL.position.set(0, 2.25, 1.1); scene.add(handL);
  }

  // ── 오락실 방: 카펫, 벽, 뒤의 기계들
  function screenTex(k) {
    return canvasTex(128, 96, (g, w, h) => {
      seed = 200 + k * 17;
      const hue = (k * 67) % 360;
      const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, `hsl(${hue},80%,35%)`); lg.addColorStop(1, `hsl(${(hue + 60) % 360},80%,15%)`);
      g.fillStyle = lg; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = `hsla(${(hue + rnd() * 120) % 360},90%,${50 + rnd() * 30}%,0.9)`; const s = 4 + rnd() * 10; g.fillRect((rnd() * w) | 0, (rnd() * h) | 0, s, s); }
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    });
  }
  function buildRoom() {
    const grp = new T.Group();
    const fl = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshStandardMaterial({ map: carpetTex(), roughness: 0.95, metalness: 0 }));
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; grp.add(fl);
    const wallM = new T.MeshStandardMaterial({ color: 0x15121f, roughness: 0.9 });
    const wall = new T.Mesh(new T.PlaneGeometry(30, 7), wallM); wall.position.set(0, 3.5, -12); grp.add(wall);
    // 뒤의 기계들(흐리게, 화면만 빛남)
    const cabM = new T.MeshStandardMaterial({ color: 0x1c1a2a, roughness: 0.6, metalness: 0.2 });
    const spots = [[-3.2, -1.5, 0.5], [-3.4, -3.2, 0.4], [-3.0, 1.0, 0.7], [3.2, -1.5, -0.5], [3.4, -3.2, -0.4], [3.0, 1.0, -0.7], [-1.6, -9.5, 0], [0.4, -9.8, 0], [2.4, -9.5, 0], [-4.4, -7, 0.3], [4.4, -7, -0.3]];
    spots.forEach((s, i) => {
      const g = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(0.85, 1.9, 0.8), cabM); body.position.y = 0.95; g.add(body);
      const scr = new T.Mesh(new T.PlaneGeometry(0.62, 0.48), new T.MeshBasicMaterial({ map: screenTex(i), color: new T.Color(1.6, 1.6, 1.6) }));
      scr.position.set(0, 1.35, 0.41); scr.rotation.x = -0.15; g.add(scr);
      const hue = new T.Color().setHSL(((i * 67) % 360) / 360, 0.9, 0.55);
      const mq = new T.Mesh(new T.BoxGeometry(0.85, 0.18, 0.12), new T.MeshBasicMaterial({ color: hue.clone().multiplyScalar(2.2) }));
      mq.position.set(0, 1.86, 0.36); g.add(mq);
      const pan = new T.Mesh(new T.BoxGeometry(0.85, 0.08, 0.35), cabM); pan.position.set(0, 1.0, 0.5); g.add(pan);
      g.position.set(s[0], 0, s[1]); g.rotation.y = s[2] + (s[0] < 0 ? Math.PI / 2 : s[0] > 0 && Math.abs(s[1]) < 5 ? -Math.PI / 2 : 0);
      grp.add(g);
    });
    // 천장 네온 줄
    const neonCols = [0xff3fa4, 0x2ef2ff, 0xffe23a];
    for (let i = 0; i < 3; i++) {
      const n = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 14), new T.MeshBasicMaterial({ color: new T.Color(neonCols[i]).multiplyScalar(2.5) }));
      n.position.set(-3 + i * 3, 5.2, -4); grp.add(n);
    }
    return grp;
  }

  // ── 농구 기계(판마다 길이가 바뀌어 다시 짓는다: 멈춘 시간에만)
  const MAT = {};
  function mats() {
    MAT.side = new T.MeshStandardMaterial({ map: sideTex(), roughness: 0.35, metalness: 0.1, side: T.DoubleSide });
    MAT.metal = new T.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.28, metalness: 0.9 });
    MAT.dark = new T.MeshStandardMaterial({ color: 0x141418, roughness: 0.5, metalness: 0.4 });
    MAT.net = new T.MeshStandardMaterial({ map: netTex(), alphaTest: 0.45, side: T.DoubleSide, roughness: 0.8, color: 0xdddde6 });
    MAT.ramp = new T.MeshStandardMaterial({ map: rampTex(), roughness: 0.85, metalness: 0 });
    MAT.back = new T.MeshStandardMaterial({ map: backTex(), roughness: 0.7, emissive: 0xffffff, emissiveIntensity: 0.12 });
    MAT.back.emissiveMap = MAT.back.map;
    MAT.led = new T.MeshBasicMaterial({ map: ledTex(), color: new T.Color(2.2, 2.2, 2.2) });
    MAT.ledL = MAT.led.map;
    MAT.rim = new T.MeshStandardMaterial({ color: 0xff5a14, roughness: 0.32, metalness: 0.75, emissive: 0x401000 });
    MAT.glass = new T.MeshStandardMaterial({ color: 0xdfefff, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.18, envMapIntensity: 1.6, depthWrite: false });
    MAT.decal = new T.MeshBasicMaterial({ map: boardTex(), transparent: true, depthWrite: false });
    MAT.frame = new T.MeshBasicMaterial({ color: new T.Color(1, 1, 1) });
    MAT.coin = new T.MeshStandardMaterial({ map: coinTex(), roughness: 0.5, metalness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.35 });
    MAT.coin.emissiveMap = MAT.coin.map;
  }
  function coinTex() {
    return canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#9b1016'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#16161a'; g.fillRect(150, 40, 212, 150);
      g.strokeStyle = '#c8ccd4'; g.lineWidth = 6; g.strokeRect(150, 40, 212, 150);
      g.fillStyle = '#ffcf3a'; g.fillRect(186, 74, 40, 70); g.fillRect(286, 74, 40, 70);
      g.fillStyle = '#000'; g.fillRect(203, 84, 6, 50); g.fillRect(303, 84, 6, 50);
      g.fillStyle = '#ffe9a0'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('INSERT COIN', w / 2, 226);
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, 6);
    });
  }
  // 경사 옆판: z 따라 높이가 바뀌는 판(바깥에서 보이는 빨간 판)
  function slopeGeo(z0, z1, top0, top1) {
    const g = new T.BufferGeometry();
    const pos = [z0, 0, z1, 0, z1, top1, z0, top0], uv = [0, 0, 1, 0, 1, 1, 0, 1];
    const v = new Float32Array([0, pos[1], pos[0], 0, pos[3], pos[2], 0, pos[5], pos[4], 0, pos[7], pos[6]]);
    g.setAttribute('position', new T.BufferAttribute(v, 3));
    g.setAttribute('uv', new T.BufferAttribute(new Float32Array(uv), 2));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
    return g;
  }
  let cab = null;
  function buildCab() {
    if (cab) { scene.remove(cab); cab.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    cab = new T.Group();
    const CW = P.CW, zF = P.FZ + 0.12, zB = P.backZ(), len = zF - zB, RAIL = 0.26;
    const fy = (x, z) => P.floorY(x, z);
    // 경사로(골이 진 바닥)
    const NX = 10, NZ = Math.max(12, Math.round(len * 6));
    const rg = new T.PlaneGeometry(1, 1, NX, NZ), pa = rg.attributes.position, ua = rg.attributes.uv;
    for (let i = 0; i < pa.count; i++) {
      const u = pa.getX(i) + 0.5, v = pa.getY(i) + 0.5;
      const x = -CW + u * 2 * CW, z = (zF - 0.12) - v * (zF - zB - 0.12);
      pa.setXYZ(i, x, fy(x, z), z); ua.setXY(i, u, v * len / 1.4);
    }
    rg.computeVertexNormals();
    const ramp = new T.Mesh(rg, MAT.ramp); ramp.receiveShadow = true; cab.add(ramp);
    // 옆판(양쪽) + 위 난간 + LED 띠
    for (const s of [-1, 1]) {
      const x = s * (CW + 0.03);
      const t0 = fy(CW, zF) + RAIL, t1 = fy(CW, zB) + RAIL;
      const sg = slopeGeo(zF, zB, t0, t1);
      const side = new T.Mesh(sg, MAT.side); side.position.x = x; cab.add(side);
      const ang = Math.atan2(t1 - t0, zF - zB);
      const rail = new T.Mesh(new T.BoxGeometry(0.07, 0.05, len), MAT.dark);
      rail.position.set(x, (t0 + t1) / 2 + 0.02, (zF + zB) / 2); rail.rotation.x = ang; cab.add(rail);
      const led = new T.Mesh(new T.PlaneGeometry(len, 0.035), MAT.led);
      led.position.set(s * (CW - 0.01), (t0 + t1) / 2 + 0.01, (zF + zB) / 2);
      led.rotation.set(0, -s * Math.PI / 2, 0); led.rotateZ(-s * ang);
      MAT.led.map.repeat.set(len * 14, 1);
      cab.add(led);
      // 그물 벽
      const nh = P.ROOF - (t0 + t1) / 2;
      const ng = new T.PlaneGeometry(len, nh);
      const nt = MAT.net.map; nt.repeat.set(len * 9, nh * 9);
      const nm = new T.Mesh(ng, MAT.net); nm.position.set(s * CW, (t0 + t1) / 2 + nh / 2, (zF + zB) / 2); nm.rotation.y = Math.PI / 2; cab.add(nm);
      // 기둥(앞·뒤)
      for (const z of [zF - 0.04, zB + 0.03]) {
        const top = P.ROOF + 0.05, bot = fy(CW, z) + RAIL;
        const post = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, top - bot, 10), MAT.metal);
        post.position.set(s * (CW + 0.02), (top + bot) / 2, z); cab.add(post);
      }
      const beam = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, len, 8), MAT.metal);
      beam.rotation.x = Math.PI / 2; beam.position.set(s * (CW + 0.02), P.ROOF + 0.05, (zF + zB) / 2); cab.add(beam);
    }
    // 지붕 그물
    const roof = new T.Mesh(new T.PlaneGeometry(2 * CW, len), MAT.net); roof.rotation.x = Math.PI / 2; roof.position.set(0, P.ROOF + 0.04, (zF + zB) / 2); cab.add(roof);
    const fb = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 2 * CW + 0.04, 8), MAT.metal); fb.rotation.z = Math.PI / 2; fb.position.set(0, P.ROOF + 0.05, zF - 0.04); cab.add(fb);
    // 뒷벽 + 점수판 + 간판
    const bwH = 4.35 - fy(0, zB);
    const bw = new T.Mesh(new T.PlaneGeometry(2 * CW + 0.12, bwH), MAT.back); bw.position.set(0, fy(0, zB) + bwH / 2, zB - 0.01); bw.receiveShadow = true; cab.add(bw);
    const track = new T.Mesh(new T.BoxGeometry(2 * CW, 0.035, 0.006), MAT.dark); track.position.set(0, P.hoop.y + 0.18, zB + 0.001); cab.add(track);
    sb.mesh.position.set(0, 3.29, zB + 0.03); cab.add(sb.mesh);
    sbFrame.position.set(0, 3.29, zB + 0.004); cab.add(sbFrame);
    mq.position.set(0, 4.02, zB + 0.06); cab.add(mq);
    // 앞: 공 모이는 통 턱 + 동전 판
    const lipY = fy(0, P.FZ) + 0.22;
    const lip = new T.Mesh(new T.BoxGeometry(2 * CW + 0.1, 0.06, 0.12), MAT.metal); lip.position.set(0, lipY, P.FZ + 0.06); cab.add(lip);
    const front = new T.Mesh(new T.BoxGeometry(2 * CW + 0.1, lipY, 0.1), MAT.dark); front.position.set(0, lipY / 2, P.FZ + 0.13); cab.add(front);
    const coin = new T.Mesh(new T.PlaneGeometry(0.9, 0.45), MAT.coin); coin.position.set(0, lipY * 0.55, P.FZ + 0.185); cab.add(coin);
    cab.traverse((o) => { if (o.isMesh && o.material !== MAT.net) o.castShadow = false; });
    scene.add(cab);
  }

  // ── 점수판(백보드 위 뒷벽) + 네온 간판
  const sb = { st: { score: 0, time: 40, goal: 0 }, key: '' };
  let sbFrame, mq, mqTex;
  function buildBoards() {
    sb.tex = canvasTex(512, 200, (g, w, h) => sbDraw(g, w, h, sb.st));
    sb.mesh = new T.Mesh(new T.PlaneGeometry(1.3, 0.51), new T.MeshBasicMaterial({ map: sb.tex, color: new T.Color(1.5, 1.5, 1.5) }));
    sbFrame = new T.Mesh(new T.BoxGeometry(1.38, 0.59, 0.03), MAT.metal);
    mqTex = canvasTex(1024, 256, drawMarquee);
    mq = new T.Group();
    const box = new T.Mesh(new T.BoxGeometry(1.86, 0.5, 0.12), MAT.dark); mq.add(box);
    const face = new T.Mesh(new T.PlaneGeometry(1.8, 0.45), new T.MeshBasicMaterial({ map: mqTex, color: new T.Color(1.8, 1.8, 1.8) })); face.position.z = 0.061; mq.add(face);
  }
  function drawMarquee(g, w, h) {
    g.fillStyle = '#12040a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ff3a6a'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? '#ffd23a' : '#fff4c0'; g.beginPath(); g.arc(24 + i * (w - 48) / 39, 22, 5, 0, 7); g.fill(); g.beginPath(); g.arc(24 + i * (w - 48) / 39, h - 22, 5, 0, 7); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '130px "Ttl", sans-serif';
    g.shadowColor = '#ff6a1a'; g.shadowBlur = 30; g.fillStyle = '#ffb35a'; g.fillText(R.TITLE || '오락실 농구', w / 2, h / 2 + 6);
    g.shadowBlur = 0; g.fillStyle = '#fff3d6'; g.fillText(R.TITLE || '오락실 농구', w / 2, h / 2 + 6);
  }
  R.redrawMarquee = function () { if (!mqTex) return; drawMarquee(mqTex.userData.canvas.getContext('2d'), 1024, 256); mqTex.needsUpdate = true; sb.key = ''; };
  R.setBoard = function (score, time, goal) {
    const k = score + '|' + Math.ceil(time) + '|' + goal;
    if (k === sb.key) return;
    sb.key = k; sb.st.score = score; sb.st.time = time; sb.st.goal = goal;
    sbDraw(sb.tex.userData.canvas.getContext('2d'), 512, 200, sb.st); sb.tex.needsUpdate = true;
  };

  // ── 골대: 투명 백보드 + 테(불 들어옴) + 받침 팔 + 주황 림 + 흰 그물
  let hoop, frameBars = [];
  const NET_N = 14, NET_ROWS = 6;
  let netGeo, netNodes = [], netOff, netSw = 0;
  function buildHoop() {
    hoop = new T.Group();
    const RR = P.RIM_R, BZ = -(RR + 0.075), BD = P.BOARD;
    const rimM = new T.Mesh(new T.TorusGeometry(RR + P.TUBE * 0.2, P.TUBE, 10, 48), MAT.rim); rimM.rotation.x = Math.PI / 2; rimM.castShadow = true; hoop.add(rimM);
    const br = new T.Mesh(new T.BoxGeometry(0.1, 0.028, 0.1), MAT.rim); br.position.set(0, -0.012, BZ + 0.05); hoop.add(br);
    const glass = new T.Mesh(new T.BoxGeometry(BD.hw * 2, BD.hh * 2, BD.hd * 2), MAT.glass); glass.position.set(0, 0.18, BZ); hoop.add(glass);
    const decal = new T.Mesh(new T.PlaneGeometry(BD.hw * 2, BD.hh * 2), MAT.decal); decal.position.set(0, 0.18, BZ + BD.hd + 0.002); hoop.add(decal);
    // 테(LED): 위·아래·양옆 막대
    const fm = MAT.frame;
    [[0, 0.18 + BD.hh, BD.hw * 2 + 0.04, 0.03], [0, 0.18 - BD.hh, BD.hw * 2 + 0.04, 0.03], [-BD.hw - 0.01, 0.18, 0.03, BD.hh * 2], [BD.hw + 0.01, 0.18, 0.03, BD.hh * 2]].forEach((a) => {
      const m = new T.Mesh(new T.BoxGeometry(a[2], a[3], 0.04), fm); m.position.set(a[0], a[1], BZ); hoop.add(m); frameBars.push(m);
    });
    // 뒷벽에 붙은 받침판(백보드가 벽을 타고 미끄러짐)
    const plate = new T.Mesh(new T.BoxGeometry(BD.hw * 2 + 0.06, BD.hh * 2 + 0.06, 0.012), MAT.dark); plate.position.set(0, 0.18, BZ - BD.hd - 0.009); hoop.add(plate);
    glass.castShadow = false;
    // 그물
    for (let r = 0; r < NET_ROWS; r++) for (let i = 0; i < NET_N; i++) {
      const t = r / (NET_ROWS - 1), a = (i + (r % 2) * 0.5) / NET_N * Math.PI * 2, rad = RR * (1 - 0.36 * t);
      netNodes.push({ x: Math.cos(a) * rad, y: -t * P.NET_D * (r ? 1 : 0), z: Math.sin(a) * rad, ox: 0, oy: 0, oz: 0 });
    }
    const idx = [];
    const id = (r, i) => r * NET_N + ((i + NET_N) % NET_N);
    for (let r = 0; r < NET_ROWS - 1; r++) for (let i = 0; i < NET_N; i++) {
      const j = r % 2 ? i + 1 : i - 1;
      idx.push(id(r, i), id(r + 1, i), id(r, i), id(r + 1, j));
    }
    for (let i = 0; i < NET_N; i++) idx.push(id(NET_ROWS - 1, i), id(NET_ROWS - 1, i + 1));
    netGeo = new T.BufferGeometry();
    netGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(netNodes.length * 3), 3));
    netGeo.setIndex(idx);
    const net = new T.LineSegments(netGeo, new T.LineBasicMaterial({ color: 0xf4f4f4 }));
    net.frustumCulled = false; hoop.add(net);
    scene.add(hoop);
  }
  R.swish = function (k) { netSw = Math.max(netSw, k); };
  R.netHit = function (k) { netSw = Math.max(netSw, k * 0.6); };
  let netT = 0;
  function updNet(dt) {
    netT += dt; netSw *= Math.exp(-dt * 3.2);
    const H = P.hoop, arr = netGeo.attributes.position.array;
    for (let n = 0; n < netNodes.length; n++) {
      const N = netNodes[n], r = Math.floor(n / NET_N), t = r / (NET_ROWS - 1);
      let tx = 0, ty = 0, tz = 0;
      if (r > 0) {
        // 공이 그물 안을 지나가면 밀려 부풂
        for (const b of P.balls) {
          const by = b.p.y - H.y, bx = b.p.x - H.x, bz = b.p.z - H.z;
          if (Math.abs(by - N.y) > P.BR * 1.3 || Math.abs(bx) > 0.5 || Math.abs(bz) > 0.5) continue;
          const dx = N.x - bx, dz = N.z - bz, d = Math.hypot(dx, dz), want = P.BR * 1.08;
          if (d < want && d > 1e-4) { tx += dx / d * (want - d); tz += dz / d * (want - d); ty -= 0.02; }
        }
        // 들어간 뒤 출렁: 아래로 늘었다 돌아옴 + 살짝 비틀림
        ty -= netSw * t * 0.09 * (1 + Math.sin(netT * 22) * 0.4);
        const sw = netSw * t * 0.03 * Math.sin(netT * 17 + r);
        tx += -N.z / P.RIM_R * sw; tz += N.x / P.RIM_R * sw;
        // 골대가 움직이면 아래가 늦게 따라옴
        tx -= H.vx * 0.025 * t; tz -= H.vz * 0.025 * t; ty += Math.abs(H.vx) * 0.004 * t;
      }
      const k = 1 - Math.exp(-dt * 26);
      N.ox += (tx - N.ox) * k; N.oy += (ty - N.oy) * k; N.oz += (tz - N.oz) * k;
      arr[n * 3] = N.x + N.ox; arr[n * 3 + 1] = N.y + N.oy; arr[n * 3 + 2] = N.z + N.oz;
    }
    netGeo.attributes.position.needsUpdate = true;
  }

  // ── 공
  let ballMesh = [], ballMat, fireMat;
  function buildBalls(n) {
    const geo = new T.SphereGeometry(P.BR, 36, 24);
    const m1 = ballMaps(false);
    ballMat = new T.MeshStandardMaterial({ map: m1.col, bumpMap: m1.bump, bumpScale: 1.6, roughness: 0.62, metalness: 0, envMapIntensity: 0.7 });
    fireMat = new T.MeshStandardMaterial({ map: m1.col, bumpMap: m1.bump, bumpScale: 1.6, roughness: 0.5, emissive: 0xff5a00, emissiveIntensity: 0.9 });
    for (let i = 0; i < n; i++) {
      const m = new T.Mesh(geo, ballMat); m.castShadow = true; scene.add(m); ballMesh.push(m);
    }
  }

  // ── 반짝이·불꽃: 점 하나짜리 묶음 한 덩어리(그리기 한 번). 미리 만든 칸을 돌려 씀
  const NP = 160, parts = []; let pIdx = 0, pts, pPos, pCol;
  function buildParts() {
    const geo = new T.BufferGeometry();
    pPos = new Float32Array(NP * 3); pCol = new Float32Array(NP * 3);
    geo.setAttribute('position', new T.BufferAttribute(pPos, 3));
    geo.setAttribute('color', new T.BufferAttribute(pCol, 3));
    pts = new T.Points(geo, new T.PointsMaterial({ map: glowTex(), size: 0.11, sizeAttenuation: true, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; scene.add(pts);
    for (let i = 0; i < NP; i++) parts.push({ x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, g: 0, r: 0, gg: 0, b: 0 });
  }
  const tmpC = new T.Color();
  function spawn(x, y, z, vx, vy, vz, life, size, col, g) {
    const p = parts[pIdx]; pIdx = (pIdx + 1) % NP;
    p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.max = life; p.g = g || 0;
    tmpC.set(col); p.r = tmpC.r; p.gg = tmpC.g; p.b = tmpC.b;
  }
  R.burst = function (x, y, z, big) {
    const cols = [0xffd23a, 0xff5a1a, 0xffffff, 0x2ef2ff, 0xff3fa4];
    const n = big ? 46 : 26;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 0.8 + Math.random() * (big ? 2.6 : 1.6);
      spawn(x, y, z, Math.cos(a) * s, 1 + Math.random() * 2.2, Math.sin(a) * s * 0.6 + 0.5, 0.6 + Math.random() * 0.6, 0, cols[i % cols.length], 5);
    }
  };
  R.flame = function (b) {
    for (let i = 0; i < 2; i++) spawn(b.p.x + (Math.random() - 0.5) * 0.08, b.p.y + (Math.random() - 0.5) * 0.08, b.p.z + (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.3, 0.6 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3, 0.32 + Math.random() * 0.2, 0, Math.random() < 0.5 ? 0xff6a10 : 0xffc23a, -1);
  };
  function updParts(dt) {
    for (let i = 0; i < NP; i++) {
      const p = parts[i];
      if (p.life > 0) { p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
      const k = p.life > 0 ? Math.min(1, (p.life / p.max) * 1.6) : 0;
      pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.life > 0 ? p.y : -9; pPos[i * 3 + 2] = p.z;
      pCol[i * 3] = p.r * k; pCol[i * 3 + 1] = p.gg * k; pCol[i * 3 + 2] = p.b * k;
    }
    pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
  }

  // ── 카메라: 폰 세로·가로·PC 모두 골대·점수판과 손 앞 공이 들어오게
  const CAM = { x: 0, y: 1.78, z: 1.5 };
  let mode = 'title', camT = 0, shakeA = 0;
  R.setMode = (m) => { mode = m; };
  R.shake = (a) => { shakeA = Math.max(shakeA, a); };
  function fitCam() {
    const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight, asp = w / h;
    camera.aspect = asp;
    // 세로 화면은 넓게, 가로는 좁게(양옆이 너무 퍼지지 않게)
    camera.fov = asp < 0.75 ? 74 : asp < 1.2 ? 64 : asp < 1.6 ? 56 : 48;
    camera.updateProjectionMatrix();
  }
  R.resize = function () {
    const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, R.lowQ ? 1 : 1.5));
    renderer.setSize(w, h, false);
    fitCam();
  };
  function placeCam(dt) {
    const H = P.hoop;
    if (mode === 'title') {
      camT += dt * 0.12;
      const a = Math.sin(camT) * 0.35;
      camera.position.set(Math.sin(a) * 3.2, 2.3, 2.6 + Math.cos(a) * 0.6);
      // 네온 간판이 화면 위쪽에 오게(제목 글씨와 겹치지 않게): 가로 폰은 더 내려다봄
      camera.lookAt(0, camera.aspect > 1.6 ? 1.55 : 2.05, H.z * 0.55);
    } else {
      camera.position.set(CAM.x, CAM.y, CAM.z);
      const asp = camera.aspect;
      const ly = asp < 0.75 ? 1.62 : asp > 1.6 ? 1.7 : 1.5;
      camera.lookAt(0, ly + 0.0, -3.0);
    }
    if (shakeA > 0.0005) {
      camera.position.x += (Math.random() - 0.5) * shakeA; camera.position.y += (Math.random() - 0.5) * shakeA;
      shakeA *= Math.exp(-dt * 12);
    }
  }

  // 화면 좌표 → 3D 점(던지는 자리 높이의 앞 평면)
  R.project = function (x, y, z) {
    const v = new T.Vector3(x, y, z).project(camera);
    return { x: (v.x + 1) / 2 * (cv.clientWidth || innerWidth), y: (1 - v.y) / 2 * (cv.clientHeight || innerHeight) };
  };

  let flash = 0, flashCol = new T.Color(1, 1, 1);
  R.flashBoard = function (k, col) { flash = Math.max(flash, k); flashCol.set(col || 0xffd23a); };

  R.init = function (canvas, nBalls) {
    cv = canvas;
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene();
    scene.background = new T.Color(0x07060f);
    scene.fog = new T.Fog(0x07060f, 7, 18);
    camera = new T.PerspectiveCamera(58, 1, 0.05, 40);
    R.camera = camera; R.scene = scene; R.renderer = renderer;
    buildEnv(); buildLights(); mats();
    scene.add(buildRoom());
    buildBoards(); buildHoop(); buildBalls(nBalls); buildParts();
    R.resize();
  };
  // 판이 바뀔 때(멈춘 화면에서) 기계 길이 맞춤
  R.build = function () {
    buildCab();
    spot.target.position.set(0, 1.5, P.hoop.z * 0.7);
    // 처음 나오는 것(불붙은 공·반짝이)을 미리 한 번 그려 둔다 — 판 도중 멈칫 막기
    if (ballMesh[0]) ballMesh[0].material = fireMat;
    spawn(0, 1.5, -1, 0, 0, 0, 0.01, 0, 0xffffff, 0); updParts(0);
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    if (ballMesh[0]) ballMesh[0].material = ballMat;
  };

  let ledO = 0;
  R.frame = function (dt) {
    const H = P.hoop;
    hoop.position.set(H.x, H.y, H.z);
    hoopLight.position.set(H.x, H.y + 0.9, H.z + 0.9);
    updNet(dt);
    for (let i = 0; i < ballMesh.length; i++) {
      const b = P.balls[i], m = ballMesh[i];
      if (!b) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(b.p.x, b.p.y, b.p.z); m.quaternion.set(b.q[0], b.q[1], b.q[2], b.q[3]);
      m.material = b.fire ? fireMat : ballMat;
    }
    updParts(dt);
    ledO = (ledO + dt * (flash > 0.05 ? 3 : 0.6)) % 1; MAT.ledL.offset.x = ledO;
    flash *= Math.exp(-dt * 2.6);
    MAT.frame.color.setRGB(1 + (flashCol.r * 3 - 1) * flash, 1 + (flashCol.g * 3 - 1) * flash, 1 + (flashCol.b * 3 - 1) * flash);
    hoopLight.intensity = 5 + flash * 14;
    fireMat.emissiveIntensity = 0.7 + Math.sin(performance.now() * 0.02) * 0.25;
    placeCam(dt);
    renderer.render(scene, camera);
  };
})();
