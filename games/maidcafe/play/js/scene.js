/* 모에모에 메이드카페 — 가게 배경(벽·바닥·카운터·창·문·장식)과 탁자. 1280×720 */
(function () {
  'use strict';
  const W = 1280, H = 720, WALL = 300, RAIL = 340;
  const { ell, rr, lin, rad, heart, star, adj } = ART;

  function lamp(ctx, x, y) { // 천장 펜던트 등 + 빛 원뿔
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, x, y + 60, 10, 260, [[0, 'rgba(255,235,190,.22)'], [1, 'rgba(255,235,190,0)']]); ctx.beginPath(); ctx.moveTo(x - 30, y + 20); ctx.lineTo(x - 260, WALL + 80); ctx.lineTo(x + 260, WALL + 80); ctx.lineTo(x + 30, y + 20); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#6a5a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 34, y + 14); ctx.lineTo(x - 12, y - 18); ctx.lineTo(x + 12, y - 18); ctx.lineTo(x + 34, y + 14); ctx.closePath(); ctx.fillStyle = lin(ctx, x - 34, 0, x + 34, 0, [[0, '#f7c8d4'], [.5, '#ffe6ec'], [1, '#e8a8b8']]); ctx.fill(); ctx.strokeStyle = '#b8788a'; ctx.lineWidth = 1.5; ctx.stroke();
    ell(ctx, x, y + 14, 34, 6); ctx.fillStyle = '#ffe8c0'; ctx.fill(); ctx.strokeStyle = '#b8788a'; ctx.stroke();
    ctx.save(); ctx.shadowColor = '#fff0c0'; ctx.shadowBlur = 18; ell(ctx, x, y + 12, 10, 4); ctx.fillStyle = '#fff8e0'; ctx.fill(); ctx.restore();
  }
  function frame(ctx, x, y, w, h, maid) { // 벽 액자 (메이드 초상)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; rr(ctx, x, y, w, h, 4); ctx.fillStyle = '#f9e9b8'; ctx.fill(); ctx.restore();
    rr(ctx, x, y, w, h, 4); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 3; ctx.stroke(); rr(ctx, x + 3, y + 3, w - 6, h - 6, 3); ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12, h - 12); ctx.clip(); ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#ffe0ea'], [1, '#ffc0d4']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { star(ctx, x + 10 + (i * 37) % (w - 20), y + 12 + (i * 53) % (h - 24), 3, 1.2, 4); ctx.fill(); }
    ctx.translate(x + 6, y + 8); SPR.portrait(ctx, maid, w - 12, h - 16, { t: 0, dir: 0, face: { eyes: 'wink', mouth: 'open', blush: .7 } }); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + w * .5, y + 6); ctx.lineTo(x + 6, y + h * .5); ctx.closePath(); ctx.fill();
  }
  function chalkboard(ctx, x, y, w, h, EN) {
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = '#7a5a3a'; ctx.fill(); rr(ctx, x + 6, y + 6, w - 12, h - 12, 3); ctx.fillStyle = '#2e4a3e'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 12; i++) ctx.fillRect(x + 8 + i * (w - 16) / 12, y + 8, 3, h - 16);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff2d8'; ctx.font = "bold 22px 'Ria', sans-serif"; ctx.fillText('MENU', x + w / 2, y + 36);
    ctx.strokeStyle = '#ffd0e0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 30, y + 44); ctx.lineTo(x + w - 30, y + 44); ctx.stroke();
    ctx.font = "15px 'Griun', sans-serif"; ctx.textAlign = 'left';
    const items = EN ? [['omu', 'Omurice'], ['parfait', 'Parfait'], ['cake', 'Cake'], ['coffee', 'Coffee']] : [['omu', '오므라이스'], ['parfait', '파르페'], ['cake', '케이크'], ['coffee', '커피']];
    items.forEach((it, i) => { const yy = y + 62 + i * 23; ART.drawFood(ctx, x + 32, yy + 2, it[0], 1.3); ctx.fillStyle = '#fff2d8'; ctx.fillText(it[1], x + 52, yy + 5); ctx.fillStyle = '#ffb8c8'; ctx.fillText('♥', x + w - 32, yy + 5); });
    ctx.fillStyle = '#ffd0e0'; ctx.font = "13px 'Griun', sans-serif"; ctx.textAlign = 'center'; ctx.fillText(EN ? 'moe moe kyun♡' : '모에모에큥♡', x + w / 2, y + h - 12);
  }
  function windowView(ctx, x, y, w, h, t) { // 창 밖 거리 (아키바 풍 건물·간판)
    ctx.save(); rr(ctx, x, y, w, h, 8); ctx.clip();
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#2a2a5e'], [.6, '#5a3a7a'], [1, '#c86a8a']]); ctx.fillRect(x, y, w, h);
    // 건물 실루엣
    const bs = [[0, 70, 46], [46, 40, 70], [86, 90, 40], [126, 60, 58], [184, 110, 30], [214, 50, 52]];
    bs.forEach((b, i) => { const bx = x + b[0], bh = b[1], bw = b[2]; ctx.fillStyle = i & 1 ? '#3a3050' : '#2c2640'; ctx.fillRect(bx, y + h - bh - 30, bw, bh + 30); for (let r = 0; r < bh / 14; r++) for (let c = 0; c < bw / 12; c++) { if (((r * 7 + c * 3 + i) % 5) < 3) { ctx.fillStyle = (r + c) & 1 ? '#ffe08a' : '#8ad8ff'; ctx.fillRect(bx + 4 + c * 12, y + h - bh - 26 + r * 14, 6, 8); } } });
    // 네온 간판
    ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = '#ff5aa0'; ctx.fillStyle = '#ff7ab8'; rr(ctx, x + 30, y + 40, 44, 16, 3); ctx.fill(); ctx.shadowColor = '#5ad8ff'; ctx.fillStyle = '#7ae8ff'; rr(ctx, x + 140, y + 30, 20, 60, 3); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2a1a3a'; ctx.font = "bold 11px sans-serif"; ctx.textAlign = 'center'; ctx.fillText('MOE', x + 52, y + 52);
    // 길·사람 점
    ctx.fillStyle = '#4a3a5a'; ctx.fillRect(x, y + h - 30, w, 30); ctx.fillStyle = '#6a5a7a'; ctx.fillRect(x, y + h - 30, w, 3);
    // 창 유리 반사
    ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * .45, y); ctx.lineTo(x, y + h * .6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 창틀
    rr(ctx, x, y, w, h, 8); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.stroke(); rr(ctx, x, y, w, h, 8); ctx.strokeStyle = '#d8b8c0'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h * .45); ctx.lineTo(x + w, y + h * .45); ctx.stroke();
    // 커튼
    [[x - 14, 1], [x + w + 14, -1]].forEach(c => { ctx.fillStyle = lin(ctx, c[0], 0, c[0] + c[1] * 40, 0, [[0, '#ffd6e2'], [1, '#f0a8bf']]); ctx.beginPath(); ctx.moveTo(c[0], y - 10); ctx.lineTo(c[0] + c[1] * 40, y - 10); ctx.quadraticCurveTo(c[0] + c[1] * 26, y + h * .5, c[0] + c[1] * 14, y + h + 6); ctx.lineTo(c[0], y + h + 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c8889a'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(c[0] + c[1] * i * 9, y - 6); ctx.quadraticCurveTo(c[0] + c[1] * i * 6, y + h * .5, c[0] + c[1] * i * 3, y + h); ctx.stroke(); } ctx.fillStyle = '#ffe08a'; ell(ctx, c[0] + c[1] * 18, y + h * .55, 8, 4); ctx.fill(); });
    ctx.fillStyle = '#e8c8d0'; rr(ctx, x - 20, y - 16, w + 40, 10, 4); ctx.fill();
  }
  function door(ctx, x, y, w, h, EN) {
    // 문틀
    rr(ctx, x - 10, y - 10, w + 20, h + 10, 6); ctx.fillStyle = '#d8b8c0'; ctx.fill();
    rr(ctx, x, y, w, h, 4); ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#f6f0f4'], [1, '#e2d4dc']]); ctx.fill(); ctx.strokeStyle = '#b898a8'; ctx.lineWidth = 2; ctx.stroke();
    // 유리창 (거리 보임)
    ctx.save(); rr(ctx, x + 14, y + 16, w - 28, h * .55, 4); ctx.clip(); ctx.fillStyle = lin(ctx, 0, y, 0, y + h * .7, [[0, '#3a3060'], [1, '#c86a8a']]); ctx.fillRect(x, y, w, h); ctx.fillStyle = '#2c2640'; ctx.fillRect(x + 14, y + 70, 30, 100); ctx.fillRect(x + 60, y + 50, 40, 120); ctx.fillStyle = '#ffe08a'; for (let i = 0; i < 8; i++) ctx.fillRect(x + 20 + (i % 2) * 12, y + 78 + Math.floor(i / 2) * 16, 6, 8); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x + 14, y + 16); ctx.lineTo(x + 60, y + 16); ctx.lineTo(x + 14, y + 90); ctx.fill(); ctx.restore();
    rr(ctx, x + 14, y + 16, w - 28, h * .55, 4); ctx.strokeStyle = '#b898a8'; ctx.lineWidth = 2; ctx.stroke();
    // 아래 패널·손잡이
    rr(ctx, x + 14, y + h * .55 + 30, w - 28, h * .45 - 44, 3); ctx.strokeStyle = '#c8b0bc'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#e8c060'; rr(ctx, x + w - 30, y + h * .58, 8, 26, 3); ctx.fill(); ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 1; ctx.stroke();
    // OPEN 팻말
    ctx.save(); ctx.translate(x + w / 2, y + 40); ctx.rotate(-.06); rr(ctx, -30, -12, 60, 26, 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e8305a'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#e8305a'; ctx.font = "bold 15px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.fillText('OPEN', 0, 6); ctx.strokeStyle = '#8a6a50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(0, -22); ctx.lineTo(8, -12); ctx.stroke(); ctx.restore();
    // 종
    ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = '#a8801a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 26, y + 4); ctx.quadraticCurveTo(x + 26, y - 10, x + 34, y - 10); ctx.quadraticCurveTo(x + 42, y - 10, x + 42, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ell(ctx, x + 34, y + 5, 2, 2); ctx.fill();
    // 발 매트
    // 발 매트 — 메이드카페식 인사, 일본어
    const mw = w + 56, mh = 34, mx = x + w / 2 - mw / 2, my = y + h + 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; rr(ctx, mx, my, mw, mh, 6); ctx.fillStyle = '#c85a70'; ctx.fill(); ctx.restore();
    rr(ctx, mx, my, mw, mh, 6); ctx.fillStyle = lin(ctx, 0, my, 0, my + mh, [[0, '#d8708a'], [1, '#b84a62']]); ctx.fill(); ctx.strokeStyle = '#8a3048'; ctx.lineWidth = 1.5; ctx.stroke();
    rr(ctx, mx + 4, my + 4, mw - 8, mh - 8, 4); ctx.strokeStyle = 'rgba(255,224,232,.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#fff0f4'; ctx.font = "bold 17px 'Noto Sans JP', 'Yu Gothic', 'Meiryo', 'Hiragino Sans', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('いらっしゃいませ♡', x + w / 2, my + mh / 2 + 1); ctx.textBaseline = 'alphabetic';
  }
  function counter(ctx, x, y, w, S, EN) { // 카운터 + 주방 (왼쪽)
    const h = 92;
    // 뒤 선반 (벽에, 메뉴판 아래 한 줄)
    ctx.fillStyle = '#e8d0d8'; ctx.fillRect(x, 240, w, 8); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x, 248, w, 6);
    for (let i = 0; i < 8; i++) { const cx = x + 20 + i * 36; const col = ['#ff9ab8', '#8ad8ff', '#ffe08a', '#b8f0a0', '#ffb08a', '#d8b0ff', '#ffd0e0', '#fff'][i]; if (i < 5) { rr(ctx, cx - 8, 212, 16, 28, 3); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = adj(col, -.4, 0); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(cx - 5, 216, 3, 18); rr(ctx, cx - 5, 205, 10, 8, 2); ctx.fillStyle = '#8a6a5a'; ctx.fill(); } else { ell(ctx, cx, 238, 9, 5); ctx.fillStyle = i & 1 ? '#fff' : '#ffe0e8'; ctx.fill(); ctx.strokeStyle = '#c8a0b0'; ctx.lineWidth = 1; ctx.stroke(); rr(ctx, cx - 9, 226, 18, 12, 3); ctx.fill(); ctx.stroke(); } }
    // 카운터 몸통
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; rr(ctx, x, y, w, h, 6); ctx.fillStyle = '#b87a8a'; ctx.fill(); ctx.restore();
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#d898a8'], [1, '#a8687a']]); ctx.fill(); ctx.strokeStyle = '#7a4a5a'; ctx.lineWidth = 1.5; ctx.stroke();
    // 앞면 패널 (세로 판자)
    for (let i = 0; i < w / 28; i++) { rr(ctx, x + 8 + i * 28, y + 14, 20, h - 28, 3); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); ctx.strokeStyle = 'rgba(80,30,50,.25)'; ctx.stroke(); }
    // 상판
    rr(ctx, x - 6, y - 8, w + 12, 16, 4); ctx.fillStyle = lin(ctx, 0, y - 8, 0, y + 8, [[0, '#fff8f4'], [1, '#e8d0d8']]); ctx.fill(); ctx.strokeStyle = '#a88898'; ctx.lineWidth = 1.5; ctx.stroke();
    // 커피 머신 (왼쪽)
    const mx = x + 30, my = y - 8;
    rr(ctx, mx, my - 58, 64, 58, 5); ctx.fillStyle = lin(ctx, mx, 0, mx + 64, 0, [[0, '#f0e8ea'], [.5, '#fff'], [1, '#c8b8c0']]); ctx.fill(); ctx.strokeStyle = '#8a7a80'; ctx.lineWidth = 1.5; ctx.stroke();
    rr(ctx, mx + 6, my - 52, 52, 16, 3); ctx.fillStyle = '#3a3040'; ctx.fill(); ctx.fillStyle = '#7ae8a0'; ctx.fillRect(mx + 10, my - 47, 14, 6); ctx.fillStyle = '#ff5a6a'; ell(ctx, mx + 48, my - 44, 3, 3); ctx.fill();
    ctx.fillStyle = '#5a4a50'; ctx.fillRect(mx + 22, my - 32, 20, 14); ctx.fillRect(mx + 28, my - 18, 8, 8); ctx.fillStyle = '#fff'; rr(ctx, mx + 20, my - 12, 24, 12, 3); ctx.fill(); ctx.strokeStyle = '#8a7a80'; ctx.stroke();
    ctx.strokeStyle = '#c8b8c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx + 64, my - 30); ctx.lineTo(mx + 78, my - 30); ctx.lineTo(mx + 78, my - 6); ctx.stroke();
    // 케이크 진열장 (오른쪽)
    const gx = x + w - 120, gy = y - 8;
    rr(ctx, gx, gy - 62, 108, 62, 6); ctx.fillStyle = 'rgba(210,235,255,.45)'; ctx.fill(); ctx.strokeStyle = '#a8c8e0'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(gx + 4, gy - 30, 100, 3);
    [['cake', 0, -40], ['parfait', 1, -40], ['cake', 2, -40], ['omu', 0, -8], ['coffee', 1, -8], ['parfait', 2, -8]].forEach(f => ART.drawFood(ctx, gx + 20 + f[1] * 34, gy + f[2] - 2, f[0], 1.6));
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(gx + 2, gy - 60); ctx.lineTo(gx + 40, gy - 60); ctx.lineTo(gx + 2, gy - 20); ctx.fill();
    // 계산대 (가운데)
    const rx = x + w / 2 - 30, ry = y - 8;
    rr(ctx, rx, ry - 34, 60, 34, 4); ctx.fillStyle = '#f2b8c8'; ctx.fill(); ctx.strokeStyle = '#a86a80'; ctx.lineWidth = 1.5; ctx.stroke(); rr(ctx, rx + 8, ry - 30, 44, 14, 2); ctx.fillStyle = '#3a3a48'; ctx.fill(); ctx.fillStyle = '#9af0b0'; ctx.font = "bold 10px monospace"; ctx.textAlign = 'right'; ctx.fillText('♥ 0000', rx + 48, ry - 19);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(rx + 12 + (i % 3) * 14, ry - 12 + Math.floor(i / 3) * 4, 8, 2); }
    // 마네키네코 (자동 수금)
    if (S && S.up && S.up.neko) { const nx = x + w / 2 + 62, ny = y - 8; ell(ctx, nx, ny - 14, 14, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#b8a8a8'; ctx.lineWidth = 1.2; ctx.stroke(); ell(ctx, nx, ny - 34, 13, 11); ctx.fill(); ctx.stroke(); [-1, 1].forEach(sg => { ctx.beginPath(); ctx.moveTo(nx + sg * 4, ny - 42); ctx.lineTo(nx + sg * 11, ny - 50); ctx.lineTo(nx + sg * 12, ny - 38); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = '#2a2a3a'; ell(ctx, nx - 5, ny - 35, 1.6, 2.2); ctx.fill(); ell(ctx, nx + 5, ny - 35, 1.6, 2.2); ctx.fill(); ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nx - 3, ny - 30); ctx.quadraticCurveTo(nx, ny - 27, nx + 3, ny - 30); ctx.stroke(); ctx.fillStyle = '#e8305a'; rr(ctx, nx - 9, ny - 26, 18, 4, 2); ctx.fill(); ctx.fillStyle = '#ffd24a'; ell(ctx, nx, ny - 22, 4, 3); ctx.fill(); ell(ctx, nx + 14, ny - 26, 5, 5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd24a'; ell(ctx, nx - 2, ny - 12, 8, 6); ctx.fill(); ctx.strokeStyle = '#a8801a'; ctx.stroke(); ctx.fillStyle = '#7a4a10'; ctx.font = "bold 8px sans-serif"; ctx.textAlign = 'center'; ctx.fillText('福', nx - 2, ny - 9); }
    // 주방 안내 팻말
    ctx.fillStyle = '#5a3a4a'; ctx.font = "bold 13px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.fillText('KITCHEN', x + w / 2, y + h - 10);
  }
  function stage(ctx, x, y, w, S) { // 미니 무대 (장식 5단계)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; rr(ctx, x, y, w, 30, 6); ctx.fillStyle = '#c05a7a'; ctx.fill(); ctx.restore();
    rr(ctx, x, y, w, 30, 6); ctx.fillStyle = lin(ctx, 0, y, 0, y + 30, [[0, '#f090b0'], [1, '#a84a6a']]); ctx.fill(); ctx.strokeStyle = '#7a3050'; ctx.lineWidth = 1.5; ctx.stroke();
    rr(ctx, x - 4, y - 6, w + 8, 12, 4); ctx.fillStyle = '#ffd0e0'; ctx.fill(); ctx.stroke();
    for (let i = 0; i < w / 18; i++) { ctx.fillStyle = i & 1 ? '#ffe08a' : '#ff8ab0'; ell(ctx, x + 9 + i * 18, y + 22, 3, 3); ctx.fill(); }
    // 마이크 스탠드
    ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w - 22, y - 6); ctx.lineTo(x + w - 22, y - 70); ctx.stroke(); ell(ctx, x + w - 22, y - 6, 10, 3); ctx.fillStyle = '#4a4a5a'; ctx.fill(); ell(ctx, x + w - 22, y - 76, 6, 8); ctx.fillStyle = '#8a8a9a'; ctx.fill(); ctx.strokeStyle = '#3a3a4a'; ctx.stroke();
  }
  function plushShelf(ctx, x, y) { // 인형 진열 선반 (장식 4단계)
    ctx.fillStyle = '#e8d0d8'; ctx.fillRect(x, y, 150, 8); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x, y + 8, 150, 6);
    const cols = ['#ffb8c8', '#b8e0ff', '#ffe08a', '#c8f0b0'];
    cols.forEach((c, i) => { const px = x + 22 + i * 36, py = y - 6; ell(ctx, px, py - 10, 12, 11); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = adj(c, -.4, 0); ctx.lineWidth = 1.2; ctx.stroke(); ell(ctx, px, py - 26, 10, 9); ctx.fill(); ctx.stroke(); [-1, 1].forEach(sg => { ell(ctx, px + sg * 7, py - 33, 3.5, 3.5); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = '#2a2a3a'; ell(ctx, px - 3.5, py - 27, 1.3, 1.6); ctx.fill(); ell(ctx, px + 3.5, py - 27, 1.3, 1.6); ctx.fill(); ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(px - 2, py - 23); ctx.quadraticCurveTo(px, py - 21, px + 2, py - 23); ctx.stroke(); ctx.fillStyle = '#ff8aa0'; ell(ctx, px - 6, py - 24, 2, 1.3); ctx.fill(); ell(ctx, px + 6, py - 24, 2, 1.3); ctx.fill(); });
  }
  function neonSign(ctx, x, y, t) { // 네온 하트 간판 (장식 3단계)
    ctx.save(); ctx.shadowColor = '#ff4a8a'; ctx.shadowBlur = 16; ctx.strokeStyle = '#ff7ab8'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; heart(ctx, x, y, 22); ctx.stroke(); ctx.strokeStyle = '#fff0f6'; ctx.lineWidth = 1.5; heart(ctx, x, y, 22); ctx.stroke();
    ctx.shadowColor = '#7ae8ff'; ctx.strokeStyle = '#8af0ff'; ctx.lineWidth = 3; ctx.font = "bold 22px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.strokeText('MOE', x, y + 48); ctx.fillStyle = '#fff'; ctx.fillText('MOE', x, y + 48); ctx.restore();
  }
  function bunting(ctx, y) { // 하트 가랜드 (장식 2단계)
    ctx.strokeStyle = '#c8889a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x < W; x += 160) ctx.quadraticCurveTo(x + 80, y + 40, x + 160, y); ctx.stroke();
    for (let x = 0; x < W; x += 160) for (let i = 1; i < 5; i++) { const tt = i / 5, px = x + tt * 160, py = y + 2 * (1 - tt) * tt * 40 + 4; const c = ['#ff8ab0', '#ffd24a', '#8ad8ff', '#c8f0a0'][i - 1]; ctx.fillStyle = c; ctx.strokeStyle = adj(c, -.35, 0); ctx.lineWidth = 1; heart(ctx, px, py + 8, 7); ctx.fill(); ctx.stroke(); }
  }
  function balloons(ctx, x, y) {
    [['#ff8ab0', 0, 0], ['#ffd24a', 22, -18], ['#8ad8ff', -20, -12]].forEach(b => { ctx.strokeStyle = '#8a7a80'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + b[1], y + b[2]); ctx.quadraticCurveTo(x + b[1] / 2, y + 40, x, y + 70); ctx.stroke(); ell(ctx, x + b[1], y + b[2] - 22, 14, 18); ctx.fillStyle = rad(ctx, x + b[1] - 5, y + b[2] - 30, 2, 22, [[0, adj(b[0], .4, 0)], [1, b[0]]]); ctx.fill(); ctx.strokeStyle = adj(b[0], -.35, 0); ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = adj(b[0], -.2, 0); ctx.beginPath(); ctx.moveTo(x + b[1] - 3, y + b[2] - 4); ctx.lineTo(x + b[1] + 3, y + b[2] - 4); ctx.lineTo(x + b[1], y + b[2]); ctx.fill(); });
  }
  function plant(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y, 22, 6); ctx.fill();
    ctx.fillStyle = lin(ctx, x - 18, 0, x + 18, 0, [[0, '#c86a5a'], [.4, '#e88a70'], [1, '#a85040']]); ctx.beginPath(); ctx.moveTo(x - 18, y - 36); ctx.lineTo(x + 18, y - 36); ctx.lineTo(x + 14, y); ctx.lineTo(x - 14, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a3a30'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#e89a80'; ctx.fillRect(x - 19, y - 40, 38, 6);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .3, L = 44 + (i % 3) * 12; ctx.strokeStyle = '#2e7a3e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.quadraticCurveTo(x + Math.cos(a) * L * .6, y - 40 + Math.sin(a) * L * .9, x + Math.cos(a) * L, y - 40 + Math.sin(a) * L); ctx.stroke(); ctx.save(); ctx.translate(x + Math.cos(a) * L, y - 40 + Math.sin(a) * L); ctx.rotate(a); ell(ctx, 0, 0, 16, 7); ctx.fillStyle = i & 1 ? '#4aa85a' : '#3a9048'; ctx.fill(); ctx.strokeStyle = '#25702f'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.restore(); }
  }

  // ── 배경 전체 ──
  function background(ctx, S, EN) {
    // 벽: 파스텔 분홍 세로 줄무늬
    ctx.fillStyle = '#f8dfe7'; ctx.fillRect(0, 0, W, WALL);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 44) ctx.fillRect(x, 0, 18, WALL);
    ctx.fillStyle = 'rgba(200,120,150,.06)'; for (let x = 22; x < W; x += 44) ctx.fillRect(x, 0, 4, WALL);
    // 벽 위쪽 어두운 그라데이션 + 몰딩
    ctx.fillStyle = lin(ctx, 0, 0, 0, 120, [[0, 'rgba(120,60,90,.28)'], [1, 'rgba(120,60,90,0)']]); ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = '#fff6f8'; ctx.fillRect(0, 0, W, 14); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, 14, W, 4);
    // 조명
    lamp(ctx, 330, 60); lamp(ctx, 700, 60); lamp(ctx, 1010, 60);
    // 징두리(허리 아래 흰 패널)
    ctx.fillStyle = '#fff7f9'; ctx.fillRect(0, WALL - 46, W, 46 + (RAIL - WALL));
    ctx.fillStyle = '#f0d8e0'; ctx.fillRect(0, WALL - 50, W, 6);
    for (let x = 10; x < W; x += 80) { rr(ctx, x, WALL - 36, 60, 60, 3); ctx.strokeStyle = '#e8ccd6'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill(); }
    ctx.fillStyle = '#d8b8c4'; ctx.fillRect(0, RAIL - 6, W, 6);
    // 바닥: 체크 타일
    for (let y = RAIL; y < H; y += 48) for (let x = 0; x < W; x += 48) { const k = ((x / 48) + Math.floor((y - RAIL) / 48)) & 1; ctx.fillStyle = k ? '#f6d4dd' : '#fdf0f2'; ctx.fillRect(x, y, 48, 48); }
    ctx.fillStyle = 'rgba(180,110,140,.10)'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, RAIL, 1.5, H - RAIL); for (let y = RAIL; y < H; y += 48) ctx.fillRect(0, y, W, 1.5);
    // 바닥 빛·어둠
    ctx.fillStyle = rad(ctx, 640, 520, 60, 720, [[0, 'rgba(255,245,230,.30)'], [1, 'rgba(120,60,90,.18)']]); ctx.fillRect(0, RAIL, W, H - RAIL);
    ctx.fillStyle = lin(ctx, 0, RAIL, 0, RAIL + 40, [[0, 'rgba(90,40,70,.28)'], [1, 'rgba(90,40,70,0)']]); ctx.fillRect(0, RAIL, W, 40);
    // 벽 요소
    chalkboard(ctx, 44, 26, 210, 172, EN);
    windowView(ctx, 880, 52, 220, 180);
    door(ctx, 1150, 80, 104, 258, EN);
    const D = (S && S.up && S.up.decor) || 0;
    if (D >= 1) { frame(ctx, 330, 80, 96, 118, ART.MAIDS[0]); frame(ctx, 450, 60, 110, 136, ART.MAIDS[8]); frame(ctx, 584, 84, 96, 118, ART.MAIDS[3]); }
    else { ctx.fillStyle = 'rgba(0,0,0,.05)'; rr(ctx, 400, 90, 180, 110, 6); ctx.fill(); }
    if (D >= 2) { bunting(ctx, 22); balloons(ctx, 1120, 200); }
    if (D >= 3) neonSign(ctx, 780, 100, 0);
    if (D >= 4) plushShelf(ctx, 700, 190);
    // 화분
    plant(ctx, 860, RAIL + 12); plant(ctx, 1050, 440);
    // 카운터
    counter(ctx, 40, 380, 300, S, EN);
    if (D >= 5) stage(ctx, 60, 640, 260, S);
    // 가장자리 비네트
    ctx.fillStyle = rad(ctx, 640, 380, 420, 900, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(60,20,40,.28)']]); ctx.fillRect(0, 0, W, H);
  }

  // ── 탁자 (동적: 앞·뒤로 나누어 그림) ──
  // 뒤: 의자 등받이. 앞: 탁자 상판 + 앞 의자 없음(손님이 뒤에 앉음)
  function tableBack(ctx, x, y, locked) {
    // 의자 (뒤)
    const c = locked ? '#c8b8c0' : '#c86a7a';
    rr(ctx, x - 22, y - 70, 44, 40, 8); ctx.fillStyle = lin(ctx, 0, y - 70, 0, y - 30, [[0, adj(c, .25, 0)], [1, c]]); ctx.fill(); ctx.strokeStyle = adj(c, -.35, 0); ctx.lineWidth = 1.5; ctx.stroke();
    rr(ctx, x - 18, y - 64, 36, 26, 5); ctx.fillStyle = adj(c, .5, 0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ell(ctx, x, y + 8, 60, 14); ctx.fill();
  }
  function tableFront(ctx, x, y, locked, flower) {
    // 탁자 다리
    ctx.fillStyle = '#8a5a6a'; ctx.fillRect(x - 5, y - 10, 10, 34); ell(ctx, x, y + 24, 22, 6); ctx.fill(); ctx.strokeStyle = '#5a3a48'; ctx.lineWidth = 1; ctx.stroke();
    // 상판 + 식탁보
    const c = locked ? '#ded4d8' : '#ffd0dc';
    ell(ctx, x, y - 12, 56, 22); ctx.fillStyle = adj(c, -.25, 0); ctx.fill();
    ell(ctx, x, y - 16, 56, 22); ctx.fillStyle = lin(ctx, x - 56, 0, x + 56, 0, [[0, adj(c, -.1, 0)], [.35, adj(c, .3, 0)], [1, adj(c, -.15, 0)]]); ctx.fill(); ctx.strokeStyle = adj(c, -.4, 0); ctx.lineWidth = 1.2; ctx.stroke();
    if (!locked) { // 식탁보 체크무늬·레이스
      ctx.save(); ell(ctx, x, y - 16, 56, 22); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(x + i * 12, y - 40); ctx.lineTo(x + i * 12, y + 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 60, y - 16 + i * 5); ctx.lineTo(x + 60, y - 16 + i * 5); ctx.stroke(); } ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ell(ctx, x, y - 16, 50, 18); ctx.stroke(); ctx.setLineDash([]);
      if (flower) { rr(ctx, x - 4, y - 34, 8, 14, 3); ctx.fillStyle = 'rgba(200,230,255,.7)'; ctx.fill(); ctx.strokeStyle = '#8ab'; ctx.lineWidth = .8; ctx.stroke(); ctx.strokeStyle = '#4a9a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x - 3, y - 46); ctx.moveTo(x, y - 34); ctx.lineTo(x + 3, y - 44); ctx.stroke(); ['#ff8ab0', '#ffd24a'].forEach((cc, i) => { const fx = x + (i ? 3 : -3), fy = i ? y - 45 : y - 47; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ell(ctx, fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2, 1.6, a); ctx.fillStyle = cc; ctx.fill(); } ell(ctx, fx, fy, 1.4, 1.4); ctx.fillStyle = '#fff'; ctx.fill(); }); }
    } else { // 잠긴 탁자: 예약 팻말
      ctx.fillStyle = '#fff'; rr(ctx, x - 26, y - 34, 52, 24, 4); ctx.fill(); ctx.strokeStyle = '#a898a0'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#7a6a70'; ctx.font = "bold 13px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.fillText('+', x, y - 17);
    }
  }

  // 의자 위 손님 좌표: 탁자 (x,y) 뒤에 앉은 손님의 발 위치
  function seatPos(x, y) { return { x: x, y: y - 22 }; }
  // 탁자 위 접시 위치
  function platePos(x, y) { return { x: x + 14, y: y - 20 }; }

  window.SCENE = { W, H, WALL, RAIL, background, tableBack, tableFront, seatPos, platePos, lamp, plant };
})();
