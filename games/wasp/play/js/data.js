// 벌 종류 · 출동 20회 · 신고자 선물 표.
(function () {
  const D = (window.DATA = {});
  // col 배 색(줄무늬 그림에 곱함), tho 가슴, head 머리, size 크기, hp 스프레이 견딤(초), spd 속도, rage 화내는 거리(m), dmg 쏘는 힘, nest 집 모양
  D.SP = {
    ssang: { ko: '쌍살벌', en: 'Paper Wasp', col: '#f2c230', tho: '#3a2a16', head: '#e0a624', size: 1.25, hp: 0.15, spd: 2.0, rage: 2.2, dmg: 4, nest: 'comb' },
    teolbo: { ko: '털보말벌', en: 'Hairy Hornet', col: '#ffcf2a', tho: '#4a3218', head: '#f2b420', size: 1.45, hp: 0.24, spd: 2.6, rage: 3.2, dmg: 5, nest: 'ball' },
    deung: { ko: '등검은말벌', en: 'Yellow-legged Hornet', col: '#9a6a2a', tho: '#1e150c', head: '#e8a62a', size: 1.45, hp: 0.3, spd: 3.0, rage: 4.0, dmg: 6, nest: 'ball' },
    jom: { ko: '좀말벌', en: 'Lesser Hornet', col: '#ffd84a', tho: '#5a3a1a', head: '#e8b02a', size: 1.3, hp: 0.22, spd: 2.8, rage: 3.0, dmg: 4, nest: 'ball' },
    ttang: { ko: '땅벌', en: 'Ground Wasp', col: '#f6e64a', tho: '#1a140c', head: '#2a2014', size: 1.1, hp: 0.13, spd: 3.2, rage: 3.5, dmg: 4, nest: 'ground' },
    jangsu: { ko: '장수말벌', en: 'Giant Hornet', col: '#ffb81c', tho: '#3a2410', head: '#ff9a10', size: 2.0, hp: 0.55, spd: 3.3, rage: 5.0, dmg: 8, nest: 'ground' },
    honey: { ko: '꿀벌', en: 'Honeybee', col: '#d8962a', tho: '#5a3a1a', head: '#4a3218', size: 1.05, hp: 0.1, spd: 1.6, rage: 0, dmg: 2, nest: 'swarm' },
    queen: { ko: '장수말벌 여왕', en: 'Giant Hornet Queen', col: '#ffb01a', tho: '#3a2410', head: '#ff8a0a', size: 3.0, hp: 3.5, spd: 2.4, rage: 9, dmg: 14, nest: 'queen' },
  };
  // 출동: loc 장소, who 신고자, nests[{sp, spot, n 벌 수, size, hidden}], pay 보수, say 신고 한 줄
  const N = (sp, spot, n, size, hidden) => ({ sp, spot, n, size: size || 1, hidden: !!hidden });
  D.MS = [
    { m: 6, loc: 'farm', pay: 120, nests: [N('ssang', 'eave1', 6, 0.9)], ko: '처마 밑에 벌집이 달렸어요. 손주들 온다는데 무서워서…', en: 'There is a nest under my eaves. My grandkids are coming…' },
    { m: 6, loc: 'apt', pay: 140, nests: [N('ssang', 'ac', 6, 0.9), N('ssang', 'rail', 6, 0.9)], ko: '1층 화단 실외기 뒤에 벌이 왔다 갔다 해요.', en: 'Wasps keep flying behind the AC unit by the flowerbed.' },
    { m: 6, loc: 'school', pay: 160, nests: [N('teolbo', 'shedEave', 10, 0.8)], ko: '체육 창고 처마에 공 같은 게 생겼어요. 애들이 공 차다 맞을까 봐요.', en: 'A ball-shaped thing hangs on the gym shed. The kids play right there.' },
    { m: 6, loc: 'farm', pay: 150, who: 'beekeeper', nests: [N('honey', 'tree', 0, 1)], ko: '우리 꿀벌이 분봉해서 감나무에 붙었어요. 죽이지 말고 벌통에 좀 담아 줘요!', en: 'My honeybees swarmed onto the persimmon tree. Please box them, do not kill them!' },
    { m: 7, loc: 'grave', pay: 190, nests: [N('ttang', 'mound', 12, 1, true)], ko: '벌초하다가 땅에서 벌이 올라와서 쏘였어요. 어디서 나오는지 모르겠어요.', en: 'Wasps came out of the ground while we trimmed the grass. We do not know where.' },
    { m: 7, loc: 'apt', pay: 210, nests: [N('deung', 'tree', 12, 1), N('ssang', 'ac', 7, 1)], ko: '놀이터 나무에 큰 벌집이 있어요. 등에 검은 무늬가 있는 벌이에요.', en: 'A big nest in the playground tree. The wasps have dark backs.' },
    { m: 7, loc: 'church', pay: 230, nests: [N('teolbo', 'bell', 12, 1), N('ssang', 'door', 7, 1)], ko: '종탑에 벌집이 생겨서 종을 못 치고 있습니다.', en: 'A nest in the bell tower. We cannot ring the bell.' },
    { m: 7, loc: 'farm', pay: 240, nests: [N('deung', 'eaveIn', 14, 1, true)], ko: '벌이 자꾸 지붕 쪽으로 들어가요. 집은 안 보이는데…', en: 'Wasps keep going into the roof, but I cannot see a nest.' },
    { m: 8, loc: 'school', pay: 270, nests: [N('deung', 'shedEave', 14, 1.1), N('deung', 'tree', 12, 1), N('ssang', 'gate', 8, 1)], ko: '방학 끝나기 전에 꼭 좀 부탁드려요. 벌집이 세 개예요.', en: 'Please, before school starts. There are three nests.' },
    { m: 8, loc: 'grave', pay: 290, nests: [N('ttang', 'mound', 14, 1.1, true), N('ttang', 'pine', 12, 1, true)], ko: '추석 전에 성묘를 해야 하는데 땅벌이 또 나왔어요.', en: 'We must visit before Chuseok, but ground wasps are back.' },
    { m: 8, loc: 'apt', pay: 300, who: 'beekeeper', nests: [N('honey', 'tree', 0, 1), N('deung', 'ac', 14, 1)], ko: '꿀벌 분봉이 놀이터에 붙었는데 옆에 말벌집도 있대요. 꿀벌은 살려 주세요!', en: 'A honeybee swarm in the playground, and a hornet nest nearby. Save the bees!' },
    { m: 8, loc: 'church', pay: 330, nests: [N('jangsu', 'hollow', 14, 1, true), N('teolbo', 'bell', 10, 1)], ko: '엄지손가락만 한 벌이 날아다닙니다. 어디서 오는지 모르겠어요.', en: 'Wasps as big as a thumb. We do not know where they come from.' },
    { m: 9, loc: 'farm', pay: 360, nests: [N('jangsu', 'jar', 16, 1.1, true), N('deung', 'tree', 14, 1.2)], ko: '장독대 쪽만 가면 큰 벌이 덤벼요.', en: 'Big wasps attack whenever I go near the jars.' },
    { m: 9, loc: 'school', pay: 380, nests: [N('deung', 'shedEave', 18, 1.4), N('deung', 'roofIn', 16, 1.2, true), N('ssang', 'gate', 8, 1)], ko: '운동회 날인데 벌이 너무 많아요.', en: 'It is sports day and there are too many wasps.' },
    { m: 9, loc: 'grave', pay: 400, nests: [N('jangsu', 'pine', 18, 1.2, true), N('ttang', 'mound', 14, 1.1, true)], ko: '벌초객이 쏘여서 병원에 갔어요. 큰 놈들이에요.', en: 'Someone got stung and went to the hospital. Big ones.' },
    { m: 9, loc: 'church', pay: 420, nests: [N('deung', 'bell', 20, 1.6), N('ssang', 'door', 8, 1), N('ssang', 'win', 8, 1)], ko: '종탑 벌집이 수박만 해졌습니다.', en: 'The bell tower nest is as big as a watermelon.' },
    { m: 10, loc: 'apt', pay: 450, nests: [N('jangsu', 'bed', 18, 1.2, true), N('deung', 'tree', 16, 1.3), N('deung', 'rail', 14, 1.1)], ko: '화단에서 장수말벌이 나와요. 아이들 등굣길이에요.', en: 'Giant hornets in the flowerbed, right on the school path.' },
    { m: 10, loc: 'farm', pay: 480, nests: [N('deung', 'eave0', 16, 1.3), N('deung', 'eaveIn', 16, 1.2, true), N('jangsu', 'jar', 18, 1.2, true)], ko: '가을이 되니까 벌이 더 사나워졌어요.', en: 'They got angrier now that it is autumn.' },
    { m: 10, loc: 'school', pay: 520, nests: [N('jangsu', 'hollow', 20, 1.3, true), N('jangsu', 'roofIn', 20, 1.3, true)], ko: '장수말벌이 창문으로 들어와요. 수업을 못 합니다.', en: 'Giant hornets fly in through the windows.' },
    { m: 10, loc: 'oldschool', pay: 900, nests: [N('queen', 'ceiling', 24, 2.2, true), N('jangsu', 'ceil2', 12, 1.2, true)], ko: '산 밑 폐교 천장에서 붕붕 소리가 나요. 동네 사람들이 다 무서워합니다.', en: 'A deep buzzing from the ceiling of the old school. The whole village is scared.' },
  ];
  D.WHO = { farm: 'granny', apt: 'guard', school: 'teacher', grave: 'mourner', church: 'pastor', oldschool: 'keeper' };
  D.LOC = { farm: ['시골집', 'Farmhouse'], apt: ['아파트 화단', 'Apartment'], school: ['초등학교', 'School'], grave: ['산소', 'Hillside Grave'], church: ['시골 교회', 'Country Church'], oldschool: ['폐교', 'Old School'] };
  // 선물: 출동마다 하나
  D.GIFT = [
    ['박카스', 'Energy Drink', '#c8402a'], ['식혜', 'Rice Punch', '#e8d8a8'], ['아이스크림', 'Ice Cream', '#ffb0c8'], ['꿀 한 병', 'Jar of Honey', '#f0a020'],
    ['옥수수', 'Corn', '#f6d84a'], ['요구르트', 'Yogurt Drink', '#ff8a6a'], ['떡', 'Rice Cake', '#f3e8d8'], ['감자', 'Potatoes', '#c8a070'],
    ['수박', 'Watermelon', '#3a9a3a'], ['참외', 'Korean Melon', '#ffd030'], ['꿀 두 병', 'Two Jars of Honey', '#f0a020'], ['복숭아', 'Peach', '#ffa8a0'],
    ['고구마', 'Sweet Potatoes', '#a0405a'], ['김밥', 'Gimbap', '#2a3a2a'], ['송편', 'Songpyeon', '#a8d0a0'], ['포도', 'Grapes', '#6a3a8a'],
    ['사과', 'Apples', '#e0302a'], ['홍시', 'Ripe Persimmon', '#ff6a1a'], ['밤', 'Chestnuts', '#8a5030'], ['감사패', 'Plaque of Thanks', '#d8b040'],
  ];
  // 상점: 단계마다 값
  D.SHOP = [
    { id: 'power', ko: '스프레이 세기', en: 'Spray Power', cost: [150, 300, 500, 800], max: 4 },
    { id: 'range', ko: '스프레이 사거리', en: 'Spray Range', cost: [150, 300, 500, 800], max: 4 },
    { id: 'cap', ko: '캔 용량', en: 'Can Size', cost: [100, 220, 400], max: 3 },
    { id: 'suit', ko: '방호복', en: 'Bee Suit', cost: [200, 420, 700, 1000], max: 4 },
    { id: 'net', ko: '포충망', en: 'Net', cost: [120, 260, 450], max: 3 },
    { id: 'bag', ko: '장대 봉투', en: 'Pole Bag', cost: [120, 260, 450], max: 3 },
  ];
})();
