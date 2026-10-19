/* 플레이어: 이동·충돌·시점(PC 포인터 잠금 / 폰 패드+끌기), 체력·갑옷·열쇠·탄 */
window.Player = (function(){
const CS=2.0;
class Player {
  constructor(game){
    this.g=game; this.x=0; this.z=0; this.yaw=0; this.pitch=0; this.r=0.4; this.eye=1.6;
    this.hp=100; this.armor=0; this.keys={R:false,Y:false,B:false}; this.ammo={bullets:50,belt:0,shells:0,rockets:0,cells:0};
    this.weapons={knife:true}; this.cur='knife'; this.dead=false; this.bobT=0; this.speedMul=1;
    this.keysDown={}; this.mx=0; this.my=0; this.touchLook={active:false,id:-1,lx:0,ly:0}; this.pad={x:0,y:0,on:false,id:-1};
    this.fireHeld=false; this.lastStep=0; this.hurtT=0; this.lavaT=0;
    this.sens=8;
  }
  reset(x,z,a){ this.x=x; this.z=z; this.yaw=a; this.pitch=0; this.dead=false; this.hurtT=0; }
  fullReset(){ this.hp=100; this.armor=0; this.keys={R:false,Y:false,B:false}; this.ammo={bullets:50,belt:0,shells:0,rockets:0,cells:0}; this.weapons={knife:true}; this.cur='knife'; }
  bindInput(canvas){
    const self=this;
    window.addEventListener('keydown',e=>{ self.keysDown[e.code]=true; if(['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault(); self.g.onKey(e); });
    window.addEventListener('keyup',e=>{ self.keysDown[e.code]=false; });
    canvas.addEventListener('mousedown',e=>{ if(!self.g.playing) return; if(document.pointerLockElement!==canvas){ canvas.requestPointerLock&&canvas.requestPointerLock(); } if(e.button===0) self.fireHeld=true; });
    window.addEventListener('mouseup',e=>{ if(e.button===0) self.fireHeld=false; });
    window.addEventListener('mousemove',e=>{ if(document.pointerLockElement===canvas){ self.mx+=e.movementX; self.my+=e.movementY; } });
    window.addEventListener('wheel',e=>{ if(self.g.playing) self.g.weapons.cycle(e.deltaY>0?1:-1); },{passive:true});
    document.addEventListener('pointerlockchange',()=>{ if(document.pointerLockElement!==canvas && self.g.playing && !self.g.touch) self.g.pause(true); });
    // 폰: 왼쪽 패드(옆걸음), 오른쪽 끌기(시점)
    const pad=document.getElementById('pad'), knob=document.getElementById('knob');
    const R=()=>pad.getBoundingClientRect();
    pad.addEventListener('pointerdown',e=>{ self.pad.on=true; self.pad.id=e.pointerId; pad.setPointerCapture(e.pointerId); padMove(e); e.preventDefault(); });
    pad.addEventListener('pointermove',e=>{ if(self.pad.on&&e.pointerId===self.pad.id) padMove(e); });
    const padUp=e=>{ if(e.pointerId===self.pad.id){ self.pad.on=false; self.pad.x=self.pad.y=0; knob.style.transform='translate(0,0)'; } };
    pad.addEventListener('pointerup',padUp); pad.addEventListener('pointercancel',padUp);
    function padMove(e){ const r=R(); const cx=r.left+r.width/2, cy=r.top+r.height/2; let dx=(e.clientX-cx)/(r.width/2), dy=(e.clientY-cy)/(r.height/2); const d=Math.hypot(dx,dy); if(d>1){dx/=d;dy/=d;} self.pad.x=dx; self.pad.y=dy; knob.style.transform='translate('+(dx*r.width*0.3)+'px,'+(dy*r.height*0.3)+'px)'; }
    canvas.addEventListener('pointerdown',e=>{ if(e.pointerType!=='touch') return; if(e.clientX<window.innerWidth*0.45) return; if(self.touchLook.active) return; self.touchLook.active=true; self.touchLook.id=e.pointerId; self.touchLook.lx=e.clientX; self.touchLook.ly=e.clientY; });
    canvas.addEventListener('pointermove',e=>{ if(self.touchLook.active&&e.pointerId===self.touchLook.id){ self.mx+=(e.clientX-self.touchLook.lx)*2.2; self.my+=(e.clientY-self.touchLook.ly)*2.2; self.touchLook.lx=e.clientX; self.touchLook.ly=e.clientY; } });
    const tlUp=e=>{ if(e.pointerId===self.touchLook.id){ self.touchLook.active=false; self.touchLook.id=-1; } };
    canvas.addEventListener('pointerup',tlUp); canvas.addEventListener('pointercancel',tlUp);
    const fire=document.getElementById('fire');
    fire.addEventListener('pointerdown',e=>{ self.fireHeld=true; fire.classList.add('on'); fire.setPointerCapture(e.pointerId); e.preventDefault(); });
    const fUp=()=>{ self.fireHeld=false; fire.classList.remove('on'); };
    fire.addEventListener('pointerup',fUp); fire.addEventListener('pointercancel',fUp);
    document.getElementById('tbPrev').addEventListener('pointerdown',e=>{ self.g.weapons.cycle(-1); e.preventDefault(); });
    document.getElementById('tbNext').addEventListener('pointerdown',e=>{ self.g.weapons.cycle(1); e.preventDefault(); });
  }
  update(dt){
    const g=this.g, w=g.world; if(this.dead) return;
    // 시점
    const s=this.sens*0.00028;
    this.yaw -= this.mx*s; this.pitch -= this.my*s; this.mx=0; this.my=0;
    this.pitch=Math.max(-1.2,Math.min(1.2,this.pitch));
    // 이동 입력
    let fw=0, st=0, run=false;
    const k=this.keysDown;
    if(k.KeyW||k.ArrowUp) fw+=1; if(k.KeyS||k.ArrowDown) fw-=1; if(k.KeyD||k.ArrowRight) st+=1; if(k.KeyA||k.ArrowLeft) st-=1;
    if(k.ShiftLeft||k.ShiftRight) run=true;
    if(this.pad.on){ const d=Math.hypot(this.pad.x,this.pad.y); if(d>0.22){ fw=-this.pad.y; st=this.pad.x; if(d>0.78) run=true; } }
    const len=Math.hypot(fw,st); if(len>1){fw/=len;st/=len;}
    const sp=(run?5.6:3.6)*this.speedMul;
    const sy=Math.sin(this.yaw), cy=Math.cos(this.yaw);
    // 앞 = -z 방향 기준: forward=(−sin yaw, −cos yaw)
    const vx=(-sy*fw + cy*st)*sp, vz=(-cy*fw - sy*st)*sp;
    const p={x:this.x,z:this.z};
    w.moveCircle(p,this.r,vx*dt,vz*dt,'player');
    this.x=p.x; this.z=p.z;
    const moving=len>0.1;
    // 발소리는 머리 흔들림(bobT)과 따로 센다: 멈출 때 bobT 를 반올림해 되돌리면 다음 발소리가 0~0.8초로 들쭉날쭉해 '났다 안 났다' 했음(10/19)
    if(moving){ this.bobT+=dt*(run?11:8); this.stepAcc=(this.stepAcc==null?Math.PI*0.6:this.stepAcc)+dt*(run?11:8); if(this.stepAcc>=Math.PI){ this.stepAcc-=Math.PI; Audio3.play('step',0.5); } }
    else { this.bobT=Math.round(this.bobT/Math.PI)*Math.PI; this.stepAcc=Math.PI*0.6; }   // 다시 걸으면 0.15초 안에 첫 발
    this.moving=moving; this.running=run;
    // 문 자동 열기
    const t=w.touchDoors(p,this.r,this.keys); if(t==='door') Audio3.play('door',0.7); else if(t&&t.startsWith('locked')){ if(!this.lockMsgT||g.time-this.lockMsgT>2){ this.lockMsgT=g.time; g.msg(L.locked[t[6]]); Audio3.play('locked'); } }
    // 용암
    const cv=w.cell(Math.floor(this.x/CS),Math.floor(this.z/CS));
    if(cv===w.map.LAVA){ this.lavaT+=dt; if(this.lavaT>0.5){ this.lavaT=0; this.damage(10,null,true); Audio3.play('lava'); } }
    if(this.hurtT>0) this.hurtT-=dt;
  }
  forward(){ return {x:-Math.sin(this.yaw), z:-Math.cos(this.yaw)}; }
  damage(n,from,noArmor){
    if(this.dead||this.g.god) return;
    n=Math.max(1,Math.round(n*((DATA.DIFF[this.g.diff]||DATA.DIFF.normal).dmg)));   // 난이도
    let d=n; if(this.armor>0&&!noArmor){ const ab=Math.min(this.armor,Math.floor(n/3)); this.armor-=ab; d-=ab; }
    this.hp-=d; this.hurtT=0.35; this.g.hud.flash('hurt'); if(from){ const dx=from.x-this.x,dz=from.z-this.z; const want=Math.atan2(-dx,-dz); let a=want-this.yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); this.g.hud.hurtDir(a); } Audio3.play('hurt',0.8); FX.shake(Math.min(0.6,0.15+d*0.015));
    if(this.hp<=0){ this.hp=0; this.dead=true; Audio3.play('pdeath'); this.g.onPlayerDeath(); }
  }
  giveAmmo(type,n){ const mx=DATA.AMMO_MAX[type]; this.ammo[type]=this.ammo[type]||0; if(this.ammo[type]>=mx) return false; this.ammo[type]=Math.min(mx,this.ammo[type]+n); return true; }
}
return {Player};
})();
