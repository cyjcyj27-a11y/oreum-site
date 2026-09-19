/* 한자 필기 인식기 — 그린 획과 글자마다의 획 중심선을 견줘 비슷한 순서로 세운다.
   data/strokes.bin  : 글자 수 · 획마다 K개 점(0~255로 줄인 좌표, 둘째 점부터는 앞 점과의 차)
   data/dict.json    : 글자 · 훈음 · 음 · 부수 · 총획 · 급수
   바깥에서 쓰는 것: HJ.load(), HJ.ready, HJ.find(strokes), HJ.info(ch), HJ.ref(ch), HJ.eumIndex(), HJ.radIndex()
*/
var HJ = (function () {
  'use strict';

  var K = 7, K2 = 14;
  var PRE = 520;          // 1차(획 끝점) 걸림망으로 남기는 후보 수
  var CNT_WIN = 6;        // 그은 획 수와 이만큼까지 차이 나는 글자만 본다
  var BAND = 7;           // 획 짝짓기가 어긋나도 되는 폭(CNT_WIN 보다 커야 한다)
  var MERGE_PEN = 0.10;   // 두 획을 하나로 그은 벌점
  var SKIP_PEN = 0.22;    // 획을 빼먹거나 더 그은 벌점
  var UNORDER = 1.10;     // 순서 무시 점수 할증
  var CNT_PEN = 0.02;     // 획수 차이 벌점
  var RARE = 0.05;        // 드문 글자 벌점

  var chars = '';         // 사전 글자 전체(앞쪽 ndraw 자가 필기 인식 대상)
  var info = null;        // 글자별 "훈음|음|부수|총획|급수|부수번호"
  var rads = null;
  var ndraw = 0;
  var pts = null;         // Float32Array, 모든 획의 점(0~1)
  var soff = null;        // Int32Array, 글자 i 의 첫 획 번호
  var scnt = null;        // Uint8Array, 글자 i 의 획 수
  var ends = null;        // Float32Array, 획마다 첫 점·끝 점(성긴 걸림망에 쓴다)
  var index = null;       // 글자 -> 번호
  var eumIdx = null, radIdx = null;
  var loading = null;

  /* ---------- 자료 읽기 ---------- */

  function parseBin(buf) {
    var u8 = new Uint8Array(buf), i8 = new Int8Array(buf);
    if (u8[0] !== 72 || u8[1] !== 74 || u8[2] !== 83) throw new Error('strokes.bin 형식이 아님');
    var n = u8[4] | (u8[5] << 8);
    K = u8[6]; K2 = K * 2;
    var p = 7, total = 0, i, j, k;
    // 획 총 개수 먼저 센다
    var start = p;
    for (i = 0; i < n; i++) { total += u8[p]; p += 1 + u8[p] * (2 + (K - 1) * 2); }
    pts = new Float32Array(total * K2);
    soff = new Int32Array(n + 1);
    scnt = new Uint8Array(n);
    p = start;
    var st = 0;
    for (i = 0; i < n; i++) {
      var m = u8[p++];
      soff[i] = st; scnt[i] = m;
      for (j = 0; j < m; j++) {
        var x = u8[p++], y = u8[p++], o = (st + j) * K2;
        pts[o] = x / 255; pts[o + 1] = y / 255;
        for (k = 1; k < K; k++) {
          x += i8[p++]; y += i8[p++];
          pts[o + k * 2] = x / 255; pts[o + k * 2 + 1] = y / 255;
        }
      }
      st += m;
    }
    soff[n] = st;
    return n;
  }

  function buildEnds(n) {
    var ns = soff[n];
    ends = new Float32Array(ns * 4);
    for (var s = 0; s < ns; s++) {
      var o = s * K2;
      ends[s * 4] = pts[o]; ends[s * 4 + 1] = pts[o + 1];
      ends[s * 4 + 2] = pts[o + (K - 1) * 2]; ends[s * 4 + 3] = pts[o + (K - 1) * 2 + 1];
    }
  }

  function buildIndexes() {
    index = Object.create(null);
    for (var i = 0; i < chars.length; i++) index[chars[i]] = i;
    eumIdx = Object.create(null); radIdx = Object.create(null);
    for (i = 0; i < chars.length; i++) {
      var f = info[i].split('|');
      var eums = f[1] ? f[1].split(',') : [];
      for (var j = 0; j < eums.length; j++) {
        if (!eums[j]) continue;
        (eumIdx[eums[j]] || (eumIdx[eums[j]] = [])).push(i);
      }
      var rn = f[5];
      if (rn && rn !== '0') (radIdx[rn] || (radIdx[rn] = [])).push(i);
    }
  }

  // 더블클릭(file://)으로 열면 fetch 가 막힌다 — 그때는 script 로 읽는다
  function loadScript(src) {
    return new Promise(function (ok, no) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = function () { ok(); };
      el.onerror = function () { no(new Error(src + ' 못 읽음')); };
      document.head.appendChild(el);
    });
  }

  function b64buf(str) {
    var bin = atob(str), n = bin.length, u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    return u8.buffer;
  }

  function loadByScript(base) {
    return loadScript(base + 'dict.json.js')
      .then(function () { return loadScript(base + 'strokes.bin.js'); })
      .then(function () {
        if (!window.__HJ_DICT || !window.__HJ_STROKES) throw new Error('자료가 비었음');
        return [window.__HJ_DICT, b64buf(window.__HJ_STROKES)];
      });
  }

  // 사전은 json 으로 받고(서버가 압축해 준다), 획 자료는 script 로 받는다
  // — 바이너리(.bin)는 서버가 압축해 주지 않아 오히려 250KB 더 받는다
  function loadByFetch(base) {
    return Promise.all([
      fetch(base + 'dict.json').then(function (r) { return r.json(); }),
      loadScript(base + 'strokes.bin.js').then(function () {
        if (!window.__HJ_STROKES) throw new Error('획 자료가 비었음');
        return b64buf(window.__HJ_STROKES);
      })
    ]);
  }

  function load(base) {
    if (loading) return loading;
    base = base || 'data/';
    var local = location.protocol === 'file:' || location.search.indexOf('local=1') >= 0;
    var first = local ? loadByScript(base) : loadByFetch(base).catch(function () { return loadByScript(base); });
    loading = first.then(function (res) {
      var d = res[0];
      chars = d.chars; info = d.info; rads = d.rads; ndraw = d.ndraw;
      var n = parseBin(res[1]);
      if (n !== ndraw) ndraw = Math.min(n, ndraw);
      buildEnds(n);
      buildIndexes();
      return { total: chars.length, draw: ndraw };
    });
    return loading;
  }

  /* ---------- 그린 획 다듬기 ---------- */

  var segBuf = new Float64Array(512);   // 리샘플할 때 쓰는 자리(새로 만들지 않는다)

  // 점 목록(x,y 번갈아 든 배열)을 길이 기준 K개 점으로 다시 찍는다
  function resample(src, len, out, oo) {
    var i, n = len / 2;
    if (n < 2) {
      for (i = 0; i < K; i++) { out[oo + i * 2] = src[0]; out[oo + i * 2 + 1] = src[1]; }
      return;
    }
    if (segBuf.length < n) segBuf = new Float64Array(n * 2);
    var total = 0, seg = segBuf;
    for (i = 0; i < n - 1; i++) {
      var dx = src[i * 2 + 2] - src[i * 2], dy = src[i * 2 + 3] - src[i * 2 + 1];
      seg[i] = Math.sqrt(dx * dx + dy * dy); total += seg[i];
    }
    if (total <= 1e-9) {
      for (i = 0; i < K; i++) { out[oo + i * 2] = src[0]; out[oo + i * 2 + 1] = src[1]; }
      return;
    }
    out[oo] = src[0]; out[oo + 1] = src[1];
    var step = total / (K - 1), si = 0, walked = 0;
    for (var m = 1; m < K - 1; m++) {
      var t = step * m;
      while (si < n - 2 && walked + seg[si] < t) { walked += seg[si]; si++; }
      var f = seg[si] <= 1e-9 ? 0 : (t - walked) / seg[si];
      out[oo + m * 2] = src[si * 2] + (src[si * 2 + 2] - src[si * 2]) * f;
      out[oo + m * 2 + 1] = src[si * 2 + 1] + (src[si * 2 + 3] - src[si * 2 + 1]) * f;
    }
    out[oo + (K - 1) * 2] = src[(n - 1) * 2];
    out[oo + (K - 1) * 2 + 1] = src[(n - 1) * 2 + 1];
  }

  // strokes: [[x,y,x,y,...], ...] (아무 좌표계) -> Float32Array(n*K2), 0~1 상자에 맞춤
  function prepare(strokes) {
    var n = strokes.length, i, k;
    var A = new Float32Array(n * K2);
    for (i = 0; i < n; i++) resample(strokes[i], strokes[i].length, A, i * K2);
    var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (i = 0; i < A.length; i += 2) {
      if (A[i] < minx) minx = A[i]; if (A[i] > maxx) maxx = A[i];
      if (A[i + 1] < miny) miny = A[i + 1]; if (A[i + 1] > maxy) maxy = A[i + 1];
    }
    var scale = Math.max(maxx - minx, maxy - miny) || 1;
    var cx = (maxx + minx) / 2, cy = (maxy + miny) / 2;
    for (i = 0; i < A.length; i += 2) {
      A[i] = 0.5 + (A[i] - cx) / scale;
      A[i + 1] = 0.5 + (A[i + 1] - cy) / scale;
    }
    return A;
  }

  /* ---------- 점수 ---------- */

  function dist(a, ao, b, bo) {
    var s = 0;
    for (var k = 0; k < K; k++) {
      var dx = a[ao + k * 2] - b[bo + k * 2], dy = a[ao + k * 2 + 1] - b[bo + k * 2 + 1];
      s += Math.sqrt(dx * dx + dy * dy);
    }
    return s / K;
  }

  var tmp = new Float32Array(K2 * 2);
  function mergeInto(a, ao, b, bo, out, oo) {
    for (var k = 0; k < K2; k++) { tmp[k] = a[ao + k]; tmp[K2 + k] = b[bo + k]; }
    resample(tmp, K2 * 2, out, oo);
  }

  var dp = new Float64Array(40 * 40);
  var Am = new Float32Array(40 * K2), Bm = new Float32Array(40 * K2);

  function dpScore(A, n, B, m, bo) {
    var W = m + 1, INF = 1e9, i, j;
    for (i = 0; i < (n + 1) * W; i++) dp[i] = INF;
    dp[0] = 0;
    for (i = 0; i <= n; i++) {
      var jlo = i - BAND, jhi = i + BAND;      // 짝이 이만큼 어긋나면 어차피 딴 글자다
      if (jlo < 0) jlo = 0; if (jhi > m) jhi = m;
      for (j = jlo; j <= jhi; j++) {
        var cur = dp[i * W + j];
        if (cur >= INF) continue;
        var v;
        if (i < n && j < m) {
          v = cur + dist(A, i * K2, B, bo + j * K2);
          if (v < dp[(i + 1) * W + j + 1]) dp[(i + 1) * W + j + 1] = v;
        }
        if (i + 1 < n && j < m) {   // 그은 두 획 = 원래 한 획
          v = cur + dist(Am, i * K2, B, bo + j * K2) + MERGE_PEN;
          if (v < dp[(i + 2) * W + j + 1]) dp[(i + 2) * W + j + 1] = v;
        }
        if (i < n && j + 1 < m) {   // 그은 한 획 = 원래 두 획
          v = cur + dist(A, i * K2, Bm, j * K2) + MERGE_PEN;
          if (v < dp[(i + 1) * W + j + 2]) dp[(i + 1) * W + j + 2] = v;
        }
        if (i < n) {
          v = cur + SKIP_PEN;
          if (v < dp[(i + 1) * W + j]) dp[(i + 1) * W + j] = v;
        }
        if (j < m) {
          v = cur + SKIP_PEN;
          if (v < dp[i * W + j + 1]) dp[i * W + j + 1] = v;
        }
      }
    }
    return dp[n * W + m] / (n > m ? n : m);
  }

  var used = new Uint8Array(64);
  function greedyScore(A, n, B, m, bo) {
    for (var j = 0; j < m; j++) used[j] = 0;
    var tot = 0;
    for (var i = 0; i < n; i++) {
      var best = 1e9, bi = -1;
      for (j = 0; j < m; j++) {
        if (used[j]) continue;
        var d = dist(A, i * K2, B, bo + j * K2);
        if (d < best) { best = d; bi = j; }
      }
      if (bi < 0) tot += SKIP_PEN; else { used[bi] = 1; tot += best; }
    }
    tot += SKIP_PEN * (m - (n < m ? n : m));
    return tot / (n > m ? n : m);
  }

  /* ---------- 찾기 ---------- */

  var preS = null;

  function find(strokes, want) {
    want = want || 40;
    if (!pts || !strokes.length) return [];
    var A = prepare(strokes), n = strokes.length, i, j, k;
    if (n > 36) n = 36;

    // 1차 걸림망: 획마다 첫 점·끝 점만 보고 대충 가까운 글자를 고른다
    if (!preS || preS.length !== ndraw) preS = new Float32Array(ndraw);
    var ax = new Float32Array(n * 4);
    for (i = 0; i < n; i++) {
      ax[i * 4] = A[i * K2]; ax[i * 4 + 1] = A[i * K2 + 1];
      ax[i * 4 + 2] = A[i * K2 + (K - 1) * 2]; ax[i * 4 + 3] = A[i * K2 + (K - 1) * 2 + 1];
    }
    var order = [];
    for (i = 0; i < ndraw; i++) {
      var m0 = scnt[i], so = soff[i], sum = 0;
      if (Math.abs(n - m0) > CNT_WIN || m0 > 36) continue;
      for (j = 0; j < n; j++) {
        var best = 9e9, j4 = j * 4;
        for (k = 0; k < m0; k++) {
          var e = (so + k) * 4;
          var d = Math.abs(ax[j4] - ends[e]) + Math.abs(ax[j4 + 1] - ends[e + 1])
                + Math.abs(ax[j4 + 2] - ends[e + 2]) + Math.abs(ax[j4 + 3] - ends[e + 3]);
          if (d < best) best = d;
        }
        sum += best;
      }
      preS[i] = sum / n + 0.06 * Math.abs(n - m0);
      order.push(i);
    }
    order.sort(function (a, b) { return preS[a] - preS[b]; });
    // 획이 많은 글자는 견주는 값이 커지니 후보 수를 줄인다(폰에서도 바로 나오게)
    var pre = Math.round(6200 / (n < 4 ? 4 : n));
    if (pre > PRE) pre = PRE;
    if (pre < 160) pre = 160;
    var lim = Math.min(pre, order.length);

    // 그은 획의 이음(두 획 붙이기) 미리 만들어 둔다
    for (i = 0; i + 1 < n; i++) mergeInto(A, i * K2, A, (i + 1) * K2, Am, i * K2);

    var out = [];
    for (var oi = 0; oi < lim; oi++) {
      var ci = order[oi], m = scnt[ci], bo = soff[ci] * K2;
      for (j = 0; j + 1 < m; j++) mergeInto(pts, bo + j * K2, pts, bo + (j + 1) * K2, Bm, j * K2);
      var s1 = dpScore(A, n, pts, m, bo);
      var s2 = UNORDER * greedyScore(A, n, pts, m, bo);
      var s = (s1 < s2 ? s1 : s2) + CNT_PEN * Math.abs(n - m) + RARE * (ci / ndraw);
      out.push([s, ci]);
    }
    out.sort(function (a, b) { return a[0] - b[0]; });
    var res = [];
    for (i = 0; i < out.length && i < want; i++) res.push({ ch: chars[out[i][1]], score: out[i][0] });
    return res;
  }

  /* ---------- 글자 정보 ---------- */

  function info1(ch) {
    var i = index ? index[ch] : undefined;
    if (i === undefined) return null;
    var f = info[i].split('|');
    return { ch: ch, hun: f[0], eum: f[1] ? f[1].split(',') : [], rad: f[2],
             tot: +f[3] || 0, lv: f[4], radi: +f[5] || 0, drawable: i < ndraw, rank: i };
  }

  // 획순 보여 줄 때 쓰는 획 중심선(0~1 좌표)
  function ref(ch) {
    var i = index ? index[ch] : undefined;
    if (i === undefined || i >= ndraw) return null;
    var out = [], m = scnt[i], bo = soff[i] * K2;
    for (var j = 0; j < m; j++) {
      var s = [];
      for (var k = 0; k < K; k++) s.push(pts[bo + j * K2 + k * 2], pts[bo + j * K2 + k * 2 + 1]);
      out.push(s);
    }
    return out;
  }

  // 음이나 뜻(훈)으로 찾기 — "가", "강", "나무", "임금"
  function byText(q) {
    q = (q || '').trim();
    if (!q || !index) return [];
    var out = [], seen = Object.create(null), i;
    var ex = eumIdx[q] || [];
    for (i = 0; i < ex.length; i++) { out.push(chars[ex[i]]); seen[chars[ex[i]]] = 1; }
    for (i = 0; i < chars.length && out.length < 150; i++) {
      if (seen[chars[i]]) continue;
      var f = info[i].split('|');
      if (f[0].indexOf(q) >= 0 || (',' + f[1] + ',').indexOf(',' + q) >= 0) {
        out.push(chars[i]); seen[chars[i]] = 1;
      }
    }
    return out;
  }

  function byEum(eum) { return (eumIdx && eumIdx[eum] || []).map(function (i) { return chars[i]; }); }
  function eumList() { return eumIdx ? Object.keys(eumIdx).sort() : []; }
  function byRad(n) { return (radIdx && radIdx[n] || []).map(function (i) { return chars[i]; }); }
  function radList() {
    return (rads || []).map(function (s) {
      var f = s.split('|');
      return { idx: +f[0], ch: f[1], strokes: +f[2], count: (radIdx[f[0]] || []).length };
    }).filter(function (r) { return r.count > 0; });
  }

  return { load: load, find: find, info: info1, ref: ref, byEum: byEum, byText: byText, eumList: eumList,
           tune: function (o) {   // 시험용 손잡이
             if (o.PRE) PRE = o.PRE; if (o.CNT_WIN) CNT_WIN = o.CNT_WIN; if (o.MERGE_PEN != null) MERGE_PEN = o.MERGE_PEN;
             if (o.SKIP_PEN != null) SKIP_PEN = o.SKIP_PEN; if (o.UNORDER != null) UNORDER = o.UNORDER;
             if (o.CNT_PEN != null) CNT_PEN = o.CNT_PEN; if (o.RARE != null) RARE = o.RARE;
             return { PRE: PRE, CNT_WIN: CNT_WIN, MERGE_PEN: MERGE_PEN, SKIP_PEN: SKIP_PEN, UNORDER: UNORDER, CNT_PEN: CNT_PEN, RARE: RARE };
           },
           byRad: byRad, radList: radList,
           get size() { return chars.length; }, get drawSize() { return ndraw; } };
})();
