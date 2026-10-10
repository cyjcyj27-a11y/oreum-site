/* 이력서 양식 — 입력하면 A4 미리보기가 바로 바뀌고, 인쇄(PDF 저장)와 Word 파일 받기를 한다.
   쓴 내용은 이 기기의 localStorage(resume.draft)에만 남고 서버로 보내지 않는다. */
(function () {
  'use strict';
  var KEY = 'resume.draft';
  var IQ = [
    { q: '성장 과정', ex: '어떤 환경에서 자랐는지보다, 지금의 나를 만든 경험 하나를 골라 적습니다.\n예: 고등학생 때 부모님 식당 일을 도우며 바쁜 점심시간에 주문이 밀리지 않게 순서를 정하는 법을 배웠습니다.' },
    { q: '성격의 장단점', ex: '장점은 일에서 드러난 장면으로, 단점은 고치려고 하는 방법과 같이 적습니다.\n예: 꼼꼼해서 실수가 적지만 시간이 오래 걸려, 요즘은 할 일마다 마감 시간을 먼저 정합니다.' },
    { q: '지원 동기', ex: '이 회사와 이 일을 고른 까닭을 내 경험과 이어서 적습니다.\n예: 아르바이트로 재고 관리를 하며 숫자가 맞아떨어질 때 보람을 느껴 물류 회사에 지원했습니다.' },
    { q: '입사 후 포부', ex: '처음 1년 안에 할 일과 그 뒤에 이루고 싶은 것을 구체적으로 적습니다.\n예: 첫해에는 업무 흐름을 빨리 익혀 혼자 월말 정산을 맡고, 그다음에는 정산 시간을 줄이는 방법을 찾겠습니다.' }];
  function blankIntro() { return { limit: '', both: true, items: IQ.map(function (x) { return { q: x.q, a: '' }; }) }; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // 칸 정의: k 키, t 이름, ph 보기 글, sel 고르기, w 칸 넓이(2·3), per 기간 칸(숫자만 쳐도 2020.03 꼴로)
  var BASIC = [
    { k: 'name', t: '성명', ph: '홍길동' }, { k: 'hanja', t: '한자 이름', ph: '洪吉童' },
    { k: 'en', t: '영문 이름', ph: 'Hong Gildong' }, { k: 'birth', t: '생년월일', ph: '1998.04.03', per: 'd' },
    { k: 'phone', t: '휴대폰', ph: '010-1234-5678', type: 'tel' }, { k: 'email', t: '이메일', ph: 'name@example.com', type: 'email' },
    { k: 'addr', t: '주소', ph: '서울특별시 중구 세종대로 110', w: 3 }, { k: 'apply', t: '지원 분야', ph: '예: 사무 행정, 매장 관리', w: 3 }];
  var SECS = [
    { k: 'edu', t: '학력 사항', cap: '학 력 사 항', min: 4, blank: 4, on: true, cols: [
      { k: 'from', t: '입학', ph: '2014.03', per: 'm' }, { k: 'to', t: '졸업', ph: '2017.02', per: 'm' },
      { k: 'school', t: '학교명', ph: '한국고등학교', w: 2 }, { k: 'major', t: '전공', ph: '경영학' },
      { k: 'st', t: '구분', sel: ['졸업', '졸업 예정', '재학', '휴학', '중퇴', '수료'] }, { k: 'loc', t: '소재지', ph: '서울' }],
      head: ['기간', '학교명', '전공', '구분', '소재지'], wid: [27, 27, 20, 12, 14] },
    { k: 'career', t: '경력 사항', cap: '경 력 사 항', min: 4, blank: 4, on: true, cols: [
      { k: 'from', t: '입사', ph: '2021.07', per: 'm' }, { k: 'to', t: '퇴사', ph: '재직 중이면 비움', per: 'm' },
      { k: 'co', t: '회사명', ph: '오름상사', w: 2 }, { k: 'pos', t: '직위', ph: '사원' }, { k: 'task', t: '담당 업무', ph: '회계, 거래처 관리', w: 3 }],
      head: ['기간', '회사명', '직위', '담당 업무'], wid: [27, 25, 13, 35] },
    { k: 'cert', t: '자격증 및 면허', cap: '자 격 증 및 면 허', min: 3, blank: 3, on: true, cols: [
      { k: 'date', t: '취득일', ph: '2019.11', per: 'm' }, { k: 'name', t: '자격증 이름', ph: '컴퓨터활용능력', w: 2 },
      { k: 'grade', t: '등급', ph: '1급' }, { k: 'org', t: '발행처', ph: '대한상공회의소', w: 2 }],
      head: ['취득일', '자격증 및 면허', '등급', '발행처'], wid: [17, 38, 13, 32] },
    { k: 'lang', t: '어학', cap: '어 학', min: 2, blank: 2, on: true, cols: [
      { k: 'lang', t: '언어', ph: '영어' }, { k: 'test', t: '시험', ph: 'TOEIC' }, { k: 'score', t: '점수, 등급', ph: '850' },
      { k: 'date', t: '취득일', ph: '2022.05', per: 'm' }],
      head: ['언어', '시험', '점수, 등급', '취득일'], wid: [20, 32, 24, 24] },
    { k: 'act', t: '수상 및 대외활동', cap: '수 상 및 대 외 활 동', min: 3, blank: 2, on: false, cols: [
      { k: 'from', t: '시작', ph: '2016.03', per: 'm' }, { k: 'to', t: '끝', ph: '2016.12', per: 'm' },
      { k: 'name', t: '활동, 수상 이름', ph: '교내 경진대회 우수상', w: 2 }, { k: 'org', t: '기관', ph: '한국대학교' }, { k: 'desc', t: '내용', ph: '팀장, 발표 맡음', w: 3 }],
      head: ['기간', '활동, 수상', '기관', '내용'], wid: [27, 29, 17, 27] }];
  var MIL = [{ k: 'kind', t: '구분', sel: ['', '군필', '미필', '면제', '복무 중', '해당 없음'] }, { k: 'branch', t: '군별', sel: ['', '육군', '해군', '공군', '해병대', '의경', '사회복무요원', '기타'] },
    { k: 'rank', t: '계급', ph: '병장' }, { k: 'from', t: '입대', ph: '2018.03', per: 'm' }, { k: 'to', t: '전역', ph: '2019.09', per: 'm' }, { k: 'note', t: '면제 사유', ph: '면제일 때만', w: 3 }];

  function blank() {
    var d = { v: 1, photo: '', src: '', ox: .5, oy: .5, fill: true, mil_on: true, etc_on: false, etc: '', sdate: '', mil: {} };
    BASIC.forEach(function (f) { d[f.k] = ''; });
    SECS.forEach(function (s) { d[s.k] = [{}]; d[s.k + '_on'] = s.on; });
    d.doc = 'resume'; d.intro = blankIntro();
    return d;
  }
  var D;
  try { D = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { D = null; }
  if (!D || D.v !== 1) D = blank();
  if (!D.intro) D.intro = blankIntro();
  if (!D.doc) D.doc = 'resume';

  // ---------- 입력 칸 만들기 ----------
  function field(f, val, path) {
    var w = f.w === 3 ? ' w3' : f.w === 2 ? ' w2' : '';
    var h = '<label class="fl' + w + '"><span>' + f.t + '</span>';
    if (f.sel) {
      h += '<select data-p="' + path + '">' + f.sel.map(function (o) { return '<option' + (o === (val || '') ? ' selected' : '') + ' value="' + o + '">' + (o || '고르기') + '</option>'; }).join('') + '</select>';
    } else {
      h += '<input type="' + (f.type || 'text') + '" data-p="' + path + '"' + (f.per ? ' data-per="' + f.per + '" inputmode="numeric"' : '') + ' placeholder="' + esc(f.ph || '') + '" value="' + esc(val) + '" autocomplete="off">';
    }
    return h + '</label>';
  }
  function rowsHtml(s) {
    return D[s.k].map(function (r, i) {
      return '<div class="row"><div class="g3">' + s.cols.map(function (c) { return field(c, r[c.k], s.k + '.' + i + '.' + c.k); }).join('') + '</div>' +
        (D[s.k].length > 1 ? '<button type="button" class="rm" data-rm="' + s.k + '.' + i + '">빼기</button>' : '') + '</div>';
    }).join('');
  }
  function sec(s) {
    return '<fieldset class="' + (D[s.k + '_on'] ? '' : 'off') + '" data-sec="' + s.k + '"><legend>' + s.t +
      ' <label><input type="checkbox" data-on="' + s.k + '"' + (D[s.k + '_on'] ? ' checked' : '') + '> 넣기</label></legend>' +
      '<div class="rows" id="rows_' + s.k + '">' + rowsHtml(s) + '</div><button type="button" class="add" data-add="' + s.k + '">+ 줄 더하기</button></fieldset>';
  }
  function buildForm() {
    var dt = $('#rsDocs'); if (dt) dt.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.doc === D.doc); });
    if (D.doc === 'intro') { $('#rsForm').innerHTML = introForm(); return; }
    buildResumeForm();
  }
  function buildResumeForm() {
    var h = '<fieldset><legend>인적 사항</legend><div class="photo"><div class="ph" id="rsPh" role="button" tabindex="0" aria-label="증명사진 넣기">증명사진<br>넣기</div>' +
      '<div class="phbtn"><button type="button" id="rsPhPick">사진 고르기</button><button type="button" id="rsPhDel" hidden>사진 빼기</button><small>3x4 비율로 잘라 넣습니다.<br>사진을 끌면 위치가 바뀝니다.</small></div>' +
      '<input type="file" id="rsPhFile" accept="image/*" hidden></div><div class="g2">' + BASIC.map(function (f) { return field(f, D[f.k], f.k); }).join('') + '</div></fieldset>';
    h += sec(SECS[0]) + sec(SECS[1]) + sec(SECS[2]) + sec(SECS[3]);
    h += '<fieldset class="' + (D.mil_on ? '' : 'off') + '" data-sec="mil"><legend>병역 <label><input type="checkbox" data-on="mil"' + (D.mil_on ? ' checked' : '') + '> 넣기</label></legend><div class="g3">' +
      MIL.map(function (f) { return field(f, D.mil[f.k], 'mil.' + f.k); }).join('') + '</div></fieldset>';
    h += sec(SECS[4]);
    h += '<fieldset class="' + (D.etc_on ? '' : 'off') + '" data-sec="etc"><legend>기타 사항 <label><input type="checkbox" data-on="etc"' + (D.etc_on ? ' checked' : '') + '> 넣기</label></legend>' +
      '<textarea data-p="etc" placeholder="특기, 보유 기술, 하고 싶은 말을 짧게 적습니다.">' + esc(D.etc) + '</textarea></fieldset>';
    h += '<fieldset><legend>마무리</legend><div class="g2"><label class="fl"><span>작성일</span><input type="text" data-p="sdate" data-per="d" inputmode="numeric" placeholder="' + today() + '" value="' + esc(D.sdate) + '"></label></div>' +
      '<div class="opt" style="margin-top:10px"><label><input type="checkbox" data-opt="fill"' + (D.fill ? ' checked' : '') + '> 빈 줄 채워서 표 모양 맞추기</label></div>' +
      '<p class="hint">작성일을 비워 두면 오늘 날짜가 들어갑니다. 서명란에는 성명이 들어갑니다.</p></fieldset>';
    $('#rsForm').innerHTML = h; photoUi(); photoDrag();
  }
  function today() { var t = new Date(); return t.getFullYear() + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + ('0' + t.getDate()).slice(-2); }

  // ---------- 자기소개서 ----------
  function cnt(s) { s = String(s || '').replace(/\r/g, ''); return [s.length, s.replace(/\s/g, '').length]; }
  function cntHtml(i) {
    var c = cnt(D.intro.items[i].a), lim = +String(D.intro.limit || '').replace(/\D/g, '') || 0, over = lim && c[0] > lim;
    return '<span' + (over ? ' class="over"' : '') + '>공백 포함 ' + c[0].toLocaleString('ko-KR') + '자, 공백 제외 ' + c[1].toLocaleString('ko-KR') + '자' + (lim ? ' / 제한 ' + lim.toLocaleString('ko-KR') + '자' + (over ? ' (' + (c[0] - lim).toLocaleString('ko-KR') + '자 넘음)' : '') : '') + '</span>';
  }
  function introForm() {
    var I = D.intro, h = '<fieldset><legend>기본</legend><div class="g2">' +
      '<label class="fl"><span>성명</span><input type="text" data-p="name" placeholder="홍길동" value="' + esc(D.name) + '"></label>' +
      '<label class="fl"><span>지원 분야</span><input type="text" data-p="apply" placeholder="예: 사무 행정" value="' + esc(D.apply) + '"></label>' +
      '<label class="fl"><span>문항당 글자 수 제한 (있으면)</span><input type="text" data-p="intro.limit" inputmode="numeric" placeholder="예: 500" value="' + esc(I.limit) + '"></label></div>' +
      '<p class="hint">성명과 지원 분야는 이력서 칸과 같이 바뀝니다.</p></fieldset>';
    h += '<div id="iItems">' + introItems() + '</div><button type="button" class="add" data-iadd="1">+ 문항 더하기</button>';
    h += '<fieldset style="margin-top:14px"><legend>인쇄와 Word</legend><div class="opt"><label><input type="checkbox" data-opt2="both"' + (I.both ? ' checked' : '') + '> 이력서도 같이 넣기 (이력서 다음 장에 자기소개서)</label></div></fieldset>';
    return h;
  }
  function introItems() {
    return D.intro.items.map(function (it, i) {
      var ex = (IQ[i] && it.q === IQ[i].q) ? IQ[i].ex : '문항에 맞게 내 경험을 구체적으로 적습니다.';
      return '<fieldset class="iq"><legend>' + (i + 1) + '번 문항' + (D.intro.items.length > 1 ? ' <button type="button" class="rm2" data-irm="' + i + '">빼기</button>' : '') + '</legend>' +
        '<label class="fl"><span>문항 이름</span><input type="text" data-p="intro.items.' + i + '.q" value="' + esc(it.q) + '" placeholder="예: 성장 과정"></label>' +
        '<label class="fl" style="margin-top:8px"><span>내용</span><textarea class="ia" data-p="intro.items.' + i + '.a" placeholder="' + esc(ex) + '">' + esc(it.a) + '</textarea></label>' +
        '<p class="icnt" id="icnt' + i + '">' + cntHtml(i) + '</p></fieldset>';
    }).join('');
  }
  function introSheet(d, empty) {
    var h = '<div class="sheet isheet"><div class="ttl"><u>자기소개서</u></div><table class="ihead"><colgroup><col style="width:18%"><col><col style="width:18%"><col></colgroup><tr><th>성명</th><td>' +
      esc(empty ? '' : d.name) + '</td><th>지원 분야</th><td>' + esc(empty ? '' : d.apply) + '</td></tr></table>';
    d.intro.items.forEach(function (it, i) {
      h += '<div class="isec"><p class="iqt">' + (i + 1) + '. ' + esc(it.q) + '</p><div class="ibox">' + esc(empty ? '' : it.a) + '</div></div>';
    });
    return h + '</div>';
  }
  function introHas() { return D.intro.items.some(function (it) { return (it.a || '').trim(); }); }

  // ---------- A4 미리보기(인쇄와 같은 것) ----------
  function per(a, b) { a = a || ''; b = b || ''; if (!a && !b) return ''; return a + ' ~ ' + (b || '현재'); }
  function age(b) {
    var m = /^(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(b || ''); if (!m) return '';
    var t = new Date(), y = t.getFullYear() - (+m[1]); if (t.getMonth() + 1 < +m[2] || (t.getMonth() + 1 === +m[2] && t.getDate() < +m[3])) y--;
    return y >= 0 && y < 120 ? ' (만 ' + y + '세)' : '';
  }
  function cell(v, l) { return '<td' + (l ? ' class="l"' : '') + '>' + esc(v) + '</td>'; }
  function table(s, d, empty, cut) {
    var rows = empty ? [] : d[s.k].filter(function (r) { return s.cols.some(function (c) { return (r[c.k] || '').trim(); }); });
    var n = empty ? s.blank : d.fill ? Math.max(s.min - (cut || 0), rows.length, 1) : Math.max(1, rows.length);
    var h = '<table><colgroup>' + s.wid.map(function (w) { return '<col style="width:' + w + '%">'; }).join('') + '</colgroup>' +
      '<thead><tr><th class="cap" colspan="' + s.wid.length + '">' + s.cap + '</th></tr><tr>' + s.head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var i = 0; i < n; i++) {
      var r = rows[i] || {};
      if (s.k === 'edu') h += '<tr>' + cell(r.from && !r.to ? r.from + ' ~' : per(r.from, r.to)) + cell(r.school, 1) + cell(r.major) + cell(r.school || r.from ? r.st || '졸업' : '') + cell(r.loc) + '</tr>';
      else if (s.k === 'career') h += '<tr>' + cell(r.co || r.from ? per(r.from, r.to) : '') + cell(r.co, 1) + cell(r.pos) + cell(r.task, 1) + '</tr>';
      else if (s.k === 'cert') h += '<tr>' + cell(r.date) + cell(r.name, 1) + cell(r.grade) + cell(r.org) + '</tr>';
      else if (s.k === 'lang') h += '<tr>' + cell(r.lang) + cell(r.test) + cell(r.score) + cell(r.date) + '</tr>';
      else h += '<tr>' + cell(per(r.from, r.to)) + cell(r.name, 1) + cell(r.org) + cell(r.desc, 1) + '</tr>';
    }
    return h + '</tbody></table>';
  }
  function sheetHtml(d, empty, cut) {
    var g = function (k) { return empty ? '' : d[k] || ''; };
    var h = '<div class="sheet"><div class="ttl"><u>이력서</u></div>';
    var pic = '<td class="pic" rowspan="5"><div style="' + (!empty && d.photo ? 'background-image:url(' + d.photo + ')' : '') + '">' + (!empty && d.photo ? '' : '사진<br>(3x4)') + '</div></td>';
    h += '<table><colgroup><col style="width:30mm"><col style="width:15%"><col><col style="width:15%"><col></colgroup>' +
      '<tr>' + pic + '<th>성명</th>' + cell(g('name')) + '<th>한자</th>' + cell(g('hanja')) + '</tr>' +
      '<tr><th>영문</th>' + cell(g('en')) + '<th>생년월일</th>' + cell(g('birth') + (empty ? '' : age(d.birth))) + '</tr>' +
      '<tr><th>휴대폰</th>' + cell(g('phone')) + '<th>이메일</th>' + cell(g('email')) + '</tr>' +
      '<tr><th>주소</th><td class="l" colspan="3">' + esc(g('addr')) + '</td></tr>' +
      '<tr><th>지원 분야</th><td class="l" colspan="3">' + esc(g('apply')) + '</td></tr></table>';
    SECS.slice(0, 4).forEach(function (s) { if (d[s.k + '_on'] || empty) h += table(s, d, empty, cut); });
    if (d.mil_on || empty) {
      var m = empty ? {} : d.mil;
      h += '<table><colgroup><col style="width:14%"><col style="width:14%"><col style="width:13%"><col style="width:29%"><col></colgroup><tr><th class="cap" colspan="5">병 역</th></tr>' +
        '<tr><th>구분</th><th>군별</th><th>계급</th><th>복무 기간</th><th>면제 사유</th></tr><tr>' +
        cell(m.kind) + cell(m.branch) + cell(m.rank) + cell(m.from || m.to ? per(m.from, m.to) : '') + cell(m.note) + '</tr></table>';
    }
    if (d.act_on && !empty) h += table(SECS[4], d, false, cut);
    if (d.etc_on || empty) h += '<table><tr><th class="cap">기 타 사 항</th></tr><tr><td class="memo">' + esc(empty ? '' : d.etc) + '</td></tr></table>';
    var sd = empty ? '' : (d.sdate || today()), m2 = /^(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(sd);
    h += '<p class="oath">위의 기재 사항은 사실과 틀림없습니다.</p><p class="date">' +
      (m2 ? m2[1] + '년 ' + (+m2[2]) + '월 ' + (+m2[3]) + '일' : '&nbsp; &nbsp; &nbsp; &nbsp;년 &nbsp; &nbsp; &nbsp;월 &nbsp; &nbsp; &nbsp;일') + '</p>' +
      '<p class="sign">작성자 <b>' + esc(g('name')) + '</b><i>(인)</i></p></div>';
    return h;
  }

  var MM = 96 / 25.4, PAGE = 297 * MM;
  var CUT = 0;   // 넘치면 빈 줄부터 줄여 A4 한 장에 맞춘다(내용 줄은 안 뺀다)
  function calcCut() {   // 이력서를 화면 밖에서 그려 보고 A4 한 장에 맞는 빈 줄 줄이기 값을 찾는다
    var t = document.createElement('div'); t.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden'; document.body.appendChild(t);
    for (var c = 0; ; c++) { t.innerHTML = sheetHtml(D, false, c); if (t.firstChild.offsetHeight <= PAGE + 1 || !D.fill || c >= 3) break; }
    t.remove(); return c;
  }
  function render() {
    var box = $('#rsPv'), sh, H;
    if (D.doc === 'intro') { box.innerHTML = introSheet(D, false); sh = box.firstChild; H = sh.offsetHeight; }
    else for (CUT = 0; ; CUT++) { box.innerHTML = sheetHtml(D, false, CUT); sh = box.firstChild; H = sh.offsetHeight; if (H <= PAGE + 1 || !D.fill || CUT >= 3) break; }
    for (var k = 1; k * PAGE < H - 4; k++) { var b = document.createElement('div'); b.className = 'pb'; b.style.top = (k * PAGE) + 'px'; b.innerHTML = '<span>' + (k + 1) + '쪽</span>'; sh.appendChild(b); }
    fit();
  }
  function fit() {
    var box = $('#rsPvBox'), sc = $('#rsPv'); if (!box.offsetWidth) return;
    var s = (box.clientWidth - 24) / (210 * MM); sc.style.transform = 'scale(' + s + ')';
    var sh = sc.firstChild; box.style.height = (sh ? sh.offsetHeight * s : 0) + 24 + 'px';
  }
  var saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(D)); $('#rsSaved').textContent = '사용자의 기기에 자동 저장됨'; }
      catch (e) { $('#rsSaved').textContent = '저장 공간이 모자라 자동 저장을 못 했습니다. 사진을 빼면 저장됩니다.'; }
    }, 400);
  }
  var rT = 0;
  function changed() { clearTimeout(rT); rT = setTimeout(render, 60); save(); }
  function setPath(p, v) {
    var a = p.split('.'), o = D;
    for (var i = 0; i < a.length - 1; i++) o = o[/^\d+$/.test(a[i]) ? +a[i] : a[i]];
    o[a[a.length - 1]] = v;
  }
  function fmtPer(el) {   // 숫자만 쳐도 2020.03 / 1998.04.03 꼴로
    var raw = el.value, dg = raw.replace(/\D/g, ''); if (!dg || /[^\d.\-\/ ]/.test(raw)) return;
    var max = el.dataset.per === 'd' ? 8 : 6; dg = dg.slice(0, max);
    var out = dg.slice(0, 4); if (dg.length > 4) out += '.' + dg.slice(4, 6); if (dg.length > 6) out += '.' + dg.slice(6, 8);
    if (out !== raw) el.value = out;
  }

  // ---------- 사진: 3x4 로 자르고 끌어서 위치 조정 ----------
  var srcImg = null;
  function photoUi() {
    var ph = $('#rsPh'); ph.classList.toggle('has', !!D.photo); ph.style.backgroundImage = D.photo ? 'url(' + D.photo + ')' : ''; $('#rsPhDel').hidden = !D.photo;
  }
  function crop() {
    if (!srcImg) return;
    var W = 360, H = 480, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var iw = srcImg.naturalWidth, ih = srcImg.naturalHeight, s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(srcImg, (W - dw) * D.ox, (H - dh) * D.oy, dw, dh);
    D.photo = c.toDataURL('image/jpeg', .88); photoUi(); changed();
  }
  function loadSrc(cb) { if (!D.src) return; var im = new Image(); im.onload = function () { srcImg = im; cb && cb(); }; im.src = D.src; }
  function pickFile(f) {
    if (!f || !/^image\//.test(f.type)) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {   // 원본은 긴 변 900px 로 줄여 둔다(다시 자를 때 쓰려고)
        var s = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        D.src = c.toDataURL('image/jpeg', .85); D.ox = .5; D.oy = .5; loadSrc(crop);
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  function photoDrag() {
    var ph = $('#rsPh'), st = null;
    ph.addEventListener('pointerdown', function (e) { if (!D.photo) return; st = { x: e.clientX, y: e.clientY, ox: D.ox, oy: D.oy, moved: false }; ph.setPointerCapture(e.pointerId); });
    ph.addEventListener('pointermove', function (e) {
      if (!st || !srcImg) return; var dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.abs(dx) + Math.abs(dy) > 3) st.moved = true;
      var r = srcImg.naturalWidth / srcImg.naturalHeight, ex = r > .75 ? 84 * (r / .75 - 1) : 0, ey = r < .75 ? 112 * (.75 / r - 1) : 0;
      if (ex) D.ox = Math.min(1, Math.max(0, st.ox - dx / ex)); if (ey) D.oy = Math.min(1, Math.max(0, st.oy - dy / ey)); crop();
    });
    ph.addEventListener('pointerup', function () { if (st && !st.moved) $('#rsPhFile').click(); st = null; });
    ph.addEventListener('click', function () { if (!D.photo) $('#rsPhFile').click(); });
  }

  // ---------- 인쇄(PDF 저장)·Word ----------
  function printSheet(empty) {
    var p = $('#rsPrint'); if (!p) { p = document.createElement('div'); p.id = 'rsPrint'; document.body.appendChild(p); }
    var withR = D.doc !== 'intro' || (D.intro.both && !empty), withI = D.doc === 'intro' || (D.intro.both && !empty && introHas());
    p.innerHTML = (withR ? sheetHtml(D, empty, empty ? 0 : calcCut()) : '') + (withI ? introSheet(D, empty) : '');
    setTimeout(function () { window.print(); }, 60);
  }
  function docKind() { return D.doc === 'intro' ? (D.intro.both ? 'both' : 'intro') : (D.intro.both && introHas() ? 'both' : 'resume'); }
  function fileName(ext) { var n = (D.name || '').trim(), k = docKind(); return (n ? n + '_' : '') + (k === 'both' ? '이력서_자기소개서' : k === 'intro' ? '자기소개서' : '이력서') + '.' + ext; }
  function docxBlob() { return window.RSDOCX.build(D, { secs: SECS, today: today(), age: age, cut: calcCut(), kind: docKind() }); }
  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  // ---------- 이벤트 ----------
  function bind() {
    var f = $('#rsForm');
    f.addEventListener('input', function (e) {
      var t = e.target, p = t.dataset.p; if (!p) return;
      if (t.dataset.per) fmtPer(t);
      setPath(p, t.value); changed();
      var m = /^intro\.items\.(\d+)\.a$/.exec(p); if (m) $('#icnt' + m[1]).innerHTML = cntHtml(+m[1]);
      if (p === 'intro.limit') D.intro.items.forEach(function (x, i) { $('#icnt' + i).innerHTML = cntHtml(i); });
    });
    f.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.p && t.tagName === 'SELECT') { setPath(t.dataset.p, t.value); changed(); }
      if (t.dataset.on) { D[t.dataset.on + '_on'] = t.checked; t.closest('fieldset').classList.toggle('off', !t.checked); changed(); }
      if (t.dataset.opt) { D[t.dataset.opt] = t.checked; changed(); }
      if (t.dataset.opt2) { D.intro[t.dataset.opt2] = t.checked; changed(); }
      if (t.id === 'rsPhFile') { pickFile(t.files[0]); t.value = ''; }
    });
    f.addEventListener('click', function (e) {
      var t = e.target, s;
      if (t.dataset.add) {
        s = t.dataset.add; D[s].push({}); $('#rows_' + s).innerHTML = rowsHtml(SECS.filter(function (x) { return x.k === s; })[0]); changed();
        var inp = $('#rows_' + s).lastElementChild.querySelector('input'); if (inp) inp.focus();
      }
      if (t.dataset.rm) {
        var a = t.dataset.rm.split('.'); D[a[0]].splice(+a[1], 1); $('#rows_' + a[0]).innerHTML = rowsHtml(SECS.filter(function (x) { return x.k === a[0]; })[0]); changed();
      }
      if (t.dataset.iadd) { D.intro.items.push({ q: '', a: '' }); $('#iItems').innerHTML = introItems(); changed(); var q = $('#iItems').lastElementChild.querySelector('input'); if (q) q.focus(); }
      if (t.dataset.irm) { D.intro.items.splice(+t.dataset.irm, 1); $('#iItems').innerHTML = introItems(); changed(); }
      if (t.id === 'rsPhPick') $('#rsPhFile').click();
      if (t.id === 'rsPhDel') { D.photo = ''; D.src = ''; srcImg = null; photoUi(); changed(); }
    });
    $('#rsDocs').addEventListener('click', function (e) { var d = e.target.dataset.doc; if (d && d !== D.doc) { D.doc = d; buildForm(); render(); save(); } });
    $('#rsPrintBtn').addEventListener('click', function () { printSheet(false); });
    $('#rsBlank').addEventListener('click', function () { printSheet(true); });
    $('#rsWord').addEventListener('click', function () {
      if (!window.RSDOCX) return;
      download(docxBlob(), fileName('docx'));
    });
    $('#rsReset').addEventListener('click', function () {
      if (!confirm('지금까지 쓴 내용을 모두 지우고 처음부터 쓸까요?')) return;
      var keepDoc = D.doc; D = blank(); D.doc = keepDoc; srcImg = null; try { localStorage.removeItem(KEY); } catch (e) {} buildForm(); render(); $('#rsSaved').textContent = '';
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
  buildForm(); bind(); loadSrc(); render();
  try { if (localStorage.getItem(KEY)) $('#rsSaved').textContent = '사용자의 기기에 저장해 둔 내용을 불러왔습니다'; } catch (e) {}
  window.__rs = { D: function () { return D; }, set: function (d) { D = d; buildForm(); loadSrc(); render(); }, sheet: sheetHtml, render: render, cut: function () { return CUT; }, docx: docxBlob, intro: introSheet, printHtml: function (empty) { printSheet(empty); return $('#rsPrint').innerHTML; } };
})();
