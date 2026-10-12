/* 딱지 종이 그림 — 캔버스로 앞면(바람개비 접힘)·뒷면(네모 접힘)을 그린다 */
(function () {
  var N = 512;
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shade(hex, k) { // k<0 어둡게, k>0 밝게
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function star(c, x, y, r, n) { c.beginPath(); for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
  function fibers(c, R, n, col, a) {
    c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1;
    for (var i = 0; i < n; i++) { var x = R() * N, y = R() * N, l = 4 + R() * 18, an = R() * 6.28; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(an + 1) * l * .5, y + Math.sin(an + 1) * l * .5, x + Math.cos(an) * l, y + Math.sin(an) * l); c.stroke(); }
    c.restore();
  }
  function lines(c, R, x0, y0, w, h, step, col, a) {
    c.save(); c.globalAlpha = a; c.fillStyle = col;
    for (var y = y0; y < y0 + h; y += step) { var x = x0; while (x < x0 + w) { var l = 6 + R() * 26; c.fillRect(x, y, Math.min(l, x0 + w - x), step * 0.42); x += l + 4; } }
    c.restore();
  }
  // 무늬 하나를 (base, acc) 색으로 N×N 에 칠한다
  function pattern(c, t, base, acc, R) {
    c.fillStyle = base; c.fillRect(0, 0, N, N);
    var p = t.pat, i, j, x, y;
    if (p === 'news' ) {
      c.fillStyle = 'rgba(30,30,30,.85)'; c.fillRect(30, 36, N - 60, 30);
      for (i = 0; i < 4; i++) lines(c, R, 30 + i * 116, 90, 104, N - 120, 11, '#333', .55);
      c.fillStyle = acc; c.globalAlpha = .5; c.fillRect(146, 120, 210, 150); c.globalAlpha = 1;
    } else if (p === 'stripe') {
      c.fillStyle = acc; for (y = 0; y < N; y += 64) c.fillRect(0, y + 20, N, 22);
      c.fillStyle = 'rgba(255,255,255,.35)'; for (y = 0; y < N; y += 64) c.fillRect(0, y + 46, N, 4);
    } else if (p === 'ad') {
      c.fillStyle = acc; star(c, 256, 230, 190, 14);
      c.fillStyle = '#fff'; star(c, 256, 230, 120, 14);
      c.fillStyle = acc; c.font = '900 110px sans-serif'; c.textAlign = 'center'; c.fillText('50%', 256, 268);
      c.fillStyle = '#1b5fc0'; c.fillRect(40, 420, N - 80, 46);
    } else if (p === 'cal') {
      c.fillStyle = acc; c.fillRect(0, 0, N, 92);
      c.font = '700 34px sans-serif'; c.textAlign = 'center';
      for (i = 0; i < 31; i++) { x = 40 + (i % 7) * 72; y = 150 + Math.floor(i / 7) * 74; c.fillStyle = i % 7 === 0 ? acc : '#2a2a2a'; c.fillText(String(i + 1), x + 18, y + 22); }
      c.strokeStyle = 'rgba(0,0,0,.12)'; for (i = 0; i < 8; i++) { c.beginPath(); c.moveTo(20 + i * 72, 110); c.lineTo(20 + i * 72, N); c.stroke(); }
    } else if (p === 'test') {
      c.strokeStyle = 'rgba(60,110,190,.35)'; for (y = 60; y < N; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(N, y); c.stroke(); }
      lines(c, R, 40, 70, N - 80, N - 90, 34, '#2b2b2b', .6);
      c.strokeStyle = acc === '#ece8de' ? '#d2342a' : acc; c.lineWidth = 6; c.globalAlpha = .8;
      for (i = 0; i < 4; i++) { c.beginPath(); c.arc(70 + R() * 360, 90 + i * 110, 24, 0, 6.28); c.stroke(); }
      c.globalAlpha = 1; c.lineWidth = 1;
    } else if (p === 'fiber') {
      fibers(c, R, 900, shade(base, -.25), .35);
    } else if (p === 'milk') {
      c.fillStyle = acc; c.fillRect(0, 300, N, 120);
      c.fillStyle = '#222'; for (i = 0; i < 9; i++) { c.beginPath(); c.ellipse(R() * N, R() * 280, 20 + R() * 34, 14 + R() * 22, R() * 3, 0, 6.28); c.fill(); }
      c.fillStyle = '#fff'; c.font = '900 64px sans-serif'; c.textAlign = 'center'; c.fillText('MILK', 256, 384);
    } else if (p === 'comic') {
      c.fillStyle = acc; for (y = 0; y < N; y += 16) for (x = (y / 16 % 2) * 8; x < N; x += 16) { c.beginPath(); c.arc(x, y, 4.2, 0, 6.28); c.fill(); }
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 8; c.strokeRect(24, 24, 220, 220); c.strokeRect(268, 24, 220, 464); c.strokeRect(24, 268, 220, 220);
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(134, 120, 80, 52, 0, 0, 6.28); c.fill(); c.lineWidth = 4; c.stroke();
    } else if (p === 'box') {
      c.fillStyle = acc; c.beginPath(); c.moveTo(0, 330); for (x = 0; x <= N; x += 32) c.lineTo(x, 330 + Math.sin(x / 40) * 24); c.lineTo(N, N); c.lineTo(0, N); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(256, 190, 110, 0, 6.28); c.fill();
      c.fillStyle = '#c62f20'; c.beginPath(); c.arc(256, 190, 86, 0, 6.28); c.fill();
    } else if (p === 'book') {
      c.strokeStyle = acc; c.lineWidth = 14; c.strokeRect(34, 34, N - 68, N - 68);
      c.fillStyle = acc; c.fillRect(96, 150, 320, 110);
      c.fillStyle = shade(base, -.3); c.fillRect(140, 190, 232, 30);
    } else if (p === 'dot') {
      c.fillStyle = acc; for (y = 0; y < N + 64; y += 64) for (x = (y / 64 % 2) * 32; x < N + 64; x += 64) { c.beginPath(); c.arc(x, y, 13, 0, 6.28); c.fill(); }
    } else if (p === 'hanji') {
      fibers(c, R, 500, shade(base, -.3), .45);
      for (i = 0; i < 6; i++) { c.fillStyle = ['#d86a7a', '#e2a63a', '#7aa85a'][i % 3]; c.globalAlpha = .55; c.beginPath(); c.ellipse(R() * N, R() * N, 10, 22, R() * 3, 0, 6.28); c.fill(); }
      c.globalAlpha = 1;
    } else if (p === 'kraft') {
      for (y = 0; y < N; y += 14) { c.fillStyle = 'rgba(0,0,0,.10)'; c.fillRect(0, y, N, 5); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, y + 6, N, 3); }
      fibers(c, R, 300, '#5a3a1a', .25);
    } else if (p === 'flower') {
      for (i = 0; i < 26; i++) { x = (i % 5) * 110 + (Math.floor(i / 5) % 2) * 55 + 20; y = Math.floor(i / 5) * 100 + 40; for (j = 0; j < 5; j++) { c.fillStyle = acc; c.beginPath(); c.arc(x + Math.cos(j * 1.256) * 13, y + Math.sin(j * 1.256) * 13, 10, 0, 6.28); c.fill(); } c.fillStyle = '#e8b83a'; c.beginPath(); c.arc(x, y, 7, 0, 6.28); c.fill(); }
    } else if (p === 'gloss') {
      var g = c.createLinearGradient(0, 0, N, N); g.addColorStop(0, base); g.addColorStop(.55, shade(acc, -.2)); g.addColorStop(1, base); c.fillStyle = g; c.fillRect(0, 0, N, N);
      c.fillStyle = 'rgba(255,240,210,.6)'; c.beginPath(); c.arc(330, 170, 70, 0, 6.28); c.fill();
      c.fillStyle = '#fff'; c.font = '900 70px serif'; c.textAlign = 'left'; c.fillText('STAR', 40, 110);
    } else if (p === 'check') {
      c.globalAlpha = .55; c.fillStyle = acc; for (x = 0; x < N; x += 96) { c.fillRect(x, 0, 40, N); c.fillRect(0, x, N, 40); }
      c.globalAlpha = .5; c.fillStyle = '#f1e2a0'; for (x = 64; x < N; x += 96) { c.fillRect(x, 0, 5, N); c.fillRect(0, x, N, 5); } c.globalAlpha = 1;
    } else if (p === 'star') {
      c.fillStyle = acc; for (i = 0; i < 22; i++) star(c, (i * 97) % N + 20, (i * 61 + Math.floor(i / 5) * 37) % N + 20, 16 + R() * 18, 5);
    }
  }
  // 금테·특수 딱지 무늬
  function special(c, t, base, acc, R) {
    var p = t.pat, i, g, x, y;
    if (p === 'foil' || p === 'king') {
      // 구겨진 금속: 삼각 면마다 밝기가 다르다
      c.fillStyle = base; c.fillRect(0, 0, N, N);
      for (i = 0; i < 180; i++) {
        x = R() * N; y = R() * N; var s = 30 + R() * 60, k = R() * .7 - .35;
        c.fillStyle = shade(k < 0 ? acc : base, k < 0 ? k * .6 : k); c.globalAlpha = .55;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * (R() - .3), y + s * R()); c.lineTo(x + s * R(), y - s * (R() - .3)); c.fill();
      }
      c.globalAlpha = 1;
      if (p === 'king') {
        c.fillStyle = '#9a5a06'; c.beginPath(); c.moveTo(126, 330); c.lineTo(110, 170); c.lineTo(190, 240); c.lineTo(256, 140); c.lineTo(322, 240); c.lineTo(402, 170); c.lineTo(386, 330); c.closePath(); c.fill();
        c.fillStyle = '#fff3c0'; c.beginPath(); c.moveTo(136, 318); c.lineTo(124, 194); c.lineTo(190, 254); c.lineTo(256, 160); c.lineTo(322, 254); c.lineTo(388, 194); c.lineTo(376, 318); c.closePath(); c.fill();
        c.fillStyle = '#c8322a'; [190, 256, 322].forEach(function (cx) { c.beginPath(); c.arc(cx, 290, 13, 0, 6.28); c.fill(); });
      }
    } else if (p === 'rim') {
      c.fillStyle = base; c.fillRect(0, 0, N, N);
      c.strokeStyle = acc; c.lineWidth = 26; c.strokeRect(20, 20, N - 40, N - 40);
      c.lineWidth = 6; c.strokeRect(54, 54, N - 108, N - 108);
      c.fillStyle = acc; star(c, 256, 262, 120, 5);
    } else if (p === 'dino') {
      c.fillStyle = base; c.fillRect(0, 0, N, N);
      c.fillStyle = shade(base, -.25); for (i = 0; i < 40; i++) { c.beginPath(); c.arc(R() * N, R() * N, 6 + R() * 10, 0, 6.28); c.fill(); }
      c.fillStyle = acc; c.beginPath();
      c.moveTo(80, 400); c.lineTo(150, 300); c.lineTo(190, 210); c.lineTo(250, 150); c.lineTo(340, 140); c.lineTo(400, 170); c.lineTo(410, 215); c.lineTo(350, 222); c.lineTo(360, 246); c.lineTo(310, 250);
      c.lineTo(300, 300); c.lineTo(330, 330); c.lineTo(300, 340); c.lineTo(280, 320); c.lineTo(270, 360); c.lineTo(300, 430); c.lineTo(250, 430); c.lineTo(230, 370); c.lineTo(200, 380); c.lineTo(210, 430); c.lineTo(160, 430); c.lineTo(160, 380); c.closePath(); c.fill();
      c.fillStyle = '#1d1d1d'; c.beginPath(); c.arc(350, 175, 9, 0, 6.28); c.fill();
    } else if (p === 'robot') {
      c.fillStyle = base; c.fillRect(0, 0, N, N);
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; for (x = 0; x < N; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, N); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(N, x); c.stroke(); }
      c.fillStyle = acc; c.fillRect(150, 150, 212, 190); c.fillRect(246, 100, 20, 50); c.beginPath(); c.arc(256, 96, 16, 0, 6.28); c.fill();
      c.fillStyle = '#e8392b'; c.fillRect(186, 200, 46, 40); c.fillRect(280, 200, 46, 40);
      c.fillStyle = '#3a3f4a'; for (i = 0; i < 5; i++) c.fillRect(190 + i * 28, 280, 18, 30);
    } else if (p === 'rainbow') {
      var cols = ['#e84a4a', '#f08a2c', '#f2d23a', '#4fb04a', '#3a8ae8', '#5a4ac8', '#a24ac8'];
      c.fillStyle = '#9fd4f2'; c.fillRect(0, 0, N, N);
      for (i = 0; i < 7; i++) { c.strokeStyle = cols[i]; c.lineWidth = 34; c.beginPath(); c.arc(256, 470, 380 - i * 34, Math.PI, 0); c.stroke(); }
      c.fillStyle = '#fff'; for (i = 0; i < 3; i++) { c.beginPath(); c.arc(90 + i * 40, 440, 40, 0, 6.28); c.fill(); }
    } else if (p === 'glitter') {
      g = c.createLinearGradient(0, 0, N, N); g.addColorStop(0, base); g.addColorStop(1, acc); c.fillStyle = g; c.fillRect(0, 0, N, N);
      for (i = 0; i < 700; i++) { c.fillStyle = 'rgba(255,255,255,' + (R() * .8) + ')'; c.fillRect(R() * N, R() * N, 2 + R() * 3, 2 + R() * 3); }
      c.fillStyle = '#fff'; for (i = 0; i < 8; i++) star(c, R() * N, R() * N, 10 + R() * 10, 4);
    } else if (p === 'carbon') {
      c.fillStyle = base; c.fillRect(0, 0, N, N);
      for (y = 0; y < N; y += 8) for (x = 0; x < N; x += 8) { c.fillStyle = ((x + y) / 8) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.2)'; c.fillRect(x, y, 8, 4); }
      c.strokeStyle = '#c8a04c'; c.lineWidth = 8; c.strokeRect(36, 36, N - 72, N - 72);
    } else return false;
    return true;
  }
  function paperOf(t, base, acc, seed) {
    var cv = document.createElement('canvas'); cv.width = cv.height = N;
    var c = cv.getContext('2d'), R = rnd(seed);
    if (!special(c, t, base, acc, R)) pattern(c, t, base, acc, R);
    if (t.pat === 'solid') fibers(c, R, 400, shade(base, -.3), .18);
    fibers(c, R, 160, '#fff', .08);
    return cv;
  }
  function edgeWear(c, R) {
    // 가장자리 어둡게 + 닳은 귀퉁이
    var g = c.createLinearGradient(0, 0, 0, 1);
    c.save();
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 10; c.strokeRect(5, 5, N - 10, N - 10);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; c.strokeRect(12, 12, N - 24, N - 24);
    c.fillStyle = 'rgba(255,255,255,.25)';
    for (var i = 0; i < 40; i++) { var e = Math.floor(R() * 4), u = R() * N, w = 3 + R() * 8; if (e === 0) c.fillRect(u, 0, w, 3); else if (e === 1) c.fillRect(u, N - 3, w, 3); else if (e === 2) c.fillRect(0, u, 3, w); else c.fillRect(N - 3, u, 3, w); }
    c.restore();
  }
  function front(t) {
    var seed = hash(t.id);
    var cv = document.createElement('canvas'); cv.width = cv.height = N;
    var c = cv.getContext('2d'), R = rnd(seed + 7);
    var pa = paperOf(t, t.a, t.b, seed), pb = (t.rare ? pa : paperOf(t, t.b, t.a, seed + 3));
    var h = N / 2;
    // 네 날개: 위·아래는 A, 왼쪽·오른쪽은 B
    var flaps = [
      { p: pa, pts: [[0, 0], [N, 0], [h, h]], lit: .10 },
      { p: pb, pts: [[N, 0], [N, N], [h, h]], lit: -.02 },
      { p: pa, pts: [[N, N], [0, N], [h, h]], lit: -.12 },
      { p: pb, pts: [[0, N], [0, 0], [h, h]], lit: .04 }
    ];
    if (t.rare) { c.drawImage(pa, 0, 0); }
    flaps.forEach(function (f, k) {
      c.save(); c.beginPath(); c.moveTo(f.pts[0][0], f.pts[0][1]); c.lineTo(f.pts[1][0], f.pts[1][1]); c.lineTo(f.pts[2][0], f.pts[2][1]); c.closePath(); c.clip();
      if (!t.rare) c.drawImage(f.p, 0, 0);
      // 날개마다 빛: 바깥은 밝게, 가운데는 그늘
      var mx = (f.pts[0][0] + f.pts[1][0]) / 2, my = (f.pts[0][1] + f.pts[1][1]) / 2;
      var g = c.createLinearGradient(mx, my, h, h);
      g.addColorStop(0, f.lit > 0 ? 'rgba(255,255,255,' + (f.lit * (t.rare ? .6 : 1)) + ')' : 'rgba(0,0,0,' + (-f.lit * (t.rare ? .6 : 1)) + ')');
      g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (t.rare ? .08 : .2) + ')');
      c.fillStyle = g; c.fillRect(0, 0, N, N);
      // 바람개비 겹침: 날개 한쪽 빗변 따라 다음 날개 밑으로 들어가는 그늘
      var a = f.pts[1], gg = c.createLinearGradient(a[0], a[1], (a[0] + h) / 2 + (f.pts[0][0] - a[0]) * .08, (a[1] + h) / 2 + (f.pts[0][1] - a[1]) * .08);
      c.strokeStyle = 'rgba(0,0,0,' + (t.rare ? .18 : .32) + ')'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(h, h); c.stroke();
      c.restore();
    });
    // 접힌 선: 대각선 둘 + 가운데 겹친 점
    c.strokeStyle = 'rgba(255,255,255,' + (t.rare ? .18 : .35) + ')'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(3, 3); c.lineTo(N - 3, N - 3); c.moveTo(N - 3, 3); c.lineTo(3, N - 3); c.stroke();
    var cg = c.createRadialGradient(h, h, 0, h, h, 46); cg.addColorStop(0, 'rgba(0,0,0,.28)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg; c.fillRect(h - 50, h - 50, 100, 100);
    edgeWear(c, R);
    if (t.rare) { c.strokeStyle = t.rare === 2 ? '#fff1b0' : '#e8c25a'; c.lineWidth = 14; c.strokeRect(10, 10, N - 20, N - 20); }
    return cv;
  }
  function back(t) {
    var seed = hash(t.id);
    var cv = document.createElement('canvas'); cv.width = cv.height = N;
    var c = cv.getContext('2d'), R = rnd(seed + 11);
    var pa = paperOf(t, t.a, t.b, seed), pb = (t.rare ? paperOf(t, t.b, t.a, seed + 5) : paperOf(t, t.b, t.a, seed + 3));
    c.drawImage(pb, 0, 0);
    // 가운데 네모: 다른 종이가 접혀 들어간 자리
    var m = N * .2, s = N - m * 2;
    c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillStyle = '#000'; c.fillRect(m, m, s, s); c.restore();
    c.drawImage(pa, m, m, s, s, m, m, s, s);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; c.strokeRect(m, m, s, s);
    // 바깥 띠를 나눈 접힌 선
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(m, m); c.moveTo(N, 0); c.lineTo(N - m, m); c.moveTo(N, N); c.lineTo(N - m, N - m); c.moveTo(0, N); c.lineTo(m, N - m); c.stroke();
    var g = c.createLinearGradient(0, 0, N, N); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.12)'); c.fillStyle = g; c.fillRect(0, 0, N, N);
    edgeWear(c, R);
    if (t.rare) { c.strokeStyle = t.rare === 2 ? '#fff1b0' : '#e8c25a'; c.lineWidth = 14; c.strokeRect(10, 10, N - 20, N - 20); }
    return cv;
  }
  var cache = {}, thumbs = {};
  function get(t) { return cache[t.id] || (cache[t.id] = { front: front(t), back: back(t), side: shade(t.a, -.35) }); }
  function thumb(t) {
    if (thumbs[t.id]) return thumbs[t.id];
    var cv = document.createElement('canvas'); cv.width = cv.height = 160;
    cv.getContext('2d').drawImage(get(t).front, 0, 0, 160, 160);
    return (thumbs[t.id] = cv.toDataURL('image/jpeg', .86));
  }
  window.DDKPaper = { get: get, thumb: thumb, shade: shade };
})();
