// 엔딩 결과 카드: 1080x1350 한 장(저장 = 그림, 공유 = 글+주소). 손님 기기 안에서만 그린다.
(function () {
  const C = (window.CARD = {});
  const W = 1080, H = 1350;
  let url = null;
  function txt(g, s, x, y, px, fill, stroke, lw, align) {
    g.font = px + 'px Px, monospace'; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'miter';
    if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }
  function rank(s) {
    if (s.deaths === 0) return L('전설의 의적', 'LEGENDARY OUTLAW');
    if (s.deaths <= 8) return L('날랜 의적', 'SWIFT OUTLAW');
    if (s.deaths <= 25) return L('끈질긴 의적', 'STUBBORN OUTLAW');
    return L('넘어져도 일어나는 의적', 'NEVER-GIVE-UP OUTLAW');
  }
  function logo() {
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.totalGems = () => LEVELS.reduce((n, l) => n + l.map.join('').split('$').length - 1, 0);
  C.make = async function (o) {
    const s = o.stats, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    try { await Promise.all([document.fonts.load('40px Px'), document.fonts.load('40px Ttl')]); } catch (e) {}
    // 바탕: 밤하늘 색 띠 + 별
    const bands = ['#0a0b24', '#10123a', '#181a4a', '#22225a', '#2e2a66', '#3c2e6a'];
    for (let i = 0; i < bands.length; i++) { g.fillStyle = bands[i]; g.fillRect(0, Math.floor(i * H / bands.length), W, Math.ceil(H / bands.length)); }
    for (let i = 0; i < 140; i++) { g.fillStyle = i % 5 ? '#8a8cc8' : '#fff6d0'; const z = i % 7 ? 4 : 8; g.fillRect(Math.floor(Math.random() * W / 4) * 4, Math.floor(Math.random() * H / 4) * 4, z, z); }
    // 나무 테 + 단청 띠
    const fr = (x, y, w, h, c1, t) => { g.fillStyle = c1; g.fillRect(x, y, w, t); g.fillRect(x, y + h - t, w, t); g.fillRect(x, y, t, h); g.fillRect(x + w - t, y, t, h); };
    fr(24, 24, W - 48, H - 48, '#5a3a20', 20); fr(44, 44, W - 88, H - 88, '#c8382a', 6); fr(50, 50, W - 100, H - 100, '#2f8a5a', 6); fr(56, 56, W - 112, H - 112, '#f0c058', 4);
    // 제목(점 글씨)
    if (window.TITLEPIX) g.drawImage(TITLEPIX, 0, 0, 320, 80, 60, 70, 960, 240);
    // 장면: 마지막 방을 3배로
    const ph = { x: 100, y: 330, w: 880, h: 495 };
    g.fillStyle = '#1a0e12'; g.fillRect(ph.x - 12, ph.y - 12, ph.w + 24, ph.h + 24);
    g.fillStyle = '#f0c058'; g.fillRect(ph.x - 6, ph.y - 6, ph.w + 12, ph.h + 12);
    try {
      G.draw(WORLD.state.t);
      // 왕자 둘레를 4배로(220×124 자르기)
      const px = RND.sx(G.pr.x), py = RND.sy(G.pr.y), cw = 220, ch = 124;
      const sx = Math.max(0, Math.min(RND.VW - cw, Math.round(px - 60))), sy = Math.max(0, Math.min(RND.VH - ch, Math.round(py - 92)));
      g.drawImage(RND.lo, sx, sy, cw, ch, ph.x, ph.y, ph.w, ph.h);
    } catch (e) {}
    // 엔딩 이름 + 칭호
    txt(g, L('아버지를 구했다', 'FATHER IS FREE'), W / 2, 890, 56, '#fff0c8', '#1a0e12', 10);
    txt(g, rank(s), W / 2, 966, 72, '#f0c058', '#1a0e12', 12);
    // 숫자 넷
    const m = Math.floor(s.time / 60), sec = Math.floor(s.time % 60);
    const cells = [[L('걸린 시간', 'TIME'), m + ':' + String(sec).padStart(2, '0')], [L('쓰러짐', 'DEATHS'), String(s.deaths)], [L('엽전', 'COINS'), s.gems + ' / ' + C.totalGems()], [L('물리친 적', 'DEFEATED'), String(s.kills)]];
    cells.forEach((cc, i) => {
      const cx = W * (0.17 + i * 0.22), cy = 1080;
      txt(g, cc[0], cx, cy, 30, '#c8a070');
      txt(g, cc[1], cx, cy + 56, 50, '#fff0c8', '#1a0e12', 8);
    });
    txt(g, L('너는 몇 번 쓰러질까?', 'How many times will you fall?'), W / 2, 1200, 36, '#fff0c8', '#1a0e12', 8);
    const lg = await logo();
    g.font = '34px Px, monospace'; const sw = g.measureText('oreumgames.com').width, lw = 60, bx = W / 2 - (sw + lw + 14) / 2;
    if (lg) { try { g.filter = 'invert(1)'; g.drawImage(lg, bx, 1252, lw, 29); g.filter = 'none'; } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1267, 34, '#fff', null, 0, 'left');
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () {
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = 'moonlit-outlaw-ending.png'; document.body.appendChild(a); a.click(); a.remove();
  };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    const text = L('달빛 의적 엔딩 봤다! 너도 사또를 혼내 줘', 'I beat the corrupt magistrate in Moonlit Outlaw! Try it') + (link ? '\n' + link : '');
    if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(text); G.pop && G.pop(L('주소 복사됨', 'LINK COPIED'), '#fff0c8'); } catch (e) {}
  };
})();