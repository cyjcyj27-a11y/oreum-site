/* 절차 생성 맵: 방 + 복도 + 문 + 열쇠 잠금 + 비밀 벽 + 출구. 셀 1 = 2m */
window.MapGen = (function(){
const SOLID=0, FLOOR=1, DOOR=2, LDOOR=3, SECRET=4, EXIT=5, LAVA=6;
function rng(seed){ let s=seed>>>0||1; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function gen(def){
  const R = rng(def.seed), W = def.size, H = def.size;
  const g = new Uint8Array(W*H);
  const room = new Int16Array(W*H).fill(-1);
  const light = new Float32Array(W*H).fill(0.6);
  const ceil = new Float32Array(W*H).fill(3.2);
  const lockOf = {};
  const rooms = [];
  const idx=(x,y)=>y*W+x;
  let tries=0;
  while(rooms.length<def.rooms && tries<600){
    tries++;
    const w = 3+Math.floor(R()*6), h = 3+Math.floor(R()*6);
    const x = 2+Math.floor(R()*(W-w-4)), y = 2+Math.floor(R()*(H-h-4));
    let ok=true;
    for(const r of rooms){ if(x<r.x+r.w+2 && x+w+2>r.x && y<r.y+r.h+2 && y+h+2>r.y){ ok=false; break; } }
    if(!ok) continue;
    const rm = {x,y,w,h,id:rooms.length,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2),light:def.theme.light[0]+R()*(def.theme.light[1]-def.theme.light[0]),ceil:3.2+(R()<0.35?1.3:0),flicker:R()<0.15,doors:[]};
    rooms.push(rm);
    for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){ g[idx(i,j)]=FLOOR; room[idx(i,j)]=rm.id; light[idx(i,j)]=rm.light; ceil[idx(i,j)]=rm.ceil; }
  }
  const connected=new Set([0]);
  function carve(x,y){ const k=idx(x,y); if(g[k]===SOLID){ g[k]=FLOOR; room[k]=-2; light[k]=0.45+R()*0.25; ceil[k]=2.8; } }
  function corridor(a,b){
    let x=a.cx,y=a.cy; const tx=b.cx,ty=b.cy;
    const stepX=()=>{ while(x!==tx){ x+=Math.sign(tx-x); carve(x,y);} };
    const stepY=()=>{ while(y!==ty){ y+=Math.sign(ty-y); carve(x,y);} };
    if(R()<0.5){stepX();stepY();} else {stepY();stepX();}
  }
  while(connected.size<rooms.length){
    let best=null,bd=1e9;
    for(const a of rooms) if(connected.has(a.id)) for(const b of rooms) if(!connected.has(b.id)){
      const d=Math.abs(a.cx-b.cx)+Math.abs(a.cy-b.cy); if(d<bd){bd=d;best=[a,b];}
    }
    corridor(best[0],best[1]); connected.add(best[1].id);
  }
  const loops = 1+Math.floor(rooms.length/4);
  for(let i=0;i<loops;i++){ const a=rooms[Math.floor(R()*rooms.length)], b=rooms[Math.floor(R()*rooms.length)]; if(a!==b && Math.abs(a.cx-b.cx)+Math.abs(a.cy-b.cy)<W*0.6) corridor(a,b); }
  const doorCells=[];
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    const k=idx(x,y); if(room[k]!==-2) continue;
    const n=[idx(x,y-1),idx(x,y+1),idx(x-1,y),idx(x+1,y)];
    const adjRoom = n.find(q=>room[q]>=0);
    if(adjRoom===undefined) continue;
    const ns = g[n[0]]!==SOLID && g[n[1]]!==SOLID && g[n[2]]===SOLID && g[n[3]]===SOLID;
    const ew = g[n[2]]!==SOLID && g[n[3]]!==SOLID && g[n[0]]===SOLID && g[n[1]]===SOLID;
    if(!(ns||ew)) continue;
    if(n.some(q=>g[q]===DOOR)) continue;
    g[k]=DOOR; doorCells.push(k); rooms[room[adjRoom]].doors.push(k);
  }
  const start = rooms[0];
  const dist = bfs(g,W,H,idx(start.cx,start.cy),()=>true);
  let exitRoom=rooms[1], far=-1;
  for(const r of rooms){ const d=dist[idx(r.cx,r.cy)]; if(d>far && r.id!==0){far=d;exitRoom=r;} }
  const exitWall = pickWall(exitRoom) || pickWall(exitRoom) || {k:idx(exitRoom.x-1,exitRoom.cy),x:exitRoom.x-1,y:exitRoom.cy,ix:exitRoom.x,iy:exitRoom.cy};
  g[exitWall.k]=EXIT;
  const colors=['R','Y','B'];
  let lockedRoom = exitRoom;
  const items=[]; const keys=[];
  const used=new Set([start.id, exitRoom.id]);
  for(let i=0;i<def.keys;i++){
    const c=colors[i];
    if(!lockedRoom.doors.length) break;
    for(const d of lockedRoom.doors){ g[d]=LDOOR; lockOf[d]=c; }
    const d2 = bfs(g,W,H,idx(start.cx,start.cy),k=>!(g[k]===LDOOR));
    let kr=null,kd=-1;
    for(const r of rooms){ if(used.has(r.id)) continue; const d=d2[idx(r.cx,r.cy)]; if(d>=0 && d>kd){kd=d;kr=r;} }
    if(!kr){ for(const d of lockedRoom.doors){ g[d]=DOOR; delete lockOf[d]; } break; }
    used.add(kr.id);
    items.push({type:'key'+c, x:kr.cx+0.5, y:kr.cy+0.5});
    keys.push(c); lockedRoom=kr;
  }
  const secrets=[];
  let sTry=0;
  while(secrets.length<def.secrets && sTry<200){
    sTry++;
    const r=rooms[Math.floor(R()*rooms.length)];
    const w=pickWall(r); if(!w) continue;
    const dx=w.x-w.ix, dy=w.y-w.iy;
    const cells=[]; let ok=true;
    for(let a=1;a<=2&&ok;a++)for(let b=-1;b<=0&&ok;b++){
      const x=w.x+dx*a+(dy!==0?b:0), y=w.y+dy*a+(dx!==0?b:0);
      if(x<1||y<1||x>=W-1||y>=H-1){ok=false;break;}
      const k=idx(x,y); if(g[k]!==SOLID){ok=false;break;}
      for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){ const q=idx(x+xx,y+yy); if(q!==w.k && g[q]!==SOLID && room[q]!==-9 && cells.indexOf(q)<0) ok=false; }
      cells.push(k);
    }
    if(!ok||cells.length<4) continue;
    g[w.k]=SECRET; room[w.k]=-9;
    for(const k of cells){ g[k]=FLOOR; room[k]=-9; light[k]=0.5; ceil[k]=2.8; }
    const c=cells[cells.length-1];
    const loot = secrets.length===0 ? 'armor' : (R()<0.5?'medkit':'mega');
    items.push({type:loot, x:(c%W)+0.5, y:Math.floor(c/W)+0.5, secret:true});
    secrets.push(w.k);
  }
  if(def.theme.lava){
    for(const r of rooms){ if(r.w>=6&&r.h>=6&&r!==start&&r!==exitRoom&&R()<0.5){ for(let j=r.y+2;j<r.y+r.h-2;j++)for(let i=r.x+2;i<r.x+r.w-2;i++){ g[idx(i,j)]=LAVA; } } }
  }
  const monsters=[]; const spots=[];
  for(const r of rooms){ if(r===start) continue; for(let j=r.y;j<r.y+r.h;j++)for(let i=r.x;i<r.x+r.w;i++){ if(g[idx(i,j)]===FLOOR) spots.push({x:i,y:j,r}); } }
  shuffle(spots,R);
  let mi=0; const total=def.monsters;
  for(let i=0;i<total && mi<spots.length;i++){
    const s=spots[mi++]; const t=def.types[Math.floor(R()*def.types.length)];
    monsters.push({type:t, x:s.x+0.5, y:s.y+0.5, a:R()*Math.PI*2});
  }
  if(def.bossType){ monsters.push({type:def.bossType, x:exitRoom.cx+0.5, y:exitRoom.cy+0.5, a:0, boss:true}); }
  if(def.newWeapon){ const r=rooms[1]||rooms[0]; items.push({type:def.newWeapon, x:r.cx+0.5, y:r.cy+0.5}); }
  const nItems = 6 + Math.floor(total*0.7);
  for(let i=0;i<nItems && mi<spots.length;i++){
    const s=spots[mi++]; const u=R();
    // 탄약은 그 판까지 나온 무기 것 중에서(10/19: 전엔 탄알·산탄뿐이라 로켓탄·에너지는 구할 데가 없었음)
    const pool=['ammo','ammo','shells','shells'].concat(def.n>=3?['belt','belt']:[], def.n>=9?['rockets']:[], def.n>=20?['cells']:[]);
    const t = u<0.75? pool[Math.floor((u/0.75)*pool.length)] : u<0.9?'medkit':'armor';
    items.push({type:t, x:s.x+0.5, y:s.y+0.5});
  }
  const barrels=[]; const nBar = 4+Math.floor(R()*5)+def.ep;
  // 10/20 구석 칸(두 벽이 만나는 칸) 드럼통은 벽 사이에 플레이어가 끼어 못 나오는 틈을 만듦 → 건너뜀
  const wallish=(x,y)=>{ const v=g[idx(x,y)]; return v!==FLOOR&&v!==LAVA; };
  for(let i=0;i<nBar && mi<spots.length;){ const s=spots[mi++]; const ex=wallish(s.x-1,s.y)||wallish(s.x+1,s.y), ey=wallish(s.x,s.y-1)||wallish(s.x,s.y+1); if(ex&&ey) continue; barrels.push({x:s.x+0.5,y:s.y+0.5}); i++; }
  items.push({type:'ammo', x:start.cx+1.5, y:start.cy+0.5});
  return {W,H,g,room,light,ceil,rooms,lockOf,start:{x:start.cx+0.5,y:start.cy+0.5,a:0},exit:exitWall,items,monsters,barrels,secrets,doorCells,keys,SOLID,FLOOR,DOOR,LDOOR,SECRET,EXIT,LAVA};
  function pickWall(r){
    for(let t=0;t<40;t++){
      const side=Math.floor(R()*4); let ix,iy,x,y;
      if(side===0){ix=r.x+Math.floor(R()*r.w);iy=r.y;x=ix;y=iy-1;}
      else if(side===1){ix=r.x+Math.floor(R()*r.w);iy=r.y+r.h-1;x=ix;y=iy+1;}
      else if(side===2){ix=r.x;iy=r.y+Math.floor(R()*r.h);x=ix-1;y=iy;}
      else {ix=r.x+r.w-1;iy=r.y+Math.floor(R()*r.h);x=ix+1;y=iy;}
      if(x<1||y<1||x>=W-1||y>=H-1) continue;
      const k=idx(x,y); if(g[k]!==SOLID) continue;
      return {k,x,y,ix,iy};
    }
    return null;
  }
}
function bfs(g,W,H,s,pass){
  const d=new Int32Array(W*H).fill(-1); const q=[s]; d[s]=0;
  for(let h=0;h<q.length;h++){ const k=q[h]; const x=k%W,y=(k/W)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const n=ny*W+nx; if(d[n]>=0||g[n]===0) continue; if(!pass(n)) continue; d[n]=d[k]+1; q.push(n);} }
  return d;
}
function shuffle(a,R){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
return {gen,bfs,rng,SOLID,FLOOR,DOOR,LDOOR,SECRET,EXIT,LAVA};
})();
