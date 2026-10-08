/* 화면: 제목 · 층별 판 고르기 · 놀이 · 클리어 · 엔딩 */
(function(){
const $ = id => document.getElementById(id);
const ov = $('ov'), panel = $('panel');
let cur = 0, floorTab = 0;
function show(html){ panel.innerHTML = html; ov.classList.remove('hide'); }
function hide(){ ov.classList.add('hide'); }
function stars(n, big){ let s = ''; for(let i = 0; i < 3; i++) s += `<i class="st${i < n ? ' on' : ''}${big ? ' big' : ''}"></i>`; return s; }
function lastPlayable(){ let i = 0; while(i + 1 < LEVELS.length && DP.unlocked(i + 1)) i++; return i; }

function title(){
  document.body.dataset.mode = 'title';
  play(lastPlayable(), true);
  show(`<div class="ttl"><h1><span>${L('이중주차', 'DOUBLE PARKING')}</span><b>${L('탈출', 'ESCAPE')}</b></h1>
    <div class="row"><button class="btn main" id="bStart">${DP.prog.stars[0] ? 'CONTINUE' : 'START'}</button><button class="btn" id="bSel">STAGE</button></div></div>`);
  $('bStart').onclick = () => { SFX.click(); play(lastPlayable()); };
  $('bSel').onclick = () => { SFX.click(); select(Math.floor(lastPlayable() / DP.PER_FLOOR)); };
}
function select(f){
  document.body.dataset.mode = 'select'; floorTab = f;
  let tabs = DP.FLOORS.map((n, i) => `<button class="tab${i === f ? ' on' : ''}" data-f="${i}" style="--fc:${LOOK.FLOOR_COL[i]}">${n}</button>`).join('');
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  let tiles = '';
  for(let k = 0; k < DP.PER_FLOOR; k++){ const idx = f*DP.PER_FLOOR + k; if(idx >= LEVELS.length) break;
    const ok = DP.unlocked(idx), s = DP.prog.stars[idx] || 0;
    const dt = DP.dateOf(idx);
    tiles += `<button class="tile${ok ? '' : ' locked'}${idx === cur ? ' cur' : ''}" data-i="${idx}" ${ok ? '' : 'disabled'}><em>${dt.m}/${dt.d}</em>${ok ? `<b>${k + 1}</b><span>${stars(s)}</span>` : LOCK}</button>`; }
  show(`<div class="sel card"><h3>STAGE</h3><div class="tabs">${tabs}</div><div class="tiles">${tiles}</div><div class="row"><button class="btn" id="bBack">BACK</button></div></div>`);
  panel.querySelectorAll('.tab').forEach(b => b.onclick = () => { SFX.click(); select(+b.dataset.f); });
  panel.querySelectorAll('.tile').forEach(b => b.onclick = () => { SFX.click(); play(+b.dataset.i); });
  $('bBack').onclick = () => { SFX.click(); title(); };
}
function play(idx, behind){
  cur = idx; W.S = DP.build(idx); W.drag = null; W.exit = 0; W.parts = []; W.hint = idx === 0;
  W.onWin = cleared; W.onMove = hud; hud();
  if(!behind){ document.body.dataset.mode = 'play'; hide(); }
}
function hud(){ const S = W.S; $('hStage').textContent = DP.stageName(S.idx); $('hDate').textContent = DP.dateText(S.idx); $('hMoves').textContent = S.moves; $('hMin').textContent = S.min; clock(); }
// 출근 시계: 09:00 이 넘으면 빨갛게
function clock(){ const S = W.S; if(!S) return; const c = DP.clockOf(S.idx, S.clock), el = $('hClock'); if(el.textContent !== c.text) el.textContent = c.text; el.classList.toggle('late', c.late); }
setInterval(clock, 250);
function cleared(){
  const S = W.S, n = DP.starsFor(S), p = DP.prog, c = DP.clockOf(S.idx, S.clock);
  p.stars[S.idx] = Math.max(p.stars[S.idx] || 0, n); p.best[S.idx] = Math.min(p.best[S.idx] || 999, S.moves);
  p.late[S.idx] = p.late[S.idx] === undefined ? c.late : (p.late[S.idx] && c.late);       // 한 번이라도 정시면 그날은 정시
  DP.saveProg();
  SFX.win(); confetti();
  const last = S.idx + 1 >= LEVELS.length, floorEnd = (S.idx + 1) % DP.PER_FLOOR === 0;
  document.body.dataset.mode = 'clear';
  show(`<div class="clr card${c.late ? ' late' : ''}"><h3>${DP.dateText(S.idx)} · ${DP.stageName(S.idx)}</h3><h2>${c.late ? L('지각', 'LATE') : L('정시 출근', 'ON TIME')}</h2><div class="time">${c.late ? c.text : '09:00:00'}</div><div class="stars">${stars(0, true)}</div>
    <div class="res"><div><span class="k">${L('이동', 'MOVES')}</span><span class="v">${S.moves}</span></div><div><span class="k">${L('목표', 'BEST')}</span><span class="v">${S.min}</span></div></div>
    <div class="row"><button class="btn" id="bRe">RETRY</button><button class="btn main" id="bNext">${last ? 'ENDING' : 'NEXT'}</button><button class="btn" id="bMenu">STAGE</button></div></div>`);
  const els = panel.querySelectorAll('.st');
  for(let i = 0; i < n; i++) setTimeout(() => { els[i].classList.add('on', 'pop'); SFX.star(i); }, 350 + i*260);
  $('bNext').onclick = () => { SFX.click(); last ? ending() : play(S.idx + 1); };
  $('bRe').onclick = () => { SFX.click(); play(S.idx); };
  $('bMenu').onclick = () => { SFX.click(); select(Math.floor(S.idx / DP.PER_FLOOR)); };
}
function ending(){
  document.body.dataset.mode = 'ending';
  let tot = 0; for(let i = 0; i < LEVELS.length; i++) tot += DP.prog.stars[i] || 0;
  const late = DP.lateDays(), a = DP.dateOf(0), b = DP.dateOf(LEVELS.length - 1);
  show(`<div class="end card"><h3>${DP.dateText(0)} – ${DP.dateText(LEVELS.length - 1)}</h3><h2>${DP.rankOf(late) === '사원' ? L('이번엔 사원 그대로', 'Still on staff') : L('승진을 축하합니다', 'You got promoted!')}</h2><div class="rank${DP.rankOf(late) === '사원' ? ' stay' : ''}${EN ? ' en' : ''}">${DP.rankName(DP.rankOf(late))}</div>
    <p>${L(`지각 ${late}일`, `Late ${late} day${late === 1 ? '' : 's'}`)} · <i class="st on"></i> ${tot} / ${LEVELS.length*3}</p>
    <div class="row"><button class="btn main" id="bT">TITLE</button></div></div>`);
  $('bT').onclick = () => { SFX.click(); title(); };
}
function confetti(){ R.confetti(); }
$('bUndo').onclick = () => { CTRL.undo(); };
$('bRetry').onclick = () => { SFX.click(); play(cur); };
$('bMenu2').onclick = () => { SFX.click(); select(Math.floor(cur / DP.PER_FLOOR)); };
$('bSnd').onclick = () => { SFX.setOn(!SFX.on); $('bSnd').classList.toggle('off', !SFX.on); };
$('bSnd').classList.toggle('off', !SFX.on);
window.UI = { title, select, play, hud };
})();
