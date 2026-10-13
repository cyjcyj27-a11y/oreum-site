// 영문판: 주소에 ?lang=en 이 있을 때만 화면 글자를 영어로 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const EN = new URLSearchParams(location.search).get('lang') === 'en';
  window.LANG = EN ? 'en' : 'ko';
  if (!EN) return;
  const D = {
    '인형뽑기게임': 'TOY CRANE', '돈안드니까 실컷 뽑아보세요 ㅋㅋㅋ': "It's free, so grab all you want lol",
    '뽑은 인형': 'WON', '남은 인형': 'DOLLS', '도감': 'BOOK', '왼쪽': 'LEFT', '오른쪽': 'RIGHT', '앞': 'FRONT', '확대': 'ZOOM', '닫기': 'CLOSE',
    '이 게임은 무료로 뽑기가 가능합니다': 'Every try in this claw machine is free',
    '조이스틱이나 방향키로 집게를 옮겨요': 'Move the claw with the joystick or arrow keys',
    '화면을 끌면 기계가 돌아가요': 'Drag the screen to look around the machine',
    'DROP 을 누르면 집게가 내려가서 인형을 집어요': 'Press DROP and the claw goes down to grab a toy',
    'TIME 이 끝나면 저절로 내려가요': 'It drops by itself when TIME runs out',
    '구멍에 떨어지면 GET!': 'Drop it in the hole for a GET!',
    '뽑은 인형은 도감에 모이고 다 뽑으면 새로 채워져요': 'Toys you win go in the BOOK, and the machine refills when it is empty',
    '인형 100개 → 대왕 곰돌이': '100 toys → GIANT TEDDY', '대왕 곰돌이': 'GIANT TEDDY', '교환': 'TRADE', '가진 대왕 곰돌이': 'GIANT TEDDY owned', '곰': 'Bear', '토끼': 'Rabbit', '고양이': 'Cat', '강아지': 'Puppy', '오리': 'Duck', '펭귄': 'Penguin', '돼지': 'Pig', '개구리': 'Frog', '판다': 'Panda', '여우': 'Fox', '공룡': 'Dino',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\$&');
  const RE = new RegExp(keys.map(esc).join('|'), 'g');
  const tr = (s) => (/[가-힣ㄱ-ㅣ]/.test(s) ? s.replace(RE, (m) => D[m]) : s);
  window.L = tr;
  function walk(n) {
    if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const c of n.childNodes) walk(c);
  }
  document.documentElement.lang = 'en';
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'TOY CRANE';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
