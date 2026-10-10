/* 계약서 양식 — 정부가 공개한 표준계약서 문구 그대로, 빈칸만 채워 A4 로 인쇄(PDF 저장)하거나 Word 로 받는다.
   첫 종류: 고용노동부 표준근로계약서(기간의 정함이 없는 경우 / 있는 경우). 원문 https://www.moel.go.kr/mainpop2.do
   쓴 내용은 이 기기의 localStorage(contract.draft)에만 남는다. */
(function () {
  'use strict';
  var KEY = 'contract.draft';
  var MINW = { year: 2026, hour: 10320, month: 2156880 };   // 고용노동부 안내 2026년 최저임금
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function blankLabor() {
    return { term: 'none', biz: '', name: '', start: '', end: '', place: '', task: '', t1: '09:00', t2: '18:00', r1: '12:00', r2: '13:00',
      days: '5', rest: '일', payType: '월급', pay: '', bonusOn: false, bonus: '', extraOn: false, extra: [{}, {}, {}, {}], payDay: '10', payBy: '근로자 명의 통장에 입금',
      ins: { emp: true, acc: true, pen: true, hea: true }, sdate: '', bizTel: '', bizAddr: '', ceo: '', empAddr: '', empTel: '' };
  }
  function blankSale() {
    return { addr: '', landType: '', landArea: '', bldStruct: '', bldUse: '', bldArea: '', total: '', down: '', mid: '', midDate: '', bal: '', balDate: '', handDate: '',
      special: '', sdate: '', sAddr: '', sName: '', sTel: '', bAddr: '', bName: '', bTel: '' };
  }
  function blank() { return { v: 1, kind: 'labor', labor: blankLabor(), sale: blankSale() }; }
  var D;
  try { D = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { D = null; }
  if (!D || D.v !== 1) D = blank();
  if (!D.sale) D.sale = blankSale();
  var KINDS = [{ k: 'labor', t: '표준근로계약서', file: '표준근로계약서' }, { k: 'sale', t: '부동산 매매계약서', file: '부동산매매계약서' }];
  function kind() { return KINDS.filter(function (k) { return k.k === D.kind; })[0] || KINDS[0]; }

  // ---------- 입력 칸 ----------
  function inp(path, val, o) {
    o = o || {};
    return '<label class="fl' + (o.w ? ' w' + o.w : '') + '"><span>' + o.t + '</span><input type="' + (o.type || 'text') + '" data-p="' + path + '"' +
      (o.money ? ' data-money="1" inputmode="numeric"' : '') + (o.num ? ' inputmode="numeric"' : '') + ' placeholder="' + esc(o.ph || '') + '" value="' + esc(val) + '" autocomplete="off"></label>';
  }
  function sel(path, val, t, opts) {
    return '<label class="fl"><span>' + t + '</span><select data-p="' + path + '">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label>';
  }
  function seg(path, val, opts) {
    return '<div class="seg2">' + opts.map(function (o) { return '<button type="button" data-seg="' + path + '" data-v="' + o[0] + '" class="' + (o[0] === val ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function chk(path, on, t) { return '<label><input type="checkbox" data-c="' + path + '"' + (on ? ' checked' : '') + '> ' + t + '</label>'; }
  function laborForm(L) {
    var h = '<fieldset><legend>계약 종류</legend>' + seg('labor.term', L.term, [['none', '기간 정함 없음 (정규직)'], ['fixed', '기간 정함 있음 (계약직)']]) +
      '<p class="hint">계약 기간을 정하지 않으면 근로개시일만 적습니다.</p></fieldset>';
    h += '<fieldset><legend>계약 당사자</legend><div class="g2">' + inp('labor.biz', L.biz, { t: '사업주 (회사, 가게 이름)', ph: '오름상사' }) + inp('labor.name', L.name, { t: '근로자 성명', ph: '홍길동' }) + '</div></fieldset>';
    h += '<fieldset><legend>1. ' + (L.term === 'fixed' ? '근로계약기간' : '근로개시일') + '</legend><div class="g2">' + inp('labor.start', L.start, { t: '시작일', type: 'date' }) +
      (L.term === 'fixed' ? inp('labor.end', L.end, { t: '끝나는 날', type: 'date' }) : '') + '</div></fieldset>';
    h += '<fieldset><legend>2. 근무 장소, 3. 업무의 내용</legend><div class="g2">' + inp('labor.place', L.place, { t: '근무 장소', ph: '본사 사무실 (서울 중구)', w: 3 }) +
      inp('labor.task', L.task, { t: '업무의 내용', ph: '사무 보조, 고객 응대', w: 3 }) + '</div></fieldset>';
    h += '<fieldset><legend>4. 소정근로시간</legend><div class="g4">' + inp('labor.t1', L.t1, { t: '시작', type: 'time' }) + inp('labor.t2', L.t2, { t: '끝', type: 'time' }) +
      inp('labor.r1', L.r1, { t: '휴게 시작', type: 'time' }) + inp('labor.r2', L.r2, { t: '휴게 끝', type: 'time' }) + '</div><p class="hint" id="ctHours"></p></fieldset>';
    h += '<fieldset><legend>5. 근무일, 휴일</legend><div class="g2">' + sel('labor.days', L.days, '매주 며칠 근무', ['1', '2', '3', '4', '5', '6']) +
      sel('labor.rest', L.rest, '주휴일 (매주)', ['일', '월', '화', '수', '목', '금', '토']) + '</div></fieldset>';
    return h + laborForm2(L);
  }
  function laborForm2(L) {
    var h = '<fieldset><legend>6. 임금</legend><div class="g2">' + sel('labor.payType', L.payType, '임금 방식', ['월급', '일급', '시급']) + inp('labor.pay', L.pay, { t: '금액 (원)', ph: '2,500,000', money: 1 }) + '</div>' +
      '<p class="warn" id="ctMin" hidden></p>' +
      '<div class="chks" style="margin:12px 0 6px">' + chk('labor.bonusOn', L.bonusOn, '상여금 있음') + '</div>' + (L.bonusOn ? '<div class="g2">' + inp('labor.bonus', L.bonus, { t: '상여금 (원)', ph: '500,000', money: 1 }) + '</div>' : '') +
      '<div class="chks" style="margin:12px 0 6px">' + chk('labor.extraOn', L.extraOn, '기타급여 (수당) 있음') + '</div>' +
      (L.extraOn ? '<div class="g2">' + L.extra.map(function (x, i) { return inp('labor.extra.' + i + '.n', x.n, { t: '수당 이름', ph: ['식대', '자격증 수당', '가족 수당', '교통비'][i] }) + inp('labor.extra.' + i + '.a', x.a, { t: '금액 (원)', ph: '200,000', money: 1 }); }).join('') + '</div>' : '') +
      '<div class="g2" style="margin-top:12px">' + inp('labor.payDay', L.payDay, { t: '임금 지급일 (매월 며칠)', ph: '10', num: 1 }) + sel('labor.payBy', L.payBy, '지급 방법', ['근로자 명의 통장에 입금', '근로자에게 직접 지급']) + '</div></fieldset>';
    h += '<fieldset><legend>7. 연차유급휴가</legend><p class="hint" style="margin-top:0">근로기준법에서 정하는 바에 따라 부여한다는 문구가 그대로 들어갑니다. 1년간 80% 이상 출근하면 15일, 1년이 안 됐으면 1개월 개근마다 1일입니다.</p></fieldset>';
    h += '<fieldset><legend>8. 사회보험</legend><div class="chks">' + chk('labor.ins.emp', L.ins.emp, '고용보험') + chk('labor.ins.acc', L.ins.acc, '산재보험') + chk('labor.ins.pen', L.ins.pen, '국민연금') + chk('labor.ins.hea', L.ins.hea, '건강보험') + '</div></fieldset>';
    h += '<fieldset><legend>계약일, 서명란</legend><div class="g2">' + inp('labor.sdate', L.sdate, { t: '계약일', type: 'date' }) + '<span></span>' +
      inp('labor.ceo', L.ceo, { t: '대표자', ph: '김대표' }) + inp('labor.bizTel', L.bizTel, { t: '사업주 전화', ph: '02-123-4567', type: 'tel' }) + inp('labor.bizAddr', L.bizAddr, { t: '사업주 주소', ph: '서울특별시 중구 세종대로 110', w: 3 }) +
      inp('labor.empTel', L.empTel, { t: '근로자 연락처', ph: '010-1234-5678', type: 'tel' }) + '<span></span>' + inp('labor.empAddr', L.empAddr, { t: '근로자 주소', ph: '서울특별시 마포구 월드컵북로 400', w: 3 }) +
      '</div><p class="hint">계약일을 비워 두면 오늘 날짜가 들어갑니다. 서명은 인쇄한 뒤 손으로 합니다.</p></fieldset>';
    return h;
  }
  // ---------- 부동산 매매계약서(법제처 생활법령 「매매계약서 작성요령」에 적힌 항목만) ----------
  function saleForm(S) {
    var h = '<p class="hint" style="margin:0 2px 12px">부동산 매매계약서는 법으로 정한 양식이 없습니다. 법제처 생활법령의 매매계약서 작성요령에 적힌 항목으로 만들었고, 중요한 거래는 공인중개사나 법무사에게 확인받으세요.</p>' +
      '<fieldset><legend>1. 부동산의 표시</legend><div class="g2">' + inp('sale.addr', S.addr, { t: '소재지', ph: '서울특별시 마포구 월드컵북로 400, 101동 1001호', w: 3 }) +
      inp('sale.landType', S.landType, { t: '토지 지목', ph: '대' }) + inp('sale.landArea', S.landArea, { t: '토지 면적 (㎡)', ph: '84.5', num: 1 }) +
      inp('sale.bldStruct', S.bldStruct, { t: '건물 구조', ph: '철근콘크리트조' }) + inp('sale.bldUse', S.bldUse, { t: '건물 용도', ph: '아파트' }) +
      inp('sale.bldArea', S.bldArea, { t: '건물 면적 (㎡)', ph: '84.97', num: 1 }) + '</div><p class="hint">부동산등기부 표제부의 표시란에 적힌 것과 똑같이 적습니다.</p></fieldset>';
    h += '<fieldset><legend>2. 매매대금</legend><div class="g2">' + inp('sale.total', S.total, { t: '매매대금 총액 (원)', ph: '500,000,000', money: 1, w: 3 }) +
      inp('sale.down', S.down, { t: '계약금 (원)', ph: '50,000,000', money: 1 }) + '<span></span>' +
      inp('sale.mid', S.mid, { t: '중도금 (원)', ph: '150,000,000', money: 1 }) + inp('sale.midDate', S.midDate, { t: '중도금 지급일', type: 'date' }) +
      inp('sale.bal', S.bal, { t: '잔금 (원)', ph: '300,000,000', money: 1 }) + inp('sale.balDate', S.balDate, { t: '잔금 지급일', type: 'date' }) +
      '</div><p class="warn" id="ctSum" hidden></p><p class="hint">중도금이 없으면 비워 둡니다. 금액은 한글로도 같이 찍힙니다.</p></fieldset>';
    h += '<fieldset><legend>3. 소유권 이전과 인도</legend><div class="g2">' + inp('sale.handDate', S.handDate, { t: '부동산 인도일', type: 'date' }) +
      '</div><p class="hint">매도인은 잔금을 받으면서 소유권이전등기에 필요한 서류를 모두 넘겨준다는 문구가 들어갑니다.</p></fieldset>';
    h += '<fieldset><legend>4. 계약의 해제</legend><p class="hint" style="margin-top:0">계약금만 주고받은 동안에는 매수인은 계약금을 포기하고, 매도인은 계약금의 2배를 돌려주고 해제할 수 있다는 문구가 들어갑니다.</p></fieldset>';
    h += '<fieldset><legend>5. 특약사항</legend><textarea data-p="sale.special" placeholder="두 사람이 따로 정한 것을 구체적이고 자세하게 적습니다.">' + esc(S.special) + '</textarea></fieldset>';
    h += '<fieldset><legend>계약일, 서명란</legend><div class="g2">' + inp('sale.sdate', S.sdate, { t: '계약일', type: 'date' }) + '<span></span>' +
      inp('sale.sName', S.sName, { t: '매도인 성명', ph: '김매도' }) + inp('sale.sTel', S.sTel, { t: '매도인 연락처', ph: '010-1111-2222', type: 'tel' }) + inp('sale.sAddr', S.sAddr, { t: '매도인 주소', ph: '서울특별시 중구 세종대로 110', w: 3 }) +
      inp('sale.bName', S.bName, { t: '매수인 성명', ph: '이매수' }) + inp('sale.bTel', S.bTel, { t: '매수인 연락처', ph: '010-3333-4444', type: 'tel' }) + inp('sale.bAddr', S.bAddr, { t: '매수인 주소', ph: '서울특별시 종로구 사직로 161', w: 3 }) +
      '</div><p class="hint">주민등록번호 칸은 비워서 찍히니 인쇄한 뒤 손으로 적습니다. 매도인은 원칙적으로 등기부상 소유자이고, 신분증으로 본인인지 꼭 확인합니다.</p></fieldset>';
    return h;
  }
  function hanMoney(n) {   // 120000000 → 일억이천만
    n = Math.floor(+n || 0); if (!n) return '';
    var D1 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], U1 = ['', '십', '백', '천'], U4 = ['', '만', '억', '조', '경'], out = '', g = 0;
    while (n > 0) {
      var part = n % 10000, t = '';
      for (var i = 0; i < 4; i++) { var d = Math.floor(part / Math.pow(10, i)) % 10; if (d) t = D1[d] + U1[i] + t; }
      if (t) out = t + U4[g] + out; n = Math.floor(n / 10000); g++;
    }
    return out;
  }
  function won(s) { var d = String(s || '').replace(/\D/g, ''); return d ? '금 ' + hanMoney(d) + '원정 (₩' + Number(d).toLocaleString('ko-KR') + ')' : ''; }
  function saleParts(S, empty) {
    var g = function (k) { return empty ? '' : S[k]; }, md = ymd(g('midDate')), bd = ymd(g('balDate')), hd = ymd(g('handDate')), P = [];
    P.push(['lead', ['매도인과 매수인은 다음과 같은 내용으로 매매계약을 체결한다.']]);
    P.push(['it', ['1. 부동산의 표시']]);
    P.push(['sub', ['- 소 재 지 : ', { v: g('addr'), c: 'w' }]]);
    P.push(['sub', ['- 토 지 : 지목 ', { v: g('landType') }, ' 면적 ', { v: g('landArea') }, '㎡']]);
    P.push(['sub', ['- 건 물 : 구조 ', { v: g('bldStruct') }, ' 용도 ', { v: g('bldUse') }, ' 면적 ', { v: g('bldArea') }, '㎡']]);
    P.push(['it', ['2. 매매대금']]);
    P.push(['sub', ['- 매매대금 : ', { v: won(g('total')), c: 'w' }]]);
    P.push(['sub', ['- 계 약 금 : ', { v: won(g('down')), c: 'w' }, '은 계약 시에 지급하고 영수함']]);
    P.push(['sub', ['- 중 도 금 : ', { v: won(g('mid')), c: 'w' }, '은 ', { v: md[0] }, '년 ', { v: md[1], c: 'n' }, '월 ', { v: md[2], c: 'n' }, '일에 지급함']]);
    P.push(['sub', ['- 잔 금 : ', { v: won(g('bal')), c: 'w' }, '은 ', { v: bd[0] }, '년 ', { v: bd[1], c: 'n' }, '월 ', { v: bd[2], c: 'n' }, '일에 지급함']]);
    P.push(['it', ['3. 소유권 이전과 인도']]);
    P.push(['sub', ['- 매도인은 매수인으로부터 매매대금의 잔금을 받음과 동시에 소유권이전등기에 필요한 서류 전부를 매수인에게 주고, 위 부동산을 ', { v: hd[0] }, '년 ', { v: hd[1], c: 'n' }, '월 ', { v: hd[2], c: 'n' }, '일에 인도한다.']]);
    P.push(['it', ['4. 계약의 해제']]);
    P.push(['sub', ['- 계약금만 주고받은 동안에는 매수인은 계약금을 포기하고, 매도인은 계약금의 2배를 매수인에게 돌려주고 이 계약을 해제할 수 있다.']]);
    P.push(['it', ['5. 특약사항']]);
    P.push(['memo', g('special') || '']);
    P.push(['lead2', ['이 계약을 증명하기 위하여 계약서를 당사자 수만큼 작성하여 서명날인하고 각각 1통씩 보관한다.']]);
    var sd = ymd(empty ? '' : (S.sdate || today()));
    P.push(['date', [{ v: sd[0] }, '년 ', { v: sd[1], c: 'n' }, '월 ', { v: sd[2], c: 'n' }, '일']]);
    P.push(['party', '(매도인)', [['주 소', g('sAddr'), ''], ['주민등록번호', '', ''], ['성 명', g('sName'), '(서명 또는 인)'], ['연 락 처', g('sTel'), '']]]);
    P.push(['party', '(매수인)', [['주 소', g('bAddr'), ''], ['주민등록번호', '', ''], ['성 명', g('bName'), '(서명 또는 인)'], ['연 락 처', g('bTel'), '']]]);
    return P;
  }
  function saleHints() {
    var S = D.sale, n = function (k) { return +String(S[k] || '').replace(/\D/g, '') || 0; }, w = $('#ctSum'); if (!w) return;
    var t = n('total'), sum = n('down') + n('mid') + n('bal');
    if (t && sum && t !== sum) { w.hidden = false; w.textContent = '계약금, 중도금, 잔금을 더하면 ' + sum.toLocaleString('ko-KR') + '원으로, 총액 ' + t.toLocaleString('ko-KR') + '원보다 ' + Math.abs(t - sum).toLocaleString('ko-KR') + '원 ' + (sum < t ? '적습니다.' : '많습니다.'); }
    else w.hidden = true;
  }
  function buildForm() {
    $('#ctKinds').innerHTML = KINDS.map(function (k) { return '<button type="button" data-kind="' + k.k + '" class="' + (D.kind === k.k ? 'on' : '') + '">' + k.t + '</button>'; }).join('');
    $('#rsForm').innerHTML = D.kind === 'sale' ? saleForm(D.sale) : laborForm(D.labor); hints();
  }

  // ---------- 계약서 한 장(고용노동부 표준근로계약서 문구 그대로) ----------
  function u(v, c) { return '<u' + (c ? ' class="' + c + '"' : '') + '>' + (v === '' || v == null ? '&nbsp;' : esc(v)) + '</u>'; }
  function ymd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? [m[1], String(+m[2]), String(+m[3])] : ['', '', '']; }
  function hm(s) { var m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? [String(+m[1]), m[2]] : ['', '']; }
  function money(s) { var d = String(s || '').replace(/\D/g, ''); return d ? Number(d).toLocaleString('ko-KR') : ''; }
  function ck(on) { return '( <span class="ck">' + (on ? '√' : '&nbsp;') + '</span> )'; }
  function today() { var t = new Date(); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  function laborParts(L, empty) {   // 화면(HTML)과 Word 가 같은 문장을 쓰도록 조각으로 만든다: [종류, [글 또는 {v,c}] ...]
    var g = function (k) { return empty ? '' : L[k]; };
    var s = ymd(g('start')), e = ymd(g('end')), t1 = hm(g('t1')), t2 = hm(g('t2')), r1 = hm(g('r1')), r2 = hm(g('r2'));
    var fixed = L.term === 'fixed', ex = (L.extra || []).filter(function (x) { return (x.n || '').trim() || (x.a || '').trim(); });
    var P = [];
    P.push(['lead', [{ v: g('biz'), c: 'w' }, '(이하 “사업주”라 함)과(와) ', { v: g('name'), c: 'w' }, ' (이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.']]);
    if (fixed) P.push(['it', ['1. 근로계약기간 : ', { v: s[0] }, '년 ', { v: s[1], c: 'n' }, '월 ', { v: s[2], c: 'n' }, '일부터 ', { v: e[0] }, '년 ', { v: e[1], c: 'n' }, '월 ', { v: e[2], c: 'n' }, '일까지']]);
    else P.push(['it', ['1. 근로개시일 : ', { v: s[0] }, '년 ', { v: s[1], c: 'n' }, '월 ', { v: s[2], c: 'n' }, '일부터']]);
    P.push(['it', ['2. 근 무 장 소 : ', { v: g('place'), c: 'w' }]]);
    P.push(['it', ['3. 업무의 내용 : ', { v: g('task'), c: 'w' }]]);
    P.push(['it', ['4. 소정근로시간 : ', { v: t1[0], c: 'n' }, '시 ', { v: t1[1], c: 'n' }, '분부터 ', { v: t2[0], c: 'n' }, '시 ', { v: t2[1], c: 'n' }, '분까지 (휴게시간 : ', { v: r1[0], c: 'n' }, '시 ', { v: r1[1], c: 'n' }, '분~ ', { v: r2[0], c: 'n' }, '시 ', { v: r2[1], c: 'n' }, '분)']]);
    P.push(['it', ['5. 근무일/휴일 : 매주 ', { v: g('days'), c: 'n' }, '일(또는 매일단위)근무, 주휴일 매주 ', { v: g('rest'), c: 'n' }, '요일']]);
    P.push(['it', ['6. 임 금']]);
    P.push(['sub', ['- 월(일, 시간)급 : ', { v: empty ? '' : (L.pay ? L.payType + ' ' + money(L.pay) : ''), c: 'w' }, ' 원']]);
    P.push(['sub', ['- 상여금 : 있음 ', { ck: !empty && L.bonusOn }, ' ', { v: !empty && L.bonusOn ? money(L.bonus) : '', c: 'w' }, ' 원, 없음 ', { ck: !empty && !L.bonusOn }]]);
    P.push(['sub', ['- 기타급여(제수당 등) : 있음 ', { ck: !empty && L.extraOn && ex.length }, ', 없음 ', { ck: !empty && !(L.extraOn && ex.length) }]]);
    var items = !empty && L.extraOn ? ex.map(function (x) { return ((x.n || '') + ' ' + money(x.a)).trim(); }) : [];
    while (items.length < 4) items.push('');
    for (var i = 0; i < items.length; i += 2) P.push(['sub2', [{ v: items[i], c: 'w' }, '원, ', { v: items[i + 1] || '', c: 'w' }, '원']]);
    P.push(['sub', ['- 임금지급일 : 매월(매주 또는 매일) ', { v: g('payDay'), c: 'n' }, '일(휴일의 경우는 전일 지급)']]);
    P.push(['sub', ['- 지급방법 : 근로자에게 직접지급', { ck: !empty && L.payBy === '근로자에게 직접 지급' }, ', 근로자 명의 예금통장에 입금', { ck: !empty && L.payBy !== '근로자에게 직접 지급' }]]);
    P.push(['it', ['7. 연차유급휴가']]);
    P.push(['sub', ['- 연차유급휴가는 근로기준법에서 정하는 바에 따라 부여함']]);
    P.push(['it', ['8. 사회보험 적용여부(해당란에 체크)']]);
    P.push(['sub', [{ bx: !empty && L.ins.emp }, '고용보험 ', { bx: !empty && L.ins.acc }, '산재보험 ', { bx: !empty && L.ins.pen }, '국민연금 ', { bx: !empty && L.ins.hea }, '건강보험']]);
    P.push(['it', ['9. 근로계약서 교부']]);
    P.push(['sub', ['- 사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자의 교부요구와 관계없이 근로자에게 교부함(근로기준법 제17조 이행)']]);
    P.push(['it', ['10. 근로계약, 취업규칙 등의 성실한 이행의무']]);
    P.push(['sub', ['- 사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 함']]);
    P.push(['it', ['11. 기 타']]);
    P.push(['sub', ['- 이 계약에 정함이 없는 사항은 근로기준법령에 의함']]);
    var sd = ymd(empty ? '' : (L.sdate || today()));
    P.push(['date', [{ v: sd[0] }, '년 ', { v: sd[1], c: 'n' }, '월 ', { v: sd[2], c: 'n' }, '일']]);
    P.push(['party', '(사업주)', [['사업체명', g('biz'), '(전화 : ' + (g('bizTel') || '          ') + ')'], ['주 소', g('bizAddr'), ''], ['대 표 자', g('ceo'), '(서명)']]]);
    P.push(['party', '(근로자)', [['주 소', g('empAddr'), ''], ['연 락 처', g('empTel'), ''], ['성 명', g('name'), '(서명)']]]);
    return P;
  }
  function runsHtml(a) {
    return a.map(function (x) {
      if (typeof x === 'string') return esc(x);
      if ('ck' in x) return ck(x.ck);
      if ('bx' in x) return '<span class="bx">' + (x.bx ? '✓' : '') + '</span>';
      return u(x.v, x.c);
    }).join('');
  }
  function sheetHtml(d, empty) {
    var h = '<div class="sheet"><div class="ttl">' + kind().t + '</div>';
    parts(d, empty).forEach(function (p) {
      if (p[0] === 'party') {
        h += '<div class="party"><span class="who" style="grid-row:span ' + p[2].length + '">' + p[1] + '</span>' + p[2].map(function (r) { return '<span class="ln"><b>' + r[0] + ' :</b><span class="v">' + esc(r[1]) + '</span><i>' + esc(r[2]) + '</i></span>'; }).join('') + '</div>';
      } else if (p[0] === 'memo') { h += '<div class="memo">' + esc(p[1]) + '</div>';
      } else h += '<p class="' + p[0] + '">' + runsHtml(p[1]) + '</p>';
    });
    return h + '</div>';
  }

  // ---------- 알림: 근로시간·최저임금(계약서에는 안 찍힘) ----------
  function mins(s) { var m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function hints() {
    if (D.kind === 'sale') return saleHints();
    var L = D.labor, a = mins(L.t1), b = mins(L.t2), r1 = mins(L.r1), r2 = mins(L.r2), el = $('#ctHours'), w = $('#ctMin');
    var work = null, br = 0;
    if (a != null && b != null) { work = b - a; if (work <= 0) work += 1440; if (r1 != null && r2 != null) { br = r2 - r1; if (br < 0) br += 1440; } work -= br; }
    var days = +L.days || 0, txt = '';
    if (work != null && work > 0) {
      var wk = work * days / 60;
      txt = '하루 ' + fmtH(work / 60) + ' 일하고 휴게 ' + br + '분, 일주일에 ' + fmtH(wk) + '입니다.';
      if (work >= 480 && br < 60) txt += ' 8시간을 일하면 휴게시간을 1시간 이상 줘야 합니다.';
      else if (work >= 240 && br < 30) txt += ' 4시간을 일하면 휴게시간을 30분 이상 줘야 합니다.';
      if (wk > 40) txt += ' 법정근로시간(주 40시간)을 넘습니다.';
    }
    if (el) el.textContent = txt;
    if (!w) return;
    var pay = +String(L.pay || '').replace(/\D/g, ''), hour = 0;
    if (pay && work > 0) {
      var dh = work / 60, wk2 = dh * days, holi = wk2 >= 15 ? wk2 / Math.max(1, days) : 0;
      if (L.payType === '시급') hour = pay;
      else if (L.payType === '일급') hour = pay / dh;
      else hour = pay / ((wk2 + holi) * 365 / 7 / 12);
    }
    if (hour && hour < MINW.hour) { w.hidden = false; w.textContent = MINW.year + '년 최저임금(시간급 ' + MINW.hour.toLocaleString('ko-KR') + '원)보다 적습니다. 시급으로 치면 약 ' + Math.round(hour).toLocaleString('ko-KR') + '원입니다.'; }
    else w.hidden = true;
  }
  function fmtH(h) { var H = Math.floor(h + 1e-9), M = Math.round((h - H) * 60); return H + '시간' + (M ? ' ' + M + '분' : ''); }

  // ---------- 미리보기·저장 ----------
  var MM = 96 / 25.4, PAGE = 297 * MM;
  function render() {
    var box = $('#rsPv'); box.innerHTML = sheetHtml(D, false);
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
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(D)); $('#rsSaved').textContent = '사용자의 기기에 자동 저장됨'; } catch (e) {} }, 400);
  }
  function changed() { clearTimeout(rT); rT = setTimeout(function () { render(); hints(); }, 60); save(); }
  function setPath(p, v) {
    var a = p.split('.'), o = D;
    for (var i = 0; i < a.length - 1; i++) o = o[/^\d+$/.test(a[i]) ? +a[i] : a[i]];
    o[a[a.length - 1]] = v;
  }
  function getPath(p) { return p.split('.').reduce(function (o, k) { return o == null ? o : o[/^\d+$/.test(k) ? +k : k]; }, D); }

  // ---------- 인쇄·Word·이벤트 ----------
  function printSheet(empty) {
    var p = $('#rsPrint'); if (!p) { p = document.createElement('div'); p.id = 'rsPrint'; document.body.appendChild(p); }
    p.innerHTML = sheetHtml(D, empty);
    setTimeout(function () { window.print(); }, 60);
  }
  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function parts(d, empty) { return d.kind === 'sale' ? saleParts(d.sale, empty) : laborParts(d.labor, empty); }
  function docx() { return window.CTDOCX.build(kind().t, parts(D, false)); }
  function bind() {
    var f = $('#rsForm');
    f.addEventListener('input', function (e) {
      var t = e.target, p = t.dataset.p; if (!p) return;
      if (t.dataset.money) { var d = t.value.replace(/\D/g, ''), v = d ? Number(d).toLocaleString('ko-KR') : ''; if (v !== t.value) t.value = v; }
      setPath(p, t.value); changed();
    });
    f.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.p && t.tagName === 'SELECT') { setPath(t.dataset.p, t.value); changed(); }
      if (t.dataset.c) {
        setPath(t.dataset.c, t.checked);
        if (/On$/.test(t.dataset.c)) { var y = scrollY; buildForm(); window.scrollTo(0, y); }
        changed();
      }
    });
    f.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.seg) { setPath(t.dataset.seg, t.dataset.v); var y = scrollY; buildForm(); window.scrollTo(0, y); changed(); }
    });
    $('#ctKinds').addEventListener('click', function (e) { var k = e.target.dataset.kind; if (k && k !== D.kind) { D.kind = k; buildForm(); changed(); } });
    $('#rsPrintBtn').addEventListener('click', function () { printSheet(false); });
    $('#rsBlank').addEventListener('click', function () { printSheet(true); });
    $('#rsWord').addEventListener('click', function () { var n = ((D.kind === 'sale' ? D.sale.bName : D.labor.name) || '').trim(); download(docx(), (n ? n + '_' : '') + kind().file + '.docx'); });
    $('#rsReset').addEventListener('click', function () {
      if (!confirm('지금까지 쓴 내용을 모두 지우고 처음부터 쓸까요?')) return;
      D = blank(); try { localStorage.removeItem(KEY); } catch (e) {} buildForm(); render(); $('#rsSaved').textContent = '';
    });
    var root = $('#rs');
    root.querySelectorAll('.mtabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        root.dataset.tab = b.dataset.tab; root.querySelectorAll('.mtabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (b.dataset.tab === 'view') { render(); window.scrollTo({ top: root.getBoundingClientRect().top + scrollY - 10 }); }
      });
    });
    window.addEventListener('resize', fit);
    window.addEventListener('pagehide', function () { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} });
    if (window.ResizeObserver) new ResizeObserver(fit).observe($('#rsPvBox'));
  }
  buildForm(); bind(); render();
  try { if (localStorage.getItem(KEY)) $('#rsSaved').textContent = '사용자의 기기에 저장해 둔 내용을 불러왔습니다'; } catch (e) {}
  window.__ct = { D: function () { return D; }, set: function (d) { D = d; buildForm(); render(); }, sheet: sheetHtml, docx: docx, get: getPath };
})();
