/* 거래명세서 — 품목을 넣으면 공급가액·세액·합계가 자동 계산되고, A4 에 두 부(공급자 보관용·공급받는자 보관용) 또는 한 부로 인쇄(PDF 저장)하거나 Word 로 받는다.
   쓴 내용은 이 기기의 localStorage(invoice.draft)에만 남는다. 공급자 정보는 "새 명세서"를 눌러도 남긴다. */
(function () {
  'use strict';
  var KEY = 'invoice.draft';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function blankItems(n) { var a = []; for (var i = 0; i < n; i++) a.push({}); return a; }
  function blank(keepSup) {
    return { v: 1, sup: keepSup || { reg: '', name: '', ceo: '', addr: '', biz: '', item: '', tel: '' }, cus: '', date: '', no: '', vat: '별도', copies: '2',
      items: blankItems(5), prev: '', paid: '' };
  }
  var D;
  try { D = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { D = null; }
  if (!D || D.v !== 1) D = blank();
  var ROWS2 = 10, ROWS1 = 24;   // 두 부일 때 한 부에 들어가는 품목 줄 / 한 부일 때

  function num(s) { return +String(s == null ? '' : s).replace(/[^\d.\-]/g, '') || 0; }
  function money(n) { return n ? Math.round(n).toLocaleString('ko-KR') : ''; }
  function today() { var t = new Date(); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  function hanMoney(n) {   // 1234000 → 일백이십삼만사천
    n = Math.floor(Math.abs(+n || 0)); if (!n) return '영';
    var D1 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], U1 = ['', '십', '백', '천'], U4 = ['', '만', '억', '조'], out = '', g = 0;
    while (n > 0) {
      var part = n % 10000, t = '';
      for (var i = 0; i < 4; i++) { var d = Math.floor(part / Math.pow(10, i)) % 10; if (d) t = D1[d] + U1[i] + t; }
      if (t) out = t + U4[g] + out; n = Math.floor(n / 10000); g++;
    }
    return out;
  }
  function line(it) {   // 한 줄 계산: [공급가액, 세액]
    var q = num(it.qty), p = num(it.price), amt = q * p;
    if (!amt) return [0, 0];
    if (D.vat === '포함') { var sup = Math.round(amt / 1.1); return [sup, amt - sup]; }
    if (D.vat === '면세') return [Math.round(amt), 0];
    return [Math.round(amt), Math.round(amt * 0.1)];
  }
  function totals() {
    var s = 0, t = 0, q = 0;
    D.items.forEach(function (it) { var l = line(it); s += l[0]; t += l[1]; q += num(it.qty); });
    var total = s + t, prev = num(D.prev), paid = num(D.paid);
    return { sup: s, tax: t, qty: q, total: total, prev: prev, paid: paid, bal: prev + total - paid };
  }
  function filled() { return D.items.filter(function (it) { return (it.name || '').trim() || num(it.qty) || num(it.price); }); }
  function copies() { return D.copies === '2' && filled().length <= ROWS2 ? 2 : 1; }

  // ---------- 입력 칸 ----------
  function inp(path, val, o) {
    o = o || {};
    return '<label class="fl' + (o.w ? ' w' + o.w : '') + '"><span>' + o.t + '</span><input type="' + (o.type || 'text') + '" data-p="' + path + '"' + (o.money ? ' data-money="1" inputmode="numeric"' : '') +
      ' placeholder="' + esc(o.ph || '') + '" value="' + esc(val) + '" autocomplete="off"></label>';
  }
  function seg(path, val, opts) {
    return '<div class="seg2">' + opts.map(function (o) { return '<button type="button" data-seg="' + path + '" data-v="' + o[0] + '" class="' + (o[0] === val ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function itemRows() {
    return D.items.map(function (it, i) {
      var l = line(it);
      return '<div class="it"><input type="text" data-p="items.' + i + '.md" placeholder="월일" value="' + esc(it.md) + '" aria-label="월일">' +
        '<input type="text" data-p="items.' + i + '.name" placeholder="품목" value="' + esc(it.name) + '" aria-label="품목">' +
        '<input type="text" data-p="items.' + i + '.spec" placeholder="규격" value="' + esc(it.spec) + '" aria-label="규격">' +
        '<input type="text" data-p="items.' + i + '.qty" inputmode="decimal" placeholder="수량" value="' + esc(it.qty) + '" aria-label="수량">' +
        '<input type="text" data-p="items.' + i + '.price" data-money="1" inputmode="numeric" placeholder="단가 (원)" value="' + esc(it.price) + '" aria-label="단가">' +
        '<button type="button" class="x" data-rm="' + i + '" aria-label="이 줄 빼기">×</button>' +
        '<p class="sum" id="sum' + i + '">' + (l[0] ? '공급가액 ' + money(l[0]) + '원, 세액 ' + money(l[1]) + '원' : '') + '</p></div>';
    }).join('');
  }
  function totHtml() {
    var t = totals();
    return '공급가액 ' + money(t.sup || 0) + '원 + 세액 ' + money(t.tax || 0) + '원<br><b>합계 ' + (money(t.total) || '0') + '원</b> (금 ' + hanMoney(t.total) + '원정)' +
      (t.prev || t.paid ? '<br>전잔금 ' + money(t.prev || 0) + '원 + 합계 − 입금 ' + money(t.paid || 0) + '원 = <b>잔금 ' + Math.round(t.bal).toLocaleString('ko-KR') + '원</b>' : '');
  }
  function buildForm() {
    var S = D.sup, h = '<fieldset><legend>기본</legend><div class="g2">' + inp('date', D.date, { t: '작성일', type: 'date' }) + inp('no', D.no, { t: '일련번호 (있으면)', ph: '2026-1028-01' }) +
      inp('cus', D.cus, { t: '공급받는자 (상호나 성명)', ph: '한빛물류', w: 3 }) + '</div>' +
      '<p class="fl" style="margin:12px 0 4px"><span>부가세</span></p>' + seg('vat', D.vat, [['별도', '부가세 별도'], ['포함', '부가세 포함'], ['면세', '면세']]) +
      '<p class="fl" style="margin:12px 0 4px"><span>A4 한 장에</span></p>' + seg('copies', D.copies, [['2', '두 부 (공급자용, 공급받는자용)'], ['1', '한 부']]) +
      '<p class="warn" id="ivCopy" hidden></p></fieldset>';
    h += '<fieldset><legend>공급자 (내 가게, 회사)</legend><div class="g2">' + inp('sup.reg', S.reg, { t: '사업자 등록번호', ph: '123-45-67890' }) + inp('sup.name', S.name, { t: '상호', ph: '오름문구' }) +
      inp('sup.ceo', S.ceo, { t: '성명 (대표자)', ph: '김오름' }) + inp('sup.tel', S.tel, { t: '전화', ph: '02-123-4567', type: 'tel' }) + inp('sup.addr', S.addr, { t: '사업장 주소', ph: '서울특별시 마포구 월드컵북로 400', w: 3 }) +
      inp('sup.biz', S.biz, { t: '업태', ph: '도소매' }) + inp('sup.item', S.item, { t: '종목', ph: '문구, 사무용품' }) + '</div><p class="hint">공급자 정보는 사용자의 기기에 남아 다음 명세서에도 그대로 들어갑니다.</p></fieldset>';
    h += '<fieldset><legend>품목</legend>' +
      '<div id="ivItems">' + itemRows() + '</div><button type="button" class="add" data-add="1">+ 줄 더하기</button><div class="tot" id="ivTot">' + totHtml() + '</div></fieldset>';
    h += '<fieldset><legend>잔금 (있으면)</legend><div class="g2">' + inp('prev', D.prev, { t: '전잔금 (원)', ph: '0', money: 1 }) + inp('paid', D.paid, { t: '입금 (원)', ph: '0', money: 1 }) +
      '</div><p class="hint">비워 두면 명세서 아래 잔금 칸은 빈칸으로 찍힙니다.</p></fieldset>';
    $('#rsForm').innerHTML = h; copyWarn();
  }
  function copyWarn() {
    var w = $('#ivCopy'); if (!w) return;
    var n = filled().length;
    if (D.copies === '2' && n > ROWS2) { w.hidden = false; w.textContent = '품목이 ' + ROWS2 + '줄을 넘어서 한 장에 한 부만 찍습니다.'; } else w.hidden = true;
  }

  // ---------- A4 거래명세서 ----------
  function ymdKo(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일' : '&nbsp; &nbsp; &nbsp; &nbsp;년 &nbsp; &nbsp; 월 &nbsp; &nbsp; 일'; }
  function copyHtml(label, empty, rows) {
    var S = empty ? {} : D.sup, t = empty ? null : totals(), g = function (v) { return empty ? '' : esc(v || ''); };
    var h = '<div class="cp"><div class="ttl">거 래 명 세 서' + (label ? '<small>(' + label + ')</small>' : '') + '</div>';
    h += '<table><colgroup><col style="width:37%"><col style="width:5%"><col style="width:12%"><col style="width:17%"><col style="width:9%"><col style="width:20%"></colgroup>' +
      '<tr><td rowspan="5" class="l" style="vertical-align:top;padding:2mm 2.5mm;line-height:1.75">작성일 : ' + (empty ? ymdKo('') : ymdKo(D.date || today())) +
      '<br>일련번호 : ' + g(D.no) + '<br><span class="cus">' + (empty ? '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;' : g(D.cus)) + '</span> 귀하<br>아래와 같이 계산합니다.</td>' +
      '<th rowspan="5"><span class="vt">공급자</span></th><th>등록번호</th><td colspan="3" class="c big">' + esc(S.reg || '') + '</td></tr>' +
      '<tr><th>상호</th><td class="c">' + esc(S.name || '') + '</td><th>성명</th><td class="c">' + esc(S.ceo || '') + ' <span style="float:right;color:#555">(인)</span></td></tr>' +
      '<tr><th>사업장 주소</th><td colspan="3" class="l">' + esc(S.addr || '') + '</td></tr>' +
      '<tr><th>업태</th><td class="c">' + esc(S.biz || '') + '</td><th>종목</th><td class="c">' + esc(S.item || '') + '</td></tr>' +
      '<tr><th>전화</th><td colspan="3" class="c">' + esc(S.tel || '') + '</td></tr></table>';
    h += '<table><colgroup><col style="width:17%"><col></colgroup><tr><th style="height:8mm">합계금액</th><td class="l big" style="padding-left:3mm">' +
      (t && t.total ? '금 ' + hanMoney(t.total) + '원정 (₩' + money(t.total) + ')' + (D.vat === '면세' ? ' 면세' : ' 부가세 포함') : '금 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 원정 (₩ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )') + '</td></tr></table>';
    var W = [8, 24, 13, 8, 12, 14, 11, 10];
    h += '<table><colgroup>' + W.map(function (w) { return '<col style="width:' + w + '%">'; }).join('') + '</colgroup><tr>' +
      ['월일', '품목', '규격', '수량', '단가', '공급가액', '세액', '비고'].map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>';
    var list = empty ? [] : filled();
    for (var i = 0; i < Math.max(rows, list.length); i++) {
      var it = list[i] || {}, l = list[i] ? line(it) : [0, 0];
      h += '<tr><td class="c">' + esc(it.md || '') + '</td><td class="l">' + esc(it.name || '') + '</td><td class="c">' + esc(it.spec || '') + '</td><td class="r">' + esc(it.qty || '') +
        '</td><td class="r">' + (num(it.price) ? money(num(it.price)) : '') + '</td><td class="r">' + money(l[0]) + '</td><td class="r">' + (list[i] && l[0] ? (l[1] ? money(l[1]) : '0') : '') + '</td><td></td></tr>';
    }
    h += '<tr><th colspan="3">합 계</th><td class="r">' + (t && t.qty ? (Math.round(t.qty * 100) / 100).toLocaleString('ko-KR') : '') + '</td><td></td><td class="r big">' + (t ? money(t.sup) : '') + '</td><td class="r big">' + (t && t.sup ? money(t.tax) || '0' : '') + '</td><td></td></tr></table>';
    var showBal = t && (t.prev || t.paid);
    h += '<table><colgroup><col style="width:10%"><col style="width:15%"><col style="width:10%"><col style="width:15%"><col style="width:10%"><col style="width:15%"><col style="width:10%"><col style="width:15%"></colgroup><tr>' +
      '<th>전잔금</th><td class="r">' + (showBal ? money(t.prev) : '') + '</td><th>입금</th><td class="r">' + (showBal ? money(t.paid) : '') + '</td><th>잔금</th><td class="r big">' + (showBal ? Math.round(t.bal).toLocaleString('ko-KR') : '') +
      '</td><th>인수자</th><td class="r" style="color:#555">(인)</td></tr></table></div>';
    return h;
  }
  function sheetHtml(empty) {
    var two = empty ? D.copies === '2' : copies() === 2;
    if (two) return '<div class="sheet">' + copyHtml('공급자 보관용', empty, ROWS2) + '<div class="cut"></div>' + copyHtml('공급받는자 보관용', empty, ROWS2) + '</div>';
    return '<div class="sheet">' + copyHtml('', empty, ROWS1) + '</div>';
  }

  // ---------- 미리보기·저장·이벤트 ----------
  var MM = 96 / 25.4, PAGE = 297 * MM;
  function render() {
    var box = $('#rsPv'); box.innerHTML = sheetHtml(false);
    var sh = box.firstChild, H = sh.offsetHeight;
    for (var k = 1; k * PAGE < H - 4; k++) { var b = document.createElement('div'); b.className = 'pb'; b.style.top = (k * PAGE) + 'px'; b.innerHTML = '<span>' + (k + 1) + '쪽</span>'; sh.appendChild(b); }
    fit();
  }
  function fit() {
    var box = $('#rsPvBox'), sc = $('#rsPv'); if (!box.offsetWidth) return;
    var s = (box.clientWidth - 24) / (210 * MM); sc.style.transform = 'scale(' + s + ')';
    var sh = sc.firstChild; box.style.height = (sh ? sh.offsetHeight * s : 0) + 24 + 'px';
  }
  var saveT = 0, rT = 0;
  function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(D)); $('#rsSaved').textContent = '사용자의 기기에 자동 저장됨'; } catch (e) {} }
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 400); }
  function changed() { clearTimeout(rT); rT = setTimeout(render, 60); save(); }
  function setPath(p, v) {
    var a = p.split('.'), o = D;
    for (var i = 0; i < a.length - 1; i++) o = o[/^\d+$/.test(a[i]) ? +a[i] : a[i]];
    o[a[a.length - 1]] = v;
  }
  function refreshCalc() {
    D.items.forEach(function (it, i) { var l = line(it), el = $('#sum' + i); if (el) el.textContent = l[0] ? '공급가액 ' + money(l[0]) + '원, 세액 ' + (money(l[1]) || '0') + '원' : ''; });
    var tt = $('#ivTot'); if (tt) tt.innerHTML = totHtml(); copyWarn();
  }
  function printSheet(empty) {
    var p = $('#rsPrint'); if (!p) { p = document.createElement('div'); p.id = 'rsPrint'; document.body.appendChild(p); }
    p.innerHTML = sheetHtml(empty);
    setTimeout(function () { window.print(); }, 60);
  }
  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function docx() {
    var t = totals();
    return window.IVDOCX.build({ D: D, t: t, list: filled(), copies: copies(), rows: copies() === 2 ? ROWS2 : ROWS1, line: line, money: money, han: hanMoney, num: num, today: today() });
  }
  function bind() {
    var f = $('#rsForm');
    f.addEventListener('input', function (e) {
      var t = e.target, p = t.dataset.p; if (!p) return;
      if (t.dataset.money) { var d = t.value.replace(/\D/g, ''), v = d ? Number(d).toLocaleString('ko-KR') : ''; if (v !== t.value) t.value = v; }
      setPath(p, t.value); refreshCalc(); changed();
    });
    f.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.seg) { setPath(t.dataset.seg, t.dataset.v); var y = scrollY; buildForm(); window.scrollTo(0, y); changed(); }
      if (t.dataset.add) { D.items.push({}); $('#ivItems').innerHTML = itemRows(); changed(); var q = $('#ivItems').lastElementChild.querySelectorAll('input')[1]; if (q) q.focus(); }
      if (t.dataset.rm) { D.items.splice(+t.dataset.rm, 1); if (!D.items.length) D.items.push({}); $('#ivItems').innerHTML = itemRows(); refreshCalc(); changed(); }
    });
    $('#rsPrintBtn').addEventListener('click', function () { printSheet(false); });
    $('#rsBlank').addEventListener('click', function () { printSheet(true); });
    $('#rsWord').addEventListener('click', function () { var c = (D.cus || '').trim(); download(docx(), '거래명세서' + (c ? '_' + c : '') + '.docx'); });
    $('#rsReset').addEventListener('click', function () {
      if (!confirm('품목과 공급받는자를 지우고 새 명세서를 쓸까요? 공급자 정보는 남겨 둡니다.')) return;
      D = blank(D.sup); saveNow(); buildForm(); render();
    });
    var root = $('#rs');
    root.querySelectorAll('.mtabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        root.dataset.tab = b.dataset.tab; root.querySelectorAll('.mtabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (b.dataset.tab === 'view') { render(); window.scrollTo({ top: root.getBoundingClientRect().top + scrollY - 10 }); }
      });
    });
    window.addEventListener('resize', fit);
    window.addEventListener('pagehide', saveNow);
    if (window.ResizeObserver) new ResizeObserver(fit).observe($('#rsPvBox'));
  }
  buildForm(); bind(); render();
  try { if (localStorage.getItem(KEY)) $('#rsSaved').textContent = '사용자의 기기에 저장해 둔 내용을 불러왔습니다'; } catch (e) {}
  window.__iv = { D: function () { return D; }, set: function (d) { D = d; buildForm(); render(); }, sheet: sheetHtml, docx: docx, totals: totals };
})();
