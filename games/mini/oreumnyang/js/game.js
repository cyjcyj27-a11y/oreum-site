/* =========================================================
   오름냥 - 퍼즐판 본체
   ---------------------------------------------------------
   보드 관리 / 매칭 / 특수 고양이 / 중력 / 애니메이션 / 입력

   화면에 보이는 이름  =  코드에서 쓰는 이름
     오름  = jelly   고양이 밑에 깔린 층. 위에서 터뜨리면 한 겹씩 올라간다
     돌담  = crate   안 움직이는 덩어리. 바로 옆에서 터뜨리면 무너진다
     당근  = chain   고양이가 파묻혀 못 움직인다. 옆에서 터뜨리면 풀린다
     감귤  = drop    맨 아래까지 내려보내면 수확
   (규칙을 고칠 때는 오른쪽 영어 이름으로 찾으세요)
   ========================================================= */
(function (global) {
  'use strict';

  var CLEAR_MS = 240;      // 터지는 연출 시간
  var SWAP_MS  = 150;      // 자리 바꾸는 시간
  var GRAV     = 42;       // 낙하 가속 (칸/초^2)
  var LERP     = 22;       // 부드럽게 붙는 속도
  var HINT_MS  = 6000;     // 가만히 있으면 힌트

  var SCORE_CAT   = 60;
  var SCORE_MAKE  = 200;   // 특수 고양이 탄생
  var SCORE_BLAST = 150;   // 특수 고양이 발동

  /* 연쇄가 이어질 때 소리를 점점 높이는데, 아무 비율로 올리면 음이 어긋나
     "따로 노는" 느낌이 난다. 쓰는 음은 D E F# A B 다섯 개뿐(D 펜타토닉).

     같은 다섯 음이라도 어느 음에서 출발하느냐에 따라 계단 간격이 다르다.
       D 에서 출발: 0 2 4 7 9 ...  (팡·연쇄)
       B 에서 출발: 0 3 5 7 10 ... (목표 달성음)  */
  var STEPS_FROM_D = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  var STEPS_FROM_B = [0, 3, 5, 7, 10, 12, 15, 17, 19];
  function stepRate(steps, i) {
    var k = Math.max(0, Math.min(i, steps.length - 1));
    return Math.pow(2, steps[k] / 12);
  }

  var uid = 0;

  function key(r, c) { return r + ',' + c; }

  /* ================= 게임 객체 ================= */
  function Game(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.cfg = null;
    this.phase = 'idle';
    this.fx = [];
    this.parts = [];
    this.on = {};            // onHud, onEnd, onToast
    this.hint = null;
    this.idleT = 0;
    this._bind();
  }

  Game.prototype._rng = function () {
    var a = this.seed;
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    this.seed = a;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  /* ---------------- 판 시작 ---------------- */
  Game.prototype.start = function (cfg) {
    this.cfg = cfg;
    this.W = cfg.W; this.H = cfg.H;
    this.seed = cfg.seed;
    this.colors = cfg.colors;

    this.movesLeft = cfg.moves;
    this.score = 0;
    this.cascade = 1;
    this.shufflesLeft = cfg.shuffles;
    this.ended = false;
    this.phase = 'idle';
    this.fx = []; this.parts = [];
    this.sel = null; this.hint = null; this.idleT = 0;
    this.swapPair = null;
    this.timer = 0;

    // 목표 진행판
    this.collected = {};
    this.dropsDone = 0;
    this.dropsSpawned = 0;
    this.dropsTotal = cfg.drops || 0;

    // 격자 준비
    var r, c;
    this.wall = []; this.jelly = []; this.chain = []; this.cells = [];
    for (r = 0; r < this.H; r++) {
      this.wall[r] = []; this.jelly[r] = []; this.chain[r] = []; this.cells[r] = [];
      for (c = 0; c < this.W; c++) {
        this.wall[r][c] = r < cfg.cut[c];
        this.jelly[r][c] = 0;
        this.chain[r][c] = 0;
        this.cells[r][c] = null;
      }
    }
    for (var k in cfg.jelly) {
      var pr = k.split(','), jr = +pr[0], jc = +pr[1];
      if (this._in(jr, jc) && !this.wall[jr][jc]) this.jelly[jr][jc] = cfg.jelly[k];
    }
    this.jellyLeft = this._countJelly();

    // 고양이 채우기 (처음엔 저절로 터지지 않게)
    for (c = 0; c < this.W; c++) {
      for (r = 0; r < this.H; r++) {
        if (this.wall[r][c]) continue;
        this.cells[r][c] = this._newCat(this._safeColor(r, c), r, c);
      }
    }
    // 돌담 / 당근
    cfg.crates.forEach(function (q) {
      if (this._in(q.r, q.c) && !this.wall[q.r][q.c]) {
        this.cells[q.r][q.c] = { id: ++uid, kind: 'crate', hp: q.hp, px: q.c, py: q.r, tr: q.r, tc: q.c, scale: 1 };
      }
    }, this);
    cfg.chains.forEach(function (q) {
      if (this._in(q.r, q.c) && !this.wall[q.r][q.c] && this.cells[q.r][q.c].kind === 'cat') {
        this.chain[q.r][q.c] = 1;
      }
    }, this);

    // 감귤은 판이 시작될 때부터 판 위에 올려둔다.
    // (도중에 생기면 아래까지 내려올 시간이 모자라 억울해진다)
    this._placeStartingDrops();

    this._syncTargets(true);
    if (!this._hasMove()) this._shuffle(true);
    this.resize();
    this._hud();
  };

  /* 감귤을 맨 윗줄, 돌담이 적은 열부터 하나씩 놓는다 */
  Game.prototype._placeStartingDrops = function () {
    if (!this.dropsTotal) return;
    var self = this;
    var cols = [];
    for (var c = 0; c < this.W; c++) {
      var top = this.cfg.cut[c];
      if (top >= this.H) continue;
      var crates = 0;
      for (var r = top; r < this.H; r++) {
        var p = this.cells[r][c];
        if (p && p.kind === 'crate') crates++;
      }
      cols.push({ c: c, crates: crates, k: this._rng() });
    }
    cols.sort(function (a, b) { return (a.crates - b.crates) || (a.k - b.k); });
    var clean = cols.filter(function (q) { return q.crates === 0; });
    if (clean.length >= this.dropsTotal) cols = clean;
    var n = Math.min(this.dropsTotal, cols.length);
    for (var i = 0; i < n; i++) {
      var cc = cols[i].c, top = this.cfg.cut[cc];
      // 맨 위가 아니라 판 중간쯤에 놓는다.
      // 꼭대기에서 시작하면 아홉 줄을 내려와야 해서 시간이 턱없이 모자란다.
      var rr = top + Math.floor((this.H - top) * 0.5);
      while (rr > top && this.cells[rr][cc] && this.cells[rr][cc].kind === 'crate') rr--;
      if (this.cells[rr][cc] && this.cells[rr][cc].kind === 'crate') continue;
      this.cells[rr][cc] = this._newDrop(rr, cc);
      this.chain[rr][cc] = 0;
      this.dropsSpawned++;
    }
  };

  Game.prototype._in = function (r, c) {
    return r >= 0 && r < this.H && c >= 0 && c < this.W;
  };

  Game.prototype._newCat = function (color, r, c, fromAbove) {
    return {
      id: ++uid, kind: 'cat', color: color, special: null,
      px: c, py: fromAbove == null ? r : fromAbove,
      tr: r, tc: c, vy: 0, fall: fromAbove != null, scale: 1, dieT: 0
    };
  };

  Game.prototype._newDrop = function (r, c, fromAbove) {
    return {
      id: ++uid, kind: 'drop',
      px: c, py: fromAbove == null ? r : fromAbove,
      tr: r, tc: c, vy: 0, fall: true, scale: 1, dieT: 0
    };
  };

  /* 왼쪽/위쪽과 3줄이 되지 않는 색 고르기 */
  Game.prototype._safeColor = function (r, c) {
    var bad = {};
    var a = this.cells[r] && this.cells[r][c - 1], b = this.cells[r] && this.cells[r][c - 2];
    if (a && b && a.kind === 'cat' && b.kind === 'cat' && a.color === b.color) bad[a.color] = 1;
    var d = this.cells[r - 1] && this.cells[r - 1][c], e = this.cells[r - 2] && this.cells[r - 2][c];
    if (d && e && d.kind === 'cat' && e.kind === 'cat' && d.color === e.color) bad[d.color] = 1;
    var opts = [];
    for (var i = 0; i < this.colors; i++) if (!bad[i]) opts.push(i);
    if (!opts.length) opts = [0];
    return opts[Math.floor(this._rng() * opts.length)];
  };

  Game.prototype._countJelly = function () {
    var t = 0;
    for (var r = 0; r < this.H; r++) for (var c = 0; c < this.W; c++) t += this.jelly[r][c];
    return t;
  };

  /* ---------------- 목표 ---------------- */
  Game.prototype.goalProgress = function () {
    var self = this;
    return this.cfg.goals.map(function (g) {
      var cur = 0;
      if (g.type === 'score') cur = self.score;
      else if (g.type === 'collect') cur = self.collected[g.color] || 0;
      else if (g.type === 'jelly') cur = g.count - self.jellyLeft;
      else if (g.type === 'drop') cur = self.dropsDone;
      return { goal: g, cur: Math.min(cur, g.count), done: cur >= g.count };
    });
  };

  Game.prototype.allGoalsDone = function () {
    return this.goalProgress().every(function (p) { return p.done; });
  };

  Game.prototype.stars = function () {
    var s = this.cfg.star, n = 1;
    if (this.score >= s.s2) n = 2;
    if (this.score >= s.s3) n = 3;
    return n;
  };

  Game.prototype._hud = function () { if (this.on.onHud) this.on.onHud(this); };
  Game.prototype._toast = function (t) { if (this.on.onToast) this.on.onToast(t); };

  /* ================= 매칭 ================= */
  Game.prototype._matchable = function (p) {
    return !!p && p.kind === 'cat' && p.special !== 'rainbow';
  };

  Game.prototype._runs = function () {
    var runs = [], r, c, c2, p;
    for (r = 0; r < this.H; r++) {
      c = 0;
      while (c < this.W) {
        p = this.cells[r][c];
        if (this._matchable(p)) {
          c2 = c + 1;
          while (c2 < this.W) {
            var q = this.cells[r][c2];
            if (!this._matchable(q) || q.color !== p.color) break;
            c2++;
          }
          if (c2 - c >= 3) {
            var list = [];
            for (var i = c; i < c2; i++) list.push([r, i]);
            runs.push({ cells: list, dir: 'h', len: c2 - c, color: p.color });
          }
          c = c2;
        } else c++;
      }
    }
    for (c = 0; c < this.W; c++) {
      r = 0;
      while (r < this.H) {
        p = this.cells[r][c];
        if (this._matchable(p)) {
          var r2 = r + 1;
          while (r2 < this.H) {
            var q2 = this.cells[r2][c];
            if (!this._matchable(q2) || q2.color !== p.color) break;
            r2++;
          }
          if (r2 - r >= 3) {
            var list2 = [];
            for (var j = r; j < r2; j++) list2.push([j, c]);
            runs.push({ cells: list2, dir: 'v', len: r2 - r, color: p.color });
          }
          r = r2;
        } else r++;
      }
    }
    return runs;
  };

  /* 겹치는 줄들을 하나의 덩어리로 합침 */
  Game.prototype._groups = function () {
    var runs = this._runs();
    if (!runs.length) return [];
    var owner = {}, groups = [];
    runs.forEach(function (run) {
      var found = null;
      run.cells.forEach(function (rc) {
        var o = owner[key(rc[0], rc[1])];
        if (o != null && found == null) found = o;
      });
      var gi;
      if (found == null) {
        gi = groups.length;
        groups.push({ cells: {}, runs: [], color: run.color, maxLen: 0, hasH: false, hasV: false });
      } else gi = found;
      var G = groups[gi];
      G.runs.push(run);
      G.maxLen = Math.max(G.maxLen, run.len);
      if (run.dir === 'h') G.hasH = true; else G.hasV = true;
      run.cells.forEach(function (rc) { G.cells[key(rc[0], rc[1])] = rc; owner[key(rc[0], rc[1])] = gi; });
    });
    return groups.filter(function (G) { return Object.keys(G.cells).length >= 3; });
  };

  /* 덩어리에서 태어날 특수 고양이 종류 */
  Game.prototype._specialOf = function (G) {
    if (G.maxLen >= 5) return 'rainbow';
    if (G.hasH && G.hasV) return 'bomb';
    if (G.maxLen === 4) {
      var long = G.runs.filter(function (r) { return r.len === 4; })[0];
      return long && long.dir === 'h' ? 'row' : 'col';
    }
    return null;
  };

  /* 특수 고양이가 놓일 자리 */
  Game.prototype._specialSpot = function (G, prefer) {
    if (prefer) {
      for (var i = 0; i < prefer.length; i++) {
        var pk = key(prefer[i][0], prefer[i][1]);
        if (G.cells[pk]) return G.cells[pk];
      }
    }
    if (G.hasH && G.hasV) {
      var hs = {}, vs = {};
      G.runs.forEach(function (run) {
        run.cells.forEach(function (rc) { (run.dir === 'h' ? hs : vs)[key(rc[0], rc[1])] = rc; });
      });
      for (var k2 in hs) if (vs[k2]) return hs[k2];
    }
    var longest = G.runs.slice().sort(function (a, b) { return b.len - a.len; })[0];
    return longest.cells[Math.floor(longest.len / 2)];
  };

  /* ================= 폭발 ================= */
  Game.prototype._expand = function (p, r, c, forcedColor) {
    var out = [], i;
    if (p.special === 'row') {
      for (i = 0; i < this.W; i++) out.push([r, i]);
      this.fx.push({ type: 'row', r: r, c: c, t: 0 });
      Sound.play('rocket');
    } else if (p.special === 'col') {
      for (i = 0; i < this.H; i++) out.push([i, c]);
      this.fx.push({ type: 'col', r: r, c: c, t: 0 });
      Sound.play('rocket');
    } else if (p.special === 'bomb') {
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) out.push([r + dr, c + dc]);
      this.fx.push({ type: 'bomb', r: r, c: c, t: 0 });
      Sound.play('bomb');
    } else if (p.special === 'rainbow') {
      var col = forcedColor != null ? forcedColor : this._popularColor();
      for (var rr = 0; rr < this.H; rr++) for (var cc = 0; cc < this.W; cc++) {
        var q = this.cells[rr][cc];
        if (q && q.kind === 'cat' && q.color === col) out.push([rr, cc]);
      }
      this.fx.push({ type: 'rainbow', r: r, c: c, t: 0 });
      Sound.play('rainbow');
    }
    return out;
  };

  Game.prototype._popularColor = function () {
    var cnt = new Array(this.colors).fill(0);
    for (var r = 0; r < this.H; r++) for (var c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (p && p.kind === 'cat') cnt[p.color]++;
    }
    var best = 0;
    for (var i = 1; i < this.colors; i++) if (cnt[i] > cnt[best]) best = i;
    return best;
  };

  /**
   * 씨앗 칸들에서 시작해 연쇄 폭발을 계산하고 실제로 지운다.
   * seeds: [[r,c],...]   rainbowColor: 무지개냥이 지목할 색
   */
  Game.prototype._detonate = function (seeds, rainbowColor) {
    var remove = {}, touched = {}, crateDmg = {}, blasts = 0;
    var queue = seeds.slice(), guard = 0;

    while (queue.length && guard++ < 8000) {
      var rc = queue.shift();
      var r = rc[0], c = rc[1];
      if (!this._in(r, c) || this.wall[r][c]) continue;
      var k = key(r, c);
      touched[k] = 1;
      var p = this.cells[r][c];
      if (!p) continue;
      if (p.kind === 'crate') { crateDmg[k] = 1; continue; }
      if (p.kind === 'drop') continue;
      if (remove[k]) continue;
      remove[k] = 1;
      if (p.special) {
        blasts++;
        this._expand(p, r, c, rainbowColor).forEach(function (q) { queue.push(q); });
      }
    }

    // 옆칸 돌담에 흠집
    var self = this;
    Object.keys(remove).forEach(function (k) {
      var pr = k.split(','), r = +pr[0], c = +pr[1];
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (q) {
        if (!self._in(q[0], q[1])) return;
        var t = self.cells[q[0]][q[1]];
        if (t && t.kind === 'crate') crateDmg[key(q[0], q[1])] = 1;
      });
    });

    // 실제 제거
    var removedCount = 0;
    Object.keys(remove).forEach(function (k) {
      var pr = k.split(','), r = +pr[0], c = +pr[1];
      var p = self.cells[r][c];
      if (!p) return;
      if (p.kind === 'cat') {
        self.collected[p.color] = (self.collected[p.color] || 0) + 1;
        self._burst(r, c, p);
      }
      self.chain[r][c] = 0;
      self.cells[r][c] = null;
      removedCount++;
    });

    // 오름 벗기기
    var jellyBefore = this.jellyLeft;
    Object.keys(touched).forEach(function (k) {
      var pr = k.split(','), r = +pr[0], c = +pr[1];
      if (self.jelly[r][c] > 0) {
        self.jelly[r][c]--;
        self.jellyLeft--;
        self.parts.push({ x: c, y: r, vx: 0, vy: -1.4, life: 1, col: '#9fe8ff', size: 0.3, kind: 'ring' });
      }
    });

    // 돌담 부수기
    Object.keys(crateDmg).forEach(function (k) {
      var pr = k.split(','), r = +pr[0], c = +pr[1];
      var p = self.cells[r][c];
      if (!p || p.kind !== 'crate') return;
      p.hp--;
      p.hitT = 240;
      if (p.hp <= 0) {
        self.cells[r][c] = null;
        self.score += 40;
        for (var i = 0; i < 8; i++) {
          self.parts.push({
            x: c, y: r, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5 - 1,
            life: 1, col: '#C08A4E', size: 0.16, kind: 'box'
          });
        }
      }
    });

    // 점수
    this.score += removedCount * SCORE_CAT * this.cascade + blasts * SCORE_BLAST;

    if (removedCount) {
      Sound.play(this.cascade > 1 ? 'combo' : 'pop', { rate: stepRate(STEPS_FROM_D, this.cascade - 1) });
    }
    if (this.jellyLeft < jellyBefore) {
      Sound.play('goal', { rate: stepRate(STEPS_FROM_B, Math.min(3, jellyBefore - this.jellyLeft - 1)) });
    }

    return removedCount;
  };

  Game.prototype._burst = function (r, c, p) {
    var pal = Cats.PALETTE[p.color] || Cats.PALETTE[0];
    var n = p.special ? 12 : 7;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 4.5;
      this.parts.push({
        x: c, y: r, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        life: 1, col: p.special === 'rainbow' ? '#fff' : pal.body,
        size: 0.10 + Math.random() * 0.10, kind: 'dot'
      });
    }
  };

  /* ================= 중력 / 채우기 ================= */
  Game.prototype._movable = function (p) { return p && (p.kind === 'cat' || p.kind === 'drop'); };

  /* 이 칸이 위에서 내려오는 걸로 채워질 수 있나? */
  Game.prototype._fedFromAbove = function (r, c) {
    var top = this.cfg.cut[c];
    for (var rr = r - 1; rr >= top; rr--) {
      var p = this.cells[rr][c];
      if (p) return this._movable(p);      // 돌담면 막힘, 고양이/감귤이면 내려옴
    }
    return true;                            // 위가 뻥 뚫려 있으면 새 고양이가 채운다
  };

  Game.prototype._gravityOnce = function () {
    var moved = false, r, c;

    // 1) 세로로 내리기
    for (c = 0; c < this.W; c++) {
      var write = this.H - 1;
      for (r = this.H - 1; r >= 0; r--) {
        if (this.wall[r][c]) { write = r - 1; continue; }
        var p = this.cells[r][c];
        if (p && !this._movable(p)) { write = r - 1; continue; }   // 돌담은 그 자리에서 막음
        if (!p) continue;
        if (write !== r) { this.cells[write][c] = p; this.cells[r][c] = null; moved = true; }
        write--;
      }
    }

    // 1.5) 돌담나 벽에 얹힌 감귤은 옆으로 흘러내린다 (영영 갇히면 판을 깰 수 없다)
    for (r = this.H - 2; r >= 0; r--) {
      for (c = 0; c < this.W; c++) {
        var dp = this.cells[r][c];
        if (!dp || dp.kind !== 'drop') continue;
        var under = this.cells[r + 1][c];
        if (!this.wall[r + 1][c] && (!under || this._movable(under))) continue;
        var side = ((r + c) % 2) ? [-1, 1] : [1, -1];
        for (var si = 0; si < 2; si++) {
          var sc = c + side[si];
          if (!this._in(r + 1, sc) || this.wall[r + 1][sc] || this.cells[r + 1][sc]) continue;
          if (this.wall[r][sc]) continue;
          this.cells[r + 1][sc] = dp; this.cells[r][c] = null; moved = true;
          break;
        }
      }
    }

    // 2) 대각선으로 흘러들기
    //    "위에서 채워질 수 없는 빈 칸"을 기준으로, 좌우 위 칸에서 끌어온다.
    for (r = this.H - 1; r >= 1; r--) {
      for (c = 0; c < this.W; c++) {
        if (this.wall[r][c] || this.cells[r][c]) continue;
        if (this._fedFromAbove(r, c)) continue;
        var dirs = ((r + c) % 2) ? [-1, 1] : [1, -1];
        for (var i = 0; i < 2; i++) {
          var nc = c + dirs[i];
          if (!this._in(r - 1, nc) || this.wall[r - 1][nc]) continue;
          var q = this.cells[r - 1][nc];
          if (!this._movable(q)) continue;
          this.cells[r][c] = q; this.cells[r - 1][nc] = null;
          moved = true;
          break;
        }
      }
    }
    return moved;
  };

  Game.prototype._gravity = function () {
    var any = false, guard = 0;
    while (this._gravityOnce() && guard++ < 80) any = true;
    return any || guard > 0;
  };

  /** 중력 + 새 고양이 채우기를 더 이상 변화가 없을 때까지 반복 */
  Game.prototype._settleBoard = function () {
    var changed = false, guard = 0;
    for (;;) {
      var a = this._gravity();
      var b = this._refill();
      changed = changed || a || b;
      if (!a && !b) break;
      if (guard++ > 60) break;
    }
    this._spaceSpawns();
    return changed;
  };

  /** 아직 화면 위에 떠 있는 조각들이 겹쳐 보이지 않게 간격 벌리기 */
  Game.prototype._spaceSpawns = function () {
    for (var c = 0; c < this.W; c++) {
      var last = null;
      for (var r = this.H - 1; r >= 0; r--) {
        var p = this.cells[r][c];
        if (!p) continue;
        if (last !== null && p.py > last - 1) p.py = last - 1;
        last = p.py;
      }
    }
  };

  /* 감귤이 나올 열 고르기: 돌담에 막히지 않은 뻥 뚫린 열이 좋다 */
  Game.prototype._dropColumn = function () {
    var best = -1, bestScore = -1;
    for (var c = 0; c < this.W; c++) {
      var top = this.cfg.cut[c];
      if (top >= this.H) continue;
      if (this.cells[top][c]) continue;            // 맨 위가 비어 있어야 새로 나온다
      var crates = 0, busy = false;
      for (var r = top; r < this.H; r++) {
        var p = this.cells[r][c];
        if (!p) continue;
        if (p.kind === 'crate') crates++;
        if (p.kind === 'drop') busy = true;        // 한 열에 두 개는 안 넣는다
      }
      if (busy) continue;
      var sc = 10 - crates * 5 + this._rng();
      if (sc > bestScore) { bestScore = sc; best = c; }
    }
    return best;
  };

  Game.prototype._refill = function () {
    var added = false;
    var dropCol = this._wantDrop() ? this._dropColumn() : -1;
    for (var c = 0; c < this.W; c++) {
      var top = this.cfg.cut[c];
      if (top >= this.H) continue;
      var k = 0;
      for (var r = top; r < this.H; r++) {
        if (this.wall[r][c]) continue;
        if (this.cells[r][c]) break;
        var above = -1 - k;
        var makeDrop = (c === dropCol && k === 0);
        this.cells[r][c] = makeDrop
          ? this._newDrop(r, c, above)
          : this._newCat(Math.floor(this._rng() * this.colors), r, c, above);
        if (makeDrop) { this.dropsSpawned++; dropCol = -1; }
        k++; added = true;
      }
    }
    return added;
  };

  Game.prototype._wantDrop = function () {
    if (this.dropsTotal <= 0) return false;
    var left = this.dropsTotal - this.dropsSpawned;
    if (left <= 0) return false;
    // 감귤은 맨 아래까지 내려가야 해서 오래 걸린다.
    // 여러 개가 동시에 내려오게 해야 판이 답답하지 않다.
    var onBoard = this._countDrops();
    if (onBoard >= Math.min(4, left)) return false;
    return this._rng() < 0.55;
  };

  Game.prototype._countDrops = function () {
    var n = 0;
    for (var r = 0; r < this.H; r++) for (var c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (p && p.kind === 'drop') n++;
    }
    return n;
  };

  Game.prototype._collectDrops = function () {
    var got = 0;
    for (var c = 0; c < this.W; c++) {
      var r = this.H - 1;
      while (r >= 0 && this.wall[r][c]) r--;
      if (r < 0) continue;
      var p = this.cells[r][c];
      if (p && p.kind === 'drop' && Math.abs(p.py - p.tr) < 0.05) {
        this.cells[r][c] = null;
        this.dropsDone++;
        this.score += 300;
        got++;
        for (var i = 0; i < 14; i++) {
          this.parts.push({
            x: c, y: r, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6 - 1,
            life: 1, col: '#FFF7E0', size: 0.13, kind: 'dot'
          });
        }
      }
    }
    if (got) { Sound.play('goal', { rate: stepRate(STEPS_FROM_B, 3) }); this._toast(global.T('fx.harvest')); }
    return got;
  };

  Game.prototype._syncTargets = function (snap) {
    for (var r = 0; r < this.H; r++) for (var c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (!p) continue;
      if (p.tr !== r || p.tc !== c) {
        if (r > p.tr) p.fall = true;
        p.tr = r; p.tc = c;
      }
      if (snap) { p.px = c; p.py = r; p.vy = 0; p.fall = false; }
    }
  };

  Game.prototype._settled = function () {
    for (var r = 0; r < this.H; r++) for (var c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (!p) continue;
      if (Math.abs(p.py - p.tr) > 0.02 || Math.abs(p.px - p.tc) > 0.02) return false;
    }
    return true;
  };

  /* ================= 수 두기 ================= */
  Game.prototype._swappable = function (r, c) {
    if (!this._in(r, c) || this.wall[r][c]) return false;
    if (this.chain[r][c]) return false;
    var p = this.cells[r][c];
    return !!p && p.kind === 'cat';
  };

  Game.prototype.trySwap = function (r1, c1, r2, c2) {
    if (this.phase !== 'idle' || this.ended) return false;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;
    if (!this._swappable(r1, c1) || !this._swappable(r2, c2)) {
      Sound.play('invalid');
      return false;
    }
    var A = this.cells[r1][c1], B = this.cells[r2][c2];
    this.cells[r1][c1] = B; this.cells[r2][c2] = A;
    this._syncTargets();
    A.fall = false; B.fall = false;

    this.swapPair = [[r1, c1], [r2, c2]];
    this.phase = 'swap';
    this.timer = SWAP_MS;
    this.hint = null; this.idleT = 0;
    Sound.play('swap');
    return true;
  };

  /* 특수 고양이끼리 합쳤을 때 */
  Game.prototype._comboSeeds = function (A, B, r1, c1, r2, c2) {
    var sa = A.special, sb = B.special, r, c, i, out = [];
    var isStripe = function (s) { return s === 'row' || s === 'col'; };

    if (sa === 'rainbow' && sb === 'rainbow') {
      for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) out.push([r, c]);
      A.special = null; B.special = null;
      this.fx.push({ type: 'rainbow', r: r2, c: c2, t: 0 });
      Sound.play('rainbow');
      this._toast(global.T('fx.rainbowBig'));
      return { seeds: out, color: null };
    }
    if (sa === 'rainbow' || sb === 'rainbow') {
      var rb = sa === 'rainbow' ? A : B;
      var other = rb === A ? B : A;
      var rbPos = rb === A ? [r1, c1] : [r2, c2];
      var target = other.color;
      var conv = isStripe(other.special) ? 'stripe' : (other.special === 'bomb' ? 'bomb' : null);
      for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
        var p = this.cells[r][c];
        if (p && p.kind === 'cat' && p.color === target && p.special !== 'rainbow') {
          if (conv === 'stripe') p.special = (this._rng() < 0.5 ? 'row' : 'col');
          else if (conv === 'bomb') p.special = 'bomb';
          out.push([r, c]);
        }
      }
      rb.special = null;
      out.push(rbPos);
      this.fx.push({ type: 'rainbow', r: rbPos[0], c: rbPos[1], t: 0 });
      Sound.play('rainbow');
      this._toast(global.T(conv ? 'fx.rainbowMix' : 'fx.rainbow'));
      return { seeds: out, color: target };
    }
    if (isStripe(sa) && isStripe(sb)) {
      A.special = 'row'; B.special = 'col';
      this._toast(global.T('fx.cross'));
      return { seeds: [[r1, c1], [r2, c2]], color: null };
    }
    if ((isStripe(sa) && sb === 'bomb') || (sa === 'bomb' && isStripe(sb))) {
      A.special = null; B.special = null;
      for (i = -1; i <= 1; i++) {
        for (c = 0; c < this.W; c++) out.push([r2 + i, c]);
        for (r = 0; r < this.H; r++) out.push([r, c2 + i]);
      }
      this.fx.push({ type: 'bomb', r: r2, c: c2, t: 0 });
      this.fx.push({ type: 'row', r: r2, c: c2, t: 0 });
      this.fx.push({ type: 'col', r: r2, c: c2, t: 0 });
      Sound.play('rocket'); Sound.play('bomb');
      this._toast(global.T('fx.big'));
      return { seeds: out, color: null };
    }
    if (sa === 'bomb' && sb === 'bomb') {
      A.special = null; B.special = null;
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) out.push([r2 + dr, c2 + dc]);
      this.fx.push({ type: 'bomb', r: r2, c: c2, t: 0, big: true });
      Sound.play('bomb');
      this._toast(global.T('fx.mega'));
      return { seeds: out, color: null };
    }
    return null;
  };

  Game.prototype._afterSwap = function () {
    var pr = this.swapPair;
    var r1 = pr[0][0], c1 = pr[0][1], r2 = pr[1][0], c2 = pr[1][1];
    var A = this.cells[r1][c1], B = this.cells[r2][c2];

    // 1) 특수 합체?
    if (A && B && A.kind === 'cat' && B.kind === 'cat' && (A.special || B.special)) {
      var combo = this._comboSeeds(A, B, r1, c1, r2, c2);
      if (combo) {
        this.movesLeft--;
        this.cascade = 1;
        this._detonate(combo.seeds, combo.color);
        this.phase = 'clear'; this.timer = CLEAR_MS;
        this._hud();
        return;
      }
    }

    // 2) 보통 매칭?
    var groups = this._groups();
    if (!groups.length) {
      // 되돌리기
      this.cells[r1][c1] = B; this.cells[r2][c2] = A;
      this._syncTargets();
      if (A) A.fall = false; if (B) B.fall = false;
      this.phase = 'swapback'; this.timer = SWAP_MS;
      Sound.play('invalid');
      return;
    }
    this.movesLeft--;
    this.cascade = 1;
    this._resolveGroups(groups, [[r1, c1], [r2, c2]]);
    this._hud();
  };

  /* 덩어리 처리: 특수 고양이 생성 -> 폭발 */
  Game.prototype._resolveGroups = function (groups, prefer) {
    var self = this;
    var births = [];
    groups.forEach(function (G) {
      var sp = self._specialOf(G);
      if (!sp) return;
      var spot = self._specialSpot(G, prefer);
      births.push({ r: spot[0], c: spot[1], special: sp, color: G.color });
    });

    var seeds = [];
    groups.forEach(function (G) {
      Object.keys(G.cells).forEach(function (k) {
        var b = births.some(function (x) { return key(x.r, x.c) === k; });
        if (!b) seeds.push(G.cells[k]);
      });
    });

    this._detonate(seeds, null);

    // 특수 고양이 탄생
    births.forEach(function (b) {
      if (self.wall[b.r][b.c]) return;
      var p = self._newCat(b.color, b.r, b.c);
      p.special = b.special;
      p.born = 1;
      self.cells[b.r][b.c] = p;
      self.score += SCORE_MAKE;
      self.parts.push({ x: b.c, y: b.r, vx: 0, vy: -0.6, life: 1, col: '#fff', size: 0.5, kind: 'ring' });
    });
    if (births.length) {
      var names = { row: 'fx.rocket', col: 'fx.rocket', bomb: 'fx.bomb', rainbow: 'fx.rainbow' };
      this._toast(global.T(names[births[0].special]));
      Sound.play('star');
    }

    this.phase = 'clear';
    this.timer = CLEAR_MS;
  };

  /* ================= 진행 ================= */
  Game.prototype.update = function (dt) {
    var self = this;
    dt = Math.min(dt, 0.05);

    // 위치 보간
    var k = Math.min(1, dt * LERP);
    for (var r = 0; r < this.H; r++) for (var c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (!p) continue;
      p.px += (p.tc - p.px) * k;
      if (p.fall) {
        p.vy += GRAV * dt;
        p.py += p.vy * dt;
        if (p.py >= p.tr) { p.py = p.tr; p.vy = 0; p.fall = false; }
      } else {
        p.py += (p.tr - p.py) * k;
      }
      if (p.born) { p.born = Math.max(0, p.born - dt * 3); }
      if (p.hitT) p.hitT = Math.max(0, p.hitT - dt * 1000);
    }

    // 파티클
    for (var i = this.parts.length - 1; i >= 0; i--) {
      var q = this.parts[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 14 * dt;
      q.life -= dt * (q.kind === 'ring' ? 2.6 : 1.7);
      if (q.life <= 0) this.parts.splice(i, 1);
    }
    for (i = this.fx.length - 1; i >= 0; i--) {
      this.fx[i].t += dt * 1000;
      if (this.fx[i].t > 420) this.fx.splice(i, 1);
    }

    // 단계별 진행
    if (this.phase === 'swap') {
      this.timer -= dt * 1000;
      if (this.timer <= 0) this._afterSwap();
    } else if (this.phase === 'swapback') {
      this.timer -= dt * 1000;
      if (this.timer <= 0) { this.phase = 'idle'; this.swapPair = null; }
    } else if (this.phase === 'clear') {
      this.timer -= dt * 1000;
      if (this.timer <= 0) {
        this._settleBoard();
        this._syncTargets();
        this.phase = 'fall';
        this.timer = 1200;
      }
    } else if (this.phase === 'fall') {
      this.timer -= dt * 1000;
      if (this._settled() || this.timer <= 0) {
        this._collectDrops();
        if (this._settleBoard()) {   // 감귤이 빠진 자리 메우기
          this._syncTargets();
          this.timer = 1200;
          return;
        }
        var groups = this._groups();
        if (groups.length) {
          this.cascade++;
          if (this.cascade === 3) this._toast(global.T('fx.combo3'));
          if (this.cascade >= 5) this._toast(global.T('fx.comboN', { n: this.cascade }));
          this._resolveGroups(groups, null);
          this._hud();
        } else {
          this.phase = 'idle';
          this.swapPair = null;
          this.cascade = 1;
          this._hud();
          this._checkEnd();
          if (!this.ended && !this._hasMove()) {
            this._toast(global.T('fx.noMove'));
            this._shuffle(false);
          }
        }
      }
    } else if (this.phase === 'idle') {
      this.idleT += dt * 1000;
      if (this.idleT > HINT_MS && !this.hint && !this.ended) this.hint = this._findMove();
    }
  };

  Game.prototype._checkEnd = function () {
    if (this.ended) return;
    if (this.allGoalsDone()) {
      this.ended = true; this.phase = 'over';
      Sound.play('win');
      if (this.on.onEnd) this.on.onEnd(true, this);
    } else if (this.movesLeft <= 0) {
      this.ended = true; this.phase = 'over';
      Sound.play('lose');
      if (this.on.onEnd) this.on.onEnd(false, this);
    }
  };

  /* ================= 가능한 수 찾기 / 섞기 ================= */
  Game.prototype._findMove = function () {
    var r, c;
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (p && p.kind === 'cat' && p.special === 'rainbow' && !this.chain[r][c]) {
        var nb = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
        for (var i = 0; i < 4; i++) {
          if (this._swappable(nb[i][0], nb[i][1])) return [[r, c], nb[i]];
        }
      }
    }
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      var dirs = [[0, 1], [1, 0]];
      for (var d = 0; d < 2; d++) {
        var r2 = r + dirs[d][0], c2 = c + dirs[d][1];
        if (!this._swappable(r, c) || !this._swappable(r2, c2)) continue;
        var A = this.cells[r][c], B = this.cells[r2][c2];
        if (A.special && B.special) return [[r, c], [r2, c2]];
        this.cells[r][c] = B; this.cells[r2][c2] = A;
        var ok = this._groups().length > 0;
        this.cells[r][c] = A; this.cells[r2][c2] = B;
        if (ok) return [[r, c], [r2, c2]];
      }
    }
    return null;
  };

  Game.prototype._hasMove = function () { return !!this._findMove(); };

  Game.prototype._shuffle = function (silent) {
    var list = [], r, c;
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (p && p.kind === 'cat' && !this.chain[r][c]) list.push([r, c]);
    }
    for (var attempt = 0; attempt < 60; attempt++) {
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(this._rng() * (i + 1));
        var a = list[i], b = list[j];
        var pa = this.cells[a[0]][a[1]], pb = this.cells[b[0]][b[1]];
        this.cells[a[0]][a[1]] = pb; this.cells[b[0]][b[1]] = pa;
      }
      this._syncTargets();
      if (!this._groups().length && this._hasMove()) break;
    }
    this._syncTargets();
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      var q = this.cells[r][c];
      if (q) { q.fall = false; q.py = q.tr - 0.35; q.px = q.tc; }
    }
    if (!silent) Sound.play('swap', { rate: 0.8 });
    this.hint = null; this.idleT = 0;
  };

  Game.prototype.useShuffle = function () {
    if (this.phase !== 'idle' || this.ended || this.shufflesLeft <= 0) return false;
    this.shufflesLeft--;
    this._shuffle(false);
    this._toast(global.T('fx.shuffled'));
    this._hud();
    return true;
  };

  Game.prototype.useHint = function () {
    if (this.phase !== 'idle' || this.ended) return false;
    this.hint = this._findMove();
    if (!this.hint) { this._shuffle(false); return false; }
    Sound.play('click');
    return true;
  };

  /* ================= 그리기 ================= */
  Game.prototype.resize = function () {
    if (!this.cfg) return;
    var wrap = this.canvas.parentElement;
    var cs = global.getComputedStyle(wrap);
    var availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
    var availH = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
    if (availW <= 0 || availH <= 0) return;
    var t = Math.floor(Math.min(availW / this.W, availH / this.H));
    t = Math.max(28, t);
    this.tile = t;
    var w = t * this.W, h = t * this.H;
    var dpr = Math.min(global.devicePixelRatio || 1, 2.5);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dpr = dpr;
  };

  Game.prototype.render = function (now) {
    if (!this.cfg) return;
    var g = this.g, T = this.tile, r, c;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.W * T, this.H * T);

    // 바탕 칸
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      if (this.wall[r][c]) continue;
      var even = (r + c) % 2 === 0;
      g.fillStyle = even ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.58)';
      Cats.roundRect(g, c * T + 2, r * T + 2, T - 4, T - 4, T * 0.22);
      g.fill();
    }

    // 오름
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      if (this.jelly[r][c] > 0) Cats.drawOreum(g, c * T + T / 2, r * T + T / 2, T, this.jelly[r][c]);
    }

    // 선택 표시
    if (this.sel) {
      g.strokeStyle = 'rgba(255,122,31,.95)';
      g.lineWidth = Math.max(3, T * 0.06);
      Cats.roundRect(g, this.sel[1] * T + 3, this.sel[0] * T + 3, T - 6, T - 6, T * 0.22);
      g.stroke();
    }
    // 힌트
    if (this.hint) {
      var pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
      g.strokeStyle = 'rgba(20,170,130,' + (0.45 + pulse * 0.5) + ')';
      g.lineWidth = Math.max(3, T * 0.055);
      this.hint.forEach(function (rc) {
        Cats.roundRect(g, rc[1] * T + 3, rc[0] * T + 3, T - 6, T - 6, T * 0.22);
        g.stroke();
      });
    }

    // 조각들
    var dying = this.phase === 'clear' ? 1 - this.timer / CLEAR_MS : 0;
    for (r = 0; r < this.H; r++) for (c = 0; c < this.W; c++) {
      var p = this.cells[r][c];
      if (!p) continue;
      var x = (p.px + 0.5) * T, y = (p.py + 0.5) * T;
      var s = T * 0.94;
      if (p.born) s *= 1 + p.born * 0.35;
      if (p.kind === 'cat') {
        Cats.draw(g, x, y, s, p.color, p.special, now);
      } else if (p.kind === 'crate') {
        if (p.hitT) {
          g.save();
          g.translate(Math.sin(p.hitT * 0.09) * T * 0.06, 0);
          Cats.drawStoneWall(g, x, y, T, p.hp);
          g.restore();
        } else Cats.drawStoneWall(g, x, y, T, p.hp);
      } else if (p.kind === 'drop') {
        Cats.drawTangerine(g, x, y, T, now);
      }
      if (this.chain[r][c]) Cats.drawCarrot(g, x, y, T);
    }
    if (dying > 0) { /* 사라지는 연출은 파티클로 대신 */ }

    // 폭발 연출
    this.fx.forEach(function (f) {
      var a = 1 - f.t / 420;
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      if (f.type === 'row' || f.type === 'col') {
        var grd;
        if (f.type === 'row') {
          grd = g.createLinearGradient(0, f.r * T, 0, (f.r + 1) * T);
          grd.addColorStop(0, 'rgba(255,255,255,0)');
          grd.addColorStop(0.5, 'rgba(255,240,180,.9)');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = grd; g.fillRect(0, f.r * T, this.W * T, T);
        } else {
          grd = g.createLinearGradient(f.c * T, 0, (f.c + 1) * T, 0);
          grd.addColorStop(0, 'rgba(255,255,255,0)');
          grd.addColorStop(0.5, 'rgba(255,240,180,.9)');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = grd; g.fillRect(f.c * T, 0, T, this.H * T);
        }
      } else if (f.type === 'bomb') {
        var rad = (f.big ? 3.0 : 2.0) * T * (1 - a) + T * 0.3;
        g.strokeStyle = 'rgba(255,190,110,' + a + ')';
        g.lineWidth = T * 0.18 * a;
        g.beginPath(); g.arc((f.c + 0.5) * T, (f.r + 0.5) * T, rad, 0, Math.PI * 2); g.stroke();
      } else if (f.type === 'rainbow') {
        var rad2 = 4 * T * (1 - a);
        var gr = g.createRadialGradient((f.c + .5) * T, (f.r + .5) * T, 0, (f.c + .5) * T, (f.r + .5) * T, Math.max(1, rad2));
        gr.addColorStop(0, 'rgba(255,255,255,' + (a * .8) + ')');
        gr.addColorStop(0.6, 'rgba(180,155,255,' + (a * .5) + ')');
        gr.addColorStop(1, 'rgba(255,147,182,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc((f.c + .5) * T, (f.r + .5) * T, Math.max(1, rad2), 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }, this);

    // 파티클
    this.parts.forEach(function (q) {
      g.save();
      g.globalAlpha = Math.max(0, q.life);
      if (q.kind === 'ring') {
        g.strokeStyle = q.col; g.lineWidth = T * 0.07;
        g.beginPath();
        g.arc((q.x + .5) * T, (q.y + .5) * T, T * q.size * (2 - q.life) * 1.6, 0, Math.PI * 2);
        g.stroke();
      } else {
        g.fillStyle = q.col;
        g.beginPath();
        g.arc((q.x + .5) * T, (q.y + .5) * T, T * q.size * q.life, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    });

    // 당근 위 벽 표시 없음
  };

  /* ================= 입력 ================= */
  Game.prototype._bind = function () {
    var self = this, down = null;

    function cellAt(ev) {
      var rect = self.canvas.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width * self.W;
      var y = (ev.clientY - rect.top) / rect.height * self.H;
      var c = Math.floor(x), r = Math.floor(y);
      if (!self._in(r, c)) return null;
      return [r, c];
    }

    this.canvas.addEventListener('pointerdown', function (ev) {
      if (!self.cfg || self.ended || self.phase !== 'idle') return;
      var rc = cellAt(ev);
      if (!rc) return;
      ev.preventDefault();
      self.idleT = 0; self.hint = null;
      down = { rc: rc, x: ev.clientX, y: ev.clientY, moved: false };
      if (self._swappable(rc[0], rc[1])) self.sel = rc;
      try { self.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
    });

    this.canvas.addEventListener('pointermove', function (ev) {
      if (!down || down.moved || !self.cfg || self.phase !== 'idle') return;
      var dx = ev.clientX - down.x, dy = ev.clientY - down.y;
      var need = self.canvas.getBoundingClientRect().width / self.W * 0.45;
      if (Math.abs(dx) < need && Math.abs(dy) < need) return;
      var dr = 0, dc = 0;
      if (Math.abs(dx) > Math.abs(dy)) dc = dx > 0 ? 1 : -1; else dr = dy > 0 ? 1 : -1;
      down.moved = true;
      self.sel = null;
      self.trySwap(down.rc[0], down.rc[1], down.rc[0] + dr, down.rc[1] + dc);
    });

    function up(ev) {
      if (!down) return;
      if (!down.moved && self.phase === 'idle') {
        var rc = cellAt(ev);
        if (rc && self.sel && (self.sel[0] !== rc[0] || self.sel[1] !== rc[1])) {
          if (Math.abs(self.sel[0] - rc[0]) + Math.abs(self.sel[1] - rc[1]) === 1) {
            var s = self.sel; self.sel = null;
            self.trySwap(s[0], s[1], rc[0], rc[1]);
          } else {
            self.sel = self._swappable(rc[0], rc[1]) ? rc : null;
          }
        }
      }
      down = null;
    }
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', function () { down = null; });
  };

  global.Game = Game;
})(window);
