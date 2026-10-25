// 엔딩 결과 카드: 1080x1350 한 장(저장 = 그림, 공유 = 글+주소).
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
  function fit(g, s, px, fam, maxW) { g.font = px + 'px ' + fam; while (px > 18 && g.measureText(s).width > maxW) { px -= 2; g.font = px + 'px ' + fam; } return g.font; }
  function mmss(t) { t = Math.round(t); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); }
  C.title = function (st) {
    if (st.retry === 0) return L('한 번도 안 무너진 장인', 'NEVER FELL');
    if (st.best >= 20) return L('PERFECT 장인', 'PERFECT MASTER');
    if (st.perfect >= st.floors * 0.45) return L('손끝 장인', 'STEADY HANDS');
    if (st.retry >= 30) return L('포기를 모르는 사람', 'NEVER GIVES UP');
    return L('달까지 쌓은 사람', 'MOON BUILDER');
  };
  function logo() {
    // file:// 에서는 그림이 캔버스를 더럽혀 저장이 막히니 먼저 시험해 본다
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function () {
    const st = GAME.S.stats;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('30px Ui')]); } catch (e) {}
    // 바탕: 밤하늘 → 보라, 별 점
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0e1238'); bg.addColorStop(1, '#3a2a78'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = ['#ffffff', '#fff2a0', '#a8e8ff', '#ffb8f0'][i % 4]; g.globalAlpha = 0.4 + Math.random() * 0.6; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2.4, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const tt = L('쿠키쌓기', 'COOKIE STACK');
    const tf = fit(g, tt, 140, 'Ttl, Ui, sans-serif', 900);
    // 점토 두께: 아래로 겹겹이
    for (let k = 8; k >= 1; k--) txt(g, tt, W / 2, 112 + k * 2.2, tf, '#a0186a', '#3a1a5a', 16);
    txt(g, tt, W / 2, 112, tf, '#ff4fb8', '#3a1a5a', 16);
    txt(g, 'THE END · ' + DATA.M().name, W / 2, 214, '54px Ttl, Ui, sans-serif', '#ffe62e', '#3a1a5a', 10);
    // 장면 사진
    const ph = { x: 90, y: 262, w: 900, h: 520 };
    rr(g, ph.x - 14, ph.y - 14, ph.w + 28, ph.h + 28, 30); g.fillStyle = '#ffe62e'; g.fill();
    rr(g, ph.x - 7, ph.y - 7, ph.w + 14, ph.h + 14, 24); g.fillStyle = '#3a1a5a'; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 18); g.clip(); g.fillStyle = '#000'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    // 카드용 가로 사진: 잠깐 캔버스를 가로로 바꿔 달과 탑 꼭대기를 함께 찍는다
    try {
      const r = RND.renderer, pr = r.getPixelRatio();
      r.setPixelRatio(1); r.setSize(1200, 693, false); RND.camera.aspect = 1200 / 693; RND.camera.updateProjectionMatrix(); RND.aspect = RND.camera.aspect;
      RND.setCam(DATA.TOP + 1.5, 2.3, 0.15); RND.render();
      const sc = r.domElement, k = Math.max(ph.w / sc.width, ph.h / sc.height);
      g.drawImage(sc, ph.x + (ph.w - sc.width * k) / 2, ph.y + (ph.h - sc.height * k) / 2, sc.width * k, sc.height * k);
      r.setPixelRatio(pr); RND.resize();
    } catch (e) {}
    g.restore();
    // 칭호 + 숫자 판(연보라 실리콘 매트)
    const P = { x: 70, y: 820, w: 940, h: 400 };
    rr(g, P.x, P.y + 10, P.w, P.h, 40); g.fillStyle = '#2a1a4a'; g.fill();
    rr(g, P.x, P.y, P.w, P.h, 40); g.fillStyle = '#d8c8ff'; g.fill();
    g.fillStyle = 'rgba(90,60,160,.22)'; for (let y = P.y + 30; y < P.y + P.h - 20; y += 30) for (let x = P.x + 30; x < P.x + P.w - 20; x += 30) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
    const name = C.title(st);
    txt(g, name, W / 2, P.y + 68, fit(g, name, 74, 'Ttl, Ui, sans-serif', 860), '#ffffff', '#3a1a5a', 14);
    const cells = [[L('쌓은 층', 'FLOORS'), String(st.floors)], ['PERFECT', String(st.perfect)], [L('최고 연속', 'BEST COMBO'), String(st.best)], [L('무너진 횟수', 'FALLS'), String(st.retry)]];
    cells.forEach((cc, i) => {
      const cx = P.x + P.w * (i % 2 ? 0.74 : 0.26), cy = P.y + 175 + Math.floor(i / 2) * 118;
      txt(g, cc[0], cx, cy - 30, '34px Ttl, Ui, sans-serif', '#3a1a5a');
      txt(g, cc[1], cx, cy + 22, '64px Ttl, Ui, sans-serif', '#ffe62e', '#3a1a5a', 11);
    });
    txt(g, L('걸린 시간 ', 'TIME ') + mmss(st.time), W / 2, P.y + P.h - 30, '34px Ui, sans-serif', '#3a1a5a');
    txt(g, L('너는 몇 번 무너지고 달에 닿을까?', 'How many falls to reach the moon?'), W / 2, 1262, '42px Ui, sans-serif', '#ffffff');
    const lg = await logo();
    g.font = '36px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 62, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.drawImage(lg, bx, 1302, lw, 30); } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1318, '36px Ui, sans-serif', '#ffffff', null, 0, 'left');
    shareLine = L('쿠키쌓기 ' + DATA.M().name + ' 달까지 ' + st.floors + '층! PERFECT ' + st.perfect + '번, 무너진 횟수 ' + st.retry + '번 · ' + name, 'Cookie Stack ' + DATA.M().name + ': ' + st.floors + ' floors to the moon! ' + st.perfect + ' PERFECT, ' + st.retry + ' falls · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'cookiestack-end.png'; document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: L('쿠키쌓기', 'Cookie Stack'), text: shareLine, url: link || undefined }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); UI.toast(L('복사됨', 'COPIED')); } catch (e) {}
  };
})();
