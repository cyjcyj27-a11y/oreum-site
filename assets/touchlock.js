/* 아이폰 사파리 가로 화면에서 손가락을 끌면 페이지 전체가 같이 밀리는 것을 막는다. 스크롤되는 창 안에서는 그대로 스크롤된다. */
(function(){
  var d=document.documentElement;
  var st=document.createElement('style');
  st.textContent='html,body{position:fixed;inset:0;width:100%;overflow:hidden;overscroll-behavior:none}';
  (document.head||d).appendChild(st);
  function canScroll(el){
    for(;el&&el.nodeType===1&&el!==document.body&&el!==d;el=el.parentElement){
      var s=getComputedStyle(el);
      if(/(auto|scroll)/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+1) return true;
      if(/(auto|scroll)/.test(s.overflowX)&&el.scrollWidth>el.clientWidth+1) return true;
    }
    return false;
  }
  document.addEventListener('touchmove',function(e){
    if(!e.cancelable) return;
    var t=e.target;
    if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable],input[type=range]')) return;
    if(canScroll(t)) return;
    e.preventDefault();
  },{passive:false});
})();
