/* 10/21 폰 점검 모드: 주소에 ?debug=1 일 때만 위쪽에 조작 상태를 숫자로 띄움(평소엔 아무것도 안 함) */
(function(){
  if(!/[?&]debug=1/.test(location.search)) return;
  const box=document.createElement('div');
  box.style.cssText='position:fixed;left:50%;top:40px;transform:translateX(-50%);z-index:99;pointer-events:none;background:rgba(0,0,0,.78);color:#7fff7f;font:12px/1.35 monospace;padding:4px 8px;white-space:pre;border-radius:4px';
  document.body.appendChild(box);
  const ev=[]; const keep=(t,e)=>{ ev.push(t+e.pointerId+'@'+(e.target.id||e.target.tagName).slice(0,6)); if(ev.length>6) ev.shift(); };
  for(const t of ['pointerdown','pointerup','pointercancel']) window.addEventListener(t,e=>keep(t.slice(7,9),e),true);
  let pm=0,tm=0,pmS=0,tmS=0; window.addEventListener('pointermove',()=>pm++,true); window.addEventListener('touchmove',()=>tm++,{capture:true,passive:true}); setInterval(()=>{ pmS=pm; tmS=tm; pm=tm=0; },1000);
  let frames=0, fps=0, lastX=0, lastZ=0, lastYaw=0; (function f(){ frames++; requestAnimationFrame(f); })(); setInterval(()=>{ fps=frames; frames=0; },1000);
  setInterval(()=>{
    const g=window.game; if(!g||!g.player) return; const P=g.player;
    const pr=document.getElementById('pad').getBoundingClientRect(); const a=document.elementFromPoint(pr.left+pr.width/2,pr.top+pr.height/2); const b=document.elementFromPoint(innerWidth*0.7,innerHeight*0.45);
    const mv=Math.hypot(P.x-lastX,P.z-lastZ), dy=P.yaw-lastYaw; lastX=P.x; lastZ=P.z; lastYaw=P.yaw;
    box.textContent='fps '+fps+'  play '+(g.playing?1:0)+' pause '+(g.paused?1:0)+' warm '+(g.warming?1:0)+' dead '+(P.dead?1:0)+' hp '+P.hp+' stop '+(g.stopT||0).toFixed(2)+'\n'+
      'pad '+(P.pad.on?1:0)+' '+P.pad.x.toFixed(2)+','+P.pad.y.toFixed(2)+' id'+P.pad.id+'  look '+(P.touchLook.active?1:0)+' id'+P.touchLook.id+'  mx '+P.mx.toFixed(0)+'  fire '+(P.fireHeld?1:0)+'\n'+
      'pos '+P.x.toFixed(2)+','+P.z.toFixed(2)+' mv '+mv.toFixed(2)+' yaw '+P.yaw.toFixed(2)+' d '+dy.toFixed(2)+' touch '+(g.touch?1:0)+' TE '+(P.useTouchEv?1:0)+'\n'+'pmove/s '+pmS+' tmove/s '+tmS+' lock '+(document.pointerLockElement?1:0)+'  padT '+P.padT+' lookT '+P.lookT+'\n'+
      'top@pad '+(a?(a.id||a.tagName):'-')+'  top@look '+(b?(b.id||b.tagName):'-')+'\n'+ev.join(' ');
  },250);
})();
