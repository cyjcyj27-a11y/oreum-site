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
  function title(st) {
    if (st.ambul === 0) return L('무사고 전설', 'FLAWLESS LEGEND');
    if (st.stings < 40) return L('말벌 사냥꾼', 'HORNET HUNTER');
    if (st.kills + st.nets > 600) return L('스프레이 장인', 'SPRAY MASTER');
    if (st.ambul >= 5) return L('불사조 대원', 'PHOENIX RESPONDER');
    return L('동네 영웅', 'LOCAL HERO');
  }
  function logo() {
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function () {
    const S = GAME.S, st = S.stats;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('60px TtlF'), document.fonts.load('30px Ui')]); } catch (e) {}
    // 바탕: 크림 → 연두(점토 무대)
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fbe9c8'); bg.addColorStop(1, '#cfe3a8'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(120,90,50,.06)'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 0, 7); g.fill(); }
    // 제목(부푼 글씨 두 겹)
    const tt = L('말벌아저씨', 'MR. HORNET');
    g.font = fit(g, tt, 128, 'TtlF, Ui, sans-serif', 900);
    txt(g, tt, W / 2, 104, g.font, '#ffcf1f');
    txt(g, tt, W / 2, 104, g.font.replace('TtlF', 'Ttl'), '#3a2210');
    txt(g, 'THE END', W / 2, 198, '52px Ui, sans-serif', '#3a2210');
    // 장면 사진
    const ph = { x: 90, y: 246, w: 900, h: 500 };
    rr(g, ph.x - 12, ph.y - 12, ph.w + 24, ph.h + 24, 26); g.fillStyle = '#3a2210'; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 16); g.clip(); g.fillStyle = '#000'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    try { RND.render(); const sc = RND.renderer.domElement, k = Math.max(ph.w / sc.width, ph.h / sc.height); g.drawImage(sc, ph.x + (ph.w - sc.width * k) / 2, ph.y + (ph.h - sc.height * k) / 2, sc.width * k, sc.height * k); } catch (e) {}
    g.restore();
    // 칭호 + 숫자
    const P = { x: 70, y: 790, w: 940, h: 420 };
    rr(g, P.x, P.y, P.w, P.h, 30); g.fillStyle = '#b59a72'; g.fill();
    g.save(); rr(g, P.x, P.y, P.w, P.h, 30); g.clip();
    const cols = ['#c9b08a', '#a88a62', '#d2bc98', '#b59a72'];
    for (let y = P.y, i = 0; y < P.y + P.h; i++) { const h = 14 + (i * 7) % 12; g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(P.x, y); for (let x = P.x; x <= P.x + P.w; x += 20) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 4); g.lineTo(P.x + P.w, y + h + 4); g.lineTo(P.x, y + h + 4); g.fill(); y += h; }
    g.restore();
    const name = title(st);
    txt(g, name, W / 2, P.y + 70, fit(g, name, 76, 'TtlF, Ui, sans-serif', 860), '#fff6d8', '#3a2210', 12);
    const dexN = Object.keys(DATA.SP).filter((k) => S.dex[k]).length, giftN = Object.keys(S.gifts).length;
    const cells = [[L('잡은 벌', 'WASPS'), String(st.kills + st.nets)], [L('뗀 벌집', 'NESTS'), String(st.nests)], [L('쏘인 횟수', 'STINGS'), String(st.stings)], [L('구급차', 'AMBULANCE'), String(st.ambul)]];
    cells.forEach((cc, i) => {
      const cx = P.x + P.w * (i % 2 ? 0.74 : 0.26), cy = P.y + 175 + Math.floor(i / 2) * 120;
      txt(g, cc[0], cx, cy - 30, '32px Ui, sans-serif', '#3a2210');
      txt(g, cc[1], cx, cy + 22, '62px Ui, sans-serif', '#fff', '#3a2210', 10);
    });
    txt(g, L('도감 ', 'DEX ') + dexN + '/' + Object.keys(DATA.SP).length + '  ·  ' + L('선물 ', 'GIFTS ') + giftN + '/20', W / 2, P.y + P.h - 34, '34px Ui, sans-serif', '#3a2210');
    txt(g, L('너는 몇 번 쏘이고 끝낼까?', 'How many stings will it take you?'), W / 2, 1262, '42px Ui, sans-serif', '#3a2210');
    const lg = await logo();
    g.font = '36px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 62, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.drawImage(lg, bx, 1302, lw, 30); } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1318, '36px Ui, sans-serif', '#3a2210', null, 0, 'left');
    shareLine = L('말벌아저씨 20번 출동 끝! 잡은 벌 ' + (st.kills + st.nets) + '마리, 쏘인 횟수 ' + st.stings + '번 · ' + name, 'Mr. Hornet cleared! ' + (st.kills + st.nets) + ' wasps, ' + st.stings + ' stings · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = L('malbeol-ajeossi-end.png', 'mr-hornet-end.png'); document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: L('말벌아저씨', 'Mr. Hornet'), text: shareLine, url: link || undefined }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); } catch (e) {}
  };
})();
