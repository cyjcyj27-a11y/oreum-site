// 말 — ?lang=en 이면 영어. 한국어가 원본이고 영어를 덧씌운다 (BUY JEJU lang.js 와 같은 방식)
//
// 쓰는 법 세 가지
//   1) 화면(HTML) 글자는 손댈 것 없다. 아래 MutationObserver 가 텍스트 마디를 그때그때 바꾼다.
//   2) 캔버스에 그리는 글자(큰 지도 장소 이름)는 DOM 이 아니라서 못 잡는다 → 그리기 직전에 L(글) 로 감싼다.
//   3) 한 글자씩 찍히는 대사(story.js)·매 프레임 비교하는 말풍선(pets.js)은 관찰자가 보면 반쪽·깜빡임이 난다
//      → 원본에서 L(글) 로 먼저 바꾼다.
// 사전은 '긴 말부터' 바꾼다. 한 글자 말(켄·킥)은 다른 낱말을 깨므로 EXACT 에 넣어 글 전체가 같을 때만 바꾼다.
(function () {
  // 말은 **주소로만** 정한다 — ?lang=en 이면 영어, 없으면 한국어.
  const Q = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
  const EN = Q === 'en', ZHL = Q === 'zh';

  const EXACT = { '켄': 'Ken', '킥': 'KICK', '켄.': 'Ken.' };

  const T = {
    // ── 타이틀·표준 용어 ──
    '우에노짱': 'UENO ZZANG',
    '시작': 'START', '이어하기': 'CONTINUE', '처음부터 다시하기': 'NEW GAME', '정말 처음부터?': 'REALLY RESTART?',
    '엔딩': 'ENDING', '필살기': 'SPECIAL', '필살': 'SPECIAL',
    '펀치': 'PUNCH', '피하기': 'DODGE', '점프': 'JUMP', '체인지': 'SWAP',
    '지도': 'MAP', '일시정지': 'PAUSE', '음악': 'MUSIC', '효과음': 'SFX',
    '가로로 돌려 주세요': 'Rotate your device', '가로로 돌리기': 'ROTATE', '전체화면 보기': 'FULL SCREEN', '고양이 캔': 'Cat Food', '비둘기 모이': 'Pigeon Feed', '강아지 간식': 'Dog Treats', '가방': 'Bag',
    '히로미': 'Hiromi', '류지': 'Ryuji', '에리': 'Eri',

    // ── 조작 안내 (<br> 로 갈린 두 마디) ──
    'WASD 이동 · Shift 달리기 · 좌클릭/J 펀치 · 우클릭/K 킥 · Q 필살기':
      'WASD Move · Shift Run · LMB/J Punch · RMB/K Kick · Q Special',
    '마우스 시점 · Tab 체인지 · E 자판기 · M 지도 · I 가방 · Esc 일시정지':
      'Mouse Camera · Tab Swap · E Vending · M Map · I Bag · Esc Pause',

    // ── 장소·퍼즐 ──
    '사쿠라길': 'Sakura Path', '시노바즈 연못': 'Shinobazu Pond', '도쇼궁': 'Toshogu Shrine',
    '동물원 정문': 'Zoo Gate', '분수 광장': 'Fountain Plaza',
    '오리배': 'Duck Boat', '석등': 'Stone Lantern', '판다': 'Panda', '분수': 'Fountain',

    // ── 말풍선 ──
    '냐옹~ 밥줘!': 'Meow~ Feed me!', '낑낑…': 'Whimper…', '멍멍!': 'Woof woof!', '멍!': 'Woof!',

    // ── 대사: 인트로 ──
    '켄. 오늘 무슨 날인지 알아?': 'Ken. Do you know what day it is?',
    '…월요일.': '…Monday.',
    '우리 처음 만난 지 딱 1년 되는 날이거든?!': "It's exactly one year since we met, hello?!",
    '…벌써 그렇게 됐나.': '…Already?',
    '— 작년 봄, 우에노 공원 벚꽃길.': '— Last spring, the cherry blossom path in Ueno Park.',
    '켄은 걷다가 길바닥에 침을 뱉었다. 하필 지나가던 여고생 신발 위로.': "Ken spat on the path as he walked. Right onto a passing schoolgirl's shoe.",
    '야! 너 지금 뭐 한 거야?!': 'Hey! What did you just do?!',
    '짝! 성질 더러운 여고생의 싸대기 한 방.': 'SMACK! One slap from a very bad-tempered schoolgirl.',
    '그런데 휘두른 기세에 미끄러져, 여고생은 그대로 기절해 버렸다.': 'But she swung so hard she slipped and knocked herself out cold.',
    '켄은 속으로 놀랐지만, 옆에 앉아 태연한 척 기다렸다.': 'Ken panicked inside, but sat down beside her and waited, playing it cool.',
    '…으으. 양아치야, 어따 대고 손찌검이야!': '…Ugh. You thug, how dare you hit me!',
    '난 손 안 댔는데.': "I didn't touch you.",
    '폭행죄로 신고하기 전에… 딸기 우유 사 줘.': 'Before I report you for assault… buy me a strawberry milk.',
    '그날 둘은 벤치에 나란히 앉아 딸기 우유를 마셨다.': 'That day, they sat side by side on a bench and drank strawberry milk.',
    '그러니까 오늘은 그날 코스 그대로 데이트야.': "So today's date follows that exact same route.",
    '귀찮은데.': 'What a hassle.',
    '딸기 우유 사 줄게.': "I'll buy you a strawberry milk.",
    '…가자.': "…Let's go.",

    // ── 1 사쿠라길 ──
    '저기! 우리 그 벤치… 어?': 'There! Our bench… huh?',
    '뭘 봐. 여기 우리 자리다.': "What're you looking at? This is our spot.",
    '어머, 히로미잖아? 아직도 이 공원 오는구나.': 'Oh my, Hiromi? You still come to this park?',
    '에리… 하필 너냐.': 'Eri… of all people.',
    '딱 잠깐만 앉으면 돼. 비켜.': 'We just need the bench for a minute. Move.',
    '딸기 우유 들고 데이트? 애기냐?': 'A date with strawberry milk? What are you, five?',
    '툭. 류지가 켄 손의 딸기 우유를 쳐서 떨어뜨렸다.': "Thwack. Ryuji knocked the strawberry milk out of Ken's hand.",
    '그거… 1주년 딸기 우유거든?!': 'That was… our ANNIVERSARY strawberry milk?!',
    '…너 지금 선 넘었다.': "…Now you've crossed the line.",
    // 1 끝
    '…제법이네.': '…Not bad.',
    '벤치 가져가. 대신 이걸로 끝 아니야, 히로미!': "Take the bench. But this isn't over, Hiromi!",
    '딸기 우유값은 받는다.': 'You owe me a strawberry milk.',
    '…새로 사 줄게. 두 개.': "…I'll buy you a new one. Two.",

    // ── 2 시노바즈 연못 ──
    '다음은 오리배! 작년에도 탔잖아.': 'Next, the duck boats! We rode one last year.',
    '줄이 길다.': 'Long line.',
    '실례~ 우리 먼저 탈게.': "Excuse us~ We're going first.",
    '어이, 또 너희냐.': 'Yo. You two again?',
    '새치기하지 마. 줄은 뒤로 서.': 'No cutting. Back of the line.',
    '벤치에서 이겼다고 기고만장하네?': "Won one bench and now you're all cocky?",
    '줄 순서는 주먹으로 정하자고.': "Let's settle the line with fists.",
    '…오리배 한 번 타기 힘드네.': '…Why is riding one duck boat so hard.',
    // 2 끝
    '오리배 따위… 다음엔 안 져!': "Stupid duck boats… we won't lose next time!",
    '에리랑 무슨 사이야.': "What's the deal with you and Eri?",
    '…중학교 때 분수 광장에서 KPOP 댄스 연습했거든. 사람들이 박수도 쳐 줬고.': '…In middle school I practiced KPOP dance at Fountain Plaza. People even clapped.',
    '그날 류지랑 에리가 스피커를 차 버렸어. 그 뒤로 거기서 못 췄지.': 'Then Ryuji and Eri kicked my speaker over. I never danced there again.',
    '…그래서 아까부터 그 눈빛이었구나.': "…So that's why you've had that look all day.",

    // ── 3 도쇼궁 ──
    '소원판 쓰자. "켄이랑 내년에도 여기 오기."': 'Let\'s write a wish plaque. "Come back here with Ken next year."',
    '…크게 읽지 마.': "…Don't read it out loud.",
    '"켄이랑 내년에도"~? 아하하, 오글거려!': '"With Ken next year"~? Ahaha, so cringe!',
    '에리, 그거 이리 줘 봐.': 'Eri, hand that over.',
    '돌려줘! 남의 소원을 왜 읽어!': 'Give it back! Why are you reading my wish!',
    '아직도 그렇게 순진하니? 분수 앞에서 KPOP 커버댄스 추던 애가.': 'Still so innocent? The girl who did KPOP covers by the fountain?',
    '에리라고 했지. 그 판, 내려놔.': 'Eri, right? Put the plaque down.',
    '에리 건드리면 나도 가만 안 있는다.': 'Mess with Eri and you mess with me.',
    '먼저 건드린 건 너네야.': 'You two started it.',
    // 3 끝
    '…소원판은 돌려주마.': '…Fine. Take your wish plaque.',
    '흥. 내년에도 오기나 해.': 'Hmph. Just make sure you come back next year.',
    '켄. 아까 화내 줘서 고마워.': 'Ken. Thanks for getting mad for me back there.',
    '딸기 우유값이다.': 'That was for the strawberry milk.',

    // ── 4 동물원 정문 ──
    '판다 보고 싶었는데… 오늘 쉬는 날이래.': "I wanted to see the pandas… but the zoo's closed today.",
    '…야. 켄.': '…Hey. Ken.',
    '또.': 'You again.',
    '아까는… 우리가 좀 심했다. 사과하러 왔다.': 'Earlier… we went too far. We came to apologize.',
    '화해의 판다빵이야. 받아.': 'A peace-offering panda bun. Here.',
    '어… 고, 고마워?': 'Oh… th-thanks?',
    '…라고 할 줄 알았냐!': '…Yeah, right!',
    '퍽! 판다빵이 켄의 얼굴에 날아들었다.': "SPLAT! The panda bun hit Ken right in the face.",
    '…음식 가지고 장난치지 마라.': "…Don't play with food.",
    // 4 끝
    '비겁한 수까지 썼는데…': 'We even fought dirty…',
    '…분수 광장으로 와. 거기서 진짜로 끝내.': '…Come to Fountain Plaza. We finish this for real.',
    '좋아. 어차피 거기 갈 거였어.': 'Fine. We were going there anyway.',
    '판다빵은 맛있었다.': 'The panda bun was tasty.',

    // ── 5 분수 광장 ──
    '마지막은 분수 광장. 여기서 KPOP 커버댄스 출 거야. 중학교 때 못 끝낸 그 춤.': "Last stop, Fountain Plaza. I'm doing a KPOP cover dance here. The one I never finished in middle school.",
    '…여기서는 안 돼.': '…Not here.',
    '에리가 여기서 댄스 연습한다. 비켜.': 'Eri practices here. Beat it.',
    '에리가… KPOP을?': 'Eri… does KPOP?',
    '그때 네가 박수받는 게 싫었어. 그래서 류지랑 스피커를 찼던 거야.': 'I hated watching you get all the applause. So Ryuji and I kicked your speaker.',
    '…그랬구나.': "…So that's why.",
    '그래도 오늘은 안 비켜. 이 자리는 이제 내 거야.': "But I'm not moving today. This spot is mine now.",
    '말로는 안 끝나겠네.': "Talking won't settle this.",
    '끝내고 싶으면 이겨 봐.': 'Want it settled? Beat us.',
    // 엔딩
    '…오늘은 졌다.': '…We lost. Today.',
    '오늘만 진 거야. 내일 또 붙어.': 'Just today. Rematch tomorrow.',
    '…귀찮은데.': '…What a hassle.',
    '에리. 그 곡 너도 다 외우고 있지? 같이 출래?': 'Eri. You know that whole song by heart too, right? Dance with me?',
    '…누, 누가 너랑! …이번 한 번만이야.': "…L-like I'd dance with you! …Just this once.",
    '스피커에서 KPOP이 흘러나온다. 분수 앞에서 히로미가 춤을 춘다. 슬쩍 에리도 똑같은 동작으로 따라 춘다. 사람들이 모여든다.':
      'KPOP pours from the speaker. Hiromi dances by the fountain. Eri slips in beside her, matching every move. A crowd gathers.',
    '너, 이름 뭐냐.': "You. What's your name?",
    '우에노 공원 켄이라… 우에노짱이라고 불러 주지.': "Ken of Ueno Park, huh… I'll call you Ueno Zzang.",
    '그 이름 촌스러.': "That name's lame.",
    '난 좋은데? 우에노짱.': 'I like it. Ueno Zzang.',
    '…딸기 우유 하나 더.': '…One more strawberry milk.'
  };

  // 중국어(?lang=zh) 사전 — 한국어 원문을 열쇠로 쓴다
  const EXACT_ZH = { '켄': '健', '킥': '踢腿', '켄.': '健。' };
  const ZH = {
    '우에노짱': '上野最强',
    '시작': '开始', '이어하기': '继续', '처음부터 다시하기': '从头开始', '정말 처음부터?': '真的从头开始？',
    '엔딩': '结局', '필살기': '必杀技', '필살': '必杀',
    '펀치': '出拳', '피하기': '闪避', '점프': '跳跃', '체인지': '换人',
    '지도': '地图', '일시정지': '暂停', '음악': '音乐', '효과음': '音效',
    '가로로 돌려 주세요': '请把手机横过来', '가로로 돌리기': '横屏', '전체화면 보기': '全屏', '고양이 캔': '猫罐头', '비둘기 모이': '鸽子饲料', '강아지 간식': '狗狗零食', '가방': '背包',
    '히로미': '浩美', '류지': '龙二', '에리': '惠理',
    'WASD 이동 · Shift 달리기 · 좌클릭/J 펀치 · 우클릭/K 킥 · Q 필살기':
      'WASD 移动 · Shift 奔跑 · 左键/J 出拳 · 右键/K 踢腿 · Q 必杀技',
    '마우스 시점 · Tab 체인지 · E 자판기 · M 지도 · I 가방 · Esc 일시정지':
      '鼠标 视角 · Tab 换人 · E 售货机 · M 地图 · I 背包 · Esc 暂停',
    '사쿠라길': '樱花道', '시노바즈 연못': '不忍池', '도쇼궁': '东照宫',
    '동물원 정문': '动物园正门', '분수 광장': '喷泉广场',
    '오리배': '鸭子船', '석등': '石灯笼', '판다': '熊猫', '분수': '喷泉',
    '냐옹~ 밥줘!': '喵~ 快给我饭！', '낑낑…': '呜呜…', '멍멍!': '汪汪！', '멍!': '汪！',
    '켄. 오늘 무슨 날인지 알아?': '健，你知道今天是什么日子吗？',
    '…월요일.': '…星期一。',
    '우리 처음 만난 지 딱 1년 되는 날이거든?!': '今天是我们认识整整一周年啊？！',
    '…벌써 그렇게 됐나.': '…已经这么久了？',
    '— 작년 봄, 우에노 공원 벚꽃길.': '— 去年春天，上野公园的樱花道。',
    '켄은 걷다가 길바닥에 침을 뱉었다. 하필 지나가던 여고생 신발 위로.': '健边走边往地上吐了一口口水。偏偏吐在了路过的女高中生鞋上。',
    '야! 너 지금 뭐 한 거야?!': '喂！你刚才干什么呢？！',
    '짝! 성질 더러운 여고생의 싸대기 한 방.': '啪！暴脾气女高中生甩来一记耳光。',
    '그런데 휘두른 기세에 미끄러져, 여고생은 그대로 기절해 버렸다.': '结果她用力太猛脚下一滑，自己当场晕了过去。',
    '켄은 속으로 놀랐지만, 옆에 앉아 태연한 척 기다렸다.': '健心里一慌，但还是坐在旁边，装作若无其事地等着。',
    '…으으. 양아치야, 어따 대고 손찌검이야!': '…呜。臭流氓，你竟敢对我动手！',
    '난 손 안 댔는데.': '我可没碰你。',
    '폭행죄로 신고하기 전에… 딸기 우유 사 줘.': '在我告你打人之前…先请我喝草莓牛奶。',
    '그날 둘은 벤치에 나란히 앉아 딸기 우유를 마셨다.': '那天，两人并排坐在长椅上喝了草莓牛奶。',
    '그러니까 오늘은 그날 코스 그대로 데이트야.': '所以今天的约会，就照那天的路线走一遍。',
    '귀찮은데.': '好麻烦。',
    '딸기 우유 사 줄게.': '我请你喝草莓牛奶。',
    '…가자.': '…走吧。',
    '저기! 우리 그 벤치… 어?': '那边！我们的那张长椅…咦？',
    '뭘 봐. 여기 우리 자리다.': '看什么看。这是我们的地盘。',
    '어머, 히로미잖아? 아직도 이 공원 오는구나.': '哎呀，这不是浩美吗？你还来这个公园啊。',
    '에리… 하필 너냐.': '惠理…怎么偏偏是你。',
    '딱 잠깐만 앉으면 돼. 비켜.': '我们就坐一会儿。让开。',
    '딸기 우유 들고 데이트? 애기냐?': '拿着草莓牛奶约会？小屁孩吗？',
    '툭. 류지가 켄 손의 딸기 우유를 쳐서 떨어뜨렸다.': '啪嗒。龙二一巴掌打掉了健手里的草莓牛奶。',
    '그거… 1주년 딸기 우유거든?!': '那可是…一周年的草莓牛奶啊？！',
    '…너 지금 선 넘었다.': '…你过分了。',
    '…제법이네.': '…有两下子。',
    '벤치 가져가. 대신 이걸로 끝 아니야, 히로미!': '长椅归你们。不过这事没完，浩美！',
    '딸기 우유값은 받는다.': '草莓牛奶的账，我收了。',
    '…새로 사 줄게. 두 개.': '…给你买新的。两瓶。',
    '다음은 오리배! 작년에도 탔잖아.': '下一站，鸭子船！去年也坐过呢。',
    '줄이 길다.': '队好长。',
    '실례~ 우리 먼저 탈게.': '不好意思~我们先坐啦。',
    '어이, 또 너희냐.': '哟，又是你们？',
    '새치기하지 마. 줄은 뒤로 서.': '别插队。排到后面去。',
    '벤치에서 이겼다고 기고만장하네?': '抢了个长椅就这么嚣张？',
    '줄 순서는 주먹으로 정하자고.': '排队顺序，用拳头来定吧。',
    '…오리배 한 번 타기 힘드네.': '…坐个鸭子船怎么这么难。',
    '오리배 따위… 다음엔 안 져!': '区区鸭子船…下次绝不会输！',
    '에리랑 무슨 사이야.': '你和惠理是什么关系？',
    '…중학교 때 분수 광장에서 KPOP 댄스 연습했거든. 사람들이 박수도 쳐 줬고.': '…初中时我在喷泉广场练KPOP舞。大家还给我鼓掌呢。',
    '그날 류지랑 에리가 스피커를 차 버렸어. 그 뒤로 거기서 못 췄지.': '那天龙二和惠理把我的音箱踢翻了。从那以后我再也没在那儿跳过。',
    '…그래서 아까부터 그 눈빛이었구나.': '…难怪你从刚才起就是那种眼神。',
    '소원판 쓰자. "켄이랑 내년에도 여기 오기."': '来写许愿牌吧。"明年也要和健一起来这里。"',
    '…크게 읽지 마.': '…别念那么大声。',
    '"켄이랑 내년에도"~? 아하하, 오글거려!': '"明年也要和健"~？啊哈哈，好肉麻！',
    '에리, 그거 이리 줘 봐.': '惠理，给我看看。',
    '돌려줘! 남의 소원을 왜 읽어!': '还给我！干嘛偷看别人的愿望！',
    '아직도 그렇게 순진하니? 분수 앞에서 KPOP 커버댄스 추던 애가.': '还这么天真啊？当年在喷泉前跳KPOP翻跳的小丫头。',
    '에리라고 했지. 그 판, 내려놔.': '你叫惠理是吧。把那块牌子放下。',
    '에리 건드리면 나도 가만 안 있는다.': '敢动惠理，我也不会放过你。',
    '먼저 건드린 건 너네야.': '是你们先招惹我们的。',
    '…소원판은 돌려주마.': '…许愿牌还你。',
    '흥. 내년에도 오기나 해.': '哼。明年记得再来啊。',
    '켄. 아까 화내 줘서 고마워.': '健，谢谢你刚才替我发火。',
    '딸기 우유값이다.': '就当是草莓牛奶钱。',
    '판다 보고 싶었는데… 오늘 쉬는 날이래.': '本来想看熊猫的…说今天闭园。',
    '…야. 켄.': '…喂。健。',
    '또.': '又来。',
    '아까는… 우리가 좀 심했다. 사과하러 왔다.': '刚才…是我们有点过分了。来道个歉。',
    '화해의 판다빵이야. 받아.': '这是求和的熊猫面包。拿着。',
    '어… 고, 고마워?': '啊…谢、谢谢？',
    '…라고 할 줄 알았냐!': '…你以为我会这么说吗！',
    '퍽! 판다빵이 켄의 얼굴에 날아들었다.': '啪！熊猫面包正中健的脸。',
    '…음식 가지고 장난치지 마라.': '…别拿食物开玩笑。',
    '비겁한 수까지 썼는데…': '连阴招都用上了…',
    '…분수 광장으로 와. 거기서 진짜로 끝내.': '…来喷泉广场。在那儿真正做个了断。',
    '좋아. 어차피 거기 갈 거였어.': '好啊。反正我们本来就要去那儿。',
    '판다빵은 맛있었다.': '熊猫面包挺好吃的。',
    '마지막은 분수 광장. 여기서 KPOP 커버댄스 출 거야. 중학교 때 못 끝낸 그 춤.': '最后一站，喷泉广场。我要在这里跳KPOP翻跳。就是初中时没跳完的那支舞。',
    '…여기서는 안 돼.': '…这里不行。',
    '에리가 여기서 댄스 연습한다. 비켜.': '惠理要在这里练舞。让开。',
    '에리가… KPOP을?': '惠理…也跳KPOP？',
    '그때 네가 박수받는 게 싫었어. 그래서 류지랑 스피커를 찼던 거야.': '那时候我看不惯你被大家鼓掌。所以才和龙二踢了你的音箱。',
    '…그랬구나.': '…原来是这样。',
    '그래도 오늘은 안 비켜. 이 자리는 이제 내 거야.': '但今天我不会让。这个位置现在是我的。',
    '말로는 안 끝나겠네.': '看来嘴上是谈不拢了。',
    '끝내고 싶으면 이겨 봐.': '想了断，就先赢了我们。',
    '…오늘은 졌다.': '…今天算我们输了。',
    '오늘만 진 거야. 내일 또 붙어.': '只是今天输了。明天再打。',
    '…귀찮은데.': '…好麻烦。',
    '에리. 그 곡 너도 다 외우고 있지? 같이 출래?': '惠理。那首歌你也全记得吧？一起跳吗？',
    '…누, 누가 너랑! …이번 한 번만이야.': '…谁、谁要跟你跳！…就这一次哦。',
    '스피커에서 KPOP이 흘러나온다. 분수 앞에서 히로미가 춤을 춘다. 슬쩍 에리도 똑같은 동작으로 따라 춘다. 사람들이 모여든다.':
      '音箱里响起KPOP。浩美在喷泉前跳起舞来。惠理悄悄跟上，跳着一模一样的动作。人群渐渐围了过来。',
    '너, 이름 뭐냐.': '你，叫什么名字？',
    '우에노 공원 켄이라… 우에노짱이라고 불러 주지.': '上野公园的健啊…以后就叫你上野最强吧。',
    '그 이름 촌스러.': '这名字好土。',
    '난 좋은데? 우에노짱.': '我觉得挺好啊？上野最强。',
    '…딸기 우유 하나 더.': '…再来一瓶草莓牛奶。'
  };

  const D = ZHL ? ZH : T, EX = ZHL ? EXACT_ZH : EXACT;
  let RE = null;
  function build() {
    const keys = Object.keys(D).sort((a, b) => b.length - a.length);
    RE = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  }
  function L(s) {
    if (!(EN || ZHL) || !s || typeof s !== 'string') return s;
    const t = s.trim();
    if (EX[t]) return s.replace(t, EX[t]);
    if (!/[가-힣]/.test(s)) return s;
    if (!RE) build();
    return s.replace(RE, m => D[m]);
  }
  window.L = L;
  window.LANG = { en: EN, zh: ZHL, dict: D };

  if (ZHL) {
    document.documentElement.lang = 'zh-CN';
    document.title = '上野最强';
    // 게임 글꼴에 없는 한자는 시스템 중국어 글꼴로 채운다
    const zf = "local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('MicrosoftYaHei-Bold'),local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Title', 'Ria'].map(f => `@font-face{font-family:'${f}';src:${zf};unicode-range:${ur}}`).join('') +
      'html[lang=zh-CN] *{word-break:normal!important}';
    (document.head || document.documentElement).appendChild(st);
  }
  if (EN || ZHL) {
    if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'UENO ZZANG';
    // 제목 글꼴(Title)은 영문 대문자만 있다 — 큰 띠 글자는 대문자로
    const st = document.createElement('style');
    st.textContent = '#banner, #praise { text-transform: uppercase; } #talkLine { word-break: normal; }' +
      ' #bDodge, #bJump, #bSwap { font-size: 12px; } #bSpecial { font-size: 10px; } #bKick { font-size: 13px; }';
    (document.head || document.documentElement).appendChild(st);
    }
    const ATTRS = ['title', 'aria-label', 'placeholder'];
    const walk = n => {
      if (n.nodeType === 3) { const v = L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
      if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
      for (const a of ATTRS) { const o = n.getAttribute(a); if (o) { const v = L(o); if (v !== o) n.setAttribute(a, v); } }
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
