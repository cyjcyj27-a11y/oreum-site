/* 작은 ZIP 묶개 — 압축 없이(stored) 파일을 하나로 묶는다.
   그림은 이미 압축된 파일이라 다시 압축해도 거의 안 줄어서, 압축 없이 담는다.
   외부 부품 없이 이 파일만으로 돌아간다. window.oreumZip(files) → Promise<Blob> */
(function () {
  'use strict';

  var TBL = (function () {
    var t = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = TBL[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosTime(d) {
    var t = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
    var dt = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
    return { t: t, d: dt };
  }

  function put(a, o, n, v) {          // 작은 끝 먼저(little endian)
    for (var i = 0; i < n; i++) a[o + i] = (v >>> (i * 8)) & 0xFF;
  }

  // files: [{name: '사진.jpg', blob: Blob}]
  function zip(files) {
    var enc = new TextEncoder();
    var jobs = files.map(function (f) {
      return f.blob.arrayBuffer().then(function (ab) {
        return { name: enc.encode(f.name), data: new Uint8Array(ab) };
      });
    });
    return Promise.all(jobs).then(function (items) {
      var now = dosTime(new Date()), parts = [], cd = [], off = 0;
      items.forEach(function (it) {
        var crc = crc32(it.data), n = it.name.length, sz = it.data.length;
        var lh = new Uint8Array(30 + n);
        put(lh, 0, 4, 0x04034b50); put(lh, 4, 2, 20); put(lh, 6, 2, 0x0800); put(lh, 8, 2, 0);
        put(lh, 10, 2, now.t); put(lh, 12, 2, now.d); put(lh, 14, 4, crc);
        put(lh, 18, 4, sz); put(lh, 22, 4, sz); put(lh, 26, 2, n); put(lh, 28, 2, 0);
        lh.set(it.name, 30);
        parts.push(lh, it.data);

        var ch = new Uint8Array(46 + n);
        put(ch, 0, 4, 0x02014b50); put(ch, 4, 2, 20); put(ch, 6, 2, 20); put(ch, 8, 2, 0x0800);
        put(ch, 10, 2, 0); put(ch, 12, 2, now.t); put(ch, 14, 2, now.d); put(ch, 16, 4, crc);
        put(ch, 20, 4, sz); put(ch, 24, 4, sz); put(ch, 28, 2, n);
        put(ch, 42, 4, off); ch.set(it.name, 46);
        cd.push(ch);
        off += lh.length + sz;
      });
      var cdSize = cd.reduce(function (s, c) { return s + c.length; }, 0);
      var end = new Uint8Array(22);
      put(end, 0, 4, 0x06054b50); put(end, 8, 2, items.length); put(end, 10, 2, items.length);
      put(end, 12, 4, cdSize); put(end, 16, 4, off);
      return new Blob(parts.concat(cd, [end]), { type: 'application/zip' });
    });
  }

  window.oreumZip = zip;
})();
