// 영문판(?lang=en): 화면 글자 사전 + 120문제 영어(js/en_*.js 가 HN.EN_EV 에 넣음)를 덮어쓴다. 한국어판에선 아무것도 안 함
(function () {
  if (new URLSearchParams(location.search).get('lang') !== 'en') return;
  const D = {
    '正史': 'TRUE', '갈림': 'SPLIT', '연속 ': 'Streak ', '갈라진 역사': 'History split:', '결과': 'Result', '다음': 'Next',
    '심화 1급': 'Advanced Lv.1', '심화 2급': 'Advanced Lv.2', '심화 3급': 'Advanced Lv.3', '불합격': 'Not passed',
    '점수': 'Score', '점': '', '맞힌 문항': 'Correct', '완성 기준': 'Pass mark', '번': '', '게임 속 급수': 'In-game grade',
    '칭호': 'Title', '사관의 눈': "Historian's Eye", '제 길의 족장': 'True-Path Chief', '아슬아슬한 족장': 'Close-Call Chief',
    '1막 끝 正史': 'Act 1 Complete', '한능검': 'KOREAN HISTORY QUIZ', '선사시대부터 대한민국까지': 'From Prehistory to the Republic of Korea',
    '1막 · 선사 · 고조선 · 여러 나라': 'Act 1 · Prehistory · Gojoseon · Early States'
  };
  HN.T = s => (s in D ? D[s] : s);
  const ST = {
    paleo: ['Paleolithic', '700,000 years ago'], neo: ['Neolithic', 'Around 8000 BC'], bronze: ['Bronze Age', 'Around 2000 BC'],
    joseon: ['Gojoseon', '2333 BC - 108 BC'], nations: ['Early States', '1st century BC'], goguryeo: ['Goguryeo', '37 BC - 668'],
    baekje: ['Baekje', '18 BC - 660'], silla: ['Silla · Gaya', '57 BC - 676'], nambuk: ['Silla & Balhae', '676 - 935'],
    goryeo1: ['Early Goryeo', '918 - 1170'], goryeo2: ['Late Goryeo', '1170 - 1392'], joseon1: ['Early Joseon', '1392 - 1637'],
    joseon2: ['Late Joseon', '1637 - 1863'], gaehang: ['Korean Empire', '1863 - 1910'], ilje: ['Japanese Rule', '1910 - 1945'],
    hyeondae: ['Modern Korea', '1945 - today']
  };
  for (const k in ST) if (HN.STAGES[k]) { HN.STAGES[k].name = ST[k][0]; HN.STAGES[k].year = ST[k][1]; }
  HN.NAT_NAME = { buyeo: 'Buyeo', goguryeo: 'Goguryeo', okjeo: 'Okjeo', dongye: 'Dongye', samhan: 'Samhan' };
  // 파트 구분은 한국어 STAGE_NATION 그대로 쓰고(저장값과 맞춤), 화면 이름만 영어로
  const NE = { '고조선': 'Gojoseon', '고구려': 'Goguryeo', '백제': 'Baekje', '신라': 'Silla', '남북국': 'the North-South States', '고려': 'Goryeo',
    '고려 후기': 'Late Goryeo', '조선': 'Joseon', '조선 후기': 'Late Joseon', '대한제국': 'the Korean Empire', '대한민국 임시 정부': 'the Provisional Government', '대한민국': 'the Republic of Korea' };
  HN.doneText = n => 'You built ' + (NE[n] || n) + '!';
  HN.failText = st => 'You did not build ' + (NE[HN.STAGE_NATION[st]] || 'the Republic of Korea');
  HN.FINAL = { name: "You built today's Republic of Korea", line: 'This country is yours' };
  HN.FAIL = { name: 'You did not build the Republic of Korea' };
  // 문제: [누구, 말, 물음, [보기 5개, 첫째가 정답], 갈림, 기록 제목, 기록]
  const fill = (arr, en) => { if (!arr || !en) return; arr.forEach((e, i) => { const x = en[i]; if (!x) return;
    e.who = x[0]; e.say = x[1]; e.q = x[2]; e.a = x[3]; e.alt = x[4]; e.fact = [x[5], x[6]]; }); };
  const E = HN.EN_EV || {};
  fill(HN.ACT1, E.act1); HN.PART_ORDER.forEach(k => fill(HN.MORE && HN.MORE[k], E[k]));
  // 화면(HTML) 글자
  const $ = id => document.getElementById(id);
  document.documentElement.lang = 'en'; document.title = 'Korean History Quiz';
  const tags = document.querySelectorAll('#topbar .tag'); tags[0].firstChild.nodeValue = 'Right '; tags[1].firstChild.nodeValue = 'Score ';
  $('bBgm').setAttribute('aria-label', 'Music'); $('bSfx').setAttribute('aria-label', 'Sound'); $('bBook').setAttribute('aria-label', 'Records');
  $('bNext').textContent = 'Next';
  document.querySelector('#after .fact .lb').textContent = "Historian's Record";
  $('logo').innerHTML = 'KOREAN HISTORY QUIZ<small>From Prehistory to the Republic of Korea</small>';
  const css = document.createElement('style');
  css.textContent = '@media (max-width:520px){.tag{font-size:13px;padding:0 8px 0 14px}.tag b{font-size:14px}}#logo{font-size:clamp(40px,8.4vw,112px);letter-spacing:3px;text-align:center;line-height:1.08;padding:0 12px}';
  document.head.appendChild(css);
  // 시대 이름이 길면 연도 글자를 칸에 맞게 줄인다(배치는 그대로)
  const fitYr = () => { const y = $('hYear'), h = $('head'); y.style.fontSize = ''; let f = 14;
    const room = () => y.scrollWidth <= y.clientWidth + 1; while (!room() && f > 11) { f -= 0.5; y.style.fontSize = f + 'px'; }
    if (!room()) { const e = $('hEra'); let g = 21; while (!room() && g > 16) { g -= 0.5; e.style.fontSize = g + 'px'; } }
    y.style.visibility = room() ? '' : 'hidden'; }; // 그래도 안 들어가면 연도는 숨김(시대 띠에 연도가 나옴)
  new MutationObserver(() => { $('hEra').style.fontSize = ''; fitYr(); }).observe($('hYear'), { childList: true, characterData: true, subtree: true });
  addEventListener('resize', fitYr);
  $('bCont').textContent = 'CONTINUE';
  document.querySelector('#title .notice').textContent = 'Not affiliated with the National Institute of Korean History or its Korean History Exam';
  const hc = document.querySelectorAll('#how .hc > div:last-child');
  hc[0].innerHTML = 'When an event comes, pick the <b>real history</b> from the choices.';
  hc[1].innerHTML = 'Get it right and history stays on course and the country grows. Answer to the end to build today\'s Korea.';
  hc[2].innerHTML = 'Each country ends with a score. Score 80 or more to build it. Below 80, try again.';
  $('cardimg').alt = 'Result card';
  $('bRetry').textContent = 'TRY AGAIN'; $('bSave').textContent = 'SAVE'; $('bShare').textContent = 'SHARE'; $('bNew').textContent = 'NEW GAME';
  $('bCele').textContent = 'Next';
  const bh = document.querySelector('#bookov h2'); bh.firstChild.nodeValue = "Historian's Records ";
})();
