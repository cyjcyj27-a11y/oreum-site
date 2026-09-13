/* 오목 — 규칙판 + 수읽기. 15줄, 다섯 이상 이으면 이긴다, 흑백 모두 3·3 금지. 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var N = 15, NN = N * N, EMPTY = 0, BLACK = 1, WHITE = 2, EDGE = 3;
  var WIN = 100000000, INF = 1e12;

  // ── 다섯 칸 창 — 판 위의 모든 가로·세로·대각 다섯 칸 묶음 ──
  var WINS = [], CELLW = [], i, x, y, d, k;
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (i = 0; i < NN; i++) CELLW.push([]);
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) for (d = 0; d < 4; d++) {
    var ex = x + DIRS[d][0] * 4, ey = y + DIRS[d][1] * 4;
    if (ex < 0 || ex >= N || ey < 0 || ey >= N) continue;
    var cells = [];
    for (k = 0; k < 5; k++) cells.push((y + DIRS[d][1] * k) * N + x + DIRS[d][0] * k);
    for (k = 0; k < 5; k++) CELLW[cells[k]].push(WINS.length);
    WINS.push(cells);
  }
  var NW = WINS.length;
  // 둘 자리 점수(창 속 내 돌 수 / 상대 돌 수) — 이미 알려진 다섯 칸 창 점수표
  var ATT = [7, 35, 800, 15000, 800000], DEF = [0, 15, 400, 1800, 100000];
  // 판 점수(둘 차례 쪽에서 본 값)
  var VM = [0, 3, 40, 1000, 0, 0], VO = [0, 2, 30, 600, 20000, 0];

  function Board() {
    this.c = new Uint8Array(NN);
    this.cnt = [null, new Uint8Array(NW), new Uint8Array(NW)];
    this.near = new Uint8Array(NN);
    this.n4 = [0, 0, 0];          // 한 수면 다섯이 되는 창 수
    this.sm = [0, 0, 0]; this.so = [0, 0, 0];
    this.reset();
  }
  var BP = Board.prototype;
  BP.reset = function () {
    this.c.fill(0); this.cnt[1].fill(0); this.cnt[2].fill(0); this.near.fill(0);
    this.n4[1] = this.n4[2] = 0;
    this.sm[1] = this.sm[2] = 0; this.so[1] = this.so[2] = 0;
    this.turn = BLACK; this.moves = 0; this.last = -1; this.win = null;
  };
  BP.copyFrom = function (b) {
    this.c.set(b.c); this.cnt[1].set(b.cnt[1]); this.cnt[2].set(b.cnt[2]); this.near.set(b.near);
    this.n4[1] = b.n4[1]; this.n4[2] = b.n4[2]; this.sm[1] = b.sm[1]; this.sm[2] = b.sm[2]; this.so[1] = b.so[1]; this.so[2] = b.so[2];
    this.turn = b.turn; this.moves = b.moves; this.last = b.last; this.win = b.win;
  };
  // 창 하나의 기여를 빼고/더한다
  BP._w = function (w, sign) {
    var a = this.cnt[1][w], b = this.cnt[2][w];
    if (b === 0) { this.sm[1] += sign * VM[a]; this.so[1] += sign * VO[a]; if (a === 4) this.n4[1] += sign; }
    if (a === 0) { this.sm[2] += sign * VM[b]; this.so[2] += sign * VO[b]; if (b === 4) this.n4[2] += sign; }
  };
  BP._near = function (p, dv) {
    var px = p % N, py = (p / N) | 0, xx, yy;
    for (yy = Math.max(0, py - 2); yy <= Math.min(N - 1, py + 2); yy++)
      for (xx = Math.max(0, px - 2); xx <= Math.min(N - 1, px + 2); xx++) this.near[yy * N + xx] += dv;
  };
  BP.put = function (p, col) {
    var ws = CELLW[p], j, w, cc = this.cnt[col];
    this.c[p] = col;
    for (j = 0; j < ws.length; j++) { w = ws[j]; this._w(w, -1); cc[w]++; this._w(w, 1); }
    this._near(p, 1);
  };
  BP.take = function (p) {
    var col = this.c[p], ws = CELLW[p], j, w, cc = this.cnt[col];
    for (j = 0; j < ws.length; j++) { w = ws[j]; this._w(w, -1); cc[w]--; this._w(w, 1); }
    this.c[p] = EMPTY;
    this._near(p, -1);
  };
  // 두면 다섯 이상이 되나
  BP.makesFive = function (p, col) {
    var ws = CELLW[p], j, o = this.cnt[3 - col], m = this.cnt[col];
    for (j = 0; j < ws.length; j++) if (m[ws[j]] === 4 && o[ws[j]] === 0) return true;
    return false;
  };
  // 한 수면 col 이 다섯이 되는 빈자리들
  BP.fiveCells = function (col) {
    var out = [], w, j, m = this.cnt[col], o = this.cnt[3 - col];
    if (!this.n4[col]) return out;
    for (w = 0; w < NW; w++) if (m[w] === 4 && o[w] === 0) {
      for (j = 0; j < 5; j++) { var q = WINS[w][j]; if (this.c[q] === EMPTY && out.indexOf(q) < 0) out.push(q); }
    }
    return out;
  };

  // ── 3·3 금지 ──
  var buf = new Uint8Array(9);
  function lineAt(c, p, dx, dy) {
    var px = p % N, py = (p / N) | 0, kk, xx, yy;
    for (kk = -4; kk <= 4; kk++) { xx = px + dx * kk; yy = py + dy * kk; buf[kk + 4] = (xx < 0 || yy < 0 || xx >= N || yy >= N) ? EDGE : c[yy * N + xx]; }
  }
  function fiveIn(col) { var run = 0, j; for (j = 0; j < 9; j++) { run = buf[j] === col ? run + 1 : 0; if (run >= 5) return true; } return false; }
  function openFourIn(col) {   // 가운데 돌을 품은 _XXXX_
    for (var s = 1; s <= 4; s++) {
      if (buf[s - 1] !== EMPTY || buf[s + 4] !== EMPTY) continue;
      if (buf[s] === col && buf[s + 1] === col && buf[s + 2] === col && buf[s + 3] === col) return true;
    }
    return false;
  }
  function threeDir(c, p, col, dx, dy) {
    lineAt(c, p, dx, dy); buf[4] = col;
    for (var kk = -3; kk <= 3; kk++) {
      if (!kk || buf[4 + kk] !== EMPTY) continue;
      buf[4 + kk] = col;
      var ok = !fiveIn(col) && openFourIn(col);
      buf[4 + kk] = EMPTY;
      if (ok) return true;
    }
    return false;
  }
  BP.isDoubleThree = function (p, col) {
    if (this.makesFive(p, col)) return false;
    var n = 0;
    for (var dd = 0; dd < 4; dd++) if (threeDir(this.c, p, col, DIRS[dd][0], DIRS[dd][1]) && ++n >= 2) return true;
    return false;
  };
  BP.legal = function (p, col) { return p >= 0 && p < NN && this.c[p] === EMPTY && !this.isDoubleThree(p, col || this.turn); };

  // 실제로 둔다. 이기면 다섯 줄 양 끝을 돌려준다
  BP.play = function (p) {
    var col = this.turn;
    this.put(p, col); this.moves++; this.last = p; this.turn = 3 - col;
    var px = p % N, py = (p / N) | 0, dd, s, e, dx, dy;
    for (dd = 0; dd < 4; dd++) {
      dx = DIRS[dd][0]; dy = DIRS[dd][1];
      for (s = 0; at(this, px - dx * (s + 1), py - dy * (s + 1)) === col; s++);
      for (e = 0; at(this, px + dx * (e + 1), py + dy * (e + 1)) === col; e++);
      if (s + e + 1 >= 5) { this.win = { col: col, a: (py - dy * s) * N + px - dx * s, b: (py + dy * e) * N + px + dx * e }; return true; }
    }
    return false;
  };
  function at(b, xx, yy) { return (xx < 0 || yy < 0 || xx >= N || yy >= N) ? EDGE : b.c[yy * N + xx]; }
  BP.full = function () { return this.moves >= NN; };

  // ── 둘 자리 점수 ──
  BP.pointScore = function (p, col, defW) {
    var ws = CELLW[p], j, w, a, o, att = 0, def = 0, m = this.cnt[col], op = this.cnt[3 - col];
    for (j = 0; j < ws.length; j++) {
      w = ws[j]; a = m[w]; o = op[w];
      if (o === 0) att += ATT[a];
      else if (a === 0) def += DEF[o];
    }
    return att + def * (defW == null ? 1 : defW);
  };
  // 둘 만한 자리(돌 둘레 두 칸) — 점수 높은 순
  BP.candidates = function (col, beam, defW, noise) {
    var list = [], p;
    for (p = 0; p < NN; p++) if (this.c[p] === EMPTY && this.near[p]) {
      var s = this.pointScore(p, col, defW);
      if (noise) s *= 1 + (Math.random() - 0.5) * noise;
      list.push({ p: p, s: s });
    }
    if (!list.length && this.c[(N >> 1) * N + (N >> 1)] === EMPTY) list.push({ p: (N >> 1) * N + (N >> 1), s: 1 });
    list.sort(function (u, v) { return v.s - u.s; });
    var out = [];
    for (var j = 0; j < list.length && out.length < beam; j++) if (!this.isDoubleThree(list[j].p, col)) out.push(list[j].p);
    return out;
  };

  // ── 수읽기: 알파베타 ──
  var nodes = 0, deadline = 0, aborted = false;
  function evalFor(b, col) { return b.sm[col] - b.so[3 - col]; }
  function nega(b, col, depth, alpha, beta, ply, beam) {
    if ((++nodes & 511) === 0 && performance.now() > deadline) aborted = true;
    if (aborted) return 0;
    var opp = 3 - col;
    if (b.n4[col]) return WIN - ply;
    if (depth <= 0) return evalFor(b, col);
    var cands;
    if (b.n4[opp]) {
      cands = b.fiveCells(opp);
      if (cands.length >= 2) return -(WIN - ply - 1);
      if (b.isDoubleThree(cands[0], col)) return -(WIN - ply - 1);
    } else cands = b.candidates(col, beam, 1, 0);
    if (!cands.length) return 0;
    var best = -INF;
    for (var j = 0; j < cands.length; j++) {
      b.put(cands[j], col);
      var v = -nega(b, opp, depth - 1, -beta, -alpha, ply + 1, beam);
      b.take(cands[j]);
      if (aborted) return 0;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  // ── 연속 넉 — 4 를 계속 만들어 이기는 길 ──
  var vcfNodes = 0;
  function vcf(b, col, depth) {
    var opp = 3 - col, j, m, t;
    if (b.n4[col]) return b.fiveCells(col)[0];
    if (b.n4[opp] || depth <= 0 || ++vcfNodes > 20000) return -1;
    var cm = b.cnt[col], co = b.cnt[opp], seen = [];
    for (var w = 0; w < NW; w++) if (cm[w] === 3 && co[w] === 0) {
      for (j = 0; j < 5; j++) { m = WINS[w][j]; if (b.c[m] === EMPTY && seen.indexOf(m) < 0) seen.push(m); }
    }
    for (j = 0; j < seen.length; j++) {
      m = seen[j];
      if (b.isDoubleThree(m, col)) continue;
      b.put(m, col);
      var T = b.fiveCells(col), r = -1;
      if (T.length >= 2) r = m;
      else if (T.length === 1) {
        t = T[0];
        b.put(t, opp);
        if (!b.n4[opp] && vcf(b, col, depth - 1) >= 0) r = m;
        b.take(t);
      }
      b.take(m);
      if (r >= 0) return r;
    }
    return -1;
  }
  function findVCF(b, col, depth) { vcfNodes = 0; return vcf(b, col, depth || 14); }

  // ── 급수별 상대 ──
  // L 0~10 (10급 → 1단). 6급·5급이 막기만 해서 판이 꽉 찼다(사장님 2026-09-13) → 욕심쟁이 급수는 막는 점수를 낮춰 공격도 한다
  function Think(board, level) {
    this.b = new Board(); this.b.copyFrom(board);
    this.col = board.turn; this.L = level; this.done = false; this.move = -1; this.depth = 0;
    var L = level;
    this.cfg = L <= 5
      ? { greedy: true, topk: [8, 5, 4, 3, 2, 1][L], defW: [0.3, 0.4, 0.5, 0.55, 0.65, 0.75][L], miss: [0.5, 0.35, 0.2, 0.1, 0, 0][L], noise: [0.3, 0.25, 0.2, 0.15, 0.1, 0.06][L] }
      : { greedy: false, maxDepth: [2, 3, 4, 8, 10][L - 6], ms: [300, 500, 800, 1200, 2000][L - 6], beam: [8, 10, 10, 12, 12][L - 6], vcf: L >= 7, guard: L >= 9 };
  }
  Think.prototype.step = function () {
    if (this.done) return true;
    var b = this.b, col = this.col, opp = 3 - col, cfg = this.cfg, f, j;
    if (!this.started) {
      this.started = true;
      // 이길 자리
      f = b.fiveCells(col);
      if (f.length && !(cfg.greedy && Math.random() < cfg.miss * 0.5)) return this.finish(f[0]);
      // 막을 자리
      f = b.fiveCells(opp);
      if (f.length && !(cfg.greedy && Math.random() < cfg.miss)) {
        for (j = 0; j < f.length; j++) if (!b.isDoubleThree(f[j], col)) return this.finish(f[j]);
      }
      if (cfg.greedy) {
        var c = b.candidates(col, cfg.topk, cfg.defW, cfg.noise);
        return this.finish(c.length ? c[Math.floor(Math.random() * Math.random() * c.length)] : -1);
      }
      if (cfg.vcf) { var v = findVCF(b, col, 14); if (v >= 0) return this.finish(v); }
      this.root = b.candidates(col, cfg.beam + 4, 1, 0.04);
      if (!this.root.length) return this.finish(-1);
      if (cfg.guard) {   // 상대의 연속 넉을 막지 못하는 수는 뺀다
        var safe = [], t0 = performance.now();
        for (j = 0; j < this.root.length; j++) {
          b.put(this.root[j], col);
          var bad = findVCF(b, opp, 10) >= 0;
          b.take(this.root[j]);
          if (!bad) safe.push(this.root[j]);
          if (performance.now() - t0 > 400) { for (j++; j < this.root.length; j++) safe.push(this.root[j]); break; }
        }
        if (safe.length) this.root = safe;
      }
      this.best = this.root[0]; this.t0 = performance.now();
      return false;
    }
    // 한 번에 한 깊이씩
    this.depth++;
    deadline = this.t0 + cfg.ms; aborted = false; nodes = 0;
    var alpha = -INF, scored = [], bestM = this.root[0];
    for (j = 0; j < this.root.length; j++) {
      var m = this.root[j];
      b.put(m, col);
      var val = -nega(b, opp, this.depth - 1, -INF, -alpha, 1, cfg.beam);
      b.take(m);
      if (aborted) break;
      scored.push({ m: m, v: val });
      if (val > alpha) { alpha = val; bestM = m; }
    }
    if (!aborted) {
      this.best = bestM;
      scored.sort(function (u, v) { return v.v - u.v; });
      this.root = scored.map(function (e) { return e.m; });
      if (alpha >= WIN - 100 || alpha <= -(WIN - 100) && this.depth > 1) return this.finish(this.best);
    }
    if (aborted || this.depth >= cfg.maxDepth || performance.now() > this.t0 + cfg.ms) return this.finish(this.best);
    return false;
  };
  Think.prototype.finish = function (m) { this.done = true; this.move = m; return true; };

  window.OmokEngine = { N: N, EMPTY: EMPTY, BLACK: BLACK, WHITE: WHITE, Board: Board, Think: Think, findVCF: findVCF, WINS: WINS };
})();
