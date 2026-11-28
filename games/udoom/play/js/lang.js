/* 한·영·중·일·포·러 사전 — ?lang= 값이 en·zh·ja·pt·ru 일 때만 그 언어, 아니면 한국어 */
(function(){
const Q = new URLSearchParams(location.search).get('lang');
const LG = ['en','zh','ja','pt','ru'].includes(Q) ? Q : 'ko', EN = LG==='en';
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
,
  zh:{hud:{hp:'生命',ar:'护甲',ammo:{bullets:'手枪弹',belt:'机枪弹',shells:'霰弹',rockets:'火箭弹',cells:'能量',none:'弹药'},kills:'击杀',items:'物品',secrets:'秘密',time:'时间',par:'标准'},title:'UDOOM',sub:'把地狱来的家伙全部扫光',start:'START',cont:'继续游戏',opt:'设置',ep:'章节',how:'HOW TO PLAY',ok:'OK',
    how1:'用左边摇杆走路，拖动屏幕看四周。摇杆推到底就是跑。电脑用 WASD 和鼠标，按住 Shift 奔跑。',how2:'按 FIRE 开枪。准星变红就是能打中敌人。踩上掉落的箱子捡弹药。',how3:'找到彩色钥匙卡，打开同色的门，按下出口开关过关。还有隐藏的秘密墙。',
    clear:'LEVEL CLEAR',next:'NEXT',retry:'RETRY',home:'首页',pause:'PAUSE',resume:'继续',quit:'标题',reset:'从头开始',
    o1:'血腥效果',o2:'自动开火（手机）',o3:'镜头晃动',o4:'广视角',o5:'灵敏度',keys:'WASD 移动 · 鼠标 视角 · 点击 开火<br>1~6 武器 · 滚轮 切换 · E 打开 · Esc 暂停',
    rotate:'请把手机横过来',rotBtn:'横屏查看',
    pick:{medkit:'急救包',armor:'护甲',ammo:'手枪弹',belt:'机枪弹',rockets:'火箭弹',cells:'能量',shells:'霰弹',keyR:'红钥匙',keyY:'黄钥匙',keyB:'蓝钥匙',pistol:'手枪',shotgun:'霰弹枪',chaingun:'加特林',rocket:'火箭筒',bfg:'轨道炮',mega:'超级护甲',soul:'灵魂球'},
    locked:{R:'需要红钥匙',Y:'需要黄钥匙',B:'需要蓝钥匙'},secret:'发现秘密！',boss:'BOSS',
    end:'THE END',endTxt:'地狱之门关上了。<br>所有恶魔都被你扫光了，现在可以休息了。',
    lv:['机库','核工厂','毒物精炼厂','指挥控制室','火卫一研究所','中央处理厂','地狱下水道','仓库地下室','废料隧道','瞭望塔','冷却区','火焰之门','地狱入口','血之沼泽','白骨回廊','火焰教堂','燃烧之桥','恶魔祭坛','要塞外墙','拷问室','断头台广场','钢铁迷宫','堕落之塔','王之大厅','硫磺平原','核心','最后的阶梯','地狱咽喉','噩梦','末日'],
    eps:['E1 基地','E2 下水道','E3 地狱入口','E4 要塞','E5 地狱'],lock:'锁定',diff:'难度',easy:'简单',normal:'普通',hard:'困难',loading:'加载中'},
  ja:{hud:{hp:'体力',ar:'アーマー',ammo:{bullets:'拳銃弾',belt:'機関銃弾',shells:'散弾',rockets:'ロケット弾',cells:'エネルギー',none:'弾薬'},kills:'撃破',items:'アイテム',secrets:'シークレット',time:'時間',par:'目標'},title:'UDOOM',sub:'地獄から来たヤツらを全部ぶっ潰せ',start:'START',cont:'つづきから',opt:'設定',ep:'エピソード',how:'HOW TO PLAY',ok:'OK',
    how1:'左のパッドで歩き、画面をドラッグして見回す。パッドを端まで倒すとダッシュ。PCはWASDとマウス、Shiftを押すとダッシュ。',how2:'FIREで撃つ。照準が赤くなったら敵に当たる位置。弾は落ちている箱を踏んで拾う。',how3:'色付きのキーカードを探して同じ色の扉を開け、出口スイッチを押してステージを終える。隠し壁もある。',
    clear:'LEVEL CLEAR',next:'NEXT',retry:'RETRY',home:'ホーム',pause:'PAUSE',resume:'つづける',quit:'タイトル',reset:'最初から',
    o1:'流血表現',o2:'オート射撃（スマホ）',o3:'画面の揺れ',o4:'視野を広く',o5:'感度',keys:'WASD 移動 · マウス 視点 · クリック 射撃<br>1~6 武器 · ホイール 切替 · E 開ける · Esc 一時停止',
    rotate:'スマホを横向きにしてください',rotBtn:'横画面で見る',
    pick:{medkit:'救急箱',armor:'アーマー',ammo:'拳銃弾',belt:'機関銃弾',rockets:'ロケット弾',cells:'エネルギー',shells:'散弾',keyR:'赤いキー',keyY:'黄色いキー',keyB:'青いキー',pistol:'ピストル',shotgun:'ショットガン',chaingun:'チェーンガン',rocket:'ロケットランチャー',bfg:'軌道砲',mega:'メガアーマー',soul:'ソウルスフィア'},
    locked:{R:'赤いキーが必要だ',Y:'黄色いキーが必要だ',B:'青いキーが必要だ'},secret:'シークレット発見！',boss:'ボス',
    end:'THE END',endTxt:'地獄の門は閉ざされた。<br>すべての悪魔を一掃したキミは、もう休んでいい。',
    lv:['格納庫','核工場','毒物精製所','指揮統制室','フォボス研究所','中央処理施設','地獄の下水道','倉庫地下','廃棄物トンネル','監視塔','冷却区画','炎の門','地獄の入口','血の沼','骨の回廊','炎の聖堂','燃える橋','悪魔の祭壇','要塞外壁','拷問部屋','断頭台広場','鉄の迷宮','堕ちた塔','王の間','硫黄の平原','中枢','最後の階段','地獄の喉','悪夢','終末'],
    eps:['E1 基地','E2 下水道','E3 地獄の入口','E4 要塞','E5 地獄'],lock:'ロック',diff:'難易度',easy:'かんたん',normal:'ふつう',hard:'むずかしい',loading:'読み込み中'},
  pt:{hud:{hp:'VIDA',ar:'ARMADURA',ammo:{bullets:'BALAS',belt:'FITA',shells:'CARTUCHOS',rockets:'FOGUETES',cells:'CÉLULAS',none:'MUNIÇÃO'},kills:'ABATES',items:'ITENS',secrets:'SEGREDOS',time:'TEMPO',par:'META'},title:'UDOOM',sub:'ACABE COM TUDO QUE VEIO DO INFERNO',start:'START',cont:'CONTINUAR',opt:'OPÇÕES',ep:'EPISÓDIOS',how:'HOW TO PLAY',ok:'OK',
    how1:'Ande com o controle da esquerda e arraste a tela para olhar em volta. Empurre o controle até o fim para correr. No PC, use WASD e o mouse e segure Shift para correr.',how2:'Toque em FIRE para atirar. Se a mira ficar vermelha, o tiro acerta o inimigo. Passe por cima das caixas para pegar munição.',how3:'Ache os cartões coloridos, abra as portas da mesma cor e aperte o botão de saída para terminar a fase. Também há paredes secretas.',
    clear:'LEVEL CLEAR',next:'NEXT',retry:'RETRY',home:'INÍCIO',pause:'PAUSE',resume:'VOLTAR',quit:'TÍTULO',reset:'NOVO JOGO',
    o1:'Sangue',o2:'Tiro automático (celular)',o3:'Balanço da câmera',o4:'Visão ampla',o5:'Sensibilidade',keys:'WASD mover · mouse olhar · clique atirar<br>1-6 armas · roda trocar · E usar · Esc pausar',
    rotate:'Vire o celular de lado',rotBtn:'PAISAGEM',
    pick:{medkit:'KIT MÉDICO',armor:'ARMADURA',ammo:'BALAS',belt:'FITA DE METRALHADORA',rockets:'FOGUETES',cells:'CÉLULAS',shells:'CARTUCHOS',keyR:'CHAVE VERMELHA',keyY:'CHAVE AMARELA',keyB:'CHAVE AZUL',pistol:'PISTOLA',shotgun:'ESPINGARDA',chaingun:'METRALHADORA',rocket:'LANÇA-FOGUETES',bfg:'CANHÃO ORBITAL',mega:'MEGA-ARMADURA',soul:'ESFERA DA ALMA'},
    locked:{R:'Você precisa da chave vermelha',Y:'Você precisa da chave amarela',B:'Você precisa da chave azul'},secret:'Você achou um segredo!',boss:'CHEFÃO',
    end:'THE END',endTxt:'Os portões do inferno se fecharam.<br>Você acabou com todos os demônios. Agora pode descansar.',
    lv:['Hangar','Usina Nuclear','Refinaria de Toxinas','Centro de Comando','Laboratório de Fobos','Processamento Central','Esgotos do Inferno','Porão do Depósito','Túneis de Resíduos','Torre de Vigia','Zona de Resfriamento','Portão de Fogo','Entrada do Inferno','Pântano de Sangue','Corredor dos Ossos','Capela das Chamas','Ponte em Chamas','Altar do Demônio','Muralha da Fortaleza','Câmara de Tortura','Praça da Guilhotina','Labirinto de Ferro','Torre Caída','Salão do Rei','Planície de Enxofre','O Coração','Escada Final','Garganta do Inferno','Pesadelo','Fim do Mundo'],
    eps:['E1 BASE','E2 ESGOTOS','E3 PORTAL','E4 FORTALEZA','E5 INFERNO'],lock:'FECHADO',diff:'DIFICULDADE',easy:'FÁCIL',normal:'NORMAL',hard:'DIFÍCIL',loading:'CARREGANDO'},
  ru:{hud:{hp:'ЗДОРОВЬЕ',ar:'БРОНЯ',ammo:{bullets:'ПАТРОНЫ',belt:'ЛЕНТА',shells:'ДРОБЬ',rockets:'РАКЕТЫ',cells:'ЭНЕРГИЯ',none:'ПАТРОНЫ'},kills:'УБИТО',items:'ПРЕДМЕТЫ',secrets:'ТАЙНИКИ',time:'ВРЕМЯ',par:'НОРМА'},title:'UDOOM',sub:'ЗАЧИСТИ ВСЕХ, КТО ПРИШЁЛ ИЗ АДА',start:'START',cont:'ПРОДОЛЖИТЬ',opt:'НАСТРОЙКИ',ep:'ЭПИЗОДЫ',how:'HOW TO PLAY',ok:'OK',
    how1:'Левый джойстик — ходьба, проведи по экрану, чтобы осмотреться. Дожми джойстик до края — побежишь. На ПК: WASD и мышь, зажми Shift для бега.',how2:'Жми FIRE, чтобы стрелять. Прицел покраснел — значит, попадёшь во врага. Наступи на ящик, чтобы подобрать патроны.',how3:'Найди цветные ключ-карты, открой двери того же цвета и нажми выключатель выхода, чтобы пройти уровень. Есть и тайные стены.',
    clear:'LEVEL CLEAR',next:'NEXT',retry:'RETRY',home:'ГЛАВНАЯ',pause:'PAUSE',resume:'ДАЛЬШЕ',quit:'В МЕНЮ',reset:'ЗАНОВО',
    o1:'Кровь',o2:'Автоогонь (телефон)',o3:'Покачивание камеры',o4:'Широкий обзор',o5:'Чувствительность',keys:'WASD ходьба · мышь обзор · клик огонь<br>1-6 оружие · колесо смена · E открыть · Esc пауза',
    rotate:'Поверни телефон горизонтально',rotBtn:'ПОВЕРНУТЬ',
    pick:{medkit:'АПТЕЧКА',armor:'БРОНЯ',ammo:'ПАТРОНЫ',belt:'ПУЛЕМЁТНАЯ ЛЕНТА',rockets:'РАКЕТЫ',cells:'ЭНЕРГИЯ',shells:'ДРОБЬ',keyR:'КРАСНЫЙ КЛЮЧ',keyY:'ЖЁЛТЫЙ КЛЮЧ',keyB:'СИНИЙ КЛЮЧ',pistol:'ПИСТОЛЕТ',shotgun:'ДРОБОВИК',chaingun:'ПУЛЕМЁТ',rocket:'РАКЕТНИЦА',bfg:'ОРБИТАЛЬНАЯ ПУШКА',mega:'МЕГАБРОНЯ',soul:'СФЕРА ДУШИ'},
    locked:{R:'Нужен красный ключ',Y:'Нужен жёлтый ключ',B:'Нужен синий ключ'},secret:'Тайник найден!',boss:'БОСС',
    end:'THE END',endTxt:'Врата ада закрыты.<br>Ты перебил всех демонов. Теперь можно отдохнуть.',
    lv:['Ангар','Атомный завод','Завод токсинов','Командный пункт','Лаборатория Фобоса','Центр обработки','Адская канализация','Подвал склада','Тоннели отходов','Сторожевая башня','Зона охлаждения','Огненные врата','Вход в ад','Кровавое болото','Коридор костей','Огненная часовня','Горящий мост','Алтарь демона','Стена крепости','Пыточная','Площадь гильотины','Железный лабиринт','Павшая башня','Королевский зал','Серная равнина','Сердце','Последняя лестница','Глотка ада','Кошмар','Конец света'],
    eps:['E1 БАЗА','E2 КАНАЛИЗАЦИЯ','E3 ВХОД В АД','E4 КРЕПОСТЬ','E5 АД'],lock:'ЗАКРЫТ',diff:'СЛОЖНОСТЬ',easy:'ЛЕГКО',normal:'НОРМАЛЬНО',hard:'СЛОЖНО',loading:'ЗАГРУЗКА'}
};
window.L = D[LG]; window.LANG = LG;
if(LG==='zh'){
  /* 중국어: 게임 글꼴엔 한자가 없어 같은 이름에 기기 중국어 글꼴을 한자 범위로만 덧붙이고, 화면 글자·첫 화면 링크를 바꾼다 */
  document.documentElement.lang='zh-CN'; document.title='UDOOM';
  const zf="local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
  const ur='U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
  const st=document.createElement('style');
  st.textContent=['BRUSH','GUI','TitleFont','DOSGothic','Dunggeunmo'].map(f=>"@font-face{font-family:'"+f+"';src:"+zf+";unicode-range:"+ur+"}").join('')+'html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .sheet h2{-webkit-text-stroke-width:.3px}';
  document.head.appendChild(st);
  const T=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
  const hm=document.getElementById('home'); if(hm){ hm.textContent='首页'; hm.href='https://oreumgames.com/zh/'; }
  T('loadingT','加载中'); T('bCont','继续游戏'); T('bOpt','设置'); T('bLv','章节'); T('bHome','首页');
  T('diffTtl','难度'); T('dEasy','简单'); T('dNormal','普通'); T('dHard','困难'); T('bResume','继续'); T('bQuit','标题');
  T('optTtl','设置'); T('o1','血腥效果'); T('o2','自动开火（手机）'); T('o3','镜头晃动'); T('o4','广视角'); T('o5','灵敏度'); T('bReset','从头开始'); T('lvTtl','章节'); T('bEndHome','首页');
  const tl=document.getElementById('tlogo'); if(tl){ tl.src='assets/logo_en.webp'; tl.alt='UDOOM'; }
}
if(LG==='ja'||LG==='pt'||LG==='ru'){
  /* 일본어·포르투갈어·러시아어: 게임 글꼴에 없는 글자 범위만 기기 글꼴로 덧붙이고, 화면 글자·첫 화면 링크를 바꾼다 */
  const C=D[LG];
  document.documentElement.lang=LG==='pt'?'pt-BR':LG; document.title='UDOOM';
  const fams=['BRUSH','GUI','TitleFont','DOSGothic','Dunggeunmo'];
  let css='';
  if(LG==='ja'){
    const jf="local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur='U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    css=fams.map(f=>"@font-face{font-family:'"+f+"';src:"+jf+";unicode-range:"+ur+"}").join('')+'html[lang=ja] *{word-break:normal!important}html[lang=ja] .sheet h2{-webkit-text-stroke-width:.3px}';
  } else {
    const lf="local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur='U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    css=fams.map(f=>"@font-face{font-family:'"+f+"';src:"+lf+";unicode-range:"+ur+"}").join('');
  }
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  const T=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
  const hm=document.getElementById('home'); if(hm){ hm.textContent=C.home; hm.href='https://oreumgames.com/en/'; }
  T('loadingT',C.loading); T('bCont',C.cont); T('bOpt',C.opt); T('bLv',C.ep); T('bHome',C.home);
  T('diffTtl',C.diff); T('dEasy',C.easy); T('dNormal',C.normal); T('dHard',C.hard); T('bResume',C.resume); T('bQuit',C.quit);
  T('optTtl',C.opt); T('o1',C.o1); T('o2',C.o2); T('o3',C.o3); T('o4',C.o4); T('o5',C.o5); T('bReset',C.reset); T('lvTtl',C.ep); T('bEndHome',C.home);
  const tl=document.getElementById('tlogo'); if(tl){ tl.src='assets/logo_en.webp'; tl.alt='UDOOM'; }
}
})();
