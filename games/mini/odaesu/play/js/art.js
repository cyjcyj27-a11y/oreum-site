/* 오대수 — 그림. 전부 캔버스 2D 코드로 그린다.
 * 월드 높이 540. 천장 0~58, 벽 58~404, 걸레받이 404~414, 바닥 414~540, 사람 발은 FY=492.
 * window.ART = { FY, bg(c, cam, vw, zone, stageLen, t), person(c, f, t), shadow(c,f), pose(name,u), mix(a,b,k),
 *                styleFor(kind, seed), dumpling(c,x,y), elevator(c,x,open,t), knifeProp }
 */
(function () {
  'use strict';
  var FY = 492, WALL_T = 58, WALL_B = 404, FLOOR_T = 414;
  var PI = Math.PI;

  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function shade(hex, k) {           // k<0 어둡게, k>0 밝게
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  // ─────────────────────────── 복도 배경 ───────────────────────────
  var ZONES = [
    { // 1~5층: 사설 감금방 — 누런 형광등, 쑥색 벽
      wall: '#6d7f5c', wallD: '#4b5a3f', wain: '#3d4a36', base: '#23291f', ceil: '#191c16', floor: '#595a48', floorD: '#3a3b2e',
      door: '#3f5443', doorD: '#2a3a2e', light: 'rgba(236,255,200,', grime: 'rgba(60,50,20,', tint: '#c9e3b0', plate: '#c8b98a', num: 800
    },
    { // 6~10층: 지하 창고 — 녹슨 문, 텅스텐 불빛
      wall: '#7d6a50', wallD: '#57482f', wain: '#4a3b28', base: '#2a2016', ceil: '#18130e', floor: '#4a443c', floorD: '#2e2a24',
      door: '#6a3a2a', doorD: '#44241a', light: 'rgba(255,214,150,', grime: 'rgba(40,25,10,', tint: '#f0cf9e', plate: '#b9b2a2', num: 'B'
    },
    { // 11~15층: 펜트하우스 — 붉은 벽지, 나무 징두리
      wall: '#7e2a2e', wallD: '#551a1e', wain: '#3e2618', base: '#1f130b', ceil: '#140c0c', floor: '#3a2230', floorD: '#221420',
      door: '#5e3b22', doorD: '#3b2414', light: 'rgba(255,226,180,', grime: 'rgba(30,5,5,', tint: '#f3c9a8', plate: '#d6b35a', num: 1500
    }
  ];

  function bg(c, cam, vw, zone, stageLen, t, stage) {
    var Z = ZONES[zone];
    var x0 = cam, x1 = cam + vw;
    // 천장
    var g = c.createLinearGradient(0, 0, 0, WALL_T);
    g.addColorStop(0, shade(Z.ceil, -0.3)); g.addColorStop(1, Z.ceil);
    c.fillStyle = g; c.fillRect(x0, 0, vw, WALL_T);
    // 벽 — 위가 밝고 아래로 어두워진다(천장 조명)
    g = c.createLinearGradient(0, WALL_T, 0, WALL_B);
    g.addColorStop(0, shade(Z.wall, 0.06)); g.addColorStop(0.55, Z.wall); g.addColorStop(1, Z.wallD);
    c.fillStyle = g; c.fillRect(x0, WALL_T, vw, WALL_B - WALL_T);
    // 벽지 결: 3구역은 세로 무늬, 나머지는 페인트 얼룩
    if (zone === 2) {
      c.fillStyle = 'rgba(0,0,0,0.10)';
      for (var sx = Math.floor(x0 / 18) * 18; sx < x1; sx += 18) c.fillRect(sx, WALL_T, 7, 240);
      c.fillStyle = 'rgba(255,200,120,0.05)';
      for (sx = Math.floor(x0 / 36) * 36; sx < x1; sx += 36) { c.beginPath(); c.ellipse(sx + 9, 120 + (sx % 72 ? 60 : 0), 5, 9, 0, 0, 2 * PI); c.fill(); }
    }
    // 징두리(허리 아래 어두운 칠 / 나무판)
    var WY = 292;
    g = c.createLinearGradient(0, WY, 0, WALL_B);
    g.addColorStop(0, shade(Z.wain, 0.08)); g.addColorStop(1, shade(Z.wain, -0.25));
    c.fillStyle = g; c.fillRect(x0, WY, vw, WALL_B - WY);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x0, WY, vw, 2);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0, WY + 2, vw, 3);
    if (zone === 2) { c.fillStyle = 'rgba(0,0,0,0.25)'; for (sx = Math.floor(x0 / 110) * 110; sx < x1; sx += 110) c.fillRect(sx, WY + 12, 2, WALL_B - WY - 20); }

    // 얼룩 — 천장에서 흘러내린 물때 줄
    for (var i = Math.floor(x0 / 90) - 1; i <= Math.floor(x1 / 90) + 1; i++) {
      var h = hash(i + stage * 31);
      if (h < 0.45) continue;
      var gx = i * 90 + h * 60, len = 40 + hash(i * 3.1) * 180;
      var sg = c.createLinearGradient(0, WALL_T, 0, WALL_T + len);
      sg.addColorStop(0, Z.grime + (0.28 * h) + ')'); sg.addColorStop(1, Z.grime + '0)');
      c.fillStyle = sg; c.fillRect(gx, WALL_T, 6 + hash(i * 7.7) * 22, len);
    }
    // 벽 아래 때
    g = c.createLinearGradient(0, WALL_B - 40, 0, WALL_B);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = g; c.fillRect(x0, WALL_B - 40, vw, 40);

    // 기둥 + 문 (문은 640 마다, 기둥은 320 마다)
    for (i = Math.floor(x0 / 320) - 1; i <= Math.floor(x1 / 320) + 1; i++) {
      var px = i * 320;
      if (px > stageLen + 200) break;
      // 기둥(살짝 튀어나온 벽)
      g = c.createLinearGradient(px - 14, 0, px + 14, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.28)'); g.addColorStop(0.25, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
      c.fillStyle = g; c.fillRect(px - 14, WALL_T, 28, WALL_B - WALL_T);
      if (i % 2 === 0 && px < stageLen - 200) door(c, px + 160, Z, i, t, zone);
    }
    // 걸레받이
    c.fillStyle = Z.base; c.fillRect(x0, WALL_B, vw, FLOOR_T - WALL_B);
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x0, WALL_B, vw, 1.5);

    // 바닥 — 원근: 벽 쪽이 좁고 앞으로 올수록 넓게
    g = c.createLinearGradient(0, FLOOR_T, 0, 540);
    g.addColorStop(0, Z.floorD); g.addColorStop(0.35, Z.floor); g.addColorStop(1, shade(Z.floor, -0.35));
    c.fillStyle = g; c.fillRect(x0, FLOOR_T, vw, 540 - FLOOR_T);
    var mid = cam + vw / 2;
    c.strokeStyle = zone === 2 ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.30)'; c.lineWidth = 1.2;
    c.beginPath();
    var rows = [FLOOR_T + 8, FLOOR_T + 22, FLOOR_T + 42, FLOOR_T + 70, FLOOR_T + 106];
    rows.forEach(function (y) { c.moveTo(x0, y); c.lineTo(x1, y); });
    var step = zone === 2 ? 160 : 58;
    for (sx = Math.floor((x0 - 300) / step) * step; sx < x1 + 300; sx += step) {
      c.moveTo(sx, FLOOR_T); c.lineTo(sx + (sx - mid) * 0.55, 540);
    }
    c.stroke();
    if (zone !== 2) {    // 타일 한 칸씩 명암 달리
      for (sx = Math.floor(x0 / step) * step; sx < x1; sx += step) {
        for (var r = 0; r < rows.length - 1; r++) {
          var hv = hash(sx * 0.37 + r * 13.3 + stage);
          if (hv < 0.55) continue;
          var ya = rows[r], yb = rows[r + 1], ka = (ya - FLOOR_T) / 126 * 0.55, kb = (yb - FLOOR_T) / 126 * 0.55;
          c.fillStyle = hv > 0.8 ? 'rgba(255,255,230,0.035)' : 'rgba(0,0,0,0.07)';
          c.beginPath();
          c.moveTo(sx + (sx - mid) * ka, ya); c.lineTo(sx + step + (sx + step - mid) * ka, ya);
          c.lineTo(sx + step + (sx + step - mid) * kb, yb); c.lineTo(sx + (sx - mid) * kb, yb); c.fill();
        }
      }
    } else {             // 카펫 무늬 띠
      c.fillStyle = 'rgba(214,170,80,0.10)';
      c.fillRect(x0, FLOOR_T + 30, vw, 4); c.fillRect(x0, FLOOR_T + 96, vw, 5);
    }

    // 천장 배관
    c.fillStyle = shade(Z.ceil, 0.12); c.fillRect(x0, 14, vw, 9);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x0, 15, vw, 2);
    c.fillStyle = shade(Z.ceil, 0.07); c.fillRect(x0, 32, vw, 6);
    for (i = Math.floor(x0 / 240); i <= Math.floor(x1 / 240) + 1; i++) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(i * 240 + 40, 12, 6, 28); }

    // 등과 등 사이는 어둡게 눌러 두고, 등 밑만 빛으로 밝힌다
    c.fillStyle = 'rgba(0,0,0,0.34)'; c.fillRect(x0, WALL_T, vw, 540 - WALL_T);
    // 형광등 + 빛 웅덩이
    for (i = Math.floor(x0 / 320) - 1; i <= Math.floor(x1 / 320) + 1; i++) {
      var lx = i * 320;
      var fl = flick(i + stage * 7, t);
      // 벽을 비추는 빛(위에서 아래로 퍼지는 원뿔)
      c.save(); c.globalCompositeOperation = 'lighter';
      var lg = c.createRadialGradient(lx, WALL_T - 10, 4, lx, WALL_T + 40, 250);
      lg.addColorStop(0, Z.light + (0.30 * fl) + ')'); lg.addColorStop(0.5, Z.light + (0.10 * fl) + ')'); lg.addColorStop(1, Z.light + '0)');
      c.fillStyle = lg;
      c.beginPath(); c.moveTo(lx - 60, WALL_T); c.lineTo(lx + 60, WALL_T); c.lineTo(lx + 230, 540); c.lineTo(lx - 230, 540); c.fill();
      c.restore();
      // 바닥 반사(가로로 긴 흐린 띠)
      var rg = c.createRadialGradient(lx, FY - 20, 2, lx, FY - 20, 140);
      rg.addColorStop(0, Z.light + (0.12 * fl) + ')'); rg.addColorStop(1, Z.light + '0)');
      c.save(); c.translate(lx, FY - 20); c.scale(1.6, 0.35); c.translate(-lx, -(FY - 20));
      c.fillStyle = rg; c.fillRect(lx - 150, FY - 170, 300, 300); c.restore();
      // 등 본체
      c.fillStyle = '#0d0d0b'; c.fillRect(lx - 58, 50, 116, 8);
      c.fillStyle = fl > 0.5 ? '#f4ffe8' : '#6f7866'; c.fillRect(lx - 54, 53, 108, 5);
      c.fillStyle = Z.light + (0.35 * fl) + ')'; c.fillRect(lx - 62, 58, 124, 3);
    }
  }
  function flick(i, t) {           // 몇 개는 깜빡이는 형광등
    var h = hash(i * 5.3);
    if (h < 0.78) return 1;
    var k = Math.sin(t * (13 + h * 20)) + Math.sin(t * 3.1 + h * 9);
    return k > 1.2 ? 0.25 : (k > 0.9 ? 0.6 : 1);
  }

  function door(c, x, Z, i, t, zone) {
    var w = 92, top = 128, bot = WALL_B;
    // 문틀
    c.fillStyle = shade(Z.doorD, -0.35); c.fillRect(x - w / 2 - 8, top - 8, w + 16, bot - top + 8);
    var g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, shade(Z.door, 0.10)); g.addColorStop(0.6, Z.door); g.addColorStop(1, Z.doorD);
    c.fillStyle = g; c.fillRect(x - w / 2, top, w, bot - top);
    // 윗면 빛
    var g2 = c.createLinearGradient(0, top, 0, bot);
    g2.addColorStop(0, 'rgba(255,255,230,0.10)'); g2.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = g2; c.fillRect(x - w / 2, top, w, bot - top);
    // 판 무늬
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2;
    c.strokeRect(x - w / 2 + 12, top + 18, w - 24, 88); c.strokeRect(x - w / 2 + 12, top + 124, w - 24, 130);
    c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
    c.strokeRect(x - w / 2 + 13, top + 19, w - 24, 88);
    if (zone !== 2) {     // 배식구(감금방 느낌)
      c.fillStyle = '#0c0d0a'; c.fillRect(x - 20, top + 150, 40, 12);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x - 20, top + 162, 40, 1.5);
      c.fillStyle = '#10110e'; c.fillRect(x - 14, top + 34, 28, 22);      // 들여다보는 창
      c.fillStyle = 'rgba(160,190,150,0.18)'; c.fillRect(x - 12, top + 36, 24, 8);
    }
    // 손잡이
    c.fillStyle = '#b8b09a'; c.beginPath(); c.arc(x + w / 2 - 14, top + 132, 4.5, 0, 2 * PI); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.arc(x + w / 2 - 13, top + 134, 3, 0, 2 * PI); c.fill();
    // 호수 판
    c.fillStyle = Z.plate; c.fillRect(x - 18, top - 34, 36, 16);
    c.fillStyle = 'rgba(0,0,0,0.75)'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var nn = typeof Z.num === 'number' ? (Z.num + ((i / 2 | 0) % 40 + 40) % 40 + 1) : ('B' + (((i / 2 | 0) % 30 + 30) % 30 + 1));
    c.fillText(String(nn), x, top - 25.5);
    // 문 아래 틈 빛
    c.fillStyle = 'rgba(255,240,200,0.10)'; c.fillRect(x - w / 2, bot - 2, w, 2);
  }

  // 엘리베이터(스테이지 끝)
  function elevator(c, x, open, t, zone) {
    var w = 130, top = 118, bot = WALL_B;
    c.fillStyle = '#15161a'; c.fillRect(x - w / 2 - 16, top - 16, w + 32, bot - top + 16);
    var g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, '#8c9096'); g.addColorStop(0.5, '#c7ccd2'); g.addColorStop(1, '#6f7379');
    // 안쪽(열리면 보인다)
    var ig = c.createLinearGradient(0, top, 0, bot);
    ig.addColorStop(0, '#fff6d8'); ig.addColorStop(1, '#b9a57a');
    c.fillStyle = ig; c.fillRect(x - w / 2, top, w, bot - top);
    var o = Math.max(0, Math.min(1, open)) * (w / 2 - 4);
    c.fillStyle = g;
    c.fillRect(x - w / 2, top, w / 2 - o, bot - top);
    c.fillRect(x + o, top, w / 2 - o, bot - top);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x - o - 1, top, 2, bot - top); c.fillRect(x + o - 1, top, 2, bot - top);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x - w / 2 + 6, top, 3, bot - top); c.fillRect(x + w / 2 - 12, top, 3, bot - top);
    // 층 표시등
    c.fillStyle = '#0b0b0b'; c.fillRect(x - 26, top - 44, 52, 20);
    c.fillStyle = '#ff5a2a'; c.font = 'bold 14px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('▲', x, top - 34);
    // 호출 단추
    c.fillStyle = '#2a2a2a'; c.fillRect(x + w / 2 + 22, 250, 14, 26);
    c.fillStyle = open > 0 ? '#ffd35a' : '#8a8a8a'; c.beginPath(); c.arc(x + w / 2 + 29, 263, 4, 0, 2 * PI); c.fill();
    if (open > 0) {   // 열리면 바닥으로 빛이 쏟아진다
      var lg = c.createLinearGradient(0, bot, 0, 540);
      lg.addColorStop(0, 'rgba(255,240,200,' + (0.35 * open) + ')'); lg.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = lg;
      c.beginPath(); c.moveTo(x - o, bot); c.lineTo(x + o, bot); c.lineTo(x + o * 1.9, 540); c.lineTo(x - o * 1.9, 540); c.fill();
    }
  }

  // 군만두 접시
  function dumpling(c, x, y, t) {
    var bob = Math.sin(t * 3) * 1.2;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 3, 26, 6, 0, 0, 2 * PI); c.fill();
    var g = c.createLinearGradient(0, y - 8, 0, y + 4);
    g.addColorStop(0, '#fbfbf6'); g.addColorStop(1, '#bdbdb2');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 2, 24, 7, 0, 0, 2 * PI); c.fill();
    c.strokeStyle = 'rgba(40,80,160,0.55)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y - 2.5, 20, 5.2, 0, 0, 2 * PI); c.stroke();
    var P = [[-10, -6], [0, -7], [10, -6], [-5, -11], [5, -11]];
    P.forEach(function (p, k) {
      var px = x + p[0], py = y + p[1] + (k > 2 ? bob * 0 : 0);
      var dg = c.createLinearGradient(0, py - 6, 0, py + 4);
      dg.addColorStop(0, '#f1d9a0'); dg.addColorStop(0.55, '#d59a45'); dg.addColorStop(1, '#8a4f1a');
      c.fillStyle = dg;
      c.beginPath(); c.moveTo(px - 8, py + 3); c.quadraticCurveTo(px - 7, py - 7, px, py - 7); c.quadraticCurveTo(px + 7, py - 7, px + 8, py + 3); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(90,50,10,0.55)'; c.lineWidth = 0.8;
      c.beginPath(); for (var q = -4; q <= 4; q += 2.6) { c.moveTo(px + q, py - 6); c.lineTo(px + q * 0.8, py - 3); } c.stroke();
      c.fillStyle = 'rgba(255,255,230,0.5)'; c.beginPath(); c.ellipse(px - 2, py - 5, 3, 1.2, -0.3, 0, 2 * PI); c.fill();
    });
    // 김
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2;
    for (var s = -1; s <= 1; s++) {
      c.beginPath();
      var sx = x + s * 8, ph = t * 2 + s;
      c.moveTo(sx, y - 16); c.bezierCurveTo(sx + 5 * Math.sin(ph), y - 24, sx - 5 * Math.sin(ph), y - 30, sx + 3 * Math.sin(ph + 1), y - 38 - bob);
      c.stroke();
    }
  }

  // ─────────────────────────── 사람 ───────────────────────────
  // 각도: 0 = 아래로 늘어뜨림, +PI/2 = 앞(바라보는 쪽), PI = 위.
  function dir(a) { return [Math.sin(a), Math.cos(a)]; }

  function limb(c, x1, y1, x2, y2, w1, w2, base, light, dark, edge) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L, ny = dx / L, up = true;
    if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; up = false; }   // n 은 늘 위쪽(빛 쪽)
    var an = Math.atan2(ny, nx), r1 = w1 / 2, r2 = w2 / 2;
    c.beginPath();
    c.moveTo(x1 + nx * r1, y1 + ny * r1);
    c.lineTo(x2 + nx * r2, y2 + ny * r2);
    if (up) { c.arc(x2, y2, r2, an, an - PI, true); c.lineTo(x1 - nx * r1, y1 - ny * r1); c.arc(x1, y1, r1, an - PI, an - 2 * PI, true); }
    else { c.arc(x2, y2, r2, an, an + PI, false); c.lineTo(x1 - nx * r1, y1 - ny * r1); c.arc(x1, y1, r1, an + PI, an + 2 * PI, false); }
    c.closePath();
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, rw = Math.max(r1, r2);
    var g = c.createLinearGradient(mx + nx * rw, my + ny * rw, mx - nx * rw, my - ny * rw);
    g.addColorStop(0, light); g.addColorStop(0.42, base); g.addColorStop(1, dark);
    c.fillStyle = g; c.fill();
    if (edge) { c.strokeStyle = edge; c.lineWidth = 1.3; c.stroke(); }
  }

  var STYLES = {
    player: { skin: '#d6a784', hair: '#17120f', style: 'mop', outfit: 'suit', top: '#25272d', shirt: '#d9d5ca',
      pants: '#23252b', shoe: '#101012', weapon: 'hammer', girth: 1, scale: 1, brow: 'grim', stubble: 0.6 },
    thug: { outfit: 'tank', top: '#e4e0d4', pants: '#1f2025', shoe: '#1a1614', weapon: 'fist', girth: 1.03, scale: 0.98 },
    track: { outfit: 'track', top: '#2b3a5c', stripe: '#dfe2ea', pants: '#2b3a5c', shoe: '#e9e7e2', weapon: 'fist', girth: 1, scale: 0.97 },
    stick: { outfit: 'hoodie', top: '#66696d', pants: '#2c2e33', shoe: '#1a1614', weapon: 'stick', girth: 1.05, scale: 1 },
    knife: { outfit: 'hawaii', top: '#8e2d2b', pattern: '#e1c25a', pants: '#1c1c20', shoe: '#2a1a12', weapon: 'knife', girth: 0.94, scale: 0.96 },
    fat: { outfit: 'tee', top: '#e9e5d9', pants: '#2f2c28', shoe: '#1a1614', weapon: 'fist', girth: 1.38, scale: 1.08, belly: 1 },
    boss: { outfit: 'suit', top: '#dcd7c8', shirt: '#1b1b1e', pants: '#d3cdbb', shoe: '#3a2618', weapon: 'pipe', girth: 1.12, scale: 1.1, shades: true }
  };
  var SKINS = ['#d4a383', '#c38e6b', '#dfb192', '#b27f5e', '#cf9b78'];
  var HAIRS = [['buzz', '#191512'], ['crop', '#1e1914'], ['slick', '#15110e'], ['bald', null], ['buzz', '#2a211a'], ['crop', '#3a2c20']];
  function styleFor(kind, seed) {
    var b = STYLES[kind] || STYLES.thug, s = {};
    for (var k in b) s[k] = b[k];
    if (kind !== 'player') {
      s.skin = s.skin || SKINS[Math.floor(hash(seed) * SKINS.length)];
      var hr = HAIRS[Math.floor(hash(seed * 1.7 + 3) * HAIRS.length)];
      if (kind === 'fat' && hash(seed + 9) < 0.6) hr = ['bald', null];
      if (kind === 'knife') hr = ['slick', '#130f0c'];
      if (kind === 'boss') hr = ['slick', '#e2ded6'];
      s.style = s.style || hr[0]; s.hair = s.hair || hr[1] || '#000';
      s.brow = 'angry'; s.stubble = hash(seed * 2.3) < 0.5 ? 0.5 : 0.15;
      if (kind === 'thug' && hash(seed * 4.1) < 0.35) s.top = '#222226';           // 검은 민소매
    }
    s.hairL = shade(s.hair, 0.28);
    return s;
  }
  // 색 한 벌(밝은·보통·어두운·테두리), 뒤쪽 팔다리용 어두운 벌
  function tones(hex) { return { b: hex, l: shade(hex, 0.18), d: shade(hex, -0.4), e: shade(hex, -0.62) }; }
  function tonesOf(st) {
    if (st._t) return st._t;
    var T = { skin: tones(st.skin), top: tones(st.top), pants: tones(st.pants) };
    function dk(hex) { var s2 = shade(hex, -0.22); return s2.replace(/rgb\((\d+),(\d+),(\d+)\)/, function (m, r, g, b) { return '#' + ((1 << 24) + (+r << 16) + (+g << 8) + +b).toString(16).slice(1); }); }
    T.topB = tones(dk(st.top)); T.pantsB = tones(dk(st.pants)); T.skinB = tones(dk(st.skin));
    st._t = T;
    return T;
  }

  // 자세
  var POSES = {
    idle: { lean: .12, tilt: 0, thF: .38, shF: .05, thB: -.22, shB: -.3, uaF: .35, faF: 1.9, uaB: .5, faB: 1.8, wpn: 1.25, crouch: 0 },
    wind1: { lean: -.1, tilt: -.1, thF: .45, shF: .1, thB: -.38, shB: -.42, uaF: 2.75, faF: 3.4, uaB: .6, faB: 1.4, wpn: 1.3, crouch: 2 },
    hit1: { lean: .38, tilt: .15, thF: .62, shF: .12, thB: -.42, shB: -.52, uaF: 1.3, faF: 0.95, uaB: -.3, faB: .3, wpn: .55, crouch: 8 },
    wind2: { lean: -.05, tilt: 0, thF: .4, shF: .05, thB: -.3, shB: -.4, uaF: -.55, faF: .2, uaB: .9, faB: 1.9, wpn: 1.9, crouch: 3 },
    hit2: { lean: .28, tilt: .1, thF: .55, shF: .1, thB: -.35, shB: -.5, uaF: 1.75, faF: 1.7, uaB: -.2, faB: .6, wpn: 1.45, crouch: 5 },
    wind3: { lean: .3, tilt: .2, thF: .8, shF: .05, thB: -.35, shB: -.8, uaF: .05, faF: -.35, uaB: .4, faB: 1.2, wpn: .35, crouch: 16 },
    hit3: { lean: -.18, tilt: -.25, thF: .35, shF: .1, thB: -.25, shB: -.35, uaF: 2.5, faF: 2.9, uaB: .2, faB: .9, wpn: .5, crouch: 0 },
    charge: { lean: -.22, tilt: -.15, thF: .55, shF: .1, thB: -.42, shB: -.48, uaF: 2.95, faF: 3.7, uaB: .8, faB: 1.8, wpn: 1.2, crouch: 6 },
    smash: { lean: .55, tilt: .3, thF: .7, shF: .15, thB: -.5, shB: -.55, uaF: 1.05, faF: .6, uaB: -.2, faB: .2, wpn: .45, crouch: 18 },
    kick: { lean: -.3, tilt: -.1, thF: 1.55, shF: 1.5, thB: -.05, shB: -.12, uaF: .9, faF: 1.9, uaB: -.5, faB: .3, wpn: 1.3, crouch: 0 },
    throwW: { lean: -.35, tilt: -.2, thF: .45, shF: .1, thB: -.35, shB: -.4, uaF: 2.9, faF: 3.2, uaB: 2.7, faB: 3.1, wpn: 1.3, crouch: 4 },
    throwR: { lean: .45, tilt: .2, thF: .65, shF: .15, thB: -.45, shB: -.5, uaF: 1.7, faF: 1.6, uaB: 1.6, faB: 1.5, wpn: 1.2, crouch: 8 },
    hurt: { lean: -.45, tilt: -.5, thF: .3, shF: .1, thB: -.12, shB: -.25, uaF: 1.05, faF: 1.5, uaB: -.7, faB: -.3, wpn: 1.6, crouch: 3 },
    air: { lean: 0, tilt: -.3, thF: .95, shF: .3, thB: .25, shB: -.35, uaF: 2.6, faF: 3.1, uaB: 2.1, faB: 2.3, wpn: 1.6, crouch: 0 },
    down: { lean: 0, tilt: .35, thF: .55, shF: -.15, thB: .05, shB: 0, uaF: .2, faF: .1, uaB: 2.9, faB: 3.1, wpn: 1.8, crouch: 0 },
    kneel: { lean: .45, tilt: .1, thF: 1.35, shF: .02, thB: .55, shB: -1.05, uaF: .6, faF: .8, uaB: .3, faB: .5, wpn: 1.2, crouch: 0 },
    punchW: { lean: -.12, tilt: 0, thF: .42, shF: .05, thB: -.3, shB: -.4, uaF: .05, faF: 2.1, uaB: .9, faB: 2.1, wpn: 1.2, crouch: 3 },
    punch: { lean: .32, tilt: .1, thF: .6, shF: .15, thB: -.4, shB: -.5, uaF: 1.55, faF: 1.57, uaB: .3, faB: 1.2, wpn: 1.2, crouch: 4 },
    stabW: { lean: -.1, tilt: 0, thF: .5, shF: .1, thB: -.3, shB: -.5, uaF: -.3, faF: 1.1, uaB: .7, faB: 1.6, wpn: .15, crouch: 8 },
    stab: { lean: .5, tilt: .2, thF: .95, shF: .4, thB: -.6, shB: -.7, uaF: 1.45, faF: 1.6, uaB: -.3, faB: .2, wpn: 0, crouch: 14 },
    bumpW: { lean: -.3, tilt: -.1, thF: .35, shF: .05, thB: -.35, shB: -.4, uaF: -.3, faF: .5, uaB: -.2, faB: .6, wpn: 1.2, crouch: 4 },
    bump: { lean: .4, tilt: .1, thF: .7, shF: .2, thB: -.45, shB: -.55, uaF: .9, faF: 1.3, uaB: .4, faB: 1.1, wpn: 1.2, crouch: 6 },
    // 얼굴 맞음: 고개가 젖혀지고 앞손이 얼굴로 / 배 맞음: 몸을 접고 두 손이 배로
    hurtHead: { lean: -.5, tilt: -.75, thF: .3, shF: .1, thB: -.15, shB: -.3, uaF: 2.1, faF: 3.75, uaB: -.85, faB: -.45, wpn: 1.6, crouch: 3 },
    hurtGut: { lean: .78, tilt: .35, thF: .5, shF: -.1, thB: -.2, shB: -.6, uaF: .25, faF: 1.95, uaB: .45, faB: 2.05, wpn: 1.6, crouch: 8 },
    wounded: { lean: .3, tilt: .15, thF: .42, shF: .02, thB: -.2, shB: -.35, uaF: .3, faF: 1.9, uaB: .25, faB: 2.2, wpn: 1.2, crouch: 4 },
    slump: { lean: -.35, tilt: .55, thF: 2.2, shF: .15, thB: 2.05, shB: .3, uaF: .15, faF: .05, uaB: -.05, faB: .1, wpn: 1.8, crouch: 0 },
    prone: { lean: 0, tilt: -.3, thF: .05, shF: .1, thB: -.12, shB: -.2, uaF: 2.8, faF: 3.0, uaB: .3, faB: .6, wpn: 1.8, crouch: 0 },
    // 잡아 들기: 숙여 움켜잡기 → 무릎 굽혀 끌어올리기 → 머리 위로 밀어 올리기 (팔은 IK 가 덮어쓴다)
    grabLow: { lean: .45, tilt: .15, thF: .85, shF: .05, thB: -.35, shB: -.75, uaF: 1.5, faF: 1.6, uaB: 1.4, faB: 1.5, wpn: 2.4, crouch: 0 },
    lift: { lean: .08, tilt: -.1, thF: .95, shF: -.25, thB: -.25, shB: -.95, uaF: 2.2, faF: 2.8, uaB: 2.1, faB: 2.7, wpn: 2.4, crouch: 0 },
    press: { lean: -.12, tilt: -.25, thF: .38, shF: .12, thB: -.32, shB: -.38, uaF: 2.9, faF: 3.1, uaB: 2.9, faB: 3.1, wpn: 2.4, crouch: 0 },
    reach: { lean: .3, tilt: .1, thF: .55, shF: .1, thB: -.35, shB: -.45, uaF: 1.55, faF: 1.6, uaB: 1.35, faB: 1.5, wpn: 1.3, crouch: 4 },
    taunt: { lean: -.12, tilt: -.1, thF: .3, shF: .05, thB: -.2, shB: -.3, uaF: 1.3, faF: 2.7, uaB: .15, faB: .5, wpn: 1.3, crouch: 0 },
    victory: { lean: -.05, tilt: -.1, thF: .2, shF: .05, thB: -.15, shB: -.2, uaF: .15, faF: .5, uaB: .1, faB: .3, wpn: 2.6, crouch: 0 }
  };
  function mix(a, b, k) {
    var o = {};
    for (var n in a) o[n] = a[n] + ((b[n] === undefined ? a[n] : b[n]) - a[n]) * k;
    return o;
  }
  function walk(p, base, amp) {
    var o = mix(base, base, 0), s = Math.sin(p), A = amp === undefined ? 1 : amp;
    o.thF = .12 + .44 * s * A; o.thB = .12 - .44 * s * A;
    o.shF = o.thF - .6 * Math.max(0, Math.sin(p - 0.9)) * A - .05;
    o.shB = o.thB - .6 * Math.max(0, Math.sin(p + PI - 0.9)) * A - .05;
    o.uaB = base.uaB + .3 * s * A; o.crouch = (base.crouch || 0) + Math.abs(Math.cos(p)) * 2.2 * A;
    o.lean = base.lean + .05 * A;
    return o;
  }
  function pose(name) { return POSES[name]; }

  // 7등신: 다리 80 + 몸통 50 + 목 7 + 머리 24(0.8배) ≈ 165
  var SC = 1.22, TH = 40, SH = 40, UA = 28, FA = 26, HS = 0.8;
  function lerp2(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }

  // 굵기가 변하는 한 덩어리 팔다리 — 관절에서 끊기지 않는다
  function tube(c, pts, ws) {
    var n = pts.length, L = [], R = [], i;
    for (i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      var nx = -ty / l, ny = tx / l, w = ws[i] / 2;
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    var e = pts[n - 1], e0 = pts[n - 2], s = pts[0], s1 = pts[1];
    var el = Math.hypot(e[0] - e0[0], e[1] - e0[1]) || 1, sl = Math.hypot(s[0] - s1[0], s[1] - s1[1]) || 1;
    var ed = [(e[0] - e0[0]) / el, (e[1] - e0[1]) / el], sd = [(s[0] - s1[0]) / sl, (s[1] - s1[1]) / sl];
    var we = ws[n - 1] / 2 * 1.3, w0 = ws[0] / 2 * 1.3;
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < n - 1; i++) c.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
    c.lineTo(L[n - 1][0], L[n - 1][1]);
    c.bezierCurveTo(L[n - 1][0] + ed[0] * we, L[n - 1][1] + ed[1] * we, R[n - 1][0] + ed[0] * we, R[n - 1][1] + ed[1] * we, R[n - 1][0], R[n - 1][1]);
    for (i = n - 2; i > 0; i--) c.quadraticCurveTo(R[i][0], R[i][1], (R[i][0] + R[i - 1][0]) / 2, (R[i][1] + R[i - 1][1]) / 2);
    c.lineTo(R[0][0], R[0][1]);
    c.bezierCurveTo(R[0][0] + sd[0] * w0, R[0][1] + sd[1] * w0, L[0][0] + sd[0] * w0, L[0][1] + sd[1] * w0, L[0][0], L[0][1]);
    c.closePath();
  }
  function paintTube(c, pts, ws, T, edge) {
    tube(c, pts, ws);
    var a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    if (ny > 0) { nx = -nx; ny = -ny; }
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, rw = Math.max.apply(null, ws) / 2 + 2;
    var g = c.createLinearGradient(mx + nx * rw, my + ny * rw, mx - nx * rw, my - ny * rw);
    g.addColorStop(0, T.l); g.addColorStop(0.42, T.b); g.addColorStop(1, T.d);
    c.fillStyle = g; c.fill();
    if (edge !== false) { c.strokeStyle = T.e; c.lineWidth = 1; c.stroke(); }
  }
  // 닫힌 부드러운 모양
  function blob(c, pts) {
    var n = pts.length;
    c.beginPath();
    c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    c.closePath();
  }

  function shoe(c, A, a, st, back) {
    c.save(); c.translate(A[0], A[1]); c.rotate(-a * 0.5);
    var col = back ? shade(st.shoe, -0.2) : st.shoe, sneaker = st.outfit === 'track';
    var g = c.createLinearGradient(0, -5, 0, 7);
    g.addColorStop(0, shade(st.shoe.charAt(0) === '#' ? st.shoe : '#222222', sneaker ? 0.05 : 0.3)); g.addColorStop(1, col);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-5.5, -3.5); c.lineTo(3.5, -3.5);
    c.quadraticCurveTo(11.5, -2.2, 15.2, 1.4);
    c.quadraticCurveTo(17.2, 4.6, 15.2, 6.4);
    c.lineTo(-5.8, 6.4); c.quadraticCurveTo(-7.8, 5.6, -7.2, 1.2);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = sneaker ? '#cfcac0' : 'rgba(0,0,0,0.55)'; c.fillRect(-6.8, 4.6, 22, 1.9);        // 밑창
    if (!sneaker) { c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.ellipse(11, 0.5, 3, 1.1, 0.35, 0, 2 * PI); c.fill(); }
    else { c.strokeStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.moveTo(3, -2.5); c.lineTo(9, -0.5); c.stroke(); }
    c.restore();
  }

  function fist(c, W, a, T) {
    c.save(); c.translate(W[0], W[1]); c.rotate(Math.atan2(Math.cos(a), Math.sin(a))); c.scale(0.8, 0.8);
    var g = c.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, T.l); g.addColorStop(0.5, T.b); g.addColorStop(1, T.d);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-1.5, -4.4); c.lineTo(5.5, -4.8);
    c.quadraticCurveTo(10, -4.4, 10, -0.3); c.quadraticCurveTo(10, 4.4, 5.5, 4.6);
    c.lineTo(-1.5, 3.9); c.quadraticCurveTo(-3, 0, -1.5, -4.4); c.closePath(); c.fill();
    c.strokeStyle = T.e; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = 'rgba(60,25,15,0.45)'; c.lineWidth = 0.7;         // 손가락 마디
    c.beginPath(); c.moveTo(7.2, -3.6); c.lineTo(7.4, 3.6); c.moveTo(7.4, -1.2); c.lineTo(9.8, -1.2); c.moveTo(7.4, 1.4); c.lineTo(9.8, 1.4); c.stroke();
    c.fillStyle = T.b; c.beginPath(); c.moveTo(0.5, -4.4); c.quadraticCurveTo(5, -7.2, 7.8, -4.2); c.quadraticCurveTo(4, -3, 0.5, -3.2); c.fill();   // 엄지
    c.strokeStyle = T.e; c.lineWidth = 0.7; c.stroke();
    c.restore();
  }

  function person(c, f, t) {
    var st = f.st, P = f.pose, s = st.scale * SC, g = st.girth, gw = Math.pow(g, 0.6), T = tonesOf(st), O = st.outfit;
    c.save();
    c.translate(f.x, FY - (f.h || 0));
    c.scale(f.face * s, s);
    if (f.alpha !== undefined && f.alpha < 1) c.globalAlpha = Math.max(0, f.alpha);
    var dF = TH * Math.cos(P.thF) + SH * Math.cos(P.shF), dB = TH * Math.cos(P.thB) + SH * Math.cos(P.shB);
    var hx = 0, hy = -Math.max(dF, dB, 20) - 6;
    var rot = f.rot || 0;
    if (rot) {
      var lie = Math.min(1, Math.abs(Math.sin(rot)));
      c.translate(0, hy + (-13 - hy) * lie); c.rotate(rot); c.translate(0, -hy);
    }
    if (f.shake) c.translate((Math.random() - 0.5) * f.shake, 0);
    var cl = Math.cos(P.lean), sl = Math.sin(P.lean);
    function TP(a, b) { return [hx + a * cl - b * sl, hy + a * sl + b * cl]; }

    function leg(th, sa, back) {
      var H = [hx, hy], K = [hx + Math.sin(th) * TH, hy + Math.cos(th) * TH], A = [K[0] + Math.sin(sa) * SH, K[1] + Math.cos(sa) * SH];
      shoe(c, A, sa, st, back);
      var pts = [H, lerp2(H, K, 0.45), K, lerp2(K, A, 0.33), lerp2(K, A, 0.96)];
      var ws = [22 * gw, 19.5 * gw, 15.5, 15, 13.5];
      paintTube(c, pts, ws, back ? T.pantsB : T.pants);
      // 바지 주름: 무릎 뒤 접힘, 앞 주름선
      c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 1;
      c.beginPath();
      var kb = lerp2(K, H, 0.12), bend = th - sa;
      if (bend > 0.25) { c.moveTo(kb[0] - 5, kb[1] + 1); c.quadraticCurveTo(K[0] - 3, K[1] + 1, K[0] - 6, K[1] + 5); }
      var c1 = lerp2(H, K, 0.55), c2 = lerp2(K, A, 0.85);
      c.moveTo(c1[0] + 2, c1[1]); c.quadraticCurveTo(K[0] + 3, K[1], c2[0] + 2, c2[1]);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.moveTo(c1[0] + 4, c1[1]); c.quadraticCurveTo(K[0] + 5, K[1], c2[0] + 4, c2[1]); c.stroke();
      if (st.stripe) { c.strokeStyle = st.stripe; c.lineWidth = 1.8; c.beginPath(); c.moveTo(H[0], H[1]); c.quadraticCurveTo(K[0], K[1], A[0], A[1] - 3); c.stroke(); }
    }

    function arm(ua, fa, back, front) {
      var Sa = TP(back ? -2.5 * g : 1 * g, -44), E = [Sa[0] + Math.sin(ua) * UA, Sa[1] + Math.cos(ua) * UA];
      var Wr = [E[0] + Math.sin(fa) * FA, E[1] + Math.cos(fa) * FA], d = [Math.sin(fa), Math.cos(fa)];
      var TS = back ? T.skinB : T.skin, TT = back ? T.topB : T.top;
      var bare = O === 'tank', short = O === 'hawaii' || O === 'tee';
      var pts = [Sa, lerp2(Sa, E, 0.3), E, lerp2(E, Wr, 0.38), Wr];
      if (bare || short) {
        paintTube(c, pts, [15 * gw, 13 * gw, 9.5, 10.5 * Math.sqrt(gw), 8], TS);
        // 팔 근육 결
        c.strokeStyle = 'rgba(80,35,20,0.25)'; c.lineWidth = 0.9;
        var m1 = lerp2(Sa, E, 0.6); c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(E[0] + (m1[0] - E[0]) * 0.2, E[1] + (m1[1] - E[1]) * 0.2 + 1); c.stroke();
        if (short) {
          paintTube(c, [lerp2(Sa, E, -0.05), lerp2(Sa, E, 0.3), lerp2(Sa, E, 0.6)], [18 * gw, 16.5 * gw, 15.5 * gw], TT);
          if (st.pattern) patternDots(c, lerp2(Sa, E, 0.3), 6);
        }
      } else {
        paintTube(c, [Sa, lerp2(Sa, E, 0.3), E, lerp2(E, Wr, 0.4), lerp2(E, Wr, 0.9)], [16.5 * gw, 14.5 * gw, 12, 11.5, 11], TT);
        // 팔꿈치 안쪽 주름
        c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.9;
        var e1 = lerp2(E, Sa, 0.18), e2 = lerp2(E, Wr, 0.18);
        c.beginPath(); c.moveTo(e1[0], e1[1]); c.quadraticCurveTo(E[0] + (E[0] - (e1[0] + e2[0]) / 2) * 0.6, E[1] + (E[1] - (e1[1] + e2[1]) / 2) * 0.6, e2[0], e2[1]); c.stroke();
        if (O === 'suit') paintTube(c, [lerp2(E, Wr, 0.84), lerp2(E, Wr, 1.02)], [9.5, 9], tones(back ? shade(st.shirt, -0.25).replace(/rgb\((\d+),(\d+),(\d+)\)/, rgbHex) : st.shirt), false);
        else paintTube(c, [lerp2(E, Wr, 0.82), lerp2(E, Wr, 0.98)], [11, 10], tones(shade(st.top, -0.25).replace(/rgb\((\d+),(\d+),(\d+)\)/, rgbHex)), false);
        if (st.stripe) { c.strokeStyle = st.stripe; c.lineWidth = 1.6; c.beginPath(); c.moveTo(Sa[0], Sa[1] - 4); c.quadraticCurveTo(E[0], E[1] - 5, Wr[0] - d[0] * 4, Wr[1] - d[1] * 4 - 4); c.stroke(); }
      }
      var hand = [Wr[0] + d[0] * 2.5, Wr[1] + d[1] * 2.5];
      if (front) weapon(c, st.weapon, hand[0] + d[0] * 4.5, hand[1] + d[1] * 4.5, fa + P.wpn, f);
      fist(c, hand, fa, TS);
    }

    // 손을 월드의 한 점에 붙이는 팔(IK) — 잡아 들 때 손이 적의 몸에 닿게
    function ikArm(back, T) {
      var Sa = TP(back ? -2.5 * g : 1 * g, -44);
      var lx = (T[0] - f.x) / (f.face * s), ly = (T[1] - (FY - (f.h || 0))) / s;
      var dx = lx - Sa[0], dy = ly - Sa[1], d = Math.min(Math.hypot(dx, dy), UA + FA - 0.5), a0 = Math.atan2(dx, dy);
      var ca = Math.max(-1, Math.min(1, (UA * UA + d * d - FA * FA) / (2 * UA * d || 1)));
      var ua = a0 - Math.acos(ca), E = [Sa[0] + Math.sin(ua) * UA, Sa[1] + Math.cos(ua) * UA];
      return [ua, Math.atan2(lx - E[0], ly - E[1])];
    }
    var aB = f.ik ? ikArm(true, f.ik.B) : [P.uaB, P.faB], aF = f.ik ? ikArm(false, f.ik.F) : [P.uaF, P.faF];
    // 뒤팔·뒷다리·앞다리
    arm(aB[0], aB[1], true, false);
    leg(P.thB, P.shB, true);
    leg(P.thF, P.shF, false);
    // 목
    var nb = TP(0.5 * g, -47), nt = TP(1.8 * g, -55.5);
    nt = [nt[0] + Math.sin(P.lean + (P.tilt || 0)) * 1, nt[1]];
    paintTube(c, [nb, nt], [12 * gw, 10.5], T.skin);
    torso(c, st, T, hx, hy, P, g, f);
    head(c, st, nt, P.lean * 0.55 + (P.tilt || 0), f, t);
    arm(aF[0], aF[1], false, true);
    c.restore();
  }
  function rgbHex(m, r, g, b) { return '#' + ((1 << 24) + (+r << 16) + (+g << 8) + +b).toString(16).slice(1); }
  function patternDots(c, p, r) {
    c.save(); c.fillStyle = 'rgba(225,194,90,0.55)';
    for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(p[0] + Math.cos(i * 1.9) * r * 0.6, p[1] + Math.sin(i * 1.9) * r * 0.6, 1.5, 0, 2 * PI); c.fill(); }
    c.restore();
  }

  // 몸통 — 엉덩이를 원점으로, x 앞 / y 아래
  function torso(c, st, T, hx, hy, P, g, f) {
    var O = st.outfit, bl = st.belly ? 13 : 0, suit = O === 'suit';
    c.save(); c.translate(hx, hy); c.rotate(P.lean);
    var body = suit ? [[-13 * g, 16], [-13.4 * g, 2], [-10.5 * g, -17], [-12 * g, -31], [-12.6 * g, -41], [-7.5 * g, -49.5], [3.5 * g, -50.5], [10 * g, -46], [12.8 * g, -37], [12 * g, -27], [11.3 * g, -16], [11.6 * g, -4], [12.4 * g, 6], [12.6 * g, 15.5]]
      : [[-11 * g, 7], [-13.2 * g, -3], [-10.2 * g, -17], [-12 * g, -31], [-12.6 * g, -41], [-7.5 * g, -49.5], [3.5 * g, -50.5], [10 * g, -46], [12.8 * g + bl * 0.25, -37], [11.8 * g + bl * 0.8, -27], [11 * g + bl, -15], [11 * g + bl * 0.7, -4], [9.5 * g + bl * 0.2, 4], [0, 7.5]];
    blob(c, body);
    var skinBody = O === 'tank';
    var B = skinBody ? T.skin : T.top;
    var gr = c.createLinearGradient(0, -52, 0, 16);
    gr.addColorStop(0, B.l); gr.addColorStop(0.35, B.b); gr.addColorStop(1, B.d);
    c.fillStyle = gr; c.fill();
    c.save(); c.clip();
    // 등 쪽 그늘, 앞 가장자리 빛
    var sg = c.createLinearGradient(-14 * g, 0, 4 * g, 0);
    sg.addColorStop(0, 'rgba(0,0,0,0.38)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(-20 * g, -60, 30 * g, 80);
    if (skinBody) {
      // 민소매: 겨드랑이 파임 + 가슴 앞 목둘레
      var TT = T.top;
      var tg = c.createLinearGradient(0, -48, 0, 8); tg.addColorStop(0, TT.l); tg.addColorStop(0.4, TT.b); tg.addColorStop(1, TT.d);
      c.fillStyle = tg;
      c.beginPath(); c.moveTo(-22, 20); c.lineTo(-22, -40); c.quadraticCurveTo(-13, -43, -8.5, -49); c.lineTo(-4.5, -50);
      c.quadraticCurveTo(-4, -37, 1.5 * g, -35); c.quadraticCurveTo(6 * g, -36, 8 * g, -43); c.lineTo(22, -44); c.lineTo(22, 20); c.closePath(); c.fill();
      c.strokeStyle = TT.e; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(6, -22, 4, -12); c.moveTo(-6, -25); c.quadraticCurveTo(-3, -14, -6, -4); c.stroke();
    }
    if (O === 'track') {
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(4 * g, -50); c.quadraticCurveTo(12 * g, -34, 11 * g, 2); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-20, 0, 40, 5);
    }
    if (O === 'hoodie') {
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-1, -15); c.quadraticCurveTo(6, -17, 11, -13); c.moveTo(-1, -15); c.lineTo(1, -1); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-20, 1, 40, 5);
    }
    if (O === 'hawaii') {
      c.fillStyle = 'rgba(225,194,90,0.5)';
      for (var i = 0; i < 16; i++) { var px = -12 + hash(i * 3.7) * 26, py = -48 + hash(i * 5.1) * 52; c.beginPath(); c.ellipse(px, py, 2.4, 1.3, i, 0, 2 * PI); c.fill(); }
      c.fillStyle = T.skin.b; c.beginPath(); c.moveTo(3.5 * g, -50.5); c.lineTo(10 * g, -46); c.lineTo(8.5 * g, -38); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.moveTo(8.5 * g, -38); c.lineTo(10.5 * g, 5); c.stroke();
    }
    if (O === 'tee') {
      c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(3.5 * g, -49); c.quadraticCurveTo(7 * g, -45, 10 * g, -45.5); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); c.moveTo(4, -22); c.quadraticCurveTo(12 + bl * 0.6, -16, 8 + bl * 0.6, -6); c.stroke();
    }
    // 바지 허리(양복은 윗도리가 덮는다)
    if (!suit) {
      var top = O === 'tee' ? 3 : O === 'hawaii' ? 4 : 1;
      var pg = c.createLinearGradient(0, top, 0, 12); pg.addColorStop(0, T.pants.b); pg.addColorStop(1, T.pants.d);
      c.fillStyle = pg; c.fillRect(-22 * g, top, 44 * g, 20);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(-22 * g, top, 44 * g, 2.6);
      if (O === 'tank' || O === 'tee') { c.fillStyle = '#9c8f6a'; c.fillRect(9 * g + bl * 0.2 - 3, top - 0.2, 3.5, 3); }
    }
    if (suit) {
      // 셔츠·옷깃·단추·주머니
      c.fillStyle = st.shirt;
      c.beginPath(); c.moveTo(3 * g, -51); c.lineTo(10.4 * g, -46); c.quadraticCurveTo(12.3 * g, -40, 10.6 * g, -31); c.lineTo(7.5 * g, -38); c.closePath(); c.fill();
      c.fillStyle = shade(st.top, 0.1);
      c.beginPath(); c.moveTo(3.5 * g, -50.5); c.quadraticCurveTo(7 * g, -43, 10.8 * g, -30); c.lineTo(8.6 * g, -31); c.quadraticCurveTo(6 * g, -40, 2 * g, -47); c.closePath(); c.fill();   // 옷깃
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(3.5 * g, -50.5); c.quadraticCurveTo(7 * g, -43, 10.8 * g, -30); c.lineTo(11.4 * g, 15); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(11.2 * g, -16, 1.3, 0, 2 * PI); c.arc(11.4 * g, -5, 1.3, 0, 2 * PI); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.moveTo(1 * g, 2); c.lineTo(10 * g, 1.5); c.moveTo(-12.8 * g, 6); c.lineTo(-12.6 * g, 16); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.moveTo(-3, -38); c.quadraticCurveTo(2, -30, 1, -20); c.moveTo(-7, -30); c.quadraticCurveTo(-4, -22, -6, -14); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.moveTo(-11, -44); c.quadraticCurveTo(0, -50, 9, -45); c.stroke();
    }
    c.restore();   // 클립 끝
    blob(c, body); c.strokeStyle = (skinBody ? T.skin : T.top).e; c.lineWidth = 1; c.stroke();
    if (O === 'hoodie') {   // 모자
      var hg = c.createRadialGradient(-9, -52, 1, -9, -50, 9); hg.addColorStop(0, T.top.l); hg.addColorStop(1, T.top.d);
      c.fillStyle = hg; c.beginPath(); c.ellipse(-8.5 * g, -49.5, 8.5, 6, -0.3, 0, 2 * PI); c.fill(); c.strokeStyle = T.top.e; c.stroke();
      c.strokeStyle = '#d8d4cc'; c.lineWidth = 1; c.beginPath(); c.moveTo(6, -48); c.lineTo(7, -38); c.moveTo(8.5, -47); c.lineTo(9.5, -39); c.stroke();
    }
    if (O === 'track') { c.fillStyle = T.top.b; c.beginPath(); c.moveTo(-7.5, -49); c.lineTo(-6, -54.5); c.lineTo(4.5, -54); c.lineTo(4, -50); c.closePath(); c.fill(); c.strokeStyle = T.top.e; c.stroke(); }
    if (O === 'suit') {   // 셔츠 깃이 목을 두른다
      c.fillStyle = st.shirt; c.beginPath(); c.moveTo(-6, -49.5); c.lineTo(-5, -53.5); c.lineTo(3.5, -53); c.lineTo(6.5, -48.5); c.lineTo(3, -50.5); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.8; c.stroke();
    }
    if (f.knives) {
      for (var kn = 0; kn < f.knives; kn++) {
        var ky = -34 + kn * 9;
        c.save(); c.translate(-12.5 * g, ky); c.rotate(-0.95 - kn * 0.25);
        c.fillStyle = '#2a1b12'; c.fillRect(-2.5, -17, 5, 13);
        c.fillStyle = '#9a9a9a'; c.fillRect(-3.5, -4.5, 7, 2.5);
        c.restore();
        c.fillStyle = 'rgba(120,8,8,0.85)'; c.beginPath(); c.ellipse(-11.5 * g, ky + 5, 3, 7, 0.1, 0, 2 * PI); c.fill();
      }
    }
    c.restore();
  }

  function facePath(c) {
    c.beginPath();
    c.moveTo(-6, 1.5);
    c.bezierCurveTo(-11.5, -2, -13.8, -10, -12.3, -16.5);
    c.bezierCurveTo(-10.6, -23.5, -3, -28, 3, -26.4);
    c.bezierCurveTo(8.2, -25.3, 11.2, -22, 11.7, -18.2);
    c.quadraticCurveTo(12.9, -16.3, 12.5, -14.8);
    c.quadraticCurveTo(11.2, -13.8, 11.9, -12.3);
    c.lineTo(15.7, -7.4);
    c.quadraticCurveTo(16.1, -6.1, 14.6, -5.8);
    c.quadraticCurveTo(13.4, -5.9, 12.8, -5.1);
    c.quadraticCurveTo(13.8, -4.4, 13.4, -3.4);
    c.lineTo(12.4, -2.9);
    c.quadraticCurveTo(13.3, -2.3, 12.9, -1.5);
    c.quadraticCurveTo(11.8, -0.8, 12.1, 0.5);
    c.quadraticCurveTo(12.9, 2.8, 10.4, 3.9);
    c.quadraticCurveTo(5.5, 4.4, 1.3, 1.4);
    c.quadraticCurveTo(-2.5, 0.8, -6, 1.5);
    c.closePath();
  }
  // 머리 — 목 끝(턱과 목이 만나는 곳)이 원점, x 앞
  function head(c, st, p, a, f, t) {
    c.save(); c.translate(p[0], p[1]); c.rotate(a); c.scale(HS, HS);
    var T = tonesOf(st).skin;
    // 옆얼굴 윤곽
    facePath(c);
    var g = c.createRadialGradient(7, -17, 2, 3, -10, 20);
    g.addColorStop(0, T.l); g.addColorStop(0.5, T.b); g.addColorStop(1, T.d);
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // 아래턱 그늘·눈두덩 그늘·광대
    var jg = c.createLinearGradient(0, -7, 0, 5); jg.addColorStop(0, 'rgba(60,20,10,0)'); jg.addColorStop(1, 'rgba(60,20,10,0.3)');
    c.fillStyle = jg; c.fillRect(-15, -7, 34, 13);
    var eg = c.createRadialGradient(9.6, -12.4, 0.5, 9.6, -12.4, 4.5); eg.addColorStop(0, 'rgba(60,20,15,0.45)'); eg.addColorStop(1, 'rgba(60,20,15,0)');
    c.fillStyle = eg; c.fillRect(4, -18, 12, 12);
    c.fillStyle = 'rgba(255,230,210,0.09)'; c.beginPath(); c.ellipse(8.2, -9, 3, 1.6, -0.3, 0, 2 * PI); c.fill();
    if (st.stubble) {    // 수염 자국
      c.fillStyle = 'rgba(35,28,26,' + (st.stubble * 0.42) + ')';
      c.beginPath(); c.moveTo(12.8, -5.1); c.quadraticCurveTo(10, -6.5, 6, -5.2); c.quadraticCurveTo(1, -3, -1.5, 0.5); c.lineTo(3, 6); c.lineTo(15, 6); c.lineTo(15, -5); c.closePath(); c.fill();
      c.fillStyle = 'rgba(30,24,22,' + (st.stubble * 0.5) + ')';
      for (var i = 0; i < 22; i++) { var sx = 2 + hash(i * 2.3) * 11, sy = -4.5 + hash(i * 7.9) * 8.5; c.fillRect(sx, sy, 0.5, 0.5); }
    }
    c.restore();
    facePath(c); c.strokeStyle = T.e; c.lineWidth = 0.9; c.stroke();
    // 콧방울·팔자 주름
    c.strokeStyle = 'rgba(90,40,25,0.55)'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(13.2, -6.6); c.quadraticCurveTo(11.7, -7.3, 12.1, -5.6); c.stroke();
    c.strokeStyle = 'rgba(90,40,25,0.25)'; c.beginPath(); c.moveTo(11.8, -7.2); c.quadraticCurveTo(10.6, -5, 11, -2.6); c.stroke();
    // 귀
    c.save(); c.translate(-1.2, -10.2); c.rotate(0.22);
    var eg2 = c.createLinearGradient(-3, 0, 3, 0); eg2.addColorStop(0, T.b); eg2.addColorStop(1, T.l);
    c.fillStyle = eg2;
    c.beginPath(); c.moveTo(1.5, -4.6); c.quadraticCurveTo(-3.6, -5.6, -3, -0.5); c.quadraticCurveTo(-2.6, 3.6, -0.6, 5); c.quadraticCurveTo(1.6, 5.4, 1.8, 3.2); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,40,25,0.45)'; c.lineWidth = 0.6; c.stroke();
    c.strokeStyle = 'rgba(90,40,25,0.3)'; c.beginPath(); c.moveTo(0.8, -3); c.quadraticCurveTo(-2, -3, -1.6, 0.5); c.quadraticCurveTo(-1.2, 2, 0.4, 2.2); c.stroke();
    c.restore();
    // 눈
    var hurt = f.hurtT > 0;
    if (st.shades) {
      c.fillStyle = '#0c0c0e'; c.beginPath(); c.moveTo(6.2, -14.8); c.lineTo(12.6, -14.9); c.quadraticCurveTo(12.4, -11.2, 9.5, -11); c.quadraticCurveTo(6.5, -11.2, 6.2, -14.8); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(8, -14.2, 3, 0.8);
      c.strokeStyle = '#0c0c0e'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(6.2, -14); c.lineTo(-1, -12); c.stroke();
    } else if (hurt || f.dead) {
      c.strokeStyle = '#2a1510'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(7.8, -12.4); c.quadraticCurveTo(9.6, -11.2, 11.3, -12.6); c.stroke();
    } else {
      c.fillStyle = '#e9e1d6'; c.beginPath(); c.moveTo(8.1, -12.6); c.quadraticCurveTo(9.8, -13.9, 11.3, -12.7); c.quadraticCurveTo(10.2, -11.6, 8.6, -11.9); c.closePath(); c.fill();
      c.fillStyle = '#1d140f'; c.beginPath(); c.ellipse(10.3, -12.55, 0.85, 1.1, 0, 0, 2 * PI); c.fill();
      c.strokeStyle = '#2a1510'; c.lineWidth = 1.05; c.beginPath(); c.moveTo(7.8, -12.7); c.quadraticCurveTo(9.8, -14.3, 11.5, -12.7); c.stroke();
      c.strokeStyle = 'rgba(80,35,25,0.4)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(8.4, -11.6); c.quadraticCurveTo(9.8, -11.1, 11, -11.9); c.stroke();
    }
    // 눈썹
    if (st.style !== 'bald' || true) {
      c.strokeStyle = st.style === 'bald' ? shade(st.skin, -0.55) : st.hair; c.lineWidth = 1.7; c.lineCap = 'round';
      c.beginPath();
      if (st.brow === 'angry') { c.moveTo(6.4, -16.6); c.quadraticCurveTo(9.5, -16.4, 12, -14.6); }
      else { c.moveTo(6.4, -15.8); c.quadraticCurveTo(9.4, -16.6, 12.2, -15.3); }
      c.stroke(); c.lineCap = 'butt';
    }
    // 입
    c.strokeStyle = 'rgba(70,25,20,0.8)'; c.lineWidth = 0.8;
    if (hurt) { c.fillStyle = '#3a1210'; c.beginPath(); c.ellipse(12.3, -2.9, 0.9, 1.4, 0, 0, 2 * PI); c.fill(); }
    else { c.beginPath(); c.moveTo(10, -3); c.lineTo(12.5, -2.95); c.stroke(); }
    c.fillStyle = 'rgba(150,60,55,0.35)'; c.beginPath(); c.ellipse(12.6, -2.1, 0.8, 0.6, 0, 0, 2 * PI); c.fill();
    hairFront(c, st);
    c.restore();
  }

  function hairGrad(c, st, y0, y1) {
    var g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, st.hairL); g.addColorStop(0.45, st.hair); g.addColorStop(1, shade(st.hair, -0.35));
    return g;
  }
  function hairBack(c, st) {
    c.fillStyle = hairGrad(c, st, -32, 6);
    c.beginPath();
    c.moveTo(3, -27);
    c.bezierCurveTo(-8, -35, -19, -27, -17.5, -15);
    c.bezierCurveTo(-18.5, -8, -15, -1, -11, 4.5);
    c.quadraticCurveTo(-9.5, 1.5, -8.5, 4);
    c.quadraticCurveTo(-7, 0, -5, 1);
    c.lineTo(-4, -14); c.closePath(); c.fill();
  }
  function hairFront(c, st) {
    var HD = shade(st.hair, -0.4);
    if (st.style === 'bald') {
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(1, -24, 6, 2.2, -0.2, 0, 2 * PI); c.fill();
      c.fillStyle = 'rgba(40,30,25,0.25)'; c.beginPath(); c.moveTo(-5, -9); c.quadraticCurveTo(-11, -12, -10, -3); c.quadraticCurveTo(-7, -2, -5, -9); c.fill();
      return;
    }
    c.fillStyle = hairGrad(c, st, -32, -8);
    if (st.style === 'mop') {      // 부스스한 파마 — 뒤·옆으로 곱슬곱슬 뻗고 앞머리는 눈썹 위까지
      c.fillStyle = hairGrad(c, st, -35, 5);
      c.beginPath();
      c.moveTo(12.8, -16);
      c.bezierCurveTo(14.8, -21.5, 12.8, -30.5, 4, -32.3);
      c.quadraticCurveTo(1, -35, -3, -33);
      c.quadraticCurveTo(-8, -35.5, -11, -31.5);
      c.quadraticCurveTo(-16.5, -31, -16.8, -25);
      c.quadraticCurveTo(-21, -21, -18.6, -15.5);
      c.quadraticCurveTo(-21.2, -10, -17.4, -6);
      c.quadraticCurveTo(-18.6, 0, -14.6, 2.6);        // 뒷머리 끝 곱슬
      c.quadraticCurveTo(-13.6, -1.5, -11.6, 0.6);
      c.quadraticCurveTo(-11, 4.6, -8.2, 5);
      c.quadraticCurveTo(-7.8, 0.5, -5.8, -0.6);
      c.quadraticCurveTo(-4.8, -4.6, -3.6, -6.8);
      c.quadraticCurveTo(-1.4, -9.6, 0.6, -7.2);        // 귀 위를 덮는 옆머리
      c.quadraticCurveTo(1.8, -5.8, 2.5, -8.8);
      c.quadraticCurveTo(2.4, -13.5, 2.2, -17);
      c.quadraticCurveTo(3.2, -21.2, 4.9, -18.3);       // 앞머리 끝
      c.quadraticCurveTo(6.5, -21.4, 7.9, -17.5);
      c.quadraticCurveTo(9.5, -20.6, 10.7, -16.7);
      c.quadraticCurveTo(12, -19.2, 12.8, -16);
      c.closePath(); c.fill();
      c.strokeStyle = HD; c.lineWidth = 0.7; c.stroke();
      c.save(); c.clip();
      // 곱슬 — 작은 고리를 겹겹이(어두운 틈 + 밝은 윗면)
      c.lineCap = 'round';
      for (var i = 0; i < 46; i++) {
        var hx = -18 + hash(i * 1.31) * 30, hy = -33 + hash(i * 2.77) * 36;
        var r = 1.6 + hash(i * 5.3) * 1.4, a0 = hash(i * 7.1) * 6;
        c.strokeStyle = 'rgba(0,0,0,0.42)'; c.lineWidth = 0.75;
        c.beginPath(); c.arc(hx, hy + 0.6, r, a0, a0 + 3.4); c.stroke();
        c.strokeStyle = 'rgba(210,180,150,' + (0.1 + 0.18 * (1 - (hy + 33) / 36)) + ')'; c.lineWidth = 0.7;
        c.beginPath(); c.arc(hx, hy, r * 0.8, 3.6, 5.6); c.stroke();
      }      c.strokeStyle = 'rgba(255,240,220,0.2)'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(-11, -28); c.quadraticCurveTo(-3, -32.2, 6, -28.8); c.stroke();
      c.lineCap = 'butt';
      c.restore();
      return;
    }
    if (st.style === 'slick') {
      c.beginPath();
      c.moveTo(-11.5, -6);
      c.bezierCurveTo(-15.5, -20, -9, -29.5, 1, -29);
      c.bezierCurveTo(8, -29, 11.8, -25, 11.2, -20.6);
      c.quadraticCurveTo(7, -22.8, 3, -21.5);
      c.quadraticCurveTo(1.8, -15, 1.6, -10.5);
      c.lineTo(-0.4, -10.5);
      c.quadraticCurveTo(-4, -14, -5.5, -7);
      c.quadraticCurveTo(-8, -5, -11.5, -6);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-8, -25); c.quadraticCurveTo(0, -29.3, 8.5, -25.2); c.moveTo(-11, -18); c.quadraticCurveTo(-3, -25.5, 5, -23.5); c.stroke();
      return;
    }
    // buzz / crop — 두피가 비치는 짧은 머리
    c.save(); c.globalAlpha *= st.style === 'buzz' ? 0.82 : 1;
    c.beginPath();
    c.moveTo(-10.5, -5);
    c.bezierCurveTo(-14.4, -17, -9.5, -28, 1, -27.8);
    c.bezierCurveTo(7, -27.4, 10.8, -24, 11, -20.5);
    if (st.style === 'crop') { c.lineTo(9.6, -21.8); c.lineTo(8.6, -20.3); c.lineTo(6.4, -21.6); }
    c.quadraticCurveTo(3.8, -21.2, 2.2, -19.8);
    c.quadraticCurveTo(2, -15, 1.4, -11);
    c.lineTo(-0.6, -11);
    c.quadraticCurveTo(-3.8, -13.5, -5, -7.5);
    c.quadraticCurveTo(-7.5, -4.5, -10.5, -5);
    c.closePath(); c.fill();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.13)';
    for (var i = 0; i < 14; i++) c.fillRect(-10 + hash(i * 3.3) * 18, -26 + hash(i * 9.1) * 7, 0.5, 0.5);
  }

  function weapon(c, kind, x, y, a, f) {
    var d = dir(a), px = -d[1], py = d[0];
    if (kind === 'hammer') {
      // 나무 자루
      limb(c, x - d[0] * 7, y - d[1] * 7, x + d[0] * 30, y + d[1] * 30, 5, 5.5, '#8a5a2b', '#c0894a', '#4f2f12', '#3a200b');
      // 쇠 머리
      var hx = x + d[0] * 32, hy = y + d[1] * 32;
      if (f.trail) { var mtx = c.getTransform(), tp = mtx.transformPoint(new DOMPoint(hx, hy)); f.trail.push([tp.x, tp.y]); if (f.trail.length > 7) f.trail.shift(); }
      c.save(); c.translate(hx, hy); c.rotate(Math.atan2(py, px)); c.scale(-1, 1);
      var g = c.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#d5d9de'); g.addColorStop(0.45, '#8b9097'); g.addColorStop(1, '#3e4146');
      c.fillStyle = g;
      c.beginPath(); c.rect(-5, -5, 15, 10); c.fill();               // 때리는 면
      c.beginPath(); c.moveTo(-4, -4); c.quadraticCurveTo(-15, -4, -19, 3); c.lineTo(-16, 4); c.quadraticCurveTo(-12, 0, -4, 3); c.closePath(); c.fill();   // 노루발
      c.strokeStyle = '#26282b'; c.lineWidth = 1; c.strokeRect(-5, -5, 15, 10);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(7, -4.5, 2.5, 9);
      if (f.blood) { c.fillStyle = 'rgba(120,8,8,' + Math.min(0.85, f.blood) + ')'; c.beginPath(); c.moveTo(-10, -1); c.quadraticCurveTo(-16, 0, -18.5, 3.5); c.lineTo(-16, 4); c.quadraticCurveTo(-13, 2, -9, 2.5); c.fill(); c.beginPath(); c.arc(-6, 3, 1.8, 0, 2 * PI); c.fill(); }
      c.restore();
    } else if (kind === 'stick') {
      var ex = x + d[0] * 64, ey = y + d[1] * 64;
      c.save(); c.translate(x - d[0] * 10, y - d[1] * 10); c.rotate(Math.atan2(d[1], d[0]));
      var sg = c.createLinearGradient(0, -4, 0, 4); sg.addColorStop(0, '#d9b27a'); sg.addColorStop(1, '#8a6232');
      c.fillStyle = sg; c.fillRect(0, -4, 76, 8);
      c.strokeStyle = 'rgba(80,50,20,0.5)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(4, -1); c.lineTo(70, -2); c.moveTo(10, 2); c.lineTo(72, 1.5); c.stroke();
      c.fillStyle = '#555'; c.fillRect(68, -5, 2, 3);
      c.restore();
    } else if (kind === 'knife') {
      c.save(); c.translate(x, y); c.rotate(Math.atan2(d[1], d[0]));
      c.fillStyle = '#20150e'; c.fillRect(-6, -2.5, 11, 5);
      var kg = c.createLinearGradient(0, -3, 0, 3); kg.addColorStop(0, '#f2f4f6'); kg.addColorStop(1, '#8c9197');
      c.fillStyle = kg; c.beginPath(); c.moveTo(5, -2.5); c.lineTo(24, -1); c.lineTo(26, 0.5); c.lineTo(5, 2.5); c.closePath(); c.fill();
      c.restore();
    } else if (kind === 'pipe') {
      limb(c, x - d[0] * 10, y - d[1] * 10, x + d[0] * 62, y + d[1] * 62, 6.5, 6.5, '#8e949b', '#dfe3e7', '#4a4f55', '#2e3136');
    }
  }

  function bodyPoint(f, a, b) {
    var P = f.pose, s = f.st.scale * SC;
    var dF = TH * Math.cos(P.thF) + SH * Math.cos(P.shF), dB = TH * Math.cos(P.thB) + SH * Math.cos(P.shB);
    var hy = -Math.max(dF, dB, 20) - 6, rot = f.rot || 0;
    var cl = Math.cos(P.lean), sl = Math.sin(P.lean);
    var px = a * cl - b * sl, py = hy + a * sl + b * cl;             // 몸통 → 몸
    if (rot) {
      var lie = Math.min(1, Math.abs(Math.sin(rot))), cr = Math.cos(rot), sr = Math.sin(rot), qy = py - hy;
      var rx = px * cr - qy * sr, ry = px * sr + qy * cr;
      px = rx; py = ry + hy + (-13 - hy) * lie;
    }
    return [f.x + f.face * s * px, FY - (f.h || 0) + s * py];
  }

  // ─────────────── 엔딩: 새벽 옥상 ───────────────
  // door: 계단실 문 열림 0~1, t: 시간(새 날갯짓·해 떠오름)
  function rooftop(c, vw, t, door, sunK) {
    var hz = 440, sunY = 372 - 60 * sunK, sunX = vw * 0.72;
    // 하늘: 위는 밤, 지평선은 새벽 주황
    var g = c.createLinearGradient(0, 0, 0, hz + 20);
    g.addColorStop(0, '#10142e'); g.addColorStop(0.35, '#2c2450'); g.addColorStop(0.62, '#7a3a62');
    g.addColorStop(0.82, '#e0715c'); g.addColorStop(0.95, '#ffc27a'); g.addColorStop(1, '#ffe2a8');
    c.fillStyle = g; c.fillRect(0, 0, vw, hz + 30);
    // 남은 별
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (var i = 0; i < 40; i++) { var sx = hash(i * 3.1) * vw, sy = hash(i * 7.3) * 170; c.globalAlpha = (0.3 + 0.5 * hash(i)) * (1 - sunK * 0.7); c.fillRect(sx, sy, 1.4, 1.4); }
    c.globalAlpha = 1;
    // 해와 번짐
    c.save(); c.globalCompositeOperation = 'lighter';
    var sg = c.createRadialGradient(sunX, sunY, 10, sunX, sunY, 360);
    sg.addColorStop(0, 'rgba(255,220,150,0.75)'); sg.addColorStop(0.25, 'rgba(255,150,90,0.3)'); sg.addColorStop(1, 'rgba(255,120,80,0)');
    c.fillStyle = sg; c.fillRect(sunX - 380, sunY - 380, 760, 760);
    c.restore();
    c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(sunX, sunY, 40, 0, 2 * PI); c.fill();
    // 가로로 긴 구름: 아랫면이 햇빛에 물든다
    for (i = 0; i < 6; i++) {
      var cx = (hash(i * 5.7) * 1.3 - 0.15) * vw + t * (4 + i), cy = 150 + hash(i * 2.9) * 170, cw = 160 + hash(i) * 260;
      var cg = c.createLinearGradient(0, cy - 10, 0, cy + 12);
      cg.addColorStop(0, 'rgba(60,40,80,0.55)'); cg.addColorStop(1, 'rgba(255,150,110,0.55)');
      c.fillStyle = cg; c.beginPath(); c.ellipse(cx % (vw + 400) - 200, cy, cw, 9 + hash(i * 9) * 8, 0, 0, 2 * PI); c.fill();
    }
    // 먼 도시(흐릿) → 가까운 도시(어둡게)
    skyline(c, vw, hz, 11, 25, 85, 'rgba(120,70,100,0.85)', 0.2, 0, 0, 0);
    skyline(c, vw, hz, 29, 40, 150, '#261c33', 0.5, 0, sunX, 170);
    // 지평선 안개
    var fg = c.createLinearGradient(0, hz - 60, 0, hz + 10);
    fg.addColorStop(0, 'rgba(255,170,120,0)'); fg.addColorStop(1, 'rgba(255,170,120,0.35)');
    c.fillStyle = fg; c.fillRect(0, hz - 60, vw, 70);
    // 새
    c.strokeStyle = 'rgba(20,15,30,0.8)'; c.lineWidth = 1.6;
    for (i = 0; i < 5; i++) {
      var bx = (vw * 0.2 + i * 60 + t * 38) % (vw + 100) - 50, by = 120 + i * 18 + Math.sin(t * 1.3 + i) * 8, fl = Math.sin(t * 9 + i * 2) * 5;
      c.beginPath(); c.moveTo(bx - 8, by - fl); c.quadraticCurveTo(bx - 3, by - 3, bx, by); c.quadraticCurveTo(bx + 3, by - 3, bx + 8, by - fl); c.stroke();
    }
    // 옥상 뒤 난간(하늘에 실루엣)
    c.fillStyle = '#1a1420';
    c.fillRect(0, 412, vw, 3.5); c.fillRect(0, 428, vw, 2.5);
    for (var px = 250; px < vw; px += 46) c.fillRect(px, 412, 3.5, 34);
    // 옥상 바닥
    var rg = c.createLinearGradient(0, 444, 0, 540);
    rg.addColorStop(0, '#5b4650'); rg.addColorStop(0.2, '#3d3440'); rg.addColorStop(1, '#17141c');
    c.fillStyle = rg; c.fillRect(0, 444, vw, 96);
    c.fillStyle = 'rgba(255,190,140,0.35)'; c.fillRect(0, 444, vw, 2);
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1;
    c.beginPath(); [462, 486, 520].forEach(function (y) { c.moveTo(0, y); c.lineTo(vw, y); }); c.stroke();
    // 바닥에 비친 햇빛 띠
    c.save(); c.globalCompositeOperation = 'lighter';
    var lg = c.createRadialGradient(sunX, 470, 5, sunX, 470, 260);
    lg.addColorStop(0, 'rgba(255,170,110,0.28)'); lg.addColorStop(1, 'rgba(255,170,110,0)');
    c.translate(sunX, 470); c.scale(2.2, 0.3); c.translate(-sunX, -470); c.fillStyle = lg; c.fillRect(sunX - 270, 200, 540, 540);
    c.restore();
    // 실외기 두 대(해 쪽 모서리에 햇빛)
    [[vw * 0.33, 64, 40], [vw * 0.33 + 78, 48, 34]].forEach(function (u) {
      var ux = u[0], uw = u[1], uh = u[2], uy = 446 - uh;
      var ug = c.createLinearGradient(ux, 0, ux + uw, 0); ug.addColorStop(0, '#231c29'); ug.addColorStop(1, '#3a2e3c');
      c.fillStyle = ug; c.fillRect(ux, uy, uw, uh);
      c.fillStyle = 'rgba(255,170,110,0.55)'; c.fillRect(ux + uw - 2.5, uy, 2.5, uh); c.fillRect(ux, uy, uw, 1.5);
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1;
      c.beginPath(); c.arc(ux + uw * 0.45, uy + uh * 0.5, uh * 0.32, 0, 2 * PI); c.stroke();
      for (var gy = uy + 5; gy < uy + uh - 3; gy += 4) { c.beginPath(); c.moveTo(ux + uw * 0.8, gy); c.lineTo(ux + uw - 5, gy); c.stroke(); }
    });
    // 계단실(왼쪽) — 문이 열리면 안에서 노란 불빛
    var bx0 = 30, bw = 230, by0 = 250;
    var wg = c.createLinearGradient(bx0, 0, bx0 + bw, 0);
    wg.addColorStop(0, '#2a2330'); wg.addColorStop(1, '#3e3242');
    c.fillStyle = wg; c.fillRect(bx0, by0, bw, 446 - by0);
    c.fillStyle = 'rgba(255,170,120,0.5)'; c.fillRect(bx0 + bw - 3, by0, 3, 446 - by0);
    c.fillStyle = '#1b1620'; c.fillRect(bx0 - 8, by0 - 10, bw + 16, 12);
    var dx = bx0 + 120, dw = 86, dt = 300;
    c.fillStyle = '#0d0b10'; c.fillRect(dx - 4, dt - 4, dw + 8, 446 - dt + 4);
    var ig = c.createLinearGradient(0, dt, 0, 446); ig.addColorStop(0, '#ffe7b0'); ig.addColorStop(1, '#c79a5a');
    c.fillStyle = ig; c.fillRect(dx, dt, dw, 446 - dt);
    // 문짝(바깥으로 열린다)
    var ow = dw * (1 - door * 0.85);
    c.fillStyle = '#4b3c46'; c.fillRect(dx, dt, ow, 446 - dt);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(dx + ow - 3, dt, 3, 446 - dt);
    if (door > 0) {   // 쏟아지는 불빛
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,210,140,' + (0.22 * door) + ')';
      c.beginPath(); c.moveTo(dx + ow, 446); c.lineTo(dx + dw, 446); c.lineTo(dx + dw + 140 * door, 540); c.lineTo(dx + ow + 40, 540); c.fill();
      c.restore();
    }
    // 안테나
    c.strokeStyle = '#1b1620'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx0 + 40, by0 - 10); c.lineTo(bx0 + 40, by0 - 110); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(bx0 + 20, by0 - 80); c.lineTo(bx0 + 60, by0 - 80); c.moveTo(bx0 + 26, by0 - 60); c.lineTo(bx0 + 54, by0 - 60); c.stroke();
    c.fillStyle = '#ff4a3a'; c.beginPath(); c.arc(bx0 + 40, by0 - 112, 2.5 + (Math.sin(t * 3) > 0 ? 1 : 0), 0, 2 * PI); c.fill();
  }
  function skyline(c, vw, hz, seed, hmin, hmax, col, winA, haze, gapX, gapW) {
    var x = -20, i = 0;
    c.fillStyle = col;
    var rects = [];
    while (x < vw + 20) {
      var w = 40 + hash(seed + i * 1.7) * 70, h = hmin + hash(seed + i * 3.3) * (hmax - hmin);
      if (gapW && x + w > gapX - gapW && x < gapX + gapW) h = Math.min(h, hmin * 0.6);   // 해 앞은 낮게
      rects.push([x, hz - h, w, h]); c.fillRect(x, hz - h, w, h + 10);
      if (hash(seed + i * 5.1) > 0.8) { c.fillRect(x + w / 2 - 1.5, hz - h - 40, 3, 40); }      // 옥상 철탑
      x += w + hash(seed + i * 7.7) * 10; i++;
    }
    // 불 켜진 창
    c.fillStyle = 'rgba(255,205,120,' + winA + ')';
    rects.forEach(function (r, k) {
      for (var yy = r[1] + 8; yy < hz - 6; yy += 12) for (var xx = r[0] + 6; xx < r[0] + r[2] - 6; xx += 10) {
        if (hash(xx * 0.31 + yy * 0.17 + seed) > 0.86) c.fillRect(xx, yy, 4, 5);
      }
    });
  }

  // 움직임이 멈춘 몸은 한 번 그려 두고 그림으로 찍는다(시체가 쌓여도 느려지지 않게)
  function bake(f, k) {
    var w = 330, h = 160, cvs = document.createElement('canvas');
    cvs.width = Math.ceil(w * k); cvs.height = Math.ceil(h * k);
    var x = cvs.getContext('2d'); x.scale(k, k); x.translate(w / 2 - f.x, h - 26 - FY);
    shadow(x, f); person(x, f, 0);
    return { cv: cvs, x: f.x - w / 2, y: FY + 26 - h, w: w, h: h, k: k };
  }
  // 바닥에 떨어진 무기
  function floorWeapon(c, kind, x, rot) {
    c.save(); c.translate(x, FY + 8); c.scale(SC, SC);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 3, 30, 3.5, 0, 0, 2 * PI); c.fill();
    c.rotate(rot);
    weapon(c, kind, -24, 0, PI / 2, {});
    c.restore();
  }

  function shadow(c, f) {    var s = f.st.scale * f.st.girth * SC, h = f.h || 0, lie = f.rot ? Math.abs(Math.sin(f.rot)) : 0;
    var w = (22 + lie * 40) * s * Math.max(0.4, 1 - h / 300);
    var ox = lie ? -Math.sign(f.rot) * f.face * 28 * s * 0 : 0;
    c.fillStyle = 'rgba(0,0,0,' + (0.38 * Math.max(0.3, 1 - h / 260)) + ')';
    c.beginPath(); c.ellipse(f.x + ox + (f.rot ? -f.face * Math.sign(f.rot) * 30 * s * lie : 0), FY + 2, w, 5.5 * s, 0, 0, 2 * PI); c.fill();
  }

  window.ART = {
    FY: FY, FLOOR_T: FLOOR_T, WALL_B: WALL_B, bg: bg, person: person, shadow: shadow, pose: pose, POSES: POSES, mix: mix, walk: walk,
    styleFor: styleFor, dumpling: dumpling, bake: bake, bodyPoint: bodyPoint, rooftop: rooftop, floorWeapon: floorWeapon, elevator: elevator, shade: shade, hash: hash, ZONES: ZONES
  };
})();
