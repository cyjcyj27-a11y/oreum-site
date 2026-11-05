// 엔딩 결과 카드: 1080x1350 한 장(바랜 도안 종이 위에 내가 새긴 타투 폴라로이드)
(function () {
  const C = (window.CARD = {});
  const W = 1080, H = 1350;
  let url = null, shareLine = '';
  function txt(g, s, x, y, font, fill, stroke, lw, align) {
    g.font = font; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }
  function fit(g, s, px, fam, maxW) { g.font = px + 'px ' + fam; while (px > 18 && g.measureText(s).width > maxW) { px -= 2; g.font = px + 'px ' + fam; } return g.font; }
  function title(st) {
    const miss = st.offs + st.blows + st.spills;
    if (miss === 0) return L('바늘 끝의 장인', 'Needle Master');
    if (miss <= 8) return L('동네 1등 타투이스트', 'Best Tattooist in Town');
    if (miss <= 25) return L('손 떨리는 견습생', 'Shaky Apprentice');
    return L('삐끗 대장', 'King of Slips');
  }
  const img = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  C.make = async function () {
    const S = GAME.S, st = S.stats;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('30px Ui')]); } catch (e) {}
    FLASH.paper(g, W, H, 21);
    g.strokeStyle = '#18171b'; g.lineWidth = 12; g.strokeRect(26, 26, W - 52, H - 52); g.lineWidth = 4; g.strokeRect(44, 44, W - 88, H - 88);
    // 리본 제목
    const tt = L('타투샵', 'TATTOO SHOP');
    g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#18171b';
    g.beginPath(); g.moveTo(150, 90); g.quadraticCurveTo(W / 2, 50, W - 150, 90); g.lineTo(W - 150, 220); g.quadraticCurveTo(W / 2, 180, 150, 220); g.closePath(); g.fillStyle = '#c8312b'; g.fill(); g.stroke();
    txt(g, tt, W / 2, 150, fit(g, tt, 110, 'Ttl, serif', 680), '#f3e5bf', '#18171b', 14);
    txt(g, 'THE END', W / 2, 272, '58px Ttl, serif', '#18171b');
    // 폴라로이드: 내가 새긴 것들(최근 12장)
    const ps = (GAME.polas || []).slice(-12), cols = 4, cw = 200, chh = 226, gx = (W - cols * cw - (cols - 1) * 26) / 2;
    for (let i = 0; i < 12; i++) {
      const cx = gx + (i % cols) * (cw + 26), cy = 318 + Math.floor(i / cols) * (chh + 14);
      g.save(); g.translate(cx + cw / 2, cy + chh / 2); g.rotate(((i * 37) % 7 - 3) * 0.018);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-cw / 2 + 5, -chh / 2 + 7, cw, chh);
      g.fillStyle = '#fbf8f0'; g.fillRect(-cw / 2, -chh / 2, cw, chh);
      const p = ps[i];
      if (p) { const im = await img(p.src); if (im) g.drawImage(im, -cw / 2 + 12, -chh / 2 + 12, cw - 24, cw - 24); }
      else { const k = FLASH.KEYS[i % FLASH.KEYS.length]; g.fillStyle = '#eadbb2'; g.fillRect(-cw / 2 + 12, -chh / 2 + 12, cw - 24, cw - 24); FLASH.draw(g, k, -cw / 2 + 26, -chh / 2 + 26, cw - 52, { dots: false }); }
      g.fillStyle = 'rgba(240,200,80,.6)'; g.fillRect(-26, -chh / 2 - 10, 52, 22); // 테이프
      g.restore();
    }
    const name = title(st);
    txt(g, name, W / 2, 1080, fit(g, name, 70, 'Ttl, serif', 880), '#c8312b', '#18171b', 10);
    const cells = [[L('새긴 타투', 'TATTOOS'), String(st.done)], [L('피어싱', 'PIERCINGS'), String(st.pierced)], [L('번 코인', 'COINS'), st.earned.toLocaleString()]];
    cells.forEach((cc, i) => { const cx = W * (0.2 + i * 0.3); txt(g, cc[0], cx, 1148, '28px Ui, sans-serif', '#3a3236'); txt(g, cc[1], cx, 1200, '52px Ttl, serif', '#18171b'); });
    txt(g, 'oreumgames.com', W / 2, 1266, '28px Ui, sans-serif', '#18171b');
    shareLine = L('타투샵 손님 25명 끝! 타투 ' + st.done + '장, 피어싱 ' + st.pierced + '개 · ' + name, 'Tattoo Shop cleared! ' + st.done + ' tattoos, ' + st.pierced + ' piercings · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'tattoo-end.png'; document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: L('타투샵', 'Tattoo Shop'), text: shareLine, url: link || undefined }).catch(() => {}); return 'shared'; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); } catch (e) {}
    return 'copied';
  };
})();
