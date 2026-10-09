// 그리기: 창밖 풍경·승강장, 객차, 문, 장비, 빌런, 탄, 효과
(function () {
  'use strict';
  var D = L1_DATA, M = L1_MAP, T = M.T, MW = M.MW, MH = M.MH, LW = MW * T, LH = MH * T;
  var A = window.L1_ATLAS || {}, img = new Image(), white = null, ready = false;
  img.onload = function () {
    ready = true;
    white = document.createElement('canvas'); white.width = img.width; white.height = img.height;
    var c = white.getContext('2d'); c.drawImage(img, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#fff'; c.fillRect(0, 0, img.width, img.height);
  };
  img.src = 'img/atlas.png?v=6';
  var cv, ctx, sc = 1, ox = 0, oy = 0;
  var EN = function () { return window.L1_LANG === 'en'; };

  function init(canvas) { cv = canvas; ctx = cv.getContext('2d'); }
  function resize() {
    var r = cv.parentNode.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
    sc = Math.min(cv.width / LW, cv.height / LH); ox = Math.round((cv.width - LW * sc) / 2); oy = Math.round((cv.height - LH * sc) / 2);
    return { sc: sc / dpr, ox: ox / dpr, oy: oy / dpr };
  }
  function toCell(clientX, clientY) {
    var r = cv.getBoundingClientRect(), dpr = cv.width / r.width;
    var x = ((clientX - r.left) * dpr - ox) / sc / T, y = ((clientY - r.top) * dpr - oy) / sc / T;
    return { x: Math.floor(x), y: Math.floor(y), fx: x, fy: y };
  }
  function P(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
  function ring(cx, cy, r, col, dash) {
    ctx.fillStyle = col; var n = Math.max(24, Math.round(r * 0.9));
    for (var i = 0; i < n; i++) { if (dash && (i % 4) > 1) continue; var a = i / n * 6.2832; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2); }
  }
  // 묶음 그림에서 프레임 f 를 발끝(아래 가운데)이 (x,y)에 오게
  function spr(name, f, x, y, flip, alpha, wh, scale) {
    var m = A[name]; if (!m || !ready) { P(x - 8, y - 30, 16, 30, '#f0f'); return; }
    var n = m[4]; f = ((f % n) + n) % n; scale = scale || 1;
    var r = m[5] || 1, sx = m[0] + f * m[2] * r, sy = m[1], w = m[2] * r, h = m[3] * r, src = wh ? white : img, dw = m[2] * scale, dh = m[3] * scale; // 인물은 r=3 배 크기로 담아 흐릿하지 않게
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(src, sx, sy, w, h, -dw / 2, Math.round(y) - dh, dw, dh); }
    else ctx.drawImage(src, sx, sy, w, h, Math.round(x) - dw / 2, Math.round(y) - dh, dw, dh);
    ctx.restore();
  }
  function rowOf(dir) { return dir === 0 ? 0 : dir === 1 ? 1 : 2; }
  function shadow(x, y, w) { ctx.fillStyle = 'rgba(20,22,26,.3)'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), w, 3); ctx.fillRect(Math.round(x - w / 2 + 2), Math.round(y - 3), w - 4, 5); }

  // 창밖: 구간마다 다른 풍경이 왼쪽으로 흐른다. 역에 서면 승강장과 역 이름판
  var SKY = [['#9fd0ef', '#cfe8f4'], ['#a9d4ee', '#d8ecf3'], ['#b7c9d9', '#dfe6ea'], ['#c3ccd6', '#e4e7ea'], ['#b9c6d2', '#dde3e8'], ['#1b2240', '#2c335a'], ['#0e1226', '#1c2140']];
  function hash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function outside(y0, h) {
    var z = G.zone, sk = SKY[z], sc1 = G.scroll * 0.1;
    P(0, y0, LW, h, sk[0]); P(0, y0 + h * 0.45, LW, h * 0.55, sk[1]);
    var base = y0 + h;
    for (var i = Math.floor(sc1 / 26) - 1; i < Math.floor((sc1 + LW) / 26) + 2; i++) {
      var X = Math.round(i * 26 - sc1), r = hash(i + z * 31);
      if (z <= 1) { var hh = 6 + r * 10; ctx.fillStyle = z ? '#5d8a5a' : '#4f7d4c'; ctx.beginPath(); ctx.moveTo(X - 14, base); ctx.lineTo(X + 13, base - hh); ctx.lineTo(X + 40, base); ctx.fill(); }
      else if (z <= 4) { var bh = 5 + r * 12, bw = 14 + r * 10; P(X, base - bh, bw, bh, z === 3 ? '#8f98a3' : '#9aa3ad'); for (var w = 2; w < bw - 2; w += 4) P(X + w, base - bh + 2, 2, 2, z >= 5 ? '#ffd76a' : '#d5dee6'); }
      else if (z === 5) { var lh = 4 + r * 8; P(X, base - lh, 12, lh, '#1a1f36'); if (r > 0.3) P(X + 3, base - lh + 2, 2, 2, '#ffd76a'); if (r > 0.6) P(X + 7, base - lh + 4, 2, 2, '#ffe9a8'); }
      else { if (r > 0.7) P(X, base - 3 - r * 4, 2, 2, '#ffd76a'); }
    }
    // 창밖은 먼 풍경만 천천히(10/9 사장님 "창이 지나가는 표시 정신없다" → 빠른 전봇대 줄 뺌, 속도 0.25→0.1)
    P(0, base - 2, LW, 2, z >= 5 ? '#0a0c16' : '#6f665c');
  }
  function platform(y0, h, sign) {
    var z = G.zone;
    P(0, y0, LW, h, z >= 5 ? '#3a3f4a' : '#c9c4b8');
    for (var x = 0; x < LW; x += 20) P(x, y0, 1, h, z >= 5 ? '#2c303a' : '#b3aea2');
    P(0, y0 + h - 3, LW, 3, '#e8c13a');
    if (sign) {
      var name = D.L(L1L.station(G.slot)); ctx.font = '8px DOSGothic, monospace';
      [4, 13].forEach(function (cx) {
        var X = cx * T + 2, Y = y0 + 2, w = Math.max(44, Math.round(ctx.measureText(name).width) + 10);
        P(X, Y, w, 11, '#ffffff'); P(X, Y, w, 2, '#0052a4'); P(X, Y + 9, w, 2, '#0052a4');
        ctx.fillStyle = '#1b1d21'; ctx.textAlign = 'left'; ctx.fillText(name, X + 5, Y + 9);
      });
    }
  }
  function drawWindows() {
    var stop = G.phase === 'wave' ? Math.max(0, 1 - G.vel * 1.6) : 0;
    // 위 창줄(y 6~23)과 아래 창줄
    ctx.save(); ctx.beginPath(); ctx.rect(0, 3, LW, 26); ctx.rect(0, (MH - 1) * T + 14, LW, 18); ctx.clip();
    outside(3, 26); outside((MH - 1) * T + 14, 18);
    if (stop > 0) { ctx.globalAlpha = stop; platform(3, 26, true); platform((MH - 1) * T + 14, 18, false); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  // 출입문 문짝: 닫히면 가운데로, 열리면 양쪽 벽 속으로
  function drawDoors() {
    var o = G.doors;
    G.map.spawns.forEach(function (s) {
      var X = s[0] * T, top = s[1] === 0, Y = top ? 3 : (MH - 1) * T + 14, H = top ? T - 3 : T - 14, half = (T - 4) / 2, w = Math.round(half * (1 - o));
      if (w <= 0) return;
      [0, 1].forEach(function (side) {
        var x0 = side ? X + T - 2 - w : X + 2;
        P(x0, Y, w, H, '#b9c0c8'); P(x0, Y, w, 2, '#e1e6eb'); P(side ? x0 : x0 + w - 1, Y, 1, H, '#7f8790');
        if (top && w > 6) { P(x0 + (side ? 2 : w - 8), Y + 4, 6, 13, '#5f7f93'); P(x0 + (side ? 3 : w - 7), Y + 5, 2, 9, '#a9c6d6'); }
      });
      if (o > 0.5 && G.phase === 'wave' && ((G.t * 4) | 0) % 2) P(X + 12, top ? 0 : (MH - 1) * T + 10, 8, 2, '#ff9a3a');
    });
  }

  function drawTower(tw) {
    var X = tw.x * T, Y = tw.y * T, cx = X + T / 2, by = Y + T - 3, t = G.t, def = D.TOWERS[tw.type];
    if (tw.type === 'fence') {
      var max = [3, 5, 8][tw.lv] + (G.cards.fence || 0);
      shadow(cx, by + 1, 26);
      spr('o_items', tw.hp <= max / 3 ? 1 : 0, cx, by + 2);
      if (tw.lv) P(X + 3, Y + 4, 4 + tw.lv * 3, 3, tw.lv === 2 ? '#ffd84a' : '#e8ecf0');
      return;
    }
    if (tw.type === 'cctv' || tw.type === 'announce') {
      shadow(cx, by, 14);
      P(cx - 1, Y + 6, 3, T - 8, '#7f8790'); P(cx, Y + 6, 1, T - 8, '#c2c8cf'); P(cx - 5, by - 2, 11, 3, '#4b525a');
      spr('o_items', tw.type === 'cctv' ? 2 : 3, cx + (tw.type === 'cctv' ? Math.round(Math.sin(tw.ang * 0.9) * 2) : 0), Y + 14, tw.type === 'announce' && Math.sin(tw.ang * 0.5) < 0, null, false, 0.62);
      if (tw.type === 'cctv' && ((t * 2) | 0) % 2) P(cx - 1, Y + 7, 2, 2, '#ff3b30');
      if (tw.type === 'announce' && tw.stun <= 0) { var ph = (t * 1.2 + tw.x * 0.3) % 1; ctx.globalAlpha = 0.5 * (1 - ph); ring(cx, Y + 6, 6 + ph * 18, '#ffe9a0'); ctx.globalAlpha = 1; }
      lvMark(tw, cx, Y); stunMark(tw, cx, Y);
      return;
    }
    shadow(cx, by, 18);
    var row = rowOf(tw.dir), f = row * 4 + (tw.act > 0 ? (tw.act > 0.14 ? 2 : 3) : ((t * 1.5 + tw.x) | 0) % 2);
    spr(def.spr, f, cx, by, tw.dir === 3);
    lvMark(tw, cx, Y); stunMark(tw, cx, Y);
  }
  function lvMark(tw, cx, Y) { for (var k = 0; k < tw.lv; k++) { P(cx + 9, Y - 8 + k * 3, 5, 2, '#f2c744'); P(cx + 9, Y - 6 + k * 3, 5, 1, '#8a6a12'); } }
  function stunMark(tw, cx, Y) {
    if (!(tw.stun > 0)) return;
    for (var i = 0; i < 3; i++) { var a = G.t * 6 + i * 2.1; P(Math.round(cx + Math.cos(a) * 8) - 1, Math.round(Y - 6 + Math.sin(a) * 3), 3, 3, '#ffe04a'); }
  }
  // 빌런 한 명
  function frameOf(e, def) {
    var row = rowOf(e.dir), step = (e.fr | 0) % 4;
    if (def.hiker) return e.act > 0 ? 8 + e.v : ((e.fr | 0) % 2) * 4 + e.v;
    if (def.bird) return e.act > 0 ? 8 + ((G.t * 6) | 0) % 2 : 4 + step;
    if (def.side) return step;
    if ((def.nap || def.faint) && e.act > 0) return 11;
    if (def.eat && e.act > 0) return 10 + ((G.t * 3) | 0) % 2;
    if (e.type === 'bar' && G.towers[e.ci]) return 11;
    if (def.stall && e.act > 0) return 0;
    if (e.swing > 0) return row * 4 + 2;
    return row * 4 + step;
  }
  function flipOf(e, def) {
    if (def.hiker || def.bird || def.side) return e.face === 3;
    if ((def.nap || def.faint) && e.act > 0) return e.face === 3;
    return e.dir === 3;
  }
  function drawEnemy(e) {
    var def = D.ENEMIES[e.type], px = e.x * T, py = e.y * T + 12, sp = def.spr, scale = def.group ? 1.12 : 1;
    if (e.state === 'caught') {
      var a = Math.max(0, 1 - Math.max(0, e.t - 0.5) * 2);
      shadow(px, py, 16); spr(sp, def.hiker ? e.v : def.bird ? 10 : 0, px, py + Math.min(6, e.t * 20), false, a, false, scale);
      ctx.globalAlpha = a; P(px - 6, py - 22, 5, 5, '#d7dce2'); P(px + 1, py - 22, 5, 5, '#d7dce2'); P(px - 5, py - 21, 3, 3, '#3a3f46'); P(px + 2, py - 21, 3, 3, '#3a3f46'); P(px - 1, py - 20, 2, 1, '#d7dce2'); ctx.globalAlpha = 1;
      return;
    }
    if (e.state === 'esc') {
      var u = Math.min(1, e.t / 0.8);
      spr(sp, frameOf(e, def), px + u * 18, py, false, 1 - u, false, scale);
      return;
    }
    var fly = def.bird && e.act <= 0, lift = fly ? 10 + Math.sin(G.t * 10 + e.id * 9) * 2 : 0;
    shadow(px, py, def.boss ? 24 : def.wall ? 22 : def.bird ? 10 : 14);
    // 오오라: 전도사(확성기 물결)·트로트(음표)·스피커폰(소리 물결)
    var au = def.aura || (def.demon ? e.mode : null);
    if (au === 'hush' || au === 'noise') { var ph = (G.t * 1.3 + e.id) % 1; ctx.globalAlpha = 0.45 * (1 - ph); ring(px, py - 26, 4 + ph * (def.ar || 2) * T * 0.8, au === 'hush' ? '#ffe04a' : '#ff8ad0'); ctx.globalAlpha = 1; }
    if (au === 'haste') { var nt = ((G.t * 2 + e.id * 3) % 1); ctx.globalAlpha = 1 - nt; ctx.font = '10px DOSGothic, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5ac8'; ctx.fillText('♪', px + 10 + nt * 6, py - 34 - nt * 14); ctx.fillText('♫', px - 12 - nt * 4, py - 28 - nt * 10); ctx.globalAlpha = 1; }
    if (e.mark > 0) { P(px - 9, py - 3, 18, 1, '#ff3b30'); }
    var f = frameOf(e, def), fl = flipOf(e, def);
    spr(sp, f, px, py - lift, fl, null, false, scale);
    if (e.hit > 0) spr(sp, f, px, py - lift, fl, 0.75, true, scale);
    if (def.boss && (!def.group || e.lead)) {
      var nm = D.L(def.name); ctx.font = '8px DOSGothic, monospace'; ctx.textAlign = 'center';
      var tw2 = Math.max(36, Math.round(ctx.measureText(nm).width) + 8), ny = py - (A[sp] ? A[sp][3] * scale : 50) - 18;
      P(px - tw2 / 2, ny, tw2, 11, '#0052a4'); P(px - tw2 / 2, ny, tw2, 1, '#4f8ae0'); ctx.fillStyle = '#ffffff'; ctx.fillText(nm, px, ny + 9);
    }
    if (e.hp < e.max) {
      var bw = def.boss ? 34 : 16, h = Math.max(0, e.hp / e.max), hy = py - (A[sp] ? A[sp][3] * scale : 40) - 5 - lift;
      P(px - bw / 2 - 1, hy, bw + 2, 4, '#1b1d21'); P(px - bw / 2, hy + 1, Math.round(bw * h), 2, h > 0.5 ? '#7bd14a' : h > 0.25 ? '#f2c744' : '#ff4d3a');
    }
  }
  function drawProj(p) {
    var x = p.x * T, y = p.y * T;
    if (p.k === 'note') { var a = (p.t * 14) | 0; ctx.globalAlpha = 0.9; ring(x, y, 3 + (a % 3), '#fff6a0'); P(x - 1, y - 1, 3, 3, '#ffffff'); ctx.globalAlpha = 1; }
    else if (p.k === 'cuff') { var b = p.t * 18, dx = Math.round(Math.cos(b) * 3), dy = Math.round(Math.sin(b) * 3); P(x - dx - 2, y - dy - 2, 4, 4, '#e3e7ec'); P(x + dx - 2, y + dy - 2, 4, 4, '#e3e7ec'); P(x - 1, y - 1, 2, 2, '#9aa1a8'); }
    else { P(x - 4, y - 3, 8, 6, '#4aa8e8'); P(x - 3, y - 4, 6, 2, '#a9dcff'); P(x - 1, y + 3, 2, 2, '#2f7fc0'); }
  }
  function drawPuddle(c) {
    if (c.k === 'poop') { var X0 = Math.round(c.x * T), Y0 = Math.round(c.y * T + 12), al = Math.min(1, (c.life - c.t) * 2); ctx.globalAlpha = al; P(X0 - 5, Y0 - 2, 10, 3, '#5a3a1c'); P(X0 - 4, Y0 - 4, 8, 2, '#6e4824'); P(X0 - 2, Y0 - 6, 5, 2, '#7d532a'); P(X0 - 1, Y0 - 7, 2, 1, '#8f6234'); if (((G.t * 2) | 0) % 2) { P(X0 - 6, Y0 - 12, 1, 3, '#9fb23a'); P(X0 + 4, Y0 - 13, 1, 3, '#9fb23a'); } ctx.globalAlpha = 1; return; }
    var a = Math.min(1, (c.life - c.t) * 1.5) * 0.5, r = c.r * T, X = c.x * T, Y = c.y * T + 8;
    ctx.globalAlpha = a; ctx.fillStyle = '#5fb6ee';
    for (var i = -r; i < r; i += 4) { var hh = Math.round(Math.sqrt(Math.max(0, r * r - i * i)) * 0.45); ctx.fillRect(Math.round(X + i), Math.round(Y - hh), 4, hh * 2); }
    ctx.fillStyle = '#d6f0ff'; ctx.fillRect(Math.round(X - r * 0.4), Math.round(Y - 3), 6, 2); ctx.globalAlpha = 1;
  }
  function txt(s, x, y, col, size) { ctx.font = (size || 12) + 'px DOSSaemmul, DOSGothic, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#1b1d21'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(s, x, y); }
  function stampBox(x, y, u, word, col, en) {
    var s2 = u < 0.12 ? 2.2 - u / 0.12 * 1.2 : 1, a2 = u > 0.8 ? (1 - u) / 0.2 : 1;
    ctx.save(); ctx.globalAlpha = a2; ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(-0.12); ctx.scale(s2, s2);
    ctx.fillStyle = 'rgba(255,248,236,.88)'; ctx.fillRect(-30, -13, 60, 26);
    ctx.fillStyle = col; ctx.fillRect(-30, -13, 60, 3); ctx.fillRect(-30, 10, 60, 3); ctx.fillRect(-30, -13, 3, 26); ctx.fillRect(27, -13, 3, 26);
    ctx.font = (en ? '12px' : '16px') + ' DOSSaemmul, DOSGothic, monospace'; ctx.textAlign = 'center'; ctx.fillText(word, 0, 6); ctx.restore();
  }
  function drawFx(f) {
    var x = f.x * T, y = f.y * T, u = f.t / f.life;
    if (f.k === 'coin') txt('+' + f.v, x, y - u * 16, '#ffd84a', 12);
    else if (f.k === 'stamp') stampBox(x, y, u, EN() ? 'CAUGHT' : '검거', '#c9302a', EN());
    else if (f.k === 'complain') stampBox(x, y, u, EN() ? 'COMPLAINT' : '민원', '#e0453a', EN());
    else if (f.k === 'nice') { var sc3 = u < 0.15 ? 0.6 + u / 0.15 * 0.5 : 1.1 - Math.min(0.1, (u - 0.15)); ctx.save(); ctx.globalAlpha = u > 0.75 ? (1 - u) / 0.25 : 1; ctx.translate(x, y); ctx.scale(sc3, sc3); txt('NICE', 0, 0, '#ffe04a', 34); ctx.restore(); }
    else if (f.k === 'found') txt('!', x, y - u * 8, '#ff3b30', 14);
    else if (f.k === 'miss') txt('MISS', x, y - u * 10, '#e8ecf0', 9);
    else if (f.k === 'crit') txt('x2', x, y - u * 10, '#ffe04a', 11);
    else if (f.k === 'zzz') { ctx.globalAlpha = 1 - u; txt('Z', x + 8 + Math.sin(f.t * 3) * 3, y - u * 18, '#cfe0ff', 10); txt('z', x + 14, y - 6 - u * 12, '#cfe0ff', 8); ctx.globalAlpha = 1; }
    else if (f.k === 'swing') { ctx.globalAlpha = 1 - u; for (var i = 0; i < 5; i++) { var a = -1.2 + i * 0.4 + u * 1.5; P(Math.round(x + Math.cos(a) * 12), Math.round(y + Math.sin(a) * 9), 3, 3, f.c || '#fff'); } ctx.globalAlpha = 1; }
    else if (f.k === 'grab') { ctx.globalAlpha = 1 - u; ring(x, y, 6 + u * 10, '#ffffff'); ring(x, y, 3 + u * 6, '#ffe04a'); ctx.globalAlpha = 1; }
    else if (f.k === 'stunhit') { ctx.globalAlpha = 1 - u; P(x - 8, y - 2, 16, 2, '#ffe04a'); P(x - 1, y - 9, 2, 16, '#ffe04a'); ctx.globalAlpha = 1; }
    else if (f.k === 'smell') { ctx.globalAlpha = 0.6 * (1 - u); for (var j = 0; j < 4; j++) { var sx = x - 12 + j * 8, sy = y - 6 - u * 14; for (var k = 0; k < 8; k++) P(Math.round(sx + Math.sin(k * 0.9 + f.t * 6 + j) * 2), Math.round(sy - k * 2), 2, 2, j % 2 ? '#c9d65a' : '#9fb23a'); } ctx.globalAlpha = 1; }
    else if (f.k === 'goods') { ctx.globalAlpha = 1 - u * 0.5; spr('o_items', 8, x - 9, y + 14, false, null, false, 0.45); spr('o_items', 9, x + 9, y + 14, false, null, false, 0.4); ctx.globalAlpha = 1; }
    else if (f.k === 'aura') { ctx.globalAlpha = 1 - u; ring(x, y, 10 + u * 30, '#b16aff'); ctx.globalAlpha = 1; }
    else if (f.k === 'dust') { ctx.globalAlpha = 1 - u; for (var q = 0; q < 6; q++) { var aa = q * 1.05, rr = 6 + u * 18; P(Math.round(x + Math.cos(aa) * rr - 5), Math.round(y + Math.sin(aa) * rr * 0.6 - 4), 10, 8, '#c9c4b8'); } ctx.globalAlpha = 1; }
  }
  // 빌런이 갈 길(준비 시간에만): 각 문에서 연결문까지 흐린 발자국
  function drawPaths() {
    var f = G.fields.norm; if (!f) return;
    ctx.fillStyle = 'rgba(255,90,60,.55)';
    G.map.spawns.forEach(function (s) {
      var x = s[0], y = s[1], guard = 0;
      while (guard++ < 200) {
        var i = y * MW + x, best = -1, bd = f[i];
        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function (d) { var nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) return; var j = ny * MW + nx; if (f[j] < bd - 0.01) { bd = f[j]; best = j; } });
        if (best < 0) break;
        var nx = best % MW, ny = (best / MW) | 0;
        ctx.globalAlpha = ((G.t * 3 + guard) | 0) % 3 === 0 ? 0.75 : 0.35;
        ctx.fillRect(Math.round((x + nx) / 2 * T + T / 2 - 1), Math.round((y + ny) / 2 * T + T / 2 - 1), 3, 3);
        x = nx; y = ny;
      }
    });
    ctx.globalAlpha = 1;
  }

  function frame(hover) {
    if (!ctx || !G.map) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#121418'; ctx.fillRect(0, 0, cv.width, cv.height);
    var sx = 0, sy = 0; if (G.shake > 0) { sx = (Math.random() - 0.5) * 6; sy = (Math.random() - 0.5) * 6; }
    // 달릴 때 객차가 덜컹(이음매마다 1도트)
    if (G.vel > 0.5 && ((G.scroll / 70) | 0) % 9 === 0) sy += 1;
    ctx.setTransform(sc, 0, 0, sc, ox + sx * sc, oy + sy * sc); ctx.imageSmoothingEnabled = false;
    drawWindows();
    ctx.drawImage(G.map.cv, 0, 0);
    drawDoors();
    // 연결문 경고등
    G.map.exits.forEach(function (e) { var on = G.phase === 'wave' && ((G.t * 3) | 0) % 2; P(e[0] * T + 10, e[1] * T + 3, 4, 4, on ? '#ff3b30' : '#7a2620'); });
    if (G.phase === 'build') drawPaths();
    G.puddles.forEach(drawPuddle);
    if (G.sel && G.towers[G.sel.i] === G.sel && D.TOWERS[G.sel.type].r) ring(G.sel.x * T + T / 2, G.sel.y * T + T / 2, L1L.range(G.sel) * T, 'rgba(255,255,255,.85)');
    var list = [];
    for (var k in G.towers) list.push({ y: G.towers[k].y + 0.9, d: 0, o: G.towers[k] });
    G.enemies.forEach(function (e) { list.push({ y: e.y + 0.4 + (D.ENEMIES[e.type].bird ? 0.6 : 0), d: 1, o: e }); });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (it) { if (it.d === 0) drawTower(it.o); else drawEnemy(it.o); });
    G.proj.forEach(drawProj);
    if (G.map.night) { ctx.fillStyle = 'rgba(16,20,56,.2)'; ctx.fillRect(0, 0, LW, LH); ctx.fillStyle = 'rgba(255,236,170,.06)'; ctx.fillRect(0, 2 * T, LW, T); ctx.fillRect(0, (MH - 3) * T, LW, T); }
    G.fx.forEach(drawFx);
    if (hover && G.tool && G.phase !== 'title' && hover.x >= 0 && hover.y >= 0 && hover.x < MW && hover.y < MH) {
      var ok = L1L.canBuild(hover.x, hover.y) && G.coins >= L1L.cost(G.tool), X = hover.x * T, Y = hover.y * T, cc = ok ? '#8ef08e' : '#ff5a4a';
      ctx.fillStyle = ok ? 'rgba(120,230,120,.28)' : 'rgba(255,60,50,.3)'; ctx.fillRect(X, Y, T, T);
      P(X, Y, T, 2, cc); P(X, Y + T - 2, T, 2, cc); P(X, Y, 2, T, cc); P(X + T - 2, Y, 2, T, cc);
      var r = D.TOWERS[G.tool].r; if (r) ring(X + T / 2, Y + T / 2, r * T, ok ? 'rgba(160,255,160,.8)' : 'rgba(255,120,110,.8)', true);
    }
    if (G.flash > 0) { ctx.fillStyle = 'rgba(255,40,30,' + Math.min(0.35, G.flash) + ')'; ctx.fillRect(0, 0, LW, LH); }
  }
  // 단추 그림: 사람은 첫 칸, 물건은 물건 그림
  function icon(canvas, type) {
    var c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
    var save = ctx; ctx = c; var d = D.TOWERS[type];
    c.setTransform(canvas.width / 44, 0, 0, canvas.width / 44, 0, 0);
    if (d.spr) spr(d.spr, 0, 22, 44);
    else spr('o_items', type === 'fence' ? 0 : type === 'cctv' ? 2 : 3, 22, 38, false, null, false, 1.25);
    ctx = save;
  }
  // 빌런 그림(도감·소개)
  function face(canvas, type) {
    var c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
    var def = D.ENEMIES[type], m = A[def.spr]; if (!m) return;
    var save = ctx; ctx = c; var s = Math.min(canvas.width / (m[2] + 4), canvas.height / (m[3] + 4));
    c.setTransform(s, 0, 0, s, 0, 0);
    var f = def.hiker ? (type === 'b_hiker' ? 8 : 1) : def.bird ? 10 : 0;
    if (type === 'b_hiker') { for (var i = 0; i < 4; i++) spr(def.spr, 8 + i, (m[2] + 4) / 2 - 12 + i * 8, m[3] + 2, false, null, false, 0.6); }
    else spr(def.spr, f, (m[2] + 4) / 2, m[3] + 2);
    ctx = save;
  }
  window.L1D = { init: init, resize: resize, frame: frame, toCell: toCell, icon: icon, face: face, ready: function () { return ready; }, LW: LW, LH: LH, spr: spr };
})();
