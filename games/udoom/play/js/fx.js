/* 효과 2판: 피 덩어리(점+바닥·벽 자국), 불똥, 연기·불덩이 스프라이트, 고기 조각(인스턴스 물리), 총알 구멍, 번쩍 빛, 화면 흔들림 */
window.FX = (function(){
let scene, world, opts;
const T={}; // 캔버스 질감
function mkTex(n,draw){ const cv=document.createElement('canvas'); cv.width=cv.height=n; const c=cv.getContext('2d'); draw(c,n); const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t; }
function rnd(a,b){ return a+Math.random()*(b-a); }
function makeTextures(){
  if(T.blob) return;
  T.blob=mkTex(64,(c,n)=>{ for(let i=0;i<7;i++){ const r=rnd(8,18); c.beginPath(); c.arc(n/2+rnd(-10,10),n/2+rnd(-10,10),r,0,Math.PI*2); c.fillStyle='rgba(255,255,255,'+rnd(.6,1)+')'; c.fill(); } });
  T.spark=mkTex(32,(c,n)=>{ const g=c.createRadialGradient(16,16,0,16,16,16); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.25,'rgba(255,230,150,1)'); g.addColorStop(0.6,'rgba(255,140,40,.5)'); g.addColorStop(1,'rgba(255,80,0,0)'); c.fillStyle=g; c.fillRect(0,0,n,n); });
  T.smoke=mkTex(128,(c,n)=>{ for(let i=0;i<26;i++){ const r=rnd(14,34); const g=c.createRadialGradient(0,0,0,0,0,r); g.addColorStop(0,'rgba(255,255,255,.22)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.save(); c.translate(n/2+rnd(-28,28),n/2+rnd(-28,28)); c.fillStyle=g; c.fillRect(-r,-r,r*2,r*2); c.restore(); } });
  T.fire=mkTex(128,(c,n)=>{ const g=c.createRadialGradient(64,64,0,64,64,62); g.addColorStop(0,'rgba(255,255,230,1)'); g.addColorStop(0.2,'rgba(255,230,120,1)'); g.addColorStop(0.45,'rgba(255,130,30,.95)'); g.addColorStop(0.75,'rgba(200,40,10,.5)'); g.addColorStop(1,'rgba(80,0,0,0)'); c.fillStyle=g; c.fillRect(0,0,n,n); for(let i=0;i<40;i++){ c.beginPath(); c.arc(rnd(10,118),rnd(10,118),rnd(3,10),0,Math.PI*2); c.fillStyle='rgba(60,0,0,'+rnd(.05,.25)+')'; c.fill(); } });
  T.muzzle=mkTex(128,(c,n)=>{ c.translate(64,64); const g=c.createRadialGradient(0,0,0,0,0,60); g.addColorStop(0,'rgba(255,255,240,1)'); g.addColorStop(0.3,'rgba(255,220,120,.9)'); g.addColorStop(1,'rgba(255,120,20,0)'); c.fillStyle=g; for(let i=0;i<10;i++){ c.rotate(Math.PI/5); c.beginPath(); c.moveTo(0,-6); c.lineTo(rnd(30,62),0); c.lineTo(0,6); c.closePath(); c.fill(); } c.beginPath(); c.arc(0,0,22,0,Math.PI*2); c.fill(); });
  T.hole=mkTex(64,(c,n)=>{ const g=c.createRadialGradient(32,32,0,32,32,30); g.addColorStop(0,'rgba(5,5,5,1)'); g.addColorStop(0.3,'rgba(10,10,10,.95)'); g.addColorStop(0.55,'rgba(40,40,40,.5)'); g.addColorStop(0.75,'rgba(120,120,120,.25)'); g.addColorStop(1,'rgba(120,120,120,0)'); c.fillStyle=g; c.fillRect(0,0,n,n); });
  T.splat=mkTex(128,(c,n)=>{ c.fillStyle='rgba(255,255,255,1)'; for(let i=0;i<14;i++){ c.beginPath(); c.arc(64+rnd(-30,30),64+rnd(-30,30),rnd(6,26),0,Math.PI*2); c.globalAlpha=rnd(.55,1); c.fill(); } for(let i=0;i<18;i++){ c.beginPath(); c.arc(64+rnd(-56,56),64+rnd(-56,56),rnd(1.5,5),0,Math.PI*2); c.globalAlpha=rnd(.5,1); c.fill(); } c.globalAlpha=1; });
  T.ring=mkTex(128,(c,n)=>{ const g=c.createRadialGradient(64,64,40,64,64,64); g.addColorStop(0,'rgba(255,200,120,0)'); g.addColorStop(0.6,'rgba(255,200,120,.9)'); g.addColorStop(1,'rgba(255,120,40,0)'); c.fillStyle=g; c.fillRect(0,0,n,n); });
}
/* ---- 점 입자 묶음 ---- */
class Pts {
  constructor(max,tex,size,blend,opacity){ this.max=max; this.n=0; this.pos=new Float32Array(max*3); this.col=new Float32Array(max*3); this.vel=new Float32Array(max*3); this.life=new Float32Array(max); this.life0=new Float32Array(max); this.bounce=new Float32Array(max); this.kind=new Uint8Array(max);
    this.geo=new THREE.BufferGeometry(); this.geo.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); this.geo.setAttribute('color',new THREE.BufferAttribute(this.col,3)); this.geo.setDrawRange(0,0);
    this.mat=new THREE.PointsMaterial({size,map:tex,vertexColors:true,transparent:true,depthWrite:false,opacity:opacity||1,blending:blend||THREE.NormalBlending,sizeAttenuation:true});
    this.mesh=new THREE.Points(this.geo,this.mat); this.mesh.frustumCulled=false; this.mesh.renderOrder=5; scene.add(this.mesh); }
  add(x,y,z,vx,vy,vz,r,g,b,life,bounce,kind){ let i; if(this.n<this.max) i=this.n++; else i=Math.floor(Math.random()*this.max); this.pos[i*3]=x;this.pos[i*3+1]=y;this.pos[i*3+2]=z; this.vel[i*3]=vx;this.vel[i*3+1]=vy;this.vel[i*3+2]=vz; this.col[i*3]=r;this.col[i*3+1]=g;this.col[i*3+2]=b; this.life[i]=life; this.life0[i]=life; this.bounce[i]=bounce; this.kind[i]=kind||0; }
  update(dt,onLand){ let n=this.n; const P=this.pos,V=this.vel;
    for(let i=0;i<n;i++){
      if(this.life[i]<=0){ n--; if(i<n){ for(let k=0;k<3;k++){ P[i*3+k]=P[n*3+k]; V[i*3+k]=V[n*3+k]; this.col[i*3+k]=this.col[n*3+k]; } this.life[i]=this.life[n]; this.life0[i]=this.life0[n]; this.bounce[i]=this.bounce[n]; this.kind[i]=this.kind[n]; i--; } continue; }
      this.life[i]-=dt; V[i*3+1]-=9.8*dt;
      let nx=P[i*3]+V[i*3]*dt, ny=P[i*3+1]+V[i*3+1]*dt, nz=P[i*3+2]+V[i*3+2]*dt;
      if(ny<0.02){ ny=0.02; if(this.bounce[i]>0&&Math.abs(V[i*3+1])>0.9){ V[i*3+1]=-V[i*3+1]*this.bounce[i]; V[i*3]*=0.55; V[i*3+2]*=0.55; } else { if(onLand&&V[i*3+1]<-0.5) onLand(nx,nz,this.kind[i]); V[i*3+1]=0; V[i*3]*=0.6; V[i*3+2]*=0.6; if(this.kind[i]===1) this.life[i]=Math.min(this.life[i],0.25); } }
      if(world&&world.solidFor(Math.floor(nx/2),Math.floor(nz/2),'shot')){ V[i*3]*=-0.3; V[i*3+2]*=-0.3; nx=P[i*3]; nz=P[i*3+2]; }
      P[i*3]=nx;P[i*3+1]=ny;P[i*3+2]=nz;
    }
    this.n=n; this.geo.setDrawRange(0,n); this.geo.attributes.position.needsUpdate=true; this.geo.attributes.color.needsUpdate=true; }
  clear(){ this.n=0; this.geo.setDrawRange(0,0); }
}
/* ---- 스프라이트(연기·불덩이·섬광) 풀 ---- */
class Sprites {
  constructor(max,tex,blend,color){ this.list=[]; this.max=max; this.tex=tex; this.blend=blend; this.color=color; }
  add(x,y,z,o){ let s; if(this.list.length<this.max){ const m=new THREE.SpriteMaterial({map:this.tex,transparent:true,depthWrite:false,blending:this.blend,color:this.color||0xffffff}); s=new THREE.Sprite(m); s.renderOrder=6; scene.add(s); this.list.push(s); } else { s=this.list.reduce((a,b)=>(a.userData.life<b.userData.life?a:b)); }
    s.position.set(x,y,z); s.visible=true; s.userData={life:o.life,life0:o.life,grow:o.grow||0,vx:o.vx||0,vy:o.vy||0,vz:o.vz||0,fade:o.fade!==false,rs:(Math.random()-0.5)*2,drag:o.drag||0}; s.scale.setScalar(o.size); s.material.rotation=Math.random()*Math.PI*2; s.material.opacity=o.opacity!=null?o.opacity:1; s.material.color.setHex(o.color!=null?o.color:(this.color||0xffffff)); s.userData.op0=s.material.opacity; return s; }
  update(dt){ for(const s of this.list){ const u=s.userData; if(!s.visible||u.life<=0) { s.visible=false; continue; } u.life-=dt; const k=u.life/u.life0; if(u.fade) s.material.opacity=u.op0*Math.min(1,k*1.5); s.scale.addScalar(u.grow*dt); s.position.x+=u.vx*dt; s.position.y+=u.vy*dt; s.position.z+=u.vz*dt; if(u.drag){ u.vx*=1-u.drag*dt; u.vy*=1-u.drag*dt; u.vz*=1-u.drag*dt; } s.material.rotation+=u.rs*dt; if(u.life<=0) s.visible=false; } }
  clear(){ for(const s of this.list){ s.visible=false; s.userData.life=0; } }
}
/* ---- 고기 조각·파편: 인스턴스 메쉬 물리 ---- */
class Chunks {
  constructor(max){ this.max=max; const g=new THREE.DodecahedronGeometry(0.09,0); const p=g.attributes.position; for(let i=0;i<p.count;i++){ p.setXYZ(i,p.getX(i)*rnd(.6,1.4),p.getY(i)*rnd(.5,1.3),p.getZ(i)*rnd(.6,1.4)); } g.computeVertexNormals();
    this.mesh=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({vertexColors:false}),max); this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.frustumCulled=false; this.mesh.count=0; scene.add(this.mesh);
    this.col=new THREE.InstancedBufferAttribute(new Float32Array(max*3),3); this.mesh.instanceColor=this.col;
    this.items=[]; this.o=new THREE.Object3D(); }
  add(x,y,z,vx,vy,vz,r,g,b,scale){ let it; if(this.items.length<this.max){ it={}; this.items.push(it); } else { it=this.items.reduce((a,c)=>(a.life<c.life?a:c)); }
    Object.assign(it,{x,y,z,vx,vy,vz,rx:Math.random()*6,ry:Math.random()*6,rz:0,wx:rnd(-8,8),wy:rnd(-8,8),s:scale,life:25,rest:false}); const i=this.items.indexOf(it); this.col.setXYZ(i,r,g,b); this.col.needsUpdate=true; }
  update(dt){ const n=this.items.length; for(let i=0;i<n;i++){ const it=this.items[i]; if(it.life<=0){ this.o.scale.setScalar(0); this.o.updateMatrix(); this.mesh.setMatrixAt(i,this.o.matrix); continue; } it.life-=dt; if(!it.rest){ it.vy-=14*dt; let nx=it.x+it.vx*dt, ny=it.y+it.vy*dt, nz=it.z+it.vz*dt; if(ny<it.s*0.5){ ny=it.s*0.5; if(Math.abs(it.vy)>1.2){ it.vy=-it.vy*0.35; it.vx*=0.6; it.vz*=0.6; it.wx*=0.5; it.wy*=0.5; } else { it.vy=0; it.vx*=0.8; it.vz*=0.8; if(Math.abs(it.vx)+Math.abs(it.vz)<0.1) it.rest=true; } } if(world&&world.solidFor(Math.floor(nx/2),Math.floor(nz/2),'shot')){ it.vx*=-0.4; it.vz*=-0.4; nx=it.x; nz=it.z; } it.x=nx; it.y=ny; it.z=nz; it.rx+=it.wx*dt; it.ry+=it.wy*dt; }
      const sh=it.life<2?it.life/2:1; this.o.position.set(it.x,it.y,it.z); this.o.rotation.set(it.rx,it.ry,0); this.o.scale.setScalar(it.s*sh); this.o.updateMatrix(); this.mesh.setMatrixAt(i,this.o.matrix); }
    this.mesh.count=n; this.mesh.instanceMatrix.needsUpdate=true; }
  clear(){ this.items=[]; this.mesh.count=0; }
}
/* ---- 자국(바닥 핏자국·벽 총알 구멍·벽 피) ---- */
class Decals {
  constructor(max){ this.max=max; this.list=[]; this.geo=new THREE.PlaneGeometry(1,1); this.mats={}; }
  mat(kind){ if(this.mats[kind]) return this.mats[kind]; const m=kind==='hole'?new THREE.MeshBasicMaterial({map:T.hole,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}):new THREE.MeshLambertMaterial({map:T.splat,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,color:kind==='blood'?0x330303:0x1a1a1a,opacity:kind==='blood'?0.9:0.8}); return this.mats[kind]=m; }
  add(kind,x,y,z,nx,ny,nz,size){ let m; if(this.list.length<this.max){ m=new THREE.Mesh(this.geo,this.mat(kind)); scene.add(m); this.list.push(m); } else { m=this.list.shift(); this.list.push(m); m.material=this.mat(kind); }
    m.visible=true; m.position.set(x+nx*0.015,y+ny*0.015,z+nz*0.015); m.lookAt(x+nx,y+ny,z+nz); m.rotateZ(Math.random()*Math.PI*2); m.scale.set(size,size,1); m.renderOrder=2; }
  clear(){ for(const m of this.list) m.visible=false; }
}
/* ---- 10/19 사장님 "괴물이 동그랗고 컬러풀한 불을 쏘니까 초딩 게임 같아": 단색 공 대신 머리(빛·일렁이는 불꽃·심 세 겹) + 꼬리(불꽃·연기 입자) + 맞으면 불꽃 터짐.
   참고: 튜토리얼들은 공 모양을 안 쓰고 머리와 꼬리를 나눔, 꼬리 입자는 노랑에서 빨강으로 변하며 작아지고 위로 뜸, 어두운 연기 꼬리와 불티를 따로 겹침 ---- */
const PAL={
  fireball:{young:[1,.8,.45], mid:[.95,.36,.07], old:[.3,.06,.02], smoke:0x1c120c, core:0xffe8b0, body:0xff6a1a, glow:0xb8360a, s:0.3, light:0xff6020},
  ball:{young:[1,.55,.42], mid:[.72,.1,.1], old:[.16,.02,.03], smoke:0x160606, core:0xffd2bc, body:0xc82a22, glow:0x6e0e14, s:0.34, light:0xc02818},
  greenball:{young:[.86,.95,.5], mid:[.32,.55,.1], old:[.05,.12,.02], smoke:0x10140a, core:0xeeffcc, body:0x6aa828, glow:0x2e5a0e, s:0.42, light:0x70b030},
  rocket:{young:[1,.9,.6], mid:[1,.5,.15], old:[.3,.1,.03], smoke:0x8a8a8a, core:0xfff0c0, body:0xff9a3a, glow:0xff7a20, s:0.16, light:0xffa040},
  bfg:{young:[.85,1,.85], mid:[.2,.85,.38], old:[.02,.2,.06], smoke:0x0a1a0e, core:0xeaffee, body:0x30d860, glow:0x128a30, s:0.6, light:0x40ff40}
};
function makeProjTextures(){
  if(T.flame) return;
  T.flame=mkTex(128,(c,n)=>{ c.globalCompositeOperation='lighter'; for(let i=0;i<22;i++){ const a=Math.random()*Math.PI*2, d=rnd(0,26), r=rnd(14,34); const x=64+Math.cos(a)*d, y=64+Math.sin(a)*d; const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(255,255,255,.34)'); g.addColorStop(.5,'rgba(255,255,255,.14)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,n,n); }
    c.globalCompositeOperation='destination-in'; const m=c.createRadialGradient(64,64,10,64,64,62); m.addColorStop(0,'rgba(0,0,0,1)'); m.addColorStop(.7,'rgba(0,0,0,.8)'); m.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=m; c.fillRect(0,0,n,n); });
  T.core=mkTex(64,(c,n)=>{ const g=c.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.25,'rgba(255,255,255,.85)'); g.addColorStop(.6,'rgba(255,255,255,.22)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,n,n); });
}
/* 꼬리 입자: 한 번에 그리는 점 묶음(크기·색·투명도가 입자마다 다름) */
class Trail {
  constructor(max,tex,blend){ this.max=max; this.n=0; this.pos=new Float32Array(max*3); this.vel=new Float32Array(max*3); this.col=new Float32Array(max*3); this.size=new Float32Array(max); this.alpha=new Float32Array(max);
    this.life=new Float32Array(max); this.life0=new Float32Array(max); this.s0=new Float32Array(max); this.grow=new Float32Array(max); this.a0=new Float32Array(max); this.pal=new Array(max); this.drag=new Float32Array(max);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setAttribute('aColor',new THREE.BufferAttribute(this.col,3)); g.setAttribute('aSize',new THREE.BufferAttribute(this.size,1)); g.setAttribute('aAlpha',new THREE.BufferAttribute(this.alpha,1)); g.setDrawRange(0,0); this.geo=g;
    this.mat=new THREE.ShaderMaterial({uniforms:{map:{value:tex},uScale:{value:600}},transparent:true,depthWrite:false,blending:blend,
      vertexShader:'attribute float aSize; attribute float aAlpha; attribute vec3 aColor; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vC=aColor; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uScale/max(0.15,-mv.z); gl_Position=projectionMatrix*mv; }',
      fragmentShader:'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vC*t.rgb,t.a*vA); }'});
    this.mesh=new THREE.Points(g,this.mat); this.mesh.frustumCulled=false; this.mesh.renderOrder=7; scene.add(this.mesh); }
  add(x,y,z,vx,vy,vz,size,grow,life,alpha,pal,drag,rgb){ let i; if(this.n<this.max) i=this.n++; else i=Math.floor(Math.random()*this.max);
    this.pos[i*3]=x; this.pos[i*3+1]=y; this.pos[i*3+2]=z; this.vel[i*3]=vx; this.vel[i*3+1]=vy; this.vel[i*3+2]=vz; this.s0[i]=size; this.size[i]=size; this.grow[i]=grow; this.life[i]=life; this.life0[i]=life; this.a0[i]=alpha; this.alpha[i]=alpha; this.pal[i]=pal; this.drag[i]=drag||0;
    const c=rgb||pal.young; this.col[i*3]=c[0]; this.col[i*3+1]=c[1]; this.col[i*3+2]=c[2]; }
  update(dt){ let n=this.n; const P=this.pos,V=this.vel,C=this.col;
    for(let i=0;i<n;i++){
      if(this.life[i]<=0){ n--; if(i<n){ for(let k=0;k<3;k++){ P[i*3+k]=P[n*3+k]; V[i*3+k]=V[n*3+k]; C[i*3+k]=C[n*3+k]; } this.size[i]=this.size[n]; this.alpha[i]=this.alpha[n]; this.life[i]=this.life[n]; this.life0[i]=this.life0[n]; this.s0[i]=this.s0[n]; this.grow[i]=this.grow[n]; this.a0[i]=this.a0[n]; this.pal[i]=this.pal[n]; this.drag[i]=this.drag[n]; i--; } continue; }
      this.life[i]-=dt; const k=1-Math.max(0,this.life[i])/this.life0[i]; const dr=Math.max(0,1-this.drag[i]*dt);
      V[i*3]*=dr; V[i*3+1]*=dr; V[i*3+2]*=dr; P[i*3]+=V[i*3]*dt; P[i*3+1]+=V[i*3+1]*dt; P[i*3+2]+=V[i*3+2]*dt;
      this.size[i]=this.s0[i]*(1+this.grow[i]*k); this.alpha[i]=this.a0[i]*Math.pow(1-k,1.3);
      const pl=this.pal[i]; if(pl&&pl.young){ let a,b,t; if(k<0.35){ a=pl.young; b=pl.mid; t=k/0.35; } else { a=pl.mid; b=pl.old; t=(k-0.35)/0.65; } C[i*3]=a[0]+(b[0]-a[0])*t; C[i*3+1]=a[1]+(b[1]-a[1])*t; C[i*3+2]=a[2]+(b[2]-a[2])*t; }
    }
    this.n=n; this.geo.setDrawRange(0,n); const at=this.geo.attributes; at.position.needsUpdate=true; at.aColor.needsUpdate=true; at.aSize.needsUpdate=true; at.aAlpha.needsUpdate=true; }
  clear(){ this.n=0; this.geo.setDrawRange(0,0); }
}
let trailFire=null, trailSmoke=null;
function hexRGB(h){ return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255]; }
/* 탄 머리: 넓은 빛 + 일렁이는 불꽃 두 겹 + 하얀 심. 로켓은 작은 몸통을 더한다 */
function projHead(kind){
  const P=PAL[kind]||PAL.fireball; const g=new THREE.Group(); const s=P.s;
  const sp=(tex,col,size,op)=>{ const m=new THREE.SpriteMaterial({map:tex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op}); const o=new THREE.Sprite(m); o.scale.setScalar(size); o.renderOrder=8; g.add(o); return o; };
  const flames=[]; for(let i=0;i<5;i++){ const f=sp(T.flame,i%2?P.body:P.glow,s*1.4,i%2?0.85:0.7); f.userData={ox:0,oy:0,oz:0,k:1,rs:(Math.random()-0.5)*14}; flames.push(f); }
  const smokes=[]; for(let i=0;i<2;i++){ const m=new THREE.SpriteMaterial({map:T.smoke,color:P.smoke,transparent:true,depthWrite:false,opacity:0.55}); const o=new THREE.Sprite(m); o.scale.setScalar(s*2.2); o.renderOrder=7; g.add(o); smokes.push(o); }
  g.userData={glow:sp(T.core,P.glow,s*3.0,0.2), flames, smokes, core:sp(T.core,P.core,s*0.85,0.9), s, kind, acc:0, accS:0, t:Math.random()*10, jit:0};
  if(kind==='rocket'){ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.06,0.42,8),new THREE.MeshLambertMaterial({color:0x3a3a36})); b.rotation.x=Math.PI/2; const holder=new THREE.Group(); holder.add(b); g.add(holder); g.userData.holder=holder; }
  return g;
}
/* 탄이 날아가는 동안 매 프레임: 머리 일렁임 + 지나간 거리만큼 꼬리 입자 */
function projTrail(head,x,y,z,dx,dy,dz,dt,speed){
  const u=head.userData, P=PAL[u.kind]||PAL.fireball; u.t+=dt; const s=u.s;
  const bx=u.holder?-dx*0.24:0, by=u.holder?-dy*0.24:0, bz=u.holder?-dz*0.24:0;
  u.jit-=dt; if(u.jit<=0){ u.jit=0.045; for(const f of u.flames){ const fu=f.userData; fu.ox=rnd(-.45,.45)*s; fu.oy=rnd(-.3,.55)*s; fu.oz=rnd(-.45,.45)*s; fu.k=rnd(.75,1.35); } for(const m of u.smokes){ m.position.set(bx-dx*s*0.9+rnd(-.4,.4)*s, by+rnd(0,.6)*s, bz-dz*s*0.9+rnd(-.4,.4)*s); m.material.rotation=Math.random()*6.3; } }
  for(const f of u.flames){ const fu=f.userData; f.position.set(bx+fu.ox,by+fu.oy,bz+fu.oz); f.scale.setScalar(s*1.4*fu.k); f.material.rotation+=fu.rs*dt; }
  u.core.position.set(bx*0.8,by*0.8,bz*0.8); u.core.scale.setScalar(s*0.85*(0.85+0.3*Math.random())); u.glow.position.set(bx,by,bz); u.glow.material.opacity=0.14+0.1*Math.random();
  if(u.holder) u.holder.lookAt(x+dx,y+dy,z+dz);
  const step=speed*dt; u.acc+=step; u.accS+=step; const gap=u.kind==='rocket'?0.05:0.07;
  while(u.acc>=gap){ u.acc-=gap; const back=u.acc+Math.random()*0.04; const px=x-dx*back+rnd(-.04,.04)*s*4, py=y-dy*back+rnd(-.04,.04)*s*4, pz=z-dz*back+rnd(-.04,.04)*s*4;
    if(u.kind==='rocket') trailFire.add(px-dx*0.24,py-dy*0.24,pz-dz*0.24,-dx*1.5,-dy*1.5+0.2,-dz*1.5,s*2.2,-0.6,rnd(.06,.11),0.95,P,0);
    else trailFire.add(px,py,pz,rnd(-.3,.3),rnd(.5,1.2),rnd(-.3,.3),s*rnd(1.3,1.9),-0.55,rnd(.16,.27),0.72,P,2.5); }
  const r=u.kind==='rocket', sg=r?0.09:0.22;
  while(u.accS>=sg){ u.accS-=sg; const b=(r?0.3:s*1.5)+u.accS; trailSmoke.add(x-dx*b,y-dy*b,z-dz*b,rnd(-.15,.15),rnd(.25,.6),rnd(-.15,.15),r?0.32:s*1.9,r?3.2:1.4,r?rnd(.9,1.4):rnd(.35,.55),r?0.42:0.32,{smoke:true},1.2,hexRGB(P.smoke)); }
  if(!r&&Math.random()<dt*14){ const c=P.young; sparks.add(x,y,z,rnd(-1.2,1.2),rnd(0.4,2.2),rnd(-1.2,1.2),c[0],c[1]*0.85,c[2]*0.6,rnd(.25,.5),0,0); }
}
/* 벽·몸에 맞았을 때(터지지 않는 탄): 불꽃이 퍼지며 사그라들고 연기·불티 */
function projImpact(kind,x,y,z,dx,dz){
  const P=PAL[kind]||PAL.fireball, s=P.s;
  for(let i=0;i<16;i++){ const a=Math.random()*Math.PI*2, v=rnd(1,3.4); trailFire.add(x,y,z,Math.cos(a)*v-dx*1.2,rnd(-.5,2.2),Math.sin(a)*v-dz*1.2,s*rnd(1.6,2.6),0.4,rnd(.18,.34),0.95,P,4); }
  for(let i=0;i<5;i++) trailSmoke.add(x+rnd(-.15,.15),y+rnd(-.1,.2),z+rnd(-.15,.15),rnd(-.4,.4),rnd(.4,1),rnd(-.4,.4),s*2.4,1.6,rnd(.6,.9),0.4,{smoke:true},1.5,hexRGB(P.smoke));
  const c=P.young; for(let i=0;i<10;i++){ const a=Math.random()*Math.PI*2, v=rnd(2,6); sparks.add(x,y,z,Math.cos(a)*v-dx,rnd(1,4),Math.sin(a)*v-dz,c[0],c[1]*0.85,c[2]*0.6,rnd(.3,.6),0.3,0); }
  flash(x,y,z,2.6,P.light,0.12);
}
function trailScale(){ const g=window.game; if(!g||!g.camera||!trailFire) return; const cam=g.camera, h=g.renderer.domElement.height; const k=h*(cam.zoom||1)/(2*Math.tan(cam.fov*Math.PI/360)); trailFire.mat.uniforms.uScale.value=k; trailSmoke.mat.uniforms.uScale.value=k; }
/* ---- 공개 API ---- */
let blood, sparks, smoke, fire, flashes, chunks, decals, lights, shakeAmt=0, ringMesh, slashMesh, tracers=[];
function init(sc,w,o){
  if(scene===sc && blood){ world=w; opts=o; clear(); return; } // 같은 장면이면 다시 만들지 않는다
  scene=sc; world=w; opts=o; makeTextures();
  blood=new Pts(700,T.blob,0.13,THREE.NormalBlending,0.95); sparks=new Pts(500,T.spark,0.11,THREE.AdditiveBlending,1);
  smoke=new Sprites(48,T.smoke,THREE.NormalBlending,0x303030); fire=new Sprites(40,T.fire,THREE.AdditiveBlending,0xffffff); flashes=new Sprites(10,T.muzzle,THREE.AdditiveBlending,0xffffff);
  chunks=new Chunks(220); decals=new Decals(140);
  makeProjTextures(); trailFire=new Trail(700,T.flame,THREE.AdditiveBlending); trailSmoke=new Trail(400,T.smoke,THREE.NormalBlending);
  lights=[]; for(let i=0;i<4;i++){ const l=new THREE.PointLight(0xffb060,0,10,1.6); l.userData={t:0}; scene.add(l); lights.push(l); }
  ringMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.ring,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); ringMesh.rotation.x=-Math.PI/2; ringMesh.visible=false; scene.add(ringMesh); ringMesh.userData={t:0};
  shakeAmt=0;
}
const useBlood=()=>opts.blood!==false;
function bloodHit(x,y,z,dx,dz,n){ // 총알 맞음: 덩어리 + 안개
  const B=useBlood(); n=n||6;
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=rnd(0.8,3.5); const vy=rnd(0.5,3.2); const sh=rnd(0.35,1); const col=B?[0.42*sh,0.015*sh,0.015*sh]:[0.35,0.35,0.35]; blood.add(x,y+rnd(-0.3,0.4),z, Math.cos(a)*s*0.5-dx*rnd(1,3), vy, Math.sin(a)*s*0.5-dz*rnd(1,3), col[0],col[1],col[2], rnd(1,1.8), 0.05, 1); }
  if(B){ smoke.add(x-dx*0.2,y,z-dz*0.2,{life:0.5,size:rnd(0.45,0.75),grow:1.4,color:0x5a0a0a,opacity:0.8,vx:-dx*1.5,vz:-dz*1.5,drag:3}); if(Math.random()<0.55) wallSplat(x,y,z,-dx,-dz); }
  else sparks.add(x,y,z,-dx*2,2,-dz*2,1,0.8,0.3,0.4,0.3,0);
}
function wallSplat(x,y,z,dx,dz){ // 맞은 반대편 벽에 핏자국
  const l=Math.hypot(dx,dz); if(l<0.01) return; const h=world.rayWall(x,z,dx/l,dz/l,3.5,'shot'); if(!h) return; decals.add('blood',h.x,y+rnd(-0.2,0.3),h.z,h.nx,0,h.nz,rnd(0.6,1.3));
}
function gibs(x,y,z,n){ // 죽음·폭발: 고기 조각 + 큰 피
  const B=useBlood();
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=rnd(2,6); const sh=rnd(0.4,1); chunks.add(x,y+rnd(0.3,1.2),z,Math.cos(a)*s,rnd(2,7),Math.sin(a)*s, B?0.55*sh:0.25, B?0.06*sh:0.25, B?0.04*sh:0.25, rnd(0.6,1.5)); }
  for(let i=0;i<n*3;i++){ const a=Math.random()*Math.PI*2, s=rnd(1,5); const sh=rnd(0.35,1); blood.add(x,y+rnd(0.2,1.2),z,Math.cos(a)*s,rnd(1,6),Math.sin(a)*s,B?0.42*sh:0.3,B?0.015*sh:0.3,B?0.015*sh:0.3,rnd(1.2,2.2),0.1,1); }
  if(B){ for(let i=0;i<3;i++) smoke.add(x,y+0.8,z,{life:0.7,size:rnd(0.8,1.3),grow:2,color:0x5a0808,opacity:0.85,vx:rnd(-1,1),vy:rnd(0.5,1.5),vz:rnd(-1,1),drag:2}); for(let i=0;i<4;i++) decals.add('blood',x+rnd(-1.2,1.2),0,z+rnd(-1.2,1.2),0,1,0,rnd(0.8,1.6)); }
}
function sparksAt(x,y,z,nx,nz,n){ for(let i=0;i<(n||8);i++){ const a=Math.random()*Math.PI*2, s=rnd(1,5); sparks.add(x+nx*0.05,y,z+nz*0.05,Math.cos(a)*s*0.5+nx*rnd(1,4),rnd(0.5,3.5),Math.sin(a)*s*0.5+nz*rnd(1,4),1,rnd(0.7,1),rnd(0.2,0.5),rnd(0.25,0.6),0.45,0); } smoke.add(x+nx*0.1,y,z+nz*0.1,{life:0.6,size:0.3,grow:1.2,color:0x777777,opacity:0.5,vx:nx*0.6,vy:0.5,vz:nz*0.6}); }
function bulletHole(x,y,z,nx,nz){ decals.add('hole',x,y,z,nx,0,nz,rnd(0.12,0.18)); sparksAt(x,y,z,nx,nz,7); flash(x+nx*0.2,y,z+nz*0.2,0.6,0xffc080,0.05); }
function tracer(x1,y1,z1,x2,y2,z2){ // 적이 쏜 탄도선: 어디서 맞았는지 보이게 0.1초
  let t=tracers.find(t=>!t.visible); if(!t){ if(tracers.length>=8) t=tracers[0]; else { const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3)); t=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffd27a,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false})); t.frustumCulled=false; scene.add(t); tracers.push(t); } }
  const a=t.geometry.attributes.position.array; a[0]=x1;a[1]=y1;a[2]=z1;a[3]=x2;a[4]=y2;a[5]=z2; t.geometry.attributes.position.needsUpdate=true; t.visible=true; t.userData.t=0.1; t.material.opacity=0.9; }
function slash(x,y,z,fx,fz){
  if(!slashMesh){ const g=new THREE.RingGeometry(0.30,0.345,28,1,0,2.0); const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,side:THREE.DoubleSide}); slashMesh=new THREE.Mesh(g,m); slashMesh.renderOrder=998; slashMesh.visible=false; scene.add(slashMesh); }
  slashMesh.position.set(x+fx*0.8,y-0.12,z+fz*0.8); slashMesh.lookAt(x,y,z); slashMesh.rotation.z=-0.9+Math.random()*0.4; slashMesh.scale.set(0.6,0.6,1); slashMesh.material.opacity=0.75; slashMesh.userData.t=0.11; slashMesh.visible=true;
}
function casing(x,y,z,rx,rz){ chunks.add(x,y,z,rx*2.2+rnd(-0.3,0.6),rnd(2,3.2),rz*2.2+rnd(-0.3,0.6),0.85,0.65,0.25,0.22); }
function muzzle(x,y,z,power){ flash(x,y,z,4.5*power,0xffb060,0.06); }
function explosion(x,y,z,big){
  const k=big?1.6:1;
  for(let i=0;i<6;i++) fire.add(x+rnd(-0.4,0.4)*k,y+rnd(0,0.8)*k,z+rnd(-0.4,0.4)*k,{life:rnd(0.35,0.6),size:rnd(1.2,2.2)*k,grow:4*k,vy:rnd(0.5,2),color:0xffffff});
  for(let i=0;i<7;i++) smoke.add(x+rnd(-0.6,0.6)*k,y+rnd(0.2,1)*k,z+rnd(-0.6,0.6)*k,{life:rnd(1.2,2),size:rnd(0.8,1.4)*k,grow:1.6*k,vy:rnd(0.6,1.6),vx:rnd(-0.6,0.6),vz:rnd(-0.6,0.6),color:0x222222,opacity:0.85,drag:1});
  for(let i=0;i<50;i++){ const a=Math.random()*Math.PI*2, e=Math.random()*Math.PI; const s=rnd(3,10)*k; sparks.add(x,y,z,Math.cos(a)*Math.sin(e)*s,Math.abs(Math.cos(e))*s+2,Math.sin(a)*Math.sin(e)*s,1,rnd(0.5,0.9),0.1,rnd(0.4,0.9),0.35,0); }
  for(let i=0;i<10;i++){ const a=Math.random()*Math.PI*2, s=rnd(2,7)*k; chunks.add(x,y+0.3,z,Math.cos(a)*s,rnd(3,8),Math.sin(a)*s,0.12,0.1,0.09,rnd(0.5,1.1)); }
  ringMesh.position.set(x,0.05,z); ringMesh.visible=true; ringMesh.userData.t=0.45; ringMesh.scale.setScalar(0.5);
  decals.add('scorch',x,0,z,0,1,0,2.6*k);
  flash(x,y+0.5,z,9*k,0xff8030,0.25); shake(0.5*k);
}
function flash(x,y,z,power,color,dur){ const l=lights.reduce((a,b)=>(a.userData.t<b.userData.t?a:b)); l.position.set(x,y,z); l.intensity=power; l.color.setHex(color||0xffb060); l.userData.t=dur||0.08; l.userData.t0=l.userData.t; l.userData.p=power; }
function shake(a){ shakeAmt=Math.min(1.2,shakeAmt+a); }
function getShake(){ return shakeAmt; }
function update(dt){
  blood.update(dt,(x,z,kind)=>{ if(kind===1&&useBlood()&&Math.random()<0.5) decals.add('blood',x,0,z,0,1,0,rnd(0.25,0.6)); });
  sparks.update(dt); smoke.update(dt); fire.update(dt); flashes.update(dt); chunks.update(dt); if(trailFire){ trailScale(); trailFire.update(dt); trailSmoke.update(dt); }
  for(const l of lights){ if(l.userData.t>0){ l.userData.t-=dt; l.intensity=l.userData.p*Math.max(0,l.userData.t/l.userData.t0)*(0.7+Math.random()*0.3); if(l.userData.t<=0) l.intensity=0; } }
  for(const t of tracers){ if(t.visible){ t.userData.t-=dt; t.material.opacity=Math.max(0,t.userData.t/0.1)*0.9; if(t.userData.t<=0) t.visible=false; } }
  if(slashMesh&&slashMesh.visible){ slashMesh.userData.t-=dt; const k=1-Math.max(0,slashMesh.userData.t/0.11); slashMesh.scale.set(0.7+k*0.6,0.7+k*0.6,1); slashMesh.material.opacity=0.75*(1-k); if(slashMesh.userData.t<=0) slashMesh.visible=false; }
  if(ringMesh.visible){ ringMesh.userData.t-=dt; ringMesh.scale.addScalar(dt*14); ringMesh.material.opacity=Math.max(0,ringMesh.userData.t/0.45); if(ringMesh.userData.t<=0) ringMesh.visible=false; }
  shakeAmt*=Math.pow(0.02,dt);
}
function clear(){ if(trailFire){ trailFire.clear(); trailSmoke.clear(); } blood.clear(); sparks.clear(); smoke.clear(); fire.clear(); flashes.clear(); chunks.clear(); decals.clear(); for(const l of lights) l.intensity=0; shakeAmt=0; }
return {init,projHead,projTrail,projImpact,blood:bloodHit,sparks:sparksAt,bulletHole,casing,gibs,explosion,flash,muzzle,shake,getShake,update,clear,slash,tracer,decal:(x,z,s)=>decals.add('blood',x,0,z,0,1,0,s)};
})();
