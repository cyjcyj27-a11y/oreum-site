/* 고시원 총무 — 이벤트 12개(10/4 사장님 "12개 다넣어"). 사람은 안 나오고 쪽지(문틈)·원장 문자(폰)·호실 문 메모로만.
   #1 원장 점검은 game.js(inspTick). 여기는 나머지 11개 + 안 한 민원 다음 날 꾸중 + 마지막 날 문자.
   상태는 G.ev 에 저장: { st: {id: {...}}, owe: [], bac: 날짜 }. 하루 준비는 CH.setupDay 뒤에(EV.setup), 매 프레임 EV.tick */
GS.ev = (function () {
'use strict';
var T = THREE, PI = Math.PI, W, CH, G, grp, CW = 0.75, FH = GS.FH, WH = GS.WH;
var EN = /[?&]lang=en/.test(location.search), L = function (ko, en) { return EN ? en : ko; };
var $ = function (id) { return document.getElementById(id); };
/* ---------- 일정 ---------- */
var DAY = { fridge: 2, fridge2: 3, ramen: 3, jar: 4, snore: 4, snore2: 5, hair: 6, lamp: 8, exam: 10, bac: 13, parcel: 11, praise: 15, rent: 16, rent2: 17, boiler: 17 };
/* 퇴실(10/4 사장님 "퇴실청소하다가 생필품 득템", "매번호수는 달라져야지"): 30일 동안 8번, 호실마다 다르다. 빈 방은 world.js W.vroom 을 그 호실 문 뒤로 옮긴다 */
var MOVE = [{ d: 5, n: 205 }, { d: 9, n: 303 }, { d: 12, n: 409 }, { d: 16, n: 302 }, { d: 19, n: 510 }, { d: 23, n: 407 }, { d: 26, n: 309 }, { d: 29, n: 503 }];
function moveOf(d) { for (var i = 0; i < MOVE.length; i++) if (MOVE[i].d === d) return { d: d, n: MOVE[i].n, i: i, key: 'mo' + d }; return null; }
/* ---------- 글 ---------- */
var TXT = {
  fridge: L('냉장고에 넣어둔 제 장조림\n누가 먹었어요??\n이름도 써 놨는데 ㅠㅠ\n- 203호 -', 'Who ate my braised beef\nin the fridge??\nMy name was on it!!\n- Room 203 -'),
  fridge2: L('범인 아직 모름\n내 장조림...\n- 203호 -', 'Still no culprit.\nMy beef...\n- Room 203 -'),
  fridgeMemo: L('먹지 마시오!!\n남의 반찬\n- 총무 -', "DON'T EAT\nother people's food!!\n- Manager -"),
  ramen: L('라면이 왜 이렇게 빨리 없어지냐\n선반에 메모라도 붙여놔', 'Why is the ramen running out so fast?\nPut a note on the shelf.'),
  ramenMemo: L('라면 1개 500원\n양심 저금통', 'Ramen 500 won each\nHonesty jar'),
  snore: L('옆방 코골이 때문에\n사흘째 못 잤어요...\n305호 어떻게 좀 해 주세요\n- 306호 -', "Can't sleep for 3 days\nbecause of the snoring\nnext door. Please, Room 305...\n- Room 306 -"),
  snore2: L('감사합니다 ㅠㅠ\n어젯밤 처음으로 잤어요\n- 306호 -', 'Thank you so much\nI finally slept last night\n- Room 306 -'),
  hair: L('2층 여자 화장실 하수구\n머리카락 너무해요!!\n씻을 때마다 발에 감겨요', '2F women\'s restroom drain\nis full of hair!!\nIt wraps around my feet'),
  hairOk: L('민원 들어온 거 봤다\nㅇㅋ 수고', 'Saw the complaint got handled.\nOK, good work.'),
  lamp: L('3층 복도 불이\n계속 깜빡여요\n밤에 무서워요\n- 307호 -', 'The 3F hallway light\nkeeps flickering\nIt\'s scary at night\n- Room 307 -'),
  exam: L('내일 시험이에요\n오늘 밤만 조용히\n부탁드려요\n- 302호 -', 'My exam is tomorrow.\nPlease keep it quiet\njust for tonight.\n- Room 302 -'),
  shh: L('쉿!\n302호 시험', 'Shh!\n302 exam'),
  bac: L('붙었어요!!\n총무님도 꼭 붙으세요\n- 302호 -', 'I passed!!\nYou\'ll pass too, manager!\n- Room 302 -'),
  parcel: L('택배 온 거 각 방 앞에 놔둬\n203호, 305호, 402호', 'Put the parcels by each door.\nRooms 203, 305, 402.'),
  praise: L('요즘 화장실 깨끗하더라\n이번 주는 일당 두 배다', 'Restrooms look clean lately.\nDouble pay this week.'),
  rent: L('304호 월세 두 달 밀렸다\n문에 독촉장 붙여라', 'Room 304 is two months late on rent.\nStick a notice on the door.'),
  rentMemo: L('월세 납부 바랍니다\n- 총무실 -', 'Rent is overdue.\n- Manager -'),
  rent2: L('다음 주에 꼭...\n진짜로...\n- 304 -', 'Next week for sure...\nReally...\n- 304 -'),
  boiler: [L('물이 차가워요 ㅠ', 'The water is cold'), L('온수 안 나와요!!!', 'NO HOT WATER!!!'), L('샤워하다 얼어 죽는 줄', 'Almost froze in the shower')],
  move: [
    L('205호 오늘 나갔다\n방 좀 치워놔라\n버리고 간 건 니가 가져도 된다', 'Room 205 moved out today.\nClean up the room.\nKeep whatever they left.'),
    L('303호 짐 반은 두고 나갔다\n싹 치워', 'Room 303 left half their stuff.\nClear it all out.'),
    L('409호 사흘 만에 나갔다\n방 치워놔', 'Room 409 left after 3 days.\nClean the room.'),
    L('302호 합격해서 나갔다\n방 치워라', 'Room 302 passed and moved out.\nClean the room.'),
    L('510호 월세 안 내고 잠수탔다\n방 비워라', 'Room 510 skipped rent and vanished.\nEmpty the room.'),
    L('407호 나갔다\n오늘 방 보러 오는 사람 있다', 'Room 407 moved out.\nSomeone is viewing it today.'),
    L('309호 군대 간단다\n방 치워놔', 'Room 309 is off to the army.\nClean the room.'),
    L('503호 나갔다\n이번 달 마지막이다 치워놔', 'Room 503 moved out.\nLast one this month. Clean it.')
  ],
  owe: L('어제 민원 하나 안 했더라\n오천원 깐다', 'You skipped a complaint yesterday.\n5,000 won off.'),
  pass: L('합격 축하한다\n방 빼라 ㅋㅋ', 'Congrats on passing.\nNow move out lol'),
  fail: L('수고했다\n다음 달도 총무 할래?', 'Good work anyway.\nManager again next month?')
};
/* 일거리 이름(할 일 목록) */
var ROW = {
  fridge: L('냉장고 메모', 'Fridge note'), ramen: L('라면 선반 메모', 'Ramen note'), snore: L('305호 귀마개', 'Earplugs 305'), hair: L('2F 하수구', '2F drain'),
  lamp: L('3F 형광등', '3F light'), parcel: L('택배', 'Parcels'), rent: L('304호 독촉장', 'Notice 304'), boiler: L('보일러', 'Boiler')
};
var JOBS = ['fridge', 'ramen', 'snore', 'hair', 'lamp', 'parcel', 'rent', 'boiler'];
/* ---------- 도움 ---------- */
function st(id) { G.ev = G.ev || { st: {}, owe: [] }; return G.ev.st[id] = G.ev.st[id] || {}; }
function has(id) { return G.ev && G.ev.st[id]; }
/* 호실 문 자리: 2층(k0)은 북 201~203, 남 204~206, 3층부터 북 n01~n06, 남 n07~n12 */
function door(num) {
  var fl = Math.floor(num / 100), n = num % 100, k = fl - 2, xs, s;
  if (k === 0) { s = n <= 3 ? 1 : -1; xs = s > 0 ? [6.6, 8.6, 10.6] : [7.4, 9.3, 11.1]; n = s > 0 ? n - 1 : n - 4; }
  else { s = n <= 6 ? 1 : -1; xs = [1.6, 3.6, 5.6, 7.6, 9.6, 11.2]; n = s > 0 ? n - 1 : n - 7; }
  return { x: xs[n], y0: k * FH, s: s, z: s * (CW - 0.058), zf: s * (CW - 0.32), ry: s > 0 ? PI : 0 };
}
/* 손글씨 종이 그림(포스트잇·쪽지) */
function paperTex(text, o) {
  o = o || {}; var c = document.createElement('canvas'), w = o.w || 256, h = o.h || 256; c.width = w; c.height = h; var g = c.getContext('2d');
  g.fillStyle = o.bg || '#fbf1a0'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w, h * 0.12);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); }
  var lines = text.split('\n'), fs = o.fs || Math.min(44, Math.floor(h * 0.8 / lines.length));
  g.fillStyle = o.fg || '#2b2a26'; g.font = 'bold ' + fs + "px 'Note','Ria',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(function (l, i) { var ww = g.measureText(l).width, sc = Math.min(1, (w - 24) / ww); g.save(); g.translate(w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.15); g.scale(sc, 1); g.fillText(l, 0, 0); g.restore(); });
  var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
}
function memo(text, x, y, z, ry, o) {                  // 종이는 벽 그늘에 묻히지 않게 조금 스스로 밝힌다
  o = o || {}; var m = new T.Mesh(new T.PlaneGeometry(o.sw || 0.15, o.sh || 0.15), (function () { var tx = paperTex(text, o); return new T.MeshLambertMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.38, side: T.DoubleSide }); })());
  m.position.set(x, y, z); m.rotation.y = ry || 0; m.rotation.z = o.rz == null ? (Math.random() - 0.5) * 0.12 : o.rz; grp.add(m); return m;
}
function box(sx, sy, sz, col, x, y, z, ry) { var m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), new T.MeshLambertMaterial({ color: col })); m.position.set(x, y, z); m.rotation.y = ry || 0; grp.add(m); return m; }
function inter(o) { o.day = 1; return CH.addInter(o); }
function gone(it) { it.off = true; if (it.hit && it.hit.parent) it.hit.parent.remove(it.hit); }
function done(id, pay) { st(id).done = 1; GS.ui.praise('NICE'); GS.snd('nice'); if (pay) setTimeout(function () { GS.coin(pay); }, 500); GS.ui.tasks(); GS.save(); }

/* ---------- 쪽지 펼침(화면 위 종이). 아무 곳이나 누르거나 E·Space 로 닫힘 ---------- */
var noteOn = false;
function showNote(texts, kind) {
  var el = $('note'); el.innerHTML = ''; [].concat(texts).forEach(function (t, i) { var d = document.createElement('div'); d.className = 'pap ' + (kind || '') + ' p' + i; d.textContent = t; el.appendChild(d); });
  el.hidden = false; noteOn = true; GS.snd('pick');
}
function closeNote() { if (!noteOn) return false; $('note').hidden = true; noteOn = false; GS.ui.tasks(); return true; }
/* 문틈 쪽지: 총무방 문 안쪽 바닥 */
function floorNote(id, texts, i) {
  var x = 3.55 + (i || 0) * 0.17, z = -0.95 - (i || 0) * 0.06, m = new T.Mesh(new T.PlaneGeometry(0.15, 0.11), new T.MeshLambertMaterial({ color: 0xf6f3e6 }));
  m.rotation.set(-PI / 2, 0, (i || 0) * 0.5 + 0.3); m.position.set(x, 0.006, z); grp.add(m);
  var it = inter({ x: x, y: 0.05, z: z, sx: 0.3, sy: 0.14, sz: 0.3, label: '쪽지', use: function () { st(id).read = 1; grp.remove(m); gone(it); showNote(texts, 'note'); } });
}
/* 문 메모: 읽을 수 있게 누르면 펼침 */
function doorMemo(num, text, o) {
  var d = door(num), off = (o && o.dx) || 0.2, m = memo(text, d.x + off, d.y0 + 1.32, d.s * (CW - 0.06), d.ry, o);
  inter({ x: d.x + off, y: d.y0 + 1.32, z: d.s * (CW - 0.08), sx: 0.22, sy: 0.22, sz: 0.1, label: '메모', use: function () { showNote(text, 'memo'); } });
  return m;
}
// ---------- 하루 준비(아침마다, 이어하기 때) ----------
var texts = [], lamp = null, lampOff = null, hairIt = null, carryTo = null, shhOn = false;
function clear() { while (grp.children.length) { var m = grp.children[0]; grp.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } } texts = []; carryTo = null; shhOn = false; }
function text(id, at, msg, fn) { texts.push({ id: id, at: at, msg: msg, fn: fn }); }
function rentMemo() { var rd = door(304); memo(TXT.rentMemo, rd.x - 0.05, rd.y0 + 1.25, rd.s * (CW - 0.06), rd.ry, { bg: '#ffffff', border: '#c0262c', fg: '#c0262c', sw: 0.2, sh: 0.15, w: 320, h: 240, rz: 0.02 }); }
function fridgeMemo() { memo(TXT.fridgeMemo, 4.704, 1.38, 2.3, -PI / 2, { bg: '#ffffff', sw: 0.16, sh: 0.16 }); }
function setup() {
  G = GS.G; clear(); var d = G.day, s;
  if (lamp) { lamp.dim = 1; lamp = null; }
  var mo = moveOf(d); if (W.vroom) { if (mo) W.vroom.place(mo.n); else W.vroom.clear(); }
  // 지난 일의 흔적(메모, 귀마개)은 계속 남는다
  if (has('fridge') && st('fridge').done) fridgeMemo();
  if (has('ramen') && st('ramen').done) ramenMemo();
  if (has('snore') && st('snore').done) plugAt();
  if (has('rent') && st('rent').done) rentMemo();
  // 꾸중: 어제 안 한 민원
  if (G.ev && G.ev.owe && G.ev.owe.length) { var n = G.ev.owe.length; G.ev.owe = []; text('owe', 15, TXT.owe, function () { G.coin = Math.max(0, G.coin - 5000 * n); GS.ui.hud(); setTimeout(function () { GS.snd('down'); }, 800); }); }
  // ----- 날마다 -----
  if (d === DAY.fridge) { s = st('fridge'); if (!s.read) floorNote('fridge', TXT.fridge); if (!s.done) inter({ x: 4.7, y: 1.3, z: 2.3, sx: 0.1, sy: 0.6, sz: 0.6, label: '메모 붙이기', can: function () { return st('fridge').read && !st('fridge').done && G.carry !== 'tub'; }, use: function () { gone(this); GS.snd('stick'); fridgeMemo(); done('fridge'); } }); }
  if (d === DAY.fridge2 && has('fridge') && !st('fridge2').read) floorNote('fridge2', TXT.fridge2);
  if (d === DAY.ramen) { s = st('ramen'); if (!s.sent) text('ramen', 40, TXT.ramen); if (!s.done) inter({ x: 0.85, y: 1.2, z: 2.0, sx: 0.12, sy: 0.4, sz: 0.4, label: '메모 붙이기', can: function () { return st('ramen').sent && !st('ramen').done && !G.carry; }, use: function () { gone(this); GS.snd('stick'); ramenMemo(); done('ramen'); } }); }
  if (d === DAY.jar && has('ramen') && st('ramen').done && !st('jar').done) {                          // 양심 저금통에 동전이 들어 있다
    var cs = []; for (var i = 0; i < 4; i++) cs.push(coin(0.7 + (i % 2) * 0.014, 0.985 + i * 0.008, 2.92 + (i > 1 ? 0.012 : -0.012)));
    inter({ x: 0.72, y: 1.05, z: 2.92, sx: 0.2, sy: 0.2, sz: 0.2, label: '저금통', use: function () { gone(this); cs.forEach(function (c) { c.visible = false; }); st('jar').done = 1; GS.coin(1500); GS.save(); } });
  }
  if (d === DAY.snore) {
    s = st('snore'); if (!s.read) floorNote('snore', TXT.snore);
    if (!s.done) {
      var pb = box(0.12, 0.07, 0.08, 0xf08a1c, 1.6, 1.6, -2.95, 0); pb.add(memo(L('귀마개', 'EARPLUGS'), 0, 0, 0.041, 0, { bg: '#ffffff', sw: 0.1, sh: 0.045, w: 256, h: 110, fs: 60, rz: 0 }));
      if (!s.has) inter({ x: 1.6, y: 1.62, z: -2.95, sx: 0.22, sy: 0.16, sz: 0.22, label: '귀마개', can: function () { return st('snore').read && !st('snore').has; }, use: function () { gone(this); pb.visible = false; st('snore').has = 1; GS.snd('pick'); GS.ui.tasks(); GS.save(); } }); else pb.visible = false;
      var dd = door(305); inter({ x: dd.x - 0.3, y: dd.y0 + 1.0, z: dd.s * (CW - 0.1), sx: 0.3, sy: 0.4, sz: 0.2, label: '305호', can: function () { return st('snore').has && !st('snore').done; }, use: function () { gone(this); GS.snd('pick'); plugAt(); done('snore', 5000); } });
    }
  }
  if (d === DAY.snore2 && has('snore') && st('snore').done) doorMemo(306, TXT.snore2);
  if (d === DAY.hair) { s = st('hair'); if (!s.read) floorNote('hair', TXT.hair); hairIt = CH.inter.filter(function (o) { return o.day && !o.off && o.label === '머리카락' && o.room && o.room.id === 't0w'; })[0] || null; }
  if (d === DAY.lamp) {
    s = st('lamp'); if (!s.read) floorNote('lamp', TXT.lamp);
    if (!s.done) {
      lamp = W.lamps.filter(function (l) { return l.k === 1 && Math.abs(l.x - 6) < 0.1 && Math.abs(l.z) < 0.1; })[0] || null;
      lampOff = box(1.2, 0.04, 0.06, 0x55574f, 6, FH + WH - 0.033, 0);
      var tb = box(0.45, 0.09, 0.09, 0xdfe6ef, 1.3, 1.06, -3.0); tb.add(new T.Mesh(new T.BoxGeometry(0.2, 0.092, 0.092), new T.MeshLambertMaterial({ color: 0x2f62b8 })));
      inter({ x: 1.3, y: 1.07, z: -3.0, sx: 0.5, sy: 0.16, sz: 0.2, label: '형광등', can: function () { return st('lamp').read && !G.carry && !st('lamp').done; }, use: function () { gone(this); tb.visible = false; G.carry = 'tube'; GS.hands.carry('tube'); GS.snd('pick'); } });
      inter({ x: 6, y: FH + WH - 0.1, z: 0, sx: 1.3, sy: 0.3, sz: 0.4, label: '형광등 갈기', can: function () { return G.carry === 'tube'; }, use: function () { gone(this); G.carry = null; GS.hands.carry(null); GS.snd('click'); lampOff.visible = false; if (lamp) lamp.dim = 1; lamp = null; done('lamp'); } });
    }
  }
  if (d === DAY.exam && !st('exam').read) floorNote('exam', TXT.exam);
  if (d === DAY.bac && has('exam') && !st('bac').done) {
    var bd = door(302), bt = new T.Group(); bt.add(new T.Mesh(new T.CylinderGeometry(0.022, 0.024, 0.11, 12), new T.MeshPhongMaterial({ color: 0x5a2a0a, shininess: 80 }))); bt.add(new T.Mesh(new T.CylinderGeometry(0.0235, 0.0245, 0.05, 12), new T.MeshLambertMaterial({ color: 0xf3d23a })));
    bt.position.set(bd.x + 0.25, bd.y0 + 0.055, bd.s * (CW - 0.14)); grp.add(bt); doorMemo(302, TXT.bac, { bg: '#c9f0d0' });
    inter({ x: bd.x + 0.25, y: bd.y0 + 0.08, z: bd.s * (CW - 0.14), sx: 0.2, sy: 0.2, sz: 0.2, label: '박카스', use: function () { gone(this); bt.visible = false; st('bac').done = 1; G.ev.bac = G.day; GS.snd('drink'); GS.ui.praise('+10%'); GS.ui.hud(); GS.save(); } });
  }
  if (d === DAY.parcel) {
    s = st('parcel'); s.n = s.n || 0; if (!s.sent) text('parcel', 40, TXT.parcel);
    [203, 305, 402].forEach(function (num, i) {
      if (s['p' + num]) { parcelAt(num); return; }
      var pz = -0.45 + i * 0.42, pc = parcelBox(num, 0.5, 0, pz);
      inter({ x: 0.5, y: 0.13, z: pz, sx: 0.36, sy: 0.3, sz: 0.36, label: L('택배 ', 'Parcel ') + num, can: function () { return st('parcel').sent && !G.carry; }, use: function () { gone(this); pc.visible = false; G.carry = 'parcel'; carryTo = num; GS.hands.carry('parcel'); GS.snd('pick'); } });
      var dd2 = door(num); inter({ x: dd2.x, y: dd2.y0 + 0.4, z: dd2.zf, sx: 0.8, sy: 0.9, sz: 0.4, label: num + L('호', ''), can: function () { return G.carry === 'parcel' && carryTo === num; }, use: function () { gone(this); G.carry = null; carryTo = null; GS.hands.carry(null); GS.snd('box'); parcelAt(num); var S = st('parcel'); S['p' + num] = 1; S.n++; if (S.n >= 3) done('parcel', 3000); else { GS.ui.tasks(); GS.save(); } } });
    });
  }
  if (d === DAY.praise && !st('praise').sent) text('praise', 20, TXT.praise);
  if (d === DAY.rent) { s = st('rent'); if (!s.sent) text('rent', 40, TXT.rent); if (!s.done) { var rd2 = door(304); inter({ x: rd2.x, y: rd2.y0 + 1.25, z: rd2.s * (CW - 0.1), sx: 0.6, sy: 0.6, sz: 0.2, label: '독촉장 붙이기', can: function () { return st('rent').sent && !st('rent').done && !G.carry; }, use: function () { gone(this); GS.snd('stick'); rentMemo(); done('rent'); } }); } }
  if (d === DAY.rent2 && has('rent') && st('rent').done) doorMemo(304, TXT.rent2, { dx: 0.26, bg: '#d8e6ff' });
  if (d === DAY.boiler) {
    s = st('boiler'); if (!s.read) TXT.boiler.forEach(function (t, i) { floorNote('boiler', TXT.boiler, i); });
    box(0.16, 0.42, 0.3, 0xbfc3c0, 2.31, 1.35, -1.9); memo(L('보일러', 'BOILER'), 2.222, 1.2, -1.9, -PI / 2, { bg: '#ffffff', sw: 0.14, sh: 0.06, w: 256, h: 110, fs: 60, rz: 0 });
    var led = box(0.02, 0.035, 0.035, s.done ? 0x40e060 : 0xff3020, 2.225, 1.5, -1.8); led.material.emissive = new T.Color(s.done ? 0x10a030 : 0xc01010);
    var sw = box(0.04, 0.09, 0.04, 0x333333, 2.215, 1.36, -1.98); sw.rotation.z = s.done ? 0 : 0.7;
    if (!s.done) inter({ x: 2.26, y: 1.35, z: -1.9, sx: 0.25, sy: 0.5, sz: 0.4, label: '보일러', can: function () { return st('boiler').read && !st('boiler').done; }, use: function () { gone(this); GS.snd('click'); sw.rotation.z = 0; led.material.color.set(0x40e060); led.material.emissive.set(0x10a030); done('boiler'); } });
  }
  if (mo) { s = st(mo.key); if (!s.sent) text(mo.key, 40, TXT.move[mo.i]); if (!s.done) moveoutRoom(mo); }
}

// ---------- 소품 ----------
function ramenMemo() { memo(TXT.ramenMemo, 0.835, 1.24, 2.0, PI / 2, { bg: '#ffffff', sw: 0.18, sh: 0.12, w: 300, h: 200 }); jar(); }
function jar() {                                    // 양심 저금통: 투명 통 + 빨간 뚜껑
  var j = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.1, 14, 1, true), new T.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, shininess: 100, side: T.DoubleSide, depthWrite: false }));
  j.position.set(0.72, 1.02, 2.92); grp.add(j); box(0.1, 0.012, 0.1, 0xc8281e, 0.72, 1.075, 2.92);
}
function coin(x, y, z) { var c = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.003, 12), new T.MeshPhongMaterial({ color: 0xc9b26a, shininess: 90 })); c.position.set(x, y, z); c.rotation.x = 0.4; grp.add(c); return c; }
function plugAt() { var d = door(305); box(0.06, 0.04, 0.04, 0xf08a1c, d.x - 0.3, d.y0 + 0.93, d.s * (CW - 0.085)); }
function parcelBox(num, x, y, z) {
  var g = new T.Group(); g.position.set(x, y, z); grp.add(g);
  var b = new T.Mesh(new T.BoxGeometry(0.3, 0.22, 0.26), new T.MeshLambertMaterial({ color: 0xb98f5c })); b.position.y = 0.11; g.add(b);
  var t = new T.Mesh(new T.BoxGeometry(0.06, 0.222, 0.262), new T.MeshLambertMaterial({ color: 0xcfb880 })); t.position.y = 0.11; g.add(t);
  var lb = new T.Mesh(new T.PlaneGeometry(0.12, 0.08), new T.MeshLambertMaterial({ map: paperTex(num + L('호', ''), { w: 192, h: 128, bg: '#ffffff', fs: 70 }) })); lb.rotation.x = -PI / 2; lb.position.set(0.07, 0.222, 0); g.add(lb);
  return g;
}
function parcelAt(num) { var d = door(num); parcelBox(num, d.x + 0.25, d.y0, d.s * (CW - 0.2)); }
function shh() { var d = W.tri.desk, m = memo(TXT.shh, d.x - 0.12, d.y + 0.004, d.z - 0.26, 0, { sw: 0.09, sh: 0.09, rz: 0 }); m.rotation.set(-PI / 2, 0, PI / 2 + 0.2); }
/* 퇴실한 방: 쓰레기 셋 + 버리고 간 물건(도감에 없는 것부터). 자리는 방 안 좌표 (u, v, 돌림) — world.js 빈 방과 같은 틀 */
var SPOT = { bed: [[0.6, 2.45, 0.1], [0.58, 1.8, 0.6], [0.62, 1.2, -0.4]], desk: [[-0.9, 2.62, 0.35], [-0.68, 2.5, -0.3]], floor: [[-0.15, 1.0, 0.4], [-0.3, 1.95, -0.6]], wall: [[-0.8, 1.55, 0]] };
var JUNK = [[0.0, 0.5, 'cup'], [-0.1, 1.45, 'can'], [-0.55, 2.2, 'bag']];
function moveoutRoom(mo) {
  var S = st(mo.key), V = W.vroom; if (!V || !V.num()) return; S.n = S.n || 0;
  if (!S.loot) {                                       // 처음 한 번 정해서 저장(다시 불러도 같은 물건)
    var seen = G.ev.seen = G.ev.seen || [], left = { bed: 3, desk: 2, floor: 2, wall: 1 }, used = { bed: 0, desk: 0, floor: 0, wall: 0 };
    S.loot = [];
    GS.loot.choose(G.day, seen).forEach(function (id) {
      var t = GS.loot.BY[id].at; if (S.loot.length >= 3 || used[t] >= left[t]) return;
      S.loot.push({ id: id, t: t, i: used[t]++ }); if (seen.indexOf(id) < 0) seen.push(id);
    });
  }
  var total = JUNK.length + S.loot.length;
  JUNK.forEach(function (q, i) {
    if (S['j' + i]) return; var p = V.at(q[0], q[1]), m;
    if (q[2] === 'cup') { m = new T.Mesh(new T.CylinderGeometry(0.05, 0.04, 0.08, 12), new T.MeshLambertMaterial({ color: 0xf2efe6 })); m.position.set(p.x, p.y + 0.04, p.z); m.rotation.z = 1.3; }
    else if (q[2] === 'can') { m = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.11, 12), new T.MeshPhongMaterial({ color: 0xd8262a, shininess: 80 })); m.position.set(p.x, p.y + 0.03, p.z); m.rotation.z = PI / 2; m.rotation.y = 0.7; }
    else { m = new T.Mesh(new T.IcosahedronGeometry(0.1, 1), new T.MeshLambertMaterial({ color: 0xeeeeea })); m.scale.set(1.2, 0.7, 1); m.position.set(p.x, p.y + 0.07, p.z); }
    grp.add(m);
    inter({ x: m.position.x, y: p.y + 0.07, z: m.position.z, sx: 0.28, sy: 0.2, sz: 0.28, label: '쓰레기', can: function () { return st(mo.key).sent; }, use: function () { gone(this); m.visible = false; S['j' + i] = 1; S.n++; GS.snd(q[2] === 'bag' ? 'trash' : 'can'); GS.hands.jab(); check(); } });
  });
  S.loot.forEach(function (L0, i) {
    if (S['l' + i]) return;
    var sp = SPOT[L0.t][L0.i], p = V.at(L0.t === 'wall' && L0.id !== 'bike' ? -1.0 : sp[0], sp[1]), g = GS.loot.mk(L0.id);   // 긴 것은 벽에 바짝(자전거는 손잡이 폭만큼 띄움)
    g.position.set(p.x, p.y + (L0.t === 'bed' ? VRY.bed : L0.t === 'desk' ? VRY.desk : 0), p.z);
    g.rotation.y = L0.t === 'wall' ? PI / 2 : V.ry() + sp[2]; grp.add(g); g.updateMatrixWorld(true);
    var bb = new T.Box3().setFromObject(g), c = bb.getCenter(new T.Vector3()), z = bb.getSize(new T.Vector3());
    inter({ x: c.x, y: c.y, z: c.z, sx: Math.max(0.22, z.x + 0.06), sy: Math.max(0.2, z.y + 0.06), sz: Math.max(0.22, z.z + 0.06), label: GS.loot.BY[L0.id].ko, can: function () { return st(mo.key).sent; }, use: function () {
      gone(this); S['l' + i] = 1; S.n++; GS.hands.jab(); fly(g); GS.loot.got(L0.id); check(2400);
    } });
  });
  function check(wait) { if (S.n >= total && !S.done) { S.done = 1; GS.save(); setTimeout(function () { S.done = 0; done(mo.key, 5000); }, wait || 0); } else { GS.ui.tasks(); GS.save(); } }   // 마지막이 물건이면 카드가 내려간 뒤 NICE
}
var VRY = { bed: 0.43, desk: 0.74 };
/* 주운 물건이 눈앞으로 날아와 작아지며 사라진다 */
function fly(g) {
  var cam = GS.cam, a = g.position.clone(), b = cam.position.clone().add(new T.Vector3(0, -0.12, -0.45).applyQuaternion(cam.quaternion)), r0 = g.rotation.y, s0 = 1;
  CH.anim(0.42, function (t) { var e = GS.ease(t); g.position.lerpVectors(a, b, e); g.position.y += Math.sin(t * PI) * 0.18; g.rotation.y = r0 + e * 3.2; var k = s0 * (1 - e * 0.85); g.scale.set(k, k, k); }, function () { grp.remove(g); });
}

// ---------- 매 프레임 ----------
var flk = 0;
function tick(dt) {
  if (!G || G.mode !== 'day') return;
  for (var i = 0; i < texts.length; i++) {
    var q = texts[i]; if (q.sentNow || G.t < q.at) continue;
    q.sentNow = true; if (q.id !== 'owe') st(q.id).sent = 1;
    GS.phone(q.msg); if (q.fn) q.fn(); GS.ui.tasks(); GS.save(); break;
  }
  if (!shhOn && G.day === DAY.exam && has('exam') && st('exam').read) { shhOn = true; shh(); }   // 시험 전날 밤: 책상에 쉿 메모
  if (lamp && lampOff) {                               // 깜빡이는 형광등: 켜졌다 꺼졌다 불규칙하게
    flk -= dt; if (flk <= 0) { var on = Math.random() < 0.55; lamp.dim = on ? 1 : 0.06; lampOff.visible = !on; flk = on ? 0.05 + Math.random() * 0.6 : 0.04 + Math.random() * 0.18; if (!on && Math.abs(G.P.y - FH) < 1 && Math.random() < 0.4) GS.snd('click'); }
  }
  if (G.day === DAY.hair && hairIt && hairIt.off && !st('hair').done) { st('hair').done = 1; hairIt = null; GS.phone(TXT.hairOk); GS.ui.tasks(); GS.save(); }
}
// 할 일 목록에 붙는 줄(받은 뒤에만)
function rows() {
  if (!G || !G.ev) return ''; var h = '';
  JOBS.forEach(function (id) {
    if (G.day !== DAY[id] || !has(id)) return; var s = st(id); if (!(s.read || s.sent)) return;
    var right = s.done ? '&#10004;' : id === 'parcel' ? (s.n || 0) + '/3' : '';
    h += '<div class="evrow' + (s.done ? ' done' : '') + '"><span>' + ROW[id] + '</span><span>' + right + '</span></div>';
  });
  var mo = moveOf(G.day); if (mo && has(mo.key) && st(mo.key).sent) { var S = st(mo.key), tot = JUNK.length + (S.loot ? S.loot.length : 3);
    h += '<div class="evrow' + (S.done ? ' done' : '') + '"><span>' + L(mo.n + '호 정리', 'Clean ' + mo.n) + '</span><span>' + (S.done ? '&#10004;' : (S.n || 0) + '/' + tot) + '</span></div>'; }
  return h;
}
// 하루가 끝날 때: 그날 받은 민원을 안 했으면 내일 꾸중
function endDay() {
  if (!G) return; G.ev = G.ev || { st: {}, owe: [] }; G.ev.owe = G.ev.owe || [];
  JOBS.forEach(function (id) { if (G.day === DAY[id] && !st(id).done) G.ev.owe.push(id); });
  var mo = moveOf(G.day); if (mo && has(mo.key) && st(mo.key).sent && !st(mo.key).done) G.ev.owe.push(mo.key);
  if (lamp) { lamp.dim = 1; lamp = null; }
}
function final(ok) { setTimeout(function () { GS.phone(ok ? TXT.pass : TXT.fail); }, 2600); }

return {
  init: function (scene) {
    W = GS.world; CH = GS.chores; G = GS.G; grp = new T.Group(); scene.add(grp);
    var sd = CH.setupDay; CH.setupDay = function () { sd.apply(this, arguments); setup(); };
    // 머리카락 민원 날: 2층 여자 화장실 하수구 머리카락 세 배
    CH.hairN = function (R) { return G && G.day === DAY.hair && R.id === 't0w' && !(G.ev && G.ev.st.hair && G.ev.st.hair.done) ? 9 : 0; };
  },
  tick: tick, rows: rows, endDay: endDay, final: final, closeNote: closeNote, isNote: function () { return noteOn; },
  wageX: function (d) { return G && G.ev && G.ev.st.praise && G.ev.st.praise.sent && d >= DAY.praise + 1 && d <= DAY.praise + 7 ? 2 : 1; },
  bonus: function () { return G && G.ev && G.ev.bac === G.day ? 0.1 : 0; },
  shhNow: function () { return G && G.day === DAY.exam && has('exam') && st('exam').read; },
  DAY: DAY, TXT: TXT, door: door, MOVE: MOVE, _texts: function () { return texts; }, _lamp: function () { return [lamp, lampOff]; }
};
})();
