// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const ZH = (window.ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh');
  if (!ZH) {
    window.L = (ko, en) => (EN ? en : ko);
    if (EN) { document.documentElement.lang = 'en'; document.title = 'HOTTEOK MAKER'; }
    return;
  }
  // 중국어: 한국어 원문을 열쇠로 찾고, 숫자가 섞인 문장은 틀로 바꾼다. 못 찾으면 영어.
  const Z = {
    '호떡만들기 게임': '糖饼摊', '호떡': '糖饼',
    '코인': '金币', '코인 ': '金币 ', '손님': '客人', '화남': '生气', '기름': '油', '꿀타임': '蜂蜜时间',
    '누르기: 통·도구 · 끌기: 옮기기 · 누르개 끌어다 꾹: 누르기 · 동그랗게: 오므리기 · O 기름 · Space 꿀타임':
      '点击：料盒·工具 · 拖动：移动 · 把压板拖上去按住：压扁 · 画圈：收口 · O 加油 · Space 蜂蜜时间',
    '이어하기': '继续游戏', '처음부터': '从头开始',
    '반죽을 판으로 옮기고 설탕 두 숟갈, 동그랗게 문질러 오므려요': '把面团拖到案板上，放两勺糖，画圈揉一揉收口',
    '철판에 올리고 고리가 초록이 되면 톡 눌러 뒤집어요': '放上铁板，圆圈变绿时轻点一下翻面',
    '누르개를 잡아 호떡 위에서 꾹, 초록에서 떼요. 너무 오래 누르면 터져요': '拿起压板在糖饼上按住，变绿就松手。按太久会爆开',
    '쟁반에서 쓱 갈라 씨앗을 넣고 손님에게 끌어다 줘요': '在托盘上划开，放进瓜子，再拖给客人',
    '망친 호떡은 왼쪽 통에 끌어다 버려요': '做坏的糖饼拖到左边的桶里扔掉',
    '상점': '商店', '처음 화면': '返回标题', '처음으로': '返回标题', '저장': '保存', '공유': '分享',
    '폰을 세로로 돌려 주세요': '请把手机竖过来',
    '마지막 날': '最后一天', '영화제 밤': '电影节之夜', '바삭하게': '酥脆款', '흥!': '哼!', '동글!': '圆啦!', '터짐!': '爆了!',
    '판 호떡': '卖出糖饼', '개': '个', '판 돈': '营业额', '팁': '小费', '주소를 복사했습니다': '链接已复制',
    '식용유': '食用油', '차림표': '菜单', '부산 명물': '釜山名吃', '해바라기씨': '葵花籽',
    '남포동 호떡 명인': '南浦洞糖饼大师', '부산 명물 호떡집': '釜山名店糖饼摊', '줄 서는 호떡집': '排长队的糖饼摊', '동네 호떡 아저씨': '街坊糖饼大叔',
    '번 코인': '赚到金币', '탄 호떡': '烤焦糖饼', '너는 몇 개 구울 수 있을까?': '你能烤出多少个？',
    '찹쌀': '糯米', '녹차': '绿茶', '흑미': '黑米', '흑설탕': '红糖', '팥': '红豆', '콘치즈': '玉米芝士', '잡채': '杂菜',
    '꿀호떡': '蜂蜜糖饼', '씨앗호떡': '瓜子糖饼', '씨앗 듬뿍': '瓜子加量', '단팥호떡': '红豆糖饼', '녹차호떡': '绿茶糖饼',
    '콘치즈호떡': '玉米芝士糖饼', '야채호떡': '杂菜糖饼', '흑미호떡': '黑米糖饼', '공갈호떡': '空心糖饼',
    '철판 넓히기': '加宽铁板', '호떡 굽는 칸': '烤糖饼的格子', '칸': '格',
    '화력': '火力', '빨리 익음': '熟得更快', '누르개': '压板', '알맞게 누르기 쉬움': '更容易压得刚好',
    '큰 기름병': '大油瓶', '기름이 덜 줄어듦': '油用得更慢', '난로': '暖炉', '손님이 오래 기다림': '客人等得更久',
    '간판 전구': '招牌灯泡', '팁이 늚': '小费变多',
  };
  const PAT = [
    [/^(\d+)일차$/, '第$1天'],
    [/^호떡만들기 게임 14일 장사 끝! 호떡 (\d+)개, PERFECT (\d+)% · (.*)$/, '糖饼摊 14天营业结束！卖出糖饼 $1个，PERFECT $2% · $3'],
  ];
  const L = (window.L = (ko, en) => {
    if (Z[ko] !== undefined) return Z[ko];
    for (const p of PAT) if (p[0].test(ko)) return ko.replace(p[0], p[1]);
    return en;
  });
  window.SIGNS_ZH = ['汤饭', '药店', '歌厅', '茶房', '生鱼片', '酒店', 'BIFF', '烤排骨', '南浦洞', '小吃', '剧场'];
  document.documentElement.lang = 'zh-CN';
  document.title = '糖饼摊';
  // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
  const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
  const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
  const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
  const st = document.createElement('style');
  st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
  document.head.appendChild(st);
  // 화면의 고정 글자(data-en 이 붙은 것과 첫 날 표시)를 중국어로
  document.querySelectorAll('[data-en]').forEach((e) => { e.textContent = L(e.textContent.trim(), e.dataset.en); });
  const vd = document.getElementById('vDay'); if (vd) vd.textContent = L(vd.textContent.trim(), vd.textContent);
})();
