/* QR코드 스캔 — 사진·카메라 화면은 브라우저 밖으로 나가지 않는다. fetch·XHR 없음. */
(function () {
  'use strict';
  var L = (/[?&]lang=en\b/.test(location.search) || /^en/i.test(document.documentElement.lang)) ? 'en' : 'ko';
  var T = {
    ko: {
      link: '링크', text: '글', wifi: '와이파이', contact: '연락처', tel: '전화번호', mail: '이메일', sms: '문자',
      open: '열기', copy: '복사', copyPw: '비밀번호 복사', call: '전화 걸기', copied: '복사했습니다',
      notFound: 'QR코드를 찾지 못했습니다. QR코드가 화면에 크게, 흐리지 않게 나온 사진으로 다시 해 보세요.',
      camFail: '카메라를 열 수 없습니다. 카메라 권한을 허용하거나, 사진에서 읽기를 눌러 QR코드를 찍어 주세요.',
      camInsecure: '이 주소에서는 카메라를 쓸 수 없습니다. 사진에서 읽기를 써 주세요.',
      reading: '읽는 중…', ssid: '이름', pw: '비밀번호', sec: '보안', none: '없음', hidden: '숨김 네트워크',
      name: '이름', org: '회사', phone: '전화', email: '이메일',
      ok: '눈에 띄는 위험 신호는 없습니다. 그래도 모르는 곳이면 비밀번호·카드 번호는 넣지 마세요.',
      http: '자물쇠 없는 주소(http)입니다. 입력한 내용이 암호화되지 않습니다.',
      ip: '이름 대신 숫자(IP)로 된 주소입니다. 정상 서비스는 거의 쓰지 않습니다.',
      puny: '다른 글자를 흉내 낸 주소일 수 있습니다(xn--).',
      short: '단축 주소라 실제로 어디로 가는지 알 수 없습니다.',
      at: '주소 안에 @ 가 있어 앞부분은 가짜일 수 있습니다. 실제로 가는 곳은 {h} 입니다.',
      brand: '{b} 처럼 보이지만 실제 주소는 {h} 입니다. 피싱일 수 있습니다.',
      scheme: '웹 주소가 아닌 명령({s})입니다. 열지 마세요.',
      realHost: '실제로 가는 곳'
    },
    en: {
      link: 'Link', text: 'Text', wifi: 'Wi-Fi', contact: 'Contact', tel: 'Phone', mail: 'Email', sms: 'SMS',
      open: 'Open', copy: 'Copy', copyPw: 'Copy password', call: 'Call', copied: 'Copied',
      notFound: 'No QR code found. Try a photo where the QR code is large and sharp.',
      camFail: 'Could not open the camera. Allow camera access, or use Scan from photo.',
      camInsecure: 'The camera is not available on this address. Use Scan from photo.',
      reading: 'Reading…', ssid: 'Name', pw: 'Password', sec: 'Security', none: 'None', hidden: 'Hidden network',
      name: 'Name', org: 'Company', phone: 'Phone', email: 'Email',
      ok: 'No obvious warning signs. Still, do not enter passwords or card numbers on sites you do not know.',
      http: 'Not a secure address (http). What you type is not encrypted.',
      ip: 'The address is a number (IP) instead of a name. Real services rarely do this.',
      puny: 'The address may be imitating other letters (xn--).',
      short: 'This is a short link, so you cannot see where it really goes.',
      at: 'There is an @ in the address, so the first part may be fake. It really goes to {h}.',
      brand: 'Looks like {b}, but the real address is {h}. It may be phishing.',
      scheme: 'This is not a web address but a command ({s}). Do not open it.',
      realHost: 'Really goes to'
    }
  };
  function t(k, v) {
    var s = (T[L][k] != null ? T[L][k] : T.ko[k]) || k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  var $ = function (id) { return document.getElementById(id); };
  var ROOT = document.querySelector('.pm') || document.body;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // ---------- 읽기 ----------
  var detector = null;
  try { if ('BarcodeDetector' in window) detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detector = null; }

  function jsqrOn(canvas, both) {
    var g = canvas.getContext('2d', { willReadFrequently: true });
    var d = g.getImageData(0, 0, canvas.width, canvas.height);
    var r = window.jsQR(d.data, d.width, d.height, { inversionAttempts: both ? 'attemptBoth' : 'dontInvert' });
    return r && r.data ? r.data : null;
  }
  function draw(src, maxSide) {
    var w = src.width || src.videoWidth, h = src.height || src.videoHeight;
    var k = Math.min(1, maxSide / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  function loadImage(file) {
    var p = window.createImageBitmap
      ? createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); })
      : Promise.reject();
    return p.catch(function () {
      return new Promise(function (res, rej) {
        var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = URL.createObjectURL(file);
      });
    });
  }
  // 사진 한 장: 네이티브 → 여러 크기로 jsQR
  function decodeImage(file) {
    return loadImage(file).then(function (img) {
      var first = detector ? detector.detect(img).then(function (a) { return a && a[0] ? a[0].rawValue : null; }).catch(function () { return null; }) : Promise.resolve(null);
      return first.then(function (v) {
        if (v) return v;
        var sizes = [1400, 900, 2200, 600];
        for (var i = 0; i < sizes.length; i++) {
          var r = jsqrOn(draw(img, sizes[i]), true);
          if (r) return r;
        }
        return null;
      });
    });
  }

  // ---------- 무엇인지 알아보기 ----------
  var SHORT = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'ow.ly', 'buff.ly', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'han.gl',
    'me2.do', 'url.kr', 'vo.la', 'buly.kr', 'c11.kr', 'naver.me', 'zrr.kr', 'abit.ly', 'tny.im', 'rb.gy', 'qrco.de', 'qr.link', 'l.ead.me'];
  var BRANDS = { naver: 'naver.com', kakao: 'kakao.com', daum: 'daum.net', google: 'google.com', apple: 'apple.com', toss: 'toss.im',
    coupang: 'coupang.com', samsung: 'samsung.com', kbstar: 'kbstar.com', shinhan: 'shinhan.com', wooribank: 'wooribank.com',
    hanabank: 'hanabank.com', nonghyup: 'nonghyup.com', paypal: 'paypal.com', amazon: 'amazon.com',
    microsoft: 'microsoft.com', instagram: 'instagram.com', facebook: 'facebook.com', epost: 'epost.go.kr',
    police: 'police.go.kr', hometax: 'hometax.go.kr' };
  var OWN = ['kakaopay', 'kakaobank', 'kakaocorp', 'kakaomobility', 'kakaoenterprise', 'navercorp', 'naverpay', 'googleusercontent',
    'googleapis', 'googlevideo', 'samsungcard', 'samsungfire', 'samsunglife', 'shinhancard', 'shinhaninvest', 'coupangeats', 'coupangplay',
    'tossbank', 'tosspayments', 'tossinvest', 'amazonaws', 'appleid', 'microsoftonline', 'hanacard', 'wooricard', 'nonghyupcard'];
  var SLD = /^(co|go|or|ac|ne|re|pe|ms|hs|es|kg|sc|mil|com|net|org|gov|edu)$/;
  function baseDomain(host) {
    var p = host.split('.');
    if (p.length <= 2) return host;
    var n = SLD.test(p[p.length - 2]) && p[p.length - 1].length === 2 ? 3 : 2;
    return p.slice(-n).join('.');
  }
  function checkUrl(u) {
    var out = [], host = u.hostname.toLowerCase(), base = baseDomain(host);
    if (u.protocol === 'http:') out.push(['warn', t('http')]);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.charAt(0) === '[') out.push(['warn', t('ip')]);
    if (host.indexOf('xn--') > -1) out.push(['warn', t('puny')]);
    if (SHORT.indexOf(base) > -1 || SHORT.indexOf(host) > -1) out.push(['warn', t('short')]);
    if (u.username || u.password) out.push(['bad', t('at', { h: host })]);
    // 회사 이름이 앞쪽(하위 주소)이나 다른 낱말에 섞여 있으면 흉내 낸 주소로 본다.
    // 도메인 첫 낱말이 회사 이름 그대로이거나(naver.me, google.co.kr) 그 회사 계열 이름이면 통과.
    var label = base.split('.')[0];
    var rest = host.slice(0, Math.max(0, host.length - base.length)) + label;
    if (label !== '' && OWN.indexOf(label) < 0) {
      for (var b in BRANDS) {
        if (rest.indexOf(b) > -1 && label !== b) { out.push(['bad', t('brand', { b: BRANDS[b], h: base })]); break; }
      }
    }
    if (!out.length) out.push(['ok', t('ok')]);
    return out;
  }
  function unesc(s) { return s.replace(/\\([\\;,:"])/g, '$1'); }
  function parseWifi(s) {
    var o = {}, re = /([TSPH]):((?:\\.|[^;])*);/g, m;
    while ((m = re.exec(s.slice(5)))) o[m[1]] = unesc(m[2]);
    return o;
  }
  function parseVcard(s) {
    var o = {};
    s.split(/\r?\n/).forEach(function (ln) {
      var m = /^([A-Z]+)(?:;[^:]*)?:(.*)$/i.exec(ln.trim()); if (!m) return;
      var k = m[1].toUpperCase(), v = m[2];
      if (k === 'FN') o.name = v; else if (k === 'N' && !o.name) o.name = v.split(';').filter(Boolean).reverse().join(' ');
      else if (k === 'TEL' && !o.tel) o.tel = v; else if (k === 'EMAIL' && !o.email) o.email = v; else if (k === 'ORG' && !o.org) o.org = v.replace(/;/g, ' ');
    });
    return o;
  }
  function classify(raw) {
    var s = raw.trim();
    if (/^WIFI:/i.test(s)) return { kind: 'wifi', wifi: parseWifi(s) };
    if (/^BEGIN:VCARD/i.test(s)) return { kind: 'contact', card: parseVcard(s) };
    if (/^MECARD:/i.test(s)) {
      var o = {}; s.slice(7).split(';').forEach(function (p) { var i = p.indexOf(':'); if (i > 0) o[p.slice(0, i).toUpperCase()] = p.slice(i + 1); });
      return { kind: 'contact', card: { name: (o.N || '').replace(',', ' '), tel: o.TEL, email: o.EMAIL, org: o.ORG } };
    }
    if (/^tel:/i.test(s)) return { kind: 'tel', value: s.slice(4) };
    if (/^mailto:/i.test(s)) return { kind: 'mail', value: s.slice(7).split('?')[0] };
    if (/^smsto?:/i.test(s)) return { kind: 'sms', value: s.replace(/^smsto?:/i, '') };
    var m = /^([a-z][a-z0-9+.-]*):/i.exec(s);
    if (m && !/^https?$/i.test(m[1]) && !/\s/.test(s)) return { kind: 'link', scheme: m[1].toLowerCase() };
    var urlStr = /^https?:\/\//i.test(s) ? s : (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s) ? 'https://' + s : null);
    if (urlStr) { try { return { kind: 'link', url: new URL(urlStr) }; } catch (e) {} }
    return { kind: 'text' };
  }

  // ---------- 보여 주기 ----------
  var toastT;
  function toast(msg) {
    var x = ROOT.querySelector('.toast'); if (!x) { x = el('div', 'toast'); ROOT.appendChild(x); }
    x.textContent = msg; x.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove('on'); }, 1400);
  }
  function copy(s) {
    var done = function () { toast(t('copied')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, fallback); else fallback();
    function fallback() { var a = el('textarea'); a.value = s; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); }
  }
  function btn(label, cls, fn) { var b = el('button', 'big ' + (cls || ''), label); b.type = 'button'; b.onclick = fn; return b; }

  function show(raw, again) {
    var box = $('result'); box.textContent = ''; box.hidden = false; $('note').hidden = true;
    var c = classify(raw), acts = el('div', 'acts');
    box.appendChild(el('span', 'qkind', t(c.kind)));
    if (c.kind === 'link' && c.url) {
      // 크게 보여 주는 건 진짜 주인 도메인만 (naver.com.login-check.xyz → login-check.xyz)
      var real = baseDomain(c.url.hostname.toLowerCase());
      box.appendChild(el('div', 'full', t('realHost')));
      box.appendChild(el('div', 'host', real));
      box.appendChild(el('div', 'full', raw));
      var ul = el('ul', 'checks');
      var cks = checkUrl(c.url);
      cks.forEach(function (k) { ul.appendChild(el('li', k[0], (k[0] === 'ok' ? '✓ ' : '⚠ ') + k[1])); });
      box.appendChild(ul);
      var bad = cks.some(function (k) { return k[0] === 'bad'; });
      var o = btn(t('open'), bad ? 'line' : '', function () { window.open(c.url.href, '_blank', 'noopener'); });
      acts.appendChild(o); acts.appendChild(btn(t('copy'), 'dark', function () { copy(raw); }));
    } else if (c.kind === 'link') {
      box.appendChild(el('div', 'text', raw));
      var ul2 = el('ul', 'checks'); ul2.appendChild(el('li', 'bad', '⚠ ' + t('scheme', { s: c.scheme + ':' }))); box.appendChild(ul2);
      acts.appendChild(btn(t('copy'), 'dark', function () { copy(raw); }));
    } else if (c.kind === 'wifi') {
      var w = c.wifi, dl = el('dl', 'kv');
      [[t('ssid'), w.S], [t('pw'), w.P], [t('sec'), w.T && w.T !== 'nopass' ? w.T : t('none')]].forEach(function (r) {
        if (r[1] == null || r[1] === '') return;
        dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); dl.appendChild(el('span'));
      });
      if (w.H === 'true') { dl.appendChild(el('dt', null, '')); dl.appendChild(el('dd', null, t('hidden'))); dl.appendChild(el('span')); }
      box.appendChild(dl);
      if (w.P) acts.appendChild(btn(t('copyPw'), '', function () { copy(w.P); }));
      acts.appendChild(btn(t('copy'), 'dark', function () { copy(raw); }));
    } else if (c.kind === 'contact') {
      var cd = c.card, dl2 = el('dl', 'kv');
      [[t('name'), cd.name], [t('phone'), cd.tel], [t('email'), cd.email], [t('org'), cd.org]].forEach(function (r) {
        if (!r[1]) return; dl2.appendChild(el('dt', null, r[0])); dl2.appendChild(el('dd', null, r[1])); dl2.appendChild(el('span'));
      });
      box.appendChild(dl2);
      if (cd.tel) acts.appendChild(btn(t('call'), '', function () { location.href = 'tel:' + cd.tel.replace(/[^\d+]/g, ''); }));
      acts.appendChild(btn(t('copy'), 'dark', function () { copy(raw); }));
    } else if (c.kind === 'tel' || c.kind === 'mail' || c.kind === 'sms') {
      box.appendChild(el('div', 'host', c.value));
      if (c.kind === 'tel') acts.appendChild(btn(t('call'), '', function () { location.href = 'tel:' + c.value.replace(/[^\d+]/g, ''); }));
      acts.appendChild(btn(t('copy'), 'dark', function () { copy(c.value); }));
    } else {
      box.appendChild(el('div', 'text', raw));
      acts.appendChild(btn(t('copy'), 'dark', function () { copy(raw); }));
    }
    box.appendChild(acts);
    if (!again) { try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    api.last = { raw: raw, kind: c.kind, checks: c.url ? checkUrl(c.url).map(function (k) { return k[0]; }) : null };
    try { if (!again && window.gtag) gtag('event', 'tool_use', { tool: 'qr_scan', kind: c.kind }); } catch (e) {}
  }
  function note(msg) { var n = $('note'); n.textContent = msg; n.hidden = false; }

  // 최근 기록은 두지 않는다 — 남의 손에 폰이 갔을 때 앞서 읽은 주소가 보이면 안 된다(사장님 2026-09-20).
  // 옛 판에서 저장해 둔 기록이 남아 있으면 지운다.
  try { localStorage.removeItem('oreum.qrscan.hist'); } catch (e) {}

  // ---------- 사진에서 읽기 ----------
  function handleFiles(files) {
    var f = Array.prototype.find.call(files || [], function (x) { return /^image\//.test(x.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(x.name); });
    if (!f) return Promise.resolve();
    stopCam(); note(t('reading'));
    return decodeImage(f).then(function (v) { if (v) show(v); else { $('result').hidden = true; note(t('notFound')); } })
      .catch(function () { $('result').hidden = true; note(t('notFound')); });
  }
  var pick = $('pick');
  $('photoBtn').onclick = function () { pick.click(); };
  pick.onchange = function () { handleFiles(pick.files); pick.value = ''; };

  // ---------- 카메라 ----------
  var stream = null, timer = null, busy = false;
  function stopCam() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(function (tr) { tr.stop(); }); stream = null; }
    $('cam').hidden = true;
  }
  $('camBtn').onclick = function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { note(window.isSecureContext === false ? t('camInsecure') : t('camFail')); return; }
    $('note').hidden = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(function (s) {
        stream = s; var v = $('video'); v.srcObject = s; v.setAttribute('playsinline', ''); v.muted = true;
        $('cam').hidden = false; $('result').hidden = true;
        return v.play().then(function () {
          timer = setInterval(scanFrame, 160);
          $('cam').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }).catch(function () { stopCam(); note(t('camFail')); });
  };
  $('camX').onclick = stopCam;
  function scanFrame() {
    var v = $('video'); if (busy || !v.videoWidth) return; busy = true;
    var p = detector ? detector.detect(v).then(function (a) { return a && a[0] ? a[0].rawValue : null; }).catch(function () { return null; }) : Promise.resolve(null);
    p.then(function (r) { return r || jsqrOn(draw(v, 720), false); })
      .then(function (r) { busy = false; if (r && stream) { stopCam(); show(r); } })
      .catch(function () { busy = false; });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopCam(); });

  // ---------- 끌어다 놓기·붙여넣기 ----------
  var drop = $('drop'), depth = 0;
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') > -1; }
  window.addEventListener('dragenter', function (e) { if (hasFiles(e)) { depth++; drop.classList.add('over'); } });
  window.addEventListener('dragleave', function (e) { if (hasFiles(e) && --depth <= 0) { depth = 0; drop.classList.remove('over'); } });
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; drop.classList.remove('over'); handleFiles(e.dataTransfer.files); });
  document.addEventListener('paste', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var fs = e.clipboardData && e.clipboardData.files; if (fs && fs.length) { e.preventDefault(); handleFiles(fs); }
  });

  var api = window.__qs = { handleFiles: handleFiles, classify: classify, checkUrl: function (s) { return checkUrl(new URL(s)); }, show: show, last: null };
})();
