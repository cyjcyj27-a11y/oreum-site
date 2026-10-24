// 손님 그림: 캔버스에 코드로 그리는 상반신(머리~허리), 머리가 큰 귀여운 비율. 표정마다 한 장씩 구워 둔다
// 빛은 왼쪽 위 노점 전구(따뜻함) → 그늘은 오른쪽 아래, 오른쪽 가장자리에 거리 불빛(차가운 테두리)
(function () {
  const F = (window.FOLK = {});
  const W = 512, H = 640;
  F.W = W; F.H = H;
  F.neckY = (p) => dims(p).neckY - 6; // 머리가 도는 축(목 위)

  // ---------- 색 도우미 ----------
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb(a, al) { const s = a.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(','); return al === undefined ? 'rgb(' + s + ')' : 'rgba(' + s + ',' + al + ')'; }
  function lit(c) { const a = hex(c); return rgb([a[0] + (255 - a[0]) * 0.1 + 14, a[1] + (255 - a[1]) * 0.08 + 6, a[2] + (255 - a[2]) * 0.04 - 4]); }
  function shd(c) { const a = hex(c); return rgb([a[0] * 0.62, a[1] * 0.64, a[2] * 0.72 + 18]); }
  function ink(c) { const a = hex(c); return rgb([a[0] * 0.32, a[1] * 0.28, a[2] * 0.3]); }
  function light(c, k) { const a = hex(c); return rgb(a.map((v) => v + (255 - v) * k)); }
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  let ST = 'cel';
  // 한 덩어리 칠하기: 바깥 선(cel) → 밝은 면 → 오른쪽 아래 그늘(밝은 면을 빛 쪽으로 민 나머지) → 반짝 → 차가운 테두리빛
  function part(g, path, base, o) {
    o = o || {};
    const b = o.box, sx = o.sx === undefined ? b[2] * 0.2 : o.sx, sy = o.sy === undefined ? b[3] * 0.08 : o.sy;
    if (ST === 'cel' && o.line !== false) { g.save(); path(); g.lineJoin = 'round'; g.lineWidth = (o.lw || 4.5) * 2; g.strokeStyle = o.lc || ink(base); g.stroke(); g.restore(); }
    g.save(); path(); g.clip();
    g.fillStyle = shd(base); g.fillRect(b[0] - 20, b[1] - 20, b[2] + 40, b[3] + 40);
    g.save(); if (ST === 'paint') g.filter = 'blur(' + Math.max(6, b[2] * 0.06) + 'px)';
    g.translate(-sx, -sy); path(); g.fillStyle = lit(base); g.fill(); g.restore();
    if (o.hi) { g.save(); if (ST === 'paint') g.filter = 'blur(5px)'; g.fillStyle = 'rgba(255,244,222,' + (ST === 'cel' ? 0.5 : 0.35) + ')'; g.strokeStyle = g.fillStyle; o.hi(g); g.restore(); }
    // 차가운 테두리빛(오른쪽)
    const rg = g.createLinearGradient(b[0] + b[2] * 0.55, 0, b[0] + b[2], 0); rg.addColorStop(0, 'rgba(150,190,255,0)'); rg.addColorStop(1, 'rgba(150,190,255,' + (o.rim === undefined ? 0.55 : o.rim) + ')');
    g.save(); if (ST === 'paint') g.filter = 'blur(2px)'; g.translate(3, 0); path(); g.lineWidth = 9; g.strokeStyle = rg; g.stroke(); g.restore();
    if (ST === 'paint') { for (let i = 0; i < (o.brush || 40); i++) { const x = b[0] + rnd() * b[2], y = b[1] + rnd() * b[3], l = 6 + rnd() * 18; g.strokeStyle = rnd() < 0.5 ? 'rgba(255,240,220,' + (0.04 + rnd() * 0.05) + ')' : 'rgba(30,15,10,' + (0.04 + rnd() * 0.05) + ')'; g.lineWidth = 2 + rnd() * 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.5, y + l); g.stroke(); } }
    g.restore();
    if (ST === 'paint' && o.line !== false) { g.save(); path(); g.lineJoin = 'round'; g.lineWidth = 2.5; g.strokeStyle = rgb(hex(ink(base)), 0.45); g.stroke(); g.restore(); }
  }
  function stroke(g, w, c, f) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.strokeStyle = c; g.beginPath(); f(); g.stroke(); g.restore(); }
  function fill(g, c, f) { g.save(); g.fillStyle = c; g.beginPath(); f(); g.fill(); g.restore(); }

  // ---------- 비율 ----------
  function dims(p) {
    const kid = p.age === 'kid', old = p.age === 'old', f = p.sex === 'f';
    const hw = kid ? 100 : 94, hh = kid ? 100 : 106;
    const cx = 256, cy = kid ? 270 : 228;
    const neckY = cy + hh * 0.86, shY = neckY + (kid ? 26 : 32);
    const sw = kid ? 112 : f ? 128 : old ? 138 : 146; // 어깨 반폭
    return { kid, old, f, hw, hh, cx, cy, sw, neckY, shY, nw: hw * (f ? 0.27 : 0.32) };
  }

  // ---------- 몸·옷 ----------
  function torso(g, d, puff) {
    const { cx, sw, shY, neckY, nw } = d, e = puff || 0;
    return () => { g.beginPath(); g.moveTo(cx - nw - 8 - e, neckY);
      g.bezierCurveTo(cx - nw - 34 - e, shY - 4, cx - sw + 18, shY - 6, cx - sw - e * 0.6, shY + 34);
      g.bezierCurveTo(cx - sw - 8 - e, shY + 110, cx - sw + 14 - e, H - 60, cx - sw + 18 - e, H + 10);
      g.lineTo(cx + sw - 18 + e, H + 10);
      g.bezierCurveTo(cx + sw - 14 + e, H - 60, cx + sw + 8 + e, shY + 110, cx + sw + e * 0.6, shY + 34);
      g.bezierCurveTo(cx + sw - 18, shY - 6, cx + nw + 34 + e, shY - 4, cx + nw + 8 + e, neckY); g.closePath(); };
  }
  function body(g, p, d) {
    const t = p.top, { cx, sw, shY, neckY, nw } = d, box = [cx - sw - 30, neckY - 10, sw * 2 + 60, H - neckY + 20];
    const puff = t.type === 'padding' ? 14 : t.type === 'hood' ? 8 : 0;
    part(g, torso(g, d, puff), t.col, { box, sx: sw * 0.4, sy: 0, rim: 0.7 });
    // 팔 접힘 선(소매와 몸 사이)
    [-1, 1].forEach((s) => { stroke(g, 3.5, rgb(hex(ink(t.col)), 0.7), () => { g.moveTo(cx + s * (sw - 40), shY + 30); g.quadraticCurveTo(cx + s * (sw - 52), H - 150, cx + s * (sw - 46), H + 4); }); stroke(g, 2.5, rgb(hex(ink(t.col)), 0.4), () => { g.moveTo(cx + s * (sw - 46), shY + 6); g.quadraticCurveTo(cx + s * (sw - 20), shY + 4, cx + s * (sw - 4), shY + 34); }); });
    if (t.type === 'padding') {
      for (let y = shY + 46; y < H; y += 48) stroke(g, 3, rgb(hex(ink(t.col)), 0.55), () => { g.moveTo(cx - sw - 12, y + 8); g.quadraticCurveTo(cx, y + 20, cx + sw + 12, y + 8); });
      part(g, () => { g.beginPath(); g.moveTo(cx - nw - 22, neckY - 16); g.quadraticCurveTo(cx, neckY - 24, cx + nw + 22, neckY - 16); g.lineTo(cx + nw + 30, neckY + 24); g.quadraticCurveTo(cx, neckY + 40, cx - nw - 30, neckY + 24); g.closePath(); }, t.col, { box: [cx - 80, neckY - 26, 160, 70], sx: 26, sy: 4 });
      stroke(g, 4, ink(t.col), () => { g.moveTo(cx, neckY + 34); g.lineTo(cx, H); });
      fill(g, '#d9dde2', () => g.rect(cx - 5, neckY + 40, 10, 18));
    } else if (t.type === 'hood') {
      part(g, () => { g.beginPath(); g.ellipse(cx, neckY + 10, nw + 52, 30, 0, 0, 7); }, t.col, { box: [cx - 110, neckY - 22, 220, 64], sx: 22, sy: 6 });
      fill(g, shd(t.col), () => g.ellipse(cx, neckY + 6, nw + 14, 14, 0, 0, 7));
      stroke(g, 4, '#f6f2ea', () => { g.moveTo(cx - 18, neckY + 30); g.lineTo(cx - 22, neckY + 112); g.moveTo(cx + 18, neckY + 30); g.lineTo(cx + 20, neckY + 106); });
      fill(g, '#f6f2ea', () => { g.arc(cx - 22, neckY + 114, 5, 0, 7); g.moveTo(cx + 25, neckY + 108); g.arc(cx + 20, neckY + 108, 5, 0, 7); });
      part(g, () => { g.beginPath(); g.roundRect ? g.roundRect(cx - 72, H - 112, 144, 86, 16) : g.rect(cx - 72, H - 112, 144, 86); }, t.col, { box: [cx - 80, H - 120, 160, 100], sx: 10, sy: 6, lw: 3 });
    } else if (t.type === 'suit' || t.type === 'school') {
      part(g, () => { g.beginPath(); g.moveTo(cx - nw - 4, neckY - 4); g.lineTo(cx + nw + 4, neckY - 4); g.lineTo(cx + 46, H); g.lineTo(cx - 46, H); g.closePath(); }, '#f4f2ec', { box: [cx - 60, neckY - 6, 120, H - neckY], sx: 18, sy: 0, lw: 3 });
      if (t.tie) part(g, () => { g.beginPath(); g.moveTo(cx - 11, neckY + 10); g.lineTo(cx + 11, neckY + 10); g.lineTo(cx + 7, neckY + 30); g.lineTo(cx + 20, H - 50); g.lineTo(cx, H - 26); g.lineTo(cx - 20, H - 50); g.lineTo(cx - 7, neckY + 30); g.closePath(); }, t.tie, { box: [cx - 26, neckY + 6, 52, H - neckY], sx: 10, sy: 0, lw: 3 });
      if (t.ribbon) part(g, () => { g.beginPath(); g.moveTo(cx, neckY + 24); g.lineTo(cx - 40, neckY + 6); g.quadraticCurveTo(cx - 46, neckY + 26, cx - 38, neckY + 46); g.closePath(); g.moveTo(cx, neckY + 24); g.lineTo(cx + 40, neckY + 6); g.quadraticCurveTo(cx + 46, neckY + 26, cx + 38, neckY + 46); g.closePath(); }, t.ribbon, { box: [cx - 48, neckY, 96, 50], sx: 8, sy: 3, lw: 3 });
      [-1, 1].forEach((s) => part(g, () => { g.beginPath(); g.moveTo(cx + s * (nw + 4), neckY - 4); g.lineTo(cx + s * 28, H - 70); g.lineTo(cx + s * 66, neckY + 116); g.lineTo(cx + s * (nw + 40), neckY + 44); g.closePath(); }, t.col, { box: [cx - 110, neckY, 220, H - neckY], sx: s > 0 ? 30 : -6, sy: 0, lw: 3, rim: 0 }));
      if (t.type === 'school') { fill(g, '#f2c53a', () => g.arc(cx - sw * 0.55, shY + 112, 13, 0, 7)); stroke(g, 2.5, ink(t.col), () => g.arc(cx - sw * 0.55, shY + 112, 13, 0, 7)); }
    } else if (t.type === 'cardigan') {
      part(g, () => { g.beginPath(); g.moveTo(cx - nw - 2, neckY); g.quadraticCurveTo(cx, neckY + 44, cx + nw + 2, neckY); g.lineTo(cx + 32, H); g.lineTo(cx - 32, H); g.closePath(); }, t.col2 || '#efe4cc', { box: [cx - 60, neckY, 120, H - neckY], sx: 14, sy: 0, lw: 3 });
      for (let y = neckY + 70; y < H; y += 56) { fill(g, ink(t.col), () => g.arc(cx + 42, y, 7, 0, 7)); fill(g, 'rgba(255,255,255,.35)', () => g.arc(cx + 40, y - 2, 2.5, 0, 7)); }
      g.save(); torso(g, d)(); g.clip(); for (let x = cx - sw; x < cx + sw; x += 15) stroke(g, 2, 'rgba(0,0,0,.13)', () => { g.moveTo(x, shY); g.lineTo(x, H); }); g.restore();
      // 꽃무늬 조끼 느낌: 작은 꽃
      g.save(); torso(g, d)(); g.clip(); for (let i = 0; i < 14; i++) { const x = cx - sw + 20 + ((i * 71) % (sw * 2 - 40)), y = shY + 50 + ((i * 53) % (H - shY - 60)); if (Math.abs(x - cx) < 50) continue; for (let k = 0; k < 5; k++) fill(g, 'rgba(255,190,210,.7)', () => g.arc(x + Math.cos(k * 1.26) * 6, y + Math.sin(k * 1.26) * 6, 4, 0, 7)); fill(g, '#f2c53a', () => g.arc(x, y, 3, 0, 7)); } g.restore();
    } else if (t.type === 'coat') {
      part(g, () => { g.beginPath(); g.moveTo(cx - nw - 4, neckY - 8); g.lineTo(cx + nw + 4, neckY - 8); g.lineTo(cx + nw + 10, neckY + 26); g.lineTo(cx - nw - 10, neckY + 26); g.closePath(); }, t.col2 || '#d8cfc0', { box: [cx - 70, neckY - 12, 140, 44], sx: 12, sy: 2, lw: 3 });
      [-1, 1].forEach((s) => part(g, () => { g.beginPath(); g.moveTo(cx + s * (nw + 10), neckY + 6); g.lineTo(cx + s * 8, H - 30); g.lineTo(cx + s * 74, neckY + 108); g.lineTo(cx + s * (nw + 48), neckY + 26); g.closePath(); }, t.col, { box: [cx - 110, neckY, 220, H - neckY], sx: s > 0 ? 30 : -6, sy: 0, lw: 3, rim: 0 }));
    }
    if (p.scarf) {
      part(g, () => { g.beginPath(); g.ellipse(cx, neckY + 6, nw + 36, 26, 0, 0, 7); }, p.scarf, { box: [cx - 90, neckY - 22, 180, 56], sx: 24, sy: 4 });
      part(g, () => { g.beginPath(); g.moveTo(cx + 18, neckY + 14); g.lineTo(cx + 54, neckY + 16); g.lineTo(cx + 48, neckY + 150); g.lineTo(cx + 14, neckY + 146); g.closePath(); }, p.scarf, { box: [cx + 10, neckY + 10, 50, 145], sx: 12, sy: 0, lw: 3 });
      for (let i = 0; i < 4; i++) stroke(g, 4, shd(p.scarf), () => { g.moveTo(cx + 18, neckY + 92 + i * 14); g.lineTo(cx + 50, neckY + 92 + i * 14); });
    }
  }

  // ---------- 머리카락 ----------
  function hairBack(g, p, d) {
    const { cx, cy, hw, hh } = d, s = p.hair.style, c = p.hair.col, box = [cx - hw - 50, cy - hh - 20, hw * 2 + 100, hh * 3];
    if (s === 'long') part(g, () => { g.beginPath(); g.moveTo(cx - hw - 4, cy - hh * 0.4); g.bezierCurveTo(cx - hw - 40, cy + hh * 0.6, cx - hw - 34, cy + hh * 1.5, cx - hw + 4, cy + hh * 1.95); g.quadraticCurveTo(cx, cy + hh * 2.05, cx + hw - 4, cy + hh * 1.95); g.bezierCurveTo(cx + hw + 34, cy + hh * 1.5, cx + hw + 40, cy + hh * 0.6, cx + hw + 4, cy - hh * 0.4); g.closePath(); }, c, { box, sx: 30, sy: 0 });
    if (s === 'bob') part(g, () => { g.beginPath(); g.moveTo(cx - hw - 6, cy - hh * 0.4); g.bezierCurveTo(cx - hw - 30, cy + hh * 0.4, cx - hw - 20, cy + hh * 0.95, cx - hw + 14, cy + hh * 1.02); g.lineTo(cx + hw - 14, cy + hh * 1.02); g.bezierCurveTo(cx + hw + 20, cy + hh * 0.95, cx + hw + 30, cy + hh * 0.4, cx + hw + 6, cy - hh * 0.4); g.closePath(); }, c, { box, sx: 26, sy: 0 });
    if (s === 'pony') {
      part(g, () => { g.beginPath(); g.moveTo(cx + hw * 0.55, cy - hh * 0.75); g.bezierCurveTo(cx + hw * 1.75, cy - hh * 0.7, cx + hw * 1.6, cy + hh * 0.7, cx + hw * 1.2, cy + hh * 1.35); g.bezierCurveTo(cx + hw * 1.15, cy + hh * 0.6, cx + hw * 0.95, cy - hh * 0.15, cx + hw * 0.45, cy - hh * 0.4); g.closePath(); }, c, { box: [cx, cy - hh, hw * 2, hh * 2.6], sx: 16, sy: 0 });
    }
  }
  function hairFront(g, p, d) {
    const { cx, cy, hw, hh } = d, s = p.hair.style, c = p.hair.col;
    const box = [cx - hw - 40, cy - hh * 1.25, hw * 2 + 80, hh * 1.9];
    const band = (r0, a0, a1) => (c2) => { c2.lineWidth = ST === 'cel' ? 10 : 16; c2.beginPath(); c2.arc(cx - 8, cy + 6, r0, a0, a1); c2.stroke(); };
    const strands = (n, x0, x1, y0, y1, bend, path) => { g.save(); path(); g.clip(); for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; stroke(g, 2.5, rgb(hex(ink(c)), 0.55), () => { g.moveTo(x, y0); g.quadraticCurveTo(x + bend, (y0 + y1) / 2, x + bend * 1.3, y1); }); } g.restore(); };
    let path;
    if (s === 'short' || s === 'side') {
      const side = s === 'side';
      path = () => { g.beginPath(); g.moveTo(cx - hw - 6, cy + hh * 0.12);
        g.bezierCurveTo(cx - hw - 26, cy - hh * 1.46, cx + hw + 26, cy - hh * 1.46, cx + hw + 6, cy + hh * 0.12);
        g.lineTo(cx + hw - 8, cy - hh * 0.18);
        if (side) { g.quadraticCurveTo(cx + hw * 0.3, cy - hh * 0.36, cx - hw * 0.2, cy - hh * 0.62); g.quadraticCurveTo(cx - hw * 0.55, cy - hh * 0.35, cx - hw + 4, cy - hh * 0.1); }
        else { [0.7, 0.35, 0, -0.35, -0.7].forEach((f, i) => { g.lineTo(cx + hw * (f + 0.17), cy - hh * 0.55); g.lineTo(cx + hw * f, cy - hh * (0.32 + (i % 2) * 0.06)); }); g.lineTo(cx - hw + 4, cy - hh * 0.12); }
        g.closePath(); };
      part(g, path, c, { box, sx: 22, sy: 12, hi: band(hh * 0.92, Math.PI * 1.15, Math.PI * 1.55) });
      strands(7, cx - hw * 0.8, cx + hw * 0.7, cy - hh * 1.0, cy - hh * 0.45, side ? -14 : 4, path);
    } else if (s === 'buzz') {
      path = () => { g.beginPath(); g.moveTo(cx - hw - 3, cy - hh * 0.0); g.bezierCurveTo(cx - hw - 8, cy - hh * 1.24, cx + hw + 8, cy - hh * 1.24, cx + hw + 3, cy - hh * 0.0); g.quadraticCurveTo(cx + hw * 0.55, cy - hh * 0.52, cx, cy - hh * 0.5); g.quadraticCurveTo(cx - hw * 0.55, cy - hh * 0.52, cx - hw - 3, cy - hh * 0.0); g.closePath(); };
      part(g, path, c, { box, sx: 16, sy: 8, lw: 4, hi: band(hh * 0.86, Math.PI * 1.15, Math.PI * 1.5) });
      g.save(); path(); g.clip(); for (let i = 0; i < 260; i++) fill(g, rgb(hex(ink(c)), 0.5), () => g.rect(cx - hw + rnd() * hw * 2, cy - hh * 1.1 + rnd() * hh, 2, 2)); g.restore();
    } else if (s === 'bob' || s === 'long') {
      const low = s === 'bob' ? 0.7 : 0.95;
      path = () => { g.beginPath(); g.moveTo(cx - hw - 10, cy + hh * low);
        g.bezierCurveTo(cx - hw - 24, cy - hh * 1.5, cx + hw + 24, cy - hh * 1.5, cx + hw + 10, cy + hh * low);
        g.quadraticCurveTo(cx + hw * 0.86, cy + hh * (low + 0.06), cx + hw * 0.74, cy + hh * (low - 0.08)); g.quadraticCurveTo(cx + hw * 0.8, cy + hh * 0.1, cx + hw * 0.62, cy - hh * 0.3);
        // 일자 앞머리(끝이 조금씩 갈라짐)
        [0.4, 0.15, -0.1, -0.35, -0.6].forEach((f, i) => { g.lineTo(cx + hw * f, cy - hh * (0.24 + (i % 2) * 0.05)); g.lineTo(cx + hw * (f - 0.1), cy - hh * 0.3); });
        g.quadraticCurveTo(cx - hw * 0.8, cy + hh * 0.1, cx - hw * 0.74, cy + hh * (low - 0.08)); g.quadraticCurveTo(cx - hw * 0.86, cy + hh * (low + 0.06), cx - hw - 10, cy + hh * low); g.closePath(); };
      part(g, path, c, { box, sx: 22, sy: 12, hi: band(hh * 0.94, Math.PI * 1.12, Math.PI * 1.55) });
      strands(9, cx - hw * 0.85, cx + hw * 0.75, cy - hh * 1.0, cy - hh * 0.3, -6, path);
    } else if (s === 'pony') {
      path = () => { g.beginPath(); g.moveTo(cx - hw - 6, cy + hh * 0.14); g.bezierCurveTo(cx - hw - 26, cy - hh * 1.46, cx + hw + 26, cy - hh * 1.46, cx + hw + 6, cy + hh * 0.14);
        g.lineTo(cx + hw - 6, cy - hh * 0.18); g.quadraticCurveTo(cx + hw * 0.4, cy - hh * 0.48, cx - hw * 0.05, cy - hh * 0.42); g.quadraticCurveTo(cx - hw * 0.25, cy - hh * 0.2, cx - hw * 0.5, cy - hh * 0.28); g.quadraticCurveTo(cx - hw * 0.8, cy - hh * 0.12, cx - hw + 4, cy + hh * 0.1); g.closePath(); };
      part(g, path, c, { box, sx: 22, sy: 12, hi: band(hh * 0.92, Math.PI * 1.15, Math.PI * 1.55) });
      strands(8, cx - hw * 0.8, cx + hw * 0.8, cy - hh * 1.0, cy - hh * 0.42, 10, path);
      part(g, () => { g.beginPath(); g.ellipse(cx + hw * 0.66, cy - hh * 0.7, 16, 11, 0.5, 0, 7); }, '#e0453a', { box: [cx + hw * 0.4, cy - hh * 0.9, 50, 40], sx: 6, sy: 3, lw: 3 });
    } else if (s === 'perm') {
      // 뽀글 파마: 동그라미를 겹친 구름, 바깥 선은 동그라미를 한 번 굵게 그린 뒤 덮어서
      const bumps = [];
      for (let i = 0; i < 22; i++) { const a = Math.PI * (0.96 + (i / 21) * 1.08); bumps.push([cx + Math.cos(a) * (hw + 14), cy - hh * 0.05 + Math.sin(a) * (hh + 10), 26 + (i % 3) * 5]); }
      for (let i = 0; i < 9; i++) bumps.push([cx - hw * 0.72 + i * hw * 0.18, cy - hh * 0.58 + (i % 2) * 12, 22]);
      for (let i = 0; i < 6; i++) bumps.push([cx - hw * 0.5 + i * hw * 0.2, cy - hh * 0.95, 30]);
      if (ST === 'cel') bumps.forEach(([x, y, r]) => fill(g, ink(c), () => g.arc(x, y, r + 4.5, 0, 7)));
      const pth = () => { g.beginPath(); bumps.forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, 7); }); };
      part(g, pth, c, { box: [cx - hw - 50, cy - hh * 1.4, hw * 2 + 100, hh * 1.5], sx: 18, sy: 12, line: false, hi: band(hh * 0.98, Math.PI * 1.15, Math.PI * 1.5) });
      bumps.forEach(([x, y, r], i) => { stroke(g, 2.5, rgb(hex(ink(c)), 0.45), () => g.arc(x + 2, y + 2, r * 0.62, Math.PI * 0.1, Math.PI * 1.2)); if (i % 2) stroke(g, 3, light(c, 0.45), () => g.arc(x - 4, y - 4, r * 0.45, Math.PI * 1.1, Math.PI * 1.6)); });
    } else if (s === 'bald') {
      [-1, 1].forEach((k) => part(g, () => { g.beginPath(); g.moveTo(cx + k * (hw + 6), cy - hh * 0.5); g.quadraticCurveTo(cx + k * (hw + 16), cy, cx + k * (hw - 2), cy + hh * 0.26); g.lineTo(cx + k * (hw - 14), cy - hh * 0.32); g.closePath(); }, c, { box: [cx + (k < 0 ? -hw - 20 : hw - 20), cy - hh * 0.6, 40, hh], sx: 6, sy: 4, lw: 3 }));
      fill(g, 'rgba(255,252,240,.55)', () => g.ellipse(cx - hw * 0.35, cy - hh * 0.8, hw * 0.28, 11, -0.25, 0, 7));
    }
  }

  // ---------- 얼굴 ----------
  function face(g, p, d, mood) {
    const { cx, cy, hw, hh, kid, old } = d;
    const INK = ST === 'cel' ? '#2a1610' : '#3a2218';
    const ey = cy + hh * 0.2, ex = hw * 0.4, ew = hw * 0.19, eh = ew * (old ? 0.55 : 1.0);
    // 볼 발그레
    g.save(); g.filter = 'blur(6px)'; g.fillStyle = 'rgba(240,110,100,' + (kid ? 0.42 : mood === 'angry' ? 0.45 : 0.28) + ')';
    [-1, 1].forEach((k) => { g.beginPath(); g.ellipse(cx + k * hw * 0.58, ey + eh * 1.9, hw * 0.17, hh * 0.08, 0, 0, 7); g.fill(); }); g.restore();
    // 눈
    [-1, 1].forEach((k) => {
      const x = cx + k * ex;
      if (mood === 'happy' || mood === 'blink' || (old && mood !== 'angry' && mood !== 'wait')) {
        stroke(g, 5.5, INK, () => { if (mood === 'blink') { g.moveTo(x - ew, ey); g.quadraticCurveTo(x, ey + eh * 0.5, x + ew, ey); } else { g.moveTo(x - ew, ey + 3); g.quadraticCurveTo(x, ey - eh * 1.3, x + ew, ey + 3); } });
        return;
      }
      const sq = mood === 'angry' ? 0.6 : mood === 'wait' ? 0.75 : 1;
      g.save(); g.beginPath(); g.ellipse(x, ey, ew, eh * sq, 0, 0, 7); g.fillStyle = '#fbf6ee'; g.fill(); g.clip();
      const ir = eh * 0.82;
      const ig = g.createLinearGradient(0, ey - ir, 0, ey + ir); ig.addColorStop(0, '#1e120c'); ig.addColorStop(1, p.eye || '#6a3e22');
      fill(g, ig, () => g.arc(x + k * 1.5, ey + 1, ir, 0, 7));
      fill(g, '#0c0604', () => g.arc(x + k * 1.5, ey + 1, ir * 0.45, 0, 7));
      fill(g, '#ffffff', () => g.arc(x - ir * 0.35, ey - ir * 0.4, ir * 0.32, 0, 7));
      fill(g, 'rgba(255,255,255,.75)', () => g.arc(x + ir * 0.38, ey + ir * 0.42, ir * 0.14, 0, 7));
      g.restore();
      // 윗눈꺼풀 굵은 선
      stroke(g, ST === 'cel' ? 5.5 : 4.5, INK, () => { g.moveTo(x - ew - 3, ey - eh * sq * 0.1); g.quadraticCurveTo(x, ey - eh * sq * 1.35, x + ew + 3, ey - eh * sq * 0.15); });
      if (p.sex === 'f') stroke(g, 4, INK, () => { g.moveTo(x + k * (ew + 1), ey - eh * sq * 0.2); g.lineTo(x + k * (ew + 10), ey - eh * sq * 0.6); });
    });
    // 눈썹
    const bc = p.hair.style === 'bald' || p.hair.col === '#cfcac2' ? '#7a7268' : ink(p.hair.col);
    const by = ey - eh * 1.75;
    [-1, 1].forEach((k) => stroke(g, kid ? 6 : 7, bc, () => {
      const x = cx + k * ex;
      if (mood === 'angry') { g.moveTo(x + k * ew * 1.0, by - 9); g.lineTo(x - k * ew * 0.8, by + 7); }
      else if (mood === 'wait') { g.moveTo(x + k * ew * 1.0, by + 4); g.quadraticCurveTo(x, by - 6, x - k * ew * 0.8, by - 8); }
      else { g.moveTo(x + k * ew * 1.0, by + 2); g.quadraticCurveTo(x, by - 8, x - k * ew * 0.8, by); }
    }));
    // 코
    const ny = ey + eh * 1.55;
    stroke(g, 3, 'rgba(140,60,40,.6)', () => { g.moveTo(cx - 6, ny + 2); g.quadraticCurveTo(cx + 2, ny + 7, cx + 8, ny); });
    fill(g, 'rgba(255,255,255,.35)', () => g.ellipse(cx - 3, ny - 8, 3, 5, 0, 0, 7));
    // 입
    const my = ny + hh * 0.2;
    if (mood === 'happy') {
      g.save(); g.beginPath(); g.moveTo(cx - hw * 0.26, my - 3); g.quadraticCurveTo(cx, my + 2, cx + hw * 0.26, my - 3); g.quadraticCurveTo(cx, my + hh * 0.26, cx - hw * 0.26, my - 3); g.closePath();
      g.fillStyle = '#6a1e18'; g.fill(); g.clip(); fill(g, '#ef6f6a', () => g.ellipse(cx, my + hh * 0.2, hw * 0.16, hh * 0.08, 0, 0, 7)); g.restore();
      stroke(g, 4, INK, () => { g.moveTo(cx - hw * 0.28, my - 4); g.quadraticCurveTo(cx, my + hh * 0.28, cx + hw * 0.28, my - 4); g.moveTo(cx - hw * 0.28, my - 4); g.quadraticCurveTo(cx, my + 2, cx + hw * 0.28, my - 4); });
    } else if (mood === 'angry') {
      stroke(g, 5, INK, () => { g.moveTo(cx - hw * 0.2, my + 8); g.quadraticCurveTo(cx, my - 6, cx + hw * 0.2, my + 8); });
      // 화난 핏줄 표시(이마 오른쪽)
      stroke(g, 5, '#e2412a', () => { const x = cx + hw * 0.55, y = cy - hh * 0.38; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { g.moveTo(x + a * 4, y + b * 4); g.quadraticCurveTo(x + a * 6, y + b * 6, x + a * 14, y + b * 3); }); });
    } else if (mood === 'wait') {
      stroke(g, 4, INK, () => { g.moveTo(cx - hw * 0.14, my + 3); g.quadraticCurveTo(cx - hw * 0.05, my - 3, cx + hw * 0.04, my + 2); g.quadraticCurveTo(cx + hw * 0.1, my + 6, cx + hw * 0.16, my); });
      fill(g, 'rgba(120,190,255,.85)', () => { const x = cx - hw * 0.72, y = cy - hh * 0.3; g.moveTo(x, y - 14); g.quadraticCurveTo(x + 9, y, x, y + 6); g.quadraticCurveTo(x - 9, y, x, y - 14); }); // 식은땀
    } else {
      stroke(g, 4, INK, () => { g.moveTo(cx - hw * 0.15, my); g.quadraticCurveTo(cx, my + 8, cx + hw * 0.15, my); });
    }
    if (old) { [-1, 1].forEach((k) => stroke(g, 2.5, 'rgba(130,60,40,.45)', () => { g.moveTo(cx + k * hw * 0.24, ny + 2); g.quadraticCurveTo(cx + k * hw * 0.34, my, cx + k * hw * 0.28, my + 14); })); stroke(g, 2, 'rgba(130,60,40,.35)', () => { g.moveTo(cx - hw * 0.28, cy - hh * 0.42); g.quadraticCurveTo(cx, cy - hh * 0.48, cx + hw * 0.28, cy - hh * 0.42); }); }
    if (p.beard) { g.save(); g.fillStyle = 'rgba(60,40,30,.35)'; for (let i = 0; i < 260; i++) { const a = rnd() * Math.PI, r = 0.55 + rnd() * 0.45; g.fillRect(cx + Math.cos(a) * hw * 0.62 * r, my - 10 + Math.sin(a) * hh * 0.34 * r, 2.4, 2.4); } g.restore(); }
    if (p.glasses) {
      [-1, 1].forEach((k) => { const x = cx + k * ex; stroke(g, 5, p.glasses, () => { g.roundRect ? g.roundRect(x - ew - 10, ey - eh * 1.25, ew * 2 + 20, eh * 2.5, 12) : g.rect(x - ew - 10, ey - eh * 1.25, ew * 2 + 20, eh * 2.5); }); fill(g, 'rgba(255,255,255,.25)', () => { g.moveTo(x - ew - 4, ey - eh); g.lineTo(x - ew + 10, ey - eh); g.lineTo(x - ew - 2, ey + eh); g.lineTo(x - ew - 8, ey + eh); g.closePath(); }); });
      stroke(g, 5, p.glasses, () => { g.moveTo(cx - ex + ew + 10, ey - eh * 0.4); g.quadraticCurveTo(cx, ey - eh * 0.9, cx + ex - ew - 10, ey - eh * 0.4); });
    }
  }

  // ---------- 한 장 ----------
  // layer: 'back'(뒷머리) · 'body'(몸·목) · 'head'(귀·얼굴·앞머리) — 머리를 따로 움직이려고 세 장으로 나눠 굽는다(10/24 "너무 종이인형"). 없으면 한 장에 다
  F.draw = function (p, mood, style, cv, layer) {
    ST = style || F.style || 'cel'; seed = p.seed || 3;
    const c = cv || document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    const d = dims(p), { cx, cy, hw, hh, nw, neckY } = d;
    const L = (k) => !layer || layer === k;
    if (L('back')) hairBack(g, p, d);
    if (L('body')) {
    body(g, p, d);
    // 목 + 턱 그늘
    part(g, () => { g.beginPath(); g.moveTo(cx - nw, cy + hh * 0.5); g.lineTo(cx - nw - 2, neckY + 10); g.quadraticCurveTo(cx, neckY + 24, cx + nw + 2, neckY + 10); g.lineTo(cx + nw, cy + hh * 0.5); g.closePath(); }, p.skin, { box: [cx - nw - 10, cy + hh * 0.4, nw * 2 + 20, neckY - cy], sx: nw * 0.6, sy: 0, lw: 4, rim: 0.3 });
    fill(g, 'rgba(110,50,30,.32)', () => g.ellipse(cx + 4, cy + hh * 0.97, nw * 1.25, 13, 0, 0, Math.PI));
    }
    if (!L('head')) return c;
    // 귀
    [-1, 1].forEach((k) => { part(g, () => { g.beginPath(); g.ellipse(cx + k * (hw - 2), cy + hh * 0.22, 15, 22, k * 0.25, 0, 7); }, p.skin, { box: [cx + k * (hw - 2) - 18, cy, 36, 50], sx: k > 0 ? 6 : 2, sy: 2, lw: 4, rim: k > 0 ? 0.6 : 0 }); stroke(g, 2.5, 'rgba(150,70,50,.5)', () => g.arc(cx + k * (hw - 2), cy + hh * 0.22, 8, k > 0 ? -1.2 : 1.9, k > 0 ? 1.2 : 4.3)); });
    // 얼굴: 위가 넓고 볼이 통통한 모양
    const head = () => { g.beginPath(); g.moveTo(cx - hw, cy - hh * 0.05);
      g.bezierCurveTo(cx - hw, cy - hh * 1.12, cx + hw, cy - hh * 1.12, cx + hw, cy - hh * 0.05);
      g.bezierCurveTo(cx + hw * 1.02, cy + hh * 0.5, cx + hw * 0.62, cy + hh * 0.92, cx, cy + hh * 0.96);
      g.bezierCurveTo(cx - hw * 0.62, cy + hh * 0.92, cx - hw * 1.02, cy + hh * 0.5, cx - hw, cy - hh * 0.05); g.closePath(); };
    part(g, head, p.skin, { box: [cx - hw - 4, cy - hh * 1.1, hw * 2 + 8, hh * 2.1], sx: hw * 0.3, sy: hh * 0.08, brush: 24, hi: (c2) => { c2.beginPath(); c2.ellipse(cx - hw * 0.45, cy - hh * 0.1, hw * 0.22, hh * 0.3, -0.3, 0, 7); c2.fill(); } });
    face(g, p, d, mood || 'idle');
    hairFront(g, p, d);
    if (ST === 'paint') { g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '255,245,230' : '40,25,15') + ',' + rnd() * 0.06 + ')'; g.fillRect(rnd() * W, rnd() * H, 2, 2); } g.restore(); }
    return c;
  };

  // ---------- 손님 명단 ----------
  const SK = ['#f3cfae', '#eebf98', '#e2ad86', '#f6d8bd'];
  F.PEOPLE = [
    { id: 'halmae', age: 'old', sex: 'f', skin: SK[1], hair: { style: 'perm', col: '#a29a90' }, top: { type: 'cardigan', col: '#8a4a8a', col2: '#efe4cc' }, seed: 11 },
    { id: 'student', age: 'teen', sex: 'f', skin: SK[3], hair: { style: 'pony', col: '#3a2a22' }, top: { type: 'school', col: '#2a3870', ribbon: '#d23a3a' }, seed: 12 },
    { id: 'salary', age: 'adult', sex: 'm', skin: SK[0], hair: { style: 'side', col: '#2e241e' }, glasses: '#2a2a2a', top: { type: 'suit', col: '#3c4258', tie: '#2f6fb8' }, seed: 13 },
    { id: 'ajae', age: 'adult', sex: 'm', skin: SK[2], hair: { style: 'short', col: '#3a2c22' }, beard: true, top: { type: 'padding', col: '#3a7a4c' }, seed: 14 },
    { id: 'boy', age: 'kid', sex: 'm', skin: SK[3], hair: { style: 'buzz', col: '#3a2a20' }, top: { type: 'hood', col: '#f0a82a' }, seed: 15 },
    { id: 'harabe', age: 'old', sex: 'm', skin: SK[2], hair: { style: 'bald', col: '#cfcac2' }, glasses: '#8a6a3a', top: { type: 'coat', col: '#6a5640', col2: '#c9c0b0' }, scarf: '#c8323a', seed: 16 },
    { id: 'unnie', age: 'adult', sex: 'f', skin: SK[0], hair: { style: 'long', col: '#6a3c26' }, top: { type: 'coat', col: '#d2aa7e', col2: '#f2efe8' }, scarf: '#ede2d0', seed: 17 },
    { id: 'girl', age: 'kid', sex: 'f', skin: SK[3], hair: { style: 'bob', col: '#3a2a22' }, top: { type: 'padding', col: '#ef7090' }, seed: 18 },
  ];
})();
