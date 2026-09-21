/* 모에모에 메이드카페 — 그림 도우미·메이드 데이터·음식 그림 (캔버스 2D)
   캐릭터는 제미나이 스프라이트(js/sprites.js)로 그린다. 옛 코드 그림은 2026-09-21 사장님 지시로 전부 지웠다 */
(function () {
  'use strict';

  // ── 색 도우미 ─────────────────────────────────────────
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgb2hex(r, g, b) { const c = v => ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); return '#' + c(r) + c(g) + c(b); }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < .5) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  // 밝기·채도 조절 (dl: -1~1, ds: -1~1, dh: 색상 회전)
  function adj(col, dl, ds, dh) {
    const [r, g, b] = hex2rgb(col); let [h, s, l] = rgb2hsl(r, g, b);
    l = dl >= 0 ? l + (1 - l) * dl : l * (1 + dl); s = Math.max(0, Math.min(1, s + (ds || 0))); h = (h + (dh || 0) + 1) % 1;
    const o = hsl2rgb(h, s, Math.max(0, Math.min(1, l))); return rgb2hex(o[0], o[1], o[2]);
  }
  // 머리·옷 색 한 벌: 기본·그늘·짙은 그늘·하이라이트·윤곽선
  function palette(base) {
    return { b: base, s: adj(base, -.22, .05, -.02), d: adj(base, -.42, .08, -.04), h: adj(base, .42, -.1, .02), o: adj(base, -.62, .06, -.05) };
  }

  // ── 그리기 도우미 ─────────────────────────────────────
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  // 부드러운 닫힌 곡선 (Catmull-Rom → bezier)
  function smooth(ctx, pts, closed, tension) {
    const k = tension === undefined ? .5 : tension; const n = pts.length; if (n < 2) return;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    const P = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1x = p1[0] + (p2[0] - p0[0]) * k / 3, c1y = p1[1] + (p2[1] - p0[1]) * k / 3;
      const c2x = p2[0] - (p3[0] - p1[0]) * k / 3, c2y = p2[1] - (p3[1] - p1[1]) * k / 3;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }
  function fillStroke(ctx, fill, stroke, lw) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } }
  function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(s[0], s[1])); return g; }
  function rad(ctx, x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function seeded(n) { let s = (n * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  // ── 메이드 12명 ─────────────────────────────────────────
  // hair: 머리 모양, hc: 머리색, ec: 눈색, bang: 앞머리(straight/split/side/spiky), acc: 장식
  const MAIDS = [
    { id: 'yui', skill: { type: 'speed', v: 0.15, ko: '걸음 +15%', en: 'Walk +15%' }, hc2: '#8a5ad8', ahoge: 1, name: '유이', en: 'Yui', hair: 'twin', hc: '#3a3d66', ec: '#7a4bd8', bang: 'split', acc: 'ribbon', accc: '#e8305a', rar: 1, spd: 1.0, chm: 1.0, like: '딸기 파르페', hobby: '노래방', tag: '건강함', en_like: 'Strawberry parfait', en_hobby: 'Karaoke', en_tag: 'Cheerful', bday: '4/12' },
    { id: 'rin', skill: { type: 'cook', v: 0.25, ko: '조리 +25%', en: 'Cook +25%' }, hc2: '#3a6ab8', name: '린', en: 'Rin', hair: 'bob', hc: '#1f2230', ec: '#3a7bd8', bang: 'straight', acc: 'glasses', accc: '#e34', rar: 1, spd: 1.1, chm: .95, like: '블랙커피', hobby: '독서', tag: '쿨함', en_like: 'Black coffee', en_hobby: 'Reading', en_tag: 'Cool', bday: '11/3' },
    { id: 'mio', skill: { type: 'speed', v: 0.35, ko: '걸음 +35%', en: 'Walk +35%' }, hc2: '#e89a3a', ahoge: 1, name: '미오', en: 'Mio', hair: 'short', hc: '#8b4a2b', ec: '#d8862a', bang: 'spiky', acc: 'star', accc: '#ffd24a', rar: 1, spd: 1.25, chm: .9, like: '오므라이스', hobby: '축구', tag: '활발함', en_like: 'Omurice', en_hobby: 'Soccer', en_tag: 'Sporty', bday: '7/7' },
    { id: 'hana', skill: { type: 'patience', v: 0.3, ko: '손님 참을성 +30%', en: 'Patience +30%' }, hc2: '#ffc0d8', name: '하나', en: 'Hana', hair: 'buns', hc: '#d8607a', ec: '#2fb38a', bang: 'side', acc: 'flower', accc: '#ffd0e0', rar: 1, spd: .95, chm: 1.1, like: '단팥빵', hobby: '꽃꽂이', tag: '온화함', en_like: 'Red bean bun', en_hobby: 'Flowers', en_tag: 'Gentle', bday: '3/3' },
    { id: 'saki', skill: { type: 'cook', v: 0.45, ko: '조리 +45%', en: 'Cook +45%' }, hc2: '#f0c060', name: '사키', en: 'Saki', hair: 'pony', hc: '#c8853a', ec: '#c83a5a', bang: 'side', acc: 'none', accc: '#000', rar: 2, spd: 1.2, chm: 1.1, like: '카레', hobby: '검도', tag: '씩씩함', en_like: 'Curry', en_hobby: 'Kendo', en_tag: 'Brave', bday: '9/21' },
    { id: 'nene', skill: { type: 'tip', v: 0.4, ko: '하트 +40%', en: 'Hearts +40%' }, hc2: '#fff4d0', ahoge: 1, name: '네네', en: 'Nene', hair: 'lowtwin', hc: '#e9c46a', ec: '#5fa8e8', bang: 'split', acc: 'cat', accc: '#e9c46a', rar: 2, spd: 1.0, chm: 1.25, like: '우유 푸딩', hobby: '낮잠', tag: '느긋함', en_like: 'Milk pudding', en_hobby: 'Naps', en_tag: 'Laid-back', bday: '2/22' },
    { id: 'aoi', skill: { type: 'price', v: 0.25, ko: '단가 +25%', en: 'Price +25%' }, hc2: '#5ab8e8', name: '아오이', en: 'Aoi', hair: 'hime', hc: '#2a4a8a', ec: '#e0a83a', bang: 'straight', acc: 'none', accc: '#000', rar: 2, spd: 1.05, chm: 1.2, like: '말차 케이크', hobby: '서예', tag: '단아함', en_like: 'Matcha cake', en_hobby: 'Calligraphy', en_tag: 'Graceful', bday: '1/15' },
    { id: 'momo', skill: { type: 'tip', v: 0.6, ko: '하트 +60%', en: 'Hearts +60%' }, hc2: '#c8a8ff', ahoge: 1, name: '모모', en: 'Momo', hair: 'wavy', hc: '#f0a0b8', ec: '#8a5ad8', bang: 'side', acc: 'bunny', accc: '#fff', rar: 2, spd: .9, chm: 1.35, like: '복숭아 소다', hobby: '인형 모으기', tag: '몽글몽글', en_like: 'Peach soda', en_hobby: 'Plushies', en_tag: 'Fluffy', bday: '8/8' },
    { id: 'reina', skill: { type: 'price', v: 0.5, ko: '단가 +50%', en: 'Price +50%' }, hc2: '#fff0c0', name: '레이나', en: 'Reina', hair: 'drills', hc: '#f2d98a', ec: '#3a9ad8', bang: 'split', acc: 'ribbon', accc: '#2a2a5a', rar: 3, spd: 1.0, chm: 1.5, like: '홍차', hobby: '피아노', tag: '아가씨', en_like: 'Black tea', en_hobby: 'Piano', en_tag: 'Ojou-sama', bday: '12/24' },
    { id: 'kuro', skill: { type: 'cook', v: 0.7, ko: '조리 +70%', en: 'Cook +70%' }, hc2: '#c83a5a', name: '쿠로', en: 'Kuro', hair: 'long', hc: '#2b2b3a', ec: '#d83a3a', bang: 'side', acc: 'headphones', accc: '#3a3a4a', rar: 3, spd: 1.3, chm: 1.3, like: '에너지 드링크', hobby: '게임', tag: '밤샘', en_like: 'Energy drink', en_hobby: 'Gaming', en_tag: 'Night owl', bday: '10/31' },
    { id: 'shiro', skill: { type: 'tip', v: 0.9, ko: '하트 +90%', en: 'Hearts +90%' }, hc2: '#b8d8ff', name: '시로', en: 'Shiro', hair: 'braid', hc: '#e8e8f0', ec: '#f07aa0', bang: 'straight', acc: 'halo', accc: '#ffe07a', rar: 3, spd: 1.1, chm: 1.55, like: '솜사탕', hobby: '별 보기', tag: '천사', en_like: 'Cotton candy', en_hobby: 'Stargazing', en_tag: 'Angel', bday: '6/1' },
    { id: 'akari', skill: { type: 'perfect', v: 1.0, ko: 'PERFECT 구간 2배', en: 'PERFECT zone ×2' }, hc2: '#ffb04a', ahoge: 1, name: '아카리', en: 'Akari', hair: 'sidetail', hc: '#e04a3a', ec: '#3ad8b0', bang: 'spiky', acc: 'fox', accc: '#e04a3a', rar: 3, spd: 1.35, chm: 1.6, like: '유부초밥', hobby: '축제', tag: '여우', en_like: 'Inari sushi', en_hobby: 'Festivals', en_tag: 'Fox', bday: '5/5' },
  ];
  const SKIN = { b: '#ffe4d2', s: '#f5c6ad', d: '#e8a88c', o: '#b8705a' };
  const DRESS = palette('#33304a');
  const WHITE = { b: '#ffffff', s: '#e6e2ee', d: '#c9c3d6', o: '#8a83a0' };

  function heart(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * .9); ctx.bezierCurveTo(x - s * 1.3, y - s * .1, x - s * .7, y - s * 1.1, x, y - s * .4); ctx.bezierCurveTo(x + s * .7, y - s * 1.1, x + s * 1.3, y - s * .1, x, y + s * .9); ctx.closePath(); }
  function star(ctx, x, y, r, r2, n) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i & 1 ? r2 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }

  // 쟁반 + 음식
  function drawTray(ctx, x, y, food) {
    ell(ctx, x, y + 1.5, 9.5, 3); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
    ell(ctx, x, y, 9.5, 3.2); fillStroke(ctx, '#8a5a3a', '#4a2a14', .9); ell(ctx, x, y - .6, 8, 2.4); ctx.fillStyle = '#b07a4a'; ctx.fill();
    drawFood(ctx, x, y - 1.5, food, .85);
  }
  function drawFood(ctx, x, y, food, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (food === 'omu') { ell(ctx, 0, 0, 7.5, 3.4); fillStroke(ctx, '#fff', '#b8b0b8', .8); ell(ctx, 0, -1.5, 5.6, 2.8); fillStroke(ctx, '#ffcc3a', '#c8862a', .8); ell(ctx, -1.2, -2.4, 2.2, 1); ctx.fillStyle = '#fff2a0'; ctx.fill(); ctx.strokeStyle = '#e83a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -1.2); ctx.quadraticCurveTo(-1, -3.5, 1, -1.2); ctx.quadraticCurveTo(2.5, -3, 3.5, -1); ctx.stroke(); }
    else if (food === 'parfait') { ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(4, -7); ctx.lineTo(2.2, 1); ctx.lineTo(-2.2, 1); ctx.closePath(); fillStroke(ctx, 'rgba(220,240,255,.7)', '#8ab', .8); ctx.fillStyle = '#ffb8c8'; ctx.beginPath(); ctx.moveTo(-3.6, -6); ctx.lineTo(3.6, -6); ctx.lineTo(2.4, -1); ctx.lineTo(-2.4, -1); ctx.fill(); ell(ctx, 0, -8, 3.4, 2.6); fillStroke(ctx, '#fff', '#ccc', .6); ell(ctx, 0, -10.5, 1.8, 1.8); fillStroke(ctx, '#e83a4a', '#8a1a2a', .6); ctx.fillStyle = '#d8b880'; ctx.fillRect(-2.5, 1, 5, 1.2); }
    else if (food === 'coffee') { ell(ctx, 0, 1, 5, 1.8); fillStroke(ctx, '#fff', '#bbb', .7); rr(ctx, -3.8, -5, 7.6, 6.5, 1.5); fillStroke(ctx, '#fff', '#bbb', .8); ell(ctx, 0, -5, 3.8, 1.4); fillStroke(ctx, '#5a3a22', '#3a2210', .6); ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(4.6, -2, 1.8, -1.2, 1.2); ctx.stroke(); ctx.fillStyle = '#fff'; ell(ctx, -1, -5, 1.2, .5); ctx.fill(); }
    else if (food === 'cake') { ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(4, -6); ctx.lineTo(-4, -6); ctx.closePath(); fillStroke(ctx, '#fff6e0', '#c8b090', .8); ctx.fillStyle = '#ffb8c8'; ctx.fillRect(-4.5, -3.2, 9, 1.4); ell(ctx, 0, -7, 2, 2); fillStroke(ctx, '#e83a4a', '#8a1a2a', .6); ell(ctx, 0, 0, 6.5, 2); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill(); }
    ctx.restore();
  }

  window.ART = { MAIDS, drawFood, drawTray, heart, star, palette, adj, ell, rr, lin, rad, smooth, SKIN };
})();
