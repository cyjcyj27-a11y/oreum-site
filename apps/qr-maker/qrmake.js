/* QR코드 만들기 — 입력한 내용은 브라우저 안에서만 그림이 된다. fetch·XHR 없음. */
(function () {
  'use strict';
  var L = (/[?&]lang=en\b/.test(location.search) || /^en/i.test(document.documentElement.lang)) ? 'en' : 'ko';
  var T = {
    ko: { empty: '내용을 넣으면 여기에 QR코드가 나옵니다', tooLong: '내용이 너무 길어 QR코드에 다 들어가지 않습니다',
      verOk: '✓ 스캔 확인됨', verBad: '⚠ 이 색 조합은 스캔이 안 될 수 있습니다', saved: '저장했습니다', copied: '복사했습니다',
      copyFail: '이 브라우저는 그림 복사를 못 합니다. PNG 저장을 써 주세요', file: 'QR코드' },
    en: { empty: 'Your QR code appears here', tooLong: 'Too much content to fit in a QR code',
      verOk: '✓ Scan verified', verBad: '⚠ These colors may not scan', saved: 'Saved', copied: 'Copied',
      copyFail: 'This browser cannot copy images. Use Save PNG', file: 'qr-code' }
  };
  function t(k) { return (T[L][k] != null ? T[L][k] : T.ko[k]) || k; }
  var $ = function (id) { return document.getElementById(id); };
  var ROOT = document.querySelector('.pm') || document.body;
  var qrcode = window.qrcode;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

  var mode = 'url';
  var tabs = ROOT.querySelectorAll('.tabs button');
  tabs.forEach(function (b) {
    b.onclick = function () {
      mode = b.dataset.m;
      tabs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      ROOT.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== mode; });
      update();
    };
  });

  function esc(s) { return String(s).replace(/([\\;,:"])/g, '\\$1'); }
  function vesc(s) { return String(s).replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n'); }
  function payload() {
    var v = function (id) { return ($(id).value || '').trim(); };
    if (mode === 'url') {
      var u = v('fUrl'); if (!u) return '';
      return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u;
    }
    if (mode === 'text') return $('fText').value;
    if (mode === 'wifi') {
      var s = v('fSsid'); if (!s) return '';
      var sec = $('fSec').value, p = $('fPw').value;
      return 'WIFI:T:' + sec + ';S:' + esc(s) + ';' + (sec !== 'nopass' ? 'P:' + esc(p) + ';' : '') + ($('fHid').checked ? 'H:true;' : '') + ';';
    }
    if (mode === 'contact') {
      var n = v('fName'), tel = v('fTel'), em = v('fMail'), org = v('fOrg');
      if (!n && !tel && !em) return '';
      var out = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (n) { out.push('N:' + vesc(n) + ';;;;'); out.push('FN:' + vesc(n)); }
      if (org) out.push('ORG:' + vesc(org));
      if (tel) out.push('TEL;TYPE=CELL:' + tel);
      if (em) out.push('EMAIL:' + em);
      out.push('END:VCARD');
      return out.join('\n');
    }
    return '';
  }

  var cur = null; // { qr, text }
  function build(text) {
    var ecl = $('oEcl').value;
    var qr = qrcode(0, ecl);
    qr.addData(text, 'Byte');
    qr.make();
    return qr;
  }
  // 모듈 크기를 정수로 맞춰 흐림 없이 그린다
  function paint(canvas, qr, px, dark, light, margin) {
    var n = qr.getModuleCount(), total = n + margin * 2, cell = Math.max(1, Math.floor(px / total));
    var size = cell * total;
    canvas.width = size; canvas.height = size;
    var g = canvas.getContext('2d');
    g.clearRect(0, 0, size, size);
    if (light) { g.fillStyle = light; g.fillRect(0, 0, size, size); }
    g.fillStyle = dark;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (qr.isDark(r, c)) g.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
    }
    return canvas;
  }
  function svgOf(qr, dark, light, margin) {
    var n = qr.getModuleCount(), total = n + margin * 2, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + (c + margin) + ' ' + (r + margin) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      (light ? '<rect width="100%" height="100%" fill="' + light + '"/>' : '') + '<path fill="' + dark + '" d="' + d + '"/></svg>';
  }
  function colors() {
    var dark = $('oDark').value, light = $('oBg').value === 'none' ? null : '#ffffff';
    return { dark: dark, light: light };
  }
  function lum(hex) {
    var n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }

  var verT = null;
  function update() {
    var text = payload(), box = $('prevBox'), ver = $('ver');
    ver.textContent = ''; ver.className = 'ver';
    $('saveBtn').disabled = $('svgBtn').disabled = $('copyBtn').disabled = true;
    if (!text) { cur = null; box.innerHTML = ''; box.appendChild(Object.assign(document.createElement('p'), { className: 'empty', textContent: t('empty') })); return; }
    try { var qr = build(text); } catch (e) { cur = null; box.innerHTML = ''; box.appendChild(Object.assign(document.createElement('p'), { className: 'empty', textContent: t('tooLong') })); return; }
    cur = { qr: qr, text: text };
    var col = colors(), cv = document.createElement('canvas');
    paint(cv, qr, 600, col.dark, col.light || '#ffffff', 4);
    box.innerHTML = ''; box.appendChild(cv);
    $('saveBtn').disabled = $('svgBtn').disabled = $('copyBtn').disabled = false;
    // 스스로 읽어 보기: 만든 그림을 다시 스캔해서 내용이 같은지 본다
    clearTimeout(verT);
    verT = setTimeout(function () {
      if (!window.jsQR || !cur || cur.text !== text) return;
      var c2 = paint(document.createElement('canvas'), qr, 400, col.dark, col.light || '#ffffff', 4);
      var d = c2.getContext('2d').getImageData(0, 0, c2.width, c2.height);
      var r = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' });
      var okContrast = (1.05) / (lum(col.dark) + .05) >= 3;
      var good = r && r.data === text && okContrast;
      ver.textContent = good ? t('verOk') : t('verBad'); ver.className = 'ver ' + (good ? 'ok' : 'bad');
      api.verified = !!good;
    }, 250);
  }

  function fname(ext) {
    var base = t('file');
    if (mode === 'url') { try { base += '_' + new URL(payload()).hostname.replace(/^www\./, ''); } catch (e) {} }
    else if (mode === 'wifi') base += '_wifi';
    return base.replace(/[\\/:*?"<>|]/g, '') + '.' + ext;
  }
  function download(blob, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; document.body.appendChild(a);
    if (!api.noAutoDownload) a.click();
    a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    toast(t('saved'));
    try { if (window.gtag) gtag('event', 'tool_use', { tool: 'qr_make', kind: mode, fmt: name.split('.').pop() }); } catch (e) {}
  }
  function bigCanvas() { var c = colors(); return paint(document.createElement('canvas'), cur.qr, +$('oSize').value, c.dark, c.light, 4); }
  $('saveBtn').onclick = function () { if (!cur) return; bigCanvas().toBlob(function (b) { download(b, fname('png')); }, 'image/png'); };
  $('svgBtn').onclick = function () { if (!cur) return; var c = colors(); download(new Blob([svgOf(cur.qr, c.dark, c.light, 4)], { type: 'image/svg+xml' }), fname('svg')); };
  $('copyBtn').onclick = function () {
    if (!cur) return;
    var c = colors(), cv = paint(document.createElement('canvas'), cur.qr, 800, c.dark, c.light || '#ffffff', 4);
    if (!navigator.clipboard || !window.ClipboardItem) { toast(t('copyFail')); return; }
    cv.toBlob(function (b) {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(function () { toast(t('copied')); }, function () { toast(t('copyFail')); });
    }, 'image/png');
  };

  var toastT;
  function toast(msg) {
    var x = ROOT.querySelector('.toast'); if (!x) { x = document.createElement('div'); x.className = 'toast'; ROOT.appendChild(x); }
    x.textContent = msg; x.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove('on'); }, 1400);
  }

  ROOT.querySelectorAll('input, textarea, select').forEach(function (e) { e.addEventListener('input', update); e.addEventListener('change', update); });
  $('fSec').addEventListener('change', function () { $('pwWrap').hidden = $('fSec').value === 'nopass'; });
  update();
  var api = window.__qm = { update: update, payload: payload, get cur() { return cur; }, verified: null, noAutoDownload: false, svg: function () { var c = colors(); return cur && svgOf(cur.qr, c.dark, c.light, 4); } };
})();
