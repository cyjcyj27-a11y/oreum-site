/* 조작 · 매 프레임 (판 좌표: 한 칸 = 1) */
(function(){
const cv = document.getElementById('cv');
function bump(i, dirSign){
  const v = W.S.V[i]; v.shake = 0.35; SFX.bump();
  const [x, y, w, h] = R.vRect(v);
  R.dust(v.h ? (dirSign > 0 ? x + w : x) : x + .5, v.h ? y + .5 : (dirSign > 0 ? y + h : y), 6);
}
function commit(i, newP){
  const S = W.S, v = S.V[i];
  if(newP === v.p) return;
  S.hist.push([i, v.p]); const n = Math.abs(newP - v.p); v.p = newP; S.moves++;
  SFX.roll(n); W.hint = false;
  if(W.onMove) W.onMove();
  if(i === 0 && v.p === DP.N - v.len) win();
}
function win(){ const S = W.S; if(S.won) return; S.won = true; W.exit = 0.0001; SFX.gate(); setTimeout(() => SFX.vroom(), 180); }
cv.addEventListener('pointerdown', e => {
  const S = W.S; if(!S || S.won) return; SFX.wake();
  const i = R.pick(e.clientX, e.clientY); if(i < 0) return;
  const v = S.V[i];
  try{ cv.setPointerCapture(e.pointerId); }catch(err){}
  const [x, y] = R.toBoard(e.clientX, e.clientY);
  const [lo, hi] = DP.range(S, i);
  W.drag = { i, x0:x, y0:y, p0:v.p, lo, hi, moved:false, bumped:0, id:e.pointerId, sx:e.clientX, sy:e.clientY };
  SFX.grab();
});
cv.addEventListener('pointermove', e => {
  const d = W.drag; if(!d || e.pointerId !== d.id) return;
  const [x, y] = R.toBoard(e.clientX, e.clientY), v = W.S.V[d.i];
  const raw = v.h ? x - d.x0 : y - d.y0;
  if(Math.abs(raw) > 0.2 || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 12) d.moved = true;
  let q = d.p0 + raw;
  const isRed = d.i === 0;
  if(q < d.lo){ if(q < d.lo - 0.3 && d.bumped !== -1){ d.bumped = -1; bump(d.i, -1); } q = d.lo - Math.min(0.12, (d.lo - q)*0.2); }
  else if(q > d.hi){ if(isRed && d.hi === DP.N - v.len && q > d.hi + 0.35){ v.vis = d.hi; W.drag = null; commit(0, d.hi); if(!W.S.won) win(); return; }
    if(q > d.hi + 0.3 && d.bumped !== 1){ d.bumped = 1; bump(d.i, 1); } q = d.hi + Math.min(0.12, (q - d.hi)*0.2); }
  else d.bumped = 0;
  v.vis = q;
});
function release(e){
  const d = W.drag; if(!d || e.pointerId !== d.id) return; W.drag = null;
  const v = W.S.V[d.i];
  if(!d.moved){                                                  // 두드리기: 앞이 향한 쪽으로 갈 수 있는 데까지
    const fwd = (v.dir === 'R' || v.dir === 'D') ? 1 : -1, target = fwd > 0 ? d.hi : d.lo;
    v.vis = v.p;
    if(target === v.p) bump(d.i, fwd); else commit(d.i, target);
    return;
  }
  commit(d.i, Math.max(d.lo, Math.min(d.hi, Math.round(v.vis))));
}
cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);

function undo(){ const S = W.S; if(!S || S.won || !S.hist.length) return; const [i, p] = S.hist.pop(); S.V[i].p = p; S.moves++; SFX.undo(); if(W.onMove) W.onMove(); }

let last = 0;
function tick(ts){
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; step(dt); R.render(dt); requestAnimationFrame(tick);
}
function step(dt){
  W.t += dt; const S = W.S; if(!S) return;
  if(!S.won && document.body.dataset.mode === 'play') S.clock += dt;          // 출근 시계(놀 때만)
  for(let i = 0; i < S.V.length; i++){ const v = S.V[i];
    if(v.shake > 0) v.shake = Math.max(0, v.shake - dt);
    if(v.blink > 0) v.blink -= dt;
    if(W.drag && W.drag.i === i) continue;
    if(S.won && i === 0) continue;
    const dv = v.p - v.vis;
    if(Math.abs(dv) > 0.001){ const sp = 12*dt; const was = Math.abs(dv); v.vis += Math.sign(dv)*Math.min(was, sp);
      if(Math.abs(v.p - v.vis) < 0.001){ v.vis = v.p; SFX.stop(); const [x, y, w, h] = R.vRect(v); R.dust(x + w/2, y + h/2, 3); } }
  }
  // 이겼으면 빨간 차가 출구로
  if(S.won){ W.exit += dt; const v = S.V[0]; v.vis = Math.min(DP.N + 4, v.vis + dt*(1.5 + W.exit*9));
    if(W.exit > 0.12 && Math.random() < .35) R.dust(v.vis + .1, v.f + .5 + (Math.random() - .5)*.5, 1);
    if(W.exit > 1.25 && W.onWin){ const f = W.onWin; W.onWin = null; f(); } }
}
window.CTRL = { undo, step, tick, win };
})();
