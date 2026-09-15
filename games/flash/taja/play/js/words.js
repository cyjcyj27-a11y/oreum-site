/* 타자 — 코스별 낱말. 앞 코스일수록 짧고 받침이 없다. 속담은 옛말(저작권 없음). */
window.TJ_WORDS = {
  ko: [
    // 1 받침 없는 두 글자
    '나무 오리 바다 모자 기차 우유 사자 포도 하마 거미 나비 도토리 두부 고래 버스 치마 구두 노래 시소 피자 아기 머리 코끼리 다리 마루 호수 소라 파도 비누 가수 너구리 바지 수도 자리 차표 토마토 오이 무지개 개미 여우 소리 조개 하루 모래 새우 가지 부모 두더지 기러기'.split(' '),
    // 2 받침 있는 두 글자
    '사탕 연필 강물 가방 공책 신발 딸기 학교 친구 동생 운동 수박 풍선 햇빛 달님 별빛 산길 들판 선물 장갑 양말 모험 인형 편지 공원 시장 병원 목장 농장 창문 책상 컵라면 짜장면 김밥 만두 떡국 식빵 감자 호박 참외 당근 옥수수 바람 구름 눈썹 손톱 발톱 엄마 아빠'.split(' '),
    // 3 세 글자
    '고양이 강아지 자전거 비행기 해바라기 도서관 운동장 놀이터 선생님 할머니 할아버지 거북이 원숭이 코알라 다람쥐 햄버거 도깨비 초콜릿 크레파스 스케치북 색연필 지우개 필통 줄넘기 미끄럼틀 그네 수영장 소풍날 생일날 케이크 촛불 딸기잼 사과즙 호랑이 고슴도치 병아리 망아지 송아지 부엉이 까마귀 앵무새 달팽이 무당벌레 잠자리 반딧불 개구리 올챙이'.split(' '),
    // 4 쌍자음·겹모음
    '꽃밭 까치 떡볶이 뛰기 과자 의자 돼지 꿀벌 빨래 쓰레기 쪽지 딱지 뽀뽀 꼬리 빵집 짝꿍 쌍둥이 뿌리 꿈나라 꽃게 왕관 원피스 귀신 웃음 괴물 외계인 쥐돌이 된장 뭉게구름 왜가리 훨훨 휘파람 둥지 꿩 뚜벅뚜벅 싸움 씨앗 찐빵 쪽빛 떡잎 쑥쑥 똑똑 까꿍 빨강 파랑 노랑 초록'.split(' '),
    // 5 긴 낱말
    '아이스크림 크리스마스 텔레비전 냉장고 세탁기 청소기 엘리베이터 에스컬레이터 소방관 경찰관 우체부 과학자 우주비행사 공룡박물관 동물원 수족관 놀이공원 롤러코스터 회전목마 솜사탕 팝콘 샌드위치 스파게티 오므라이스 돈가스 비빔밥 김치찌개 계란말이 감자튀김 무지개떡 바나나우유 딸기우유 줄다리기 숨바꼭질 달리기시합 가위바위보 보물찾기 종이비행기 눈사람 썰매 스케이트 자전거길 캠핑장 바닷가 모래성'.split(' '),
    // 6 두 낱말
    '빨간 사과|파란 하늘|노란 병아리|하얀 구름|까만 고양이|작은 새|큰 코끼리|맛있는 밥|시원한 바람|따뜻한 이불|달콤한 사탕|재미있는 책|빠른 토끼|느린 거북이|높은 산|깊은 바다|밝은 달|반짝이는 별|귀여운 강아지|용감한 소방관|착한 친구|즐거운 소풍|신나는 운동회|푸른 들판|넓은 운동장|긴 기차|둥근 공|예쁜 꽃|무거운 가방|가벼운 풍선'.split('|'),
    // 7 짧은 문장
    '나는 달린다|토끼가 뛴다|비가 온다|해가 뜬다|꽃이 핀다|새가 난다|밥을 먹자|손을 씻자|학교에 간다|친구와 논다|책을 읽는다|노래를 부른다|그림을 그린다|공을 찬다|물을 마신다|잠을 잔다|바람이 분다|눈이 내린다|강아지가 짖는다|고양이가 잔다|엄마가 웃는다|아빠가 요리한다|동생이 운다|개구리가 뛴다|기차가 달린다|별이 빛난다|달이 밝다|하늘이 맑다|바다가 넓다|꿈을 꾼다'.split('|'),
    // 8 조금 긴 문장
    '오늘은 날씨가 좋다|우리 집 강아지는 귀엽다|아침마다 우유를 마신다|운동장에서 공을 찼다|도서관에서 책을 빌렸다|주말에 동물원에 갔다|생일에 케이크를 먹었다|친구에게 편지를 썼다|할머니 댁에 놀러 간다|여름에는 수박이 맛있다|겨울에는 눈사람을 만든다|봄에는 꽃이 활짝 핀다|가을에는 낙엽이 떨어진다|토끼와 거북이가 경주한다|거북이는 끝까지 달렸다|내일은 소풍 가는 날|숙제를 먼저 끝내자|양치질을 깨끗이 하자|길을 건널 때 조심하자|모두 함께 힘을 내자'.split('|'),
    // 9 짧은 속담
    '티끌 모아 태산|금강산도 식후경|누워서 떡 먹기|식은 죽 먹기|그림의 떡|우물 안 개구리|꿩 먹고 알 먹기|개천에서 용 난다|소 잃고 외양간 고친다|하늘의 별 따기|쇠귀에 경 읽기|병 주고 약 준다|달면 삼키고 쓰면 뱉는다|수박 겉 핥기|고래 싸움에 새우 등 터진다|원숭이도 나무에서 떨어진다|도토리 키 재기|울며 겨자 먹기|제 눈에 안경|빈 수레가 요란하다'.split('|'),
    // 10 긴 속담
    '가는 말이 고와야 오는 말이 곱다|낮말은 새가 듣고 밤말은 쥐가 듣는다|세 살 버릇 여든까지 간다|천 리 길도 한 걸음부터|호랑이도 제 말 하면 온다|백지장도 맞들면 낫다|발 없는 말이 천 리 간다|아니 땐 굴뚝에 연기 날까|콩 심은 데 콩 나고 팥 심은 데 팥 난다|돌다리도 두들겨 보고 건너라|하룻강아지 범 무서운 줄 모른다|열 번 찍어 안 넘어가는 나무 없다|말 한마디로 천 냥 빚을 갚는다|윗물이 맑아야 아랫물이 맑다|사공이 많으면 배가 산으로 간다|오르지 못할 나무는 쳐다보지도 마라|믿는 도끼에 발등 찍힌다|등잔 밑이 어둡다|구슬이 서 말이라도 꿰어야 보배|호랑이는 죽어서 가죽을 남긴다'.split('|'),
    // 11 긴 문장
    '토끼는 낮잠을 자고 거북이는 쉬지 않고 걸었다|작은 씨앗이 자라서 커다란 나무가 되었다|우리는 운동회에서 이어달리기 일등을 했다|밤하늘에 반짝이는 별을 세다가 잠이 들었다|비 온 뒤에 하늘에 커다란 무지개가 떴다|바닷가 모래사장에서 조개껍데기를 주웠다|눈 오는 날 친구들과 눈싸움을 하며 놀았다|할아버지와 함께 산에 올라 도시락을 먹었다|강아지가 꼬리를 흔들며 나를 반겨 주었다|열심히 연습하면 누구나 빨라질 수 있다|아침 일찍 일어나 창문을 열고 기지개를 켰다|시장에서 산 딸기로 달콤한 잼을 만들었다|종이비행기를 접어 운동장 끝까지 날렸다|숲속 다람쥐가 도토리를 볼에 가득 담았다|달리기 시합이 끝나고 모두 박수를 쳤다|엄마와 함께 시장에 가서 싱싱한 과일을 샀다|여름 방학에는 바닷가에서 모래성을 쌓고 수영을 했다|우리 반 친구들은 쉬는 시간마다 운동장으로 달려 나간다|빨간 우체통에 할머니께 쓴 편지를 넣었다|고양이가 창가에 앉아 하루 종일 비 오는 밖을 바라보았다|동생과 나는 누가 먼저 숙제를 끝내나 내기를 했다|가을 운동회 날 청팀과 백팀이 줄다리기를 했다|도서관에서 빌린 공룡 책을 밤늦게까지 읽었다|아빠가 끓여 준 라면은 세상에서 제일 맛있다|겨울밤 따뜻한 이불 속에서 군고구마를 나눠 먹었다|꽃밭에 물을 주었더니 나비가 날아와 앉았다|자전거를 처음 탈 때는 무서웠지만 이제는 잘 탄다|소풍 가는 날 아침 김밥 싸는 냄새에 일찍 눈을 떴다|하늘 높이 날아간 연이 구름 사이로 숨어 버렸다|넘어져도 괜찮아 다시 일어나서 끝까지 달리면 된다'.split('|'),
    // 12 챔피언 — 속담과 긴 문장 섞기
    '가는 말이 고와야 오는 말이 곱다|천 리 길도 한 걸음부터|열심히 연습하면 누구나 빨라질 수 있다|토끼는 낮잠을 자고 거북이는 쉬지 않고 걸었다|돌다리도 두들겨 보고 건너라|작은 씨앗이 자라서 커다란 나무가 되었다|티끌 모아 태산|세 살 버릇 여든까지 간다|달리기 시합이 끝나고 모두 박수를 쳤다|백지장도 맞들면 낫다|하룻강아지 범 무서운 줄 모른다|밤하늘에 반짝이는 별을 세다가 잠이 들었다|윗물이 맑아야 아랫물이 맑다|말 한마디로 천 냥 빚을 갚는다|비 온 뒤에 하늘에 커다란 무지개가 떴다'.split('|'),
    // 13 숫자
    '사과 3개|연필 12자루|우리 반은 28명|오늘은 9월 15일|버스 번호는 752번|아파트 101동 1502호|하루는 24시간|일주일은 7일|1년은 365일|책 한 권 12000원|엘리베이터 7층|3학년 2반|기차는 10시 30분에 출발|운동장 5바퀴|고양이 2마리와 강아지 1마리|사탕 100개|키가 132센티미터|몸무게 30킬로그램|생일은 5월 5일|방 번호 204호|줄넘기 50번|달리기 100미터|2026년 여름 방학|전화 119|피자 8조각|구구단 7단|시험 점수 95점|자전거로 15분|계단 48칸|달걀 한 판 30개'.split('|'),
    // 14 문장부호
    '정말 빠르다!|누가 1등일까?|안녕, 친구야.|와~ 신난다!|오늘 날씨 어때?|조심해! 넘어진다.|좋아, 다시 한번!|네, 알겠습니다.|어디 가니?|잘했어! 최고야!|음... 생각해 볼게.|앗, 늦었다!|토끼야, 같이 가자!|정답은 무엇일까요?|야호! 방학이다!|"안녕"이라고 말했다.|엄마, 배고파요!|괜찮아? 안 다쳤어?|자, 출발한다!|그래? 정말이야?|거북아, 힘내!|벌써 끝났어?|하나, 둘, 셋!|우와, 눈이 온다!|천천히, 그리고 정확하게.'.split('|'),
    // 15 숫자·기호
    '3 + 4 = 7|10 - 3 = 7|6 * 8 = 48|50% 할인!|사과 3개에 1,500원!|전화번호는 010-1234-5678|오늘은 9월 15일(월)|시간은 오후 3:30|#타자연습 #달리기|점수: 98점!|1등, 2등, 3등|가격: 12,000원|문제 1) 5 * 2 = ?|정답은 (3)번!|온도는 25도, 습도는 60%|주소: 101동 202호|기록 00:45.3|[중요] 숙제 3쪽까지!|딸기 2kg = 20,000원|달리기 1위@운동장|오름게임즈 & 친구들|비밀번호 a7#k2!|100 / 4 = 25|2026.09.15 운동회|<공지> 내일 9시 집합'.split('|')
  ],
  en: [
    'cat dog sun hat cup red bus pig egg box bed map fox ant bee owl car toy pen jam fan hen log mud nut ox rug van web yak zoo bag bat cow ice leg lip net pot'.split(' '),
    'frog duck milk ball tree fish bird cake star moon rain snow kite lamp desk shoe sock ship boat home park farm king rock sand wind jump swim play sing read blue pink gold'.split(' '),
    'apple tiger zebra horse mouse bread juice candy pizza water grass cloud river beach train plane truck robot pencil rabbit monkey turtle garden school friend yellow orange purple green happy'.split(' '),
    'banana carrot cookie dragon rocket planet bubble castle jungle island window basket button giraffe penguin octopus chicken popcorn rainbow blanket balloon pumpkin crayon sticker puzzle picnic hammer spider'.split(' '),
    'butterfly elephant dinosaur kangaroo sandwich spaghetti chocolate strawberry pineapple watermelon playground umbrella backpack computer telephone treasure snowman scooter skateboard firefighter astronaut hamburger lemonade crocodile'.split(' '),
    'red apple|blue sky|big whale|little bird|fast rabbit|slow turtle|happy dog|sleepy cat|cold ice|hot soup|tall tree|deep sea|bright star|green frog|yellow duck|funny clown|brave knight|shiny coin|soft pillow|sweet candy|loud drum|quiet mouse|round ball|long train|pink flower'.split('|'),
    'I can run|the dog barks|birds can fly|fish can swim|the sun is hot|it is raining|we play ball|I like cake|cats love milk|frogs can jump|the moon is up|I read a book|we sing songs|the bus is late|stars shine bright|I brush my teeth|the wind blows|snow is falling|my cat sleeps|we eat lunch'.split('|'),
    'the rabbit ran very fast|my dog has a long tail|we went to the zoo today|I made a big snowman|the turtle never stopped|there is a rainbow in the sky|we had a picnic in the park|my friend sent me a letter|the train goes over the bridge|I drink milk every morning|the bees are busy in the garden|we built a sand castle|flowers bloom in the spring|leaves fall in the autumn|look both ways before you cross'.split('|'),
    'slow and steady wins the race|practice makes perfect|better late than never|time is money|easy come easy go|no pain no gain|seeing is believing|actions speak louder than words|two heads are better than one|every dog has its day|honesty is the best policy|look before you leap|haste makes waste|knowledge is power|all is well that ends well'.split('|'),
    'the early bird catches the worm|do not count your chickens before they hatch|an apple a day keeps the doctor away|where there is a will there is a way|rome was not built in a day|a friend in need is a friend indeed|birds of a feather flock together|do not put all your eggs in one basket|the pen is mightier than the sword|when in rome do as the romans do|a journey of a thousand miles begins with a single step|laughter is the best medicine'.split('|'),
    'the rabbit took a nap while the turtle kept walking|a tiny seed grew into a very tall tree|we won first place in the relay race|I fell asleep counting the stars in the sky|we found seashells on the sandy beach|my puppy wags its tail when I come home|anyone can get faster with a little practice every day|the squirrel filled its cheeks with acorns|everyone clapped when the race was over|we threw paper planes across the playground|my little brother and I raced to finish our homework|the cat sat by the window and watched the rain all day|we bought fresh fruit at the market with mom|the kite flew so high that it hid behind a cloud|dad makes the best noodles in the whole world|we shared warm sweet potatoes under the blanket|a butterfly landed on the flowers after I watered them|it is okay to fall down just get up and keep running|I read the dinosaur book until late at night|on sports day the blue team won the tug of war'.split('|'),
    'slow and steady wins the race|anyone can get faster with a little practice every day|a journey of a thousand miles begins with a single step|the rabbit took a nap while the turtle kept walking|where there is a will there is a way|practice makes perfect|everyone clapped when the race was over|rome was not built in a day|the early bird catches the worm|a tiny seed grew into a very tall tree|two heads are better than one|laughter is the best medicine'.split('|'),
    'I have 3 cats|room 204|bus number 752|12 red apples|we won 2 games|school starts at 9|100 meters|7 days a week|24 hours a day|I am 10 years old|5 little ducks|page 36|lunch at 12|2 plus 2 is 4|call 911|365 days a year|grade 3 class 2|8 slices of pizza|50 jumps|team 1 and team 2|48 stairs|30 eggs|15 minutes by bike|score 95|summer 2026'.split('|'),
    'wow, so fast!|who will win?|hello, friend.|yay! no school!|are you okay?|watch out!|ready, set, go!|yes, I know.|where are you going?|great job!|hmm... let me think.|oops, I am late!|come on, rabbit!|what is the answer?|"hi," she said.|mom, I am hungry!|really? are you sure?|let us go!|oh no, it is raining!|good morning, class.|one, two, three!|slow down, turtle.|is it over already?|wait for me!|yes! we did it!'.split('|'),
    '3 + 4 = 7|10 - 3 = 7|6 * 8 = 48|50% off!|3 apples for $2.50|call 555-0123|today is 9/15 (Mon)|meet at 3:30 pm|#typing #race|score: 98 points!|1st, 2nd, 3rd|price: $12.99|Q1) 5 * 2 = ?|the answer is (3)!|it is 25 degrees, 60% humid|room #202|time 00:45.3|[note] read page 3!|2 kg = $20|win@park|me & my friends|password a7#k2!|100 / 4 = 25|2026.09.15 sports day|<notice> meet at 9 am'.split('|')
  ]
};
