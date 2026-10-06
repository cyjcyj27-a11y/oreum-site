// 그리기: 지도, 장비, 수감자, 탄, 효과, 밤 어둠
(function () {
  'use strict';
  var D = GY_DATA, M = GY_MAP, T = M.T, MW = M.MW, MH = M.MH, LW = MW * T, LH = MH * T;
  var A = window.GY_ATLAS || {}, img = new Image(), white = null, ready = false;
  img.onload = function () {
    ready = true;
    white = document.createElement('canvas'); white.width = img.width; white.height = img.height;
    var c = white.getContext('2d'); c.drawImage(img, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#fff'; c.fillRect(0, 0, img.width, img.height);
  };
  img.src = 'img/atlas.png?v=1';
  var cv, ctx, sc = 1, ox = 0, oy = 0, night = document.createElement('canvas'); night.width = LW; night.height = LH;
  var nctx = night.getContext('2d');

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
  // 도트 고리(안티에일리어싱 없이)
  function ring(cx, cy, r, col, dash) {
    ctx.fillStyle = col; var n = Math.max(24, Math.round(r * 0.9));
    for (var i = 0; i < n; i++) { if (dash && (i % 4) > 1) continue; var a = i / n * 6.2832; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2); }
  }
  // 아틀라스 그리기. 프레임 f, 좌우 뒤집기, 발끝(아래 가운데)을 (x,y)에
  function spr(name, f, x, y, flip, alpha, wh, clipH) {
    var m = A[name]; if (!m || !ready) { P(x - 8, y - 30, 16, 30, '#f0f'); return; }
    var n = m[4]; f = ((f % n) + n) % n;
    var sx = m[0] + f * m[2], sy = m[1], w = m[2], h = m[3], src = wh ? white : img;
    var hh = clipH ? Math.max(0, h - clipH) : h;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(src, sx, sy, w, hh, -Math.round(w / 2), Math.round(y - h), w, hh); }
    else ctx.drawImage(src, sx, sy, w, hh, Math.round(x - w / 2), Math.round(y - h), w, hh);
    ctx.restore();
  }
  // 방향(0아래 1위 2오른 3왼) -> 시트 행
  function rowOf(dir) { return dir === 0 ? 0 : dir === 1 ? 1 : 2; }
  function shadow(x, y, w) { ctx.fillStyle = 'rgba(20,22,26,.32)'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), w, 3); ctx.fillRect(Math.round(x - w / 2 + 2), Math.round(y - 3), w - 4, 5); }

  function drawTower(tw) {
    var X = tw.x * T, Y = tw.y * T, cx = X + T / 2, by = Y + T - 3, t = G.t;
    if (tw.type === 'door') {
      var hp = tw.hp, max = [3, 5, 8][tw.lv];
      P(X + 1, Y + 4, T - 2, T - 6, '#2d3137');
      for (var i = 3; i < T - 2; i += 5) { P(X + i, Y + 4, 2, T - 7, tw.lv === 2 ? '#c9a24a' : '#9aa4ae'); P(X + i + 1, Y + 4, 1, T - 7, '#5c656f'); }
      P(X + 1, Y + 4, T - 2, 3, '#b8c0c8'); P(X + 1, Y + 14, T - 2, 2, '#7d8690'); P(X + 1, Y + T - 5, T - 2, 3, '#5c656f');
      P(X + T / 2 - 3, Y + 15, 6, 5, '#d9b23a'); P(X + T / 2 - 1, Y + 17, 2, 2, '#3a2d10');
      if (hp < max) { P(X + 6, Y + 8, 2, 6, '#1a1c20'); P(X + 8, Y + 13, 3, 2, '#1a1c20'); }
      if (hp <= max / 2) { P(X + 20, Y + 18, 2, 7, '#1a1c20'); P(X + 17, Y + 24, 4, 2, '#1a1c20'); }
      return;
    }
    shadow(cx, by, 18);
    if (tw.type === 'cctv') {
      P(cx - 1, Y + 10, 3, T - 12, '#5c656f'); P(cx - 4, by - 2, 9, 3, '#3a3f46');
      var dx = Math.round(Math.cos(tw.ang) * 4);
      P(cx - 7 + dx, Y + 4, 13, 8, '#e6e8eb'); P(cx - 7 + dx, Y + 4, 13, 2, '#ffffff'); P(cx - 7 + dx, Y + 10, 13, 2, '#9aa1a8');
      P(cx + (dx > 0 ? 5 : -9) + dx, Y + 6, 4, 4, '#2a2e33');
      if ((t * 2 | 0) % 2) P(cx - 5 + dx, Y + 5, 2, 2, '#ff3b30');
      return;
    }
    if (tw.type === 'light') {
      P(cx - 1, Y + 6, 3, T - 8, '#4b525a'); P(cx - 5, by - 2, 11, 3, '#2f343a');
      P(cx - 6, Y + 1, 13, 9, '#2f343a'); P(cx - 5, Y + 2, 11, 6, G.night ? '#fff6c8' : '#cfd3d8');
      if (G.night) { P(cx - 3, Y + 3, 4, 2, '#ffffff'); }
      return;
    }
    var name = tw.type === 'guard' ? 'g_guard' : tw.type === 'riot' ? 'g_riot' : 'g_dog';
    if (tw.type === 'dog') {
      // 개집 + 개
      P(X + 4, Y + 10, 24, 18, '#8a5a32'); P(X + 2, Y + 8, 28, 4, '#6b4223'); P(X + 11, Y + 16, 10, 12, '#2a1a10');
      if (!tw.dog) spr(name, 8 + ((t * 2 | 0) % 2), cx + 8, by + 2, false);
      return;
    }
    var row = rowOf(tw.dir), f = row * 4 + (tw.act > 0 ? (tw.act > 0.12 ? 2 : 3) : ((t * 1.5 + tw.x) | 0) % 2);
    spr(name, f, cx, by, tw.dir === 3);
    if (tw.lv) for (var k = 0; k < tw.lv; k++) { P(cx + 9, Y - 8 + k * 3, 5, 2, '#f2c744'); P(cx + 9, Y - 6 + k * 3, 5, 1, '#8a6a12'); }
  }
  function drawDog(tw) {
    var dg = tw.dog; if (!dg) return;
    var px = dg.x * T, py = dg.y * T + 10, row = rowOf(dg.dir);
    shadow(px, py, 14); spr('g_dog', row * 4 + ((dg.fr | 0) % 4), px, py, dg.dir === 3);
  }
  function drawEnemy(e) {
    var def = D.ENEMIES[e.type], px = e.x * T, py = e.y * T + 12, row = rowOf(e.dir), f = row * 4 + ((e.fr | 0) % 4), flip = e.dir === 3;
    if (e.state === 'caught') {
      var a = Math.max(0, 1 - Math.max(0, e.t - 0.5) * 2);
      shadow(px, py, 16); spr(def.spr, 0, px, py + Math.min(6, e.t * 20), false, a);
      // 수갑
      ctx.globalAlpha = a; P(px - 6, py - 22, 5, 5, '#d7dce2'); P(px + 1, py - 22, 5, 5, '#d7dce2'); P(px - 5, py - 21, 3, 3, '#3a3f46'); P(px + 2, py - 21, 3, 3, '#3a3f46'); P(px - 1, py - 20, 2, 1, '#d7dce2'); ctx.globalAlpha = 1;
      return;
    }
    if (e.state === 'esc') {
      var u = Math.min(1, e.t / 0.8);
      spr(def.spr, 4 + ((e.t * 10) | 0) % 4, px, py - Math.sin(u * Math.PI) * 26 - u * 10, false, 1 - u);
      return;
    }
    if (def.under && !e.rev && !(e.peek > 0)) {
      // 땅속: 흙더미만 움직인다
      mound(px, py, (e.fr * 2 | 0) % 2);
      return;
    }
    shadow(px, py, def.boss ? 22 : def.smash ? 20 : 14);
    if (e.type === 'fast' && e.smoke <= 0) { var bx = e.dir === 2 ? -1 : e.dir === 3 ? 1 : 0, by = e.dir === 0 ? -1 : e.dir === 1 ? 1 : 0; ctx.globalAlpha = 0.7; for (var s = 0; s < 3; s++) { var o = ((G.t * 30 + s * 7) % 14); if (bx) P(px + bx * (10 + o), py - 26 + s * 7, 6, 1, '#ffffff'); else P(px - 8 + s * 7, py - 30 + by * (6 + o), 1, 5, '#ffffff'); } ctx.globalAlpha = 1; }
    if (e.smoke > 0) { spr(def.spr, f, px, py, flip, 0.25); return; }
    var sink = def.under ? (e.rev ? 10 : 22) : 0;
    spr(def.spr, f, px, py + (def.under && !e.rev ? 4 : 0), flip, null, false, sink);
    if (e.hit > 0) spr(def.spr, f, px, py + (def.under && !e.rev ? 4 : 0), flip, 0.75, true, sink);
    if (def.under) mound(px, py - 6, 0, true);
    if ((def.hidden || def.under) && e.rev) { P(px - 1, py - 50, 3, 7, '#ff3b30'); P(px - 1, py - 41, 3, 3, '#ff3b30'); }
    if (def.boss) { ctx.font = '10px DungGeunMo, monospace'; ctx.textAlign = 'center'; var tw2 = 34; P(px - tw2 / 2, py - 66, tw2, 12, '#9b1c16'); P(px - tw2 / 2, py - 66, tw2, 1, '#e0453a'); ctx.fillStyle = '#ffe8a0'; ctx.fillText(window.GY_LANG === 'en' ? 'KING' : '탈옥왕', px, py - 57); }
    if (e.hp < e.max) {
      var bw = def.boss ? 34 : 16, h = Math.max(0, e.hp / e.max);
      P(px - bw / 2 - 1, py - 47, bw + 2, 4, '#1b1d21'); P(px - bw / 2, py - 46, Math.round(bw * h), 2, h > 0.5 ? '#7bd14a' : h > 0.25 ? '#f2c744' : '#ff4d3a');
    }
  }
  // 흙무덤(땅굴꾼): 층층이 좁아지는 도트 더미 + 튀는 흙알
  function mound(x, y, ph, small) {
    var rows = small ? [[18, '#5a3f22'], [14, '#7a5934'], [8, '#9a7646']] : [[20, '#4f371d'], [16, '#6b4c2a'], [12, '#86643a'], [6, '#a8845a']];
    for (var i = 0; i < rows.length; i++) { var w = rows[i][0] + (ph && i === rows.length - 1 ? 2 : 0); P(Math.round(x - w / 2), Math.round(y - 2 - i * 2), w, 2, rows[i][1]); }
    if (!small) { var k = ph ? 1 : -1; P(x + 7 * k, y - 10, 2, 2, '#86643a'); P(x - 5 * k, y - 12, 2, 2, '#6b4c2a'); P(x + 2, y - 9, 1, 1, '#c9a874'); }
  }
  function drawProj(p) {
    var x = p.x * T, y = p.y * T;
    if (p.k === 'cuff') {
      var a = p.t * 18, dx = Math.round(Math.cos(a) * 3), dy = Math.round(Math.sin(a) * 3);
      P(x - dx - 2, y - dy - 2, 4, 4, '#e3e7ec'); P(x + dx - 2, y + dy - 2, 4, 4, '#e3e7ec'); P(x - 1, y - 1, 2, 2, '#9aa1a8');
    } else { P(x - 3, y - 4, 6, 8, '#4d5a3c'); P(x - 3, y - 4, 6, 2, '#c9cdd3'); P(x + 2, y - 6, 2, 2, '#bbbbbb'); }
  }
  function drawCloud(c) {
    var a = Math.min(1, (c.life - c.t) * 1.5) * 0.55, r = c.r * T;
    ctx.globalAlpha = a;
    for (var i = 0; i < 9; i++) { var an = i * 0.7 + c.t * 0.8, rr = r * (0.35 + (i % 3) * 0.2); var px = c.x * T + Math.cos(an) * rr, py = c.y * T + Math.sin(an) * rr * 0.6; P(Math.round(px - 7), Math.round(py - 5), 14, 10, i % 2 ? '#c9d6b0' : '#e3ead2'); }
    ctx.globalAlpha = 1;
  }
  function drawFx(f) {
    var x = f.x * T, y = f.y * T, u = f.t / f.life;
    if (f.k === 'coin') {
      ctx.font = '12px Mulmaru, DungGeunMo, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#1b1d21'; ctx.fillText('+' + f.v, x + 1, y - u * 16 + 1); ctx.fillStyle = '#ffd84a'; ctx.fillText('+' + f.v, x, y - u * 16);
    } else if (f.k === 'stamp') {
      var sc2 = u < 0.12 ? 2.2 - u / 0.12 * 1.2 : 1, a2 = u > 0.8 ? (1 - u) / 0.2 : 1;
      ctx.save(); ctx.globalAlpha = a2; ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(-0.12); ctx.scale(sc2, sc2);
      ctx.fillStyle = 'rgba(255,240,220,.85)'; ctx.fillRect(-30, -13, 60, 26);
      ctx.fillStyle = '#c9302a'; ctx.fillRect(-30, -13, 60, 3); ctx.fillRect(-30, 10, 60, 3); ctx.fillRect(-30, -13, 3, 26); ctx.fillRect(27, -13, 3, 26);
      ctx.font = (window.GY_LANG === 'en' ? '14px' : '18px') + ' Mulmaru, DungGeunMo, monospace'; ctx.textAlign = 'center'; ctx.fillText(window.GY_LANG === 'en' ? 'CAUGHT' : '검거', 0, 7); ctx.restore();
    } else if (f.k === 'found') {
      ctx.font = '14px Mulmaru, DungGeunMo, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#1b1d21'; ctx.fillText('!', x + 1, y - u * 8 + 1); ctx.fillStyle = '#ff3b30'; ctx.fillText('!', x, y - u * 8);
    } else if (f.k === 'smoke' || f.k === 'dust') {
      ctx.globalAlpha = 1 - u;
      for (var i = 0; i < 6; i++) { var a = i * 1.05, r = 6 + u * 18; P(Math.round(x + Math.cos(a) * r - 5), Math.round(y + Math.sin(a) * r * 0.6 - 4), 10, 8, f.k === 'dust' ? '#a8957a' : '#d8dadc'); }
      ctx.globalAlpha = 1;
    }
  }
  // 수감자들이 갈 길(설치 시간에만): 각 문에서 출구까지 흐린 발자국
  function drawPaths() {
    var f = G.fields.norm; if (!f) return;
    ctx.fillStyle = 'rgba(255,90,60,.55)';
    G.map.spawns.forEach(function (s, si) {
      var x = s[0], y = s[1], guard = 0;
      while (guard++ < 200) {
        var i = y * MW + x, best = -1, bd = f[i];
        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function (d) { var nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) return; var j = ny * MW + nx; if (f[j] < bd - 0.01) { bd = f[j]; best = j; } });
        if (best < 0) break;
        var nx = best % MW, ny = (best / MW) | 0;
        var ph = ((G.t * 3 + guard) | 0) % 3 === 0;
        ctx.globalAlpha = ph ? 0.75 : 0.35;
        ctx.fillRect(Math.round((x + nx) / 2 * T + T / 2 - 1), Math.round((y + ny) / 2 * T + T / 2 - 1), 3, 3);
        x = nx; y = ny;
      }
    });
    ctx.globalAlpha = 1;
  }
  function drawNight() {
    nctx.globalCompositeOperation = 'source-over'; nctx.clearRect(0, 0, LW, LH);
    nctx.fillStyle = 'rgba(8,12,34,.72)'; nctx.fillRect(0, 0, LW, LH);
    nctx.globalCompositeOperation = 'destination-out';
    function hole(x, y, r, a) {
      var g = nctx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      nctx.fillStyle = g; nctx.beginPath(); nctx.arc(x, y, r, 0, 6.2832); nctx.fill();
    }
    for (var k in G.towers) {
      var tw = G.towers[k], cx = tw.x * T + T / 2, cy = tw.y * T + T / 2;
      if (tw.type === 'light') { var r = (D.TOWERS.light.r + GYL.LVR[tw.lv]) * T; hole(cx, cy, r, 1); hole(cx + Math.cos(tw.ang) * r * 0.5, cy + Math.sin(tw.ang) * r * 0.5, r * 0.5, 1); }
      else hole(cx, cy - 6, 26, 0.7);
    }
    G.map.exits.forEach(function (e) { hole(e[0] * T + T / 2, e[1] * T + T / 2, 30, 0.8); });
    ctx.drawImage(night, 0, 0);
  }

  function frame(hover) {
    if (!ctx || !G.map) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#16181c'; ctx.fillRect(0, 0, cv.width, cv.height);
    var sx = 0, sy = 0; if (G.shake > 0) { sx = (Math.random() - 0.5) * 6; sy = (Math.random() - 0.5) * 6; }
    ctx.setTransform(sc, 0, 0, sc, ox + sx * sc, oy + sy * sc); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(G.map.cv, 0, 0);
    // 출구 경광등
    G.map.exits.forEach(function (e) { var on = G.phase === 'wave' && ((G.t * 3) | 0) % 2; P(e[0] * T + 12, e[1] * T + 2, 8, 5, on ? '#ff3b30' : '#7a2620'); });
    if (G.phase === 'build') drawPaths();
    // 고른 장비 사거리
    if (G.sel && G.towers[G.sel.i] === G.sel && D.TOWERS[G.sel.type].r) ring(G.sel.x * T + T / 2, G.sel.y * T + T / 2, GYL.range(G.sel) * T, 'rgba(255,255,255,.85)');
    // y 순서로
    var list = [];
    for (var k in G.towers) list.push({ y: G.towers[k].y + 0.9, d: 0, o: G.towers[k] });
    G.enemies.forEach(function (e) { list.push({ y: e.y + 0.4, d: 1, o: e }); });
    for (k in G.towers) if (G.towers[k].dog) list.push({ y: G.towers[k].dog.y + 0.3, d: 2, o: G.towers[k] });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (it) { if (it.d === 0) drawTower(it.o); else if (it.d === 1) drawEnemy(it.o); else drawDog(it.o); });
    G.clouds.forEach(drawCloud);
    G.proj.forEach(drawProj);
    if (G.night) drawNight();
    G.fx.forEach(drawFx);
    // 설치 미리보기
    if (hover && G.tool && G.phase !== 'title' && hover.x >= 0 && hover.y >= 0 && hover.x < MW && hover.y < MH) {
      var ok = GYL.canBuild(hover.x, hover.y) && G.coins >= D.TOWERS[G.tool].cost, X = hover.x * T, Y = hover.y * T;
      ctx.fillStyle = ok ? 'rgba(120,230,120,.28)' : 'rgba(255,60,50,.3)'; ctx.fillRect(X, Y, T, T);
      P(X, Y, T, 2, ok ? '#8ef08e' : '#ff5a4a'); P(X, Y + T - 2, T, 2, ok ? '#8ef08e' : '#ff5a4a'); P(X, Y, 2, T, ok ? '#8ef08e' : '#ff5a4a'); P(X + T - 2, Y, 2, T, ok ? '#8ef08e' : '#ff5a4a');
      var r = D.TOWERS[G.tool].r; if (r) ring(X + T / 2, Y + T / 2, r * T, ok ? 'rgba(160,255,160,.8)' : 'rgba(255,120,110,.8)', true);
    }
    if (G.flash > 0) { ctx.fillStyle = 'rgba(255,40,30,' + Math.min(0.35, G.flash) + ')'; ctx.fillRect(0, 0, LW, LH); }
  }
  // 장비 단추 그림(아틀라스에서 첫 칸)
  function icon(canvas, type) {
    var c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
    var save = ctx, sv = cv; ctx = c;
    c.setTransform(canvas.width / 40, 0, 0, canvas.width / 40, 0, 0);
    if (type === 'guard' || type === 'riot') spr(type === 'guard' ? 'g_guard' : 'g_riot', 0, 20, 40);
    else if (type === 'dog') spr('g_dog', 8, 20, 36);
    else { var fake = { type: type, x: 0, y: 0, lv: 0, hp: 3, ang: 0.6, act: 0, dir: 0 }; c.setTransform(canvas.width / 34, 0, 0, canvas.width / 34, 0, 0); c.translate(1, 1); drawTower(fake); }
    ctx = save; cv = sv;
  }
  window.GYD = { init: init, resize: resize, frame: frame, toCell: toCell, icon: icon, ready: function () { return ready; }, LW: LW, LH: LH };
})();