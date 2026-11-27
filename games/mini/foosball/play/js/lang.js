// ?lang=en 이면 화면 글자를 영어로, ?lang=zh 이면 중국어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
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
  // 중국어 사전: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '테이블축구게임': '桌上足球',
    '테이블 축구': '桌上足球',
    '상점': '商店',
    '미션': '任务',
    '입기': '穿上',
    '사용 중': '穿着中',
    '홈': '主页',
    '나': '我',
    '계속': '继续',
    '이동': '移动',
    '킥': '踢球',
    '클릭': '点击',
    '속도': '速度',
    '파랑': '蓝色', '빨강': '红色', '초록': '绿色', '노랑': '黄色', '주황': '橙色', '하늘': '天蓝',
    '보라': '紫色', '분홍': '粉色', '흑표범': '黑豹', '백호': '白虎', '황금': '黄金', '은하': '银河',
    '일본': '日本', '멕시코': '墨西哥', '미국': '美国', '네덜란드': '荷兰', '포르투갈': '葡萄牙',
    '크로아티아': '克罗地亚', '이탈리아': '意大利', '스페인': '西班牙', '독일': '德国', '프랑스': '法国',
    '아르헨티나': '阿根廷', '브라질': '巴西',
    '첫 골': '首个进球', '첫 승리': '首场胜利', '연속 3골': '连进3球', '수비수 골': '后卫进球',
    '5초 골': '5秒进球', '벽 맞고 골': '撞墙进球', '무실점 승리': '零失球胜利', '골키퍼 골': '门将进球',
    '역전승': '逆转胜', '5연승': '5连胜', '100골': '进100球',
    '가로 화면에서 하는 게임입니다': '这款游戏要横屏玩',
    '가로로 돌리기': '切换横屏',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': '按钮没反应的话，请关掉手机的旋转锁定，再把手机横过来',
    '그래도 세로로 하기': '还是竖屏玩',
  };
  const T = EN ? D : ZH ? Z : null;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!T || s == null) return s;
    return String(s).replace(re, (m) => (T[m] != null ? T[m] : m));
  };
  if (!T) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'FOOSBALL';
  } else {
    document.documentElement.lang = 'zh-CN';
    document.title = '桌上足球';
    // 게임 글꼴(Stylish·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Stylish';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
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
