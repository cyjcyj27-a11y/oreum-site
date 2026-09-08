/* 인디밴드 데뷔시키기(폴더 boyband) — 게임. 홍대 버스킹 4명을 설득해 영입, 12주 뒤 데뷔. 말풍선 컷, 에피소드, 호감도는 story.js 를 읽는다 */
(function () {
  'use strict';
  const D = window.BB, A = window.BBA, ST = window.BBS;
  const EN = /[?&]lang=en/.test(location.search);
  const L = s => Array.isArray(s) ? s[EN ? 1 : 0] : s;
  const t = (ko, en) => EN ? en : ko;
  if (EN) { document.documentElement.lang = 'en'; document.title = 'Hotshot Indie — Oreum Games'; document.querySelectorAll('[data-en]').forEach(e => { e.innerHTML = e.getAttribute('data-en'); }); document.querySelectorAll('[data-en-ph]').forEach(e => { e.placeholder = e.getAttribute('data-en-ph'); }); }

  const rnd = (a, b) => Math.random() * (b - a) + a, rndi = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = id => document.getElementById(id);
  const STATS = D.STATS, ACTS = D.ACTS, N = D.TEAM_SIZE, PR = D.PRODUCER;

  /* 옛 판(보이밴드 만들기)의 저장값은 버린다 */
  try { if (localStorage.getItem('boyband.ver') !== '2') { ['boyband.best', 'boyband.snd', 'boyband.bgm', 'boyband.prog'].forEach(k => localStorage.removeItem(k)); localStorage.setItem('boyband.ver', '2'); } } catch (e) { }

  /* 화면 맞춤 — 2000×1080 을 기준으로 그린 화면을 창 크기에 맞춰 통째로 줄이고 키운다(카드 4장이 항상 한 화면). 폰(1000px 아래)은 그대로 */
  function fitZoom() {
    const w = window.innerWidth, h = window.innerHeight;
    const land = w > h;   // 폰 가로도 데스크톱 판을 줄여서 쓴다(사장님, 2026-09-08 "모바일 가로화면에 맞춰")
    const z = (w >= 1000 || land) ? Math.max(.22, Math.min(w / 2000, h / 1200)) : 1;
    const root = document.documentElement.style;
    root.zoom = z === 1 ? '' : String(z);
    document.documentElement.classList.toggle('zm', z !== 1);   // 줄인 상태에선 폰용 미디어쿼리를 끈다
    // zoom 을 걸면 fixed 요소가 창보다 짧게 잡힌다 — 창 크기를 배율로 나눠 직접 준다
    root.setProperty('--vwz', (w / z) + 'px'); root.setProperty('--vhz', (h / z) + 'px');
  }
  fitZoom(); window.addEventListener('resize', fitZoom);

  /* ══════ 상태 ══════ */
  const S = { applicants: [], picked: [], members: [], leaderId: null, name: '',
    week: 1, maxWeek: 12, money: 1500, team: 30, hype: 10, log: [], usedEvents: [], epDone: [], songBuff: 0, concept: null, tasted: false };

  /* ══════ 소리 토글 (스카이라이더 규칙) ══════ */
  function syncTog() { $('btnBgm').classList.toggle('off', !A.bgm); $('btnSnd').classList.toggle('off', !A.snd); }
  $('btnBgm').onclick = () => { A.toggleBgm(); syncTog(); };
  $('btnSnd').onclick = () => { A.toggleSnd(); syncTog(); A.sfx.click(); };
  syncTog();
  document.addEventListener('pointerdown', () => A.unlock(), { once: true });
  document.addEventListener('click', e => { if (e.target.closest('.btn,.act,.opt,.card.pick,.cc')) A.sfx.click(); });

  /* ══════ 멤버 ══════ */
  let _id = 0;
  function make(c) {
    const m = { id: ++_id, key: c.key, sprite: c.sprite, en: c.en, kr: c.kr, age: c.age, height: c.height,
      role: c.role, mood: c.mood, desc: c.desc, mbti: c.mbti, keywords: c.keywords, pal: c.palette, acc: c.acc, tint: c.tint,
      fee: c.fee, maxStam: c.maxStam, stamina: c.maxStam, mental: c.mental, pot: c.pot, bond: 15, hong: c.hong,
      trait: D.TRAITS[c.trait], sig: c.sig, act: 'rest', pos: '', gains: {}, out: false };
    STATS.forEach(s => m[s.k] = c.stats[s.k]);
    return m;
  }
  const disp = m => EN ? m.en : m.kr;
  const leader = () => S.members.find(m => m.id === S.leaderId);
  const alive = () => S.members.filter(m => !m.out);
  const IV = '?v=4';   // 그림을 다시 자르면 올린다(브라우저 캐시)
  const imgBody = m => `img/m${m.sprite}.webp${IV}`, imgFace = m => `img/f${m.sprite}.webp${IV}`;
  const imgBust = (m, e) => (!e || e === 'std') ? imgBody(m) : `img/b${m.sprite}_${e}.webp${IV}`;
  const line = (m, k) => L(ST.LINES[m.key][k]);

  /* ══════ 말풍선 컷 — 클로즈업 + 대사. 큐를 차례로 보여 주고 끝나면 cb ══════
     항목: {m, e, t}  대사, {narr, m?}  지문, {choice:[{t, f, e?, reply?}], m}  선택지, quick:true 는 빨리 넘어감 */
  const CUT = { q: [], cb: null, timer: null, typer: null, cur: null, side: 'left', lastKey: null, full: '' };
  function cutStart(items, cb) {
    if (!items.length) { if (cb) cb(); return; }
    if (CUT.q.length || !$('cutin').classList.contains('hidden')) { CUT.q.push(...items); if (cb) { const old = CUT.cb; CUT.cb = () => { if (old) old(); cb(); }; } return; }
    CUT.q = items.slice(); CUT.cb = cb || null; CUT.lastKey = null;
    $('cutin').classList.remove('hidden');
    cutNext();
  }
  function cutClear() { clearTimeout(CUT.timer); clearInterval(CUT.typer); CUT.timer = CUT.typer = null; }
  function cutNext() {
    if (CUT.cur && CUT.cur.choice && !$('cutChoices').classList.contains('hidden')) return;   // 선택지는 골라야 넘어간다
    // 글자가 찍히는 중이면 다 찍고 멈춘다
    if (CUT.typer) { clearInterval(CUT.typer); CUT.typer = null; $('cutText').textContent = CUT.full; cutArm(); return; }
    cutClear();
    const it = CUT.q.shift();
    if (!it) { $('cutin').classList.add('hidden'); const cb = CUT.cb; CUT.cb = null; CUT.cur = null; if (cb) cb(); return; }
    CUT.cur = it;
    const m = it.m;
    if (it.p) CUT.side = 'right'; else if (m) CUT.side = 'left';   // 프로듀서는 오른쪽, 멤버는 왼쪽
    $('cutin').classList.toggle('right', CUT.side === 'right');
    if (it.p) {
      CUT.lastKey = 'producer';
      const img = $('cutImg'), src = `img/p_${it.p}.webp${IV}`;
      if (img.getAttribute('data-src') !== src) { img.classList.remove('full'); img.src = src; img.setAttribute('data-src', src); img.onerror = () => { img.onerror = null; img.src = 'img/p_std.webp' + IV; }; }
    } else if (m) {
      const img = $('cutImg'), changed = m.key !== CUT.lastKey; CUT.lastKey = m.key;
      const e = it.e || ((it.t || changed || !img.getAttribute('data-src')) ? 'std' : null);   // 같은 사람의 지문, 선택지는 표정을 그대로, 사람이 바뀌면 새 그림
      const src = e ? imgBust(m, e) : img.getAttribute('data-src');
      if (img.getAttribute('data-src') !== src) { img.classList.toggle('full', e === 'std'); img.src = src; img.setAttribute('data-src', src); img.onerror = () => { img.onerror = null; img.classList.add('full'); img.src = imgBody(m); }; }
    }
    const narr = it.narr || it.n;   // 지문은 narr 또는 n
    $('cutNarr').classList.toggle('hidden', !narr);
    $('cutBox').classList.toggle('hidden', !it.t);
    $('cutChoices').classList.toggle('hidden', !it.choice);
    if (narr) $('cutNarr').textContent = L(narr);
    if (it.t) {
      $('cutName').textContent = it.p ? PR.en : (m ? m.en : '');
      const full = L(it.t); CUT.full = full; $('cutText').textContent = '';
      A.sfx.pop();
      let i = 0; const voice = it.p ? PR.voice : ST.LINES[m.key].voice;
      CUT.typer = setInterval(() => {
        i++; $('cutText').textContent = full.slice(0, i);
        if (i % 2 === 0 && full[i - 1] !== ' ') A.sfx.blip(voice);
        if (i >= full.length) { clearInterval(CUT.typer); CUT.typer = null; cutArm(); }
      }, 34);
    } else if (it.choice) {
      $('cutChoices').innerHTML = it.choice.map((c, i) => `<button class="opt" data-i="${i}">${L(c.t)}${c.s ? `<small>${L(c.s)}</small>` : ''}</button>`).join('');
      $('cutChoices').querySelectorAll('.opt').forEach(b => b.onclick = ev => {
        ev.stopPropagation(); const c = it.choice[+b.dataset.i];
        $('cutChoices').classList.add('hidden'); $('cutChoices').innerHTML = '';
        if (c.f) c.f();
        if (c.reply) CUT.q.unshift({ m: it.m, e: c.reply.e, t: c.reply.t });
        cutNext();
      });
    } else {
      cutArm();
    }
  }
  function cutArm() {
    // 자동으로 안 넘어간다 — 말풍선, 지문은 눌러서(탭, 스페이스, 엔터) 넘긴다 (사장님 지시 2026-09-07)
    CUT.timer = null;
  }
  $('cutin').addEventListener('click', e => { if (e.target.closest('.opt')) return; cutNext(); });
  document.addEventListener('keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && !$('cutin').classList.contains('hidden') && !(CUT.cur && CUT.cur.choice)) { e.preventDefault(); cutNext(); } });
  function heart(n) { const h = document.createElement('div'); h.className = 'cut-heart'; h.textContent = n > 0 ? '💗' : '💔'; $('cutin').appendChild(h); setTimeout(() => h.remove(), 1200); if (n > 0) A.sfx.heart(); else A.sfx.bad(); }

  /* ══════ 무대 애니메이션 ══════ */
  const STICKS = ['#7fd3ff', '#ff7a5c', '#c9b6ff', '#ffd166', '#f2a7c4', '#8bffb0'];
  function buildStage(el, members, o) {
    o = o || {};
    const n = members.length, xs = o.xs || (n === 1 ? [50] : members.map((_, i) => 14 + (72 / (n - 1)) * i));
    let h = '';
    h += `<div class="beam" style="--x:22%;--c:rgba(255,190,220,.55);--dur:5.5s"></div>`;
    h += `<div class="beam" style="--x:50%;--c:rgba(180,220,255,.5);--dur:7s;--d:-2s"></div>`;
    h += `<div class="beam" style="--x:78%;--c:rgba(255,230,170,.5);--dur:6.2s;--d:-4s"></div>`;
    h += `<div class="glow"></div><div class="floor"></div>`;
    members.forEach((m, i) => {
      const center = n >= 3 && i === Math.floor(n / 2);
      const amp = 4 + (m.perf || 40) / 14, tilt = 2 + (m.perf || 40) / 20;
      h += `<div class="idol ${i % 2 ? 'alt' : ''} ${center ? 'center' : ''} ${o.still ? 'still' : ''}"
        style="--x:${xs[i]}%;--img:url(${imgBody(m)});--d:${(i * .06).toFixed(2)}s;--amp:${amp.toFixed(1)}px;--tilt:${tilt.toFixed(1)}deg;--h:${(o.h || 88)}%">
        <div class="shadow"></div><div class="body"></div><div class="head"></div></div>`;
    });
    if (o.producer) h += `<div class="idol pro still" style="--x:50%;--img:url(img/p_plead.webp${IV});--h:${(o.h || 88) + 2}%"><div class="shadow"></div><div class="body" style="clip-path:none"></div></div>`;
    if (!o.noCrowd) {
      h += '<div class="crowd">';
      const cols = o.stick ? [o.stick, o.stick, '#ffffff'] : STICKS;
      for (let i = 0; i < 44; i++) h += `<div class="stick" style="left:${(i * 2.3 + rnd(-1, 1)).toFixed(1)}%;--c:${pick(cols)};--d:${(-rnd(0, 1)).toFixed(2)}s;height:${rndi(16, 30)}px"></div>`;
      h += '</div>';
    }
    if (o.confetti) for (let i = 0; i < 60; i++) h += `<div class="confetti" style="--x:${rndi(0, 100)}%;--c:${pick(STICKS)};--dur:${rnd(2.5, 5).toFixed(1)}s;--d:${(-rnd(0, 5)).toFixed(1)}s"></div>`;
    if (o.sign) h += `<div class="sign">${o.sign}</div>`;
    el.innerHTML = h; el.classList.toggle('dim', !!o.dim);
  }

  /* ══════ HUD ══════ */
  function hud() {
    $('tbMoney').textContent = S.money.toLocaleString();
    $('tbTeam').textContent = Math.round(S.team);
    $('tbHype').textContent = Math.round(S.hype);
    $('tbWeek').textContent = `${Math.min(S.week, S.maxWeek)}/${S.maxWeek}`;
    $('tbMoney').parentNode.classList.toggle('warn', S.money < 200);
  }
  function show(id) { ['title', 'audition', 'setup', 'training', 'concept', 'result'].forEach(s => $('scene-' + s).classList.toggle('hidden', s !== id)); window.scrollTo(0, 0); }
  function floatText(x, y, txt) { const d = document.createElement('div'); d.className = 'float'; d.textContent = txt; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1200); }

  /* ══════ 타이틀 ══════ */
  const titleCast = D.NAMED.slice().sort(() => Math.random() - .5).slice(0, N).map(make);
  buildStage($('titleStage'), titleCast, { h: 62, still: true, xs: [10, 30, 70, 90], producer: true }); $('titleStage').classList.add('frozen');   // 시작화면은 가만히 서 있는다
  $('btnStart').onclick = () => { A.music(A.bgm); startAudition(); cutStart(ST.PRODUCER.prologue.slice()); };

  /* ══════ 섭외 ══════ */
  function bar(label, v, color, delta, cls) {
    const big = delta >= 6;
    return `<div class="bar ${cls || ''}"><span>${L(label)}</span><div class="track"><div class="fill" style="width:${clamp(v, 0, 100)}%;background:${color}"></div></div>
      <span class="val">${Math.round(v)}</span><span class="up ${big ? 'big' : ''}">${delta ? '+' + delta : ''}</span></div>`;
  }
  const statBars = (m, g) => STATS.map(s => bar(s.n, m[s.k], s.c, g ? m.gains[s.k] : null)).join('');
  function avatar(m, cls) {
    const tired = m.stamina < m.maxStam * .3, rest = m.act === 'rest' && cls === 'roster';
    const crown = cls === 'roster' && m.id === S.leaderId;   // 리더 표시는 왕관으로 — 이름 줄이 늘어나 카드 줄이 어긋나지 않게(2026-09-08)
    return `<div class="ava ${tired ? 'tired' : ''}" style="--p0:${m.pal[0]};--p1:${m.pal[1]}"><img src="${imgFace(m)}" alt="">${rest ? '<span class="zz">💤</span>' : ''}${crown ? '<span class="crown">👑</span>' : ''}</div>`;
  }
  function startAudition() {
    _id = 0; S.applicants = D.NAMED.map(make);
    S.picked = [];
    $('topbar').classList.add('show'); hud();
    show('audition'); renderApplicants(); recruitHud();
  }
  function renderApplicants() {
    $('applicants').innerHTML = S.applicants.map(a => {
      const on = S.picked.includes(a.id);
      return `<div class="card pick ${on ? 'sel' : ''}" style="--acc:${a.acc};--tint:${a.tint}" data-id="${a.id}">
        ${on ? '<span class="tag joined">JOINED</span>' : '<span class="tag ask">TALK</span>'}
        <div class="chead">${avatar(a)}<div>
          <div class="nm">${a.en}<span class="kr">${a.kr}</span></div>
          <div class="pos">${a.age}${t('세', '')} ${a.height} ${a.mbti} ${L(a.role)}<br><span style="color:var(--cream)">${'★'.repeat(a.pot)}${'☆'.repeat(5 - a.pot)}</span></div></div></div>
        ${statBars(a)}
        ${bar(['홍대병', 'Indie'], a.hong, '#8e6fd0')}
        <div class="divider"></div>
        <div style="font-size:26.4px;color:var(--dim);line-height:1.7">
          <span class="tag">${L(a.trait.n)}</span> <span class="tag sig">${L(a.sig.n)}</span>
          <div style="margin-top:6px">${L(a.trait.d)}<br>${L(a.sig.d)}</div>
          <div style="margin-top:5px">💪 ${a.maxStam}, 🧠 ${a.mental}</div>
        </div>
        <div class="swatch">${a.pal.map(c => `<i style="background:${c}"></i>`).join('')}</div>
        <div class="fee" style="color:${a.fee ? 'var(--gold)' : 'var(--dim)'}">
          <span class="num"><span style="color:var(--dim);font-size:.8em;margin-right:6px">${t('섭외비', 'FEE')}</span>${a.fee ? '🪙 ' + a.fee : 'FREE'}</span>
          <button class="act" style="padding:3px 9px;font-size:24px" data-profile="${a.key}">PROFILE</button>
        </div>
      </div>`;
    }).join('');
  }
  $('applicants').addEventListener('click', e => {
    const p = e.target.closest('[data-profile]'); if (p) { e.stopPropagation(); return showProfile(p.dataset.profile); }
    const c = e.target.closest('.card'); if (!c) return;
    const m = S.applicants.find(a => a.id === +c.dataset.id);
    if (S.picked.includes(m.id)) { A.sfx.pick(); cutStart([{ m, e: 'joy', t: ST.RECRUIT[m.key].join.t, quick: true }]); return; }
    playRecruit(m);
  });
  /* 영입 — 찾아가서 말을 건다. 선택에 따라 신뢰, 계약금이 달라진다 */
  function playRecruit(m) {
    const R = ST.RECRUIT[m.key]; A.sfx.event();
    const items = R.lines.map(l => l.n ? { m, narr: l.n } : { m, e: l.e, t: l.t });
    items.push({ m, choice: R.a.map(a => ({ t: a.t, reply: a.reply, f: () => {
      if (a.bond) { m.bond = clamp(m.bond + a.bond, 0, 100); heart(a.bond); }
      if (a.fee) m.fee = Math.max(0, m.fee + a.fee);
    } })) });
    items.push({ m, e: R.join.e, t: R.join.t });
    cutStart(items, () => { S.picked.push(m.id); A.sfx.coin(); renderApplicants(); recruitHud(); });
  }
  function recruitHud() {
    $('pickCount').textContent = `${S.picked.length} / ${N}`;
    $('pickCost').textContent = pickCost();
    $('btnConfirmPick').disabled = S.picked.length !== N;
  }
  const pickCost = () => S.applicants.filter(a => S.picked.includes(a.id)).reduce((s, a) => s + a.fee, 0);
  function togglePick(id) {
    const i = S.picked.indexOf(id), m = S.applicants.find(a => a.id === id);
    if (i >= 0) { S.picked.splice(i, 1); A.sfx.unpick(); }
    else if (S.picked.length < N) { S.picked.push(id); A.sfx.pick(); cutStart([{ m, e: 'joy', t: ST.LINES[m.key].greet, quick: true }]); }
    else return;
    const cost = pickCost();
    $('pickCount').textContent = `${S.picked.length} / ${N}`;
    $('pickCost').textContent = cost;
    $('chipCost').classList.toggle('bad', cost > S.money - 200);
    $('btnConfirmPick').disabled = S.picked.length !== N || cost >= S.money;
    renderApplicants();
  }
  function showProfile(key) {
    const m = S.applicants.find(a => a.key === key);
    $('overlay').innerHTML = `<div class="ovl"><div class="modal">
      <div class="sheet">
        <div class="ph" style="--p0:${m.pal[0]};--p1:${m.pal[1]}"><img src="${imgBody(m)}" alt=""></div>
        <div>
          <div class="num" style="font-size:62.4px;letter-spacing:6px">${m.en}</div>
          <div style="font-size:28.8px;color:var(--dim);margin:2px 0 14px">${m.kr}</div>
          <div class="prow"><span>AGE</span>${m.age}${t('세', '')}</div>
          <div class="prow"><span>HEIGHT</span>${m.height}</div>
          <div class="prow"><span>MBTI</span>${m.mbti}</div>
          <div class="prow"><span>ROLE</span>${L(m.role)}</div>
          <div class="prow"><span>MOOD</span>${L(m.mood)}</div>
          <div class="swatch" style="margin-top:12px">${m.pal.map(x => `<i style="background:${x};width:22px;height:22px"></i>`).join('')}</div>
        </div>
      </div>
      <div class="divider" style="margin:18px 0"></div>
      <div class="bd" style="margin-bottom:10px;font-size:33.6px">${L(m.desc)}</div>
      <div class="kw">${L(m.keywords).join(' / ')}</div>
      <div class="divider" style="margin:16px 0"></div>
      ${statBars(m)}
      <div style="margin-top:12px;font-size:28.8px;color:var(--dim);line-height:1.8">
        <span class="tag">${L(m.trait.n)}</span> ${L(m.trait.d)}<br>
        <span class="tag sig">${L(m.sig.n)}</span> ${L(m.sig.d)}
      </div>
      <button class="btn" style="width:100%;margin-top:18px" id="mClose">OK</button>
    </div></div>`;
    $('mClose').onclick = closeModal;
  }
  function closeModal() { $('overlay').innerHTML = ''; }

  /* ══════ 결성 ══════ */
  $('btnConfirmPick').onclick = () => {
    S.members = S.applicants.filter(a => S.picked.includes(a.id));
    S.money -= pickCost(); hud(); A.sfx.coin();
    assignPositions();
    show('setup');
    buildStage($('setupStage'), S.members, { noCrowd: true });
    $('groupName').value = '';   // 이름은 직접 쓴다
    renderLeaderPick(); checkSetup();
  };
  function assignPositions() {
    const slots = D.POSITIONS, ms = S.members, n = ms.length;
    let best = null, bestScore = -1;
    const perm = (arr, cur) => {
      if (!arr.length) { const sc = cur.reduce((s, si, i) => s + ms[i][slots[si][0]], 0); if (sc > bestScore) { bestScore = sc; best = [...cur]; } return; }
      arr.forEach((v, i) => perm(arr.filter((_, j) => j !== i), [...cur, v]));
    };
    perm(slots.map((_, i) => i).slice(0, n), []);
    ms.forEach((m, i) => m.pos = slots[best[i]][1]);
  }
  function renderLeaderPick() {
    $('leaderPick').innerHTML = S.members.map(m => `
      <div class="card pick ${S.leaderId === m.id ? 'sel' : ''}" style="--acc:${m.acc};--tint:${m.tint}" data-id="${m.id}">
        <div class="chead">${avatar(m)}<div><div class="nm">${m.en}</div><div class="pos">${L(m.pos)}</div></div></div>
        <div style="font-size:28.8px;color:var(--dim);text-align:center;line-height:1.8">
          ${t('끼', 'Charm')} <b class="num" style="color:var(--sage)">${Math.round(m.charm)}</b> &nbsp; 🧠 <b class="num">${m.mental}</b><br>
          <span class="tag">${L(m.trait.n)}</span></div>
      </div>`).join('');
  }
  $('leaderPick').addEventListener('click', e => {
    const c = e.target.closest('.card'); if (!c) return;
    S.leaderId = +c.dataset.id; A.sfx.pick(); renderLeaderPick(); checkSetup();
    const m = leader(); cutStart([{ m, e: m.key === 'haru' ? 'sad' : 'joy', t: ST.LINES[m.key].leader, quick: true }]);
  });
  $('groupName').addEventListener('input', checkSetup);
  function checkSetup() { $('btnStartTraining').disabled = !(S.leaderId && $('groupName').value.trim()); }

  /* ══════ 트레이닝 ══════ */
  $('btnStartTraining').onclick = () => {
    S.name = $('groupName').value.trim().toUpperCase();
    show('training');
    addLog(`<b>${S.name}</b> — LEADER <b>${disp(leader())}</b>`, 0);
    renderTraining();
    cutStart(ST.PRODUCER.intro.slice());
  };
  function renderTraining(anim) {
    hud();
    $('tbName').textContent = S.name;
    $('tbLeader').textContent = `LEADER ${disp(leader())}`;
    $('roster').innerHTML = S.members.map(m => {
      if (m.out) return `<div class="card out" style="--acc:${m.acc}"><div class="chead">${avatar(m)}<div><div class="nm">${m.en}</div><div class="pos" style="color:var(--red)">OUT</div></div></div></div>`;
      const sp = m.stamina / m.maxStam * 100;
      const sc = sp < 25 ? 'var(--red)' : sp < 50 ? 'var(--gold)' : 'var(--good)';
      const mc = m.mental < 25 ? 'var(--red)' : m.mental < 50 ? 'var(--gold)' : 'var(--steel)';
      const gained = anim && Object.keys(m.gains).length;
      return `<div class="card ${gained ? 'gain' : ''}" style="--acc:${m.acc};--tint:${m.tint}" data-id="${m.id}">
        <div class="chead">${avatar(m, 'roster')}<div>
          <div class="nm">${m.en}</div>
          <div class="pos">${L(m.pos)} ${m.mbti}</div><div class="pos" style="color:var(--cream);margin-top:0">${'★'.repeat(m.pot)}</div></div></div>
        ${statBars(m, true)}
        <div class="divider"></div>
        ${bar('💪', sp, sc)}${bar('🧠', m.mental, mc)}${bar('♥', m.bond, '#e0699c', null, 'love')}${bar(['홍대병', 'Indie'], m.hong, '#8e6fd0')}
        <div class="acts">${D.ACT_ORDER.map(k => { const a = ACTS[k], no = a.cost > S.money;
          return `<button class="act ${m.act === k ? 'on' : ''}" ${no ? 'disabled' : ''} data-act="${k}"><i>${a.i}</i>${L(a.n)}</button>`; }).join('')}</div>
        <div class="actcost">${ACTS[m.act].cost ? '🪙 -' + ACTS[m.act].cost : ''}</div>
      </div>`;
    }).join('');
    if (anim) document.querySelectorAll('#roster .card.gain .ava').forEach(a => a.classList.add('hop'));
    weekBtn();
  }
  function weekBtn() {
    const cost = alive().reduce((s, m) => s + ACTS[m.act].cost, 0);
    $('btnWeek').disabled = cost > S.money;
    $('btnWeek').innerHTML = `WEEK ${S.week} ▶ ${cost ? `<span style="font-size:31.2px;opacity:.8">🪙 -${cost}</span>` : ''}`;
  }
  $('roster').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const m = S.members.find(x => x.id === +b.closest('.card').dataset.id);
    if (m && !m.out) { m.act = b.dataset.act; renderTraining(); }
  });
  function addLog(html, week) {
    S.log.unshift({ html, w: week === undefined ? S.week : week });
    $('log').innerHTML = S.log.slice(0, 40).map(l => `<div class="li"><span class="wk">${l.w ? 'W' + l.w : '—'}</span>${l.html}</div>`).join('');
  }
  const staminaMult = m => { const p = m.stamina / m.maxStam; return p >= .7 ? 1.15 : p >= .45 ? 1.0 : p >= .22 ? .68 : .35; };
  const good = s => `<span class="good">${s}</span>`, bad = s => `<span class="bad">${s}</span>`;
  function dropOut(m) { m.out = true; S.doom = true; addLog(bad(`💔 ${disp(m)} OUT`)); A.sfx.out(); return { m, e: 'sad', t: ST.LINES[m.key].out }; }   // 넷이 정예 — 하나라도 빠지면 GAME OVER(사장님, 2026-09-08)

  $('btnWeek').onclick = runWeek;
  const refuseChance = (m, k) => { const base = clamp((m.hong - 45) / 100, 0, .5); return k === 'yt' ? base * .5 : base; };
  function runWeek() {
    const cost = alive().reduce((s, m) => s + ACTS[m.act].cost, 0);
    if (cost > S.money) return;
    S.money -= cost; A.sfx.week();
    let restCount = 0, earned = 0, fameGain = 0, jamCount = 0, bigGain = false, refused = 0;
    const notes = [], L_ = leader(), mood = {};

    alive().forEach(m => {
      m.gains = {};
      const a = ACTS[m.act], tr = m.trait;
      if (m.key === 'haru' && m.perf >= 55) fameGain += 1;

      if (m.act === 'rest') {
        restCount++; mood[m.id] = 'rest';
        m.stamina = clamp(m.stamina + m.maxStam * .42, 0, m.maxStam);
        m.mental = clamp(m.mental + 12, 0, 100);
        m.hong = clamp(m.hong + 1, 0, 100);
        if (m.key === 'lion') { m.write = clamp(m.write + 2, 0, 100); m.gains.write = 2; notes.push(`<b>${disp(m)}</b> ${L(m.sig.n)} ${good(t('작곡 +2', 'Write +2'))}`); }
        if (m.key === 'yuan') { alive().forEach(x => { if (x !== m) x.mental = clamp(x.mental + 3, 0, 100); }); notes.push(`<b>${disp(m)}</b> ${L(m.sig.n)} ${good(t('전원 멘탈 +3', 'Everyone mind +3'))}`); }
        return;
      }
      if (m.act === 'gig') {      // 홍대 앞 버스킹 — 집. 코인, 멘탈, 홍대병이 오른다
        mood[m.id] = 'gig';
        const ham = tr.ham ? 2 : 1, beast = m.key === 'kairen' ? 2 : 1;
        earned += Math.round((rnd(30, 60) + m.perf * .4 + m.charm * .2 + S.hype * .3) * ham);
        fameGain += (.5 + m.charm * .008) * ham * beast;
        m.stamina = clamp(m.stamina - a.stam * tr.stam * (beast > 1 ? 1.3 : 1), 0, m.maxStam);
        m.mental = clamp(m.mental + 3, 0, 100);
        m.hong = clamp(m.hong + 2, 0, 100);
        ['vocal', 'play', 'perf'].forEach(k => { let g = +rnd(.4, 1.2).toFixed(1); m[k] = clamp(m[k] + g, 0, 100); m.gains[k] = g; });
        if (m.key === 'jay') { m.write = clamp(m.write + 1.5, 0, 100); m.gains.write = 1.5; }
        return;
      }
      if (m.act === 'tv' || m.act === 'yt' || m.act === 'charm') {   // 유명세 — 홍대병이 세면 안 나가기도 한다
        if (!S.tasted && Math.random() < refuseChance(m, m.act)) {
          refused++; mood[m.id] = 'refuse';
          m.mental = clamp(m.mental - 3 * tr.ment, 0, 100);
          notes.push(bad(`${disp(m)} ${t('안 나감', 'refused')} — ${L(a.n)}`));
          return;
        }
        const drag = 1 + m.hong / 25;   // 홍대병만큼 멘탈이 깎인다
        if (m.act === 'tv') {
          mood[m.id] = 'tv';
          fameGain += .8 + m.perf * .014 + m.charm * .008;
          earned += Math.round(30 + m.perf * .4 + S.hype * .2);
          const g = +rnd(.5, 1.6).toFixed(1); m.perf = clamp(m.perf + g, 0, 100); m.gains.perf = g;
          m.mental = clamp(m.mental - 2.5 * drag * tr.ment, 0, 100);
          m.hong = clamp(m.hong - 3, 0, 100);
        } else if (m.act === 'yt') {
          mood[m.id] = 'yt';
          fameGain += .5 + m.charm * .01 + m.write * .005;
          earned += Math.round(rnd(8, 30) + S.hype * .35);
          const g = +rnd(.4, 1.2).toFixed(1); m.charm = clamp(m.charm + g, 0, 100); m.gains.charm = g;
          m.mental = clamp(m.mental - 1.2 * drag * tr.ment, 0, 100);
          m.hong = clamp(m.hong - 2, 0, 100);
        } else {
          mood[m.id] = 'charm';
          fameGain += (1.2 + m.charm * .02) * (m.key === 'doyun' ? 2 : 1);
          let g = rnd(a.base[0], a.base[1]) * tr.gain * (1 + m.pot * .13) * staminaMult(m) * clamp((102 - m.charm) / 58, .28, 1.35);
          g = +g.toFixed(1); if (g >= 6) { bigGain = true; mood[m.id] = 'great'; }
          m.charm = clamp(m.charm + g, 0, 100); m.gains.charm = g;
          m.mental = clamp(m.mental - 4 * drag * tr.ment, 0, 100);
          m.hong = clamp(m.hong - 4, 0, 100);
        }
        m.stamina = clamp(m.stamina - a.stam * tr.stam, 0, m.maxStam);
        return;
      }

      // 연습 — 보컬, 합주, 작곡
      if (m.act === 'play') jamCount++;
      if (m.act === 'write') m.hong = clamp(m.hong + 1, 0, 100);
      mood[m.id] = 'ok';
      const st = a.stat;
      let g = rnd(a.base[0], a.base[1]);
      g *= tr.gain;
      if (tr.vocalBoost && st === 'vocal') g *= tr.vocalBoost;
      g *= (1 + m.pot * .13);
      g *= staminaMult(m);
      g *= (1 + S.team / 400);
      g *= clamp((102 - m[st]) / 58, .28, 1.35);
      if (tr.genius && Math.random() < .18) { g *= 2.6; notes.push(`<b>${disp(m)}</b> ${good(L(a.n) + ' ' + t('폭발 성장!', 'breakthrough!'))}`); }
      g = +g.toFixed(1);
      if (g >= 6) { bigGain = true; mood[m.id] = 'great'; }
      m[st] = clamp(m[st] + g, 0, 100); m.gains[st] = g;
      m.stamina = clamp(m.stamina - a.stam * tr.stam, 0, m.maxStam);
      let md = 4 * tr.ment;
      if (m.stamina / m.maxStam < .3) md += 7;
      if (m.bond >= 60) md *= .8;
      m.mental = clamp(m.mental - md, 0, 100);
    });

    S.money += Math.round(earned);
    S.hype = clamp(S.hype + fameGain - 1, 0, 100);

    let team = 1 + Math.floor(L_.charm / 35);
    alive().forEach(m => { if (m.trait.social) team += 2; });
    if (jamCount >= 3) { team += 2; notes.push(good(t('합주 호흡 +2', 'Jam sync +2'))); }
    if (restCount >= 3) team += 2;
    const shaky = alive().filter(m => m.mental < 30).length;
    team -= shaky * 3;
    S.team = clamp(S.team + team, 0, 100);

    if (earned) { notes.push(good('🪙 +' + Math.round(earned))); A.sfx.coin(); }
    if (fameGain >= 1) notes.push(good('🔥 +' + fameGain.toFixed(1)));
    if (shaky) notes.push(bad(t(`멘탈 위험 ${shaky}`, `${shaky} at risk`)));
    notes.forEach(n => addLog(n));

    const lines = [];
    alive().forEach(m => { if (m.mental <= 0) lines.push(dropOut(m)); });
    renderTraining(true);
    if (bigGain) { A.sfx.great(); const b = $('btnWeek').getBoundingClientRect(); floatText(b.left, b.top - 10, 'GREAT'); }
    else if (alive().some(m => Object.keys(m.gains).length)) A.sfx.up();

    // 이번 주 한마디 — 안 나간 사람, 급한 사람이 먼저, 오래 말 안 한 사람이 그다음
    const PRI = { refuse: 6, great: 4, tired: 3, low: 3, tv: 2.5, charm: 2.5, yt: 2, gig: 2, rest: 1, ok: 0 };
    const EXPR = { refuse: 'mad', great: 'joy', tired: 'sad', low: 'sad', tv: 'joy', charm: 'joy', yt: 'joy', gig: 'joy', rest: 'std', ok: 'std' };
    const cand = alive().map(m => {
      let k = mood[m.id] || 'ok';
      if (k !== 'refuse' && m.stamina < m.maxStam * .3) k = 'tired';
      if (k !== 'refuse' && m.mental < 45) k = 'low';
      return { m, k, p: PRI[k] + (S.week - (m.spoke || 0)) * 1.2 + Math.random() };
    }).sort((a, b) => b.p - a.p);
    cand.slice(0, 2).forEach(c => { c.m.spoke = S.week; lines.push({ m: c.m, e: EXPR[c.k], t: ST.LINES[c.m.key][c.k], quick: true }); });
    if (refused) lines.push(Object.assign({ quick: true }, ST.PRODUCER.refuse[0]));
    // 신뢰가 60 을 넘긴 순간 — 한 번만
    alive().forEach(m => { if (m.bond >= 60 && !m.trusted) { m.trusted = true; lines.push({ m, e: 'joy', t: ST.LINES[m.key].trust }); } });

    $('btnWeek').disabled = true;
    if (S.doom) lines.splice(S.members.filter(m => m.out).length);   // 탈퇴 대사만 남기고 바로 GAME OVER
    cutStart(lines, () => {
      if (S.doom || alive().length === 0) return gameOver();
      const ep = pickEpisode();
      if (!ep) return afterEpisodes();
      playEpisode(ep, () => { const ep2 = readyEpisodes().length >= 3 ? pickEpisode() : null; if (ep2) playEpisode(ep2, afterEpisodes); else afterEpisodes(); });
    });
  }
  /* 영상 한 편 — 화면을 덮고 소리째 튼다. 끝나거나 누르면 닫힌다(예능 출연 영상, 2026-09-08) */
  function playVideo(src, cb) {
    A.duck(true);
    const ov = document.createElement('div'); ov.id = 'vidov';
    ov.innerHTML = `<video src="${src}" autoplay playsinline></video><div class="onair">ON AIR</div><div class="cut-next">▼</div>`;
    document.body.appendChild(ov);
    let done = false;
    const end = () => { if (done) return; done = true; const v = ov.querySelector('video'); try { v.pause(); } catch (e) { } ov.remove(); A.duck(false); cb && cb(); };
    const v = ov.querySelector('video');
    v.addEventListener('ended', end); v.addEventListener('error', end);
    v.play().catch(() => { v.muted = true; v.play().catch(end); });
    setTimeout(() => ov.addEventListener('click', end), 600);
  }
  /* 인기 맛 — 8주차, 한 번. 그 뒤로 홍대병이 꺾이고 안 나가는 일이 없다 */
  function afterEpisodes() {
    if (S.doom || alive().length === 0) return gameOver();
    if (!S.tasted && S.week >= 8) {   // 8주차에 예능 출연(사장님, 2026-09-08). 유명세와 무관
      S.tasted = true; A.sfx.cheer();
      const items = ST.PRODUCER.taste.slice();
      alive().forEach(m => { m.hong = Math.min(m.hong, 25); m.mental = clamp(m.mental + 10, 0, 100); m.bond = clamp(m.bond + 8, 0, 100); items.push({ m, e: 'joy', t: ST.LINES[m.key].taste }); });
      items.push(...ST.PRODUCER.tasteEnd);
      S.hype = clamp(S.hype + 8, 0, 100); addLog(good(t('🔥 인기 맛 — 전원 홍대병 ↓', '🔥 Taste of fame — Indie pride ↓ for all')));
      renderTraining();
      return playVideo('assets/variety.mp4', () => cutStart(items, afterEpisodes));   // 예능 출연 영상 먼저
    }
    const ev = rollEvent();
    if (ev) return playEvent(ev, afterWeek);
    afterWeek();
  }
  function afterWeek() {
    const gone = S.members.filter(m => !m.out && m.mental <= 0);
    if (gone.length) { renderTraining(); return cutStart(gone.map(dropOut), gameOver); }
    renderTraining();
    if (S.doom || alive().length === 0) return gameOver();
    S.week++;
    if (S.week > S.maxWeek) { return setTimeout(goConcept, 400); }
    hud(); weekBtn();
  }

  /* ══════ 에피소드 (미연시) ══════ */
  const readyEpisodes = () => ST.EPISODES.filter(e => e.week <= S.week && !S.epDone.includes(e.key + e.ep) && alive().some(m => m.key === e.key));
  function pickEpisode() {
    const ready = readyEpisodes();
    if (!ready.length) return null;
    const minW = Math.min(...ready.map(e => e.week));
    return pick(ready.filter(e => e.week === minW));
  }
  function playEpisode(ep, cb) {
    S.epDone.push(ep.key + ep.ep);
    const m = alive().find(x => x.key === ep.key);
    A.sfx.event();
    const items = ep.lines.map(l => l.n ? { m, narr: l.n } : { m, e: l.e, t: l.t });
    items.push({ m, choice: ep.choice.a.map(a => ({ t: a.t, reply: a.reply, f: () => applyChoice(m, a) })) });
    cutStart(items, cb);
  }
  function applyChoice(m, a) {
    if (a.bond) { m.bond = clamp(m.bond + a.bond, 0, 100); heart(a.bond); }
    if (a.mental) m.mental = clamp(m.mental + a.mental, 0, 100);
    if (a.stat) m[a.stat] = clamp(m[a.stat] + a.val, 0, 100);
    if (a.money) S.money += a.money;
    if (a.stamina) m.stamina = m.maxStam;
    if (a.team) S.team = clamp(S.team + a.team, 0, 100);
    const parts = [];
    if (a.bond) parts.push((a.bond > 0 ? '♥ +' : '♥ ') + a.bond);
    if (a.mental) parts.push('🧠 ' + (a.mental > 0 ? '+' : '') + a.mental);
    if (a.stat) parts.push(`${L(STATS.find(s => s.k === a.stat).n)} +${a.val}`);
    if (a.money) parts.push('🪙 ' + a.money);
    addLog(`<b>${disp(m)}</b> ${parts.map(p => p.includes('-') ? bad(p) : good(p)).join(' ')}`);
    hud();
  }

  /* ══════ 이벤트 — 당사자가 말풍선으로 ══════ */
  function EVENTS() {
    const a = alive(), m = pick(a), n = disp(m), Ld = leader();
    const tiredOne = () => a.find(x => x.stamina / x.maxStam < .35) || m;
    const lowOne = () => a.find(x => x.mental < 45) || m;
    const talker = a.find(x => x.key === 'doyun') || Ld;
    return [
      { id: 'scout', cond: () => S.hype > 18, who: m, e: 'sad', t: t('타 기획사의 접촉', 'Another label calls'),
        b: t(`${n}에게 대형 기획사 명함이 들어왔다.`, `A big label slid ${n} a card.`),
        say: t('"솔로로 오면 바로 데뷔시켜 준대요." …저 어떡하죠', '"Come solo, we debut you now," they said. ...What do I do.'),
        o: [{ t: t('보내준다', 'Let him go'), s: t('🪙 +250 GAME OVER', '🪙 +250, GAME OVER'),
              f: () => { S.money += 250; dropOut(m); S.doom = true; addLog(good('🪙 +250') + ' ' + bad('GAME OVER')); },   // 넷 중 하나라도 보내면 끝(사장님, 2026-09-08)
              reply: { e: 'sad', t: ST.LINES[m.key].out } },
            { t: t('밤새 설득한다', 'Talk all night'), s: t('호흡 +14 본인 멘탈 +18 ♥ +8', 'Team +14, his mind +18, ♥ +8'),
              f: () => { S.team = clamp(S.team + 14, 0, 100); m.mental = clamp(m.mental + 18, 0, 100); m.bond = clamp(m.bond + 8, 0, 100); heart(8); addLog(`<b>${n}</b> ${good(t('잔류 호흡 +14', 'stays, Team +14'))}`); },
              reply: { e: 'joy', t: ['…남을게요  여기가 제 팀이에요', "...I'll stay. This is my team."] } }] },
      { id: 'injury', cond: () => a.some(x => x.stamina / x.maxStam < .35), who: tiredOne(), e: 'sad', t: t('손목 부상', 'Wrist injury'),
        b: () => { const h = tiredOne(); return t(`${disp(h)}이(가) 합주 중에 손목을 감쌌다. 부어 있다.`, `${disp(h)} grabbed his wrist mid-jam. It's swollen.`); },
        say: t('괜찮아요. 할 수 있어요. …진짜로요.', "I'm fine. I can do it. ...Really."),
        o: [{ t: t('바로 병원', 'Hospital now'), s: t('🪙 -150, 체력 완전 회복, ♥ +6', '🪙 -150, full stamina, ♥ +6'),
              f: () => { const h = tiredOne(); S.money -= 150; h.stamina = h.maxStam; h.mental = clamp(h.mental + 10, 0, 100); h.bond = clamp(h.bond + 6, 0, 100); heart(6); addLog(`${good(disp(h) + ' OK')} ${bad('🪙 -150')}`); } },
            { t: t('참고 계속', 'Push through'), s: t('45% 확률로 영구 하차', '45% chance he\'s out for good'),
              f: () => { const h = tiredOne(); if (Math.random() < .45) { cutStart([dropOut(h)]); } else { h.mental = clamp(h.mental - 20, 0, 100); h.bond = clamp(h.bond - 6, 0, 100); heart(-6); addLog(bad(`${disp(h)} ${t('멘탈 -20', 'mind -20')}`)); } } }] },
      { id: 'fest', who: Ld, e: 'mad', t: t('음악방송 신인 무대', 'Rookie stage on a music show'),
        b: t('데뷔 전 신인 특별 무대 제안이 왔다. 리허설 일정이 살인적이다.', 'A pre-debut special stage offer. The rehearsal schedule is brutal.'),
        say: t('무대요? 서요. 무조건.', 'A stage? We take it. No question.'),
        o: [{ t: t('선다', 'Take it'), s: t('🔥 +12, 전원 체력 -30%', '🔥 +12, all stamina -30%'),
              f: () => { S.hype = clamp(S.hype + 12, 0, 100); alive().forEach(x => x.stamina = clamp(x.stamina - x.maxStam * .3, 0, x.maxStam)); addLog(good('🔥 +12')); A.sfx.cheer(); } },
            { t: t('거절하고 연습', 'Decline, practice'), s: t('전원 랜덤 스탯 +3', 'Everyone random stat +3'),
              f: () => { alive().forEach(x => { const k = pick(STATS).k; x[k] = clamp(x[k] + 3, 0, 100); }); addLog(good(t('전원 +3', 'Everyone +3'))); } }] },
      { id: 'fight', cond: () => a.length >= 2 && S.team < 55, who: a[1], e: 'mad', t: t('파트 분배 충돌', 'Fight over parts'),
        b: t(`${disp(a[0])}과(와) ${disp(a[1])}이(가) 타이틀곡 편곡을 두고 붙었다.`, `${disp(a[0])} and ${disp(a[1])} clashed over the title-track arrangement.`),
        say: t('이 파트는 제 거예요. 양보 못 해요.', "This part is mine. I won't give it up."),
        o: [{ t: t('리더에게 맡긴다', 'Leave it to the leader'), s: t('리더 끼 55 이상이면 수습', 'Works if leader Charm ≥ 55'),
              f: () => { if (!Ld.out && Ld.charm >= 55) { S.team = clamp(S.team + 12, 0, 100); addLog(`<b>${disp(Ld)}</b> ${good(t('호흡 +12', 'Team +12'))}`); } else { S.team = clamp(S.team - 8, 0, 100); addLog(bad(t('호흡 -8', 'Team -8'))); A.sfx.bad(); } } },
            { t: t('대표가 정리', 'CEO steps in'), s: t('호흡 +5, 전원 멘탈 -8', 'Team +5, all mind -8'),
              f: () => { S.team = clamp(S.team + 5, 0, 100); alive().forEach(x => x.mental = clamp(x.mental - 8, 0, 100)); addLog(`${good(t('호흡 +5', 'Team +5'))} ${bad(t('전원 멘탈 -8', 'all mind -8'))}`); } }] },
      { id: 'brand', who: a.find(x => x.key === 'haru') || Ld, e: 'joy', t: t('의류 브랜드 화보', 'Fashion lookbook offer'),
        b: t('스트릿 브랜드가 룩북 촬영을 제안했다.', 'A street brand wants a lookbook shoot.'),
        say: t('…화보요? 저희가요? 진짜요?', '...A photoshoot? Us? For real?'),
        o: [{ t: t('수락', 'Accept'), s: t('🪙 +300, 무대 +4, 체력 -15%', '🪙 +300, Stage +4, stamina -15%'),
              f: () => { S.money += 300; alive().forEach(x => { x.perf = clamp(x.perf + 4, 0, 100); x.stamina = clamp(x.stamina - x.maxStam * .15, 0, x.maxStam); }); addLog(good(t('🪙 +300, 전원 무대 +4', '🪙 +300, all Stage +4'))); A.sfx.coin(); } },
            { t: t('거절', 'Decline'), s: t('전원 멘탈 +10', 'All mind +10'),
              f: () => { alive().forEach(x => x.mental = clamp(x.mental + 10, 0, 100)); addLog(good(t('전원 멘탈 +10', 'all mind +10'))); } }] },
      { id: 'demo', cond: () => S.hype > 25, who: talker, e: 'joy', t: t('연습 영상 유출', 'Practice video leaked'),
        b: t('홍대 앞 버스킹 영상이 커뮤니티에 돌고 있다.', 'A Hongdae busking clip is going around.'),
        say: t('"이거 어디 그룹임?" 댓글이 천 개예요, 천 개!', '"Who are these guys?" A thousand comments. A thousand!'),
        o: [{ t: t('정식 공개', 'Post it officially'), s: t('🔥 +8, 전원 멘탈 +10', '🔥 +8, all mind +10'),
              f: () => { S.hype = clamp(S.hype + 8, 0, 100); alive().forEach(x => x.mental = clamp(x.mental + 10, 0, 100)); addLog(good('🔥 +8')); A.sfx.cheer(); } },
            { t: t('내린다', 'Take it down'), s: t('호흡 +7', 'Team +7'),
              f: () => { S.team = clamp(S.team + 7, 0, 100); addLog(good(t('호흡 +7', 'Team +7'))); } }] },
      { id: 'rent', cond: () => S.money < 250, who: Ld, e: 'sad', t: t('숙소 월세 독촉', 'Dorm rent is due'),
        b: t('건물주가 문을 두드렸다. "이번 달까지입니다 진짜로"', 'The landlord knocked. "End of this month. Seriously."'),
        say: t('…대표님. 죄송해요. 저희가 뭐라도 할게요.', "...Boss. I'm sorry. We'll do something. Anything."),
        o: [{ t: t('대표 사비', 'CEO pays'), s: '🪙 -200',
              f: () => { S.money -= 200; addLog(bad('🪙 -200')); A.sfx.bad(); } },
            { t: t('전원 알바', 'Everyone works'), s: t('🪙 +320, 체력 -45%', '🪙 +320, stamina -45%'),
              f: () => { S.money += 320; alive().forEach(x => x.stamina = clamp(x.stamina - x.maxStam * .45, 0, x.maxStam)); addLog(`${good('🪙 +320')} ${bad(t('전원 체력 -45%', 'all stamina -45%'))}`); A.sfx.coin(); } }] },
      { id: 'choreo', who: a.find(x => x.key === 'lion') || Ld, e: 'joy', t: t('유명 작곡가 제안', 'Famous songwriter offer'),
        b: t('이름 있는 작곡가가 타이틀곡 편곡을 맡아주겠다고 한다. 단가는 비싸다.', 'A famous songwriter offers to arrange the title track. Not cheap.'),
        say: t('그 분이요?! 진짜요?! …근데 얼마래요?', 'THAT songwriter?! For real?! ...Wait, how much?'),
        o: [{ t: t('맡긴다', 'Hire'), s: t('🪙 -400, 데뷔 평가 +9', '🪙 -400, debut score +9'),
              f: () => { if (S.money >= 400) { S.money -= 400; S.songBuff += 9; addLog(`${good('+9')} 🪙 -400`); } else { addLog(bad(t('🪙 부족', 'Not enough 🪙'))); A.sfx.bad(); } } },
            { t: t('우리끼리', 'Do it ourselves'), s: t('호흡 +8, 전원 작곡 +2', 'Team +8, all Write +2'),
              f: () => { S.team = clamp(S.team + 8, 0, 100); alive().forEach(x => x.write = clamp(x.write + 2, 0, 100)); addLog(good(t('호흡 +8, 전원 작곡 +2', 'Team +8, all Write +2'))); } }] },
      { id: 'bigshow', cond: () => S.hype >= 22 && !S.tasted, who: Ld, e: 'mad', t: t('국민 예능 섭외', 'The big variety show calls'),
        b: t('금요일 밤 국민 예능에서 게스트 제안이 왔다. 홍대병 멤버들이 술렁인다.', 'The nation\'s biggest Friday-night variety show wants you. The Hongdae purists are restless.'),
        say: t('…국민 예능이요  애들이 나갈까요', '...The big show. Will the kids even go.'),
        o: [{ t: t('나간다', 'We go'), s: t('유명세 +16 전원 홍대병 -10 멘탈 ↓', 'Fame +16, all Indie -10, mind ↓'),
              f: () => { S.hype = clamp(S.hype + 16, 0, 100); alive().forEach(x => { x.mental = clamp(x.mental - x.hong / 8, 0, 100); x.hong = clamp(x.hong - 10, 0, 100); }); addLog(good(t('🔥 +16', '🔥 +16'))); A.sfx.cheer(); } },
            { t: t('아직은 이르다', 'Not yet'), s: t('호흡 +6 전원 멘탈 +6', 'Team +6, all mind +6'),
              f: () => { S.team = clamp(S.team + 6, 0, 100); alive().forEach(x => x.mental = clamp(x.mental + 6, 0, 100)); addLog(good(t('호흡 +6', 'Team +6'))); } }] },
      { id: 'slump', cond: () => a.some(x => x.mental < 45), who: lowOne(), e: 'sad', t: t('슬럼프', 'Slump'),
        b: () => { const h = lowOne(); return t(`${disp(h)}이(가) 거울 앞에 두 시간째 서 있다.`, `${disp(h)} has stood at the mirror for two hours.`); },
        say: t('…제가 여기 있어도 되는 사람일까요', '...Do I even belong here?'),
        o: [{ t: t('통째로 쉬게 한다', 'Full rest'), s: t('멘탈 +35 체력 회복 ♥ +6', 'Mind +35, stamina full, ♥ +6'),
              f: () => { const h = lowOne(); h.mental = clamp(h.mental + 35, 0, 100); h.stamina = h.maxStam; h.bond = clamp(h.bond + 6, 0, 100); heart(6); addLog(good(`${disp(h)} ${t('멘탈 +35', 'mind +35')}`)); } },
            { t: t('작은 무대에 세운다', 'Put him on a small stage'), s: t('55% 각성', '55% awakening'),
              f: () => { const h = lowOne(); if (Math.random() < .55) { h.mental = clamp(h.mental + 25, 0, 100); ['vocal', 'perf'].forEach(k => h[k] = clamp(h[k] + 6, 0, 100)); addLog(good(`${disp(h)} ${t('각성! 보컬 무대 +6', 'awakened! Vocal, Stage +6')}`)); A.sfx.great(); } else { h.mental = clamp(h.mental - 25, 0, 100); addLog(bad(`${disp(h)} ${t('멘탈 -25', 'mind -25')}`)); A.sfx.bad(); } } }] },
      { id: 'radio', who: talker, e: 'joy', t: t('심야 라디오 게스트', 'Late-night radio guest'),
        b: t('심야 라디오에서 게스트 제안이 왔다  청취자는 적지만 코어하다', 'A late-night radio show wants you. Few listeners, but loyal.'),
        say: t('라디오! 저 말하는 건 진짜 자신 있는데!', "Radio! Talking is the one thing I'm sure about!"),
        o: [{ t: t('라이브 한 곡', 'One live song'), s: t('🔥 +6 체력 -12%', '🔥 +6, stamina -12%'),
              f: () => { S.hype = clamp(S.hype + 6, 0, 100); alive().forEach(x => x.stamina = clamp(x.stamina - x.maxStam * .12, 0, x.maxStam)); addLog(good('🔥 +6')); } },
            { t: t('토크만', 'Just talk'), s: t('끼 +3 멘탈 +8', 'Charm +3, mind +8'),
              f: () => { alive().forEach(x => { x.charm = clamp(x.charm + 3, 0, 100); x.mental = clamp(x.mental + 8, 0, 100); }); addLog(good(t('전원 끼 +3 멘탈 +8', 'all Charm +3, mind +8'))); } }] },
    ];
  }
  function rollEvent() {
    if (S.week < 2 || Math.random() > .5) return null;
    const pool = EVENTS().filter(e => !S.usedEvents.includes(e.id) && (!e.cond || e.cond()));
    if (!pool.length) return null;
    const e = pick(pool); S.usedEvents.push(e.id); return e;
  }
  function playEvent(e, cb) {
    A.sfx.event();
    const m = e.who;
    const items = [{ m, narr: `📌 ${e.t} — ${typeof e.b === 'function' ? e.b() : e.b}` }, { m, e: e.e, t: e.say },
      { m, choice: e.o.map(o => ({ t: o.t, s: o.s, f: o.f, reply: o.reply })) }];
    cutStart(items, () => { renderTraining(); if (S.doom) return gameOver(); cb(); });
  }

  /* ══════ 컨셉 → 데뷔 ══════ */
  const stars = sc => sc >= 80 ? 5 : sc >= 65 ? 4 : sc >= 45 ? 3 : sc >= 25 ? 2 : 1;   // RANKS 문턱과 같다(무명 1 … 음악방송 1위 5)
  function goConcept() {
    show('concept');
    $('concepts').innerHTML = D.CONCEPTS.map(c => `
      <div class="cc" style="--cc-acc:${c.acc}" data-c="${c.id}">
        <div class="ico">${c.ico}</div><div class="cn">${L(c.n)}</div><div class="cd">${L(c.d)}</div>
        <div class="w">${STATS.map(s => `<div class="wb" title="${L(s.n)}"><i style="height:${Math.round(c.w[s.k] * 300)}%;background:${s.c}"></i><b>${L(s.n)}</b></div>`).join('')}</div>
        <div class="note">${L(c.note)}</div>
        <div class="stars num">${'★'.repeat(stars(calcScore(c)))}<span>${'★'.repeat(5 - stars(calcScore(c)))}</span></div></div>`).join('');
    $('concepts').querySelectorAll('.cc').forEach(el => el.onclick = () => release(el.dataset.c));
    const a = alive(), avg = k => a.reduce((s, m) => s + m[k], 0) / a.length;
    $('conceptHint').innerHTML = STATS.map(s => bar(s.n, avg(s.k), s.c)).join('') +
      `<div style="font-size:28.8px;color:var(--dim);margin-top:9px" class="num">🤝 ${Math.round(S.team)}, 🔥 ${Math.round(S.hype)}, 👥 ${a.length}, 🪙 ${S.money}</div>`;
  }
  function calcSkill(c) {
    const a = alive();
    let base = 0;
    a.forEach(m => {
      let p = STATS.reduce((s, st) => s + m[st.k] * c.w[st.k], 0);
      p *= m.trait.stage; p *= (0.72 + m.mental / 100 * 0.38); p *= (0.85 + (m.stamina / m.maxStam) * 0.2);
      if (m.bond >= 80) p *= 1.05;
      base += p;
    });
    base /= a.length;
    if (a.length < N) base *= (0.80 + a.length * 0.05);
    const avgWrite = a.reduce((s, m) => s + m.write, 0) / a.length;
    let skill = base * (c.baseMul || 1);
    skill += S.team * 0.12 * (c.teamMul || 1);
    skill += (avgWrite - 38) * 0.22;
    skill += S.songBuff;
    if (c.balance) {
      const tot = a.map(m => STATS.reduce((s, st) => s + m[st.k], 0));
      const mean = tot.reduce((s, v) => s + v, 0) / tot.length;
      const sd = Math.sqrt(tot.reduce((s, v) => s + (v - mean) ** 2, 0) / tot.length);
      skill += clamp(6 - sd * 0.20, 0, 6);
    }
    return clamp(skill, 0, 100);
  }
  function calcScore(c) { return clamp(clamp(S.hype * (c.fameMul || 1), 0, 100) * 0.72 + calcSkill(c) * 0.42, 0, 125); }
  function release(cid) {
    const c = D.CONCEPTS.find(x => x.id === cid), a = alive();
    S.concept = c;
    const skill = calcSkill(c);
    const fame = clamp(S.hype * (c.fameMul || 1), 0, 100);
    let score = fame * 0.72 + skill * 0.42;
    score = clamp(score, 0, 125);
    const R = D.RANKS.find(r => score >= r.min);

    let best = 0; try { best = +localStorage.getItem('boyband.best') || 0; } catch (e) { }
    const newBest = score > best;
    if (newBest) try { localStorage.setItem('boyband.best', score.toFixed(1)); } catch (e) { }

    show('result');
    const out = score < 45;
    const win = score >= 45;   // 라이브클럽 매진부터 뮤비, 원곡. 아래면 어두운 놀이터에 넷이 가만히
    buildStage($('resultStage'), a, { confetti: score >= 80, stick: c.stick, sign: win ? S.name : '', dim: !win, still: !win, noCrowd: !win });
    if (win) { $('resultStage').insertAdjacentHTML('beforeend', `<video class="mv" src="assets/mv.mp4" autoplay muted loop playsinline></video>`); A.ending(); }
    else A.quiet();
    $('rsRank').textContent = L(R.rank); $('rsRank').classList.toggle('big', !!R.big);
    $('rsScore').innerHTML = `<span>${c.ico} ${L(c.n)}</span><span class="num">SCORE ${score.toFixed(1)}</span><span class="num">🔥 ${Math.round(fame)}</span><span class="num">🎵 ${Math.round(skill)}</span><span class="num">🤝 ${Math.round(S.team)}</span>`;
    $('rsBest').innerHTML = newBest && best > 0 ? `<div class="best">NEW BEST</div>` : best > 0 ? `<div class="pos num">BEST ${best.toFixed(1)}</div>` : '';
    $('rsText').textContent = L(R.txt);
    $('rsMembers').innerHTML = S.members.map(m => {
      if (m.out) return `<div class="li"><b>${m.en}</b> ${bad('OUT')}</div>`;
      const total = STATS.reduce((s, st) => s + m[st.k], 0);
      const bestSt = STATS.map(st => [L(st.n), m[st.k]]).sort((x, y) => y[1] - x[1])[0];
      const epi = ST.EPILOGUE[m.key][m.bond >= 60 ? 0 : 1];
      return `<div class="li"><b>${m.en}</b> <span style="color:var(--dim);font-size:26.4px">${m.kr}</span> ${L(m.pos)} ${m.id === S.leaderId ? '👑' : ''} <span style="color:var(--pink)" class="num">♥ ${Math.round(m.bond)}</span><span style="color:var(--dim)">, ${L(m.trait.n)}</span><br>
        <span style="font-size:27.6px;color:var(--dim)" class="num">${STATS.map(st => `${L(st.n)} ${Math.round(m[st.k])}`).join(' / ')}, TOTAL <b style="color:var(--gold)">${Math.round(total)}</b>, ${good(bestSt[0])}</span><br>
        <span style="font-size:33.6px;color:var(--txt)">${L(epi)}</span></div>`;
    }).join('');
    if (score >= 80) setTimeout(A.sfx.cheer, 400);
    else if (!win) A.sfx.rain();
    // 멤버들의 마지막 한마디 + 뒷이야기
    const k = score >= 60 ? 'win' : 'lose';
    const items = [];
    a.forEach(m => { items.push({ m, e: k === 'win' ? 'joy' : 'sad', t: ST.LINES[m.key][k] }); items.push({ m, narr: ST.EPILOGUE[m.key][m.bond >= 60 ? 0 : 1] }); });
    if (!win) items.push(...ST.PRODUCER.fail);
    if (win) {   // 뮤비 한 바퀴 뒤에(길이는 영상에서 읽는다) / 실패면 바로
      let fired = false; const go = () => { if (fired) return; fired = true; cutStart(items); };
      const mv = $('resultStage').querySelector('video.mv');
      if (mv) { const arm = () => setTimeout(go, mv.duration * 1000 + 500); if (mv.duration) arm(); else mv.addEventListener('loadedmetadata', arm, { once: true }); }
      setTimeout(go, 40000);
    } else setTimeout(() => cutStart(items), 1200);
  }
  function gameOver() {
    A.sfx.rain(); A.music(false);
    $('overlay').innerHTML = `<div class="ovl"><div class="modal center">
      <div class="rank" style="font-size:96px">GAME OVER</div>
      <div class="pos num" style="margin:6px 0 18px">🪙 ${S.money}</div>
      <button class="btn" id="goRetry">RETRY</button></div></div>`;
    $('goRetry').onclick = () => location.reload();
  }
  $('btnRetry').onclick = () => location.reload();

  /* 시험용 손잡이 — 미리보기 창에서 판을 빨리 돌려 본다 */
  window.__bb = { S, CUT, runWeek, afterEpisodes, release, goConcept, playEvent, playEpisode, EVENTS, buildStage, cutStart, cutNext, playVideo };
})();
