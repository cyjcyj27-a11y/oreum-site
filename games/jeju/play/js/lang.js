// 말 — ?lang=en 이면 영어. 한국어가 원본이고 영어를 덧씌운다 (핑거킥과 같은 방식)
//
// 쓰는 법 두 가지
//   1) 화면(HTML) 글자는 손댈 것 없다. 아래 MutationObserver 가 텍스트 마디를 그때그때 바꾼다.
//   2) 캔버스·스프라이트에 그리는 글자(지도 값표, 매물 표지)는 DOM 이 아니라서 못 잡는다 →
//      그리기 직전에 L(글) 로 감싼다.
// 사전은 '긴 말부터' 바꾸므로 '제주국제공항' 이 '제주' 보다 먼저 걸린다.
(function () {
  const EN = /[?&]lang=en/i.test(location.search);

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
    '땅 ': 'Land ', '건물 ': 'Buildings ', '매입가 ': 'Paid ', '현재가 ': 'Value ', '부동산 ': 'Property ',
    '아직 산 땅이 없다': 'No land yet',
    '채<br>하루 수입 ': ' <br>Daily income ', ' · 자산 ': ' · Assets ', ' · 건물 ': ' · Buildings ', '일 뒤': 'd left',

    // ── 탈것 ──
    '소형차': 'Compact', '오픈카': 'Convertible', '전기차': 'EV', '스포츠카': 'Sports Car', '캠핑카': 'Camper',
    '촬영': 'PHOTO', '먹기': 'EAT', '탑승': 'RIDE', '출발': 'GO', '입수': 'DIVE', '이륙': 'FLY',
    '☀️ 낮': '☀️ Day',

    // ── 전화 ──
    '📞 유학 친구': '📞 Friend abroad', '👔 아버지': '👔 Father', '🏢 탐라국개발': '🏢 Tamna Development',
    '📞 복덕방': '📞 Broker', '복덕방': 'Broker', '여친': 'Girlfriend',
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

  let RE = null;
  function build() {
    const keys = Object.keys(T).sort((a, b) => b.length - a.length);
    RE = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  }
  // 사전에 없는 것 — 숫자에 붙는 단위. 한 글자 '일'·'조' 를 사전에 넣으면 '일찍'·'조용' 까지 깨진다
  const UNITS = [[/(\d)일(?![가-힣])/g, '$1d'], [/(\d)채(?![가-힣])/g, '$1'], [/(\d)곳(?![가-힣])/g, '$1']];
  function L(s) {
    if (!EN || !s || typeof s !== 'string') return s;
    if (!RE) build();
    s = s.replace(RE, m => T[m]);
    for (const [re, to] of UNITS) s = s.replace(re, to);
    return s;
  }
  window.L = L;
  window.LANG = { en: EN, dict: T };

  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'BUY JEJU — open world land-buying game on Jeju';
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
