// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const ZH = (window.ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh');
  // 중국어: 한국어 문장을 열쇠로 찾고, 숫자가 섞인 문장은 틀로 바꾼다
  const Z = {
    '햄스런': '仓鼠快跑', '햄스터': '仓鼠', ' 햄스터': ' 仓鼠', '처음부터': '从头开始', '처음 화면': '返回标题', '저장': '保存', '공유': '分享',
    '누르면 앞으로, 밀면 그쪽으로 콩': '点一下往前蹦，滑一下就往那边蹦',
    '해바라기씨는 볼에 넣고, 은신처에 쏟으면 내 것': '瓜子先塞进腮帮子，倒进窝里才算你的',
    '꾸물대면 고양이가 덮쳐요': '磨磨蹭蹭的话，猫咪就扑过来了',
    '↑↓←→ · WASD 이동 / M 음악 · K 효과음': '↑↓←→ · WASD 移动 / M 音乐 · K 音效',
    '아이방': '儿童房', '부엌': '厨房', '마당': '院子', '골목': '小巷', '공원': '公园',
    '골든': '金丝熊', '정글리안': '三线', '펄': '银狐', '푸딩': '布丁', '블루사파이어': '紫仓', '판다': '熊猫', '로보로프스키': '老公公', '블랙': '黑熊',
    '한 번도 안 잡힌 햄스터': '一次没被抓的仓鼠', '볼주머니 부자': '腮帮子富豪', '번개 햄스터': '闪电仓鼠', '칠전팔기 햄스터': '越挫越勇的仓鼠', '해바라기 밭에 닿은 햄스터': '抵达向日葵田的仓鼠',
    '걸린 시간': '用时', '먹은 씨': '吃掉的瓜子', '은신처에 쏟은 씨': '存进窝里的瓜子', '잡힌 횟수': '被抓次数',
    '너는 몇 번 잡히고 해바라기 밭에 닿을까?': '你要被抓几次才能到向日葵田？',
    '주소를 복사했습니다': '链接已复制',
  };
  const PAT = [
    [/^햄스런 해바라기 밭 도착! (\S+), 씨 (\d+)개, 잡힌 횟수 (\d+)번 · (.*)$/, '仓鼠快跑 抵达向日葵田！$1，瓜子 $2 颗，被抓 $3 次 · $4'],
  ];
  window.L = (ko, en) => {
    if (EN) return en;
    if (!ZH) return ko;
    if (Z[ko] != null) return Z[ko];
    for (const p of PAT) if (p[0].test(ko)) return ko.replace(p[0], p[1]);
    return ko;
  };
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
