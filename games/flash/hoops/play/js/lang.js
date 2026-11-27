// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어. 화면 글은 L(한, 영), 처음 HTML 글은 아래 표로 바꿔 끼움.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const ZH = (window.ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh');
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '오락실 농구': '街机投篮',
    '마지막 골대까지 넘겼다<br>오늘부터 이 오락실 1등은 나다<br><br>': '最后一个篮筐也拿下了<br>从今天起，这家街机厅我是第一<br><br>',
    '성공률 ': '命中率 ', '최고 연속 골 ': '最高连进 ', '성공률': '命中率', '최고 연속 골': '最高连进',
    '전설의 손목': '传说中的手腕', '오락실의 신': '街机之神', '동네 농구왕': '街区篮球王', '명사수': '神射手', '농구 기계 정복자': '投篮机征服者',
    '너는 몇 판까지 갈 수 있을까?': '你能打到第几关？',
    '오락실 농구 30판 다 깼다! 너도 해 봐': '街机投篮 30 关全通了！你也来试试',
  };
  window.L = (ko, en) => (EN ? en : ZH && Z[ko] != null ? Z[ko] : ko);
  if (!EN && !ZH) return;
  document.documentElement.lang = EN ? 'en' : 'zh-CN';
  const TX = EN ? {
    h1: 'Flick the ball <b>up</b> to shoot',
    h2: '<b>Longer</b> flick goes farther, <b>angled</b> flick goes sideways',
    h3: 'Beat the <b>GOAL</b> in 40 seconds to CLEAR. Last 10 seconds = 3 points',
  } : {
    h1: '把球<b>往上一弹</b>就投出去',
    h2: '<b>弹得长</b>投得远，<b>斜着弹</b>就往旁边飞',
    h3: '40 秒内超过 <b>GOAL</b> 分数就 CLEAR。最后 10 秒每球 3 分',
  };
  if (ZH) {
    // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zb};font-weight:700;unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = EN ? 'Arcade Hoops' : '街机投篮';
    document.querySelectorAll('[data-k]').forEach((e) => { const k = e.getAttribute('data-k'); if (TX[k]) e.innerHTML = TX[k]; });
    const lt = document.getElementById('logoT'); if (lt) lt.textContent = EN ? 'ARCADE HOOPS' : '街机投篮';
    if (EN) { const sm = document.querySelector('#logo small'); if (sm) sm.textContent = 'BASKETBALL'; }
    const cs = document.querySelector('#cSave span'); if (cs) cs.textContent = EN ? 'SAVE' : '保存';
    const sh = document.querySelector('#cShare span'); if (sh) sh.textContent = EN ? 'SHARE' : '分享';
  });
})();
