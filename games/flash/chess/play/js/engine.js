/* 체스 — 규칙과 상대(AI). 모듈 없음(file:// 로 열어도 돈다).
   ChessEngine() 은 바깥 변수를 하나도 쓰지 않는다 — 함수 글자를 그대로 떠서 일꾼(Worker)에서도 돌린다.
   판: 0x88 방식. 칸 = rank*16 + file (rank 0 = 1랭크, file 0 = a). 백이 아래(1랭크), 흑이 위(8랭크).
   수 = from | to<<7 | 승격기물<<14 | 표시<<17 (1 앙파상, 2 캐슬링, 4 두 칸 전진). 규칙 검증은 test 폴더의 python-chess 대조. */
function ChessEngine() {
  'use strict';
  var WHITE = 1, BLACK = 2, P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  var F_EP = 1 << 17, F_CASTLE = 2 << 17, F_DOUBLE = 4 << 17;
  var KN = [-33, -31, -18, -14, 14, 18, 31, 33], KG = [-17, -16, -15, -1, 1, 15, 16, 17], BD = [-17, -15, 15, 17], RD = [-16, -1, 1, 16];
  var VAL = [0, 100, 320, 330, 500, 900, 0];
  var FILES = 'abcdefgh', SLASH = String.fromCharCode(47);
  function on(s) { return (s & 0x88) === 0; }
  function mk(from, to, promo, fl) { return from | (to << 7) | ((promo || 0) << 14) | (fl || 0); }
  function mFrom(m) { return m & 127; } function mTo(m) { return (m >> 7) & 127; } function mPromo(m) { return (m >> 14) & 7; }
  function sqName(s) { return FILES[s & 7] + (((s >> 4) & 7) + 1); }
  function uci(m) { var s = sqName(mFrom(m)) + sqName(mTo(m)), p = mPromo(m); return p ? s + '  nbrq'[p] : s; }

  // 조브리스트 열쇠(32비트 둘) — 결정적 난수
  var seed = 0x9e3779b9;
  function rnd() { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed | 0; }
  var ZP = [], ZC = [], ZE = [], ZT, ZPh = [], ZCh = [], ZEh = [], ZTh, i, j;
  for (i = 0; i < 24; i++) { ZP.push(new Int32Array(128)); ZPh.push(new Int32Array(128)); for (j = 0; j < 128; j++) { ZP[i][j] = rnd(); ZPh[i][j] = rnd(); } }
  for (i = 0; i < 16; i++) { ZC.push(rnd()); ZCh.push(rnd()); }
  for (i = 0; i < 8; i++) { ZE.push(rnd()); ZEh.push(rnd()); }
  ZT = rnd(); ZTh = rnd();

  // ── 자리(State) ──
  function State() { this.b = new Int8Array(128); this.turn = WHITE; this.cr = 15; this.ep = -1; this.half = 0; this.ply = 0; this.ks = [0, 4, 116]; this.lo = 0; this.hi = 0; }
  State.prototype.copy = function () { var s = new State(); s.b.set(this.b); s.turn = this.turn; s.cr = this.cr; s.ep = this.ep; s.half = this.half; s.ply = this.ply; s.ks = this.ks.slice(); s.lo = this.lo; s.hi = this.hi; return s; };
  State.prototype.rehash = function () {
    var lo = 0, hi = 0, s, p;
    for (s = 0; s < 128; s++) { if (s & 0x88) continue; p = this.b[s]; if (p) { lo ^= ZP[p][s]; hi ^= ZPh[p][s]; } }
    lo ^= ZC[this.cr]; hi ^= ZCh[this.cr];
    if (this.ep >= 0) { lo ^= ZE[this.ep & 7]; hi ^= ZEh[this.ep & 7]; }
    if (this.turn === BLACK) { lo ^= ZT; hi ^= ZTh; }
    this.lo = lo; this.hi = hi;
  };
  var START = ['rnbqkbnr', 'pppppppp', '8', '8', '8', '8', 'PPPPPPPP', 'RNBQKBNR'].join(SLASH) + ' w KQkq - 0 1';
  var PCH = { p: P, n: N, b: B, r: R, q: Q, k: K };
  State.prototype.setFen = function (fen) {
    var parts = fen.trim().split(/\s+/), rows = parts[0].split(SLASH), r, f, c, i, s;
    this.b.fill(0);
    for (r = 0; r < 8; r++) {
      f = 0;
      for (i = 0; i < rows[r].length; i++) {
        c = rows[r][i];
        if (c >= '1' && c <= '8') f += +c;
        else { s = (7 - r) * 16 + f; this.b[s] = (c === c.toUpperCase() ? WHITE : BLACK) * 8 + PCH[c.toLowerCase()]; if (c === 'K') this.ks[WHITE] = s; if (c === 'k') this.ks[BLACK] = s; f++; }
      }
    }
    this.turn = parts[1] === 'b' ? BLACK : WHITE;
    this.cr = 0; if (parts[2] && parts[2] !== '-') { if (parts[2].indexOf('K') >= 0) this.cr |= 1; if (parts[2].indexOf('Q') >= 0) this.cr |= 2; if (parts[2].indexOf('k') >= 0) this.cr |= 4; if (parts[2].indexOf('q') >= 0) this.cr |= 8; }
    this.ep = parts[3] && parts[3] !== '-' ? (parts[3].charCodeAt(1) - 49) * 16 + (parts[3].charCodeAt(0) - 97) : -1;
    this.half = parts[4] ? +parts[4] : 0; this.ply = parts[5] ? (+parts[5] - 1) * 2 + (this.turn === BLACK ? 1 : 0) : 0;
    this.rehash(); return this;
  };
  State.prototype.fen = function () {
    var out = '', r, f, e, p, t, ch, cs;
    for (r = 7; r >= 0; r--) {
      e = 0;
      for (f = 0; f < 8; f++) { p = this.b[r * 16 + f]; if (!p) { e++; continue; } if (e) { out += e; e = 0; } t = p & 7; ch = ' pnbrqk'[t]; out += (p >> 3) === WHITE ? ch.toUpperCase() : ch; }
      if (e) out += e; if (r) out += SLASH;
    }
    cs = (this.cr & 1 ? 'K' : '') + (this.cr & 2 ? 'Q' : '') + (this.cr & 4 ? 'k' : '') + (this.cr & 8 ? 'q' : '');
    return out + ' ' + (this.turn === WHITE ? 'w' : 'b') + ' ' + (cs || '-') + ' ' + (this.ep >= 0 ? sqName(this.ep) : '-') + ' ' + this.half + ' ' + (((this.ply / 2) | 0) + 1);
  };

  // sq 가 by 편에게 공격받는가
  function attacked(st, s, by) {
    var b = st.b, i, t, p, d;
    if (by === WHITE) { if (on(s - 15) && b[s - 15] === WHITE * 8 + P) return true; if (on(s - 17) && b[s - 17] === WHITE * 8 + P) return true; }
    else { if (on(s + 15) && b[s + 15] === BLACK * 8 + P) return true; if (on(s + 17) && b[s + 17] === BLACK * 8 + P) return true; }
    for (i = 0; i < 8; i++) { t = s + KN[i]; if (on(t) && b[t] === by * 8 + N) return true; t = s + KG[i]; if (on(t) && b[t] === by * 8 + K) return true; }
    for (i = 0; i < 4; i++) {
      d = BD[i]; t = s + d; while (on(t)) { p = b[t]; if (p) { if ((p >> 3) === by && ((p & 7) === B || (p & 7) === Q)) return true; break; } t += d; }
      d = RD[i]; t = s + d; while (on(t)) { p = b[t]; if (p) { if ((p >> 3) === by && ((p & 7) === R || (p & 7) === Q)) return true; break; } t += d; }
    }
    return false;
  }
  function inCheck(st, side) { return attacked(st, st.ks[side], 3 - side); }

  // 수 만들기(자기 왕 노출은 안 본다). out 에 채우고 개수를 돌려준다
  function gen(st, out) {
    var b = st.b, side = st.turn, opp = 3 - side, n = 0, s, p, t, i, d, q, fwd = side === WHITE ? 16 : -16, startR = side === WHITE ? 1 : 6, promoR = side === WHITE ? 7 : 0;
    function pawnTo(from, to, fl) {
      if (((to >> 4) & 7) === promoR) { out[n++] = mk(from, to, Q, fl); out[n++] = mk(from, to, N, fl); out[n++] = mk(from, to, R, fl); out[n++] = mk(from, to, B, fl); }
      else out[n++] = mk(from, to, 0, fl);
    }
    for (s = 0; s < 128; s++) {
      if (s & 0x88) { s += 7; continue; }
      p = b[s]; if (!p || (p >> 3) !== side) continue;
      t = p & 7;
      if (t === P) {
        q = s + fwd;
        if (!b[q]) { pawnTo(s, q, 0); if (((s >> 4) & 7) === startR && !b[q + fwd]) out[n++] = mk(s, q + fwd, 0, F_DOUBLE); }
        q = s + fwd - 1; if (on(q)) { if (b[q] && (b[q] >> 3) === opp) pawnTo(s, q, 0); else if (q === st.ep) out[n++] = mk(s, q, 0, F_EP); }
        q = s + fwd + 1; if (on(q)) { if (b[q] && (b[q] >> 3) === opp) pawnTo(s, q, 0); else if (q === st.ep) out[n++] = mk(s, q, 0, F_EP); }
      } else if (t === N) {
        for (i = 0; i < 8; i++) { q = s + KN[i]; if (on(q) && (!b[q] || (b[q] >> 3) === opp)) out[n++] = mk(s, q); }
      } else if (t === K) {
        for (i = 0; i < 8; i++) { q = s + KG[i]; if (on(q) && (!b[q] || (b[q] >> 3) === opp)) out[n++] = mk(s, q); }
        if (side === WHITE) {
          if ((st.cr & 1) && !b[5] && !b[6] && b[7] === WHITE * 8 + R && !attacked(st, 4, BLACK) && !attacked(st, 5, BLACK) && !attacked(st, 6, BLACK)) out[n++] = mk(4, 6, 0, F_CASTLE);
          if ((st.cr & 2) && !b[3] && !b[2] && !b[1] && b[0] === WHITE * 8 + R && !attacked(st, 4, BLACK) && !attacked(st, 3, BLACK) && !attacked(st, 2, BLACK)) out[n++] = mk(4, 2, 0, F_CASTLE);
        } else {
          if ((st.cr & 4) && !b[117] && !b[118] && b[119] === BLACK * 8 + R && !attacked(st, 116, WHITE) && !attacked(st, 117, WHITE) && !attacked(st, 118, WHITE)) out[n++] = mk(116, 118, 0, F_CASTLE);
          if ((st.cr & 8) && !b[115] && !b[114] && !b[113] && b[112] === BLACK * 8 + R && !attacked(st, 116, WHITE) && !attacked(st, 115, WHITE) && !attacked(st, 114, WHITE)) out[n++] = mk(116, 114, 0, F_CASTLE);
        }
      } else {
        for (i = 0; i < 4; i++) {
          if (t !== R) { d = BD[i]; q = s + d; while (on(q)) { if (b[q]) { if ((b[q] >> 3) === opp) out[n++] = mk(s, q); break; } out[n++] = mk(s, q); q += d; } }
          if (t !== B) { d = RD[i]; q = s + d; while (on(q)) { if (b[q]) { if ((b[q] >> 3) === opp) out[n++] = mk(s, q); break; } out[n++] = mk(s, q); q += d; } }
        }
      }
    }
    return n;
  }

  // 두기 / 되돌리기. u 는 되돌릴 때 쓸 기록
  var CR_MASK = new Int8Array(128); CR_MASK.fill(15); CR_MASK[0] = 13; CR_MASK[7] = 14; CR_MASK[4] = 12; CR_MASK[112] = 7; CR_MASK[119] = 11; CR_MASK[116] = 3;
  function make(st, m) {
    var b = st.b, from = mFrom(m), to = mTo(m), promo = mPromo(m), p = b[from], side = p >> 3, cap = b[to], capSq = to;
    var u = { cap: 0, capSq: to, cr: st.cr, ep: st.ep, half: st.half, lo: st.lo, hi: st.hi };
    if (m & F_EP) { capSq = to + (side === WHITE ? -16 : 16); cap = b[capSq]; }
    u.cap = cap; u.capSq = capSq;
    // 열쇠: 움직인 알, 잡힌 알, 캐슬링 권리, 앙파상 칸, 차례
    st.lo ^= ZP[p][from]; st.hi ^= ZPh[p][from];
    if (cap) { st.lo ^= ZP[cap][capSq]; st.hi ^= ZPh[cap][capSq]; b[capSq] = 0; }
    var np = promo ? side * 8 + promo : p;
    b[to] = np; b[from] = 0; st.lo ^= ZP[np][to]; st.hi ^= ZPh[np][to];
    if (m & F_CASTLE) {
      var rf = to > from ? to + 1 : to - 2, rt = to > from ? to - 1 : to + 1, rk = b[rf];
      b[rt] = rk; b[rf] = 0; st.lo ^= ZP[rk][rf] ^ ZP[rk][rt]; st.hi ^= ZPh[rk][rf] ^ ZPh[rk][rt];
    }
    if ((p & 7) === K) st.ks[side] = to;
    st.lo ^= ZC[st.cr]; st.hi ^= ZCh[st.cr];
    st.cr &= CR_MASK[from] & CR_MASK[to];
    st.lo ^= ZC[st.cr]; st.hi ^= ZCh[st.cr];
    if (st.ep >= 0) { st.lo ^= ZE[st.ep & 7]; st.hi ^= ZEh[st.ep & 7]; }
    st.ep = (m & F_DOUBLE) ? (from + to) >> 1 : -1;
    if (st.ep >= 0) { st.lo ^= ZE[st.ep & 7]; st.hi ^= ZEh[st.ep & 7]; }
    st.half = ((p & 7) === P || cap) ? 0 : st.half + 1;
    st.turn = 3 - side; st.lo ^= ZT; st.hi ^= ZTh; st.ply++;
    return u;
  }
  function unmake(st, m, u) {
    var b = st.b, from = mFrom(m), to = mTo(m), promo = mPromo(m), side = 3 - st.turn, p = b[to];
    if (promo) p = side * 8 + P;
    b[from] = p; b[to] = 0;
    if (u.cap) b[u.capSq] = u.cap;
    if (m & F_CASTLE) { var rf = to > from ? to + 1 : to - 2, rt = to > from ? to - 1 : to + 1; b[rf] = b[rt]; b[rt] = 0; }
    if ((p & 7) === K) st.ks[side] = from;
    st.cr = u.cr; st.ep = u.ep; st.half = u.half; st.lo = u.lo; st.hi = u.hi; st.turn = side; st.ply--;
  }
  // 둘 수 있는 수(왕이 잡히는 수는 뺀다)
  function legal(st) {
    var buf = new Int32Array(256), n = gen(st, buf), out = [], i, m, u, side = st.turn;
    for (i = 0; i < n; i++) { m = buf[i]; u = make(st, m); if (!inCheck(st, side)) out.push(m); unmake(st, m, u); }
    return out;
  }
  function perft(st, d) { if (d === 0) return 1; var ms = legal(st), c = 0, i, u; for (i = 0; i < ms.length; i++) { u = make(st, ms[i]); c += perft(st, d - 1); unmake(st, ms[i], u); } return c; }

  // ── 한 판 ──
  function Game() { this.st = new State(); this.reset(); }
  Game.prototype.reset = function (fen) {
    this.st.setFen(fen || START); this.result = null; this.last = -1; this.hist = []; this.seen = {};
    this.seen[this.key()] = 1;
  };
  // 같은 모양 판정 열쇠: 앙파상 칸은 실제로 잡을 수 있을 때만 센다(FIDE·python-chess 와 같게)
  Game.prototype.key = function () {
    var st = this.st, lo = st.lo, hi = st.hi;
    if (st.ep >= 0) {
      var ms = legal(st), i, has = false;
      for (i = 0; i < ms.length; i++) if (ms[i] & F_EP) { has = true; break; }
      if (!has) { lo ^= ZE[st.ep & 7]; hi ^= ZEh[st.ep & 7]; }
    }
    return lo + ':' + hi;
  };
  Game.prototype.legal = function () { return this.result ? [] : legal(this.st); };
  Game.prototype.inCheck = function () { return inCheck(this.st, this.st.turn); };
  Game.prototype.fen = function () { return this.st.fen(); };
  // 둘 다 외통을 만들 수 없는 알만 남았나: K vs K, K+마/비숍 vs K, K+비숍 vs K+비숍(같은 색 칸)
  Game.prototype.insufficient = function () {
    var b = this.st.b, s, p, t, minor = [0, 0, 0], bishopsColor = -1, same = true;
    for (s = 0; s < 128; s++) {
      if (s & 0x88) { s += 7; continue; }
      p = b[s]; if (!p) continue; t = p & 7;
      if (t === P || t === R || t === Q) return false;
      if (t === N || t === B) { minor[p >> 3]++; if (t === B) { var c = ((s & 7) + (s >> 4)) & 1; if (bishopsColor < 0) bishopsColor = c; else if (bishopsColor !== c) same = false; } else same = false; }
    }
    var tot = minor[1] + minor[2];
    if (tot <= 1) return true;
    if (same && bishopsColor >= 0) return true;   // 비숍끼리 같은 색
    return false;
  };
  // 수를 둔다. 돌려주는 것: { move, cap, check, castle, ep, promo, end }
  Game.prototype.play = function (m) {
    var st = this.st, side = st.turn, ev = { move: m, cap: 0, check: false, castle: !!(m & F_CASTLE), ep: !!(m & F_EP), promo: mPromo(m), end: null }, u, k;
    if (this.result) return ev;
    u = make(st, m); ev.cap = u.cap; ev.capSq = u.capSq; this.hist.push({ m: m, u: u }); this.last = m;
    k = this.key(); this.seen[k] = (this.seen[k] || 0) + 1;
    ev.check = inCheck(st, st.turn);
    var moves = legal(st);
    if (!moves.length) this.result = ev.end = ev.check ? { winner: side, why: 'mate' } : { winner: 0, why: 'stalemate' };
    else if (this.seen[k] >= 3) this.result = ev.end = { winner: 0, why: 'repetition' };
    else if (st.half >= 100) this.result = ev.end = { winner: 0, why: 'fifty' };
    else if (this.insufficient()) this.result = ev.end = { winner: 0, why: 'material' };
    return ev;
  };
  Game.prototype.resign = function (side) { this.result = { winner: 3 - side, why: 'resign' }; return this.result; };
  Game.prototype.material = function (side) { var b = this.st.b, s, v = 0; for (s = 0; s < 128; s++) { if (s & 0x88) { s += 7; continue; } if (b[s] && (b[s] >> 3) === side) v += VAL[b[s] & 7]; } return v; };

  // ════════ 상대(AI): 알파베타 + 조용한 수 읽기(quiescence) + 치환표 ════════
  var MATE = 100000, INF = 1000000;
  // 자리 값(백 기준, 위 줄이 8랭크). 흑은 위아래를 뒤집어 읽는다
  var T = {};
  T[P] = [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0];
  T[N] = [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50];
  T[B] = [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20];
  T[R] = [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0];
  T[Q] = [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20];
  T[K] = [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20];
  var KEND = [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];
  // 0x88 칸 → 표 번호(백: 위 줄이 8랭크이므로 7-rank, 흑: rank 그대로)
  var PSTW = [], PSTB = [], KENDW = new Int16Array(128), KENDB = new Int16Array(128);
  (function () {
    var t, s, f, r;
    for (t = 0; t <= K; t++) { PSTW.push(new Int16Array(128)); PSTB.push(new Int16Array(128)); }
    for (s = 0; s < 128; s++) {
      if (s & 0x88) continue; f = s & 7; r = s >> 4;
      for (t = P; t <= K; t++) { PSTW[t][s] = T[t][(7 - r) * 8 + f]; PSTB[t][s] = T[t][r * 8 + f]; }
      KENDW[s] = KEND[(7 - r) * 8 + f]; KENDB[s] = KEND[r * 8 + f];
    }
  })();
  function evalPos(st) {
    var b = st.b, s, p, t, c, sc = 0, npm = 0, bish = [0, 0, 0], wk = 0, bk = 0;
    for (s = 0; s < 128; s++) {
      if (s & 0x88) { s += 7; continue; }
      p = b[s]; if (!p) continue; t = p & 7; c = p >> 3;
      if (t !== P && t !== K) npm += VAL[t];
      if (t === B) bish[c]++;
      if (t === K) { if (c === WHITE) wk = s; else bk = s; continue; }
      if (c === WHITE) sc += VAL[t] + PSTW[t][s]; else sc -= VAL[t] + PSTB[t][s];
    }
    var endgame = npm <= 2600;
    sc += endgame ? KENDW[wk] : PSTW[K][wk];
    sc -= endgame ? KENDB[bk] : PSTB[K][bk];
    if (bish[WHITE] >= 2) sc += 30; if (bish[BLACK] >= 2) sc -= 30;
    sc += st.turn === WHITE ? 10 : -10;
    return st.turn === WHITE ? sc : -sc;
  }

  // 치환표
  var TT_BITS = 18, TT_N = 1 << TT_BITS, TT_MASK = TT_N - 1;
  var ttLo = new Int32Array(TT_N), ttHi = new Int32Array(TT_N), ttMv = new Int32Array(TT_N), ttSc = new Int32Array(TT_N), ttDp = new Int8Array(TT_N), ttFl = new Int8Array(TT_N);
  var EXACT = 1, LOWER = 2, UPPER = 3;

  function Search() {
    this.bufs = []; for (var i = 0; i < 80; i++) this.bufs.push(new Int32Array(256));
    this.hist = new Int32Array(128 * 128); this.killer = new Int32Array(80 * 2);
    this.nodes = 0; this.stop = false; this.deadline = 0; this.quiet = true;
  }
  Search.prototype.order = function (b, buf, n, ply, first) {
    var sc = this._sc || (this._sc = new Int32Array(256)), i, j, m, cap, v, tm, pr;
    for (i = 0; i < n; i++) {
      m = buf[i]; cap = b[mTo(m)]; pr = mPromo(m);
      if (m === first) v = 1 << 30;
      else if (cap || (m & F_EP)) v = (1 << 24) + (cap ? VAL[cap & 7] : 100) * 16 - VAL[b[mFrom(m)] & 7] + (pr ? 800 : 0);
      else if (pr) v = (1 << 23) + VAL[pr];
      else if (m === this.killer[ply * 2] || m === this.killer[ply * 2 + 1]) v = 1 << 20;
      else v = this.hist[(mFrom(m) << 7) | mTo(m)];
      sc[i] = v;
    }
    for (i = 1; i < n; i++) { v = sc[i]; tm = buf[i]; for (j = i - 1; j >= 0 && sc[j] < v; j--) { sc[j + 1] = sc[j]; buf[j + 1] = buf[j]; } sc[j + 1] = v; buf[j + 1] = tm; }
  };
  Search.prototype.quiesce = function (st, alpha, beta, ply) {
    var stand = evalPos(st); this.nodes++;
    if (stand >= beta) return stand; if (stand > alpha) alpha = stand;
    if (ply >= 78) return stand;
    var b = st.b, buf = this.bufs[ply], n = gen(st, buf), i, m, k = 0, sc, u, side = st.turn;
    for (i = 0; i < n; i++) if (b[mTo(buf[i])] || (buf[i] & F_EP) || mPromo(buf[i]) === Q) buf[k++] = buf[i];
    this.order(b, buf, k, ply, 0);
    for (i = 0; i < k; i++) {
      m = buf[i]; u = make(st, m);
      if (inCheck(st, side)) { unmake(st, m, u); continue; }
      sc = -this.quiesce(st, -beta, -alpha, ply + 1);
      unmake(st, m, u);
      if (sc >= beta) return sc; if (sc > alpha) alpha = sc;
    }
    return alpha;
  };
  Search.prototype.nega = function (st, depth, alpha, beta, ply) {
    if ((++this.nodes & 2047) === 0 && this.deadline && Date.now() > this.deadline) this.stop = true;
    if (this.stop) return 0;
    if (st.half >= 100) return 0;
    var incheck = inCheck(st, st.turn);
    if (incheck && ply < 60) depth++;
    if (depth <= 0) return this.quiet ? this.quiesce(st, alpha, beta, ply) : evalPos(st);
    var idx = st.lo & TT_MASK, first = 0, sc, fl;
    if (ttLo[idx] === st.lo && ttHi[idx] === st.hi) {
      first = ttMv[idx];
      if (ttDp[idx] >= depth && ply > 0) { sc = ttSc[idx]; fl = ttFl[idx]; if (fl === EXACT) return sc; if (fl === LOWER && sc >= beta) return sc; if (fl === UPPER && sc <= alpha) return sc; }
    }
    var b = st.b, buf = this.bufs[ply], n = gen(st, buf), i, m, u, best = -INF, bestM = 0, cnt = 0, a0 = alpha, side = st.turn;
    this.order(b, buf, n, ply, first);
    for (i = 0; i < n; i++) {
      m = buf[i]; u = make(st, m);
      if (inCheck(st, side)) { unmake(st, m, u); continue; }
      cnt++;
      sc = -this.nega(st, depth - 1, -beta, -alpha, ply + 1);
      unmake(st, m, u);
      if (this.stop) return 0;
      if (sc > best) { best = sc; bestM = m; }
      if (sc > alpha) {
        alpha = sc;
        if (alpha >= beta) {
          if (!b[mTo(m)]) { this.hist[(mFrom(m) << 7) | mTo(m)] += depth * depth; if (this.killer[ply * 2] !== m) { this.killer[ply * 2 + 1] = this.killer[ply * 2]; this.killer[ply * 2] = m; } }
          break;
        }
      }
    }
    if (!cnt) return incheck ? -MATE + ply : 0;
    ttLo[idx] = st.lo; ttHi[idx] = st.hi; ttMv[idx] = bestM; ttSc[idx] = best; ttDp[idx] = depth; ttFl[idx] = best <= a0 ? UPPER : best >= beta ? LOWER : EXACT;
    return best;
  };
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }

  // 난이도: 0~17 = 18급~1급, 18~26 = 1단~9단. 급이 낮을수록 얕게 읽고 가끔 못 본다(눈대중 흔들림, 폰 하나 = 100)
  var LV_DEPTH = [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 30];
  var LV_NOISE = [160, 120, 90, 170, 140, 110, 80, 55, 30, 150, 120, 95, 75, 55, 40, 28, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var LV_TIME = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 700, 900, 1000, 1200, 1500, 1800, 2000, 2500, 3000];

  // 상대의 한 수. fen 과 둘 수 있는 수 목록을 받는다
  function think(fen, moves, level) {
    var st = new State().setFen(fen), S_ = new Search(), i, u, sc;
    moves = moves.slice(); if (!moves.length) return 0;
    level = Math.max(0, Math.min(26, level | 0));
    var maxD = LV_DEPTH[level], noise = LV_NOISE[level]; S_.quiet = maxD >= 2;
    function rootScore(m, depth, alpha, beta) { u = make(st, m); sc = -S_.nega(st, depth - 1, -beta, -alpha, 1); unmake(st, m, u); return sc; }
    if (LV_TIME[level] === 0) {
      var best = -INF, pick = moves[0], v;
      for (i = 0; i < moves.length; i++) {
        v = rootScore(moves[i], maxD, -INF, INF);
        if (v >= MATE - 100) return moves[i];
        v += noise ? gauss() * noise : Math.random();
        if (v > best) { best = v; pick = moves[i]; }
      }
      return pick;
    }
    S_.deadline = Date.now() + LV_TIME[level];
    var bestMove = moves[0];
    for (var depth = 1; depth <= maxD; depth++) {
      var alpha = -INF, cur = moves[0], scs = [];
      for (i = 0; i < moves.length; i++) {
        sc = rootScore(moves[i], depth, alpha, INF);
        if (S_.stop) break;
        scs.push(sc);
        if (sc > alpha) { alpha = sc; cur = moves[i]; }
      }
      if (S_.stop) { if (i > 0 && alpha > -INF) bestMove = cur; break; }
      bestMove = cur;
      var idx = moves.map(function (_, k) { return k; }); idx.sort(function (p, q) { return scs[q] - scs[p]; });
      moves = idx.map(function (k) { return moves[k]; });
      if (alpha >= MATE - 100 || alpha <= -(MATE - 100)) break;
    }
    return bestMove;
  }

  return {
    WHITE: WHITE, BLACK: BLACK, P: P, N: N, B: B, R: R, Q: Q, K: K, VAL: VAL, F_EP: F_EP, F_CASTLE: F_CASTLE, F_DOUBLE: F_DOUBLE, START: START,
    State: State, Game: Game, gen: gen, legal: legal, make: make, unmake: unmake, attacked: attacked, inCheck: inCheck, perft: perft,
    uci: uci, mFrom: mFrom, mTo: mTo, mPromo: mPromo, sqName: sqName, think: think, evalPos: evalPos, LEVELS: LV_DEPTH.length
  };
}
if (typeof window !== 'undefined') window.ChessEngine = ChessEngine;
