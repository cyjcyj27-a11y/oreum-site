// ?lang=en 이면 영어, ?lang=zh 이면 중국어로 화면 글자를 바꾼다 (BUY JEJU 방식: 사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
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
  const ON = EN || ZH;
  const D = ZH ? DZ : DE;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!ON || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!ON) return;
  document.documentElement.lang = ZH ? 'zh-CN' : 'en';
  document.title = ZH ? '3D保龄球' : 'BOWLING';
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
