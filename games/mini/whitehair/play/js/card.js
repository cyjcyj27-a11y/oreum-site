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
  function fit(g, s, px, fam, maxW) { g.font = px + 'px ' + fam; while (px > 18 && g.measureText(s).width > maxW) { px -= 2; g.font = px + 'px ' + fam; } return g.font; }
  function title(st, ratio) {
    if (st.blacks === 0) return L('털끝 하나 안 건드린 장인', 'Untouched Master');
    if (ratio >= 0.85) return L('동네 족집게 1등', 'Best Tweezers in Town');
    if (ratio >= 0.6) return L('흰머리 사냥꾼', 'White Hair Hunter');
    return L('초보 족집게', 'Rookie Plucker');
  }
  function logo() {
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { const t = document.createElement('canvas'); t.width = t.height = 4; t.getContext('2d').drawImage(im, 0, 0, 4, 4); t.toDataURL(); res(im); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = 'assets/logo-oreum.svg'; });
  }
  C.make = async function () {
    const S = GAME.S, st = S.stats;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    try { await Promise.all([document.fonts.load('900 60px Ttl'), document.fonts.load('30px Ui')]); } catch (e) {}
    // 바탕: 이발소 사인볼 줄무늬 테 + 거울 판
    g.fillStyle = '#f7f5f0'; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.rect(34, 34, W - 68, H - 68); g.clip('evenodd');
    for (let i = -H; i < W + H; i += 80) { g.fillStyle = '#d4302a'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 20, 0); g.lineTo(i + 20 - H * 0.6, H); g.lineTo(i - H * 0.6, H); g.fill(); g.fillStyle = '#2a58b8'; g.beginPath(); g.moveTo(i + 40, 0); g.lineTo(i + 60, 0); g.lineTo(i + 60 - H * 0.6, H); g.lineTo(i + 40 - H * 0.6, H); g.fill(); }
    g.restore();
    const bg = g.createLinearGradient(0, 34, 0, H - 34); bg.addColorStop(0, '#f4f8fa'); bg.addColorStop(1, '#d3e0e7'); g.fillStyle = bg; g.fillRect(34, 34, W - 68, H - 68);
    g.strokeStyle = '#6d757d'; g.lineWidth = 6; g.strokeRect(37, 37, W - 74, H - 74);
    // 간판 제목
    const tt = L('흰머리뽑기방', 'WHITE HAIR SHOP');
    rr(g, 120, 70, 840, 170, 22); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#d03a30'; g.stroke();
    txt(g, tt, W / 2, 158, fit(g, tt, 120, '900 Ttl, Ui, sans-serif'.replace('900 ', ''), 760).replace(/^/, '900 '), '#d4302a');
    txt(g, 'THE END', W / 2, 290, '900 54px Ttl, sans-serif', '#1d2430');
    // 장면 사진
    const ph = { x: 110, y: 340, w: 860, h: 470 };
    rr(g, ph.x - 12, ph.y - 12, ph.w + 24, ph.h + 24, 26); g.fillStyle = '#6d757d'; g.fill();
    g.save(); rr(g, ph.x, ph.y, ph.w, ph.h, 16); g.clip(); g.fillStyle = '#000'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    try { RND.render(); const sc = RND.renderer.domElement, k = Math.max(ph.w / sc.width, ph.h / sc.height); g.drawImage(sc, ph.x + (ph.w - sc.width * k) / 2, ph.y + (ph.h - sc.height * k) / 2, sc.width * k, sc.height * k); } catch (e) {}
    g.restore();
    // 칭호 + 숫자
    const ratio = st.plucked ? st.perfect / st.plucked : 0;
    const name = title(st, ratio);
    txt(g, name, W / 2, 878, fit(g, name, 72, 'Ttl, Ui, sans-serif', 880).replace(/^/, '900 '), '#d4302a', '#ffffff', 12);
    const cells = [[L('뽑은 흰머리', 'WHITE HAIRS'), st.plucked.toLocaleString()], [L('뿌리째', 'ROOT INTACT'), Math.round(ratio * 100) + '%'], [L('번 코인', 'COINS EARNED'), st.earned.toLocaleString()], [L('검은 머리 실수', 'BLACK HAIRS'), String(st.blacks)]];
    cells.forEach((cc, i) => {
      const cx = W * (i % 2 ? 0.72 : 0.28), cy = 990 + Math.floor(i / 2) * 120;
      txt(g, cc[0], cx, cy - 30, '30px Ui, sans-serif', '#3a4450');
      txt(g, cc[1], cx, cy + 20, '900 60px Ttl, sans-serif', '#1d2430');
    });
    txt(g, L('너는 몇 가닥 뽑을 수 있을까?', 'How many can you pluck?'), W / 2, 1238, '38px Ui, sans-serif', '#1d2430');
    const lg = await logo();
    g.font = '34px Ui, sans-serif'; const sw2 = g.measureText('oreumgames.com').width, lw = 58, bx = W / 2 - (sw2 + lw + 14) / 2;
    if (lg) { try { g.drawImage(lg, bx, 1276, lw, 28); } catch (e) {} }
    txt(g, 'oreumgames.com', bx + lw + 14, 1291, '34px Ui, sans-serif', '#1d2430', null, 0, 'left');
    shareLine = L('흰머리뽑기방 손님 25명 끝! 흰머리 ' + st.plucked + '가닥, 뿌리째 ' + Math.round(ratio * 100) + '% · ' + name, 'White Hair Shop cleared! ' + st.plucked + ' white hairs, ' + Math.round(ratio * 100) + '% root intact · ' + name);
    try { url = c.toDataURL('image/png'); } catch (e) { url = null; }
    return url;
  };
  C.save = function () { if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'whitehair-end.png'; document.body.appendChild(a); a.click(); a.remove(); };
  C.share = function () {
    const link = location.protocol === 'file:' ? '' : location.origin + location.pathname.replace(/play\/?(index\.html)?$/, '') + (window.EN ? '?lang=en' : '');
    if (navigator.share) { navigator.share({ title: L('흰머리뽑기방', 'White Hair Shop'), text: shareLine, url: link || undefined }).catch(() => {}); return 'shared'; }
    try { navigator.clipboard.writeText(shareLine + (link ? '\n' + link : '')); } catch (e) {}
    return 'copied';
  };
})();
