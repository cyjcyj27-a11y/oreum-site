// ?lang=en 이면 영어, ?lang=zh 이면 중국어로 화면 글자를 바꾼다 (사전 + MutationObserver)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = Q === 'en' || Q === 'zh' ? Q : 'ko';
  const EN = LG !== 'ko';
  window.LANG = LG;
  const ZH = {
    '다 치울까요?': '全部清掉吗？',
    '이어하기': '继续游戏',
    '성냥': '火柴',
    '놓기': '放下',
    '높이': '高度',
    '취소': '取消',
    '확인': '确定',
    '홈': '主页',
    '제출': '提交',
    '전부': '全部',
    '치우기': '清掉',
    '심사 중': '评审中',
    '예술성': '艺术感',
    '창의성': '创意',
    '계속': '继续',
    '점': '分',
    '클릭 집기 · 끌기 시점 · 휠 확대 · 스페이스 성냥': '点击 拿起 · 拖动 视角 · 滚轮 缩放 · 空格 火柴',
    '마우스 휠 방향 돌리기 · R 90도 · 클릭 놓기 · 우클릭 넣기': '滚轮 旋转 · R 转90度 · 点击 放下 · 右键 放回',
  };
  const D = LG === 'zh' ? ZH : {
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
  document.documentElement.lang = LG === 'zh' ? 'zh-CN' : 'en';
  if (LG === 'zh') {
    // 게임 글꼴엔 한자가 없다: 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Title', 'Ria'].map((f) => "@font-face{font-family:'" + f + "';src:" + zf + ';unicode-range:' + ur + '}').join('') +
      'html[lang=zh-CN] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
    const fix = (n) => {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { const v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (const c of n.childNodes) fix(c);
    }
  };
  const start = () => {
    document.title = LG === 'zh' ? '火柴塔' : 'MATCHTOWER';
    // 간판 글자는 한 글자씩 색이 달라 사전으로 못 바꾼다 — 통째로 (사장님 지정 영문 이름 MATCHTOWER)
    const lg = document.getElementById('logo');
    if (lg) lg.innerHTML = LG === 'zh' ? '<span class="b">火</span><span class="b">柴</span><span class="r">塔</span>'
      : '<span class="b">MATCH</span><span class="r">TOWER</span>';
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
