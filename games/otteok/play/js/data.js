// 표: 떡·장·도착지·리뷰·상점.
(function () {
  const D = (window.DATA = {});

  // 떡: 만드는 동작(make)과 색, 한 개 값
  D.DDEOK = {
    injeolmi: { ko: '인절미', en: 'Injeolmi', make: 'pound', price: 1500, color: '#e9c46a', ch: 1 },
    songpyeon: { ko: '송편', en: 'Songpyeon', make: 'pinch', price: 1300, color: '#ffc1d4', cols: ['#fffaf2', '#ffc6d8', '#bfe6a6', '#ffe7a0'], ch: 1 },
    mujigae: { ko: '무지개떡', en: 'Rainbow Cake', make: 'layer', price: 1800, color: '#ffd59e', cols: ['#ffb3c7', '#ffd39a', '#fff2a1', '#bfe8b0', '#bcd6ff'], ch: 1 },
    kkuldduk: { ko: '꿀떡', en: 'Honey Ddeok', make: 'fill', price: 1400, color: '#7fcf8a', cols: ['#ffc6d8', '#b9e3a3', '#fffaf2'], ch: 2 },
    jeolpyeon: { ko: '절편', en: 'Jeolpyeon', make: 'stamp', price: 1600, color: '#a97bff', cols: ['#cdb4ff', '#b897ff'], ch: 3 },
    garaetteok: { ko: '가래떡', en: 'Garaetteok', make: 'extrude', price: 1200, color: '#c9b8ff', dough: '#f3f1ea', ch: 2 },
    baekseolgi: { ko: '백설기', en: 'Baekseolgi', make: 'sift', price: 1700, color: '#f7f3e8', ch: 3 },
    ddalgi: { ko: '딸기찹쌀떡', en: 'Strawberry Mochi', make: 'berry', price: 2500, color: '#ff6f7a', ch: 3 },
  };

  // 처음 나올 때 안내 한 줄
  D.TIP = {
    injeolmi: ['초록 고리가 겹칠 때 클릭! 그다음 썰 자리 클릭, 콩고물 쟁반 클릭', 'Click when the green ring meets! Then click to cut, click the powder tray'],
    songpyeon: ['반죽을 꾹 누르고 있다가 초록 칸에서 떼기', 'Hold the dough, let go on green'],
    mujigae: ['오가는 층이 가운데 올 때 클릭', 'Click when the sliding layer is centered'],
    kkuldduk: ['반죽 컵이 꿀 통 아래 올 때 클릭', 'Click when a cup is under the honey jar'],
    jeolpyeon: ['떡 칸이 떡살 아래 올 때 클릭', 'Click when a square is under the stamp'],
    garaetteok: ['떡이 분홍 줄에 닿을 때 클릭', 'Click when the rice cake reaches the pink line'],
    baekseolgi: ['꾹 누르고 있다가 막대가 초록 칸에 오면 떼기', 'Hold, let go when the bar hits green'],
    ddalgi: ['딸기가 가운데 올 때 클릭, 그다음 꾹 눌러 초록에서 떼기', 'Click when the berry is centered, then hold and let go on green'],
  };

  // 보자기 색
  D.WRAP = [
    { k: 'pink', ko: '분홍', en: 'Pink', c: '#ffbcd3', d: '#f08aae' },
    { k: 'sky', ko: '하늘', en: 'Sky', c: '#bfe0ff', d: '#86bdf0' },
    { k: 'lemon', ko: '노랑', en: 'Lemon', c: '#ffeaa8', d: '#efc664' },
    { k: 'mint', ko: '연두', en: 'Mint', c: '#cdeebc', d: '#95cf80' },
    { k: 'lilac', ko: '보라', en: 'Lilac', c: '#ddcdff', d: '#b29cf0' },
  ];

  // 도착지: 아이스팩 개수(멀수록 많이). 해외는 비행기로
  D.DEST = [
    { ko: '서울', en: 'Seoul', ice: 1 },
    { ko: '대전', en: 'Daejeon', ice: 1 },
    { ko: '대구', en: 'Daegu', ice: 2 },
    { ko: '부산', en: 'Busan', ice: 2 },
    { ko: '광주', en: 'Gwangju', ice: 2 },
    { ko: '제주', en: 'Jeju', ice: 3 },
  ];
  D.DEST_WORLD = [
    { ko: '도쿄', en: 'Tokyo', ice: 3, air: 1 },
    { ko: '상하이', en: 'Shanghai', ice: 3, air: 1 },
    { ko: '방콕', en: 'Bangkok', ice: 4, air: 1 },
    { ko: '파리', en: 'Paris', ice: 4, air: 1 },
    { ko: 'LA', en: 'Los Angeles', ice: 4, air: 1 },
    { ko: '두바이', en: 'Dubai', ice: 5, air: 1 },
    { ko: '뉴욕', en: 'New York', ice: 5, air: 1 },
  ];

  // 장: 하루 주문 수(적힌 날을 넘기면 마지막 날과 같게), 새 떡, 간판, 가맹점 수, cost = 그 장으로 가려고 상점에서 사는 값(보통 솜씨로 앞 장에서 버는 돈의 약 75%)
  D.CH = [
    { n: 1, ko: '골목 떡집', en: 'Alley Shop', orders: [2, 3, 3], add: ['injeolmi', 'songpyeon', 'mujigae'], sign: '오떡', shops: 1, big: { ko: '돌잔치 답례떡', en: 'Birthday Party Gifts', n: 3 } },
    { n: 2, cost: 75000, ko: '오떡닷컴 오픈', en: 'otteok.com Opens', orders: [3, 3, 4], add: ['kkuldduk', 'garaetteok'], sign: '오떡닷컴', shops: 1, big: { ko: '주문 폭주의 밤', en: 'Order Rush Night', n: 3 } },
    { n: 3, cost: 140000, ko: '가맹 1호점', en: 'First Franchise', orders: [3, 4, 4], add: ['jeolpyeon', 'baekseolgi', 'ddalgi'], sign: '오떡닷컴', shops: 12, big: { ko: '1호점 개업식 떡', en: 'Grand Opening Ddeok', n: 4 } },
    { n: 4, cost: 270000, ko: '주식회사 오떡', en: 'Otteok Inc.', orders: [4, 4, 4], add: [], sign: '(주)오떡', shops: 48, big: { ko: '대기업 명절 선물', en: 'Holiday Gifts for a Giant', n: 4 } },
    { n: 5, cost: 1500000, ko: '전국 100호점', en: '100 Stores', orders: [4, 4, 5], add: [], sign: '(주)오떡', shops: 120, big: { ko: '100호점 생방송', en: 'Live on TV', n: 4 } },
    { n: 6, cost: 15000000, ko: '해외 진출', en: 'Going Global', orders: [4, 5, 5], add: [], sign: 'OTTEOK', shops: 3000, world: true, big: { ko: '해외 시상식 뒤풀이', en: 'Award Show Afterparty', n: 5 } },
    { n: 7, cost: 100000000, ipo: 1e12, ko: '나스닥 상장', en: 'NASDAQ IPO', orders: [5, 5], add: [], sign: 'OTTEOK', shops: 3140, world: true, big: { ko: '상장일 아침 떡', en: 'IPO Morning Ddeok', n: 5 }, last: true },
  ];
  // 그 장까지 나온 떡
  D.typesUpTo = function (ch) { const t = []; D.CH.slice(0, ch).forEach((c) => t.push.apply(t, c.add)); return t; };

  // 리뷰(별점별). 사진 리뷰 한 줄
  D.REVIEW = {
    5: [
      ['떡이 너무 예뻐서 못 먹고 냉동실에 3년째 있습니다', 'Too pretty to eat. It has lived in my freezer for 3 years.'],
      ['포장 뜯다가 할머니가 우셨어요', 'Grandma cried while unwrapping it.'],
      ['이 떡 먹고 소개팅 성공함 감사합니다', 'Ate this before my blind date. We are dating now. Thank you.'],
      ['택배 상자까지 액자에 걸었습니다', 'I framed the shipping box.'],
      ['우리 집 강아지가 상자 앞에서 절을 했어요', 'My dog bowed to the box.'],
      ['인생 떡. 다음 생에도 시킬게요', 'Ddeok of my life. Will order again in my next life.'],
      ['아이스팩까지 맛있어 보였어요', 'Even the ice packs looked delicious.'],
      ['보자기 매듭이 예술이라 풀 수가 없음', 'The knot is art. I cannot untie it.'],
      ["내돈내산입니다. 쫀득함이 미쳤어요. 재구매 의사 1000%", "Bought with my own money. The chewiness is unreal. 1000% buying again."],
      ["한줄요약: 사장님이 미쳤어요(좋은 뜻)", "TL;DR: the owner is out of their mind (in a good way)."],
      ["냉동실에 쟁여 뒀는데 하루 만에 다 털림", "Stocked my freezer. Gone in one day."],
      ["상온 15분 해동했더니 방금 찐 떡이 됐어요", "15 minutes at room temp and it tasted freshly steamed."],
      ["개별 포장이라 회사에 돌렸더니 팀장님이 사장님 번호 물어봄", "Individually wrapped, so I shared at work. My boss asked for your number."],
      ["아이스팩이 꽁꽁. 떡도 꽁꽁. 제 마음은 녹음", "Ice packs frozen solid. Ddeok too. My heart melted."],
      ["별 다섯 개가 최대라서 다섯 개 줍니다", "Five stars is the max, so five stars."],
      ["언박싱 영상 찍다가 너무 예뻐서 조회수 터짐", "Filmed my unboxing. Too pretty. It went viral."],
      ["시어머니가 직접 만든 줄 아세요. 비밀로 해 주세요", "My mother-in-law thinks I made it. Please keep it secret."],
      ["떡 싫어하는 남편이 몰래 두 개 먹다 걸림", "My husband who hates ddeok got caught sneaking two."],
      ["배송 빨라요. 떡이 저보다 먼저 집에 와 있었어요", "Fast delivery. The ddeok got home before I did."],
      ["재구매 7번째입니다. 이제 기사님이랑 친구예요", "Seventh reorder. The courier and I are friends now."],
    ],
    4: [
      ['맛있어요 근데 너무 빨리 먹어서 사진을 못 찍음', 'Tasty, but I ate it before taking a photo.'],
      ['떡은 완벽. 저만 살이 쪘어요', 'Ddeok was perfect. I gained weight.'],
      ['엄마가 어디서 샀냐고 세 번 물어봄', 'Mom asked where I got it three times.'],
      ['상자 열자마자 가족이 몰려왔습니다', 'The whole family rushed in when I opened it.'],
      ["맛있어요. 근데 양이 적은 게 아니라 제가 많이 먹은 듯", "Tasty. The portion was fine, I just ate a lot."],
      ["쫀득쫀득 좋아요. 겉이 살짝 두꺼운 건 취향 차이", "Nice and chewy. Slightly thick skin, but that is personal."],
      ["포장 너무 꼼꼼해서 뜯는 데 5분 걸림. 별 하나는 그 5분", "Packed so well it took 5 minutes to open. One star off for those 5 minutes."],
      ["맛은 5점, 제 다이어트는 0점", "Taste 5 out of 5. My diet 0 out of 5."],
      ["세일할 때 또 쟁이러 올게요", "Coming back to stock up at the next sale."],
      ["아이 간식으로 샀다가 제가 다 먹었어요", "Bought it as a snack for my kid. I ate it all."],
      ["리뷰 이벤트 때문에 쓰는 거 아니고 진짜 맛있음", "Not writing this for a review event. It is just really good."],
      ["상자 열자 고소한 냄새. 옆집에서 벨 누름", "Opened the box and the smell hit. The neighbor rang the bell."],
    ],
    3: [
      ['맛은 좋은데 떡이 상자 안에서 춤을 췄어요', 'Tasty, but the ddeok danced inside the box.'],
      ['떡 모양이 조금 수줍어 보였어요', 'The ddeok looked a little shy.'],
      ['무난합니다. 근데 또 시킬 듯', 'It was fine. I will probably order again though.'],
      ["맛있는데 해동을 기다리기가 너무 힘들어요", "Tasty, but waiting for it to thaw is torture."],
      ["떡은 쫀득한데 고물이 상자에 다 묻어 있었어요", "Chewy ddeok, but the powder was all over the box."],
      ["배송 중에 살짝 녹아 왔지만 냉동실 넣으니 괜찮아요", "Slightly thawed on arrival, fine after the freezer."],
      ["사진이랑 조금 달라요. 사진이 너무 잘 나온 듯", "A bit different from the photo. The photo was just very good."],
      ["맛은 평범. 포장은 비범", "Taste: normal. Packaging: extraordinary."],
      ["칸막이가 있었으면 떡끼리 덜 싸웠을 것 같아요", "With dividers, the ddeok would fight less."],
      ["이 가격에 이 정도면 솔직히 좀 아쉽네요", "Honestly a bit disappointing for the price."],
      ["리뷰 보고 시켰는데 리뷰가 너무 후했던 듯", "Ordered because of the reviews. The reviews were too generous."],
    ],
    2: [
      ['떡이 상자 안에서 이사를 했네요', 'The ddeok moved house inside the box.'],
      ['송편인지 만두인지 토론 중입니다', 'We are debating if this is songpyeon or dumplings.'],
      ['포장이 자유분방해요', 'The packaging is very free-spirited.'],
      ["떡끼리 붙어서 한 덩어리로 왔어요. 우정은 인정", "The ddeok arrived fused into one lump. Respect the friendship."],
      ["주문은 인절미였는데 상자 속 사연이 길었습니다", "I ordered injeolmi. The box had a long story to tell."],
      ["보자기가 반쯤 풀려서 왔어요. 떡이 탈출 준비 중", "The wrap arrived half untied. The ddeok was planning an escape."],
      ["고물이 상자 바닥에 해변을 만들었어요", "The powder made a beach at the bottom of the box."],
      ["맛은 괜찮은데 모양이 추상화입니다", "Tastes okay, but the shape is abstract art."],
      ["돈 아까워요. 다음엔 그냥 시장 갈게요", "Waste of money. I will just go to the market next time."],
      ["사장님 포장 처음 해 보세요?", "Owner, is this your first time packing anything?"],
      ["사진 사기입니다. 사진만 맛있어요", "The photos lie. Only the photos look tasty."],
      ["이게 오만 원어치라고요? 웃고 갑니다", "This is worth fifty thousand won? Laughing on my way out."],
      ["리뷰 다 알바 아니에요? 저만 속은 듯", "Are all the reviews paid? Guess I am the only one fooled."],
    ],
    1: [
      ['떡이 상자 안에서 탈출했습니다', 'The ddeok escaped from the box.'],
      ['아이스팩이 녹아서 떡이 사우나 다녀옴', 'Ice packs melted. The ddeok went to a sauna.'],
      ['택배 기사님이 떡을 위로했대요', 'The courier said he comforted the ddeok.'],
      ["떡이 아니라 떡이었던 무언가가 왔습니다", "What arrived was something that used to be ddeok."],
      ["상자를 열었더니 떡이 저를 보고 울고 있었어요", "I opened the box and the ddeok was crying at me."],
      ["별 0개는 안 돼서 1개 줍니다", "Zero stars was not an option."],
      ["떡 위치 추적이 필요합니다. 반은 어디 갔죠", "I need ddeok tracking. Where did half of it go?"],
      ["포장이 너무 자유로워서 떡이 퇴사했어요", "The packing was so free the ddeok quit."],
      ["별 하나도 아까움. 환불해 주세요", "Not even worth one star. Refund please."],
      ["다시는 안 시킵니다. 주변에도 말리는 중", "Never ordering again. Warning everyone I know."],
      ["이게 떡이면 저는 떡집 사장입니다", "If this is ddeok, I am a ddeok shop owner."],
      ["사장님 손으로 싼 거 맞아요? 발로 싼 줄", "Did you pack this by hand? Looks like by foot."],
      ["상자 열자마자 화가 났습니다. 먹고 나니 더 났어요", "I got angry opening the box. Angrier after eating."],
      ["이런 걸 팔면서 잠이 오세요?", "How do you sleep at night selling this?"],
      ["고객센터 전화했더니 떡이 받는 줄 알았어요. 대답이 없음", "Called customer service. Felt like the ddeok answered. Silence."],
      ["포장 풀어보고 냄새나서 버렸다", "Opened the wrap, it smelled, threw it out."],
      ["우리집 강아지한테 주니까 잘먹네요", "Gave it to my dog. He loved it."],
      ["별한개도 아깝다", "Not even worth one star."],
    ],
  };
  // 아이스팩 모자랄 때 고정 리뷰
  D.REVIEW_WARM = ['아이스팩이 녹아서 떡이 사우나 다녀옴', 'Ice packs melted. The ddeok went to a sauna.'];

  // ---------- 회사 키우기(4장부터) ----------
  // 공장 라인: 떡마다 하나. k 번째로 사는 라인 값 = base × grow^k, 1초 수입 = rate × rgrow^k
  D.FAC = { base: 1000000, grow: 1, rate: 1600, rgrow: 1, valMade: 1000, peAt: 5e11, peAdd: 7e11, valStore: 1e8, daySec: 400 };
  // 공장 설비: 공장 수입 전체에 곱한다
  D.FUP = [
    { k: 'robot', ch: 4, ko: '포장 로봇', en: 'Wrapping Robots', d: ['공장 수입 1.5배', 'Factory income x1.5'], mul: 1.5, price: 1500000 },
    { k: 'fast', ch: 5, ko: '고속 컨베이어', en: 'High-speed Belts', d: ['공장 수입 2배', 'Factory income x2'], mul: 2, price: 9000000 },
    { k: 'humanoid', ch: 4, ko: '휴머노이드', en: 'Humanoid Robot', d: ['고장 난 기계를 알아서 고침', 'Repairs broken machines by itself'], mul: 1, price: 30000000 },
    { k: 'hub', ch: 6, ko: '무인 물류센터', en: 'Robot Logistics Hub', d: ['공장 수입 2배', 'Factory income x2'], mul: 2, price: 80000000 },
    { k: 'ai', ch: 6, ko: 'AI 품질 검사', en: 'AI Quality Check', d: ['공장 수입 1.5배', 'Factory income x1.5'], mul: 1.5, price: 300000000 },
  ];
  // 가맹 도시: 5장 국내, 6장 해외. roy = 하루 로열티(국내 값의 약 1/3, 해외 1/2), stores = 그 도시 가맹점 수
  // 기업가치 = 공장이 지금까지 생산해 번 돈 × valMade + 낸 가맹점 수 × valStore. 켜 두고 돌릴수록 오른다. 값은 시뮬레이션으로 맞춤(주문 하나 40~60초 기준, 장마다 하루 더 영업 0~2일, 다 해서 29~32일). 10/30 자동 한 판에서 공장 1초 수입이 모자라 5장에서 10일 더 영업 → rate 800→1600, 6장 값 4천만→1,500만(두 번째 판 5장 5일 더 영업이라 한 번 더 내림)
  D.CITY = [
    { k: 'seoul', ch: 5, ko: '서울', en: 'Seoul', lon: 127.0, lat: 37.6, price: 3000000, roy: 1100000, stores: 22 },
    { k: 'busan', ch: 5, ko: '부산', en: 'Busan', lon: 129.1, lat: 35.2, price: 2400000, roy: 850000, stores: 12 },
    { k: 'incheon', ch: 5, ko: '인천', en: 'Incheon', lon: 126.7, lat: 37.5, price: 2000000, roy: 700000, stores: 9 },
    { k: 'daegu', ch: 5, ko: '대구', en: 'Daegu', lon: 128.6, lat: 35.9, price: 1800000, roy: 620000, stores: 9 },
    { k: 'daejeon', ch: 5, ko: '대전', en: 'Daejeon', lon: 127.4, lat: 36.4, price: 1500000, roy: 520000, stores: 7 },
    { k: 'gwangju', ch: 5, ko: '광주', en: 'Gwangju', lon: 126.9, lat: 35.2, price: 1500000, roy: 520000, stores: 7 },
    { k: 'jeju', ch: 5, ko: '제주', en: 'Jeju', lon: 126.5, lat: 33.5, price: 1200000, roy: 430000, stores: 6 },
    { k: 'tokyo', ch: 6, ko: '도쿄', en: 'Tokyo', lon: 139.7, lat: 35.7, price: 30000000, roy: 15000000, stores: 260 },
    { k: 'osaka', ch: 6, ko: '오사카', en: 'Osaka', lon: 135.5, lat: 34.7, price: 20000000, roy: 10000000, stores: 140 },
    { k: 'shanghai', ch: 6, ko: '상하이', en: 'Shanghai', lon: 121.5, lat: 31.2, price: 40000000, roy: 20000000, stores: 300 },
    { k: 'hongkong', ch: 6, ko: '홍콩', en: 'Hong Kong', lon: 114.2, lat: 22.3, price: 30000000, roy: 15000000, stores: 120 },
    { k: 'bangkok', ch: 6, ko: '방콕', en: 'Bangkok', lon: 100.5, lat: 13.8, price: 25000000, roy: 12500000, stores: 150 },
    { k: 'singapore', ch: 6, ko: '싱가포르', en: 'Singapore', lon: 103.8, lat: 1.35, price: 45000000, roy: 22500000, stores: 90 },
    { k: 'sydney', ch: 6, ko: '시드니', en: 'Sydney', lon: 151.2, lat: -33.9, price: 60000000, roy: 30000000, stores: 130 },
    { k: 'dubai', ch: 6, ko: '두바이', en: 'Dubai', lon: 55.3, lat: 25.2, price: 80000000, roy: 40000000, stores: 110 },
    { k: 'paris', ch: 6, ko: '파리', en: 'Paris', lon: 2.35, lat: 48.9, price: 120000000, roy: 60000000, stores: 240 },
    { k: 'london', ch: 6, ko: '런던', en: 'London', lon: -0.13, lat: 51.5, price: 140000000, roy: 70000000, stores: 260 },
    { k: 'saopaulo', ch: 6, ko: '상파울루', en: 'São Paulo', lon: -46.6, lat: -23.5, price: 70000000, roy: 35000000, stores: 180 },
    { k: 'toronto', ch: 6, ko: '토론토', en: 'Toronto', lon: -79.4, lat: 43.7, price: 90000000, roy: 45000000, stores: 150 },
    { k: 'la', ch: 6, ko: 'LA', en: 'Los Angeles', lon: -118.2, lat: 34.1, price: 180000000, roy: 90000000, stores: 330 },
    { k: 'newyork', ch: 6, ko: '뉴욕', en: 'New York', lon: -74.0, lat: 40.7, price: 250000000, roy: 125000000, stores: 420 },
  ];

  // 상점(ch: 그 장부터 보임)
  D.SHOP = [
    { k: 'mallet', ch: 1, ko: '큰 떡메', en: 'Big Mallet', d: ['메치기 PERFECT 칸이 넓어짐', 'Wider PERFECT zone'], price: 18000 },
    { k: 'knife', ch: 1, ko: '반듯 칼', en: 'Straight Knife', d: ['썰 자리에 점선', 'Cut guide lines'], price: 14000 },
    { k: 'sieve', ch: 1, ko: '고운 체', en: 'Fine Sieve', d: ['고물이 두 배로 묻음', 'Coats twice as fast'], price: 12000 },
    { k: 'icebox', ch: 1, ko: '아이스박스', en: 'Ice Box', d: ['아이스팩이 두 개씩', 'Ice packs come in twos'], price: 16000 },
    { k: 'tape', ch: 1, ko: '테이프 커터', en: 'Tape Cutter', d: ['테이프가 쭉 한 번에', 'Tape in one go'], price: 15000 },
    { k: 'clock', ch: 1, ko: '벽시계 건전지', en: 'Clock Battery', d: ['막차까지 시간이 늘어남', 'More time before the last truck'], price: 20000 },
    { k: 'nozzle', ch: 2, ko: '넓은 꿀 노즐', en: 'Wide Nozzle', d: ['꿀 맞는 칸이 넓어짐', 'Honey hits more easily'], price: 30000 },
    { k: 'press', ch: 3, ko: '떡살 손잡이', en: 'Stamp Grip', d: ['찍기 PERFECT 칸이 넓어짐', 'Wider stamp PERFECT'], price: 45000 },
    { k: 'ruler', ch: 2, ko: '눈금 막대', en: 'Ruler', d: ['가래떡 PERFECT 칸이 넓어짐', 'Wider cut PERFECT'], price: 30000 },
    { k: 'scale', ch: 3, ko: '쌀가루 저울', en: 'Flour Scale', d: ['체치기 초록 칸이 넓어짐', 'Wider sift zone'], price: 45000 },
    { k: 'ribbon', ch: 2, ko: '금빛 리본', en: 'Gold Ribbon', d: ['별 다섯 개 팁이 두 배', 'Double tips on 5 stars'], price: 50000 },
  ];
})();
