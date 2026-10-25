// 화면 글·단추: 타이틀, HOW TO PLAY, 상단바, 큰 층 숫자, PERFECT, 판 알림, GAME OVER, 엔딩.
(function () {
  const U = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const D = window.DATA;
  const show = (el, on) => { el.hidden = !on; };
  let started = false;
  U.init = function () {
    // 글자(한·영)
    document.querySelectorAll('[data-ko]').forEach((el) => { el.textContent = L(el.dataset.ko, el.dataset.en || el.dataset.ko); });
    document.title = L('쿠키쌓기', 'Cookie Stack');
    U.titleBtns();
    $('bStart').onclick = () => { SND.click(); openModes(); };
    $('modes').addEventListener('pointerdown', (e) => { if (e.target.id === 'modes') show($('modes'), false); });
    $('bRetry').onclick = (e) => { e.stopPropagation(); SND.click(); show($('over'), false); GAME.retry(); };
    $('bHome').onclick = (e) => { e.stopPropagation(); SND.click(); show($('over'), false); toTitle(); };
    $('bEndHome').onclick = () => { SND.click(); show($('end'), false); toTitle(); };
    $('bSave').onclick = () => { SND.click(); CARD.save(); };
    $('bShare').onclick = () => { SND.click(); CARD.share(); };
    $('bHowOk').onclick = () => { SND.click(); show($('how'), false); HOW.close(); GAME.S.save.how = 1; GAME.store(); U.paused = false; if (U.afterHow) { const f = U.afterHow; U.afterHow = null; f(); } };
    $('tHelp').onclick = (e) => { e.stopPropagation(); SND.click(); openHow(null); };
    const tb = $('tBgm'), ts = $('tSfx');
    tb.classList.toggle('off', !SND.bgm); ts.classList.toggle('off', !SND.sfx);
    tb.onclick = (e) => { e.stopPropagation(); SND.setBgm(!SND.bgm); tb.classList.toggle('off', !SND.bgm); };
    ts.onclick = (e) => { e.stopPropagation(); SND.setSfx(!SND.sfx); ts.classList.toggle('off', !SND.sfx); SND.click(); };
    // 누르기: 화면 아무 데나(단추·창 밖)
    const press = (e) => {
      if (!started) { SND.unlock(); started = true; }
      if (e.target.closest && e.target.closest('button,.sheet,#title')) return;
      if (GAME.S.mode === 'play' && !U.paused) { e.preventDefault && e.preventDefault(); GAME.drop(); }
    };
    window.addEventListener('pointerdown', press, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!started) { SND.unlock(); started = true; }
        if (!$('how').hidden) { $('bHowOk').click(); e.preventDefault(); return; }
        if (!$('over').hidden) { $('bRetry').click(); e.preventDefault(); return; }
        if (!$('modes').hidden) { pick(D.mode); e.preventDefault(); return; }
        if (GAME.S.mode === 'title' && !$('title').hidden) { $('bStart').click(); e.preventDefault(); return; }
        if (GAME.S.mode === 'play' && !U.paused) { GAME.drop(); e.preventDefault(); }
      }
      if (e.code === 'KeyM') $('tBgm').click();
      if (e.code === 'KeyK') $('tSfx').click();
    });
  };
  U.titleBtns = function () { $('bStart').querySelector('span').textContent = L('시작', 'START'); };
  // 모드 고르기: 모드마다 이어할 판이 있으면 STAGE n 과 처음부터 단추
  function openModes() {
    const box = $('modeRows'); box.innerHTML = '';
    ['easy', 'normal', 'hard'].forEach((m) => {
      const sl = GAME.slot(m), row = document.createElement('div'); row.className = 'mrow ' + m;
      const b = document.createElement('button'); b.className = 'btn';
      const sub = sl.stage > 0 ? L('이어하기 STAGE ', 'CONTINUE STAGE ') + (sl.stage + 1) : (sl.done ? 'CLEAR' : '');
      b.innerHTML = '<span>' + D.MODES[m].name + (sub ? '<small>' + sub + '</small>' : '') + '</span>';
      b.onclick = () => { SND.click(); pick(m); };
      row.appendChild(b);
      if (sl.stage > 0) { const n = document.createElement('button'); n.className = 'btn cut c2'; n.innerHTML = '<span>' + L('처음부터', 'NEW') + '</span>'; n.onclick = () => { SND.click(); GAME.newGame(m); pick(m); }; row.appendChild(n); }
      box.appendChild(row);
    });
    show($('modes'), true);
  }
  function pick(m) { show($('modes'), false); GAME.setMode(m); begin(GAME.S.save.stage); }
  function openHow(then) { U.paused = true; U.afterHow = then; show($('how'), true); HOW.open(); }
  function begin(si) {
    show($('title'), false);
    const go = () => { document.body.classList.add('playing'); show($('hud'), true); show($('big'), true); GAME.start(si); };
    if (!GAME.S.save.how) openHow(go); else go();
  }
  function toTitle() {
    document.body.classList.remove('playing');
    show($('hud'), false); show($('big'), false); show($('banner'), false);
    GAME.toTitle(); U.titleBtns(); show($('title'), true);
  }
  U.stageStart = function (si) {
    const st = D.STAGES[si];
    $('sMode').textContent = D.M().name;
    $('sNum').textContent = (si + 1) + '/' + D.STAGES.length;
    $('sName').textContent = L(st.ko, st.en);
    U.floor(0, st.n);
    banner('STAGE ' + (si + 1), L(st.ko, st.en), 1300, 'st');
  };
  U.floor = function (k, n) {
    $('bigK').textContent = k; $('bigN').textContent = '/' + n;
    $('fBar').style.transform = 'scaleX(' + (k / n) + ')';
    const b = $('bigK'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  };
  U.perfect = function (c) {
    const p = $('pop');
    p.textContent = c > 1 ? 'PERFECT ×' + c : 'PERFECT';
    p.classList.remove('go'); void p.offsetWidth; p.classList.add('go');
    show(p, true);
  };
  let bt = 0;
  function banner(a, b, ms, cls) {
    const el = $('banner'); el.className = cls || '';
    $('bnA').textContent = a; $('bnB').textContent = b || '';
    show(el, true); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    clearTimeout(bt); bt = setTimeout(() => show(el, false), ms);
  }
  U.stageClear = function () { banner('STAGE CLEAR', '', 1900, 'cl'); };
  U.over = function (k, n) {
    $('oK').textContent = k + ' / ' + n;
    $('oSt').textContent = D.M().name + ' · STAGE ' + (GAME.S.si + 1);
    show($('over'), true);
  };
  U.hideHud = function () { show($('hud'), false); show($('big'), false); };
  U.ending = async function () {
    banner('THE END', '', 10, 'cl');
    const url = await CARD.make();
    $('endImg').src = url || '';
    $('endName').textContent = CARD.title(GAME.S.stats);
    show($('end'), true);
    document.body.classList.remove('playing');
  };
  let tt = 0;
  U.toast = function (s) { const t = $('toast'); t.textContent = s; show(t, true); clearTimeout(tt); tt = setTimeout(() => show(t, false), 1600); };
})();
