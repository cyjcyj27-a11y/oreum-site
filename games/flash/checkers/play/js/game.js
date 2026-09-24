/* 체커 — 8×8 판, 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). 오목 뼈대(급수·2P·HUD)를 그대로 가져왔다. */
(function () {
  'use strict';
  var A = window.CKAudio, E = window.CheckersEngine;
  var RED = E.RED, BLACK = E.BLACK;

  // ── 논리 좌표: 700×700, 칸 80, 테두리 30 ──
  var LW = 700, LH = 700, SQ = 80, M0 = 30, PR = 31;
  var RANKS = [], RANKS_EN = [], r;
  for (r = 18; r >= 1; r--) { RANKS.push(r + '급'); RANKS_EN.push(r + 'K'); }
  for (r = 1; r <= 9; r++) { RANKS.push(r + '단'); RANKS_EN.push(r + 'D'); }
  var TOP = RANKS.length - 1;

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var G = { mode: 'title', b: new E.Board(), p2: false, level: 0, result: null, gid: 0, moves: [], sel: -1, partial: [], anim: null, quiet: 0, hist: {}, last: null };
  var hover = -1, drag = null, must = null, shake = null, pops = [], boardCv = null, overT = 0;

  // ── 말: ?lang=en 이면 영어 ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'CHECKERS'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }
  function rankName(L) { return (EN ? RANKS_EN : RANKS)[L]; }

  function loadBest() { try { return Math.max(0, Math.min(TOP, parseInt(localStorage.getItem('checkers.lv') || '0', 10) || 0)); } catch (e) { return 0; } }
  function saveBest(n) { try { localStorage.setItem('checkers.lv', String(n)); } catch (e) {} }
  function showRec() { $('rec').textContent = rankName(loadBest()); }

  var VT = null;   // 영상 촬영·시험용 가짜 시계
  function now() { return VT != null ? VT : performance.now() / 1000; }

  // ── 상대는 웹워커에서 생각한다(깊이 읽는 동안 화면이 멈추지 않게). 못 만들면 여기서 바로 ──
  var worker = null, wcb = {}, wid = 0;
  try {
    if (/[?&]noworker=1/.test(location.search)) throw 0;   // 워커 없는 길 시험용
    var src = CheckersFactory.toString() + '\nCheckersFactory(self);\nself.onmessage=function(e){var d=e.data,E=self.CheckersEngine,b=new E.Board();b.s.set(d.s);b.turn=d.turn;var r=E.think(b,d.L);self.postMessage({id:d.id,move:r.move,depth:r.depth});};';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = function (e) { var f = wcb[e.data.id]; delete wcb[e.data.id]; if (f) f(e.data); };
    worker.onerror = function () { worker = null; var k; for (k in wcb) { var f = wcb[k]; delete wcb[k]; f(null); } };
  } catch (e) { worker = null; }
  function askEngine(b, L, cb) {
    function local() { setTimeout(function () { cb(E.think(b, L)); }, 30); }
    if (!worker) { local(); return; }
    var id = ++wid; wcb[id] = function (res) { if (res) cb(res); else local(); };
    worker.postMessage({ id: id, s: b.s, turn: b.turn, L: L });
  }

  // ── 화면 맞추기 ──
  function resize() {
    var dpr = Math.min(/[?&]hires=1/.test(location.search) ? 3 : 2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var shot = document.body.classList.contains('shot');
    var top = shot ? 8 : ($('topbar').offsetHeight || 46) + 2, bottom = 8;
    var s = Math.min((w - 8) / (LW + 40), (h - top - bottom) / (LH + 40));
    if (!shot && (w - LW * s) / 2 < 70) { bottom = 56; s = Math.min((w - 8) / (LW + 40), (h - top - bottom) / (LH + 40)); }   // 옆에 전체화면 알약 자리가 없으면 아래를 비운다
    s = Math.max(0.05, s);
    view.s = s; view.ox = (w - LW * s) / 2; view.oy = top + (h - top - bottom - LH * s) / 2;
    boardCv = null; draw();
  }
  function applyView() { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s); }
  function toLogical(px, py) { return { x: (px - view.ox) / view.s, y: (py - view.oy) / view.s }; }
  function cx(sq) { return M0 + (sq & 7) * SQ + SQ / 2; }
  function cy(sq) { return M0 + (sq >> 3) * SQ + SQ / 2; }

  // ── 진행 ──
  function humanTurn() { return G.mode === 'play' && (G.p2 || G.b.turn === RED); }
  function newTurn() {
    G.moves = G.b.moves(); G.sel = -1; G.partial = [];
    updHud();
    if (!G.moves.length) { endGame(-G.b.turn); return; }
    if (!G.p2 && G.b.turn === BLACK) {
      G.mode = 'think'; updHud();
      var id = G.gid, t0 = performance.now(), snap = G.b.clone();
      setTimeout(function () {
        if (id !== G.gid) return;
        askEngine(snap, G.level, function (res) {
          if (id !== G.gid || G.mode !== 'think') return;
          var wait = Math.max(0, 1000 + Math.random() * 400 - (performance.now() - t0));   // 내 말 놓고 1~1.4초 뒤에 둔다
          setTimeout(function () {
            if (id !== G.gid || G.mode !== 'think') return;
            var m = G.moves[res.move] || G.moves[0];
            commit(m, 0);
          }, wait);
        });
      }, 250);
    } else G.mode = 'play';
  }
  function start(level) {
    G.gid++; G.level = level; G.b.reset(); G.result = null; G.quiet = 0; G.hist = {}; G.last = null; G.anim = null; pops = []; must = null;
    clearTimeout(overT);
    $('title').classList.add('hide'); $('over').classList.remove('show'); document.body.classList.add('playing');
    A.place();
    if (window.OG) OG.start();   // 집계: 한 판 시작
    G.mode = 'play'; newTurn();
  }
  function endGame(winner) {
    G.mode = 'wait'; G.result = { winner: winner }; G.sel = -1; G.partial = [];
    if (winner === 0) A.draw();
    updHud();
    overT = setTimeout(showOver, winner === 0 ? 900 : 1300);
  }

  // 수를 둔다 — k 번째 뜀부터 움직임을 보여 준다(앞쪽은 사람이 이미 한 칸씩 짚어 옮겼다)
  function commit(m, k) {
    var side = G.b.turn, human = G.p2 || side === RED;
    var pts = [k ? m.path[k - 1] : m.from].concat(m.path.slice(k));
    G.mode = 'anim'; G.sel = -1; drag = null; must = null;
    G.anim = { m: m, k: k, piece: G.b.s[m.from], pts: pts, caps: m.caps.slice(k), t0: now(), seg: m.caps.length ? 0.26 : 0.2, hopped: 0,
      done: function () {
        var man = Math.abs(G.b.s[m.from]) === 1;
        G.b.play(m); G.anim = null; G.partial = []; G.last = { from: m.from, to: m.path[m.path.length - 1] };
        A.place();
        if (m.crown) { A.king(); pops.push({ sq: G.last.to, t0: now(), king: true }); if (human && !G.p2) flash('KING', 'soft'); }
        if (human && m.caps.length >= 3) { flash('GREAT'); A.nice(3); }
        else if (human && m.caps.length === 2) { flash('NICE'); A.nice(1); }
        G.quiet = (m.caps.length || man) ? 0 : G.quiet + 1;
        var key = G.b.key(); G.hist[key] = (G.hist[key] || 0) + 1;
        updHud();
        if (!G.b.count(-side)) { endGame(side); return; }
        if (G.quiet >= 80 || G.hist[key] >= 3) { endGame(0); return; }   // 킹끼리 40수씩 잡지도 못하고 돌거나, 같은 판이 세 번
        newTurn();
      } };
  }
  function stepAnim() {
    var a = G.anim; if (!a) return;
    var t = (now() - a.t0) / a.seg, n = a.pts.length - 1;
    if (a.caps.length) while (a.hopped < a.caps.length && t >= a.hopped + 0.5) { A.hop(a.k + a.hopped); pops.push({ sq: a.caps[a.hopped], t0: now(), piece: G.b.s[a.caps[a.hopped]] }); a.hopped++; }
    if (t >= n) a.done();
  }

  // 사람이 한 칸씩 짚는다: 뛸 곳이 하나로 좁혀지면 끝까지 알아서 간다
  function cands() {
    var out = [], i, j;
    for (i = 0; i < G.moves.length; i++) {
      var m = G.moves[i]; if (m.from !== G.sel) continue;
      for (j = 0; j < G.partial.length; j++) if (m.path[j] !== G.partial[j]) break;
      if (j === G.partial.length) out.push(m);
    }
    return out;
  }
  function nextSteps() { var c = cands(), out = [], i; for (i = 0; i < c.length; i++) { var q = c[i].path[G.partial.length]; if (q != null && out.indexOf(q) < 0) out.push(q); } return out; }
  function advance(sq) {
    var k = G.partial.length;
    G.partial.push(sq);
    var c = cands();
    if (c.length === 1) { commit(c[0], k); return; }
    var full = c.filter(function (m) { return m.path.length === G.partial.length; });
    if (full.length) { commit(full[0], k); return; }
    // 갈래가 남았다 — 한 번 뛴 모습만 보여 주고 다음 짚기를 기다린다
    var m0 = c[0];
    G.mode = 'anim';
    G.anim = { m: m0, k: k, piece: G.b.s[G.sel], pts: [k ? G.partial[k - 1] : G.sel, sq], caps: [m0.caps[k]], t0: now(), seg: 0.26, hopped: 0, done: function () { G.anim = null; G.mode = 'play'; } };
  }
  function tapSquare(sq) {
    if (!humanTurn() || sq < 0) return;
    var s = G.b.s, side = G.b.turn;
    if (G.sel >= 0 && nextSteps().indexOf(sq) >= 0) { advance(sq); return; }
    if (G.partial.length) { bad(sq); return; }   // 잡는 중에는 그 말로 끝까지
    if (s[sq] * side > 0) {
      var can = G.moves.some(function (m) { return m.from === sq; });
      if (can) { G.sel = sq; A.pick(); return; }
      if (G.moves[0].caps.length) {   // 잡을 수 있으면 반드시 잡는다 — 잡을 말들을 흔들어 보인다
        must = { t0: now(), sqs: G.moves.map(function (m) { return m.from; }) };
        bad(sq); flash(EN ? 'JUMP' : '잡기', 'bad'); return;
      }
      bad(sq); return;
    }
    if (G.sel >= 0) { G.sel = -1; }
  }
  function bad(sq) { shake = { sq: sq, t0: now() }; A.bad(); }

  function showOver() {
    clearTimeout(overT);
    if (G.mode === 'over' || !G.result) return;
    G.mode = 'over'; document.body.classList.remove('playing');
    var w = G.result.winner, big = $('ores'), btn = $('btnRetry'), rec = $('orec');
    rec.textContent = '';
    if (w === 0) {
      $('oh').textContent = G.p2 ? '' : rankName(G.level); big.textContent = 'DRAW'; big.className = 'res p2'; btn.textContent = 'RETRY';
    } else if (G.p2) {
      $('oh').textContent = 'WINNER'; big.textContent = w === RED ? 'RED' : 'BLACK'; big.className = 'res p2'; btn.textContent = 'RETRY'; A.win();
    } else if (w === RED) {
      $('oh').textContent = rankName(G.level); big.textContent = 'CLEAR'; big.className = 'res win'; A.win();
      if (G.level < TOP) {
        btn.textContent = 'NEXT'; rec.textContent = '▲ ' + rankName(G.level + 1);
        if (G.level + 1 > loadBest()) saveBest(G.level + 1);
      } else btn.textContent = 'RETRY';
    } else {
      $('oh').textContent = rankName(G.level); big.textContent = 'GAME OVER'; big.className = 'res lose'; btn.textContent = 'RETRY'; A.lose();
    }
    $('over').classList.add('show');
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === RED ? 'clear' : w === 0 ? 'draw' : 'lose'), stage: G.level + 1 });
  }

  var flashT = 0;
  function flash(txt, cls) { var el = $('flash'); el.textContent = txt; el.className = cls || ''; void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 900); }

  // ── HUD ──
  function updHud() {
    var b = G.b, live = G.mode === 'play' || G.mode === 'think' || G.mode === 'anim';
    $('tmR').classList.toggle('on', live && b.turn === RED); $('tmK').classList.toggle('on', live && b.turn === BLACK);
    $('tmK').classList.toggle('think', G.mode === 'think');
    $('nR').textContent = b.count(RED); $('nK').textContent = b.count(BLACK);
    $('rank').textContent = rankName(G.level); $('rank').style.display = G.p2 ? 'none' : '';
    $('lbR').textContent = G.p2 ? '1P' : 'YOU'; $('lbK').textContent = G.p2 ? '2P' : '';
  }
  function syncTog() { $('tgSnd').classList.toggle('off', !A.snd); }

  // ── 그리기 ──
  // 판은 한 번 그려 두고 붙인다(나뭇결·칸 결이 많다)
  function rnd(seed) { var x = seed | 0; return function () { x = (x * 1664525 + 1013904223) | 0; return ((x >>> 0) % 100000) / 100000; }; }
  function buildBoard() {
    var k = view.s * view.dpr, W = Math.ceil((LW + 40) * k), H = Math.ceil((LH + 50) * k);
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), R = rnd(7), i, rr, cc;
    g.scale(k, k); g.translate(20, 14);
    // 탁자 위 그림자
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(6, 16, LW - 4, LH); g.restore();
    // 테두리 나무 — 짙은 호두나무, 위는 밝고 아래는 어둡게(빛은 왼쪽 위)
    var fg = g.createLinearGradient(0, 0, 0, LH); fg.addColorStop(0, '#7a4a28'); fg.addColorStop(1, '#4a2a14');
    roundRect(g, 0, 0, LW, LH, 14); g.fillStyle = fg; g.fill();
    g.save(); roundRect(g, 0, 0, LW, LH, 14); g.clip();
    g.lineCap = 'round';
    for (i = 0; i < 70; i++) { var y0 = R() * LH, a = 0.04 + R() * 0.08, amp = 2 + R() * 6, f = 0.004 + R() * 0.01, ph = R() * 6; g.strokeStyle = R() < 0.5 ? 'rgba(30,12,2,' + a + ')' : 'rgba(255,200,140,' + a * 0.6 + ')'; g.lineWidth = 0.8 + R() * 1.6; g.beginPath(); for (var x = 0; x <= LW; x += 14) { var yy = y0 + Math.sin(x * f + ph) * amp; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
    g.restore();
    // 테두리 모서리 깎은 면
    g.strokeStyle = 'rgba(255,220,170,.28)'; g.lineWidth = 2; roundRect(g, 2, 2, LW - 4, LH - 4, 12); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; roundRect(g, M0 - 5, M0 - 5, SQ * 8 + 10, SQ * 8 + 10, 3); g.stroke();
    g.strokeStyle = 'rgba(255,215,160,.25)'; g.lineWidth = 1.5; roundRect(g, M0 - 2, M0 - 2, SQ * 8 + 4, SQ * 8 + 4, 2); g.stroke();
    // 칸
    for (rr = 0; rr < 8; rr++) for (cc = 0; cc < 8; cc++) {
      var X = M0 + cc * SQ, Y = M0 + rr * SQ, dark = (rr + cc) & 1;
      var sg = g.createLinearGradient(X, Y, X + SQ, Y + SQ);
      if (dark) { sg.addColorStop(0, '#2f6b45'); sg.addColorStop(1, '#245538'); }
      else { sg.addColorStop(0, '#f3e2bb'); sg.addColorStop(1, '#e6cf9f'); }
      g.fillStyle = sg; g.fillRect(X, Y, SQ, SQ);
      // 칸마다 결 — 밝은 칸은 나뭇결, 어두운 칸은 칠 얼룩
      g.save(); g.beginPath(); g.rect(X, Y, SQ, SQ); g.clip();
      var horiz = (rr + cc) % 4 < 2;
      for (i = 0; i < 14; i++) {
        var o = R() * SQ, al = dark ? 0.03 + R() * 0.04 : 0.04 + R() * 0.06;
        g.strokeStyle = dark ? 'rgba(0,20,8,' + al + ')' : 'rgba(140,90,30,' + al + ')'; g.lineWidth = 0.6 + R() * 1.4;
        g.beginPath();
        for (var t = 0; t <= SQ; t += 4) { var w = Math.sin(t * 0.035 + i * 1.7 + rr) * 0.9; if (horiz) { if (t) g.lineTo(X + t, Y + o + w); else g.moveTo(X + t, Y + o + w); } else { if (t) g.lineTo(X + o + w, Y + t); else g.moveTo(X + o + w, Y + t); } }
        g.stroke();
      }
      g.restore();
    }
    // 판 전체 빛 — 왼쪽 위가 밝다
    var lg = g.createRadialGradient(LW * 0.3, LH * 0.25, 60, LW * 0.5, LH * 0.5, LW * 0.8);
    lg.addColorStop(0, 'rgba(255,240,200,.10)'); lg.addColorStop(1, 'rgba(0,0,0,.16)');
    g.fillStyle = lg; g.fillRect(M0, M0, SQ * 8, SQ * 8);
    boardCv = c; boardCv.k = k;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function draw() {
    var W = view.w, H = view.h, i, t = now(), b = G.b;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    // 탁자
    var wg = ctx.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    wg.addColorStop(0, '#4a3020'); wg.addColorStop(1, '#1a0f07');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    if (!boardCv) buildBoard();
    ctx.drawImage(boardCv, view.ox - 20 * view.s, view.oy - 14 * view.s, boardCv.width / view.dpr, boardCv.height / view.dpr);
    applyView();

    // 지난 수 — 떠난 칸과 닿은 칸을 옅게
    if (G.last && G.mode !== 'title') {
      ctx.fillStyle = 'rgba(255,220,90,.16)'; sqFill(G.last.from); ctx.fillStyle = 'rgba(255,220,90,.24)'; sqFill(G.last.to);
    }
    var my = humanTurn();
    // 고른 말이 갈 수 있는 칸
    if (my && G.sel >= 0) {
      var ns = nextSteps(), pulse = 0.5 + 0.5 * Math.sin(t * 5);
      for (i = 0; i < ns.length; i++) {
        ctx.fillStyle = 'rgba(255,240,160,' + (0.10 + 0.06 * pulse) + ')'; sqFill(ns[i]);
        ctx.fillStyle = 'rgba(255,236,150,.85)'; ctx.beginPath(); ctx.arc(cx(ns[i]), cy(ns[i]), 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(80,50,0,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // 말 — 움직이는 말·잡힌 말·잡는 중인 말은 따로
    var hide = {}, a = G.anim;
    if (G.partial.length && G.sel >= 0) { hide[G.sel] = 1; for (i = 0; i < (a ? a.k : G.partial.length); i++) { var mm = cands()[0]; if (mm) hide[mm.caps[i]] = 1; } }
    if (a) { hide[a.m.from] = 1; for (i = 0; i < a.k; i++) hide[a.m.caps[i]] = 1; for (i = 0; i < a.hopped; i++) hide[a.caps[i]] = 1; }
    if (drag && drag.moved) hide[drag.sq] = 1;
    for (i = 0; i < 64; i++) {
      var p = b.s[i]; if (!p || hide[i]) continue;
      var lift = 0, sx = 0;
      if (my && i === G.sel && !G.partial.length) lift = 6;
      else if (my && i === hover && G.sel < 0 && G.moves.some(function (m) { return m.from === i; })) lift = 2.5;
      if (shake && shake.sq === i && t - shake.t0 < 0.4) sx = Math.sin((t - shake.t0) * 60) * 5 * (1 - (t - shake.t0) / 0.4);
      if (must && t - must.t0 < 0.9 && must.sqs.indexOf(i) >= 0) lift = 4 + 3 * Math.sin((t - must.t0) * 14);
      drawPiece(cx(i) + sx, cy(i), p, 1, lift, 1, my && i === G.sel);
    }
    // 잡는 중(갈래에서 기다림) — 말은 뛴 자리에
    if (G.partial.length && G.sel >= 0 && !a) drawPiece(cx(G.partial[G.partial.length - 1]), cy(G.partial[G.partial.length - 1]), b.s[G.sel], 1, 6, 1, true);
    // 뛰어나가는 말
    for (i = pops.length - 1; i >= 0; i--) {
      var q = pops[i], k = (t - q.t0) / (q.king ? 0.6 : 0.45);
      if (k >= 1) { pops.splice(i, 1); continue; }
      if (q.king) { ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 6 * (1 - k); ctx.beginPath(); ctx.arc(cx(q.sq), cy(q.sq), PR + 6 + k * 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); continue; }
      drawPiece(cx(q.sq), cy(q.sq) - k * 18, q.piece, 1 + k * 0.35, 8 + k * 20, 1 - k, false);
    }
    if (a) {
      var tt = Math.min(a.pts.length - 1 - 1e-6, Math.max(0, (t - a.t0) / a.seg)), seg = Math.floor(tt), f = tt - seg;
      var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      var p0 = a.pts[seg], p1 = a.pts[seg + 1], X = cx(p0) + (cx(p1) - cx(p0)) * e, Y = cy(p0) + (cy(p1) - cy(p0)) * e;
      var arc = a.caps.length ? Math.sin(f * Math.PI) : Math.sin(f * Math.PI) * 0.3;
      drawPiece(X, Y - arc * 14, a.piece, 1 + arc * 0.12, 4 + arc * 16, 1, false);
    }
    // 손가락으로 끄는 말
    if (drag && drag.moved) drawPiece(drag.x, drag.y - 10, b.s[drag.sq], 1.08, 14, 1, true);
  }
  function sqFill(sq) { ctx.fillRect(M0 + (sq & 7) * SQ, M0 + (sq >> 3) * SQ, SQ, SQ); }

  // 말 한 개 — 위에서 살짝 내려다본 둥근 나무 말: 옆면 톱니 결, 윗면 동심원 홈, 왼쪽 위 빛
  var PAL = {
    1: { hi: '#ff7a64', mid: '#d0302a', lo: '#8a1414', edge: '#6a0c0c', edgeHi: '#a82420', ring: 'rgba(90,0,0,.55)', ringHi: 'rgba(255,170,150,.35)', spec: 0.55 },
    '-1': { hi: '#6e6e72', mid: '#2a2a2e', lo: '#101012', edge: '#050506', edgeHi: '#2c2c30', ring: 'rgba(0,0,0,.7)', ringHi: 'rgba(255,255,255,.14)', spec: 0.32 }
  };
  function disc(x, y, c, R, h) {
    // 옆면
    var eg = ctx.createLinearGradient(x - R, 0, x + R, 0);
    eg.addColorStop(0, c.edgeHi); eg.addColorStop(0.45, c.edge); eg.addColorStop(1, c.edge);
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(x, y + h, R, 0, Math.PI); ctx.lineTo(x - R, y); ctx.arc(x, y, R, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y + h, R, 0, Math.PI); ctx.lineTo(x - R, y); ctx.arc(x, y, R, Math.PI, 0, true); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
    for (var k = 1; k < 24; k++) { var ang = Math.PI * k / 24, px = x + Math.cos(ang) * R; ctx.beginPath(); ctx.moveTo(px, y + Math.sin(ang) * R - 2); ctx.lineTo(px, y + h + Math.sin(ang) * R); ctx.stroke(); }
    ctx.restore();
    // 윗면
    var g = ctx.createRadialGradient(x - R * 0.4, y - R * 0.45, R * 0.1, x, y, R * 1.05);
    g.addColorStop(0, c.hi); g.addColorStop(0.55, c.mid); g.addColorStop(1, c.lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
    // 동심원 홈 두 줄 — 어두운 골 + 아래쪽 밝은 턱
    var rs = [0.78, 0.5], j;
    for (j = 0; j < 2; j++) {
      ctx.strokeStyle = c.ring; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, R * rs[j], 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = c.ringHi; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(x + 0.6, y + 1.1, R * rs[j], 0.1, Math.PI - 0.1); ctx.stroke();
    }
    // 빛
    var sg = ctx.createRadialGradient(x - R * 0.38, y - R * 0.42, 0, x - R * 0.38, y - R * 0.42, R * 0.55);
    sg.addColorStop(0, 'rgba(255,255,255,' + c.spec + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
  }
  function crown(x, y, R) {
    var w = R * 0.5, h = R * 0.62, b = y + h * 0.42, tp = y - h * 0.58;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w, b); ctx.lineTo(x - w, tp + h * 0.3); ctx.lineTo(x - w * 0.5, y + h * 0.02); ctx.lineTo(x, tp); ctx.lineTo(x + w * 0.5, y + h * 0.02); ctx.lineTo(x + w, tp + h * 0.3); ctx.lineTo(x + w, b); ctx.closePath();
    var g = ctx.createLinearGradient(0, tp, 0, b); g.addColorStop(0, '#fff2a8'); g.addColorStop(0.5, '#f2c230'); g.addColorStop(1, '#a8740c');
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1.5; ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#5a3a04'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#fff7c8'; [[x - w, tp + h * 0.3], [x, tp], [x + w, tp + h * 0.3]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], R * 0.085, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = 'rgba(90,50,0,.6)'; ctx.fillRect(x - w, b - h * 0.26, w * 2, 1.6); ctx.fillStyle = '#e8413a'; ctx.beginPath(); ctx.arc(x, b - h * 0.13, R * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawPiece(x, y, p, sc, lift, al, glow) {
    var c = PAL[p > 0 ? 1 : '-1'], king = p === 2 || p === -2, R = PR * sc, h = 7 * sc;
    ctx.save(); ctx.globalAlpha = al;
    // 바닥 그림자 — 들리면 멀어지고 옅어진다
    var sh = ctx.createRadialGradient(x + 3 + lift * 0.5, y + 6 + lift * 0.7, R * 0.3, x + 3 + lift * 0.5, y + 6 + lift * 0.7, R * 1.15 + lift * 0.4);
    sh.addColorStop(0, 'rgba(0,0,0,' + (0.5 - Math.min(0.25, lift * 0.012)) + ')'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x + 3 + lift * 0.5, y + 6 + lift * 0.7, R * 1.2 + lift * 0.4, 0, Math.PI * 2); ctx.fill();
    var yy = y - h - lift;
    if (glow) { ctx.save(); ctx.shadowColor = 'rgba(255,230,120,.9)'; ctx.shadowBlur = 16; ctx.fillStyle = 'rgba(255,230,120,.5)'; ctx.beginPath(); ctx.arc(x, yy + h * 0.5, R + 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    disc(x, yy + (king ? 0 : 0), c, R, h);
    if (king) { yy -= h; disc(x, yy, c, R, h); crown(x, yy, R); }
    if (glow) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3.5; ctx.shadowColor = 'rgba(255,210,60,.9)'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x, yy, R + 1.5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  // ── 입력 ──
  function hit(px, py) {
    var q = toLogical(px, py), c = Math.floor((q.x - M0) / SQ), rr = Math.floor((q.y - M0) / SQ);
    if (c < 0 || rr < 0 || c > 7 || rr > 7) return -1;
    return rr * 8 + c;
  }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') document.body.classList.add('touch');
    A.init();
    if (G.mode === 'wait' && G.result) { showOver(); return; }
    if (!humanTurn()) return;
    var sq = hit(e.clientX, e.clientY), was = G.sel;
    tapSquare(sq);
    if (G.mode === 'play' && G.sel >= 0 && G.sel === sq && !G.partial.length) {   // 고른 말은 끌어서 놓을 수도 있다
      var q = toLogical(e.clientX, e.clientY);
      drag = { sq: sq, x: q.x, y: q.y, sx: q.x, sy: q.y, moved: false, was: was };
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') hover = hit(e.clientX, e.clientY);
    if (!drag) return;
    var q = toLogical(e.clientX, e.clientY); drag.x = q.x; drag.y = q.y;
    if (!drag.moved && Math.hypot(q.x - drag.sx, q.y - drag.sy) > 14) drag.moved = true;
  });
  cv.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.moved) return;
    var sq = hit(e.clientX, e.clientY);
    if (humanTurn() && G.sel === d.sq && nextSteps().indexOf(sq) >= 0) advance(sq);
  });
  cv.addEventListener('pointercancel', function () { drag = null; });
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hover = -1; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function titleBoard() { G.b.reset(); G.last = null; G.sel = -1; G.partial = []; G.anim = null; }
  $('btnStart').addEventListener('click', function () { A.init(); G.p2 = false; start(loadBest()); });
  $('btn2p').addEventListener('click', function () { A.init(); G.p2 = true; start(G.level); });
  $('btnRetry').addEventListener('click', function () {
    A.init();
    if (G.p2) start(G.level);
    else start(G.result && G.result.winner === RED ? Math.min(TOP, G.level + 1) : G.level);
  });
  $('btnHome').addEventListener('click', function () {
    G.gid++; G.mode = 'title'; titleBoard(); $('over').classList.remove('show'); $('title').classList.remove('hide');
    document.body.classList.remove('playing'); G.level = loadBest(); showRec(); updHud();
  });
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  addEventListener('keydown', function (e) {
    if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); }
  });
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  addEventListener('resize', resize);

  function loop() {
    requestAnimationFrame(loop);
    if (innerWidth !== view.w || innerHeight !== view.h) resize();   // 숨은 탭에서 크기가 0 으로 잡혔다가 돌아올 때
    stepAnim();
    draw();
  }

  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');
  G.level = loadBest(); titleBoard(); syncTog(); updHud(); showRec(); resize();
  requestAnimationFrame(loop);
  // 시험용 손잡이 — 멈춘 탭에서 프레임을 손으로 돌린다
  window.__ck = {
    setClock: function (t) { VT = t; }, draw: draw, view: view, canvas: cv, G: G, E: E, A: A,
    start: start, commit: commit, tapSquare: tapSquare, showOver: showOver, hasWorker: function () { return !!worker; },
    toScreen: function (sq) { return { x: view.ox + cx(sq) * view.s, y: view.oy + cy(sq) * view.s }; },
    zoom: function (s, ox, oy) { view.s = s; view.ox = ox; view.oy = oy; boardCv = null; draw(); },
    tick: function (n) { for (var k = 0; k < (n || 1); k++) { stepAnim(); draw(); } }
  };
})();
