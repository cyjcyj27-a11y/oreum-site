// 영문판: 주소에 ?lang=en 이 있을 때만 화면 글자를 영어로 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const EN = new URLSearchParams(location.search).get('lang') === 'en';
  window.LANG = EN ? 'en' : 'ko';
  if (!EN) return;
  const D = {
    '포켓볼': 'POCKET BALL', '포켓': 'POCKET ', '볼': 'BALL', '플레이': 'PLAY', '레슨': 'LESSON', '홈': 'HOME', '나': 'YOU', '상대': 'RIVAL',
    '선승': 'RACE TO',
    '동네 형': 'Guy Next Door', '알바생 지수': 'Jisu the Part Timer', '동아리 회장': 'Club President', '퇴근한 김 과장': 'Mr. Kim After Work',
    'PC방 사장님': 'PC Cafe Owner', '단골 할아버지': 'Regular Grandpa', '체대생 민호': 'Minho the Sports Major', '야간 동호회장': 'Night League Captain',
    '구청장배 우승자': 'District Cup Champ', '프로 지망생': 'Pro Hopeful', '은퇴한 프로': 'Retired Pro', '당구장 사장님': 'Pool Hall Owner',
    '당구장 사장님이 큐를 내려놓았다': 'The pool hall owner sets the cue down', '오늘부터 이 동네 1등은 나다': 'From today you are the best player in town',
    '당구대를 끌어 큐 방향을 정해요': 'Drag on the table to point the cue', '바퀴를 돌리면 조금씩 움직여요': 'Roll the wheel to aim a little at a time',
    '옆에 세운 큐 막대를 당겼다 놓으면 쳐요': 'Pull the cue bar at the side and let go to shoot', '많이 당길수록 세게 나가요': 'Pull further for a harder shot', '흰 공 단추를 누르면 회전을 줘요': 'Tap the white ball button to add spin', '당겨서 쳐요': 'PULL TO SHOOT', '끌어서 옮겨요': 'DRAG TO MOVE',
    '내 공(1~7 또는 9~15)을 다 넣고 8번을 넣으면 이겨요': 'Pocket all your balls (1 to 7 or 9 to 15), then the 8 ball to win',
    '흰 공이 빠지면 상대가 흰 공을 놓아요': 'If the cue ball drops, your rival places it anywhere',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp(keys.map(esc).join('|'), 'g');
  const tr = (s) => {
    if (!/[가-힣]/.test(s)) return s;
    s = s.replace(/(\d+)회차/g, 'RUN $1');
    return s.replace(RE, (m) => D[m]);
  };
  window.L = tr;
  function walk(n) {
    if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const c of n.childNodes) walk(c);
  }
  document.documentElement.lang = 'en';
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'POCKET BALL';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
