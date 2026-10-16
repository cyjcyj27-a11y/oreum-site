// 결과 카드: 판이 끝나면 손님의 브라우저 안에서 1080x1350 그림 한 장을 그려 공유·저장한다.
// 그림은 서버에 올라가지 않는다. 공유창(navigator.share)으로 바로 가고, 안 되는 기기에서는 파일로 저장된다.
(function () {
  'use strict';
  var PI2 = Math.PI * 2, W2 = 1080, H2 = 1350, NAVY = '#1f3a7a', DEEP = '#14285a';
  var NAMES = {
    ko: ['콩', '경단', '꿀떡', '쑥떡', '송편', '인절미', '무지개떡', '딸기찹쌀떡', '호박떡', '백설기', '보름달'],
    en: ['Bean', 'Dango', 'Honey Cake', 'Mugwort Cake', 'Songpyeon', 'Injeolmi', 'Rainbow Cake', 'Strawberry Mochi', 'Pumpkin Cake', 'Snow Cake', 'Full Moon']
  };
  // 그 판에서 만든 제일 큰 떡으로 정하는 칭호
  var TITLES = {
    ko: ['콩알 초보', '경단 초보', '꿀떡 견습', '쑥떡 견습', '송편 솜씨', '인절미 솜씨', '무지개떡 장인', '찹쌀떡 장인', '호박떡 명인', '백설기 명인', '보름달 떡방앗간'],
    en: ['Bean Rookie', 'Dango Rookie', 'Honey Apprentice', 'Mugwort Apprentice', 'Songpyeon Hand', 'Injeolmi Hand', 'Rainbow Artisan', 'Mochi Artisan', 'Pumpkin Master', 'Snow Cake Master', 'Full Moon Mill']
  };
  var L = {
    ko: { title: '달떡 합치기', score: '점수', best: '최고 기록', today: '오늘 최고', moon: '보름달', top: '제일 큰 떡', newb: 'NEW', hook: '너는 몇 점까지 합칠 수 있을까?', site: 'oreumgames.com', cnt: function (n) { return n + '개'; } },
    en: { title: 'Moon Mochi Merge', score: 'SCORE', best: 'BEST', today: 'TODAY', moon: 'FULL MOON', top: 'BIGGEST', newb: 'NEW', hook: 'How far can you merge?', site: 'oreumgames.com', cnt: function (n) { return 'x ' + n; } }
  };
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function rrect(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function text(c, s, x, y, font, fill, stroke, lw, align) {
    c.font = font; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(s, x, y); }
    c.fillStyle = fill; c.fillText(s, x, y);
  }
  // 글이 칸보다 길면 글자를 줄인다
  function fit(c, s, font, maxW) {
    var m = /^(\d+)px(.*)$/.exec(font), px = +m[1];
    c.font = font;
    while (px > 18 && c.measureText(s).width > maxW) { px -= 2; c.font = px + 'px' + m[2]; }
    return c.font;
  }
  var logoP = null;
  function loadLogo() {
    if (logoP) return logoP;
    logoP = fetch('assets/logo-oreum.svg').then(function (r) { return r.text(); }).then(function (t) {
      return new Promise(function (res) {
        var im = new Image(), u = URL.createObjectURL(new Blob([t.replace(/#16211a/g, '#ffffff')], { type: 'image/svg+xml' }));
        im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = u;
      });
    }).catch(function () { return null; });
    return logoP;
  }
  function moonIcon(c, x, y, r) {
    var g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff7c0'); g.addColorStop(0.55, '#ffe36a'); g.addColorStop(1, '#e0a820');
    c.beginPath(); c.arc(x, y, r, 0, PI2); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(2, r * 0.12); c.strokeStyle = DEEP; c.stroke();
  }
  function porcelain(c, x, y, w, h, r) {
    // 청화백자: 남색 두께, 남색 테, 흰 유약, 안쪽 청화 줄
    c.save();
    c.shadowColor = 'rgba(0,0,30,.45)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    rrect(c, x, y + 14, w, h, r); c.fillStyle = DEEP; c.fill();
    c.restore();
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f1f5fa'); g.addColorStop(1, '#d6deea');
    rrect(c, x, y, w, h, r); c.fillStyle = g; c.fill(); c.lineWidth = 9; c.strokeStyle = NAVY; c.stroke();
    rrect(c, x + 16, y + 16, w - 32, h - 32, r - 12); c.lineWidth = 3; c.strokeStyle = 'rgba(31,58,122,.32)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x + 30, y + 10, w - 60, 6);
  }

  function draw(c, X, logo) {
    var G = X.G, EN = X.EN, T = EN ? L.en : L.ko, NM = EN ? NAMES.en : NAMES.ko, TT = EN ? TITLES.en : TITLES.ko;
    var top = Math.max(1, Math.min(11, G.top || 1)), i, rnd = rng(20261016);
    var TK = 'Tokki, Ria, sans-serif', RIA = 'Ria, sans-serif';
    // 밤하늘
    var sky = c.createLinearGradient(0, 0, 0, H2);
    sky.addColorStop(0, '#0f1440'); sky.addColorStop(0.42, '#2b2468'); sky.addColorStop(0.78, '#4d3480'); sky.addColorStop(1, '#1a1448');
    c.fillStyle = sky; c.fillRect(0, 0, W2, H2);
    for (i = 0; i < 160; i++) { c.beginPath(); c.arc(rnd() * W2, rnd() * H2, 1 + rnd() * 2.4, 0, PI2); c.fillStyle = 'rgba(255,250,225,' + (0.25 + rnd() * 0.6) + ')'; c.fill(); }
    // 큰 달빛(오른쪽 위)
    var mx = 975, my = 118, mg = c.createRadialGradient(mx, my, 40, mx, my, 420);
    mg.addColorStop(0, 'rgba(255,240,180,.34)'); mg.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = mg; c.fillRect(mx - 420, my - 420, 840, 840);
    var md = c.createRadialGradient(mx - 28, my - 30, 10, mx, my, 96);
    md.addColorStop(0, '#fffbe0'); md.addColorStop(1, '#f2dc98');
    c.beginPath(); c.arc(mx, my, 84, 0, PI2); c.fillStyle = md; c.fill();
    c.fillStyle = 'rgba(200,170,90,.28)';
    [[30, -22, 17], [-36, 26, 13], [18, 44, 22], [-20, -48, 9]].forEach(function (p) { c.beginPath(); c.arc(mx + p[0], my + p[1], p[2], 0, PI2); c.fill(); });
    // 제목
    text(c, T.title, 540, 92, (EN ? 78 : 92) + 'px ' + TK, '#fff3b0', DEEP, 20);
    // 판 사진: 게임 화면에서 됫박 아랫부분을 잘라 온다(제일 큰 떡들이 쌓인 곳)
    var ph = { x: 130, y: 150, w: 820, h: 560 };
    var sw = (X.BR - X.BL + 36) * X.SS, sx = (X.BL - 18) * X.SS + X.ox * X.dpr;
    var sh = ph.h * sw / ph.w, sy = (X.floorY + 24) * X.SS - sh;
    if (sy < 0) { sh += sy; sy = 0; }
    c.save();
    c.shadowColor = 'rgba(0,0,30,.55)'; c.shadowBlur = 36; c.shadowOffsetY = 14;
    rrect(c, ph.x, ph.y, ph.w, ph.h, 28); c.fillStyle = '#0f1440'; c.fill();
    c.restore();
    c.save(); rrect(c, ph.x, ph.y, ph.w, ph.h, 28); c.clip();
    try { c.drawImage(X.cv, sx, sy, sw, sh, ph.x, ph.y, ph.w, ph.h); } catch (e) {}
    c.restore();
    rrect(c, ph.x, ph.y, ph.w, ph.h, 28); c.lineWidth = 8; c.strokeStyle = '#e9b673'; c.stroke();
    rrect(c, ph.x + 4, ph.y + 4, ph.w - 8, ph.h - 8, 24); c.lineWidth = 3; c.strokeStyle = '#4a2a10'; c.stroke();
    // 접시 패널
    var P = { x: 70, y: ph.y + ph.h - 40, w: 940, h: 500 };
    porcelain(c, P.x, P.y, P.w, P.h, 34);
    // 제일 큰 떡(오른쪽 위에 스티커처럼)
    var sp = X.SPR[top] && X.SPR[top][0];
    if (sp) {
      var rad = 118, k = rad / X.R[top - 1], cx = P.x + P.w - 150, cy = P.y + 30;
      c.save(); c.shadowColor = 'rgba(0,0,30,.4)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
      c.drawImage(sp, cx - sp.hw * k, cy - sp.hw * k, sp.hw * 2 * k, sp.hw * 2 * k); c.restore();
      text(c, T.top, cx, cy + rad + 24, '26px ' + RIA, 'rgba(31,58,122,.7)');
      text(c, NM[top - 1], cx, cy + rad + 60, fit(c, NM[top - 1], '36px ' + RIA, 270), NAVY);
    }
    // 점수
    var lx = P.x + 56;
    text(c, T.score, lx, P.y + 54, '30px ' + RIA, 'rgba(31,58,122,.7)', null, 0, 'left');
    var sc = String(G.score), sf = fit(c, sc, '168px ' + TK, 560);
    text(c, sc, lx - 4, P.y + 178, sf, '#f2b01e', DEEP, 18, 'left');
    if (G.newBest) {
      // NEW 딱지는 "점수" 글자 옆(점수가 여섯 자리여도 떡 스티커와 안 겹친다)
      c.font = '30px ' + RIA; var lw0 = c.measureText(T.score).width;
      c.save(); c.translate(lx + lw0 + 62, P.y + 52); c.rotate(-0.12);
      rrect(c, -46, -21, 92, 42, 12); c.fillStyle = '#d6480c'; c.fill(); c.lineWidth = 4; c.strokeStyle = DEEP; c.stroke();
      text(c, T.newb, 0, 2, '28px ' + RIA, '#fff'); c.restore();
    }
    // 칭호
    text(c, TT[top - 1], lx, P.y + 300, fit(c, TT[top - 1], '54px ' + RIA, 560), NAVY, null, 0, 'left');
    // 가름선
    c.fillStyle = 'rgba(31,58,122,.25)'; c.fillRect(P.x + 50, P.y + 346, P.w - 100, 3);
    // 기록 셋
    var cols = [[T.best, String(G.best)], [T.today, String(G.today)], [T.moon, T.cnt(G.moons)]];
    for (i = 0; i < 3; i++) {
      var cxx = P.x + P.w * (0.5 + i) / 3, ly = P.y + 390, vy = P.y + 450;
      text(c, cols[i][0], cxx, ly, '28px ' + RIA, 'rgba(31,58,122,.7)');
      if (i === 2) { moonIcon(c, cxx - c.measureText(cols[i][1]).width * 0.5 - 32, vy, 22); }
      text(c, cols[i][1], cxx + (i === 2 ? 14 : 0), vy, fit(c, cols[i][1], (i === 2 ? '50px ' + RIA : '58px ' + TK), 260), i === 0 && G.newBest ? '#d6480c' : NAVY);
    }
    // 떡 도감 줄: 이 판에서 만든 떡까지
    var dy = 1228, cell = 86, x0 = 540 - cell * 5;
    for (i = 1; i <= 11; i++) {
      var cx2 = x0 + cell * (i - 1), r2 = 20 + i * 1.7;
      if (i <= top && X.SPR[i]) { var s2 = X.SPR[i][0], k2 = r2 / X.R[i - 1]; c.drawImage(s2, cx2 - s2.hw * k2, dy - s2.hw * k2, s2.hw * 2 * k2, s2.hw * 2 * k2); }
      else { c.beginPath(); c.arc(cx2, dy, r2, 0, PI2); c.fillStyle = 'rgba(195,205,221,.35)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(142,154,184,.7)'; c.stroke(); text(c, '?', cx2, dy + 1, Math.round(r2 * 1.1) + 'px ' + RIA, 'rgba(255,255,255,.55)'); }
    }
    // 보는 사람에게 던지는 한 줄 + 주소
    text(c, T.hook, 540, 1290, (EN ? 42 : 44) + 'px ' + RIA, '#fff3b0', DEEP, 12);
    c.font = '34px ' + RIA; var sw2 = c.measureText(T.site).width, lw = 58, gap = 14, bx = 540 - (sw2 + lw + gap) / 2;
    if (logo) c.drawImage(logo, bx, 1329 - 14, lw, 28);
    text(c, T.site, bx + lw + gap, 1330, '34px ' + RIA, '#fff', null, 0, 'left');
  }

  var fontsP = null;
  function ready() {
    if (fontsP) return fontsP;
    var f = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('20px Tokki'), document.fonts.load('20px Ria')]) : Promise.resolve();
    fontsP = Promise.all([f.catch(function () {}), loadLogo()]).then(function (r) { return r[1]; });
    return fontsP;
  }
  function make() {
    return ready().then(function (logo) {
      var X = window.__dtCard(), c = document.createElement('canvas');
      c.width = W2; c.height = H2;
      draw(c.getContext('2d'), X, logo);
      return c;
    });
  }
  function toBlob(c) { return new Promise(function (r) { c.toBlob(r, 'image/png'); }); }
  function fname(X) { return (X.EN ? 'moon-mochi-' : 'daltteok-') + X.G.score + '.png'; }
  function download(b, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function save() {
    return make().then(function (c) { return toBlob(c).then(function (b) { download(b, fname(window.__dtCard())); }); });
  }
  function share() {
    return make().then(function (c) {
      return toBlob(c).then(function (b) {
        var X = window.__dtCard(), f = new File([b], fname(X), { type: 'image/png' });
        var msg = X.text + (X.url ? '\n' + X.url : '');
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          return navigator.share({ files: [f], text: msg }).catch(function (e) { if (!e || e.name !== 'AbortError') download(b, f.name); });
        }
        download(b, f.name);
      });
    });
  }
  window.DTC = { make: make, share: share, save: save };
})();
