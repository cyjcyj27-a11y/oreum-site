/* 모에모에 메이드카페 — 제미나이 스프라이트(img/maids/<id>.webp + meta.js) 그리기
   메이드·손님 스프라이트를 그린다. 아틀라스가 아직 안 떴으면 안 그린다 */
(function () {
  'use strict';
  const V = 5, cache = {};
  function get(id) {
    if (cache[id]) return cache[id];
    const meta = window.SPRMETA && window.SPRMETA[id]; if (!meta) return null;
    const img = new Image(); img.src = 'img/maids/' + id + '.webp?v=' + V; const s = { img, meta, ok: false }; img.onload = () => { s.ok = true; }; cache[id] = s; return s;
  }
  function has(id) { const s = get(id); return !!(s && s.ok); }
  // 표정 → 4행 칸 번호 (기본·웃음·윙크·부끄러움·놀람·하트눈)
  function faceIdx(face) {
    if (!face) return 0; if (face.eyes === 'heart') return 5; if (face.eyes === 'wink') return 2; if (face.eyes === 'sparkle' || face.mouth === 'o' || face.mouth === 'wide') return 4;
    if (face.eyes === 'happy' || face.mouth === 'open') return (face.blush || 0) >= .95 ? 3 : 1; if ((face.blush || 0) >= .9) return 3; return 0;
  }
  function pickFrame(s, pose, ph, t, face) {
    const P = s.meta.poses; let list = P[pose] || P.idle; let i = 0;
    if (pose === 'walk' || pose === 'carry') i = Math.floor(ph * list.length) % list.length;
    else if (pose === 'moe') i = Math.floor(t * 3) % list.length;
    else if (pose === 'wave') i = Math.floor(t * 4) % list.length;
    else if (pose === 'idle' && face && faceIdx(face) > 0 && P.face && P.face.length > faceIdx(face)) { list = P.face; i = faceIdx(face); }
    return list[i];
  }
  // 발끝 (x,y), 키 100×scale 로 그린다 (키 100 기준)
  function maid(ctx, m, opt) {
    const s = get(m.id); if (!s || !s.ok) return false;
    opt = opt || {}; const t = opt.t || 0, pose = opt.pose || 'idle', ph = opt.ph || 0, sc = opt.scale || 1;
    const { cw, ch, cols } = s.meta; const fi = pickFrame(s, pose, ph, t, opt.face);
    const sx = (fi % cols) * cw, sy = Math.floor(fi / cols) * ch;
    const H = 104 * sc, W = H * cw / ch; // 칸 높이 → 104 (코드 그림 100 + 여유)
    const bob = pose === 'walk' || pose === 'carry' ? Math.abs(Math.sin(ph * Math.PI * 2)) * 2 * sc : Math.sin(t * 2.4) * .6 * sc;
    ctx.save(); ctx.translate(opt.x || 0, opt.y || 0);
    if (opt.shadow !== false) { ctx.beginPath(); ctx.ellipse(0, 0, 15 * sc, 3.8 * sc, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(40,20,30,.25)'; ctx.fill(); }
    if ((opt.dir || 0) < 0 && (pose === 'walk' || pose === 'carry')) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(s.img, sx, sy, cw, ch, -W / 2, -H - bob + 2 * sc, W, H);
    ctx.restore();
    return true;
  }
  // 초상: 표정 칸의 위쪽(머리) 을 w×h 에 꽉 채워
  function portrait(ctx, m, w, h, opt) {
    const s = get(m.id); if (!s || !s.ok) return false;
    opt = opt || {}; const { cw, ch, cols } = s.meta; const P = s.meta.poses; const fi = (P.face && P.face.length) ? P.face[Math.min(faceIdx(opt.face), P.face.length - 1)] : P.idle[0];
    const sx = (fi % cols) * cw, sy = Math.floor(fi / cols) * ch;
    // 머리는 칸 위쪽 58% 안에 있다. 그 부분을 cover 로
    const srcH = ch * .62, srcW = cw; const k = Math.max(w / srcW, h / srcH); const dw = srcW * k, dh = srcH * k;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(s.img, sx, sy, srcW, srcH, (w - dw) / 2, 0, dw, dh); ctx.restore();
    return true;
  }
  // ── 손님 (img/custs/<kind>.webp) ──
  const ccache = {};
  function cget(kind) {
    if (ccache[kind]) return ccache[kind];
    const meta = window.CUSTMETA && window.CUSTMETA[kind]; if (!meta) return null;
    const img = new Image(); img.src = 'img/custs/' + kind + '.webp?v=' + V; const s = { img, meta, ok: false }; img.onload = () => { s.ok = true; }; ccache[kind] = s; return s;
  }
  // 앉은 표정: 대기 0 · 메뉴 1 · 먹기 2 · 하트눈 3 · 지루 4 · 환호 5
  function custFrame(s, pose, ph, t, face) {
    const P = s.meta.poses; const f = face || {};
    if (pose === 'walk') { const l = P.walk; return l[Math.floor(ph * l.length) % l.length]; }
    if (pose === 'sit' || pose === 'eat' || pose === 'cheer') {
      const sit = P.sit || P.idle;
      if (pose === 'cheer') return sit[Math.min(5, sit.length - 1)];
      if (f.eyes === 'heart') return sit[Math.min(3, sit.length - 1)];
      if (f.eyes === 'tired' || f.eyes === 'dot' || f.mouth === 'wobble') return sit[Math.min(4, sit.length - 1)];
      if (pose === 'eat' || f.eyes === 'happy') { const e = P.eat && P.eat.length ? P.eat : sit; const fi = { omu: 0, coffee: 1, parfait: 2, cake: 3 }[f.food] || 0; return pose === 'eat' ? e[Math.min(fi, e.length - 1)] : sit[Math.min(2, sit.length - 1)]; }
      if (f.eyes === 'sparkle') return sit[Math.min(1, sit.length - 1)];
      return sit[0];
    }
    return P.idle[0];
  }
  function customer(ctx, c, opt) {
    const s = cget(c.sheet); if (!s || !s.ok) return false;
    opt = opt || {}; const t = opt.t || 0, pose = opt.pose || 'idle', ph = opt.ph || 0, sc = opt.scale || 1;
    const { cw, ch, cols } = s.meta; const fi = custFrame(s, pose, ph, t, opt.face);
    const sx = (fi % cols) * cw, sy = Math.floor(fi / cols) * ch;
    const H = 104 * sc, W = H * cw / ch; const seated = pose === 'sit' || pose === 'eat' || pose === 'cheer';
    const bob = pose === 'walk' ? Math.abs(Math.sin(ph * Math.PI * 2)) * 2 * sc : Math.sin(t * 2 + 1) * .5 * sc;
    ctx.save(); ctx.translate(opt.x || 0, opt.y || 0);
    if (opt.shadow !== false && !seated) { ctx.beginPath(); ctx.ellipse(0, 0, 14 * sc, 3.6 * sc, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(40,20,30,.22)'; ctx.fill(); }
    if ((opt.dir || 0) < 0 && pose === 'walk') ctx.scale(-1, 1);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(s.img, sx, sy, cw, ch, -W / 2, -H - bob + (seated ? 14 * sc : 2 * sc), W, H);
    ctx.restore(); return true;
  }
  function preload(ids) { (ids || Object.keys(window.SPRMETA || {})).forEach(get); Object.keys(window.CUSTMETA || {}).forEach(cget); }
  window.SPR = { maid, portrait, customer, has, preload, faceIdx };
})();
