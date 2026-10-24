// 엔딩 결과 카드: 1080x1350 한 장(저장 = 그림, 공유 = 글+주소)
(function () {
  const C = (window.CARD = {});
  const W = 1080, H = 1350;
  let url = null, shareLine = '';
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  function txt(g, s, x, y, font, fill, stroke, lw, align) {
    g.font = font; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }
  function fit(g, s, px, fam, maxW) { g.font = px + 'px ' + fam; while (px > 18 && g.measureText(s).width > maxW) px -= 2; return px + 'px ' + fam; }
  function title(st) {
    const r = st.served ? st.perfect / st.served : 0;
    if (r >= 0.8 && st.burnt === 0) return L('남포동 호떡 명인', 'Nampo Hotteok Master');
    if (r >= 0.6) return L('부산 명물 호떡집', 'Busan Famous Stall');
    if (r >= 0.35) return L('줄 서는 호떡집', 'Stall with a Line');
    return L('동네 호떡 아저씨', 'Neighborhood Hotteok Stand');
  }
  function logo() {
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function () {
    const st = GAME.S.stats;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('30px Ui')]); } catch (e) {}
    // 바탕: 주황 천막 줄무늬 테 + 종이컵 종이
    for (let x = 0; x < W; x += 90) { g.fillStyle = (x / 90) % 2 ? '#f08a2a' : '#e8622a'; g.fillRect(x, 0, 90, H); }
    rr(g, 40, 40, W - 80, H - 80, 30); g.fillStyle = '#fbf6ea'; g.fill();
    g.strokeStyle = '#c8261e'; g.lineWidth = 8; rr(g, 58, 58, W - 116, H - 116, 22); g.stroke();
    // 제목
    txt(g, L('호떡만들기 게임', 'HOTTEOK MAKER'), W / 2, 150, fit(g, L('호떡만들기 게임', 'HOTTEOK MAKER'), 120, 'Ttl, Ui, sans-serif', 860), '#c8261e', '#fff3d6', 14);
    txt(g, 'THE END', W / 2, 262, '64px Ttl, sans-serif', '#3a2414');
    // 장면 사진
    const ph = { x: 110, y: 310, w: 860, h: 500 };
    rr(g, ph.x - 12, ph.y - 12, ph.w + 24, ph.h + 24, 26); g.fillStyle = '#7a4a24'; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 16); g.clip(); g.fillStyle = '#000'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    try { const sc = RND.snap(1720, 1000, new THREE.Vector3(0, 0.62, 1.05), new THREE.Vector3(0, 0.22, -0.55), 52); g.drawImage(sc, ph.x, ph.y, ph.w, ph.h); } catch (e) {}
    g.restore();
    // 칭호 + 숫자
    const name = title(st);
    txt(g, name, W / 2, 880, fit(g, name, 76, 'Ttl, Ui, sans-serif', 900), '#c8261e', '#ffffff', 12);
    const pr = st.served ? Math.round(st.perfect / st.served * 100) : 0;
    const cells = [[L('판 호떡', 'HOTTEOK SOLD'), st.served.toLocaleString()], ['PERFECT', pr + '%'], [L('번 코인', 'COINS EARNED'), st.earned.toLocaleString()], [L('탄 호떡', 'BURNT'), String(st.burnt)]];
    cells.forEach((cc, i) => {
      const cx = W * (i % 2 ? 0.72 : 0.28), cy = 995 + Math.floor(i / 2) * 120;
      txt(g, cc[0], cx, cy - 32, '32px Ui, sans-serif', '#6a4a30');
      txt(g, cc[1], cx, cy + 18, '62px Ttl, sans-serif', '#2a1a10');
    });
    txt(g, L('너는 몇 개 구울 수 있을까?', 'How many can you make?'), W / 2, 1200, '38px Ui, sans-serif', '#3a2414');
    const lg = await logo();
    g.font = '34px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 58, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.drawImage(lg, bx, 1238, lw, 28); } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1253, '34px Ui, sans-serif', '#3a2414', null, 0, 'left');
    shareLine = L('호떡만들기 게임 14일 장사 끝! 호떡 ' + st.served + '개, PERFECT ' + pr + '% · ' + name, 'Hotteok Maker: 14 days done! ' + st.served + ' sold, ' + pr + '% PERFECT · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'hotteok-end.png'; document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '').replace(/index\.html$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: L('호떡만들기 게임', 'Hotteok Maker'), text: shareLine, url: link || undefined }).catch(() => {}); return 'shared'; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); } catch (e) {}
    return 'copied';
  };
})();
