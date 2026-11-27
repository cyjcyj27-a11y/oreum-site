// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const ZH = (window.ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh');
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '쿠키쌓기': '饼干叠叠乐', '시작': '开始', '처음부터': '从头开始', '처음 화면': '返回标题', '저장': '保存', '공유': '分享', '복사됨': '已复制',
    '이어하기 STAGE ': '继续 STAGE ',
    '화면을 누르면 오가던 쿠키가 떨어져요': '点一下屏幕，来回移动的饼干就会掉下去',
    '삐져나온 만큼 잘려 나가요': '多出来的部分会被切掉',
    '딱 맞추면 PERFECT, 10 STAGE 위엔 달': '完美对齐就是 PERFECT，10 STAGE 之上是月亮',
    '스페이스 · 클릭 떨어뜨리기 / M 음악 · K 효과음': '空格 · 点击 放下 / M 音乐 · K 音效',
    '골목 지붕': '小巷屋顶', '참새 하늘': '麻雀天空', '구름 아래': '云层之下', '구름 위': '云层之上', '열기구 길': '热气球之路',
    '노을': '晚霞', '무지개 다리': '彩虹桥', '별밤': '星空夜', '우주': '太空', '달': '月亮',
    '한 번도 안 무너진 장인': '一次没倒的大师', 'PERFECT 장인': 'PERFECT 大师', '손끝 장인': '稳手大师', '포기를 모르는 사람': '永不放弃的人', '달까지 쌓은 사람': '叠到月亮的人',
    '쌓은 층': '层数', '최고 연속': '最高连击', '무너진 횟수': '倒塌次数', '걸린 시간 ': '用时 ',
    '너는 몇 번 무너지고 달에 닿을까?': '你要倒几次才能叠到月亮？',
  };
  window.L = (ko, en) => (EN ? en : ZH && Z[ko] != null ? Z[ko] : ko);
  if (EN) document.documentElement.lang = 'en';
  if (ZH) {
    document.documentElement.lang = 'zh-CN';
    // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
})();
