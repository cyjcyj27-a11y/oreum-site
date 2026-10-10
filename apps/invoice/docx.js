/* 거래명세서 Word(.docx) — 이력서 양식 docx.js 의 store zip·표 만들기를 가져와 씀. window.IVDOCX.build(o) → Blob */
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
  // 칸: {t, th, span, vm('r'|'c'), l(왼쪽 맞춤), cap, img}
  function tc(c, w) {
    var shade = c.cap ? 'D9DEE7' : c.th ? 'EEF0F3' : '';
    var pr = '<w:tcW w:w="' + w + '" w:type="dxa"/>' + (c.span > 1 ? '<w:gridSpan w:val="' + c.span + '"/>' : '') + (c.vm ? '<w:vMerge' + (c.vm === 'r' ? ' w:val="restart"' : '') + '/>' : '') +
      (shade ? '<w:shd w:val="clear" w:color="auto" w:fill="' + shade + '"/>' : '') + '<w:vAlign w:val="' + (c.top ? 'top' : 'center') + '"/>';
    var body = c.img || para(c.t == null ? '' : c.t, { jc: c.l ? 'left' : c.r ? 'right' : 'center', b: c.th || c.cap, sp: c.cap ? 60 : 0, sz: c.cap ? 21 : c.th ? 18 : 19, lh: c.cap ? 270 : 240 });
    return '<w:tc><w:tcPr>' + pr + '</w:tcPr>' + body + '</w:tc>';
  }
  function tbl(widths, rows, hgt) {
    var B = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="single" w:sz="5" w:space="0" w:color="333333"/>'; }).join('') + '</w:tblBorders>';
    var h = '<w:tbl><w:tblPr><w:tblW w:w="' + widths.reduce(function (a, b) { return a + b; }, 0) + '" w:type="dxa"/><w:tblLayout w:type="fixed"/>' + B +
      '<w:tblCellMar><w:top w:w="15" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="15" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' +
      widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
    rows.forEach(function (r) {
      h += '<w:tr><w:trPr><w:cantSplit/>' + (r.hd ? '<w:tblHeader/>' : '') + '<w:trHeight w:val="' + (r.h || hgt || 330) + '" w:hRule="atLeast"/></w:trPr>'; var gi = 0;
      r.c.forEach(function (c) { var sp = c.span || 1, w = 0; for (var k = 0; k < sp; k++) w += widths[gi + k]; gi += sp; h += tc(c, w); });
      h += '</w:tr>';
    });
    return h + '</w:tbl>' + GAP;
  }
  var GAP = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="170" w:lineRule="exact"/><w:rPr><w:sz w:val="6"/><w:szCs w:val="6"/></w:rPr></w:pPr></w:p>';

  var TW = 10658;
  function pc(arr) { var w = arr.map(function (p) { return Math.round(TW * p / 100); }); w[w.length - 1] += TW - w.reduce(function (a, b) { return a + b; }, 0); return w; }
  function ko(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일' : '      년    월    일'; }
  function copy(o, label) {
    var D = o.D, S = D.sup, t = o.t;
    var body = para('거 래 명 세 서' + (label ? '  (' + label + ')' : ''), { sz: 32, b: true, after: 120, col: '1F3B73' });
    var left = '작성일 : ' + ko(D.date || o.today) + '\n일련번호 : ' + (D.no || '') + '\n' + (D.cus || '') + ' 귀하\n아래와 같이 계산합니다.';
    body += tbl(pc([37, 5, 12, 17, 9, 20]), [
      { c: [{ t: left, l: 1, vm: 'r', top: 1 }, { t: '공\n급\n자', th: 1, vm: 'r' }, { t: '등록번호', th: 1 }, { t: S.reg, span: 3 }] },
      { c: [{ vm: 'c' }, { vm: 'c' }, { t: '상호', th: 1 }, { t: S.name }, { t: '성명', th: 1 }, { t: (S.ceo || '') + '   (인)' }] },
      { c: [{ vm: 'c' }, { vm: 'c' }, { t: '사업장 주소', th: 1 }, { t: S.addr, span: 3, l: 1 }] },
      { c: [{ vm: 'c' }, { vm: 'c' }, { t: '업태', th: 1 }, { t: S.biz }, { t: '종목', th: 1 }, { t: S.item }] },
      { c: [{ vm: 'c' }, { vm: 'c' }, { t: '전화', th: 1 }, { t: S.tel, span: 3 }] }]);
    body += tbl(pc([17, 83]), [{ h: 450, c: [{ t: '합계금액', th: 1 }, { t: t.total ? '금 ' + o.han(t.total) + '원정 (₩' + o.money(t.total) + ')' + (D.vat === '면세' ? ' 면세' : ' 부가세 포함') : '', l: 1 }] }]);
    var R = [{ c: ['월일', '품목', '규격', '수량', '단가', '공급가액', '세액', '비고'].map(function (x) { return { t: x, th: 1 }; }) }];
    for (var i = 0; i < Math.max(o.rows, o.list.length); i++) {
      var it = o.list[i] || {}, l = o.list[i] ? o.line(it) : [0, 0];
      R.push({ c: [{ t: it.md }, { t: it.name, l: 1 }, { t: it.spec }, { t: it.qty, r: 1 }, { t: o.num(it.price) ? o.money(o.num(it.price)) : '', r: 1 }, { t: o.money(l[0]), r: 1 }, { t: o.list[i] && l[0] ? (o.money(l[1]) || '0') : '', r: 1 }, { t: '' }] });
    }
    R.push({ c: [{ t: '합 계', th: 1, span: 3 }, { t: t.qty ? String(Math.round(t.qty * 100) / 100) : '', r: 1 }, { t: '' }, { t: o.money(t.sup), r: 1 }, { t: t.sup ? (o.money(t.tax) || '0') : '', r: 1 }, { t: '' }] });
    body += tbl(pc([8, 24, 13, 8, 12, 14, 11, 10]), R);
    var sb = t.prev || t.paid;
    body += tbl(pc([10, 15, 10, 15, 10, 15, 10, 15]), [{ c: [{ t: '전잔금', th: 1 }, { t: sb ? o.money(t.prev) : '', r: 1 }, { t: '입금', th: 1 }, { t: sb ? o.money(t.paid) : '', r: 1 }, { t: '잔금', th: 1 }, { t: sb ? Math.round(t.bal).toLocaleString('ko-KR') : '', r: 1 }, { t: '인수자', th: 1 }, { t: '(인)', r: 1 }] }]);
    return body;
  }
  function build(o) {
    var body = o.copies === 2 ? copy(o, '공급자 보관용') + para('', { after: 200 }) + copy(o, '공급받는자 보관용') : copy(o, '');
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="567" w:right="624" w:bottom="454" w:left="624" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>' + FONT +
      '<w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    var drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    return zip([{ name: '[Content_Types].xml', data: enc.encode(ct) }, { name: '_rels/.rels', data: enc.encode(rels) }, { name: 'word/document.xml', data: enc.encode(doc) },
      { name: 'word/styles.xml', data: enc.encode(styles) }, { name: 'word/_rels/document.xml.rels', data: enc.encode(drels) }]);
  }
  window.IVDOCX = { build: build };
})();
