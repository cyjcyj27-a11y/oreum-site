// 언어논리퀴즈 진행: 10파트 x 10문제, 8개 이상 맞히면 그 파트 건물 완성
(function () {
  const $ = id => document.getElementById(id);
  const P = (window.NR && NR.P) || [];
  P.forEach(p => p.qs.forEach(q => { q.a = q.a.map(s => s.replace(/\.$/, '')); }));
  const KIND = { syl: '참·거짓 판단', liar: '거짓말쟁이 찾기', order: '줄 세우기', word: '낱말 관계', arg: '논증 따지기' };
  const PASS = 8, KEY = 'nonri.save', EN = !!NR.EN, T = k => (NR.D && NR.D[k]) || k;
  let S = null, lock = false, combo = 0;
  function fresh() { return { part: 0, qi: 0, ans: [], done: [], t0: Date.now(), ms: 0, best: 0, tries: 0, right: 0, total: 0 }; }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s.part === 'number') return s; } catch (e) {} return null; }
  let lastTick = Date.now();
  function save() { if (!S) return; const n = Date.now(); if (!document.hidden) S.ms += Math.min(60000, n - lastTick); lastTick = n; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  setInterval(() => { if (S && !document.body.classList.contains('ttl')) save(); }, 5000);
  document.addEventListener('visibilitychange', () => { lastTick = Date.now(); });

  // 장면 맞추기
  function timeOf(part, qi) { return Math.min(0.9, (part + qi / 10) / 10 * 0.92); }
  function rebuild() {
    SCN.reset();
    for (let z = 0; z < S.part && z < 10; z++) { SCN.addLand(z, true); for (let i = 0; i < (S.done[z] || PASS); i++) SCN.addProp(z, true); }
    if (S.part < 10) S.ans.forEach(a => { if (a) SCN.addProp(S.part, true); });
    SCN.setTime(S.part >= 10 ? 1 : timeOf(S.part, S.qi), true);
    if (S.part >= 10) { SCN.overview(true); SCN.lightsInstant(); } else SCN.focus(S.part, true);
  }
  function dots() {
    const d = $('dots'); d.innerHTML = '';
    for (let i = 0; i < 10; i++) { const e = document.createElement('i'); if (i < S.ans.length) e.className = S.ans[i] ? 'ok' : 'no'; else if (i === S.qi) e.className = 'cur'; d.appendChild(e); }
  }
  function header() { const p = P[S.part]; $('pno').textContent = S.part + 1; $('pname').textContent = p ? p.name : ''; dots(); }
  function ask() {
    const p = P[S.part], q = p.qs[S.qi];
    lock = false; header();
    $('qno').textContent = EN ? 'Q' + (S.part * 10 + S.qi + 1) : (S.part * 10 + S.qi + 1) + '번'; $('qkind').textContent = T(KIND[q.t] || '');
    $('qtext').textContent = q.q;
    const o = $('opts'); o.innerHTML = '';
    q.a.forEach((t, i) => {
      const b = document.createElement('button'); b.className = 'opt hanji';
      b.innerHTML = '<span class="no">' + (i + 1) + '</span><span></span>'; b.lastChild.textContent = t;
      b.onclick = () => answer(i); o.appendChild(b);
    });
    $('exp').className = ''; $('next').className = '';
    $('panel').scrollTop = 0;
    SCN.pose(S.qi % 3 === 2 ? 'look' : 'think');
    SCN.setTime(timeOf(S.part, S.qi));
    const pb = $('qbox'); pb.style.animation = 'none'; void pb.offsetWidth; pb.style.animation = 'fin .35s ease';
  }
  function praise(t) { const e = $('praise'); e.textContent = t; e.className = ''; void e.offsetWidth; e.className = 'on'; }
  function answer(i) {
    if (lock) return; lock = true;
    const q = P[S.part].qs[S.qi], ok = i === q.c, bs = $('opts').children;
    for (let k = 0; k < bs.length; k++) { bs[k].disabled = true; if (k === q.c) bs[k].classList.add('right'); else if (k === i) bs[k].classList.add('wrong'); else bs[k].classList.add('dim'); }
    S.ans.push(ok); S.total++;
    if (ok) {
      combo++; S.right++; S.best = Math.max(S.best, combo);
      SFX.right(combo - 1); SCN.pose('joy');
      setTimeout(() => { SCN.addProp(S.part); SFX.rise(); }, 260);
      if (combo === 3) praise('NICE'); else if (combo === 5) praise('GREAT'); else if (combo >= 8 && combo % 4 === 0) praise('PERFECT');
    } else {
      combo = 0; SFX.wrong(); SCN.pose('sad'); SCN.shake(5);
    }
    const ex = $('exp'); ex.innerHTML = '<b>' + T(ok ? '정답' : '오답') + '</b>'; ex.appendChild(document.createTextNode(q.x)); ex.className = 'on';
    $('next').className = 'on'; $('bNext').textContent = T(S.qi === 9 ? '결과' : '다음');
    dots(); save();
    setTimeout(() => { const nb = $('next'), pn = $('panel'), r = nb.getBoundingClientRect(), pr = pn.getBoundingClientRect(); if (r.bottom > pr.bottom) pn.scrollBy({ top: r.bottom - pr.bottom + 12, behavior: 'smooth' }); }, 60);
  }
  function next() {
    if (!lock) return; SFX.flip();
    S.qi++;
    if (S.qi >= 10) return partEnd();
    save(); ask();
  }
  // 꽃가루: 금빛·한지 색 종이 조각
  const fx = $('fx'), fc = fx.getContext('2d'); let bits = [], fxOn = false;
  function confetti(n) {
    fx.width = innerWidth; fx.height = innerHeight;
    for (let i = 0; i < n; i++) bits.push({ x: Math.random() * fx.width, y: -20 - Math.random() * fx.height * 0.5, vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: ['#f2c46a', '#f6ead2', '#e0703a', '#c9a24a'][i % 4] });
    if (!fxOn) { fxOn = true; let lt = performance.now(); const step = t => { const dt = Math.min(0.05, (t - lt) / 1000); lt = t; fc.clearRect(0, 0, fx.width, fx.height);
      bits = bits.filter(b => b.y < fx.height + 30); bits.forEach(b => { b.x += b.vx * dt + Math.sin(b.y / 40) * 0.6; b.y += b.vy * dt; b.r += b.vr * dt; fc.save(); fc.translate(b.x, b.y); fc.rotate(b.r); fc.fillStyle = b.c; fc.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 1.7))); fc.restore(); });
      if (bits.length) requestAnimationFrame(step); else { fxOn = false; fc.clearRect(0, 0, fx.width, fx.height); } }; requestAnimationFrame(step); }
  }
  function btn(label, fn, sub) { const w = document.createElement('span'); w.className = 'btnw'; const b = document.createElement('button'); b.className = 'btn' + (sub ? ' sub' : ''); b.textContent = label; b.onclick = () => { SFX.tap(); fn(); }; w.appendChild(b); return w; }
  function showRes(big, sc, btns, fail) {
    const r = $('res'); r.className = 'ov on' + (fail ? ' fail' : ''); $('praise').className = ''; $('resT').textContent = big; $('resS').textContent = sc;
    const b = $('resB'); b.innerHTML = ''; btns.forEach(x => b.appendChild(x));
  }
  function hideRes() { $('res').className = 'ov'; }
  function partEnd() {
    const p = P[S.part], n = S.ans.filter(Boolean).length;
    lock = true; $('next').className = ''; save();
    if (n >= PASS) {
      S.done[S.part] = n;
      setTimeout(() => { SCN.addLand(S.part); SFX.big(); SCN.pose('point'); }, 200);
      setTimeout(() => {
        SFX.fanfare(); confetti(120); SCN.pose('joy');
        showRes(p.done, n + ' / 10', [btn(T(S.part === 9 ? '마을 보기' : '다음 마을'), goNext)]);
      }, 1500);
    } else {
      S.tries++;
      SFX.fail(); SCN.pose('sad');
      setTimeout(() => showRes(EN ? 'You did not build the ' + p.name : p.name + (/[가-힣]$/.test(p.name) && (p.name.charCodeAt(p.name.length - 1) - 0xac00) % 28 ? '을' : '를') + ' 세우지 못했습니다', n + ' / 10', [btn(T('재도전'), retryPart), btn(T('처음부터'), askRestart, true)], true), 700);
    }
  }
  function goNext() {
    hideRes(); S.part++; S.qi = 0; S.ans = []; combo = 0; save();
    if (S.part >= 10) return ending();
    SCN.focus(S.part); SCN.pose('look'); setTimeout(ask, 500);
  }
  function retryPart() { hideRes(); SCN.clearZone(S.part); S.qi = 0; S.ans = []; combo = 0; save(); setTimeout(ask, 400); }
  function askRestart() {
    $('askT').textContent = T('처음부터 다시 할까요?');
    const b = $('askB'); b.innerHTML = '';
    b.appendChild(btn(T('취소'), () => { $('ask').className = 'ov dim'; }, true));
    b.appendChild(btn(T('처음부터'), () => { $('ask').className = 'ov dim'; hideRes(); $('endv').className = 'ov dim'; newGame(); }));
    $('ask').className = 'ov dim on';
  }
  function newGame() { document.body.classList.remove('end'); S = fresh(); combo = 0; lastTick = Date.now(); save(); document.body.classList.remove('ttl'); SCN.resize(); rebuild(); setTimeout(ask, 300); }
  // 엔딩: 밤이 되고 창문에 불이 하나씩 켜진다
  function score() { let s = 0; for (let z = 0; z < 10; z++) s += S.done[z] || 0; return s; }
  function rank(sc) { return T(sc >= 100 ? '논리의 왕' : sc >= 95 ? '명탐정' : sc >= 90 ? '수석 탐정' : sc >= 85 ? '탐정' : '견습 탐정'); }
  function ending() {
    document.body.classList.add('end'); SCN.resize();
    lock = true; save();
    SCN.setTime(1); SCN.overview(); SCN.pose('look');
    setTimeout(() => {
      const d = SCN.lightUp(() => SFX.light());
      setTimeout(() => { SFX.ending(); confetti(180); SCN.pose('joy');
        showRes(T('마을에 불이 모두 켜졌습니다'), EN ? score() + ' of 100 correct' : '100문제 가운데 ' + score() + '문제', [btn(T('결과 카드'), showCard)]); }, d + 600);
    }, 2200);
  }
  // 결과 카드 1080x1350
  let cardURL = '';
  function makeCard() {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), sc = score(), mins = Math.max(1, Math.round(S.ms / 60000));
    g.drawImage(SCN.snapshot(W, 860, 1, 'joy'), 0, 0);
    const gr = g.createLinearGradient(0, 760, 0, H); gr.addColorStop(0, 'rgba(20,15,30,0)'); gr.addColorStop(0.18, '#1a1424'); gr.addColorStop(1, '#100c18');
    g.fillStyle = gr; g.fillRect(0, 760, W, H - 760);
    g.textAlign = 'center'; g.fillStyle = '#fff3d6'; g.shadowColor = 'rgba(255,190,110,.6)'; g.shadowBlur = 24;
    g.font = '88px NSerif'; g.fillText(T('언어논리퀴즈'), W / 2, 130);
    g.shadowBlur = 0; g.fillStyle = '#f2c46a'; g.font = '100px NSerif'; g.fillText(rank(sc), W / 2, 980);
    g.font = '40px Noonnu'; g.fillStyle = '#e8dcc4';
    const rows = [[T('맞힌 문제'), sc + ' / 100'], [T('걸린 시간'), mins + (EN ? ' min' : '분')], [T('최고 연속 정답'), S.best + (EN ? '' : '개')], [T('다시 도전'), S.tries + (EN ? '' : '번')]];
    rows.forEach((r, i) => { const y = 1070 + i * 58; g.textAlign = 'right'; g.fillStyle = '#b8a890'; g.fillText(r[0], W / 2 - 20, y); g.textAlign = 'left'; g.fillStyle = '#fff3d6'; g.fillText(r[1], W / 2 + 20, y); });
    g.textAlign = 'center'; g.fillStyle = 'rgba(242,196,106,.85)'; g.font = '34px Noonnu'; g.fillText('oreumgames.com', W / 2, H - 46);
    g.strokeStyle = 'rgba(242,196,106,.5)'; g.lineWidth = 3; g.strokeRect(18, 18, W - 36, H - 36);
    return c.toDataURL('image/png');
  }
  function showCard() {
    hideRes();
    try { cardURL = makeCard(); } catch (e) { cardURL = ''; }
    $('card').src = cardURL;
    const b = $('endB'); b.innerHTML = '';
    b.appendChild(btn(T('저장'), saveCard)); b.appendChild(btn(T('공유'), shareCard, true)); b.appendChild(btn(T('처음부터'), askRestart, true));
    $('endv').className = 'ov dim on';
  }
  function saveCard() { if (!cardURL) return; const a = document.createElement('a'); a.href = cardURL; a.download = 'nonri-result.png'; document.body.appendChild(a); a.click(); a.remove(); }
  function toast(t) { const e = $('toast'); e.textContent = t; e.style.opacity = '1'; clearTimeout(e.__t); e.__t = setTimeout(() => { e.style.opacity = '0'; }, 2400); }
  async function shareCard() {
    const url = 'https://oreumgames.com/' + (EN ? 'en/' : '') + 'games/mini/nonri/', title = T('언어논리퀴즈'), text = EN ? 'LOGIC QUIZ ' + score() + ' pts ' + rank(score()) : '언어논리퀴즈 ' + score() + '점 ' + rank(score());
    if (navigator.share) { try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    const full = text + '\n' + url;
    try { await navigator.clipboard.writeText(full); toast(T('주소를 복사했습니다')); }
    catch (e) { try { const ta = document.createElement('textarea'); ta.value = full; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(T('주소를 복사했습니다')); } catch (e2) {} }
  }
  // HOW TO PLAY
  let howThen = null;
  function openHow(then) { howThen = then || null; $('how').className = 'ov dim on'; }
  $('bHowOk').onclick = () => { SFX.tap(); $('how').className = 'ov dim'; try { localStorage.setItem('nonri.how', '1'); } catch (e) {} const f = howThen; howThen = null; if (f) f(); };
  $('tHow').onclick = () => { SFX.tap(); openHow(); };
  // 소리 단추
  function syncTog() { const o = SFX.on(); $('tBgm').classList.toggle('off', !o.bgm); $('tSfx').classList.toggle('off', !o.sfx); }
  $('tBgm').onclick = () => { SFX.setBgm(!SFX.on().bgm); SFX.startBgm(); syncTog(); };
  $('tSfx').onclick = () => { SFX.setSfx(!SFX.on().sfx); SFX.tap(); syncTog(); };
  $('bNext').onclick = () => next();
  document.addEventListener('keydown', e => {
    if ($('how').classList.contains('on')) { if (e.key === 'Enter' || e.key === 'Escape') $('bHowOk').click(); return; }
    if (document.body.classList.contains('ttl') || $('res').classList.contains('on')) return;
    if (!lock && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
    else if (lock && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if ($('next').classList.contains('on')) next(); }
  });
  // 타이틀
  function begin(fn) { SFX.startBgm(); let seen = false; try { seen = localStorage.getItem('nonri.how') === '1'; } catch (e) {} if (seen) fn(); else openHow(fn); }
  function resume() {
    document.body.classList.remove('ttl'); SCN.resize(); lastTick = Date.now();
    if (S.part >= 10) { document.body.classList.add('end'); SCN.resize(); rebuild(); showCard(); return; }
    if (S.qi >= 10) { S.qi = 9; S.ans = S.ans.slice(0, 10); }
    rebuild(); setTimeout(ask, 200);
  }
  function title() {
    document.body.classList.add('ttl');
    const saved = load(), b = $('tBtns'); b.innerHTML = '';
    if (saved && (saved.part > 0 || saved.qi > 0)) {
      S = saved;
      b.appendChild(btn(T('이어하기'), () => begin(resume)));
      b.appendChild(btn(T('새로 시작'), () => begin(newGame), true));
      rebuild();
    } else {
      S = fresh();
      b.appendChild(btn(T('시작'), () => begin(newGame)));
      SCN.setTime(0.12, true); SCN.focus(0, true);
    }
    SCN.pose('look');
  }
  addEventListener('resize', () => SCN.resize());
  SCN.init($('cv'));
  $('howImg').src = SPR.house2; $('howImg2').src = SPR.castle;
  syncTog(); title(); SCN.start();
  // 시험 손잡이
  window.__nr = { get S() { return S; }, answer, next, ask, newGame, partEnd, ending, showCard, rebuild, P, set S(v) { S = v; } };
})();
