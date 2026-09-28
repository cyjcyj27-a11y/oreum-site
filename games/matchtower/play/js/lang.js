// ?lang=en 이면 화면 글자를 영어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
    '다 치울까요?': 'Clear the table?',
    '이어하기': 'CONTINUE',
    '성냥': 'MATCH',
    '놓기': 'DROP',
    '높이': 'HEIGHT',
    '취소': 'CANCEL',
    '확인': 'OK',
    '홈': 'HOME',
    '제출': 'SUBMIT',
    '전부': 'CLEAR',
    '치우기': 'ALL',
    '심사 중': 'JUDGING',
    '예술성': 'ART',
    '창의성': 'CREATIVITY',
    '계속': 'CONTINUE',
    '점': 'PTS',
    '클릭 집기 · 끌기 시점 · 휠 확대 · 스페이스 성냥': 'Click pick up · Drag view · Wheel zoom · Space match',
    '마우스 휠 방향 돌리기 · R 90도 · 클릭 놓기 · 우클릭 넣기': 'Mouse wheel rotate · R 90° · Click drop · Right-click put back',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
    const fix = (n) => {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { const v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (const c of n.childNodes) fix(c);
    }
  };
  const start = () => {
    document.title = 'MATCHTOWER';
    // 간판 글자는 한 글자씩 색이 달라 사전으로 못 바꾼다 — 통째로 (사장님 지정 영문 이름 MATCHTOWER)
    const lg = document.getElementById('logo');
    if (lg) lg.innerHTML = '<span class="b">MATCH</span><span class="r">TOWER</span>';
    fix(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
