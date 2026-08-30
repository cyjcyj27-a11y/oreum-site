// ---------- MBTI사주 언어 지원 (한국어/영어) ----------
// 루루 게임과 같은 방식: 코드는 한국어 그대로 두고, 화면에 글자가 찍히는 순간
// 사전에서 영어를 찾아 바꿔치기합니다. 사전에 없는 문구는 한국어로 나옵니다(안전).
(function () {
  let lang = null;
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'ko') { lang = q; localStorage.setItem('saju_lang', q); }
    if (!lang) {
      const saved = localStorage.getItem('saju_lang');
      if (saved === 'en' || saved === 'ko') lang = saved;
    }
  } catch (e) {}
  /* 어느 나라 말로 보여줄지 정합니다.

     navigator.language 하나만 보면 안 됩니다. 카카오톡·인스타처럼 앱 안에서 링크를 열면
     그 값이 'en-US' 로 나오는 경우가 많아, 한국 사람인데 영어판이 뜹니다.
     그래서 브라우저가 주는 언어 목록 전체와 시간대까지 같이 봅니다.
     (한국에 사는 외국인은 한국어가 뜰 수 있지만, 오른쪽 위 English 단추로 바꾸면 기억합니다) */
  function detectLang() {
    try {
      const list = [];
      if (navigator.languages && navigator.languages.length) list.push(...navigator.languages);
      if (navigator.language) list.push(navigator.language);
      if (navigator.userLanguage) list.push(navigator.userLanguage);
      for (const v of list) {
        if (String(v).toLowerCase().indexOf('ko') === 0) return 'ko';
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Asia/Seoul') return 'ko';
    } catch (e) {}
    return 'en';
  }
  if (!lang) lang = detectLang();
  window.SAJU_LANG = lang;
  document.documentElement.lang = lang;

  // ----- 사전: 문구가 그대로 나오는 것들 (줄 단위) -----
  const DICT = {
    // 히어로 (2026-08-13 개편 문구)
    '나도 몰랐던 나를 만나다': 'Meet the you that you never knew',
    'MBTI × 사주 분석 엔진': 'MBTI × Saju analysis engine',
    '업데이트 예정': 'update coming soon',
    '현재 이용 가능 • 계속 업데이트 예정': 'Available now • more updates coming',
    '당신이 오해하고 있던 자신을 다시 해석합니다': 'Reinterpreting the self you have been misreading',
    // 모드 탭 · 관계역학 입력 화면
    '내 분석': 'My reading',
    '관계역학': 'Relationship dynamics',
    // 공사중 안내
    '공사 중': 'Under construction',
    '관계역학은 지금 만드는 중입니다': 'Relationship Dynamics is being built right now',
    '연인 · 친구 · 부모자식 · 직장 — 같은 두 사람이라도 관계가 다르면 궁합이 어떻게 달라지는지 보여드릴 예정입니다.': "Partners, friends, parent & child, coworkers — we'll show how the same two people match differently in each relationship.",
    '곧 공개됩니다.': 'Coming soon.',
    '어떤 관계인가요': 'What kind of relationship?',
    '연인': 'Partners', '친구': 'Friends', '부모자식': 'Parent & child', '일 · 직장': 'Work',
    '연애 · 부부': 'Dating / married', '친구 · 소울메이트': 'Friends / soulmates',
    '나=부모, 상대=자녀': 'You = parent, other = child', '동료 · 상사 · 사업 파트너': 'Coworker / boss / business partner',
    '부모자식을 고르면 첫 번째 사람이 부모입니다.': 'For parent & child, the first person is the parent.',
    '첫 번째 사람 (나)': 'First person (you)',
    '두 번째 사람 (상대)': 'Second person',
    '선택 — 비우면 사주로 추정': 'optional — leave empty to estimate from saju',
    '두 사람의 관계 보기': 'See how you two relate',
    '같은 두 사람이라도': 'Even the same two people —',
    '관계가 다르면 궁합도 다릅니다.': 'a different relationship makes a different match.',
    '친구로는 최고인데 일로는 위험한 조합이 있는 이유를 보여드립니다.': 'We show why some pairs are perfect as friends but risky as business partners.',
    '재미와 관계 이해를 위한 서비스입니다. 관계를 단정하지 않으며,\n        결혼 · 채용 · 인생 결정의 근거로 쓰지 마세요.': 'This service is for fun and understanding your relationships. It does not judge them. Do not use it for marriage, hiring, or life decisions.',
    // 관계역학 결과 화면
    '같은 두 사람, 관계가 다르면': 'Same two people, different relationship',
    '잘 맞는 포인트': 'Where you click',
    '부딪히는 장면 — 미리 알면 절반은 피한다': 'Where you clash — seeing it coming is half the cure',
    '사주가 말하는 두 사람': 'What saju says about you two',
    '점수 차이가 곧 이 조합의 성격입니다. 어울리는 자리에서 만나면 같은 사람도 다르게 빛납니다.': 'The gap between these scores is the character of this pair. Meet in the right role, and the same person shines differently.',
    // 입력 화면
    'MBTI사주': 'MBTI Saju',
    '이름': 'Name',
    '선택': 'optional',
    '필수': 'required',
    '비워두셔도 됩니다': 'You can leave this empty',
    '생년월일': 'Date of birth',
    '년': 'yr', '월': 'mo', '일': 'day',
    '양력으로 입력해 주세요.': 'Please use the solar calendar.',
    '태어난 시간': 'Time of birth',
    '모르면 그냥 두세요. 시간을 넣으면 결과가 더 촘촘해집니다.': "Don't know it? Just leave it. Adding the time makes the reading sharper.",
    '성별': 'Gender',
    '선택 안 함': 'Skip',
    '여성': 'Female',
    '남성': 'Male',
    '선택 안 함 — 사주로 추정합니다.': 'None selected. We will estimate it from your saju.',
    '내 성향 분석하기': 'Analyze my personality',
    '태어난 시간을 넣으면 추정이 훨씬 정확해집니다.': 'Adding your birth time makes the estimate much more accurate.',
    '재미와 자기 이해를 위한 서비스입니다. 미래를 단정하지 않으며,\n        의료 · 법률 · 투자 판단의 근거로 쓰지 마세요.': 'This service is for fun and self-understanding. It does not predict the future. Do not use it for medical, legal, or investment decisions.',
    '오름게임즈 홈페이지 →': 'Oreum Games homepage →',
    '최근 분석': 'Recent readings',
    '결과 복사하기': 'Copy my results',
    '비견형': 'Bigyeon type', '겁재형': 'Geopjae type', '식신형': 'Siksin type', '상관형': 'Sanggwan type',
    '편재형': 'Pyeonjae type', '정재형': 'Jeongjae type', '편관형': 'Pyeongwan type', '정관형': 'Jeonggwan type',
    '편인형': 'Pyeonin type', '인수형': 'Insu type',
    '자기 기준이 뚜렷한 사람': 'The one with standards of their own',
    '승부욕이 살아있는 사람': 'The one whose will to win is alive',
    '꾸준히 만들어내는 사람': 'The one who steadily creates',
    '틀을 깨는 사람': 'The one who breaks the mold',
    '기회를 잡는 사람': 'The one who seizes the chance',
    '착실하게 쌓는 사람': 'The one who builds brick by brick',
    '스스로를 몰아붙이는 사람': 'The one who drives themselves hard',
    '원칙을 지키는 사람': 'The one who keeps the rules',
    '혼자 깊이 파고드는 사람': 'The one who digs deep alone',
    '배우고 가르치는 사람': 'The one who learns and teaches',
    '자기 기준이 뚜렷한': 'The self-anchored', '승부욕이 살아있는': 'The win-driven',
    '꾸준히 만들어내는': 'The steady maker', '틀을 깨는': 'The mold-breaking',
    '기회를 잡는': 'The chance-seizing', '착실하게 쌓는': 'The brick-by-brick',
    '스스로를 몰아붙이는': 'The self-driving', '원칙을 지키는': 'The rule-keeping',
    '혼자 깊이 파고드는': 'The deep-digging', '배우고 가르치는': 'The learning-and-teaching',
    '역마살': 'Yeokma (traveler star)', '도화살': 'Dohwa (peach-blossom star)',
    '화개살': 'Hwagae (canopy star)', '괴강살': 'Goegang (fierce star)',
    '백호살': 'Baekho (white-tiger star)', '양인살': 'Yangin (blade star)',
    '귀문관살': 'Gwimun (spirit-gate star)', '문창귀인': 'Munchang (literary benefactor)',
    '천을귀인': 'Cheoneul (noble benefactor)',
    '움직이는 힘': 'The power of movement',
    '사주에 붙은 별 기운 (신살)': 'Star signs on your chart (sinsal)',
    '당신의 귀인': 'Your benefactor',
    '사주로 보면 어떤 유형일까': 'What type your saju suggests',
    '태어난 연도를 확인해 주세요': 'Please check the birth year',
    '월은 1~12 사이입니다': 'Month must be between 1 and 12',
    '일은 1~31 사이입니다': 'Day must be between 1 and 31',
    '그런 날짜는 없습니다. 다시 확인해 주세요': 'No such date exists — please check again',
    '시간 모름': 'time unknown',
    '띠 궁합 (겉궁합)': 'Zodiac-animal match (outer layer)',
    '여기부터는 추정입니다': 'From here on, this is an estimate',
    '힘들 때는 이 말을 기억하세요.': 'When it gets hard, remember these words.',
    '타고난 바탕이 있는 자리라 힘이 오래갑니다.': 'It rests on inborn ground, so its strength lasts.',
    '사주에 처음부터 있던 기운은 아닙니다.': 'This was not an energy your chart started with.',
    '살아오면서 스스로 키워낸 특성입니다.': 'It is a trait you grew yourself along the way.',
    '타고난 것은 누구나 갖고 태어나지만, 이건 당신이 만든 것입니다.': 'Everyone is born with something — but this one, you made.',
    '도드라지는 신살이 없습니다. 기운이 한쪽으로 쏠리지 않았다는 뜻이라, 어느 판에 가도 무난하게 섞이는 사주입니다.': 'No star sign stands out in your chart. That means the energy is not tilted to one side — a chart that blends in comfortably anywhere.',
    '이 글자를 사주에 가진 사람이 곁에 있으면 당신의 귀인 기운이 깨어난다고 봅니다. 특히 상대의 일지나 월지에 있을 때 힘이 큽니다.': 'When someone who carries this sign is near you, your benefactor energy is said to awaken — strongest when it sits in their day or month branch.',
    '당신은 이 글자를 이미 사주 안에 품고 있습니다. 어려울 때 도와주는 사람이 나타나는 자리입니다.': 'You already carry this sign inside your own chart — a seat where helpers appear when times are hard.',
    '당신 사주에는 이 글자가 없습니다. 그래서 이 글자를 가진 사람을 만나면 유난히 일이 풀립니다. 귀인은 밖에서 옵니다.': 'Your chart does not hold this sign. That is why things untangle unusually well when you meet someone who does — your benefactor comes from outside.',
    '가까운 사람의 생년월일로도 결과를 뽑아보세요. 서로가 서로의 귀인 글자를 갖고 있다면, 명리에서 말하는 가장 좋은 짝입니다.': 'Try running the birth dates of people close to you. If you each carry the other\'s benefactor sign, saju calls that the finest match there is.',
    '다만 여기까지가 추정입니다.': 'But this is where the estimate ends.',
    '사주와 MBTI를 잇는 검증된 연구는 없고, 이 대응표는 저희가 세운 가설입니다.': 'No verified research links saju and MBTI — this mapping is our own hypothesis.',
    '본인 유형을 알고 계시면 처음 화면에서 골라 주세요.': 'If you know your own type, pick it on the first screen.',
    '그때는 추정 대신 그 유형 사람들이 실제로 한 말을 보여드립니다.': 'Then, instead of an estimate, we show you what people of that type have actually said.',
    '태어난 시간을 넣으면 글자가 두 개 늘어 추정이 조금 더 촘촘해집니다.': 'Add your birth time and two more characters join the chart, tightening the estimate.',
    '신살은 사주 해석의 2할쯤 되는 보조 지표입니다.': 'Star signs are a side indicator — about a fifth of a saju reading.',
    '재미로 보되, 좋은 쪽으로 써먹으면 됩니다.': 'Take them as fun, and put the good ones to use.',
    '친구에게 공유': 'Share with a friend',
    '공유 문구를 복사했습니다. 카톡에 붙여넣어 주세요': 'Share text copied — paste it to a friend',
    '다시 하기': 'Start over',
    '결과를 복사했습니다': 'Results copied',
    '복사가 안 됩니다. 길게 눌러 선택해 주세요': 'Copy failed. Long-press to select the text',
    '모름 / 생략': 'Unknown / skip',
    // 결과 소제목 (고정)
    '강점, 그리고 그 뒷면': 'Your strengths, and their shadow side',
    '글자들의 관계 (십신)': 'How the characters relate (Ten Gods)',
    '나의 성향 점수 20': 'My 20 personality scores',
    '낮게 나온 성향': 'Traits that scored low',
    '당신이 또 하게 될 일': "Things you'll catch yourself doing again",
    '사주가 가리키는 MBTI': 'The MBTI your saju points to',
    '아무도 말해주지 않은 것': 'What nobody ever told you',
    '오늘의 한마디': "Today's one-liner",
    '오장육부': 'Five organs, six viscera',
    '올해의 흐름': "This year's current",
    '타고난 기운의 분포': 'Your innate energy balance',
    '기본 성향': 'Core temperament',
    '돈': 'Money',
    '사랑': 'Love',
    '인간관계': 'Relationships',
    '일과 직업': 'Work and career',
    '스트레스': 'Stress',
    '건강': 'Health',
    '공부': 'Study',
    '가족': 'Family',
    '성장 조언': 'Advice for growth',
    '사상체질': 'Sasang constitution',
    // 오행
    '목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water',
    // 십신 (다섯 묶음과 열 글자)
    '비겁': 'Peers', '식상': 'Output', '재성': 'Wealth', '관성': 'Discipline', '인성': 'Support',
    '비견': 'Companion', '겁재': 'Rival', '식신': 'Gourmet', '상관': 'Maverick',
    '편재': 'Windfall wealth', '정재': 'Steady wealth', '편관': 'Iron discipline', '정관': 'Fair discipline',
    '편인': 'Odd wisdom', '정인': 'Warm wisdom', '인수': 'Warm wisdom',
    // 천간
    '갑': 'Gap', '을': 'Eul', '병': 'Byeong', '정': 'Jeong', '무': 'Mu',
    '기': 'Gi', '경': 'Gyeong', '신': 'Sin', '임': 'Im', '계': 'Gye',
    // 지지
    '자': 'Ja', '축': 'Chuk', '인': 'In', '묘': 'Myo', '진': 'Jin', '사': 'Sa',
    '오': 'O', '미': 'Mi', '유': 'Yu', '술': 'Sul', '해': 'Hae',
    // 계절과 띠 동물 (한 글자짜리)
    '봄': 'Spring', '여름': 'Summer', '가을': 'Autumn', '겨울': 'Winter',
    '쥐': 'Rat', '소': 'Ox', '범': 'Tiger', '호랑이': 'Tiger', '토끼': 'Rabbit',
    '용': 'Dragon', '뱀': 'Snake', '말': 'Horse', '양': 'Sheep', '원숭이': 'Monkey',
    '닭': 'Rooster', '개': 'Dog', '돼지': 'Pig',
    // 오장육부의 한 글자짜리 신체 용어
    '간': 'Liver', '폐': 'Lungs', '위': 'Stomach', '눈': 'Eyes', '혀': 'Tongue',
    '입': 'Mouth', '코': 'Nose', '귀': 'Ears', '살': 'Flesh', '뼈': 'Bones', '피': 'Blood',
    // 결과 화면 고정 라벨·조각
    '당신은': 'You are',
    '사주에서 읽은 인지기능': 'Cognitive functions read from your saju',
    '시주': 'Hour pillar', '일주': 'Day pillar', '월주': 'Month pillar', '연주': 'Year pillar',
    '일간': 'day master',
    '시간 미입력': 'birth time not entered',
    '시간 모름': 'Time unknown',
    // "금색"은 색깔(강조 표시)이지 오행의 金이 아님 — Metal로 오독되지 않게 번역
    '가운데 금색으로 빛나는 기둥이': 'The pillar highlighted in gold color is your ',
    "— 사주에서 '나 자신'을 뜻합니다.": ': in saju, it means "you yourself".',
    '태어난 시간을 넣으면 글자가 2개 늘어 추정이 더 촘촘해집니다.': 'Add your birth time and two more characters join the chart, making the reading sharper.',
    '밝은 면': 'Bright side',
    '그늘': 'Shadow',
    '낮아서 얻는 것': 'What the low score gives you',
    '좋은 점': 'Upsides',
    '힘든 점': 'Hard parts',
    '잘 풀리는 것': 'What flows well',
    '조심할 것': 'What to watch',
    '정 떨어지는 순간': 'Instant turn-offs',
    '마음이 열리는 말': 'Words that open the heart',
    '밈': 'Meme',
    '나머지 12개 더 보기': 'See the other 12',
    '간담': 'Liver · Gallbladder', '심소': 'Heart · Small intestine', '비위': 'Spleen · Stomach',
    '폐대': 'Lungs · Large intestine', '신방': 'Kidneys · Bladder',
    '· 토정비결 144괘 중': '· of the 144 Tojeong hexagrams',
    '타고난 것과 살아온 것이 겹쳐서 유난히 세게 드러납니다.': 'What you were born with and how you have lived point the same way, so it shows unusually strongly.',
    '힘든 일이 생겨도 누구에게 기대야 할지 몰라서 그냥 혼자 삼켰을 겁니다. 도와달라는 말이 유난히 안 나오는 사람입니다.': 'When hard things happened, you probably swallowed them alone, not knowing who to lean on. Asking for help just does not come out of you.',
    '자존심이 세서가 아닙니다. 기대본 적이 없어서 방법을 모르는 것뿐입니다. 기대는 것도 배워야 하는 일입니다.': 'It is not pride. You simply never learned how, because you never got to lean on anyone. Leaning is something you learn too.',
    '이중적인 것이 아니라 폭이 넓은 것입니다.': 'That is not being two-faced. That is range.',
    '어릴 때부터 이랬을 겁니다.': 'You have probably been this way since you were small.',
    '어떤 방식으로 일할 때 편한가': 'how you prefer to work',
    '두 힘이 다른 쪽을 봅니다.': 'The two forces look in different directions.',
    '그래서 상황에 따라 사람이 달라 보입니다.': 'That is why you can seem like a different person in different settings.',
    '— 사주에 드러나지 않는 기운입니다. 없다고 나쁜 것이 아니라, 그 부분은 노력으로 채워온 영역일 가능성이 큽니다.': ': energies that do not surface in your chart. Missing is not bad. Chances are, you have filled that part in through effort.',
    '불 기운이 유난히 셉니다.': 'the fire energy runs unusually strong.',
    '물 기운이 유난히 셉니다.': 'the water energy runs unusually strong.',
    '나무 기운이 유난히 셉니다.': 'the wood energy runs unusually strong.',
    '흙 기운이 유난히 셉니다.': 'the earth energy runs unusually strong.',
    '쇠 기운이 유난히 셉니다.': 'the metal energy runs unusually strong.',
    '슬픔': 'sadness', '기쁨': 'joy', '분노': 'anger', '걱정': 'worry', '두려움': 'fear',
    '피부와 털': 'skin and hair',
    '목표가 보이면 경로부터 만듭니다.': 'When a goal appears, you build the route first.',
    '결정이 빠르고, 결정한 것은 밀어붙입니다.': 'You decide fast, and you push through what you decide.',
    '조직 운영·사업·프로젝트 총괄': 'running organizations, business, and overseeing whole projects',
    '이중적인 것이 아니라 재료가 둘인 것입니다.': 'That is not being two-faced. You simply have two ingredients.',
    '이 흐름에서는 한 박자가 빠를 수 있습니다.': 'in this current you may run one beat too fast.',
    '결정 하나만 하루 미뤄두면 충분합니다.': 'Holding just one decision for a day is enough.',
    '흰빛과 연결됩니다.': 'linked to white light.',
    '흰빛과 연결됩니다': 'linked to white light',
    '본인도 어디서 나오는지 몰랐던 힘입니다.': 'A strength even you never knew the source of.',
    '피부가 희고 얇은 쪽': 'fair, thin skin',
    '장생': 'Birth', '목욕': 'Bath', '관대': 'Coming of age', '건록': 'Prime', '제왕': 'Peak',
    '절': 'Severance',
    '푸른빛과 연결됩니다.': 'linked to blue-green light.',
    '붉은빛과 연결됩니다.': 'linked to red light.',
    '누런빛과 연결됩니다.': 'linked to yellow light.',
    '검은빛과 연결됩니다.': 'linked to black light.',
    // ===== 자미두수 추가분 (2026-08-31, 자미두수영문사전.py) =====
    '사주와는 계산법이 다른 별개의 방식입니다. 사주가 절기로 여덟 글자를 세운다면, 자미두수는 음력으로 별을 열두 칸에 앉혀 인생의 영역별로 읽습니다. 두 풀이가 조금 다르게 보이면, 같은 사람을 다른 각도에서 본 것입니다.': 'This is a separate system with its own maths. Saju builds eight characters from the solar terms; Ziwei Doushu seats stars in twelve cells using the lunar calendar and reads them area by area. If the two readings differ a little, it is the same person seen from another angle.',
    '계절이 한창인 글자끼리 정면으로 부딪히는 배치입니다. 결과가 중간에 머물지 않고 한쪽으로 확 기울어서, 아니다 싶으면 지난 것을 통째로 잘라내고 새로 시작합니다. 이별도 싸움도 뒤끝이 없는 편입니다.': 'Characters at the height of their season collide head on. Outcomes do not settle in the middle but tip hard one way, so once it feels wrong you cut the whole past off and start again. You tend to leave no residue after a parting or a fight.',
    '나를 돕는 글자가 겉에 하나도 없는 배치입니다. 그런데 실제로는 오히려 아주 강한 사람처럼 보이는 경우가 많습니다. 겉의 단단함과 속의 소모가 다른 유형이라, 회복하는 시간을 스스로 챙겨야 합니다.': 'Not one visible character helps you. In practice, though, such people often come across as very strong. The hardness outside and the drain inside are different things here, so you have to look after your own recovery time.',
    '무리 속에서 자연히 가운데 자리에 놓입니다. 나서려 하지 않아도 결정을 물어오는 쪽이 되고, 맡으면 격을 지키려 애씁니다. 어느 궁에 들든 그 영역에서 주도권을 쥐려는 결로 나타납니다.': 'You end up at the centre of a group without meaning to. Even when you do not step forward, people bring decisions to you, and once you take something on you try to do it with dignity. In whichever palace it sits, it shows as wanting the lead in that area.',
    '명반은 음력 생일로 세웁니다. 태어난 해의 간지도 사주처럼 입춘이 아니라 음력 설을 경계로 잡는 것이 자미두수의 방식이라, 1~2월에 태어난 분은 사주 화면과 띠가 다를 수 있습니다.': 'The chart is built from your lunar birthday. Ziwei Doushu also takes the lunar New Year, not the start of spring, as the boundary of the birth year, so anyone born in January or February may see a different zodiac animal here than in the Saju reading.',
    '가장 힘이 센 자리에 정관이 앉고, 그것을 깨는 상관이 없는 배치입니다. 규칙이 살아 있는 판에서 순서대로 올라가는 유형이라, 편법이 통하는 자리에 가면 오히려 헤맵니다.': 'The proper-officer star sits in the strongest seat, and nothing is there to break it. You are the type who rises in order where rules are alive, so a place where shortcuts work leaves you lost instead.',
    '한겨울에 태어났는데 데워줄 불이 한 글자도 없는 배치입니다. 능력이 있어도 밖으로 나오는 속도가 느리니, 몸을 움직이게 만드는 환경을 일부러 만들어 두는 것이 처방입니다.': 'Born in deep winter with not one character of fire to warm it. Ability is there but comes out slowly, so deliberately building an environment that gets your body moving is the prescription.',
    '나를 통제해야 할 기운이 나를 확실히 누르지 못해, 나와 조직의 경계가 흐려지는 배치입니다. 규칙과 부딪히기보다 안으로 스며들어 뜻을 이루는 쪽이 이 사주의 방식입니다.': 'The force meant to control you cannot hold you down cleanly, so the line between you and the organisation blurs. This chart’s way is to seep inward and get its will done rather than collide with the rules.',
    '납득이 안 되면 넘어가지 않습니다. 남들이 그냥 지나치는 것을 붙들고 파고들어, 결국 핵심을 찾아냅니다. 말로 설명하는 재주가 있어 가르치거나 설득하는 자리에 맞습니다.': 'If it does not convince you, you do not let it pass. You take hold of what others walk by and dig until you find the core. You have a gift for explaining, which suits seats that teach or persuade.',
    '계절을 여는 글자끼리 부딪히는 배치입니다. 삶의 진폭이 크고 예측이 잘 안 되는 대신, 가라앉은 판에 시동을 거는 힘이 남다릅니다. 에너지를 밖으로 써야 편해집니다.': 'The characters that open a season collide. The swing of your life is wide and hard to predict, but your power to start an engine in a flat room is unusual. Spending that energy outward is what makes you comfortable.',
    '나와 같은 급의 글자가 여럿인 배치입니다. 주변에 사람은 많은데 한 사람 몫으로 오는 지원은 얇아지는 구조라, 넓게 걸치기보다 한두 곳을 깊게 두는 편이 낫습니다.': 'There are several characters of the same rank as you. People are many but the support arriving as any one person’s share is thin, so it is better to go deep in one or two places than wide across many.',
    '밖으로 내주는 면과 안으로 품는 면을 같이 가졌습니다. 기분의 낮과 밤이 뚜렷해, 스스로도 종잡기 어려울 때가 있습니다. 오르내림을 기록해 두면 다루기 쉬워집니다.': 'You hold both the side that gives outward and the side that holds inward. Your mood has a clear day and night, so even you find it hard to place at times. Keeping a note of the rise and fall makes it easier to handle.',
    '상황을 읽고 수를 짜는 데 빠릅니다. 남들이 아직 보고 있을 때 이미 몇 수 앞을 계산합니다. 배우기를 좋아하고 화제가 넓어, 어디에 놓아도 금세 요령을 잡습니다.': 'You are fast at reading a situation and working out moves. While others are still looking, you have already counted several steps ahead. You like learning and range widely, so you pick up the knack of anything quickly.',
    '자미두수는 태어난 시간이 있어야 판이 세워집니다. 명궁 자리가 태어난 달과 시각으로 정해지기 때문에, 시간을 모르면 열두 칸 중 어디가 시작인지 알 수 없습니다.': 'Ziwei Doushu needs your birth time before a chart can be built. The Life palace is fixed by your birth month and hour, so without the time there is no way to know which of the twelve cells the chart starts from.',
    '가운데서 조율하고 저장하는 기운이 두꺼운 배치입니다. 사람과 일 사이를 잇는 자리에 잘 맞고 끈기가 있는데, 모아두는 쪽으로 기울면 결정을 오래 미루게 됩니다.': 'The energy that mediates and stores from the middle is thick here. You suit the seat that links people to work and you have staying power, but tipped toward hoarding you put decisions off for a long time.',
    '관심이 넓고 배우는 속도가 빠릅니다. 어디에 데려다 놔도 사람들과 어울리고, 유행과 분위기를 읽는 감각이 좋습니다. 원하는 게 분명하고 그것을 숨기지 않습니다.': 'Your interests run wide and you learn fast. Put you anywhere and you mix with people, with a good feel for trends and mood. You know what you want and you do not hide it.',
    '배우자 자리에 어머니의 별이 앉은 배치입니다. 결혼 뒤에도 원가족과의 거리 조절이 숙제가 되기 쉬워서, 두 집 사이의 규칙을 일찍 정해두면 갈등이 크게 줍니다.': 'The mother star sits in the spouse seat. Managing distance from your family of origin easily stays homework after marriage, so setting the rules between the two households early cuts the conflict sharply.',
    '어디에 놓아도 잘 어울립니다. 각을 세우지 않고 사람 사이에 스며들어, 낯선 자리에서도 도와주는 사람을 만납니다. 급하게 굴지 않는 것이 이 사람의 힘입니다.': 'You fit in wherever you are put. You seep between people without raising an edge, and even in unfamiliar places you meet someone who helps. Not rushing is this person’s force.',
    '이끄는 힘과 지키는 힘을 함께 가졌습니다. 남 밑에 오래 있기 어렵고, 결국 자기 판을 벌여 사장 자리에 앉는 결입니다. 말투가 정중하면서도 무게가 있습니다.': 'You hold both the force to lead and the force to keep. Staying long under someone else is hard, and the grain of it is that you end up opening your own board and sitting at the head of it. Your way of speaking is courteous and weighted at once.',
    '맡을 자리와 그것을 받쳐줄 자격이 둘 다 있는 배치입니다. 조직 안에서 순서대로 올라가는 데 유리해서, 자격을 먼저 갖추고 자리를 받는 순서가 잘 맞습니다.': 'Both the post to take and the credential to back it are present. This favours rising in order inside an organisation, so getting qualified first and taking the post after suits you.',
    '받아들이고 준비하는 기운이 넘치는데, 그것을 현실로 눌러주는 재물의 별도 함께 있는 배치입니다. 생각만 길어질 때 마감이나 숫자를 걸어두면 바로 굴러갑니다.': 'The energy that takes in and prepares overflows, and the wealth star that presses it into reality is here too. When the thinking runs long, setting a deadline or a number gets it rolling at once.',
    '여덟 글자가 거의 다 양으로 채워진 배치입니다. 좋은 일이든 나쁜 일이든 빠르고 크게 벌어지는 리듬이라, 숨기고 기다리는 방식은 이 사주에 잘 안 맞습니다.': 'Almost all eight characters are filled with yang. Good or bad, things happen fast and large, so hiding and waiting does not suit this chart.',
    '있던 틀을 그대로 두지 못합니다. 남이 다 간 길보다 아무도 안 간 길에 끌리고, 뒤엎은 자리에 새 판을 세웁니다. 변화가 잦은 만큼 인생의 굴곡도 큽니다.': 'You cannot leave an existing frame as it is. You are drawn to the road nobody has taken over the one everyone has, and you set a new board where you overturned the old one. As often as things change, the swings in your life are wide.',
    '화려하게 내보이지 않습니다. 상대의 기분을 먼저 읽고 조용히 챙기는 쪽이라, 곁에 오래 있어 본 사람만 그 깊이를 압니다. 안으로 향하는 감수성이 큽니다.': 'You do not put yourself on display. You read the other person’s mood first and look after them quietly, so only those who have stayed near a long time know the depth. Your sensitivity turns inward.',
    '맡는 자리는 있는데 그것을 받쳐줄 자격과 지원이 겉에 없는 배치입니다. 직책에 비해 뒷심이 달리기 쉬우니, 공부와 자격을 채우는 것이 곧 방어가 됩니다.': 'There is a post to take but no visible credential or support beneath it. Your staying power runs short for the title, so filling in study and qualifications is itself the defence.',
    '여덟 글자에 재물의 별이 없습니다. 없다고 못 버는 것이 아니라 원국에 존재감이 없다는 뜻이라, 재물 운이 들어오는 시기에 몰아서 터지는 구조로 봅니다.': 'There is no wealth star among the eight characters. That does not mean you cannot earn — it means it has no presence in the natal chart, so it is read as breaking out in a rush when a wealth period arrives.',
    '한쪽으로 기울지 않습니다. 양쪽 사정을 듣고 가운데를 찾는 데 능해, 사람들이 판단을 물어옵니다. 보좌하는 자리에서 특히 빛나고, 맡은 것에 성실합니다.': 'You do not tip to one side. You are good at hearing both cases and finding the middle, so people bring you their judgements. You shine especially in a supporting seat and are faithful to what you take on.',
    '격을 갖추려는 마음과 즐기려는 마음이 같이 있습니다. 사람을 끄는 힘이 크고, 그만큼 감정에 얽히는 일도 생깁니다. 관계에서 선을 정해 두면 편합니다.': 'The wish to keep standing and the wish to enjoy sit side by side. Your pull on people is strong, and getting tangled in feeling comes with it. Setting a line in relationships makes things easier.',
    '중심을 잡으면서 조율까지 합니다. 겉은 점잖은데 속의 기복이 빠른 편이라, 결정을 서두를 때가 있습니다. 사람 말을 끝까지 듣는 습관이 도움이 됩니다.': 'You hold the centre and coordinate as well. The outside is composed while the inside swings quickly, so you sometimes rush a decision. A habit of hearing people out helps.',
    '한번 붙으면 끝까지 가는 승부욕이 있고, 동시에 계산이 냉정합니다. 개성이 뚜렷해 사람의 시선을 끌지만, 그만큼 좋고 싫음이 분명해 호불호가 갈립니다.': 'Once you are in, you will go all the way, and at the same time your calculation stays cold. Your character is distinct enough to draw eyes, and just as distinct in what you like and dislike, so opinion divides.',
    '한여름에 태어났는데 식혀줄 물이 한 글자도 없는 배치입니다. 달아오르면 스스로 멈추기 어려우니, 쉬는 시간을 일정에 넣어두는 것이 실력 관리가 됩니다.': 'Born in high summer with not one character of water to cool it. Once you heat up it is hard to stop yourself, so putting rest into the schedule is how you manage your ability.',
    '목표가 서면 주저하지 않습니다. 돌아가는 길보다 뚫는 길을 고르고, 자기 색이 분명해 어디서든 눈에 띕니다. 남이 정해 준 자리는 오래 못 견딥니다.': 'Once a goal is set you do not hesitate. You choose the way through over the way around, and your own colour is clear enough to stand out anywhere. A seat someone else assigned does not hold you long.',
    '같은 흙끼리 부딪히는 배치라 큰 사건보다 잔일이 엉키는 쪽으로 나타납니다. 대신 낯선 판에 적응하고 이해가 갈린 사람들을 맞춰주는 재주가 붙습니다.': 'Earth colliding with earth, so it shows as small things tangling rather than large events. In exchange you gain a knack for settling into unfamiliar rooms and for aligning people whose interests differ.',
    '그 별에 마음이 강하게 쏠리는 자리입니다. 집착이나 막힘으로 나타날 수 있지만, 그만큼 힘이 모인 곳이라 잘 다스리면 가장 깊어지는 영역이 됩니다.': 'Your mind leans hard toward that star. It can show up as fixation or blockage, but it is also where your energy gathers, so handled well it becomes the area you go deepest in.',
    '나머지 자리는 내 편이 아닌데 가장 힘이 센 월지 하나가 나를 받쳐주는 배치입니다. 밖에서 보기엔 약해 보여도 끝까지 버티는 힘은 여기서 나옵니다.': 'The other seats are not on your side, but the strongest one — the month branch — holds you up. You may look weak from outside; this is where the power to hold out comes from.',
    '어려운 일이 생기면 수습하는 쪽에 섭니다. 나이보다 어른스럽다는 말을 듣고, 사람들이 기대옵니다. 원칙이 분명해 옳고 그름을 그냥 넘기지 못합니다.': 'When something hard happens you stand on the side that cleans it up. People say you are grown beyond your years, and they lean on you. Your principles are clear, so you cannot let right and wrong slide.',
    '한 기운이 판을 거의 다 차지한 배치입니다. 이런 사주는 균형을 맞추려 애쓰기보다 그 쏠린 기운을 아예 자기 정체성으로 삼는 편이 순리라고 봅니다.': 'One force takes up almost the whole board. For a chart like this, the natural way is not to labour after balance but to take that tipped force as your identity outright.',
    '나를 통제하는 별이 지나치게 많은 배치입니다. 책임이 몰릴수록 실력이 펴지지 않으니, 맡는 개수를 줄이는 것이 곧 성과를 올리는 방법이 됩니다.': 'The stars that control you are too many. The more duty piles on, the less your ability unfolds, so cutting the number of things you take on is itself how you raise results.',
    '높은 자리에 앉으면서 그 자리의 틀을 깹니다. 이상이 높고 남의 말에 흔들리지 않아, 성공하면 크게 갑니다. 벌린 것을 거두는 손이 필요합니다.': 'You take a high seat and break the frame of that seat. Your ideals run high and other people’s words do not shake you, so when it works it works large. You need a hand that gathers up what you spread.',
    '담을 그릇도 두껍고 담길 재물도 큰 배치입니다. 고전이 귀하게 치던 짜임이라, 판을 키우는 결정에서 겁먹지 않아도 되는 몇 안 되는 구조입니다.': 'The vessel is thick and what fills it is large. The classics counted this a noble build — one of the few structures that need not flinch at a decision to grow the board.',
    '모으기보다 내주는 쪽입니다. 사람이 모인 자리에서 분위기를 데우고, 남의 일을 제 일처럼 나섭니다. 원칙이 분명해 두루뭉술한 것을 못 견딥니다.': 'You give out rather than gather in. You warm the room where people meet and step into others’ business as if it were your own. Your principles are clear, so you cannot stand things left vague.',
    '배우자 자리가 한번 끊겼다 다시 이어지는 기운 위에 있습니다. 인연도 사는 곳도 변동이 잦은 대신, 상황이 바뀔 때 적응하는 속도가 남다릅니다.': 'The spouse seat sits on an energy that breaks and then reconnects. Both ties and places change often, and in exchange your speed of adapting when the situation shifts is unusual.',
    '지지가 나무의 세력으로 하나가 된 배치입니다. 굽히지 않고 곧게 뻗으려는 힘이 삶 전체를 관통해서, 한번 정한 방향은 웬만해선 바꾸지 않습니다.': 'The branches have massed into a single force of Wood. An unbending drive to grow straight runs through your whole life, and once you set a direction you rarely change it.',
    '권위와 돌파가 한자리에 있습니다. 통제받는 것을 싫어하고, 맡기면 끝을 봅니다. 말수가 적을 때 오해를 사기 쉬우니 뜻을 한 번 더 밝히세요.': 'Authority and breakthrough sit in one place. You dislike being controlled, and once handed something you see it through. When you say little you are easily misread, so state what you mean once more.',
    '두 명궁이 정면으로 마주 봅니다. 끌림이 세고 자극도 셉니다. 서로를 바꾸려 들면 부딪히고, 다르다는 것을 인정하면 서로의 빈 곳을 메웁니다.': 'The two Life palaces face each other head on. The pull is strong and so is the friction. Try to change each other and you clash; accept the difference and you fill each other’s gaps.',
    '둘 다 판을 바꾸는 쪽입니다. 같이 있으면 속도가 붙지만 멈춰 세울 사람이 없습니다. 벌인 것을 정리하는 규칙을 미리 정해 두면 오래 갑니다.': 'You both change the board. Together you pick up speed, but there is nobody to stop it. Agree in advance on a rule for tidying up what you start and it lasts.',
    '분석하고 말로 풀어냅니다. 남이 못 보는 결을 찾아내 설명하는 재주가 있습니다. 초반이 더디고 뒤에서 빛나는 결이라, 버티는 힘이 관건입니다.': 'You analyse and then unpack it in words. You have a gift for finding the grain others miss and explaining it. It runs slow early and shines later, so staying power is the key.',
    '지지가 물의 세력으로 하나가 된 배치입니다. 부딪히지 않고 스며들어 넓게 퍼지는 힘이라, 당장은 티가 안 나도 시간이 지나면 영향이 남습니다.': 'The branches have massed into a single force of Water. It seeps and spreads rather than collides, so nothing shows at once but the influence remains over time.',
    '한번 마음먹으면 끝을 봅니다. 설명하기 전에 이미 해 놓는 쪽이라, 말이 적어 차갑게 보이기도 합니다. 돈과 숫자를 다루는 감각이 뚜렷합니다.': 'Once you decide, you see it through. You have already done it before explaining, so being short on words can read as cold. Your feel for money and numbers is distinct.',
    '머리가 빠르면서 마음이 섬세합니다. 생각이 안으로 도는 편이라 겉보기보다 속이 깊습니다. 감정과 계산이 섞이지 않게 나누는 연습이 좋습니다.': 'A quick head with a fine-grained heart. Your thinking turns inward, so there is more depth than shows. Practise keeping feeling and calculation apart.',
    '지지가 불의 세력으로 하나가 된 배치입니다. 안에 담아두기보다 끊임없이 드러내고 퍼뜨리는 쪽이라, 조용한 자리에 오래 두면 사람이 시듭니다.': 'The branches have massed into a single force of Fire. You show and spread rather than hold in, so left too long in a quiet seat you wither.',
    '지지가 쇠의 세력으로 하나가 된 배치입니다. 어수선한 것을 잘라 정리하는 힘이 세서, 남들이 손 못 대는 것을 끝내 주는 자리에 어울립니다.': 'The branches have massed into a single force of Metal. Your power to cut and sort out a mess is strong, which suits the seat that finishes what others cannot touch.',
    '한쪽은 흔들고 한쪽은 붙듭니다. 서로 답답해 보이지만 실제로는 가장 잘 맞물리는 짝입니다. 바꾸자는 쪽과 지키자는 쪽의 몫을 나누면 됩니다.': 'One shakes things, the other holds them. You look stifling to each other, but this is in fact the best-meshing pair. Split the share between the one who changes and the one who keeps.',
    '여덟 글자가 거의 다 음으로 채워진 배치입니다. 성과도 문제도 천천히 체감되는 리듬이라, 조급하게 결과를 확인하려 들면 스스로만 지칩니다.': 'Almost all eight characters are filled with yin. Both results and troubles register slowly, so checking impatiently for an outcome only wears you out.',
    '두 사람의 명궁이 같은 칸에 놓였습니다. 보는 각도가 비슷해 말이 빨리 통합니다. 대신 약점도 같아서, 둘 다 못 보는 자리가 생깁니다.': 'Both Life palaces sit in the same cell. You see from similar angles, so you understand each other fast. Your blind spots are the same too, so there is a place neither of you sees.',
    '서두르지 않고 모읍니다. 사람이든 자원이든 품는 폭이 넓어 주변의 버팀목이 됩니다. 판을 뒤엎기보다 있는 판을 튼튼히 만드는 쪽입니다.': 'You gather without hurrying. You hold a wide span of people and resources, which makes you the prop others rest on. You would rather make the existing board solid than turn it over.',
    '밀어주는 자리와 얽히는 자리가 같이 있습니다. 강하게 끌리고 그만큼 감정도 큽니다. 무엇으로 얽히는지 알고 있으면 대부분 넘어갑니다.': 'There are seats that push and seats that tangle. The pull is strong and so is the feeling. Knowing what you tangle over gets you past most of it.',
    '결은 같은데 겉이 다릅니다. 부처궁의 별과 상대의 명궁 별이 같은 갈래입니다. 알고 보면 통하는데 첫인상에서 한 번 어긋납니다.': 'The grain matches but the surface does not. The star in your Spouse palace and the one in their Life palace are in the same family. You do connect, once past a first impression that misses.',
    '그리던 상과 다른 사람이 왔습니다. 익숙함으로 끌린 것이 아니라는 뜻이라, 배우는 것이 많은 대신 맞춰 가는 시간이 필요합니다.': 'Someone unlike what you pictured arrived. It means the pull was not familiarity, so there is a lot to learn and time needed to fit together.',
    '둘 다 말로 풉니다. 대화가 끊기지 않는 대신 논쟁도 끊기지 않습니다. 결론 없이 오래 끄는 대화를 끊는 신호를 만들어 두세요.': 'You both work things out in words. The conversation never stops, and neither does the argument. Agree on a signal for cutting off talks that drag without a conclusion.',
    '벌고 지키는 힘이 한자리에 있습니다. 재물 감각이 뚜렷하고 실속을 챙깁니다. 사람에게도 그 잣대를 대지 않게 조심하면 좋습니다.': 'The force to earn and the force to keep sit in one place. Your sense for money is distinct and you look after the substance. Be careful not to hold people to the same measure.',
    '둘 다 중심에 서려 합니다. 함께 큰일을 벌일 수 있지만 자리를 두고 예민해집니다. 영역을 처음부터 갈라 두는 것이 답입니다.': 'You both want the centre. You can start big things together but get touchy about position. Divide the territory from the start.',
    '생각이 빠른 만큼 마음도 자주 바뀝니다. 많이 알지만 하나를 끝까지 파지 못할 때가 있어, 정한 것을 지키는 힘이 과제입니다.': 'A quick mind changes often too. You know a lot but sometimes do not dig one thing to the bottom, so holding to what you decided is the task.',
    '머리와 원칙을 함께 씁니다. 상담하고 가르치는 자리가 잘 맞습니다. 남 일에 훈수를 두다 정작 내 일을 미루지 않게 하세요.': 'You use head and principle together. Seats that counsel and teach suit you well. Take care that advising on others’ business does not leave your own put off.',
    '어떤 상대에게 끌리고 사랑에서 어떤 태도를 취하는지 보는 자리입니다. 상대의 성격보다 내가 맺는 관계의 방식에 가깝습니다.': 'The seat for who you are drawn to and how you behave in love. It is closer to the way you form a bond than to your partner’s character.',
    '결단이 빠르고 세기가 강합니다. 승부가 걸린 자리에서 살아납니다. 말이 짧아 상처를 줄 수 있으니 한 마디를 덧붙이세요.': 'You decide fast and hit hard. You come alive where something is at stake. Short words can wound, so add one more sentence.',
    '끌림이 강하고 재주가 많습니다. 사람과 기회가 몰려오는 대신 유혹도 많습니다. 무엇을 안 할지 정해 두는 편이 낫습니다.': 'Strong pull and plenty of talent. People and openings crowd in, and so do temptations. Better to decide in advance what you will not do.',
    '둘 다 안정을 먼저 봅니다. 편안하고 오래 가지만 새 판이 잘 안 열립니다. 한 해에 하나씩은 일부러 새로 벌여 보세요.': 'You both look at stability first. Comfortable and long-lasting, but a new board rarely opens. Start one new thing a year on purpose.',
    '드러내 놓고 말하는 힘이 큽니다. 사람 앞에 서는 일과 잘 맞습니다. 바른말이 날이 되지 않게 표현을 다듬으면 좋습니다.': 'Your power to speak openly is large. Work that puts you in front of people suits you. Smooth the wording so that straight talk does not become an edge.',
    '지키는 쪽과 이끄는 쪽입니다. 역할이 자연히 갈려 다툼이 적습니다. 한쪽이 계속 맞춰 주는 구도가 되지 않게만 살피세요.': 'One keeps, one leads. The roles split naturally so there is little quarrel. Just watch that it does not become one side always accommodating.',
    '두 명궁이 서로 손잡는 자리입니다. 붙어 있으면 편안하고 오래 갑니다. 편안함에 기대 할 말을 미루지만 않으면 됩니다.': 'The two Life palaces are in cells that join hands. Being together is comfortable and lasts. Just do not let the comfort make you put off what needs saying.',
    '순한 겉과 따지는 속을 함께 가졌습니다. 마음에 걸린 것을 오래 두는 편이라, 그때그때 풀어내는 습관이 도움이 됩니다.': 'A mild outside with a questioning inside. You leave what caught in your mind sitting there, so a habit of clearing it as it comes helps.',
    '온화하고 다정합니다. 사람을 편하게 하는 힘이 크고 감수성이 깊습니다. 마음을 안에 오래 담아 두지 않는 게 좋습니다.': 'Warm and affectionate. Your power to put people at ease is large and your sensitivity runs deep. Better not to hold feeling inside for long.',
    '뜨거움과 지킴이 같이 있습니다. 겉은 차분한데 속에 승부욕이 큽니다. 안정된 판 위에서 승부를 걸 때 가장 좋습니다.': 'Heat and holding sit together. The outside is calm while the drive to win runs large inside. You are at your best betting from a stable board.',
    '실행력과 욕망이 같이 붙었습니다. 늦게 크게 되는 결로 자주 봅니다. 조급해하지 않고 때를 기다리는 편이 유리합니다.': 'Execution and appetite are attached together. It often runs as the grain of coming up big late. Not rushing and waiting for the time works in your favour.',
    '세기가 가장 강한 조합에 듭니다. 밀어붙이는 힘이 커서 큰일을 해냅니다. 속도를 스스로 늦추는 장치가 필요합니다.': 'One of the strongest combinations there is. Your pushing force is large enough to get big things done. You need something built in to slow yourself down.',
    '열정을 절제로 감쌉니다. 겉으로는 단정한데 속의 온도가 높습니다. 참다 한 번에 터지지 않게 중간에 풀어 주세요.': 'You wrap heat in restraint. Neat on the outside with a high temperature inside. Let some out along the way so it does not burst at once.',
    '품위를 지키려다 속을 안 보이고, 자존심 때문에 도와달라는 말을 미룹니다. 혼자 다 지지 않는 연습이 필요합니다.': 'Guarding your dignity, you keep your inside hidden, and pride makes you put off asking for help. Practise not carrying all of it alone.',
    '한쪽은 밀어붙이고 한쪽은 설명합니다. 밖에서 보기에 시원한 짝입니다. 말이 앞서면 실행이 지치니 속도를 맞추세요.': 'One pushes, the other explains. From outside it looks like a brisk pair. When words run ahead the doing tires, so match your pace.',
    '이끄는 쪽과 알리는 쪽입니다. 밖으로 드러나는 일에서 특히 좋은 짝입니다. 안에서의 결정권은 따로 정해 두세요.': 'One leads, one announces. A particularly good pair for anything public-facing. Settle who decides internally, separately.',
    '그리던 상이 그대로 왔습니다. 부처궁의 별과 상대의 명궁 별이 겹칩니다. 처음부터 익숙하고 편했을 자리입니다.': 'Exactly what you pictured arrived. The star in your Spouse palace and the star in their Life palace overlap. It would have felt familiar and easy from the start.',
    '몸이 어느 쪽으로 신호를 보내는지 보는 자리입니다. 진단이 아니라 평소 무엇을 챙기면 좋은지에 대한 것입니다.': 'The seat for where your body sends its signals. This is not a diagnosis but a note on what to look after day to day.',
    '밀어붙이면서 균형도 봅니다. 일 처리가 야무지고 뒤가 깨끗합니다. 감정 표현이 적어 차갑게 보일 수 있습니다.': 'You push on and watch the balance as well. Your work is tight and leaves a clean trail. You express little feeling, which can read as cold.',
    '벌고 엎기를 반복합니다. 규모가 커질 수 있는 만큼 굴곡도 큽니다. 돈은 반드시 나눠 두는 습관이 필요합니다.': 'You repeat earning and overturning. The scale can grow large, and so do the swings. You need a firm habit of keeping money split apart.',
    '서로의 굵직한 자리에 마음이 몰립니다. 무심할 수 없는 사이라, 거리와 규칙을 먼저 정해 두는 편이 낫습니다.': 'Your minds crowd into each other’s major seats. You cannot be indifferent to each other, so set distance and rules first.',
    '움직이는 힘과 쥐는 힘이 만납니다. 방향만 합의되면 크게 갑니다. 주도권을 누가 갖느냐에서 부딪히기 쉽습니다.': 'A moving force meets a holding force. Agree on direction and it goes far. Who holds the lead is where you clash.',
    '판을 깨고 다시 세웁니다. 인생의 폭이 크고 이야기가 많습니다. 벌인 뒤 수습하는 사람을 곁에 두면 좋습니다.': 'You break the board and set it again. Your life runs wide and carries many stories. It helps to keep someone beside you who tidies up after.',
    '말하는 쪽과 들어주는 쪽입니다. 편안한 대화가 오래 갑니다. 정작 결정을 미루는 것이 이 짝의 숙제입니다.': 'One talks, one listens. The easy conversation lasts. Putting off the actual decision is this pair’s homework.',
    '밀어붙이다 융통성이 없어 보이고, 긴장을 안으로 쌓습니다. 강함에 부드러움을 얹고 쉬는 때를 정해 두세요.': 'Pushing on can look inflexible, and you stack tension inside. Lay some softness over the strength and set a time to rest.',
    '상대에게 마음이 강하게 얽히는 자리입니다. 애틋한 만큼 집착으로도 갑니다. 거리를 정해 두면 오래 갑니다.': 'Your feeling ties hard to them here. As tender as it is, it also turns into fixation. Set a distance and it lasts.',
    '두 명궁이 특별한 관계를 맺지 않은 자리입니다. 서로의 영역을 크게 건드리지 않아 담백한 사이가 됩니다.': 'The two Life palaces hold no special relation. Neither disturbs the other’s ground much, so it stays a plain, clean bond.',
    '베풀고 지킵니다. 사람들이 어려운 일을 들고 찾아옵니다. 다 받아 주다 지치니 감당할 몫을 정해 두세요.': 'You give and you protect. People come to you carrying hard things. Taking all of it wears you out, so set the share you will carry.',
    '부처궁이 비어 있어 그리는 상이 뚜렷하지 않습니다. 정해 놓은 조건보다 그때의 인연을 따라가는 쪽입니다.': 'The Spouse palace is empty, so the picture is not sharp. You follow the connection of the moment rather than a set of conditions.',
    '편안하면서 책임감이 있습니다. 사람을 돌보는 일과 잘 맞습니다. 거절을 못 해 일이 몰리지 않게 하세요.': 'Easy-going and responsible at once. Work that cares for people suits you well. Take care that not being able to refuse does not pile work on you.',
    '남을 챙기느라 자기를 놓칩니다. 밝은 모습을 유지하려다 지치니, 힘을 나에게도 쓰는 균형이 과제입니다.': 'Looking after others, you lose track of yourself. Keeping up the bright face wears you out, so spending some of that force on yourself is the task.',
    '두 사람의 기운이 상대의 굵직한 자리에 좋게 떨어집니다. 같이 있을 때 각자 더 잘 풀리는 조합입니다.': 'Each of you lands well on the other’s major seats. A combination where both do better together.',
    '얼어붙은 땅에 봄기운이 스미는 형국입니다. 눈에 보이는 변화는 늦지만 아래에서 이미 움직이고 있습니다.': 'Spring seeping into frozen ground. Visible change comes late, but underneath things are already moving.',
    '편안함에 머물러 움직일 때를 놓칩니다. 결정을 남에게 미루지 않고 한 걸음 먼저 내딛는 게 과제입니다.': 'Staying in the comfortable, you miss the moment to move. Not handing decisions to others and stepping out first is the task.',
    '두 명궁이 하나의 국(局)을 이루는 자리입니다. 같은 방향을 보고 움직여 함께 일을 벌이기 좋습니다.': 'The two Life palaces form a single bureau. You look and move the same way, which makes it good to start things together.',
    '집 밖에서의 흐름과 남이 보는 나를 보는 자리입니다. 여기가 명궁보다 좋으면 나가서 풀리는 결입니다.': 'The seat for life outside the home and for how others see you. If it is stronger than the Life palace, things open up when you go out.',
    '중심을 세우는 힘이 있습니다. 밀어붙여 이끄는 게 아니라 안정감으로 이끌기 때문에 사람이 모입니다.': 'You have the power to set a centre. You lead through steadiness rather than force, which is why people gather.',
    '타고난 성격과 인생의 큰 줄기를 보는 자리입니다. 나머지 열한 궁은 전부 여기를 기준으로 읽습니다.': 'The seat for your inborn character and the main line of your life. The other eleven palaces are all read against this one.',
    '돈을 굴리는 재주보다 돈을 관리하는 재주가 큽니다. 규모 있는 자금을 맡을 때 제 몫을 합니다.': 'You are better at managing money than at turning it over. You come into your own handling funds of some size.',
    '동업이나 돈 얽힌 관계는 조건을 문서로 남기는 편이 좋습니다. 내 몫을 두고 부딪히기 쉽습니다.': 'Put the terms of any partnership or money tie in writing. Clashes over your share come easily.',
    '마음을 안에 담아 두다 상대가 못 알아챕니다. 느끼는 것을 조금 더 말로 옮기는 게 과제입니다.': 'Holding your feeling inside, the other person misses it. Putting a little more of what you feel into words is the task.',
    '시간을 넣고 다시 분석하면 명반이 나옵니다. 사주 풀이는 시간 없이도 그대로 보실 수 있습니다.': 'Enter a time and run it again to see the chart. The Saju reading above works without it.',
    '주성이 없는 칸은 마주 보는 칸의 주성을 괄호로 빌려 적었습니다. 이것을 차성안궁이라고 합니다.': 'A cell with no main star borrows the main stars of the cell opposite, shown in brackets. This is called borrowing a star for an empty palace.',
    '감정의 폭이 크고 한 가지에 과하게 빠집니다. 뜨거움을 스스로 식힐 방법을 하나 정해 두세요.': 'Your feeling swings wide and you fall too far into one thing. Settle on one way to cool yourself down.',
    '물의 결입니다. 스며들듯 나아가고 상황에 맞춰 모양을 바꿉니다. 흐름을 읽는 감각이 빠릅니다.': 'The grain of water. You move by seeping in and change shape to fit the situation, with a quick feel for which way things are flowing.',
    '태어난 시간을 넣으면 명반이 나옵니다. 명궁 자리가 태어난 달과 시각으로 정해지기 때문입니다.': 'Enter a birth time and the chart appears. The Life palace is fixed by your birth month and hour.',
    '관계에 매듭이 생기기 쉬운 자리입니다. 나쁘다는 뜻이 아니라 그만큼 놓지 못한다는 뜻입니다.': 'Knots form in the relationship here. It does not mean bad — it means you cannot let go.',
    '명궁에 주성이 없습니다. 색이 정해지지 않은 자리라, 상황에 따라 모습이 달라지는 결입니다.': 'There is no main star in your Life palace. It is an unfixed seat, so you take on a different shape depending on the situation.',
    '생각이 안으로 깊어지면 의심과 걱정이 됩니다. 말이 날카로워지지 않게 다듬는 게 과제입니다.': 'When thinking turns inward it becomes doubt and worry. Smoothing your speech so it does not sharpen is the task.',
    '신중함이 지나치면 결정을 미루고 눈치를 봅니다. 필요할 때 내 목소리를 내는 게 과제입니다.': 'Too much care and you put off deciding and read the room instead. Speaking up when it matters is the task.',
    '어떤 일에서 강점이 나오고 경력이 어떻게 쌓이는지 보는 자리입니다. 재백궁과 짝으로 봅니다.': 'The seat for the work your strengths come out in and how a career stacks up. Read it paired with the Wealth palace.',
    '판단이 빠르고 실마리를 잘 찾습니다. 기획·분석·중재처럼 머리를 쓰는 자리에서 값이 납니다.': 'You judge fast and find the thread. You are worth most in seats that use the head — planning, analysis, mediation.',
    '겉의 성공이 아니라 속의 만족을 보는 자리입니다. 무엇을 할 때 마음이 쉬는지 알려줍니다.': 'The seat for inner satisfaction rather than outward success. It shows what lets your mind rest.',
    '형제와 또래, 함께 일하는 사람을 보는 자리입니다. 위아래가 아니라 나란히 선 관계입니다.': 'The seat for siblings, peers and the people you work alongside. These are level relationships, not ones above or below you.',
    '관계에서 주도권을 쥐게 됩니다. 끌고 가는 힘이 되는 만큼 상대의 속도를 물어봐 주세요.': 'You end up holding the lead. It is a pulling force, so ask about their pace.',
    '다 떠안다 혼자 지치고, 원칙을 고집해 답답해 보입니다. 맡을 것과 넘길 것을 나누세요.': 'Taking it all on wears you out alone, and holding to principle can look stifling. Sort what to carry from what to hand on.',
    '밖에 나가면 대접이 달라집니다. 집보다 바깥에서, 또래보다 손윗사람에게서 길이 열립니다.': 'You are treated differently once you go out. Paths open outside rather than at home, and from elders rather than peers.',
    '상대를 움직이게 만듭니다. 좋게 쓰면 힘이 되고, 지나치면 밀어붙이는 것으로 느껴집니다.': 'You get them moving. Used well it is strength; overdone it feels like pushing.',
    '안에 있던 것이 밖으로 나오는 해입니다. 말이 늘고 활동이 늘고 벌이는 것이 늘어납니다.': 'A year when what was inside comes out. You talk more, do more, and start more.',
    '내 이름으로 무언가를 하고 싶어지는 해입니다. 남 밑에 있는 것이 유난히 답답해집니다.': 'A year when you want to do something under your own name. Being under someone else feels especially stifling.',
    '서로의 명반을 크게 건드리지 않습니다. 각자의 삶이 있는 채로 나란히 가는 사이입니다.': 'Neither disturbs the other’s chart much. A bond that walks alongside while each keeps their own life.',
    '성별을 고르지 않으셔서 남성 기준으로 두었습니다. 여성이면 도는 방향이 반대가 됩니다.': 'You did not choose a gender, so this is set as male. For female the direction reverses.',
    '지시받는 자리보다 책임지는 자리에서 살아납니다. 결정권이 없는 일은 오래 못 견딥니다.': 'You come alive in a seat that carries responsibility rather than one that takes orders. Work without any say in it does not hold you long.',
    '생각이 많습니다. 밤에 머리가 안 꺼지는 편이라, 생각을 멈추는 취미가 약이 됩니다.': 'You think a great deal. Your head does not switch off at night, so a hobby that stops the thinking is the medicine.',
    '아는 사람은 많은데 속을 아는 사람은 적다고 느낍니다. 혼자 있는 시간이 회복입니다.': 'You know many people but feel few know your inside. Time alone is how you recover.',
    '크게 흔들지 않으면서 서로를 조금씩 밀어 줍니다. 오래 두고 보는 사이에 어울립니다.': 'Without shaking each other much, you nudge each other along. Suited to a bond kept over a long time.',
    '큰 욕심을 안 부려도 아쉽지 않게 흘러갑니다. 다만 모으는 힘은 따로 길러야 합니다.': 'It flows along well enough without great appetite. The power to accumulate, though, has to be built separately.',
    '가까운 사람과의 사이에서 마음 쓸 일이 생깁니다. 먼저 말을 꺼내면 쉽게 풀립니다.': 'Something to mind comes up with someone close. Speaking first unties it easily.',
    '길이 두 갈래로 갈리는 형국입니다. 어느 쪽도 나쁘지 않으나 한쪽만 골라야 합니다.': 'The road splitting in two. Neither way is bad, but only one can be taken.',
    '머리와 소화기 쪽으로 신호가 옵니다. 긴장을 오래 쥐고 있지 않는 게 관리법입니다.': 'Signals come through the head and the digestive tract. Not holding tension for long is the way to manage it.',
    '부모나 윗사람이 권위 있는 편입니다. 집안일이 그쪽 뜻대로 정해지는 일이 잦습니다.': 'A parent or elder tends to carry authority. Family matters are often settled the way they want.',
    '사람을 상대하거나 감각을 쓰는 일이 맞습니다. 영업·기획·예체능과 인연이 있습니다.': 'Work with people or work that uses your senses suits you. You have an affinity for sales, planning, arts and sport.',
    '아이나 아랫사람이 제 색이 뚜렷합니다. 눌러 키우기보다 맡겨 키우는 편이 낫습니다.': 'A child or junior has a strong colour of their own. Better to raise them by trusting than by pressing down.',
    '나무의 결입니다. 위로 뻗으려는 힘이 있어 자라는 속도가 붙으면 멈추지 않습니다.': 'The grain of wood. There is an upward push in you, and once growth picks up speed it does not stop.',
    '배우자를 고르는 기준이 높습니다. 서두른 인연보다 늦게 만난 인연이 안정적입니다.': 'Your bar for a partner is high. A bond met later tends to be steadier than one rushed into.',
    '사람이 자주 바뀝니다. 오래 가는 인연은 적어도 필요할 때 닿는 사람이 있습니다.': 'People turn over often. Long bonds are few, but someone is there when you need them.',
    '상대에게 연인으로서 복이 되는 자리입니다. 관계 자체가 상대의 운을 밀어 줍니다.': 'You are a blessing to them as a partner. The relationship itself pushes their fortune along.',
    '안정을 지키려다 변화를 미룹니다. 지킬 때와 나아갈 때를 구분하는 게 과제입니다.': 'Guarding stability, you put change off. Telling when to hold and when to move is the task.',
    '거절하지 못하고 쌓다가 한 번에 지칠 수 있습니다. 몸이 먼저 신호를 보냅니다.': 'Unable to refuse, you stack it up and tire all at once. The body signals first.',
    '말과 태도가 곧아서 가까운 사이에 날이 섭니다. 세기를 조절하는 게 과제입니다.': 'Your words and manner are straight, which puts an edge on close relationships. Adjusting the strength is the task.',
    '부모가 자식을 가르치려는 편입니다. 대화는 많은데 잔소리로 느껴질 수 있습니다.': 'A parent tends to want to teach. There is plenty of talk, but it can land as nagging.',
    '상대의 돈 쓰는 방식에 관여하게 됩니다. 규모가 커지는 대신 결정이 잦아집니다.': 'You get involved in how they spend. The scale grows and so does the number of decisions.',
    '쇠의 결입니다. 맺고 끊는 것이 분명하고 한번 정한 기준을 잘 바꾸지 않습니다.': 'The grain of metal. You are clear about where things begin and end, and rarely change a standard once you have set it.',
    '시작은 큰데 마무리가 흔들립니다. 벌인 것을 끝까지 갈무리하는 힘이 과제입니다.': 'The start is big but the finish wavers. The force to see what you began all the way through is the task.',
    '준비만 하다 시기를 놓칠 수 있습니다. 덜 준비된 채로 한 발은 내디뎌 두세요.': 'You can miss the moment by only preparing. Take one step while still half-ready.',
    '형제나 동료 중에 주도하는 사람이 있습니다. 일이 생기면 그쪽이 키를 잡습니다.': 'There is someone who takes the lead among your siblings or colleagues. When something happens they take the wheel.',
    '관심이 흩어지고 욕심이 커집니다. 하나를 깊이 파는 집중과 절제가 과제입니다.': 'Your attention scatters and your appetite grows. Focus enough to dig one thing deep, and restraint, are the task.',
    '나가는 것보다 들이는 것이 많은 해입니다. 배우고 정리하고 쉬어가기 좋습니다.': 'A year when more comes in than goes out. Good for learning, sorting, and resting.',
    '들어오는 것보다 나가는 것이 많은 시기입니다. 큰 지출은 한 번 더 재보세요.': 'A stretch where more goes out than comes in. Measure any large spending twice.',
    '똑똑한 상대에게 끌립니다. 나이 차가 나거나 배경이 다른 인연도 자주 봅니다.': 'You are drawn to a clever partner. Bonds with an age gap or a different background are common.',
    '맡는 것이 늘어나는 해입니다. 자리가 올라가기도 하고 그만큼 눌리기도 합니다.': 'A year when you take on more. Your position can rise, and the weight rises with it.',
    '머리로 버는 돈입니다. 회전이 빠른 일이 맞고, 들어오고 나가는 폭이 큽니다.': 'Money earned by thinking. Fast-turning work suits you, and the swing in and out is wide.',
    '불에 불이 더해집니다. 뜨거워지는 만큼 빨리 타버리지 않게 조절이 필요합니다.': 'Fire added to fire. As hot as it gets, you need to keep it from burning out fast.',
    '드러나는 일, 사람을 상대하는 일이 맞습니다. 이름이 나는 자리에서 삽니다.': 'Visible work and work with people suits you. You live best in a seat where your name is known.',
    '먹고사는 바탕이 되는 자리입니다. 지키는 힘이 있어 크게 흔들리지 않습니다.': 'The base that keeps you fed. It holds, so you are not shaken far.',
    '밝고 활동적인 상대와 맞습니다. 서로 바빠 시간을 못 맞추는 게 숙제입니다.': 'A bright, active partner suits you. The homework is that both being busy, your schedules do not meet.',
    '사람을 편하게 하는 일이 맞습니다. 경쟁이 날 선 자리는 오래 못 견딥니다.': 'Work that puts people at ease suits you. A seat with sharp competition does not hold you long.',
    '성과가 숫자로 나오는 일이 맞습니다. 책임을 지고 밀어붙일 때 값이 납니다.': 'Work whose results come out as numbers suits you. You are worth most taking responsibility and pushing.',
    '열정과 매력이 강점입니다. 목표가 서면 다른 것을 접고 몰아붙일 줄 압니다.': 'Heat and appeal are your strengths. Once a goal is set you know how to fold the rest away and drive.',
    '있는 것만으로 상대를 풀리게 합니다. 곁에 있으면 일이 수월해지는 쪽입니다.': 'Your simply being there loosens things for them. Work goes easier when you are near.',
    '작더라도 꾸준히 들어오는 흐름이 있습니다. 이 시기에 모아두면 오래 갑니다.': 'A steady inflow, small but regular. What you save now lasts a long time.',
    '공부, 자격, 계약서·문서 일이 잘 풀립니다. 도와주는 사람이 나타납니다.': 'Study, qualifications, contracts and paperwork go smoothly. Someone helpful appears.',
    '뚜렷한 주성이 없는 자리입니다. 정해진 색보다 그때그때 상황을 따라갑니다.': 'This seat has no clear main star. Rather than one fixed colour, it follows whatever the situation brings.',
    '불의 결입니다. 붙는 속도가 빠르고 존재감이 뚜렷해 어디서든 눈에 띕니다.': 'The grain of fire. You catch quickly and carry a clear presence, so you stand out wherever you are.',
    '쉬는 것도 목표를 세워 합니다. 아무것도 안 하는 시간을 일부러 만드세요.': 'You even rest by setting a target. Make time to do nothing on purpose.',
    '그 별의 좋은 점이 술술 풀리는 자리입니다. 재물과 인연이 잘 붙습니다.': 'The star\'s good side flows easily here. Money and connections attach well.',
    '다정한 관계를 맺습니다. 갈등을 피하다 할 말을 못 하는 게 숙제입니다.': 'You form warm bonds. The homework is avoiding conflict until you cannot say what needs saying.',
    '들고 나는 것이 비슷합니다. 새로 벌이기보다 있는 것을 다듬을 때입니다.': 'In and out are about even. A time to refine what you have rather than start something new.',
    '모으는 힘이 좋습니다. 크게 버는 것보다 새지 않게 하는 쪽에 강합니다.': 'Your gathering power is good. You are stronger at stopping leaks than at earning big.',
    '몰입할 때 가장 행복합니다. 다만 몰입이 집착으로 넘어가는 선을 보세요.': 'You are happiest absorbed. Just watch the line where absorption turns into fixation.',
    '바쁜 만큼 나가는 것도 커집니다. 들어온 것을 남기는 쪽에 신경 쓰세요.': 'As busy as it gets, the outflow grows too. Pay attention to keeping what came in.',
    '밖에서 구설이 따라올 수 있습니다. 기록을 남기는 습관이 도움이 됩니다.': 'Talk can follow you outside. A habit of keeping records helps.',
    '밝은 기운과 후한 마음이 힘입니다. 함께하는 자리에서 특히 값이 납니다.': 'Bright energy and an open hand are your force. You are worth most where people are together.',
    '변화가 있는 일이 맞습니다. 같은 자리에 오래 고정되면 능력이 죽습니다.': 'Work with change in it suits you. Fixed too long in one seat, your ability goes flat.',
    '서로 독립적인 관계가 편합니다. 표현이 적어 오해가 쌓이지 않게 하세요.': 'A relationship where both stay independent is comfortable. You say little, so take care that misreadings do not pile up.',
    '실행력과 재물 감각이 강점입니다. 목표를 현실로 바꾸는 뚝심이 있습니다.': 'Execution and a sense for money are your strengths. You have the grit to turn a goal into a real thing.',
    '옆에서 받쳐 주는 힘입니다. 궂은 자리에서 손을 내미는 인연이 있습니다.': 'A force that props you up from the side. Someone reaches out in the rough spots.',
    '자녀와 아랫사람, 그리고 내가 시작해 키우는 모든 것을 보는 자리입니다.': 'The seat for children, juniors and everything you start and raise.',
    '흩어지는 자리입니다. 손에 쥔 것을 놓게 하되 새로 시작할 힘을 줍니다.': 'A seat that scatters. It makes you let go of what you hold, and gives you the force to begin again.',
    '그 별에 권한과 추진력이 붙습니다. 주도해서 밀어붙이는 힘이 커집니다.': 'Authority and drive attach to that star. Your power to take charge and push grows.',
    '끌림이 강한 인연을 만납니다. 뜨거울 때와 식을 때의 낙차를 살피세요.': 'You meet bonds with strong pull. Watch the drop between the hot and the cooled.',
    '남을 도울 때 기분이 좋아집니다. 다만 그것만으로 채우면 속이 빕니다.': 'Helping others lifts you. But if that is all you fill up on, the inside empties.',
    '도와주는 사람이 붙습니다. 혼자 하는 것보다 함께할 때 일이 커집니다.': 'Helpers attach to you. Work grows bigger with others than on your own.',
    '문 앞에 손님이 서 있는 형국입니다. 뜻밖의 제안이나 인연이 닿습니다.': 'A guest standing at the door. An unexpected offer or connection arrives.',
    '바람이 잦아드는 형국입니다. 무리해서 밀기보다 지키는 편이 이롭습니다.': 'The wind dying down. Holding what you have serves you better than forcing it forward.',
    '배려가 오가는 관계입니다. 서로 맞추다 할 말을 못 하지 않게 하세요.': 'A relationship where consideration flows both ways. Take care that fitting in does not stop you saying things.',
    '상대의 돈 자리에 복이 떨어집니다. 같이 벌이는 일에 실익이 붙습니다.': 'The blessing lands on their money seat. What you start together carries real gain.',
    '이사가 잦습니다. 큰길가나 오가는 사람이 많은 자리와 인연이 있습니다.': 'You move house often. You have an affinity for main roads and places with people passing.',
    '책임감과 보호 본능이 강점입니다. 믿고 맡길 수 있다는 평을 얻습니다.': 'Responsibility and a protective instinct are your strengths. You earn the word that you can be trusted with things.',
    '해가 중천에 오른 형국입니다. 드러내고 움직일수록 얻는 것이 있습니다.': 'The sun at its height. The more you show yourself and move, the more you gain.',
    '혼자만의 시간이 필요합니다. 감정이 가라앉는 시기를 미리 알아 두세요.': 'You need time to yourself. Learn in advance when your mood tends to sink.',
    '흙의 결입니다. 중심이 무겁고 쉽게 흔들리지 않아 사람들이 기대옵니다.': 'The grain of earth. Your centre is heavy and hard to shake, so people lean on you.',
    '가르치거나 지키는 일이 맞습니다. 의료·교육·공공과 인연이 있습니다.': 'Work that teaches or protects suits you. You have an affinity for medicine, education and public service.',
    '관리·운영하는 자리가 맞습니다. 조직에서 오래 갈수록 값이 오릅니다.': 'A managing, running seat suits you. The longer you stay in an organisation, the more you are worth.',
    '마른 나무가 물을 만난 형국입니다. 미뤄뒀던 일에 다시 손이 갑니다.': 'A dry tree meeting water. You reach again for what you had put off.',
    '말이 오가며 오해가 생기기 쉽습니다. 확인하는 습관이 화를 막습니다.': 'Words go back and forth and are easily misread. A habit of checking prevents trouble.',
    '말하고 따지는 일이 맞습니다. 법·교육·상담·중개와 인연이 있습니다.': 'Work that speaks and argues suits you. You have an affinity for law, teaching, counselling and brokering.',
    '밖에서 어른 대접을 받습니다. 어려울 때 도와주는 사람이 나타납니다.': 'You are treated as the grown-up outside. Someone turns up to help when it is hard.',
    '별표가 붙은 칸은 주성이 없어 마주 보는 칸에서 빌려 읽은 것입니다.': 'A cell with an asterisk has no main star and was read from the cell opposite.',
    '부모가 엄한 편입니다. 정을 말로 표현하지 않는 집안일 수 있습니다.': 'A parent tends to be strict. It may be a household that does not put affection into words.',
    '사람이 드나드는 집이 됩니다. 볕이 잘 드는 자리를 고르면 좋습니다.': 'Your home becomes one people come and go from. A spot that gets good sun is worth choosing.',
    '아이가 영리하고 잔재주가 많습니다. 새로 벌인 일도 빠르게 자랍니다.': 'A child is bright and full of small knacks. Anything newly started grows fast too.',
    '윗사람의 도움이 오는 자리입니다. 결정적인 순간에 손을 잡아 줍니다.': 'Help arrives from above. Someone takes your hand at the decisive moment.',
    '작은 일상에서 만족을 얻습니다. 잘 쉬는 것이 이 사람의 재능입니다.': 'You take satisfaction from small daily things. Resting well is this person’s talent.',
    '화 기운이 물을 데웁니다. 차갑던 것이 따뜻해지고 움직임이 생깁니다.': 'Fire energy warms the water. What was cold turns warm and starts to move.',
    '경쟁과 성취가 있는 일이 맞습니다. 관리보다 돌파에서 값이 납니다.': 'Work with competition and achievement suits you. You are worth more breaking through than managing.',
    '그 별에 명예와 평판이 붙습니다. 인정받고 이름이 나는 흐름입니다.': 'Honour and reputation attach to that star. It is a current of being recognised and becoming known.',
    '끌림이 강한 만남을 합니다. 관계의 온도를 유지하는 게 숙제입니다.': 'Your meetings have strong pull. Keeping the temperature of a relationship steady is the homework.',
    '나무가 불을 지핍니다. 가진 것을 태워 밖으로 내놓는 한 해입니다.': 'Wood feeds fire. A year of burning what you hold and putting it out.',
    '돈 문제로 얽히기 쉽습니다. 금전 거래는 처음에 선을 그어 두세요.': 'You tangle easily over money. Draw the line on financial dealings at the start.',
    '돈과 일이 오가는 해입니다. 몸이 바빠지고 계산할 일이 늘어납니다.': 'A year of money and work moving. You get physically busy and have more to calculate.',
    '말이 앞서 약속이 커질 수 있습니다. 벌인 것의 개수를 세어보세요.': 'Words run ahead and promises grow. Count how many things you have started.',
    '밖에서 인복이 있습니다. 낯선 곳에서도 도와주는 사람이 나타납니다.': 'You have luck with people outside. Even in strange places someone turns up to help.',
    '속으로 타는 불입니다. 겉으로 안 드러나는 채로 오래 눌러 둡니다.': 'A fire burning inward. It stays out of sight and is held down for a long time.',
    '안정감과 포용력이 강점입니다. 곁에 두면 든든하다는 말을 듣습니다.': 'Steadiness and a wide embrace are your strengths. People say it is reassuring to have you near.',
    '어울리는 사람들의 자리가 높은 편입니다. 인맥이 넓기보다 굵습니다.': 'The people around you tend to sit high. Your network is thick rather than wide.',
    '호흡기와 치아·뼈 쪽입니다. 참다가 한 번에 무너지지 않게 하세요.': 'The airway, the teeth and the bones. Take care not to endure until it all gives at once.',
    '흩어진 것이 한자리에 모이는 형국입니다. 사람과 정보가 들어옵니다.': 'Scattered things gathering in one place. People and news come in.',
    '갑자기 붙는 불입니다. 순간의 폭발력이 크지만 오래가지 않습니다.': 'A fire that catches all at once. Great burst in the moment, but it does not last.',
    '기력 소모가 큽니다. 몰아 쓰고 몰아 쉬는 습관을 고르게 하세요.': 'You burn a lot of energy. Even out the habit of spending it all then resting it all.',
    '나무가 흙을 파고듭니다. 현실을 뚫고 자리를 만드는 한 해입니다.': 'Wood drives into earth. A year of breaking through the practical and making a place.',
    '날이 선 힘입니다. 밀어붙이는 데는 좋지만 부딪침도 같이 옵니다.': 'A sharpened force. Good for pushing through, but collisions come with it.',
    '대화가 많은 관계입니다. 말다툼도 그만큼 잦으니 말투를 살피세요.': 'A relationship with a lot of talk. Arguments come just as often, so watch your tone.',
    '더디게 끌리는 힘입니다. 시간이 걸리는 대신 오래 붙들고 갑니다.': 'A force that drags slowly. It takes time, but you hold on to it long.',
    '돈이 붙는 자리입니다. 실물·자산처럼 손에 잡히는 쪽이 맞습니다.': 'A seat money attaches to. Things you can hold — goods and assets — suit you.',
    '밖에서 신뢰를 얻습니다. 급히 움직이기보다 자리를 잡고 넓힙니다.': 'You earn trust outside. Rather than moving in a hurry, you settle and widen.',
    '밖에서 조용히 인정받습니다. 밤이나 실내 활동과 인연이 있습니다.': 'You are recognised quietly outside. You have an affinity for night work and indoor activity.',
    '밖에서 존재감이 드러납니다. 사람을 끄는 만큼 구설도 따라옵니다.': 'Your presence shows outside. As much as you draw people, talk follows too.',
    '상대를 돋보이게 합니다. 함께 있을 때 상대의 평판이 좋아집니다.': 'You make them stand out. Their reputation improves when you are together.',
    '상대의 마음을 편하게 만듭니다. 함께 있을 때 상대가 잘 쉽니다.': 'You put their mind at ease. They rest well when you are together.',
    '상대의 취향과 시간에 영향을 줍니다. 좋아하는 것이 닮아 갑니다.': 'You shape their taste and their time. What you each like grows alike.',
    '생각이 멈추지 않습니다. 걱정을 종이에 꺼내 놓으면 가벼워집니다.': 'The thinking does not stop. Putting the worry down on paper lightens it.',
    '쇠가 나무를 다듬습니다. 깎이는 만큼 모양이 잡히는 한 해입니다.': 'Metal trims wood. A year that takes shape as much as it is cut.',
    '아이가 밝고 사람을 좋아합니다. 벌인 일이 밖으로 잘 알려집니다.': 'A child is bright and fond of people. What you start becomes known outside.',
    '여유가 있어야 마음이 놓입니다. 비상금이 정신 건강에 직결됩니다.': 'You need some slack to feel at ease. A cash cushion goes straight to your peace of mind.',
    '정이 깊은 인연입니다. 표현이 적어 서운함이 쌓이지 않게 하세요.': 'A bond with deep affection. You express little, so take care that hurt does not pile up.',
    '집을 격 있게 갖추고 싶어 합니다. 넓이보다 자리와 품을 봅니다.': 'You want a home with standing. You look at the location and the feel of it rather than the floor area.',
    '한 번에 크게 움직입니다. 감정이 들어간 결정에서 손실이 납니다.': 'You move big in one go. The losses come from decisions with feeling in them.',
    '기대고 기대는 관계입니다. 나이 차가 나는 인연도 자주 봅니다.': 'A relationship of leaning on each other. Bonds with an age gap are common.',
    '남을 돌볼 때 보람을 느낍니다. 나를 돌보는 몫도 남겨 두세요.': 'You feel it was worth it when caring for others. Leave a share for caring for yourself.',
    '독립적인 관계가 맞습니다. 서로의 영역을 인정해야 오래 갑니다.': 'An independent relationship suits you. It lasts only if both sides grant each other room.',
    '말과 예술의 별입니다. 표현하고 드러내는 쪽에 재주가 있습니다.': 'The star of speech and art. Gifted at expressing and showing.',
    '명궁에 주성이 없습니다. 상황에 따라 모습이 달라지는 결입니다.': 'No main star in the Life palace. You take a different shape depending on the situation.',
    '밖에서 결단력이 드러납니다. 일 때문에 움직이는 일이 많습니다.': 'Your decisiveness shows outside. Much of your moving about is for work.',
    '벌이도 크지만 나가는 것도 큽니다. 남에게 쓰는 돈이 많습니다.': 'The earning is large and so is the outflow. A lot of it is spent on other people.',
    '보좌·조율하는 자리가 맞습니다. 이인자 자리에서 실력이 납니다.': 'A supporting, coordinating seat suits you. Your ability comes out as the second in command.',
    '부모와 말이 부딪힐 수 있습니다. 뜻은 같은데 표현이 다릅니다.': 'Words can clash with a parent. The intent is the same; the wording differs.',
    '비뇨·순환 쪽과 살이 붙는 쪽입니다. 움직이는 습관을 만드세요.': 'The urinary and circulatory side, and the side that puts on weight. Build a habit of moving.',
    '사람들이 편하게 다가옵니다. 부탁을 거절하는 연습이 필요합니다.': 'People approach you easily. You need practice at turning down a request.',
    '섬세함과 다정함이 강점입니다. 조용히 쌓은 신뢰가 오래 갑니다.': 'Fineness and warmth are your strengths. Trust built quietly lasts long.',
    '소화기 쪽입니다. 먹는 것으로 스트레스를 푸는 습관을 살피세요.': 'The digestive tract. Watch the habit of working off stress by eating.',
    '쇠가 물을 맑게 합니다. 도와주는 사람과 배울 자리가 생깁니다.': 'Metal clears the water. Helpful people and places to learn appear.',
    '얼마를 버느냐보다 어떤 방식으로 돈이 도는지를 보는 자리입니다.': 'The seat for how money moves rather than how much you earn.',
    '온화함과 친화력이 강점입니다. 편안한 분위기로 사람을 모읍니다.': 'Warmth and easy company are your strengths. You gather people with a comfortable air.',
    '집과 부동산에 인연이 있습니다. 터전을 늘려가는 힘이 있습니다.': 'You have an affinity for homes and property. You have the force to widen your ground.',
    '크게 들어오고 크게 나갑니다. 돈을 돈으로 세지 않는 편입니다.': 'It comes in big and goes out big. You tend not to count money as money.',
    '개척 정신과 변화의 힘이 강점입니다. 막힌 상황을 돌파합니다.': 'Pioneering spirit and the force of change are your strengths. You break through a blocked situation.',
    '관계가 남 보기에 반듯해집니다. 주변의 인정을 받는 짝입니다.': 'The relationship looks proper from outside. A pair that earns approval from around you.',
    '관계에 변화가 큽니다. 서로 다른 배경의 인연도 자주 봅니다.': 'There is a lot of change in relationships. Bonds across different backgrounds are common.',
    '글과 공부의 별입니다. 정리하고 문서로 남기는 일에 강합니다.': 'The star of writing and study. Strong at organising things and putting them on paper.',
    '나가면 사람이 붙습니다. 활동 범위가 넓을수록 일이 풀립니다.': 'People attach to you when you go out. The wider you range, the better things go.',
    '눈과 심혈관 쪽입니다. 과로가 쌓이는 신호를 놓치기 쉽습니다.': 'The eyes and the heart and blood vessels. It is easy to miss the signs of overwork piling up.',
    '물이 나무로 흘러갑니다. 가진 것을 내주며 무언가를 키웁니다.': 'Water flows into wood. You give what you have and raise something with it.',
    '불이 쇠를 녹입니다. 굳어 있던 것이 풀리고 형태가 바뀝니다.': 'Fire melts metal. What had hardened loosens and changes shape.',
    '불이 쇠를 벼립니다. 힘들지만 그만큼 단단해지는 한 해입니다.': 'Fire forges metal. A hard year, and a year that makes you solid.',
    '불이 흙을 만들어냅니다. 벌인 것이 실물로 남는 한 해입니다.': 'Fire makes earth. A year when what you started stays as something real.',
    '새로 만드는 일이 맞습니다. 이미 굳은 조직에서는 답답합니다.': 'Work that builds something new suits you. An organisation already set is stifling.',
    '새로운 자극이 필요합니다. 반복되는 일상이 오래가면 지칩니다.': 'You need fresh stimulation. A repeating routine wears you down if it runs long.',
    '신경과 간담 쪽입니다. 잠이 먼저 무너지니 수면부터 챙기세요.': 'The nerves and the liver and gallbladder. Sleep gives way first, so start by protecting it.',
    '신중함과 균형 감각이 강점입니다. 공정하다는 평판을 얻습니다.': 'Care and a sense of balance are your strengths. You earn a name for fairness.',
    '아는 사람이 아주 많습니다. 다만 깊이는 따로 챙겨야 합니다.': 'You know a great many people. The depth, though, has to be looked after separately.',
    '안정된 인연을 원합니다. 결혼 생활에서 살림을 쥐는 편입니다.': 'You want a steady bond. In married life you tend to hold the household.',
    '차곡차곡 모읍니다. 눈에 안 띄는 방식으로 재산이 늘어납니다.': 'You gather layer by layer. Your assets grow in ways nobody notices.',
    '큰 굴곡 없이 흘러갑니다. 남을 돕는 데 쓰는 몫이 있습니다.': 'It flows without great swings. Some of it goes to helping others.',
    '형제·동료가 야무집니다. 돈 문제는 처음에 선을 그어 두세요.': 'Siblings and colleagues are capable. Draw the line on money matters at the start.',
    '같은 나무끼리 숲을 이룹니다. 뻗어나가는 힘이 배가 됩니다.': 'Tree meets tree and becomes a forest. The reach doubles.',
    '나무가 불을 키웁니다. 도와주는 손이 붙어 불길이 커집니다.': 'Wood grows the fire. Helping hands attach and the blaze widens.',
    '나무가 흙을 헤집습니다. 편하던 자리가 흔들리며 정리됩니다.': 'Wood churns the earth. A comfortable place is shaken and sorted out.',
    '두 분의 태어난 시간을 모두 넣으면 명반으로도 봐 드립니다.': 'Enter a birth time for both and we will read your charts as well.',
    '뜻밖의 기회가 열리는 자리입니다. 사람을 통해 길이 납니다.': 'Unexpected openings appear. Paths come through people.',
    '멀리 나갈수록 길이 열립니다. 고향을 떠나 자리를 잡습니다.': 'The further out you go, the more the path opens. You settle away from where you were born.',
    '불이 흙을 데웁니다. 든든하던 자리에 온기와 활기가 돕니다.': 'Fire warms the earth. Warmth and life circulate in a place that was already solid.',
    '사람과 인연을 통해 돈이 옵니다. 씀씀이가 커지기 쉽습니다.': 'Money comes through people and connections. Your spending grows easily.',
    '사회에서 만나는 사람들, 인맥의 폭과 질을 보는 자리입니다.': 'The seat for the people you meet in society and the reach and quality of your network.',
    '쇠에 쇠가 부딪힙니다. 기준이 세지고 부딪히는 일도 늡니다.': 'Metal strikes metal. Your standards sharpen and so do the collisions.',
    '아이가 고집이 셉니다. 벌인 일은 더디지만 단단히 자랍니다.': 'A child is stubborn. What you start grows slowly but solidly.',
    '위장과 관절 쪽입니다. 회복이 느린 편이니 무리를 줄이세요.': 'The stomach and the joints. You recover slowly, so cut back on overdoing it.',
    '주변이 평온해야 마음이 놓입니다. 갈등을 오래 담아 둡니다.': 'You need calm around you to feel at ease. You hold on to conflict a long time.',
    '개척하고 책임지는 일이 맞습니다. 관리직보다 최전선입니다.': 'Work that opens ground and carries responsibility suits you. The front line rather than the management seat.',
    '곳간을 여는 형국입니다. 쌓아둔 것을 쓸 때가 되었습니다.': 'Opening the storehouse. It is time to spend what you stored.',
    '금테를 두른 칸이 명궁, 身 표시가 있는 칸이 신궁입니다.': 'The gold-framed cell is the Life palace; the cell marked 身 is the Body palace.',
    '나이 든 사람과 잘 맞습니다. 손윗사람의 도움이 있습니다.': 'You suit older people. There is help from those above you.',
    '만들어 내놓는 일, 사람 앞에 서는 일에서 결과가 납니다.': 'Results come from making things and from standing in front of people.',
    '물이 나무를 키웁니다. 배우고 채우며 자라는 한 해입니다.': 'Water raises wood. A year of learning, filling and growing.',
    '물이 불을 누릅니다. 열이 식으며 차분해지는 한 해입니다.': 'Water presses fire down. A year of heat cooling and settling.',
    '부모가 든든한 편입니다. 물려받는 것이 있을 수 있습니다.': 'A parent tends to be solid. There may be something handed down.',
    '상대의 속마음을 흔듭니다. 무심한 한마디가 오래 남습니다.': 'You stir what is inside them. A careless remark stays a long time.',
    '섬세함이 필요한 일, 사람의 마음을 다루는 일이 맞습니다.': 'Work that needs a fine touch and work that handles people’s feelings suits you.',
    '쇠가 물을 냅니다. 굳었던 생각이 풀려 흐르기 시작합니다.': 'Metal yields water. Hardened thinking loosens and starts to flow.',
    '아이가 따지기를 좋아합니다. 벌인 일에 검증이 필요합니다.': 'A child likes to argue a point. What you start needs checking.',
    '입과 지식으로 버는 돈입니다. 처음이 더디고 뒤가 큽니다.': 'Money earned by mouth and by knowledge. Slow at the start, large later.',
    '집안의 중심 역할을 합니다. 오래된 집과 인연이 있습니다.': 'You play the centre of the household. You have an affinity for old houses.',
    '집안일로 신경 쓸 일이 생깁니다. 조용한 자리를 고르세요.': 'Household matters give you things to attend to. Choose a quiet place.',
    '혼자 시작하는 일, 내 몫을 주장하는 일에 힘이 붙습니다.': 'Force gathers behind starting alone and claiming your share.',
    '흙이 물을 막습니다. 흘러가던 것이 고이며 자산이 됩니다.': 'Earth dams water. What was flowing pools and becomes an asset.',
    '도와주는 사람이 나타납니다. 혼자 짊어지려 하지 마세요.': 'Someone who helps appears. Do not try to carry it alone.',
    '매력과 다재다능함이 강점입니다. 기회를 폭넓게 잡습니다.': 'Appeal and range are your strengths. You catch openings across a wide field.',
    '명궁이 비어 있어 마주 보는 칸의 별을 빌려 읽었습니다.': 'The Life palace is empty, so the stars of the cell opposite were borrowed for this reading.',
    '물에 물이 더해집니다. 생각이 깊어지고 흐름이 커집니다.': 'Water added to water. Thinking deepens and the current widens.',
    '밖에 나가면 사람이 붙습니다. 인맥이 곧 기회가 됩니다.': 'People attach to you when you go out. Your network is the opening itself.',
    '밖에서 신뢰를 얻습니다. 중재를 부탁받는 일이 많습니다.': 'You earn trust outside. You are often asked to mediate.',
    '부모가 너그럽습니다. 기대는 시간이 길어질 수 있습니다.': 'A parent is generous. The stretch of leaning on them can run long.',
    '부모와 윗사람, 그리고 문서·계약 운을 보는 자리입니다.': 'The seat for parents and elders, and for documents and contracts.',
    '심혈관과 염증 쪽입니다. 무리한 뒤 회복을 꼭 넣으세요.': 'The heart and blood vessels, and inflammation. Always put recovery in after you overdo it.',
    '아버지 쪽 인연이 두드러집니다. 베푸는 어른을 만납니다.': 'The tie on the father’s side stands out. You meet an elder who gives.',
    '아이가 끼가 있습니다. 벌인 일이 여러 갈래로 뻗습니다.': 'A child has flair. What you start branches several ways.',
    '움직이는 별입니다. 이동과 출장, 자리 옮김이 잦습니다.': 'A moving star. Travel, trips and changes of post are frequent.',
    '조직에서 인정받거나 자격·직책이 생기기 좋은 흐름입니다.': 'A good current for recognition in an organisation, or for a qualification or title.',
    '집을 자기 색으로 꾸밉니다. 이사·수리를 자주 벌입니다.': 'You do the home in your own colour. You take on moves and renovations often.',
    '집을 자주 바꿉니다. 한 자리에 오래 머물기 어렵습니다.': 'You change homes often. Staying long in one place is hard.',
    '집이 편안해야 힘이 납니다. 꾸미기보다 아늑함을 봅니다.': 'You need a comfortable home to have force. You look at cosiness rather than decoration.',
    '추진력과 결단력이 강점입니다. 정체된 상황을 뚫어냅니다.': 'Drive and decisiveness are your strengths. You break through a stuck situation.',
    '형제·동료가 안정적입니다. 어려울 때 기댈 수 있습니다.': 'Siblings and colleagues are steady. You can lean on them when it is hard.',
    '형제·동료와 의견 차가 납니다. 선을 정하면 편해집니다.': 'Opinions differ with siblings and colleagues. Setting a line makes it easier.',
    '형제·또래와 사이가 무던합니다. 서로 기대는 관계입니다.': 'Things are easy with siblings and peers. It is a relationship of leaning on each other.',
    '흙에 흙이 쌓입니다. 자리가 더 두터워지고 무거워집니다.': 'Earth piles on earth. Your ground grows thicker and heavier.',
    '가만히 있으면 답답합니다. 몸을 쓰는 취미가 약입니다.': 'Sitting still is stifling. A hobby that uses the body is the medicine.',
    '가만히 있지 못합니다. 멀리 나갈수록 기회가 커집니다.': 'You cannot sit still. The further out you go, the bigger the opening.',
    '고치고 옮기기를 반복합니다. 집이 바뀌는 폭이 큽니다.': 'You repeat fixing and moving. The swing in where you live is wide.',
    '기쁜 일의 별입니다. 홍란과 마주 보며 짝을 이룹니다.': 'A star of glad events. It faces Hongran across the chart as its pair.',
    '깊게 아는 사람이 몇 됩니다. 넓게 사귀지는 않습니다.': 'There are a few you know deeply. You do not make friends widely.',
    '넓게 사귀지 않습니다. 일로 만난 사람이 오래 갑니다.': 'You do not make friends widely. The people you met through work last longest.',
    '무리하지 않습니다. 안정적으로 관리하는 쪽에 강합니다.': 'You do not overreach. You are strong at managing steadily.',
    '부모와 사는 방식이 다릅니다. 일찍 자기 길을 갑니다.': 'You live differently from your parents. You go your own way early.',
    '새로 만나는 사람보다 곁에 있던 사람이 도움이 됩니다.': 'The people already beside you help more than anyone newly met.',
    '쇠가 나무를 벱니다. 결단하고 잘라내는 일이 생깁니다.': 'Metal cuts wood. There is deciding and cutting away to do.',
    '아는 사람이 많습니다. 다만 챙기는 쪽이 늘 나입니다.': 'You know a lot of people. The one doing the looking after, though, is always you.',
    '아이가 자기 주장이 셉니다. 벌인 일의 기복이 큽니다.': 'A child asserts themselves strongly. What you start rises and falls widely.',
    '위장과 목·기관지 쪽입니다. 스트레스가 소화로 옵니다.': 'The stomach, throat and airway. Stress arrives through digestion.',
    '형제·동료가 활달합니다. 도움을 주고받는 폭이 큽니다.': 'Siblings and colleagues are lively. Help flows both ways generously.',
    '부모와 부딪힐 수 있습니다. 일찍 독립하는 편입니다.': 'You may clash with a parent. You tend to become independent early.',
    '사람이 크게 들고 납니다. 남는 사람은 오래 갑니다.': 'People come and go in large numbers. The ones who stay, stay long.',
    '수분 대사와 호르몬 쪽입니다. 감정이 몸으로 옵니다.': 'Fluid balance and hormones. Feeling arrives in the body.',
    '아이가 자기 길을 갑니다. 벌인 일의 부침이 큽니다.': 'A child goes their own way. What you start rises and falls sharply.',
    '외상과 근골격 쪽입니다. 무리한 뒤 회복을 챙기세요.': 'Injuries and the muscles and bones. Look after recovery once you have overdone it.',
    '유관무인(有官無印) — 자리는 있고 받침이 없는 배치': 'Yugwanmuin 有官無印 — a post with nothing under it',
    '즐길 거리가 있어야 삽니다. 취미가 여럿인 편입니다.': 'You need something to enjoy in order to live. You tend to keep several hobbies.',
    '형제나 또래 중에 재주 많고 총명한 사람이 있습니다.': 'There is someone clever and many-talented among your siblings or peers.',
    '흙이 물을 가둡니다. 흐르던 것이 한자리에 모입니다.': 'Earth pens the water. What was flowing collects in one place.',
    '흙이 쇠를 낳습니다. 쌓아둔 것이 결과물로 나옵니다.': 'Earth bears metal. What you stored comes out as results.',
    '흙이 쇠를 품습니다. 기댈 자리가 생기고 안정됩니다.': 'Earth holds metal. A place to lean on appears and things settle.',
    '간과 호르몬 쪽입니다. 과음·야식 습관을 살피세요.': 'The liver and hormones. Watch heavy drinking and late-night eating.',
    '관인양전(官印兩全) — 자리와 자격을 함께 쥔 배치': 'Gwaninyangjeon 官印兩全 — holding both post and credential',
    '벌이가 늘거나 새로운 수입 통로가 생기기 쉽습니다.': 'Earnings rise, or a new channel of income opens.',
    '부모와 부딪히거나 아주 가깝거나, 중간이 적습니다.': 'With a parent it is either clashing or very close, rarely in between.',
    '상대의 안목을 넓혀 줍니다. 취미와 배움이 늡니다.': 'You widen their eye. Hobbies and learning increase.',
    '신왕재왕(身旺財旺) — 그릇과 재물이 함께 큰 배치': 'Sinwangjaewang 身旺財旺 — a big vessel with big wealth',
    '양지동차강(陽支動且强) — 크고 빠르게 벌어지는 삶': 'Yangji 陽支動且强 — a life that happens big and fast',
    '언변과 통찰이 강점입니다. 남이 놓친 곳을 봅니다.': 'Speech and insight are your strengths. You see what others missed.',
    '자중모허(子衆母虛) — 사람은 많고 몫은 얇은 배치': 'Jajungmoheo 子衆母虛 — many people, a thin share',
    '집과 가정, 그리고 재산이 쌓여 머무는 자리입니다.': 'The seat for home and household, and where property settles and stays.',
    '피부와 순환 쪽입니다. 참는 습관이 몸으로 옵니다.': 'The skin and circulation. The habit of enduring arrives in the body.',
    '한 번에 크게 움직입니다. 안정보다 승부를 겁니다.': 'You move big in one go. You bet on the contest rather than on stability.',
    '형제·동료와 거리가 있습니다. 각자의 길을 갑니다.': 'There is distance with siblings and colleagues. Each goes their own way.',
    '베푼 것이 돌아옵니다. 조급해하지 않아도 됩니다.': 'What you gave comes back. There is no need to hurry it.',
    '비우는 자리입니다. 물질보다 뜻을 좇게 만듭니다.': 'A seat that empties. It makes you chase meaning over material.',
    '아이가 기가 셉니다. 벌인 일의 진행이 빠릅니다.': 'A child is strong-willed. What you start moves fast.',
    '아이가 무던합니다. 벌인 일이 차곡차곡 자랍니다.': 'A child is easy-going. What you start grows layer by layer.',
    '어른의 덕이 있습니다. 물려받는 가르침이 큽니다.': 'You have the benefit of elders. What is handed down in teaching is large.',
    '인태과 희견재(印太過喜見財) — 준비가 과한 배치': 'Intaegwa 印太過喜見財 — a chart that over-prepares',
    '절처봉생(絶處逢生) — 끊겼다 다시 시작되는 자리': 'Jeolcheobongsaeng 絶處逢生 — cut off, then begun again',
    '집을 사교의 자리로 씁니다. 사람이 자주 옵니다.': 'You use your home as a social space. People come often.',
    '집을 자산으로 봅니다. 부동산과 인연이 있습니다.': 'You see a home as an asset. You have an affinity for property.',
    '기토탁임(己土濁壬) — 조직과 내가 섞이는 배치': 'Gitotagim 己土濁壬 — where you and the organisation blur',
    '밖에 나가야 풀립니다. 이동과 변화가 잦습니다.': 'Things loosen once you go out. Moving and change are frequent.',
    '사귀는 사람의 색이 강합니다. 중간이 적습니다.': 'The people you keep have strong colour. There is little in between.',
    '성별을 고르면 대한이 도는 방향이 정확해집니다.': 'Choosing a gender makes the direction of the major limits exact.',
    '어머니 쪽 인연이 두드러집니다. 정이 깊습니다.': 'The tie on the mother’s side stands out. The affection is deep.',
    '음지정차전(陰支靜且專) — 좁고 더디게 오는 삶': 'Eumji 陰支靜且專 — a life that comes narrow and slow',
    '인연이 닿는 별입니다. 만남과 경사가 따릅니다.': 'A star of connection. Meetings and happy occasions follow.',
    '집이 단정합니다. 정리된 공간에서 힘이 납니다.': 'Your home is tidy. An ordered space gives you force.',
    '관성태과(官星太過) — 눌리는 힘이 과한 배치': 'Gwanseongtaegwa 官星太過 — too much pressing down',
    '무재사주(無財四柱) — 재물 글자가 없는 배치': 'Mujae 無財四柱 — a chart with no wealth character',
    '부모와 원만합니다. 도리를 지키는 관계입니다.': 'Things are smooth with a parent. It is a relationship that keeps to what is proper.',
    '아이가 순합니다. 벌인 일은 천천히 자랍니다.': 'A child is mild. What you start grows slowly.',
    '아이가 여립니다. 벌인 일이 조용히 자랍니다.': 'A child is tender. What you start grows quietly.',
    '형제·동료 중에 개성이 강한 사람이 있습니다.': 'There is someone with a strong character among your siblings or colleagues.',
    '효신(梟神) — 배우자 자리에 앉은 어머니 별': 'Hyosin 梟神 — the mother star in the spouse seat',
    '극신약(極身弱) — 받쳐줄 글자가 없는 배치': 'Geuksinyak 極身弱 — a chart with nothing to prop it',
    '부모가 사교적입니다. 관계가 친구 같습니다.': 'A parent is sociable. The relationship feels like friendship.',
    '수다목부(水多木浮) — 생각의 물에 뜬 나무': 'Sudamokbu 水多木浮 — a tree afloat on thought',
    '아이가 의젓합니다. 벌인 일이 오래 갑니다.': 'A child is composed. What you start lasts long.',
    '집이 곧 안식처입니다. 정성 들여 가꿉니다.': 'Home is your resting place. You tend it with care.',
    '깊게 사귀는 대신 관계의 온도차가 큽니다.': 'You go deep, but the temperature gap between relationships is wide.',
    '넓지 않아도 속을 나누는 사람이 있습니다.': 'It is not wide, but there is someone you share your inside with.',
    '사화 — 태어난 해가 붙이는 네 가지 딱지': 'Four transformations — what your birth year marks',
    '상대의 그 자리를 반듯하게 다듬어 줍니다.': 'You straighten and tidy that seat of theirs.',
    '상대의 돈 문제를 깔끔하게 정리해 줍니다.': 'You tidy up their money matters.',
    '왕지충(旺支沖) — 한쪽으로 확 기우는 충': 'Wangjichung 旺支沖 — a clash that tips hard one way',
    '정관격(正官格) — 순리대로 올라가는 배치': 'Jeonggwangyeok 正官格 — rising in the natural order',
    '형제·동료 사이에서 조정 역할을 맡습니다.': 'You take the coordinating role among siblings and colleagues.',
    '두루 원만합니다. 적을 만들지 않습니다.': 'You get along all round. You do not make enemies.',
    '득령(得令) — 월지 하나로 버티는 배치': 'Deukryeong 得令 — holding on by the month branch alone',
    '살중신경(殺重身輕) — 홀로 견디는 배치': 'Saljungsingyeong 殺重身輕 — enduring it alone',
    '상대의 그 자리를 수월하게 풀어 줍니다.': 'You loosen that seat of theirs.',
    '상대의 그 자리에 힘과 속도를 더합니다.': 'You add force and speed to that seat of theirs.',
    '인수태과(印綬太過) — 배움을 파는 연습': 'Insutaegwa 印綬太過 — practise selling what you know',
    '태어난 해는 음력 설을 경계로 잡습니다.': 'The birth year is bounded by the lunar New Year.',
    '형제·동료 중 맏이 역할을 하게 됩니다.': 'You end up playing the eldest among siblings and colleagues.',
    '오래 못 본 사람에게서 소식이 옵니다.': 'News arrives from someone you have not seen in a long time.',
    '조후(調候) — 데워줄 불이 없는 겨울': 'Johu 調候 — a winter with no fire to warm it',
    '조후(調候) — 식혀줄 물이 없는 여름': 'Johu 調候 — a summer with no water to cool it',
    '종격(從格) — 한 기운으로 쏠린 배치': 'Jonggyeok 從格 — a chart tipped into one force',
    '생지충(生支沖) — 시동이 걸리는 충': 'Saengjichung 生支沖 — a clash that turns the engine over',
    '재다신약(財多身弱) — 기회보다 체력': 'Jaedasinyak 財多身弱 — stamina before opportunity',
    '화개(華蓋) — 모으고 이어주는 배치': 'Hwagae 華蓋 — a chart that gathers and connects',
    '마주 보는 칸에서 빌려 읽었습니다.': 'Borrowed from the cell opposite.',
    '붕충(朋沖) — 소소하게 꼬이는 충': 'Bungchung 朋沖 — a clash that tangles in small ways',
    '상대의 그 자리에 마음이 몰립니다.': 'Your mind crowds into that seat of theirs.',
    '오래 가는 사람들이 곁에 남습니다.': 'The people who last are the ones who stay beside you.',
    '곡직(曲直) — 목으로 뭉친 배치': 'Gokjik 曲直 — a chart massed in Wood',
    '뜨거움과 냉정함을 함께 가진 사람': 'someone who carries heat and cold at once',
    '망설이지 않고 정면으로 가는 사람': 'someone who goes straight at it without hesitating',
    '종혁(從革) — 금으로 뭉친 배치': 'Jonghyeok 從革 — a chart massed in Metal',
    '대한 — 10년마다 바뀌는 무대': 'Major limits — the stage changes every ten years',
    '맡은 자리를 끝까지 지키는 사람': 'someone who holds the post to the end',
    '아이가 순하고 눈치가 빠릅니다.': 'A child is mild and quick to read a room.',
    '염상(炎上) — 화로 뭉친 배치': 'Yeomsang 炎上 — a chart massed in Fire',
    '윤하(潤下) — 수로 뭉친 배치': 'Yunha 潤下 — a chart massed in Water',
    '드러내지 않고 깊이 쌓는 사람': 'someone who builds deep without showing it',
    '재주가 많고 사람을 끄는 사람': 'someone full of talent who draws people in',
    '형제·동료가 강단이 있습니다.': 'Siblings and colleagues have backbone.',
    '형제·동료가 재주가 많습니다.': 'Siblings and colleagues are full of talent.',
    '형제·또래와 정으로 엮입니다.': 'You are bound to siblings and peers by affection.',
    '끝까지 파고들어 꿰뚫는 사람': 'someone who digs to the end and sees through',
    '말보다 결과로 증명하는 사람': 'someone who proves it by result, not by talk',
    '치우치지 않고 조율하는 사람': 'someone who does not tip, and coordinates',
    '판을 갈아엎으며 나아가는 결': 'the grain that overturns the board and moves on',
    '모나지 않게 스며드는 사람': 'someone who seeps in without an edge',
    '밖으로 내주며 빛나는 사람': 'someone who shines by giving outward',
    '중심을 잡고 책임지는 사람': 'someone who holds the centre and carries it',
    '자리를 지키며 다듬는 결': 'the grain that holds a place and refines it',
    '자미두수로 보는 두 사람': 'The two of you in Ziwei Doushu',
    '재물 · 실리 · 분주함': 'money · substance · bustle',
    '차분히 쌓아 지키는 사람': 'someone who stacks it up calmly and keeps it',
    '공부 · 문서 · 귀인': 'study · documents · helpful people',
    '끌리는 만큼 얽히는 짝': 'A pair that tangles as much as it pulls',
    '독립 · 경쟁 · 동료': 'independence · competition · peers',
    '드러내고 말로 푸는 결': 'the grain that shows itself and works things out in words',
    '머리가 먼저 도는 사람': 'someone whose head turns first',
    '자부염무상(紫府廉武相)': 'Jabuyeommusang 紫府廉武相',
    '중심을 쥐고 이끄는 결': 'the grain that holds the centre and leads',
    '책임 · 자리 · 압박': 'duty · position · pressure',
    '표현 · 활동 · 시작': 'expression · activity · beginnings',
    '명궁 — 나라는 사람': 'Life palace — who you are',
    '명궁에 같이 앉은 별': 'Stars sharing the Life palace',
    '사화가 떨어지는 자리': 'Where the transformations land',
    '자부염무상×자부염무상': 'Jabuyeommusang × Jabuyeommusang',
    '판을 새로 짜는 사람': 'someone who lays the board out anew',
    '한 국을 이루는 자리': 'Cells forming one bureau',
    '기월동량(機月同梁)': 'Giwoldongryang 機月同梁',
    '기월동량×자부염무상': 'Giwoldongryang × Jabuyeommusang',
    '현실이 바빠지는 해': 'a year when the practical gets busy',
    '그리던 상과 실제': 'What you pictured, and who came',
    '기월동량×기월동량': 'Giwoldongryang × Giwoldongryang',
    '내 힘을 쓰는 해': 'a year of spending your own force',
    '마음이 몰리는 짝': 'A pair the mind crowds into',
    '살파랑×자부염무상': 'Salparang × Jabuyeommusang',
    '서로 밀어주는 짝': 'A pair that pushes each other along',
    '욕망과 재능의 별': 'the star of appetite and talent',
    '욕망과 절제의 별': 'the star of desire and restraint',
    '자리와 책임의 해': 'a year of position and duty',
    '재물과 실행의 별': 'the star of wealth and action',
    '거일×자부염무상': 'Georil × Jabuyeommusang',
    '기월동량×살파랑': 'Giwoldongryang × Salparang',
    '두 사람의 명궁': 'Both Life palaces',
    '마주 보는 자리': 'Cells facing each other',
    '말과 통찰의 별': 'the star of speech and insight',
    '살파랑(殺破狼)': 'Salparang 殺破狼',
    '은근히 돕는 짝': 'A quietly helping pair',
    '인생의 자리마다': 'Area by area',
    '거일×기월동량': 'Georil × Giwoldongryang',
    '금테 = 명궁': 'gold frame = Life palace',
    '두 번째 사람': 'Second person',
    '살파랑×살파랑': 'Salparang × Salparang',
    '자미두수 명반': 'Ziwei Doushu chart',
    '첫 번째 사람': 'First person',
    '한 해의 흐름': 'The year’s current',
    '힘이 붙는 곳': 'Where force gathers',
    '(빌린 별)': '(Borrowed star)',
    '身 = 신궁': '身 = Body palace',
    '가 주는 것': ' gives',
    '거일(巨日)': 'Georil 巨日',
    '거일×살파랑': 'Georil × Salparang',
    '기거(機巨)': 'Gigeo 機巨',
    '기량(機梁)': 'Giryang 機梁',
    '기음(機陰)': 'Gieum 機陰',
    '동거(同巨)': 'Donggeo 同巨',
    '동량(同梁)': 'Dongryang 同梁',
    '동음(同陰)': 'Dongeum 同陰',
    '무부(武府)': 'Mubu 武府',
    '무살(武殺)': 'Musal 武殺',
    '무상(武相)': 'Musang 武相',
    '무탐(武貪)': 'Mutam 武貪',
    '무파(武破)': 'Mupa 武破',
    '비껴선 자리': 'Cells standing aside',
    '사람과 관계': 'People and ties',
    '손잡는 자리': 'Cells that join hands',
    '양거(陽巨)': 'Yanggeo 陽巨',
    '양량(陽梁)': 'Yangryang 陽梁',
    '염부(廉府)': 'Yeombu 廉府',
    '염살(廉殺)': 'Yeomsal 廉殺',
    '염상(廉相)': 'Yeomsang 廉相',
    '염탐(廉貪)': 'Yeomtam 廉貪',
    '염파(廉破)': 'Yeompa 廉破',
    '일월(日月)': 'Irwol 日月',
    '자부(紫府)': 'Jabu 紫府',
    '자살(紫殺)': 'Jasal 紫殺',
    '자상(紫相)': 'Jasang 紫相',
    '자탐(紫貪)': 'Jatam 紫貪',
    '자파(紫破)': 'Japa 紫破',
    '재물과 실리': 'Money and substance',
    '화과(化科)': 'Hwagwa 化科',
    '화권(化權)': 'Hwagwon 化權',
    '화기(化忌)': 'Hwagi 化忌',
    '화록(化祿)': 'Hwarok 化祿',
    '같은 자리': 'The same cell',
    '개척의 별': 'the pioneer star',
    '거일×거일': 'Georil × Georil',
    '곳간의 별': 'the storehouse star',
    '내놓는 해': 'a year of putting out',
    '담백한 짝': 'A plain, clean pair',
    '베푸는 별': 'the giving star',
    '어른의 별': 'the elder star',
    '자부염무상': 'Jabuyeommusang',
    '장군의 별': 'the general star',
    '재상의 별': 'the minister star',
    '제왕의 별': 'the emperor star',
    '주성 없음': 'no main star',
    '지혜의 별': 'the star of wits',
    '채우는 해': 'a year of filling up',
    '기월동량': 'Giwoldongryang',
    '달의 별': 'the moon star',
    '복의 별': 'the star of ease',
    '빌린 별': 'Borrowed star',
    '살필 곳': 'What to watch',
    '토정비결': 'Tojeong Bigyeol',
    '관록궁': 'Career palace',
    '그 밖': 'Other',
    '금사국': 'Metal 4 bureau',
    '노복궁': 'Friends palace',
    '목삼국': 'Wood 3 bureau',
    '복덕궁': 'Wellbeing palace',
    '부모궁': 'Parents palace',
    '부처궁': 'Spouse palace',
    '살파랑': 'Salparang',
    '수이국': 'Water 2 bureau',
    '오행국': 'Bureau',
    '자녀궁': 'Children palace',
    '재백궁': 'Wealth palace',
    '전택궁': 'Property palace',
    '질액궁': 'Health palace',
    '천이궁': 'Travel palace',
    '토오국': 'Earth 5 bureau',
    '형제궁': 'Siblings palace',
    '화육국': 'Fire 6 bureau',
    '강점': 'Strength',
    '거문': 'Geomun',
    '거일': 'Georil',
    '경양': 'Gyeongyang',
    '과제': 'Task',
    '길성': 'Lucky star',
    '녹존': 'Nokjon',
    '명궁': 'Life palace',
    '명주': 'Life star',
    '무곡': 'Mugok',
    '문곡': 'Mungok',
    '문창': 'Munchang',
    '살성': 'Harsh star',
    '순행': 'forward',
    '신주': 'Body star',
    '역행': 'backward',
    '염정': 'Yeomjeong',
    '영성': 'Yeongseong',
    '우필': 'Upil',
    '윤달': 'leap month',
    '음력': 'Lunar',
    '자미': 'Jami',
    '좌보': 'Jwabo',
    '주성': 'Main star',
    '지겁': 'Jigeop',
    '지공': 'Jigong',
    '천괴': 'Cheongoe',
    '천기': 'Cheongi',
    '천동': 'Cheondong',
    '천량': 'Cheonryang',
    '천마': 'Cheonma',
    '천부': 'Cheonbu',
    '천상': 'Cheonsang',
    '천월': 'Cheonwol',
    '천희': 'Cheonhui',
    '칠살': 'Chilsal',
    '타라': 'Tara',
    '탐랑': 'Tamnang',
    '태세': 'Year',
    '태양': 'Taeyang',
    '태음': 'Taeeum',
    '파군': 'Pagun',
    '홍란': 'Hongran',
    '화성': 'Hwaseong',
    // ===== 자미두수 추가분 끝 =====
  };

  // ----- 규칙: 이름·타입·숫자가 끼는 문구 -----
  const TYPE = '[IE][NS][TF][JP]';
  const RULES = [
    // ----- 2026-08-18 반복 개편: 합충 칸 제목과 가면 수치 문장 -----
    [/^([자축인묘진사오미신유술해])([자축인묘진사오미신유술해])충\(沖\) — (연지|월지|일지|시지)와 (연지|월지|일지|시지) 사이$/, (m) => {
      const P = { '연지': 'year branch', '월지': 'month branch', '일지': 'day branch', '시지': 'hour branch' };
      return `${DICT[m[1]] || m[1]}–${DICT[m[2]] || m[2]} clash (沖) — between the ${P[m[3]]} and the ${P[m[4]]}`;
    }],
    [/^([자축인묘진사오미신유술해])([자축인묘진사오미신유술해])합\(合\) — (연지|월지|일지|시지)와 (연지|월지|일지|시지) 사이$/, (m) => {
      const P = { '연지': 'year branch', '월지': 'month branch', '일지': 'day branch', '시지': 'hour branch' };
      return `${DICT[m[1]] || m[1]}–${DICT[m[2]] || m[2]} harmony (合) — between the ${P[m[3]]} and the ${P[m[4]]}`;
    }],
    [/^천간의 합 — ([갑을병정무기경신임계])([갑을병정무기경신임계])합$/, (m) =>
      `Union of heavenly stems — ${DICT[m[1]] || m[1]}-${DICT[m[2]] || m[2]}`],
    [/^현재의 성격인 ([IE][NS][TF][JP])는 (.+?)입니다\.\s*(.*)$/, (m, tr) =>
      `Your current personality, ${m[1]}, is ${tr(m[2])}. ${tr(m[3])}`],
    [/^([IE][NS][TF][JP])라면 — 이런 말, 들어본 적 있나요\?$/, (m) =>
      `If you're ${m[1]} — heard these before?`],
    [/^이 배열에 가까운 유형은 둘입니다 — ([IE][NS][TF][JP]) 또는 ([IE][NS][TF][JP])\.\s*(.*)$/, (m, tr) =>
      `Two types fit this arrangement — ${m[1]} or ${m[2]}. ${tr(m[3])}`],
    [/^들으면 기분 좋은 말 — [“"](.+)[”"]$/, (m, tr) => `Words that lift you — "${tr(m[1])}"`],
    [/^들으면 싫은 말 — [“"](.+)[”"]$/, (m, tr) => `Words you hate to hear — "${tr(m[1])}"`],
    [/^팩폭 — (.+)$/, (m, tr) => `Reality check — ${tr(m[1])}`],
    [/^나를 드러내는 기운\(비겁·식상\)이 (\d+(?:\.\d+)?), 나를 다듬는 기운\(관성·인성\)이 (\d+(?:\.\d+)?)입니다\.\s*(.*)$/, (m, tr) =>
      `Self-expressing energy (peers·output) ${m[1]}, self-refining energy (duty·support) ${m[2]}. ${tr(m[3])}`],
    [new RegExp(`^(${TYPE}) 본인들이 하는 말$`), (m) => `What ${m[1]}s say about themselves`],
    [new RegExp(`^같은 (${TYPE})인데 왜 다른가$`), (m) => `Why ${m[1]}s still differ`],
    [new RegExp(`^인터넷에서 도는 (${TYPE}) 이야기$`), (m) => `What the internet says about ${m[1]}`],
    [new RegExp(`^일주 × (${TYPE})$`), (m) => `Day pillar × ${m[1]}`],
    [/^(\d{4})년 운세$/, (m) => `Your ${m[1]} outlook`],
    [/^([가-힣])시 (\d\d:\d\d~\d\d:\d\d)$/, (m) => `${DICT[m[1]] || m[1]} hour ${m[2]}`],
    [/^(\d{4})년 (\d{1,2})월 (\d{1,2})일생(.*)$/, (m, tr) => `Born ${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}${tr(m[4])}`],
    [/^([갑을병정무기경신임계])([자축인묘진사오미신유술해])$/, (m) => `${DICT[m[1]]}-${DICT[m[2]]}`],
    [/^([갑을병정무기경신임계])([자축인묘진사오미신유술해])일주$/, (m) => `${DICT[m[1]]}-${DICT[m[2]]} day pillar`],
    [/^([갑을병정무기경신임계])([자축인묘진사오미신유술해])년$/, (m) => `Year of ${DICT[m[1]]}-${DICT[m[2]]}`],
    [/^([갑을병정무기경신임계])([甲乙丙丁戊己庚辛壬癸]) · (.+)$/, (m, tr) => `${DICT[m[1]]} ${m[2]} · ${tr(m[3])}`],
    [/^제 (\d+) 괘$/, (m) => `Hexagram ${m[1]}`],
    [/^나를 드러내는 기운 (\d+(?:\.\d+)?)$/, (m) => `Self-expressing energy ${m[1]}`],
    [/^나를 다듬는 기운 (\d+(?:\.\d+)?)$/, (m) => `Self-refining energy ${m[1]}`],
    [/^영어권에서는 — (.+)$/, (m) => `In English-speaking corners: ${m[1]}`],
    [/^오늘의 행동 — (.+)$/, (m, tr) => `Today's action: ${tr(m[1])}`],
    [/^행동 — (.+)$/, (m, tr) => `Action: ${tr(m[1])}`],
    [/^여기서 나온 우리말 — (.+)$/, (m, tr) => `Korean sayings born from this: ${tr(m[1])}`],
    [/^힘들 때는 이 말을 기억하세요\. [“"](.+?)[”"]$/, (m, tr) => `When it gets hard, remember this: "${tr(m[1])}"`],
    [/^들으면 기운이 나는 말은 [“"](.+?)[”"] 같은 표현입니다\.$/, (m, tr) => `Words like "${tr(m[1])}" put wind back in your sails.`],
    [/^([가-힣]+)형 ([IE][NS][TF][JP])$/, (m, tr) => {
      const g = tr(m[1]);
      return g !== m[1] ? `${g}-type ${m[2]}` : null;
    }],
    [/^(.+?) ([IE][NS][TF][JP])$/, (m, tr) => {
      const nick = tr(m[1]);
      return nick !== m[1] ? `${nick} ${m[2]}` : null;
    }],
  ];

  // 십이운성 열두 자리 — 한 글자짜리가 띠 동물과 겹쳐서 따로 둡니다
  const BRANCH_EN = {
    '자': 'Ja', '축': 'Chuk', '인': 'In', '묘': 'Myo', '진': 'Jin', '사': 'Sa',
    '오': 'O', '미': 'Mi', '신': 'Sin', '유': 'Yu', '술': 'Sul', '해': 'Hae',
  };
  const ZODIAC_EN = {
    '쥐': 'Rat', '소': 'Ox', '호랑이': 'Tiger', '토끼': 'Rabbit', '용': 'Dragon', '뱀': 'Snake',
    '말': 'Horse', '양': 'Sheep', '원숭이': 'Monkey', '닭': 'Rooster', '개': 'Dog', '돼지': 'Pig',
  };
  const UNSEONG_EN = {
    '장생': 'Birth', '목욕': 'Bath', '관대': 'Coming of age', '건록': 'Prime', '제왕': 'Peak',
    '쇠': 'Waning', '병': 'Illness', '사': 'Death', '묘': 'Tomb', '절': 'Severance', '태': 'Conception', '양': 'Nurture',
  };

  // ----- 원자 치환: 사주 용어(한자 병기)를 먼저 영어로 바꿉니다 -----
  // 치환 후의 문장을 아래 접합 규칙(GLUE)이 받아서 마저 번역합니다.
  const ATOM_LIST = [
    ['목(木)', 'Wood(木)'], ['화(火)', 'Fire(火)'], ['토(土)', 'Earth(土)'], ['금(金)', 'Metal(金)'], ['수(水)', 'Water(水)'],
    ['비겁(比劫)', 'Peers(比劫)'], ['식상(食傷)', 'Output(食傷)'], ['재성(財星)', 'Wealth(財星)'],
    ['관성(官星)', 'Discipline(官星)'], ['인성(印星)', 'Support(印星)'],
    ['갑(甲)', 'Gap(甲)'], ['을(乙)', 'Eul(乙)'], ['병(丙)', 'Byeong(丙)'], ['정(丁)', 'Jeong(丁)'], ['무(戊)', 'Mu(戊)'],
    ['기(己)', 'Gi(己)'], ['경(庚)', 'Gyeong(庚)'], ['신(辛)', 'Sin(辛)'], ['임(壬)', 'Im(壬)'], ['계(癸)', 'Gye(癸)'],
    ['간(肝)', 'the liver(肝)'], ['담(膽)', 'the gallbladder(膽)'], ['심장(心)', 'the heart(心)'], ['심(心)', 'the heart(心)'],
    ['소장(小腸)', 'the small intestine(小腸)'], ['비장(脾)', 'the spleen(脾)'], ['비(脾)', 'the spleen(脾)'],
    ['위(胃)', 'the stomach(胃)'], ['폐(肺)', 'the lungs(肺)'], ['대장(大腸)', 'the large intestine(大腸)'],
    ['신장(腎)', 'the kidneys(腎)'], ['신(腎)', 'the kidneys(腎)'], ['방광(膀胱)', 'the bladder(膀胱)'],
    ['태양인(太陽人)', 'Taeyang(太陽人)'], ['태음인(太陰人)', 'Taeeum(太陰人)'],
    ['소양인(少陽人)', 'Soyang(少陽人)'], ['소음인(少陰人)', 'Soeum(少陰人)'],
    ['비(悲)', 'sorrow(悲)'], ['노(怒)', 'anger(怒)'], ['희(喜)', 'joy(喜)'], ['사(思)', 'worry(思)'], ['공(恐)', 'fear(恐)'],
    ['백(白)', 'white(白)'], ['청(靑)', 'blue-green(靑)'], ['적(赤)', 'red(赤)'], ['황(黃)', 'yellow(黃)'], ['흑(黑)', 'black(黑)'],
  ];
  // 병오년(丙午) 같은 간지+년 표기
  const GZ_YEAR_RE = /([갑을병정무기경신임계])([자축인묘진사오미신유술해])년(\((?:[甲乙丙丁戊己庚辛壬癸])(?:[子丑寅卯辰巳午未申酉戌亥])\))?/g;
  /* 일주 이름 두 글자(경진)를 로마자로 — 문장 속에 박혀 있으면 사전이 못 잡는다(2026-08-27) */
  function ilju2en(k) {
    if (!k || k.length !== 2) return k;
    const a = DICT[k[0]], b = DICT[k[1]];
    return (a && b) ? `${a}-${b}` : k;
  }

  function atomSub(s) {
    let out = s;
    for (const [ko, en] of ATOM_LIST) out = out.split(ko).join(en);
    out = out.replace(GZ_YEAR_RE, (mm, a, b, h) => `the year of ${DICT[a]}-${DICT[b]}${h || ''}`);
    return out;
  }

  // ----- 접합 규칙: 원자 치환이 끝난 문장의 뼈대를 번역합니다 -----
  const GLUE = [
    [/^(.+?) 과다$/, (m) => `${m[1]} excess`],
    [/^(.+?) 불급$/, (m) => `${m[1]} missing`],
    [/^(.+?) 기운$/, (m) => `${m[1]} energy`],
    [/^(.+?)[이가] 가장 많습니다\. (.+)$/, (m, tr) => `${m[1]} is your most abundant energy. ${tr(m[2])}`],
    [/^(.+?) 기운은 드러나지 않습니다\. (.+)$/, (m, tr) => `${m[1]} energy stays hidden in your chart. ${tr(m[2])}`],
    [/^타고난 기질은 (.+?) — (.+?)에 해당합니다\. (.+)$/, (m, tr) => `Your inborn temperament is ${m[1]}, ${tr(m[2])}. ${tr(m[3])}`],
    [/^사주 여덟 글자에서 (.+?) 기운이 가장 강합니다\. (.+)$/, (m, tr) => `Among the eight characters of your saju, ${m[1]} is the strongest energy. ${tr(m[2])}`],
    [new RegExp(`^사주가 가리키는 성격 유형인 (${TYPE})[은는] (.+)$`), (m, tr) => `${m[1]}, the type your saju points to, is this: ${tr(m[2])}`],
    [new RegExp(`^그중에서도 (.+?)형 (${TYPE})입니다\\. (.+)$`), (m, tr) => `More precisely, you are a ${tr(m[1])}-type ${m[2]}. ${tr(m[3])}`],
    [/^둘을 합치면 (.+?)[과와] (.+?)[이가] 가장 앞에 나오는 사람입니다\.$/, (m, tr) => `Put together, ${tr(m[1])} and ${tr(m[2])} lead the way in you.`],
    [new RegExp(`^일간 (\\S+) (.+?)의 (\\S+) 기운 위에 (${TYPE}) 기질이 같은 방향으로 얹혔습니다\\. (.+)$`), (m, tr) => `On top of your day master ${m[1]} (${tr(m[2])}) with its ${m[3]} energy, your ${m[4]} nature leans the same way. ${tr(m[5])}`],
    [new RegExp(`^일간 (.+?) 기운 위에 (${TYPE}) 기질이 같은 방향으로 얹혔습니다\\. (.+)$`), (m, tr) => `On top of your day master ${m[1]} energy, your ${m[2]} nature leans the same way. ${tr(m[3])}`],
    [/^고치려고 하지 마세요\. 그늘을 지우면 (.+?)도 같이 지워집니다\. 그냥 세트입니다\.$/, (m, tr) => `Do not try to fix it. Erase the shadow and you erase your ${tr(m[1])} with it. They come as a set.`],
    [/^타고난 기질인 일간 (\S+) (.+?)에서 그대로 올라온 특성입니다\. (.+)$/, (m, tr) => `This trait rises straight from your day master ${m[1]}, ${tr(m[2])}. ${tr(m[3])}`],
    [/^타고난 기질인 일간 (.+?)에서 그대로 올라온 특성입니다\. (.+)$/, (m, tr) => `This trait rises straight from your day master, ${m[1]}. ${tr(m[2])}`],
    [/^이 흐름에서 당신은 (.+)$/, (m, tr) => {
      const rest = tr(m[1]);
      return rest !== m[1] ? `In this current, here is what you do: ${rest}` : null;
    }],
    [/^(.+?)에 해당합니다\.$/, (m, tr) => {
      const inner = tr(m[1]);
      return inner !== m[1] ? `${inner}.` : null;
    }],
    [/^(?:※\s*)?직업 이름보다 [“"「](.+?)[”"」][를을] 보는 것이 정확합니다\.(?:\s+(.+?)에서 능력이 가장 크게 나옵니다\.)?$/, (m, tr) => `More telling than any job title is "${tr(m[1])}".` + (m[2] ? ` Your ability shows most in ${tr(m[2])}.` : '')],
    [/^(.+?) 기운이 약하게 드러납니다\.?$/, (m) => `${DICT[m[1]] || m[1]} energy shows weakly in your chart.`],
    [/^사주 여덟 글자에 깔린 (.+?) 기운이 밀어 올린 특성입니다\. (.+)$/, (m, tr) => `A trait pushed up by the ${DICT[m[1]] || m[1]} energy laid through your eight characters. ${tr(m[2])}`],
    [/^(.{1,16}?)[은는] (.+?)[을를] 주관한다고 보아,? ?(.+?)(?:으로|로) 해석합니다\.?$/, (m, tr) => `${tr(m[1])} is said to govern ${tr(m[2])}, read as ${tr(m[3])}.`],
    [/^[“"「](.+?)[”"」][은는] 말이 여기서 나왔습니다\.?$/, (m, tr) => `That is where the saying "${tr(m[1])}" comes from.`],
    [/^(.+?) [“"](.+?)[”"] 같은 말에는 유독 민감해집니다\.$/, (m, tr) => `${tr(m[1])} Words like "${tr(m[2])}" hit a nerve.`],
    [/^체질로 보면 (.+?)에 가깝습니다\. (.+)$/, (m, tr) => `By constitution, you lean ${m[1]}. ${tr(m[2])}`],
    [/^강점은 (.+?)입니다\. (.+)$/, (m, tr) => `Your strength: ${tr(m[1])}. ${tr(m[2])}`],
    [/^(.+?)일주는 십이운성으로 (.+?)\((.+?)\)입니다\. (.+)$/, (m, tr) => `In the twelve life stages, your ${tr(m[1])} day pillar sits at ${UNSEONG_EN[m[2]] || tr(m[2])} (${tr(m[3])}). ${tr(m[4])}`],
    [new RegExp(`^일주는 (.+?)[을를] 밀어 올리고, (${TYPE})는 (.+?)[을를] 밀어 올립니다\\. (.+)$`), (m, tr) => `Your day pillar pushes up ${tr(m[1])}, while your ${m[2]} pushes up ${tr(m[3])}. ${tr(m[4])}`],
    [/^나를 드러내는 기운\((.+?)\)[이가] (\d+(?:\.\d+)?), 나를 다듬는 기운\((.+?)\)[이가] (\d+(?:\.\d+)?)입니다\. (.+)$/, (m, tr) => `Your self-expressing energy (${m[1]}) totals ${m[2]}, your self-refining energy (${m[3]}) totals ${m[4]}. ${tr(m[5])}`],
    [/^가장 강한 (.+?)[은는] 몸으로 보면 (.+?)에 붙습니다\. (.+)$/, (m, tr) => `Your strongest, ${DICT[m[1]] || m[1]}, maps to ${m[2]} in the body. ${tr(m[3])}`],
    [/^감정으로는 (.+?), 감각으로는 (.+?), 몸으로는 (.+?)[을를] 주관한다고 봅니다\. (.+)$/, (m, tr) => `It is said to govern ${m[1]} in emotion, ${tr(m[2])} in the senses, and ${tr(m[3])} in the body. ${tr(m[4])}`],
    [/^(.+?) 기운은 가장 약하게 드러납니다\. (.+)$/, (m, tr) => `${DICT[m[1]] || m[1]} shows weakest in your chart. ${tr(m[2])}`],
    [/^오행의 색이 (.+?)(?:이라|라) (.+)$/, (m, tr) => `Its five-element color is ${m[1]}, ${tr(m[2])}`],
    [/^(.+?)[을를] 오래 안고 가는 감정입니다\.$/, (m, tr) => `an emotion that holds ${tr(m[1])} for a long time.`],
    [/^(.{1,24}?)[은는] (.+?)[과와] (.+?)에 붙습니다\. (.+)$/, (m, tr) => `${tr(m[1])} maps to ${m[2]} and ${m[3]}. ${tr(m[4])}`],
    // 십이운성 이름은 한글 1~3자로 못박습니다 — 뒤에 문장이 더 붙어도 통째로 삼키지 않게(양→Sheep 오역의 원인이었음)
    [/^일주는 (.+?)\((.+?)\)이고 십이운성으로는 ([가-힣]{1,3})입니다\.(?:\s+(.+))?$/, (m, tr) =>
      `Your day pillar is ${ilju2en(m[1])} (${m[2]}), and in the twelve life stages it sits at ${UNSEONG_EN[m[3]] || tr(m[3])}.` + (m[4] ? ' ' + tr(m[4]) : '')],
    [/^들으면 기운이 나는 말은 ["“](.+?)["”] 같은 표현입니다\.$/, (m, tr) => `Words that put strength in you sound like "${tr(m[1])}".`],
    [/^(.+?)\((.+?)\)[이가] 일간인 당신의 천을귀인 글자는 (.+?)\((.+?)\)[와과] (.+?)\((.+?)\)입니다\.$/, (m) => `With ${DICT[m[1]] || m[1]} (${m[2]}) as your day master, your Cheoneul benefactor signs are ${BRANCH_EN[m[3]] || m[3]} (${m[4]}) and ${BRANCH_EN[m[5]] || m[5]} (${m[6]}).`],
    [/^([A-Z]{4}) — (.+?) \(다시 누르면 (?:선택|optional) ?해제\)$/, (m, tr) => `${m[1]} — ${tr(m[2])} (tap again to unselect)`],
    [/^같은 (.+?)들이 스스로 하는 말$/, (m, tr) => `What fellow ${m[1]}s say about themselves`],
    [/^그중 힘이 센 자리에 앉은 (.+?)[을를] 먼저 봅니다\.$/, (m, tr) => `Among them, ${tr(m[1])} sits in the seat of power, so we read it first.`],
    [/^(.+?)[이가] 나란히 가장 많습니다\.$/, (m, tr) => `${tr(m[1])} tie for your most abundant energy.`],
    [/^사주 여덟 글자를 MBTI 인지기능으로 옮겨보면 (.+?)[이가] 가장 세고 그다음이 (.+?)입니다\.$/, (m, tr) => `Mapped onto MBTI cognitive functions, your eight characters run strongest in ${tr(m[1])}, followed by ${tr(m[2])}.`],
    [/^이 배열에 가장 가까운 유형은 (.+?)입니다\. 그다음은 (.+?)입니다\.$/, (m, tr) => `The type closest to this arrangement is ${tr(m[1])}. Next comes ${m[2]}.`],
    [/^이 배열에 가장 가까운 유형은 (.+?)입니다\.$/, (m, tr) => `The type closest to this arrangement is ${tr(m[1])}.`],
    [/^그다음은 (.+?)입니다\.$/, (m, tr) => `Next comes ${tr(m[1])}.`],
    [/^([A-Z]{4}) — (.+)$/, (m, tr) => { const b = tr(m[2]); return b !== m[2] ? `${m[1]} — ${b}` : null; }],
    [/^([자축인묘진사오미신유술해])·([자축인묘진사오미신유술해])$/, (m) => `${BRANCH_EN[m[1]]}·${BRANCH_EN[m[2]]}`],
    [/^(.+?)띠 해 · (.+?)띠 해의 글자$/, (m) => `the signs of the ${ZODIAC_EN[m[1]] || m[1]} and ${ZODIAC_EN[m[2]] || m[2]} years`],
    [/^(.+?)[이가] 만드는 반복$/, (m, tr) => `The loop your ${tr(m[1])} creates`],
    [/^(\d{4})년은 (.+?)입니다\. (.+)$/, (m, tr) => `${m[1]} is ${m[2]}. ${tr(m[3])}`],
    [/^천간과 지지가 모두 (.+?)(?:이라|라) (.+)$/, (m, tr) => `Both its stem and branch are ${m[1]}, so ${tr(m[2])}`],
    [/^(.+?)[이가] 일간이니 당신은 (.+?) 기운입니다\. (.+)$/, (m, tr) => `With ${m[1]} as your day master, you are ${m[2]} energy. ${tr(m[3])}`],
    [/^이 관계를 명리에서는 (.+?)(?:이라|라) 부릅니다\. (.+)$/, (m, tr) => `In saju terms, this relation is called ${m[1]}. ${tr(m[2])}`],
    [/^([가-힣A-Za-z ]{1,12})[이가] 앞서는 사람이라, 위에서 본 그 반복이 이 흐름을 만나면 유난히 자주 나옵니다\.$/, (m, tr) => `With ${tr(m[1])} leading in you, the loop above shows up especially often in this current.`],
    [/^([가-힣A-Za-z ]{1,12})[이가] 앞서는 사람이라 (.+)$/, (m, tr) => `With ${tr(m[1])} leading in you, ${tr(m[2])}`],
    [new RegExp(`^([A-Z][a-z])\\((.+?)\\)[가이] 가장 강합니다\\. (.+?) 그다음은 ([A-Z][a-z])\\((.+?)\\)입니다\\.$`), (m, tr) => `${m[1]} (${tr(m[2])}) is your strongest. ${tr(m[3])} Next comes ${m[4]} (${tr(m[5])}).`],
    // 양쪽이 다 사전에 있으면 " · " 짝은 그대로 잇습니다 (예: "양 · 길러지는 자리")
    // 왼쪽이 십이운성 한 글자면 띠 동물이 아니라 십이운성으로 읽습니다
    [/^(.+?) · (.+)$/, (m, tr) => {
      const b = tr(m[2]);
      const a = (UNSEONG_EN[m[1]] !== undefined && b !== m[2]) ? UNSEONG_EN[m[1]] : tr(m[1]);
      return (a !== m[1] || b !== m[2]) ? `${a} · ${b}` : null;
    }],
  ];

  // ===== 자미두수 조립 규칙 (2026-08-31) =====
  RULES.push(
    // '오행국 — 토오국'
    [/^오행국 — (.+국)$/, (m, tr) => `Bureau — ${tr(m[1])}`],
    // '을묘년에 태어난 사람은 이 네 별이 특별해집니다.'
    [/^(.{2})년에 태어난 사람은 이 네 별이 특별해집니다\.$/, (m, tr) =>
      `Born in a ${tr(m[1])} year, these four stars become special for you.`],
    // '수이국이라 8세부터 시작하고, 순행으로 돕니다.'
    [/^(.+국)이라 (\d+)세부터 시작하고, (순행|역행)으로 돕니다\.$/, (m, tr) =>
      `${tr(m[1])}, so it starts at age ${m[2]} and runs ${m[3] === '순행' ? 'forward' : 'backward'}.`],
    // '화록(化祿) · 천기'
    [/^(화록\(化祿\)|화권\(化權\)|화과\(化科\)|화기\(化忌\)) · (.+)$/, (m, tr) =>
      `${tr(m[1])} · ${tr(m[2])}`],
    // '武曲 무곡' 처럼 한자와 한글을 붙여 쓴 제목
    [/^([\u4e00-\u9fff]{2}) ([가-힣]{2})$/, (m, tr) => {
      const en = tr(m[2]);
      return en !== m[2] ? `${en} ${m[1]}` : null;
    }],
    // 복사본 '- 음력 1990.1.1 · 경오년 · 토오국'
    [/^음력 ([\d.]+) · (.{2})년 · (.+국)$/, (m, tr) =>
      `Lunar ${m[1]} · ${tr(m[2])} year · ${tr(m[3])}`],
    // 복사본 '- 명궁 무인 : 무곡 천상'
    [/^명궁 ([가-힣]{2}) : (.+)$/, (m, tr) => `Life palace ${tr(m[1])} : ${tr(m[2])}`],
    // 복사본 '- 재백궁 염정 : 문장'
    [/^(.+궁) ([가-힣]{2}) : (.+)$/, (m, tr) => `${tr(m[1])} ${tr(m[2])} : ${tr(m[3])}`],

    // ── 2026-08-31 2차분 (토정비결 · 세운 · 자미두수 궁합) ──
    // '토정비결 — 2026년'
    [/^토정비결 — (\d{4})년$/, (m) => `Tojeong Bigyeol — ${m[1]}`],
    // '병오년 · 52세'
    [/^([가-힣]{2})년 · (\d+)세$/, (m, tr) => `${tr(m[1])} year · age ${m[2]}`],
    // '2026년 세운 — 채우는 해'
    [/^(\d{4})년 세운 — (.+)$/, (m, tr) => `${m[1]} year fortune — ${tr(m[2])}`],
    // '사화 — 을묘년생'
    [/^사화 — ([가-힣]{2})년생$/, (m, tr) => `Four transformations — born in a ${tr(m[1])} year`],
    // 간지 두 글자 (을유 · 병오 …) — 낱말 청소는 두 글자 묶음을 사전에서만 찾는다
    [/^([갑을병정무기경신임계])([자축인묘진사오미신유술해])$/, (m) => {
      const S = {갑:'Gap',을:'Eul',병:'Byeong',정:'Jeong',무:'Mu',기:'Gi',경:'Gyeong',신:'Sin',임:'Im',계:'Gye'};
      const B = {자:'Ja',축:'Chuk',인:'In',묘:'Myo',진:'Jin',사:'Sa',오:'O',미:'Mi',신:'Sin',유:'Yu',술:'Sul',해:'Hae'};
      return `${S[m[1]]}-${B[m[2]]}`;
    }],
    // '천기 화록(化祿)'
    [/^([가-힣]{2}) (화[록권과기]\([^)]+\))$/, (m, tr) => `${tr(m[1])} ${tr(m[2])}`],
    // '나 부처궁'  (사화가 떨어진 상대의 궁)
    [/^(.+) ([가-힣]{1,3}궁)$/, (m, tr) => {
      const a = tr(m[1]), b = tr(m[2]);
      return (b !== m[2]) ? `${a} · ${b}` : null;
    }],
    // '가가 주는 것'  (이름 + 가 주는 것)
    [/^(.+?)(?:가|이) 주는 것$/, (m, tr) => `What ${tr(m[1])} gives`],
    // '염정 파군 — 자부염무상(紫府廉武相)'
    [/^([가-힣 ]+) — (.+)$/, (m, tr) => {
      const a = tr(m[1]), b = tr(m[2]);
      return (a !== m[1] || b !== m[2]) ? `${a} — ${b}` : null;
    }]
  );
  // ===== 자미두수 조립 규칙 끝 =====
  // ── 복사본 전용 조립 규칙 (2026-08-19 전수조사 후 추가) ──
  // 복사 텍스트는 '제목 : 본문' / '천간의 합 — 문장' / 'Name(꼬리표) : 문장' 꼴로 조립되어
  // 화면과 다른 열쇠가 됩니다. 양쪽을 따로 번역해 다시 잇습니다.
  RULES.push(
    [/^\[?(.+?)의 행동 패턴 분석\]$/, (m, tr) => {
      const who = m[1] === '나' ? 'My' : (m[1].replace(/님$/, '') + "'s");
      return `[${who} behavior pattern analysis]`;
    }],
    [/^천간의 합 — (.+)$/, (m, tr) => `Union of heavenly stems — ${tr(m[1])}`],
    [/^타고난 기질은 (.+)$/, (m, tr) => `Your inborn temperament is ${tr(m[1])}`],
    [/^(.{2,40}?) : (.+)$/, (m, tr) => {
      const a = tr(m[1]), b = tr(m[2]);
      return (a !== m[1] || b !== m[2]) ? `${a} : ${b}` : null;
    }],
    [/^(.+?\((?:合|沖)\)) — (.+)$/, (m, tr) => {
      const a = tr(m[1]), b = tr(m[2]);
      return (a !== m[1] || b !== m[2]) ? `${a} — ${b}` : null;
    }],
    // 신살 복사줄의 '이름(꼬리표)' — 꼬리표가 여러 낱말이라 낱말 청소로는 못 잡습니다
    [/^(.+?)\(([가-힣][가-힣 ·]{2,20})\)$/, (m, tr) => {
      const head = tr(m[1]), inner = tr(m[2]);
      return (head !== m[1] || inner !== m[2]) ? `${head}(${inner})` : null;
    }],
    // 마지막 안전망: 'A — B' 조립줄은 양쪽을 따로 번역 (둘 다 그대로면 손대지 않음)
    [/^(.+?) — (.+)$/, (m, tr) => {
      const a = tr(m[1]), b = tr(m[2]);
      return (a !== m[1] || b !== m[2]) ? `${a} — ${b}` : null;
    }]
  );

  // 해설 본문 사전 — 분량이 커서 i18n_content.js에 따로 담습니다 (없으면 빈 사전)
  function lookup(key) {
    if (DICT[key] !== undefined) return DICT[key];
    const extra = window.SAJU_EN_CONTENT;
    if (extra) {
      if (extra[key] !== undefined) return extra[key];
      // 사전 열쇠 끝에 공백이 붙은 채 저장된 항목 구제 (원문 이어붙이기의 흔적)
      if (extra[key + ' '] !== undefined) return extra[key + ' '].trim();
    }
    return undefined;
  }
  // 남은 한국어 낱말을 사전으로 하나씩 바꿉니다 (조사가 붙어 있으면 떼고 다시 찾습니다)
  function wordSweep(s) {
    return s.replace(/[가-힣]+/g, (run) => {
      if (run.length < 2) return run;   // 한 글자는 조사·어미와 헷갈려 건드리지 않습니다
      let hit = lookup(run);
      if (hit === undefined && UNSEONG_EN[run] !== undefined) hit = UNSEONG_EN[run];
      if (hit === undefined) {
        const bare = run.replace(/(은|는|이|가|을|를|과|와|의|에|로|도)$/, '');
        if (bare !== run && bare.length >= 2) hit = lookup(bare);
      }
      return hit !== undefined ? hit : run;
    });
  }
  // 영어 낱말 뒤에 붙어 남은 조사를 지웁니다
  function tidy(s) {
    return s.replace(/([)\]A-Za-z一-鿿])(은|는|이|가|을|를|과|와|의|에|로)(?=[\s,.·]|$)/g, '$1');
  }
  // 줄 하나를 번역합니다. 차례: 사전 → 껍데기 벗기기 → 규칙 → 원자 치환+접합 규칙 → 문장 쪼개기
  function trLine(line, depth) {
    depth = depth || 0;
    if (depth > 4) return line;
    const tr = (s) => trLine(String(s), depth + 1);
    const t = line.trim();
    if (!t) return line;
    const hit = lookup(t);
    if (hit !== undefined) return line.replace(t, hit);
    // "~입니다." 꼬리 — 사전에는 명사구로만 담긴 것들이 있습니다
    if (t.endsWith('입니다.')) {
      const baseHit = lookup(t.slice(0, -4));
      if (baseHit !== undefined) return line.replace(t, /[.!?]$/.test(baseHit) ? baseHit : baseHit + '.');
    }
    // 따옴표·글머리표에 싸인 문장 — 속을 찾고 껍데기를 도로 씌웁니다
    const deco = t.match(/^(["“·•■\-—–]\s*)(.+?)(["”]?)$/);
    if (deco && deco[2] !== t) {
      const inner = trLine(deco[2].trim(), depth + 1);
      if (inner !== deco[2].trim()) return line.replace(t, deco[1] + inner + deco[3]);
    }
    for (const [re, fn] of RULES) {
      const m = t.match(re);
      if (m) {
        const out = fn(m, tr);
        if (out != null) return line.replace(t, out);
      }
    }
    // 원자 치환 후 접합 규칙
    const sub = atomSub(t);
    for (const [re, fn] of GLUE) {
      const m = sub.match(re);
      if (m) {
        let out = fn(m, tr);
        if (out != null) {
          if (/[가-힣]/.test(out)) out = tidy(wordSweep(out));
          return line.replace(t, out);
        }
      }
    }
    // 문장 단위로 쪼개어 번역합니다.
    // 사전 열쇠가 두세 문장짜리일 수 있어, 인접 문장을 묶어서 긴 것부터 찾습니다.
    if (depth < 3) {
      const parts = t.split(/(?<=[다요]\.)\s+/);
      if (parts.length > 1) {
        const out = [];
        let changed = false;
        let i = 0;
        while (i < parts.length) {
          let matched = false;
          for (let j = Math.min(parts.length - 1, i + 3); j > i; j--) {
            const joined = parts.slice(i, j + 1).join(' ');
            const jh = lookup(joined) !== undefined ? lookup(joined) : lookup(joined.replace(/입니다\.$/, ''));
            if (jh !== undefined) {
              out.push(/[.!?]$/.test(jh) ? jh : jh + '.');
              i = j + 1;
              matched = true;
              changed = true;
              break;
            }
          }
          if (matched) continue;
          const q = trLine(parts[i], depth + 1);
          if (q !== parts[i]) changed = true;
          out.push(q);
          i++;
        }
        if (changed) return line.replace(t, out.join(' '));
      }
    }
    // 마지막 수단: 원자 치환과 낱말 청소라도 해서 보여줍니다
    const swept = tidy(wordSweep(sub));
    if (swept !== t) return line.replace(t, swept);
    return line;
  }
  function T(s) {
    if (window.SAJU_LANG !== 'en' || typeof s !== 'string' || !/[가-힣]/.test(s)) return s;
    // '(巳·뱀)' 꼴의 한 글자 띠 동물 — 낱말 청소는 한 글자를 안 건드리므로 여기서 먼저 바꾼다
    s = s.replace(/·(쥐|소|호랑이|토끼|용|뱀|말|양|원숭이|닭|개|돼지)\)/g, (mm, a) => '·' + (ZODIAC_EN[a] || a) + ')');
    const whole = lookup(s) !== undefined ? lookup(s) : lookup(s.trim());
    if (whole !== undefined) return whole;
    return s.split('\n').map((l) => trLine(l, 0)).join('\n');
  }
  window.SAJU_T = T;

  // ----- 언어 전환 단추 (두 언어 모두에 답니다) -----
  function addLangButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = (lang === 'en') ? '한국어' : 'English';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:60;padding:7px 14px;' +
      'border-radius:999px;border:1px solid rgba(217,179,106,.55);background:rgba(20,16,12,.72);' +
      'color:#D9B36A;font-size:12px;font-weight:700;cursor:pointer;backdrop-filter:blur(3px)';
    btn.addEventListener('click', () => {
      const next = lang === 'en' ? 'ko' : 'en';
      try { localStorage.setItem('saju_lang', next); } catch (e) {}
      // 주소에 ?lang=이 붙어 있으면 저장값보다 우선하므로, 주소도 같이 바꿔야 한다
      const url = new URL(location.href);
      url.searchParams.set('lang', next);
      location.replace(url.toString());
    });
    document.body.appendChild(btn);
  }

  if (lang !== 'en') {
    addEventListener('DOMContentLoaded', addLangButton);
    return;
  }

  // ----- 영어 모드: 화면 자동 번역 -----
  function trNode(node) {
    if (node.nodeType === 3) {
      const t = T(node.nodeValue);
      if (t !== node.nodeValue) node.nodeValue = t;
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.placeholder && /[가-힣]/.test(node.placeholder)) node.placeholder = T(node.placeholder);
    for (const c of node.childNodes) trNode(c);
  }
  addEventListener('DOMContentLoaded', () => {
    document.title = 'MBTI Saju — Oreum Games';
    document.documentElement.lang = 'en';   // 영어일 때만 바꾼다 — CSS 에서 html[lang=en] 으로 갈라 쓴다
    // 마크업으로 쪼개진 안내문은 통째로 갈아끼웁니다
    // (히어로 문구는 2026-08-13 개편 후 줄 단위 사전으로 처리되므로 여기서 다루지 않습니다)
    const mbtiHint = document.querySelector('#mbtiGrid') &&
      document.querySelector('#mbtiGrid').previousElementSibling;
    if (mbtiHint && mbtiHint.classList.contains('hint')) {
      mbtiHint.innerHTML = '<b style="color:var(--gold)">Leave it empty and we will estimate your MBTI from your saju.</b><br>Already know yours? Pick it, and we will show how closely the saju estimate matches.';
    }
    trNode(document.body);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'characterData') trNode(m.target);
        if (m.addedNodes) for (const n of m.addedNodes) trNode(n);
      }
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
    addLangButton();
  });
})();
