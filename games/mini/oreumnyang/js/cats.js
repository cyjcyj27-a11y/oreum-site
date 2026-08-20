/* =========================================================
   오름냥 - 고양이 그림 담당
   ---------------------------------------------------------
   고양이는 assets/cats/ 의 png 그림을 그대로 씍니다.
   (cat0.png ~ cat6.png, cat_rainbow.png / 정사각형 배경 투명)
   예전에는 그림이 없을 때 코드로 고양이를 그렸는데,
   그림을 다 읽기 전 잠깐 그게 먼저 보여서 지웠습니다.
   ========================================================= */
(function (global) {
  'use strict';

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

  /* 별 모양 (밖에서 쓸 수 있게 남겨둔 것) */
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

  function sheet(idx) {
    return IMGS[String(idx)] || null;
  }

  /* 그림 파일을 아직 못 읽었을 때만 잠깐 놓는 민무늬 사탕.
     예전에 코드로 그리던 고양이는 지웠다 — 새 그림이 뜨기 전에 그게 먼저 보였기 때문. */
  function placeholder(g, x, y, size, colorIdx, special) {
    var p = PALETTE[colorIdx] || PALETTE[0];
    var h = size / 2 - size * 0.06;
    var grd = g.createLinearGradient(x - h, y - h, x + h, y + h);
    grd.addColorStop(0, special === 'rainbow' ? '#ffffff' : p.light);
    grd.addColorStop(1, special === 'rainbow' ? '#cfcfcf' : p.dark);
    roundRect(g, x - h, y - h, h * 2, h * 2, size * 0.28);
    g.fillStyle = grd; g.fill();
  }

  /* ---------------- 사용자 이미지 불러오기 ----------------
     assets/cats/manifest.json 이 있으면 거기 적힌 것만 읽는다.
     (없는 파일을 헛되이 부르지 않게. 목록은 에셋목록.py 가 만들어 준다)
     목록 파일이 없으면 예전처럼 8장을 하나씩 찾아본다. */
  /* 고양이 그림을 바꾸면 이 날짜를 올린다.
     안 올리면 예전에 왔던 사람 브라우저가 옛 그림을 계속 쓴다. */
  var CAT_VER = '20260820d';
  /* webp 로 바꿨다. 같은 그림이 png 698KB -> webp 116KB.
     시작화면에 고양이가 늦게 뜨던 게 이 무게 탓이 컸다. */
  var CAT_EXT = '.webp';

  var IMG_KEYS = ['0', '1', '2', '3', '4', '5', '6', 'rainbow'];
  var IMG_FILES = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'cat_rainbow'];

  function loadOne(key, file, done, each) {
    var img = new Image();
    img.onload = function () {
      IMGS[key] = img;
      if (each) each(key);      // 한 장 올 때마다 알려준다 (8장 다 기다리지 않게)
      done();
    };
    img.onerror = done;
    img.src = 'assets/cats/' + file + CAT_EXT + '?v=' + CAT_VER;
  }

  /* onDone  : 8장이 다 왔을 때 한 번
     onEach  : 한 장 올 때마다. 시작화면은 이걸로 그때그때 다시 그린다.
               예전엔 다 올 때까지 기다려서, 그림이 무거워지자 한참 빈 화면이었다. */
  function tryLoadImages(onDone, onEach) {
    function finish() { if (onDone) onDone(); }
    fetch('assets/cats/manifest.json').then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    }).then(function (list) {
      var keys = (list || []).filter(function (k) { return IMG_KEYS.indexOf(k) >= 0; });
      if (!keys.length) { finish(); return; }
      var left = keys.length;
      keys.forEach(function (k) {
        loadOne(k, IMG_FILES[IMG_KEYS.indexOf(k)],
                function () { if (--left === 0) finish(); }, onEach);
      });
    }).catch(function () {
      var left = IMG_KEYS.length;
      IMG_KEYS.forEach(function (k, i) {
        loadOne(k, IMG_FILES[i], function () { if (--left === 0) finish(); }, onEach);
      });
    });
  }

  /* ---------------- 바깥에서 쓰는 그리기 ---------------- */

  /** 고양이 한 마리를 (x,y)를 중심으로 size 크기로 그린다 */
  function draw(g, x, y, size, colorIdx, special, t) {
    var img = sheet(special === 'rainbow' ? 'rainbow' : colorIdx);
    var h = size / 2;
    if (img) g.drawImage(img, x - h, y - h, size, size);
    else placeholder(g, x, y, size, colorIdx, special);
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
    grd.addColorStop(0, hp >= 2 ? '#A9A49C' : '#C4BEB4');
    grd.addColorStop(1, hp >= 2 ? '#736E67' : '#948E85');
    g.fillStyle = grd; g.fill();
    g.strokeStyle = 'rgba(90,80,68,.45)'; g.lineWidth = size * 0.045; g.stroke();

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
        g.strokeStyle = 'rgba(90,80,68,.30)'; g.lineWidth = size * 0.02; g.stroke();
      });
    });
    // 숭숭 뚫린 구멍
    g.fillStyle = 'rgba(80,70,60,.26)';
    [[-0.42, -0.44], [0.3, -0.28], [-0.2, 0.18], [0.46, 0.42], [-0.5, 0.5]].forEach(function (q) {
      g.beginPath(); g.arc(x + q[0] * h, y + q[1] * h, size * 0.028, 0, Math.PI * 2); g.fill();
    });
    g.restore();

    if (hp >= 2) {
      g.fillStyle = 'rgba(60,52,44,.92)';
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

  /* 고양이 이름은 말 담당(i18n)에서 꺼냅니다 */
  function nameOf(i) { return global.T ? global.T('cat.' + i) : PALETTE[i].name; }

  global.Cats = {
    PALETTE: PALETTE,
    nameOf: nameOf,
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
