// ---------- 게임 언어 지원 (한국어/영어) ----------
// 이 파일은 jeju3d.js보다 먼저 읽힙니다.
// 원리: 게임 코드는 한국어 그대로 두고, 화면에 글자가 찍히는 순간
// 사전에서 영어를 찾아 바꿔치기합니다. 사전에 없는 문구는 한국어로 그대로 나오므로
// 번역이 덜 된 상태로도 게임은 멀쩡히 돌아갑니다.
(function () {
  // ----- 언어 정하기: 주소의 ?lang= > 지난번 선택 > 브라우저 언어 -----
  let lang = null;
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'ko') { lang = q; localStorage.setItem('lulu_lang', q); }
    if (!lang) {
      const saved = localStorage.getItem('lulu_lang');
      if (saved === 'en' || saved === 'ko') lang = saved;
    }
  } catch (e) {}
  if (!lang) lang = ((navigator.language || 'ko').toLowerCase().indexOf('ko') === 0) ? 'ko' : 'en';
  window.GAME_LANG = lang;
  document.documentElement.lang = lang;
  // 아래 바꿔치기는 화면(body) 안에서만 일어납니다. 브라우저 탭 이름과 즐겨찾기에 쓰이는
  // 제목은 <head> 안에 있어서 손이 안 닿으므로, 영어판이면 여기서 직접 바꿔 줍니다.
  if (lang === 'en') {
    document.title = "Lulu the Cat's Jeju Life — A Cozy Cat Game | Oreum Games";
    // 홈페이지 링크도 영문판으로 보냅니다. 안 그러면 영어 플레이어가 눌렀을 때
    // 전부 한국어인 페이지에 떨어집니다. (글자만 바꾸는 사전은 주소를 못 건드립니다)
    document.addEventListener('DOMContentLoaded', function () {
      var links = document.querySelectorAll('a[href="https://oreumgames.com/"]');
      for (var i = 0; i < links.length; i++) links[i].href = 'https://oreumgames.com/en/';
    });
  }

  // ----- 사전 1: 문구가 토씨 하나 안 바뀌고 그대로 나오는 것들 (줄 단위) -----
  const DICT = {
    // 시작 화면·상단
    '루루냥의': "Lulu's",
    '제주살이': 'Jeju Life',
    '루루냥의 제주살이': "Lulu the Cat's Jeju Life",
    '서울 집값에 밀려 제주로 온 고양이': 'A cat priced out of Seoul moves to Jeju',
    '낡은 빈집에서 시작하는 두 번째 인생': 'A second life begins in a run-down empty house',
    '숨': 'Air',
    '농사짓기': 'Farming',
    '해녀 물질': 'Haenyeo diving',
    '조랑말 경마': 'Pony racing',
    '헌집 고치기': 'Fixing the house',
    '그리고 설레는 사랑 💕': 'And a fluttering romance 💕',
    '시작하기': 'Start',
    // 시작 화면 조작표
    '방향키': 'Arrow keys',
    '루루 이동': 'Move Lulu',
    '시야 돌리기 · 올려보기': 'Turn view · look up/down',
    '모든 상호작용 (따기·사기·상자·물질…)': 'All interactions (pick, buy, crates, diving...)',
    '전체 지도': 'Full map',
    '달리기 · 점프': 'Run · Jump',
    '왼쪽 화면': 'Left side',
    '끌면 루루가 걸어갑니다': 'Drag to walk',
    '오른쪽 화면': 'Right side',
    '끌면 시야가 돌아갑니다': 'Drag to look around',
    '두 손가락': 'Two fingers',
    '벌리고 오므리면 줌': 'Pinch to zoom',
    '행동 버튼': 'Action button',
    '🗺 배지': '🗺 badge',
    '🎵 배지': '🎵 badge',
    '누르면 배경음악 꺼짐': 'Tap to mute the music',
    // 손가락 버튼
    '행동': 'Action',
    '달리기': 'Run',
    '점프': 'Jump',
    // 오른쪽 위 조작 안내표
    '이동': 'Move',
    '← ↑ ↓ → (방향키)': '← ↑ ↓ → (arrow keys)',
    '시야 회전': 'Look',
    'A D (올려보기 W S)': 'A D (up/down W S)',
    '줌': 'Zoom',
    'Z 멀리 / X 가까이': 'Z out / X in',
    '상호작용': 'Interact',
    'F (구입은 마우스로 · 창 나가기는 ESC)': 'F (buy with mouse · ESC closes windows)',
    '물속에서': 'Underwater',
    'F 채집 · ↑ 떠오르기 · ↓ 잠수 · ←→ 헤엄 · 수면에서 F 나가기': 'F gather · ↑ rise · ↓ dive · ←→ swim · F at surface to exit',
    'M (또는 🗺 배지)': 'M (or the 🗺 badge)',
    '왼쪽 아래': 'Bottom left',
    '🎒 자산 · 🗺 지도 · 🎵 음악': '🎒 items · 🗺 map · 🎵 music',
    '오른쪽 위': 'Top right',
    '⏭ 다음 곡 · ↻ 새로 시작 · 💾 저장': '⏭ next song · ↻ restart · 💾 save',
    // 지도
    '이장님 상점': "Mayor\'s Store",
    '마구간': 'Stable',
    '내 집': 'My house',
    '헌집': 'Old house',
    '포구': 'Harbor',
    '무남이네': "Munam's place",
    '루루': 'Lulu',
    '루루의 땅': "Lulu's land",
    '루루가 빌린 밭': 'Rented field',
    '이장님 밭': "Mayor\'s field",
    '빌린 밭': 'Rented field',
    '망사리': 'Net bag',
    // 밭 팻말에 이름만 홀로 찍힐 때 (문장 속에서는 the east field 로 나갑니다)
    '동쪽땅': 'East field',
    '서쪽땅': 'West field',
    '남쪽땅': 'South field',
    '북쪽땅': 'North field',
    // 버튼에 손을 올리면 뜨는 설명
    '처음부터 다시하기': 'Start over',
    '저장하기': 'Save',
    '자산 (갖고 있는 아이템)': 'Items you own',
    '지도 (M)': 'Map (M)',
    '배경음악': 'Background music',
    'M 키나 화면을 누르면 닫힙니다': 'Press M or tap to close',
    '두 손가락으로 벌리면 확대 · 바깥을 누르면 닫힘': 'Pinch to zoom · tap outside to close',
    '휠로 확대 · 끌어서 이동 · M 키로 닫기': 'Wheel to zoom · drag to pan · M to close',
    '제주경마': 'JEJU RACE',
    '최대상금 1천만원!!': 'Top prize ₩10,000,000!!',
    // 대화·창 공통
    '누르면 다음': 'Tap for next',
    '관광지라 물가가 비싸구나 ㅠㅠ': 'Tourist-town prices... ouch',
    '경주 준비 중…': 'Getting the race ready…',
    '무남이와의 추억': 'A memory with Munam',
    '루루의 이야기': "Lulu's story",
    '이장님': 'Mayor',
    '해녀 할망': 'Haenyeo granny',
    '돌하르방': 'Dol hareubang',
    '무남이': 'Munam',
    // 안내 배지 (고정 문구)
    '상점 안': 'Inside the store',
    '물건 앞에 서면 살 수 있어요 (문 쪽으로 가면 밖으로)': 'Stand by an item to buy it (walk to the door to leave)',
    '아늑한 내 집': 'My cozy home',
    '문 쪽으로 걸어가면 밖으로 나갑니다': 'Walk to the door to go outside',
    '텅 빈 집': 'An empty house',
    '상점 안에서 가구를 사서 꾸며보세요 (문 쪽으로 가면 밖으로)': 'Buy furniture in the store to decorate (door to leave)',
    '점점 집다워지네요': 'Starting to feel like home',
    '태풍이 몰아쳐요': 'A typhoon is raging',
    '오늘은 물질을 쉽니다': 'No diving today',
    '포구 끝까지 걸어나가면 물질하러 들어갈 수 있어요': 'Walk out to the end of the harbor to start diving',
    '대신 숨이 빨리 차요': 'But your breath runs out faster',
    '망사리를 두고 왔어요': 'You left your net bag behind',
    '메고 와야 물질할 수 있어요': 'You need it on your back to dive',
    '망사리가 있어야 물질합니다': 'You need a net bag to dive',
    '이장님이 문을 열어줍니다': 'The mayor opens the door',
    '이장님이 오고 계세요': 'The mayor is on his way',
    '문 앞에서 잠깐 기다려주세요': 'Wait by the door a moment',
    '잠깐만요': 'One moment',
    '이장님이 계세요': 'The mayor is here',
    '마구간이 비었어요': 'The stable is empty',
    '이장님 만물상 앞에 새 말이 와 있어요': 'A new pony waits by the store',
    '오늘 몫은 다 줬어요': 'Fed for today',
    '오늘 아직 안 먹였어요': 'Not fed yet today',
    '조랑말한테 당근을 주세요': 'Give your pony a carrot',
    '당근은 이장님 상점에서': 'Carrots are at the store',
    '내일 또 주세요': 'Feed again tomorrow',
    '옆 팻말에서 출전!': 'Enter at the sign next door!',
    // ----- 간판 (캔버스에 그리는 글씨) -----
    '이장님 만물상': 'Mayor\'s Store',
    '제주택배 :': 'Jeju Parcel:',
    '이장님네 분소': 'Mayor\'s Branch',
    '배달문의 : 064-XXX-XXXX': 'Delivery: 064-XXX-XXXX',
    '제주감귤': 'Jeju Citrus',
    '팝니다': 'For Sale',
    '50,000원': '₩50,000',
    '나가는 곳': 'Exit',
    '귤상자 두는 곳': 'Crate Drop Zone',
    '5개마다 두 배 · 20개까지': 'Price doubles every 5 · up to 20',
    '컨테이너 창고를 사면 열립니다': 'Unlocks when you buy the container',
    '해녀물질': 'Haenyeo Diving',
    // ----- 집·상점 드나들기 -----
    '텅 빈 집… 맨땅이라도 몸 누일 곳은 되네요': 'An empty house... but at least a floor to lie on',
    '내 집에 왔어요': 'Home sweet home',
    '어서 오세요! 물건 앞에서 사면 됩니다': 'Welcome! Stand by an item to buy it',
    '다 고쳤어요. 좋은 집이네요!': 'All repaired. What a fine house!',
    '…이 집도 곧 카페가 된다고 한다': '...They say this house will become a cafe soon',
    // ----- 할망 경고·물질 -----
    '욕심내민, 바당이 데려간다.': 'Get greedy, and the sea takes you.',
    // ----- 물질하러 갈 때마다 순서대로 나오는 할망 잔소리 -----
    '해녀옷 입었다고 해녀 다 된 줄 알암냐?': 'You put on a wetsuit and think you\'re a haenyeo already?',
    '육지것아, 숨 참는다고 오래 잠수허는 게 아니여.': 'Mainlander, just holding your breath doesn\'t make you dive longer.',
    '허우적허우적 허지 말앙 천천히 들어가.': 'Stop flailing about and go down slowly.',
    '그렇게 허면 전복이 니 얼굴 보고 도망가겄다.': 'Dive like that and the abalone will take one look at your face and flee.',
    '눈은 뒀다가 뭐햄? 성게가 발로 걸어오길 기다리냐?': 'What are your eyes for? Waiting for the sea urchins to walk over on foot?',
    '바당에 들어오면서 물때도 안 보고 왔쪄?': 'You came to the sea without even checking the tide?',
    '제주도남자는 만나지말어랑': 'Don\'t you go falling for a Jeju man, now.',
    '욕심내지 말앙 딱 먹을 만큼만 하라.': 'Don\'t be greedy. Take only as much as you\'ll eat.',
    '니가 잡는 건지 바당이 니를 잡는 건지 모르켜.': 'Hard to tell if you\'re catching the sea or the sea is catching you.',
    '물질허러 왔으믄 물질이나 햄쪄. 바당 구경허러 왔나?': 'If you came to dive, then dive. Did you come to sightsee the sea?',
    '그물은 그렇게 잡아당기는 게 아니여. 찢어지믄 누가 고칠 건디?': 'That\'s not how you pull a net. Who\'s going to mend it when it tears?',
    '물 밖에선 그렇게 씩씩허더니 바당만 들어가믄 겁쟁이가 됐네.': 'So bold on land, but a coward the moment you enter the water.',
    '숨비소리도 제대로 못 내면서 해녀허겠다고?': 'You can\'t even manage a proper sumbisori breath-whistle, and you want to be a haenyeo?',
    '오늘은 물질 그만허라. 니 얼굴이 벌써 지쳤쪄.': 'Stop diving for today. Your face is already worn out.',
    '물질 끝나믄 장비부터 정리허라. 누가 대신해줄 줄 알았나?': 'When you finish, tidy your gear first. Did you think someone would do it for you?',
    '제주 와서 해녀허겠다고 허더니 밥은 또 육지식으로 먹네.': 'Came to Jeju to be a haenyeo, yet you still eat like a mainlander.',
    '바당에선 혼자 잘난 척허면 안 돼. 서로 봐줘야 사는 거여.': 'In the sea you can\'t show off alone. We survive by watching over each other.',
    '니가 잡은 거 보라. 이걸 누구 코에 붙이젠?': 'Look at your haul. Who is that supposed to feed?',
    '내가 몇 번 말허냐. 바당은 니 놀이터가 아니여.': 'How many times must I say it. The sea is not your playground.',
    '그래도 오늘은 좀 해녀 다워졌쪄. 내일은 더 잘허라.': 'Still, today you looked a bit more like a haenyeo. Do better tomorrow.',
    '욕심내민 바당이 데려간다': 'Get greedy, and the sea takes you',
    '의식을 잃고 닥터헬기가 나를 구조해줬다.': 'I blacked out. A rescue helicopter carried me back.',
    '망사리도 놓쳤어요': 'You lost your net bag too',
    '망사리가 있어야 물질할 수 있어요': 'You need a net bag to dive',
    '망사리를 내려놨어요': 'You set down the net bag',
    '어디 뒀는지는 전체 지도에서 봅니다': 'Check the full map to see where it is',
    '망사리를 챙겼어요': 'You picked up the net bag',
    '망사리(내려둠)': 'Net bag (set down)',
    '왼쪽 화면을 위로 끌면 떠오르고 아래로 끌면 잠수': 'Drag the left side up to rise, down to dive',
    '돌하르방 앞으로 가면 할 일을 알려줄 거예요': 'The dol hareubang will tell you what to do',
    '가까이 가보세요': 'Walk up close',
    // ----- 상점·구입 -----
    '새 지붕 구입! 지붕이 환한 새 짚빛이 됐어요': 'New roof! Bright fresh thatch up top',
    '대문 구입! 뚫려 있던 문간에 문짝을 달았어요': 'Gate purchased! The open doorway has a door now',
    '창문 구입! 시커먼 구멍에 창을 달았어요': 'Window purchased! The dark hole has glass now',
    '색을 고르세요': 'Pick a color',
    '눌러서 결정': 'Tap to confirm',
    '골라 살 수 있음': 'Pick and buy',
    '구입': 'Buy',
    '닫기': 'Close',
    '준비 중': 'Coming soon',
    '가을이면 밭이 하얗게 됩니다': 'The field turns white in autumn',
    '한 포기에 여러 알이 달립니다': 'Each plant bears several tubers',
    '제주 겨울 무. 오래 기다리는 만큼 크게 법니다': 'Jeju winter radish. The long wait pays off big',
    '한 번 심으면 베지 않고 날마다 계속 땁니다': 'Plant once and pick leaves every day',
    // ----- 밭 -----
    '또 1년 부칠 수 있습니다': 'Good for another year',
    '씨앗을 사다 심으면 됩니다': 'Buy seeds and plant them',
    '수확할 때 절반은 이장님 몫입니다': 'Half of each harvest goes to the mayor',
    '밭을 도로 사왔어요': 'You bought the field back',
    '두 번 산 땅이라 더 내 것 같습니다': 'Bought twice over, it feels truly yours',
    '내 땅이 생겼어요': 'The land is yours now',
    '이제 이 밭에서 나는 건 전부 루루 몫입니다': 'Everything this field grows is all Lulu\'s now',
    '전부 내 몫입니다': 'All of it is yours',
    '되사야 내 재산이 됩니다': 'Buy it back to make it your asset',
    '빌리면 거둘 때 절반이 이장님 몫으로 나갑니다': 'While renting, half of every harvest goes to the mayor',
    // ----- 감귤·택배·컨테이너 -----
    '상점 문 앞에 놓아뒀습니다': 'Left outside the shop door',
    '가득 찬 상자를 컨테이너 앞 「귤상자 두는 곳」에 쌓아두세요': 'Stack full crates at the Crate Drop Zone by the container',
    '이제 감귤을 보관해놨다가 값이 비쌀 때 팝니다': 'Now you can store tangerines and sell when prices are high',
    '귤 상자 하나에 2만원': '₩20,000 per crate',
    '귤 상자 하나에 2만원으로 팝니다': 'Sells crates at ₩20,000 each',
    '값이 비쌀 때 팔아 상자 하나에 2만원': 'Sell high - ₩20,000 per crate',
    '컨테이너 창고': 'Container Storage',
    '택배사': 'Parcel office',
    // ----- 자산 가방·기타 -----
    '🎒 자산': '🎒 Assets',
    '🌱 일일 할 일': '🌱 Daily to-do',
    '💛 무남이와의 이야기': '💛 The Story with Munam',
    '밭을 되사오면 이야기가 이어져요': 'Buy the field back to continue the story',
    '되사왔어요! 자산 1억을 다시 채우면 이야기가 이어져요': 'Bought back! Rebuild ₩100,000,000 in assets to continue the story',
    '되사왔어요! 무남이에게 가서 말을 걸어보세요': 'Bought back! Go talk to Munam',
    '무남이에게 가서 말을 걸어보세요': 'Go talk to Munam',
    '밭도 되찾았어요': 'The field is yours again',
    '현금을 집과 땅으로 바꾸면': 'Turn your cash into house and land',
    '무남이와의 이야기가 이어져요': 'and the story with Munam continues',
    '망사리는 바깥에서 내려놓을 수 있어요': 'You can only set the net bag down outside',
    '이야기 완결': 'Story complete',
    '새 이야기! 무남이를 찾아가 보세요': 'A new story! Go see Munam',
    '다음 이야기: 자산': 'Next story: assets',
    '꿈을 이뤘어요!': 'Dream achieved!',
    '총자산 1억을 넘기면 루루의 꿈 완성': 'Reach ₩100,000,000 in assets to complete Lulu\'s dream',
    '총자산 1억을 넘기면 루루의 꿈 완성 (현금 제외)': 'Reach ₩100,000,000 in assets to complete Lulu\'s dream (cash excluded)',
    '바깥을 누르면 닫힘': 'Tap outside to close',
    '🌱 아직 빌린 땅이 없어요': '🌱 No rented land yet',
    '밭 팻말 앞에서 이장님께 년세를 냅니다': 'Pay the mayor at a field sign to rent one',
    '귤': 'Tangerines',
    '밭': 'Field',
    '페인트': 'Paint',
    '조랑말 앞까지 더 가까이 가세요': 'Get closer to the pony',
    '이장님 만물상 앞에 새 말이 와 있대요': 'A new pony is waiting by the Mayor\'s Store',
    '무남이가 수트를 빼입고 어디론가 나선다': 'Munam heads out somewhere in his suit',
    '처음부터 다시할까요?\n저장된 진행이 모두 지워집니다.': 'Start over from the beginning?\nAll saved progress will be erased.',
    '⛶ 전체화면 끄기': '⛶ Exit fullscreen',
    '다음 곡': 'Next song',
    '⛶ 전체화면으로 보기': '⛶ Fullscreen',
    '전체화면 끄기': 'Exit fullscreen',
    '전체화면': 'Fullscreen',
    // ----- 페인트·바닥재·벽지 색 이름 -----
    '귤빛 노랑': 'Tangerine yellow',
    '노을 주황': 'Sunset orange',
    '바다 하늘': 'Sea sky',
    '들판 연두': 'Field green',
    '동백 분홍': 'Camellia pink',
    '깊은 바다': 'Deep sea',
    '벽돌 빨강': 'Brick red',
    '까망 먹빛': 'Ink black',
    '보리 베이지': 'Barley beige',
    '밝은나무': 'Light wood',
    '붉은흙': 'Red clay',
    '먹빛': 'Ink gray',
    '모래빛': 'Sand',
    '라벤더': 'Lavender',
    '미색': 'Ivory',
    '민트': 'Mint',
    '레몬': 'Lemon',
    '대문': 'Gate',
    // ----- 해산물·과일 한 단어 표시 -----
    '문어': 'Octopus',
    '해삼': 'Sea cucumber',
    '전복': 'Abalone',
    '소라': 'Turban shell',
    '미역': 'Seaweed',
    '감귤': 'Tangerine',
    '황금향': 'Hwanggeumhyang',
    '한라봉': 'Hallabong',
    '천혜향': 'Cheonhyehyang',
    '경마': 'Pony race',
    '절반은 이장님 몫입니다': 'Half goes to the mayor',
    '씨앗은 이장님 상점에서 삽니다': 'Buy seeds at the store',
    '씨앗을 심으세요': 'Plant some seeds',
    '거둘 때가 됐어요': 'Ready to harvest',
    '년세가 끝났어요': 'Rent has ended',
    '페인트 보유 중': 'Paint in hand',
    '집 앞에서 칠하세요': 'Paint at the house',
    '보유 중': 'Owned',
    '곧 카페가 들어선다는 내 집… · 문 앞에 서면 안으로': 'My house, soon to be a café… · stand at the door to enter',
    // 알림 (고정 문구)
    '귤 상자를 옆에 끌고 와야 담을 수 있어요': 'Drag a crate next to you to fill it',
    '꼴등… 오늘은 운이 없었네요': 'Last place… no luck today',
    '말이 배고파서 죽을지도 몰라요': 'Your pony is starving and may die',
    '망사리 구입! 등에 메고 포구로 가면 물질할 수 있어요': 'Net bag bought! Head to the harbor to dive',
    '망사리가 가득 찼어요 · 뭍으로!': 'Net bag full · back to shore!',
    '물질 시작! 숨 조심하세요': 'Diving! Watch your breath',
    '뭍으로 나왔어요': 'Back on shore',
    '열 칸을 가득 채워야 팔 수 있어요': 'Fill all ten slots to sell',
    '상자가 가득 찼어요 · 택배사로!': 'Crate full · to the parcel depot!',
    '상자가 가득 찼어요!': 'Crate full!',
    '상자가 비었어요 · 귤을 담아 오세요': 'Crate empty · go pick tangerines',
    '아침이에요': 'Good morning',
    '말에게 당근을 하나 주세요': 'Give your pony a carrot',
    '오늘도 말먹이를 주지 않으면 말이 죽어요': 'Feed your pony today or it will die',
    '이미 페인트가 있어요': 'You already have paint',
    '저장했어요': 'Saved',
    '조랑말이 굶어 죽었습니다…': 'Your pony starved to death…',
    '조랑말이 있어야 경마에 나갑니다': 'You need a pony to race',
    '티비다이가 먼저 있어야 놓을 수 있어요 (매장 가운데 진열)': 'You need the TV stand first (center of the store)',
    '페인트가 필요해요': 'You need paint',
    '상점 안 인테리어 코너에서 색을 골라 사 오세요': 'Pick a color at the interior corner in the store',
    '페인트칠이 끝났어요': 'Painting done',
    '거뭇하던 벽이 환해졌습니다': 'The dark walls brightened up',
    '당근이 없어요': 'No carrots',
    '전력으로 달린 말이 지쳤어요': 'Your pony is worn out from the race',
    '하루에 당근 하나씩 먹여주세요': 'Feed one carrot a day',
    '제주경마 출전': 'Enter the Jeju race',
    '출전하시겠습니까': 'Enter the race?',
    // 물건 이름
    '침대': 'Bed', '의자': 'Chair', '옷장': 'Wardrobe', '러그': 'Rug',
    '스탠드 조명': 'Floor lamp', '간이침대': 'Folding cot', '책장': 'Bookshelf',
    '벽걸이 그림': 'Wall painting', '창문': 'Window', '텔레비전': 'TV',
    '티비다이': 'TV stand', '부엌 찬장': 'Kitchen cabinet', '아일랜드 식탁': 'Kitchen island',
    '소파': 'Sofa', '싱크대': 'Sink', '소파 테이블': 'Coffee table', '잔디밭': 'Lawn',
    '야자수': 'Palm tree', '조경석': 'Garden stone', '마당 조명': 'Yard light', '소철나무': 'Cycad',
    '당근': 'Carrot', '컨테이너': 'Container', '페인트': 'Paint',
    '메밀': 'Buckwheat', '감자': 'Potato', '월동무': 'Winter radish', '차나무': 'Tea tree',
    // 상점 물건·색 이름
    '씨앗': 'Seeds', '감귤상자': 'Tangerine crate', '새 지붕': 'New roof',
    '외벽 페인트': 'Exterior paint', '바닥재': 'Flooring', '벽지': 'Wallpaper',
    '냉장고': 'Fridge', '세탁기': 'Washing machine',
    '크림': 'Cream', '하늘': 'Sky', '연분홍': 'Blush pink', '연두': 'Light green',
    '살구': 'Apricot', '올리브': 'Olive', '원목': 'Natural wood', '자주 포도': 'Grape',
    '잿빛': 'Ash gray', '쪽빛': 'Indigo', '청록': 'Teal', '체리목': 'Cherry wood',
    '한라 초록': 'Halla green', '현무암': 'Basalt', '회벽 하양': 'Plaster white',
    '흰대리석': 'White marble', '흰색': 'White',
    // 구입 창
    '눌러서 구입': 'Tap to buy',
    '먼저 하나 골라주세요': 'Pick one first',
    '먼저 색을 골라주세요': 'Pick a color first',
    '관광지라 물가가 비싸구나 ㅠㅠ (가격을 누르면 구입 · ESC 나가기)': 'Tourist-town prices... ouch (tap the price to buy · ESC to leave)',
    '관광지라 물가가 비싸구나 ㅠㅠ (아래 단추를 누르면 결정 · ESC 나가기)': 'Tourist-town prices... ouch (tap the button below to confirm · ESC to leave)',
    '심으면 그 밭은 못 바꿔요': 'Locks that field forever',
    '밭 하나에 심을 수 있어요': 'Plants one field',
    '없음': 'None',
    '한 번 심으면 못 바꿔요': 'Permanent once planted',
    '이 땅 사기': 'Buy this land',
    '잎 따기': 'Pick leaves',
    '오늘 몫을 거둡니다': "Harvest today's share",
    '되사오기': 'Buy back',
    '년세 내고 빌리기': 'Rent for a year',
    '내 땅입니다. 거둔 것은 전부 루루 몫입니다': 'Your land. The whole harvest is yours',
    '빌린 땅입니다. 거둘 때 절반이 이장님 몫으로 나갑니다': 'Rented land. Half of each harvest goes to the mayor',
    '태풍이 와요': 'A typhoon is coming',
    '내 집! 문 앞에 서면 안으로 들어갑니다': 'My house! Stand at the door to go inside',
    // 인트로 — 루루의 이야기
    '루루는 제주에서 태어난 고양이가 아니다.\n원래는 서울에서 살았다.': 'Lulu was not born on Jeju.\nShe used to live in Seoul.',
    '스무 살의 루루가 눈여겨본 서울의 작은 아파트는 5억이었다.\n"10년만 열심히 모으면, 대출 끼고 살 수 있을 거야."': 'At twenty, the small Seoul apartment Lulu had her eye on cost 500 million won.\n"Ten years of hard saving, plus a loan, and it could be mine."',
    '10년을 쉬지 않고 일하고 아끼고 모았으나,\n서른 살이 된 루루의 전 재산은 겨우 4천만원.': 'She worked, scrimped, and saved for ten years without rest,\nyet at thirty, everything Lulu had came to a mere 40 million won.',
    '그사이 그 아파트는 20억이 되어 있었다.\n집값은 월급보다, 저축보다, 꿈보다 훨씬 빨랐다.': 'Meanwhile, that apartment had become 2 billion won.\nHousing prices outran her paycheck, her savings, and her dreams.',
    '루루는 꿈을 접었다.\n그리고 마지막 희망을 품고\n마을 이장이 소개해 준 제주 외딴 마을의 빈집 하나를, 전 재산을 털어 샀다.': 'Lulu folded that dream away.\nCarrying one last hope,\nshe spent everything she had on an empty house in a remote Jeju village, introduced by the mayor.',
    '집은 비가 새고, 전기는 끊겼고, 잡초는 허리까지 자라 있었다.\n하지만 루루는 웃었다.': 'The roof leaked, the power was cut, and the weeds stood waist-high.\nBut Lulu smiled.',
    '"적어도… 여긴 내 집이다."': '"At least… this one is mine."',
    '서른 살, 루루의 두 번째 인생이 시작된다.\n언젠가 이 낡은 집을 제주 최고의 집으로 만드는 것\n그것이 루루의 새로운 꿈이다.': 'At thirty, Lulu\'s second life begins.\nSomeday she will make this old house the finest home on Jeju.\nThat is her new dream.',
    // 돌하르방 튜토리얼
    '안녕하세요! 저는 이 섬을 지키는 돌하르방입니다. 섬에서 사는 법을 알려드릴게요.': 'Hello there! I am the dol hareubang who watches over this island. Let me show you how life works here.',
    '귤나무 앞에서 (F)를 누르면 귤을 딸 수 있어요. 상자를 가득 채워 택배사에 가져가면 한 박스 1만원에 팔립니다.': 'Press (F) in front of a tangerine tree to pick fruit. Fill a crate and bring it to the parcel office, and it sells for ₩10,000 a crate.',
    '상점 문 앞에 서면 안으로 들어갑니다. 당근을 사서 말에게 매일 한 개씩 먹여주세요\n굶기면 위험해요!': 'Stand at the store door to go inside. Buy carrots and feed your pony one every day.\nStarving it is dangerous!',
    '마당 사방으로 동쪽땅·서쪽땅·남쪽땅·북쪽땅이 놀고 있어요. 전부 이장님 땅입니다.\n밭 앞 팻말에서 (F)를 누르면 한 필지씩 빌립니다. 년세는 한 필지에 50만원이에요.': 'The east, west, south, and north fields around your yard sit idle. They all belong to the mayor.\nPress (F) at a field sign to rent a plot. Rent is ₩500,000 a year per plot.',
    '빌린 밭에는 상점에서 산 씨앗을 심습니다. 며칠 지나 다 자라면 팻말 앞에서 거두세요\n다만 절반은 이장님 몫으로 나갑니다.': 'Plant seeds from the store in a rented field. When the crop is grown, harvest it at the sign.\nHalf goes to the mayor, though.',
    '소작료가 아까우면 밭을 아예 살 수도 있어요. 목돈이 들지만, 그 뒤로는 거둔 것이 전부 루루 몫이 됩니다.': 'If the sharecropping fee stings, you can buy a field outright. It costs a lot, but from then on the whole harvest is yours.',
    '물질을 하려면 상점에서 망사리를 사고, 포구 끝까지 걸어가세요. 물속에서는 ↑ 떠오르기 · ↓ 잠수 · ←→ 헤엄이에요. 숨이 다하면 죽을 위험이 있어요!': 'To dive, buy a net bag at the store and walk out to the end of the harbor. Underwater: ↑ rise · ↓ dive · ←→ swim. If your breath runs out, you can die!',
    '남쪽 언덕의 돌집이 루루의 집입니다. 문 앞에 서면 들어가지고, 가구를 사서 꾸밀 수도 있어요.': 'The stone house on the southern hill is your home. Stand at the door to enter, and you can buy furniture to decorate.',
    '당근은 하루에 한 개, 애정도 하루에 하나씩 쌓입니다.\n애정이 3이 되면 마구간 옆 팻말에서 경마에 나갈 수 있어요.': 'One carrot a day, one point of affection a day.\nAt affection 3, you can enter the pony race at the sign by the stable.',
    '말을 일주일동안 굶기면 말이 죽습니다.\n그때는 이장님 만물상 앞에서 새 말을 살 수 있어요. 좋은 하루 되세요!': 'Starve your pony for a week and it dies.\nThen you can buy a new one in front of the Mayor\'s Store. Have a good day!',
    // 이장님 대사
    '말이 그리 되다니… 마음이 아프네.': 'So the pony is gone… my heart aches.',
    '마침 우리 가게 앞에 한 마리 매어 뒀네. 순하고 발도 빠른 놈일세.': 'As it happens, I have one tied up in front of my store. Gentle, and quick on his feet.',
    '이번엔 하루에 당근 하나씩, 꼭 챙겨주게나.': 'This time, one carrot a day, without fail.',
    '벌써 한 해가 다 갔구먼.': 'A whole year gone already.',
    '팻말 앞에서 내면 되네.': 'You can pay at the field sign.',
    '자네 밭 말인가? 이제 내 땅일세.': 'Your field? It is my land now.',
    '자네 신랑 될 사람이 급하다길래 받아준 걸세.\n좋은 일 한 셈 아닌가.': 'Your husband-to-be said he needed money fast, so I took it off his hands.\nA good deed, would you not say?',
    '되사겠다면 천만원. 그게 값일세.': 'Buy it back for ₩10,000,000. That is the price.',
    '…빌려 쓰는 거면 50만원에 해줌세.\n섭섭잖게.': '…Or rent it for ₩500,000.\nNo hard feelings.',
    '자네 말이 며칠째 울던데… 당근은 줬는가?': 'Your pony has been crying for days… have you fed it?',
    '산 것은 끼니를 거르면 못 버티네. 어서 가보게.': 'Living things cannot skip meals. Go, quickly.',
    '오, 귤이 실하네! 상자가 가득이야.': 'Oh, fine tangerines! The crate is full.',
    '택배사 앞으로 가져오게\n하나하나 보고 후하게 쳐줌세.': 'Bring it to the parcel depot.\nI will look them over and pay you well.',
    '오늘 말한테 당근은 줬는가?': 'Did you feed your pony today?',
    '아침마다 한 개씩\n그게 말 키우는 법이라네.': 'One every morning.\nThat is how you raise a pony.',
    '밤바람이 차다, 얼른 들어가게.': 'The night wind is cold. Get inside, quick.',
    '별 보며 걷는 것도 제주 맛이긴 하지만 말이야.': 'Though a walk under the stars is part of Jeju, I suppose.',
    '물질을 해보고 싶으면 상점 안에서 망사리부터 사게.': 'If you want to try diving, buy a net bag in the store first.',
    '망사리 없이 바다에 드는 건 안 될 말이지.': 'Going into the sea without one is out of the question.',
    '섬에 놀리는 밭이 여럿 있네. 다 내 땅이지.': 'There are idle fields all over the island. All mine, of course.',
    '팻말 앞에서 말만 하면 한 필지씩 빌려줌세.': 'Say the word at a field sign and I will rent you a plot.',
    '동쪽땅 서쪽땅 남쪽땅 북쪽땅,\n마당 사방에 하나씩 있네.': 'East, west, south, and north fields,\none on each side of your yard.',
    '년세는 어느 땅이든 한 필지에 50만원일세.': 'Rent is ₩500,000 a year per plot, any of them.',
    '씨앗은 우리 상점에 있고,\n거둘 때 절반만 나한테 주면 되네.': 'Seeds are in my store.\nJust give me half at harvest.',
    '…절반이 많다고? 땅값이 원래 그런 걸세.': '…Half is too much? That is what land costs.',
    '자네 밭에 거둘 때가 된 게 있던데.': 'Something in your field looks ready to harvest.',
    '팻말 앞에 서서 거두게.\n내 몫은 알아서 떼어가겠네.': 'Harvest it at the sign.\nI will take my share myself.',
    '혼저 옵서예~ 오늘도 부지런하구만.': 'Honjeo opseoye~ hard at work again today.',
    '귤은 알이 굵을 때 따야 제값을 받네.': 'Pick tangerines when they are plump, and they fetch a proper price.',
    '우리 섬 바다는 인심이 좋아. 욕심만 안 부리면 말이야.': 'Our island sea is generous. As long as you are not greedy.',
    '집은 좀 고쳐놨는가? 집이 훤해야 복도 들어온다네.': 'Fixed up the house a bit? A bright home invites good fortune.',
    '자네 말, 요즘 눈빛이 다르던데? 경마에 한번 내보내 보게.': 'Your pony has a different look in its eyes lately. Try entering it in a race.',
    '바닥재랑 벽지도 들여놨네. 상점 왼쪽을 둘러보게.': 'I stocked flooring and wallpaper too. Have a look on the left side of the store.',
    '자네 집 말인가? …좋은 집이지. 아무렴, 좋은 집이고말고.': 'Your house? …A fine house. Yes, yes, a fine house indeed.',
    '(이장님은 왠지 눈을 피했다)': '(For some reason, he would not meet Lulu\'s eyes)',
    '땅은 빌려 쓰는 것보다 사두는 게 낫지.': 'Better to own land than to rent it.',
    '뭐, 목돈이 있어야 하는 이야기지만 말이야.': 'Well, if you have the lump sum, that is.',
    '소작료가 아깝거든 밭을 사버리게.': 'If the sharecropping fee stings, just buy the field.',
    '그럼 거둔 게 다 자네 것이 되지 않는가.': 'Then the whole harvest is yours, is it not?',
    '잘 골랐네. 순한 놈일세.': 'Good choice. A gentle one.',
    '마구간에 매어 두게. 하루에 당근 하나면 되네.': 'Tie him up at the stable. One carrot a day is all he needs.',
    '…이번엔 하루도 거르지 말게나.': '…This time, do not skip a single day.',
    // 해녀 할망
    '야이, 태풍 온댄허는데 무신 바당이여! 미쳔!': 'Child, a typhoon is coming! What sea? Are you mad!',
    '까불다 이어도 가주.': 'Fool around out there and you\'ll end up in Ieodo.',
    // 컨테이너 설명
    '사두면 감귤을 서늘하게 갈무리했다가 값이 비쌀 때 팝니다.\n귤 상자 하나에 1만원이던 것이 2만원이 됩니다.': 'Buy it and you can keep tangerines cool and sell when prices are high.\nA crate worth ₩10,000 becomes ₩20,000.',
    '앞마당 「귤상자 두는 곳」에 가득 찬 상자를 모아두세요.\n다섯 개 단위로만 부치는 대신, 다섯 개마다 값이 두 배가 됩니다.': 'Stack full crates at the Crate Drop Zone in the front yard.\nYou ship in sets of five, and every five doubles the price.',
    '5상자면 두 배, 10상자면 네 배, 15상자면 여덟 배,\n20상자면 열여섯 배. 한 번에 스무 상자까지 받습니다.': 'Five crates pay double, ten pay four times, fifteen pay eight times,\ntwenty pay sixteen times. Up to twenty crates at once.',
    '대신 컨테이너를 사고 나면 한 상자씩은 못 팝니다.\n다섯 개를 채워야 이장님이 받아줍니다.': 'But once you own the container, single crates no longer sell.\nThe mayor only takes sets of five.',
    '한 번 더 누르면 삽니다.': 'Press once more to buy.',
    // 무남이 — 만남의 단계
    '루루: 안녕하세요.': 'Lulu: Hello.',
    '(처음으로 대답이 돌아왔다)': '(For the first time, an answer came back)',
    '인생 뭐 있냥…\n오늘도 바람 좋네.': 'What\'s life anyway…\nNice breeze again today.',
    '루루: 잘생겼다.': 'Lulu: He is handsome.',
    '루루: 근데 왜 이제 와서 아는 척이지.': 'Lulu: But why acknowledge me only now?',
    '이 집에 사는 사람이 당신이오?': 'Are you the one living in this house?',
    '혼자 고치는 모양이던데. 대단하군.': 'Fixing it up alone, I see. Impressive.',
    '나는 무남이라 하오.\n하는 일은… 뭐, 특별히 없소.': 'They call me Munam.\nAs for what I do… well, nothing in particular.',
    '(마을 사람들도 무남이가 무슨 일을 하는지 모른다고 했다)': '(Even the villagers said no one knows what Munam does)',
    '루루: 백수면 어때.\n잘생겼으면 됐지.': 'Lulu: So what if he\'s jobless.\nHandsome is enough.',
    '부엌이 훌륭하군. 이런 건 아무나 못 갖추지.': 'A splendid kitchen. Not everyone can manage this.',
    '…배가 좀 고픈데.': '…I am a little hungry.',
    '(무남이는 루루가 차린 밥상을 아주 맛있게 먹었다)': '(Munam thoroughly enjoyed the meal Lulu made)',
    '잘 먹었소. 손맛이 좋군.': 'That was a fine meal. You have a good hand.',
    '루루: 얻어먹으면서 저렇게 당당할 일인가.\n…근데 왜 기분이 좋지.': 'Lulu: How can he mooch with such confidence.\n…So why does it make me happy?',
    '소파가 편안하군. 낮잠 자기 딱 좋겠어.': 'A comfortable sofa. Perfect for a nap.',
    '(무남이는 정말로 낮잠을 잤다)': '(Munam really did take a nap)',
    '…그런데 너 오늘은 물질하러 안 가냐?': '…By the way, no diving today?',
    '루루: 방금 자고 일어난 사람이 할 말인가.': 'Lulu: Says the man who just woke up.',
    '루루: 그런데 이 집에 누가 있다는 게…\n생각보다 나쁘지 않다.': 'Lulu: Still, having someone in this house…\nisn\'t as bad as I thought.',
    '오늘은 바다나 보러 가지.': 'Let us go look at the sea today.',
    '(둘은 말없이 바닷가를 걸었다)': '(The two walked the shore in silence)',
    '…나는 가진 게 없소.': '…I have nothing to my name.',
    '그래도 옆에 있는 건 할 수 있지.': 'But I can stay by your side.',
    '(무남이가 루루의 이마에 입을 맞췄다)': '(Munam kissed Lulu on the forehead)',
    '루루: 포장이 저 정도면……\n한 번 만나볼 만하지 않나?': 'Lulu: With looks like that……\nis he not worth a try?',
    '집이 다 됐군. 참 좋은 집이오.': 'The house is finished. A truly fine home.',
    '…이 집에서, 나랑 같이 살지 않겠소?': '…In this house, would you live with me?',
    '(무남이는 반지 대신 귤 하나를 내밀었다)': '(Instead of a ring, Munam held out a tangerine)',
    '반지는… 다음 달에 사주겠소.': 'The ring… I will buy it next month.',
    '루루: 다음 달에 무슨 돈이 생기는데.': 'Lulu: And what money arrives next month, exactly?',
    '루루: 그래도… 좋다고 해버렸다.': 'Lulu: And yet… I said yes.',
    // 무남이 — 잡담·무시·사과
    '좋은 날씨군.': 'Fine weather.',
    '오늘 날씨가 참 좋군.': 'Truly fine weather today.',
    '이런 날은 아무것도 안 하기 좋지.': 'A day like this is best spent doing nothing.',
    '밥은 먹었소?': 'Have you eaten?',
    '…나는 아직인데.': '…I have not.',
    '너 오늘은 물질하러 안 가냐?': 'No diving today?',
    '말밥은 줬니.': 'Did you feed the pony?',
    '경마 우승상금이 얼마라 그랬지?': 'What was the race prize money again?',
    '아니, 그냥 궁금해서 물어본 거요.': 'No, just curious. That is all.',
    '오늘 귤은 몇 상자 부쳤소?': 'How many crates did you ship today?',
    '…사랑하오. 그건 그거고.': '…I love you. That is beside the point.',
    '(무남이는 대답하지 않았다)': '(Munam did not answer)',
    '루루: 우리집이 너무 후져서 상대도 안 해주나.': 'Lulu: Is my house too shabby for him to even bother?',
    '루루: 집을 빨리 꾸며야겠다.': 'Lulu: I need to fix this place up, fast.',
    '루루: …안녕하세요.': 'Lulu: …Hello.',
    '(들리지 않는 걸까)': '(Can he not hear me?)',
    '루루: 저기, 안녕하세요.': 'Lulu: Um, hello.',
    '(무남이는 하늘만 보고 있었다)': '(Munam just stared at the sky)',
    '루루: 내가 뭐가 부족해서.': 'Lulu: What exactly am I lacking?',
    '루루: (오늘은 그냥 지나가자)': 'Lulu: (Just walk past today)',
    '루루: 돈부터 벌어야겠다.': 'Lulu: Money first.',
    '…밥은 먹었소?': '…Have you eaten?',
    '루루: 밭.': 'Lulu: The field.',
    '경마는 끊었소. 진짜요.': 'I quit the races. Truly.',
    '…돈이 없소.': '…I have no money.',
    '내가 일을 하겠소. 뭐든.': 'I will work. Anything.',
    '루루: 지금 그 말을 몇 번째 하는지 알아?': 'Lulu: Do you know how many times you\'ve said that?',
    '…세 번째쯤.': '…About the third.',
    // 혼잣말 (가구를 살수록 커지는 외로움)
    '이 큰 집에 나 혼자.': 'All alone in this big house.',
    '밥상을 차려도\n마주 앉을 사람이 없다.': 'I set the table,\nbut no one sits across from me.',
    '집은 점점 좋아지는데\n어쩐지 더 조용해진다.': 'The house keeps getting better,\nyet somehow quieter.',
    '언제까지 혼자 살 순 없잖아.': 'I can\'t live alone forever.',
    '집도 땅도 다 갖췄어요\n무남이에게 가보세요': 'The house and the land are yours.\nGo see Munam',
    '무남이가 요즘 뭔가 수상해요\n무남이에게 가보세요': 'Munam has been acting strange lately.\nGo see him',
    // ----- 무남이 미션 재구성판 (2026-08-12, 사용자 대본) -----
    '루루: 뭐하는 사람인데 저렇게 양복을 빼입고 있지. 근데 잘생겼다.......': 'Lulu: What kind of person dresses up in a suit like that. …But he is handsome.......',
    '루루: 돈이나 벌러가야겠다.': 'Lulu: I should go make some money.',
    '…음.': '…Hm.',
    '(또 대답을 안하네)': '(No answer again)',
    '우리집이 너무 후져서 상대도 안 해주나.': 'Is my house too shabby for him to even bother?',
    '혼자 집을 고치는 모양이던데. 대단하군.': 'Fixing up the house all alone, I see. Impressive.',
    '집고치는게 쉬운일이 아닌데 여자 혼자 대단하시네요.': 'Fixing a house is no easy task, and all on your own. Impressive, miss.',
    '루루: 저기 무슨일 하시는 분이세요?': 'Lulu: Um, what do you do for a living?',
    '하는 일은… 뭐, 특별히 없소.': 'As for what I do… well, nothing in particular.',
    '루루: 백수면 어때. 잘생겼으면 됐지.': 'Lulu: So what if he\'s jobless. Handsome is enough.',
    '밥은 먹었소? 나는 아직인데.': 'Have you eaten? I have not yet.',
    '배가 좀 고픈데.': 'I am a little hungry.',
    '매일 집고치느라 힘들텐데 오늘은 나랑 바다나 보러 가지.': 'You must be worn out fixing the house every day. Come look at the sea with me today.',
    '나는 가진 게 없소.': 'I have nothing to my name.',
    '집에 소파가 아주 편안하더군. 낮잠 자기 딱 좋겠어.': 'That sofa in your house is so comfortable. Perfect for a nap.',
    '루루: 집도 완성됐고 멋진 냥자친구도 생겼네. 저남자가 내남자라니!': 'Lulu: The house is done and I even have a fine cat boyfriend. That man is mine!',
    '근데 경마 우승상금이 얼마라 그랬지?': 'By the way, what was the race prize money again?',
    '아니, 그냥 궁금해서 물어본 거야.': 'No, I just asked out of curiosity.',
    '루루: 아니, 자기는 일도 안하면서 왜저렇게 잔소리야. 그래도 내 안부를 궁금해하는 사람이 있어서 좋다.': 'Lulu: Hey, you do not even work, so why all the nagging. …Still, it is nice to have someone who asks after me.',
    '오늘 귤은 몇 상자 부쳤어?': 'How many crates of tangerines did you ship today?',
    '아니, 사랑한다고. 관심보여주는건데 왜 화를 내.': 'No, I mean I love you. I am showing interest, so why get upset.',
    // 외로움 독백 (자산 1~5단계)
    '이제 돈버는건 익숙해졌는데 어쩐지 쓸쓸하네': 'I\'ve gotten used to making money, but somehow it feels lonely.',
    '집이 허전한데 고양이라도 키워볼까.': 'The house feels empty. Maybe I should get a cat.',
    '바닷가 그남자 누굴까?': 'That man at the shore… who is he?',
    '언제까지 혼자살순 없잖아.': 'I can\'t live alone forever.',
    '무남이는 매일 어딜 그렇게 가는거지?': 'Where does Munam go every day like that?',
    // 엔딩 — 배신
    '아침에 밭에 나가보니, 팻말이 하나 꽂혀 있었다.': 'In the morning, a new sign stood in the field.',
    '「이장님 밭 100평\n년세 50만원」': '「Mayor\'s field, 100 pyeong\nYearly rent ₩500,000」',
    '루루: …여기 제 밭인데요.': 'Lulu: …This is my field.',
    '이장님: "허, 지난주에 샀네. 자네 신랑 될 사람한테."': 'Mayor: "Ha. I bought it last week. From your husband-to-be."',
    '이장님: "급하게 현금이 필요하다길래\n내가 싸게 잘 받았지."': 'Mayor: "He needed cash in a hurry,\nso I got it cheap."',
    '루루: 수트 입고 맨날 어딜 가나 했더니.': 'Lulu: So that is where he went in that suit every day.',
    '비트코인 설명회였다': 'It was a Bitcoin seminar',
    '그런데 알고 보니 잡코인에 전재산을 넣은 것.': 'And it turned out he had put everything into some junk coin.',
    '무남이는 확신에 차 있었다.': 'Munam was full of conviction.',
    '이게 다음 비트코인이다. 아직 아무도 모르는 보석이야': 'This is the next Bitcoin. A gem nobody knows about yet',
    '비트코인 초기와 똑같다': 'It is exactly like early Bitcoin',
    '지금 1원이지만 100원이 될 수 있다': 'It is 1 won now, but it could hit 100 won',
    '루루: 그래서 밭을 왜 팔았는데?': 'Lulu: So why did you sell the field?',
    '코인 이름이… 냥코인이야.': 'The coin is called... NyanCoin.',
    '루루: …….': 'Lulu: .......',
    '냥코인이잖아. 안 오를 수가 없지.': 'It is NyanCoin. There is no way it does not go up.',
    '그리고 다음 날.': 'And the next day.',
    '무남이는 차트를 바라보며 중얼거린다.': 'Munam stares at the chart and mutters.',
    '최회장님이 무조건 오른다고 했는데....코인 대박나면 자기도 고생끝인데. 잘해보려고 했는데.......': 'Chairman Choi swore it could only go up.... If the coin hits big, my hard times are over too. I was only trying to make it work.......',
    '이건 손실이 아니라… 할인 중인 거야.': 'This is not a loss... it is a discount.',
    '코인은 끊었소. 진짜요.': 'I quit coins. For real.',
    '루루: 내 밭 내놔.': 'Lulu: Give me back my field.',
    '이장님: "되사겠다면 천만원일세.\n빌려 쓰는 거면 50만원에 해줌세."': 'Mayor: "₩10,000,000 to buy it back.\nOr ₩500,000 to rent it."',
    '내 땅이었던 밭을, 50만원에 빌려 쓰라고 한다.': 'They tell me to rent my own field back for ₩500,000.',
    '되사와야 한다.\n1천만원을 다시 만들어야 1억이 채워진다.': 'I have to buy it back.\nI need another ten million to make my hundred million whole.',
    // 엔딩 — 해피
    '집 수리가 끝났다. 가구가 들어오고, 벽지와 바닥도 새로 갈았다.': 'The repairs are done. Furniture moved in; new wallpaper, new floors.',
    '담 너머 밭도 이제 남의 땅이 아니다.\n소작료를 떼어주던 그 밭이 전부 루루의 이름으로 되어 있다.': 'The fields beyond the wall are no longer someone else\'s.\nThe land that once took half her harvest now bears Lulu\'s name.',
    '집과 땅과 살림을 합해 1억.\n서울에서는 현관 하나도 못 살 돈이었다.': 'House, land, and belongings: one hundred million won.\nIn Seoul, that would not have bought a front door.',
    '이장님도, 해녀 할망도 구경을 왔다. "허, 제주에서 제일가는 집이구먼!"': 'The mayor and the haenyeo granny came to look. "Ha! The finest house on Jeju!"',
    '서울에서는 이룰 수 없던 꿈을, 루루는 제주에서 이뤘다. \n꿈 달성!': 'The dream Seoul would not allow, Lulu made real on Jeju. \nDream complete!',
    '무남이가 팔아넘긴 밭도 도로 사왔다.\n두 번 산 땅이라 그런지 더 내 것 같았다.': 'She bought back the field Munam sold off.\nLand bought twice somehow feels twice as hers.',
    '…이번엔 진짜 안 하겠소. 코인.': '…This time I am really done. With coins.',
    '루루: 한 번만 더 하면 그땐 진짜 끝이야.': 'Lulu: One more time and we are truly done.',
    // 엔딩 — 새드와 루프
    '어느 아침, 낯선 고양이가 서류 가방을 들고 찾아왔다.': 'One morning, a strange cat arrived carrying a briefcase.',
    '어느 아침, 해녀할망이 서울사람을 데려왔다.': 'One morning, the haenyeo granny brought the man from Seoul.',
    '해녀할망이 서울사람을 데려왔다.': 'The haenyeo granny had brought the man from Seoul.',
    '해녀할망이 서울사람을 데려왔다': 'The haenyeo granny brought the man from Seoul',
    '냥코인 -97%': 'NyanCoin -97%',
    '이장님 만물상 앞': 'In front of the Mayor\'s Store',
    '서울사람이 벤치에 앉은 무남이에게 다가왔다.': 'The man from Seoul walked up to Munam on the bench.',
    '"이집 주인이십니까?"': '"Are you the owner of this house?"',
    '이집 주인이십니까?': 'Are you the owner of this house?',
    '무남이: 제가 아니고 제 와이프가 주인인데요.': 'Munam: Not me. My wife is the owner.',
    '서울에서 내려왔습니다.\n이 땅, 등기부에 제 이름으로 되어 있는데요.': 'I came down from Seoul.\nThis land is registered under my name.',
    '루루: …땅요? 저는 이 집을 샀는데요.': 'Lulu: …The land? But I bought this house.',
    '집은 사셨겠죠. 무허가 건물이니까.': 'The house, sure. It is an unpermitted building.',
    '남의 땅에 얹혀 있는 집을 파신 겁니다.\n땅은 처음부터 제 것이고요.': 'Someone sold you a house sitting on another person\'s land.\nThe land was mine all along.',
    '비워주세요. 여기다 카페를 지을 겁니다. …오션뷰 카페요.': 'Please vacate. I am building a café here. …An ocean-view café.',
    '그리고 그 뒤에\n낯익은 밀짚모자가 서 있었다.': 'And behind him\nstood a familiar straw hat.',
    '이 집을 4천만원에 판 사람. …이장님이었다.': 'The one who sold this house for 40 million won. …The mayor.',
    '미안하게 됐네. 카페 개업하면… 음료는 한 잔 서비스함세.': 'Sorry how it turned out. When the café opens… drinks are on me. One, anyway.',
    '이장님: "미안하게 됐네. 조상님 대대로 내려온 집터라 나도 팔기 아까웠어."': 'Mayor: "Sorry about this. It is an ancestral home site, handed down for generations. I hated to sell it too."',
    '서울 집값에 밀려 여기까지 내려왔는데,\n제주 땅 주인도 서울 사람이었다.': 'Priced out of Seoul, she came all the way here,\nand the owner of this Jeju land was a Seoul man too.',
    '4천만원에 사서, 평생 모은 걸 다 들여 고친 집이… 루루는 눈앞이 캄캄해졌다. ㅠㅠ': 'The house she bought for 40 million and fixed with everything she ever saved… Lulu\'s world went dark.',
    '서울에는, 내가 살 수 있는 집이 없었다.': 'In Seoul, there was no home I could afford.',
    '…제주에도, 내 집은 없었다.': '…And on Jeju, there was no home that was mine.',
    '끝': 'The End',
    '…그래도, 밭은 남았다.': '…Still, the fields remain.',
    '이장님한테 제 돈 주고 산 땅이다.\n그건 누구도 못 가져간다.': 'Land bought from the mayor with her own money.\nNo one can take that away.',
    '루루: 다시 하면 되지.': 'Lulu: I will just do it again.',
    '루루: 이번엔 땅부터 샀으니까.': 'Lulu: This time, I bought the land first.',
    '재산 4천만원.\n루루의 두 번째 제주살이가 시작된다.': 'Total assets: 40 million won.\nLulu\'s second Jeju life begins.',
  };

  // ----- 사전 2: 숫자·돈·버튼 이름이 끼어 있는 문구 -----
  // 숫자와 돈(₩), 버튼 이름, 밭·씨앗 이름을 #으로 바꾼 뒤 찾습니다.
  const PDICT = {
    '#등! 상금 #을 받았어요': 'First place! You won #2',
    '이장님 상점에서 #': '# at the store',
    '# 씨앗이 없어요': 'No # seeds',
    '#를 거둘 때가 됐어요': 'The # is ready to harvest',
    '#가 자라는 중': '# growing',
    '#일 남았어요': '# days left',
    '#로 수확하기': 'Press # to harvest',
    '#로 씨앗 심기': 'Press # to plant seeds',
    '상점에 가구 #가지가 더 있어요 (문 쪽으로 가면 밖으로)': '# more kinds of furniture at the store (door to leave)',
    '해녀 할망과 이야기 (#)': 'Talk to the haenyeo granny (#)',
    '무남이에게 인사하기 (#)': 'Say hello to Munam (#)',
    '무남이가 할 말이 있어 보여요 (#)': 'Munam looks like he has something to say (#)',
    '무남이와 이야기 (#)': 'Talk to Munam (#)',
    '이장님과 이야기 (#)': 'Talk to the mayor (#)',
    '돌하르방과 이야기 (#)': 'Talk to the dol hareubang (#)',
    '#을 누르면 바다로 물질하러 들어갑니다': 'Press # to dive into the sea',
    '야간물질은 값을 #배로 쳐줘요': 'Night diving pays #x',
    '# 채집': 'Gather with #',
    '↑ 떠오르기 ↓ 잠수 ←→ 헤엄 수면에서 # 나가기': '↑ rise · ↓ dive · ←→ swim · # at the surface to exit',
    '#로 사기 (#) · 귤 상자값이 두 배': 'Press # to buy (#) · doubles crate value',
    '#로 새 조랑말 사기 (#)': 'Press # to buy a new pony (#)',
    '#로 상점에 들어가기': 'Press # to enter the store',
    '#로 귤 박스 부치기 (#)': 'Press # to ship the crate (#)',
    '상자를 가득 채워 오면 이장님이 사 줍니다 (#/#)': 'Fill a crate and the mayor will buy it (#/#)',
    '가득 찬 상자를 컨테이너 앞 「귤상자 두는 곳」에 쌓아두세요 (#/#)': 'Stack full crates at the Crate Drop Zone by the container (#/#)',
    '#로 귤 #박스 한 번에 부치기': 'Press # to ship # crates at once',
    '# · #배': '# · #x',
    '# · #배 (#상자는 남습니다)': '# · #x (# crates stay behind)',
    '내 땅이었던 #': '# (once yours)',
    '#로 되사기 # · 년세 #': 'Press # to buy back for # · rent #',
    '이장님 밭 #': "Mayor\'s field: #",
    '#로 년세 내고 빌리기 (#)': 'Press # to rent for a year (#)',
    '# 년세가 끝났어요': 'The rent on # has ended',
    '다시 #': 'Renew for #',
    '#일 뒤 수확': 'Harvest in # days',
    '# · #': '# · #',
    '#로 다시 내기 (#)': 'Press # to renew (#)',
    '애정 # 이상부터 출전 (지금 #)': 'Needs affection # to race (now #)',
    '경마 출전 # · 한 판에 애정 # 소모': 'Race entry # · costs # affection',
    '#등 상금 # · 승률은 반반 (#)': 'First prize #2 · fifty-fifty odds (#3)',
    '#등 상금 # · 승률은 반반': 'First prize #2 · fifty-fifty odds',
    '경마 참가비 #': 'Race entry fee #',
    '애정이 #은 되어야 출전해요 (지금 #)': 'You need affection # to race (now #)',
    '애정이 # 줄었어요 (지금 #)': 'Affection down by # (now #)',
    '애정 #': 'Affection #',
    '오늘 아직 안 먹였어요 · 애정 #': 'Not fed yet today · Affection #',
    '조랑말한테 당근을 주세요 (애정 #)': 'Give your pony a carrot (Affection #)',
    '냠냠! 애정 #/#': 'Yum! Affection #/#',
    '냠냠! 애정 #': 'Yum! Affection #',
    '애정 #! 이제 경마에 나갈 수 있어요': 'Affection #! You can now enter the race',
    '#로 당근 먹이기 (#개 있음)': 'Press # to feed a carrot (# left)',
    '상자를 끄는 중 (#로 놓기)': 'Dragging a crate (# to drop)',
    '외벽 페인트칠을 하려면 공구대에서 페인트를 사 오세요 (# · 색 고르기)': 'Buy paint at the tool rack to paint the walls (# · pick a color)',
    '페인트칠 #/#': 'Painting #/#',
    '#로 계속 · 문 앞에 서면 안으로': '# to continue · stand at the door to enter',
    '# (#로 색 고르기)': '# (pick a color with #2)',
    '바닥재 보유 중': 'Flooring owned',
    '벽지 보유 중': 'Wallpaper owned',
    '바닥재는 이미 시공했어요': 'Flooring is already installed',
    '벽지는 이미 시공했어요': 'Wallpaper is already installed',
    '#로 구입': 'Press # to buy',
    '🥕 당근 #개': '🥕 # carrots',
    '🧺 망사리 #/#': '🧺 Net bag #/#',
    '망사리 #/#': 'Net bag #/#',
    '(야간물질 #배!)': '(Night diving #x!)',
    '+#': '+#',
    '# #': '# #',
    '# # · # #': '# # · # #',
    '# # · # # · # #': '# # · # # · # #',
    '# # · # # · # # · # #': '# # · # # · # # · # #',
    '# # · # # · # # · # # · # #': '# # · # # · # # · # # · # #',
    '#배 · 끌어서 이동 · 두 손가락으로 축소': '#x · drag to pan · pinch to zoom out',
    '어제 말먹이를 주지 않았어요': 'You skipped feeding yesterday',
    '애정이 하나 식었어요 (애정 #)': 'Affection cooled by one (now #)',
    '#만 주면 자네 것이야. 어떤가?': 'Just # and he is yours. What do you say?',
    '자네, # 년세 낼 때가 됐네.': 'Friend, the rent on # is due.',
    '자네, #하고 # 년세 낼 때가 됐네.': 'Friend, the rent on # and # is due.',
    '자네, #하고 #하고 # 년세 낼 때가 됐네.': 'Friend, the rent on #, #, and # is due.',
    '자네, #하고 #하고 #하고 # 년세 낼 때가 됐네.': 'Friend, the rent on #, #, #, and # is due.',
    '한 필지에 #일세.': 'It is # per plot.',
    '낡은 해상 컨테이너입니다. #.': 'An old shipping container. #.',
    '컨테이너 창고 #': 'Container Storage: #',
    '#일 뒤 #': 'Ready in # days: #',
    '#일마다 #': 'Harvest every #1 day(s): #2',
    '# · #밭': '#: # field',
    '오늘은 #을 수확하는 날이에요': 'Today is # harvest day',
    '#은 일반 귤의 #배 가격을 받습니다': '# sells for #2x the normal tangerine price',
    '#부터': '#+',
    '이미 #가 있어요': 'You already have the #',
    // ----- 물질·병원 -----
    '병원비 #이 없어 빚을 졌다.': 'I could not pay the # hospital bill, so now I am in debt.',
    '병원비로 #이 나갔다.': 'The hospital bill cost me #.',
    '망사리에 담았던 #개도 바다에 흘렸습니다': 'The # catches in my net bag washed away too',
    '다시 물질하려면 상점에서 사야 해요 (#)': 'Buy a new one at the store to dive again (#)',
    '상점 안에서 #': '# inside the store',
    '# (야간 #배)': '# (night #2x)',
    '↑ 떠오르기 ↓ 잠수 ←→ 헤엄 수면에서 #로 나가기': '↑ rise · ↓ dive · ←→ swim · # at the surface to exit',
    '#로 채집': 'Gather with #',
    // ----- 상점·씨앗 -----
    '당근 구입! (#개)': 'Carrot purchased! (# total)',
    '# 씨앗 한 봉지 (#봉지)': 'One bag of # seeds (#2 total)',
    '#봉지 있음': 'Have # bags',
    '# 부족': 'Need # more',
    // ----- 밭 -----
    '# 년세를 다시 냈어요': 'Rent renewed on #',
    '#를 빌렸어요 (년세 #)': 'You rented # (yearly rent #2)',
    '#를 심었어요': 'Planted #',
    '#일 뒤에 거둡니다': 'Harvest in # days',
    '# 수확 #': '# harvest #2',
    '이장님 몫 #': 'Mayor\'s share #',
    '내 몫 #': 'Your share #',
    '# #년 년세': '#2-year rent on #',
    '# 년세 다시 내기': 'Renew rent on #',
    '#가 자라는 중이에요': '# is still growing',
    '#일만 더 기다리세요': 'Just # more days',
    '# 년세 낼 때가 됐어요': 'Rent is due on #',
    '# · # 년세 낼 때가 됐어요': 'Rent is due on # and #',
    '# · # · # 년세 낼 때가 됐어요': 'Rent is due on #, #, and #',
    '# · # · # · # 년세 낼 때가 됐어요': 'Rent is due on #, #, #, and #',
    '한 필지에 #': '# per plot',
    '년세 #': 'Rent #',
    '루루의 땅 #': 'Lulu\'s own land · #',
    '루루가 빌린 땅 #': 'Rented land · #',
    // ----- 감귤·택배·컨테이너 -----
    '#! 보통 귤 #배 값이에요': '#! Worth #2x a normal tangerine',
    '이 한 알만 #': 'This one fruit alone: #',
    '#상자를 샀어요 (모두 #개)': 'Bought a # crate (#2 total)',
    '이장님이 귤 한 박스를 사셨어요! +#': 'The mayor bought a crate of tangerines! +#',
    '귤 #박스를 한 번에 넘겼어요! +#': 'Sold # crates at once! +#2',
    '#상자를 한 번에 넘겨서 #배로 쳐주셨어요 (+#)': 'Handed over # crates at once for #2x pay (+#3)',
    '존에 #상자가 남았어요': '# crates remain in the zone',
    '좋은 귤 #알이 섞여 있어 값을 더 쳐주셨어요': '# premium fruits inside earned a better price',
    '지금 상자 #/#': 'Crates now #/#',
    '상자를 가득 채워서 오게 (#/#)': 'Fill the crate to the top first (#/#)',
    '지금까지 #': 'Total so far #',
    '📦 상자 가득! #/#': '📦 Crate full! #/#',
    '택배사의 이장님께 (#)': 'Take it to the parcel office (#)',
    '📦 상자 #/#': '📦 Crate #/#',
    '💸 빚 #': '💸 Debt #',
    '(#상자는 남습니다)': '(# crates stay behind)',
    '낡은 해상 컨테이너입니다. #': 'A weathered shipping container. #',
    '「귤상자 두는 곳」에 #상자': '# crates at the Crate Drop Zone',
    '#상자만 더 채우면 부칠 수 있어요': 'Fill # more to ship',
    // ----- 자산 가방 -----
    '🎒 자산 (#번째 제주살이)': '🎒 Assets (Jeju life #)',
    '💵 현금 #': '💵 Cash #',
    '💰 총자산 # / #': '💰 Assets # / #2',
    '🏠 집 # · 땅 # · 현금 #': '🏠 House # · Land #2 · Cash #3',
    '🏠 집 # · 땅 # · 살림 # · 현금 #': '🏠 House # · Land #2 · Goods #3 · Cash #4',
    '🌱 빌린 땅 #필지 · 내 땅 #필지': '🌱 # rented plots · #2 owned',
    '🪧 빌린 땅 #필지': '🪧 Rented # plots',
    '🌱 내 땅 #필지': '🌱 Own # plots',
    '🌾 자라는 중 #필지': '🌾 # growing',
    '✨ 거둘 땅 #필지': '✨ # ready to harvest',
    '🌳 지금까지 낸 소작료 #': '🌳 Rent paid so far: #',
    '다음 이야기: 자산 #': 'Next story: assets #',
    '자라는 중 #필지': '# growing',
    '자라는 중 #필지 · 거둘 땅 #필지': '# growing · #2 ready to harvest',
    '거둘 땅 #필지': '# ready to harvest',
    '밭 #필지': 'Field · # plots',
    '지금까지 낸 소작료 #': 'Rent paid so far: #',
    // ----- 조랑말 -----
    '새 조랑말은 #': 'A new pony costs #',
    '# 모자라요': '# short',
  };

  // 숫자·돈·버튼·고유 이름을 #으로 바꾸면서 원래 값을 챙겨둡니다
  const TOKEN_RE = /₩[\d,.]+|-?\d[\d,.]*|행동 버튼으로|행동 버튼|F로|(^|[\s(])F(?=$|[\s)을를])|동쪽땅|서쪽땅|남쪽땅|북쪽땅|메밀|감자|월동무|차나무|문어|해삼|전복|소라|미역|황금향|한라봉|천혜향|감귤/g;
  const TOKEN_EN = {
    '행동 버튼으로': 'the action button', '행동 버튼': 'the action button', 'F로': 'F',
    '동쪽땅': 'the east field', '서쪽땅': 'the west field', '남쪽땅': 'the south field', '북쪽땅': 'the north field',
    '메밀': 'buckwheat', '감자': 'potato', '월동무': 'winter radish', '차나무': 'tea tree',
    '문어': 'Octopus', '해삼': 'Sea cucumber', '전복': 'Abalone', '소라': 'Turban shell', '미역': 'Seaweed',
    '황금향': 'Hwanggeumhyang', '한라봉': 'Hallabong', '천혜향': 'Cheonhyehyang', '감귤': 'tangerine',
  };

  // "물건이름 + 정해진 꼬리" 꼴 — 이름(가구·페인트 색)만 사전에서 바꿉니다
  const NAME_RULES = [
    [/^(.+?) 구입! 집 안에 놓아뒀어요$/, '$ purchased! Placed inside the house'],
    [/^(.+?) 구입! 집 마당에 심어뒀어요$/, '$ purchased! Set up in the yard'],
    [/^(.+?) 페인트 구입! 집 앞에서 칠해보세요$/, '$ paint purchased! Try painting your house'],
  ];

  function trLine(line) {
    const t = line.trim();
    if (!t) return line;
    if (DICT[t] !== undefined) return line.replace(t, DICT[t]);
    // 따옴표로 감싼 대사 — 속을 번역하고 따옴표를 도로 씌웁니다
    if (t.length > 2 && t[0] === '"' && t.endsWith('"')) {
      const inner = t.slice(1, -1);
      const innerTr = trLine(inner);
      if (innerTr !== inner) return line.replace(t, '"' + innerTr + '"');
    }
    // "물건이름 가격" 꼴 — 이름만 사전에서 찾아 바꿉니다 (감귤상자 ₩10,000 등)
    const np = t.match(/^(.+?)( · | )(₩[\d,.]+)$/);
    if (np && DICT[np[1]] !== undefined) return line.replace(t, DICT[np[1]] + np[2] + np[3]);
    // 가구·페인트 구입 문구 — 이름만 갈아 끼웁니다
    for (const [re, tpl] of NAME_RULES) {
      const m = t.match(re);
      if (m && DICT[m[1]] !== undefined) return line.replace(t, tpl.replace('$', DICT[m[1]]));
    }
    // "색이름 바닥재/벽지 시공 완료!" — 색과 종류를 각각 사전에서 바꿉니다
    const fw = t.match(/^(.+?) (바닥재|벽지) 시공 완료! 집이 바뀌었어요$/);
    if (fw && DICT[fw[1]] !== undefined) {
      return line.replace(t, DICT[fw[1]] + (fw[2] === '바닥재' ? ' flooring' : ' wallpaper') + ' installed! The house looks new');
    }
    // 씨앗 봉지 목록 ("🌾 메밀 2봉지 · 🥔 감자 1봉지") — 이름과 개수를 하나씩 바꿉니다
    if (/\d봉지/.test(t)) {
      const rep = t.replace(/([가-힣]+) (\d+)봉지/g, (mm, nm, n) => (DICT[nm] || TOKEN_EN[nm] || nm) + ' ×' + n);
      if (rep !== t && !/[가-힣]/.test(rep)) return line.replace(t, rep);
    }
    const vals = [];
    const pkey = t.replace(TOKEN_RE, (m, pre) => {
      const lead = (pre !== undefined ? pre : '');
      const core = m.trim().replace(/^\(/, '');
      // "F로/행동 버튼으로"는 조사(로)를 자리표 밖에 남겨야 사전 열쇠가 맞습니다
      const suffix = (core === 'F로' || core === '행동 버튼으로') ? '로' : '';
      vals.push(TOKEN_EN[core] !== undefined ? TOKEN_EN[core] : core);
      return lead + '#' + suffix;
    });
    const tpl = PDICT[pkey];
    if (tpl === undefined) return line;
    // #는 나온 차례대로, #2처럼 번호가 붙으면 그 번째 값을 넣습니다
    let i = 0;
    return line.replace(t, tpl.replace(/#(\d)?/g, (mm, d) => {
      const v = d ? vals[d - 1] : vals[i++];
      return v !== undefined ? v : mm;
    }));
  }

  function T(s) {
    if (window.GAME_LANG !== 'en' || typeof s !== 'string' || !/[가-힣]/.test(s)) return s;
    // 대사처럼 여러 줄이 한 덩어리인 문장은 통짜로 먼저 찾습니다
    const whole = DICT[s] !== undefined ? DICT[s] : DICT[s.trim()];
    if (whole !== undefined) return whole;
    // 따옴표에 감싸인 여러 줄 대사 — 속을 통짜로 찾고 따옴표를 도로 씌웁니다
    const t = s.trim();
    if (t.length > 2 && t[0] === '"' && t.endsWith('"')) {
      const innerHit = DICT[t.slice(1, -1)];
      if (innerHit !== undefined) return s.replace(t, '"' + innerHit + '"');
    }
    return s.split('\n').map(trLine).join('\n');
  }
  window.T = T;

  if (lang !== 'en') {
    // 한국어면 화면 번역기 없이 토글 버튼만 답니다
    addEventListener('DOMContentLoaded', setupLangButton);
    return;
  }

  // ----- 화면 자동 번역: 글자가 그려지거나 바뀌는 순간 영어로 바꿔치기 -----
  function trNode(node) {
    if (node.nodeType === 3) {
      const t = T(node.nodeValue);
      if (t !== node.nodeValue) node.nodeValue = t;
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.title) { const t = T(node.title); if (t !== node.title) node.title = t; }
    for (const c of node.childNodes) trNode(c);
  }
  addEventListener('DOMContentLoaded', () => {
    trNode(document.body);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'characterData') trNode(m.target);
        if (m.addedNodes) for (const n of m.addedNodes) trNode(n);
      }
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
    setupLangButton();
  });

  // ----- 시작 화면의 언어 전환 버튼 -----
  function setupLangButton() {
    const btn = document.getElementById('startLang');
    if (!btn) return;
    btn.textContent = (lang === 'en') ? '한국어' : 'English';
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const next = (lang === 'en') ? 'ko' : 'en';
      try { localStorage.setItem('lulu_lang', next); } catch (err) {}
      // 주소에 ?lang= 가 붙어 있으면 그것도 새 언어로 바꿔서 이동합니다.
      // (안 그러면 ?lang=en 같은 게 새로고침 때마다 localStorage를 이겨서 한국어로 못 바꿉니다)
      try {
        const url = new URL(location.href);
        if (url.searchParams.has('lang')) { url.searchParams.set('lang', next); location.replace(url.toString()); return; }
      } catch (err) {}
      location.reload();
    });
  }
})();
