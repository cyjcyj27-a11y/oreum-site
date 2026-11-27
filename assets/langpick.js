/* 지구본 단추: 누르면 언어 목록을 열고, 바깥을 누르거나 Esc 를 누르면 닫는다 */
(function(){
  function init(){
    document.querySelectorAll('.langpick').forEach(function(p){
      var b=p.querySelector('.langbtn'),m=p.querySelector('.langmenu');if(!b||!m||b._lp)return;b._lp=1;
      function set(o){m.hidden=!o;b.setAttribute('aria-expanded',o?'true':'false')}
      b.addEventListener('click',function(e){e.stopPropagation();set(m.hidden)});
      document.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target))set(false)});
      document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
