/* 이중주차 탈출 — 판 · 규칙 */
(function(){
const { CELL, GX, GY, SW, SH } = SCENE;
const N = 6, PER_FLOOR = 10;
const FLOORS = ['1F', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'];   // 10층 × 10판 = 100판(10/9)
const SAVE = 'doublepark.prog100';                 // 판 순서가 바뀌어 새 저장
let prog = { stars:{}, best:{}, late:{} };
try{ const r = localStorage.getItem(SAVE); if(r) prog = Object.assign(prog, JSON.parse(r)); }catch(e){}
function saveProg(){ try{ localStorage.setItem(SAVE, JSON.stringify(prog)); }catch(e){} }

/* 판 하나를 놀이용으로 펼친다. 차마다 색·종류·앞 방향·사이드 여부 */
function build(idx){
  const L = LEVELS[idx], floor = Math.floor(idx / PER_FLOOR);
  let sd = idx*977 + 13; const rr = () => (sd = (sd*16807) % 2147483647) / 2147483647;
  const cols = ART.CAR_COLORS.slice(); for(let i = cols.length - 1; i > 0; i--){ const j = Math.floor(rr()*(i+1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
  const V = L.v.map((v, i) => {
    const [f, len, h] = v;
    const dir = i === 0 ? 'R' : h ? (rr() < .5 ? 'R' : 'L') : (rr() < .5 ? 'U' : 'D');
    const kind = i === 0 ? 'hero' : len === 3 ? (rr() < .5 ? 'truck' : 'bus') : ['sedan', 'sedan', 'suv', 'compact', 'van', 'sports'][Math.floor(rr()*6)];
    return { f, len, h:!!h, p:L.s[i], vis:L.s[i], dir, kind,
      col: i === 0 ? 'red' : cols[(i - 1) % cols.length], taxi: kind === 'sedan' && rr() < .25,
      cargo: ['#d8c8a0', '#c8d8e8', '#e8d0a8'][i % 3],
      shake:0, blink:0 };
  });
  return { idx, floor, V, min:L.min, moves:0, hist:[], won:false, exitT:0, clock:0 };
}
function grid(S, skip){
  const g = []; for(let r = 0; r < N; r++) g.push(new Array(N).fill(-1));
  S.V.forEach((v, i) => { if(i === skip) return; for(let k = 0; k < v.len; k++){ const r = v.h ? v.f : v.p + k, c = v.h ? v.p + k : v.f; g[r][c] = i; } });
  return g;
}
/* i 번 차가 갈 수 있는 범위 [lo, hi] */
function range(S, i){
  const v = S.V[i], g = grid(S, i);
  let lo = v.p, hi = v.p;
  const free = q => { for(let k = 0; k < v.len; k++){ const r = v.h ? v.f : q + k, c = v.h ? q + k : v.f; if(r < 0 || c < 0 || r >= N || c >= N || g[r][c] !== -1) return false; } return true; };
  while(lo - 1 >= 0 && free(lo - 1)) lo--;
  while(hi + 1 + v.len <= N && free(hi + 1)) hi++;
  return [lo, hi];
}
function starsFor(S){ const m = S.moves, n = S.min; return m <= n + 2 ? 3 : m <= Math.ceil(n*1.6) + 4 ? 2 : 1; }
/* 한 판 = 출근하는 하루. 1월 1일부터 하루씩(10/9 사장님 "1월 1일"), 요일은 안 씀 */
function dateOf(idx){ const d = new Date(2027, 0, 1 + idx); return { m:d.getMonth() + 1, d:d.getDate() }; }
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateText(idx){ const t = dateOf(idx); return L(`${t.m}월 ${t.d}일`, `${MON[t.m - 1]} ${t.d}`); }
/* 출근 시계: 판마다 1분 30초(10/9 사장님). 시작하면 08:58:30 부터 진짜 초로 흐르고 09:00:00 을 넘기면 지각 */
const LIMIT = 90;
function limitOf(){ return LIMIT; }
function clockOf(idx, sec){ const tot = 8*3600 + 58*60 + 30 + Math.floor(sec), p = n => (n < 10 ? '0' : '') + n;
  return { late:sec > LIMIT, text:p(Math.floor(tot/3600)) + ':' + p(Math.floor(tot/60) % 60) + ':' + p(tot % 60) }; }
/* 엔딩 직급: 지각한 날 수로 */
function rankOf(lateDays){ return lateDays <= 10 ? '팀장' : lateDays <= 25 ? '과장' : lateDays <= 50 ? '대리' : '사원'; }
const RANK_EN = { '사원':'Staff', '대리':'Assistant Manager', '과장':'Manager', '팀장':'Team Leader' };
function rankName(r){ return L(r, RANK_EN[r]); }   // 사원(그대로) < 대리 < 과장 < 팀장. 100일 중 지각 10·25·50일 기준
function lateDays(){ let n = 0; for(let i = 0; i < LEVELS.length; i++) if(prog.late[i]) n++; return n; }
function stageName(idx){ return FLOORS[Math.floor(idx / PER_FLOOR)] + '-' + (idx % PER_FLOOR + 1); }
function unlocked(idx){ return idx === 0 || prog.stars[idx - 1] > 0 || prog.stars[idx] > 0; }
window.DP = { N, PER_FLOOR, FLOORS, prog, saveProg, build, grid, range, starsFor, stageName, unlocked, dateOf, dateText, limitOf, clockOf, rankOf, rankName, lateDays, MON };
})();
