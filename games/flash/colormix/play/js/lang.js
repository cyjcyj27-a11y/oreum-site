// 영문판: 주소에 ?lang=en 이 있을 때만 화면 글자를 영어로 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const EN = new URLSearchParams(location.search).get('lang') === 'en';
  window.LANG = EN ? 'en' : 'ko';
  if (!EN) return;
  const D = {
    '색깔섞기': 'COLOR MIX', '퍼즐게임': 'PUZZLE GAME', '색깔섞기 퍼즐게임': 'Color Mix Puzzle Game',
    '도감': 'BOOK', '처음으로': 'HOME',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': 'Push a drop. It slides and mixes with the drop it hits.',
    '견본과 같은 색을 MOVES 안에 만들어요': 'Make the sample color within the MOVES.',
    '아래 점은 들어갈 물감이에요': 'The dots show the paints that go in.',
    '만든 색으로 그림이 칠해져요': 'Your color paints part of the picture.',
    '받은 카드는 판 옆 가방에 들어가요': 'Cards you win go into the bag.',
    '카드를 누르고 방울을 눌러 써요': 'Tap a card, then a drop.',
    '물 컵·황금 붓은 누르면 바로 써져요': 'Cups and the golden brush work at once.',
    '언덕 위 집': 'House on the Hill', '과일 그릇': 'Fruit Bowl', '바닷가 등대': 'Lighthouse', '해바라기': 'Sunflowers', '노을 지붕': 'Sunset Roof',
    '숲속 호수': 'Forest Lake', '눈 오는 마을': 'Snowy Village', '열기구': 'Balloons', '작은 항구': 'Little Harbor', '별밤': 'Starry Night',
    '빨강 튜브': 'Red Tube', '노랑 튜브': 'Yellow Tube', '파랑 튜브': 'Blue Tube', '흰색 튜브': 'White Tube', '검정 튜브': 'Black Tube',
    '큰 빨강 튜브': 'Big Red Tube', '큰 노랑 튜브': 'Big Yellow Tube', '큰 파랑 튜브': 'Big Blue Tube', '큰 흰색 튜브': 'Big White Tube', '큰 검정 튜브': 'Big Black Tube',
    '황금 빨강 튜브': 'Gold Red Tube', '황금 노랑 튜브': 'Gold Yellow Tube', '황금 파랑 튜브': 'Gold Blue Tube', '황금 흰색 튜브': 'Gold White Tube', '황금 검정 튜브': 'Gold Black Tube',
    '물 한 컵': 'Cup of Water', '물 두 컵': 'Two Cups', '물 세 컵': 'Three Cups', '물뿌리개': 'Watering Can', '황금 물통': 'Golden Jar',
    '헝겊': 'Rag', '스포이트': 'Dropper', '나이프': 'Palette Knife', '황금 붓': 'Golden Brush',
    '지우기': 'ERASE', '덜기': 'TAKE 1', '옮기기': 'MOVE', '완성': 'DONE',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\$&');
  const RE = new RegExp(keys.map(esc).join('|'), 'g');
  const tr = (s) => (/[가-힣]/.test(s) ? s.replace(RE, (m) => D[m]) : s);
  window.L = tr;
  function walk(n) {
    if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const c of n.childNodes) walk(c);
  }
  document.documentElement.lang = 'en';
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Color Mix Puzzle Game';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
