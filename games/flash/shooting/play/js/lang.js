// ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어로 화면 글자를 바꾼다(사전 + MutationObserver). 캔버스 글자는 L() 로 감싼다.
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
  const D = {
    '야시장 사격게임': 'NIGHT MARKET SHOOTING GAME',
    '야시장 사격': 'NIGHT MARKET SHOOTING',
    '사격장': 'SHOOTING',
    '사격왕': 'CHAMPION',
    '경품 획득': 'PRIZE!',
    '상점': 'SHOP',
    '경품': 'PRIZES',
    '미션': 'MISSIONS',
    '홈': 'HOME',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '가로로 보기': 'ROTATE',
    '처음부터': 'NEW GAME',
    '모든 기록이 지워집니다': 'All progress will be erased',
    '취소': 'CANCEL',
    '확인': 'OK',
    '쏘기': 'FIRE',
    '탄 +1': 'AMMO +1',
    '코르크총': 'Cork Gun', '장총': 'Long Rifle', '쌍발총': 'Twin Gun', '3연발': 'Triple Burst', '산탄총': 'Shotgun', '공 대포': 'Ball Cannon',
    '대왕 곰': 'KING BEAR', '곰': 'Bear', '토끼': 'Bunny', '고양이': 'Kitty', '강아지': 'Puppy', '오리': 'Duckling', '펭귄': 'Penguin', '돼지': 'Piggy', '개구리': 'Froggy', '판다': 'Panda', '여우': 'Fox', '공룡': 'Dino',
    '첫 CLEAR': 'First CLEAR', '깡통 60개': '60 Cans', '병 20개 깨기': 'Break 20 Bottles', '오리 30마리': '30 Ducks', '풍선 30개': '30 Balloons',
    '한 발에 3개': '3 in One Shot', '한 발에 6개': '6 in One Shot', '폭죽 5번': '5 Fireworks', '별 30개': '30 Stars', '별 72개': '72 Stars', '총 3자루': 'Own 3 Guns', '경품 11개': '11 Prizes',
  };
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '야시장 사격게임': '夜市打枪',
    '야시장 사격': '夜市打枪',
    '사격장': '射击摊',
    '사격왕': '射击王',
    '경품 획득': '获得奖品',
    '상점': '商店',
    '경품': '奖品',
    '미션': '任务',
    '홈': '首页',
    '장착': '装备',
    '사용 중': '使用中',
    '가로로 보기': '横屏玩',
    '처음부터': '从头开始',
    '모든 기록이 지워집니다': '所有记录都会被清除',
    '취소': '取消',
    '확인': '确定',
    '쏘기': '射击',
    '탄 +1': '子弹 +1',
    '코르크총': '软木塞枪', '장총': '长枪', '쌍발총': '双管枪', '3연발': '三连发', '산탄총': '霰弹枪', '공 대포': '球炮',
    '대왕 곰': '大王熊', '곰': '小熊', '토끼': '兔子', '고양이': '猫咪', '강아지': '小狗', '오리': '鸭子', '펭귄': '企鹅', '돼지': '小猪', '개구리': '青蛙', '판다': '熊猫', '여우': '狐狸', '공룡': '恐龙',
    '첫 CLEAR': '首次 CLEAR', '깡통 60개': '60个罐子', '병 20개 깨기': '打碎20个瓶子', '오리 30마리': '30只鸭子', '풍선 30개': '30个气球',
    '한 발에 3개': '一枪打倒3个', '한 발에 6개': '一枪打倒6个', '폭죽 5번': '5次烟花', '별 30개': '30颗星', '별 72개': '72颗星', '총 3자루': '拥有3把枪', '경품 11개': '11个奖品',
  };
  const T = ZH ? Z : D;
  const keys = Object.keys(T).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[+]/g, '[+]')).join('|'), 'g');
  window.L = (s) => ((EN || ZH) && s ? String(s).replace(re, (m) => T[m]) : s);
  if (!EN && !ZH) return;
  document.documentElement.lang = ZH ? 'zh-CN' : 'en';
  document.title = ZH ? '夜市打枪' : 'Night Market Shooting Game';
  if (ZH) {
    // 게임 글꼴(Round·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Round';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  const fix = (n) => { if (n.nodeType === 3) { const v = n.nodeValue, w = window.L(v); if (w !== v) n.nodeValue = w; } else if (n.nodeType === 1) n.childNodes.forEach(fix); };
  const start = () => { fix(document.body); new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(fix); if (m.type === 'characterData') fix(m.target); })).observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
