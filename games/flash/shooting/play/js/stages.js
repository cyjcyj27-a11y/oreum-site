// 스테이지 24. 표적을 선반 셋(0·1·2)과 위 레일에 놓는다. x 는 -1.1 ~ 1.1 안에서만(왼쪽 끝은 너구리 사장 자리).
// 종류: can 깡통 · bottle 병 · duck 오리(레일, 움직임) · popper 쇠 과녁 · balloon 풍선 · pin 나무 핀 · boom 폭죽 상자
(function () {
  const S = [];
  const CW = 0.093; // 깡통 간격(지름 + 틈)
  // 깡통 피라미드: 아래 줄 n 개
  function pyr(list, tier, x, n, lab) { for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) list.push({ t: 'can', tier, x: x + (i - (n - r - 1) / 2) * CW, lv: r, lab: (lab || 0) + r + i }); }
  // 깡통 탑(한 줄로 높이 쌓기)
  function tower(list, tier, x, n) { for (let r = 0; r < n; r++) list.push({ t: 'can', tier, x, lv: r, lab: r }); }
  function row(list, t, tier, x0, x1, n, extra) { for (let i = 0; i < n; i++) list.push(Object.assign({ t, tier, x: n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1) }, extra || {})); }
  function ducks(list, n, speed, dir) { for (let i = 0; i < n; i++) list.push({ t: 'duck', i, n, speed, dir: dir || 1 }); }
  // 풍선: j 줄은 선반 (2 - j) 에 끈으로 묶여 떠 있다. move 가 있으면 줄째 좌우로 흔들린다
  function balloons(list, cols, rows, move) { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) list.push({ t: 'balloon', i, j, cols, tier: 2 - j, move: move || 0 }); }
  // 나무 핀 두 줄(앞뒤로 어긋나게): 하나가 넘어지면 옆을 친다
  function dom(list, tier, x0, n, gap) { for (let i = 0; i < n; i++) list.push({ t: 'pin', tier, x: x0 + i * (gap || 0.056), dz: i % 2 ? -0.05 : 0.04 }); }

  // ammo = 코르크 수. 손 떨림·퍼짐·틀어진 가늠자가 있어 실제 야시장처럼 어렵다.
  // 9/30 실제 코르크 무게·바닥 추 깡통·선반에서 떨어져야 인정으로 바꾼 뒤, 기다려 쏘는 자동 사수(bot.js patient·jerkfix·top)가 쓴 탄 수로 다시 맞춤
  const add = (ammo, build, extra) => { const L = []; build(L); S.push(Object.assign({ ammo, items: L }, extra || {})); };

  add(8, (L) => row(L, 'can', 0, -0.5, 0.5, 3));
  add(15, (L) => pyr(L, 1, 0, 3));
  add(18, (L) => { row(L, 'bottle', 0, -0.6, 0.6, 4); row(L, 'can', 2, -0.3, 0.3, 2); });
  add(8, (L) => row(L, 'popper', 2, -0.8, 0.8, 5));
  add(26, (L) => { pyr(L, 0, -0.5, 3); pyr(L, 2, 0.5, 2); });
  add(7, (L) => ducks(L, 4, 0.22));
  add(11, (L) => balloons(L, 4, 2));
  add(26, (L) => { dom(L, 1, -0.3, 12); row(L, 'bottle', 0, -0.35, 0.35, 2); });
  add(9, (L) => { pyr(L, 1, -0.35, 3); L.push({ t: 'boom', tier: 1, x: 0.05 }); pyr(L, 1, 0.45, 2); });
  add(16, (L) => pyr(L, 0, 0, 4));
  add(12, (L) => { ducks(L, 5, 0.3); row(L, 'popper', 1, -0.6, 0.6, 3); });
  add(12, (L) => balloons(L, 7, 1, 1));
  add(36, (L) => { row(L, 'bottle', 1, -0.8, 0.8, 5); row(L, 'bottle', 2, -0.6, 0.6, 4); });
  add(22, (L) => { dom(L, 0, -0.9, 14); L.push({ t: 'boom', tier: 0, x: 0.35 }); pyr(L, 0, 0.75, 3); });
  add(19, (L) => { tower(L, 0, -0.6, 4); tower(L, 0, 0, 5); tower(L, 0, 0.6, 4); });
  add(13, (L) => { ducks(L, 5, 0.34, -1); balloons(L, 3, 1); });
  add(38, (L) => { pyr(L, 2, -0.5, 3); pyr(L, 2, 0.5, 3); row(L, 'popper', 0, -0.5, 0.5, 3); });
  add(36, (L) => { row(L, 'bottle', 0, -0.9, 0.9, 6); pyr(L, 1, 0, 3); row(L, 'can', 2, -0.7, 0.7, 3); });
  add(34, (L) => { row(L, 'bottle', 1, -0.9, -0.3, 3); L.push({ t: 'boom', tier: 1, x: -0.1 }); pyr(L, 1, 0.3, 2); L.push({ t: 'boom', tier: 1, x: 0.62 }); row(L, 'bottle', 1, 0.78, 1.0, 2); });
  add(10, (L) => ducks(L, 7, 0.45));
  add(16, (L) => { balloons(L, 7, 1, -1); ducks(L, 4, 0.3); });
  add(28, (L) => { pyr(L, 0, 0, 5); row(L, 'popper', 2, -0.8, 0.8, 4); });
  add(32, (L) => { dom(L, 2, -0.9, 10); L.push({ t: 'boom', tier: 2, x: -0.1 }); row(L, 'bottle', 1, -0.8, 0.8, 5); pyr(L, 0, 0, 3); ducks(L, 3, 0.35); });
  add(55, (L) => { pyr(L, 0, -0.55, 4); pyr(L, 0, 0.55, 4); row(L, 'bottle', 1, -0.9, 0.9, 6); L.push({ t: 'boom', tier: 2, x: 0 }); pyr(L, 2, -0.6, 2); pyr(L, 2, 0.6, 2); ducks(L, 5, 0.38); }, { final: 1 });

  window.STAGES = S;
})();
