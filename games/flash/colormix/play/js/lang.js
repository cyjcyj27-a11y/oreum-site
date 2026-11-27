// 주소에 ?lang=en 이면 영어, ?lang=zh 이면 중국어로 화면 글자를 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const EN = Q === 'en', ZH = Q === 'zh';
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
  if (!EN && !ZH) return;
  const DEN = {
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
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const DZH = {
    '색깔섞기': '调色解谜', '퍼즐게임': '混色游戏', '색깔섞기 퍼즐게임': '调色解谜',
    '도감': '图鉴', '처음으로': '返回',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': '推一下颜料滴，它会一路滑过去，和撞到的颜料滴混在一起',
    '견본과 같은 색을 MOVES 안에 만들어요': '在 MOVES 用完前调出和色样一样的颜色',
    '아래 점은 들어갈 물감이에요': '下面的小点是要加进去的颜料',
    '만든 색으로 그림이 칠해져요': '调出的颜色会涂到画上',
    '받은 카드는 판 옆 가방에 들어가요': '拿到的卡片会放进盘子旁边的包里',
    '카드를 누르고 방울을 눌러 써요': '先点卡片，再点颜料滴就能使用',
    '물 컵·황금 붓은 누르면 바로 써져요': '水杯和黄金画笔点一下就直接生效',
    '언덕 위 집': '山坡上的房子', '과일 그릇': '水果盘', '바닷가 등대': '海边灯塔', '해바라기': '向日葵', '노을 지붕': '晚霞屋顶',
    '숲속 호수': '林中湖泊', '눈 오는 마을': '下雪的村庄', '열기구': '热气球', '작은 항구': '小港口', '별밤': '星空夜',
    '빨강 튜브': '红颜料', '노랑 튜브': '黄颜料', '파랑 튜브': '蓝颜料', '흰색 튜브': '白颜料', '검정 튜브': '黑颜料',
    '큰 빨강 튜브': '大管红', '큰 노랑 튜브': '大管黄', '큰 파랑 튜브': '大管蓝', '큰 흰색 튜브': '大管白', '큰 검정 튜브': '大管黑',
    '황금 빨강 튜브': '金管红', '황금 노랑 튜브': '金管黄', '황금 파랑 튜브': '金管蓝', '황금 흰색 튜브': '金管白', '황금 검정 튜브': '金管黑',
    '물 한 컵': '一杯水', '물 두 컵': '两杯水', '물 세 컵': '三杯水', '물뿌리개': '洒水壶', '황금 물통': '黄金水桶',
    '헝겊': '抹布', '스포이트': '滴管', '나이프': '调色刀', '황금 붓': '黄金画笔',
    '지우기': '擦掉', '덜기': '吸一滴', '옮기기': '移动', '완성': '完成',
  };
  const D = EN ? DEN : DZH;
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
  document.documentElement.lang = EN ? 'en' : 'zh-CN';
  if (ZH) {
    // 게임 글꼴(Star·Pj)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Star';src:${zf};unicode-range:${ur}}@font-face{font-family:'Pj';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .btn{white-space:nowrap}html[lang=zh-CN] .hd{flex-wrap:wrap;row-gap:10px}html[lang=zh-CN] .hb{margin-left:auto}`;
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = EN ? 'Color Mix Puzzle Game' : '调色解谜';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
