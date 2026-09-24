/* 취권 — 그림 소재 읽기·그리기. 제미나이로 뽑은 자세 시트(img/*.webp) + js/sheets.js 칸 좌표.
 * window.SPR = { load(names, cb), have(name), draw(c, name, cell, x, footY, face, opt), cellH(name, cell), bg(name) }
 * 시트의 인물은 hero 가 오른쪽, 나머지가 왼쪽을 본다(FACE 표). draw 의 face 가 다르면 뒤집는다.
 * 칸 좌표 [x, y, w, h] 는 발끝이 y+h. footY 에 발끝을 맞춰 그린다.
 */
(function () {
  'use strict';
  var IMGV = 6;   // 그림을 새로 뽑으면 올린다(엣지 캐시)
  var IMGS = {}, FACE = { hero: 1 };
  var WARM = document.createElement('canvas'); WARM.width = WARM.height = 2;      // 시트 이름 앞머리(숫자 뺀 것) → 원래 보는 방향. 없으면 -1(왼쪽)
  function baseName(n) { return n.replace(/_c\d+$/, '').replace(/\d+$/, ''); }
  function faceOf(name) { var b = baseName(name); return FACE[b] || -1; }

  // 졸개 옷 색: 스테이지마다 초록 옷을 이 색으로(색상·채도 배율·명도 배율). tools/recolor.py 와 같은 값.
  // 9/24 사장님 "용량 줄여서" → 미리 만든 8벌(48장, 3.3MB) 대신 원본을 받아 여기서 칠한다.
  // file:// 로 열면 캔버스 픽셀을 못 읽어 원본(초록 옷) 그대로 나온다.
  var COLORS = { 1: [215, 0.75, 0.75], 2: [28, 0.95, 0.95], 3: [35, 0.45, 0.55], 4: [330, 0.8, 0.8], 5: [195, 0.85, 0.95], 6: [0, 0.9, 0.7], 7: [48, 0.9, 1.0], 8: [270, 0.4, 0.35] };
  function recolor(im, k) {
    var cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    var x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    var col = COLORS[k]; if (!col) return cv;
    try {
      var d = x.getImageData(0, 0, cv.width, cv.height), p = d.data, hue = col[0], sm = col[1], vm = col[2];
      for (var i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        var r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255;
        var mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b), dd = mx - mn;
        if (dd <= 0 || mx <= 0.12) continue;
        var h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; if (h < 0) h += 360;
        var s = dd / mx;
        if (h <= 75 || h >= 165 || s <= 0.09) continue;          // 초록 옷만
        var s2 = Math.min(1, s * sm), v2 = Math.min(1, mx * vm), c = v2 * s2, hp = hue / 60, xx = c * (1 - Math.abs(hp % 2 - 1)), m = v2 - c, R, G, B;
        if (hp < 1) { R = c; G = xx; B = 0; } else if (hp < 2) { R = xx; G = c; B = 0; } else if (hp < 3) { R = 0; G = c; B = xx; }
        else if (hp < 4) { R = 0; G = xx; B = c; } else if (hp < 5) { R = xx; G = 0; B = c; } else { R = c; G = 0; B = xx; }
        p[i] = (R + m) * 255 + 0.5; p[i + 1] = (G + m) * 255 + 0.5; p[i + 2] = (B + m) * 255 + 0.5;
      }
      x.putImageData(d, 0, 0);
    } catch (e) {}                                                 // file:// — 원본 그대로
    return cv;
  }

  function load(names, cb) {
    var left = 0, fail = [];
    names.forEach(function (n) {
      if (IMGS[n] && IMGS[n].ok) return;
      left++;
      var im = new Image(), m = /^(.+)_c(\d+)$/.exec(n);           // grunt1b_c3 → grunt1b.webp 를 받아 3번 색으로
      IMGS[n] = { im: im, ok: false };
      im.onload = function () {
        if (m) { IMGS[n].im = recolor(im, +m[2]); }
        // 처음 그릴 때 그림 풀기·올리기로 0.16초 멈칫(9/24 perf) → 불러오자마자 작은 판에 한 번 그려 둔다
        try { WARM.getContext('2d').drawImage(IMGS[n].im, 0, 0, 2, 2); } catch (e) {}   // decode() 는 숨은 탭에서 안 끝날 수 있어 쓰지 않는다
        IMGS[n].ok = true; if (--left === 0) cb && cb(fail);
      };
      im.onerror = function () { fail.push(n); IMGS[n].bad = true; if (--left === 0) cb && cb(fail); };
      im.src = 'img/' + (m ? m[1] : n) + '.webp?v=' + IMGV;
    });
    if (left === 0) cb && cb(fail);
  }
  function have(n) { return !!(IMGS[n] && IMGS[n].ok); }
  function cells(name) { return window.SHEETS[name.replace(/_c\d+$/, '')]; }
  function cellH(name, cell) { var cs = cells(name), cl = cs && cs[Math.min(cell, cs.length - 1)]; return cl ? cl[3] : 0; }   // 빠진 칸(null)은 0
  function cellW(name, cell) { var cs = cells(name), cl = cs && cs[Math.min(cell, cs.length - 1)]; return cl ? cl[2] : 0; }

  // opt: { scale, rot(라디안, 발끝 기준), alpha, tint('rgba'), squash(세로 배율), lean(기울기), flash }
  function draw(c, name, cell, x, footY, face, opt) {
    var rec = IMGS[name], cs = cells(name);
    if (!rec || !rec.ok || !cs) return;
    opt = opt || {};
    var cl = cs[Math.min(cell, cs.length - 1)] || cs[0], s = opt.scale || 1, flip = face !== faceOf(name);
    c.save();
    c.translate(x, footY);
    if (opt.rot) c.rotate(opt.rot);
    if (opt.lean) c.transform(1, 0, opt.lean, 1, 0, 0);
    c.scale(flip ? -s : s, s * (opt.squash || 1));
    if (opt.alpha != null) c.globalAlpha = opt.alpha;
    var w = cl[2], h = cl[3];
    if (opt.flash) {          // 맞는 순간 하얗게: 따로 그린 판에서만 덮어 배경에 네모가 생기지 않게
      var t = tmp(w, h), tc = t.getContext('2d');
      tc.clearRect(0, 0, w, h); tc.globalCompositeOperation = 'source-over';
      tc.drawImage(rec.im, cl[0], cl[1], w, h, 0, 0, w, h);
      tc.globalCompositeOperation = 'source-atop';
      tc.fillStyle = 'rgba(255,255,255,' + opt.flash + ')'; tc.fillRect(0, 0, w, h);
      c.drawImage(t, 0, 0, w, h, -w / 2, -h, w, h);
    } else c.drawImage(rec.im, cl[0], cl[1], w, h, -w / 2, -h, w, h);
    c.restore();
  }
  var TMP = null;
  function tmp(w, h) {
    if (!TMP) TMP = document.createElement('canvas');
    if (TMP.width < w || TMP.height < h) { TMP.width = Math.max(TMP.width, w); TMP.height = Math.max(TMP.height, h); }
    return TMP;
  }
  function img(name) { var r = IMGS[name]; return r && r.ok ? r.im : null; }

  window.SPR = { load: load, have: have, draw: draw, cellH: cellH, cellW: cellW, img: img, faceOf: faceOf };
})();
