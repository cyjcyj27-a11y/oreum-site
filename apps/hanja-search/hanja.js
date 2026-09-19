/* 한자 필기 입력기 — 화면 쪽 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var HAN = '"Noto Serif KR", "Malgun Gothic", "Batang", "Nanum Myeongjo", "MingLiU", "SimSun", serif';

  var pad = $('hjPad'), pctx = pad.getContext('2d');
  var strokes = [], drawing = null, ready = false, timer = 0;
  var tray = [];
  var cur = null;          // 고른 한자

  /* ---------- 알림 ---------- */
  var toastT = 0;
  function toast(msg) {
    var t = $('hjToast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, 1400);
  }

  /* ---------- 모아 둔 한자 ---------- */
  function drawTray() {
    var el = $('hjTray');
    if (!tray.length) { el.innerHTML = '<i>찾은 한자가 여기에 쌓입니다</i>'; return; }
    el.textContent = tray.join('');
  }
  function push(ch) {
    tray.push(ch); drawTray();
    toast(ch + ' 넣었습니다');
    clearPad();
  }
  function clearPad() {
    strokes = []; paint(); bar();
    $('hjCands').innerHTML = '';
  }
  function copyText(text) {
    if (!text) { toast('넣은 한자가 없습니다'); return; }
    var done = function () { toast('복사했습니다'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    } else fallback(text, done);
  }
  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('복사가 막혀 있습니다'); }
    document.body.removeChild(ta);
  }

  /* ---------- 필기판 ---------- */
  function paint() {
    var w = pad.width, h = pad.height;
    pctx.clearRect(0, 0, w, h);
    // 길잡이 줄
    pctx.save();
    pctx.strokeStyle = '#eceaea'; pctx.lineWidth = 3; pctx.setLineDash([12, 16]);
    pctx.beginPath();
    pctx.moveTo(w / 2, 10); pctx.lineTo(w / 2, h - 10);
    pctx.moveTo(10, h / 2); pctx.lineTo(w - 10, h / 2);
    pctx.stroke();
    pctx.setLineDash([]);
    pctx.strokeStyle = '#f3f1f1';
    pctx.strokeRect(w * .08, h * .08, w * .84, h * .84);
    pctx.restore();
    // 그은 획
    pctx.save();
    pctx.strokeStyle = '#16161a'; pctx.lineWidth = w * 0.035;
    pctx.lineCap = 'round'; pctx.lineJoin = 'round';
    for (var i = 0; i < strokes.length; i++) {
      var s = strokes[i];
      pctx.beginPath();
      if (s.length <= 2) { pctx.arc(s[0], s[1], pctx.lineWidth / 2, 0, 6.2832); pctx.fillStyle = '#16161a'; pctx.fill(); continue; }
      pctx.moveTo(s[0], s[1]);
      for (var k = 2; k + 3 < s.length; k += 2) {
        pctx.quadraticCurveTo(s[k], s[k + 1], (s[k] + s[k + 2]) / 2, (s[k + 1] + s[k + 3]) / 2);
      }
      pctx.lineTo(s[s.length - 2], s[s.length - 1]);
      pctx.stroke();
    }
    pctx.restore();
  }

  function padPos(ev) {
    var r = pad.getBoundingClientRect();
    return [(ev.clientX - r.left) * pad.width / r.width, (ev.clientY - r.top) * pad.height / r.height];
  }
  pad.addEventListener('pointerdown', function (ev) {
    ev.preventDefault();
    pad.setPointerCapture(ev.pointerId);
    var p = padPos(ev);
    drawing = [p[0], p[1]];
    strokes.push(drawing);
    paint(); bar();
  });
  pad.addEventListener('pointermove', function (ev) {
    if (!drawing) return;
    var p = padPos(ev), n = drawing.length;
    if (n >= 2) {
      var dx = p[0] - drawing[n - 2], dy = p[1] - drawing[n - 1];
      if (dx * dx + dy * dy < 25) return;
    }
    drawing.push(p[0], p[1]);
    paint();
  });
  function endStroke() {
    if (!drawing) return;
    drawing = null;
    bar(); schedule();
  }
  pad.addEventListener('pointerup', endStroke);
  pad.addEventListener('pointercancel', endStroke);
  pad.addEventListener('pointerleave', endStroke);

  function bar() {
    $('hjPadTip').classList.toggle('off', strokes.length > 0);
    $('hjCnt').textContent = strokes.length + '획';
    $('hjUndo').disabled = !strokes.length;
    $('hjErase').disabled = !strokes.length;
  }
  $('hjUndo').addEventListener('click', function () {
    strokes.pop(); paint(); bar(); schedule();
  });
  $('hjErase').addEventListener('click', clearPad);

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 170);
  }
  function run() {
    if (!ready) return;
    if (!strokes.length) { $('hjCands').innerHTML = ''; return; }
    var res = HJ.find(strokes, 40);
    showCands($('hjCands'), res.map(function (r) { return r.ch; }), true);
  }

  /* ---------- 후보 ---------- */
  function showCands(box, chars, mark) {
    box.innerHTML = '';
    if (!chars.length) { box.innerHTML = '<p class="none">해당하는 한자가 없습니다</p>'; return; }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < chars.length; i++) {
      var inf = HJ.info(chars[i]) || { hun: '', ch: chars[i] };
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cand' + (mark && i === 0 ? ' top' : '');
      b.dataset.ch = chars[i];
      b.innerHTML = '<span class="g"></span><span class="h"></span>';
      b.firstChild.textContent = chars[i];
      b.lastChild.textContent = (inf.hun || '').split(' / ')[0];
      frag.appendChild(b);
    }
    box.appendChild(frag);
  }
  document.addEventListener('click', function (ev) {
    var c = ev.target.closest ? ev.target.closest('.cand') : null;
    if (c) openSheet(c.dataset.ch);
  });

  /* ---------- 고른 한자 ---------- */
  function openSheet(ch) {
    var inf = HJ.info(ch);
    if (!inf) return;
    cur = inf;
    $('hjBigChar').textContent = ch;
    $('hjHun').textContent = inf.hun || inf.eum.join('/');
    var bits = [];
    if (inf.eum.length) bits.push('음 ' + inf.eum.join('·'));
    if (inf.rad) bits.push('부수 ' + inf.rad);
    if (inf.tot) bits.push('총 ' + inf.tot + '획');
    if (inf.lv) bits.push(inf.lv);
    $('hjMeta').textContent = bits.join('  ·  ');
    // 네이버 사전은 주소 뒤쪽(#/search)으로 찾는다
    $('hjNaver').href = 'https://hanja.dict.naver.com/#/search?query=' + encodeURIComponent(ch);
    $('hjSheet').hidden = false;
    playOrder(ch);
  }
  function closeSheet() { $('hjSheet').hidden = true; stopOrder(); }
  $('hjSheetX').addEventListener('click', closeSheet);
  $('hjSheet').addEventListener('click', function (ev) { if (ev.target === this) closeSheet(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeSheet(); });
  $('hjPick').addEventListener('click', function () { if (cur) { push(cur.ch); closeSheet(); } });
  $('hjCopy1').addEventListener('click', function () { if (cur) copyText(cur.ch); });
  $('hjReplay').addEventListener('click', function () { if (cur) playOrder(cur.ch); });

  /* ---------- 획순 ---------- */
  var oc = $('hjOrder'), octx = oc.getContext('2d'), oTimer = 0;
  function stopOrder() { clearTimeout(oTimer); oTimer = 0; }
  function strokeLen(s) {
    var t = 0;
    for (var i = 0; i + 3 < s.length; i += 2) {
      var dx = s[i + 2] - s[i], dy = s[i + 3] - s[i + 1];
      t += Math.sqrt(dx * dx + dy * dy);
    }
    return t;
  }
  function drawPart(s, frac, w) {
    var total = strokeLen(s), want = total * frac, gone = 0;
    octx.beginPath();
    octx.moveTo(s[0] * w, s[1] * w);
    for (var i = 0; i + 3 < s.length; i += 2) {
      var dx = s[i + 2] - s[i], dy = s[i + 3] - s[i + 1], d = Math.sqrt(dx * dx + dy * dy);
      if (gone + d <= want || d <= 1e-9) {
        octx.lineTo(s[i + 2] * w, s[i + 3] * w);
        gone += d;
      } else {
        var f = (want - gone) / d;
        octx.lineTo((s[i] + dx * f) * w, (s[i + 1] + dy * f) * w);
        break;
      }
    }
    octx.stroke();
  }
  function playOrder(ch) {
    stopOrder();
    var ref = HJ.ref(ch), w = oc.width;
    var scale = 0.86, pad0 = (1 - scale) / 2;
    var map = ref ? ref.map(function (s) {
      var o = [];
      for (var i = 0; i < s.length; i += 2) o.push(pad0 + s[i] * scale, pad0 + s[i + 1] * scale);
      return o;
    }) : [];
    var si = 0, t = 0, step = 0.075;
    function frame() {
      octx.clearRect(0, 0, w, w);
      octx.save();
      // 바탕 글자
      octx.fillStyle = '#f2efef';
      octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.font = Math.round(w * 0.84) + 'px ' + HAN;
      octx.fillText(ch, w / 2, w / 2 + w * 0.02);
      // 획
      octx.lineWidth = w * 0.045; octx.lineCap = 'round'; octx.lineJoin = 'round';
      for (var i = 0; i < map.length; i++) {
        if (i < si) { octx.strokeStyle = '#16161a'; drawPart(map[i], 1, w); }
        else if (i === si) { octx.strokeStyle = '#d7261e'; drawPart(map[i], Math.min(1, t), w); }
      }
      octx.restore();
      if (si >= map.length) { oTimer = 0; return; }
      t += step;
      if (t >= 1.25) { t = 0; si++; }
      oTimer = setTimeout(frame, 16);
    }
    if (!map.length) {
      octx.clearRect(0, 0, w, w);
      octx.save();
      octx.fillStyle = '#16161a'; octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.font = Math.round(w * 0.8) + 'px ' + HAN;
      octx.fillText(ch, w / 2, w / 2 + w * 0.02);
      octx.restore();
      return;
    }
    frame();
  }

  /* ---------- 모아 둔 한자 단추 ---------- */
  $('hjCopy').addEventListener('click', function () { copyText(tray.join('')); });
  $('hjBack').addEventListener('click', function () { tray.pop(); drawTray(); });
  $('hjClear').addEventListener('click', function () { tray = []; drawTray(); });

  /* ---------- 탭 ---------- */
  var tabs = { write: $('tabWrite'), eum: $('tabEum'), rad: $('tabRad') };
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      for (var k in tabs) tabs[k].hidden = (k !== b.dataset.tab);
      if (b.dataset.tab === 'eum') fillEum('');
      if (b.dataset.tab === 'rad') fillRad();
    });
  });

  /* ---------- 음으로 찾기 ---------- */
  function fillEum(filter) {
    var box = $('hjEumChips');
    if (box.dataset.filter === filter && box.childNodes.length) return;
    box.dataset.filter = filter;
    var list = HJ.eumList().filter(function (e) { return !filter || e.indexOf(filter) === 0; });
    box.innerHTML = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.eum = e; b.textContent = e;
      frag.appendChild(b);
    });
    box.appendChild(frag);
    if (list.length === 1) pickEum(list[0]);
  }
  function pickEum(e) {
    Array.prototype.forEach.call(document.querySelectorAll('#hjEumChips .chip'), function (c) {
      c.classList.toggle('on', c.dataset.eum === e);
    });
    showCands($('hjEumCands'), HJ.byEum(e), false);
  }
  $('hjEumChips').addEventListener('click', function (ev) {
    var c = ev.target.closest('.chip');
    if (c) pickEum(c.dataset.eum);
  });
  var eumT = 0;
  $('hjEumInput').addEventListener('input', function () {
    var v = this.value.trim();
    clearTimeout(eumT);
    eumT = setTimeout(function () {
      fillEum(HJ.byEum(v).length ? v : '');
      if (!v) { $('hjEumCands').innerHTML = ''; return; }
      showCands($('hjEumCands'), HJ.byText(v), false);
    }, 120);
  });

  /* ---------- 부수로 찾기 ---------- */
  function fillRad() {
    var box = $('hjRadList');
    if (box.childNodes.length) return;
    var groups = {};
    HJ.radList().forEach(function (r) { (groups[r.strokes] || (groups[r.strokes] = [])).push(r); });
    var keys = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
    var frag = document.createDocumentFragment();
    keys.forEach(function (k) {
      var g = document.createElement('div');
      g.className = 'radgroup';
      var b = document.createElement('b');
      b.textContent = k + '획 부수';
      var grid = document.createElement('div');
      grid.className = 'radgrid';
      groups[k].forEach(function (r) {
        var el = document.createElement('button');
        el.type = 'button'; el.className = 'rad'; el.dataset.radi = r.idx;
        el.innerHTML = '<span class="g"></span><span class="n"></span>';
        el.firstChild.textContent = r.ch;
        el.lastChild.textContent = r.count;
        grid.appendChild(el);
      });
      g.appendChild(b); g.appendChild(grid); frag.appendChild(g);
    });
    box.innerHTML = ''; box.appendChild(frag);
  }
  $('hjRadList').addEventListener('click', function (ev) {
    var r = ev.target.closest('.rad');
    if (!r) return;
    Array.prototype.forEach.call(document.querySelectorAll('.rad'), function (x) { x.classList.remove('on'); });
    r.classList.add('on');
    showCands($('hjRadCands'), HJ.byRad(r.dataset.radi), false);
    $('hjRadCands').scrollIntoView({ block: 'nearest' });
  });

  /* ---------- 시작 ---------- */
  paint(); bar(); drawTray();
  HJ.load('data/').then(function (st) {
    ready = true;
    $('hjLoad').hidden = true;
    if (strokes.length) run();
    window.__hj = {
      find: function (ss) { return HJ.find(ss || strokes, 40); },
      setStrokes: function (ss) { strokes = ss.map(function (s) { return s.slice(); }); paint(); bar(); run(); },
      cands: function () {
        return Array.prototype.map.call(document.querySelectorAll('#hjCands .cand'), function (c) { return c.dataset.ch; }).join('');
      },
      tray: function () { return tray.join(''); },
      open: openSheet, info: HJ.info, size: st
    };
  }, function (err) {
    $('hjLoad').textContent = '한자 자료를 읽지 못했습니다 (' + err.message + ')';
  });
})();
