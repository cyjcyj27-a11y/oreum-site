// 운빨용사 데이터: 카드·부적·괴물·막 구성. 글은 한·영 둘 다.
(function () {
  const EN = /[?&]lang=en/.test(location.search);
  const ZHL = /[?&]lang=zh/.test(location.search) && !!window.ZHT;
  const L3 = !EN && !ZHL && !!window.L3T;
  const T = (window.T = (ko, en) => (EN ? en : ZHL ? window.ZHT(ko, en) : L3 ? window.L3T(ko, en) : ko));
  window.EN = EN;
  const D = (window.DATA = {});

  // 카드: cost, type(atk 공격 / def 방어 / luck 운 / power 지속), rare(금테), art, tgt(적 하나 고름), all(모든 적), dice(주사위 굴림)
  // run(G, v, m, t): v=주사위 눈(1~7), m=배수(꽝 0·보통 1·대박 2·잭팟 3), t=대상
  const C = (D.CARDS = {});
  function card(id, o) { o.id = id; C[id] = o; }
  card('slash', { n: ['베기', 'Slash'], cost: 1, type: 'atk', art: 'c_sword', tgt: 1, dice: 1, d: ['피해 3+주사위', 'Deal 3+DIE'], run: (G, v, m, t) => G.hit(t, (3 + v) * m) });
  card('guard', { n: ['막기', 'Guard'], cost: 1, type: 'def', art: 'c_shield', dice: 1, d: ['방어 3+주사위', 'Block 3+DIE'], run: (G, v, m) => G.block((3 + v) * m) });
  card('coin', { n: ['행운의 동전', 'Lucky Coin'], cost: 0, type: 'luck', art: 'c_coin', d: ['다음 주사위 +2', 'Next DIE +2'], run: (G) => { G.p.bonus += 2; } });

  card('bash', { n: ['강타', 'Bash'], cost: 2, type: 'atk', art: 'c_big', tgt: 1, dice: 1, d: ['피해 8+주사위x2', 'Deal 8+DIEx2'], run: (G, v, m, t) => G.hit(t, (8 + v * 2) * m) });
  card('twin', { n: ['연속 베기', 'Twin Slash'], cost: 1, type: 'atk', art: 'c_sword', tgt: 1, dice: 1, d: ['피해 2+주사위\n두 번 때림', 'Deal 2+DIE twice'], run: async (G, v, m, t) => { await G.hit(t, (2 + v) * m); await G.hit(t, (2 + v) * m); } });
  card('shbash', { n: ['방패 치기', 'Shield Bash'], cost: 1, type: 'atk', art: 'c_shield', tgt: 1, d: ['내 방어만큼 피해', 'Deal damage = your Block'], run: (G, v, m, t) => G.hit(t, G.p.blk, 1) });
  card('wall', { n: ['철벽', 'Iron Wall'], cost: 2, type: 'def', art: 'c_shield', dice: 1, d: ['방어 8+주사위x2', 'Block 8+DIEx2'], run: (G, v, m) => G.block((8 + v * 2) * m) });
  card('flip', { n: ['동전 던지기', 'Coin Flip'], cost: 1, type: 'atk', art: 'c_coin', tgt: 1, d: ['앞면: 피해 16 / 뒷면: 잎 2', 'Heads: Deal 16 / Tails: 2 leaves'], run: (G, v, m, t) => G.flip(t) });
  card('chisel', { n: ['주사위 깎기', 'Loaded Die'], cost: 0, type: 'luck', art: 'c_dice', d: ['이번 턴 주사위 +1', 'DIE +1 this turn'], run: (G) => { G.p.turnBonus += 1; } });
  card('pray', { n: ['기도', 'Pray'], cost: 1, type: 'luck', art: 'c_star', d: ['잎 1, 카드 1장', '1 leaf, draw 1'], run: async (G) => { await G.leaf(1); G.draw(1); } });
  card('allin', { n: ['올인', 'All In'], cost: 2, type: 'atk', art: 'c_dice', tgt: 1, dice: 1, d: ['피해 주사위x5\n꽝이면 내 체력 -5', 'Deal DIEx5\nMiss: lose 5 HP'], miss: (G) => G.selfHurt(5), run: (G, v, m, t) => G.hit(t, v * 5 * m) });
  card('sting', { n: ['독침', 'Venom'], cost: 1, type: 'atk', art: 'c_poison', tgt: 1, dice: 1, d: ['독 1+주사위', 'Poison 1+DIE'], run: (G, v, m, t) => G.status(t, 'poi', (1 + v) * m) });
  card('scare', { n: ['겁주기', 'Scare'], cost: 1, type: 'def', art: 'c_devil', tgt: 1, dice: 1, d: ['방어 2+주사위, 약화 2', 'Block 2+DIE, Weak 2'], run: (G, v, m, t) => { G.block((2 + v) * m); G.status(t, 'weak', 2); } });
  card('vital', { n: ['급소 찌르기', 'Vital Strike'], cost: 1, type: 'atk', art: 'c_sword', tgt: 1, dice: 1, d: ['피해 2+주사위, 취약 2', 'Deal 2+DIE, Vulnerable 2'], run: async (G, v, m, t) => { await G.hit(t, (2 + v) * m); G.status(t, 'vuln', 2); } });
  card('potion', { n: ['회복 물약', 'Potion'], cost: 1, type: 'luck', art: 'c_potion', dice: 1, ex: 1, d: ['체력 3+주사위 회복\n소멸', 'Heal 3+DIE\nExhaust'], run: (G, v, m) => G.heal((3 + v) * m) });
  card('reroll', { n: ['다시 굴리기', 'Reroll'], cost: 0, type: 'luck', art: 'c_wind', d: ['카드 1장\n다음 주사위 최소 3', 'Draw 1\nNext DIE at least 3'], run: (G) => { G.draw(1); G.p.floor3 = 1; } });
  card('counter', { n: ['반격 자세', 'Counter'], cost: 1, type: 'def', art: 'c_shield', dice: 1, d: ['방어 3+주사위\n이번 턴 맞으면 반격 4', 'Block 3+DIE\nRetaliate 4 this turn'], run: (G, v, m) => { G.block((3 + v) * m); G.p.ctr += 4; } });
  card('charm', { n: ['행운 부적', 'Lucky Charm'], cost: 1, type: 'power', art: 'c_clover', d: ['턴마다 잎 1', 'Each turn: 1 leaf'], run: (G) => { G.p.pw.charm = (G.p.pw.charm || 0) + 1; } });
  card('eye', { n: ['도박사의 눈', "Gambler's Eye"], cost: 1, type: 'power', art: 'c_eye', d: ['대박이 나오면 카드 1장', 'On CRIT: draw 1'], run: (G) => { G.p.pw.eye = (G.p.pw.eye || 0) + 1; } });
  card('dance', { n: ['칼춤', 'Blade Dance'], cost: 1, type: 'atk', art: 'c_spin', tgt: 1, dice: 1, d: ['주사위 눈만큼\n피해 2씩 때림', 'Hit for 2,\nDIE times'], run: async (G, v, m, t) => { for (let i = 0; i < v * m; i++) { if (!G.alive(t)) t = G.firstFoe(); if (!t) break; await G.hit(t, 2, 0, 90); } } });
  card('whirl', { n: ['회전 베기', 'Whirlwind'], cost: 1, type: 'atk', art: 'c_spin', all: 1, dice: 1, d: ['모든 적 피해 2+주사위', 'Deal 2+DIE to ALL'], run: (G, v, m) => G.hitAll((2 + v) * m) });
  card('leech', { n: ['흡혈', 'Leech'], cost: 2, type: 'atk', art: 'c_heart', tgt: 1, dice: 1, d: ['피해 5+주사위\n준 피해 절반 회복', 'Deal 5+DIE\nHeal half dealt'], run: async (G, v, m, t) => { const d = await G.hit(t, (5 + v) * m); G.heal(Math.floor(d / 2)); } });
  card('shout', { n: ['기합', 'Battle Cry'], cost: 1, type: 'power', art: 'c_bolt', d: ['힘 2\n(공격 피해 +2)', 'Strength 2\n(+2 attack damage)'], run: (G) => G.status(G.p, 'str', 2) });
  card('stance', { n: ['방어 태세', 'Fortify'], cost: 1, type: 'power', art: 'c_shield', d: ['턴마다 방어 4', 'Each turn: Block 4'], run: (G) => { G.p.pw.stance = (G.p.pw.stance || 0) + 4; } });
  card('find', { n: ['네잎 찾기', 'Find Clover'], cost: 1, type: 'luck', art: 'c_clover', d: ['잎 2', '2 leaves'], run: (G) => G.leaf(2) });
  card('thorns', { n: ['가시 갑옷', 'Thorn Mail'], cost: 1, type: 'power', art: 'c_shield', d: ['맞을 때마다 반격 3', 'When hit: deal 3 back'], run: (G) => { G.p.pw.thorns = (G.p.pw.thorns || 0) + 3; } });
  card('quick', { n: ['빠른 손', 'Quick Hands'], cost: 1, type: 'luck', art: 'c_wind', d: ['카드 2장', 'Draw 2'], run: (G) => G.draw(2) });
  card('fire', { n: ['불화살', 'Fire Arrow'], cost: 1, type: 'atk', art: 'c_fire', tgt: 1, dice: 1, d: ['피해 4+주사위', 'Deal 4+DIE'], run: (G, v, m, t) => G.hit(t, (4 + v) * m) });
  card('safe', { n: ['안전빵', 'Safe Bet'], cost: 1, type: 'def', art: 'c_shield', d: ['방어 7\n(주사위 없음)', 'Block 7\n(no DIE)'], run: (G) => G.block(7) });
  card('poke', { n: ['찌르기', 'Poke'], cost: 0, type: 'atk', art: 'c_sword', tgt: 1, d: ['피해 4\n(주사위 없음)', 'Deal 4\n(no DIE)'], run: (G, v, m, t) => G.hit(t, 4) });
  card('grit', { n: ['오뚝이', 'Bounce Back'], cost: 1, type: 'power', art: 'u_str', d: ['꽝 날 때마다 힘 1', 'On MISS: +1 Strength'], run: (G) => { G.p.pw.grit = (G.p.pw.grit || 0) + 1; } });
  card('omen', { n: ['액땜', 'Silver Lining'], cost: 1, type: 'power', art: 'c_shield', d: ['꽝 날 때마다 방어 6', 'On MISS: Block 6'], run: (G) => { G.p.pw.omen = (G.p.pw.omen || 0) + 6; } });
  card('toxic', { n: ['맹독', 'Toxin'], cost: 1, type: 'atk', art: 'c_poison', tgt: 1, d: ['적의 독 두 배', 'Double enemy Poison'], run: (G, v, m, t) => { if (G.alive(t) && t.st.poi) G.status(t, 'poi', t.st.poi); } });
  card('gamble', { n: ['몰빵', 'Go Big'], cost: 1, type: 'atk', art: 'c_dice', tgt: 1, dice: 1, d: ['피해 주사위x3\n꽝이면 잎 하나 더', 'Deal DIEx3\nMiss: +1 more leaf'], miss: (G) => G.leaf(1), run: (G, v, m, t) => G.hit(t, v * 3 * m) });
  card('clover', { n: ['네잎 검', 'Clover Blade'], cost: 1, type: 'atk', art: 'c_sword', tgt: 1, d: ['피해 4\n잎 하나에 +3', 'Deal 4\n+3 per leaf'], run: (G, v, m, t) => G.hit(t, 4 + 3 * G.p.leaves) });
  // 금테
  card('godie', { n: ['신의 주사위', "God's Die"], cost: 1, type: 'luck', rare: 1, art: 'c_dice', ex: 1, d: ['다음 주사위 세 번 대박\n소멸', 'Next 3 DICE are 6\nExhaust'], run: (G) => { G.p.six += 3; } });
  card('windfall', { n: ['일확천금', 'Windfall'], cost: 2, type: 'atk', rare: 1, art: 'c_coin', tgt: 1, dice: 1, d: ['피해 주사위x7\n꽝이면 내 체력 -8', 'Deal DIEx7\nMiss: lose 8 HP'], miss: (G) => G.selfHurt(8), run: (G, v, m, t) => G.hit(t, v * 7 * m) });
  card('storm', { n: ['네잎 폭풍', 'Clover Storm'], cost: 1, type: 'atk', rare: 1, art: 'c_clover', all: 1, d: ['잎 하나에 모든 적 피해 8\n잎을 다 씀', 'Deal 8 to ALL per leaf\nUses all leaves'], run: (G) => G.storm() });
  card('goddess', { n: ['행운의 여신', 'Lady Luck'], cost: 2, type: 'power', rare: 1, art: 'c_star', d: ['꽝이 나오면 한 번 다시 굴림', 'Reroll a Miss once'], run: (G) => { G.p.pw.goddess = 1; } });
  card('phoenix', { n: ['불사조 깃털', 'Phoenix Feather'], cost: 1, type: 'power', rare: 1, art: 'c_feather', d: ['이번 전투에 쓰러지면\n체력 절반으로 일어남', 'If you fall this fight,\nrevive at half HP'], run: (G) => { G.p.pw.phoenix = 1; } });
  card('double', { n: ['쌍주사위', 'Twin Dice'], cost: 2, type: 'power', rare: 1, art: 'c_dice', d: ['주사위를 둘 굴려\n높은 쪽', 'Roll two DICE,\nkeep higher'], run: (G) => { G.p.pw.double = 1; } });
  card('deal', { n: ['악마의 거래', "Devil's Deal"], cost: 0, type: 'luck', rare: 1, art: 'c_devil', d: ['체력 -6, 에너지 2, 카드 1장', 'Lose 6 HP, +2 Energy, draw 1'], run: (G) => { G.selfHurt(6); G.p.en += 2; G.draw(1); } });
  card('heroic', { n: ['용사의 일격', "Hero's Strike"], cost: 3, type: 'atk', rare: 1, art: 'c_big', tgt: 1, dice: 1, d: ['피해 14+주사위x4', 'Deal 14+DIEx4'], run: (G, v, m, t) => G.hit(t, (14 + v * 4) * m) });
  card('seven', { n: ['럭키 세븐', 'Lucky Seven'], cost: 1, type: 'luck', rare: 1, art: 'c_crown', ex: 1, d: ['잎 4\n(곧장 잭팟)\n소멸', '4 leaves\n(JACKPOT ready)\nExhaust'], run: (G) => G.leaf(4) });
  card('fever', { n: ['대박 열기', 'Hot Streak'], cost: 2, type: 'power', rare: 1, art: 'c_fire', d: ['대박·잭팟 때 에너지 1', 'On CRIT: +1 Energy'], run: (G) => { G.p.pw.fever = (G.p.pw.fever || 0) + 1; } });
  card('barricade', { n: ['철갑', 'Iron Hide'], cost: 2, type: 'power', rare: 1, art: 'c_shield', d: ['방어가 턴이 지나도\n남는다', 'Block no longer\nexpires'], run: (G) => { G.p.pw.barricade = 1; } });
  // 저주
  card('jinx', { n: ['불운', 'Jinx'], cost: 1, type: 'curse', art: 'c_skull', ex: 1, d: ['소멸\n손에 남으면 턴 끝 체력 -2', 'Exhaust\nIn hand at turn end: lose 2 HP'], run: () => { } });

  D.STARTER = ['slash', 'slash', 'slash', 'slash', 'slash', 'guard', 'guard', 'guard', 'guard', 'coin'];
  D.COMMON = Object.keys(C).filter((k) => !C[k].rare && C[k].type !== 'curse' && !['slash', 'guard', 'coin'].includes(k));
  D.RARE = Object.keys(C).filter((k) => C[k].rare);
  D.DEXCARDS = Object.keys(C).filter((k) => C[k].type !== 'curse');

  // 부적
  D.RELICS = {
    rabbit: { n: ['토끼 발', "Rabbit's Foot"], art: 'i_rabbit', d: ['전투 시작 잎 2', 'Start fights with 2 leaves'] },
    horse: { n: ['말편자', 'Horseshoe'], art: 'i_horse', d: ['첫 턴 에너지 +1', '+1 Energy on turn 1'] },
    tooth: { n: ['금니', 'Gold Tooth'], art: 'i_tooth', d: ['코인 +50%', '+50% coins'] },
    tarot: { n: ['타로 카드', 'Tarot Card'], art: 'i_tarot', d: ['대박 때 방어 5', 'On CRIT: Block 5'] },
    cat: { n: ['복고양이', 'Lucky Cat'], art: 'i_cat', d: ['대박 때 코인 4', 'On CRIT: 4 coins'] },
    bug: { n: ['무당벌레', 'Ladybug'], art: 'i_bug', d: ['꽝 때 체력 2 회복', 'On MISS: heal 2'] },
    silver: { n: ['은화', 'Silver Coin'], art: 'i_silver', d: ['전투 첫 주사위 대박', 'First DIE each fight is 6'] },
    bag: { n: ['주사위 주머니', 'Dice Pouch'], art: 'i_bag', d: ['손 카드 +1', '+1 card each turn'] },
    ring: { n: ['해골 반지', 'Skull Ring'], art: 'i_ring', d: ['꽝 때 모든 적 피해 5', 'On MISS: 5 damage to ALL'] },
    star: { n: ['북두칠성', 'Big Dipper'], art: 'i_star', d: ['잭팟 때 체력 8, 에너지 1', 'On JACKPOT: heal 8, +1 Energy'] },
    pot: { n: ['네잎 화분', 'Clover Pot'], art: 'i_clover', d: ['잎 3개면 잭팟', 'JACKPOT at 3 leaves'] },
  };

  // 괴물: hp, spr, sc(그리는 배율), ai: 턴 번호 i 로 다음 행동
  // 행동 {k:'atk',v,x(횟수)} {k:'def',v} {k:'str',v} {k:'weak'|'vuln',v} {k:'poi',v} {k:'steal',v,atk} {k:'curse',v} {k:'dice',v(눈마다 피해)} {k:'heal',v}
  const MN = (D.MON = {});
  function mon(id, o) { o.id = id; MN[id] = o; }
  const cyc = (arr) => (i) => arr[i % arr.length];
  mon('slime', { n: ['슬라임', 'Slime'], hp: [13, 17], spr: 'slime', sc: 2.8, ai: cyc([{ k: 'atk', v: 6 }, { k: 'def', v: 5, atk: 3 }, { k: 'atk', v: 7 }]) });
  mon('bat', { n: ['박쥐', 'Bat'], hp: [9, 12], spr: 'bat', sc: 2.1, fly: 1, ai: cyc([{ k: 'atk', v: 3, x: 2 }, { k: 'atk', v: 5, heal: 3 }]) });
  mon('goblin', { n: ['고블린', 'Goblin'], hp: [16, 20], spr: 'goblin', sc: 2.6, ai: cyc([{ k: 'steal', v: 10, atk: 5 }, { k: 'atk', v: 8 }, { k: 'atk', v: 6 }]) });
  mon('mushroom', { n: ['독버섯', 'Toadstool'], hp: [18, 22], spr: 'mushroom', sc: 2.7, ai: cyc([{ k: 'weak', v: 2 }, { k: 'atk', v: 9 }, { k: 'poi', v: 3, atk: 4 }]) });
  mon('mimic', { n: ['미믹', 'Mimic'], hp: [44, 44], spr: 'mimic', sc: 2.9, elite: 1, ai: cyc([{ k: 'atk', v: 12 }, { k: 'steal', v: 15, atk: 7 }, { k: 'def', v: 10, atk: 6 }, { k: 'dice', v: 3 }]) });
  mon('goblinking', { n: ['고블린 왕', 'Goblin King'], hp: [96, 96], spr: 'goblinking', sc: 2.6, boss: 1, ai: cyc([{ k: 'dice', v: 4 }, { k: 'str', v: 2, def: 10 }, { k: 'atk', v: 7, x: 2 }, { k: 'steal', v: 20, atk: 10 }, { k: 'dice', v: 4 }]) });
  mon('skeleton', { n: ['해골 병사', 'Skeleton'], hp: [24, 28], spr: 'skeleton', sc: 2.6, ai: cyc([{ k: 'atk', v: 8 }, { k: 'def', v: 8, atk: 5 }, { k: 'atk', v: 10 }]) });
  mon('ghost', { n: ['유령', 'Ghost'], hp: [20, 23], spr: 'ghost', sc: 2.6, fly: 1, ai: cyc([{ k: 'weak', v: 2, atk: 4 }, { k: 'atk', v: 8 }, { k: 'curse', v: 1 }]) });
  mon('spider', { n: ['독거미', 'Spider'], hp: [21, 24], spr: 'spider', sc: 2.3, ai: cyc([{ k: 'poi', v: 3, atk: 3 }, { k: 'atk', v: 4, x: 2 }, { k: 'atk', v: 8 }]) });
  mon('darkknight', { n: ['흑기사', 'Dark Knight'], hp: [72, 72], spr: 'darkknight', sc: 2.6, elite: 1, ai: cyc([{ k: 'atk', v: 16 }, { k: 'str', v: 2, def: 12 }, { k: 'atk', v: 7, x: 2 }, { k: 'vuln', v: 2, atk: 8 }]) });
  mon('lich', { n: ['리치', 'Lich'], hp: [135, 135], spr: 'lich', sc: 2.5, boss: 1, fly: 1, ai: cyc([{ k: 'curse', v: 2 }, { k: 'dice', v: 4 }, { k: 'atk', v: 5, x: 3 }, { k: 'def', v: 15, heal: 8 }, { k: 'poi', v: 4, atk: 7 }, { k: 'dice', v: 5 }]) });
  mon('imp', { n: ['꼬마 악마', 'Imp'], hp: [30, 34], spr: 'imp', sc: 2.6, ai: cyc([{ k: 'atk', v: 7, x: 2 }, { k: 'vuln', v: 2, atk: 6 }, { k: 'dice', v: 3 }]) });
  mon('golem', { n: ['돌 골렘', 'Golem'], hp: [52, 58], spr: 'golem', sc: 2.4, ai: cyc([{ k: 'def', v: 14 }, { k: 'atk', v: 22 }, { k: 'def', v: 10, atk: 8 }]) });
  mon('gargoyle', { n: ['가고일', 'Gargoyle'], hp: [38, 42], spr: 'gargoyle', sc: 2.5, fly: 1, ai: cyc([{ k: 'atk', v: 13 }, { k: 'str', v: 2, atk: 6 }, { k: 'atk', v: 5, x: 3 }]) });
  mon('dragon', { n: ['붉은 용', 'Red Dragon'], hp: [118, 118], spr: 'dragon', sc: 2.8, elite: 1, ai: cyc([{ k: 'atk', v: 24 }, { k: 'str', v: 3, def: 15 }, { k: 'atk', v: 9, x: 2 }, { k: 'dice', v: 6 }]) });
  mon('demonlord', { n: ['마왕', 'Demon Lord'], hp: [230, 230], spr: 'demonlord', sc: 2.1, boss: 1, ai: cyc([{ k: 'dice', v: 5 }, { k: 'curse', v: 2, def: 18 }, { k: 'atk', v: 8, x: 3 }, { k: 'str', v: 2, def: 15 }, { k: 'vuln', v: 2, atk: 12 }, { k: 'dice', v: 6 }]) });
  D.DEXMON = Object.keys(MN);

  // 막: 일반 전투 묶음(앞쪽은 쉬움), 정예, 보스, 배경
  D.ACTS = [
    { n: ['초록 숲', 'Green Woods'], easy: [['slime'], ['bat', 'bat'], ['goblin']], hard: [['mushroom', 'slime'], ['goblin', 'bat'], ['slime', 'slime', 'bat'], ['mushroom', 'goblin']], elite: ['mimic'], boss: 'goblinking' },
    { n: ['달빛 묘지', 'Moonlit Graves'], easy: [['skeleton'], ['ghost', 'bat'], ['spider']], hard: [['skeleton', 'ghost'], ['spider', 'spider'], ['skeleton', 'spider'], ['ghost', 'ghost', 'bat']], elite: ['darkknight'], boss: 'lich' },
    { n: ['마왕성', "Demon's Castle"], easy: [['imp', 'imp'], ['golem'], ['gargoyle']], hard: [['golem', 'imp'], ['gargoyle', 'imp'], ['gargoyle', 'gargoyle'], ['imp', 'imp', 'imp']], elite: ['dragon'], boss: 'demonlord' },
  ];

  // 영구 상점(행운 상점)
  D.SHOP = [
    { id: 'hp', n: ['최대 체력 +6', 'Max HP +6'], cost: [50, 100, 170, 260, 380] },
    { id: 'blk', n: ['첫 턴 방어 +4', 'Turn 1 Block +4'], cost: [50, 100, 160, 240, 340] },
    { id: 'gold', n: ['시작 코인 +20', 'Start coins +20'], cost: [40, 80, 130, 200, 290] },
    { id: 'leaf', n: ['전투 시작 잎 +1', 'Start leaf +1'], cost: [90, 220, 420] },
    { id: 'rare', n: ['금테 확률 +5%', 'Gold card +5%'], cost: [70, 150, 260, 400] },
    { id: 'draw', n: ['첫 턴 카드 +1', 'Turn 1 draw +1'], cost: [180, 460] },
  ];
})();
