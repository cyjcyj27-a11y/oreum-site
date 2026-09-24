/* 체커 — 규칙과 상대. 8×8, 잡을 수 있으면 반드시 잡는다(연속 잡기 끝까지), 끝줄에 닿으면 킹.
   이 함수 하나를 문자열로 떠서 웹워커에도 싣는다 — 바깥 변수를 쓰지 말 것. */
function CheckersFactory(root) {
  'use strict';
  var RED = 1, BLACK = -1;   // 빨강 = 아래(위로 간다), 검정 = 위(아래로 간다)
  var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  function Board() { this.s = new Int8Array(64); this.turn = RED; }
  Board.prototype.reset = function () {
    var r, c; this.s.fill(0); this.turn = RED;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) if ((r + c) & 1) { if (r < 3) this.s[r * 8 + c] = -1; else if (r > 4) this.s[r * 8 + c] = 1; }
  };
  Board.prototype.clone = function () { var b = new Board(); b.s.set(this.s); b.turn = this.turn; return b; };
  Board.prototype.key = function () { return this.turn + ':' + Array.prototype.join.call(this.s, ''); };
  Board.prototype.count = function (side) { var n = 0, i; for (i = 0; i < 64; i++) if (this.s[i] * side > 0) n++; return n; };

  // 한 말의 잡기 줄기를 끝까지 판다(떠난 자리는 비워 두고 — 한 바퀴 돌아 제자리로 올 수 있다)
  function dig(s, from, side, king, sq, path, caps, out) {
    var r = sq >> 3, c = sq & 7, k, any = false;
    for (k = 0; k < 4; k++) {
      var dr = DIRS[k][0], dc = DIRS[k][1];
      if (!king && dr !== -side) continue;
      var lr = r + 2 * dr, lc = c + 2 * dc;
      if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
      var mid = (r + dr) * 8 + c + dc, land = lr * 8 + lc;
      if (s[mid] * side >= 0 || s[land] !== 0 || caps.indexOf(mid) >= 0) continue;
      any = true;
      path.push(land); caps.push(mid);
      if (!king && (side === RED ? lr === 0 : lr === 7)) out.push({ from: from, path: path.slice(), caps: caps.slice(), crown: true });   // 잡다가 킹이 되면 거기서 끝
      else dig(s, from, side, king, land, path, caps, out);
      path.pop(); caps.pop();
    }
    if (!any && path.length) out.push({ from: from, path: path.slice(), caps: caps.slice(), crown: false });
  }
  function canJump(s, i, side, king) {
    var r = i >> 3, c = i & 7, k;
    for (k = 0; k < 4; k++) {
      var dr = DIRS[k][0], dc = DIRS[k][1];
      if (!king && dr !== -side) continue;
      var lr = r + 2 * dr, lc = c + 2 * dc;
      if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
      if (s[(r + dr) * 8 + c + dc] * side < 0 && s[lr * 8 + lc] === 0) return true;
    }
    return false;
  }
  Board.prototype.moves = function (side) {
    side = side || this.turn;
    var s = this.s, out = [], i, k, p;
    for (i = 0; i < 64; i++) {
      p = s[i]; if (p * side <= 0) continue;
      var kg = p === 2 || p === -2;
      if (canJump(s, i, side, kg)) { s[i] = 0; dig(s, i, side, kg, i, [], [], out); s[i] = p; }
    }
    if (out.length) return out;
    for (i = 0; i < 64; i++) {
      p = s[i]; if (p * side <= 0) continue;
      var r = i >> 3, c = i & 7, king = p === 2 || p === -2;
      for (k = 0; k < 4; k++) {
        var dr = DIRS[k][0], dc = DIRS[k][1];
        if (!king && dr !== -side) continue;
        var nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
        var t = nr * 8 + nc; if (s[t]) continue;
        out.push({ from: i, path: [t], caps: [], crown: !king && (side === RED ? nr === 0 : nr === 7) });
      }
    }
    return out;
  };
  Board.prototype.play = function (m) {
    var s = this.s, p = s[m.from], i, to = m.path[m.path.length - 1];
    s[m.from] = 0;
    for (i = 0; i < m.caps.length; i++) s[m.caps[i]] = 0;
    s[to] = m.crown ? 2 * this.turn : p;
    this.turn = -this.turn;
  };

  // ── 판 점수(빨강 기준) ──
  var CENTER = new Int8Array(64);
  (function () { var r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) CENTER[r * 8 + c] = (r >= 2 && r <= 5 && c >= 2 && c <= 5) ? ((r >= 3 && r <= 4 && c >= 2 && c <= 5) ? 2 : 1) : 0; })();
  function evaluate(s) {
    var i, p, r, c, sc = 0, nR = 0, nB = 0, kR = 0, kB = 0, mR = 0, mB = 0;
    for (i = 0; i < 64; i++) {
      p = s[i]; if (!p) continue;
      r = i >> 3; c = i & 7;
      if (p === 1) { nR++; mR++; sc += 100 + (7 - r) * 3 + CENTER[i] * 3 + (r === 7 ? 5 : 0) + (c === 0 || c === 7 ? -2 : 0); }
      else if (p === -1) { nB++; mB++; sc -= 100 + r * 3 + CENTER[i] * 3 + (r === 0 ? 5 : 0) + (c === 0 || c === 7 ? -2 : 0); }
      else if (p === 2) { nR++; kR++; sc += 155 + CENTER[i] * 4; }
      else { nB++; kB++; sc -= 155 + CENTER[i] * 4; }
    }
    if (!nR) return -20000; if (!nB) return 20000;
    var tot = nR + nB, diff = nR - nB;
    if (diff) sc += diff * (24 - tot) * 3;   // 앞서면 바꿔 주기를 반긴다
    // 말이 적어지면 이기는 쪽 킹은 남은 말에 다가간다(구석에 숨은 킹 몰기)
    if (tot <= 9 && diff) {
      var side = diff > 0 ? 1 : -1, d = 0, a, b;
      for (a = 0; a < 64; a++) if (s[a] === 2 * side) for (b = 0; b < 64; b++) if (s[b] * side < 0) d += Math.max(Math.abs((a >> 3) - (b >> 3)), Math.abs((a & 7) - (b & 7)));
      sc -= side * d * 2;
      // 지는 쪽은 겹모서리(두 구석)가 안전하다
      for (a = 0; a < 64; a++) if (s[a] === -2 * side && (a === 7 || a === 14 || a === 56 || a === 49)) sc -= side * -12;
    }
    return sc;
  }

  // ── 찾기: 알파베타 + 반복 깊이 + 잡기는 끝까지. 판 무늬 해시(조브리스트)로 겹치는 판을 기억한다 ──
  var WIN = 30000;
  var ZR = new Int32Array(5 * 64), ZT = 0x5bd1e995 | 0;
  (function () { var x = 0x9e3779b9 | 0, i; for (i = 0; i < ZR.length; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; ZR[i] = x; } })();
  function zi(p, sq) { return (p + 2) * 64 + sq; }   // -2..2 → 0..4
  function hashOf(b) { var h = b.turn === RED ? 0 : ZT, i; for (i = 0; i < 64; i++) if (b.s[i]) h ^= ZR[zi(b.s[i], i)]; return h; }
  var TTN = 1 << 20, TTM = TTN - 1;
  var ttKey = new Int32Array(TTN), ttVal = new Int16Array(TTN), ttDep = new Int8Array(TTN), ttFlag = new Int8Array(TTN), ttMove = new Int16Array(TTN);
  ttDep.fill(-1);
  var HIST = new Int32Array(64 * 64);

  function Searcher(board, opt) {
    this.b = board.clone(); this.deadline = 0; this.nodes = 0; this.stop = false;
    this.maxDepth = opt.depth; this.timeMs = opt.time; this.noise = opt.noise || 0; this.blind = !!opt.blind;
    this.h = hashOf(this.b); this.h2 = 0;
  }
  function mcode(m) { return (m.from << 6) | m.path[0]; }
  // 두고 무르기 — 판을 통째로 베끼지 않는다
  Searcher.prototype.make = function (m) {
    var s = this.b.s, side = this.b.turn, p = s[m.from], to = m.path[m.path.length - 1], np = m.crown ? 2 * side : p, i, cv = [];
    var h = this.h ^ ZR[zi(p, m.from)] ^ ZR[zi(np, to)] ^ ZT;
    for (i = 0; i < m.caps.length; i++) { var c = m.caps[i]; cv.push(s[c]); h ^= ZR[zi(s[c], c)]; s[c] = 0; }
    s[m.from] = 0; s[to] = np; this.b.turn = -side; this.h = h;
    return { p: p, cv: cv, h: h ^ 0 };
  };
  Searcher.prototype.unmake = function (m, u, hPrev) {
    var s = this.b.s, i, to = m.path[m.path.length - 1];
    s[to] = 0; s[m.from] = u.p;
    for (i = 0; i < m.caps.length; i++) s[m.caps[i]] = u.cv[i];
    this.b.turn = -this.b.turn; this.h = hPrev;
  };
  Searcher.prototype.neg = function (depth, alpha, beta, ply) {
    if ((++this.nodes & 2047) === 0 && performance.now() > this.deadline) this.stop = true;
    if (this.stop) return 0;
    var b = this.b, side = b.turn, ms = b.moves(side);
    if (!ms.length) return -WIN + ply;
    var capt = ms[0].caps.length > 0;
    if (depth <= 0 && (!capt || (this.blind && ply === 1))) return side * evaluate(b.s);
    if (ply > 80) return side * evaluate(b.s);
    if (ms.length === 1 && depth > 0) depth++;   // 외길은 깊이를 안 먹는다
    if (depth < 0) depth = 0;
    var h = this.h, slot = (h ^ (h >>> 12)) & TTM, hit = ttKey[slot] === h && ttDep[slot] >= 0, tm = hit ? ttMove[slot] : -1, a0 = alpha;
    if (hit && ttDep[slot] >= depth) {
      var v0 = ttVal[slot], f0 = ttFlag[slot];
      if (v0 > WIN - 500) v0 -= ply; else if (v0 < -WIN + 500) v0 += ply;
      if (f0 === 0) return v0;
      if (f0 === 1 && v0 >= beta) return v0;
      if (f0 === -1 && v0 <= alpha) return v0;
    }
    // 차례 정하기: 기억해 둔 수 → 많이 잡는 수 → 킹 되는 수 → 전에 잘 끊어 준 수
    var n = ms.length, sc = new Array(n), i, j;
    for (i = 0; i < n; i++) { var m = ms[i], c = mcode(m); sc[i] = (c === tm ? 1e9 : 0) + m.caps.length * 1e6 + (m.crown ? 5e5 : 0) + HIST[c]; }
    var best = -WIN * 2, bm = -1;
    for (i = 0; i < n; i++) {
      var bi = i; for (j = i + 1; j < n; j++) if (sc[j] > sc[bi]) bi = j;
      if (bi !== i) { var tmv = ms[i]; ms[i] = ms[bi]; ms[bi] = tmv; var ts = sc[i]; sc[i] = sc[bi]; sc[bi] = ts; }
      var mv = ms[i], hp = this.h, u = this.make(mv);
      var v;
      if (i === 0) v = -this.neg(depth - 1, -beta, -alpha, ply + 1);
      else {   // 첫 수보다 나은지만 좁게 물어보고, 나으면 다시 넓게
        v = -this.neg(depth - 1, -alpha - 1, -alpha, ply + 1);
        if (v > alpha && v < beta && !this.stop) v = -this.neg(depth - 1, -beta, -alpha, ply + 1);
      }
      this.unmake(mv, u, hp);
      if (this.stop) return 0;
      if (v > best) { best = v; bm = mcode(mv); }
      if (v > alpha) alpha = v;
      if (alpha >= beta) { if (!mv.caps.length) HIST[mcode(mv)] += depth * depth; break; }
    }
    if (!hit || ttDep[slot] <= depth) {
      var sv = best; if (sv > WIN - 500) sv += ply; else if (sv < -WIN + 500) sv -= ply;
      ttKey[slot] = h; ttVal[slot] = sv; ttDep[slot] = Math.min(127, depth); ttFlag[slot] = best <= a0 ? -1 : best >= beta ? 1 : 0; ttMove[slot] = bm;
    }
    return best;
  };
  // 뿌리: 수마다 점수를 매겨 둔다(아래 급수는 비슷한 수 가운데서 흔들어 고른다)
  Searcher.prototype.run = function () {
    var b = this.b, ms = b.moves(b.turn), t0 = performance.now(), d, i;
    if (!ms.length) return { move: -1 };
    if (ms.length === 1) return { move: 0, depth: 0, score: 0 };
    this.deadline = t0 + this.timeMs;
    for (i = 0; i < HIST.length; i++) HIST[i] >>= 2;
    var bestIdx = 0, scores = null, reached = 0;
    for (d = 1; d <= this.maxDepth; d++) {
      var sc = [], alpha = -WIN * 2, order = ms.map(function (m, k) { return k; });
      if (scores) order.sort(function (x, y) { return scores[y] - scores[x]; });
      for (i = 0; i < order.length; i++) {
        var k = order[i], hp = this.h, u = this.make(ms[k]);
        // 흔드는 급수는 모든 수를 제대로 잰다, 아니면 알파베타로 좁힌다
        var v = this.noise ? -this.neg(d - 1, -WIN * 2, WIN * 2, 1) : -this.neg(d - 1, -WIN * 2, -alpha, 1);
        this.unmake(ms[k], u, hp);
        if (this.stop) break;
        sc[k] = v; if (v > alpha) alpha = v;
      }
      if (this.stop) {   // 이번 깊이를 다 못 봤어도 먼저 본 수가 더 좋으면 그걸 쓴다
        if (scores && sc[order[0]] != null) { var bb = order[0]; for (i = 1; i < order.length; i++) { var kk = order[i]; if (sc[kk] != null && sc[kk] > sc[bb]) bb = kk; } if (sc[bb] > scores[bestIdx]) bestIdx = bb; }
        break;
      }
      scores = sc; reached = d;
      bestIdx = 0; for (i = 1; i < ms.length; i++) if (scores[i] > scores[bestIdx]) bestIdx = i;
      if (Math.abs(scores[bestIdx]) > WIN - 200) break;   // 끝이 보인다
      if (performance.now() - t0 > this.timeMs * 0.5) break;   // 다음 깊이는 못 끝낸다
    }
    if (scores && this.noise) {
      var pick = bestIdx, top = -1e9;
      for (i = 0; i < ms.length; i++) {
        if (scores[i] == null) continue;
        var z = scores[i] + (Math.random() + Math.random() + Math.random() - 1.5) * this.noise;
        if (z > top) { top = z; pick = i; }
      }
      bestIdx = pick;
    }
    return { move: bestIdx, depth: reached, score: scores ? scores[bestIdx] : 0, nodes: this.nodes };
  };

  // 급수 → 세기. 0 = 18급 … 17 = 1급, 18 = 1단 … 26 = 9단
  function levelOpt(L) {
    var D = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 8, 10, 12, 14, 16, 20, 26, 34, 60];
    return {
      depth: D[Math.max(0, Math.min(26, L))],
      time: L < 18 ? 400 : 700 + (L - 18) * 380,
      noise: Math.max(0, 70 - L * 5),                 // 18급 70점 … 5급 5점 … 4급부터 0
      blind: L < 6 && Math.random() < 0.4 - L * 0.06   // 초보는 가끔 상대의 되잡기를 못 본다
    };
  }
  function think(board, L) { return new Searcher(board, levelOpt(L)).run(); }

  root.CheckersEngine = { RED: RED, BLACK: BLACK, Board: Board, think: think, levelOpt: levelOpt, evaluate: evaluate };
}
CheckersFactory(window);
