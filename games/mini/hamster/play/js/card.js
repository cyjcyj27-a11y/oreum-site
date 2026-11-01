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
    if (st.deaths === 0) return L('한 번도 안 잡힌 햄스터', 'NEVER CAUGHT');
    if (st.banked >= 220) return L('볼주머니 부자', 'CHEEK TYCOON');
    if (st.time < 540) return L('번개 햄스터', 'LIGHTNING HAMSTER');
    if (st.deaths >= 40) return L('칠전팔기 햄스터', 'NEVER GIVES UP');
    return L('해바라기 밭에 닿은 햄스터', 'SUNFLOWER FINDER');
  };
  function logo() {
    // file:// 에서는 그림이 캔버스를 더럽혀 저장이 막히니 먼저 시험해 본다
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function () {
    const st = GAME.S.save.trip, b = GAME.breed();
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('30px Ui')]); } catch (e) {}
    // 바탕: 크림 톱밥 + 철망 살
    g.fillStyle = '#fff6e4'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(200,170,120,.35)'; for (let i = 0; i < 500; i++) { g.save(); g.translate(Math.random() * W, Math.random() * H); g.rotate(Math.random() * 3); g.fillRect(-7, -2, 14, 4); g.restore(); }
    g.fillStyle = 'rgba(255,255,255,.8)'; for (let x = 20; x < W; x += 44) g.fillRect(x, 0, 4, H);
    const tt = L('햄스런', 'HAMSRUN');
    const tf = fit(g, tt, 128, 'Ttl, Ui, sans-serif', 940);
    for (let k = 6; k >= 1; k--) txt(g, tt, W / 2, 108 + k * 2.4, tf, '#d8661a', '#4a2a14', 18);
    txt(g, tt, W / 2, 108, tf, '#ffb04a', '#4a2a14', 18);
    txt(g, 'THE END', W / 2, 212, '58px Ttl, Ui, sans-serif', '#7fe0c8', '#4a2a14', 12);
    // 장면 사진
    const ph = { x: 90, y: 264, w: 900, h: 520 };
    rr(g, ph.x - 14, ph.y - 14, ph.w + 28, ph.h + 28, 30); g.fillStyle = '#5fd0b8'; g.fill();
    rr(g, ph.x - 7, ph.y - 7, ph.w + 14, ph.h + 14, 24); g.fillStyle = '#4a2a14'; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 18); g.clip(); g.fillStyle = '#9ad66a'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    try {
      const r = WORLD.renderer, cam = WORLD.camera, pr = r.getPixelRatio();
      r.setPixelRatio(1); r.setSize(1200, 693, false); cam.aspect = 1200 / 693; cam.updateProjectionMatrix();
      const z0 = WORLD.zoom; WORLD.zoom = 0.5; WORLD.setCam(GAME.H.x, GAME.H.row - 0.5); WORLD.render(); WORLD.zoom = z0;
      const sc = r.domElement, k = Math.max(ph.w / sc.width, ph.h / sc.height);
      g.drawImage(sc, ph.x + (ph.w - sc.width * k) / 2, ph.y + (ph.h - sc.height * k) / 2, sc.width * k, sc.height * k);
      r.setPixelRatio(pr); WORLD.resize();
    } catch (e) {}
    g.restore();
    // 칭호 + 숫자 판(우드칩)
    const P = { x: 70, y: 820, w: 940, h: 400 };
    rr(g, P.x, P.y + 10, P.w, P.h, 36); g.fillStyle = '#8a5a2a'; g.fill();
    rr(g, P.x, P.y, P.w, P.h, 36); g.fillStyle = '#f0d6a4'; g.fill();
    g.fillStyle = 'rgba(184,136,74,.45)'; for (let i = 0; i < 160; i++) { g.save(); g.translate(P.x + 20 + Math.random() * (P.w - 40), P.y + 20 + Math.random() * (P.h - 40)); g.rotate(Math.random() * 3); g.fillRect(-6, -1.5, 12, 3); g.restore(); }
    const name = C.title(st);
    txt(g, name, W / 2, P.y + 64, fit(g, name, 70, 'Ttl, Ui, sans-serif', 860), '#ffffff', '#4a2a14', 14);
    const cells = [[L('걸린 시간', 'TIME'), mmss(st.time)], [L('먹은 씨', 'SEEDS EATEN'), String(st.eaten)], [L('은신처에 쏟은 씨', 'SEEDS STORED'), String(st.banked)], [L('잡힌 횟수', 'CAUGHT'), String(st.deaths)]];
    cells.forEach((cc, i) => {
      const cx = P.x + P.w * (i % 2 ? 0.74 : 0.26), cy = P.y + 175 + Math.floor(i / 2) * 120;
      txt(g, cc[0], cx, cy - 32, '32px Ui, sans-serif', '#4a2a14');
      txt(g, cc[1], cx, cy + 20, '62px Ttl, Ui, sans-serif', '#ffd23a', '#4a2a14', 11);
    });
    txt(g, DATA.name(b) + L(' 햄스터', ' HAMSTER'), W / 2, P.y + P.h - 30, '32px Ui, sans-serif', '#8a5a2a');
    txt(g, L('너는 몇 번 잡히고 해바라기 밭에 닿을까?', 'How many catches to reach the sunflowers?'), W / 2, 1262, fit(g, L('너는 몇 번 잡히고 해바라기 밭에 닿을까?', 'How many catches to reach the sunflowers?'), 40, 'Ui, sans-serif', 960), '#4a2a14');
    const lg = await logo();
    g.font = '36px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 62, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.drawImage(lg, bx, 1302, lw, 30); } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1318, '36px Ui, sans-serif', '#4a2a14', null, 0, 'left');
    shareLine = L('햄스런 해바라기 밭 도착! ' + mmss(st.time) + ', 씨 ' + st.eaten + '개, 잡힌 횟수 ' + st.deaths + '번 · ' + name,
      'Hamsrun: reached the sunflowers in ' + mmss(st.time) + ', ' + st.eaten + ' seeds, caught ' + st.deaths + ' times · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'hamster-end.png'; document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: L('햄스런', 'Hamsrun'), text: shareLine, url: link || undefined }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); UI.toast(L('주소를 복사했습니다', 'Link copied')); } catch (e) {}
  };
})();
