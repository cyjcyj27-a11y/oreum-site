/* 딱지치기 — 진행 */
(function () {
  var S = DDKScene, PH = DDKPhys, A = DDKAudio, D = DDK, PA = DDKPaper;
  var $ = function (id) { return document.getElementById(id); };
  var TY = D.TYPES, BY = D.BYID, EN = window.LANG === 'en';
  S.init($('cv'));
  function nm(t) { return EN ? t.en : t.ko; }
  function onm(o) { return EN ? o.en : o.ko; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function randn() { return (Math.random() + Math.random() + Math.random() - 1.5) / 0.5; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  // ── 저장 ──
  var SV = { cl: 0, own: ['red'], seen: ['red'], eq: 'red' };
  try { var sv = JSON.parse(localStorage.getItem('ddakji.prog') || 'null'); if (sv && sv.own) SV = sv; } catch (e) {}
  function save() { try { localStorage.setItem('ddakji.prog', JSON.stringify(SV)); } catch (e) {} }
  function addSeen(id) { if (SV.seen.indexOf(id) < 0) SV.seen.push(id); }
  function addOwn(id) { if (SV.own.indexOf(id) < 0) SV.own.push(id); addSeen(id); var a = BY[id], c = BY[SV.eq]; if (a.W + a.K > c.W + c.K) SV.eq = id; }

  // ── 상태 ──
  var mode = 'title', paused = false, M = null, timeScale = 1, slowT = 0, acc = 0;
  var pairs = [], tweens = [], timers = [];
  function later(s, fn) { timers.push({ t: s, fn: fn }); }
  function pair(t, x, z, flipped, yaw) {
    var p = PH.spawn(x, z, flipped, yaw); var m = S.makeDdakji(t);
    var o = { p: p, m: m, t: t }; pairs.push(o); sync(o); return o;
  }
  function unpair(o, keepMesh) { if (!o) return; PH.kill(o.p); o.p = null; var i = pairs.indexOf(o); if (i >= 0) pairs.splice(i, 1); if (!keepMesh) S.remove(o.m); }
  function clearAll() { titleMs.forEach(function (m) { S.remove(m); }); titleMs = []; titleD = null; pairs.slice().forEach(function (o) { unpair(o); }); tweens.forEach(function (w) { S.remove(w.m); }); tweens = []; timers = []; }
  function sync(o) { if (!o.p) return; var t = o.p.b.translation(), r = o.p.b.rotation(); o.m.position.set(t.x, t.y, t.z); o.m.quaternion.set(r.x, r.y, r.z, r.w); }
  // 메쉬만 날려 보내기(딴 딱지가 더미로 가는 것)
  function flyAway(o, tx, ty, tz, dur) {
    unpair(o, true);
    tweens.push({ m: o.m, a: o.m.position.clone(), b: new THREE.Vector3(tx, ty, tz), q: o.m.quaternion.clone(), t: 0, d: dur || 0.7 });
  }
  // ── 화면 글 ──
  var bubT = 0;
  function say(txt, s) { var b = $('bub'); b.textContent = txt; b.classList.add('on'); bubT = s || 1.6; }
  function big(txt, cls) { var b = $('big'); b.textContent = txt; b.className = ''; void b.offsetWidth; b.className = 'on ' + (cls || ''); }
  function show(id) { ['map', 'pick', 'bag', 'dex', 'pause', 'over', 'end'].forEach(function (k) { $(k).classList.toggle('hide', k !== id); }); }
  function hud(on) { $('topbar').classList.toggle('hide', !on); $('mine').classList.toggle('hide', !on); }
  function pips(el, list) { el.innerHTML = list.map(function (t) { return '<i' + (t.gone ? ' class="gone"' : '') + ' style="background-image:url(' + PA.thumb(t.t) + ')"></i>'; }).join(''); }
  function drawHud() {
    if (!M) return;
    var o = M.opp;
    $('stgN').textContent = (o.place + 1) + '-' + (o.i % 6 + 1);
    $('oppN').textContent = onm(o);
    pips($('oppP'), o.deck.map(function (id, i) { return { t: BY[id], gone: i < M.idx }; }));
    var my = []; for (var i = 0; i < 5; i++) my.push({ t: BY[SV.eq], gone: i >= M.lives });
    pips($('mineP'), my);
    $('opp').classList.toggle('turn', M.turn === 'cpu'); $('mine').classList.toggle('turn', M.turn === 'me');
  }
  // ── 판 ──
  var HOVER_Z = 2.25;
  function startMatch(oi) {
    clearAll(); show(null); hud(true); mode = 'play'; paused = false;
    var o = D.OPP[oi], pl = D.PLACES[o.place];
    S.setPlace(pl); PH.reset(pl.fr);
    M = { oi: oi, opp: o, pl: pl, idx: 0, lives: 5, turn: 'me', phase: 'idle', tgt: null, thr: null, t: 0 };
    o.deck.forEach(addSeen); save();
    S.prewarm(o.deck.map(function (id) { return BY[id]; }).concat([BY[SV.eq]]));
    if (window.OG) try { OG.start({ stage: oi + 1 }); } catch (e) {}
    setupTurn('me', true);
    A.rustle();
  }
  function setupTurn(who, first) {
    M.turn = who; M.phase = 'settle'; M.hit = false; M.t = 0;
    if (M.tgt) unpair(M.tgt); if (M.thr) unpair(M.thr);
    var tt = who === 'me' ? BY[M.opp.deck[M.idx]] : BY[SV.eq];
    M.tgt = pair(tt, 0, 0, false, rnd(-0.12, 0.12));
    M.tgt.p.b.setTranslation({ x: 0, y: 0.5, z: 0 }, true);   // 살짝 위에서 떨어뜨려 깔기
    later(0.12, function () { A.tap(); });
    M.thr = null;
    if (who === 'me') { M.thr = pair(BY[SV.eq], 0, HOVER_Z, false, 0); PH.hold(M.thr.p, 0, 0.55, HOVER_Z, 0, 0, 0); }
    else later(first ? 0.6 : 0.9, cpuAim);
    drawHud();
  }
  // 바람 세기: 내 딱지 가장자리와 상대 딱지 가장자리 틈이 살짝(0.05) 벌어졌을 때 가장 세다
  function blastOf(thrPos, tgt, p, Wt, Kd, air) {
    var tp = tgt.p.b.translation(), r = tgt.p.b.rotation();
    var q = new THREE.Quaternion(r.x, r.y, r.z, r.w), inv = q.clone().invert();
    var d = new THREE.Vector3(thrPos.x - tp.x, 0, thrPos.z - tp.z).applyQuaternion(inv);
    var ax = Math.abs(d.x) > Math.abs(d.z), a = ax ? Math.abs(d.x) : Math.abs(d.z), l = ax ? d.z : d.x;
    var g = a - 1.0;
    var qq = Math.exp(-Math.pow((g - 0.05) / 0.34, 2));
    if (g < -0.1) qq *= Math.exp(-Math.pow((g + 0.1) / 0.16, 2));
    if (Math.abs(l) > 0.5) qq *= Math.exp(-Math.pow((Math.abs(l) - 0.5) / 0.3, 2));
    var e = qq * (0.55 + 0.85 * p) * Math.pow(Wt / Kd, 0.6) * air * rnd(0.9, 1.1);
    var nL = ax ? new THREE.Vector3(Math.sign(d.x), 0, 0) : new THREE.Vector3(0, 0, Math.sign(d.z));
    var tL = ax ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    var pt = nL.clone().multiplyScalar(0.5).add(tL.multiplyScalar(clamp(l, -0.4, 0.4))).applyQuaternion(q);
    var nW = nL.applyQuaternion(q); nW.y = 0; nW.normalize();
    return { e: e, q: qq, g: g, pt: { x: tp.x + pt.x, y: tp.y - PH.H / 2, z: tp.z + pt.z }, n: nW };
  }
  function impact() {
    if (M.hit) return; M.hit = true; M.phase = 'wait'; M.t = 0;
    var P = M.thr.p.b.translation(), tW = M.thr.t, tK = M.tgt.t;
    var B = blastOf(P, M.tgt, M.p, tW.W, tK.K, M.pl.air);
    var F = B.e < 1 ? 3.7 * B.e : 4.55 + Math.min(B.e - 1, 1) * 0.55;
    M.blast = B; M.F = F;
    if (F > 0.15) PH.impulseAt(M.tgt.p, -B.n.x * F * 0.2, F, -B.n.z * F * 0.2, B.pt.x, B.pt.y, B.pt.z);
    if (B.e >= 1) PH.ghost(M.thr.p);
    S.puff(P.x, P.z, M.p); S.shake(0.06 + M.p * 0.16); A.slap(M.p);
    if (B.e > 0.72) { timeScale = 0.38; slowT = 0.85; later(0.12, function () { A.whoosh(); }); }
    if (navigator.vibrate) try { navigator.vibrate(18 + M.p * 30); } catch (e) {}
  }
  function judge() {
    var flipped = PH.up(M.tgt.p) < 0;
    M.phase = 'done';
    var o = M.opp, tk = D.TALK[o.talk][EN ? 'en' : 'ko'];
    if (M.turn === 'me') {
      if (flipped) {
        var won = M.tgt; M.tgt = null; addOwn(won.t.id); save();
        flyAway(won, -6, 0.5, 4.2, 0.8);
        A.flip(); big(won.t.rare ? 'WOW!' : 'FLIP!', won.t.rare ? 'gold' : ''); say(tk[2][Math.random() * 2 | 0]);
        M.idx++; drawHud();
        if (M.idx >= o.deck.length) later(1.2, clearMatch);
        else later(1.5, function () { if (M.thr) flyAway(M.thr, 0, 0.5, 6, 0.5); M.thr = null; later(0.45, function () { setupTurn('cpu'); }); });
      } else {
        A.miss(); say(tk[1][Math.random() * 2 | 0]);
        later(1.3, function () { if (M.tgt) flyAway(M.tgt, 0, 0.5, -6, 0.5); M.tgt = null; if (M.thr) flyAway(M.thr, 0, 0.5, 6, 0.5); M.thr = null; later(0.45, function () { setupTurn('cpu'); }); });
      }
    } else {
      if (flipped) {
        M.lives--; var lost = M.tgt; M.tgt = null; flyAway(lost, 4, 0.5, -6, 0.7);
        A.lose(); S.shake(0.12); drawHud();
        if (M.lives <= 0) later(1.0, gameOver);
        else later(1.4, function () { if (M.thr) flyAway(M.thr, 0, 0.5, -6, 0.5); M.thr = null; later(0.4, function () { setupTurn('me'); }); });
      } else {
        A.tap();
        later(1.0, function () { if (M.tgt) flyAway(M.tgt, 0, 0.5, 6, 0.5); M.tgt = null; if (M.thr) flyAway(M.thr, 0, 0.5, -6, 0.5); M.thr = null; later(0.45, function () { setupTurn('me'); }); });
      }
    }
  }
  // ── 던지기 ──
  var PERIOD = 1.25;
  function powerAt(t) { return 0.5 - 0.5 * Math.cos(t / PERIOD * Math.PI * 2); }
  function hoverY(p) { return 0.5 + p * 1.9; }
  function release(aim, p) {
    var sig = 0.04 + 0.22 * p * p, a = Math.random() * 6.283, r = sig * Math.sqrt(Math.random());
    var land = { x: aim.x + Math.cos(a) * r, z: aim.z + Math.sin(a) * r };
    var cur = M.thr.p.b.translation(), y = Math.max(0.2, cur.y - PH.H), vy = 4 + p * 12, G = PH.G;
    var tf = (Math.sqrt(vy * vy + 2 * G * y) - vy) / G;
    M.p = p; M.phase = 'fly'; M.t = 0; M.land = land;
    PH.drop(M.thr.p, vy);
    M.thr.p.b.setLinvel({ x: (land.x - cur.x) / tf, y: -vy, z: (land.z - cur.z) / tf }, true);
    M.thr.p.b.setAngvel({ x: rnd(-0.3, 0.3), y: rnd(-0.4, 0.4), z: rnd(-0.3, 0.3) }, true);
    $('gauge').classList.remove('on');
    A.whoosh();
  }
  // ── 내 차례 입력 ──
  var aim = null, chT = 0, down = false;
  function clampAim(g) { return { x: clamp(g.x, -3.2, 3.2), z: clamp(g.z, -2.2, 2.4) }; }
  var cv = $('cv');
  cv.addEventListener('pointerdown', function (e) {
    A.init();
    if (mode !== 'play' || paused || !M || M.turn !== 'me' || M.phase !== 'idle') return;
    var g = S.groundAt(e.clientX, e.clientY); if (!g) return;
    down = true; aim = clampAim(g); chT = 0; M.phase = 'charge';
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    $('gauge').classList.add('on'); A.rustle();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!down || !M || M.phase !== 'charge') return;
    var g = S.groundAt(e.clientX, e.clientY); if (g) aim = clampAim(g);
  });
  function up() {
    if (!down) return; down = false;
    if (!M || M.phase !== 'charge') return;
    release(aim, powerAt(chT));
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  // ── 상대 차례 ──
  function cpuAim() {
    if (!M || mode !== 'play') return;
    var o = M.opp, sk = o.skill, tk = D.TALK[o.talk][EN ? 'en' : 'ko'];
    M.thr = pair(BY[o.deck[M.idx]], 0, -3.2, false, 0);
    PH.hold(M.thr.p, 0, 0.6, -3.2, 0, 0, 0);
    var dirs = [[0, -1], [1, 0], [-1, 0], [0, 1]], dd = dirs[Math.random() < 0.55 ? 0 : 1 + (Math.random() * 3 | 0)];
    var err = 0.05 + (1 - sk) * 0.32, gap = 1.05 + randn() * err, lat = randn() * err * 0.9;
    var tp = M.tgt.p.b.translation();
    var aimP = { x: tp.x + dd[0] * gap + (dd[0] ? 0 : lat), z: tp.z + dd[1] * gap + (dd[1] ? 0 : lat) };
    var p = clamp(0.5 + sk * 0.38 + randn() * 0.1, 0.3, 1);
    M.cpu = { aim: aimP, p: p, t: 0, from: { x: 0, z: -3.2 } };
    M.phase = 'cpu';
    say(tk[0][Math.random() * 2 | 0], 1.2);
  }
  // ── 고리 ──
  var mark = S.aimMark(), gI = $('gaugeI'), last = performance.now(), rt = 0;
  function onHit(h1, h2) {
    if (!M || !M.thr || !M.thr.p || M.phase !== 'fly') return;
    var hc = M.thr.p.c.handle; if (h1 === hc || h2 === hc) impact();
  }
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    tick(dt);
    requestAnimationFrame(frame);
  }
  function tick(dt, nr) {
    rt += dt;
    if (!paused) {
      for (var i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { var f = timers[i].fn; timers.splice(i, 1); f(); } }
      if (bubT > 0) { bubT -= dt; if (bubT <= 0) $('bub').classList.remove('on'); }
      if (slowT > 0) { slowT -= dt; if (slowT <= 0) timeScale = 1; }
      if (mode === 'play' && M) update(dt);
      if (PH.ready && (mode === 'play' || mode === 'end')) {
        acc += dt * timeScale; var n = 0;
        while (acc >= 1 / 120 && n < 10) { PH.step(onHit); acc -= 1 / 120; n++; }
        if (n >= 10) acc = 0;
      }
      for (var j = tweens.length - 1; j >= 0; j--) { var w = tweens[j]; w.t += dt / w.d; var k = Math.min(1, w.t), e = 1 - Math.pow(1 - k, 3);
        w.m.position.lerpVectors(w.a, w.b, e); w.m.position.y += Math.sin(k * Math.PI) * 1.4; w.m.rotation.y += dt * 4;
        if (k >= 1) { S.remove(w.m); tweens.splice(j, 1); } }
      pairs.forEach(sync);
      if (mode === 'title' && titleD) { titleD.position.set(-1.25, 1.35 + Math.sin(rt * 1.6) * 0.12, 0.9); titleD.rotation.set(Math.sin(rt * 1.1) * 0.12, 0.5, 0.25 + Math.sin(rt * 1.3) * 0.08, 'YXZ'); }
    }
    if (!nr) S.render(dt);
  }
  function update(dt) {
    M.t += dt;
    mark.visible = M.phase === 'charge';
    if (M.phase === 'settle' && M.t > 0.55) M.phase = 'idle';
    if (M.turn === 'me' && (M.phase === 'idle' || M.phase === 'settle') && M.thr) PH.hold(M.thr.p, 0, 0.55 + Math.sin(rt * 2.4) * 0.05, HOVER_Z, Math.sin(rt * 1.7) * 0.05, Math.sin(rt * 1.3) * 0.05, 0);
    if (M.phase === 'charge') {
      chT += dt; var p = powerAt(chT); gI.style.height = 'calc((100% - 8px) * ' + p.toFixed(3) + ')';
      PH.hold(M.thr.p, aim.x, hoverY(p), aim.z, Math.sin(rt * 9) * 0.03 * p, Math.cos(rt * 8) * 0.03 * p, 0);
      mark.position.set(aim.x, 0.004, aim.z);
    }
    if (M.phase === 'cpu') {
      var c = M.cpu; c.t += dt;
      var k = clamp(c.t / 0.7, 0, 1), e = k * k * (3 - 2 * k), ch = clamp((c.t - 0.8) / 0.65, 0, 1);
      var x = c.from.x + (c.aim.x - c.from.x) * e, z = c.from.z + (c.aim.z - c.from.z) * e;
      PH.hold(M.thr.p, x, 0.6 + (hoverY(c.p) - 0.6) * ch * ch, z, 0, 0, 0);
      if (c.t > 1.6) { M.thr.p.b.setTranslation({ x: c.aim.x, y: hoverY(c.p), z: c.aim.z }, true); release(c.aim, c.p); }
    }
    if (M.phase === 'fly' && M.t > 2) impact();
    if (M.phase === 'wait') {
      var u = PH.up(M.tgt.p), still = PH.sleeping(M.tgt.p) && PH.sleeping(M.thr.p);
      if ((M.t > 0.8 && still && Math.abs(u) > 0.4) || M.t > 5) {
        if (Math.abs(u) < 0.4 && !M.nudged) { M.nudged = true; M.t = 3.6; PH.impulseAt(M.tgt.p, 0, 0.3, 0, M.tgt.p.b.translation().x + 0.3, 0, M.tgt.p.b.translation().z); return; }
        M.nudged = false; judge();
      }
    }
  }
  // ── 판 끝 ──
  function clearMatch() {
    if (window.OG) try { OG.over({ result: 'WIN', score: M.oi + 1 }); } catch (e) {}
    A.clear(); big('CLEAR', 'gold');
    var first = SV.cl <= M.oi; SV.cl = Math.max(SV.cl, M.oi + 1); save();
    if (M.oi === D.OPP.length - 1) { later(1.8, ending); return; }
    later(1.6, function () { openPick(M.opp.place); });
  }
  function gameOver() { if (window.OG) try { OG.over({ result: 'LOSE', score: M.oi + 1 }); } catch (e) {}
    A.over(); mode = 'over'; show('over'); hud(false); }
  // 카드 셋: 대부분 보통, 가끔 금테. 못 본 것이 더 잘 나온다
  function draw3(place) {
    var out = [], pool = TY.filter(function (t) { return t.rare < 2; });
    for (var k = 0; k < 3; k++) {
      var gold = Math.random() < 0.03 + place * 0.015;
      var cand = pool.filter(function (t) { return (gold ? t.rare === 1 : t.rare === 0) && out.indexOf(t) < 0; });
      var wsum = 0, ws = cand.map(function (t) { var w = SV.seen.indexOf(t.id) < 0 ? 3 : SV.own.indexOf(t.id) < 0 ? 1.6 : 0.5; wsum += w; return w; });
      var r = Math.random() * wsum, i = 0; while (r > ws[i]) { r -= ws[i]; i++; }
      out.push(cand[Math.min(i, cand.length - 1)]);
    }
    return out;
  }
  function barsHtml(t) {
    return '<div class="bars"><span>' + L('무게') + '</span><s><i style="width:' + Math.round(t.W / 1.9 * 100) + '%"></i></s><span>' + L('두께') + '</span><s class="k"><i style="width:' + Math.round(t.K / 1.9 * 100) + '%"></i></s></div>';
  }
  var picked = false;
  function openPick(place) {
    mode = 'pick'; hud(false); show('pick'); picked = false; $('bPickOk').classList.add('hide');
    var list = draw3(place), box = $('cards'), opened = 0; box.innerHTML = '';
    list.forEach(function (t, i) {
      var isNew = SV.seen.indexOf(t.id) < 0;
      var d = document.createElement('div'); d.className = 'card' + (t.rare ? ' gold' : '') + (isNew ? ' new' : '');
      d.innerHTML = '<div class="b"></div><div class="f"><img src="' + PA.thumb(t) + '"><div class="n">' + nm(t) + '</div>' + barsHtml(t) + '</div>';
      box.appendChild(d);
      setTimeout(function () { d.classList.add('open'); opened++; if (t.rare) A.gold(); else A.card(); addSeen(t.id); save(); }, 450 + i * 380 + (t.rare ? 300 : 0));
      d.addEventListener('click', function () {
        if (picked || opened < 3) return; picked = true; A.click();
        addOwn(t.id); save();
        Array.prototype.forEach.call(box.children, function (c) { if (c !== d) c.classList.add('dimmed'); });
        d.style.transform = 'rotateY(180deg) translateY(-6px) scale(1.04)';
        $('bPickOk').classList.remove('hide');
      });
    });
  }
  // ── 지도·가방·도감 ──
  function openMap() {
    mode = 'map'; paused = false; hud(false); show('map'); $('gauge').classList.remove('on'); mark.visible = false;
    var h = '';
    D.PLACES.forEach(function (pl, pi) {
      h += '<div class="pl"><h3>' + L(pl.ko, pl.en) + '</h3>';
      D.OPP.filter(function (o) { return o.place === pi; }).forEach(function (o) {
        var lock = o.i > SV.cl, cls = 'kid' + (o.boss ? ' boss' : '') + (lock ? ' lock' : '') + (o.i < SV.cl ? ' won' : '') + (o.i === SV.cl ? ' next' : '');
        var t = BY[o.deck[o.deck.length - 1]];
        h += '<button class="' + cls + '" data-i="' + o.i + '"><img src="' + PA.thumb(t) + '"><span>' + (lock ? '? ? ?' : onm(o)) + '</span></button>';
      });
      h += '</div>';
    });
    $('places').innerHTML = h;
  }
  $('places').addEventListener('click', function (e) {
    var b = e.target.closest('.kid'); if (!b || b.classList.contains('lock')) return;
    A.init(); A.click(); var i = +b.dataset.i; whenReady(function () { startMatch(i); });
  });
  function openBag() {
    show('bag'); var h = '';
    SV.own.forEach(function (id) { var t = BY[id];
      h += '<button class="it' + (t.rare ? ' gold' : '') + (id === SV.eq ? ' eq' : '') + '" data-id="' + id + '"><img src="' + PA.thumb(t) + '"><span>' + nm(t) + '</span>' + barsHtml(t) + '</button>'; });
    $('bagG').innerHTML = h;
  }
  $('bagG').addEventListener('click', function (e) { var b = e.target.closest('.it'); if (!b) return; SV.eq = b.dataset.id; save(); A.tap(); openBag(); });
  function openDex() {
    show('dex'); var h = '', n = 0;
    TY.forEach(function (t) { var s = SV.seen.indexOf(t.id) >= 0; if (s) n++;
      h += '<div class="it' + (s ? (t.rare ? ' gold' : '') : ' unk') + '"><img src="' + PA.thumb(t) + '"><span>' + (s ? nm(t) : '?') + '</span></div>'; });
    $('dexG').innerHTML = h; $('dexN').textContent = n + ' / ' + TY.length;
  }
  // ── 엔딩: 모은 딱지가 바닥에 쏟아진다 ──
  function ending() {
    mode = 'end'; hud(false); clearAll(); M = null;
    S.setPlace(D.PLACES[3]); PH.reset(0.7);
    var full = SV.seen.length >= TY.length;
    var list = SV.own.slice(); var k = 0;
    (function rain() {
      if (mode !== 'end' || k >= list.length * 2) return;
      var t = BY[list[k % list.length]]; k++;
      var o = pair(t, rnd(-3, 3), rnd(-2, 2), Math.random() < 0.5, rnd(0, 6)); o.p.b.setTranslation({ x: rnd(-3, 3), y: rnd(3, 6), z: rnd(-2, 2) }, true);
      o.p.b.setAngvel({ x: rnd(-4, 4), y: rnd(-4, 4), z: rnd(-4, 4) }, true);
      if (k % 3 === 0) A.tap();
      setTimeout(rain, 110);
    })();
    if (full) setTimeout(function () { var o = pair(BY.king, 0, 0, false, 0); o.p.b.setTranslation({ x: 0, y: 7, z: 0.3 }, true); A.gold(); big(L('딱지왕'), 'gold'); }, 3200);
    setTimeout(function () { A.clear(); show('end'); $('endH').textContent = full ? L('딱지왕') : 'THE END'; var n = SV.seen.length; $('endN').textContent = n + ' / ' + TY.length; }, 4400);
  }
  // ── 타이틀 ──
  var titleD = null, titleMs = [], waitFn = null;
  // 물리 엔진이 아직 오는 중이면 다 온 뒤에 한다(시작 단추는 그동안 숨 쉬듯 깜빡)
  function whenReady(fn) { if (PH.ready) fn(); else { waitFn = fn; var b = $('bStart'); if (b) b.classList.add('wait'); } }
  function physReady() { var b = $('bStart'); if (b) b.classList.remove('wait'); if (waitFn) { var f = waitFn; waitFn = null; f(); } }
  function openTitle() {
    mode = 'title'; clearAll(); M = null; hud(false); show(null); $('title').classList.remove('hide');
    S.setPlace(D.PLACES[0]);
    var m0 = S.makeDdakji(BY.cal); m0.position.set(0.5, PH.H / 2, -0.1); m0.rotation.y = 0.3;
    titleD = S.makeDdakji(BY[SV.eq]); titleMs = [m0, titleD];
    var b = $('tBtns'), started = SV.cl > 0 || SV.own.length > 1;
    b.innerHTML = '<button class="btn" id="bStart">' + (started ? L('이어하기') : L('시작')) + '</button>';
    $('bStart').onclick = function () { A.init(); A.click(); whenReady(function () { $('title').classList.add('hide'); if (started) openMap(); else startMatch(0); }); };
    if (!PH.ready) $('bStart').classList.add('wait');
  }
  // ── 단추 ──
  function on(id, fn) { $(id).addEventListener('click', function (e) { A.init(); A.click(); fn(e); }); }
  on('bBag', openBag); on('bDex', openDex);
  on('bBagX', openMap); on('bDexX', openMap);
  on('bHome', openTitle);
  on('bPickOk', openMap);
  on('tPause', function () { if (mode !== 'play') return; paused = true; show('pause'); });
  on('bResume', function () { paused = false; show(null); last = performance.now(); });
  on('bQuit', function () { clearAll(); M = null; openMap(); });
  on('bRetry', function () { var i = M ? M.oi : SV.cl; startMatch(i); });
  on('bOverMap', function () { clearAll(); M = null; openMap(); });
  on('bEndOk', function () { clearAll(); openMap(); });
  function togs() { $('tBgm').classList.toggle('off', !A.S.bgm); $('tSfx').classList.toggle('off', !A.S.sfx); }
  on('tBgm', function () { A.setBgm(!A.S.bgm); togs(); }); on('tSfx', function () { A.setSfx(!A.S.sfx); togs(); }); togs();
  addEventListener('resize', S.resize);
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && mode === 'play') { paused = !paused; show(paused ? 'pause' : null); } });
  // 시험용
  window.__dk = { get M() { return M; }, SV: SV, startMatch: startMatch, openPick: openPick, ending: ending, openMap: openMap, release: function (a, p) { release(a, p); }, blastOf: blastOf, save: save,
    setT: function (s) { timeScale = s; }, tick: function (n, dt, nr) { for (var i = 0; i < n; i++) tick(dt || 1 / 60, nr); } };
  // ── 시작 ──
  openTitle(); requestAnimationFrame(frame); S.preloadTex();
  PH.init().then(physReady);
})();
