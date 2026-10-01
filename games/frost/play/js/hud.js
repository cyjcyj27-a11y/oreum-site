// hud.js — 입력(키·마우스·손가락), 상단바, 도감·상점·지도, 새로 찾은 것 카드
(function () {
  const $ = id => document.getElementById(id);
  const L = U.L;
  const keys = {};
  let locked = false, touch = false;
  const IN = PLAYER.IN;
  let panel = null, panelPaused = false;   // 'book' | 'shop' | 'map'

  function bind() {
    const cv = $('c');
    touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (touch) document.body.classList.add('touch');

    addEventListener('keydown', e => {
      if (e.repeat) return;
      keys[e.code] = true;
      if (e.code === 'Space') { IN.jumpEdge = true; IN.upHeld = true; e.preventDefault(); }   // upHeld: 잠수 중 누르고 있으면 떠오른다 (hero.js diveStep)
      if (e.code.startsWith('Arrow')) e.preventDefault();
      if (e.code === 'KeyE' || e.code === 'Enter') { if (panel === 'shop') return; if (panel === 'sell') { sellNow(); return; } IN.actEdge = true; }
      if (e.code === 'KeyK') togSfx();
      if (e.code === 'KeyB') open(panel === 'book' ? null : 'book');
      if (e.code === 'KeyI') open(panel === 'bag' ? null : 'bag');   // 가방 (사장님 2026-09-27)
      if (e.code === 'KeyT' || e.code === 'Tab') { e.preventDefault(); open(panel === 'map' ? null : 'map'); }
      // R 리스폰은 꾹 눌러야 (사장님 2026-09-17 "버섯 줍고 있는데 갑자기 집으로" — 줍기 E 옆이라 스쳐 눌림)
      if (e.code === 'Escape') { if (panel) { open(null); return; } GAME.pause(); }
      if (e.code === 'KeyP') GAME.pause();
    });
    addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') IN.upHeld = false; });
    addEventListener('blur', () => { for (const k in keys) keys[k] = false; IN.upHeld = false; });

    // 화면을 눌러도 마우스를 잠그지 않는다 (사장님 2026-10-01 "마우스고정 없애주고") — 시점은 끌거나 WASD 로
    document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cv; });
    addEventListener('mousemove', e => { if (locked) CAMERA.look(e.movementX, e.movementY); });
    // 잠그지 않았을 때는 끌어서 시점
    let drag = null;
    cv.addEventListener('mousedown', e => { if (!locked && !touch) drag = { x: e.clientX, y: e.clientY }; });
    addEventListener('mouseup', () => { drag = null; });
    addEventListener('mousemove', e => { if (drag && !locked) { CAMERA.look(e.clientX - drag.x, e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; } });

    if (touch) padSetup();

    $('tPause').onclick = () => GAME.pause();
    $('tSfx').onclick = togSfx;
    $('tBook').onclick = () => open(panel === 'book' ? null : 'book');
    $('tBag').onclick = () => open(panel === 'bag' ? null : 'bag');
    $('bagClose').onclick = () => open(null);
    $('tMap').onclick = () => open(panel === 'map' ? null : 'map');
    $('sBasket').onclick = () => { if (touch) open('book'); };
    for (const id of ['book', 'map']) $(id).addEventListener('click', e => { if (e.target.closest('.tab')) return; open(null); });
    $('shopClose').onclick = () => open(null);
    $('sellClose').onclick = () => open(null);
    $('sellGo').onclick = e => { e.stopPropagation(); sellNow(); };
    $('sellAll').onclick = e => { e.stopPropagation(); sellPick = new Set(ITEMS.sellList().map(r => r.key)); sellNow(); };   // 모두 팔기
    document.querySelectorAll('#book .tab').forEach(b => b.onclick = () => { bookTab = b.dataset.t; paintBook(); });
    restore(); paintTog();
  }

  function togSfx() { T.sfx = !T.sfx; store(); paintTog(); }
  function store() { try { localStorage.setItem(T.save + '.snd', T.sfx ? '1' : '0'); } catch (e) { } }
  function restore() {
    try {
      const b = localStorage.getItem(T.save + '.snd');
      if (b !== null) T.sfx = b === '1';
    } catch (e) { }
  }
  function paintTog() { $('tSfx').classList.toggle('off', !T.sfx); }

  // ── 창 열기 ──
  function open(which) {
    if (which && T.mode !== 'play') return;
    if (which === panel) return;
    if (panel) $(panel).classList.remove('show');
    if (!panel && which) { panelPaused = T.paused; T.paused = true; if (document.pointerLockElement) document.exitPointerLock(); }
    if (panel && !which && !panelPaused) T.paused = false;
    const wasSell = panel === 'sell';
    panel = which;
    if (which === 'book') paintBook();
    if (which === 'shop') paintShop();
    if (which === 'bag') paintBag();
    if (which === 'sell') { sellPick = new Set(); paintSell(); }
    if (which === 'map') paintMap();
    if (which) { $(which).classList.add('show'); AUD.sfx('page'); }
    if (wasSell && !which && window.QUESTS && QUESTS.firstSaleTalk) setTimeout(() => QUESTS.firstSaleTalk(), 300);   // 처음 판 뒤 1만 코인 이야기
  }

  let bookTab = 'm';
  // 명소 그림은 그 이모지를 크게 (사진기 뺀 뒤)
  const emoC = {};
  function emoji(e) {
    if (emoC[e]) return emoC[e];
    const c = GEO.canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
    g.font = '76px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 70);
    return (emoC[e] = c.toDataURL());
  }
  // 칸 수: 부탁·명소·물고기는 제 목록 길이, 나머지는 12 (물고기 칸은 사장님 2026-09-18 "물고기는 도감있어야지")
  function bookN(t) { return t === 'p' ? TER.PLACES.length : t === 'k' ? FISHING.FISH.length : 12; }
  function paintBook() {
    const c = ITEMS.counts();
    document.querySelectorAll('#book .tab').forEach(b => {
      b.classList.toggle('on', b.dataset.t === bookTab);
      b.querySelector('b').textContent = c[b.dataset.t] + '/' + bookN(b.dataset.t);
    });
    const grid = $('bookGrid');
    let html = '';
    const N = bookN(bookTab);
    for (let i = 0; i < N; i++) {
      const key = bookTab + i, got = bookTab === 'h' ? !!T.quests[i] : (bookTab === 'p' ? !!T.places[i] : !!T.got[key]);
      let img = '', name = '';
      if (bookTab === 'm') { img = ITEMS.ICONS.m[i]; name = L(ITEMS.SHROOMS[i].ko, ITEMS.SHROOMS[i].en); }
      if (bookTab === 'f') { img = ITEMS.ICONS.f[i]; name = L(ITEMS.FLOWERS[i].ko, ITEMS.FLOWERS[i].en); }
      if (bookTab === 'n') { img = RIDE.nestIcon(); name = L('황새 둥지', 'Stork Nest') + ' ' + (i + 1); }
      if (bookTab === 'b') { img = RIDE.bisonIcon(i); name = L('들소', 'Bison') + ' ' + (i + 1); }
      if (bookTab === 'p') { const pl = TER.PLACES[i]; img = emoji(pl.icon); name = pl.icon + ' ' + L(pl.ko, pl.en); }
      if (bookTab === 'h') { img = QUESTS.icon(i); name = L(QUESTS.NAMES[i][0], QUESTS.NAMES[i][1]); }
      if (bookTab === 'k') { img = FISHING.icon(i); name = L(FISHING.FISH[i].ko, FISHING.FISH[i].en); }
      html += '<div class="card' + (got ? '' : ' lock') + (got && bookTab === 'h' ? ' done' : '') + '">' +
        ((got || bookTab === 'h') && img ? '<img src="' + img + '">' : '<span class="q">?</span>') +
        '<div class="nm">' + (got ? name : '???') + '</div>' +
        (got && bookTab === 'm' ? '<div class="pr">🪙 ' + ITEMS.SHROOMS[i].price + '</div>' : '') +
        (got && bookTab === 'k' ? '<div class="pr">🪙 ' + FISHING.FISH[i].price + '</div>' : '') +
        (bookTab === 'b' && !got && T.bison && T.bison[i] ? '<div class="pr">' + '❤'.repeat(T.bison[i]) + '</div>' : '') +
        (bookTab === 'b' && got && T.tame && T.tame[i] ? '<div class="pr">🦬 ✓</div>' : '') + '</div>';
    }
    grid.innerHTML = html;
  }

  function paintShop() {
    $('shopCoin').textContent = T.coins;
    $('shopList').innerHTML = ITEMS.SHOP.map(it => {
      const owned = !!T.shop[it.id], locked = it.need && !T.shop[it.need];
      const can = !owned && !locked && T.coins >= it.price;
      return '<div class="item' + (owned ? ' own' : '') + (locked ? ' lock' : '') + '">' +
        '<span class="ic">' + it.icon + '</span><span class="nm">' + L(it.ko, it.en) + '</span>' +
        (owned ? '<span class="pr">✓</span>' : '<button data-id="' + it.id + '"' + (can ? '' : ' class="no"') + '>🪙 ' + it.price + '</button>') + '</div>';
    }).join('');
    $('shopList').querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); if (ITEMS.buy(b.dataset.id)) paintShop(); });
  }

  // ── 가방: 상점에서 산 것·얻은 도구 (사장님 2026-09-27 "소지품표시하는걸 가방으로 왼쪽허드끝에") ──
  function paintBag() {
    $('bagTtl').setAttribute('aria-label', L('가방', 'Bag'));
    const S = id => ITEMS.SHOP.find(s => s.id === id);
    const where = k => T.tool === k ? L('손에 듦', 'In hand') : TOOLS.stowed(k) ? L('가방', 'In bag') : (T.rest && T.rest[k] ? L('내려놓음', 'Put down') : '');
    const rows = [];
    const bk = T.shop.basket2 ? S('basket2') : T.shop.basket1 ? S('basket1') : { icon: '🧺', ko: '바구니', en: 'Basket' };
    rows.push({ ic: bk.icon, ko: bk.ko, en: bk.en, sub: ITEMS.cap() + L('개', ''), st: FEEL.held() ? L('손에 듦', 'In hand') : L('가방', 'In bag'), tool: 'basket' });
    for (const id of ['boots', 'shoes']) if (T.shop[id]) { const it = S(id); rows.push({ ic: it.icon, ko: it.ko, en: it.en, st: L('장착', 'Equipped') }); }
    // 도구 줄은 누르면 꺼내 들기 / 넣기 (가방 방식, 사장님 2026-09-27)
    for (const id of ['spear', 'rifle']) if (T.shop[id] || TOOLS.has(id)) { const it = S(id); rows.push({ ic: it.icon, ko: it.ko, en: it.en, st: where(id), tool: (T.tool === id || TOOLS.stowed(id)) ? id : null }); }
    if (TOOLS.has('torch')) { const d = TOOLS.DEF.torch; rows.push({ ic: d.icon, ko: d.ko, en: d.en, st: where('torch'), tool: (T.tool === 'torch' || TOOLS.stowed('torch')) ? 'torch' : null }); }
    $('bagList').innerHTML = rows.map(r => '<div class="item' + (r.tool ? ' tool' + ((r.tool === 'basket' ? FEEL.held() : T.tool === r.tool) ? ' on' : '') : '') + '"' + (r.tool ? ' data-t="' + r.tool + '"' : '') + '><span class="ic">' + r.ic + '</span><span class="nm">' + L(r.ko, r.en) +
      (r.sub ? '<span class="sub">' + r.sub + '</span>' : '') + '</span><span class="st">' + (r.st || '') + '</span></div>').join('');
    $('bagList').querySelectorAll('.item[data-t]').forEach(el => el.onclick = e => { e.stopPropagation(); if (el.dataset.t === 'basket' ? (FEEL.held() ? FEEL.dropBag() : FEEL.takeBag()) : TOOLS.equip(el.dataset.t)) { paintBag(); setTimeout(() => { if (panel === 'bag') open(null); }, 250); } else AUD.sfx('deny'); });
  }

  // ── 팔기 창 (표도르) — 줄을 누르면 고르고 값이 뜬다, 아래 단추로 고른 것만 판다 (사장님 2026-09-27) ──
  let sellPick = new Set();
  function paintSell() {
    $('sellCoin').textContent = T.coins;
    const rows = ITEMS.sellList();
    for (const k of [...sellPick]) if (!rows.some(r => r.key === k)) sellPick.delete(k);
    $('sellList').innerHTML = rows.length ? rows.map(r => {
      const on = sellPick.has(r.key);
      return '<div class="item' + (on ? ' on' : '') + '" data-k="' + r.key + '">' +
        (r.img ? '<img class="ic" src="' + r.img + '" alt="">' : '<span class="ic">' + r.icon + '</span>') +
        '<span class="nm">' + L(r.ko, r.en) + ' <span class="n">×' + r.n + '</span></span>' +
        '<span class="pr">' + (on ? '🪙 ' + r.total : '') + '</span></div>';
    }).join('') : '<div class="item"><span class="nm" style="text-align:center;color:#9a948a">—</span></div>';
    $('sellList').querySelectorAll('.item[data-k]').forEach(el => el.onclick = e => {
      e.stopPropagation();
      const k = el.dataset.k; if (sellPick.has(k)) sellPick.delete(k); else sellPick.add(k);
      AUD.sfx('tock', 0.6); paintSell();
    });
    const sum = rows.filter(r => sellPick.has(r.key)).reduce((a, r) => a + r.total, 0);
    const all = rows.reduce((a, r) => a + r.total, 0), ga = $('sellAll');
    ga.textContent = L('모두 팔기', 'SELL ALL') + (all ? '  🪙 ' + all : '');
    ga.classList.toggle('no', !all);
    const go = $('sellGo');
    go.textContent = L('팔기', 'SELL') + (sum ? '  🪙 ' + sum : '');
    go.classList.toggle('no', !sum);
  }
  function sellNow() {
    if (!sellPick.size) { AUD.sfx('deny'); return; }
    ITEMS.sellKeys([...sellPick]); sellPick = new Set(); paintSell();
    if (!ITEMS.sellList().length) setTimeout(() => { if (panel === 'sell') open(null); }, 500);
  }

  // ── 지도 ──
  let mapImg = null;
  const fsum = {};   // 숲 종류별 무게중심 (이름표 자리)
  function bakeMap() {
    const S = 512, c = GEO.canvas(S), g = c.getContext('2d');
    const img = g.createImageData(S, S), col = new THREE.Color();
    const W = TER.HALF * 2;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const x = -TER.HALF + (i + 0.5) / S * W, z = -TER.HALF + (j + 0.5) / S * W;
      if (i % 4 === 0 && j % 4 === 0 && Math.abs(x) < TER.LIMIT && Math.abs(z) < TER.LIMIT) {
        const ff = TER.forest(x, z);
        if (ff && TER.H(x, z) > 0.2) { const o = fsum[ff.k] || (fsum[ff.k] = { x: 0, z: 0, n: 0 }); o.x += x; o.z += z; o.n++; }
      }
      const h = TER.H(x, z);
      if (h < 0) col.set(h < -0.9 ? 0x3a6a8a : 0x5a8aa0).convertLinearToSRGB();
      else {
        TER.colorAt(x, z, h, col);
        const f = TER.forest(x, z);
        if (f && f.d > 0.5) col.multiplyScalar(0.72);
        const sh = TER.H(x + 2, z + 2) - h;
        col.multiplyScalar(1 - U.clamp(sh * 0.25, -0.2, 0.25));
        col.convertLinearToSRGB();
      }
      const k = (j * S + i) * 4;
      img.data[k] = col.r * 255; img.data[k + 1] = col.g * 255; img.data[k + 2] = col.b * 255; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    mapImg = c;
  }
  function paintMap() {
    if (!mapImg) bakeMap();
    const c = $('mapCv'), g = c.getContext('2d');
    const S = c.width;
    g.drawImage(mapImg, 0, 0, S, S);
    const W = TER.HALF * 2;
    const P = (x, z) => [(x + TER.HALF) / W * S, (z + TER.HALF) / W * S];
    const Z = TER.Z;
    g.font = (S / 26 | 0) + 'px "Ria", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const mark = (x, z, t) => { const [a, b] = P(x, z); g.fillText(t, a, b); };
    zoneLabels(g, S, P);
    g.font = (S / 26 | 0) + 'px "Ria", sans-serif'; g.fillStyle = '#fff';
    // 명소: 찾은 곳은 그림, 못 찾은 곳은 ?
    TER.PLACES.forEach((p, i) => {
      if (p.id === 'castle' || p.id === 'fire') return;
      const [a, b] = P(p.x, p.z);
      if (T.places[i]) { g.font = (S / 32 | 0) + 'px sans-serif'; g.fillText(p.icon, a, b); }
      else {
        g.fillStyle = 'rgba(30,24,16,.8)'; g.beginPath(); g.arc(a, b, S / 70, 0, 7); g.fill();
        g.strokeStyle = '#ffe9a0'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#ffe9a0'; g.font = (S / 50 | 0) + 'px "Ria", sans-serif'; g.fillText('?', a, b + 1);
      }
    });
    g.font = (S / 26 | 0) + 'px "Ria", sans-serif'; g.fillStyle = '#fff';
    mark(Z.market.x, Z.market.z, '🍄');
    { const bp = FEEL.bagPos(); if (bp) { g.font = (S / 30 | 0) + 'px sans-serif'; mark(bp.x, bp.z, '🧺'); g.font = (S / 26 | 0) + 'px "Ria", sans-serif'; } }   // 놓아둔 바구니
    mark(Z.castle.x, Z.castle.z, '🏰');
    mark(Z.village.x - 30, Z.village.z - 14, '⛪');
    if (T.kupala >= 1) mark(Z.bonfire.x, Z.bonfire.z, '🔥');
    WORLD.NESTS.forEach((n, i) => { if (T.got['n' + i]) { const [a, b] = P(n.x, n.z); g.fillStyle = '#fff'; g.beginPath(); g.arc(a, b, 3, 0, 7); g.fill(); } });
    // 나
    const [px, pz] = P(PL.pos.x, PL.pos.z);
    g.save(); g.translate(px, pz); g.rotate(-PL.yaw + Math.PI);
    g.fillStyle = '#ffdc5a'; g.strokeStyle = '#2a2010'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 9); g.lineTo(0, 4); g.lineTo(-8, 9); g.closePath(); g.fill(); g.stroke();
    g.restore();
    const gd = ITEMS.guide();
    if (gd) { const [a, b] = P(gd.x, gd.z); g.strokeStyle = '#ff5a3a'; g.lineWidth = 3; g.beginPath(); g.arc(a, b, 9 + Math.sin(T.time * 5) * 2, 0, 7); g.stroke(); }
  }

  // 구역 이름 + 그 구역에서 나는 버섯·꽃 (사장님 2026-09-17 "노란버섯이 있는 숲이 어딘지 알 수가 없는데")
  //   지금 부탁받은 것은 빨간 테를 두른다
  const iconImg = {};
  function icon(url) { if (!url) return null; let im = iconImg[url]; if (!im) { im = iconImg[url] = new Image(); im.onload = () => { if (panel === 'map') paintMap(); }; im.src = url; } return im.complete ? im : null; }
  function zoneLabels(g, S, P) {
    const Z = TER.Z, SH = ITEMS.SHROOMS, FL = ITEMS.FLOWERS;
    const cen = k => { const o = fsum[k]; return o && o.n ? [o.x / o.n, o.z / o.n] : null; };
    const mOf = (...zs) => SH.map((s, i) => s.zone.some(z => zs.includes(z)) ? i : -1).filter(i => i >= 0);
    const fOf = (...zs) => FL.map((f, i) => zs.includes(f.zone) && QUESTS.QUESTS.some(q => q.f === i) ? i : -1).filter(i => i >= 0);   // 부탁에 쓰는 꽃만
    const rye = TER.FIELDS.filter(f => f.k === 'rye'), flax = TER.FIELDS.find(f => f.k === 'flax');
    const ZONES = [
      { at: [86, -2], ko: '자작나무 숲', en: 'Birch Forest', m: mOf('birch'), f: fOf('birch'), e: ['berry'] },
      { at: cen('pine'), ko: '소나무 숲', en: 'Pine Forest', m: mOf('pine'), f: fOf('pine'), e: ['berry'] },
      { at: [-108, -120], ko: '원시림', en: 'Old Forest', m: mOf('pushcha'), f: fOf('pushcha') },
      { at: [Z.clearing.x - 3, Z.clearing.z - 12], ko: '들소 공터', en: 'Bison Glade', m: [], f: [], txt: '🦬' },
      { at: [Z.swamp.x, Z.swamp.z], ko: '늪', en: 'Swamp', m: mOf('wet'), f: fOf('swamp') },
      { at: [Z.lake.x, Z.lake.z - 12], ko: '호수', en: 'Lake', m: [], f: fOf('lake', 'shore') },
      { at: [Z.castle.x, Z.castle.z - 32], ko: '성 언덕', en: 'Castle Hill', m: [], f: fOf('castle') },
      { at: [Z.village.x - 7, Z.village.z - 42], ko: '마을 풀밭', en: 'Village Meadow', m: [], f: fOf('meadowV') },
      { at: [rye[0].x, rye[0].z], ko: '호밀밭', en: 'Rye Field', m: [], f: fOf('rye') },
      { at: [rye[1].x, rye[1].z], ko: '호밀밭', en: 'Rye Field', m: [], f: fOf('rye') },
      { at: [flax.x, flax.z], ko: '아마밭', en: 'Flax Field', m: [], f: fOf('flax') },
      { at: [60, 120], ko: '들판', en: 'Meadow', m: mOf('meadow'), f: fOf('meadow') },
    ];
    // 지금 부탁받은 버섯·꽃
    const wantM = new Set(), wantF = new Set(), wantG = new Set();
    for (const r of QUESTS.res) { const i = QUESTS.curStep(r.p), q = QUESTS.QUESTS[i]; if (i < 0 || T.quests[i]) continue; if (q.m != null) wantM.add(q.m); if (q.f != null) wantF.add(q.f); if (q.g) wantG.add(q.g); }
    // 벌통 (우물은 장식이라 뺐다)
    g.font = (S / 34 | 0) + 'px sans-serif';
    for (const [list, gd] of [[WORLD.HIVES, 'honey']]) for (const o of list) {
      const [a, b] = P(o.x, o.z);
      if (wantG.has(gd)) { g.strokeStyle = '#e8402a'; g.lineWidth = 3; g.beginPath(); g.arc(a, b, S / 50, 0, 7); g.stroke(); }
      g.fillText(QUESTS.GOODS[gd].icon, a, b);
    }
    const fs = S / 30 | 0, isz = S / 21 | 0;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const zn of ZONES) {
      if (!zn.at) continue;
      const [a, b] = P(zn.at[0], zn.at[1]);
      const ic = [...zn.m.map(i => ({ url: ITEMS.ICONS.m[i], want: wantM.has(i) })), ...zn.f.map(i => ({ url: ITEMS.ICONS.f[i], want: wantF.has(i) })),
        ...(zn.e || []).map(gd => ({ emo: QUESTS.GOODS[gd].icon, want: wantG.has(gd) }))];
      const want = ic.some(o => o.want);
      g.font = (T.lang === 'ru' ? fs * 0.68 | 0 : (T.lang === 'en' ? fs * 0.78 | 0 : fs)) + 'px "Ria", sans-serif';
      g.lineWidth = 5; g.strokeStyle = 'rgba(20,16,10,.85)'; g.fillStyle = want ? '#ffd86a' : '#fff6e2';
      const ty = ic.length ? b - isz * 0.55 : b;
      g.strokeText(L(zn.ko, zn.en), a, ty); g.fillText(L(zn.ko, zn.en), a, ty);
      if (zn.txt) { g.font = (fs * 1.2 | 0) + 'px sans-serif'; g.fillText(zn.txt, a, b + fs); }
      const x0 = a - ic.length * isz / 2;
      ic.forEach((o, k) => {
        const cx = x0 + k * isz + isz / 2, cy = b + isz * 0.35;
        g.fillStyle = o.want ? 'rgba(255,245,220,.95)' : 'rgba(255,245,220,.55)';
        g.beginPath(); g.arc(cx, cy, isz * 0.46, 0, 7); g.fill();
        if (o.want) { g.strokeStyle = '#e8402a'; g.lineWidth = 3 + Math.sin(T.time * 6) * 1; g.stroke(); }
        if (o.emo) { g.font = (isz * 0.62 | 0) + 'px sans-serif'; g.fillStyle = '#000'; g.fillText(o.emo, cx, cy + 1); return; }
        const im = icon(o.url);
        if (im) g.drawImage(im, cx - isz * 0.42, cy - isz * 0.42, isz * 0.84, isz * 0.84);
      });
    }
  }

  // ── 손가락 ──
  let padId = null, padC = { x: 0, y: 0 }, lookId = null, lookP = { x: 0, y: 0 };
  function padSetup() {
    const pad = $('pad'), knob = $('knob');
    const R = 93;
    pad.addEventListener('pointerdown', e => {
      padId = e.pointerId; pad.setPointerCapture(e.pointerId);
      const r = pad.getBoundingClientRect();
      padC.x = r.left + r.width / 2; padC.y = r.top + r.height / 2;
      move(e); e.preventDefault();
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === padId) move(e); });
    const up = e => { if (e.pointerId !== padId) return; padId = null; IN.f = 0; IN.r = 0; IN.run = false; knob.style.transform = ''; };
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    function move(e) {
      let dx = e.clientX - padC.x, dy = e.clientY - padC.y;
      const d = Math.hypot(dx, dy), m = Math.min(1, d / R);
      if (d > 0.001) { dx /= d; dy /= d; }
      knob.style.transform = 'translate(' + (dx * m * 58) + 'px,' + (dy * m * 58) + 'px)';
      IN.r = Math.abs(dx * m) > 0.14 ? dx * m : 0;
      IN.f = Math.abs(dy * m) > 0.14 ? -dy * m : 0;
      IN.run = m > 0.78;
    }
    // 두 손가락 벌리기 = 시점 확대 (사장님 2026-09-20). 시점 손가락이 있는데 둘째 손가락이 닿으면 벌린 만큼 배율
    let pinch = null;   // { id, x, y, d0, z0 }
    const pinchDist = () => Math.hypot(pinch.x - lookP.x, pinch.y - lookP.y) || 1;
    addEventListener('pointerdown', e => {
      if (e.pointerId === padId) return;
      if (e.target.closest && e.target.closest('#pad,.tbtn,.tog,button,#title,#over,.panel,#topbar')) return;
      if (lookId != null && !pinch && e.pointerId !== lookId) {
        pinch = { id: e.pointerId, x: e.clientX, y: e.clientY, d0: 1, z0: CAM.userZoom || 1 };
        pinch.d0 = pinchDist();
        return;
      }
      lookId = e.pointerId; lookP.x = e.clientX; lookP.y = e.clientY;
    });
    addEventListener('pointermove', e => {
      if (pinch) {
        if (e.pointerId === pinch.id) { pinch.x = e.clientX; pinch.y = e.clientY; }
        else if (e.pointerId === lookId) { lookP.x = e.clientX; lookP.y = e.clientY; }
        else return;
        CAM.setZoom(pinch.z0 * pinch.d0 / pinchDist());   // 벌리면 가까이, 오므리면 멀리
        return;
      }
      if (e.pointerId !== lookId) return;
      CAMERA.look((e.clientX - lookP.x) * 1.3, (e.clientY - lookP.y) * 1.3);
      lookP.x = e.clientX; lookP.y = e.clientY;
    });
    const lu = e => {
      if (pinch && (e.pointerId === pinch.id || e.pointerId === lookId)) { pinch = null; lookId = null; return; }   // 한 손가락을 떼면 핀치 끝 (남은 손가락으로 시점이 튀지 않게)
      if (e.pointerId === lookId) lookId = null;
    };
    addEventListener('pointerup', lu); addEventListener('pointercancel', lu);
    hold($('bAct'), v => { if (v) IN.actEdge = true; });
    hold($('bJump'), v => { if (v) IN.jumpEdge = true; IN.upHeld = v; });
  }
  function hold(el, fn) {
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el.classList.add('on'); fn(true); e.preventDefault(); e.stopPropagation(); });
    const up = () => { el.classList.remove('on'); fn(false); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  // ── 매 프레임 ──
  const KEY_YAW = 2.3, KEY_PITCH = 1.3, AIM_KEY = 0.3;
  function read() {
    if (window.__hold || (touch && !Object.values(keys).some(Boolean))) return;
    IN.f = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
    IN.r = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    let ly = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), lp = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
    // 장총을 겨누는 동안(F)엔 방향키도 조준을 움직인다 — 걷지 않고 겨눈 채로 (사장님 2026-09-27 "F누른상태에서 조준시점이동은 이동키로")
    if (PL.aim) { ly += IN.r; lp -= IN.f; ly = U.clamp(ly, -1, 1); lp = U.clamp(lp, -1, 1); IN.f = IN.r = 0; }
    if (ly || lp) {
      const dt = Math.min(T.dt || 0.016, 0.05);
      const k = PL.aim ? AIM_KEY : 1;   // 겨눌 땐 천천히 — 휙휙 돌아 조준이 어려웠다 (사장님 2026-09-27)
      CAMERA.look(ly * KEY_YAW * k * dt / 0.0032, lp * KEY_PITCH * k * dt / 0.0026);
    }
    IN.run = !!(keys.ShiftLeft || keys.ShiftRight);
  }

  const last = {};
  function set(id, v) { if (last[id] !== v) { last[id] = v; $(id).textContent = v; } }
  let mapT = 0;
  let rHold = 0;
  // 아래 키 안내: 헤엄·잠수 중엔 물속 키로 바꾼다 (사장님 2026-09-19 "수영할 때 키 안내를 해줘")
  let keyMode = '', keyLand = null;
  const KEY_SWIM = ['← → ↑ ↓ 헤엄 · Shift 빨리 · Space 잠수<br>WASD 시점 · R(꾹) 리스폰', '← → ↑ ↓ Swim · Shift Fast · Space Dive<br>WASD Camera · R(hold) Respawn'];
  const KEY_DIVE = ['← → ↑ ↓ 헤엄 · W S 위·아래 · Space 떠오르기 · Shift 빨리', '← → ↑ ↓ Swim · W S Up/Down · Space Rise · Shift Fast'];
  const KEY_SPEAR = [' · E 작살', ' · E Spear'];
  const KEY_AIM = ['마우스 왼쪽 또는 쏘기 단추 · F 겨누기 끄기<br>마우스 · ← → ↑ ↓ · WASD 조준', 'Left click or the FIRE button · F Stop aiming<br>Mouse · ← → ↑ ↓ · WASD Aim'];
  function keyHelp() {
    const el = $('keys'); if (!el) return;
    const spear = TOOLS.held('spear');
    const m = PL.aim ? 'aim' + T.lang : PL.dive ? 'dive' + spear + T.lang : PL.swim ? 'swim' + T.lang : 'land';
    if (m === keyMode) return;
    if (keyMode === '' || keyMode === 'land') keyLand = el.innerHTML;   // 땅 위 안내는 index.html 이 언어별로 채워 둔 것
    keyMode = m;
    if (m === 'land') { el.innerHTML = keyLand; return; }
    const pick = a => L(a[0], a[1]);
    if (PL.aim) { el.innerHTML = pick(KEY_AIM); return; }   // 장총을 겨누는 동안
    el.innerHTML = PL.dive ? pick(KEY_DIVE) + (spear ? pick(KEY_SPEAR) : '') + '<br>A D ' + L('시점', 'Camera') + ' · R(' + L('꾹', 'hold') + ') ' + L('리스폰', 'Respawn') : pick(KEY_SWIM);
  }

  function paint(dt) {
    // R 을 1초 누르고 있으면 리스폰, 누르는 동안 화면이 어두워진다
    {
      const f = $('fade');
      const on = keys.KeyR && T.mode === 'play' && !T.paused && !panel;
      if (on && rHold >= 0) {
        rHold += dt || 0.016;
        f.style.transition = 'none'; f.style.opacity = Math.min(1, rHold) * 0.85;
        if (rHold >= 1) { rHold = -1; f.style.transition = ''; f.style.opacity = ''; GAME.respawn(); }
      } else if (!keys.KeyR) {
        if (rHold > 0) { f.style.transition = ''; f.style.opacity = ''; }
        rHold = 0;
      }
    }
    keyHelp();
    set('nBasket', T.basket.length + '/' + ITEMS.cap());
    set('nCoin', T.coins);
    // 들고 있는 물건 (있을 때만)
    let inv = '';
    for (const g in QUESTS.GOODS) if (T.items[g] > 0) inv += QUESTS.GOODS[g].icon + T.items[g] + ' ';
    { let nf = 0; for (const k in T.fish) nf += T.fish[k]; if (nf > 0) inv += ' 🐟' + nf; }
    if (T.dishes && T.dishes.length) inv += ' 🍲' + T.dishes.length;
    inv = inv.trim();
    set('nInv', inv);
    $('sInv').style.display = inv ? '' : 'none';
    const h = Math.floor(T.clock), mm = Math.floor((T.clock - h) * 6) * 10;
    set('nClock', String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'));
    set('iClock', SKY.cur.night > 0.5 ? '🌙' : '☀️');
    $('sBasket').classList.toggle('full', T.basket.length >= ITEMS.cap());
    $('bBag').classList.add('gone');   // 바구니도 E 로 내려놓는다 (tools.js, 2026-09-20)
    // 모은 개수·화살표 칸은 뺐다 (사장님 2026-09-18 "필요없는 표시") — 개수는 도감(B), 길은 빛기둥
    // 행동 안내
    const n = ITEMS.near, act = $('act'), bA = $('bAct');
    // 겨누는 동안은 행동 단추가 "발사" (사장님 2026-09-20 "폰에서 겨눌 때는 🎯 누르고 뭘 눌러야 쏘냐")
    if (!bA.dataset.def) bA.dataset.def = bA.textContent;
    const aiming = !!PL.aim && T.mode === 'play' && !T.paused;
    if (bA.textContent !== bA.dataset.def) bA.textContent = bA.dataset.def;   // 발사는 따로 '쏘기' 단추 (hunt.js)
    if (aiming) { act.classList.remove('show'); bA.classList.remove('ready'); }
    else if (n && !n.hide && T.mode === 'play' && !T.paused && !PL.act) {
      const label = touch ? n.label.replace(/^E\s+/, '') : n.label;
      if (act.textContent !== label) act.textContent = label;
      act.classList.add('show');
      bA.classList.add('ready');
    } else { act.classList.remove('show'); bA.classList.remove('ready'); }
    if (panel === 'map') { mapT -= dt; if (mapT <= 0) { mapT = 0.1; paintMap(); } }
    if (cardQ.length && !cardOn) nextCard();
    if (cardOn) { cardT -= dt; if (cardT <= 0) { $('card').classList.remove('on'); cardOn = false; } }
  }

  function bump(which) {
    const el = which === 'basket' ? $('sBasket') : null;
    if (!el) return;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  // 새로 찾은 것 — 그림과 이름
  const cardQ = []; let cardOn = false, cardT = 0;
  function card(img, name, kind, photo) { cardQ.push({ img, name, kind, photo }); }
  function nextCard() {
    const c = cardQ.shift();
    const el = $('card');
    el.querySelector('img').src = c.img || '';
    el.classList.toggle('photo', !!c.photo);
    el.querySelector('.nm').textContent = c.name;
    const cnt = ITEMS.counts()[c.kind];
    if (c.kind === 'd') el.querySelector('.ct').textContent = '🍲 ' + Object.keys(T.cooked || {}).length + '/4';
    else el.querySelector('.ct').textContent = { m: '🍄', f: '🌼', n: '🪺', b: '🦬', h: '🏠', p: '📍', k: '🐟' }[c.kind] + ' ' + cnt + '/' + (c.kind === 'h' ? QUESTS.QUESTS.length : (c.kind === 'p' ? TER.PLACES.length : (c.kind === 'k' ? FISHING.FISH.length : 12)));
    el.querySelector('.nw').textContent = 'NEW';
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    cardOn = true; cardT = 2.6;
  }

  function flash() { const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function dizzy(s) { const d = $('dizzy'); d.classList.add('on'); setTimeout(() => d.classList.remove('on'), s * 1000); }
  function praise(t) { FX.praise(t); }
  function show(on) { $('topbar').classList.toggle('show', on); }

  window.HUD = { emoji, bind, read, paint, bump, card, flash, dizzy, praise, show, open, shop: on => open(on ? 'shop' : null), paintMap,
    get panel() { return panel; }, get touch() { return touch; } };
})();
