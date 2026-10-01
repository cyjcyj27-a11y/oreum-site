// ?lang=en 일 때만 화면 글자를 영어로 바꾼다(사전 + MutationObserver). 캔버스 글자는 L() 로 감싼다.
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
    '야시장 사격게임': 'NIGHT MARKET SHOOTING GAME',
    '야시장 사격': 'NIGHT MARKET SHOOTING',
    '사격장': 'SHOOTING',
    '사격왕': 'CHAMPION',
    '경품 획득': 'PRIZE!',
    '상점': 'SHOP',
    '경품': 'PRIZES',
    '미션': 'MISSIONS',
    '홈': 'HOME',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '가로로 보기': 'ROTATE',
    '처음부터': 'NEW GAME',
    '모든 기록이 지워집니다': 'All progress will be erased',
    '취소': 'CANCEL',
    '확인': 'OK',
    '쏘기': 'FIRE',
    '탄 +1': 'AMMO +1',
    '코르크총': 'Cork Gun', '장총': 'Long Rifle', '쌍발총': 'Twin Gun', '3연발': 'Triple Burst', '산탄총': 'Shotgun', '공 대포': 'Ball Cannon',
    '대왕 곰': 'KING BEAR', '곰': 'Bear', '토끼': 'Bunny', '고양이': 'Kitty', '강아지': 'Puppy', '오리': 'Duckling', '펭귄': 'Penguin', '돼지': 'Piggy', '개구리': 'Froggy', '판다': 'Panda', '여우': 'Fox', '공룡': 'Dino',
    '첫 CLEAR': 'First CLEAR', '깡통 60개': '60 Cans', '병 20개 깨기': 'Break 20 Bottles', '오리 30마리': '30 Ducks', '풍선 30개': '30 Balloons',
    '한 발에 3개': '3 in One Shot', '한 발에 6개': '6 in One Shot', '폭죽 5번': '5 Fireworks', '별 30개': '30 Stars', '별 72개': '72 Stars', '총 3자루': 'Own 3 Guns', '경품 11개': '11 Prizes',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[+]/g, '[+]')).join('|'), 'g');
  window.L = (s) => (EN && s ? String(s).replace(re, (m) => D[m]) : s);
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'Night Market Shooting Game';
  const fix = (n) => { if (n.nodeType === 3) { const v = n.nodeValue, w = window.L(v); if (w !== v) n.nodeValue = w; } else if (n.nodeType === 1) n.childNodes.forEach(fix); };
  const start = () => { fix(document.body); new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(fix); if (m.type === 'characterData') fix(m.target); })).observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
