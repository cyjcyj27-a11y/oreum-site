/* 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어 */
(function () {
  var q = ''; try { q = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
  var en = q === 'en', zh = q === 'zh';
  if (en) document.documentElement.lang = 'en';
  var D = { '딱지치기': 'DDAKJI', '지도': 'MAP', '가방': 'BAG', '도감': 'BOOK', '처음으로': 'HOME', '시작': 'START', '이어하기': 'CONTINUE', '새로 시작': 'NEW GAME',
    '무게': 'Weight', '두께': 'Thick', '내 딱지': 'Mine', '내 차례': 'MY TURN', '골목': 'Alley', '놀이터': 'Playground', '운동장': 'Schoolyard', '문방구 앞': 'Stationery Shop', '딱지왕': 'DDAKJI KING' };
  // 중국어: 한국어 문장을 열쇠로 찾는다. 이름 속 U+200B 는 줄이 바뀔 자리
  var Z = { '딱지치기': '拍纸牌', '지도': '地图', '가방': '背包', '도감': '图鉴', '처음으로': '返回标题', '시작': '开始', '이어하기': '继续', '새로 시작': '重新开始',
    '무게': '重量', '두께': '厚度', '내 딱지': '我的纸牌', '내 차례': '我的回合', '골목': '小巷', '놀이터': '游乐场', '운동장': '操场', '문방구 앞': '文具店门口', '딱지왕': '纸牌王',
    '빨간 색종이': '红色彩纸', '노란 색종이': '黄色彩纸', '파란 색종이': '蓝色彩纸', '신문지': '旧报纸', '공책 표지': '笔记本​封面', '전단지': '传单', '달력': '日历', '시험지': '试卷',
    '갱지': '草纸', '우유팩': '牛奶盒', '만화 잡지': '漫画​杂志', '과자 상자': '零食盒', '교과서 표지': '课本​封面', '물방울 포장지': '波点​包装纸', '한지': '韩纸', '골판지': '瓦楞纸',
    '꽃무늬 벽지': '碎花​墙纸', '사진 잡지': '画报​杂志', '두꺼운 달력': '厚日历', '학습지': '练习册', '크레파스 상자': '蜡笔盒', '보드게임 상자': '桌游盒', '스티커 판': '贴纸板',
    '신문 광고면': '报纸​广告版', '별 포장지': '星星​包装纸', '체크 포장지': '格子​包装纸', '도화지': '图画纸', '은박지': '锡纸', '금박지': '金箔纸', '빨간 금테 딱지': '红色金边​纸牌',
    '공룡 딱지': '恐龙​纸牌', '로봇 딱지': '机器人​纸牌', '무지개 딱지': '彩虹​纸牌', '반짝이 딱지': '闪闪​纸牌', '먹지 딱지': '复写纸​纸牌', '황금딱지': '黄金​纸牌',
    '코찔찔이 민수': '鼻涕虫​民秀', '막내 지혜': '老幺​智慧', '안경 동현': '眼镜​东贤', '떡볶이 은지': '炒年糕​恩智', '쌍둥이 형': '双胞胎​哥哥', '골목대장 왕발': '巷子老大​大脚',
    '모래성 수아': '沙堡​秀雅', '철봉 준호': '单杠​俊浩', '미끄럼틀 하늘': '滑梯​小天', '개구쟁이 태풍': '淘气包​台风', '정글짐 소희': '攀爬架​素熙', '그네 대장': '秋千​大王',
    '반장 서윤': '班长​瑞允', '축구부 민재': '足球队​珉载', '줄넘기 다은': '跳绳​多恩', '피구왕 통키': '躲避球王​通奇', '전학생 레오': '转学生​利奥', '6학년 형': '六年级​大哥',
    '뽑기왕 지호': '抽奖王​智浩', '오락실 형': '游戏厅​大哥', '구슬왕 보람': '弹珠王​宝蓝', '딱지 수집가': '纸牌​收藏家', '중학생 형': '初中生​大哥', '문방구 아들': '文具店​少爷',
    '에잇!': '嘿！', '간다~': '来咯~', '헤헤 안 넘어가지롱': '嘿嘿翻不过来吧', '바보~': '笨蛋~', '아 내 딱지!': '啊我的纸牌！', '치사해!': '耍赖！',
    '나도 한다!': '我也来！', '얍!': '呀！', '메롱~': '略略略~', '그것도 못 해?': '这都不会？', '엄마한테 이를 거야!': '我要告诉妈妈！', '흐엥': '呜哇',
    '각도 계산 끝': '角度计算完毕', '정확히 여기': '就是这里', '역학적으로 불가능': '力学上不可能', '힘이 모자라': '力气不够', '계산이 틀렸다': '算错了', '오차 범위 밖': '超出误差范围',
    '각오해라': '做好觉悟吧', '이게 진짜 딱지다': '这才叫拍纸牌', '꼬맹이 주제에': '小屁孩还想赢', '어림없지': '门都没有', '제법인데?': '有两下子？', '이럴 리가': '怎么可能' };
  window.LANG = en ? 'en' : zh ? 'zh' : 'ko';
  window.L = function (ko, enTxt) { if (zh) return Z[ko] != null ? Z[ko] : ko; if (!en) return ko; return enTxt != null ? enTxt : (D[ko] || ko); };
  if (zh) {
    document.documentElement.lang = 'zh-CN';
    // 게임 글꼴(Osq·Elice)엔 한자가 없다: 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    var zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var st = document.createElement('style');
    st.textContent = "@font-face{font-family:'Osq';src:" + zb + ";unicode-range:" + ur + "}@font-face{font-family:'Elice';src:" + zf + ";unicode-range:" + ur + "}html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .kid span,html[lang=zh-CN] .it span,html[lang=zh-CN] .card .n,html[lang=zh-CN] #oppN{word-break:keep-all!important}html[lang=zh-CN] .sheet h2,html[lang=zh-CN] .hd .btn{white-space:nowrap}@media (max-width:560px){html[lang=zh-CN] .hd .btn.sm{padding:8px 10px}}";
    document.head.appendChild(st);
  }
  if (en || zh) document.addEventListener('DOMContentLoaded', function () {
    var M = zh ? Z : D;
    document.title = zh ? '拍纸牌' : 'Ddakji';
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var t = n.nodeValue.trim(); if (M[t]) n.nodeValue = n.nodeValue.replace(t, M[t]); }
  });
})();
