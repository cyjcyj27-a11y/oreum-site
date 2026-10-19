/* 몬스터: 모델·동작, AI(대기→추격→공격→맞음→죽음), 발사체, 통 */
window.Monsters = (function(){
const CS=2.0;
const CLIP = {
  idle:/Idle|Combat_Stance|Stance/i, walk:/Slow_Orc_Walk|Mummy_Stagger|Walking|Walk|baselayer/i, run:/Running/i,
  attack:/Shooting|Quick_Draw|Spell_Cast|Ground_Slam|Attack/i, pain:/Gunshot_Reaction|Hit_Reaction/i,
  die:/Slow_Fall|Dead|Fall_Down|Death|Die/i, see:/Scream/i };
// 뼈 없는 정적 모델(핑키) 걸음: 좌우로 뒤뚱·통통 튀면 귀여워 보인다(10/17 사장님 "너무 귀엽게 움직임").
// 그래서 좌우 흔들림은 거의 없애고, 고개를 숙인 채 앞뒤로 무겁게 쿵쿵 디디며(내려찍을 때 빠르게, 올라올 때 느리게), 가끔 고개를 홱 비튼다
// 10/19 괴물마다 걷기 클립을 다르게(전엔 임프·바론이 같은 Slow_Orc_Walk, 좀비는 전부 같은 Mummy_Stagger 를 같은 박자로)
// 좀비: 비틀걸음 60% + 절뚝이(보통 걸음을 느리게 + 한쪽으로 기움) 40%, 임프: 가벼운 보통 걸음 조금 빠르게, 바론: 무거운 오크 걸음 느리게
const WALK = {
  zombie: m=>Math.random()<0.6 ? {re:/Mummy_Stagger/} : {re:/^Walking$/, k:0.68, limp:true},
  imp:    m=>({re:/^Walking$/, k:1.15}),
  baron:  m=>({re:/Slow_Orc_Walk/, k:0.82})
};
function gait(m,dt,mv,lunge,pain){
  const md=m.model; m.wob=(m.wob||0)+dt*(mv?7.5:1.6)*(m.wobR||1); const ph=m.wob;
  const st=Math.pow(Math.abs(Math.sin(ph)),0.6); // 디딤: 0=땅, 1=떠 있음. 0.6제곱이라 땅에 오래·떠 있는 건 짧게
  m.twT=(m.twT||0)-dt; if(m.twT<=0){ m.twT=mv?0.9+Math.random()*1.6:1.8+Math.random()*2.5; m.twA=(Math.random()<0.5?-1:1)*(0.18+Math.random()*0.2); m.twK=0.22; }
  m.twK=Math.max(0,(m.twK||0)-dt); const tw=m.twK>0?m.twA*Math.sin((0.22-m.twK)/0.22*Math.PI):0; // 0.22초 동안 고개 홱
  md.rotation.y=tw;
  md.rotation.z=(m.tilt||0)*(mv?1:0.5)+Math.sin(ph)*(mv?0.025:0.01);
  md.rotation.x=(mv?0.12:0.05)+(m.lean||0)*(mv?1:0.4)+(lunge?0.22:0)+(pain?-0.2:0)+ /* +x 가 고개 숙임(옆에서 찍어 확인) */(mv?Math.cos(ph*2)*0.06:Math.sin(ph)*0.02);
  md.position.y=(md.userData.by||0)+(mv?st*0.035:0);
  const br=mv?0:Math.sin(ph*1.3)*0.018; md.scale.y=(md.userData.sy||(md.userData.sy=md.scale.y))*(1+br); // 서 있을 땐 거친 숨
}
class Monster {
  constructor(mg, spec, type, x, z, a, boss){
    this.mg=mg; this.g=mg.g; this.type=type; this.d=spec; this.x=x; this.z=z; this.yaw=a; this.hp=Math.round(spec.hp*((DATA.DIFF[mg.g.diff]||DATA.DIFF.normal).hp)); this.boss=!!boss;
    this.state='idle'; this.t=0; this.cd=Math.random()*1.5; this.alive=true; this.r=spec.r; this.h=spec.h; this.y=spec.fly?1.2+Math.random()*0.6:0;
    this.obj=new THREE.Group(); this.obj.position.set(x,this.y,z); this.g.scene.add(this.obj); this.mixer=null; this.actions={}; this.curAct=null; this.painT=0; this.deadT=0; this.seen=false; this.dir={x:0,z:0}; this.stuck=0; this.lastSee=false; this.lunge=0; this.bob=Math.random()*6; this.wanderT=0;
    // 10/19 사장님 "좀비 병사가 걸그룹 같다 = 동작이 똑같아서": 마리마다 동작 박자·빠르기·숙임·기울기·걸음 속도를 조금씩 다르게(같이 생겨나도 발이 안 맞게)
    this.wob=Math.random()*Math.PI*2; this.wobR=0.8+Math.random()*0.45; this.ts=0.82+Math.random()*0.36; this.spd=0.92+Math.random()*0.16;
    this.lean=Math.random()*(type==='zombie'?0.16:0.07); this.tilt=(Math.random()-0.5)*(type==='zombie'?0.16:0.06);
    this.ready=this.build();
  }
  async build(){
    const m=(this.d.noAnim?null:await Models.load(this.d.model+'_a')) || await Models.load(this.d.model);
    if(this.disposed) return;
    let o;
    if(!m){ o=new THREE.Mesh(new THREE.BoxGeometry(this.r*2,this.h,this.r*2), new THREE.MeshLambertMaterial({color:0x883333})); o.position.y=this.h/2; this.obj.add(o); this.model=o; return; }
    const hasSkin = m.clips.length>0;
    o = hasSkin ? Models.cloneSkinned(m.scene) : m.scene.clone();
    o.traverse(c=>{ if(c.isMesh&&c.material){ c.material=c.material.clone(); c.material.emissive=new THREE.Color(0x000000); } }); this.mats=[]; o.traverse(c=>{ if(c.isMesh) this.mats.push(c.material); });
    this.obj.add(o); this.model=o;
    if(hasSkin){
      this.mixer=new THREE.AnimationMixer(o);
      for(const k in CLIP){ const c=Models.pickClip(m.clips,CLIP[k]); if(c){ const a=this.mixer.clipAction(c); if(k==='die'||k==='attack'||k==='pain'||k==='see'){ a.setLoop(THREE.LoopOnce); a.clampWhenFinished=true; } this.actions[k]=a; } }
      if(this.actions.die && this.d._dieStart==null){ // 죽는 클립에서 엉덩이가 실제로 내려가기 시작하는 시점을 찾아 그 앞은 건너뛴다(10/17 사장님 "너무 늦게 쓰러져")
        try{ const a=this.actions.die, clip=a.getClip(); let hip=null; this.model.traverse(o=>{ if(!hip&&o.isBone&&/hips|pelvis/i.test(o.name)) hip=o; }); if(!hip) this.model.traverse(o=>{ if(!hip&&o.isBone) hip=o; });
          let start=0; if(hip){ a.reset().play(); a.paused=true; const v=new THREE.Vector3(); a.time=0; this.mixer.update(0); this.model.updateMatrixWorld(true); const y0=hip.getWorldPosition(v).y; for(let t=0;t<clip.duration;t+=0.1){ a.time=t; this.mixer.update(0); this.model.updateMatrixWorld(true); if(hip.getWorldPosition(v).y<y0-0.08){ start=Math.max(0,t-0.15); break; } } a.paused=false; a.stop(); }
          this.d._dieStart=start; }catch(e){ this.d._dieStart=0; }
      }
      { const wk=WALK[this.type]; if(wk){ const pk=wk(this); const c=Models.pickClip(m.clips,pk.re); if(c){ this.actions.walk=this.mixer.clipAction(c); this.walkK=pk.k||1; if(pk.limp) this.tilt+=(this.tilt<0?-1:1)*0.07; } } }
      if(!this.actions.walk && this.actions.run) this.actions.walk=this.actions.run;
      // 자세를 한 번 적용한 뒤 크기를 잰다(바인드 자세가 접힌 리그가 있다)
      const first=this.actions.idle||this.actions.walk; if(first){ first.play(); this.mixer.update(0.05); first.stop(); }
      Models.fit(o,this.h);
      if(!this.alive){ this.play('die'); } else this.play(this.state==='idle'?'idle':'walk');
    } else { Models.fit(o,this.h); o.userData.by=o.position.y; }
  }
  play(name,fade){
    const a=this.actions[name]||this.actions.idle||this.actions.walk; if(!a||a===this.curAct) return;
    a.timeScale=(name==='die')?2.5:(name==='attack'?1.3:(this.ts||1)*(name==='walk'?(this.walkK||1):1)); // 죽는 동작은 3배 빠르게(원본 클립 4.4초) (10/16 사장님 "너무 늦게 쓰러져")
    if(this.curAct) this.curAct.fadeOut(fade||0.15);
    a.reset().fadeIn(fade||0.15).play(); this.curAct=a; if(name==='walk'||name==='idle'||name==='run') a.time=Math.random()*a.getClip().duration; /* 같은 순간 걷기 시작해도 발이 안 맞게 */
  }
  dist(){ const p=this.g.player; return Math.hypot(p.x-this.x,p.z-this.z); }
  canSee(){ const p=this.g.player; return this.g.world.los(this.x,this.z,p.x,p.z); }
  update(dt){
    const p=this.g.player, w=this.g.world, d=this.d;
    // 멀리 있는 놈은 그리지도, 동작도 돌리지 않는다(성능)
    const dd=Math.hypot(p.x-this.x,p.z-this.z); const vis = dd<42; if(this.obj.visible!==vis && !(this.hidden)) this.obj.visible=vis;
    if(this.mixer && vis && (dd<30 || this.t%0.1<dt)) this.mixer.update(dd<30?dt:dt*3);
    if(this.flashT>0){ this.flashT-=dt; const e=this.flashT>0?0.6:0; if(this.mats) for(const m of this.mats){ m.emissive.setRGB(e,e*0.22,e*0.16); m.emissiveIntensity=1; } }
    else if(this.model && this.alive){ const mv=this.state==='chase'||this.lunge>0; gait(this,dt,mv,this.lunge>0,this.painT>0); }
    if(!this.alive){ this.deadT+=dt; if((!this.mixer||this.procFall) && this.model){ const k=Math.min(1,this.deadT/0.35); this.model.rotation.x=(this.baseRx||0)+Math.PI/2*(1-(1-k)*(1-k)); } if(d.fly && this.y>0){ this.y=Math.max(0,this.y-dt*3); this.obj.position.y=this.y; } return; }
    this.t+=dt; if(this.cd>0) this.cd-=dt; if(this.painT>0) this.painT-=dt;
    const dist=this.dist();
    if(this.state==='idle'){ if(dist<22 && (this.t%0.3<dt) && this.canSee()) this.wake(); return; }
    if(this.painT>0) return;
    if(this.state==='attack'){ this.atkT-=dt; if(this.atkT<=0){ this.doAttack(); this.state='chase'; this.cd=d.cd*(0.8+Math.random()*0.5); this.play('walk'); } this.face(dt,6); return; }
    const see = (this.t%0.25<dt) ? (this.lastSee = this.canSee()) : this.lastSee;
    const inRange = dist<=d.range && see;
    if(inRange && this.cd<=0 && (d.attack==='bite' ? dist<d.range+0.4 : Math.random()<0.6)){ this.state='attack'; this.atkT = d.attack==='bite'?0.25:0.45; this.play('attack'); if(d.attack==='bite') this.lunge=0.3; return; }
    let mx=0,mz=0;
    if(see){ mx=p.x-this.x; mz=p.z-this.z; }
    else { const f=this.mg.flow; if(f){ const cx=Math.floor(this.x/CS), cz=Math.floor(this.z/CS); const k=cz*w.map.W+cx; const n=f[k]; if(n>=0){ const nx=(n%w.map.W)*CS+CS/2, nz=Math.floor(n/w.map.W)*CS+CS/2; mx=nx-this.x; mz=nz-this.z; } } }
    const l=Math.hypot(mx,mz); if(l>0.01){ mx/=l; mz/=l; }
    for(const o of this.mg.list){ if(o===this||!o.alive) continue; const dx=this.x-o.x, dz=this.z-o.z; const dd=Math.hypot(dx,dz); const min=this.r+o.r+0.1; if(dd<min&&dd>0.001){ mx+=dx/dd*(min-dd)*2; mz+=dz/dd*(min-dd)*2; } }
    const stopD = d.attack==='bite' ? d.range*0.8 : 2.2;
    let sp = d.speed*(this.spd||1) * (dist<stopD && see ? 0 : 1);
    if(this.lunge>0){ this.lunge-=dt; sp=d.speed*2.2; }
    if(d.fly){ const ty=1.0+Math.sin(this.t*1.5+this.bob)*0.4; this.y+=(ty-this.y)*dt*2; this.obj.position.y=this.y; }
    if(sp>0){
      const pos={x:this.x,z:this.z}; w.moveCircle(pos,this.r,mx*sp*dt,mz*sp*dt,'monster'); const moved=Math.hypot(pos.x-this.x,pos.z-this.z); this.x=pos.x; this.z=pos.z;
      { const ddp=Math.hypot(this.x-p.x,this.z-p.z), minP=this.r+(p.r||0.3)+0.05; if(ddp<minP && ddp>0.001){ this.x=p.x+(this.x-p.x)/ddp*minP; this.z=p.z+(this.z-p.z)/ddp*minP; } } // 플레이어 몸 안으로는 못 들어옴
      if(moved<sp*dt*0.2){ this.stuck+=dt; if(this.stuck>0.6){ this.stuck=0; const a=Math.random()*Math.PI*2; this.dir={x:Math.cos(a),z:Math.sin(a)}; this.wanderT=0.5; } } else this.stuck=0;
      if(this.wanderT>0){ this.wanderT-=dt; const pos2={x:this.x,z:this.z}; w.moveCircle(pos2,this.r,this.dir.x*sp*dt,this.dir.z*sp*dt,'monster'); this.x=pos2.x; this.z=pos2.z; }
      w.touchDoors(pos,this.r,{R:true,Y:true,B:true});
      this.play(sp>d.speed*1.5&&this.actions.run?'run':'walk'); if(this.curAct===this.actions.walk) this.curAct.timeScale=(this.ts||1)*(this.walkK||1)*(this.spd||1);
    } else this.play('idle');
    if(see||sp>0){ const tx=see?p.x:this.x+mx, tz=see?p.z:this.z+mz; this.targetYaw=Math.atan2(tx-this.x,tz-this.z); }
    this.face(dt,8);
    this.obj.position.x=this.x; this.obj.position.z=this.z;
  }
  face(dt,k){ if(this.targetYaw==null) return; let dy=this.targetYaw-this.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); this.yaw+=dy*Math.min(1,dt*k); this.obj.rotation.y=this.yaw; }
  wake(){ this.state='chase'; this.seen=true; this.play('walk'); Audio3.play(this.d.sndSee,0.8,this.dist()); if(this.actions.see && Math.random()<0.5){ this.play('see'); this.painT=0.8; } }
  doAttack(){
    const p=this.g.player, d=this.d; if(!this.alive) return;
    const dist=this.dist(); const dmg=d.dmg[0]+Math.floor(Math.random()*(d.dmg[1]-d.dmg[0]+1));
    Audio3.play(d.sndAtk,0.9,dist);
    if(d.attack==='hitscan'){ if(this.canSee()){ const miss=Math.random()<0.35+Math.min(0.35,dist/40); if(!miss){ FX.tracer(this.x,1.4,this.z,p.x,p.eye-0.15,p.z); p.damage(dmg,this); } else { const f={x:p.x-this.x,z:p.z-this.z}; const l=Math.hypot(f.x,f.z); const wall=this.g.world.rayWall(this.x,this.z,f.x/l,f.z/l,30); if(wall){ FX.bulletHole(wall.x,1.1+Math.random()*0.6,wall.z,wall.nx,wall.nz); FX.tracer(this.x,1.4,this.z,wall.x,1.1+Math.random()*0.6,wall.z); } } FX.flash(this.x,1.4,this.z,3,0xffc070,0.07); } }
    else if(d.attack==='bite'){ if(dist<d.range+0.6) p.damage(dmg,this); }
    else { const kind = d.attack==='fireball'?'fireball': d.attack==='ball'?'ball':'greenball'; const dx=p.x-this.x, dy=(p.eye-0.3)-(this.y+this.h*0.6), dz=p.z-this.z; const l=Math.hypot(dx,dy,dz); this.mg.spawnProjectile(kind,this.x+dx/l*0.8,this.y+this.h*0.6,this.z+dz/l*0.8,dx/l,dy/l,dz/l,dmg,'monster'); }
  }
  hurt(n,dx,dz,melee){
    if(!this.alive) return;
    this.hp-=n; const dist=this.dist();
    FX.blood(this.x-(dx||0)*this.r*0.6,this.y+this.h*0.55,this.z-(dz||0)*this.r*0.6,dx||0,dz||0,melee?10:7);
    this.flashT=0.1; // 맞은 순간 붉게 번쩍
    if(!this.boss){ const pos={x:this.x,z:this.z}; this.g.world.moveCircle(pos,this.r,(dx||0)*0.25*(melee?1.6:1),(dz||0)*0.25*(melee?1.6:1),'monster'); this.x=pos.x; this.z=pos.z; this.obj.position.x=this.x; this.obj.position.z=this.z; }
    if(this.state==='idle') this.wake();
    if(this.hp<=0){ this.die(dx,dz); return; }
    if(Math.random()<this.d.pain && this.painT<=0){ this.painT=0.35; this.play('pain'); this.state='chase'; Audio3.play('pain',0.5,dist); }
  }
  die(dx,dz){
    this.alive=false; this.deadT=0; this.mg.killed++; Audio3.play(this.d.sndDie,1,this.dist()); this.baseRx=this.model?this.model.rotation.x:0;
    if(this.actions.die){ this.play('die',0.08); this.actions.die.time=this.d._dieStart||0; } else { if(this.mixer) this.mixer.stopAllAction(); this.procFall=true; }
    FX.blood(this.x,this.y+0.6,this.z,dx,dz,14);
    if(this.hp<-40 && !this.boss){ FX.gibs(this.x,this.y,this.z,16); this.obj.visible=false; this.hidden=true; } else FX.gibs(this.x,this.y,this.z,this.boss?22:4);
    if(this.boss) this.g.onBossDead(this);
  }
  dispose(){ this.disposed=true; this.g.scene.remove(this.obj); }
}
class Projectile {
  constructor(mg,kind,x,y,z,dx,dy,dz,dmg,owner){
    this.mg=mg; this.g=mg.g; this.kind=kind; this.x=x;this.y=y;this.z=z; this.dx=dx;this.dy=dy;this.dz=dz; this.dmg=dmg; this.owner=owner; this.alive=true; this.t=0;
    const spec={fireball:{c:0xff7020,s:0.3,sp:11,light:0xff6020},ball:{c:0xd8285e,s:0.35,sp:9,light:0xd02050},greenball:{c:0x86c83a,s:0.45,sp:12,light:0x70c030},rocket:{c:0xffd080,s:0.22,sp:22,light:0xffa040,boom:true},bfg:{c:0x40ff40,s:0.6,sp:16,light:0x40ff40,boom:true,big:true}}[kind];
    this.sp=spec.sp; this.boom=spec.boom; this.big=spec.big;
    this.mesh=FX.projHead(kind); this.mesh.position.set(x,y,z); this.g.scene.add(this.mesh); /* 10/19: 단색 공 대신 불꽃 머리 + 꼬리(fx.js projHead·projTrail) */
    // 불빛은 미리 만든 묶음에서 빌려 쓴다: 쏠 때마다 새 PointLight 를 넣으면 불빛 수가 바뀌어 셰이더를 다시 만들며 1.4초 멈췄음(10/17 바론 첫 발)
    this.light=mg.borrowLight(); if(this.light){ this.light.color.setHex(spec.light); this.light.intensity=1.5; this.light.distance=6; this.light.position.set(0,0,0); this.mesh.add(this.light); }
  }
  update(dt){
    const g=this.g, w=g.world; this.t+=dt; if(this.t>6) return this.kill();
    const step=this.sp*dt; const nx=this.x+this.dx*step, ny=this.y+this.dy*step, nz=this.z+this.dz*step;
    const hl=Math.hypot(this.dx,this.dz); const wall=hl>0.001?w.rayWall(this.x,this.z,this.dx/hl,this.dz/hl,hl*step+0.1,'shot'):null;
    if(wall || ny<0 || ny>5){ this.explode(wall?wall.x:nx, Math.max(0.2,ny), wall?wall.z:nz); return; }
    this.x=nx; this.y=ny; this.z=nz; this.mesh.position.set(nx,ny,nz); FX.projTrail(this.mesh,nx,ny,nz,this.dx,this.dy,this.dz,dt,this.sp);
    if(this.owner==='monster'){ const p=g.player; if(Math.hypot(p.x-nx,p.z-nz)<p.r+0.3 && ny>0 && ny<p.eye+0.4){ p.damage(this.dmg,null); this.explode(nx,ny,nz,true); } }
    else { for(const m of this.mg.list){ if(!m.alive) continue; if(Math.hypot(m.x-nx,m.z-nz)<m.r+0.3 && ny>m.y-0.2 && ny<m.y+m.h+0.3){ if(!this.boom) m.hurt(this.dmg,this.dx,this.dz); this.explode(nx,ny,nz); return; } } const b=g.barrels.near(nx,nz,0.6); if(b){ this.explode(nx,ny,nz); return; } }
  }
  explode(x,y,z,quiet){
    if(this.boom){ FX.explosion(x,y,z,this.big); const p=this.g.player; Audio3.play('explode',1,Math.hypot(p.x-x,p.z-z)); const R=this.big?5:3; for(const m of this.mg.list){ if(!m.alive) continue; const d=Math.hypot(m.x-x,m.z-z); if(d<R) m.hurt(Math.round(this.dmg*(1-d/R*0.6)),(m.x-x)/(d+0.01),(m.z-z)/(d+0.01)); } const pd=Math.hypot(p.x-x,p.z-z); if(pd<R*0.8) p.damage(Math.round(30*(1-pd/R)),null); this.g.barrels.blast(x,z,R); }
    else if(!quiet){ FX.projImpact(this.kind,x,y,z,this.dx,this.dz); }
    this.kill();
  }
  kill(){ this.alive=false; if(this.light){ this.mg.returnLight(this.light); this.light=null; } this.g.scene.remove(this.mesh); this.mesh.traverse(o=>{ if(o.material) o.material.dispose(); if(o.isMesh&&o.geometry) o.geometry.dispose(); }); }
}
class Manager {
  constructor(game){ this.g=game; this.list=[]; this.projs=[]; this.killed=0; this.flow=null; this.flowT=0;
    // 발사체 불빛 묶음: 처음부터 장면에 넣어 두고(세기 0) 빌려 주고 돌려받는다. 불빛 수가 늘 같아야 셰이더를 다시 안 만든다
    this.plights=[]; for(let i=0;i<6;i++){ const l=new THREE.PointLight(0xffffff,0,6); l.userData.busy=false; game.scene.add(l); this.plights.push(l); } }
  borrowLight(){ const l=this.plights.find(l=>!l.userData.busy); if(l) l.userData.busy=true; return l||null; }
  returnLight(l){ l.intensity=0; l.userData.busy=false; this.g.scene.add(l); }
  spawn(def){ const spec=DATA.MONSTERS[def.type]; const m=new Monster(this,spec,def.type,def.x*CS,def.y*CS,def.a,def.boss); this.list.push(m); return m; }
  spawnProjectile(kind,x,y,z,dx,dy,dz,dmg,owner){ this.projs.push(new Projectile(this,kind,x,y,z,dx,dy,dz,dmg,owner)); }
  get total(){ return this.list.length; }
  update(dt){
    this.flowT-=dt; if(this.flowT<=0){ this.flowT=0.4; this.flow=this.makeFlow(); }
    for(const m of this.list){ if(m.alive || m.deadT<8) m.update(dt); }
    for(const pr of this.projs) pr.update(dt);
    this.projs=this.projs.filter(p=>p.alive);
  }
  makeFlow(){
    const w=this.g.world, m=w.map, p=this.g.player; const W=m.W,H=m.H; const s=Math.floor(p.z/CS)*W+Math.floor(p.x/CS);
    const next=new Int32Array(W*H).fill(-1); const seen=new Uint8Array(W*H); const q=[s]; seen[s]=1;
    for(let h=0;h<q.length;h++){ const k=q[h]; const x=k%W,y=(k/W)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const n=ny*W+nx; if(seen[n]) continue; if(w.solidFor(nx,ny,'monster') && !(m.g[n]===m.DOOR||m.g[n]===m.LDOOR)) continue; seen[n]=1; next[n]=k; q.push(n); } }
    return next;
  }
  hitscan(ox,oz,oy,dx,dy,dz,maxD,pad){
    let best=null;
    for(const m of this.list){ if(!m.alive) continue;
      const rx=m.x-ox, rz=m.z-oz; const t=rx*dx+rz*dz; if(t<0||t>maxD) continue;
      const px=ox+dx*t, pz=oz+dz*t; const dd=Math.hypot(px-m.x,pz-m.z); if(dd>m.r+pad+0.1) continue;
      const hy=oy+dy*t; if(hy<m.y-0.1||hy>m.y+m.h+0.2) continue;
      // 10/19 사장님 "머리 맞출 때랑 몸통 맞출 때 타격 차이": 맞은 높이가 키의 위쪽 22%면 머리(카코데몬은 몸이 곧 머리라 뺌)
      if(!best||t<best.d){ let head=false; const hr=(hy-m.y)/m.h;
        if(m.type==='pinky'){ const fx=Math.sin(m.yaw), fz=Math.cos(m.yaw); head = (dx*fx+dz*fz)<-0.3 && hr>0.45; }   // 네발짐승: 머리는 앞쪽 중간 높이 → 앞에서 쏠 때 중간 높이 위
        else if(m.type!=='caco') head = hr>({imp:0.70,baron:0.80}[m.type]||0.78);                                        // 임프는 뿔 때문에 조금 낮게
        best={m,d:t,hy,head}; }
    }
    return best;
  }
  clear(){ for(const m of this.list) m.dispose(); for(const p of this.projs) p.kill(); this.list=[]; this.projs=[]; this.killed=0; }
}
class Barrels {
  constructor(game){ this.g=game; this.list=[]; }
  async spawnAll(defs){ const m=await Models.load('barrel'); for(const d of defs){ const o=new THREE.Group(); let mesh; if(m){ mesh=m.scene.clone(); Models.fit(mesh,1.1); } else { mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,1.1,10),new THREE.MeshLambertMaterial({color:0xaa2222})); mesh.position.y=0.55; } o.add(mesh); o.position.set(d.x*CS,0,d.y*CS); this.g.scene.add(o); this.list.push({x:d.x*CS,z:d.y*CS,obj:o,hp:20,alive:true,r:0.45}); } }
  hitscan(ox,oz,dx,dz,maxD){ let best=null; for(const b of this.list){ if(!b.alive) continue; const rx=b.x-ox,rz=b.z-oz; const t=rx*dx+rz*dz; if(t<0||t>maxD) continue; const dd=Math.hypot(ox+dx*t-b.x,oz+dz*t-b.z); if(dd>b.r) continue; if(!best||t<best.d) best={b,d:t,x:b.x,z:b.z}; } if(best){ const self=this; best.b.hurt=(n)=>self.hurt(best.b,n); } return best; }
  near(x,z,r){ for(const b of this.list){ if(b.alive && Math.hypot(b.x-x,b.z-z)<b.r+r) return b; } return null; }
  hurt(b,n){ if(!b.alive) return; b.hp-=n; if(b.hp<=0) this.explode(b); }
  explode(b){ b.alive=false; this.g.scene.remove(b.obj); FX.explosion(b.x,0.6,b.z,false); Audio3.play('explode',1,Math.hypot(this.g.player.x-b.x,this.g.player.z-b.z)); const R=3.2;
    for(const m of this.g.monsters.list){ if(!m.alive) continue; const d=Math.hypot(m.x-b.x,m.z-b.z); if(d<R) m.hurt(Math.round(110*(1-d/R*0.6)),(m.x-b.x)/(d+0.01),(m.z-b.z)/(d+0.01)); }
    const p=this.g.player; const pd=Math.hypot(p.x-b.x,p.z-b.z); if(pd<R) p.damage(Math.round(60*(1-pd/R)),null);
    setTimeout(()=>this.blast(b.x,b.z,R*0.8),120); }
  blast(x,z,R){ for(const b of this.list){ if(b.alive && Math.hypot(b.x-x,b.z-z)<R) this.hurt(b,100); } }
  solidCheck(p,r){ for(const b of this.list){ if(!b.alive) continue; const dx=p.x-b.x, dz=p.z-b.z; const d=Math.hypot(dx,dz); const min=r+b.r; if(d<min&&d>0.001){ p.x+=dx/d*(min-d); p.z+=dz/d*(min-d); } } }
  clear(){ for(const b of this.list) this.g.scene.remove(b.obj); this.list=[]; }
}
return {Manager,Barrels,Monster,Projectile,gait};
})();
