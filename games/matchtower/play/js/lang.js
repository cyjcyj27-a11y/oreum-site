// ?lang=en 영어, zh 중국어, ja 일본어, pt 포르투갈어, ru 러시아어로 화면 글자를 바꾼다 (사전 + MutationObserver)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = ['en', 'zh', 'ja', 'pt', 'ru'].includes(Q) ? Q : 'ko';
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
  const JA = {
    '다 치울까요?': '全部片付ける？',
    '이어하기': 'つづきから',
    '성냥': 'マッチ',
    '놓기': '置く',
    '높이': '高さ',
    '취소': 'キャンセル',
    '확인': 'OK',
    '홈': 'ホーム',
    '제출': '提出',
    '전부': '全部',
    '치우기': '片付け',
    '심사 중': '審査中',
    '예술성': '芸術性',
    '창의성': '創造性',
    '계속': 'つづける',
    '점': '点',
    '클릭 집기 · 끌기 시점 · 휠 확대 · 스페이스 성냥': 'クリック つかむ · ドラッグ 視点 · ホイール ズーム · スペース マッチ',
    '마우스 휠 방향 돌리기 · R 90도 · 클릭 놓기 · 우클릭 넣기': 'ホイール 回転 · R 90度 · クリック 置く · 右クリック 戻す',
  };
  const PT = {
    '다 치울까요?': 'Limpar a mesa?',
    '이어하기': 'CONTINUAR',
    '성냥': 'FÓSFOROS',
    '놓기': 'SOLTAR',
    '높이': 'ALTURA',
    '취소': 'CANCELAR',
    '확인': 'OK',
    '홈': 'INÍCIO',
    '제출': 'ENVIAR',
    '전부': 'LIMPAR',
    '치우기': 'TUDO',
    '심사 중': 'JULGANDO',
    '예술성': 'Arte',
    '창의성': 'Criatividade',
    '계속': 'CONTINUAR',
    '점': 'pts',
    '클릭 집기 · 끌기 시점 · 휠 확대 · 스페이스 성냥': 'Clique pega · Arraste câmera · Roda zoom · Espaço fósforo',
    '마우스 휠 방향 돌리기 · R 90도 · 클릭 놓기 · 우클릭 넣기': 'Roda gira · R 90° · Clique solta · Botão direito devolve',
  };
  const RU = {
    '다 치울까요?': 'Очистить стол?',
    '이어하기': 'ПРОДОЛЖИТЬ',
    '성냥': 'СПИЧКИ',
    '놓기': 'СТАВЬ',
    '높이': 'ВЫСОТА',
    '취소': 'ОТМЕНА',
    '확인': 'OK',
    '홈': 'ДОМОЙ',
    '제출': 'СДАТЬ',
    '전부': 'УБРАТЬ',
    '치우기': 'ВСЁ',
    '심사 중': 'ОЦЕНИВАЕМ',
    '예술성': 'Искусство',
    '창의성': 'Креативность',
    '계속': 'ДАЛЕЕ',
    '점': 'очк.',
    '클릭 집기 · 끌기 시점 · 휠 확대 · 스페이스 성냥': 'Клик — взять · Тянуть — обзор · Колесо — зум · Пробел — спичка',
    '마우스 휠 방향 돌리기 · R 90도 · 클릭 놓기 · 우클릭 넣기': 'Колесо — поворот · R — 90° · Клик — положить · ПКМ — вернуть',
  };
  const D = LG === 'zh' ? ZH : LG === 'ja' ? JA : LG === 'pt' ? PT : LG === 'ru' ? RU : {
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
  document.documentElement.lang = LG === 'zh' ? 'zh-CN' : LG === 'ja' ? 'ja' : LG === 'pt' ? 'pt-BR' : LG === 'ru' ? 'ru' : 'en';
  if (LG === 'zh') {
    // 게임 글꼴엔 한자가 없다: 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Title', 'Ria'].map((f) => "@font-face{font-family:'" + f + "';src:" + zf + ';unicode-range:' + ur + '}').join('') +
      'html[lang=zh-CN] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
  if (LG === 'ja') {
    // 게임 글꼴엔 가나가 없다: 같은 이름에 일본어 기기 글꼴을 일본 글자 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Title', 'Ria'].map((f) => "@font-face{font-family:'" + f + "';src:" + jf + ';unicode-range:' + ur + '}').join('') +
      'html[lang=ja] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
  if (LG === 'pt' || LG === 'ru') {
    // 악센트 라틴·키릴 글자가 없는 글꼴에 기기 글꼴을 그 범위로만 덧붙인다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = ['Title', 'Ria'].map((f) => "@font-face{font-family:'" + f + "';src:" + lf + ';unicode-range:' + ur + '}').join('');
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
    document.title = LG === 'zh' ? '火柴塔' : LG === 'ja' ? 'マッチタワー' : 'MATCHTOWER';
    // 간판 글자는 한 글자씩 색이 달라 사전으로 못 바꾼다 — 통째로 (사장님 지정 영문 이름 MATCHTOWER)
    const lg = document.getElementById('logo');
    if (lg) lg.innerHTML = LG === 'zh' ? '<span class="b">火</span><span class="b">柴</span><span class="r">塔</span>'
      : LG === 'ja' ? '<span class="b">マッチ</span><span class="r">タワー</span>'
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
