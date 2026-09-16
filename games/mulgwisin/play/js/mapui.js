/* mapui.js — 지도(M)·인벤토리(I). 열려 있는 동안 게임은 멈춘다.
 * 지도: 물길을 왼쪽(집)→오른쪽(발원지)으로 눕혀 그린다. 할 일은 회색 점, 해내면 색이 찬다.
 * 인벤토리: 부적 8 · 흔적 5 · 유품 28 칸. 못 찾은 칸은 회색. (2026-09-16 사장님) */
(function () {
  const W = window.WORLD, EN = /[?&]lang=en/.test(location.search);
  const $ = id => document.getElementById(id);
  const MG = () => window.__mg;
  const box = $('menu'), cv = $('mapCv'), inv = $('invBox');
  const UI = { open: false, tab: 'map' };

  // ── 아이콘 — 이모지를 한 번 그려 두고 회색판을 따로 만든다(캔버스 filter 는 사파리에서 안 먹는다) ──
  const ICON = {}, IS = 44;
  function icon(ch) {
    if (ICON[ch]) return ICON[ch];
    const mk = gray => { const c = document.createElement('canvas'); c.width = c.height = IS; const x = c.getContext('2d');
      x.font = (IS * .72) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, IS / 2, IS / 2 + 2);
      // 음산하게 — 색을 빼고(saturation) 누렇게 바랜 뼈빛을 곱한 뒤(multiply) 원래 모양만 남긴다. 못 찾은 것은 더 어둡고 차갑게
      x.globalCompositeOperation = 'saturation'; x.globalAlpha = gray ? 1 : .8; x.fillStyle = '#808080'; x.fillRect(0, 0, IS, IS);
      x.globalAlpha = 1; x.globalCompositeOperation = 'multiply'; x.fillStyle = gray ? '#b4b9bb' : '#c8b48c'; x.fillRect(0, 0, IS, IS);
      { const v = x.createRadialGradient(IS / 2, IS / 2, IS * .12, IS / 2, IS / 2, IS * .6); v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, gray ? 'rgba(110,110,110,1)' : 'rgba(90,40,30,1)'); x.fillStyle = v; x.fillRect(0, 0, IS, IS); }   // 가장자리가 검붉게 죽는다
      x.globalCompositeOperation = 'destination-in'; x.fillText(ch, IS / 2, IS / 2 + 2);
      if (!gray) { const o = document.createElement('canvas'); o.width = o.height = IS; const y = o.getContext('2d'); y.shadowColor = 'rgba(120,0,0,.9)'; y.shadowBlur = 5; y.drawImage(c, 0, 0); return o; }   // 찾은 것은 검붉은 그늘
      return c; };
    return (ICON[ch] = { on: mk(false), off: mk(true) });
  }

  // ── 할 일 목록 — 위치와 해냈는지 ──
  function todos() {
    const out = [], PZ = window.PUZ, PR = window.PROPS;
    for (const d of PZ.DEF) {
      if (d.charm === undefined) continue;
      let x, z;
      if (d.type === 'prints') { x = d.umbrella.x; z = d.umbrella.z; }
      else if (d.type === 'hands') { x = d.rope.x; z = d.rope.z; }
      else if (d.type === 'jars') { x = d.jars[4].x; z = d.jars[4].z; }
      else if (d.type === 'stele') { x = d.site.st.x; z = d.site.st.z; }
      else continue;
      out.push({ ic: '📜', x, z, done: W.charmTaken.has(d.charm) });
    }
    for (const m of W.MARKS) {
      if (m.item) out.push({ ic: '👣', x: m.item.x, z: m.item.z, done: W.taken.has(m.i) });
      if (m.cp) out.push({ ic: '⛩', x: m.x, z: m.z, done: W.found.has(m.i) });
    }
    for (const sl of PR.SLUICE) out.push({ ic: '🔧', x: W.cx(sl.wz), z: sl.wz, done: W.used.has(sl.id) });
    return out;
  }

  // ── 지도 ──
  const Z0 = -48, Z1 = W.END + 14;
  function drawMap() {
    const g = MG(); if (!g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), R = cv.getBoundingClientRect();
    const w = Math.max(200, R.width), h = Math.max(120, R.height);
    cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mx = 34, sx = (w - mx * 2) / (Z1 - Z0);
    let lo = 1e9, hi = -1e9;
    for (let z = Z0; z <= Z1; z += 10) { const cx = W.cx(z), hw = W.hw(z) + 9; lo = Math.min(lo, cx - hw); hi = Math.max(hi, cx + hw); }
    const sy = Math.min((h - 70) / (hi - lo), sx * 3.2), xm = (lo + hi) / 2, cy = h / 2 - 6;
    const X = z => mx + (z - Z0) * sx, Y = x => cy - (x - xm) * sy;   // 위에서 내려다보면 +z 가 오른쪽일 때 +x 는 위

    // 바탕 — 물 먹은 한지
    c.fillStyle = '#17150f'; c.fillRect(0, 0, w, h);
    let sd = 4711; const rn = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < 700; i++) { c.fillStyle = 'rgba(' + (90 + rn() * 40 | 0) + ',' + (80 + rn() * 30 | 0) + ',60,' + (rn() * .05) + ')'; c.fillRect(rn() * w, rn() * h, 2 + rn() * 14, 1 + rn() * 5); }
    // 둔치(걸을 수 있는 뭍)
    const band = (off, fill) => { c.beginPath();
      for (let z = Z0; z <= Z1; z += 6) c.lineTo(X(z), Y(W.cx(z) + W.hw(z) + off));
      for (let z = Z1; z >= Z0; z -= 6) c.lineTo(X(z), Y(W.cx(z) - W.hw(z) - off));
      c.closePath(); c.fillStyle = fill; c.fill(); };
    band(6.5, '#2a2a20');
    band(0, '#0f2226');
    // 물 결 — 흐름 방향으로 짧은 획
    c.strokeStyle = 'rgba(120,160,165,.14)'; c.lineWidth = 1;
    for (let z = Z0 + 8; z < Z1; z += 14) for (const f of [-.45, 0, .45]) { const x = W.cx(z) + f * W.hw(z); c.beginPath(); c.moveTo(X(z) - 4, Y(x)); c.lineTo(X(z) + 4, Y(x)); c.stroke(); }
    // 물가 선
    for (const s of [1, -1]) { c.beginPath(); for (let z = Z0; z <= Z1; z += 6) c.lineTo(X(z), Y(W.cx(z) + s * W.hw(z))); c.strokeStyle = 'rgba(160,190,185,.35)'; c.lineWidth = 1.2; c.stroke(); }
    // 거리 눈금
    c.font = '15px Ria, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(210,200,180,.55)';
    for (let m = 0; m <= W.END; m += 300) { c.fillRect(X(m), h - 24, 1, 6); c.fillText(m + 'm', X(m), h - 8); }

    // 집·발원지
    const put = (ch, x, z, on, r) => { const ic = icon(ch), px = X(z), py = Y(x), s = r * 2;
      c.beginPath(); c.arc(px, py, r + 3, 0, 6.283); c.fillStyle = on ? 'rgba(120,34,26,.95)' : 'rgba(46,46,46,.92)'; c.fill();
      c.lineWidth = 1.5; c.strokeStyle = on ? '#d8b89a' : 'rgba(130,130,130,.7)'; c.stroke();
      c.globalAlpha = on ? 1 : .9; c.drawImage(on ? ic.on : ic.off, px - s / 2, py - s / 2, s, s); c.globalAlpha = 1; };
    put('🏠', W.HOME.x, W.HOME.z, true, 10);
    const spring = W.MARKS.find(m => m.t === 'spring');
    put('💧', spring.x, spring.z, g.G.state === 'clear', 12);
    // 할 일 — 같은 자리 겹치면 위아래로 비킨다
    const list = todos().sort((a, b) => a.z - b.z), placed = [];
    for (const t of list) {
      let x = t.x; const px = X(t.z);
      for (let k = 0; k < 6; k++) { const hit = placed.find(p => Math.abs(p.px - px) < 20 && Math.abs(p.py - Y(x)) < 20); if (!hit) break; x += (hit.py > Y(x) ? 1 : -1) * 22 / sy; }
      placed.push({ px, py: Y(x) });
      put(t.ic, x, t.z, t.done, 9);
    }
    // 나
    { const P = g.P, px = X(P.z), py = Y(P.x), a = Math.atan2(-Math.sin(P.yaw), Math.cos(P.yaw));   // 화면 방향: dz → 오른쪽, dx → 위
      const gl = c.createRadialGradient(px, py, 1, px, py, 22); gl.addColorStop(0, 'rgba(255,220,150,.55)'); gl.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = gl; c.fillRect(px - 22, py - 22, 44, 44);
      c.save(); c.translate(px, py); c.rotate(a);
      c.beginPath(); c.moveTo(11, 0); c.lineTo(-6, -7); c.lineTo(-3, 0); c.lineTo(-6, 7); c.closePath();
      c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1.5; c.stroke(); c.restore(); }
    // 위 줄 — 개수
    const cnt = ic => { const l = list.filter(t => t.ic === ic); return l.filter(t => t.done).length + '/' + l.length; };
    $('mapCnt').innerHTML = EMO('📜 ' + cnt('📜') + '   👣 ' + cnt('👣') + '   ⛩ ' + cnt('⛩') + '   🔧 ' + cnt('🔧'));
  }

  // ── 인벤토리 ──
  const TRACE_IC = { shoe: '👟', bag: '🎒', tie: '🎀', torch: '🔦', coat: '🧥' };
  const RELIC_IC = { RING: '💍', COIN: '🪙', HAIRPIN: '📌', WATCH: '⌚', GLASSES: '👓', WHISTLE: '📣', KEY: '🔑', MARBLE: '🔮' };
  function slot(ch, name, on) { return '<div class="slot' + (on ? ' on' : '') + '"><img src="' + (on ? icon(ch).on : icon(ch).off).toDataURL() + '" alt=""><span>' + name + '</span></div>'; }
  // 인벤토리 — 네모 칸을 행·열 맞춰 화면에 꽉 채운다(2026-09-16 사장님). 부적 → 흔적 → 유품 순, 남는 칸은 빈칸
  function drawInv() {
    const PR = window.PROPS, cells = [];
    const charmName = EN ? 'TALISMAN' : '부적';
    for (let i = 0; i < W.CHARM_N; i++) cells.push(slot('📜', charmName, W.charmTaken.has(i)));
    for (const m of W.MARKS) if (m.item) cells.push(slot(TRACE_IC[m.item.k] || '👣', EN ? m.item.en.replace(/^A /, '') : m.item.ko, W.taken.has(m.i)));
    for (const r of PR.RELICS) cells.push(slot(RELIC_IC[r.kind.en] || '💍', EN ? r.kind.en : r.kind.ko, W.used.has(r.id)));
    const R = inv.getBoundingClientRect(), bw = Math.max(200, R.width), bh = Math.max(150, R.height), gap = 6;
    let best = null;
    for (let cols = 4; cols <= 16; cols++) { const rows = Math.ceil(cells.length / cols), s = Math.min((bw - gap * (cols - 1)) / cols, (bh - gap * (rows - 1)) / rows); if (!best || s > best.s) best = { cols, rows, s }; }
    while (cells.length < best.cols * best.rows) cells.push('<div class="slot empty"></div>');
    inv.style.setProperty('--cols', best.cols); inv.style.setProperty('--rows', best.rows); inv.style.setProperty('--cell', Math.floor(best.s) + 'px');
    inv.innerHTML = '<div class="grid">' + cells.join('') + '</div>';
    $('mapCnt').innerHTML = EMO('📜 ' + W.charmTaken.size + '/' + W.CHARM_N + '   👣 ' + W.taken.size + '/' + W.TRACE_N + '   💍 ' + PR.relicCount() + '/' + PR.RELIC_N);
  }

  // ── 열고 닫기 ──
  function show(tab) {
    const g = MG(); if (!g || g.G.state !== 'play') return;
    if (UI.open && UI.tab === tab) return hide();
    UI.open = true; UI.tab = tab; g.G.menu = true; g.clearKeys && g.clearKeys();
    box.classList.add('show'); box.dataset.tab = tab;
    $('tabMap').classList.toggle('on', tab === 'map'); $('tabInv').classList.toggle('on', tab === 'inv');
    if (tab === 'map') drawMap(); else drawInv();
  }
  function hide() { UI.open = false; box.classList.remove('show'); const g = MG(); if (g) g.G.menu = false; }
  UI.show = show; UI.hide = hide;
  $('tabMap').addEventListener('click', () => show('map'));
  $('tabInv').addEventListener('click', () => show('inv'));
  $('menuX').addEventListener('click', hide);
  $('btnMap').addEventListener('click', () => show('map'));
  $('btnInv').addEventListener('click', () => show('inv'));
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'KeyM') { e.preventDefault(); show('map'); }
    else if (e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); show('inv'); }
    else if (e.code === 'Escape' && UI.open) { e.preventDefault(); hide(); }
  });
  addEventListener('resize', () => { if (UI.open) (UI.tab === 'map' ? drawMap : drawInv)(); });
  window.MAPUI = UI;
})();
