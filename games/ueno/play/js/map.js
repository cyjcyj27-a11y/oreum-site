// map.js — 지도: 오른쪽 위 작은 지도(보는 방향이 위) + T 로 여는 큰 지도(북쪽이 위)
(function () {
  const $ = id => document.getElementById(id);
  const M = { big: false };
  let mini, mg, big, bg, base = null;

  function init(scene) {
    mini = $('mini'); mg = mini.getContext('2d');
    big = $('bigmap'); bg = big.getContext('2d');
    base = PARK.groundPaint && PARK.groundPaint.g.canvas;   // 땅 그림(잔디·길·연못·꽃잎)을 그대로 지도로 쓴다
    $('tMap').onclick = () => toggle();
    // 바깥(어두운 바탕)을 누를 때만 닫는다 — 모음판을 스크롤하려고 만지면 닫혀 버렸다 (9/14 사장님)
    $('bigwrap').addEventListener('pointerdown', e => { if (e.target === e.currentTarget) toggle(false); });
    addEventListener('keydown', e => { if (e.code === 'KeyT' && T.mode === 'play') toggle(); if (e.code === 'Escape' && M.big) toggle(false); });
  }

  function toggle(on) {
    M.big = on == null ? !M.big : on;
    if (M.big && document.pointerLockElement) document.exitPointerLock();   // 지도는 마우스로 누를 수 있게
    $('bigwrap').classList.toggle('show', M.big);
    T.paused = M.big || false;
    if (M.big) { drawBig(); if (window.JOY) $('coll').innerHTML = JOY.collectionHTML(); }
  }

  const PX = 8;
  // 땅 그림 위에 연못(파랑)·박물관·동물원 담을 덧그린다. to(x,z)→화면 좌표, k=1m 당 화면 크기
  function features(g, to, k) {
    const P = PARK.POND; const [cx, cy] = to(P.x, P.z);
    g.fillStyle = '#4f8fb0'; g.beginPath(); g.ellipse(cx, cy, P.rx * k, P.rz * k, 0, 0, 7); g.fill();
    const [ix, iy] = to(-64, 44); g.fillStyle = '#cfc3a0'; g.beginPath(); g.arc(ix, iy, 9 * k, 0, 7); g.fill();
    const [bx, by] = to(-45, 44); g.fillStyle = '#b8352a'; g.fillRect(bx - 12 * k, by - 2.6 * k, 24 * k, 5.2 * k);
    const [mx, my] = to(25, -100); g.fillStyle = '#6f6a60'; g.fillRect(mx - 38 * k, my - 10 * k, 76 * k, 20 * k);
    const [wx, wy] = to(-62, -68); g.fillStyle = '#8a5a44'; g.fillRect(wx - 42 * k, wy - 0.8 * k, 84 * k, 1.6 * k);
  }
  function state(zn) { return T.taken[zn.id] ? 'done' : ZONE.available(zn) ? 'next' : 'lock'; }

  // ── 작은 지도: 켄(조작 중인 사람)이 가운데, 카메라가 보는 쪽이 위 ──
  function drawMini() {
    const W = mini.width, R = W / 2, meters = 70, s = R / meters;
    const f = PL.f;
    mg.clearRect(0, 0, W, W);
    mg.save();
    mg.beginPath(); mg.arc(R, R, R - 2, 0, 7); mg.clip();
    mg.fillStyle = '#5f7d3f'; mg.fillRect(0, 0, W, W);
    const fwx = -Math.sin(CAM.yaw), fwz = -Math.cos(CAM.yaw);   // 카메라 앞쪽(월드)
    const th = -Math.atan2(fwx, -fwz);
    mg.translate(R, R); mg.rotate(th);
    if (base) {
      const k = s / PX;
      mg.drawImage(base, (PARK.X0 - f.pos.x) * s, (PARK.Z0 - f.pos.z) * s, base.width * k, base.height * k);
    }
    features(mg, (x, z) => [(x - f.pos.x) * s, (z - f.pos.z) * s], s);
    // 다음 갈 곳까지 점선
    const nt = ZONE.nextTarget();
    if (nt) {
      mg.setLineDash([6, 6]); mg.strokeStyle = 'rgba(255,220,80,.95)'; mg.lineWidth = 3;
      mg.beginPath(); mg.moveTo(0, 0); mg.lineTo((nt.zn.x - f.pos.x) * s, (nt.zn.z - f.pos.z) * s); mg.stroke(); mg.setLineDash([]);
    }
    mg.restore();
    // 장소 표시 — 글자는 똑바로 세운다
    const c = Math.cos(th), sn = Math.sin(th);
    const toScr = (x, z) => { const dx = (x - f.pos.x) * s, dz = (z - f.pos.z) * s; return [R + dx * c - dz * sn, R + dx * sn + dz * c]; };
    DATA.ZONES.forEach((zn, i) => {
      let [px, py] = toScr(zn.x, zn.z);
      const d = Math.hypot(px - R, py - R), lim = R - 14;
      const outside = d > lim;
      if (outside) { px = R + (px - R) / d * lim; py = R + (py - R) / d * lim; }
      marker(mg, px, py, i + 1, state(zn), outside ? 11 : 13);
    });
    // 오리배 퍼즐: 아직 못 데려온 새끼 오리(노랑)와 엄마 오리(갈색)
    const dd = window.PUZ && PUZ.duckDots();
    if (dd) {
      const dot = (x, z, col, r) => {
        const [px, py] = toScr(x, z); if (Math.hypot(px - R, py - R) > R - 8) return;
        mg.fillStyle = col; mg.strokeStyle = '#1b1b1f'; mg.lineWidth = 2; mg.beginPath(); mg.arc(px, py, r, 0, 7); mg.fill(); mg.stroke();
      };
      dot(dd.mom.x, dd.mom.z, '#8a6a48', 6);
      for (const k of dd.kids) if (!k.follow) dot(k.x, k.z, '#ffd23a', 5);
    }
    // 풀어야 할 퍼즐 자리
    if (nt && nt.puz) {
      let [px, py] = toScr(nt.zn.x, nt.zn.z);
      const d = Math.hypot(px - R, py - R), lim = R - 14;
      if (d > lim) { px = R + (px - R) / d * lim; py = R + (py - R) / d * lim; }
      marker(mg, px, py, '★', 'next', 13);
    }
    // 짝꿍
    const [ax, ay] = toScr(ALLY.f.pos.x, ALLY.f.pos.z);
    mg.fillStyle = ALLY.f === T.hiromi ? '#ff8fc0' : '#ffd24a'; mg.beginPath(); mg.arc(ax, ay, 4, 0, 7); mg.fill();
    // 나 — 가운데 화살표 (몸이 향한 쪽)
    const vx = Math.sin(f.yaw), vz = Math.cos(f.yaw);
    const ang = Math.atan2(vx * sn + vz * c, vx * c - vz * sn);
    arrow(mg, R, R, ang, 10, '#ffffff');
    // 테두리
    mg.strokeStyle = 'rgba(255,255,255,.85)'; mg.lineWidth = 3; mg.beginPath(); mg.arc(R, R, R - 2, 0, 7); mg.stroke();
    // 위쪽 표시(보는 방향)
    mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(R, 4); mg.lineTo(R - 6, 14); mg.lineTo(R + 6, 14); mg.fill();
  }

  function marker(g, x, y, n, st, r) {
    const pulse = st === 'next' ? 1 + Math.sin(T.time * 6) * 0.18 : 1;
    g.beginPath(); g.arc(x, y, r * pulse, 0, 7);
    g.fillStyle = st === 'done' ? '#8a8f96' : st === 'next' ? '#ffd23a' : 'rgba(20,20,26,.8)';
    g.fill(); g.lineWidth = 2; g.strokeStyle = '#1b1b1f'; g.stroke();
    g.fillStyle = st === 'next' ? '#1b1b1f' : '#fff';
    g.font = 'bold ' + Math.round(r * 1.2) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(st === 'done' ? '✓' : st === 'lock' ? '🔒' : String(n), x, y + 1);
  }
  function arrow(g, x, y, a, r, col) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = col; g.strokeStyle = '#1b1b1f'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(r, 0); g.lineTo(-r * 0.7, r * 0.7); g.lineTo(-r * 0.3, 0); g.lineTo(-r * 0.7, -r * 0.7); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }

  // ── 큰 지도: 북쪽이 위, 공원 전체와 장소 이름 ──
  function drawBig() {
    const H = big.height, W = big.width;
    bg.clearRect(0, 0, W, H);
    const s = Math.min(W / (PARK.X1 - PARK.X0), H / (PARK.Z1 - PARK.Z0));
    const ox = (W - (PARK.X1 - PARK.X0) * s) / 2, oy = (H - (PARK.Z1 - PARK.Z0) * s) / 2;
    const to = (x, z) => [ox + (x - PARK.X0) * s, oy + (z - PARK.Z0) * s];
    if (base) bg.drawImage(base, ox, oy, (PARK.X1 - PARK.X0) * s, (PARK.Z1 - PARK.Z0) * s);
    features(bg, to, s);
    // 순서대로 점선 길
    bg.setLineDash([10, 8]); bg.lineWidth = 4; bg.strokeStyle = 'rgba(27,27,31,.55)';
    bg.beginPath(); DATA.ZONES.forEach((zn, i) => { const [x, y] = to(zn.x, zn.z); i ? bg.lineTo(x, y) : bg.moveTo(x, y); }); bg.stroke(); bg.setLineDash([]);
    DATA.ZONES.forEach((zn, i) => {
      const [x, y] = to(zn.x, zn.z), st = state(zn);
      marker(bg, x, y, i + 1, st, 20);
      bg.font = 'bold 22px sans-serif'; bg.textAlign = 'center'; bg.lineWidth = 5; bg.strokeStyle = '#1b1b1f'; bg.fillStyle = st === 'next' ? '#ffd23a' : '#fff';
      const nm = window.L ? L(zn.name) : zn.name;   // 캔버스 글자는 관찰자가 못 본다
      bg.strokeText(nm, x, y + 40); bg.fillText(nm, x, y + 40);
    });
    // 자판기(딸기우유·고양이 캔)
    bg.font = '30px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; bg.textAlign = 'center'; bg.textBaseline = 'middle';
    for (const s of PARK.C.vend) { const [x, y] = to(s.x, s.z); bg.fillStyle = '#fff'; bg.beginPath(); bg.arc(x, y, 19, 0, 7); bg.fill(); bg.lineWidth = 3; bg.strokeStyle = '#f2a33a'; bg.stroke(); ICON.draw('can', bg, x - 14, y - 14, 28); }
    const dd = window.PUZ && PUZ.duckDots();
    if (dd) {
      const dot = (x, z, col, r) => { const [px, py] = to(x, z); bg.fillStyle = col; bg.strokeStyle = '#1b1b1f'; bg.lineWidth = 3; bg.beginPath(); bg.arc(px, py, r, 0, 7); bg.fill(); bg.stroke(); };
      dot(dd.mom.x, dd.mom.z, '#8a6a48', 11);
      for (const k of dd.kids) if (!k.follow) dot(k.x, k.z, '#ffd23a', 9);
    }
    const nt = ZONE.nextTarget();
    if (nt && nt.puz) {
      const [x, y] = to(nt.zn.x, nt.zn.z);
      marker(bg, x, y, '★', 'next', 20);
      bg.font = 'bold 22px sans-serif'; bg.textAlign = 'center'; bg.lineWidth = 5; bg.strokeStyle = '#1b1b1f'; bg.fillStyle = '#ffd23a';
      const nm = window.L ? L(nt.zn.name) : nt.zn.name;
      bg.strokeText(nm, x, y + 40); bg.fillText(nm, x, y + 40);
    }
    const [px, py] = to(PL.f.pos.x, PL.f.pos.z);
    arrow(bg, px, py, Math.atan2(Math.cos(PL.f.yaw), Math.sin(PL.f.yaw)), 16, '#ffffff');
  }

  function update(dt) {
    if (!mini) return;
    const show = T.mode === 'play' || T.mode === 'over';
    mini.style.display = show ? '' : 'none';
    if (show) drawMini();
    // 다음 갈 곳 빛기둥은 뺐다(2026-09-14 사장님). 길 안내는 작은 지도·상단 화살표로
  }

  Object.assign(M, { init, update, toggle });
  window.MAP = M;
})();
