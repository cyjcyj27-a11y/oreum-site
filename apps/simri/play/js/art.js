// 그림. 전부 SVG 문자열로 그린다.
(function () {
  var A = {};
  var FL = '<style>.fl{transform-origin:50% 100%;transform-box:fill-box;animation:fl 1.1s ease-in-out infinite alternate}@keyframes fl{0%{transform:scale(1,1) rotate(-3deg)}100%{transform:scale(.9,1.12) rotate(3deg)}}</style>';
  function flame(x, y) {
    return '<g class="fl"><path d="M' + x + ' ' + (y - 26) + 'c8 10 11 16 11 21a11 11 0 0 1-22 0c0-5 3-11 11-21z" fill="#ffb02e"/>' +
      '<path d="M' + x + ' ' + (y - 15) + 'c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" fill="#fff3b0"/></g>';
  }
  // 케이크. n = 정신연령(없으면 물음표 초)
  A.cake = function (n, col) {
    col = col || '#ff8a3d';
    var s = '<svg class="art" viewBox="0 0 300 236" xmlns="http://www.w3.org/2000/svg">' + FL +
      '<defs><linearGradient id="ck1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b6a48"/><stop offset="1" stop-color="#6e4329"/></linearGradient>' +
      '<linearGradient id="ck2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0f3"/><stop offset="1" stop-color="#ffc9d6"/></linearGradient></defs>' +
      '<ellipse cx="150" cy="214" rx="132" ry="16" fill="#000" opacity=".08"/>' +
      '<ellipse cx="150" cy="206" rx="126" ry="16" fill="#fff" stroke="#e8dccb" stroke-width="3"/>' +
      // 아래 층
      '<path d="M42 150q0-12 12-12h192q12 0 12 12v44q0 10-12 10H54q-12 0-12-10z" fill="url(#ck1)"/>' +
      '<path d="M42 152q0-14 14-14h188q14 0 14 14v6q-8 12-16 0t-16 2q-8 14-16 0t-18 0q-8 16-18 0t-16 0q-8 12-16 0t-18 2q-8 14-16 0t-16-2q-8 12-16 0t-14 2z" fill="#fff7ec"/>' +
      '<g fill="#ff5a6e"><circle cx="70" cy="184" r="5"/><circle cx="118" cy="190" r="5"/><circle cx="182" cy="190" r="5"/><circle cx="230" cy="184" r="5"/></g>' +
      // 위 층
      '<path d="M80 100q0-10 10-10h120q10 0 10 10v40H80z" fill="url(#ck2)"/>' +
      '<path d="M80 102q0-12 12-12h116q12 0 12 12v4q-7 10-14 0t-14 1q-7 12-14 0t-16 0q-7 13-14 0t-14 0q-7 11-14 0t-16 0q-6 10-12 0z" fill="#fff"/>' +
      '<rect x="80" y="132" width="140" height="8" fill="#ffb3c4"/>' +
      // 딸기
      '<g><path d="M88 96c-8-2-12 6-8 12s10 8 14 4 2-14-6-16z" fill="#e8344e"/><path d="M84 94l4 4 4-5" stroke="#3e9b4f" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
      '<g><path d="M214 96c8-2 12 6 8 12s-10 8-14 4-2-14 6-16z" fill="#e8344e"/><path d="M218 94l-4 4-4-5" stroke="#3e9b4f" stroke-width="3" fill="none" stroke-linecap="round"/></g>';
    var txt = (n == null) ? '?' : String(n);
    var w = txt.length === 1 ? 0 : 29;
    for (var i = 0; i < txt.length; i++) {
      var x = 150 - w + i * 58;
      s += '<line x1="' + x + '" y1="30" x2="' + x + '" y2="40" stroke="#5a4636" stroke-width="2.5"/>' + flame(x, 30) +
        '<text x="' + x + '" y="94" text-anchor="middle" font-family="Tokki,Suite,sans-serif" font-size="72" fill="' + col + '" stroke="#fff" stroke-width="7" paint-order="stroke">' + txt[i] + '</text>';
    }
    return s + '</svg>';
  };
  // 편지 봉투(연애 첫 화면)
  A.letter = function () {
    return '<svg class="art" viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="150" cy="196" rx="110" ry="10" fill="#000" opacity=".07"/>' +
      '<g transform="rotate(-6 150 110)">' +
      '<rect x="62" y="36" width="176" height="120" rx="6" fill="#fff" stroke="#f0c9d4" stroke-width="2"/>' +
      '<g stroke="#f4d6de" stroke-width="2"><line x1="80" y1="62" x2="220" y2="62"/><line x1="80" y1="80" x2="220" y2="80"/><line x1="80" y1="98" x2="190" y2="98"/></g>' +
      '</g>' +
      '<path d="M44 88h212v96a8 8 0 0 1-8 8H52a8 8 0 0 1-8-8z" fill="#ffb7c8"/>' +
      '<path d="M44 92l106 64 106-64v92a8 8 0 0 1-8 8H52a8 8 0 0 1-8-8z" fill="#ff9fb6"/>' +
      '<path d="M44 192l84-58M256 192l-84-58" stroke="#f08aa3" stroke-width="2"/>' +
      '<path d="M44 88l106 66 106-66" fill="none" stroke="#e77996" stroke-width="2"/>' +
      '<circle cx="150" cy="150" r="24" fill="#c92f55"/><circle cx="150" cy="150" r="19" fill="none" stroke="#a8203f" stroke-width="2"/>' +
      '<path d="M150 162c-12-8-15-13-15-18a7 7 0 0 1 15-3 7 7 0 0 1 15 3c0 5-3 10-15 18z" fill="#ffd8e2"/>' +
      '<path d="M226 30c0-6 8-6 8 0 0 6-8 10-8 14 0-4-8-8-8-14 0-6 8-6 8 0z" fill="#ff7a98" transform="translate(10 0)"/>' +
      '<path d="M62 46c0-5 6-5 6 0 0 5-6 8-6 11 0-3-6-6-6-11 0-5 6-5 6 0z" fill="#ffa3b8"/>' +
      '</svg>';
  };
  // 연애 유형 그림
  A.secure = function (c) {
    return '<svg class="art" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="150" cy="70" r="70" fill="' + c + '" opacity=".12"/>' +
      '<path d="M150 62L20 20v40z" fill="#ffe27a" opacity=".55"/><path d="M150 62L280 20v40z" fill="#ffe27a" opacity=".55"/>' +
      '<path d="M128 190l8-118h28l8 118z" fill="#fff" stroke="#3a4a5a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M135 100h30l1.6 22h-33.2zM132.4 140h35.2l1.6 24h-38.4z" fill="#e0453a"/>' +
      '<rect x="134" y="50" width="32" height="24" rx="3" fill="#fff3a0" stroke="#3a4a5a" stroke-width="3"/>' +
      '<path d="M128 50h44l-22-22z" fill="#e0453a" stroke="#3a4a5a" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="126" y="72" width="48" height="6" rx="2" fill="#3a4a5a"/>' +
      '<path d="M0 196q25-14 50 0t50 0 50 0 50 0 50 0 50 0v24H0z" fill="' + c + '"/>' +
      '<path d="M0 206q25-12 50 0t50 0 50 0 50 0 50 0 50 0v14H0z" fill="#fff" opacity=".35"/>' +
      '</svg>';
  };
  A.anxious = function (c) {
    var p = '';
    for (var i = 0; i < 14; i++) p += '<ellipse cx="150" cy="44" rx="13" ry="30" fill="' + (i % 2 ? '#ffc93c' : '#ffb21f') + '" transform="rotate(' + (i * 360 / 14) + ' 150 84)"/>';
    var d = '';
    for (var k = 0; k < 18; k++) { var a = k * 2.4, r = 4 + k * 1.4; d += '<circle cx="' + (150 + Math.cos(a) * r).toFixed(1) + '" cy="' + (84 + Math.sin(a) * r).toFixed(1) + '" r="2.4" fill="#4a2c14"/>'; }
    return '<svg class="art" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="250" cy="34" r="18" fill="#ffd36b"/><circle cx="250" cy="34" r="27" fill="#ffd36b" opacity=".25"/>' +
      '<path d="M150 120q-4 50 2 100" stroke="#4f9d3a" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<path d="M151 170q-40-4-50-30 34-2 50 26z" fill="#5fb446"/><path d="M152 190q40-6 52-34-36 0-52 30z" fill="#5fb446"/>' +
      p + '<circle cx="150" cy="84" r="30" fill="#7a4a24"/>' + d +
      '<path d="M140 92q10 8 20 0" stroke="#ffe7b0" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  };
  A.avoidant = function (c) {
    return '<svg class="art" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="150" cy="204" rx="90" ry="10" fill="#000" opacity=".07"/>' +
      '<path d="M196 196q60 4 54-44-4-26-22-22" stroke="#3d3f55" stroke-width="13" fill="none" stroke-linecap="round"/>' +
      '<path d="M100 200q-10-70 30-96h40q40 26 30 96z" fill="#3d3f55"/>' +
      '<path d="M128 200q-2-40 22-60 24 20 22 60z" fill="#565a78"/>' +
      '<path d="M106 76l-4-44 30 22zM194 76l4-44-30 22z" fill="#3d3f55"/>' +
      '<path d="M110 66l-2-24 16 13zM190 66l2-24-16 13z" fill="#e89aa8"/>' +
      '<ellipse cx="150" cy="84" rx="50" ry="42" fill="#3d3f55"/>' +
      '<path d="M124 84q8 6 16 0M160 84q8 6 16 0" stroke="#ffd36b" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M146 98h8l-4 5z" fill="#e89aa8"/>' +
      '<path d="M112 100h-24M112 106l-22 6M188 100h24M188 106l22 6" stroke="#9aa0c8" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="210" y="56" font-family="Tokki,Suite,sans-serif" font-size="24" fill="' + c + '">z</text><text x="226" y="38" font-family="Tokki,Suite,sans-serif" font-size="18" fill="' + c + '" opacity=".7">z</text>' +
      '</svg>';
  };
  A.fearful = function (c) {
    return '<svg class="art" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="250" cy="40" r="18" fill="#ffe9a8"/><circle cx="258" cy="34" r="15" fill="#fffdf8"/>' +
      '<path d="M0 206C24 150 60 84 140 66c62-14 108 20 104 64-3 30-34 40-50 24-12-12-6-30 10-30-14-22-56-26-86 6-30 32-40 64-38 76z" fill="' + c + '"/>' +
      '<path d="M40 206c14-50 46-96 98-112 34-10 66-4 84 14-30-10-62-6-88 14-30 24-46 56-48 84z" fill="#fff" opacity=".18"/>' +
      '<path d="M120 76c52-14 100 4 116 40" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>' +
      '<g fill="#fff"><circle cx="208" cy="124" r="5"/><circle cx="198" cy="114" r="3.5"/><circle cx="220" cy="112" r="3"/><circle cx="230" cy="122" r="2.5"/></g>' +
      '<path d="M0 198q30-16 60 0t60 0 60 0 60 0 60 0v22H0z" fill="#e57aa1"/>' +
      '<path d="M0 209q30-12 60 0t60 0 60 0 60 0 60 0v11H0z" fill="#fff" opacity=".4"/>' +
      '</svg>';
  };
  // 사원증(직업 첫 화면·결과)
  A.badge = function (code, col, title) {
    col = col || '#2d5fa8';
    code = code || '???';
    return '<svg class="art" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M120 0l22 64M180 0l-22 64" stroke="' + col + '" stroke-width="12" stroke-linecap="round"/>' +
      '<rect x="138" y="56" width="24" height="22" rx="4" fill="#b8c2cf" stroke="#7d8897" stroke-width="2"/>' +
      '<ellipse cx="150" cy="240" rx="80" ry="8" fill="#000" opacity=".07"/>' +
      '<rect x="72" y="70" width="156" height="164" rx="14" fill="#fff" stroke="#d4dbe5" stroke-width="2"/>' +
      '<path d="M72 84a14 14 0 0 1 14-14h128a14 14 0 0 1 14 14v26H72z" fill="' + col + '"/>' +
      '<rect x="134" y="78" width="32" height="6" rx="3" fill="#fff" opacity=".7"/>' +
      '<text x="150" y="104" text-anchor="middle" font-family="Suite,sans-serif" font-weight="800" font-size="13" fill="#fff" letter-spacing="2">' + (title || '나의 직업 적성') + '</text>' +
      '<rect x="88" y="122" width="52" height="62" rx="8" fill="#eef2f7"/>' +
      '<circle cx="114" cy="146" r="13" fill="#b9c4d3"/><path d="M92 184q2-24 22-24t22 24z" fill="#b9c4d3"/>' +
      '<text x="183" y="170" text-anchor="middle" font-family="Suite,sans-serif" font-weight="800" font-size="' + (code.length > 2 ? 32 : 40) + '" fill="' + col + '">' + code + '</text>' +
      '<rect x="152" y="128" width="64" height="8" rx="4" fill="#e3e8ef"/>' +
      '<g fill="#3a4a5a">' + (function () { var b = ''; for (var i = 0; i < 26; i++) b += '<rect x="' + (92 + i * 4.4) + '" y="198" width="' + (i % 3 ? 1.6 : 2.8) + '" height="22"/>'; return b; })() + '</g>' +
      '</svg>';
  };
  // 육각형 그래프. sc = {R:0~100,...}
  A.hex = function (sc, order, types) {
    var cx = 150, cy = 138, R = 92, s = '<svg class="art" viewBox="0 0 300 276" xmlns="http://www.w3.org/2000/svg">';
    function pt(i, r) { var a = -Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }
    for (var g = 1; g <= 4; g++) {
      var ps = []; for (var i = 0; i < 6; i++) ps.push(pt(i, R * g / 4).map(function (v) { return v.toFixed(1); }).join(','));
      s += '<polygon points="' + ps.join(' ') + '" fill="' + (g === 4 ? '#f6f8fb' : 'none') + '" stroke="#dfe5ee" stroke-width="' + (g === 4 ? 2 : 1) + '"/>';
    }
    var vp = [];
    for (var j = 0; j < 6; j++) {
      var e = pt(j, R); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="#dfe5ee"/>';
      vp.push(pt(j, Math.max(6, R * sc[order[j]] / 100)).map(function (v) { return v.toFixed(1); }).join(','));
    }
    s += '<polygon points="' + vp.join(' ') + '" fill="#2d5fa8" fill-opacity=".22" stroke="#2d5fa8" stroke-width="3" stroke-linejoin="round"/>';
    for (var k = 0; k < 6; k++) {
      var t = types[order[k]], q = pt(k, Math.max(6, R * sc[order[k]] / 100)), l = pt(k, R + 26);
      s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="5" fill="' + t.color + '" stroke="#fff" stroke-width="2"/>';
      s += '<text x="' + l[0].toFixed(1) + '" y="' + (l[1] + 5).toFixed(1) + '" text-anchor="middle" font-family="Suite,sans-serif" font-weight="800" font-size="15" fill="' + t.color + '">' + t.name + '</text>';
    }
    return s + '</svg>';
  };
  // 애착 지도. a = 불안 0~100, v = 회피 0~100
  A.map = function (a, v, col) {
    var x = 40 + v / 100 * 220, y = 230 - a / 100 * 200;
    return '<svg class="art" viewBox="0 0 300 270" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="40" y="30" width="110" height="100" fill="#fff1e2"/><rect x="150" y="30" width="110" height="100" fill="#fbe3ee"/>' +
      '<rect x="40" y="130" width="110" height="100" fill="#e3f4f1"/><rect x="150" y="130" width="110" height="100" fill="#e6e9fa"/>' +
      '<rect x="40" y="30" width="220" height="200" fill="none" stroke="#d8cdbd" stroke-width="2"/>' +
      '<line x1="150" y1="30" x2="150" y2="230" stroke="#d8cdbd" stroke-dasharray="4 4"/><line x1="40" y1="130" x2="260" y2="130" stroke="#d8cdbd" stroke-dasharray="4 4"/>' +
      '<g font-family="Suite,sans-serif" font-weight="800" font-size="14" text-anchor="middle">' +
      '<text x="95" y="56" fill="#e8892e">불안형</text><text x="205" y="56" fill="#c2417a">혼란형</text>' +
      '<text x="95" y="220" fill="#2f9e8f">안정형</text><text x="205" y="220" fill="#5b6bd5">회피형</text></g>' +
      '<g font-family="Suite,sans-serif" font-size="12" fill="#7a6d63" text-anchor="middle">' +
      '<text x="150" y="252">낮음 ← 회피 → 높음</text>' +
      '<text x="22" y="130" transform="rotate(-90 22 130)">낮음 ← 불안 → 높음</text></g>' +
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16" fill="' + col + '" opacity=".22"/>' +
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8" fill="' + col + '" stroke="#fff" stroke-width="3"/>' +
      '<text x="' + x.toFixed(1) + '" y="' + (y < 80 ? y + 30 : y - 16).toFixed(1) + '" text-anchor="middle" font-family="Suite,sans-serif" font-weight="800" font-size="13" fill="#2b2420">나</text>' +
      '</svg>';
  };
  // MBTI 네 칸 타일. code 없으면 물음표
  A.tiles = function (code, words) {
    var C = ['#f2994a', '#27ae60', '#2d7fd8', '#9b51e0'], R = [-6, 4, -3, 6], s = '<svg class="art" viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">';
    s += '<ellipse cx="150" cy="168" rx="128" ry="10" fill="#000" opacity=".06"/>';
    for (var i = 0; i < 4; i++) {
      var x = 18 + i * 68, ch = code ? code[i] : '?';
      s += '<g transform="rotate(' + R[i] + ' ' + (x + 30) + ' 92)">' +
        '<rect x="' + x + '" y="58" width="60" height="70" rx="12" fill="' + C[i] + '"/>' +
        '<rect x="' + x + '" y="58" width="60" height="62" rx="12" fill="#fff" opacity=".18"/>' +
        '<text x="' + (x + 30) + '" y="112" text-anchor="middle" font-family="Suite,sans-serif" font-weight="800" font-size="44" fill="#fff">' + ch + '</text></g>';
      if (words) s += '<text x="' + (x + 30) + '" y="160" text-anchor="middle" font-family="Suite,sans-serif" font-weight="800" font-size="15" fill="' + C[i] + '">' + words[i] + '</text>';
    }
    if (!code) s += '<g fill="#ffc93c"><path d="M40 30l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M262 22l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/><path d="M150 14l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></g>';
    return s + '</svg>';
  };
  // 세 칸 얼굴
  A.face = function (k) {
    var m = ['M12 25q6-5 12 0', 'M12 23h12', 'M11 21q7 7 14 0'][k];
    return '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="currentColor" opacity=".16"/><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<circle cx="13" cy="15" r="2.2" fill="currentColor"/><circle cx="23" cy="15" r="2.2" fill="currentColor"/><path d="' + m + '" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
  };
  A.backIcon = '<svg viewBox="0 0 20 20"><path d="M13 3L6 10l7 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  window.ART = A;
})();
