// 영문판(?lang=en): 100문제(js/en/e*.js 가 NR.E 에 넣음)와 화면 글자를 영어로 덮어쓴다. 한국어판에선 아무것도 안 함
(function () {
  if (new URLSearchParams(location.search).get('lang') !== 'en') return;
  NR.EN = true;
  NR.D = {
    '참·거짓 판단': 'Must Be True', '거짓말쟁이 찾기': 'Liar Puzzle', '줄 세우기': 'Ordering', '낱말 관계': 'Word Relations', '논증 따지기': 'Arguments',
    '정답': 'Correct', '오답': 'Wrong', '결과': 'Result', '다음': 'Next', '마을 보기': 'See the Town', '다음 마을': 'Next Town',
    '재도전': 'TRY AGAIN', '처음부터': 'START OVER', '처음부터 다시 할까요?': 'Start over from the beginning?', '취소': 'Cancel',
    '논리의 왕': 'Logic Master', '명탐정': 'Master Detective', '수석 탐정': 'Head Detective', '탐정': 'Detective', '견습 탐정': 'Junior Detective',
    '마을에 불이 모두 켜졌습니다': 'Every light in town is on', '결과 카드': 'Result Card', '언어논리퀴즈': 'LOGIC QUIZ',
    '맞힌 문제': 'Correct', '걸린 시간': 'Time', '최고 연속 정답': 'Best streak', '다시 도전': 'Retries',
    '저장': 'SAVE', '공유': 'SHARE', '주소를 복사했습니다': 'Link copied', '이어하기': 'CONTINUE', '새로 시작': 'NEW GAME', '시작': 'START'
  };
  (NR.E || []).forEach((e, n) => {
    const p = NR.P[n]; if (!p || !e) return;
    p.name = e.name; p.done = e.done;
    e.qs.forEach((x, i) => { const q = p.qs[i]; if (!q || !x) return; q.q = x.q; q.a = x.a.slice(); q.x = x.x; });
  });
  const $ = id => document.getElementById(id);
  document.documentElement.lang = 'en'; document.title = 'LOGIC QUIZ';
  $('logo').textContent = 'LOGIC QUIZ';
  $('tBgm').setAttribute('aria-label', 'Music'); $('tSfx').setAttribute('aria-label', 'Sound');
  $('bNext').textContent = 'Next';
  const hc = document.querySelectorAll('#how .hc > div:last-child');
  hc[0].innerHTML = 'Read the puzzle and pick one of the four answers.<br>There is no time limit.';
  hc[1].innerHTML = 'Each right answer raises a house or a person in the shadow town.';
  hc[2].innerHTML = 'Get 8 of 10 right to raise a landmark.<br>Build all ten to finish!';
  $('card').alt = 'Result card';
  const css = document.createElement('style');
  css.textContent = '#logo{letter-spacing:6px}#qtext{word-break:normal;overflow-wrap:break-word}.opt{word-break:normal;overflow-wrap:break-word}#exp{word-break:normal}';
  document.head.appendChild(css);
})();
