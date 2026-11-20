/* 러다이트교 — 노가다 목수가 교주 됨 */
(function(){
var D = window.LD, A = window.LA;
var $ = function(id){ return document.getElementById(id); };
var stage = $('stage'), cv = $('cv'), g = cv.getContext('2d'), layer = $('layer');
var W = 320, H = 180;
g.imageSmoothingEnabled = false;
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');

/* ---------- 화면 맞추기 ---------- */
var U = 2, K = 4, SC = 4;
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function fit(){
  var vw = window.innerWidth, vh = window.innerHeight;
  var s = Math.min(vw / W, vh / H);
  var w = Math.floor(W * s), h = Math.floor(H * s);
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  stage.style.left = Math.floor((vw - w) / 2) + 'px'; stage.style.top = Math.floor((vh - h) / 2) + 'px';
  U = h / H;
  document.documentElement.style.setProperty('--u', U + 'px');
  var dpr = window.devicePixelRatio || 1;
  K = clamp(Math.round(h * dpr / H), 2, 6);
  if (cv.width !== W * K) { cv.width = W * K; cv.height = H * K; }
}
window.addEventListener('resize', fit); fit();

/* ---------- 그림 ---------- */
var NAMES = ['h_stand','h_walk','h_up','h_down','h_point','h_drink','h_speech','h_shout','h_lord','h_lord_cheer',
  's_hyung','s_drunk1','s_drunk2','s_boss','s_reporter','s_police','s_politician','s_mleader','s_mcultist','s_robot',
  'o_crate','o_basket','o_basket_full','o_plaque','o_hammer','o_mega','o_kiosk','o_cash','o_nail'];
for (var i = 0; i < 10; i++) { NAMES.push('c' + i); NAMES.push('v' + i); }
for (i = 0; i < 40; i++) { var z = (i < 10 ? '0' : '') + i; NAMES.push('f' + z); NAMES.push('g' + z); }
for (i = 0; i < 10; i++) { NAMES.push('x' + i); NAMES.push('y' + i); }
['b_site','b_pocha','b_market','b_room','b_tent','b_hall','b_grand','b_temple','b_campus','b_office','b_apt','b_park','b_factory','b_machine','b_boxtown','b_manchester','b_paris','b_berlin','b_detroit','b_valley','b_pub','b_mission','o_gmega','o_jet','o_dish','o_dham','o_case','o_van','o_stall','o_cam','o_press','o_found'].forEach(function(n){ NAMES.push(n); });
var IMG = {}, loaded = 0;
NAMES.forEach(function(n){ var im = new Image(); im.onload = function(){ loaded++; }; im.onerror = function(){ loaded++; }; im.src = 'img/' + n + '.png'; IMG[n] = im; });
function fimg(i){ var p = i < 40 ? 'f' : 'g'; i = i % 40; return p + (i < 10 ? '0' : '') + i; }
var DEXN = 80;
function abroadCount(){ var n = 0; D.TOWN.forEach(function(t){ if (t.abroad && t.k !== 'valley' && S.branch[t.k]) n++; }); return n; }

/* 해외 진출 뒤엔 펍 말고 어디서든 흰 두루마기 */
function robe(n){ return S && S.act >= 9 && scene !== 'pocha' && /^h_/.test(n) && !/^h_lord/.test(n) ? (/^h_(up|shout|speech)/.test(n) ? 'h_lord_cheer' : 'h_lord') : n; }
function spr(n, x, by, flip, alpha){
  n = robe(n);
  var im = IMG[n]; if (!im || !im.width) return;
  var w = im.width / SC, h = im.height / SC;
  var dx = Math.round((x - w / 2) * K) / K, dy = Math.round((by - h) * K) / K;
  if (alpha != null) g.globalAlpha = alpha;
  g.imageSmoothingEnabled = K < SC; g.imageSmoothingQuality = 'high';
  if (flip) { g.save(); g.translate(dx + w, dy); g.scale(-1, 1); g.drawImage(im, 0, 0, w, h); g.restore(); }
  else g.drawImage(im, dx, dy, w, h);
  g.imageSmoothingEnabled = false;
  g.globalAlpha = 1;
}
function bg(n){ var im = IMG[n]; g.imageSmoothingEnabled = false; if (im && im.width) g.drawImage(im, 0, 0, W, H); else { g.fillStyle = '#6a8'; g.fillRect(0, 0, W, H); } }
function shadow(x, by, w){ g.fillStyle = 'rgba(30,20,20,.28)'; g.fillRect(Math.round(x - w / 2), Math.round(by - 2), Math.round(w), 3); }
function txt(s, x, y, col, size){
  g.font = (size || 16) + 'px Neo'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#2b1d14';
  for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) if (dx || dy) g.fillText(s, Math.round(x) + dx, Math.round(y) + dy + 1);
  g.fillStyle = col || '#fff'; g.fillText(s, Math.round(x), Math.round(y));
}

/* ---------- 저장 ---------- */
var S = null;
function fresh(){
  return {day:1, slot:0, money:0, fol:0, faith:50, sus:0, act:1, bl:0, deco:{}, deck:D.STARTER.slice(), deckA:D.STARTER_A.slice(), dex:[], branch:{},
    shifts:0, wins:0, best:0, speeches:0, lastSteal:1, flags:{}, gave:0, cardSeen:{}, v2:1, won:1};
}
function save(){ try { localStorage.setItem('luddite.save', JSON.stringify(S)); } catch(e) {} }
function load(){ try { var s = JSON.parse(localStorage.getItem('luddite.save')); if (s && s.day) { if (!s.v2) { if (s.bl >= 5) s.bl = 6; s.v2 = 1; } if (!s.won) { s.money *= WON * GV[s.bl] / 2; s.won = 1; } D.STARTER.forEach(function(i){ if (s.deck.indexOf(i) < 0) s.deck.push(i); }); if (!s.deckA) s.deckA = D.STARTER_A.slice(); s.deck = s.deck.filter(function(i){ return D.CARDS[i]; }); s.deckA = s.deckA.filter(function(i){ return D.CARDS[i]; }); D.TOWN.forEach(function(t){ if (s.branch && s.branch[t.k]) t.folk.forEach(function(f){ if (s.dex.indexOf(f) < 0) s.dex.push(f); }); }); return s; } } catch(e) {} return null; }
function seenHow(){ try { return localStorage.getItem('luddite.how') === '1'; } catch(e) { return false; } }
function setHow(){ try { localStorage.setItem('luddite.how', '1'); } catch(e) {} }
function cap(){ return D.BLDG[S.bl].cap; }
function fmt(n){ return Math.floor(n).toLocaleString('ko-KR'); }
/* 돈: 원 단위(WON 배). 헌금은 모임장소 단계마다 GV 배로 커져서, 물건을 다 살 때쯤 1조가 모인다(econ.py 어림 계산) */
var WON = 1000, GV = [1, 4, 8, 130, 200, 300, 500], GOAL_MONEY = 1e12;
function fmtM(n, short){   // short: 상단바·목표처럼 좁은 곳은 큰 단위 하나만
  n = Math.max(0, Math.floor(n));
  if (window.LD_EN) { var u = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]; for (var i = 0; i < u.length; i++) if (n >= u[i][0]) { var v = n / u[i][0]; return (v >= 100 ? Math.floor(v) : v >= 10 ? Math.floor(v * 10) / 10 : Math.floor(v * 100) / 100) + u[i][1]; } return String(n); }
  var jo = Math.floor(n / 1e12), eok = Math.floor(n % 1e12 / 1e8), man = Math.floor(n % 1e8 / 1e4), won = n % 1e4;
  if (jo) return jo.toLocaleString('ko-KR') + '조' + (eok ? ' ' + eok.toLocaleString('ko-KR') + '억' : '') + '원';
  if (eok) return eok.toLocaleString('ko-KR') + '억' + (man && !short ? ' ' + man.toLocaleString('ko-KR') + '만' : '') + '원';
  if (man) return man.toLocaleString('ko-KR') + '만' + (won && !short ? ' ' + won.toLocaleString('ko-KR') : '') + '원';
  return won.toLocaleString('ko-KR') + '원';
}
function rnd(n){ return Math.floor(Math.random() * n); }
function pick(a){ return a[rnd(a.length)]; }
function shuffle(a){ for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- 공통 화면 조각 ---------- */
var scene = 'title', T = 0, shake = 0, parts = [], pops = [];
function addFol(n){
  var before = S.fol; S.fol = Math.max(before, Math.min(cap(), S.fol + n));   // 이미 자리보다 많아도 줄이지 않는다
  return {got: S.fol - before, over: Math.max(0, n - (S.fol - before))};
}
function part(x, y, col, n, sp, up){
  for (var i = 0; i < n; i++) parts.push({x:x, y:y, vx:(Math.random() - .5) * sp, vy:-Math.random() * sp * (up || 1), c:col, t:0.5 + Math.random() * 0.6, s:Math.random() < .3 ? 2 : 1});
}
var rings = [], beams = [];
function sheets(x, y, col, n, sp){ for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = (sp || 110) * (0.4 + Math.random() * 0.8); parts.push({k:'sheet', x:x, y:y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 70, c:col, t:1.3 + Math.random() * 0.9, r:Math.random() * 6, vr:(Math.random() - .5) * 16, ph:Math.random() * 6}); } }
function ring(x, y, col, max){ rings.push({x:x, y:y, r:3, max:max || 40, c:col}); }
function beam(x, y, col){ beams.push({x:x, y:y, t:0.7, c:col || '#fff6c8'}); }
function pop(s, x, y, col, size){ pops.push({s:s, x:x, y:y, c:col, t:0.9, size:size || 16}); }
function stepFx(dt){
  for (var i = parts.length - 1; i >= 0; i--) {
    var p = parts[i]; p.t -= dt;
    if (p.k === 'sheet') { p.vx *= Math.max(0, 1 - 2.6 * dt); p.vy = Math.min(38, p.vy + 120 * dt); p.x += (p.vx + (p.vy ? Math.sin(T * 7 + p.ph) * 26 : 0)) * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > 150) { p.y = 150; p.vx = 0; p.vy = 0; p.vr = 0; } }
    else if (p.k === 'trail') { p.x += p.vx * dt; p.y += p.vy * dt; }
    else { p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    if (p.t <= 0) parts.splice(i, 1);
  }
  for (i = rings.length - 1; i >= 0; i--) { var q = rings[i]; q.r += (q.max - q.r) * 9 * dt + 30 * dt; if (q.r >= q.max) rings.splice(i, 1); }
  for (i = beams.length - 1; i >= 0; i--) { beams[i].t -= dt; if (beams[i].t <= 0) beams.splice(i, 1); }
  for (i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; pops[i].y -= 18 * dt; if (pops[i].t <= 0) pops.splice(i, 1); }
}
function drawFx(){
  beams.forEach(function(b){ var a = b.t / 0.7, w = Math.round(4 + 10 * a); g.globalAlpha = a * 0.55; g.fillStyle = b.c; g.fillRect(Math.round(b.x - w / 2), 0, w, Math.round(b.y)); g.globalAlpha = a * 0.9; g.fillStyle = '#fff'; g.fillRect(Math.round(b.x - w / 6), 0, Math.max(1, Math.round(w / 3)), Math.round(b.y)); g.globalAlpha = 1; });
  rings.forEach(function(q){ var a = 1 - q.r / q.max; g.globalAlpha = a; g.lineWidth = 3; g.strokeStyle = '#2b1d14'; g.beginPath(); g.ellipse(q.x, q.y, q.r, q.r * 0.42, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.5; g.strokeStyle = q.c; g.stroke(); g.globalAlpha = 1; });
  parts.forEach(function(p){
    if (p.k === 'sheet') {
      var w = Math.max(1, Math.round(6 * Math.abs(Math.cos(p.r)))), a = Math.min(1, p.t * 2);
      g.globalAlpha = a; g.fillStyle = '#2b1d14'; g.fillRect(Math.round(p.x - w / 2) - 1, Math.round(p.y) - 1, w + 2, 6);
      g.fillStyle = '#fbf3df'; g.fillRect(Math.round(p.x - w / 2), Math.round(p.y), w, 4); g.fillStyle = p.c; g.fillRect(Math.round(p.x - w / 2), Math.round(p.y), w, 1); g.globalAlpha = 1; return;
    }
    if (p.k === 'trail') { g.globalAlpha = Math.min(1, p.t * 4); g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); g.globalAlpha = 1; return; }
    g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  });
  pops.forEach(function(p){ g.globalAlpha = clamp(p.t * 2, 0, 1); txt(p.s, p.x, p.y, p.c, p.size); g.globalAlpha = 1; });
}
var toastT = null;
function toast(s, ms){
  var t = $('toast'); t.textContent = s; t.style.opacity = 1;
  clearTimeout(toastT); toastT = setTimeout(function(){ t.style.opacity = 0; }, ms || 1300);
}
function clearLayer(){ layer.innerHTML = ''; }
function el(tag, cls, html, parent){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || layer).appendChild(e); return e; }
function btn(label, cls, fn, parent){ var b = el('button', 'btn' + (cls ? ' ' + cls : ''), label, parent); b.onclick = function(ev){ ev.stopPropagation(); A.sfx('tap'); fn(); }; return b; }
function sheet(title, cls){
  var dim = el('div', 'dim'); var s = el('div', 'sheet center' + (cls ? ' ' + cls : ''), null, dim);
  if (title) el('h2', null, title, s);
  return {dim: dim, s: s};
}

/* ---------- 상단바 ---------- */
function hud(show){
  $('topbar').classList.toggle('hide', !show);
  $('goal').classList.toggle('hide', !show);
  if (!show) return;
  $('hDay').textContent = S.day;
  $('hFol').textContent = fmt(S.fol);
  $('hCap').textContent = S.bl < 6 ? '/' + fmt(cap()) : '';
  $('hMoney').textContent = fmtM(S.money, true);
  $('hFaith').style.width = S.faith + '%';
  $('hSus').style.width = S.sus + '%';
  $('hFaithW').classList.toggle('hide', S.act < 4);
  $('hSusW').classList.toggle('hide', S.act < 4);
  $('goal').textContent = E('목표 · ', 'Goal · ') + goalText();
  fitTop();
}
/* 상단바가 넘치면(돈이 조 단위로 길어짐) 글자만 줄인다. 한·영 같이 */
function fitTop(){
  var tb = $('topbar'); if (!tb || !tb.offsetWidth) return;
  var st = tb.querySelectorAll('.stat'), k = 1;
  st.forEach(function(x){ x.style.fontSize = ''; });
  while (tb.scrollWidth > tb.clientWidth + 1 && k > 0.55) { k -= 0.04; st.forEach(function(x){ x.style.fontSize = 'calc(var(--u)*' + (6.4 * k).toFixed(2) + ')'; }); }
}
addEventListener('resize', function(){ setTimeout(fitTop, 50); });
function goalText(){
  switch (S.act) {
    case 1: return E('노가다 ', 'Job site ') + S.shifts + '/2';
    case 2: return E('포장마차에서 말로 이기기', 'Win a debate at the tent bar');
    case 3: return E('신도 ', 'Followers ') + Math.min(S.fol, 12) + '/12';
    case 4: return E('반지하 셋방 구하기', 'Rent a basement room');
    case 5: return E('큰 천막 세우기', 'Put up a big tent');
    case 6: return E('상가 2층 얻기', 'Get a 2nd-floor unit');
    case 7: var n = 0; D.TOWN.forEach(function(t){ if (t.k !== 'machine' && S.branch[t.k]) n++; });
      return E('지부 ', 'Branches ') + n + '/6' + E(' · 수련원', ' · Retreat Center') + (S.bl >= 4 ? E(' 완료', ' done') : '');
    case 8: return E('기계교 한국 지부 접수', 'Take over the Machine Cult Korea branch');
    case 9: return E('해외 지부 ', 'Overseas branches ') + abroadCount() + '/4' + (S.bl >= 6 ? '' : E(' · 대성전', ' · Grand Temple'));
    default: var gs = []; if (!S.branch.valley) gs.push(E('실리콘밸리', 'Silicon Valley')); if (S.dex.length < DEXN) gs.push(E('도감 ', 'Dex ') + S.dex.length + '/' + DEXN); if (S.money < GOAL_MONEY) gs.push(E('돈 ', 'Money ') + fmtM(S.money, true) + E('/1조', '/1T')); return gs.join(' · ');
  }
}
function bindTogs(){
  var bb = $('bBgm'), bs = $('bSfx');
  bb.classList.toggle('off', !A.bgmOn); bs.classList.toggle('off', !A.sfxOn);
  bb.onclick = function(e){ e.stopPropagation(); A.init(); A.setBgm(!A.bgmOn); bb.classList.toggle('off', !A.bgmOn); };
  bs.onclick = function(e){ e.stopPropagation(); A.init(); A.setSfx(!A.sfxOn); bs.classList.toggle('off', !A.sfxOn); A.sfx('tap'); };
  $('bHelp').onclick = function(e){ e.stopPropagation(); A.sfx('tap'); openHow(null); };
}
bindTogs();

/* ---------- 대화 ---------- */
var talkQ = [], talkCb = null, talkFull = '', talkShown = 0, talkTimer = 0;
var fctx = $('talkFace').getContext('2d');
function talk(key, cb){ talkQ = (typeof key === 'string' ? D.TALK[key] : key).slice(); talkCb = cb; $('talk').classList.remove('hide'); nextLine(); }
function nextLine(){
  if (!talkQ.length) { $('talk').classList.add('hide'); var c = talkCb; talkCb = null; if (c) c(); return; }
  var L = talkQ.shift();
  $('talkName').textContent = (L[1] === '목수' || L[1] === 'Carpenter') && S && S.act >= 9 ? E('교주', 'Cult Leader') : L[1];
  talkFull = L[2]; talkShown = 0; talkTimer = 0; $('talkText').textContent = '';
  var fn = robe(L[0]);
  var im = IMG[fn];
  fctx.clearRect(0, 0, 192, 192); fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = 'high';
  if (im && im.width) {
    var face = L[0].charAt(0) === 'f';
    var sw = im.width;
    var sc = face ? Math.min(192 / sw, 192 / im.height) : 184 / Math.max(sw, 112);
    var dw = sw * sc, dh = im.height * sc;
    fctx.drawImage(im, Math.round((192 - dw) / 2), face ? Math.round(192 - dh) : 12, Math.round(dw), Math.round(dh));
  }
}
$('talk').addEventListener('pointerdown', function(e){
  e.stopPropagation();
  if (talkShown < talkFull.length) { talkShown = talkFull.length; $('talkText').textContent = talkFull; return; }
  A.sfx('tap'); nextLine();
});
function stepTalk(dt){
  if ($('talk').classList.contains('hide') || talkShown >= talkFull.length) return;
  talkTimer += dt;
  while (talkTimer > 0.035 && talkShown < talkFull.length) { talkTimer -= 0.035; talkShown++; if (talkShown % 2) A.sfx('talk'); }
  $('talkText').textContent = talkFull.slice(0, talkShown);
}
function talking(){ return !$('talk').classList.contains('hide'); }

/* ---------- 게임 설명 ---------- */
var howOpen = false, howCvs = [];
function openHow(cb){
  howOpen = true;
  var sh = sheet('HOW TO PLAY'); sh.dim.id = 'how';
  var row = el('div', 'hw', null, sh.s);
  var texts = E(['망치 막대가 가운데 올 때 누르면 탁! 못을 박아 돈을 법니다.',
               '카드를 고르고 화면을 당겼다 놓으면 전단지가 날아갑니다. 머리 위 색과 같은 색을 맞히면 우리 신도가 됩니다.',
               '신도가 내는 헌금으로 모임장소를 키우고 지부를 늘리세요. 바다 건너까지 퍼지면 교주가 됩니다.'],
               ['Tap when the hammer bar hits the middle. Bang! Drive nails to earn money.',
                'Pick a card, pull back and let go to fire flyers. Match the color over their heads to win followers.',
                'Offerings grow your meeting place and branches. Spread across the sea to become the cult leader.']);
  howCvs = [];
  texts.forEach(function(t){
    var c = el('div', 'hc', null, row);
    var k = document.createElement('canvas'); k.width = 304; k.height = 200; c.appendChild(k);
    el('div', null, t, c);
    var kc = k.getContext('2d'); kc.setTransform(4, 0, 0, 4, 0, 0); howCvs.push(kc);
  });
  var ok = btn('OK', '', function(){ howOpen = false; setHow(); sh.dim.remove(); if (cb) cb(); }, sh.s);
  ok.style.display = 'block'; ok.style.margin = 'calc(var(--u)*7) auto 0';
}
function drawHow(){
  if (!howOpen || howCvs.length < 3) return;
  var c = howCvs[0]; c.imageSmoothingEnabled = false;
  c.fillStyle = '#9fd2f0'; c.fillRect(0, 0, 76, 50); c.fillStyle = '#b48a55'; c.fillRect(0, 40, 76, 10);
  var p = Math.sin(T * 3.2);
  c.fillStyle = '#2b1d14'; c.fillRect(6, 4, 64, 7); c.fillStyle = '#7a5a3a'; c.fillRect(7, 5, 62, 5);
  c.fillStyle = '#ffd23f'; c.fillRect(27, 5, 22, 5); c.fillStyle = '#7be36b'; c.fillRect(34, 5, 8, 5);
  var mx = 38 + p * 30; c.fillStyle = '#fff'; c.fillRect(Math.round(mx) - 1, 3, 3, 9);
  var hit = Math.abs(p) < 0.15;
  var hs = IMG[hit ? 'h_down' : 'h_up']; c.imageSmoothingEnabled = true; if (hs.width) c.drawImage(hs, 22 - hs.width / SC * 0.3, 44 - hs.height / SC * 0.6, hs.width / SC * 0.6, hs.height / SC * 0.6); c.imageSmoothingEnabled = false;
  c.fillStyle = '#6d727d'; c.fillRect(46, hit ? 38 : 33, 2, hit ? 2 : 7);
  if (hit) { c.fillStyle = '#ffd23f'; c.fillRect(43, 32, 2, 2); c.fillRect(50, 31, 2, 2); }
  c = howCvs[1]; c.imageSmoothingEnabled = false;
  c.fillStyle = '#bfe2f5'; c.fillRect(0, 0, 76, 50); c.fillStyle = '#a7a7a7'; c.fillRect(0, 40, 76, 10);
  var ph = (T % 3) / 3, conv = ph > 0.55;
  var who = IMG[conv ? 'v5' : 'c5']; c.imageSmoothingEnabled = true; if (who.width) c.drawImage(who, 18 - who.width / SC * 0.35, 46 - who.height / SC * 0.7, who.width / SC * 0.7, who.height / SC * 0.7); c.imageSmoothingEnabled = false;
  if (!conv) { c.fillStyle = '#2b1d14'; c.fillRect(13, 2, 11, 9); c.fillStyle = D.NEED_COL[1]; c.fillRect(14, 3, 9, 7); }
  if (ph < 0.55) { var q = ph / 0.55, fx = 66 - q * 46, fy = 34 - Math.sin(q * Math.PI) * 26;
    c.fillStyle = '#2b1d14'; c.fillRect(Math.round(fx) - 4, Math.round(fy) - 3, 8, 7); c.fillStyle = '#fbf3df'; c.fillRect(Math.round(fx) - 3, Math.round(fy) - 2, 6, 5); c.fillStyle = D.NEED_COL[1]; c.fillRect(Math.round(fx) - 3, Math.round(fy) - 2, 6, 2); }
  if (conv) { c.fillStyle = '#ffd23f'; for (var i = 0; i < 5; i++) c.fillRect(8 + rnd(24), 6 + rnd(30), 1, 1); }
  c = howCvs[2]; c.imageSmoothingEnabled = false;
  var bgs = ['b_room', 'b_tent', 'b_hall', 'b_temple'], bi = Math.floor(T / 1.2) % 4;
  if (IMG[bgs[bi]].width) c.drawImage(IMG[bgs[bi]], 0, 0, 76, 50);
  var hl = IMG[bi === 3 ? 'h_lord_cheer' : 'h_stand']; c.imageSmoothingEnabled = true; if (hl.width) c.drawImage(hl, 38 - hl.width / SC * 0.3, 48 - hl.height / SC * 0.6, hl.width / SC * 0.6, hl.height / SC * 0.6);
}

/* ---------- 타이틀 ---------- */
var titleCrowd = [];
for (i = 0; i < 8; i++) titleCrowd.push({i:i, x:[22, 54, 86, 116, 204, 234, 266, 298][i], y:i % 2 ? 176 : 166, conv:false, t:1 + i * 0.9});
function drawTitle(dt){
  bg('b_market');
  titleCrowd.forEach(function(c){ c.t -= dt; if (c.t <= 0) { c.conv = !c.conv; c.t = c.conv ? 3 + Math.random() * 3 : 2 + Math.random() * 4; if (c.conv) part(c.x, c.y - 40, '#ffd23f', 8, 60); } });
  var list = titleCrowd.slice().sort(function(a, b){ return a.y - b.y; });
  list.forEach(function(c){ shadow(c.x, c.y, 18); spr((c.conv ? 'v' : 'c') + c.i, c.x, c.y + (c.conv ? Math.round(Math.sin(T * 8 + c.i)) : 0), c.x > 160); });
  shadow(160, 178, 30);
  spr(Math.sin(T * 2) > 0 ? 'h_speech' : 'h_speech', 160, 178);
}
$('bStart').onclick = function(){
  A.init(); A.sfx('tap');
  var old = load();
  if (old && !confirmNew) { askNew(); return; }
  startNew();
};
var confirmNew = false;
function askNew(){
  var sh = sheet(E('처음부터 할까요?', 'Start over?'));
  var r = el('div', 'row', null, sh.s);
  btn(E('새로 시작', 'New Game'), '', function(){ sh.dim.remove(); startNew(); }, r);
  btn(E('취소', 'Cancel'), 'ply', function(){ sh.dim.remove(); }, r);
}
$('bCont').onclick = function(){ A.init(); A.sfx('tap'); S = load(); if (!S) return; $('title').classList.add('hide'); goHub(); };
function startNew(){
  S = fresh(); save();
  $('title').classList.add('hide');
  var go = function(){ scene = 'hub'; enterHub(true); talk('intro', function(){ refreshHub(); }); };
  if (!seenHow()) openHow(go); else go();
}

/* ---------- 거점(하루) ---------- */
var SLOT = E(['아침', '낮', '밤'], ['AM', 'PM', 'Night']);
function goHub(){ scene = 'hub'; enterHub(); if (S.slot >= 3) endDay(); }
function hubBg(){ if (S.act === 1) return 'b_site'; return D.BLDG[S.bl].bg; }
function enterHub(silent){
  clearLayer(); parts = []; pops = [];
  document.body.classList.remove('playing');
  A.song(S.bl >= 4 ? 1 : 0);
  refreshHub();
}
function refreshHub(){
  hud(true);
  $('hSlot').textContent = SLOT[S.slot];
  var m = $('menu'), m2 = $('menu2'); m.innerHTML = ''; m2.innerHTML = ''; m.classList.remove('hide'); m2.classList.remove('hide');
  if (talking()) { hideMenu(); return; }
  var day = S.slot < 2;
  if (!day && S.act < 2) { endDay(); return; }  // 포장마차 열리기 전엔 밤에 할 게 없으니 바로 하루 끝
  if (day && S.act < 9) btn(S.flags.lastday ? E('상자집 수리<small>수리비</small>', 'Fix Box Houses<small>repair pay</small>') : E('노가다<small>일당</small>', 'Job Site<small>daily pay</small>'), '', startWork, m);
  if (day && S.act >= 3) btn(E('연설<small>신도 모으기</small>', 'Speech<small>win followers</small>'), '', openTowns, m);
  if (day && S.act >= 4) btn(E('봉사<small>의심 -15</small>', 'Volunteer<small>heat -15</small>'), 'ply', volunteer, m);
  if (!day && S.act >= 2) btn(S.act >= 9 ? E('펍<small>맥주값 1만원</small>', 'Pub<small>beer 10K</small>') : E('포장마차<small>술값 1만원</small>', 'Tent Bar<small>drinks 10K</small>'), '', startPocha, m);
  if (S.act >= 4) btn(E('모임장소', 'Meeting Place'), 'ply', openShop, m2);
  if (S.act >= 3) btn(E('도감', 'Dex'), 'ply', openDex, m2);
}
function hideMenu(){ $('menu').classList.add('hide'); $('menu2').classList.add('hide'); }
function useSlot(){ S.slot++; save(); }
function backToHub(){ scene = 'hub'; enterHub(); afterAction(); }
function afterAction(){
  if (checkAct()) return;
  if (S.slot >= 3) { endDay(); return; }
  refreshHub();
}
function checkAct(){
  var k = null;
  // 노가다 10번째에 반장이 최종 해고, 그 뒤 일은 상자집 수리
  if (S.act >= 2 && S.shifts >= 10 && !S.flags.lastday) { S.flags.lastday = 1; k = 'lastday'; }
  else if (S.act === 1 && S.shifts >= 2) { S.act = 2; k = 'fired'; }
  else if (S.act === 2 && S.wins >= 1) { S.act = 3; k = 'hyung'; }
  else if (S.act === 3 && S.fol >= 12) { S.act = 4; k = 'twelve'; }
  else if (S.act === 4 && S.bl >= 1) { S.act = 5; k = 'room'; }
  else if (S.act === 5 && S.bl >= 2) { S.act = 6; k = 'rival'; S.lastSteal = S.day; }
  else if (S.act === 6 && S.bl >= 3) { S.act = 7; k = 'branch'; }
  else if (S.act === 7 && S.bl >= 4 && branchCount() >= 6) { S.act = 8; k = 'final'; }
  else if (S.act === 8 && S.branch.machine) { S.act = 9; k = 'abroad'; S.lastSteal = S.day; }
  else if (S.act === 9 && S.bl >= 6 && abroadCount() >= 4) { S.act = 10; k = 'valleyOpen'; }
  else if (S.act === 10 && S.branch.valley && S.dex.length >= DEXN && S.money >= GOAL_MONEY) { save(); startEnding(); return true; }
  if (!k) return false;
  save(); hideMenu();
  talk(k, function(){ hud(true); if (S.slot >= 3) endDay(); else refreshHub(); });
  return true;
}
function branchCount(){ var n = 0; D.TOWN.forEach(function(t){ if (!t.abroad && t.k !== 'machine' && S.branch[t.k]) n++; }); return n; }
function drawHub(){
  bg(hubBg());
  var by = 172;
  if (S.deco.plaque && S.bl >= 1 && S.bl <= 2) spr('o_plaque', 160, 64);
  var n = S.fol <= 0 ? 0 : Math.min(22, Math.max(1, Math.round(Math.sqrt(S.fol) * 1.6)));
  var spots = [];
  for (var i = 0; i < n; i++) {
    var row = i < 8 ? 0 : i < 16 ? 1 : 2;
    var k = row === 0 ? i : row === 1 ? i - 8 : i - 16;
    var side = k % 2 ? 1 : -1, off = Math.floor(k / 2);
    var x = 160 + side * (40 + off * 30 + row * 14);
    spots.push({x:x, y:by - 12 + row * -10 + (row ? 0 : 6), i:i});
  }
  spots.sort(function(a, b){ return a.y - b.y; });
  spots.forEach(function(s){ shadow(s.x, s.y, 16); spr((S.act >= 9 && s.i % 3 === 2 ? 'y' : 'v') + (s.i % 10), s.x, s.y + Math.round(Math.sin(T * 3 + s.i) * 0.6), s.x > 160); });
  if (S.act >= 3) { shadow(212, by, 22); spr('s_hyung', 212, by, true); }
  if (S.deco.basket || S.act >= 5) { spr(S.deco.basket ? 'o_basket_full' : 'o_basket', 118, by); }
  if (S.deco.gmega) spr('o_gmega', 98, by - 2); else if (S.deco.mega) spr('o_mega', 98, by - 2);
  if (S.deco.dish) spr('o_dish', 290, 88);
  if (S.deco.jet) spr('o_jet', 52, 70 + Math.round(Math.sin(T * 1.5) * 2));
  if (S.deco.dham) spr('o_dham', 76, by);
  if (S.deco.van) spr('o_van', 292, by);
  if (S.deco.stall) spr('o_stall', 26, by);
  if (S.deco.cam) spr('o_cam', 190, by);
  if (S.deco.press) spr('o_press', 50, by + 2);
  if (S.deco.found) spr('o_found', 232, by);   // 장학재단 현판: 형님 옆 바닥
  if (S.deco.lawyer) spr('o_case', 266, by + 2);
  if (S.deco.safe) spr('o_cash', 244, by + 2);
  shadow(160, by, 26);
  var hs = S.deco.robe ? 'h_lord' : (S.act === 1 ? 'h_up' : 'h_stand');
  spr(hs, 160, by + (Math.floor(T * 2) % 2));
}
function volunteer(){
  useSlot(); S.sus = clamp(S.sus - 15, 0, 100); S.faith = clamp(S.faith + 3, 0, 100);
  A.sfx('coin'); toast(E('동네 청소 봉사 · 의심 -15', 'Cleaned the neighborhood · Heat -15')); save(); hud(true); afterAction();
}

/* ---------- 하루 끝 ---------- */
function endDay(){
  hideMenu();
  var lines = [], ev = [];
  var give = 0;
  if (S.bl >= 1) give = Math.round(S.fol * (0.6 + S.faith / 100) * D.BLDG[S.bl].give * 2 * (S.deco.basket ? 1.1 : 1) * (S.deco.robe ? 1.2 : 1) * (S.deco.dham ? 1.3 : 1) * (S.deco.stall ? 1.3 : 1) * (S.deco.press ? 1.3 : 1) * WON * GV[S.bl]);
  var bgive = 0, bfol = 0;
  if (!S.bpop) S.bpop = {};
  D.TOWN.forEach(function(t){ if (S.branch[t.k]) { var b0 = t.mult * 4, bp = S.bpop[t.k] || b0; bgive += t.mult * 40 * WON * GV[S.bl] * (S.deco.dish ? 2 : 1); bfol += bp; S.bpop[t.k] = Math.min(b0 * 5, Math.ceil(bp * (S.deco.cam ? 1.2 : 1.12))); } });
  S.money += give + bgive;
  if (give) lines.push(E('헌금 <b>+', 'Offerings <b>+') + fmtM(give) + '</b>');
  if (bgive) lines.push(E('지부 헌금 <b>+', 'Branch offerings <b>+') + fmtM(bgive) + '</b>');
  if (bfol) { var r = addFol(bfol); if (r.got) lines.push(E('지부 신도 <b>+', 'Branch followers <b>+') + fmt(r.got) + '</b> <small>' + E('신도가 신도를 데려옴', 'followers bring followers') + '</small>'); if (r.over) lines.push('<span class="no">' + E('자리 없음 ', 'No room ') + fmt(r.over) + '</span>'); }
  if (S.act >= 4) {
    S.faith = clamp(S.faith - (S.deco.plaque ? 2 : 4) + (S.bl >= 1 ? 3 : 0), 0, 100);
    if (S.faith < 25 && S.fol > 1) { var lv = Math.ceil(S.fol * 0.05); S.fol -= lv; lines.push('<span class="no">' + E('믿음이 식어 떠남 -', 'Faith cooled, left -') + fmt(lv) + '</span>'); }
    S.sus = clamp(S.sus + (1 + Math.min(4, S.fol / 3000) + Math.min(S.bl, 5) * 0.8) * (S.deco.jet ? 0.5 : 1) * (S.deco.found ? 0.7 : 1), 0, 100);
  }
  if (S.sus >= 100) {
    var lf = S.deco.lawyer ? 0 : Math.floor(S.fol * 0.2), lm = S.deco.lawyer ? 0 : Math.floor(S.money * (S.deco.safe ? 0.15 : 0.3));
    S.fol -= lf; S.money -= lm; S.sus = 20;
    ev.push(['raid', E('압수수색 · 신도 -', 'Raid · Followers -') + fmt(lf) + E(' · 돈 -', ' · Money -') + fmtM(lm)]);
  } else if (S.act >= 6 && !(S.act >= 9 ? S.branch.valley : S.branch.machine) && S.day - S.lastSteal >= 4) {
    S.lastSteal = S.day; var st = Math.floor(S.fol * 0.08); S.fol -= st;
    ev.push(['steal', E('기계교가 빼 감 · 신도 -', 'Machine Cult poached · Followers -') + fmt(st)]);
  } else if (S.sus > 60 && Math.random() < 0.3) {
    S.sus = clamp(S.sus + 5, 0, 100); ev.push(['reporter', E('기자 취재 · 의심 +5', 'Reporter visit · Heat +5')]);
  }
  if (S.act >= 8 && S.sus > 40 && !S.flags.pol && S.money > 1000 * WON) ev.push(['politician', null]);
  S.day++; S.slot = 0; save();
  var showSum = function(){
    var sh = sheet(E(S.day - 1 + '일째 밤', 'Night of Day ' + (S.day - 1)));
    var box = el('div', null, null, sh.s); box.style.cssText = 'font-size:calc(var(--u)*8);line-height:1.6;text-align:center;min-width:calc(var(--u)*120)';
    box.innerHTML = (lines.length ? lines : [E('조용한 하루', 'A quiet day')]).join('<br>');
    var b = btn('OK', '', function(){ sh.dim.remove(); runEvents(ev, function(){ hud(true); if (!checkAct()) refreshHub(); }); }, sh.s);
    b.style.display = 'block'; b.style.margin = 'calc(var(--u)*6) auto 0';
    A.sfx(give ? 'coin' : 'tap');
  };
  showSum();
}
function runEvents(ev, cb){
  if (!ev.length) { cb(); return; }
  var e = ev.shift();
  if (e[0] === 'politician') {
    talk('politician', function(){
      var cost = Math.floor(S.money * 0.25);
      var sh = sheet(E('헌금 ' + fmtM(cost) + ' 보탤까요?', 'Chip in ' + fmtM(cost) + '?'));
      el('div', null, E('의심 -40', 'Heat -40'), sh.s).style.cssText = 'text-align:center;margin-bottom:calc(var(--u)*5)';
      var r = el('div', 'row', null, sh.s);
      btn(E('보탠다', 'Chip in'), '', function(){ S.money -= cost; S.sus = clamp(S.sus - 40, 0, 100); S.flags.pol = 1; save(); A.sfx('coin'); sh.dim.remove(); runEvents(ev, cb); }, r);
      btn(E('거절', 'Refuse'), 'ply', function(){ S.flags.pol = 1; save(); sh.dim.remove(); runEvents(ev, cb); }, r);
    });
    return;
  }
  if (e[0] === 'raid') { A.sfx('siren'); var rl = pick(D.TALK.raidL.filter(function(x){ return x[0] !== S.raidLast; })); S.raidLast = rl[0]; D.TALK.raid = [['s_police', E('경찰', 'Police'), rl[0]], ['h_stand', rl[2] || E('목수', 'Carpenter'), rl[1]]]; }
  if (e[0] === 'reporter') { var pl = pick(D.TALK.reporterL.filter(function(x){ return x !== S.repLast; })); S.repLast = pl; D.TALK.reporter = [['s_reporter', E('기자', 'Reporter'), pl]]; }
  if (e[0] === 'steal') { var pool = S.act >= 9 ? D.TALK.stealA : D.TALK.stealK; S.stealLast = S.stealLast || ''; var line = pick(pool.filter(function(l){ return l !== S.stealLast; })); S.stealLast = line; D.TALK.steal = [['s_mleader', E('기계교 교주', 'Machine Cult Leader'), line]]; }
  talk(e[0], function(){ toast(e[1], 1800); hud(true); runEvents(ev, cb); });
}

/* ---------- 노가다: 못 박기 ---------- */
var WK = null;
function startWork(){
  useSlot();
  scene = 'work'; clearLayer(); hideMenu(); $('slot').classList.add('hide');
  document.body.classList.add('playing');
  var nails = [];
  for (var i = 0; i < 8; i++) nails.push({x:110 + i * 24, hp:2});
  $('goal').classList.add('hide');
  WK = {nails:nails, idx:0, t:20, sp:1.8, ph:Math.random() * 6, combo:0, perf:0, down:0, end:false, miss:0};
  var info = el('div', null, null); info.id = 'spInfo';
  el('div', 'stat', E('시간', 'Time') + ' <b id="wT">20</b>', info);
  el('div', 'stat', E('못', 'Nails') + ' <b id="wN">0</b>/8', info);
}
function gaugeP(st){ return Math.sin(st.ph); }
function judge(p){ var a = Math.abs(p); return a < 0.13 ? 2 : a < 0.4 ? 1 : 0; }
function tapWork(){
  if (WK.end || WK.down > 0.08) return;
  var j = judge(gaugeP(WK)); var n = WK.nails[WK.idx];
  WK.down = 0.18;
  if (j === 2) { n.hp -= 2; WK.perf++; WK.combo++; shake = 3; A.sfx('perfect'); pop('PERFECT', n.x, 112, '#ffd23f'); part(n.x, 138, '#ffd23f', 10, 90); part(n.x, 140, '#c48a4a', 8, 70); }
  else if (j === 1) { n.hp -= 1; WK.combo = 0; shake = 2; A.sfx('hit'); pop('GOOD', n.x, 112, '#fff'); part(n.x, 140, '#c48a4a', 6, 60); }
  else { WK.combo = 0; WK.miss++; shake = 1; A.sfx('miss'); pop('MISS', n.x, 112, '#ff5a4e'); if (WK.miss % 2 === 1) toast(E('반장: 똑바로 안 해!', 'Foreman: Do it right!'), 900); }
  if (n.hp <= 0) { n.hp = 0; A.sfx('nail'); WK.idx++; WK.sp = Math.min(3.6, WK.sp + 0.18); if (WK.idx >= WK.nails.length) finishWork(); }
  $('wN').textContent = WK.idx;
}
function stepWork(dt){
  if (WK.end) return;
  WK.ph += WK.sp * dt; WK.down -= dt; WK.t -= dt;
  $('wT').textContent = Math.max(0, Math.ceil(WK.t));
  if (WK.t <= 0) finishWork();
}
function drawGauge(cx, cy, p){
  g.fillStyle = '#2b1d14'; g.fillRect(cx - 62, cy - 6, 124, 12);
  g.fillStyle = '#7a5a3a'; g.fillRect(cx - 60, cy - 4, 120, 8);
  g.fillStyle = '#ffd23f'; g.fillRect(cx - 24, cy - 4, 48, 8);
  g.fillStyle = '#7be36b'; g.fillRect(cx - 8, cy - 4, 16, 8);
  for (var i = -60; i <= 60; i += 6) { g.fillStyle = 'rgba(43,29,20,.5)'; g.fillRect(cx + i, cy - 4, 1, i % 30 ? 2 : 4); }
  var mx = Math.round(cx + p * 60);
  g.fillStyle = '#2b1d14'; g.fillRect(mx - 3, cy - 10, 7, 20);
  g.fillStyle = '#fff'; g.fillRect(mx - 2, cy - 9, 5, 18);
}
function drawWork(){
  bg(S.flags.lastday ? 'b_boxtown' : 'b_site');
  g.fillStyle = '#2b1d14'; g.fillRect(96, 139, 200, 13);
  g.fillStyle = '#d9a35c'; g.fillRect(97, 140, 198, 11);
  g.fillStyle = '#b8803f'; g.fillRect(97, 148, 198, 3); g.fillRect(140, 143, 30, 1); g.fillRect(210, 145, 40, 1);
  g.fillStyle = '#7a4f24'; g.fillRect(100, 152, 6, 22); g.fillRect(286, 152, 6, 22);
  WK.nails.forEach(function(n, i){
    var h = n.hp === 2 ? 10 : n.hp === 1 ? 5 : 0;
    g.fillStyle = '#2b1d14'; g.fillRect(n.x - 2, 138 - h - 2, 5, 3);
    g.fillStyle = '#c9ccd4'; g.fillRect(n.x - 1, 138 - h - 1, 3, 1);
    if (h) { g.fillStyle = '#8d929c'; g.fillRect(n.x, 138 - h, 1, h + 1); g.fillStyle = '#5a5f69'; g.fillRect(n.x + 1, 138 - h, 1, h + 1); }
    if (i === WK.idx && !WK.end) { g.fillStyle = '#ffd23f'; g.fillRect(n.x - 1, 124 - (Math.floor(T * 4) % 2) * 2, 3, 3); }
  });
  var cur = WK.nails[Math.min(WK.idx, 7)];
  var hx = cur.x - 19;
  shadow(hx, 176, 24);
  spr(WK.down > 0 ? 'h_down' : 'h_up', hx, 176, true);
  if (WK.miss % 2 === 1 && WK.down > 0 && !S.flags.lastday) spr('s_boss', 300, 176, true);
  drawGauge(160, 40, gaugeP(WK));
  if (WK.combo >= 2) txt(WK.combo + ' COMBO', 160, 58, '#7be36b', 16);
}
function finishWork(){
  if (WK.end) return; WK.end = true;
  var box2 = S.flags.lastday;
  var pay = (30 + WK.idx * 12 + WK.perf * 8 + (WK.idx >= 8 ? 30 : 0)) * WON;
  if (box2) pay = Math.round(pay * 0.7);
  var fa = box2 ? Math.min(100 - S.faith, 2 + Math.floor(WK.idx / 2)) : 0;
  S.money += pay; S.faith += fa; S.shifts++; save();
  A.sfx(WK.idx >= 8 ? 'win' : 'coin');
  setTimeout(function(){
    var sh = sheet(WK.idx >= 8 ? 'CLEAR' : 'TIME UP');
    var box = el('div', null, E('못 ', 'Nails ') + WK.idx + '/8 · PERFECT ' + WK.perf + '<br>' + (box2 ? E('수리비', 'Repair pay') : E('일당', 'Daily pay')) + ' <b>+' + fmtM(pay) + '</b>' + (fa ? '<br>' + E('믿음', 'Faith') + ' <b>+' + fa + '</b>' : ''), sh.s);
    box.style.cssText = 'font-size:calc(var(--u)*8);line-height:1.6;text-align:center';
    var b = btn('OK', '', function(){ sh.dim.remove(); backToHub(); }, sh.s);
    b.style.display = 'block'; b.style.margin = 'calc(var(--u)*6) auto 0';
  }, 500);
}

/* ---------- 포장마차: 말싸움 ---------- */
var PC = null;
function startPocha(){
  useSlot(); S.money = Math.max(0, S.money - 10 * WON);
  scene = 'pocha'; clearLayer(); hideMenu(); $('slot').classList.add('hide');
  document.body.classList.add('playing');
  var pub = S.act >= 9;
  var opp = pub ? 'g' + ('0' + rnd(40)).slice(-2) : S.wins === 0 ? 's_drunk2' : pick(['s_drunk1', 's_drunk2', 'c4', 'c3', 'c9', 'c7']);
  PC = {pub:pub, fem:pub && D.GFOLK_F.indexOf(+opp.slice(1)) >= 0, Q:pub ? D.PUB : D.POCHA, opp:opp, ok:0, bad:0, drunk:0, t:0, tmax:7, cur:null, end:false, hurt:0, drink:0, lock:0};
  var sc = el('div', null, null); sc.id = 'score';
  el('div', 'stat', E('이김', 'Wins') + ' <b id="pOk">○○○</b>', sc);
  el('div', 'stat', E('원샷', 'Shots') + ' <b id="pBad">○○○</b>', sc);
  var tb = el('div', null, '<i id="pT"></i>'); tb.id = 'tbar';
  var bub = el('div', null, ''); bub.id = 'bubble';
  var rt = el('div', null, ''); rt.id = 'retorts';
  hud(true); $('goal').classList.add('hide');
  setTimeout(pochaRound, 400);
}
function dots(n){ return '●●●'.slice(0, n) + '○○○'.slice(0, 3 - n); }
function pochaRound(){
  if (PC.end) return;
  // 같은 판에 같은 질문은 다시 안 나옴. 보기는 정답 하나 + 다른 색깔 질문의 답 둘
  if (!PC.used) PC.used = [];
  var qi; do { qi = rnd(PC.Q.length); } while (PC.used.indexOf(qi) >= 0 || (PC.fem && PC.Q[qi][3] === 'm'));
  PC.used.push(qi);
  var q = PC.Q[qi], ty = q[0];
  PC.cur = {ty:ty};
  var bub = $('bubble'); bub.textContent = q[1]; bub.style.setProperty('--c', D.NEED_COL[ty]);
  var rt = $('retorts'); rt.innerHTML = '';
  var opts = [[ty, q[2]]];
  [0, 1, 2].forEach(function(t){ if (t === ty) return; var pool = PC.Q.filter(function(r){ return r[0] === t; }); opts.push([t, pick(pool)[2]]); });
  shuffle(opts).forEach(function(o){
    var t = o[0];
    var b = el('button', 'ret', PC.fem ? o[1].replace(/형님/g, '누님') : o[1], rt);
    if (PC.drunk) { b.style.filter = 'blur(' + (PC.drunk * 0.5) + 'px)'; b.style.animation = 'bob ' + (0.7 - PC.drunk * 0.12) + 's steps(2) infinite'; }
    b.onclick = function(e){ e.stopPropagation(); pochaAnswer(t); };
  });
  PC.tmax = Math.max(3.2, 7 - PC.drunk * 1.3) * 1.3; PC.t = PC.tmax; PC.lock = 0;
}
function pochaAnswer(t){
  if (PC.end || PC.lock) return;
  PC.lock = 1;
  if (t === PC.cur.ty) { PC.ok++; PC.hurt = 0.5; shake = 2; A.sfx('right'); pop('KO!', 226, 60, '#ffd23f'); part(226, 100, '#ffd23f', 12, 80); }
  else { PC.bad++; PC.drunk++; PC.drink = 1; A.sfx('wrong'); pop(E('원샷', 'SHOT!'), 96, 60, '#7be36b'); }
  $('pOk').textContent = dots(PC.ok); $('pBad').textContent = dots(PC.bad);
  $('retorts').innerHTML = '';
  if (PC.ok >= 3 || PC.bad >= 3) setTimeout(finishPocha, 700);
  else setTimeout(pochaRound, 800);
}
function stepPocha(dt){
  if (PC.end) return;
  PC.hurt -= dt; PC.drink -= dt;
  if (PC.cur && !PC.lock) { PC.t -= dt; if (PC.t <= 0) pochaAnswer(-1); }
  var bar = $('pT'); if (bar && PC.cur) bar.style.width = clamp(PC.t / PC.tmax * 100, 0, 100) + '%';
}
function drawPocha(){
  g.save();
  if (PC.drunk) { var a = Math.sin(T * 1.6) * 0.012 * PC.drunk; g.translate(160, 90); g.rotate(a); g.translate(-160 + Math.sin(T * 1.1) * PC.drunk, -90); }
  bg(PC.pub ? 'b_pub' : 'b_pocha');
  if (S.wins === 0 && !PC.pub) { shadow(160, 128, 20); spr('s_hyung', 160, 128); }
  shadow(96, 146, 26); spr(PC.drink > 0 ? 'h_drink' : 'h_point', 96, 146);
  shadow(226, 146, 26);
  var ox = 226 + (PC.hurt > 0 ? Math.round(Math.sin(T * 60) * 2) : 0);
  spr(PC.opp, ox, 146, true);
  if (PC.drunk) { g.fillStyle = 'rgba(255,90,90,' + (0.05 * PC.drunk) + ')'; g.fillRect(-10, -10, W + 20, H + 20); }
  g.restore();
}
function finishPocha(){
  PC.end = true; clearLayer();
  var win = PC.ok >= 3;
  var msg = '', after = null;
  if (win) {
    S.wins++; A.sfx('win');
    if (!S.flags.hyung) { S.flags.hyung = 1; addFol(1); msg = E('형님이 따라왔다 · 신도 +1', 'Big Bro joined you · Followers +1'); }
    else if (PC.pub) { var rp = addFol(5 + rnd(11)); msg = E('펍 손님들이 따라왔다 · 신도 +', 'Pub regulars joined you · Followers +') + rp.got; }
    else {
      var left = D.POCHA_FOLK.filter(function(f){ return S.dex.indexOf(f) < 0; });
      if (left.length) { var f = pick(left); S.dex.push(f); var r = addFol(1); msg = D.ALLFOLK[f].n + E(' · 신도 +', ' · Followers +') + r.got; after = f; }
      else { var r2 = addFol(1 + rnd(3)); msg = E('술친구 · 신도 +', 'Drinking buddy · Followers +') + r2.got; }
    }
    S.faith = clamp(S.faith + 3, 0, 100);
  } else { A.sfx('lose'); msg = E('필름이 끊겼다', 'Blacked out'); }
  save();
  var sh = sheet(win ? 'WIN' : 'LOSE');
  el('div', null, msg, sh.s).style.cssText = 'font-size:calc(var(--u)*8);text-align:center';
  var b = btn('OK', '', function(){ sh.dim.remove(); if (after != null) showFolk(after, backToHub); else backToHub(); }, sh.s);
  b.style.display = 'block'; b.style.margin = 'calc(var(--u)*6) auto 0';
}
function showFolk(f, cb){
  A.sfx('convert');
  talk([[fimg(f), D.ALLFOLK[f].n, D.ALLFOLK[f].l]], cb);
  toast(E('도감 ', 'Dex ') + S.dex.length + '/' + DEXN, 1500);
}

/* ---------- 연설 ---------- */
function openTowns(){
  if (S.act < 7) { startSpeech(0); return; }
  var sh = sheet(E('어디서 연설할까요?', 'Where will you speak?'));
  var list = el('div', 'list', null, sh.s);
  D.TOWN.forEach(function(t, i){
    var need = t.k === 'valley' ? 10 : t.abroad ? 9 : t.k === 'machine' ? 8 : 0;
    if (t.abroad && S.act < 9) return;
    var lock = S.act < need, fin = !!S.branch[t.k];
    var got = t.folk.filter(function(f){ return S.dex.indexOf(f) >= 0; }).length;
    var it = el('div', 'item' + (lock ? ' lock' : '') + (S.branch[t.k] ? ' done' : ''), null, list);
    el('img', null, null, it).src = 'img/' + t.bg + '.png';
    el('div', null, '<div class="t">' + t.n + '</div><div class="s">' + (fin ? E('매일 헌금 +', 'Daily offerings +') + fmtM(t.mult * 40 * WON * GV[S.bl] * (S.deco.dish ? 2 : 1)) + E(' · 신도 +', ' · Followers +') + fmt((S.bpop && S.bpop[t.k]) || t.mult * 4) : E('한 명당 ' + t.mult + '명 · 도감 ', 'x' + t.mult + ' per convert · Dex ') + got + '/' + t.folk.length) + '</div>', it);
    it.onclick = function(){ if (fin) { toast(E('지부 완성', 'Branch complete')); return; } if (lock) { toast(t.k === 'valley' ? E('해외 지부 4곳부터', 'Needs 4 overseas branches') : E('지부 6곳부터', 'Needs 6 branches')); return; } A.sfx('tap'); sh.dim.remove(); startSpeech(i); };
  });
  var b = btn(E('닫기', 'Close'), 'ply', function(){ sh.dim.remove(); }, sh.s);
  b.style.display = 'block'; b.style.margin = 'calc(var(--u)*6) auto 0';
}
var SP = null;
function startSpeech(ti){
  useSlot();
  var town = D.TOWN[ti];
  scene = 'speech'; clearLayer(); hideMenu(); $('slot').classList.add('hide');
  document.body.classList.add('playing');
  var n = town.crowd, npcs = [];
  var xsL = [], xsR = [];
  var per = Math.ceil(n / 2);
  var backN = Math.floor(per / 2), frontN = per - backN;
  // 앞줄은 고르게, 뒷줄은 앞줄 사이사이에 엇갈려 서서 전단지로 노릴 수 있게
  function rowXs(cnt, side, row){
    var a = [], x0 = side < 0 ? 18 : 200, span = 100, step = span / Math.max(1, frontN - 1);
    for (var i = 0; i < cnt; i++) {
      var x = row === 0 ? (frontN === 1 ? x0 + span / 2 : x0 + i * step) : x0 + step / 2 + i * step;
      a.push(Math.round(Math.max(12, Math.min(side < 0 ? 140 : 308, x))));
    }
    return a;
  }
  var spots = [];
  [-1, 1].forEach(function(side){
    rowXs(backN, side, 1).forEach(function(x){ spots.push({x:x, y:128}); });
    rowXs(frontN, side, 0).forEach(function(x){ spots.push({x:x, y:146}); });
  });
  spots = spots.slice(0, n);
  var namedLeft = town.folk.filter(function(f){ return S.dex.indexOf(f) < 0; });
  var named = namedLeft.length ? pick(namedLeft) : -1;
  var mach = town.k === 'machine' || town.k === 'valley';
  var robots = mach ? (town.k === 'valley' ? 4 : 3) : 0;
  var pre = town.abroad ? 'x' : 'c', cpre = town.abroad ? 'y' : 'v';
  var reporter = !mach && S.sus > 50;
  shuffle(spots);
  spots.forEach(function(p, i){
    var o = {x:p.x, y:p.y, conv:0, need:rnd(3), done:false, kind:'folk', shake:0, gone:false, ci:0, cpre:cpre};
    if (mach) { o.spr = 's_mcultist'; o.ci = rnd(10); o.kind = 'cult'; }
    else { o.ci = town.pool.length ? pick(town.pool) : rnd(10); o.spr = pre + o.ci; }
    if (i < robots) { o.kind = 'robot'; o.spr = 's_robot'; }
    else if (i === robots && named >= 0) { o.kind = 'named'; o.folk = named; }
    else if (i === robots + 1 && reporter) { o.kind = 'reporter'; o.spr = 's_reporter'; }
    if (S.deco.mega && (o.kind === 'folk' || o.kind === 'named' || o.kind === 'cult')) o.conv = 15;
    npcs.push(o);
  });
  // 국내·해외 덱은 따로. 해외 덱엔 국내에서 얻은 공용 카드(망치 쇼 등)도 따라옴
  if (town.abroad) S.deck.forEach(function(i){ if (!D.CARDS[i].w && S.deckA.indexOf(i) < 0) S.deckA.push(i); });
  var reg = town.abroad ? 'a' : 'k';
  var deck = shuffle((town.abroad ? S.deckA : S.deck).filter(function(i){ var w = D.CARDS[i].w; return !w || w === reg; }));
  SP = {town:town, ti:ti, npcs:npcs, deck:deck, di:0, hand:[], turn:0, turns:6, phase:'pick', card:null, ph:0, sp:3.2, dbl:false, pose:0, poseN:'h_speech', end:false, conv:0};
  for (var k = 0; k < 4; k++) SP.hand.push(drawCard());
  var info = el('div', null, null); info.id = 'spInfo';
  el('div', 'stat', town.n, info);
  el('div', 'stat', E('차례', 'Turn') + ' <b id="sTurn">1</b>/<span id="sTurns">6</span>', info);
  el('div', 'stat', E('신도', 'Followers') + ' <b id="sConv">0</b>', info);
  el('div', null, null).id = 'hand';
  renderHand();
  hud(true); $('goal').classList.add('hide');
}
function drawCard(){
  // 손패에 같은 카드가 겹치지 않게, 덱을 다 돌면 다시 섞음
  for (var tries = 0; tries < SP.deck.length; tries++) {
    if (SP.di >= SP.deck.length) { SP.deck = shuffle(SP.deck); SP.di = 0; }
    var c = SP.deck[SP.di++];
    if (SP.hand.indexOf(c) < 0 && c !== SP.last) return c;
  }
  return SP.deck[(SP.di++) % SP.deck.length];
}
function canConv(o){ return !o.done && !o.gone && (o.kind === 'folk' || o.kind === 'named' || o.kind === 'cult'); }
function cardColor(c){ return c.t >= 0 ? D.NEED_COL[c.t] : c.t === -1 ? '#c9a2ff' : '#9fe39a'; }
function cardType(c){ return c.t >= 0 ? D.NEED_NAME[c.t] : c.t === -1 ? E('모두', 'All') : E('특수', 'Special'); }
function cardHtml(c, big){
  return '<span class="ty">' + cardType(c) + '</span>' + c.n.replace(/ (\S{1,3})$/, ' $1') + (c.p ? '<span class="pw">' + E('힘 ', 'Power ') + c.p + '</span>' : '') + (big && c.fx ? '<span class="fx">' + D.CARD_FX[c.fx] + '</span>' : (c.fx && !c.p ? '<span class="pw">' + D.CARD_FX[c.fx] + '</span>' : ''));
}
function renderHand(){
  var h = $('hand'); if (!h) return; h.innerHTML = '';
  if (SP.phase !== 'pick') return;
  SP.hand.forEach(function(ci, idx){
    var c = D.CARDS[ci];
    var b = el('button', 'card' + (c.r === 3 ? ' gold' : ''), cardHtml(c), h);
    b.style.setProperty('--c', cardColor(c));
    b.onclick = function(e){ e.stopPropagation(); playCard(idx); };
  });
}
function playCard(idx){
  if (SP.phase !== 'pick' || SP.end) return;
  var ci = SP.hand[idx], c = D.CARDS[ci];
  A.sfx('card');
  SP.hand[idx] = -1; SP.last = ci; SP.hand[idx] = drawCard();
  if (c.fx === 'redraw') { SP.hand = []; for (var k = 0; k < 4; k++) SP.hand.push(drawCard()); toast(E('손패 새로', 'New hand')); renderHand(); return; }
  if (c.fx === 'double') { SP.dbl = true; toast(E('다음 카드 두 배', 'Next card x2')); renderHand(); return; }
  if (c.fx === 'turns') { SP.turns += 2; $('sTurns').textContent = SP.turns; toast(E('남은 차례 +2', 'Turns +2')); renderHand(); return; }
  SP.card = c; SP.phase = 'aim'; SP.drag = null; SP.drag0 = null; SP.shot = null; SP.mega = null; SP.wave = null;
  renderHand();
  toast(c.n, 900);
}
/* 전단지 새총: 화면 아무 데나 누르고 뒤로 당겼다 놓으면 포물선으로 날아감 */
var SLING = {x:160, y:98}, SL_K = 4.5, SL_G = 260, SL_MAX = 46;
function gpt(e){ var r = $('cv').getBoundingClientRect(); return {x:(e.clientX - r.left) / r.width * 320, y:(e.clientY - r.top) / r.height * 180}; }
function dragStart(e){ if (!SP || SP.phase !== 'aim' || SP.shot || SP.mega || !e) return; if (SP.town.abroad) { megaStart(e); return; } SP.drag0 = gpt(e); SP.drag = SP.drag0; }
window.addEventListener('pointermove', function(e){ if (scene === 'speech' && SP && SP.mega && e) { var mp = gpt(e); SP.mega.x = mp.x; SP.mega.y = mp.y; var ma = megaAim(SP.mega), st = ma ? Math.round((1 - ma.s) * 5) : -1; if (st !== SP.pullStep) { if (st > (SP.pullStep || 0)) A.sfx('pull', st + 1); SP.pullStep = st; } return; } if (scene === 'speech' && SP && SP.drag) { SP.drag = gpt(e); var st = Math.floor(pullVec().l / 9); if (st !== SP.pullStep) { if (st > (SP.pullStep || 0)) A.sfx('pull', st); SP.pullStep = st; } } });
window.addEventListener('pointerup', function(e){ if (scene === 'speech' && SP && SP.mega) { megaRelease(false); return; } if (scene === 'speech' && SP && SP.drag) { SP.drag = gpt(e); launch(); } });
window.addEventListener('pointercancel', function(){ if (SP) { SP.drag = null; SP.mega = null; } });
function pullVec(){
  var dx = SP.drag0.x - SP.drag.x, dy = SP.drag0.y - SP.drag.y, l = Math.hypot(dx, dy);
  if (l > SL_MAX) { dx *= SL_MAX / l; dy *= SL_MAX / l; l = SL_MAX; }
  return {dx:dx, dy:dy, l:l};
}
function launch(){
  var p = pullVec(); SP.drag = null;
  if (p.l < 5) return;
  SP.shot = {x:SLING.x, y:SLING.y, vx:p.dx * SL_K, vy:p.dy * SL_K, rot:0, pw:p.l / SL_MAX}; SP.snap = 0.35; SP.pullStep = 0; A.sfx('whoosh'); part(SLING.x, SLING.y + 4, '#c9b48f', 6, 50); shake = Math.max(shake, 1 + p.l / SL_MAX * 2);
  SP.pose = 0.7; SP.poseN = SP.turn % 2 ? 'h_up' : 'h_shout';
  A.sfx('card');
}
function bodyHit(o, x, y){ return !o.gone && Math.abs(x - o.x) < 9 && y > o.y - 50 && y < o.y - 4; }
function stepShot(dt){
  var sh = SP.shot; if (!sh) return;
  for (var k = 0; k < 3; k++) {
    var d = dt / 3;
    sh.vy += SL_G * d; sh.x += sh.vx * d; sh.y += sh.vy * d; sh.rot += d * 14;
    if (k === 1) parts.push({k:'trail', x:sh.x + (Math.random() - .5) * 3, y:sh.y + (Math.random() - .5) * 3, vx:-sh.vx * 0.05, vy:-sh.vy * 0.05, c:Math.random() < .5 ? '#fbf3df' : cardColor(SP.card), t:0.28, s:Math.random() < .4 ? 2 : 1});
    var hitO = null;
    if (sh.vy > 0) SP.npcs.forEach(function(o){ if (hitO || o.done) return; if ((canConv(o) || o.kind === 'robot' || o.kind === 'reporter') && bodyHit(o, sh.x, sh.y)) hitO = o; });
    if (hitO) { land(sh.x, sh.y, hitO); return; }
    if (sh.y >= 152 || sh.x < -12 || sh.x > 332) { land(sh.x, Math.min(sh.y, 152), null); return; }
  }
}
function knock(o, dir, f){ o.kx = o.kx || 0; o.ky = o.ky || 0; o.kvx = dir * (40 + 60 * f); o.kvy = -(70 + 90 * f); }
function roll(o, dir, what){
  o.gone = true; o.roll = {x:o.x, y:o.y - 20, vx:dir * 140, vy:-150, a:0};
  if (what === 'robot') { A.sfx('smash'); part(o.x, o.y - 20, '#c9ccd4', 20, 130); part(o.x, o.y - 20, '#5aa8ff', 8, 110); pop(E('부숨!', 'SMASH!'), o.x, o.y - 50, '#5aa8ff'); }
  else pop(E('쫓아냄', 'KICKED OUT'), o.x, o.y - 50, '#5aa8ff');
}
function land(x, y, direct){
  var c = SP.card; SP.shot = null; SP.phase = 'anim';
  var R = c.fx === 'all' ? 56 : 44;
  var mult = SP.dbl ? 2 : 1; SP.dbl = false;
  part(x, y, '#fbf3df', 14, 120); part(x, y, cardColor(c), 10, 100);
  sheets(x, y, cardColor(c), c.fx === 'all' ? 34 : 22, c.fx === 'all' ? 150 : 110); ring(x, direct ? direct.y : Math.min(152, y + 6), cardColor(c), R + 10); SP.flash = 0.12; SP.flashX = x; SP.flashY = y;
  var newly = [], hits = 0;
  SP.npcs.forEach(function(o){
    if (o.gone) return;
    var isD = o === direct;
    var d = Math.abs(o.x - x) + Math.abs(o.y - 26 - y) * 0.3;
    if (!isD && d > R) { if (canConv(o) && (c.t === -1 || c.t === o.need)) { o.conv += c.p * 6 * mult; if (o.conv >= 100) newly.push(o); } return; }
    var f = isD ? 1 : Math.max(0.3, 1 - d / R), dir = o.x >= x ? 1 : -1;
    if (o.kind === 'robot') { if (isD || f > 0.5) roll(o, dir, 'robot'); return; }
    if (o.kind === 'reporter') { if (isD) roll(o, dir, 'reporter'); return; }
    if (!canConv(o)) return;
    hits++; knock(o, dir, f);
    var match = c.t === -1 || c.t === o.need;
    o.conv += (match ? c.p * 38 : c.p * 4) * (0.6 + f) * mult;
    if (match) o.shake = 0.3;
    if (o.conv >= 100) newly.push(o);
  });
  if (c.fx === 'smash') SP.npcs.forEach(function(o){ if (o.kind === 'robot' && !o.gone && Math.abs(o.x - x) < 80) roll(o, o.x >= x ? 1 : -1, 'robot'); });
  var good = direct && direct.kind !== 'robot' && direct.kind !== 'reporter';
  shake = Math.min(9, (good ? 4 : 2) + hits * 0.8);
  if (good || hits >= 3) SP.freeze = good && hits >= 3 ? 0.16 : 0.09;
  if (hits >= 2) { setTimeout(function(){ pop(E(hits + '명 명중!', hits + ' HITS!'), clamp(x, 50, 270), Math.max(40, y - 24) + 22, hits >= 4 ? '#ffd23f' : '#fff', hits >= 4 ? 22 : 18); A.sfx('combo', hits); }, 180); }
  A.sfx(good ? 'perfect' : hits ? 'hit' : 'miss');
  pop(good ? 'PERFECT' : hits ? 'GOOD' : 'MISS', x, Math.max(40, y - 24), good ? '#ffd23f' : hits ? '#fff' : '#ff5a4e');
  if (c.fx === 'spread') newly.slice().forEach(function(o){ SP.npcs.forEach(function(q){ if (canConv(q) && q !== o && Math.abs(q.x - o.x) < 50) { q.conv += 22; knock(q, q.x >= o.x ? 1 : -1, 0.3); if (q.conv >= 100 && newly.indexOf(q) < 0) newly.push(q); } }); });
  if (c.fx === 'kick') SP.npcs.forEach(function(o){ if ((o.kind === 'robot' || o.kind === 'reporter') && !o.gone) roll(o, o.x >= 160 ? 1 : -1, o.kind); });
  if (c.fx === 'calm') { S.sus = Math.max(0, S.sus - 8); pop(E('의심 -8', 'Heat -8'), 160, 70, '#5aa8ff'); }
  setTimeout(function(){ newly.forEach(function(o, i){ setTimeout(function(){ convert(o); }, i * 160); }); }, 300);
  setTimeout(endTurn, 1100 + newly.length * 160);
}
function stepBodies(dt){
  SP.npcs.forEach(function(o){
    if (o.kvx || o.kvy || o.ky) {
      o.kvy += 420 * dt; o.kx += o.kvx * dt; o.ky += o.kvy * dt;
      if (o.ky >= 0) { o.ky = 0; o.kvy = 0; o.kvx *= 0.4; }
      if (o.ky === 0) { o.kx *= Math.max(0, 1 - 5 * dt); if (Math.abs(o.kx) < 0.3) { o.kx = 0; o.kvx = 0; } }
    }
    var r = o.roll; if (r && r.x > -40 && r.x < 360) {
      r.vy += 420 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.vx * dt / 14;
      if (r.y > o.y - 20) { r.y = o.y - 20; r.vy = -Math.abs(r.vy) * 0.35; r.vx *= 0.9; }
    }
  });
}
function sprRot(n, x, cy, a, flip){
  var im = IMG[n]; if (!im || !im.width) return;
  var w = im.width / SC, h = im.height / SC;
  g.save(); g.translate(x, cy); g.rotate(a); if (flip) g.scale(-1, 1);
  g.imageSmoothingEnabled = K < SC; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h); g.restore(); g.imageSmoothingEnabled = false;
}
function flyer(x, y, a, col){
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = '#2b1d14'; g.fillRect(-9, -7, 18, 14);
  g.fillStyle = '#fbf3df'; g.fillRect(-8, -6, 16, 12);
  g.fillStyle = col; g.fillRect(-8, -6, 16, 4);
  g.fillStyle = '#c9b48f'; g.fillRect(-5, 0, 10, 1); g.fillRect(-5, 2, 8, 1); g.fillRect(-5, 4, 9, 1);
  g.restore();
}
function drawSling(){
  var c = SP.card; if (!c) return;
  var col = cardColor(c);
  if (SP.flash > 0) { var fa = Math.min(1, SP.flash / 0.12); g.globalAlpha = fa * 0.8; g.fillStyle = '#fff'; g.beginPath(); g.arc(SP.flashX, SP.flashY, 6 + (1 - fa) * 18, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  if (SP.snap > 0) { var sv = Math.sin(SP.snap * 60) * SP.snap * 14; g.strokeStyle = '#c0392b'; g.lineWidth = 1; g.beginPath(); g.moveTo(SLING.x - 7, SLING.y); g.lineTo(SLING.x, SLING.y + sv); g.lineTo(SLING.x + 7, SLING.y); g.stroke(); }
  if (SP.shot) { var s2 = 1 + (SP.shot.pw || 0) * 0.15; g.save(); g.translate(SP.shot.x, SP.shot.y); g.scale(s2, s2); flyer(0, 0, SP.shot.rot, col); g.restore(); return; }
  if (SP.phase !== 'aim') return;
  var px = SLING.x, py = SLING.y + Math.round(Math.sin(T * 4));
  if (SP.drag) {
    var p = pullVec(); px = SLING.x - p.dx; py = SLING.y - p.dy;
    var x = SLING.x, y = SLING.y, vx = p.dx * SL_K, vy = p.dy * SL_K;
    for (var i = 0; i < 40; i++) {
      vy += SL_G * 0.04; x += vx * 0.04; y += vy * 0.04;
      if (y > 152 || x < 0 || x > 320) break;
      if (i % 2 === 0) { g.fillStyle = '#2b1d14'; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5); g.fillStyle = '#fff'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
    }
    var pw = p.l / SL_MAX, full = pw > 0.92;
    if (full) { px += Math.round((Math.random() - .5) * 2); py += Math.round((Math.random() - .5) * 2); }
    g.strokeStyle = '#2b1d14'; g.lineWidth = 2 + pw * 1.5; g.beginPath(); g.moveTo(SLING.x - 7, SLING.y); g.lineTo(px, py); g.lineTo(SLING.x + 7, SLING.y); g.stroke();
    g.strokeStyle = full ? (Math.floor(T * 14) % 2 ? '#ffd23f' : '#ff5a4e') : pw > 0.6 ? '#ff7a3c' : '#c0392b'; g.lineWidth = 1 + pw * 0.8; g.beginPath(); g.moveTo(SLING.x - 7, SLING.y); g.lineTo(px, py); g.lineTo(SLING.x + 7, SLING.y); g.stroke();
    if (full) part(px, py, '#ffd23f', 1, 30);
  }
  flyer(px, py, SP.drag ? 0 : Math.sin(T * 3) * 0.2, col);
}
/* 해외 연설: 확성기 조준. 화면을 누르고 쏠 쪽으로 끌면 그 방향으로 겨눔(알까기처럼 각도가 중요).
   짧게 끌면 넓게(여러 명에게 조금), 길게 끌면 좁게(몇 명에게 크게). 놓으면 음파가 나감. 시간 제한 없음. */
/* 음파는 확성기 입에서 나가고, 사람은 가슴 높이로 맞는다 */
function mgOX(th){ return 184; }   // 확성기는 오른손에 고정, 음파는 늘 그 입에서
function mgDY(o){ return (o.y - 36 - MG_OY) * MG_YS; }
var MG_OY = 104, MG_YS = 3, MG_SPEED = 260, MG_OY_DRAW = 104;
function megaStart(e){ var p = gpt(e); SP.mega = {x0:p.x, y0:p.y, x:p.x, y:p.y}; }
function megaAim(m){
  var dx = m.x - m.x0, dy = m.y - m.y0, l = Math.hypot(dx, dy);
  if (l < 6) return null;
  var s = 1 - Math.min(1, (l - 6) / 60);          // 1 = 넓게, 0 = 좁게
  return {th:Math.atan2(dy * MG_YS, dx), s:s};      // 위아래로 조금만 틀어도 앞줄·뒷줄이 갈림
}
function coneHa(s){ return 0.09 + 0.85 * s; }
function coneMax(s){ return 175 - 70 * s; }
function conePow(s){ return 2.1 - 1.5 * s; }      // 좁게 2.1배, 넓게 0.6배
function angDiff(a, b){ var d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function inCone(o, th, ha){ var dx = o.x - mgOX(th), dy = mgDY(o); return Math.abs(angDiff(Math.atan2(dy, dx), th)) <= ha; }
function megaRelease(){
  var m = SP.mega; SP.mega = null; if (!m) return;
  var a = megaAim(m); if (!a) return;
  SP.lastTh = a.th; SP.lastS = a.s;
  SP.pose = 0.7; SP.poseN = 'h_shout';
  SP.phase = 'wave';
  SP.wave = {th:a.th, s:a.s, ha:coneHa(a.s), max:coneMax(a.s), pf:conePow(a.s), r:10, hit:[], newly:[], hits:0, shield:[]};
  A.sfx('whoosh'); A.sfx('smash'); shake = 2;
}
function stepMega(dt){
  var w = SP.wave; if (!w) return;
  w.r += MG_SPEED * dt;
  var c = SP.card, mult = SP.dbl ? 2 : 1;
  var list = SP.npcs.filter(function(o){ return !o.gone && !o.done && w.hit.indexOf(o) < 0 && inCone(o, w.th, w.ha + 0.04); })
    .map(function(o){ var dx = o.x - mgOX(w.th), dy = mgDY(o); return {o:o, d:Math.hypot(dx, dy), a:Math.atan2(dy, dx)}; })
    .sort(function(a, b){ return a.d - b.d; });
  for (var i = 0; i < list.length; i++) {
    var o = list[i].o, d = list[i].d;
    if (d > w.r || d > w.max) break;
    w.hit.push(o);
    // 앞에 로봇이 막고 있으면 그 뒤는 안 닿음
    if (w.shield.some(function(sa){ return Math.abs(angDiff(list[i].a, sa)) < 0.22; })) continue;
    var f = w.pf * (1 - 0.2 * d / w.max);
    if (o.kind === 'robot') {
      if (w.pf >= 1.6) roll(o, Math.cos(w.th) >= 0 ? 1 : -1, 'robot');
      else { o.shake = 0.4; pop(E('튕김', 'BLOCKED'), o.x, o.y - 50, '#c9ccd4'); A.sfx('nail'); w.shield.push(list[i].a); }
      continue;
    }
    if (o.kind === 'reporter') { if (w.pf >= 1.0) roll(o, Math.cos(w.th) >= 0 ? 1 : -1, 'reporter'); continue; }
    if (!canConv(o)) continue;
    w.hits++; knock(o, Math.cos(w.th) >= 0 ? 1 : -1, Math.min(1, f / 2));
    var match = c.t === -1 || c.t === o.need;
    o.conv += (match ? c.p * 34 : c.p * 3) * f * mult * (S.deco.gmega ? 1.25 : 1);
    if (match) { o.shake = 0.3; part(o.x, o.y - 30, cardColor(c), Math.round(4 + f * 5), 60 + f * 30); }
    if (o.conv >= 100 && w.newly.indexOf(o) < 0) w.newly.push(o);
  }
  if (w.r >= w.max) waveDone();
}
function waveDone(){
  var w = SP.wave, c = SP.card; SP.wave = null; SP.phase = 'anim'; SP.dbl = false;
  var newly = w.newly;
  SP.npcs.forEach(function(o){ if (canConv(o) && w.hit.indexOf(o) < 0 && (c.t === -1 || c.t === o.need)) { o.conv += c.p * 5; if (o.conv >= 100 && newly.indexOf(o) < 0) newly.push(o); } });
  var good = newly.length >= 2;
  shake = good ? 5 : w.hits ? 2 : 1;
  A.sfx(good ? 'perfect' : w.hits ? 'hit' : 'miss');
  pop(good ? 'PERFECT' : w.hits ? 'GOOD' : 'MISS', 160, 56, good ? '#ffd23f' : w.hits ? '#fff' : '#ff5a4e');
  if (newly.length >= 2) setTimeout(function(){ pop(E(newly.length + '명 명중!', newly.length + ' HITS!'), 160, 76, newly.length >= 4 ? '#ffd23f' : '#fff', newly.length >= 4 ? 22 : 18); A.sfx('combo', newly.length); }, 180);
  if (c.fx === 'smash') SP.npcs.forEach(function(o){ if (o.kind === 'robot' && !o.gone) roll(o, o.x >= 160 ? 1 : -1, 'robot'); });
  if (c.fx === 'spread') newly.slice().forEach(function(o){ SP.npcs.forEach(function(q){ if (canConv(q) && q !== o && Math.abs(q.x - o.x) < 50) { q.conv += 22; knock(q, q.x >= o.x ? 1 : -1, 0.3); if (q.conv >= 100 && newly.indexOf(q) < 0) newly.push(q); } }); });
  if (c.fx === 'kick') SP.npcs.forEach(function(o){ if ((o.kind === 'robot' || o.kind === 'reporter') && !o.gone) roll(o, o.x >= 160 ? 1 : -1, o.kind); });
  if (c.fx === 'calm') { S.sus = Math.max(0, S.sus - 8); pop(E('의심 -8', 'Heat -8'), 160, 70, '#5aa8ff'); }
  setTimeout(function(){ newly.forEach(function(o, i){ setTimeout(function(){ convert(o); }, i * 160); }); }, 300);
  setTimeout(endTurn, 1000 + newly.length * 160);
}
function megaphone(x, y, dir, col){
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.fillStyle = '#2b1d14'; g.fillRect(-2, -5, 6, 10); g.beginPath(); g.moveTo(3, -5); g.lineTo(15, -10); g.lineTo(15, 10); g.lineTo(3, 5); g.fill();
  g.fillStyle = '#f2f2f2'; g.fillRect(-1, -4, 4, 8); g.beginPath(); g.moveTo(4, -4); g.lineTo(14, -8); g.lineTo(14, 8); g.lineTo(4, 4); g.fill();
  g.fillStyle = col; g.fillRect(12, -8, 2, 16);
  g.restore();
}
// 바닥 위 부채꼴 (세로는 눌러 그림)
function conePath(th, ha, r0, r1){
  g.beginPath();
  for (var i = 0; i <= 16; i++) { var a = th - ha + 2 * ha * i / 16; var x = mgOX(th) + Math.cos(a) * r1, y = MG_OY + Math.sin(a) * r1 / MG_YS; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (i = 16; i >= 0; i--) { a = th - ha + 2 * ha * i / 16; g.lineTo(mgOX(th) + Math.cos(a) * r0, MG_OY + Math.sin(a) * r0 / MG_YS); }
  g.closePath();
}
function coneArc(th, ha, r, col, a, lw){
  g.globalAlpha = a; g.beginPath();
  for (var i = 0; i <= 16; i++) { var t = th - ha + 2 * ha * i / 16, x = mgOX(th) + Math.cos(t) * r, y = MG_OY + Math.sin(t) * r / MG_YS; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.strokeStyle = '#2b1d14'; g.lineWidth = (lw || 2) + 2; g.stroke(); g.strokeStyle = col; g.lineWidth = lw || 2; g.stroke(); g.globalAlpha = 1;
}
function drawMega(){
  var c = SP.card; if (!c) return;
  var col = cardColor(c);
  if (SP.wave) {
    var w = SP.wave;
    for (var k = 0; k < 4; k++) { var r = w.r - k * 12; if (r > 8) coneArc(w.th, w.ha, Math.min(r, w.max), col, Math.max(0.15, 1 - k * 0.25) * (w.r > w.max - 20 ? Math.max(0, (w.max - w.r) / 20 + 0.2) : 1), 1 + w.pf); }
    megaphone(170, MG_OY_DRAW, 1, col); return;
  }
  if (SP.phase !== 'aim') return;
  var a = SP.mega ? megaAim(SP.mega) : null;
  if (!a) {
    megaphone(170, MG_OY_DRAW, 1, col);
    return;
  }
  var dir = Math.cos(a.th) >= 0 ? 1 : -1, ha = coneHa(a.s), mx = coneMax(a.s), pf = conePow(a.s);
  megaphone(170, MG_OY_DRAW, 1, col);
  // 겨눈 부채꼴: 좁을수록 진하고 굵게
  g.globalAlpha = 0.3 + 0.2 * (1 - a.s) + 0.05 * Math.sin(T * 8); g.fillStyle = col; conePath(a.th, ha, 0, mx); g.fill(); g.globalAlpha = 1;
  coneArc(a.th, ha, mx, col, 0.95, 1 + pf);
  [-ha, ha].forEach(function(e){ var t = a.th + e; for (var q = 0.06; q <= 1.001; q += 0.08) { var px = Math.round(mgOX(a.th) + Math.cos(t) * mx * q), py = Math.round(MG_OY + Math.sin(t) * mx * q / MG_YS); g.fillStyle = '#2b1d14'; g.fillRect(px - 1, py - 1, 3, 3); g.fillStyle = '#fff'; g.fillRect(px, py, 1, 1); } });
  // 닿을 사람 표시: 머리 위 작은 삼각형(좁을수록 큼)
  SP.npcs.forEach(function(o){
    if (o.gone || o.done || !inCone(o, a.th, ha + 0.04)) return;
    var dx = o.x - mgOX(a.th), dy = mgDY(o); if (Math.hypot(dx, dy) > mx) return;
    var rw = 9 + pf * 2, lw = 1 + pf;   // 발밑 고리: 좁을수록 굵게
    g.lineWidth = lw + 2; g.strokeStyle = '#2b1d14'; g.beginPath(); g.ellipse(o.x, o.y - 1, rw, rw * 0.35, 0, 0, Math.PI * 2); g.stroke();
    g.lineWidth = lw; g.strokeStyle = o.kind === 'robot' ? '#c9ccd4' : '#ffd23f'; g.stroke();
  });
  txt(a.s > 0.66 ? E('넓게', 'WIDE') : a.s < 0.33 ? E('좁게', 'NARROW') : E('보통', 'NORMAL'), 160, 56, a.s < 0.33 ? '#ffd23f' : '#fff', 12);
}
function convert(o){
  if (o.done) return;
  o.done = true; o.conv = 100; SP.conv++;
  o.spr = (o.cpre || 'v') + o.ci;
  A.sfx('convert'); part(o.x, o.y - 30, '#ffd23f', 14, 90); part(o.x, o.y - 30, '#fff', 6, 60); beam(o.x, o.y); ring(o.x, o.y, '#ffd23f', 26); o.jump = 0.5;
  pop('+' + SP.town.mult, o.x, o.y - 52, '#7be36b', 16);
  SP.npcs.forEach(function(q){ if (canConv(q) && Math.abs(q.x - o.x) < 34 && q !== o) q.conv += 5; });
  $('sConv').textContent = fmt(SP.conv * SP.town.mult);
}
function temp(){ var a = SP.npcs.filter(function(o){ return o.kind === 'folk' || o.kind === 'named' || o.kind === 'cult'; }); var s = 0; a.forEach(function(o){ s += Math.min(100, o.conv); }); return a.length ? s / a.length : 0; }
function endTurn(){
  if (SP.end) return;
  SP.npcs.forEach(function(o){
    if (o.kind === 'robot' && !o.gone) SP.npcs.forEach(function(q){ if (canConv(q) && Math.abs(q.x - o.x) < 50) q.conv = Math.max(0, q.conv - 6); });
    if (o.kind === 'reporter' && !o.gone) { if (temp() >= 70) { o.gone = true; toast(E('기자가 돌아갔다', 'The reporter left')); } else SP.npcs.forEach(function(q){ if (canConv(q)) q.conv = Math.max(0, q.conv - 3); }); }
    if (canConv(o) && Math.random() < 0.25) o.need = rnd(3);
  });
  SP.turn++;
  var left = SP.npcs.filter(canConv).length;
  if (SP.turn >= SP.turns || left === 0) { finishSpeech(); return; }
  $('sTurn').textContent = SP.turn + 1;
  SP.phase = 'pick'; renderHand();
}
function stepSpeech(dt){
  SP.flash = Math.max(0, (SP.flash || 0) - dt); SP.snap = Math.max(0, (SP.snap || 0) - dt);
  if (SP.freeze > 0) { SP.freeze -= dt; return; }
  SP.npcs.forEach(function(o){ if (o.jump > 0) o.jump -= dt; });
  stepShot(dt); stepMega(dt); stepBodies(dt);
  SP.pose -= dt;
  SP.npcs.forEach(function(o){ o.shake -= dt; });
}
function drawNeed(o, x, top){
  if (!canConv(o)) return;
  var col = D.NEED_COL[o.need];
  var y = top - 14;
  g.fillStyle = '#2b1d14'; g.fillRect(x - 6, y - 1, 13, 11); g.fillRect(x - 1, y + 10, 3, 2);
  g.fillStyle = col; g.fillRect(x - 5, y, 11, 9); g.fillRect(x, y + 9, 1, 2);
  g.fillStyle = '#2b1d14';
  if (o.need === 0) { g.fillRect(x - 3, y + 2, 2, 2); g.fillRect(x + 2, y + 2, 2, 2); g.fillRect(x - 3, y + 5, 7, 1); g.fillRect(x - 2, y + 6, 5, 1); }
  else if (o.need === 1) { g.fillRect(x - 3, y + 2, 2, 1); g.fillRect(x - 2, y + 3, 2, 1); g.fillRect(x + 2, y + 2, 2, 1); g.fillRect(x + 1, y + 3, 2, 1); g.fillRect(x - 2, y + 6, 5, 1); }
  else { g.fillRect(x - 3, y + 3, 2, 1); g.fillRect(x + 2, y + 3, 2, 1); g.fillStyle = '#fff'; g.fillRect(x - 3, y + 5, 1, 2); g.fillStyle = '#2b1d14'; g.fillRect(x - 1, y + 7, 3, 1); }
  g.fillStyle = '#2b1d14'; g.fillRect(x - 8, top - 3, 17, 3);
  g.fillStyle = '#7be36b'; g.fillRect(x - 7, top - 2, Math.round(15 * Math.min(100, o.conv) / 100), 1);
}
function drawSpeech(){
  bg(SP.town.bg);
  var list = SP.npcs.slice().sort(function(a, b){ return a.y - b.y; });
  list.forEach(function(o){
    if (o.gone) { if (o.roll && o.roll.x > -40 && o.roll.x < 360) sprRot(o.spr, o.roll.x, o.roll.y, o.roll.a, o.x > 160); return; }
    var im = IMG[o.spr];
    var kx = Math.round(o.kx || 0), ky = Math.round(o.ky || 0);
    var sx = o.x + kx + (o.shake > 0 ? Math.round(Math.sin(T * 50)) : 0);
    var bob = o.done ? -Math.abs(Math.round(Math.sin(T * 7 + o.x) * 2)) : 0;
    if (o.jump > 0) bob -= Math.round(Math.sin((0.5 - o.jump) / 0.5 * Math.PI) * 12);
    shadow(o.x + kx, o.y, 18);
    spr(o.spr, sx, o.y + ky + bob, o.x > 160);
    var top = o.y - (im && im.height ? im.height / SC : 60);
    if (o.kind === 'named' && !o.done) { g.fillStyle = '#ffd23f'; g.fillRect(o.x + 7, top - 18, 3, 3); g.fillRect(o.x + 6, top - 17, 5, 1); g.fillRect(o.x + 8, top - 19, 1, 5); }
    drawNeed(o, o.x + kx, top + ky);
  });
  shadow(160, 144, 34);
  if (robe('h_stand') !== 'h_stand') { spr('o_crate', 160, 146); spr(SP.pose > 0 ? 'h_lord_cheer' : 'h_lord', 160, 136); }
  else if (SP.pose > 0) { spr('o_crate', 160, 146); spr(SP.poseN, 160, 136); }
  else spr('h_speech', 160, 144);
  g.fillStyle = '#2b1d14'; g.fillRect(118, 21, 84, 6);
  g.fillStyle = '#5a3a2a'; g.fillRect(119, 22, 82, 4);
  g.fillStyle = '#ff7a3a'; g.fillRect(119, 22, Math.round(82 * temp() / 100), 4);
  g.fillStyle = '#ffd23f'; g.fillRect(119 + Math.round(82 * 0.7), 20, 1, 8);
  if (SP.town.abroad) drawMega(); else drawSling();
}
function finishSpeech(){
  SP.end = true; SP.phase = 'end'; renderHand();
  var all = SP.npcs.filter(function(o){ return o.kind === 'folk' || o.kind === 'named' || o.kind === 'cult'; });
  var ratio = all.length ? SP.conv / all.length : 0;
  var gain = Math.round(SP.conv * SP.town.mult * (ratio >= 1 ? 1.5 : 1) * (S.deco.van ? 1.3 : 1));
  var r = addFol(gain);
  S.speeches++; S.best = Math.max(S.best, r.got);
  S.faith = clamp(S.faith + 4 + SP.conv, 0, 100);
  if (S.act >= 4) S.sus = clamp(S.sus + Math.min(SP.conv * SP.town.mult / 30, SP.conv * 0.8) + (SP.npcs.some(function(o){ return o.kind === 'reporter' && !o.gone; }) ? 6 : 0), 0, 100);
  var newFolk = [];
  SP.npcs.forEach(function(o){ if (o.kind === 'named' && o.done && S.dex.indexOf(o.folk) < 0) { S.dex.push(o.folk); newFolk.push(o.folk); } });
  var opened = null;
  var k = SP.town.k;
  var needAct = k === 'valley' ? 10 : SP.town.abroad ? 9 : k === 'machine' ? 8 : 7;
  var dexFill = 0;
  if (!S.branch[k] && ratio >= 0.7 && S.act >= needAct) { S.branch[k] = 1; opened = SP.town.n; SP.town.folk.forEach(function(f){ if (S.dex.indexOf(f) < 0) { S.dex.push(f); dexFill++; } }); }
  save();
  A.sfx(ratio >= 0.7 ? 'cheer' : 'tap');
  setTimeout(function(){
    var sh = sheet(ratio >= 1 ? E('만장일치', 'UNANIMOUS') : ratio >= 0.7 ? E('대성공', 'HUGE SUCCESS') : ratio >= 0.4 ? E('박수', 'APPLAUSE') : E('썰렁', 'CRICKETS'));
    var lines = [E('우리 편 ', 'Converted ') + SP.conv + '/' + all.length, E('신도 <b>+', 'Followers <b>+') + fmt(r.got) + '</b>'];
    if (r.over) lines.push('<span class="no">' + E('자리 없음 ', 'No room ') + fmt(r.over) + E(' · 모임장소를 키우세요', ' · Upgrade your meeting place') + '</span>');
    if (opened) lines.push('<b>' + opened + E(' 지부 완성', ' branch complete') + '</b>');
    if (dexFill) lines.push(E('도감 <b>+', 'Dex <b>+') + dexFill + '</b>');
    el('div', null, lines.join('<br>'), sh.s).style.cssText = 'font-size:calc(var(--u)*8);line-height:1.6;text-align:center';
    var b = btn('OK', '', function(){
      sh.dim.remove();
      var chain = function(){
        if (newFolk.length) { showFolk(newFolk.shift(), chain); return; }
        if (opened && k === 'machine') { talk('machineWin', function(){ cardPick(); }); return; }
        if (opened && k === 'valley') { talk('valleyWin', function(){ cardPick(); }); return; }
        cardPick();
      };
      chain();
    }, sh.s);
    b.style.display = 'block'; b.style.margin = 'calc(var(--u)*6) auto 0';
  }, 700);
}
function cardPick(){
  var pool = [], ab = SP && SP.town && SP.town.abroad, own = ab ? S.deckA : S.deck, reg = ab ? 'a' : 'k';
  D.CARDS.forEach(function(c, i){ if (c.r > 0 && (!c.w || c.w === reg)) { var w = c.r === 1 ? 10 : c.r === 2 ? 4 : 1; if (own.indexOf(i) < 0) w *= 3; for (var k = 0; k < w; k++) pool.push(i); } });
  var opts = [];
  while (opts.length < 3) { var p = pick(pool); if (opts.indexOf(p) < 0) opts.push(p); }
  var sh = sheet(E('카드 한 장 고르기', 'Pick a card'));
  var r = el('div', 'row', null, sh.s);
  opts.forEach(function(ci){
    var c = D.CARDS[ci];
    var b = el('button', 'card big' + (c.r === 3 ? ' gold' : ''), cardHtml(c, true), r);
    b.style.setProperty('--c', cardColor(c));
    b.onclick = function(e){ e.stopPropagation(); A.sfx(c.r === 3 ? 'win' : 'buy'); own.push(ci); S.cardSeen[ci] = 1; save(); sh.dim.remove(); backToHub(); };
  });
  var s = btn(E('넘기기', 'Skip'), 'ply', function(){ sh.dim.remove(); backToHub(); }, sh.s);
  s.style.display = 'block'; s.style.margin = 'calc(var(--u)*6) auto 0';
}

/* ---------- 모임장소(상점) ---------- */
var NEED_ACT = [0, 4, 5, 6, 7, 9, 9];
function openShop(){
  var sh = sheet(D.BLDG[S.bl].n + E(' · 자리 ', ' · Room ') + (S.bl < 6 ? fmt(cap()) : E('무제한', 'Unlimited')));
  var list = el('div', 'list', null, sh.s);
  var nb = S.bl + 1;
  if (nb < D.BLDG.length) {
    var b = D.BLDG[nb], lock = S.act < NEED_ACT[nb], poor = S.money < b.cost;
    var it = el('div', 'item' + (lock ? ' lock' : ''), null, list);
    el('img', null, null, it).src = 'img/' + b.bg + '.png';
    el('div', null, '<div class="t">' + b.n + '</div><div class="s">' + E('자리 ', 'Room ') + (nb < 6 ? fmt(b.cap) : E('무제한', 'Unlimited')) + ' · <span' + (poor ? ' class="no"' : '') + '>' + fmtM(b.cost) + '</span></div>', it);
    it.onclick = function(){
      if (lock) { toast(E('아직 이릅니다', 'Not yet')); return; }
      if (poor) { A.sfx('miss'); toast(E('돈이 모자랍니다', 'Not enough money')); return; }
      S.money -= b.cost; S.bl = nb; save(); A.sfx('buy'); sh.dim.remove();
      shake = 3; part(160, 120, '#ffd23f', 30, 140);
      toast(b.n + '!', 1500); enterHub(); afterActionNoSlot();
    };
  }
  D.DECO.forEach(function(d){
    if (d.act && S.act < d.act) return;
    var own = S.deco[d.k], poor = S.money < d.cost;
    var it = el('div', 'item' + (own ? ' own' : ''), null, list);
    var im = el('img', null, null, it); im.src = 'img/' + d.img + '.png'; im.style.objectFit = 'contain'; im.style.background = '#cfe7f5';
    el('div', null, '<div class="t">' + d.n + '</div><div class="s">' + d.d + (own ? '' : ' · <span' + (poor ? ' class="no"' : '') + '>' + fmtM(d.cost) + '</span>') + '</div>', it);
    if (own) el('div', 'stamp', E('보유', 'OWNED'), it);
    it.onclick = function(){
      if (own) return;
      if (poor) { A.sfx('miss'); toast(E('돈이 모자랍니다', 'Not enough money')); return; }
      S.money -= d.cost; S.deco[d.k] = 1; save(); A.sfx('buy'); sh.dim.remove();
      part(160, 130, '#ffd23f', 20, 100); toast(d.n + '!', 1300); enterHub();
    };
  });
  var c = btn(E('닫기', 'Close'), 'ply', function(){ sh.dim.remove(); }, sh.s);
  c.style.display = 'block'; c.style.margin = 'calc(var(--u)*6) auto 0';
}
function afterActionNoSlot(){ if (!checkAct()) refreshHub(); }

/* ---------- 도감 ---------- */
function openDex(page){
  page = page || 0;
  var sh = sheet(E('신도 도감 ', 'Follower Dex ') + S.dex.length + '/' + DEXN);
  var tabs = el('div', 'row', null, sh.s); tabs.style.marginBottom = 'calc(var(--u)*4)';
  E(['국내', '해외'], ['Korea', 'Abroad']).forEach(function(t, i){
    var b = btn(t, i === page ? '' : 'ply', function(){ sh.dim.remove(); openDex(i); }, tabs);
    b.style.padding = 'calc(var(--u)*3) calc(var(--u)*8) calc(var(--u)*2)';
  });
  var gr = el('div', 'dex', null, sh.s);
  var info = el('div', null, E('얼굴을 누르면 사연이 보입니다', 'Tap a face to read their story'), sh.s);
  info.style.cssText = 'text-align:center;margin-top:calc(var(--u)*3);font-size:calc(var(--u)*6.5);min-height:calc(var(--u)*16);line-height:1.3';
  for (var j = 0; j < 40; j++) (function(i){
    var got = S.dex.indexOf(i) >= 0;
    var d = el('div', got ? '' : 'no', null, gr);
    el('img', null, null, d).src = 'img/' + fimg(i) + '.png';
    d.onclick = function(){ A.sfx('tap'); info.innerHTML = got ? '<b>' + D.ALLFOLK[i].n + '</b><br>' + D.ALLFOLK[i].l : '???'; };
  })(page * 40 + j);
  var c = btn(E('닫기', 'Close'), 'ply', function(){ sh.dim.remove(); }, sh.s);
  c.style.display = 'block'; c.style.margin = 'calc(var(--u)*4) auto 0';
}

/* ---------- 엔딩 ---------- */
var EN = null;
function startEnding(){
  scene = 'ending'; clearLayer(); hideMenu(); $('slot').classList.add('hide'); hud(false);
  A.song(1); A.sfx('cheer');
  EN = {t:0};
  talk('ending', function(){ A.sfx('win'); resultCard(); });
}
function drawEnding(dt){
  bg('b_temple');
  EN.t += dt;
  for (var row = 0; row < 3; row++) for (var i = 0; i < 9; i++) {
    var x = 18 + i * 36 + (row % 2) * 18, y = 150 + row * 13;
    if (Math.abs(x - 160) < 22 && row === 2) continue;
    shadow(x, y, 16); spr('v' + ((i + row * 3) % 10), x, y - Math.abs(Math.round(Math.sin(T * 6 + i + row) * 2)), x > 160);
  }
  shadow(160, 136, 26); spr('h_lord_cheer', 160, 136);
  if (Math.random() < 0.5) parts.push({x:Math.random() * W, y:-4, vx:(Math.random() - .5) * 20, vy:20, c:pick(['#ffd23f', '#ff5a4e', '#5aa8ff', '#7be36b', '#fff']), t:3, s:2});
}
function title(){
  var d = S.day - 1;
  return d <= 45 ? E('번개 같은 교주', 'Lightning Leader') : d <= 65 ? E('망치의 교주', 'Hammer Leader') : d <= 90 ? E('뚝심의 교주', 'Iron-Willed Leader') : E('대기만성 교주', 'Late Bloomer Leader');
}
function resultCard(){
  var cw = 1080, ch = 1350, k = document.createElement('canvas'); k.width = cw; k.height = ch;
  var c = k.getContext('2d'); c.imageSmoothingEnabled = false;
  c.fillStyle = '#2b1d14'; c.fillRect(0, 0, cw, ch);
  c.drawImage(IMG.b_temple, 0, 0, cw, 608);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  for (var i = 0; i < 7; i++) { var v = IMG['v' + ((i * 3) % 10)], vs = 5 / SC; c.drawImage(v, 40 + i * 150 - v.width * vs / 2, 600 - v.height * vs, v.width * vs, v.height * vs); }
  var h = IMG.h_lord_cheer, hsc = 8 / SC; c.drawImage(h, cw / 2 - h.width * hsc / 2, 560 - h.height * hsc, h.width * hsc, h.height * hsc);
  c.fillStyle = '#edd3a0'; c.fillRect(0, 620, cw, ch - 620);
  c.fillStyle = '#b98a4e'; c.fillRect(0, 620, cw, 10);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  function T2(s, x, y, size, col, stroke){ c.font = size + 'px Neo'; if (stroke) { c.lineWidth = size / 8; c.strokeStyle = '#2b1d14'; c.strokeText(s, x, y); } c.fillStyle = col; c.fillText(s, x, y); }
  T2(E('러다이트교', 'LUDDITE CHURCH'), cw / 2, 720, E(110, 96), '#ffd23f', true);
  T2(title(), cw / 2, 830, 64, '#c0281c');
  var stats = E([['걸린 날', fmt(S.day - 1) + '일'], ['신도', fmt(S.fol) + '명'], ['최고 연설', '+' + fmt(S.best) + '명'], ['모은 돈', fmtM(S.money)], ['도감', S.dex.length + '/' + DEXN], ['모은 카드', Object.keys(S.cardSeen).length + '장']],
    [['Days', fmt(S.day - 1)], ['Followers', fmt(S.fol)], ['Best speech', '+' + fmt(S.best)], ['Money', fmtM(S.money)], ['Dex', S.dex.length + '/' + DEXN], ['Cards found', Object.keys(S.cardSeen).length]]);
  stats.forEach(function(s, i){ c.textAlign = 'left'; T2(s[0], 170, 920 + i * 60, 46, '#7a5a3a'); c.textAlign = 'right'; T2(s[1], 910, 920 + i * 60, 50, '#2b1d14'); });
  c.textAlign = 'center'; T2('oreumgames.com', cw / 2, 1300, 40, '#7a5a3a');
  var sh = sheet(null); sh.dim.id = 'card';
  var row = el('div', 'row', null, sh.s); row.style.alignItems = 'center';
  row.appendChild(k);
  var side = el('div', 'side', null, row);
  el('div', null, '<div style="font-size:calc(var(--u)*12);color:#c0281c">' + E('교주 즉위', 'Crowned Cult Leader') + '</div><div style="font-size:calc(var(--u)*7)">' + title() + '</div>', side);
  btn(E('저장', 'SAVE'), '', function(){ try { var a = document.createElement('a'); a.href = k.toDataURL('image/png'); a.download = 'luddite.png'; document.body.appendChild(a); a.click(); a.remove(); } catch(e) { toast(E('사이트에서 저장할 수 있습니다', 'You can save it on the website')); } }, side);
  btn(E('공유', 'SHARE'), 'ply', function(){
    var url = location.protocol.indexOf('http') === 0 ? location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') : 'https://oreumgames.com';
    if (window.LD_EN && location.protocol.indexOf('http') === 0) url = url.replace(location.origin, location.origin + '/en');
    var text = E('러다이트교 ' + title() + ' · 신도 ' + fmt(S.fol) + '명 · ' + fmtM(S.money) + ' · ' + (S.day - 1) + '일 만에 교주 즉위', 'Luddite Church · ' + title() + ' · ' + fmt(S.fol) + ' followers · ' + fmtM(S.money) + ' · Crowned in ' + (S.day - 1) + ' days');
    if (navigator.share) navigator.share({title:E('러다이트교', 'Luddite Church'), text:text, url:url}).catch(function(){});
    else { try { navigator.clipboard.writeText(text + ' ' + url); } catch(e) {} toast(E('주소를 복사했습니다', 'Link copied')); }
  }, side);
  btn(E('처음 화면', 'TITLE'), 'ply', function(){ sh.dim.remove(); try { localStorage.removeItem('luddite.save'); } catch(e) {} location.reload(); }, side);
}

/* ---------- 입력 ---------- */
function tap(e){
  if (e && e.target && e.target.closest && e.target.closest('button,.sheet,.card,.ret,#topbar,#talk,.dim')) return;
  A.init();
  if (talking()) return;
  if (scene === 'work') tapWork();
  else if (scene === 'speech' && SP.phase === 'aim') dragStart(e);
}
window.addEventListener('pointerdown', tap);
window.addEventListener('keydown', function(e){
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (talking()) { $('talk').dispatchEvent(new PointerEvent('pointerdown')); return; }
    tap(null);
  }
  if (scene === 'speech' && SP.phase === 'pick' && /^Digit[1-4]$/.test(e.code)) playCard(+e.code.slice(5) - 1);
  if (scene === 'pocha' && PC && !PC.lock && /^Digit[1-3]$/.test(e.code)) { var bs = document.querySelectorAll('.ret'); var b = bs[+e.code.slice(5) - 1]; if (b) b.click(); }
});

/* ---------- 돌리기 ---------- */
var last = performance.now();
function frame(now, manual){
  var dt = clamp((now - last) / 1000, 0, 0.05); last = now; T += dt;
  stepTalk(dt); stepFx(dt);
  g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (shake > 0) { g.translate(Math.round((Math.random() - .5) * shake), Math.round((Math.random() - .5) * shake)); shake = Math.max(0, shake - dt * 20); }
  if (scene === 'title') drawTitle(dt);
  else if (scene === 'hub') drawHub();
  else if (scene === 'work') { stepWork(dt); drawWork(); }
  else if (scene === 'pocha') { stepPocha(dt); drawPocha(); }
  else if (scene === 'speech') { stepSpeech(dt); drawSpeech(); }
  else if (scene === 'ending') drawEnding(dt);
  drawFx();
  drawHow();
  if (!manual) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (load()) $('bCont').classList.remove('hide');
document.fonts && document.fonts.load('16px Neo');
window.__LD = {get S(){ return S; }, set S(v){ S = v; }, goHub:goHub, startEnding:startEnding, startSpeech:function(i){ startSpeech(i); }, playCard:function(i){ playCard(i); }, mega:function(th, sp){ var l = 6 + (1 - sp) * 60; SP.mega = {x0:0, y0:0, x:Math.cos(th) * l, y:Math.sin(th) * l / MG_YS}; megaRelease(); }, shoot:function(dx, dy){ SP.drag0 = {x:0, y:0}; SP.drag = {x:-dx, y:-dy}; launch(); }, scene:function(){ return scene; }, SP:function(){ return SP; }, WK:function(){ return WK; }, PC:function(){ return PC; }, save:save, resultCard:resultCard, tick:function(n, cb){ for (var i = 0; i < n; i++) { frame(last + 16, true); if (cb) cb(); } }};
})();
