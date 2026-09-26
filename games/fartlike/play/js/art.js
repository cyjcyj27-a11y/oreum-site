/* 방귀라이크 — 그림. 전부 캔버스 코드로 그려서 처음 한 번 스프라이트로 구워 둔다(파일 없음).
 * 빛은 왼쪽 위에서. 바깥 윤곽은 굵게·그 면의 짙은 색, 안쪽 선은 가늘게.
 * window.ART = { init(), girl(face, step), enemy(id, frame, variant), boss(...), icon(id), cloud(kind), tile(stage), decals(stage) ... }
 */
(function () {
  'use strict';
  var PI = Math.PI, TAU = PI * 2;
  var ART = {};
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function lin(x, x0, y0, x1, y1, stops) { var g = x.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]); return g; }
  function rad(x, x0, y0, r0, x1, y1, r1, stops) { var g = x.createRadialGradient(x0, y0, r0, x1, y1, r1); for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]); return g; }
  function ell(x, cx, cy, rx, ry, rot) { x.beginPath(); x.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function circ(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, Math.abs(r), 0, TAU); }
  function fillStroke(x, fill, stroke, lw) { if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 2; x.stroke(); } }
  function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function shadow(x, rx, ry, a) { ell(x, 0, 0, rx, ry); x.fillStyle = rad(x, 0, 0, 0, 0, 0, rx, [[0, 'rgba(30,20,40,' + (a || 0.32) + ')'], [0.7, 'rgba(30,20,40,' + ((a || 0.32) * 0.7) + ')'], [1, 'rgba(30,20,40,0)']]); x.fill(); }
  function line(x, pts, col, lw) { x.beginPath(); x.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); }

  // 스프라이트 하나 = { c: 캔버스, ax, ay: 발 자리(캔버스 px), k: 캔버스 px 하나가 세계 몇 단위인지 }
  function bake(w, h, ax, ay, res, draw) {
    var c = mk(w * res, h * res), x = c.getContext('2d');
    x.translate(ax * res, ay * res); x.scale(res, res);
    x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x);
    return { c: c, ax: ax * res, ay: ay * res, k: 1 / res, w: w, h: h };
  }
  // 이미 구운 스프라이트를 흰색(맞음)·초록(냄새 먹음)으로 칠한 벌
  function tint(sp, col, a) {
    var c = mk(sp.c.width, sp.c.height), x = c.getContext('2d');
    x.drawImage(sp.c, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return { c: c, ax: sp.ax, ay: sp.ay, k: sp.k, w: sp.w, h: sp.h };
  }

  // ─────────────────────────── 주인공: SD 꼬마 소녀 ───────────────────────────
  // 발끝이 (0,0), 위가 음수. 머리가 몸의 반쯤 되는 2.3등신. 분홍 트윈테일 + 민트 후드 원피스.
  var HAIR = { hi: '#ffc6d9', base: '#f58fb0', mid: '#e8729a', sh: '#c4527c', line: '#8a2f57', strand: 'rgba(170,60,105,.55)' };
  var SKIN = { hi: '#fff1e6', base: '#ffdcc6', sh: '#f2b79c', line: '#b8745f' };
  var DRESS = { hi: '#b5f5e4', base: '#7fdcc4', sh: '#4fb3a0', line: '#2b7c70', dark: '#3f9d8c' };

  function girlTail(x, side, sway) {
    // 트윈테일: 머리 옆에서 늘어져 바깥으로 말린다
    var s = side;
    x.save();
    x.beginPath();
    x.moveTo(s * 22, -92);
    x.bezierCurveTo(s * 44, -98, s * (50 + sway), -78, s * (46 + sway), -60);
    x.bezierCurveTo(s * (44 + sway), -48, s * (50 + sway), -40, s * (42 + sway * 1.3), -32);   // 끝 말림
    x.bezierCurveTo(s * (40 + sway), -38, s * (35 + sway), -42, s * (36 + sway), -52);
    x.bezierCurveTo(s * (36 + sway), -62, s * 34, -74, s * 24, -80);
    x.closePath();
    x.fillStyle = lin(x, s * 22, -98, s * 46, -32, [[0, HAIR.hi], [0.35, HAIR.base], [0.8, HAIR.mid], [1, HAIR.sh]]);
    x.fill();
    x.strokeStyle = HAIR.line; x.lineWidth = 2.2; x.stroke();
    // 결
    x.lineWidth = 1.1; x.strokeStyle = HAIR.strand;
    x.beginPath(); x.moveTo(s * 30, -88); x.bezierCurveTo(s * 42, -84, s * (44 + sway), -66, s * (41 + sway), -50); x.stroke();
    x.beginPath(); x.moveTo(s * 26, -84); x.bezierCurveTo(s * 36, -78, s * (39 + sway), -64, s * (39 + sway), -54); x.stroke();
    // 윤기
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(s * 33, -90); x.quadraticCurveTo(s * 42, -86, s * 45, -74); x.stroke();
    x.restore();
  }
  function ribbon(x, cx, cy, s) {
    x.save(); x.translate(cx, cy); x.scale(s, 1);
    var red = lin(x, -8, -6, 8, 6, [[0, '#ff7b86'], [0.5, '#f0364c'], [1, '#b81d35']]);
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-4, -10, -13, -9, -12, -1); x.bezierCurveTo(-12, 5, -5, 5, 0, 0); x.closePath(); fillStroke(x, red, '#8c1027', 1.6);
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(4, -10, 13, -9, 12, -1); x.bezierCurveTo(12, 5, 5, 5, 0, 0); x.closePath(); fillStroke(x, red, '#8c1027', 1.6);
    x.beginPath(); x.moveTo(-2, 1); x.lineTo(-6, 10); x.lineTo(-2, 8); x.moveTo(2, 1); x.lineTo(6, 10); x.lineTo(2, 8); x.strokeStyle = '#c42038'; x.lineWidth = 2.4; x.stroke();
    circ(x, 0, 0, 3); fillStroke(x, '#ff5a6a', '#8c1027', 1.4);
    x.fillStyle = 'rgba(255,255,255,.7)'; ell(x, -7, -4, 2.2, 1.3, -0.5); x.fill(); ell(x, 5, -5, 1.8, 1.1, 0.5); x.fill();
    x.restore();
  }
  function eyeOpen(x, cx, cy, sc, look) {
    // 흰자 → 홍채(보라 → 아래 밝게) → 동공 → 반짝이 둘, 위 속눈썹 굵게
    var rx = 7.6 * sc, ry = 9.8 * sc;
    ell(x, cx, cy, rx, ry); x.fillStyle = '#ffffff'; x.fill();
    x.save(); ell(x, cx, cy, rx, ry); x.clip();
    ell(x, cx + look, cy + 1, 6.4 * sc, 8.6 * sc); x.fillStyle = lin(x, 0, cy - 9, 0, cy + 9, [[0, '#2a1450'], [0.45, '#6a3fb0'], [1, '#c9a2ff']]); x.fill();
    ell(x, cx + look, cy + 1.5, 3.2 * sc, 4.4 * sc); x.fillStyle = '#1a0a2e'; x.fill();
    x.fillStyle = 'rgba(255,190,255,.55)'; ell(x, cx + look, cy + 6 * sc, 3.6 * sc, 1.8 * sc); x.fill();
    x.restore();
    x.fillStyle = '#fff'; circ(x, cx + look - 2.4 * sc, cy - 3.4 * sc, 2.7 * sc); x.fill(); circ(x, cx + look + 2.6 * sc, cy + 3.2 * sc, 1.3 * sc); x.fill();
    // 속눈썹
    x.beginPath(); x.ellipse(cx, cy + 0.6, rx + 0.8, ry + 0.4, 0, PI * 1.08, PI * 1.92); x.strokeStyle = '#2d1633'; x.lineWidth = 2.8; x.stroke();
    x.beginPath(); x.moveTo(cx + rx * 0.92, cy - ry * 0.45); x.lineTo(cx + rx * 1.35, cy - ry * 0.8); x.lineWidth = 2; x.stroke();
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, PI * 0.2, PI * 0.8); x.strokeStyle = 'rgba(120,60,90,.35)'; x.lineWidth = 1; x.stroke();
  }
  function girlFace(x, face, fx) {
    var ey = -74, L = -11.5 + fx, R = 11.5 + fx;
    var blushA = face === 'normal' ? 0.45 : face === 'relief' ? 0.7 : 0.85;
    if (face === 'strain') {
      // 힘주는 얼굴: 얼굴 아래가 빨갛게 달아오른다
      x.save(); ell(x, 0, -80, 28.6, 26.6); x.clip();
      x.fillStyle = rad(x, fx, -60, 2, fx, -64, 30, [[0, 'rgba(255,60,70,.55)'], [0.6, 'rgba(255,80,90,.3)'], [1, 'rgba(255,80,90,0)']]);
      x.fillRect(-40, -110, 80, 70); x.restore();
    }
    // 볼터치
    x.fillStyle = 'rgba(255,110,140,' + blushA + ')';
    ell(x, L - 5, -63, 5.5, 3.2); x.fill(); ell(x, R + 5, -63, 5.5, 3.2); x.fill();
    x.strokeStyle = 'rgba(230,80,120,' + (blushA * 0.8) + ')'; x.lineWidth = 0.9;
    for (var i = 0; i < 3; i++) { line(x, [L - 8 + i * 2.6, -61.5, L - 6.6 + i * 2.6, -64.5], x.strokeStyle, 0.9); line(x, [R + 2 + i * 2.6, -61.5, R + 3.4 + i * 2.6, -64.5], x.strokeStyle, 0.9); }
    var ink = '#3a1a36';
    if (face === 'normal') {
      eyeOpen(x, L, ey, 1, 0.8); eyeOpen(x, R, ey, 1, 0.8);
      x.beginPath(); x.moveTo(fx - 3.4, -60.5); x.quadraticCurveTo(fx, -57.2, fx + 3.4, -60.5); x.strokeStyle = ink; x.lineWidth = 1.8; x.stroke();
    } else if (face === 'strain') {
      // > < 꾹 감은 눈, 이 악문 입
      line(x, [L - 6, ey - 5, L + 3, ey, L - 6, ey + 5], ink, 3);
      line(x, [R + 6, ey - 5, R - 3, ey, R + 6, ey + 5], ink, 3);
      rrect(x, fx - 6, -63, 12, 6, 2.5); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = ink; x.lineWidth = 1.6; x.stroke();
      line(x, [fx - 6, -60, fx + 6, -60], ink, 1); line(x, [fx - 2, -63, fx - 2, -57], ink, 0.8); line(x, [fx + 2, -63, fx + 2, -57], ink, 0.8);
      // 힘줄
      x.strokeStyle = '#e8364f'; x.lineWidth = 1.8;
      x.beginPath(); x.moveTo(20, -98); x.lineTo(24, -96); x.moveTo(22, -100); x.lineTo(22, -94); x.stroke();
    } else if (face === 'relief') {
      // ^ ^ 시원한 얼굴, 활짝 웃는 입
      x.beginPath(); x.moveTo(L - 6, ey + 2); x.quadraticCurveTo(L, ey - 7, L + 6, ey + 2); x.strokeStyle = ink; x.lineWidth = 3; x.stroke();
      x.beginPath(); x.moveTo(R - 6, ey + 2); x.quadraticCurveTo(R, ey - 7, R + 6, ey + 2); x.stroke();
      x.beginPath(); x.moveTo(fx - 6.5, -62); x.quadraticCurveTo(fx, -61, fx + 6.5, -62); x.quadraticCurveTo(fx + 5, -52.5, fx, -52.5); x.quadraticCurveTo(fx - 5, -52.5, fx - 6.5, -62); x.closePath();
      x.fillStyle = '#9c2a3c'; x.fill(); x.strokeStyle = ink; x.lineWidth = 1.6; x.stroke();
      ell(x, fx, -55, 3.6, 2.2); x.fillStyle = '#ff7f95'; x.fill();
    } else if (face === 'oops') {
      // 뿌지직 뒤 어질어질: 빙글빙글 눈
      [L, R].forEach(function (cx) {
        x.beginPath(); for (var a = 0; a < 16; a++) { var t = a / 15, rr = 1 + t * 6.5, an = t * PI * 4.2; var px = cx + Math.cos(an) * rr, py = ey + Math.sin(an) * rr; if (a) x.lineTo(px, py); else x.moveTo(px, py); }
        x.strokeStyle = ink; x.lineWidth = 2; x.stroke();
      });
      x.beginPath(); x.moveTo(fx - 6, -59); x.quadraticCurveTo(fx - 3, -62, fx, -59); x.quadraticCurveTo(fx + 3, -56, fx + 6, -59); x.strokeStyle = ink; x.lineWidth = 1.8; x.stroke();
    } else if (face === 'hurt') {
      line(x, [L - 6, ey - 4, L + 3, ey, L - 6, ey + 4], ink, 3);
      eyeOpen(x, R, ey, 0.85, -0.5);
      ell(x, fx, -58, 3.2, 3.8); x.fillStyle = '#9c2a3c'; x.fill(); x.strokeStyle = ink; x.lineWidth = 1.5; x.stroke();
    }
    // 코
    if (face !== 'strain') { x.fillStyle = 'rgba(200,110,100,.6)'; ell(x, fx + 1.2, -66.5, 1, 0.7); x.fill(); }
  }
  function sweat(x, cx, cy, s) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    x.beginPath(); x.moveTo(0, -7); x.bezierCurveTo(4, -1, 5, 4, 0, 5.5); x.bezierCurveTo(-5, 4, -4, -1, 0, -7); x.closePath();
    x.fillStyle = lin(x, 0, -7, 0, 6, [[0, '#e8fbff'], [1, '#6cc9f2']]); x.fill(); x.strokeStyle = '#2f86b8'; x.lineWidth = 1.2; x.stroke();
    x.fillStyle = '#fff'; ell(x, -1.4, 1, 1, 1.6); x.fill();
    x.restore();
  }
  function star(x, cx, cy, r, col) {
    x.beginPath(); for (var i = 0; i < 8; i++) { var a = i * PI / 4 - PI / 2, rr = i % 2 ? r * 0.38 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath();
    x.fillStyle = col || '#fff6a8'; x.fill();
  }

  // step: 0..3 걷기 칸. face: normal | strain | relief | oops | hurt
  function drawGirl(x, face, step) {
    var ph = step * PI / 2, sn = Math.sin(ph);
    var bob = step === 4 ? 0 : -Math.abs(sn) * 2.4;       // 4 = 서 있기
    if (step === 4) sn = 0;
    var legL = Math.max(0, sn) * -4.5, legR = Math.max(0, -sn) * -4.5;
    var arm = sn * 5, sway = -sn * 1.6;
    shadow(x, 25, 7.5, 0.34);
    // ── 다리·신발
    [[-7.5, legL, -1], [7.5, legR, 1]].forEach(function (L) {
      var lx = L[0], ly = L[1];
      rrect(x, lx - 4.2, -22 + ly, 8.4, 17, 4); x.fillStyle = lin(x, lx - 4, 0, lx + 4, 0, [[0, SKIN.base], [1, SKIN.sh]]); x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.4; x.stroke();
      rrect(x, lx - 4.4, -13 + ly, 8.8, 9, 3); x.fillStyle = lin(x, lx - 4, 0, lx + 4, 0, [[0, '#ffffff'], [1, '#dcdff0']]); x.fill(); x.strokeStyle = '#9aa0c0'; x.lineWidth = 1.2; x.stroke();
      ell(x, lx + L[2] * 1.2, -3.2 + ly, 7.2, 4.6); x.fillStyle = lin(x, 0, -8 + ly, 0, 1 + ly, [[0, '#ff7a6e'], [0.55, '#e8423c'], [1, '#a8231f']]); x.fill(); x.strokeStyle = '#7d1616'; x.lineWidth = 1.6; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.7)'; ell(x, lx + L[2] * 1.2 - 2.5, -5.4 + ly, 2.6, 1.2, -0.2); x.fill();
      line(x, [lx - 5.5 + L[2] * 1.2, -1.6 + ly, lx + 6.5 + L[2] * 1.2, -1.6 + ly], '#fff4f0', 1.2);
    });
    x.save(); x.translate(0, bob);
    // ── 트윈테일 (몸 뒤)
    girlTail(x, -1, sway); girlTail(x, 1, -sway);
    // ── 뒷머리 (머리 뒤로 넉넉히)
    x.beginPath(); x.ellipse(0, -82, 33, 31, 0, 0, TAU);
    x.fillStyle = lin(x, 0, -114, 0, -52, [[0, HAIR.base], [1, HAIR.sh]]); x.fill(); x.strokeStyle = HAIR.line; x.lineWidth = 2.2; x.stroke();
    // ── 몸통: 민트 후드 원피스
    // 팔 (뒤쪽 팔은 몸 뒤로 살짝)
    function armDraw(side, sw) {
      var sx = side * 14, sy = -47, ex = side * 21, ey = -31 + sw;
      x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(side * 22, -44, ex, ey); x.lineWidth = 9.5; x.strokeStyle = DRESS.line; x.stroke();
      x.lineWidth = 7; x.strokeStyle = lin(x, sx, sy, ex, ey, [[0, DRESS.hi], [1, DRESS.base]]); x.stroke();
      circ(x, ex + side * 0.5, ey + 3, 4.6); x.fillStyle = rad(x, ex - 1.5, ey + 1.5, 0.5, ex, ey + 3, 5, [[0, SKIN.hi], [1, SKIN.sh]]); x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.3; x.stroke();
    }
    armDraw(-1, arm);
    x.beginPath();
    x.moveTo(-13, -51); x.quadraticCurveTo(0, -55, 13, -51);
    x.quadraticCurveTo(18, -36, 22.5, -20);
    x.quadraticCurveTo(0, -13.5, -22.5, -20);
    x.quadraticCurveTo(-18, -36, -13, -51); x.closePath();
    x.fillStyle = lin(x, -22, -40, 22, -30, [[0, DRESS.hi], [0.45, DRESS.base], [1, DRESS.sh]]); x.fill();
    x.strokeStyle = DRESS.line; x.lineWidth = 2.2; x.stroke();
    // 치마단 띠 + 주름
    x.save(); x.clip();
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(-24, -24); x.quadraticCurveTo(0, -17.5, 24, -24); x.lineTo(24, -18); x.quadraticCurveTo(0, -11.5, -24, -18); x.fill();
    line(x, [-8, -34, -10, -17], 'rgba(40,120,110,.45)', 1.2); line(x, [8, -34, 10, -17], 'rgba(40,120,110,.45)', 1.2);
    x.fillStyle = 'rgba(255,255,255,.28)'; ell(x, -9, -44, 5, 8, 0.2); x.fill();
    x.restore();
    // 캥거루 주머니
    rrect(x, -9, -35, 18, 9, 4); x.fillStyle = DRESS.dark; x.globalAlpha = 0.55; x.fill(); x.globalAlpha = 1; x.strokeStyle = DRESS.line; x.lineWidth = 1.2; x.stroke();
    // 후드 목깃 + 끈
    x.beginPath(); x.moveTo(-14, -52); x.quadraticCurveTo(0, -45, 14, -52); x.quadraticCurveTo(0, -41.5, -14, -52); x.fillStyle = DRESS.sh; x.fill();
    line(x, [-4, -48, -5, -39], '#ffffff', 1.4); line(x, [4, -48, 5, -39], '#ffffff', 1.4);
    circ(x, -5, -38.5, 1.4); x.fillStyle = '#fff'; x.fill(); circ(x, 5, -38.5, 1.4); x.fill();
    armDraw(1, -arm);
    // ── 머리(얼굴)
    x.beginPath(); x.ellipse(0, -80, 28.5, 26.5, 0, 0, TAU);
    x.fillStyle = rad(x, -8, -92, 3, 0, -80, 32, [[0, SKIN.hi], [0.55, SKIN.base], [1, SKIN.sh]]); x.fill();
    x.strokeStyle = SKIN.line; x.lineWidth = 2; x.stroke();
    // 턱 밑 그늘
    x.save(); ell(x, 0, -80, 28.5, 26.5); x.clip(); x.fillStyle = 'rgba(210,130,110,.18)'; ell(x, 6, -52, 26, 7); x.fill(); x.restore();
    var fx = 2.6;
    girlFace(x, face, fx);
    // ── 앞머리 + 정수리 (얼굴 위를 덮는다)
    x.beginPath();
    x.moveTo(-31, -70);
    x.bezierCurveTo(-35, -100, -18, -113, 0, -113);
    x.bezierCurveTo(18, -113, 35, -100, 31, -70);
    // 오른쪽 옆머리 → 앞머리 끝 → 왼쪽 옆머리
    x.quadraticCurveTo(30, -60, 32, -54); x.quadraticCurveTo(25, -60, 25, -72);
    x.quadraticCurveTo(24, -80, 21, -86);
    x.quadraticCurveTo(19, -80, 15, -76);            // 끝1
    x.quadraticCurveTo(14, -84, 9, -89);
    x.quadraticCurveTo(7, -81, 2.5, -77);           // 끝2
    x.quadraticCurveTo(0, -85, -5, -90);
    x.quadraticCurveTo(-7, -82, -11, -77);          // 끝3
    x.quadraticCurveTo(-13, -84, -18, -87);
    x.quadraticCurveTo(-21, -80, -24, -74);
    x.quadraticCurveTo(-26, -64, -31, -54); x.quadraticCurveTo(-29, -60, -31, -70);
    x.closePath();
    x.fillStyle = lin(x, 0, -114, 0, -56, [[0, HAIR.hi], [0.3, HAIR.base], [0.75, HAIR.mid], [1, HAIR.sh]]); x.fill();
    x.strokeStyle = HAIR.line; x.lineWidth = 2.2; x.stroke();
    // 결 몇 가닥
    x.lineWidth = 1.1; x.strokeStyle = HAIR.strand;
    [[-4, -110, -8, -92], [6, -110, 8, -92], [16, -106, 17, -86], [-16, -106, -15, -88], [24, -98, 27, -74], [-24, -98, -27, -74]].forEach(function (s) {
      x.beginPath(); x.moveTo(s[0], s[1]); x.quadraticCurveTo((s[0] + s[2]) / 2 + 2, (s[1] + s[3]) / 2, s[2], s[3]); x.stroke();
    });
    // 천사 고리 윤기
    x.strokeStyle = 'rgba(255,255,255,.62)'; x.lineWidth = 3.2;
    x.beginPath(); x.ellipse(0, -96, 22, 9, 0, PI * 1.08, PI * 1.38); x.stroke();
    x.beginPath(); x.ellipse(0, -96, 22, 9, 0, PI * 1.5, PI * 1.8); x.stroke();
    x.beginPath(); x.ellipse(0, -96, 22, 9, 0, PI * 1.88, PI * 1.98); x.stroke();
    // 바보털
    x.beginPath(); x.moveTo(2, -112); x.bezierCurveTo(4, -124, 14, -126, 13, -118); x.bezierCurveTo(10, -121, 7, -118, 5, -111); x.closePath();
    x.fillStyle = HAIR.base; x.fill(); x.strokeStyle = HAIR.line; x.lineWidth = 1.6; x.stroke();
    // 리본
    ribbon(x, -27, -94, -1); ribbon(x, 27, -94, 1);
    // 표정 곁들이
    if (face === 'strain') { sweat(x, -30, -96, 1); sweat(x, 33, -78, 0.8); }
    if (face === 'oops') { sweat(x, 32, -92, 1.1); }
    if (face === 'relief') { star(x, 34, -104, 5, '#fff6a8'); star(x, -36, -98, 3.6, '#ffffff'); }
    x.restore();
  }

  // ─────────────────────────── 적 ───────────────────────────
  // 모두 오른쪽을 본다(뒤집어서 왼쪽). f = 0/1 두 칸.
  var EN = {};
  EN.mosquito = { w: 60, h: 60, ax: 30, ay: 52, draw: function (x, f) {
    shadow(x, 10, 3.5, 0.22);
    x.save(); x.translate(0, -24 + (f ? -2 : 1));
    // 날개
    x.globalAlpha = 0.75;
    [[-4, f ? -16 : -8, f ? -0.9 : -0.3], [4, f ? -15 : -7, f ? -1.2 : -0.5]].forEach(function (w) {
      ell(x, w[0] - 4, w[1], 14, 5.5, w[2]); x.fillStyle = lin(x, 0, w[1] - 6, 0, w[1] + 6, [[0, 'rgba(235,250,255,.95)'], [1, 'rgba(170,210,235,.6)']]); x.fill(); x.strokeStyle = 'rgba(90,130,160,.8)'; x.lineWidth = 1; x.stroke();
    });
    x.globalAlpha = 1;
    // 다리
    for (var i = 0; i < 3; i++) { line(x, [-2 + i * 4, 2, -6 + i * 5, 12 + (f ? 1 : 0), -9 + i * 6, 18], '#3a2a24', 1.1); }
    // 배(줄무늬)
    x.save(); x.rotate(-0.25);
    ell(x, -12, 2, 13, 5.5); x.fillStyle = lin(x, 0, -4, 0, 8, [[0, '#8a7466'], [1, '#3d2c24']]); x.fill(); x.strokeStyle = '#231510'; x.lineWidth = 1.6; x.stroke();
    x.save(); ell(x, -12, 2, 13, 5.5); x.clip(); for (var s = 0; s < 4; s++) { x.fillStyle = 'rgba(245,240,230,.75)'; x.fillRect(-22 + s * 5.5, -5, 2, 14); } x.restore();
    x.restore();
    // 가슴
    ell(x, 2, -2, 7, 6.5); x.fillStyle = rad(x, 0, -5, 1, 2, -2, 8, [[0, '#9a8574'], [1, '#3a2a22']]); x.fill(); x.strokeStyle = '#231510'; x.lineWidth = 1.6; x.stroke();
    // 머리 + 빨간 눈 + 침
    circ(x, 10, -5, 5); x.fillStyle = '#4a3a30'; x.fill(); x.strokeStyle = '#231510'; x.lineWidth = 1.4; x.stroke();
    circ(x, 11.5, -6, 3.2); x.fillStyle = rad(x, 10.5, -7, 0.5, 11.5, -6, 3.4, [[0, '#ff9a8a'], [1, '#c01818']]); x.fill();
    circ(x, 10.6, -7.2, 1); x.fillStyle = '#fff'; x.fill();
    line(x, [8, -10, 12, -8.5], '#231510', 1.4);     // 화난 눈썹
    line(x, [14, -3, 25, 1], '#231510', 1.6);
    x.restore();
  } };
  EN.pigeon = { w: 70, h: 64, ax: 35, ay: 58, draw: function (x, f) {
    shadow(x, 17, 5, 0.3);
    // 발
    line(x, [-3, -6, -4 + (f ? 3 : -2), 0, -8 + (f ? 3 : -2), 0], '#e0707c', 2.2);
    line(x, [5, -6, 6 + (f ? -3 : 2), 0, 10 + (f ? -3 : 2), 0], '#e0707c', 2.2);
    var bob = f ? -1.5 : 0;
    x.save(); x.translate(0, bob);
    // 꼬리
    x.beginPath(); x.moveTo(-12, -16); x.lineTo(-28, -10); x.lineTo(-27, -4); x.lineTo(-10, -9); x.closePath(); fillStroke(x, lin(x, -28, 0, -10, 0, [[0, '#3d4658'], [1, '#6a7488']]), '#262c3a', 1.6);
    // 몸
    ell(x, 0, -16, 17, 12.5); x.fillStyle = rad(x, -4, -24, 2, 0, -16, 19, [[0, '#c9d1e0'], [0.6, '#98a3b8'], [1, '#6f7a92']]); x.fill(); x.strokeStyle = '#3c4458'; x.lineWidth = 2; x.stroke();
    // 날개 + 검은 줄 둘
    x.beginPath(); x.moveTo(-10, -22); x.quadraticCurveTo(4, -26, 8, -14); x.quadraticCurveTo(0, -6, -14, -10); x.closePath(); fillStroke(x, lin(x, 0, -24, 0, -6, [[0, '#aab4c8'], [1, '#7c879e']]), '#4a5268', 1.4);
    line(x, [-6, -16, 3, -15], '#2a2e3a', 2.2); line(x, [-8, -12, 0, -11], '#2a2e3a', 2.2);
    // 목 무지개빛
    x.beginPath(); x.moveTo(6, -24); x.quadraticCurveTo(12, -28, 14, -20); x.quadraticCurveTo(10, -14, 5, -17); x.closePath(); x.fillStyle = lin(x, 5, -26, 14, -15, [[0, '#7de0a0'], [0.5, '#6aa0e8'], [1, '#b070d8']]); x.fill();
    // 머리
    circ(x, 13, -31, 8); x.fillStyle = rad(x, 10, -34, 1, 13, -31, 9, [[0, '#b8c2d4'], [1, '#6f7a92']]); x.fill(); x.strokeStyle = '#3c4458'; x.lineWidth = 1.8; x.stroke();
    circ(x, 16, -33, 2.7); x.fillStyle = '#ff9a2a'; x.fill(); circ(x, 16.5, -33, 1.3); x.fillStyle = '#111'; x.fill();
    x.beginPath(); x.moveTo(20, -31); x.lineTo(26, -29); x.lineTo(20, -27.5); x.closePath(); fillStroke(x, '#3a3438', null);
    ell(x, 20.5, -31.5, 2, 1.2); x.fillStyle = '#f2f2f2'; x.fill();
    x.restore();
  } };
  EN.puppy = { w: 70, h: 62, ax: 35, ay: 56, draw: function (x, f) {
    shadow(x, 16, 5, 0.3);
    var fur = '#fff7ea', furS = '#e8cfa8', line2 = '#8a6a48';
    // 다리 4 (달리기)
    var lg = f ? [[-10, -3], [-4, 2], [6, -2], [12, 3]] : [[-10, 2], [-4, -3], [6, 3], [12, -2]];
    lg.forEach(function (l) { rrect(x, l[0] - 2.8, -11, 5.6, 11 + l[1] * 0.3, 2.5); x.fillStyle = fur; x.fill(); x.strokeStyle = line2; x.lineWidth = 1.3; x.stroke(); });
    // 꼬리 흔들기
    x.beginPath(); x.moveTo(-14, -18); x.quadraticCurveTo(-24, f ? -30 : -22, -20, f ? -34 : -28); x.lineWidth = 6; x.strokeStyle = line2; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#e5b778'; x.stroke();
    // 몸
    ell(x, 0, -17, 16, 9.5); x.fillStyle = rad(x, -4, -22, 1, 0, -17, 17, [[0, '#fffdf6'], [0.7, fur], [1, furS]]); x.fill(); x.strokeStyle = line2; x.lineWidth = 1.8; x.stroke();
    x.save(); ell(x, 0, -17, 16, 9.5); x.clip(); x.fillStyle = '#e5b778'; ell(x, -2, -26, 14, 6); x.fill(); x.restore();
    // 머리
    circ(x, 13, -27, 11); x.fillStyle = rad(x, 10, -31, 1, 13, -27, 12, [[0, '#fffdf6'], [1, furS]]); x.fill(); x.strokeStyle = line2; x.lineWidth = 1.8; x.stroke();
    x.save(); circ(x, 13, -27, 11); x.clip(); x.fillStyle = '#e5b778'; ell(x, 9, -36, 10, 6, 0.3); x.fill(); x.restore();
    // 귀
    x.beginPath(); x.moveTo(5, -33); x.lineTo(4, -44); x.lineTo(12, -37); x.closePath(); fillStroke(x, '#d99a55', line2, 1.5);
    x.beginPath(); x.moveTo(15, -37); x.lineTo(20, -46); x.lineTo(22, -34); x.closePath(); fillStroke(x, '#d99a55', line2, 1.5);
    // 눈·코·혀
    circ(x, 16, -29, 2.2); x.fillStyle = '#1b120c'; x.fill(); circ(x, 15.4, -29.8, 0.8); x.fillStyle = '#fff'; x.fill();
    circ(x, 10, -29, 1.9); x.fillStyle = '#1b120c'; x.fill();
    ell(x, 23, -25.5, 2.4, 1.8); x.fillStyle = '#2a1a14'; x.fill();
    x.beginPath(); x.moveTo(19, -22); x.quadraticCurveTo(21, -15 - (f ? 2 : 0), 24, -21); x.fillStyle = '#ff7a90'; x.fill(); x.strokeStyle = '#b83a55'; x.lineWidth = 1; x.stroke();
    x.fillStyle = 'rgba(255,140,160,.5)'; ell(x, 9, -23, 2.6, 1.6); x.fill();
  } };
  EN.ajumma = { w: 84, h: 100, ax: 42, ay: 92, draw: function (x, f) {
    shadow(x, 20, 6, 0.32);
    var ink = '#3b2340';
    // 다리·신발
    [[-7, f ? -2 : 0], [7, f ? 0 : -2]].forEach(function (l) { rrect(x, l[0] - 5, -22 + l[1], 10, 20, 3); x.fillStyle = lin(x, 0, -22, 0, 0, [[0, '#5b6aa8'], [1, '#3a4478']]); x.fill(); x.strokeStyle = '#252b52'; x.lineWidth = 1.5; x.stroke(); ell(x, l[0] + 1, -2 + l[1], 7, 3.5); x.fillStyle = '#f0f0f0'; x.fill(); x.strokeStyle = '#8a8a9a'; x.stroke(); });
    // 몸 (꽃무늬 조끼)
    x.beginPath(); x.moveTo(-17, -54); x.quadraticCurveTo(0, -60, 17, -54); x.quadraticCurveTo(22, -36, 19, -20); x.quadraticCurveTo(0, -15, -19, -20); x.quadraticCurveTo(-22, -36, -17, -54); x.closePath();
    x.fillStyle = lin(x, -20, 0, 20, 0, [[0, '#d98ae8'], [0.5, '#b35fcf'], [1, '#7f3aa0']]); x.fill(); x.strokeStyle = '#4f1f66'; x.lineWidth = 2; x.stroke();
    x.save(); x.clip(); [[-10, -46], [6, -40], [-4, -30], [12, -26], [-14, -26], [10, -50]].forEach(function (p) { for (var k = 0; k < 5; k++) { var a = k * TAU / 5; circ(x, p[0] + Math.cos(a) * 2.3, p[1] + Math.sin(a) * 2.3, 1.7); x.fillStyle = '#ffe0f4'; x.fill(); } circ(x, p[0], p[1], 1.2); x.fillStyle = '#ffd24a'; x.fill(); }); x.restore();
    // 팔: 한 팔은 신문을 치켜든다
    var up = f ? -8 : 0;
    x.beginPath(); x.moveTo(-15, -50); x.quadraticCurveTo(-24, -40, -20, -30); x.lineWidth = 8; x.strokeStyle = '#4f1f66'; x.stroke(); x.lineWidth = 6; x.strokeStyle = '#c97ae0'; x.stroke();
    circ(x, -20, -28, 4.2); x.fillStyle = SKIN.base; x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.2; x.stroke();
    x.beginPath(); x.moveTo(15, -50); x.quadraticCurveTo(24, -58 + up, 22, -66 + up); x.lineWidth = 8; x.strokeStyle = '#4f1f66'; x.stroke(); x.lineWidth = 6; x.strokeStyle = '#c97ae0'; x.stroke();
    x.save(); x.translate(22, -68 + up); x.rotate(0.5 + (f ? 0.4 : 0));
    rrect(x, -4, -18, 8, 22, 3); x.fillStyle = lin(x, -4, 0, 4, 0, [[0, '#ffffff'], [1, '#cfcfcf']]); x.fill(); x.strokeStyle = '#6a6a6a'; x.lineWidth = 1.2; x.stroke();
    line(x, [-2, -14, 2, -14], '#888', 1); line(x, [-2, -10, 2, -10], '#888', 1); line(x, [-2, -6, 2, -6], '#888', 1);
    x.restore();
    circ(x, 22, -66 + up, 4.2); x.fillStyle = SKIN.base; x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.2; x.stroke();
    // 머리 + 뽀글이 파마
    circ(x, 0, -70, 15); x.fillStyle = rad(x, -4, -75, 1, 0, -70, 16, [[0, SKIN.hi], [1, SKIN.sh]]); x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.8; x.stroke();
    var curls = [[-14, -76], [-10, -84], [-3, -87], [4, -87], [11, -84], [15, -77], [-15, -68], [16, -69], [-8, -80], [8, -80], [0, -82]];
    curls.forEach(function (c) { circ(x, c[0], c[1], 5.2); x.fillStyle = rad(x, c[0] - 1.5, c[1] - 1.5, 0.5, c[0], c[1], 5.5, [[0, '#9b6a8a'], [1, '#4c2a44']]); x.fill(); x.strokeStyle = '#2e1629'; x.lineWidth = 1.1; x.stroke(); });
    // 선캡 챙
    x.beginPath(); x.moveTo(-14, -76); x.quadraticCurveTo(6, -84, 26, -72); x.quadraticCurveTo(8, -71, -12, -72); x.closePath(); fillStroke(x, lin(x, 0, -82, 0, -70, [[0, '#ff6fb4'], [1, '#e0317f']]), '#8c1a52', 1.6);
    // 얼굴: 화난 눈썹, 크게 벌린 입
    line(x, [0, -72, 6, -70], ink, 2); line(x, [9, -70, 14, -72], ink, 2);
    circ(x, 4, -67, 1.5); x.fillStyle = ink; x.fill(); circ(x, 11, -67, 1.5); x.fill();
    ell(x, 8, -60, 4, f ? 3.6 : 2.6); x.fillStyle = '#8a1f33'; x.fill(); x.strokeStyle = ink; x.lineWidth = 1.3; x.stroke();
    x.fillStyle = 'rgba(255,90,110,.45)'; ell(x, -2, -63, 3, 1.8); x.fill();
  } };
  EN.janitor = { w: 84, h: 98, ax: 42, ay: 90, draw: function (x, f) {
    shadow(x, 19, 6, 0.32);
    [[-7, f ? -2 : 0], [7, f ? 0 : -2]].forEach(function (l) { rrect(x, l[0] - 5, -24 + l[1], 10, 22, 3); x.fillStyle = lin(x, 0, 0, 10, 0, [[0, '#3c5d9a'], [1, '#27406e']]); x.fill(); x.strokeStyle = '#162647'; x.lineWidth = 1.5; x.stroke(); rrect(x, l[0] - 6, -6 + l[1], 13, 6, 2.5); x.fillStyle = '#2a2a2a'; x.fill(); });
    // 걸레 자루 (뒤)
    x.save(); x.translate(20, -40); x.rotate(0.3 + (f ? 0.15 : 0));
    rrect(x, -1.8, -34, 3.6, 62, 1.8); x.fillStyle = lin(x, -2, 0, 2, 0, [[0, '#e8c07a'], [1, '#a47a3c']]); x.fill(); x.strokeStyle = '#6a4a1e'; x.lineWidth = 1; x.stroke();
    x.beginPath(); x.moveTo(-3, 26); x.quadraticCurveTo(-11, 34, -10, 42); x.lineTo(10, 42); x.quadraticCurveTo(11, 34, 3, 26); x.closePath();
    x.fillStyle = lin(x, -10, 0, 10, 0, [[0, '#f4f0e4'], [1, '#b8b2a0']]); x.fill(); x.strokeStyle = '#6a6452'; x.lineWidth = 1.2; x.stroke();
    for (var i = -3; i <= 3; i++) { line(x, [i * 2, 32, i * 2.6, 41], 'rgba(120,110,90,.6)', 0.9); }
    rrect(x, -4, 24, 8, 4, 1); x.fillStyle = '#3a6ad8'; x.fill();
    x.restore();
    // 작업복
    x.beginPath(); x.moveTo(-17, -58); x.quadraticCurveTo(0, -62, 17, -58); x.lineTo(19, -22); x.quadraticCurveTo(0, -18, -19, -22); x.closePath();
    x.fillStyle = lin(x, -19, 0, 19, 0, [[0, '#6a92d8'], [0.55, '#4671bf'], [1, '#2d4f91']]); x.fill(); x.strokeStyle = '#162647'; x.lineWidth = 2; x.stroke();
    rrect(x, -9, -50, 18, 12, 2); x.fillStyle = 'rgba(20,40,80,.25)'; x.fill();
    rrect(x, -5, -48, 10, 5, 1); x.fillStyle = '#ffe14a'; x.fill();
    // 팔 + 노란 장갑
    [[-1, 0], [1, 1]].forEach(function (a) { var s = a[0]; x.beginPath(); x.moveTo(s * 15, -55); x.quadraticCurveTo(s * 23, -46, s * 20, -36); x.lineWidth = 8; x.strokeStyle = '#162647'; x.stroke(); x.lineWidth = 6; x.strokeStyle = '#5a82cc'; x.stroke(); circ(x, s * 20, -34, 4.6); x.fillStyle = '#ffd13a'; x.fill(); x.strokeStyle = '#a07a10'; x.lineWidth = 1.3; x.stroke(); });
    // 머리 + 방독면
    circ(x, 0, -74, 15); x.fillStyle = rad(x, -4, -80, 1, 0, -74, 16, [[0, '#7a8494'], [1, '#3a404c']]); x.fill(); x.strokeStyle = '#1e222a'; x.lineWidth = 1.8; x.stroke();
    // 모자
    x.beginPath(); x.arc(0, -78, 15.5, PI, TAU); x.closePath(); fillStroke(x, lin(x, 0, -94, 0, -78, [[0, '#5f86cf'], [1, '#2d4f91']]), '#162647', 1.6);
    x.beginPath(); x.moveTo(6, -79); x.quadraticCurveTo(18, -80, 22, -76); x.lineTo(8, -76); x.closePath(); fillStroke(x, '#2d4f91', '#162647', 1.3);
    // 고글 두 알
    [[-3, -73], [9, -73]].forEach(function (g) { circ(x, g[0], g[1], 5); x.fillStyle = rad(x, g[0] - 2, g[1] - 2, 0.5, g[0], g[1], 5.5, [[0, '#d8f4ff'], [0.5, '#6fb6d8'], [1, '#1f4a66']]); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 2; x.stroke(); x.fillStyle = 'rgba(255,255,255,.9)'; circ(x, g[0] - 1.8, g[1] - 1.8, 1.3); x.fill(); });
    // 필터 통
    x.save(); x.translate(8, -63); circ(x, 0, 0, 6); x.fillStyle = lin(x, -6, -6, 6, 6, [[0, '#b0b6c0'], [1, '#4a505a']]); x.fill(); x.strokeStyle = '#1e222a'; x.lineWidth = 1.6; x.stroke();
    for (var k = 0; k < 3; k++) { line(x, [-3.5, -2 + k * 2, 3.5, -2 + k * 2], '#2a2e36', 0.9); }
    x.restore();
  } };
  EN.sheep = { w: 84, h: 96, ax: 42, ay: 88, draw: function (x, f) {
    shadow(x, 21, 6, 0.3);
    [[-8, f ? -2 : 0], [8, f ? 0 : -2]].forEach(function (l) { rrect(x, l[0] - 5.5, -24 + l[1], 11, 16, 3); x.fillStyle = lin(x, 0, 0, 10, 0, [[0, '#ff9f7a'], [1, '#e0684a']]); x.fill(); x.strokeStyle = '#8a3a22'; x.lineWidth = 1.5; x.stroke(); rrect(x, l[0] - 4, -10 + l[1], 8, 10, 3); x.fillStyle = SKIN.base; x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.2; x.stroke(); });
    // 배 나온 몸 (찜질복)
    ell(x, 0, -38, 21, 20); x.fillStyle = lin(x, -21, 0, 21, 0, [[0, '#ffc19a'], [0.5, '#ff9d6e'], [1, '#d96a40']]); x.fill(); x.strokeStyle = '#8a3a22'; x.lineWidth = 2; x.stroke();
    x.save(); ell(x, 0, -38, 21, 20); x.clip(); line(x, [0, -58, 0, -20], 'rgba(140,60,30,.4)', 1.4); circ(x, 0, -44, 1.3); x.fillStyle = '#fff'; x.fill(); circ(x, 0, -36, 1.3); x.fill(); x.restore();
    // 팔 (식혜 컵)
    x.beginPath(); x.moveTo(-17, -48); x.quadraticCurveTo(-26, -38, -22, -28); x.lineWidth = 8; x.strokeStyle = '#8a3a22'; x.stroke(); x.lineWidth = 6; x.strokeStyle = SKIN.base; x.stroke();
    x.beginPath(); x.moveTo(17, -48); x.quadraticCurveTo(25, -48 + (f ? -4 : 0), 24, -40); x.lineWidth = 8; x.strokeStyle = '#8a3a22'; x.stroke(); x.lineWidth = 6; x.strokeStyle = SKIN.base; x.stroke();
    rrect(x, 20, -48 + (f ? -4 : 0), 9, 11, 2); x.fillStyle = lin(x, 20, 0, 29, 0, [[0, '#fff8e8'], [1, '#e6d4a8']]); x.fill(); x.strokeStyle = '#8a7446'; x.lineWidth = 1.2; x.stroke();
    // 얼굴 (동그랗고 느긋)
    circ(x, 0, -68, 14); x.fillStyle = rad(x, -4, -72, 1, 0, -68, 15, [[0, SKIN.hi], [1, SKIN.sh]]); x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.8; x.stroke();
    // 양머리 수건: 머리 위 띠 + 양옆 동그란 말이
    x.beginPath(); x.ellipse(0, -76, 15.5, 9, 0, PI, TAU); x.lineTo(15, -73); x.quadraticCurveTo(0, -70, -15, -73); x.closePath(); fillStroke(x, lin(x, 0, -86, 0, -70, [[0, '#ffffff'], [1, '#d8dce8']]), '#8890a8', 1.5);
    [[-15, -76], [15, -76]].forEach(function (b) { circ(x, b[0], b[1], 7.5); x.fillStyle = rad(x, b[0] - 2, b[1] - 3, 1, b[0], b[1], 8, [[0, '#ffffff'], [1, '#c8cee0']]); x.fill(); x.strokeStyle = '#8890a8'; x.lineWidth = 1.5; x.stroke(); x.beginPath(); x.arc(b[0], b[1], 3.8, 0, PI * 1.5); x.strokeStyle = '#a8b0c4'; x.lineWidth = 1.2; x.stroke(); });
    // 흐뭇한 눈, 콧수염
    x.beginPath(); x.moveTo(1, -67); x.quadraticCurveTo(4, -70, 7, -67); x.moveTo(9, -67); x.quadraticCurveTo(12, -70, 14, -67); x.strokeStyle = '#3a2418'; x.lineWidth = 1.8; x.stroke();
    x.beginPath(); x.moveTo(3, -61); x.quadraticCurveTo(8, -64, 13, -61); x.quadraticCurveTo(8, -59, 3, -61); x.fillStyle = '#3a2418'; x.fill();
    x.fillStyle = 'rgba(255,90,90,.45)'; ell(x, -2, -63, 3.4, 2); x.fill();
  } };
  EN.egg = { w: 50, h: 50, ax: 25, ay: 44, draw: function (x, f) {
    shadow(x, 12, 4, 0.3);
    x.save(); x.translate(0, -14); x.rotate(f ? 0.25 : -0.25);
    ell(x, 0, 0, 12, 14.5); x.fillStyle = rad(x, -4, -6, 1, 0, 0, 16, [[0, '#f5d8b0'], [0.5, '#c8905a'], [1, '#7a4a24']]); x.fill(); x.strokeStyle = '#4a2a12'; x.lineWidth = 1.8; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.6)'; ell(x, -5, -7, 3.2, 5, -0.3); x.fill();
    // 얼굴
    line(x, [0, -3, 4, -1], '#2a160a', 1.8); line(x, [7, -1, 11, -3], '#2a160a', 1.8);
    circ(x, 3, 1.5, 1.4); x.fillStyle = '#2a160a'; x.fill(); circ(x, 8.5, 1.5, 1.4); x.fill();
    x.beginPath(); x.arc(6, 7, 2.6, PI * 1.1, PI * 1.9); x.strokeStyle = '#2a160a'; x.lineWidth = 1.5; x.stroke();
    x.restore();
  } };
  EN.balloon = { w: 50, h: 76, ax: 25, ay: 70, draw: function (x, f) {
    shadow(x, 9, 3, 0.2);
    x.beginPath(); x.moveTo(0, -24); x.bezierCurveTo(f ? 4 : -4, -16, f ? -4 : 4, -8, 0, -2); x.strokeStyle = '#8a8a8a'; x.lineWidth = 1.2; x.stroke();
    x.save(); x.translate(0, -40 + (f ? -1.5 : 0));
    ell(x, 0, 0, 15, 17.5); x.fillStyle = rad(x, -5, -7, 1, 0, 0, 19, [[0, '#ffb0a8'], [0.35, '#ff4a4a'], [1, '#a8101c']]); x.fill(); x.strokeStyle = '#6a0a12'; x.lineWidth = 1.8; x.stroke();
    x.beginPath(); x.moveTo(-2.5, 17); x.lineTo(2.5, 17); x.lineTo(0, 20.5); x.closePath(); x.fillStyle = '#b01424'; x.fill();
    x.fillStyle = 'rgba(255,255,255,.75)'; ell(x, -6, -8, 3.4, 5.5, -0.5); x.fill();
    // 얄미운 얼굴
    circ(x, 1, -1, 1.8); x.fillStyle = '#2a0a0e'; x.fill(); circ(x, 8, -1, 1.8); x.fill();
    x.beginPath(); x.moveTo(0, 5); x.quadraticCurveTo(5, 10, 10, 5); x.strokeStyle = '#2a0a0e'; x.lineWidth = 1.6; x.stroke();
    x.beginPath(); x.moveTo(6, 7.5); x.quadraticCurveTo(7, 11, 9, 7); x.fillStyle = '#ff9aa8'; x.fill();
    x.restore();
  } };
  EN.gunkid = { w: 70, h: 82, ax: 35, ay: 76, draw: function (x, f) {
    shadow(x, 15, 5, 0.3);
    [[-5, f ? -2 : 0], [5, f ? 0 : -2]].forEach(function (l) { rrect(x, l[0] - 4, -18 + l[1], 8, 16, 3); x.fillStyle = '#3d6ab0'; x.fill(); x.strokeStyle = '#1e3a6a'; x.lineWidth = 1.3; x.stroke(); ell(x, l[0] + 1, -2 + l[1], 5.5, 3); x.fillStyle = '#fafafa'; x.fill(); x.strokeStyle = '#999'; x.stroke(); });
    x.beginPath(); x.moveTo(-12, -44); x.quadraticCurveTo(0, -48, 12, -44); x.lineTo(14, -18); x.quadraticCurveTo(0, -15, -14, -18); x.closePath();
    x.fillStyle = lin(x, -14, 0, 14, 0, [[0, '#ffe98a'], [0.5, '#ffd23a'], [1, '#e0a012']]); x.fill(); x.strokeStyle = '#8a6208'; x.lineWidth = 1.8; x.stroke();
    // 물총
    x.save(); x.translate(10, -32);
    rrect(x, 0, -5, 20, 8, 3); x.fillStyle = lin(x, 0, -5, 0, 3, [[0, '#8ef06a'], [1, '#2f9a2a']]); x.fill(); x.strokeStyle = '#1c5a18'; x.lineWidth = 1.4; x.stroke();
    rrect(x, 3, -12, 8, 8, 3); x.fillStyle = '#ff7a3a'; x.fill(); x.strokeStyle = '#8a3510'; x.stroke();
    rrect(x, 18, -3, 5, 4, 1); x.fillStyle = '#ffcf3a'; x.fill();
    x.restore();
    circ(x, 12, -30, 3.8); x.fillStyle = SKIN.base; x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.2; x.stroke();
    circ(x, 0, -56, 12.5); x.fillStyle = rad(x, -3, -60, 1, 0, -56, 13.5, [[0, SKIN.hi], [1, SKIN.sh]]); x.fill(); x.strokeStyle = SKIN.line; x.lineWidth = 1.6; x.stroke();
    // 거꾸로 쓴 모자
    x.beginPath(); x.arc(0, -59, 13, PI, TAU); x.closePath(); fillStroke(x, lin(x, 0, -72, 0, -59, [[0, '#ff6a5a'], [1, '#c8261a']]), '#6a1008', 1.5);
    x.beginPath(); x.moveTo(-8, -61); x.quadraticCurveTo(-18, -60, -20, -56); x.lineTo(-9, -57); x.closePath(); fillStroke(x, '#c8261a', '#6a1008', 1.3);
    // 장난스런 얼굴
    circ(x, 4, -55, 1.6); x.fillStyle = '#231510'; x.fill(); circ(x, 9.5, -55, 1.6); x.fill();
    x.beginPath(); x.moveTo(3, -50); x.quadraticCurveTo(7, -46, 11, -50); x.strokeStyle = '#231510'; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = 'rgba(160,100,60,.5)'; circ(x, -2, -52, 0.8); x.fill(); circ(x, 0, -51, 0.8); x.fill(); circ(x, -1, -53.5, 0.8); x.fill();
  } };
  EN.mascot = { w: 104, h: 118, ax: 52, ay: 110, draw: function (x, f) {
    shadow(x, 26, 8, 0.34);
    var fur = '#b87a48', furH = '#e0a870', furS = '#7a4a24', ln = '#4a2a12';
    [[-11, f ? -2 : 0], [11, f ? 0 : -2]].forEach(function (l) { ell(x, l[0], -10 + l[1], 9, 10); x.fillStyle = rad(x, l[0] - 3, -14, 1, l[0], -10, 11, [[0, furH], [1, furS]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 1.8; x.stroke(); });
    ell(x, 0, -38, 25, 24); x.fillStyle = rad(x, -8, -48, 2, 0, -38, 27, [[0, furH], [0.6, fur], [1, furS]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 2.2; x.stroke();
    ell(x, 0, -34, 14, 14); x.fillStyle = '#f0d0a8'; x.fill();
    // 팔
    [[-1], [1]].forEach(function (a) { var s = a[0]; ell(x, s * 25, -40 + (f && s > 0 ? -5 : 0), 8, 12, s * 0.5); x.fillStyle = rad(x, s * 23, -46, 1, s * 25, -40, 13, [[0, furH], [1, furS]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 1.8; x.stroke(); });
    // 큰 머리
    circ(x, 0, -80, 24); x.fillStyle = rad(x, -8, -90, 2, 0, -80, 26, [[0, furH], [0.6, fur], [1, furS]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 2.2; x.stroke();
    [[-19, -99], [19, -99]].forEach(function (e) { circ(x, e[0], e[1], 8.5); x.fillStyle = rad(x, e[0] - 2, e[1] - 2, 1, e[0], e[1], 9, [[0, furH], [1, furS]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 1.8; x.stroke(); circ(x, e[0], e[1], 4.2); x.fillStyle = '#e8a0a0'; x.fill(); });
    ell(x, 4, -72, 11, 8.5); x.fillStyle = '#f0d0a8'; x.fill(); x.strokeStyle = 'rgba(74,42,18,.4)'; x.lineWidth = 1; x.stroke();
    // 단추 눈(멍함) + 고정된 웃음
    [[-5, -84], [13, -84]].forEach(function (e) { circ(x, e[0], e[1], 4.2); x.fillStyle = '#1a1210'; x.fill(); circ(x, e[0] - 1.3, e[1] - 1.3, 1.3); x.fillStyle = '#fff'; x.fill(); });
    ell(x, 5, -75, 3.6, 2.4); x.fillStyle = '#2a1810'; x.fill();
    x.beginPath(); x.moveTo(-3, -69); x.quadraticCurveTo(5, -62, 13, -69); x.strokeStyle = '#2a1810'; x.lineWidth = 1.8; x.stroke();
    // 나비넥타이
    x.beginPath(); x.moveTo(0, -58); x.lineTo(-9, -63); x.lineTo(-9, -53); x.closePath(); x.moveTo(0, -58); x.lineTo(9, -63); x.lineTo(9, -53); x.closePath(); fillStroke(x, '#3aa6f5', '#1b2a5a', 1.4);
  } };
  EN.robot = { w: 76, h: 96, ax: 38, ay: 88, draw: function (x, f) {
    shadow(x, 17, 5, 0.3);
    [[-7, f ? -3 : 0], [7, f ? 0 : -3]].forEach(function (l) { line(x, [l[0], -18, l[0] + 1, -5 + l[1]], '#5a5e6a', 3.5); ell(x, l[0] + 2, -4 + l[1], 6, 3); x.fillStyle = '#3a3e4a'; x.fill(); });
    // 스프레이 통 몸
    rrect(x, -15, -62, 30, 46, 10); x.fillStyle = lin(x, -15, 0, 15, 0, [[0, '#f6d8ff'], [0.4, '#dca8f0'], [1, '#9a5ab8']]); x.fill(); x.strokeStyle = '#5a2a78'; x.lineWidth = 2; x.stroke();
    // 꽃 딱지
    rrect(x, -11, -44, 22, 16, 4); x.fillStyle = '#ffffff'; x.fill(); x.strokeStyle = '#b07ad0'; x.lineWidth = 1.2; x.stroke();
    for (var k = 0; k < 5; k++) { var a = k * TAU / 5; circ(x, Math.cos(a) * 3.4, -36 + Math.sin(a) * 3.4, 2.4); x.fillStyle = '#ff8ac8'; x.fill(); } circ(x, 0, -36, 1.8); x.fillStyle = '#ffd24a'; x.fill();
    // 눈 LED
    rrect(x, -10, -58, 20, 9, 4); x.fillStyle = '#2a1a3a'; x.fill();
    circ(x, -4, -53.5, 2.4); x.fillStyle = f ? '#7dfcff' : '#ff6ad8'; x.fill(); circ(x, 5, -53.5, 2.4); x.fill();
    // 뚜껑·분사구
    rrect(x, -10, -70, 20, 9, 3); x.fillStyle = lin(x, -10, 0, 10, 0, [[0, '#ffffff'], [1, '#b8b8c8']]); x.fill(); x.strokeStyle = '#5a5e6a'; x.lineWidth = 1.5; x.stroke();
    rrect(x, 2, -76, 12, 6, 2); x.fillStyle = '#ff8ac8'; x.fill(); x.strokeStyle = '#8a2a60'; x.stroke();
    // 팔
    line(x, [-15, -44, -22, -34 + (f ? -3 : 0)], '#5a5e6a', 3); line(x, [15, -44, 22, -34 + (f ? 0 : -3)], '#5a5e6a', 3);
    circ(x, -22, -33, 3); x.fillStyle = '#3a3e4a'; x.fill(); circ(x, 22, -33, 3); x.fill();
  } };
  EN.skunk = { w: 76, h: 70, ax: 38, ay: 62, draw: function (x, f) {
    shadow(x, 16, 5, 0.3);
    var blk = '#2a2638', ln = '#110f18';
    // 큰 꼬리 (뒤)
    x.beginPath(); x.moveTo(-10, -12); x.bezierCurveTo(-34, -10, -34, -44, -18 + (f ? -3 : 0), -50); x.bezierCurveTo(-8, -52, -4, -40, -12, -34); x.bezierCurveTo(-20, -30, -18, -20, -4, -16); x.closePath();
    x.fillStyle = lin(x, -30, -50, -4, -12, [[0, '#4a445e'], [1, blk]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 1.8; x.stroke();
    x.beginPath(); x.moveTo(-24, -20); x.bezierCurveTo(-28, -36, -22, -46, -16 + (f ? -3 : 0), -47); x.strokeStyle = '#f4f4fa'; x.lineWidth = 5; x.stroke();
    // 몸
    ell(x, 2, -16, 14, 10); x.fillStyle = rad(x, -2, -20, 1, 2, -16, 15, [[0, '#4a445e'], [1, blk]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 1.6; x.stroke();
    [[-6, f ? -2 : 0], [8, f ? 0 : -2]].forEach(function (l) { ell(x, l[0], -5 + l[1], 3.5, 4); x.fillStyle = blk; x.fill(); });
    // 머리
    circ(x, 12, -26, 10); x.fillStyle = rad(x, 9, -30, 1, 12, -26, 11, [[0, '#4a445e'], [1, blk]]); x.fill(); x.strokeStyle = ln; x.lineWidth = 1.6; x.stroke();
    line(x, [11, -36, 14, -24], '#f4f4fa', 3.4);
    circ(x, 5, -34, 3.5); x.fillStyle = blk; x.fill(); circ(x, 18, -34, 3.5); x.fill();
    circ(x, 8.5, -26, 2); x.fillStyle = '#fff'; x.fill(); circ(x, 8.8, -25.8, 1.2); x.fillStyle = '#111'; x.fill();
    circ(x, 16.5, -26, 2); x.fillStyle = '#fff'; x.fill(); circ(x, 16.8, -25.8, 1.2); x.fillStyle = '#111'; x.fill();
    ell(x, 21, -22, 2, 1.5); x.fillStyle = '#ff8aa8'; x.fill();
  } };

  // ─────────────────────────── 보스 ───────────────────────────
  // 기존 적 그림을 크게 + 왕관·장비를 얹는다
  function crown(x, cx, cy, s) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    x.beginPath(); x.moveTo(-10, 0); x.lineTo(-11, -10); x.lineTo(-5, -5); x.lineTo(0, -13); x.lineTo(5, -5); x.lineTo(11, -10); x.lineTo(10, 0); x.closePath();
    x.fillStyle = lin(x, 0, -13, 0, 0, [[0, '#fff27a'], [0.5, '#ffc23a'], [1, '#d88a10']]); x.fill(); x.strokeStyle = '#7a4a06'; x.lineWidth = 1.4; x.stroke();
    circ(x, 0, -5, 1.8); x.fillStyle = '#ff3a5a'; x.fill(); circ(x, -6, -3, 1.2); x.fillStyle = '#3ad0ff'; x.fill(); circ(x, 6, -3, 1.2); x.fill();
    x.restore();
  }
  var BS = {};
  BS.kingpigeon = { base: 'pigeon', sc: 3.2, extra: function (x) { crown(x, 13 * 3.2, -40 * 3.2, 3); } };
  BS.maskboss = { base: 'janitor', sc: 2.5, extra: function (x) {
    // 빨간 안전모
    x.beginPath(); x.arc(0, -78 * 2.5, 16.5 * 2.5, PI, TAU); x.closePath(); fillStroke(x, lin(x, 0, -120 * 2.5 / 1.2, 0, -78 * 2.5, [[0, '#ff7a5a'], [1, '#c8261a']]), '#5a0a04', 4);
    rrect(x, -8 * 2.5, -96 * 2.5, 16 * 2.5, 5 * 2.5, 6); x.fillStyle = '#ffe14a'; x.fill();
  } };
  BS.kingegg = { base: 'egg', sc: 4.4, extra: function (x) {
    // 금 간 자국 + 김
    line(x, [-30, -80, -20, -70, -26, -60, -16, -52], '#3a1a08', 3);
    line(x, [24, -100, 18, -88, 26, -80], '#3a1a08', 3);
    crown(x, 0, -128, 3.2);
  } };
  BS.bearboss = { base: 'mascot', sc: 2.3, extra: function (x) { crown(x, 0, -104 * 2.3 - 6, 3.4); } };
  BS.skunkking = { base: 'skunk', sc: 3.4, extra: function (x) {
    // 망토
    crown(x, 12 * 3.4, -38 * 3.4, 3.2);
  } };

  // ─────────────────────────── 음식·아이템 아이콘 (64x64) ───────────────────────────
  var IC = {};
  function glossy(x, cx, cy, rx, ry, a) { x.fillStyle = 'rgba(255,255,255,' + (a || 0.55) + ')'; ell(x, cx, cy, rx, ry, -0.5); x.fill(); }
  IC.goguma = function (x) {
    x.save(); x.translate(32, 34); x.rotate(-0.45);
    ell(x, 0, 0, 25, 13); x.fillStyle = lin(x, 0, -13, 0, 13, [[0, '#d0568a'], [0.5, '#a3345e'], [1, '#6a1c3c']]); x.fill(); x.strokeStyle = '#3e0c22'; x.lineWidth = 2.4; x.stroke();
    // 잘린 면 (노란 속)
    ell(x, 19, 0, 6, 11); x.fillStyle = rad(x, 18, -2, 1, 19, 0, 10, [[0, '#fff2a8'], [1, '#f4b83a']]); x.fill(); x.strokeStyle = '#8a4a10'; x.lineWidth = 1.6; x.stroke();
    line(x, [-12, -6, -8, -4], 'rgba(60,10,30,.6)', 1.4); line(x, [0, 5, 4, 7], 'rgba(60,10,30,.6)', 1.4); line(x, [-18, 3, -15, 5], 'rgba(60,10,30,.6)', 1.4);
    glossy(x, -6, -6, 9, 2.6, 0.4);
    x.beginPath(); x.moveTo(-24, 0); x.quadraticCurveTo(-30, -2, -31, -6); x.strokeStyle = '#6a1c3c'; x.lineWidth = 2; x.stroke();
    x.restore();
  };
  IC.cabbage = function (x) {
    circ(x, 32, 35, 22); x.fillStyle = rad(x, 26, 28, 2, 32, 35, 24, [[0, '#e8ffc0'], [0.5, '#9ee06a'], [1, '#4a9a2a']]); x.fill(); x.strokeStyle = '#255a14'; x.lineWidth = 2.4; x.stroke();
    x.strokeStyle = 'rgba(40,110,30,.7)'; x.lineWidth = 1.8;
    x.beginPath(); x.arc(32, 50, 20, PI * 1.15, PI * 1.85); x.stroke();
    x.beginPath(); x.arc(20, 36, 14, PI * 1.6, PI * 0.2); x.stroke();
    x.beginPath(); x.arc(44, 36, 14, PI * 0.8, PI * 1.4); x.stroke();
    line(x, [32, 16, 32, 44], 'rgba(230,255,200,.9)', 2); line(x, [32, 30, 22, 24], 'rgba(230,255,200,.8)', 1.4); line(x, [32, 34, 42, 28], 'rgba(230,255,200,.8)', 1.4);
    glossy(x, 24, 24, 6, 3, 0.4);
  };
  IC.chung = function (x) {
    // 뚝배기 + 김
    ell(x, 32, 36, 24, 8); x.fillStyle = '#3a2a1e'; x.fill();
    x.beginPath(); x.moveTo(8, 36); x.quadraticCurveTo(10, 58, 32, 58); x.quadraticCurveTo(54, 58, 56, 36); x.closePath(); x.fillStyle = lin(x, 8, 0, 56, 0, [[0, '#6a4a3a'], [0.4, '#4a3024'], [1, '#22140c']]); x.fill(); x.strokeStyle = '#140a04'; x.lineWidth = 2.4; x.stroke();
    ell(x, 32, 36, 21, 6.5); x.fillStyle = rad(x, 30, 35, 1, 32, 36, 21, [[0, '#c8904a'], [1, '#7a4a1a']]); x.fill();
    [[24, 35], [34, 37], [40, 34], [28, 38]].forEach(function (b) { circ(x, b[0], b[1], 2.4); x.fillStyle = '#e8c070'; x.fill(); x.strokeStyle = '#6a3a10'; x.lineWidth = 0.8; x.stroke(); });
    line(x, [26, 36, 30, 33], '#4ab83a', 2); line(x, [38, 37, 42, 35], '#4ab83a', 2);
    x.strokeStyle = 'rgba(160,180,120,.85)'; x.lineWidth = 3;
    [[22, 0], [32, 3], [42, -2]].forEach(function (s) { x.beginPath(); x.moveTo(s[0], 28); x.bezierCurveTo(s[0] - 6, 22, s[0] + 6, 16, s[0] + s[1], 8); x.stroke(); });
    glossy(x, 18, 44, 4, 2, 0.3);
  };
  IC.cola = function (x) {
    // 유리병 + 빨간 띠 (상표 없음)
    x.beginPath(); x.moveTo(27, 6); x.lineTo(37, 6); x.lineTo(37, 14); x.quadraticCurveTo(46, 24, 44, 36); x.quadraticCurveTo(46, 50, 42, 58); x.lineTo(22, 58); x.quadraticCurveTo(18, 50, 20, 36); x.quadraticCurveTo(18, 24, 27, 14); x.closePath();
    x.fillStyle = lin(x, 18, 0, 46, 0, [[0, '#6a2a14'], [0.3, '#3a1408'], [1, '#1a0804']]); x.fill(); x.strokeStyle = '#0a0402'; x.lineWidth = 2.2; x.stroke();
    rrect(x, 19, 32, 26, 10, 2); x.fillStyle = lin(x, 0, 32, 0, 42, [[0, '#ff4a4a'], [1, '#c01818']]); x.fill();
    line(x, [22, 37, 42, 37], '#ffffff', 1.8);
    rrect(x, 26, 3, 12, 5, 1.5); x.fillStyle = lin(x, 26, 0, 38, 0, [[0, '#f0f0f0'], [1, '#909090']]); x.fill(); x.strokeStyle = '#555'; x.lineWidth = 1; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.45)'; rrect(x, 23, 16, 3, 36, 1.5); x.fill();
    [[36, 22, 1.4], [33, 48, 1.2], [38, 52, 1.6]].forEach(function (b) { circ(x, b[0], b[1], b[2]); x.fillStyle = 'rgba(255,220,200,.6)'; x.fill(); });
  };
  IC.milk = function (x) {
    // 우유갑
    x.beginPath(); x.moveTo(16, 22); x.lineTo(32, 10); x.lineTo(48, 22); x.lineTo(48, 58); x.lineTo(16, 58); x.closePath();
    x.fillStyle = lin(x, 16, 0, 48, 0, [[0, '#ffffff'], [0.6, '#eef2fa'], [1, '#c8d0e0']]); x.fill(); x.strokeStyle = '#5a6a8a'; x.lineWidth = 2.2; x.stroke();
    x.beginPath(); x.moveTo(16, 22); x.lineTo(48, 22); x.strokeStyle = '#5a6a8a'; x.lineWidth = 1.5; x.stroke();
    x.beginPath(); x.moveTo(28, 10); x.lineTo(36, 10); x.lineTo(36, 4); x.lineTo(28, 4); x.closePath(); x.fillStyle = '#fff'; x.fill(); x.stroke();
    rrect(x, 16, 32, 32, 16, 0); x.fillStyle = lin(x, 0, 32, 0, 48, [[0, '#5ab0ff'], [1, '#2a70d8']]); x.fill();
    // 젖소 무늬
    ell(x, 24, 40, 4, 3); x.fillStyle = '#fff'; x.fill(); ell(x, 38, 42, 5, 3.5); x.fill();
    ell(x, 22, 53, 3, 2); x.fillStyle = '#2a2a3a'; x.fill(); ell(x, 41, 26, 3, 2); x.fill();
  };
  IC.buldak = function (x) {
    // 빨간 컵라면 + 불꽃
    x.beginPath(); x.moveTo(12, 24); x.lineTo(52, 24); x.lineTo(46, 58); x.lineTo(18, 58); x.closePath();
    x.fillStyle = lin(x, 12, 0, 52, 0, [[0, '#ff6a4a'], [0.5, '#e02a1a'], [1, '#9a1208']]); x.fill(); x.strokeStyle = '#4a0602'; x.lineWidth = 2.2; x.stroke();
    ell(x, 32, 24, 20, 5); x.fillStyle = '#2a1a1a'; x.fill(); x.strokeStyle = '#4a0602'; x.lineWidth = 2; x.stroke();
    // 컵의 불꽃 그림
    x.beginPath(); x.moveTo(32, 52); x.bezierCurveTo(22, 48, 26, 38, 30, 34); x.bezierCurveTo(30, 40, 34, 40, 34, 36); x.bezierCurveTo(40, 40, 42, 48, 32, 52); x.fillStyle = '#ffd23a'; x.fill();
    // 위로 솟는 불
    x.beginPath(); x.moveTo(20, 20); x.bezierCurveTo(16, 10, 24, 6, 24, 0); x.bezierCurveTo(30, 6, 28, 12, 32, 12); x.bezierCurveTo(34, 6, 40, 4, 40, 0); x.bezierCurveTo(46, 8, 46, 16, 44, 20); x.closePath();
    x.fillStyle = lin(x, 0, 0, 0, 20, [[0, '#ffe066'], [0.5, '#ff8a1a'], [1, '#ff3a1a']]); x.fill();
  };
  IC.egg = function (x) {
    ell(x, 32, 34, 17, 22); x.fillStyle = rad(x, 25, 24, 2, 32, 34, 24, [[0, '#ffffff'], [0.6, '#f4efe4'], [1, '#c8bca4']]); x.fill(); x.strokeStyle = '#7a6a4a'; x.lineWidth = 2.2; x.stroke();
    // 썩은 냄새 줄기
    x.strokeStyle = 'rgba(140,200,60,.9)'; x.lineWidth = 2.6;
    [[44, 18], [50, 28]].forEach(function (s) { x.beginPath(); x.moveTo(s[0], s[1]); x.bezierCurveTo(s[0] + 6, s[1] - 4, s[0] + 2, s[1] - 10, s[0] + 8, s[1] - 14); x.stroke(); });
    glossy(x, 25, 24, 5, 7, 0.7);
    line(x, [26, 46, 30, 42, 34, 46, 38, 42], 'rgba(120,100,60,.6)', 1.4);
  };
  IC.beondegi = function (x) {
    // 종이컵 + 번데기
    x.beginPath(); x.moveTo(14, 28); x.lineTo(50, 28); x.lineTo(45, 58); x.lineTo(19, 58); x.closePath();
    x.fillStyle = lin(x, 14, 0, 50, 0, [[0, '#ffffff'], [1, '#d8d0c0']]); x.fill(); x.strokeStyle = '#7a6a50'; x.lineWidth = 2; x.stroke();
    line(x, [16, 40, 48, 40], '#e8584a', 3);
    [[22, 26], [30, 22], [38, 25], [44, 27], [26, 30], [34, 29]].forEach(function (b, i) {
      x.save(); x.translate(b[0], b[1]); x.rotate(i * 0.7);
      ell(x, 0, 0, 5.5, 3.6); x.fillStyle = rad(x, -2, -1, 0.5, 0, 0, 6, [[0, '#c8904a'], [1, '#5a3010']]); x.fill(); x.strokeStyle = '#3a1a06'; x.lineWidth = 1; x.stroke();
      line(x, [-2, -3, -2, 3], 'rgba(40,20,4,.6)', 0.8); line(x, [1, -3.3, 1, 3.3], 'rgba(40,20,4,.6)', 0.8);
      x.restore();
    });
    x.fillStyle = 'rgba(255,255,255,.6)'; rrect(x, 18, 44, 3, 11, 1.5); x.fill();
  };
  IC.kimchi = function (x) {
    ell(x, 32, 48, 26, 9); x.fillStyle = lin(x, 0, 40, 0, 58, [[0, '#ffffff'], [1, '#c8d0dc']]); x.fill(); x.strokeStyle = '#6a7488'; x.lineWidth = 2; x.stroke();
    // 배추김치 결
    x.beginPath(); x.moveTo(12, 44); x.bezierCurveTo(14, 20, 34, 12, 52, 26); x.bezierCurveTo(54, 36, 48, 46, 40, 48); x.lineTo(16, 48); x.closePath();
    x.fillStyle = lin(x, 12, 20, 52, 48, [[0, '#ff7a4a'], [0.5, '#e8321a'], [1, '#a81a0a']]); x.fill(); x.strokeStyle = '#5a0a02'; x.lineWidth = 2.2; x.stroke();
    x.strokeStyle = 'rgba(255,240,200,.85)'; x.lineWidth = 3.4;
    x.beginPath(); x.moveTo(18, 44); x.quadraticCurveTo(26, 28, 44, 24); x.stroke();
    x.lineWidth = 2; x.beginPath(); x.moveTo(26, 46); x.quadraticCurveTo(34, 36, 48, 34); x.stroke();
    [[22, 34], [36, 20], [44, 40], [30, 42]].forEach(function (p) { circ(x, p[0], p[1], 1.2); x.fillStyle = '#8a0a02'; x.fill(); });
    line(x, [40, 20, 46, 14], '#3aa82a', 2.4);
  };
  IC.garlic = function (x) {
    x.beginPath(); x.moveTo(32, 8); x.bezierCurveTo(28, 16, 12, 22, 12, 38); x.bezierCurveTo(12, 54, 24, 58, 32, 58); x.bezierCurveTo(40, 58, 52, 54, 52, 38); x.bezierCurveTo(52, 22, 36, 16, 32, 8); x.closePath();
    x.fillStyle = rad(x, 24, 30, 2, 32, 38, 26, [[0, '#ffffff'], [0.6, '#f4ece0'], [1, '#c8b8a0']]); x.fill(); x.strokeStyle = '#7a6448'; x.lineWidth = 2.2; x.stroke();
    x.strokeStyle = 'rgba(150,120,90,.7)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(32, 12); x.quadraticCurveTo(24, 34, 26, 57); x.stroke();
    x.beginPath(); x.moveTo(32, 12); x.quadraticCurveTo(40, 34, 38, 57); x.stroke();
    x.strokeStyle = 'rgba(200,120,180,.5)'; x.beginPath(); x.moveTo(18, 32); x.quadraticCurveTo(16, 44, 20, 52); x.stroke();
    line(x, [26, 58, 24, 62], '#a89070', 1); line(x, [32, 58, 32, 62], '#a89070', 1); line(x, [38, 58, 40, 62], '#a89070', 1);
    glossy(x, 22, 30, 3, 6, 0.6);
  };
  IC.soda = function (x) {
    x.beginPath(); x.moveTo(26, 6); x.lineTo(38, 6); x.lineTo(38, 16); x.quadraticCurveTo(46, 22, 46, 32); x.lineTo(46, 56); x.quadraticCurveTo(46, 60, 42, 60); x.lineTo(22, 60); x.quadraticCurveTo(18, 60, 18, 56); x.lineTo(18, 32); x.quadraticCurveTo(18, 22, 26, 16); x.closePath();
    x.fillStyle = lin(x, 18, 0, 46, 0, [[0, 'rgba(200,255,230,.95)'], [0.5, 'rgba(120,220,190,.9)'], [1, 'rgba(60,160,140,.95)']]); x.fill(); x.strokeStyle = '#1e6a5a'; x.lineWidth = 2.2; x.stroke();
    rrect(x, 25, 2, 14, 6, 2); x.fillStyle = '#3aa6f5'; x.fill(); x.strokeStyle = '#1b2a5a'; x.lineWidth = 1.2; x.stroke();
    rrect(x, 18, 34, 28, 12, 0); x.fillStyle = 'rgba(255,255,255,.8)'; x.fill();
    line(x, [22, 40, 42, 40], '#3aa6f5', 2.4);
    [[26, 52, 2], [34, 50, 1.4], [40, 54, 1.8], [30, 26, 1.6], [38, 22, 1.2], [24, 30, 1]].forEach(function (b) { circ(x, b[0], b[1], b[2]); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 1; x.stroke(); });
    x.fillStyle = 'rgba(255,255,255,.5)'; rrect(x, 21, 20, 3, 36, 1.5); x.fill();
  };
  IC.mentos = function (x) {
    // 민트 사탕 한 줄 (포장 없이 알맹이)
    rrect(x, 8, 22, 48, 20, 10); x.fillStyle = lin(x, 0, 22, 0, 42, [[0, '#8ae0ff'], [1, '#2a8ad8']]); x.fill(); x.strokeStyle = '#123a6a'; x.lineWidth = 2; x.stroke();
    line(x, [14, 32, 50, 32], 'rgba(255,255,255,.5)', 1.6);
    [[20, 50], [36, 52], [46, 46]].forEach(function (m) {
      ell(x, m[0], m[1], 8.5, 6); x.fillStyle = rad(x, m[0] - 2, m[1] - 2, 0.5, m[0], m[1], 9, [[0, '#ffffff'], [1, '#d0d8e4']]); x.fill(); x.strokeStyle = '#7a8498'; x.lineWidth = 1.4; x.stroke();
    });
    ell(x, 30, 14, 8.5, 6); x.fillStyle = rad(x, 28, 12, 0.5, 30, 14, 9, [[0, '#ffffff'], [1, '#d0d8e4']]); x.fill(); x.strokeStyle = '#7a8498'; x.lineWidth = 1.4; x.stroke();
  };
  IC.cereal = function (x) {
    ell(x, 32, 34, 26, 8); x.fillStyle = '#fff8e8'; x.fill();
    x.beginPath(); x.moveTo(6, 34); x.quadraticCurveTo(8, 58, 32, 58); x.quadraticCurveTo(56, 58, 58, 34); x.closePath(); x.fillStyle = lin(x, 6, 0, 58, 0, [[0, '#ffe066'], [0.5, '#ffae2e'], [1, '#e0781a']]); x.fill(); x.strokeStyle = '#7a3a06'; x.lineWidth = 2.2; x.stroke();
    ell(x, 32, 34, 24, 7); x.fillStyle = '#fffaf0'; x.fill();
    [[18, 30], [26, 28], [34, 30], [42, 28], [48, 32], [22, 34], [38, 34], [30, 26]].forEach(function (c, i) {
      ell(x, c[0], c[1], 4, 2.8, i); x.fillStyle = i % 2 ? '#ffc84a' : '#e8962a'; x.fill(); x.strokeStyle = '#8a4a0a'; x.lineWidth = 0.9; x.stroke();
    });
    ell(x, 32, 34, 26, 8); x.strokeStyle = '#7a3a06'; x.lineWidth = 2; x.stroke();
  };
  IC.lighter = function (x) {
    rrect(x, 18, 22, 26, 36, 5); x.fillStyle = lin(x, 18, 0, 44, 0, [[0, '#ff7a8a'], [0.5, '#e8324a'], [1, '#a01428']]); x.fill(); x.strokeStyle = '#4a0610'; x.lineWidth = 2.2; x.stroke();
    rrect(x, 20, 14, 22, 10, 2); x.fillStyle = lin(x, 20, 0, 42, 0, [[0, '#f0f0f4'], [1, '#8a8a96']]); x.fill(); x.strokeStyle = '#3a3a44'; x.lineWidth = 1.6; x.stroke();
    circ(x, 36, 18, 3.5); x.fillStyle = '#5a5a66'; x.fill();
    x.beginPath(); x.moveTo(26, 13); x.bezierCurveTo(20, 6, 26, 2, 27, -2); x.bezierCurveTo(32, 4, 34, 8, 30, 13); x.closePath(); x.fillStyle = lin(x, 0, -2, 0, 13, [[0, '#fff27a'], [1, '#ff6a1a']]); x.fill();
    x.fillStyle = 'rgba(255,255,255,.4)'; rrect(x, 21, 26, 4, 28, 2); x.fill();
  };
  // 진화(합체) 아이콘
  IC.rocket = function (x) {
    x.save(); x.translate(32, 32); x.rotate(-0.8);
    x.beginPath(); x.moveTo(0, -26); x.bezierCurveTo(10, -16, 10, 6, 8, 14); x.lineTo(-8, 14); x.bezierCurveTo(-10, 6, -10, -16, 0, -26); x.closePath();
    x.fillStyle = lin(x, -10, 0, 10, 0, [[0, '#ffffff'], [0.5, '#e0e4f0'], [1, '#8a92aa']]); x.fill(); x.strokeStyle = '#2a2e44'; x.lineWidth = 2.2; x.stroke();
    circ(x, 0, -8, 4.5); x.fillStyle = rad(x, -1.5, -9.5, 0.5, 0, -8, 5, [[0, '#d8f4ff'], [1, '#2a8ad8']]); x.fill(); x.strokeStyle = '#1b2a5a'; x.lineWidth = 1.6; x.stroke();
    x.beginPath(); x.moveTo(-8, 4); x.lineTo(-15, 16); x.lineTo(-8, 14); x.closePath(); x.moveTo(8, 4); x.lineTo(15, 16); x.lineTo(8, 14); x.closePath(); x.fillStyle = '#e8324a'; x.fill(); x.strokeStyle = '#4a0610'; x.lineWidth = 1.4; x.stroke();
    x.beginPath(); x.moveTo(-6, 15); x.quadraticCurveTo(0, 36, 6, 15); x.fillStyle = lin(x, 0, 15, 0, 34, [[0, '#fff27a'], [0.5, '#9ee06a'], [1, 'rgba(120,200,80,0)']]); x.fill();
    x.restore();
  };
  IC.fire = function (x) {
    x.beginPath(); x.moveTo(32, 60); x.bezierCurveTo(10, 58, 8, 36, 20, 24); x.bezierCurveTo(20, 34, 26, 36, 28, 30); x.bezierCurveTo(24, 18, 30, 8, 38, 4); x.bezierCurveTo(36, 16, 50, 22, 50, 38); x.bezierCurveTo(52, 52, 44, 60, 32, 60); x.closePath();
    x.fillStyle = lin(x, 0, 4, 0, 60, [[0, '#fff27a'], [0.35, '#ffae2e'], [0.7, '#ff5a1a'], [1, '#c81a0a']]); x.fill(); x.strokeStyle = '#6a0a02'; x.lineWidth = 2.2; x.stroke();
    x.beginPath(); x.moveTo(32, 56); x.bezierCurveTo(22, 54, 22, 44, 28, 38); x.bezierCurveTo(30, 44, 34, 44, 34, 40); x.bezierCurveTo(40, 44, 42, 54, 32, 56); x.fillStyle = '#fff6c0'; x.fill();
  };
  IC.cerealbomb = function (x) {
    circ(x, 32, 36, 20); x.fillStyle = rad(x, 26, 30, 2, 32, 36, 22, [[0, '#ffffff'], [0.6, '#eef2fa'], [1, '#aab4c8']]); x.fill(); x.strokeStyle = '#3a4460'; x.lineWidth = 2.4; x.stroke();
    rrect(x, 28, 10, 8, 8, 2); x.fillStyle = '#5a6278'; x.fill();
    x.beginPath(); x.moveTo(32, 10); x.quadraticCurveTo(38, 2, 44, 4); x.strokeStyle = '#8a6a3a'; x.lineWidth = 2; x.stroke(); star(x, 45, 4, 5, '#ffe066');
    [[10, 50], [54, 48], [8, 26], [56, 24], [30, 60]].forEach(function (c, i) { ell(x, c[0], c[1], 4.5, 3, i); x.fillStyle = '#ffc84a'; x.fill(); x.strokeStyle = '#8a4a0a'; x.lineWidth = 1; x.stroke(); });
    ell(x, 32, 40, 10, 6); x.fillStyle = '#5ab0ff'; x.fill();
  };
  IC.hellcloud = function (x) {
    [[20, 40, 14], [34, 32, 16], [46, 42, 12], [30, 46, 13]].forEach(function (c) { circ(x, c[0], c[1], c[2]); x.fillStyle = rad(x, c[0] - 4, c[1] - 4, 1, c[0], c[1], c[2], [[0, '#e0a8ff'], [0.6, '#9a4ad8'], [1, '#5a1a8a']]); x.fill(); });
    [[20, 40, 14], [34, 32, 16], [46, 42, 12], [30, 46, 13]].forEach(function (c) { circ(x, c[0], c[1], c[2]); x.strokeStyle = '#2e0a4a'; x.lineWidth = 1.6; x.stroke(); });
    // 해골 대신 찡그린 얼굴
    line(x, [26, 34, 30, 36], '#2e0a4a', 2.2); line(x, [38, 36, 42, 34], '#2e0a4a', 2.2);
    x.beginPath(); x.moveTo(27, 44); x.quadraticCurveTo(30, 40, 33, 44); x.quadraticCurveTo(36, 48, 39, 44); x.strokeStyle = '#2e0a4a'; x.lineWidth = 2; x.stroke();
  };
  IC.spicyaura = function (x) {
    for (var i = 3; i >= 1; i--) { circ(x, 32, 32, i * 9); x.strokeStyle = i === 3 ? 'rgba(255,90,40,.5)' : i === 2 ? 'rgba(255,140,40,.75)' : '#ffd23a'; x.lineWidth = 5; x.stroke(); }
    IC.garlic2(x);
  };
  IC.garlic2 = function (x) { x.save(); x.translate(32, 34); x.scale(0.42, 0.42); x.translate(-32, -34); IC.garlic(x); x.restore(); };
  IC.machinegun = function (x) {
    [[16, 44, 10], [32, 34, 12], [48, 24, 14]].forEach(function (c) {
      [[0, 0, 1], [-0.5, 0.4, 0.7], [0.5, 0.3, 0.75]].forEach(function (o) { circ(x, c[0] + o[0] * c[2], c[1] + o[1] * c[2], c[2] * o[2]); x.fillStyle = rad(x, c[0] - 3, c[1] - 3, 1, c[0], c[1], c[2] * 1.2, [[0, '#f6ffb0'], [0.6, '#b8e05a'], [1, '#6a9a2a']]); x.fill(); x.strokeStyle = '#3a5a14'; x.lineWidth = 1.4; x.stroke(); });
    });
    line(x, [6, 56, 12, 50], '#3a5a14', 2); line(x, [4, 48, 10, 46], '#3a5a14', 2);
  };
  // 상점 아이콘
  IC.hp = function (x) { x.beginPath(); x.moveTo(32, 56); x.bezierCurveTo(6, 40, 6, 16, 20, 14); x.bezierCurveTo(28, 13, 32, 20, 32, 22); x.bezierCurveTo(32, 20, 36, 13, 44, 14); x.bezierCurveTo(58, 16, 58, 40, 32, 56); x.closePath(); x.fillStyle = lin(x, 0, 12, 0, 56, [[0, '#ff8a9a'], [0.5, '#f0364c'], [1, '#a81028']]); x.fill(); x.strokeStyle = '#4a0612'; x.lineWidth = 2.4; x.stroke(); glossy(x, 20, 24, 5, 3, 0.7); };
  IC.belly = function (x) {
    circ(x, 32, 36, 21); x.fillStyle = rad(x, 26, 30, 2, 32, 36, 23, [[0, '#fff1e6'], [0.6, '#ffdcc6'], [1, '#e8a888']]); x.fill(); x.strokeStyle = '#8a4a3a'; x.lineWidth = 2.4; x.stroke();
    x.beginPath(); x.arc(32, 38, 2.2, 0, TAU); x.strokeStyle = '#a8604a'; x.lineWidth = 1.6; x.stroke();
    [[18, 14], [28, 8], [44, 12]].forEach(function (b, i) { circ(x, b[0], b[1], 4 + i); x.fillStyle = 'rgba(170,220,90,.85)'; x.fill(); x.strokeStyle = '#4a7a1a'; x.lineWidth = 1.2; x.stroke(); });
  };
  IC.power = function (x) {
    // 주먹
    rrect(x, 14, 20, 34, 30, 10); x.fillStyle = lin(x, 14, 0, 48, 0, [[0, '#fff1e6'], [0.5, '#ffd0b0'], [1, '#e0987a']]); x.fill(); x.strokeStyle = '#8a4a3a'; x.lineWidth = 2.4; x.stroke();
    for (var i = 0; i < 3; i++) line(x, [22 + i * 8, 22, 22 + i * 8, 32], 'rgba(140,70,50,.7)', 1.6);
    rrect(x, 8, 30, 12, 14, 5); x.fillStyle = '#ffd0b0'; x.fill(); x.strokeStyle = '#8a4a3a'; x.lineWidth = 2; x.stroke();
    star(x, 52, 16, 7, '#ffe066'); star(x, 10, 12, 4, '#ffffff');
  };
  IC.shoe = function (x) {
    x.beginPath(); x.moveTo(10, 44); x.lineTo(12, 22); x.quadraticCurveTo(22, 18, 28, 24); x.quadraticCurveTo(40, 34, 54, 38); x.quadraticCurveTo(58, 46, 52, 50); x.lineTo(12, 50); x.closePath();
    x.fillStyle = lin(x, 0, 18, 0, 50, [[0, '#ff7a6e'], [0.6, '#e8423c'], [1, '#a8231f']]); x.fill(); x.strokeStyle = '#5a0e0c'; x.lineWidth = 2.4; x.stroke();
    rrect(x, 8, 48, 50, 6, 3); x.fillStyle = '#ffffff'; x.fill(); x.strokeStyle = '#5a0e0c'; x.lineWidth = 1.6; x.stroke();
    line(x, [26, 28, 32, 26], '#fff', 2); line(x, [30, 32, 36, 30], '#fff', 2);
    line(x, [2, 30, 8, 30], '#3aa6f5', 3); line(x, [0, 38, 6, 38], '#3aa6f5', 3);
  };
  IC.magnet = function (x) {
    x.beginPath(); x.arc(32, 30, 18, PI, TAU); x.lineTo(50, 50); x.lineTo(40, 50); x.lineTo(40, 30); x.arc(32, 30, 8, 0, PI, true); x.lineTo(24, 50); x.lineTo(14, 50); x.closePath();
    x.fillStyle = lin(x, 0, 12, 0, 50, [[0, '#ff7a8a'], [1, '#c01828']]); x.fill(); x.strokeStyle = '#4a0610'; x.lineWidth = 2.4; x.stroke();
    rrect(x, 14, 42, 10, 8, 0); x.fillStyle = '#e8ecf4'; x.fill(); x.stroke(); rrect(x, 40, 42, 10, 8, 0); x.fill(); x.stroke();
    glossy(x, 22, 20, 4, 2.4, 0.6);
  };
  IC.revive = function (x) {
    [-1, 1].forEach(function (s) { x.beginPath(); x.moveTo(32, 34); x.bezierCurveTo(32 + s * 10, 18, 32 + s * 28, 14, 32 + s * 28, 26); x.bezierCurveTo(32 + s * 24, 30, 32 + s * 26, 36, 32 + s * 18, 40); x.bezierCurveTo(32 + s * 14, 44, 32 + s * 8, 42, 32, 34); x.closePath(); x.fillStyle = lin(x, 0, 14, 0, 44, [[0, '#ffffff'], [1, '#cfe2ff']]); x.fill(); x.strokeStyle = '#3a5a9a'; x.lineWidth = 2; x.stroke(); });
    ell(x, 32, 12, 12, 4); x.strokeStyle = '#ffd23a'; x.lineWidth = 3.4; x.stroke();
    circ(x, 32, 44, 9); x.fillStyle = lin(x, 0, 36, 0, 54, [[0, '#ff8a9a'], [1, '#c01828']]); x.fill(); x.strokeStyle = '#4a0612'; x.lineWidth = 2; x.stroke();
  };
  IC.luck = function (x) {
    for (var i = 0; i < 4; i++) { x.save(); x.translate(32, 30); x.rotate(i * PI / 2 + PI / 4); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-12, -6, -10, -20, 0, -16); x.bezierCurveTo(10, -20, 12, -6, 0, 0); x.fillStyle = lin(x, 0, -20, 0, 0, [[0, '#9ef06a'], [1, '#2f9a2a']]); x.fill(); x.strokeStyle = '#155a12'; x.lineWidth = 2; x.stroke(); x.restore(); }
    x.beginPath(); x.moveTo(32, 32); x.quadraticCurveTo(36, 48, 30, 58); x.strokeStyle = '#155a12'; x.lineWidth = 3; x.stroke();
  };
  IC.reroll = function (x) {
    x.lineWidth = 6; x.strokeStyle = '#1b2a5a';
    x.beginPath(); x.arc(32, 32, 18, PI * 1.1, PI * 1.95); x.stroke(); x.beginPath(); x.arc(32, 32, 18, PI * 0.1, PI * 0.95); x.stroke();
    x.lineWidth = 3.6; x.strokeStyle = '#3aa6f5';
    x.beginPath(); x.arc(32, 32, 18, PI * 1.1, PI * 1.95); x.stroke(); x.beginPath(); x.arc(32, 32, 18, PI * 0.1, PI * 0.95); x.stroke();
    [[50, 26, 0.3], [14, 38, PI + 0.3]].forEach(function (a) { x.save(); x.translate(a[0], a[1]); x.rotate(a[2]); x.beginPath(); x.moveTo(-7, -4); x.lineTo(7, -4); x.lineTo(0, 7); x.closePath(); x.fillStyle = '#3aa6f5'; x.fill(); x.strokeStyle = '#1b2a5a'; x.lineWidth = 2; x.stroke(); x.restore(); });
  };
  IC.armor = function (x) {
    x.beginPath(); x.moveTo(32, 6); x.lineTo(52, 14); x.quadraticCurveTo(52, 44, 32, 58); x.quadraticCurveTo(12, 44, 12, 14); x.closePath();
    x.fillStyle = lin(x, 12, 0, 52, 0, [[0, '#9ad8ff'], [0.5, '#3aa6f5'], [1, '#1f5ab0']]); x.fill(); x.strokeStyle = '#122a5a'; x.lineWidth = 2.6; x.stroke();
    x.beginPath(); x.moveTo(32, 14); x.lineTo(44, 19); x.quadraticCurveTo(44, 40, 32, 49); x.quadraticCurveTo(20, 40, 20, 19); x.closePath(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; x.stroke();
  };
  IC.coin = function (x) {
    circ(x, 32, 32, 22); x.fillStyle = rad(x, 26, 24, 2, 32, 32, 24, [[0, '#fff6b0'], [0.5, '#ffd23a'], [1, '#d08a10']]); x.fill(); x.strokeStyle = '#6a3a02'; x.lineWidth = 2.6; x.stroke();
    circ(x, 32, 32, 15); x.strokeStyle = 'rgba(160,90,10,.7)'; x.lineWidth = 2; x.stroke();
    x.beginPath(); x.moveTo(26, 38); x.quadraticCurveTo(24, 24, 34, 24); x.quadraticCurveTo(42, 26, 38, 32); x.quadraticCurveTo(44, 38, 34, 40); x.strokeStyle = '#a86410'; x.lineWidth = 2.6; x.stroke();
    glossy(x, 24, 22, 5, 3, 0.7);
  };
  IC.lunch = function (x) {
    // 도시락(상자)
    rrect(x, 8, 20, 48, 34, 6); x.fillStyle = lin(x, 0, 20, 0, 54, [[0, '#ff9a5a'], [1, '#d0501a']]); x.fill(); x.strokeStyle = '#5a1a02'; x.lineWidth = 2.4; x.stroke();
    rrect(x, 6, 14, 52, 12, 5); x.fillStyle = lin(x, 0, 14, 0, 26, [[0, '#ffd06a'], [1, '#f08a2a']]); x.fill(); x.stroke();
    rrect(x, 28, 10, 8, 44, 2); x.fillStyle = '#3aa6f5'; x.fill(); x.strokeStyle = '#1b2a5a'; x.lineWidth = 1.6; x.stroke();
    ell(x, 32, 12, 9, 5); x.fillStyle = '#3aa6f5'; x.fill(); x.stroke();
    star(x, 50, 8, 6, '#fff6a8');
  };

  // ─────────────────────────── 방귀 구름·조각 ───────────────────────────
  function cloudSprite(c1, c2, c3, edge) {
    var S = 128, c = mk(S, S), x = c.getContext('2d');
    var blobs = [[64, 70, 34], [40, 72, 24], [88, 72, 25], [52, 52, 24], [78, 50, 22], [64, 40, 18], [30, 58, 15], [98, 58, 15]];
    blobs.forEach(function (b) { circ(x, b[0], b[1], b[2] + 2); x.fillStyle = edge; x.fill(); });
    blobs.forEach(function (b) { circ(x, b[0], b[1], b[2]); x.fillStyle = rad(x, b[0] - b[2] * 0.4, b[1] - b[2] * 0.45, 1, b[0], b[1], b[2], [[0, c1], [0.55, c2], [1, c3]]); x.fill(); });
    return c;
  }
  function puffSprite(c1, c2) {
    var S = 48, c = mk(S, S), x = c.getContext('2d');
    circ(x, 24, 24, 20); x.fillStyle = rad(x, 17, 16, 1, 24, 24, 21, [[0, c1], [0.6, c2], [1, 'rgba(0,0,0,0)']]); x.fill();
    return c;
  }

  // ─────────────────────────── 바닥 (스테이지 5곳) ───────────────────────────
  // 256 세계 단위 타일을 2배로 굽는다. 결·얼룩을 넣어 민짜를 피한다
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  var TILE = 256, TRES = 2;
  function tileSchool(x, R) {
    x.fillStyle = '#e2bf8c'; x.fillRect(0, 0, TILE, TILE);
    for (var i = 0; i < 260; i++) { var px = R() * TILE, py = R() * TILE; x.fillStyle = R() < 0.5 ? 'rgba(150,110,60,.18)' : 'rgba(255,245,220,.25)'; circ(x, px, py, 0.6 + R() * 1.8); x.fill(); }
    for (i = 0; i < 6; i++) { var gx = R() * TILE, gy = R() * TILE; x.fillStyle = 'rgba(160,120,70,.12)'; ell(x, gx, gy, 18 + R() * 30, 8 + R() * 14, R()); x.fill(); }
    // 잔디 풀 몇 포기
    for (i = 0; i < 7; i++) { var tx = R() * TILE, ty = R() * TILE; for (var k = 0; k < 5; k++) { line(x, [tx + k * 2 - 4, ty, tx + k * 2 - 4 + (R() - 0.5) * 4, ty - 5 - R() * 5], k % 2 ? '#6aa83a' : '#8ac850', 1.3); } }
    // 발자국 (운동화)
    for (i = 0; i < 3; i++) { var fx = R() * TILE, fy = R() * TILE; x.fillStyle = 'rgba(140,100,60,.16)'; ell(x, fx, fy, 3, 6, 0.3); x.fill(); ell(x, fx + 8, fy - 12, 3, 6, 0.3); x.fill(); }
  }
  function tileSubway(x, R) {
    x.fillStyle = '#c9ccd2'; x.fillRect(0, 0, TILE, TILE);
    var t = 32;
    for (var gy = 0; gy < TILE; gy += t) for (var gx = 0; gx < TILE; gx += t) {
      var v = 200 + Math.floor(R() * 14);
      x.fillStyle = 'rgb(' + v + ',' + (v + 2) + ',' + (v + 6) + ')'; x.fillRect(gx + 1, gy + 1, t - 2, t - 2);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(gx + 1, gy + 1, t - 2, 2);
    }
    // 노란 점자 블록 줄
    x.fillStyle = '#f4c21a'; x.fillRect(96, 0, 32, TILE);
    for (var yy = 4; yy < TILE; yy += 8) for (var xx = 100; xx < 128; xx += 8) { circ(x, xx + 2, yy, 2); x.fillStyle = '#d8a40a'; x.fill(); }
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(96, 0, 2, TILE); x.fillRect(126, 0, 2, TILE);
    for (var i = 0; i < 5; i++) { x.fillStyle = 'rgba(80,80,90,.12)'; ell(x, R() * TILE, R() * TILE, 6 + R() * 10, 4 + R() * 6, R()); x.fill(); }
    for (i = 0; i < 4; i++) { circ(x, R() * TILE, R() * TILE, 2 + R() * 2); x.fillStyle = 'rgba(60,60,70,.3)'; x.fill(); }   // 껌 자국
  }
  function tileSauna(x, R) {
    // 맥반석 황토 바닥 + 대나무 돗자리
    x.fillStyle = '#d99a62'; x.fillRect(0, 0, TILE, TILE);
    for (var gy = 0; gy < TILE; gy += 64) for (var gx = 0; gx < TILE; gx += 64) {
      x.fillStyle = lin(x, gx, gy, gx + 64, gy + 64, [[0, '#e8b07a'], [1, '#c98650']]); x.fillRect(gx + 1.5, gy + 1.5, 61, 61);
      x.strokeStyle = 'rgba(120,60,20,.35)'; x.lineWidth = 1.5; x.strokeRect(gx + 1.5, gy + 1.5, 61, 61);
    }
    x.fillStyle = lin(x, 0, 0, TILE, 0, [[0, '#d8c07a'], [1, '#c4aa62']]); x.fillRect(0, 150, TILE, 60);
    for (var k = 0; k < TILE; k += 6) { x.fillStyle = k % 12 ? 'rgba(120,90,30,.25)' : 'rgba(255,240,190,.3)'; x.fillRect(k, 150, 2, 60); }
    x.fillStyle = 'rgba(90,60,20,.25)'; x.fillRect(0, 150, TILE, 2); x.fillRect(0, 208, TILE, 2);
    for (var i = 0; i < 40; i++) { circ(x, R() * TILE, R() * 150, 1 + R() * 2); x.fillStyle = 'rgba(255,230,190,.25)'; x.fill(); }
  }
  function tilePark(x, R) {
    x.fillStyle = '#e4ded2'; x.fillRect(0, 0, TILE, TILE);
    // 알록달록 보도블록
    var cols = ['#f2b4a8', '#f6d88a', '#b8dcf0', '#c8e6b0', '#e8e2d6', '#e8e2d6', '#e8e2d6'];
    for (var gy = 0; gy < TILE; gy += 16) for (var gx = (gy / 16) % 2 ? -16 : 0; gx < TILE; gx += 32) {
      x.fillStyle = cols[Math.floor(R() * cols.length)]; rrect(x, gx + 1, gy + 1, 30, 14, 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(gx + 2, gy + 1.5, 28, 1.5);
    }
    for (var i = 0; i < 10; i++) { var px = R() * TILE, py = R() * TILE; ell(x, px, py, 2.6, 2, R()); x.fillStyle = '#fff8e0'; x.fill(); x.strokeStyle = 'rgba(200,160,80,.6)'; x.lineWidth = 0.8; x.stroke(); }  // 팝콘
    for (i = 0; i < 3; i++) { var cx = R() * TILE, cy = R() * TILE; x.fillStyle = ['#ff6a8a', '#3aa6f5', '#ffd23a'][i]; x.save(); x.translate(cx, cy); x.rotate(R() * 3); x.fillRect(-3, -1.5, 6, 3); x.restore(); }  // 색종이
  }
  function tileLab(x, R) {
    x.fillStyle = '#9aa4b4'; x.fillRect(0, 0, TILE, TILE);
    for (var gy = 0; gy < TILE; gy += 64) for (var gx = 0; gx < TILE; gx += 64) {
      x.fillStyle = lin(x, gx, gy, gx + 64, gy + 64, [[0, '#b8c2d0'], [1, '#8a94a6']]); x.fillRect(gx + 2, gy + 2, 60, 60);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(gx + 2, gy + 2, 60, 2);
      [[6, 6], [58, 6], [6, 58], [58, 58]].forEach(function (b) { circ(x, gx + b[0], gy + b[1], 2); x.fillStyle = '#6a7486'; x.fill(); circ(x, gx + b[0] - 0.6, gy + b[1] - 0.6, 0.8); x.fillStyle = '#e8ecf4'; x.fill(); });
    }
    // 분홍 방향제 웅덩이
    for (var i = 0; i < 3; i++) { var px = R() * TILE, py = R() * TILE; ell(x, px, py, 10 + R() * 16, 6 + R() * 8, R()); x.fillStyle = 'rgba(255,140,210,.28)'; x.fill(); }
    // 노랑·검정 경고 띠
    x.fillStyle = '#f2c62a'; x.fillRect(0, 120, TILE, 14);
    x.save(); x.beginPath(); x.rect(0, 120, TILE, 14); x.clip();
    for (var k = -20; k < TILE + 20; k += 16) { x.beginPath(); x.moveTo(k, 120); x.lineTo(k + 8, 120); x.lineTo(k + 22, 134); x.lineTo(k + 14, 134); x.closePath(); x.fillStyle = '#2a2a2a'; x.fill(); }
    x.restore(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 120, TILE, 1.5);
  }
  var TILEFN = [tileSchool, tileSubway, tileSauna, tilePark, tileLab];

  // 흩어 놓는 바닥 장식 (충돌 없음)
  var DEC = [
    // 운동장: 축구공, 물웅덩이, 흰 선, 낙엽
    [function (x) { // 고깔
      ell(x, 2, 0, 16, 5); x.fillStyle = 'rgba(40,20,10,.25)'; x.fill();
      rrect(x, -14, -5, 28, 6, 2); x.fillStyle = '#e8641a'; x.fill(); x.strokeStyle = '#7a2a06'; x.lineWidth = 1.4; x.stroke();
      x.beginPath(); x.moveTo(-9, -4); x.lineTo(-2.5, -30); x.lineTo(2.5, -30); x.lineTo(9, -4); x.closePath(); x.fillStyle = lin(x, -9, 0, 9, 0, [[0, '#ffae5a'], [0.5, '#ff7a1a'], [1, '#c8500a']]); x.fill(); x.strokeStyle = '#7a2a06'; x.stroke();
      x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(-6.5, -13); x.lineTo(-4.5, -21); x.lineTo(4.5, -21); x.lineTo(6.5, -13); x.closePath(); x.fill(); },
     function (x) { ell(x, 0, 0, 30, 12); x.fillStyle = lin(x, 0, -12, 0, 12, [[0, 'rgba(150,190,230,.55)'], [1, 'rgba(110,150,200,.45)']]); x.fill(); x.fillStyle = 'rgba(255,255,255,.5)'; ell(x, -8, -3, 9, 2); x.fill(); },
     function (x) { x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(-60, -3, 120, 6); },
     function (x) { for (var i = 0; i < 4; i++) { x.save(); x.translate(i * 9 - 12, (i % 2) * 6 - 3); x.rotate(i); ell(x, 0, 0, 5, 2.6); x.fillStyle = ['#e8a23a', '#d8642a', '#f0c24a', '#c8502a'][i]; x.fill(); x.restore(); } }],
    // 지하철: 안내 화살표, 신문, 동전 자국, 배수구
    [function (x) { x.fillStyle = 'rgba(40,160,90,.75)'; x.beginPath(); x.moveTo(-20, -6); x.lineTo(6, -6); x.lineTo(6, -14); x.lineTo(22, 0); x.lineTo(6, 14); x.lineTo(6, 6); x.lineTo(-20, 6); x.closePath(); x.fill(); },
     function (x) { x.save(); x.rotate(0.3); rrect(x, -14, -10, 28, 20, 1); x.fillStyle = '#f0ece0'; x.fill(); x.strokeStyle = '#a8a494'; x.lineWidth = 1; x.stroke(); for (var i = 0; i < 4; i++) { x.fillStyle = '#9a968a'; x.fillRect(-11, -6 + i * 4, i ? 22 : 12, 1.6); } x.restore(); },
     function (x) { rrect(x, -16, -10, 32, 20, 3); x.fillStyle = '#5a5e66'; x.fill(); x.strokeStyle = '#3a3e44'; x.lineWidth = 1.5; x.stroke(); for (var i = -12; i <= 12; i += 4) { x.fillStyle = '#2a2c30'; x.fillRect(i - 1, -7, 2, 14); } },
     function (x) { x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(-50, -2, 100, 4); }],
    // 찜질방: 수건, 식혜 컵, 맥반석 계란 껍질, 바구니
    [function (x) { x.save(); x.rotate(-0.2); rrect(x, -18, -8, 36, 16, 3); x.fillStyle = lin(x, 0, -8, 0, 8, [[0, '#ffd0e0'], [1, '#f0a0bc']]); x.fill(); x.strokeStyle = '#b0607a'; x.lineWidth = 1.2; x.stroke(); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(-18, -2, 36, 3); x.restore(); },
     function (x) { rrect(x, -6, -14, 12, 14, 2); x.fillStyle = lin(x, -6, 0, 6, 0, [[0, '#fff8e8'], [1, '#d8c8a0']]); x.fill(); x.strokeStyle = '#8a7446'; x.lineWidth = 1.2; x.stroke(); ell(x, 0, -14, 6, 2); x.fillStyle = '#e8d4a0'; x.fill(); },
     function (x) { for (var i = 0; i < 5; i++) { x.save(); x.translate(i * 5 - 10, (i % 2) * 4); x.rotate(i * 1.3); x.beginPath(); x.moveTo(0, 0); x.lineTo(4, -2); x.lineTo(5, 3); x.closePath(); x.fillStyle = '#c8905a'; x.fill(); x.restore(); } },
     function (x) { ell(x, 0, -4, 16, 9); x.fillStyle = lin(x, 0, -13, 0, 5, [[0, '#8ad0ff'], [1, '#3a8ad8']]); x.fill(); x.strokeStyle = '#1b4a8a'; x.lineWidth = 1.4; x.stroke(); ell(x, 0, -8, 12, 5); x.fillStyle = 'rgba(255,255,255,.5)'; x.fill(); }],
    // 놀이공원: 꽃밭, 솜사탕 막대, 풍선 끈, 표 조각
    [function (x) { ell(x, 0, 0, 26, 12); x.fillStyle = '#6ab84a'; x.fill(); x.strokeStyle = '#3a7a2a'; x.lineWidth = 1.4; x.stroke(); [[-12, -2, '#ff6a8a'], [0, -5, '#ffd23a'], [12, -1, '#b070ff'], [-5, 4, '#ffffff'], [8, 5, '#ff9a3a']].forEach(function (f) { for (var k = 0; k < 5; k++) { var a = k * TAU / 5; circ(x, f[0] + Math.cos(a) * 2.4, f[1] + Math.sin(a) * 2.4, 1.9); x.fillStyle = f[2]; x.fill(); } circ(x, f[0], f[1], 1.2); x.fillStyle = '#ffe066'; x.fill(); }); },
     function (x) { line(x, [0, 0, 0, -16], '#e8d4a0', 2); circ(x, 0, -20, 8); x.fillStyle = rad(x, -2, -23, 1, 0, -20, 9, [[0, '#fff0f8'], [1, '#ff9ad0']]); x.fill(); },
     function (x) { x.save(); x.rotate(0.4); rrect(x, -10, -5, 20, 10, 1.5); x.fillStyle = '#ffd23a'; x.fill(); x.strokeStyle = '#a07a10'; x.lineWidth = 1; x.stroke(); x.setLineDash([2, 2]); line(x, [4, -5, 4, 5], '#a07a10', 1); x.setLineDash([]); x.restore(); },
     function (x) { ell(x, 0, 0, 22, 9); x.fillStyle = 'rgba(120,180,230,.45)'; x.fill(); }],
    // 공장: 배관 뚜껑, 분홍 웅덩이, 나사, 경고 표지
    [function (x) { circ(x, 0, 0, 14); x.fillStyle = lin(x, -14, -14, 14, 14, [[0, '#c8d0dc'], [1, '#5a6272']]); x.fill(); x.strokeStyle = '#3a4050'; x.lineWidth = 1.6; x.stroke(); for (var i = -8; i <= 8; i += 4) line(x, [i, -10, i, 10], '#3a4050', 1.2); },
     function (x) { ell(x, 0, 0, 28, 12); x.fillStyle = 'rgba(255,120,200,.35)'; x.fill(); ell(x, -6, -3, 8, 2.5); x.fillStyle = 'rgba(255,255,255,.4)'; x.fill(); },
     function (x) { x.save(); x.rotate(0.3); x.beginPath(); x.moveTo(0, -14); x.lineTo(14, 10); x.lineTo(-14, 10); x.closePath(); x.fillStyle = '#ffd23a'; x.fill(); x.strokeStyle = '#2a2a2a'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#2a2a2a'; x.fillRect(-1.5, -5, 3, 9); circ(x, 0, 7, 1.6); x.fill(); x.restore(); },
     function (x) { for (var i = 0; i < 3; i++) { circ(x, i * 7 - 7, (i % 2) * 5, 2.4); x.fillStyle = '#8a92a2'; x.fill(); x.strokeStyle = '#3a4050'; x.lineWidth = 0.8; x.stroke(); } }]
  ];

  // ─────────────────────────── 굽기 ───────────────────────────
  ART.ready = false;
  // 주인공·적·보스 그림 파일을 먼저 받아 둔다(못 받은 것은 코드 그림으로)
  var GIMG = null, EIMG = null, BIMG = null;
  function okImg(im) { return im && im.complete && im.naturalWidth > 0; }
  ART.load = function (cb) {
    var list = [], done = false, left = 0;
    var fin = function () { if (!done) { done = true; cb(); } };
    var one = function (src) { var im = new Image(); left++; im.onload = im.onerror = function () { if (--left === 0) fin(); }; im.src = src; return im; };
    if (window.GIRL_ART) GIMG = one(window.GIRL_ART.src);
    if (window.ENEMY_ART) EIMG = one(window.ENEMY_ART.src);
    if (window.BOSS_ART) BIMG = one(window.BOSS_ART.src);
    if (!left) { fin(); return; }
    setTimeout(fin, 10000);
  };
  // 그림 파일의 칸 하나 → 스프라이트(발밑 그림자 포함). r = [x, y, 폭, 높이, 발 가운데 x, 세계배율, 뜬 높이]
  function cutFrame(img, r) {
    var k = r[5], lift = r[6] / k, rx = r[2] * 0.34, ry = rx * 0.3;
    var ay = r[3] + lift, c = mk(r[2], ay + ry + 2), x = c.getContext('2d');
    x.save(); x.translate(r[4], ay); shadow(x, rx, ry, 0.3); x.restore();
    x.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    return { c: c, ax: r[4], ay: ay, k: k, w: r[2] * k, h: r[3] * k };
  }
  ART.init = function () {
    if (ART.ready) return;
    var t0 = performance.now();
    // 주인공: 표정 5 × 걸음 5(0~3 걷기, 4 서기). 1.4 = 세계 단위 → 캔버스 배율
    ART.G = {};
    var GA = window.GIRL_ART;
    if (GA && okImg(GIMG)) {
      // 제미나이 도트 그림: 칸마다 잘라 스프라이트로. 걷기 4칸 + 서기, 표정은 한 칸씩
      var cut = function (id) {
        var r = GA.f[id], c = mk(r[2], r[3]), x = c.getContext('2d');
        x.drawImage(GIMG, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        return { c: c, ax: r[4], ay: r[3] - 2, k: GA.k, w: r[2] * GA.k, h: r[3] * GA.k, px: 1 };
      };
      ART.G.normal = ['walk0', 'walk1', 'walk2', 'walk3', 'stand'].map(cut);
      ['strain', 'strain2', 'relief', 'oops', 'hurt'].forEach(function (f) { var sp = cut(f); ART.G[f] = [sp, sp, sp, sp, sp]; });
    } else {
      var RES = 2.4;
      ['normal', 'strain', 'relief', 'oops', 'hurt'].forEach(function (f) {
        ART.G[f] = [];
        for (var s = 0; s < 5; s++) ART.G[f].push(bake(110, 140, 55, 130, RES, function (x) { drawGirl(x, f, s); }));
      });
      ART.G.strain2 = ART.G.strain;
    }
    ART.GW = tint(ART.G.normal[4], '#ffffff', 0.85);
    // 적
    ART.E = {};
    var EA = okImg(EIMG) && window.ENEMY_ART, BA = okImg(BIMG) && window.BOSS_ART;
    Object.keys(EN).forEach(function (id) {
      var d = EN[id]; ART.E[id] = [];
      for (var f = 0; f < 2; f++) {
        var sp = EA && EA.f[id] ? cutFrame(EIMG, EA.f[id][f]) : bake(d.w, d.h, d.ax, d.ay, 2, function (x) { d.draw(x, f); });
        ART.E[id].push({ n: sp, w: tint(sp, '#ffffff', 0.9), g: tint(sp, '#7ed321', 0.42) });
      }
    });
    ART.B = {};
    Object.keys(BS).forEach(function (id) {
      var b = BS[id], d = EN[b.base]; ART.B[id] = [];
      for (var f = 0; f < 2; f++) {
        var sp = BA && BA.f[id] ? cutFrame(BIMG, BA.f[id][f]) : bake(d.w * b.sc, d.h * b.sc, d.ax * b.sc, d.ay * b.sc, 1.3, function (x) { x.save(); x.scale(b.sc, b.sc); d.draw(x, f); x.restore(); b.extra(x); });
        ART.B[id].push({ n: sp, w: tint(sp, '#ffffff', 0.9), g: tint(sp, '#7ed321', 0.35) });
      }
    });
    // 아이콘
    ART.I = {}; ART.IURL = {};
    Object.keys(IC).forEach(function (id) {
      var c = mk(128, 128), x = c.getContext('2d'); x.scale(2, 2); x.lineJoin = 'round'; x.lineCap = 'round'; IC[id](x); ART.I[id] = c;
    });
    // 구름
    ART.C = {
      stink: cloudSprite('rgba(246,255,190,.95)', 'rgba(182,222,92,.9)', 'rgba(120,170,50,.85)', 'rgba(70,110,30,.55)'),
      fire: cloudSprite('rgba(255,236,252,.95)', 'rgba(250,130,230,.92)', 'rgba(170,60,220,.88)', 'rgba(90,20,140,.55)'),   // 불방귀 = 보라 플라즈마(2026-09-26)
      poison: cloudSprite('rgba(240,210,255,.95)', 'rgba(180,110,230,.9)', 'rgba(110,50,170,.85)', 'rgba(60,20,100,.55)'),
      enemy: cloudSprite('rgba(210,220,150,.9)', 'rgba(140,150,70,.88)', 'rgba(90,100,40,.85)', 'rgba(40,50,20,.55)'),
      mist: cloudSprite('rgba(255,235,250,.9)', 'rgba(255,170,220,.85)', 'rgba(230,110,190,.8)', 'rgba(160,60,130,.4)')
    };
    ART.P = {
      green: puffSprite('rgba(250,255,210,1)', 'rgba(170,215,80,.9)'),
      white: puffSprite('rgba(255,255,255,1)', 'rgba(220,225,235,.8)'),
      fire: puffSprite('rgba(255,240,255,1)', 'rgba(230,110,240,.9)'),
      purple: puffSprite('rgba(245,220,255,1)', 'rgba(170,100,230,.9)'),
      water: puffSprite('rgba(230,250,255,1)', 'rgba(90,180,240,.9)'),
      pink: puffSprite('rgba(255,235,250,1)', 'rgba(255,140,210,.9)'),
      gold: puffSprite('rgba(255,255,220,1)', 'rgba(255,210,60,.9)')
    };
    // 보석(경험치): 파랑·초록·빨강
    ART.gem = [['#bfe8ff', '#3aa6f5', '#1a4a9a'], ['#c8ffb0', '#3fc03f', '#1a6a1a'], ['#ffc0c8', '#f0364c', '#7a0a1a']].map(function (c) {
      return bake(16, 20, 8, 17, 3, function (x) {
        x.beginPath(); x.moveTo(0, -15); x.lineTo(6, -8); x.lineTo(0, 0); x.lineTo(-6, -8); x.closePath();
        x.fillStyle = lin(x, -6, -15, 6, 0, [[0, c[0]], [0.5, c[1]], [1, c[2]]]); x.fill(); x.strokeStyle = c[2]; x.lineWidth = 1.2; x.stroke();
        x.beginPath(); x.moveTo(0, -15); x.lineTo(-3, -8); x.lineTo(0, -1); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 0.8; x.stroke();
      });
    });
    ART.coinS = bake(20, 20, 10, 17, 3, function (x) { x.save(); x.translate(-10, -27); x.scale(0.3, 0.3); IC.coin(x); x.restore(); });
    ART.lunchS = bake(40, 40, 20, 34, 2.4, function (x) { shadow(x, 14, 4, 0.3); x.save(); x.translate(-18, -38); x.scale(0.56, 0.56); IC.lunch(x); x.restore(); });
    // 떨어진 간식 (체력·가스)
    ART.snack = bake(34, 34, 17, 30, 2.4, function (x) {
      shadow(x, 12, 3.5, 0.3);
      // 삼각김밥
      x.beginPath(); x.moveTo(0, -24); x.quadraticCurveTo(3, -24, 13, -6); x.quadraticCurveTo(14, -2, 10, -2); x.lineTo(-10, -2); x.quadraticCurveTo(-14, -2, -13, -6); x.quadraticCurveTo(-3, -24, 0, -24); x.closePath();
      x.fillStyle = lin(x, 0, -24, 0, -2, [[0, '#ffffff'], [1, '#e0e4ec']]); x.fill(); x.strokeStyle = '#6a7488'; x.lineWidth = 1.4; x.stroke();
      rrect(x, -7, -12, 14, 10, 1.5); x.fillStyle = lin(x, 0, -12, 0, -2, [[0, '#2a4a2a'], [1, '#12241a']]); x.fill();
    });
    // 바닥 타일
    ART.T = TILEFN.map(function (fn, i) {
      var c = mk(TILE * TRES, TILE * TRES), x = c.getContext('2d'); x.scale(TRES, TRES); fn(x, seeded(1234 + i * 77)); return c;
    });
    ART.D = DEC.map(function (arr) { return arr.map(function (fn) { return bake(130, 60, 65, 36, 2, fn); }); });
    ART.ready = true;
    ART.bakeMs = performance.now() - t0;
  };
  ART.url = function (id) {
    if (!ART.IURL[id]) ART.IURL[id] = ART.I[id].toDataURL();
    return ART.IURL[id];
  };
  ART.EN = EN; ART.BS = BS; ART.TILE = TILE; ART.TRES = TRES;
  ART.drawGirl = drawGirl; ART.bake = bake; ART.mk = mk; ART.lin = lin; ART.rad = rad; ART.circ = circ; ART.ell = ell; ART.star = star;
  window.ART = ART;
})();
