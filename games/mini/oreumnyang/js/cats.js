/* =========================================================
   오름냥 - 고양이 그림 담당
   ---------------------------------------------------------
   기본은 코드로 그린 고양이입니다.
   assets/cats/ 폴더에 cat0.png ~ cat6.png (그리고 cat_rainbow.png)
   를 넣어두면 자동으로 그 그림으로 바뀝니다. (정사각형 투명 png 권장)
   ========================================================= */
(function (global) {
  'use strict';

  var S = 128;            // 내부 렌더 해상도
  var CACHE = {};         // 캐시된 고양이 캔버스
  var IMGS = {};          // 사용자가 넣은 이미지

  var PALETTE = [
    { name: '감귤냥',  body: '#FFC24D', dark: '#E09A24', light: '#FFE0A0', ear: '#FFAFC0', mark: '#D98A18' },
    { name: '동백냥',  body: '#FF93B6', dark: '#E05F8C', light: '#FFCBDC', ear: '#FFD9E6', mark: '#D94D77' },
    { name: '바당냥',  body: '#66C5F5', dark: '#2E92C9', light: '#BFE6FB', ear: '#FFC0D0', mark: '#2380B5' },
    { name: '곶자왈냥',  body: '#63DCB4', dark: '#2FA987', light: '#BDF3E2', ear: '#FFC7D4', mark: '#249273' },
    { name: '별밤냥',  body: '#B49BFF', dark: '#7D63D6', light: '#DDD2FF', ear: '#FFC5DA', mark: '#6E52C9' },
    { name: '노을냥',  body: '#FF7C6A', dark: '#D24C3C', light: '#FFC0B5', ear: '#FFD3C8', mark: '#C43F30' },
    { name: '구름냥',  body: '#E2E8F3', dark: '#A9B4C8', light: '#FFFFFF', ear: '#FFCBD8', mark: '#8F9BB3' }
  ];

  /* ---------------- 부품 그리기 ---------------- */

  function ears(g, p, style) {
    var pairs = [-1, 1];
    for (var i = 0; i < 2; i++) {
      var s = pairs[i];
      g.save();
      g.translate(64 + s * 30, 34);
      g.scale(s, 1);
      g.beginPath();
      if (style === 0) {              // 둥근 귀
        g.moveTo(-15, 14); g.quadraticCurveTo(-9, -18, 15, -6); g.quadraticCurveTo(18, 8, 10, 16);
      } else if (style === 1) {       // 뾰족 귀
        g.moveTo(-16, 16); g.lineTo(2, -22); g.lineTo(18, 12);
      } else if (style === 2) {       // 크고 긴 귀
        g.moveTo(-14, 18); g.lineTo(6, -28); g.lineTo(19, 10);
      } else if (style === 3) {       // 접힌 귀
        g.moveTo(-16, 12); g.quadraticCurveTo(-4, -12, 16, -2); g.quadraticCurveTo(6, 14, -6, 16);
      } else {                        // 표준 세모
        g.moveTo(-15, 15); g.lineTo(1, -19); g.lineTo(17, 11);
      }
      g.closePath();
      g.fillStyle = p.body; g.fill();
      g.strokeStyle = 'rgba(0,0,0,.10)'; g.lineWidth = 2; g.stroke();
      // 귀 안쪽
      g.beginPath();
      g.moveTo(-7, 10); g.lineTo(2, -9); g.lineTo(10, 7); g.closePath();
      g.fillStyle = p.ear; g.fill();
      g.restore();
    }
  }

  function head(g, p) {
    var grd = g.createRadialGradient(52, 46, 6, 64, 66, 50);
    grd.addColorStop(0, p.light);
    grd.addColorStop(0.55, p.body);
    grd.addColorStop(1, p.dark);
    g.beginPath();
    g.ellipse(64, 68, 45, 41, 0, 0, Math.PI * 2);
    g.fillStyle = grd; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2.5; g.stroke();
  }

  function eyes(g, p, kind) {
    var xs = [46, 82], y = 66;
    for (var i = 0; i < 2; i++) {
      var x = xs[i];
      if (kind === 'happy') {                       // ^ ^ 웃는 눈
        g.beginPath();
        g.moveTo(x - 9, y + 3);
        g.quadraticCurveTo(x, y - 10, x + 9, y + 3);
        g.lineWidth = 4; g.strokeStyle = '#3A2B22'; g.lineCap = 'round'; g.stroke();
        continue;
      }
      g.beginPath();
      g.ellipse(x, y, 8.5, 10.5, 0, 0, Math.PI * 2);
      g.fillStyle = '#FFFFFF'; g.fill();
      g.beginPath();
      g.ellipse(x + (i ? -1 : 1), y + 1, 5.4, 7.4, 0, 0, Math.PI * 2);
      g.fillStyle = '#33261F'; g.fill();
      g.beginPath();
      g.arc(x - 2, y - 3, 2.4, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
    }
  }

  function face(g, p) {
    // 볼터치
    g.fillStyle = 'rgba(255,120,150,.30)';
    g.beginPath(); g.ellipse(38, 82, 8, 5.5, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(90, 82, 8, 5.5, 0, 0, Math.PI * 2); g.fill();
    // 코
    g.beginPath();
    g.moveTo(58, 80); g.lineTo(70, 80); g.lineTo(64, 87); g.closePath();
    g.fillStyle = '#FF7E9B'; g.fill();
    // 입 (ω)
    g.strokeStyle = '#4A3529'; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(64, 87);
    g.quadraticCurveTo(58, 96, 52, 89);
    g.moveTo(64, 87);
    g.quadraticCurveTo(70, 96, 76, 89);
    g.stroke();
    // 수염
    g.strokeStyle = 'rgba(70,50,40,.42)'; g.lineWidth = 2;
    [-4, 3].forEach(function (dy) {
      g.beginPath(); g.moveTo(33, 78 + dy * 2); g.lineTo(19, 75 + dy * 3); g.stroke();
      g.beginPath(); g.moveTo(95, 78 + dy * 2); g.lineTo(109, 75 + dy * 3); g.stroke();
    });
  }

  function mark(g, p, idx) {
    g.save();
    g.strokeStyle = p.mark; g.fillStyle = p.mark;
    g.lineWidth = 3.4; g.lineCap = 'round'; g.lineJoin = 'round';
    if (idx === 0) {                       // M 줄무늬
      g.beginPath();
      g.moveTo(52, 46); g.lineTo(58, 38); g.lineTo(64, 46); g.lineTo(70, 38); g.lineTo(76, 46);
      g.stroke();
    } else if (idx === 1) {                // 하트
      g.beginPath();
      g.moveTo(64, 50);
      g.bezierCurveTo(58, 40, 46, 43, 50, 52);
      g.bezierCurveTo(53, 58, 60, 60, 64, 64);
      g.bezierCurveTo(68, 60, 75, 58, 78, 52);
      g.bezierCurveTo(82, 43, 70, 40, 64, 50);
      g.fill();
    } else if (idx === 2) {                // 별
      star(g, 64, 47, 5, 12, 5.4); g.fill();
    } else if (idx === 3) {                // 점 세 개
      [[54, 44], [64, 40], [74, 44]].forEach(function (q) {
        g.beginPath(); g.arc(q[0], q[1], 4, 0, Math.PI * 2); g.fill();
      });
    } else if (idx === 4) {                // 초승달
      g.beginPath();
      g.arc(64, 46, 12, Math.PI * 0.72, Math.PI * 1.9);
      g.arc(69, 44, 11, Math.PI * 1.9, Math.PI * 0.72, true);
      g.closePath(); g.fill();
    } else if (idx === 5) {                // 반창고 X
      g.beginPath();
      g.moveTo(54, 38); g.lineTo(74, 52);
      g.moveTo(74, 38); g.lineTo(54, 52);
      g.stroke();
    } else {                               // 눈꽃
      for (var a = 0; a < 3; a++) {
        var ang = a * Math.PI / 3;
        g.beginPath();
        g.moveTo(64 - Math.cos(ang) * 11, 45 - Math.sin(ang) * 11);
        g.lineTo(64 + Math.cos(ang) * 11, 45 + Math.sin(ang) * 11);
        g.stroke();
      }
    }
    g.restore();
  }

  function star(g, cx, cy, spikes, outer, inner) {
    var rot = -Math.PI / 2, step = Math.PI / spikes;
    g.beginPath();
    g.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    for (var i = 0; i < spikes; i++) {
      rot += step; g.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
      rot += step; g.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    }
    g.closePath();
  }

  /* ---------------- 캐시 만들기 ---------------- */

  var EAR_STYLE = [0, 1, 2, 3, 4, 0, 4];
  var EYE_STYLE = ['normal', 'normal', 'normal', 'happy', 'normal', 'happy', 'normal'];

  function build(idx) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');
    if (idx === 'rainbow') return buildRainbow(cv, g);
    var p = PALETTE[idx];
    ears(g, p, EAR_STYLE[idx]);
    head(g, p);
    mark(g, p, idx);
    eyes(g, p, EYE_STYLE[idx]);
    face(g, p);
    return cv;
  }

  function buildRainbow(cv, g) {
    var p = { body: '#fff', dark: '#ddd', light: '#fff', ear: '#FFD0DE', mark: '#fff' };
    ears(g, p, 4);
    // 무지개 머리
    var grd = g.createLinearGradient(20, 26, 108, 108);
    ['#FF6B6B', '#FFB84D', '#FFE666', '#6FE0B8', '#66C5F5', '#B49BFF', '#FF93B6']
      .forEach(function (c, i, a) { grd.addColorStop(i / (a.length - 1), c); });
    g.beginPath(); g.ellipse(64, 68, 45, 41, 0, 0, Math.PI * 2);
    g.fillStyle = grd; g.fill();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.stroke();
    // 반짝임
    g.fillStyle = 'rgba(255,255,255,.85)';
    star(g, 40, 44, 4, 9, 3); g.fill();
    star(g, 92, 52, 4, 6, 2); g.fill();
    eyes(g, p, 'normal');
    face(g, p);
    return cv;
  }

  function sheet(idx) {
    var key = String(idx);
    if (IMGS[key]) return IMGS[key];
    if (!CACHE[key]) CACHE[key] = build(idx);
    return CACHE[key];
  }

  /* ---------------- 사용자 이미지 불러오기 ----------------
     assets/cats/manifest.json 이 있으면 거기 적힌 것만 읽는다.
     (없는 파일을 헛되이 부르지 않게. 목록은 에셋목록.py 가 만들어 준다)
     목록 파일이 없으면 예전처럼 8장을 하나씩 찾아본다. */
  var IMG_KEYS = ['0', '1', '2', '3', '4', '5', '6', 'rainbow'];
  var IMG_FILES = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'cat_rainbow'];

  function loadOne(key, file, done) {
    var img = new Image();
    img.onload = function () { IMGS[key] = img; done(); };
    img.onerror = done;
    img.src = 'assets/cats/' + file + '.png';
  }

  function tryLoadImages(onDone) {
    function finish() { if (onDone) onDone(); }
    fetch('assets/cats/manifest.json').then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    }).then(function (list) {
      var keys = (list || []).filter(function (k) { return IMG_KEYS.indexOf(k) >= 0; });
      if (!keys.length) { finish(); return; }
      var left = keys.length;
      keys.forEach(function (k) {
        loadOne(k, IMG_FILES[IMG_KEYS.indexOf(k)], function () { if (--left === 0) finish(); });
      });
    }).catch(function () {
      var left = IMG_KEYS.length;
      IMG_KEYS.forEach(function (k, i) {
        loadOne(k, IMG_FILES[i], function () { if (--left === 0) finish(); });
      });
    });
  }

  /* ---------------- 바깥에서 쓰는 그리기 ---------------- */

  /** 고양이 한 마리를 (x,y)를 중심으로 size 크기로 그린다 */
  function draw(g, x, y, size, colorIdx, special, t) {
    var img = sheet(special === 'rainbow' ? 'rainbow' : colorIdx);
    var h = size / 2;
    g.drawImage(img, x - h, y - h, size, size);
    if (special && special !== 'rainbow') drawSpecial(g, x, y, size, special, t || 0);
  }

  function drawSpecial(g, x, y, size, special, t) {
    var h = size / 2;
    g.save();
    if (special === 'row' || special === 'col') {
      g.translate(x, y);
      if (special === 'col') g.rotate(Math.PI / 2);
      var w = size * 0.94, bh = size * 0.30;
      var grd = g.createLinearGradient(-w / 2, 0, w / 2, 0);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.5, 'rgba(255,255,255,.85)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalCompositeOperation = 'overlay';
      g.fillStyle = grd;
      g.fillRect(-w / 2, -bh / 2, w, bh);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(255,255,255,.92)';
      g.strokeStyle = 'rgba(60,40,90,.45)'; g.lineWidth = size * 0.02;
      [-1, 1].forEach(function (s) {
        g.beginPath();
        g.moveTo(s * h * 0.94, 0);
        g.lineTo(s * h * 0.62, -bh * 0.52);
        g.lineTo(s * h * 0.62, bh * 0.52);
        g.closePath(); g.fill(); g.stroke();
      });
    } else if (special === 'bomb') {
      var pulse = 0.5 + 0.5 * Math.sin(t * 0.008);
      g.strokeStyle = 'rgba(255,255,255,' + (0.45 + pulse * 0.5) + ')';
      g.lineWidth = size * 0.055;
      g.setLineDash([size * 0.13, size * 0.09]);
      g.beginPath(); g.arc(x, y, h * 0.86, t * 0.0012, t * 0.0012 + Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.fillStyle = 'rgba(255,110,60,' + (0.55 + pulse * 0.45) + ')';
      g.beginPath(); g.arc(x + h * 0.55, y - h * 0.62, size * 0.075, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  /* ================= 제주 장애물들 ================= */

  /** 오름 - 고양이 밑에 깔린 층. 위에서 터뜨리면 한 겹씩 오른다 */
  function drawOreum(g, x, y, size, layers) {
    var h = size / 2;
    g.save();
    // 칸 바닥 물들이기
    g.fillStyle = layers >= 2 ? 'rgba(120, 90, 60, .42)' : 'rgba(90, 190, 110, .34)';
    g.strokeStyle = layers >= 2 ? 'rgba(210, 170, 120, .85)' : 'rgba(170, 240, 180, .8)';
    g.lineWidth = size * 0.06;
    roundRect(g, x - h + 2, y - h + 2, size - 4, size - 4, size * 0.18);
    g.fill(); g.stroke();

    // 오름 능선 (완만한 봉우리 + 정상 분화구)
    var bw = size * 0.78, bh = size * (layers >= 2 ? 0.52 : 0.42);
    var bx = x - bw / 2, by = y + h - size * 0.14;
    g.beginPath();
    g.moveTo(bx, by);
    g.bezierCurveTo(bx + bw * 0.20, by - bh * 0.95, bx + bw * 0.36, by - bh, bx + bw * 0.5, by - bh);
    g.bezierCurveTo(bx + bw * 0.64, by - bh, bx + bw * 0.80, by - bh * 0.95, bx + bw, by);
    g.closePath();
    var grd = g.createLinearGradient(0, by - bh, 0, by);
    if (layers >= 2) { grd.addColorStop(0, '#8C6A44'); grd.addColorStop(1, '#5E4527'); }
    else             { grd.addColorStop(0, '#7FD08A'); grd.addColorStop(1, '#3E9B5C'); }
    g.fillStyle = grd; g.fill();
    // 분화구 (굼부리)
    g.beginPath();
    g.ellipse(x, by - bh + size * 0.03, bw * 0.15, size * 0.035, 0, 0, Math.PI * 2);
    g.fillStyle = layers >= 2 ? 'rgba(50,34,18,.6)' : 'rgba(30,90,50,.45)';
    g.fill();
    g.restore();
  }

  /** 돌담 - 제주 현무암 담. 옆에서 터뜨리면 무너진다 */
  function drawStoneWall(g, x, y, size, hp) {
    var h = size / 2 - size * 0.04;
    g.save();
    roundRect(g, x - h, y - h, h * 2, h * 2, size * 0.13);
    var grd = g.createLinearGradient(x - h, y - h, x + h, y + h);
    grd.addColorStop(0, hp >= 2 ? '#6E6A66' : '#8B8781');
    grd.addColorStop(1, hp >= 2 ? '#3B3936' : '#57534E');
    g.fillStyle = grd; g.fill();
    g.strokeStyle = 'rgba(20,18,16,.6)'; g.lineWidth = size * 0.045; g.stroke();

    // 돌 쌓인 결 + 현무암 구멍
    g.save();
    roundRect(g, x - h, y - h, h * 2, h * 2, size * 0.13);
    g.clip();
    var rows = [[-0.52, [-0.5, 0.05, 0.55]], [0, [-0.34, 0.22]], [0.52, [-0.55, 0, 0.5]]];
    rows.forEach(function (row) {
      row[1].forEach(function (cx) {
        g.beginPath();
        g.ellipse(x + cx * h, y + row[0] * h, h * 0.36, h * 0.27, 0, 0, Math.PI * 2);
        g.fillStyle = hp >= 2 ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.14)';
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = size * 0.02; g.stroke();
      });
    });
    // 숭숭 뚫린 구멍
    g.fillStyle = 'rgba(0,0,0,.32)';
    [[-0.42, -0.44], [0.3, -0.28], [-0.2, 0.18], [0.46, 0.42], [-0.5, 0.5]].forEach(function (q) {
      g.beginPath(); g.arc(x + q[0] * h, y + q[1] * h, size * 0.028, 0, Math.PI * 2); g.fill();
    });
    g.restore();

    if (hp >= 2) {
      g.fillStyle = 'rgba(255,255,255,.92)';
      g.font = '900 ' + (size * 0.28) + 'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('2', x, y);
    }
    g.restore();
  }

  /** 당근밭 - 고양이가 당근에 파묻혀 못 움직인다. 옆에서 터뜨리면 빠져나온다 */
  function drawCarrot(g, x, y, size) {
    g.save();
    g.translate(x, y);
    [-1, 1].forEach(function (s) {
      g.save();
      g.rotate(s * 0.42);
      g.translate(0, s * size * 0.17);
      // 당근 몸통
      g.beginPath();
      g.moveTo(-size * 0.40, -size * 0.10);
      g.lineTo(-size * 0.40, size * 0.10);
      g.quadraticCurveTo(size * 0.10, size * 0.13, size * 0.42, 0);
      g.quadraticCurveTo(size * 0.10, -size * 0.13, -size * 0.40, -size * 0.10);
      g.closePath();
      var grd = g.createLinearGradient(0, -size * 0.12, 0, size * 0.12);
      grd.addColorStop(0, '#FFA54A');
      grd.addColorStop(1, '#E86A16');
      g.fillStyle = grd; g.fill();
      g.strokeStyle = 'rgba(120,50,0,.5)'; g.lineWidth = size * 0.025; g.stroke();
      // 당근 결
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = size * 0.022;
      [-0.18, 0, 0.18].forEach(function (t) {
        g.beginPath();
        g.moveTo(size * t, -size * 0.075);
        g.lineTo(size * (t - 0.03), size * 0.075);
        g.stroke();
      });
      // 잎
      g.fillStyle = '#3FA95F';
      [-0.5, 0, 0.5].forEach(function (a) {
        g.save();
        g.translate(-size * 0.40, 0);
        g.rotate(a);
        g.beginPath();
        g.ellipse(-size * 0.11, 0, size * 0.12, size * 0.045, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
      g.restore();
    });
    g.restore();
  }

  /** 감귤 - 아래까지 내려보내면 수확 */
  function drawTangerine(g, x, y, size, t) {
    var s = size * 0.74, h = s / 2;
    g.save();
    g.translate(x, y + Math.sin((t || 0) * 0.004) * size * 0.02);
    // 열매
    var grd = g.createRadialGradient(-h * 0.3, -h * 0.35, h * 0.1, 0, 0, h * 1.1);
    grd.addColorStop(0, '#FFD26B');
    grd.addColorStop(0.5, '#FFA22E');
    grd.addColorStop(1, '#E8700F');
    g.beginPath();
    g.ellipse(0, h * 0.06, h * 0.96, h * 0.86, 0, 0, Math.PI * 2);
    g.fillStyle = grd; g.fill();
    g.strokeStyle = 'rgba(150,70,0,.45)'; g.lineWidth = size * 0.03; g.stroke();
    // 껍질 오돌토돌
    g.fillStyle = 'rgba(180,90,10,.22)';
    [[-0.45, -0.2], [-0.1, 0.25], [0.35, -0.05], [0.15, -0.42], [0.5, 0.4], [-0.4, 0.45]].forEach(function (q) {
      g.beginPath(); g.arc(q[0] * h, q[1] * h + h * 0.06, size * 0.022, 0, Math.PI * 2); g.fill();
    });
    // 꼭지 + 잎
    g.fillStyle = '#5A3B1E';
    g.fillRect(-size * 0.022, -h * 0.98, size * 0.044, size * 0.075);
    g.save();
    g.translate(size * 0.02, -h * 0.95);
    g.rotate(-0.45);
    g.beginPath();
    g.ellipse(size * 0.11, 0, size * 0.13, size * 0.055, 0, 0, Math.PI * 2);
    var lg = g.createLinearGradient(0, -size * 0.05, 0, size * 0.05);
    lg.addColorStop(0, '#63C97A'); lg.addColorStop(1, '#2E8C4A');
    g.fillStyle = lg; g.fill();
    g.restore();
    // 반짝
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.beginPath(); g.ellipse(-h * 0.34, -h * 0.34, h * 0.2, h * 0.12, -0.6, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /** UI용 장애물 아이콘 (오름 / 감귤) */
  function iconObstacle(kind, px) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = px * 2;
    cv.style.width = px + 'px'; cv.style.height = px + 'px';
    var g = cv.getContext('2d');
    if (kind === 'oreum') drawOreum(g, px, px, px * 2, 1);
    else if (kind === 'tangerine') drawTangerine(g, px, px, px * 2, 0);
    return cv;
  }

  /** UI용 작은 아이콘 캔버스 */
  function icon(colorIdx, px) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = px * 2;
    cv.style.width = px + 'px'; cv.style.height = px + 'px';
    var g = cv.getContext('2d');
    draw(g, px, px, px * 2, colorIdx, null, 0);
    return cv;
  }

  global.Cats = {
    PALETTE: PALETTE,
    COUNT: PALETTE.length,
    draw: draw,
    drawSpecial: drawSpecial,
    drawOreum: drawOreum,
    drawStoneWall: drawStoneWall,
    drawCarrot: drawCarrot,
    drawTangerine: drawTangerine,
    roundRect: roundRect,
    icon: icon,
    iconObstacle: iconObstacle,
    star: star,
    tryLoadImages: tryLoadImages
  };
})(window);
