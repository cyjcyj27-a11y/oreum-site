/* 새우잡이배 — 튜토리얼: 처음 하는 일마다 안내 판 한 줄. 갈 곳은 물건 생김새와 가까이 가면 뜨는 [E] 표시로 안다(노란 화살·고리는 10/3 뺌). 끝낸 것은 다시 안 뜬다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, U = SB.tut = {}, mark, arrow, ring, cur = null, moved = 0, lastP = null, _v = new T.Vector3();
function G() { return SB.G; }
/* 본 단계는 저장 파일과 따로 기억한다: 새 게임을 해도 다시 안 나온다(사장님 10/4 "튜토리얼은 처음에 한번만 보여주는거야") */
var SEEN = {}; try { SEEN = JSON.parse(localStorage.getItem('shrimpboat.tut')) || {}; } catch (e) { SEEN = {}; }
function keep() { try { localStorage.setItem('shrimpboat.tut', JSON.stringify(SEEN)); } catch (e) {} }
function did(id) { return !!SEEN[id]; }
function T2(ko, en, kot, ent) { return { ko: ko, en: en, kot: kot || ko, ent: ent || en }; }
var I = function () { return SB.boat.I; };
var STEPS = [
  { id: 'move', on: function () { return G().mode === 'day'; }, done: function () { return moved > 3 || !!SB.station.cur || SB.haul.phase !== 'idle'; }, t: T2('WASD 로 걷고 마우스로 둘러본다. 물건 앞에서 E', 'WASD to walk, mouse to look. E to use things', '왼쪽 패드로 걷고 화면을 끌어 둘러본다. 물건 앞에서 오른쪽 단추', 'Left pad to walk, drag to look. Right button to use things') },
  { id: 'winch', on: function () { return G().mode === 'day' && SB.haul.phase === 'idle' && SB.haul.need(); }, done: function () { return SB.haul.phase !== 'idle'; }, at: function () { return [4.1, D + 1.25, 1.37]; }, t: T2('양망기 손잡이 앞에서 E 를 눌러 그물을 올린다', 'Go to the winch lever and press E to haul the net', '양망기 손잡이 앞에서 오른쪽 단추로 그물을 올린다', 'At the winch lever, press the right button to haul the net') },
  { id: 'haul', on: function () { return SB.haul.phase === 'haul'; }, done: function () { return SB.haul.phase !== 'haul'; }, t: T2('E 나 마우스 왼쪽 단추를 누르고 있으면 그물이 감긴다. 바늘이 빨간 칸에 들어가면 손을 뗐다가 다시 누른다', 'Hold E or the left mouse button to wind the net. When the needle hits red, let go, then hold again', '화면을 누르고 있으면 그물이 감긴다. 바늘이 빨간 칸에 들어가면 손을 뗐다가 다시 누른다', 'Hold the screen to wind the net. When the needle hits red, let go, then hold again') },
  { id: 'bag', on: function () { return SB.haul.phase === 'ready'; }, done: function () { return SB.haul.phase !== 'ready'; }, at: function () { var b = SB.haul.bagPos; return [b.x, b.y - 0.2, b.z]; }, t: T2('선별대 위에 걸린 그물 앞에서 E 를 눌러 쏟는다', 'Press E at the net over the table to dump it', '선별대 위에 걸린 그물 앞에서 오른쪽 단추로 쏟는다', 'At the net over the table, press the right button to dump it') },
  { id: 'sort', on: function () { return SB.haul.phase === 'sort' && !!SB.station.cur; }, done: function () { return SB.haul.phase !== 'sort'; }, t: T2('새우는 집어서 왼쪽 바구니로 휙, 잡것은 앞쪽 바다로 휙 던진다', 'Fling shrimp left into the basket, junk forward into the sea') },
  { id: 'sortGo', on: function () { return SB.haul.phase === 'sort' && !SB.station.cur; }, done: function () { return !!SB.station.cur || SB.haul.phase !== 'sort'; }, at: function () { return [1.4, D + 1.1, 0.5]; }, t: T2('선별대 앞에서 E 를 눌러 고르기를 이어 한다', 'Press E at the table to keep sorting', '선별대 앞에서 오른쪽 단추로 고르기를 이어 한다', 'Press the right button at the table to keep sorting') },
  { id: 'basket', on: function () { return SB.haul.phase === 'full' && !G().carry; }, done: function () { return G().carry === 'basket' || SB.haul.phase !== 'full'; }, at: function () { var b = SB.boat.basketAt; return [b.x, b.y + 0.45, b.z]; }, t: T2('새우 바구니 앞에서 E 를 눌러 든다', 'Press E at the shrimp basket to pick it up', '새우 바구니 앞에서 오른쪽 단추로 든다', 'Press the right button at the basket to pick it up') },
  { id: 'hold', on: function () { return G().carry === 'basket'; }, done: function () { return G().carry !== 'basket'; }, at: function () { return [-0.7, D + 0.35, 0]; }, t: T2('어창 뚜껑에서 E 를 눌러 쏟는다', 'Dump it into the fish hold', '어창 뚜껑 앞에서 오른쪽 단추로 쏟는다', 'Press the right button at the fish hold to dump it') },
  { id: 'scrub', on: function () { return G().mode === 'day' && SB.work.stainsLeft() > 0 && !SB.station.cur && !G().carry; }, done: function () { return SB.work.stainsLeft() === 0; }, at: function () { var s = near(); return s ? [s.x, D + 0.2, s.z] : null; }, t: T2('갑판의 때 앞에서 E 를 길게 눌러 솔로 닦는다', 'Hold E at the grime to scrub it with the brush', '갑판의 때 앞에서 오른쪽 단추를 길게 눌러 솔로 닦는다', 'Hold the right button at the grime to scrub it') },
  { id: 'bucket', on: function () { var t = SB.taskOf('deck'), n = SB.taskOf('net'); return G().mode === 'day' && t && t.done < 1 && n.done >= n.n && SB.work.stainsLeft() === 0; }, done: function () { var t = SB.taskOf('deck'); return !t || t.done >= 1; }, at: function () { var b = I().bucket.position; return [b.x, D + 0.45, b.z]; }, t: T2('양동이 앞에서 E 를 눌러 바닷물을 갑판에 뿌린다', 'Press E at the bucket to splash seawater on the deck', '양동이 앞에서 오른쪽 단추로 바닷물을 뿌린다', 'Press the right button at the bucket to splash the deck') },
  { id: 'ramen', on: function () { var t = SB.taskOf('ramen'); return G().mode === 'day' && t && t.done < 1 && !G().carry && !SB.station.cur && SB.haul.phase === 'idle'; }, done: function () { return !!SB.station.cur || G().carry === 'pot'; }, at: function () { return [-2.62, D + 1.2, -2.3]; }, t: T2('선장 라면을 끓인다. 버너 앞에서 E', 'Cook the captain\'s ramen. Press E at the stove', '선장 라면을 끓인다. 버너 앞에서 오른쪽 단추', 'Cook the captain\'s ramen. Right button at the stove') },
  { id: 'cook', on: function () { var R = SB.work.ramen, t = SB.taskOf('ramen'); return !!SB.station.cur && R.step < 5 && t && t.done < 1 && SB.haul.phase !== 'haul' && SB.haul.phase !== 'sort'; }, done: function () { return G().carry === 'pot'; }, text: function () { var s = SB.work.ramen.step; return s === 0 ? T2('물통을 누르고 있으면 냄비에 물이 붓는다', 'Hold the jug to pour water') : s === 1 ? T2('빨간 손잡이를 눌러 불을 켠다', 'Tap the red knob to light the fire') : s < 4 ? T2('물이 끓으면 라면 봉지를 넣는다', 'When it boils, drop in the ramen') : T2('면이 알맞게 익으면 손잡이를 눌러 불을 끈다', 'When the noodles are just right, turn off the fire'); } },
  { id: 'serve', on: function () { return G().carry === 'pot'; }, done: function () { return G().carry !== 'pot'; }, at: function () { var p = SB.cap.pos(); return [p.x, D + 2.35, p.z]; }, t: T2('냄비를 선장에게 갖다주고 E', 'Bring the pot to the captain and press E', '냄비를 선장에게 갖다주고 오른쪽 단추', 'Bring the pot to the captain and press the right button') },
  { id: 'night', on: function () { return G().mode === 'night' && !G().holding && SB.night.count() === 0; }, done: function () { return !!G().holding || SB.night.count() > 0; }, at: function () { return [-2.6, D + 0.9, 2.12]; }, t: T2('선장이 잠들었다. 쌓인 나무판 앞에서 E 를 눌러 몰래 든다', 'The captain is asleep. Press E at the pallets to sneak one', '선장이 잠들었다. 쌓인 나무판 앞에서 오른쪽 단추로 몰래 든다', 'The captain is asleep. Right button at the pallets to sneak one') },
  { id: 'carry', on: function () { return G().mode === 'night' && !!G().holding; }, done: function () { return SB.night.count() > 0; }, at: function () { var r = SB.boat.raftAt; return [r.x, D + 1.1, r.z]; }, t: T2('뛰면 발소리에 선장이 깬다. 천천히 이물 방수포로 옮긴다', 'Running wakes the captain. Walk it to the tarp at the bow') },
  { id: 'bed', on: function () { return G().mode === 'night' && SB.night.count() > 0 && !G().holding; }, done: function () { return G().mode !== 'night'; }, at: function () { return [5.1, D + 1.6, -1.3]; }, t: T2('오늘 밤은 여기까지. 선실 문에서 E 를 눌러 잔다', 'That\'s enough tonight. Press E at the cabin door to sleep', '오늘 밤은 여기까지. 선실 문 앞에서 오른쪽 단추로 잔다', 'That\'s enough tonight. Right button at the cabin door to sleep') },
  { id: 'wake', on: function () { return SB.cap.st === 'patrol'; }, done: function () { return SB.cap.st !== 'patrol'; }, t: T2('선장이 깼다! 손전등 빛에 걸리지 않게 숨는다', 'The captain woke up! Stay out of his flashlight') },
  { id: 'island', on: function () { return SB.islandNight(); }, done: function () { return G().mode !== 'night'; }, t: T2('섬이 보인다. 재료 12개를 다 모았으면 이런 밤에 방수포에서 뗏목을 띄운다', 'An island! With all 12 parts, launch the raft from the tarp on nights like this') },
  { id: 'row', on: function () { return G().mode === 'escape'; }, done: function () { return G().mode !== 'escape'; }, t: T2('A 와 D 를 번갈아 눌러 노를 젓는다. 탐조등에 오래 걸리면 배가 쫓아온다', 'Alternate A and D to row. Stay in the searchlight too long and the boat gives chase', '양쪽 단추를 번갈아 눌러 노를 젓는다. 탐조등에 오래 걸리면 배가 쫓아온다', 'Alternate the two buttons to row. Stay in the searchlight and the boat gives chase') }
];
function near() { var best = null, bd = 1e9; SB.fx.stains.forEach(function (s) { if (s.done || !s.mesh.visible) return; var d = Math.hypot(s.mesh.position.x - G().P.x, s.mesh.position.z - G().P.z); if (d < bd) { bd = d; best = s.mesh.position; } }); return best; }
U.init = function () {};
U.reset = function () { moved = 0; lastP = null; };
U.off = function () { SEEN.off = true; keep(); show(null); };
function show(st) {
  var card = document.getElementById('tut');
  if (!st) { card.hidden = true; cur = null; return; }
  var tx = st.text ? st.text() : st.t, touch = document.body.classList.contains('touch'), s = SB.EN ? (touch ? tx.ent : tx.en) : (touch ? tx.kot : tx.ko);
  var el = document.getElementById('tutTxt'); if (el.textContent !== s) { el.textContent = s; card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
  card.hidden = false; cur = st;
}
U.update = function (dt, cam) {
  var g = G(); if (g.flags && g.flags.tut) { Object.keys(g.flags.tut).forEach(function (k) { SEEN[k] = true; }); if (g.flags.tutOff) SEEN.off = true; delete g.flags.tut; delete g.flags.tutOff; keep(); }   // 옛 저장에 남은 것 옮기기
  if (SEEN.off || g.mode === 'title' || g.mode === 'end' || g.mode === 'story' || g.mode === 'sleep') { if (cur || !document.getElementById('tut').hidden) show(null); return; }
  if (lastP) moved += Math.hypot(g.P.x - lastP.x, g.P.z - lastP.z); lastP = { x: g.P.x, z: g.P.z };
  var st = null;
  for (var i = 0; i < STEPS.length; i++) { var s = STEPS[i]; if (SEEN[s.id]) continue; if (s.on()) { if (s.done()) { SEEN[s.id] = true; keep(); if (s.id !== 'move') SB.snd('ding'); continue; } st = s; break; } }
  show(st);
};
})();
