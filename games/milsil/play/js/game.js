// 밀실 — 방 5개 x 4스테이지 = 20스테이지. 그림 좌표는 원본 1376x768 픽셀 기준
(function () {
  'use strict';
  var W = 1376, H = 768;
  var $ = function (id) { return document.getElementById(id); };
  var viewEl = $('view'), layer = $('layer'), bg = $('bg'), bg2 = $('bg2');

  // ---------- 소지품·단서 ----------
  var ITEMS = {
    key:     { img: 'img/it_key.png',     name: '작은 열쇠' },
    match:   { img: 'img/it_match.png',   name: '성냥' },
    paper:   { img: 'img/it_paper.png',   name: '흰 종이' },
    wind:    { img: 'img/it_wind.png',    name: '태엽 열쇠' },
    doorkey: { img: 'img/it_doorkey.png', name: '문 열쇠' },
    flash:   { img: 'img/it_flash.png',   name: '손전등' },
    crank:   { img: 'img/it_crank.png',   name: '태엽 손잡이' },
    tap:     { img: 'img/it_tap.png',     name: '수도 손잡이' },
    silver:  { img: 'img/it_silver.png',  name: '작은 은열쇠' },
    knob:    { img: 'img/it_knob.png',    name: '오븐 손잡이' },
    fkey:    { img: 'img/it_fkey.png',    name: '냉장고 열쇠' },
    invite:  { img: 'img/it_invite.png',  name: '초대장', desc: '9월 24일 저녁 식사. 정순자는 부엌 쪽 끝. 한도현은 정순자 옆. 오병철은 창가 쪽 끝. 민재석은 남은 자리.' },
    ekey3:   { img: 'img/it_ekey3.png',   name: '쇠 열쇠' },
    film:    { img: 'img/it_film.png',    name: '필름 통' },
    paperw:  { img: 'img/it_paperw.png',  name: '인화지' },
    hkey:    { img: 'img/it_hkey.png',    name: '작은 황동 열쇠' },
    tea:     { img: 'img/it_tea.png',     name: '식은 홍차' },
    driver:  { img: 'img/it_driver.png',  name: '드라이버' },
    invite2: { img: 'img/it_invite.png',  name: '초대장', desc: '10월 1일 점심 식사. 오병철은 부엌 쪽 끝. 민재석은 오병철 옆. 한도현은 창가 쪽 끝. 정순자는 남은 자리.' },
    note3:   { img: 'img/it_paper.png',   name: '쪽지', desc: '식탁 위 촛불. 식탁 둘레 의자. 식탁 위 접시.' },
    print:   { img: 'img/it_paperw.png',  name: '현상된 사진' },
    note5:   { img: 'img/it_page.png',    name: '쪽지', desc: '이 문은 우산 주인의 머리글자로 열린다.' },
    umb18:   { img: 'img/it_umbrella.png', name: '검은 장우산', desc: '손잡이 안쪽에 무언가 새겨져 있다. 어두워서 읽을 수 없다.' }
  };
  var CLUES = [
    { id: 'page',   img: 'img/it_page.png',   name: '원고 조각', text: '「밀실」 3장 — 그날 밤 서재 문을 두드린 사람은 왼손에 젖은 우산을 들고 있었다.' },
    { id: 'photo',  img: 'img/it_photo.png',  name: '찢어진 사진', text: '이 서재의 문이다. 뒷면에 연필로 「9월 24일 밤」.' },
    { id: 'letter', img: 'img/it_letter.png', name: '편지', text: '형님, 이번 원고만큼은 양보해 주십시오. 형님 이름이 아니어도 책은 팔립니다.' },
    { id: 'receipt', img: 'img/it_receipt.png', name: '영수증', text: '우산 가게. 9월 24일 밤 9시 40분, 검은 장우산 1개.' },
    { id: 'brothers', img: 'img/it_brothers.png', name: '형제 사진', text: '젊은 날의 두 형제. 둘 다 만년필을 쥐었는데, 동생은 왼손이다.' },
    { id: 'diary', img: 'img/it_diary.png', name: '일기장', text: '11월 3일. 결혼기념일. 올해도 혼자다. 도현이가 또 원고 이야기를 꺼냈다.' },
    { id: 'burnt', img: 'img/it_burnt.png', name: '타다 남은 주문서', text: '…왼손잡이용 만년필 한 자루. 펜촉은 왼쪽으로 깎을 것. 주문자 한…' },
    { id: 'bday', img: 'img/it_bday.png', name: '생일 카드', text: '도현아, 생일 축하한다. 네 글씨는 여전히 나보다 낫구나. — 형' },
    { id: 'pen', img: 'img/it_pen.png', name: '만년필', text: '펜촉이 왼손잡이용으로 비스듬히 깎였다. 작가의 것이 아니다.' },
    { id: 'nightphoto', img: 'img/it_nightphoto.png', name: '현상된 사진', text: '9월 24일 밤, 서재 문 앞. 검은 장우산을 왼손에 든 남자의 뒷모습.' },
    { id: 'glove', img: 'img/it_glove.png', name: '장갑 한 짝', text: '왼손 장갑. 손가락에 형광 물감이 묻어 있다. 발자국과 같은 물감이다.' },
    { id: 'umbrella', img: 'img/it_umbrella.png', name: '검은 장우산', text: '아직 젖어 있다. 손잡이 안쪽에 새긴 머리글자 ㅎ·ㄷ·ㅎ.' }
  ];
  var TOTAL_CLUES = 12;
  var BOOKS = ['B', 'R', 'G', 'K', 'Y'];              // 그림 속 왼쪽부터
  var ANSWER = ['Y', 'B', 'K', 'R', 'G'];             // 비밀 잉크 점 순서
  var INK = { Y: '#e8c21c', B: '#2c55c9', K: '#1a1a1a', R: '#c22a22', G: '#2d8a3e' };
  var CODE = [7, 2, 5];
  var STAGES = 20;                                     // 방 5개 x 4스테이지

  // ---------- 상태 ----------
  var S;
  function fresh() {
    return { stage: 1, room: 1, view: '1n', inv: [], clues: [], sel: null, t: 0, f: {}, dial: [0, 0, 0], books: [] };
  }
  function save() { try { localStorage.setItem('milsil.save', JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem('milsil.save'));
      if (s && s.room) {
        if (!/^\d/.test(s.view)) s.view = s.room + s.view;
        if (s.f && s.f.escaped && !s.done) s.done = 1;
        if (!s.stage) {  // 방 5개 시절 저장: 방 1~4 는 그 방 첫 스테이지, 방 5 는 마지막 스테이지
          s.stage = s.room >= 5 ? STAGES : (s.room - 1) * 4 + 1;
          s.done = (s.done || 0) >= s.room ? s.stage : 0;
        }
        return s;
      }
    } catch (e) {} return null;
  }
  // 스테이지마다 새 퍼즐(방 1~4 는 첫 스테이지, 방 5 는 마지막 스테이지가 원래 퍼즐)
  var VAR = {};
  function STG() { return VAR[S.stage] || {}; }
  function view(id) { var o = STG().views; return (o && o[id]) || V[id]; }

  // ---------- 좌표 도우미 ----------
  function pct(el, x, y, w, h) {
    el.style.left = (x / W * 100) + '%'; el.style.top = (y / H * 100) + '%';
    el.style.width = (w / W * 100) + '%'; el.style.height = (h / H * 100) + '%';
    return el;
  }
  function div(cls, x, y, w, h) { var d = document.createElement('div'); d.className = cls; pct(d, x, y, w, h); layer.appendChild(d); return d; }
  // 배경 그림의 한 조각을 떼어 낸 것처럼 보이는 요소(같은 그림을 background 로 잘라 씀)
  function piece(src, x, y, w, h) {
    var d = div('spr pc', x, y, w, h);
    d.style.backgroundImage = 'url(' + src + ')';
    d.style.backgroundSize = (W / w * 100) + '% ' + (H / h * 100) + '%';
    d.style.backgroundPosition = (x / (W - w) * 100) + '% ' + (y / (H - h) * 100) + '%';
    return d;
  }
  function img(src, x, y, w, h) { var d = div('spr', x, y, w, h); d.style.backgroundImage = 'url(' + src + ')'; d.style.backgroundSize = '100% 100%'; return d; }
  function spot(x0, y0, x1, y1, fn) {
    var d = div('spot', x0, y0, x1 - x0, y1 - y0);
    d.addEventListener('click', function (e) {
      e.stopPropagation(); SND.unlock();
      var r = viewEl.getBoundingClientRect();
      LAST = e.clientX ? { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H } : { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      fn(d, e);
    });
    return d;
  }
  var LAST = { x: W / 2, y: H / 2 };

  // ---------- 효과(소리와 화면 변화) — 방을 다시 그려도 사라지지 않게 따로 얹는 층 ----------
  var fxL = document.createElement('div'); fxL.id = 'fx'; viewEl.insertBefore(fxL, $('lampdark'));
  function fxEl(src, x, y, w, h, ms) {
    var d = document.createElement('div'); d.className = 'spr';
    pct(d, x - w / 2, y - h / 2, w, h);
    if (src) { d.style.backgroundImage = 'url(' + src + ')'; d.style.backgroundSize = '100% 100%'; }
    fxL.appendChild(d);
    setTimeout(function () { d.remove(); }, ms || 1500);
    return d;
  }
  function anim(el, frames, ms, ease) { try { return el.animate(frames, { duration: ms, easing: ease || 'ease-out', fill: 'forwards' }); } catch (e) { } }
  var FX = {
    // 열쇠: 구멍에 쑥 들어가 딸깍 돌아간다
    key: function (src, x, y) {
      var e = fxEl(src, x, y, 62, 62, 1100);
      e.style.filter = 'drop-shadow(0 3px 3px rgba(0,0,0,.7))';
      anim(e, [{ transform: 'translate(-45%,-35%) scale(1.35) rotate(-35deg)', opacity: 0 },
        { transform: 'translate(0,0) scale(1) rotate(-20deg)', opacity: 1, offset: .35 },
        { transform: 'scale(.92) rotate(70deg)', opacity: 1, offset: .7 },
        { transform: 'scale(.85) rotate(70deg)', opacity: 0 }], 1000);
      setTimeout(function () { FX.star(x, y, 60); }, 650);
    },
    // 끼워서 돌리기(태엽·손잡이·수도꼭지)
    twist: function (src, x, y, turns, size) {
      var e = fxEl(src, x, y, size || 64, size || 64, 1700);
      e.style.filter = 'drop-shadow(0 3px 3px rgba(0,0,0,.7))';
      anim(e, [{ transform: 'translateY(-40%) scale(1.25)', opacity: 0 },
        { transform: 'translateY(0) scale(1) rotate(0)', opacity: 1, offset: .25 },
        { transform: 'rotate(' + (360 * turns) + 'deg)', opacity: 1, offset: .85 },
        { transform: 'rotate(' + (360 * turns) + 'deg) scale(.9)', opacity: 0 }], 1600, 'ease-in-out');
      for (var i = 0; i < Math.ceil(turns * 3); i++) SND.play('tick', .45 + i * .3 / Math.max(1, turns));
    },
    // 드라이버: 나사를 돌리고 나사가 떨어진다
    screw: function (x, y) {
      var e = fxEl('img/it_driver.png', x + 34, y - 30, 96, 86, 1500);
      e.style.transformOrigin = '12% 88%'; e.style.filter = 'drop-shadow(0 3px 3px rgba(0,0,0,.7))';
      anim(e, [{ transform: 'rotate(0)', opacity: 0 }, { transform: 'rotate(-35deg)', opacity: 1, offset: .15 }, { transform: 'rotate(25deg)', offset: .3 },
        { transform: 'rotate(-35deg)', offset: .45 }, { transform: 'rotate(25deg)', offset: .6 }, { transform: 'rotate(-35deg)', offset: .75 }, { transform: 'rotate(0)', opacity: 0 }], 1400, 'linear');
      SND.play('screw'); SND.play('screw', .45);
      [[-18, 0], [14, 6], [-2, 12]].forEach(function (o, i) {
        setTimeout(function () {
          var sc = fxEl('img/fx_screw.png', x + o[0], y + o[1], 12, 21, 900);
          anim(sc, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(' + (140 + i * 20) + '%) rotate(' + (200 + i * 90) + 'deg)', opacity: .9, offset: .7 },
            { transform: 'translateY(' + (120 + i * 20) + '%) rotate(' + (260 + i * 90) + 'deg)', opacity: 0 }], 800, 'cubic-bezier(.5,0,1,.6)');
          SND.play('tink', .25);
        }, 900 + i * 160);
      });
    },
    // 성냥: 긋는 순간 불꽃이 확 일고 연기가 오른다
    strike: function (x, y) {
      var m = fxEl('img/it_matchstick.png', x + 40, y - 30, 90, 66, 1200);
      anim(m, [{ transform: 'translate(40%,-20%) rotate(-20deg)', opacity: 0 }, { transform: 'translate(0,0) rotate(-35deg)', opacity: 1, offset: .3 }, { transform: 'translate(-30%,10%) rotate(-40deg)', opacity: 1, offset: .6 }, { opacity: 0, transform: 'translate(-30%,10%) rotate(-40deg)' }], 1100);
      setTimeout(function () {
        FX.glow(x, y, 360, 'rgba(255,170,60,.55)');
        var f = fxEl('img/fx_flame.png', x, y - 20, 70, 90, 1200);
        anim(f, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 1, offset: .2 }, { transform: 'scale(1) translateY(-6%)', opacity: 1, offset: .6 }, { transform: 'scale(.6) translateY(-20%)', opacity: 0 }], 1100);
        SND.play('whoosh');
        setTimeout(function () { FX.smoke(x, y - 60); }, 500);
      }, 330);
    },
    // 제자리에 내려놓기(필름·종이)
    place: function (src, x, y, w, h) {
      var e = fxEl(src, x, y, w || 70, h || 70, 1000);
      anim(e, [{ transform: 'translateY(-60%) scale(1.2)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1, offset: .45 }, { transform: 'scale(.8)', opacity: 0 }], 900);
      setTimeout(function () { FX.star(x, y, 50); }, 380);
    },
    // 물에 담그기: 잔물결이 번진다
    dip: function (x, y) {
      for (var i = 0; i < 2; i++) (function (i) {
        setTimeout(function () {
          var r = fxEl('img/fx_ripple.png', x, y, 90, 40, 1100);
          anim(r, [{ transform: 'scale(.3)', opacity: .95 }, { transform: 'scale(2.2)', opacity: 0 }], 1000);
        }, i * 260);
      })(i);
      SND.play('drip'); SND.play('drip', .2);
    },
    // 손전등: 딸깍 켜지는 빛
    beam: function (x, y) {
      var e = fxEl('img/it_flash.png', x - 40, y + 30, 110, 40, 1000);
      anim(e, [{ opacity: 0, transform: 'rotate(-20deg) translateX(-30%)' }, { opacity: 1, transform: 'rotate(-20deg)', offset: .3 }, { opacity: 0, transform: 'rotate(-20deg)' }], 900);
      setTimeout(function () { FX.glow(x, y, 300, 'rgba(255,240,200,.6)'); SND.play('lamp'); }, 250);
    },
    // 전기 불꽃
    spark: function (x, y, big) {
      var n = big ? 5 : 2;
      for (var i = 0; i < n; i++) (function (i) {
        setTimeout(function () {
          var e = fxEl('img/fx_spark.png', x + (Math.random() - .5) * (big ? 120 : 20), y + (Math.random() - .5) * (big ? 80 : 16), big ? 130 : 70, big ? 130 : 70, 400);
          anim(e, [{ transform: 'scale(.3) rotate(' + (i * 70) + 'deg)', opacity: 1 }, { transform: 'scale(1.2) rotate(' + (i * 70 + 30) + 'deg)', opacity: 1, offset: .4 }, { transform: 'scale(1.4)', opacity: 0 }], 330, 'linear');
          SND.play('crackle');
        }, i * 90);
      })(i);
      if (big) { var fl = fxEl(null, W / 2, H / 2, W, H, 500); fl.style.background = 'rgba(210,235,255,.75)'; anim(fl, [{ opacity: 1 }, { opacity: 0 }], 450); }
    },
    dust: function (x, y, size) {
      var e = fxEl('img/fx_dust.png', x, y, size || 160, (size || 160) * .7, 1300);
      anim(e, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(.9)', opacity: .85, offset: .25 }, { transform: 'scale(1.5) translateY(-12%)', opacity: 0 }], 1200);
    },
    smoke: function (x, y) {
      var e = fxEl('img/fx_smoke.png', x, y, 70, 130, 1900);
      anim(e, [{ transform: 'translateY(20%) scale(.5)', opacity: 0 }, { transform: 'translateY(0) scale(.8)', opacity: .7, offset: .3 }, { transform: 'translateY(-60%) scale(1.3)', opacity: 0 }], 1800);
    },
    star: function (x, y, size) {
      var e = fxEl('img/fx_star.png', x, y, size || 70, size || 70, 800);
      anim(e, [{ transform: 'scale(0) rotate(0)', opacity: 0 }, { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: .4 }, { transform: 'scale(0) rotate(90deg)', opacity: 0 }], 700);
    },
    glow: function (x, y, size, color) {
      var e = fxEl(null, x, y, size, size, 1000);
      e.style.background = 'radial-gradient(circle,' + (color || 'rgba(255,210,120,.6)') + ',rgba(0,0,0,0) 65%)'; e.style.mixBlendMode = 'screen';
      anim(e, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: .3 }, { transform: 'scale(1.2)', opacity: 0 }], 950);
    }
  };
  // 아이템을 쓸 때 자동으로 나오는 효과
  var USE_FX = {
    key: 'key', silver: 'key', fkey: 'key', ekey3: 'key', doorkey: 'key', hkey: 'key',
    wind: ['twist', 3], crank: ['twist', 2], knob: ['twist', .75, 80], tap: ['twist', 1, 70],
    driver: 'screw', match: 'strike', film: 'place', paperw: 'dip', flash: 'beam'
  };
  function useFx(id) {
    var k = USE_FX[id]; if (!k) return;
    var x = LAST.x, y = LAST.y, src = ITEMS[id] && ITEMS[id].img;
    if (k === 'key') FX.key(src, x, y);
    else if (k[0] === 'twist') FX.twist(src, x, y, k[1], k[2]);
    else if (k === 'screw') FX.screw(x, y);
    else if (k === 'strike') FX.strike(x, y);
    else if (k === 'place') FX.place(src, x, y);
    else if (k === 'dip') FX.dip(x, y);
    else if (k === 'beam') FX.beam(x, y);
  }

  // ---------- 말풍선 ----------
  var toastT;
  function say(s) { var t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  function shakeView() { viewEl.classList.remove('shake'); void viewEl.offsetWidth; viewEl.classList.add('shake'); }

  // ---------- 소지품 ----------
  function hasSel(id) { return S.sel === id; }
  function give(id, from) {
    if (S.inv.indexOf(id) < 0) S.inv.push(id);
    SND.play('pickup'); renderInv(id); save();
  }
  // 효과는 맞게 썼을 때만(사장님 9/26 "이펙트가 정답을 맞췄을때만") — 틀려서 없어지는 건 noFx
  function takeAway(id, noFx) { var i = S.inv.indexOf(id); if (i >= 0) { S.inv.splice(i, 1); if (!noFx) useFx(id); } if (S.sel === id) S.sel = null; renderInv(); save(); }
  function getClue(id) {
    if (S.clues.indexOf(id) >= 0) return;
    S.clues.push(id); save(); updStats();
    SND.play('clue');
    var c = CLUES.filter(function (c) { return c.id === id; })[0];
    showLook(c.img, c.name, c.text);
  }
  function renderInv(popId) {
    var inv = $('inv'); inv.innerHTML = '';
    // 빈 칸은 화면 높이에 들어가는 만큼만(폰 가로에서 잘리지 않게)
    var cs = getComputedStyle(inv), slotH = innerHeight <= 480 ? 58 + 6 : 70 + 9;
    var fits = Math.max(3, Math.floor((innerHeight - parseFloat(cs.paddingTop) - 6) / slotH));
    var n = Math.max(Math.min(6, fits), S.inv.length);
    for (var i = 0; i < n; i++) {
      var id = S.inv[i], s = document.createElement('div');
      s.className = 'slot' + (id ? '' : ' empty') + (id && S.sel === id ? ' sel' : '') + (id && id === popId ? ' pop' : '');
      if (id) {
        var im = document.createElement('img'); im.src = ITEMS[id].img; s.appendChild(im);
        (function (id) {
          s.addEventListener('click', function () {
            SND.unlock(); SND.play('tick');
            if (S.sel === id) { S.sel = null; lookItem(id); } else S.sel = id;
            renderInv();
          });
        })(id);
      }
      inv.appendChild(s);
    }
  }
  function lookItem(id) {
    var it = ITEMS[id];
    if (STG().look && STG().look(id)) return;
    if (id === 'paper' && S.f.ink) {
      var dots = '<div class="inkdots">' + ANSWER.map(function (c) { return '<span style="background:' + INK[c] + '"></span>'; }).join('') + '</div>';
      showLook(it.img, it.name, '', dots);
    } else showLook(it.img, it.name, it.desc || '');
  }
  function showLook(src, h, p, extra) {
    $('lookPic').innerHTML = '<div style="position:relative;height:100%;display:flex;align-items:center;justify-content:center"><img src="' + src + '">' + (extra || '') + '</div>';
    $('lookH').textContent = h; $('lookP').textContent = p || '';
    $('look').classList.add('on');
    if (extra) { // 점·글씨가 그림 위에 오도록 그림 크기에 맞춘다
      var im = $('lookPic').querySelector('img');
      var fit = function () {
        var d = $('lookPic').querySelector('.inkdots'); if (d && im.clientWidth) d.style.width = (im.clientWidth * .62) + 'px';
        var t = $('lookPic').querySelector('.onpic'); if (t && im.clientWidth) { t.style.left = im.offsetLeft + 'px'; t.style.top = im.offsetTop + 'px'; t.style.width = im.clientWidth + 'px'; t.style.height = im.clientHeight + 'px'; t.style.fontSize = (im.clientWidth * (+t.dataset.fs || .2)) + 'px'; }
      };
      if (im.complete) fit(); else im.onload = fit;
    }
  }
  document.querySelectorAll('[data-close]').forEach(function (x) {
    x.addEventListener('click', function () { SND.play('tick'); x.closest('.modal').classList.remove('on'); });
  });
  document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('on'); });
  });

  // ---------- 수첩 ----------
  $('stNote').addEventListener('click', function () {
    SND.unlock(); SND.play('paper');
    var L = $('noteList'); L.innerHTML = '';
    CLUES.forEach(function (c) {
      var got = S.clues.indexOf(c.id) >= 0;
      var d = document.createElement('div'); d.className = 'note' + (got ? '' : ' none');
      d.innerHTML = got ? '<img src="' + c.img + '"><p><b>' + c.name + '</b><br>' + c.text + '</p>' : '<img src="img/it_page.png" style="opacity:.2"><p>?</p>';
      if (got) d.addEventListener('click', function () { $('noteM').classList.remove('on'); showLook(c.img, c.name, c.text); });
      L.appendChild(d);
    });
    $('noteM').classList.add('on');
  });
  function updStats() { $('stClue').textContent = S.clues.length + '/' + TOTAL_CLUES; $('stRoom').textContent = S.stage + '/' + STAGES; $('stDone').textContent = S.done || 0; }

  // ---------- 방 1 장면 ----------
  var V = {};
  // 북: 책상 벽
  V['1n'] = {
    img: function () { return 'img/r1_n.webp'; }, left: '1w', right: '1e',
    build: function () {
      spot(345, 380, 940, 700, function () { go('1desk'); });
      spot(455, 255, 565, 395, lampToggle);
    }
  };
  // 동: 책장 벽
  V['1e'] = {
    img: function () { return 'img/r1_e.webp'; }, left: '1n', right: '1s',
    build: function () {
      spot(575, 295, 1095, 425, function () { go('1shelf'); });
      var gl = piece('img/r1_e.webp', 818, 428, 66, 84);
      spot(818, 428, 884, 512, function () { spin(gl); });
      spot(1115, 370, 1265, 650, function () { say('초가 다 녹아 있다.'); });
      spot(90, 360, 290, 520, lampToggle);
    }
  };
  // 남: 출구 문·괘종시계
  V['1s'] = {
    img: function () { return 'img/r1_s.webp'; }, left: '1e', right: '1w',
    build: function () {
      spot(270, 150, 418, 628, function () { go('1clock'); });
      spot(555, 180, 835, 605, doorClick);
      spot(893, 425, 962, 628, function () { say('우산 하나가 아직 젖어 있다.'); });
      spot(1025, 290, 1100, 565, function () { SND.play('paper'); say('코트 주머니는 비어 있다.'); });
      var hat = piece('img/r1_s.webp', 955, 226, 80, 84);
      spot(955, 226, 1035, 310, function () { wobble(hat); SND.play('swing'); });
    }
  };
  // 서: 벽난로·초상화
  V['1w'] = {
    img: function () {
      var fire = S.f.fire, np = S.f.portrait >= 2;
      return 'img/r1_w' + (fire ? '_fire' : '') + (np ? '_np' : '') + '.webp';
    },
    left: '1s', right: '1n',
    build: function () {
      buildPortrait();
      spot(575, 455, 810, 648, fireClick);
      spot(950, 395, 1015, 525, function () { say('파이프가 아직 따뜻하다.'); });
      spot(1225, 330, 1376, 470, lampToggle);
    }
  };
  // 책상 확대
  V['1desk'] = {
    img: function () { return 'img/c1_desk.webp'; }, back: '1n',
    build: function () {
      drawer('L', 18, 460, 388, 100);
      drawer('M', 428, 460, 522, 100);
      drawer('R', 970, 460, 390, 100);
      // 타자기 종이
      if (!S.f.paper) {
        var pp = piece('img/c1_desk.webp', 590, 160, 200, 90);
        spot(590, 160, 790, 250, function () { S.f.paper = 1; SND.play('paper'); pp.style.transition = 'transform .4s, opacity .4s'; pp.style.transform = 'translateY(-40px)'; pp.style.opacity = 0; give('paper'); setTimeout(render, 420); });
      } else {
        // 종이를 뺀 자리: 롤러만 남게 종이 부분을 어둡게 덮는다
        var cover = div('spr', 596, 162, 186, 78);
        cover.style.background = 'linear-gradient(180deg,rgba(23,24,30,1),rgba(35,33,36,1) 70%,rgba(40,36,34,0))';
        cover.style.borderRadius = '4px';
      }
      spot(240, 70, 455, 345, lampToggle);
      spot(860, 305, 1105, 415, function () { SND.play('paper'); say('빈 원고지뿐이다.'); });
      spot(1190, 300, 1325, 390, function () { say('식은 홍차.'); });
    }
  };
  // 책장 확대
  var BX = { B: [482, 560], R: [563, 642], G: [645, 725], K: [729, 804], Y: [805, 928] };
  V['1shelf'] = {
    img: function () { return 'img/c1_shelf.webp'; }, back: '1e',
    build: function () {
      var els = {};
      BOOKS.forEach(function (c) {
        var b = BX[c];
        var el = bookPiece(c);
        el.style.transition = 'transform .18s, filter .18s';
        el.style.transformOrigin = '50% 100%';
        els[c] = el;
        if (S.f.books || S.books.indexOf(c) >= 0) pushIn(el, true);
        spot(b[0], 262, b[1], 560, function () { bookClick(c, els); });
      });
      if (S.f.books) openNiche(true);
    }
  };
  // 괘종시계 확대
  var KEYHOLE = [590, 492, 632, 540];                          // 추 상자 문 열쇠 구멍(태엽 열쇠를 꽂는 곳)
  V['1clock'] = {
    img: function () { return 'img/c1_clock_np.webp'; }, back: '1s',
    build: function () {
      // 추 상자 문(유리) — 열리면 오른쪽 경첩을 축으로 돈다
      var inside = caseInside();
      inside.style.opacity = S.f.caseOpen ? 1 : 0;
      if (S.f.caseOpen && S.clues.indexOf('letter') < 0) {
        var lt = img('img/it_letter.png', 608, 660, 104, 54); lt.style.transform = 'rotate(-6deg)';   // 추 아래 바닥에 놓인 편지(추에 가리지 않게) lt.style.filter = 'brightness(.8) drop-shadow(0 3px 3px rgba(0,0,0,.7))';
        lt.style.pointerEvents = 'auto'; lt.style.cursor = 'pointer';
        lt.addEventListener('click', function (e) { e.stopPropagation(); lt.remove(); getClue('letter'); });
      }
      var doorEl = piece('img/c1_clock_np.webp', 598, 330, 180, 388);
      doorEl.style.transformOrigin = '98% 50%';
      doorEl.style.transition = 'transform .9s cubic-bezier(.3,.7,.3,1)';
      if (S.f.caseOpen) doorEl.style.transform = 'perspective(900px) rotateY(-105deg)';
      var pend = img('img/sp_pendulum.png', 640, 345, 100, 320);
      pend.style.transformOrigin = '49% 2.2%';
      if (S.f.wound) pend.style.animation = 'pend 1.6s ease-in-out infinite alternate';
      // 추 무게추 그림자(유리 안쪽) — 문 조각에 이미 그려져 있다
      // 바늘
      var hands = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      hands.setAttribute('viewBox', '0 0 1376 768'); hands.setAttribute('preserveAspectRatio', 'none');
      hands.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      hands.innerHTML = '<g id="hh"><path d="M688 214 L686 196 L682 190 L688 180 L694 190 L690 196 Z" fill="#1c140e"/><rect x="686.3" y="187" width="3.4" height="29" fill="#1c140e"/></g>' +
        '<g id="mh"><rect x="686.9" y="168" width="2.4" height="48" fill="#1c140e"/><path d="M688 165 L685 173 L691 173 Z" fill="#1c140e"/></g>' +
        '<circle cx="688" cy="214" r="4.2" fill="#2a1c10"/><circle cx="688" cy="214" r="1.6" fill="#b89048"/>';
      layer.appendChild(hands);
      setHands(hands, S.f.wound ? 7 * 60 + 25 : 10 * 60 + 8, false);
      spot(612, 138, 766, 292, function () { SND.play(S.f.wound ? 'chime' : 'tick'); });
      if (!S.f.caseOpen) spot(600, 332, 776, 716, function () { SND.play('rattle'); wobble(doorEl, 2); });
      // 태엽 열쇠는 추 상자 문의 열쇠 구멍에 꽂는다
      if (!S.f.wound) spot(KEYHOLE[0], KEYHOLE[1], KEYHOLE[2], KEYHOLE[3], function () { clockFace(hands, pend, doorEl, inside); });
    }
  };


  // ================= 방 2 침실 =================
  var DIRS = ['u', 'r', 'd', 'l', 'u'];              // 거울 김 서림 화살표
  var KEYPAD = '1103';
  var BATH = { tap: [600, 443], cold: [775, 447], spout: [666, 452], basin: 560, mirror: [475, 132, 898, 355] };
  var VAN = [378, 488, 647, 127], VANPF = [228, 262, 492, 438];   // 화장대 확대: 서랍, 향수병
  V['2n'] = {
    // 베개를 들면 그 자리는 베개 없는 침대(tools/pillow_off.py) — 베개가 두 개로 보이지 않게
    img: function () { return S.f.pillow ? 'img/r2_n_pl.webp' : 'img/r2_n.webp'; }, left: '2w', right: '2e',
    build: function () {
      // 베개: 누르면 들썩, 왼쪽 베개 밑에 손전등
      // 손전등은 처음부터 베개 밑에 깔려 있다 → 베개를 들추는 순간 바로 보인다(사장님 9/26)
      var fl = null;
      if (!S.f.gotFlash) {
        // 베개 밑에 숨어 있다가, 베개를 들면 시트 위로 톡 굴러떨어진다
        fl = img('img/it_flash.png', 562, 402, 84, 24);
        fl.style.transition = 'transform .28s cubic-bezier(.5,0,.9,.6)';
        fl.style.transform = S.f.pillow ? 'translateY(75%) rotate(-3deg)' : 'rotate(-3deg)';
      }
      var pl = piece('img/r2_n.webp', 498, 372, 190, 58);
      pl.style.borderRadius = '40% / 50%';
      pl.style.transition = 'transform .35s cubic-bezier(.3,1.6,.5,1)';
      if (S.f.pillow) pl.style.transform = 'translate(-6%,-40%) rotate(-8deg)';
      function flashSpot() { spot(550, 404, 660, 452, function () { S.f.gotFlash = 1; fl.remove(); give('flash'); save(); }); }
      if (S.f.pillow && fl) flashSpot();
      spot(498, 372, 688, 400, function () {
        if (!S.f.pillow) { S.f.pillow = 1; save(); SND.play('swing'); bg.src = 'img/r2_n_pl.webp'; pl.style.transform = 'translate(-6%,-40%) rotate(-8deg)';
          if (fl) { setTimeout(function () { fl.style.transform = 'translateY(75%) rotate(-3deg)'; setTimeout(function () { SND.play('thud', 0); }, 260); }, 90); flashSpot(); } }
        else wobble(pl, 2);
      });
      var pr = piece('img/r2_n.webp', 694, 372, 190, 58);
      spot(694, 372, 884, 430, function () { SND.play('swing'); wobble(pr, 3); });
      spot(380, 628, 1000, 720, function () { go('2under'); });
      spot(292, 440, 424, 490, function () { SND.play('drawer'); say('안경집뿐이다.'); });
      spot(316, 308, 394, 430, lampToggle);
      spot(962, 326, 1094, 436, function () { go('2music'); });
      var pt = piece('img/r2_n.webp', 548, 46, 282, 206); pt.style.transformOrigin = '50% 4%';
      spot(548, 46, 830, 252, function () { SND.play('swing'); wobble(pt, 3); });
    }
  };
  V['2under'] = {
    img: function () { return 'img/c2_under.webp'; }, back: '2n',
    build: function () { underBed(boxUnder); }
  };
  // 침대 밑 상자(방 2 첫 스테이지): 불을 비추면 뚜껑을 열 수 있다
  function boxUnder() {
      var lid;
      if (!S.f.boxOpen) {
        lid = piece('img/c2_under.webp', 632, 376, 256, 38);
        lid.style.transition = 'transform .5s cubic-bezier(.3,1.4,.5,1), opacity .5s';
      } else {
        // 뚜껑을 연 상자: 안이 어둡게 보인다
        var inside = div('spr', 642, 384, 236, 26); inside.style.background = 'linear-gradient(180deg,#0c0806,#241a12)'; inside.style.borderRadius = '2px';
        if (!S.f.gotCrank) {
          var ck = img('img/it_crank.png', 610, 470, 110, 70); ck.style.transform = 'rotate(-14deg)';
          spot(600, 462, 730, 548, function () { S.f.gotCrank = 1; ck.remove(); give('crank'); save(); });
        }
        if (S.clues.indexOf('receipt') < 0) {
          var rc = img('img/it_receipt.png', 790, 478, 70, 80); rc.style.transform = 'rotate(12deg)';
          spot(780, 470, 870, 566, function () { rc.remove(); getClue('receipt'); });
        }
      }
      spot(632, 376, 888, 480, function () {
        if (!S.f.lit) return;
        if (!S.f.boxOpen) { S.f.boxOpen = 1; save(); SND.play('paper'); lid.style.transform = 'translate(30%,-120%) rotate(18deg)'; lid.style.opacity = 0; setTimeout(render, 480); }
      });
  }
  // 침대 밑: 캄캄하다. 손전등을 쓰면 누른 곳·마우스 둘레만 보인다
  function underBed(content) {
      if (content) content();
      // 어둠: 손전등을 켜면 누른 곳·마우스 둘레만 보인다
      var dk = div('spr', 0, 0, W, H);
      dk.style.background = '#000'; dk.style.opacity = S.f.lit ? .96 : .985;
      var glow = div('spr', 0, 0, W, H); glow.style.mixBlendMode = 'screen';
      function aim(px, py) {
        var m = 'radial-gradient(circle at ' + px + '% ' + py + '%, transparent 0, transparent 11%, #000 19%)';
        dk.style.webkitMaskImage = m; dk.style.maskImage = m;
        glow.style.background = 'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(255,236,190,.28) 0, rgba(255,236,190,.1) 10%, rgba(0,0,0,0) 17%)';
      }
      if (S.f.lit) aim(S.f.lx || 55, S.f.ly || 58);
      layer.onpointermove = function (e) { if (S.f.lit && S.view === '2under') track(e); };
      layer.onpointerdown = function (e) {
        if (S.view !== '2under') return;
        if (!S.f.lit && hasSel('flash')) { var rr = viewEl.getBoundingClientRect(); LAST = { x: (e.clientX - rr.left) / rr.width * W, y: (e.clientY - rr.top) / rr.height * H }; takeAway('flash'); S.f.lit = 1; save(); SND.play('lamp'); dk.style.opacity = .96; }
        if (S.f.lit) track(e);
      };
      function track(e) {
        var r = viewEl.getBoundingClientRect();
        S.f.lx = (e.clientX - r.left) / r.width * 100; S.f.ly = (e.clientY - r.top) / r.height * 100; aim(S.f.lx, S.f.ly);
      }
  }
  V['2music'] = {
    img: function () { return S.f.mbOpen ? 'img/c2_music_open_nb.webp' : 'img/c2_music.webp'; }, back: '2n',
    build: function () {
      if (S.f.mbOpen) {
        // 발레리나: 음악이 나오면 제자리에서 돈다
        var bl = img('img/sp_ballerina.png', 610, 200, 150, 204); bl.id = 'ballerina';
        bl.style.transformOrigin = '53% 100%';
        if (boxBusy) bl.style.animation = 'pirou 1.1s linear infinite';
      }
      spot(250, 120, 1170, 430, function () { if (S.f.mbOpen) playBox(); else SND.play('tick'); });
      drawer('MB', 262, 432, 622, 212, S.f.mbOpen ? 'img/c2_music_open.webp' : 'img/c2_music.webp');
      spot(1000, 336, 1070, 420, function () {
        if (S.f.mbOpen) { playBox(); return; }
        if (!hasSel('crank')) { SND.play('tick'); return; }
        takeAway('crank'); S.f.mbOpen = 1; save(); SND.play('wind');
        setTimeout(function () {
          bg2.src = 'img/c2_music_open.webp'; bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1; SND.play('creak');
          setTimeout(function () { render(); playBox(true); }, 950);
        }, 900);
      });
    }
  };
  var boxBusy = false;
  function playBox(first) {
    if (boxBusy) return; boxBusy = true;
    SND.play('musicbox');
    var bl = $('ballerina'); if (bl) bl.style.animation = 'pirou 1.1s linear infinite';
    setTimeout(function () {
      boxBusy = false;
      var b2 = $('ballerina'); if (b2) b2.style.animation = '';
      if (first && !S.f.mbFree) { S.f.mbFree = 1; S.f.drMB = 1; save(); SND.play('drawer'); if (S.view === '2music') render(); }
    }, 8600);
  }
  V['2e'] = {
    img: function () { return 'img/r2_e.webp'; }, left: '2n', right: '2s',
    build: function () {
      var ct = piece('img/r2_e.webp', 930, 0, 170, 610); ct.style.transformOrigin = '50% 0';
      spot(930, 0, 1100, 610, function () { SND.play('swing'); wobble(ct, 1.5); });
      spot(405, 430, 955, 700, function () { go('2vanity'); });
      spot(480, 356, 594, 428, function () { SND.play('spray'); });
      spot(782, 372, 884, 428, function () { SND.play('click'); say('보석함은 비어 있다.'); });
      spot(0, 340, 128, 470, function () { go('2music'); });
    }
  };
  V['2vanity'] = {
    img: function () { return 'img/c2_vanity.webp'; }, back: '2e',
    build: function () {
      drawer('V', VAN[0], VAN[1], VAN[2], VAN[3], 'img/c2_vanity.webp');
      spot(VANPF[0], VANPF[1], VANPF[2], VANPF[3], function () { SND.play('spray'); });
      spot(942, 306, 1172, 430, function () { SND.play('click'); say('보석함은 비어 있다.'); });
    }
  };
  V['2s'] = {
    img: function () { return 'img/r2_s.webp'; }, left: '2e', right: '2w',
    build: function () {
      spot(255, 110, 525, 615, function () { SND.play('rattle'); shakeView(); });
      var rb = piece('img/r2_s.webp', 612, 232, 142, 336); rb.style.transformOrigin = '50% 3%';
      spot(612, 232, 754, 568, function () { SND.play('swing'); wobble(rb, 3); say('가운 주머니는 비어 있다.'); });
      spot(850, 110, 1100, 615, function () { go('2bath'); });
    }
  };
  V['2bath'] = {
    img: function () { return 'img/c2_bath.webp'; }, back: '2s',
    build: function () { buildBath(null); }
  };
  V['2w'] = {
    img: function () { return S.f.wardOpen ? 'img/r2_w_open.webp' : 'img/r2_w.webp'; }, left: '2s', right: '2n',
    build: function () {
      if (!S.f.wardOpen) spot(235, 105, 620, 640, openDirLock);
      else {
        spot(270, 200, 590, 600, function () { SND.play('swing'); });
        if (!S.f.coatDone) spot(372, 360, 540, 470, function () {
          S.f.coatDone = 1; save(); SND.play('paper');
          give('silver'); setTimeout(function () { getClue('brothers'); }, 400);
        });
      }
      spot(770, 300, 840, 360, openKeypad);
      spot(850, 110, 1112, 615, function () { if (S.f.exitOpen) escapeRoom(); else { SND.play('rattle'); shakeView(); } });
    }
  };

  // 방향 자물쇠(옷장)
  // 자물쇠가 풀리면 창이 금빛으로 번쩍하고 누른 자리에 반짝임
  function lockGlow(box) {
    var c = box.parentElement; c.classList.remove('okglow'); void c.offsetWidth; c.classList.add('okglow');
    FX.star(LAST.x, LAST.y, 120); FX.glow(LAST.x, LAST.y, 320, 'rgba(255,220,140,.6)');
  }
  function lockShake(box) { var c = box.parentElement; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
  function openDirLock() {
    lockDirs(DIRS, function () {
      S.f.wardOpen = 1; save();
      setTimeout(function () {
        $('dialM').classList.remove('on'); SND.play('creak');
        bg2.src = 'img/r2_w_open.webp'; bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1;
        setTimeout(render, 950);
      }, 500);
    });
  }
  function lockDirs(DIRS, ok) {
    var box = $('dial'); box.innerHTML = '';
    var seq = [];
    var dots = document.createElement('div'); dots.className = 'dots';
    var pad = document.createElement('div'); pad.className = 'dpad';
    ['u', 'l', 'r', 'd'].forEach(function (d) {
      var b = document.createElement('button'); b.className = 'kbtn dir ' + d;
      b.onclick = function () {
        if (seq.length >= DIRS.length) return;
        seq.push(d); SND.play('tick'); paint();
        if (seq.length === DIRS.length) {
          if (seq.join('') === DIRS.join('')) {
            SND.play('unlock'); lockGlow(box); ok();
          } else { SND.play('wrong'); lockShake(box); setTimeout(function () { seq = []; paint(); }, 420); }
        }
      };
      pad.appendChild(b);
    });
    function paint() { dots.innerHTML = DIRS.map(function (_, i) { return '<i class="' + (i < seq.length ? 'on' : '') + '"></i>'; }).join(''); }
    box.style.flexDirection = 'column'; box.style.alignItems = 'center';
    paint(); box.appendChild(dots); box.appendChild(pad);
    $('dialM').classList.add('on');
  }
  // 누름 번호 자물쇠(출구)
  function openKeypad() {
    if (S.f.exitOpen) return;
    lockKeys(KEYPAD, function () { setTimeout(function () { $('dialM').classList.remove('on'); SND.play('door'); escapeRoom(); }, 600); });
  }
  function lockKeys(KEYPAD, ok) {
    var box = $('dial'); box.innerHTML = '';
    var cur = '';
    var scr = document.createElement('div'); scr.className = 'dots';
    var grid = document.createElement('div'); grid.className = 'kgrid';
    '123456789 0 '.split('').forEach(function (c) {
      var b = document.createElement('button'); b.className = 'kbtn' + (c === ' ' ? ' blank' : ''); b.textContent = c;
      if (c !== ' ') b.onclick = function () {
        if (cur.length >= KEYPAD.length) return;
        cur += c; SND.play('click'); paint();
        if (cur.length === KEYPAD.length) {
          if (cur === KEYPAD) {
            SND.play('unlock'); lockGlow(box); S.f.exitOpen = 1; save(); ok();
          } else { SND.play('wrong'); lockShake(box); setTimeout(function () { cur = ''; paint(); }, 420); }
        }
      };
      grid.appendChild(b);
    });
    function paint() { scr.innerHTML = KEYPAD.split('').map(function (_, i) { return '<i class="' + (i < cur.length ? 'on' : '') + '"></i>'; }).join(''); }
    box.style.flexDirection = 'column'; box.style.alignItems = 'center';
    paint(); box.appendChild(scr); box.appendChild(grid);
    $('dialM').classList.add('on');
  }

  // 욕실: 온수 손잡이를 끼우고 틀면 김이 올라 거울에 화살표가 드러난다
  function buildBath(fogArt) {
    fogArt = fogArt || function () { return arrowsSvg(DIRS); };
    var hasTap = S.f.tapIn;
    if (hasTap) {
      var th = img('img/it_tap.png', BATH.tap[0] - 34, BATH.tap[1] - 30, 68, 54);
      th.style.transition = 'transform .6s'; if (S.f.hot) th.style.transform = 'rotate(-80deg)';
    }
    if (S.f.hot) {
      // 흐르는 물 + 김
      var wt = div('spr', BATH.spout[0] - 5, BATH.spout[1], 10, BATH.basin - BATH.spout[1]);
      wt.style.background = 'linear-gradient(90deg,rgba(200,225,255,.15),rgba(235,245,255,.75),rgba(200,225,255,.15))';
      wt.style.animation = 'water .25s linear infinite';
      for (var i = 0; i < 6; i++) {
        var st = div('spr steam', BATH.spout[0] - 160 + i * 50, BATH.basin - 120, 150, 150);
        st.style.animationDelay = (i * .7) + 's';
      }
    }
    // 거울 김 서림(타원 가림막) + 손가락 화살표
    var m = BATH.mirror;
    var fog = div('spr fog', m[0], m[1], m[2] - m[0], m[3] - m[1]);
    fog.style.opacity = S.f.fog ? 1 : 0;
    if (S.f.fog) fog.appendChild(fogArt());
    spot(BATH.tap[0] - 50, BATH.tap[1] - 45, BATH.tap[0] + 50, BATH.tap[1] + 45, function () {
      if (!S.f.tapIn) {
        if (!hasSel('tap')) { SND.play('tick'); return; }
        takeAway('tap'); S.f.tapIn = 1; save(); SND.play('click'); render(); return;
      }
      if (!S.f.hot) {
        S.f.hot = 1; save(); SND.play('creak'); SND.play('water', .4); render();
        setTimeout(function () { if (S.view !== '2bath') { S.f.fog = 1; save(); return; } S.f.fog = 1; save(); var f = layer.querySelector('.fog'); if (f) { f.appendChild(fogArt()); f.style.opacity = 1; } }, 2600);
        return;
      }
      SND.play('water');
    });
    spot(BATH.cold[0] - 45, BATH.cold[1] - 40, BATH.cold[0] + 45, BATH.cold[1] + 40, function () { SND.play('water'); });
  }
  function arrowsSvg(DIRS) {
    // 거울에 손가락으로 그은 화살표 다섯: 김이 닦인 줄은 어둡고 또렷하게
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 500 200'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = 'position:absolute;left:6%;top:18%;width:88%;height:64%;overflow:visible';
    var A = { u: 'M0 30 L0 -30 M-16 -12 L0 -30 L16 -12', d: 'M0 -30 L0 30 M-16 12 L0 30 L16 12', l: 'M30 0 L-30 0 M-12 -16 L-30 0 L-12 16', r: 'M-30 0 L30 0 M12 -16 L30 0 L12 16' };
    svg.innerHTML = DIRS.map(function (d, i) {
      return '<path transform="translate(' + (50 + i * 100) + ' 100) rotate(' + ((i % 2 ? 4 : -5)) + ')" d="' + A[d] + '" fill="none" stroke="rgba(52,70,88,.62)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#fb)"/>';
    }).join('') + '<defs><filter id="fb"><feGaussianBlur stdDeviation="1.3"/></filter></defs>';
    return svg;
  }


  // ================= 방 3 부엌·식당 =================
  var SEATS_A = ['jung', 'dohyun', 'min', 'oh'];               // 정답: 왼쪽(부엌 쪽)부터
  var SEAT_NAME = { min: '민재석', jung: '정순자', oh: '오병철', dohyun: '한도현' };   // 풀네임(사장님 9/27 "이름으로 해야 매칭")
  // 확대 그림 좌표(원본 1376x768)
  var R3W = { door: [586, 194, 784, 580], wine: [276, 400, 460, 580], vase: [974, 330, 1090, 596] };
  var CAB = { stack: [586, 292, 790, 532] };
  var OVEN = { stem: [554, 180], door: [360, 222, 1014, 592], inside: [470, 330, 760, 360] };
  var TABLE = { cards: [[228, 548], [524, 548], [828, 548], [1114, 548]], drawer: [472, 622, 422, 70] };
  var FRIDGE_IN = [1066, 430, 1100, 548];
  V['3n'] = {
    img: function () { return 'img/r3_n.webp'; }, left: '3w', right: '3e',
    build: function () {
      spot(150, 400, 1210, 470, function () { go('3table'); });
      spot(566, 520, 810, 566, function () { go('3table'); });
      spot(200, 160, 370, 600, function () { go('3e'); });
      var ct = piece('img/r3_n.webp', 1180, 20, 196, 480); ct.style.transformOrigin = '50% 0';
      spot(1180, 20, 1376, 500, function () { SND.play('swing'); wobble(ct, 1.5); });
      var ch = piece('img/r3_n.webp', 560, 0, 260, 120); ch.style.transformOrigin = '50% 0';
      spot(560, 0, 820, 120, function () { SND.play('rattle'); wobble(ch, 4); });
    }
  };
  V['3e'] = {
    img: function () { return S.f.fridge ? 'img/r3_e_open.webp' : 'img/r3_e.webp'; }, left: '3n', right: '3s',
    build: function () {
      spot(110, 380, 400, 680, function () { go('3oven'); });
      var pn = piece('img/r3_e.webp', 550, 250, 262, 136); pn.style.transformOrigin = '50% 0';
      spot(550, 250, 812, 386, function () { SND.play('rattle'); wobble(pn, 5); });
      spot(580, 425, 800, 458, function () { SND.play('water'); });
      if (!S.f.fridge) {
        spot(990, 240, 1270, 700, function () {
          if (hasSel('fkey')) {
            takeAway('fkey'); S.f.fridge = 1; save(); SND.play('unlock'); SND.play('creak', .3); setTimeout(function () { FX.glow(1130, 420, 520, 'rgba(210,235,255,.7)'); }, 350);
            fadeSwap(); return;
          }
          SND.play('rattle'); shakeView();
        });
      } else {
        var F = FRIDGE_IN;
        if (S.clues.indexOf('bday') < 0) {
          var cd = img('img/it_bday.png', F[0], F[1], 90, 80); cd.style.transform = 'rotate(-6deg)';
          spot(F[0] - 6, F[1] - 6, F[0] + 96, F[1] + 86, function () { cd.remove(); getClue('bday'); });
        }
        if (!S.f.gotInvite) {
          var iv = img('img/it_invite.png', F[2], F[3], 96, 74); iv.style.transform = 'rotate(5deg)';
          spot(F[2] - 6, F[3] - 6, F[2] + 102, F[3] + 80, function () { S.f.gotInvite = 1; iv.remove(); give('invite'); save(); setTimeout(function () { lookItem('invite'); }, 350); });
        }
      }
    }
  };
  V['3s'] = {
    img: function () { return 'img/r3_s.webp'; }, left: '3e', right: '3w',
    build: function () {
      spot(200, 160, 370, 594, function () { SND.play('rattle'); shakeView(); });
      spot(980, 110, 1284, 610, function () { go('3cab'); });
      var pt = piece('img/r3_s.webp', 786, 206, 132, 96); pt.style.transformOrigin = '50% 0';
      spot(786, 206, 918, 302, function () { SND.play('swing'); wobble(pt, 4); });
    }
  };
  V['3w'] = {
    img: function () { return 'img/r3_w.webp'; }, left: '3s', right: '3n',
    build: function () {
      spot(R3W.door[0], R3W.door[1], R3W.door[2], R3W.door[3], function () {
        if (hasSel('ekey3')) { takeAway('ekey3'); SND.play('unlock'); setTimeout(function () { SND.play('door'); }, 400); escapeRoom(); return; }
        SND.play('rattle'); shakeView();
      });
      spot(R3W.wine[0], R3W.wine[1], R3W.wine[2], R3W.wine[3], function () { SND.play('book'); say('빈 병뿐이다.'); });
      var vs = piece('img/r3_w.webp', R3W.vase[0], R3W.vase[1], R3W.vase[2] - R3W.vase[0], R3W.vase[3] - R3W.vase[1]); vs.style.transformOrigin = '50% 100%';
      spot(R3W.vase[0], R3W.vase[1], R3W.vase[2], R3W.vase[3], function () { SND.play('book'); wobble(vs, 4); });
    }
  };
  // 찬장: 접시 더미를 들어 올리면 맨 아래에 오븐 손잡이
  V['3cab'] = {
    img: function () { return 'img/c3_cab_np.webp'; }, back: '3s',
    build: function () {
      var P = CAB.stack;
      if (S.f.plates && !S.f.gotKnob) {
        var kb = img('img/it_knob.png', P[0] + (P[2] - P[0]) / 2 - 40, P[3] - 62, 80, 64);
        spot(P[0], P[3] - 80, P[2], P[3] + 4, function () { S.f.gotKnob = 1; kb.remove(); give('knob'); save(); });
      }
      // 접시만 모양대로 오린 조각(tools/plates.py). 배경은 접시를 치운 찬장이라 들어도 접시가 둘로 보이지 않는다
      var pl = img('img/sp_plates.png', 582, 284, 218, 252);
      pl.style.transition = 'transform .5s cubic-bezier(.3,1.3,.5,1)';
      if (S.f.plates) pl.style.transform = 'translate(38%,-18%) rotate(3deg)';
      spot(P[0], P[1], P[2], P[3] - 80, function () {
        if (!S.f.plates) { S.f.plates = 1; save(); SND.play('rattle'); pl.style.transform = 'translate(38%,-18%) rotate(3deg)'; setTimeout(render, 520); }
        else { SND.play('rattle'); wobble(pl, 1.5); }
      });
    }
  };
  // 오븐: 가운데 손잡이를 끼우고 돌리면 문이 열린다
  V['3oven'] = {
    img: function () { return S.f.oven ? 'img/c3_oven_open.webp' : 'img/c3_oven.webp'; }, back: '3e',
    build: function () {
      var K = OVEN.stem;
      if (!S.f.oven) {
        if (S.f.knobIn) { var kn = img('img/it_knob.png', K[0] - 40, K[1] - 34, 80, 64); kn.style.transition = 'transform .8s'; }
        spot(K[0] - 55, K[1] - 50, K[0] + 55, K[1] + 50, function () {
          if (!S.f.knobIn) {
            if (!hasSel('knob')) { SND.play('tick'); return; }
            takeAway('knob'); S.f.knobIn = 1; save(); SND.play('click'); render(); return;
          }
          kn.style.transform = 'rotate(270deg)'; SND.play('wind');
          setTimeout(function () {
            S.f.oven = 1; save(); SND.play('unlock'); SND.play('creak', .2);
            fadeSwap();
          }, 900);
        });
        spot(OVEN.door[0], OVEN.door[1], OVEN.door[2], OVEN.door[3], function () { SND.play('rattle'); shakeView(); });
      } else {
        var I = OVEN.inside;
        if (S.clues.indexOf('burnt') < 0) {
          var bn = img('img/it_burnt.png', I[0], I[1], 110, 90); bn.style.transform = 'rotate(-8deg)';
          spot(I[0] - 6, I[1] - 6, I[0] + 116, I[1] + 96, function () { bn.remove(); getClue('burnt'); });
        }
        if (!S.f.gotFkey) {
          var fk = img('img/it_fkey.png', I[2], I[3], 70, 70); fk.style.transform = 'rotate(20deg)';
          spot(I[2] - 6, I[3] - 6, I[2] + 76, I[3] + 76, function () { S.f.gotFkey = 1; fk.remove(); give('fkey'); save(); });
        }
      }
    }
  };
  // 식탁: 이름표 두 장을 차례로 누르면 자리가 바뀐다
  V['3table'] = {
    img: function () { return 'img/c3_table.webp'; }, back: '3n',
    build: function () {
      if (!S.cards) S.cards = ['min', 'oh', 'jung', 'dohyun'];
      var solved = S.f.seated;
      TABLE.cards.forEach(function (p, i) {
        var nw = window.MS_EN ? 230 : 140, c = div('spr namecard', p[0] - nw / 2, p[1] - 30, nw, 60);   // 영문판은 직함까지 한 줄로
        c.textContent = SEAT_NAME[S.cards[i]];
        c.dataset.i = i;
        if (tableSel === i) c.classList.add('pick');
        if (!solved) spot(p[0] - 74, p[1] - 34, p[0] + 74, p[1] + 34, function () { cardClick(i); });
      });
      var D = TABLE.drawer;
      drawer('T', D[0], D[1], D[2], D[3], 'img/c3_table.webp');
    }
  };
  var tableSel = -1;
  function fadeSwap() {
    var f = $('fade'); f.style.transition = 'opacity .35s'; f.style.opacity = 1;
    setTimeout(function () { render(); f.style.opacity = 0; }, 380);
  }
  function cardClick(i, SEATS_) {
    var SEATS = SEATS_ || SEATS_A;
    SND.play('paper');
    if (tableSel < 0) { tableSel = i; render(); return; }
    if (tableSel !== i) { var t = S.cards[i]; S.cards[i] = S.cards[tableSel]; S.cards[tableSel] = t; }
    tableSel = -1; save(); render();
    if (S.cards.join() === SEATS.join()) {
      S.f.seated = 1; S.f.tFree = 1; save();
      setTimeout(function () { SND.play('unlock'); S.f.drT = 1; SND.play('drawer', .2); save(); render(); }, 450);
    }
  }


  // ================= 방 4 지하 암실 =================
  var TRAY_ORDER = [0, 1, 2];                                // 현상 → 정지 → 정착 (왼쪽부터)
  var DOOR4 = [0, 9, 2, 4];
  var WIRES_L = ['R', 'Y', 'B'], WIRES_R = ['B', 'R', 'Y'];
  var WIRE_C = { R: '#d8322a', Y: '#e8c21c', B: '#2c6ad8' };
  // 그림 좌표(원본 1376x768) — 그림을 받은 뒤 채운다
  var R4 = { drawer: [566, 510, 810, 580], trays: [250, 400, 1110, 495], lamp: [586, 152, 796, 200], enl: [114, 210, 424, 600], memo: [428, 272, 500, 370], line: [794, 170, 1376, 450],
    panel: [258, 238, 392, 474], door: [884, 154, 1156, 644], wall: [640, 360], stairs: [130, 322, 380, 732], crates: [1000, 452, 1260, 732], glove: [1110, 690], umb: [1250, 600] };
  var TRAYS = [[50, 396, 630, 756], [490, 296, 1050, 610], [860, 236, 1280, 470]];
  var PANEL = { l: [[557, 362], [586, 362], [612, 362]], r: [[760, 362], [788, 362], [816, 362]], lever: [610, 230, 770, 300] };
  function uvTint() { return S.f.uv ? 'hue-rotate(245deg) saturate(.8) brightness(.9)' : ''; }

  V['4n'] = {
    img: function () { return 'img/r4_n.webp'; }, left: '4w', right: '4e',
    build: function () {
      bg.style.filter = uvTint();
      var d = R4.drawer;
      drawer('F', d[0], d[1], d[2] - d[0], d[3] - d[1], 'img/r4_n.webp');
      spot(R4.trays[0], R4.trays[1], R4.trays[2], R4.trays[3], function () { go('4tray'); });
      var lp = piece('img/r4_n.webp', R4.lamp[0], R4.lamp[1], R4.lamp[2] - R4.lamp[0], R4.lamp[3] - R4.lamp[1]); lp.style.transformOrigin = '50% 0';
      spot(R4.lamp[0], R4.lamp[1], R4.lamp[2], R4.lamp[3], function () { SND.play('lamp'); wobble(lp, 5); });
    }
  };
  V['4e'] = {
    img: function () { return 'img/r4_e.webp'; }, left: '4n', right: '4s',
    build: function () {
      bg.style.filter = uvTint();
      spot(R4.enl[0], R4.enl[1], R4.enl[2], R4.enl[3], enlargerClick);
      spot(R4.memo[0], R4.memo[1], R4.memo[2], R4.memo[3], function () { SND.play('paper'); showLook('img/it_paperw.png', '메모', '현상 → 정지 → 정착'); });
      var ln = piece('img/r4_e.webp', R4.line[0], R4.line[1], R4.line[2] - R4.line[0], R4.line[3] - R4.line[1]); ln.style.transformOrigin = '50% 0';
      spot(R4.line[0], R4.line[1], R4.line[2], R4.line[3], function () { SND.play('paper'); wobble(ln, 1.2); });
    }
  };
  V['4s'] = {
    img: function () { return S.f.uv ? 'img/r4_s_uv.webp' : 'img/r4_s.webp'; }, left: '4e', right: '4w',
    build: function () {
      spot(R4.stairs[0], R4.stairs[1], R4.stairs[2], R4.stairs[3], function () { SND.play('rattle'); shakeView(); });
      if (S.f.uv) {
        if (S.clues.indexOf('glove') < 0) {
          var gl = img('img/it_glove.png', R4.glove[0] - 45, R4.glove[1] - 40, 90, 80); gl.style.filter = 'drop-shadow(0 0 10px rgba(170,255,240,.9)) brightness(1.2)'; gl.style.transform = 'rotate(-20deg)';
          spot(R4.glove[0] - 55, R4.glove[1] - 50, R4.glove[0] + 55, R4.glove[1] + 50, function () { gl.remove(); getClue('glove'); });
        }
        if (S.clues.indexOf('umbrella') < 0) {
          var um = img('img/it_umbrella.png', R4.umb[0] - 80, R4.umb[1] - 85, 160, 170); um.style.filter = 'drop-shadow(0 0 8px rgba(170,200,255,.6))';
          spot(R4.umb[0] - 85, R4.umb[1] - 90, R4.umb[0] + 76, R4.umb[1] + 90, function () { um.remove(); getClue('umbrella'); });
        }
      } else spot(R4.crates[0], R4.crates[1], R4.crates[2], R4.crates[3], function () { SND.play('book'); say('너무 어두워 잘 안 보인다.'); });
    }
  };
  V['4w'] = {
    img: function () { return S.f.uv ? 'img/r4_w_uv.webp' : 'img/r4_w.webp'; }, left: '4s', right: '4n',
    build: function () {
      if (S.f.uv) {
        // 자외선에만 보이는 형광 숫자
        var n = div('spr uvnum', R4.wall[0] - 170, R4.wall[1] - 70, 340, 140); n.textContent = DOOR4.join('');
      }
      spot(R4.panel[0], R4.panel[1], R4.panel[2], R4.panel[3], function () { go('4panel'); });
      spot(R4.door[0], R4.door[1], R4.door[2], R4.door[3], function () {
        if (S.f.door4) { escapeRoom(); return; }
        openDial({ key: 'd4', code: DOOR4, ok: function () { S.f.door4 = 1; save(); SND.play('door'); escapeRoom(); } });
      });
    }
  };
  // 확대기: 필름을 끼우고 누르면 빛이 번쩍, 인화지 한 장
  function enlargerClick() {
    if (!S.f.filmIn) {
      if (!hasSel('film')) { SND.play('click'); return; }
      takeAway('film'); S.f.filmIn = 1; save(); SND.play('click'); return;
    }
    if (S.inv.indexOf('paperw') >= 0 || S.clues.indexOf('nightphoto') >= 0) { SND.play('click'); return; }
    SND.play('lamp');
    var fl = div('spr', 0, 0, W, H); fl.style.background = 'radial-gradient(circle at ' + ((R4.enl[0] + R4.enl[2]) / 2 / W * 100) + '% ' + (R4.enl[3] / H * 100) + '%, rgba(255,250,235,.95), rgba(255,240,210,.35) 30%, rgba(0,0,0,0) 60%)';
    fl.style.transition = 'opacity .9s'; setTimeout(function () { fl.style.opacity = 0; }, 180);
    setTimeout(function () { S.f.trayStep = 0; S.f.ruined = 0; give('paperw'); save(); render(); }, 1000);
  }
  // 현상 트레이: 인화지를 고른 채 차례로 담근다
  V['4tray'] = {
    img: function () { return 'img/c4_tray.webp'; }, back: '4n',
    build: function () {
      bg.style.filter = uvTint();
      var step = S.f.trayStep || 0;
      if (step > 0 && S.clues.indexOf('nightphoto') < 0) {
        // 담가 둔 인화지: 마지막으로 담근 트레이 위에 떠 있다
        var t = TRAYS[Math.min(step, 3) - 1];
        var pp = img(step >= 3 ? 'img/it_nightphoto.png' : 'img/it_paperw.png', (t[0] + t[2]) / 2 - 80, (t[1] + t[3]) / 2 - 55, 160, 110);
        pp.style.transform = 'perspective(600px) rotateX(38deg)'; pp.style.opacity = .92;
        if (step === 1) pp.style.filter = 'brightness(.9) contrast(.8) sepia(.3)';
        if (step === 2) pp.style.filter = 'brightness(.8) contrast(.9) sepia(.2)';
        if (step >= 3) spot((t[0] + t[2]) / 2 - 90, (t[1] + t[3]) / 2 - 65, (t[0] + t[2]) / 2 + 90, (t[1] + t[3]) / 2 + 65, function () { getClue('nightphoto'); render(); });
      }
      TRAYS.forEach(function (t, i) {
        spot(t[0], t[1], t[2], t[3], function () {
          if (step >= 3) { if (S.clues.indexOf('nightphoto') < 0) { getClue('nightphoto'); render(); } else SND.play('water'); return; }
          if (!hasSel('paperw') && !(step > 0 && step < 3)) { SND.play('water'); return; }
          if (i !== TRAY_ORDER[step]) {
            // 순서가 틀리면 인화지가 새까맣게 탄다
            SND.play('wrong'); takeAway('paperw', true); S.f.trayStep = 0; save();
            var bk = img('img/it_paperw.png', (t[0] + t[2]) / 2 - 80, (t[1] + t[3]) / 2 - 55, 160, 110);
            bk.style.transform = 'perspective(600px) rotateX(38deg)'; bk.style.filter = 'brightness(.05)';
            bk.style.transition = 'opacity 1.4s'; setTimeout(function () { bk.style.opacity = 0; }, 900);
            return;
          }
          if (step === 0) takeAway('paperw');
          S.f.trayStep = step + 1; save(); SND.play('water'); render();
        });
      });
    }
  };
  // 배전반: 왼쪽 단자를 누르고 같은 색 오른쪽 단자를 누르면 전선이 이어진다
  var wirePick = -1;
  V['4panel'] = {
    img: function () { return 'img/c4_panel.webp'; }, back: '4w',
    build: function () {
      bg.style.filter = uvTint();
      if (!S.wires) S.wires = [-1, -1, -1];
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1376 768'); svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      var html = '';
      S.wires.forEach(function (r, i) {
        if (r < 0) return;
        var a = PANEL.l[i], b = PANEL.r[r], mx = (a[0] + b[0]) / 2;
        html += '<path d="M' + a[0] + ' ' + a[1] + ' C' + mx + ' ' + (a[1] + 40) + ' ' + mx + ' ' + (b[1] + 40) + ' ' + b[0] + ' ' + b[1] + '" stroke="#111" stroke-width="16" fill="none" stroke-linecap="round"/>' +
          '<path d="M' + a[0] + ' ' + a[1] + ' C' + mx + ' ' + (a[1] + 40) + ' ' + mx + ' ' + (b[1] + 40) + ' ' + b[0] + ' ' + b[1] + '" stroke="' + WIRE_C[WIRES_L[i]] + '" stroke-width="10" fill="none" stroke-linecap="round"/>';
      });
      if (wirePick >= 0) { var p = PANEL.l[wirePick]; html += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="none" stroke="#fff" stroke-width="5" opacity=".9"/>'; }
      svg.innerHTML = html; layer.appendChild(svg);
      if (S.f.uv) return;
      PANEL.l.forEach(function (p, i) {
        spot(p[0] - 13, p[1] - 30, p[0] + 13, p[1] + 150, function () { SND.play('tick'); wirePick = i; S.wires[i] = -1; render(); });
      });
      PANEL.r.forEach(function (p, j) {
        spot(p[0] - 13, p[1] - 30, p[0] + 13, p[1] + 150, function () {
          if (wirePick < 0) { SND.play('tick'); return; }
          if (WIRES_L[wirePick] !== WIRES_R[j]) { SND.play('wrong'); shakeView(); wirePick = -1; render(); return; }
          S.wires[wirePick] = j; wirePick = -1; SND.play('click'); save(); FX.spark(PANEL.r[j][0], PANEL.r[j][1]); render();
        });
      });
      spot(PANEL.lever[0], PANEL.lever[1], PANEL.lever[2], PANEL.lever[3], function () {
        if (S.wires.indexOf(-1) >= 0) { SND.play('rattle'); return; }
        S.f.uv = 1; save(); SND.play('bigthud'); SND.play('hum', .2); FX.spark((PANEL.lever[0] + PANEL.lever[2]) / 2, (PANEL.lever[1] + PANEL.lever[3]) / 2, true);
        var f = $('fade'); f.style.transition = 'opacity .12s'; f.style.opacity = 1;
        setTimeout(function () { render(); f.style.transition = 'opacity .8s'; f.style.opacity = 0; }, 260);
      });
    }
  };


  // ================= 방 5 비밀 서재 + 엔딩 =================
  var CULPRIT = 'dohyun';
  var SUS = ['min', 'jung', 'oh', 'dohyun'];
  var R5 = { pins: [[498, 150], [624, 150], [750, 150], [876, 150]], desk: [460, 340, 910, 540], door: [566, 156, 810, 644], shelf: [690, 140, 808, 570], crack: [664, 300, 770, 520] };
  V['5n'] = {
    img: function () { return 'img/r5_n.webp'; }, left: '5w', right: '5e',
    build: function () {
      SUS.forEach(function (id, i) {
        var p = R5.pins[i];
        var wrong = S.f['no_' + id];
        var ph = img('img/sus_' + id + '.png', p[0] - 52, p[1] - 6, 104, 142);
        ph.className = 'spr susp';
        ph.style.transform = wrong ? 'translateY(22%) rotate(' + ([-4, 3, -2, 5][i] + 18) + 'deg)' : 'rotate(' + [-4, 3, -2, 5][i] + 'deg)';
        if (wrong) { ph.style.filter = 'grayscale(1) brightness(.4) contrast(.8)'; ph.style.opacity = .75; }
        if (S.f.accused && id === CULPRIT) ph.style.boxShadow = '0 0 0 calc(5px * var(--vs,1)) #c22a22, 0 8px 18px rgba(0,0,0,.6)';
        spot(p[0] - 58, p[1] - 8, p[0] + 58, p[1] + 138, function () { accuseCard(id); });
      });
      if (S.f.accused && !S.f.gotHkey) {
        var hk = img('img/it_hkey.png', 600, 580, 90, 70); hk.style.transform = 'rotate(18deg)';
        spot(590, 570, 700, 660, function () { S.f.gotHkey = 1; hk.remove(); give('hkey'); save(); });
      }
    }
  };
  V['5e'] = {
    img: function () { return 'img/r5_e.webp'; }, left: '5n', right: '5s',
    build: function () {
      spot(R5.desk[0], R5.desk[1], R5.desk[2], R5.desk[3], function () { SND.play('paper'); showLook('img/it_page.png', '「밀실」 마지막 장', '범인은 끝까지 자기 손을 숨긴다. 그러나 비는 모든 것을 적신다.'); });
      // 앞 방들에서 놓친 단서는 작가가 이 책상 위에 모아 두었다 — 지나간 방으로 돌아갈 수 없으니 여기서 줍는다(사장님 9/27 NOTE 11/12)
      var miss = CLUES.filter(function (c) { return S.clues.indexOf(c.id) < 0; });
      miss.forEach(function (c, i) {
        var x = 540 + i * 30, y = 448 + (i % 2) * 8;
        var e = img(c.img, x, y, 54, 54); e.style.transform = 'rotate(' + ((i * 23) % 30 - 15) + 'deg)';
        e.style.filter = 'drop-shadow(0 3px 3px rgba(0,0,0,.7)) brightness(.9)';
        spot(x - 4, y - 4, x + 58, y + 58, function () { e.remove(); getClue(c.id); });
      });
    }
  };
  V['5s'] = {
    img: function () { return 'img/r5_s.webp'; }, left: '5e', right: '5w',
    build: function () { spot(R5.door[0], R5.door[1], R5.door[2], R5.door[3], function () { SND.play('rattle'); shakeView(); }); }
  };
  V['5w'] = {
    img: function () { return 'img/r5_w.webp'; }, left: '5s', right: '5n',
    build: function () {
      var sh = piece('img/r5_w.webp', R5.shelf[0], R5.shelf[1], R5.shelf[2] - R5.shelf[0], R5.shelf[3] - R5.shelf[1]);
      sh.style.transformOrigin = '100% 50%'; sh.style.transition = 'transform 1.4s cubic-bezier(.4,0,.2,1)';
      spot(R5.crack[0], R5.crack[1], R5.crack[2], R5.crack[3], function () {
        if (!hasSel('hkey')) { SND.play('rattle'); wobble(sh, .6); return; }
        takeAway('hkey'); SND.play('unlock'); SND.play('creak', .3);
        var glow = div('spr', R5.shelf[0], R5.shelf[1], R5.shelf[2] - R5.shelf[0], R5.shelf[3] - R5.shelf[1]);
        glow.style.background = 'radial-gradient(ellipse at 40% 50%, rgba(255,210,140,.9), rgba(120,70,20,.6) 60%, rgba(0,0,0,.9))';
        glow.style.zIndex = -1; layer.insertBefore(glow, layer.firstChild);
        sh.style.transform = 'perspective(1200px) rotateY(80deg)';
        S.done = STAGES; save();
        setTimeout(startEnding, 1700);
      });
    }
  };
  // 지목 카드: 초상 크게 + 이름 + 지목 단추
  function accuseCard(id) {
    SND.play('paper');
    var btn = S.f.accused ? '' : '<div class="btn main accuse">지목</div>';
    showLook('img/sus_' + id + '.png', SEAT_NAME[id], '', '');
    var card = $('lookCard'), p = $('lookP');
    p.innerHTML = btn;
    var b = p.querySelector('.accuse');
    if (!b) return;
    b.onclick = function () {
      if (S.clues.length < TOTAL_CLUES) {
        SND.play('wrong'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        var n = $('stNote'); n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake');
        return;
      }
      if (id !== CULPRIT) {
        SND.play('wrong'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        S.f['no_' + id] = 1; save(); setTimeout(function () { $('look').classList.remove('on'); render(); }, 500);
        return;
      }
      S.f.accused = 1; save(); SND.play('clue'); SND.play('bigthud', .5); var pp = R5.pins[SUS.indexOf(id)]; FX.glow(pp[0], pp[1] + 70, 420, 'rgba(255,120,90,.55)'); FX.star(pp[0], pp[1] + 60, 160);
      $('look').classList.remove('on');
      shakeView(); render();
    };
  }
  // 엔딩: 찾아낸 작가 → 새벽 → THE END
  var END_LINES = [
    ['img/e_found.webp', '책장 뒤 좁은 방에 작가가 있었다.'],
    ['img/e_found.webp', '범인은 작가의 동생, 한도현.'],
    ['img/e_found.webp', '형의 마지막 원고를 제 이름으로 내려고 형을 가뒀다.'],
    ['img/e_found.webp', '왼손잡이. 젖은 우산. 형보다 나은 글씨.'],
    ['img/e_dawn.webp', '비가 그쳤다.']
  ];
  function startEnding() {
    if (window.OG) OG.over({ result: 'END' });
    var m = Math.floor(S.t / 60), s = S.t % 60;
    var box = $('ending'); box.classList.add('on');
    var im = $('endImg'), tx = $('endTxt'), i = 0;
    function show() {
      var L = END_LINES[i];
      if (im.getAttribute('src') !== L[0]) { im.style.opacity = 0; setTimeout(function () { im.src = L[0]; im.style.opacity = 1; }, 400); }
      tx.style.opacity = 0; setTimeout(function () { tx.textContent = L[1]; tx.style.opacity = 1; }, 300);
    }
    show(); SND.play('clear');
    box.onclick = function () {
      SND.play('tick'); i++;
      if (i < END_LINES.length) { show(); return; }
      box.onclick = null;
      tx.style.opacity = 0;
      setTimeout(function () {
        $('endFin').classList.add('on');
        $('endTime').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '  ·  NOTE ' + S.clues.length + '/' + TOTAL_CLUES;
        SND.play('clear');
      }, 500);
    };
  }
  $('endTitle').addEventListener('click', function (e) {
    e.stopPropagation(); SND.play('click');
    $('ending').classList.remove('on'); $('endFin').classList.remove('on');
    showTitle();
  });

  // =====================================================================
  // 새 스테이지 15개 — 같은 방 그림, 다른 퍼즐(사장님 9/25 "각 방 4스테이지, 총 20")
  //   방 1~4: 첫 스테이지가 원래 퍼즐, 둘째~넷째가 새 퍼즐 / 방 5: 17~19 새 퍼즐, 20 이 원래(범인 지목·엔딩)
  // =====================================================================
  function vw(id, build, imgFn) {
    var b = V[id];
    return { img: imgFn || b.img, left: b.left, right: b.right, back: b.back, build: build };
  }
  // 떨어지는 소지품: 바로 다음 그리기에서 위에서 떨어져 통 튄다
  var dropping = null;
  function dropNow(flag, dy) { dropping = { flag: flag, dy: dy }; render(); }
  // 놓인 소지품: 누르면 줍는다
  function loot(flag, item, x, y, w, h, rot, onPick) {
    if (S.f[flag]) return null;
    var e = img(ITEMS[item].img, x, y, w, h);
    var base = rot ? 'rotate(' + rot + 'deg)' : '';
    e.style.transform = base; e.style.filter = 'drop-shadow(0 4px 4px rgba(0,0,0,.65))';
    spot(x - 10, y - 10, x + w + 10, y + h + 10, function () {
      S.f[flag] = 1; e.remove(); give(item); save();
      if (onPick) setTimeout(onPick, 350);
    });
    if (dropping && dropping.flag === flag) {
      var px = viewEl.clientHeight * dropping.dy / H; dropping = null;
      e.animate([{ transform: 'translateY(' + -px + 'px) ' + base, easing: 'cubic-bezier(.5,0,.9,.5)' },
        { transform: 'translateY(0) ' + base, offset: .72, easing: 'ease-out' },
        { transform: 'translateY(' + -px * .1 + 'px) ' + base, offset: .86, easing: 'ease-in' },
        { transform: 'translateY(0) ' + base }], { duration: 620 });
      setTimeout(function () { SND.play('thud', 0); }, 440);
    }
    return e;
  }
  // 서랍(방마다 같은 모양): opt.lock(front, pull) 이 true 면 열린다, opt.content(x, cy, w) 안에 든 것
  function drawer2(id, x, y, w, h, src, opt) {
    var open = S.f['dr' + id];
    var D = drawerShell(id, x, y, w, h, src, open, opt.content ? function () { opt.content(x, y - 18, w); } : null);
    var cav = D.cav, front = D.front;
    if (opt.plate) plateOn(front, [x, y, w, h], opt.plate);
    if (opt.deco) opt.deco(front);
    var oy = D.oy;
    var ds = spot(x, y + oy, x + w, y + h + oy, function () {
      if (S.f['dr' + id]) { SND.play('drawer'); S.f['dr' + id] = 0; save(); front.style.transform = ''; setTimeout(render, 450); return; }
      if (opt.lock && !opt.lock(front, pull)) return;
      pull();
    });
    layer.insertBefore(ds, cav.nextSibling);          // 서랍 속 물건 누르는 자리가 서랍 닫는 자리보다 위에 오게
    function pull() { S.f['dr' + id] = 1; save(); SND.play('drawer'); cav.style.opacity = 1; front.style.transform = D.pullT; setTimeout(render, 430); }
  }
  function keyLock(item, flag) {
    return function (front, pull) {
      if (S.f[flag]) return true;
      if (hasSel(item)) { takeAway(item); S.f[flag] = 1; SND.play('unlock'); save(); setTimeout(pull, 350); return false; }
      SND.play('rattle'); wobble(front, 1.2); return false;
    };
  }
  function dialLock(key, code, flag) {
    return function (front, pull) {
      if (S.f[flag]) return true;
      openDial({ key: key, code: code, ok: function () { S.f[flag] = 1; save(); pull(); } });
      return false;
    };
  }
  function stuck(front) { SND.play('rattle'); wobble(front, 1.2); return false; }
  function exitWith(item) {
    return function () {
      if (hasSel(item)) { takeAway(item); SND.play('unlock'); setTimeout(function () { SND.play('door'); }, 450); escapeRoom(); return; }
      SND.play('rattle'); shakeView();
    };
  }
  function dialExit(key, code) {
    return function () {
      openDial({ key: key, code: code, ok: function () { SND.play('door'); escapeRoom(); } });
    };
  }
  // 그림 위에 얹는 글씨(비밀 잉크·현상 사진·눌린 자국)
  // 번호판(책상 서랍과 같은 것)을 움직이는 조각 위에 붙인다: box 는 조각의 [x,y,w,h], r 은 번호판 [x,y,w,h,돌림]
  function plateOn(el, box, r, src) {
    var d = document.createElement('div');
    d.style.cssText = 'position:absolute;background:url(' + (src || 'img/sp_dialplate.png') + ') 0 0/100% 100% no-repeat;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))';
    d.style.left = ((r[0] - box[0]) / box[2] * 100) + '%'; d.style.top = ((r[1] - box[1]) / box[3] * 100) + '%';
    d.style.width = (r[2] / box[2] * 100) + '%'; d.style.height = (r[3] / box[3] * 100) + '%';
    if (r[4]) d.style.transform = 'rotate(' + r[4] + 'deg)';
    el.appendChild(d); return d;
  }
  // 못에 걸린 열쇠: (nx,ny) 못 자리, ox·oy 는 그림 속 고리 구멍 윗쪽(비율), rot 는 세로로 늘어지게 돌리는 각
  // 가만히 둔다 — 흔들리거나 반짝이며 "이거 써라" 알려 주지 않는다(사장님 9/26)
  function hangKey(src, nx, ny, w, h, ox, oy, rot) {
    var k = img(src, nx - w * ox, ny - h * oy, w, h);
    k.style.transformOrigin = (ox * 100) + '% ' + (oy * 100) + '%';
    k.style.setProperty('--r', rot + 'deg'); k.style.transform = 'rotate(' + rot + 'deg)';
    k.style.filter = 'drop-shadow(2px 4px 3px rgba(0,0,0,.6))';
    var n = div('spr nail', nx - 5, ny - 5, 10, 10);
    k._nail = n; var rm = k.remove.bind(k); k.remove = function () { n.remove(); rm(); };
    return k;
  }
  // 괘종시계 추 상자 속: 문을 열면 유리문 테두리가 비치지 않게, 유리 너머 안쪽 뒷판(태엽추 포함)을 문 크기만큼 늘려 불투명하게 깐다
  function caseInside() {
    var d = div('spr', 598, 330, 180, 388);
    var sx = 618, sy = 372, sw = 140, sh = 320;
    d.style.backgroundImage = 'radial-gradient(ellipse at 50% 40%,rgba(20,12,6,.1),rgba(8,4,2,.6)),url(img/c1_clock_np.webp)';
    d.style.backgroundSize = '100% 100%,' + (W / sw * 100) + '% ' + (H / sh * 100) + '%';
    d.style.backgroundPosition = '0 0,' + (sx / (W - sw) * 100) + '% ' + (sy / (H - sh) * 100) + '%';
    d.style.boxShadow = 'inset 8px 0 12px rgba(0,0,0,.7),inset -8px 0 12px rgba(0,0,0,.7),inset 0 10px 14px rgba(0,0,0,.8)';
    return d;
  }
  function onPic(cls, txt, fs) { return '<div class="onpic ' + cls + '" data-fs="' + fs + '">' + txt + '</div>'; }

  // ---------- 방 1 서재: 손맛만 있는 것들 ----------
  function FL1(id, no) {
    no = no || {};
    if (id === '1n') { spot(345, 380, 940, 700, function () { go('1desk'); }); spot(455, 255, 565, 395, lampToggle); }
    if (id === '1e') {
      spot(575, 295, 1095, 425, function () { go('1shelf'); });
      var gl = piece('img/r1_e.webp', 818, 428, 66, 84);
      spot(818, 428, 884, 512, function () { spin(gl); });
      spot(1115, 370, 1265, 650, function () { say('초가 다 녹아 있다.'); });
      spot(90, 360, 290, 520, lampToggle);
    }
    if (id === '1s') {
      spot(270, 150, 418, 628, function () { go('1clock'); });
      spot(893, 425, 962, 628, function () { say('우산 하나가 아직 젖어 있다.'); });
      if (!no.coat) spot(1025, 290, 1100, 565, function () { SND.play('paper'); say('코트 주머니는 비어 있다.'); });
      if (!no.hat) { var hat = piece('img/r1_s.webp', 955, 226, 80, 84); spot(955, 226, 1035, 310, function () { wobble(hat); SND.play('swing'); }); }
      if (!no.door) spot(555, 180, 835, 605, function () { SND.play('rattle'); shakeView(); });
    }
    if (id === '1w') {
      spot(950, 395, 1015, 525, function () { say('파이프가 아직 따뜻하다.'); });
      spot(1225, 330, 1376, 470, lampToggle);
    }
  }
  function deskFlavor(o) {
    o = o || {};
    spot(590, 160, 790, 250, o.paper || function () { SND.play('paper'); });
    spot(240, 70, 455, 345, lampToggle);
    spot(860, 305, 1105, 415, function () { SND.play('paper'); say('빈 원고지뿐이다.'); });
    if (!o.noTea) spot(1190, 300, 1325, 390, function () { say('식은 홍차.'); });
  }
  function shelfFlavor() {
    BOOKS.forEach(function (c) {
      var b = BX[c], el = bookPiece(c);
      el.style.transition = 'transform .18s, filter .18s'; el.style.transformOrigin = '50% 100%';
      spot(b[0], 262, b[1], 560, function () {
        SND.play('book'); pushIn(el);
        setTimeout(function () { popOut(el); }, 320);
      });
    });
  }
  // 괘종시계 확대: 추 상자 안 content(열렸을 때), 바늘 min(분)
  function clockParts(min, content) {
    var inside = caseInside();
    inside.style.opacity = S.f.caseOpen ? 1 : 0;
    if (S.f.caseOpen && content) content();
    var doorEl = piece('img/c1_clock_np.webp', 598, 330, 180, 388);
    doorEl.style.transformOrigin = '98% 50%'; doorEl.style.transition = 'transform .9s cubic-bezier(.3,.7,.3,1)';
    if (S.f.caseOpen) doorEl.style.transform = 'perspective(900px) rotateY(-105deg)';
    var pend = img('img/sp_pendulum.png', 640, 345, 100, 320); pend.style.transformOrigin = '49% 2.2%';
    if (S.f.wound) pend.style.animation = 'pend 1.6s ease-in-out infinite alternate';
    var hands = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    hands.setAttribute('viewBox', '0 0 1376 768'); hands.setAttribute('preserveAspectRatio', 'none');
    hands.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    hands.innerHTML = '<g id="hh"><path d="M688 214 L686 196 L682 190 L688 180 L694 190 L690 196 Z" fill="#1c140e"/><rect x="686.3" y="187" width="3.4" height="29" fill="#1c140e"/></g>' +
      '<g id="mh"><rect x="686.9" y="168" width="2.4" height="48" fill="#1c140e"/><path d="M688 165 L685 173 L691 173 Z" fill="#1c140e"/></g>' +
      '<circle cx="688" cy="214" r="4.2" fill="#2a1c10"/><circle cx="688" cy="214" r="1.6" fill="#b89048"/>';
    layer.appendChild(hands);
    setHands(hands, min);
    if (!S.f.caseOpen) spot(600, 332, 776, 716, function () { SND.play('rattle'); wobble(doorEl, 2); });
    return { inside: inside, door: doorEl, pend: pend, hands: hands };
  }
  function swingHands(P, from, to, done) {
    var t0 = Date.now() + 300, dur = 2400;
    var iv = setInterval(function () {
      var k = Math.min(1, Math.max(0, (Date.now() - t0) / dur)); k = 1 - Math.pow(1 - k, 3);
      setHands(P.hands, from + (to - from) * k);
      if (k >= 1) { clearInterval(iv); done(); }
    }, 16);
  }
  // n 번 울린 뒤 추 상자 문이 열린다
  function chimeOpen(P, n) {
    P.pend.style.animation = 'pend 1.6s ease-in-out infinite alternate';
    for (var i = 0; i < n; i++) SND.play('chime', .3 + i * 1.25);
    setTimeout(function () {
      SND.play('unlock'); S.f.caseOpen = 1; save();
      if (S.view !== '1clock') return;
      FX.dust(690, 520, 220); FX.star(690, 480, 100);
      P.inside.style.transition = 'opacity .5s'; P.inside.style.opacity = 1;
      P.door.style.transform = 'perspective(900px) rotateY(-105deg)'; SND.play('creak', .1);
      setTimeout(render, 950);
    }, (n * 1.25 + .6) * 1000);
  }
  var HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  var MINS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // ===== 스테이지 2 (서재 둘째): 모자 → 태엽 열쇠, 타자기 원고 → 시계 6:30 → 작은 열쇠 → 서랍 → 문 열쇠
  VAR[2] = { views: {
    '1n': vw('1n', function () { FL1('1n'); }),
    '1e': vw('1e', function () { FL1('1e'); }),
    '1w': vw('1w', function () { buildPortrait({ noFall: 1 }); FL1('1w'); spot(575, 455, 810, 648, function () { SND.play('thud'); }); }),
    '1s': vw('1s', function () {
      FL1('1s', { hat: 1, door: 1 });
      var hat = piece('img/r1_s.webp', 955, 226, 80, 84);
      if (S.f.hatDrop) loot('gotWind', 'wind', 972, 604, 46, 52, -64);
      spot(955, 226, 1035, 310, function () {
        wobble(hat); SND.play('swing');
        if (!S.f.hatDrop) { S.f.hatDrop = 1; save(); setTimeout(function () { dropNow('gotWind', 330); }, 200); }
      });
      spot(555, 180, 835, 605, exitWith('doorkey'));
    }),
    '1desk': vw('1desk', function () {
      drawer2('L', 18, 460, 388, 100, 'img/c1_desk.webp', { lock: stuck });
      drawer2('M', 428, 460, 522, 100, 'img/c1_desk.webp', { lock: stuck });
      drawer2('R', 970, 460, 390, 100, 'img/c1_desk.webp', { lock: keyLock('key', 'rOpen'), content: function (x, cy) { loot('gotDoorkey', 'doorkey', x + 150, cy - 30, 48, 120, -72); } });
      deskFlavor({ paper: function () { SND.play('paper'); showLook('img/it_paperw.png', '원고', '괘종이 여섯 번 울리고, 긴 바늘이 바닥을 가리킬 때 그는 서재를 나섰다.'); } });
    }),
    '1shelf': vw('1shelf', shelfFlavor),
    '1clock': vw('1clock', function () {
      var P = clockParts(S.f.timeSet ? 6 * 60 + 30 : 10 * 60 + 8, function () { loot('gotKey', 'key', 700, 664, 50, 50, 70); });
      if (!S.f.wound) spot(KEYHOLE[0], KEYHOLE[1], KEYHOLE[2], KEYHOLE[3], function () {
        if (!hasSel('wind')) { SND.play('rattle'); wobble(P.door, 2); return; }
        takeAway('wind'); S.f.wound = 1; save(); SND.play('wind'); SND.play('wind', .9);
        P.pend.style.animation = 'pend 1.6s ease-in-out infinite alternate'; render();
      });
      spot(612, 138, 766, 292, function () {
        if (!S.f.wound) { SND.play('tick'); return; }
        if (S.f.timeSet) { SND.play('chime'); return; }
        openDial({ key: 'tm', code: [6, 6], syms: [HOURS, MINS], ok: function () {
          S.f.timeSet = 1; save(); SND.play('wind');
          swingHands(P, 10 * 60 + 8, 12 * 60 + 6 * 60 + 30, function () { chimeOpen(P, 6); });
        } });
      });
    })
  } };

  // ===== 스테이지 3 (서재 셋째): 코트 → 성냥, 초상화 뒤 색 표시 → 책 → 흰 종이, 불 + 종이 → 391 → 문 열쇠
  var C3_BOOKS = ['G', 'K', 'R', 'Y', 'B'];
  VAR[3] = {
    views: {
      '1n': vw('1n', function () { FL1('1n'); }),
      '1e': vw('1e', function () { FL1('1e'); }),
      '1s': vw('1s', function () {
        FL1('1s', { coat: 1, door: 1 });
        spot(1025, 290, 1100, 565, function () {
          SND.play('paper');
          if (!S.f.coatMatch) { S.f.coatMatch = 1; save(); give('match'); } else say('코트 주머니는 비어 있다.');
        });
        spot(555, 180, 835, 605, exitWith('doorkey'));
      }),
      '1w': vw('1w', function () {
        buildPortrait({ behind: function () {
          // 액자 자리 벽에 분필로 칠한 색 다섯
          C3_BOOKS.forEach(function (c, i) {
            var d = div('spr chalk', 572 + i * 50, 150 + (i % 2 ? 8 : -4), 40, 32);
            d.style.background = INK[c]; d.style.transform = 'rotate(' + (i * 37 % 50 - 20) + 'deg)';
          });
        } });
        FL1('1w');
        spot(575, 455, 810, 648, function () {
          if (!S.f.fire) {
            if (!hasSel('match')) { SND.play('thud'); return; }
            takeAway('match'); SND.play('match'); setTimeout(function () { SND.play('fire'); }, 250);
            S.f.fire = 1; save();
            bg2.src = view('1w').img(); bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1;
            setTimeout(render, 950); return;
          }
          if (hasSel('paper')) {
            if (!S.f.ink) { S.f.ink = 1; save(); SND.play('paper'); SND.play('clue', .3); S.sel = null; renderInv(); FX.place('img/it_paper.png', LAST.x, LAST.y - 60, 90, 86); FX.glow(LAST.x, LAST.y - 60, 280, 'rgba(255,150,60,.6)'); FX.smoke(LAST.x, LAST.y - 120); }
            setTimeout(function () { lookItem('paper'); }, 350); return;
          }
          SND.play('fire');
        });
      }),
      '1shelf': vw('1shelf', function () {
        var els = {};
        BOOKS.forEach(function (c) {
          var b = BX[c], el = bookPiece(c);
          el.style.transition = 'transform .18s, filter .18s'; el.style.transformOrigin = '50% 100%';
          els[c] = el;
          if (S.f.books || S.books.indexOf(c) >= 0) pushIn(el, true);
          spot(b[0], 262, b[1], 560, function () { bookClick(c, els, C3_BOOKS, nicheLoot3); });
        });
        if (S.f.books) openNiche(true, nicheLoot3);
      }),
      '1desk': vw('1desk', function () {
        drawer2('L', 18, 460, 388, 100, 'img/c1_desk.webp', { lock: stuck });
        drawer2('M', 428, 460, 522, 100, 'img/c1_desk.webp', { lock: dialLock('d1c', [3, 9, 1], 'mOpen'), content: function (x, cy, w) { loot('gotDoorkey', 'doorkey', x + w / 2 - 34, cy - 30, 48, 120, -72); } });
        drawer2('R', 970, 460, 390, 100, 'img/c1_desk.webp', { lock: stuck });
        deskFlavor();
      }),
      '1clock': vw('1clock', function () { clockParts(10 * 60 + 8); spot(612, 138, 766, 292, function () { SND.play('tick'); }); })
    },
    look: function (id) {
      if (id !== 'paper' || !S.f.ink) return false;
      showLook(ITEMS.paper.img, ITEMS.paper.name, '', onPic('ink', '3&nbsp;9&nbsp;1', .17)); return true;
    }
  };
  // 홍차 붓기: 잔이 기울고 찻물이 불 위로 떨어진 뒤 치익 하고 김이 오른다(사장님 9/26)
  function pourTea() {
    // 제미나이로 그린 효과 조각: 기울어진 찻잔+물줄기, 김 둘, 튀는 물, 물방울
    var cup = img('img/fx_cup.png', 563, 300, 155, 300);
    cup.style.transformOrigin = '30% 15%'; cup.style.opacity = 0;
    cup.style.clipPath = 'inset(0 0 67% 0)';
    cup.style.transform = 'rotate(24deg)';
    cup.style.transition = 'transform .5s cubic-bezier(.3,.7,.3,1), opacity .3s, clip-path .35s ease-in';
    setTimeout(function () { cup.style.opacity = 1; cup.style.transform = 'rotate(0)'; }, 30);
    // 물줄기가 흘러내린다
    setTimeout(function () { SND.play('pour'); cup.style.clipPath = 'inset(0 0 0 0)'; cup.classList.add('pouring'); }, 480);
    // 장작에 닿아 튀는 물 + 옆으로 떨어지는 방울
    setTimeout(function () {
      var sp = img('img/fx_splash.png', 648, 548, 84, 84); sp.classList.add('fxsplash');
      for (var i = 0; i < 6; i++) (function (i) {
        setTimeout(function () {
          var d = img('img/fx_drop.png', 676 + (i % 3 - 1) * 12, 470 + (i % 2) * 20, 14, 15); d.classList.add('fxdrop');
          SND.play('drip');
        }, i * 140);
      })(i);
    }, 820);
    // 치익: 불이 꺼지고 김이 오른다
    setTimeout(function () {
      SND.play('sizzle');
      bg2.src = 'img/r1_w_np.webp'; bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1;
      [['img/fx_steam1.png', 590, 330, 170, 283, 0], ['img/fx_steam2.png', 690, 390, 118, 194, .35], ['img/fx_steam2.png', 610, 420, 100, 164, .7], ['img/fx_steam1.png', 660, 350, 150, 250, 1.0]].forEach(function (q) {
        var e = img(q[0], q[1], q[2], q[3], q[4]); e.classList.add('fxsteam'); e.style.animationDelay = q[5] + 's';
      });
    }, 950);
    // 다 부으면 잔을 바로 세우고 치운다
    setTimeout(function () { cup.classList.remove('pouring'); cup.style.clipPath = 'inset(0 0 67% 0)'; cup.style.transform = 'rotate(24deg)'; }, 1900);
    setTimeout(function () { cup.style.opacity = 0; }, 2300);
    setTimeout(render, 3400);
  }
  function nicheLoot3(nx, ny, now) {
    var e = loot('gotPaper', 'paper', nx + 24, ny + 110, 100, 96, -8);
    if (e && !now) { e.style.opacity = 0; e.style.transition = 'opacity .6s .5s'; requestAnimationFrame(function () { e.style.opacity = 1; }); }
  }

  // ===== 스테이지 4 (서재 넷째): 불이 타는 벽난로 속 열쇠 → 홍차로 끄기 → 서랍 → 태엽 → 시계 3시 → 문 열쇠
  VAR[4] = {
    init: function () { S.f.fire = 1; },
    views: {
      '1n': vw('1n', function () { FL1('1n'); }),
      '1e': vw('1e', function () { FL1('1e'); }),
      '1s': vw('1s', function () { FL1('1s', { door: 1 }); spot(555, 180, 835, 605, exitWith('doorkey')); }),
      '1w': vw('1w', function () {
        buildPortrait({ noFall: 1 }); FL1('1w');
        spot(575, 455, 810, 648, function () {
          if (!S.f.fire) { SND.play('thud'); return; }
          if (!hasSel('tea')) { SND.play('fire'); shakeView(); return; }
          takeAway('tea'); S.f.fire = 0; save();
          pourTea();
        });
        // 불 속에서 반짝이는 열쇠: 불을 끄면 집을 수 있다
        if (S.f.fire) {
          var k = img('img/it_key.png', 668, 574, 40, 40); k.style.transform = 'rotate(24deg)';
          k.style.filter = 'sepia(.6) brightness(.8) contrast(1.1)';          // 불빛에 그을린 채 가만히
        } else loot('gotKey', 'key', 668, 580, 42, 42, 24);
      }),
      '1desk': vw('1desk', function () {
        if (!S.f.gotTea) spot(1190, 300, 1325, 390, function () { S.f.gotTea = 1; save(); give('tea'); render(); });
        drawer2('L', 18, 460, 388, 100, 'img/c1_desk.webp', { lock: stuck });
        drawer2('M', 428, 460, 522, 100, 'img/c1_desk.webp', { lock: stuck });
        drawer2('R', 970, 460, 390, 100, 'img/c1_desk.webp', { lock: keyLock('key', 'rOpen'), content: function (x, cy) { loot('gotWind', 'wind', x + 90, cy - 10, 52, 60, -70); } });
        deskFlavor({ noTea: 1 });
      }, function () { return S.f.gotTea ? 'img/c1_desk_nocup.webp' : 'img/c1_desk.webp'; }),
      '1shelf': vw('1shelf', shelfFlavor),
      '1clock': vw('1clock', function () {
        var P = clockParts(S.f.wound ? 15 * 60 : 10 * 60 + 8, function () { loot('gotDoorkey', 'doorkey', 666, 632, 48, 120, -86); });
        spot(612, 138, 766, 292, function () { SND.play(S.f.wound ? 'chime' : 'tick'); });
        if (!S.f.wound) spot(KEYHOLE[0], KEYHOLE[1], KEYHOLE[2], KEYHOLE[3], function () {
          if (!hasSel('wind')) { SND.play('rattle'); wobble(P.door, 2); return; }
          takeAway('wind'); S.f.wound = 1; save(); SND.play('wind'); SND.play('wind', .9);
          swingHands(P, 10 * 60 + 8, 15 * 60, function () { chimeOpen(P, 3); });
        });
      })
    }
  };

  // ---------- 방 2 침실: 손맛 ----------
  function FL2(id, no) {
    no = no || {};
    if (id === '2n') {
      var pl = piece('img/r2_n.webp', 498, 372, 190, 58); spot(498, 372, 688, 430, function () { SND.play('swing'); wobble(pl, 3); });
      var pr = piece('img/r2_n.webp', 694, 372, 190, 58); spot(694, 372, 884, 430, function () { SND.play('swing'); wobble(pr, 3); });
      spot(380, 628, 1000, 720, function () { go('2under'); });
      spot(292, 440, 424, 490, function () { SND.play('drawer'); say('안경집뿐이다.'); });
      spot(316, 308, 394, 430, lampToggle);
      spot(962, 326, 1094, 436, function () { go('2music'); });
      if (!no.painting) { var pt = piece('img/r2_n.webp', 548, 46, 282, 206); pt.style.transformOrigin = '50% 4%'; spot(548, 46, 830, 252, function () { SND.play('swing'); wobble(pt, 3); }); }
    }
    if (id === '2e') {
      var ct = piece('img/r2_e.webp', 930, 0, 170, 610); ct.style.transformOrigin = '50% 0';
      spot(930, 0, 1100, 610, function () { SND.play('swing'); wobble(ct, 1.5); });
      spot(405, 430, 955, 700, function () { go('2vanity'); });
      spot(480, 356, 594, 428, function () { SND.play('spray'); });
      spot(782, 372, 884, 428, function () { SND.play('click'); say('보석함은 비어 있다.'); });
      spot(0, 340, 128, 470, function () { go('2music'); });
    }
    if (id === '2s') {
      spot(255, 110, 525, 615, function () { SND.play('rattle'); shakeView(); });
      if (!no.robe) { var rb = piece('img/r2_s.webp', 612, 232, 142, 336); rb.style.transformOrigin = '50% 3%'; spot(612, 232, 754, 568, function () { SND.play('swing'); wobble(rb, 3); say('가운 주머니는 비어 있다.'); }); }
      spot(850, 110, 1100, 615, function () { go('2bath'); });
    }
    if (id === '2w') {
      if (!no.ward) spot(235, 105, 620, 640, function () { SND.play('rattle'); shakeView(); });
      if (!no.keypad) spot(770, 300, 840, 360, function () { SND.play('click'); });
      if (!no.exit) spot(850, 110, 1112, 615, function () { SND.play('rattle'); shakeView(); });
    }
  }
  function vanityFlavor(no) {
    no = no || {};
    if (!no.drawer) drawer2('V', VAN[0], VAN[1], VAN[2], VAN[3], 'img/c2_vanity.webp', { lock: stuck });
    if (!no.perfume) spot(VANPF[0], VANPF[1], VANPF[2], VANPF[3], function () { SND.play('spray'); });
    spot(942, 306, 1172, 430, function () { SND.play('click'); say('보석함은 비어 있다.'); });
  }
  function musicFlavor() {
    spot(250, 120, 1170, 430, function () { SND.play('tick'); });
    drawer2('MB', 262, 432, 622, 212, 'img/c2_music.webp', { lock: function (front) { SND.play('rattle'); wobble(front, 1); return false; } });
    spot(1000, 336, 1070, 420, function () { SND.play('tick'); });
  }
  // 거울 김에 손가락으로 쓴 숫자
  function digitsSvg(txt) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 500 200'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = 'position:absolute;left:6%;top:14%;width:88%;height:72%;overflow:visible';
    svg.innerHTML = '<defs><filter id="fb2"><feGaussianBlur stdDeviation="1.4"/></filter></defs>' +
      txt.split('').map(function (c, i) {
        return '<text x="' + (70 + i * 120) + '" y="150" text-anchor="middle" transform="rotate(' + (i % 2 ? 4 : -5) + ' ' + (70 + i * 120) + ' 110)" font-family="Dokdo,sans-serif" font-size="165" fill="rgba(52,70,88,.66)" filter="url(#fb2)">' + c + '</text>';
      }).join('');
    return svg;
  }
  var R2VIEWS = function (over) {
    var base = {
      '2n': vw('2n', function () { FL2('2n'); }),
      '2e': vw('2e', function () { FL2('2e'); }),
      '2s': vw('2s', function () { FL2('2s'); }),
      '2w': vw('2w', function () { FL2('2w'); }),
      '2under': vw('2under', function () { underBed(null); }),
      '2music': vw('2music', musicFlavor),
      '2vanity': vw('2vanity', function () { vanityFlavor(); }),
      '2bath': vw('2bath', function () { buildBath(null); })
    };
    for (var k in over) base[k] = over[k];
    return base;
  };

  // ===== 스테이지 6 (침실 둘째): 가운 → 은열쇠 → 화장대 → 수도 손잡이 → 김 서린 거울 숫자 → 번호 자물쇠
  VAR[6] = { views: R2VIEWS({
    '2s': vw('2s', function () {
      FL2('2s', { robe: 1 });
      var rb = piece('img/r2_s.webp', 612, 232, 142, 336); rb.style.transformOrigin = '50% 3%';
      if (S.f.robeDrop) loot('gotSilver', 'silver', 650, 596, 40, 48, 70);
      spot(612, 232, 754, 568, function () {
        SND.play('swing'); wobble(rb, 3);
        if (!S.f.robeDrop) { S.f.robeDrop = 1; save(); setTimeout(function () { dropNow('gotSilver', 170); }, 250); }
      });
    }),
    '2vanity': vw('2vanity', function () {
      vanityFlavor({ drawer: 1 });
      drawer2('V', VAN[0], VAN[1], VAN[2], VAN[3], 'img/c2_vanity.webp', { lock: keyLock('silver', 'vOpen'), content: function (x, cy, w) { loot('gotTap', 'tap', x + w / 2 - 50, cy - 10, 100, 80); } });
    }),
    '2bath': vw('2bath', function () { buildBath(function () { return digitsSvg('2857'); }); }),
    '2w': vw('2w', function () {
      FL2('2w', { keypad: 1 });
      spot(770, 300, 840, 360, function () { lockKeys('2857', function () { setTimeout(function () { $('dialM').classList.remove('on'); SND.play('door'); escapeRoom(); }, 600); }); });
    })
  }) };

  // ===== 스테이지 7 (침실 셋째): 향수 → 거울에 화살표 → 옷장 → 태엽 손잡이 → 오르골 → 문 열쇠
  var C7_DIRS = ['d', 'd', 'l', 'u', 'r'];
  VAR[7] = { views: R2VIEWS({
    '2vanity': vw('2vanity', function () {
      vanityFlavor({ perfume: 1 });
      // 향수를 뿌리면 거울 아래쪽이 뿌옇게 흐려지고 그어 둔 화살표가 드러난다
      var mist = div('spr fog mist', 452, 0, 468, 316);
      mist.style.opacity = S.f.mist ? 1 : 0;
      if (S.f.mist) mist.appendChild(arrowsSvg(C7_DIRS));
      spot(VANPF[0], VANPF[1], VANPF[2], VANPF[3], function () {
        SND.play('spray');
        if (S.f.mist) return;
        S.f.mist = 1; save();
        setTimeout(function () { if (S.view === '2vanity') { mist.appendChild(arrowsSvg(C7_DIRS)); mist.style.opacity = 1; } }, 300);
      });
    }),
    '2w': vw('2w', function () {
      FL2('2w', { ward: 1, exit: 1 });
      if (!S.f.wardOpen) spot(235, 105, 620, 640, function () {
        lockDirs(C7_DIRS, function () {
          S.f.wardOpen = 1; save();
          setTimeout(function () {
            $('dialM').classList.remove('on'); SND.play('creak');
            bg2.src = 'img/r2_w_open.webp'; bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1;
            setTimeout(render, 950);
          }, 500);
        });
      });
      else {
        spot(270, 200, 590, 600, function () { SND.play('swing'); });
        spot(372, 360, 540, 470, function () {
          SND.play('paper');
          if (!S.f.coatCrank) { S.f.coatCrank = 1; save(); give('crank'); } else say('코트 주머니는 비어 있다.');
        });
      }
      spot(850, 110, 1112, 615, exitWith('doorkey'));
    }, function () { return S.f.wardOpen ? 'img/r2_w_open.webp' : 'img/r2_w.webp'; }),
    '2music': vw('2music', function () {
      if (S.f.mbOpen) {
        var bl = img('img/sp_ballerina.png', 610, 200, 150, 204); bl.id = 'ballerina';
        bl.style.transformOrigin = '53% 100%';
        if (boxBusy) bl.style.animation = 'pirou 1.1s linear infinite';
      }
      spot(250, 120, 1170, 430, function () { if (S.f.mbOpen) playBox(); else SND.play('tick'); });
      drawer2('MB', 262, 432, 622, 212, S.f.mbOpen ? 'img/c2_music_open.webp' : 'img/c2_music.webp', {
        lock: function (front) { if (S.f.mbFree) return true; SND.play('rattle'); wobble(front, 1); return false; },
        content: function (x, cy, w) { loot('gotDoorkey', 'doorkey', x + w / 2 - 34, cy + 24, 48, 120, -80); }
      });
      spot(1000, 336, 1070, 420, function () {
        if (S.f.mbOpen) { playBox(); return; }
        if (!hasSel('crank')) { SND.play('tick'); return; }
        takeAway('crank'); S.f.mbOpen = 1; save(); SND.play('wind');
        setTimeout(function () {
          bg2.src = 'img/c2_music_open.webp'; bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1; SND.play('creak');
          setTimeout(function () { render(); playBox(true); }, 950);
        }, 900);
      });
    }, function () { return S.f.mbOpen ? 'img/c2_music_open_nb.webp' : 'img/c2_music.webp'; })
  }) };

  // ===== 스테이지 8 (침실 넷째): 바다 그림이 떨어짐 → 은열쇠 → 화장대 → 손전등 → 침대 밑 긁힌 숫자 → 번호 자물쇠
  VAR[8] = { views: R2VIEWS({
    '2n': vw('2n', function () {
      FL2('2n', { painting: 1 });
      var st = S.f.painting || 0;
      if (st >= 2) {
        if (!S.f.gotSilver) {
          // 그림 뒤 못에 걸린 은열쇠
          var sk = hangKey('img/it_silver.png', 690, 118, 40, 48, .7, .12, -39);
          spot(660, 105, 725, 185, function () { S.f.gotSilver = 1; sk.remove(); give('silver'); save(); });
        }
        var fl = img('img/sp_seascape.png', 560, 400, 260, 198);
        fl.style.transform = 'perspective(700px) rotateX(52deg) rotate(-7deg)'; fl.style.filter = 'brightness(.8) drop-shadow(0 6px 6px rgba(0,0,0,.6))';
        spot(560, 420, 820, 560, function () { SND.play('thud'); wobble(fl, 2); });
        return;
      }
      bg.src = 'img/r2_n_np.webp';
      var p = img('img/sp_seascape.png', 536, 36, 310, 236);
      p.style.transformOrigin = '50% 6%'; p.style.transition = 'transform .5s cubic-bezier(.3,1.6,.5,1)';
      if (st === 1) p.style.transform = 'rotate(8deg)';
      spot(548, 46, 830, 252, function () {
        if (!S.f.painting) { S.f.painting = 1; save(); SND.play('swing'); p.style.transform = 'rotate(8deg)'; return; }
        S.f.painting = 2; save(); SND.play('swing');
        p.style.transition = 'transform .7s cubic-bezier(.55,0,.9,.45)';
        p.style.transform = 'translate(4%, 150%) rotate(-10deg) scale(.85)';
        setTimeout(function () { SND.play('bigthud'); shakeView(); render(); }, 680);
      });
    }, function () { return (S.f.painting || 0) >= 2 ? 'img/r2_n_np.webp' : 'img/r2_n.webp'; }),
    '2vanity': vw('2vanity', function () {
      vanityFlavor({ drawer: 1 });
      drawer2('V', VAN[0], VAN[1], VAN[2], VAN[3], 'img/c2_vanity.webp', { lock: keyLock('silver', 'vOpen'), content: function (x, cy, w) { loot('gotFlash', 'flash', x + w / 2 - 60, cy - 6, 120, 44, -4); } });
    }),
    '2under': vw('2under', function () {
      underBed(function () {
        // 침대 밑판에 긁어 새긴 숫자: 손전등 빛에만 보인다
        var sc = div('spr scratch', 520, 110, 340, 96); sc.textContent = '0413';
        spot(632, 376, 888, 480, function () { if (S.f.lit) SND.play('paper'); });
      });
    }),
    '2w': vw('2w', function () {
      FL2('2w', { keypad: 1 });
      spot(770, 300, 840, 360, function () { lockKeys('0413', function () { setTimeout(function () { $('dialM').classList.remove('on'); SND.play('door'); escapeRoom(); }, 600); }); });
    })
  }) };

  // ---------- 방 3 부엌·식당: 손맛 ----------
  function FL3(id, no) {
    no = no || {};
    if (id === '3n') {
      spot(150, 400, 1210, 470, function () { go('3table'); });
      spot(566, 520, 810, 566, function () { go('3table'); });
      spot(200, 160, 370, 600, function () { go('3e'); });
      var ct = piece('img/r3_n.webp', 1180, 20, 196, 480); ct.style.transformOrigin = '50% 0';
      spot(1180, 20, 1376, 500, function () { SND.play('swing'); wobble(ct, 1.5); });
      var ch = piece('img/r3_n.webp', 560, 0, 260, 120); ch.style.transformOrigin = '50% 0';
      spot(560, 0, 820, 120, function () { SND.play('rattle'); wobble(ch, 4); });
    }
    if (id === '3e') {
      spot(110, 380, 400, 680, function () { go('3oven'); });
      if (!no.pans) { var pn = piece('img/r3_e.webp', 550, 250, 262, 136); pn.style.transformOrigin = '50% 0'; spot(550, 250, 812, 386, function () { SND.play('rattle'); wobble(pn, 5); }); }
      spot(580, 425, 800, 458, function () { SND.play('water'); });
      if (!no.fridge) spot(990, 240, 1270, 700, function () { SND.play('rattle'); shakeView(); });
    }
    if (id === '3s') {
      spot(200, 160, 370, 594, function () { SND.play('rattle'); shakeView(); });
      spot(980, 110, 1284, 610, function () { go('3cab'); });
      var pt = piece('img/r3_s.webp', 786, 206, 132, 96); pt.style.transformOrigin = '50% 0';
      spot(786, 206, 918, 302, function () { SND.play('swing'); wobble(pt, 4); });
    }
    if (id === '3w') {
      spot(R3W.wine[0], R3W.wine[1], R3W.wine[2], R3W.wine[3], function () { SND.play('book'); say('빈 병뿐이다.'); });
      if (!no.vase) { var vs = piece('img/r3_w.webp', R3W.vase[0], R3W.vase[1], R3W.vase[2] - R3W.vase[0], R3W.vase[3] - R3W.vase[1]); vs.style.transformOrigin = '50% 100%'; spot(R3W.vase[0], R3W.vase[1], R3W.vase[2], R3W.vase[3], function () { SND.play('book'); wobble(vs, 4); }); }
      spot(R3W.door[0], R3W.door[1], R3W.door[2], R3W.door[3], exitWith('ekey3'));
    }
  }
  function fridgeView(content, o) {
    o = o || {};
    return vw('3e', function () {
      FL3('3e', { fridge: 1, pans: o.pans });
      if (o.extra) o.extra();
      if (!S.f.fridge) spot(990, 240, 1270, 700, function () {
        if (hasSel('fkey')) { takeAway('fkey'); S.f.fridge = 1; save(); SND.play('unlock'); SND.play('creak', .3); setTimeout(function () { FX.glow(1130, 420, 520, 'rgba(210,235,255,.7)'); }, 350); fadeSwap(); return; }
        SND.play('rattle'); shakeView();
      });
      else if (content) content();
    }, function () { return S.f.fridge ? 'img/r3_e_open.webp' : 'img/r3_e.webp'; });
  }
  function ovenView(content) {
    return vw('3oven', function () {
      var K = OVEN.stem;
      if (!S.f.oven) {
        var kn; if (S.f.knobIn) { kn = img('img/it_knob.png', K[0] - 40, K[1] - 34, 80, 64); kn.style.transition = 'transform .8s'; }
        spot(K[0] - 55, K[1] - 50, K[0] + 55, K[1] + 50, function () {
          if (!S.f.knobIn) {
            if (!hasSel('knob')) { SND.play('tick'); return; }
            takeAway('knob'); S.f.knobIn = 1; save(); SND.play('click'); render(); return;
          }
          kn.style.transform = 'rotate(270deg)'; SND.play('wind');
          setTimeout(function () { S.f.oven = 1; save(); SND.play('unlock'); SND.play('creak', .2); fadeSwap(); }, 900);
        });
        spot(OVEN.door[0], OVEN.door[1], OVEN.door[2], OVEN.door[3], function () { SND.play('rattle'); shakeView(); });
      } else if (content) content(OVEN.inside);
    }, function () { return S.f.oven ? 'img/c3_oven_open.webp' : 'img/c3_oven.webp'; });
  }
  function cabView(content) {
    return vw('3cab', function () {
      var P = CAB.stack;
      if (S.f.plates && content) content(P);
      // 접시만 모양대로 오린 조각(tools/plates.py). 배경은 접시를 치운 찬장이라 들어도 접시가 둘로 보이지 않는다
      var pl = img('img/sp_plates.png', 582, 284, 218, 252);
      pl.style.transition = 'transform .5s cubic-bezier(.3,1.3,.5,1)';
      if (S.f.plates) pl.style.transform = 'translate(38%,-18%) rotate(3deg)';
      spot(P[0], P[1], P[2], P[3] - 80, function () {
        if (!S.f.plates) { S.f.plates = 1; save(); SND.play('rattle'); pl.style.transform = 'translate(38%,-18%) rotate(3deg)'; setTimeout(render, 520); }
        else { SND.play('rattle'); wobble(pl, 1.5); }
      });
    }, function () { return 'img/c3_cab_np.webp'; });
  }
  function tableFlavor(lock, content) {
    return vw('3table', function () {
      var D = TABLE.drawer;
      drawer2('T', D[0], D[1], D[2], D[3], 'img/c3_table.webp', { lock: lock || stuck, content: content });
    });
  }
  var R3VIEWS = function (over) {
    var base = {
      '3n': vw('3n', function () { FL3('3n'); }),
      '3e': vw('3e', function () { FL3('3e'); }),
      '3s': vw('3s', function () { FL3('3s'); }),
      '3w': vw('3w', function () { FL3('3w'); }),
      '3cab': cabView(null),
      '3oven': ovenView(null),
      '3table': tableFlavor(null, null)
    };
    for (var k in over) base[k] = over[k];
    return base;
  };

  // ===== 스테이지 10 (부엌 둘째): 냄비 → 냉장고 열쇠 → 냉장고 → 오븐 손잡이 → 오븐 → 쇠 열쇠
  VAR[10] = { views: R3VIEWS({
    // 냄비 걸이: 흔들면 큰 프라이팬에서 냉장고 열쇠가 떨어진다
    '3e': fridgeView(function () { loot('gotKnob', 'knob', 1086, 530, 78, 62); }, { pans: 1, extra: function () {
      if (S.f.panDrop) loot('gotFkey', 'fkey', 636, 398, 50, 50, 30);
      var pn = piece('img/r3_e.webp', 550, 250, 262, 136); pn.style.transformOrigin = '50% 0';
      spot(550, 250, 812, 386, function () {
        SND.play('rattle'); wobble(pn, 5);
        if (!S.f.panDrop) { S.f.panDrop = 1; save(); setTimeout(function () { dropNow('gotFkey', 90); }, 250); }
      });
    } }),
    '3oven': ovenView(function (I) { loot('gotEkey3', 'ekey3', I[0] + 80, I[1] + 10, 70, 76, -60); })
  }) };

  // ===== 스테이지 11 (부엌 셋째): 접시 밑 초대장 → 이름표 자리(새 규칙) → 서랍 → 냉장고 열쇠 → 냉장고 → 쇠 열쇠
  var C11_SEATS = ['oh', 'min', 'jung', 'dohyun'];
  VAR[11] = { views: R3VIEWS({
    '3cab': cabView(function (P) { loot('gotInvite', 'invite2', P[0] + (P[2] - P[0]) / 2 - 48, P[3] - 70, 96, 74, 5, function () { lookItem('invite2'); }); }),
    '3table': vw('3table', function () {
      if (!S.cards) S.cards = ['dohyun', 'jung', 'oh', 'min'];
      TABLE.cards.forEach(function (p, i) {
        var nw = window.MS_EN ? 230 : 140, c = div('spr namecard', p[0] - nw / 2, p[1] - 30, nw, 60);   // 영문판은 직함까지 한 줄로
        c.textContent = SEAT_NAME[S.cards[i]];
        if (tableSel === i) c.classList.add('pick');
        if (!S.f.seated) spot(p[0] - 74, p[1] - 34, p[0] + 74, p[1] + 34, function () { cardClick(i, C11_SEATS); });
      });
      var D = TABLE.drawer;
      drawer2('T', D[0], D[1], D[2], D[3], 'img/c3_table.webp', {
        lock: function (front) { if (S.f.tFree) return true; SND.play('rattle'); wobble(front, 1); return false; },
        content: function (x, cy, w) { loot('gotFkey', 'fkey', x + w / 2 - 30, cy - 20, 60, 60, 20); }
      });
    }),
    '3e': fridgeView(function () { loot('gotEkey3', 'ekey3', 1080, 520, 70, 76, -50); })
  }) };

  // ===== 스테이지 12 (부엌 넷째): 꽃병 밑 쪽지 → 세어 보기(촛불·의자·접시 = 344) → 식탁 서랍 → 오븐 손잡이 → 쇠 열쇠
  VAR[12] = { views: R3VIEWS({
    '3w': vw('3w', function () {
      FL3('3w', { vase: 1 });
      var V3 = R3W.vase;
      if (S.f.vaseNote) loot('gotNote', 'note3', 1010, 598, 66, 58, 10, function () { lookItem('note3'); });
      var vs = piece('img/r3_w.webp', V3[0], V3[1], V3[2] - V3[0], V3[3] - V3[1]); vs.style.transformOrigin = '50% 100%';
      spot(V3[0], V3[1], V3[2], V3[3], function () {
        SND.play('book'); wobble(vs, 7);
        if (!S.f.vaseNote) { S.f.vaseNote = 1; save(); setTimeout(function () { SND.play('paper'); dropNow('gotNote', 120); }, 300); }
      });
    }),
    '3table': vw('3table', function () {
      var D = TABLE.drawer;
      drawer2('T', D[0], D[1], D[2], D[3], 'img/c3_table.webp', { lock: dialLock('t3', [3, 4, 4], 'tOpen'), plate: [628, 635, 110, 44],
        content: function (x, cy, w) { loot('gotKnob', 'knob', x + w / 2 - 40, cy - 16, 80, 64); } });
    }),
    '3n': vw('3n', function () {
      FL3('3n');
      var pd = piece('img/r3_n.webp', 566, 520, 244, 46); plateOn(pd, [566, 520, 244, 46], [664, 533, 44, 18]);
    }),
    '3oven': ovenView(function (I) { loot('gotEkey3', 'ekey3', I[0] + 80, I[1] + 10, 70, 76, -60); })
  }) };

  // ---------- 방 4 지하 암실: 손맛 ----------
  function FL4(id, no) {
    no = no || {};
    bg.style.filter = uvTint();
    if (id === '4n') {
      if (!no.drawer) drawer2('F', R4.drawer[0], R4.drawer[1], R4.drawer[2] - R4.drawer[0], R4.drawer[3] - R4.drawer[1], 'img/r4_n.webp', { lock: stuck });
      spot(R4.trays[0], R4.trays[1], R4.trays[2], R4.trays[3], function () { go('4tray'); });
      var lp = piece('img/r4_n.webp', R4.lamp[0], R4.lamp[1], R4.lamp[2] - R4.lamp[0], R4.lamp[3] - R4.lamp[1]); lp.style.transformOrigin = '50% 0';
      spot(R4.lamp[0], R4.lamp[1], R4.lamp[2], R4.lamp[3], function () { SND.play('lamp'); wobble(lp, 5); });
      if (!no.bottles) BOTTLES.forEach(function (b) { var e = piece('img/r4_n.webp', b[0], b[1], b[2] - b[0], b[3] - b[1]); e.style.transformOrigin = '50% 100%'; spot(b[0], b[1], b[2], b[3], function () { SND.play('click'); wobble(e, 5); }); });
    }
    if (id === '4e') {
      if (!no.enl) spot(R4.enl[0], R4.enl[1], R4.enl[2], R4.enl[3], function () { SND.play('click'); });
      if (!no.memo) spot(R4.memo[0], R4.memo[1], R4.memo[2], R4.memo[3], function () { SND.play('paper'); showLook('img/it_paperw.png', '메모', '현상 → 정지 → 정착'); });
      var ln = piece('img/r4_e.webp', R4.line[0], R4.line[1], R4.line[2] - R4.line[0], R4.line[3] - R4.line[1]); ln.style.transformOrigin = '50% 0';
      spot(R4.line[0], R4.line[1], R4.line[2], R4.line[3], function () { SND.play('paper'); wobble(ln, 1.2); });
    }
    if (id === '4s') {
      spot(R4.stairs[0], R4.stairs[1], R4.stairs[2], R4.stairs[3], function () { SND.play('rattle'); shakeView(); });
      if (!no.apron) { var ap = piece('img/r4_s.webp', APRON[0], APRON[1], APRON[2] - APRON[0], APRON[3] - APRON[1]); ap.style.transformOrigin = '50% 0'; spot(APRON[0], APRON[1], APRON[2], APRON[3], function () { SND.play('swing'); wobble(ap, 3); }); }
      if (!no.papers) spot(NEWS[0], NEWS[1], NEWS[2], NEWS[3], function () { SND.play('paper'); });
      if (!no.crates) spot(R4.crates[0], NEWS[3], R4.crates[2], R4.crates[3], function () { SND.play('book'); });
      if (!no.curtain) { var cu = piece('img/r4_s.webp', CURT[0], CURT[1], CURT[2] - CURT[0], CURT[3] - CURT[1]); cu.style.transformOrigin = '50% 0'; spot(CURT[0], CURT[1], CURT[2], CURT[3], function () { SND.play('swing'); wobble(cu, 1); }); }
    }
    if (id === '4w') {
      spot(R4.panel[0], R4.panel[1], R4.panel[2], R4.panel[3], function () { go('4panel'); });
    }
  }
  var BOTTLES = [[420, 276, 466, 362], [466, 270, 512, 362], [512, 276, 558, 362]];
  var APRON = [1170, 180, 1270, 480], NEWS = [1040, 450, 1200, 520], CURT = [600, 205, 780, 615], CRATE = [1045, 505, 1225, 600];
  function panelFlavor() {
    return vw('4panel', function () {
      bg.style.filter = uvTint();
      PANEL.l.concat(PANEL.r).forEach(function (p) { spot(p[0] - 13, p[1] - 30, p[0] + 13, p[1] + 150, function () { SND.play('tick'); }); });
      spot(PANEL.lever[0], PANEL.lever[1], PANEL.lever[2], PANEL.lever[3], function () { SND.play('rattle'); });
    });
  }
  function trayFlavor() {
    return vw('4tray', function () { bg.style.filter = uvTint(); TRAYS.forEach(function (t) { spot(t[0], t[1], t[2], t[3], function () { SND.play('water'); }); }); });
  }
  var R4VIEWS = function (over) {
    var base = {
      '4n': vw('4n', function () { FL4('4n'); }),
      '4e': vw('4e', function () { FL4('4e'); }),
      '4s': vw('4s', function () { FL4('4s'); }, function () { return 'img/r4_s.webp'; }),
      '4w': vw('4w', function () { FL4('4w'); }, function () { return 'img/r4_w.webp'; }),
      '4tray': trayFlavor(),
      '4panel': panelFlavor()
    };
    for (var k in over) base[k] = over[k];
    return base;
  };

  // ===== 스테이지 14 (암실 둘째): 앞치마 → 드라이버 → 배전반 나사 → 전선 → 자외선 → 벽의 형광 숫자 3175
  VAR[14] = { views: R4VIEWS({
    '4s': vw('4s', function () {
      FL4('4s', { apron: 1 });
      var ap = piece('img/r4_s.webp', APRON[0], APRON[1], APRON[2] - APRON[0], APRON[3] - APRON[1]); ap.style.transformOrigin = '50% 0';
      if (S.f.apronDrop) loot('gotDriver', 'driver', 1150, 648, 90, 82, -18);
      spot(APRON[0], APRON[1], APRON[2], APRON[3], function () {
        SND.play('swing'); wobble(ap, 3);
        if (!S.f.apronDrop) { S.f.apronDrop = 1; save(); setTimeout(function () { dropNow('gotDriver', 260); }, 250); }
      });
    }, function () { return S.f.uv ? 'img/r4_s_uv.webp' : 'img/r4_s.webp'; }),
    '4e': vw('4e', function () {
      FL4('4e');
      if (S.f.uv) { var n = div('spr uvnum', 1040 - 190, 560 - 70, 380, 140); n.textContent = '3175'; }
    }),
    '4w': vw('4w', function () {
      bg.style.filter = '';
      spot(R4.panel[0], R4.panel[1], R4.panel[2], R4.panel[3], function () {
        if (S.f.panelOpen) { go('4panel'); return; }
        if (!hasSel('driver')) { SND.play('rattle'); shakeView(); return; }
        takeAway('driver'); S.f.panelOpen = 1; save(); SND.play('click'); SND.play('click', .35); SND.play('unlock', .7);
        setTimeout(function () { go('4panel'); }, 900);
      });
      spot(R4.door[0], R4.door[1], R4.door[2], R4.door[3], dialExit('d4b', [3, 1, 7, 5]));
    }, function () { return S.f.uv ? 'img/r4_w_uv.webp' : 'img/r4_w.webp'; }),
    '4panel': V['4panel']
  }) };

  // ===== 스테이지 15 (암실 셋째): 신문 → 필름 → 확대기 → 트레이(메모 순서) → 사진 속 숫자 6028
  var C15_ORDER = [1, 0, 2];                                  // 가운데 현상 → 왼쪽 정지 → 오른쪽 정착
  VAR[15] = {
    views: R4VIEWS({
      '4s': vw('4s', function () {
        FL4('4s', { papers: 1 });
        if (S.f.newsDrop) loot('gotFilm', 'film', 1110, 660, 70, 78, -14);
        var nw = piece('img/r4_s.webp', NEWS[0], NEWS[1], NEWS[2] - NEWS[0], NEWS[3] - NEWS[1]); nw.style.transformOrigin = '30% 100%';
        spot(NEWS[0], NEWS[1], NEWS[2], NEWS[3], function () {
          SND.play('paper'); wobble(nw, 3);
          if (!S.f.newsDrop) { S.f.newsDrop = 1; save(); setTimeout(function () { dropNow('gotFilm', 200); }, 250); }
        });
      }),
      '4e': vw('4e', function () {
        FL4('4e', { enl: 1, memo: 1 });
        spot(R4.memo[0], R4.memo[1], R4.memo[2], R4.memo[3], function () { SND.play('paper'); showLook('img/it_paperw.png', '메모', '가운데 현상 · 왼쪽 정지 · 오른쪽 정착'); });
        spot(R4.enl[0], R4.enl[1], R4.enl[2], R4.enl[3], function () {
          if (!S.f.filmIn) { if (!hasSel('film')) { SND.play('click'); return; } takeAway('film'); S.f.filmIn = 1; save(); SND.play('click'); return; }
          if (S.inv.indexOf('paperw') >= 0 || S.f.developed) { SND.play('click'); return; }
          enlargerFlash(function () { S.f.trayStep = 0; give('paperw'); save(); render(); });
        });
      }),
      '4tray': vw('4tray', function () {
        bg.style.filter = uvTint();
        var step = S.f.trayStep || 0;
        if (step > 0 && !S.f.gotPrint) {
          var t = TRAYS[C15_ORDER[Math.min(step, 3) - 1]];
          var pp = img('img/it_paperw.png', (t[0] + t[2]) / 2 - 80, (t[1] + t[3]) / 2 - 55, 160, 110);
          pp.style.transform = 'perspective(600px) rotateX(38deg)'; pp.style.opacity = .92;
          if (step >= 3) { pp.innerHTML = onPic('photo', '6028', .3); pp.firstChild.style.cssText += ';width:100%;height:100%;font-size:calc(40px * var(--vs,1))'; }
          else pp.style.filter = 'brightness(.85) contrast(.8) sepia(.3)';
        }
        function takePrint() { S.f.gotPrint = 1; S.f.developed = 1; give('print'); save(); render(); setTimeout(function () { lookItem('print'); }, 350); }
        TRAYS.forEach(function (t, i) {
          spot(t[0], t[1], t[2], t[3], function () {
            if (step >= 3 && !S.f.gotPrint) { takePrint(); return; }
            if (step >= 3 || S.f.gotPrint) { SND.play('water'); return; }
            if (!hasSel('paperw') && !(step > 0 && step < 3)) { SND.play('water'); return; }
            if (i !== C15_ORDER[step]) {
              SND.play('wrong'); takeAway('paperw', true); S.f.trayStep = 0; save();
              var bk = img('img/it_paperw.png', (t[0] + t[2]) / 2 - 80, (t[1] + t[3]) / 2 - 55, 160, 110);
              bk.style.transform = 'perspective(600px) rotateX(38deg)'; bk.style.filter = 'brightness(.05)';
              bk.style.transition = 'opacity 1.4s'; setTimeout(function () { bk.style.opacity = 0; }, 900);
              return;
            }
            if (step === 0) takeAway('paperw');
            S.f.trayStep = step + 1; save(); SND.play('water'); render();
          });
        });
      }),
      '4w': vw('4w', function () { FL4('4w'); spot(R4.door[0], R4.door[1], R4.door[2], R4.door[3], dialExit('d4c', [6, 0, 2, 8])); }, function () { return 'img/r4_w.webp'; })
    }),
    look: function (id) {
      if (id !== 'print') return false;
      showLook(ITEMS.print.img, ITEMS.print.name, '', onPic('photo', '6028', .24)); return true;
    }
  };
  function enlargerFlash(then) {
    SND.play('lamp');
    var fl = div('spr', 0, 0, W, H); fl.style.background = 'radial-gradient(circle at ' + ((R4.enl[0] + R4.enl[2]) / 2 / W * 100) + '% ' + (R4.enl[3] / H * 100) + '%, rgba(255,250,235,.95), rgba(255,240,210,.35) 30%, rgba(0,0,0,0) 60%)';
    fl.style.transition = 'opacity .9s'; setTimeout(function () { fl.style.opacity = 0; }, 180);
    setTimeout(then, 1000);
  }

  // ===== 스테이지 16 (암실 넷째): 약병 → 황동 열쇠 → 상자 → 손전등 → 커튼 뒤 분필 숫자 8531
  VAR[16] = { views: R4VIEWS({
    '4n': vw('4n', function () {
      FL4('4n', { bottles: 1 });
      if (S.f.bottleDrop) loot('gotHkey', 'hkey', 522, 448, 40, 40, 30);
      BOTTLES.forEach(function (b, i) {
        var e = piece('img/r4_n.webp', b[0], b[1], b[2] - b[0], b[3] - b[1]); e.style.transformOrigin = '50% 100%';
        spot(b[0], b[1], b[2], b[3], function () {
          SND.play('click'); wobble(e, i === 2 ? 9 : 5);
          if (i === 2 && !S.f.bottleDrop) { S.f.bottleDrop = 1; save(); setTimeout(function () { dropNow('gotHkey', 110); }, 300); }
        });
      });
    }),
    '4s': vw('4s', function () {
      FL4('4s', { curtain: 1, crates: 1 });
      // 나무 상자: 황동 열쇠로 앞판을 열면 안에 손전등
      var C = CRATE;
      var cav = div('spr', C[0] + 10, C[1] + 8, C[2] - C[0] - 20, C[3] - C[1] - 16);
      // 상자 속: 안쪽 판자 테두리와 깊은 그림자(평평한 검은 네모로 보이지 않게)
      cav.style.background = 'repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 22px,rgba(0,0,0,.25) 22px 24px),linear-gradient(180deg,#070403 0%,#1e130c 55%,#3a2518 100%)';
      cav.style.boxShadow = 'inset 0 14px 16px rgba(0,0,0,.92),inset 0 0 0 5px rgba(72,44,26,.95),inset 0 0 0 7px rgba(20,12,8,.9)'; cav.style.opacity = S.f.crate ? 1 : 0;
      if (S.f.crate) loot('gotFlash', 'flash', C[0] + 40, C[1] + 34, 110, 40, -6);
      var fr = piece('img/r4_s.webp', C[0], C[1], C[2] - C[0], C[3] - C[1]);
      fr.style.transformOrigin = '50% 100%'; fr.style.transition = 'transform .6s cubic-bezier(.3,1.3,.5,1)';
      plateOn(fr, [C[0], C[1], C[2] - C[0], C[3] - C[1]], [(C[0] + C[2]) / 2 - 9, C[1] + 30, 18, 20], 'img/sp_keyhole.png');   // 황동 열쇠를 꽂는 구멍
      if (S.f.crate) fr.style.transform = 'perspective(600px) rotateX(-68deg)';
      if (!S.f.crate) spot(C[0], C[1], C[2], C[3], function () {
        if (!hasSel('hkey')) { SND.play('book'); wobble(fr, 1); return; }
        takeAway('hkey'); S.f.crate = 1; save(); SND.play('unlock'); SND.play('creak', .2); setTimeout(function () { FX.dust((C[0] + C[2]) / 2, C[1] + 20, 240); }, 400);
        fr.style.transform = 'perspective(600px) rotateX(-68deg)'; cav.style.opacity = 1; setTimeout(render, 650);
      });
      // 커튼: 걷으면 캄캄한 벽감, 손전등을 비추면 분필 숫자
      var K = CURT;
      var voidEl = div('spr', K[0] + 12, K[1] + 10, K[2] - K[0] - 24, K[3] - K[1] - 14);
      voidEl.style.background = '#030202'; voidEl.style.opacity = S.f.curtain ? 1 : 0; voidEl.style.transition = 'opacity .4s';
      if (S.f.lit4) {
        voidEl.style.background = 'radial-gradient(ellipse at 58% 46%, rgba(255,236,190,.34), rgba(40,30,24,.5) 38%, #030202 70%)';
        var ch = div('spr chalknum', K[0] + 50, 330, K[2] - K[0] - 60, 140); ch.textContent = '8531';
      }
      var cu = piece('img/r4_s.webp', K[0], K[1], K[2] - K[0], K[3] - K[1]);
      cu.style.transformOrigin = '0 50%'; cu.style.transition = 'transform .7s cubic-bezier(.3,1,.4,1)';
      if (S.f.curtain) cu.style.transform = 'scaleX(.2)';
      spot(S.f.curtain ? K[0] + 40 : K[0], K[1], K[2], K[3], function () {
        if (!S.f.curtain) { S.f.curtain = 1; save(); SND.play('swing'); SND.play('paper', .1); cu.style.transform = 'scaleX(.2)'; voidEl.style.opacity = 1; return; }
        if (S.f.lit4) return;
        if (!hasSel('flash')) { SND.play('tick'); return; }
        takeAway('flash'); S.f.lit4 = 1; save(); SND.play('lamp'); render();
      });
    }),
    '4w': vw('4w', function () { FL4('4w'); spot(R4.door[0], R4.door[1], R4.door[2], R4.door[3], dialExit('d4d', [8, 5, 3, 1])); }, function () { return 'img/r4_w.webp'; })
  }) };

  // ---------- 방 5 비밀 서재: 손맛 ----------
  function FL5(id, no) {
    no = no || {};
    if (id === '5n') {
      SUS.forEach(function (sid, i) {
        var p = R5.pins[i];
        var ph = img('img/sus_' + sid + '.png', p[0] - 52, p[1] - 6, 104, 142);
        ph.className = 'spr susp'; ph.style.transform = 'rotate(' + [-4, 3, -2, 5][i] + 'deg)';
        spot(p[0] - 58, p[1] - 8, p[0] + 58, p[1] + 138, function () { SND.play('paper'); wobble(ph, 3); });
      });
      if (!no.lamp) spot(575, 450, 680, 590, lampToggle);
      spot(570, 580, 845, 665, function () { SND.play('paper'); });
    }
    if (id === '5e') {
      if (!no.papers) spot(520, 360, 650, 480, function () { SND.play('paper'); });
      spot(680, 395, 790, 475, function () { SND.play('click'); });
      if (!no.brief) spot(735, 610, 875, 745, function () { SND.play('rattle'); });
      if (!no.frame) { var fr = piece('img/r5_e.webp', 650, 195, 85, 105); fr.style.transformOrigin = '50% 0'; spot(650, 195, 735, 300, function () { SND.play('swing'); wobble(fr, 4); }); }
    }
    if (id === '5s') {
      if (!no.door) spot(R5.door[0], R5.door[1], R5.door[2], R5.door[3], function () { SND.play('rattle'); shakeView(); });
      if (!no.coat) { var ct = piece('img/r5_s.webp', 900, 270, 120, 330); ct.style.transformOrigin = '50% 0'; spot(900, 270, 1020, 600, function () { SND.play('swing'); wobble(ct, 2); }); }
      spot(395, 220, 475, 325, function () { SND.play('swing'); });
      if (!no.table) spot(360, 495, 515, 560, function () { SND.play('book'); });
    }
    if (id === '5w') {
      spot(R5.crack[0], R5.crack[1], R5.crack[2], R5.crack[3], function () { SND.play('rattle'); });
      if (!no.table) spot(880, 540, 1045, 690, function () { SND.play('book'); });
    }
  }
  var R5VIEWS = function (over) {
    var base = {
      '5n': vw('5n', function () { FL5('5n'); }),
      '5e': vw('5e', function () { FL5('5e'); }),
      '5s': vw('5s', function () { FL5('5s'); }),
      '5w': vw('5w', function () { FL5('5w'); })
    };
    for (var k in over) base[k] = over[k];
    return base;
  };
  function briefcase(key, code, content) {
    var bc = piece('img/r5_e.webp', 735, 610, 140, 135); bc.style.transformOrigin = '50% 100%';
        // 잠금장치는 덮개 아래 가장자리 선(752,681)→(805,698)에 걸쳐 그 선과 나란히(사장님 9/27 "덮개랑 일자로")
    var bp = plateOn(bc, [735, 610, 140, 135], [757, 682, 42, 16]);
    bp.style.transform = 'rotate(18deg)'; bp.style.filter = 'brightness(.9) drop-shadow(0 2px 2px rgba(0,0,0,.7))';
    if (S.f.brief) { if (content) content(); return; }
    spot(735, 610, 875, 745, function () {
      openDial({ key: key, code: code, ok: function () { S.f.brief = 1; save(); SND.play('creak', .1); wobble(bc, 3); setTimeout(render, 500); } });
    });
  }

  // ===== 스테이지 17 (비밀 서재 첫째): 액자 뒤집기 → 날짜 5·17 → 가방 → 쇠 열쇠 → 철문
  VAR[17] = { views: R5VIEWS({
    '5e': vw('5e', function () {
      FL5('5e', { brief: 1, frame: 1 });
      if (S.f.flip) {
        var bk = div('spr photoback', 652, 197, 81, 101); bk.textContent = '57.5.17';
        spot(650, 195, 735, 300, function () { SND.play('paper'); showLook('img/it_brothers.png', '사진 뒷면', '1957. 5. 17. 도윤과 도현, 처음으로 원고를 끝낸 날.'); });
      } else {
        var fr = piece('img/r5_e.webp', 650, 195, 85, 105); fr.style.transition = 'transform .45s ease-in';
        spot(650, 195, 735, 300, function () { S.f.flip = 1; save(); SND.play('swing'); fr.style.transform = 'perspective(500px) rotateY(90deg)'; setTimeout(render, 450); });
      }
      briefcase('b17', [5, 1, 7], function () { loot('gotEkey3', 'ekey3', 872, 668, 60, 64, -30); });
    }),
    '5s': vw('5s', function () { FL5('5s', { door: 1 }); spot(R5.door[0], R5.door[1], R5.door[2], R5.door[3], exitWith('ekey3')); })
  }) };

  // ===== 스테이지 18 (비밀 서재 둘째): 작은 탁자 → 드라이버 → 철문 덮개 → 머리글자 자물쇠(ㅎㄷㅎ — 우산에 새긴 것)
  var CONS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  if (window.MS_EN) CONS = ['B', 'C', 'D', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'S', 'T', 'Y'];   // 영문판: 한도현 = H·D·H
  var C18 = window.MS_EN ? [4, 2, 4] : [13, 2, 13];
  var LOCK5 = [566, 362, 648, 436];
  VAR[18] = {
    look: function (id) {
      if (id !== 'umb18' || !S.f.umbLit) return false;
      showLook('img/it_umbrella.png', '검은 장우산', '등불에 비추자 손잡이 안쪽에 새긴 머리글자가 드러났다. ㅎ·ㄷ·ㅎ'); return true;
    },
    views: R5VIEWS({
    '5w': vw('5w', function () {
      FL5('5w', { table: 1 });
      if (S.f.tableDrop) loot('gotDriver', 'driver', 930, 686, 76, 68, -14);
      spot(880, 540, 1045, 690, function () {
        SND.play('drawer');
        if (!S.f.tableDrop) { S.f.tableDrop = 1; save(); setTimeout(function () { dropNow('gotDriver', 90); }, 250); }
      });
    }),
    '5s': vw('5s', function () {
      FL5('5s', { door: 1, coat: 1 });
      // 코트 곁에 세워 둔 검은 장우산: 주워서 등불에 비춰야 손잡이 안쪽 머리글자가 보인다(사장님 9/27 "터치만 하면 나오면 풀 필요가 없다")
      if (!S.f.gotUmb) {
        var um = img('img/it_umbrella.png', 1016, 468, 150, 142); um.style.transform = 'rotate(-58deg)';
        um.style.filter = 'drop-shadow(3px 5px 4px rgba(0,0,0,.7)) brightness(.85)';
        spot(1030, 460, 1150, 640, function () { S.f.gotUmb = 1; um.remove(); give('umb18'); save(); });
      }
      // 곁탁자의 초록 등불
      spot(405, 415, 480, 500, function () {
        if (!hasSel('umb18')) { SND.play('lamp'); return; }
        if (!S.f.umbLit) { S.f.umbLit = 1; save(); SND.play('lamp'); FX.place('img/it_umbrella.png', 442, 440, 90, 84); FX.glow(442, 450, 300, 'rgba(210,255,190,.55)'); }
        S.sel = null; renderInv(); setTimeout(function () { lookItem('umb18'); }, 600);
      });
      var ct = piece('img/r5_s.webp', 900, 270, 120, 330); ct.style.transformOrigin = '50% 0';
      spot(900, 270, 1020, 600, function () {
        SND.play('swing'); wobble(ct, 2);
        if (!S.f.coatNote) { S.f.coatNote = 1; save(); SND.play('paper'); give('note5'); setTimeout(function () { lookItem('note5'); }, 350); }
      });
      var L = LOCK5;
      if (S.f.plate) {
        // 덮개를 떼어 낸 자리: 글자 바퀴 셋
        var pl = div('spr lock5', L[0], L[1], L[2] - L[0], L[3] - L[1]);
        pl.innerHTML = '<i></i><i></i><i></i>';
      }
      spot(R5.door[0], R5.door[1], R5.door[2], R5.door[3], function () { SND.play('rattle'); shakeView(); });
      spot(L[0] - 10, L[1] - 10, L[2] + 10, L[3] + 10, function () {
        if (!S.f.plate) {
          if (!hasSel('driver')) { SND.play('rattle'); shakeView(); return; }
          takeAway('driver'); S.f.plate = 1; save(); SND.play('click'); SND.play('click', .35); SND.play('thud', .7); setTimeout(render, 800); return;
        }
        openDial({ key: 'c18', code: C18, syms: [CONS, CONS, CONS], ok: function () { SND.play('door'); escapeRoom(); } });
      });
    })
  }) };

  // ===== 스테이지 19 (비밀 서재 셋째): 원고 더미 → 작은 열쇠 → 곁탁자 → 흰 종이 → 등불에 비추면 눌린 자국 736 → 가방 → 문 열쇠
  VAR[19] = {
    views: R5VIEWS({
      '5e': vw('5e', function () {
        FL5('5e', { papers: 1, brief: 1 });
        if (S.f.papersDrop) loot('gotKey', 'key', 596, 478, 42, 42, 20);
        var pp = piece('img/r5_e.webp', 520, 360, 130, 120); pp.style.transformOrigin = '50% 100%';
        spot(520, 360, 650, 480, function () {
          SND.play('paper'); wobble(pp, 3);
          if (!S.f.papersDrop) { S.f.papersDrop = 1; save(); setTimeout(function () { dropNow('gotKey', 50); }, 250); }
        });
        briefcase('b19', [7, 3, 6], function () { loot('gotDoorkey', 'doorkey', 880, 640, 42, 104, -70); });
      }),
      '5s': vw('5s', function () {
        FL5('5s', { door: 1, table: 1 });
        // 곁탁자 앞판의 얕은 서랍: 열쇠 구멍이 있다(사장님 9/27 "열쇠구멍도 없는데 열쇠라니") → 작은 열쇠로 열면 흰 종이
        drawer2('S5', 392, 524, 104, 22, 'img/r5_s.webp', {
          lock: keyLock('key', 'table5'),
          deco: function (front) { plateOn(front, [392, 524, 104, 22], [438, 529, 11, 12], 'img/sp_keyhole.png'); },
          content: function (x, cy, w) { loot('gotPaper', 'paper', x + w / 2 - 32, cy - 26, 64, 58, -6); }
        });
        spot(R5.door[0], R5.door[1], R5.door[2], R5.door[3], exitWith('doorkey'));
      }),
      '5n': vw('5n', function () {
        FL5('5n', { lamp: 1 });
        spot(575, 450, 680, 590, function () {
          if (hasSel('paper')) {
            if (!S.f.held) { S.f.held = 1; save(); SND.play('paper'); FX.place('img/it_paper.png', 628, 470, 110, 104); FX.glow(628, 470, 300, 'rgba(210,255,190,.55)'); }
            S.sel = null; renderInv(); setTimeout(function () { lookItem('paper'); }, 650); return;
          }
          lampToggle();
        });
      })
    }),
    look: function (id) {
      if (id !== 'paper' || !S.f.held) return false;
      showLook(ITEMS.paper.img, ITEMS.paper.name, '', onPic('dent', '7&nbsp;3&nbsp;6', .2)); return true;
    }
  };

  // ---------- 동작들 ----------
  function lampToggle() {
    S.f.lampOff = !S.f.lampOff; SND.play('lamp');
    $('lampdark').style.opacity = S.f.lampOff ? (S.f.fire ? .55 : 1) : 0;
    save();
  }
  function spin(el) {
    SND.play('swing');
    var fr = []; for (var i = 0; i <= 24; i++) fr.push({ transform: 'scaleX(' + Math.cos(i / 24 * Math.PI * 6) * (1 - i / 40) + ')' });
    el.animate(fr, { duration: 1300, easing: 'ease-out' });
  }
  function wobble(el, amt) {
    el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(' + (amt || 6) + 'deg)' }, { transform: 'rotate(' + -(amt || 6) * .7 + 'deg)' }, { transform: 'rotate(' + (amt || 6) * .35 + 'deg)' }, { transform: 'rotate(0)' }], { duration: 650, easing: 'ease-out' });
  }
  function doorClick() {
    if (hasSel('doorkey')) {
      takeAway('doorkey'); SND.play('unlock'); setTimeout(function () { SND.play('door'); }, 500);
      escapeRoom();
      return;
    }
    SND.play('rattle'); shakeView();
  }

  // 초상화: 0 걸림 → 1 기울어짐 → 2 떨어짐(뒤에 열쇠)
  // opt.behind: 떨어진 뒤 벽에 남는 것을 그린다(없으면 테이프 붙인 작은 열쇠) / opt.noFall: 기울기만 한다
  function buildPortrait(opt) {
    opt = opt || {};
    var st = S.f.portrait || 0;
    if (st >= 2) {
      // 떨어진 액자: 벽난로 앞 바닥에 비스듬히 기대어 있다
      if (opt.behind) opt.behind();
      var fl = img('img/sp_portrait.png', 300, 520, 170, 205);
      fl.style.transform = 'rotate(-7deg)'; fl.style.filter = S.f.fire ? 'brightness(.95) sepia(.15)' : 'brightness(.75)';
      if (!opt.behind && !S.f.keyTaken) {
        // 액자 뒤 못에 걸린 작은 열쇠(고리를 못에 걸고 살짝 흔들린다)
        var k = hangKey('img/it_key.png', 705, 150, 58, 58, .72, .15, -45);
        spot(670, 135, 745, 228, function () { S.f.keyTaken = 1; k.remove(); give('key'); });
      }
      spot(300, 520, 470, 725, function () { SND.play('thud'); wobble(fl, 3); });
      return;
    }
    // 걸린 액자: 떼어 낸 벽 그림 위에 조각을 올려 둔다(움직일 수 있게)
    bg.src = 'img/r1_w' + (S.f.fire ? '_fire' : '') + '_np.webp';
    var p = img('img/sp_portrait.png', 520, 4, 350, 356);
    p.style.transformOrigin = '55% 8%';
    p.style.transition = 'transform .5s cubic-bezier(.3,1.6,.5,1)';
    if (S.f.fire) p.style.filter = 'brightness(1.03) sepia(.08)';
    if (st === 1) p.style.transform = 'rotate(9deg)';
    // 벽난로 위 탁상시계·도자기 개는 액자보다 앞에 있다
    img(S.f.fire ? 'img/sp_mantel_fire.png' : 'img/sp_mantel.png', 646, 316, 216, 84);
    spot(563, 26, 812, 343, function () {
      if (opt.noFall) {
        S.f.portrait = S.f.portrait ? 0 : 1; save(); SND.play('swing');
        p.style.transform = S.f.portrait ? 'rotate(9deg)' : ''; return;
      }
      if ((S.f.portrait || 0) === 0) {
        S.f.portrait = 1; save(); SND.play('swing'); p.style.transform = 'rotate(9deg)';
      } else {
        S.f.portrait = 2; save(); SND.play('swing');
        // 떨어지기: 조금 더 기울다가 아래로 떨어지며 돈다
        p.style.transition = 'transform .75s cubic-bezier(.55,0,.9,.45)';
        p.style.transform = 'translate(-60%, 150%) rotate(-40deg) scale(.55)';
        setTimeout(function () { SND.play('bigthud'); shakeView(); render(); }, 720);
      }
    });
  }

  function fireClick() {
    if (!S.f.fire) {
      if (hasSel('match')) {
        takeAway('match'); SND.play('match'); setTimeout(function () { SND.play('fire'); }, 250);
        S.f.fire = 1; save();
        bg2.src = V['1w'].img(); bg2.style.opacity = 0; void bg2.offsetWidth; bg2.style.opacity = 1;
        setTimeout(function () { render(); }, 950);
        return;
      }
      SND.play('thud'); return;
    }
    if (hasSel('paper')) {
      if (S.f.ink) { lookItem('paper'); return; }
      S.f.ink = 1; save(); SND.play('paper'); SND.play('clue', .3); FX.place('img/it_paper.png', LAST.x, LAST.y - 60, 90, 86); FX.glow(LAST.x, LAST.y - 60, 280, 'rgba(255,150,60,.6)'); FX.smoke(LAST.x, LAST.y - 120);
      S.sel = null; renderInv();
      setTimeout(function () { lookItem('paper'); }, 350);
      return;
    }
    SND.play('fire');
  }

  // 서랍: L 빈 서랍 / M 다이얼(문 열쇠) / R 작은 열쇠(성냥 + 원고 조각)
  // 서랍 모양: 기본은 네모. 오르골 서랍은 원근으로 비스듬해 그 모양대로 오리고 앞으로(왼쪽 아래로) 빠진다
  var DSHAPE = {
    MB: { poly: 'polygon(1.1% 2.8%, 98.9% 46.2%, 93.9% 97.2%, 1.1% 35.4%)', pull: 'translate(-2%,14%) scale(1.03)', oy: .14 },
    S5: { pull: 'translateY(70%) scale(1.14)', oy: .7 }
  };
  var DPULL = 'translateY(30%) scale(1.02)', DOY = .3;
  // 서랍 틀: 틈(열리면 드러나는 서랍 속, 어둡게)과 앞판. 안에 든 물건은 둘 사이에 그린다
  function drawerShell(id, x, y, w, h, src, open, drawItems) {
    var sh = DSHAPE[id] || {};
    var cav = div('spr', x + (sh.poly ? 0 : 6), y, w - (sh.poly ? 0 : 12), h);
    cav.style.background = 'linear-gradient(180deg,#050302 0%,#140c06 35%,#2a1b0f 100%)';
    cav.style.boxShadow = 'inset 10px 0 10px -4px rgba(0,0,0,.8),inset -10px 0 10px -4px rgba(0,0,0,.8)';
    if (sh.poly) cav.style.clipPath = sh.poly;
    cav.style.opacity = open ? 1 : 0; cav.style.transition = 'opacity .15s';
    if (open && drawItems) drawItems();
    var front = piece(src, x, y, w, h);
    if (sh.poly) front.style.clipPath = sh.poly;
    front.style.transition = 'transform .4s cubic-bezier(.2,.8,.3,1)'; front.style.transformOrigin = '50% 100%';
    var pullT = sh.pull || DPULL;
    if (open) front.style.transform = pullT;
    return { cav: cav, front: front, pullT: pullT, oy: open ? h * (sh.oy || DOY) : 0 };
  }
  function drawer(which, x, y, w, h, src) {
    var open = S.f['dr' + which];
    var D = drawerShell(which, x, y, w, h, src || 'img/c1_desk.webp', open, function () { drawerItems(which, x, y, w); });
    var cav = D.cav, front = D.front;
    // 열린 서랍은 앞판이 아래로 내려와 있으니 닫는 자리도 거기다(안의 물건을 가리지 않게)
    var oy = D.oy;
    var ds = spot(x, y + oy, x + w, y + h + oy, function () {
      if (S.f['dr' + which]) { SND.play('drawer'); S.f['dr' + which] = 0; save(); front.style.transform = ''; setTimeout(render, 450); return; }
      if (which === 'M' && !S.f.dialOk) { openDial(); return; }
      if (which === 'R' && !S.f.rOpen) {
        if (hasSel('key')) { takeAway('key'); S.f.rOpen = 1; SND.play('unlock'); save(); setTimeout(function () { pull(); }, 350); return; }
        SND.play('rattle'); wobble(front, 1.2); return;
      }
      if (which === 'V' && !S.f.vOpen) {
        if (hasSel('silver')) { takeAway('silver'); S.f.vOpen = 1; SND.play('unlock'); save(); setTimeout(function () { pull(); }, 350); return; }
        SND.play('rattle'); wobble(front, 1.2); return;
      }
      if (which === 'MB' && !S.f.mbFree) { SND.play('rattle'); wobble(front, 1); return; }
      if (which === 'T' && !S.f.tFree) { SND.play('rattle'); wobble(front, 1); return; }
      pull();
    });
    layer.insertBefore(ds, cav.nextSibling);          // 서랍 속 물건 누르는 자리가 서랍 닫는 자리보다 위에 오게
    function pull() {
      S.f['dr' + which] = 1; save(); SND.play('drawer');
      cav.style.opacity = 1; front.style.transform = D.pullT;
      setTimeout(render, 430);
    }
  }
  function drawerItems(which, x, y, w) {
    var out = [];
    var cy = y - 18;
    if (which === 'R') {
      if (!S.f.gotMatch) {
        var m = img('img/it_match.png', x + 60, cy, 110, 82); m.style.transform = 'rotate(-8deg)';
        spot(x + 60, cy, x + 170, cy + 82, function () { S.f.gotMatch = 1; m.remove(); give('match'); save(); });
      }
      if (S.clues.indexOf('page') < 0) {
        var p = img('img/it_page.png', x + 210, cy - 6, 78, 104); p.style.transform = 'rotate(6deg)';
        spot(x + 200, cy - 6, x + 300, cy + 98, function () { p.remove(); getClue('page'); });
      }
    }
    if (which === 'M' && !S.f.gotDoorkey) {
      var k = img('img/it_doorkey.png', x + w / 2 - 70, cy + 20, 150, 60); k.style.transform = 'rotate(-80deg) scale(.55,2.2)';
      k.style.transform = 'none'; pct(k, x + w / 2 - 34, cy - 30, 48, 120); k.style.transform = 'rotate(-72deg)';
      spot(x + w / 2 - 80, cy, x + w / 2 + 60, cy + 80, function () { S.f.gotDoorkey = 1; k.remove(); give('doorkey'); save(); });
    }
    if (which === 'MB' && !S.f.gotTap) {
      // 오르골 서랍 틈(비스듬, 가운데쯤 y≈490)에서 삐죽 나온 수도 손잡이
      var tp = img('img/it_tap.png', x + w / 2 - 44, cy + 34, 88, 70);
      spot(x + w / 2 - 56, cy + 28, x + w / 2 + 56, cy + 108, function () { S.f.gotTap = 1; tp.remove(); give('tap'); save(); });
    }
    if (which === 'F' && !S.f.gotFilm) {
      var fm = img('img/it_film.png', x + w / 2 - 50, cy - 16, 100, 84); fm.style.transform = 'rotate(-12deg)';
      spot(x + w / 2 - 60, cy - 24, x + w / 2 + 60, cy + 74, function () { S.f.gotFilm = 1; fm.remove(); give('film'); save(); });
    }
    if (which === 'T') {
      if (S.clues.indexOf('pen') < 0) {
        var pn = img('img/it_pen.png', x + w / 2 - 150, cy - 20, 130, 80); pn.style.transform = 'rotate(-10deg)';
        spot(x + w / 2 - 156, cy - 26, x + w / 2 - 14, cy + 66, function () { pn.remove(); getClue('pen'); });
      }
      if (!S.f.gotEkey3) {
        var ek = img('img/it_ekey3.png', x + w / 2 + 20, cy - 30, 60, 100); ek.style.transform = 'rotate(-70deg)';
        spot(x + w / 2 + 6, cy - 20, x + w / 2 + 130, cy + 70, function () { S.f.gotEkey3 = 1; ek.remove(); give('ekey3'); save(); });
      }
    }
    if (which === 'V' && S.clues.indexOf('diary') < 0) {
      var dy = img('img/it_diary.png', x + w / 2 - 60, cy - 24, 120, 96); dy.style.transform = 'rotate(-4deg)';
      spot(x + w / 2 - 70, cy - 28, x + w / 2 + 70, cy + 76, function () { dy.remove(); getClue('diary'); });
    }
    if (which === 'L') {
      // 빈 서랍: 먼지 낀 바닥만
      var dust = div('spr', x + 30, cy + 10, w - 60, 50); dust.style.background = 'radial-gradient(ellipse,rgba(160,140,110,.10),rgba(0,0,0,0) 70%)';
    }
    return out;
  }

  // 다이얼 자물쇠(3자리)
  function openDial(o) {
    o = o || { key: 'd1', code: CODE, ok: function () { S.f.dialOk = 1; save(); setTimeout(function () { S.f.drM = 1; SND.play('drawer'); save(); render(); }, 650); } };
    if (!S.dials) S.dials = {};
    if (o.key === 'd1') S.dials.d1 = S.dial;
    if (!S.dials[o.key]) S.dials[o.key] = o.code.map(function () { return 0; });
    var cur = S.dials[o.key];
    // o.syms: 바퀴마다 글자 목록(없으면 0~9). code 는 목록 안의 자리
    var sy = function (i) { return (o.syms && o.syms[i]) || null; };
    var lab = function (i, v) { var s = sy(i); return s ? s[v] : v; };
    var box = $('dial'); box.innerHTML = ''; box.style.flexDirection = ''; box.style.alignItems = '';
    cur.forEach(function (v, i) {
      var w = document.createElement('div'); w.className = 'wheel' + (sy(i) && sy(i)[0].length > 1 ? ' wide' : '');
      w.innerHTML = '<button class="up"></button><div class="num">' + lab(i, v) + '</div><button class="dn"></button>';
      w.querySelector('.up').onclick = function () { turn(i, 1); };
      w.querySelector('.dn').onclick = function () { turn(i, -1); };
      box.appendChild(w);
    });
    $('dialM').classList.add('on');
    function turn(i, d) {
      var n = sy(i) ? sy(i).length : 10;
      cur[i] = (cur[i] + d + n) % n; SND.play('tick');
      box.children[i].querySelector('.num').textContent = lab(i, cur[i]);
      save();
      if (cur.join('') === o.code.join('')) {
        SND.play('unlock'); lockGlow(box);
        setTimeout(function () { $('dialM').classList.remove('on'); o.ok(); }, 650);
      }
    }
  }

  // 책 누르기
  // 책 조각: 노란 책은 비스듬히 기대 있어 책장 그림에서 책 윤곽(tools/book_yellow.py 가 색으로 잰 것)대로 오려 쓴다.
  // (따로 오린 PNG·mask-image 는 폴더에서 더블클릭해 열면(file://) 크롬이 그리지 않아 쓰지 않는다 — 사장님 9/26 "노란책 안눌려")
  // 뒤에 같은 모양의 어두운 판을 깔아 밀어 넣었을 때 원래 책이 비치지 않게
  var BOOK_CLIP = { Y: 'polygon(59.3% 1%, 89.4% 75.2%, 95.1% 93.6%, 77.2% 96.6%, 41.5% 100%, 35% 98.3%, 28.5% 86.6%, 5.7% 27.5%, 0% 5.4%, 36.6% 2%)' };
  function bookPiece(c) {
    var b = BX[c];
    var back = div('spr', b[0], 262, b[1] - b[0], 298);
    back.style.background = 'linear-gradient(180deg,#0a0604,#1a110a 70%,#24170d)'; back.style.opacity = 0;
    var el = piece('img/c1_shelf.webp', b[0], 262, b[1] - b[0], 298);
    if (BOOK_CLIP[c]) { el.style.clipPath = back.style.clipPath = BOOK_CLIP[c]; el._slant = 1; }
    el._back = back;
    return el;
  }
  function pushIn(el, now) {
    if (now) el.style.transition = 'none';
    // 비스듬한 노란 책은 줄이면 모양이 어긋나 틈이 생기므로 어둡게만 하고 살짝 내린다
    // 노란 책은 밝은 색이라 같은 만큼 어둡게 해도 눈에 덜 띈다 → 더 어둡게, 다른 책만큼 안으로
    if (el._slant) el.style.transformOrigin = '55% 100%';
    el.style.transform = 'scale(.93) translateY(1.5%)'; el.style.filter = el._slant ? 'brightness(.34) saturate(.7)' : 'brightness(.5) saturate(.8)';
    if (el._back) el._back.style.opacity = 1;
  }
  function popOut(el) {
    el.style.transition = 'transform .25s cubic-bezier(.3,1.8,.5,1), filter .2s'; el.style.transform = ''; el.style.filter = '';
    if (el._back) el._back.style.opacity = 0;
  }

  function bookClick(c, els, ans, fill) {
    ans = ans || ANSWER;
    if (S.f.books || S.books.indexOf(c) >= 0) { SND.play('book'); return; }
    S.books.push(c); SND.play('book'); pushIn(els[c]);
    var n = S.books.length;
    if (S.books[n - 1] !== ans[n - 1]) {
      // 틀림: 조금 뒤 전부 튀어나온다
      var wrong = S.books.slice(); S.books = []; save();
      setTimeout(function () {
        SND.play('wrong'); shakeView();
        wrong.forEach(function (k) { popOut(els[k]); });
      }, 380);
      return;
    }
    save();
    if (n === ans.length) {
      S.f.books = 1; save();
      setTimeout(function () { SND.play('unlock'); SND.play('drawer', .3); FX.dust(1015, 430, 220); FX.star(1015, 400, 90); openNiche(false, fill); }, 400);
    }
  }
  // fill(nx, ny, now): 숨은 칸 안에 놓을 것(없으면 방 1 첫 스테이지의 태엽 열쇠·사진)
  function openNiche(now, fill) {
    // 노랑 책 오른쪽 어두운 칸 안쪽 판이 밀려 들어가며 숨은 칸이 열린다
    var nx = 940, ny = 300, nw = 150, nh = 256;
    var back = piece('img/c1_shelf.webp', nx, ny, nw, nh);
    var hole = div('spr', nx + 8, ny + 10, nw - 16, nh - 14);
    // 안쪽: 나뭇결 판 + 깊은 그림자
    hole.style.background = 'repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 9px,rgba(0,0,0,.18) 9px 10px),linear-gradient(180deg,#0a0604 0%,#24170c 55%,#3a2615 100%)';
    hole.style.boxShadow = 'inset 0 18px 22px rgba(0,0,0,.95),inset 12px 0 16px rgba(0,0,0,.8),inset -12px 0 16px rgba(0,0,0,.8)';
    hole.style.borderRadius = '3px';
    hole.style.opacity = now ? 1 : 0; hole.style.transition = 'opacity .6s';
    back.style.transition = 'transform .7s ease-in, opacity .7s';
    if (now) { back.style.display = 'none'; } else { requestAnimationFrame(function () { back.style.transform = 'scale(.8)'; back.style.opacity = 0; hole.style.opacity = 1; }); }
    if (fill) { fill(nx, ny, now); return; }
    if (!S.f.gotWind) {
      var w = img('img/it_wind.png', nx + 40, ny + 168, 58, 66); w.style.transform = 'rotate(-70deg)'; w.style.filter = 'drop-shadow(0 4px 3px rgba(0,0,0,.7)) brightness(.9)';
      w.style.opacity = now ? 1 : 0; w.style.transition = 'opacity .6s .5s'; if (!now) requestAnimationFrame(function () { w.style.opacity = 1; });
      spot(nx + 26, ny + 162, nx + 124, ny + 240, function () { S.f.gotWind = 1; w.remove(); give('wind'); save(); });
    }
    if (S.clues.indexOf('photo') < 0) {
      var ph = img('img/it_photo.png', nx + 18, ny + 48, 112, 110); ph.style.transform = 'rotate(-8deg)'; ph.style.filter = 'drop-shadow(0 4px 3px rgba(0,0,0,.7)) brightness(.85)';
      ph.style.opacity = now ? 1 : 0; ph.style.transition = 'opacity .6s .6s'; if (!now) requestAnimationFrame(function () { ph.style.opacity = 1; });
      spot(nx + 14, ny + 44, nx + 134, ny + 160, function () { ph.remove(); getClue('photo'); });
    }
  }

  // 시계: 태엽을 감으면 바늘이 돌아 7시 25분에 멈추고 7번 울린 뒤 추 상자 문이 열린다
  function setHands(svg, min, anim) {
    var hh = svg.querySelector('#hh'), mh = svg.querySelector('#mh');
    var h = (min / 60) % 12, m = min % 60;
    hh.setAttribute('transform', 'rotate(' + (h * 30) + ' 688 214)');
    mh.setAttribute('transform', 'rotate(' + (m * 6) + ' 688 214)');
  }
  function clockFace(hands, pend, doorEl, inside) {
    if (S.f.wound) { SND.play('chime'); return; }
    if (!hasSel('wind')) { SND.play('tick'); return; }
    takeAway('wind'); S.f.wound = 1; save();
    SND.play('wind'); SND.play('wind', .9);
    var from = 10 * 60 + 8, to = 12 * 60 + 7 * 60 + 25, t0 = Date.now() + 1700, dur = 2600;
    var iv = setInterval(function () {
      var k = Math.min(1, Math.max(0, (Date.now() - t0) / dur)); k = 1 - Math.pow(1 - k, 3);
      setHands(hands, from + (to - from) * k);
      if (k >= 1) { clearInterval(iv); done(); }
    }, 16);
    function done() {
      pend.style.animation = 'pend 1.6s ease-in-out infinite alternate';
      for (var i = 0; i < 7; i++) SND.play('chime', .3 + i * 1.25);
      setTimeout(function () {
        SND.play('unlock'); S.f.caseOpen = 1; save(); FX.dust(690, 520, 220); FX.star(690, 480, 100);
        inside.style.transition = 'opacity .5s'; inside.style.opacity = 1;
        doorEl.style.transform = 'perspective(900px) rotateY(-105deg)'; SND.play('creak', .1);
        setTimeout(render, 950);
      }, 9200);
    }
  }

  function escapeRoom() {
    FX.glow(LAST.x, LAST.y, 700, 'rgba(255,236,190,.7)'); FX.star(LAST.x, LAST.y, 140);
    S.done = Math.max(S.done || 0, S.stage); S.cleared = S.stage; save(); updStats();   // 깬 판을 다시 해도 줄지 않게. cleared = 방금 빠져나온 판(NEXT 전)
    $('fade').style.transition = 'opacity 1.4s'; $('fade').style.opacity = 1;
    setTimeout(roomClear, 1500);
  }
  function roomClear() {
    SND.play('clear'); SND.fire(false);
    var m = Math.floor(S.t / 60), s = S.t % 60;
    $('clearT').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    $('clear').classList.add('on');
  }
  $('btnNext').addEventListener('click', function () {
    SND.play('tick');
    $('clear').classList.remove('on');
    if (S.stage < STAGES) {
      nextStage(); save();
      render(); $('fade').style.transition = 'opacity 1.2s'; $('fade').style.opacity = 0;
      setTimeout(function () { SND.play('door'); }, 200);
    } else { $('fade').style.opacity = 0; showTitle(); }
  });

  // 다음 스테이지: 방 상태·소지품은 스테이지마다 새로(단서 수첩과 시간은 이어 간다)
  function nextStage() {
    S.stage++; S.room = Math.ceil(S.stage / 4); S.view = S.room + 'n'; S.cleared = 0;
    S.inv = []; S.sel = null; S.f = {}; S.books = []; S.dial = [0, 0, 0]; S.dials = {}; S.cards = null; S.wires = null;
    tableSel = -1; wirePick = -1;
    if (STG().init) STG().init();
  }

  // ---------- 장면 그리기 ----------
  function go(v) {
    SND.play('tick');
    var f = $('fade'); f.style.transition = 'opacity .16s'; f.style.opacity = 1;
    tableSel = -1; wirePick = -1;                     // 고르다 만 이름표·전선은 화면을 떠나면 놓는다
    setTimeout(function () { S.view = v; save(); render(); f.style.opacity = 0; }, 170);
  }
  function render() {
    var v = view(S.view);
    layer.innerHTML = ''; layer.onpointermove = null; layer.onpointerdown = null;
    bg.src = v.img(); bg2.style.transition = 'none'; bg2.style.opacity = 0; bg2.src = ''; void bg2.offsetWidth; bg2.style.transition = '';
    bg.style.filter = '';
    v.build();
    // 배경에 색 필터(자외선 등)가 걸렸으면 배경에서 떼어 낸 조각에도 똑같이
    if (bg.style.filter) layer.querySelectorAll('.pc').forEach(function (e) { if (!e.style.filter) e.style.filter = bg.style.filter; });
    $('navL').style.display = v.left ? '' : 'none';
    $('navR').style.display = v.right ? '' : 'none';
    $('navB').style.display = v.back ? '' : 'none';
    $('lampdark').style.opacity = S.f.lampOff ? (S.f.fire ? .55 : 1) : 0;
    SND.fire(!!S.f.fire && S.view === '1w');
    renderInv(); updStats();
  }
  $('navL').addEventListener('click', function () { SND.unlock(); go(view(S.view).left); });
  $('navR').addEventListener('click', function () { SND.unlock(); go(view(S.view).right); });
  $('navB').addEventListener('click', function () { SND.unlock(); go(view(S.view).back); });
  // 빈 곳을 누르면 고른 소지품을 내려놓는다
  layer.addEventListener('click', function () { if (S.sel) { S.sel = null; renderInv(); } });
  document.addEventListener('keydown', function (e) {
    if (!S || $('title').style.display !== 'none') return;
    var v = view(S.view);
    if ((e.key === 'ArrowLeft' || e.key === 'a') && v.left) go(v.left);
    if ((e.key === 'ArrowRight' || e.key === 'd') && v.right) go(v.right);
    if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'Escape') && v.back) go(v.back);
  });

  // ---------- 화면 맞추기 ----------
  // 화면 짜임: [왼쪽 화살표 띠][방 그림][오른쪽 화살표 띠][소지품 칸], 그림 아래 띠에 뒤로 화살표 — 화살표가 그림을 덮지 않는다
  function fit() {
    var inv = $('inv').offsetWidth;
    var G = Math.round(Math.max(40, Math.min(60, innerWidth * .045)));   // 양옆·아래 띠 두께
    var aw = innerWidth - inv - G * 2, ah = innerHeight - G;
    var w = aw, h = w * H / W;
    if (h > ah) { h = ah; w = h * W / H; }
    var x = G + (aw - w) / 2, y = (ah - h) / 2;
    viewEl.style.width = w + 'px'; viewEl.style.height = h + 'px'; viewEl.style.setProperty('--vs', w / W);
    viewEl.style.left = x + 'px'; viewEl.style.top = y + 'px';
    var L = $('navL'), R = $('navR'), B = $('navB');
    var nw = Math.min(54, x), nh = Math.min(84, h * .3);
    L.style.width = R.style.width = nw + 'px'; L.style.height = R.style.height = nh + 'px';
    L.style.left = (x - nw) / 2 + 'px'; L.style.top = y + (h - nh) / 2 + 'px';
    R.style.left = x + w + (x - nw) / 2 + 'px'; R.style.top = y + (h - nh) / 2 + 'px';
    var bh = Math.min(50, innerHeight - (y + h));
    B.style.height = bh + 'px'; B.style.left = x + w / 2 - 42 + 'px'; B.style.top = y + h + Math.max(0, (Math.min(G, innerHeight - y - h) - bh) / 2) + 'px';   // 그림 바로 밑 띠 안
  }
  addEventListener('resize', function () { fit(); if (S) renderInv(); });

  // 추 흔들림
  var st = document.createElement('style');
  st.textContent = '@keyframes pend{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
    '@keyframes pirou{0%{transform:scaleX(1)}46%{transform:scaleX(.4)}50%{transform:scaleX(-.4)}54%{transform:scaleX(-.4)}96%{transform:scaleX(-1)}100%{transform:scaleX(1)}}' +
    '@keyframes water{from{background-position:0 0}to{background-position:0 40px}}' +
    '@keyframes steam{0%{transform:translateY(20%) scale(.6);opacity:0}30%{opacity:.55}100%{transform:translateY(-120%) scale(1.5);opacity:0}}';
  document.head.appendChild(st);

  // ---------- 소리 단추 ----------
  function togs() { $('tgBgm').classList.toggle('off', !SND.on.bgm); $('tgSfx').classList.toggle('off', !SND.on.sfx); }
  $('tgBgm').addEventListener('click', function () { SND.unlock(); SND.bgm(!SND.on.bgm); togs(); });
  $('tgSfx').addEventListener('click', function () { SND.unlock(); SND.sfx(!SND.on.sfx); togs(); });
  // ---------- 판 고르기: 깬 판 수를 보여 주고, 펼치면 깬 판(과 지금 할 판)으로 들어간다(사장님 9/27) ----------
  $('tgStage').addEventListener('click', function () {
    SND.unlock(); SND.play('tick');
    var L = $('stageList'); L.innerHTML = '';
    var top = Math.min(STAGES, (S.done || 0) + 1);
    for (var k = 1; k <= STAGES; k++) (function (k) {
      var b = document.createElement('div');
      b.className = 'sbtn' + (k === S.stage ? ' cur' : '') + (k > top ? ' lock' : '') + (k <= (S.done || 0) ? ' done' : '');
      b.textContent = k;
      if (k <= top) b.addEventListener('click', function () { SND.play('click'); $('stageM').classList.remove('on'); if (k !== S.stage) jumpStage(k); });
      L.appendChild(b);
    })(k);
    $('stageM').classList.add('on');
  });
  function jumpStage(k) {
    var f = $('fade'); f.style.transition = 'opacity .35s'; f.style.opacity = 1;
    setTimeout(function () {
      SND.fire(false); S.stage = k - 1; nextStage(); save(); render(); updStats();
      f.style.transition = 'opacity 1s'; f.style.opacity = 0; SND.play('door');
    }, 380);
  }
  togs();

  // ---------- 시간 ----------
  setInterval(function () {
    if (!S || $('title').style.display !== 'none' || $('clear').classList.contains('on') || document.hidden) return;
    S.t++; tickShow();
    if (S.t % 5 === 0) save();
  }, 1000);
  function tickShow() { var m = Math.floor(S.t / 60), s = S.t % 60; $('stTime').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

  // ---------- 타이틀 ----------
  function showTitle() {
    var t = $('title'); t.style.display = 'flex'; t.style.opacity = 1;
    var sv = load(), B = $('titleBtns'); B.innerHTML = '';
    function btn(txt, main, fn) { var b = document.createElement('div'); b.className = 'btn' + (main ? ' main' : ''); b.textContent = txt; b.onclick = function () { SND.unlock(); SND.play('click'); fn(); }; B.appendChild(b); }
    if (sv && !(sv.done >= STAGES)) {
      btn('CONTINUE', true, function () { start(sv); });
      btn('NEW GAME', false, function () { start(fresh()); });
    } else btn('START', true, function () { start(fresh()); });
  }
  function start(s) {
    S = s;
    if (window.OG) OG.start({ stage: S.stage });   // 사이트 지표(game-events.js)
    // 방을 나간 뒤(NEXT 전에) 껐다 켰으면 다음 방에서 이어 간다
    var esc = S.cleared !== undefined ? S.cleared === S.stage : (S.done || 0) >= S.stage;   // 판 고르기 전 저장은 옛 방식으로
    if (esc && S.stage < STAGES) nextStage();
    save();
    var t = $('title'); t.style.opacity = 0; setTimeout(function () { t.style.display = 'none'; }, 600);
    fit(); render(); tickShow();
    if (S.t === 0) setTimeout(function () { SND.play('door'); }, 300);
  }
  fit(); showTitle();

  // 시험 손잡이
  window.__ms = { S: function () { return S; }, go: function (v) { S.view = v; render(); }, give: give, render: render, clue: getClue,
    stage: function (n) { S.stage = n - 1; nextStage(); save(); render(); }, fx: FX };
})();
