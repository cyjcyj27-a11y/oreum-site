// 지도 굽기: 객차 안을 640x384 도트 그림 한 장으로. 위에서 비스듬히 본 객차(위 벽 창은 투명하게 뚫어 바깥 풍경이 비치게)
(function () {
  'use strict';
  var T = 32, MW = 20, MH = 12;
  var P = {
    ol: '#1e2128', wall: '#dfe0d6', wallHi: '#eef0e8', wallLo: '#b9bcb2', wallSh: '#9fa39a', steel: '#c2c8cf', steelHi: '#e8ecf0', steelLo: '#7f8790',
    floor: '#7d848c', floor2: '#757c84', floorHi: '#8c939b', speck: '#646b73', yellow: '#e8c13a', yellowLo: '#a9861d',
    seat: '#2e57a8', seatHi: '#4a76c8', seatLo: '#1f3d7a', seatPat: '#26498f', old: '#e0843a', oldHi: '#f2a35c', oldLo: '#a85a20',
    blue: '#1d3f8f', glass: 'rgba(0,0,0,0)'
  };
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function parse(m) {
    var g = [], spawns = [], exits = [];
    for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) {
      var c = m.g[y][x]; g.push(c);
      if (c === 'S') spawns.push([x, y]);
      if (c === 'E') exits.push([x, y]);
    }
    return { g: g, spawns: spawns, exits: exits };
  }
  function at(g, x, y) { if (x < 0 || y < 0 || x >= MW || y >= MH) return '#'; return g[y * MW + x]; }

  function bake(zone) {
    var m = L1_DATA.MAPS[zone], pm = parse(m), g = pm.g;
    var cv = document.createElement('canvas'); cv.width = MW * T; cv.height = MH * T;
    var c = cv.getContext('2d'), r = rnd(zone * 101 + 7);
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
    var x, y;
    // 1) 바닥 전체
    for (y = 1; y < MH - 1; y++) for (x = 0; x < MW; x++) floor(x, y);
    // 1-2) 통로 가운데 밝은 띠(옛 1호선 바닥처럼 가운데가 닳아 밝다)와 좌석 앞 짙은 띠
    for (x = 0; x < MW; x++) {
      if (at(g, x, 5) === '#' || at(g, x, 4) === '#') continue;
      px(x * T, 4 * T + 20, T, 2, 'rgba(255,255,255,.05)'); px(x * T, 5 * T, T, 2 * T, 'rgba(255,255,255,.035)'); px(x * T, 7 * T - 2, T, 2, 'rgba(255,255,255,.05)');
      for (var dd = 4; dd < T; dd += 8) { px(x * T + dd, 6 * T - 1, 3, 2, 'rgba(232,193,58,.18)'); }
      px(x * T, 2 * T, T, 6, 'rgba(0,0,0,.08)'); px(x * T, 10 * T - 6, T, 6, 'rgba(0,0,0,.08)');
    }
    // 2) 노란 안전선(문 앞 , 칸)
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) if (at(g, x, y) === ',' && (y === 1 || y === MH - 2)) { px(x * T, y * T + (y === 1 ? T - 4 : 0), T, 4, P.yellow); px(x * T, y * T + (y === 1 ? T - 1 : 3), T, 1, P.yellowLo); }
    // 3) 좌석
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) { var ch = at(g, x, y); if (ch === 'B' || ch === 'O') seat(x, y, ch === 'O'); }
    // 4) 짐·기둥
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) { if (at(g, x, y) === 'K') luggage(x, y); }
    // 5) 위 벽(창), 아래 벽 테, 문
    for (x = 0; x < MW; x++) { topWall(x); bottomWall(x); }
    // 6) 객차 끝 벽·연결 통로
    for (y = 1; y < MH - 1; y++) for (x = 0; x < MW; x++) { var cc = at(g, x, y); if (cc === '#') endWall(x, y); else if (cc === 'E') gangway(x, y, true); else if (cc === ',' && (at(g, x, y - 1) === '#' || at(g, x, y + 1) === '#') && y > 1 && y < MH - 2) gangway(x, y, false); }
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) { if (at(g, x, y) === 'P') pole(x, y); }

    function floor(x, y) {
      var X = x * T, Y = y * T;
      px(X, Y, T, T, (x + y) % 2 ? P.floor : P.floor2);
      // 고무 바닥 점박이
      for (var i = 0; i < 9; i++) px(X + (r() * 30 | 0), Y + (r() * 30 | 0), 1, 1, r() < 0.5 ? P.speck : P.floorHi);
      px(X, Y, T, 1, '#6c737b');
      if (r() < 0.05) { px(X + 8 + (r() * 12 | 0), Y + 10 + (r() * 10 | 0), 7, 3, 'rgba(60,50,40,.25)'); }
    }
    function seat(x, y, old) {
      var X = x * T, Y = y * T, top = y < MH / 2, s = old ? [P.old, P.oldHi, P.oldLo] : [P.seat, P.seatHi, P.seatLo];
      if (top) {
        // 등받이(벽 쪽) + 방석
        px(X, Y, T, 12, s[2]); px(X, Y + 2, T, 8, s[0]); px(X, Y + 2, T, 1, s[1]);
        px(X, Y + 12, T, 14, s[0]); px(X, Y + 12, T, 2, s[1]); px(X, Y + 24, T, 2, s[2]);
        px(X, Y + 26, T, 4, P.steel); px(X, Y + 26, T, 1, P.steelHi); px(X, Y + 29, T, 2, P.steelLo);
        for (var i = 4; i < T; i += 8) px(X + i, Y + 15, 4, 1, old ? P.oldLo : P.seatPat);
        px(X, Y + 31, T, 1, 'rgba(0,0,0,.25)');
      } else {
        px(X, Y, T, 3, 'rgba(0,0,0,.22)');
        px(X, Y + 2, T, 4, P.steel); px(X, Y + 2, T, 1, P.steelHi);
        px(X, Y + 6, T, 14, s[0]); px(X, Y + 6, T, 2, s[1]); px(X, Y + 18, T, 2, s[2]);
        for (var j = 4; j < T; j += 8) px(X + j, Y + 10, 4, 1, old ? P.oldLo : P.seatPat);
        px(X, Y + 20, T, 12, s[2]); px(X, Y + 22, T, 8, s[0]); px(X, Y + 22, T, 1, s[1]);
      }
      // 좌석 칸막이(스테인리스 팔걸이)
      var L = at(g, x - 1, y), R = at(g, x + 1, y);
      if (L !== 'B' && L !== 'O') { px(X, Y + (top ? 6 : 2), 3, 24, P.steelLo); px(X, Y + (top ? 6 : 2), 2, 24, P.steelHi); }
      if (R !== 'B' && R !== 'O') { px(X + T - 3, Y + (top ? 6 : 2), 3, 24, P.steelLo); px(X + T - 3, Y + (top ? 6 : 2), 1, 24, P.steelHi); }
    }
    function luggage(x, y) {
      var X = x * T, Y = y * T, k = (x * 7 + y * 3 + zone) % 3;
      px(X + 3, Y + T - 5, T - 6, 4, 'rgba(0,0,0,.28)');
      if (zone <= 1) { // 자전거
        c.strokeStyle = '#26292e'; c.lineWidth = 2;
        c.beginPath(); c.arc(X + 8, Y + 22, 6, 0, 6.28); c.arc(X + 24, Y + 22, 6, 0, 6.28); c.stroke();
        px(X + 8, Y + 15, 16, 2, k ? '#2f8a3a' : '#c9302a'); px(X + 14, Y + 11, 2, 11, k ? '#2f8a3a' : '#c9302a'); px(X + 11, Y + 10, 6, 2, '#26292e'); px(X + 22, Y + 12, 2, 6, '#26292e');
      } else { // 캐리어
        var col = ['#2b6cb0', '#c7442e', '#e0b13a'][k];
        px(X + 7, Y + 6, 18, 22, P.ol); px(X + 8, Y + 7, 16, 20, col); px(X + 8, Y + 7, 16, 2, 'rgba(255,255,255,.35)');
        for (var i = 11; i < 24; i += 4) px(X + i, Y + 9, 1, 16, 'rgba(0,0,0,.18)');
        px(X + 13, Y + 2, 6, 5, P.ol); px(X + 14, Y + 3, 4, 3, P.steelLo); px(X + 9, Y + 27, 3, 3, P.ol); px(X + 20, Y + 27, 3, 3, P.ol);
      }
    }
    function pole(x, y) {
      var X = x * T, Y = y * T, cx = X + T / 2;
      px(cx - 7, Y + 22, 14, 6, 'rgba(0,0,0,.25)'); px(cx - 5, Y + 20, 10, 6, P.steelLo); px(cx - 4, Y + 20, 8, 2, P.steelHi);
      // 기둥은 천장까지 위로 길게(위 칸에 걸쳐 그림)
      px(cx - 2, Y - 26, 5, 48, P.steelLo); px(cx - 2, Y - 26, 2, 48, P.steelHi); px(cx + 1, Y - 26, 1, 48, '#9aa2ab');
    }
    function topWall(x) {
      var X = x * T, ch = at(g, x, 0);
      // 벽면(크림색 패널) + 위 천장 그늘 + 아래 걸레받이
      px(X, 0, T, T, P.wall); px(X, 0, T, 3, P.wallSh); px(X, 3, T, 1, P.wallLo); px(X, T - 3, T, 3, P.wallLo);
      if (ch === 'W') {
        // 창: 투명하게 뚫는다(뒤에 풍경이 지나간다)
        c.clearRect(X + 3, 6, T - 6, 17);
        px(X + 2, 5, T - 4, 1, P.steelLo); px(X + 2, 23, T - 4, 2, P.steelHi); px(X + 2, 5, 1, 19, P.steelLo); px(X + T - 3, 5, 1, 19, P.steelHi);
        if (x % 2 === 0) px(X + T - 2, 5, 2, 20, P.wallLo);
      } else if (ch === 'S') {
        // 출입문 틀(문짝은 그리기에서 움직인다)
        c.clearRect(X + 2, 3, T - 4, T - 3);
        px(X, 3, 2, T - 3, P.steelLo); px(X + T - 2, 3, 2, T - 3, P.steelLo); px(X, 3, T, 2, P.steel);
      } else if (ch === '#') {
        px(X, 0, T, T, P.wallLo); px(X + 2, 0, T - 4, T, P.wall);
      }
      // 짐칸 선반 그림자 띠
      if (ch === 'W') px(X, 25, T, 1, 'rgba(0,0,0,.12)');
    }
    function bottomWall(x) {
      var X = x * T, Y = (MH - 1) * T, ch = at(g, x, MH - 1);
      if (ch === 'S') {
        px(X, Y, T, T, P.floor2); px(X, Y + 2, T, 4, P.yellow); px(X, Y + 5, T, 1, P.yellowLo);
        c.clearRect(X + 2, Y + 14, T - 4, T - 14);
        px(X, Y + 12, 2, T - 12, P.steelLo); px(X + T - 2, Y + 12, 2, T - 12, P.steelLo);
      } else {
        // 아래 벽은 위에서 본 윗면만
        px(X, Y, T, T, P.wall); px(X, Y, T, 3, P.wallHi); px(X, Y + 3, T, 1, P.wallLo); px(X, Y + 12, T, T - 12, P.wallLo); px(X, Y + 13, T, 2, P.wallSh);
        if (ch === 'W') { c.clearRect(X + 4, Y + 18, T - 8, 9); px(X + 3, Y + 17, T - 6, 1, P.steelLo); px(X + 3, Y + 27, T - 6, 1, P.steelHi); }
      }
    }
    function endWall(x, y) {
      var X = x * T, Y = y * T;
      px(X, Y, T, T, P.wallLo); px(X + 6, Y, T - 12, T, P.wall); px(X + 6, Y, 2, T, P.wallHi); px(X + T - 8, Y, 2, T, P.wallSh);
      // 맨 왼쪽 끝 벽엔 닫힌 연결문
      if (x === 0 && (y === 5 || y === 6)) {
        px(X + 8, Y, T - 14, T, '#9aa3ad'); px(X + 10, Y + (y === 5 ? 6 : 0), T - 18, y === 5 ? 26 : 20, '#5d7a8c'); px(X + 11, Y + (y === 5 ? 7 : 1), 3, y === 5 ? 20 : 14, '#8fb1c4');
        if (y === 6) px(X + 18, Y + 4, 4, 3, P.steelHi);
      }
    }
    function gangway(x, y, exit) {
      var X = x * T, Y = y * T;
      if (exit) {
        // 다음 칸으로 가는 연결문(열려 있음): 문틀 + 너머 어두운 통로
        px(X, Y, T, T, '#3a4048'); px(X + 4, Y, T - 4, T, '#2a2f36');
        for (var i = 0; i < T; i += 6) px(X + 6, Y + i, T - 8, 2, '#353b43');
        px(X, Y, 4, T, P.steelHi); px(X + 3, Y, 1, T, P.steelLo);
      } else {
        // 칸 사이 고무 주름 통로
        px(X, Y, T, T, '#4a5058');
        for (var j = 2; j < T; j += 5) px(X + j, Y, 2, T, '#3a3f46');
        px(X, Y, 3, T, P.steel); px(X + T - 3, Y, 3, T, P.steel);
      }
    }
    // 천장 손잡이 줄(좌석 앞)
    for (x = 1; x < MW - 1; x++) { if (at(g, x, 1) === 'B' || at(g, x, 1) === 'O') strap(x * T + 16, 2 * T + 2); if (at(g, x, MH - 2) === 'B' || at(g, x, MH - 2) === 'O') strap(x * T + 16, (MH - 2) * T - 6); }
    function strap(sx, sy) { px(sx - 3, sy, 6, 1, 'rgba(255,255,255,.35)'); px(sx - 3, sy + 4, 6, 1, 'rgba(255,255,255,.35)'); px(sx - 3, sy, 1, 5, 'rgba(255,255,255,.35)'); px(sx + 2, sy, 1, 5, 'rgba(255,255,255,.35)'); px(sx - 1, sy - 4, 1, 4, 'rgba(255,255,255,.2)'); }
    // 형광등 빛 띠
    c.fillStyle = 'rgba(255,255,240,.05)'; c.fillRect(0, 2 * T, MW * T, T * 0.5); c.fillRect(0, (MH - 3) * T + 16, MW * T, T * 0.5);
    var vg = c.createRadialGradient(MW * T / 2, MH * T / 2, MH * T * 0.35, MW * T / 2, MH * T / 2, MW * T * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,14,24,.22)');
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = vg; c.fillRect(0, 0, MW * T, MH * T); c.globalCompositeOperation = 'source-over';
    return { cv: cv, g: g, spawns: pm.spawns, exits: pm.exits, name: m.name, night: !!m.night, zone: zone };
  }
  window.L1_MAP = { T: T, MW: MW, MH: MH, bake: bake, at: at, P: P };
})();
