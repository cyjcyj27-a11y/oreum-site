// 한능검 진행: 사건 → 고르기 → 정사/갈림 → 다음
(function () {
  const $ = id => document.getElementById(id);
  const EV = HN.ACT1.concat(...HN.PART_ORDER.map(k => (HN.MORE && HN.MORE[k]) || [])), TOTAL = EV.length, KEY = 'nara.prog';
  let S = null, cur = -1, locked = false, streak = 0;
  const T = HN.T || (x => x); // 영문판(?lang=en)이면 js/en.js 가 채움
  function fresh() { return { i: 0, segR: 0, segN: 0, ans: -1, right: 0, wrong: 0, wrongIds: [], got: [], added: {}, ruins: {}, snap: null, end: '' }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v.i === 'number' ? v : null; } catch (e) { return null; } }
  function seen(k) { try { return localStorage.getItem('nara.' + k) === '1'; } catch (e) { return false; } }
  function mark(k) { try { localStorage.setItem('nara.' + k, '1'); } catch (e) {} }
  // 보기 섞기: 사건마다 늘 같은 순서
  function order(i) {
    let t = (i + 1) * 0x9E3779B1 >>> 0; const rnd = () => { t = t + 0x6D2B79F5 >>> 0; let x = Math.imul(t ^ t >>> 15, 1 | t); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; };
    const r = [0, 1, 2, 3, 4]; for (let k = 4; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [r[k], r[j]] = [r[j], r[k]]; } return r;
  }

  function topbar() {
    $('tRight').textContent = S.right;
    $('tScore').textContent = S.segN ? Math.round(S.segR / S.segN * 100) : '-';
  }
  function natName(n) { return HN.NAT_NAME[n] || ''; }
  function enterStage(st, nat, banner) {
    Scene.setStage(st, S.added[st] || [], S.ruins[st] || [], nat);
    if (banner) {
      const stg = HN.STAGES[st];
      $('eraName').textContent = nat ? natName(nat) : stg.name; $('eraYear').textContent = nat ? stg.name : stg.year;
      const e = $('era'); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
      SFX.era();
    }
  }
  function ask(i) {
    const ev = EV[i], prev = EV[i - 1];
    if (cur !== i) {
      const newStage = !prev || prev.st !== ev.st || cur < 0;
      if (!prev || seg(prev) !== seg(ev)) { if (!S.snap || S.snap.i !== i) { S.snap = snapshot(i); S.segR = S.segN = 0; } }
      if (newStage) enterStage(ev.st, ev.nat, true);
      else if (ev.nat !== prev.nat) enterStage(ev.st, ev.nat, true);
      cur = i;
    }
    const stg = HN.STAGES[ev.st];
    $('hEra').textContent = stg.name + (ev.nat ? ' · ' + natName(ev.nat) : '');
    $('hYear').textContent = stg.year;
    const ps = EV.findIndex(e => seg(e) === seg(ev)), pn = EV.filter(e => seg(e) === seg(ev)).length;
    $('hNo').textContent = (i - ps + 1) + ' / ' + pn;
    $('ptImg').src = 'art/pt/' + ev.sp + '.png';
    $('sayWho').textContent = ev.who; $('sayTxt').textContent = ev.say; $('qTxt').textContent = ev.q;
    const box = $('opts'); box.innerHTML = '';
    order(i).forEach(k => {
      const b = document.createElement('button'); b.className = 'mk'; b.textContent = ev.a[k]; b.dataset.k = k;
      b.onclick = () => pick(b, k); box.appendChild(b);
    });
    box.style.display = ''; $('after').classList.remove('on'); $('panel').classList.remove('ans');
    Scene.focus(ev.sp);
    locked = false; S.cele = 0; topbar(); save();
    $('panel').scrollTop = 0;
  }
  function seg(e) { return HN.STAGE_NATION[e.st]; } // 파트: 고조선(선사 포함) / 여러 나라
  function snapshot(i) { return { i, seg: seg(EV[i]), right: S.right, wrong: S.wrong, wrongIds: S.wrongIds.slice(), got: S.got.slice(), added: JSON.parse(JSON.stringify(S.added)), ruins: JSON.parse(JSON.stringify(S.ruins)) }; }
  function pick(btn, k) {
    if (locked) return; locked = true;
    const ev = EV[S.i], ok = k === 0, st = ev.st;
    [...$('opts').children].forEach(b => { b.disabled = true; if (b !== btn && +b.dataset.k !== 0) b.classList.add('dim'); });
    Scene.focus('');
    if (ok) {
      btn.classList.add('ok'); SFX.tap(); setTimeout(() => SFX.stamp(), 120); setTimeout(() => SFX.right(), 260);
      streak++; S.right++; if (!S.got.includes(S.i)) S.got.push(S.i);
      (S.added[st] = S.added[st] || []).push(...ev.add);
      setTimeout(() => { Scene.add(ev.add); if (ev.add.length) SFX.pop(); Scene.shake(0.15); }, 300);
      $('vst').textContent = T('正史'); $('vst').className = 'vst r';
      $('combo').textContent = streak >= 3 ? T('연속 ') + streak : '';
      $('altTxt').style.display = 'none';
    } else {
      btn.classList.add('no'); SFX.tap(); setTimeout(() => SFX.wrong(), 100);
      [...$('opts').children].forEach(b => { if (+b.dataset.k === 0) b.classList.add('ans'); });
      streak = 0; S.wrong++; S.wrongIds.push(S.i);
      const r = Scene.ruin(); if (r >= 0) (S.ruins[st] = S.ruins[st] || []).push(r);
      $('vst').textContent = T('갈림'); $('vst').className = 'vst w'; $('combo').textContent = '';
      $('altTxt').innerHTML = '<b>' + T('갈라진 역사') + '</b> ' + ev.alt; $('altTxt').style.display = '';
    }
    $('fTitle').textContent = ev.fact[0]; $('fLine').textContent = ev.fact[1];
    S.segN++; if (ok) S.segR++; S.ans = S.i;
    $('bNext').textContent = doneNation(S.i) ? T('결과') : T('다음');
    topbar(); save();
    setTimeout(() => { [...$('opts').children].forEach(b => { if (b.classList.contains('dim')) b.style.display = 'none'; }); $('after').classList.add('on'); $('panel').classList.add('ans'); }, ok ? 650 : 900);
  }
  // 나라 하나를 다 맞히고 넘어갈 때: 고조선 / 부여·고구려·옥저·동예·삼한
  function doneNation(i) {
    const a = EV[i], b = EV[i + 1];
    return !b || seg(b) !== seg(a) ? seg(a) : '';
  }
  function celebrate(name, then) {
    $('celeTxt').textContent = HN.doneText(name);
    $('cele').classList.add('on'); SFX.fanfare(); confetti();
    $('bCele').onclick = () => { SFX.tap(); $('cele').classList.remove('on'); then(); };
  }
  function next() {
    SFX.tap();
    const dn = doneNation(S.i);
    // 나라 하나가 끝나면 그 나라 점수로: 80점 이상 완성, 밑이면 실패(사장님 10/18)
    if (dn && !S.cele && Math.round(S.segR / Math.max(1, S.segN) * 100) < 80) return finish(EV[S.i].st);
    if (dn && S.i === TOTAL - 1) { S.i++; return finish(''); } // 마지막 파트(대한민국)는 바로 엔딩
    if (dn && !S.cele) { S.cele = 1; save(); return celebrate(dn, () => next()); }
    S.cele = 0;
    S.i++;
    if (S.i >= TOTAL) return finish('');
    ask(S.i);
  }
  function grade(r, n) { const p = n ? r / n : 0; return p >= 0.8 ? T('심화 1급') : p >= 0.7 ? T('심화 2급') : p >= 0.6 ? T('심화 3급') : T('불합격'); }
  function finish(stKey) {
    const fail = !!stKey, final = !fail && HN.LAST_ACT;
    const asked = fail ? S.i + 1 : TOTAL;
    S.end = fail ? stKey : 'real'; save();
    const ev = EV[Math.min(S.i, TOTAL - 1)];
    const E = fail ? { name: HN.failText(ev.st, ev.nat) } : final ? HN.FINAL : HN.REAL_END1;
    const rows = fail ? [[T('점수'), Math.round(S.segR / Math.max(1, S.segN) * 100) + T('점')], [T('맞힌 문항'), S.segR + ' / ' + S.segN], [T('완성 기준'), '80' + T('점')]]
      : [[T('맞힌 문항'), S.right + ' / ' + asked], [T('갈림'), S.wrong + T('번')], [T('게임 속 급수'), grade(S.right, asked)]];
    if (!fail) rows.push([T('칭호'), S.wrong === 0 ? T('사관의 눈') : S.wrong <= 3 ? T('제 길의 족장') : T('아슬아슬한 족장')]);
    const box = $('ending'); box.classList.toggle('fail', fail); box.classList.toggle('final', final);
    $('endHead').textContent = fail || final ? '' : T('1막 끝 正史');
    $('eName').textContent = E.name; $('eLine').textContent = E.line || '';
    $('eRows').innerHTML = rows.map(r => '<span>' + r[0] + '</span><b>' + r[1] + '</b>').join('');
    $('bRetry').style.display = fail ? '' : 'none';
    $('cardimg').removeAttribute('src'); lastCard = '';
    if (fail) SFX.wrong();
    else {
      final ? (SFX.fanfare(), confetti()) : SFX.end();
      drawCard(final, E, rows).then(url => { $('cardimg').src = url; lastCard = url; });
    }
    box.classList.add('on');
  }
  // 빵빠레 꽃가루(도트 네모)
  function confetti() {
    const c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c);
    const W = c.width = Math.ceil(innerWidth / 3), H = c.height = Math.ceil(innerHeight / 3), g = c.getContext('2d');
    const cols = ['#b8322a', '#f2c744', '#f6e7c8', '#3a6ad8', '#4aa040', '#e8783a'];
    const P = []; for (let i = 0; i < 160; i++) P.push({ x: Math.random() * W, y: -Math.random() * H, vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 50, c: cols[i % cols.length], s: 1 + (i % 3 === 0), w: Math.random() * 6 });
    let t0 = performance.now();
    (function step(now) {
      const t = (now - t0) / 1000; g.clearRect(0, 0, W, H);
      for (const p of P) { const y = p.y + p.vy * t, x = p.x + p.vx * t + Math.sin(t * 4 + p.w) * 4; if (y < H) { g.fillStyle = p.c; g.fillRect(Math.round(x), Math.round(y), p.s + (Math.sin(t * 9 + p.w) > 0 ? 1 : 0), p.s); } }
      if (t < 6) requestAnimationFrame(step); else c.remove();
    })(t0);
  }
  let lastCard = '';
  function wrap(g, text, x, y, maxW, lh) {
    let line = '', yy = y;
    for (const ch of text) { if (g.measureText(line + ch).width > maxW && line) { g.fillText(line, x, yy); line = ch.trim() ? ch : ''; yy += lh; } else line += ch; }
    if (line) g.fillText(line, x, yy); return yy;
  }
  async function drawCard(final, E, rows) {
    const real = true;
    try { await Promise.all([document.fonts.load('80px Saem'), document.fonts.load('40px Galm')]); } catch (e) {}
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#2a1d14'; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = '#efe2c4'; g.fillRect(18, 18, 1044, 1314);
    g.fillStyle = 'rgba(140,110,60,.08)'; for (let y = 24; y < 1330; y += 7) g.fillRect(18, y, 1044, 1);
    g.textAlign = 'center'; g.fillStyle = '#b8322a'; let tf = 120; g.font = tf + 'px Saem'; while (g.measureText(T('한능검')).width > 960 && tf > 40) { tf -= 4; g.font = tf + 'px Saem'; } for (let d = 0; d < 5; d++) g.fillText(T('한능검'), 538 + d, 158 + (d % 2) * 2);
    g.fillStyle = '#6a5238'; g.font = '38px Galm'; g.fillText(final ? T('선사시대부터 대한민국까지') : T('1막 · 선사 · 고조선 · 여러 나라'), 540, 222);
    const m = Scene.canvas(), sw = m.width, sh = m.height, tw = 960, th = 540;
    let cw = sw, chh = Math.round(sw * th / tw); if (chh > sh) { chh = sh; cw = Math.round(sh * tw / th); }
    g.fillStyle = '#2a1d14'; g.fillRect(52, 262, 976, 556);
    g.drawImage(m, Math.round((sw - cw) / 2), Math.round((sh - chh) / 2), cw, chh, 60, 270, tw, th);
    g.save(); g.translate(920, 330); g.rotate(-0.14);
    g.fillStyle = real ? '#b8322a' : '#2a1d14'; g.fillRect(-84, -56, 168, 112);
    g.strokeStyle = real ? '#f6e7c8' : '#d4c3a0'; g.lineWidth = 6; g.strokeRect(-72, -44, 144, 88);
    g.fillStyle = real ? '#f6e7c8' : '#d4c3a0'; g.font = '64px Saem'; for (let d = 0; d < 3; d++) g.fillText(real ? T('正史') : T('갈림'), d - 1, 22); g.restore();
    g.fillStyle = real ? '#b8322a' : '#2a1d14'; let fs = 78; g.font = fs + 'px Saem'; while (g.measureText(E.name).width > 930 && fs > 30) { fs -= 2; g.font = fs + 'px Saem'; } for (let d = 0; d < 4; d++) g.fillText(E.name, 539 + d, 919 + (d % 2) * 2);
    g.fillStyle = '#2a1d14'; g.font = '34px Galm'; const ly = wrap(g, E.line, 540, 980, 900, 48);
    const y = Math.min(Math.max(ly + 76, 1080), 1110);
    rows.forEach((r, k) => {
      const x = k % 2 ? 790 : 290, yy = y + Math.floor(k / 2) * 104;
      g.fillStyle = '#6a5238'; g.font = '30px Galm'; g.fillText(r[0], x, yy);
      g.fillStyle = '#b8322a'; g.font = '44px Galm'; g.fillText(r[1], x, yy + 48);
    });
    g.fillStyle = '#2a1d14'; g.fillRect(18, 1268, 1044, 64);
    g.fillStyle = '#f6e7c8'; g.font = '34px Galm'; g.fillText('oreumgames.com', 540, 1312);
    return c.toDataURL('image/png');
  }
  function saveCard() {
    if (!lastCard) return;
    const a = document.createElement('a'); a.href = lastCard; a.download = 'hanneunggeom.png'; document.body.appendChild(a); a.click(); a.remove();
  }
  async function shareCard() {
    if (!lastCard) return;
    try {
      const blob = await (await fetch(lastCard)).blob(), file = new File([blob], 'hanneunggeom.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: T('한능검') }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    saveCard();
  }
  function retry() {
    const sn = S.snap; if (!sn) return newGame();
    S.i = sn.i; S.right = sn.right; S.wrong = sn.wrong; S.wrongIds = sn.wrongIds.slice(); S.got = sn.got.slice();
    S.added = JSON.parse(JSON.stringify(sn.added)); S.ruins = JSON.parse(JSON.stringify(sn.ruins)); S.segR = S.segN = 0; S.ans = -1; S.end = '';
    $('ending').classList.remove('on'); cur = -1; streak = 0; ask(S.i);
  }
  function newGame() { S = fresh(); $('ending').classList.remove('on'); cur = -1; streak = 0; ask(0); }
  function openHow() { $('how').classList.add('on'); }
  function openBook() {
    $('book').innerHTML = EV.map((e, k) => S && S.got.includes(k)
      ? '<div class="fact"><span class="lb">' + HN.STAGES[e.st].name + '</span><span class="ft">' + e.fact[0] + '</span>' + e.fact[1] + '</div>'
      : '<div class="fact no"><span class="lb">' + HN.STAGES[e.st].name + '</span><span class="ft">? ? ?</span></div>').join('');
    $('bookN').textContent = (S ? S.got.length : 0) + ' / ' + TOTAL;
    $('bookov').classList.add('on');
  }
  function start(cont) {
    SFX.startBgm(); SFX.tap();
    document.body.classList.remove('ttl'); $('title').classList.remove('on');
    setTimeout(() => Scene.resize(), 30);
    if (cont && S) { cur = -1; if (S.end) { S.end === 'real' ? newGame() : retry(); } else if (S.ans === S.i) { ask(S.i); S.ans = S.i; next(); } else ask(S.i); }
    else newGame();
    if (!seen('how')) { mark('how'); openHow(); }
  }
  function toggles() { const s = SFX.state(); $('bBgm').classList.toggle('off', !s.bgm); $('bSfx').classList.toggle('off', !s.sfx); }
  Scene.init($('map'));
  Scene.setStage('nations', ['flag', 'palace'], [], '');
  S = load();
  if (S && (S.i > 0 || S.right + S.wrong > 0)) $('bCont').style.display = '';
  $('bStart').onclick = () => start(false);
  $('bCont').onclick = () => start(true);
  $('bNext').onclick = next;
  $('bHow').onclick = () => { SFX.tap(); openHow(); };
  $('bHowOk').onclick = () => { SFX.tap(); $('how').classList.remove('on'); };
  $('bBook').onclick = () => { SFX.tap(); openBook(); };
  $('bBookOk').onclick = () => { SFX.tap(); $('bookov').classList.remove('on'); };
  $('bRetry').onclick = () => { SFX.tap(); retry(); };
  $('bNew').onclick = () => { SFX.tap(); newGame(); };
  $('bSave').onclick = () => { SFX.tap(); saveCard(); };
  $('bShare').onclick = () => { SFX.tap(); shareCard(); };
  $('bBgm').onclick = () => { SFX.setBgm(!SFX.state().bgm); toggles(); SFX.startBgm(); };
  $('bSfx').onclick = () => { SFX.setSfx(!SFX.state().sfx); toggles(); SFX.tap(); };
  ['how', 'bookov'].forEach(id => $(id).addEventListener('click', e => { if (e.target.id === id) $(id).classList.remove('on'); }));
  addEventListener('keydown', e => {
    if ($('title').classList.contains('on')) { if (e.key === 'Enter') start($('bCont').style.display === ''); return; }
    if (e.key === 'Escape') { $('how').classList.remove('on'); $('bookov').classList.remove('on'); }
    if ($('after').classList.contains('on') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
    const n = parseInt(e.key, 10); if (n >= 1 && n <= 5 && !locked) { const b = $('opts').children[n - 1]; if (b) b.click(); }
  });
  toggles();
  window.__hn = { finalEnd() { HN.LAST_ACT = true; finish(''); }, get S() { return S; }, pick: n => $('opts').children[n] && $('opts').children[n].click(), next, finish, ask, newGame };
})();
