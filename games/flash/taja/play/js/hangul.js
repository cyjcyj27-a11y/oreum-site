/* 타자 — 글자를 두벌식 자판 누름 순서로 푼다. "과" → ㄱ ㅗ ㅏ, "닭" → ㄷ ㅏ ㄹ ㄱ.
   입력 중인 조합 글자("각"을 거쳐 "가게")도 앞부분이 그대로 맞아 들어간다. */
(function () {
  'use strict';
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  var JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
  var JONG = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  // 낱자로 들어온 겹글자(조합 중 "ㅘ", "ㄺ")
  var COMPAT = { 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ',
    'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ', 'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ' };

  function charKeys(ch) {
    var c = ch.charCodeAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) {
      var s = c - 0xAC00, jo = s % 28, ju = ((s - jo) / 28) % 21, ch0 = ((s - jo) / 28 - ju) / 21;
      return CHO[ch0] + JUNG[ju] + JONG[jo];
    }
    return COMPAT[ch] || ch;
  }
  // 글 → 누름 배열. 글자마다 몇 번째 누름에서 끝나는지도 준다
  function keys(str) {
    var out = [], ends = [], i, k;
    for (i = 0; i < str.length; i++) { k = charKeys(str[i]); for (var j = 0; j < k.length; j++) out.push(k[j]); ends.push(out.length); }
    return { k: out, ends: ends };
  }
  // 친 글이 목표의 몇 누름까지 맞았나, 틀린 누름이 있나
  function match(target, typed) {
    var a = keys(target).k, b = keys(typed).k, n = 0;
    while (n < a.length && n < b.length && a[n] === b[n]) n++;
    return { ok: n, wrong: b.length - n, total: a.length };
  }
  window.HG = { keys: keys, match: match, count: function (s) { return keys(s).k.length; } };
})();
