// 지도 굽기: 구역 지도를 640x384 도트 그림 한 장으로. 3/4 시점 벽(윗면+앞면), 바닥 질감, 철창, 담 틈
(function () {
  'use strict';
  var T = 32, MW = 20, MH = 12;
  // 팔레트(32색 안쪽)
  var P = {
    ol: '#24262b', wallTop: '#b9bec4', wallTopHi: '#d3d7db', wallTopLo: '#9ea4ab', wallF: '#7b828b', wallFLo: '#646b74', crack: '#4f555d',
    bar: '#a7b0ba', barLo: '#5d6670', cellIn: '#34383e', cellIn2: '#2b2e33',
    grass: '#4f8a3a', grassLo: '#3c6e2c', grassHi: '#6aa64c', wire: '#c9ccd0'
  };
  var THEMES = [
    { f1: '#8b9096', f2: '#80858b', f3: '#969ba1', line: '#767b81', kind: 'conc' },   // 1동 감방
    { f1: '#c8b88e', f2: '#bba981', f3: '#d4c59c', line: '#a8976f', kind: 'tile' },   // 식당
    { f1: '#9b7a50', f2: '#8d6d45', f3: '#a9895d', line: '#7c5f3b', kind: 'dirt' },   // 운동장
    { f1: '#7d8288', f2: '#71767c', f3: '#898e94', line: '#d9b23a', kind: 'shop' },   // 작업장
    { f1: '#5b6066', f2: '#52575d', f3: '#666b71', line: '#d8dadc', kind: 'asph' }    // 정문
  ];
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
  function solid(c) { return c === '#' || c === 'b'; }

  function bake(zone) {
    var m = GY_DATA.MAPS[zone], th = THEMES[m.theme], pm = parse(m), g = pm.g;
    var cv = document.createElement('canvas'); cv.width = MW * T; cv.height = MH * T;
    var c = cv.getContext('2d'), r = rnd(zone * 101 + 7);
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
    // 바닥
    for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) {
      var X = x * T, Y = y * T, ch = at(g, x, y);
      if (ch === 'E') { floorOutside(X, Y); continue; }
      px(X, Y, T, T, th.f1);
      if (th.kind === 'tile' || th.kind === 'conc') {
        // 타일 줄눈 + 체크 디더링. 1동은 오른쪽 복도가 초록 타일
        var alt = (x + y) % 2 === 0, green = th.kind === 'conc' && x >= 13;
        px(X, Y, T, T, green ? (alt ? '#5f8f6a' : '#56845f') : (alt ? th.f1 : th.f2));
        px(X, Y, T, 1, green ? '#4a7354' : th.line); px(X, Y, 1, T, green ? '#4a7354' : th.line);
        px(X + 1, Y + 1, T - 2, 1, green ? '#6e9f78' : th.f3);
        if (green && r() < 0.4) { px(X + 4 + (r() * 20 | 0), Y + 4 + (r() * 20 | 0), 3, 2, '#7a6b4a'); }
      } else if (th.kind === 'shop') {
        px(X, Y, T, T, (x + y) % 2 ? th.f1 : th.f2);
        px(X, Y, T, 1, '#6a6f75');
      }
      // 얼룩·자갈 도트
      for (var i = 0; i < 7; i++) {
        var dx = (r() * (T - 2)) | 0, dy = (r() * (T - 2)) | 0;
        px(X + dx, Y + dy, r() < 0.5 ? 1 : 2, 1, r() < 0.5 ? th.f2 : th.f3);
      }
      if (th.kind === 'dirt' && r() < 0.35) { var sx = X + (r() * 26) | 0, sy = Y + (r() * 26) | 0; px(sx, sy, 3, 2, '#7a5d3a'); px(sx, sy, 2, 1, '#b39467'); }
      if (r() < 0.06 && th.kind !== 'dirt') { var wx = X + 6 + (r() * 14) | 0, wy = Y + 8 + (r() * 12) | 0; px(wx, wy, 8, 3, 'rgba(120,170,190,.35)'); px(wx + 2, wy + 3, 5, 2, 'rgba(120,170,190,.3)'); }
    }
    // 작업장 노란 안전선, 정문 흰 차선
    if (th.kind === 'shop') { for (var xx = 1; xx < MW - 1; xx++) { px(xx * T, 3 * T - 2, T, 2, th.line); px(xx * T, 9 * T, T, 2, th.line); } }
    if (th.kind === 'asph') { for (var x2 = 1; x2 < MW - 1; x2 += 1) px(x2 * T + 6, 6 * T - 1, 18, 2, th.line); }
    // 막힌 물건
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) if (at(g, x, y) === 'T') prop(x, y);
    // 벽: 아래칸이 바닥이면 앞면(아래 12px)을 그린다
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      var cc = at(g, x, y); if (!solid(cc) && cc !== 'S') continue;
      if (cc === 'S') { door(x, y); continue; }
      if (cc === 'b') { bars(x, y); continue; }
      wall(x, y);
    }
    function floorOutside(X, Y) {
      px(X, Y, T, T, P.grass);
      for (var i = 0; i < 14; i++) px(X + (r() * 30) | 0, Y + (r() * 30) | 0, 1, 2, r() < 0.5 ? P.grassLo : P.grassHi);
    }
    function wall(x, y) {
      var X = x * T, Y = y * T, below = at(g, x, y + 1), front = !solid(below) && below !== 'S';
      var topH = front ? 20 : T;
      px(X, Y, T, topH, P.wallTop);
      // 윗면 테두리: 이웃이 벽이 아니면 밝은/어두운 가장자리
      if (!solid(at(g, x, y - 1)) && at(g, x, y - 1) !== 'S') px(X, Y, T, 2, P.wallTopHi);
      if (!solid(at(g, x - 1, y)) && at(g, x - 1, y) !== 'S') px(X, Y, 2, topH, P.wallTopHi);
      if (!solid(at(g, x + 1, y)) && at(g, x + 1, y) !== 'S') px(X + T - 2, Y, 2, topH, P.wallTopLo);
      // 돌 줄눈
      px(X + ((x * 7) % 3) * 8 + 4, Y + 6, 10, 1, P.wallTopLo); px(X + 16 - ((y * 5) % 3) * 4, Y + 14, 12, 1, P.wallTopLo);
      if (front) {
        px(X, Y + topH, T, T - topH, P.wallF);
        px(X, Y + topH, T, 1, P.ol);
        px(X, Y + T - 3, T, 3, P.wallFLo);
        for (var k = 0; k < 4; k++) px(X + k * 8 + ((y % 2) * 4), Y + topH + 4, 1, 5, P.wallFLo);
        if (r() < 0.3) { var cx = X + 6 + (r() * 18) | 0; px(cx, Y + topH + 2, 1, 3, P.crack); px(cx + 1, Y + topH + 5, 1, 3, P.crack); }
      }
      // 바깥 담: 철조망
      if (y === 0 || y === MH - 1 || x === 0 || x === MW - 1) {
        for (var w = 0; w < T; w += 4) { px(X + w, Y + 3, 3, 1, P.wire); px(X + w + 1, Y + 2, 1, 3, '#8e9297'); }
      }
    }
    function bars(x, y) {
      var X = x * T, Y = y * T;
      px(X, Y, T, T, P.cellIn); px(X, Y + T - 10, T, 10, P.cellIn2);
      // 감방 안 침상
      px(X + 4, Y + 6, 14, 8, '#6e5a44'); px(X + 4, Y + 6, 14, 2, '#8a7458'); px(X + 5, Y + 8, 6, 4, '#c9cdd3');
      for (var i = 2; i < T; i += 6) { px(X + i, Y, 2, T, P.bar); px(X + i + 1, Y, 1, T, P.barLo); }
      px(X, Y + 1, T, 2, P.bar); px(X, Y + T - 4, T, 3, P.barLo);
    }
    function door(x, y) {
      var X = x * T, Y = y * T;
      px(X, Y, T, T, P.cellIn2);
      px(X + 3, Y + 2, T - 6, T - 2, '#1c1e22');
      for (var i = 6; i < T - 4; i += 6) px(X + i, Y + 2, 2, 10, '#5d6670');
      px(X, Y, 3, T, P.bar); px(X + T - 3, Y, 3, T, P.barLo);
      px(X + 3, Y + T - 2, T - 6, 2, th.f1);
    }
    function prop(x, y) {
      var X = x * T, Y = y * T, k = m.theme;
      if (k === 1) { // 식탁(스테인리스)
        px(X, Y + 6, T, 18, '#a9b2bb'); px(X, Y + 6, T, 2, '#d0d6dc'); px(X, Y + 22, T, 4, '#6f7881');
        if (r() < 0.6) { px(X + 8, Y + 10, 8, 5, '#e8e1cf'); px(X + 9, Y + 11, 6, 2, '#c8a24a'); }
        px(X + 2, Y + 26, 3, 5, '#4d545b'); px(X + T - 5, Y + 26, 3, 5, '#4d545b');
      } else if (k === 2) { // 화단
        px(X + 2, Y + 14, 28, 16, '#6d6f73'); px(X + 2, Y + 14, 28, 2, '#8f9297');
        px(X + 4, Y + 2, 24, 16, '#3f7a31'); px(X + 6, Y + 3, 12, 6, '#5d9b45'); px(X + 16, Y + 8, 8, 5, '#2f5f25');
      } else if (k === 3) { // 재봉틀 작업대
        px(X, Y + 8, T, 16, '#8a6a46'); px(X, Y + 8, T, 2, '#a8865c'); px(X, Y + 22, T, 3, '#5e4730');
        px(X + 10, Y + 2, 10, 9, '#2f3338'); px(X + 11, Y + 3, 6, 2, '#d9b23a');
      } else { // 콘크리트 블록
        px(X, Y + 4, T, 20, '#a2a7ad'); px(X, Y + 4, T, 2, '#c3c7cc'); px(X, Y + 20, T, 8, '#7c8289');
      }
      px(X, Y + T - 2, T, 2, 'rgba(0,0,0,.25)');
    }
    return { cv: cv, g: g, spawns: pm.spawns, exits: pm.exits, name: m.name, theme: m.theme };
  }
  window.GY_MAP = { T: T, MW: MW, MH: MH, bake: bake, at: at };
})();