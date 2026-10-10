/* 이력서 Word(.docx) 만들기 — 라이브러리 없이 압축 안 한 zip(store) 에 WordprocessingML 을 직접 넣는다. window.RSDOCX.build(D, opt) → Blob */
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
    var body = c.img || para(c.t == null ? '' : c.t, { jc: c.l ? 'left' : 'center', b: c.th || c.cap, sp: c.cap ? 60 : 0, sz: c.cap ? 21 : c.th ? 18 : 19, lh: c.cap ? 270 : 240 });
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
  function drawing(cx, cy) {
    return '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="1" name="photo"/>' +
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:nvPicPr><pic:cNvPr id="1" name="photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }
  function per(a, b) { a = a || ''; b = b || ''; if (!a && !b) return ''; return a + ' ~ ' + (b || '현재'); }
  var TW = 10206;
  function pc(arr) { var w = arr.map(function (p) { return Math.round(TW * p / 100); }); w[w.length - 1] += TW - w.reduce(function (a, b) { return a + b; }, 0); return w; }
  function resumeBody(D, opt) {
    var body = para('이 력 서', { sz: 50, b: true, u: true, after: 160 });
    var hasImg = !!D.photo;
    var pic = hasImg ? { img: drawing(1080000, 1440000), vm: 'r' } : { t: '사진\n(3x4)', vm: 'r', col: '999999' };
    var W0 = [1701, 1531, 2722, 1531, 2721];
    body += tbl(W0, [
      { h: 440, c: [pic, { t: '성명', th: 1 }, { t: D.name }, { t: '한자', th: 1 }, { t: D.hanja }] },
      { h: 440, c: [{ vm: 'c' }, { t: '영문', th: 1 }, { t: D.en }, { t: '생년월일', th: 1 }, { t: (D.birth || '') + (D.birth ? opt.age(D.birth) : '') }] },
      { h: 440, c: [{ vm: 'c' }, { t: '휴대폰', th: 1 }, { t: D.phone }, { t: '이메일', th: 1 }, { t: D.email }] },
      { h: 440, c: [{ vm: 'c' }, { t: '주소', th: 1 }, { t: D.addr, span: 3, l: 1 }] },
      { h: 440, c: [{ vm: 'c' }, { t: '지원 분야', th: 1 }, { t: D.apply, span: 3, l: 1 }] }]);
    opt.secs.forEach(function (s, si) {
      if (!D[s.k + '_on']) return;
      if (si === 4) milTable();
      var rows = D[s.k].filter(function (r) { return s.cols.some(function (c) { return (r[c.k] || '').trim(); }); });
      var n = D.fill ? Math.max(s.min - (opt.cut || 0), rows.length, 1) : Math.max(1, rows.length), R = [{ hd: 1, c: [{ t: s.cap.replace(/ /g, ''), cap: 1, span: s.wid.length }] }, { hd: 1, c: s.head.map(function (hh) { return { t: hh, th: 1 }; }) }];
      for (var i = 0; i < n; i++) {
        var r = rows[i] || {}, c;
        if (s.k === 'edu') c = [{ t: r.from && !r.to ? r.from + ' ~' : per(r.from, r.to) }, { t: r.school, l: 1 }, { t: r.major }, { t: r.school || r.from ? r.st || '졸업' : '' }, { t: r.loc }];
        else if (s.k === 'career') c = [{ t: r.co || r.from ? per(r.from, r.to) : '' }, { t: r.co, l: 1 }, { t: r.pos }, { t: r.task, l: 1 }];
        else if (s.k === 'cert') c = [{ t: r.date }, { t: r.name, l: 1 }, { t: r.grade }, { t: r.org }];
        else if (s.k === 'lang') c = [{ t: r.lang }, { t: r.test }, { t: r.score }, { t: r.date }];
        else c = [{ t: per(r.from, r.to) }, { t: r.name, l: 1 }, { t: r.org }, { t: r.desc, l: 1 }];
        R.push({ c: c });
      }
      body += tbl(pc(s.wid), R);
    });
    function milTable() {
      if (!D.mil_on) return; var m = D.mil || {};
      body += tbl(pc([14, 14, 13, 29, 30]), [{ c: [{ t: '병역', cap: 1, span: 5 }] }, { c: ['구분', '군별', '계급', '복무 기간', '면제 사유'].map(function (t) { return { t: t, th: 1 }; }) },
        { c: [{ t: m.kind }, { t: m.branch }, { t: m.rank }, { t: m.from || m.to ? per(m.from, m.to) : '' }, { t: m.note }] }]);
    }
    if (!D.act_on) milTable();
    if (D.etc_on) body += tbl([TW], [{ c: [{ t: '기타사항', cap: 1 }] }, { h: 800, c: [{ t: D.etc, l: 1, top: 1 }] }]);
    var sd = D.sdate || opt.today, m2 = /^(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(sd);
    body += para('위의 기재 사항은 사실과 틀림없습니다.', { sz: 21, before: 140, after: 60, lh: 300 });
    body += para(m2 ? m2[1] + '년 ' + (+m2[2]) + '월 ' + (+m2[3]) + '일' : '년     월     일', { sz: 21, after: 100, lh: 300 });
    body += para('작성자   ' + (D.name || '          ') + '   (인)', { sz: 22, jc: 'right', ind: 200, lh: 320 });
    return { body: body, hasImg: hasImg };
  }
  function introBody(D) {   // 자기소개서: 제목, 성명/지원 분야 표, 문항마다 제목 줄 + 테두리 칸
    var body = para('자 기 소 개 서', { sz: 50, b: true, u: true, after: 200 });
    body += tbl([1837, 3266, 1837, 3266], [{ h: 450, c: [{ t: '성명', th: 1 }, { t: D.name }, { t: '지원 분야', th: 1 }, { t: D.apply }] }]);
    body += GAP;
    (D.intro.items || []).forEach(function (it, i) {
      body += '<w:p><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60" w:line="300" w:lineRule="exact"/></w:pPr>' + run((i + 1) + '. ' + (it.q || ''), { sz: 22, b: true }) + '</w:p>';
      var lines = String(it.a || '').split('\n').map(function (l) { return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="340" w:lineRule="exact"/><w:jc w:val="both"/></w:pPr>' + run(l, { sz: 20 }) + '</w:p>'; }).join('');
      var B = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right'].map(function (q) { return '<w:' + q + ' w:val="single" w:sz="5" w:space="0" w:color="333333"/>'; }).join('') + '</w:tblBorders>';
      body += '<w:tbl><w:tblPr><w:tblW w:w="' + TW + '" w:type="dxa"/>' + B + '<w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
        '<w:tblGrid><w:gridCol w:w="' + TW + '"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="2490" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="' + TW + '" w:type="dxa"/></w:tcPr>' + lines + '</w:tc></w:tr></w:tbl>';
    });
    return body;
  }
  function build(D, opt) {
    var kind = opt.kind || 'resume', body = '', hasImg = false;
    if (kind !== 'intro') { var r = resumeBody(D, opt); body += r.body; hasImg = r.hasImg; }
    if (kind !== 'resume') { if (body) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; body += introBody(D); }
    var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ' + NS + '><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="680" w:right="850" w:bottom="567" w:left="850" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>' + FONT +
      '<w:sz w:val="19"/><w:szCs w:val="19"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
    var drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      (hasImg ? '<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.jpeg"/>' : '') + '</Relationships>';
    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>이력서</dc:title><dc:creator>' + x(D.name || '') + '</dc:creator></cp:coreProperties>';
    var files = [{ name: '[Content_Types].xml', data: enc.encode(ct) }, { name: '_rels/.rels', data: enc.encode(rels) }, { name: 'docProps/core.xml', data: enc.encode(core) },
      { name: 'word/document.xml', data: enc.encode(doc) }, { name: 'word/styles.xml', data: enc.encode(styles) }, { name: 'word/_rels/document.xml.rels', data: enc.encode(drels) }];
    if (hasImg) { var b = atob(D.photo.split(',')[1]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); files.push({ name: 'word/media/photo.jpeg', data: u }); }
    return zip(files);
  }
  window.RSDOCX = { build: build, zip: zip };
})();
