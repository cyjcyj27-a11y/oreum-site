// 화면 흐름: 타이틀 → 설명 → 판 시작 글 → 플레이 → 다음 판 … → 엔딩
(function () {
  const cv = document.getElementById('cv'), cg = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const SAVE = 'uijeok.save';
  let mode = 'title', save = load(), lvIdx = 0, acc = 0, last = 0, titleT = 0;
  G.gotGems = [];
  function load() { try { return JSON.parse(localStorage.getItem(SAVE)) || null; } catch (e) { return null; } }
  function store() { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) {} }
  const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
  if (isTouch) document.body.classList.add('touch');

  // ---------- 화면 맞추기 ----------
  let view = { x: 0, y: 0, s: 1 };
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    const s = Math.min(cv.width / RND.VW, cv.height / RND.VH);
    view = { s, x: Math.round((cv.width - RND.VW * s) / 2), y: Math.round((cv.height - RND.VH * s) / 2) };
    RND.viewS = s;
  }
  addEventListener('resize', fit); fit();
  function present() {
    cg.imageSmoothingEnabled = false;
    cg.fillStyle = '#0b0710'; cg.fillRect(0, 0, cv.width, cv.height);
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * 3 * view.s; sy = (Math.random() - 0.5) * 3 * view.s; }
    cg.drawImage(RND.lo, view.x + sx, view.y + sy, RND.VW * view.s, RND.VH * view.s);
    const say = G.say;
    if (say) { cg.font = say.px + "px Px,monospace"; cg.textBaseline = 'top'; cg.fillStyle = '#3a2210'; cg.fillText(say.s, Math.round(view.x + sx + say.x * view.s), Math.round(view.y + sy + say.y * view.s)); }
  }

  // ---------- HUD ----------
  function hud() {
    const p = G.pr; if (!p) return;
    let h = ''; for (let i = 0; i < p.maxhp; i++) h += '<i class="pip' + (i < p.hp ? '' : ' off') + '"></i>';
    $('hp').innerHTML = h; $('hLv').textContent = lvIdx + 1; $('hGem').textContent = G.stats.gems;
  }
  G.onHp = hud;
  G.pop = function (s, col, big) { const d = document.createElement('div'); d.className = 'pop' + (big ? ' big' : ''); d.textContent = s; d.style.color = col || '#fff'; $('pops').appendChild(d); setTimeout(() => d.remove(), 1300); };

  // ---------- 판 흐름 ----------
  function startLevel(i, keep) {
    lvIdx = i; G.lvIdx = i; RND.moonX = null;
    const lv = LEVELS[i];
    G.load(lv, keep);
    G.ending = 0;
    save = Object.assign(save || {}, { lv: i, maxhp: keep.maxhp, sword: keep.sword, stats: Object.assign({}, G.stats), gems: G.gotGems.slice() });
    store();
    // 이미 먹은 보석은 지운다
    for (const it of WORLD.state.items) if (it.k === '$' && G.gotGems.includes(i + ':' + it.c + ',' + it.r)) it.got = true;
    mode = 'card'; titleT = 0;
    $('cardA').textContent = 'LEVEL ' + (i + 1); $('cardB').textContent = L(lv.name[0], lv.name[1]); $('card').hidden = false;
    $('hud').hidden = false; document.body.classList.add('playing'); hud();
    AU.music(lv.theme); AU.play('level');
    G.onExit = nextLevel; G.onDeath = died; G.onEnding = ending;
  }
  function nextLevel() {
    fade(() => {
      const keep = { maxhp: G.pr.maxhp, sword: G.pr.sword };
      if (lvIdx + 1 < LEVELS.length) startLevel(lvIdx + 1, keep); else ending();
    });
  }
  function died() { fade(() => { G.respawn(); }); }
  function fade(fn) { const f = $('fade'); f.style.opacity = 1; setTimeout(() => { fn(); f.style.opacity = 0; }, 380); }
  function ending() {
    if (mode === 'end') return;
    setTimeout(async () => {
      mode = 'end';
      save = Object.assign(save || {}, { done: 1 }); store();
      if (window.OG) OG.over({ result: 'WIN', score: G.stats.deaths });
      const url = await CARD.make({ stats: G.stats, lv: lvIdx });
      if (url) $('cardImg').src = url;
      const s = G.stats, m = Math.floor(s.time / 60);
      $('endTxt').innerHTML = L('걸린 시간', 'TIME') + ' ' + m + L('분', ' min') + '<br>' + L('쓰러진 횟수', 'DEATHS') + ' ' + s.deaths + '<br>' + L('엽전', 'COINS') + ' ' + s.gems + '<br>' + L('물리친 적', 'DEFEATED') + ' ' + s.kills;
      $('end').hidden = false;
    }, G.ending ? G.fatherTotal() * 1000 + 700 : 2200);
  }

  // ---------- 타이틀 ----------
  function showTitle() {
    mode = 'title'; $('title').hidden = false; $('hud').hidden = true; $('card').hidden = true; document.body.classList.remove('playing');
    $('bCont').hidden = !(save && save.lv > 0);
    G.load({ name: ['', ''], theme: 'roof', skill: 0, map: ['          ', '          ', '-S--------'] }, { maxhp: 3, sword: 1 }); G.gotGems = []; G.pr.x = 52; G.pr.f = 1; G.pr.titleWind = 1; RND.rx = 0; RND.ry = 0; RND.moonX = 276;
    AU.music('title');
  }
  $('bStart').onclick = () => {
    AU.unlock(); AU.play('click');
    $('title').hidden = true;
    G.stats = { deaths: 0, kills: 0, gems: 0, potions: 0, parries: 0, time: 0 }; G.gotGems = [];
    const go = () => { if (window.OG) OG.start(); startLevel(0, { maxhp: 3, sword: 0 }); };
    if (!(save && save.how)) { save = Object.assign(save || {}, { how: 1 }); store(); HOW.open(go); } else go();
  };
  $('bCont').onclick = () => {
    AU.unlock(); AU.play('click'); $('title').hidden = true;
    G.stats = Object.assign({ deaths: 0, kills: 0, gems: 0, potions: 0, parries: 0, time: 0 }, save.stats || {}); G.gotGems = (save.gems || []).slice();
    if (window.OG) OG.start();
    startLevel(save.lv, { maxhp: save.maxhp || 3, sword: save.sword });
  };
  // ---------- 토글 ----------
  const tg = (el, on) => el.classList.toggle('off', !on);
  tg($('bBgm'), AU.bgm); tg($('bSnd'), AU.sfx);
  $('bBgm').onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); tg($('bBgm'), AU.bgm); };
  $('bSnd').onclick = () => { AU.unlock(); AU.setSfx(!AU.sfx); tg($('bSnd'), AU.sfx); AU.play('click'); };
  $('bHow').onclick = () => { if (mode !== 'play') return; mode = 'how'; HOW.open(() => { mode = 'play'; }); };
  $('bPause').onclick = () => { if (mode !== 'play') return; mode = 'pause'; $('pause').hidden = false; };
  $('pResume').onclick = () => { $('pause').hidden = true; mode = 'play'; };
  $('pRetry').onclick = () => { $('pause').hidden = true; mode = 'play'; G.pr.alive = false; G.respawn(); G.stats.deaths--; };
  $('pTitle').onclick = () => { $('pause').hidden = true; showTitle(); };
  $('endOk').onclick = () => { $('end').hidden = true; showTitle(); };
  $('cSave').onclick = () => CARD.save();
  $('cShare').onclick = () => CARD.share();
  $('bRot').onclick = () => { if (window.OL && OL.go) OL.go(); else { try { document.documentElement.requestFullscreen().then(() => screen.orientation.lock('landscape')).catch(() => {}); } catch (e) {} } };

  // ---------- 입력 ----------
  addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (mode === 'play') $('bPause').onclick(); else if (mode === 'pause') $('pResume').onclick(); return; }
    if (mode === 'title' && (e.code === 'Enter' || e.code === 'Space')) { $('bStart').onclick(); e.preventDefault(); return; }
    if (G.key(e.code, true)) e.preventDefault();
  });
  addEventListener('keyup', (e) => G.key(e.code, false));
  addEventListener('blur', () => { for (const k of ['l', 'r', 'u', 'd', 'atk', 'blk', 'jmp']) G.press(k, false); ST.id = null; stickSet(0, 0); });
  // 원형 조이스틱: 왼쪽 아래 구석 어디를 눌러도 받침 가운데 기준으로 방향을 읽는다(손을 떼면 손잡이 제자리)
  const ST = { id: null, on: { l: 0, r: 0, u: 0, d: 0 } };
  function stickSet(dx, dy) {
    const sb = $('stick').getBoundingClientRect(), R = sb.width / 2;
    let vx = dx / R, vy = dy / R; const m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; }
    const want = { l: vx < -0.35 ? 1 : 0, r: vx > 0.35 ? 1 : 0, u: vy < -0.5 ? 1 : 0, d: vy > 0.55 ? 1 : 0 };
    for (const k in want) if (want[k] !== ST.on[k]) { ST.on[k] = want[k]; G.press(k, !!want[k]); $('a' + k.toUpperCase()).classList.toggle('on', !!want[k]); }
    $('sKnob').style.transform = 'translate(' + (vx * R * 0.62).toFixed(1) + 'px,' + (vy * R * 0.62).toFixed(1) + 'px)';
  }
  function stickAt(e) { const sb = $('stick').getBoundingClientRect(); stickSet(e.clientX - (sb.left + sb.width / 2), e.clientY - (sb.top + sb.height / 2)); }
  const sz = $('szone');
  sz.addEventListener('pointerdown', (e) => { if (ST.id != null) return; AU.unlock(); try { sz.setPointerCapture(e.pointerId); } catch (er) {} ST.id = e.pointerId; $('stick').classList.add('on'); stickAt(e); e.preventDefault(); });
  sz.addEventListener('pointermove', (e) => { if (e.pointerId === ST.id) stickAt(e); });
  const sUp = (e) => { if (e.pointerId !== ST.id) return; ST.id = null; $('stick').classList.remove('on'); stickSet(0, 0); };
  sz.addEventListener('pointerup', sUp); sz.addEventListener('pointercancel', sUp);
  document.querySelectorAll('#acts .ab').forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { AU.unlock(); try { b.setPointerCapture(e.pointerId); } catch (er) {} G.press(k, true); b.classList.add('on'); e.preventDefault(); });
    const up = () => { G.press(k, false); b.classList.remove('on'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  });

  // ---------- 타이틀 그림: 제목 글자를 점으로 ----------
  const ttc = (window.TITLEPIX = document.createElement('canvas')); ttc.width = 320; ttc.height = 80;
  let ttReady = false;
  function makeTitle() {
    const t = ttc.getContext('2d'), s = L('달빛 의적', 'MOONLIT OUTLAW');
    t.clearRect(0, 0, 320, 80); t.font = (EN ? 28 : 38) + 'px Ttl, serif'; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillStyle = '#fff'; t.fillText(s, 160, 38);
    const d = t.getImageData(0, 0, 320, 80), a = d.data, m = new Uint8Array(320 * 80);
    for (let i = 0; i < m.length; i++) m[i] = a[i * 4 + 3] > 110 ? 1 : 0;
    for (let y = 0; y < 80; y++) for (let x = 0; x < 320; x++) {
      const i = y * 320 + x, o = i * 4;
      if (m[i]) { const c = y < 30 ? [255, 236, 160] : y < 40 ? [240, 192, 88] : [200, 130, 40]; a[o] = c[0]; a[o + 1] = c[1]; a[o + 2] = c[2]; a[o + 3] = 255; }
      else {
        let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (Math.abs(dx) + Math.abs(dy) <= 3 && xx >= 0 && yy >= 0 && xx < 320 && yy < 80 && m[yy * 320 + xx]) n = 1; }
        if (n) { a[o] = 26; a[o + 1] = 14; a[o + 2] = 18; a[o + 3] = 255; } else a[o + 3] = 0;
      }
    }
    t.putImageData(d, 0, 0); ttReady = true;
  }
  document.fonts.load('38px Ttl').then(makeTitle, makeTitle);

  // ---------- 고리 ----------
  const STEP = 1 / 60;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
    tick(dt);
    requestAnimationFrame(frame);
  }
  function tick(dt) {
    if (mode === 'play' || mode === 'card') {
      if (mode === 'card') { titleT += dt; if (titleT > 1.7) { $('card').hidden = true; mode = 'play'; } }
      acc += dt;
      while (acc >= STEP) { G.update(STEP); acc -= STEP; }
      G.draw(performance.now() / 1000);
    } else if (mode === 'title') {
      titleT += dt; WORLD.update(dt);
      const p = G.pr; p.t += dt;
      G.draw(titleT);
      if (ttReady) RND.g.drawImage(ttc, 0, 4);
    } else if (mode === 'end') {
      acc += dt; while (acc >= STEP) { G.update(STEP); acc -= STEP; } G.draw(performance.now() / 1000);
    }
    present();
  }
  showTitle();
  requestAnimationFrame(frame);
  // 시험용 손잡이
  window.__sp = { G, W: WORLD, tick: (n, dt) => { for (let i = 0; i < n; i++) tick(dt || STEP); }, start: (i, k) => { $('title').hidden = true; startLevel(i || 0, k || { maxhp: 3, sword: 1 }); titleT = 9; }, get mode() { return mode; }, set mode(v) { mode = v; } };
})();