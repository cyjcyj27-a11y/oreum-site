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
  if (!lang) lang = ((navigator.language || 'ko').toLowerCase().indexOf('ko') === 0) ? 'ko' : 'en';
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
      `Your day pillar is ${m[1]} (${m[2]}), and in the twelve life stages it sits at ${UNSEONG_EN[m[3]] || tr(m[3])}.` + (m[4] ? ' ' + tr(m[4]) : '')],
    [/^들으면 기운이 나는 말은 ["“](.+?)["”] 같은 표현입니다\.$/, (m, tr) => `Words that put strength in you sound like "${tr(m[1])}".`],
    [/^(.+?)\((.+?)\)[이가] 일간인 당신의 천을귀인 글자는 (.+?)\((.+?)\)[와과] (.+?)\((.+?)\)입니다\.$/, (m) => `With ${m[1]} (${m[2]}) as your day master, your Cheoneul benefactor signs are ${m[3]} (${m[4]}) and ${m[5]} (${m[6]}).`],
    [/^([A-Z]{4}) — (.+?) \(다시 누르면 선택 해제\)$/, (m, tr) => `${m[1]} — ${tr(m[2])} (tap again to unselect)`],
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
