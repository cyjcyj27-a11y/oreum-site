// 화면·입력·저장·흐름
(function () {
  'use strict';
  var D = GY_DATA, $ = function (id) { return document.getElementById(id); };
  var hover = null, last = 0, acc = 0, pend = null;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var prog = { max: 1, stars: {} };
  try { var sv = JSON.parse(ls('gyodo.prog') || 'null'); if (sv && sv.max) prog = sv; } catch (e) {}
  function save() { ls('gyodo.prog', JSON.stringify(prog)); }
  var NAMES = { normal: '수감자', fast: '날쌘돌이', big: '덩치', tunnel: '땅굴꾼', spy: '변장범', riot: '폭동꾼', king: '탈옥왕' };
  var L = D.L, EN = window.GY_LANG === 'en';
  if (EN) {
    document.documentElement.lang = 'en'; document.title = L('교도관24시'); document.body.classList.add('en');
    document.querySelector('#title .logo').textContent = L('교도관24시');
    document.querySelector('#days h2').textContent = L('근무표');
    $('rotBtn').textContent = L('가로로 보기'); $('rotate').firstElementChild.textContent = L('교도관24시');
  }

  GYD.init($('cv'));
  function layout() { GYD.resize(); }
  window.addEventListener('resize', function () { setTimeout(layout, 30); });
  layout();

  // 장비 칸
  var slotEls = {};
  D.TORDER.forEach(function (k, n) {
    var d = D.TOWERS[k], el = document.createElement('div'); el.className = 'slot';
    el.innerHTML = '<canvas width="80" height="80"></canvas><span class="nm">' + L(d.name) + '</span><span class="cs"><i></i>' + d.cost + '</span><div class="lk" style="display:none"><b></b>DAY ' + d.day + '</div>';
    el.addEventListener('pointerdown', function () { if (!GYL.unlocked(k)) return; G.tool = G.tool === k ? null : k; G.sel = null; AU.play('click'); refresh(); });
    $('slots').appendChild(el); slotEls[k] = el;
  });
  // 넘치는 글자만 줄인다(배치는 그대로). 영문 장비 이름 Searchlight 등
  function fitText() {
    document.querySelectorAll('.slot .nm, #tiName, #tBtns .btn, .paper h2, #rInfo, #iZone').forEach(function (el) {
      el.style.fontSize = ''; var fs = parseFloat(getComputedStyle(el).fontSize), n = 0;
      while (el.scrollWidth > el.clientWidth + 1 && fs > 8 && n++ < 20) { fs -= 1; el.style.fontSize = fs + 'px'; }
    });
  }
  window.addEventListener('resize', function () { setTimeout(fitText, 60); });
  function drawIcons() { D.TORDER.forEach(function (k) { GYD.icon(slotEls[k].querySelector('canvas'), k); }); }
  var iconTries = 0; (function waitIcons() { if (GYD.ready()) drawIcons(); else if (iconTries++ < 100) setTimeout(waitIcons, 100); })();

  function refresh() {
    $('sDay').textContent = G.day;
    $('sClock').textContent = G.phase === 'wave' ? D.SLOTS[G.slot] : (D.SLOTS[G.slot] || '24:00');
    $('sCoin').textContent = G.coins | 0;
    for (var i = 0; i < D.LIVES; i++) $('l' + i).className = 'lamp' + (G.warn > i ? ' on' : '');
    $('sRank').textContent = L(D.RANKS[G.zone]);
    D.TORDER.forEach(function (k) {
      var el = slotEls[k], lock = !GYL.unlocked(k);
      el.className = 'slot' + (lock ? ' lock' : '') + (G.tool === k ? ' sel' : '') + (!lock && G.coins < D.TOWERS[k].cost ? ' poor' : '');
      el.querySelector('.lk').style.display = lock ? 'block' : 'none';
      el.querySelector('.cs').style.visibility = lock ? 'hidden' : 'visible';
    });
    $('next').disabled = G.phase !== 'build';
    if (!refresh.fitted) { refresh.fitted = 1; fitText(); }
    $('nextT').textContent = D.SLOTS[G.slot] || '';
    tinfo();
  }
  function tinfo() {
    var el = $('tinfo'), tw = G.sel;
    if (!tw || G.towers[tw.i] !== tw || G.phase === 'title') { el.style.display = 'none'; return; }
    var d = D.TOWERS[tw.type], uc = GYL.upCost(tw);
    $('tiName').textContent = L(d.name) + ' Lv.' + (tw.lv + 1);
    $('tiUp').innerHTML = uc ? 'UP <i></i>' + uc : 'MAX'; $('tiUp').disabled = !uc;
    $('tiUp').style.color = uc && G.coins < uc ? '#ff8a7a' : '';
    $('tiSell').innerHTML = '<i></i>+' + Math.floor(tw.spent * 0.7);
    el.style.display = 'flex'; if (tinfo.last !== tw.i + ':' + tw.lv) { tinfo.last = tw.i + ':' + tw.lv; fitText(); }
    var r = $('cv').getBoundingClientRect(), st = $('stage').getBoundingClientRect(), m = GYD.resize.last || GYD.resize();
    GYD.resize.last = m;
    var px = r.left + m.ox + (tw.x + 0.5) * 32 * m.sc, py = r.top + m.oy + tw.y * 32 * m.sc;
    var w = el.offsetWidth, h = el.offsetHeight;
    var left = Math.max(st.left + 4, Math.min(st.right - w - 4, px - w / 2));
    var top = py - h - 8; if (top < st.top + 4) top = py + 32 * m.sc + 8;
    el.style.left = left + 'px'; el.style.top = top + 'px';
  }
  window.addEventListener('resize', function () { GYD.resize.last = null; });
  $('tiUp').onclick = function () { if (G.sel && GYL.upgrade(G.sel)) AU.play('build'); else AU.play('no'); refresh(); };
  $('tiSell').onclick = function () { if (G.sel) { GYL.sell(G.sel); AU.play('sell'); } refresh(); };

  // 지도 누르기
  var cv = $('cv');
  cv.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') hover = GYD.toCell(e.clientX, e.clientY); });
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hover = null; });
  cv.addEventListener('pointerdown', function (e) {
    if (G.phase !== 'build' && G.phase !== 'wave') return;
    AU.init();
    var c = GYD.toCell(e.clientX, e.clientY); if (e.pointerType !== 'touch') hover = c;
    var i = c.y * 20 + c.x, tw = G.towers[i];
    if (c.x < 0 || c.y < 0 || c.x >= 20 || c.y >= 12) return;
    if (tw) { pend = null; if (e.pointerType === 'touch') hover = null; G.sel = G.sel === tw ? null : tw; AU.play('click'); refresh(); return; }
    if (G.tool) {
      // 터치는 두 번: 첫 탭은 미리보기(칸·사거리), 같은 칸을 한 번 더 누르면 놓는다. 마우스는 한 번에
      if (e.pointerType === 'touch' && !(pend && pend.x === c.x && pend.y === c.y && pend.tool === G.tool)) { pend = { x: c.x, y: c.y, tool: G.tool }; hover = c; AU.play('click'); return; }
      pend = null;
      if (GYL.build(G.tool, c.x, c.y)) { AU.play(G.tool === 'door' ? 'door' : 'build'); G.sel = null; G.fx.push({ k: 'dust', x: c.x + 0.5, y: c.y + 0.7, t: 0, life: 0.35 }); if (e.pointerType === 'touch') hover = null; }
      else AU.play('no');
      refresh(); return;
    }
    G.sel = null; refresh();
  });

  $('next').onclick = function () { AU.init(); if (G.phase === 'build') { GYL.startWave(); G.sel = null; refresh(); } };
  $('bPause').onclick = function () { if (G.phase !== 'build' && G.phase !== 'wave') return; G.paused = true; show('pause'); };
  $('pGo').onclick = function () { G.paused = false; hide('pause'); };
  $('pRetry').onclick = function () { G.paused = false; hide('pause'); startDay(G.day); };
  $('pHome').onclick = function () { G.paused = false; hide('pause'); toTitle(); };
  $('bSpd').onclick = function () { G.spd = G.spd === 1 ? 2 : 1; $('bSpd').classList.toggle('on2', G.spd === 2); };
  function syncTogs() { $('bBgm').classList.toggle('off', !AU.bgm()); $('bSnd').classList.toggle('off', !AU.snd()); }
  $('bBgm').onclick = function () { AU.init(); AU.bgm(!AU.bgm()); syncTogs(); };
  $('bSnd').onclick = function () { AU.init(); AU.snd(!AU.snd()); syncTogs(); };
  syncTogs();
  $('rotBtn').onclick = function () { if (window.OL && OL.go) OL.go(); };
  document.addEventListener('keydown', function (e) {
    if (e.key >= '1' && e.key <= '6') { var k = D.TORDER[+e.key - 1]; if (GYL.unlocked(k)) { G.tool = G.tool === k ? null : k; refresh(); } }
    else if (e.key === ' ' && G.phase === 'build') { e.preventDefault(); $('next').onclick(); }
    else if (e.key === 'Escape') { G.tool = null; G.sel = null; refresh(); }
    else if (e.key === 'f' || e.key === 'F') $('bSpd').onclick();
  });

  function show(id) { $(id).classList.add('show'); fitText(); }
  function hide(id) { $(id).classList.remove('show'); }

  // 타이틀
  function toTitle() {
    G.phase = 'title'; hideAll(); show('title'); document.body.classList.add('ttl'); GYD.resize.last = null; layout();
    titleScene();
    var b = $('tBtns'); b.innerHTML = '';
    if (prog.max > 1) {
      mk('btn main', 'DAY ' + Math.min(prog.max, D.DAYS), function () { startDay(Math.min(prog.max, D.DAYS)); });
      mk('btn', L('근무표'), function () { openDays(); });
    } else mk('btn main', 'START', function () { startDay(1); });
    function mk(cls, txt, fn) { var e = document.createElement('button'); e.className = cls; e.textContent = txt; e.onclick = function () { AU.init(); AU.play('click'); fn(); }; b.appendChild(e); }
  }
  function titleScene() {
    GYL.newDay(1); G.phase = 'title';
    // 감방 앞 몇 명이 어슬렁
    G.enemies = [];
    for (var i = 0; i < 5; i++) { var e = GYL.spawn(['normal', 'fast', 'big', 'normal', 'spy'][i], i); e.title = true; }
    [[6, 4, 'guard'], [12, 7, 'guard'], [15, 3, 'cctv'], [9, 8, 'dog'], [16, 6, 'door'], [16, 5, 'door']].forEach(function (t) { var i = t[1] * 20 + t[0]; G.towers[i] = { type: t[2], lv: 0, x: t[0], y: t[1], i: i, cd: 1, dir: 0, act: 0, hp: 3, spent: 0, ang: 0 }; });
    GYL.refield();
  }
  function hideAll() { ['title', 'days', 'intro', 'result', 'pause'].forEach(hide); }
  function openDays() {
    hide('title'); show('days');
    var g = $('daygrid'); g.innerHTML = '';
    for (var d = 1; d <= D.DAYS; d++) (function (d) {
      var b = document.createElement('button'), s = prog.stars[d] || 0;
      b.innerHTML = d + '<small>' + (s ? '★★★'.slice(0, s) : '') + '</small>';
      b.disabled = d > prog.max;
      b.onclick = function () { AU.play('click'); hide('days'); startDay(d); };
      g.appendChild(b);
    })(d);
  }
  $('dBack').onclick = function () { hide('days'); show('title'); };

  // 하루 시작: 새 장비·새 수감자 소개(이름만)
  function startDay(day) {
    hideAll(); document.body.classList.remove('ttl'); GYD.resize.last = null; layout(); GYL.newDay(day); G.phase = 'intro'; G.tool = 'guard'; refresh();
    $('iDay').textContent = 'DAY ' + day;
    $('iZone').textContent = L(GY_DATA.MAPS[G.zone].name) + '  ·  ' + L(D.RANKS[G.zone]);
    var html = '', newT = D.TORDER.filter(function (k) { return D.TOWERS[k].day === day; }), newE = Object.keys(D.FIRST).filter(function (k) { return D.FIRST[k] === day; });
    if (newT.length || newE.length) {
      html += '<div class="who">';
      newT.forEach(function (k) { html += '<div><span class="tag">NEW</span><canvas width="80" height="80" data-t="' + k + '"></canvas>' + L(D.TOWERS[k].name) + '</div>'; });
      newE.forEach(function (k) { html += '<div><span class="tag" style="background:#1b1d21">!</span><canvas width="80" height="80" data-e="' + k + '"></canvas>' + L(NAMES[k]) + '</div>'; });
      html += '</div>';
    }
    $('iNew').innerHTML = html;
    // 그림 묶음이 아직 안 읽혔으면 읽힌 뒤 다시 그린다(느린 폰에서 분홍 네모)
    (function redo(n) { if (GYD.ready()) $('iNew').querySelectorAll('canvas[data-t]').forEach(function (c) { GYD.icon(c, c.dataset.t); }); else if (n < 100) setTimeout(function () { redo(n + 1); }, 100); })(0);
    $('iNew').querySelectorAll('canvas').forEach(function (c) {
      if (c.dataset.t) GYD.icon(c, c.dataset.t);
      else { var x = c.getContext('2d'), m = GY_ATLAS[D.ENEMIES[c.dataset.e].spr]; if (m) { x.imageSmoothingEnabled = false; var im = new Image(); im.onload = function () { var s = Math.min(70 / m[3], 70 / m[2]); x.drawImage(im, m[0], m[1], m[2], m[3], 40 - m[2] * s / 2, 76 - m[3] * s, m[2] * s, m[3] * s); }; im.src = 'img/atlas.png?v=1'; } }
    });
    show('intro');
  }
  $('iGo').onclick = function () { AU.init(); AU.play('click'); hide('intro'); G.phase = 'build'; refresh(); };

  window.GY = {
    clear: function () {
      G.phase = 'won'; refresh(); var st = G.warn === 0 ? 3 : G.warn <= 2 ? 2 : 1;
      if (!prog.stars[G.day] || prog.stars[G.day] < st) prog.stars[G.day] = st;
      if (G.day >= prog.max) prog.max = Math.min(D.DAYS + 1, G.day + 1);
      save(); AU.play('clear');
      if (G.day >= D.DAYS) { setTimeout(ending, 900); return; }
      setTimeout(function () {
        $('rTitle').textContent = 'DAY CLEAR';
        $('rStars').innerHTML = '<span>' + '★'.repeat(st) + '</span><span class="off">' + '★'.repeat(3 - st) + '</span>';
        $('rInfo').textContent = L('검거') + ' ' + G.caught;
        var b = $('rBtns'); b.innerHTML = '';
        btn(b, 'btn', 'HOME', toTitle); btn(b, 'btn', 'RETRY', function () { startDay(G.day); }); btn(b, 'btn main', 'NEXT', function () { startDay(G.day + 1); });
        show('result');
      }, 700);
    },
    fail: function () {
      G.phase = 'lost'; AU.play('fail'); refresh();
      $('rTitle').textContent = 'GAME OVER'; $('rStars').innerHTML = ''; $('rInfo').textContent = L('탈옥') + ' ' + G.escaped;
      var b = $('rBtns'); b.innerHTML = '';
      btn(b, 'btn', 'HOME', toTitle); btn(b, 'btn main', 'RETRY', function () { startDay(G.day); });
      show('result');
    }
  };
  function btn(p, cls, txt, fn) { var e = document.createElement('button'); e.className = cls; e.textContent = txt; e.onclick = function () { AU.play('click'); hide('result'); fn(); }; p.appendChild(e); }
  function ending() {
    $('rTitle').textContent = 'THE END';
    $('rStars').innerHTML = '';
    $('rInfo').innerHTML = '<canvas id="endCv" class="endcv" width="200" height="130"></canvas>' + L('30일 근무 완료') + ' · ' + L(D.RANKS[4]);
    setTimeout(function () {
      var c = document.getElementById('endCv'); if (!c) return; var x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.fillStyle = '#3a3f46'; x.fillRect(0, 0, 200, 130); x.fillStyle = '#2b2e33'; x.fillRect(0, 96, 200, 34);
      x.fillStyle = '#6e5a44'; x.fillRect(120, 70, 66, 26); x.fillStyle = '#c9cdd3'; x.fillRect(124, 72, 20, 10);
      var m = GY_ATLAS.p_king, im = new Image(); im.onload = function () {
        x.drawImage(im, m[0], m[1], m[2], m[3], 100 - m[2], 112 - m[3] * 2, m[2] * 2, m[3] * 2);
        for (var i = 6; i < 200; i += 16) { x.fillStyle = '#a7b0ba'; x.fillRect(i, 0, 5, 130); x.fillStyle = '#5d6670'; x.fillRect(i + 3, 0, 2, 130); }
        x.fillStyle = '#a7b0ba'; x.fillRect(0, 6, 200, 5); x.fillRect(0, 118, 200, 6);
      }; im.src = 'img/atlas.png?v=1';
    }, 30);
    var b = $('rBtns'); b.innerHTML = ''; btn(b, 'btn main', 'HOME', toTitle);
    show('result');
  }

  // 반복
  function tick(dt) {
    if (G.phase === 'title') {
      G.t += dt;
      G.enemies.forEach(function (e) { e.fr += dt * 3; if (Math.random() < dt * 0.4) e.dir = (Math.random() * 4) | 0; });
      for (var k in G.towers) { var tw = G.towers[k]; tw.ang += dt; if (Math.random() < dt * 0.5) tw.dir = (Math.random() * 4) | 0; }
    } else if (!G.paused) {
      var n = G.spd; while (n-- > 0) GYL.step(dt);
    }
    if (G.phase === 'build' || G.phase === 'wave') {
      if (tick.u === undefined || (tick.u += dt) > 0.15 || tick.ph !== G.phase + G.slot) { tick.u = 0; tick.ph = G.phase + G.slot; refresh(); }
    }
  }
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    tick(dt); GYD.frame(G.tool && G.phase === 'build' || G.tool && G.phase === 'wave' ? hover : null);
    requestAnimationFrame(loop);
  }
  window.__fk = { tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) tick(dt || 1 / 60); GYD.frame(hover); }, G: G, prog: prog };
  toTitle(); refresh();
  requestAnimationFrame(loop);
})();