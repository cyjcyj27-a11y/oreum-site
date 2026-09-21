/* 모에모에 메이드카페 — 게임 본체 (방치형 메이드카페 경영) */
(function () {
  'use strict';
  const EN = (() => { try { return new URLSearchParams(location.search).get('lang') === 'en'; } catch (_) { return false; } })();
  if (EN) { document.documentElement.lang = 'en'; document.title = 'Moe Moe Maid Cafe — Oreum Games'; document.querySelectorAll('[data-en]').forEach(e => { e.innerHTML = e.getAttribute('data-en'); }); }
  const L = (ko, en) => EN ? en : ko;
  const $ = id => document.getElementById(id);
  const W = 1280, H = 720;
  const c = $('c'), ctx = c.getContext('2d');
  const bgc = document.createElement('canvas'); bgc.width = W; bgc.height = H; const bgx = bgc.getContext('2d');
  const { ell, rr, lin, rad, heart, star } = ART;
  const MAIDS = ART.MAIDS, BYID = {}; MAIDS.forEach(m => BYID[m.id] = m);
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Math.floor(n).toLocaleString('en-US');

  // ── 자리 ──
  const TABLES = [[470, 470], [690, 470], [910, 470], [470, 620], [690, 620], [910, 620]];
  const KITCHEN_SPOTS = [{ x: 120, y: 508 }, { x: 210, y: 508 }, { x: 300, y: 508 }];
  function kitchenSpot(md) { // 덜 쓰이는 조리 자리
    const cnt = KITCHEN_SPOTS.map(() => 0); maids.forEach(o => { if (o !== md && (o.state === 'toKitchen' || o.state === 'cook') && o.kslot !== undefined) cnt[o.kslot]++; });
    let best = 0; cnt.forEach((c, i) => { if (c < cnt[best]) best = i; }); md.kslot = best; return KITCHEN_SPOTS[best];
  }
  const DOOR = { x: 1200, y: 395 }, EXIT = { x: 1200, y: 330 };
  const QUEUE = [{ x: 1195, y: 520 }, { x: 1195, y: 600 }, { x: 1120, y: 665 }, { x: 1040, y: 690 }];
  const IDLE_SPOTS = [{ x: 580, y: 690 }, { x: 800, y: 690 }, { x: 1010, y: 560 }, { x: 1060, y: 650 }, { x: 590, y: 560 }, { x: 810, y: 560 }, { x: 380, y: 690 }, { x: 1000, y: 690 }];
  const STAGE = { x: 190, y: 654 };
  const FOODS = { omu: { p: 16, t: 2.6, menu: 0 }, coffee: { p: 9, t: 1.3, menu: 0 }, parfait: { p: 14, t: 2.1, menu: 1 }, cake: { p: 13, t: 1.7, menu: 2 } };
  const RANKS = [0, 70, 130, 220, 350, 520, 780, 1200, 1900, 2800, 4000, 5200]; // 누적 하트, index 0 = 12위. 9/21 사장님: 부지런한 봇이 다 산 뒤 5분에 엔딩(팁 원래대로) → 5200
  const CUST_KINDS = [ // 손님 12종 (img/custs/<sheet>.webp)
    { kind: 'otaku', sheet: 'custA' }, { kind: 'otaku2', sheet: 'custB' }, { kind: 'salary', sheet: 'custC' }, { kind: 'girl', sheet: 'custD' },
    { kind: 'otakuF', sheet: 'custE' }, { kind: 'student', sheet: 'custF' }, { kind: 'uncle', sheet: 'custG' }, { kind: 'hsboy', sheet: 'custH' },
    { kind: 'hsgirl', sheet: 'custI' }, { kind: 'grandpa', sheet: 'custJ' }, { kind: 'fangirl', sheet: 'custK' }, { kind: 'office', sheet: 'custL' },
  ].filter(k => !window.CUSTMETA || window.CUSTMETA[k.sheet]);
  const SHOP = [
    { id: 'table', ic: '🪑', name: '테이블', en: 'Table', sub: '자리 +1', ensub: 'Seat +1', max: 4, cost: lv => [250, 500, 900, 1500][lv] }, // 9/21 사장님: 인플레 심함 → 700·1800·4500 에서 내림
    { id: 'kitchen', ic: '🍳', name: '주방', en: 'Kitchen', sub: '조리 속도', ensub: 'Cooking speed', max: 5, cost: lv => [180, 350, 650, 1100, 1800][lv] }, // 9/21 사장님: 2.2배씩(→4220)에서 내림
    { id: 'menu', ic: '📖', name: '메뉴', en: 'Menu', sub: '파르페 · 케이크 · 스페셜', ensub: 'Parfait · Cake · Special', max: 3, cost: lv => [400, 1500, 5000][lv] },
    { id: 'decor', ic: '🖼️', name: '인테리어', en: 'Decor', sub: '팁 +15%', ensub: 'Tips +15%', max: 5, cost: lv => [300, 900, 2400, 6000, 15000][lv] },
    { id: 'sign', ic: '🪧', name: '간판', en: 'Sign', sub: '손님 더 자주', ensub: 'More customers', max: 5, cost: lv => [220, 450, 800, 1300, 2000][lv] }, // 9/21 사장님: 2.4배씩(→7300)에서 내림
    { id: 'neko', ic: '🐱', name: '마네키네코', en: 'Lucky Cat', sub: '자동 수금', ensub: 'Auto collect', max: 1, cost: () => 2500 },
  ];
  const MISSIONS = [
    { ic: '🍽', t: '손님 10명', en: 'Serve 10 customers', rw: 200, ok: () => S.stats.served >= 10, pr: () => S.stats.served + '/10' },
    { ic: '🪙', t: '코인 1,000', en: 'Earn 1,000 coins', rw: 300, ok: () => S.stats.coins >= 1000, pr: () => fmt(S.stats.coins) + '/1,000' },
    { ic: '🎀', t: '메이드 3명', en: '3 maids', rw: 500, ok: () => owned().length >= 3, pr: () => owned().length + '/3' },
    { ic: '🪑', t: '테이블 4개', en: '4 tables', rw: 600, ok: () => tableCount() >= 4, pr: () => tableCount() + '/4' },
        { ic: '💗', t: '하트 500', en: '500 hearts', rw: 1000, ok: () => S.hearts >= 500, pr: () => fmt(S.hearts) + '/500' },
    { ic: '🙋', t: '주문 받기 30번', en: 'Take 30 orders', rw: 1200, ok: () => (S.stats.orders || 0) >= 30, pr: () => (S.stats.orders || 0) + '/30' },
    { ic: '✨', t: 'PERFECT 20번', en: 'PERFECT ×20', rw: 1500, ok: () => (S.stats.perfect || 0) >= 20, pr: () => (S.stats.perfect || 0) + '/20' },
    { ic: '🌟', t: 'SSR 메이드', en: 'Scout an SSR maid', rw: 2000, ok: () => owned().some(id => BYID[id].rar === 3), pr: () => '' },
    { ic: '🏆', t: '아키바 6위', en: 'Akiba rank 6', rw: 3000, ok: () => rankIdx() >= 6, pr: () => L('현재 ', 'now ') + (12 - rankIdx()) + L('위', '') },
    { ic: '⬆', t: '메이드 레벨 10', en: 'A maid at level 10', rw: 4000, ok: () => owned().some(id => S.maids[id].lv >= 10), pr: () => '' },
    { ic: '🍽', t: '손님 500명', en: 'Serve 500 customers', rw: 6000, ok: () => S.stats.served >= 500, pr: () => S.stats.served + '/500' },
    { ic: '👑', t: '메이드 12명 전원', en: 'All 12 maids', rw: 10000, ok: () => owned().length >= 12, pr: () => owned().length + '/12' },
  ];

  // ── 상태 ──
  let S = null, maids = [], custs = [], piles = [], parts = [], flying = [], confetti = [];
  let playing = false, lastT = 0, spawnT = 3, saveT = 0, gT = 0, panelTab = null, gachaBusy = false, endShown = false, stageT = 0;
  const owned = () => Object.keys(S.maids);
  const SHIFT_MAX = 3; // 한 번에 일하는 메이드 수
  const shift = () => { if (!S.shift) S.shift = owned().slice(0, SHIFT_MAX); return S.shift; };
  const tableCount = () => 2 + (S.up.table || 0);
  const rankIdx = () => { let i = 0; for (let k = 0; k < RANKS.length; k++) if (S.hearts >= RANKS[k]) i = k; return i; };
  const priceMult = () => (1 + .08 * rankIdx()) * (1 + .15 * (S.up.decor || 0)) * (S.up.menu >= 3 ? 1.25 : 1);
  const moeBonus = m => Math.min(1, ((S.maids[m.id] || {}).moe || 0) * .01); // 모에모에큥 한 번에 +1%, 최대 +100%
  const skillVal = (m, type) => (m && m.skill && m.skill.type === type) ? m.skill.v * (1 + .05 * ((S.maids[m.id] || { lv: 1 }).lv - 1) + moeBonus(m)) : 0;
  const skillText = m => { const moe = Math.round(moeBonus(m) * 100); const tot = m.skill.type === 'perfect' ? '×' + (1 + skillVal(m, 'perfect')).toFixed(1) : '+' + Math.round(skillVal(m, m.skill.type) * 100) + '%'; return L(m.skill.ko, m.skill.en) + (moe > 0 ? '<br><b class="moe">♡' + moe + '% → ' + tot + '</b>' : ''); };
  const spdMult = m => 1 + skillVal(m, 'speed');
  const cookMult = m => 1 + skillVal(m, 'cook');
  const charm = m => 1 + .04 * (S.maids[m.id].lv - 1); // 레벨 보정(팁 하트)
  const shiftVal = type => Math.max(0, ...shift().map(id => skillVal(BYID[id], type)));
  const gachaCost = () => Math.round(300 * Math.pow(1.3, S.pulls) / 10) * 10;
  const lvCost = lv => Math.round(100 * Math.pow(1.35, lv - 1) / 10) * 10;
  const menuFoods = () => Object.keys(FOODS).filter(f => FOODS[f].menu <= (S.up.menu || 0));

  function newState() {
    return { coins: 0, hearts: 0, time: 0, day: 1, t: Date.now(), maids: { yui: { lv: 1 } }, shift: ['yui'], up: { table: 0, kitchen: 0, menu: 0, decor: 0, sign: 0, neko: 0 }, pulls: 0, sinceNew: 0, stats: { served: 0, coins: 0, omu: 0, moe: 0, left: 0, orders: 0, perfect: 0 }, done: [], seen: [], ended: false, v: 1 };
  }
  function save() { if (!S) return; S.t = Date.now(); try { localStorage.setItem('maidcafe.save', JSON.stringify(S)); } catch (_) { } }
  function load() { try { const j = JSON.parse(localStorage.getItem('maidcafe.save')); if (j && j.maids) return j; } catch (_) { } return null; }

  // ── 그림 캐시 (초상) ──
  const PC = {};
  function portraitCanvas(m, w, h, opt) {
    const k = m.id + ':' + w + ':' + h + ':' + (opt && opt.key || '');
    if (PC[k]) return PC[k];
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
    x.fillStyle = lin(x, 0, 0, 0, h, [[0, m.rar === 3 ? '#fff3d0' : m.rar === 2 ? '#f0e0ff' : '#ffe6ee'], [1, m.rar === 3 ? '#ffd88a' : m.rar === 2 ? '#d8b8ff' : '#ffc0d4']]); x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 8; i++) { star(x, 8 + (i * 61) % (w - 16), 10 + (i * 47) % (h - 20), 4, 1.6, 4); x.fill(); }
    SPR.portrait(x, m, w, h, opt || { t: 0, face: { eyes: 'open', mouth: 'smile', blush: .5 } });
    PC[k] = cv; return cv;
  }

  // ── 배경 ──
  function rebuildBg() { SCENE.background(bgx, S, EN); }

  // ── 화면 크기 ──
  function fit() {
    const vw = innerWidth, vh = innerHeight, r = Math.min(vw / W, vh / H);
    c.style.width = Math.round(W * r) + 'px'; c.style.height = Math.round(H * r) + 'px';
  }
  addEventListener('resize', fit); fit();
  function toCanvas(e) { const b = c.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H }; }

  // ── 알림 ──
  let toastT = null;
  function toast(txt, cls, sub) { const t = $('toast'); t.className = cls || ''; t.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : ''); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
  function hud() {
    $('dayN').textContent = 'DAY ' + S.day; $('coinN').textContent = fmt(S.coins);
    const ri = rankIdx(), lo = RANKS[ri], hi = RANKS[ri + 1];
    $('rankN').textContent = (12 - ri) + L('위', ''); $('rankBar').style.width = (hi ? clamp((S.hearts - lo) / (hi - lo), 0, 1) * 100 : 100) + '%'; $('rankT').textContent = fmt(S.hearts);
    $('maidN').textContent = shift().length + '·' + owned().length + '/12';
    const full = owned().length >= 12; $('scoutCost').textContent = full ? 'COMPLETE' : '🪙 ' + fmt(gachaCost()); $('btnScout').classList.toggle('on', !full && S.coins >= gachaCost()); $('btnScout').classList.toggle('done', full);
    $('btnShop').classList.toggle('on', SHOP.some(it => (S.up[it.id] || 0) < it.max && S.coins >= it.cost(S.up[it.id] || 0)));
    $('btnMission').classList.toggle('new', MISSIONS.some((m, i) => !S.done.includes(i) && m.ok()));
    $('btnAlbum').classList.toggle('new', owned().some(id => !S.seen.includes(id)));
    $('pMoney').textContent = fmt(S.coins); $('pMaids').textContent = owned().length;
  }

  // ── 입자 ──
  function burst(x, y, n, kind) { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-14, 14), y: y + rnd(-10, 10), vx: rnd(-40, 40), vy: rnd(-90, -40), life: rnd(.8, 1.4), age: 0, kind: kind || 'heart', s: rnd(5, 9), col: pick(['#ff5a8a', '#ff8ab8', '#ffb0d0', '#ff3a6a']) }); }
  function sparkle(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-30, 30), y: y + rnd(-40, 10), vx: rnd(-20, 20), vy: rnd(-30, -5), life: rnd(.5, 1), age: 0, kind: 'star', s: rnd(3, 6), col: pick(['#fff', '#ffe08a', '#ffd0e0']) }); }
  function flyCoins(x, y, val) { const n = clamp(Math.round(val / 6), 3, 12); for (let i = 0; i < n; i++) flying.push({ x: x + rnd(-20, 20), y: y + rnd(-10, 10), sx: x, sy: y, t: -i * .05, dur: .7 }); }
  function popText(x, y, txt, col, s) { parts.push({ x, y, vx: 0, vy: -40, life: 1.1, age: 0, kind: 'txt', txt, col: col || '#ffd24a', s: s || 20 }); }

  // ── 손님 ──
  function spawnCust() {
    const onScreen = new Set(custs.map(c => c.k.sheet)); const fresh = CUST_KINDS.filter(k => !onScreen.has(k.sheet)); const k = pick(fresh.length ? fresh : CUST_KINDS); const cu = { k, x: DOOR.x, y: DOOR.y - 60, ph: 0, face: { eyes: 'open', mouth: 'line' }, patience: 45, timer: 0, table: -1, food: pick(menuFoods()), dir: 1, path: [] };
    setPath(cu, [DOOR], 'arrived'); custs.push(cu); SND.play('bell'); return cu;
  }
  function freeTable() { for (let i = 0; i < tableCount(); i++) if (!custs.some(x => x.table === i) && !piles.some(p => p.table === i)) return i; return -1; }
  function queueSlot() { for (let i = 0; i < QUEUE.length; i++) if (!custs.some(x => x.state === 'queue' && x.slot === i)) return i; return -1; }
  function walkTo(o, tx, ty, spd, dt) { const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d < 2) { o.x = tx; o.y = ty; return true; } const st = Math.min(d, spd * dt); o.x += dx / d * st; o.y += dy / d * st; o.ph = (o.ph + dt * spd / 55) % 1; o.dir = dx > 0 ? 1 : -1; return false; }
  const LANE = 545, HALL = 1190;
  function setPath(o, pts, next) { o.path = pts.slice(); o.next = next; o.state = 'path'; }
  function stepPath(o, spd, dt) { if (!o.path || !o.path.length) { o.state = o.next; return true; } const p = o.path[0]; if (walkTo(o, p.x, p.y, spd, dt)) { o.path.shift(); if (!o.path.length) { o.state = o.next; return true; } } return false; }
  function routeTo(from, to) { // 복도(LANE)를 거쳐 가는 길
    const pts = []; if (Math.abs(from.y - LANE) > 24) pts.push({ x: from.x, y: LANE }); if (Math.abs(to.x - from.x) > 4) pts.push({ x: to.x, y: LANE }); pts.push({ x: to.x, y: to.y }); return pts;
  }
  function tickCust(cu, dt) {
    const spd = 120;
    switch (cu.state) {
      case 'path': if (stepPath(cu, spd, dt)) { if (cu.state === 'order') { cu.timer = 0; cu.ordered = false; cu.orderT = 0; cu.face = { eyes: 'sparkle', mouth: 'open' }; } if (cu.state === 'gone') cu.dead = true; } break;
      case 'arrived': { const t = freeTable(); if (t >= 0) seat(cu, t); else { const q = queueSlot(); if (q >= 0) { cu.slot = q; cu.timer = 0; setPath(cu, [QUEUE[q]], 'queue'); } else { S.stats.left++; setPath(cu, [EXIT], 'gone'); } } break; }
      case 'queue': { cu.timer += dt; const t = freeTable(); if (t >= 0) { seat(cu, t); break; } if (cu.timer > 30) { cu.face = { eyes: 'tired', mouth: 'wobble' }; S.stats.left++; SND.play('leave'); setPath(cu, [{ x: HALL, y: LANE }, EXIT], 'gone'); } break; }
      case 'order': cu.timer += dt; if (!cu.ordered) { cu.orderT += dt; if (cu.orderT > 8) { cu.ordered = true; cu.face = { eyes: 'open', mouth: 'smile' }; } } if (cu.timer > cu.patience) { leaveTable(cu, true); } else if (cu.timer > cu.patience * .65) cu.face = { eyes: 'dot', mouth: 'wobble' }; break;
      case 'eating': cu.timer += dt; if (cu.timer > 1.2) cu.face = { eyes: 'happy', mouth: 'open', blush: .6 }; if (cu.timer > cu.eatT) pay(cu); break;
    }
  }
  function seat(cu, t) {
    cu.table = t; cu.patience = (40 + (S.up.decor || 0) * 4) * (1 + shiftVal('patience')); const tp = TABLES[t], sp = SCENE.seatPos(tp[0], tp[1]);
    setPath(cu, [{ x: HALL, y: LANE }, { x: tp[0] + 110, y: LANE }, { x: tp[0] + 110, y: sp.y }, { x: sp.x, y: sp.y }], 'order');
  }
  function leaveTable(cu, sad) {
    const tp = TABLES[cu.table], sp = SCENE.seatPos(tp[0], tp[1]); cu.table = -1;
    if (sad) { cu.face = { eyes: 'tired', mouth: 'wobble' }; S.stats.left++; SND.play('leave'); if (cu.maid) { cu.maid.job = null; cu.maid = null; } }
    setPath(cu, [{ x: tp[0] + 110, y: sp.y }, { x: tp[0] + 110, y: LANE }, { x: HALL, y: LANE }, EXIT], 'gone');
  }
  function pay(cu) {
    const m = cu.servedBy || MAIDS[0]; const base = FOODS[cu.food].p * priceMult() * (1 + skillVal(m, 'price'));
    const val = Math.round(base * rnd(.9, 1.15) * (cu.perfect ? 2 : 1)); const tp = TABLES[cu.table];
    const special = Math.random() < .08 ? (Math.random() < .6 ? 'letter' : 'gift') : null;
    piles.push({ table: cu.table, x: tp[0], y: tp[1] - 20, val: val, special, t: 0, n: clamp(Math.round(val / 8), 2, 9) });
    const tip = Math.round((2 + rnd(0, 1.5)) * charm(m) * (1 + skillVal(m, 'tip'))); S.hearts += tip; burst(tp[0], tp[1] - 60, 3, 'heart'); popText(tp[0] + 30, tp[1] - 70, '+' + tip + '💗', '#ff7ab0');
    S.stats.served++; if (cu.food === 'omu') S.stats.omu++;
    cu.face = { eyes: 'heart', mouth: 'smile', blush: .8 }; SND.play('coin'); leaveTable(cu, false);
  }
  // 손님 자리 (앉음) 그리기
  function drawSeated(cu, tp) { const sp = SCENE.seatPos(tp[0], tp[1]); const f = Object.assign({ food: cu.food }, cu.face || {}); SPR.customer(ctx, cu.k, { x: sp.x, y: sp.y, scale: 1.15, pose: cu.state === 'eating' && cu.timer > 1.2 ? 'eat' : 'sit', face: f, shadow: false, t: gT }); }
  function drawBubble(x, y, food, prog, danger) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = danger ? '#ff5a6a' : '#c8a0b0'; ctx.lineWidth = 1.5;
    rr(ctx, -20, -40, 40, 34, 10); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(0, 2); ctx.lineTo(6, -7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = danger ? '#ff5a6a' : '#c8a0b0'; ctx.beginPath(); ctx.moveTo(-6, -6.5); ctx.lineTo(0, 2); ctx.lineTo(6, -6.5); ctx.stroke();
    ART.drawFood(ctx, 0, -18, food, 1.7);
    if (prog !== undefined) { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -23, 17, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = danger ? '#ff5a6a' : '#ff8ab8'; ctx.beginPath(); ctx.arc(0, -23, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke(); }
    ctx.restore();
  }

  // 조리 타이밍 게이지: 표식이 왔다 갔다, 색칠 구간에서 메이드를 탭하면 PERFECT
  const ZONE_BASE = [.58, .86];
  const zoneOf = md => { const w = (ZONE_BASE[1] - ZONE_BASE[0]) * (1 + skillVal(md.m, 'perfect')); return [Math.max(.2, ZONE_BASE[1] - w), ZONE_BASE[1]]; };
  function gaugePos(md) { return (Math.sin((gT - md.g0) * 1.9) + 1) / 2; }
  function drawGauge(md) {
    const w = 104, h = 14, x = md.x - w / 2, y = md.y - 200; ctx.save();
    const k = .5 + Math.sin(gT * 7) * .5;
    rr(ctx, x - 3, y - 3, w + 6, h + 6, 8); ctx.fillStyle = 'rgba(40,10,30,.55)'; ctx.fill(); if (!md.tapped) { ctx.strokeStyle = 'rgba(255,' + Math.round(180 + 75 * k) + ',220,' + (.6 + .4 * k) + ')'; ctx.lineWidth = 2; ctx.stroke(); }
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = md.tapped ? '#8a8a96' : '#fff'; ctx.fill();
    const ZONE = zoneOf(md); ctx.fillStyle = md.tapped ? (md.perfect ? '#ffd24a' : '#b8b8c4') : '#ff5a8a'; rr(ctx, x + w * ZONE[0], y, w * (ZONE[1] - ZONE[0]), h, 5); ctx.fill();
    if (!md.tapped) { ctx.font = "bold 10px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#4a1030'; ctx.strokeText('PERFECT', x + w * (ZONE[0] + ZONE[1]) / 2, y + h + 12); ctx.fillStyle = '#ff8ab8'; ctx.fillText('PERFECT', x + w * (ZONE[0] + ZONE[1]) / 2, y + h + 12); }
    const p = gaugePos(md); ctx.fillStyle = '#2a1a2a'; ctx.beginPath(); ctx.moveTo(x + w * p, y - 2); ctx.lineTo(x + w * p - 6, y - 12); ctx.lineTo(x + w * p + 6, y - 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + w * p, y - 4); ctx.lineTo(x + w * p - 3, y - 9.5); ctx.lineTo(x + w * p + 3, y - 9.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 주문 부르는 말풍선 (탭하면 주문 받음)
  function drawCall(x, y) {
    const k = .5 + Math.sin(gT * 6) * .5; ctx.save(); ctx.translate(x, y - k * 3);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff7ab0'; ctx.lineWidth = 2 + k;
    rr(ctx, -22, -42, 44, 36, 11); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(0, 2); ctx.lineTo(6, -7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.beginPath(); ctx.moveTo(-6, -6.5); ctx.lineTo(0, 2); ctx.lineTo(6, -6.5); ctx.stroke();
    ctx.font = "26px sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#333'; ctx.fillText('🙋', 0, -23); ctx.restore();
  }
  // ── 메이드 ──
  function makeMaid(id, i) { const sp = IDLE_SPOTS[i % IDLE_SPOTS.length]; return { m: BYID[id], id, x: sp.x + rnd(-20, 20), y: sp.y, state: 'idle', ph: 0, job: null, timer: rnd(1, 4), pose: 'idle', face: null, dir: 0, food: 'omu' }; }
  function syncMaids(all) {
    const ids = all ? owned() : shift();
    maids = maids.filter(md => { if (ids.includes(md.id)) return true; if (md.job) { md.job.maid = null; md.job = null; } return false; }); // 퇴근
    ids.forEach((id, i) => { if (!maids.some(m => m.id === id)) { const md = makeMaid(id, i); md.x = KITCHEN_SPOTS[1].x; md.y = KITCHEN_SPOTS[1].y + 40; maids.push(md); } });
  }
  function setShift(id, on) { const sh = shift(); if (on) { if (sh.includes(id)) return; sh.push(id); while (sh.length > SHIFT_MAX) sh.shift(); } else { if (sh.length <= 1) return; const i = sh.indexOf(id); if (i >= 0) sh.splice(i, 1); } syncMaids(); }
  function maidSpeed(md) { return 115 * spdMult(md.m); }
  function tickMaid(md, dt) {
    const spd = maidSpeed(md);
    if (md.moeCd > 0) md.moeCd -= dt;
    if (md.moeT > 0) { md.moeT -= dt; md.pose = 'moe'; if (md.moeT <= 0 && md.state !== 'stage') md.face = null; return; } // 모에큥 하는 1.2초는 하던 일을 멈춘다
    switch (md.state) {
      case 'idle': {
        md.pose = 'idle'; md.timer -= dt;
        const job = custs.find(cu => cu.state === 'order' && cu.ordered && !cu.maid);
        if (job) { job.maid = md; md.job = job; md.food = job.food; md.state = 'toKitchen'; break; }
        if (md.timer <= 0) { md.timer = rnd(4, 9); if ((S.up.decor || 0) >= 5 && Math.random() < .35 && !maids.some(o => o.state === 'stage' || o.state === 'toStage')) { md.path = routeTo(md, STAGE); md.state = 'toStage'; } else { const sp = pick(IDLE_SPOTS); md.path = routeTo(md, { x: sp.x + rnd(-30, 30), y: sp.y + rnd(-8, 8) }); md.state = 'wander'; } }
        break;
      }
      case 'wander': { md.pose = 'walk'; const job = custs.find(cu => cu.state === 'order' && cu.ordered && !cu.maid); if (job) { job.maid = md; md.job = job; md.food = job.food; md.state = 'toKitchen'; md.path = null; break; } md.next = 'idle'; if (stepPath(md, spd * .6, dt)) { md.timer = rnd(3, 8); } break; }
      case 'toStage': { md.pose = 'walk'; md.next = 'stage'; if (stepPath(md, spd * .7, dt)) { md.timer = rnd(8, 14); md.st = 0; } break; }
      case 'stage': { md.timer -= dt; md.st += dt; md.pose = Math.floor(md.st * 1.6) % 2 ? 'wave' : 'moe'; md.face = { eyes: 'happy', mouth: 'open', blush: .8 }; if (Math.random() < dt * 1.2) { burst(md.x + rnd(-30, 30), md.y - 90, 1, 'heart'); S.hearts += 1; } const job = custs.find(cu => cu.state === 'order' && cu.ordered && !cu.maid); if (md.timer <= 0 || job) { md.state = 'idle'; md.face = null; md.timer = 0; } break; }
      case 'toKitchen': { md.pose = 'walk'; if (!md.job || (md.job.state !== 'order' && md.job.state !== 'path')) { md.job = null; md.state = 'idle'; break; } if (!md.path || !md.path.length) md.path = routeTo(md, kitchenSpot(md)); md.next = 'cook'; if (stepPath(md, spd, dt)) { if (maids.some(o => o !== md && o.state === 'cook' && o.kslot === md.kslot)) { const free = KITCHEN_SPOTS.findIndex((sp, i) => !maids.some(o => o !== md && (o.state === 'cook' || o.state === 'toKitchen') && o.kslot === i)); if (free >= 0) { md.kslot = free; md.state = 'toKitchen'; md.path = routeTo(md, KITCHEN_SPOTS[free]); break; } } md.timer = 0; md.cookT = FOODS[md.food].t / (1 + .18 * (S.up.kitchen || 0)) / cookMult(md.m); md.dir = -1; md.path = null; md.tapped = false; md.perfect = false; md.g0 = gT; } break; }
      case 'cook': { md.pose = 'idle'; md.timer += dt; if (!md.job || (md.job.state !== 'order' && md.job.state !== 'path')) { md.job = null; md.state = 'idle'; break; } if ((md.timer >= md.cookT * 2.5 || md.tapped) && md.job.state === 'order') { md.state = 'toTable'; SND.play('serve'); } break; }
      case 'toTable': { md.pose = 'carry'; if (!md.job || md.job.state !== 'order') { md.job = null; md.state = 'idle'; md.path = null; break; } const tp = TABLES[md.job.table]; if (!md.path || !md.path.length) md.path = routeTo(md, { x: tp[0] - 62, y: tp[1] + 6 }); md.next = 'serve'; if (stepPath(md, spd, dt)) { md.path = null; md.state = 'serve'; md.timer = 0; const cu = md.job; cu.state = 'eating'; cu.timer = 0; cu.eatT = rnd(3.5, 5.5); cu.servedBy = md.m; cu.perfect = md.perfect; cu.face = { eyes: 'heart', mouth: 'open', blush: 1 }; cu.maid = null; burst(tp[0], tp[1] - 70, md.perfect ? 12 : 6, 'heart'); sparkle(md.x, md.y - 60, md.perfect ? 14 : 6); popText(md.x, md.y - 125, L('모에모에큥♡', 'moe moe kyun♡'), '#ff7ab0'); if (md.perfect) { S.hearts += 3; popText(tp[0], tp[1] - 150, 'PERFECT', '#ffd24a'); } SND.play('kyun'); md.dir = 1; } break; }
      case 'serve': { md.pose = 'moe'; md.timer += dt; if (md.timer > 1.3) { md.state = 'idle'; md.job = null; md.timer = rnd(1, 3); } break; }
      case 'moe': { md.pose = 'moe'; md.timer += dt; if (md.timer > 1.2) { md.state = md.prev || 'idle'; md.timer = 0; md.face = null; } break; }
    }
  }

  // ── 동전 더미 ──
  function collect(p) {
    let val = p.val; if (p.special === 'letter') { val *= 3; popText(p.x, p.y - 40, L('팬레터!', 'FAN LETTER!'), '#ff7ab0'); } if (p.special === 'gift') { S.hearts += 25; burst(p.x, p.y - 20, 8, 'heart'); popText(p.x, p.y - 40, '+25💗', '#ff7ab0'); }
    S.coins += val; S.stats.coins += val; flyCoins(p.x, p.y, val); popText(p.x, p.y - 20, '+' + val, '#ffd24a'); SND.play('coins'); piles.splice(piles.indexOf(p), 1);
  }
  function drawPile(p) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.special === 'letter') { ctx.rotate(-.1); rr(ctx, -16, -12, 32, 22, 3); ctx.fillStyle = '#fff6fa'; ctx.fill(); ctx.strokeStyle = '#c88aa0'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(0, 2); ctx.lineTo(16, -12); ctx.stroke(); ctx.fillStyle = '#ff5a8a'; heart(ctx, 0, 0, 5); ctx.fill(); }
    else if (p.special === 'gift') { rr(ctx, -14, -16, 28, 26, 3); ctx.fillStyle = '#ff8ab8'; ctx.fill(); ctx.strokeStyle = '#a83a6a'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(-14, -6, 28, 5); ctx.fillRect(-2.5, -16, 5, 26); ctx.fillStyle = '#ffe08a'; ell(ctx, -6, -19, 5, 3.5); ctx.fill(); ell(ctx, 6, -19, 5, 3.5); ctx.fill(); }
    else { for (let i = 0; i < p.n; i++) { const ox = (i % 3 - 1) * 12 + (i > 5 ? 4 : 0), oy = -Math.floor(i / 3) * 5; ell(ctx, ox, oy, 8, 4.5); ctx.fillStyle = '#c89a2a'; ctx.fill(); ell(ctx, ox, oy - 2, 8, 4.5); ctx.fillStyle = lin(ctx, ox - 8, 0, ox + 8, 0, [[0, '#ffe08a'], [.5, '#ffd24a'], [1, '#d8a020']]); ctx.fill(); ctx.strokeStyle = '#a8801a'; ctx.lineWidth = .8; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(ctx, ox - 3, oy - 3, 2.5, 1.2); ctx.fill(); } }
    const b = Math.sin(gT * 5 + p.x) * .5 + .5; ctx.fillStyle = 'rgba(255,255,255,' + (.3 + b * .5) + ')'; star(ctx, 16, -18 - b * 3, 4, 1.5, 4); ctx.fill();
    ctx.restore();
  }

  // ── 진행 ──
  function tick(dt) {
    gT += dt; S.time += dt; stageT += dt;
    const day = Math.floor(S.time / 180) + 1; if (day !== S.day) { S.day = day; toast('DAY ' + day); SND.play('bell'); }
    // 손님 등장
    spawnT -= dt; if (spawnT <= 0) { const base = 8 / (1 + .3 * (S.up.sign || 0)) / (1 + .07 * rankIdx()); spawnT = base * rnd(.6, 1.3); if (custs.length < tableCount() + QUEUE.length) spawnCust(); }
    custs.forEach(cu => tickCust(cu, dt)); custs = custs.filter(cu => !cu.dead);
    maids.forEach(md => tickMaid(md, dt));
    piles.forEach(p => { p.t += dt; if (S.up.neko && p.t > 5) collect(p); });
    parts.forEach(p => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'txt' ? 20 : -20) * dt; }); parts = parts.filter(p => p.age < p.life);
    flying.forEach(f => { f.t += dt; }); flying = flying.filter(f => { if (f.t >= f.dur) { return false; } return true; });
    confetti.forEach(p => { p.y += p.vy * dt; p.x += Math.sin(gT * 3 + p.ph) * 30 * dt; p.r += dt * 3; }); confetti = confetti.filter(p => p.y < H + 20);
    // 등급
    const ri = rankIdx(); if (ri !== S.rankSeen) { if (S.rankSeen !== undefined && ri > S.rankSeen) { toast('RANK UP', 'pink', L('아키바 ', 'AKIBA #') + (12 - ri) + L('위', '')); SND.play('rank'); sparkle(640, 300, 30); } S.rankSeen = ri; }
    // 미션
    MISSIONS.forEach((m, i) => { if (!S.done.includes(i) && m.ok()) { S.done.push(i); S.coins += m.rw; toast('MISSION CLEAR', 'gold', '+' + fmt(m.rw) + ' 🪙'); SND.play('mission'); } });
    if (!S.ended && owned().length >= 12 && ri >= 11) { S.ended = true; ending(); }
    saveT += dt; if (saveT > 5) { saveT = 0; save(); }
    hud();
  }

  // ── 그리기 ──
  function draw() {
    ctx.drawImage(bgc, 0, 0);
    const items = [];
    TABLES.forEach((tp, i) => { const locked = i >= tableCount(); items.push({ y: tp[1], f: () => { SCENE.tableBack(ctx, tp[0], tp[1], locked); const cu = custs.find(x => x.table === i && (x.state === 'order' || x.state === 'eating')); if (cu) drawSeated(cu, tp); SCENE.tableFront(ctx, tp[0], tp[1], locked, (S.up.decor || 0) >= 2); if (cu && cu.state === 'eating') { const pp = SCENE.platePos(tp[0], tp[1]); ART.drawFood(ctx, pp.x, pp.y, cu.food, 1.6); } if (cu && cu.state === 'order') { if (cu.ordered) drawBubble(tp[0], tp[1] - 118, cu.food, cu.timer / cu.patience, cu.timer > cu.patience * .65); else drawCall(tp[0], tp[1] - 118); } piles.filter(p => p.table === i).forEach(drawPile); } }); });
    custs.forEach(cu => { if (cu.state !== 'order' && cu.state !== 'eating') items.push({ y: cu.y, f: () => SPR.customer(ctx, cu.k, { x: cu.x, y: cu.y, scale: 1.15, pose: cu.state === 'path' ? 'walk' : 'idle', ph: cu.ph, face: cu.face, dir: cu.dir, t: gT }) }); });
    maids.forEach(md => items.push({ y: md.y, f: () => { SPR.maid(ctx, md.m, { x: md.x, y: md.y, scale: 1.1, pose: md.pose, ph: md.ph, t: gT + md.x, face: md.face, dir: md.dir * .8, food: md.food }); if (md.state === 'cook') { drawBubble(md.x, md.y - 128, md.food, clamp(md.timer / (md.cookT * 2.5), 0, 1)); drawGauge(md); } } }));
    items.sort((a, b) => a.y - b.y).forEach(it => it.f());
    // 입자
    parts.forEach(p => { const a = 1 - p.age / p.life; ctx.globalAlpha = a; if (p.kind === 'heart') { ctx.fillStyle = p.col; heart(ctx, p.x, p.y, p.s); ctx.fill(); } else if (p.kind === 'star') { ctx.fillStyle = p.col; star(ctx, p.x, p.y, p.s, p.s * .4, 4); ctx.fill(); } else if (p.kind === 'txt') { ctx.font = "bold " + p.s + "px " + (/[가-힣]/.test(p.txt) ? "'Griun', 'Malgun Gothic'" : "'Ria'") + ", sans-serif"; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#4a1030'; ctx.strokeText(p.txt, p.x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x, p.y); } });
    ctx.globalAlpha = 1;
    flying.forEach(f => { if (f.t < 0) return; const k = f.t / f.dur, e = k * k * (3 - 2 * k); const x = f.sx + (200 - f.sx) * e, y = f.sy + (28 - f.sy) * e - Math.sin(k * Math.PI) * 80; ell(ctx, x, y, 7, 7); ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.strokeStyle = '#a8801a'; ctx.lineWidth = 1; ctx.stroke(); });
    confetti.forEach(p => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.fillRect(-5, -3, 10, 6); ctx.restore(); });
  }

  // ── 입력 ──
  function tap(x, y) {
    if (!playing) return;
    // 동전 더미
    for (const p of piles) if (Math.hypot(x - p.x, y - p.y + 10) < 44) { collect(p); return; }
    // 메이드
    let best = null, bd = 1e9; maids.forEach(md => { const d = Math.hypot(x - md.x, y - (md.y - (md.state === 'cook' ? 130 : 70))); if (d < (md.state === 'cook' ? 110 : 60) && d < bd) { bd = d; best = md; } });
    if (best) { if (best.state === 'cook') { if (best.tapped) { SND.play('tap'); return; } best.tapped = true; const p = gaugePos(best); const ZONE = zoneOf(best); if (p >= ZONE[0] && p <= ZONE[1]) { best.perfect = true; S.stats.perfect = (S.stats.perfect || 0) + 1; sparkle(best.x, best.y - 150, 12); popText(best.x, best.y - 175, 'PERFECT', '#ffd24a'); SND.play('nice'); } else { popText(best.x, best.y - 175, 'GOOD', '#7fe08a'); SND.play('pop'); } return; } if (best.moeT > 0 || best.moeCd > 0) { burst(best.x, best.y - 80, 2, 'heart'); SND.play('heart'); return; } best.moeT = 1.2; best.moeCd = 3; best.face = { eyes: 'happy', mouth: 'open', blush: 1 }; S.hearts += 2; S.stats.moe++; const rec = S.maids[best.id]; rec.moe = (rec.moe || 0) + 1; if (rec.moe <= 100) { popText(best.x, best.y - 155, 'SKILL +1% (' + rec.moe + '%)', '#ffd24a', 9); if (rec.moe % 10 === 0) { popText(best.x, best.y - 172, 'SKILL UP!', '#fff', 11); sparkle(best.x, best.y - 90, 10); SND.play('lvup'); } } if (best.job && best.job.state === 'order') best.job.timer = Math.max(0, best.job.timer - 5); burst(best.x, best.y - 80, 6, 'heart'); popText(best.x, best.y - 130, L('모에모에큥♡', 'moe moe kyun♡'), '#ff7ab0'); SND.play('kyun'); return; }
    // 주문 받기 (앉은 손님 말풍선)
    for (const cu of custs) if (cu.state === 'order' && !cu.ordered) { const tp = TABLES[cu.table]; if (Math.hypot(x - tp[0], y - (tp[1] - 110)) < 46 || Math.hypot(x - tp[0], y - (tp[1] - 60)) < 40) { cu.ordered = true; cu.timer = Math.max(0, cu.timer - 10); cu.face = { eyes: 'happy', mouth: 'open', blush: .5 }; S.hearts += 2; S.stats.orders = (S.stats.orders || 0) + 1; burst(tp[0], tp[1] - 80, 3, 'heart'); popText(tp[0], tp[1] - 130, 'NICE', '#7fe08a'); SND.play('nice'); return; } }
    // 잠긴 탁자 → 상점
    for (let i = tableCount(); i < TABLES.length; i++) { const tp = TABLES[i]; if (Math.hypot(x - tp[0], y - (tp[1] - 20)) < 60) { openPanel('shop'); return; } }
    // 손님 (대기 줄) 살짝
    const cu = custs.find(q => q.state === 'queue' && Math.hypot(x - q.x, y - (q.y - 60)) < 50); if (cu) { cu.face = { eyes: 'sparkle', mouth: 'open', blush: .5 }; SND.play('pop'); return; }
    SND.play('tap');
  }
  c.addEventListener('pointerdown', e => { if (e.button && e.button !== 0) return; const p = toCanvas(e); tap(p.x, p.y); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePanel(); closeGacha(); return; }
    if (!playing) return; const k = e.key.toLowerCase();
    if (k === 'b') openPanel('shop'); else if (k === 'g') openPanel('scout'); else if (k === 'w') openPanel('shift'); else if (k === 'a') openPanel('album'); else if (k === 'q') openPanel('mission');
    else if (k === 'm') { $('btnBgm').classList.toggle('off', !SND.toggleBgm()); } else if (k === 'k') { $('btnSfx').classList.toggle('off', !SND.toggleSfx()); }
  });
  $('btnBgm').onclick = () => { SND.init(); $('btnBgm').classList.toggle('off', !SND.toggleBgm()); };
  $('btnSfx').onclick = () => { SND.init(); $('btnSfx').classList.toggle('off', !SND.toggleSfx()); };
  $('btnBgm').classList.toggle('off', !SND.bgm); $('btnSfx').classList.toggle('off', !SND.sfx);
  $('btnScout').onclick = () => openPanel('scout'); $('btnShop').onclick = () => openPanel('shop'); $('btnAlbum').onclick = () => openPanel('album'); $('btnMission').onclick = () => openPanel('mission'); $('btnShift').onclick = () => openPanel('shift');
  $('btnClose').onclick = closePanel; $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => openPanel(b.dataset.tab));

  // ── 창 ──
  function openPanel(tab) {
    panelTab = tab; $('panel').classList.add('show'); $('tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('tabs').querySelector('[data-tab=mission]').classList.toggle('new', MISSIONS.some((m, i) => !S.done.includes(i) && m.ok()));
    $('pHead').textContent = { shop: 'SHOP', scout: 'SCOUT', album: 'ALBUM', mission: 'MISSION', shift: 'SHIFT' }[tab]; renderPanel(); SND.play('pop');
  }
  function closePanel() { panelTab = null; $('panel').classList.remove('show'); }
  function renderPanel() {
    const B = $('pBody'); B.innerHTML = ''; $('pMoney').textContent = fmt(S.coins); $('pMaids').textContent = owned().length;
    if (panelTab === 'shop') {
      const g = document.createElement('div'); g.className = 'shop';
      SHOP.forEach(it => { const lv = S.up[it.id] || 0, max = lv >= it.max, cost = max ? 0 : it.cost(lv), can = !max && S.coins >= cost; const d = document.createElement('div'); d.className = 'item' + (max ? ' max' : can ? '' : ' no'); d.innerHTML = '<div class="ic">' + it.ic + '</div><div class="n">' + L(it.name, it.en) + '<small>' + L(it.sub, it.ensub) + '</small><div class="lv">' + (it.max > 1 ? 'LV ' + lv + '/' + it.max : (lv ? 'OK' : '')) + '</div></div><div class="p">' + (max ? 'MAX' : '🪙 ' + fmt(cost)) + '</div>'; d.onclick = () => { if (max) return; if (S.coins < cost) { SND.play('no'); return; } S.coins -= cost; S.up[it.id] = lv + 1; SND.play('buy'); if (it.id === 'decor' || it.id === 'neko') rebuildBg(); if (it.id === 'table') sparkle(TABLES[tableCount() - 1][0], TABLES[tableCount() - 1][1] - 40, 14); renderPanel(); hud(); }; g.appendChild(d); });
      B.appendChild(g);
    } else if (panelTab === 'scout') {
      const cost = gachaCost(), can = S.coins >= cost; const rem = MAIDS.filter(m => !S.maids[m.id]);
      const d = document.createElement('div'); d.className = 'scout';
      d.innerHTML = '<div class="poster"><canvas id="scCv" width="240" height="280"></canvas><div class="txt"><b>' + L('신입 메이드 모집', 'MAID WANTED') + '</b><span>' + (rem.length ? L('아키바 최고의 메이드를 찾습니다.<br>뽑을 때마다 새 메이드', 'Looking for the best maid in Akiba.<br>Every scout is a new maid') : L('12명 전원 모집 완료', 'All 12 maids recruited')) + '</span></div></div>' +
        '<div class="rates"><i class="r1">★ 60%</i><i class="r2">★★ 30%</i><i class="r3">★★★ 10%</i><i>' + L('남은 메이드 ', 'Left: ') + rem.length + '</i></div>' +
        '<button class="pull" id="btnPull"' + (can && rem.length ? '' : ' disabled') + '>' + (rem.length ? L('스카우트', 'SCOUT') + '<b>🪙 ' + fmt(cost) + '</b>' : 'COMPLETE') + '</button><div class="team" id="team"></div>';
      B.appendChild(d);
      const sc = $('scCv'); const x = sc.getContext('2d'); const show = rem.length ? pick(rem) : pick(MAIDS); x.drawImage(portraitCanvas(show, 240, 280, { key: 'sil', t: 0, face: { eyes: 'closed', mouth: 'line', blush: 0 } }), 0, 0);
      if (!S.maids[show.id]) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(60,20,60,.85)'; x.fillRect(0, 0, 240, 280); x.globalCompositeOperation = 'source-over'; x.font = "bold 90px 'Ria', sans-serif"; x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('?', 120, 165); }
      const team = $('team'); MAIDS.forEach(m => { const cv = document.createElement('canvas'); cv.width = 54; cv.height = 62; if (!S.maids[m.id]) cv.className = 'none'; cv.getContext('2d').drawImage(portraitCanvas(m, 108, 124), 0, 0, 54, 62); team.appendChild(cv); });
      $('btnPull').onclick = pull;
    } else if (panelTab === 'album') {
      const g = document.createElement('div'); g.className = 'album';
      MAIDS.forEach(m => { const o = S.maids[m.id]; const d = document.createElement('div'); d.className = 'card r' + m.rar + (o ? '' : ' none'); const cv = document.createElement('canvas'); cv.width = 150; cv.height = 180; cv.getContext('2d').drawImage(portraitCanvas(m, 150, 180), 0, 0);
        const stars = '★'.repeat(m.rar); if (o) { const lv = o.lv, max = lv >= 20, cost = lvCost(lv), can = !max && S.coins >= cost; d.innerHTML = '<div class="nm">' + L(m.name, m.en) + '</div><div class="st">' + stars + '</div><div class="lv">LV ' + lv + '</div><div class="sk">' + skillText(m) + '</div><div class="pf">' + L('좋아하는 것: ', 'Likes: ') + L(m.like, m.en_like) + '<br>' + L('취미: ', 'Hobby: ') + L(m.hobby, m.en_hobby) + '<br>' + L(m.tag, m.en_tag) + ' · ' + m.bday + '</div><button class="up' + (max ? ' max' : '') + '"' + (can || max ? '' : ' disabled') + '>' + (max ? 'MAX' : 'LV UP 🪙 ' + fmt(cost)) + '</button>'; d.querySelector('.up').onclick = () => { if (max || S.coins < cost) { SND.play('no'); return; } S.coins -= cost; o.lv++; SND.play('lvup'); renderPanel(); hud(); }; if (!S.seen.includes(m.id)) S.seen.push(m.id); }
        else d.innerHTML = '<div class="q">?</div><div class="nm">???</div><div class="st">' + stars + '</div>';
        d.insertBefore(cv, d.firstChild); g.appendChild(d); });
      B.appendChild(g);
    } else if (panelTab === 'shift') {
      const sh = shift(); const g = document.createElement('div'); g.className = 'shift';
      const info = document.createElement('div'); info.className = 'info'; info.innerHTML = '<b>' + sh.length + ' / ' + SHIFT_MAX + '</b>'; g.appendChild(info);
      const grid = document.createElement('div'); grid.className = 'grid';
      owned().forEach(id => { const m = BYID[id]; const on = sh.includes(id); const d = document.createElement('div'); d.className = 'pick' + (on ? ' on' : ''); const cv = document.createElement('canvas'); cv.width = 120; cv.height = 140; cv.getContext('2d').drawImage(portraitCanvas(m, 120, 140), 0, 0); d.appendChild(cv); d.innerHTML += '<div class="nm">' + L(m.name, m.en) + '</div><div class="lv">LV ' + S.maids[id].lv + '</div><div class="sk">' + skillText(m) + '</div>'; d.insertBefore(cv, d.firstChild);
        d.onclick = () => { if (on) { if (sh.length <= 1) { SND.play('no'); return; } setShift(id, false); } else { setShift(id, true); } SND.play('pop'); renderPanel(); hud(); }; grid.appendChild(d); });
      g.appendChild(grid); B.appendChild(g);
    } else if (panelTab === 'mission') {
      const g = document.createElement('div'); g.className = 'missions';
      MISSIONS.forEach((m, i) => { const done = S.done.includes(i); const d = document.createElement('div'); d.className = 'm' + (done ? ' done' : ''); d.innerHTML = '<div class="ic">' + m.ic + '</div><div class="t">' + L(m.t, m.en) + '<small>' + (done ? 'CLEAR' : m.pr()) + '</small></div><div class="rw">🪙 ' + fmt(m.rw) + '</div>'; g.appendChild(d); });
      B.appendChild(g);
    }
    hud();
  }

  // ── 스카우트(뽑기) ──
  function pull() {
    const cost = gachaCost(); if (gachaBusy) return; if (owned().length >= 12) { SND.play('no'); return; } if (S.coins < cost) { SND.play('no'); return; }
    S.coins -= cost; S.pulls++; gachaBusy = true;
    const rem = MAIDS.filter(m => !S.maids[m.id]); let m; const isNew = true;
    if (!rem.length) { S.coins += cost; S.pulls--; gachaBusy = false; return; }
    const w = rem.map(x => x.rar === 1 ? 60 : x.rar === 2 ? 30 : 10); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < rem.length; i++) { r -= w[i]; if (r <= 0) { m = rem[i]; break; } } m = m || rem[rem.length - 1]; S.maids[m.id] = { lv: 1 }; setShift(m.id, true);
    closePanel(); hud(); save();
    const G = $('gacha'); G.className = 'show'; SND.play('gacha');
    $('gTag').textContent = 'NEW'; $('gTag').classList.remove('dup'); $('gName').textContent = L(m.name, m.en); $('gStar').textContent = '★'.repeat(m.rar) + '  ' + L(m.tag, m.en_tag);
    const gx = $('gCv').getContext('2d'); gx.clearRect(0, 0, 300, 300); gx.drawImage(portraitCanvas(m, 300, 300, { key: 'g', t: 0, face: m.rar === 3 ? { eyes: 'sparkle', mouth: 'open', blush: .8 } : { eyes: 'wink', mouth: 'open', blush: .7 } }), 0, 0);
    setTimeout(() => { G.classList.add('open', 'r' + m.rar); if (m.rar === 3) { G.classList.add('ssr'); SND.play('ssr'); } else SND.play('reveal'); for (let i = 0; i < 26; i++) { const s = document.createElement('i'); s.className = 'spk'; s.style.left = '50%'; s.style.top = '45%'; s.style.setProperty('--dx', rnd(-260, 260) + 'px'); s.style.setProperty('--dy', rnd(-260, 260) + 'px'); s.style.background = pick(['#fff', '#ffe08a', '#ff8ab8']); G.appendChild(s); setTimeout(() => s.remove(), 1500); } }, 700);
    G.onclick = () => { if (!G.classList.contains('open')) return; closeGacha(); openPanel(owned().length > SHIFT_MAX ? 'shift' : 'scout'); };
  }
  function closeGacha() { gachaBusy = false; $('gacha').className = ''; }
  // 시험용: 연출 없이 뽑기 / 상점 사기
  function pullSilent() { const cost = gachaCost(); const rem = MAIDS.filter(m => !S.maids[m.id]); if (!rem.length || S.coins < cost) return null; S.coins -= cost; S.pulls++; let m; const w = rem.map(x => x.rar === 1 ? 60 : x.rar === 2 ? 30 : 10); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < rem.length; i++) { r -= w[i]; if (r <= 0) { m = rem[i]; break; } } m = m || rem[rem.length - 1]; S.maids[m.id] = { lv: 1 }; setShift(m.id, true); return 'new:' + m.id; }
  function buy(id) { const it = SHOP.find(x => x.id === id); const lv = S.up[id] || 0; if (lv >= it.max) return false; const cost = it.cost(lv); if (S.coins < cost) return false; S.coins -= cost; S.up[id] = lv + 1; if (id === 'decor' || id === 'neko') rebuildBg(); return true; }

  // ── 오프라인 보상 (시간 안 봄, 탁자마다 한 판) ──
  function offline(sec) {
    if (sec < 20 * 60) return false;
    const foods = menuFoods(); const avg = foods.reduce((a, f) => a + FOODS[f].p, 0) / foods.length;
    for (let i = 0; i < tableCount(); i++) { if (piles.some(p => p.table === i)) continue; const tp = TABLES[i]; const val = Math.round(avg * priceMult() * rnd(.9, 1.1)); const special = Math.random() < .15 ? (Math.random() < .6 ? 'letter' : 'gift') : null; piles.push({ table: i, x: tp[0], y: tp[1] - 20, val, special, t: -999, n: clamp(Math.round(val / 8), 2, 9) }); }
    custs = custs.filter(cu => cu.table < 0); maids.forEach(md => { if (md.job) { md.job = null; md.state = 'idle'; md.path = null; md.timer = 1; } }); toast('WELCOME BACK', 'pink'); SND.play('bell'); return true;
  }

  // ── 시작·이어하기 ──
  function begin(state) {
    S = state; if (S.rankSeen === undefined) S.rankSeen = rankIdx();
    maids = []; custs = []; piles = []; parts = []; flying = []; shift(); syncMaids(); maids.forEach((md, i) => { const sp = IDLE_SPOTS[i % IDLE_SPOTS.length]; md.x = sp.x; md.y = sp.y; });
    rebuildBg(); $('title').classList.add('hide'); document.body.classList.add('playing'); $('topbar').classList.add('show'); $('keys').classList.add('show');
    playing = true; spawnT = 2; SND.init(); hud(); save(); if (window.SPR) SPR.preload();
  }
  function newGame() { const old = load(); if (old && !confirm(L('저장된 가게를 지우고 새로 시작할까요?', 'Delete the saved cafe and start over?'))) return; try { localStorage.removeItem('maidcafe.save'); } catch (_) { } begin(newState()); }
  function contGame() { const st = load(); if (!st) return newGame(); const away = (Date.now() - (st.t || Date.now())) / 1000; begin(st); offline(away); }
  $('btnNew').onclick = newGame; $('btnCont').onclick = contGame;
  document.addEventListener('visibilitychange', () => { if (!S) return; if (document.hidden) { save(); hiddenAt = Date.now(); } else if (hiddenAt) { offline((Date.now() - hiddenAt) / 1000); hiddenAt = 0; lastT = performance.now(); } });
  let hiddenAt = 0;

  // ── 엔딩 ──
  function ending() {
    SND.play('ending'); $('endDay').textContent = S.day; $('endCoin').textContent = fmt(S.coins); $('ending').classList.add('show');
    for (let i = 0; i < 160; i++) confetti.push({ x: rnd(0, W), y: rnd(-700, -10), vy: rnd(60, 140), r: rnd(0, 6), ph: rnd(0, 6), col: pick(['#ff8ab8', '#ffd24a', '#8ad8ff', '#c8f0a0', '#fff']) });
    syncMaids(true); maids.forEach((md, i) => { md.state = 'stage'; md.timer = 9999; md.st = i * .3; md.path = null; md.x = 200 + (i % 6) * 176; md.y = i < 6 ? 556 : 700; });
    save();
  }
  $('endGo').onclick = () => { $('ending').classList.remove('show'); syncMaids(); maids.forEach(md => { md.state = 'idle'; md.timer = 1; md.face = null; }); };

  // ── 타이틀 장면 (실제 가게 + 메이드 셋) ──
  const demoS = newState(); demoS.up.decor = 2; demoS.up.table = 1;
  function drawTitle(t) {
    if (!S) { SCENE.background(bgx, demoS, EN); }
    ctx.drawImage(bgc, 0, 0);
    TABLES.slice(0, 3).forEach(tp => { SCENE.tableBack(ctx, tp[0], tp[1], false); SCENE.tableFront(ctx, tp[0], tp[1], false, true); });
    TABLES.slice(3).forEach(tp => { SCENE.tableBack(ctx, tp[0], tp[1], true); SCENE.tableFront(ctx, tp[0], tp[1], true, false); });
    const line = [MAIDS[0], MAIDS[8], MAIDS[7], MAIDS[5], MAIDS[11]];
    line.forEach((m, i) => SPR.maid(ctx, m, { x: 380 + i * 130, y: 566, scale: 1.1, pose: i === 2 ? 'moe' : i === 0 || i === 4 ? 'wave' : ((t + i * 2.5) % 6 < 2.5 ? 'wave' : 'idle'), t: t + i, face: i === 2 ? { eyes: 'happy', mouth: 'open', blush: .9 } : null }));
  }

  // ── 루프 ──
  function frame(now) {
    const dt = Math.min(.05, (now - lastT) / 1000 || 0); lastT = now;
    if (playing) { if (!panelTab && !gachaBusy) tick(dt); else gT += dt; draw(); } else drawTitle(now / 1000);
    requestAnimationFrame(frame);
  }
  // 초기 화면
  (function init() {
    const st = load();
    if (st) { $('btnCont').hidden = false; $('contInfo').textContent = 'DAY ' + st.day + ' · 🪙 ' + fmt(st.coins) + ' · 🎀 ' + Object.keys(st.maids).length + '/12'; }
    const touch = matchMedia('(pointer: coarse)').matches; if (touch) document.body.classList.add('touch');
    const setPort = () => document.body.classList.toggle('portrait', innerHeight > innerWidth); setPort(); addEventListener('resize', setPort);
    $('rotGo').onclick = () => { if (window.OL && OL.go) OL.go(); };
    $('rotSkip').onclick = e => { e.preventDefault(); document.body.classList.remove('touch'); };
    if (document.fonts) { document.fonts.load("20px 'Ria'").catch(() => { }); document.fonts.load("20px 'Griun'").catch(() => { }); }
    requestAnimationFrame(t => { lastT = t; frame(t); });
  })();

  // 시험 손잡이
  window.__mc = { get maids() { return maids; }, get gT() { return gT; }, setShift, shift, pullSilent, buy, collectAll() { piles.slice().forEach(collect); }, lvup(id) { const o = S.maids[id]; const cost = lvCost(o.lv); if (o.lv >= 20 || S.coins < cost) return false; S.coins -= cost; o.lv++; return true; }, tick, draw, run(n, dt) { for (let i = 0; i < n; i++) tick(dt || 1 / 30); draw(); }, shot(name) { return fetch('/save?name=' + name, { method: 'POST', body: c.toDataURL('image/png') }).then(r => r.text()); }, drawTitle, get S() { return S; }, get custs() { return custs; }, get piles() { return piles; }, tap, newGame, contGame, pull, offline, openPanel, closePanel, spawnCust, begin, newState, MISSIONS, SHOP, FOODS, RANKS, TABLES, rankIdx, gachaCost, save };
})();
