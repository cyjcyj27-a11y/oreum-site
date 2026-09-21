// 두뇌풀가동 — 그림: 칠판 교실 배경(코드) + 선생님 스프라이트(사장님이 준 시트를 tools/teacher_cut.py 로 오린 것)
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  let bg = null, bgW = 0, bgH = 0;               // 배경은 크기 바뀔 때만 한 번 그려 둔다
  const R = (seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; })(20260921);

  // ---------------------------------------------------------------- 배경(칠판 교실)
  function buildBg(w, h) {
    bg = document.createElement('canvas'); bg.width = w; bg.height = h; bgW = w; bgH = h;
    const c = bg.getContext('2d');
    const fr = Math.max(14, Math.min(w, h) * 0.035);          // 나무 틀 두께
    // 벽(틀 바깥) — 살짝 보이는 크림색 벽
    c.fillStyle = '#e9e1cf'; c.fillRect(0, 0, w, h);
    // 나무 틀
    const wood = c.createLinearGradient(0, 0, w, h);
    wood.addColorStop(0, '#a6733f'); wood.addColorStop(0.5, '#8a5a2b'); wood.addColorStop(1, '#6f4520');
    c.fillStyle = wood; c.fillRect(0, 0, w, h);
    // 나뭇결
    c.save(); c.globalAlpha = 0.18; c.strokeStyle = '#3d2410'; c.lineWidth = 1;
    for (let i = 0; i < 90; i++) {
      const y = R() * h, len = 60 + R() * 260, x = R() * w;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + len * 0.3, y + 2, x + len * 0.6, y - 2, x + len, y + 1); c.stroke();
    }
    c.restore();
    // 틀 빗면(위·왼쪽 밝게, 아래·오른쪽 어둡게)
    c.fillStyle = 'rgba(255,230,190,.35)'; c.fillRect(0, 0, w, fr * 0.35); c.fillRect(0, 0, fr * 0.35, h);
    c.fillStyle = 'rgba(40,20,5,.45)'; c.fillRect(0, h - fr * 0.4, w, fr * 0.4); c.fillRect(w - fr * 0.4, 0, fr * 0.4, h);
    // 칠판 안쪽 그림자(틀이 드리우는)
    const x0 = fr, y0 = fr, bw = w - fr * 2, bh = h - fr * 2;
    c.fillStyle = '#1b3a2f'; c.fillRect(x0, y0, bw, bh);
    const g = c.createRadialGradient(w * 0.42, h * 0.38, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    g.addColorStop(0, '#356a55'); g.addColorStop(0.55, '#2b5646'); g.addColorStop(1, '#1b3a2f');
    c.fillStyle = g; c.fillRect(x0, y0, bw, bh);
    // 지운 자국(분필 가루 얼룩) — 넓고 흐린 호
    c.save(); c.beginPath(); c.rect(x0, y0, bw, bh); c.clip();
    for (let i = 0; i < 26; i++) {
      const x = x0 + R() * bw, y = y0 + R() * bh, r = 40 + R() * 160;
      const s = c.createRadialGradient(x, y, 0, x, y, r);
      s.addColorStop(0, 'rgba(255,255,255,.09)'); s.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = s; c.save(); c.translate(x, y); c.rotate(R() * TAU); c.scale(1.8, 0.5); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore();
    }
    // 분필 낙서 — 희미한 수식·별·하트(장식이지 설명이 아니다)
    const dood = ['3×4=12', '7+8', '81÷9', '2×2×2', '15−6', '9×9=81', '√16', '1+1', '12−5', '6×7', '100', '½', '24÷4', '5+5+5', '8×3', '48÷6'];
    c.globalAlpha = 0.13; c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const x = x0 + 20 + R() * (bw - 60), y = y0 + 30 + R() * (bh - 60), k = R();
      c.save(); c.translate(x, y); c.rotate((R() - 0.5) * 0.5);
      if (k < 0.62) { c.font = (14 + R() * 18) + 'px Ria,sans-serif'; c.fillText(dood[Math.floor(R() * dood.length)], 0, 0); }
      else if (k < 0.78) { star(c, 0, 0, 8 + R() * 8); c.stroke(); }
      else if (k < 0.9) { c.beginPath(); c.arc(0, 0, 9 + R() * 8, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.stroke(); }
      else { heart(c, 0, 0, 7 + R() * 7); c.stroke(); }
      c.restore();
    }
    c.globalAlpha = 1;
    // 분필 가루 결(가는 점)
    c.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 1400; i++) c.fillRect(x0 + R() * bw, y0 + R() * bh, 1.5, 1.5);
    c.restore();
    // 분필 받침(아래 틀 위) + 분필·지우개
    const ty = h - fr - 6, th = Math.max(8, fr * 0.55);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x0, ty - 4, bw, 6);                       // 받침 그림자
    const tg = c.createLinearGradient(0, ty, 0, ty + th); tg.addColorStop(0, '#b9884f'); tg.addColorStop(1, '#7a4c22');
    c.fillStyle = tg; c.fillRect(x0 - 2, ty, bw + 4, th);
    const cx = x0 + bw * 0.12;
    [['#fdfdf8', 0], ['#ffe27a', 34], ['#ffb6c9', 60], ['#9fd8ff', 96]].forEach(([col, dx]) => {
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(cx + dx + 2, ty - 5, 26, 7);
      c.fillStyle = col; c.fillRect(cx + dx, ty - 7, 26, 7);
      c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(cx + dx, ty - 3, 26, 3);
    });
    const ex = x0 + bw * 0.86;                                                              // 지우개
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(ex + 3, ty - 9, 46, 12);
    c.fillStyle = '#4a3322'; c.fillRect(ex, ty - 14, 46, 8);
    c.fillStyle = '#d9d2c2'; c.fillRect(ex, ty - 6, 46, 6);
    // 비네트
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  }
  function star(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath();
  }
  function heart(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y + r);
    c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
    c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r);
    c.closePath();
  }

  // ---------------------------------------------------------------- 알갱이(반짝·별·불꽃)
  const P = [];
  function spawn(kind, x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = 40 + Math.random() * 120;
      P.push({ kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'ember' ? 120 : 40), t: 0, life: 0.6 + Math.random() * 0.6, r: 3 + Math.random() * 5, rot: Math.random() * TAU });
    }
  }
  function stepP(dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'ember' ? -60 : 160) * dt; p.rot += dt * 4;
      if (p.t > p.life) P.splice(i, 1);
    }
  }
  function drawP(c) {
    for (const p of P) {
      const k = 1 - p.t / p.life;
      c.save(); c.globalAlpha = Math.max(0, Math.min(1, k * 1.4)); c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.kind === 'spark') { c.fillStyle = '#ffe066'; star(c, 0, 0, p.r * (0.6 + k)); c.fill(); }
      else if (p.kind === 'star') { c.fillStyle = '#ffd23a'; c.strokeStyle = '#8a5a00'; c.lineWidth = 1.5; star(c, 0, 0, p.r * 1.3); c.fill(); c.stroke(); }
      else if (p.kind === 'ember') { const g = c.createRadialGradient(0, 0, 0, 0, 0, p.r * 1.6); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.5, '#ff9a3c'); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, p.r * 1.6, 0, TAU); c.fill(); }
      c.restore();
    }
  }

  // ---------------------------------------------------------------- 선생님(스프라이트 시트 assets/teacher.png, 좌표는 js/teacher.js)
  const TIMG = new Image(); TIMG.src = 'assets/teacher.webp?v=6';
  const TF = (window.FB_TEACHER && window.FB_TEACHER.frames) || {};
  const BUST_H = 250;                                             // 상반신 칸들의 기준 높이 — 칸마다 크기가 달라도 같은 배율로 그린다
  let prevName = '', curName = '', fadeT = 1;
  // 표정은 세 가지만 바뀐다(사장님 9/21 "정신없다"): 문제 낼 때 point(지시봉) · 맞췄을 때 cheer · 틀렸을 때 wrong
  function frameFor(S) {
    const m = S.mood, mode = S.mode;
    if (mode === 'title') return 'explain';                      // 제목: 클립보드 든 상반신. 얼굴만 있는 칸은 교탁 위로 목만 나와 무섭다(사장님 9/21)
    if (mode === 'ending') return 'cheer';
    if (mode === 'over') return 'wrong';
    if (mode === 'clear') return 'cheer';
    if (m === 'happy') return 'cheer';
    if (m === 'dizzy') return 'wrong';
    return 'point';
  }
  function drawFrame(c, name, sc, alpha) {                        // 원점 = 얼굴 가운데(칸마다 그림 크기가 달라도 얼굴이 같은 크기·같은 자리)
    const f = TF[name]; if (!f || !TIMG.complete || !TIMG.naturalWidth) return;
    const w = f[2] * sc, h = f[3] * sc, fx = f[4] * sc, fy = f[5] * sc;
    c.save(); c.globalAlpha = alpha;
    c.drawImage(TIMG, f[0], f[1], f[2], f[3], Math.round(-fx), Math.round(-fy), Math.round(w), Math.round(h));
    c.restore();
  }
  // 교탁: 선생님 앞을 가린다. 2D 그림답게 평면으로 — 그러데이션·두께·튀어나온 윗판 없이 단색 면 + 갈색 윤곽선(사장님 9/21 "입체감 없애")
  function drawLectern(c, cx, top, bot, w) {
    const h = bot - top; if (h < 10) return;
    const lw = Math.max(2, w * 0.011), band = Math.max(8, w * 0.07);         // 윤곽선 굵기·윗띠 높이
    const x0 = cx - w * 0.5, x1 = cx + w * 0.5, r = w * 0.02;
    const rr = (x, y, ww, hh, rad) => { c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + ww, y, x + ww, y + hh, rad); c.arcTo(x + ww, y + hh, x, y + hh, rad); c.arcTo(x, y + hh, x, y, rad); c.arcTo(x, y, x + ww, y, rad); c.closePath(); };
    c.save();
    c.filter = 'blur(' + Math.max(0.8, w * 0.0035).toFixed(2) + 'px)';           // 살짝 흐리게 — 선생님 그림의 부드러운 선과 맞춤(사장님 9/21 "너무 선명해")
    c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = 'rgba(74,50,34,.82)';
    // 몸통(단색)
    c.fillStyle = '#cfae82'; rr(x0, top, w, h, r); c.fill();
    // 윗띠(단색, 몸통과 같은 폭)
    c.fillStyle = '#e6cba0'; c.fillRect(x0, top, w, band);
    c.beginPath(); c.moveTo(x0, top + band); c.lineTo(x1, top + band); c.stroke();
    // 앞판 패널(단색 한 톤 어둡게 + 윤곽선)
    const px = cx - w * 0.36, py = top + band + h * 0.12, pw = w * 0.72, ph = h - band - h * 0.24;
    c.fillStyle = '#b8956a'; rr(px, py, pw, ph, w * 0.012); c.fill(); rr(px, py, pw, ph, w * 0.012); c.stroke();
    // 바깥 윤곽선
    rr(x0, top, w, h, r); c.stroke();
    c.restore();
  }
  function drawTeacher(c, S, rc, t, dt) {
    const name = frameFor(S), mood = S.mood, mt = S.moodT;
    if (name !== curName) { prevName = curName; curName = name; fadeT = 0; }
    fadeT = Math.min(1, fadeT + dt * 7);
    const big = name === 'big';
    const f = TF[name] || [0, 0, 150, 250, 75, 90, 60];
    // 움직임: 숨쉬기만, 맞췄을 때 살짝 한 번
    let bob = Math.sin(t * 2) * 2;
    if (mood === 'happy' || S.mode === 'clear') bob -= Math.sin(Math.min(Math.PI, mt * 6)) * 14;
    if (S.mode === 'over') bob += 6;
    const cx = rc.x + rc.w / 2;
    if (big) {                                                     // 제목: 전신을 칸에 맞춰, 발밑 기준
      let sc = Math.min(rc.w / f[2], rc.h / f[3], 2.4);
      const by = S.portrait ? S.H : rc.y + rc.h;
      const w = f[2] * sc, h = f[3] * sc;
      c.save(); c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(cx, by + 4, w * 0.36, Math.max(6, w * 0.05), 0, 0, TAU); c.fill(); c.restore();
      c.save(); c.globalAlpha = 1; c.drawImage(TIMG.complete && TIMG.naturalWidth ? TIMG : c.canvas, f[0], f[1], f[2], f[3], Math.round(cx - w / 2), Math.round(by + bob - h), Math.round(w), Math.round(h)); c.restore();
      if (S.portrait) { const g = c.createLinearGradient(0, S.H - 70, 0, S.H); g.addColorStop(0, 'rgba(27,58,47,0)'); g.addColorStop(1, 'rgba(27,58,47,.9)'); c.fillStyle = g; c.fillRect(0, S.H - 70, S.W, 70); }
      return { cx, cy: by + bob - h * 0.8, r: w * 0.25 };
    }
    // 상반신: 얼굴 너비를 같게(칸마다 같은 크기), 얼굴 가운데를 칸의 38% 높이에. 쓰는 칸들 전부가 칸 안에 들어가는 얼굴 크기를 고른다
    let FW = Math.min(rc.h * (S.mode === 'title' ? 0.34 : 0.30), rc.w * 0.30);
    for (const nm of ['point', 'cheer', 'wrong', 'explain']) {   // 제목 화면은 idle 한 칸만 맞추면 되니 더 크게
      const g = TF[nm]; if (!g) continue;
      FW = Math.min(FW, rc.h * 0.60 * g[6] / Math.max(1, g[3] - g[5]),                       // 얼굴 아래로 칸 높이의 60% 안
                       rc.w * 0.48 * g[6] / Math.max(1, Math.max(g[4], g[2] - g[4])));       // 좌우로 칸 너비의 절반 안
    }
    const sc = Math.min(FW / f[6], 2.6);
    const fyPos = rc.y + rc.h * 0.38;
    c.save(); c.translate(cx, fyPos + bob);
    if (fadeT < 1 && prevName && prevName !== 'big') drawFrame(c, prevName, sc * (TF[prevName] ? f[6] / TF[prevName][6] : 1), 1 - fadeT);
    drawFrame(c, name, sc, fadeT < 1 && prevName ? fadeT : 1);
    if (mood === 'full') {                                         // 풀가동: 몸 둘레에 주황 후광
      const g = c.createRadialGradient(0, FW * 0.8, FW * 0.5, 0, FW * 0.8, FW * 2.6);
      g.addColorStop(0, 'rgba(255,170,40,0)'); g.addColorStop(0.7, 'rgba(255,150,30,.18)'); g.addColorStop(1, 'rgba(255,120,20,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(0, FW * 0.8, FW * 2.6, 0, TAU); c.fill();
    }
    c.restore();
    // 교탁: 얼굴 아래 2.2배 높이(허리)부터 칸 바닥까지, 너비는 얼굴의 3.2배
    const lb = Math.min(S.H - 8, rc.y + rc.h + FW * 0.2);
    // 교탁 윗선 = 지금 쓰는 자세들 중 가장 긴 그림의 아래 끝에서 얼굴 너비의 0.32 위(흐려지는 24px 를 덮는다). 제목은 얼굴 칸(idle)이라 더 위로 온다
    let bodyBot = fyPos;
    // 제목·클리어·게임오버·엔딩은 그 화면의 그림 하나 기준, 플레이 중엔 세 자세 중 가장 긴 것 기준(교탁이 자세마다 흔들리지 않게)
    for (const nm of ['point', 'cheer', 'wrong', 'explain']) { const g = TF[nm]; if (g) bodyBot = Math.max(bodyBot, fyPos + (g[3] - g[5]) * FW / g[6]); }
    drawLectern(c, cx, Math.min(bodyBot - FW * 0.32, lb - FW * 0.75), lb, FW * 2.5);
    return { cx, cy: fyPos + bob - FW * 0.6, r: FW * 0.6 };
  }

  // ---------------------------------------------------------------- 바깥
  let lastT = 0;
  const ART = {
    resize(w, h) { if (w > 0 && h > 0 && (w !== bgW || h !== bgH)) buildBg(w, h); },
    draw(c, w, h, S, rc, t) {
      const dt = Math.min(0.05, t - lastT || 0.016); lastT = t;
      ART.resize(w, h);
      if (bg) c.drawImage(bg, 0, 0);
      const b = drawTeacher(c, S, rc, t, dt);
      stepP(dt); drawP(c);
      return b;
    },
    burst(kind, x, y, n) { spawn(kind, x, y, n); },
    setSeedBg() { bgW = 0; },
  };
  window.FBArt = ART;
})();
