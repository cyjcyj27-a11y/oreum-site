// ?lang=en 이면 영어, ?lang=zh 이면 중국어로 화면 글자를 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const Q = new URLSearchParams(location.search).get('lang');
  const ZH = !EN && Q === 'zh';
  const X = !EN && !ZH && ['ja', 'pt', 'ru'].includes(Q) ? Q : '';
  window.LANG = EN ? 'en' : ZH ? 'zh' : X || 'ko';
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
  // 일본어: 열쇠는 한국어 낱말, 윷 이름은 중국어판처럼 로마자
  const DJ = {
    '윷놀이': 'ユンノリ',
    '장원': '優勝',
    '던지기': '投げる',
    '잡았다!': 'とった！',
    '났다!': 'ゴール！',
    '한 번 더': 'もう一回',
    '빽도': 'BACK-DO',
    '도깨비': 'トッケビ',
    '도': 'DO',
    '개구리': 'カエル',
    '개': 'GAE',
    '걸': 'GEOL',
    '윷': 'YUT',
    '모 10번': 'MO 10回',
    '모': 'MO',
    '상점': 'ショップ',
    '미션': 'ミッション',
    '장착': '装備',
    '사용 중': '使用中',
    '홈': 'ホーム',
    '계속': '続ける',
    '병아리': 'ヒヨコ',
    '토끼': 'ウサギ',
    '고양이': 'ネコ',
    '꿀꿀이': 'ブーちゃん',
    '여우': 'キツネ',
    '곰': 'クマ',
    '호랑이': 'トラ',
    '할머니': 'おばあちゃん',
    '할아버지': 'おじいちゃん',
    '용': 'ドラゴン',
    '강아지': 'ワンコ',
    '소나무': 'マツ',
    '밤나무': 'クリ',
    '대나무': 'タケ',
    '자작나무': 'シラカバ',
    '먹감나무': '黒柿',
    '옻칠': '漆塗り',
    '자개': '螺鈿',
    '옥': '翡翠',
    '금박': '金箔',
    '얼음': '氷',
    '무지개': '虹',
    '야광': '夜光',
    '첫 승리': '初勝利',
    '10승': '10勝',
    '잡기 20번': '20回とる',
    '한 판에 4번 잡기': '1試合で4回とる',
    '빽도로 잡기': 'BACK-DOでとる',
    '업어서 나기': '重ねてゴール',
    '방 지름길로 나기': '中央の近道でゴール',
    'STAGE 6 클리어': 'STAGE 6 クリア',
    'STAGE 12 클리어': 'STAGE 12 クリア',
    '3 PLAYERS 한 판': '3 PLAYERSで1回遊ぶ',
    '4 PLAYERS 한 판': '4 PLAYERSで1回遊ぶ',
  };
  // 포르투갈어(브라질)
  const DP = {
    '윷놀이': 'YUT NORI',
    '장원': 'CAMPEÃO',
    '던지기': 'JOGAR',
    '잡았다!': 'PEGUEI!',
    '났다!': 'CHEGOU!',
    '한 번 더': 'MAIS UMA',
    '빽도': 'BACK-DO',
    '도깨비': 'Dokkaebi',
    '도': 'DO',
    '개구리': 'Sapo',
    '개': 'GAE',
    '걸': 'GEOL',
    '윷': 'YUT',
    '모 10번': 'MO 10 vezes',
    '모': 'MO',
    '상점': 'LOJA',
    '미션': 'MISSÕES',
    '장착': 'USAR',
    '사용 중': 'EM USO',
    '홈': 'INÍCIO',
    '계속': 'CONTINUAR',
    '병아리': 'Pintinho',
    '토끼': 'Coelho',
    '고양이': 'Gato',
    '꿀꿀이': 'Porquinho',
    '여우': 'Raposa',
    '곰': 'Urso',
    '호랑이': 'Tigre',
    '할머니': 'Vovó',
    '할아버지': 'Vovô',
    '용': 'Dragão',
    '강아지': 'Cachorrinho',
    '소나무': 'Pinho',
    '밤나무': 'Castanheira',
    '대나무': 'Bambu',
    '자작나무': 'Bétula',
    '먹감나무': 'Ébano',
    '옻칠': 'Laca',
    '자개': 'Madrepérola',
    '옥': 'Jade',
    '금박': 'Ouro',
    '얼음': 'Gelo',
    '무지개': 'Arco-íris',
    '야광': 'Brilho',
    '첫 승리': 'Primeira vitória',
    '10승': '10 vitórias',
    '잡기 20번': 'Capture 20 peças',
    '한 판에 4번 잡기': 'Capture 4 numa partida',
    '빽도로 잡기': 'Capture com BACK-DO',
    '업어서 나기': 'Chegue empilhado',
    '방 지름길로 나기': 'Chegue pelo centro',
    'STAGE 6 클리어': 'Passe a STAGE 6',
    'STAGE 12 클리어': 'Passe a STAGE 12',
    '3 PLAYERS 한 판': 'Jogue com 3 PLAYERS',
    '4 PLAYERS 한 판': 'Jogue com 4 PLAYERS',
  };
  // 러시아어
  const DR = {
    '윷놀이': 'Ютнори',
    '장원': 'ЧЕМПИОН',
    '던지기': 'БРОСОК',
    '잡았다!': 'ПОЙМАЛ!',
    '났다!': 'ДОМА!',
    '한 번 더': 'ЕЩЁ РАЗ',
    '빽도': 'BACK-DO',
    '도깨비': 'Токкэби',
    '도': 'DO',
    '개구리': 'Лягушка',
    '개': 'GAE',
    '걸': 'GEOL',
    '윷': 'YUT',
    '모 10번': 'MO 10 раз',
    '모': 'MO',
    '상점': 'МАГАЗИН',
    '미션': 'ЗАДАНИЯ',
    '장착': 'ВЗЯТЬ',
    '사용 중': 'ВЫБРАНО',
    '홈': 'МЕНЮ',
    '계속': 'ДАЛЕЕ',
    '병아리': 'Цыплёнок',
    '토끼': 'Кролик',
    '고양이': 'Котик',
    '꿀꿀이': 'Хрюша',
    '여우': 'Лиса',
    '곰': 'Медведь',
    '호랑이': 'Тигр',
    '할머니': 'Бабушка',
    '할아버지': 'Дедушка',
    '용': 'Дракон',
    '강아지': 'Щенок',
    '소나무': 'Сосна',
    '밤나무': 'Каштан',
    '대나무': 'Бамбук',
    '자작나무': 'Берёза',
    '먹감나무': 'Эбен',
    '옻칠': 'Лак',
    '자개': 'Перламутр',
    '옥': 'Нефрит',
    '금박': 'Позолота',
    '얼음': 'Лёд',
    '무지개': 'Радуга',
    '야광': 'Свечение',
    '첫 승리': 'Первая победа',
    '10승': '10 побед',
    '잡기 20번': 'Съешь 20 фишек',
    '한 판에 4번 잡기': '4 захвата за игру',
    '빽도로 잡기': 'Захват на BACK-DO',
    '업어서 나기': 'Финиш стопкой',
    '방 지름길로 나기': 'Финиш через центр',
    'STAGE 6 클리어': 'Пройди STAGE 6',
    'STAGE 12 클리어': 'Пройди STAGE 12',
    '3 PLAYERS 한 판': 'Сыграй на 3 PLAYERS',
    '4 PLAYERS 한 판': 'Сыграй на 4 PLAYERS',
  };
  const D = ZH ? DZ : X === 'ja' ? DJ : X === 'pt' ? DP : X === 'ru' ? DR : DE;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!(EN || ZH || X) || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN && !ZH && !X) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'YUT NORI';
  } else if (X) {
    document.documentElement.lang = X === 'pt' ? 'pt-BR' : X;
    document.title = D['윷놀이'];
    // 게임 글꼴(Song·Ria)에 없는 글자를 기기 글꼴로 덧붙인다: 일본어는 가나·한자, 포르투갈어·러시아어는 악센트 라틴·키릴
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const src = X === 'ja' ? jf : lf;
    const ur = X === 'ja' ? 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF' : 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const hl = 'html[lang=' + document.documentElement.lang + ']';
    let css = `@font-face{font-family:'Song';src:${src};unicode-range:${ur}}@font-face{font-family:'Ria';src:${src};unicode-range:${ur}}`;
    if (X === 'ja') css += `${hl} *{word-break:normal!important}`;
    // 제목이 한 줄에 들어가게 (포르투갈어는 영어판과 같은 제목이라 그대로)
    if (X !== 'pt') css += `${hl} #logo{white-space:nowrap;font-size:clamp(56px,21vw,200px)}` +
      `@media (min-aspect-ratio:1/1){${hl} #logo{font-size:clamp(56px,9.2vw,130px)}}` +
      `@media (max-height:520px){${hl} #logo{font-size:clamp(50px,16vh,84px)}}`;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
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
    const w = (ZH || X === 'ja') && document.getElementById('word');
    if (w) {
      const fit = () => { const v = w.textContent.length > 4 && /^[A-Z-]+$/.test(w.textContent) ? 'min(14vw,150px)' : ''; if (w.style.fontSize !== v) w.style.fontSize = v; };
      new MutationObserver(fit).observe(w, { childList: true, characterData: true, subtree: true });
    }
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
