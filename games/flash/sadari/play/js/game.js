// 사다리타기(사다리2) — 화이트보드에 마커로 긋는 사다리, 2~50명
(function () {
  'use strict';
  var QS = location.search, EN = /[?&]lang=en(&|$)/.test(QS);
  var LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // 시험용 갈고리는 내 컴퓨터에서만
  var UP = new URLSearchParams(QS);
  function qp(k) { return LOCAL ? UP.get(k) : null; }
  var $ = function (id) { return document.getElementById(id); };
  var MAXN = 50, MINN = 2;

  var D = { '시작': 'START', '인원': 'Players', '결과': 'Results', '당첨·꽝': 'Win / Pass', '당첨': 'Win', '꽝': 'Pass', '순위': 'Ranks', '지우기': 'Clear',
    '섞기': 'Shuffle', '전체 결과': 'Reveal All', '설정': 'Setup', '복사': 'Copy', '링크': 'Link', '한 번 더': 'Again', '사다리타기': 'LADDER GAME', '이름': 'Name', '이름과 당첨 항목을 적어주세요.': 'Write the names and the prizes.',
    '복사했습니다': 'Copied', '링크를 복사했습니다': 'Link copied' };
  function T(s) { return (EN && D[s]) || s; }
  function rankName(i) {
    if (!EN) return (i + 1) + '등';
    var n = i + 1, s = (n % 100 >= 11 && n % 100 <= 13) ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
    return n + s;
  }
  var MISS = /^(꽝|통과|패스|면제|없음|세이프|-|x|pass|miss|blank|none|safe|free)$/i;

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // 상태
  var S = { n: 6, names: [], results: [], preset: 'win', wins: 1, seed: 1 };
  function clampN(n) { return Math.max(MINN, Math.min(MAXN, n | 0)); }

  function applyPreset() {
    var n = S.n, r = [];
    if (S.preset === 'win') {
      S.wins = Math.max(1, Math.min(n - 1, S.wins));
      for (var i = 0; i < n; i++) r.push(T('꽝'));
      var idx = []; for (i = 0; i < n; i++) idx.push(i);
      for (i = n - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      for (i = 0; i < S.wins; i++) r[idx[i]] = T('당첨');
    } else if (S.preset === 'rank') {
      for (i = 0; i < n; i++) r.push(rankName(i));
    } else if (S.preset === 'clear') {
      for (i = 0; i < n; i++) r.push('');
    } else {
      r = S.results.slice(0, n); while (r.length < n) r.push(T('꽝')); // 직접 쓴 뒤 인원이 늘면 새 칸은 꽝
    }
    S.results = r;
  }
  // 이름 칸은 처음부터 번호로 채워 둔다(빈 칸도 번호로)
  function fitNames() { while (S.names.length < S.n) S.names.push(''); S.names.length = S.n; for (var i = 0; i < S.n; i++) if (!String(S.names[i] || '').trim()) S.names[i] = String(i + 1); }
  // 적은 것은 저장하지 않는다 — 새로고침하면 처음처럼(이름 1,2,3… / 당첨 1·나머지 꽝). 10/5 사장님
  function save() {}
  function load() {
    try { localStorage.removeItem('sadari2.last'); } catch (e) {}
    fitNames(); applyPreset();
  }
  function nameOf(i) { var s = (S.names[i] || '').trim(); return s || String(i + 1); }
  function resOf(i) { var s = (S.results[i] || '').trim(); return s || String.fromCharCode(65 + (i % 26)) + (i >= 26 ? (i / 26 | 0) : ''); }
  function isWin(i) {
    var s = (S.results[i] || '').trim();
    if (!s || MISS.test(s)) return false;
    var same = 0; for (var k = 0; k < S.n; k++) if ((S.results[k] || '').trim() === s) same++;
    return same <= S.n / 2;
  }

  // 링크 공유: ?s= 에 이름·결과·씨앗
  function b64e(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function shareURL() {
    var u = location.href.split('?')[0].split('#')[0];
    var q = 's=' + b64e(JSON.stringify({ n: S.names.slice(0, S.n), r: S.results.slice(0, S.n), k: S.seed }));
    return u + '?' + (EN ? 'lang=en&' : '') + q;
  }

  // 씨앗 난수
  function rngOf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 사다리 만들기: R 줄, 줄마다 이웃끼리 겹치지 않게 가로줄. 모든 이웃 사이에 최소 한 줄
  function buildLadder(n, seed) {
    var rnd = rngOf(seed), R = 8 + Math.floor(n / 8), rows = [], i, r;
    for (r = 0; r < R; r++) {
      var row = {};
      for (i = 0; i < n - 1; i++) { if (row[i - 1]) continue; if (rnd() < 0.5) row[i] = 1; }
      rows.push(row);
    }
    for (i = 0; i < n - 1; i++) {
      var has = false; for (r = 0; r < R; r++) if (rows[r][i]) has = true;
      if (has) continue;
      var order = []; for (r = 0; r < R; r++) order.push(r);
      for (r = R - 1; r > 0; r--) { var j = (rnd() * (r + 1)) | 0, t = order[r]; order[r] = order[j]; order[j] = t; }
      for (var k = 0; k < R; k++) { var rr = order[k]; if (!rows[rr][i - 1] && !rows[rr][i + 1]) { rows[rr][i] = 1; break; } }
    }
    var rungs = [], by = [];
    for (r = 0; r < R; r++) {
      by.push({});
      for (i = 0; i < n - 1; i++) if (rows[r][i]) {
        var base = (r + 1) / (R + 1), ta = base + (rnd() - 0.5) * 0.4 / (R + 1), tb = ta + (rnd() - 0.5) * 0.24 / (R + 1);
        var g = { r: r, i: i, ta: ta, tb: tb }; rungs.push(g); by[r][i] = g;
      }
    }
    var paths = [];
    for (var l = 0; l < n; l++) {
      var cur = l, pts = [[l, 0]];
      for (r = 0; r < R; r++) {
        var a = by[r][cur], b = by[r][cur - 1];
        if (a) { pts.push([cur, a.ta], [cur + 1, a.tb]); cur++; }
        else if (b) { pts.push([cur, b.tb], [cur - 1, b.ta]); cur--; }
      }
      pts.push([cur, 1]);
      paths.push({ pts: pts, end: cur });
    }
    return { n: n, R: R, rungs: rungs, paths: paths };
  }

  // 사람마다 마커 색: 앞 12색은 실제 마커 색, 그 뒤는 황금각으로
  var BASE = ['#e0393e', '#2f6fd6', '#1f9d57', '#f08a24', '#8a4fd0', '#0fa3a3', '#e2468f', '#8b5a2b', '#23408e', '#6aa51d', '#b0309a', '#2b9bd8'];
  function colorOf(i) { if (i < BASE.length) return BASE[i]; var h = (i * 137.508 + 20) % 360; return 'hsl(' + h.toFixed(0) + ',62%,' + (40 + (i % 3) * 4) + '%)'; }

  // 배치: 칸이 넉넉하면 세로 사다리, 많으면 눕힌 사다리(아래로 스크롤)
  function makeLayout(W, Hv, n, force) {
    var L = { W: W, n: n };
    var vOK = (W - 24) / n >= 58 && Hv >= 300;
    if (force) vOK = force === 'v';
    if (vOK) {
      L.mode = 'v';
      L.gap = Math.min(130, (W - 24) / n);
      L.nw = Math.min(L.gap - 8, 122); L.nh = L.gap < 74 ? 52 : 48;
      L.H = Hv; L.pad = 10;
      L.x0 = W / 2 - L.gap * (n - 1) / 2;
      L.y0 = L.pad + L.nh; L.y1 = Hv - L.pad - L.nh;
      L.lw = Math.max(2.6, Math.min(4.4, L.gap * 0.05));
      L.P = function (l, t) { return [L.x0 + l * L.gap, L.y0 + t * (L.y1 - L.y0)]; };
      L.nameR = function (l) { return { x: L.x0 + l * L.gap - L.nw / 2, y: L.pad, w: L.nw, h: L.nh }; };
      L.resR = function (l) { return { x: L.x0 + l * L.gap - L.nw / 2, y: L.y1, w: L.nw, h: L.nh }; };
    } else {
      L.mode = 'h';
      L.rg = Math.max(44, Math.min(64, (Hv - 20) / n));
      L.nh = Math.min(L.rg - 8, 44); L.pad = 10;
      L.H = Math.max(Hv, 20 + n * L.rg);
      L.nw = Math.max(76, Math.min(190, W * 0.25));
      L.xa = 12 + L.nw; L.xb = W - 12 - L.nw;
      L.lw = Math.max(2.6, Math.min(4, L.rg * 0.075));
      var oy = (L.H - n * L.rg) / 2;
      L.Y = function (l) { return oy + L.rg / 2 + l * L.rg; };
      L.P = function (l, t) { return [L.xa + t * (L.xb - L.xa), L.Y(l)]; };
      L.nameR = function (l) { return { x: 12, y: L.Y(l) - L.nh / 2, w: L.nw, h: L.nh }; };
      L.resR = function (l) { return { x: L.xb, y: L.Y(l) - L.nh / 2, w: L.nw, h: L.nh }; };
    }
    L.pw = L.lw * 2.1;
    return L;
  }
  function pxPath(L, p) {
    var a = [], cum = [0], tot = 0;
    for (var i = 0; i < p.pts.length; i++) {
      var q = L.P(p.pts[i][0], p.pts[i][1]); a.push(q);
      if (i) { tot += Math.hypot(q[0] - a[i - 1][0], q[1] - a[i - 1][1]); cum.push(tot); }
    }
    return { a: a, cum: cum, tot: tot };
  }

  // 그리기 도구
  var FONT = 'Barunpen, "Malgun Gothic", sans-serif';
  function fitText(ctx, s, maxW, size, min) {
    for (; size > min; size -= 1) { ctx.font = size + 'px ' + FONT; if (ctx.measureText(s).width <= maxW) return s; }
    ctx.font = min + 'px ' + FONT;
    if (ctx.measureText(s).width <= maxW) return s;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s + '…';
  }
  function stroke(ctx, pts, color, w, upto) {
    if (pts.length < 2) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (upto) ctx.lineTo(upto[0], upto[1]);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    // 마커 잉크 결: 가운데 살짝 밝은 줄
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = w * 0.32; ctx.stroke();
  }
  function seedRot(i, k) { var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return ((x - Math.floor(x)) - 0.5) * 0.035; }
  function stickyNote(ctx, r, fill, rot, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.rotate(rot || 0);
    var x = -r.w / 2, y = -r.h / 2;
    ctx.shadowColor = 'rgba(40,50,60,.20)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    ctx.fillStyle = fill; ctx.fillRect(x, y, r.w, r.h);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(x, y, r.w, Math.min(7, r.h * 0.16));
    ctx.fillStyle = 'rgba(0,0,0,.035)'; ctx.fillRect(x, y + r.h - 3, r.w, 3);
    ctx.restore();
  }
  function handCircle(ctx, cx, cy, rx, ry, color, w, k) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.06 + seedRot(k, 3));
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, -0.5, Math.PI * 2 + 0.1); ctx.stroke();
    ctx.restore();
  }

  // 모델 하나 = 사다리 + 배치 + 진행 상태(타이틀 낙서와 본 판이 같이 씀)
  var INK = '#262a31', YEL = '#fff09a', PINK = '#ffc4d2';
  function newModel(lad, L, fn) {
    var M = { lad: lad, L: L, st: [], rev: [], px: [], fn: fn };
    for (var l = 0; l < lad.n; l++) { M.st.push({ s: 0, t0: 0, dur: 1, k: 0, single: false }); M.rev.push(null); }
    relayout(M, L);
    return M;
  }
  function relayout(M, L) { M.L = L; M.px = M.lad.paths.map(function (p) { return pxPath(L, p); }); }
  function prog(st, now) {
    var p = Math.max(0, Math.min(1, (now - st.t0) / st.dur));
    return st.single ? 0.5 - 0.5 * Math.cos(Math.PI * p) : p;
  }
  function pointAt(pp, len) {
    var c = pp.cum, i = 1;
    while (i < c.length - 1 && c[i] < len) i++;
    var seg = c[i] - c[i - 1] || 1, f = Math.max(0, Math.min(1, (len - c[i - 1]) / seg));
    return { i: i, x: pp.a[i - 1][0] + (pp.a[i][0] - pp.a[i - 1][0]) * f, y: pp.a[i - 1][1] + (pp.a[i][1] - pp.a[i - 1][1]) * f };
  }
  function update(M, now, cb) {
    for (var l = 0; l < M.lad.n; l++) {
      var st = M.st[l]; if (st.s !== 1) continue;
      var pp = M.px[l], pa = pointAt(pp, prog(st, now) * pp.tot);
      if (pa.i - 1 > st.k) { st.k = pa.i - 1; if (cb && cb.vertex) cb.vertex(l, st); }
      if (now - st.t0 >= st.dur) {
        st.s = 2; var e = M.lad.paths[l].end; M.rev[e] = { by: l, t: now };
        if (cb && cb.arrive) cb.arrive(l, e, st);
      }
    }
  }
  function busy(M) { for (var l = 0; l < M.lad.n; l++) if (M.st[l].s === 1) return true; return false; }
  function allDone(M) { for (var l = 0; l < M.lad.n; l++) if (M.st[l].s !== 2) return false; return true; }

  function drawModel(ctx, M, now, hover) {
    var L = M.L, lad = M.lad, n = lad.n, l, i, r;
    // 세로줄·가로줄(검정 마커)
    for (l = 0; l < n; l++) stroke(ctx, [L.P(l, 0), L.P(l, 1)], INK, L.lw);
    for (i = 0; i < lad.rungs.length; i++) { var g = lad.rungs[i]; stroke(ctx, [L.P(g.i, g.ta), L.P(g.i + 1, g.tb)], INK, L.lw); }
    // 지나간 길(사람 색 마커)
    var tips = [];
    for (l = 0; l < n; l++) {
      var st = M.st[l]; if (!st.s) continue;
      var pp = M.px[l], col = colorOf(l);
      if (st.s === 2) { ctx.globalAlpha = 0.92; stroke(ctx, pp.a, col, L.pw); ctx.globalAlpha = 1; continue; }
      var pa = pointAt(pp, prog(st, now) * pp.tot);
      ctx.globalAlpha = 0.92; stroke(ctx, pp.a.slice(0, pa.i), col, L.pw, [pa.x, pa.y]); ctx.globalAlpha = 1;
      tips.push([pa.x, pa.y, col]);
    }
    tips.forEach(function (t) {
      ctx.beginPath(); ctx.arc(t[0], t[1], L.pw * 0.95, 0, 7); ctx.fillStyle = t[2]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(t[0] - L.pw * 0.3, t[1] - L.pw * 0.3, L.pw * 0.28, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    });
    // 이름 포스트잇
    ctx.textBaseline = 'middle';
    for (l = 0; l < n; l++) {
      r = L.nameR(l); var rot = seedRot(l, 1), hv = hover === l && !M.st[l].s;
      var rr = hv ? { x: r.x, y: r.y - 2, w: r.w, h: r.h } : r;
      stickyNote(ctx, rr, hv ? '#ffe96a' : YEL, rot);
      ctx.save(); ctx.translate(rr.x + rr.w / 2, rr.y + rr.h / 2); ctx.rotate(rot);
      ctx.fillStyle = colorOf(l);
      if (L.mode === 'v') ctx.fillRect(-rr.w / 2, rr.h / 2 - 6, rr.w, 6); else ctx.fillRect(-rr.w / 2, -rr.h / 2, 7, rr.h);
      ctx.fillStyle = INK;
      var nm = M.fn.name(l), big = Math.min(24, L.nh * 0.5);
      if (L.mode === 'v') { ctx.textAlign = 'center'; ctx.fillText(fitText(ctx, nm, rr.w - 10, big, 11), 0, 1); }
      else { ctx.textAlign = 'left'; ctx.fillText(fitText(ctx, nm, rr.w - 22, big, 11), -rr.w / 2 + 14, 1); }
      ctx.restore();
    }
    // 결과: 가려 둔 분홍 포스트잇 → 도착하면 떨어지고 마커 글씨
    for (var e = 0; e < n; e++) {
      r = L.resR(e); var rv = M.rev[e], rot2 = seedRot(e, 2);
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      if (rv) {
        var who = rv.by, col2 = colorOf(who), resS = M.fn.res(e), small = M.fn.name(who);
        var bs = Math.min(24, L.nh * 0.46), maxW = r.w - 8;
        ctx.textAlign = 'center'; ctx.fillStyle = INK;
        var t1 = fitText(ctx, resS, maxW, bs, 11), fs1 = parseFloat(ctx.font);
        var tw = ctx.measureText(t1).width;
        var y1 = cy - L.nh * 0.13;
        ctx.fillText(t1, cx, y1);
        ctx.fillStyle = col2; fitText(ctx, small, maxW, Math.max(11, bs * 0.6), 9);
        ctx.fillText(fitText(ctx, small, maxW, Math.max(11, bs * 0.6), 9), cx, cy + L.nh * 0.3);
        if (M.fn.win(e)) handCircle(ctx, cx, y1, Math.min(r.w / 2 + 2, tw / 2 + 10), fs1 * 0.68, col2, 2.6, e);
        var age = now - rv.t;
        if (age < 480) {
          var f = age / 480, ff = f * f;
          ctx.save(); ctx.translate(r.x + 4, r.y + 2); ctx.rotate(rot2 + ff * 0.9 * (e % 2 ? -1 : 1)); ctx.translate(0, ff * 46);
          stickyNote(ctx, { x: -4, y: -2, w: r.w, h: r.h }, PINK, 0, 1 - f);
          ctx.restore();
        }
      } else {
        stickyNote(ctx, r, PINK, rot2);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot2);
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(38,42,49,.42)'; ctx.font = Math.min(26, L.nh * 0.55) + 'px ' + FONT; ctx.fillText('?', 0, 2);
        ctx.restore();
      }
    }
  }

  // ---- 화면 ----
  var off = 0; function clock() { return performance.now() + off; }
  var cv = $('cv'), ctx = cv.getContext('2d'), board = $('board'), dd = $('doodle'), dctx = dd.getContext('2d');
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var M = null, DM = null, view = 'title', hover = -1, allRun = false, resTimer = null, started = false, follow = -1;
  var fn = { name: nameOf, res: resOf, win: isWin };

  function show(v) {
    view = v;
    ['title', 'setup', 'play'].forEach(function (k) { $(k).classList.toggle('on', k === v); });
    $('tray').classList.toggle('on', v !== 'title');
    trayState();
    if (v === 'title') sizeDoodle();
  }
  function trayState() {
    var p = view === 'play', done = M && allDone(M);
    $('tSet').classList.toggle('hide', !p); $('tShuf').classList.toggle('hide', !p);
    $('tGo').classList.toggle('hide', view !== 'setup');
    $('tAll').classList.toggle('hide', !p || done); $('tRes').classList.toggle('hide', !p || !done);
    $('tSet').disabled = $('tShuf').disabled = $('tAll').disabled = allRun;
  }
  function toast(s) { var t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, 1400); }

  // ---- 설정 ----
  var rowsEl = $('rows');
  function syncRows() {
    var kids = rowsEl.children, have = kids.length / 4;
    while (have < S.n) {
      var i = have, a = document.createElement('span'), b = document.createElement('input'), c = document.createElement('i'), d = document.createElement('input');
      a.className = 'idx'; a.textContent = i + 1;
      b.className = 'note y'; b.maxLength = 16; b.dataset.i = i; b.dataset.k = 'n'; b.enterKeyHint = 'next';
      c.className = 'arr';
      d.className = 'note p'; d.maxLength = 16; d.dataset.i = i; d.dataset.k = 'r'; d.enterKeyHint = 'next';
      rowsEl.appendChild(a); rowsEl.appendChild(b); rowsEl.appendChild(c); rowsEl.appendChild(d);
      have++;
    }
    while (have > S.n) { for (var k = 0; k < 4; k++) rowsEl.removeChild(rowsEl.lastChild); have--; }
    var ins = rowsEl.querySelectorAll('input');
    for (var j = 0; j < ins.length; j++) {
      var el = ins[j], ii = +el.dataset.i, isN = el.dataset.k === 'n';
      var v = isN ? S.names[ii] : S.results[ii];
      if (document.activeElement !== el && el.value !== v) el.value = v;
      el.placeholder = isN ? String(ii + 1) : resOf(ii);
    }
    $('nCnt').textContent = S.n; $('range').value = S.n;
    $('bMinus').disabled = S.n <= MINN; $('bPlus').disabled = S.n >= MAXN;
    chipState();
  }
  function chipState() {
    $('cWin').classList.toggle('on', S.preset === 'win'); $('cRank').classList.toggle('on', S.preset === 'rank'); $('cClear').classList.toggle('on', S.preset === 'clear');
    $('wins').classList.toggle('on', S.preset === 'win'); $('wCnt').textContent = S.wins;
    $('wMinus').disabled = S.wins <= 1; $('wPlus').disabled = S.wins >= S.n - 1;
  }
  function setN(n) {
    n = clampN(n); if (n === S.n) return;
    S.n = n; fitNames(); applyPreset(); syncRows(); save();
  }
  function setPreset(p) { S.preset = p; applyPreset(); syncRows(); save(); AU.play('tap'); }
  rowsEl.addEventListener('input', function (ev) {
    var el = ev.target, i = +el.dataset.i;
    if (el.dataset.k === 'n') S.names[i] = el.value;
    else { S.results[i] = el.value; if (S.preset !== 'custom') { S.preset = 'custom'; chipState(); } }
    save();
  });
  rowsEl.addEventListener('paste', function (ev) {
    var el = ev.target, txt = (ev.clipboardData || window.clipboardData).getData('text') || '';
    if (!/[\n\t]/.test(txt)) return;
    ev.preventDefault();
    var items = txt.split(/[\r\n\t]+/).map(function (s) { return s.trim(); }).filter(Boolean), i = +el.dataset.i, isN = el.dataset.k === 'n';
    if (!items.length) return;
    var need = Math.min(MAXN, i + items.length);
    if (need > S.n) { S.n = need; fitNames(); if (S.preset === 'custom' || !isN) { S.preset = 'custom'; applyPreset(); } else applyPreset(); }
    for (var k = 0; k < items.length && i + k < S.n; k++) { if (isN) S.names[i + k] = items[k].slice(0, 16); else S.results[i + k] = items[k].slice(0, 16); }
    if (!isN) S.preset = 'custom';
    syncRows(); save();
  });
  // 칸을 누르면 글자를 통째로 골라 두어, 바로 치면 번호·꽝이 바뀐다
  rowsEl.addEventListener('focusin', function (ev) { var el = ev.target; if (el.tagName === 'INPUT') setTimeout(function () { try { el.select(); } catch (e) {} }, 0); });
  rowsEl.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    var ins = Array.prototype.slice.call(rowsEl.querySelectorAll('input')), el = ev.target, i = +el.dataset.i, k = el.dataset.k;
    var nx = ins.filter(function (x) { return x.dataset.k === k && +x.dataset.i === i + 1; })[0];
    if (nx) nx.focus(); else el.blur();
  });
  $('bMinus').onclick = function () { AU.play('tap'); setN(S.n - 1); };
  $('bPlus').onclick = function () { AU.play('tap'); setN(S.n + 1); };
  $('range').oninput = function () { setN(+this.value); };
  $('cWin').onclick = function () { setPreset('win'); };
  $('cRank').onclick = function () { setPreset('rank'); };
  $('cClear').onclick = function () { setPreset('clear'); };
  $('wMinus').onclick = function () { S.wins = Math.max(1, S.wins - 1); setPreset('win'); };
  $('wPlus').onclick = function () { S.wins = Math.min(S.n - 1, S.wins + 1); setPreset('win'); };

  // ---- 사다리 판 ----
  var forceMode = qp('force');
  function sizeBoard() {
    if (!M) return;
    var W = board.clientWidth, Hv = board.clientHeight;
    if (!W || !Hv) return;
    var L = makeLayout(W, Hv, S.n, forceMode);
    relayout(M, L);
    cv.width = Math.round(W * DPR); cv.height = Math.round(L.H * DPR);
    cv.style.width = W + 'px'; cv.style.height = L.H + 'px';
    draw();
  }
  function newBoard(seed) {
    clearTimeout(resTimer); allRun = false; follow = -1;
    S.seed = seed == null ? ((Math.random() * 4294967295) >>> 0) : seed;
    // 판마다 당첨·순위 자리를 새로 섞는다. 사다리는 옆 줄로만 조금씩 옮겨 가서, 당첨 자리가 그대로면
    // 그 근처 사람만 계속 걸린다(10/5 사장님 "계속 9번만 당첨"). 자리가 매번 고르게 섞이면 누구나 1/N
    // 직접 적은 결과도 섞는다(10/5 사장님 "ㅇ 섞어")
    if (seed == null) {
      var r = S.results;
      for (var i = r.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = r[i]; r[i] = r[j]; r[j] = t; }
    }
    M = newModel(buildLadder(S.n, S.seed), makeLayout(320, 600, S.n), fn);
    show('play'); board.scrollTop = 0; sizeBoard(); trayState();
  }
  function draw() {
    if (!M) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawModel(ctx, M, clock(), hover);
  }
  function startOG() { if (started) return; started = true; try { if (window.OG) OG.start(); } catch (e) {} }
  function runOne(l) {
    if (!M || allRun || M.st[l].s) return;
    var st = M.st[l], tot = M.px[l].tot;
    st.s = 1; st.t0 = clock(); st.single = true; st.k = 0;
    st.dur = Math.max(1500, Math.min(3400, tot / 0.38));
    follow = l; AU.play('lid'); AU.play('drum'); startOG(); trayState();
  }
  function runAll() {
    if (!M || allRun) return;
    var now = clock(), list = [];
    for (var l = 0; l < S.n; l++) if (!M.st[l].s) list.push(l);
    if (!list.length) return;
    allRun = true; follow = -1;
    var gap = Math.min(110, 1600 / list.length);
    list.forEach(function (l, k) { var st = M.st[l]; st.s = 1; st.t0 = now + k * gap; st.dur = 1500; st.single = false; st.k = 0; });
    AU.play('lid'); startOG(); trayState();
  }
  var lastPeel = 0;
  var CB = {
    vertex: function (l, st) { if (st.single) { if (st.k % 2) AU.play('step', (st.k - 1) >> 1); } else if (Math.random() < 0.4) AU.play('step', (Math.random() * 8) | 0); },
    arrive: function (l, e, st) {
      var now = clock();
      if (st.single) { AU.play('drumStop'); AU.play('peel'); AU.play(isWin(e) ? 'win' : 'miss'); if (isWin(e)) AU.play('pop'); }
      else if (now - lastPeel > 90) { lastPeel = now; AU.play('peel'); }
      if (follow === l) follow = -1;
      if (allDone(M)) {
        if (allRun) { AU.play('win'); }
        allRun = false; trayState();
        try { if (window.OG) OG.over({ result: 'DONE', score: S.n }); } catch (e2) {}
        clearTimeout(resTimer); resTimer = setTimeout(openRes, 1000);
      }
    }
  };
  function hitName(x, y) {
    if (!M) return -1;
    for (var l = 0; l < S.n; l++) { var r = M.L.nameR(l); if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 3 && y <= r.y + r.h + 3) return l; }
    return -1;
  }
  function evXY(ev) { var b = cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; }
  cv.addEventListener('click', function (ev) { AU.init(); var p = evXY(ev), l = hitName(p[0], p[1]); if (l >= 0) runOne(l); });
  cv.addEventListener('pointermove', function (ev) {
    if (ev.pointerType !== 'mouse') return;
    var p = evXY(ev), l = hitName(p[0], p[1]);
    var h = (l >= 0 && M && !M.st[l].s && !allRun) ? l : -1;
    if (h !== hover) { hover = h; cv.style.cursor = h >= 0 ? 'pointer' : ''; draw(); }
  });
  cv.addEventListener('pointerleave', function () { if (hover >= 0) { hover = -1; draw(); } });

  // ---- 결과 종이 ----
  function order() {
    var w = [], o = [], l;
    var at = []; for (l = 0; l < S.n; l++) at[M.lad.paths[l].end] = l;
    for (var e = 0; e < S.n; e++) if (isWin(e)) w.push([at[e], e]);
    for (l = 0; l < S.n; l++) { var e2 = M.lad.paths[l].end; if (!isWin(e2)) o.push([l, e2]); }
    return w.concat(o);
  }
  function openRes() {
    if (!M) return;
    var list = $('list'); list.innerHTML = '';
    order().forEach(function (p) {
      var d = document.createElement('div'); d.className = 'li' + (isWin(p[1]) ? ' w' : '');
      var i = document.createElement('i'); i.style.background = colorOf(p[0]);
      var n = document.createElement('span'); n.className = 'n'; n.textContent = nameOf(p[0]);
      var r = document.createElement('span'); r.className = 'r'; r.textContent = resOf(p[1]);
      d.appendChild(i); d.appendChild(n); d.appendChild(r); list.appendChild(d);
    });
    list.scrollTop = 0;
    $('res').classList.add('on'); AU.play('peel');
  }
  function closeRes() { $('res').classList.remove('on'); }
  function copy(s, msg) {
    function ok() { toast(T(msg)); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(s).then(ok, fb); } else fb();
    function fb() { var t = document.createElement('textarea'); t.value = s; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(t); }
  }
  $('rCopy').onclick = function () {
    AU.play('tap');
    var s = T('사다리타기') + '\n' + order().map(function (p) { return nameOf(p[0]) + ' → ' + resOf(p[1]); }).join('\n') + '\n' + shareURL();
    copy(s, '복사했습니다');
  };
  $('rLink').onclick = function () { AU.play('tap'); copy(shareURL(), '링크를 복사했습니다'); };
  $('rSet').onclick = function () { AU.play('tap'); closeRes(); show('setup'); syncRows(); };
  $('rAgain').onclick = function () { AU.play('shuf'); closeRes(); newBoard(); };
  $('res').addEventListener('click', function (ev) { if (ev.target === this) closeRes(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeRes(); });

  $('tSet').onclick = function () { AU.play('tap'); show('setup'); syncRows(); };
  $('tShuf').onclick = function () { AU.play('shuf'); newBoard(); };
  $('tAll').onclick = function () { runAll(); };
  $('tRes').onclick = function () { AU.play('tap'); openRes(); };
  $('tGo').onclick = function () { AU.init(); AU.play('tap'); save(); newBoard(); };
  $('bStart').onclick = function () { AU.init(); AU.play('tap'); show('setup'); syncRows(); };

  // ---- 타이틀 낙서: 작은 사다리 4줄이 혼자 계속 타 내려감 ----
  var DN = 4, dRes = [], dNext = 0, dHold = 0;
  var dfn = { name: function (i) { return EN ? 'ABCDEF'[i] : '가나다라마바'[i]; }, res: function (e) { return dRes[e]; }, win: function (e) { return dRes[e] === T('당첨'); } };
  function newDoodle() {
    var w = (Math.random() * DN) | 0; dRes = []; for (var i = 0; i < DN; i++) dRes.push(i === w ? T('당첨') : T('꽝'));
    DM = newModel(buildLadder(DN, (Math.random() * 1e9) | 0), makeLayout(300, 300, DN, 'v'), dfn);
    dNext = clock() + 700; dHold = 0; sizeDoodle();
  }
  function sizeDoodle() {
    if (!DM) return;
    var W = dd.clientWidth, H = dd.clientHeight;
    if (!W || !H) return;
    dd.width = Math.round(W * DPR); dd.height = Math.round(H * DPR);
    relayout(DM, makeLayout(W, H, DN, 'v'));
  }
  var SHOT_T = 0; // 표지 뜨기(?shot=1): 낙서를 한 순간에 멈춰 둔다
  function tickDoodle(now) {
    if (!DM) return;
    if (SHOT_T) now = SHOT_T;
    else if (!busy(DM) && now >= dNext) {
      var l = -1; for (var i = 0; i < DN; i++) if (!DM.st[i].s) { l = i; break; }
      if (l >= 0) { var st = DM.st[l]; st.s = 1; st.t0 = now; st.dur = 1700; st.single = true; dNext = now + 2300; }
      else if (!dHold) dHold = now + 1800;
      else if (now >= dHold) newDoodle();
    }
    update(DM, now, null);
    dctx.setTransform(DPR, 0, 0, DPR, 0, 0); dctx.clearRect(0, 0, dd.width, dd.height);
    drawModel(dctx, DM, now, -1);
  }

  // ---- 반복 ----
  var lastBusy = false;
  function frame() {
    var now = clock();
    if (view === 'title') tickDoodle(now);
    else if (view === 'play' && M) {
      update(M, now, CB);
      var b = busy(M), recent = false;
      for (var e = 0; e < S.n; e++) if (M.rev[e] && now - M.rev[e].t < 520) recent = true;
      if (b || recent || lastBusy) draw();
      lastBusy = b || recent;
      if (follow >= 0 && M.L.mode === 'h' && M.st[follow].s === 1) {
        var pp = M.px[follow], pa = pointAt(pp, prog(M.st[follow], now) * pp.tot);
        var want = pa.y - board.clientHeight / 2, cur = board.scrollTop;
        board.scrollTop = cur + (want - cur) * 0.12;
      }
    }
  }
  function loop() { frame(); requestAnimationFrame(loop); }

  // ---- 소리 단추 ----
  function togState() { $('bBgm').classList.toggle('off', !AU.bgm()); $('bSnd').classList.toggle('off', !AU.snd()); }
  $('bBgm').onclick = function () { AU.init(); AU.bgm(!AU.bgm()); togState(); AU.play('tap'); };
  $('bSnd').onclick = function () { AU.init(); AU.snd(!AU.snd()); togState(); AU.play('tap'); };
  document.addEventListener('pointerdown', function () { AU.init(); }, { once: true });

  // ---- 시작 ----
  if (EN) {
    document.body.classList.add('en'); document.documentElement.lang = 'en'; document.title = 'LADDER GAME';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = T(el.getAttribute('data-t')); });
  }
  window.addEventListener('resize', function () { if (view === 'play') sizeBoard(); if (view === 'title') sizeDoodle(); });
  load();
  var shared = UP.get('s'), fromLink = false;
  if (shared) {
    try {
      var o = JSON.parse(b64d(shared));
      if (o && o.n && o.n.length >= MINN) {
        S.n = clampN(o.n.length); S.names = o.n.slice(0, S.n).map(function (s) { return String(s).slice(0, 16); });
        S.results = (o.r || []).slice(0, S.n).map(function (s) { return String(s).slice(0, 16); }); while (S.results.length < S.n) S.results.push('');
        S.preset = 'custom'; fromLink = (o.k >>> 0) || 1; S.seed = fromLink;
      }
    } catch (e) {}
  }

  // 시험 갈고리(내 컴퓨터에서만): ?view=setup|play|res &n=50 &demo=1(이름 채움) &run=all|0..n &at=ms &force=v|h &mute=1
  var DEMO = ['민준', '서연', '도윤', '하은', '시우', '지우', '주원', '서윤', '하준', '지아', '예준', '수아', '건우', '아린', '우진', '채원', '선우', '다은', '현우', '윤서', '김부장', '이과장', '박대리', '최사원', '정팀장'];
  function hooks() {
    if (qp('shot')) {
      document.body.classList.add('shot'); show('title'); DN = 6;
      DM = newModel(buildLadder(DN, 20261005), makeLayout(300, 300, DN, 'v'), dfn); sizeDoodle();
      dRes = []; for (var q = 0; q < DN; q++) dRes.push(T('꽝'));
      dRes[DM.lad.paths[1].end] = T('당첨');
      var t = clock(); SHOT_T = t;
      [0, 1, 4].forEach(function (l) { DM.st[l].s = 2; DM.rev[DM.lad.paths[l].end] = { by: l, t: t - 5000 }; });
      DM.st[2].s = 1; DM.st[2].t0 = t - 1050; DM.st[5].s = 1; DM.st[5].t0 = t - 600; DM.st[5].dur = 1700; DM.st[2].dur = 1700; DM.st[2].single = false;
      if (qp('box')) setTimeout(function () { var b = $('logo').getBoundingClientRect(); document.body.setAttribute('data-box', [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom), innerWidth, innerHeight].join(',')); }, 300);
      return true;
    }
    if (qp('mute')) { AU.snd(false); AU.bgm(false); togState(); }
    if (qp('n')) { S.n = clampN(+qp('n')); fitNames(); S.preset = 'win'; S.wins = +(qp('wins') || 1); applyPreset(); }
    if (qp('demo')) for (var i = 0; i < S.n; i++) S.names[i] = DEMO[i % DEMO.length] + (i >= DEMO.length ? (i / DEMO.length | 0) + 1 : '');
    if (qp('rank')) { S.preset = 'rank'; applyPreset(); }
    var v = qp('view');
    if (v === 'setup') { show('setup'); syncRows(); return true; }
    if (v === 'play' || v === 'res') {
      newBoard(+(qp('seed') || 12345));
      var run = qp('run');
      if (run === 'all') runAll(); else if (run != null) runOne(+run);
      if (qp('at')) { off += +qp('at'); frame(); off += 600; frame(); draw(); }
      if (v === 'res') { for (var l = 0; l < S.n; l++) if (!M.st[l].s) { M.st[l].s = 1; M.st[l].t0 = clock() - 9999; M.st[l].dur = 1; } frame(); off += 900; frame(); draw(); clearTimeout(resTimer); openRes(); }
      if (qp('scroll')) board.scrollTop = +qp('scroll');
      return true;
    }
    return false;
  }
  window.__sd2 = { tick: function (ms) { var k = Math.ceil((ms || 16) / 16); for (var i = 0; i < k; i++) { off += 16; frame(); } }, S: S, get M() { return M; }, runAll: runAll, runOne: runOne, openRes: openRes, shareURL: shareURL, order: order };

  togState(); syncRows();
  (document.fonts && document.fonts.load ? Promise.all([document.fonts.load('20px Barunpen'), document.fonts.load('40px Goding')]) : Promise.resolve()).then(function () {}, function () {}).then(function () {
    newDoodle();
    if (!(LOCAL && hooks())) {
      if (fromLink) newBoard(fromLink); else show('title');
    }
    if (view === 'title') sizeDoodle();
    draw();
    requestAnimationFrame(loop);
  });
})();
