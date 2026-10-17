// 엔딩 결과 카드: 1080x1350 한 장(저장 = 그림, 공유 = 글+주소). 손님 기기 안에서만 그린다.
(function () {
  const C = (window.CARD = {});
  const W = 1080, H = 1350;
  let url = null;
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  function txt(g, s, x, y, font, fill, stroke, lw, align) {
    g.font = font; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }
  function fit(g, s, px, fam, maxW) { g.font = px + 'px ' + fam; while (px > 18 && g.measureText(s).width > maxW) { px -= 2; g.font = px + 'px ' + fam; } return g.font; }
  function title(tot, acc) {
    if (tot >= 90) return L('전설의 손목', 'LEGENDARY WRIST');
    if (tot >= 75) return L('오락실의 신', 'ARCADE GOD');
    if (tot >= 55) return L('동네 농구왕', 'NEIGHBORHOOD KING');
    if (acc >= 50) return L('명사수', 'SHARPSHOOTER');
    return L('농구 기계 정복자', 'MACHINE CONQUEROR');
  }
  function logo() {
    // file:// 로 열면 그림을 그린 캔버스가 더러워져 저장이 막힐 수 있어, 작은 캔버스로 먼저 시험
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function (o) {
    const S = o.S, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('30px Ui'), document.fonts.load('30px Led')]); } catch (e) {}
    // 오락실 밤 바탕 + 형광 점
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120a26'); bg.addColorStop(0.6, '#0b0818'); bg.addColorStop(1, '#1a0a14');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const cols = ['#ff3fa4', '#2ef2ff', '#ffe23a', '#7c4dff'];
    for (let i = 0; i < 90; i++) { g.fillStyle = cols[i % 4]; g.globalAlpha = 0.25; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 4, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    // 제목(네온)
    g.shadowColor = '#ff6a1a'; g.shadowBlur = 36;
    txt(g, L('오락실 농구', 'ARCADE HOOPS'), W / 2, 96, fit(g, L('오락실 농구', 'ARCADE HOOPS'), 112, 'Ttl, sans-serif', 900), '#fff3d6', '#7a2408', 10);
    g.shadowBlur = 0;
    g.shadowColor = '#2ef2ff'; g.shadowBlur = 20;
    txt(g, 'CHAMPION', W / 2, 184, '56px Ttl, sans-serif', '#bff8ff');
    g.shadowBlur = 0;
    // 게임 장면 사진
    const ph = { x: 90, y: 236, w: 900, h: 520 };
    rr(g, ph.x - 10, ph.y - 10, ph.w + 20, ph.h + 20, 22); g.fillStyle = '#ff6a1a'; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 14); g.clip(); g.fillStyle = '#000'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    try {
      // 카드용 한 장: 간판까지 다 보이게 정면 조금 위에서
      const cam = RND.camera, op = cam.position.clone(), oq = cam.quaternion.clone(), of = cam.fov, oa = cam.aspect;
      cam.aspect = o.cv.width / o.cv.height; cam.fov = 50; cam.updateProjectionMatrix();
      cam.position.set(0.7, 2.15, 2.5); cam.lookAt(0, 2.35, PHY.hoop.z * 0.7);
      RND.renderer.render(RND.scene, cam);
      const sc = o.cv, sw = sc.width, sh = sc.height, k = Math.max(ph.w / sw, ph.h / sh), dw = sw * k, dh = sh * k;
      g.drawImage(sc, ph.x + (ph.w - dw) / 2, ph.y + (ph.h - dh) / 2, dw, dh);
      cam.position.copy(op); cam.quaternion.copy(oq); cam.fov = of; cam.aspect = oa; cam.updateProjectionMatrix();
    } catch (e) {}
    g.restore();
    // 코트 마루 판
    const P = { x: 70, y: 800, w: 940, h: 400 };
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
    rr(g, P.x, P.y, P.w, P.h, 26); g.fillStyle = '#e2b874'; g.fill(); g.restore();
    g.save(); rr(g, P.x, P.y, P.w, P.h, 26); g.clip();
    for (let x = P.x; x < P.x + P.w; x += 60) { g.fillStyle = 'rgba(90,50,10,.25)'; g.fillRect(x, P.y, 2, P.h); }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(150,95,40,.08)'; g.fillRect(P.x + Math.random() * P.w, P.y + Math.random() * P.h, 2, 30 + Math.random() * 60); }
    g.restore();
    rr(g, P.x + 14, P.y + 14, P.w - 28, P.h - 28, 18); g.lineWidth = 8; g.strokeStyle = '#ff6a1a'; g.stroke();
    // 칭호
    const tt = title(o.tot, o.acc);
    txt(g, tt, W / 2, P.y + 78, fit(g, tt, 76, 'Ttl, sans-serif', 820), '#fff', '#5a2a0a', 12);
    // 숫자 넷
    const cells = [['STAR', o.tot + ' / 90'], [L('성공률', 'ACCURACY'), o.acc + '%'], [L('최고 연속 골', 'BEST STREAK'), String(S.bestStreak)], ['TICKET', String(S.tickets)]];
    cells.forEach((cc, i) => {
      const cx = P.x + P.w * (i % 2 ? 0.74 : 0.26), cy = P.y + 175 + Math.floor(i / 2) * 120;
      txt(g, cc[0], cx, cy - 28, '30px Ui, sans-serif', '#6a3a14');
      txt(g, cc[1], cx, cy + 22, '58px Led, monospace', '#c2410c');
    });
    // 한 줄 + 주소
    txt(g, L('너는 몇 판까지 갈 수 있을까?', 'How far can you go?'), W / 2, 1258, '44px Ui, sans-serif', '#fff3d6', '#2a0a04', 10);
    const lg = await logo();
    g.font = '36px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 62, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.filter = 'invert(1)'; g.drawImage(lg, bx, 1306, lw, 30); g.filter = 'none'; } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1322, '36px Ui, sans-serif', '#fff', null, 0, 'left');
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () {
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = 'arcade-hoops-champion.png'; document.body.appendChild(a); a.click(); a.remove();
  };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname + (window.EN ? '?lang=en' : '');
    const text = L('오락실 농구 30판 다 깼다! 너도 해 봐', 'I beat all 30 stages of Arcade Hoops! Try it') + (link ? '\n' + link : '');
    if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(text); } catch (e) {}
  };
})();
