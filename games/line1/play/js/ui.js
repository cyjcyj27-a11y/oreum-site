// 화면·입력·저장·흐름: 타이틀, 노선도, 판 소개, 카드 뽑기, 도감, 엔딩
(function () {
  'use strict';
  var D = L1_DATA, L = D.L, $ = function (id) { return document.getElementById(id); };
  var hover = null, last = 0, pend = null;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var prog = { max: 1, stars: {}, cards: {}, dex: {}, seen: {}, cseen: {} };
  try { var sv = JSON.parse(ls('line1.prog') || 'null'); if (sv && sv.max) { prog = sv; ['stars', 'cards', 'dex', 'seen', 'cseen'].forEach(function (k) { prog[k] = prog[k] || {}; }); } } catch (e) {}
  function save() { ls('line1.prog', JSON.stringify(prog)); }
  var EN = window.L1_LANG === 'en';
  if (EN) {
    document.documentElement.lang = 'en'; document.title = L('1호선 빌런'); document.body.classList.add('en');
    $('logoT').textContent = L('1호선 빌런'); $('rotT').textContent = L('1호선 빌런'); $('rotBtn').textContent = L('가로로 보기');
    $('routeH').textContent = L('노선도'); $('tabV').textContent = L('빌런'); $('tabC').textContent = L('카드');
  }
  L1D.init($('cv'));
  function layout() { L1D.resize(); }
  window.addEventListener('resize', function () { setTimeout(layout, 30); });
  layout();

  // 장비 칸
  var slotEls = {};
  D.TORDER.forEach(function (k) {
    var d = D.TOWERS[k], el = document.createElement('div'); el.className = 'slot';
    el.innerHTML = '<canvas width="88" height="88"></canvas><span class="nm">' + L(d.name) + '</span><span class="cs"><i></i><b></b></span><div class="lk" style="display:none"><b></b>RUN ' + d.st + '</div>';
    el.addEventListener('pointerdown', function () { if (!L1L.unlocked(k)) return; G.tool = G.tool === k ? null : k; G.sel = null; AU.play('click'); refresh(); });
    $('slots').appendChild(el); slotEls[k] = el;
  });
  function fitText() {
    document.querySelectorAll('.slot .nm, #tiName, #tBtns .btn, .sheet h2, #rInfo, #iZone, #nextT, .card .nm').forEach(function (el) {
      el.style.fontSize = ''; var fs = parseFloat(getComputedStyle(el).fontSize), n = 0;
      while (el.scrollWidth > el.clientWidth + 1 && fs > 7 && n++ < 24) { fs -= 1; el.style.fontSize = fs + 'px'; }
    });
  }
  window.addEventListener('resize', function () { setTimeout(fitText, 60); });
  function drawIcons() { D.TORDER.forEach(function (k) { L1D.icon(slotEls[k].querySelector('canvas'), k); }); }
  (function waitIcons(n) { if (L1D.ready()) drawIcons(); else if (n < 100) setTimeout(function () { waitIcons(n + 1); }, 100); })(0);

  function refresh() {
    $('sStage').textContent = G.stage;
    $('sSta').textContent = L(L1L.station(Math.min(G.slot, G.nslot - 1)));
    $('sCoin').textContent = G.coins | 0;
    var lp = $('lamps'); if (lp.childNodes.length !== G.lives) { lp.innerHTML = ''; for (var i = 0; i < G.lives; i++) { var s = document.createElement('span'); s.className = 'lamp'; lp.appendChild(s); } }
    for (i = 0; i < G.lives; i++) lp.childNodes[i].className = 'lamp' + (G.warn > i ? ' on' : '');
    $('sRank').textContent = L(D.RANKS[G.zone]);
    D.TORDER.forEach(function (k) {
      var el = slotEls[k], lock = !L1L.unlocked(k), c = L1L.cost(k);
      el.className = 'slot' + (lock ? ' lock' : '') + (G.tool === k ? ' sel' : '') + (!lock && G.coins < c ? ' poor' : '');
      el.querySelector('.lk').style.display = lock ? 'block' : 'none';
      el.querySelector('.cs').style.visibility = lock ? 'hidden' : 'visible';
      el.querySelector('.cs b').textContent = c;
    });
    $('next').disabled = G.phase !== 'build';
    var nt = G.phase === 'build' ? L(L1L.station(G.slot)) : '';
    if ($('nextT').textContent !== nt) { $('nextT').textContent = nt; fitText(); }
    if (!refresh.fitted) { refresh.fitted = 1; fitText(); }
    tinfo();
  }
  function tinfo() {
    var el = $('tinfo'), tw = G.sel;
    if (!tw || G.towers[tw.i] !== tw || G.phase === 'title') { el.style.display = 'none'; return; }
    var d = D.TOWERS[tw.type], uc = L1L.upCost(tw);
    $('tiName').textContent = L(d.name) + ' Lv.' + (tw.lv + 1);
    $('tiUp').innerHTML = uc ? 'UP <i></i>' + uc : 'MAX'; $('tiUp').disabled = !uc;
    $('tiUp').style.color = uc && G.coins < uc ? '#d12a1e' : '';
    $('tiSell').innerHTML = '<i></i>+' + L1L.sellVal(tw);
    el.style.display = 'flex'; if (tinfo.last !== tw.i + ':' + tw.lv) { tinfo.last = tw.i + ':' + tw.lv; fitText(); }
    var r = $('cv').getBoundingClientRect(), st = $('stage').getBoundingClientRect(), m = L1D.resize.last || L1D.resize();
    L1D.resize.last = m;
    var px = r.left + m.ox + (tw.x + 0.5) * 32 * m.sc, py = r.top + m.oy + tw.y * 32 * m.sc;
    var w = el.offsetWidth, h = el.offsetHeight;
    var left = Math.max(st.left + 4, Math.min(st.right - w - 4, px - w / 2));
    var top = py - h - 8; if (top < st.top + 4) top = py + 32 * m.sc + 8;
    el.style.left = left + 'px'; el.style.top = top + 'px';
  }
  window.addEventListener('resize', function () { L1D.resize.last = null; });
  $('tiUp').onclick = function () { if (G.sel && L1L.upgrade(G.sel)) AU.play('build'); else AU.play('no'); refresh(); };
  $('tiSell').onclick = function () { if (G.sel) { L1L.sell(G.sel); AU.play('sell'); } refresh(); };

  // 지도 누르기(터치는 첫 탭 미리보기, 같은 칸 두 번째 탭에 놓기)
  var cv = $('cv');
  cv.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') hover = L1D.toCell(e.clientX, e.clientY); });
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hover = null; });
  cv.addEventListener('pointerdown', function (e) {
    if (G.phase !== 'build' && G.phase !== 'wave') return;
    AU.init();
    var c = L1D.toCell(e.clientX, e.clientY); if (e.pointerType !== 'touch') hover = c;
    if (c.x < 0 || c.y < 0 || c.x >= 20 || c.y >= 12) return;
    var tw = G.towers[c.y * 20 + c.x];
    if (tw) { pend = null; if (e.pointerType === 'touch') hover = null; G.sel = G.sel === tw ? null : tw; AU.play('click'); refresh(); return; }
    if (G.tool) {
      if (e.pointerType === 'touch' && !(pend && pend.x === c.x && pend.y === c.y && pend.tool === G.tool)) { pend = { x: c.x, y: c.y, tool: G.tool }; hover = c; AU.play('click'); return; }
      pend = null;
      if (L1L.build(G.tool, c.x, c.y)) { AU.play(G.tool === 'fence' ? 'fence' : 'build'); G.sel = null; G.fx.push({ k: 'dust', x: c.x + 0.5, y: c.y + 0.7, t: 0, life: 0.35 }); if (e.pointerType === 'touch') hover = null; }
      else AU.play('no');
      refresh(); return;
    }
    G.sel = null; refresh();
  });

  $('next').onclick = function () { AU.init(); if (G.phase === 'build') { L1L.startWave(); G.sel = null; refresh(); } };
  $('bPause').onclick = function () { if (G.phase !== 'build' && G.phase !== 'wave') return; G.paused = true; show('pause'); };
  $('pGo').onclick = function () { G.paused = false; hide('pause'); };
  $('pRetry').onclick = function () { G.paused = false; hide('pause'); startStage(G.stage); };
  $('pHome').onclick = function () { G.paused = false; hide('pause'); toTitle(); };
  $('bSpd').onclick = function () { G.spd = G.spd === 1 ? 2 : 1; $('bSpd').classList.toggle('on2', G.spd === 2); };
  function syncTogs() { $('bBgm').classList.toggle('off', !AU.bgm()); $('bSnd').classList.toggle('off', !AU.snd()); }
  $('bBgm').onclick = function () { AU.init(); AU.bgm(!AU.bgm()); syncTogs(); };
  $('bSnd').onclick = function () { AU.init(); AU.snd(!AU.snd()); syncTogs(); };
  syncTogs();
  $('rotBtn').onclick = function () { if (window.OL && OL.go) OL.go(); };
  document.addEventListener('keydown', function (e) {
    if (e.key >= '1' && e.key <= '8') { var k = D.TORDER[+e.key - 1]; if (L1L.unlocked(k)) { G.tool = G.tool === k ? null : k; refresh(); } }
    else if (e.key === ' ' && G.phase === 'build') { e.preventDefault(); $('next').onclick(); }
    else if (e.key === 'Escape') { G.tool = null; G.sel = null; refresh(); }
    else if (e.key === 'f' || e.key === 'F') $('bSpd').onclick();
  });
  function show(id) { $(id).classList.add('show'); fitText(); }
  function hide(id) { $(id).classList.remove('show'); }
  function hideAll() { ['title', 'route', 'dex', 'intro', 'result', 'pick', 'pause'].forEach(hide); }
  function mkBtn(p, cls, txt, fn) { var e = document.createElement('button'); e.className = cls; e.textContent = txt; e.onclick = function () { AU.init(); AU.play('click'); fn(); }; p.appendChild(e); return e; }

  // 타이틀: 실제 객차 장면(빌런들이 어슬렁, 창밖 풍경이 흐른다)
  function toTitle() {
    G.phase = 'title'; hideAll(); show('title'); document.body.classList.add('ttl'); L1D.resize.last = null; layout();
    titleScene();
    var b = $('tBtns'); b.innerHTML = '';
    if (prog.max > 1) {
      mkBtn(b, 'btn main', 'RUN ' + Math.min(prog.max, D.STAGES), function () { startStage(Math.min(prog.max, D.STAGES)); });
      mkBtn(b, 'btn', L('노선도'), openRoute);
      mkBtn(b, 'btn', L('도감'), function () { openDex('v'); });
    } else mkBtn(b, 'btn main', 'START', function () { startStage(1); });
  }
  function titleScene() {
    L1L.newStage(Math.min(prog.max, 61), prog.cards); G.phase = 'title'; G.vel = 1;
    G.enemies = [];
    var who = ['preacher', 'b_danso', 'spread', 'drunk', 'trot', 'pigeon', 'b_armor', 'phone'];
    var spots = [[3, 4], [9, 6], [14, 3], [6, 8], [12, 8], [16, 6], [7, 3], [17, 9]];
    who.forEach(function (k, i) { var e = L1L.spawn(k, i); e.x = spots[i][0] + 0.5; e.y = spots[i][1] + 0.5; e.ci = L1L.idx(spots[i][0], spots[i][1]); e.dir = i % 2 ? 2 : 3; e.face = e.dir; });
    [[5, 5, 'staff'], [11, 4, 'guard'], [15, 7, 'gongik'], [10, 9, 'announce']].forEach(function (t) { var i = t[1] * 20 + t[0]; G.towers[i] = { type: t[2], lv: 0, x: t[0], y: t[1], i: i, cd: 1, dir: 0, act: 0, hp: 3, spent: 0, ang: 0, stun: 0 }; });
    L1L.refield();
  }

  // 노선도: 7구간 x 10역(10번째는 보스)
  function openRoute() {
    hide('title'); show('route');
    var g = $('routes'); g.innerHTML = '';
    for (var z = 0; z < 7; z++) {
      var line = document.createElement('div'); line.className = 'rline';
      line.innerHTML = '<div class="zn">' + L(D.MAPS[z].name) + '</div><div class="st"></div>';
      var st = line.querySelector('.st');
      for (var l = 1; l <= 10; l++) (function (s) {
        var b = document.createElement('button'), stars = prog.stars[s] || 0;
        b.textContent = s; b.className = (s % 10 === 0 ? 'boss ' : '') + (stars ? 's' + stars : '') + (s === Math.min(prog.max, D.STAGES) ? ' cur' : '');
        b.disabled = s > prog.max;
        b.onclick = function () { AU.play('click'); hide('route'); startStage(s); };
        st.appendChild(b);
      })(z * 10 + l);
      g.appendChild(line);
    }
  }
  $('rBack').onclick = function () { hide('route'); show('title'); };

  // 도감: 빌런 22, 카드 24. 처음 잡으면 열린다
  var dexTab = 'v';
  function openDex(tab) {
    dexTab = tab; hide('title'); show('dex');
    $('tabV').classList.toggle('on', tab === 'v'); $('tabC').classList.toggle('on', tab === 'c');
    var g = $('dexgrid'); g.innerHTML = '';
    if (tab === 'v') {
      var all = D.VILLAINS.concat(D.BOSSES), n = 0;
      all.forEach(function (k) {
        var got = !!prog.dex[k], d = document.createElement('div'); if (got) n++;
        d.className = 'd' + (got ? '' : ' no') + (D.ENEMIES[k].boss ? ' boss' : '');
        d.innerHTML = '<canvas width="88" height="88"></canvas><span>' + (got ? L(D.ENEMIES[k].name) : '?') + '</span>';
        g.appendChild(d); L1D.face(d.querySelector('canvas'), k);
      });
      g.style.gridTemplateColumns = ''; $('dexN').textContent = n + '/' + all.length;
    } else {
      var m = 0;
      D.CARDS.forEach(function (c) {
        var cnt = prog.cards[c.id] || 0, d = document.createElement('div'); if (cnt) m++;
        d.className = 'cd' + (c.g ? ' g' : '') + (cnt ? '' : ' no');
        d.innerHTML = cnt ? '<b>' + L(c.name) + '</b><br>' + L(c.v) + (c.max > 1 ? '<br>' + cnt + '/' + c.max : '') : '?';
        g.appendChild(d);
      });
      $('dexN').textContent = m + '/' + D.CARDS.length;
    }
  }
  $('tabV').onclick = function () { AU.play('click'); openDex('v'); };
  $('tabC').onclick = function () { AU.play('click'); openDex('c'); };
  $('dBack').onclick = function () { hide('dex'); show('title'); };
  function dexFull() { var all = D.VILLAINS.concat(D.BOSSES); return all.every(function (k) { return prog.dex[k]; }) && D.CARDS.every(function (c) { return prog.cards[c.id]; }); }

  // 판 시작: 새 장비·새 빌런 소개(그림과 이름만)
  function startStage(s) {
    hideAll(); document.body.classList.remove('ttl'); L1D.resize.last = null; layout();
    L1L.newStage(s, prog.cards); G.phase = 'intro'; G.tool = 'staff'; refresh();
    $('iStage').textContent = 'RUN ' + s;
    $('iZone').textContent = L(D.MAPS[G.zone].name);
    var html = '', newT = D.TORDER.filter(function (k) { return D.TOWERS[k].st === s; }), newE = D.VILLAINS.filter(function (k) { return D.FIRST[k] === s; });
    if (s % 10 === 0) newE.push(D.BOSSES[G.zone]);
    if (newT.length || newE.length) {
      html += '<div class="who">';
      newT.forEach(function (k) { html += '<div><span class="tag">NEW</span><canvas width="88" height="88" data-t="' + k + '"></canvas>' + L(D.TOWERS[k].name) + '</div>'; });
      newE.forEach(function (k) { html += '<div><span class="tag bad">' + (D.ENEMIES[k].boss ? 'BOSS' : '!') + '</span><canvas width="88" height="88" data-e="' + k + '"></canvas>' + L(D.ENEMIES[k].name) + '</div>'; });
      html += '</div>';
    }
    $('iNew').innerHTML = html;
    (function redo(n) { if (L1D.ready()) $('iNew').querySelectorAll('canvas').forEach(function (c) { if (c.dataset.t) L1D.icon(c, c.dataset.t); else L1D.face(c, c.dataset.e); }); else if (n < 100) setTimeout(function () { redo(n + 1); }, 100); })(0);
    show('intro');
  }
  $('iGo').onclick = function () { AU.init(); AU.play('click'); hide('intro'); G.phase = 'build'; refresh(); };

  // 카드 셋: 뒤집힌 채 펼쳐지고 하나씩 열린다(금테는 빛이 먼저 샌다). 하나 고르면 쌓인다
  function drawCards(boss) {
    var pool = D.CARDS.filter(function (c) { return (prog.cards[c.id] || 0) < c.max; }), out = [];
    for (var i = 0; i < 3 && pool.length; i++) {
      var gold = pool.filter(function (c) { return c.g; }), norm = pool.filter(function (c) { return !c.g; });
      var wantGold = (boss && i === 0) || Math.random() < 0.08;
      var from = wantGold && gold.length ? gold : norm.length ? norm : gold;
      var c = from[(Math.random() * from.length) | 0]; out.push(c); pool.splice(pool.indexOf(c), 1);
    }
    return out;
  }
  function openPick(then) {
    var list = drawCards(G.stage % 10 === 0);
    if (!list.length) { then(); return; }
    $('pTitle').textContent = 'CARD'; var box = $('cards'); box.innerHTML = ''; $('pBtns').innerHTML = '';
    var picked = false;
    list.forEach(function (c, i) {
      var el = document.createElement('div'); el.className = 'card' + (c.g ? ' gold' : '');
      var cnt = prog.cards[c.id] || 0;
      el.innerHTML = '<div class="b"></div><div class="f"><div class="cnt">' + (c.max > 1 ? (cnt + 1) + '/' + c.max : '') + '</div><div class="nm">' + L(c.name) + '</div><div class="v">' + L(c.v) + '</div></div>';
      setTimeout(function () { el.classList.add('open'); AU.play(c.g ? 'gold' : 'card'); fitText(); }, 450 + i * 520 + (c.g ? 500 : 0));
      el.onclick = function () {
        if (picked || !el.classList.contains('open')) return; picked = true;
        prog.cards[c.id] = cnt + 1; save(); AU.play(c.g ? 'gold' : 'card');
        box.querySelectorAll('.card').forEach(function (o) { if (o !== el) o.classList.add('dim'); }); el.classList.add('pick');
        setTimeout(function () { hide('pick'); then(); }, 900);
      };
      box.appendChild(el);
    });
    show('pick');
  }

  window.L1 = {
    clear: function () {
      G.phase = 'won'; refresh(); var st = G.warn === 0 ? 3 : G.warn <= 2 ? 2 : 1;
      if (!prog.stars[G.stage] || prog.stars[G.stage] < st) prog.stars[G.stage] = st;
      if (G.stage >= prog.max) prog.max = Math.min(D.STAGES, G.stage + 1);
      Object.keys(G.dex || {}).forEach(function (k) { prog.dex[k] = 1; });
      save(); AU.play('clear');
      var s = G.stage;
      setTimeout(function () {
        openPick(function () {
          if (s >= D.STAGES) { ending(); return; }
          $('rTitle').textContent = 'CLEAR';
          $('rStars').innerHTML = '<span>' + '★'.repeat(st) + '</span><span class="off">' + '★'.repeat(3 - st) + '</span>';
          $('rInfo').textContent = L('검거') + ' ' + G.caught;
          var b = $('rBtns'); b.innerHTML = '';
          mkBtn(b, 'btn', 'HOME', function () { hide('result'); toTitle(); });
          mkBtn(b, 'btn', 'RETRY', function () { hide('result'); startStage(s); });
          mkBtn(b, 'btn main', 'NEXT', function () { hide('result'); startStage(s + 1); });
          show('result');
        });
      }, 800);
    },
    fail: function () {
      G.phase = 'lost'; AU.play('fail'); refresh();
      Object.keys(G.dex || {}).forEach(function (k) { prog.dex[k] = 1; }); save();
      $('rTitle').textContent = 'GAME OVER'; $('rStars').innerHTML = ''; $('rInfo').textContent = L('민원') + ' ' + G.escaped;
      var b = $('rBtns'); b.innerHTML = '';
      mkBtn(b, 'btn', 'HOME', function () { hide('result'); toTitle(); });
      mkBtn(b, 'btn main', 'RETRY', function () { hide('result'); startStage(G.stage); });
      show('result');
    }
  };
  // 엔딩: 텅 빈 막차에 혼자 앉아 퇴근하는 보안관. 도감 100% 면 빌런들이 얌전히 같이 앉아 간다
  function ending() {
    var full = dexFull();
    $('rTitle').textContent = 'THE END'; $('rStars').innerHTML = '';
    $('rInfo').innerHTML = '<canvas id="endCv" class="endcv" width="300" height="180"></canvas>' + L('70판 근무 완료') + ' ' + L(D.RANKS[6]);
    var b = $('rBtns'); b.innerHTML = ''; mkBtn(b, 'btn main', 'HOME', function () { hide('result'); toTitle(); });
    show('result');
    var c = document.getElementById('endCv'), x = c.getContext('2d'), m = L1_MAP.bake(0); x.imageSmoothingEnabled = false;
    var t0 = performance.now();
    (function anim() {
      if (!document.getElementById('endCv')) return;
      var t = (performance.now() - t0) / 1000;
      x.fillStyle = '#0b0e1c'; x.fillRect(0, 0, 300, 180);
      for (var i = 0; i < 14; i++) { var lx = ((i * 53 - t * 25) % 340 + 340) % 340 - 20; x.fillStyle = '#ffd76a'; x.fillRect(Math.round(lx), 14 + (i % 3) * 3, 2, 2); }
      x.drawImage(m.cv, 96, 0, 300, 180, 0, 0, 300, 180);
      x.fillStyle = 'rgba(20,24,60,.25)'; x.fillRect(0, 0, 300, 180);
      // 보안관(가운데 좌석), 빌런들은 양옆
      var seat = [[150, 60, 'g_guard', 0]];
      if (full) { var v = D.VILLAINS.concat(D.BOSSES.slice(0, 6)); v.forEach(function (k, i) { var col = i % 11, row = (i / 11) | 0; if (col === 5) return; seat.push([18 + col * 26, 60 + row * 70, D.ENEMIES[k].spr, D.ENEMIES[k].hiker ? 8 + (i % 4) : D.ENEMIES[k].bird ? 10 : 0]); }); }
      seat.forEach(function (s) { var A = L1_ATLAS[s[2]]; if (!A) return; var im = endImg; if (!im.complete) return; var r = A[5] || 1; x.drawImage(im, A[0] + (s[3] % A[4]) * A[2] * r, A[1], A[2] * r, A[3] * r, Math.round(s[0] - A[2] / 2), Math.round(s[1] - A[3] + (((t * 2 + s[0]) | 0) % 9 === 0 ? 1 : 0)), A[2], A[3]); });
      requestAnimationFrame(anim);
    })();
  }
  var endImg = new Image(); endImg.src = 'img/atlas.png?v=6';

  // 반복
  function tick(dt) {
    if (G.phase === 'title') {
      G.t += dt; G.scroll += dt * 150;
      G.enemies.forEach(function (e) { e.fr += dt * 3; if (Math.random() < dt * 0.4) { e.dir = Math.random() < 0.5 ? 2 : 3; e.face = e.dir; } });
      for (var k in G.towers) { var tw = G.towers[k]; tw.ang += dt; if (Math.random() < dt * 0.5) tw.dir = (Math.random() * 4) | 0; }
    } else if (!G.paused && G.phase !== 'intro') {
      var n = G.spd; while (n-- > 0) L1L.step(dt);
    }
    if (G.phase === 'build' || G.phase === 'wave') {
      if (tick.u === undefined || (tick.u += dt) > 0.15 || tick.ph !== G.phase + G.slot) { tick.u = 0; tick.ph = G.phase + G.slot; refresh(); }
    }
  }
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    tick(dt); L1D.frame(G.tool && (G.phase === 'build' || G.phase === 'wave') ? hover : null);
    requestAnimationFrame(loop);
  }
  window.__fk = { tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) tick(dt || 1 / 60); L1D.frame(hover); }, G: G, prog: prog, startStage: startStage, toTitle: toTitle, openRoute: openRoute, openDex: openDex, ending: ending };
  toTitle(); refresh();
  requestAnimationFrame(loop);
})();
