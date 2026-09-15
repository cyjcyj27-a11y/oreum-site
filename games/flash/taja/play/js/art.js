/* 타자 — 그림. 달리는 동물 선수 13종과 코스 배경 12곳. 전부 캔버스 코드. 빛은 왼쪽 위에서. */
(function () {
  'use strict';

  // ── 색 도우미 ──
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgb(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function shade(h, t) { var c = hex(h), k = t < 0 ? 0 : 255, m = Math.abs(t); return rgb([c[0] + (k - c[0]) * m, c[1] + (k - c[1]) * m, c[2] + (k - c[2]) * m]); }
  function rgba(h, a) { var c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(h1, h2, t) { var a = hex(h1), b = hex(h2); return rgb([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  function seeded(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // 면: 왼쪽 위가 밝고 오른쪽 아래가 어두운 둥근 칠
  function ball(c, x, y, r, col) {
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.28));
    return g;
  }
  function soft(c, x, y, r, col) { var g = c.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r); g.addColorStop(0, shade(col, 0.22)); g.addColorStop(0.7, col); g.addColorStop(1, shade(col, -0.08)); return g; }
  function ell(c, x, y, rx, ry, rot, fill, line, lw) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (line) { c.strokeStyle = line; c.lineWidth = lw || 2; c.stroke(); }
  }
  function capsule(c, x1, y1, x2, y2, w, col, edge) {
    c.lineCap = 'round';
    c.strokeStyle = edge; c.lineWidth = w + 2.6; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = w * 0.32; c.beginPath(); c.moveTo(x1 - w * 0.18, y1 - w * 0.1); c.lineTo(x2 - w * 0.18, y2 - w * 0.1); c.stroke();
  }

  // ── 선수 13종 ── 머리 크고 눈 반짝이는 꼬마 동물. 윤곽선은 몸 바깥에만 한 줄(1차: 윤곽, 2차: 칠)
  // fur 털, belly 배·주둥이, out 윤곽선, ear 귀 모양, earIn 귀 안, snout 주둥이, tail 꼬리, limb 팔다리, paw 발, kit 운동복
  var SP = {
    dog:     { ko: '멍이', en: 'Mong', fur: '#fffaf2', belly: '#ffffff', out: '#6b4a36', ear: 'flop', earCol: '#d9a06a', snout: 'dog', tail: 'curl', kit: '#e8483c', patch: '#e8c49a' },
    turtle:  { ko: '엉금이', en: 'Shelly', fur: '#9ad472', belly: '#f3e9a8', out: '#3f6a2c', ear: 'none', snout: 'turtle', tail: 'nub', kit: '#4a8fd8', shell: '#a87a3e' },
    duck:    { ko: '꽥이', en: 'Quack', fur: '#ffe27a', belly: '#fff3c0', out: '#9a6a1a', ear: 'tuft', snout: 'bill', tail: 'feather', kit: '#7a5cd0', limb: '#ffe27a', paw: '#f7963a', wing: 1 },
    penguin: { ko: '펭구', en: 'Pengu', fur: '#3a4a64', belly: '#ffffff', out: '#1c2434', ear: 'none', snout: 'beak', tail: 'nub', kit: '#f2c230', paw: '#f7a03a', mask: 1, wing: 1 },
    pig:     { ko: '꿀꿀이', en: 'Oink', fur: '#ffc4cc', belly: '#ffdfe3', out: '#b0606e', ear: 'fold', snout: 'pig', tail: 'curly', kit: '#3db07a' },
    bear:    { ko: '곰돌', en: 'Bruno', fur: '#b07a4e', belly: '#f0d2a8', out: '#5a3a22', ear: 'round', snout: 'bear', tail: 'nub', kit: '#e57b22' },
    panda:   { ko: '판다', en: 'Bamboo', fur: '#ffffff', belly: '#ffffff', out: '#2a2a30', ear: 'roundB', snout: 'panda', tail: 'nub', kit: '#d84a7a', limb: '#34343c', paw: '#34343c', patches: 1 },
    cat:     { ko: '냥이', en: 'Mittens', fur: '#ffb25e', belly: '#fff4e2', out: '#9a5a22', ear: 'point', snout: 'cat', tail: 'long', kit: '#2f7fd0', stripes: '#e8883a' },
    squirrel:{ ko: '다람이', en: 'Nutty', fur: '#d98a48', belly: '#fbe6c8', out: '#7a4418', ear: 'tuft2', snout: 'cat', tail: 'bushy', kit: '#39a58f', cheekLine: 1 },
    monkey:  { ko: '끼끼', en: 'Kiki', fur: '#9a6440', belly: '#f6d2ac', out: '#4e2e18', ear: 'side', snout: 'monkey', tail: 'curlLong', kit: '#e0b52a' },
    rabbit:  { ko: '깡총이', en: 'Hoppy', fur: '#ffffff', belly: '#ffffff', out: '#8a7f96', ear: 'long', snout: 'rabbit', tail: 'puff', kit: '#e0508a' },
    tiger:   { ko: '범이', en: 'Tora', fur: '#ff9a3a', belly: '#fffaf0', out: '#8a4410', ear: 'roundT', snout: 'tiger', tail: 'long', kit: '#26345a', stripes: '#3a2418' },
    cheetah: { ko: '치타', en: 'Dash', fur: '#f6cf6e', belly: '#fffaea', out: '#8a6420', ear: 'roundS', snout: 'tiger', tail: 'long', kit: '#c42a2a', spots: '#6a4a1c' }
  };

  // Path2D 도우미
  var M = function () { return new DOMMatrix(); };
  function pEll(x, y, rx, ry, rot) { var p = new Path2D(); p.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); return p; }
  function pMove(p, x, y, ang) { var q = new Path2D(); q.addPath(p, M().translate(x, y).rotate((ang || 0) * 180 / Math.PI)); return q; }
  function pLimb(w, len) { var p = new Path2D(), r = w / 2; p.moveTo(-r, 0); p.lineTo(-r, len - r); p.arc(0, len - r, r, Math.PI, 0, true); p.lineTo(r, 0); p.arc(0, 0, r, 0, Math.PI, true); p.closePath(); return p; }
  function soft2(c, x, y, r, col) { var g = c.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.08, x, y, r * 1.1); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.14)); return g; }
  function lin(c, x1, y1, x2, y2, col) { var g = c.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, shade(col, 0.22)); g.addColorStop(1, shade(col, -0.16)); return g; }

  // parts: { p: Path2D, f: 칠(색·그라데이션), sep: 안쪽에도 가는 선 } 또는 { line: Path2D, w, col } 또는 { fn: 함수(칠 단계에만) }
  function render(c, parts, out) {
    var OUT = 4.2;
    c.lineJoin = 'round'; c.lineCap = 'round';
    parts.forEach(function (q) {
      if (q.fn || q.noOut) return;
      if (q.line) { c.strokeStyle = out; c.lineWidth = q.w + OUT * 2; c.stroke(q.line); return; }
      c.strokeStyle = out; c.lineWidth = OUT * 2; c.stroke(q.p); c.fillStyle = out; c.fill(q.p);
    });
    parts.forEach(function (q) {
      if (q.fn) { q.fn(c); return; }
      if (q.line) { c.strokeStyle = q.col; c.lineWidth = q.w; c.stroke(q.line); if (q.hi) { c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = q.w * 0.3; c.stroke(q.line); } return; }
      c.fillStyle = q.f; c.fill(q.p);
      if (q.sep) { c.strokeStyle = rgba(out, 0.75); c.lineWidth = 2.2; c.stroke(q.p); }
    });
  }

  function eye(c, x, y, rx, ry, mood, blink, out) {
    if (blink || mood === 'happy' || mood === 'cheer') {
      c.strokeStyle = '#2a1a14'; c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.arc(x, y + ry * 0.35, rx * 0.95, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); return;
    }
    if (mood === 'dizzy') {
      c.strokeStyle = '#2a1a14'; c.lineWidth = 1.8; c.beginPath();
      for (var a = 0; a < 12; a += 0.4) { var r = a * 0.5; c.lineTo(x + Math.cos(a) * r * rx / 6, y + Math.sin(a) * r * ry / 6); }
      c.stroke(); return;
    }
    var g = c.createRadialGradient(x, y + ry * 0.3, 0.5, x, y, ry);
    g.addColorStop(0, '#6a4230'); g.addColorStop(0.55, '#2a1a14'); g.addColorStop(1, '#150c08');
    ell(c, x, y, rx, ry, 0, g);
    ell(c, x + rx * 0.28, y - ry * 0.36, rx * 0.46, rx * 0.46, 0, '#ffffff');
    ell(c, x - rx * 0.35, y + ry * 0.38, rx * 0.2, rx * 0.2, 0, 'rgba(255,255,255,.85)');
    if (mood === 'sad') { ell(c, x - rx * 0.2, y + ry * 1.1, rx * 0.35, ry * 0.3, 0, 'rgba(140,200,255,.85)'); }
  }

  function headParts(parts, s, hx, hy, st) {
    var mood = st.mood || 'normal', blink = st.blink, run = st.run || 0, ph = st.ph || 0, bounce = Math.sin(ph * 2) * run;
    var fur = s.fur, out = s.out, earIn = '#ffb3c0';
    // 뒤 귀
    function earPoint(x, y, ang, h, inner) {
      var p = new Path2D(); p.moveTo(-10, 4); p.quadraticCurveTo(-8, -h * 0.6, 0, -h); p.quadraticCurveTo(8, -h * 0.6, 10, 4); p.closePath();
      parts.push({ p: pMove(p, x, y, ang), f: lin(null || c0, x - 10, y - h, x + 10, y, fur) });
      if (inner) { var q = new Path2D(); q.moveTo(-5, 2); q.quadraticCurveTo(-4, -h * 0.45, 0, -h * 0.72); q.quadraticCurveTo(4, -h * 0.45, 5, 2); q.closePath(); parts.push({ p: pMove(q, x, y, ang), f: earIn, noOut: 1 }); }
    }
    var c0 = st.ctx;
    switch (s.ear) {
      case 'point': earPoint(hx - 14, hy - 17, -0.32, 22, 1); earPoint(hx + 19, hy - 18, 0.36, 21, 1); break;
      case 'tuft2':
        earPoint(hx - 14, hy - 18, -0.28, 20, 1); earPoint(hx + 19, hy - 19, 0.32, 19, 1);
        parts.push({ fn: function (c) { c.strokeStyle = shade(fur, -0.3); c.lineWidth = 2.4; [[hx - 14, hy - 18, -0.28], [hx + 19, hy - 19, 0.32]].forEach(function (e) { c.save(); c.translate(e[0], e[1]); c.rotate(e[2]); c.beginPath(); c.moveTo(0, -19); c.lineTo(-3, -27); c.moveTo(0, -19); c.lineTo(2, -28); c.moveTo(0, -19); c.lineTo(5, -25); c.stroke(); c.restore(); }); } });
        break;
      case 'round': case 'roundB': case 'roundT': case 'roundS':
        var r = s.ear === 'roundS' ? 7 : 9.5, ec = s.ear === 'roundB' ? '#34343c' : fur;
        [[hx - 17, hy - 18], [hx + 21, hy - 19]].forEach(function (e) {
          parts.push({ p: pEll(e[0], e[1], r, r), f: soft2(c0, e[0], e[1], r, ec) });
          if (s.ear !== 'roundB') parts.push({ p: pEll(e[0] + 0.5, e[1] + 1, r * 0.52, r * 0.52), f: s.ear === 'roundT' ? '#fffaf0' : shade(fur, -0.18), noOut: 1 });
        });
        break;
      case 'long':
        [[hx - 7, hy - 20, -0.2, 1], [hx + 13, hy - 22, 0.16, 0.95]].forEach(function (e) {
          var a = e[2] + bounce * 0.08, len = 34 * e[3];
          var p = new Path2D(); p.ellipse(0, -len * 0.55, 8.5, len * 0.62, 0, 0, Math.PI * 2);
          parts.push({ p: pMove(p, e[0], e[1], a), f: lin(c0, e[0] - 8, 0, e[0] + 8, 0, fur) });
          var q = new Path2D(); q.ellipse(0.5, -len * 0.55, 4, len * 0.46, 0, 0, Math.PI * 2);
          parts.push({ p: pMove(q, e[0], e[1], a), f: earIn, noOut: 1 });
        });
        break;
      case 'fold':
        [[hx - 15, hy - 16, -0.45], [hx + 20, hy - 17, 0.5]].forEach(function (e, i) {
          var p = new Path2D(); p.moveTo(-10, 5); p.quadraticCurveTo(-6, -12, 2, -16); p.quadraticCurveTo(9, -8, 10, 5); p.closePath();
          parts.push({ p: pMove(p, e[0], e[1], e[2]), f: lin(c0, e[0] - 10, e[1] - 16, e[0] + 10, e[1], fur) });
          var q = new Path2D(); q.moveTo(-3, -12); q.quadraticCurveTo(6, -10, 8, -2); q.lineTo(-1, -3); q.closePath();
          parts.push({ p: pMove(q, e[0], e[1], e[2]), f: '#f59aa8', noOut: 1 });
        });
        break;
    }
    // 머리
    parts.push({ p: pEll(hx, hy, 30, 26.5), f: soft2(c0, hx, hy, 30, fur) });
    // 머리 무늬(머리 안으로 자른다)
    parts.push({ fn: function (c) {
      c.save(); c.beginPath(); c.ellipse(hx, hy, 30, 26.5, 0, 0, Math.PI * 2); c.clip();
      if (s.mask) { // 펭귄 흰 얼굴
        c.fillStyle = soft2(c, hx + 5, hy + 6, 24, '#ffffff'); c.beginPath(); c.moveTo(hx + 5, hy - 6); c.bezierCurveTo(hx - 2, hy - 20, hx - 24, hy - 14, hx - 20, hy + 6); c.bezierCurveTo(hx - 16, hy + 26, hx + 28, hy + 28, hx + 30, hy + 6); c.bezierCurveTo(hx + 32, hy - 14, hx + 12, hy - 20, hx + 5, hy - 6); c.fill();
      }
      if (s.snout === 'monkey') {
        c.fillStyle = soft2(c, hx + 5, hy + 6, 24, s.belly); c.beginPath(); c.moveTo(hx + 5, hy - 4); c.bezierCurveTo(hx - 2, hy - 18, hx - 22, hy - 12, hx - 18, hy + 6); c.bezierCurveTo(hx - 14, hy + 24, hx + 26, hy + 26, hx + 28, hy + 6); c.bezierCurveTo(hx + 30, hy - 12, hx + 12, hy - 18, hx + 5, hy - 4); c.fill();
      }
      if (s.patch) { c.fillStyle = s.patch; c.beginPath(); c.ellipse(hx + 17, hy - 2, 10, 11, 0.3, 0, Math.PI * 2); c.fill(); }
      if (s.stripes) {
        c.fillStyle = s.stripes;
        function stripe(x, y, w, h, a) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, h * 0.4, 0, h); c.quadraticCurveTo(0, h * 0.4, w, 0); c.closePath(); c.fill(); c.restore(); }
        stripe(hx + 4, hy - 27, 3.2, 12, 0); stripe(hx - 5, hy - 26, 2.6, 9, -0.15); stripe(hx + 13, hy - 26, 2.6, 9, 0.15);
        stripe(hx - 31, hy + 2, 3, 11, -1.45); stripe(hx - 30, hy + 9, 2.4, 8, -1.35);
        stripe(hx + 31, hy + 1, 2.6, 8, 1.45);
      }
      if (s.spots) { c.fillStyle = s.spots; [[-16, -14, 2.2], [-6, -20, 2], [4, -22, 1.8], [14, -19, 2], [-22, -4, 2], [22, -10, 1.8], [-24, 8, 1.8]].forEach(function (d) { c.beginPath(); c.arc(hx + d[0], hy + d[1], d[2], 0, 7); c.fill(); }); }
      if (s.patches) { c.fillStyle = '#34343c'; c.beginPath(); c.ellipse(hx - 5, hy + 3, 8, 10, -0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(hx + 17, hy + 2, 7, 9, 0.5, 0, 7); c.fill(); }
      // 머리 위 반사광
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(hx - 10, hy - 15, 11, 5.5, -0.35, 0, 7); c.fill();
      c.restore();
    } });
    // 앞쪽에 오는 귀
    if (s.ear === 'flop') {
      [[hx - 25, hy - 12, 0.25 + bounce * 0.12, 1], [hx + 27, hy - 14, -0.3 - bounce * 0.1, 0.9]].forEach(function (e) {
        var p = new Path2D(), k = e[3]; p.moveTo(-6 * k, -4); p.bezierCurveTo(-15 * k, 6, -13 * k, 26 * k, -3, 27 * k); p.bezierCurveTo(8 * k, 27 * k, 10 * k, 8, 6 * k, -4); p.closePath();
        parts.push({ p: pMove(p, e[0], e[1], e[2]), f: lin(c0, e[0] - 10, e[1], e[0] + 8, e[1] + 26, s.earCol), sep: 1 });
      });
    }
    if (s.ear === 'side') {
      parts.push({ p: pEll(hx - 31, hy + 3, 9, 10.5), f: soft2(c0, hx - 31, hy + 3, 10, fur), sep: 1 });
      parts.push({ p: pEll(hx - 31, hy + 4, 5, 6), f: s.belly, noOut: 1 });
    }
    if (s.ear === 'tuft') {
      parts.push({ fn: function (c) { c.fillStyle = fur; c.strokeStyle = out; c.lineWidth = 2; c.beginPath(); c.moveTo(hx - 2, hy - 25); c.quadraticCurveTo(hx - 6, hy - 38, hx + 3, hy - 36); c.quadraticCurveTo(hx + 1, hy - 31, hx + 7, hy - 26); c.closePath(); c.fill(); c.stroke(); } });
    }
    // 얼굴
    parts.push({ fn: function (c) {
      var ex1 = hx - 4, ex2 = hx + 15, ey = hy + 1, mx = hx + 6, my = hy + 12;
      // 볼
      [[hx - 15, hy + 12, 6.5], [hx + 26, hy + 11, 5]].forEach(function (b) { var g = c.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]); g.addColorStop(0, 'rgba(255,120,140,.55)'); g.addColorStop(1, 'rgba(255,120,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(b[0], b[1], b[2], 0, 7); c.fill(); });
      // 주둥이
      switch (s.snout) {
        case 'dog': case 'bear': case 'panda':
          var mc = s.snout === 'bear' ? s.belly : '#ffffff';
          ell(c, mx, my + 1, 11, 8, 0, soft2(c, mx, my + 1, 11, mc));
          ell(c, mx, my - 3, 4.6, 3.3, 0, '#3a2a26'); ell(c, mx - 1.3, my - 4.2, 1.6, 1, 0, 'rgba(255,255,255,.8)');
          break;
        case 'cat': case 'tiger':
          ell(c, mx - 4, my + 2, 6.5, 5.5, 0, s.belly); ell(c, mx + 4.5, my + 2, 6.5, 5.5, 0, s.belly);
          c.fillStyle = '#f07a8e'; c.beginPath(); c.moveTo(mx - 3, my - 3); c.lineTo(mx + 3.5, my - 3); c.quadraticCurveTo(mx + 1, my + 1.5, mx + 0.2, my + 1); c.closePath(); c.fill();
          c.strokeStyle = rgba(out, 0.55); c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(mx - 10, my + 1); c.lineTo(mx - 22, my - 1); c.moveTo(mx - 10, my + 4); c.lineTo(mx - 21, my + 6); c.moveTo(mx + 11, my + 1); c.lineTo(mx + 22, my - 2); c.moveTo(mx + 11, my + 4); c.lineTo(mx + 21, my + 6); c.stroke();
          break;
        case 'rabbit':
          ell(c, mx - 3.5, my + 2, 5.5, 4.5, 0, '#ffffff'); ell(c, mx + 3.5, my + 2, 5.5, 4.5, 0, '#ffffff');
          ell(c, mx, my - 2, 3, 2.2, 0, '#f08aa0');
          break;
        case 'pig':
          ell(c, mx + 1, my, 10.5, 7.5, 0, soft2(c, mx + 1, my, 10, '#ffa3b0'), shade('#ffa3b0', -0.3), 1.6);
          ell(c, mx - 3, my, 2, 3, 0, '#b0606e'); ell(c, mx + 5, my, 2, 3, 0, '#b0606e');
          break;
        case 'bill':
          c.fillStyle = soft2(c, mx + 6, my, 14, '#ffa040'); c.strokeStyle = '#c0661a'; c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(mx - 8, my - 4); c.bezierCurveTo(mx + 6, my - 9, mx + 24, my - 6, mx + 24, my + 1); c.bezierCurveTo(mx + 22, my + 7, mx + 2, my + 7, mx - 8, my + 4); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(mx - 6, my + 1); c.quadraticCurveTo(mx + 10, my + 2.5, mx + 22, my + 1); c.stroke();
          break;
        case 'beak':
          c.fillStyle = soft2(c, mx, my - 2, 8, '#ffb040'); c.strokeStyle = '#c0661a'; c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(mx - 6, my - 5); c.quadraticCurveTo(mx + 6, my - 7, mx + 11, my - 1); c.quadraticCurveTo(mx + 4, my + 4, mx - 6, my + 2); c.closePath(); c.fill(); c.stroke();
          break;
        case 'monkey':
          ell(c, mx - 2, my - 2, 1.3, 1.6, 0, '#4e2e18'); ell(c, mx + 3, my - 2, 1.3, 1.6, 0, '#4e2e18');
          break;
        case 'turtle':
          ell(c, mx - 2, my - 4, 1.2, 1, 0, '#3f6a2c'); ell(c, mx + 3, my - 4, 1.2, 1, 0, '#3f6a2c');
          break;
      }
      if (s.spots) { c.strokeStyle = 'rgba(58,36,16,.8)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex1 + 4, ey + 6); c.quadraticCurveTo(ex1 + 4, ey + 9, mx - 6, my - 2); c.moveTo(ex2 - 3, ey + 6); c.quadraticCurveTo(ex2 - 3, ey + 9, mx + 7, my - 2); c.stroke(); }
      if (s.cheekLine) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(hx - 28, hy + 8); c.quadraticCurveTo(hx - 18, hy + 4, hx - 10, hy + 8); c.stroke(); }
      // 눈
      var wink = mood === 'tease';
      if (wink) { c.strokeStyle = '#2a1a14'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(ex1 - 5, ey); c.lineTo(ex1 + 4, ey + 2); c.lineTo(ex1 - 4, ey + 4); c.stroke(); }
      else eye(c, ex1, ey, 5.4, 6.8, mood, blink);
      eye(c, ex2, ey - 0.5, 4.8, 6.2, mood, blink);
      if (s.patches && !(blink || mood === 'happy' || mood === 'cheer')) { /* 판다는 흰 반짝임이 잘 보인다 */ }
      // 입
      var oy = s.snout === 'bill' ? my + 9 : s.snout === 'beak' ? my + 6 : my + 5, ox = mx;
      c.strokeStyle = '#3a2420'; c.lineWidth = 1.8; c.lineCap = 'round';
      if (s.snout === 'bill' || s.snout === 'beak') { if (mood === 'happy' || mood === 'cheer') { ell(c, ox + 2, my + 4, 4, 2.5, 0, '#c8503a'); } return; }
      if (mood === 'happy' || mood === 'cheer') {
        c.fillStyle = '#8a2e3a'; c.beginPath(); c.moveTo(ox - 5, oy); c.quadraticCurveTo(ox, oy + 9, ox + 5, oy); c.closePath(); c.fill();
        ell(c, ox, oy + 4.5, 2.6, 1.6, 0, '#ff8a9a');
      } else if (mood === 'tease') {
        c.beginPath(); c.moveTo(ox - 4, oy); c.quadraticCurveTo(ox, oy + 3, ox + 4, oy); c.stroke();
        ell(c, ox + 1, oy + 4, 3, 3.6, 0, '#ff7a90', '#b8405a', 1);
      } else if (mood === 'sad' || mood === 'dizzy') {
        c.beginPath(); c.moveTo(ox - 4, oy + 3); c.quadraticCurveTo(ox, oy - 1, ox + 4, oy + 3); c.stroke();
      } else {
        c.beginPath(); c.moveTo(ox - 5, oy); c.quadraticCurveTo(ox - 2.5, oy + 3, ox, oy); c.quadraticCurveTo(ox + 2.5, oy + 3, ox + 5, oy); c.stroke();
      }
    } });
  }

  // 달리는 선수 한 명. x,y 는 발 닿는 자리. st: run(0~1), ph(걸음 위상), mood, num, trip(0~1), cheer, t, blink
  function runner(c, key, x, y, sc, st) {
    var s = SP[key] || SP.dog, run = st.run || 0, ph = st.ph || 0, trip = st.trip || 0, t = st.t || 0;
    var fur = s.fur, limb = s.limb || fur, paw = s.paw || shade(limb, -0.06), out = s.out;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    var air = Math.abs(Math.sin(ph)) * 4 * run;
    ell(c, 2, 0, 24 - air, 5.5, 0, 'rgba(20,20,30,' + (0.26 - air * 0.02) + ')');
    var bob = -air + (st.cheer ? -Math.abs(Math.sin(t * 8)) * 9 : 0);
    c.translate(0, bob);
    if (trip > 0) { c.translate(8 * trip, 0); c.rotate(trip * 1.1); } else c.rotate(0.1 * run);
    st.ctx = c;
    var parts = [];
    function arm(back) {
      var sx = back ? -10 : 11, sy = -46, a, len = 12;
      if (st.cheer) a = (back ? 1 : -1) * (2.5 + Math.sin(t * 8 + (back ? 1 : 0)) * 0.25);
      else a = (back ? 1 : -1) * Math.sin(ph) * 1.0 * run + (back ? -0.15 : 0.15);
      var col = back ? shade(limb, -0.14) : limb;
      if (s.wing) {
        var w = new Path2D(); w.ellipse(0, 9, 5.5, 12, 0, 0, Math.PI * 2);
        parts.push({ p: pMove(w, sx, sy, -a), f: lin(c, sx - 5, sy, sx + 5, sy + 20, col), sep: !back });
        return;
      }
      parts.push({ p: pMove(pLimb(10, len), sx, sy, -a), f: lin(c, sx - 5, sy, sx + 5, sy + len, col), sep: !back });
      var ex = sx + Math.sin(a) * len * 0.95, ey = sy + Math.cos(a) * len * 0.95;
      parts.push({ p: pEll(ex, ey, 6.4, 6.4), f: soft2(c, ex, ey, 6.5, back ? shade(paw, -0.14) : paw), sep: !back });
    }
    function leg(back) {
      var p = ph + (back ? Math.PI : 0), a = Math.sin(p) * 0.85 * run, lift = Math.max(0, -Math.cos(p)) * 5 * run;
      var hx = back ? -6 : 5, hy = -22, len = 14 - lift * 0.3;
      var col = back ? shade(limb, -0.14) : limb;
      parts.push({ p: pMove(pLimb(13, len), hx, hy, -a), f: lin(c, hx - 6, hy, hx + 6, hy + len, col), sep: !back });
      var fx = hx + Math.sin(a) * len + 3, fy = hy + Math.cos(a) * len - lift * 0.3;
      parts.push({ p: pEll(fx, fy, 9.5, 6.2, -a * 0.3), f: soft2(c, fx, fy, 8, back ? shade(paw, -0.14) : paw), sep: !back });
    }
    function tail() {
      var sw = Math.sin(ph * 2 + t * (run ? 0 : 3)) * (0.2 + 0.2 * run), bx = -15, by = -34;
      var R = function (px, py) { var ca = Math.cos(sw), sa = Math.sin(sw); return [bx + px * ca - py * sa, by + px * sa + py * ca]; };
      var p = new Path2D(), q;
      switch (s.tail) {
        case 'curl': q = [R(0, 0), R(-14, -4), R(-12, -20)]; p.moveTo(q[0][0], q[0][1]); p.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]); parts.push({ line: p, w: 8, col: fur, hi: 1 }); break;
        case 'long': q = [R(0, 0), R(-18, 4), R(-26, -8), R(-30, -24)]; p.moveTo(q[0][0], q[0][1]); p.bezierCurveTo(q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]); parts.push({ line: p, w: 7, col: fur, hi: 1 });
          parts.push({ fn: function (c) { if (s.stripes) { c.strokeStyle = s.stripes; c.lineWidth = 7.2; c.setLineDash([3, 6]); c.lineCap = 'butt'; c.stroke(p); c.setLineDash([]); c.lineCap = 'round'; } if (s.spots) { c.fillStyle = s.spots; [[-10, 2], [-19, -1], [-25, -12]].forEach(function (d) { var r = R(d[0], d[1]); c.beginPath(); c.arc(r[0], r[1], 1.8, 0, 7); c.fill(); }); } } });
          break;
        case 'curlLong': q = [R(0, 0), R(-20, 6), R(-28, -20), R(-16, -26)]; p.moveTo(q[0][0], q[0][1]); p.bezierCurveTo(q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]); var q2 = R(-8, -22), q3 = R(-13, -17); p.quadraticCurveTo(q2[0], q2[1], q3[0], q3[1]); parts.push({ line: p, w: 5.5, col: fur }); break;
        case 'curly': q = [R(0, 0), R(-10, 2), R(-12, -9), R(-6, -9)]; p.moveTo(q[0][0], q[0][1]); p.bezierCurveTo(q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]); var r2 = R(-2, -8), r3 = R(-6, -4); p.quadraticCurveTo(r2[0], r2[1], r3[0], r3[1]); parts.push({ line: p, w: 3.5, col: fur }); break;
        case 'bushy':
          var b = new Path2D(); b.moveTo(4, 4); b.bezierCurveTo(-26, 8, -40, -30, -22, -52); b.bezierCurveTo(-10, -66, 12, -60, 8, -44); b.bezierCurveTo(4, -32, -12, -34, -10, -20); b.bezierCurveTo(-8, -8, 0, -2, 4, 4); b.closePath();
          var bp = pMove(b, bx + 2, by + 2, sw * 0.6 - 0.15);
          parts.push({ p: bp, f: lin(c, bx - 30, by - 50, bx, by, fur) });
          parts.push({ fn: function (c) { c.save(); c.clip(bp); c.fillStyle = rgba(s.belly, 0.7); c.beginPath(); c.ellipse(bx - 14, by - 26, 7, 22, 0.3 + sw * 0.6, 0, 7); c.fill(); c.restore(); } });
          break;
        case 'puff': parts.push({ p: pEll(bx, by + 6, 8, 8), f: soft2(c, bx, by + 6, 8, '#ffffff') }); break;
        case 'feather': var f = new Path2D(); f.moveTo(0, -4); f.lineTo(-13, -12); f.quadraticCurveTo(-12, -2, -15, 3); f.lineTo(0, 4); f.closePath(); parts.push({ p: pMove(f, bx + 2, by + 4, sw), f: fur }); break;
        default: parts.push({ p: pEll(bx + 1, by + 6, 6, 5), f: fur });
      }
    }
    arm(true); leg(true); tail();
    // 몸통
    var body = pEll(0, -38, 18, 20, 0.08);
    parts.push({ p: body, f: soft2(c, 0, -38, 20, fur) });
    parts.push({ fn: function (c) {
      c.save(); c.clip(body);
      if (s.belly !== fur) { c.fillStyle = rgba(s.belly, 0.9); c.beginPath(); c.ellipse(4, -30, 11, 12, 0, 0, 7); c.fill(); }
      var kg = c.createLinearGradient(-18, -52, 18, -18); kg.addColorStop(0, shade(s.kit, 0.3)); kg.addColorStop(0.55, s.kit); kg.addColorStop(1, shade(s.kit, -0.3));
      c.fillStyle = kg; c.beginPath(); c.moveTo(-22, -48); c.quadraticCurveTo(0, -42, 22, -50); c.lineTo(22, -26); c.lineTo(-22, -26); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-22, -48); c.quadraticCurveTo(0, -42, 22, -50); c.stroke();
      c.fillStyle = shade(s.kit, -0.42); c.fillRect(-22, -27, 44, 12);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-22, -27.5, 44, 1.8);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-8, -44, 6, 3, -0.4, 0, 7); c.fill();
      c.restore();
      // 번호표
      c.save(); c.translate(5, -36); c.rotate(-0.06);
      c.fillStyle = '#fbfaf4'; c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.beginPath(); c.rect(-7, -5.5, 14, 11); c.fill(); c.stroke();
      c.fillStyle = '#222'; c.font = 'bold 9px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(st.num || 1), 0, 0.5);
      c.restore();
    } });
    if (s.shell) {
      var sh = pEll(-10, -40, 15, 20, -0.15);
      parts.push({ p: sh, f: soft2(c, -10, -40, 20, s.shell) });
      parts.push({ fn: function (c) {
        c.save(); c.clip(sh); c.strokeStyle = shade(s.shell, 0.35); c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(-12, -54); c.lineTo(-6, -46); c.lineTo(-8, -34); c.lineTo(-14, -27); c.moveTo(-6, -46); c.lineTo(3, -48); c.moveTo(-8, -34); c.lineTo(3, -32); c.moveTo(-12, -54); c.lineTo(-22, -46); c.moveTo(-14, -27); c.lineTo(-24, -32); c.stroke();
        c.strokeStyle = shade(s.shell, -0.35); c.lineWidth = 3; c.beginPath(); c.ellipse(-10, -40, 14, 19, -0.15, 0, 7); c.stroke();
        c.restore();
      } });
    }
    leg(false);
    headParts(parts, s, 7, -78, st);
    arm(false);
    render(c, parts, out);
    c.restore();
  }

  // 얼굴 동그라미(목록·진행막대용)
  function portrait(key, size, mood) {
    var cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = cv.height = Math.round(size * d);
    var c = cv.getContext('2d'); c.scale(d, d);
    c.save(); c.beginPath(); c.arc(size / 2, size / 2, size / 2, 0, 7); c.clip();
    var s = SP[key], g = c.createLinearGradient(0, 0, 0, size); g.addColorStop(0, shade(s.kit, 0.5)); g.addColorStop(1, shade(s.kit, 0.12));
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    var k = size / 70;
    runner(c, key, size / 2 - 7 * k, size * 0.56 + 78 * k, k, { run: 0, ph: 0, num: '', mood: mood || 'normal', t: 0 });
    c.restore();
    return cv;
  }

  // ── 코스 12곳 ──
  var TH = [
    { ko: '학교 운동장', en: 'School Field', sky: ['#5aa9e8', '#a9d8f5', '#e6f4fb'], sun: [0.8, 0.16, '#fff6c8'], far: ['hill', '#8fbf8a'], mid: 'school', track: ['#c8553d', '#fff'], grass: '#6fb04f', tint: null },
    { ko: '벚꽃 공원', en: 'Blossom Park', sky: ['#8cc2ea', '#d6e8f5', '#fbe9ef'], sun: [0.2, 0.18, '#fff8e0'], far: ['hill', '#a8c79a'], mid: 'cherry', track: ['#d9b98a', '#fff6e6'], grass: '#86bd5c', fx: 'petal' },
    { ko: '바닷가', en: 'Seaside', sky: ['#3f9be0', '#8fd0f2', '#dff3fa'], sun: [0.75, 0.14, '#fffbe0'], far: ['sea', '#2f8fc4'], mid: 'palm', track: ['#e8cf9c', '#fffaf0'], grass: '#f0dcae' },
    { ko: '숲길', en: 'Forest Trail', sky: ['#7fb6c9', '#bcdad8', '#e5efe2'], sun: [0.3, 0.12, '#fffbe8'], far: ['pine', '#6f9a86'], mid: 'forest', track: ['#9b7550', '#e2cfb2'], grass: '#4f8f45', fog: '#dfeae0' },
    { ko: '시골 논길', en: 'Rice Fields', sky: ['#6fb3e4', '#b9dcef', '#f3efd8'], sun: [0.65, 0.15, '#fff5d0'], far: ['mount', '#7f9fb0'], mid: 'farm', track: ['#b08a5e', '#ecdcc0'], grass: '#9cc454' },
    { ko: '사막', en: 'Desert', sky: ['#e98f4f', '#f6c27a', '#fbe3b0'], sun: [0.7, 0.2, '#fff0c0'], far: ['dune', '#d99a5a'], mid: 'cactus', track: ['#cf8a52', '#f8dcb4'], grass: '#e2b377', tint: 'rgba(255,150,60,.06)' },
    { ko: '눈밭', en: 'Snowfield', sky: ['#8fb4d8', '#c9dcec', '#eef4f8'], sun: [0.25, 0.2, '#ffffff'], far: ['snowmount', '#b8cde0'], mid: 'snowpine', track: ['#dfe8f0', '#7fa6cf'], grass: '#f4f8fb', fx: 'snow' },
    { ko: '단풍 산길', en: 'Maple Hills', sky: ['#e8a86a', '#f3cf9a', '#f8e6c4'], sun: [0.78, 0.22, '#fff0c8'], far: ['mount', '#b8745a'], mid: 'maple', track: ['#8f6a48', '#e8d0a8'], grass: '#c29a4a', fx: 'leaf', tint: 'rgba(255,120,40,.06)' },
    { ko: '노을 강변', en: 'Sunset River', sky: ['#3e3a78', '#d9657a', '#fbb36a'], sun: [0.6, 0.42, '#ffe0a0'], far: ['city', '#6a4a70'], mid: 'river', track: ['#5a5062', '#f2d2b0'], grass: '#6d7a52', tint: 'rgba(255,110,80,.08)' },
    { ko: '도시의 밤', en: 'City Night', sky: ['#0d1330', '#23305e', '#4a4a7a'], sun: [0.18, 0.14, '#f4f0dc', 'moon'], far: ['cityN', '#1c2244'], mid: 'street', track: ['#3a3d4c', '#9fd8ff'], grass: '#2c3a36', night: 1 },
    { ko: '야간 경기장', en: 'Night Stadium', sky: ['#0b1026', '#1a2450', '#2c3a6a'], sun: [0.85, 0.12, '#f4f0dc', 'moon'], far: ['stand', '#202a4a'], mid: 'lights', track: ['#b44a38', '#ffffff'], grass: '#2f7a3c', night: 1 },
    { ko: '챔피언 경기장', en: 'Champion Stadium', sky: ['#3d8fe0', '#9ccff2', '#e8f5fc'], sun: [0.5, 0.1, '#fffbe8'], far: ['standBig', '#5a6a8a'], mid: 'flags', track: ['#c24a36', '#ffffff'], grass: '#58a84a', fx: 'confetti' }
  ];

  // 먼 산·도시 윤곽 높이
  function farY(type, x, i) {
    var a = seeded(i * 7 + 1) * 6, b = seeded(i * 7 + 2) * 6;
    switch (type) {
      case 'hill': return 0.5 + 0.18 * Math.sin(x * 0.004 + a) + 0.1 * Math.sin(x * 0.011 + b);
      case 'mount': case 'snowmount': case 'pine': return 0.35 + 0.28 * Math.abs(Math.sin(x * 0.0035 + a)) + 0.12 * Math.sin(x * 0.013 + b);
      case 'dune': return 0.55 + 0.2 * Math.sin(x * 0.003 + a) * Math.sin(x * 0.007 + b);
      default: return 0.5;
    }
  }

  // 한 코스의 배경. L = 논리 너비, H = 540. cam = 카메라 x(세상 좌표)
  var GROUND = 280;
  function sky(c, th, L, H, t) {
    var g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.6, th.sky[1]); g.addColorStop(1, th.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, L, GROUND + 4);
    var sx = th.sun[0] * L, sy = th.sun[1] * GROUND * 1.4, moon = th.sun[3] === 'moon';
    if (th.night) { for (var i = 0; i < 70; i++) { var px = seeded(i + 3) * L, py = seeded(i + 99) * GROUND * 0.8, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); c.fillStyle = 'rgba(255,255,240,' + (0.25 + 0.5 * tw * seeded(i + 7)) + ')'; c.fillRect(px, py, 1.6, 1.6); } }
    var gl = c.createRadialGradient(sx, sy, 4, sx, sy, moon ? 70 : 140);
    gl.addColorStop(0, rgba(th.sun[2], moon ? 0.5 : 0.85)); gl.addColorStop(1, rgba(th.sun[2], 0));
    c.fillStyle = gl; c.beginPath(); c.arc(sx, sy, moon ? 70 : 140, 0, 7); c.fill();
    ell(c, sx, sy, moon ? 18 : 26, moon ? 18 : 26, 0, th.sun[2]);
    if (moon) { ell(c, sx - 5, sy - 3, 4, 4, 0, 'rgba(0,0,0,.07)'); ell(c, sx + 6, sy + 5, 3, 3, 0, 'rgba(0,0,0,.06)'); }
  }
  function clouds(c, th, L, cam, t) {
    if (th.night) return;
    var par = 0.05, sp = 380, off = cam * par + t * 6, i0 = Math.floor(off / sp) - 1;
    for (var i = i0; i < i0 + L / sp + 3; i++) {
      var x = i * sp - off + seeded(i) * 160, y = 40 + seeded(i + 40) * 110, w = 70 + seeded(i + 80) * 90;
      if (seeded(i + 11) < 0.35) continue;
      var base = th.sky[2];
      for (var k = 0; k < 5; k++) {
        var kx = x + (k - 2) * w * 0.28, ky = y - Math.sin(k / 4 * Math.PI) * w * 0.18, r = w * (0.22 + 0.12 * Math.sin(k / 4 * Math.PI));
        var g = c.createRadialGradient(kx - r * 0.3, ky - r * 0.4, r * 0.1, kx, ky, r);
        g.addColorStop(0, 'rgba(255,255,255,.92)'); g.addColorStop(0.55, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(kx, ky, r, 0, 7); c.fill();
      }
    }
  }
  function far(c, th, L, cam, t) {
    var type = th.far[0], col = th.far[1], par = 0.12, off = cam * par;
    if (type === 'sea') {
      var hz = GROUND - 70; c.fillStyle = shade(col, 0.1); c.fillRect(0, hz, L, GROUND - hz + 2);
      var g = c.createLinearGradient(0, hz, 0, GROUND); g.addColorStop(0, rgba('#bfe6f5', 0.5)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, hz, L, GROUND - hz);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2;
      for (var w = 0; w < 26; w++) { var wx = ((seeded(w) * 1600 - off * 1.4 - t * 8) % 1600 + 1600) % 1600 * L / 1600, wy = hz + 8 + seeded(w + 5) * 60; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + 10 + seeded(w + 9) * 16, wy); c.stroke(); }
      // 섬
      var ix = ((900 - off * 0.5) % 2200 + 2200) % 2200 - 300;
      c.fillStyle = shade('#5f9a86', 0.25); c.beginPath(); c.moveTo(ix, hz + 1); c.quadraticCurveTo(ix + 60, hz - 34, ix + 150, hz + 1); c.fill();
      return;
    }
    if (type === 'city' || type === 'cityN') {
      var sp = 44, i0 = Math.floor(off / sp) - 1;
      for (var i = i0; i < i0 + L / sp + 3; i++) {
        var bw = 30 + seeded(i) * 30, bh = 50 + seeded(i + 3) * 120, x = i * sp - off, y = GROUND - bh;
        c.fillStyle = type === 'cityN' ? shade(col, seeded(i + 5) * 0.12) : mix(col, th.sky[2], 0.25 + seeded(i + 5) * 0.2); c.fillRect(x, y, bw, bh + 2);
        if (type === 'cityN') { for (var wy2 = y + 8; wy2 < GROUND - 8; wy2 += 11) for (var wx2 = x + 5; wx2 < x + bw - 5; wx2 += 8) if (seeded(i * 31 + wy2 * 3 + wx2) < 0.35) { c.fillStyle = seeded(wx2 + wy2) < 0.5 ? 'rgba(255,220,140,.85)' : 'rgba(170,220,255,.7)'; c.fillRect(wx2, wy2, 4, 5); } }
      }
      if (type === 'city') { // 다리
        var bx = ((600 - off) % 1800 + 1800) % 1800 - 400; c.strokeStyle = rgba('#3a2a48', 0.6); c.lineWidth = 3;
        c.beginPath(); c.moveTo(bx, GROUND - 40); c.quadraticCurveTo(bx + 200, GROUND - 90, bx + 400, GROUND - 40); c.stroke(); c.fillStyle = rgba('#3a2a48', 0.6); c.fillRect(bx, GROUND - 42, 400, 5);
      }
      return;
    }
    if (type === 'stand' || type === 'standBig') {
      var top = type === 'standBig' ? 70 : 120, sg = c.createLinearGradient(0, top, 0, GROUND);
      sg.addColorStop(0, shade(col, -0.2)); sg.addColorStop(1, shade(col, 0.1)); c.fillStyle = sg; c.fillRect(0, top, L, GROUND - top);
      var rows = type === 'standBig' ? 12 : 8, rh = (GROUND - top - 22) / rows, cs = 12, ox = off * 1.2;
      for (var r = 0; r < rows; r++) {
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, top + r * rh + rh - 2, L, 2);
        var i1 = Math.floor(ox / cs) - 1;
        for (var k = i1; k < i1 + L / cs + 2; k++) {
          var sd = seeded(k * 13 + r * 71); if (type === 'stand' && sd < 0.35) continue;
          var px = k * cs - ox + (r % 2) * 6, py = top + r * rh + rh * 0.55 + Math.sin(t * 6 + k + r) * (th.cheer ? 2.5 : 0.8);
          var pc = ['#e8483c', '#f2c230', '#3d8fe0', '#ffffff', '#3db07a', '#f28a2c', '#d84a7a'][Math.floor(sd * 7)];
          c.fillStyle = th.night ? shade(pc, -0.45) : shade(pc, -0.1); c.fillRect(px - 3.5, py - 1, 7, rh * 0.45);
          c.fillStyle = th.night ? '#6a5a50' : '#f0c8a0'; c.beginPath(); c.arc(px, py - 3, 3, 0, 7); c.fill();
        }
      }
      c.fillStyle = shade(col, -0.35); c.fillRect(0, GROUND - 22, L, 22);
      c.fillStyle = type === 'standBig' ? '#1f6fd0' : '#243a7a'; c.fillRect(0, GROUND - 20, L, 14);
      var ad = 260, a0 = Math.floor(off * 1.2 / ad) - 1;
      c.font = 'bold 11px Arial, sans-serif'; c.textBaseline = 'middle';
      for (var q = a0; q < a0 + L / ad + 2; q++) { var ax = q * ad - off * 1.2; c.fillStyle = ['#ffd84a', '#ffffff', '#ff8a70'][((q % 3) + 3) % 3]; c.fillRect(ax + 10, GROUND - 18, 120, 10); c.fillStyle = '#1a2450'; c.fillText('OREUM GAMES', ax + 22, GROUND - 13); }
      return;
    }
    // 산·언덕·모래언덕
    for (var layer = 0; layer < 2; layer++) {
      var lo = off * (layer ? 1.6 : 1), fc = layer ? col : mix(col, th.sky[2], 0.45);
      var hgt = layer ? 150 : 210;
      c.beginPath(); c.moveTo(0, GROUND);
      for (var x2 = 0; x2 <= L + 10; x2 += 10) { var yy = GROUND - hgt * farY(type, x2 + lo, layer + 1); c.lineTo(x2, yy); }
      c.lineTo(L, GROUND); c.closePath();
      var mg = c.createLinearGradient(0, GROUND - hgt, 0, GROUND); mg.addColorStop(0, shade(fc, 0.08)); mg.addColorStop(1, mix(fc, th.sky[2], 0.3));
      c.fillStyle = mg; c.fill();
      if (type === 'snowmount' && !layer) { c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(0, GROUND - hgt, L, hgt * 0.35); c.restore(); }
      if (type === 'pine' && layer) { c.fillStyle = shade(col, -0.12); for (var p = Math.floor(lo / 16); p < Math.floor(lo / 16) + L / 16 + 2; p++) { var px2 = p * 16 - lo, py2 = GROUND - hgt * farY(type, p * 16, 2) + 6, ph = 14 + seeded(p) * 12; c.beginPath(); c.moveTo(px2 - 6, py2 + 4); c.lineTo(px2, py2 - ph); c.lineTo(px2 + 6, py2 + 4); c.fill(); } }
    }
    if (th.fog) { var fg = c.createLinearGradient(0, GROUND - 90, 0, GROUND); fg.addColorStop(0, rgba(th.fog, 0)); fg.addColorStop(1, rgba(th.fog, 0.8)); c.fillStyle = fg; c.fillRect(0, GROUND - 90, L, 90); }
  }

  // 나무 한 그루(가운데 줄기, 둥근 잎 뭉치 여러 개)
  function tree(c, x, y, h, leaf, trunk, sd, blossom) {
    ell(c, x + 8, y, h * 0.3, 5, 0, 'rgba(20,30,20,.22)');
    c.fillStyle = trunk; c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x - 2, y - h * 0.4, x - 1, y - h * 0.62); c.lineTo(x + 3, y - h * 0.62); c.quadraticCurveTo(x + 3, y - h * 0.4, x + 5, y); c.fill();
    c.fillStyle = shade(trunk, 0.25); c.fillRect(x - 2, y - h * 0.55, 1.5, h * 0.5);
    var n = 6, k, cx, cy, rr, a;
    for (k = 0; k < n; k++) { // 뒤 잎(어둡게)
      a = k / n * Math.PI * 2 + sd * 6; rr = h * (0.19 + seeded(sd * 40 + k) * 0.08);
      cx = x + Math.cos(a) * h * 0.22; cy = y - h * 0.7 + Math.sin(a) * h * 0.13;
      ell(c, cx, cy, rr, rr * 0.9, 0, soft(c, cx, cy, rr, shade(leaf, -0.22)));
    }
    for (k = 0; k < 5; k++) { // 앞 잎(빛 받는 쪽)
      a = -Math.PI * 0.85 + k * 0.42 + sd; rr = h * (0.15 + seeded(sd * 70 + k) * 0.06);
      cx = x + Math.cos(a) * h * 0.13 - h * 0.04; cy = y - h * 0.76 + Math.sin(a) * h * 0.1;
      ell(c, cx, cy, rr, rr * 0.9, 0, soft(c, cx, cy, rr, shade(leaf, 0.06)));
    }
    if (blossom) for (var b = 0; b < 16; b++) { var bx = x + (seeded(sd + b) - 0.5) * h * 0.6, by = y - h * 0.72 + (seeded(sd * 3 + b) - 0.5) * h * 0.4; c.fillStyle = seeded(b + sd) < 0.5 ? '#fff4f7' : '#f7a9c0'; c.beginPath(); c.arc(bx, by, 2.2, 0, 7); c.fill(); }
  }
  function pine(c, x, y, h, col, snow) {
    ell(c, x + 6, y, h * 0.25, 4, 0, 'rgba(20,30,40,.22)');
    c.fillStyle = '#6a4a30'; c.fillRect(x - 3, y - h * 0.2, 6, h * 0.2);
    for (var k = 0; k < 4; k++) {
      var ty = y - h * 0.16 - k * h * 0.2, w = h * (0.34 - k * 0.07);
      var g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, shade(col, 0.15)); g.addColorStop(1, shade(col, -0.3));
      c.fillStyle = g; c.beginPath(); c.moveTo(x - w, ty); c.lineTo(x, ty - h * 0.32); c.lineTo(x + w, ty); c.closePath(); c.fill();
      if (snow) { c.fillStyle = '#fbfdff'; c.beginPath(); c.moveTo(x - w * 0.55, ty - h * 0.12); c.lineTo(x, ty - h * 0.32); c.lineTo(x + w * 0.4, ty - h * 0.14); c.quadraticCurveTo(x, ty - h * 0.08, x - w * 0.55, ty - h * 0.12); c.fill(); }
    }
  }
  function mid(c, th, L, cam, t) {
    var par = 0.45, off = cam * par, type = th.mid, base = GROUND + 2;
    var sp = { school: 170, cherry: 150, palm: 210, forest: 70, farm: 190, cactus: 200, snowpine: 80, maple: 120, river: 160, street: 180, lights: 420, flags: 140 }[type] || 160;
    var i0 = Math.floor(off / sp) - 2;
    if (type === 'farm') { // 논 줄
      c.fillStyle = shade(th.grass, -0.08); c.fillRect(0, GROUND - 26, L, 28);
      c.strokeStyle = rgba('#e8f4c0', 0.5); c.lineWidth = 1; for (var r = 0; r < 4; r++) { c.beginPath(); c.moveTo(0, GROUND - 22 + r * 6); c.lineTo(L, GROUND - 22 + r * 6); c.stroke(); }
    }
    if (type === 'river') { c.fillStyle = '#e28c78'; c.fillRect(0, GROUND - 16, L, 18); c.fillStyle = 'rgba(255,230,180,.55)'; for (var s2 = 0; s2 < 30; s2++) { var rx = ((seeded(s2) * 1400 - off * 1.2 - t * 12) % 1400 + 1400) % 1400; c.fillRect(rx * L / 1400, GROUND - 14 + seeded(s2 + 1) * 12, 14, 1.5); } }
    for (var i = i0; i < i0 + L / sp + 4; i++) {
      var x = i * sp - off + seeded(i * 3) * sp * 0.5, sd = seeded(i * 5 + 1), y = base;
      switch (type) {
        case 'school':
          if (((i % 6) + 6) % 6 === 0) { var bw = 260, bh = 110; c.fillStyle = ball(c, x + 60, y - 90, 200, '#f1e3c8'); c.fillRect(x - 20, y - bh, bw, bh); c.fillStyle = shade('#f1e3c8', -0.25); c.fillRect(x - 20, y - bh - 8, bw, 10); for (var fl = 0; fl < 3; fl++) for (var wi = 0; wi < 8; wi++) { c.fillStyle = '#7fb3d8'; c.fillRect(x - 8 + wi * 31, y - bh + 14 + fl * 32, 20, 18); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 8 + wi * 31, y - bh + 14 + fl * 32, 20, 4); } c.fillStyle = '#e8e2d0'; c.fillRect(x + 100, y - bh - 36, 40, 30); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 120, y - bh - 21, 11, 0, 7); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 120, y - bh - 21); c.lineTo(x + 120, y - bh - 29); c.moveTo(x + 120, y - bh - 21); c.lineTo(x + 126, y - bh - 21); c.stroke(); }
          else tree(c, x, y, 90 + sd * 40, '#5fa048', '#7a5234', i, false);
          break;
        case 'cherry': tree(c, x, y, 100 + sd * 40, sd < 0.5 ? '#f6c3d2' : '#f2b0c6', '#6e4a3e', i, true); break;
        case 'palm':
          c.save(); c.translate(x, y); ell(c, 14, 0, 30, 4, 0, 'rgba(60,40,20,.2)');
          var ph2 = 120 + sd * 50; c.strokeStyle = '#8a6a48'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -ph2 * 0.5, 8 + sd * 16, -ph2); c.stroke();
          c.strokeStyle = 'rgba(60,40,20,.35)'; c.lineWidth = 7; c.setLineDash([2, 6]); c.stroke(); c.setLineDash([]);
          for (var fr = 0; fr < 7; fr++) { var fa = -Math.PI / 2 + (fr - 3) * 0.55 + Math.sin(t * 1.5 + i + fr) * 0.04; c.strokeStyle = fr % 2 ? '#3f9a4a' : '#58b25a'; c.lineWidth = 5; c.beginPath(); c.moveTo(8 + sd * 16, -ph2); c.quadraticCurveTo(8 + sd * 16 + Math.cos(fa) * 40, -ph2 + Math.sin(fa) * 30 - 10, 8 + sd * 16 + Math.cos(fa) * 62, -ph2 + Math.sin(fa) * 20 + 22); c.stroke(); }
          if (sd < 0.45) { c.fillStyle = ['#ff6a5a', '#ffd84a', '#5ab0ff'][i & 2]; c.beginPath(); c.moveTo(60, -60); c.quadraticCurveTo(95, -84, 130, -60); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(94, -64, 2, 64); }
          c.restore(); break;
        case 'forest': pine(c, x, y, 110 + sd * 70, sd < 0.5 ? '#3f7a52' : '#356b48', false); break;
        case 'farm':
          if (sd < 0.2) { c.fillStyle = '#e8dcc0'; c.fillRect(x - 30, y - 60, 70, 40); c.fillStyle = '#c0503a'; c.beginPath(); c.moveTo(x - 38, y - 58); c.lineTo(x + 5, y - 86); c.lineTo(x + 48, y - 58); c.fill(); c.fillStyle = '#7a5234'; c.fillRect(x - 5, y - 44, 14, 24); }
          else if (sd < 0.35) { c.strokeStyle = '#6a4a30'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 28); c.lineTo(x, y - 70); c.moveTo(x - 18, y - 56); c.lineTo(x + 18, y - 56); c.stroke(); ell(c, x, y - 74, 8, 8, 0, '#f0d6a0'); c.fillStyle = '#c8a040'; c.beginPath(); c.moveTo(x - 14, y - 76); c.lineTo(x, y - 88); c.lineTo(x + 14, y - 76); c.fill(); c.fillStyle = '#4a7ac0'; c.fillRect(x - 8, y - 60, 16, 20); }
          else tree(c, x, y - 20, 70 + sd * 30, '#6aa84a', '#7a5234', i, false);
          break;
        case 'cactus':
          c.save(); c.translate(x, y); ell(c, 10, 0, 22, 4, 0, 'rgba(80,40,10,.2)');
          var ch = 50 + sd * 50, cg = c.createLinearGradient(-8, 0, 8, 0); cg.addColorStop(0, '#7fb35a'); cg.addColorStop(1, '#3f7a3a');
          c.strokeStyle = cg; c.lineCap = 'round'; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -ch); c.stroke();
          c.lineWidth = 9; c.beginPath(); c.moveTo(0, -ch * 0.45); c.lineTo(-14, -ch * 0.45); c.lineTo(-14, -ch * 0.75); c.moveTo(0, -ch * 0.6); c.lineTo(13, -ch * 0.6); c.lineTo(13, -ch * 0.85); c.stroke();
          if (sd > 0.7) { ell(c, 40, -6, 18, 10, 0, ball(c, 40, -8, 18, '#b8764a')); }
          c.restore(); break;
        case 'snowpine': pine(c, x, y, 100 + sd * 60, '#3f6a5a', true); break;
        case 'maple': tree(c, x, y, 95 + sd * 40, ['#e8602a', '#f29a2a', '#d8402a', '#f2c040'][Math.floor(sd * 4)], '#5e3e2a', i, false); break;
        case 'river':
          if (sd < 0.5) { c.strokeStyle = '#3a3040'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 90); c.quadraticCurveTo(x, y - 98, x + 10, y - 98); c.stroke(); var lg = c.createRadialGradient(x + 10, y - 94, 1, x + 10, y - 94, 40); lg.addColorStop(0, 'rgba(255,220,150,.8)'); lg.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = lg; c.beginPath(); c.arc(x + 10, y - 94, 40, 0, 7); c.fill(); ell(c, x + 10, y - 94, 4, 3, 0, '#fff0c0'); }
          else for (var rd = 0; rd < 9; rd++) { c.strokeStyle = rd % 2 ? '#8a7a4a' : '#a8905a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + rd * 4, y); c.quadraticCurveTo(x + rd * 4 + 4, y - 24, x + rd * 4 + 2 + Math.sin(t + rd) * 2, y - 36 - seeded(rd + i) * 14); c.stroke(); }
          break;
        case 'street':
          c.strokeStyle = '#1c1f2c'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 120); c.lineTo(x + 18, y - 124); c.stroke();
          var sg2 = c.createRadialGradient(x + 18, y - 118, 2, x + 18, y - 60, 90); sg2.addColorStop(0, 'rgba(255,214,140,.55)'); sg2.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = sg2; c.beginPath(); c.moveTo(x + 10, y - 120); c.lineTo(x - 40, y); c.lineTo(x + 80, y); c.closePath(); c.fill();
          ell(c, x + 18, y - 121, 6, 3, 0, '#fff2c8');
          if (sd < 0.3) { c.fillStyle = '#e04a8a'; c.font = 'bold 18px Arial'; c.shadowColor = '#ff4aa0'; c.shadowBlur = 12; c.fillText('24H', x + 40, y - 60); c.shadowBlur = 0; }
          break;
        case 'lights':
          c.fillStyle = '#1c2240'; c.fillRect(x, y - 230, 6, 230);
          c.fillStyle = '#e8eef8'; c.fillRect(x - 22, y - 246, 50, 18);
          var lg2 = c.createRadialGradient(x + 3, y - 237, 4, x + 3, y - 237, 150); lg2.addColorStop(0, 'rgba(255,255,240,.7)'); lg2.addColorStop(1, 'rgba(255,255,240,0)'); c.fillStyle = lg2; c.beginPath(); c.arc(x + 3, y - 237, 150, 0, 7); c.fill();
          break;
        case 'flags':
          c.strokeStyle = '#d8d8e0'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y - 100); c.stroke();
          var fc = ['#e8483c', '#f2c230', '#3d8fe0', '#3db07a', '#d84a7a'][Math.floor(sd * 5)];
          c.fillStyle = fc; c.beginPath(); c.moveTo(x, y - 100); for (var fx = 0; fx <= 34; fx += 4) c.lineTo(x + fx, y - 100 + Math.sin(t * 5 + fx * 0.2 + i) * 3); for (fx = 34; fx >= 0; fx -= 4) c.lineTo(x + fx, y - 78 + Math.sin(t * 5 + fx * 0.2 + i) * 3); c.closePath(); c.fill();
          break;
      }
    }
  }

  // 트랙: 레인 4줄. laneY(i) = 발 자리
  var LANE_TOP = GROUND + 6, LANE_H = 58;
  function laneY(i) { return LANE_TOP + LANE_H * (i + 0.72); }
  function track(c, th, L, H, cam, pxj, total, startX) {
    var top = LANE_TOP - 6, bot = LANE_TOP + LANE_H * 4 + 6;
    // 트랙 앞 풀밭 띠(뒤쪽)
    var gg = c.createLinearGradient(0, GROUND - 4, 0, top + 6); gg.addColorStop(0, shade(th.grass, -0.1)); gg.addColorStop(1, th.grass); c.fillStyle = gg; c.fillRect(0, GROUND - 2, L, top - GROUND + 8);
    var tg = c.createLinearGradient(0, top, 0, bot); tg.addColorStop(0, shade(th.track[0], -0.12)); tg.addColorStop(1, shade(th.track[0], 0.06));
    c.fillStyle = tg; c.fillRect(0, top, L, bot - top);
    // 결: 잔 알갱이
    for (var n = 0; n < 220; n++) { var gx = ((seeded(n) * 3000 - cam) % 3000 + 3000) % 3000 * L / 3000, gy = top + seeded(n + 50) * (bot - top); c.fillStyle = seeded(n + 3) < 0.5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.07)'; c.fillRect(gx, gy, 2, 1.3); }
    c.fillStyle = rgba(th.track[1].length === 7 ? th.track[1] : '#ffffff', th.night ? 0.55 : 0.85);
    for (var i = 0; i <= 4; i++) c.fillRect(0, LANE_TOP + i * LANE_H - 1, L, 2);
    // 트랙 모서리
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, top, L, 4); c.fillStyle = shade(th.grass, -0.15); c.fillRect(0, bot, L, 3);
    // 거리 눈금·출발선·결승선
    var tick = 10 * pxj, k0 = Math.max(0, Math.floor((cam - 40) / tick));
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (var k = k0; k < k0 + L / tick + 2; k++) { var tx = startX + k * tick - cam; if (k * 10 > total) break; c.fillRect(tx, bot - 5, 2, 5); }
    var sx = startX - cam; if (sx > -20 && sx < L + 20) { c.fillStyle = '#fff'; c.fillRect(sx - 2, LANE_TOP, 4, LANE_H * 4); }
    var fx = startX + total * pxj - cam;
    if (fx > -80 && fx < L + 120) {
      var sq = 7;
      for (var r = 0; r < Math.ceil(LANE_H * 4 / sq); r++) for (var q = 0; q < 2; q++) { c.fillStyle = (r + q) % 2 ? '#fff' : '#1a1a1a'; c.fillRect(fx + q * sq - sq, LANE_TOP + r * sq, sq, Math.min(sq, LANE_H * 4 - r * sq)); }
    }
    return fx;
  }
  // 결승 아치(선수보다 앞에)
  function finishArch(c, fx, t, en) {
    if (fx < -120 || fx > 3000) return;
    var topY = GROUND - 150;
    [LANE_TOP - 8, LANE_TOP + LANE_H * 4 + 8].forEach(function (py, k) {
      var g = c.createLinearGradient(fx - 6, 0, fx + 6, 0); g.addColorStop(0, '#f6f6f8'); g.addColorStop(1, '#a8acb8');
      c.fillStyle = g; c.fillRect(fx - 5 + (k ? 18 : -18), topY, 9, py - topY);
      ell(c, fx + (k ? 18 : -18), py, 12, 3, 0, 'rgba(0,0,0,.25)');
    });
    var bg = c.createLinearGradient(0, topY - 10, 0, topY + 24); bg.addColorStop(0, '#ff6a4a'); bg.addColorStop(1, '#c8321e');
    c.fillStyle = bg; c.beginPath(); c.moveTo(fx - 70, topY - 6); c.lineTo(fx + 76, topY - 6); c.lineTo(fx + 76, topY + 26); c.lineTo(fx - 70, topY + 26); c.closePath(); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.font = 'bold 22px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FINISH', fx + 3, topY + 10);
    // 오색 깃발 줄
    for (var b = 0; b < 12; b++) { var bx = fx - 70 + b * 13, by = topY + 26; c.fillStyle = ['#ffd84a', '#3d8fe0', '#3db07a', '#fff'][b % 4]; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 11, by); c.lineTo(bx + 5.5, by + 10 + Math.sin(t * 6 + b) * 1.5); c.closePath(); c.fill(); }
  }
  function foreground(c, th, L, H, cam, t) {
    var y0 = LANE_TOP + LANE_H * 4 + 8;
    var g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, th.grass); g.addColorStop(1, shade(th.grass, -0.25));
    c.fillStyle = g; c.fillRect(0, y0, L, H - y0);
    var par = 1.25, sp = 26, off = cam * par, i0 = Math.floor(off / sp) - 1;
    for (var i = i0; i < i0 + L / sp + 2; i++) {
      var x = i * sp - off, sd = seeded(i * 9), y = y0 + 8 + sd * (H - y0 - 10);
      if (th.mid === 'cactus' || th.mid === 'palm') { if (sd < 0.3) ell(c, x, y, 3 + sd * 6, 2 + sd * 3, 0, ball(c, x, y, 6, shade(th.grass, -0.3))); continue; }
      if (th.mid === 'snowpine') { if (sd < 0.25) ell(c, x, y, 6, 2.4, 0, 'rgba(160,190,220,.35)'); continue; }
      c.strokeStyle = shade(th.grass, sd < 0.5 ? -0.3 : 0.15); c.lineWidth = 2; c.lineCap = 'round';
      for (var b = -1; b <= 1; b++) { c.beginPath(); c.moveTo(x + b * 3, y); c.quadraticCurveTo(x + b * 5, y - 7, x + b * 7 + Math.sin(t * 2 + i) * 1.5, y - 10 - sd * 5); c.stroke(); }
      if (sd > 0.86 && !th.night) { c.fillStyle = ['#fff', '#ffd84a', '#f7a9c0'][i & 2]; c.beginPath(); c.arc(x, y - 12, 2.5, 0, 7); c.fill(); }
    }
  }
  function particles(c, th, L, H, cam, t) {
    if (!th.fx) return;
    var n = th.fx === 'snow' ? 70 : 34;
    for (var i = 0; i < n; i++) {
      var sp = th.fx === 'snow' ? 30 : 45, x = ((seeded(i) * (L + 200) - (cam * 0.9 + t * sp) * (0.6 + seeded(i + 4) * 0.6)) % (L + 200) + L + 200) % (L + 200) - 100;
      var y = ((seeded(i + 9) * H + t * (th.fx === 'snow' ? 26 : 34) * (0.6 + seeded(i + 2))) % H);
      x += Math.sin(t * 1.3 + i) * 12;
      if (th.fx === 'snow') { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y, 1.2 + seeded(i + 5) * 2, 0, 7); c.fill(); }
      else if (th.fx === 'petal') { c.save(); c.translate(x, y); c.rotate(t * 2 + i); c.fillStyle = seeded(i) < 0.5 ? '#f9c5d5' : '#fde4ec'; c.beginPath(); c.ellipse(0, 0, 3.4, 2, 0, 0, 7); c.fill(); c.restore(); }
      else if (th.fx === 'leaf') { c.save(); c.translate(x, y); c.rotate(t * 1.6 + i); c.fillStyle = ['#e8602a', '#f29a2a', '#d8402a'][i % 3]; c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(4, 0, 0, 4); c.quadraticCurveTo(-4, 0, 0, -4); c.fill(); c.restore(); }
    }
  }
  function confetti(c, L, H, t, t0) {
    var age = t - t0; if (age < 0 || age > 6) return;
    for (var i = 0; i < 120; i++) {
      var x = seeded(i) * L + Math.sin(t * 2 + i) * 20, y = -20 + (age * (80 + seeded(i + 3) * 120)) + seeded(i + 7) * -200;
      if (y < -10 || y > H) continue;
      c.save(); c.translate(x, y); c.rotate(t * 4 + i); c.fillStyle = ['#e8483c', '#f2c230', '#3d8fe0', '#3db07a', '#d84a7a', '#fff'][i % 6]; c.fillRect(-3, -1.5, 6, 3); c.restore();
    }
  }
  function grade(c, th, L, H) {
    if (th.tint) { c.fillStyle = th.tint; c.fillRect(0, 0, L, H); }
    if (th.night) { c.fillStyle = 'rgba(10,20,60,.18)'; c.fillRect(0, 0, L, H); }
    var v = c.createRadialGradient(L / 2, H * 0.55, Math.min(L, H) * 0.45, L / 2, H * 0.55, Math.max(L, H) * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = v; c.fillRect(0, 0, L, H);
  }

  window.TJArt = {
    SP: SP, TH: TH, GROUND: GROUND, LANE_TOP: LANE_TOP, LANE_H: LANE_H, laneY: laneY,
    runner: runner, portrait: portrait, sky: sky, clouds: clouds, far: far, mid: mid, track: track, finishArch: finishArch,
    foreground: foreground, particles: particles, confetti: confetti, grade: grade, shade: shade, ell: ell, ball: ball
  };
})();
