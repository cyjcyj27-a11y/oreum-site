/* 타이틀 불티: 화면 아래에서 떠오르는 주황 불씨 (타이틀·엔딩처럼 게임 중이 아닐 때만) */
window.Embers=(function(){
  let cv,ctx,ps=[],W=0,H=0,last=0,on=false;
  function size(){ W=cv.width=innerWidth; H=cv.height=innerHeight; }
  function spawn(p){ p.x=Math.random()*W; p.y=H+10+Math.random()*40; p.r=0.7+Math.random()*1.6; p.vy=-(14+Math.random()*30); p.vx=(Math.random()-0.5)*14; p.life=0; p.max=4+Math.random()*5; p.ph=Math.random()*6.28; p.hot=Math.random()<0.25; return p; }
  function init(){ cv=document.getElementById('embers'); if(!cv) return; ctx=cv.getContext('2d'); size(); addEventListener('resize',size); for(let i=0;i<34;i++){ const p=spawn({}); p.y=Math.random()*H; p.life=Math.random()*p.max; ps.push(p); } }
  function draw(dt){
    if(!ctx) return; ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation='lighter';
    for(const p of ps){ p.life+=dt; if(p.life>p.max||p.y<-20) spawn(p); p.x+=(p.vx+Math.sin(p.life*1.7+p.ph)*9)*dt; p.y+=p.vy*dt; const a=Math.sin(Math.min(1,p.life/p.max)*Math.PI); const r=p.r*(p.hot?1.6:1);
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*4); g.addColorStop(0,'rgba(255,'+(p.hot?235:170)+',110,'+(0.9*a)+')'); g.addColorStop(0.3,'rgba(255,110,30,'+(0.45*a)+')'); g.addColorStop(1,'rgba(255,40,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,r*4,0,6.283); ctx.fill(); }
    ctx.globalCompositeOperation='source-over';
  }
  function tick(now){ if(!on) return; const dt=Math.min(0.05,(now-last)/1000||0.016); last=now; draw(dt); requestAnimationFrame(tick); }
  function set(v){ if(!cv) return; if(v===on) return; on=v; cv.style.display=v?'block':'none'; if(v){ last=performance.now(); requestAnimationFrame(tick); } }
  return {init,set,draw};
})();
