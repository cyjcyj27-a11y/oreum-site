// 5억년 버튼 — 숫자·글 데이터 (file:// 에서도 읽히게 평범한 script)
(function () {
  'use strict';
  const LANG = (function () {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      // 언어는 주소로만 정한다(?lang=en 일 때만 영어). 기억해 두면 한국어 페이지에서 들어와도 영어로 뜬다(9/29 사장님 폰)
      try { localStorage.removeItem('button5.lang'); } catch (e) {}
      return q === 'en' ? 'en' : 'ko';
    } catch (e) { return 'ko'; }
  })();
  const T = (ko, en) => (LANG === 'en' ? en : ko);

  const YEARS_PER_TRIP = 5e8;          // 한 번 누를 때마다 5억 년
  const UNIVERSE = 1.38e10;            // 우주의 나이 138억 년

  // 버튼이 내미는 돈 — 누를수록 커진다(28번째가 500억)
  const OFFERS = [1e6, 2e6, 3e6, 5e6, 7e6, 1e7, 1.5e7, 2e7, 3e7, 5e7, 7e7, 1e8, 1.5e8, 2e8,
    3e8, 5e8, 7e8, 1e9, 1.5e9, 2e9, 3e9, 5e9, 7e9, 1e10, 1.5e10, 2e10, 3e10, 5e10];
  function offer(n) { // n = 이번이 몇 번째 누름(0부터)
    if (n < OFFERS.length) return OFFERS[n];
    return Math.round(OFFERS[OFFERS.length - 1] * Math.pow(1.5, n - OFFERS.length + 1) / 1e9) * 1e9;
  }

  // 5억 년 안에서 하는 일. res = 쌓이는 것, cost = 쓰는 것. 시간은 몰입(focus)으로 흐른다
  const ACTS = [
    { id: 'scratch', key: '1', name: T('긁기', 'SCRATCH'), res: 'line', gain: 1,
      up: { res: 'line', base: 15 }, unlock: s => true },
    { id: 'count', key: '2', name: T('세기', 'COUNT'), res: 'num', gain: 1,
      up: { res: 'num', base: 20 }, unlock: s => s.ever.line >= 15 },
    { id: 'dig', key: '3', name: T('파기', 'DIG'), res: 'stone', gain: 0.34,
      up: { res: 'stone', base: 4 }, unlock: s => s.ever.line >= 50 },
    { id: 'stack', key: '4', name: T('쌓기', 'STACK'), res: 'tower', gain: 1, cost: { res: 'stone', n: 1 },
      up: { res: 'stone', base: 6 }, unlock: s => s.ever.stone >= 3 },
    { id: 'walk', key: '5', name: T('걷기', 'WALK'), res: 'km', gain: 1,
      up: { res: 'num', base: 40 }, unlock: s => s.presses >= 1 },
    { id: 'talk', key: '6', name: T('혼잣말', 'MUTTER'), res: 'word', gain: 1,
      up: { res: 'line', base: 40 }, unlock: s => s.found >= 1 },
    { id: 'carve', key: '7', name: T('조각', 'CARVE'), res: 'statue', gain: 0.2, cost: { res: 'stone', n: 1 },
      up: { res: 'stone', base: 10 }, unlock: s => s.ever.tower >= 12 }
  ];
  const RES_NAME = {
    line: T('선', 'lines'), num: T('수', 'count'), stone: T('돌', 'stones'), tower: T('층', 'floors'),
    km: 'km', word: T('낱말', 'words'), statue: T('조각상', 'statues')
  };
  const MAX_LV = 12;
  function upCost(act, lv) { return Math.ceil(act.up.base * Math.pow(1.75, lv - 1)); }
  function lvGain(lv) { return 1 + 0.25 * (lv - 1); }
  function lvAuto(lv) { return lv >= 2 ? 0.2 * (lv - 1) : 0; }   // 1초에 저절로 몇 번

  // 질림: 같은 일만 하면 덜 쌓이고 몰입도 덜 된다
  const BORE_UP = 0.07, BORE_DOWN = 0.1, BORE_CUT = 0.75;
  // 몰입: 1 이면 5억 년이 TRIP_SEC 초. 손 놓으면 F_MIN 까지 떨어져 시간이 거의 안 간다
  const TRIP_SEC = 120, F_TAP = 0.09, F_AUTO = 0.03, F_DECAY = 0.3, F_MIN = 0.04;

  // 상점 — 산 물건은 방에 놓이고, 기억(mem)은 5억 년 안에서 떠올릴 수 있다
  const SHOP = [
    { id: 'chicken', name: T('치킨', 'FRIED CHICKEN'), price: 2e4, mem: T('치킨', 'WINGS') },
    { id: 'dog', name: T('강아지', 'PUPPY'), price: 8e5, mem: T('강아지', 'PUPPY') },
    { id: 'oneroom', name: T('원룸', 'STUDIO'), price: 2.5e6, house: 1 },
    { id: 'car', name: T('중고차', 'USED CAR'), price: 8e6, mem: T('드라이브', 'DRIVE') },
    { id: 'trip', name: T('해외여행', 'TRIP ABROAD'), price: 2e7, mem: T('바다', 'SEA') },
    { id: 'officetel', name: T('오피스텔', 'CITY FLAT'), price: 6e7, house: 2 },
    { id: 'watch', name: T('명품 시계', 'LUXURY WATCH'), price: 1.2e8, mem: T('초침', 'TICK') },
    { id: 'apt', name: T('아파트', 'APARTMENT'), price: 9e8, house: 3 },
    { id: 'sports', name: T('스포츠카', 'SPORTS CAR'), price: 2e9, mem: T('질주', 'SPEED') },
    { id: 'penthouse', name: T('펜트하우스', 'PENTHOUSE'), price: 8e9, house: 4 },
    { id: 'building', name: T('빌딩', 'TOWER BLOCK'), price: 3e10, house: 5 },
    { id: 'island', name: T('무인도', 'PRIVATE ISLAND'), price: 4e10, house: 6 }
  ];
  const MEM_COOL = 40;
  function houseMult(tier) { return 1 + 0.2 * tier; }

  // 먼저 온 사람이 바닥에 새겨 둔 글 12개. km = 그만큼 걸어야 보인다, words = 그만큼 말을 익혀야 읽힌다
  const MSGS = [
    { km: 5, words: 10, text: T('여기 누가 또 왔구나.', 'So someone else came.') },
    { km: 400, words: 450, text: T('나도 백만 원 때문에 눌렀다. 너도 그랬겠지.', 'I pressed it for the money too. So did you, I guess.') },
    { km: 1300, words: 1400, text: T('돌아가면 다 잊는다. 그래서 바닥에 새긴다.', 'You forget it all when you go back. So I carve it into the floor.') },
    { km: 2600, words: 2800, text: T('처음 천만 년은 울었다. 다음 천만 년은 웃었다.', 'I cried for the first ten million years. Then I laughed for ten million more.') },
    { km: 4300, words: 4600, text: T('바닥은 긁으면 파인다. 아주 천천히.', 'The floor gives if you scratch it. Very slowly.') },
    { km: 6300, words: 6800, text: T('숫자를 끝까지 세 보려 했다. 끝은 없었다.', 'I tried to count to the end. There was no end.') },
    { km: 8800, words: 9500, text: T('네가 쌓은 탑을 봤다. 잘 쌓았더라.', 'I saw the towers you built. Nicely done.') },
    { km: 11500, words: 12500, text: T('버튼 값은 누를수록 오른다. 그쪽은 우리가 계속 누르길 바란다.', 'The price goes up every press. They want us to keep pressing.') },
    { km: 14500, words: 15800, text: T('바깥 우주는 백삼십팔억 년 되었다고 들었다.', 'I heard the universe out there is 13.8 billion years old.') },
    { km: 18000, words: 19500, text: T('여기 쌓인 시간이 그보다 길어지면 무슨 일이 생길까.', 'What happens when the time piled up here gets longer than that?') },
    { km: 22000, words: 23500, text: T('나는 스물일곱 번 눌렀다. 한 번이 모자랐다.', 'I pressed it twenty-seven times. One short.') },
    { km: 27000, words: 28500, text: T('마지막은 네가 눌러 줘. 여기서 기다릴게.', 'Press the last one for me. I will wait here.') }
  ];

  function won(n) { // ₩ 표기 — 억·만 단위로 짧게
    if (LANG === 'en') {
      if (n >= 1e9) return '₩' + trim(n / 1e9) + 'B';
      if (n >= 1e6) return '₩' + trim(n / 1e6) + 'M';
      return '₩' + Math.floor(n).toLocaleString('en-US');
    }
    if (n >= 1e8) {
      const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4);
      return eok.toLocaleString('ko-KR') + '억' + (man ? ' ' + man.toLocaleString('ko-KR') + '만' : '') + '원';
    }
    if (n >= 1e4) return Math.floor(n / 1e4).toLocaleString('ko-KR') + '만원';
    return Math.floor(n).toLocaleString('ko-KR') + '원';
  }
  function trim(x) { return (Math.round(x * 10) / 10).toString(); }
  function yearsShort(y) { // 누적 표기: 32억 년
    if (LANG === 'en') return trim(y / 1e9) + 'B';
    const e = y / 1e8;
    return (e >= 100 ? Math.floor(e) : trim(e)) + '억 년';
  }
  function yearsFull(y) {
    return Math.floor(y).toLocaleString(LANG === 'en' ? 'en-US' : 'ko-KR') + (LANG === 'en' ? ' yrs' : '년');
  }
  function num(n) { return Math.floor(n).toLocaleString(LANG === 'en' ? 'en-US' : 'ko-KR'); }

  window.B5D = { LANG, T, YEARS_PER_TRIP, UNIVERSE, offer, ACTS, RES_NAME, MAX_LV, upCost, lvGain, lvAuto,
    BORE_UP, BORE_DOWN, BORE_CUT, TRIP_SEC, F_TAP, F_AUTO, F_DECAY, F_MIN, SHOP, MEM_COOL, houseMult, MSGS, won, yearsShort, yearsFull, num };
})();
