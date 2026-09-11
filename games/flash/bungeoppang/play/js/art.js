// 그림은 전부 코드로 그린다 — 이미지 파일 없음
(function () {
  var A = {};

  // ---------- 맛 ----------
  // body: 구웠을 때 몸 색, accent: 속 색(옆구리 터진 곳으로 보인다)
  A.FLAVORS = [
    { body: [0xd9, 0x9a, 0x45], acc: '#57263c', price: 3 },        // 팥
    { body: [0xdf, 0xa8, 0x50], acc: '#f6dc93', price: 9 },        // 슈크림
    { body: [0xa3, 0x6b, 0x38], acc: '#40221a', price: 24 },       // 초코
    { body: [0xdc, 0x9e, 0x4a], acc: '#a163b4', price: 62 },       // 고구마
    { body: [0xe4, 0xb0, 0x52], acc: '#f2b32b', price: 160 },      // 치즈
    { body: [0xd6, 0x92, 0x3f], acc: '#c8452c', price: 420 },      // 피자
    { body: [0xcf, 0x9b, 0x55], acc: '#5fc8ae', price: 1100 },     // 민트초코
    { body: [0xe9, 0xc4, 0x52], acc: '#fff0b0', price: 3000 }      // 금붕어빵
  ];

  function mix(c, k) {                       // 굽기에 따라 반죽색 → 몸 색
    var raw = [0xf3, 0xe4, 0xbe];
    return 'rgb(' + Math.round(raw[0] + (c[0] - raw[0]) * k) + ',' +
      Math.round(raw[1] + (c[1] - raw[1]) * k) + ',' +
      Math.round(raw[2] + (c[2] - raw[2]) * k) + ')';
  }
  function dark(c, k, m) {
    return 'rgb(' + Math.round(c[0] * m) + ',' + Math.round(c[1] * m) + ',' + Math.round(c[2] * m) + ')';
  }

  // 반죽에 뜨는 기포 자국 — 늘 같은 자리에 나게 미리 뽑아 둔다
  var SPECK = (function () {
    var s = 7919, a = [];
    function R() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < 400 && a.length < 30; i++) {
      var px = -0.86 + R() * 1.66, py = -0.42 + R() * 0.84;
      var lim = 0.44 * (1 - Math.pow(Math.abs(px + 0.05) / 1.02, 2.4));
      if (Math.abs(py) < lim) a.push({ x: px, y: py, r: 0.018 + R() * 0.040, d: R() });
    }
    return a;
  })();

  // 붕어 몸 윤곽 (단위 좌표: 코 -1, 꼬리 +1, 높이 ±0.46)
  function fishPath(g) {
    g.beginPath();
    g.moveTo(-0.98, 0.00);
    g.bezierCurveTo(-0.90, -0.30, -0.44, -0.50, 0.06, -0.44);   // 등
    g.bezierCurveTo(0.34, -0.40, 0.48, -0.30, 0.58, -0.18);     // 꼬리자루
    g.lineTo(1.00, -0.42);
    g.quadraticCurveTo(0.84, 0.00, 1.00, 0.42);                  // 갈라진 꼬리
    g.lineTo(0.58, 0.18);
    g.bezierCurveTo(0.48, 0.30, 0.34, 0.40, 0.06, 0.44);
    g.bezierCurveTo(-0.44, 0.50, -0.90, 0.30, -0.98, 0.00);
    g.closePath();
  }

  // 붕어빵 한 마리. cook 0(반죽)~1(다 익음), rot 라디안
  // 실제 크기 13cm — 판·대야와 같은 자로 그린다
  A.bread = function (g, x, y, r, fi, cook, rot) {
    var F = A.FLAVORS[fi] || A.FLAVORS[0];
    var k = Math.min(1, Math.max(0, cook));
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(r, r);

    g.fillStyle = 'rgba(0,0,0,.30)';                  // 틀 바닥에 지는 그늘
    g.beginPath(); g.ellipse(0.04, 0.26, 0.94, 0.28, 0, 0, 7); g.fill();

    fishPath(g);
    g.save(); g.clip();
    // 부푼 빵 — 빛은 왼쪽 위, 배 쪽으로 갈수록 깊게 구워진다
    var bg = g.createRadialGradient(-0.30, -0.30, 0.04, -0.08, 0.10, 1.30);
    bg.addColorStop(0, mix(F.body, k * 0.46));
    bg.addColorStop(0.38, mix(F.body, k * 0.86));
    bg.addColorStop(0.74, mix(F.body, k));
    bg.addColorStop(1, dark(F.body, 1, 0.58 + (1 - k) * 0.30));
    g.fillStyle = bg; g.fillRect(-1.1, -0.6, 2.2, 1.2);

    var i2, sp;
    if (k > 0.18) {                                   // 반죽이 부풀며 생긴 기포 자국
      for (i2 = 0; i2 < SPECK.length; i2++) {
        sp = SPECK[i2];
        if (sp.d > k * 1.1) continue;
        g.fillStyle = 'rgba(90,52,20,' + (0.10 + k * 0.16 * sp.d).toFixed(3) + ')';
        g.beginPath(); g.arc(sp.x, sp.y, sp.r * (0.6 + k * 0.6), 0, 7); g.fill();
        g.fillStyle = 'rgba(255,236,196,' + (0.10 * (1 - sp.d)).toFixed(3) + ')';
        g.beginPath(); g.arc(sp.x - sp.r * 0.3, sp.y - sp.r * 0.4, sp.r * 0.45, 0, 7); g.fill();
      }
    }
    if (k > 0.45) {                                   // 틀에 닿아 더 눌어붙은 테두리
      g.strokeStyle = 'rgba(96,50,16,' + (0.40 * k).toFixed(3) + ')';
      g.lineWidth = 0.20; fishPath(g); g.stroke();
    }
    g.restore();

    if (k > 0.25) {                                   // 가장자리 바삭한 테
      fishPath(g);
      g.strokeStyle = dark(F.body, 1, 0.58); g.lineWidth = 0.05; g.stroke();
      g.strokeStyle = 'rgba(255,232,180,' + (0.30 * k).toFixed(3) + ')';   // 위쪽 테에 걸린 빛
      g.lineWidth = 0.028;
      g.beginPath();
      g.moveTo(-0.94, -0.10);
      g.bezierCurveTo(-0.86, -0.34, -0.42, -0.52, 0.06, -0.46);
      g.bezierCurveTo(0.32, -0.42, 0.46, -0.32, 0.56, -0.20);
      g.stroke();
    }
    if (k > 0.55) {                                   // 지느러미 결·눈·아가미
      g.strokeStyle = dark(F.body, 1, 0.60); g.lineWidth = 0.036; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-0.50, -0.34); g.quadraticCurveTo(-0.34, -0.02, -0.48, 0.30);   // 아가미
      g.moveTo(-0.06, -0.30); g.lineTo(0.16, -0.16);   // 비늘 결
      g.moveTo(-0.12, -0.04); g.lineTo(0.12, 0.06);
      g.moveTo(-0.06, 0.20); g.lineTo(0.18, 0.26);
      g.moveTo(0.66, -0.26); g.lineTo(0.90, -0.36);    // 꼬리 결
      g.moveTo(0.66, 0.26); g.lineTo(0.90, 0.36);
      g.stroke();
      g.strokeStyle = 'rgba(255,230,180,.34)'; g.lineWidth = 0.018;  // 결 옆에 붙는 빛
      g.beginPath();
      g.moveTo(-0.52, -0.34); g.quadraticCurveTo(-0.36, -0.02, -0.50, 0.30);
      g.moveTo(-0.08, -0.33); g.lineTo(0.14, -0.19);
      g.stroke();
      g.fillStyle = dark(F.body, 1, 0.36);              // 눈
      g.beginPath(); g.arc(-0.66, -0.09, 0.075, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)';
      g.beginPath(); g.arc(-0.685, -0.115, 0.028, 0, 7); g.fill();
    }
    if (k > 0.62) {                                   // 갓 구운 기름기 — 등에 앉은 윤
      g.save(); fishPath(g); g.clip();
      var gl = g.createLinearGradient(-0.5, -0.46, -0.1, -0.08);
      gl.addColorStop(0, 'rgba(255,248,225,' + (0.30 * k).toFixed(3) + ')');
      gl.addColorStop(1, 'rgba(255,248,225,0)');
      g.fillStyle = gl;
      g.beginPath(); g.ellipse(-0.30, -0.28, 0.42, 0.13, -0.30, 0, 7); g.fill();
      g.beginPath(); g.ellipse(0.24, -0.26, 0.22, 0.07, -0.22, 0, 7); g.fill();
      g.restore();
    }
    if (k > 0.9) {                                    // 옆구리로 비치는 속
      g.save(); fishPath(g); g.clip();
      var ag = g.createLinearGradient(0, 0.16, 0, 0.44);
      ag.addColorStop(0, F.acc); ag.addColorStop(1, 'rgba(0,0,0,.25)');
      g.fillStyle = F.acc;
      g.beginPath();
      g.moveTo(-0.18, 0.24); g.quadraticCurveTo(0.06, 0.42, 0.30, 0.26);
      g.quadraticCurveTo(0.08, 0.47, -0.18, 0.24); g.fill();
      g.fillStyle = 'rgba(255,255,255,.28)';
      g.beginPath();
      g.moveTo(-0.14, 0.26); g.quadraticCurveTo(0.05, 0.36, 0.24, 0.26);
      g.quadraticCurveTo(0.05, 0.32, -0.14, 0.26); g.fill();
      g.restore();
      if (fi === 7) {                                 // 금붕어빵 반짝
        g.fillStyle = 'rgba(255,255,255,.85)';
        g.beginPath(); g.moveTo(-0.2, -0.34); g.lineTo(-0.13, -0.2); g.lineTo(-0.02, -0.14);
        g.lineTo(-0.13, -0.08); g.lineTo(-0.2, 0.06); g.lineTo(-0.27, -0.08);
        g.lineTo(-0.38, -0.14); g.lineTo(-0.27, -0.2); g.closePath(); g.fill();
      }
    }
    g.restore();
  };

  // 틀 구멍 하나 (무쇠 우묵한 자리) — 안쪽으로 파인 그늘을 넣어 깊어 보이게
  A.mold = function (g, x, y, r) {
    g.save(); g.translate(x, y); g.scale(r * 1.14, r * 1.14);
    fishPath(g);
    var grd = g.createRadialGradient(-0.2, -0.2, 0.05, 0, 0.05, 1.2);
    grd.addColorStop(0, '#413b38'); grd.addColorStop(0.55, '#2a2624'); grd.addColorStop(1, '#131110');
    g.fillStyle = grd; g.fill();
    g.save(); g.clip();                              // 구멍 위쪽 안벽에 지는 그늘
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 0.16;
    fishPath(g); g.stroke();
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.13)'; g.lineWidth = 0.045;   // 구멍 앞턱에 걸린 빛
    g.beginPath();
    g.moveTo(-0.94, 0.08); g.bezierCurveTo(-0.80, 0.36, -0.40, 0.52, 0.06, 0.46);
    g.stroke();
    g.restore();
  };

  // 무쇠판 — 앞턱이 보이는 두툼한 판 (안에서 밖을 보는 눈높이)
  // back: 뒤쪽이 좁아지는 정도(0 이면 직사각형)
  A.griddle = function (g, x, y, w, h, glow, back) {
    var b = back == null ? 0.030 : back;
    var lip = Math.max(6, h * 0.13);                 // 앞턱 두께
    var x0 = x + w * b, x1 = x + w - w * b;          // 뒤쪽 변
    function top(g2, dy) {
      g2.beginPath();
      g2.moveTo(x0, y + dy); g2.lineTo(x1, y + dy);
      g2.lineTo(x + w, y + h + dy); g2.lineTo(x, y + h + dy); g2.closePath();
    }
    g.save();
    g.fillStyle = 'rgba(0,0,0,.45)';                 // 좌판에 드리운 그림자
    g.beginPath(); g.ellipse(x + w / 2, y + h + lip * 0.9, w * 0.54, lip * 1.1, 0, 0, 7); g.fill();

    var fg = g.createLinearGradient(0, y + h, 0, y + h + lip);   // 앞턱(옆면)
    fg.addColorStop(0, '#4a4340'); fg.addColorStop(0.45, '#2b2725'); fg.addColorStop(1, '#171514');
    g.fillStyle = fg;
    g.beginPath();
    g.moveTo(x, y + h); g.lineTo(x + w, y + h);
    g.lineTo(x + w - lip * 0.2, y + h + lip); g.lineTo(x + lip * 0.2, y + h + lip); g.closePath();
    g.fill();

    top(g, 0);                                        // 윗면
    var grd = g.createLinearGradient(0, y, 0, y + h);
    grd.addColorStop(0, '#231f1e'); grd.addColorStop(0.42, '#3b3634'); grd.addColorStop(1, '#4d4643');
    g.fillStyle = grd; g.fill();

    g.save(); top(g, 0); g.clip();                    // 무쇠 결 — 가로로 흐르는 결과 얼룩
    g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 1;
    for (var i = 1; i < 14; i++) {
      var yy = y + h * (i / 14);
      g.beginPath(); g.moveTo(x - 2, yy); g.lineTo(x + w + 2, yy + (i % 3 - 1) * 1.2); g.stroke();
    }
    var sh = g.createRadialGradient(x + w * 0.34, y + h * 0.2, 0, x + w * 0.4, y + h * 0.4, w * 0.8);
    sh.addColorStop(0, 'rgba(255,230,190,.10)'); sh.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = sh; g.fillRect(x, y, w, h);
    if (glow > 0) {                                   // 밑에서 올라오는 불빛
      g.globalCompositeOperation = 'lighter';
      var r2 = g.createRadialGradient(x + w / 2, y + h, 0, x + w / 2, y + h, h * 1.2);
      r2.addColorStop(0, 'rgba(255,140,40,' + (0.22 * glow).toFixed(3) + ')');
      r2.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = r2; g.fillRect(x, y, w, h);
    }
    g.restore();

    top(g, 0);                                        // 닳아서 반질해진 테
    g.strokeStyle = 'rgba(255,235,200,.16)'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w, y + h); g.stroke();
    g.restore();
  };

  // ---------- 오뎅 ----------
  // 꼬치 하나를 눕혀서 그린다 — 어묵이 원점, 나무 꼬치가 +x 로 길게 뻗는다.
  // r = 꼬치 반 길이(10.5cm). 국물에 누워 있는 모습이라 기울이는 건 A.pan 이 한다.
  // 어묵은 넓적한 한 장을 물결지게 접어 꿴 것 — 굽이치는 띠 하나로 그린다
  A.odeng = function (g, x, y, r, seed) {
    var sd = (seed || 0) % 5;
    g.save(); g.translate(x, y); g.scale(r, r);

    var wg = g.createLinearGradient(0, -0.05, 0, 0.06);                  // 나무 꼬치
    wg.addColorStop(0, '#f0d9ae'); wg.addColorStop(0.45, '#d3b184');
    wg.addColorStop(1, '#9c7a50');
    g.strokeStyle = wg; g.lineWidth = 0.072; g.lineCap = 'round';
    var tip = 1.36 + (sd % 3) * 0.13;                                    // 끝이 좀씩 엇갈리게
    g.beginPath(); g.moveTo(-0.66, 0.05); g.lineTo(tip, -0.03); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.30)'; g.lineWidth = 0.020;        // 꼬치에 걸린 빛
    g.beginPath(); g.moveTo(-0.58, 0.028); g.lineTo(tip - 0.06, -0.048); g.stroke();

    // 접힌 겹을 넷으로 나눠 하나씩 칠한다 — 위로 솟은 겹은 빛을 받고 내려간 겹은 그늘진다
    var amp = 0.150 + (sd % 3) * 0.018;
    var sh = (sd % 2) ? 1 : -1;
    var SEG = [
      [-0.50, 0.02, -0.395, -amp, -0.28, 0.02],
      [-0.28, 0.02, -0.165, amp, -0.05, 0.00],
      [-0.05, 0.00, 0.065, -amp, 0.19, 0.02],
      [0.19, 0.02, 0.305, amp * 0.82, 0.43, -0.02]
    ];
    function seg(i, dy) {
      var s2 = SEG[i];
      g.beginPath();
      g.moveTo(s2[0], s2[1] + dy);
      g.quadraticCurveTo(s2[2], sh * s2[3] + dy, s2[4], s2[5] + dy);
    }
    function whole(dy) {
      g.beginPath();
      g.moveTo(SEG[0][0], SEG[0][1] + dy);
      for (var i = 0; i < 4; i++)
        g.quadraticCurveTo(SEG[i][2], sh * SEG[i][3] + dy, SEG[i][4], SEG[i][5] + dy);
    }
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(84,52,22,.42)'; g.lineWidth = 0.300;           // 국물에 지는 그늘
    whole(0.055); g.stroke();
    g.strokeStyle = 'rgba(118,76,36,.80)'; g.lineWidth = 0.278;          // 잘린 가장자리
    whole(0); g.stroke();

    for (var i2 = 0; i2 < 4; i2++) {
      var up = (sh * SEG[i2][3]) < 0;                                    // 위로 솟은 겹인가
      var fg = g.createLinearGradient(0, -0.26, 0, 0.26);
      if (up) { fg.addColorStop(0, '#fdf4e2'); fg.addColorStop(0.5, '#f0dcb8'); fg.addColorStop(1, '#d3b585'); }
      else { fg.addColorStop(0, '#e2c89f'); fg.addColorStop(0.5, '#cfae7e'); fg.addColorStop(1, '#ab8657'); }
      g.strokeStyle = fg; g.lineWidth = up ? 0.250 : 0.226;
      seg(i2, 0); g.stroke();
      if (up) {                                                         // 젖어서 번들거리는 윗날
        g.strokeStyle = 'rgba(255,253,244,.55)'; g.lineWidth = 0.062;
        seg(i2, -0.066); g.stroke();
      }
    }
    g.strokeStyle = 'rgba(126,82,40,.34)'; g.lineWidth = 0.030;          // 겹이 맞물린 자국
    for (var i3 = 0; i3 < 3; i3++) {
      var mx = SEG[i3][4], my = SEG[i3][5];
      g.beginPath(); g.moveTo(mx, my - 0.100); g.lineTo(mx + 0.012, my + 0.100); g.stroke();
    }
    g.restore();
  };

  // 눕힌 꼬치 하나가 차지하는 바깥 자리. A.odeng 의 단위 좌표를 회전시켜 잰다.
  // 부챗살로 벌어지는 양끝 각을 다 재서 넉넉한 쪽을 쓴다 → [왼, 오른, 위, 아래]
  var SKEW_P = [[-0.66, 0], [-0.50, -0.30], [-0.50, 0.30],
    [0.43, -0.30], [0.43, 0.30], [1.62, 0]];
  function skewExt(th1, th2) {
    var e = [0, 0, 0, 0], n, i, c, s2, X, Y;
    for (n = 0; n < 2; n++) {
      c = Math.cos(n ? th2 : th1); s2 = Math.sin(n ? th2 : th1);
      for (i = 0; i < SKEW_P.length; i++) {
        X = SKEW_P[i][0] * c - SKEW_P[i][1] * s2;
        Y = SKEW_P[i][0] * s2 + SKEW_P[i][1] * c;
        if (X < e[0]) e[0] = X; if (X > e[1]) e[1] = X;
        if (Y < e[2]) e[2] = Y; if (Y > e[3]) e[3] = Y;
      }
    }
    return e;
  }

  // 네모난 스텐 오뎅 통 (포장마차에 놓인 실물 크기 46x34cm).
  // x,y,w,h = 국물 윗면이 놓인 자리, have = 꽂힌 꼬치 수, cap = 통 칸수
  A.pan = function (g, x, y, w, h, have, cap, t, back) {
    var b = back == null ? 0.030 : back;
    var lip = Math.max(7, h * 0.30);                  // 통 옆면 깊이
    var x0 = x + w * b, x1 = x + w - w * b;
    function rim(g2, ins) {
      var k = ins || 0;
      g2.beginPath();
      g2.moveTo(x0 + k, y + k * 0.6); g2.lineTo(x1 - k, y + k * 0.6);
      g2.lineTo(x + w - k, y + h - k * 0.6); g2.lineTo(x + k, y + h - k * 0.6); g2.closePath();
    }
    g.save();
    g.fillStyle = 'rgba(0,0,0,.45)';                  // 좌판에 드리운 그림자
    g.beginPath(); g.ellipse(x + w / 2, y + h + lip * 0.92, w * 0.54, lip * 1.05, 0, 0, 7); g.fill();

    var sg = g.createLinearGradient(x, 0, x + w, 0);  // 옆면 — 스텐 반사
    sg.addColorStop(0, '#5c656e'); sg.addColorStop(0.14, '#9fabb6');
    sg.addColorStop(0.34, '#d6dee6'); sg.addColorStop(0.52, '#8e99a4');
    sg.addColorStop(0.74, '#b9c3cc'); sg.addColorStop(1, '#5a636c');
    g.fillStyle = sg;
    g.beginPath();
    g.moveTo(x, y + h); g.lineTo(x + w, y + h);
    g.lineTo(x + w - lip * 0.16, y + h + lip); g.lineTo(x + lip * 0.16, y + h + lip); g.closePath();
    g.fill();
    g.fillStyle = 'rgba(0,0,0,.22)';
    g.beginPath();
    g.moveTo(x, y + h); g.lineTo(x + w, y + h);
    g.lineTo(x + w - lip * 0.16, y + h + lip * 0.22); g.lineTo(x + lip * 0.16, y + h + lip * 0.22);
    g.closePath(); g.fill();

    var tg = g.createLinearGradient(x, y, x + w, y + h);   // 테두리 (말아 접은 스텐)
    tg.addColorStop(0, '#8b959f'); tg.addColorStop(0.26, '#e6edf3');
    tg.addColorStop(0.5, '#a3adb7'); tg.addColorStop(0.78, '#dbe3ea'); tg.addColorStop(1, '#727b85');
    g.fillStyle = tg; rim(g, 0); g.fill();

    var ins = Math.max(3, Math.min(w, h) * 0.055);
    g.save(); rim(g, ins); g.clip();                  // ---- 국물 ----
    var st2 = g.createLinearGradient(0, y, 0, y + h);              // 바닥이 비치는 스텐
    st2.addColorStop(0, '#5d666e'); st2.addColorStop(0.45, '#7d868e'); st2.addColorStop(1, '#69727a');
    g.fillStyle = st2; g.fillRect(x, y, w, h);
    var bg = g.createLinearGradient(0, y, 0, y + h);               // 맑은 갈색 육수
    bg.addColorStop(0, 'rgba(112,72,28,.80)'); bg.addColorStop(0.45, 'rgba(158,106,44,.62)');
    bg.addColorStop(1, 'rgba(190,132,58,.52)');
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.save(); g.globalCompositeOperation = 'lighter';              // 국물에 앉은 불빛
    var sp2 = g.createRadialGradient(x + w * 0.34, y + h * 0.46, 1, x + w * 0.34, y + h * 0.46, w * 0.40);
    sp2.addColorStop(0, 'rgba(255,206,132,.26)'); sp2.addColorStop(1, 'rgba(255,206,132,0)');
    g.fillStyle = sp2; g.fillRect(x, y, w, h);
    g.restore();
    g.strokeStyle = 'rgba(255,238,200,.16)'; g.lineWidth = 1.3;    // 일렁이는 물결
    for (var q = 0; q < 3; q++) {
      var wy = y + h * (0.34 + q * 0.22) + Math.sin(t * 0.9 + q) * h * 0.012;
      g.beginPath(); g.moveTo(x + ins, wy);
      g.bezierCurveTo(x + w * 0.35, wy - h * 0.025, x + w * 0.65, wy + h * 0.025, x + w - ins, wy);
      g.stroke();
    }
    var dsh = g.createLinearGradient(0, y, 0, y + h * 0.42);       // 뒤쪽 벽 그늘
    dsh.addColorStop(0, 'rgba(0,0,0,.42)'); dsh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = dsh; g.fillRect(x, y, w, h * 0.42);
    g.restore();

    if (have > 0) {                                   // ---- 꼬치 — 국물에 눕혀 담근다 ----
      // 꽂힌 수만큼 정확히, 그리고 하나도 통 밖으로 나가지 않게 놓는다.
      // 꼬치가 차지하는 바깥 자리를 먼저 재서 놓을 수 있는 상자를 구하고 그 안에 편다
      var rows = Math.max(1, Math.min(6, Math.ceil(have / 4)));
      var per = [], left = have, k2, maxPer = 0;
      for (k2 = 0; k2 < rows; k2++) {
        var want = Math.ceil(left / (rows - k2));
        per.push(want); left -= want;
        if (want > maxPer) maxPer = want;
      }
      var TH = -0.50, FAN = 0.06;                     // 눕힌 각 · 부챗살로 벌어지는 폭
      var fanMax = FAN * (maxPer - 1) / 2;
      var e = skewExt(TH - fanMax, TH + fanMax);      // [왼, 오른, 위, 아래] — 단위 꼬치 기준
      var spanH = e[1] - e[0], spanV = e[3] - e[2];

      var pad = ins * 1.15;                           // 테두리에서 이만큼 안쪽까지만
      var availH2 = w - pad * 2, availV = h - pad * 1.6;
      var sr0 = w * 0.228;                            // 꼬치 21cm 의 반 (실물 크기)
      // 줄·칸이 서로 뭉개지지 않게 최소 간격을 두고, 안 들어가면 꼬치를 줄인다
      sr0 = Math.min(sr0, availV / (spanV + 0.30 * (rows - 1)));
      sr0 = Math.min(sr0, availH2 / (spanH + 0.34 * (maxPer - 1)));
      var srMax = sr0 * 1.06;
      var bx0 = x + pad - e[0] * srMax, bx1 = x + w - pad - e[1] * srMax;
      var by0 = y + pad * 0.7 - e[2] * srMax, by1 = y + h - pad * 0.9 - e[3] * srMax;
      if (bx1 < bx0) { bx0 = bx1 = (bx0 + bx1) / 2; }
      if (by1 < by0) { by0 = by1 = (by0 + by1) / 2; }

      for (k2 = 0; k2 < rows; k2++) {                 // 뒤줄부터
        var cnt = per[k2]; if (cnt <= 0) continue;
        var v = rows === 1 ? 0.5 : k2 / (rows - 1);   // 0 뒤 ~ 1 앞
        var dep = 0.94 + v * 0.12;                    // 앞이 조금 크다
        var yy = by0 + (by1 - by0) * v;
        var sr = sr0 * dep;
        for (var j = 0; j < cnt; j++) {
          var uu = cnt === 1 ? 0.5 : j / (cnt - 1);
          g.save();
          g.translate(bx0 + (bx1 - bx0) * uu, yy);
          g.rotate(TH + (j - (cnt - 1) / 2) * FAN);
          A.odeng(g, 0, 0, sr, j + k2 * 3);
          g.restore();
        }
      }
      g.save(); rim(g, ins); g.clip();                // 국물에 잠긴 부분은 물빛이 씌워진다
      var gl2 = g.createLinearGradient(0, y, 0, y + h);
      gl2.addColorStop(0, 'rgba(120,76,30,.40)'); gl2.addColorStop(1, 'rgba(186,128,56,.22)');
      g.fillStyle = gl2; g.fillRect(x, y, w, h);
      g.save(); g.globalCompositeOperation = 'lighter';
      var sh2 = g.createLinearGradient(0, y + h * 0.30, 0, y + h * 0.62);
      sh2.addColorStop(0, 'rgba(255,224,168,0)'); sh2.addColorStop(0.5, 'rgba(255,224,168,.14)');
      sh2.addColorStop(1, 'rgba(255,224,168,0)');
      g.fillStyle = sh2; g.fillRect(x, y, w, h);
      g.restore();
      g.restore();
    }

    rim(g, 1); g.strokeStyle = 'rgba(255,255,255,.36)'; g.lineWidth = 1.6; g.stroke();
    g.restore();

    if (have > 0) {                                   // 김 — 오뎅이 들어 있을 때만
      g.save(); g.strokeStyle = '#fff'; g.lineCap = 'round';
      var sw = Math.max(1.4, w * 0.010);
      for (var w2 = 0; w2 < 4; w2++) {
        var off = ((t * 0.38 + w2 * 0.27) % 1);
        var kx = x + w * (0.22 + w2 * 0.19), ky = y + h * 0.1 - off * h * 0.62;
        g.lineWidth = sw * (0.7 + off);
        g.globalAlpha = 0.20 * Math.sin(off * Math.PI);
        g.beginPath(); g.moveTo(kx, ky);
        g.quadraticCurveTo(kx + w * 0.04, ky - h * 0.18, kx - w * 0.015, ky - h * 0.36);
        g.quadraticCurveTo(kx - w * 0.05, ky - h * 0.52, kx + w * 0.01, ky - h * 0.68);
        g.stroke();
      }
      g.restore();
    }
  };
  // 돈통 — 속이 비치는 네모난 플라스틱 상자. fill 0~1 만큼 지폐와 동전이 쌓인다.
  // x,y,w,h = 상자 전체가 들어가는 자리. 위 55% 는 비스듬히 보이는 뚜껑 없는 입구,
  // 아래 45% 는 앞 유리벽 (game.js 의 TILL_D·TILL_H 비율에 맞춰 둔 값)
  var BILLS = ['#a7c6b2', '#c9b98a', '#9fb9d2', '#b6c9a8', '#cbb695'];
  var MONEY = (function () {                          // 돈 놓인 자리는 늘 같게 미리 뽑아 둔다
    var s = 24071, a = [];
    function R() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < 30; i++) a.push({ u: R(), v: R(), r: R(), d: R() });
    return a;
  })();
  A.till = function (g, x, y, w, h, fill, t) {
    var f = Math.max(0, Math.min(1, fill));
    var b = 0.030;                                     // 뒤쪽이 좁아지는 정도
    var topD = h * 0.55, wall = h - topD;              // 입구 깊이 · 앞벽 높이
    var x0 = x + w * b, x1 = x + w - w * b;            // 뒤쪽 변
    var yT = y, yB = y + topD, yF = y + h;             // 뒤 위 · 앞 위 · 앞 아래
    var xi = w * 0.035, r2 = Math.max(2, w * 0.03);    // 벽 두께

    function boxTop(g2, dy) {                          // 입구 사각형 (사다리꼴)
      g2.beginPath();
      g2.moveTo(x0, yT + dy); g2.lineTo(x1, yT + dy);
      g2.lineTo(x + w, yB + dy); g2.lineTo(x, yB + dy); g2.closePath();
    }
    function boxFront(g2) {                            // 앞 유리벽
      g2.beginPath();
      g2.moveTo(x, yB); g2.lineTo(x + w, yB);
      g2.lineTo(x + w, yF); g2.lineTo(x, yF); g2.closePath();
    }

    g.save();
    g.fillStyle = 'rgba(0,0,0,.34)';                   // 좌판에 지는 그림자
    g.beginPath(); g.ellipse(x + w / 2, yF + h * 0.03, w * 0.52, h * 0.075, 0, 0, 7); g.fill();

    // ---- 속 (앞 유리 너머로 비친다) ----
    boxTop(g, wall);                                   // 상자 안쪽 바닥
    var bg2 = g.createLinearGradient(0, yT + wall, 0, yF);
    bg2.addColorStop(0, 'rgba(188,204,216,.46)'); bg2.addColorStop(1, 'rgba(214,228,238,.34)');
    g.fillStyle = bg2; g.fill();

    g.fillStyle = 'rgba(206,222,234,.30)';             // 뒷벽 안쪽
    g.beginPath();
    g.moveTo(x0, yT); g.lineTo(x1, yT);
    g.lineTo(x1, yT + wall); g.lineTo(x0, yT + wall); g.closePath(); g.fill();
    g.fillStyle = 'rgba(196,213,226,.26)';             // 옆벽 안쪽
    g.beginPath();
    g.moveTo(x, yB); g.lineTo(x0, yT); g.lineTo(x0, yT + wall); g.lineTo(x, yF); g.closePath();
    g.moveTo(x + w, yB); g.lineTo(x1, yT); g.lineTo(x1, yT + wall); g.lineTo(x + w, yF); g.closePath();
    g.fill();

    // ---- 들어 있는 돈 ----
    if (f > 0) {
      g.save();
      g.beginPath();                                   // 상자 안쪽에만 그린다
      g.moveTo(x0 + xi, yT + wall * 0.06); g.lineTo(x1 - xi, yT + wall * 0.06);
      g.lineTo(x + w - xi, yF - xi * 0.5); g.lineTo(x + xi, yF - xi * 0.5); g.closePath();
      g.clip();

      var base = yF - xi - h * 0.020;                  // 상자 바닥에 닿는 선
      var ph = wall * (0.14 + f * 0.50);               // 쌓인 높이
      var nb = Math.max(3, Math.round(3 + f * 7));     // 지폐 장수
      for (var i = 0; i < nb; i++) {                   // 지폐 — 아래부터 겹쳐 눕는다
        var m = MONEY[i];
        var lw = w * (0.44 + m.r * 0.14), lh = lw * 0.40;   // 눕혀 놓아 납작해 보인다
        var ly = base - ph * (i / nb);
        var lx = x + w * 0.5 + (m.u - 0.5) * w * 0.30;
        g.save(); g.translate(lx, ly - lh * 0.42);
        g.rotate((m.v - 0.5) * 0.22);
        g.fillStyle = 'rgba(40,30,18,.26)';
        g.beginPath(); g.roundRect(-lw / 2 + lh * 0.05, -lh / 2 + lh * 0.10, lw, lh, lh * 0.09); g.fill();
        g.fillStyle = BILLS[i % BILLS.length];
        g.beginPath(); g.roundRect(-lw / 2, -lh / 2, lw, lh, lh * 0.09); g.fill();
        var bs = g.createLinearGradient(0, -lh / 2, 0, lh / 2);   // 종이에 앉은 빛
        bs.addColorStop(0, 'rgba(255,255,255,.22)'); bs.addColorStop(1, 'rgba(0,0,0,.10)');
        g.fillStyle = bs;
        g.beginPath(); g.roundRect(-lw / 2, -lh / 2, lw, lh, lh * 0.09); g.fill();
        g.strokeStyle = 'rgba(70,90,70,.40)'; g.lineWidth = Math.max(0.6, lh * 0.045);
        g.beginPath(); g.roundRect(-lw / 2 + lh * 0.10, -lh / 2 + lh * 0.10,
          lw - lh * 0.20, lh - lh * 0.20, lh * 0.06); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.30)';         // 인물 자리
        g.beginPath(); g.ellipse(lw * 0.30, 0, lh * 0.20, lh * 0.26, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.22)';         // 숫자 자리
        g.beginPath(); g.roundRect(-lw * 0.42, -lh * 0.30, lw * 0.22, lh * 0.16, lh * 0.05); g.fill();
        g.restore();
      }
      var nc = Math.max(3, Math.round(3 + f * 9));     // 동전 — 지폐 위에 흩어진다
      for (var c = 0; c < nc; c++) {
        var o = MONEY[(c + 12) % MONEY.length];
        var cxp = x + w * (0.16 + o.u * 0.66);
        var cyp = base - ph * (0.20 + o.v * 0.80);
        var cr = w * (0.055 + o.r * 0.028);
        var gold = (c % 3) !== 0;
        g.fillStyle = 'rgba(40,30,10,.28)';
        g.beginPath(); g.ellipse(cxp + cr * 0.12, cyp + cr * 0.22, cr, cr * 0.56, 0, 0, 7); g.fill();
        var cg = g.createLinearGradient(cxp - cr, cyp - cr * 0.5, cxp + cr, cyp + cr * 0.5);
        if (gold) { cg.addColorStop(0, '#ffe79a'); cg.addColorStop(0.5, '#e8b13a'); cg.addColorStop(1, '#a9781d'); }
        else { cg.addColorStop(0, '#f0f4f8'); cg.addColorStop(0.5, '#bcc6d0'); cg.addColorStop(1, '#7e8a95'); }
        g.fillStyle = cg;
        g.beginPath(); g.ellipse(cxp, cyp, cr, cr * 0.56, 0, 0, 7); g.fill();
        g.strokeStyle = gold ? 'rgba(120,84,16,.55)' : 'rgba(90,100,110,.55)';
        g.lineWidth = Math.max(0.6, cr * 0.10);
        g.beginPath(); g.ellipse(cxp, cyp, cr * 0.86, cr * 0.44, 0, 0, 7); g.stroke();
        var tw2 = ((t * 0.5 + o.d * 3) % 3);            // 이따금 반짝
        if (tw2 < 0.28) {
          g.fillStyle = 'rgba(255,255,255,' + (0.7 * Math.sin(tw2 / 0.28 * Math.PI)).toFixed(3) + ')';
          g.beginPath(); g.ellipse(cxp - cr * 0.3, cyp - cr * 0.18, cr * 0.26, cr * 0.14, 0, 0, 7); g.fill();
        }
      }
      g.restore();

      g.save(); g.globalCompositeOperation = 'lighter';   // 돈이 많으면 은은하게 빛난다
      var rg = g.createRadialGradient(x + w / 2, yF - wall * 0.3, 0, x + w / 2, yF - wall * 0.3, w * 0.7);
      rg.addColorStop(0, 'rgba(255,205,90,' + (0.06 + f * 0.13).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(255,205,90,0)');
      g.fillStyle = rg; boxFront(g); g.fill(); g.restore();
    }

    // ---- 앞 유리벽 ----
    var fg2 = g.createLinearGradient(0, yB, 0, yF);
    fg2.addColorStop(0, 'rgba(236,246,253,.26)');
    fg2.addColorStop(0.55, 'rgba(206,226,240,.16)');
    fg2.addColorStop(1, 'rgba(228,242,252,.28)');
    g.fillStyle = fg2; boxFront(g); g.fill();
    g.save(); boxFront(g); g.clip();                   // 유리에 비낀 빛
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.beginPath();
    g.moveTo(x + w * 0.06, yF); g.lineTo(x + w * 0.30, yB);
    g.lineTo(x + w * 0.40, yB); g.lineTo(x + w * 0.16, yF); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.13)';
    g.beginPath();
    g.moveTo(x + w * 0.46, yF); g.lineTo(x + w * 0.70, yB);
    g.lineTo(x + w * 0.75, yB); g.lineTo(x + w * 0.51, yF); g.closePath(); g.fill();
    g.restore();

    // ---- 테두리 ----
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(255,255,255,.62)'; g.lineWidth = Math.max(1.4, w * 0.014);
    boxTop(g, 0); g.stroke();                          // 입구 테두리 (두껍게 말린 플라스틱)
    g.strokeStyle = 'rgba(255,255,255,.30)'; g.lineWidth = Math.max(1, w * 0.008);
    boxTop(g, Math.max(2, w * 0.016)); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.42)'; g.lineWidth = Math.max(1, w * 0.009);
    g.beginPath();                                     // 앞·옆 모서리
    g.moveTo(x, yB); g.lineTo(x, yF); g.lineTo(x + w, yF); g.lineTo(x + w, yB);
    g.stroke();
    g.strokeStyle = 'rgba(120,150,170,.35)'; g.lineWidth = Math.max(1, w * 0.006);
    g.beginPath();                                     // 뒤 모서리 — 유리 너머라 흐리다
    g.moveTo(x0, yT); g.lineTo(x0, yT + wall); g.lineTo(x1, yT + wall); g.lineTo(x1, yT);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(1.2, w * 0.010);
    g.beginPath(); g.moveTo(x + r2, yF); g.lineTo(x + w - r2, yF); g.stroke();   // 바닥 앞날
    g.restore();
  };
  // ---------- 길냥이 (젖소무늬) ----------
  // s = 어깨 높이(25cm 쯤). 오른쪽을 보고 그린 뒤 face 로 뒤집는다.
  // o = { face:-1|1, ph 걸음 위상, sit 0~1 앉기, paw 0~1 앞발 내밀기,
  //       meow 0~1 입 벌리기, hold 물고 있는 맛(없으면 -1) }
  A.cat = function (g, x, y, s, t, o) {
    o = o || {};
    var face = (o.face >= 0) ? 1 : -1;
    var q = Math.min(1, Math.max(0, o.sit || 0));            // 0 서기 ~ 1 앉기
    var paw = Math.min(1, Math.max(0, o.paw || 0));
    var meow = Math.min(1, Math.max(0, o.meow || 0));
    var ph = o.ph || 0;
    var FUR = '#f7f4ef', SHD = '#ddd6ca', SPOT = '#282420', PINK = '#e79aa4';
    function L(a, b) { return a + (b - a) * q; }             // 서기→앉기 사이

    g.save(); g.translate(x, y); g.scale(face * s, s);

    var hipx = L(-0.42, -0.34), hipy = L(-0.62, -0.38), hipr = L(0.30, 0.35);
    var shx = L(0.24, 0.16), shy = L(0.00, -0.06) - 0.66, shr = 0.26;
    var hx = L(0.58, 0.42), hy = L(-0.98, -1.12), hr = 0.245;
    var swF = Math.sin(ph) * 0.17 * (1 - q), swB = Math.sin(ph + 2.2) * 0.17 * (1 - q);
    var breathe = Math.sin(t * 2.2) * 0.008;

    g.fillStyle = 'rgba(0,0,0,.34)';                         // 바닥 그림자
    g.beginPath(); g.ellipse(L(-0.05, -0.12), 0, L(0.62, 0.52), 0.085, 0, 0, 7); g.fill();

    // 꼬리 — 뒤에서 살랑. 앉으면 앞발 쪽으로 감는다
    var tw = Math.sin(t * 2.4 + 0.6) * 0.13;
    g.strokeStyle = SPOT; g.lineWidth = 0.105; g.lineCap = 'round';
    g.beginPath(); g.moveTo(hipx - hipr * 0.5, hipy + 0.10);
    if (q > 0.5) g.bezierCurveTo(hipx - 0.56, hipy + 0.36, hipx - 0.10, -0.02 + tw * 0.1,
      shx + 0.28, -0.03);
    else g.bezierCurveTo(hipx - 0.54, hipy - 0.10, hipx - 0.70, hipy - 0.62 + tw,
      hipx - 0.40, hipy - 0.92 + tw * 1.6);
    g.stroke();
    if (q < 0.5) {                                           // 꼬리 끝만 하얗다 — 등 위로 보인다
      g.strokeStyle = FUR; g.lineWidth = 0.085;
      g.beginPath(); g.moveTo(hipx - 0.56, hipy - 0.80 + tw * 1.4);
      g.quadraticCurveTo(hipx - 0.54, hipy - 0.92 + tw * 1.6, hipx - 0.40, hipy - 0.92 + tw * 1.6);
      g.stroke();
    }

    function leg(bx, by, sw, lw, col, bend) {                // 다리 하나
      g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(bx, by);
      g.quadraticCurveTo(bx + sw * 0.35 + bend, by * 0.42, bx + sw, -0.035);
      g.stroke();
      g.fillStyle = col;                                     // 발
      g.beginPath(); g.ellipse(bx + sw + 0.035, -0.035, 0.085, 0.05, 0, 0, 7); g.fill();
    }
    // 먼 쪽 두 다리 (조금 어둡게)
    leg(hipx + 0.06, hipy + hipr * 0.55, swB * 0.8, 0.10, SHD, L(-0.06, -0.02));
    leg(shx + 0.00, shy + shr * 0.62, swF * 0.8, 0.095, SHD, 0);

    // 몸통 — 엉덩이·가슴 두 덩이를 잇는다
    function bodyPath() {
      var mx = (hipx + shx) / 2, my = (hipy + shy) / 2;
      var ang = Math.atan2(shy - hipy, shx - hipx);
      g.beginPath();
      g.ellipse(hipx, hipy, hipr, hipr * L(0.92, 1.0), 0, 0, 7);
      g.ellipse(shx, shy, shr * 1.02, shr * L(1.0, 1.12), 0, 0, 7);
      g.ellipse(mx, my + breathe, Math.hypot(shx - hipx, shy - hipy) / 2 + 0.20,
        L(0.245, 0.225), ang, 0, 7);
    }
    g.fillStyle = FUR; bodyPath(); g.fill();
    g.beginPath();                                           // 목덜미
    g.moveTo(shx - 0.02, shy - shr * 0.82);
    g.quadraticCurveTo(hx - 0.06, hy + 0.16, hx + 0.02, hy + hr * 0.72);
    g.lineTo(shx + 0.20, shy + shr * 0.50);
    g.quadraticCurveTo(shx + 0.02, shy + shr * 0.2, shx - 0.10, shy - shr * 0.3);
    g.closePath(); g.fill();

    g.save(); bodyPath(); g.clip();                          // 젖소 무늬 — 등에 큼직하게
    g.fillStyle = SPOT;
    g.beginPath();
    g.moveTo(hipx - hipr, hipy + 0.02);
    g.bezierCurveTo(hipx - hipr * 0.9, hipy - hipr * 1.2, hipx + 0.24, hipy - hipr * 1.1,
      shx - 0.06, shy - shr * 0.86);
    g.bezierCurveTo(shx + 0.10, shy - shr * 0.5, shx - 0.04, shy - shr * 0.1, shx - 0.18, shy + 0.02);
    g.bezierCurveTo(hipx + 0.26, hipy + 0.14, hipx - hipr * 0.4, hipy + hipr * 0.9, hipx - hipr, hipy + 0.02);
    g.closePath(); g.fill();
    g.beginPath(); g.ellipse(hipx - 0.02, hipy + hipr * 0.34, hipr * 0.52, hipr * 0.44, 0.3, 0, 7); g.fill();
    var sg2 = g.createLinearGradient(0, shy - 0.3, 0, 0);    // 배 밑 그늘
    sg2.addColorStop(0, 'rgba(0,0,0,0)'); sg2.addColorStop(1, 'rgba(0,0,0,.20)');
    g.fillStyle = sg2; g.fillRect(-1, shy - 0.3, 2, Math.abs(shy) + 0.4);
    g.restore();

    // 가까운 쪽 두 다리
    leg(hipx + 0.14, hipy + hipr * 0.6, swB, 0.115, FUR, L(-0.08, -0.03));
    if (paw <= 0.02) leg(shx + 0.08, shy + shr * 0.66, swF, 0.105, FUR, 0);

    // 머리
    g.fillStyle = FUR;
    g.beginPath(); g.ellipse(hx, hy, hr, hr * 0.94, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(hx + hr * 0.62, hy + hr * 0.42, hr * 0.52, hr * 0.40, 0, 0, 7); g.fill();  // 주둥이
    [[-0.66, 1], [0.20, 0]].forEach(function (e) {           // 귀 — 뒤쪽 것 먼저
      var ex = hx + hr * e[0], ey = hy - hr * 0.62;
      g.fillStyle = e[1] ? '#1e1b18' : SPOT;
      g.beginPath();
      g.moveTo(ex - hr * 0.34, ey + hr * 0.22);
      g.quadraticCurveTo(ex - hr * 0.10, ey - hr * 0.98, ex + hr * 0.40, ey + hr * 0.06);
      g.closePath(); g.fill();
      g.fillStyle = PINK;
      g.beginPath();
      g.moveTo(ex - hr * 0.18, ey + hr * 0.16);
      g.quadraticCurveTo(ex - hr * 0.04, ey - hr * 0.56, ex + hr * 0.22, ey + hr * 0.06);
      g.closePath(); g.fill();
    });
    g.save();                                                // 머리 무늬 — 이마를 덮는 모자
    g.beginPath(); g.ellipse(hx, hy, hr, hr * 0.94, 0, 0, 7); g.clip();
    g.fillStyle = SPOT;
    g.beginPath();
    g.moveTo(hx - hr * 1.1, hy - hr);
    g.lineTo(hx + hr * 1.1, hy - hr);
    g.lineTo(hx + hr * 0.52, hy - hr * 0.06);
    g.quadraticCurveTo(hx + hr * 0.10, hy - hr * 0.46, hx - hr * 0.26, hy + hr * 0.24);
    g.lineTo(hx - hr * 1.1, hy + hr * 0.3);
    g.closePath(); g.fill();
    g.restore();

    g.fillStyle = '#b9e36d';                                 // 눈
    g.beginPath(); g.ellipse(hx + hr * 0.30, hy - hr * 0.02, hr * 0.30, hr * 0.26, -0.1, 0, 7); g.fill();
    g.fillStyle = '#171410';
    g.beginPath(); g.ellipse(hx + hr * 0.34, hy - hr * 0.02, hr * 0.085, hr * 0.23, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.beginPath(); g.arc(hx + hr * 0.20, hy - hr * 0.16, hr * 0.09, 0, 7); g.fill();

    g.fillStyle = PINK;                                      // 코
    g.beginPath();
    g.moveTo(hx + hr * 0.94, hy + hr * 0.20);
    g.lineTo(hx + hr * 1.18, hy + hr * 0.22);
    g.lineTo(hx + hr * 1.04, hy + hr * 0.40);
    g.closePath(); g.fill();
    if (meow > 0.02) {                                       // 야옹 — 벌린 입
      g.fillStyle = '#7d3a44';
      g.beginPath();
      g.ellipse(hx + hr * 0.98, hy + hr * (0.60 + meow * 0.08), hr * 0.155,
        hr * (0.08 + meow * 0.16), -0.05, 0, 7); g.fill();
      g.fillStyle = PINK;
      g.beginPath();
      g.ellipse(hx + hr * 0.95, hy + hr * (0.66 + meow * 0.12), hr * 0.085,
        hr * (0.04 + meow * 0.07), -0.05, 0, 7); g.fill();
    } else {
      g.strokeStyle = 'rgba(70,56,46,.6)'; g.lineWidth = hr * 0.06; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(hx + hr * 1.04, hy + hr * 0.42); g.lineTo(hx + hr * 1.02, hy + hr * 0.56);
      g.quadraticCurveTo(hx + hr * 0.84, hy + hr * 0.68, hx + hr * 0.70, hy + hr * 0.52);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = hr * 0.05;   // 수염
    g.beginPath();
    g.moveTo(hx + hr * 0.86, hy + hr * 0.32); g.lineTo(hx + hr * 2.00, hy - hr * 0.10);
    g.moveTo(hx + hr * 0.88, hy + hr * 0.44); g.lineTo(hx + hr * 2.04, hy + hr * 0.44);
    g.moveTo(hx + hr * 0.84, hy + hr * 0.54); g.lineTo(hx + hr * 1.90, hy + hr * 0.98);
    g.stroke();

    if (o.hold != null && o.hold >= 0)                       // 물고 가는 붕어빵
      A.bread(g, hx + hr * 1.30, hy + hr * 0.86, 0.24, o.hold, 1, 0.16);

    if (paw > 0.02) {                                        // 앞발로 톡 — 좌판 위로 뻗어 올린다
      // 다 뻗으면 발끝이 (0.76, -1.16). game.js 의 PAW_X · PAW_Y 와 맞춰 둘 것
      var px = shx + 0.14 + paw * 0.46, py = shy - paw * 0.44;
      g.strokeStyle = FUR; g.lineWidth = 0.118; g.lineCap = 'round';
      g.beginPath(); g.moveTo(shx + 0.08, shy + shr * 0.34);
      g.quadraticCurveTo(shx + 0.34, shy + shr * 0.10 - paw * 0.16, px, py); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.10)'; g.lineWidth = 0.036;
      g.beginPath(); g.moveTo(shx + 0.13, shy + shr * 0.40);
      g.quadraticCurveTo(shx + 0.39, shy + shr * 0.14 - paw * 0.16, px + 0.04, py); g.stroke();
      g.fillStyle = FUR;                                     // 발
      g.beginPath(); g.ellipse(px + 0.025, py - 0.030, 0.085, 0.070, 0.45, 0, 7); g.fill();
      g.fillStyle = PINK;                                    // 분홍 발바닥
      g.beginPath(); g.ellipse(px + 0.055, py - 0.058, 0.036, 0.027, 0.45, 0, 7); g.fill();
      g.beginPath(); g.ellipse(px - 0.010, py - 0.062, 0.018, 0.014, 0.45, 0, 7); g.fill();
      g.beginPath(); g.ellipse(px + 0.028, py - 0.086, 0.018, 0.014, 0.45, 0, 7); g.fill();
    }
    g.restore();
  };

  // ---------- 손님 ----------
  var COATS = ['#3d4f7a', '#7a3d47', '#3f6350', '#6a4b7a', '#7a5f3d', '#3b5f7a', '#4a4f5e', '#8a5a3d'];
  var HATS = ['#b8452f', '#2f3b58', '#c9a03f', '#3f7a5f', '#8a4a7a'];
  var SKINS = ['#e8c9a8', '#dcb894', '#c99e78'];
  // walk: 0 이면 서 있고, 0 보다 크면 그만큼 걷는 몸짓(위상). face: -1 왼쪽 / 1 오른쪽
  // 빛은 왼쪽 위(천막 알전구)에서 온다 — 그러데이션과 테두리 빛을 모두 그 방향으로 맞춘다
  A.customer = function (g, x, y, h, i, t, walk, face) {
    var c = COATS[i % COATS.length];
    var step = walk ? Math.sin(walk) : 0, step2 = walk ? Math.sin(walk + Math.PI) : 0;
    var bob = walk ? Math.abs(Math.sin(walk)) * -h * 0.018 : Math.sin(t * 1.8 + i * 1.3) * h * 0.014;
    g.save(); g.translate(x, y + bob);
    if (face === 1) g.scale(-1, 1);
    g.fillStyle = 'rgba(0,0,0,.28)';
    g.beginPath(); g.ellipse(0, 2 - bob, h * 0.23, h * 0.045, 0, 0, 7); g.fill();

    // ---- 다리 — 원통이라 가운데가 밝고 양옆이 어둡다 ----
    var lg = g.createLinearGradient(-h * 0.14, 0, h * 0.14, 0);
    lg.addColorStop(0, dk(c, 0.50)); lg.addColorStop(0.42, dk(c, 0.78)); lg.addColorStop(1, dk(c, 0.52));
    g.fillStyle = lg;
    g.beginPath();
    g.roundRect(-h * 0.13 + step * h * 0.09, -h * 0.20, h * 0.10, h * 0.21 - Math.abs(step) * h * 0.03, h * 0.04);
    g.roundRect(h * 0.03 + step2 * h * 0.09, -h * 0.20, h * 0.10, h * 0.21 - Math.abs(step2) * h * 0.03, h * 0.04);
    g.fill();

    // ---- 소매 — 패딩에 파묻힌 팔. 몸통 옆으로 조금만 내밀어야 판자로 안 보인다 ----
    var AW = h * 0.098;
    function arm(cx, sw, near) {
      var x0 = cx - AW / 2 + sw, y0 = -h * 0.60, len = h * 0.335;
      var ag = g.createLinearGradient(x0, 0, x0 + AW, 0);
      if (near) {                                                     // 빛 받는 쪽 — 바깥 테는 살짝 죽인다
        ag.addColorStop(0, dk(c, 0.72)); ag.addColorStop(0.32, lt(c, 0.06));
        ag.addColorStop(0.8, dk(c, 0.70)); ag.addColorStop(1, dk(c, 0.52));
      } else {                                                        // 그늘 쪽 팔
        ag.addColorStop(0, dk(c, 0.40)); ag.addColorStop(0.6, dk(c, 0.56));
        ag.addColorStop(1, dk(c, 0.44));
      }
      g.fillStyle = ag;
      g.beginPath(); g.roundRect(x0, y0, AW, len, AW * 0.5); g.fill();
      g.fillStyle = near ? dk(c, 0.42) : dk(c, 0.34);                 // 소매 끝 — 손이 쏙 들어간 자리
      g.beginPath();
      g.ellipse(x0 + AW / 2, y0 + len - AW * 0.22, AW * 0.44, AW * 0.30, 0, 0, 7); g.fill();
    }
    arm(h * 0.163, step * h * 0.045, 0);

    // ---- 패딩 몸통 ----
    function coat() {
      g.beginPath(); g.roundRect(-h * 0.19, -h * 0.64, h * 0.38, h * 0.50, h * 0.14);
    }
    var bg2 = g.createLinearGradient(-h * 0.19, -h * 0.64, h * 0.21, -h * 0.14);
    bg2.addColorStop(0, lt(c, 0.26)); bg2.addColorStop(0.34, lt(c, 0.06));
    bg2.addColorStop(0.72, dk(c, 0.86)); bg2.addColorStop(1, dk(c, 0.52));
    g.fillStyle = bg2; coat(); g.fill();

    g.save(); coat(); g.clip();
    for (var k2 = 0; k2 < 3; k2++) {                                  // 누빔 — 골마다 그늘과 빛이 한 쌍
      var qy = -h * (0.52 - k2 * 0.12);
      var qg = g.createLinearGradient(0, qy - h * 0.06, 0, qy + h * 0.03);
      qg.addColorStop(0, 'rgba(0,0,0,0)');
      qg.addColorStop(0.72, 'rgba(0,0,0,.20)');
      qg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = qg; g.fillRect(-h * 0.20, qy - h * 0.06, h * 0.40, h * 0.09);
      g.fillStyle = 'rgba(255,255,255,.10)';
      g.beginPath(); g.roundRect(-h * 0.185, qy + h * 0.006, h * 0.37, h * 0.012, h * 0.006); g.fill();
    }
    var bsh = g.createLinearGradient(0, -h * 0.30, 0, -h * 0.14);     // 아랫단 그늘
    bsh.addColorStop(0, 'rgba(0,0,0,0)'); bsh.addColorStop(1, 'rgba(0,0,0,.26)');
    g.fillStyle = bsh; g.fillRect(-h * 0.20, -h * 0.30, h * 0.40, h * 0.16);
    var ssh = g.createLinearGradient(0, -h * 0.64, 0, -h * 0.54);     // 목도리가 가슴에 지우는 그늘
    ssh.addColorStop(0, 'rgba(0,0,0,.30)'); ssh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ssh; g.fillRect(-h * 0.20, -h * 0.64, h * 0.40, h * 0.10);
    var ash = g.createLinearGradient(-h * 0.114, 0, -h * 0.045, 0);   // 앞쪽 소매가 옆구리에 지우는 그늘
    ash.addColorStop(0, 'rgba(0,0,0,.24)'); ash.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ash; g.fillRect(-h * 0.114, -h * 0.60, h * 0.08, h * 0.42);
    g.restore();
    g.strokeStyle = 'rgba(255,246,230,.16)';                          // 왼 어깨에 걸린 빛
    g.lineWidth = h * 0.012;
    g.beginPath();
    g.moveTo(-h * 0.175, -h * 0.36);
    g.quadraticCurveTo(-h * 0.19, -h * 0.60, -h * 0.05, -h * 0.632);
    g.stroke();

    arm(-h * 0.163, step2 * h * 0.045, 1);                            // 가까운 쪽 팔
    g.strokeStyle = 'rgba(0,0,0,.17)';                                // 소매가 몸통에 파고든 자리
    g.lineWidth = h * 0.010; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-h * 0.116 + step2 * h * 0.045, -h * 0.565);
    g.lineTo(-h * 0.116 + step2 * h * 0.045, -h * 0.305);
    g.stroke();

    // ---- 얼굴 — 둥근 공처럼 ----
    var sk = SKINS[i % SKINS.length];
    var fg2 = g.createRadialGradient(-h * 0.05, -h * 0.80, h * 0.01, 0, -h * 0.755, h * 0.155);
    fg2.addColorStop(0, lt(sk, 0.20)); fg2.addColorStop(0.55, sk); fg2.addColorStop(1, dk(sk, 0.74));
    g.fillStyle = fg2;
    g.beginPath(); g.arc(0, -h * 0.755, h * 0.142, 0, 7); g.fill();
    g.save();
    g.beginPath(); g.arc(0, -h * 0.755, h * 0.142, 0, 7); g.clip();
    var hsh = g.createLinearGradient(0, -h * 0.90, 0, -h * 0.79);     // 모자챙이 이마에 지우는 그늘
    hsh.addColorStop(0, 'rgba(0,0,0,.34)'); hsh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hsh; g.fillRect(-h * 0.15, -h * 0.90, h * 0.30, h * 0.12);
    var csh = g.createLinearGradient(0, -h * 0.70, 0, -h * 0.64);     // 턱 밑 그늘
    csh.addColorStop(0, 'rgba(0,0,0,0)'); csh.addColorStop(1, 'rgba(0,0,0,.30)');
    g.fillStyle = csh; g.fillRect(-h * 0.15, -h * 0.70, h * 0.30, h * 0.07);
    g.restore();

    // ---- 목도리 — 굵은 실이라 위가 밝고 아래가 어둡다 ----
    var sc = HATS[(i + 1) % HATS.length];
    var sg3 = g.createLinearGradient(0, -h * 0.665, 0, -h * 0.58);
    sg3.addColorStop(0, lt(sc, 0.22)); sg3.addColorStop(0.55, sc); sg3.addColorStop(1, dk(sc, 0.62));
    g.fillStyle = sg3;
    g.beginPath(); g.roundRect(-h * 0.15, -h * 0.665, h * 0.30, h * 0.085, h * 0.042); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = h * 0.008;       // 감긴 자국
    g.beginPath();
    g.moveTo(-h * 0.05, -h * 0.660); g.lineTo(-h * 0.03, -h * 0.585);
    g.moveTo(h * 0.06, -h * 0.662); g.lineTo(h * 0.08, -h * 0.588);
    g.stroke();

    // ---- 털모자 ----
    var ht = HATS[i % HATS.length];
    var hg = g.createRadialGradient(-h * 0.06, -h * 0.93, h * 0.01, 0, -h * 0.865, h * 0.17);
    hg.addColorStop(0, lt(ht, 0.28)); hg.addColorStop(0.6, ht); hg.addColorStop(1, dk(ht, 0.58));
    g.fillStyle = hg;
    g.beginPath(); g.arc(0, -h * 0.865, h * 0.148, Math.PI, 0); g.fill();
    var bg3 = g.createLinearGradient(0, -h * 0.885, 0, -h * 0.813);   // 접어 올린 챙
    bg3.addColorStop(0, lt(ht, 0.34)); bg3.addColorStop(0.5, lt(ht, 0.08)); bg3.addColorStop(1, dk(ht, 0.66));
    g.fillStyle = bg3;
    g.beginPath(); g.roundRect(-h * 0.155, -h * 0.885, h * 0.31, h * 0.072, h * 0.036); g.fill();
    var pg = g.createRadialGradient(-h * 0.014, -h * 1.008, h * 0.004, 0, -h * 0.995, h * 0.046);
    pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.6, 'rgba(246,242,236,.95)');
    pg.addColorStop(1, 'rgba(198,190,182,.95)');
    g.fillStyle = pg;
    g.beginPath(); g.arc(0, -h * 0.995, h * 0.042, 0, 7); g.fill();

    g.fillStyle = 'rgba(20,14,10,.8)';                                // 눈
    g.beginPath(); g.arc(-h * 0.052, -h * 0.762, h * 0.017, 0, 7);
    g.arc(h * 0.052, -h * 0.762, h * 0.017, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)';                            // 눈에 걸린 빛
    g.beginPath(); g.arc(-h * 0.057, -h * 0.767, h * 0.006, 0, 7);
    g.arc(h * 0.047, -h * 0.767, h * 0.006, 0, 7); g.fill();
    g.fillStyle = 'rgba(210,120,110,.35)';                            // 언 볼
    g.beginPath(); g.arc(-h * 0.10, -h * 0.722, h * 0.030, 0, 7);
    g.arc(h * 0.10, -h * 0.722, h * 0.030, 0, 7); g.fill();

    var br = ((t * 0.45 + i * 0.41) % 1);                             // 하얀 입김
    if (br < 0.55) {
      g.fillStyle = 'rgba(255,255,255,' + (0.26 * Math.sin(br / 0.55 * Math.PI)).toFixed(3) + ')';
      g.beginPath(); g.arc(h * 0.19 + br * h * 0.2, -h * 0.75, h * (0.03 + br * 0.09), 0, 7); g.fill();
    }
    g.restore();
  };
  function lt(hex, k) {                            // 흰색 쪽으로 k 만큼 — 빛 받는 면
    var n = parseInt(hex.slice(1), 16);
    var r = n >> 16, g2 = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r + (255 - r) * k) + ',' + Math.round(g2 + (255 - g2) * k) + ',' +
      Math.round(b + (255 - b) * k) + ')';
  }
  function dk(hex, m) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round((n >> 16) * m) + ',' + Math.round(((n >> 8) & 255) * m) + ',' +
      Math.round((n & 255) * m) + ')';
  }

  // ---------- 눈 ----------
  // 함박눈. d 는 멀고 가까움(0 뒤 ~ 1 앞) — 앞쪽일수록 크고 빠르고 진하다
  A.snowInit = function (n, W, H) {
    var a = [];
    for (var i = 0; i < n; i++) {
      var d = Math.random();
      a.push({ x: Math.random() * W, y: Math.random() * H, d: d,
        r: 1.2 + d * d * 5.0, s: 22 + d * 78, w: Math.random() * 6.28,
        sw: 9 + d * 30, spin: (Math.random() < 0.5 ? -1 : 1) * (0.5 + d) });
    }
    return a;
  };
  // gust: 바람 세기(-1~1). 게 시간에 따라 천천히 흔들린다
  A.snowDraw = function (g, a, dt, W, H, gust) {
    var wind = (gust || 0) * 34;
    for (var i = 0; i < a.length; i++) {
      var p = a[i];
      p.y += p.s * dt; p.w += dt * (1.1 + p.d);
      p.x += (Math.sin(p.w) * p.sw + wind * (0.4 + p.d)) * dt;
      if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
      if (p.x < -8) p.x = W + 8; else if (p.x > W + 8) p.x = -8;
      g.globalAlpha = 0.38 + p.d * 0.58;
      if (p.r > 3.4) {                                   // 큰 송이는 여섯 갈래 덩어리로
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(p.x, p.y, p.r * 0.62, 0, 7);
        var ph = p.w * p.spin;
        for (var k = 0; k < 5; k++) {
          var an = ph + k * 1.2566;
          g.moveTo(p.x + Math.cos(an) * p.r, p.y + Math.sin(an) * p.r);
          g.arc(p.x + Math.cos(an) * p.r * 0.72, p.y + Math.sin(an) * p.r * 0.72, p.r * 0.40, 0, 7);
        }
        g.fill();
      } else {
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      }
    }
    g.globalAlpha = 1;
  };

  // 코앞으로 지나가는 큰 송이 — 초점이 안 맞아 뿌옇다. 천막 안까지 흩날려 들어온다
  A.snowNearInit = function (n, W, H) {
    var a = [];
    for (var i = 0; i < n; i++) {
      var d = 0.45 + Math.random() * 0.55;
      a.push({ x: Math.random() * W, y: Math.random() * H, d: d,
        r: 7 + d * d * 18, s: 34 + d * 72, w: Math.random() * 6.28, sw: 16 + d * 36 });
    }
    return a;
  };
  // y0~y1 는 천막 밖으로 보이는 구간. 좌판 위로는 내리지 않고, 아래 끝에서 스르르 사라진다
  A.snowNearDraw = function (g, a, dt, W, H, gust, y0, y1) {
    var wind = (gust || 0) * 52;
    var fade = Math.max(12, (y1 - y0) * 0.18);
    for (var i = 0; i < a.length; i++) {
      var p = a[i];
      p.y += p.s * dt; p.w += dt * (0.8 + p.d * 0.7);
      p.x += (Math.sin(p.w) * p.sw + wind) * dt;
      if (p.y > H + p.r * 2) { p.y = -p.r * 2; p.x = Math.random() * W; }
      if (p.x < -p.r * 2) p.x = W + p.r * 2; else if (p.x > W + p.r * 2) p.x = -p.r * 2;
      if (p.y < y0 - p.r || p.y > y1) continue;
      var k = 1;
      if (p.y > y1 - fade) k = (y1 - p.y) / fade;                 // 좌판에 닿기 전에 옅어진다
      if (p.y < y0 + fade * 0.5) k *= Math.max(0, (p.y - y0) / (fade * 0.5));
      if (k <= 0.02) continue;
      var rg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      var al = ((0.10 + p.d * 0.17) * k).toFixed(3);
      rg.addColorStop(0, 'rgba(255,255,255,' + al + ')');
      rg.addColorStop(0.45, 'rgba(255,255,255,' + (al * 0.72).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
    }
  };

  // ---------- 배경: 겨울 밤거리 ----------
  A.night = function (g, W, H, horizon) {
    var sky = g.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#0b1024'); sky.addColorStop(0.6, '#16203f'); sky.addColorStop(1, '#2b3352');
    g.fillStyle = sky; g.fillRect(0, 0, W, horizon);

    var mx = W * 0.78, my = horizon * 0.20, mr = Math.min(26, W * 0.055);   // 달
    g.save(); g.globalCompositeOperation = 'lighter';
    var mg = g.createRadialGradient(mx, my, 0, mx, my, mr * 5);
    mg.addColorStop(0, 'rgba(210,225,255,.20)'); mg.addColorStop(1, 'rgba(210,225,255,0)');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr * 5, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#e8eefc'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill();
    g.fillStyle = 'rgba(190,205,235,.5)';
    g.beginPath(); g.arc(mx - mr * 0.3, my - mr * 0.25, mr * 0.19, 0, 7);
    g.arc(mx + mr * 0.28, my + mr * 0.1, mr * 0.13, 0, 7);
    g.arc(mx - mr * 0.05, my + mr * 0.42, mr * 0.1, 0, 7); g.fill();

    var rng = 1234;                                    // 늘 같은 건물이 서 있게
    function R() { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff; }
    var x = -20;
    while (x < W + 20) {
      var bw = 40 + R() * 66, bh = horizon * (0.12 + R() * 0.30);
      g.fillStyle = '#101733';
      g.fillRect(x, horizon - bh, bw, bh);
      for (var wy = horizon - bh + 12; wy < horizon - 14; wy += 17) {
        for (var wx = x + 8; wx < x + bw - 10; wx += 15) {
          if (R() < 0.42) { g.fillStyle = R() < 0.25 ? 'rgba(255,225,150,.55)' : 'rgba(180,205,255,.28)';
            g.fillRect(wx, wy, 7, 9); }
        }
      }
      x += bw + 4 + R() * 10;
    }
    var gr = g.createLinearGradient(0, horizon - 6, 0, H);   // 눈 쌓인 바닥
    gr.addColorStop(0, '#9ea9be'); gr.addColorStop(0.30, '#8b96ac'); gr.addColorStop(1, '#5f6879');
    g.fillStyle = gr; g.fillRect(0, horizon - 6, W, H - horizon + 6);
    g.save(); g.globalCompositeOperation = 'lighter';         // 노점 불빛이 눈길에 번진다
    var pl = g.createRadialGradient(W * 0.5, horizon + (H - horizon) * 0.5, 0,
      W * 0.5, horizon + (H - horizon) * 0.5, W * 0.55);
    pl.addColorStop(0, 'rgba(255,190,110,.14)'); pl.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = pl; g.fillRect(0, horizon - 6, W, H - horizon + 6);
    g.restore();
  };

  // ---------- 노점 (단계별) ----------
  // 판 뒤에 서 있는 구조물. cx = 가운데, by = 판 윗선
  A.stall = function (g, rank, cx, by, w, t) {
    var h = w * 0.62;
    var glow = 0.85 + Math.sin(t * 1.7) * 0.07;
    function bulb(x, y, r) {
      g.save(); g.globalCompositeOperation = 'lighter';
      var rg = g.createRadialGradient(x, y, 0, x, y, r * 7);
      rg.addColorStop(0, 'rgba(255,205,120,' + (0.42 * glow).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(255,190,90,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r * 7, 0, 7); g.fill(); g.restore();
      g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.save();
    if (rank === 0) {                                    // 포장마차 — 천막
      g.fillStyle = '#c0392b';
      g.beginPath(); g.roundRect(cx - w * 0.72, by - h * 1.18, w * 1.44, h * 0.42, h * 0.1); g.fill();
      g.fillStyle = 'rgba(0,0,0,.16)';
      for (var i = 0; i < 7; i++) if (i % 2) g.fillRect(cx - w * 0.72 + i * w * 0.206, by - h * 1.18, w * 0.206, h * 0.42);
      g.fillStyle = '#d84a38';                           // 늘어진 자락
      for (var j = 0; j < 8; j++) {
        var fx = cx - w * 0.72 + j * w * 0.18;
        g.beginPath(); g.moveTo(fx, by - h * 0.76);
        g.quadraticCurveTo(fx + w * 0.09, by - h * 0.62, fx + w * 0.18, by - h * 0.76); g.fill();
      }
      g.strokeStyle = '#4a4340'; g.lineWidth = w * 0.022;
      [-0.66, 0.66].forEach(function (o) {
        g.beginPath(); g.moveTo(cx + w * o, by - h * 0.78); g.lineTo(cx + w * o, by + h * 0.05); g.stroke();
      });
      bulb(cx - w * 0.3, by - h * 0.72, w * 0.019); bulb(cx + w * 0.3, by - h * 0.72, w * 0.019);
    } else if (rank === 1) {                             // 푸드트럭 — 옆면 + 판매창
      g.fillStyle = '#e8ded0';
      g.beginPath(); g.roundRect(cx - w * 0.86, by - h * 1.36, w * 1.72, h * 1.2, h * 0.12); g.fill();
      g.fillStyle = '#1a2436';
      g.beginPath(); g.roundRect(cx - w * 0.58, by - h * 1.12, w * 1.16, h * 0.6, h * 0.06); g.fill();
      g.fillStyle = '#1f6b6b';                           // 차양
      g.beginPath(); g.moveTo(cx - w * 0.66, by - h * 1.16); g.lineTo(cx + w * 0.66, by - h * 1.16);
      g.lineTo(cx + w * 0.5, by - h * 1.42); g.lineTo(cx - w * 0.5, by - h * 1.42); g.closePath(); g.fill();
      g.fillStyle = '#2b2624';
      [-0.52, 0.52].forEach(function (o) {
        g.beginPath(); g.arc(cx + w * o, by - h * 0.1, h * 0.19, 0, 7); g.fill();
        g.fillStyle = '#6b625d'; g.beginPath(); g.arc(cx + w * o, by - h * 0.1, h * 0.07, 0, 7); g.fill();
        g.fillStyle = '#2b2624';
      });
      bulb(cx - w * 0.34, by - h * 1.12, w * 0.017); bulb(cx, by - h * 1.12, w * 0.017);
      bulb(cx + w * 0.34, by - h * 1.12, w * 0.017);
    } else {                                             // 가게 — 유리 앞면 + 간판
      g.fillStyle = '#2a2f42';
      g.beginPath(); g.roundRect(cx - w * 1.0, by - h * 1.7, w * 2.0, h * 1.56, h * 0.06); g.fill();
      g.fillStyle = '#0f1626';
      g.beginPath(); g.roundRect(cx - w * 0.88, by - h * 1.2, w * 1.76, h * 0.98, h * 0.05); g.fill();
      g.fillStyle = 'rgba(255,214,140,.14)';
      g.beginPath(); g.roundRect(cx - w * 0.88, by - h * 1.2, w * 1.76, h * 0.98, h * 0.05); g.fill();
      g.fillStyle = '#8a2f1c';                           // 간판
      g.beginPath(); g.roundRect(cx - w * 0.94, by - h * 1.66, w * 1.88, h * 0.4, h * 0.07); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter';
      var ng = g.createLinearGradient(cx - w, by - h * 1.66, cx + w, by - h * 1.26);
      ng.addColorStop(0, 'rgba(255,120,60,' + (0.3 * glow).toFixed(2) + ')');
      ng.addColorStop(1, 'rgba(255,190,90,' + (0.3 * glow).toFixed(2) + ')');
      g.fillStyle = ng;
      g.beginPath(); g.roundRect(cx - w * 0.94, by - h * 1.66, w * 1.88, h * 0.4, h * 0.07); g.fill(); g.restore();
      A.bread(g, cx, by - h * 1.46, h * 0.15, 7, 1, -0.12);
      for (var b = -3; b <= 3; b++) bulb(cx + b * w * 0.28, by - h * 1.24, w * 0.014);
    }
    g.restore();
  };

  // ---------- 안에서 밖을 보는 화면 ----------
  // 단계마다 천막 빛깔이 달라진다 (종이컵·리어카·포장마차·푸드트럭·가게)
  // 단계마다 천막 빛깔 — 종이컵은 빨간 비닐우산부터 시작한다
  var TENT = ['#c0392b', '#1f6b6b', '#6d3a22'];

  // 좌판 — 발치에서 앞으로 깔린 나무 상판. topY 위로는 바깥 거리가 보인다
  A.counter = function (g, W, H, topY, rank) {
    var wood = rank >= 1 ? ['#4a4f57', '#33373d', '#23262b'] : ['#8a6038', '#6b4728', '#4a2f19'];
    var wg = g.createLinearGradient(0, topY, 0, H);
    wg.addColorStop(0, wood[1]); wg.addColorStop(0.30, wood[0]);
    wg.addColorStop(0.72, wood[1]); wg.addColorStop(1, wood[2]);
    g.fillStyle = wg; g.fillRect(0, topY, W, H - topY);

    g.save(); g.beginPath(); g.rect(0, topY, W, H - topY); g.clip();
    g.strokeStyle = 'rgba(0,0,0,.24)'; g.lineWidth = 1;       // 판자 이음새 — 멀수록 촘촘
    for (var i = 1; i <= 7; i++) {
      var v = Math.pow(i / 7, 1.8), yy = topY + (H - topY) * v;
      g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
      g.strokeStyle = 'rgba(255,235,200,.06)';
      g.beginPath(); g.moveTo(0, yy + 1.5); g.lineTo(W, yy + 1.5); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.24)';
    }
    g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 1.4;      // 나뭇결
    for (var k = 0; k < 14; k++) {
      var gx = (k + 0.5) / 14 * W, gy0 = topY + (H - topY) * ((k % 3) * 0.2 + 0.1);
      g.beginPath(); g.moveTo(gx, gy0);
      g.bezierCurveTo(gx + 14, gy0 + 30, gx - 12, gy0 + 70, gx + 6, gy0 + 120);
      g.stroke();
    }
    var vg = g.createLinearGradient(0, topY, 0, H);            // 천막 그늘 — 앞쪽이 어둡다
    vg.addColorStop(0, 'rgba(255,190,110,.10)'); vg.addColorStop(0.55, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.34)');
    g.fillStyle = vg; g.fillRect(0, topY, W, H - topY);
    g.restore();

    g.fillStyle = 'rgba(0,0,0,.45)';                           // 좌판 뒤턱
    g.fillRect(0, topY - 2, W, 3);
    g.fillStyle = 'rgba(255,225,180,.16)';
    g.fillRect(0, topY + 1, W, 1.6);
  };

  // 천막 안쪽 — 머리 위 자락과 양옆 기둥. 마지막에 덧그린다
  A.tent = function (g, W, H, rank, topY, t) {
    var col = TENT[Math.min(rank, TENT.length - 1)];
    var glow = 0.86 + Math.sin(t * 1.7) * 0.07;
    var hang = topY;                                            // 자락이 내려온 깊이
    var pw = Math.max(14, W * 0.026);                           // 기둥 굵기

    g.save();
    var cg = g.createLinearGradient(0, 0, 0, hang);             // 자락 안쪽 — 빛을 등져 어둡다
    cg.addColorStop(0, dkHex(col, 0.34)); cg.addColorStop(0.62, dkHex(col, 0.60));
    cg.addColorStop(1, dkHex(col, 0.86));
    g.fillStyle = cg;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, hang * 0.72);
    for (var s = 8; s >= 0; s--) {                              // 물결지는 자락 끝
      var x1 = W * (s + 0.5) / 9, x0 = W * s / 9;
      g.quadraticCurveTo(x1, hang * 1.06, x0, hang * 0.72);
    }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)';                            // 줄무늬
    for (var i = 0; i < 9; i++) if (i % 2) g.fillRect(W * i / 9, 0, W / 9, hang * 0.78);
    g.fillStyle = 'rgba(0,0,0,.30)';                            // 자락 접힌 그늘
    g.fillRect(0, hang * 0.60, W, hang * 0.14);

    [pw * 0.5, W - pw * 0.5].forEach(function (px) {            // 양옆 기둥
      var pg = g.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
      pg.addColorStop(0, '#2a2724'); pg.addColorStop(0.35, '#6a625b');
      pg.addColorStop(0.6, '#3c3733'); pg.addColorStop(1, '#1b1917');
      g.fillStyle = pg; g.fillRect(px - pw / 2, 0, pw, H);
    });

    var by = hang * 0.52;                                       // 알전구 — 자락에 매달려
    for (var b = 0; b < 3; b++) {
      var bx = W * (0.24 + b * 0.26), br = Math.max(4, W * 0.007);
      g.strokeStyle = 'rgba(30,26,22,.8)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, by - br); g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter';
      var rg = g.createRadialGradient(bx, by, 0, bx, by, br * 11);
      rg.addColorStop(0, 'rgba(255,205,120,' + (0.36 * glow).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(255,190,90,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(bx, by, br * 11, 0, 7); g.fill(); g.restore();
      g.fillStyle = '#ffeab4'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
    }

    g.globalCompositeOperation = 'lighter';                     // 전구 빛이 좌판까지 내려앉는다
    var lg = g.createRadialGradient(W / 2, hang, 0, W / 2, hang, H * 0.9);
    lg.addColorStop(0, 'rgba(255,186,96,' + (0.13 * glow).toFixed(3) + ')');
    lg.addColorStop(0.55, 'rgba(255,170,80,' + (0.05 * glow).toFixed(3) + ')');
    lg.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.restore();
  };
  function dkHex(hex, m) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round((n >> 16) * m) + ',' + Math.round(((n >> 8) & 255) * m) + ',' +
      Math.round((n & 255) * m) + ')';
  }

  // 도감·승급 카드용 작은 그림
  A.icon = function (cv, fi, locked) {
    var g = cv.getContext('2d'), s = cv.width;
    g.clearRect(0, 0, s, s);
    if (locked) {
      g.save(); g.globalAlpha = 0.5; A.bread(g, s / 2, s / 2, s * 0.31, 0, 0, -0.1); g.restore();
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = (s * 0.34) + 'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', s / 2, s / 2 + s * 0.02);
      return;
    }
    A.bread(g, s / 2, s * 0.42, s * 0.30, fi, 1, -0.1);
    var F = A.FLAVORS[fi], cx = s * 0.5, cy = s * 0.84, r = s * 0.115;   // 속 색 방울
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath(); g.arc(cx, cy, r * 1.28, 0, 7); g.fill();
    g.fillStyle = F.acc;
    g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.beginPath(); g.arc(cx - r * 0.32, cy - r * 0.34, r * 0.28, 0, 7); g.fill();
  };

  window.ART = A;
})();
