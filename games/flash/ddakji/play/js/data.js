/* 딱지 36종 · 동네 넷 · 상대 24명 */
(function () {
  // [id, 한글, 영문, 앞면 색A, 앞면 색B, 무늬, 무게 W, 두께 K, 등급 0보통 1금테 2황금]
  var T = [
    ['red',    '빨간 색종이',   'Red Paper',      '#d8392b', '#2f5fb8', 'solid', 1.00, 1.00, 0],
    ['yellow', '노란 색종이',   'Yellow Paper',   '#f2c230', '#2e9a55', 'solid', 1.00, 1.00, 0],
    ['blue',   '파란 색종이',   'Blue Paper',     '#2f6fd0', '#f08a2c', 'solid', 1.00, 1.00, 0],
    ['news',   '신문지',        'Newspaper',      '#ece6d6', '#d9d2c0', 'news',  0.92, 0.95, 0],
    ['note',   '공책 표지',     'Notebook Cover', '#7fb6e0', '#f4efe2', 'stripe',1.05, 1.05, 0],
    ['flyer',  '전단지',        'Flyer',          '#f7e94a', '#e8453c', 'ad',    0.95, 0.95, 0],
    ['cal',    '달력',          'Calendar',       '#f6f3ec', '#c8332b', 'cal',   1.10, 1.10, 0],
    ['test',   '시험지',        'Test Paper',     '#f7f5ef', '#ece8de', 'test',  0.95, 1.00, 0],
    ['gang',   '갱지',          'Rough Paper',    '#cbbd98', '#b9a982', 'fiber', 1.00, 0.95, 0],
    ['milk',   '우유팩',        'Milk Carton',    '#f4f6f8', '#2d6cc0', 'milk',  1.18, 1.15, 0],
    ['comic',  '만화 잡지',     'Comic Magazine', '#f04e7a', '#ffd23a', 'comic', 1.12, 1.08, 0],
    ['snack',  '과자 상자',     'Snack Box',      '#e8642a', '#ffe08a', 'box',   1.20, 1.18, 0],
    ['book',   '교과서 표지',   'Textbook Cover', '#5aa88a', '#f2ead2', 'book',  1.15, 1.20, 0],
    ['wrap',   '물방울 포장지', 'Polka Wrap',     '#f6a6c0', '#ffffff', 'dot',   1.00, 1.05, 0],
    ['hanji',  '한지',          'Hanji',          '#efe2c4', '#c9a46a', 'hanji', 1.05, 1.25, 0],
    ['kraft',  '골판지',        'Cardboard',      '#b98b55', '#a27546', 'kraft', 1.35, 1.30, 0],
    ['wall',   '꽃무늬 벽지',   'Floral Wallpaper','#f3e7d0', '#d86a7a', 'flower',1.05, 1.10, 0],
    ['gloss',  '사진 잡지',     'Glossy Magazine','#3a3f58', '#e9c46a', 'gloss', 1.15, 1.00, 0],
    ['bigcal', '두꺼운 달력',   'Thick Calendar', '#2a6b4a', '#f4f0e4', 'cal',   1.28, 1.35, 0],
    ['drill',  '학습지',        'Workbook',       '#f9f6ee', '#3e8fd6', 'test',  1.10, 1.15, 0],
    ['crayon', '크레파스 상자', 'Crayon Box',     '#2b4fa8', '#f5d43c', 'stripe',1.25, 1.25, 0],
    ['board',  '보드게임 상자', 'Board Game Box', '#1f8a6e', '#f2f2ea', 'check', 1.40, 1.35, 0],
    ['sticker','스티커 판',     'Sticker Sheet',  '#ffffff', '#ff7a2f', 'star',  1.10, 1.10, 0],
    ['adnews', '신문 광고면',   'Ad Page',        '#e9e2cf', '#d23a2e', 'news',  1.05, 1.05, 0],
    ['starw',  '별 포장지',     'Star Wrap',      '#20307a', '#f7d64a', 'star',  1.15, 1.15, 0],
    ['tartan', '체크 포장지',   'Tartan Wrap',    '#b8322c', '#1e3b2c', 'check', 1.15, 1.20, 0],
    ['canvas', '도화지',        'Drawing Paper',  '#fbfaf5', '#e7e3d6', 'fiber', 1.30, 1.40, 0],
    ['silver', '은박지',        'Silver Foil',    '#c9ced6', '#8e97a6', 'foil',  1.45, 1.40, 1],
    ['goldf',  '금박지',        'Gold Foil',      '#e2b84a', '#a8781e', 'foil',  1.55, 1.45, 1],
    ['redgold','빨간 금테 딱지','Gold-Rim Red',   '#c41f2a', '#f1c24a', 'rim',   1.50, 1.55, 1],
    ['dino',   '공룡 딱지',     'Dino Ddakji',    '#4fa04a', '#f2d24a', 'dino',  1.55, 1.50, 1],
    ['robot',  '로봇 딱지',     'Robot Ddakji',   '#3a63c8', '#d8dde6', 'robot', 1.60, 1.50, 1],
    ['rainbow','무지개 딱지',   'Rainbow Ddakji', '#e84a4a', '#3a8ae8', 'rainbow',1.55,1.55, 1],
    ['glitter','반짝이 딱지',   'Glitter Ddakji', '#7a3ac8', '#f05ab4', 'glitter',1.60,1.60, 1],
    ['ebony',  '먹지 딱지',     'Carbon Ddakji',  '#1d1d22', '#5a5a66', 'carbon',1.70, 1.65, 1],
    ['king',   '황금딱지',      'Golden Ddakji',  '#f4c430', '#c88a12', 'king',  1.90, 1.90, 2]
  ];
  var TYPES = T.map(function (r, i) {
    return { i: i, id: r[0], ko: r[1], en: r[2], a: r[3], b: r[4], pat: r[5], W: r[6], K: r[7], rare: r[8] };
  });
  var BYID = {}; TYPES.forEach(function (t) { BYID[t.id] = t; });

  // 동네: 바닥 재질, 마찰, 바람이 얼마나 잘 드는가
  var PLACES = [
    { id: 'alley',  ko: '골목',      en: 'Alley',          tex: 'alley', fr: 0.75, air: 1.00, rep: 3.2, sun: '#ffd9a8' },
    { id: 'park',   ko: '놀이터',    en: 'Playground',     tex: 'sand',  base: '#d8c39a', fr: 0.95, air: 0.92, rep: 2.6, sun: '#ffe2b8' },
    { id: 'school', ko: '운동장',    en: 'Schoolyard',     tex: 'dirt',  base: '#9a7a58', fr: 0.85, air: 0.96, rep: 3.2, sun: '#ffc98e' },
    { id: 'shop',   ko: '문방구 앞', en: 'Stationery Shop',tex: 'brick', base: '#9a5442', fr: 0.70, air: 1.04, rep: 9.0, sun: '#ffb27a' }
  ];
  // 상대: [한글 이름, 영문, 동네, 까는 딱지 순서, 실력(tools/tune.py 로 맞춤), 말버릇]
  var O = [
    ["코찔찔이 민수", "Runny-Nose Minsu", 0, ["news","news","flyer"], 0.48, 0],
    ["막내 지혜", "Little Jihye", 0, ["yellow","red","yellow"], 0.72, 1],
    ["안경 동현", "Glasses Donghyun", 0, ["test","note","test","news"], 0.89, 2],
    ["떡볶이 은지", "Tteokbokki Eunji", 0, ["flyer","red","flyer","blue"], 0.91, 1],
    ["쌍둥이 형", "Twin Brother", 0, ["blue","yellow","blue","red"], 0.96, 0],
    ["골목대장 왕발", "Bigfoot the Alley Boss", 0, ["cal","milk","cal","gang","cal"], 0.78, 3],
    ["모래성 수아", "Sandcastle Sua", 1, ["wrap","note","wrap","gang"], 1.00, 1],
    ["철봉 준호", "Pull-up Junho", 1, ["milk","gang","milk","note"], 0.99, 2],
    ["미끄럼틀 하늘", "Slide Haneul", 1, ["comic","flyer","comic","wrap"], 1.00, 1],
    ["개구쟁이 태풍", "Rascal Taepung", 1, ["snack","milk","comic","snack"], 0.93, 0],
    ["정글짐 소희", "Jungle-Gym Sohee", 1, ["hanji","wrap","hanji","comic","hanji"], 1.00, 2],
    ["그네 대장", "The Swing Boss", 1, ["kraft","snack","book","kraft","snack","kraft"], 0.70, 3],
    ["반장 서윤", "Class Leader Seoyun", 2, ["book","drill","book","test"], 1.00, 2],
    ["축구부 민재", "Soccer Minjae", 2, ["gloss","kraft","gloss","comic"], 0.96, 0],
    ["줄넘기 다은", "Jump-Rope Daeun", 2, ["wall","hanji","wall","book","wall"], 1.00, 1],
    ["피구왕 통키", "Dodgeball Tongki", 2, ["bigcal","snack","kraft","bigcal","gloss"], 0.75, 3],
    ["전학생 레오", "New Kid Leo", 2, ["crayon","gloss","crayon","drill","crayon"], 0.87, 2],
    ["6학년 형", "The Sixth-Grade Boss", 2, ["board","bigcal","crayon","board","kraft","bigcal"], 0.67, 3],
    ["뽑기왕 지호", "Prize King Jiho", 3, ["sticker","adnews","sticker","crayon","adnews"], 0.91, 0],
    ["오락실 형", "Arcade Hyung", 3, ["starw","board","tartan","starw","sticker"], 0.82, 3],
    ["구슬왕 보람", "Marble King Boram", 3, ["tartan","canvas","starw","tartan","board"], 0.78, 1],
    ["딱지 수집가", "The Collector", 3, ["canvas","silver","board","canvas","starw"], 0.71, 2],
    ["중학생 형", "Middle-School Hyung", 3, ["goldf","canvas","silver","board","tartan","goldf"], 0.60, 3],
    ["문방구 아들", "The Shopkeeper Son", 3, ["silver","goldf","canvas","board","tartan","canvas","king"], 0.53, 3]
  ];
  var OPP = O.map(function (r, i) {
    return { i: i, ko: r[0], en: r[1], place: r[2], deck: r[3], skill: r[4], talk: r[5], boss: i % 6 === 5 };
  });

  // 말버릇: [칠 때, 내가 못 넘겼을 때, 넘겨졌을 때]
  var TALK = [
    { ko: [["에잇!", "간다~"], ["헤헤 안 넘어가지롱", "바보~"], ["아 내 딱지!", "치사해!"]],
      en: [["Hiyah!", "Here I go~"], ["Hehe, nope!", "Silly~"], ["My ddakji!", "No fair!"]] },
    { ko: [["나도 한다!", "얍!"], ["메롱~", "그것도 못 해?"], ["엄마한테 이를 거야!", "흐엥"]],
      en: [["My turn!", "Yap!"], ["Bleh~", "Can't even do that?"], ["I'm telling Mom!", "Waah"]] },
    { ko: [["각도 계산 끝", "정확히 여기"], ["역학적으로 불가능", "힘이 모자라"], ["계산이 틀렸다", "오차 범위 밖"]],
      en: [["Angle computed", "Right here"], ["Physically impossible", "Not enough force"], ["Bad math", "Out of range"]] },
    { ko: [["각오해라", "이게 진짜 딱지다"], ["꼬맹이 주제에", "어림없지"], ["제법인데?", "이럴 리가"]],
      en: [["Get ready", "This is real ddakji"], ["Nice try, kid", "Not a chance"], ["Not bad...", "No way!"]] }
  ];

  window.DDK = { TYPES: TYPES, BYID: BYID, PLACES: PLACES, OPP: OPP, TALK: TALK };
})();
