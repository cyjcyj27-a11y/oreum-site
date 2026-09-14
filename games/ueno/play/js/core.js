// core.js — 공용 상태·수학 도우미
(function () {
  const T = {
    scene: null, camera: null, renderer: null,
    dt: 0, time: 0, paused: true, mode: 'load',   // load | title | play | over | clear
    save: 'ueno',
    sfx: true, bgm: true,
    coins: 0,
    taken: {},          // 먹은 구역 id → true
    slow: 1, slowT: 0,  // 느린 화면(KO 순간)
    stopT: 0,           // 타격 멈춤
  };

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, rate, dt) => b + (a - b) * Math.exp(-rate * dt);
  const TAU = Math.PI * 2;
  function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  function angTo(a, b, step) { const d = angDiff(a, b); return a + clamp(d, -step, step); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function mulberry(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function save() {
    try { localStorage.setItem(T.save + '.prog', JSON.stringify({ coins: T.coins, taken: T.taken, seen: T.seen || {}, puz: T.puz || {}, cans: T.cans || 0, seeds: T.seeds || 0, bones: T.bones || 0 })); } catch (e) { }
  }
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(T.save + '.prog') || 'null'); } catch (e) { return null; }
  }
  function wipe() { try { localStorage.removeItem(T.save + '.prog'); } catch (e) { } }

  // ── 아이템 그림: 딸기우유 우유갑 · 생선 그림 고양이 캔 (9/14 사장님 "딸기우유 아이콘 바꿔" "야옹이캔에 생선그림")
  //   128×128 칸에 그린다. 빛은 왼쪽 위. 단추·자판기 창·가방·지도·자판기 표지·떨어지는 우유가 전부 이 그림을 쓴다.
  function poly(g, pts) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); }
  function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
  const ICON_DRAW = {
    milk(g) {
      const O = '#6a2440';
      g.lineJoin = 'round'; g.lineCap = 'round';
      // 윤곽 전체(굵게 한 번)
      g.lineWidth = 7; g.strokeStyle = O;
      poly(g, [26, 52, 50, 26, 50, 16, 76, 6, 76, 16, 102, 42, 102, 108, 78, 120, 26, 120]); g.stroke();
      // 옆면(그림자)
      g.fillStyle = lin(g, 78, 0, 102, 0, ['#e0779e', '#c95d86']); poly(g, [78, 52, 102, 42, 102, 108, 78, 120]); g.fill();
      // 앞면
      g.fillStyle = lin(g, 26, 52, 78, 120, ['#ffc2d8', '#ff94ba']); poly(g, [26, 52, 78, 52, 78, 120, 26, 120]); g.fill();
      // 지붕 오른쪽 면(해를 받아 밝게)
      g.fillStyle = lin(g, 52, 20, 90, 48, ['#ffe3ee', '#ffb6d0']); poly(g, [52, 26, 76, 16, 102, 42, 78, 52]); g.fill();
      // 앞 박공 삼각형
      g.fillStyle = '#ff9fc2'; poly(g, [26, 52, 52, 26, 78, 52]); g.fill();
      // 꼭대기 접힌 날개
      g.fillStyle = lin(g, 50, 8, 76, 24, ['#ffffff', '#ffd3e3']); poly(g, [50, 26, 76, 16, 76, 6, 50, 16]); g.fill();
      // 안쪽 모서리 선(가늘게)
      g.lineWidth = 2.5; g.strokeStyle = O;
      g.beginPath(); g.moveTo(78, 52); g.lineTo(78, 120); g.moveTo(26, 52); g.lineTo(78, 52); g.lineTo(102, 42);
      g.moveTo(52, 26); g.lineTo(78, 52); g.moveTo(50, 26); g.lineTo(76, 16); g.stroke();
      // 앞 딱지(흰 바탕)
      g.fillStyle = '#fffaf2'; g.beginPath(); g.roundRect(31, 60, 42, 54, 7); g.fill();
      // 딸기: 몸통 그라데이션 + 씨 + 잎 + 반짝 (작은 단추에서도 보이게 1.3배)
      g.save(); g.translate(52, 88); g.scale(1.3, 1.3); g.translate(-52, -88);
      g.fillStyle = lin(g, 40, 78, 64, 106, ['#ff5a5f', '#d41f35']);
      g.beginPath(); g.moveTo(52, 106); g.bezierCurveTo(36, 94, 36, 76, 52, 78); g.bezierCurveTo(68, 76, 68, 94, 52, 106); g.fill();
      g.fillStyle = '#ffe27a'; [[46, 86], [52, 84], [58, 86], [49, 93], [55, 93], [52, 99]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 1.3, 2, 0, 0, 7); g.fill(); });
      g.fillStyle = '#34a852'; poly(g, [52, 80, 42, 73, 49, 76, 52, 69, 55, 76, 62, 73]); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(45, 84, 2.2, 4, -0.5, 0, 7); g.fill();
      g.restore();
      // 앞면 윗가 반짝 띠
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(29, 55, 5, 62);
    },
    can(g) {
      const O = '#1d2a3e', cx = 64, rx = 50, top = 38, bot = 104, ry = 15;
      g.lineJoin = 'round';
      // 윤곽
      g.lineWidth = 7; g.strokeStyle = O;
      g.beginPath(); g.ellipse(cx, top, rx, ry, 0, Math.PI, 0); g.lineTo(cx + rx, bot); g.ellipse(cx, bot, rx, ry, 0, 0, Math.PI); g.closePath(); g.stroke();
      // 몸통: 원통 명암(왼쪽 밝게)
      g.fillStyle = lin(g, cx - rx, 0, cx + rx, 0, ['#d9dee5', '#ffffff', '#b8c0ca', '#7d8794']);
      g.beginPath(); g.moveTo(cx - rx, top); g.lineTo(cx - rx, bot); g.ellipse(cx, bot, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, top); g.closePath(); g.fill();
      // 파란 딱지 띠
      g.save(); g.beginPath(); g.moveTo(cx - rx, top + 9); g.lineTo(cx - rx, bot - 7); g.ellipse(cx, bot - 7, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, top + 9); g.ellipse(cx, top + 9, rx, ry, 0, 0, Math.PI, false); g.closePath(); g.clip();
      g.fillStyle = lin(g, cx - rx, 0, cx + rx, 0, ['#4f9bf0', '#6fb4ff', '#3677d6', '#224f9c']); g.fillRect(0, 0, 128, 128);
      // 생선: 주황 몸통 + 꼬리 + 배 밝게 + 눈 + 비늘 줄, 흰 테두리로 또렷하게
      const fx = 60, fy = 78;
      g.save(); g.translate(64, fy); g.scale(1.25, 1.25); g.translate(-64, -fy);
      g.lineWidth = 5; g.strokeStyle = '#fff'; g.lineJoin = 'round';
      const fish = () => { g.beginPath(); g.ellipse(fx, fy, 24, 12, 0, 0, 7); g.moveTo(fx + 20, fy); g.lineTo(fx + 38, fy - 12); g.lineTo(fx + 34, fy); g.lineTo(fx + 38, fy + 12); g.closePath(); };
      fish(); g.stroke();
      g.fillStyle = lin(g, fx, fy - 12, fx, fy + 12, ['#ffb03a', '#ff7a1a', '#e85a10']); fish(); g.fill();
      g.fillStyle = 'rgba(255,236,190,.8)'; g.beginPath(); g.ellipse(fx - 2, fy + 5, 16, 4.5, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(160,60,0,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(fx - 8, fy, 10, -0.9, 0.9); g.stroke();
      g.beginPath(); g.arc(fx + 2, fy, 9, -0.9, 0.9); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(fx - 14, fy - 3, 4, 0, 7); g.fill();
      g.fillStyle = '#1b1b1f'; g.beginPath(); g.arc(fx - 14.5, fy - 3, 2.2, 0, 7); g.fill();
      g.restore(); g.restore();
      // 뚜껑: 은색 타원 + 안쪽 테 + 따개 고리
      g.fillStyle = lin(g, cx - rx, top - ry, cx + rx, top + ry, ['#ffffff', '#c3cad3', '#8e98a4']);
      g.beginPath(); g.ellipse(cx, top, rx, ry, 0, 0, 7); g.fill();
      g.lineWidth = 2.5; g.strokeStyle = '#6f7a88'; g.beginPath(); g.ellipse(cx, top, rx - 7, ry - 4, 0, 0, 7); g.stroke();
      g.lineWidth = 4; g.strokeStyle = '#5d6774'; g.beginPath(); g.ellipse(cx + 14, top - 1, 10, 4.5, 0, 0, 7); g.stroke();
      g.lineWidth = 2.5; g.strokeStyle = O; g.beginPath(); g.ellipse(cx, top, rx, ry, 0, 0, 7); g.stroke();
      // 몸통 세로 반짝
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - rx + 10, top + 12, 6, bot - top - 12);
    },
  };
  const iconUrls = {};
  window.ICON = {
    // 캔버스에 그리기: (x, y) 왼쪽 위, s 한 변
    draw(name, g, x, y, s) { g.save(); g.translate(x, y); g.scale(s / 128, s / 128); ICON_DRAW[name](g); g.restore(); },
    url(name) {
      if (!iconUrls[name]) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; ICON_DRAW[name](cv.getContext('2d')); iconUrls[name] = cv.toDataURL(); }
      return iconUrls[name];
    },
    html(name) { return '<img class="emi" src="' + ICON.url(name) + '" alt="">'; },
    // 글 속 [milk] [can] 을 그림으로
    fill(s) { return s.replace(/\[(milk|can)\]/g, (m, n) => ICON.html(n)); },
  };

  window.T = T;
  window.U = { clamp, lerp, damp, TAU, angDiff, angTo, rand, pick, mulberry, save, loadSave, wipe };
})();
