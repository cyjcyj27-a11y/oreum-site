/* =========================================================
   오름냥 - 200판 설계
   ---------------------------------------------------------
   판 번호(1~200)만 넣으면 그 판의 규칙을 통째로 만들어 줍니다.
   같은 번호는 언제 열어도 똑같은 판이 나옵니다(난수 씨앗 고정).

   난이도를 올리는 손잡이는 6개:
     1) 보드 크기      7x7 -> 8x8 -> 9x9
     2) 고양이 종류 수  4 -> 5 -> 6 -> 7   (많을수록 줄 맞추기 어려움)
     3) 남은 횟수      32번 -> 19번
     4) 목표량(압박도)  여유 40% -> 빡빡 85%
     5) 목표 개수      1개 -> 2개 -> 3개
     6) 장애물 해금    오름 -> 돌담 -> 당근 -> 감귤 -> 2겹오름 -> 변형보드
   ========================================================= */
(function (global) {
  'use strict';

  var TOTAL = 200;

  var CHAPTERS = [
    { name: '골목길',   from: 1,   to: 20  },
    { name: '항구',     from: 21,  to: 40  },
    { name: '오름',     from: 41,  to: 60  },
    { name: '감귤밭',   from: 61,  to: 80  },
    { name: '해녀바당', from: 81,  to: 100 },
    { name: '곶자왈',   from: 101, to: 120 },
    { name: '성산일출', from: 121, to: 140 },
    { name: '한라산',   from: 141, to: 160 },
    { name: '별밤',     from: 161, to: 180 },
    { name: '냥별나라', from: 181, to: 200 }
  ];

  /* 판 번호로 고정된 난수 (같은 판 = 같은 배치) */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  function chapterOf(n) {
    for (var i = 0; i < CHAPTERS.length; i++) {
      if (n >= CHAPTERS[i].from && n <= CHAPTERS[i].to) {
        return { index: i, name: CHAPTERS[i].name, from: CHAPTERS[i].from, to: CHAPTERS[i].to };
      }
    }
    return { index: 0, name: CHAPTERS[0].name, from: 1, to: 20 };
  }

  /* 위에서부터 파낸 깊이 배열 = 변형 보드 모양 */
  function cutShape(rng, W, H, n) {
    var cut = new Array(W).fill(0);
    if (n < 101) return cut;
    var maxD = n < 141 ? 2 : 3;
    var kinds = ['peak', 'valley', 'saw', 'stair', 'flat'];
    var kind = pick(rng, kinds);
    var mid = (W - 1) / 2;
    for (var c = 0; c < W; c++) {
      var edge = Math.min(c, W - 1 - c);
      var d = 0;
      if (kind === 'peak')       d = clamp(maxD - edge, 0, maxD);
      else if (kind === 'valley')d = clamp(maxD - Math.abs(c - mid), 0, maxD);
      else if (kind === 'saw')   d = (c % 2) ? maxD - 1 : 0;
      else if (kind === 'stair') d = clamp(Math.round(Math.abs(c - mid)), 0, maxD);
      cut[c] = Math.min(d, H - 5);
    }
    return cut;
  }

  /* 셀 좌표 목록에서 rng로 count개 뽑기 */
  function sample(rng, cells, count) {
    var a = cells.slice(), out = [];
    count = Math.min(count, a.length);
    for (var i = 0; i < count; i++) {
      var k = Math.floor(rng() * a.length);
      out.push(a[k]); a.splice(k, 1);
    }
    return out;
  }

  /* -------------------------------------------------------
     계측표 - 로봇에게 실제로 시켜보고 뽑은 "1수(한 번 움직임)당 진행량"
       score   : 1수당 벌리는 점수
       collect : 1수당 잡히는 같은 색 고양이 수
       jelly   : 1수당 벗겨지는 오름 칸 수
       dropCost: 감귤 1개를 맨 아래까지 내리는 데 드는 수
     고양이 종류가 하나 늘 때마다 확 어려워지는 게 핵심이라
     판 번호가 아니라 "그 판의 색 수"를 기준으로 잡는다.
     ------------------------------------------------------- */
  var RATES = {
    4: { score: 3200, collect: 4.5,  jelly: 2.8,  dropCost: 5  },
    5: { score: 1400, collect: 2.2,  jelly: 2.0,  dropCost: 9  },
    6: { score: 950,  collect: 1.35, jelly: 0.85, dropCost: 17 },
    7: { score: 540,  collect: 0.85, jelly: 0.45, dropCost: 40 }
  };

  /* 장애물이 많고 판이 크면 그만큼 더 더디다 */
  function rateFor(colors, W, H, obstacles) {
    var base = RATES[clamp(colors, 4, 7)] || RATES[6];
    var density = obstacles / (W * H);
    var f = clamp(1 - density * 1.1, 0.65, 1);
    return {
      score:    base.score * f,
      collect:  base.collect * f,
      jelly:    base.jelly * f,
      dropCost: base.dropCost / clamp(f, 0.7, 1)
    };
  }

  /* 오름을 한 곳에 뭉쳐서 놓는다 (흩뿌리면 마지막 한 칸 찾느라 판이 늘어짐) */
  function jellyBlob(rng, cells, count) {
    if (!cells.length) return [];
    var idx = {};
    cells.forEach(function (rc) { idx[rc[0] + ',' + rc[1]] = rc; });
    var start = cells[Math.floor(rng() * cells.length)];
    var got = [start], have = {}, frontier = [start];
    have[start[0] + ',' + start[1]] = 1;
    var guard = 0;
    while (got.length < count && frontier.length && guard++ < 4000) {
      var i = Math.floor(rng() * frontier.length), cur = frontier[i];
      var nb = [[cur[0] - 1, cur[1]], [cur[0] + 1, cur[1]], [cur[0], cur[1] - 1], [cur[0], cur[1] + 1]]
        .filter(function (q) { return idx[q[0] + ',' + q[1]] && !have[q[0] + ',' + q[1]]; });
      if (!nb.length) { frontier.splice(i, 1); continue; }
      var p = nb[Math.floor(rng() * nb.length)];
      have[p[0] + ',' + p[1]] = 1;
      got.push(p); frontier.push(p);
    }
    return got;
  }

  function get(n) {
    n = clamp(Math.round(n), 1, TOTAL);
    var rng = mulberry32(n * 7919 + 104729);
    var d = (n - 1) / (TOTAL - 1);       // 0 = 첫 판, 1 = 마지막 판
    var boss = (n % 25 === 0);
    var ch = chapterOf(n);

    /* --- 1) 보드 크기 --- */
    var W, H;
    if (n <= 15)       { W = 7; H = 7; }
    else if (n <= 100) { W = 8; H = 8; }
    else               { W = 9; H = 9; }

    /* --- 2) 고양이 종류 --- */
    var colors = n <= 12 ? 4 : n <= 45 ? 5 : n <= 180 ? 6 : 7;
    if (boss && n >= 100 && colors < 7) colors += 1;

    /* --- 3) 기본 횟수 --- */
    var baseMoves = Math.round(30 - 8 * d) - (boss ? 2 : 0);
    baseMoves = clamp(baseMoves, 18, 32);

    /* --- 4) 압박도: 로봇 실력의 몇 %를 요구할 것인가 --- */
    var pressure = clamp(0.20 + 0.50 * d + (boss ? 0.05 : 0), 0.18, 0.74);

    /* --- 5) 해금 --- */
    var un = {
      jelly:  n >= 13,
      crate:  n >= 26,
      chain:  n >= 46,
      drop:   n >= 61,
      jelly2: n >= 91,
      shape:  n >= 101
    };

    /* --- 6) 목표 종류 고르기 --- */
    var goalCount = 1;
    if (n >= 81)  goalCount = rng() < 0.55 ? 2 : 1;
    if (n >= 141) goalCount = rng() < 0.40 ? 3 : 2;

    var pool = ['score'];
    if (n >= 6)   pool.push('collect');
    if (un.jelly) pool.push('jelly');
    if (un.drop)  pool.push('drop');

    var types = [];
    if (n <= 5)       types = ['score'];
    else if (n <= 12) types = ['collect'];
    else if (n <= 25) types = [rng() < 0.75 ? 'jelly' : 'collect'];
    else {
      var bag = pool.slice();
      if (un.jelly) bag.push('jelly');
      if (un.drop)  bag.push('drop');
      for (var g = 0; g < goalCount && bag.length; g++) {
        var t = pick(rng, bag);
        types.push(t);
        bag = bag.filter(function (x) { return x !== t; });
      }
    }
    // 감귤은 오래 걸리는 목표다.
    //  - 다른 목표 2개와 겹치면 판이 늘어지고
    //  - 7색 판에서는 줄이 잘 안 맞아서 아래로 내려오질 못한다
    if (types.indexOf('drop') >= 0 && (types.length > 2 || colors >= 7)) {
      types = types.filter(function (x) { return x !== 'drop'; }).slice(0, 2);
      if (!types.length) types = ['collect'];
    }

    var hasDrop = types.indexOf('drop') >= 0;
    var others = types.filter(function (x) { return x !== 'drop'; });
    var share = others.length <= 1 ? 1 : (1 / others.length) * 1.15;
    var p = pressure * share;

    /* --- 장애물 개수를 먼저 정한다 (난이도 계산에 필요) --- */
    var nCrate = 0, nChain = 0;
    if (un.crate) nCrate = clamp(Math.round((1 + 9 * d + (boss ? 2 : 0)) * (hasDrop ? 0.45 : 1)), 0, 14);
    if (un.chain) nChain = clamp(Math.round((1 + 8 * d + (boss ? 2 : 0)) * (hasDrop ? 0.5 : 1)), 0, 16);
    var rate = rateFor(colors, W, H, nCrate + nChain);

    /* --- 7) 감귤 개수와 추가 시간 --- */
    var dropCount = 0, dropExtra = 0;
    if (hasDrop) {
      dropCount = n < 121 ? 1 : (boss && n >= 150 ? 3 : 2);
      var slack = 1.35 - 0.45 * d;           // 앞에서는 넉넉히, 뒤에서는 빠듯하게
      for (;;) {
        dropExtra = Math.round(dropCount * rate.dropCost * slack);
        if (dropCount <= 1 || baseMoves + dropExtra <= 46) break;
        dropCount--;
      }
    }
    var moves = clamp(baseMoves + dropExtra, 18, 46);

    /* --- 8) 목표 수치 --- */
    var goals = [];
    var wantJellyCells = 0;

    types.forEach(function (t) {
      if (t === 'score') {
        goals.push({ type: 'score', count: Math.max(800, Math.round(baseMoves * rate.score * p / 50) * 50) });
      } else if (t === 'collect') {
        // 7색 판에서 두 종류를 동시에 모으라고 하면 사람이 감당이 안 된다
        var kinds = (n >= 60 && colors < 7 && rng() < 0.45) ? 2 : 1;
        var each = Math.max(6, Math.ceil(baseMoves * rate.collect * p / (kinds === 2 ? 1.6 : 1)));
        var used = [];
        for (var k = 0; k < kinds; k++) {
          var col;
          do { col = Math.floor(rng() * colors); } while (used.indexOf(col) >= 0);
          used.push(col);
          goals.push({ type: 'collect', color: col, count: each });
        }
      } else if (t === 'jelly') {
        var cap = Math.floor(W * H * 0.45);
        wantJellyCells = clamp(Math.ceil(baseMoves * rate.jelly * p), 6, cap);
        goals.push({ type: 'jelly', count: wantJellyCells });
      } else if (t === 'drop') {
        goals.push({ type: 'drop', count: dropCount });
      }
    });

    /* --- 9) 보드 배치 --- */
    var cut = (un.shape && !hasDrop) ? cutShape(rng, W, H, n) : new Array(W).fill(0);

    var open = [];
    for (var c = 0; c < W; c++) {
      for (var r = cut[c]; r < H; r++) open.push([r, c]);
    }

    // 감귤이 내려올 길로 쓸 열은 돌담을 아예 두지 않는다.
    // (돌담 위에 얹히면 돌담을 깰 때까지 감귤이 못 내려온다)
    var reserved = {};
    if (hasDrop) {
      var colOrder = [];
      for (var rc0 = 0; rc0 < W; rc0++) colOrder.push([0, rc0]);
      sample(rng, colOrder, Math.min(W - 1, dropCount + 1)).forEach(function (q) { reserved[q[1]] = 1; });
    }

    // 돌담 (감귤 판은 길을 열어줘야 하니 절반만)
    var crates = [];
    if (un.crate) {
      // 감귤 판은 맨 아래 두 줄에 돌담을 두지 않는다 (배달 길을 막지 않게)
      var lowLimit = hasDrop ? H - 2 : H;
      var lower = open.filter(function (rc) {
        return rc[0] >= Math.floor(H * 0.35) && rc[0] < lowLimit && !reserved[rc[1]];
      });
      sample(rng, lower, nCrate * 2).forEach(function (rc) {
        if (crates.length >= nCrate) return;
        var tooClose = crates.some(function (q) {
          return Math.abs(q.r - rc[0]) + Math.abs(q.c - rc[1]) <= 1;
        });
        if (!tooClose) crates.push({ r: rc[0], c: rc[1], hp: (n >= 110 && rng() < 0.35) ? 2 : 1 });
      });
    }

    // 오름 (돌담을 피해서 한 덩어리로)
    var jelly = {}, jellyTotal = 0;
    if (wantJellyCells > 0) {
      var freeForJelly = open.filter(function (rc) {
        return !crates.some(function (q) { return q.r === rc[0] && q.c === rc[1]; });
      });
      var jc = jellyBlob(rng, freeForJelly, wantJellyCells);
      var twoLayer = un.jelly2 ? Math.round(jc.length * clamp((n - 90) / 200, 0, 0.4)) : 0;
      jc.forEach(function (rc, i) {
        var lay = i < twoLayer ? 2 : 1;
        jelly[rc[0] + ',' + rc[1]] = lay;
        jellyTotal += lay;
      });
      goals.forEach(function (gl) { if (gl.type === 'jelly') gl.count = jellyTotal; });
    }

    // 당근
    var chains = [];
    if (un.chain) {
      var free = open.filter(function (rc) {
        return !crates.some(function (q) { return q.r === rc[0] && q.c === rc[1]; });
      });
      sample(rng, free, nChain).forEach(function (rc) { chains.push({ r: rc[0], c: rc[1] }); });
    }

    /* --- 10) 별 기준 --- */
    var s1 = Math.max(800, Math.round(baseMoves * rate.score * pressure * 0.62 / 50) * 50);
    var s2 = Math.round(s1 * 1.45 / 50) * 50;
    var s3 = Math.round(s1 * 1.95 / 50) * 50;

    return {
      n: n,
      chapter: ch.index + 1,
      chapterName: ch.name,
      boss: boss,
      W: W, H: H,
      colors: colors,
      moves: moves,
      cut: cut,
      goals: goals,
      jelly: jelly,
      jellyTotal: jellyTotal,
      crates: crates,
      chains: chains,
      drops: dropCount,
      star: { s1: s1, s2: s2, s3: s3 },
      shuffles: n <= 40 ? 2 : 1,
      seed: n * 7919 + 104729
    };
  }

  /* 목표를 사람 말로 */
  function goalText(g) {
    if (g.type === 'score')   return g.count.toLocaleString() + '점 모으기';
    if (g.type === 'collect') return (global.Cats ? Cats.PALETTE[g.color].name : '고양이') + ' ' + g.count + '마리 모으기';
    if (g.type === 'jelly')   return '오름 ' + g.count + '곳 모두 오르기';
    if (g.type === 'drop')    return '감귤 ' + g.count + '개 아래로 내려 수확하기';
    return '';
  }

  function stageNote(cfg) {
    var bits = [];
    if (cfg.boss) bits.push('보스 판! 조금 더 어려워요');
    if (cfg.n === 13) bits.push('새 장애물: 오름 - 그 칸 위에서 고양이를 터뜨리면 한 겹씩 올라가요');
    if (cfg.n === 26) bits.push('새 장애물: 돌담 - 바로 옆에서 터뜨리면 무너져요');
    if (cfg.n === 46) bits.push('새 장애물: 당근밭 - 고양이가 파묻혀 못 움직여요. 옆에서 터뜨려 꺼내주세요');
    if (cfg.n === 61) bits.push('새 목표: 감귤 - 맨 아래까지 내려보내면 수확이에요');
    if (cfg.n === 91) bits.push('오름이 두 겹이 되었어요. 두 번 올라야 해요');
    if (cfg.n === 101) bits.push('보드 모양이 달라집니다');
    if (cfg.n === 13 || cfg.n === 46 || cfg.n === 181) bits.push('고양이 종류가 늘어났어요');
    return bits.join('\n');
  }

  global.Stages = {
    TOTAL: TOTAL,
    CHAPTERS: CHAPTERS,
    get: get,
    chapterOf: chapterOf,
    goalText: goalText,
    stageNote: stageNote
  };
})(window);
