// ?lang=en 이면 영어, zh 중국어, ja 일본어, pt 포르투갈어, ru 러시아어로 화면 글자를 바꾼다 (BUY JEJU 방식: 사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const QL = new URLSearchParams(location.search).get('lang');
  const ZH = !EN && QL === 'zh';
  const LX = !EN && !ZH && ['ja', 'pt', 'ru'].includes(QL) ? QL : '';
  window.LANG = EN ? 'en' : ZH ? 'zh' : LX || 'ko';
  const DE = {
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
  // 중국어: 한국어 낱말을 열쇠로 찾는다
  const DZ = {
    '와르르 볼링': '3D保龄球',
    '와르르': '',
    '볼링': '3D保龄球',
    '이어하기': '继续游戏',
    '상점': '商店',
    '미션': '任务',
    '장착': '装备',
    '사용 중': '使用中',
    '홈': '主页',
    '나': '我',
    '연습공': '练习球',
    '딸기': '草莓',
    '민트': '薄荷',
    '오렌지': '橙子',
    '은하수': '银河',
    '용암': '熔岩',
    '번개': '闪电',
    '바다': '大海',
    '네온': '霓虹',
    '황금': '黄金',
    '무지개': '彩虹',
    '우주': '宇宙',
    '파워': '力量',
    '훅': '弧线',
    '첫 STRIKE': '首个 STRIKE',
    '첫 SPARE': '首个 SPARE',
    '스플릿 처리': '分瓶补中',
    '100점': '100分',
    '150점': '150分',
    '200점': '200分',
    '250점': '250分',
    '무승부': '平局',
    '계속': '继续',
  };
  // 일본어·포르투갈어·러시아어: 한국어 낱말을 열쇠로 찾는다
  const DJ = {
    '와르르 볼링': '3Dボウリング',
    '와르르': '',
    '볼링': '3Dボウリング',
    '이어하기': 'つづきから',
    '상점': 'ショップ',
    '미션': 'ミッション',
    '장착': '装備',
    '사용 중': '使用中',
    '홈': 'ホーム',
    '나': '自分',
    '연습공': '練習ボール',
    '딸기': 'イチゴ',
    '민트': 'ミント',
    '오렌지': 'オレンジ',
    '은하수': '天の川',
    '용암': 'マグマ',
    '번개': 'イナズマ',
    '바다': '海',
    '네온': 'ネオン',
    '황금': '黄金',
    '무지개': '虹',
    '우주': '宇宙',
    '파워': 'パワー',
    '훅': 'フック',
    '첫 STRIKE': '初STRIKE',
    '첫 SPARE': '初SPARE',
    '스플릿 처리': 'スプリットメイク',
    '100점': '100点',
    '150점': '150点',
    '200점': '200点',
    '250점': '250点',
    '무승부': '引き分け',
    '계속': 'つづける',
  };
  const DP = {
    '와르르 볼링': 'BOLICHE',
    '와르르': '',
    '볼링': 'BOLICHE',
    '이어하기': 'CONTINUAR',
    '상점': 'LOJA',
    '미션': 'MISSÕES',
    '장착': 'EQUIPAR',
    '사용 중': 'EM USO',
    '홈': 'INÍCIO',
    '나': 'EU',
    '연습공': 'Treino',
    '딸기': 'Morango',
    '민트': 'Menta',
    '오렌지': 'Laranja',
    '은하수': 'Via Láctea',
    '용암': 'Lava',
    '번개': 'Raio',
    '바다': 'Oceano',
    '네온': 'Neon',
    '황금': 'Ouro',
    '무지개': 'Arco-íris',
    '우주': 'Cosmos',
    '파워': 'FORÇA',
    '훅': 'CURVA',
    '첫 STRIKE': 'Primeiro STRIKE',
    '첫 SPARE': 'Primeiro SPARE',
    '스플릿 처리': 'Converter split',
    '100점': '100 PTS',
    '150점': '150 PTS',
    '200점': '200 PTS',
    '250점': '250 PTS',
    '무승부': 'EMPATE',
    '계속': 'CONTINUAR',
  };
  const DR = {
    '와르르 볼링': 'БОУЛИНГ',
    '와르르': '',
    '볼링': 'БОУЛИНГ',
    '이어하기': 'ПРОДОЛЖИТЬ',
    '상점': 'МАГАЗИН',
    '미션': 'ЗАДАНИЯ',
    '장착': 'ВЫБРАТЬ',
    '사용 중': 'ВЫБРАН',
    '홈': 'МЕНЮ',
    '나': 'ТЫ',
    '연습공': 'Новичок',
    '딸기': 'Клубника',
    '민트': 'Мята',
    '오렌지': 'Апельсин',
    '은하수': 'Млечный Путь',
    '용암': 'Лава',
    '번개': 'Молния',
    '바다': 'Океан',
    '네온': 'Неон',
    '황금': 'Золото',
    '무지개': 'Радуга',
    '우주': 'Космос',
    '파워': 'СИЛА',
    '훅': 'ХУК',
    '첫 STRIKE': 'Первый STRIKE',
    '첫 SPARE': 'Первый SPARE',
    '스플릿 처리': 'Сбить сплит',
    '100점': '100 ОЧКОВ',
    '150점': '150 ОЧКОВ',
    '200점': '200 ОЧКОВ',
    '250점': '250 ОЧКОВ',
    '무승부': 'НИЧЬЯ',
    '계속': 'ДАЛЕЕ',
  };
  const ON = EN || ZH || !!LX;
  const D = ZH ? DZ : LX === 'ja' ? DJ : LX === 'pt' ? DP : LX === 'ru' ? DR : DE;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!ON || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!ON) return;
  const LH = { ja: ['ja', '3Dボウリング'], pt: ['pt-BR', 'BOLICHE'], ru: ['ru', 'БОУЛИНГ'] };
  document.documentElement.lang = LX ? LH[LX][0] : ZH ? 'zh-CN' : 'en';
  document.title = LX ? LH[LX][1] : ZH ? '3D保龄球' : 'BOWLING';
  if (LX === 'ja') {
    // 게임 글꼴에 가나가 없어 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Orbit';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
    document.head.appendChild(st);
  } else if (LX) {
    // 악센트 라틴·키릴 글자는 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Orbit';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${lf};unicode-range:${ur}}html[lang=pt-BR] .st em{width:54px;font-size:11px}html[lang=pt-BR] .st{gap:4px;letter-spacing:0}`;
    document.head.appendChild(st);
  }
  if (ZH) {
    // 게임 글꼴(Orbit·Ria)엔 한자가 없다: 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Orbit';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
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
