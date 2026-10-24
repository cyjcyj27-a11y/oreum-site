// 엔딩 결과 카드: 1080x1350 한 장(저장 = 그림, 공유 = 글+주소).
(function () {
  const C = (window.CARD = {});
  const W = 1080, H = 1350, INK = '#1c1426';
  let url = null, shareLine = '';
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  function txt(g, s, x, y, font, fill, stroke, lw, align) {
    g.font = font; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }
  function fit(g, s, px, fam, maxW) { g.font = px + 'px ' + fam; while (px > 18 && g.measureText(s).width > maxW) { px -= 2; g.font = px + 'px ' + fam; } return g.font; }
  function title(S) {
    const l = S.life;
    if (l <= 2) return L('전설의 모기', 'LEGENDARY MOSQUITO');
    if (l <= 3) return L('모기 대장', 'MOSQUITO BOSS');
    if (l <= 5) return L('프로 흡혈러', 'PRO BLOODSUCKER');
    if (l <= 8) return L('끈질긴 모기', 'STUBBORN MOSQUITO');
    return L('불사의 모기', 'IMMORTAL MOSQUITO');
  }
  function tm(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + String(s).padStart(2, '0'); }
  function logo() {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function () {
    const S = GAME.S;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Jal'), document.fonts.load('30px Ui')]); } catch (e) {}
    // 바탕: 노을 하늘 띠
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b2a63'); bg.addColorStop(0.55, '#b65f8f'); bg.addColorStop(1, '#ffae6b'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.6) + ')'; g.fillRect(Math.random() * W, Math.random() * H * 0.4, 3, 3); }
    // 제목
    txt(g, 'MOGIZ', W / 2, 108, '150px Jal, sans-serif', '#ff4d6d', INK, 26);
    txt(g, L('모기즈', 'THE END'), W / 2, 214, '60px Jal, sans-serif', '#ffffff', INK, 14);
    // 장면 사진(알 낳는 대야)
    const ph = { x: 90, y: 270, w: 900, h: 470 };
    rr(g, ph.x - 12, ph.y - 12, ph.w + 24, ph.h + 24, 26); g.fillStyle = INK; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 16); g.clip(); g.fillStyle = '#000'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    try { RND.render(); const sc = RND.renderer.domElement, k = Math.max(ph.w / sc.width, ph.h / sc.height); g.drawImage(sc, ph.x + (ph.w - sc.width * k) / 2, ph.y + (ph.h - sc.height * k) / 2, sc.width * k, sc.height * k); } catch (e) {}
    g.restore();
    // 칭호 + 숫자(모기장 판)
    const P = { x: 70, y: 790, w: 940, h: 420 };
    rr(g, P.x, P.y, P.w, P.h, 30); g.fillStyle = '#f7f9fb'; g.fill();
    g.save(); rr(g, P.x, P.y, P.w, P.h, 30); g.clip(); g.strokeStyle = 'rgba(60,80,110,.13)'; g.lineWidth = 1.5;
    for (let x = P.x; x < P.x + P.w; x += 9) { g.beginPath(); g.moveTo(x, P.y); g.lineTo(x, P.y + P.h); g.stroke(); }
    for (let y = P.y; y < P.y + P.h; y += 9) { g.beginPath(); g.moveTo(P.x, y); g.lineTo(P.x + P.w, y); g.stroke(); }
    g.restore();
    rr(g, P.x, P.y, P.w, P.h, 30); g.lineWidth = 12; g.strokeStyle = '#3a6fd0'; g.stroke();
    g.setLineDash([14, 10]); rr(g, P.x + 18, P.y + 18, P.w - 36, P.h - 36, 18); g.lineWidth = 3; g.strokeStyle = 'rgba(58,111,208,.6)'; g.stroke(); g.setLineDash([]);
    const name = title(S);
    txt(g, name, W / 2, P.y + 78, fit(g, name, 80, 'Jal, sans-serif', 860), '#ff4d6d', INK, 14);
    const cells = [[L('환생', 'LIVES'), S.life + L('번째', '')], [L('마신 피', 'BLOOD'), S.ul.toFixed(1) + '㎕'], [L('걸린 시간', 'TIME'), tm(S.sec)], [L('진화 카드', 'CARDS'), String(S.cards.length)]];
    cells.forEach((cc, i) => {
      const cx = P.x + P.w * (i % 2 ? 0.74 : 0.26), cy = P.y + 190 + Math.floor(i / 2) * 120;
      txt(g, cc[0], cx, cy - 32, '34px Ui, sans-serif', '#1f2a55');
      txt(g, cc[1], cx, cy + 22, '62px Jal, sans-serif', '#ffffff', INK, 12);
    });
    const dexN = Object.keys(S.dex).length;
    txt(g, L('도감 ', 'DEX ') + dexN + '/' + DATA.CARDS.length, W / 2, P.y + P.h - 40, '34px Ui, sans-serif', '#1f2a55');
    txt(g, L('너는 몇 번 환생하고 알을 낳을까', 'How many rebirths till your eggs?'), W / 2, 1262, '42px Jal, sans-serif', '#ffffff', INK, 10);
    const lg = await logo();
    g.font = '36px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 62, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.drawImage(lg, bx, 1302, lw, 30); } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1318, '36px Ui, sans-serif', INK, null, 0, 'left');
    shareLine = L('모기즈 엔딩! ' + S.life + '번째 모기로 알 낳기 성공, 마신 피 ' + S.ul.toFixed(1) + '㎕ · ' + name, 'MOGIZ cleared! Laid eggs as mosquito #' + S.life + ', drank ' + S.ul.toFixed(1) + 'µL · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'mogiz-end.png'; document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: 'MOGIZ', text: shareLine, url: link || undefined }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); } catch (e) {}
    UI.toast(L('주소를 복사했습니다', 'Link copied'));
  };
})();
