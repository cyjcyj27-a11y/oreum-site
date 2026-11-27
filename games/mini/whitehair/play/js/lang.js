// 언어: 주소에 ?lang=en 일 때 영어, ?lang=zh 일 때 중국어(간체). 그 밖엔 한국어.
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const EN = (window.EN = Q === 'en');
  const ZHON = (window.ZH = Q === 'zh');
  if (!ZHON) {
    window.L = (ko, en) => (EN ? en : ko);
    if (EN) { document.documentElement.lang = 'en'; document.title = 'WHITE HAIR SHOP'; }
    return;
  }
  // 중국어: 한국어 원문을 열쇠로 찾고, 숫자가 섞인 문장은 틀로 바꾼다. 못 찾으면 영어.
  const ZH = {
    '흰머리뽑기방': '拔白头发店',
    // 상단바·단추(data-en)
    '손님': '客人', '인내심': '耐心', '흰머리': '白发', '코인': '金币', '상점': '商店', '도감': '图鉴',
    '차': '茶', '주무르기': '按摩', '참빗': '篦子', '이어하기': '继续', '처음부터': '重新开始',
    '처음 화면': '回到标题', '저장': '保存', '공유': '分享', '처음으로': '回到标题',
    '눌러서 넘기기': '点击跳过', '폰을 세로로 돌려 주세요': '请把手机竖过来',
    '머리카락 끌기: 뽑기 · 빈 곳 끌기·오른쪽 끌기: 돌리기 · 휠: 확대 · C 참빗 · T 차 · R 주무르기':
      '拖动头发：拔 · 拖空白处/右键拖：转头 · 滚轮：放大 · C 篦子 · T 茶 · R 按摩',
    // 설명
    '흰머리 뿌리 가까이 집고 쭉 당겨요. 끝을 잡으면 끊어져요': '捏住白发靠近根部的地方，一口气拔出来。捏发梢会拔断',
    '검은 머리를 뽑으면 손님이 아파해요': '拔到黑头发，客人会喊疼',
    '참빗으로 곱게 빗으면 숨은 흰머리가 보여요': '用篦子细细一梳，藏着的白发就露出来了',
    '빈 곳 끌기: 머리 돌리기 · 두 손가락: 확대': '拖空白处：转头 · 双指：放大',
    '빈 곳 끌기·오른쪽 끌기: 머리 돌리기 · 휠: 확대 · C 참빗': '拖空白处/右键拖：转头 · 滚轮：放大 · C 篦子',
    // 놀이 중
    '마지막': '最后', '아야!': '哎哟!', '인내심 가득': '耐心已满', '후루룩': '吸溜~', '시원하다': '好舒服~', '인내심 +': '耐心 +',
    // 정산·상점
    '흰머리 ': '白发 ', '황금 머리카락 ': '金头发 ', '검은 머리 ': '黑头发 ', '팁': '小费', '합계': '合计',
    '쓴 코인 돌려받음 +': '退还已花金币 +', '코인 ': '金币 ', '가진 것 ': '持有 ', '주소를 복사했습니다': '链接已复制',
    // 흰머리 종류
    '보통 흰머리': '普通白发', '새싹 흰머리': '新芽白发', '반백 머리': '半白头发', '곱슬 흰머리': '卷曲白发',
    '굵은 흰머리': '粗白发', '은빛 긴 머리': '银色长发', '쌍둥이 흰머리': '双生白发', '황금 머리카락': '金头发',
    // 상점 물건
    '족집게': '镊子', '덜 끊기고, 옆 검은 머리가 덜 딸려 옴': '不容易拔断，也少带出旁边的黑发',
    '맨손가락': '徒手', '쇠 족집게': '铁镊子', '뾰족 족집게': '尖头镊子', '장인 족집게': '匠人镊子',
    '한 번에 더 넓게 빗김': '一次梳得更宽', '작은 참빗': '小篦子', '큰 참빗': '大篦子',
    '조명': '灯光', '가게가 밝아져 숨은 흰머리가 잘 보임': '店里更亮，藏着的白发更显眼',
    '형광등': '日光灯', '스탠드': '台灯', '링 조명': '环形灯',
    '돋보기': '放大镜', '머리를 더 가까이 확대': '把头发放得更大', '맨눈': '肉眼', '확대경': '头戴放大镜',
    '의자': '椅子', '손님이 편해서 고개를 덜 움직임': '客人坐得舒服，头就少动', '나무 의자': '木椅', '쿠션 의자': '软垫椅', '안마 의자': '按摩椅',
    '차 대접': '请喝茶', '단추로 써서 인내심 +60': '按按钮使用，耐心 +60',
    '어깨 주무르기': '捏肩膀', '단추로 써서 인내심 +35': '按按钮使用，耐心 +35',
    // 가게 앞 화환 리본
    '번창하세요': '生意兴隆', '축 개업': '开业大吉',
    // 결과 카드
    '털끝 하나 안 건드린 장인': '毫发无伤的匠人', '동네 족집게 1등': '街坊镊子第一名', '흰머리 사냥꾼': '白发猎人', '초보 족집게': '新手镊子',
    '뽑은 흰머리': '拔掉的白发', '뿌리째': '连根拔起', '번 코인': '赚到的金币', '검은 머리 실수': '误拔黑发',
    '너는 몇 가닥 뽑을 수 있을까?': '你能拔几根？',
  };
  const PAT = [
    [/^흰머리뽑기방 손님 (\d+)명 끝! 흰머리 (\d+)가닥, 뿌리째 (\d+)% · (.*)$/, '拔白头发店 $1 位客人全部搞定！白发 $2 根，连根拔起 $3% · $4'],
  ];
  window.L = (ko, en) => {
    if (ZH[ko] !== undefined) return ZH[ko];
    for (const p of PAT) if (p[0].test(ko)) return ko.replace(p[0], p[1]);
    return en;
  };
  document.documentElement.lang = 'zh-CN';
  document.title = '拔白头发店';
  // 게임 글꼴(Ttl·Sign·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
  const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
  const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
  // 굵기 범위를 원래 글꼴과 맞춰야 한자가 원래 글꼴(일부 한자만 있음)보다 먼저 잡힌다. 굵은 글씨는 굵은 기기 글꼴로.
  const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('MicrosoftYaHei-Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Noto Sans CJK SC Bold'),local('Source Han Sans SC Bold')," + zf;
  const st = document.createElement('style');
  st.textContent = ['Ttl', 'Sign', 'Ui'].map((f) => `@font-face{font-family:'${f}';src:${zf};unicode-range:${ur};font-weight:100 500}@font-face{font-family:'${f}';src:${zb};unicode-range:${ur};font-weight:600 900}`).join('') +
    'html[lang=zh-CN] *{word-break:normal!important}';
  document.head.appendChild(st);
})();
