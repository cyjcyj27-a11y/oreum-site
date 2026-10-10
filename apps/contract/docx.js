/* 계약서 Word(.docx) 만들기 — 이력서 양식의 docx.js 에서 가져온 store zip + WordprocessingML. window.CTDOCX.build(제목, 조각들) → Blob
   조각은 contract.js laborParts 와 같은 것: [종류, [글 | {v,c} | {ck} | {bx}]] 또는 ['party', 이름, [[칸, 값, 꼬리]]] */
(function () {
  'use strict';
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  var enc = new TextEncoder();
  function zip(files) {   // files: [{name, data(Uint8Array)}]
    var parts = [], cen = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), d = f.data, cr = crc32(d), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);
      h.setUint32(14, cr, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nm, d);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
      c.setUint32(16, cr, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      cen.push(new Uint8Array(c.buffer), nm); off += 30 + nm.length + d.length;
    });
    var cl = cen.reduce(function (a, b) { return a + b.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  function x(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var FONT = '<w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕" w:cs="Malgun Gothic"/>';
  function run(t, o) {
    o = o || {}; var pr = FONT + (o.b ? '<w:b/>' : '') + (o.sp ? '<w:spacing w:val="' + o.sp + '"/>' : '') + '<w:sz w:val="' + (o.sz || 19) + '"/><w:szCs w:val="' + (o.sz || 19) + '"/>' + (o.u ? '<w:u w:val="double"/>' : '') + (o.col ? '<w:color w:val="' + o.col + '"/>' : '');
    return String(t).split('\n').map(function (l, i) { return (i ? '<w:r><w:rPr>' + pr + '</w:rPr><w:br/></w:r>' : '') + '<w:r><w:rPr>' + pr + '</w:rPr><w:t xml:space="preserve">' + x(l) + '</w:t></w:r>'; }).join('');
  }
  function para(t, o) {
    o = o || {};
    return '<w:p><w:pPr><w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '" w:line="' + (o.lh || 240) + '" w:lineRule="' + (o.lh ? 'exact' : 'auto') + '"/><w:jc w:val="' + (o.jc || 'center') + '"/>' + (o.ind ? '<w:ind w:right="' + o.ind + '"/>' : '') + '</w:pPr>' + (t === '' ? '' : run(t, o)) + (o.extra || '') + '</w:p>';
  }

  function ul(t, minw) {   // 밑줄 칸: 값이 비면 빈칸 여러 개로 자리를 만든다
    t = t == null ? '' : String(t);
    var pad = Math.max(0, minw - t.length), s = '\u00a0' + t + new Array(pad + 1).join('\u00a0\u00a0') + '\u00a0';
    return '<w:r><w:rPr>' + FONT + '<w:sz w:val="21"/><w:szCs w:val="21"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">' + x(s) + '</w:t></w:r>';
  }
  function runs(a) {
    return a.map(function (r) {
      if (typeof r === 'string') return run(r, { sz: 21 });
      if ('ck' in r) return run('( ' + (r.ck ? '√' : '\u00a0\u00a0') + ' )', { sz: 21 });
      if ('bx' in r) return run((r.bx ? '☑' : '☐') + ' ', { sz: 21 });
      return ul(r.v, r.c === 'w' ? 14 : r.c === 'n' ? 2 : 4);
    }).join('');
  }
  function p(kind, body) {
    var ind = kind === 'sub' ? '<w:ind w:left="255" w:hanging="125"/>' : kind === 'sub2' ? '<w:ind w:left="510"/>' : '';
    var jc = kind === 'date' ? 'center' : 'both', bef = kind === 'it' ? 110 : kind === 'lead' ? 0 : kind === 'lead2' ? 260 : kind === 'date' ? 420 : 20, aft = kind === 'lead' ? 160 : kind === 'date' ? 320 : 0;
    return '<w:p><w:pPr><w:spacing w:before="' + bef + '" w:after="' + aft + '" w:line="330" w:lineRule="exact"/>' + ind + '<w:jc w:val="' + jc + '"/></w:pPr>' + body + '</w:p>';
  }
  function memo(t) {   // 특약사항: 테두리 친 한 칸 표
    var B = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right'].map(function (q) { return '<w:' + q + ' w:val="single" w:sz="5" w:space="0" w:color="333333"/>'; }).join('') + '</w:tblBorders>';
    var lines = String(t || '').split('\n').map(function (l) { return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="exact"/></w:pPr>' + run(l, { sz: 20 }) + '</w:p>'; }).join('');
    return '<w:tbl><w:tblPr><w:tblW w:w="9866" w:type="dxa"/>' + B + '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="9866"/></w:tblGrid>' +
      '<w:tr><w:trPr><w:trHeight w:val="1360" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="9866" w:type="dxa"/></w:tcPr>' + lines + '</w:tc></w:tr></w:tbl>';
  }
  function party(who, rows) {
    var h = '';
    rows.forEach(function (r, i) {
      h += '<w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="360" w:lineRule="exact"/><w:tabs><w:tab w:val="left" w:pos="1250"/><w:tab w:val="left" w:pos="2400"/></w:tabs></w:pPr>' +
        run(i === 0 ? who : '', { sz: 21, b: true }) + '<w:r><w:tab/></w:r>' + run(r[0] + ' : ', { sz: 21 }) + ul(r[1], 22) + run(' ' + r[2], { sz: 21 }) + '</w:p>';
    });
    return h + '<w:p><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr></w:p>';
  }
  function build(title, parts) {
    var body = para(title, { sz: 40, b: true, sp: 60, after: 360 });
    parts.forEach(function (q) {
      if (q[0] === 'party') body += party(q[1], q[2]);
      else if (q[0] === 'memo') body += memo(q[1]);
      else body += p(q[0], runs(q[1]));
    });
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="907" w:right="1020" w:bottom="680" w:left="1020" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>' + FONT +
      '<w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    var drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    return zip([{ name: '[Content_Types].xml', data: enc.encode(ct) }, { name: '_rels/.rels', data: enc.encode(rels) }, { name: 'word/document.xml', data: enc.encode(doc) },
      { name: 'word/styles.xml', data: enc.encode(styles) }, { name: 'word/_rels/document.xml.rels', data: enc.encode(drels) }]);
  }
  window.CTDOCX = { build: build };
})();
