// 운빨용사 화면: 그리기·입력·화면 전환. 규칙은 core.js(G), 그림은 sprites.js(SP).
(function () {
  const D = window.DATA, C = D.CARDS;
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  let S = 1, W = 640, H = 360, DPR = 1, padL = 100, padR = 170;
  const FONT = 'Galmuri11, monospace';
  const ZH = /[?&]lang=zh/.test(location.search);
  const JA = window.LG3 === 'ja', PR = window.LG3 === 'pt' || window.LG3 === 'ru';
  const UI = (G.ui = {});

  // ───────── 화면 맞추기 ─────────
  function fit() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const iw = innerWidth, ih = innerHeight;
    cv.width = Math.round(iw * DPR); cv.height = Math.round(ih * DPR);
    cv.style.width = iw + 'px'; cv.style.height = ih + 'px';
    S = cv.height / 360; W = cv.width / S; H = 360;
    if (W < 600) { S = cv.width / 600; W = 600; H = cv.height / S; }
    padL = (104 * DPR) / S; padR = (178 * DPR) / S;
    ctx.imageSmoothingEnabled = false;
  }
  addEventListener('resize', fit); fit();

  // ───────── 그리기 도구 ─────────
  const LT = () => ctx.setTransform(S, 0, 0, S, 0, 0);
  function txt(s, x, y, size, col, align, o) {
    o = o || {};
    ctx.font = `${size}px ${o.font || FONT}`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    if (o.ol !== 0) { ctx.lineJoin = 'round'; ctx.lineWidth = o.olw || Math.max(2.5, size / 4.5); ctx.strokeStyle = o.olc || '#161a10'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
  }
  function tw(s, size) { ctx.font = `${size}px ${FONT}`; return ctx.measureText(s).width; }
  // Chinese: break between characters, keep number/latin runs whole, keep punctuation on the previous line,
  // then narrow the width while the line count stays the same so lines come out even
  const zhWrapCache = new Map();
  function zhGreedy(toks, size, maxW) {
    const out = [];
    let line = '';
    for (const t of toks) {
      if (t.trim() === '' && !line) continue;
      if (!line || tw(line + t, size) <= maxW) line += t;
      else { out.push(line.trimEnd()); line = t.trim() === '' ? '' : t; }
    }
    out.push(line.trimEnd());
    return out;
  }
  function wrapZh(s, size, maxW) {
    const key = s + '|' + size + '|' + maxW;
    const hit = zhWrapCache.get(key);
    if (hit) return hit;
    const out = [];
    for (const para of String(s).split('\n')) {
      const toks = para.match(/[\x21-\x7e]+[，。！？、；：）…]*| +|[^\x00-\x7f][，。！？、；：）…!?]*/g) || [''];
      let best = zhGreedy(toks, size, maxW);
      if (best.length > 1) {
        for (let w = maxW * 0.96; w > maxW * 0.4; w *= 0.96) {
          const tr = zhGreedy(toks, size, w);
          if (tr.length !== best.length || tr.some((l) => tw(l, size) > w + 0.5)) break;
          best = tr;
        }
      }
      out.push(...best);
    }
    if (zhWrapCache.size > 500) zhWrapCache.clear();
    zhWrapCache.set(key, out);
    return out;
  }
  function wrap(s, size, maxW) {
    if (ZH || JA) return wrapZh(s, size, maxW);
    const out = [];
    for (const para of String(s).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (tw(t, size) <= maxW || !line) line = t; else { out.push(line); line = w; }
      }
      // 너무 긴 낱말은 글자 단위로 자른다
      if (tw(line, size) > maxW) { let cur = ''; for (const ch of line) { if (tw(cur + ch, size) > maxW) { out.push(cur); cur = ch; } else cur += ch; } line = cur; }
      out.push(line);
    }
    return out;
  }
  // 도트 창: 모서리를 깎은 네모
  function box(x, y, w, h, fill, edge, inner) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    ctx.fillStyle = edge || '#161a10';
    ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4); ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 3, y + 2, w - 6, h - 4); ctx.fillRect(x + 2, y + 3, w - 4, h - 6);
    if (inner) { ctx.fillStyle = inner; ctx.fillRect(x + 3, y + 2, w - 6, 2); }
  }
  function panel(x, y, w, h) {
    box(x, y, w, h, '#5e6648', '#161a10');
    ctx.fillStyle = '#8a9068'; ctx.fillRect(Math.round(x) + 3, Math.round(y) + 2, Math.round(w) - 6, 2);
    ctx.fillStyle = '#3a4030'; ctx.fillRect(Math.round(x) + 3, Math.round(y + h) - 4, Math.round(w) - 6, 2);
    box(x + 4, y + 4, w - 8, h - 8, '#283020', '#c8b06a');
    box(x + 6, y + 6, w - 12, h - 12, '#283020', '#283020');
    // 네 모서리 못
    for (const [px, py] of [[x + 2, y + 2], [x + w - 5, y + 2], [x + 2, y + h - 5], [x + w - 5, y + h - 5]]) { ctx.fillStyle = '#161a10'; ctx.fillRect(Math.round(px), Math.round(py), 3, 3); ctx.fillStyle = '#c8c0b8'; ctx.fillRect(Math.round(px), Math.round(py), 2, 2); }
  }
  // 그림(도트) 한 장: cx·by 는 가운데 아래, sc 는 논리 배율 → 화면 도트 크기를 정수로
  function spr(img, cx, by, sc, o) {
    if (!img) return;
    o = o || {};
    const d = img.dpu || 1, kk = (sc * S) / d, k = d > 1 || sc * S < 1 ? kk : Math.round(kk), w = Math.round(img.width * k), h = Math.round(img.height * k);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = o.a === undefined ? 1 : o.a;
    const dx = Math.round(cx * S), dy = Math.round(by * S);
    ctx.translate(dx, dy);
    if (o.rot) ctx.rotate(o.rot);
    if (o.sx || o.sy) ctx.scale(o.sx || 1, o.sy || 1);
    if (o.flip) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = d > 1; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, Math.round(-w / 2), -h, w, h);
    ctx.restore();
  }
  const SW = (i) => i.lw || i.width, SH = (i) => i.lh || i.height;
  function icon(name, x, y, size) { const img = SP.get(name); spr(img, x, y + size / 2, size / Math.max(SW(img), SH(img))); }

  // ───────── 상태 ─────────
  let scr = 'title', btns = [], over = null, toast = null;
  const ANIM = { floats: [], parts: [], banners: [], shake: 0, flash: 0, flyers: [], fx: [], stop: 0, flashCol: '255,255,230' };
  const hero = { lunge: 0, hurt: 0, trip: 0, flash: 0, jump: 0 };
  let die = null, coin = null;
  let sel = null, hoverCard = null, busy = false;
  let reward = null, gacha = null, chest = null, evt = null, rest = null, ending = null, resultCv = null;
  let dexTab = 'c', dexScroll = 0, dexPick = null, deckScroll = 0, tip = null;
  let mouse = { x: -1, y: -1 };
  window.LH = { G, get scr() { return scr; }, set scr(v) { scr = v; }, get busy() { return busy; } };

  function button(x, y, w, h, label, fn, o) {
    o = o || {};
    const hov = mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
    const dis = o.dis;
    const body = dis ? ['#6e6864', '#4e4a48'] : o.blue ? ['#5e6a44', '#3e4a2e'] : o.green ? ['#5e8a52', '#3e5e3e'] : ['#b4503e', '#7c2c34'];
    const press = hov && !dis ? 1 : 0;
    box(x, y + 3, w, h, '#161a10', '#161a10');
    box(x, y + press, w, h, dis ? '#8a827a' : o.blue ? '#c8b06a' : '#d4b060', '#161a10');
    box(x + 2, y + 2 + press, w - 4, h - 4, body[0], body[1], 'rgba(255,240,210,0.28)');
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 4, y + h - 6 + press, w - 8, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (const px of [x + 4, x + w - 6]) { ctx.fillRect(px, y + 4 + press, 2, 2); ctx.fillRect(px, y + h - 7 + press, 2, 2); }
    const fs = o.fs || Math.min(16, h * 0.42);
    let s = fs; while (tw(label, s) > w - 12 && s > 8) s -= 1;
    txt(label, x + w / 2, y + h / 2 + press, s, dis ? '#d8d0c8' : '#fff', 'center');
    if (o.sub) txt(o.sub, x + w / 2, y + h + 9, 11, '#e8c860', 'center');
    btns.push({ x, y, w, h, fn: dis ? () => SFX.play('deny') : fn });
  }
  function hit(x, y, w, h, fn) { btns.push({ x, y, w, h, fn }); }

  // ───────── 효과 ─────────
  UI.float = (x, y, text, col, ic) => ANIM.floats.push({ x, y, text, col, ic, t: 0, life: 1000 });
  UI.banner = (text, col, size, life) => ANIM.banners.push({ text, col, size: size || 34, t: 0, life: life || 900 });
  function partBurst(x, y, n, cols, sp, g) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (0.5 + Math.random()) * (sp || 2.4); ANIM.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, t: 0, life: 500 + Math.random() * 500, col: pickc(cols), s: 2 + Math.random() * 3, g: g === undefined ? 0.12 : g }); }
  }
  const pickc = (a) => a[Math.floor(Math.random() * a.length)];
  // 모양 이펙트: slash 베기 궤적, ring 충격파, rays 빛줄기, glow 빛무리, stamp 도장 글, edge 화면 가장자리, clover 큰 네잎
  const fx = (o) => { o.t = 0; ANIM.fx.push(o); return o; };
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function parts(n, o) { for (let i = 0; i < n; i++) { const a = o.a !== undefined ? o.a + (Math.random() - 0.5) * (o.spread || 6.3) : Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * (o.sp || 2.4); ANIM.parts.push(Object.assign({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), t: 0, life: (o.life || 700) * (0.6 + Math.random() * 0.6), col: pickc(o.cols), s: (o.s || 3) * (0.6 + Math.random() * 0.8), g: o.g === undefined ? 0.1 : o.g, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 }, o.extra || {})); } }
  function slashAt(x, y, col, big) {
    const a0 = -0.7 + (Math.random() - 0.5) * 0.5;
    fx({ k: 'slash', x, y, a: a0, len: big ? 150 : 100, w: big ? 14 : 9, col, life: 260 });
    if (big) fx({ k: 'slash', x, y, a: a0 + 1.4, len: 120, w: 10, col, life: 300 });
  }
  function drawFX(dt, top) {
    if (!top) ANIM.fx = ANIM.fx.filter((f) => (f.t += dt) < f.life);
    for (const f of ANIM.fx) {
      if ((f.k === 'stamp' || f.k === 'clover') !== !!top) continue;
      const p = f.t / f.life;
      ctx.save();
      if (f.k !== 'stamp' && f.k !== 'clover') ctx.globalCompositeOperation = 'lighter';
      if (f.k === 'slash') {
        const L = f.len, pr = Math.min(1, p * 3.5), x0 = f.x - Math.cos(f.a) * L / 2, y0 = f.y - Math.sin(f.a) * L / 2;
        const x1 = x0 + Math.cos(f.a) * L * pr, y1 = y0 + Math.sin(f.a) * L * pr, w = f.w * (1 - p);
        ctx.lineCap = 'round'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = f.col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w * 0.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      } else if (f.k === 'ring') {
        const r = f.r0 + (f.r1 - f.r0) * ease(p);
        ctx.globalAlpha = (1 - p) * (f.a || 1); ctx.strokeStyle = f.col; ctx.lineWidth = (f.w || 4) * (1 - p) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); ctx.stroke();
      } else if (f.k === 'rays') {
        const n = f.n || 12, rot = (f.rot || 0) + f.t * (f.spin || 0.0012) * 0.5, R2 = f.R * (p < 0.15 ? ease(p / 0.15) : 1);
        ctx.globalAlpha = (p < 0.7 ? 1 : (1 - p) / 0.3) * (f.a || 0.5) * 0.45; ctx.fillStyle = f.col;
        for (let i = 0; i < n; i++) { const a = rot + (i * Math.PI * 2) / n; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a - 0.09) * R2, f.y + Math.sin(a - 0.09) * R2); ctx.lineTo(f.x + Math.cos(a + 0.09) * R2, f.y + Math.sin(a + 0.09) * R2); ctx.fill(); }
      } else if (f.k === 'glow') {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, f.col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = (1 - p) * (f.a || 0.8) * 0.55; ctx.fillStyle = g; ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      } else if (f.k === 'edge') {
        ctx.globalAlpha = (1 - p) * (f.a || 0.6) * 0.6; const e = 60;
        for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, 0, e, 0, 0, W, e], [0, H, 0, H - e, 0, H - e, W, e], [0, 0, e, 0, 0, 0, e, H], [W, 0, W - e, 0, W - e, 0, e, H]]) {
          const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, f.col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
        }
      } else if (f.k === 'stamp') {
        const sc = p < 0.14 ? 2.6 - (p / 0.14) * 1.6 : 1 + Math.max(0, 0.06 - (p - 0.14)) ;
        ctx.globalAlpha = p > 0.78 ? (1 - p) / 0.22 : 1; ctx.translate(f.x, f.y); ctx.rotate(f.rot || 0); ctx.scale(sc, sc);
        txt(f.text, 0, 0, f.size, f.col, 'center', { olw: f.size / 4, olc: f.olc || '#161a10' });
      } else if (f.k === 'clover') {
        const sz = f.s * (p < 0.25 ? back(p / 0.25) : 1) * (1 + Math.sin(f.t / 90) * 0.04);
        ctx.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1; ctx.translate(f.x, f.y); ctx.rotate(Math.sin(f.t / 200) * 0.15);
        icon('c_clover', 0, 0, sz);
      }
      ctx.restore();
    }
  }
  UI.burst = (x, y, n) => {
    partBurst(x, y, n, ['#ffffff', '#e8c860', '#dc7a3a', '#b4483c'], 3.4);
    parts(Math.round(n / 2), { x, y, cols: ['#ffffff', '#f4e09a'], sp: 4.5, s: 4, life: 600, g: 0.15, extra: { shape: 'shard' } });
    fx({ k: 'glow', x, y, r: 90 + n, col: 'rgba(255,250,220,1)', life: 380 });
    fx({ k: 'ring', x, y, r0: 10, r1: 70 + n, col: '#ffffff', w: 7, life: 420 });
    // 코인이 위 코인 칸으로 날아간다
    for (let i = 0; i < 6; i++) ANIM.parts.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 3, t: 0, life: 1400, col: '#e8c860', s: 5, g: 0.12, coin: 1, tx: padL + 50, ty: 12, delay: 350 + i * 40 });
  };
  UI.sparkle = (x, y, col) => { parts(16, { x, y: y + 20, cols: [col, '#ffffff'], sp: 1.4, up: 1.6, g: -0.03, s: 5, life: 900, extra: { shape: 'plus', glow: 1 } }); fx({ k: 'glow', x, y, r: 70, col: 'rgba(170,230,140,1)', a: 0.6, life: 600 }); };
  UI.heroX = () => W * 0.2;
  const GY = () => H - 150;
  UI.foeX = (f) => { const n = G.B ? G.B.foes.length : 1; return W * (0.68 + (f.slot - (n - 1) / 2) * Math.min(0.17, 0.4 / n)); };
  const foeBY = (f) => GY() - (f.m.fly ? 22 : 0) + Math.sin(G.time / 420 + f.phase) * (f.m.fly ? 4 : 1);
  UI.foeTop = (f) => foeBY(f) - SH(SP.get(f.m.spr)) * f.m.sc;
  UI.foeMidY = (f) => foeBY(f) - (SH(SP.get(f.m.spr)) * f.m.sc) / 2;
  UI.heroLunge = () => { hero.lunge = 1; };
  UI.blockFx = () => { const x = UI.heroX(), y = GY() - 55; fx({ k: 'ring', x, y, r0: 46, r1: 62, col: '#a8c8d8', w: 6, life: 450 }); fx({ k: 'glow', x, y, r: 80, col: 'rgba(150,200,230,1)', a: 0.45, life: 450 }); parts(10, { x, y, cols: ['#a8c8d8', '#ffffff'], sp: 1.6, up: 1, g: -0.02, s: 4, life: 600, extra: { shape: 'star', glow: 1 } }); };
  UI.heroHurt = (n) => { hero.hurt = 1; hero.flash = 1; UI.float(UI.heroX(), 120, '-' + n, '#e06a5a'); };
  UI.heroHit = (dmg, left, pure) => {
    hero.hurt = 1; hero.flash = left > 0 ? 1 : 0;
    if (left > 0) {
      SFX.play(left >= 15 ? 'bighit' : 'hurt'); ANIM.shake = Math.min(12, 3 + left / 3); ANIM.stop = Math.min(120, 40 + left * 3);
      partBurst(UI.heroX(), GY() - 50, 14, ['#e06a5a', '#ffffff']);
      if (!pure) slashAt(UI.heroX(), GY() - 55, '#ff5a4a', left >= 15);
      fx({ k: 'edge', col: 'rgba(220,40,30,1)', a: Math.min(0.8, 0.3 + left / 30), life: 450 });
    } else { fx({ k: 'ring', x: UI.heroX(), y: GY() - 55, r0: 30, r1: 70, col: '#a8c8d8', w: 6, life: 380 }); parts(10, { x: UI.heroX(), y: GY() - 55, cols: ['#a8c8d8', '#ffffff'], sp: 3, s: 3, extra: { shape: 'shard' } }); }
    UI.float(UI.heroX(), GY() - 110, left > 0 ? '-' + left : T('막음', 'BLOCK'), left > 0 ? (pure ? '#a8c878' : '#e06a5a') : '#a8c8d8');
  };
  UI.foeHit = (t, dmg, left, kind) => {
    t.flash = 1; t.hurtT = 1;
    const fx0 = UI.foeX(t), fy0 = UI.foeMidY(t), big = dmg >= 20;
    if (kind !== 'poi') {
      SFX.play(big ? 'bighit' : 'hit');
      partBurst(fx0, fy0, Math.min(36, 8 + dmg), ['#ffffff', '#e8c860', '#b4483c']);
      parts(Math.min(14, 4 + dmg / 3), { x: fx0, y: fy0, a: -0.3, spread: 2.2, cols: ['#ffffff', '#fff4c0'], sp: 5, s: 4, life: 380, g: 0.05, extra: { shape: 'shard', glow: 1 } });
      if (left > 0) slashAt(fx0, fy0, big ? '#ffd060' : '#ffffff', big);
      fx({ k: 'ring', x: fx0, y: fy0, r0: 8, r1: big ? 90 : 55, col: big ? '#ffd060' : '#ffffff', w: big ? 8 : 5, life: 340 });
      ANIM.stop = Math.max(ANIM.stop, big ? 110 : 45);
      if (big) { fx({ k: 'glow', x: fx0, y: fy0, r: 140, col: 'rgba(255,220,120,1)', a: 0.7, life: 400 }); ANIM.flash = Math.max(ANIM.flash, Math.min(0.5, dmg / 120)); }
    } else { parts(12, { x: fx0, y: fy0 + 10, cols: ['#a8c878', '#6ea45a', '#d0f0a0'], sp: 1, up: 1.4, g: -0.03, s: 5, life: 900, extra: { shape: 'bubble' } }); }
    if (dmg >= 25) ANIM.shake = Math.min(16, dmg / 3.5);
    const sz = dmg >= 40 ? 34 : dmg >= 20 ? 26 : 19;
    ANIM.floats.push({ pop: 1, x: UI.foeX(t) + (Math.random() * 30 - 15), y: UI.foeTop(t) + 8, text: left < dmg && left === 0 ? T('막음', 'BLOCK') : String(left), col: kind === 'poi' ? '#a8c878' : left === 0 ? '#a8c8d8' : dmg >= 20 ? '#e8c860' : '#ffffff', size: sz, t: 0, life: 900 });
  };
  UI.foeLunge = (f, buff) => { f.lunge = buff ? -1 : 1; };
  UI.foeMiss = (f) => { fx({ k: 'stamp', x: UI.foeX(f), y: UI.foeTop(f) - 10, text: T('꽝!', 'MISS!'), size: 30, col: '#c8c0b8', rot: 0.2, life: 1000 }); parts(18, { x: UI.foeX(f), y: GY() - 6, cols: ['#c8c0b8', '#948c88', '#e6dcc4'], sp: 2, up: 1, g: -0.01, s: 6, life: 800, extra: { shape: 'puff' } }); SFX.play('miss'); f.trip = 1; };
  UI.flyCard = (hc) => { ANIM.flyers.push({ hc, x: hc.x, y: hc.y, t: 0 }); sel = null; parts(12, { x: hc.x, y: hc.y - 40, a: -1.57, spread: 1.6, cols: ['#f4e09a', '#ffffff'], sp: 3, s: 3, life: 500, g: -0.02, extra: { shape: 'star', glow: 1 } }); };
  UI.miss = () => {
    SFX.play('miss'); hero.trip = 1;
    fx({ k: 'stamp', x: W / 2, y: H * 0.36, text: T('꽝!', 'MISS!'), size: 48, col: '#c8c0b8', rot: -0.18, life: 1000 });
    parts(24, { x: UI.heroX(), y: GY() - 4, cols: ['#c8c0b8', '#948c88', '#e6dcc4'], sp: 2.2, up: 1, g: -0.01, s: 7, life: 900, extra: { shape: 'puff' } });
    ANIM.shake = Math.max(ANIM.shake, 4);
  };
  UI.crit = () => {
    SFX.play('crit'); const dy = Math.min(130, GY() - 90);
    fx({ k: 'rays', x: W / 2, y: dy, R: 170, n: 14, col: '#ffd060', a: 0.45, life: 1000 });
    fx({ k: 'ring', x: W / 2, y: dy, r0: 20, r1: 150, col: '#ffd060', w: 8, life: 500 });
    fx({ k: 'stamp', x: W / 2, y: H * 0.36 + 34, text: T('대박 x2', 'CRIT x2'), size: 40, col: '#f4e09a', olc: '#5a3e24', rot: 0.06, life: 950 });
    parts(36, { x: W / 2, y: dy, cols: ['#e8c860', '#f4e09a', '#ffffff'], sp: 4, s: 4, life: 900, g: 0.06, extra: { shape: 'star', glow: 1 } });
    ANIM.flash = Math.max(ANIM.flash, 0.25); ANIM.flashCol = '255,230,150';
  };
  UI.jackpot = async () => {
    SFX.play('jackpot'); ANIM.flash = 1; ANIM.flashCol = '220,255,190'; ANIM.shake = 5;
    const cy2 = H * 0.36;
    fx({ k: 'rays', x: W / 2, y: cy2, R: W, n: 18, col: '#c4e09a', a: 0.5, spin: 0.002, life: 1900 });
    fx({ k: 'rays', x: W / 2, y: cy2, R: W * 0.7, n: 9, col: '#ffd060', a: 0.35, spin: -0.0016, rot: 0.3, life: 1900 });
    fx({ k: 'clover', x: W / 2, y: cy2 - 20, s: 120, life: 1800 });
    for (let i = 0; i < 3; i++) fx({ k: 'ring', x: W / 2, y: cy2 - 20, r0: 30, r1: 260 + i * 60, col: i % 2 ? '#ffd060' : '#c4e09a', w: 10, life: 700 + i * 250 });
    for (let i = 0; i < 70; i++) ANIM.parts.push({ x: Math.random() * W, y: -10 - Math.random() * 120, vx: Math.random() - 0.5, vy: 1 + Math.random() * 2, t: 0, life: 2000, col: pickc(['#e8c860', '#f4e09a', '#b08a3a']), s: 4, g: 0.05, coin: 1 });
    parts(60, { x: W / 2, y: -10, a: 1.57, spread: 2.4, cols: ['#c4e09a', '#7aac5e', '#f4e09a', '#e06a5a', '#a8c8d8'], sp: 5, s: 5, life: 2000, g: 0.06, extra: { shape: 'confetti' } });
    await G.wait(700);
    fx({ k: 'stamp', x: W / 2, y: cy2 + 46, text: 'JACKPOT x3', size: 44, col: '#c4e09a', olc: '#1f3a24', rot: -0.05, life: 1300 });
    await G.wait(300);
  };
  // 주사위를 안 굴리는 카드: 무슨 일이 생겼는지 가운데에 크게
  UI.cardPop = (k) => {
    const col = { luck: '#a8c878', def: '#a8c8d8', power: '#c8a8d0', curse: '#b4a68e' }[k.type] || '#f4e09a';
    const d = T(k.d[0], k.d[1]).split(String.fromCharCode(10))[0];
    UI.banner((k.type === 'power' ? T('지속 · ', 'POWER · ') : '') + d, col, 24, 1100);
    fx({ k: 'rays', x: W / 2, y: H * 0.55, R: 140, n: 10, col, a: 0.35, life: 800 });
    fx({ k: 'ring', x: W / 2, y: H * 0.55, r0: 10, r1: 120, col, w: 6, life: 500 });
    parts(20, { x: W / 2, y: H * 0.55, cols: [col, '#ffffff'], sp: 3, s: 4, life: 800, g: 0.02, extra: { shape: 'star', glow: 1 } });
    SFX.play(k.type === 'power' ? 'crit' : 'leaf');
  };
  // 잎이 가운데(주사위 자리)에서 클로버로 날아간다
  UI.leafPop = (a, b) => {
    const sx = W / 2, sy = Math.min(130, GY() - 90);
    for (let i = a; i < b; i++) for (let k = 0; k < 4; k++) ANIM.parts.push({ x: sx + (Math.random() - 0.5) * 30, y: sy, vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 3, t: 0, life: 1500, col: pickc(['#7aac5e', '#c4e09a']), s: 7, g: 0.1, rot: Math.random() * 6, vr: 0.2, shape: 'leaf', tx: 48, ty: H - 112, delay: 250 + k * 60, arrive: 1 });
    UI.float(48, H - 140, T('잎 +', 'LEAF +') + (b - a), '#a8c878');
  };
  UI.jackReady = () => { UI.banner(T('다음 주사위 잭팟!', 'NEXT DIE: JACKPOT!'), '#a8c878', 26, 1300); fx({ k: 'rays', x: 48, y: H - 112, R: 80, n: 10, col: '#c4e09a', a: 0.6, life: 1400 }); fx({ k: 'ring', x: 48, y: H - 112, r0: 10, r1: 70, col: '#c4e09a', w: 6, life: 600 }); };
  UI.cloverStorm = (n) => { for (let i = 0; i < n * 14; i++) ANIM.parts.push({ x: UI.heroX(), y: GY() - 60, vx: 3 + Math.random() * 5, vy: (Math.random() - 0.5) * 4, t: 0, life: 800, col: pickc(['#7aac5e', '#c4e09a', '#1f8a4a']), s: 4, g: 0 }); SFX.play('leaf'); };
  UI.stealCoins = (f, v) => { UI.float(UI.heroX(), GY() - 110, '-' + v + T(' 코인', ' coins'), '#e8c860'); for (let i = 0; i < Math.min(12, v); i++) ANIM.parts.push({ x: UI.heroX(), y: GY() - 60, vx: 2 + Math.random() * 3, vy: -2 - Math.random() * 2, t: 0, life: 700, col: '#e8c860', s: 3, g: 0.15, coin: 1 }); };
  UI.revive = () => { UI.banner(T('불사조!', 'PHOENIX!'), '#d08a50', 36, 1000); partBurst(UI.heroX(), GY() - 50, 50, ['#f4c860', '#dc7a3a', '#ffffc0'], 3, -0.05); fx({ k: 'rays', x: UI.heroX(), y: GY() - 50, R: 160, n: 12, col: '#ffb040', a: 0.5, life: 1200 }); fx({ k: 'glow', x: UI.heroX(), y: GY() - 50, r: 160, col: 'rgba(255,180,80,1)', life: 900 }); };
  UI.turnBanner = () => { UI.banner(T('내 차례', 'YOUR TURN'), '#ffffff', 26, 650); busy = false; };
  UI.rollDie = (r, foe) => new Promise((res) => { die = { r, foe, t: 0, res, face: 1 }; });
  UI.coinFlip = (heads) => new Promise((res) => { coin = { heads, t: 0, res }; });
  UI.victory = () => {
    SFX.play('win');
    const B = G.B;
    reward = G.battleReward(); reward.taken = false; reward.boss = B.kind === 'boss';
    fx({ k: 'stamp', x: W / 2, y: H * 0.34, text: T('승리!', 'VICTORY!'), size: 52, col: '#f4e09a', olc: '#5a3e24', rot: -0.04, life: 1300 });
    fx({ k: 'rays', x: W / 2, y: H * 0.34, R: W * 0.6, n: 16, col: '#ffd060', a: 0.35, life: 1300 });
    parts(70, { x: W / 2, y: -10, a: 1.57, spread: 2.6, cols: ['#c4e09a', '#7aac5e', '#f4e09a', '#e06a5a', '#a8c8d8', '#ffffff'], sp: 5, s: 5, life: 1800, g: 0.07, extra: { shape: 'confetti' } });
    G.wait(900).then(() => { if (leaveBattleTo('reward')) { busy = false; sel = null; BGM.play('map'); } });
    G.saveRun();
  };
  // 전투가 끝나면 덱 보기·설명 창이 열려 있어도 닫고 결과 화면으로(타이틀로 나간 뒤면 그대로)
  function leaveBattleTo(target) {
    if (scr === 'deck' || scr === 'how') { scrStack.length = 0; howNext = null; scr = 'battle'; }
    if (scr !== 'battle') return false;
    scr = target; return true;
  }
  UI.defeat = () => {
    SFX.play('lose'); BGM.stop();
    G.wait(900).then(() => { if (!leaveBattleTo('over')) return; over = { add: G.endRun(false), t: 0 }; G.B = null; busy = false; document.body.classList.remove('playing'); });
  };

  // ───────── 장면 그리기 ─────────
  function drawBg(act, dark) {
    const b = SP.bg(act);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    // 땅 줄(그림의 140줄)이 GY 에 오게, 그림 한 도트 = 논리 2
    const kk = 2, off = GY() - 140 * kk + 6;
    const dh = b.height * kk * S, bw = b.width * kk * S;
    for (let x = 0; x < cv.width; x += bw) ctx.drawImage(b, Math.floor(x), Math.floor(off * S), Math.ceil(bw) + 1, Math.ceil(dh));
    if (off > 0) ctx.drawImage(b, 0, 0, b.width, 2, 0, 0, cv.width, Math.ceil(off * S) + 1);
    if (dark) { ctx.fillStyle = `rgba(10,6,20,${dark})`; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.restore();
  }
  function shadow(x, y, w) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), Math.round(w), 4); ctx.fillRect(Math.round(x - w / 2 + 3), Math.round(y - 3), Math.round(w - 6), 6); }
  function drawHero(x, by, sc, o) {
    o = o || {};
    const img = SP.get('hero');
    shadow(x, by, 40);
    let dx = x + hero.lunge * 26, rot = 0, dy = by - hero.jump * 20;
    if (hero.trip > 0) { const t = 1 - hero.trip; rot = Math.sin(t * Math.PI) * 1.2; dx -= Math.sin(t * Math.PI) * 10; }
    if (hero.hurt > 0) dx -= hero.hurt * 10;
    spr(img, dx, dy, sc, { rot, sy: 1 + Math.sin(G.time / 300) * 0.02 });
    if (hero.flash > 0.4) spr(SP.white('hero'), dx, dy, sc, { rot, a: 0.85 });
  }
  function bar(x, y, w, v, max, col, blk, right) {
    x = Math.round(x); y = Math.round(y);
    box(x, y, w, 10, '#2a1a24', '#161a10');
    const f = Math.max(0, Math.round(((w - 4) * v) / max));
    ctx.fillStyle = col; ctx.fillRect(x + 2, y + 2, f, 6); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2, y + 2, f, 2);
    txt(v + '/' + max, x + w / 2, y + 5, 10, '#fff', 'center', { olw: 2.5 });
    if (blk > 0) { const sx = right ? x + w + 10 : x - 10; icon('u_shield', sx, y + 5, 20); txt(String(blk), sx, y + 6, 11, '#fff', 'center'); }
  }
  function statusRow(st, x, y, extra) {
    const list = [];
    if (st.str) list.push(['u_str', st.str]);
    if (st.weak) list.push(['u_weak', st.weak]);
    if (st.vuln) list.push(['u_vuln', st.vuln]);
    if (st.poi) list.push(['u_poison', st.poi]);
    if (extra) list.push(...extra);
    let xx = x - (list.length * 22) / 2 + 11;
    for (const [ic, n] of list) { icon(ic, xx, y, 16); txt(String(n), xx + 7, y + 5, 10, '#fff', 'center', { olw: 2.5 }); xx += 22; }
  }
  function intentDraw(f) {
    const o = f.intent; if (!o || f.hp <= 0) return;
    const x = UI.foeX(f), y = UI.foeTop(f) - 14 + Math.sin(G.time / 300) * 2;
    const parts = [];
    const atkTxt = (v, xx) => String(G.intentDmg(f, v)) + (xx > 1 ? 'x' + xx : '');
    if (o.k === 'atk') parts.push(['c_sword', atkTxt(o.v, o.x), '#e8907a']);
    if (o.k === 'dice') parts.push(['c_dice', o.v + 'x?', '#e8c860']);
    if (o.k === 'def' || o.def) parts.push(['c_shield', String(o.k === 'def' ? o.v : o.def), '#a8c8d8']);
    if (o.k === 'str') parts.push(['u_str', '+' + o.v, '#e8907a']);
    if (o.k === 'weak') parts.push(['u_weak', '', '#c8a8d0']);
    if (o.k === 'vuln') parts.push(['u_vuln', '', '#c8a8d0']);
    if (o.k === 'poi') parts.push(['c_poison', String(o.v), '#a8c878']);
    if (o.k === 'steal') parts.push(['c_coin', '', '#e8c860']);
    if (o.k === 'curse') parts.push(['c_skull', '', '#9a7ab0']);
    if (o.atk) parts.push(['c_sword', atkTxt(o.atk, 1), '#e8907a']);
    if (o.heal) parts.push(['c_heart', '+' + o.heal, '#a8c878']);
    let total = parts.reduce((s, p) => s + 20 + (p[1] ? tw(p[1], 13) + 2 : 0), 0), xx = x - total / 2;
    for (const p of parts) { icon(p[0], xx + 9, y, 18); xx += 20; if (p[1]) { txt(p[1], xx, y + 1, 13, p[2], 'left'); xx += tw(p[1], 13) + 2; } }
  }
  function drawFoe(f) {
    const img = SP.get(f.m.spr), x = UI.foeX(f), by = foeBY(f), sc = f.m.sc;
    if (f.dead >= 1) return;
    let dx = x - f.lunge * 30 + (f.hurtT > 0 ? f.hurtT * 8 : 0), rot = 0;
    if (f.trip > 0) rot = Math.sin((1 - f.trip) * Math.PI) * -0.8;
    const a = f.dead > 0 ? 1 - f.dead : 1;
    if (!f.m.fly) shadow(x, GY(), SW(img) * sc * 0.6);
    else { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(x - 16), Math.round(GY() - 2), 32, 4); }
    const sel2 = sel && C[sel.id].tgt && G.liveFoes().length > 1 && mouseOverFoe(f);
    spr(img, dx, by + (f.dead > 0 ? f.dead * 20 : 0), sc, { rot, a, sy: 1 + Math.sin(G.time / 250 + f.phase) * 0.025 });
    if (f.flash > 0.4) spr(SP.white(f.m.spr), dx, by, sc, { rot, a: 0.85 * a });
    if (f.dead > 0) return;
    if (sel2 || (sel && C[sel.id].tgt && targetOf() === f)) { const w = SW(img) * sc; ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(x - w / 2 - 4, by - SH(img) * sc - 4, w + 8, SH(img) * sc + 8); ctx.setLineDash([]); }
    const bw = Math.max(64, Math.min(110, SW(img) * sc * 0.8));
    bar(x - bw / 2, GY() + 4, bw, f.hp, f.max, '#b4483c', f.blk);
    statusRow(f.st, x, GY() - 8);
    intentDraw(f);
  }
  function mouseOverFoe(f) {
    const img = SP.get(f.m.spr), x = UI.foeX(f), by = foeBY(f), w = SW(img) * f.m.sc, h = SH(img) * f.m.sc;
    return mouse.x > x - w / 2 && mouse.x < x + w / 2 && mouse.y > by - h && mouse.y < by + 20;
  }
  function foeAt(px, py) {
    if (!G.B) return null;
    for (const f of G.liveFoes()) { const img = SP.get(f.m.spr), x = UI.foeX(f), by = foeBY(f), w = Math.max(60, SW(img) * f.m.sc), h = SH(img) * f.m.sc; if (px > x - w / 2 && px < x + w / 2 && py > by - h - 20 && py < by + 30) return f; }
    return null;
  }
  let lastTarget = null;
  function targetOf() { if (lastTarget && G.alive(lastTarget)) return lastTarget; return G.firstFoe(); }

  // 카드 한 장
  const CW = 88, CH = 122;
  const TYPECOL = { atk: ['#a8483e', '#6e2a30'], def: ['#4e6e94', '#2e4262'], luck: ['#5e8a52', '#34543a'], power: ['#7a5a8e', '#4a3460'], curse: ['#4a5238', '#2a3022'] };
  function drawCard(id, cx, cy, sc, o) {
    o = o || {};
    const k = C[id]; if (!k) return;
    ctx.save(); LT(); ctx.translate(cx, cy); ctx.scale(sc, sc); if (o.rot) ctx.rotate(o.rot);
    ctx.globalAlpha = o.a === undefined ? 1 : o.a;
    const x = -CW / 2, y = -CH / 2, tc = TYPECOL[k.type];
    if (o.glow) { ctx.fillStyle = 'rgba(255,230,120,0.55)'; ctx.fillRect(x - 4, y - 4, CW + 8, CH + 8); }
    box(x, y, CW, CH, k.rare ? '#d4b060' : '#5e6648', '#161a10');
    box(x + 3, y + 3, CW - 6, CH - 6, '#e8dec6', k.rare ? '#9a6e32' : '#8a7a62');
    // 이름 띠
    box(x + 5, y + 6, CW - 10, 17, tc[0], tc[1], 'rgba(255,255,255,0.3)');
    let ns = 12; const nm = T(k.n[0], k.n[1]); while (tw(nm, ns) > CW - 40 && ns > 7.5) ns -= 0.5;
    txt(nm, 2, y + 15, ns, '#fff', 'center', { olw: 2.6 });
    // 그림 칸
    ctx.fillStyle = k.rare ? '#4a3a24' : '#3a4230'; ctx.fillRect(x + 8, y + 26, CW - 16, 36); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 8, y + 26, CW - 16, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 8, y + 26, CW - 16, 3);
    ctx.restore();
    // 그림은 정수 도트로
    const art = SP.get(k.art);
    spr(art, cx, cy + (y + 60) * sc, (32 / Math.max(SW(art), SH(art))) * sc, { a: o.a === undefined ? 1 : o.a });
    ctx.save(); LT(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalAlpha = o.a === undefined ? 1 : o.a;
    if (k.rare) { const sh = ((G.time / 9) % (CW * 3)) - CW; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x + sh, y + 26); ctx.lineTo(x + sh + 10, y + 26); ctx.lineTo(x + sh - 6, y + 62); ctx.lineTo(x + sh - 16, y + 62); ctx.closePath(); ctx.save(); ctx.beginPath(); ctx.rect(x + 8, y + 26, CW - 16, 36); ctx.clip(); ctx.fill(); ctx.restore(); }
    // 설명
    let ds = 11, lines = wrap(T(k.d[0], k.d[1]), ds, CW - 12);
    while (lines.length * (ds + 2) > 50 && ds > 8) { ds -= 0.5; lines = wrap(T(k.d[0], k.d[1]), ds, CW - 12); }
    const ly = y + 66 + (52 - lines.length * (ds + 2)) / 2 + (ds + 2) / 2;
    lines.forEach((l, i) => txt(l, 0, ly + i * (ds + 2), ds, '#2a1a24', 'center', { ol: 0 }));
    // 기운 보석
    const can = o.can !== false;
    ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.arc(x + 9, y + 9, 11, 0, 7); ctx.fill();
    ctx.fillStyle = can ? '#d08a50' : '#6e6864'; ctx.beginPath(); ctx.arc(x + 9, y + 9, 9, 0, 7); ctx.fill();
    ctx.fillStyle = can ? '#ecc088' : '#a49c94'; ctx.fillRect(x + 4, y + 4, 5, 2);
    txt(String(k.cost), x + 9, y + 10, 13, '#fff', 'center', { olw: 3 });
    if (k.dice) { ctx.fillStyle = '#161a10'; ctx.fillRect(x + CW - 18, y + 1, 17, 17); ctx.fillStyle = '#ece4d2'; ctx.fillRect(x + CW - 17, y + 2, 15, 15); ctx.fillStyle = '#c82850'; [[3, 3], [9, 9], [6, 6]].forEach((p) => ctx.fillRect(x + CW - 17 + p[0], y + 2 + p[1], 3, 3)); }
    if (k.rare) { ctx.fillStyle = '#e8c860'; ctx.fillRect(x + CW / 2 - 2, y + CH - 4, 4, 4); }
    ctx.restore();
  }

  // ───────── 위 띠(HUD) ─────────
  function hud() {
    const R = G.run; if (!R) return;
    ctx.fillStyle = '#283020'; ctx.fillRect(0, 0, W, 24); ctx.fillStyle = '#3a422e'; ctx.fillRect(0, 0, W, 2); ctx.fillStyle = '#8a7a62'; ctx.fillRect(0, 24, W, 2); ctx.fillStyle = '#161a10'; ctx.fillRect(0, 26, W, 2); ctx.fillStyle = 'rgba(10,6,20,0.25)'; ctx.fillRect(0, 28, W, 3);
    let x = padL;
    icon('u_heart', x + 8, 12, 16); txt(R.hp + '/' + R.max, x + 19, 13, 13, R.hp < R.max * 0.3 ? '#e8907a' : '#fff'); x += 30 + tw(R.hp + '/' + R.max, 13);
    icon('u_coin', x + 8, 12, 16); txt(String(R.coins), x + 19, 13, 13, '#e8c860'); x += 30 + tw(String(R.coins), 13);
    txt((R.act + 1) + '-' + R.floor, x + 4, 13, 13, '#d0dcd8'); x += 18 + tw('0-0', 13);
    // 카드 수(덱 보기)
    const dl = T('덱 ', 'DECK ') + R.deck.length, dw = tw(dl, 12) + 14;
    box(x, 3, dw, 18, '#5e6a44', '#161a10', 'rgba(255,255,255,0.3)'); txt(dl, x + dw / 2, 13, 12, '#fff', 'center');
    hit(x, 0, dw, 24, () => { SFX.play('click'); deckScroll = 0; scrStack.push(scr); scr = 'deck'; });
    x += dw + 8;
    for (const r of R.relics) {
      if (x > W - padR - 16) break;
      icon(D.RELICS[r].art, x + 9, 12, 18);
      const rr = r; hit(x, 0, 20, 24, () => { tip = { r: rr, t: 0 }; });
      x += 21;
    }
  }
  const scrStack = [];

  // ───────── 타이틀 ─────────
  function drawTitle() {
    drawBg(0);
    const gy = GY();
    drawHero(W * 0.13, gy, 2.4);
    spr(SP.get('slime'), W * 0.79, gy + Math.abs(Math.sin(G.time / 300)) * -4, 2.6);
    spr(SP.get('goblin'), W * 0.9, gy, 2.6);
    const title = T('용사님!럭키', 'LUCKY HERO');
    const face = 1 + (Math.floor(G.time / 140) % 6);
    let y0;
    {
      // 네잎클로버 문장 + 겨자 리본(물마루 글꼴)
      const cx = W / 2, cy = 70;
      ctx.fillStyle = '#161a10'; ctx.fillRect(cx - 3, cy + 20, 7, 52);
      ctx.fillStyle = '#4e7e52'; ctx.fillRect(cx - 1, cy + 22, 3, 48);
      for (const [dx, dy] of [[-30, -26], [30, -26], [-30, 22], [30, 22]]) {
        ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 36, 0, 7); ctx.fill();
        ctx.fillStyle = '#5e8a52'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 33, 0, 7); ctx.fill();
        ctx.fillStyle = '#7aac5e'; ctx.beginPath(); ctx.arc(cx + dx - 6, cy + dy - 6, 22, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,230,0.35)'; ctx.fillRect(cx + dx - 18, cy + dy - 20, 10, 4);
      }
      const rw = EN || PR ? 360 : 330, rh = 46, rx = cx - rw / 2, ry = cy - rh / 2;
      for (const sgn of [-1, 1]) {
        const ex = sgn < 0 ? rx - 26 : rx + rw + 26;
        ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.moveTo(sgn < 0 ? rx + 6 : rx + rw - 6, ry + 10); ctx.lineTo(ex, ry + 10); ctx.lineTo(ex + sgn * -12, ry + rh / 2 + 10); ctx.lineTo(ex, ry + rh + 10); ctx.lineTo(sgn < 0 ? rx + 6 : rx + rw - 6, ry + rh + 10); ctx.fill();
        ctx.fillStyle = '#9a6e32'; ctx.beginPath(); ctx.moveTo(sgn < 0 ? rx + 6 : rx + rw - 6, ry + 13); ctx.lineTo(ex + sgn * -3, ry + 13); ctx.lineTo(ex + sgn * -14, ry + rh / 2 + 10); ctx.lineTo(ex + sgn * -3, ry + rh + 7); ctx.lineTo(sgn < 0 ? rx + 6 : rx + rw - 6, ry + rh + 7); ctx.fill();
      }
      box(rx, ry, rw, rh, '#f4e09a', '#161a10'); box(rx + 3, ry + 3, rw - 6, rh - 6, '#d4b060', '#d4b060', 'rgba(255,250,220,0.5)');
      // 제목 + 도트 하트
      let tsz = EN || PR ? 34 : ZH || JA ? 37 : 40; ctx.font = `${tsz}px Mulmaru, Galmuri11`;
      // shrink the title until title + heart fit inside the ribbon
      if (JA || PR) while (ctx.measureText(title).width + 36 > rw - 24 && tsz > 20) ctx.font = `${--tsz}px Mulmaru, Galmuri11`;
      const tww = ctx.measureText(title).width, hs = 30, gap = 6;
      txt(title, cx - (hs + gap) / 2, cy + 2, tsz, '#2c4a38', 'center', { olw: 6, olc: '#f4e09a', font: 'Mulmaru, Galmuri11' });
      icon('c_heart', cx - (hs + gap) / 2 + tww / 2 + gap + hs / 2, cy + 1 + Math.sin(G.time / 220) * 1.5, hs);
      drawDie(rx - 4, ry - 6, 22, face, Math.sin(G.time / 300) * 0.3); drawDie(rx + rw + 4, ry - 6, 22, 7 - face, -Math.sin(G.time / 300) * 0.3);
      y0 = cy + 64;
    }
    // 단추(폰 가로: 아래 26% 위에)
    const bw = 136, bh = 38;
    y0 = Math.min(y0, H * 0.74 - 90);
    const saved = G.loadRun();
    if (saved) {
      button(W / 2 - bw - 6, y0, bw, bh, T('이어하기', 'CONTINUE'), () => { G.run = saved; goMap(); });
      button(W / 2 + 6, y0, bw, bh, T('새로 시작', 'NEW RUN'), () => startNew(), { blue: 1 });
    } else button(W / 2 - bw / 2, y0, bw, bh, T('시작', 'START'), () => startNew());
    button(W / 2 - bw - 6, y0 + bh + 10, bw, 32, T('상점', 'SHOP'), () => { SFX.play('click'); scr = 'shop'; }, { blue: 1, fs: 14 });
    button(W / 2 + 6, y0 + bh + 10, bw, 32, T('도감', 'COLLECTION'), () => { SFX.play('click'); dexScroll = 0; dexPick = null; scr = 'dex'; }, { blue: 1, fs: 14 });
    const bank = G.meta.bank;
    icon('u_coin', W - padR - 60, 13, 16); txt(String(bank), W - padR - 48, 13, 14, '#e8c860');
  }
  function startNew() {
    SFX.unlock(); SFX.play('click');
    G.newRun();
    if (!G.meta.how) { G.meta.how = 1; G.saveMeta(); howT = 0; howNext = 'map'; scr = 'how'; return; }
    goMap();
  }
  function goMap() { busy = false; scr = 'map'; BGM.play('map'); document.body.classList.remove('playing'); G.saveRun(); }

  // ───────── 주사위 그림 ─────────
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function drawDie(x, y, s, face, rot, o) {
    o = o || {};
    ctx.save(); LT(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const h = s / 2;
    const body = face === 7 ? '#7aac5e' : face === 6 ? '#e8c860' : face === 1 && o.done ? '#8a827a' : '#ece4d2';
    ctx.fillStyle = '#161a10'; ctx.fillRect(-h - 2, -h, s + 4, s); ctx.fillRect(-h, -h - 2, s, s + 4);
    ctx.fillStyle = body; ctx.fillRect(-h, -h + 1, s, s - 2); ctx.fillRect(-h + 1, -h, s - 2, s);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-h + 2, -h + 2, s - 4, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-h + 2, h - 4, s - 4, 2);
    if (face === 7) { ctx.restore(); txt('7', x, y + 1, s * 0.8, '#fff', 'center', { olw: 4, olc: '#0e4a30' }); return; }
    const pc = face === 1 ? '#c82850' : '#2a1a24', ps = Math.max(3, Math.round(s / 6.5)), g = s * 0.27;
    ctx.fillStyle = pc;
    for (const p of PIPS[face] || []) ctx.fillRect(Math.round(p[0] * g - ps / 2), Math.round(p[1] * g - ps / 2), ps, ps);
    ctx.restore();
  }

  // ───────── 지도 ─────────
  const DOOR = {
    fight: ['n_fight', ['전투', 'FIGHT'], '#b4483c'], elite: ['n_elite', ['정예', 'ELITE'], '#c82850'], chest: ['n_chest', ['보물', 'TREASURE'], '#e8c860'],
    gacha: ['n_gacha', ['뽑기', 'GACHA'], '#6ae8e8'], rest: ['n_rest', ['모닥불', 'CAMPFIRE'], '#d08a50'], event: ['n_event', ['운명', 'FATE'], '#9a7ab0'], boss: ['n_boss', ['보스', 'BOSS'], '#e8c860'],
  };
  function drawMap() {
    const R = G.run, act = D.ACTS[R.act];
    drawBg(R.act, 0.35);
    hud();
    txt(T((R.act + 1) + '막 ', 'ACT ' + (R.act + 1) + ' ') + T(act.n[0], act.n[1]), W / 2, 44, 20, '#fff', 'center');
    // 층 길
    const n = G.FLOORS, x0 = W / 2 - 150, x1 = W / 2 + 150, py = 100;
    ctx.fillStyle = '#161a10'; ctx.fillRect(x0, py - 2, x1 - x0, 5); ctx.fillStyle = '#8a9068'; ctx.fillRect(x0, py - 1, x1 - x0, 3);
    for (let i = 1; i <= n; i++) {
      const x = x0 + ((x1 - x0) * (i - 1)) / (n - 1), done = i < R.floor, cur = i === R.floor;
      box(x - 7, py - 7, 14, 14, done ? '#8a9068' : cur ? '#e8c860' : '#3a4230', '#161a10');
      if (i === n) icon('n_boss', x, py - 16, 14);
    }
    const hx = x0 + ((x1 - x0) * (R.floor - 1)) / (n - 1);
    spr(SP.get('hero'), hx, py - 6 + Math.abs(Math.sin(G.time / 200)) * -3, 0.7);
    // 문
    const ds = R.doors, dw = Math.min(150, (W - 80) / ds.length - 16), dh = 140, gap = 18, tot = ds.length * dw + (ds.length - 1) * gap;
    ds.forEach((k, i) => {
      const x = W / 2 - tot / 2 + i * (dw + gap), y = 120, d = DOOR[k];
      const hov = mouse.x > x && mouse.x < x + dw && mouse.y > y && mouse.y < y + dh;
      const lift = hov ? -4 : 0;
      panel(x, y + lift, dw, dh);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 12, y + 12 + lift, dw - 24, 80);
      icon(d[0], x + dw / 2, y + 52 + lift + Math.sin(G.time / 300 + i) * 2, 60);
      txt(T(d[1][0], d[1][1]), x + dw / 2, y + 112 + lift, 18, d[2], 'center');
      hit(x, y, dw, dh, () => enterDoor(k));
    });
  }
  function enterDoor(k) {
    SFX.play('click'); busy = false;
    if (k === 'fight' || k === 'elite' || k === 'boss') return startFight(k);
    if (k === 'chest') { chest = { t: 0, open: false, res: null }; scr = 'chest'; return; }
    if (k === 'gacha') { gacha = { t: 0, phase: 'idle', res: null }; scr = 'gacha'; return; }
    if (k === 'rest') { rest = { done: false }; scr = 'rest'; return; }
    if (k === 'event') { evt = { id: G.pick(['roulette', 'oddeven', 'well', 'box']), phase: 'ask', t: 0 }; scr = 'event'; return; }
  }
  function startFight(kind) {
    G.startBattle(kind);
    scr = 'battle'; busy = true; sel = null; lastTarget = null;
    document.body.classList.add('playing');
    BGM.play(kind === 'boss' ? 'boss' : 'battle');
    if (kind === 'boss') { SFX.play('roar'); UI.banner(T(G.B.foes[0].m.n[0], G.B.foes[0].m.n[1]), '#e8907a', 34, 1200); }
    G.wait(kind === 'boss' ? 900 : 300).then(() => G.startTurn());
  }
  function done() { G.nextFloor(); goMap(); }

  // ───────── 전투 화면 ─────────
  function handLayout() {
    const B = G.B, n = B.hand.length; if (!n) return;
    const left = 104, right = W - 140, span = right - left;
    const step = n > 1 ? Math.min(CW + 4, (span - CW) / (n - 1)) : 0;
    const tot = step * (n - 1);
    B.hand.forEach((hc, i) => {
      const isSel = sel === hc, isHov = hoverCard === hc && !isSel;
      hc.tx = (left + right) / 2 - tot / 2 + i * step;
      hc.ty = H - CH / 2 - 4 - (isSel ? 34 : isHov ? 10 : 0);
      hc.ts = isSel ? 1.28 : 1;
    });
  }
  function drawBattle(dt) {
    const B = G.B, p = B.p;
    drawBg(G.run.act);
    hud();
    const gy = GY();
    drawHero(UI.heroX(), gy, 2.6);
    bar(UI.heroX() - 45, gy + 4, 90, G.run.hp, G.run.max, '#a8c878', p.blk, 1);
    const extra = [];
    if (p.pw.charm) extra.push(['c_clover', p.pw.charm]); if (p.pw.thorns) extra.push(['u_thorn', p.pw.thorns]); if (p.pw.stance) extra.push(['c_shield', p.pw.stance]);
    if (p.pw.eye) extra.push(['c_eye', p.pw.eye]); if (p.pw.double) extra.push(['c_dice', 2]); if (p.pw.goddess) extra.push(['c_star', 1]); if (p.pw.phoenix && !p.revived) extra.push(['c_feather', 1]);
    if (p.pw.grit) extra.push(['u_str', '+' + p.pw.grit]); if (p.pw.omen) extra.push(['c_shield', p.pw.omen]); if (p.pw.fever) extra.push(['c_fire', p.pw.fever]); if (p.pw.barricade) extra.push(['c_shield', '∞']);
    if (p.bonus + p.turnBonus > 0) extra.push(['c_dice', '+' + (p.bonus + p.turnBonus)]);
    if (p.six) extra.push(['i_dice', '6x' + p.six]);
    statusRow(p.st, UI.heroX(), gy - 8, extra);
    B.foes.forEach(drawFoe);
    tray(GY() + 36);
    // 잎(네잎클로버)
    drawClover(48, H - 112, p.leaves, p.need);
    // 다음 주사위에 붙은 것: +n / 6 고정 / 최소 3
    { const tag = p.six ? '6' : p.floor3 ? '3+' : (p.bonus + p.turnBonus) ? '+' + (p.bonus + p.turnBonus) : '';
      if (tag) { const pul = 1 + Math.sin(G.time / 150) * 0.06; drawDie(36, H - 160, 22 * pul, p.six ? 6 : 4, 0); txt(tag, 66, H - 160, 15, '#e8c860', 'center'); } }
    // 기운
    drawEnergy(48, H - 50, p.en, p.enMax);
    txt(T('뽑기 ', 'DRAW ') + B.draw.length, 48, H - 14, 11, '#d8d0c8', 'center');
    // 턴 종료
    const ew = 112, eh = 40, ex = W - ew - 14, ey = H - eh - 16;
    const stuck = !busy && !B.over && !B.hand.some((h) => G.canPlay(h) && C[h.id].type !== 'curse');
    if (stuck) { const a = 0.45 + Math.sin(G.time / 150) * 0.35; ctx.fillStyle = `rgba(255,220,90,${a})`; ctx.fillRect(ex - 5, ey - 5, ew + 10, eh + 13); }
    button(ex, ey, ew, eh, T('턴 종료', 'END TURN'), () => endTurn(), { dis: busy || B.over, blue: 0, fs: 15 });
    txt(T('버린 ', 'DISCARD ') + B.disc.length, ex + ew / 2, ey - 10, 11, '#d8d0c8', 'center');
    // 손
    handLayout();
    const k = Math.min(1, dt / 70);
    B.hand.forEach((hc) => { hc.x += (hc.tx - hc.x) * k; hc.y += (hc.ty - hc.y) * k; hc.s = (hc.s || 1) + ((hc.ts || 1) - (hc.s || 1)) * k; });
    const order = B.hand.filter((h) => h !== sel); if (sel && B.hand.includes(sel)) order.push(sel);
    order.forEach((hc) => drawCard(hc.id, hc.x, hc.y, hc.s, { can: G.canPlay(hc), glow: sel === hc }));
    // 날아가는 카드
    ANIM.flyers = ANIM.flyers.filter((f) => (f.t += dt) < 380);
    ANIM.flyers.forEach((f) => { const t = f.t / 380; drawCard(f.hc.id, f.x + (W / 2 - f.x) * t, f.y + (150 - f.y) * t, 1.2 - t * 0.5, { a: 1 - t * t }); });
    // 고른 공격 카드가 노리는 적: 머리 위 화살표
    if (sel && C[sel.id].tgt && targetOf()) { const f = targetOf(), ax = UI.foeX(f), ay = UI.foeTop(f) - 34 + Math.sin(G.time / 120) * 3; ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.moveTo(ax - 9, ay - 7); ctx.lineTo(ax + 9, ay - 7); ctx.lineTo(ax, ay + 5); ctx.fill(); ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.moveTo(ax - 6, ay - 5); ctx.lineTo(ax + 6, ay - 5); ctx.lineTo(ax, ay + 2); ctx.fill(); }
  }
  function tray(y0) {
    ctx.fillStyle = '#161a10'; ctx.fillRect(0, y0 - 2, W, H - y0 + 2);
    ctx.fillStyle = '#4a5238'; ctx.fillRect(0, y0, W, H - y0);
    ctx.fillStyle = '#646c4a'; ctx.fillRect(0, y0, W, 2);
    ctx.fillStyle = '#c8b06a'; ctx.fillRect(0, y0 + 4, W, 1);
    ctx.fillStyle = '#2e3626'; ctx.fillRect(0, y0 + 7, W, H - y0 - 7);
    for (let x = 6; x < W; x += 42) { ctx.fillStyle = '#161a10'; ctx.fillRect(x, y0 + 1, 3, 3); ctx.fillStyle = '#a49c94'; ctx.fillRect(x, y0 + 1, 2, 2); }
    // 왼쪽(잎·에너지)·오른쪽(턴 종료) 칸 받침
    for (const [x, w] of [[8, 80], [W - 140, 132]]) { box(x, y0 + 12, w, H - y0 - 18, '#283020', '#161a10'); ctx.fillStyle = 'rgba(184,168,136,0.35)'; ctx.fillRect(x + 3, y0 + 14, w - 6, 1); }
  }
  function drawClover(x, y, n, need) {
    const pos = need === 3 ? [[0, -7], [-7, 4], [7, 4]] : [[-6, -6], [6, -6], [-6, 6], [6, 6]];
    const full = n >= need, pulse = full ? 1 + Math.sin(G.time / 120) * 0.08 : 1;
    if (full) { ctx.fillStyle = 'rgba(124,232,106,0.25)'; ctx.beginPath(); ctx.arc(x, y, 30 * pulse, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#161a10'; ctx.fillRect(x - 1, y + 4, 3, 16);
    ctx.fillStyle = '#1f8a4a'; ctx.fillRect(x, y + 5, 1, 14);
    pos.forEach((p, i) => {
      const on = i < n, cx = x + p[0] * pulse, cy = y + p[1] * pulse;
      ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.fill();
      ctx.fillStyle = on ? (full ? '#c4e09a' : '#7aac5e') : '#3a4230'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill();
      if (on) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx - 4, cy - 4, 3, 2); }
    });
    txt(full ? 'JACKPOT' : n + '/' + need, x, y - 24, full ? 12 : 11, full ? '#c4e09a' : '#d8d0c8', 'center');
  }
  function drawEnergy(x, y, en, max) {
    ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x + 24, y); ctx.lineTo(x, y + 26); ctx.lineTo(x - 24, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = en > 0 ? '#d08a50' : '#6e6864'; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 20, y); ctx.lineTo(x, y + 22); ctx.lineTo(x - 20, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = en > 0 ? '#ecc088' : '#a49c94'; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 20, y); ctx.lineTo(x, y - 4); ctx.lineTo(x - 20, y); ctx.closePath(); ctx.fill();
    txt(en + '/' + max, x, y + 2, 15, '#fff', 'center', { olw: 3.5 });
  }
  async function endTurn() {
    if (busy || !G.B || G.B.over) return;
    busy = true; sel = null; SFX.play('click');
    await G.enemyTurn();
  }
  async function playCard(hc, target) {
    if (busy) return;
    if (!G.canPlay(hc)) { SFX.play('deny'); UI.float(hc.x, hc.y - 70, T('에너지 부족', 'No energy'), '#e8907a'); return; }
    busy = true; if (target) lastTarget = target;
    try { await G.play(hc, target || targetOf()); } catch (e) { console.error(e); }
    if (G.B && !G.B.over) busy = false;
  }

  // ───────── 보상 ─────────
  function drawReward() {
    drawBg(G.run.act, 0.55); hud();
    const r = reward;
    txt(T('승리!', 'VICTORY!'), W / 2, 50, 30, '#e8c860', 'center');
    let y = 76;
    icon('u_coin', W / 2 - 40, y, 18); txt('+' + r.coins, W / 2 - 26, y + 1, 16, '#e8c860');
    if (r.relic) { const rl = D.RELICS[r.relic]; icon(rl.art, W / 2 + 30, y, 20); txt(T(rl.n[0], rl.n[1]), W / 2 + 44, y + 1, 13, '#fff'); txt(T(rl.d[0], rl.d[1]), W / 2 + 44, y + 15, 10, '#d8d0c8'); }
    if (!r.taken) {
      txt(T('카드 한 장', 'Pick a card'), W / 2, 104, 14, '#fff', 'center');
      r.cards.forEach((id, i) => {
        const x = W / 2 + (i - 1) * 112, y2 = 182, hov = Math.abs(mouse.x - x) < CW * 0.6 && Math.abs(mouse.y - y2) < CH * 0.6;
        drawCard(id, x, y2, hov ? 1.12 : 1.04, { glow: C[id].rare && Math.sin(G.time / 200) > 0 });
        hit(x - CW * 0.55, y2 - CH * 0.55, CW * 1.1, CH * 1.1, () => { SFX.play('card'); G.run.deck.push(id); r.taken = id; G.saveRun(); });
      });
      button(W / 2 - 60, H - 52, 120, 36, T('넘기기', 'SKIP'), () => { r.taken = 'skip'; }, { blue: 1, fs: 14 });
    } else {
      if (r.taken !== 'skip') { drawCard(r.taken, W / 2, 186, 1.1); txt(T('덱에 넣음', 'Added'), W / 2, 260, 13, '#a8c878', 'center'); }
      button(W / 2 - 70, H - 56, 140, 40, T('계속', 'CONTINUE'), () => afterReward());
    }
  }
  function afterReward() {
    SFX.play('click');
    if (reward.boss && G.run.act === D.ACTS.length - 1) return startEnding();
    G.B = null;
    if (reward.boss) UI.banner(T('다음 막', 'NEXT ACT'), '#e8c860', 30, 900);
    done();
  }

  // ───────── 보물 ─────────
  function drawChest(dt) {
    drawBg(G.run.act, 0.45); hud();
    const c = chest; c.t += dt;
    const cx = W / 2, cy = GY() - 10;
    spr(SP.get('n_chest'), cx, cy, 100 / SH(SP.get('n_chest')));
    if (!c.open) {
      txt(T('보물 상자', 'Treasure'), W / 2, 50, 22, '#e8c860', 'center');
      button(W / 2 - 70, cy + 16, 140, 40, T('열기', 'OPEN'), () => {
        c.open = true; SFX.play('capsule'); partBurst(cx, cy - 50, 40, ['#e8c860', '#f4e09a', '#ffffff'], 3);
        if (Math.random() < 0.6) { const r = G.rollRelic(); if (r) { G.gainRelic(r); c.res = { relic: r }; } else c.res = { coins: G.gainCoins(50) }; }
        else c.res = { coins: G.gainCoins(G.rnd(40, 60)) };
        G.saveRun();
      });
    } else {
      if (c.res.relic) { const rl = D.RELICS[c.res.relic]; icon(rl.art, cx, cy - 120, 48); txt(T(rl.n[0], rl.n[1]), cx, 56, 20, '#fff', 'center'); txt(T(rl.d[0], rl.d[1]), cx, 76, 13, '#e8c860', 'center'); }
      else { icon('u_coin', cx - 30, cy - 120, 32); txt('+' + c.res.coins, cx - 8, cy - 120, 24, '#e8c860'); }
      button(W / 2 - 70, cy + 16, 140, 40, T('계속', 'CONTINUE'), () => { SFX.play('click'); done(); });
    }
  }

  // ───────── 뽑기 ─────────
  const gachaPrice = () => 25 + G.run.gachaN * 15;
  function drawGacha(dt) {
    drawBg(G.run.act, 0.5); hud();
    const g = gacha; g.t += dt;
    const mx = W * 0.3, my = GY() + 10;
    txt(T('뽑기 기계', 'Gacha Machine'), mx, 50, 20, '#6ae8e8', 'center');
    const shake = g.phase === 'spin' ? Math.sin(G.time / 30) * 3 : 0;
    spr(SP.get('n_gacha'), mx + shake, my, 130 / SH(SP.get('n_gacha')));
    const price = gachaPrice(), can = G.run.coins >= price;
    if (g.phase === 'idle' || g.phase === 'shown') {
      button(W * 0.62 - 80, H * 0.74 - 96, 160, 42, T('뽑기', 'PULL'), () => pullGacha(), { dis: !can, sub: price + T(' 코인', ' coins') });
      button(W * 0.62 - 70, H * 0.74 - 30, 140, 34, T('떠나기', 'LEAVE'), () => { SFX.play('click'); done(); }, { blue: 1, fs: 14 });
      if (g.phase === 'idle') { txt(T('일반 70%', 'Card 70%'), W * 0.62, 70, 12, '#d8d0c8', 'center'); txt(T('금테 22%', 'Gold card 22%'), W * 0.62, 86, 12, '#e8c860', 'center'); txt(T('부적 8%', 'Charm 8%'), W * 0.62, 102, 12, '#c8a8d0', 'center'); }
    }
    if (g.phase === 'spin') { if (g.t > 900) { g.phase = 'pop'; g.t = 0; SFX.play(g.res.k === 'c' && !C[g.res.id].rare ? 'coin' : 'crit'); partBurst(W * 0.62, 100, 40, g.res.k === 'r' ? ['#c8a8d0', '#ffffff'] : g.res.k === 'g' ? ['#e8c860', '#ffffff'] : ['#d0dcd8', '#ffffff'], 3); } else { const cy = 60 + Math.min(1, g.t / 500) * 40; ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.arc(W * 0.62, cy, 22, 0, 7); ctx.fill(); ctx.fillStyle = g.res.k === 'r' ? '#9a7ab0' : g.res.k === 'g' ? '#e8c860' : '#a8c8d8'; ctx.beginPath(); ctx.arc(W * 0.62, cy, 19, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ece4d2'; ctx.beginPath(); ctx.arc(W * 0.62, cy, 19, 0, Math.PI); ctx.fill(); } }
    if (g.phase === 'pop' || g.phase === 'shown') {
      if (g.phase === 'pop' && g.t > 500) g.phase = 'shown';
      const r = g.res, a = Math.min(1, g.t / 300 + (g.phase === 'shown' ? 1 : 0));
      if (r.k === 'r') { const rl = D.RELICS[r.id]; icon(rl.art, W * 0.62, 90, 44); txt(T(rl.n[0], rl.n[1]), W * 0.62, 128, 16, '#fff', 'center'); txt(T(rl.d[0], rl.d[1]), W * 0.62, 146, 11, '#e8c860', 'center'); }
      else drawCard(r.id, W * 0.62, 104, 0.55 + 0.35 * a, { glow: C[r.id].rare });
    }
  }
  function pullGacha() {
    const price = gachaPrice(); if (G.run.coins < price) return;
    G.run.coins -= price; G.run.gachaN++;
    const x = Math.random(); let res;
    if (x < 0.08) { const r = G.rollRelic(); res = r ? { k: 'r', id: r } : { k: 'g', id: G.pick(D.RARE) }; }
    else if (x < 0.3) res = { k: 'g', id: G.pick(D.RARE) };
    else res = { k: 'c', id: G.pick(D.COMMON) };
    if (res.k === 'r') G.gainRelic(res.id); else { G.run.deck.push(res.id); G.see('c', res.id); }
    gacha.res = res; gacha.phase = 'spin'; gacha.t = 0; SFX.play('capsule'); G.saveRun();
  }

  // ───────── 모닥불 ─────────
  function drawRest() {
    drawBg(G.run.act, 0.55); hud();
    const cx = W / 2, gy = GY();
    spr(SP.get('n_rest'), cx, gy, 110 / SH(SP.get('n_rest')), { sy: 1 + Math.sin(G.time / 90) * 0.05 });
    spr(SP.get('hero'), cx - 100, gy, 2.2);
    txt(T('모닥불', 'Campfire'), W / 2, 50, 22, '#d08a50', 'center');
    if (Math.random() < 0.3) ANIM.parts.push({ x: cx + (Math.random() - 0.5) * 20, y: gy - 50, vx: (Math.random() - 0.5) * 0.5, vy: -1 - Math.random(), t: 0, life: 700, col: pickc(['#f4c860', '#dc7a3a']), s: 2, g: -0.01 });
    const heal = Math.round(G.run.max * 0.3);
    button(W / 2 - 160, gy + 18, 150, 42, T('쉬기', 'REST'), () => { G.heal(heal); done(); }, { green: 1, sub: '+' + heal + T(' 체력', ' HP') });
    button(W / 2 + 10, gy + 18, 150, 42, T('카드 지우기', 'REMOVE CARD'), () => { SFX.play('click'); deckScroll = 0; scrStack.push('rest'); scr = 'remove'; }, { blue: 1, dis: G.run.deck.length <= 5 });
  }

  // ───────── 운명(이벤트) ─────────
  const EVT = {
    roulette: { n: ['행운의 룰렛', 'Wheel of Luck'] },
    oddeven: { n: ['홀짝 고블린', 'Odd or Even'] },
    well: { n: ['소원 우물', 'Wishing Well'] },
    box: { n: ['수상한 상자', 'Suspicious Box'] },
  };
  const WHEEL = [
    { k: 'coin', v: 60, l: ['+60', '+60'], c: '#e8c860' }, { k: 'hurt', v: 10, l: ['-10', '-10'], c: '#b4483c' },
    { k: 'rare', l: ['금테', 'GOLD'], c: '#b08a3a' }, { k: 'none', l: ['꽝', 'MISS'], c: '#6e6864' },
    { k: 'heal', v: 20, l: ['+20', '+20'], c: '#7aac5e' }, { k: 'jinx', l: ['불운', 'JINX'], c: '#5a426e' },
    { k: 'relic', l: ['부적', 'CHARM'], c: '#9a7ab0' }, { k: 'coin', v: 25, l: ['+25', '+25'], c: '#e8c860' },
  ];
  function drawEvent(dt) {
    drawBg(G.run.act, 0.5); hud();
    const e = evt; e.t += dt;
    txt(T(EVT[e.id].n[0], EVT[e.id].n[1]), W / 2, 48, 22, '#c8a8d0', 'center');
    const cx = W * 0.32, cy = GY() - 60;
    if (e.id === 'roulette') {
      const n = WHEEL.length, R = 70;
      let ang = e.ang || 0;
      if (e.phase === 'spin') { const t = Math.min(1, e.t / 2200); ang = e.a0 + (e.a1 - e.a0) * (1 - Math.pow(1 - t, 3)); if (Math.floor(ang / ((Math.PI * 2) / n)) !== e.lastSeg) { e.lastSeg = Math.floor(ang / ((Math.PI * 2) / n)); SFX.play('tick'); } if (t >= 1) { e.phase = 'res'; e.ang = ang; applyWheel(e); } }
      ctx.save(); LT(); ctx.translate(cx, cy);
      ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.arc(0, 0, R + 5, 0, 7); ctx.fill();
      for (let i = 0; i < n; i++) { ctx.fillStyle = WHEEL[i].c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, ang + (i * Math.PI * 2) / n, ang + ((i + 1) * Math.PI * 2) / n); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#161a10'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
      for (let i = 0; i < n; i++) { const a = ang + ((i + 0.5) * Math.PI * 2) / n; txt(T(WHEEL[i].l[0], WHEEL[i].l[1]), cx + Math.cos(a) * R * 0.66, cy + Math.sin(a) * R * 0.66, 11, '#fff', 'center'); }
      ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#161a10'; ctx.beginPath(); ctx.moveTo(cx - 9, cy - R - 14); ctx.lineTo(cx + 9, cy - R - 14); ctx.lineTo(cx, cy - R + 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 6, cy - R - 12); ctx.lineTo(cx + 6, cy - R - 12); ctx.lineTo(cx, cy - R + 1); ctx.fill();
      if (e.phase === 'ask') { button(W * 0.66 - 75, H * 0.74 - 96, 150, 42, T('돌리기', 'SPIN'), () => { e.phase = 'spin'; e.t = 0; e.a0 = e.ang || 0; e.pick = G.rnd(0, n - 1); const seg = (Math.PI * 2) / n; e.a1 = Math.PI * 2 * 5 + (-Math.PI / 2 - (e.pick + 0.5) * seg) - ((e.a0 % (Math.PI * 2)) - e.a0); }); button(W * 0.66 - 65, H * 0.74 - 40, 130, 32, T('지나가기', 'PASS'), () => done(), { blue: 1, fs: 13 }); }
    } else if (e.id === 'oddeven') {
      spr(SP.get('goblin'), cx, GY(), 2.4, { flip: 1 });
      if (e.phase === 'ask') {
        const can = G.run.coins >= 20;
        txt(T('20 코인을 건다', 'Bet 20 coins'), W * 0.66, 92, 14, '#e8c860', 'center');
        button(W * 0.66 - 140, H * 0.74 - 96, 130, 42, T('홀', 'ODD'), () => betOE(1), { dis: !can });
        button(W * 0.66 + 10, H * 0.74 - 96, 130, 42, T('짝', 'EVEN'), () => betOE(0), { dis: !can });
        button(W * 0.66 - 65, H * 0.74 - 40, 130, 32, T('지나가기', 'PASS'), () => done(), { blue: 1, fs: 13 });
      }
    } else if (e.id === 'well') {
      ctx.fillStyle = '#161a10'; ctx.fillRect(cx - 46, cy + 6, 92, 50); ctx.fillStyle = '#6e6864'; ctx.fillRect(cx - 43, cy + 9, 86, 44);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) { ctx.fillStyle = (x + y) % 2 ? '#a49c94' : '#8a827a'; ctx.fillRect(cx - 42 + x * 17 + (y % 2) * 6, cy + 10 + y * 14, 15, 12); }
      ctx.fillStyle = '#2a56b0'; ctx.fillRect(cx - 38, cy + 4, 76, 6); ctx.fillStyle = '#a8c8d8'; ctx.fillRect(cx - 30 + Math.sin(G.time / 300) * 6, cy + 5, 14, 2);
      ctx.fillStyle = '#7e4a2a'; ctx.fillRect(cx - 44, cy - 50, 6, 56); ctx.fillRect(cx + 38, cy - 50, 6, 56); ctx.fillStyle = '#7c2c34'; ctx.fillRect(cx - 52, cy - 58, 104, 10);
      if (e.phase === 'ask') {
        button(W * 0.66 - 85, H * 0.74 - 96, 170, 42, T('코인 15 던지기', 'Toss 15 coins'), () => tossWell(), { dis: G.run.coins < 15 });
        button(W * 0.66 - 65, H * 0.74 - 40, 130, 32, T('지나가기', 'PASS'), () => done(), { blue: 1, fs: 13 });
      }
    } else if (e.id === 'box') {
      spr(SP.get(e.phase === 'res' && e.bad ? 'mimic' : 'n_chest'), cx, GY(), e.phase === 'res' && e.bad ? 2.7 : 100 / SH(SP.get('n_chest')));
      if (e.phase === 'ask') {
        button(W * 0.66 - 75, H * 0.74 - 96, 150, 42, T('열기', 'OPEN'), () => openBox());
        button(W * 0.66 - 65, H * 0.74 - 40, 130, 32, T('지나가기', 'PASS'), () => done(), { blue: 1, fs: 13 });
      }
    }
    if (e.phase === 'res') {
      if (e.msg) txt(e.msg, W * 0.66, 110, 18, e.col || '#fff', 'center');
      if (e.card) drawCard(e.card, W * 0.66, 186, 0.9);
      if (e.relic) { const rl = D.RELICS[e.relic]; icon(rl.art, W * 0.66, 170, 40); txt(T(rl.d[0], rl.d[1]), W * 0.66, 204, 11, '#e8c860', 'center'); }
      button(W * 0.66 - 70, H * 0.74 - 40, 140, 36, T('계속', 'CONTINUE'), () => done(), { fs: 14 });
    }
  }
  function applyWheel(e) {
    const w = WHEEL[e.pick], R = G.run;
    if (w.k === 'coin') { e.msg = '+' + G.gainCoins(w.v) + T(' 코인', ' coins'); e.col = '#e8c860'; SFX.play('coin'); }
    if (w.k === 'hurt') { R.hp = Math.max(1, R.hp - w.v); e.msg = '-' + w.v + T(' 체력', ' HP'); e.col = '#e8907a'; SFX.play('hurt'); }
    if (w.k === 'rare') { const c = G.pick(D.RARE); R.deck.push(c); G.see('c', c); e.card = c; e.msg = T('금테 카드!', 'Gold card!'); e.col = '#e8c860'; SFX.play('crit'); }
    if (w.k === 'none') { e.msg = T('꽝!', 'MISS!'); e.col = '#b4a68e'; SFX.play('miss'); }
    if (w.k === 'heal') { const v = Math.min(w.v, R.max - R.hp); R.hp += v; e.msg = '+' + w.v + T(' 체력', ' HP'); e.col = '#a8c878'; SFX.play('heal'); }
    if (w.k === 'jinx') { R.deck.push('jinx'); e.card = 'jinx'; e.msg = T('불운 카드...', 'A Jinx...'); e.col = '#9a7ab0'; SFX.play('poison'); }
    if (w.k === 'relic') { const r = G.rollRelic(); if (r) { G.gainRelic(r); e.relic = r; e.msg = T(D.RELICS[r].n[0], D.RELICS[r].n[1]); e.col = '#c8a8d0'; SFX.play('crit'); } else { e.msg = '+' + G.gainCoins(60); e.col = '#e8c860'; } }
    G.saveRun();
  }
  async function betOE(odd) {
    if (busy) return; busy = true;
    G.run.coins -= 20; const r = G.rnd(1, 6);
    await UI.rollDie(r);
    const win = (r % 2 === 1) === !!odd;
    if (win) { G.run.coins += 40; evt.msg = T('맞혔다! +40 코인', 'Win! +40 coins'); evt.col = '#e8c860'; SFX.play('coin'); }
    else { evt.msg = T('졌다... -20 코인', 'Lost... -20 coins'); evt.col = '#b4a68e'; SFX.play('miss'); }
    evt.phase = 'res'; busy = false; G.saveRun();
  }
  async function tossWell() {
    if (busy) return; busy = true;
    G.run.coins -= 15; SFX.play('coin');
    const r = G.rnd(1, 6); await UI.rollDie(r);
    if (r === 6) { const rl = G.rollRelic(); if (rl) { G.gainRelic(rl); evt.relic = rl; evt.msg = T(D.RELICS[rl].n[0], D.RELICS[rl].n[1]); evt.col = '#c8a8d0'; } else { evt.msg = '+60'; G.gainCoins(60); } SFX.play('jackpot'); }
    else if (r >= 4) { const c = G.pick(D.RARE); G.run.deck.push(c); G.see('c', c); evt.card = c; evt.msg = T('금테 카드!', 'Gold card!'); evt.col = '#e8c860'; SFX.play('crit'); }
    else if (r >= 2) { const v = Math.min(12, G.run.max - G.run.hp); G.run.hp += v; evt.msg = T('+12 체력', '+12 HP'); evt.col = '#a8c878'; SFX.play('heal'); }
    else { evt.msg = T('꽝!', 'MISS!'); evt.col = '#b4a68e'; SFX.play('miss'); }
    evt.phase = 'res'; busy = false; G.saveRun();
  }
  function openBox() {
    if (Math.random() < 0.5) { const r = G.rollRelic(); if (r) { G.gainRelic(r); evt.relic = r; evt.msg = T(D.RELICS[r].n[0], D.RELICS[r].n[1]); } else { evt.msg = '+50'; G.gainCoins(50); } evt.col = '#c8a8d0'; SFX.play('crit'); partBurst(W * 0.32, GY() - 40, 30, ['#e8c860', '#fff']); }
    else { evt.bad = 1; G.run.hp = Math.max(1, G.run.hp - 10); G.run.deck.push('jinx'); evt.card = 'jinx'; evt.msg = T('미믹이다! -10 체력', 'Mimic! -10 HP'); evt.col = '#e8907a'; SFX.play('hurt'); ANIM.shake = 8; }
    evt.phase = 'res'; G.saveRun();
  }

  // ───────── 카드 목록(덱 보기·지우기) ─────────
  function drawDeckList(mode) {
    if (!G.run) { scr = 'title'; scrStack.length = 0; return; }
    drawBg(G.run.act, 0.75);
    const list = G.run.deck.map((id, i) => ({ id, i })).sort((a, b) => (C[a.id].type + a.id).localeCompare(C[b.id].type + b.id));
    txt(mode === 'remove' ? T('지울 카드', 'Remove a card') : T('내 덱 ', 'My deck ') + list.length, padL + 6, 18, 16, '#fff');
    const cols = Math.max(4, Math.floor((W - 40) / 96)), sc = 0.78, cw = CW * sc + 10, ch = CH * sc + 10;
    const x0 = W / 2 - (cols * cw) / 2 + cw / 2, y0 = 44 + ch / 2 - deckScroll;
    const rows = Math.ceil(list.length / cols); maxScroll = Math.max(0, rows * ch - (H - 70));
    ctx.save(); ctx.beginPath(); LT(); ctx.rect(0, 36, W, H - 36); ctx.clip();
    list.forEach((e, k) => {
      const x = x0 + (k % cols) * cw, y = y0 + Math.floor(k / cols) * ch;
      if (y < -ch || y > H + ch) return;
      drawCard(e.id, x, y, sc);
      if (mode === 'remove') hit(x - cw / 2, Math.max(36, y - ch / 2), cw, ch, () => { G.run.deck.splice(e.i, 1); SFX.play('hurt'); partBurst(x, y, 20, ['#dc7a3a', '#f4c860']); scrStack.pop(); done(); });
    });
    ctx.restore();
    button(W - padR - 100, 4, 92, 26, mode === 'remove' ? T('취소', 'CANCEL') : T('닫기', 'CLOSE'), () => { SFX.play('click'); scr = scrStack.pop() || 'map'; }, { blue: 1, fs: 12 });
  }
  let maxScroll = 0;

  // ───────── 상점(영구 강화) ─────────
  function drawShop() {
    drawBg(0, 0.6);
    txt(T('행운 상점', 'Lucky Shop'), W / 2, 30, 24, '#e8c860', 'center');
    icon('u_coin', W / 2 - 30, 56, 18); txt(String(G.meta.bank), W / 2 - 17, 57, 16, '#e8c860');
    const rw = Math.min(520, W - 80), x = W / 2 - rw / 2;
    D.SHOP.forEach((s, i) => {
      const y = 74 + i * 40, lv = G.meta.up[s.id], max = s.cost.length, cost = s.cost[lv];
      box(x, y, rw, 34, '#283020', '#161a10', 'rgba(255,255,255,0.08)');
      txt(T(s.n[0], s.n[1]), x + 12, y + 17, 14, '#fff');
      for (let k = 0; k < max; k++) { box(x + rw * 0.48 + k * 16, y + 11, 12, 12, k < lv ? '#e8c860' : '#3a4230', '#161a10'); }
      if (lv >= max) txt('MAX', x + rw - 60, y + 17, 14, '#a8c878', 'center');
      else button(x + rw - 108, y + 4, 100, 26, String(cost), () => { if (G.meta.bank >= cost) { G.meta.bank -= cost; G.meta.up[s.id]++; G.saveMeta(); SFX.play('coin'); partBurst(x + rw - 58, y + 17, 16, ['#e8c860', '#fff']); } }, { dis: G.meta.bank < cost, fs: 13 });
    });
    button(W / 2 - 60, H - 46, 120, 34, T('닫기', 'CLOSE'), () => { SFX.play('click'); scr = 'title'; }, { blue: 1, fs: 14 });
  }

  // ───────── 도감 ─────────
  function drawDex() {
    drawBg(1, 0.6);
    const dp = G.dexPct();
    txt(T('도감 ', 'Collection ') + dp.a + '/' + dp.all + ' (' + dp.pct + '%)', padL + 6, 18, 15, '#fff');
    const tabs = [['c', T('카드', 'Cards')], ['r', T('부적', 'Charms')], ['m', T('괴물', 'Monsters')]];
    tabs.forEach((t, i) => button(padL + 6 + i * 84, 34, 78, 26, t[1], () => { dexTab = t[0]; dexScroll = 0; dexPick = null; SFX.play('click'); }, { blue: dexTab !== t[0], fs: 12 }));
    const s = G.meta.seen;
    const ids = dexTab === 'c' ? D.DEXCARDS : dexTab === 'r' ? Object.keys(D.RELICS) : D.DEXMON;
    const cell = dexTab === 'c' ? 64 : 72, cols = Math.max(5, Math.floor((W - 40) / cell));
    const x0 = W / 2 - (cols * cell) / 2 + cell / 2, y0 = 74 + cell / 2 - dexScroll;
    maxScroll = Math.max(0, Math.ceil(ids.length / cols) * cell - (H - 120));
    ctx.save(); LT(); ctx.beginPath(); ctx.rect(0, 66, W, H - 116); ctx.clip();
    ids.forEach((id, k) => {
      const x = x0 + (k % cols) * cell, y = y0 + Math.floor(k / cols) * cell, seen = s[dexTab][id];
      box(x - cell / 2 + 3, y - cell / 2 + 3, cell - 6, cell - 6, dexPick === id ? '#4a4264' : '#231e38', '#161a10');
      const art = dexTab === 'c' ? C[id].art : dexTab === 'r' ? D.RELICS[id].art : D.MON[id].spr;
      const img = seen ? SP.get(art) : SP.black(art);
      const sc = (cell - 18) / Math.max(SW(img), SH(img));
      spr(img, x, y + (SH(img) * sc) / 2, sc);
      if (dexTab === 'c' && seen && C[id].rare) { ctx.fillStyle = '#e8c860'; ctx.fillRect(x + cell / 2 - 10, y - cell / 2 + 6, 4, 4); }
      if (!seen) txt('?', x, y, 18, '#8a80a0', 'center');
      hit(x - cell / 2, Math.max(66, y - cell / 2), cell, cell, () => { dexPick = id; SFX.play('click'); });
    });
    ctx.restore();
    if (dexPick) {
      const seen = s[dexTab][dexPick];
      let nm = '?', ds = '';
      if (seen) {
        if (dexTab === 'c') { nm = T(C[dexPick].n[0], C[dexPick].n[1]); ds = T(C[dexPick].d[0], C[dexPick].d[1]).replace(/\n/g, ' '); }
        else if (dexTab === 'r') { nm = T(D.RELICS[dexPick].n[0], D.RELICS[dexPick].n[1]); ds = T(D.RELICS[dexPick].d[0], D.RELICS[dexPick].d[1]); }
        else { const m = D.MON[dexPick]; nm = T(m.n[0], m.n[1]); ds = T('체력 ', 'HP ') + m.hp[0] + (m.boss ? T(' 보스', ' BOSS') : m.elite ? T(' 정예', ' ELITE') : ''); }
      }
      box(20, H - 46, W - 170, 36, '#283020', '#161a10');
      txt(nm, 32, H - 28, 14, '#e8c860'); txt(ds, 40 + tw(nm, 14), H - 28, 12, '#fff');
    }
    if (dp.pct >= 100) txt(T('도감 완성!', 'COMPLETE!'), W - padR - 70, 18, 14, '#a8c878', 'center');
    button(W - 130, H - 44, 112, 34, T('닫기', 'CLOSE'), () => { SFX.play('click'); scr = 'title'; }, { blue: 1, fs: 14 });
  }

  // ───────── GAME OVER ─────────
  function drawOver(dt) {
    drawBg(G.lastRun ? G.lastRun.act : 0, 0.7);
    over.t += dt;
    txt('GAME OVER', W / 2, H * 0.24, 48, '#b4483c', 'center', { olw: 9 });
    const R = G.lastRun;
    if (R) txt(T((R.act + 1) + '막 ' + R.floor + '층', 'Act ' + (R.act + 1) + ' Floor ' + R.floor), W / 2, H * 0.24 + 40, 15, '#d8d0c8', 'center');
    icon('u_coin', W / 2 - 40, H * 0.24 + 66, 18); txt('+' + over.add, W / 2 - 26, H * 0.24 + 67, 18, '#e8c860');
    const y = H * 0.74 - 60;
    button(W / 2 - 160, y, 150, 42, 'RETRY', () => startNew());
    button(W / 2 + 10, y, 150, 42, T('상점', 'SHOP'), () => { SFX.play('click'); scr = 'shop'; }, { blue: 1 });
  }

  // ───────── 엔딩 ─────────
  const END_LINES = [
    ['demonlord', ['내가... 주사위 따위에...', 'Defeated... by dice...?']],
    ['hero', ['운도 실력이다.', 'Luck is a skill too.']],
  ];
  const TRUE_LINES = [
    ['hero', ['...주사위가 따뜻하다.', '...the die feels warm.']],
    ['demonlord', ['그 눈빛... 행운의 신이 깃들었구나.', 'Those eyes... the God of Luck dwells in you.']],
  ];
  function startEnding() {
    const dp = G.dexPct();
    const tru = dp.pct >= 100;
    const R = G.run;
    ending = { i: 0, t: 0, tru, lines: tru ? END_LINES.concat(TRUE_LINES) : END_LINES, stats: Object.assign({}, R.stats), dex: dp.pct, deck: R.deck.length, relics: R.relics.length, hp: R.hp, max: R.max };
    G.meta.ends++; if (tru) G.meta.trueEnd++;
    ending.add = G.endRun(true);
    G.B = null; scr = 'ending'; BGM.play('title'); document.body.classList.remove('playing');
  }
  function drawEnding(dt) {
    const e = ending; e.t += dt;
    drawBg(2, e.i >= e.lines.length ? 0.7 : 0);
    const gy = GY();
    if (e.i < e.lines.length) { drawHero(W * 0.32, gy, 2.6); spr(SP.get('demonlord'), W * 0.7, gy + 10, 2.1, { rot: -0.25, a: 0.9 }); }
    if (e.tru) for (let i = 0; i < 2; i++) if (Math.random() < 0.3) ANIM.parts.push({ x: W * 0.32 + (Math.random() - 0.5) * 60, y: gy - Math.random() * 100, vx: 0, vy: -0.6, t: 0, life: 900, col: pickc(['#a8c878', '#e8c860', '#ffffff']), s: 2, g: -0.01 });
    if (e.i < e.lines.length) {
      const [who, l] = e.lines[e.i];
      const x = who === 'hero' ? W * 0.32 : W * 0.7;
      const s = T(l[0], l[1]), w = Math.min(W * 0.5, tw(s, 15) + 30);
      box(x - w / 2, 54, w, 38, '#e8dec6', '#161a10');
      ctx.fillStyle = '#161a10'; ctx.fillRect(x - 4, 92, 8, 6); ctx.fillStyle = '#e8dec6'; ctx.fillRect(x - 2, 90, 4, 5);
      txt(s, x, 73, 15, '#2a1a24', 'center', { ol: 0 });
      hit(0, 0, W, H, () => { SFX.play('click'); e.i++; e.t = 0; if (e.i >= e.lines.length) { resultCv = makeResultCard(e); } });
      txt('▶', W - 30, H - 24, 14, '#fff', 'center');
    } else drawResult();
  }

  // 결과표(1080x1350) — 저장·공유
  function titleOf(e) {
    const s = e.stats;
    if (e.tru) return T('행운의 신', 'God of Luck');
    if (s.jack >= 12) return T('잭팟 제조기', 'Jackpot Machine');
    if (s.miss >= 45) return T('억까를 이긴 용사', 'Hero Beyond Bad Luck');
    if (s.rolls && s.crit / s.rolls > 0.28) return T('천운의 용사', 'Heaven-Blessed Hero');
    if (s.maxHit >= 80) return T('한 방의 용사', 'One-Shot Hero');
    return T('운빨용사', 'Lucky Hero');
  }
  function makeResultCard(e) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const bgI = SP.bg(2); g.drawImage(bgI, (bgI.width - 270) / 2, 0, 270, 180, 0, 0, 1080, 720);
    g.fillStyle = '#0e0a16'; g.fillRect(0, 700, 1080, 650);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const T2 = (s, x, y, size, col, al) => { g.font = `${size}px ${FONT}`; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size / 5; g.strokeStyle = '#161a10'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); };
    const hi = SP.get('hero'), hw = SW(hi), hh = SH(hi); g.drawImage(hi, 300 - hw * 4, 690 - hh * 8, hw * 8, hh * 8);
    const di = SP.get('demonlord'); g.save(); g.translate(790, 690); g.rotate(-0.25); g.globalAlpha = 0.9; g.drawImage(di, -SW(di) * 2.6, -SH(di) * 5.2, SW(di) * 5.2, SH(di) * 5.2); g.restore();
    let rts = 104;
    // shrink the card title so title + heart stay inside the card
    if (JA || PR) { g.font = `${rts}px ${FONT}`; while (g.measureText(T('용사님!럭키', 'LUCKY HERO')).width > 840 && rts > 60) g.font = `${--rts}px ${FONT}`; }
    T2(T('용사님!럭키', 'LUCKY HERO'), 500, 110, rts, '#e8c860');
    { g.font = `${rts}px ${FONT}`; const tw2 = g.measureText(T('용사님!럭키', 'LUCKY HERO')).width, hi2 = SP.get('c_heart'); g.drawImage(hi2, 500 + tw2 / 2 + 14, 110 - 46, 92, 92 * SH(hi2) / SW(hi2)); }
    T2(e.tru ? T('진 엔딩 · 행운의 신', 'TRUE ENDING') : T('엔딩 · 마왕 토벌', 'ENDING · Demon Lord Defeated'), 540, 210, 46, e.tru ? '#a8c878' : '#ffffff');
    // 숫자
    g.fillStyle = '#e8c860'; g.fillRect(90, 760, 900, 6);
    const s = e.stats, mins = Math.max(1, Math.round(s.ms / 60000));
    const rows = [[T('잭팟', 'Jackpots'), s.jack], [T('대박', 'Crits'), s.crit], [T('꽝', 'Misses'), s.miss], [T('최고 한 방', 'Best hit'), s.maxHit], [T('걸린 시간', 'Time'), mins + T('분', ' min')], [T('도감', 'Collection'), e.dex + '%']];
    rows.forEach((r, i) => { const x = i % 2 ? 600 : 110, y = 830 + Math.floor(i / 2) * 110; T2(r[0], x, y, 44, '#d8d0c8', 'left'); T2(String(r[1]), x + 380, y, 60, '#ffffff', 'right'); });
    g.fillStyle = '#e8c860'; g.fillRect(90, 1150, 900, 6);
    T2(titleOf(e), 540, 1215, 66, '#e8c860');
    T2('oreumgames.com', 540, 1305, 34, '#a8c8d8');
    return c;
  }
  function drawResult() {
    const e = ending, c = resultCv; if (!c) return;
    // 왼쪽 카드, 오른쪽 단추
    const ch = H - 30, cw = (ch * 1080) / 1350, x = Math.max(16, W * 0.3 - cw / 2), y = 15;
    ctx.save(); LT(); ctx.imageSmoothingEnabled = true; ctx.fillStyle = '#161a10'; ctx.fillRect(x - 3, y - 3, cw + 6, ch + 6); ctx.drawImage(c, x, y, cw, ch); ctx.restore();
    const bx = Math.min(W - 190, x + cw + 40), by = 40;
    txt(T(e.tru ? '진 엔딩' : '엔딩', e.tru ? 'TRUE ENDING' : 'ENDING'), bx + 85, by, 26, e.tru ? '#a8c878' : '#e8c860', 'center');
    icon('u_coin', bx + 50, by + 34, 18); txt('+' + e.add, bx + 64, by + 35, 16, '#e8c860');
    button(bx, by + 60, 170, 40, T('저장', 'SAVE'), () => saveCard());
    button(bx, by + 110, 170, 40, T('공유', 'SHARE'), () => shareCard(), { blue: 1 });
    button(bx, by + 160, 170, 40, T('타이틀', 'TITLE'), () => { SFX.play('click'); scr = 'title'; ending = null; }, { blue: 1 });
  }
  function saveCard() {
    SFX.play('click');
    try { const a = document.createElement('a'); a.download = 'luckhero.png'; a.href = resultCv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); } catch (e) { }
  }
  function shareUrl() { return ZH ? 'https://oreumgames.com/zh/games/mini/luckhero/' : EN || JA || PR ?'https://oreumgames.com/en/games/mini/luckhero/' : 'https://oreumgames.com/games/mini/luckhero/'; }
  function shareCard() {
    SFX.play('click');
    const e = ending, text = T('용사님!럭키♥ ' + titleOf(e) + ' 잭팟 ' + e.stats.jack + '번', 'LUCKY HERO ' + titleOf(e) + ' ' + e.stats.jack + ' jackpots');
    if (navigator.share) navigator.share({ title: T('용사님!럭키♥', 'LUCKY HERO'), text, url: shareUrl() }).catch(() => { });
    else { try { navigator.clipboard.writeText(text + ' ' + shareUrl()); } catch (er) { } toast = { s: T('주소를 복사했습니다', 'Link copied'), t: 0 }; }
  }

  // ───────── HOW TO PLAY ─────────
  let howT = 0, howNext = null;
  function drawHow(dt) {
    howT += dt;
    if (G.run) drawBg(G.run.act, 0.75); else drawBg(0, 0.75);
    const tbEl = document.getElementById('tb'), tbB = tbEl ? (tbEl.getBoundingClientRect().bottom * DPR) / S : 0;   // 오른쪽 위 단추 줄 아래에서 창을 시작(OK 가 안 가리게)
    const pbot = innerHeight <= 480 ? H * 0.74 - 4 : H - 14;   // 폰 가로: 안드로이드 전체화면 알림(아래 26%) 위에서 끝나게
    const py = Math.max(20, tbB + 6), pw = Math.min(W - 40, 620), ph = pbot - py, px = W / 2 - pw / 2;
    panel(px, py, pw, ph);
    txt('HOW TO PLAY', px + 18, py + 22, 18, '#e8c860');
    button(px + pw - 90, py + 8, 76, 28, 'OK', () => { SFX.play('click'); if (howNext === 'map') goMap(); else scr = howNext || 'title'; howNext = null; }, { fs: 14 });
    const cw = (pw - 46) / 4, cy = py + 48, chh = ph - 64;
    const L = [
      [T('카드를 두 번 누르면 쓴다. 주황 다이아가 에너지', 'Tap a card twice to play. Orange gem = energy')],
      [T('적 머리 위가 다음 행동. 칼 숫자만큼 때린다', 'Icon over enemy = its next move')],
      [T('주사위 1은 꽝, 6은 대박 x2', 'DIE: 1 = MISS, 6 = CRIT x2')],
      [T('꽝마다 잎 하나, 네 잎이면 잭팟 x3', 'Each MISS = 1 leaf. 4 leaves = JACKPOT x3')],
    ];
    for (let i = 0; i < 4; i++) {
      const x = px + 14 + i * (cw + 6);
      box(x, cy, cw, chh, '#283020', '#161a10');
      // 창이 낮으면(폰 가로) 그림만 S 를 줄여 작게 그린다: 좌표를 f 로 나누고 S 에 f 를 곱하면 (ax, ay) 둘레로 줄어든다
      const f = Math.min(1, (chh - 52) / 143), S0 = S;
      const ay0 = f < 1 ? cy + (chh - 52) / 2 - 5.5 * f : cy + chh * 0.4;
      S = S0 * f; LT();
      const ax = (x + cw / 2) / f, ay = ay0 / f, t = (howT / 1000) % 3;
      if (i === 0) {
        spr(SP.get('slime'), ax + 34, ay + 30, 1.1); drawEnergy(ax - 40, ay - 40, t >= 1.2 ? 2 : 3, 3);
        const tap = t < 0.6 ? 0 : t < 1.2 ? 1 : 2;
        const cyy = tap === 0 ? ay + 40 : tap === 1 ? ay + 20 : ay + 20 - (t - 1.2) * 60;
        if (t < 1.8) drawCard('slash', ax - 22 + (tap === 2 ? (t - 1.2) * 90 : 0), cyy, 0.6, { a: tap === 2 ? 1 - (t - 1.2) / 0.6 : 1, glow: tap > 0 });
        else { txt('9', ax + 34, ay - 10 - (t - 1.8) * 20, 18, '#fff', 'center'); }
        if (t > 0.3 && t < 0.6 || t > 0.9 && t < 1.2) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(ax - 22, ay + 30, 8, 0, 7); ctx.fill(); }
      } else if (i === 1) {
        spr(SP.get('slime'), ax + 18, ay + 34, 1.3);
        icon('c_sword', ax + 6, ay - 18 + Math.sin(howT / 200) * 2, 18); txt('6', ax + 20, ay - 17, 15, '#e8907a');
        spr(SP.get('hero'), ax - 30, ay + 34, 1.1);
        if (t > 1.5) { icon('u_shield', ax - 30, ay - 14, 22); txt('6', ax - 30, ay - 13, 12, '#fff', 'center'); }
      } else if (i === 2) {
        const f = t < 1.5 ? (t < 0.8 ? 1 + (Math.floor(howT / 90) % 6) : 1) : (t < 2.3 ? 1 + (Math.floor(howT / 90) % 6) : 6);
        drawDie(ax, ay, 44, f, (t < 0.8 || (t > 1.5 && t < 2.3)) ? Math.sin(howT / 60) * 0.4 : 0, { done: 1 });
        if (t >= 0.8 && t < 1.5) txt(T('꽝!', 'MISS!'), ax, ay + 42, 20, '#b4a68e', 'center');
        if (t >= 2.3) txt(T('대박 x2', 'CRIT x2'), ax, ay + 42, 20, '#e8c860', 'center');
      } else {
        const n = Math.min(4, Math.floor(t / 0.55));
        drawClover(ax, ay, n, 4);
        if (n >= 4) txt('JACKPOT x3', ax, ay + 40, 18, '#a8c878', 'center');
      }
      S = S0; LT();
      const lines = wrap(L[i][0], 12, cw - 12);
      lines.forEach((l, k) => txt(l, x + cw / 2, cy + chh - 16 - (lines.length - 1 - k) * 16, 12, '#fff', 'center'));
    }
  }

  // ───────── 멈춤 ─────────
  let paused = false;
  let pauseFrom = 0;
  function drawPause() {
    pauseFrom = btns.length;
    ctx.fillStyle = 'rgba(10,6,20,0.7)'; ctx.fillRect(0, 0, W, H);
    txt(T('일시정지', 'PAUSED'), W / 2, H * 0.25, 30, '#fff', 'center');
    button(W / 2 - 80, H * 0.36, 160, 40, T('계속', 'RESUME'), () => { paused = false; SFX.play('click'); });
    button(W / 2 - 80, H * 0.36 + 52, 160, 36, T('타이틀', 'TITLE'), () => { paused = false; SFX.play('click'); if (G.run && scr !== 'battle') G.saveRun(); if (scr === 'battle') { /* 전투는 그 층 처음부터 */ } scr = 'title'; BGM.play('title'); document.body.classList.remove('playing'); G.B = null; busy = false; }, { blue: 1, fs: 14 });
  }

  // ───────── 고리 ─────────
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    step(dt);
    requestAnimationFrame(frame);
  }
  // 왼쪽 위 OREUM GAMES 알약·오른쪽 위 단추 줄의 실제 크기를 재서 HUD 가 그 밖에 오게(폰마다 글자 크기가 달라 고정값으로는 겹친다)
  function measurePads() {
    const a = document.getElementById('oreumHome'), tb = document.getElementById('tb');
    const ar = a ? a.getBoundingClientRect() : null, tr = tb ? tb.getBoundingClientRect() : null;
    padL = (Math.max(104, ar && ar.width ? ar.right + 10 : 0) * DPR) / S;
    padR = (Math.max(178, tr && tr.width ? innerWidth - tr.left + 10 : 0) * DPR) / S;
  }
  function step(dt) {
    measurePads();
    let gdt = dt;
    if (ANIM.stop > 0) { ANIM.stop -= dt; gdt = dt * 0.12; }
    if (!paused) G.tickTime(gdt);
    if (G.run && !paused && ['map', 'battle', 'reward', 'gacha', 'rest', 'event', 'chest'].includes(scr)) G.run.stats.ms += dt;
    btns = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0e0a16'; ctx.fillRect(0, 0, cv.width, cv.height);
    // 흔들기
    const sh = ANIM.shake > 0.3 ? ANIM.shake : 0; ANIM.shake *= 0.86;
    LT(); if (sh) ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    const base = ctx.getTransform();
    const k = dt / 1000;
    hero.lunge = Math.max(0, hero.lunge - k * 5); hero.hurt = Math.max(0, hero.hurt - k * 4); hero.flash = Math.max(0, hero.flash - k * 6); hero.trip = Math.max(0, hero.trip - k * 1.4);
    if (G.B) G.B.foes.forEach((f) => { f.lunge = f.lunge > 0 ? Math.max(0, f.lunge - k * 5) : Math.min(0, f.lunge + k * 4); f.flash = Math.max(0, f.flash - k * 6); f.hurtT = Math.max(0, f.hurtT - k * 4); f.trip = Math.max(0, (f.trip || 0) - k * 1.4); if (f.dead > 0 && f.dead < 1) f.dead = Math.min(1, f.dead + k * 1.6); });
    const sx = (S_tr) => S_tr;
    switch (scr) {
      case 'title': drawTitle(); break;
      case 'map': drawMap(); break;
      case 'battle': if (G.B) drawBattle(dt); break;
      case 'reward': drawReward(); break;
      case 'chest': drawChest(dt); break;
      case 'gacha': drawGacha(dt); break;
      case 'rest': drawRest(); break;
      case 'event': drawEvent(dt); break;
      case 'deck': drawDeckList('view'); break;
      case 'remove': drawDeckList('remove'); break;
      case 'shop': drawShop(); break;
      case 'dex': drawDex(); break;
      case 'over': drawOver(dt); break;
      case 'ending': drawEnding(dt); break;
      case 'how': drawHow(dt); break;
    }
    ctx.setTransform(base);
    drawFX(dt);
    // 주사위
    if (die) {
      die.t += paused ? 0 : dt;
      const x = die.foe ? UI.foeX(die.foe) : W / 2, y = die.foe ? UI.foeTop(die.foe) - 40 : Math.min(130, GY() - 90);
      const roll = 520;
      if (die.t < roll) { const t = die.t / roll; if (Math.floor(die.t / 60) !== die.lt) { die.lt = Math.floor(die.t / 60); die.face = 1 + Math.floor(Math.random() * 6); SFX.play('tick'); } drawDie(x, y - Math.abs(Math.sin(t * Math.PI * 2)) * 24 * (1 - t), 50, die.face, (1 - t) * 6 * t); }
      else {
        if (!die.landed) {
          die.landed = 1; SFX.play('land');
          const c = die.r === 7 ? '#c4e09a' : die.r === 6 ? '#ffd060' : die.r === 1 ? '#948c88' : '#ffffff';
          fx({ k: 'ring', x, y, r0: 20, r1: die.r >= 6 ? 110 : 60, col: c, w: die.r >= 6 ? 8 : 4, life: 380 });
          parts(die.r >= 6 ? 26 : 10, { x, y: y + 20, cols: [c, '#ffffff'], sp: die.r >= 6 ? 4 : 2, s: 3, life: 500, g: 0.12, extra: { shape: die.r >= 6 ? 'star' : 'sq', glow: die.r >= 6 ? 1 : 0 } });
          die.res();
        }
        const a = die.t < roll + 700 ? 1 : 1 - (die.t - roll - 700) / 300;
        if (a <= 0) die = null; else { if (die.r >= 6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, 60); g.addColorStop(0, die.r === 7 ? 'rgba(196,224,154,0.7)' : 'rgba(255,208,96,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - 60, y - 60, 120, 120); ctx.restore(); } ctx.globalAlpha = a; drawDie(x, y, 50 + (die.r >= 6 ? Math.sin(die.t / 60) * 2 : 0), die.r, 0, { done: 1 }); ctx.globalAlpha = 1; }
      }
    }
    if (coin) {
      coin.t += dt; const x = W / 2, y = 120, t = coin.t / 700;
      if (t < 1) { const w = Math.abs(Math.cos(coin.t / 40)) * 22; ctx.fillStyle = '#161a10'; ctx.fillRect(x - w - 2, y - 24 - Math.sin(t * Math.PI) * 40, w * 2 + 4, 48); ctx.fillStyle = '#e8c860'; ctx.fillRect(x - w, y - 22 - Math.sin(t * Math.PI) * 40, w * 2, 44); }
      else { if (!coin.done) { coin.done = 1; SFX.play('land'); coin.res(); } icon('c_coin', x, y, 48); txt(coin.heads ? T('앞면', 'HEADS') : T('뒷면', 'TAILS'), x, y + 36, 16, coin.heads ? '#e8c860' : '#b4a68e', 'center'); if (t > 2) coin = null; }
    }
    drawFX(0, true);
    // 입자
    ANIM.parts = ANIM.parts.filter((p) => (p.t += dt) < p.life);
    for (const p of ANIM.parts) {
      if (p.tx !== undefined && p.t > (p.delay || 0)) {
        p.x += (p.tx - p.x) * Math.min(1, dt / 90); p.y += (p.ty - p.y) * Math.min(1, dt / 90);
        if (Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 6) { p.t = p.life; if (p.arrive) { fx({ k: 'ring', x: p.tx, y: p.ty, r0: 6, r1: 30, col: '#c4e09a', w: 3, life: 260 }); } continue; }
      } else { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += p.g * dt / 16; }
      p.rot = (p.rot || 0) + (p.vr || 0) * dt / 16;
      const al = p.tx !== undefined ? 1 : Math.min(1, 1.6 - (p.t / p.life) * 1.6);
      ctx.globalAlpha = al; ctx.fillStyle = p.col;
      if (p.glow) ctx.globalCompositeOperation = 'lighter';
      const s = p.s, x = Math.round(p.x), y = Math.round(p.y);
      if (p.coin) { ctx.fillStyle = '#161a10'; ctx.fillRect(x - 3, y - 3, 7, Math.max(2, Math.abs(Math.cos(p.t / 60)) * 7)); ctx.fillStyle = p.col; ctx.fillRect(x - 2, y - 2, 5, Math.max(1, Math.abs(Math.cos(p.t / 60)) * 5)); }
      else if (p.shape === 'star' || p.shape === 'plus') { const w = Math.max(1, Math.round(s / 3)); ctx.fillRect(x - s, y - w / 2, s * 2, w); ctx.fillRect(x - w / 2, y - s, w, s * 2); if (p.shape === 'star') ctx.fillRect(x - w, y - w, w * 2, w * 2); }
      else if (p.shape === 'confetti' || p.shape === 'shard' || p.shape === 'leaf') { ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); if (p.shape === 'leaf') { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.9, s * 0.45, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2c4a38'; ctx.fillRect(-s * 0.8, -0.5, s * 1.6, 1); } else if (p.shape === 'shard') { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(0, -s * 0.4); ctx.lineTo(s, 0); ctx.lineTo(0, s * 0.4); ctx.fill(); } else ctx.fillRect(-s / 2, -s / 4, s, s / 2 * Math.abs(Math.cos(p.t / 80)) + 1); ctx.restore(); }
      else if (p.shape === 'puff' || p.shape === 'bubble') { const r = s * (0.6 + (p.t / p.life) * 0.9); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if (p.shape === 'bubble') { ctx.strokeStyle = p.col; ctx.lineWidth = 1.5; ctx.stroke(); } else { ctx.globalAlpha = al * 0.6; ctx.fill(); } }
      else ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (ANIM.parts.length > 500) ANIM.parts.splice(0, ANIM.parts.length - 500);
    ctx.globalAlpha = 1;
    // 떠오르는 글
    ANIM.floats = ANIM.floats.filter((f) => (f.t += dt) < f.life);
    for (const f of ANIM.floats) { const t = f.t / f.life; ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; const sz = (f.size || 15) * (f.pop ? (t < 0.18 ? back(t / 0.18) * 1.15 : 1) : (t < 0.12 ? 0.7 + t * 2.5 : 1)); if (f.ic) icon('u_shield', f.x - tw(f.text, sz) / 2 - 12, f.y - t * 34, 16); txt(f.text, f.x, f.y - t * 34, sz, f.col, 'center'); }
    ctx.globalAlpha = 1;
    // 큰 글 띠
    ANIM.banners = ANIM.banners.filter((b) => (b.t += dt) < b.life);
    if (ANIM.banners.length) { const b = ANIM.banners[ANIM.banners.length - 1], t = b.t / b.life; const s = b.size * (t < 0.15 ? 1.4 - t * 2.6 : 1); ctx.globalAlpha = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1; txt(b.text, W / 2, H * 0.55, s, b.col, 'center', { olw: s / 5 }); ctx.globalAlpha = 1; }
    if (ANIM.flash > 0) { ctx.fillStyle = `rgba(${ANIM.flashCol},${Math.min(1, ANIM.flash) * 0.16})`; ctx.fillRect(-20, -20, W + 40, H + 40); ANIM.flash = Math.max(0, ANIM.flash - dt / 700); }
    // 부적 설명
    if (tip) { tip.t += dt; const rl = D.RELICS[tip.r]; const s = T(rl.n[0], rl.n[1]) + ' : ' + T(rl.d[0], rl.d[1]); const w = tw(s, 12) + 20; box(Math.min(W - w - 10, padL), 28, w, 24, '#283020', '#161a10'); txt(s, Math.min(W - w - 10, padL) + 10, 40, 12, '#fff'); if (tip.t > 2200) tip = null; }
    if (toast) { toast.t += dt; const w = tw(toast.s, 14) + 30; box(W / 2 - w / 2, H * 0.16, w, 30, '#283020', '#e8c860'); txt(toast.s, W / 2, H * 0.16 + 15, 14, '#fff', 'center'); if (toast.t > 1800) toast = null; }
    if (paused) drawPause();
  }
  requestAnimationFrame(frame);
  // 미리보기 패널에서 rAF 가 안 돌 때 손으로 돌리기
  LH.tick = (ms) => { const n = Math.ceil(ms / 16); for (let i = 0; i < n; i++) { last = performance.now(); step(16); } };
  LH.tapL = (x, y) => tap(x, y); LH.fight = (k) => startFight(k); LH.endTurn = () => endTurn(); LH.dim = () => ({ S, W, H }); LH.btns = () => btns.map((b) => [Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)]); LH.hand = () => G.B && G.B.hand.map((h) => [h.id, Math.round(h.x), Math.round(h.y)]);
  LH.shot = (name) => fetch('/save?name=' + (name || 'shot.png'), { method: 'POST', body: cv.toDataURL() });

  // ───────── 입력 ─────────
  function toL(e) { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * DPR) / S, y: ((e.clientY - r.top) * DPR) / S }; }
  let dragY = null, dragS = 0, moved = false;
  cv.addEventListener('pointermove', (e) => {
    const p = toL(e); mouse = p;
    if (dragY !== null) { const dy = p.y - dragY; if (Math.abs(dy) > 6) moved = true; if (scr === 'deck' || scr === 'remove') deckScroll = clamp(dragS - dy, 0, maxScroll); if (scr === 'dex') dexScroll = clamp(dragS - dy, 0, maxScroll); }
    hoverCard = null;
    if (scr === 'battle' && G.B && e.pointerType === 'mouse') { const hc = cardAt(p.x, p.y); hoverCard = hc; }
  });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  cv.addEventListener('pointerdown', (e) => {
    SFX.unlock();
    const p = toL(e); mouse = p; moved = false;
    if (scr === 'deck' || scr === 'remove' || scr === 'dex') { dragY = p.y; dragS = scr === 'dex' ? dexScroll : deckScroll; }
    if (e.pointerType !== 'mouse') hoverCard = null;
  });
  cv.addEventListener('pointerup', (e) => {
    const p = toL(e); const wasDrag = dragY !== null && moved; dragY = null;
    if (wasDrag) return;
    tap(p.x, p.y);
    if (e.pointerType !== 'mouse') mouse = { x: -1, y: -1 };
  });
  cv.addEventListener('wheel', (e) => { if (scr === 'deck' || scr === 'remove') deckScroll = clamp(deckScroll + e.deltaY * 0.5, 0, maxScroll); if (scr === 'dex') dexScroll = clamp(dexScroll + e.deltaY * 0.5, 0, maxScroll); }, { passive: true });
  function cardAt(x, y) {
    const B = G.B; if (!B) return null;
    const order = B.hand.filter((h) => h !== sel); if (sel && B.hand.includes(sel)) order.push(sel);
    for (let i = order.length - 1; i >= 0; i--) { const hc = order[i], s = hc.s || 1; if (Math.abs(x - hc.x) < (CW * s) / 2 && Math.abs(y - hc.y) < (CH * s) / 2) return hc; }
    return null;
  }
  function tap(x, y) {
    if (paused) { for (let i = btns.length - 1; i >= pauseFrom; i--) { const b = btns[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); return; } } return; }
    if (tip) tip = null;
    // 단추 먼저(나중에 그린 것이 위)
    for (let i = btns.length - 1; i >= 0; i--) { const b = btns[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); return; } }
    if (scr !== 'battle' || !G.B || busy) return;
    const hc = cardAt(x, y);
    if (hc) {
      if (sel === hc) {
        playCard(hc, null);
      } else { sel = hc; SFX.play('card'); }
      return;
    }
    const f = foeAt(x, y);
    if (f) {
      if (sel) { if (C[sel.id].tgt) playCard(sel, f); else playCard(sel, null); }
      else lastTarget = f;
      return;
    }
    // 빈 곳: 고른 카드가 대상이 필요 없으면 위로 끌어 쓰는 셈으로 쓰지 않고 내려놓기
    sel = null;
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (scr === 'battle') sel = null; return; }
    if (scr !== 'battle' || !G.B || busy) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && G.B.hand[n - 1]) { const hc = G.B.hand[n - 1]; if (sel === hc) playCard(hc, null); else { sel = hc; SFX.play('card'); } }
    if ((e.key === ' ' || e.key === 'Enter') && sel) { e.preventDefault(); playCard(sel, null); }
    if (e.key === 'e' || e.key === 'E') endTurn();
    if (e.key === 'Tab') { e.preventDefault(); const fs = G.liveFoes(); if (fs.length) { const i = fs.indexOf(targetOf()); lastTarget = fs[(i + 1) % fs.length]; } }
  });

  // HTML 단추
  const $ = (id) => document.getElementById(id);
  $('bPause').onclick = () => { SFX.play('click'); paused = !paused; };
  $('bHow').onclick = () => { SFX.play('click'); if (scr === 'how') return; howT = 0; howNext = scr; if (scr === 'battle') { paused = false; howNext = 'battle'; } scr = 'how'; };
  const tg = () => { $('bBgm').classList.toggle('off', !BGM.on); $('bSfx').classList.toggle('off', !SFX.on); };
  $('bBgm').onclick = () => { BGM.on = !BGM.on; tg(); }; $('bSfx').onclick = () => { SFX.on = !SFX.on; tg(); }; tg();
  document.addEventListener('pointerdown', function once() { BGM.play(scr === 'title' ? 'title' : 'map'); document.removeEventListener('pointerdown', once); });
  document.fonts && document.fonts.load('16px Galmuri11');
})();
