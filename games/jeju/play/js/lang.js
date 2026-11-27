// 말 — ?lang=en 이면 영어. 한국어가 원본이고 영어를 덧씌운다 (핑거킥과 같은 방식)
//
// 쓰는 법 두 가지
//   1) 화면(HTML) 글자는 손댈 것 없다. 아래 MutationObserver 가 텍스트 마디를 그때그때 바꾼다.
//   2) 캔버스·스프라이트에 그리는 글자(지도 값표, 매물 표지)는 DOM 이 아니라서 못 잡는다 →
//      그리기 직전에 L(글) 로 감싼다.
// 사전은 '긴 말부터' 바꾸므로 '제주국제공항' 이 '제주' 보다 먼저 걸린다.
(function () {
  // 말은 **주소로만** 정한다 — ?lang=en 이면 영어, 없으면 한국어.
  // 탭에 영어를 기억시켰더니 한글 주소로 들어와도 영어가 나왔다 (사장님 2026-09-12 "한글판인데 영문판").
  // 영문판이 한국어로 떨어지던 문제는 게임이 주소를 다시 만들 때 lang 을 달고 가므로 그대로 막힌다(game.js).
  try { sessionStorage.removeItem('jeju.lang'); } catch (e) {}
  const LQ = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
  const EN = LQ === 'en', ZH = LQ === 'zh';

  const T = {
    // ── 화면 단추·표준 용어 ──
    '시작': 'START', '이어하기': 'CONTINUE', '처음부터?': 'RESTART?',
    '지도': 'MAP', '리스폰': 'RESPAWN', '브레이크': 'BRAKE', '경적': 'HORN',
    '내리기': 'EXIT', '타기': 'RIDE', '달리기': 'RUN', '점프': 'JUMP', '위로': 'UP', '아래로': 'DOWN',
    '가로 화면에서 하는 게임입니다': 'This game is played in landscape',
    '가로로 돌리기': 'Rotate to landscape',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': 'If the button does nothing, turn off rotation lock and lay the phone down',
    '그래도 세로로 하기': 'Play in portrait anyway',
    '건너뛰기': 'Skip',
    '오전 9시': '9 AM',   // 불러오는 동안 보이는 상단 시계 첫 값 (2026-09-16)
    '자산': 'ASSETS', '짓기': 'BUILD', '렌터카': 'RENTAL CARS', '전체화면': 'Fullscreen',

    // ── 조작 안내 ──
    '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동 · F 내리기<br>T 지도 · H 경적 · R 리스폰 · K 효과음 · M 음악':
      '↑↓←→ drive · Space handbrake · E action · F get out<br>T map · H horn · R respawn · K sfx · M music',
    '↑↓←→ 걷기 · Shift 달리기 · 스페이스 점프 · E 행동 · F 타기<br>T 지도 · R 리스폰':
      '↑↓←→ walk · Shift run · Space jump · E action · F get in<br>T map · R respawn',
    '↑↓←→ 헤엄 · 스페이스 위로 · Shift 아래로<br>R 돌아가기': '↑↓←→ swim · Space up · Shift down<br>R back',
    '←→ 방향 · ↑ 숙이기 · ↓ 당기기<br>R 돌아가기': '←→ steer · ↑ dive · ↓ pull up<br>R back',
    '↑↓←→ 조종 · R 돌아가기': '↑↓←→ steer · R back',
    '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동': '↑↓←→ drive · Space handbrake · E action',
    // <br> 로 갈린 텍스트 마디는 따로 걸린다 — 관찰자는 innerHTML 이 아니라 마디를 본다
    '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동 · F 내리기': '↑↓←→ drive · Space handbrake · E action · F get out',
    'T 지도 · H 경적 · R 리스폰 · K 효과음 · M 음악': 'T map · H horn · R respawn · K sfx · M music',
    '↑↓←→ 걷기 · Shift 달리기 · 스페이스 점프 · E 행동 · F 타기': '↑↓←→ walk · Shift run · Space jump · E action · F get in',
    'T 지도 · R 리스폰': 'T map · R respawn',
    '↑↓←→ 헤엄 · 스페이스 위로 · Shift 아래로': '↑↓←→ swim · Space up · Shift down',
    '←→ 방향 · ↑ 숙이기 · ↓ 당기기': '←→ steer · ↑ dive · ↓ pull up',
    '↑↓←→ 조종': '↑↓←→ steer', 'R 돌아가기': 'R back',
    'T 지도 · H 경적 · R 리스폰 · K 효과음': 'T map · H horn · R respawn · K sfx',

    // ── 땅·건물 ──
    '매매 ': 'FOR SALE ', '급매 ': 'RUSH ', '내 땅': 'MY LAND', '내 ': 'My ',
    '🏷 매입 · ': '🏷 BUY · ', '🏗 짓기 · ': '🏗 BUILD · ', '📞 급매 · ': '📞 RUSH · ', '🏢 되사기 · ': '🏢 BUY BACK · ',
    '💸 팔기': '💸 SELL', '팔기': 'SELL', '에 팔기?': '?', '되찾음': 'BOUGHT BACK', '급매': 'RUSH', '매입 ': 'BUY ',
    ' 부지': ' site', '평': ' pyeong', '평 · ': ' pyeong · ', ' · 월세 ': ' · rent ', '월세 ': 'Rent ', '월세 +': 'Rent +',
    '대박': 'JACKPOT', '이득': 'PROFIT', '손해': 'LOSS', '정산': 'SETTLED', '자리를 비운 사이 ': 'While you were away ',
    '/ 1,000억': '/ ₩100B',
    '탐라국개발': 'Tamna Development', '이 먼저 사갔습니다. 아깝네요': ' bought it first. Bad luck',

    // 지을 수 있는 건물
    '작은 농가주택': 'Small Farmhouse', '소형 카페': 'Small Café', '작은 펜션': 'Small Guest House',
    '제주 식당': 'Jeju Restaurant', '승마체험장': 'Riding Centre', '게스트하우스': 'Guest House',
    '소형 상가': 'Small Shops', '흑돼지 식당': 'Black Pork House', '애견펜션': 'Pet Pension',
    '캠핑장': 'Campsite', '글램핑장': 'Glamping Site', '대형 카페': 'Large Café',
    '원룸 건물': 'Studio Block', '3층 상가': '3-Floor Shops', '스크린골프장': 'Screen Golf',
    '피트니스센터': 'Fitness Centre', '노래방 건물': 'Karaoke Building', 'PC방 건물': 'PC Café Building',
    '병원 건물': 'Hospital', '학원 건물': 'Academy Building', '오피스텔': 'Officetel',
    '주차빌딩': 'Car Park', '물류센터': 'Logistics Centre', '대형 쇼핑몰': 'Shopping Mall',
    '워터파크': 'Water Park', '테마파크': 'Theme Park', '대형 리조트': 'Large Resort',
    '대형마트': 'Hypermarket', '특급호텔': 'Luxury Hotel', '나이트클럽': 'Nightclub', '리조트': 'Resort',
    '주택': 'House', '편의점': 'Convenience Store', '카페': 'Café', '펜션': 'Guest House', '호텔': 'Hotel',

    // ── 자산 창 ──
    '땅 ': 'Land ', '건물 ': 'Buildings ', '매입가 ': 'Paid ', '현재가 ': 'Value ', '부동산 ': 'Property ', '총자산 ': 'Net worth ', '현금 ': 'Cash ',
    '아직 산 땅이 없다': 'No land yet',
    '채<br>하루 수입 ': ' <br>Daily income ', ' · 자산 ': ' · Assets ', ' · 건물 ': ' · Buildings ', '일 뒤': 'd left',

    // ── 탈것 ──
    '소형차': 'Compact', '오픈카': 'Convertible', '전기차': 'EV', '스포츠카': 'Sports Car', '캠핑카': 'Camper',
    '촬영': 'PHOTO', '먹기': 'EAT', '탑승': 'RIDE', '출발': 'GO', '입수': 'DIVE', '이륙': 'FLY',
    '☀️ 낮': '☀️ Day',

    // ── 전화 ──
    '📞 유학 친구': '📞 Friend abroad', '👔 아버지': '👔 Father', '🏢 탐라국개발': '🏢 Tamna Development',
    '📞 복덕방': '📞 Broker', '복덕방': 'Broker', '여친': 'Girlfriend',
    // ── 명품관·가방 (2026-11-16) ──
    '오빠, 자산 10억 또 늘었지? 나 가방 하나만 사 줘. 중문 명품관!': 'Babe, your assets went up another 1B, right? Buy me a bag. Jungmun luxury store!',
    '10억 벌었으면 나한테도 뭐 있어야지. 명품관 가자. 지금.': 'You made 1B, so I get something too. Luxury store. Now.',
    '오빠 통장만 살찌우지 말고 내 어깨도 좀 채워 줘. 가방!': "Don't just fatten your bank account. Fill my shoulder too. A bag!",
    '이번에 10억 오른 거 다 봤어. 명품관 안 가면 나 진짜 삐진다?': "I saw that 1B jump. Skip the luxury store and I'm sulking for real.",
    '가방 값 정도는 오빠한테 껌이잖아. 지금 10억 벌었는데. 계산 끝났지?': "A bag is pocket change for you. You just made 1B. Do the math.",
    '우리 벌써 100억 넘게 벌었어. 이제 천만 원짜리는 좀 그렇지 않아? 2천만 원!': "We've made over 10B already. A 10M bag feels a bit cheap now, right? 20M!",
    '오빠 땅값 오르는 거 보니까 내 가방 값도 올라야 할 것 같아. 2천.': 'Your land keeps going up, so my bag should too. 20M.',
    '친구가 2천만 원짜리 들고 왔더라. 나만 천만 원짜리 들 순 없잖아.': "My friend showed up with a 20M bag. I can't be the one with the 10M one.",
    '200억 넘게 번 남자 여친이 아무 가방이나 들면 오빠 체면이 뭐가 돼. 3천만 원.': "You've made over 20B. If your girlfriend carries any old bag, what about your image? 30M.",
    '오빠, 이번 건 3천만 원이야. 놀라지 마. 오빠 이제 그 정도 사람이야.': "This one's 30M. Don't freak out. You're that kind of man now.",
    '명품관 언니가 오빠 이름 외웠대. 3천만 원짜리 빼 놨대.': 'The luxury store lady knows your name now. She set aside a 30M one.',
    '300억 넘게 벌었으면 가방도 한 단계 올라가야지. 5천만 원!': 'Over 30B made, so the bag levels up too. 50M!',
    '5천만 원이 비싸? 오빠 땅 한 번 오르면 그거 몇 배야.': 'Is 50M expensive? Your land makes several times that in one jump.',
    '나 이 가방 들고 탐라국개발 사장 부인 앞을 지나갈 거야. 5천만 원.': "I'm walking past the Tamna Development CEO's wife with this bag. 50M.",
    '500억 넘은 남자 여친이면 1억짜리는 들어야지. 명품관 가자.': "Your girlfriend should carry a 100M bag when you're past 50B. Luxury store.",
    '오빠, 이번이 마지막일지도 몰라. 1억짜리 하나만.': 'Babe, this might be the last one. Just one 100M bag.',
    '매장에 하나 남은 1억짜리, 다른 여자가 먼저 사면 나 울 거야.': "There's one 100M bag left. If another woman buys it first, I'll cry.",
    '꺄! 오빠 최고! 이거 진짜 갖고 싶었던 거야.': "Kyaa! You're the best! I really wanted this one.",
    '역시 우리 오빠. 이 가방 들고 해변 걸을래.': "That's my man. I'm walking the beach with this bag.",
    '사랑해 오빠. 다음 10억도 기대할게.': "Love you. Can't wait for the next 1B.",
    '이 색 너무 예쁘다. 오빠 센스 인정!': 'This color is so pretty. You have taste!',
    '됐어. 가방 하나 못 사 주는 남자랑은 끝이야. 나 간다.': "Forget it. I'm done with a guy who can't buy me one bag. I'm leaving.",
    '여친이 떠났다': 'Girlfriend left', '이별': 'BREAKUP', '깜짝 선물': 'SURPRISE', '선물': 'GIFT',
    '명품 가방': 'Luxury bag', '가방': 'Bag #', '번째': '', '여친 가방': 'GF bag', '가방 사 주기': 'Buy a bag', '명품관': 'Luxury Store', '명 품 관': 'LUXURY',
    '이상하다 왜 가방사달라고 안하지....': "Weird... why isn't she asking for a bag....",
    '뭐? 제주도??': 'What? Jeju??',
    '그 촌구석에서 뭐 하냐 ㅋㅋㅋㅋㅋㅋ': 'What are you doing in that backwater lol',
    '제주도에서 사업을 한다고 ㅋㅋㅋㅋ': 'Starting a business on Jeju? lol',
    '잘해봐라 ㅋㅋㅋ': 'Good luck with that lol',
    '야 너 진짜 샀냐?': 'Wait, you actually bought it?',
    '제주도 땅을?': 'Land on Jeju?',
    '사진 좀 보내봐': 'Send me a photo',
    '제주도에서 니 이름이 들리더라': 'I hear your name coming out of Jeju',
    '아직은 두고 본다': "I'm still watching",
    '이 바닥 좁습니다': 'This is a small island',
    '적당히 하시죠': "Don't push it",
    '곧 뵙겠습니다': 'We will meet soon',
    '...잘 지내냐': '...how are you',
    '제주도가 요즘 시끄럽더라. 니 이름이 계속 나와': 'Jeju is loud these days. Your name keeps coming up',
    '내가 준 100억, 열 배로 만들었다며': 'They say you turned my 10 billion into ten times that',
    '인정한다. 니가 해냈다': 'I admit it. You did it',
    '이번 추석엔 집에 와라. 아버지가 술 한잔 사마': 'Come home for Chuseok. Drinks are on me',
    '형님, 저희 제주도 갑니다': 'Sir, we are coming to Jeju',
    '방 하나만 빼주십쇼 ㅋㅋㅋ': 'Save us one room lol',
    '진짜 존경합니다': 'Real respect',
    '형님': 'Sir',

    // ── 복덕방 하르방 (급매를 놓쳤을 때) ──
    '허허, 젊은 양반. 조금 늦었구먼.': 'Ah, young man. A little late.',
    '허허허, 기다리다 목 빠지는 줄 알았네. 근디 벌써 다른 사람이 왔다 갔어.': 'I waited and waited. Someone else already came and went.',
    '아이고, 총각이 좀만 일찍 왔으면 좋았을 텐디.': 'Oh, if only you had come a little sooner.',
    '허허, 좋은 물건은 원래 주인이 빨리 나타나는 법이여.': 'Good land always finds an owner fast.',
    '왔구먼! 근디 미안허네. 방금 계약했어.': 'You made it! Sorry though, it was just signed.',
    '허허허, 뛰어왔구먼. 근디 이미 늦었어.': 'You ran all the way. Too late, though.',
    '아이고, 내가 전화하려고 했는디… 다른 양반이 먼저 돈을 내놨네.': 'I was about to call you… someone else put the money down first.',
    '허허, 이 땅이 그렇게 탐났어? 자네보다 먼저 온 사람이 있더라고.': 'Wanted this one badly? Someone got here before you.',
    '쯧쯧, 급매라고 소문이 나니까 사람들이 아주 날아다니는구먼.': 'Word gets out about a rush sale and people fly.',
    '허허허, 다음엔 조금 일찍 움직이게. 좋은 땅은 기다려주질 않아.': 'Move sooner next time. Good land does not wait.',

    // ── 여자친구 ──
    // 부수고 다닐 때 (props.js, 2026-09-17)
    '오빠!! 남의 돌담을 왜 부숴?!': 'Babe!! Why are you smashing their stone wall?!',
    '방금 그거 일부러 그런 거지?': 'You did that on purpose, right?',
    '돌담 다시 쌓으려면 하르방들 고생하신다…': 'The grandpas will have to stack that wall all over again…',
    '와… 돌이 다 날아갔어 ㅋㅋㅋ': 'Wow… the stones went flying lol',
    '이 동네에서 우리 얼굴 팔리겠다': 'This whole village is going to know our faces',
    '가로등!! 오빠 미쳤어?': 'The street lamp!! Are you crazy?',
    '가로등이 누웠어… 오늘 밤 이 길 깜깜하겠다': 'The lamp is lying down… this road will be pitch dark tonight',
    '보험 되는 거 맞지?': 'We are insured, right?',
    '100억 있다고 막 사는 거 아니야': 'Having 10 billion won is no excuse to live like this',
    '경보 울린다! 빨리 가!': 'The alarm is going off! Go, go!',
    '주인 나오기 전에 튀어!': 'Floor it before the owner comes out!',
    '삐용삐용… 창피해 죽겠네': 'Wee-woo… I could die of embarrassment',
    '오빠, 제주도 진짜 재미없다. 우리 서울 가자.': 'Jeju is so boring. Can we go back to Seoul?',
    '여기 또 땅 보러 온 거야? 난 카페나 가고 싶은데.': 'Looking at land again? I just want a café.',
    '100억이나 있는데 왜 맨날 이런 데를 돌아다녀?': 'We have 10 billion won and we drive around fields all day?',
    '오빠, 이 땅 사면 돈 번다고? 난 하나도 모르겠어.': 'This land makes money? I really do not get it.',
    '서울 가면 이런 데 안 돌아다녀도 되잖아.': 'In Seoul we would not have to drive around like this.',
    '오빠, 이번엔 제발 좋은 데 좀 가자. 맨날 땅, 땅, 땅이야.': 'Can we go somewhere nice for once? Land, land, land.',
    '어? 이 땅 벌써 올랐어? 제주도 땅이 이렇게 빨리 오르나?': 'Wait, it went up already? Land moves this fast here?',
    '그래도 난 제주도보다 서울이 좋아. 사람도 많고 할 것도 많잖아.': 'I still like Seoul better. More people, more to do.',
    '오빠, 우리 돈 300억 됐는데 아직도 제주도 돌아다니고 있어?': 'We are at 30 billion and still driving around Jeju?',
    '그럼 이제 서울 가서 건물 하나 사면 안 돼?': 'Can we buy a building in Seoul now?',
    '미국은 어때? 오빠 돈이면 미국에도 집 살 수 있잖아.': 'What about America? You could buy a house there.',
    '잠깐, 오빠. 방금 산 땅 가격 또 올랐어?': 'Hold on, the land you just bought went up again?',
    '나 제주도 별로라고 했는데… 생각보다 돈 벌기 좋은 곳이네?': 'I said I did not like Jeju… but the money is good here.',
    '500억이면 서울 가도 되겠다. 이제 제주도 졸업하자.': '50 billion is enough for Seoul. Let us graduate from Jeju.',
    '근데 우리 산 땅들 다 합치면 엄청난 거 아니야?': 'All the land we bought adds up to a lot, right?',
    '오빠, 이제 제주도 여기저기 우리가 산 땅만 찾아다니는 것 같아.': 'Everywhere we drive now is land we own.',
    '700억이면… 미국 가서 살 수도 있겠다.': 'With 70 billion we could live in America.',
    '근데 미국은 잠깐 갔다 오자. 제주도에 우리 땅이 이렇게 많은데.': 'Just a visit though. We own this much of Jeju.',
    '오빠, 우리 진짜 1,000억 됐어? 나 이제 제주도 안 심심해.': 'We really hit 100 billion? Jeju is not boring any more.',
    '이상하다. 처음엔 제주도 떠나자고 했는데… 이제는 여기서 계속 살고 싶어.': 'Funny. I wanted to leave, and now I want to stay.',
    '어? 방금 그거 우리가 사려던 거 아니야?': 'Wait, was that not the one we wanted?',
    '저 사람 누구야? 우리보다 먼저 와 있었네.': 'Who is that? He got here first.',
    '아깝다… 조금만 빨리 왔으면 됐는데.': 'So close… a little faster and it was ours.',
    '탐라국개발? 처음 듣는 이름인데 발이 빠르네.': 'Tamna Development? Never heard of them, but they are quick.',
    '아, 저 인간 또 가로챘어! 오빠가 조금만 빨랐으면 샀잖아!': 'He took it again! You were nearly there!',
    '헐, 방금 그 가격에 샀어? 저건 완전 도둑질인데?': 'He got it at that price? That is daylight robbery.',
    '아 진짜! 좋은 물건만 나오면 저 사람이 먼저 채가네.': 'Every good one, he grabs first.',
    '오빠, 저 사람 우리 따라다니는 거 아니야? 어떻게 맨날 먼저 사?': 'Is he following us? How is he always first?',
    '됐어. 다음엔 우리가 먼저 사자. 나 이제 저 인간한테 지는 거 싫어.': 'Enough. Next one is ours. I am done losing to him.',
    '오빠, 우리가 산 땅에 나이트클럽을 지었는데… 이제 제주도 밤문화도 우리가 만드는 거야?': 'We put a nightclub on our land… do we run Jeju nights now?',

    // ── 엔딩 ──
    '부동산 재벌': 'PROPERTY TYCOON',
    '1,000억을 모았다.': 'You reached 100 billion won.',
    '아버지 그늘에서 벗어나 제주도에 이름을 남겼다.': 'Out of your father’s shadow, your name is on Jeju.',
    '계속하기': 'CONTINUE',

    // ── 마을 ──
    '제주시': 'Jeju City', '서귀포': 'Seogwipo', '성산': 'Seongsan', '표선': 'Pyoseon', '남원': 'Namwon',
    '중문': 'Jungmun', '모슬포': 'Moseulpo', '화순': 'Hwasun', '한림': 'Hallim', '애월': 'Aewol',
    '함덕': 'Hamdeok', '세화': 'Sehwa', '김녕': 'Gimnyeong', '고산': 'Gosan', '성읍': 'Seongeup',

    // ── 명소 ──
    '제주국제공항': 'Jeju Airport', '용두암': 'Yongduam Rock', '용연': 'Yongyeon', '동문시장': 'Dongmun Market',
    '삼성혈': 'Samseonghyeol', '제주목관아': 'Jeju Mokgwana', '이호테우 해변': 'Iho Tewoo Beach',
    '도두봉': 'Dodubong', '사라봉': 'Sarabong', '넥슨컴퓨터박물관': 'Computer Museum',
    '한라수목원': 'Halla Arboretum', '삼양 검은모래해변': 'Samyang Black Sand Beach',
    '함덕해수욕장': 'Hamdeok Beach', '서우봉 패러글라이딩': 'Seoubong Paragliding',
    '김녕해수욕장': 'Gimnyeong Beach', '김녕미로공원': 'Gimnyeong Maze Park', '만장굴': 'Manjanggul Cave',
    '비자림': 'Bijarim Forest', '사려니숲길': 'Saryeoni Forest Path', '절물자연휴양림': 'Jeolmul Forest',
    '돌문화공원': 'Stone Park', '에코랜드': 'Ecoland', '산굼부리': 'Sangumburi Crater',
    '제주승마공원': 'Jeju Horse Park', '교래 ATV 체험장': 'Gyorae ATV Park',
    '월정리 카페거리': 'Woljeongri Café Street', '월정리 투명카약': 'Woljeongri Clear Kayak',
    '세화해변': 'Sehwa Beach', '해녀박물관': 'Haenyeo Museum', '하도 해녀체험': 'Hado Haenyeo Diving',
    '종달리 수국길': 'Jongdalli Hydrangea Road', '제주레일바이크': 'Jeju Rail Bike',
    '성산일출봉': 'Seongsan Ilchulbong', '성산항 우도 여객선': 'Seongsan Udo Ferry',
    '광치기해변': 'Gwangchigi Beach', '섭지코지': 'Seopjikoji', '아쿠아플라넷': 'Aquaplanet',
    '우도 등대': 'Udo Lighthouse', '우도 자전거 일주': 'Udo Bike Loop', '우도 여객선': 'Udo Ferry',
    '다랑쉬오름': 'Darangshi Oreum', '용눈이오름': 'Yongnuni Oreum', '아부오름': 'Abu Oreum',
    '성읍민속마을': 'Seongeup Folk Village', '제주민속촌': 'Jeju Folk Village', '표선해비치': 'Pyoseon Beach',
    '표선 카트': 'Pyoseon Go-Kart', '남원 큰엉': 'Namwon Keuneong Cliff', '위미 동백군락': 'Wimi Camellia Grove',
    '감귤 따기 체험': 'Tangerine Picking', '쇠소깍 카약': 'Soesokkak Kayak', '정방폭포': 'Jeongbang Falls',
    '천지연폭포': 'Cheonjiyeon Falls', '이중섭거리': 'Lee Jungseop Street', '서귀포 올레시장': 'Seogwipo Olle Market',
    '새연교': 'Saeyeon Bridge', '외돌개': 'Oedolgae Rock', '서귀포 잠수함': 'Seogwipo Submarine',
    '문섬 스쿠버': 'Munseom Scuba', '천제연폭포': 'Cheonjeyeon Falls', '대포 주상절리': 'Daepo Columnar Joints',
    '중문 색달해변': 'Jungmun Beach', '중문 서핑': 'Jungmun Surfing', '중문 요트투어': 'Jungmun Yacht Tour',
    '여미지식물원': 'Yeomiji Garden', '테디베어뮤지엄': 'Teddy Bear Museum', '1100고지': '1100 Highland',
    '영실': 'Yeongsil', '성판악': 'Seongpanak', '한라산 백록담': 'Hallasan Baengnokdam', '돈내코': 'Donnaeko',
    '감귤박물관': 'Tangerine Museum', '카멜리아힐': 'Camellia Hill', '산방산': 'Sanbangsan',
    '용머리해안': 'Yongmeori Coast', '송악산': 'Songaksan', '형제섬 전망': 'Hyeongjeseom View',
    '사계 투명카약': 'Sagye Clear Kayak', '사계 해녀체험': 'Sagye Haenyeo Diving',
    '마라도 여객선': 'Marado Ferry', '마라도 최남단': 'Marado Southern Tip', '가파도 자전거': 'Gapado Bike',
    '가파도 여객선': 'Gapado Ferry', '오설록 티뮤지엄': 'Osulloc Tea Museum',
    '이니스프리 제주하우스': 'Innisfree Jeju House', '항공우주박물관': 'Aerospace Museum',
    '신화월드': 'Shinhwa World', '9.81파크': '9.81 Park', '본태박물관': 'Bonte Museum',
    '방주교회': 'Bangju Church', '안덕계곡': 'Andeok Valley', '협재해수욕장': 'Hyeopjae Beach',
    '협재 스노클링': 'Hyeopjae Snorkeling', '금능해변': 'Geumneung Beach', '한림공원': 'Hallim Park',
    '비양도 전망': 'Biyangdo View', '애월 한담 카페거리': 'Aewol Handam Café Street',
    '곽지해수욕장': 'Gwakji Beach', '새별오름': 'Saebyeol Oreum', '아르떼뮤지엄': 'Arte Museum',
    '렛츠런파크 승마': 'Letsrun Park Riding', '신창 풍차해안': 'Sinchang Windmill Coast',
    '수월봉': 'Suwolbong', '차귀도 전망': 'Chagwido View', '자구내포구 한치': 'Jagunae Port Squid',
    '자구내 낚싯배': 'Jagunae Fishing Boat', '환상숲 곶자왈': 'Hwansangsup Gotjawal',
    '저지예술인마을': 'Jeoji Art Village', '금오름': 'Geum Oreum', '금오름 패러글라이딩': 'Geum Oreum Paragliding',
    '김녕 요트투어': 'Gimnyeong Yacht Tour',
    '제주': 'Jeju'
  };

  // 중국어판(?lang=zh) 사전 — 한국어 원문을 열쇠로 쓴다
  const Z = {
    // ── 화면 단추·표준 용어 ──
    '시작': '开始', '이어하기': '继续', '처음부터?': '重新开始？',
    '지도': '地图', '리스폰': '复位', '브레이크': '刹车', '경적': '喇叭',
    '내리기': '下车', '타기': '上车', '달리기': '跑', '점프': '跳', '위로': '上浮', '아래로': '下潜',
    '가로 화면에서 하는 게임입니다': '这个游戏需要横屏玩',
    '가로로 돌리기': '切换横屏',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': '按钮没反应的话，请关闭手机的屏幕旋转锁定，再把手机横过来',
    '그래도 세로로 하기': '还是竖屏玩',
    '건너뛰기': '跳过',
    '오전 9시': '上午9点',
    '자산': '资产', '짓기': '建造', '렌터카': '租车', '전체화면': '全屏',

    // ── 조작 안내 ──
    '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동 · F 내리기<br>T 지도 · H 경적 · R 리스폰 · K 효과음 · M 음악':
      '↑↓←→ 驾驶 · 空格 手刹 · E 互动 · F 下车<br>T 地图 · H 喇叭 · R 复位 · K 音效 · M 音乐',
    '↑↓←→ 걷기 · Shift 달리기 · 스페이스 점프 · E 행동 · F 타기<br>T 지도 · R 리스폰':
      '↑↓←→ 走路 · Shift 跑 · 空格 跳 · E 互动 · F 上车<br>T 地图 · R 复位',
    '↑↓←→ 헤엄 · 스페이스 위로 · Shift 아래로<br>R 돌아가기': '↑↓←→ 游泳 · 空格 上浮 · Shift 下潜<br>R 返回',
    '←→ 방향 · ↑ 숙이기 · ↓ 당기기<br>R 돌아가기': '←→ 转向 · ↑ 俯冲 · ↓ 拉起<br>R 返回',
    '↑↓←→ 조종 · R 돌아가기': '↑↓←→ 操控 · R 返回',
    '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동': '↑↓←→ 驾驶 · 空格 手刹 · E 互动',
    '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동 · F 내리기': '↑↓←→ 驾驶 · 空格 手刹 · E 互动 · F 下车',
    'T 지도 · H 경적 · R 리스폰 · K 효과음 · M 음악': 'T 地图 · H 喇叭 · R 复位 · K 音效 · M 音乐',
    '↑↓←→ 걷기 · Shift 달리기 · 스페이스 점프 · E 행동 · F 타기': '↑↓←→ 走路 · Shift 跑 · 空格 跳 · E 互动 · F 上车',
    'T 지도 · R 리스폰': 'T 地图 · R 复位',
    '↑↓←→ 헤엄 · 스페이스 위로 · Shift 아래로': '↑↓←→ 游泳 · 空格 上浮 · Shift 下潜',
    '←→ 방향 · ↑ 숙이기 · ↓ 당기기': '←→ 转向 · ↑ 俯冲 · ↓ 拉起',
    '↑↓←→ 조종': '↑↓←→ 操控', 'R 돌아가기': 'R 返回',
    'T 지도 · H 경적 · R 리스폰 · K 효과음': 'T 地图 · H 喇叭 · R 复位 · K 音效',

    // ── 땅·건물 ──
    '매매 ': '出售 ', '급매 ': '急售 ', '내 땅': '我的地', '내 ': '我的',
    '🏷 매입 · ': '🏷 买入 · ', '🏗 짓기 · ': '🏗 建造 · ', '📞 급매 · ': '📞 急售 · ', '🏢 되사기 · ': '🏢 买回 · ',
    '💸 팔기': '💸 卖出', '팔기': '卖出', '에 팔기?': ' 卖出？', '되찾음': '买回', '급매': '急售', '매입 ': '买入 ',
    ' 부지': '用地', '평': '坪', '평 · ': '坪 · ', ' · 월세 ': ' · 月租 ', '월세 ': '月租 ', '월세 +': '月租 +',
    '대박': '大赚', '이득': '赚了', '손해': '亏了', '정산': '结算', '자리를 비운 사이 ': '离开期间 ',
    '/ 1,000억': '/ 1,000亿',
    '탐라국개발': '耽罗国开发', '이 먼저 사갔습니다. 아깝네요': '抢先买走了，可惜',

    // 지을 수 있는 건물
    '작은 농가주택': '小农舍', '소형 카페': '小咖啡馆', '작은 펜션': '小民宿',
    '제주 식당': '济州餐馆', '승마체험장': '骑马体验场', '게스트하우스': '青旅',
    '소형 상가': '小商铺', '흑돼지 식당': '黑猪肉餐馆', '애견펜션': '宠物民宿',
    '캠핑장': '露营地', '글램핑장': '豪华露营地', '대형 카페': '大咖啡馆',
    '원룸 건물': '单间公寓楼', '3층 상가': '三层商铺', '스크린골프장': '模拟高尔夫',
    '피트니스센터': '健身中心', '노래방 건물': 'KTV大楼', 'PC방 건물': '网吧大楼',
    '병원 건물': '医院大楼', '학원 건물': '补习班大楼', '오피스텔': '商住公寓',
    '주차빌딩': '停车楼', '물류센터': '物流中心', '대형 쇼핑몰': '大型商场',
    '워터파크': '水上乐园', '테마파크': '主题乐园', '대형 리조트': '大型度假村',
    '대형마트': '大型超市', '특급호텔': '五星酒店', '나이트클럽': '夜店', '리조트': '度假村',
    '주택': '住宅', '편의점': '便利店', '카페': '咖啡馆', '펜션': '民宿', '호텔': '酒店',

    // ── 자산 창 ──
    '땅 ': '土地 ', '건물 ': '建筑 ', '매입가 ': '买入价 ', '현재가 ': '现价 ', '부동산 ': '房产 ', '총자산 ': '总资产 ', '현금 ': '现金 ',
    '아직 산 땅이 없다': '还没买地',
    '채<br>하루 수입 ': '栋<br>日收入 ', '하루 수입 ': '日收入 ', ' · 자산 ': ' · 资产 ', ' · 건물 ': ' · 建筑 ', '일 뒤': '天后',

    // ── 탈것 ──
    '소형차': '小型车', '오픈카': '敞篷车', '전기차': '电动车', '스포츠카': '跑车', '캠핑카': '房车',
    '촬영': '拍照', '먹기': '品尝', '탑승': '乘坐', '출발': '出发', '입수': '下水', '이륙': '起飞',
    '☀️ 낮': '☀️ 白天',

    // ── 전화 ──
    '📞 유학 친구': '📞 留学的朋友', '👔 아버지': '👔 父亲', '🏢 탐라국개발': '🏢 耽罗国开发',
    '📞 복덕방': '📞 房产中介', '복덕방': '房产中介', '여친': '女友',
    // ── 명품관·가방 ──
    '오빠, 자산 10억 또 늘었지? 나 가방 하나만 사 줘. 중문 명품관!': '亲爱的，资产又涨了10亿吧？给我买个包嘛。中文的奢侈品店！',
    '10억 벌었으면 나한테도 뭐 있어야지. 명품관 가자. 지금.': '赚了10亿，总得给我点什么吧。去奢侈品店。现在就去。',
    '오빠 통장만 살찌우지 말고 내 어깨도 좀 채워 줘. 가방!': '别光养肥你的存折，也给我的肩膀添点东西。包包！',
    '이번에 10억 오른 거 다 봤어. 명품관 안 가면 나 진짜 삐진다?': '这次涨了10亿我都看见了。不去奢侈品店我可真生气了哦？',
    '가방 값 정도는 오빠한테 껌이잖아. 지금 10억 벌었는데. 계산 끝났지?': '一个包对你来说就是小意思。你刚赚了10亿。算明白了吧？',
    '우리 벌써 100억 넘게 벌었어. 이제 천만 원짜리는 좀 그렇지 않아? 2천만 원!': '我们都赚了100多亿了。一千万的包有点拿不出手了吧？两千万！',
    '오빠 땅값 오르는 거 보니까 내 가방 값도 올라야 할 것 같아. 2천.': '看你地价涨成这样，我的包也该涨价了。两千万。',
    '친구가 2천만 원짜리 들고 왔더라. 나만 천만 원짜리 들 순 없잖아.': '我朋友背了个两千万的包。总不能只有我背一千万的吧。',
    '200억 넘게 번 남자 여친이 아무 가방이나 들면 오빠 체면이 뭐가 돼. 3천만 원.': '赚了200多亿的男人，女朋友随便背个包，你的面子往哪放？三千万。',
    '오빠, 이번 건 3천만 원이야. 놀라지 마. 오빠 이제 그 정도 사람이야.': '亲爱的，这次是三千万。别吓到。你现在就是这个档次的人了。',
    '명품관 언니가 오빠 이름 외웠대. 3천만 원짜리 빼 놨대.': '奢侈品店的姐姐都记住你名字了。说给你留了个三千万的。',
    '300억 넘게 벌었으면 가방도 한 단계 올라가야지. 5천만 원!': '赚了300多亿，包也得升一级吧。五千万！',
    '5천만 원이 비싸? 오빠 땅 한 번 오르면 그거 몇 배야.': '五千万很贵吗？你的地涨一次就是它好几倍。',
    '나 이 가방 들고 탐라국개발 사장 부인 앞을 지나갈 거야. 5천만 원.': '我要背着这个包从耽罗国开发老板娘面前走过去。五千万。',
    '500억 넘은 남자 여친이면 1억짜리는 들어야지. 명품관 가자.': '身家500多亿的男人，女朋友得背一亿的包才行。去奢侈品店。',
    '오빠, 이번이 마지막일지도 몰라. 1억짜리 하나만.': '亲爱的，这可能是最后一次了。就一个一亿的。',
    '매장에 하나 남은 1억짜리, 다른 여자가 먼저 사면 나 울 거야.': '店里就剩一个一亿的了，要是被别的女人先买走我会哭的。',
    '꺄! 오빠 최고! 이거 진짜 갖고 싶었던 거야.': '啊！你最棒了！这个我真的想要好久了。',
    '역시 우리 오빠. 이 가방 들고 해변 걸을래.': '果然是我男人。我要背着这个包去海边走走。',
    '사랑해 오빠. 다음 10억도 기대할게.': '爱你。下一个10亿我也很期待哦。',
    '이 색 너무 예쁘다. 오빠 센스 인정!': '这个颜色太好看了。你的品味我服！',
    '됐어. 가방 하나 못 사 주는 남자랑은 끝이야. 나 간다.': '算了。连个包都不给买的男人，分手吧。我走了。',
    '여친이 떠났다': '女友离开了', '이별': '分手', '깜짝 선물': '惊喜', '선물': '礼物',
    '명품 가방': '名牌包', '가방 ': '第', '가방': '包', '번째': '个包', '여친 가방': '女友的包', '가방 사 주기': '给她买包', '명품관': '奢侈品店', '명 품 관': '奢 侈 品 店',
    '이상하다 왜 가방사달라고 안하지....': '奇怪，她怎么不叫我买包了....',
    '뭐? 제주도??': '什么？济州岛？？',
    '그 촌구석에서 뭐 하냐 ㅋㅋㅋㅋㅋㅋ': '你在那个穷乡僻壤干嘛 哈哈哈哈哈哈',
    '제주도에서 사업을 한다고 ㅋㅋㅋㅋ': '在济州岛做生意？哈哈哈哈',
    '잘해봐라 ㅋㅋㅋ': '祝你好运吧 哈哈哈',
    '야 너 진짜 샀냐?': '喂，你真买了？',
    '제주도 땅을?': '济州岛的地？',
    '사진 좀 보내봐': '发张照片看看',
    '제주도에서 니 이름이 들리더라': '济州岛那边都在传你的名字',
    '아직은 두고 본다': '我还在看着',
    '이 바닥 좁습니다': '这个圈子很小',
    '적당히 하시죠': '适可而止吧',
    '곧 뵙겠습니다': '我们很快会见面的',
    '...잘 지내냐': '...过得还好吗',
    '제주도가 요즘 시끄럽더라. 니 이름이 계속 나와': '济州岛最近很热闹。一直听到你的名字',
    '내가 준 100억, 열 배로 만들었다며': '听说我给你的100亿，你翻了十倍',
    '인정한다. 니가 해냈다': '我承认。你做到了',
    '이번 추석엔 집에 와라. 아버지가 술 한잔 사마': '今年中秋回家吧。爸请你喝一杯',
    '형님, 저희 제주도 갑니다': '大哥，我们要去济州岛了',
    '방 하나만 빼주십쇼 ㅋㅋㅋ': '给我们留间房吧 哈哈哈',
    '진짜 존경합니다': '真心佩服',
    '형님': '大哥',

    // ── 복덕방 하르방 (급매를 놓쳤을 때) ──
    '허허, 젊은 양반. 조금 늦었구먼.': '呵呵，年轻人，来晚了一步啊。',
    '허허허, 기다리다 목 빠지는 줄 알았네. 근디 벌써 다른 사람이 왔다 갔어.': '呵呵呵，等得我脖子都长了。可是已经有别人来过了。',
    '아이고, 총각이 좀만 일찍 왔으면 좋았을 텐디.': '哎哟，小伙子要是早点来就好了。',
    '허허, 좋은 물건은 원래 주인이 빨리 나타나는 법이여.': '呵呵，好东西总是很快就有主了。',
    '왔구먼! 근디 미안허네. 방금 계약했어.': '来啦！不过对不住，刚刚签完合同。',
    '허허허, 뛰어왔구먼. 근디 이미 늦었어.': '呵呵呵，跑着来的吧。可惜已经晚了。',
    '아이고, 내가 전화하려고 했는디… 다른 양반이 먼저 돈을 내놨네.': '哎哟，我正要给你打电话…别人先把钱掏出来了。',
    '허허, 이 땅이 그렇게 탐났어? 자네보다 먼저 온 사람이 있더라고.': '呵呵，这么想要这块地？有人比你先到了。',
    '쯧쯧, 급매라고 소문이 나니까 사람들이 아주 날아다니는구먼.': '啧啧，急售的消息一传开，大家都飞着来抢。',
    '허허허, 다음엔 조금 일찍 움직이게. 좋은 땅은 기다려주질 않아.': '呵呵呵，下次早点动身。好地可不等人。',

    // ── 여자친구 ──
    '오빠!! 남의 돌담을 왜 부숴?!': '亲爱的！！你干嘛撞人家的石墙？！',
    '방금 그거 일부러 그런 거지?': '刚才那下是故意的吧？',
    '돌담 다시 쌓으려면 하르방들 고생하신다…': '石墙要重新垒，老爷爷们可要受累了…',
    '와… 돌이 다 날아갔어 ㅋㅋㅋ': '哇…石头全飞了 哈哈哈',
    '이 동네에서 우리 얼굴 팔리겠다': '这下全村都认识我们了',
    '가로등!! 오빠 미쳤어?': '路灯！！你疯了吗？',
    '가로등이 누웠어… 오늘 밤 이 길 깜깜하겠다': '路灯倒了…今晚这条路要黑漆漆的了',
    '보험 되는 거 맞지?': '有保险的吧？',
    '신호등을 박으면 어떡해!!': '你怎么把红绿灯撞了！！',
    '오빠 이거 경찰 와…': '这下警察要来了…',
    '교차로 한가운데서 뭐 하는 거야!': '在十字路口正中间干什么呢！',
    '남의 차를 박았어!!': '撞到别人的车了！！',
    '주인 나오기 전에 튀자고? 돈은 내야지!': '趁车主出来前开溜？钱还是得赔！',
    '가로수를 왜 들이받아!': '干嘛撞行道树！',
    '나무가 무슨 죄야…': '树有什么错…',
    '귤나무!! 농사 망치겠다': '橘子树！！人家的收成要毁了',
    '할망 귤밭이잖아!': '那是奶奶的橘子园啊！',
    '귤 다 떨어졌어…': '橘子全掉了…',
    '오빠 이러다 땅 살 돈 다 날리겠다': '再这样下去买地的钱都要赔光了',
    '이 돈이면 땅을 샀지!': '这些钱都够买块地了！',
    '오빠 운전면허 어디서 땄어?': '你驾照到底在哪考的？',
    '100억 있다고 막 사는 거 아니야': '有100亿也不能这么乱来',
    '경보 울린다! 빨리 가!': '警报响了！快走！',
    '주인 나오기 전에 튀어!': '趁主人出来前快跑！',
    '삐용삐용… 창피해 죽겠네': '呜哇呜哇…丢死人了',
    '오빠, 제주도 진짜 재미없다. 우리 서울 가자.': '亲爱的，济州岛真没意思。我们回首尔吧。',
    '여기 또 땅 보러 온 거야? 난 카페나 가고 싶은데.': '又来看地？我只想去咖啡馆。',
    '100억이나 있는데 왜 맨날 이런 데를 돌아다녀?': '都有100亿了，干嘛天天在这种地方转？',
    '오빠, 이 땅 사면 돈 번다고? 난 하나도 모르겠어.': '买这块地能赚钱？我完全搞不懂。',
    '서울 가면 이런 데 안 돌아다녀도 되잖아.': '回首尔就不用在这种地方转悠了嘛。',
    '오빠, 이번엔 제발 좋은 데 좀 가자. 맨날 땅, 땅, 땅이야.': '这次求你去个好地方吧。天天地、地、地。',
    '어? 이 땅 벌써 올랐어? 제주도 땅이 이렇게 빨리 오르나?': '咦？这块地已经涨了？济州岛的地涨这么快？',
    '그래도 난 제주도보다 서울이 좋아. 사람도 많고 할 것도 많잖아.': '不过我还是更喜欢首尔。人多，好玩的也多。',
    '오빠, 우리 돈 300억 됐는데 아직도 제주도 돌아다니고 있어?': '我们都有300亿了，还在济州岛到处转？',
    '그럼 이제 서울 가서 건물 하나 사면 안 돼?': '那现在去首尔买栋楼不行吗？',
    '미국은 어때? 오빠 돈이면 미국에도 집 살 수 있잖아.': '去美国怎么样？以你的钱在美国也能买房。',
    '잠깐, 오빠. 방금 산 땅 가격 또 올랐어?': '等等，刚买的地又涨了？',
    '나 제주도 별로라고 했는데… 생각보다 돈 벌기 좋은 곳이네?': '我说过不喜欢济州岛…没想到这里挺好赚钱的？',
    '500억이면 서울 가도 되겠다. 이제 제주도 졸업하자.': '有500亿可以回首尔了。从济州岛毕业吧。',
    '근데 우리 산 땅들 다 합치면 엄청난 거 아니야?': '我们买的地加起来是不是很惊人了？',
    '오빠, 이제 제주도 여기저기 우리가 산 땅만 찾아다니는 것 같아.': '现在在济州岛转来转去，好像全是我们自己的地了。',
    '700억이면… 미국 가서 살 수도 있겠다.': '有700亿…都能去美国生活了。',
    '근데 미국은 잠깐 갔다 오자. 제주도에 우리 땅이 이렇게 많은데.': '不过美国就去玩玩吧。我们在济州岛有这么多地呢。',
    '오빠, 우리 진짜 1,000억 됐어? 나 이제 제주도 안 심심해.': '我们真的有1,000亿了？我现在不觉得济州岛无聊了。',
    '이상하다. 처음엔 제주도 떠나자고 했는데… 이제는 여기서 계속 살고 싶어.': '奇怪。一开始我还吵着要离开济州岛…现在却想一直住在这里。',
    '어? 방금 그거 우리가 사려던 거 아니야?': '咦？刚才那块不是我们想买的吗？',
    '저 사람 누구야? 우리보다 먼저 와 있었네.': '那人是谁？比我们先到了。',
    '아깝다… 조금만 빨리 왔으면 됐는데.': '可惜…再快一点就是我们的了。',
    '탐라국개발? 처음 듣는 이름인데 발이 빠르네.': '耽罗国开发？没听说过，动作倒挺快。',
    '아, 저 인간 또 가로챘어! 오빠가 조금만 빨랐으면 샀잖아!': '啊，那家伙又抢走了！你再快一点就买到了！',
    '헐, 방금 그 가격에 샀어? 저건 완전 도둑질인데?': '天哪，那个价格就买了？简直是抢劫啊？',
    '아 진짜! 좋은 물건만 나오면 저 사람이 먼저 채가네.': '真是的！一有好地就被那人先抢走。',
    '오빠, 저 사람 우리 따라다니는 거 아니야? 어떻게 맨날 먼저 사?': '那人是不是在跟踪我们？怎么每次都先买？',
    '됐어. 다음엔 우리가 먼저 사자. 나 이제 저 인간한테 지는 거 싫어.': '算了。下次我们先买。我再也不想输给那家伙了。',
    '오빠, 우리가 산 땅에 나이트클럽을 지었는데… 이제 제주도 밤문화도 우리가 만드는 거야?': '我们在自己的地上建了夜店…以后济州岛的夜生活也归我们管了？',
    // 수리비 내역
    '오빠 수리비 ': '亲爱的，修理费 ', ' 나왔어! (': '！（',

    // ── 엔딩 ──
    '부동산 재벌': '房地产大亨',
    '1,000억을 모았다.': '攒到了1,000亿。',
    '아버지 그늘에서 벗어나 제주도에 이름을 남겼다.': '走出了父亲的阴影，在济州岛留下了自己的名字。',
    '계속하기': '继续',

    // ── 마을 ──
    '제주시': '济州市', '서귀포': '西归浦', '성산': '城山', '표선': '表善', '남원': '南元',
    '중문': '中文', '모슬포': '摹瑟浦', '화순': '和顺', '한림': '翰林', '애월': '涯月',
    '함덕': '咸德', '세화': '细花', '김녕': '金宁', '고산': '高山', '성읍': '城邑',

    // ── 명소 ──
    '제주국제공항': '济州国际机场', '용두암': '龙头岩', '용연': '龙渊', '동문시장': '东门市场',
    '삼성혈': '三姓穴', '제주목관아': '济州牧官衙', '이호테우 해변': '梨湖木马海边',
    '도두봉': '道头峰', '사라봉': '纱罗峰', '넥슨컴퓨터박물관': '电脑博物馆',
    '한라수목원': '汉拿树木园', '삼양 검은모래해변': '三阳黑沙滩',
    '함덕해수욕장': '咸德海水浴场', '서우봉 패러글라이딩': '犀牛峰滑翔伞',
    '김녕해수욕장': '金宁海水浴场', '김녕미로공원': '金宁迷宫公园', '만장굴': '万丈窟',
    '비자림': '榧子林', '사려니숲길': '思连伊林荫路', '절물자연휴양림': '节物自然休养林',
    '돌문화공원': '石文化公园', '에코랜드': '生态乐园', '산굼부리': '山君不离',
    '제주승마공원': '济州骑马公园', '교래 ATV 체험장': '桥来 ATV 体验场',
    '월정리 카페거리': '月汀里咖啡街', '월정리 투명카약': '月汀里透明皮划艇',
    '세화해변': '细花海边', '해녀박물관': '海女博物馆', '하도 해녀체험': '下道海女体验',
    '종달리 수국길': '终达里绣球花路', '제주레일바이크': '济州铁道自行车',
    '성산일출봉': '城山日出峰', '성산항 우도 여객선': '城山港牛岛客轮',
    '광치기해변': '广峙其海边', '섭지코지': '涉地可支', '아쿠아플라넷': '水族馆',
    '우도 등대': '牛岛灯塔', '우도 자전거 일주': '牛岛骑行环岛', '우도 여객선': '牛岛客轮',
    '다랑쉬오름': '月郎峰', '용눈이오름': '龙眼岳', '아부오름': '亚父岳',
    '성읍민속마을': '城邑民俗村', '제주민속촌': '济州民俗村', '표선해비치': '表善海边',
    '표선 카트': '表善卡丁车', '남원 큰엉': '南元大岩崖', '위미 동백군락': '为美山茶花林',
    '감귤 따기 체험': '摘橘子体验', '쇠소깍 카약': '牛沼河皮划艇', '정방폭포': '正房瀑布',
    '천지연폭포': '天地渊瀑布', '이중섭거리': '李仲燮街', '서귀포 올레시장': '西归浦偶来市场',
    '새연교': '新缘桥', '외돌개': '独立岩', '서귀포 잠수함': '西归浦潜水艇',
    '문섬 스쿠버': '蚊岛潜水', '천제연폭포': '天帝渊瀑布', '대포 주상절리': '大浦柱状节理',
    '중문 색달해변': '中文穑达海边', '중문 서핑': '中文冲浪', '중문 요트투어': '中文游艇之旅',
    '여미지식물원': '如美地植物园', '테디베어뮤지엄': '泰迪熊博物馆', '1100고지': '1100高地',
    '영실': '灵室', '성판악': '城板岳', '한라산 백록담': '汉拿山白鹿潭', '돈내코': '敦乃克',
    '감귤박물관': '柑橘博物馆', '카멜리아힐': '山茶花之丘', '산방산': '山房山',
    '용머리해안': '龙头海岸', '송악산': '松岳山', '형제섬 전망': '兄弟岛观景',
    '사계 투명카약': '沙溪透明皮划艇', '사계 해녀체험': '沙溪海女体验',
    '마라도 여객선': '马罗岛客轮', '마라도 최남단': '马罗岛最南端', '가파도 자전거': '加波岛骑行',
    '가파도 여객선': '加波岛客轮', '오설록 티뮤지엄': '雪绿茶博物馆',
    '이니스프리 제주하우스': '悦诗风吟济州之家', '항공우주박물관': '航空宇宙博物馆',
    '신화월드': '神话世界', '9.81파크': '9.81公园', '본태박물관': '本态博物馆',
    '방주교회': '方舟教会', '안덕계곡': '安德溪谷', '협재해수욕장': '挟才海水浴场',
    '협재 스노클링': '挟才浮潜', '금능해변': '金陵海边', '한림공원': '翰林公园',
    '비양도 전망': '飞扬岛观景', '애월 한담 카페거리': '涯月汉潭咖啡街',
    '곽지해수욕장': '郭支海水浴场', '새별오름': '晓星岳', '아르떼뮤지엄': 'ARTE 博物馆',
    '렛츠런파크 승마': '跑马公园骑马', '신창 풍차해안': '新昌风车海岸',
    '수월봉': '水月峰', '차귀도 전망': '遮归岛观景', '자구내포구 한치': '遮归内浦口鱿鱼',
    '자구내 낚싯배': '遮归内钓鱼船', '환상숲 곶자왈': '幻想林原始林',
    '저지예술인마을': '楮旨艺术村', '금오름': '今岳', '금오름 패러글라이딩': '今岳滑翔伞',
    '김녕 요트투어': '金宁游艇之旅',
    '제주도': '济州岛', '제주': '济州'
  };

  const DICT = ZH ? Z : T;
  let RE = null;
  function build() {
    const keys = Object.keys(DICT).sort((a, b) => b.length - a.length);
    RE = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  }
  // 사전에 없는 것 — 숫자에 붙는 단위. 한 글자 '일'·'조' 를 사전에 넣으면 '일찍'·'조용' 까지 깨진다
  const UNITS = ZH
    ? [[/(\d)일(?![가-힣])/g, '$1天'], [/(\d)채(?![가-힣])/g, '$1栋'], [/(\d)곳(?![가-힣])/g, '$1处'],
       [/(\d)조(?![가-힣])/g, '$1万亿'], [/(\d)억(?![가-힣])/g, '$1亿'], [/(\d)천(?![가-힣])/g, '$1千'], [/(\d)만(?![가-힣])/g, '$1万']]
    : [[/(\d)일(?![가-힣])/g, '$1d'], [/(\d)채(?![가-힣])/g, '$1'], [/(\d)곳(?![가-힣])/g, '$1']];
  function L(s) {
    if (!(EN || ZH) || !s || typeof s !== 'string') return s;
    if (!RE) build();
    s = s.replace(RE, m => DICT[m]);
    for (const [re, to] of UNITS) s = s.replace(re, to);
    return s;
  }
  window.L = L;
  window.LANG = { en: EN, zh: ZH, dict: DICT };

  if (ZH) {
    document.documentElement.lang = 'zh-CN';
    document.title = '买下济州 BUY JEJU — 济州岛开放世界买地游戏';
    // 게임 글꼴에는 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Griun', 'Ria', 'Gasoek'].map(f => `@font-face{font-family:'${f}';src:${zf};unicode-range:${ur}}`).join('') + 'html[lang=zh-CN] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
  if (EN || ZH) {
    if (EN) document.documentElement.lang = 'en';
    if (EN) document.title = 'BUY JEJU — open world land-buying game on Jeju';
    const walk = n => {
      if (n.nodeType === 3) { const v = L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
      if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
      for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
    };
    const obs = new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') walk(m.target);
        else for (const n of m.addedNodes) walk(n);
      }
    });
    const start = () => { walk(document.body); obs.observe(document.body, { subtree: true, childList: true, characterData: true }); };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }
})();
