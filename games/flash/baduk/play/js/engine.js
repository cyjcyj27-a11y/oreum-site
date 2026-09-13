/* 바둑 — 규칙판 + 수읽기(몬테카를로 트리 탐색 + RAVE). 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var N = 13, W = N + 2, SZ = W * W;
  var EMPTY = 0, BLACK = 1, WHITE = 2, EDGE = 3, PASS = 0;
  var D4 = [-W, 1, W, -1], DG = [-W - 1, -W + 1, W - 1, W + 1];
  var EXPAND = 8, RAVE_K = 800, UCT_C = 0.1;

  // ── 판 — 모임(연결된 돌)마다 가짜 활로 수·합·제곱합을 들고 있어 단수를 바로 안다 ──
  function Board() {
    this.c = new Uint8Array(SZ);
    this.hd = new Int16Array(SZ);    // 모임 머리
    this.nx = new Int16Array(SZ);    // 모임 고리
    this.sz = new Int16Array(SZ);
    this.lb = new Int32Array(SZ);    // 활로 수(겹쳐 셈)
    this.ls = new Float64Array(SZ);  // 활로 자리 합
    this.lq = new Float64Array(SZ);  // 활로 자리 제곱합
    this.em = new Int16Array(SZ);    // 빈 자리 목록
    this.ei = new Int16Array(SZ);
    this.cap = new Int16Array(3);    // 따낸 돌
    this.reset();
  }
  var BP = Board.prototype;
  BP.reset = function () {
    var x, y, p;
    this.c.fill(EDGE); this.hd.fill(0); this.nx.fill(0); this.sz.fill(0);
    this.lb.fill(0); this.ls.fill(0); this.lq.fill(0); this.cap.fill(0);
    this.ne = 0;
    for (y = 1; y <= N; y++) for (x = 1; x <= N; x++) { p = y * W + x; this.c[p] = EMPTY; this.ei[p] = this.ne; this.em[this.ne++] = p; }
    this.ko = 0; this.turn = BLACK; this.passes = 0; this.last = -1; this.moves = 0;
  };
  BP.copyFrom = function (b) {
    this.c.set(b.c); this.hd.set(b.hd); this.nx.set(b.nx); this.sz.set(b.sz);
    this.lb.set(b.lb); this.ls.set(b.ls); this.lq.set(b.lq); this.em.set(b.em); this.ei.set(b.ei); this.cap.set(b.cap);
    this.ne = b.ne; this.ko = b.ko; this.turn = b.turn; this.passes = b.passes; this.last = b.last; this.moves = b.moves;
  };
  BP.atari = function (h) { var l = this.lb[h]; return l > 0 && l * this.lq[h] === this.ls[h] * this.ls[h]; };
  BP.libOf = function (h) { return this.ls[h] / this.lb[h]; };   // 단수일 때 남은 한 자리

  BP.merge = function (a, b) {
    if (this.sz[a] < this.sz[b]) { var t = a; a = b; b = t; }
    var s = b;
    do { this.hd[s] = a; s = this.nx[s]; } while (s !== b);
    var t2 = this.nx[a]; this.nx[a] = this.nx[b]; this.nx[b] = t2;
    this.sz[a] += this.sz[b]; this.lb[a] += this.lb[b]; this.ls[a] += this.ls[b]; this.lq[a] += this.lq[b];
  };
  BP.remove = function (h) {
    var c = this.c, s = h, i, r, g, cr;
    this.cap[3 - c[h]] += this.sz[h];
    do { c[s] = EMPTY; this.ei[s] = this.ne; this.em[this.ne++] = s; s = this.nx[s]; } while (s !== h);
    s = h;
    do {
      for (i = 0; i < 4; i++) {
        r = s + D4[i]; cr = c[r];
        if (cr === BLACK || cr === WHITE) { g = this.hd[r]; this.lb[g]++; this.ls[g] += s; this.lq[g] += s * s; }
      }
      s = this.nx[s];
    } while (s !== h);
  };
  // 둔다. 따낸 돌 수를 돌려준다. 합법인지는 부르는 쪽이 먼저 legal() 로 본다
  BP.play = function (p) {
    var col = this.turn, opp = 3 - col, c = this.c, i, q, h, capN = 0, capPt = 0, k, le;
    this.moves++; this.last = p;
    if (p === PASS) { this.passes++; this.ko = 0; this.turn = opp; return 0; }
    this.passes = 0;
    k = this.ei[p]; le = this.em[--this.ne]; this.em[k] = le; this.ei[le] = k;
    c[p] = col; this.hd[p] = p; this.nx[p] = p; this.sz[p] = 1; this.lb[p] = 0; this.ls[p] = 0; this.lq[p] = 0;
    for (i = 0; i < 4; i++) {
      q = p + D4[i];
      if (c[q] === EMPTY) { this.lb[p]++; this.ls[p] += q; this.lq[p] += q * q; }
      else if (c[q] !== EDGE) { h = this.hd[q]; this.lb[h]--; this.ls[h] -= p; this.lq[h] -= p * p; }
    }
    for (i = 0; i < 4; i++) {
      q = p + D4[i];
      if (c[q] === col) { if (this.hd[q] !== this.hd[p]) this.merge(this.hd[p], this.hd[q]); }
      else if (c[q] === opp) { h = this.hd[q]; if (this.lb[h] === 0) { capN += this.sz[h]; capPt = q; this.remove(h); } }
    }
    h = this.hd[p];
    this.ko = (capN === 1 && this.sz[h] === 1 && this.lb[h] === 1) ? capPt : 0;
    this.turn = opp;
    return capN;
  };
  BP.legal = function (p, col) {
    if (p === PASS) return true;
    if (this.c[p] !== EMPTY || p === this.ko) return false;
    var i, cq, at;
    for (i = 0; i < 4; i++) {
      cq = this.c[p + D4[i]];
      if (cq === EMPTY) return true;
      if (cq === EDGE) continue;
      at = this.atari(this.hd[p + D4[i]]);
      if (cq === col) { if (!at) return true; } else if (at) return true;
    }
    return false;
  };
  // 제 집(눈) 메우기인가
  BP.eye = function (p, col) {
    var i, cq, bad = 0, edge = 0;
    for (i = 0; i < 4; i++) { cq = this.c[p + D4[i]]; if (cq !== col && cq !== EDGE) return false; }
    for (i = 0; i < 4; i++) { cq = this.c[p + DG[i]]; if (cq === EDGE) edge = 1; else if (cq === 3 - col) bad++; }
    return bad + edge < 2;
  };
  // 두면 제 모임이 단수가 되는가 — 그 모임 크기(아니면 0)
  var saLibs = [0, 0], saSeen = [0, 0, 0, 0];
  BP.selfAtari = function (p, col) {
    var nl = 0, ns = 0, i, j, q, r, cq, h, s, size = 1, opp = 3 - col, dup;
    for (i = 0; i < 4; i++) {
      q = p + D4[i]; cq = this.c[q];
      if (cq === EMPTY) { if (nl === 0 || saLibs[0] !== q) { if (nl === 1) return 0; saLibs[nl++] = q; } }
      else if (cq === opp) { if (this.atari(this.hd[q])) return 0; }
      else if (cq === col) {
        h = this.hd[q]; dup = false;
        for (j = 0; j < ns; j++) if (saSeen[j] === h) dup = true;
        if (dup) continue;
        saSeen[ns++] = h; size += this.sz[h];
        s = h;
        do {
          for (j = 0; j < 4; j++) {
            r = s + D4[j];
            if (this.c[r] === EMPTY && r !== p && (nl === 0 || saLibs[0] !== r)) { if (nl === 1) return 0; saLibs[nl++] = r; }
          }
          s = this.nx[s];
        } while (s !== h);
      }
    }
    return size;
  };

  // ── 판 끝 셈(집 + 돌, 중국식) — 흑 기준 점수 ──
  function score(b, own, komi) {
    var s = 0, x, y, p, cp, i, cq, nb, nw;
    for (y = 1; y <= N; y++) for (x = 1; x <= N; x++) {
      p = y * W + x; cp = b.c[p];
      if (cp === EMPTY) {
        nb = 0; nw = 0;
        for (i = 0; i < 4; i++) { cq = b.c[p + D4[i]]; if (cq === BLACK) nb++; else if (cq === WHITE) nw++; }
        cp = nb && !nw ? BLACK : nw && !nb ? WHITE : 0;
      }
      if (cp === BLACK) { s++; if (own) own[p]++; } else if (cp === WHITE) { s--; if (own) own[p]--; }
    }
    return s - komi;
  }

  // ── 끝까지 막 두어 보기 — 따낼 수 있으면 따내고, 단수면 달아난다 ──
  function heuristicMove(b, col) {
    var last = b.last, opp = 3 - col, i, q, h, l;
    if (last <= 0) return 0;
    if (b.c[last] === opp) {
      h = b.hd[last];
      if (b.atari(h)) { l = b.libOf(h); if (b.legal(l, col)) return l; }
    }
    for (i = 0; i < 4; i++) {
      q = last + D4[i];
      if (b.c[q] === col) {
        h = b.hd[q];
        if (b.atari(h)) { l = b.libOf(h); if (b.legal(l, col) && !b.selfAtari(l, col)) return l; }
      }
    }
    return 0;
  }
  function randomMove(b, col) {
    var ne = b.ne, st = (Math.random() * ne) | 0, k, p;
    for (k = 0; k < ne; k++) {
      p = b.em[(st + k) % ne];
      if (!b.legal(p, col) || b.eye(p, col)) continue;
      if (b.selfAtari(p, col) >= 2) continue;
      return p;
    }
    return PASS;
  }
  var LIMIT = N * N * 2;
  function playout(b, amaf, own, komi) {
    var t, col, p;
    for (t = 0; t < LIMIT && b.passes < 2; t++) {
      col = b.turn;
      p = Math.random() < 0.9 ? heuristicMove(b, col) : 0;
      if (!p) p = randomMove(b, col);
      if (p && amaf && !amaf[p]) amaf[p] = col;
      b.play(p);
    }
    return score(b, own, komi);
  }

  // ── 트리 ──
  function Node(m, col) { this.m = m; this.col = col; this.n = 0; this.w = 0; this.rn = 0; this.rw = 0; this.ch = null; }
  function expand(node, b) {
    var col = b.turn, opp = 3 - col, ch = [], k, p, i, q, cq, nd, pw, sa, x, y, line, early = b.moves < 30, last = b.last;
    var lx = last > 0 ? last % W : -9, ly = last > 0 ? (last / W) | 0 : -9;
    for (k = 0; k < b.ne; k++) {
      p = b.em[k];
      if (!b.legal(p, col) || b.eye(p, col)) continue;
      pw = 10;
      x = p % W; y = (p / W) | 0; line = Math.min(x, y, W - 1 - x, W - 1 - y);
      if (line === 1) pw -= 4; else if (line === 2 && early) pw -= 2; else if ((line === 3 || line === 4) && early) pw += 2;
      for (i = 0; i < 4; i++) {
        q = p + D4[i]; cq = b.c[q];
        if (cq === opp && b.atari(b.hd[q])) pw += 8;
        else if (cq === col && b.atari(b.hd[q])) pw += 5;
      }
      sa = b.selfAtari(p, col);
      if (sa >= 2) pw -= 8; else if (sa === 1) pw -= 3;
      if (Math.abs(x - lx) + Math.abs(y - ly) <= 2) pw += 2;
      nd = new Node(p, col); nd.rn = 20; nd.rw = Math.max(1, Math.min(19, pw));
      ch.push(nd);
    }
    if (!ch.length) { nd = new Node(PASS, col); nd.rn = 1; nd.rw = 0.5; ch.push(nd); }
    node.ch = ch;
  }
  function select(node) {
    var ch = node.ch, best = ch[0], bv = -1e9, i, c, v, beta, lg = Math.log(node.n + 1);
    for (i = 0; i < ch.length; i++) {
      c = ch[i];
      if (c.n === 0) v = c.rw / c.rn;
      else { beta = Math.sqrt(RAVE_K / (3 * c.n + RAVE_K)); v = (1 - beta) * (c.w / c.n) + beta * (c.rw / c.rn); }
      v += UCT_C * Math.sqrt(lg / (c.n + 1));
      if (v > bv) { bv = v; best = c; }
    }
    return best;
  }

  function Search(board, komi) {
    this.b0 = board; this.komi = komi; this.tmp = new Board();
    this.amaf = new Uint8Array(SZ); this.own = new Int32Array(SZ); this.path = []; this.iters = 0;
    this.root = new Node(-1, 3 - board.turn);
    expand(this.root, board);
  }
  Search.prototype.run = function (n) {
    var root = this.root, b = this.tmp, amaf = this.amaf, path = this.path, it, node, c, i, j, len, sc, bw, ch;
    for (it = 0; it < n; it++) {
      b.copyFrom(this.b0); amaf.fill(0);
      node = root; len = 0; path[len++] = node;
      while (node.ch) {
        node = select(node);
        if (node.m !== PASS && !amaf[node.m]) amaf[node.m] = node.col;
        b.play(node.m); path[len++] = node;
        if (b.passes >= 2) break;
      }
      if (b.passes < 2 && !node.ch && node.n >= EXPAND) {
        expand(node, b);
        node = select(node);
        if (node.m !== PASS && !amaf[node.m]) amaf[node.m] = node.col;
        b.play(node.m); path[len++] = node;
      }
      sc = b.passes >= 2 ? score(b, this.own, this.komi) : playout(b, amaf, this.own, this.komi);
      bw = sc > 0 ? BLACK : WHITE;
      for (i = 0; i < len; i++) {
        node = path[i]; node.n++; if (node.col === bw) node.w++;
        ch = node.ch;
        if (ch) for (j = 0; j < ch.length; j++) {
          c = ch[j];
          if (c.m !== PASS && amaf[c.m] === c.col) { c.rn++; if (c.col === bw) c.rw++; }
        }
      }
      this.iters++;
    }
  };
  // 가장 많이 본 수부터
  Search.prototype.ranked = function () {
    return this.root.ch.slice().sort(function (a, b) { return b.n - a.n; })
      .map(function (c) { return { m: c.m, n: c.n, wr: c.n ? c.w / c.n : 0 }; });
  };

  // 지금 판에서 자리마다 누구 것이 될지 (-1 백 ~ 1 흑)
  function estimate(board, n, komi) {
    var b = new Board(), own = new Int32Array(SZ), out = new Float32Array(SZ), k;
    for (k = 0; k < n; k++) { b.copyFrom(board); b.passes = 0; playout(b, null, own, komi); }
    for (k = 0; k < SZ; k++) out[k] = own[k] / n;
    return out;
  }

  window.BadukEngine = {
    N: N, W: W, SZ: SZ, EMPTY: EMPTY, BLACK: BLACK, WHITE: WHITE, EDGE: EDGE, PASS: PASS,
    Board: Board, Search: Search, estimate: estimate, score: score
  };
})();
