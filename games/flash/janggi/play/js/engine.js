/* 장기 — 규칙과 상대(AI). 모듈 없음(file:// 로 열어도 돈다).
   JanggiEngine() 은 바깥 변수를 하나도 쓰지 않는다 — 함수 글자를 그대로 떠서 일꾼(Worker)에서도 돌린다.
   판: 가로 9줄(x 0~8) × 세로 10줄(y 0~9). 한(漢)이 위(y 0~3), 초(楚)가 아래(y 6~9). 칸 번호 = y*9+x.
   규칙 기준: 대한장기협회 점수제(차13 포7 마5 상3 사3 졸2, 한 덤 1.5). */
function JanggiEngine() {
  'use strict';
  var N = 90, CHO = 1, HAN = 2;
  var K = 1, C = 2, P = 3, M = 4, S = 5, A = 6, J = 7;   // 궁 차 포 마 상 사 졸
  var PTS = [0, 0, 13, 7, 5, 3, 3, 2];
  var PASS = -1, MAXPLY = 200;
  var OX = [0, 1, 0, -1], OY = [-1, 0, 1, 0], DX = [1, 1, -1, -1], DY = [-1, 1, 1, -1];

  // 궁성: 1 = 초 궁성(아래), 2 = 한 궁성(위). diagPt = 대각선 줄이 지나는 점(네 귀와 가운데)
  var inPal = new Int8Array(N), diagPt = new Int8Array(N), palC = [0, 8 * 9 + 4, 1 * 9 + 4];
  (function () {
    for (var y = 0; y < 10; y++) for (var x = 3; x <= 5; x++) {
      var cy = y <= 2 ? 1 : y >= 7 ? 8 : -1; if (cy < 0) continue;
      inPal[y * 9 + x] = cy === 8 ? 1 : 2;
      if (Math.abs(x - 4) === Math.abs(y - cy)) diagPt[y * 9 + x] = 1;
    }
  })();

  // ── 수 만들기(자기 궁이 잡히는지는 안 본다). out 에 from*128+to 를 채우고 개수를 돌려준다 ──
  function gen(b, side, out) {
    var n = 0, sq, p, t, x, y, i, s, nx, ny, q, v, lx, ly, mx, my, px, py, pal, fwd;
    for (sq = 0; sq < N; sq++) {
      p = b[sq]; if (!p || (p >> 3) !== side) continue;
      t = p & 7; x = sq % 9; y = (sq / 9) | 0;
      if (t === K || t === A) {
        pal = inPal[sq];
        for (i = 0; i < 4; i++) {
          nx = x + OX[i]; ny = y + OY[i]; if (nx < 0 || nx > 8 || ny < 0 || ny > 9) continue;
          q = ny * 9 + nx; if (inPal[q] !== pal) continue;
          v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q;
        }
        if (diagPt[sq]) for (i = 0; i < 4; i++) {
          nx = x + DX[i]; ny = y + DY[i]; if (nx < 0 || nx > 8 || ny < 0 || ny > 9) continue;
          q = ny * 9 + nx; if (inPal[q] !== pal) continue;
          v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q;
        }
      } else if (t === C) {
        for (i = 0; i < 4; i++) {
          nx = x + OX[i]; ny = y + OY[i];
          while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
            q = ny * 9 + nx; v = b[q];
            if (!v) out[n++] = sq * 128 + q;
            else { if ((v >> 3) !== side) out[n++] = sq * 128 + q; break; }
            nx += OX[i]; ny += OY[i];
          }
        }
        if (diagPt[sq]) {
          pal = inPal[sq];
          for (i = 0; i < 4; i++) {
            nx = x + DX[i]; ny = y + DY[i];
            while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
              q = ny * 9 + nx; if (inPal[q] !== pal) break;
              v = b[q];
              if (!v) out[n++] = sq * 128 + q;
              else { if ((v >> 3) !== side) out[n++] = sq * 128 + q; break; }
              nx += DX[i]; ny += DY[i];
            }
          }
        }
      } else if (t === P) {
        for (i = 0; i < 4; i++) {
          nx = x + OX[i]; ny = y + OY[i];
          while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9 && !b[ny * 9 + nx]) { nx += OX[i]; ny += OY[i]; }
          if (nx < 0 || nx > 8 || ny < 0 || ny > 9) continue;       // 넘을 다리가 없다
          if ((b[ny * 9 + nx] & 7) === P) continue;                 // 포는 포를 못 넘는다
          nx += OX[i]; ny += OY[i];
          while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
            q = ny * 9 + nx; v = b[q];
            if (!v) out[n++] = sq * 128 + q;
            else { if ((v >> 3) !== side && (v & 7) !== P) out[n++] = sq * 128 + q; break; }   // 포는 포를 못 잡는다
            nx += OX[i]; ny += OY[i];
          }
        }
        if (diagPt[sq] && x !== 4) {                                 // 궁성 귀에서 가운데를 넘어 맞은편 귀로
          pal = inPal[sq]; v = b[palC[pal]];
          if (v && (v & 7) !== P) {
            q = (2 * ((palC[pal] / 9) | 0) - y) * 9 + (8 - x); v = b[q];
            if (!v || ((v >> 3) !== side && (v & 7) !== P)) out[n++] = sq * 128 + q;
          }
        }
      } else if (t === M) {
        for (i = 0; i < 4; i++) {
          lx = x + OX[i]; ly = y + OY[i]; if (lx < 0 || lx > 8 || ly < 0 || ly > 9 || b[ly * 9 + lx]) continue;   // 멱
          for (s = -1; s <= 1; s += 2) {
            nx = lx + OX[i] - OY[i] * s; ny = ly + OY[i] + OX[i] * s;
            if (nx < 0 || nx > 8 || ny < 0 || ny > 9) continue;
            q = ny * 9 + nx; v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q;
          }
        }
      } else if (t === S) {
        for (i = 0; i < 4; i++) {
          lx = x + OX[i]; ly = y + OY[i]; if (lx < 0 || lx > 8 || ly < 0 || ly > 9 || b[ly * 9 + lx]) continue;   // 첫 멱
          for (s = -1; s <= 1; s += 2) {
            px = OX[i] - OY[i] * s; py = OY[i] + OX[i] * s;
            mx = lx + px; my = ly + py; if (mx < 0 || mx > 8 || my < 0 || my > 9 || b[my * 9 + mx]) continue;      // 둘째 멱
            nx = mx + px; ny = my + py; if (nx < 0 || nx > 8 || ny < 0 || ny > 9) continue;
            q = ny * 9 + nx; v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q;
          }
        }
      } else if (t === J) {
        fwd = side === CHO ? -1 : 1;
        ny = y + fwd;
        if (ny >= 0 && ny <= 9) { q = ny * 9 + x; v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q; }
        if (x > 0) { q = sq - 1; v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q; }
        if (x < 8) { q = sq + 1; v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q; }
        if (diagPt[sq] && inPal[sq] === 3 - side && ny >= 0 && ny <= 9) {   // 상대 궁성 안에서는 대각선 줄을 따라 앞으로
          for (s = -1; s <= 1; s += 2) {
            nx = x + s; q = ny * 9 + nx; if (nx < 0 || nx > 8 || inPal[q] !== inPal[sq]) continue;
            v = b[q]; if (!v || (v >> 3) !== side) out[n++] = sq * 128 + q;
          }
        }
      }
    }
    return n;
  }

  function kingSq(b, side) { var k = side * 8 + K; for (var i = 0; i < N; i++) if (b[i] === k) return i; return -1; }
  var chkBuf = new Int32Array(256);
  function attacked(b, sq, by) { var n = gen(b, by, chkBuf); for (var i = 0; i < n; i++) if ((chkBuf[i] & 127) === sq) return true; return false; }
  function inCheck(b, side) { var k = kingSq(b, side); return k >= 0 && attacked(b, k, 3 - side); }
  // 빅장: 두 궁이 같은 세로줄에서 사이에 아무것도 없이 마주 본다
  function facing(b) {
    var a = kingSq(b, CHO), h = kingSq(b, HAN); if (a < 0 || h < 0 || a % 9 !== h % 9) return false;
    for (var q = h + 9; q < a; q += 9) if (b[q]) return false;
    return true;
  }
  function points(b, side) { var s = side === HAN ? 1.5 : 0; for (var i = 0; i < N; i++) if (b[i] && (b[i] >> 3) === side) s += PTS[b[i] & 7]; return s; }
  function key(b, turn) { var s = String(turn); for (var i = 0; i < N; i++) s += String.fromCharCode(48 + b[i]); return s; }

  // 차림: 0 마상마상 · 1 상마상마 · 2 마상상마 · 3 상마마상 (각자 자기 쪽에서 본 왼쪽부터)
  var FORM = [[M, S, M, S], [S, M, S, M], [M, S, S, M], [S, M, M, S]];
  function setup(b, fCho, fHan) {
    var i, f;
    for (i = 0; i < N; i++) b[i] = 0;
    function put(side, x, y, t) { b[y * 9 + x] = side * 8 + t; }
    put(HAN, 0, 0, C); put(HAN, 8, 0, C); put(HAN, 3, 0, A); put(HAN, 5, 0, A); put(HAN, 4, 1, K); put(HAN, 1, 2, P); put(HAN, 7, 2, P);
    put(CHO, 0, 9, C); put(CHO, 8, 9, C); put(CHO, 3, 9, A); put(CHO, 5, 9, A); put(CHO, 4, 8, K); put(CHO, 1, 7, P); put(CHO, 7, 7, P);
    for (i = 0; i < 9; i += 2) { put(HAN, i, 3, J); put(CHO, i, 6, J); }
    f = FORM[fCho]; put(CHO, 1, 9, f[0]); put(CHO, 2, 9, f[1]); put(CHO, 6, 9, f[2]); put(CHO, 7, 9, f[3]);
    f = FORM[fHan]; put(HAN, 7, 0, f[0]); put(HAN, 6, 0, f[1]); put(HAN, 2, 0, f[2]); put(HAN, 1, 0, f[3]);   // 한은 맞은편에서 보므로 거꾸로
  }

  // ── 한 판 ──
  function Game() { this.b = new Int8Array(N); this.reset(0, 0); }
  Game.prototype.reset = function (fCho, fHan) {
    setup(this.b, fCho || 0, fHan || 0);
    this.turn = CHO; this.ply = 0; this.bik = false; this.passes = 0; this.result = null; this.last = null;
    this.seen = {}; this.seen[key(this.b, this.turn)] = 1;
  };
  // 둘 수 있는 수: 자기 궁이 잡히는 수와, 같은 모양이 세 번째로 되는 수는 뺀다
  Game.prototype.legal = function () {
    var b = this.b, side = this.turn, buf = new Int32Array(256), n = gen(b, side, buf), out = [], i, m, f, t, cap, ok;
    for (i = 0; i < n; i++) {
      m = buf[i]; f = m >> 7; t = m & 127; cap = b[t];
      b[t] = b[f]; b[f] = 0;
      ok = !inCheck(b, side) && (this.seen[key(b, 3 - side)] || 0) < 2;
      b[f] = b[t]; b[t] = cap;
      if (ok) out.push(m);
    }
    return out;
  };
  Game.prototype.inCheck = function (side) { return inCheck(this.b, side == null ? this.turn : side); };
  Game.prototype.facing = function () { return facing(this.b); };
  Game.prototype.points = function (side) { return points(this.b, side); };
  Game.prototype.canPass = function () { return !this.result && !inCheck(this.b, this.turn); };
  function byPoints(b, why) { var c = points(b, CHO), h = points(b, HAN); return { winner: c > h ? CHO : HAN, why: why, cho: c, han: h }; }
  // 수를 둔다(m = from*128+to, 한수쉼은 PASS). 돌려주는 것: { cap, check, bik, end }
  Game.prototype.play = function (m) {
    var b = this.b, side = this.turn, opp = 3 - side, ev = { move: m, cap: 0, check: false, bik: false, end: null }, k;
    if (this.result) return ev;
    if (m === PASS) this.passes++;
    else { var f = m >> 7, t = m & 127; ev.cap = b[t]; b[t] = b[f]; b[f] = 0; this.passes = 0; }
    this.last = m; this.turn = opp; this.ply++;
    k = key(b, opp); this.seen[k] = (this.seen[k] || 0) + 1;
    var face = facing(b);
    if (this.bik && face) { this.result = ev.end = { winner: 0, why: 'bikjang', cho: points(b, CHO), han: points(b, HAN) }; return ev; }   // 빅장을 안 풀었다 → 무승부
    this.bik = face; ev.bik = face;
    ev.check = inCheck(b, opp);
    if (ev.check && !this.legal().length) { this.result = ev.end = { winner: side, why: 'mate', cho: points(b, CHO), han: points(b, HAN) }; return ev; }
    if (this.passes >= 2) { this.result = ev.end = byPoints(b, 'pass'); return ev; }
    if (this.ply >= MAXPLY) { this.result = ev.end = byPoints(b, 'limit'); return ev; }
    return ev;
  };
  Game.prototype.resign = function (side) { this.result = { winner: 3 - side, why: 'resign', cho: points(this.b, CHO), han: points(this.b, HAN) }; return this.result; };

  // ════════ 상대(AI): 알파베타. 궁을 잡는 수가 나오면 그 자리에서 끝난 것으로 친다 ════════
  var MATE = 100000, CONTEMPT = 60, INF = 1000000;   // CONTEMPT: 빅장 무승부는 앞서 있을 땐 피하고 뒤질 땐 노린다
  var VAL = [0, 0, 1300, 700, 500, 300, 300, 200];
  // 자리 값(초 기준, 한은 위아래를 뒤집어 읽는다)
  var PST = []; (function () {
    var t, sq, x, y, cx, adv, v;
    for (t = 0; t < 8; t++) PST.push(new Int16Array(N));
    for (sq = 0; sq < N; sq++) {
      x = sq % 9; y = (sq / 9) | 0; cx = 4 - Math.abs(x - 4); adv = 9 - y;      // adv: 초가 앞으로 나간 정도(0~9)
      PST[J][sq] = (adv >= 3 ? (adv - 3) * 9 : 0) + cx * 4 + (y <= 2 && x >= 3 && x <= 5 ? 30 : 0) - (y === 0 ? 45 : 0);
      PST[M][sq] = cx * 7 + (y >= 2 && y <= 7 ? 14 : 0) - (x === 0 || x === 8 ? 16 : 0);
      PST[S][sq] = cx * 5 + (y >= 4 && y <= 8 ? 8 : 0);
      PST[C][sq] = cx * 2 + (y <= 6 ? 10 : 0) + (y <= 2 ? 8 : 0);
      PST[P][sq] = cx * 4 + (y >= 6 ? 8 : 0);
      PST[A][sq] = inPal[sq] === 1 ? (y === 9 ? 0 : 10) + (x === 4 ? 6 : 0) : 0;
      v = inPal[sq] === 1 ? (y === 9 ? 14 : y === 8 ? 6 : -10) : 0; PST[K][sq] = v;
    }
  })();
  function flip(sq) { return (9 - ((sq / 9) | 0)) * 9 + (sq % 9); }
  function evalPos(b, side) {
    var s = 0, i, p, t;
    for (i = 0; i < N; i++) {
      p = b[i]; if (!p) continue; t = p & 7;
      if ((p >> 3) === CHO) s += VAL[t] + PST[t][i]; else s -= VAL[t] + PST[t][flip(i)];
    }
    return side === CHO ? s : -s;
  }

  // 난이도: 0~17 = 18급~1급, 18~26 = 1단~9단. 급이 낮을수록 얕게 읽고 가끔 못 본다(눈대중 흔들림)
  var LV_DEPTH = [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 30];
  var LV_NOISE = [300, 220, 150, 320, 260, 200, 150, 100, 60, 300, 250, 200, 160, 120, 90, 60, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var LV_TIME = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 700, 900, 1000, 1200, 1500, 1800, 2000, 2500, 3000];

  function Search() {
    this.bufs = []; for (var i = 0; i < 64; i++) this.bufs.push(new Int32Array(256));
    this.hist = new Int32Array(128 * 128); this.killer = new Int32Array(64 * 2);
    this.nodes = 0; this.stop = false; this.deadline = 0; this.root = CHO;
  }
  Search.prototype.draw = function (side) { return side === this.root ? -CONTEMPT * 7 : CONTEMPT; };   // 내 무승부는 졸 두 개 값만큼 싫고, 상대는 조금 반긴다고 본다   // side 가 방금 둬서 무승부가 됐을 때 side 기준 값
  Search.prototype.order = function (b, buf, n, ply, first) {
    var sc = this._sc || (this._sc = new Int32Array(256)), i, j, m, cap, v, tm;
    for (i = 0; i < n; i++) {
      m = buf[i]; cap = b[m & 127];
      if (m === first) v = 1 << 30;
      else if (cap) v = (1 << 24) + VAL[cap & 7] * 16 - VAL[b[m >> 7] & 7] + ((cap & 7) === K ? 1 << 26 : 0);
      else if (m === this.killer[ply * 2] || m === this.killer[ply * 2 + 1]) v = 1 << 20;
      else v = this.hist[m];
      sc[i] = v;
    }
    for (i = 1; i < n; i++) { v = sc[i]; tm = buf[i]; for (j = i - 1; j >= 0 && sc[j] < v; j--) { sc[j + 1] = sc[j]; buf[j + 1] = buf[j]; } sc[j + 1] = v; buf[j + 1] = tm; }
  };
  Search.prototype.quiesce = function (b, side, alpha, beta, ply) {
    var stand = evalPos(b, side); this.nodes++;
    if (stand >= beta) return stand; if (stand > alpha) alpha = stand;
    if (ply >= 60) return stand;
    var buf = this.bufs[ply], n = gen(b, side, buf), i, m, f, t, cap, sc, k = 0;
    for (i = 0; i < n; i++) if (b[buf[i] & 127]) buf[k++] = buf[i];
    this.order(b, buf, k, ply, 0);
    for (i = 0; i < k; i++) {
      m = buf[i]; f = m >> 7; t = m & 127; cap = b[t];
      if ((cap & 7) === K) return MATE - ply;
      b[t] = b[f]; b[f] = 0;
      sc = -this.quiesce(b, 3 - side, -beta, -alpha, ply + 1);
      b[f] = b[t]; b[t] = cap;
      if (sc >= beta) return sc; if (sc > alpha) alpha = sc;
    }
    return alpha;
  };
  // bik: 바로 앞 수로 빅장이 걸려 있다(이번에 못 풀면 점수로 끝)
  Search.prototype.nega = function (b, side, depth, alpha, beta, ply, bik, quiet) {
    if ((++this.nodes & 2047) === 0 && this.deadline && Date.now() > this.deadline) this.stop = true;
    if (this.stop) return 0;
    if (depth <= 0) return quiet ? this.quiesce(b, side, alpha, beta, ply) : evalPos(b, side);
    var buf = this.bufs[ply], n = gen(b, side, buf), i, m, f, t, cap, sc, best = -INF, face;
    this.order(b, buf, n, ply, 0);
    for (i = 0; i < n; i++) {
      m = buf[i]; f = m >> 7; t = m & 127; cap = b[t];
      if ((cap & 7) === K) return MATE - ply;
      b[t] = b[f]; b[f] = 0;
      face = facing(b);
      if (bik && face) sc = this.draw(side);
      else { sc = -this.nega(b, 3 - side, depth - 1, -beta, -alpha, ply + 1, face, quiet); if (face) sc = Math.min(sc, this.draw(side)); }   // 빅장을 걸면 상대가 받아 비길 수 있다
      b[f] = b[t]; b[t] = cap;
      if (this.stop) return 0;
      if (sc > best) best = sc;
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) {
        if (!cap) { this.hist[m] += depth * depth; if (this.killer[ply * 2] !== m) { this.killer[ply * 2 + 1] = this.killer[ply * 2]; this.killer[ply * 2] = m; } }
        break;
      }
    }
    // 둘 수가 전부 궁이 잡히는 수인데 장군은 아니다 → 한수쉼으로 넘긴다
    if (best <= -(MATE - ply - 1) && !inCheck(b, side)) {
      if (bik) return this.draw(side);
      best = -this.nega(b, 3 - side, depth - 1, -beta, -alpha, ply + 1, false, quiet);
    }
    return best;
  };
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }

  // 상대의 한 수. st = { b:[90], turn, bik, moves:[둘 수 있는 수] }. 둘 수가 없으면 PASS
  function think(st, level) {
    var b = new Int8Array(st.b), side = st.turn, moves = st.moves.slice(), S_ = new Search(), i, f, t, cap, sc, face;
    if (!moves.length) return PASS;
    level = Math.max(0, Math.min(26, level | 0));
    var maxD = LV_DEPTH[level], noise = LV_NOISE[level], quiet = maxD >= 2, bestMove = moves[0];
    S_.root = side;
    function rootScore(m, depth, alpha, beta) {
      f = m >> 7; t = m & 127; cap = b[t];
      if ((cap & 7) === K) return MATE;
      b[t] = b[f]; b[f] = 0; face = facing(b);
      if (st.bik && face) sc = S_.draw(side);
      else { sc = -S_.nega(b, 3 - side, depth - 1, -beta, -alpha, 1, face, quiet); if (face) sc = Math.min(sc, S_.draw(side)); }
      b[f] = b[t]; b[t] = cap;
      return sc;
    }
    if (LV_TIME[level] === 0) {
      // 급: 정해진 깊이로 모든 수의 값을 구한 뒤, 눈대중 흔들림을 더해 고른다. 바로 이기는 수는 놓치지 않는다
      var best = -INF, pick = moves[0], v;
      for (i = 0; i < moves.length; i++) {
        v = rootScore(moves[i], maxD, -INF, INF);
        if (v >= MATE - 100) return moves[i];
        v += noise ? gauss() * noise : Math.random();
        if (v > best) { best = v; pick = moves[i]; }
      }
      return pick;
    }
    // 단: 시간 안에서 한 깊이씩 더 읽는다
    S_.deadline = Date.now() + LV_TIME[level];
    for (var depth = 1; depth <= maxD; depth++) {
      var alpha = -INF, cur = moves[0], scs = [];
      for (i = 0; i < moves.length; i++) {
        sc = rootScore(moves[i], depth, alpha, INF);
        if (S_.stop) break;
        scs.push(sc);
        if (sc > alpha) { alpha = sc; cur = moves[i]; }
      }
      if (S_.stop) { if (i > 0 && alpha > -INF) bestMove = cur; break; }   // 맨 앞(지난 깊이의 으뜸 수)은 다 읽었으니 더 나은 수만 받아들인다
      bestMove = cur;
      // 다음 깊이는 이번에 좋았던 순서로
      var idx = moves.map(function (_, k) { return k; }); idx.sort(function (p, q) { return scs[q] - scs[p]; });
      moves = idx.map(function (k) { return moves[k]; });
      if (alpha >= MATE - 50 || alpha <= -(MATE - 50)) break;
    }
    return bestMove;
  }

  return {
    N: N, CHO: CHO, HAN: HAN, K: K, C: C, P: P, M: M, S: S, A: A, J: J, PTS: PTS, PASS: PASS, MAXPLY: MAXPLY, FORM: FORM,
    Game: Game, gen: gen, inCheck: inCheck, facing: facing, points: points, setup: setup, think: think, evalPos: evalPos,
    inPal: inPal, diagPt: diagPt, LEVELS: LV_DEPTH.length
  };
}
if (typeof window !== 'undefined') window.JanggiEngine = JanggiEngine;
