// ?lang=en 이면 화면 글자를 영어로, ?lang=zh 이면 중국어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
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
  const M = EN ? D : Z;
  const keys = Object.keys(M).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!(EN || ZH) || s == null) return s;
    return String(s).replace(re, (m) => M[m]);
  };
  if (!(EN || ZH)) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'WOODEN BLOCK';
  } else {
    document.documentElement.lang = 'zh-CN';
    document.title = '木块叠叠高';
    // 게임 글꼴(Cute·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Cute';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}@media (max-height:520px){html[lang=zh-CN] #logo{font-size:clamp(40px,12.5vh,66px)}}`;
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
