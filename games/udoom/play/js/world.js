/* 격자 맵 → Three.js 메쉬(벽·바닥·천장을 재질별로 합침), 문·비밀벽·출구 스위치, 충돌·시선 검사 */
window.World = (function(){
const CS = 2.0; // 셀 한 변(m)
const texLoader = new THREE.TextureLoader();
const texCache = {};
function tex(id){
  if(texCache[id]) return texCache[id];
  const t = texLoader.load((window.TEX_DATA&&window.TEX_DATA[id])||('assets/tex/'+id+'_C.jpg')); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
  texCache[id]=t; return t;
}
function mat(id, extra){ const m=new THREE.MeshLambertMaterial(Object.assign({map:tex(id), vertexColors:true}, extra||{})); return m; }
// 10/19 사장님 "문에 질감 넣어줘" → (처음엔 판·리벳 그림을 그렸다가 "질감을 주라는 거였어") 문 모양은 그대로,
// 그 에피소드 금속 사진을 늘이지 않고 1m 크기로 반복 + 요철(_N)·거칠기(_R) 지도로 빛을 받으면 긁힘·우툴두툴함이 보이게
const doorCache = {};
function doorMat(id){
  if(doorCache[id]) return doorCache[id];
  const off=!!window.TEX_DATA;   // 더블클릭(file://) 사본엔 색 사진만 있음
  const ld=(suf,srgb)=>{ const t=texLoader.load(suf==='C'&&off?window.TEX_DATA[id]:('assets/tex/'+id+'_'+suf+'.jpg')); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,3); t.anisotropy=4; if(srgb) t.colorSpace=THREE.SRGBColorSpace; return t; };
  const o={map:ld('C',true), roughness:1, metalness:0.05, color:new THREE.Color(1.35,1.35,1.35)};   // 벽(램버트)보다 어둡게 나와 살짝 밝힘
  if(!off){ o.normalMap=ld('N',false); o.normalScale=new THREE.Vector2(1.6,1.6); o.roughnessMap=ld('R',false); }
  return doorCache[id]=new THREE.MeshStandardMaterial(o);
}
class World {
  constructor(scene, map, theme){
    this.scene=scene; this.map=map; this.theme=theme; this.group=new THREE.Group(); scene.add(this.group);
    this.doors=[]; this.secrets=[]; this.exitUsed=false; this.secretsFound=0; this.t=0;
    this.build();
  }
  idx(x,y){ return y*this.map.W+x; }
  cellAt(wx,wz){ return [Math.floor(wx/CS), Math.floor(wz/CS)]; }
  cell(cx,cz){ const m=this.map; if(cx<0||cz<0||cx>=m.W||cz>=m.H) return 0; return m.g[cz*m.W+cx]; }
  build(){
    const m=this.map, th=this.theme;
    const parts={wall:[],floor:[],ceil:[],door:[]};
    const push=(arr,quad,uv,col)=>{ arr.push({quad,uv,col}); };
    for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){
      const k=this.idx(x,y), v=m.g[k]; if(v===0) continue;
      const lt=m.light[k], ch=m.ceil[k];
      const x0=x*CS,x1=x0+CS,z0=y*CS,z1=z0+CS;
      // 네 귀퉁이마다 주변 셀이 막혔는지 세어 어둡게(가짜 그림자)
      const ao=[]; for(const [cx,cz] of [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]){ let sol=0; for(const [ox,oz] of [[-1,-1],[0,-1],[-1,0],[0,0]]){ if(this.cell(cx+ox,cz+oz)===0) sol++; } ao.push(sol>=3?0.45:sol===2?0.62:sol===1?0.82:1); }
      if(v===m.LAVA){
        // 구덩이 바닥·옆면
        push(parts.floor,[[x0,-0.3,z0],[x1,-0.3,z0],[x1,-0.3,z1],[x0,-0.3,z1]],[x,y,x+1,y+1],lt*0.8);
        for(const [nx,ny,q] of [[x,y-1,[[x0,0,z0],[x1,0,z0],[x1,-0.3,z0],[x0,-0.3,z0]]],[x,y+1,[[x1,0,z1],[x0,0,z1],[x0,-0.3,z1],[x1,-0.3,z1]]],[x-1,y,[[x0,0,z1],[x0,0,z0],[x0,-0.3,z0],[x0,-0.3,z1]]],[x+1,y,[[x1,0,z0],[x1,0,z1],[x1,-0.3,z1],[x1,-0.3,z0]]]]){
          if(this.cell(nx,ny)!==m.LAVA) push(parts.wall,q,[0,0,1,0.15],lt*0.7);
        }
      } else {
        push(parts.floor,[[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]],[x,y,x+1,y+1],[lt*ao[0],lt*ao[1],lt*ao[2],lt*ao[3]]);
      }
      push(parts.ceil,[[x0,ch,z1],[x1,ch,z1],[x1,ch,z0],[x0,ch,z0]],[x,y,x+1,y+1],[lt*0.8*ao[3],lt*0.8*ao[2],lt*0.8*ao[1],lt*0.8*ao[0]]);
      // 벽: 이웃이 막혀 있으면 바닥~천장, 이웃 천장이 낮으면 그 차이만큼
      const nb=[[x,y-1,[x0,z0,x1,z0],0.92],[x+1,y,[x1,z0,x1,z1],1.0],[x,y+1,[x1,z1,x0,z1],0.92],[x-1,y,[x0,z1,x0,z0],1.0]];
      for(const [nx,ny,e,shade] of nb){
        const nv=this.cell(nx,ny);
        let y0=0,y1=ch;
        if(nv!==0){ const nk=this.idx(nx,ny); const nch=m.ceil[nk]; if(nch>=ch) continue; y0=nch; }
        const q=[[e[0],y1,e[1]],[e[2],y1,e[3]],[e[2],y0,e[3]],[e[0],y0,e[1]]];
        const isDoorSide = (v===m.DOOR||v===m.LDOOR);
        const top=lt*shade*(y1>=ch?0.78:1), bot=lt*shade*(y0<=0?0.6:0.9);
        push(isDoorSide?parts.door:parts.wall, q, [0,y0/CS,1,y1/CS], [top,top,bot,bot]);
      }
    }
    this.addMerged(parts.wall, mat(th.wall));
    this.addMerged(parts.door, mat(th.door));
    this.addMerged(parts.floor, mat(th.floor));
    this.addMerged(parts.ceil, mat(th.ceil));
    this.buildLava(); this.buildDoors(); this.buildSecrets(); this.buildExit(); this.buildLamps();
  }
  addMerged(list, material){
    if(!list.length) return;
    const n=list.length; const pos=new Float32Array(n*12), uv=new Float32Array(n*8), col=new Float32Array(n*12), idx=new Uint32Array(n*6);
    list.forEach((it,i)=>{
      const q=it.quad, u=it.uv, c=it.col;
      for(let j=0;j<4;j++){ pos.set(q[j],i*12+j*3); const cj=Array.isArray(c)?c[j]:c; col.set([cj,cj,cj],i*12+j*3); }
      // uv: 사각형 네 점 (u0,v0)(u1,v0)(u1,v1)(u0,v1) — 벽은 [0,y0,1,y1] 순서로 위→아래
      uv.set([u[0],u[3], u[2],u[3], u[2],u[1], u[0],u[1]], i*8);
      idx.set([i*4,i*4+2,i*4+1, i*4,i*4+3,i*4+2], i*6);
    });
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setAttribute('color',new THREE.BufferAttribute(col,3)); g.setIndex(new THREE.BufferAttribute(idx,1)); g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,material); mesh.frustumCulled=false; this.group.add(mesh);
  }
  buildLamps(){
    const m=this.map, th=this.theme; this.lamps=[]; const R=MapGen.rng(m.W*31+7);
    const warm=th.lava?0xff7a30:(th.wall==='Bricks059'?0xffd9a0:0xdfe8ff);
    const lampGeo=new THREE.PlaneGeometry(0.9,0.5); const lampMat=new THREE.MeshBasicMaterial({color:warm});
    for(const r of m.rooms){ const n=(r.w*r.h>20)?2:1; for(let i=0;i<n;i++){ const lx=(r.x+(n===1?r.w/2:(i===0?r.w*0.3:r.w*0.7)))*CS, lz=(r.y+r.h/2)*CS; const ch=r.ceil; const mesh=new THREE.Mesh(lampGeo,lampMat); mesh.rotation.x=Math.PI/2; mesh.position.set(lx,ch-0.02,lz); this.group.add(mesh); this.lamps.push({x:lx,y:ch-0.4,z:lz,color:warm,flicker:r.flicker,mesh,base:(th.lava?1.6:1.3)}); } }
    this.lightPool=[]; for(let i=0;i<8;i++){ const l=new THREE.PointLight(warm,0,12,1.4); this.group.add(l); this.lightPool.push(l); }
  }
  updateLamps(px,pz,dt){
    if(!this.lamps||!this.lamps.length) return; this.lampT=(this.lampT||0)+dt;
    const near=this.lamps.map(l=>({l,d:(l.x-px)**2+(l.z-pz)**2})).sort((a,b)=>a.d-b.d).slice(0,this.lightPool.length);
    this.lightPool.forEach((pl,i)=>{ const e=near[i]; if(!e||e.d>900){ pl.intensity=0; return; } const l=e.l; let k=l.base; if(l.flicker){ k*= (Math.sin(this.lampT*23+l.x)>0.8?0.25:1)*(0.85+0.15*Math.sin(this.lampT*7+l.z)); l.mesh.material=l.mesh.material; } pl.position.set(l.x,l.y,l.z); pl.color.setHex(l.color); pl.intensity=k*(l.flicker?1:1)*Math.max(0.2,1-Math.sqrt(e.d)/40); });
  }
  buildLava(){
    const m=this.map; const cells=[]; for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++) if(m.g[this.idx(x,y)]===m.LAVA) cells.push([x,y]);
    if(!cells.length) return;
    const t=tex('Lava004'); const mt=new THREE.MeshBasicMaterial({map:t}); const g=new THREE.PlaneGeometry(CS,CS); g.rotateX(-Math.PI/2);
    const im=new THREE.InstancedMesh(g,mt,cells.length); const o=new THREE.Object3D();
    cells.forEach(([x,y],i)=>{ o.position.set(x*CS+CS/2,-0.28,y*CS+CS/2); o.updateMatrix(); im.setMatrixAt(i,o.matrix); });
    this.lava=im; this.group.add(im);
  }
  buildDoors(){
    const m=this.map; const dmat=mat(this.theme.door,{vertexColors:false});
    for(const k of m.doorCells.concat(Object.keys(m.lockOf).map(Number))){
      if(m.g[k]!==m.DOOR && m.g[k]!==m.LDOOR) continue;
      if(this.doors.find(d=>d.k===k)) continue;
      const x=k%m.W, y=(k/m.W)|0; const ch=m.ceil[k];
      const ew = this.cell(x-1,y)===0 && this.cell(x+1,y)===0;
      const geo=new THREE.BoxGeometry(ew?CS:0.3, ch, ew?0.3:CS);
      const face=doorMat(this.theme.door).clone(); const side=dmat.clone();
      // BoxGeometry 면 순서 +x,-x,+y,-y,+z,-z: 문 넓은 앞뒤 면에만 문 그림
      const mats=ew?[side,side,side,side,face,face]:[face,face,side,side,side,side];
      const mesh=new THREE.Mesh(geo, mats); mesh.position.set(x*CS+CS/2, ch/2, y*CS+CS/2);
      const lock=m.lockOf[k];
      if(lock){ const c={R:0xe8302a,Y:0xf2c230,B:0x2f6fd6}[lock]; const band=new THREE.Mesh(new THREE.BoxGeometry(ew?CS+0.02:0.34, 0.3, ew?0.34:CS+0.02), new THREE.MeshBasicMaterial({color:c})); band.position.y=0.2; mesh.add(band); }
      this.group.add(mesh);
      this.doors.push({k,x,y,mesh,ch,state:0,t:0,open:0,lock,ew});
    }
  }
  buildSecrets(){
    const m=this.map; const smat=mat(this.theme.wall,{vertexColors:false});
    for(const k of m.secrets){
      const x=k%m.W, y=(k/m.W)|0; const ch=3.2;
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(CS,ch,CS), smat); mesh.position.set(x*CS+CS/2,ch/2,y*CS+CS/2); mesh.material.color.setHex(0xf0f0f0);
      this.group.add(mesh); this.secrets.push({k,x,y,mesh,ch,open:0,found:false});
    }
  }
  buildExit(){
    const m=this.map, e=m.exit; const x=e.x,y=e.y; const dx=e.ix-e.x, dz=e.iy-e.y;
    const cv=document.createElement('canvas'); cv.width=128; cv.height=128; const c=cv.getContext('2d');
    c.fillStyle='#2a2a30'; c.fillRect(0,0,128,128); c.fillStyle='#555'; c.fillRect(8,8,112,112);
    c.fillStyle='#e8302a'; c.fillRect(34,34,60,60); c.fillStyle='#ffd24a'; c.font='bold 28px monospace'; c.textAlign='center'; c.fillText('EXIT',64,118);
    const t=new THREE.CanvasTexture(cv); const mt=new THREE.MeshBasicMaterial({map:t});
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2), mt);
    panel.position.set(x*CS+CS/2+dx*(CS/2+0.02), 1.5, y*CS+CS/2+dz*(CS/2+0.02));
    panel.lookAt(panel.position.x+dx, 1.5, panel.position.z+dz);
    this.group.add(panel); this.exitPanel=panel; this.exitPos=new THREE.Vector3(x*CS+CS/2+dx*CS, 1.2, y*CS+CS/2+dz*CS);
    const glow=new THREE.PointLight(0xff4a2a,1.2,6); glow.position.copy(this.exitPos); glow.position.y=1.6; this.group.add(glow);
  }
  solidFor(cx,cz,who){
    const v=this.cell(cx,cz);
    if(v===0) return true;
    if(v===this.map.SECRET){ const s=this.secrets.find(s=>s.x===cx&&s.y===cz); return !(s&&s.open>=0.95); }
    if(v===this.map.EXIT) return true;
    if(v===this.map.DOOR||v===this.map.LDOOR){ const d=this.doors.find(d=>d.x===cx&&d.y===cz); return !(d&&d.open>=0.7); }
    if(v===this.map.LAVA && who==='monster') return true;
    return false;
  }
  moveCircle(p,r,dx,dz,who){ p.x+=dx; this.pushOut(p,r,who,true); p.z+=dz; this.pushOut(p,r,who,false); }
  pushOut(p,r,who,axisX){
    const cx=Math.floor(p.x/CS), cz=Math.floor(p.z/CS);
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const tx=cx+i, tz=cz+j; if(!this.solidFor(tx,tz,who)) continue;
      const x0=tx*CS,x1=x0+CS,z0=tz*CS,z1=z0+CS;
      const nx=Math.max(x0,Math.min(p.x,x1)), nz=Math.max(z0,Math.min(p.z,z1));
      let ddx=p.x-nx, ddz=p.z-nz; const d2=ddx*ddx+ddz*ddz;
      if(d2>=r*r) continue;
      if(d2<1e-6){ if(axisX) p.x += (p.x<x0+CS/2?-1:1)*(r); else p.z += (p.z<z0+CS/2?-1:1)*(r); continue; }
      const d=Math.sqrt(d2); const push=(r-d)/d; p.x+=ddx*push; p.z+=ddz*push;
    }
  }
  rayWall(ox,oz,dx,dz,maxD,who){
    let cx=Math.floor(ox/CS), cz=Math.floor(oz/CS);
    const sx=dx>0?1:-1, sz=dz>0?1:-1;
    const tdx=Math.abs(CS/dx), tdz=Math.abs(CS/dz);
    let tx=dx>0?((cx+1)*CS-ox)/dx:(cx*CS-ox)/dx, tz=dz>0?((cz+1)*CS-oz)/dz:(cz*CS-oz)/dz;
    if(!isFinite(tx)) tx=1e9; if(!isFinite(tz)) tz=1e9;
    let t=0, side=0;
    for(let i=0;i<200;i++){
      if(tx<tz){ t=tx; tx+=tdx; cx+=sx; side=0; } else { t=tz; tz+=tdz; cz+=sz; side=1; }
      if(t>maxD) return null;
      if(this.solidFor(cx,cz,who||'shot')) return {x:ox+dx*t,z:oz+dz*t,d:t,nx:side===0?-sx:0,nz:side===1?-sz:0,cx,cz};
    }
    return null;
  }
  los(ax,az,bx,bz){ const dx=bx-ax,dz=bz-az; const d=Math.hypot(dx,dz); if(d<0.01) return true; return !this.rayWall(ax,az,dx/d,dz/d,d,'shot'); }
  use(px,pz,fx,fz,keys){
    const h=this.rayWall(px,pz,fx,fz,2.2,'shot');
    const tryCells = h ? [[h.cx,h.cz]] : [];
    const pc=Math.floor(px/CS), pz2=Math.floor(pz/CS); tryCells.push([pc+Math.round(fx),pz2+Math.round(fz)]);
    for(const [tx,tz] of tryCells){
      const v=this.cell(tx,tz);
      if(v===this.map.DOOR||v===this.map.LDOOR){ const d=this.doors.find(d=>d.x===tx&&d.y===tz); if(d) return this.openDoor(d,keys); }
      if(v===this.map.SECRET){ const s=this.secrets.find(s=>s.x===tx&&s.y===tz); if(s&&!s.found){ s.found=true; this.secretsFound++; return {type:'secret'}; } }
      if(v===this.map.EXIT){ if(!this.exitUsed){ this.exitUsed=true; return {type:'exit'}; } }
    }
    return null;
  }
  openDoor(d,keys){
    if(d.lock && !(keys&&keys[d.lock])) return {type:'locked',lock:d.lock};
    if(d.state===0||d.state===3){ d.state=1; return {type:'door'}; }
    return null;
  }
  touchDoors(p,r,keys){
    const cx=Math.floor(p.x/CS), cz=Math.floor(p.z/CS);
    for(const d of this.doors){ if(Math.abs(d.x-cx)<=1&&Math.abs(d.y-cz)<=1){ const dxx=Math.abs(p.x-(d.x*CS+CS/2)), dzz=Math.abs(p.z-(d.y*CS+CS/2)); if(dxx<CS/2+r+0.3&&dzz<CS/2+r+0.3){ if(d.state===0||d.state===3){ if(!d.lock||(keys&&keys[d.lock])){ d.state=1; return 'door'; } else if(keys) return 'locked'+d.lock; } } } }
    return null;
  }
  update(dt, player){
    this.t+=dt; if(player) this.updateLamps(player.x,player.z,dt); else this.updateLamps(this.map.start.x*CS,this.map.start.y*CS,dt);
    for(const d of this.doors){
      const near = player && Math.hypot(player.x-(d.x*CS+CS/2), player.z-(d.y*CS+CS/2))<2.2;
      if(d.state===1){ d.open=Math.min(1,d.open+dt*1.6); if(d.open>=1){ d.state=2; d.t=0; } }
      else if(d.state===2){ d.t+=dt; if(d.t>3.5 && !near) d.state=3; }
      else if(d.state===3){ if(near){ d.state=1; } else { d.open=Math.max(0,d.open-dt*1.6); if(d.open<=0) d.state=0; } }
      d.mesh.position.y = d.ch/2 + d.open*(d.ch-0.15);
    }
    for(const s of this.secrets){ if(s.found && s.open<1){ s.open=Math.min(1,s.open+dt*0.6); s.mesh.position.y = s.ch/2 - s.open*(s.ch-0.02); } }
    if(this.lava){ this.lava.material.map.offset.x=Math.sin(this.t*0.3)*0.1; this.lava.material.map.offset.y=this.t*0.03; }
    if(this.exitPanel){ this.exitPanel.material.color.setScalar(0.8+0.2*Math.sin(this.t*4)); }
  }
  dispose(){ this.scene.remove(this.group); this.group.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
}
return {World, CS, tex};
})();
