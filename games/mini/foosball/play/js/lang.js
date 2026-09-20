// ?lang=en 이면 화면 글자를 영어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
    '테이블축구게임': 'FOOSBALL',
    '테이블 축구': 'FOOSBALL',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '입기': 'WEAR',
    '사용 중': 'WEARING',
    '홈': 'HOME',
    '나': 'YOU',
    '계속': 'CONTINUE',
    '이동': 'MOVE',
    '킥': 'KICK',
    '클릭': 'CLICK',
    '속도': 'SPEED',
    '파랑': 'Blue', '빨강': 'Red', '초록': 'Green', '노랑': 'Yellow', '주황': 'Orange', '하늘': 'Sky',
    '보라': 'Purple', '분홍': 'Pink', '흑표범': 'Panther', '백호': 'White Tiger', '황금': 'Gold', '은하': 'Galaxy',
    '일본': 'Japan', '멕시코': 'Mexico', '미국': 'USA', '네덜란드': 'Netherlands', '포르투갈': 'Portugal',
    '크로아티아': 'Croatia', '이탈리아': 'Italy', '스페인': 'Spain', '독일': 'Germany', '프랑스': 'France',
    '아르헨티나': 'Argentina', '브라질': 'Brazil',
    '첫 골': 'First Goal', '첫 승리': 'First Win', '연속 3골': '3 Goals in a Row', '수비수 골': 'Defender Goal',
    '5초 골': '5-Second Goal', '벽 맞고 골': 'Bank Shot Goal', '무실점 승리': 'Clean Sheet', '골키퍼 골': 'Keeper Goal',
    '역전승': 'Comeback Win', '5연승': '5 Wins in a Row', '100골': '100 Goals',
    '가로 화면에서 하는 게임입니다': 'This game is played in landscape',
    '가로로 돌리기': 'Rotate to landscape',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': 'If the button does not work, unlock screen rotation and turn your phone sideways',
    '그래도 세로로 하기': 'Play in portrait anyway',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'FOOSBALL';
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
