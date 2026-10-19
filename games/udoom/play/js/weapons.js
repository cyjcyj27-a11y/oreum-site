/* 무기: 1인칭 손 모델(카메라 자식), 발사(히트스캔·산탄·근접·발사체), 반동·흔들림, 탄피 */
window.Weapons = (function(){
class Weapons {
  constructor(game){ this.g=game; this.cool=0; this.kick=0; this.swap=0; this.models={}; this.holder=new THREE.Group(); this.g.camera.add(this.holder); this.holder.position.set(0.16,-0.16,-0.30); this.cur=null; this.curId=null; this.flashSprite=null; this.flashT=0; this.muzzle=new THREE.PointLight(0xffc070,0,7); this.g.scene.add(this.muzzle); }
  async load(){
    const ids=['knife','pistol','shotgun','chaingun','rocket'];
    // 팔·총 재질은 무광 Lambert 로 바꿔 반짝임을 없애고 색을 0.28·0.25·0.25 배로 어둡게 — 10/16 사장님 "팔이 너무 밝다", "반짝거린다"
    await Promise.all(ids.map(async id=>{ const m=await Models.load('arm_'+id) || await Models.load(id); if(!m) return; const o=m.scene; o.traverse(c=>{ if(c.isMesh){ c.material=c.material.clone(); c.material.depthTest=false; c.renderOrder=999; c.frustumCulled=false; const om=c.material; const tint=new THREE.Color(0.28,0.25,0.25); c.material=new THREE.MeshLambertMaterial({map:om.map||null,color:(om.color?om.color.clone():new THREE.Color(1,1,1)).multiply(tint),transparent:!!om.transparent,opacity:om.opacity==null?1:om.opacity,side:om.side,depthTest:false}); c.material.renderOrder=999; } }); this.models[id]=o; }));
    // 총구 섬광 스프라이트
    const cv=document.createElement('canvas'); cv.width=cv.height=128; const c=cv.getContext('2d'); c.translate(64,64); const gr=c.createRadialGradient(0,0,0,0,0,60); gr.addColorStop(0,'rgba(255,255,240,1)'); gr.addColorStop(0.3,'rgba(255,220,120,.9)'); gr.addColorStop(1,'rgba(255,120,20,0)'); c.fillStyle=gr; for(let i=0;i<10;i++){ c.rotate(Math.PI/5); c.beginPath(); c.moveTo(0,-6); c.lineTo(30+Math.random()*32,0); c.lineTo(0,6); c.closePath(); c.fill(); } c.beginPath(); c.arc(0,0,22,0,Math.PI*2); c.fill();
    const sm=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false,blending:THREE.AdditiveBlending}); this.flashSprite=new THREE.Sprite(sm); this.flashSprite.scale.set(0.5,0.5,1); this.flashSprite.position.set(-0.05,0.12,-0.75); this.flashSprite.visible=false; this.holder.add(this.flashSprite);
  }
  // 모델마다 손에 들린 자세(위치·회전·크기) — 뷰모델 기준값
  pose(id){ const D=Math.PI/180; return {knife:{p:[0.16,-0.16,-0.40],r:[-55*D,300*D,0],s:0.70,pivot:[0.5,-0.85,0.47],stab:[0.45,0.7,0.2]},pistol:{p:[0.14,-0.18,-0.38],r:[0,275*D,0],s:0.85},shotgun:{p:[0.10,-0.20,-0.42],r:[0,270*D,0],s:1.1},chaingun:{p:[0.10,-0.20,-0.42],r:[0,265*D,0],s:1.1},rocket:{p:[0.24,-0.13,-0.42],r:[0,140*D,0],s:1.1}}[id]||{p:[0,0,-0.4],r:[0,0,0],s:0.6}; }
  select(id,force){
    const p=this.g.player; if(!p.weapons[id]&&!force) return; if(this.curId===id) return;
    if(this.cur){ this.holder.remove(this.cur); }
    this.curId=id; const o=this.models[id];
    if(o){ const ps=this.pose(id); o.position.set(0,0,0); o.rotation.set(...ps.r); o.scale.setScalar(1); const b=Models.bounds(o); const size=new THREE.Vector3(); b.getSize(size); const sc=ps.s/Math.max(0.001,Math.max(size.x,size.y,size.z)); const mx=ps.m?ps.m[0]:1,my=ps.m?ps.m[1]:1,mz=ps.m?ps.m[2]:1; o.scale.set(sc*mx,sc*my,sc*mz); const c=new THREE.Vector3(); b.getCenter(c); c.set(c.x*sc*mx,c.y*sc*my,c.z*sc*mz).applyEuler(o.rotation); o.position.set(ps.p[0]-c.x,ps.p[1]-c.y,ps.p[2]-c.z); this.piv=null; if(ps.pivot){ const q=new THREE.Vector3(ps.pivot[0]*sc*mx,ps.pivot[1]*sc*my,ps.pivot[2]*sc*mz).applyEuler(o.rotation).add(o.position); const piv=new THREE.Group(); piv.position.copy(q); o.position.sub(q); piv.add(o); this.holder.add(piv); this.cur=piv; this.piv=piv; } else { this.holder.add(o); this.cur=o; }
      if(ps.stumps){ this.holder.position.set(0.16,-0.16,-0.30); this.holder.rotation.set(0,0,0); this.g.camera.updateMatrixWorld(true); this.holder.updateMatrixWorld(true); let need=0; for(const st of ps.stumps){ const w=o.localToWorld(new THREE.Vector3(st[0],st[1],st[2])); const c=this.g.camera.worldToLocal(w); if(c.z<0.08) need=Math.max(need,0.08-c.z); } if(need>0) this.cur.position.z+=need; this.pulled=need; } }
    this.swap=0.3; p.cur=id; this.g.hud.weapons();
  }
  def(){ return DATA.WEAPONS.find(w=>w.id===this.curId); }
  cycle(dir){ const p=this.g.player; const list=DATA.WEAPONS.filter(w=>p.weapons[w.id]); let i=list.findIndex(w=>w.id===this.curId); i=(i+dir+list.length)%list.length; this.select(list[i].id); }
  bestAvailable(){ const p=this.g.player; const list=DATA.WEAPONS.filter(w=>p.weapons[w.id]&&(!w.ammo||p.ammo[w.ammo]>0)); return list.length?list[list.length-1].id:'knife'; }
  update(dt){
    const g=this.g, p=g.player, d=this.def(); if(!d) return;
    if(this.cool>0) this.cool-=dt; if(this.swap>0) this.swap-=dt;
    this.kick*=Math.pow(0.001,dt);
    if(this.flashT>0){ this.flashT-=dt; if(this.flashT<=0){ this.flashSprite.visible=false; } }
    if(this.camKick>0){ this.camKick*=Math.pow(0.0005,dt); }
    // 손맛: 걷기 흔들림 + 시점 돌릴 때 뒤따라오기(무게) + 반동(뒤·위로 튀고 되돌아옴) + 샷건 펌프 + 체인건 진동 + 칼 베기
    const bob=(g.opts.bob!==false)?1:0.25; const bt=p.bobT; const amp=p.moving?(p.running?0.03:0.02):0.004;
    const dyaw=p.yaw-(this.lastYaw==null?p.yaw:this.lastYaw), dpit=p.pitch-(this.lastPitch==null?p.pitch:this.lastPitch); this.lastYaw=p.yaw; this.lastPitch=p.pitch;
    this.swayX=(this.swayX||0)*0.86 + dyaw*1.6; this.swayY=(this.swayY||0)*0.86 + dpit*1.2;
    this.swayX=Math.max(-0.12,Math.min(0.12,this.swayX)); this.swayY=Math.max(-0.1,Math.min(0.1,this.swayY));
    const rec=this.kick; // 0~0.25 지수 감쇠
    let px=0.16+Math.sin(bt)*amp*bob - this.swayX*0.9, py=-0.16+Math.abs(Math.cos(bt))*amp*1.3*bob + this.swayY*0.6 - rec*0.12 - (this.swap>0?this.swap*1.1:0), pz=-0.30+rec*0.22;
    let rx=-rec*1.1 - this.swayY*1.2, ry=Math.sin(bt)*amp*0.5*bob - this.swayX*1.2, rz=this.swayX*0.4;
    if(this.pumpT>0){ this.pumpT-=dt; const k=Math.sin(Math.min(1,(0.55-this.pumpT)/0.55)*Math.PI); py-=k*0.06; rx-=k*0.18; rz+=k*0.1; }
    if(this.curId==='chaingun' && this.spin>0){ px+=(Math.random()-0.5)*0.012*this.spin; py+=(Math.random()-0.5)*0.012*this.spin; rz+=(Math.random()-0.5)*0.03*this.spin; }
    if(this.spin>0) this.spin=Math.max(0,this.spin-dt*2.5);
    if(this.curId==='knife' && this.stabT>0){ this.stabT-=dt; const u=1-this.stabT/0.32; const sw=Math.sin(u*Math.PI); if(this.piv){ const sr=window.__stabRot||this.pose(this.curId).stab||[0,-1.0,0]; this.piv.rotation.set(sr[0]*sw,sr[1]*sw,sr[2]*sw); } else { px+= -0.16*sw; pz+= -0.14*sw; ry+= 0.45*sw; } } else if(this.curId==='knife' && this.piv){ this.piv.rotation.set(0,0,0); }
    // 창이 16:9 보다 좁으면 가로 시야가 줄어 팔 끝이 안으로 들어온다 → 손 위치의 가로 좌표를 비율만큼 줄여 화면상 자리를 똑같이 유지
    const asp=this.g.camera.aspect||1.78; const k=window.__noAspectFix?1:Math.max(0.5,Math.min(1.5,asp/1.78)); const hx=0.16+((this.pose(this.curId)||{p:[0]}).p[0]||0); px+=(k-1)*hx;
    this.holder.position.set(px,py,pz); this.holder.rotation.set(rx,ry,rz);
    // 발사
    const want = p.fireHeld || (g.touch && g.opts.auto!==false && g.hud.hot && !p.dead);
    if(want && this.cool<=0 && this.swap<=0 && !p.dead){ this.fire(d); if(!d.auto) p.fireHeld = g.touch ? p.fireHeld : false; }
  }
  fire(d){
    const g=this.g, p=g.player;
    if(d.ammo){ if(p.ammo[d.ammo]<=0){ Audio3.play('empty'); const b=this.bestAvailable(); if(b!==this.curId) this.select(b); this.cool=0.3; return; } p.ammo[d.ammo]--; }
    this.cool=d.rate; this.kick=Math.min(0.3,this.kick*0.5+d.kick*1.4); Audio3.play(d.snd); if(this.curId==='shotgun') this.pumpT=0.55; if(this.curId==='chaingun') this.spin=Math.min(1,(this.spin||0)+0.5); g.fovPunch=(g.fovPunch||0)+d.kick*14;
    const f=p.forward(); const ox=p.x, oz=p.z, oy=p.eye;
    const dirY=Math.sin(p.pitch); const cosP=Math.cos(p.pitch);
    if(d.melee){ this.stabT=0.32; FX.slash(ox,oy,oz,f.x,f.z); setTimeout(()=>{ const hit=g.monsters.hitscan(p.x,p.z,p.eye,f.x*cosP,dirY,f.z*cosP,d.range,0.6); if(hit){ hit.m.hurt(d.dmg+Math.floor(Math.random()*5),f.x,f.z,true); Audio3.play('stab'); g.hud.hitmark(hit.m.alive?1:2); FX.shake(0.15); } else { const b=g.barrels.hitscan(p.x,p.z,f.x,f.z,d.range); if(b) b.hurt(d.dmg); } },110); g.hud.weapons(); return; }
    const n=d.pellets||1; let hitAny=null, headAny=false, killAny=false;
    for(let i=0;i<n;i++){
      const sx=(Math.random()-0.5)*2*d.spread, sy=(Math.random()-0.5)*2*d.spread;
      // 방향: forward 를 yaw 로 회전된 좌표에서 살짝 틀기
      const rx=-f.z, rz=f.x; // 오른쪽
      let dx=f.x*cosP+rx*sx, dz=f.z*cosP+rz*sx, dy=dirY+sy; const l=Math.hypot(dx,dy,dz); dx/=l;dy/=l;dz/=l;
      if(d.proj){ g.monsters.spawnProjectile(d.proj,ox+dx*0.6,oy+dy*0.6-0.15,oz+dz*0.6,dx,dy,dz,d.dmg,'player'); continue; }
      const wall=g.world.rayWall(ox,oz,dx,dz,60,'shot'); const maxD=wall?wall.d:60;
      const hit=g.monsters.hitscan(ox,oz,oy,dx,dy,dz,maxD,0);
      const bar=g.barrels.hitscan(ox,oz,dx,dz,hit?hit.d:maxD);
      if(bar&&(!hit||bar.d<hit.d)){ bar.b.hurt(d.dmg); FX.sparks(bar.x-dx*0.4,1,bar.z-dz*0.4,-dx,-dz,6); }
      else if(hit){ const was=hit.m.alive; const head=hit.head; hit.m.hurt((d.dmg+Math.floor(Math.random()*4))*(head?2:1),dx,dz,false);   // 머리는 피해 2배
        if(head){ headAny=true; FX.blood(ox+dx*hit.d,hit.hy,oz+dz*hit.d,dx,dz,14); }
        if(!hitAny) hitAny=hit; if(was&&!hit.m.alive) killAny=true; }
      else if(wall){ const hy=oy+dy*wall.d; if(hy>0&&hy<4) FX.bulletHole(wall.x,hy,wall.z,wall.nx,wall.nz); }
    }
    if(hitAny){ Audio3.play('hit',0.7,hitAny.d); if(headAny) Audio3.play('stab',0.9,hitAny.d); g.hud.hitmark(killAny?2:(headAny?3:1)); if(killAny) g.hitStop(headAny?0.09:0.06); }   // 머리: 퍽 소리 하나 더 + 조준점 표시 다르게
    this.flashSprite.visible=true; this.flashSprite.scale.setScalar((0.45+0.35*(d.flash||1))*(0.8+Math.random()*0.5)); this.flashSprite.material.rotation=Math.random()*6.28; this.flashT=0.06;
    FX.muzzle(ox+f.x*0.9, oy-0.05, oz+f.z*0.9, d.flash||1); this.camKick=(this.camKick||0)+d.kick*0.9; if(d.kick>0.1) FX.shake(d.kick*1.2);
    if(d.ammo==='bullets'||d.ammo==='belt'||d.ammo==='shells'){ const rx=-f.z, rz=f.x; FX.casing(ox+f.x*0.5+rx*0.3, oy-0.2, oz+f.z*0.5+rz*0.3, rx, rz); }
    g.hud.weapons();
  }
}
return {Weapons};
})();
