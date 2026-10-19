/* 무기·몬스터·에피소드 수치 */
window.DATA = (function(){
const WEAPONS = [
  {id:'knife',  name:'KNIFE',    slot:1, ammo:null,     dmg:12, rate:0.45, range:1.9,  melee:true, kick:0.02, snd:'swing'},
  {id:'pistol', name:'PISTOL',   slot:2, ammo:'bullets',dmg:12, rate:0.36, spread:0.012, kick:0.05, snd:'pistol', flash:0.9},
  {id:'shotgun',name:'SHOTGUN',  slot:3, ammo:'shells', dmg:9,  rate:0.95, spread:0.07, pellets:7, kick:0.16, snd:'shotgun', flash:1.4},
  {id:'chaingun',name:'CHAINGUN',slot:4, ammo:'belt',   dmg:11, rate:0.09, spread:0.035, kick:0.03, snd:'chain', flash:0.8, auto:true},
  {id:'rocket', name:'ROCKET',   slot:5, ammo:'rockets',dmg:90, rate:0.8,  spread:0, kick:0.2, snd:'rocket', flash:1.2, proj:'rocket'},
  {id:'bfg',    name:'BFG',      slot:6, ammo:'cells',  dmg:400,rate:1.6,  spread:0, kick:0.25, snd:'bfg', flash:2.0, proj:'bfg'}
];
// 10/19 사장님 "권총과 기관총이 탄약 상자가 같은 색이면 안 되지": 권총탄(bullets)·기관총탄(belt)을 나눔. 상자 색은 game.js AMMO_COL
const AMMO_MAX = {bullets:150, belt:300, shells:50, rockets:30, cells:300};
const AMMO_PICK = {ammo:{bullets:20}, belt:{belt:40}, shells:{shells:8}, rockets:{rockets:2}, cells:{cells:40}};
// 무기를 처음 주울 때 주는 탄약
const AMMO_GIVE = {bullets:30, belt:60, shells:12, rockets:4, cells:60};
// 몬스터: hp, speed(m/s), 공격 종류, 사거리, 피해, 반지름, 키(m)
const MONSTERS = {
  zombie: {hp:30,  speed:2.1, attack:'bite', range:1.3, dmg:[3,7],  cd:1.4, r:0.4, h:1.8, pain:0.5, model:'zombie', score:1, sndSee:'zsee', sndAtk:'pbite', sndDie:'zdie'}, // 10/16 사장님: 좀비는 총 대신 달려들어 문다
  imp:    {hp:60,  speed:2.2, attack:'fireball',range:18, dmg:[8,16], cd:1.9, r:0.4, h:1.9, pain:0.45,model:'imp',    score:2, sndSee:'isee', sndAtk:'ifire', sndDie:'idie'},
  pinky:  {hp:300, speed:3.6, attack:'bite',    range:1.4,dmg:[10,22],cd:0.9, r:0.55,h:1.4, pain:0.25,model:'pinky', noAnim:true,  score:3, sndSee:'psee', sndAtk:'pbite', sndDie:'pdie'},
  caco:   {hp:340, speed:1.7, attack:'ball',    range:20, dmg:[10,24],cd:2.2, r:0.7, h:1.6, fly:true, pain:0.5, model:'caco', score:4, sndSee:'csee', sndAtk:'cfire', sndDie:'cdie'},
  baron:  {hp:700, speed:2.0, attack:'greenball',range:20,dmg:[18,40],cd:1.5, r:0.7, h:2.6, pain:0.15,model:'baron',  score:20, boss:true, sndSee:'bsee', sndAtk:'bfire', sndDie:'bdie'}
};
// 에피소드 재질 주제
const THEMES = [
  {wall:'MetalPlates013', floor:'MetalWalkway013', ceil:'Concrete042A', door:'MetalPlates006', fog:0x05060a, light:[0.55,1.0], sky:0x0a0c14},
  {wall:'Bricks059',      floor:'Concrete034',     ceil:'Rust004',      door:'MetalPlates013B', /* 10/19 문 질감: Metal032 는 무늬 없는 매끈한 회색이라 민짜로 보여서 → 녹을 푸른 얼룩으로 돌린 사본(사장님 "붉은 얼룩 말고 푸른 얼룩") */       fog:0x070806, light:[0.45,0.9],  sky:0x0c0a08},
  {wall:'Rock035',        floor:'Marble016',       ceil:'Rock035',      door:'Rust004',        fog:0x0a0404, light:[0.4,0.9],   sky:0x180604, lava:true},
  {wall:'Rust004',        floor:'PavingStones138', ceil:'Metal032',     door:'MetalPlates013B', fog:0x080604, light:[0.45,0.95], sky:0x100806},
  {wall:'Rock035',        floor:'Tiles074',        ceil:'Marble016',    door:'Rust004',        fog:0x100302, light:[0.35,0.9],  sky:0x200402, lava:true}
];
// 판별 설정: 몬스터 종류/수, 열쇠 수, 방 수, 보스
function levelDef(n){ // n: 0..29
  const ep = Math.floor(n/6), m = n%6, boss = (m===5);
  // 몬스터 등장 순서: 좀비(1판) → 임프(2판) → 핑키(4판) → 카코데몬(8판). 뒤로 갈수록 센 놈 비중이 는다
  const unlocked = ['zombie'].concat(n>=1?['imp']:[], n>=3?['pinky']:[], n>=7?['caco']:[]);
  const types = [];
  unlocked.forEach((t,i)=>{ const w = 1 + i*Math.min(3, Math.floor(n/5)); for(let k=0;k<w;k++) types.push(t); });
  return {
    n, ep, m, boss, theme:THEMES[ep], seed: 1000 + n*7919,
    rooms: 7 + m + ep*2 + (boss?2:0), size: 34 + m*2 + ep*4,
    monsters: Math.round((10 + m*3 + ep*5) * (boss?1.1:1)), types,
    keys: Math.min(3, (m>=1?1:0) + (m>=3?1:0) + (ep>=2&&m>=4?1:0)),
    secrets: 1 + (m>=2?1:0) + (ep>=1?1:0),
    par: 90 + m*30 + ep*40 + (boss?90:0),
    bossType: boss ? 'baron' : null,
    newWeapon: (n===0?'pistol': n===1?'shotgun': n===3?'chaingun': n===9?'rocket': n===20?'bfg': null)
  };
}
// 난이도(10/18 사장님 "시작할 때 쉬움/보통/어려움, 보통은 지금 그대로"): dmg=내가 받는 피해, hp=괴물 체력, count=괴물 수
const DIFF = {easy:{dmg:0.5,hp:0.75,count:0.7}, normal:{dmg:1,hp:1,count:1}, hard:{dmg:1.5,hp:1.15,count:1.25}};
return {WEAPONS, AMMO_MAX, AMMO_PICK, AMMO_GIVE, MONSTERS, THEMES, levelDef, LEVELS:30, DIFF};
})();
