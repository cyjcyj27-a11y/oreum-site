/* 한·영 사전 — ?lang=en 일 때만 영어 */
(function(){
const EN = /[?&]lang=en/.test(location.search);
const D = {
  ko:{hud:{hp:'체력',ar:'방어',ammo:{bullets:'권총탄',belt:'기관총탄',shells:'산탄',rockets:'로켓탄',cells:'에너지',none:'탄약'},kills:'처치',items:'아이템',secrets:'비밀',time:'시간',par:'기준'},title:'어둠',sub:'지옥에서 온 놈들을 전부 쓸어버려라',start:'START',cont:'계속하기',opt:'설정',ep:'에피소드',how:'HOW TO PLAY',ok:'OK',
    how1:'왼쪽 패드로 걷고 화면을 끌어 둘러본다. 패드를 끝까지 밀면 달린다. PC는 WASD와 마우스, Shift를 누르면 달린다.',how2:'FIRE로 쏜다. 조준점이 빨개지면 적이 맞는 자리. 탄은 떨어진 상자를 밟아 줍는다.',how3:'색 열쇠 카드를 찾아 같은 색 문을 열고, 출구 스위치를 눌러 판을 끝낸다. 비밀 벽도 있다.',
    clear:'LEVEL CLEAR',next:'NEXT',retry:'RETRY',home:'홈',pause:'PAUSE',resume:'계속',quit:'타이틀',reset:'처음부터',
    o1:'피 표현',o2:'자동 발사 (폰)',o3:'머리 흔들림',o4:'화각 넓게',o5:'감도',keys:'WASD 이동 · 마우스 시점 · 클릭 발사<br>1~6 무기 · 휠 바꾸기 · E 열기 · Esc 일시정지',
    rotate:'폰을 가로로 돌려 주세요',rotBtn:'가로로 보기',
    pick:{medkit:'구급상자',armor:'갑옷',ammo:'권총탄',belt:'기관총탄',rockets:'로켓탄',cells:'에너지',shells:'산탄',keyR:'빨간 열쇠',keyY:'노란 열쇠',keyB:'파란 열쇠',pistol:'권총',shotgun:'샷건',chaingun:'체인건',rocket:'로켓',bfg:'궤도포',mega:'메가 갑옷',soul:'소울 스피어'},
    locked:{R:'빨간 열쇠가 필요하다',Y:'노란 열쇠가 필요하다',B:'파란 열쇠가 필요하다'},secret:'비밀을 찾았다!',boss:'보스',
    end:'THE END',endTxt:'지옥의 문이 닫혔다.<br>모든 악마를 쓸어버린 당신, 이제 쉬어도 된다.',
    lv:['격납고','핵 공장','독극물 정제소','지휘 통제실','포보스 연구소','중앙 처리장','지옥 하수도','창고 지하','폐기물 터널','감시탑','냉각 구역','불의 문','지옥 입구','피의 늪','뼈의 회랑','화염 성당','불타는 다리','악마의 제단','요새 외벽','고문실','단두대 광장','철의 미궁','타락한 탑','왕의 홀','유황 평원','심장부','최후의 계단','지옥의 목구멍','악몽','종말'],
    eps:['E1 기지','E2 하수도','E3 지옥 입구','E4 요새','E5 지옥'],lock:'잠김',diff:'난이도',easy:'쉬움',normal:'보통',hard:'어려움',loading:'불러오는 중'},
  en:{hud:{hp:'HEALTH',ar:'ARMOR',ammo:{bullets:'BULLETS',belt:'BELT',shells:'SHELLS',rockets:'ROCKETS',cells:'CELLS',none:'AMMO'},kills:'KILLS',items:'ITEMS',secrets:'SECRETS',time:'TIME',par:'PAR'},title:'UDOOM',sub:'WIPE OUT EVERYTHING FROM HELL',start:'START',cont:'CONTINUE',opt:'OPTIONS',ep:'EPISODE',how:'HOW TO PLAY',ok:'OK',
    how1:'Walk with the left pad, drag the screen to look. Push the pad all the way to run. On PC use WASD and the mouse, hold Shift to run.',how2:'Tap FIRE to shoot. A red crosshair means a hit. Walk over boxes to pick up ammo.',how3:'Find colored keycards to open matching doors, then hit the exit switch. Secret walls exist too.',
    clear:'LEVEL CLEAR',next:'NEXT',retry:'RETRY',home:'HOME',pause:'PAUSE',resume:'RESUME',quit:'TITLE',reset:'NEW GAME',
    o1:'Blood',o2:'Auto fire (phone)',o3:'Head bob',o4:'Wide FOV',o5:'Sensitivity',keys:'WASD move · mouse look · click fire<br>1-6 weapons · wheel switch · E use · Esc pause',
    rotate:'Please rotate your phone',rotBtn:'LANDSCAPE',
    pick:{medkit:'MEDKIT',armor:'ARMOR',ammo:'BULLETS',belt:'CHAINGUN BELT',rockets:'ROCKETS',cells:'CELLS',shells:'SHELLS',keyR:'RED KEY',keyY:'YELLOW KEY',keyB:'BLUE KEY',pistol:'PISTOL',shotgun:'SHOTGUN',chaingun:'CHAINGUN',rocket:'ROCKET LAUNCHER',bfg:'BFG',mega:'MEGA ARMOR',soul:'SOUL SPHERE'},
    locked:{R:'You need the red key',Y:'You need the yellow key',B:'You need the blue key'},secret:'A secret is revealed!',boss:'BOSS',
    end:'THE END',endTxt:'The gates of hell are shut.<br>Every demon is dead. Rest now.',
    lv:['Hangar','Nuclear Plant','Toxin Refinery','Command Control','Phobos Lab','Central Processing','Hell Sewers','Storage Basement','Waste Tunnels','Watchtower','Cooling Zone','Gate of Fire','Hell Entrance','Blood Marsh','Hall of Bones','Flame Chapel','Burning Bridge','Demon Altar','Fortress Wall','Torture Room','Guillotine Square','Iron Maze','Fallen Tower','King\'s Hall','Sulfur Plain','The Heart','Final Stairs','Throat of Hell','Nightmare','Doomsday'],
    eps:['E1 BASE','E2 SEWERS','E3 HELL GATE','E4 FORTRESS','E5 HELL'],lock:'LOCKED',diff:'DIFFICULTY',easy:'EASY',normal:'NORMAL',hard:'HARD',loading:'LOADING'}
};
window.L = D[EN?'en':'ko']; window.LANG = EN?'en':'ko';
})();
