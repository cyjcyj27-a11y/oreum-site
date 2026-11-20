/* 영문판: 주소에 ?lang=en 이 있을 때만 영어. data.js 다음, game.js 앞에 싣는다 */
(function(){
var EN = window.LD_EN = new URLSearchParams(location.search).get('lang') === 'en';
window.E = function(ko, en){ return EN ? en : ko; };
if (!EN) return;
var D = window.LD;
function put(list, key, arr){ if (list.length !== arr.length) console.warn('en.js 길이 다름', key, list.length, arr.length); list.forEach(function(o, i){ if (arr[i] != null) o[key] = arr[i]; }); }

D.NEED_NAME = ['Laughter', 'Anger', 'Sorrow'];
put(D.CARDS, 'n', [
 'Dad Jokes', 'Rice Wine Tales', 'Kiosk Rant', 'Robot Vacuum Rant', 'Pat on the Back', 'Free Noodles',
 'Machines Can\'t Drink', 'Reading an AI Poem', 'Self-Checkout Betrayal', 'Robo-Parking Tyranny', 'Hands Don\'t Lie', 'My Grandma\'s Story',
 'Hammer Show', 'Encore', 'Round Song', 'The Kiosk Made Grandma Cry', 'Machines Don\'t Smile', 'Soup for Everyone',
 'Hammer Smash', 'Big Bro\'s Tears', 'Dancing Carpenter', 'Miracle of the Hammer', 'Unanimous', 'Golden Hammer',
 'Job Site War Stories', 'Robot Impression', 'Phone Menu Rant', 'Automatic Door Rant', 'Pour a Shot of Soju', 'Show Off Calluses',
 'Hammer Juggling', 'A Line of Trot Song', 'Parcel Locker Rant', 'Forced App Install Rant', 'Mom\'s Home Cooking', 'Show Your Palms',
 'Robot Arm Fail Video', 'The Unmanned Store Robbery', 'The Hardware Store Closed', 'Sing-Along', 'Hype Squad', 'Luddite Manifesto',
 'AI Drew Seven Fingers', 'The Robot Fell Over', 'The Chatbot Talks Nonsense', 'The Robotaxi Got Lost',
 'AI Is Taking Every Job', 'AI Does the Interviews', 'Can\'t Reach a Human', 'Fired by Text Message',
 'The Day the Factory Closed', 'Dad\'s Work Clothes', 'This Round\'s on Me', 'My Son Only Talks to AI',
 'AI Writes Novels Too', 'AI Sings Too', 'All the Cashiers Are Gone', 'AI Won the Art Contest',
 'My Art Was Called AI', 'A Robot Took My Factory Job', 'Labor Song Choir', 'AI Music Copyright Suit',
 'Hollywood Actors Strike', 'No More Drivers', 'AI Plays Doctor Too', 'I Got an AI Boyfriend',
 'The Machine Knows My Face', 'Our Hammer-Wielding Ancestors', 'Made by Human Hands', 'NO AI SLOP', 'Global General Strike',
 'GPS Led Me Into a Rice Paddy', 'The AI Speaker Can\'t Hear Me', 'Machine Translation Disaster', 'The Bank Tellers Are Gone',
 'Hospital Check-In Is App-Only', 'The Parking Machine Ate My Card', 'Texting for My Dad', 'My Regular Spot Closed',
 'A Bus to Town for a Bankbook', 'Volunteer Photos', 'The Robot Waiter Spilled Soup', 'The Drone Delivered Next Door',
 'Part-Time Jobs Became Kiosks', 'Taxis Only by App', 'Half the Market Customers Gone', 'Robots Work on Holidays Too',
 'The Neighborhood Crew Arrives', 'National Laborers\' Union',
 'AI Ruined My Selfie', 'The Cat Beat the Robot Vacuum', 'The Translator Swore', 'Not One Cashier at the Market',
 'The Call Center Is All AI', 'AI Tossed My Resume', 'Grandma Can\'t Use Apps', 'The Local Bookstore Closed',
 'Told to Toss My Work Clothes', 'Charity Bazaar', 'An AI Singer Won First Place', 'The Robot Cop Fell Over',
 'AI Writes the News Too', 'Factories Run in the Dark', 'The Mining Town Is Empty', 'AI Teaches School Too',
 'The Union Crew Arrives', 'The Day the World Stopped'
]);
D.CARD_FX = {all:'Hits everyone', double:'Next card x2', redraw:'New hand', smash:'Smash robots', spread:'Spreads to neighbors', turns:'Turns +2', calm:'Heat -8', kick:'Kick out robots & reporters'};

put(D.FOLK, 'n', ['Ticket Booth Granny', 'Supermarket Cashier', 'Parking Attendant', 'Cleaning Lady', 'Translator', 'Taxi Driver', 'Barista', 'Car Wash Worker', 'Welder', 'Bank Teller',
 'Toll Booth Clerk', 'Call Center Agent', 'Webtoon Artist', 'Photo Studio Owner', 'Video Store Owner', 'Bookstore Granny', 'Mail Carrier', 'Print Shop Owner', 'Shoeshine Grandpa', 'Hardware Store Owner',
 'Blacksmith', 'Rice Cake Shop Owner', 'Mill Grandpa', 'Locksmith', 'Watch Repairman', 'Bus Conductor Granny', 'Switchboard Granny', 'Tailor', 'Bathhouse Scrubber', 'Barber',
 'Coal Briquette Deliveryman', 'Paperboy', 'Junkyard Grandpa', 'Corner Store Owner', 'Pharmacist', 'Cram School Teacher', 'Elevator Operator Granny', 'Sewing Machinist', 'Typist Granny', 'Arcade Owner']);
put(D.FOLK, 'l', [
 'A ticket should come from a person. A machine never says have a nice trip.',
 'Self-checkouts came in and my spot was gone. I stood there for 30 years.',
 'Lifting the gate was my job. Now it lifts itself.',
 'Robot vacuums don\'t know corners. Corners are the dirtiest part.',
 'Free translation apps do it all, so my work got cut in half.',
 'Self-driving cars know the roads, but not the passengers.',
 'The coffee robot never calls the regulars by name.',
 'My sponge scratches less than those spinning brushes.',
 'I made the sparks fly, but the robot arm got the award.',
 'They want an app instead of a number ticket. What about the grandpas?',
 'The automatic toll never says drive safe.',
 'AI agents never get angry. That makes everyone angrier.',
 'AI draws a hundred pages a day. Nobody buys my drawings now.',
 'With a selfie, nobody tells you to smile.',
 'I miss the days of "be kind, rewind."',
 'Screens don\'t smell like books.',
 'Drones toss the letters. I used to knock on doors.',
 'Everyone reads on screens now. Print orders dried up.',
 'Nobody shines shoes anymore. It\'s all sneakers.',
 'I miss customers who came for one nail and stayed to talk about the world.',
 'People who hold hammers understand each other.',
 'A machine can make rice cakes. It can\'t toss in an extra one.',
 'Sesame oil is pressed by smell. Factory oil has no taste.',
 'Every door lock is a passcode now. My keys are rusting.',
 'Everyone checks the time on their phone. Nobody brings me watches.',
 'All aboard, let\'s go! Nobody says that anymore.',
 '"What number may I connect you to?" I loved saying that.',
 'Ready-made suits don\'t know shoulders. Every shoulder is different.',
 'A scrubbing machine? Only hands make your back feel clean.',
 'Auto clippers never listen to your stories.',
 'Boilers turn on with a button, so my carrying rack sits idle.',
 'The papers I threw at dawn, everyone reads them on phones now.',
 'Broken robots end up with me in the end. Heh.',
 'Unmanned stores won\'t let you pay later.',
 'Pill vending machines never ask where it hurts.',
 'Online lectures don\'t wake you when you doze off.',
 '"Going up." The machine took those words.',
 'The factory machines sew by themselves. I just watch the threads.',
 'I was top of my typing school. Nobody needs a typist now.',
 'Kids don\'t know the feel of dropping in a coin.'
]);
put(D.GFOLK, 'n', ['Doris the Ticket Seller', 'Linda the Cashier', 'Frank the Parking Attendant', 'Rosa the Cleaner', 'Claire the Translator', 'Eddie the Taxi Driver', 'Zhang the Barista', 'Marcus the Car Washer', 'Graham the Welder', 'Hannah the Bank Clerk',
 'Clara the Toll Collector', 'Leonie the Call Center Agent', 'Antoine the Cartoonist', 'Pierre the Photographer', 'Ray the Video Store Owner', 'Mathilde the Bookseller', 'Ted the Mail Carrier', 'Arthur the Printer', 'Walt the Shoeshiner', 'Geoffrey the Hardware Man',
 'Derek the Blacksmith', 'Brigitte the Baker', 'Albert the Miller', 'Dieter the Locksmith', 'Henri the Watchmaker', 'Mabel the Bus Conductor', 'Greta the Operator', 'Percy the Tailor', 'Betty the Masseuse', 'Jean-Pierre the Barber',
 'Colin the Miner', 'Tommy the Paperboy', 'Bernie the Scrap Dealer', 'Gloria the Shopkeeper', 'Howard the Pharmacist', 'Lucas the Tutor', 'Helga the Elevator Operator', 'Maureen the Seamstress', 'Ingrid the Typist', 'Danny the Arcade Owner']);
put(D.GFOLK, 'l', [
 'They want me to sell movie tickets on an app. I liked selling them with popcorn in the air.',
 'Self-checkouts came in and every cashier got cut. Machines never ask how you\'re doing.',
 'The plate reader took my job. I can read plates too.',
 'I watched a robot vacuum tumble down the stairs. I laughed. Then I cried.',
 'Machine translation can\'t carry a joke. Least of all a French one.',
 'Taxis with no steering wheel drive by. Who tells passengers about the neighborhood now?',
 'Robots can draw a heart on a latte. But there\'s no heart in it.',
 'The automatic wash snapped off a side mirror. I\'d never do that.',
 'Manchester always fought machines. So did my granddad\'s granddad.',
 'They\'re closing the counter and pushing an app. Where will the grannies go?',
 'Unmanned gates don\'t know how to say have a nice day.',
 'Customers beg the AI for a real person. That person was me.',
 'AI comics have six fingers. They still sell.',
 'Film was about waiting. Nobody waits anymore.',
 'Every Friday night the store was packed. Now nobody gets off the couch.',
 'The algorithm doesn\'t know the books I\'d recommend.',
 'Drones toss the letters. I used to ask after every household.',
 'My day began with the smell of ink.',
 'Everyone wears sneakers. No shoes left to shine.',
 'The hardware store was the town\'s living room. Now everyone buys online.',
 'Folks who hold hammers share something. Good to meet you, brother.',
 'The bread factory bakes ten thousand loaves a day. Ours is the last bakery in town.',
 'The mill was our town\'s meeting place. Now all the flour comes from factories.',
 'When the smart lock dies, they still call me.',
 'Smartwatches get thrown out when they break. Watches get fixed.',
 '"Next stop." There was a time I said that in my own voice.',
 '"Number, please?" I miss saying that.',
 'A bespoke suit is measured by hand. App measurements lie.',
 'A massage chair never asks where you\'re knotted up.',
 'A barbershop is for chatting. Machines can\'t chat.',
 'The mine closed and only machines were left. Our village closed with it.',
 'I loved my dawn bike ride, but everyone reads the news on phones now.',
 'Mountains of robot scrap. People toss them fast.',
 'Chatting at the counter was my business. Now nobody talks.',
 'If a machine hands out pills, who says drink plenty of water?',
 'AI tutors don\'t wake you when you doze off.',
 '"Going up." The machine took those words.',
 'The factory machines sew by themselves. I just watch the threads.',
 'Every office used to clatter with typewriters. Now computers type it all.',
 'Games weren\'t meant to be played alone. You played with the person next to you.'
]);
put(D.TOWN, 'n', ['Traditional Market', 'College Town', 'Apartment Complex', 'Neighborhood Park', 'Office District', 'Industrial Park', 'Machine Cult Korea Branch', 'Manchester', 'Paris', 'Berlin', 'Detroit', 'Machine Cult HQ, Silicon Valley']);
put(D.BLDG, 'n', ['The Street', 'Basement Room', 'Big Tent', '2nd-Floor Unit', 'Retreat Center', 'Overseas Mission HQ', 'Grand Temple']);
put(D.DECO, 'n', ['Gold Offering Basket', 'Megaphone', 'Gold Hammer Emblem', 'White Robe', 'Cash Safe', 'Mission Van', 'Hammer Merch Stall', 'Livestream Gear', 'Church Newspaper Press', 'Luddite Scholarship Fund', 'Solid Gold Megaphone', 'Cult Private Jet', 'Satellite TV Station', 'US Congress Lobby Fund', 'Legal Team']);
put(D.DECO, 'd', ['Offerings +10%', 'Crowd starts warmer +15', 'Faith cools slowly', 'Offerings +20%', 'Raid losses halved', 'Speech followers +30%', 'Offerings +30%', 'Branch followers grow faster', 'Offerings +30%', 'Heat builds slower', 'Overseas speech power +25%', 'Heat builds slower', 'Branch income x2', 'Offerings +30%', 'No raid losses']);

function lines(list, arr){ if (list.length !== arr.length) console.warn('en.js 대사 수 다름', list.length, arr.length); list.forEach(function(q, i){ q[1] = arr[i][0]; q[2] = arr[i][1]; }); }
lines(D.POCHA, [
 ['What does a carpenter know, mouthing off?', 'Jesus was a carpenter too, pal!'],
 ['Change the world with a hammer? Pfft!', 'A house stands one nail at a time!'],
 ['Who works with their hands these days? So old-school.', 'Those old-school hands built your house!'],
 ['Is that headband a fashion statement?', 'It\'s a luxury sweat wiper!'],
 ['A robot works better than you.', 'A robot can\'t grab a drink after work!'],
 ['AI does everything. Why bother?', 'AI doesn\'t know how soju tastes!'],
 ['What, gonna be a cult leader?', 'First I\'ll take over this tent bar!'],
 ['Machines never get tired.', 'They never smile either!'],
 ['An app could replace you.', 'Can an app pour your drink, pal?'],
 ['With self-driving cars, who needs drivers?', 'Who\'ll curse the traffic with you?'],
 ['You can\'t even use a smartphone.', 'A hammer never runs out of battery!'],
 ['Luddites? They lost 200 years ago.', 'That\'s why we\'re back!'],
 ['I stood at the kiosk for ten minutes!', 'My hammer will smash that screen for you!'],
 ['My company brought in robots!', 'When robots come in, we stop them!'],
 ['I asked for a human and got a machine again!', 'Not buttons, give us people!'],
 ['The robo-parking lot won\'t let my car out!', 'One whack of a hammer opens any gate!'],
 ['The self-checkout called me a thief!', 'The real thief is the machine that stole our jobs!'],
 ['AI took my job!', 'What was taken can be taken back!'],
 ['I failed an AI interview!', 'The problem is a machine that can\'t read people!'],
 ['The plant manager only brags about robot arms!', 'A robot arm can\'t even shake hands!'],
 ['No app, no entry to the store!', 'Doors are meant to be opened by hand!'],
 ['Drones are replacing delivery guys!', 'Ever seen a drone climb stairs?'],
 ['Machines don\'t even take a paycheck!', 'So only the boss gets fat!'],
 ['An AI painting won a prize!', 'Never held a brush and gets a prize?'],
 ['Thirty years of work, gone overnight', 'No machine can match your thirty years, pal'],
 ['How do I pay for my daughter\'s tutoring?', 'Let\'s find a way together, pal'],
 ['I\'m useless now', 'Your hands are still this warm'],
 ['They say a machine is better than me', 'A machine can\'t even cry like you'],
 ['I can\'t face my wife', 'Tonight, drinks are on me'],
 ['Where do I go starting tomorrow?', 'Tomorrow, you come with me'],
 ['My son only talks to AI', 'Tonight I\'ll hear your whole story'],
 ['All my customers went to delivery apps', 'An app can\'t hold the taste of your cooking'],
 ['I drove my whole life, now there are driverless cars', 'No machine beats a veteran like you'],
 ['A closing notice went up on the factory door', 'Let\'s tear that notice down together'],
 ['All I have left are calluses', 'Those calluses are your medals'],
 ['Nobody listens to me', 'Take your time, I\'ll listen all night']
]);
lines(D.PUB, [
 ['What\'s a carpenter from the East doing here?', 'A hammer speaks every language!'],
 ['What ritual is that headband for?', 'It\'s our order\'s formal sweatwear!'],
 ['Our robot speaks better English than you', 'Robots can\'t taste beer!'],
 ['Here we even order beer by app', 'I raise my hand and shout: one more!'],
 ['Luddites? That was my grandpa\'s time', 'I came in your grandpa\'s place!'],
 ['Beat Silicon Valley with a hammer?', 'Ever hear of the giant dropped by one stone?'],
 ['They say AI never misses at darts', 'Then make it pay for the drinks!'],
 ['We don\'t even speak the same language', 'A megaphone needs no interpreter!'],
 ['A translation app could replace you', 'Will a translation app clink glasses with you?'],
 ['People here love machines', 'The ones who loved them are crying now!'],
 ['A cult leader? How many followers?', 'One more after tonight in this pub!'],
 ['Tried a robotaxi? Pretty comfy', 'No one to thank when you get out!'],
 ['The factory bought a robot arm to replace me!', 'I\'ll fold that arm up for you!'],
 ['Not a single cashier at the supermarket!', 'We don\'t shop where there are no people!'],
 ['Call the call center and you only get a machine!', 'Let\'s shout together: give us a human!'],
 ['An AI tossed my resume without reading it!', 'What kind of judge doesn\'t even read?'],
 ['A robotaxi took my job!', 'We won\'t lose to a tin can on wheels!'],
 ['The mine closed, only machines left!', 'Machines can\'t sing miners\' songs!'],
 ['An AI singer took first place!', 'Never strained its voice and calls itself a singer?'],
 ['The boss bought robots and went on vacation!', 'So only the boss gets fat!'],
 ['AI copied the actors\' faces!', 'Steal a face, but you can\'t steal the acting!'],
 ['Even the news is written by AI!', 'Never been to the scene and writes the news?'],
 ['The self-serve pump ate my card!', 'Machines don\'t know how to apologize!'],
 ['A drone dumped a package on my roof!', 'A human courier at least rings the bell!'],
 ['Every factory in town turned off its lights', 'The lights went out, but your hands still work'],
 ['Drove buses my whole life, now I\'m not needed', 'How could a machine know a veteran like you?'],
 ['My son only talks to his AI assistant', 'Tonight I\'ll hear your whole story'],
 ['The town bookstore closed', 'No machine can make the smell of paper'],
 ['Grandma can\'t use the app, so she can\'t see a doctor', 'I\'ll take her there myself'],
 ['They told me to throw out my work clothes', 'Those work clothes are your medal'],
 ['I\'m useless now', 'Your hands are still this warm'],
 ['How will I pay my daughter\'s tuition?', 'Let\'s find a way together'],
 ['I can\'t face my wife', 'Tonight, the beer\'s on me'],
 ['Where do I go starting tomorrow?', 'Tomorrow, you come with me'],
 ['Our village is empty', 'We\'ll build a place where people gather again'],
 ['Nobody listens to me', 'Take your time, I\'ll listen all night']
]);

var FM = 'Foreman', CA = 'Carpenter', HY = 'Big Bro', ML = 'Machine Cult Leader';
D.TALK = {
  intro: [
    ['s_boss', FM, 'Hey, carpenter! Today\'s your last day on this site.'],
    ['h_stand', CA, 'What? We haven\'t even put up the frame.'],
    ['s_boss', FM, 'Nobody builds houses anymore. Factories stamp them out.'],
    ['s_boss', FM, 'Building one costs 150 million won. A factory one arrives finished for 5 million.'],
    ['h_stand', CA, '...Houses come by delivery now?'],
    ['s_boss', FM, 'So drive all the nails you want today.']
  ],
  fired: [
    ['s_boss', FM, 'Here\'s your pay. From tomorrow I only call you when there\'s work.'],
    ['h_stand', CA, 'Because of the factory houses?'],
    ['s_boss', FM, 'Job sites are down by half. You\'re almost done too.'],
    ['h_stand', CA, '...I need a drink tonight.']
  ],
  lastday: [
    ['s_boss', FM, 'Today\'s the end. Nobody needs a carpenter anymore.'],
    ['h_stand', CA, 'I\'ve built so many houses with these hands.'],
    ['s_boss', FM, 'They say the factory turns out a hundred a day.'],
    ['h_stand', CA, 'AI has made everyone poor.'],
    ['h_stand', CA, 'AI stole the middle class\'s hope.'],
    ['h_stand', CA, 'Everyone will end up broke, living in cardboard boxes.'],
    ['h_stand', CA, 'We have to stop AI!!'],
    ['h_stand', CA, '...Guess I\'ll go fix up the box houses, at least.']
  ],
  hyung: [
    ['s_hyung', HY, 'You\'re right! From today, I\'m following you.'],
    ['h_stand', CA, 'Me? Why?'],
    ['s_hyung', HY, 'You told me my hands are still good for something.'],
    ['s_hyung', HY, 'Go sound off at the market tomorrow. People will gather.']
  ],
  twelve: [
    ['s_hyung', HY, 'Twelve people! They\'re all looking at you!'],
    ['h_stand', CA, 'I\'m just a carpenter.'],
    ['s_hyung', HY, 'The street is cold. We need a place to gather.'],
    ['s_hyung', HY, 'Let\'s collect some offerings. And a name... how about the Luddites?']
  ],
  room: [
    ['s_hyung', HY, 'It\'s a basement, but it\'s our home!'],
    ['h_up', CA, 'Hang a hammer on the wall first.'],
    ['s_hyung', HY, 'From tonight, we pass the offering basket every night!']
  ],
  rival: [
    ['s_mleader', ML, 'You think a hammer can stop the future?'],
    ['s_mleader', ML, 'Our Machine Cult signs up a thousand followers with one kiosk.'],
    ['h_point', CA, 'That kiosk? I\'ll smash it for you.'],
    ['s_mleader', ML, 'One button and your followers are ours.']
  ],
  branch: [
    ['s_hyung', HY, 'A second-floor unit! Time to open branches.'],
    ['s_hyung', HY, 'We need our people in every neighborhood.'],
    ['h_shout', CA, 'College town, apartments, park, offices, all the way to the industrial park!']
  ],
  final: [
    ['s_politician', 'Lawmaker', 'Leader, I could use some votes. Haha.'],
    ['s_reporter', 'Reporter', 'Luddites... something smells fishy here.'],
    ['s_hyung', HY, 'Only the Machine Cult\'s Korea branch is left. Win their followers and the country is ours.']
  ],
  steal: [
    ['s_mleader', ML, 'Sign up on the app and get a coffee coupon. I\'m taking your followers.']
  ],
  stealK: [
    'Sign up on the app and get a coffee coupon. I\'m taking your followers.',
    'At our church, offerings are one-tap payments. No lines.',
    'Dawn prayer? We just send a notification.',
    'First month is a free trial. We made cancelling very hard.',
    'Invite a friend for double points. Your followers keep bringing each other.',
    'AI sums up our sermons in 3 minutes. Who listens to hammer talk for an hour?',
    'We\'re raffling off robot vacuums. Everyone\'s lining up.',
    'Your meeting place has no Wi-Fi? All the young ones are with us.',
    'Register by face scan in one go. No stamps needed.',
    'One subscription and blessings auto-bill every month. So convenient.',
    'The grannies lost at the kiosks? We offered to help, and they followed.',
    'I slipped our ad into your followers\' group chat. Great response.'
  ],
  stealA: [
    'Free Wi-Fi, free chargers. That\'s enough for people here.',
    'Can\'t speak the language? Our translation app speaks them all.',
    'Sign up and your first robotaxi ride is free. Your followers already rode off.',
    'A megaphone? We push notifications to every phone.',
    'This city\'s factories run with the lights off. Not a single person inside.',
    'Our AI pastor counsels 24 hours a day. You still need sleep.',
    'First month costs zero. Nobody knows how to cancel, so they stay.',
    'Your followers posted one photo and AI made them pretty. That\'s all it took.'
  ],
  raid: [
    ['s_police', 'Police', 'This is a search and seizure.'],
    ['h_stand', CA, 'A hammer is a tool!']
  ],
  reporter: [
    ['s_reporter', 'Reporter', 'Where do the offerings go? I\'d like to do a story.']
  ],
  raidL: [
    ['This is a search and seizure.', 'A hammer is a tool!'],
    ['Suspected embezzlement of offerings. Let\'s see the ledger.', 'The ledger is handwritten. Not a cent off!'],
    ['You told followers to sell their homes and donate?', 'I\'m the one who builds them homes!'],
    ['We got a report you cut followers off from their families.', 'I said cut off phones, not families!'],
    ['They say you house followers together and make them work.', 'That\'s a job site. They get paid daily!'],
    ['They say the leader claims to be a god?', 'I\'m a carpenter. A god can\'t even lift a hammer!'],
    ['A tip says you scared people with the end of the world.', 'Not the end of the world. The kiosks are coming!'],
    ['A tax audit came along too. Suspected tax evasion.', 'I even put receipts in the offering basket!'],
    ['They say you expanded the building without a permit.', 'No building of mine has ever fallen down!'],
    ['You keep people praying all night without sleep?', 'We go to the tent bar when the sun sets!'],
    ['Recruiting undercover on college campuses?', 'I wear a headband. I can\'t hide!'],
    ['A report says you posed as a volunteer group.', 'We really cleaned the neighborhood. Go look!'],
    ['You told followers they\'d be punished for leaving?', 'Leaving? Just return the hammer!'],
    ['Allegations that offerings bought the leader a house.', 'I still sleep on the meeting place floor!'],
    ['Intel says you leaked the follower list for an election.', 'The list is one notebook. Written in pencil!'],
    ['You told people prayer heals instead of hospitals?', 'I said go to the hospital. The front desk, not the app!'],
    ['Is the person who smashed the kiosk here?', 'I didn\'t smash it, I fixed it!'],
    ['A robot company is suing you for obstruction of business.', 'Tell the robot to come in person!'],
    ['Complaints about banging noises every night.', 'That\'s nails going in. That\'s how we pray!'],
    ['Suspicious flyers are all over the neighborhood.', 'Read one. It protects your job too, officer!'],
    ['An AI surveillance camera caught this place.', 'Seize that camera first!'],
    ['Crackdown. Everyone, hands up.', 'See the calluses? Those are workers\' hands!'],
    ['A tip says you sold river water as holy water.', 'I never did such a thing, it was my followers.....', 'Cult Leader']
  ],
  reporterL: [
    'Where do the offerings go? I\'d like to do a story.',
    'A hammer-wielding cult leader? This is a scoop!',
    'Mind if I interview some of your followers?',
    'The Machine Cult calls you a fake religion. Any comment?',
    'We got a tip the streets are full of people in white.',
    'There\'s a video of someone smashing a kiosk. That\'s you, isn\'t it, Leader?',
    'Someone says they joined after getting hit by a flyer.',
    'What money did you buy the meeting place with?',
    'Robot company stocks dropped. Any connection?',
    'Are you okay with this airing on tonight\'s news?'
  ],
  politician: [
    ['s_politician', 'Lawmaker', 'Chip in a little offering and I\'ll keep things quiet. Haha.']
  ],
  machineWin: [
    ['s_mleader', ML, 'My followers... picked up hammers?'],
    ['h_up', CA, 'Machines can\'t beat people.'],
    ['s_mleader', ML, '...Truth is, I can\'t use a kiosk either.']
  ],
  abroad: [
    ['s_hyung', HY, 'Leader, a letter came from across the sea!'],
    ['h_stand', CA, 'It\'s in English. What does it say?'],
    ['s_hyung', HY, 'It\'s from Manchester. The original Luddite town that smashed machines with hammers 200 years ago!'],
    ['s_mleader', ML, 'You took Korea, but the real HQ is Silicon Valley. There are more AIs than people there.'],
    ['h_up', CA, 'Pack the hammer. We\'re flying.'],
    ['h_stand', CA, 'If they can\'t understand us, the megaphone will do the talking. Charge it up and let it all out at once.'],
    ['s_hyung', HY, 'And the Grand Temple! Let\'s put a golden hammer on top!']
  ],
  valleyOpen: [
    ['s_hyung', HY, 'Manchester, Paris, Berlin, Detroit! Only Silicon Valley is left.'],
    ['s_mleader', ML, 'Followers here can\'t even order food without AI. You think you stand a chance?']
  ],
  valleyWin: [
    ['s_mleader', ML, 'My HQ... they\'ve all picked up hammers...'],
    ['h_up', CA, 'Machines can\'t beat people. Anywhere.'],
    ['s_mleader', ML, '...Secret: I was scared of my AI assistant too.']
  ],
  ending: [
    ['s_hyung', HY, 'Leader!'],
    ['v3', 'Followers', 'Leader! Leader!'],
    ['h_lord', CA, 'I was... just a carpenter.'],
    ['s_hyung', HY, 'Our Leader has worked a miracle! All bow down!!!']
  ]
};

/* 화면(HTML) 고정 글 */
function page(){
  document.documentElement.lang = 'en';
  document.title = 'Luddite Church - From Carpenter to Cult Leader';
  var md = document.querySelector('meta[name=description]'); if (md) md.content = 'One drunken street debate gave a laid-off carpenter his first follower. Give speeches, collect offerings, grow your meeting place, and become a cult leader in this pixel growth sim.';
  var map = {'날 ':'Day ', '신도 ':'Followers ', '돈 ':'Money ', '믿음':'Faith', '의심':'Heat'};
  document.querySelectorAll('.stat').forEach(function(s){ var t = s.firstChild; if (t && t.nodeType === 3 && map[t.nodeValue] != null) t.nodeValue = map[t.nodeValue]; });
  var ids = {logo:'LUDDITE CHURCH', sub:'From Carpenter to Cult Leader', bStart:'START', bCont:'CONTINUE'};
  for (var k in ids) { var e = document.getElementById(k); if (e) e.textContent = ids[k]; }
  var al = {bHelp:'How to play', bBgm:'Music', bSfx:'Sound effects'};
  for (var a in al) { var b = document.getElementById(a); if (b) b.setAttribute('aria-label', al[a]); }
  var rt = document.querySelector('#rotate > div'); if (rt) rt.textContent = 'Please turn your phone sideways';
  var rb = document.querySelector('#rotate .btn'); if (rb) rb.textContent = 'Landscape';
  var st = document.createElement('style'); st.textContent = '.item.done .t::after{content:"Branch complete"} #how .hc{font-size:calc(var(--u)*5.6);line-height:1.3}'; document.head.appendChild(st);
  document.body.classList.add('en');
}
/* 영어가 길어 넘치면 글자만 줄인다(배치는 그대로) */
var hudK = 1;
function fit(){
  // 상단바 줄이기는 game.js fitTop 이 한·영 같이 맡음
  document.querySelectorAll('.btn, .ret, .card .t, .item .t').forEach(function(b){
    if (!b.offsetWidth) return;
    var k = +b.dataset.k || 1, base = b.dataset.fs ? +b.dataset.fs : parseFloat(getComputedStyle(b).fontSize);
    if (!b.dataset.fs) b.dataset.fs = base;
    while (b.scrollWidth > b.clientWidth + 1 && k > 0.5) { k -= 0.05; b.style.fontSize = (base * k) + 'px'; }
    b.dataset.k = k;
  });
}
setInterval(fit, 250);
addEventListener('resize', function(){ document.querySelectorAll('[data-fs]').forEach(function(b){ b.style.fontSize = ''; delete b.dataset.fs; delete b.dataset.k; }); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', page); else page();
})();
