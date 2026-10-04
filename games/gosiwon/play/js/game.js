// 고시원 총무 — 규칙, 이동, 입력, 화면 글, 저장
(function () {
'use strict';
var T = THREE, W = GS.world, CH = GS.chores, PI = Math.PI, $ = function (id) { return document.getElementById(id); };
var KEY = 'gosiwon.save', HS = 60, DAYS = 30, PASSLINE = 80, STUDY = 1200, WAGE = 15000, EYE = 1.55, DAYMIN = 960;
var EN = /[?&]lang=en/.test(location.search), L = function (ko, en) { return EN ? en : ko; };
if (EN) { document.body.classList.add('en'); document.documentElement.lang = 'en'; document.title = 'Gosiwon Manager'; }
var G = GS.G = { mode: 'title', day: 1, t: 0, pass: 50, coin: 0, items: {}, gloves: false, carry: null, tasks: [], neglect: {}, stock: 8, study: null, last: null, riceAt: 0, P: { x: 3.9, y: 0, z: -1.35, yaw: -2.29, pitch: 0 } };
var ITEMS = [
  { id: 'brush', n: L('철수세미', 'Steel Wool'), e: L('닦는 넓이 +40%', 'Scrub size +40%'), p: 30000 },
  { id: 'bleach', n: L('락스', 'Bleach'), e: L('닦는 힘 +55%', 'Scrub power +55%'), p: 40000 },
  { id: 'shoes', n: L('운동화', 'Sneakers'), e: L('이동 +20%', 'Speed +20%'), p: 35000 },
  { id: 'scoop', n: L('큰 바가지', 'Big Scoop'), e: L('쌀과 물 x1.8', 'Rice & water x1.8'), p: 20000 },
  { id: 'knife', n: L('식칼', 'Knife'), e: L('칼질 -1', 'Cuts -1'), p: 25000 },
  { id: 'pen', n: L('형광펜', 'Highlighter'), e: L('한 장 1.5시간', '1.5h a page'), p: 15000 },
  { id: 'lamp', n: L('스탠드', 'Desk Lamp'), e: L('공부 +5%', 'Study +5%'), p: 30000, s: 0.05 },
  { id: 'plug', n: L('귀마개', 'Earplugs'), e: L('공부 +5%', 'Study +5%'), p: 20000, s: 0.05 },
  { id: 'cushion', n: L('방석', 'Cushion'), e: L('공부 +5%', 'Study +5%'), p: 25000, s: 0.05 },
  { id: 'coffee', n: L('믹스커피', 'Instant Coffee'), e: L('공부 +5%', 'Study +5%'), p: 20000, s: 0.05 },
  { id: 'book', n: L('기출문제집', 'Past Papers'), e: L('공부 +10%', 'Study +10%'), p: 50000, s: 0.1 }
];
function studyMult() { var m = 1 + (GS.ev ? GS.ev.bonus() : 0); ITEMS.forEach(function (it) { if (it.s && G.items[it.id]) m += it.s; }); return m; }
function makeTasks(d) {
  var a = [{ id: 'rice', type: 'rice' }], nf = d >= 15 ? 4 : d >= 9 ? 3 : d >= 4 ? 2 : 1, k;
  for (k = 0; k < nf; k++) { a.push({ id: 't' + k + 'm', type: 'toilet', k: k, g: 'm' }); a.push({ id: 't' + k + 'w', type: 'toilet', k: k, g: 'w' }); }
  if (d >= 2) a.push({ id: 'kitchen', type: 'kitchen' });
  if (d % 3 === 0) a.push({ id: 'ramen', type: 'ramen' });
  if (d % 7 === 5) a.push({ id: 'kimchi', type: 'kimchi' });
  return a;
}
function taskName(t) {
  if (t.type === 'toilet') return (t.k + 2) + 'F ' + (t.g === 'm' ? L('남자 화장실', "Men's") : L('여자 화장실', "Women's"));
  return { rice: L('밥', 'Rice'), kitchen: L('주방', 'Kitchen'), ramen: L('라면', 'Ramen'), kimchi: L('김치', 'Kimchi') }[t.type];
}
function left() { var n = 0; G.tasks.forEach(function (t) { if (!t.done) n++; }); return n; }

// ---------- 저장 ----------
function save() {
  if (G.mode !== 'day' && G.mode !== 'study') return;
  var s = { v: 1, mode: G.mode, day: G.day, t: G.t, pass: G.pass, coin: G.coin, items: G.items, neglect: G.neglect, stock: G.stock, rolls: G.rolls || 0, bookK: G.bookK || 0, gloves: G.gloves, study: G.study, last: G.last, riceAt: G.riceAt, insp: G.insp, ev: G.ev, done: G.tasks.filter(function (t) { return t.done; }).map(function (t) { return t.id; }) };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}
function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }
GS.save = save; GS.left = function () { return left(); };

// ---------- 화면 글 ----------
var ui = GS.ui = {};
function clockStr(t) {
  var m = Math.floor(Math.min(DAYMIN, t)), h = 8 + Math.floor(m / 60), mm = m % 60, pm = h >= 12 && h < 24, h12 = h % 12 || 12, s = h12 + ':' + (mm < 10 ? '0' : '') + mm;
  return EN ? s + (pm ? ' PM' : ' AM') : (pm ? '오후 ' : '오전 ') + s;
}
function fmt1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
function predict() { var h = Math.max(0, (DAYMIN - G.t) / 60) * studyMult(); return { h: h, d: Math.round((1 + (h - 8)) * 10) / 10 }; }
ui.hud = function () {
  $('vDay').textContent = 'DAY ' + G.day; $('vTask').textContent = left(); $('vFloor').textContent = (Math.round(G.P.y / GS.FH) + 2) + 'F'; $('vRoll').textContent = G.rolls || 0;
  var pr = G.mode === 'study' && G.study ? { h: G.study.h, d: G.study.d } : predict();
  if (G.mode === 'study' && G.study) {
    var rem = Math.max(0, studyRem()), mm = Math.floor(rem / 60), ss = Math.floor(rem % 60), f = 1 - rem / STUDY;
    $('vStudy').textContent = fmt1(G.study.h * f) + 'h'; $('vClock').textContent = clockStr(G.study.at + (DAYMIN - G.study.at) * f);
    $('suTime').textContent = mm + ':' + (ss < 10 ? '0' : '') + ss; $('suFill').style.width = (f * 100).toFixed(1) + '%'; $('suH').textContent = fmt1(G.study.h * f) + ' / ' + fmt1(G.study.h) + 'h';
  } else { $('vStudy').textContent = fmt1(pr.h) + 'h'; $('vClock').textContent = clockStr(G.t); }
  $('sClock').style.color = G.mode === 'day' && G.t > 420 ? '#d3121a' : '';
  $('vPass').textContent = Math.round(G.pass) + '%';
  var dl = $('vDelta'); dl.textContent = (pr.d > 0 ? '+' : '') + fmt1(pr.d); dl.className = pr.d > 0 ? 'up' : pr.d < 0 ? 'dn' : '';
};
ui.tasks = function () {
  var h = ''; if (G.mode !== 'day') { $('tasks').innerHTML = ''; return; }
  if (!G.gloves && left()) h += '<div id="rowGlove"><span>' + L('고무장갑', 'Rubber gloves') + '</span></div>';
  G.tasks.forEach(function (t) { var n = t.done ? 0 : CH.left(t); h += '<div class="' + (t.done ? 'done' : '') + '"><span>' + taskName(t) + '</span>' + (t.done ? '<span>&#10004;</span>' : n ? '<b>' + n + '</b>' : '') + '</div>'; });
  if (G.insp && G.insp.sent) h += '<div class="insp' + (G.insp.res ? ' done' : '') + '"><span>' + L('원장 점검 ', 'Boss check ') + (G.insp.k + 2) + 'F</span><span>' + (G.insp.res === 'ok' ? '&#10004;' : G.insp.res === 'bad' ? '&#10008;' : '3:00') + '</span></div>';
  h += GS.ev.rows();
  if (!left()) h += '<div class="' + (G.gloves ? '' : 'done') + '" id="rowGlove"><span>' + L('고무장갑 벗기', 'Gloves off') + '</span>' + (G.gloves ? '' : '<span>&#10004;</span>') + '</div>';   // 일이 끝나면 장갑을 벗어 문에 걸고 마무리
  h += '<div class="' + (left() || G.gloves ? 'done' : '') + '" id="rowDesk"><span>' + L('공부', 'Study') + '</span></div>';
  $('tasks').innerHTML = h; ui.hud();
};
ui.praise = function (w) { var p = $('praise'); p.textContent = w; p.classList.remove('on'); void p.offsetWidth; p.classList.add('on'); };
ui.nope = function (kind) {
  GS.snd('nope'); var el = kind === 'glove' ? $('rowGlove') : kind === 'rolls' ? $('sRoll') : $('sTask');
  if (kind === 'glove') document.body.classList.add('showtasks');
  if (el) { var c = kind === 'glove' ? 'warn' : 'flash'; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }
};
GS.coin = function (n) { G.coin += n; var p = $('cointoast'); p.textContent = '+' + n.toLocaleString(); p.classList.remove('on'); void p.offsetWidth; p.classList.add('on'); GS.snd('coin'); };
GS.snd = function (n) { SND.play(n); };
/* 물건 이름표(코드에선 한글 이름으로 찾으니 화면에 띄울 때만 영어로) */
var LBL = { '고무장갑': 'Rubber gloves', '책상': 'Desk', '휴지통': 'Trash can', '휴지': 'Toilet paper', '변기': 'Toilet', '꽁초': 'Cigarette butt', '머리카락': 'Hair', '대야': 'Bucket',
  '음식물': 'Food waste', '냉장고': 'Fridge', '밥솥': 'Rice cooker', '라면 상자': 'Ramen box', '선반': 'Shelf', '김치': 'Kimchi', '도마': 'Cutting board',
  '쪽지': 'Note', '메모': 'Memo', '메모 붙이기': 'Stick a note', '귀마개': 'Earplugs', '형광등': 'Light tube', '형광등 갈기': 'Replace the light', '박카스': 'Energy drink',
  '독촉장 붙이기': 'Post the notice', '보일러': 'Boiler', '쓰레기': 'Trash', '이불': 'Blanket', '저금통': 'Coin jar' };
function lbl(k) { if (!EN || !k) return k; var m = /^(\d+)호$/.exec(k); return m ? 'Room ' + m[1] : LBL[k] || GS.loot.en(k) || k; }
function setMode(m) { G.mode = m; document.body.className = document.body.className.replace(/\bm-\w+/g, '').trim() + ' m-' + m; document.body.classList.toggle('playing', m === 'day' || m === 'study'); }
function show(id, on) { $(id).hidden = !on; }
function shopDraw() {
  var h = ''; ITEMS.forEach(function (it) { var own = G.items[it.id]; h += '<button class="item' + (own ? ' own' : G.coin < it.p ? ' poor' : '') + '" data-id="' + it.id + '"><span class="nm">' + it.n + '</span><span class="ef">' + it.e + '</span><span class="pr">' + (own ? '&#10004;' : it.p.toLocaleString()) + '</span></button>'; });
  $('shop').innerHTML = h; $('mcoin').textContent = G.coin.toLocaleString() + L('원', ' won');
}
function morning() {                                   // 아침 종이: 어제 결과, 돈, 상점
  var r = G.last, h = '';
  $('mday').textContent = 'DAY ' + G.day;
  if (r) h = L('공부', 'Study') + ' <b>' + fmt1(r.h) + 'h</b><br>' + L('합격', 'Pass') + ' <b>' + Math.round(G.pass) + '%</b> <b class="' + (r.d >= 0 ? 'up' : 'dn') + '">' + (r.d > 0 ? '+' : '') + fmt1(r.d) + '</b>';
  $('mres').innerHTML = h; shopDraw(); show('morn', true); paused = true; unlockPtr();
  if (r) GS.snd(r.d >= 0 ? 'up' : 'down');
}
// ---------- 원장 불시 점검(10/4 사장님 고른 이벤트 #1): 사람은 안 나오고 원장 문자로만 ----------
/* 7일마다 아침 8시 반에 문자 → 오후 3시까지 그 층 남녀 화장실을 끝내 놓으면 +10,000원, 못 하면 -10,000원 */
var INSP_AT = 30, INSP_DUE = 420, INSP_PAY = 10000;
function makeInsp(d) {
  if (d % 7 !== 0) return null;
  var nf = d >= 15 ? 4 : d >= 9 ? 3 : d >= 4 ? 2 : 1, k = (d / 7 + 1) % nf;
  return { k: k, ids: ['t' + k + 'm', 't' + k + 'w'], sent: false, res: null };
}
function inspOk() { var I = G.insp; return G.tasks.filter(function (t) { return I.ids.indexOf(t.id) >= 0; }).every(function (t) { return t.done; }); }
function phone(msg) {
  var el = $('phone'); phone.q = phone.q || [];
  if (el.classList.contains('on')) { phone.q.push(msg); return; }                // 앞 문자가 떠 있으면 줄 세운다
  $('phWho').textContent = L('원장님', 'Boss'); $('phMsg').textContent = msg; $('phTime').textContent = clockStr(G.t);
  el.classList.add('on'); GS.snd('buzz');
  clearTimeout(phone.tm); phone.tm = setTimeout(function () { el.classList.remove('on'); if (phone.q.length) setTimeout(function () { phone(phone.q.shift()); }, 700); }, 5200);
}
GS.phone = phone;
function inspTick() {
  var I = G.insp; if (!I || G.mode !== 'day') return;
  var fl = (I.k + 2) + L('층', 'F');
  if (!I.sent && G.t >= INSP_AT) { I.sent = true; phone(L('오늘 오후 3시에 들른다\n' + fl + ' 화장실 본다', 'Dropping by at 3 PM today.\nChecking the ' + fl + ' restrooms.')); ui.tasks(); save(); }
  if (I.sent && !I.res && G.t >= INSP_DUE) {
    I.res = inspOk() ? 'ok' : 'bad'; ui.tasks();
    if (I.res === 'ok') { phone(L(fl + ' 깨끗하네. 수고했다\n만원 더 넣었다', fl + ' looks clean. Good job.\nAdded 10,000 won.')); setTimeout(function () { GS.coin(INSP_PAY); }, 900); }
    else { phone(L(fl + ' 이게 청소한 거냐?\n월급에서 만원 깐다', 'You call ' + fl + ' clean?\n10,000 won off your pay.')); G.coin = Math.max(0, G.coin - INSP_PAY); setTimeout(function () { GS.snd('down'); }, 900); }
    save();
  }
}
// ---------- 그리기 준비 ----------
var cv = $('gl'), renderer, scene, cam, paused = false, wakeT = 1, blend = 0, stPose = null, stQ = new T.Quaternion(), stP = new T.Vector3(), titleT = 0;
var ptr = GS.ptr = { x: 0, y: 0, down: false, mv: 0 }, locked = false, progExit = false, touchMode = false;
GS.ptrRay = new T.Ray(); var rc = new T.Raycaster();
function initGL() {
  renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  GS.renderer = renderer; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.autoClear = false;
  scene = new T.Scene(); scene.background = new T.Color(0x0c0d0c);
  cam = GS.cam = new T.PerspectiveCamera(68, 1, 0.05, 60); cam.rotation.order = 'YXZ'; camB = new T.PerspectiveCamera(68, 1, 0.05, 60);
  W.build(scene); GS.hands.init(scene); CH.init(scene); GS.ev.init(scene); buildDesk(); resize();
}
function resize() {
  var w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  renderer.setSize(w, h, false); cam.aspect = GS.aspect = w / h; cam.fov = w / h < 1.5 ? 74 : 68; cam.updateProjectionMatrix(); GS.hands.resize(w / h);
}
window.addEventListener('resize', resize);

// ---------- 책상 위: 책, 시계, 산 물건 ----------
var book = {}, props = {};
/* ---------- 책: 대한민국헌법(js/booktext.js)을 한 쪽 512x732 에 빽빽하게. 쪽은 필요할 때 그리고 8쪽만 남긴다 ---------- */
var PW = 512, PH = 732, PM = 30, LH = 18, BFONT = "15px 'Nanum Myeongjo','Batang','AppleMyungjo',serif", lines = [], perPage = 0, pageCount = 1, texCache = {}, texOrder = [];
function bookLayout() {
  var c = document.createElement('canvas').getContext('2d'), maxW = PW - PM * 2, src = (window.BOOKTEXT || '').split('\n');
  c.font = BFONT; lines = [];
  src.forEach(function (para) {
    var kind = /^제\d+장|^제\d+절|^제\d+관|^부칙|^전문$/.test(para) ? 'h' : /^대한민국헌법$/.test(para) ? 't' : '', s = para, ind = /^[①-⑳]/.test(para) ? 8 : 0;
    if (kind) { lines.push({ t: s, k: kind }); return; }
    while (s.length) {
      var n = 1; while (n <= s.length && c.measureText(s.slice(0, n)).width <= maxW - ind) n++; n--; if (n < 1) n = 1;
      if (n < s.length) { var sp = s.lastIndexOf(' ', n); if (sp > n - 7 && sp > 0) n = sp + 1; }
      lines.push({ t: s.slice(0, n), k: '', ind: ind }); s = s.slice(n); ind = /^[①-⑳]/.test(para) ? 14 : 0;
    }
  });
  perPage = Math.floor((PH - PM * 2 - 34) / LH); pageCount = Math.max(1, Math.ceil(lines.length / perPage));
}
function drawPage(i) {
  var cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; var g = cv.getContext('2d'), j, y;
  var gr = g.createLinearGradient(0, 0, PW, 0); gr.addColorStop(0, '#f1ecd9'); gr.addColorStop(0.5, '#f6f2e3'); gr.addColorStop(1, '#ece6d0'); g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
  g.fillStyle = '#7a7466'; g.font = "13px 'Nanum Myeongjo','Batang',serif"; g.textAlign = 'center'; g.fillText('대한민국헌법', PW / 2, PM - 6); g.fillText(String(i + 1), PW / 2, PH - PM + 18);
  g.fillStyle = '#b9b29e'; g.fillRect(PM, PM + 2, PW - PM * 2, 1);
  g.textAlign = 'left'; y = PM + 24;
  for (j = i * perPage; j < Math.min(lines.length, (i + 1) * perPage); j++, y += LH) {
    var L = lines[j];
    if (L.k) { g.font = "bold 17px 'Nanum Myeongjo','Batang',serif"; g.fillStyle = '#1e1c18'; g.textAlign = 'center'; g.fillText(L.t, PW / 2, y); g.textAlign = 'left'; continue; }
    g.font = BFONT; g.fillStyle = '#26241f'; var m = /^(제\d+조(의\d+)?)/.exec(L.t);
    if (m && !L.ind) { g.font = 'bold ' + BFONT; g.fillText(m[1], PM, y); var w = g.measureText(m[1]).width; g.font = BFONT; g.fillText(L.t.slice(m[1].length), PM + w, y); }
    else g.fillText(L.t, PM + (L.ind || 0), y);
  }
  if ((i * 7) % 5 === 1) { g.fillStyle = 'rgba(255,225,60,.45)'; g.fillRect(PM, PM + 24 + LH * ((i * 3) % (perPage - 2)) - 13, 260, 15); }   // 형광펜 줄 하나씩
  var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function pageTex(i) {
  i = ((i % pageCount) + pageCount) % pageCount;
  if (!texCache[i]) { texCache[i] = drawPage(i); texOrder.push(i); if (texOrder.length > 8) { var o = texOrder.shift(); if (o !== i) { texCache[o].dispose(); delete texCache[o]; } } }
  return texCache[i];
}
function pageMat(front) { return new T.MeshLambertMaterial({ color: 0xffffff, side: front ? T.FrontSide : T.DoubleSide }); }
function setPage(m, i) { var t = pageTex(i); if (m.material.map !== t) { m.material.map = t; m.material.needsUpdate = true; } }
function bookShow() { var k = G.bookK || 0; setPage(book.st[1], 2 * k); setPage(book.st[0], 2 * k + 1); }
function buildDesk() {
  var d = W.tri.desk, mk = CH.mk, i;
  bookLayout();
  book.g = new T.Group(); book.g.position.set(d.x + 0.02, d.y + 0.002, d.z); scene.add(book.g);
  book.g.add(mk(function (b) { b.box(0, 0.006, 0, 0.23, 0.012, 0.31, { col: [0.16, 0.24, 0.42] }); b.box(0, 0.02, -0.075, 0.21, 0.018, 0.145, { col: [0.93, 0.92, 0.86] }); b.box(0, 0.02, 0.075, 0.21, 0.018, 0.145, { col: [0.93, 0.92, 0.86] }); }, GS.M.mat));
  book.st = [-1, 1].map(function (s) { var p = new T.Mesh(new T.PlaneGeometry(0.14, 0.2), pageMat()); p.rotation.set(-PI / 2, 0, PI / 2); p.position.set(0, 0.0295, s * 0.074); book.g.add(p); return p; });   // [0] 오른쪽, [1] 왼쪽
  book.pages = [];
  /* 오른쪽 책장 모서리: 집게손이 집어 살짝 들어 올린다 */
  book.C0 = new T.Vector3(0.1, 0.0306, -0.142); book.M0 = new T.Vector3(0.0775, 0.0306, -0.1195);
  var fg = new T.BufferGeometry(); fg.setAttribute('position', new T.Float32BufferAttribute([0.055, 0.0306, -0.142, 0.1, 0.0306, -0.097, 0.1, 0.0306, -0.142], 3)); fg.computeVertexNormals();
  book.flap = new T.Mesh(fg, new T.MeshBasicMaterial({ color: 0xcfc9b1, side: T.DoubleSide })); book.g.add(book.flap);
  book.hand = GS.hands.makePinch(true); book.hand.rotation.set(0.35, PI / 2 + 0.2, -0.7, 'YXZ'); book.hand.visible = false; book.g.add(book.hand);
  book.tipG = book.hand.userData.tip.clone().applyQuaternion(book.hand.quaternion); book.anc = new T.Vector3();
  for (i = 0; i < 4; i++) { var pv = new T.Group(); pv.position.set(0, 0.031, 0); var pg = new T.Mesh(new T.PlaneGeometry(0.14, 0.2), pageMat(true)); pg.rotation.set(-PI / 2, 0, PI / 2); pg.position.set(0, 0, -0.072); pv.add(pg);
    var pb = new T.Mesh(new T.PlaneGeometry(0.14, 0.2), pageMat(true)); pb.rotation.set(PI / 2, 0, PI / 2); pb.position.set(0, -0.0004, -0.072); pv.add(pb); pv.userData.f = pg; pv.userData.b = pb; pv.visible = false; pv.userData.t = 1; book.g.add(pv); book.pages.push(pv); }
  var cc = document.createElement('canvas'); cc.width = 128; cc.height = 64; book.cc = cc; book.ct = new T.CanvasTexture(cc); book.ct.colorSpace = T.SRGBColorSpace;
  var clk = mk(function (b) { b.box(0, 0.035, 0, 0.05, 0.07, 0.13, { col: [0.15, 0.15, 0.16] }); }); clk.position.set(d.x - 0.17, d.y, d.z + 0.33); clk.rotation.y = -0.25; scene.add(clk);
  var face = new T.Mesh(new T.PlaneGeometry(0.11, 0.05), new T.MeshBasicMaterial({ map: book.ct })); face.position.set(0.026, 0.037, 0); face.rotation.y = PI / 2; clk.add(face);
  // 의자
  var ch = mk(function (b) { b.box(0, 0.43, 0, 0.4, 0.04, 0.4, { col: [0.25, 0.25, 0.27] }); b.box(0.19, 0.7, 0, 0.03, 0.5, 0.38, { col: [0.25, 0.25, 0.27] }); [[-0.17, -0.17], [-0.17, 0.17], [0.17, -0.17], [0.17, 0.17]].forEach(function (q) { b.box(q[0], 0.21, q[1], 0.03, 0.42, 0.03, { col: [0.55, 0.55, 0.55] }); }); });
  ch.position.set(W.tri.seat.x, 0, W.tri.seat.z); scene.add(ch); W.boxCol(W.cols[0], W.tri.seat.x, W.tri.seat.z, 0.4, 0.4);
  // 산 물건
  props.lamp = mk(function (b) { b.put(new T.CylinderGeometry(0.06, 0.07, 0.015, 14), 0, 0.008, 0, { col: [0.2, 0.2, 0.22] }); b.put(new T.CylinderGeometry(0.008, 0.008, 0.3, 6), 0, 0.16, 0, { rz: 0.15, col: [0.2, 0.2, 0.22] }); b.put(new T.ConeGeometry(0.07, 0.09, 14, 1, true), 0.06, 0.3, 0, { rz: -0.9, col: [0.85, 0.75, 0.2] }); });
  props.lamp.position.set(d.x - 0.14, d.y, d.z - 0.36);
  props.bulb = new T.Mesh(new T.SphereGeometry(0.022, 8, 6), new T.MeshBasicMaterial({ color: 0xfff0b0 })); props.bulb.position.set(d.x - 0.07, d.y + 0.28, d.z - 0.36);
  props.coffee = mk(function (b) { b.put(new T.CylinderGeometry(0.032, 0.026, 0.075, 12), 0, 0.038, 0, { col: [0.95, 0.94, 0.9] }); b.put(new T.CircleGeometry(0.029, 12), 0, 0.07, 0, { rx: -PI / 2, col: [0.45, 0.3, 0.16] }); });
  props.coffee.position.set(d.x + 0.12, d.y, d.z + 0.3);
  props.book = mk(function (b) { b.box(0, 0.02, 0, 0.19, 0.04, 0.26, { col: [0.75, 0.2, 0.18] }); b.box(0, 0.06, 0.01, 0.18, 0.035, 0.25, { ry: 0.12, col: [0.2, 0.4, 0.65] }); b.box(0, 0.095, 0, 0.17, 0.03, 0.24, { ry: -0.08, col: [0.9, 0.78, 0.25] }); });
  props.book.position.set(d.x - 0.1, d.y, d.z - 0.02); props.book.visible = false;
  props.book2 = props.book.clone(); props.book2.position.set(d.x - 0.12, d.y, d.z + 0.1);
  props.pen = mk(function (b) { b.put(new T.CylinderGeometry(0.008, 0.008, 0.12, 8), 0, 0.008, 0, { rx: PI / 2, ry: 0.5, col: [0.95, 0.85, 0.1] }); }); props.pen.position.set(d.x + 0.16, d.y, d.z - 0.22);
  props.plug = mk(function (b) { b.box(0, 0.012, 0, 0.05, 0.024, 0.05, { col: [0.95, 0.5, 0.15] }); }); props.plug.position.set(d.x + 0.2, d.y, d.z + 0.16);
  props.cushion = mk(function (b) { b.box(0, 0.47, 0, 0.38, 0.05, 0.38, { col: [0.8, 0.3, 0.3] }); }, GS.M.mat); props.cushion.position.set(W.tri.seat.x, 0, W.tri.seat.z);
  ['lamp', 'bulb', 'coffee', 'book2', 'pen', 'plug', 'cushion'].forEach(function (k) { scene.add(props[k]); });
  // 운동화(쪽방 문 옆), 락스·철수세미는 손에 든 것으로 대신
  props.shoes = mk(function (b) { [-0.07, 0.07].forEach(function (z) { b.box(0, 0.035, z, 0.26, 0.07, 0.1, { col: [0.92, 0.92, 0.9] }); b.box(0.06, 0.08, z, 0.14, 0.04, 0.09, { col: [0.2, 0.4, 0.75] }); }); }, GS.M.mat); props.shoes.position.set(3.75, 0, -0.98); scene.add(props.shoes);
  props.bleach = mk(function (b) { b.box(0, 0.12, 0, 0.11, 0.24, 0.075, { col: [0.95, 0.95, 0.93] }); b.box(0, 0.13, 0.039, 0.085, 0.09, 0.004, { col: [0.15, 0.4, 0.82] }); b.box(0.025, 0.255, 0, 0.035, 0.03, 0.035, { col: [0.16, 0.42, 0.85] }); b.box(-0.03, 0.235, 0, 0.03, 0.05, 0.02, { col: [0.93, 0.93, 0.9] }); }, GS.M.mat); props.bleach.position.set(3.72, 0, -1.22); props.bleach.rotation.y = 0.5; scene.add(props.bleach);   // 락스 통(흰 통, 파란 띠·뚜껑)
  propsVis();
}
function propsVis() {
  props.lamp.visible = props.bulb.visible = !!G.items.lamp; props.coffee.visible = !!G.items.coffee; props.book2.visible = !!G.items.book; props.pen.visible = !!G.items.pen; props.plug.visible = !!G.items.plug; props.cushion.visible = !!G.items.cushion; props.shoes.visible = !!G.items.shoes; props.bleach.visible = !!G.items.bleach;
}
function drawClock(t) { var g = book.cc.getContext('2d'), m = Math.floor(Math.min(DAYMIN, t)), h = (8 + Math.floor(m / 60)) % 24, mm = m % 60; g.fillStyle = '#0c1410'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#ff5038'; g.font = 'bold 44px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm, 64, 34); book.ct.needsUpdate = true; }

// ---------- 하루 흐름 ----------
function newGame() { G.ev = { st: {}, owe: [] }; G.day = 1; G.pass = 50; G.coin = 0; G.items = {}; G.neglect = {}; G.stock = 8; G.rolls = 0; G.bookK = 0; G.last = null; G.study = null; startDay(true); }
function startDay(fresh, s) {
  setMode('day'); G.carry = null; CH.cur = null; stPose = null; blend = 0; document.body.classList.remove('st');
  if (fresh) { G.t = 0; G.gloves = false; G.riceAt = 0; G.tasks = makeTasks(G.day); G.insp = makeInsp(G.day); if (G.day > 1) { G.stock = Math.max(0, G.stock - 2); G.coin += WAGE * GS.ev.wageX(G.day); } wakeT = 0; }
  else { G.t = s.t; G.gloves = s.gloves; G.riceAt = s.riceAt || 0; G.tasks = makeTasks(G.day); G.tasks.forEach(function (t) { if (s.done.indexOf(t.id) >= 0) t.done = true; }); wakeT = 1; }
  var st = W.tri.stand; G.P.x = st.x; G.P.z = st.z; G.P.y = 0; G.P.yaw = -2.29; G.P.pitch = -0.36;
  CH.riceReset(); CH.setupDay(); GS.hands.reset(G.gloves); propsVis(); ui.tasks(); ui.hud(); drawClock(G.t); save();
  show('title', false); show('end', false); show('pause', false); paused = false; $('fade').classList.remove('on');
  phone.q = []; clearTimeout(phone.tm); $('phone').classList.remove('on');      // 어제 문자가 남아 있지 않게
  SND.music(1); SND.hum(0.18);   // 형광등 웅 소리는 깔릴 듯 말 듯(10/4 "웅소리 나는데")
  if (fresh) { GS.snd('alarm'); if (G.day > 1) morning(); }
}
GS.taskDone = function (t) { if (!t || t.done) return; t.done = true; ui.tasks(); save(); if (!left()) { var e = $('rowDesk'); if (e) { e.classList.add('warn'); } } };
function studyRem() { return STUDY - (Date.now() - G.study.start) / 1000 - G.study.skip; }
GS.sit = function () {
  if (G.carry) { GS.snd('nope'); return; }
  if (left()) { ui.nope('tasks'); document.body.classList.add('showtasks'); return; }
  if (G.gloves) { ui.nope('glove'); return; }
  var pr = predict(); G.study = { start: Date.now(), skip: 0, h: pr.h, d: pr.d, at: G.t };
  setMode('study'); bookShow(); stPose = STUDYPOSE; GS.hands.tool(null); unlockPtr(); save(); ui.hud(); ui.tasks(); GS.snd('door'); book.anc.copy(book.C0);
};
function tapBook(cx, cy) {
  if (G.mode !== 'study' || !G.study || paused) return;
  var hr = G.items.pen ? 1.5 : 1, sk = hr * 60 / Math.max(1, DAYMIN - G.study.at) * STUDY;    // 한 장 = 게임 시간 1시간
  G.study.skip += sk; GS.snd('page'); GS.hands.jab();
  var fl = document.createElement('div'); fl.className = 'fly'; fl.textContent = '+' + hr + 'h';
  fl.style.left = (cx == null ? innerWidth * (0.5 + (Math.random() - 0.5) * 0.2) : cx) + 'px'; fl.style.top = (cy == null ? innerHeight * 0.42 : cy) + 'px'; document.body.appendChild(fl); setTimeout(function () { fl.remove(); }, 750);
  var tm = $('suTime'); tm.classList.add('pop'); setTimeout(function () { tm.classList.remove('pop'); }, 90); ui.hud();
  for (var i = 0; i < book.pages.length; i++) if (book.pages[i].userData.t >= 1) { var pv = book.pages[i], k = G.bookK || 0; pv.userData.t = 0; pv.visible = true; setPage(pv.userData.f, 2 * k + 1); setPage(pv.userData.b, 2 * k + 2); setPage(book.st[0], 2 * k + 3); pv.userData.left = 2 * k + 2; G.bookK = k + 1; break; }
  if (studyRem() <= 0) finishStudy(); else if ((book.saveN = (book.saveN || 0) + 1) % 10 === 0) save();
}
function finishStudy() { var s = G.study; G.study = null; endDay(s.h, s.d); }
function endDay(h, d) {
  GS.ev.endDay();
  book.hand.visible = false;
  G.pass = GS.clamp(G.pass + d, 0, 100); G.last = { h: h, d: d };
  G.tasks.forEach(function (t) { G.neglect[t.id] = t.done ? 0 : Math.min(2, (G.neglect[t.id] || 0) + 1); });
  G.day++; G.study = null;
  $('fade').classList.add('on'); unlockPtr();
  setTimeout(function () { if (G.day > DAYS) ending(); else startDay(true); }, 650);
}
function midnight() { if (CH.cur) CH.leave(); GS.snd('down'); setMode('sleep'); G.study = null; stPose = null; endDay(0, -7); }   // 'study' 로 두면 잠들기 직전 공부 손·20:00 종이가 잠깐 비쳤다(10/4)
function ending() {
  var ok = G.pass >= PASSLINE; wipe(); setMode('end'); stPose = null; blend = 0; SND.music(0); SND.hum(0.12);
  $('endW').textContent = ok ? L('합격', 'PASSED') : L('불합격', 'FAILED'); $('endW').className = ok ? '' : 'fail'; show('end', true); show('morn', false); $('fade').classList.remove('on'); GS.snd(ok ? 'pass' : 'fail'); GS.ev.final(ok);
  var st = W.tri.stand; G.P.x = st.x; G.P.z = st.z; G.P.y = 0; G.P.yaw = -2.29; G.P.pitch = -0.3; CH.obj.gloves.visible = true;
  if (!ok) { stPose = STUDYPOSE; blend = 1; }
}
function toTitle() {
  setMode('title'); stPose = null; blend = 0; CH.cur = null; document.body.classList.remove('st'); paused = false;
  show('title', true); show('end', false); show('morn', false); show('pause', false); show('confirm', false); $('fade').classList.remove('on');
  var s = load(); show('bStart', !s); show('bCont', !!s); show('bNew', !!s); SND.music(0); SND.hum(0.15); GS.hands.reset(false);
  G.P.x = 1.2; G.P.z = 0; G.P.y = 0; G.P.yaw = -PI / 2; G.P.pitch = 0; ui.tasks();
}
function cont() {
  var s = load(); if (!s) return newGame();
  G.day = s.day; G.pass = s.pass; G.coin = s.coin; G.items = s.items || {}; G.neglect = s.neglect || {}; G.stock = s.stock; G.rolls = s.rolls || 0; G.bookK = s.bookK || 0; G.last = s.last; G.study = s.study; G.insp = s.insp || null; G.ev = s.ev || { st: {}, owe: [] };
  if (s.mode === 'study' && s.study) {
    startDay(false, s); G.tasks.forEach(function (t) { t.done = true; }); CH.setupDay(); G.t = s.study.at; setMode('study'); bookShow(); stPose = STUDYPOSE; blend = 1; ui.tasks(); ui.hud();
    if (studyRem() <= 0) finishStudy();
  } else startDay(false, s);
}
/* 집게손: 쉴 때는 모서리를 집어 살짝 들썩이고, 넘길 때는 넘어가는 책장 모서리를 따라간다 */
function flapHand(fa, dt) {
  var tn = performance.now() / 1000, lift = fa >= 0 ? 0 : 0.5 + Math.sin(tn * 3.2) * 0.22, p = book.flap.geometry.attributes.position;
  vA.copy(book.M0).sub(book.C0).multiplyScalar(lift * 1.5).add(book.C0); vA.y += 0.03 * lift;
  p.setXYZ(2, vA.x, vA.y, vA.z); p.needsUpdate = true; book.flap.visible = fa < 0;
  if (fa >= 0) { var ff = Math.min(fa, 1.3); book.anc.set(0.1, 0.031 + 0.142 * Math.sin(ff), -0.142 * Math.cos(ff)); }    // 세울 때까지만 따라가고 놓는다
  else book.anc.lerp(vA, Math.min(1, dt * 16));
  book.hand.position.copy(book.anc).sub(book.tipG); book.hand.visible = false;              // 3D 손 대신 그림 손
  /* 그림 손: 쉴 때 자리에 놓고, 넘길 때는 화면 밖 어깨(그림 오른쪽 아래 모서리)를 축으로 돌리고 늘여 집은 자리가 책장 모서리를 따라가게 한다 */
  var im = $('sHand'), w = Math.round(Math.min(innerHeight * 0.62, innerWidth * 0.42)), h = w * 859 / 900, scr = function (v) { vB.copy(v); book.g.localToWorld(vB); vB.project(cam); return [(vB.x + 1) / 2 * innerWidth, (1 - vB.y) / 2 * innerHeight]; };
  vC.copy(book.M0).sub(book.C0).multiplyScalar(0.75).add(book.C0); vC.y += 0.015; var r0 = scr(vC), t0 = scr(book.anc);
  w = Math.ceil(Math.max(w, (innerWidth - r0[0]) / 0.978 + 8, (innerHeight - r0[1]) / 0.8914 * 900 / 859 + 8)); h = w * 859 / 900;   // 소매 끝이 화면 밖까지 가게
  var L = r0[0] - 0.0219 * w, Tp = r0[1] - 0.1086 * h, px = L + w, py = Tp + h, ax = r0[0] - px, ay = r0[1] - py, bx = t0[0] - px, by = t0[1] - py;
  var ang = Math.atan2(by, bx) - Math.atan2(ay, ax), sc = Math.hypot(bx, by) / Math.max(1, Math.hypot(ax, ay));
  im.style.width = w + 'px'; im.style.transformOrigin = '100% 100%'; im.style.transform = 'translate(' + L.toFixed(1) + 'px,' + Tp.toFixed(1) + 'px) rotate(' + ang.toFixed(4) + 'rad) scale(' + sc.toFixed(4) + ')';
}
var STUDYPOSE = { cam: [3.34, 1.1, -1.6], look: [2.94, 0.68, -1.6] };
// ---------- 작업대 드나들기 ----------
GS.stationIn = function (st) { stPose = st; document.body.classList.add('st'); GS.hands.tool(st.tool || null); unlockPtr(); ptr.down = false; };
GS.stationOut = function () { stPose = null; document.body.classList.remove('st'); GS.hands.tool(null); ptr.down = false; ptr.x = ptr.y = 0; if (!touchMode) lockPtr(); save(); };
function lockPtr() { if (touchMode || !cv.requestPointerLock) return; try { var p = cv.requestPointerLock(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
function unlockPtr() { if (document.pointerLockElement === cv) { progExit = true; document.exitPointerLock(); } }
document.addEventListener('pointerlockchange', function () {
  var was = locked; locked = document.pointerLockElement === cv; press = null; scrubPtr = false; ptr.down = false;
  if (locked) { ptr.x = ptr.y = 0; progExit = false; return; }
  unlockAt = performance.now();
  if (was && !progExit && G.mode === 'day' && !paused) { if (CH.cur) CH.leave(); else pause(true); }
  progExit = false;
});
function pause(on) { if (G.mode !== 'day' && G.mode !== 'study') return; paused = on; show('pause', on); document.body.classList.toggle('paused', on); if (on) { unlockPtr(); keys = {}; ptr.down = false; SND.scrub(0); } else if (G.mode === 'day' && !CH.cur) lockPtr(); }

// ---------- 입력 ----------
var unlockAt = 0, keys = {}, look = null, scrubPtr = false, actHeld = false, noGloveWarn = false, pad = { x: 0, y: 0, id: null }, press = null;
function ndc(e) { ptr.x = e.clientX / window.innerWidth * 2 - 1; ptr.y = -(e.clientY / window.innerHeight * 2 - 1); }
function rayAt(x, y) { rc.setFromCamera({ x: zm.cx + x / zm.Z, y: zm.cy + y / zm.Z }, camB); return rc.ray; }   // 화면 좌표 → 줌 없는 카메라의 좌표
function walkMode() { return G.mode === 'day' && !CH.cur && !paused && wakeT >= 1; }
function useIt(it) { if (!it) return false; it.use(); return true; }
window.addEventListener('keydown', function (e) {
  if (e.repeat) return; var k = e.code; keys[k] = true; SND.unlock();
  if (GS.ev.isNote() && (k === 'KeyE' || k === 'KeyF' || k === 'Space' || k === 'Enter' || k === 'Escape')) { e.preventDefault(); GS.ev.closeNote(); return; }
  if (!$('dex').hidden) { if (k === 'Escape' || k === 'Enter' || k === 'Space' || k === 'KeyE') { e.preventDefault(); GS.loot.open(false); } return; }   // 도감 창이 떠 있으면 닫기만
  if (k === 'Tab') { e.preventDefault(); document.body.classList.toggle('showtasks'); }
  if (k === 'Escape' && performance.now() - unlockAt > 400) { if (CH.cur) CH.leave(); else if (G.mode === 'day' || G.mode === 'study') pause(!paused); }
  if (k === 'KeyP') pause(!paused);
  if (k === 'KeyM') tog('bgm'); if (k === 'KeyK') tog('snd');
  if ((k === 'KeyE' || k === 'KeyF') && walkMode()) useIt(CH.focus(rayAt(ptr.x, ptr.y)));
  if ((k === 'Space' || k === 'Enter') && G.mode === 'study') { e.preventDefault(); tapBook(); }
  if (k === 'Space' && walkMode()) { e.preventDefault(); actHeld = true; if (!useIt(CH.focus(rayAt(0, 0)))) { } }
});
window.addEventListener('keyup', function (e) { keys[e.code] = false; if (e.code === 'Space') actHeld = false; });
window.addEventListener('blur', function () { keys = {}; actHeld = false; ptr.down = false; });
cv.addEventListener('pointerdown', function (e) {
  SND.unlock(); if (paused) return;
  if (e.pointerType === 'touch' && !touchMode) { touchMode = true; document.body.classList.add('touch'); }
  if (GS.ev.closeNote()) return;                                         // 펼친 쪽지는 아무 데나 누르면 닫힌다
  if (G.mode === 'study') { ndc(e); tapBook(e.clientX, e.clientY); return; }
  if (G.mode !== 'day' || wakeT < 1) return;
  if (CH.cur) { ndc(e); ptr.down = true; ptr.id = e.pointerId; GS.ptrRay.copy(rayAt(ptr.x, ptr.y)); CH.cur.down(); return; }
  if (locked) { ptr.down = true; ptr.x = ptr.y = 0; if (!useIt(CH.focus(rayAt(0, 0))) && !G.carry && CH.stainAt(rayAt(0, 0))) { if (G.gloves) scrubPtr = true; else ui.nope('glove'); } return; }
  if (e.pointerType === 'mouse' && !touchMode) { lockPtr(); }
  if (press) return;
  ndc(e); var r = rayAt(ptr.x, ptr.y), hit = pad.id == null && CH.stainAt(r);   // 패드를 쥔 채 화면을 누르면 닦기 말고 시점 돌리기
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, scrub: !!hit };
  if (hit) { if (G.gloves) { scrubPtr = true; ptr.down = true; } else ui.nope('glove'); }
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
});
cv.addEventListener('pointermove', function (e) {
  if (G.mode !== 'day') { if (!locked) ndc(e); return; }
  if (locked) {
    if (CH.cur) return;
    if (scrubPtr && ptr.down) { var kk = 2.4 / window.innerHeight; ptr.x = GS.clamp(ptr.x + e.movementX * kk, -0.95, 0.95); ptr.y = GS.clamp(ptr.y - e.movementY * kk, -0.95, 0.95); return; }   // 닦는 동안은 손만 움직이고 시점은 그대로
    G.P.yaw -= e.movementX * 0.0022; G.P.pitch = GS.clamp(G.P.pitch - e.movementY * 0.0022, -1.45, 1.45); return;
  }
  if (CH.cur) { if (!ptr.down || e.pointerId === ptr.id) { var ox = ptr.x, oy = ptr.y; ndc(e); if (ptr.down) ptr.mv += Math.hypot((ptr.x - ox) * GS.aspect, ptr.y - oy); } return; }
  if (press && e.pointerId === press.id) {
    var dx = e.clientX - press.x, dy = e.clientY - press.y; press.moved += Math.abs(dx) + Math.abs(dy); press.x = e.clientX; press.y = e.clientY;
    if (press.scrub) { ptr.x = GS.clamp(ptr.x + dx * 2 / window.innerWidth, -0.98, 0.98); ptr.y = GS.clamp(ptr.y - dy * 2 / window.innerHeight, -0.98, 0.98); }
    else { var k = touchMode ? 0.0052 : 0.0034; G.P.yaw -= dx * k; G.P.pitch = GS.clamp(G.P.pitch - dy * k, -1.45, 1.45); }
  } else if (!press && e.pointerType === 'mouse') ndc(e);
});
function ptrUp(e) {
  if (CH.cur) { if (ptr.down && (e.pointerId === ptr.id || locked)) { ptr.down = false; CH.cur.up(); } return; }
  if (locked) { ptr.down = false; scrubPtr = false; press = null; ptr.x = ptr.y = 0; return; }
  if (press && e.pointerId === press.id) {
    if (!press.scrub && press.moved < 12 && performance.now() - press.t < 400 && walkMode()) { ndc(e); useIt(CH.focus(rayAt(ptr.x, ptr.y))); }
    press = null; scrubPtr = false; ptr.down = false; if (touchMode) { ptr.x = ptr.y = 0; }
  }
}
cv.addEventListener('pointerup', ptrUp); cv.addEventListener('pointercancel', ptrUp);
cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
// 폰: 이동 패드(켜짐/꺼짐 방향, 옆걸음), 행동 단추
(function () {
  var el = $('pad'), kn = $('knob');
  function set(e) { var r = el.getBoundingClientRect(), R = r.width / 2, x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R, d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; } pad.x = Math.abs(x) > 0.22 ? x : 0; pad.y = Math.abs(y) > 0.22 ? y : 0; kn.style.transform = 'translate(' + x * R * 0.6 + 'px,' + y * R * 0.6 + 'px)'; }
  el.addEventListener('pointerdown', function (e) { SND.unlock(); touchMode = true; document.body.classList.add('touch'); pad.id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (er) {} set(e); e.preventDefault(); });
  el.addEventListener('pointermove', function (e) { if (e.pointerId === pad.id) set(e); });
  var end = function (e) { if (e.pointerId === pad.id) { pad.id = null; pad.x = pad.y = 0; kn.style.transform = ''; } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  var a = $('act');
  a.addEventListener('pointerdown', function (e) { SND.unlock(); e.preventDefault(); if (!walkMode()) return; if (!useIt(CH.focus(rayAt(0, 0)))) actHeld = true; });
  var ae = function () { actHeld = false; }; a.addEventListener('pointerup', ae); a.addEventListener('pointercancel', ae); a.addEventListener('pointerleave', ae);
})();

// ---------- 걷기 ----------
var stepAcc = 0, moveAmt = 0, focusIt = null, focusT = 0;
function walk(dt) {
  var P = G.P, f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyD || keys.ArrowRight) s += 1; if (keys.KeyA || keys.ArrowLeft) s -= 1;
  // 폰 패드(10/4 사장님 "카메라가 따라와야"): 위아래는 앞뒤로 걷고, 좌우는 몸을 돌린다. 민 만큼 빠르다
  if (pad.id != null) { f -= GS.clamp(pad.y / 0.7, -1, 1); P.yaw -= pad.x * Math.abs(pad.x) * 2.6 * dt; }
  var len = Math.hypot(f, s), sp = 3.3 * (G.items.shoes ? 1.2 : 1) * (G.carry ? 0.72 : 1);
  if (len > 0) {
    if (len > 1) { f /= len; s /= len; } var sy = Math.sin(P.yaw), cy = Math.cos(P.yaw), dx = (-sy * f + cy * s) * sp * dt, dz = (-cy * f - sy * s) * sp * dt;
    P.x += dx; P.z += dz; W.collide(P, 0.29, P.y); stepAcc += sp * dt; if (stepAcc > 0.8) { stepAcc = 0; GS.snd('step'); }
  }
  moveAmt += ((len > 0 ? 1 : 0) - moveAmt) * Math.min(1, dt * 10);
  var gy = W.groundY(P.x, P.z, P.y); P.y += (gy - P.y) * Math.min(1, dt * 16);
}
var vC = new T.Vector3(), qe = new T.Quaternion(), pe = new T.Vector3(), eu = new T.Euler(0, 0, 0, 'YXZ'), mLook = new T.Matrix4(), vA = new T.Vector3(), vB = new T.Vector3(), UP = new T.Vector3(0, 1, 0), dayCol = new T.Color();
/* 쪼그려 앉기: 닦기 시작한 자리 쪽으로, 그 자리를 보는 선을 따라 다가간다. 각도는 그대로라 때가 화면에서 제자리에 있다 */
/* 닦기 줌(사장님 10/3 "팔을 늘리지 말고 카메라를 줌인"): 쪼그려 앉을 때 시점은 돌리지 않고 화면만 확대해, 닦는 자리가 손이 쉬는 자리 가까이 오게 한다.
   cam 에 setViewOffset 으로 창을 잘라 그리고, 광선은 줌 없는 camB 로 쏜다. 닦는 손끝(aim, 화면 좌표)은 줌이 바뀌어도 같은 곳을 가리키게 옮긴다 */
var camB, zm = { Z: 1, cx: 0, cy: 0, tZ: 1, tx: 0, ty: 0 }, aim = { x: 0, y: 0 }, ZD = { x: 0.24, y: -0.32 }, ZMAX = 2.2;
function zoomAim(a) {                                  // a: 닦기 시작한 화면 자리 → 목표 줌과 창 가운데
  var bx = zm.cx + a.x / zm.Z, by = zm.cy + a.y / zm.Z, Z, cx, cy;
  for (Z = 1; Z <= ZMAX + 1e-6; Z += 0.1) {
    var lim = 1 - 1 / Z; cx = GS.clamp(bx - ZD.x / Z, -lim, lim); cy = GS.clamp(by - ZD.y / Z, -lim, lim);
    if (Math.hypot((bx - cx) * Z - ZD.x, (by - cy) * Z - ZD.y) < 0.2) break;
  }
  zm.tZ = Math.min(Z, ZMAX); zm.tx = cx; zm.ty = cy;
}
function zoomUpdate() {
  var k = GS.ease(crK), Z = 1 + (zm.tZ - 1) * k, cx = zm.tx * k, cy = zm.ty * k;
  if (Z !== zm.Z || cx !== zm.cx || cy !== zm.cy) {
    var bx = zm.cx + aim.x / zm.Z, by = zm.cy + aim.y / zm.Z; aim.x = (bx - cx) * Z; aim.y = (by - cy) * Z;     // 손끝이 가리키던 곳 그대로
    if (scrubPtr) { ptr.x = aim.x; ptr.y = aim.y; }
    zm.Z = Z; zm.cx = cx; zm.cy = cy;
  }
  var w = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
  if (Z > 1.0001) cam.setViewOffset(w * Z, h * Z, (cx + 1) / 2 * w * Z - w / 2, (1 - cy) / 2 * h * Z - h / 2, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
  camB.position.copy(cam.position); camB.quaternion.copy(cam.quaternion); if (camB.fov !== cam.fov || camB.aspect !== cam.aspect) { camB.fov = cam.fov; camB.aspect = cam.aspect; camB.updateProjectionMatrix(); } camB.updateMatrixWorld();
}
var crOn = false, crK = 0, crDir = new T.Vector3(), crLen = 0, REACH = 0.62, KNEE = 0.5;
function crouchStart(p) {
  var P = G.P; vC.set(P.x, P.y + EYE, P.z); crDir.copy(p).sub(vC); var d = crDir.length(); crDir.divideScalar(d);
  crLen = Math.max(0, d - REACH); if (crDir.y < -1e-3) crLen = Math.min(crLen, (EYE - KNEE) / -crDir.y); crOn = true; zoomAim(aim);
}
function placeCam(dt) {
  var P = G.P, bob = Math.sin(performance.now() / 95) * 0.012 * moveAmt;
  pe.set(P.x, P.y + EYE + bob, P.z); eu.set(P.pitch, P.yaw, 0); qe.setFromEuler(eu);
  crK = GS.clamp(crK + (crOn ? dt : -dt) / 0.3, 0, 1); if (crK > 0) pe.addScaledVector(crDir, crLen * GS.ease(crK));
  if (wakeT < 1) {                                     // 요에서 일어나기
    var b = W.tri.bed, e = GS.ease(wakeT); vA.set(b.x, 0.32, b.z); pe.lerpVectors(vA, pe, e); eu.set(GS.lerp(1.25, P.pitch, e), GS.lerp(b.ry - PI / 2, P.yaw, e), GS.lerp(0.5, 0, e)); qe.setFromEuler(eu);
  }
  if (G.mode === 'title' || G.mode === 'end') { titleT += dt; eu.set(P.pitch + Math.sin(titleT * 0.23) * 0.015, P.yaw + Math.sin(titleT * 0.17) * 0.05, 0); qe.setFromEuler(eu); pe.y = EYE - 0.1; }
  if (stPose) { stP.set(stPose.cam[0], stPose.cam[1], stPose.cam[2]); vB.set(stPose.look[0], stPose.look[1], stPose.look[2]); mLook.lookAt(stP, vB, UP); stQ.setFromRotationMatrix(mLook); blend = Math.min(1, blend + dt / 0.38); }
  else blend = Math.max(0, blend - dt / 0.3);
  var k = GS.ease(blend); cam.position.lerpVectors(pe, stP, k); cam.quaternion.copy(qe).slerp(stQ, k);
}
// ---------- 매 프레임 ----------
var hudT = 0, scrubbing = false, hs = { move: 0, scrub: false, station: false, px: 0, py: 0 };
function update(dt) {
  var P = G.P, i;
  ptr.mvNow = ptr.mv;
  if (!paused) {
    if (wakeT < 1) wakeT = Math.min(1, wakeT + dt / 1.7);
    if (G.mode === 'day') {
      if (wakeT >= 1) G.t += dt * 60 / HS;
      inspTick(); GS.ev.tick(dt);
      var padOn = pad.id != null && (pad.x || pad.y);
      if (padOn && walkMode()) { scrubPtr = false; actHeld = false; crOn = false; if (press) press.scrub = false; ptr.down = false; }   // 패드를 밀면 닦기를 풀고 걷는다(화장실은 바닥이 때투성이라 화면을 끌면 닦기로 들어간다)
      if (walkMode() && (padOn || !crOn && crK === 0)) walk(dt); else moveAmt *= 0.8;
      if (G.t >= DAYMIN) { midnight(); return; }
    }
    if (G.mode === 'study' && G.study) {
      var fa = -1;
      for (i = 0; i < book.pages.length; i++) { var pg = book.pages[i]; if (pg.userData.t < 1) { pg.userData.t = Math.min(1, pg.userData.t + dt * 3); pg.rotation.x = GS.ease(pg.userData.t) * PI; fa = Math.max(fa, pg.rotation.x); if (pg.userData.t >= 1) { pg.visible = false; setPage(book.st[1], pg.userData.left); } } }
      flapHand(fa, dt);
      if (studyRem() <= 0) { finishStudy(); return; }
    }
  }
  placeCam(dt); cam.updateMatrixWorld(); zoomUpdate();
  // 닦기
  scrubbing = false;
  if (walkMode()) {
    var held = (scrubPtr && ptr.down) || actHeld;
    if (scrubPtr && ptr.down) { aim.x = ptr.x; aim.y = ptr.y; } else if (!held || crK === 0 && !crOn) { aim.x = 0; aim.y = 0; }   // E 키·단추로 닦을 땐 화면 가운데에서 시작
    var cRay = held ? rayAt(aim.x, aim.y) : rayAt(0, 0);
    if (held) {
      if (!G.gloves) { if (!noGloveWarn && CH.stainAt(cRay)) { noGloveWarn = true; ui.nope('glove'); } }
      else if (!G.carry && CH.scrub(cRay, dt)) scrubbing = true;
    } else noGloveWarn = false;
    focusT -= dt; if (focusT <= 0) { focusT = 0.08; focusIt = CH.focus(locked || touchMode ? rayAt(0, 0) : rayAt(ptr.x, ptr.y)); var fe = $('focus'), onSt = !focusIt && G.gloves && !G.carry && CH.stainAt(rayAt(locked || touchMode ? 0 : ptr.x, locked || touchMode ? 0 : ptr.y)), lab = focusIt ? lbl(focusIt.label) : onSt ? L('닦기', 'Scrub') : ''; if (fe.dataset.l !== lab) { fe.dataset.l = lab; fe.hidden = !lab; fe.innerHTML = lab ? (focusIt ? '<kbd>E</kbd>' : '') + lab : ''; $('act').textContent = lab || L('닦기', 'Scrub'); $('act').classList.toggle('dim', !lab); } }
  }
  if (!scrubbing && !((scrubPtr && ptr.down) || actHeld)) { CH.scrubEnd(); crOn = false; }
  else if (CH.plane && !crOn && walkMode()) crouchStart(CH.plane.p);
  var hp = ((scrubPtr && ptr.down) || actHeld) && G.gloves && walkMode() ? CH.planeHit(rayAt(aim.x, aim.y)) : null;
  GS.hands.world(hp, hp ? CH.plane.n : null, cam, dt);
  SND.scrub(scrubbing ? 0.25 + CH.scrubV * 0.75 : 0);
  if (CH.cur && !paused) { GS.ptrRay.copy(rayAt(ptr.x, ptr.y)); }
  ptr.mv = ptr.mvNow; if (!paused) CH.update(dt); ptr.mv = 0;
  hs.move = moveAmt; hs.scrub = scrubbing; hs.station = !!CH.cur || G.mode === 'study'; hs.day = G.mode === 'day'; hs.px = ptr.x; hs.py = ptr.y; GS.hands.update(dt, hs);
  W.updateLights(cam.position.x, cam.position.y, cam.position.z, dt); W.setFloorVis(cam.position.y - EYE);
  // 창밖 빛: 낮, 노을, 밤
  var tt = G.mode === 'study' && G.study ? G.study.at + (DAYMIN - G.study.at) * (1 - Math.max(0, studyRem()) / STUDY) : G.mode === 'day' ? G.t : 200;
  if (tt < 540) dayCol.setRGB(1, 1, 1); else if (tt < 690) dayCol.setRGB(1, GS.lerp(1, 0.55, (tt - 540) / 150), GS.lerp(1, 0.25, (tt - 540) / 150)); else dayCol.setRGB(GS.lerp(1, 0.06, Math.min(1, (tt - 690) / 80)), GS.lerp(0.55, 0.09, Math.min(1, (tt - 690) / 80)), GS.lerp(0.25, 0.2, Math.min(1, (tt - 690) / 80)));
  for (i = 0; i < W.winMats.length; i++) W.winMats[i].color.copy(dayCol);
  hudT -= dt; if (hudT <= 0) { hudT = 0.25; ui.hud(); if (G.mode === 'study' && G.study) drawClock(tt); else if (G.mode === 'day') drawClock(G.t); }
}
var rinfo = { calls: 0, tris: 0 };
function render() { renderer.clear(); renderer.render(scene, cam); rinfo.calls = renderer.info.render.calls; rinfo.tris = renderer.info.render.triangles; if (G.mode === 'day') GS.hands.render(renderer); }
var lastTs = 0;
function loop(ts) { requestAnimationFrame(loop); var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016); lastTs = ts; update(dt); render(); }

// ---------- 단추 ----------
var snd = { bgm: 1, snd: 1 };
function tog(k) { snd[k] = snd[k] ? 0 : 1; try { localStorage.setItem('gosiwon.' + k, snd[k]); } catch (e) {} applySnd(); }
function applySnd() { SND.bgm(snd.bgm); SND.snd(snd.snd); $('tBgm').classList.toggle('off', !snd.bgm); $('tSnd').classList.toggle('off', !snd.snd); }
function wire() {
  var click = function (id, fn) { $(id).addEventListener('click', function (e) { SND.unlock(); GS.snd('btn'); fn(e); }); };
  click('bStart', function () { newGame(); if (!touchMode) lockPtr(); });
  click('bCont', function () { cont(); if (!touchMode && G.mode === 'day' && !paused) lockPtr(); });
  click('bNew', function () { show('confirm', true); }); click('bNo', function () { show('confirm', false); });
  click('bYes', function () { show('confirm', false); wipe(); newGame(); if (!touchMode) lockPtr(); });
  click('bGo', function () { show('morn', false); paused = false; save(); if (!touchMode) lockPtr(); });
  click('bDex', function () { GS.loot.open(true); }); click('bDex2', function () { GS.loot.open(true); }); click('bDexX', function () { GS.loot.open(false); });
  ['bDex', 'bDex2', 'dexH'].forEach(function (id) { $(id).textContent = L('도감', 'COLLECTION'); });
  click('bResume', function () { pause(false); }); click('bTitle', function () { save(); toTitle(); }); click('bEnd', toTitle);
  click('tPause', function () { pause(!paused); }); click('tBgm', function () { tog('bgm'); }); click('tSnd', function () { tog('snd'); });
  click('stx', function () { if (CH.cur) CH.leave(); });
  click('sTask', function () { document.body.classList.toggle('showtasks'); });
  click('bLand', function () { if (window.OL) OL.go(); });
  $('shop').addEventListener('click', function (e) {
    var b = e.target.closest('.item'); if (!b) return; var it = ITEMS.filter(function (x) { return x.id === b.dataset.id; })[0]; SND.unlock();
    if (G.items[it.id]) return;
    if (G.coin < it.p) { GS.snd('nope'); b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); return; }
    G.coin -= it.p; G.items[it.id] = 1; GS.snd('buy'); shopDraw(); propsVis(); ui.hud(); save();
  });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { SND.hide(document.hidden); if (document.hidden && G.mode === 'day' && !paused && !$('morn').hidden === false) pause(true); });
}
function boot() {
  try { ['bgm', 'snd'].forEach(function (k) { var v = localStorage.getItem('gosiwon.' + k); if (v != null) snd[k] = +v; }); } catch (e) {}
  $('logo').textContent = L('고시원 총무', 'GOSIWON MANAGER'); $('lTask').textContent = L('남은 일', 'Tasks'); $('lRoll').textContent = L('휴지', 'TP'); $('lStudy').textContent = L('공부', 'Study'); $('lPass').textContent = L('합격', 'Pass'); $('bLand').textContent = L('가로로 보기', 'Landscape');
  initGL(); wire(); applySnd(); toTitle(); requestAnimationFrame(loop);
}
// 시험 손잡이
window.__gs = {
  G: G, W: W, CH: CH, tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); render(); }, render: render,
  start: newGame, cont: cont, title: toTitle, go: function () { show('morn', false); paused = false; }, resize: resize,
  tp: function (x, y, z, yaw, pitch) { G.P.x = x; G.P.y = y; G.P.z = z; if (yaw != null) G.P.yaw = yaw; if (pitch != null) G.P.pitch = pitch; wakeT = 1; },
  lookAt: function (x, y, z) { var dx = x - G.P.x, dy = y - (G.P.y + EYE), dz = z - G.P.z; G.P.yaw = Math.atan2(-dx, -dz); G.P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); },
  use: function () { return useIt(CH.focus(rayAt(0, 0))); }, focus: function () { var f = CH.focus(rayAt(0, 0)); return f ? f.label : null; },
  hold: function (v) { actHeld = !!v; }, keys: function (k) { keys = k || {}; },
  finish: function (id) { G.gloves = true; G.tasks.forEach(function (t) { if (!t.done && (!id || t.id === id)) CH.finishAll(t); }); },
  sit: function () { GS.sit(); }, tap: function (n) { for (var i = 0; i < (n || 1); i++) tapBook(); }, rem: function () { return G.study ? studyRem() : null; },
  day: function (d, pass) { G.day = d; if (pass != null) G.pass = pass; startDay(true); }, set: function (o) { for (var k in o) G[k] = o[k]; },
  ptr: function (x, y, down) { ptr.x = x; ptr.y = y; if (down != null) { var was = ptr.down; ptr.down = !!down; GS.ptrRay.copy(rayAt(x, y)); if (CH.cur) { if (down && !was) CH.cur.down(); if (!down && was) CH.cur.up(); } } }, mv: function (v) { ptr.mv += v; },
  shot: function (name, w) { render(); var c = cv; if (w) { c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * cv.height / cv.width); c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height); } return fetch('/save?name=' + name, { method: 'POST', body: c.toDataURL('image/jpeg', 0.85) }).then(function (r) { return r.text(); }); },
  info: function () { return rinfo; }, morning: morning, ending: ending, pause: pause
};
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("40px 'Eulji'"), document.fonts.load("40px 'Ria'"), document.fonts.load("bold 40px 'Note'")]).then(boot, boot); else boot();
})();