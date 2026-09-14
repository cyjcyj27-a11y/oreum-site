/* 방귀 뀌기 — 그림. 전부 캔버스 코드로 그린다. 좌표는 가상 1280×720.
 * 카메라는 주인공 등 뒤에 있다. 모두 앞(칠판·문·신랑신부)을 보고 있고, 고개를 돌리면 얼굴이 보인다.
 * window.ART = { bg, person, behind, front, player, puff, bubble, LOCS }
 */
(function () {
  'use strict';

  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 6.2832); }
  function mix(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = ((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k;
    var gg = ((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k;
    var bl = (pa & 255) * (1 - k) + (pb & 255) * k;
    return 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (bl | 0) + ')';
  }
  // 같은 모양이 매번 나오게 하는 난수
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ───────────────────────── 사람 ─────────────────────────
  // p: {x,y,s,type:'stand'|'seat', L(0 뒤통수 ~ 1 정면), dir(±1), mood, skin, hair, style, shirt, pants, dress, arm}
  // 머리를 공으로 보고 돌린다. yaw 0 = 정면, ±π = 뒤통수.
  // 경도 lon 에 있는 점은 화면에서 x + r·sin(lon) 에 보이고, cos(lon) > 0 일 때만 앞면이다.
  function head(g, x, y, r, p, t) {
    var L = p.L, d = p.dir || 1, mood = p.mood || 'look';
    var yaw = d * (1 - L) * Math.PI;
    var S = function (lon) { return Math.sin(lon + yaw); }, C = function (lon) { return Math.cos(lon + yaw); };
    var earCol = mix(p.skin, '#b0664a', 0.15);

    // 번 머리(뒤쪽 위) — 앞을 볼 땐 머리 뒤에 가려진다
    var bunBehind = C(Math.PI) < 0;
    function bun() { g.fillStyle = p.hair; circ(g, x + r * 0.5 * S(Math.PI), y - r * 0.82, r * 0.38); g.fill(); }
    if (p.style === 'bun' && bunBehind) bun();
    // 옆으로 튀어나온 귀(머리 뒤)
    [-Math.PI / 2, Math.PI / 2].forEach(function (lon) {
      if (Math.abs(S(lon)) > 0.7) { g.fillStyle = earCol; g.beginPath(); g.ellipse(x + r * 0.96 * S(lon), y + r * 0.1, r * 0.2 * Math.abs(S(lon)), r * 0.24, 0, 0, 6.2832); g.fill(); }
    });

    // 머리 전체를 머리카락색으로 칠하고, 얼굴 면만 살색으로 드러낸다
    g.fillStyle = p.hair; circ(g, x, y, r); g.fill();
    g.save(); circ(g, x, y, r); g.clip();

    // 얼굴 면: 경도 -65°~+65°
    var E = 1.13, x1 = 9, x2 = -9;
    for (var q = 0; q <= 24; q++) {                        // 얼굴 면을 훑어 앞면에 있는 부분의 좌우 끝을 찾는다
      var lq = -E + 2 * E * q / 24;
      if (C(lq) >= 0) { x1 = Math.min(x1, S(lq)); x2 = Math.max(x2, S(lq)); }
    }
    if (x2 - x1 > 0.04) {
      var cx = x + r * (x1 + x2) / 2, rx = r * (x2 - x1) / 2;
      g.fillStyle = p.skin;
      g.beginPath(); g.ellipse(cx, y + r * 0.3, rx * 1.02, r * 0.95, 0, 0, 6.2832); g.fill();
      if (mood === 'ew') { g.fillStyle = 'rgba(130,200,70,.3)'; g.beginPath(); g.ellipse(cx, y + r * 0.3, rx, r * 0.95, 0, 0, 6.2832); g.fill(); }
      // 앞머리: 이마를 덮는 둥근 술 세 개
      g.fillStyle = p.hair;
      g.fillRect(x - r, y - r * 1.2, r * 2, r * 0.9);
      [-0.55, 0, 0.55].forEach(function (lon) {
        if (C(lon) > -0.1) { g.beginPath(); g.ellipse(x + r * S(lon), y - r * 0.3, r * 0.34 * Math.max(0.2, C(lon)), r * 0.2, 0, 0, 6.2832); g.fill(); }
      });
    }

    // 눈·볼·입 — 앞면일 때만
    function feat(lon, draw) { var c = C(lon); if (c > 0.12 && x2 - x1 > 0.04) draw(x + r * 0.92 * S(lon), c); }
    [-0.62, 0.62].forEach(function (lon) {
      feat(lon, function (fx, c) { g.fillStyle = 'rgba(255,110,110,.35)'; g.beginPath(); g.ellipse(fx, y + r * 0.42, r * 0.16 * c, r * 0.11, 0, 0, 6.2832); g.fill(); });
    });
    [-0.36, 0.36].forEach(function (lon, k) {
      feat(lon, function (fx, c) {
        var ey = y + r * 0.12;
        g.lineCap = 'round';
        if (mood === 'ew') {                                      // > <
          var s = k ? -1 : 1;
          g.strokeStyle = '#2b2118'; g.lineWidth = r * 0.08;
          g.beginPath(); g.moveTo(fx - s * r * 0.11 * c, ey - r * 0.1); g.lineTo(fx + s * r * 0.07 * c, ey); g.lineTo(fx - s * r * 0.11 * c, ey + r * 0.1); g.stroke();
        } else if (mood === 'shock') {                            // 동그랗게 뜬 눈
          g.fillStyle = '#fff'; g.strokeStyle = '#2b2118'; g.lineWidth = r * 0.05;
          g.beginPath(); g.ellipse(fx, ey, r * 0.16 * c, r * 0.19, 0, 0, 6.2832); g.fill(); g.stroke();
          g.fillStyle = '#2b2118'; circ(g, fx, ey + r * 0.02, r * 0.06); g.fill();
        } else {                                                  // 까만 콩눈 + 반짝
          g.fillStyle = '#2b2118'; g.beginPath(); g.ellipse(fx, ey, r * 0.1 * c, r * 0.14, 0, 0, 6.2832); g.fill();
          g.fillStyle = '#fff'; circ(g, fx - r * 0.03 * c, ey - r * 0.05, r * 0.035); g.fill();
        }
      });
    });
    feat(0, function (fx, c) {
      g.strokeStyle = '#7a3326'; g.fillStyle = '#7a3326'; g.lineWidth = r * 0.06; g.lineCap = 'round';
      var my = y + r * 0.52;
      if (mood === 'shock') { g.beginPath(); g.ellipse(fx, my, r * 0.09 * c, r * 0.12, 0, 0, 6.2832); g.fill(); }
      else if (mood === 'ew') {
        g.beginPath();
        for (var i = 0; i <= 6; i++) { var mx = fx + (i / 6 - 0.5) * r * 0.36 * c, yy = my + (i % 2 ? -1 : 1) * r * 0.035; if (i) g.lineTo(mx, yy); else g.moveTo(mx, yy); }
        g.stroke();
      } else { g.beginPath(); g.arc(fx, my - r * 0.06, r * 0.1, 0.5, Math.PI - 0.5); g.stroke(); }
    });
    g.restore();

    // 앞쪽으로 돌아온 귀(옆얼굴일 때 볼 옆에 붙는 귀)
    [-Math.PI / 2, Math.PI / 2].forEach(function (lon) {
      if (Math.abs(S(lon)) <= 0.7 && C(lon) > 0 && x2 - x1 > 0.3) { g.fillStyle = earCol; g.beginPath(); g.ellipse(x + r * 0.9 * S(lon), y + r * 0.12, r * 0.13, r * 0.2, 0, 0, 6.2832); g.fill(); }
    });
    // 긴 머리 뒷모습에 머리 테두리를 그으면 머리카락이 두 덩어리로 갈라져 보인다
    if (!((p.style === 'long' || p.style === 'veil') && x2 - x1 <= 0.3)) { g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 3; circ(g, x, y, r); g.stroke(); }
    if (p.style === 'bun' && !bunBehind) bun();

    // 코 막고 찡그림: 초록 냄새 줄
    if (mood === 'ew' && L > 0.6) {
      g.strokeStyle = 'rgba(110,170,40,.85)'; g.lineWidth = r * 0.07; g.lineCap = 'round';
      for (var k = 0; k < 3; k++) {
        var sx = x + (k - 1) * r * 0.5, ph = (t * 1.5 + k * 0.33) % 1, sy = y - r * 1.15 - ph * r * 0.5;
        g.globalAlpha = 1 - ph;
        g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + r * 0.15, sy - r * 0.18, sx, sy - r * 0.36); g.quadraticCurveTo(sx - r * 0.15, sy - r * 0.54, sx, sy - r * 0.7); g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (p.style === 'veil') {
      g.fillStyle = '#fff'; circ(g, x + r * 0.5 * S(Math.PI), y - r * 0.85, r * 0.22); g.fill();
      if (L < 0.6) {
        g.fillStyle = 'rgba(255,255,255,.7)';
        g.beginPath(); g.moveTo(x - r * 0.8, y - r * 0.75); g.quadraticCurveTo(x, y - r * 1.3, x + r * 0.8, y - r * 0.75);
        g.lineTo(x + r * 1.2, y + r * 2.4); g.lineTo(x - r * 1.2, y + r * 2.4); g.closePath(); g.fill();
      }
    }
  }

  // 몸도 머리를 따라 돈다. 머리가 먼저 돌고 몸이 조금 늦게 따라온다(머리만 180도 돌면 목이 꺾여 엑소시스트처럼 보인다)
  function person(g, p, t) {
    g.save(); g.translate(p.x, p.y); g.scale(p.s, p.s);
    var r = 52, d = p.dir || 1;
    var Lb = p.L;                                             // 머리·몸·머리카락이 한 몸으로 같은 각도로 돈다
    var yb = d * (1 - Lb) * Math.PI, cB = Math.cos(yb), sB = Math.sin(yb);
    var hw = 60 * (0.68 + 0.32 * Math.abs(cB));              // 옆으로 서면 몸이 얇아진다
    var stand = p.type === 'stand';
    var top = stand ? -300 : -168, hy = stand ? -334 : -202, th = stand ? 175 : 200;
    var longHair = p.style === 'long' || p.style === 'veil';
    // 긴 머리: 네모 덩어리가 아니라, 머리 옆에서 흘러내려 어깨에서 살짝 퍼지고 끝이 뾰족뾰족 갈라진 모양
    function hairPanel() {
      var ox = -sB * 26, w = 48 * (0.72 + 0.28 * Math.abs(cB)), yb = hy + 100, n = 6;   // 옆으로 돌면 뒤통수 쪽으로 붙는다
      g.save(); g.translate(ox, 0);
      g.fillStyle = p.hair;
      g.beginPath(); g.arc(0, hy + 4, w, Math.PI, 0);                  // 윗부분은 둥글게(뒤통수 머리숱)
      g.bezierCurveTo(w + 4, hy + 40, w + 14, hy + 70, w + 6, yb - 6);
      for (var i = n - 1; i >= 0; i--) {
        var xa = -w - 6 + (2 * w + 12) * i / n, xb = -w - 6 + (2 * w + 12) * (i + 1) / n;
        var tip = yb + 10 - Math.abs(i + 0.5 - n / 2) * 4;            // 가운데가 조금 더 길다
        g.lineTo((xa + xb) / 2, tip); g.lineTo(xa, yb - 6);
      }
      g.bezierCurveTo(-w - 14, hy + 70, -w - 4, hy + 40, -w, hy + 4);
      g.closePath(); g.fill();
      g.strokeStyle = mix(p.hair, '#000000', 0.22); g.lineWidth = 3; g.lineCap = 'round';   // 머리카락 결
      [[-22, -26], [0, 0], [22, 26]].forEach(function (q) {
        g.beginPath(); g.moveTo(q[0], hy + 52); g.quadraticCurveTo((q[0] + q[1]) / 2 + 4, hy + 78, q[1], yb - 2); g.stroke();
      });
      g.restore(); g.lineWidth = 28;
    }

    if (stand) {
      if (p.dress) {
        g.fillStyle = p.pants;
        g.beginPath(); g.moveTo(-50, -170); g.lineTo(50, -170); g.lineTo(88, 0); g.lineTo(-88, 0); g.closePath(); g.fill();
      } else {
        var lw = 44 * (0.55 + 0.45 * Math.abs(cB));
        g.fillStyle = p.pants;
        rr(g, -lw, -140, 38, 140, 14); g.fill(); rr(g, lw - 38, -140, 38, 140, 14); g.fill();
        g.fillStyle = '#2b2622'; rr(g, -lw - 4, -14, 46, 18, 8); g.fill(); rr(g, lw - 42, -14, 46, 18, 8); g.fill();
      }
    }
    if (longHair && cB > 0) hairPanel();                     // 앞을 보면 긴 머리는 몸 뒤로

    // 팔: 어깨는 경도 ±90° 자리. 뒤로 넘어간 팔은 몸보다 먼저 그린다
    var raise = p.arm === 'up' && p.L < 0.35;
    g.lineCap = 'round'; g.lineWidth = 28;
    function arm(side) {
      var ax = side * cB * hw, bx = ax * 1.12;                // 어깨 x · 손 x
      g.strokeStyle = p.shirt;
      if (stand) {
        g.beginPath(); g.moveTo(ax * 0.85, top + 26); g.lineTo(bx, top + 150); g.stroke();
        g.fillStyle = p.skin; circ(g, bx, top + 160, 15); g.fill();
      } else {
        g.beginPath(); g.moveTo(ax * 0.85, top + 26); g.lineTo(bx * 1.05, top + 120); g.stroke();
      }
    }
    var zR = -sB, zL = sB;                                     // 오른팔(side 1)·왼팔(side -1)의 앞뒤
    if (!raise) {
      if (zR < -0.3) arm(1);
      if (zL < -0.3) arm(-1);
    }

    g.fillStyle = p.shirt; rr(g, -hw, top, hw * 2, th, 36); g.fill();
    // 앞모습: 옷깃·단추가 가운데 줄에 보인다
    if (cB > 0.15) {
      var fx = sB * hw * 0.8;                                  // 몸 앞 가운데 줄
      g.globalAlpha = Math.min(1, (cB - 0.15) * 2);
      g.fillStyle = p.collar || 'rgba(0,0,0,.14)';
      g.beginPath(); g.moveTo(fx - 26 * cB, top + 8); g.lineTo(fx, top + 42); g.lineTo(fx + 26 * cB, top + 8); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.22)';
      circ(g, fx, top + 70, 5); g.fill(); circ(g, fx, top + 105, 5); g.fill();
      g.globalAlpha = 1;
    }

    if (raise) {
      var wx = 88 + Math.sin(t * 11) * 7, wy = top - 70 + Math.cos(t * 7) * 6;
      g.strokeStyle = p.shirt;
      g.beginPath(); g.moveTo(-50, top + 26); g.lineTo(-62, top + 130); g.stroke();
      g.beginPath(); g.moveTo(48, top + 24); g.lineTo(wx, wy); g.stroke();
      g.fillStyle = p.skin; circ(g, wx + 4, wy - 12, 16); g.fill();
      if (stand) { circ(g, -63, top + 140, 15); g.fill(); }
    } else {
      if (zR >= -0.3) arm(1);
      if (zL >= -0.3) arm(-1);
    }

    // 머리 밑 그림자·긴 머리(뒷모습)
    g.fillStyle = 'rgba(0,0,0,.13)'; g.beginPath(); g.ellipse(0, top + 16, hw * 0.76, 14, 0, 0, 6.2832); g.fill();
    if (longHair && cB <= 0) hairPanel();
    head(g, 0, hy, r, p, t);
    g.restore();
  }
  // 머리 꼭대기(말풍선 자리)
  person.top = function (p) { return { x: p.x, y: p.y + (p.type === 'stand' ? -334 - 52 - 40 : -202 - 52 - 40) * p.s }; };

  // ───────────────────────── 주인공(뒷모습) ─────────────────────────
  // P: {x,y,s,g, farting, state, shake}
  function player(g, P, t) {
    var k = P.g, inf = 1 + k * 0.16;
    var sx = P.shake ? (Math.sin(t * 57) * P.shake) : 0;
    var by = P.farting ? Math.sin(t * 38) * 3 : 0;
    if (P.state === 'caught') by = 8;
    g.save(); g.translate(P.x + sx, P.y + by); g.scale(P.s, P.s);
    var skin = '#f4c7a1', hot = mix(skin, '#ff3b2f', Math.max(0, (k - 0.35) / 0.65));
    if (P.state === 'caught') hot = '#ff3b2f';
    if (P.state === 'relief') hot = skin;
    // 의자
    g.fillStyle = '#7a5a3c'; rr(g, -95, 22, 190, 26, 10); g.fill();
    // 몸
    var shirt = '#ffcf33';
    g.fillStyle = shirt; rr(g, -64 * inf, -168, 128 * inf, 200, 44); g.fill();
    g.fillStyle = 'rgba(0,0,0,.06)'; rr(g, -64 * inf, -40, 128 * inf, 20, 6); g.fill();
    g.strokeStyle = '#3c8fd9'; g.lineWidth = 12;                 // 멜빵
    g.beginPath(); g.moveTo(-34, -164); g.lineTo(-28 * inf, 30); g.moveTo(34, -164); g.lineTo(28 * inf, 30); g.stroke();
    g.lineCap = 'round'; g.lineWidth = 30; g.strokeStyle = shirt;
    var sh = P.state === 'relief' || P.farting ? 8 : 0;
    g.beginPath(); g.moveTo(-54 * inf, -140 + sh); g.lineTo(-78 * inf, -30); g.stroke();
    g.beginPath(); g.moveTo(54 * inf, -140 + sh); g.lineTo(78 * inf, -30); g.stroke();
    // 귀·머리 — 목은 안 보이게 머리를 어깨에 얹는다
    var hy = -198 + sh;
    g.fillStyle = 'rgba(0,0,0,.13)'; g.beginPath(); g.ellipse(0, -156 + sh, 48, 14, 0, 0, 6.2832); g.fill();
    g.fillStyle = hot; circ(g, -54, hy + 6, 13); g.fill(); circ(g, 54, hy + 6, 13); g.fill();
    g.fillStyle = skin; circ(g, 0, hy, 54); g.fill();
    g.fillStyle = '#2a211c'; circ(g, 0, hy - 3, 55); g.fill();
    g.save(); circ(g, 0, hy, 54); g.clip(); g.fillStyle = hot; g.beginPath(); g.ellipse(0, hy + 52, 26, 14, 0, 0, 6.2832); g.fill(); g.restore();
    g.beginPath(); g.moveTo(-8, hy - 54); g.lineTo(4, hy - 78); g.lineTo(10, hy - 52); g.closePath(); g.fill();   // 뻗친 머리
    g.beginPath(); g.moveTo(8, hy - 52); g.lineTo(26, hy - 70); g.lineTo(22, hy - 46); g.closePath(); g.fill();
    g.strokeStyle = '#4a3a30'; g.lineWidth = 3;                   // 가마
    g.beginPath(); g.arc(6, hy - 14, 10, 0, 4.4); g.stroke();
    // 뜨거운 김
    if (k > 0.82 && P.state === 'play') {
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 5;
      for (var i = 0; i < 3; i++) {
        var ph = (t * 1.6 + i / 3) % 1, xx = -40 + i * 40;
        g.globalAlpha = 1 - ph;
        g.beginPath(); g.moveTo(xx, hy - 70 - ph * 60);
        g.quadraticCurveTo(xx + 12, hy - 85 - ph * 60, xx, hy - 100 - ph * 60); g.stroke();
      }
      g.globalAlpha = 1;
    }
    g.restore();
  }

  // 방귀 구름 한 덩이
  function puff(g, q) {
    var a = Math.max(0, 1 - q.age / q.life);
    g.globalAlpha = a * (q.big ? 0.8 : 0.62);
    g.fillStyle = q.col;
    circ(g, q.x, q.y, q.r); g.fill();
    g.globalAlpha = a * 0.35; g.fillStyle = '#fffbe0';
    circ(g, q.x - q.r * 0.3, q.y - q.r * 0.3, q.r * 0.45); g.fill();
    g.globalAlpha = 1;
  }

  // "?" (고개 돌리려 함) / "!" (들킴)
  function bubble(g, x, y, ch, k) {
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = ch === '!' ? '#ff4d4d' : '#ffe066';
    g.strokeStyle = '#3a2a10'; g.lineWidth = 5;
    circ(g, 0, 0, 30); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-8, 24); g.lineTo(0, 44); g.lineTo(8, 24); g.closePath(); g.fill();
    g.fillStyle = '#3a2a10'; g.font = '900 42px Ria, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, 0, 3);
    g.restore();
  }

  // ───────────────────────── 장소 ─────────────────────────
  // info: {prog 0~1 (시간 흐름), t}
  var BOOKS = (function () {
    var R = seeded(7), out = [], cols = ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400', '#34495e', '#e84393'];
    for (var i = 0; i < 400; i++) out.push({ w: 12 + R() * 16, h: 0.7 + R() * 0.28, c: cols[(R() * cols.length) | 0] });
    return out;
  })();
  function shelf(g, x, y, w, h, rows, seed) {
    g.fillStyle = '#6b4426'; g.fillRect(x, y, w, h);
    g.fillStyle = '#4e2f18'; g.fillRect(x + 10, y + 10, w - 20, h - 20);
    var rh = (h - 20) / rows, bi = seed;
    for (var r = 0; r < rows; r++) {
      var bx = x + 14, base = y + 10 + rh * (r + 1) - 8;
      while (true) {
        var b = BOOKS[bi++ % BOOKS.length];
        if (bx + b.w > x + w - 14) break;
        g.fillStyle = b.c; g.fillRect(bx, base - (rh - 16) * b.h, b.w - 2, (rh - 16) * b.h);
        bx += b.w;
      }
      g.fillStyle = '#6b4426'; g.fillRect(x + 10, base, w - 20, 8);
    }
  }
  function wall(g, col, floorY, floorCol) {
    g.fillStyle = col; g.fillRect(-3000, -3000, 7280, 7000);
    g.fillStyle = floorCol; g.fillRect(-3000, floorY, 7280, 3000);
  }

  var BG = {
    class: function (g, info) {
      var t = info.t;
      wall(g, '#e8eed6', 470, '#c9965e');
      g.fillStyle = '#d3ddbd'; g.fillRect(-3000, 400, 7280, 70);
      g.strokeStyle = 'rgba(90,50,20,.25)'; g.lineWidth = 3;
      for (var y = 500; y < 760; y += 42) { g.beginPath(); g.moveTo(-3000, y); g.lineTo(4280, y); g.stroke(); }
      // 창문
      g.fillStyle = '#fff'; g.fillRect(34, 104, 222, 232);
      g.fillStyle = '#bfe6ff'; g.fillRect(44, 114, 202, 212);
      g.fillStyle = '#fff'; circ(g, 90 + (t * 6) % 200, 170, 22); g.fill(); circ(g, 116 + (t * 6) % 200, 164, 28); g.fill();
      g.fillStyle = '#fff'; g.fillRect(142, 114, 8, 212); g.fillRect(44, 214, 202, 8);
      // 칠판 + 분필 글
      g.fillStyle = '#8a5a32'; g.fillRect(346, 56, 588, 250);
      g.fillStyle = '#2e5e45'; g.fillRect(360, 70, 560, 222);
      g.strokeStyle = 'rgba(255,255,255,.82)'; g.lineWidth = 4; g.lineCap = 'round';
      for (var k = 0; k < 4; k++) {
        var len = Math.max(0, Math.min(1, info.prog * 4.4 - k)) * 470;
        if (len < 2) continue;
        g.beginPath();
        for (var s = 0; s <= len; s += 6) {
          var yy = 104 + k * 50 + Math.sin(s * 0.19 + k) * 9 + Math.sin(s * 0.53) * 4;
          if (s) g.lineTo(390 + s, yy); else g.moveTo(390 + s, yy);
        }
        g.stroke();
      }
      g.fillStyle = '#6b4426'; g.fillRect(360, 292, 560, 12);
      // 시계
      g.fillStyle = '#fff'; g.strokeStyle = '#555'; g.lineWidth = 6; circ(g, 1100, 118, 46); g.fill(); g.stroke();
      g.strokeStyle = '#333'; g.lineWidth = 5;
      var a = -Math.PI / 2 + info.prog * Math.PI * 2;
      g.beginPath(); g.moveTo(1100, 118); g.lineTo(1100 + Math.cos(a) * 34, 118 + Math.sin(a) * 34); g.stroke();
      g.beginPath(); g.moveTo(1100, 118); g.lineTo(1100 + 20 * Math.cos(-2.3), 118 + 20 * Math.sin(-2.3)); g.stroke();
      // 게시판
      g.fillStyle = '#b98a57'; g.fillRect(1000, 200, 220, 150);
      ['#ff9aa2', '#b5ead7', '#ffdac1', '#c7ceea'].forEach(function (c, i) { g.fillStyle = c; g.fillRect(1014 + (i % 2) * 104, 214 + ((i / 2) | 0) * 68, 90, 56); });
      // 주인공 책상
      g.fillStyle = '#d9a86c'; g.fillRect(440, 600, 400, 26); g.fillStyle = '#9a6a3a'; g.fillRect(440, 626, 400, 10);
    },
    library: function (g, info) {
      wall(g, '#e6d3b3', 460, '#9c5a4e');
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 4;
      for (var y = 490; y < 760; y += 34) { g.beginPath(); g.moveTo(-3000, y); g.lineTo(4280, y); g.stroke(); }
      shelf(g, -200, 40, 560, 420, 4, 0);
      shelf(g, 920, 40, 560, 420, 4, 120);
      shelf(g, 440, 80, 400, 380, 4, 260);
      g.fillStyle = '#d9a86c'; g.fillRect(440, 600, 400, 26); g.fillStyle = '#9a6a3a'; g.fillRect(440, 626, 400, 10);
      g.fillStyle = '#f5f0e0'; g.fillRect(500, 590, 90, 14); g.fillRect(690, 588, 70, 16);
    },
    elevator: function (g, info) {
      wall(g, '#9aa3ab', 600, '#5d6166');
      g.fillStyle = '#c5ccd2'; g.fillRect(300, 30, 680, 570);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
      for (var x = 310; x < 980; x += 14) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, 600); g.stroke(); }
      g.fillStyle = '#8d959c'; g.fillRect(426, 100, 428, 500);
      g.fillStyle = '#dfe4e8'; g.fillRect(440, 112, 198, 488); g.fillRect(642, 112, 198, 488);
      g.fillStyle = '#7c848b'; g.fillRect(637, 112, 6, 488);
      // 층 표시
      var fl = 1 + Math.floor(info.prog * 14);
      g.fillStyle = '#111'; rr(g, 560, 40, 160, 50, 8); g.fill();
      g.fillStyle = '#ff3b30'; g.font = '900 38px Ria, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('▲ ' + fl, 640, 67);
      // 옆벽
      g.fillStyle = '#8a939b';
      g.beginPath(); g.moveTo(-3000, -3000); g.lineTo(300, -3000); g.lineTo(300, 600); g.lineTo(-3000, 900); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(980, -3000); g.lineTo(4280, -3000); g.lineTo(4280, 900); g.lineTo(980, 600); g.closePath(); g.fill();
      g.strokeStyle = '#c9cfd4'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(40, 440); g.lineTo(300, 420); g.moveTo(980, 420); g.lineTo(1240, 440); g.stroke();
      g.fillStyle = '#555c63'; rr(g, 1040, 220, 60, 150, 8); g.fill();
      g.fillStyle = '#ffd24a'; for (var i = 0; i < 5; i++) { circ(g, 1070, 244 + i * 26, 8); g.fill(); }
    },
    bus: function (g, info) {
      var t = info.t;
      wall(g, '#e4e2d6', 470, '#7b7f86');
      g.fillStyle = '#d0cfc6'; g.fillRect(-3000, -3000, 7280, 3060);
      // 창밖 풍경이 흘러간다
      g.save();
      g.beginPath(); g.rect(-3000, 80, 7280, 220); g.clip();
      g.fillStyle = '#9fd8ff'; g.fillRect(-3000, 80, 7280, 220);
      var off = (t * 260) % 900;
      g.fillStyle = '#7cc26a';
      for (var i = -3; i < 6; i++) { circ(g, i * 300 - off * 0.5 + 900, 330, 150); g.fill(); }
      g.fillStyle = '#4f9a48';
      for (i = -4; i < 8; i++) { circ(g, i * 220 - off + 900, 300, 44); g.fill(); g.fillRect(i * 220 - off + 896, 300, 8, 40); }
      g.fillStyle = '#6a6a6a';
      for (i = -4; i < 8; i++) g.fillRect(i * 450 - (t * 520) % 450 + 900, 110, 10, 200);
      g.restore();
      g.fillStyle = '#e4e2d6';
      for (i = -8; i < 12; i++) g.fillRect(i * 230 - 10, 80, 24, 220);
      g.fillStyle = '#c9c7bb'; g.fillRect(-3000, 296, 7280, 16);
      // 손잡이
      g.strokeStyle = '#b8b8b8'; g.lineWidth = 10; g.beginPath(); g.moveTo(-3000, 40); g.lineTo(4280, 40); g.stroke();
      for (i = 0; i < 7; i++) {
        var hx = 120 + i * 180, sw = Math.sin(t * 2 + i) * 0.12;
        g.save(); g.translate(hx, 40); g.rotate(sw);
        g.strokeStyle = '#4b7bd1'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 44); g.stroke();
        g.strokeStyle = '#eee'; g.lineWidth = 7; circ(g, 0, 60, 16); g.stroke();
        g.restore();
      }
      g.fillStyle = '#5b7fc7'; rr(g, 470, 590, 340, 40, 12); g.fill();
    },
    wedding: function (g, info) {
      wall(g, '#f7eef0', 470, '#efe4d6');
      g.fillStyle = '#f0dde2'; for (var x = -40; x < 1320; x += 180) g.fillRect(x, 0, 60, 470);
      // 붉은 길
      g.fillStyle = '#c0392b';
      g.beginPath(); g.moveTo(596, 470); g.lineTo(684, 470); g.lineTo(840, 760); g.lineTo(440, 760); g.closePath(); g.fill();
      // 꽃 아치
      g.strokeStyle = '#6aa84f'; g.lineWidth = 16;
      g.beginPath(); g.moveTo(500, 480); g.bezierCurveTo(500, 100, 780, 100, 780, 480); g.stroke();
      var fl = ['#ff8fb1', '#fff', '#ffc2d4', '#ff6f91'];
      for (var i = 0; i <= 26; i++) {
        var u = i / 26, bx = Math.pow(1 - u, 3) * 500 + 3 * Math.pow(1 - u, 2) * u * 500 + 3 * (1 - u) * u * u * 780 + u * u * u * 780;
        var byy = Math.pow(1 - u, 3) * 480 + 3 * Math.pow(1 - u, 2) * u * 100 + 3 * (1 - u) * u * u * 100 + u * u * u * 480;
        g.fillStyle = fl[i % 4]; circ(g, bx, byy, 17); g.fill();
      }
      g.fillStyle = '#fff'; rr(g, 470, 596, 340, 34, 10); g.fill();
    }
  };

  // 사람 뒤에 놓는 것(책상·탁자) / 앞에 놓는 것(의자 등받이)
  function behind(g, loc, p) {
    if (p.type !== 'seat' || p.driver) return;
    var x = p.x, y = p.y, s = p.s;
    if (loc === 'class') {
      g.fillStyle = '#d9a86c'; g.fillRect(x - 115 * s, y - 92 * s, 230 * s, 20 * s);
      g.fillStyle = '#9a6a3a'; g.fillRect(x - 105 * s, y - 72 * s, 14 * s, 110 * s); g.fillRect(x + 91 * s, y - 72 * s, 14 * s, 110 * s);
    } else if (loc === 'library') {
      g.fillStyle = '#b07a45'; g.fillRect(x - 170 * s, y - 96 * s, 340 * s, 24 * s);
      g.fillStyle = '#2f7d4a'; g.beginPath(); g.moveTo(x + 90 * s, y - 150 * s); g.lineTo(x + 150 * s, y - 150 * s); g.lineTo(x + 160 * s, y - 120 * s); g.lineTo(x + 80 * s, y - 120 * s); g.closePath(); g.fill();
      g.fillStyle = '#777'; g.fillRect(x + 117 * s, y - 120 * s, 6 * s, 26 * s);
    }
  }
  function front(g, loc, p) {
    if (p.type !== 'seat') return;
    var x = p.x, y = p.y, s = p.s;
    if (loc === 'bus') {
      g.fillStyle = '#4a6fb8'; rr(g, x - 92 * s, y - 104 * s, 184 * s, 170 * s, 26 * s); g.fill();
      g.fillStyle = '#6d8fd4'; rr(g, x - 92 * s, y - 104 * s, 184 * s, 30 * s, 14 * s); g.fill();
      g.fillStyle = '#ddd'; rr(g, x - 60 * s, y - 118 * s, 120 * s, 22 * s, 10 * s); g.fill();
    } else if (loc === 'wedding') {
      g.fillStyle = '#ffffff'; g.strokeStyle = '#e2d3c3'; g.lineWidth = 4 * s;
      rr(g, x - 76 * s, y - 70 * s, 152 * s, 120 * s, 22 * s); g.fill(); g.stroke();
      g.fillStyle = '#ffb6c9'; circ(g, x + 60 * s, y - 60 * s, 16 * s); g.fill();
    } else {
      g.fillStyle = loc === 'library' ? '#6e4527' : '#8a6a4a';
      rr(g, x - 74 * s, y - 66 * s, 148 * s, 110 * s, 18 * s); g.fill();
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 74 * s, y - 20 * s, 148 * s, 8 * s);
    }
  }

  function bg(g, loc, info) { BG[loc](g, info); }

  // ───────────────────────── 장소별 사람 ─────────────────────────
  // 앞 3명까지 먼저 쓰고, 뒤로 갈수록 뒷사람도 고개를 돌린다(act)
  var LOCS = [
    { id: 'class', act: [1, 2, 3], people: [
      { x: 640, y: 470, s: 0.92, type: 'stand', skin: '#f1c9a5', hair: '#3a2a22', style: 'bun', shirt: '#d9534f', pants: '#34495e', arm: 'up', sil: 'long', eyeGap: 0.5, eyeR: 0.17, nose: 'hook', mouth: 'lips', glasses: true },
      { x: 330, y: 610, s: 1.05, type: 'seat', skin: '#f6d0ae', hair: '#5a3b24', style: 'long', shirt: '#6cc3f0' },
      { x: 950, y: 610, s: 1.05, type: 'seat', skin: '#e9b98f', hair: '#1f1a17', style: 'short', shirt: '#8bd46e' }
    ] },
    { id: 'library', act: [2, 3, 3], people: [
      { x: 330, y: 600, s: 1.02, type: 'seat', skin: '#f1c9a5', hair: '#2b211c', style: 'short', shirt: '#9b7fd1' },
      { x: 640, y: 450, s: 0.84, type: 'stand', skin: '#eec39c', hair: '#8a8a8a', style: 'bun', shirt: '#4f8a6b', pants: '#2c3e50', arm: 'up', collar: '#fff', sil: 'pear', eyeR: 0.13, glasses: true, mouth: 'line' },
      { x: 950, y: 600, s: 1.02, type: 'seat', skin: '#f6d0ae', hair: '#c47a2c', style: 'long', shirt: '#f28fb1' }
    ] },
    { id: 'elevator', act: [2, 3, 3], people: [
      { x: 390, y: 700, s: 1.28, type: 'stand', skin: '#eec39c', hair: '#2a2a2a', style: 'short', shirt: '#2f3b52', pants: '#1f2533', collar: '#fff', sil: 'square', stubble: true, brow: true, eyeR: 0.13 },
      { x: 900, y: 700, s: 1.28, type: 'stand', skin: '#f3cfae', hair: '#6b4a2b', style: 'long', shirt: '#e67e22', pants: '#3b3b3b' },
      { x: 640, y: 600, s: 1.02, type: 'stand', skin: '#e2b48c', hair: '#bbbbbb', style: 'short', shirt: '#7f8c8d', pants: '#444' }
    ] },
    { id: 'bus', act: [2, 3, 4], people: [
      { x: 360, y: 610, s: 1.02, type: 'seat', skin: '#eec39c', hair: '#9e9e9e', style: 'bun', shirt: '#c0392b' },
      { x: 920, y: 610, s: 1.02, type: 'seat', skin: '#f6d0ae', hair: '#1f1a17', style: 'short', shirt: '#16a085' },
      { x: 520, y: 490, s: 0.8, type: 'seat', skin: '#e9b98f', hair: '#4a3222', style: 'long', shirt: '#f1c40f' },
      { x: 800, y: 490, s: 0.8, type: 'seat', skin: '#f1c9a5', hair: '#222', style: 'short', shirt: '#8e44ad' }
    ] },
    { id: 'wedding', act: [3, 4, 5], people: [
      { x: 330, y: 620, s: 1.02, type: 'seat', skin: '#f1c9a5', hair: '#3a2a22', style: 'long', shirt: '#e6a1c0' },
      { x: 950, y: 620, s: 1.02, type: 'seat', skin: '#e9b98f', hair: '#222', style: 'short', shirt: '#34495e', collar: '#fff' },
      { x: 596, y: 470, s: 0.7, type: 'stand', skin: '#f1c9a5', hair: '#1f1a17', style: 'short', shirt: '#1f1f1f', pants: '#1f1f1f', collar: '#fff', sil: 'square', mouth: 'teeth' },
      { x: 450, y: 500, s: 0.78, type: 'seat', skin: '#eec39c', hair: '#aaaaaa', style: 'short', shirt: '#7f6a93' },
      { x: 690, y: 470, s: 0.7, type: 'stand', skin: '#f6d0ae', hair: '#5a3b24', style: 'veil', shirt: '#ffffff', pants: '#ffffff', dress: true }
    ] }
  ];

  window.ART = { bg: bg, person: person, behind: behind, front: front, player: player, puff: puff, bubble: bubble, LOCS: LOCS, rr: rr };
})();
