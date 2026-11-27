// ?lang=en 이면 영어, ?lang=zh 이면 중국어로 화면 글자를 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
  const DE = {
    '윷놀이': 'YUT NORI',
    '장원': 'CHAMPION',
    '던지기': 'THROW',
    '잡았다!': 'CAUGHT!',
    '났다!': 'OUT!',
    '한 번 더': 'ONE MORE',
    '빽도': 'BACK-DO',
    '도깨비': 'Dokkaebi',
    '도': 'DO',
    '개구리': 'Frog',
    '개': 'GAE',
    '걸': 'GEOL',
    '윷': 'YUT',
    '모 10번': 'MO x10',
    '모': 'MO',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '홈': 'HOME',
    '계속': 'CONTINUE',
    '병아리': 'Chick',
    '토끼': 'Rabbit',
    '고양이': 'Cat',
    '꿀꿀이': 'Piggy',
    '여우': 'Fox',
    '곰': 'Bear',
    '호랑이': 'Tiger',
    '할머니': 'Grandma',
    '할아버지': 'Grandpa',
    '용': 'Dragon',
    '강아지': 'Puppy',
    '소나무': 'Pine',
    '밤나무': 'Chestnut',
    '대나무': 'Bamboo',
    '자작나무': 'Birch',
    '먹감나무': 'Ebony',
    '옻칠': 'Lacquer',
    '자개': 'Pearl',
    '옥': 'Jade',
    '금박': 'Gold',
    '얼음': 'Ice',
    '무지개': 'Rainbow',
    '야광': 'Glow',
    '첫 승리': 'First win',
    '10승': '10 wins',
    '잡기 20번': 'Catch 20 pieces',
    '한 판에 4번 잡기': 'Catch 4 in one game',
    '빽도로 잡기': 'Catch with BACK-DO',
    '업어서 나기': 'Finish a stacked pair',
    '방 지름길로 나기': 'Finish via the center',
    'STAGE 6 클리어': 'Clear STAGE 6',
    'STAGE 12 클리어': 'Clear STAGE 12',
    '3 PLAYERS 한 판': 'Play 3 PLAYERS',
    '4 PLAYERS 한 판': 'Play 4 PLAYERS',
  };
  // 중국어: 한국어 낱말을 열쇠로, 윷 이름은 영어판처럼 로마자
  const DZ = {
    '윷놀이': '掷柶游戏',
    '장원': '状元',
    '던지기': '扔柶',
    '잡았다!': '吃掉了！',
    '났다!': '到家了！',
    '한 번 더': '再扔一次',
    '빽도': 'BACK-DO',
    '도깨비': '鬼怪',
    '도': 'DO',
    '개구리': '青蛙',
    '개': 'GAE',
    '걸': 'GEOL',
    '윷': 'YUT',
    '모 10번': 'MO 10次',
    '모': 'MO',
    '상점': '商店',
    '미션': '任务',
    '장착': '装备',
    '사용 중': '使用中',
    '홈': '主页',
    '계속': '继续',
    '병아리': '小鸡',
    '토끼': '兔子',
    '고양이': '猫咪',
    '꿀꿀이': '小猪',
    '여우': '狐狸',
    '곰': '熊',
    '호랑이': '老虎',
    '할머니': '奶奶',
    '할아버지': '爷爷',
    '용': '龙',
    '강아지': '小狗',
    '소나무': '松木',
    '밤나무': '栗木',
    '대나무': '竹子',
    '자작나무': '白桦',
    '먹감나무': '乌木',
    '옻칠': '朱漆',
    '자개': '螺钿',
    '옥': '玉石',
    '금박': '金箔',
    '얼음': '冰块',
    '무지개': '彩虹',
    '야광': '夜光',
    '첫 승리': '首胜',
    '10승': '赢 10 局',
    '잡기 20번': '吃子 20 次',
    '한 판에 4번 잡기': '一局吃子 4 次',
    '빽도로 잡기': '用 BACK-DO 吃子',
    '업어서 나기': '叠子到家',
    '방 지름길로 나기': '走中心捷径到家',
    'STAGE 6 클리어': '通关 STAGE 6',
    'STAGE 12 클리어': '通关 STAGE 12',
    '3 PLAYERS 한 판': '玩一局 3 PLAYERS',
    '4 PLAYERS 한 판': '玩一局 4 PLAYERS',
  };
  const D = ZH ? DZ : DE;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!(EN || ZH) || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN && !ZH) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'YUT NORI';
  } else {
    document.documentElement.lang = 'zh-CN';
    document.title = '掷柶游戏';
    // 게임 글꼴(Song·Ria)엔 한자가 없다: 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Song';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}` +
      // 네 글자 제목이 한 줄에 들어가게
      `html[lang=zh-CN] #logo{white-space:nowrap;font-size:clamp(56px,21vw,200px)}` +
      `@media (min-aspect-ratio:1/1){html[lang=zh-CN] #logo{font-size:clamp(56px,9.2vw,130px)}}` +
      `@media (max-height:520px){html[lang=zh-CN] #logo{font-size:clamp(50px,16vh,84px)}}`;
    document.head.appendChild(st);
  }
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
    // 중국어판: 긴 로마자 큰 글자(BACK-DO)는 화면 폭에 맞게 줄인다
    const w = ZH && document.getElementById('word');
    if (w) {
      const fit = () => { const v = w.textContent.length > 4 && /^[A-Z-]+$/.test(w.textContent) ? 'min(14vw,150px)' : ''; if (w.style.fontSize !== v) w.style.fontSize = v; };
      new MutationObserver(fit).observe(w, { childList: true, characterData: true, subtree: true });
    }
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
