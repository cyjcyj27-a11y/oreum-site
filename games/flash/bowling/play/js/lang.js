// ?lang=en 이면 화면 글자를 영어로 바꾼다 (BUY JEJU 방식: 사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
    '와르르 볼링': 'BOWLING',
    '와르르': '',
    '볼링': 'BOWLING',
    '이어하기': 'CONTINUE',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '홈': 'HOME',
    '나': 'YOU',
    '연습공': 'Rookie',
    '딸기': 'Berry',
    '민트': 'Mint',
    '오렌지': 'Orange',
    '은하수': 'Milky Way',
    '용암': 'Lava',
    '번개': 'Thunder',
    '바다': 'Ocean',
    '네온': 'Neon',
    '황금': 'Gold',
    '무지개': 'Rainbow',
    '우주': 'Cosmos',
    '파워': 'POWER',
    '훅': 'HOOK',
    '첫 STRIKE': 'First STRIKE',
    '첫 SPARE': 'First SPARE',
    '스플릿 처리': 'Split Pickup',
    '100점': '100 PTS',
    '150점': '150 PTS',
    '200점': '200 PTS',
    '250점': '250 PTS',
    '무승부': 'DRAW',
    '계속': 'CONTINUE',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'BOWLING';
  const fix = (n) => {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { const v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (const c of n.childNodes) fix(c);
    }
  };
  const start = () => {
    fix(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
