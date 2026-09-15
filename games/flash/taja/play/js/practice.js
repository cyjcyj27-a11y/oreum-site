/* 타자연습 달리기 — 연습 모드. 자리 연습 · 낱말 연습 · 짧은 글 연습 · 긴 글 연습. 한글/영어.
   화면 아래 키보드에 다음에 누를 자리와 손가락을 켠다. */
(function () {
  'use strict';
  var A = window.TJAudio, HG = window.HG;
  var $ = function (id) { return document.getElementById(id); };
  var EN = /[?&]lang=en/i.test(location.search);
  function L(ko, en) { return EN ? en : ko; }

  // ── 키보드: [코드, 한글, 한글+Shift, 영어, 영어+Shift, 손가락(0~7, 8 엄지), 너비] ──
  var ROWS = [
    [['Backquote', '`', '~', '`', '~', 0], ['Digit1', '1', '!', '1', '!', 0], ['Digit2', '2', '@', '2', '@', 1], ['Digit3', '3', '#', '3', '#', 2], ['Digit4', '4', '$', '4', '$', 3], ['Digit5', '5', '%', '5', '%', 3], ['Digit6', '6', '^', '6', '^', 4], ['Digit7', '7', '&', '7', '&', 4], ['Digit8', '8', '*', '8', '*', 5], ['Digit9', '9', '(', '9', '(', 6], ['Digit0', '0', ')', '0', ')', 7], ['Minus', '-', '_', '-', '_', 7], ['Equal', '=', '+', '=', '+', 7], ['Backspace', '⌫', '⌫', '⌫', '⌫', 7, 2]],
    [['Tab', '', '', '', '', 0, 1.5], ['KeyQ', 'ㅂ', 'ㅃ', 'q', 'Q', 0], ['KeyW', 'ㅈ', 'ㅉ', 'w', 'W', 1], ['KeyE', 'ㄷ', 'ㄸ', 'e', 'E', 2], ['KeyR', 'ㄱ', 'ㄲ', 'r', 'R', 3], ['KeyT', 'ㅅ', 'ㅆ', 't', 'T', 3], ['KeyY', 'ㅛ', 'ㅛ', 'y', 'Y', 4], ['KeyU', 'ㅕ', 'ㅕ', 'u', 'U', 4], ['KeyI', 'ㅑ', 'ㅑ', 'i', 'I', 5], ['KeyO', 'ㅐ', 'ㅒ', 'o', 'O', 6], ['KeyP', 'ㅔ', 'ㅖ', 'p', 'P', 7], ['BracketLeft', '[', '{', '[', '{', 7], ['BracketRight', ']', '}', ']', '}', 7], ['Backslash', '\\', '|', '\\', '|', 7, 1.5]],
    [['CapsLock', '', '', '', '', 0, 1.8], ['KeyA', 'ㅁ', 'ㅁ', 'a', 'A', 0], ['KeyS', 'ㄴ', 'ㄴ', 's', 'S', 1], ['KeyD', 'ㅇ', 'ㅇ', 'd', 'D', 2], ['KeyF', 'ㄹ', 'ㄹ', 'f', 'F', 3], ['KeyG', 'ㅎ', 'ㅎ', 'g', 'G', 3], ['KeyH', 'ㅗ', 'ㅗ', 'h', 'H', 4], ['KeyJ', 'ㅓ', 'ㅓ', 'j', 'J', 4], ['KeyK', 'ㅏ', 'ㅏ', 'k', 'K', 5], ['KeyL', 'ㅣ', 'ㅣ', 'l', 'L', 6], ['Semicolon', ';', ':', ';', ':', 7], ['Quote', "'", '"', "'", '"', 7], ['Enter', '↵', '↵', '↵', '↵', 7, 2.2]],
    [['ShiftLeft', '⇧', '⇧', '⇧', '⇧', 0, 2.35], ['KeyZ', 'ㅋ', 'ㅋ', 'z', 'Z', 0], ['KeyX', 'ㅌ', 'ㅌ', 'x', 'X', 1], ['KeyC', 'ㅊ', 'ㅊ', 'c', 'C', 2], ['KeyV', 'ㅍ', 'ㅍ', 'v', 'V', 3], ['KeyB', 'ㅠ', 'ㅠ', 'b', 'B', 3], ['KeyN', 'ㅜ', 'ㅜ', 'n', 'N', 4], ['KeyM', 'ㅡ', 'ㅡ', 'm', 'M', 4], ['Comma', ',', '<', ',', '<', 5], ['Period', '.', '>', '.', '>', 6], ['Slash', '/', '?', '/', '?', 7], ['ShiftRight', '⇧', '⇧', '⇧', '⇧', 7, 2.75]],
    [['Space', '', '', '', '', 8, 7]]
  ];
  var FINGER_COL = ['#ff9aa2', '#ffc36b', '#9be3a0', '#8fd3ff', '#8fd3ff', '#9be3a0', '#ffc36b', '#ff9aa2', '#c9b8ff'];
  var KEY = {};                       // 코드 → 줄 정보
  var CHAR = { ko: {}, en: {} };      // 글자 → { code, shift }
  ROWS.forEach(function (row) { row.forEach(function (k) { KEY[k[0]] = k; }); });
  ROWS.forEach(function (row) {
    row.forEach(function (k) {
      if (/^(Tab|CapsLock|Shift|Enter|Backspace|Space)/.test(k[0])) return;
      ['ko', 'en'].forEach(function (lg) {
        var base = lg === 'ko' ? k[1] : k[3], sh = lg === 'ko' ? k[2] : k[4];
        if (!CHAR[lg][base]) CHAR[lg][base] = { code: k[0], shift: false };
        if (sh !== base && !CHAR[lg][sh]) CHAR[lg][sh] = { code: k[0], shift: true };
        // 한글 자판에서도 숫자·기호는 영어 자리 그대로
        if (lg === 'ko' && !/[ㄱ-ㅣ]/.test(k[1])) { CHAR.ko[k[3]] = CHAR.ko[k[3]] || { code: k[0], shift: false }; CHAR.ko[k[4]] = CHAR.ko[k[4]] || { code: k[0], shift: true }; }
        if (lg === 'ko' && /[ㄱ-ㅣ]/.test(k[1])) { CHAR.ko[k[4]] = CHAR.ko[k[4]] || { code: k[0], shift: true }; }
      });
    });
  });
  CHAR.ko[' '] = CHAR.en[' '] = { code: 'Space', shift: false };
  function charOf(code, shift, lg) { var k = KEY[code]; if (!k) return null; if (code === 'Space') return ' '; if (/^(Tab|CapsLock|Shift|Enter|Backspace)/.test(code)) return null; return lg === 'ko' ? (shift ? k[2] : k[1]) : (shift ? k[4] : k[3]); }

  // ── 연습 거리 ──
  var SEAT = {
    ko: [['기본 자리', 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ'], ['윗줄', 'ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔㅁㄴㅇㄹㅓㅏㅣ'], ['아랫줄', 'ㅋㅌㅊㅍㅠㅜㅡㅁㄴㅇㄹㅗㅓㅏ'], ['쌍자음', 'ㅃㅉㄸㄲㅆㅒㅖㅂㅈㄷㄱㅅ'], ['숫자', '1234567890'], ['전체', 'ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔㅁㄴㅇㄹㅎㅗㅓㅏㅣㅋㅌㅊㅍㅠㅜㅡㅃㅉㄸㄲㅆㅒㅖ']],
    en: [['Home row', 'asdfghjkl'], ['Top row', 'qwertyuiopasdfjkl'], ['Bottom row', 'zxcvbnmasdfjkl'], ['Capitals', 'QWERTYUIOPASDFGHJKLZXCVBNM'], ['Numbers', '1234567890'], ['All', 'qwertyuiopasdfghjklzxcvbnm,.;/QWERTASDFG']]
  };
  var W = function () { return window.TJ_WORDS; };
  function wordLv(lg) { return (lg === 'ko' ? ['1', '2', '3', '4', '5'] : ['1', '2', '3', '4', '5']).map(function (n, i) { return [n, [i]]; }); }
  var SHORT = {
    ko: [['문장 1', [5, 6]], ['문장 2', [7]], ['속담', [8, 9]], ['긴 문장', [10]], ['숫자', [12]], ['기호', [13, 14]]],
    en: [['Sentences 1', [5, 6]], ['Sentences 2', [7]], ['Proverbs', [8, 9]], ['Long', [10]], ['Numbers', [12]], ['Symbols', [13, 14]]]
  };
  var STORY = {
    ko: [
      ['토끼와 거북이', '옛날 옛적 숲속에 발 빠른 토끼가 살았어요.|토끼는 느린 거북이를 보고 늘 놀렸어요.|화가 난 거북이가 달리기 시합을 하자고 했어요.|출발하자마자 토끼는 저만치 앞서 나갔어요.|토끼는 나무 그늘에 누워 낮잠을 잤어요.|거북이는 쉬지 않고 한 걸음씩 걸었어요.|토끼가 눈을 떴을 때 거북이는 벌써 결승선에 있었어요.|꾸준히 가는 사람이 끝내 이긴답니다.'],
      ['금도끼 은도끼', '가난한 나무꾼이 산에서 나무를 하고 있었어요.|그만 손이 미끄러져 도끼가 연못에 빠졌어요.|연못에서 산신령이 금도끼를 들고 나타났어요.|이 금도끼가 네 도끼냐고 물었어요.|나무꾼은 제 도끼는 낡은 쇠도끼라고 말했어요.|산신령은 정직한 나무꾼에게 도끼 세 자루를 모두 주었어요.|욕심 많은 이웃은 거짓말을 하다가 제 도끼까지 잃었어요.'],
      ['개미와 베짱이', '뜨거운 여름날 개미들은 부지런히 먹이를 날랐어요.|베짱이는 나무 위에서 노래만 불렀어요.|개미야, 이렇게 더운데 좀 쉬어 가렴.|개미는 겨울을 준비해야 한다며 계속 일했어요.|찬 바람이 불고 하얀 눈이 내렸어요.|배고픈 베짱이가 개미네 문을 두드렸어요.|개미는 따뜻한 수프를 나누어 주었어요.|베짱이는 내년에는 함께 일하겠다고 약속했어요.'],
      ['해님 달님', '깊은 산골에 오누이와 엄마가 살았어요.|떡을 팔고 오던 엄마 앞에 호랑이가 나타났어요.|떡 하나 주면 안 잡아먹지.|호랑이는 엄마 옷을 입고 오누이 집에 찾아왔어요.|문틈으로 보니 털이 수북한 손이 보였어요.|오누이는 뒷문으로 나가 나무 위로 올라갔어요.|하늘에서 내려온 튼튼한 동아줄을 잡았어요.|오빠는 달이 되고 동생은 해가 되었답니다.'],
      ['흥부와 놀부', '마음씨 착한 흥부와 욕심쟁이 놀부 형제가 있었어요.|흥부는 다리를 다친 제비를 정성껏 고쳐 주었어요.|봄이 되자 제비가 박씨 하나를 물어 왔어요.|흥부네 지붕에 커다란 박이 주렁주렁 열렸어요.|박을 타니 금은보화가 쏟아져 나왔어요.|놀부는 일부러 제비 다리를 부러뜨렸어요.|놀부의 박에서는 도깨비들이 튀어나왔어요.|착하게 살면 좋은 일이 생긴답니다.'],
      ['견우와 직녀', '하늘나라에 소를 모는 견우와 베를 짜는 직녀가 살았어요.|두 사람은 서로 좋아하게 되었어요.|함께 노느라 일을 게을리하자 임금님이 화가 났어요.|견우와 직녀는 은하수 양쪽으로 떨어져 살게 되었어요.|일 년에 딱 한 번 칠월 칠석에만 만날 수 있었어요.|까치와 까마귀가 날아와 다리를 놓아 주었어요.|두 사람이 만나 흘린 눈물이 비가 되어 내렸답니다.']
    ],
    en: [
      ['The Tortoise and the Hare', 'Once upon a time a fast hare lived in the forest.|The hare always laughed at the slow tortoise.|One day the tortoise asked the hare to race.|The hare ran far ahead right away.|He lay down under a tree and fell asleep.|The tortoise kept walking, one step at a time.|When the hare woke up, the tortoise was at the finish line.|Slow and steady wins the race.'],
      ['The Ant and the Grasshopper', 'On hot summer days the ants carried food all day.|The grasshopper sat in a tree and sang songs.|Come and rest, little ant, it is too hot to work.|The ant said she had to get ready for winter.|Soon the cold wind came and the snow fell.|The hungry grasshopper knocked on the ant house door.|The ant shared a bowl of warm soup.|Next year the grasshopper promised to work too.'],
      ['The Lion and the Mouse', 'A little mouse ran across a sleeping lion.|The lion woke up and caught the mouse in his paw.|Please let me go, and one day I will help you.|The lion laughed, but he let the mouse go.|Later the lion was caught in a hunter net.|He roared and roared, but he could not get out.|The mouse came and chewed the ropes one by one.|Even a small friend can be a big help.'],
      ['The Boy Who Cried Wolf', 'A boy looked after sheep on a quiet hill.|He was bored, so he shouted, Wolf! Wolf!|The villagers ran up the hill, but there was no wolf.|The boy laughed and did the same trick again.|Then one evening a real wolf came.|The boy shouted as loud as he could.|This time nobody came to help.|People stop believing someone who tells lies.'],
      ['The Honest Woodcutter', 'A poor woodcutter was cutting trees by a lake.|His old axe slipped and fell into the water.|A spirit rose from the lake with a golden axe.|Is this golden axe yours? she asked.|No, mine is just an old iron axe, he said.|The spirit gave him all three axes for being honest.|His greedy neighbor lied and lost his own axe.'],
      ['The Sun and the Wind', 'The sun and the wind argued about who was stronger.|They saw a man walking in a warm coat.|Whoever takes off his coat wins, said the sun.|The wind blew hard, but the man held his coat tight.|Then the sun shone softly and warmly.|The man got hot and took off his coat.|Kindness can do what force cannot.']
    ]
  };

  // ── 상태 ──
  var PR = null, lang = EN ? 'en' : 'ko', tick = null;
  var best = (function () { try { return JSON.parse(localStorage.getItem('taja.prac') || '{}') || {}; } catch (e) { return {}; } })();
  function saveBest() { try { localStorage.setItem('taja.prac', JSON.stringify(best)); } catch (e) {} }
  function unit() { return lang === 'en' ? 'WPM' : L('타', 'KPM'); }
  function speedShow(kpm) { return lang === 'en' ? Math.round(kpm / 5) : Math.round(kpm); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function scr(id) { ['pmenu', 'prac', 'pres'].forEach(function (s) { $(s).classList.toggle('show', s === id); }); }

  // ── 키보드 그리기 ──
  var keyEl = {}, fingerEl = [];
  function buildKeyboard() {
    var kb = $('kb'); kb.innerHTML = '';
    ROWS.forEach(function (row) {
      var r = document.createElement('div'); r.className = 'kr';
      row.forEach(function (k) {
        var d = document.createElement('div'); d.className = 'ky'; d.style.flexGrow = k[6] || 1; d.style.setProperty('--fc', FINGER_COL[k[5]]);
        if (k[0] === 'KeyF' || k[0] === 'KeyJ') d.classList.add('bump');
        r.appendChild(d); keyEl[k[0]] = d;
      });
      kb.appendChild(r);
    });
    var hd = $('hands'); hd.innerHTML = '';
    // 손: 왼손 새끼→검지, 엄지 둘, 오른손 검지→새끼
    var order = [0, 1, 2, 3, 8, 8, 4, 5, 6, 7], hgt = [40, 54, 60, 52, 32, 32, 52, 60, 54, 40];
    order.forEach(function (f, i) {
      var d = document.createElement('div'); d.className = 'fg' + (i === 4 ? ' gapL' : '') + (i === 5 ? ' gapR' : '');
      d.style.height = hgt[i] + 'px'; d.style.setProperty('--fc', FINGER_COL[f]); d.dataset.f = f;
      hd.appendChild(d); fingerEl.push(d);
    });
  }
  function labelKeyboard() {
    ROWS.forEach(function (row) {
      row.forEach(function (k) {
        var el = keyEl[k[0]], lg = lang, base = lg === 'ko' ? k[1] : k[3], sh = lg === 'ko' ? k[2] : k[4];
        if (k[0] === 'Space') base = '';
        el.innerHTML = (sh && sh !== base && lg === 'ko' && /[ㄱ-ㅣ]/.test(base) ? '<small>' + sh + '</small>' : (sh && sh !== base && !/[a-z]/.test(base) ? '<small>' + sh + '</small>' : '')) + '<span>' + base + '</span>';
      });
    });
  }
  function lightKey(ch) {
    Object.keys(keyEl).forEach(function (c) { keyEl[c].classList.remove('hl', 'hls'); });
    fingerEl.forEach(function (f) { f.classList.remove('on'); });
    if (ch == null) return;
    var code, shift = false;
    if (ch === '⌫') code = 'Backspace'; else if (ch === '↵') code = 'Enter';
    else { var m = CHAR[lang][ch]; if (!m) return; code = m.code; shift = m.shift; }
    var k = KEY[code]; keyEl[code].classList.add('hl');
    var f = k[5];
    fingerEl.forEach(function (el) { if (+el.dataset.f === f) el.classList.add('on'); });
    if (shift) {
      var sc = f <= 3 || f === 8 ? 'ShiftRight' : 'ShiftLeft';
      keyEl[sc].classList.add('hls');
      fingerEl.forEach(function (el) { if (+el.dataset.f === (sc === 'ShiftRight' ? 7 : 0)) el.classList.add('on'); });
    }
    // 엄지는 한쪽만 켠다
    if (f === 8) { fingerEl[5].classList.remove('on'); }
  }
  function flashKey(code, ok) { var el = keyEl[code]; if (!el) return; el.classList.remove('okf', 'badf'); void el.offsetWidth; el.classList.add(ok ? 'okf' : 'badf'); }

  // ── 메뉴 ──
  function openMenu() {
    stopTick(); PR = null; scr('pmenu'); $('pinp').blur();
    $('plKo').classList.toggle('on', lang === 'ko'); $('plEn').classList.toggle('on', lang === 'en');
    document.body.classList.add('practicing');
  }
  function close() { stopTick(); PR = null; scr(''); document.body.classList.remove('practicing'); if (window.TJGame) TJGame.title(); }
  $('plKo').onclick = function () { lang = 'ko'; A.click(); openMenu(); };
  $('plEn').onclick = function () { lang = 'en'; A.click(); openMenu(); };
  $('pmBack').onclick = function () { A.click(); close(); };
  Array.prototype.forEach.call(document.querySelectorAll('.pm'), function (el) { el.onclick = function () { A.init(); A.click(); start(el.dataset.m, best['lv:' + lang + ':' + el.dataset.m] || 0); }; });
  $('pQuit').onclick = function () { A.click(); openMenu(); };
  $('prRetry').onclick = function () { start(PR.mode, PR.lv); };
  $('prNext').onclick = function () { start(PR.mode, Math.min(levels(PR.mode).length - 1, PR.lv + 1)); };
  $('prMenu').onclick = function () { A.click(); openMenu(); };

  function levels(mode) { return mode === 'seat' ? SEAT[lang] : mode === 'word' ? wordLv(lang) : mode === 'short' ? SHORT[lang] : STORY[lang]; }
  function modeName(mode) { return { seat: L('자리 연습', 'Keys'), word: L('낱말 연습', 'Words'), short: L('짧은 글 연습', 'Sentences'), long: L('긴 글 연습', 'Stories') }[mode]; }

  // ── 시작 ──
  function start(mode, lv) {
    var lvs = levels(mode); lv = Math.max(0, Math.min(lvs.length - 1, lv || 0));
    best['lv:' + lang + ':' + mode] = lv; saveBest();
    PR = { mode: mode, lv: lv, items: [], idx: 0, t0: 0, keys: 0, wrong: 0, chars: 0, okChars: 0, lastBad: 0, done: false };
    if (mode === 'seat') {
      var set = lvs[lv][1].split(''), seq = [];
      while (seq.length < 50) { var c = set[Math.floor(Math.random() * set.length)]; if (c !== seq[seq.length - 1]) seq.push(c); }
      PR.items = seq;
    } else if (mode === 'word') {
      PR.items = shuffle(W()[lang][lvs[lv][1][0]].slice()).slice(0, 30);
    } else if (mode === 'short') {
      var pool = []; lvs[lv][1].forEach(function (i) { pool = pool.concat(W()[lang][i]); });
      PR.items = shuffle(pool).slice(0, 15);
    } else {
      PR.items = lvs[lv][1].split('|');
    }
    // 단계 칩
    var lvBox = $('pLv'); lvBox.innerHTML = '<b>' + modeName(mode) + '</b>';
    lvs.forEach(function (x, i) {
      var ch = document.createElement('span'); ch.className = 'plv' + (i === lv ? ' on' : ''); ch.textContent = x[0];
      ch.onclick = function () { A.click(); start(mode, i); };
      lvBox.appendChild(ch);
    });
    $('pUnit').textContent = unit(); $('prUnit').textContent = unit();
    document.body.classList.toggle('pseat', mode === 'seat');
    labelKeyboard();
    scr('prac');
    var inp = $('pinp'); inp.value = ''; inp.disabled = false; inp.focus();
    render(); stats();
    stopTick(); tick = setInterval(stats, 250);
  }
  function stopTick() { if (tick) clearInterval(tick); tick = null; }
  function now() { return performance.now(); }
  function kpm() { if (!PR || !PR.t0) return 0; var m = ((PR.tEnd || now()) - PR.t0) / 60000; return m > 0.02 ? (PR.keys + liveKeys()) / m : 0; }
  function acc() { var tot = PR.okChars + PR.wrong; return tot ? Math.round(100 * PR.okChars / tot) : 100; }
  function stats() {
    if (!PR) return;
    $('pCpm').textContent = speedShow(kpm()); $('pAcc').textContent = acc();
    $('pProg').textContent = (PR.idx) + '/' + PR.items.length;
    $('pBarFill').style.width = (100 * PR.idx / PR.items.length) + '%';
  }

  // ── 줄 연습(낱말·짧은 글·긴 글): 한 글자씩 비교 ──
  function lineState(t, v) {
    var cls = [], ok = 0, okKeys = 0, bad = 0;
    for (var i = 0; i < t.length; i++) {
      if (i < v.length) {
        if (v[i] === t[i]) { cls.push('d'); ok++; okKeys += HG.count(t[i]); }
        else if (i === v.length - 1 && HG.match(t[i], v[i]).wrong === 0) cls.push('c');
        else { cls.push('x'); bad++; }
      } else cls.push(i === v.length ? 'c' : '');
    }
    bad += Math.max(0, v.length - t.length);
    return { cls: cls, ok: ok, okKeys: okKeys, bad: bad };
  }
  function liveKeys() {
    if (!PR || PR.mode === 'seat' || PR.done) return 0;
    var t = PR.items[PR.idx]; if (t == null) return 0;
    return lineState(t, $('pinp').value).okKeys;
  }
  function spans(t, cls) { var h = ''; for (var i = 0; i < t.length; i++) h += '<span class="' + (cls ? cls[i] : '') + (t[i] === ' ' ? ' sp' : '') + '">' + (t[i] === ' ' ? ' ' : t[i].replace('<', '&lt;').replace('>', '&gt;')) + '</span>'; return h; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function render() {
    if (!PR) return;
    var inp = $('pinp');
    if (PR.mode === 'seat') {
      var cur = PR.items[PR.idx];
      $('pSeat').textContent = cur || '';
      $('pSeatNext').textContent = PR.items.slice(PR.idx + 1, PR.idx + 9).join(' ');
      lightKey(cur);
      return;
    }
    var t = PR.items[PR.idx] || '', v = inp.value, st = lineState(t, v);
    $('pPrev').innerHTML = PR.idx > 0 ? esc(PR.items[PR.idx - 1]) : '';
    var ln = $('pLine'); ln.innerHTML = spans(t, st.cls);
    ln.style.fontSize = '';
    var base = parseFloat(getComputedStyle(ln).fontSize), maxW = $('pText').clientWidth - 24;
    ln.style.fontSize = base + 'px'; if (ln.scrollWidth > maxW) ln.style.fontSize = Math.max(18, base * maxW / ln.scrollWidth) + 'px';
    var nx = PR.items.slice(PR.idx + 1, PR.idx + (PR.mode === 'word' ? 6 : 3));
    $('pNext').innerHTML = nx.map(esc).join(PR.mode === 'word' ? '  ·  ' : '<br>');
    // 다음 누를 자리
    var m = HG.match(t, v);
    if (m.wrong > 0) lightKey('⌫');
    else if (m.ok < m.total) { var kk = HG.keys(t).k[m.ok]; lightKey(kk); }
    else lightKey(PR.mode === 'word' ? ' ' : '↵');
    // 틀린 글자가 새로 생기면 소리
    if (st.bad > PR.lastBad) A.bad();
    PR.lastBad = st.bad;
  }
  function commitLine() {
    var inp = $('pinp'), t = PR.items[PR.idx], v = inp.value.replace(/\s+$/, '');
    if (!v.length) return;
    var st = lineState(t, v);
    PR.keys += st.okKeys + 1; PR.okChars += st.ok; PR.wrong += st.bad + Math.max(0, t.length - v.length);
    A.word(st.bad === 0 && v.length === t.length);
    PR.idx++; PR.lastBad = 0; inp.value = '';
    if (PR.idx >= PR.items.length) finish(); else render();
    stats();
  }

  // ── 입력 ──
  var lastKeyT = 0;
  $('pinp').addEventListener('keydown', function (e) {
    if (!PR || PR.done) return;
    if (e.key === 'Escape') { e.preventDefault(); openMenu(); return; }
    if (PR.mode === 'seat') {
      var ch = charOf(e.code, e.shiftKey, lang);
      if (ch == null) return;
      e.preventDefault(); lastKeyT = now();
      seatPress(ch, e.code);
      return;
    }
    if (!PR.t0 && e.key.length === 1) PR.t0 = now();
    if (e.code && KEY[e.code]) flashKey(e.code, true);
    if (e.key === 'Enter') { e.preventDefault(); setTimeout(commitLine, 0); }
  });
  $('pinp').addEventListener('input', function () {
    if (!PR || PR.done) return;
    var inp = $('pinp');
    if (PR.mode === 'seat') {
      // 폰 자판: 들어온 마지막 글자로 판정하고 비운다
      if (now() - lastKeyT < 60) { inp.value = ''; return; }
      var v = inp.value; inp.value = ''; if (!v) return;
      var ch = v[v.length - 1]; var m = CHAR[lang][ch];
      seatPress(ch, m ? m.code : null);
      return;
    }
    if (!PR.t0) PR.t0 = now();
    var t = PR.items[PR.idx], v2 = inp.value;
    if (v2.length > 1 && v2[v2.length - 1] === ' ' && (PR.mode === 'word' || v2.slice(0, -1) === t)) { commitLine(); return; }
    render();
  });
  $('pinp').addEventListener('paste', function (e) { e.preventDefault(); });
  function seatPress(ch, code) {
    if (!PR.t0) PR.t0 = now();
    var target = PR.items[PR.idx];
    if (ch === target) {
      PR.keys++; PR.okChars++; PR.idx++; A.key(); if (code) flashKey(code, true);
      $('pSeat').classList.remove('bad');
      if (PR.idx >= PR.items.length) { finish(); return; }
    } else {
      PR.wrong++; A.bad(); if (code) flashKey(code, false);
      var s = $('pSeat'); s.classList.remove('bad'); void s.offsetWidth; s.classList.add('bad');
    }
    render(); stats();
  }
  $('prac').addEventListener('pointerdown', function (e) { if (PR && !PR.done && !e.target.closest('.plv,#pQuit')) setTimeout(function () { $('pinp').focus(); }, 0); });

  // ── 끝 ──
  function finish() {
    PR.done = true; PR.tEnd = now(); stopTick(); stats(); lightKey(null);
    var sp = kpm(), a = acc(), secs = Math.round((PR.tEnd - PR.t0) / 1000);
    var key = lang + ':' + PR.mode + ':' + PR.lv, isBest = sp > (best[key] || 0);
    if (isBest) { best[key] = Math.round(sp); saveBest(); }
    $('prSpeed').textContent = speedShow(sp); $('prAcc').textContent = a;
    $('prTime').textContent = Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2);
    $('prNew').textContent = isBest ? L('최고 기록!', 'NEW RECORD') : L('최고 ', 'BEST ') + speedShow(best[key]) + ' ' + unit();
    $('prNext').style.display = PR.lv < levels(PR.mode).length - 1 ? '' : 'none';
    $('pinp').blur();
    A.cheer(a >= 95); if (a >= 95) A.win();
    scr('pres');
    if (window.OG) OG.over({ result: 'PRACTICE', score: Math.round(sp), mode: PR.mode, level: PR.lv + 1 });
  }
  document.addEventListener('keydown', function (e) {
    if ($('pres').classList.contains('show') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ($('prNext').style.display !== 'none' ? $('prNext') : $('prRetry')).onclick(); }
    else if ($('pmenu').classList.contains('show') && e.key === 'Escape') close();
  });

  buildKeyboard();
  window.TJPractice = {
    open: function () { A.init(); openMenu(); },
    start: start, state: function () { return PR; }, lang: function (l) { if (l) lang = l; return lang; },
    press: function (ch) { if (PR && PR.mode === 'seat') seatPress(ch, (CHAR[lang][ch] || {}).code); },
    type: function (v) { $('pinp').value = v; $('pinp').dispatchEvent(new Event('input')); },
    enter: function () { commitLine(); }
  };
})();
