/* 오름게임즈 이미지 도구 — 포맷 변환 · 용량 줄이기 · 자르기
   사진은 브라우저 안에서만 처리한다(fetch·업로드 없음).
   data-mode: convert | compress | crop
   시험 손잡이: window.__im */
(function () {
  'use strict';

  var root = document.querySelector('.im');
  if (!root) return;
  var MODE = root.getAttribute('data-mode') || 'convert';   // 탭으로 바뀐다 (setMode)
  var EN = (document.documentElement.lang || 'ko').slice(0, 2) === 'en';
  function T(ko, en) { return EN ? en : ko; }

  var $ = function (id) { return document.getElementById(id); };
  var drop = $('drop'), pick = $('pick'), pickBtn = $('pickBtn');
  var listwrap = $('listwrap'), list = $('list'), cnt = $('cnt'), clrBtn = $('clrBtn');
  var out = $('out'), goBtn = $('goBtn'), note = $('note');
  var busy = $('busy'), barIn = $('barIn'), busyTxt = $('busyTxt'), done = $('done');
  var cropWrap = $('cropWrap');

  var recs = [];            // {file,name,type,size,bmp,w,h,bad,crop,outBlob,outName,outSize}
  var cur = -1;             // 자르기에서 지금 고른 장
  var running = false;
  var api = { noAutoDownload: false };

  /* ------------------------------------------------------------- 자잘한 것 */
  function fmtSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function extOf(type) {
    return type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  }
  function baseName(name) {
    return String(name).replace(/\.[^.]+$/, '') || 'image';
  }
  function say(msg) {
    if (!msg) { note.hidden = true; note.textContent = ''; return; }
    note.hidden = false; note.textContent = msg;
  }
  var canWebp = (function () {
    try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; }
    catch (e) { return false; }
  })();

  /* ------------------------------------------------------------- 파일 받기 */
  function isImage(f) {
    return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name || '');
  }

  function decode(f) {
    if (window.createImageBitmap) {
      return createImageBitmap(f, { imageOrientation: 'from-image' }).catch(function () {
        return createImageBitmap(f);
      }).catch(function () { return viaImg(f); });
    }
    return viaImg(f);
  }
  function viaImg(f) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(f), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); res(im); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      im.src = url;
    });
  }

  function addFiles(files) {
    var arr = [].slice.call(files || []);
    var imgs = arr.filter(isImage);
    if (!arr.length) return Promise.resolve();
    if (!imgs.length) { say(T('그림 파일이 아닙니다. JPG · PNG · WEBP 사진을 넣어 주세요.', 'Not an image file. Please add JPG, PNG or WEBP photos.')); return Promise.resolve(); }
    say('');
    if (MODE === 'crop') imgs = imgs.slice(0, 1 + 0 + imgs.length); // 자르기도 여러 장 받되 한 장씩 자른다
    var jobs = imgs.map(function (f) {
      var rec = { file: f, name: f.name || 'image', type: f.type || '', size: f.size, crop: null };
      recs.push(rec);
      return decode(f).then(function (bmp) {
        rec.bmp = bmp; rec.w = bmp.width; rec.h = bmp.height;
        rec.crop = { x: 0, y: 0, w: rec.w, h: rec.h };
        rec.thumb = thumbOf(bmp);
      }).catch(function () {
        rec.bad = /heic|heif/i.test(rec.name) || /heic|heif/i.test(rec.type)
          ? T('아이폰 HEIC 사진은 아직 못 읽습니다 — 폰 설정에서 «높은 호환성(JPEG)»으로 찍거나, 카톡으로 한 번 보낸 사진을 쓰세요.',
               'iPhone HEIC photos are not supported yet — shoot in “Most Compatible (JPEG)” or use a copy that has been shared once.')
          : T('열 수 없는 그림 파일입니다', 'This image could not be opened');
      });
    });
    return Promise.all(jobs).then(function () {
      render();
      if (MODE === 'crop' && cur < 0) {
        var i = recs.findIndex(function (r) { return !r.bad; });
        if (i >= 0) select(i);
      }
    });
  }

  function thumbOf(bmp) {
    var s = 160, r = Math.min(s / bmp.width, s / bmp.height, 1);
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * r));
    c.height = Math.max(1, Math.round(bmp.height * r));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', .82); } catch (e) { return ''; }
  }

  /* ------------------------------------------------------------- 목록 */
  function render() {
    var n = recs.length;
    listwrap.hidden = !n; out.hidden = !n;
    root.classList.toggle('has', !!n);
    // 지금 칸만 보여 준다 (자르기 칸은 고른 사진이 있어야 나온다)
    [].forEach.call(root.querySelectorAll('.pane'), function (el) {
      var m = el.getAttribute('data-pane');
      el.hidden = m !== MODE || !n || (m === 'crop' && cur < 0);
    });
    cnt.textContent = EN ? (n + (n === 1 ? ' image' : ' images')) : (n + '장');
    list.innerHTML = '';
    recs.forEach(function (r, i) {
      var li = document.createElement('li');
      li.className = 'row' + (r.bad ? ' bad' : '') + (MODE === 'crop' && i === cur ? ' on' : '');
      var info = r.bad ? r.bad
        : r.outBlob ? (fmtSize(r.size) + ' → ' + fmtSize(r.outSize) + gain(r.size, r.outSize))
        : (r.w + '×' + r.h + ' · ' + fmtSize(r.size));
      li.innerHTML =
        '<span class="ico">' + (r.thumb ? '<img src="' + r.thumb + '" alt="">' : '!') + '</span>' +
        '<span class="meta"><span class="fn"></span><span class="info"></span></span>' +
        '<span class="btns">' +
          (r.outBlob ? '<button type="button" class="dl" title="' + T('받기', 'Download') + '">↓</button>' : '') +
          (MODE === 'crop' && !r.bad && i !== cur ? '<button type="button" class="ed" title="' + T('자르기', 'Crop') + '">✎</button>' : '') +
          '<button type="button" class="del" title="' + T('빼기', 'Remove') + '">✕</button>' +
        '</span>';
      li.querySelector('.fn').textContent = r.name;
      li.querySelector('.info').textContent = info;
      var dl = li.querySelector('.dl'); if (dl) dl.onclick = function () { save(r.outBlob, r.outName); };
      var ed = li.querySelector('.ed'); if (ed) ed.onclick = function () { select(i); };
      li.querySelector('.del').onclick = function () {
        recs.splice(i, 1);
        if (MODE === 'crop') { if (cur === i) { cur = -1; } else if (cur > i) cur--; }
        if (MODE === 'crop' && cur < 0) { var k = recs.findIndex(function (x) { return !x.bad; }); if (k >= 0) { select(k); return; } }
        render();
      };
      if (MODE === 'crop' && !r.bad) li.onclick = function (e) {
        if (e.target.closest('button')) return; select(i);
      };
      list.appendChild(li);
    });
    updateGo();
  }

  function gain(a, b) {
    if (!a || b >= a) return '';
    return ' (' + Math.round((1 - b / a) * 100) + T('% 줄었어요', '% smaller') + ')';
  }

  function okRecs() { return recs.filter(function (r) { return !r.bad; }); }

  function updateGo() {
    var n = okRecs().length;
    goBtn.disabled = !n || running;
    var lbl = MODE === 'convert' ? T('변환하고 받기', 'Convert and download')
            : MODE === 'compress' ? T('용량 줄이고 받기', 'Compress and download')
            : T('자르고 받기', 'Crop and download');
    if (n > 1 && MODE !== 'crop') lbl = EN ? ('Process ' + n + ' images') : (n + '장 ' + lbl);
    goBtn.textContent = lbl;
  }

  /* ------------------------------------------------------------- 고르기·끌어다 놓기 */
  pickBtn.onclick = function () { pick.click(); };
  pick.onchange = function () { addFiles(pick.files); pick.value = ''; };
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });
  document.addEventListener('paste', function (e) {
    var items = e.clipboardData && e.clipboardData.files;
    if (items && items.length) addFiles(items);
  });
  if (clrBtn) clrBtn.onclick = function () { recs = []; cur = -1; done.hidden = true; say(''); render(); };

  /* ------------------------------------------------------------- 그리기(변환용) */
  function drawTo(rec, w, h, bg, crop) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
    var r = crop || { x: 0, y: 0, w: rec.w, h: rec.h };
    g.drawImage(rec.bmp, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
    return c;
  }
  function toBlob(canvas, type, q) {
    return new Promise(function (res) {
      if (canvas.toBlob) canvas.toBlob(function (b) { res(b); }, type, q);
      else {
        var d = canvas.toDataURL(type, q), bin = atob(d.split(',')[1]);
        var u = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        res(new Blob([u], { type: type }));
      }
    });
  }

  /* ------------------------------------------------------------- 자르기 화면 */
  var cv = $('cropCv'), box = $('cropBox'), cropInfo = $('cropInfo');
  var stage = $('cropStage'), scale = 1, ratio = 0;

  function select(i) {
    cur = i; render(); drawCrop(); paintBox();
  }
  function curRec() { return cur >= 0 ? recs[cur] : null; }

  function drawCrop() {
    var r = curRec();
    if (!cv || !r || r.bad) return;
    var maxW = Math.max(240, stage.clientWidth || 640);
    var maxH = Math.max(240, Math.round(window.innerHeight * 0.62));
    scale = Math.min(maxW / r.w, maxH / r.h, 1);
    cv.width = Math.round(r.w * scale); cv.height = Math.round(r.h * scale);
    var g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(r.bmp, 0, 0, cv.width, cv.height);
  }

  function paintBox() {
    var r = curRec();
    if (!box || !r || r.bad) return;
    var c = r.crop;
    box.style.left = (cv.offsetLeft + c.x * scale) + 'px';   // 캔버스가 가운데 놓이므로 그 자리만큼 민다
    box.style.top = (cv.offsetTop + c.y * scale) + 'px';
    box.style.width = (c.w * scale) + 'px';
    box.style.height = (c.h * scale) + 'px';
    box.hidden = false;
    if (cropInfo) cropInfo.textContent = Math.round(c.w) + ' × ' + Math.round(c.h) + ' px';
  }

  function clampCrop(r) {
    var c = r.crop;
    c.w = Math.max(16, Math.min(c.w, r.w));
    c.h = Math.max(16, Math.min(c.h, r.h));
    c.x = Math.max(0, Math.min(c.x, r.w - c.w));
    c.y = Math.max(0, Math.min(c.y, r.h - c.h));
  }

  function applyRatio(r) {
    if (!ratio) return;
    var c = r.crop;
    // 지금 넓이를 기준으로 높이를 비율에 맞추고, 넘치면 넓이를 줄인다
    var h = c.w / ratio;
    if (h > r.h) { h = r.h; c.w = h * ratio; }
    c.h = h;
    if (c.y + c.h > r.h) c.y = r.h - c.h;
    if (c.x + c.w > r.w) c.x = r.w - c.w;
    clampCrop(r);
  }

  if (stage) {
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      var r = curRec(); if (!r || r.bad) return;
      var hd = e.target.getAttribute && e.target.getAttribute('data-h');
      var rect = cv.getBoundingClientRect();
      var px = (e.clientX - rect.left) / scale, py = (e.clientY - rect.top) / scale;
      if (hd) {
        drag = { mode: hd, sx: px, sy: py, c: Object.assign({}, r.crop) };
      } else if (e.target === box) {
        drag = { mode: 'move', sx: px, sy: py, c: Object.assign({}, r.crop) };
      } else if (e.target === cv) {
        // 빈 곳을 끌면 새 네모. 그냥 누르기만 한 것은 건드리지 않는다
        drag = { mode: 'se', sx: px, sy: py, fresh: true, c: { x: px, y: py, w: 16, h: 16 } };
      } else return;
      stage.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) {
      var r = curRec(); if (!drag || !r) return;
      var rect = cv.getBoundingClientRect();
      var px = (e.clientX - rect.left) / scale, py = (e.clientY - rect.top) / scale;
      var dx = px - drag.sx, dy = py - drag.sy, s = drag.c, c = r.crop;
      if (drag.fresh) {                       // 새로 그리는 네모
        if (Math.abs(dx) * scale < 5 && Math.abs(dy) * scale < 5) return;
        var nw = Math.max(16, Math.abs(dx)), nh = Math.max(16, Math.abs(dy));
        if (ratio) nh = nw / ratio;
        r.crop = { x: Math.min(drag.sx, px), y: Math.min(drag.sy, py), w: nw, h: nh };
        clampCrop(r); paintBox(); return;
      }
      if (drag.mode === 'move') {
        c.x = s.x + dx; c.y = s.y + dy; c.w = s.w; c.h = s.h;
      } else {
        var L = s.x, Tp = s.y, R = s.x + s.w, B = s.y + s.h;
        if (drag.mode.indexOf('w') >= 0) L = Math.min(s.x + dx, R - 16);
        if (drag.mode.indexOf('e') >= 0) R = Math.max(s.x + s.w + dx, L + 16);
        if (drag.mode.indexOf('n') >= 0) Tp = Math.min(s.y + dy, B - 16);
        if (drag.mode.indexOf('s') >= 0) B = Math.max(s.y + s.h + dy, Tp + 16);
        c.x = L; c.y = Tp; c.w = R - L; c.h = B - Tp;
        if (ratio) {
          var wantH = c.w / ratio;
          if (drag.mode === 'n' || drag.mode === 's') { c.w = c.h * ratio; }
          else { c.h = wantH; }
          if (drag.mode.indexOf('n') >= 0) c.y = B - c.h;
          if (drag.mode.indexOf('w') >= 0) c.x = R - c.w;
        }
      }
      clampCrop(r); paintBox();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      stage.addEventListener(ev, function () { drag = null; });
    });
  }

  // 비율 단추
  [].forEach.call(root.querySelectorAll('[data-ratio]'), function (b) {
    b.onclick = function () {
      [].forEach.call(root.querySelectorAll('[data-ratio]'), function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var v = b.getAttribute('data-ratio');
      ratio = v === 'free' ? 0 : (function () { var p = v.split(':'); return +p[0] / +p[1]; })();
      var r = curRec(); if (!r || r.bad) return;
      if (ratio) {
        // 화면 가운데에 비율에 맞는 가장 큰 네모
        var w = r.w, h = w / ratio;
        if (h > r.h) { h = r.h; w = h * ratio; }
        r.crop = { x: (r.w - w) / 2, y: (r.h - h) / 2, w: w, h: h };
      }
      clampCrop(r); paintBox();
    };
  });
  var allBtn = $('allBtn');
  if (allBtn) allBtn.onclick = function () {
    var r = curRec(); if (!r || r.bad) return;
    r.crop = { x: 0, y: 0, w: r.w, h: r.h };
    if (ratio) applyRatio(r);
    paintBox();
  };
  window.addEventListener('resize', function () { if (MODE === 'crop' && curRec()) { drawCrop(); paintBox(); } });

  /* ------------------------------------------------------------- 고르개(옵션) */
  function segVal(name, def) {
    var b = root.querySelector('[data-seg="' + name + '"].on');
    return b ? b.getAttribute('data-v') : def;
  }
  [].forEach.call(root.querySelectorAll('[data-seg]'), function (b) {
    b.onclick = function () {
      var name = b.getAttribute('data-seg');
      [].forEach.call(root.querySelectorAll('[data-seg="' + name + '"]'), function (x) {
        x.classList.remove('on'); x.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      onOpt(name, b.getAttribute('data-v'));
    };
  });

  var q = $('q'), qv = $('qv'), bgSel = $('bg'), bgWrap = $('bgWrap');
  var kbInp = $('kb'), kbWrap = $('kbWrap'), scaleChk = $('scaleChk');
  // 변환·용량 칸이 한 화면에 같이 있어서 id 를 나눴다
  function maxwEl() { return MODE === 'compress' ? $('kmaxw') : $('maxw'); }
  function fmtEl() { return MODE === 'crop' ? $('xfmt') : $('kfmt'); }

  function onOpt(name, v) {
    if (name === 'fmt') {
      var jp = (v === 'image/jpeg');
      if (q) q.closest('.fld').hidden = (v === 'image/png');
      if (bgWrap) bgWrap.hidden = !jp;
    }
    if (name === 'kb') { if (kbWrap) kbWrap.hidden = (v !== 'custom'); }
    done.hidden = true;
  }
  if (q && qv) {
    var showQ = function () { qv.textContent = q.value + '%'; };
    q.oninput = showQ; showQ();
  }
  [$('maxw'), $('kmaxw'), bgSel, kbInp, scaleChk, $('kfmt'), $('xfmt')].forEach(function (el) {
    if (el) el.addEventListener('change', function () { done.hidden = true; });
  });
  if (root.querySelector('[data-seg="fmt"].on')) onOpt('fmt', segVal('fmt', 'image/jpeg'));
  if (root.querySelector('[data-seg="kb"].on')) onOpt('kb', segVal('kb', '500'));

  function targetBytes() {
    var v = segVal('kb', '500');
    var kb = v === 'custom' ? Math.max(20, +((kbInp && kbInp.value) || 500)) : +v;
    return Math.round(kb * 1024);
  }
  function longEdge() { var m = maxwEl(); return m ? +m.value || 0 : 0; }

  /* ------------------------------------------------------------- 만들기 */
  function fitSize(rec, crop) {
    var w = (crop || rec).w, h = (crop || rec).h, m = longEdge();
    if (m && Math.max(w, h) > m) { var r = m / Math.max(w, h); w *= r; h *= r; }
    // 폰 브라우저가 못 버티는 크기 막기(약 1,600만 화소)
    var MAXPX = 16000000;
    if (w * h > MAXPX) { var k = Math.sqrt(MAXPX / (w * h)); w *= k; h *= k; }
    return { w: Math.round(w), h: Math.round(h) };
  }

  function pickType(rec) {
    if (MODE === 'convert') return segVal('fmt', 'image/jpeg');
    if (MODE === 'crop') {
      var v = fmtEl() ? fmtEl().value : 'auto';
      if (v !== 'auto') return v;
      return rec.type === 'image/png' ? 'image/png' : (rec.type === 'image/webp' && canWebp ? 'image/webp' : 'image/jpeg');
    }
    var w = fmtEl() ? fmtEl().value : 'auto';
    if (w !== 'auto') return w;
    return canWebp ? 'image/webp' : 'image/jpeg';   // 용량 줄이기는 가장 잘 줄는 형식
  }

  function bgFor(type) {
    if (type !== 'image/jpeg') return null;
    return (bgSel && bgSel.value === 'black') ? '#000000' : '#ffffff';
  }

  // 같은 크기로 여러 번 저장해 볼 때 그림을 다시 그리지 않는다(큰 사진에서 1초 넘게 아낀다)
  var cache = { key: '', canvas: null };
  function canvasFor(rec, type, mul) {
    var crop = MODE === 'crop' ? rec.crop : null;
    var s = fitSize(rec, crop);
    var w = Math.max(1, Math.round(s.w * (mul || 1))), h = Math.max(1, Math.round(s.h * (mul || 1)));
    var bg = bgFor(type);
    var key = [rec.name, rec.size, w, h, bg, crop ? [crop.x, crop.y, crop.w, crop.h].join() : ''].join('|');
    if (cache.key !== key) { cache.key = key; cache.canvas = drawTo(rec, w, h, bg, crop); }
    return cache.canvas;
  }
  var encLog = [];            // 시험용 기록(마지막 작업에서 몇 번 저장해 봤는지)
  function encode(rec, type, quality, mul) {
    var c = canvasFor(rec, type, mul);
    return toBlob(c, type, type === 'image/png' ? undefined : quality).then(function (b) {
      encLog.push({ q: quality, w: c.width, h: c.height, size: b.size });
      return { blob: b, w: c.width, h: c.height };
    });
  }

  /* 목표 용량에 맞추기.
     큰 사진은 원본 크기로 한 번 저장하는 데 1초쯤 걸린다. 그래서 작게 줄인 견본으로 화질을 찾되,
     견본은 원본보다 화소당 용량이 커서 그대로 믿으면 안 된다. 원본으로 한 번 저장해 그 배수(k)를
     재고, 그 배수로 견본 탐색 결과를 보정한다. 원본 크기 저장은 보통 두 번이면 끝난다. */
  async function toTarget(rec, type, target, allowScale) {
    var full = fitSize(rec, MODE === 'crop' ? rec.crop : null);
    var px = full.w * full.h;
    function enc(q, mul) { return encode(rec, type, q, mul); }

    if (type === 'image/png') {            // PNG 은 화질 조절이 없어 크기로만 맞춘다
      var mp = 1, rp = await enc(undefined, 1);
      for (var k0 = 0; k0 < 6 && rp.blob.size > target && allowScale && mp > 0.15; k0++) {
        mp *= 0.75; rp = await enc(undefined, mp);
      }
      return rp;
    }

    var pm = Math.min(1, Math.sqrt(500000 / px));

    // 작은 사진은 견본을 만들 것 없이 원본에서 바로 이분 탐색
    if (pm >= 1) {
      var lo = 0.2, hi = 0.95, bestS = null, lastS = await enc(hi, 1);
      if (lastS.blob.size <= target) return lastS;
      for (var i0 = 0; i0 < 6; i0++) {
        var mid = (lo + hi) / 2;
        var r0 = await enc(mid, 1); lastS = r0;
        if (r0.blob.size <= target) { bestS = r0; lo = mid; } else hi = mid;
        if (bestS && bestS.blob.size > target * 0.85) break;
      }
      if (!bestS && allowScale) {          // 가장 낮은 화질로도 안 되면 크기를 줄인다
        var m2 = 1, rr = lastS;
        for (var i1 = 0; i1 < 4 && rr.blob.size > target && m2 > 0.15; i1++) {
          m2 = Math.max(0.15, m2 * Math.sqrt(target * 0.9 / rr.blob.size));
          rr = await enc(0.6, m2);
        }
        return rr;
      }
      return bestS || lastS;
    }

    // 견본 크기 저장은 싸다(0.05초쯤). 같은 화질은 한 번만 저장한다
    var pcache = {};
    async function psize(q) {
      var key = q.toFixed(3);
      if (!(key in pcache)) pcache[key] = (await enc(q, pm)).blob.size;
      return pcache[key];
    }
    // 견본에서 주어진 바이트 이하가 되는 가장 높은 화질
    async function proxyQ(tp) {
      if (await psize(0.2) > tp) return null;         // 화질만으로는 안 된다
      if (await psize(0.95) <= tp) return 0.95;
      var lo = 0.2, hi = 0.95;
      for (var i = 0; i < 8; i++) {
        var mid = (lo + hi) / 2;
        if (await psize(mid) <= tp) lo = mid; else hi = mid;
      }
      return lo;
    }

    var mul = 1, best = null, last = null;
    var p0 = await psize(0.8);
    last = await enc(0.8, mul);
    var k = last.blob.size / p0;                      // 원본이 견본의 몇 배로 나오는지
    if (last.blob.size <= target) {
      best = last;
      if (last.blob.size > target * 0.78) return best;
    }

    for (var i = 0; i < 3; i++) {
      var q = await proxyQ(target * 0.93 / k);
      if (q === null) {                               // 화질로는 못 맞춘다 → 크기 줄이기
        if (!allowScale || mul <= 0.16) q = 0.2;
        else { mul = Math.max(0.15, mul * Math.sqrt(target * 0.85 / last.blob.size)); q = 0.6; }
      }
      var r = await enc(q, mul); last = r;
      k = r.blob.size / await psize(q);               // 배수 다시 재기
      if (r.blob.size <= target) {
        if (!best || r.blob.size > best.blob.size) best = r;
        if (r.blob.size > target * 0.78 || q >= 0.949) break;
      } else if (!allowScale && q <= 0.205) break;
    }
    return best || last;
  }


  function outNameOf(rec, type) {
    var suffix = MODE === 'compress' ? (EN ? '-small' : '-용량줄임') : MODE === 'crop' ? (EN ? '-crop' : '-자름') : '';
    return baseName(rec.name) + suffix + '.' + extOf(type);
  }

  function run() {
    var todo = okRecs();
    if (!todo.length || running) return Promise.resolve();
    running = true; updateGo(); done.hidden = true; say(''); encLog = [];
    busy.hidden = false; barIn.style.width = '0%';
    var target = MODE === 'compress' ? targetBytes() : 0;
    var allowScale = !scaleChk || scaleChk.checked;
    var i = 0, missed = 0;

    function step() {
      if (i >= todo.length) return Promise.resolve();
      var rec = todo[i];
      busyTxt.textContent = (EN ? 'Working… ' : '처리하는 중… ') + (i + 1) + '/' + todo.length;
      var type = pickType(rec);
      var job = MODE === 'compress'
        ? toTarget(rec, type, target, allowScale)
        : encode(rec, type, (q ? +q.value / 100 : 0.9));
      return job.then(function (r) {
        rec.outBlob = r.blob; rec.outSize = r.blob.size; rec.outName = outNameOf(rec, type);
        rec.outW = r.w; rec.outH = r.h;
        if (MODE === 'compress' && r.blob.size > target) missed++;
        i++; barIn.style.width = Math.round(i / todo.length * 100) + '%';
        return new Promise(function (res) { setTimeout(res, 0); }).then(step);
      });
    }

    return step().then(function () {
      busy.hidden = true; running = false;
      render(); showDone(todo, missed);
      if (!api.noAutoDownload && todo.length === 1) save(todo[0].outBlob, todo[0].outName);
    }).catch(function (e) {
      busy.hidden = true; running = false; updateGo();
      say(T('처리하다가 멈췄습니다. 사진 크기가 너무 크면 몇 장씩 나눠서 해 보세요.',
            'Something went wrong. If the photos are very large, try a few at a time.'));
      throw e;
    });
  }

  function showDone(todo, missed) {
    var a = todo.reduce(function (s, r) { return s + r.size; }, 0);
    var b = todo.reduce(function (s, r) { return s + (r.outSize || 0); }, 0);
    var one = todo.length === 1 ? todo[0] : null;
    var head = one
      ? (EN ? 'Done — ' : '완료 — ') + fmtSize(one.size) + ' → ' + fmtSize(one.outSize) + gain(one.size, one.outSize)
      : (EN ? ('Done — ' + todo.length + ' images, ') : ('완료 — ' + todo.length + '장, ')) + fmtSize(a) + ' → ' + fmtSize(b) + gain(a, b);
    var sub = one
      ? (one.outW + '×' + one.outH + ' px · ' + one.outName)
      : T('아래 단추로 한꺼번에 받거나, 목록에서 한 장씩 받으세요.', 'Download them all below, or one at a time from the list.');
    if (missed) sub += T(' · ' + missed + '장은 목표 용량까지 줄지 않았습니다(더 줄이려면 크기 줄이기를 켜 보세요).',
                         ' · ' + missed + ' image(s) did not reach the target size.');
    done.innerHTML = '<b></b><span></span><div class="acts"></div>';
    done.querySelector('b').textContent = head;
    done.querySelector('span').textContent = sub;
    var acts = done.querySelector('.acts');
    if (one) {
      var one1 = document.createElement('button');
      one1.type = 'button'; one1.className = 'big';
      one1.textContent = T('다시 받기', 'Download again');
      one1.onclick = function () { save(one.outBlob, one.outName); };
      acts.appendChild(one1);
    } else {
      var z = document.createElement('button');
      z.type = 'button'; z.className = 'big';
      z.textContent = T('ZIP 으로 한꺼번에 받기', 'Download all as ZIP');
      z.onclick = function () { zipAll(todo, z); };
      acts.appendChild(z);
    }
    done.hidden = false;
    updateGo();
  }

  function zipAll(todo, btn) {
    if (!window.oreumZip) return;
    var old = btn.textContent;
    btn.disabled = true; btn.textContent = T('묶는 중…', 'Zipping…');
    var seen = {};
    var files = todo.map(function (r) {
      var n = r.outName, k = n;
      if (seen[k]) { n = baseName(k) + '-' + (seen[k] + 1) + '.' + k.replace(/^.*\./, ''); }
      seen[k] = (seen[k] || 0) + 1;
      return { name: n, blob: r.outBlob };
    });
    window.oreumZip(files).then(function (zip) {
      save(zip, (EN ? 'images-' : '사진-') + todo.length + (EN ? '' : '장') + '.zip');
      btn.disabled = false; btn.textContent = old;
    });
  }

  function save(blob, name) {
    if (!blob) return;
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  /* ------------------------------------------------------------- 탭(칸 바꾸기)
     페이지를 옮기지 않고 칸만 바꾼다. 넣어 둔 사진은 그대로 두고, 주소만 그 도구 주소로 바꿔 둔다. */
  var PATHS = { convert: 'image-convert', compress: 'image-compress', crop: 'image-crop' };
  function setMode(m, push) {
    if (!PATHS[m] || m === MODE) return;
    MODE = m;
    root.setAttribute('data-mode', m);
    [].forEach.call(root.querySelectorAll('[data-for]'), function (el) { el.hidden = el.getAttribute('data-for') !== m; });
    [].forEach.call(root.querySelectorAll('.pane'), function (el) { el.hidden = el.getAttribute('data-pane') !== m || !recs.length; });
    [].forEach.call(root.querySelectorAll('[data-mode]'), function (b) {
      var on = b.getAttribute('data-mode') === m;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (m === 'crop') {
      if (cur < 0) { var k = recs.findIndex(function (r) { return !r.bad; }); if (k >= 0) cur = k; }
      if (curRec()) { drawCrop(); paintBox(); }
    }
    done.hidden = true; say('');
    render(); updateGo();
    if (push) {
      try {
        var en = location.pathname.indexOf('/en/') === 0 ? '/en' : '';
        history.replaceState(null, '', en + '/apps/' + PATHS[m] + '/');
      } catch (e) {}
    }
  }
  [].forEach.call(root.querySelectorAll('[data-mode]'), function (b) {
    b.onclick = function () { setMode(b.getAttribute('data-mode'), true); };
  });

  goBtn.onclick = function () { run(); };

  /* ------------------------------------------------------------- 시험 손잡이 */
  api.addFiles = addFiles;
  api.run = run;
  api.setMode = function (m) { setMode(m, false); };
  api.mode = function () { return MODE; };
  api.recs = function () { return recs; };
  api.crop = function (c) { var r = curRec(); if (r) { r.crop = c; clampCrop(r); paintBox(); } return r && r.crop; };
  api.select = select;
  api.log = function () { return encLog; };
  window.__im = api;
})();
