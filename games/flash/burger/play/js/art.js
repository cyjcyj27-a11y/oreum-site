// 수제버거 — 그림은 전부 코드. 빛은 왼쪽 위 주방 조명 하나로 맞춘다
(function () {
  var PI = Math.PI, TAU = PI * 2;
  var SQ = 0.5;                                          // 내려다본 만큼 깊이가 눌린다 (윗면 타원 세로 비율)
  var SQS = 0.34;                                        // 버거 층은 조금 낮게 본다 — 층이 옆으로 보여야 먹음직스럽다

  // ---------- 색 ----------
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgb(c, a) { return a == null ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')' : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function dk(c, m) { return [c[0] * (1 - m), c[1] * (1 - m), c[2] * (1 - m)]; }
  function lt(c, k) { return mix(c, [255, 255, 255], k); }
  function ramp(stops, v) {
    if (v <= stops[0][0]) return stops[0][1];
    for (var i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
      var a = stops[i - 1], b = stops[i];
      return mix(a[1], b[1], (v - a[0]) / (b[0] - a[0]));
    }
    return stops[stops.length - 1][1];
  }
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }
  function rrect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  // 울퉁불퉁한 타원 — 고기·양상추 가장자리
  function blob(g, x, y, rx, ry, jit, seed, n, phase) {
    var r = rng(seed), k = [], i;
    n = n || 22;
    for (i = 0; i < n; i++) k.push(1 + (r() * 2 - 1) * jit);
    g.beginPath();
    for (i = 0; i <= n; i++) {
      var a = (i / n) * TAU + (phase || 0), m = k[i % n], m2 = k[(i + 1) % n];
      var a2 = ((i + 0.5) / n) * TAU + (phase || 0), mm = (m + m2) / 2;
      var px = x + Math.cos(a) * rx * m, py = y + Math.sin(a) * ry * m;
      if (i === 0) g.moveTo(px, py);
      else g.quadraticCurveTo(x + Math.cos(a - PI / n) * rx * k[(i - 1 + n) % n] * 1.02, y + Math.sin(a - PI / n) * ry * k[(i - 1 + n) % n] * 1.02, px, py);
    }
    g.closePath();
  }
  // 원기둥 옆면 그라데이션 — 왼쪽 위에서 빛
  function sideGrad(g, x, rx, c, lite, dark) {
    var gr = g.createLinearGradient(x - rx, 0, x + rx, 0);
    gr.addColorStop(0, rgb(dk(c, dark || 0.42)));
    gr.addColorStop(0.28, rgb(lt(c, lite || 0.12)));
    gr.addColorStop(0.55, rgb(c));
    gr.addColorStop(1, rgb(dk(c, (dark || 0.42) + 0.12)));
    return gr;
  }
  function cylSide(g, x, yTop, rx, ry, h) {
    g.beginPath(); g.moveTo(x - rx, yTop); g.lineTo(x - rx, yTop + h);
    g.ellipse(x, yTop + h, rx, ry, 0, PI, 0, true);
    g.lineTo(x + rx, yTop); g.closePath();
  }
  function shadow(g, x, y, rx, ry, a) {
    var gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, 'rgba(20,12,6,' + a + ')'); gr.addColorStop(1, 'rgba(20,12,6,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore();
  }

  // ---------- 익힘 색 ----------
  var BEEF = [[0, hx('#d86f7b')], [0.3, hx('#c9807a')], [0.55, hx('#a27260')], [0.8, hx('#8a5a3c')],
    [1.08, hx('#6b4028')], [1.36, hx('#46291a')], [1.6, hx('#1d1410')]];
  var CRUMB = [[0, hx('#efe0bd')], [0.5, hx('#e6b976')], [0.9, hx('#cf7f2c')], [1.2, hx('#a45a1f')], [1.5, hx('#5b3a1e')], [1.7, hx('#261a12')]];
  var FRY = [[0, hx('#f1e6c2')], [0.5, hx('#eed592')], [0.9, hx('#e8b04a')], [1.2, hx('#c47f2c')], [1.5, hx('#6a4220')], [1.7, hx('#2a1c12')]];
  // 게이지 구간 — 주문표 뱃지와 같은 색을 쓴다
  var ZONES = {
    beef: [[0, 0.5, '#9aa0a6'], [0.5, 0.8, '#e0566a'], [0.8, 1.08, '#e8913a'], [1.08, 1.36, '#8a5330'], [1.36, 1.7, '#1d1612']],
    fry: [[0, 0.8, '#d9cfa8'], [0.8, 1.25, '#f0b53d'], [1.25, 1.45, '#b06a28'], [1.45, 1.7, '#1d1612']]
  };
  var DONE_COL = { rare: '#e0566a', medium: '#e8913a', well: '#8a5330' };

  // ---------- 벽·조리대 ----------
  var WALL_TINT = ['#f4efe6', '#eef3f1', '#f3ece4', '#efeaf2', '#f6f0df'];
  var STRIPE = ['#d8452f', '#2f8f7a', '#c9822b', '#6a4fa3', '#b8912f'];

  function wall(g, x0, y0, w, h, rank, t) {
    var base = hx(WALL_TINT[rank] || WALL_TINT[0]);
    var gr = g.createLinearGradient(0, y0, 0, y0 + h);
    gr.addColorStop(0, rgb(dk(base, 0.18))); gr.addColorStop(0.55, rgb(base)); gr.addColorStop(1, rgb(dk(base, 0.08)));
    g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    // 지하철 타일 — 줄눈 + 타일마다 살짝 다른 윤
    var tw = 64, th = 30, r = rng(7);
    for (var row = 0; row * th < h; row++) {
      var yy = y0 + row * th, off = row % 2 ? tw / 2 : 0;
      for (var cx = x0 - tw + off; cx < x0 + w; cx += tw) {
        var v = r();
        g.fillStyle = 'rgba(255,255,255,' + (0.10 + v * 0.18) + ')';
        rrect(g, cx + 2, yy + 2, tw - 4, th - 4, 5); g.fill();
        g.fillStyle = 'rgba(255,255,255,' + (0.25 + v * 0.2) + ')';
        g.fillRect(cx + 7, yy + 5, tw * 0.45, 2.2);
      }
      g.fillStyle = 'rgba(120,110,95,.22)'; g.fillRect(x0, yy, w, 1.6);
    }
    for (row = 0; row * th < h; row++) {
      off = row % 2 ? tw / 2 : 0;
      g.fillStyle = 'rgba(120,110,95,.16)';
      for (cx = x0 - tw + off; cx < x0 + w; cx += tw) g.fillRect(cx, y0 + row * th, 1.6, th);
    }
    // 가게 색 띠
    var sc = hx(STRIPE[rank] || STRIPE[0]);
    var sy = y0 + h - 34;
    var sg = g.createLinearGradient(0, sy, 0, sy + 22);
    sg.addColorStop(0, rgb(lt(sc, 0.15))); sg.addColorStop(1, rgb(dk(sc, 0.25)));
    g.fillStyle = sg; g.fillRect(x0, sy, w, 22);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x0, sy + 2, w, 2);
    // 위쪽 그늘 (후드 아래)
    var tg = g.createLinearGradient(0, y0, 0, y0 + 120);
    tg.addColorStop(0, 'rgba(30,20,10,.35)'); tg.addColorStop(1, 'rgba(30,20,10,0)');
    g.fillStyle = tg; g.fillRect(x0, y0, w, 120);
  }

  function neon(g, x, y, w, h, rank, t, label) {
    // 나무 판 + 네온 글자
    g.save();
    shadow(g, x + w / 2 + 8, y + h + 6, w * 0.55, 14, 0.18);
    var wood = hx('#4a2e1e');
    var wg = g.createLinearGradient(x, y, x, y + h);
    wg.addColorStop(0, rgb(lt(wood, 0.08))); wg.addColorStop(1, rgb(dk(wood, 0.3)));
    rrect(g, x, y, w, h, 14); g.fillStyle = wg; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.stroke();
    g.save(); rrect(g, x, y, w, h, 14); g.clip();
    var r = rng(11); g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1.5;
    for (var i = 0; i < 9; i++) { var yy = y + r() * h; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + w * 0.3, yy + 4, x + w * 0.7, yy - 5, x + w, yy + 2); g.stroke(); }
    g.restore();
    var col = ['#ff6b4a', '#58f0c8', '#ffb347', '#c38bff', '#ffd86b'][rank] || '#ff6b4a';
    var flick = 0.92 + 0.08 * Math.sin(t * 13) * (Math.sin(t * 0.7) > 0.96 ? 1 : 0);
    g.globalAlpha = flick;
    g.font = '400 ' + Math.round(h * 0.42) + 'px "YeonSung","Ria",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = col; g.shadowBlur = 26; g.fillStyle = col;
    g.fillText(label, x + w / 2, y + h * 0.42);
    g.shadowBlur = 8; g.fillStyle = '#fff6ec'; g.fillText(label, x + w / 2, y + h * 0.42);
    // 작은 햄버거 네온
    g.shadowBlur = 16; g.shadowColor = '#ffc04a'; g.strokeStyle = '#ffd27a'; g.lineWidth = 4; g.lineCap = 'round';
    var bx = x + w / 2, by = y + h * 0.78, bw = w * 0.2;
    g.beginPath(); g.arc(bx, by, bw * 0.5, PI, 0); g.stroke();
    g.beginPath(); g.moveTo(bx - bw * 0.55, by + 7); g.lineTo(bx + bw * 0.55, by + 7); g.stroke();
    g.beginPath(); g.moveTo(bx - bw * 0.5, by + 15); g.lineTo(bx + bw * 0.5, by + 15); g.stroke();
    g.restore();
  }

  function shelf(g, x, y, w, t) {
    // 선반 + 병·통 소품
    shadow(g, x + w / 2, y + 18, w * 0.52, 10, 0.2);
    var items = [
      { k: 'jar', c: '#c8452e', h: 70, w: 44 }, { k: 'jar', c: '#e7b83a', h: 58, w: 40 },
      { k: 'cola', c: '#6b2a17', h: 92, w: 26 }, { k: 'cola', c: '#6b2a17', h: 92, w: 26 },
      { k: 'can', c: '#9fb8c4', h: 64, w: 50 }, { k: 'jar', c: '#6d8e3a', h: 66, w: 42 }
    ];
    var xx = x + 18;
    items.forEach(function (it) {
      var c = hx(it.c), cx = xx + it.w / 2, top = y - it.h;
      if (it.k === 'cola') {
        g.fillStyle = sideGrad(g, cx, it.w / 2, c, 0.25, 0.5);
        g.beginPath(); g.moveTo(cx - it.w / 2, y); g.lineTo(cx - it.w / 2, top + 36);
        g.quadraticCurveTo(cx - it.w / 2, top + 22, cx - 5, top + 12); g.lineTo(cx - 5, top);
        g.lineTo(cx + 5, top); g.lineTo(cx + 5, top + 12); g.quadraticCurveTo(cx + it.w / 2, top + 22, cx + it.w / 2, top + 36);
        g.lineTo(cx + it.w / 2, y); g.closePath(); g.fill();
        g.fillStyle = '#d23a2a'; g.fillRect(cx - it.w / 2, y - 52, it.w, 20);
        g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(cx - it.w / 2 + 4, y - 45, it.w - 8, 3);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - it.w / 2 + 5, top + 30, 3, it.h - 40);
        g.fillStyle = '#c9c9c9'; g.fillRect(cx - 6, top - 4, 12, 6);
      } else {
        g.fillStyle = sideGrad(g, cx, it.w / 2, c, 0.22, 0.45);
        rrect(g, cx - it.w / 2, top + 10, it.w, it.h - 10, 8); g.fill();
        g.fillStyle = it.k === 'can' ? '#7d8e96' : '#eadfc8';
        rrect(g, cx - it.w / 2 - 2, top, it.w + 4, 14, 4); g.fill();
        g.fillStyle = 'rgba(255,250,235,.85)'; rrect(g, cx - it.w / 2 + 5, top + it.h * 0.42, it.w - 10, it.h * 0.3, 3); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - it.w / 2 + 5, top + 16, 4, it.h - 26);
      }
      xx += it.w + 12;
    });
    var sg = g.createLinearGradient(0, y, 0, y + 16);
    sg.addColorStop(0, '#8a5b3a'); sg.addColorStop(1, '#4d301e');
    g.fillStyle = sg; g.fillRect(x, y, w, 16);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, w, 2);
  }

  function counter(g, x0, y0, w, h) {
    // 스테인리스 조리대 — 결 무늬
    var gr = g.createLinearGradient(0, y0, 0, y0 + h);
    gr.addColorStop(0, '#8d9298'); gr.addColorStop(0.08, '#b9bec3'); gr.addColorStop(0.5, '#a7adb2'); gr.addColorStop(1, '#7e8388');
    g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    var r = rng(3);
    for (var i = 0; i < 160; i++) {
      var yy = y0 + r() * h, xx = x0 + r() * w, len = 40 + r() * 220;
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)';
      g.fillRect(xx, yy, len, 1.2);
    }
    // 뒷벽과 만나는 모서리
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x0, y0, w, 5);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0, y0 + 6, w, 2);
    // 창에서 들어오는 빛 번짐 (왼쪽 위)
    var lg = g.createRadialGradient(x0 + w * 0.3, y0 + h * 0.1, 10, x0 + w * 0.3, y0 + h * 0.1, w * 0.6);
    lg.addColorStop(0, 'rgba(255,244,220,.20)'); lg.addColorStop(1, 'rgba(255,244,220,0)');
    g.fillStyle = lg; g.fillRect(x0, y0, w, h);
  }
  function counterFront(g, x0, y0, w, h) {
    var gr = g.createLinearGradient(0, y0, 0, y0 + h);
    gr.addColorStop(0, '#d7dbde'); gr.addColorStop(0.2, '#8f959a'); gr.addColorStop(1, '#4d5257');
    g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x0, y0, w, 2);
  }

  // ---------- 날재료 쟁반 ----------
  function steelBox(g, x, y, w, d, lip, dark) {
    // 위에서 본 쟁반: 윗테 + 안쪽 바닥 + 앞턱
    shadow(g, x + w / 2 + 6, y + d + lip + 4, w * 0.56, 12, 0.28);
    var fg = g.createLinearGradient(0, y + d, 0, y + d + lip);
    fg.addColorStop(0, '#cfd3d7'); fg.addColorStop(1, '#6f757b');
    g.fillStyle = fg; rrect(g, x, y + d - 4, w, lip + 4, 5); g.fill();
    var tg = g.createLinearGradient(x, y, x + w, y + d);
    tg.addColorStop(0, '#e9ecee'); tg.addColorStop(1, '#9aa0a6');
    g.fillStyle = tg; rrect(g, x, y, w, d, 7); g.fill();
    var ig = g.createLinearGradient(0, y + 6, 0, y + d - 6);
    ig.addColorStop(0, dark ? '#4c5157' : '#6c7278'); ig.addColorStop(1, dark ? '#80868b' : '#a4aaaf');
    g.fillStyle = ig; rrect(g, x + 7, y + 6, w - 14, d - 12, 5); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 8, y + 6, w - 16, 5);
  }
  function lid(g, x, y, w, d) {
    var gr = g.createLinearGradient(x, y, x + w, y + d);
    gr.addColorStop(0, '#dfe3e6'); gr.addColorStop(0.5, '#b3b9be'); gr.addColorStop(1, '#8b9197');
    g.fillStyle = gr; rrect(g, x + 2, y - 2, w - 4, d, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 10, y + 3, w - 20, 2);
    g.fillStyle = '#6e747a'; rrect(g, x + w / 2 - 18, y + d / 2 - 7, 36, 10, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + w / 2 - 15, y + d / 2 - 6, 30, 2);
  }

  function rawTray(g, b, kind, on, n) {
    steelBox(g, b.x, b.y, b.w, b.d, b.lip, !on);
    if (!on) return;
    var cx = b.x + b.w / 2, cy = b.y + b.d / 2 + 2, i;
    g.save(); rrect(g, b.x + 7, b.y + 6, b.w - 14, b.d - 12, 5); g.clip();
    if (kind === 'beef') {
      for (i = 0; i < 3; i++) {
        var px = cx - 44 + i * 44, py = cy + (i % 2) * 4 - 2;
        pattyTop(g, px, py + 6, 30, 30 * SQ * 1.25, 'beef', 0, i + 5, 7);
      }
    } else if (kind === 'chicken') {
      for (i = 0; i < 3; i++) chickenRaw(g, cx - 42 + i * 42, cy + (i % 2) * 5 + 2, 26, i + 2);
    } else if (kind === 'shrimp') {
      for (i = 0; i < 3; i++) shrimp(g, cx - 46 + i * 46, cy + (i % 2 ? 8 : -2), 27, i);
    } else if (kind === 'potato') {
      var r = rng(4);
      for (i = 0; i < 26; i++) {
        var fx = cx - 60 + r() * 120, fy = cy - 18 + r() * 36;
        stick(g, fx, fy, 30 + r() * 12, 6.5, r() * 0.8 - 0.4, 0, 0);
      }
    }
    g.restore();
  }
  function chickenRaw(g, x, y, r, s) {
    shadow(g, x + 3, y + 5, r * 1.1, r * 0.4, 0.3);
    blob(g, x, y, r * 1.1, r * 0.62, 0.12, s * 13 + 1, 12);
    var gr = g.createRadialGradient(x - r * 0.4, y - r * 0.3, 1, x, y, r * 1.2);
    gr.addColorStop(0, '#fbe3dc'); gr.addColorStop(1, '#d9998f');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.1); g.quadraticCurveTo(x, y - r * 0.35, x + r * 0.6, y - r * 0.05); g.stroke();
  }
  function shrimp(g, x, y, r, s) {
    g.save(); g.translate(x, y); g.rotate(s * 0.9);
    shadow(g, 3, 5, r, r * 0.4, 0.25);
    g.lineCap = 'round';
    for (var i = 0; i < 5; i++) {
      var a = -PI * 0.1 + i * 0.32, rr = r * (1 - i * 0.12);
      g.strokeStyle = rgb(mix(hx('#f0a38a'), hx('#e36c52'), i / 5)); g.lineWidth = r * 0.5 * (1 - i * 0.12);
      g.beginPath(); g.arc(0, 0, r * 0.62, a, a + 0.34); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(0, 0, r * 0.78, -0.1, 1.3); g.stroke();
    g.fillStyle = '#d9543a'; g.beginPath(); g.moveTo(r * 0.1, r * 0.7); g.lineTo(-r * 0.3, r * 0.95); g.lineTo(-r * 0.1, r * 0.55); g.fill();
    g.restore();
  }
  function stick(g, x, y, len, w, rot, c, kind) {
    var col = kind ? ramp(FRY, c) : hx('#f2e6bd');
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(40,20,5,.22)'; rrect(g, -len / 2 + 2, -w / 2 + 3, len, w, 2); g.fill();
    var gr = g.createLinearGradient(0, -w / 2, 0, w / 2);
    gr.addColorStop(0, rgb(lt(col, 0.25))); gr.addColorStop(0.5, rgb(col)); gr.addColorStop(1, rgb(dk(col, 0.25)));
    g.fillStyle = gr; rrect(g, -len / 2, -w / 2, len, w, 2); g.fill();
    g.fillStyle = rgb(dk(col, 0.1)); g.fillRect(len / 2 - 3, -w / 2, 3, w);
    g.restore();
  }

  // ---------- 패티 ----------
  // 위에서 본 패티 윗면. c = 윗면 익힘, heat = 아랫면에서 올라오는 열(가장자리부터 회색)
  function pattyTop(g, x, y, rx, ry, type, c, seed, heat) {
    var r = rng(seed * 31 + 7);
    if (type === 'beef') {
      var col = ramp(BEEF, c);
      blob(g, x, y, rx, ry, 0.06, seed + 3, 20);
      var gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.5, rx * 0.1, x, y, rx * 1.05);
      gr.addColorStop(0, rgb(lt(col, 0.1))); gr.addColorStop(0.7, rgb(col)); gr.addColorStop(1, rgb(dk(col, 0.25)));
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      // 아래에서 익어 올라오는 회갈색 테
      if (heat > 0.05 && c < 0.5) {
        var hg = g.createRadialGradient(x, y, rx * 0.4, x, y, rx);
        hg.addColorStop(0, 'rgba(150,110,90,0)'); hg.addColorStop(1, 'rgba(150,110,90,' + Math.min(0.75, heat * 0.7) + ')');
        g.fillStyle = hg; g.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      }
      // 다진 고기 결
      for (var i = 0; i < 70; i++) {
        var a = r() * TAU, d = Math.sqrt(r()), px = x + Math.cos(a) * rx * d * 0.95, py = y + Math.sin(a) * ry * d * 0.95;
        var v = r();
        g.fillStyle = v > 0.6 ? rgb(lt(col, 0.28), 0.55) : rgb(dk(col, 0.35), 0.5);
        g.beginPath(); g.ellipse(px, py, 1.2 + r() * 2.2, (1 + r() * 1.6) * 0.8, r() * PI, 0, TAU); g.fill();
      }
      // 석쇠 자국
      if (c > 0.45) {
        g.strokeStyle = 'rgba(28,14,8,' + Math.min(0.62, (c - 0.45) * 1.1) + ')';
        g.lineWidth = rx * 0.1; g.lineCap = 'round';
        for (var k = -2; k <= 2; k++) {
          g.beginPath(); g.moveTo(x + k * rx * 0.38 - rx * 0.5, y - ry * 1.1); g.lineTo(x + k * rx * 0.38 + rx * 0.5, y + ry * 1.1); g.stroke();
        }
      }
      // 기름 윤
      var sh = g.createRadialGradient(x - rx * 0.3, y - ry * 0.35, 0, x - rx * 0.3, y - ry * 0.35, rx * 0.6);
      sh.addColorStop(0, 'rgba(255,240,225,' + (c < 0.3 ? 0.28 : 0.2) + ')'); sh.addColorStop(1, 'rgba(255,240,225,0)');
      g.fillStyle = sh; g.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      if (c > 1.36) {
        g.fillStyle = 'rgba(10,6,4,' + Math.min(0.6, (c - 1.36) * 2) + ')';
        for (i = 0; i < 18; i++) { g.beginPath(); g.ellipse(x + (r() - 0.5) * rx * 1.6, y + (r() - 0.5) * ry * 1.6, 3 + r() * 7, 2 + r() * 4, 0, 0, TAU); g.fill(); }
      }
      g.restore();
    } else {
      crumbTop(g, x, y, rx, ry, c, seed, type);
    }
  }
  function crumbTop(g, x, y, rx, ry, c, seed, type) {
    var col = ramp(CRUMB, c), r = rng(seed * 17 + 3);
    blob(g, x, y, rx, ry, type === 'chicken' ? 0.12 : 0.08, seed + 9, 18);
    var gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.5, rx * 0.1, x, y, rx * 1.05);
    gr.addColorStop(0, rgb(lt(col, 0.2))); gr.addColorStop(0.7, rgb(col)); gr.addColorStop(1, rgb(dk(col, 0.25)));
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    for (var i = 0; i < 90; i++) {
      var a = r() * TAU, d = Math.sqrt(r()), px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d;
      g.fillStyle = r() > 0.5 ? rgb(lt(col, 0.35), 0.8) : rgb(dk(col, 0.3), 0.6);
      g.beginPath(); g.arc(px, py, 1 + r() * 2.2, 0, TAU); g.fill();
    }
    if (type === 'shrimp') {
      for (i = 0; i < 6; i++) {
        g.fillStyle = rgb(mix(hx('#f08a6a'), col, 0.35 + c * 0.2), 0.8);
        g.beginPath(); g.ellipse(x + (r() - 0.5) * rx * 1.3, y + (r() - 0.5) * ry * 1.2, 5 + r() * 5, 3 + r() * 2, r() * PI, 0, TAU); g.fill();
      }
    }
    var sh = g.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 0, x - rx * 0.3, y - ry * 0.4, rx * 0.7);
    sh.addColorStop(0, 'rgba(255,248,230,.3)'); sh.addColorStop(1, 'rgba(255,248,230,0)');
    g.fillStyle = sh; g.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    g.restore();
  }
  // 그릴 위 패티 한 장 (두께 포함). up/down 익힘, flip 은 0..1 뒤집는 중
  function grillPatty(g, x, y, rx, type, up, down, seed, heat, t) {
    var ry = rx * SQ, th = rx * 0.3;
    shadow(g, x + 4, y + th * 0.6, rx * 1.12, ry * 1.15, 0.45);
    // 옆면: 아래는 아랫면 색, 위는 윗면 색
    var cDown = type === 'beef' ? ramp(BEEF, down) : ramp(CRUMB, down);
    var cUp = type === 'beef' ? ramp(BEEF, Math.max(up, Math.min(0.5, down * 0.35))) : ramp(CRUMB, up);
    blob(g, x, y + th, rx, ry, 0.06, seed + 3, 20);
    g.fillStyle = rgb(dk(cDown, 0.3)); g.fill();
    g.beginPath(); g.moveTo(x - rx, y); g.lineTo(x - rx, y + th); g.lineTo(x + rx, y + th); g.lineTo(x + rx, y); g.closePath();
    var sg = g.createLinearGradient(0, y - 2, 0, y + th + ry * 0.3);
    sg.addColorStop(0, rgb(dk(cUp, 0.1))); sg.addColorStop(0.55, rgb(mix(cUp, cDown, 0.6))); sg.addColorStop(1, rgb(dk(cDown, 0.35)));
    g.fillStyle = sg; g.fill();
    blob(g, x, y + th * 0.98, rx, ry, 0.06, seed + 3, 20);
    g.fillStyle = sg; g.fill();
    pattyTop(g, x, y, rx, ry, type, up, seed, down);
    // 지글지글 기름 방울
    if (heat) {
      var r = rng(seed * 7 + ((t * 9) | 0));
      for (var i = 0; i < 6; i++) {
        var a = r() * TAU, px = x + Math.cos(a) * rx * (1.02 + r() * 0.12), py = y + th + Math.sin(a) * ry * (1.02 + r() * 0.12);
        g.fillStyle = 'rgba(255,236,180,' + (0.35 + r() * 0.4) + ')';
        g.beginPath(); g.arc(px, py, 1 + r() * 2.4, 0, TAU); g.fill();
      }
    }
  }

  function gauge(g, x, y, w, v, kind, done) {
    var zs = ZONES[kind], h = 11, x0 = x - w / 2, max = 1.7;
    g.save();
    g.fillStyle = 'rgba(0,0,0,.45)'; rrect(g, x0 - 4, y - 4, w + 8, h + 8, 9); g.fill();
    g.save(); rrect(g, x0, y, w, h, 5); g.clip();
    zs.forEach(function (z) { g.fillStyle = z[2]; g.fillRect(x0 + z[0] / max * w, y, (z[1] - z[0]) / max * w + 0.5, h); });
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x0, y, w, 3);
    g.restore();
    var mx = x0 + Math.min(1, v / max) * w;
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(mx, y + h + 1); g.lineTo(mx - 8, y - 9); g.lineTo(mx + 8, y - 9); g.closePath(); g.fill(); g.stroke();
    if (done != null) {                                  // 먼저 익힌 면
      var dc = zs.filter(function (z) { return done >= z[0] && done < z[1]; })[0] || zs[zs.length - 1];
      g.fillStyle = dc[2]; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.arc(x0 - 16, y + h / 2, 7, 0, TAU); g.fill(); g.stroke();
    }
    g.restore();
  }

  // ---------- 그릴 ----------
  function grill(g, b, t, hot) {
    // b: {x,y,w,d,front}
    shadow(g, b.x + b.w / 2 + 10, b.y + b.d + b.front + 10, b.w * 0.56, 22, 0.35);
    // 앞면
    var fg = g.createLinearGradient(0, b.y + b.d, 0, b.y + b.d + b.front);
    fg.addColorStop(0, '#c9ced2'); fg.addColorStop(0.12, '#8d9398'); fg.addColorStop(1, '#3f4449');
    g.fillStyle = fg; rrect(g, b.x, b.y + b.d - 6, b.w, b.front + 6, 8); g.fill();
    // 손잡이
    for (var i = 0; i < 3; i++) {
      var kx = b.x + b.w * (0.22 + i * 0.28), ky = b.y + b.d + b.front * 0.52;
      shadow(g, kx + 3, ky + 6, 20, 8, 0.4);
      var kg = g.createRadialGradient(kx - 6, ky - 6, 1, kx, ky, 18);
      kg.addColorStop(0, '#5a5f66'); kg.addColorStop(1, '#15181b');
      g.fillStyle = kg; g.beginPath(); g.arc(kx, ky, 16, 0, TAU); g.fill();
      g.strokeStyle = '#e44a2f'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + Math.cos(-0.6) * 11, ky + Math.sin(-0.6) * 11); g.stroke();
      g.fillStyle = hot ? '#ff5a2a' : '#553'; g.beginPath(); g.arc(kx, ky - 24, 3, 0, TAU); g.fill();
      if (hot) { g.fillStyle = 'rgba(255,90,40,.35)'; g.beginPath(); g.arc(kx, ky - 24, 7, 0, TAU); g.fill(); }
    }
    // 테두리
    var rg = g.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.d);
    rg.addColorStop(0, '#dfe3e6'); rg.addColorStop(1, '#80868c');
    g.fillStyle = rg; rrect(g, b.x, b.y, b.w, b.d, 10); g.fill();
    // 철판
    var px = b.x + 14, py = b.y + 12, pw = b.w - 28, pd = b.d - 22;
    var pg = g.createLinearGradient(px, py, px + pw, py + pd);
    pg.addColorStop(0, '#3a3c3f'); pg.addColorStop(0.5, '#26282a'); pg.addColorStop(1, '#1a1b1d');
    g.fillStyle = pg; rrect(g, px, py, pw, pd, 6); g.fill();
    g.save(); rrect(g, px, py, pw, pd, 6); g.clip();
    // 달궈진 기운
    if (hot) {
      var hg = g.createRadialGradient(px + pw / 2, py + pd * 0.6, 10, px + pw / 2, py + pd * 0.6, pw * 0.7);
      hg.addColorStop(0, 'rgba(255,110,40,' + (0.10 + 0.03 * Math.sin(t * 2)) + ')'); hg.addColorStop(1, 'rgba(255,110,40,0)');
      g.fillStyle = hg; g.fillRect(px, py, pw, pd);
    }
    // 기름 얼룩·긁힌 자국
    var r = rng(21);
    for (i = 0; i < 18; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(90,70,40,.08)' : 'rgba(0,0,0,.10)';
      g.beginPath(); g.ellipse(px + r() * pw, py + r() * pd, 8 + r() * 30, 4 + r() * 9, 0, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    for (i = 0; i < 30; i++) { var yy = py + r() * pd; g.beginPath(); g.moveTo(px + r() * pw, yy); g.lineTo(px + r() * pw, yy + (r() - 0.5) * 6); g.stroke(); }
    // 위 조명 반사
    var lg = g.createLinearGradient(px, py, px + pw * 0.6, py + pd);
    lg.addColorStop(0, 'rgba(255,255,255,.12)'); lg.addColorStop(0.4, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(px, py, pw, pd);
    g.restore();
    // 기름받이 홈
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(px, py + pd - 5, pw, 4);
  }

  // ---------- 튀김기 ----------
  function fryer(g, b, t, baskets, owned) {
    shadow(g, b.x + b.w / 2 + 8, b.y + b.d + b.front + 8, b.w * 0.56, 20, 0.35);
    var fg = g.createLinearGradient(0, b.y + b.d, 0, b.y + b.d + b.front);
    fg.addColorStop(0, '#cfd3d7'); fg.addColorStop(0.1, '#9aa0a5'); fg.addColorStop(1, '#474c51');
    g.fillStyle = fg; rrect(g, b.x, b.y + b.d - 6, b.w, b.front + 6, 8); g.fill();
    var rg = g.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.d);
    rg.addColorStop(0, '#e4e7ea'); rg.addColorStop(1, '#868c92');
    g.fillStyle = rg; rrect(g, b.x, b.y, b.w, b.d, 10); g.fill();
    if (!owned) { lid(g, b.x + 10, b.y + 10, b.w - 20, b.d - 20); return; }
    var ox = b.x + 16, oy = b.y + 14, ow = b.w - 32, od = b.d - 28;
    g.fillStyle = '#2b2d30'; rrect(g, ox - 4, oy - 4, ow + 8, od + 8, 8); g.fill();
    var og = g.createLinearGradient(0, oy, 0, oy + od);
    og.addColorStop(0, '#6d4312'); og.addColorStop(0.5, '#b9781d'); og.addColorStop(1, '#8a5714');
    g.fillStyle = og; rrect(g, ox, oy, ow, od, 6); g.fill();
    g.save(); rrect(g, ox, oy, ow, od, 6); g.clip();
    // 기름 윤 — 흔들리는 빛 띠
    for (var i = 0; i < 4; i++) {
      var yy = oy + od * (0.15 + i * 0.22) + Math.sin(t * 1.5 + i) * 4;
      var sg = g.createLinearGradient(ox, yy, ox + ow, yy);
      sg.addColorStop(0, 'rgba(255,220,130,0)'); sg.addColorStop(0.5, 'rgba(255,225,140,.22)'); sg.addColorStop(1, 'rgba(255,220,130,0)');
      g.fillStyle = sg; g.fillRect(ox, yy, ow, 5);
    }
    g.restore();
  }
  function basket(g, x, y, w, d, lift, items, c, t, bubbling) {
    // x,y = 기름 속 바구니 윗면 가운데. lift 0 = 잠김, 1 = 들어 올림
    var up = lift * 34, top = y - up;
    g.save();
    if (bubbling) {                                       // 보글보글
      var r = rng(((t * 14) | 0) + x | 0);
      for (var i = 0; i < 26; i++) {
        var bx = x + (r() - 0.5) * w * 1.1, by = y + (r() - 0.5) * d * 1.1, br = 1.5 + r() * 5;
        g.strokeStyle = 'rgba(255,240,190,' + (0.35 + r() * 0.45) + ')'; g.lineWidth = 1.3;
        g.beginPath(); g.arc(bx, by, br, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(255,250,220,.18)'; g.fill();
      }
    }
    // 손잡이 (앞으로)
    g.strokeStyle = '#2b2e31'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, top + d / 2); g.lineTo(x, y + d / 2 + 60 - up * 0.3); g.stroke();
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 12;
    g.beginPath(); g.moveTo(x, y + d / 2 + 44 - up * 0.3); g.lineTo(x, y + d / 2 + 72 - up * 0.3); g.stroke();
    if (lift > 0.02) {
      // 들린 바구니 — 철망 옆면
      shadow(g, x, y, w * 0.6, d * 0.4, 0.3 * lift);
      g.fillStyle = 'rgba(40,40,40,.25)'; g.fillRect(x - w / 2, top, w, up);
      g.strokeStyle = 'rgba(210,214,218,.8)'; g.lineWidth = 1.2;
      for (var k = 0; k <= 10; k++) { var xx = x - w / 2 + (w * k) / 10; g.beginPath(); g.moveTo(xx, top + d / 2); g.lineTo(xx, top + d / 2 + Math.min(up, 60)); g.stroke(); }
      for (k = 0; k <= 4; k++) { var yy2 = top + d / 2 + (Math.min(up, 60) * k) / 4; g.beginPath(); g.moveTo(x - w / 2, yy2); g.lineTo(x + w / 2, yy2); g.stroke(); }
      // 기름 방울
      var rr = rng((t * 8) | 0);
      g.fillStyle = 'rgba(230,170,60,.8)';
      for (k = 0; k < 4; k++) { g.beginPath(); g.arc(x - w / 2 + rr() * w, top + d / 2 + up * 0.9 + rr() * 16, 2, 0, TAU); g.fill(); }
    }
    // 바구니 안
    var bx0 = x - w / 2, by0 = top - d / 2;
    g.fillStyle = lift > 0.02 ? 'rgba(30,30,30,.55)' : 'rgba(60,35,5,.35)';
    rrect(g, bx0, by0, w, d, 5); g.fill();
    g.save(); rrect(g, bx0, by0, w, d, 5); g.clip();
    if (items === 'fries') {
      var r2 = rng(77);
      for (i = 0; i < 30; i++) stick(g, bx0 + 8 + r2() * (w - 16), by0 + 6 + r2() * (d - 12), 26 + r2() * 12, 6, r2() * 1.2 - 0.6, c, 1);
    } else if (items === 'chicken' || items === 'shrimp') {
      grillPatty(g, x, top - 4, w * 0.36, items, c, c, items === 'chicken' ? 41 : 43, 0, t);
    }
    if (lift < 0.98) {                                    // 기름이 덮는다
      g.fillStyle = 'rgba(185,120,30,' + (0.42 * (1 - lift)) + ')'; g.fillRect(bx0, by0, w, d);
    }
    g.restore();
    // 철망 테
    g.strokeStyle = '#c3c8cc'; g.lineWidth = 3; rrect(g, bx0, by0, w, d, 5); g.stroke();
    g.strokeStyle = 'rgba(200,205,210,.35)'; g.lineWidth = 1;
    for (k = 1; k < 8; k++) { g.beginPath(); g.moveTo(bx0 + (w * k) / 8, by0); g.lineTo(bx0 + (w * k) / 8, by0 + d); g.stroke(); }
    g.restore();
  }
  function warmer(g, b, portions, t) {
    steelBox(g, b.x, b.y, b.w, b.d, b.lip, true);
    // 보온등 빛
    var hg = g.createRadialGradient(b.x + b.w / 2, b.y + b.d / 2, 5, b.x + b.w / 2, b.y + b.d / 2, b.w * 0.6);
    hg.addColorStop(0, 'rgba(255,150,60,.35)'); hg.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = hg; g.fillRect(b.x - 20, b.y - 20, b.w + 40, b.d + 40);
    g.save(); rrect(g, b.x + 7, b.y + 6, b.w - 14, b.d - 12, 5); g.clip();
    var r = rng(9), n = Math.min(60, portions.length * 9);
    for (var i = 0; i < n; i++) {
      var q = portions[Math.floor(i / 9)] || 1;
      stick(g, b.x + 16 + r() * (b.w - 32), b.y + b.d - 10 - r() * (b.d - 16) * Math.min(1, 0.3 + portions.length * 0.15), 26 + r() * 10, 6, r() * 1.4 - 0.7, q, 1);
    }
    g.restore();
  }
  function carton(g, x, y, s, c) {
    // 빨간 종이 감자튀김 통
    shadow(g, x + 4, y + 4, 34 * s, 10 * s, 0.35);
    var r = rng(5);
    for (var i = 0; i < 14; i++) {
      var fx = x + (r() - 0.5) * 44 * s, fy = y - 60 * s - r() * 26 * s;
      g.save(); g.translate(fx, fy); g.rotate((fx - x) / (60 * s) * 0.5);
      var col = ramp(FRY, c);
      var gr = g.createLinearGradient(-4 * s, 0, 4 * s, 0);
      gr.addColorStop(0, rgb(dk(col, 0.25))); gr.addColorStop(0.4, rgb(lt(col, 0.2))); gr.addColorStop(1, rgb(dk(col, 0.2)));
      g.fillStyle = gr; rrect(g, -4 * s, -18 * s, 8 * s, 50 * s, 2 * s); g.fill();
      g.restore();
    }
    g.beginPath();
    g.moveTo(x - 30 * s, y - 62 * s); g.quadraticCurveTo(x, y - 48 * s, x + 30 * s, y - 62 * s);
    g.lineTo(x + 22 * s, y); g.lineTo(x - 22 * s, y); g.closePath();
    var cg = g.createLinearGradient(x - 30 * s, 0, x + 30 * s, 0);
    cg.addColorStop(0, '#9b1f16'); cg.addColorStop(0.35, '#e2412c'); cg.addColorStop(1, '#8a1b13');
    g.fillStyle = cg; g.fill();
    g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x, y - 30 * s, 9 * s, 0, TAU); g.fill();
    g.fillStyle = '#e2412c'; g.beginPath(); g.arc(x, y - 30 * s, 4.5 * s, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - 18 * s, y - 56 * s, 4 * s, 50 * s);
  }

  // ---------- 토핑 통 ----------
  var TOP_IC = {};
  function pan(g, b, kind, on) {
    steelBox(g, b.x, b.y, b.w, b.d, b.lip, !on);
    if (!on) return;
    g.save(); rrect(g, b.x + 7, b.y + 6, b.w - 14, b.d - 12, 5); g.clip();
    var cx = b.x + b.w / 2, cy = b.y + b.d / 2, R = b.w * 0.24, i, r = rng(kind.length * 13 + 1);
    var spots = [[-0.9, -0.25], [0, -0.35], [0.9, -0.2], [-0.5, 0.3], [0.5, 0.35]];
    for (i = 0; i < spots.length; i++) {
      var px = cx + spots[i][0] * R * 1.3, py = cy + spots[i][1] * R * 1.1;
      topView(g, kind, px, py, R, i + 1, r);
    }
    g.restore();
  }
  // 통 안에 담긴 모습 (위에서)
  function topView(g, kind, x, y, R, s, r) {
    var ry = R * SQ * 1.4;
    g.save();
    if (kind === 'cheese') {
      g.translate(x, y); g.scale(1, 0.62); g.rotate(0.3 + s * 0.5);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-R * 0.8 + 3, -R * 0.8 + 4, R * 1.6, R * 1.6);
      var cg = g.createLinearGradient(-R, -R, R, R); cg.addColorStop(0, '#ffd46a'); cg.addColorStop(1, '#f0a42a');
      g.fillStyle = cg; g.fillRect(-R * 0.8, -R * 0.8, R * 1.6, R * 1.6);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-R * 0.8, -R * 0.8, R * 1.6, 3);
    } else if (kind === 'lettuce') {
      leafTop(g, x, y, R * 1.05, ry * 1.05, s);
    } else if (kind === 'tomato') {
      tomatoSlice(g, x, y, R * 0.85, ry * 0.85, s);
    } else if (kind === 'onion') {
      onionRing(g, x, y, R * 0.8, ry * 0.8);
    } else if (kind === 'pickle') {
      pickleDisc(g, x, y, R * 0.55, ry * 0.55, s);
    } else if (kind === 'bacon') {
      baconStrip(g, x - R * 0.9, y, R * 1.8, R * 0.34, s);
    } else if (kind === 'egg') {
      eggTop(g, x, y, R * 0.95, ry * 0.95, s);
    } else if (kind === 'jalapeno') {
      jalRing(g, x, y, R * 0.45, ry * 0.45);
    } else if (kind === 'avocado') {
      avoSlice(g, x, y, R * 0.9, R * 0.36, s * 0.7);
    }
    g.restore();
  }
  function leafTop(g, x, y, rx, ry, s) {
    blob(g, x, y, rx, ry, 0.16, s * 5 + 2, 26);
    var gr = g.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 2, x, y, rx);
    gr.addColorStop(0, '#d7f28d'); gr.addColorStop(0.6, '#8fcf45'); gr.addColorStop(1, '#4e9a2a');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(40,90,20,.45)'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(240,255,210,.7)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x - rx * 0.7, y + ry * 0.2); g.quadraticCurveTo(x, y - ry * 0.2, x + rx * 0.7, y + ry * 0.1); g.stroke();
    g.lineWidth = 1;
    for (var k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * rx * 0.25, y); g.lineTo(x + k * rx * 0.32, y - ry * 0.6); g.stroke(); }
  }
  function tomatoSlice(g, x, y, rx, ry, s) {
    ell(g, x, y, rx, ry); g.fillStyle = '#b5261b'; g.fill();
    ell(g, x, y, rx * 0.88, ry * 0.86);
    var gr = g.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, rx);
    gr.addColorStop(0, '#ff7b5e'); gr.addColorStop(1, '#df3a26'); g.fillStyle = gr; g.fill();
    for (var k = 0; k < 4; k++) {
      var a = k * TAU / 4 + s, px = x + Math.cos(a) * rx * 0.48, py = y + Math.sin(a) * ry * 0.48;
      g.fillStyle = 'rgba(255,200,150,.65)'; ell(g, px, py, rx * 0.22, ry * 0.2); g.fill();
      g.fillStyle = '#f7e2a0';
      for (var j = 0; j < 3; j++) { ell(g, px + (j - 1) * rx * 0.07, py + (j % 2) * 2, 1.6, 1.1); g.fill(); }
    }
    g.fillStyle = '#ffb49a'; ell(g, x, y, rx * 0.14, ry * 0.14); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, x - rx * 0.45, y - ry * 0.5, rx * 0.2, ry * 0.12); g.fill();
  }
  function onionRing(g, x, y, rx, ry) {
    g.lineWidth = Math.max(1.5, rx * 0.12);
    for (var k = 0; k < 3; k++) {
      g.strokeStyle = k === 0 ? '#b77fb9' : 'rgba(245,235,245,.95)';
      ell(g, x + k * 1.5, y, rx * (1 - k * 0.24), ry * (1 - k * 0.24)); g.stroke();
    }
    g.strokeStyle = 'rgba(170,110,175,.6)'; g.lineWidth = 1; ell(g, x, y, rx * 1.05, ry * 1.05); g.stroke();
  }
  function pickleDisc(g, x, y, rx, ry, s) {
    blob(g, x, y, rx, ry, 0.08, s * 3 + 1, 14);
    g.fillStyle = '#4f7a24'; g.fill();
    ell(g, x, y, rx * 0.8, ry * 0.8);
    var gr = g.createRadialGradient(x - rx * 0.2, y - ry * 0.2, 1, x, y, rx);
    gr.addColorStop(0, '#d4e27a'); gr.addColorStop(1, '#8aab3a'); g.fillStyle = gr; g.fill();
    g.fillStyle = 'rgba(250,250,210,.8)';
    for (var k = 0; k < 5; k++) { var a = k * TAU / 5 + s; ell(g, x + Math.cos(a) * rx * 0.42, y + Math.sin(a) * ry * 0.42, 1.8, 1.2); g.fill(); }
  }
  function baconStrip(g, x, y, len, w, s) {
    g.save(); g.translate(x, y);
    var path = function (off) {
      g.beginPath();
      for (var i = 0; i <= 16; i++) { var px = (len * i) / 16, py = Math.sin(i * 0.9 + s) * w * 0.35 + off; if (!i) g.moveTo(px, py); else g.lineTo(px, py); }
    };
    g.lineCap = 'round';
    path(3); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = w; g.stroke();
    path(0); g.strokeStyle = '#8d2e1c'; g.lineWidth = w; g.stroke();
    path(0); g.strokeStyle = '#c34a2e'; g.lineWidth = w * 0.72; g.stroke();
    path(-w * 0.12); g.strokeStyle = '#f2c7a0'; g.lineWidth = w * 0.16; g.stroke();
    path(w * 0.22); g.strokeStyle = 'rgba(240,190,150,.8)'; g.lineWidth = w * 0.08; g.stroke();
    g.restore();
  }
  function eggTop(g, x, y, rx, ry, s) {
    blob(g, x, y, rx, ry, 0.13, s * 7 + 4, 16);
    var gr = g.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, rx);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.8, '#f4efe4'); gr.addColorStop(1, '#d9b98c');
    g.fillStyle = gr; g.fill();
    var yx = x + rx * 0.1, yy = y - ry * 0.05;
    ell(g, yx + 2, yy + 3, rx * 0.36, ry * 0.4); g.fillStyle = 'rgba(160,100,20,.25)'; g.fill();
    ell(g, yx, yy, rx * 0.34, ry * 0.4);
    var yg = g.createRadialGradient(yx - rx * 0.12, yy - ry * 0.15, 1, yx, yy, rx * 0.36);
    yg.addColorStop(0, '#ffe07a'); yg.addColorStop(0.6, '#ffb21e'); yg.addColorStop(1, '#e8860f');
    g.fillStyle = yg; g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, yx - rx * 0.12, yy - ry * 0.16, rx * 0.08, ry * 0.07); g.fill();
  }
  function jalRing(g, x, y, rx, ry) {
    ell(g, x, y, rx, ry); g.fillStyle = '#2f6d1f'; g.fill();
    ell(g, x, y, rx * 0.72, ry * 0.72); g.fillStyle = '#c9e39a'; g.fill();
    g.fillStyle = '#f6f2d0';
    for (var k = 0; k < 4; k++) { var a = k * TAU / 4; ell(g, x + Math.cos(a) * rx * 0.35, y + Math.sin(a) * ry * 0.35, 1.8, 1.4); g.fill(); }
  }
  function avoSlice(g, x, y, len, w, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath(); g.moveTo(-len / 2, 0); g.quadraticCurveTo(0, -w * 1.2, len / 2, 0); g.quadraticCurveTo(0, w * 0.9, -len / 2, 0);
    g.fillStyle = '#3e5a1a'; g.fill();
    g.beginPath(); g.moveTo(-len / 2 + 4, 0); g.quadraticCurveTo(0, -w * 0.95, len / 2 - 4, 0); g.quadraticCurveTo(0, w * 0.6, -len / 2 + 4, 0);
    var gr = g.createLinearGradient(0, -w, 0, w); gr.addColorStop(0, '#e9f0a0'); gr.addColorStop(1, '#9cc24a');
    g.fillStyle = gr; g.fill();
    g.restore();
  }

  // ---------- 소스 병 ----------
  var SAUCE = {
    ketchup: { c: '#d8261b', cap: '#b81c12' }, mustard: { c: '#f2c21d', cap: '#d9a50f' },
    mayo: { c: '#f6f1df', cap: '#e8e2cc' }, bulgogi: { c: '#5a2e17', cap: '#3d1f10' },
    sriracha: { c: '#e2482a', cap: '#2f8a3a' }
  };
  function bottle(g, x, y, h, kind, on, press) {
    var sc = SAUCE[kind], c = hx(sc.c), w = h * 0.36;
    g.save();
    if (!on) g.globalAlpha = 0.28;
    shadow(g, x + 5, y + 2, w * 0.8, w * 0.25, 0.4);
    var sq = press ? 1 - 0.1 * press : 1;
    g.translate(x, y); g.scale(1 / sq * 0.98 + 0.02, sq);
    var body = function () {
      g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h * 0.62);
      g.quadraticCurveTo(-w / 2, -h * 0.75, -w * 0.25, -h * 0.78); g.lineTo(w * 0.25, -h * 0.78);
      g.quadraticCurveTo(w / 2, -h * 0.75, w / 2, -h * 0.62); g.lineTo(w / 2, 0);
      g.quadraticCurveTo(0, w * 0.18, -w / 2, 0); g.closePath();
    };
    body(); g.fillStyle = sideGrad(g, 0, w / 2, c, kind === 'mayo' ? 0.1 : 0.25, kind === 'mayo' ? 0.25 : 0.45); g.fill();
    // 뚜껑·꼭지
    var cc = hx(sc.cap);
    g.fillStyle = sideGrad(g, 0, w * 0.3, cc, 0.3, 0.4);
    rrect(g, -w * 0.3, -h * 0.86, w * 0.6, h * 0.1, 3); g.fill();
    g.beginPath(); g.moveTo(-w * 0.12, -h * 0.86); g.lineTo(-w * 0.04, -h); g.lineTo(w * 0.04, -h); g.lineTo(w * 0.12, -h * 0.86); g.closePath(); g.fill();
    // 이름표 띠
    g.fillStyle = 'rgba(255,255,255,.85)'; rrect(g, -w / 2 + 3, -h * 0.45, w - 6, h * 0.16, 3); g.fill();
    g.fillStyle = rgb(dk(c, kind === 'mayo' ? 0.4 : 0.05)); rrect(g, -w / 2 + 8, -h * 0.4, w - 16, h * 0.06, 2); g.fill();
    // 윤
    g.fillStyle = 'rgba(255,255,255,.45)'; rrect(g, -w * 0.33, -h * 0.72, w * 0.1, h * 0.6, w * 0.05); g.fill();
    g.restore();
  }

  // ---------- 빵 바구니·쓰레기통·도마 ----------
  function bunBasket(g, b, n) {
    var x = b.x, y = b.y, w = b.w, d = b.d;
    shadow(g, x + w / 2 + 6, y + d + 14, w * 0.56, 14, 0.35);
    // 바구니 앞면 (엮은 결)
    var fy = y + d * 0.45, fh = d * 0.62;
    var bg = g.createLinearGradient(0, fy, 0, fy + fh);
    bg.addColorStop(0, '#b77a3c'); bg.addColorStop(1, '#6d4219');
    g.fillStyle = '#5a3514'; rrect(g, x, y, w, d * 0.6, 14); g.fill();
    // 빵
    for (var i = 0; i < 4; i++) {
      var bx = x + w * (0.2 + i * 0.2), by = y + d * 0.32 + (i % 2) * 6;
      bunDome(g, bx, by + 12, w * 0.12, w * 0.12 * SQ, w * 0.1, i + 1);
    }
    g.beginPath(); g.moveTo(x - 4, fy); g.lineTo(x + w + 4, fy); g.lineTo(x + w - 10, fy + fh); g.lineTo(x + 10, fy + fh); g.closePath();
    g.fillStyle = bg; g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(60,30,8,.55)'; g.lineWidth = 2;
    for (var k = 0; k < 6; k++) { var yy = fy + (fh * k) / 6; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
    for (k = 0; k < 14; k++) {
      var xx = x + (w * k) / 14;
      for (var j = 0; j < 6; j++) {
        g.fillStyle = (k + j) % 2 ? 'rgba(255,220,160,.22)' : 'rgba(40,20,5,.2)';
        g.fillRect(xx + 2, fy + (fh * j) / 6 + 2, w / 14 - 4, fh / 6 - 4);
      }
    }
    g.restore();
    g.fillStyle = '#d9a25e'; rrect(g, x - 6, fy - 6, w + 12, 12, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, fy - 4, w, 2);
  }
  function trash(g, b, open) {
    var x = b.x, y = b.y, w = b.w, h = b.h;
    shadow(g, x + w / 2 + 4, y + h, w * 0.62, 10, 0.4);
    g.fillStyle = sideGrad(g, x + w / 2, w / 2, hx('#9aa0a6'), 0.3, 0.45);
    g.beginPath(); g.moveTo(x, y + 14); g.lineTo(x + 5, y + h); g.lineTo(x + w - 5, y + h); g.lineTo(x + w, y + 14); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2;
    for (var k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + (w * k) / 4, y + 22); g.lineTo(x + (w * k) / 4, y + h - 8); g.stroke(); }
    g.save(); g.translate(x + w, y + 14); g.rotate(open ? -0.7 : 0);
    g.fillStyle = sideGrad(g, -w / 2, w / 2, hx('#b6bcc1'), 0.35, 0.4);
    rrect(g, -w - 3, -12, w + 6, 14, 5); g.fill();
    g.fillStyle = '#5c6268'; rrect(g, -w / 2 - 9, -18, 18, 7, 3); g.fill();
    g.restore();
  }
  function board(g, cx, cy, rx, ry) {
    shadow(g, cx + 10, cy + 26, rx * 1.08, ry * 1.1, 0.45);
    var wood = hx('#b27a45');
    cylSide(g, cx, cy, rx, ry, 18);
    g.fillStyle = sideGrad(g, cx, rx, dk(wood, 0.2), 0.12, 0.4); g.fill();
    // 손잡이
    g.fillStyle = rgb(dk(wood, 0.15));
    rrect(g, cx + rx * 0.9, cy - 12, rx * 0.34, 26, 12); g.fill();
    g.fillStyle = 'rgba(40,20,5,.5)'; g.beginPath(); g.arc(cx + rx * 1.12, cy + 1, 5, 0, TAU); g.fill();
    ell(g, cx, cy, rx, ry);
    var tg = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    tg.addColorStop(0, rgb(lt(wood, 0.22))); tg.addColorStop(1, rgb(dk(wood, 0.12)));
    g.fillStyle = tg; g.fill();
    g.save(); ell(g, cx, cy, rx, ry); g.clip();
    var r = rng(8); g.strokeStyle = 'rgba(90,50,20,.22)'; g.lineWidth = 1.4;
    for (var i = 0; i < 16; i++) {
      var yy = cy - ry + (ry * 2 * i) / 16 + r() * 4;
      g.beginPath(); g.moveTo(cx - rx, yy); g.bezierCurveTo(cx - rx * 0.3, yy + r() * 8 - 4, cx + rx * 0.3, yy + r() * 8 - 4, cx + rx, yy); g.stroke();
    }
    g.strokeStyle = 'rgba(255,240,210,.18)'; g.lineWidth = 2; ell(g, cx - 2, cy - 2, rx - 4, ry - 3); g.stroke();
    g.restore();
  }

  // ---------- 버거 층 ----------
  // 각 층의 두께 (반지름 R 기준 비율)
  var TH = { bun_b: 0.32, beef: 0.3, chicken: 0.32, shrimp: 0.3, cheese: 0.05, lettuce: 0.12, tomato: 0.12,
    onion: 0.07, pickle: 0.06, bacon: 0.09, egg: 0.1, jalapeno: 0.06, avocado: 0.1,
    ketchup: 0.03, mustard: 0.03, mayo: 0.03, bulgogi: 0.03, sriracha: 0.03, bun_t: 0.72 };
  function layerTh(k, R) { return (TH[k] || 0.08) * R; }

  function bunDome(g, x, y, rx, ry, hgt, seed) {
    // 윗빵 — 바닥 타원 y 에서 돔이 솟는다
    var top = y - hgt;
    g.beginPath(); g.moveTo(x - rx, y);
    g.bezierCurveTo(x - rx * 1.02, top - ry * 0.2, x - rx * 0.55, top - ry * 0.9, x, top - ry * 0.9);
    g.bezierCurveTo(x + rx * 0.55, top - ry * 0.9, x + rx * 1.02, top - ry * 0.2, x + rx, y);
    g.ellipse(x, y, rx, ry, 0, 0, PI, false);
    g.closePath();
    var gr = g.createRadialGradient(x - rx * 0.35, top + ry * 0.1, rx * 0.05, x, y - hgt * 0.3, rx * 1.25);
    gr.addColorStop(0, '#f7c77a'); gr.addColorStop(0.35, '#e39a45'); gr.addColorStop(0.75, '#b8662a'); gr.addColorStop(1, '#7c4217');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    // 아래 연한 띠 (빵 속결 테)
    g.fillStyle = 'rgba(245,215,160,.55)';
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, PI, false); g.lineTo(x - rx, y - ry * 0.25); g.ellipse(x, y - ry * 0.25, rx, ry, 0, PI, 0, true); g.closePath(); g.fill();
    // 참깨 — 돔 위에 고르게 흩는다 (가까이 붙은 것은 버린다)
    var r = rng(seed * 11 + 5), seeds = [], want = Math.max(6, Math.round(rx * 0.2)), tries = 0;
    while (seeds.length < want && tries++ < 400) {
      var u = r() * 1.64 - 0.82, v = 0.12 + r() * 0.8;
      var dome = Math.sqrt(Math.max(0, 1 - u * u));
      var sx = x + u * rx * 0.9, sy = y - ry * 0.2 - (hgt + ry * 0.7) * dome * v;
      if (sy > y - ry * 0.35) continue;
      var ok = true;
      for (var q = 0; q < seeds.length; q++) if (Math.hypot(seeds[q][0] - sx, (seeds[q][1] - sy) * 1.3) < rx * 0.2) { ok = false; break; }
      if (ok) seeds.push([sx, sy, u * 0.8 + (r() - 0.5) * 1.2, 0.55 + dome * 0.45]);
    }
    seeds.forEach(function (sd) {
      g.save(); g.translate(sd[0], sd[1]); g.rotate(sd[2]); g.scale(1, sd[3]);
      g.fillStyle = 'rgba(90,45,10,.28)'; ell(g, 1, 2, rx * 0.055, rx * 0.03); g.fill();
      var sg2 = g.createLinearGradient(0, -rx * 0.03, 0, rx * 0.03);
      sg2.addColorStop(0, '#fffaf0'); sg2.addColorStop(1, '#e6d2a6');
      g.fillStyle = sg2; ell(g, 0, 0, rx * 0.055, rx * 0.03); g.fill();
      g.restore();
    });
    // 윤광
    var sh = g.createRadialGradient(x - rx * 0.4, top - ry * 0.3, 0, x - rx * 0.4, top - ry * 0.3, rx * 0.55);
    sh.addColorStop(0, 'rgba(255,250,230,.55)'); sh.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = sh; g.fillRect(x - rx, top - ry, rx * 2, hgt + ry * 2);
    g.restore();
  }

  // L = {k, s:[a,b] 익힘, n: 소스 짠 횟수, melt}. y = 이 층의 바닥(옆면 아래 선). 두께를 돌려준다
  function layer(g, L, x, y, R, t, below) {
    var k = L.k, th = layerTh(k, R), ry = R * SQS, top = y - th, i, r;
    switch (k) {
      case 'bun_b': {
        cylSide(g, x, top, R * 0.98, ry * 0.98, th);
        var bg = g.createLinearGradient(0, top, 0, y + ry);
        bg.addColorStop(0, '#f1c98a'); bg.addColorStop(0.5, '#d98c3e'); bg.addColorStop(1, '#8c4f1c');
        g.fillStyle = bg; g.fill();
        g.fillStyle = sideGrad(g, x, R, [0, 0, 0], 0, 0); g.globalAlpha = 0.18; g.fill(); g.globalAlpha = 1;
        ell(g, x, top, R * 0.98, ry * 0.98);
        var cg = g.createRadialGradient(x - R * 0.3, top - ry * 0.3, 2, x, top, R);
        cg.addColorStop(0, '#fbe7c0'); cg.addColorStop(1, '#e8bf80'); g.fillStyle = cg; g.fill();
        r = rng(19); g.fillStyle = 'rgba(180,130,70,.35)';
        for (i = 0; i < 40; i++) { var a = r() * TAU, d = Math.sqrt(r()) * 0.9; ell(g, x + Math.cos(a) * R * d, top + Math.sin(a) * ry * d, 1.5 + r() * 2, 1 + r()); g.fill(); }
        break;
      }
      case 'beef': case 'chicken': case 'shrimp': {
        var seed = k === 'beef' ? 3 : k === 'chicken' ? 41 : 43;
        var c = L.s ? Math.max(L.s[0], L.s[1]) : 1, c2 = L.s ? Math.min(L.s[0], L.s[1]) : 1;
        var col = k === 'beef' ? ramp(BEEF, c) : ramp(CRUMB, c), col2 = k === 'beef' ? ramp(BEEF, c2) : ramp(CRUMB, c2);
        var prx = R * (k === 'beef' ? 1.04 : 1.02);
        blob(g, x, y, prx, ry * 1.04, 0.05, seed, 22);
        g.fillStyle = rgb(dk(col2, 0.3)); g.fill();
        g.beginPath(); g.rect(x - prx, top, prx * 2, th);
        var pg = g.createLinearGradient(x - prx, 0, x + prx, 0);
        pg.addColorStop(0, rgb(dk(col2, 0.45))); pg.addColorStop(0.3, rgb(lt(col, 0.05))); pg.addColorStop(0.6, rgb(col)); pg.addColorStop(1, rgb(dk(col2, 0.5)));
        g.fillStyle = pg; g.fill();
        blob(g, x, y, prx, ry * 1.04, 0.05, seed, 22); g.fillStyle = pg; g.fill();
        // 옆면 결 — 울퉁불퉁
        r = rng(seed + 100);
        g.save(); g.beginPath(); g.rect(x - prx, top, prx * 2, th + ry); g.clip();
        for (i = 0; i < 60; i++) {
          var sx = x + (r() * 2 - 1) * prx * 0.98, syy = top + r() * (th + ry * Math.sqrt(1 - Math.pow((sx - x) / prx, 2)) * 0.9);
          g.fillStyle = r() > 0.55 ? rgb(lt(col, 0.2), 0.5) : rgb(dk(col, 0.4), 0.5);
          ell(g, sx, syy, 1.5 + r() * 2.5, 1 + r() * 1.5); g.fill();
        }
        g.restore();
        pattyTop(g, x, top, prx, ry * 1.04, k, c, seed, 1);
        // 육즙
        if (k === 'beef') {
          g.fillStyle = 'rgba(120,50,20,.5)';
          r = rng(seed + 7);
          for (i = 0; i < 4; i++) { var dx = x + (r() * 1.6 - 0.8) * prx; ell(g, dx, y + ry * 0.7 + r() * 3, 3 + r() * 3, 2 + r() * 2); g.fill(); }
        }
        break;
      }
      case 'cheese': {
        var melt = L.melt == null ? 1 : L.melt, hot = below && (below === 'beef' || below === 'chicken' || below === 'shrimp');
        var m = hot ? melt : 0.15;
        var S2 = R * 1.02;
        g.save();
        // 네모 치즈를 45도 돌려 올린다 — 왼쪽·오른쪽·앞 모서리가 둥글게 늘어진다
        var dl = (8 + 30 * m) * (R / 110);
        var tongue = function (cx2, cy2, w2, len) {
          var tr = w2 * 0.32;
          g.beginPath(); g.moveTo(cx2 - w2 * 1.6, cy2 - 2);
          g.bezierCurveTo(cx2 - w2 * 0.8, cy2, cx2 - w2 * 0.4, cy2 + len * 0.4, cx2 - tr, cy2 + len - tr);
          g.arc(cx2, cy2 + len - tr, tr, PI, 0, true);
          g.bezierCurveTo(cx2 + w2 * 0.4, cy2 + len * 0.4, cx2 + w2 * 0.8, cy2, cx2 + w2 * 1.6, cy2 - 2);
          g.closePath();
        };
        var chg = g.createLinearGradient(0, top, 0, top + ry + dl * 1.4);
        chg.addColorStop(0, '#ffd04f'); chg.addColorStop(0.5, '#fbb632'); chg.addColorStop(1, '#e9950f');
        // 앞 가장자리 얇은 띠 — 한 장으로 이어져 보이게
        g.beginPath();
        for (i = 0; i <= 30; i++) { var an = PI * (1 - i / 30); g.lineTo(x - Math.cos(an) * S2 * 1.0, top + Math.sin(an) * ry * 1.0 - 1); }
        for (i = 30; i >= 0; i--) { var an3 = PI * (1 - i / 30); g.lineTo(x - Math.cos(an3) * S2 * 1.0, top + Math.sin(an3) * ry * 1.0 + 3 + 3 * m * Math.sin(an3)); }
        g.closePath(); g.fillStyle = chg; g.fill();
        g.fillStyle = chg; g.strokeStyle = 'rgba(190,110,10,.35)'; g.lineWidth = 1;
        tongue(x - S2 * 0.86, top + ry * 0.5, R * 0.1, dl * 0.75); g.fill(); g.stroke();
        tongue(x + S2 * 0.8, top + ry * 0.55, R * 0.09, dl * 0.65); g.fill(); g.stroke();
        tongue(x - R * 0.08, top + ry * 0.98, R * 0.14, dl * 1.15); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,235,.5)';
        ell(g, x - R * 0.12, top + ry * 0.98 + dl * 0.45, R * 0.022, dl * 0.2); g.fill();
        ell(g, x - S2 * 0.89, top + ry * 0.5 + dl * 0.3, R * 0.016, dl * 0.13); g.fill();
        // 윗면 — 모서리를 둥글린 마름모
        var pts = [[x, top - ry * 1.02], [x + S2 * 1.0, top + ry * 0.02], [x - R * 0.04, top + ry * 1.0], [x - S2 * 1.0, top + ry * 0.02]];
        g.beginPath();
        for (i = 0; i < 4; i++) {
          var p0 = pts[i], p1 = pts[(i + 1) % 4], mx2 = (p0[0] + p1[0]) / 2, my2 = (p0[1] + p1[1]) / 2;
          if (i === 0) g.moveTo(mx2, my2);
          var p2 = pts[(i + 2) % 4], nx = (p1[0] + p2[0]) / 2, ny = (p1[1] + p2[1]) / 2;
          g.quadraticCurveTo(p1[0], p1[1], nx, ny);
        }
        g.closePath();
        var tg = g.createLinearGradient(x - S2, top - ry, x + S2, top + ry);
        tg.addColorStop(0, '#ffe27e'); tg.addColorStop(0.55, '#ffc53d'); tg.addColorStop(1, '#ee9f22');
        g.fillStyle = tg; g.fill();
        g.fillStyle = 'rgba(255,255,240,' + (0.22 + m * 0.2) + ')';
        ell(g, x - S2 * 0.3, top - ry * 0.3, S2 * 0.26, ry * 0.12); g.fill();
        g.restore();
        break;
      }
      case 'lettuce': {
        var lr = R * 1.14;
        r = rng(55);
        // 주름진 옆자락
        g.beginPath();
        for (i = 0; i <= 40; i++) {
          var aa = PI * (i / 40), px = x - Math.cos(aa) * lr;
          var py = top + Math.sin(aa) * ry * 1.12 + th * 0.4 + Math.sin(i * 1.9) * th * 0.55 + (r() - 0.5) * 3;
          if (!i) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.lineTo(x + lr, top); g.lineTo(x - lr, top); g.closePath();
        var lg = g.createLinearGradient(0, top, 0, top + ry + th * 1.2);
        lg.addColorStop(0, '#9ad64e'); lg.addColorStop(1, '#3f8a22');
        g.fillStyle = lg; g.fill();
        g.strokeStyle = 'rgba(220,250,170,.35)'; g.lineWidth = 1.2;
        g.beginPath();
        for (i = 0; i <= 30; i++) { var ax = PI * (i / 30); g.lineTo(x - Math.cos(ax) * lr * 0.97, top + Math.sin(ax) * ry * 1.05 + th * 0.35); }
        g.stroke();
        leafTop(g, x, top, lr, ry * 1.12, 3);
        break;
      }
      case 'tomato': {
        var ts = [[-0.42, 0.05], [0.42, -0.05], [0, 0.18]];
        ts.forEach(function (p, j) {
          var tx = x + p[0] * R, ty = top + p[1] * ry, trx = R * 0.62, tr = ry * 0.62;
          cylSide(g, tx, ty, trx, tr, th);
          g.fillStyle = sideGrad(g, tx, trx, hx('#c4301f'), 0.2, 0.4); g.fill();
          tomatoSlice(g, tx, ty, trx, tr, j);
        });
        break;
      }
      case 'onion': {
        var os = [[-0.45, 0], [0.4, 0.05], [0, -0.15], [0.05, 0.25]];
        os.forEach(function (p) {
          var ox = x + p[0] * R, oy = top + p[1] * ry;
          g.strokeStyle = 'rgba(120,70,120,.5)'; g.lineWidth = R * 0.07; ell(g, ox, oy + th * 0.5, R * 0.45, ry * 0.45); g.stroke();
          onionRing(g, ox, oy, R * 0.45, ry * 0.45);
        });
        break;
      }
      case 'pickle': {
        var ps = [[-0.5, 0], [0.5, 0], [0, -0.4], [0, 0.4]];
        ps.forEach(function (p, j) {
          var px2 = x + p[0] * R * 0.9, py2 = top + p[1] * ry;
          cylSide(g, px2, py2, R * 0.33, ry * 0.33, th);
          g.fillStyle = '#3f6a1c'; g.fill();
          pickleDisc(g, px2, py2, R * 0.33, ry * 0.33, j);
        });
        break;
      }
      case 'bacon': {
        baconStrip(g, x - R * 1.1, top + ry * 0.05, R * 2.2, th * 1.3, 1);
        baconStrip(g, x - R * 1.05, top - ry * 0.35, R * 2.1, th * 1.3, 2.4);
        break;
      }
      case 'egg': {
        g.fillStyle = '#e6d6b8';
        blob(g, x, top + th, R * 1.1, ry * 1.1, 0.12, 77, 16); g.fill();
        eggTop(g, x, top, R * 1.1, ry * 1.1, 11);
        break;
      }
      case 'jalapeno': {
        for (i = 0; i < 6; i++) {
          var ja = i * TAU / 6 + 0.3;
          jalRing(g, x + Math.cos(ja) * R * 0.52, top + Math.sin(ja) * ry * 0.52, R * 0.26, ry * 0.26);
        }
        jalRing(g, x, top, R * 0.26, ry * 0.26);
        break;
      }
      case 'avocado': {
        for (i = 0; i < 5; i++) avoSlice(g, x - R * 0.7 + i * R * 0.35, top + (i % 2 ? 4 : -4) * R / 110, R * 0.95, R * 0.24, 1.0 + i * 0.05);
        break;
      }
      case 'ketchup': case 'mustard': case 'mayo': case 'bulgogi': case 'sriracha': {
        sauceSquiggle(g, x, top + th, R, k, L.n || 1, L.draw == null ? 1 : L.draw);
        break;
      }
      case 'bun_t': {
        bunDome(g, x, y, R * 1.0, ry, th, 2);
        break;
      }
    }
    return th;
  }
  function sauceSquiggle(g, x, y, R, kind, n, draw) {
    var col = hx(SAUCE[kind].c), ry = R * SQS;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    for (var pass = 0; pass < Math.min(3, n); pass++) {
      var pts = [], steps = 44, off = pass * 0.9;
      for (var i = 0; i <= steps * draw; i++) {
        var u = i / steps, px = x + (u * 2 - 1) * R * 0.78;
        var py = y + Math.sin(u * PI * 7 + off) * ry * 0.32 * Math.sqrt(1 - Math.pow(u * 2 - 1, 2)) + (pass - 0.5) * ry * 0.3;
        pts.push([px, py]);
      }
      if (pts.length < 2) continue;
      var line = function () { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var j = 1; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]); };
      line(); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = R * 0.06; g.translate(0, 2); g.stroke(); g.translate(0, -2);
      line(); g.strokeStyle = rgb(dk(col, 0.12)); g.lineWidth = R * 0.058; g.stroke();
      line(); g.strokeStyle = rgb(col); g.lineWidth = R * 0.04; g.stroke();
      line(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = R * 0.012; g.translate(-1, -1.5); g.stroke(); g.translate(1, 1.5);
    }
    g.restore();
  }
  // 층 목록 전체
  function stack(g, layers, x, y, R, t) {
    var yy = y;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      if (L.fly != null && L.fly < 1) { L._y = yy; yy -= layerTh(L.k, R); continue; }
      if (L.lift) yy -= L.lift * R;                       // 도감: 윗빵을 살짝 들어 속을 보인다
      var sq = L.land ? 1 - 0.18 * Math.sin(Math.min(1, L.land) * PI) : 1;
      L._y = yy;
      g.save();
      if (sq !== 1) { g.translate(x, yy); g.scale(1 + (1 - sq) * 0.6, sq); g.translate(-x, -yy); }
      yy -= layer(g, L, x, yy, R, t, i > 0 ? layers[i - 1].k : null);
      g.restore();
    }
    return yy;
  }

  // ---------- 손님 얼굴 ----------
  var SKIN = ['#f6d3b3', '#e9b88f', '#c98e62', '#8e5a3b'];
  var HAIR = ['#2a1d16', '#5a3a22', '#b0733c', '#1d1d24', '#c9a15a', '#7a2f24', '#9aa0a6'];
  var SHIRT = ['#e2574c', '#3f7fd1', '#f0b43a', '#4fae7b', '#8f5cc9', '#ef8aa8', '#3b3f4a', '#f2f0ea'];
  function face(g, cx, cy, r, cu, mood, t) {
    // cu = {skin,hair,style,shirt,glasses,kid}
    var skin = hx(SKIN[cu.skin]), hair = hx(HAIR[cu.hair]), shirt = hx(SHIRT[cu.shirt]);
    g.save();
    // 어깨·옷
    var sy = cy + r * 0.95;
    g.beginPath(); g.moveTo(cx - r * 1.15, cy + r * 1.9); g.quadraticCurveTo(cx - r * 1.1, sy - r * 0.05, cx - r * 0.35, sy - r * 0.12);
    g.lineTo(cx + r * 0.35, sy - r * 0.12); g.quadraticCurveTo(cx + r * 1.1, sy - r * 0.05, cx + r * 1.15, cy + r * 1.9); g.closePath();
    var shg = g.createLinearGradient(cx - r, sy, cx + r, cy + r * 1.8);
    shg.addColorStop(0, rgb(lt(shirt, 0.2))); shg.addColorStop(1, rgb(dk(shirt, 0.4)));
    g.fillStyle = shg; g.fill();
    // 목
    g.fillStyle = rgb(dk(skin, 0.18)); rrect(g, cx - r * 0.25, cy + r * 0.55, r * 0.5, r * 0.5, r * 0.15); g.fill();
    g.fillStyle = rgb(dk(skin, 0.3), 0.5); g.beginPath(); g.ellipse(cx, cy + r * 0.62, r * 0.28, r * 0.12, 0, 0, PI); g.fill();
    // 깃
    g.fillStyle = rgb(dk(shirt, 0.2));
    g.beginPath(); g.moveTo(cx - r * 0.34, sy - r * 0.12); g.lineTo(cx, sy + r * 0.28); g.lineTo(cx + r * 0.34, sy - r * 0.12); g.lineTo(cx + r * 0.2, sy - r * 0.12); g.lineTo(cx, sy + r * 0.1); g.lineTo(cx - r * 0.2, sy - r * 0.12); g.closePath(); g.fill();

    var hr = r * (cu.kid ? 0.98 : 0.9);
    // 뒷머리
    if (cu.style === 1 || cu.style === 4) {                // 단발·긴머리
      g.fillStyle = rgb(dk(hair, 0.15));
      g.beginPath(); g.moveTo(cx - hr * 1.05, cy - hr * 0.2);
      g.quadraticCurveTo(cx - hr * 1.2, cy + hr * (cu.style === 4 ? 1.3 : 0.75), cx - hr * 0.6, cy + hr * (cu.style === 4 ? 1.35 : 0.85));
      g.lineTo(cx + hr * 0.6, cy + hr * (cu.style === 4 ? 1.35 : 0.85));
      g.quadraticCurveTo(cx + hr * 1.2, cy + hr * (cu.style === 4 ? 1.3 : 0.75), cx + hr * 1.05, cy - hr * 0.2); g.closePath(); g.fill();
    }
    // 귀
    g.fillStyle = rgb(dk(skin, 0.08));
    ell(g, cx - hr * 0.92, cy + hr * 0.05, hr * 0.14, hr * 0.2); g.fill();
    ell(g, cx + hr * 0.92, cy + hr * 0.05, hr * 0.14, hr * 0.2); g.fill();
    // 얼굴
    g.beginPath();
    g.moveTo(cx - hr * 0.9, cy - hr * 0.2);
    g.bezierCurveTo(cx - hr * 0.95, cy + hr * 0.55, cx - hr * 0.45, cy + hr * 0.92, cx, cy + hr * 0.92);
    g.bezierCurveTo(cx + hr * 0.45, cy + hr * 0.92, cx + hr * 0.95, cy + hr * 0.55, cx + hr * 0.9, cy - hr * 0.2);
    g.bezierCurveTo(cx + hr * 0.9, cy - hr * 1.0, cx - hr * 0.9, cy - hr * 1.0, cx - hr * 0.9, cy - hr * 0.2);
    var fg = g.createRadialGradient(cx - hr * 0.35, cy - hr * 0.3, hr * 0.1, cx, cy, hr * 1.1);
    fg.addColorStop(0, rgb(lt(skin, 0.18))); fg.addColorStop(0.7, rgb(skin)); fg.addColorStop(1, rgb(dk(skin, 0.2)));
    g.fillStyle = fg; g.fill();
    // 턱 밑 그늘
    g.save(); g.clip();
    g.fillStyle = rgb(dk(skin, 0.25), 0.35); ell(g, cx + hr * 0.3, cy + hr * 0.75, hr * 0.8, hr * 0.3); g.fill();
    g.restore();
    // 볼
    var angry = mood === 'angry', happy = mood === 'happy' || mood === 'love';
    g.fillStyle = angry ? 'rgba(230,60,50,.45)' : 'rgba(240,110,110,' + (happy ? 0.45 : 0.25) + ')';
    ell(g, cx - hr * 0.52, cy + hr * 0.36, hr * 0.17, hr * 0.1); g.fill();
    ell(g, cx + hr * 0.52, cy + hr * 0.36, hr * 0.17, hr * 0.1); g.fill();
    // 눈
    var ey = cy + hr * 0.1, ex = hr * 0.34, blink = (Math.sin(t * 1.3 + cu.seed) > 0.985);
    g.strokeStyle = '#2a1a12'; g.fillStyle = '#2a1a12'; g.lineCap = 'round'; g.lineWidth = Math.max(1.5, hr * 0.09);
    if (happy) {
      g.beginPath(); g.arc(cx - ex, ey + hr * 0.06, hr * 0.13, PI * 1.1, PI * 1.9); g.stroke();
      g.beginPath(); g.arc(cx + ex, ey + hr * 0.06, hr * 0.13, PI * 1.1, PI * 1.9); g.stroke();
    } else if (blink) {
      g.beginPath(); g.moveTo(cx - ex - hr * 0.1, ey); g.lineTo(cx - ex + hr * 0.1, ey); g.moveTo(cx + ex - hr * 0.1, ey); g.lineTo(cx + ex + hr * 0.1, ey); g.stroke();
    } else {
      ell(g, cx - ex, ey, hr * 0.085, hr * 0.12); g.fill(); ell(g, cx + ex, ey, hr * 0.085, hr * 0.12); g.fill();
      g.fillStyle = '#fff'; ell(g, cx - ex - hr * 0.03, ey - hr * 0.04, hr * 0.03, hr * 0.035); g.fill(); ell(g, cx + ex - hr * 0.03, ey - hr * 0.04, hr * 0.03, hr * 0.035); g.fill();
    }
    // 눈썹
    g.strokeStyle = rgb(dk(hair, 0.2)); g.lineWidth = Math.max(1.5, hr * 0.08);
    var bw = hr * 0.16, by2 = ey - hr * 0.26;
    var tilt = angry ? 0.12 : mood === 'wait' ? -0.06 : 0;
    g.beginPath(); g.moveTo(cx - ex - bw, by2 - tilt * hr * 0.5); g.lineTo(cx - ex + bw, by2 + tilt * hr); g.stroke();
    g.beginPath(); g.moveTo(cx + ex + bw, by2 - tilt * hr * 0.5); g.lineTo(cx + ex - bw, by2 + tilt * hr); g.stroke();
    // 코
    g.strokeStyle = rgb(dk(skin, 0.3)); g.lineWidth = Math.max(1, hr * 0.05);
    g.beginPath(); g.moveTo(cx + hr * 0.02, ey + hr * 0.08); g.quadraticCurveTo(cx + hr * 0.1, ey + hr * 0.22, cx - hr * 0.02, ey + hr * 0.26); g.stroke();
    // 입
    var my = cy + hr * 0.55;
    g.strokeStyle = '#6b2a1e'; g.lineWidth = Math.max(1.5, hr * 0.07);
    if (happy) {
      g.beginPath(); g.moveTo(cx - hr * 0.22, my - hr * 0.04); g.quadraticCurveTo(cx, my + hr * 0.28, cx + hr * 0.22, my - hr * 0.04); g.closePath();
      g.fillStyle = '#7a2a22'; g.fill();
      g.fillStyle = '#ef7d7d'; ell(g, cx, my + hr * 0.1, hr * 0.1, hr * 0.05); g.fill();
    } else if (angry) {
      g.beginPath(); g.moveTo(cx - hr * 0.18, my + hr * 0.06); g.quadraticCurveTo(cx, my - hr * 0.1, cx + hr * 0.18, my + hr * 0.06); g.stroke();
    } else if (mood === 'wait') {
      g.beginPath(); g.moveTo(cx - hr * 0.14, my); g.lineTo(cx + hr * 0.14, my + hr * 0.02); g.stroke();
    } else {
      g.beginPath(); g.moveTo(cx - hr * 0.15, my - hr * 0.02); g.quadraticCurveTo(cx, my + hr * 0.1, cx + hr * 0.15, my - hr * 0.02); g.stroke();
    }
    // 앞머리
    hairFront(g, cx, cy, hr, hair, cu.style);
    if (cu.glasses) {
      g.strokeStyle = '#1f1f24'; g.lineWidth = Math.max(1.5, hr * 0.06);
      g.beginPath(); g.arc(cx - ex, ey, hr * 0.2, 0, TAU); g.stroke();
      g.beginPath(); g.arc(cx + ex, ey, hr * 0.2, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(cx - ex + hr * 0.2, ey); g.lineTo(cx + ex - hr * 0.2, ey); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.25)'; ell(g, cx - ex - hr * 0.06, ey - hr * 0.08, hr * 0.06, hr * 0.04); g.fill();
    }
    if (angry) {                                          // 💢
      g.strokeStyle = '#e2362a'; g.lineWidth = Math.max(2, hr * 0.08);
      var ax2 = cx + hr * 0.7, ay2 = cy - hr * 0.75, q = hr * 0.14;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) {
        g.beginPath(); g.moveTo(ax2 + s[0] * q * 0.4, ay2 + s[1] * q * 1.4); g.quadraticCurveTo(ax2 + s[0] * q * 0.4, ay2 + s[1] * q * 0.4, ax2 + s[0] * q * 1.4, ay2 + s[1] * q * 0.4); g.stroke();
      });
    }
    g.restore();
  }
  function hairFront(g, cx, cy, hr, hair, style) {
    var hg = g.createLinearGradient(cx - hr, cy - hr, cx + hr, cy);
    hg.addColorStop(0, rgb(lt(hair, 0.25))); hg.addColorStop(0.5, rgb(hair)); hg.addColorStop(1, rgb(dk(hair, 0.3)));
    g.fillStyle = hg;
    g.beginPath();
    if (style === 2) {                                    // 모자
      var cap = hx('#2f5fb8');
      g.moveTo(cx - hr * 0.98, cy - hr * 0.2);
      g.bezierCurveTo(cx - hr * 1.0, cy - hr * 1.2, cx + hr * 1.0, cy - hr * 1.2, cx + hr * 0.98, cy - hr * 0.2);
      g.lineTo(cx - hr * 0.98, cy - hr * 0.2); g.closePath();
      var cg = g.createLinearGradient(cx - hr, cy - hr, cx + hr, cy);
      cg.addColorStop(0, rgb(lt(cap, 0.25))); cg.addColorStop(1, rgb(dk(cap, 0.35)));
      g.fillStyle = cg; g.fill();
      g.fillStyle = rgb(dk(cap, 0.25)); g.beginPath(); g.ellipse(cx + hr * 0.15, cy - hr * 0.22, hr * 1.05, hr * 0.16, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(cx, cy - hr * 0.62, hr * 0.14, 0, TAU); g.fill();
      return;
    }
    if (style === 3) {                                    // 짧은 곱슬
      for (var i = 0; i < 11; i++) {
        var a = PI + (i / 10) * PI, px = cx + Math.cos(a) * hr * 0.86, py = cy - hr * 0.2 + Math.sin(a) * hr * 0.82;
        g.moveTo(px + hr * 0.24, py); g.arc(px, py, hr * 0.24, 0, TAU);
      }
      g.fill(); return;
    }
    if (style === 5) {                                    // 대머리 + 수염
      g.fillStyle = rgb(hair, 0.9);
      g.beginPath(); g.moveTo(cx - hr * 0.9, cy - hr * 0.1); g.quadraticCurveTo(cx - hr * 0.95, cy - hr * 0.5, cx - hr * 0.75, cy - hr * 0.55); g.lineTo(cx - hr * 0.8, cy + hr * 0.05); g.fill();
      g.beginPath(); g.moveTo(cx + hr * 0.9, cy - hr * 0.1); g.quadraticCurveTo(cx + hr * 0.95, cy - hr * 0.5, cx + hr * 0.75, cy - hr * 0.55); g.lineTo(cx + hr * 0.8, cy + hr * 0.05); g.fill();
      g.beginPath(); g.moveTo(cx - hr * 0.7, cy + hr * 0.4); g.quadraticCurveTo(cx - hr * 0.5, cy + hr * 1.08, cx, cy + hr * 1.08);
      g.quadraticCurveTo(cx + hr * 0.5, cy + hr * 1.08, cx + hr * 0.7, cy + hr * 0.4); g.quadraticCurveTo(cx, cy + hr * 0.75, cx - hr * 0.7, cy + hr * 0.4); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; ell(g, cx - hr * 0.3, cy - hr * 0.62, hr * 0.25, hr * 0.1); g.fill();
      return;
    }
    // 기본·단발·긴머리·아이 — 가르마 있는 앞머리
    g.moveTo(cx - hr * 1.0, cy + hr * 0.05);
    g.bezierCurveTo(cx - hr * 1.12, cy - hr * 1.15, cx + hr * 1.12, cy - hr * 1.15, cx + hr * 1.0, cy + hr * 0.05);
    g.quadraticCurveTo(cx + hr * 0.85, cy - hr * 0.35, cx + hr * 0.35, cy - hr * 0.42);
    g.quadraticCurveTo(cx + hr * 0.1, cy - hr * 0.2, cx - hr * 0.1, cy - hr * 0.45);
    g.quadraticCurveTo(cx - hr * 0.6, cy - hr * 0.3, cx - hr * 0.78, cy - hr * 0.05);
    g.closePath(); g.fill();
    g.strokeStyle = rgb(dk(hair, 0.35), 0.6); g.lineWidth = Math.max(1, hr * 0.04);
    for (var k = 0; k < 4; k++) {
      g.beginPath(); g.moveTo(cx - hr * 0.1 + k * hr * 0.12, cy - hr * 0.85); g.quadraticCurveTo(cx + hr * 0.3 + k * hr * 0.12, cy - hr * 0.6, cx + hr * 0.25 + k * hr * 0.15, cy - hr * 0.42); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = Math.max(1.5, hr * 0.07);
    g.beginPath(); g.arc(cx - hr * 0.1, cy - hr * 0.2, hr * 0.62, PI * 1.2, PI * 1.45); g.stroke();
  }

  // ---------- 떠다니는 것 ----------
  function smoke(g, x, y, r, a, dark) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    var c = dark ? '60,55,50' : '240,236,230';
    gr.addColorStop(0, 'rgba(' + c + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  function star(g, x, y, r, fill) {
    g.beginPath();
    for (var i = 0; i < 10; i++) { var a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath();
    g.fillStyle = fill ? '#ffc93a' : 'rgba(0,0,0,.25)'; g.fill();
    if (fill) { g.strokeStyle = '#b07a10'; g.lineWidth = Math.max(1, r * 0.12); g.stroke(); }
  }

  // 주문표·메뉴판 재료 그림 (지름 sz 칸 안에)
  function icon(g, k, x, y, sz, ring) {
    var R = sz * 0.5;
    g.save();
    ell(g, x, y + 1, R, R); g.fillStyle = 'rgba(120,95,60,.10)'; g.fill();
    if (ring) { g.strokeStyle = ring; g.lineWidth = 3.5; ell(g, x, y + 1, R - 1, R - 1); g.stroke(); }
    var r = rng(k.length * 7 + 3);
    switch (k) {
      case 'beef': pattyTop(g, x, y + 1, R * 0.78, R * 0.6, 'beef', 0.95, 3, 1); break;
      case 'chicken': case 'shrimp': crumbTop(g, x, y + 1, R * 0.8, R * 0.6, 1, k === 'chicken' ? 41 : 43, k); break;
      case 'cheese':
        g.translate(x, y); g.rotate(0.5);
        var cg = g.createLinearGradient(-R, -R, R, R); cg.addColorStop(0, '#ffe07a'); cg.addColorStop(1, '#f0a42a');
        g.fillStyle = cg; rrect(g, -R * 0.56, -R * 0.56, R * 1.12, R * 1.12, 3); g.fill();
        g.strokeStyle = 'rgba(190,110,10,.45)'; g.lineWidth = 1.2; g.stroke();
        break;
      case 'lettuce': leafTop(g, x, y + 1, R * 0.82, R * 0.62, 2); break;
      case 'tomato': tomatoSlice(g, x, y + 1, R * 0.74, R * 0.62, 1); break;
      case 'onion':
        g.lineWidth = R * 0.2; g.strokeStyle = '#9b5aa6'; ell(g, x, y + 1, R * 0.64, R * 0.54); g.stroke();
        g.lineWidth = R * 0.12; g.strokeStyle = '#f3e6f5'; ell(g, x, y + 1, R * 0.64, R * 0.54); g.stroke();
        g.lineWidth = R * 0.16; g.strokeStyle = '#b77fb9'; ell(g, x, y + 1, R * 0.34, R * 0.28); g.stroke();
        break;
      case 'pickle': pickleDisc(g, x - R * 0.28, y + 3, R * 0.4, R * 0.34, 1); pickleDisc(g, x + R * 0.3, y - 2, R * 0.4, R * 0.34, 2); break;
      case 'bacon': baconStrip(g, x - R * 0.8, y, R * 1.6, R * 0.42, 1); break;
      case 'egg': eggTop(g, x, y + 1, R * 0.8, R * 0.66, 3); break;
      case 'jalapeno': jalRing(g, x - R * 0.3, y + 2, R * 0.36, R * 0.32); jalRing(g, x + R * 0.32, y - 2, R * 0.36, R * 0.32); break;
      case 'avocado': avoSlice(g, x - R * 0.2, y + 2, R * 1.2, R * 0.46, -0.3); avoSlice(g, x + R * 0.25, y - 2, R * 1.2, R * 0.46, -0.3); break;
      case 'fries': carton(g, x, y + R * 0.8, sz / 90, 1); break;
      case 'bun_b':
        cylSide(g, x, y - R * 0.05, R * 0.8, R * 0.34, R * 0.34);
        var bb = g.createLinearGradient(0, y - R * 0.1, 0, y + R * 0.6); bb.addColorStop(0, '#e9b56e'); bb.addColorStop(1, '#9a5a24');
        g.fillStyle = bb; g.fill();
        ell(g, x, y - R * 0.05, R * 0.8, R * 0.34); g.fillStyle = '#f6ddb0'; g.fill();
        break;
      case 'bun_t': bunDome(g, x, y + R * 0.35, R * 0.82, R * 0.3, R * 0.62, 4); break;
      default:
        if (SAUCE[k]) {                                   // 소스 한 방울
          var c = hx(SAUCE[k].c);
          g.beginPath(); g.moveTo(x, y - R * 0.72);
          g.bezierCurveTo(x + R * 0.2, y - R * 0.35, x + R * 0.58, y, x + R * 0.58, y + R * 0.28);
          g.arc(x, y + R * 0.28, R * 0.58, 0, PI, false);
          g.bezierCurveTo(x - R * 0.58, y, x - R * 0.2, y - R * 0.35, x, y - R * 0.72);
          var dg = g.createRadialGradient(x - R * 0.2, y, 1, x, y + R * 0.2, R * 0.8);
          dg.addColorStop(0, rgb(lt(c, k === 'mayo' ? 0.4 : 0.3))); dg.addColorStop(1, rgb(dk(c, k === 'mayo' ? 0.25 : 0.15)));
          g.fillStyle = dg; g.fill();
          g.strokeStyle = rgb(dk(c, 0.35), 0.6); g.lineWidth = 1.4; g.stroke();
          g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, x - R * 0.2, y + R * 0.1, R * 0.1, R * 0.18); g.fill();
        }
    }
    g.restore();
  }

  // ---------- 엔딩 — 저녁 가게 앞, 긴 줄, 간판이 올라간다 ----------
  function easeOut(p) { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - p, 3); }
  function person(g, x, y, r, cu, t, mood) {
    var shirt = hx(SHIRT[cu.shirt]), pants = hx(['#3b4657', '#5a4636', '#2d3340', '#6b6f7a'][cu.skin % 4]);
    var top = y + r * 1.45, bot = y + r * 5.2;
    shadow(g, x + 6, bot + 4, r * 1.3, r * 0.3, 0.35);
    // 다리
    g.fillStyle = rgb(dk(pants, 0.1));
    rrect(g, x - r * 0.55, top + r * 1.6, r * 0.5, bot - top - r * 1.6, r * 0.2); g.fill();
    g.fillStyle = rgb(pants);
    rrect(g, x + r * 0.05, top + r * 1.6, r * 0.5, bot - top - r * 1.6, r * 0.2); g.fill();
    g.fillStyle = '#2a211c'; rrect(g, x - r * 0.62, bot - r * 0.22, r * 0.6, r * 0.28, r * 0.12); g.fill();
    rrect(g, x + r * 0.02, bot - r * 0.22, r * 0.6, r * 0.28, r * 0.12); g.fill();
    // 몸통 (윗옷)
    var bg = g.createLinearGradient(x - r, 0, x + r, 0);
    bg.addColorStop(0, rgb(lt(shirt, 0.15))); bg.addColorStop(0.6, rgb(shirt)); bg.addColorStop(1, rgb(dk(shirt, 0.35)));
    g.fillStyle = bg; rrect(g, x - r * 1.1, top, r * 2.2, r * 2.0, r * 0.5); g.fill();
    g.fillStyle = rgb(dk(shirt, 0.25), 0.5); g.fillRect(x - r * 1.1, top + r * 1.75, r * 2.2, r * 0.25);
    face(g, x, y, r, cu, mood, t);
  }
  function ending(g, x0, y0, ww, hh, et, t, custs, title, fontFam) {
    var VWc = 800, i, r = rng(99);
    // 하늘
    var sky = g.createLinearGradient(0, y0, 0, 700);
    sky.addColorStop(0, '#221a4d'); sky.addColorStop(0.45, '#6b3f7a'); sky.addColorStop(0.78, '#e56f4f'); sky.addColorStop(1, '#ffc56e');
    g.fillStyle = sky; g.fillRect(x0, y0, ww, hh);
    // 별
    for (i = 0; i < 70; i++) {
      var sx = x0 + r() * ww, sy = y0 + r() * 300, tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
      g.fillStyle = 'rgba(255,245,220,' + (0.25 + 0.5 * tw) * easeOut(et / 2) + ')';
      g.beginPath(); g.arc(sx, sy, 0.8 + r() * 1.6, 0, TAU); g.fill();
    }
    // 먼 도시
    var cx = x0, rb = rng(7);
    while (cx < x0 + ww) {
      var bw = 60 + rb() * 110, bh = 90 + rb() * 220;
      g.fillStyle = '#3a2c57'; g.fillRect(cx, 700 - bh - 60, bw, bh + 60);
      g.fillStyle = 'rgba(255,214,130,.55)';
      for (var wy = 700 - bh - 40; wy < 640; wy += 26) for (var wx = cx + 10; wx < cx + bw - 14; wx += 22) if (rb() > 0.55) g.fillRect(wx, wy, 8, 12);
      cx += bw + 6;
    }
    // 가게 건물
    var L = 360, Rr = 1240, T = 150, B = 700;
    shadow(g, 800, B + 8, 520, 30, 0.45);
    var wall = g.createLinearGradient(L, T, Rr, B);
    wall.addColorStop(0, '#c9644a'); wall.addColorStop(1, '#8e3b2c');
    g.fillStyle = wall; g.fillRect(L, T, Rr - L, B - T);
    // 벽돌 줄눈
    g.strokeStyle = 'rgba(60,20,12,.28)'; g.lineWidth = 2;
    for (var by = T + 20, row = 0; by < B; by += 24, row++) {
      g.beginPath(); g.moveTo(L, by); g.lineTo(Rr, by); g.stroke();
      for (var bx = L + (row % 2 ? 30 : 0); bx < Rr; bx += 60) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by + 24); g.stroke(); }
    }
    g.fillStyle = 'rgba(255,220,180,.07)'; g.fillRect(L, T, (Rr - L) * 0.4, B - T);
    // 지붕 처마
    var cg = g.createLinearGradient(0, T - 30, 0, T + 16);
    cg.addColorStop(0, '#4a2a22'); cg.addColorStop(1, '#2b1712');
    g.fillStyle = cg; g.fillRect(L - 24, T - 30, Rr - L + 48, 46);
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(L - 24, T - 30, Rr - L + 48, 4);
    // 간판 판
    var sL = 420, sR = 1180, sT = 185, sB = 335;
    g.fillStyle = '#2b1a14'; rrect(g, sL, sT, sR - sL, sB - sT, 18); g.fill();
    var sg = g.createLinearGradient(0, sT, 0, sB); sg.addColorStop(0, '#5a3524'); sg.addColorStop(1, '#3a2218');
    g.fillStyle = sg; rrect(g, sL + 8, sT + 8, sR - sL - 16, sB - sT - 16, 12); g.fill();
    // 전구 테 — 글자가 다 올라오면 켜진다
    var chars = Array.from(title), nC = chars.length, tStart = 2.6, per = 0.32, done = tStart + nC * per;
    var lit = et > done, nb = 28;
    for (i = 0; i < nb; i++) {
      var u = i / nb, px, py, per2 = 2 * ((sR - sL) + (sB - sT)), d = u * per2;
      if (d < sR - sL) { px = sL + d; py = sT; } else if (d < (sR - sL) + (sB - sT)) { px = sR; py = sT + d - (sR - sL); }
      else if (d < 2 * (sR - sL) + (sB - sT)) { px = sR - (d - (sR - sL) - (sB - sT)); py = sB; } else { px = sL; py = sB - (d - 2 * (sR - sL) - (sB - sT)); }
      var on = lit && ((Math.floor(t * 6) + i) % 3 !== 0 || et < done + 1);
      if (on) { var bgl = g.createRadialGradient(px, py, 0, px, py, 18); bgl.addColorStop(0, 'rgba(255,220,120,.9)'); bgl.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = bgl; g.beginPath(); g.arc(px, py, 18, 0, TAU); g.fill(); }
      g.fillStyle = on ? '#fff3c4' : '#6b5646'; g.beginPath(); g.arc(px, py, 6, 0, TAU); g.fill();
    }
    // 간판 글자 — 한 글자씩 아래에서 솟는다
    g.save(); rrect(g, sL + 8, sT + 8, sR - sL - 16, sB - sT - 16, 12); g.clip();
    var size = 118;
    g.font = '400 ' + size + 'px ' + fontFam;
    var tw2 = g.measureText(title).width;
    if (tw2 > (sR - sL) * 0.86) { size *= (sR - sL) * 0.86 / tw2; g.font = '400 ' + size + 'px ' + fontFam; tw2 = g.measureText(title).width; }
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round';
    var lx = 800 - tw2 / 2, ly = (sT + sB) / 2 + size * 0.04;
    for (i = 0; i < nC; i++) {
      var pre = g.measureText(chars.slice(0, i).join('')).width, p = (et - tStart - i * per) / 0.45;
      if (p <= 0) continue;
      var up = (1 - easeOut(p)) * 150 - Math.sin(Math.min(1, p) * PI) * 12;
      var cx2 = lx + pre, cy2 = ly + up;
      if (lit) { g.shadowColor = '#ffb347'; g.shadowBlur = 20; }
      g.lineWidth = size * 0.1; g.strokeStyle = '#9a3d12'; g.strokeText(chars[i], cx2, cy2 + size * 0.05);
      g.fillStyle = '#9a3d12'; g.fillText(chars[i], cx2, cy2 + size * 0.05);
      g.shadowBlur = 0;
      g.lineWidth = size * 0.045; g.strokeStyle = '#ffe1a8'; g.strokeText(chars[i], cx2, cy2);
      g.fillStyle = '#ffe1a8'; g.fillText(chars[i], cx2, cy2);
    }
    g.restore();
    // 차양
    var aT = 352, aB = 420, stripes = 14, sw = (Rr - L + 40) / stripes;
    for (i = 0; i < stripes; i++) {
      var ax = L - 20 + i * sw;
      g.fillStyle = i % 2 ? '#fff1dc' : '#d8452f';
      g.beginPath(); g.moveTo(ax, aT); g.lineTo(ax + sw, aT); g.lineTo(ax + sw, aB);
      g.quadraticCurveTo(ax + sw / 2, aB + 22, ax, aB); g.closePath(); g.fill();
    }
    var ag = g.createLinearGradient(0, aT, 0, aB + 20); ag.addColorStop(0, 'rgba(0,0,0,.25)'); ag.addColorStop(0.3, 'rgba(0,0,0,0)'); ag.addColorStop(1, 'rgba(0,0,0,.2)');
    g.fillStyle = ag; g.fillRect(L - 20, aT, Rr - L + 40, aB - aT + 22);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(L - 20, aB + 18, Rr - L + 40, 10);
    // 창문 둘 + 문
    function win(wx, wy, w, h) {
      g.fillStyle = '#3a2218'; rrect(g, wx - 10, wy - 10, w + 20, h + 20, 6); g.fill();
      var gl = g.createLinearGradient(0, wy, 0, wy + h); gl.addColorStop(0, '#ffe7a8'); gl.addColorStop(1, '#f2a24a');
      g.fillStyle = gl; g.fillRect(wx, wy, w, h);
      // 안쪽 사람 그림자·버거 포스터
      g.fillStyle = 'rgba(120,60,20,.28)';
      for (var k = 0; k < 3; k++) { var hx2 = wx + w * (0.22 + k * 0.28); g.beginPath(); g.arc(hx2, wy + h * 0.52, 18, 0, TAU); g.fill(); rrect(g, hx2 - 24, wy + h * 0.62, 48, h * 0.4, 14); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(wx + 10, wy + h); g.lineTo(wx + w * 0.4, wy); g.lineTo(wx + w * 0.52, wy); g.lineTo(wx + 22 + w * 0.12, wy + h); g.fill();
      g.fillStyle = '#3a2218'; g.fillRect(wx + w / 2 - 4, wy, 8, h);
    }
    win(430, 460, 300, 190); win(910, 460, 300, 190);
    g.fillStyle = '#2b1712'; rrect(g, 750, 440, 140, 260, 6); g.fill();
    var dg = g.createLinearGradient(0, 455, 0, 700); dg.addColorStop(0, '#ffe2a0'); dg.addColorStop(1, '#e8903e');
    g.fillStyle = dg; g.fillRect(764, 455, 112, 245);
    g.fillStyle = '#c9a15a'; rrect(g, 850, 570, 10, 36, 4); g.fill();
    // 인도
    var sw2 = g.createLinearGradient(0, 700, 0, hh + y0); sw2.addColorStop(0, '#8f8a8e'); sw2.addColorStop(1, '#5d5960');
    g.fillStyle = sw2; g.fillRect(x0, 700, ww, hh + y0 - 700);
    g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2;
    for (var sx2 = Math.floor(x0 / 120) * 120; sx2 < x0 + ww; sx2 += 120) { g.beginPath(); g.moveTo(sx2, 700); g.lineTo(sx2 - 60, 820); g.stroke(); }
    var spill = g.createRadialGradient(820, 710, 20, 820, 710, 520);
    spill.addColorStop(0, 'rgba(255,190,90,.35)'); spill.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = spill; g.fillRect(x0, 690, ww, 200);
    // 줄 선 손님 — 문 앞에서 오른쪽 끝 너머까지
    for (i = custs.length - 1; i >= 0; i--) {
      var p2 = easeOut((et - 0.6 - i * 0.12) / 1.6);
      var px2 = 900 + i * 92 + (1 - p2) * 900, bob = Math.sin(t * 5 + i) * (p2 < 1 ? 5 : 1.5);
      var cheer = lit && (Math.floor(t * 2 + i) % 3 === 0);
      var pr = custs[i].kid ? 23 : 30;
      person(g, px2, 752 - pr * 5.2 - bob - (cheer ? 10 : 0), pr, custs[i], t, lit ? 'happy' : 'idle');
    }
    // 불꽃 — 빛줄기가 퍼지고 끝에서 반짝인다
    if (et > done + 0.3) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var f = 0; f < 7; f++) {
        var cyc = (et - done - 0.3 - f * 0.45), ph = cyc % 2.6;
        if (cyc < 0 || ph > 1.6) continue;
        var rf = rng(f * 31 + Math.floor(cyc / 2.6) * 7);
        var fx = 160 + rf() * 1280, fy = 50 + rf() * 170, col = hx(['#ffd23f', '#ff6b8a', '#6be3ff', '#b8ff6b', '#ffa94a', '#d49bff', '#ffffff'][f]);
        var rad = easeOut(ph / 1.0) * (80 + rf() * 60), fa = Math.max(0, 1 - ph / 1.6), drop = ph * ph * 14;
        if (ph < 0.25) { var fl = g.createRadialGradient(fx, fy, 0, fx, fy, 60); fl.addColorStop(0, rgb(col, 0.8 * (1 - ph / 0.25))); fl.addColorStop(1, rgb(col, 0)); g.fillStyle = fl; g.beginPath(); g.arc(fx, fy, 60, 0, TAU); g.fill(); }
        for (var k2 = 0; k2 < 30; k2++) {
          var an = k2 / 30 * TAU + f, ex = fx + Math.cos(an) * rad, ey = fy + Math.sin(an) * rad + drop;
          var sx3 = fx + Math.cos(an) * rad * 0.55, sy3 = fy + Math.sin(an) * rad * 0.55 + drop * 0.6;
          var lg = g.createLinearGradient(sx3, sy3, ex, ey); lg.addColorStop(0, rgb(col, 0)); lg.addColorStop(1, rgb(col, fa));
          g.strokeStyle = lg; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.moveTo(sx3, sy3); g.lineTo(ex, ey); g.stroke();
          g.fillStyle = rgb(lt(col, 0.6), fa * (0.6 + 0.4 * Math.sin(t * 30 + k2))); g.beginPath(); g.arc(ex, ey, 2.6, 0, TAU); g.fill();
        }
      }
      g.restore();
    }
    // 가장자리 어둡게
    var vg = g.createRadialGradient(800, 420, 300, 800, 420, 1000);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = vg; g.fillRect(x0, y0, ww, hh);
    // 처음 1초는 검은 화면에서 밝아진다
    if (et < 1) { g.fillStyle = 'rgba(0,0,0,' + (1 - et) + ')'; g.fillRect(x0, y0, ww, hh); }
  }

  window.ART = {
    icon: icon, ending: ending,
    SQ: SQ, DONE_COL: DONE_COL, ZONES: ZONES, SAUCE: SAUCE, TH: TH,
    rgb: rgb, hx: hx, rrect: rrect, ell: ell, shadow: shadow, rng: rng,
    wall: wall, neon: neon, shelf: shelf, counter: counter, counterFront: counterFront,
    rawTray: rawTray, grill: grill, grillPatty: grillPatty, gauge: gauge,
    fryer: fryer, basket: basket, warmer: warmer, carton: carton,
    pan: pan, bottle: bottle, bunBasket: bunBasket, trash: trash, board: board,
    layer: layer, layerTh: layerTh, stack: stack, face: face, smoke: smoke, star: star, topView: topView
  };
})();
