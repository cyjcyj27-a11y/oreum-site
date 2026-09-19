/* PDF 합치기 — 파일은 브라우저 밖으로 나가지 않는다. fetch·XHR 없음. */
(function () {
  'use strict';
  var L = (/[?&]lang=en\b/.test(location.search) || /^en/i.test(document.documentElement.lang)) ? 'en' : 'ko';
  var ROOT = document.querySelector('.pm') || document.body;
  var T = {
    ko: {
      count: '파일 {n}개 · {p}쪽', pagesOf: '{p}쪽', img: '사진 → 1쪽',
      encrypted: '암호가 걸린 PDF라 합칠 수 없습니다', broken: '열 수 없는 PDF입니다',
      heic: 'HEIC 사진은 아직 못 넣습니다 (JPG로 바꿔 주세요)', badImg: '열 수 없는 사진입니다',
      notSupported: 'PDF나 사진만 넣을 수 있습니다',
      rangeErr: '예: 1-3, 5', reading: '파일 읽는 중…', working: '{i}/{n} 합치는 중…', saving: '저장하는 중…',
      doneInfo: '{p}쪽 · {s}', noPages: '합칠 페이지가 없습니다', defName: '합친파일',
      up: '위로', down: '아래로', del: '빼기', all: '전체', fail: '합치지 못했습니다: '
    },
    en: {
      title: 'Merge PDF', p1: 'No install', p2: 'No sign-up', p3: 'No limits', p4: 'Files never leave your device',
      pick: '＋ Choose files', hint: 'PDFs & photos (JPG, PNG)', hintPc: ' · drag & drop · Ctrl+V',
      sort: 'By name', clear: 'Remove all', more: '＋ Add more files', fname: 'File name', merge: 'Merge PDF',
      doneT: 'Done!', dl: 'Download again', pages: 'Pages',
      safe: '🔒 Your files are merged inside this browser on your device. Nothing is uploaded anywhere, so contracts and ID copies are safe.',
      count: '{n} files · {p} pages', pagesOf: '{p} pages', img: 'Photo → 1 page',
      encrypted: 'This PDF is password-protected and cannot be merged', broken: 'This PDF cannot be opened',
      heic: 'HEIC photos are not supported yet (convert to JPG)', badImg: 'This photo cannot be opened',
      notSupported: 'Only PDFs and photos can be added',
      rangeErr: 'e.g. 1-3, 5', reading: 'Reading files…', working: 'Merging {i}/{n}…', saving: 'Saving…',
      doneInfo: '{p} pages · {s}', noPages: 'No pages to merge', defName: 'merged',
      up: 'Move up', down: 'Move down', del: 'Remove', all: 'All', fail: 'Could not merge: '
    }
  };
  function t(k, v) {
    var s = (T[L][k] != null ? T[L][k] : T.ko[k]) || k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  var $ = function (id) { return document.getElementById(id); };

  if (L === 'en' && document.documentElement.lang !== 'en') {
    document.documentElement.lang = 'en';
    document.title = 'Merge PDF — free, no install, no sign-up | Oreum Games';
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var k = el.getAttribute('data-t'); if (T.en[k]) el.textContent = T.en[k];
    });
    $('outName').value = t('defName');
  }

  var PL = window.PDFLib;
  var items = [];      // {id,name,size,kind,file,doc,pages,err,range,thumb}
  var seq = 0, busy = false, lastUrl = null;
  var list = $('list'), rowT = $('rowT');

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + ' MB';
  }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name); }
  function isHeic(f) { return /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name); }
  function isImg(f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name); }

  // "1-3, 5, 8-" → 0부터 세는 번호. 빈칸이면 전체. 틀리면 null.
  function parseRange(s, n) {
    s = (s || '').replace(/\s+/g, '').replace(/[~〜–—]/g, '-');
    if (!s) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
    var out = [], parts = s.split(/[,，]/);
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j]; if (!p) continue;
      var m = /^(\d*)-(\d*)$/.exec(p), lo, hi;
      if (m) { lo = m[1] ? +m[1] : 1; hi = m[2] ? +m[2] : n; }
      else if (/^\d+$/.test(p)) { lo = hi = +p; }
      else return null;
      if (lo < 1 || hi > n || lo > hi) return null;
      for (var k = lo; k <= hi; k++) out.push(k - 1);
    }
    return out.length ? out : null;
  }

  function addFiles(files) {
    files = Array.prototype.slice.call(files || []);
    if (!files.length) return Promise.resolve();
    clearDone();
    var jobs = files.map(function (f) {
      var it = { id: ++seq, name: f.name || 'image.png', size: f.size, file: f, range: '' };
      if (isPdf(f)) it.kind = 'pdf';
      else if (isHeic(f)) { it.kind = 'img'; it.err = t('heic'); }
      else if (isImg(f)) it.kind = 'img';
      else { it.kind = 'pdf'; it.err = t('notSupported'); }
      items.push(it);
      return it;
    });
    render();
    return Promise.all(jobs.map(function (it) {
      if (it.err) return null;
      if (it.kind === 'img') {
        it.thumb = URL.createObjectURL(it.file); it.pages = 1;
        return null;
      }
      return it.file.arrayBuffer().then(function (buf) {
        return PL.PDFDocument.load(buf, { updateMetadata: false });
      }).then(function (doc) {
        it.doc = doc; it.pages = doc.getPageCount();
      }).catch(function (e) {
        it.err = /encrypt/i.test(String(e && e.message)) ? t('encrypted') : t('broken');
      });
    })).then(render);
  }

  function totalPages() {
    return items.reduce(function (s, it) {
      if (it.err || !it.pages) return s;
      var r = it.kind === 'pdf' ? parseRange(it.range, it.pages) : [0];
      return s + (r ? r.length : 0);
    }, 0);
  }

  function render() {
    list.textContent = '';
    items.forEach(function (it, i) {
      var li = rowT.content.firstElementChild.cloneNode(true);
      li.dataset.id = it.id;
      if (it.err) li.classList.add('bad');
      if (it.kind === 'img') li.classList.add('img');
      li.querySelector('.num').textContent = i + 1;
      var ico = li.querySelector('.ico');
      if (it.thumb) { var im = new Image(); im.src = it.thumb; im.alt = ''; ico.appendChild(im); }
      else ico.textContent = it.kind === 'img' ? 'IMG' : 'PDF';
      li.querySelector('.fn').textContent = it.name;
      li.querySelector('.fn').title = it.name;
      var info = it.err ? it.err
        : it.pages == null ? t('reading')
        : (it.kind === 'img' ? t('img') : t('pagesOf', { p: it.pages })) + ' · ' + fmtSize(it.size);
      li.querySelector('.info').textContent = info;
      var inp = li.querySelector('.range input');
      inp.value = it.range; inp.placeholder = t('all');
      if (it.range && it.pages && !parseRange(it.range, it.pages)) inp.classList.add('err');
      inp.addEventListener('input', function () {
        it.range = inp.value; clearDone();
        inp.classList.toggle('err', !!inp.value.trim() && !parseRange(inp.value, it.pages));
        updateHead();
      });
      var up = li.querySelector('.up'), dn = li.querySelector('.down'), del = li.querySelector('.del');
      up.setAttribute('aria-label', t('up')); dn.setAttribute('aria-label', t('down')); del.setAttribute('aria-label', t('del'));
      up.disabled = i === 0; dn.disabled = i === items.length - 1;
      up.onclick = function () { move(i, i - 1); };
      dn.onclick = function () { move(i, i + 1); };
      del.onclick = function () { remove(it); };
      bindDrag(li);
      list.appendChild(li);
    });
    ROOT.classList.toggle('has', items.length > 0);
    $('listWrap').hidden = items.length === 0;
    updateHead();
  }
  function updateHead() {
    $('count').textContent = t('count', { n: items.length, p: totalPages() });
    var bad = items.some(function (it) { return !it.err && it.kind === 'pdf' && it.pages && it.range.trim() && !parseRange(it.range, it.pages); });
    var loading = items.some(function (it) { return !it.err && it.pages == null; });
    $('merge').disabled = busy || loading || bad || totalPages() === 0;
  }
  function move(a, b) {
    if (b < 0 || b >= items.length) return;
    var x = items.splice(a, 1)[0]; items.splice(b, 0, x);
    clearDone(); render();
  }
  function remove(it) {
    items = items.filter(function (x) { return x !== it; });
    if (it.thumb) URL.revokeObjectURL(it.thumb);
    clearDone(); render();
  }

  // 끌어서 순서 바꾸기 (PC)
  var dragId = null;
  function bindDrag(li) {
    li.addEventListener('dragstart', function (e) {
      if (e.target.closest && e.target.closest('input')) { e.preventDefault(); return; }
      dragId = +li.dataset.id; li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'row'); } catch (_) {}
    });
    li.addEventListener('dragend', function () { dragId = null; li.classList.remove('dragging'); clearTargets(); });
    li.addEventListener('dragover', function (e) {
      if (dragId == null) return;
      e.preventDefault(); e.stopPropagation();
      clearTargets(); li.classList.add('target');
    });
    li.addEventListener('drop', function (e) {
      if (dragId == null) return;
      e.preventDefault(); e.stopPropagation();
      var from = idxOf(dragId), to = idxOf(+li.dataset.id);
      dragId = null; clearTargets();
      if (from > -1 && to > -1 && from !== to) move(from, to);
    });
  }
  function idxOf(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return i; return -1; }
  function clearTargets() { list.querySelectorAll('.target').forEach(function (x) { x.classList.remove('target'); }); }

  // 사진 → JPEG 바이트. 폰 사진의 회전(EXIF)을 바로잡고, 긴 변 2480px(A4 300dpi)로 줄인다.
  function imageToJpeg(file) {
    var load = window.createImageBitmap
      ? createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); })
      : Promise.reject();
    return load.catch(function () {
      return new Promise(function (res, rej) {
        var im = new Image(), u = URL.createObjectURL(file);
        im.onload = function () { res(im); }; im.onerror = rej; im.src = u;
      });
    }).then(function (src) {
      var w = src.width, h = src.height, k = Math.min(1, 2480 / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(src, 0, 0, c.width, c.height);
      if (src.close) src.close();
      return new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.9); });
    }).then(function (b) { return b.arrayBuffer(); });
  }

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function progress(f, txt) { $('barIn').style.width = Math.round(f * 100) + '%'; $('busyTxt').textContent = txt; }

  function outName() {
    var n = ($('outName').value || '').replace(/[\\/:*?"<>| -]/g, '').replace(/\.pdf$/i, '').trim();
    return (n || t('defName')) + '.pdf';
  }

  function merge() {
    if (busy) return Promise.resolve();
    var good = items.filter(function (it) { return !it.err && it.pages; });
    if (!totalPages()) { alert(t('noPages')); return Promise.resolve(); }
    busy = true; updateHead(); clearDone();
    $('busy').hidden = false; progress(0, t('working', { i: 0, n: good.length }));
    var out, i = 0;
    return PL.PDFDocument.create().then(function (d) {
      out = d;
      return good.reduce(function (p, it) {
        return p.then(function () {
          progress(i / (good.length + 1), t('working', { i: i + 1, n: good.length }));
          return tick();
        }).then(function () {
          if (it.kind === 'pdf') {
            return out.copyPages(it.doc, parseRange(it.range, it.pages)).then(function (pages) {
              pages.forEach(function (pg) { out.addPage(pg); });
            });
          }
          return imageToJpeg(it.file).then(function (bytes) { return out.embedJpg(bytes); }).then(function (img) {
            var land = img.width > img.height, W = land ? 841.89 : 595.28, H = land ? 595.28 : 841.89;
            var k = Math.min(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
            out.addPage([W, H]).drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
          });
        }).then(function () { i++; });
      }, Promise.resolve());
    }).then(function () {
      progress(good.length / (good.length + 1), t('saving'));
      return tick();
    }).then(function () {
      return out.save();
    }).then(function (bytes) {
      api.lastBytes = bytes;
      var blob = new Blob([bytes], { type: 'application/pdf' });
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      var a = $('dl'); a.href = lastUrl; a.download = outName();
      $('doneInfo').textContent = outName() + ' · ' + t('doneInfo', { p: out.getPageCount(), s: fmtSize(blob.size) });
      $('busy').hidden = true; $('done').hidden = false;
      if (!api.noAutoDownload) a.click();
      // 통계에는 숫자만 보낸다(파일 이름·내용은 보내지 않는다)
      try { if (window.gtag) gtag('event', 'tool_use', { tool: 'pdf_merge', files: good.length, pages: out.getPageCount() }); } catch (_) {}
      $('done').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }).catch(function (e) {
      $('busy').hidden = true;
      alert(t('fail') + (e && e.message ? e.message : e));
    }).then(function () { busy = false; updateHead(); });
  }
  function clearDone() { $('done').hidden = true; }

  // 넣는 길: 고르기 단추 · 끌어다 놓기(창 어디든) · 붙여넣기
  var pick = $('pick');
  $('pickBtn').onclick = $('addMore').onclick = function () { pick.click(); };
  pick.onchange = function () { addFiles(pick.files); pick.value = ''; };
  $('drop').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick.click(); } });
  var drop = $('drop'), depth = 0;
  function hasFiles(e) { return dragId == null && e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') > -1; }
  window.addEventListener('dragenter', function (e) { if (hasFiles(e)) { depth++; drop.classList.add('over'); } });
  window.addEventListener('dragleave', function (e) { if (hasFiles(e) && --depth <= 0) { depth = 0; drop.classList.remove('over'); } });
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth = 0; drop.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });
  document.addEventListener('paste', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    var fs = e.clipboardData && e.clipboardData.files;
    if (fs && fs.length) { e.preventDefault(); addFiles(fs); }
  });

  $('sortName').onclick = function () {
    items.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }); });
    clearDone(); render();
  };
  $('clearAll').onclick = function () {
    items.forEach(function (it) { if (it.thumb) URL.revokeObjectURL(it.thumb); });
    items = []; clearDone(); render();
  };
  $('merge').onclick = merge;
  $('outName').addEventListener('input', clearDone);

  // 시험 손잡이
  var api = window.__pm = { addFiles: addFiles, merge: merge, parseRange: parseRange, noAutoDownload: false,
    get items() { return items; } };
})();
