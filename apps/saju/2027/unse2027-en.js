/* =========================================================
   unse2027-en.js — 2027 운세 영문판 (2026-09-29, 사장님 "영문판도")
   unse2027.js 다음에 불러 문장 표와 화면 글자(U27_UI)를 영어로 바꿔 끼운다.
   계산은 그대로다. 십신은 영어권 BaZi 표준 용어, 간지는 앱 영문판처럼 한국식 로마자.
   ========================================================= */

var U27_EN_STEM = ['Gap', 'Eul', 'Byeong', 'Jeong', 'Mu', 'Gi', 'Gyeong', 'Sin', 'Im', 'Gye'];
var U27_EN_BRANCH = ['Ja', 'Chuk', 'In', 'Myo', 'Jin', 'Sa', 'O', 'Mi', 'Sin', 'Yu', 'Sul', 'Hae'];
var U27_EN_ANIMAL = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
var U27_EN_EL = { '목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water' };
var U27_EN_NICK = ['great tree', 'grass and vines', 'the sun', 'candlelight', 'great mountain', 'fertile field', 'iron and blade', 'gemstone', 'the open sea', 'dew and stream'];
var U27_EN_GOD = {
  '비견': 'Friend', '겁재': 'Rob Wealth', '식신': 'Eating God', '상관': 'Hurting Officer', '편재': 'Indirect Wealth',
  '정재': 'Direct Wealth', '편관': 'Seven Killings', '정관': 'Direct Officer', '편인': 'Indirect Resource', '인수': 'Direct Resource'
};
var U27_EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

U27_STEM = {
  '갑': {
    gods: 'Hurting Officer + Direct Wealth',
    title: 'a year when talent turns into money',
    total: [
      'For a Gap (Yang Wood) day master, 2027 brings Hurting Officer and Direct Wealth together. The Ding Fire of the year is the fire a great tree lights from itself, so ideas and skills you kept inside come out. You talk more, you question the usual way of doing things, and you want to redo them your own way.',
      'The Wei Earth below is dry summer soil where the tree puts down roots, and for Gap it is Direct Wealth: money and results you can hold. What you show turns into real income, so in 2027 showing your work is the same as earning.',
      'Hurting Officer also pushes against bosses and rules. Inside a company or team, choose your words once more before you speak. Summer soil is a little dry for a tree, so set aside time to learn and refill, and the year will not burn you out.'
    ],
    money: 'Direct Wealth sits in the branch, so steady income is favored. Rather than one big win, expect more regular channels: salary, repeat clients, recurring sales. Talent becomes money this year, which makes it a good time to start a side project or a small shop.',
    work: 'Planning, presenting, writing and design, anything that brings your thinking out, earns you credit. Roles where you only follow orders will feel tighter than usual. If you are thinking of changing jobs, write the conditions side by side and decide on paper, not on mood.',
    love: 'You express yourself more, so romance gets livelier. For men, Direct Wealth is the spouse star, which favors a serious connection. Hurting Officer can sharpen your words, though, and something said to a partner may linger.',
    loveM: 'Direct Wealth in the branch means the spouse star arrives for men. It favors meeting someone to stay with rather than something casual, and couples start talking concretely about living together and the future. Hurting Officer can sharpen your words, so a careless remark to a partner may linger.',
    loveF: 'Your wit and expressiveness stand out this year. Hurting Officer, however, clashes with the Officer star that stands for a husband or boyfriend, so a partner’s flaws look bigger and nagging comes easily. Saying thanks before pointing out faults is what protects the relationship this year.',
    health: 'The tree spends itself lighting a fire. Talking a lot and working late wear out your throat and eyes first. Watch the habit of cutting sleep to make the schedule fit.'
  },
  '을': {
    gods: 'Eating God + Indirect Wealth',
    title: 'a year when what you enjoy grows the stage',
    total: [
      'For an Eul (Yin Wood) day master, 2027 brings Eating God and Indirect Wealth. Ding Fire is like the flower a vine puts out, so the power to create while enjoying yourself comes alive. Work you love pays off better than work you force, and good food and ease follow.',
      'The Wei Earth below is Indirect Wealth for Eul: moving money and a wider stage. What you make spreads to more people and money flows around it, so your range grows. Wei is also the storehouse where Eul keeps its roots, so you widen from your own base rather than scattering.',
      'A light mood makes spending easy, so track how fast you earn and how fast you spend separately. Keep that one rule and 2027 is one of the most comfortable years an Eul day master gets.'
    ],
    money: 'Indirect Wealth is money that comes in big and goes out big. Sales, trading, distribution and investing, money that rides a flow, hold the chances. Sleep on any decision that puts everything on one bet.',
    work: 'Food, drink, beauty, teaching, anything that makes people happy, pays off well. Work becomes fun this year, so busy days feel lighter.',
    love: 'More ease and laughter make meeting people natural. For men Indirect Wealth is also a romance star, so new encounters may come often. If you already have a partner, add things to enjoy together.',
    loveM: 'Indirect Wealth is the romance star for men, so new encounters come often this year. Ease and humor draw people to you, and introductions or gatherings easily lead somewhere. If you are already in a relationship, wandering eyes are the risk, so add more things you enjoy together.',
    loveF: 'Eating God brings ease and a soft charm. People you do not have to chase come toward you, and dates lean toward fun. Eating God is also the star of children, so couples may find talk of a baby coming up.',
    health: 'You eat well this year, so watch weight and digestion. Summer earth makes the body feel heavy. One habit of easy walking keeps the whole year light.'
  },
  '병': {
    gods: 'Rob Wealth + Hurting Officer',
    title: 'a year of growing through competition',
    total: [
      'For a Byeong (Yang Fire) day master, 2027 brings Rob Wealth and Hurting Officer. A candle lights up next to the sun, so more people like you, people after the same thing, gather around. They become colleagues or rivals.',
      'The Wei Earth below is where Byeong warms the soil into results, and for Byeong it is Hurting Officer: the power to shake the table with words and skill. Competition lights your fire and you act bolder than usual.',
      'The will to win is good, but promises involving money, joint ownership and guarantees are the first things Rob Wealth touches. Draw the lines in writing and you close the biggest hole of the year.'
    ],
    money: 'Money goes out as fast as it comes in. Spending on gathering and treating people grows, and money you lend tends to come back slowly. This year managing expenses is your best investment.',
    work: 'You are strong wherever there is a contest: bids, sales, pitches, the stage. Openly contradicting a boss in front of others tends to leave a mark, so deliver disagreements in private.',
    love: 'You become hot and honest. A rival may appear, so if you are sure, it pays to make it clear first. With a partner, avoid pride fights and all is well.',
    loveM: 'Rob Wealth is the force that takes away the Wealth star, which for men is the spouse star, so a rival may appear around the person you like. If you are sure, say so first. Mixing money with a partner raises the stakes of every argument, so split costs cleanly.',
    loveF: 'You become hot and honest. Hurting Officer strikes the Officer star that stands for a partner, so he may look slow and your words may get sharp. Skip the pride fights and the relationship actually becomes more honest this year.',
    health: 'Fire on fire raises the heat. Overwork, drinking and late nights stacked together will drain you all at once. Be especially careful in the peak of summer.'
  },
  '정': {
    gods: 'Friend + Eating God',
    title: 'a year to start something in your own name',
    total: [
      'For a Jeong (Yin Fire) day master, 2027 is the year your own character, Ding Fire, comes back: a Friend year. Wei Earth below becomes Eating God, so your strength grows and you use it to make things.',
      'Wei is late-summer soil where Jeong Fire has its roots, so your energy is solid. It is a good year to start what you have wanted to try on your own.',
      'Friend is the star of independence and self-assertion, so taking orders may feel unusually stifling. With Eating God behind you, let the work speak instead of arguing, and the year goes smoothly.'
    ],
    money: 'Income under your own name is favored. Rather than a big score, expect what you make to sell steadily. Start at a scale you can carry alone rather than with a partner.',
    work: 'Independence, a startup or going freelance comes to mind. Cooking, teaching, content and handmade work, anything that leaves a result, goes well.',
    love: 'A relaxed mind softens how you express yourself. Connections grow easily out of friendly, comfortable relationships. Friend also sets your own standards, so you may bend less for a partner.',
    loveM: 'In a Friend year men share the spouse star with others, so love tends to grow from friendship. Your own work may come first and leave a partner feeling left out. Send the one extra message.',
    loveF: 'A relaxed mind softens how you express yourself, and love grows out of comfortable friendships. With Eating God behind you, couples find talk of a baby or moving in together comes naturally. Your standards rise, though, so you may compromise less.',
    health: 'Your energy is solid. You eat and rest well, which can make weight creep up. Keep regular meal times.'
  },
  '무': {
    gods: 'Direct Resource + Rob Wealth',
    title: 'a year of receiving and sharing',
    total: [
      'For a Mu (Yang Earth) day master, 2027 brings Direct Resource and Rob Wealth. Ding Fire is like sunlight warming a great mountain: helpers, learning and good luck with documents arrive. Certificates, contracts and housing matters, anything that ends in paperwork, tend to go well.',
      'Wei Earth is the same element, so for Mu it is Rob Wealth. A hill joins the mountain: your base thickens, but people who want a share of it arrive too. Receiving and sharing come in the same year.',
      'Added weight can slow you down. Do not drag out preparation; start what you have decided on time.'
    ],
    money: 'Money protected by paper is favored: property contracts, deposits, pensions. Mixing money with friends or siblings, on the other hand, tends to end in arguments over shares.',
    work: 'A good current for study, certification and promotion exams. Help from above comes easily, so ask early instead of struggling alone.',
    love: 'Feelings deepen and get comfortable. Introductions through elders or family tend to work. Rob Wealth means competition, so if you like someone, hesitating may let the chance pass to someone else.',
    loveM: 'Feelings deepen and get comfortable, and introductions through elders or family tend to work. Rob Wealth is the force that competes for the spouse star, so if you like someone, hesitating may let the chance go to someone else.',
    loveF: 'Direct Resource brings a partner who looks after you. Introductions from elders or family fit well, and someone you can lean on comes close. Rob Wealth sits beside it, so watch out for falling for the same person as a friend.',
    health: 'Stacked earth makes the body heavy and digestion slow. When you overthink, appetite goes first. Keep energy moving with light exercise.'
  },
  '기': {
    gods: 'Indirect Resource + Friend',
    title: 'a year of digging deep and getting solid',
    total: [
      'For a Gi (Yin Earth) day master, 2027 is an Indirect Resource and Friend year. Ding Fire warms the field, so your thinking deepens and you see what others miss. It suits digging into one field or learning a new skill.',
      'Wei Earth is the same yin earth as Gi, so it becomes Friend and your position firms up. You gain the strength to go your own way without wobbling.',
      'Strong Indirect Resource makes you think alone too much and doubt good chances before you try them. Do not stop at the idea; try it small, and the luck gets used.'
    ],
    money: 'Skills and credentials pile up more than money flows. What you learn now becomes next year’s income. Keep investments inside fields you know well.',
    work: 'Research, planning, analysis, counseling and technical work, anything that needs depth, earns recognition. Deep solo focus goes better than dealing with people.',
    love: 'Opening up takes time this year. Your eye for a good match sharpens, but the push to approach first weakens. Reach out first to the person you really talk well with.',
    loveM: 'Opening up takes time this year. Your eye for a good match sharpens, but the push to approach first weakens. Reach out first to the person you really talk well with.',
    loveF: 'Deeper thinking makes you pickier about people, and time alone feels comfortable enough that dating slips down the list. Hobby groups or classes, places with shared interests, are where connections form.',
    health: 'A busy mind makes sleep shallow. Digestion gets sensitive, so cut down on late-night eating.'
  },
  '경': {
    gods: 'Direct Officer + Direct Resource',
    title: 'a year of being forged and rising in name',
    total: [
      'For a Gyeong (Yang Metal) day master, 2027 brings Direct Officer and Direct Resource. Ding Fire is the furnace fire that forges raw iron, the most welcome fire a Gyeong can meet. It is a good year to gain a position in an organization, take on responsibility and see your name rise.',
      'Wei Earth is soil that gives birth to metal, so it becomes Direct Resource, and superiors, documents and credentials back you up. Officer flowing into Resource is called Officer and Seal generating each other, the pattern BaZi first names when it talks about promotions and passing exams.',
      'Being forged is also hot. Learn to say no when work piles up, and you will make it to the end.'
    ],
    money: 'Income from salary and title stabilizes. More comes from your position than from a big win. Handle contracts and paperwork carefully and you will keep more.',
    work: 'Promotions, exams, public service tests and hiring rounds, set paths, tend to go well. Doing things by the book earns you good reviews.',
    love: 'For women Direct Officer is the husband star, so a serious connection and marriage talk come easily. For men, responsibility grows and relationships stabilize. Watch that busy work does not make you slow to reply.',
    loveM: 'For men Direct Officer is the star of responsibility and children, so a relationship gains weight and settles. If you are dating, things lean toward promises about the future. Watch that busy work does not make you slow to reply.',
    loveF: 'For women Direct Officer is the husband star, so a serious connection arrives and marriage talk comes up easily. Direct Resource behind it brings family support too. It is a good year to meet someone whose conditions fit, so do not turn down introductions.',
    health: 'Fire presses on metal, so tension and pressure show up in the body. Lungs and skin tend to signal first. Mark rest days on the calendar before anything else.'
  },
  '신': {
    gods: 'Seven Killings + Indirect Resource',
    title: 'a year when what you endure becomes authority',
    total: [
      'For a Sin (Yin Metal) day master, 2027 brings Seven Killings and Indirect Resource. Ding Fire heats the gemstone, a burdensome fire for Sin. Sudden assignments, unexpected pressure and difficult people are likely.',
      'Seven Killings, though, is the star that turns into authority once you endure and overcome it. The experience of solving something hard becomes the biggest asset of the year.',
      'Wei Earth below is Indirect Resource, giving you the power to research alone and find a way. The soil absorbs the pressing fire and gives birth to metal again, so even under pressure a base supports you.'
    ],
    money: 'Sudden expenses are likely. Keep an emergency fund for repairs, medical bills and other surprises. Income that uses your expertise may actually grow.',
    work: 'Hard projects, crisis response, audits and inspections, jobs nobody wants, tend to come to you. Solve them rather than dodge them and your standing jumps.',
    love: 'For women Seven Killings is a connection of strong attraction. The stronger the pull, the more time you should take. With a partner, the key is not poking each other’s sensitive spots.',
    loveM: 'Seven Killings brings heavy pressure, so there is less room in your heart for romance. Stress can make you sharp with the people closest to you. This is also a year when feelings deepen for whoever helps you through the hard part.',
    loveF: 'For women Seven Killings is the star of strong attraction. Someone who shakes your heart may appear suddenly. The stronger the pull, the less you should rush; give it time. With a partner, avoid poking each other’s sensitive spots.',
    health: 'Tension builds up. Skin, lungs and gut get sensitive. When the body signals, cut the schedule first.'
  },
  '임': {
    gods: 'Direct Wealth + Direct Officer',
    title: 'a year when flowing water gathers and builds',
    total: [
      'For an Im (Yang Water) day master, 2027 brings Direct Wealth and Direct Officer. Ding Fire and Im Water form the Ding-Im combination, so the year’s energy sticks to you as if pulled in. Money and practical matters come within reach.',
      'Wei Earth below is Direct Officer, bringing position, responsibility and reputation. Wealth feeding Officer means what you earn becomes credit, and credit becomes position again.',
      'The open sea meets a dam and gathers in one place. Freedom shrinks a little, but what accumulates is real. A combination also binds, so check now and then that good terms are not tying your feet.'
    ],
    money: 'A good year for steady income and saving. Direct Wealth is money gathered by plan: savings, paying down loans, building a lump sum.',
    work: 'Chances to take a responsible role, move to a permanent position or join a stable employer tend to come. Even if the rules feel tight, staying put pays off this year.',
    love: 'For men Direct Wealth is the wife star, and for women Direct Officer is the husband star, so a serious connection comes for everyone. Marriage talk comes up easily.',
    loveM: 'For men Direct Wealth is the wife star, and the Ding-Im combination makes the connection stick as if pulled in. Marriage talk comes up easily, and the person you meet looks like someone to share a life with.',
    loveF: 'For women Direct Officer is the husband star, so a serious connection comes this year. The Ding-Im combination makes it stick, and talk of marriage or moving in together comes up easily. Your eye for a dependable person sharpens.',
    health: 'Water blocked by earth tends to make the body puffy and heavy. Cutting salty food and late drinking makes a real difference.'
  },
  '계': {
    gods: 'Indirect Wealth + Seven Killings',
    title: 'a year when chances and shake-ups come together',
    total: [
      'For a Gye (Yin Water) day master, 2027 brings Indirect Wealth and Seven Killings. Ding Fire and Gye Water clash, the Ding-Gye clash, like sparks flying off water. Chances come suddenly, money moves suddenly and plans change often.',
      'Wei Earth below is Seven Killings, bringing pressure and responsibility. Wealth feeding Officer is there, but it runs fast and rough. The chance to earn big and the risk of being shaken hard arrive in the same year.',
      'Small water facing big fire and earth: the key is less greed and moving within your stamina.'
    ],
    money: 'Money comes in big and goes out big. Start any investment or expansion at half the size you planned. Deals decided in a hurry are the most dangerous.',
    work: 'Sudden transfers, job offers and changes in duties are likely. Those who jump on change fast win this year. Overpromise, though, and your body pays first.',
    love: 'A strong attraction may appear suddenly. The bigger the spark, the more you should pace it so it does not fade fast. With a partner, set clear lines on money.',
    loveM: 'Indirect Wealth is the romance star for men, so someone you are strongly drawn to may appear out of nowhere. The bigger the spark, the more you should pace it. With a partner, set clear lines on money before it becomes a fight.',
    loveF: 'For women Seven Killings is the star of intense connection, so someone who shakes your heart may appear. With the Ding-Gye clash on top, meeting and parting can move fast; wait a season before making big promises.',
    health: 'Water pressed by fire and earth tires easily. Put sleep and drinking water first, and watch out for heat and overwork more than cold.'
  }
};

U27_DAYBRANCH = {
  0:  'The branch of your birth day, Ja (Rat), forms a wonjin, a grudge pairing, with the year’s Wei (Goat). The day branch is the seat of your daily life and closest partner, so this year a vague hurt can creep in with a spouse, family or close coworker. The problem is tone and expression more than big fights; say the hurt out loud, even briefly.',
  1:  'The branch of your birth day, Chuk (Ox), clashes with the year’s Wei (Goat). The day branch is the ground you live on, so moving house, changing workplace or changing routines is likely. With close people, distance opens and closes. Rather than blocking change, pick what to change yourself and the shaking eases.',
  2:  'The branch of your birth day, In (Tiger), forms a gwimun, a ghost-gate pairing, with the year’s Wei (Goat). It sharpens intuition: you read people fast and get good hunches, but small words can shake you for a long time. Protecting your sleep and rest is the best care this year.',
  3:  'The branch of your birth day, Myo (Rabbit), completes part of the Hae-Myo-Mi triple harmony with the year’s Wei (Goat). Like-minded people gather around you and it is a good year to move toward one goal with those close to you. Shared work turns out better.',
  4:  'The branch of your birth day, Jin (Dragon), is the same earth as the year’s Wei (Goat). Neither clash nor pull is strong; life gains weight and settles. Change comes slowly, so pick one thing you want to change and set a date to begin.',
  5:  'The branch of your birth day, Sa (Snake), runs into the year’s Wei (Goat) along the summer line of Sa-O-Mi. You and those close to you look the same way, and daily life gains energy. The fire doubles, so cool the urge to rush just once.',
  6:  'The branch of your birth day, O (Horse), forms a six harmony with the year’s Wei (Goat). A combination on the day branch means you work well with those closest to you, so relationships with a partner improve and new connections form easily. Life gets more comfortable.',
  7:  'The branch of your birth day is Wei (Goat), the same as the year. The same character doubles its energy, so your own way and stubbornness grow stronger. Your hold on your place gets firmer, but you may give way less to people close to you. This year, whoever listens once more wins.',
  8:  'The branch of your birth day, Sin (Monkey), is fed by the year’s Wei (Goat) earth. Your base in life strengthens and housing or paperwork matters tend to go smoothly. It is a year you can lean on people close to you.',
  9:  'The branch of your birth day, Yu (Rooster), is fed by the year’s Wei (Goat) earth. Daily life gets orderly and you are appreciated by those close to you. The year’s fire also heats metal, so do not insist on perfection.',
  10: 'The branch of your birth day, Sul (Dog), forms a punishment with the year’s Wei (Goat). Punishment brings friction over rules, paperwork and promises. Double-check anything that puts your name on the line: contracts, titles, guarantees. With close people, look at feelings before right and wrong.',
  11: 'The branch of your birth day, Hae (Pig), completes part of the Hae-Myo-Mi triple harmony with the year’s Wei (Goat). People gather and helping hands appear. It is a good year to start something new together with those close to you.'
};

U27_MONTH_GOD = {
  '비견': ['A month to push forward on your own strength. Things go better when you take care of them yourself instead of leaning on others.',
          'A month when more people like you appear around you. Joining forces is fast, but settle the shares in advance.'],
  '겁재': ['Competition heats up this month. Promises involving money are safer pushed to next month.',
          'Your competitive streak wakes up. Focus on not losing rather than winning.'],
  '식신': ['A month to create and enjoy. Something started small gets a response.',
          'Good food and ease come in. Write down the ideas that come while you rest.'],
  '상관': ['You talk more this month. The ideas are good, but filter them once in front of superiors.',
          'You want to change the frame. Pick one thing to fix and fix it properly.'],
  '편재': ['Money moves in big amounts this month. Take chances you see, but shrink the size.',
          'Outside activity increases. The people you meet become your chances.'],
  '정재': ['Steady income this month. Good for saving and sorting things out.',
          'The numbers add up. Finish the money cleanup you put off.'],
  '편관': ['Pressure piles up this month. Leave room in the schedule and look after your body first.',
          'Sudden assignments are likely. Hold on and your standing rises.'],
  '정관': ['Responsibility and recognition arrive together. Keep promises and rules and your reviews improve.',
          'Your position firms up. Good for official matters, applications and interviews.'],
  '편인': ['Thinking deepens this month. Good for study and research, but decisions tend to stall.',
          'You need time alone. Rest and reset your direction.'],
  '인수': ['Help and good luck with documents. Good for contracts, applications and exams.',
          'A good month to get help from superiors. Ask right away about what you do not know.']
};

U27_MONTH_REL = {
  '충': 'Your day branch clashes with this month, so daily life may shift. Move big decisions to the month before or after.',
  '형': 'Your day branch meets a punishment this month, so friction over paperwork and promises is likely.',
  '원진': 'A grudge pairing with your day branch this month, so misunderstandings with close people pile up easily.',
  '육합': 'Your day branch combines with this month, so you work well with people. A good month for connection and teamwork.',
  '삼합': 'Your day branch forms a triple harmony this month, so like-minded people gather.',
  '같은 글자': 'This month repeats your day branch, so your own energy runs strong.',
  '귀문': 'A ghost-gate pairing with your day branch this month, so intuition sharpens. Guard your sleep.'
};

U27_LUCK = {
  '목': { color: 'green, blue-green', dir: 'east', num: '3, 8', act: 'morning walks, growing plants, learning something new' },
  '화': { color: 'red, orange', dir: 'south', num: '2, 7', act: 'sunlight, speaking in front of people, warm food' },
  '토': { color: 'yellow, brown', dir: 'center', num: '5, 10', act: 'regular meals, tidying up, gardening' },
  '금': { color: 'white, silver', dir: 'west', num: '4, 9', act: 'breathing exercises, decluttering, setting deadlines' },
  '수': { color: 'black, navy', dir: 'north', num: '1, 6', act: 'drinking water often, deep sleep, quiet reading' }
};

function u27EnDate(p) { return U27_EN_MON[p.m - 1] + ' ' + p.d + (p.y !== 2027 ? ', ' + p.y : ''); }

U27_UI = {
  elNote: {
    fireMany: 'Your chart already has a lot of Fire, and 2027 adds more. Passion runs high, but so do haste and fatigue; slowing down one notch is the best preparation this year.',
    fireNone: 'Your chart has no Fire, and 2027 brings it in. Expressiveness and energy you rarely show come alive, and stepping in front of people gets easier.',
    earthMany: 'Your chart already has a lot of Earth, and more piles on. Stability grows, but body and decisions get heavy; build a habit of moving lightly.',
    earthNone: 'Your chart has no Earth, and 2027 brings it in. Drifting plans find a place to land, and you gain something to lean on.'
  },
  date: u27EnDate,
  gj: function (st, br) { return U27_EN_STEM[st] + '-' + U27_EN_BRANCH[br]; },
  animal: function (b) { return U27_EN_ANIMAL[b]; },
  god: function (g) { return U27_EN_GOD[g] || g; },
  el: function (k) { return U27_EN_EL[k] + ' (' + ELEMENTS[k].ko.slice(2, 3) + ')'; },
  pillarNames: { hour: 'Hour', day: 'Day', month: 'Month', year: 'Year' },
  mySaju: 'Your four pillars', noHour: 'hour unknown',
  dayLine: function (s, animal) {
    var i = STEMS.indexOf(s.dayStem);
    return 'Day master <b>' + u27Esc(U27_EN_STEM[i] + ' ' + s.dayStem.han) + '</b> ' + u27Esc((s.dayStem.yin ? 'Yin ' : 'Yang ') + U27_EN_EL[s.dayStem.el] + ', ' + U27_EN_NICK[i]) +
      '. Chinese zodiac: ' + u27Esc(animal) + ' (by Lichun, the start of spring)';
  },
  inputLine: function (input) {
    var l = input.lunar;
    return 'Solar ' + U27_EN_MON[input.month - 1] + ' ' + input.day + ', ' + input.year +
      (l ? ' (lunar ' + l.year + '-' + (l.leap ? 'leap ' : '') + l.month + '-' + l.day + ')' : '') +
      (input.gender === 'm' ? ', male' : input.gender === 'f' ? ', female' : '');
  },
  totalH: function (st) { return '2027 overview: ' + st.title; },
  totalTag: function (s, st) { return 'What the Fire Goat year gives a ' + U27_EN_STEM[STEMS.indexOf(s.dayStem)] + ' day master: ' + st.gods; },
  fieldsH: '2027 by area',
  fields: ['Money', 'Work and career', 'Love and relationships', 'Health'],
  placeH: 'Your day branch and the Goat year',
  zodiacH: function (animal) { return 'The ' + animal + ' in 2027'; },
  samjaeYes: function (animal) { return 'For the ' + animal + ', 2027 is the outgoing year of Samjae, the Korean three-year Three Calamities cycle. It is the last year of the cycle.'; },
  samjaeNo: function (animal) { return 'The ' + animal + ' is not in Samjae in 2027. The Samjae signs for 2027 are the Pig, Rabbit and Goat.'; },
  monthsH: '2027 month by month',
  monthsSub: 'Months follow the solar terms, not the lunar month or the 1st of the calendar month.',
  monthName: function (gj) { return gj + ' month'; },
  good: 'good month', care: 'take care',
  tojH: '2027 Tojeong Bigyeol',
  tojSub: function (t) { return U27_EN_STEM[(t.year - 4) % 10] + '-' + U27_EN_BRANCH[(t.year - 4) % 12] + ' year, Korean age ' + t.age; },
  tojRows: ['The flow of the year', 'People and relationships', 'Money and gains'],
  tojNote: 'Tojeong Bigyeol is a Korean New Year reading of 144 outcomes, counted from your lunar birthday and Korean age. The birth year turns at Lunar New Year.',
  tojLines: {
    up: ['', 'Spring seeping into frozen ground. Visible change comes late, but underneath things are already moving.',
         'A dry tree meeting water. You reach again for what you had put off.',
         'The road splitting in two. Neither way is bad, but only one can be taken.',
         'The sun at its height. The more you show yourself and move, the more you gain.',
         'The wind dying down. Holding what you have serves you better than forcing it forward.',
         'Scattered things gathering in one place. People and news come in.',
         'A guest standing at the door. An unexpected offer or connection arrives.',
         'Opening the storehouse. It is time to spend what you stored.'],
    mid: ['', 'Something to mind comes up with someone close. Speaking first unties it easily.',
          'Someone who helps appears. Do not try to carry it alone.',
          'Words go back and forth and are easily misread. A habit of checking prevents trouble.',
          'News arrives from someone you have not seen in a long time.',
          'The people already beside you help more than anyone newly met.',
          'What you gave comes back. There is no need to hurry it.'],
    low: ['', 'A stretch where more goes out than comes in. Measure any large spending twice.',
          'In and out are about even. A time to refine what you have rather than start something new.',
          'A steady inflow, small but regular. What you save now lasts a long time.']
  },
  luckH: 'What to add in 2027',
  luckP: function (elName) { return 'The weakest of the five elements in your chart is <b>' + u27Esc(elName) + '</b>. These are the traditional five-element matches that bring it in.'; },
  luckRows: ['Color', 'Direction', 'Numbers', 'Habits']
};
