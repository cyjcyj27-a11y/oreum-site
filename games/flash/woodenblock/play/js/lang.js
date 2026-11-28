// ?lang=en 이면 화면 글자를 영어로, zh·ja·pt·ru 면 그 언어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  const Q3 = !EN && !ZH ? new URLSearchParams(location.search).get('lang') : null;
  const JA = Q3 === 'ja', PT = Q3 === 'pt', RU = Q3 === 'ru';
  const X3 = JA || PT || RU;
  window.LANG = EN ? 'en' : ZH ? 'zh' : JA ? 'ja' : PT ? 'pt' : RU ? 'ru' : 'ko';
  const D = {
    '나무블럭쌓기': 'WOODEN BLOCK',
    '나무블럭': 'WOODEN',
    '쌓기': 'BLOCK',
    '와르르!': 'CRASH!',
    '이어하기': 'CONTINUE',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '홈': 'HOME',
    '계속': 'CONTINUE',
    '원목': 'Pine',
    '자작나무': 'Birch',
    '벚나무': 'Cherry',
    '호두나무': 'Walnut',
    '대나무': 'Bamboo',
    '파스텔': 'Pastel',
    '초콜릿': 'Chocolate',
    '대리석': 'Marble',
    '무지개': 'Rainbow',
    '얼음': 'Ice',
    '야광': 'Glow',
    '황금': 'Gold',
    '블록 10개 빼기': 'Pull 10 blocks',
    '블록 50개 빼기': 'Pull 50 blocks',
    '블록 200개 빼기': 'Pull 200 blocks',
    '한 판에 8개 빼기': 'Pull 8 in one game',
    '탑 22층': 'Tower 22 levels',
    '탑 26층': 'Tower 26 levels',
    '맨 아래 2층에서 빼기': 'Pull from the bottom 2 levels',
    'STAGE 5 클리어': 'Clear STAGE 5',
    'STAGE 15 클리어': 'Clear STAGE 15',
    'STAGE 30 클리어': 'Clear STAGE 30',
    '2 PLAYERS 한 판': 'Play 2 PLAYERS',
    '블록 4종 모으기': 'Collect 4 block sets',
  };
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '나무블럭쌓기': '木块叠叠高',
    '나무블럭': '木块',
    '쌓기': '叠叠高',
    '와르르!': '哗啦啦！',
    '이어하기': '继续游戏',
    '상점': '商店',
    '미션': '任务',
    '장착': '装备',
    '사용 중': '使用中',
    '홈': '首页',
    '계속': '继续',
    '원목': '原木',
    '자작나무': '白桦木',
    '벚나무': '樱桃木',
    '호두나무': '胡桃木',
    '대나무': '竹子',
    '파스텔': '马卡龙',
    '초콜릿': '巧克力',
    '대리석': '大理石',
    '무지개': '彩虹',
    '얼음': '冰块',
    '야광': '夜光',
    '황금': '黄金',
    '블록 10개 빼기': '抽出 10 块积木',
    '블록 50개 빼기': '抽出 50 块积木',
    '블록 200개 빼기': '抽出 200 块积木',
    '한 판에 8개 빼기': '一局抽出 8 块',
    '탑 22층': '塔高 22 层',
    '탑 26층': '塔高 26 层',
    '맨 아래 2층에서 빼기': '从最底下 2 层抽出',
    'STAGE 5 클리어': '通关 STAGE 5',
    'STAGE 15 클리어': '通关 STAGE 15',
    'STAGE 30 클리어': '通关 STAGE 30',
    '2 PLAYERS 한 판': '玩一局 2 PLAYERS',
    '블록 4종 모으기': '收集 4 种积木',
  };
  // 일본어·포르투갈어(브라질)·러시아어: 한국어 문장을 열쇠로 찾는다
  const J = {
    '나무블럭쌓기': '木のブロック積み',
    '나무블럭': '木のブロック',
    '쌓기': '積み',
    '와르르!': 'ガラガラ！',
    '이어하기': 'つづきから',
    '상점': 'ショップ',
    '미션': 'ミッション',
    '장착': '装備',
    '사용 중': '使用中',
    '홈': 'ホーム',
    '계속': 'つづける',
    '원목': '原木',
    '자작나무': 'シラカバ',
    '벚나무': 'サクラ',
    '호두나무': 'クルミ',
    '대나무': '竹',
    '파스텔': 'パステル',
    '초콜릿': 'チョコ',
    '대리석': '大理石',
    '무지개': 'レインボー',
    '얼음': '氷',
    '야광': '夜光',
    '황금': '黄金',
    '블록 10개 빼기': 'ブロックを10個抜く',
    '블록 50개 빼기': 'ブロックを50個抜く',
    '블록 200개 빼기': 'ブロックを200個抜く',
    '한 판에 8개 빼기': '1ゲームで8個抜く',
    '탑 22층': 'タワー22段',
    '탑 26층': 'タワー26段',
    '맨 아래 2층에서 빼기': '一番下の2段から抜く',
    'STAGE 5 클리어': 'STAGE 5 クリア',
    'STAGE 15 클리어': 'STAGE 15 クリア',
    'STAGE 30 클리어': 'STAGE 30 クリア',
    '2 PLAYERS 한 판': '2 PLAYERSで1回遊ぶ',
    '블록 4종 모으기': 'ブロックを4種類集める',
  };
  const P = {
    '나무블럭쌓기': 'Blocos de Madeira',
    '나무블럭': 'BLOCOS',
    '쌓기': 'DE MADEIRA',
    '와르르!': 'DESABOU!',
    '이어하기': 'Continuar',
    '상점': 'Loja',
    '미션': 'Missões',
    '장착': 'Equipar',
    '사용 중': 'Em uso',
    '홈': 'Início',
    '계속': 'Continuar',
    '원목': 'Pinho',
    '자작나무': 'Bétula',
    '벚나무': 'Cerejeira',
    '호두나무': 'Nogueira',
    '대나무': 'Bambu',
    '파스텔': 'Pastel',
    '초콜릿': 'Chocolate',
    '대리석': 'Mármore',
    '무지개': 'Arco-íris',
    '얼음': 'Gelo',
    '야광': 'Neon',
    '황금': 'Ouro',
    '블록 10개 빼기': 'Tire 10 blocos',
    '블록 50개 빼기': 'Tire 50 blocos',
    '블록 200개 빼기': 'Tire 200 blocos',
    '한 판에 8개 빼기': 'Tire 8 numa partida',
    '탑 22층': 'Torre de 22 andares',
    '탑 26층': 'Torre de 26 andares',
    '맨 아래 2층에서 빼기': 'Tire dos 2 andares de baixo',
    'STAGE 5 클리어': 'Vença a STAGE 5',
    'STAGE 15 클리어': 'Vença a STAGE 15',
    'STAGE 30 클리어': 'Vença a STAGE 30',
    '2 PLAYERS 한 판': 'Jogue uma de 2 PLAYERS',
    '블록 4종 모으기': 'Junte 4 tipos de bloco',
  };
  const R = {
    '나무블럭쌓기': 'Деревянные блоки',
    '나무블럭': 'ДЕРЕВЯННЫЕ',
    '쌓기': 'БЛОКИ',
    '와르르!': 'РУХНУЛА!',
    '이어하기': 'Продолжить',
    '상점': 'Магазин',
    '미션': 'Задания',
    '장착': 'Выбрать',
    '사용 중': 'Выбрано',
    '홈': 'Домой',
    '계속': 'Далее',
    '원목': 'Сосна',
    '자작나무': 'Берёза',
    '벚나무': 'Вишня',
    '호두나무': 'Орех',
    '대나무': 'Бамбук',
    '파스텔': 'Пастель',
    '초콜릿': 'Шоколад',
    '대리석': 'Мрамор',
    '무지개': 'Радуга',
    '얼음': 'Лёд',
    '야광': 'Неон',
    '황금': 'Золото',
    '블록 10개 빼기': 'Вытащи 10 блоков',
    '블록 50개 빼기': 'Вытащи 50 блоков',
    '블록 200개 빼기': 'Вытащи 200 блоков',
    '한 판에 8개 빼기': 'Вытащи 8 за игру',
    '탑 22층': 'Башня в 22 этажа',
    '탑 26층': 'Башня в 26 этажей',
    '맨 아래 2층에서 빼기': 'Вытащи из 2 нижних рядов',
    'STAGE 5 클리어': 'Пройди STAGE 5',
    'STAGE 15 클리어': 'Пройди STAGE 15',
    'STAGE 30 클리어': 'Пройди STAGE 30',
    '2 PLAYERS 한 판': 'Сыграй в 2 PLAYERS',
    '블록 4종 모으기': 'Собери 4 вида блоков',
  };
  const M = EN ? D : ZH ? Z : JA ? J : PT ? P : RU ? R : Z;
  const keys = Object.keys(M).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!(EN || ZH || X3) || s == null) return s;
    return String(s).replace(re, (m) => M[m]);
  };
  if (!(EN || ZH || X3)) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'WOODEN BLOCK';
  } else if (ZH) {
    document.documentElement.lang = 'zh-CN';
    document.title = '木块叠叠高';
    // 게임 글꼴(Cute·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Cute';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}@media (max-height:520px){html[lang=zh-CN] #logo{font-size:clamp(40px,12.5vh,66px)}}`;
    document.head.appendChild(st);
  } else if (JA) {
    document.documentElement.lang = 'ja';
    document.title = J['나무블럭쌓기'];
    // 게임 글꼴엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙이고, 긴 로고는 줄인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Cute';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}html[lang=ja] #logo{font-size:clamp(50px,11vw,110px)}@media (min-aspect-ratio:1/1){html[lang=ja] #logo{font-size:clamp(36px,5.6vw,96px)}}@media (max-height:520px){html[lang=ja] #logo{font-size:clamp(30px,9vh,50px)}}`;
    document.head.appendChild(st);
  } else {
    const lc = PT ? 'pt-BR' : 'ru';
    document.documentElement.lang = lc;
    document.title = M['나무블럭쌓기'];
    // 게임 글꼴에 없는 악센트 라틴·키릴 글자는 기기 글꼴로 덧붙이고, 긴 로고는 줄인다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Cute';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${lf};unicode-range:${ur}}html[lang="${lc}"] #logo{font-size:clamp(46px,10vw,104px)}html[lang="${lc}"] #logo span{font-size:1em}@media (min-aspect-ratio:1/1){html[lang="${lc}"] #logo{font-size:clamp(30px,4.6vw,80px)}}@media (max-height:520px){html[lang="${lc}"] #logo{font-size:clamp(26px,8vh,44px)}}`;
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
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
