// 도트 인물: 뼈대(관절 각도)로 자세를 잡고, 작은 버퍼에 한 점씩 찍어 그린다(안티에일리어싱 없음).
// 각도: 0 = 아래, +π/2 = 바라보는 쪽 수평, π = 위, -π/2 = 등 쪽. 오른쪽을 본다고 놓고 그린 뒤 왼쪽은 뒤집는다.
(function () {
  const PX = (window.PX = {});
  const BW = 96, BH = 72, AX = 48, AY = 64;          // 버퍼 크기와 발 기준점
  const buf = new Uint32Array(BW * BH), lay = new Uint8Array(BW * BH);
  const cv = document.createElement('canvas'); cv.width = BW; cv.height = BH;
  const cx = cv.getContext('2d'); const img = cx.createImageData(BW, BH); const u32 = new Uint32Array(img.data.buffer);
  PX.BW = BW; PX.BH = BH; PX.AX = AX; PX.AY = AY;

  const hex = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0; };
  PX.hex = hex;
  // 색 세 단계 [밝은, 기본, 그늘]
  const tri = (a, b, c) => [hex(a), hex(b), hex(c)];
  PX.tri = tri;
  const LINE = hex('#1a0e12');

  // 인물 차림(조선): vest = 저고리·몸통, shirt = 소매, collar = 동정(흰 깃), pants = 바지, leg = 행전, boot = 신
  const W3 = tri('#fffbf0', '#ece6d6', '#b0a68e'), BLACK = tri('#3a3440', '#1e1a24', '#0c0a10');
  PX.LOOKS = {
    // 의적: 검은 두건·복면, 쪽빛 저고리·바지, 흰 행전, 짚신, 꼬리 날리는 두건 끈
    prince: { skin: tri('#f0bb88', '#d0905c', '#94583a'), hair: BLACK, band: BLACK, hat: 'mask',
      vest: tri('#4a5a8a', '#2c3a64', '#18203e'), shirt: tri('#4a5a8a', '#2c3a64', '#18203e'), collar: W3,
      pants: tri('#3e4c76', '#26324f', '#141a30'), leg: W3, sash: tri('#d8503e', '#a8302a', '#601a18'),
      boot: tri('#e0c890', '#b89a5e', '#7a6436'), tails: 1, weapon: 'hwando' },
    // 포졸: 검은 전립에 붉은 상모, 검은 쾌자, 흰 바지·행전, 육모방망이
    guard: { skin: tri('#e0a070', '#b8784a', '#7e4a2e'), hair: BLACK, band: tri('#ff6a4a', '#d8402a', '#802018'), hat: 'jeonrip',
      vest: tri('#4a4650', '#2a2630', '#141218'), shirt: W3, collar: W3, pants: W3, leg: W3,
      sash: tri('#5a8ae0', '#2f5ab4', '#183070'), boot: tri('#6a5a4a', '#46392c', '#2a2018'), mous: 1, weapon: 'club' },
    // 도깨비: 푸른 살, 붉은 머리, 뿔 하나, 호피 바지, 혹 달린 방망이(체력 10)
    skel: { skin: tri('#7ac0d8', '#4a8aa8', '#2a5470'), hair: tri('#ff6a4a', '#c8382a', '#701a14'), band: tri('#ffe88a', '#e0b840', '#8a6a14'), hat: 'horn',
      vest: tri('#7ac0d8', '#4a8aa8', '#2a5470'), shirt: tri('#7ac0d8', '#4a8aa8', '#2a5470'), collar: tri('#7ac0d8', '#4a8aa8', '#2a5470'),
      pants: tri('#ffb84a', '#d8862a', '#8a4a14'), leg: tri('#7ac0d8', '#4a8aa8', '#2a5470'), sash: tri('#3a2a1a', '#22180e', '#100a06'),
      boot: tri('#7ac0d8', '#4a8aa8', '#2a5470'), weapon: 'gclub', tall: 1.12, stripes: 1 },
    // 사또(탐관오리): 사모, 붉은 관복에 흉배, 수염, 환도
    vizier: { skin: tri('#e8b080', '#c08858', '#80583a'), hair: BLACK, band: BLACK, hat: 'samo',
      vest: tri('#e85a4a', '#b0302a', '#681818'), shirt: tri('#e85a4a', '#b0302a', '#681818'), collar: W3,
      pants: tri('#e85a4a', '#b0302a', '#681818'), leg: W3, sash: tri('#ffe08a', '#d8a838', '#8a6214'),
      boot: BLACK, beard: 1, robe: 1, tall: 1.06, weapon: 'hwando', badge: 1 },
    // 아버지(구할 사람): 흰 한복, 상투·망건, 흰 수염
    princess: { skin: tri('#f0c090', '#cc946a', '#8c6040'), hair: tri('#a8a8b0', '#7a7a84', '#4a4a52'), band: BLACK, hat: 'sangtu',
      vest: W3, shirt: W3, collar: tri('#e0d8c8', '#c8bea8', '#8a826e'), pants: W3, leg: W3, sash: tri('#b0b8c8', '#8a92a4', '#5a6070'),
      boot: tri('#e0c890', '#b89a5e', '#7a6436'), beard: 1, beardW: 1, tall: 0.96 },
  };
  // 무관: 검은 갓, 철릭(긴 겉옷), 환도
  PX.LOOKS.officer = { skin: tri('#e8a878', '#c0804e', '#7e5030'), hair: BLACK, band: BLACK, hat: 'gat',
    vest: tri('#5a8ad8', '#2f5ab0', '#183068'), shirt: tri('#5a8ad8', '#2f5ab0', '#183068'), collar: W3,
    pants: tri('#5a8ad8', '#2f5ab0', '#183068'), leg: W3, sash: tri('#ff6a4a', '#c8382a', '#701a14'),
    boot: BLACK, mous: 1, robe: 1, weapon: 'hwando' };
  PX.guardLook = function (kind, coat) {
    const g = Object.assign({}, kind === 'officer' ? PX.LOOKS.officer : PX.LOOKS.guard);
    if (coat) { g.vest = tri(coat[0], coat[1], coat[2]); if (kind === 'officer') { g.shirt = g.vest; g.pants = g.vest; } }
    return g;
  };

  function clear() { buf.fill(0); lay.fill(0); }
  function set(x, y, c, l) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= BW || y >= BH) return; buf[y * BW + x] = c; lay[y * BW + x] = l; }
  // 빛은 바라보는 쪽 위에서
  const LX = 0.55, LY = -0.83;
  // 끝이 둥근 막대(굵기가 r0→r1 로 변함). edge: 앞에 놓인 부분이면 이미 칠한 곳과 닿는 가장자리에 선을 긋는다
  function cap(ax, ay, bx, by, r0, r1, c3, l, edge) {
    const mr = Math.max(r0, r1) + 1;
    const x0 = Math.floor(Math.min(ax, bx) - mr), x1 = Math.ceil(Math.max(ax, bx) + mr);
    const y0 = Math.floor(Math.min(ay, by) - mr), y1 = Math.ceil(Math.max(ay, by) + mr);
    const dx = bx - ax, dy = by - ay, ll = dx * dx + dy * dy || 1e-6;
    for (let y = y0; y <= y1; y++) {
      if (y < 0 || y >= BH) continue;
      for (let x = x0; x <= x1; x++) {
        if (x < 0 || x >= BW) continue;
        const px = x + 0.5, py = y + 0.5;
        let t = ((px - ax) * dx + (py - ay) * dy) / ll; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + dx * t, qy = ay + dy * t, ex = px - qx, ey = py - qy, d = Math.sqrt(ex * ex + ey * ey), r = r0 + (r1 - r0) * t;
        if (d > r) continue;
        const i = y * BW + x;
        if (edge && r >= 1.8 && buf[i] && lay[i] !== l && d > r - 1) { buf[i] = LINE; lay[i] = l; continue; }
        let c = c3[1];
        if (d > r * 0.3) { const k = (ex * LX + ey * LY) / (d || 1); if (k > 0.5) c = c3[0]; else if (k < -0.3) c = c3[2]; }
        buf[i] = c; lay[i] = l;
      }
    }
  }
  function outline() {
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const i = y * BW + x; if (buf[i]) continue;
      if ((x > 0 && buf[i - 1] && lay[i - 1] !== 255) || (x < BW - 1 && buf[i + 1] && lay[i + 1] !== 255) ||
          (y > 0 && buf[i - BW] && lay[i - BW] !== 255) || (y < BH - 1 && buf[i + BW] && lay[i + BW] !== 255)) lay[i] = 254;
    }
    for (let i = 0; i < buf.length; i++) if (lay[i] === 254) { buf[i] = LINE; lay[i] = 255; }
  }
  const dir = (a) => [Math.sin(a), Math.cos(a)];

  // 뼈 길이(픽셀)
  const BONE = { thigh: 9.5, shin: 9.5, torso: 12, neck: 2, head: 4.3, uarm: 7, farm: 6.5 };
  PX.BONE = BONE;
  // 관절 자리 계산(발 기준점 0,0)
  function fk(p, s) {
    s = s || 1;
    const hip = [p.hx, p.hy];
    const td = [Math.sin(p.tl), -Math.cos(p.tl)];
    const neck = [hip[0] + td[0] * BONE.torso * s, hip[1] + td[1] * BONE.torso * s];
    const sh = [hip[0] + td[0] * (BONE.torso - 1.6) * s, hip[1] + td[1] * (BONE.torso - 1.6) * s];
    const ha = p.tl + (p.hd || 0);
    const head = [neck[0] + Math.sin(ha) * (BONE.neck + BONE.head) * s, neck[1] - Math.cos(ha) * (BONE.neck + BONE.head) * s];
    const limb = (o, a1, a2, l1, l2) => { const d1 = dir(a1), m = [o[0] + d1[0] * l1 * s, o[1] + d1[1] * l1 * s], d2 = dir(a2); return [m, [m[0] + d2[0] * l2 * s, m[1] + d2[1] * l2 * s]]; };
    const [fel, fhd] = limb(sh, p.fa, p.fa + p.fe, BONE.uarm, BONE.farm);
    const [bel, bhd] = limb(sh, p.ba, p.ba + p.be, BONE.uarm, BONE.farm);
    const [fkn, fan] = limb(hip, p.fh, p.fh - p.fk, BONE.thigh, BONE.shin);
    const [bkn, ban] = limb(hip, p.bh, p.bh - p.bk, BONE.thigh, BONE.shin);
    return { hip, neck, sh, head, ha, fel, fhd, bel, bhd, fkn, fan, bkn, ban };
  }
  PX.fk = fk;
  // 자세 하나를 버퍼에 그린다. o: { look, sword(0 없음 1 허리 2 손), t(시간, 꼬리 흔들림), vx(속도), air }
  function drawBody(p, o) {
    clear();
    const L = o.look, s = L.tall || 1, J = fk(p, s);
    const A = (v) => [AX + v[0], AY + v[1]];
    const hip = A(J.hip), neck = A(J.neck), sh = A(J.sh), head = A(J.head);
    const fel = A(J.fel), fhd = A(J.fhd), bel = A(J.bel), bhd = A(J.bhd), fkn = A(J.fkn), fan = A(J.fan), bkn = A(J.bkn), ban = A(J.ban);
    const dk = (c3) => [c3[1], c3[2], c3[2]];          // 뒤쪽 팔다리는 한 단계 어둡게
    const bones = L.bones;
    const t = o.t || 0, vx = o.vx || 0;
    const flow = Math.min(1, Math.abs(vx) / 60) + (o.air ? 0.5 : 0);   // 머리띠 꼬리·허리띠 끝이 날리는 정도
    // --- 뒤 팔 ---
    const armW = bones ? 0.9 : 1.9;
    cap(sh[0], sh[1], bel[0], bel[1], armW, armW * 0.85, dk(bones ? L.skin : L.shirt), 1);
    cap(bel[0], bel[1], bhd[0], bhd[1], bones ? 0.8 : 1.4, bones ? 0.8 : 1.2, dk(L.skin), 1);
    cap(bhd[0], bhd[1], bhd[0], bhd[1], 1.5, 1.5, dk(L.skin), 1);
    // --- 뒤 다리 ---
    legs(hip, bkn, ban, p.bh - p.bk, L, 2, true);
    // --- 긴 옷자락(재상·공주) ---
    if (L.robe) {
      const sk = L.pants, by = Math.max(fan[1], ban[1]), mx = (fan[0] + ban[0]) / 2, w = Math.max(5, Math.abs(fan[0] - ban[0]) / 2 + 3.5);
      for (let y = Math.round(hip[1]); y <= Math.round(by - 1); y++) {
        const k = (y - hip[1]) / Math.max(1, by - hip[1]);
        const c = hip[0] + (mx - hip[0]) * k, hw = 3.6 + (w - 3.6) * k;
        for (let x = Math.round(c - hw); x <= Math.round(c + hw); x++) set(x, y, x < c - hw * 0.4 ? sk[2] : x > c + hw * 0.5 ? sk[0] : sk[1], 3);
      }
    }
    // --- 몸통 ---
    if (bones) {
      cap(hip[0], hip[1], neck[0], neck[1], 1.1, 1.1, L.skin, 3);
      for (let k = 0.45; k < 0.95; k += 0.17) { const y = hip[1] + (neck[1] - hip[1]) * k, x = hip[0] + (neck[0] - hip[0]) * k; cap(x - 2.6, y, x + 2.6, y, 0.7, 0.7, L.skin, 3); }
      cap(hip[0] - 2.4, hip[1] - 0.5, hip[0] + 2.4, hip[1] - 0.5, 1.2, 1.2, L.skin, 3);
    } else {
      // 저고리 몸통 + 목에서 앞가슴으로 비스듬히 내려오는 흰 동정
      cap(hip[0], hip[1], neck[0], neck[1], 3.6, 4.1, L.vest, 3);
      const fwx = Math.cos(p.tl), fwy = Math.sin(p.tl);
      const cx0 = neck[0] - fwx * 0.6, cy0 = neck[1] + 0.6, cx1 = hip[0] + (neck[0] - hip[0]) * 0.5 + fwx * 3.2, cy1 = hip[1] + (neck[1] - hip[1]) * 0.5 + fwy * 3.2;
      cap(cx0, cy0, cx1, cy1, 0.8, 0.8, L.collar, 3);
      if (L.badge) { const bx = hip[0] + (neck[0] - hip[0]) * 0.6 + fwx * 1.2, by = hip[1] + (neck[1] - hip[1]) * 0.6; for (let yy = -2; yy <= 1; yy++) for (let xx = -1; xx <= 2; xx++) set(bx + xx, by + yy, (xx + yy) % 2 ? L.sash[0] : L.sash[1], 3); }
      if (L.stripes) { for (let k = 0; k < 3; k++) set(hip[0] - 2 + k * 2, hip[1] + 1 + (k % 2), LINE, 4); }
      // 허리띠와 등 뒤로 늘어진 끝
      const sx = hip[0] + Math.sin(p.tl) * 1.5, sy = hip[1] - Math.cos(p.tl) * 1.5;
      cap(sx - 3.4, sy, sx + 3.4, sy, 1.5, 1.5, L.sash, 4);
      if (!L.robe) {
        const sw = Math.sin(t * 9) * 0.25 * (0.3 + flow), ta = -0.45 - flow * 0.9 + sw;
        cap(sx - 2.5, sy + 0.5, sx - 2.5 + Math.sin(ta) * 6, sy + 0.5 + Math.cos(ta) * 6, 1.3, 0.8, L.sash, 4);
      }
    }
    // --- 칼집(허리) ---
    if (o.sword === 1) cap(hip[0] - 2, hip[1] + 1, hip[0] - 6, hip[1] + 9, 0.9, 0.8, SCAB, 4);
    // --- 머리 ---
    const hr = BONE.head * s, ha = J.ha;
    if (L.longhair) cap(head[0] - 2, head[1] - 1, head[0] - 4.5 - flow * 2, head[1] + 9, 3.2, 2.2, L.hair, 5);
    cap(head[0], head[1], head[0], head[1], hr, hr, L.skin, 6);
    const fx = Math.cos(ha), fy = Math.sin(ha);
    if (!bones) {
      set(head[0] + fx * (hr + 0.4), head[1] + fy * (hr + 0.4) + 0.4, L.skin[1], 6);      // 코
      set(head[0] + fx * 2.1 + fy * 0.8, head[1] + fy * 2.1 - 0.9, LINE, 6);              // 눈
      if (L.mous) cap(head[0] + fx * 1.6, head[1] + 1.8, head[0] + fx * 3.6, head[1] + 2.2, 0.7, 0.7, L.hair, 6);
      if (L.beard) cap(head[0] + fx * 2.2, head[1] + 2.4, head[0] + fx * 1.6, head[1] + 7, 1.6, 0.6, L.hair, 6);
      const hx = head[0], hy = head[1];
      if (L.beardW) cap(hx + fx * 2.0, hy + 2.2, hx + fx * 1.2, hy + 7.5, 1.8, 0.6, tri('#ffffff', '#e8e8f0', '#a8a8b8'), 6);
      if (L.hat === 'mask') {
        // 두건(머리 위·뒤를 덮음) + 눈 아래를 가린 복면 + 뒤로 날리는 두건 끈
        cap(hx - 1.4, hy - 1.4, hx + 0.2, hy - 2.2, hr - 0.4, hr - 0.9, L.band, 7);
        cap(hx - 2.6, hy + 0.2, hx - 2.8, hy + 2.6, 2.1, 1.5, L.band, 7);
        cap(hx - 1.5, hy + 1.6, hx + fx * 3.8, hy + 1.9, 1.5, 1.1, L.band, 7);
        set(hx + fx * 2.1 + fy * 0.8, hy + fy * 2.1 - 0.9, LINE, 7);
      } else if (L.hat === 'jeonrip') {
        cap(hx - 1.6, hy - 1.0, hx - 2.4, hy + 2.2, 2.0, 1.4, L.hair, 7);
        cap(hx - 0.3, hy - 4.2, hx - 0.3, hy - 4.2, 2.9, 2.9, BLACK, 7);
        cap(hx - 6.6, hy - 2.7, hx + 6.0, hy - 2.7, 1.0, 1.0, BLACK, 7);
        cap(hx - 0.3, hy - 7.3, hx - 0.3, hy - 7.3, 1.2, 1.2, L.band, 7);
        const sw = Math.sin(t * 7) * 0.6;
        cap(hx - 0.8, hy - 7.0, hx - 3.4 + sw, hy - 4.6, 0.6, 0.5, L.band, 7);
      } else if (L.hat === 'gat') {
        cap(hx - 1.6, hy - 1.0, hx - 2.4, hy + 2.2, 2.0, 1.4, L.hair, 7);
        cap(hx - 0.4, hy - 3.4, hx - 0.4, hy - 7.6, 2.3, 2.1, BLACK, 7);
        cap(hx - 7.4, hy - 3.0, hx + 6.8, hy - 3.0, 0.8, 0.8, BLACK, 7);
        set(hx + fx * 2.6, hy + 2.6, BLACK[1], 7); set(hx + fx * 2.2, hy + 3.6, BLACK[1], 7);
      } else if (L.hat === 'samo') {
        // 사모: 앞은 낮은 둥근 모자, 뒤는 높은 둥근 턱, 양옆으로 납작한 날개(옆에서 보면 뒤로 길게 하나, 앞에 조금)
        const G2 = tri('#6a6a78', '#2a2a32', '#0e0e14');
        cap(hx - 0.4, hy - 2.6, hx + 0.6, hy - 2.8, hr + 0.3, hr - 0.2, G2, 7);
        cap(hx - 2.0, hy - 5.6, hx - 2.0, hy - 5.6, 2.6, 2.6, G2, 7);
        cap(hx - 9.0, hy - 5.0, hx - 3.0, hy - 5.6, 1.5, 1.1, G2, 8);
        cap(hx + 1.2, hy - 6.2, hx + 4.0, hy - 6.6, 1.0, 0.8, G2, 8);
        cap(hx - 3.2, hy - 0.8, hx + 3.4, hy - 1.4, 0.6, 0.6, tri('#a8a8b8', '#6a6a78', '#3a3a44'), 8);
      } else if (L.hat === 'horn') {
        for (let k = 0; k < 5; k++) { const a = -2.4 + k * 0.55 + Math.sin(t * 5 + k) * 0.08; cap(hx - 0.8, hy - 1.6, hx - 0.8 + Math.sin(a) * 6.2, hy - 1.6 - Math.cos(a) * 6.2 * 0.8, 1.6, 0.5, L.hair, 7); }
        cap(hx + 0.6, hy - 3.6, hx + 1.6, hy - 8.4, 1.4, 0.4, L.band, 7);
        set(hx + fx * 2.1 + fy * 0.8, hy + fy * 2.1 - 1.3, hex('#ffe88a'), 7);
        cap(hx + fx * 1.4, hy + 2.6, hx + fx * 3.4, hy + 2.6, 0.6, 0.6, LINE, 7);
      } else if (L.hat === 'sangtu') {
        cap(hx - 1.6, hy - 1.6, hx - 0.2, hy - 2.4, hr - 1.0, hr - 1.4, L.hair, 7);
        cap(hx - 0.8, hy - 5.0, hx - 0.8, hy - 6.0, 1.3, 1.1, L.hair, 7);
        cap(hx - 3.6, hy - 1.4, hx + 3.2, hy - 2.4, 0.8, 0.8, BLACK, 8);
      }
      if (L.tails) {
        for (let k = 0; k < 2; k++) {
          const wv = Math.sin(t * 11 + k * 1.7) * (0.15 + flow * 0.25);
          const a1 = -0.9 - flow * 0.55 + wv + k * 0.25, l1 = 4.5 + flow * 1.5;
          const p1 = [hx - 3.4, hy - 0.6], p2 = [p1[0] + Math.sin(a1) * l1, p1[1] + Math.cos(a1) * l1];
          const a2 = a1 + Math.sin(t * 11 + k * 1.7 + 1.2) * 0.35 * (0.3 + flow), p3 = [p2[0] + Math.sin(a2) * 3.5, p2[1] + Math.cos(a2) * 3.5];
          cap(p1[0], p1[1], p2[0], p2[1], 0.9, 0.8, L.band, 8); cap(p2[0], p2[1], p3[0], p3[1], 0.8, 0.6, L.band, 8);
        }
      }
    } else {
      set(head[0] + 1, head[1] - 0.5, LINE, 6); set(head[0] + 3, head[1] - 0.5, LINE, 6);   // 눈구멍
      set(head[0] + 2, head[1] + 2, LINE, 6); set(head[0] + 3.4, head[1] + 2, LINE, 6);
    }
    // --- 앞 다리 ---
    legs(hip, fkn, fan, p.fh - p.fk, L, 9, false);
    // --- 앞 팔 + 칼 ---
    cap(sh[0], sh[1], fel[0], fel[1], armW, armW * 0.85, bones ? L.skin : L.shirt, 10, true);
    cap(fel[0], fel[1], fhd[0], fhd[1], bones ? 0.8 : 1.4, bones ? 0.8 : 1.2, L.skin, 11, true);
    if (o.sword === 2) { weapon = L.weapon || 'hwando'; sword(fhd, p.sw, 12); }
    cap(fhd[0], fhd[1], fhd[0], fhd[1], 1.6, 1.6, L.skin, 13, true);
    outline();
  }
  function legs(hip, kn, an, shinA, L, l, back) {
    const c = (c3) => (back ? [c3[1], c3[2], c3[2]] : c3);
    if (L.bones) {
      cap(hip[0], hip[1], kn[0], kn[1], 0.9, 0.9, c(L.skin), l, !back);
      cap(kn[0], kn[1], an[0], an[1], 0.9, 0.8, c(L.skin), l + 1, !back);
    } else if (!L.robe) {
      cap(hip[0], hip[1], kn[0], kn[1], 3.0, 2.7, c(L.pants), l, !back);      // 넉넉한 바지
      cap(kn[0], kn[1], an[0], an[1], 2.6, 1.7, c(L.pants), l, !back);
      if (L.leg) { const mx = kn[0] + (an[0] - kn[0]) * 0.45, my = kn[1] + (an[1] - kn[1]) * 0.45; cap(mx, my, an[0], an[1], 1.9, 1.5, c(L.leg), l, false); }
    }
    const fa = shinA + 1.45, fx = an[0] + Math.sin(fa) * 3.2, fy = an[1] + Math.cos(fa) * 3.2;   // 신: 발목에서 앞으로
    cap(an[0] - 0.4, an[1] - 0.2, fx, fy, 1.4, 1.1, c(L.boot), l + 1, !back);
  }
  // 곡도: 금색 손잡이, 날은 끝으로 갈수록 휜다
  const STEEL = tri('#ffffff', '#d4dce8', '#7c889c'), GOLD = tri('#ffe48a', '#d8a838', '#8a6214'), SCAB = tri('#5a4a3a', '#34281e', '#18120c');
  const WOOD = tri('#c89058', '#8a5a2e', '#4e3018'), DARK = tri('#5a5a64', '#34343c', '#16161c');
  let weapon = 'hwando';
  function sword(h, a, l) {
    const d = dir(a), n = [d[1], -d[0]];
    if (weapon === 'club' || weapon === 'gclub') {
      // 육모방망이 / 도깨비 방망이: 손잡이에서 굵어지는 나무
      const big = weapon === 'gclub', L0 = big ? 13 : 11;
      cap(h[0] - d[0] * 1.5, h[1] - d[1] * 1.5, h[0] + d[0] * L0, h[1] + d[1] * L0, 0.9, big ? 2.6 : 1.4, WOOD, l);
      if (big) for (let k = 4; k <= L0; k += 3) { const px = h[0] + d[0] * k, py = h[1] + d[1] * k; set(px + n[0] * 2.4, py + n[1] * 2.4, hex('#ffe88a'), l); set(px - n[0] * 2.4, py - n[1] * 2.4, hex('#ffe88a'), l); }
      else { cap(h[0] + d[0] * 1.6, h[1] + d[1] * 1.6, h[0] + d[0] * 1.6, h[1] + d[1] * 1.6, 1.1, 1.1, tri('#ff6a4a', '#c8382a', '#701a14'), l); }
      return;
    }
    // 환도: 검은 손잡이, 둥근 코등이, 거의 곧은 날
    cap(h[0] - d[0] * 2.2, h[1] - d[1] * 2.2, h[0] + d[0] * 1.2, h[1] + d[1] * 1.2, 0.8, 0.8, DARK, l);
    const gx = h[0] + d[0] * 1.6, gy = h[1] + d[1] * 1.6;
    cap(gx - n[0] * 1.6, gy - n[1] * 1.6, gx + n[0] * 1.6, gy + n[1] * 1.6, 1.0, 1.0, GOLD, l);
    let px = gx, py = gy;
    for (let k = 1; k <= 7; k++) {
      const aa = a + (k / 7) * (k / 7) * 0.16, dd = dir(aa), nx = px + dd[0] * 2.1, ny = py + dd[1] * 2.1;
      cap(px, py, nx, ny, k < 6 ? 0.9 : 0.6, k < 6 ? 0.9 : 0.5, STEEL, l);
      px = nx; py = ny;
    }
  }
  PX.swordTip = function (p, look) {
    const J = fk(p, (look && look.tall) || 1), h = J.fhd; let px = h[0] + Math.sin(p.sw) * 1.6, py = h[1] + Math.cos(p.sw) * 1.6;
    for (let k = 1; k <= 7; k++) { const aa = p.sw + (k / 7) * (k / 7) * 0.45; px += Math.sin(aa) * 2.1; py += Math.cos(aa) * 2.1; }
    return [px, py];
  };

  // 대상 캔버스에 찍는다(x,y = 발 자리, f = 바라보는 쪽 1/-1). o.tint: [r,g,b,세기] 덮어 칠하기(맞았을 때 번쩍)
  PX.draw = function (g, p, o, x, y, f) {
    drawBody(p, o);
    if (o.tint) {
      const [r, gg, b, k] = o.tint;
      for (let i = 0; i < buf.length; i++) { const c = buf[i]; if (!c) continue; const cr = c & 255, cg = (c >> 8) & 255, cb = (c >> 16) & 255;
        buf[i] = (0xff000000 | (Math.round(cb + (b - cb) * k) << 16) | (Math.round(cg + (gg - cg) * k) << 8) | Math.round(cr + (r - cr) * k)) >>> 0; }
    }
    u32.set(buf); cx.putImageData(img, 0, 0);
    g.save();
    g.translate(Math.round(x), Math.round(y));
    if (f < 0) g.scale(-1, 1);
    if (o.alpha != null) g.globalAlpha = o.alpha;
    g.drawImage(cv, -AX, -AY);
    g.restore();
  };

  // ---------------- 자세 ----------------
  const B = (o) => Object.assign({ hx: 0, hy: -19, tl: 0.04, hd: 0, fa: 0.12, fe: 0.25, ba: -0.08, be: 0.3, fh: 0.06, fk: 0.08, bh: -0.06, bk: 0.06, sw: 1.2 }, o);
  PX.B = B;
  const POSE = (PX.POSE = {
    stand: B({}),
    // 숙이기: 무릎을 깊이 굽히고 상체를 앞으로 접어 머리가 허리 높이까지(날아오는 화살이 위로 지나감)
    duck: B({ hx: -1, hy: -9, tl: 0.95, hd: -0.35, fh: 1.6, fk: 2.6, bh: 1.15, bk: 2.45, fa: 1.1, fe: 0.5, ba: 0.6, be: 0.6 }),
    crouch: B({ hy: -12, tl: 0.42, hd: -0.3, fh: 1.45, fk: 2.45, bh: 1.0, bk: 2.2, fa: 0.55, fe: 0.4, ba: 0.25, be: 0.5 }),
    landHard: B({ hy: -10, tl: 0.7, hd: -0.5, fh: 1.6, fk: 2.6, bh: 1.2, bk: 2.5, fa: 0.4, fe: 0.1, ba: 0.2, be: 0.2 }),
    jumpPrep: B({ hy: -14, tl: 0.3, hd: -0.15, fh: 1.1, fk: 1.9, bh: 0.8, bk: 1.7, fa: -0.7, fe: 0.4, ba: -0.9, be: 0.4 }),
    jumpUp: B({ hy: -21, tl: -0.04, hd: 0.1, fh: 0.12, fk: 0.1, bh: -0.15, bk: 0.35, fa: 3.0, fe: 0.05, ba: 2.85, be: 0.1 }),
    leap: B({ hy: -20, tl: 0.35, hd: -0.1, fh: 1.3, fk: 1.2, bh: -0.7, bk: 1.1, fa: 2.2, fe: 0.5, ba: -1.2, be: 0.6 }),
    hang: B({ hx: -1, hy: -19, tl: 0.0, hd: 0.25, fh: 0.15, fk: 0.25, bh: -0.12, bk: 0.4, fa: 3.0, fe: 0.0, ba: 2.92, be: 0.0 }),
    fall: B({ hy: -20, tl: 0.1, hd: -0.2, fh: 0.6, fk: 1.0, bh: -0.3, bk: 0.9, fa: 2.3, fe: 0.6, ba: 2.6, be: 0.5 }),
    teeter: B({ hy: -19, tl: -0.35, hd: 0.3, fh: 0.3, fk: 0.2, bh: -0.1, bk: 0.1, fa: 2.0, fe: 0.8, ba: -2.2, be: -0.5 }),
    skid: B({ hx: -2, hy: -16, tl: -0.25, hd: 0.15, fh: 0.9, fk: 0.4, bh: -0.3, bk: 1.0, fa: 1.4, fe: 0.5, ba: -0.6, be: 0.9 }),
    dead: B({ hx: -6, hy: -3, tl: -1.57, hd: -0.2, fh: -1.6, fk: 0.2, bh: -1.45, bk: 0.5, fa: -2.0, fe: 0.4, ba: -1.4, be: 0.3 }),
    // 칼싸움
    guardF: B({ hx: -1, hy: -18, tl: 0.1, hd: 0, fh: 0.55, fk: 0.5, bh: -0.4, bk: 0.35, fa: 1.05, fe: 0.55, ba: -0.9, be: 1.6, sw: 2.15 }),
    strike: B({ hx: 3, hy: -17, tl: 0.38, hd: -0.25, fh: 0.95, fk: 0.75, bh: -0.7, bk: 0.2, fa: 1.62, fe: 0.0, ba: -1.4, be: 0.5, sw: 1.68 }),
    windup: B({ hx: -2, hy: -18, tl: -0.05, hd: 0.05, fh: 0.45, fk: 0.4, bh: -0.45, bk: 0.4, fa: 2.5, fe: 1.0, ba: -0.8, be: 1.4, sw: 3.6 }),
    block: B({ hx: -1, hy: -18, tl: 0.02, hd: 0.1, fh: 0.5, fk: 0.45, bh: -0.45, bk: 0.4, fa: 1.25, fe: 1.1, ba: -0.8, be: 1.5, sw: 3.05 }),
    hurt: B({ hx: -3, hy: -18, tl: -0.35, hd: 0.4, fh: 0.4, fk: 0.4, bh: -0.5, bk: 0.3, fa: 0.6, fe: 0.4, ba: -0.6, be: 0.7, sw: 1.5 }),
    drink: B({ hy: -19, tl: -0.1, hd: 0.55, fa: 2.3, fe: 1.9, ba: -0.1, be: 0.3 }),
    victory: B({ hy: -19, tl: -0.05, hd: 0.25, fa: 2.9, fe: 0.1, ba: -0.2, be: 0.3, sw: 3.0 }),
  });
  const lerp = (a, b, k) => a + (b - a) * k;
  PX.mix = function (a, b, k) { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key] != null ? b[key] : a[key], k); return o; };
  PX.ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
  // 열쇠 자세 목록 [[시간, 자세], …] 를 t 에서 섞는다
  PX.keys = function (ks, t) {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const a = ks[i - 1], b = ks[i]; return PX.mix(a[1], b[1], PX.ease((t - a[0]) / (b[0] - a[0]))); }
    return ks[ks.length - 1][1];
  };
  // 달리기 한 바퀴(p 0~1)
  PX.run = function (p) {
    const a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    const leg = (ph) => { const ss = Math.sin(ph), cc = Math.cos(ph); return [0.15 + 0.95 * ss, 0.35 + 1.25 * Math.max(0, cc) * (0.4 + 0.6 * Math.max(0, ss + 0.3))]; };
    const [fh, fk] = leg(a), [bh, bk] = leg(a + Math.PI);
    return B({ hy: -17.6 - 1.3 * Math.abs(c), tl: 0.3, hd: -0.18, fh, fk, bh, bk, fa: -0.85 * s + 0.25, fe: 1.35, ba: 0.85 * s + 0.2, be: 1.35 });
  };
  // 걷기
  PX.walk = function (p) {
    const a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    return B({ hy: -18.8 - 0.6 * Math.abs(c), tl: 0.08, fh: 0.08 + 0.42 * s, fk: 0.1 + 0.5 * Math.max(0, c), bh: 0.08 - 0.42 * s, bk: 0.1 + 0.5 * Math.max(0, -c), fa: -0.35 * s + 0.1, fe: 0.35, ba: 0.35 * s - 0.05, be: 0.4 });
  };
  // 칼 들고 앞뒤 걸음(p 0~1, 한 걸음)
  PX.fenceStep = function (p, back) {
    const k = Math.sin(p * Math.PI), q = POSE.guardF;
    return Object.assign({}, q, { hy: q.hy - k * 1.2, fh: q.fh + (back ? -0.35 : 0.3) * k, fk: q.fk + 0.4 * k, bh: q.bh + (back ? 0.25 : -0.2) * k, bk: q.bk + 0.3 * k });
  };
  // 매달려 기어오르기(k 0~1). 발 자리는 게임이 매달린 자리 → 턱 위로 옮긴다
  PX.climbKeys = [
    [0.0, POSE.hang],
    [0.28, B({ hx: -1, hy: -12, tl: 0.35, hd: 0.3, fh: 0.5, fk: 1.0, bh: 0.1, bk: 0.9, fa: 2.0, fe: 1.6, ba: 1.9, be: 1.6 })],
    [0.55, B({ hx: -4, hy: -9, tl: 0.85, hd: -0.2, fh: 1.9, fk: 2.6, bh: 0.6, bk: 1.6, fa: 1.0, fe: 0.4, ba: 0.9, be: 0.4 })],
    [0.78, B({ hx: -1, hy: -12, tl: 0.5, hd: -0.2, fh: 1.4, fk: 2.3, bh: 0.9, bk: 2.0, fa: 0.6, fe: 0.4, ba: 0.4, be: 0.4 })],
    [1.0, POSE.stand],
  ];
})();