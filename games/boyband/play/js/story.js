/* 제발 데뷔해줘 — 대사, 스토리(MBTI: 라이온 INTP, 카이렌 ESTP, 도윤 ENFP, 하루 INFJ). [한국어, 영어] 짝. 설명은 없다, 성격과 사연만.
   표정 e: std(전신), joy, sad, mad  →  img/b{n}_{e}.webp (없으면 전신으로 대신) */
(function () {
  'use strict';

  /* 상황별 한마디 */
  const LINES = {
    lion: { voice: 1.0,
      greet: ['90년대요? …그때 믹싱은 지금이랑 방식이 달랐을 텐데요', 'The \'90s? ...Mixing worked differently back then, didn\'t it.'],
      leader: ['리더요? 결정은 데이터로 하겠습니다  …농담이에요  반은', 'Leader? I\'ll decide by data. ...Joking. Half.'],
      great: ['아 이제 왜 되는지 알겠어요  원리가 보여요', 'Ah. Now I see why it works. The principle\'s visible.'],
      ok: ['가설 하나가 틀렸고 하나는 맞았어요', 'One hypothesis wrong, one right.'],
      tired: ['성대는 근육이라… 논리적으로 쉬어야 해요', 'Vocal cords are muscle... logically, I need rest.'],
      rest: ['쉬면서 코드 진행 스무 개를 정리했어요', 'Rested, and sorted twenty chord progressions.'],
      gig: ['관객을 관찰했어요  후렴 둘째 마디에서 다들 고개를 들어요', 'I observed the crowd. Everyone looks up on the second bar of the chorus.'],
      charm: ['예능은… 규칙을 모르겠어요  규칙을 알려주면 할게요', 'Variety... I can\'t find the rules. Tell me the rules and I\'ll do it.'],
      low: ['제가 여기 있는 게 최적해인지 계산이 안 서요', 'I can\'t compute whether me being here is the optimal solution.'],
      win: ['…통계적으로 이례적이네요  좋은 쪽으로', '...Statistically anomalous. In a good way.'],
      lose: ['변수를 하나 놓쳤어요  다음엔 넣을게요', 'We missed a variable. Next time it goes in.'],
      out: ['여긴 제 변수가 아닌 것 같아요  미안해요', 'I don\'t think I\'m a variable here. Sorry.'],
      tv: ['카메라 다섯 대 각도를 다 계산했더니 노래를 잊었어요', 'I calculated all five camera angles and forgot the song.'],
      yt: ['댓글 분석했어요  \'목소리\' 언급이 41%예요', 'Analyzed the comments. 41% mention the voice.'],
      refuse: ['방송에 나가야 하는 근거를 못 찾겠어요  아직은', 'I can\'t find a reason to go on TV. Not yet.'],
      trust: ['아저씨 옛날 안무 영상 프레임 단위로 봤어요  뒤에서 제일 정확했어요', 'I watched your old choreo frame by frame. You were the most precise one in the back.'],
      taste: ['…사람들이 제 이름을 알아요  이건 예측 못 했어요', '...People know my name. I didn\'t predict that.'] },
    kairen: { voice: 0.75,
      greet: ['말 길게 하지 마  돈 얼마 있어?', 'Don\'t make it long. How much money you got?'],
      leader: ['리더? 좋아  따라오기나 해', 'Leader? Fine. Just keep up.'],
      great: ['됐어  몸이 먼저 알아', 'There. The body knows first.'],
      ok: ['생각 그만하고 한 번 더', 'Stop thinking. Again.'],
      tired: ['…괜찮아  쓰러지면 그때 말해', '...I\'m fine. I\'ll tell you when I drop.'],
      rest: ['쉬는 건 지루해  오토바이 타고 왔어', 'Resting\'s boring. Took the bike out.'],
      gig: ['거리가 제일 정직해  못하면 그냥 가 버리거든', 'The street\'s honest. If you suck, they just leave.'],
      charm: ['웃으라고? 무대에서 웃어  거기서', 'Smile? I smile on stage. There.'],
      low: ['…혼자면 빠른데  넷이면 느려', '...Alone I\'m fast. Four of us, slow.'],
      win: ['말했잖아  이기는 건 몸으로 하는 거야', 'Told you. Winning\'s done with the body.'],
      lose: ['졌어  그래서? 내일 또 해', 'We lost. So? Again tomorrow.'],
      out: ['여긴 느려  나 간다', 'This place is slow. I\'m out.'],
      tv: ['방송? 한 곡 하고 나왔어  그게 다야', 'TV? One song, walked off. That\'s it.'],
      yt: ['조회수 같은 거 몰라  라이브나 잡아', 'Don\'t know about views. Book me a live show.'],
      refuse: ['안 나가  카메라 앞에서 립싱크 하라고? 됐어', 'Not going. Lip-sync for a camera? Pass.'],
      trust: ['…맨 뒤에서도 안 빼먹었더라  한 동작도  인정', '...You never skipped a move. Even in the back. Respect.'],
      taste: ['시끄럽네  …근데 이 소리 나쁘지 않아', 'Loud. ...But this noise, not bad.'] },
    doyun: { voice: 1.25,
      greet: ['우와 진짜 TV 나오셨어요?! 저 그거 알아요! …아니 몰라요! 근데 완전 좋아요!!', 'Whoa, you were really on TV?! I know it! ...No I don\'t! But I love it!!'],
      leader: ['제가요?! 아 이거 완전 운명이다! 다들 제가 챙길게요!!', 'Me?! This is fate! I\'ll take care of everyone!!'],
      great: ['봤어요?! 방금 뭔가 딱! 됐어요! 다시 해볼래요!', 'Did you see?! Something just clicked! Let me do it again!'],
      ok: ['오늘 아이디어 세 개 떠올랐어요! 하나는 좀 이상해요!', 'Three ideas today! One\'s kind of weird!'],
      tired: ['헥 헥… 근데 재밌어요… 5분만…', 'Huff... but it\'s fun... five minutes...'],
      rest: ['잘 자고 나니까 새 곡 컨셉이 생각났어요! 우주요!', 'Slept great and got a new song concept! Space!'],
      gig: ['앞줄 아주머니가 같이 뛰셨어요! 제가 손 흔들었어요!', 'The lady in front jumped with us! I waved!'],
      charm: ['PD님이 저더러 그냥 하래요! 그래서 그냥 했어요!', 'The PD said just be myself! So I was!'],
      low: ['…저 원래 밝은데요  오늘은 그냥 잘 안 돼요', '...I\'m usually bright. Today it just... isn\'t working.'],
      win: ['우리가!! 진짜!! 다들 울어요?! 저도 울어요!!', 'We did it!! For real!! Everyone crying?! Me too!!'],
      lose: ['괜찮아요! 내일은 다른 아이디어로! 제가 열 개 있어요!', 'It\'s okay! Tomorrow, new ideas! I have ten!'],
      out: ['…저 여기 진짜 좋아했는데  미안해요', '...I really loved it here. Sorry.'],
      tv: ['카메라 다섯 대 다 봤어요! 다 친구예요!', 'Looked at all five cameras! They\'re all my friends!'],
      yt: ['썸네일 제가 찍었어요! 댓글 다 읽었어요! 다 착해요!', 'I shot the thumbnail! Read every comment! They\'re all nice!'],
      refuse: ['…아니 저는 나가고 싶은데요? 왜 다들 안 가요?', '...Wait, I want to go? Why isn\'t anyone going?'],
      trust: ['형!! 아니 프로듀서님!! 그 춤 저 다 외웠어요! 보여드릴게요!', 'Hyung!! I mean Producer!! I memorized that dance! Watch!'],
      taste: ['저 사인해 줬어요!! 세 명한테!! 이름도 물어봤어요!!', 'I signed autographs!! Three people!! I asked their names!!'] },
    haru: { voice: 1.15,
      greet: ['…죄송한데 저희를 왜 고르셨어요? 이유가 궁금해요', '...Sorry, but why us? I want to know the reason.'],
      leader: ['저는… 앞에 서는 사람은 아니에요  그래도 필요하시면요', 'I\'m not... someone who stands in front. But if you need me.'],
      great: ['…됐어요  이게 제가 찾던 소리예요', '...There. That\'s the sound I was looking for.'],
      ok: ['조금 알 것 같아요  아직 말로는 못 하지만요', 'I think I get it. I can\'t put it in words yet.'],
      tired: ['괜찮아요  …아니 형들이 더 힘들어 보여서요', 'I\'m fine. ...No. The others look more tired.'],
      rest: ['오늘은 다들 어떤 표정인지 봤어요  카이렌 형이 웃었어요', 'Today I watched everyone\'s faces. Kairen smiled.'],
      gig: ['한 사람이 끝까지 안 갔어요  그 사람한테 불렀어요', 'One person stayed till the end. I sang to that one.'],
      charm: ['카메라 앞에선 제가 제가 아닌 것 같아요', 'In front of a camera I don\'t feel like me.'],
      low: ['제가 여기 있는 이유를 아직 못 찾았어요', 'I still haven\'t found my reason for being here.'],
      win: ['…형들 덕분이에요  저는 그냥 같이 있었어요', '...It\'s because of you guys. I was just here with you.'],
      lose: ['다음엔 제가 더 할게요  조용히 더요', 'Next time I\'ll do more. Quietly. More.'],
      out: ['…미안해요  여기가 제 자리인지 확신이 없어서요', '...Sorry. I wasn\'t sure this was my place.'],
      tv: ['카메라가 절 계속 봤어요  눈을 어디 둬야 할지…', 'The camera kept watching me. I didn\'t know where to look...'],
      yt: ['댓글은 안 볼게요  한 줄이 하루 종일 남아서요', 'I won\'t read comments. One line stays all day.'],
      refuse: ['…오늘은 못 나가겠어요  이유는… 나중에 말할게요', '...I can\'t go today. The reason... I\'ll tell you later.'],
      trust: ['아저씨는 저희를 이용하려는 게 아니었어요  그건 알겠어요', 'You weren\'t trying to use us. That much I know.'],
      taste: ['저더러 예쁘대요  얼굴 말고 노래가요', 'They said it\'s pretty. Not my face. The song.'] },
    jay: { voice: .85,
      tv: ['심의 때문에 가사 반이 삐— 됐어', 'Half my lyrics got bleeped.'],
      yt: ['조회수 10만  크루 애들 봤겠지', '100K views. The crew must\'ve seen it.'],
      refuse: ['TV 나가서 뭐 하라고  나 랩 하러 왔어', 'What am I gonna do on TV. I came to rap.'],
      trust: ['쉰내 난다고 한 거 취소', 'The \'90s smell thing. I take it back.'],
      taste: ['댓글에 내 가사 따라 적는 애들 있더라', 'Kids are typing my lyrics in the comments.'],
      greet: ['쉰내 나는데  근데 뭐 돈은 있으시죠?', 'Smells like the \'90s. But hey, you\'ve got money, right?'],
      leader: ['리더? 오케이 내 스타일로 간다', 'Leader? Okay. My way.'],
      great: ['이 라인 미쳤다  들었어?', 'That line was insane. You hear it?'],
      ok: ['플로우 조금 더 다듬고', 'Tighten the flow a bit more.'],
      tired: ['…오늘은 목이 안 나와', "...Voice isn't coming out today."],
      rest: ['비트 듣다 잠들었어', 'Fell asleep to beats.'],
      gig: ['사이퍼 뛰던 때 생각나네', 'Reminds me of cypher days.'],
      charm: ['카메라? 내가 제일 잘하는 거잖아', "Camera? That's my thing."],
      low: ['…솔직히 나 혼자가 낫지 않나', "...Honestly, maybe I'm better solo."],
      win: ['말했지  랩은 내가 다 한다고', 'Told you. I handle the rap.'],
      lose: ['차트가 뭘 알아  다음 트랙 가자', "Charts don't know. Next track."],
      out: ['여긴 내 무대가 아니었어', "This wasn't my stage."] },
    yuan: { voice: .95,
      tv: ['PD님이 밥 먹었냐고 물어보시더라고요', 'The PD asked if I\'d eaten.'],
      yt: ['댓글에 답글 다 달았어요', 'I replied to every comment.'],
      refuse: ['…저는 뒤에서 할게요  이번엔', '...I\'ll stay in the back. This time.'],
      trust: ['그때 엄마가 왜 좋아했는지 알겠어요', 'Now I get why my mom loved it.'],
      taste: ['할머니가 TV에서 봤다고 전화하셨어요', 'Grandma called. She saw us on TV.'],
      greet: ['아 저희 엄마가 그 노래 좋아하셨어요  …엄마가요', 'Oh, my mom loved that song. ...My mom.'],
      leader: ['제가 맡을게요  다들 챙길게요', "I'll take it. I'll look after everyone."],
      great: ['오늘 목이 열렸어요', 'My voice opened up today.'],
      ok: ['천천히 꾸준히', 'Slow and steady.'],
      tired: ['괜찮아요  저보다 애들이…', "I'm okay. The kids though..."],
      rest: ['새벽 라디오 틀어놓고 잤어요', 'Fell asleep to late-night radio.'],
      gig: ['할머니 한 분이 끝까지 계셨어요', 'An old lady stayed till the end.'],
      charm: ['저 원래 말 많아요  몰랐죠?', 'I talk a lot, actually. Surprised?'],
      low: ['…제가 여기서 뭘 하고 있는 거죠', '...What am I even doing here.'],
      win: ['다들 고생했어요  진짜로', 'You all worked so hard. Really.'],
      lose: ['밥 먹으러 가요  그다음 얘기해요', "Let's eat first. Then we talk."],
      out: ['…미안해요  먼저 갈게요', "...Sorry. I'll go first."] },
    taeo: { voice: .7,
      tv: ['7년 만에 카메라 앞입니다', 'First time in front of a camera in seven years.'],
      yt: ['편집은 제가 배우겠습니다', 'I\'ll learn to edit.'],
      refuse: ['…홍대에서 시작했으면 홍대 식으로', '...We started in Hongdae. We do it the Hongdae way.'],
      trust: ['…저도 그렇게 오래 서 있을 수 있을까요', '...Could I stand there that long, too.'],
      taste: ['…7년  처음으로 우리 이름이 불렸습니다', '...Seven years. First time they called our name.'],
      greet: ['7년 동안 이런 분 많이 봤습니다  다 떠났고요', 'Seven years, I\'ve met a lot of guys like you. They all left.'],
      leader: ['책임지겠습니다', "I'll take responsibility."],
      great: ['됐다  이제 됐어', 'There. Finally.'],
      ok: ['기본부터  다시', 'Basics. Again.'],
      tired: ['…내색하지 마  애들 본다', "...Don't show it. The kids are watching."],
      rest: ['오랜만에 집에 전화했어요', 'Called home for the first time in a while.'],
      gig: ['넷이 한 호흡이었어', 'Four of us, one breath.'],
      charm: ['예능은… 노력 중입니다', "Variety... I'm working on it."],
      low: ['7년… 또 여기서 끝인가', 'Seven years... does it end here again?'],
      win: ['7년  기다린 보람이 있네', 'Seven years. Worth the wait.'],
      lose: ['고개 들어  우린 데뷔했어', 'Heads up. We debuted.'],
      out: ['…여기까지 오게 해줘서 고마웠다', '...Thanks for getting me this far.'] },
    rowoon: { voice: 1.35,
      tv: ['방송이다!! 저 방송 나왔어요!!', 'TV!! I was on TV!!'],
      yt: ['구독 좋아요 알림설정!!', 'Like, subscribe, hit the bell!!'],
      refuse: ['저요? 저는 언제든 나가요!', 'Me? I\'ll go anytime!'],
      trust: ['아저씨 팔 흔드는 거 유튜브에 올렸어요!! 조회수 50만!!', 'I posted your arm-wave on YouTube!! 500K views!!'],
      taste: ['저 밈 됐어요!! 밈이요!!', 'I\'m a meme!! A MEME!!'],
      greet: ['헐 아저씨 진짜요?! 그 뒤에서 팔 흔드는 거요?! 저 보여줘요!!', 'No way, mister, for real?! The arm-wave guy in the back?! Show me!!'],
      leader: ['네?? 저요?? 아 이거 큰일 났다ㅋㅋ', 'Huh?? ME?? Oh no lol'],
      great: ['저 방금 천재였죠? 인정?', 'I was a genius just now, right? Admit it.'],
      ok: ['이 정도면 귀엽지 않아요?', 'Cute enough, no?'],
      tired: ['형… 저 진짜 죽을 것 같아요…', "Hyung... I'm actually dying..."],
      rest: ['12시간 잤어요  신기록', 'Slept 12 hours. New record.'],
      gig: ['제가 춤추니까 애기가 울음 그쳤어요!', 'A baby stopped crying when I danced!'],
      charm: ['카메라 켜졌어요? 자 갑니다!!', 'Camera on? Here we go!!'],
      low: ['…혼자 있을 땐 안 웃어요 사실', "...I don't smile when I'm alone. Honestly."],
      win: ['1등!! 아니 근데 진짜?! 진짜요?!', 'Number one!! Wait, for real?! FOR REAL?!'],
      lose: ['울지 마요  제가 더 웃길게요', "Don't cry. I'll be funnier."],
      out: ['…웃는 것도 힘들었어요', '...Even smiling got hard.'] },
  };

  /* ══════ 에피소드 — 멤버마다 3막. week 에 열리고, 그 주에 하나만 나온다 ══════
     lines: {n:[…]} 지문, {e:'joy', t:[…]} 대사
     choice.a[i]: t 선택지, bond 호감도, mental, stat/val, reply 답 대사 */
  const EPISODES = [
    /* ── 라이온: 혼자 부르던 사람이 함께 부르기까지 ── */
    { key: 'lion', ep: 1, week: 2,
      lines: [
        { n: ['새벽 두 시  불 꺼진 합주실에서 노랫소리가 새어 나온다', '2 A.M. A voice leaks from the dark rehearsal room.'] },
        { e: 'std', t: ['…아  계셨어요', '...Oh. You were here.'] },
        { e: 'sad', t: ['사람 앞에서는 이렇게 안 나와요  혼자일 때만', "It doesn't come out like this in front of people. Only alone."] },
      ],
      choice: { a: [
        { t: ['"방금 그거 무대에서 불러"', '"Sing that. On stage."'], bond: 12, mental: 6, reply: { e: 'joy', t: ['…들키면 어쩌려고요  알겠어요  해볼게요', '...What if they hear me. Fine. I\'ll try.'] } },
        { t: ['"혼자 연습은 금지  내일부터 다 같이"', '"No more solo practice. With the team, from tomorrow."'], bond: -3, mental: -4, stat: 'vocal', val: 3, reply: { e: 'sad', t: ['…네  그게 맞겠죠', "...Okay. That's probably right."] } },
      ] } },
    { key: 'lion', ep: 2, week: 6,
      lines: [
        { n: ['라이온의 폰이 계속 울린다  옛 밴드 친구다', "Lion's phone keeps buzzing. An old bandmate."] },
        { e: 'sad', t: ['"아이돌이 됐다며." 그렇게만 보냈더라고요', '"Heard you went idol." That\'s all he wrote.'] },
        { e: 'std', t: ['저는 그냥… 노래를 더 많은 사람한테 들려주고 싶었던 건데', 'I just... wanted more people to hear the song.'] },
      ],
      choice: { a: [
        { t: ['"네 노래는 어디서 불러도 네 노래야"', '"Your song is your song, wherever you sing it."'], bond: 12, mental: 10, reply: { e: 'joy', t: ['…그 말 가사에 써도 돼요?', '...Can I put that in a lyric?'] } },
        { t: ['"폰 꺼  지금은 무대만 생각해"', '"Phone off. Only the stage now."'], bond: -2, mental: -5, stat: 'charm', val: 3, reply: { e: 'mad', t: ['…알겠어요  껐어요', "...Fine. It's off."] } },
      ] } },
    { key: 'lion', ep: 3, week: 10,
      lines: [
        { n: ['버스킹 뒤 종이 한 장이 마이크 케이스에 끼워져 있었다', 'After busking, a folded note was tucked in the mic case.'] },
        { e: 'joy', t: ['"오늘 처음으로 울었어요." …이렇게 적혀 있어요', '"Today I cried for the first time." ...That\'s what it says.'] },
        { e: 'std', t: ['한 명이면 돼요  한 명한테 닿으면', 'One is enough. If it reaches one person.'] },
      ],
      choice: { a: [
        { t: ['"그 한 명이 곧 만 명이 돼"', '"That one becomes ten thousand."'], bond: 10, mental: 8, reply: { e: 'joy', t: ['…그럼 만 번 울리겠네요', "...Then I'll make them cry ten thousand times."] } },
        { t: ['"편지 잘 보관해  데뷔 무대에서 읽자"', '"Keep it. We\'ll read it at the debut stage."'], bond: 8, stat: 'vocal', val: 3, reply: { e: 'std', t: ['…네  그때까지 안 잃어버릴게요', "...Okay. I won't lose it till then."] } },
      ] } },

    /* ── 카이렌: 혼자 하던 짐승이 팀을 믿기까지 ── */
    { key: 'kairen', ep: 1, week: 2,
      lines: [
        { n: ['첫 합주  카이렌만 반 박자 앞서 있다', 'First jam. Kairen is half a beat ahead of everyone.'] },
        { e: 'mad', t: ['맞추라고? 쟤들이 느린 거야', "Match them? They're the slow ones."] },
        { e: 'std', t: ['…전에 있던 팀도 그랬어  맞추다가 다 같이 느려졌지', '...My last team was like that. We matched, and all got slow.'] },
      ],
      choice: { a: [
        { t: ['"네가 앞에서 끌어  대신 뒤를 봐"', '"You lead from the front. But watch your back."'], bond: 12, mental: 5, reply: { e: 'std', t: ['…뒤  알겠어  한 번 봐 주지', "...The back. Fine. I'll look once."] } },
        { t: ['"팀이 먼저야  반 박자 늦춰"', '"Team first. Pull back half a beat."'], bond: -4, mental: -6, stat: 'perf', val: 3, reply: { e: 'mad', t: ['…시키는 대로  결과는 네 책임이다', "...As you say. The result's on you."] } },
      ] } },
    { key: 'kairen', ep: 2, week: 6,
      lines: [
        { n: ['버스킹 관객 맨 뒤 낯익은 얼굴  옛 밴드의 드러머다', 'Back of the busking crowd, a familiar face. His old drummer.'] },
        { e: 'sad', t: ['해체하던 날 내가 제일 먼저 나갔어  뒤도 안 보고', 'The day we split, I walked first. Never looked back.'] },
        { e: 'std', t: ['…근데 끝까지 보고 있더라  오늘', '...And he stayed till the end. Today.'] },
      ],
      choice: { a: [
        { t: ['"가서 인사해  지금"', '"Go say hi. Now."'], bond: 12, mental: 10, reply: { e: 'joy', t: ['…웃더라  그놈  다행이야', '...He smiled. That guy. Good.'] } },
        { t: ['"과거는 두고 와  앞만 봐"', '"Leave the past. Eyes forward."'], bond: -2, mental: -3, stat: 'write', val: 3, reply: { e: 'mad', t: ['…그래  그게 내 방식이지', "...Yeah. That's my way."] } },
      ] } },
    { key: 'kairen', ep: 3, week: 10,
      lines: [
        { n: ['막내가 카이렌의 파트를 틀렸다  정적', 'The youngest botched Kairen\'s part. Silence.'] },
        { e: 'mad', t: ['…', '...'] },
        { e: 'std', t: ['다시  내가 옆에서 같이 갈 테니까  다시', "Again. I'll go with you this time. Again."] },
        { n: ['처음이었다  카이렌이 누군가를 기다린 것은', 'It was the first time Kairen had waited for anyone.'] },
      ],
      choice: { a: [
        { t: ['"…너 변했다"', '"...You\'ve changed."'], bond: 12, mental: 6, reply: { e: 'joy', t: ['시끄러워  무대에서 보자고 했잖아  넷이서', 'Shut up. I said see you on stage. All four.'] } },
        { t: ['"막내한테 너무 무르게 굴지 마"', '"Don\'t go soft on the kid."'], bond: -3, stat: 'perf', val: 2, reply: { e: 'mad', t: ['…무른 게 아니라 기다린 거야', "...Not soft. Waiting."] } },
      ] } },

    /* ── 도윤: 새벽 알바와 무릎 ── */
    { key: 'doyun', ep: 1, week: 2,
      lines: [
        { n: ['새벽 다섯 시 편의점 앞  도윤이 유니폼 차림으로 서 있다', '5 A.M., outside a convenience store. Doyun, in a uniform.'] },
        { e: 'sad', t: ['아… 들켰다  학원비를 제가 내기로 해서요', "Ah... you caught me. I pay my own class fees."] },
        { e: 'joy', t: ['괜찮아요! 잠은 연습실에서 자면 돼요!', "It's fine! I can sleep at the practice room!"] },
      ],
      choice: { a: [
        { t: ['"알바 그만둬  학원비는 회사가 낸다"', '"Quit the job. The company pays."'], bond: 14, mental: 8, money: -100, reply: { e: 'joy', t: ['…진짜요? 저 진짜 열 배로 출게요!!', "...Really? I'll dance ten times harder!!"] } },
        { t: ['"네 선택이야  대신 연습에서 티 내지 마"', '"Your call. Just don\'t let it show in practice."'], bond: -2, mental: -6, stat: 'perf', val: 3, reply: { e: 'std', t: ['네! 절대 티 안 낼게요!', "Yes! I'll never let it show!"] } },
      ] } },
    { key: 'doyun', ep: 2, week: 6,
      lines: [
        { n: ['드럼 솔로 끝에 도윤의 손목이 잠깐 풀렸다  아무도 못 봤다고 생각했다', "At the end of the drum solo, Doyun's wrist gave for a second. He thought nobody saw."] },
        { e: 'joy', t: ['에이 미끄러진 거예요! 바닥이 좀…', 'Nah, I slipped! The floor\'s a bit...'] },
        { e: 'sad', t: ['…3주 됐어요  말하면 빼실까 봐', "...Three weeks. I didn't say because you'd bench me."] },
      ],
      choice: { a: [
        { t: ['"이번 주는 앉아서 봐  그게 명령이야"', '"This week you sit and watch. That\'s an order."'], bond: 10, mental: 6, stamina: 1, reply: { e: 'sad', t: ['…네  대신 다음 주엔 두 배로요', '...Okay. But double next week.'] } },
        { t: ['"참을 수 있으면 참아  데뷔가 먼저야"', '"If you can take it, take it. Debut comes first."'], bond: -6, mental: -8, stat: 'perf', val: 4, reply: { e: 'joy', t: ['참을 수 있어요! 저 진짜 괜찮아요!', "I can take it! I'm really fine!"] } },
      ] } },
    { key: 'doyun', ep: 3, week: 10,
      lines: [
        { n: ['도윤이 초대권 두 장을 만지작거린다', 'Doyun fidgets with two invitation tickets.'] },
        { e: 'sad', t: ['부모님이요  "춤은 취미"라고 하셨거든요  3년 전에', 'My parents. "Dancing is a hobby," they said. Three years ago.'] },
        { e: 'std', t: ['보내면… 안 오실 수도 있잖아요', 'If I send them... they might not come.'] },
      ],
      choice: { a: [
        { t: ['"보내  안 오면 내가 영상 찍어서 보낸다"', '"Send them. If they don\'t come, I\'ll film it and send it."'], bond: 12, mental: 10, reply: { e: 'joy', t: ['…보낼게요  맨 앞자리로!', "...I'll send them. Front row!"] } },
        { t: ['"무대로 증명해  초대는 그다음"', '"Prove it on stage. Invitations after."'], bond: 2, stat: 'perf', val: 3, reply: { e: 'std', t: ['…네  먼저 증명할게요', "...Yes. I'll prove it first."] } },
      ] } },

    /* ── 하루: "얼굴만" 이라는 말 ── */
    { key: 'haru', ep: 1, week: 3,
      lines: [
        { n: ['버스킹 영상 댓글  "은발 걔는 얼굴만 있네"', 'A comment under the busking clip. "Silver hair kid is just a face."'] },
        { e: 'sad', t: ['…맞는 말이에요  저도 알아요', "...They're right. I know."] },
        { e: 'std', t: ['얼굴 말고 뭐가 있는지 저도 아직 몰라서요', "I don't know yet what else I have. Besides the face."] },
      ],
      choice: { a: [
        { t: ['"얼굴도 실력이야  나머지는 찾으면 돼"', '"The face is a skill too. The rest, we\'ll find."'], bond: 12, mental: 10, reply: { e: 'joy', t: ['…찾을 수 있을까요  같이요', '...Can we find it. Together.'] } },
        { t: ['"댓글 보지 마  연습이나 해"', '"Stop reading comments. Practice."'], bond: -3, mental: -5, stat: 'perf', val: 3, reply: { e: 'sad', t: ['…네  안 볼게요', "...Okay. I won't look."] } },
      ] } },
    { key: 'haru', ep: 2, week: 7,
      lines: [
        { n: ['샤워실에서 노랫소리  하루다  라이온이 문 앞에 멈춰 섰다', 'Singing from the shower room. It\'s Haru. Lion stops at the door.'] },
        { e: 'joy', t: ['네?! 아 아무것도 아니에요! 그냥 흥얼거린…', 'What?! N-nothing! I was just humming...'] },
        { e: 'std', t: ['…형이 잘한다고 했어요  라이온 형이요  진짜로요?', '...He said it was good. Lion did. Was it, really?'] },
      ],
      choice: { a: [
        { t: ['"다음 곡에 네 파트 넣는다  8마디"', '"You get a part in the next song. Eight bars."'], bond: 14, mental: 8, stat: 'vocal', val: 4, reply: { e: 'joy', t: ['여덟… 여덟 마디요?! 망치면 어떡해요!', 'Eight... eight bars?! What if I ruin it!'] } },
        { t: ['"비주얼은 비주얼만 해도 돼"', '"A visual only has to be a visual."'], bond: -6, mental: -6, stat: 'perf', val: 4, reply: { e: 'sad', t: ['…네  그렇죠  알겠어요', '...Right. Of course. Okay.'] } },
      ] } },
    { key: 'haru', ep: 3, week: 11,
      lines: [
        { n: ['타이틀곡 편곡 회의  하루가 손을 들었다  처음이다', 'Title-track arrangement meeting. Haru raises his hand. A first.'] },
        { e: 'mad', t: ['…브릿지 제가 할게요  제일 높은 데요', '...The bridge. I\'ll take it. The highest part.'] },
        { e: 'std', t: ['얼굴만 있는 애가 어디까지 가는지 보여 주고 싶어서요', 'I want to show how far "just a face" can go.'] },
      ],
      choice: { a: [
        { t: ['"브릿지는 네 거다"', '"The bridge is yours."'], bond: 12, mental: 10, stat: 'vocal', val: 3, reply: { e: 'joy', t: ['…후회 안 하게 할게요', "...You won't regret it."] } },
        { t: ['"아직은 무리야  다음 앨범에"', '"Not yet. Next album."'], bond: -4, mental: -4, reply: { e: 'sad', t: ['…다음  네  기다릴게요', '...Next. Okay. I\'ll wait.'] } },
      ] } },

    /* ── 제이: 크루와 아이돌 사이 ── */
    { key: 'jay', ep: 1, week: 3,
      lines: [
        { n: ['제이의 SNS에 옛 크루의 글이 올라왔다  "팔려 갔네"', "A post from Jay's old crew on his feed. \"Sold out.\""] },
        { e: 'mad', t: ['…웃기지  같이 굶던 애들이', "...Funny. The guys I starved with."] },
        { e: 'std', t: ['난 랩 하러 온 거야  옷 갈아입은 게 아니라', 'I came to rap. Not to change clothes.'] },
      ],
      choice: { a: [
        { t: ['"타이틀곡 랩 가사 네가 써"', '"You write the title-track rap."'], bond: 12, mental: 6, stat: 'write', val: 3, reply: { e: 'joy', t: ['…진짜? 검열 없이? 오케이 보여 줄게', "...For real? No censoring? Okay. Watch me."] } },
        { t: ['"크루는 잊어  여긴 회사야"', '"Forget the crew. This is a company."'], bond: -5, mental: -6, stat: 'charm', val: 3, reply: { e: 'mad', t: ['…회사  그래  알았다', '...A company. Right. Got it.'] } },
      ] } },
    { key: 'jay', ep: 2, week: 7,
      lines: [
        { n: ['제이가 쓴 가사 한 줄에 빨간 줄이 그였다  방송 심의', 'A red line through one of Jay\'s lyrics. Broadcast review.'] },
        { e: 'mad', t: ['이 줄이 이 곡이야  이거 빼면 뭘 부르라고', "This line IS the song. Cut it and what's left."] },
        { e: 'sad', t: ['…거리에선 아무도 내 말을 지우지 않았어', "...On the street, nobody erased my words."] },
      ],
      choice: { a: [
        { t: ['"돌려 말해  더 세게"', '"Say it sideways. Harder."'], bond: 10, mental: 4, stat: 'write', val: 4, reply: { e: 'joy', t: ['…돌려서 더 세게  그거 재밌겠는데', '...Sideways, harder. That could be fun.'] } },
        { t: ['"빼  방송이 먼저야"', '"Cut it. Broadcast comes first."'], bond: -6, mental: -8, reply: { e: 'mad', t: ['…뺐어  만족해?', "...Cut. Happy?"] } },
      ] } },
    { key: 'jay', ep: 3, week: 11,
      lines: [
        { n: ['마지막 버스킹  맨 앞줄에 후드 셋  옛 크루다', 'Last busking. Front row, three hoodies. The old crew.'] },
        { e: 'std', t: ['…왔네  욕하러 왔겠지', '...They came. To trash me, probably.'] },
        { n: ['곡이 끝나자 셋이 동시에 손을 올렸다  크루의 사인', 'When the song ended, all three raised a hand. The crew sign.'] },
        { e: 'joy', t: ['…아 씨  이거 눈에 뭐 들어갔네', "...Damn. Got something in my eye."] },
      ],
      choice: { a: [
        { t: ['"데뷔 무대에 초대해"', '"Invite them to the debut stage."'], bond: 12, mental: 10, reply: { e: 'joy', t: ['맨 앞줄  후드 벗으라고 해야지', 'Front row. Gonna make them take the hoods off.'] } },
        { t: ['"봤지? 이제 네 무대는 여기야"', '"See? Your stage is here now."'], bond: 6, stat: 'write', val: 3, reply: { e: 'std', t: ['…여기  그래  여기도 내 거리다', '...Here. Yeah. This is my street too.'] } },
      ] } },

    /* ── 유안: 남을 챙기다 자기를 놓친 사람 ── */
    { key: 'yuan', ep: 1, week: 3,
      lines: [
        { n: ['새벽  유안이 도시락 다섯 개를 싸고 있다  자기 것은 없다', 'Dawn. Yuan is packing five lunches. None for himself.'] },
        { e: 'joy', t: ['애들이 안 먹으면 춤이 안 나와서요  저는 괜찮아요', "If the kids don't eat, they can't dance. I'm fine."] },
        { e: 'sad', t: ['…제 몫이요? 아  늘 까먹네요', '...Mine? Ah. I always forget.'] },
      ],
      choice: { a: [
        { t: ['"여섯 개 싸  네 것부터"', '"Pack six. Yours first."'], bond: 12, mental: 8, reply: { e: 'joy', t: ['…제 것부터  이상하게 어렵네요 그게', "...Mine first. Strange how hard that is."] } },
        { t: ['"도시락은 회사가 맡는다  넌 노래만 해"', '"The company handles food. You just sing."'], bond: 2, mental: 2, stat: 'vocal', val: 3, money: -60, reply: { e: 'std', t: ['…그럼 뭘 챙기죠 저는  아 노래요', '...Then what do I take care of. Ah. The song.'] } },
      ] } },
    { key: 'yuan', ep: 2, week: 7,
      lines: [
        { n: ['기사 하나가 돌았다  "23세 무명 밴드 보컬 뜨기엔 늦은 나이?"', 'An article went around. "A 23-year-old unknown band vocalist — too old to make it?"'] },
        { e: 'std', t: ['맞는 말이죠  애들이 열여덟이니까', "They're right. The kids are eighteen."] },
        { e: 'sad', t: ['…그래도 이번엔 저도 무대에 서고 싶었어요  뒤가 아니라', '...But this time I wanted to stand on stage too. Not behind.'] },
      ],
      choice: { a: [
        { t: ['"타이틀곡 첫 소절은 네 목소리로 연다"', '"The title track opens with your voice."'], bond: 14, mental: 10, stat: 'vocal', val: 3, reply: { e: 'joy', t: ['첫 소절… 제가요? …고마워요  진짜로', 'The first line... me? ...Thank you. Really.'] } },
        { t: ['"나이는 신경 쓰지 마  뒤에서 받쳐 줘"', '"Don\'t mind the age. Support from behind."'], bond: -4, mental: -6, reply: { e: 'std', t: ['…뒤에서요  네  잘하는 거니까', '...From behind. Sure. It\'s what I\'m good at.'] } },
      ] } },
    { key: 'yuan', ep: 3, week: 11,
      lines: [
        { n: ['숙소 옥상  유안이 처음으로 자기 얘기를 꺼냈다', 'Dorm rooftop. For the first time, Yuan talks about himself.'] },
        { e: 'sad', t: ['동생이 있었어요  노래를 저보다 잘했는데', 'I had a younger brother. Sang better than me.'] },
        { e: 'std', t: ['…그래서 제가 대신 부르는 거예요  그 애 몫까지', "...So I sing for him too. His share."] },
      ],
      choice: { a: [
        { t: ['"이제 네 몫으로 불러  동생은 들을 거야"', '"Sing your share now. He\'ll be listening."'], bond: 14, mental: 12, reply: { e: 'joy', t: ['…제 몫  네  들리게 부를게요', "...My share. Yes. I'll sing so he hears."] } },
        { t: ['"그 얘기 데뷔 인터뷰에서 하자"', '"Save that story for the debut interview."'], bond: -6, mental: -4, stat: 'charm', val: 4, reply: { e: 'mad', t: ['…그건 팔 얘기가 아니에요', "...That's not a story to sell."] } },
      ] } },

    /* ── 태오: 7년, 마지막 기회 ── */
    { key: 'taeo', ep: 1, week: 2,
      lines: [
        { n: ['회사 복도  태오가 서류 한 장을 접어 주머니에 넣는다', 'Company hallway. Taeo folds a sheet of paper into his pocket.'] },
        { e: 'std', t: ['계약 만료 통보입니다  이번에 데뷔 못 하면 끝이라고', "Contract expiry notice. If I don't debut this time, it's over."] },
        { e: 'mad', t: ['애들한텐 말하지 마세요  흔들립니다', "Don't tell the kids. They'll waver."] },
      ],
      choice: { a: [
        { t: ['"혼자 짊어지지 마  나도 안다"', '"Don\'t carry it alone. I know now."'], bond: 12, mental: 8, reply: { e: 'std', t: ['…알고 계시면 됐습니다  그거면 됩니다', "...You knowing is enough. That's all I need."] } },
        { t: ['"그러니까 더 굴려야지  두 배로"', '"Then we push harder. Double."'], bond: -2, mental: -6, stat: 'perf', val: 4, reply: { e: 'mad', t: ['…두 배  하겠습니다', '...Double. Understood.'] } },
      ] } },
    { key: 'taeo', ep: 2, week: 6,
      lines: [
        { n: ['숙소 TV  태오의 옛 동기가 있는 그룹이 1위 트로피를 들고 있다', "Dorm TV. A group with Taeo's old trainee-mate is holding a #1 trophy."] },
        { e: 'std', t: ['같은 방 썼습니다  4년을', 'We shared a room. Four years.'] },
        { e: 'sad', t: ['…축하한다고 문자 보냈습니다  답은 안 올 겁니다', "...I texted congrats. He won't reply."] },
      ],
      choice: { a: [
        { t: ['"다음 트로피는 네 거야  내가 본다"', '"The next trophy is yours. I\'ll be there."'], bond: 12, mental: 10, reply: { e: 'joy', t: ['…처음입니다  누가 그렇게 말해 준 건', "...First time. Anyone's said that to me."] } },
        { t: ['"TV 꺼  부러워할 시간 없어"', '"TV off. No time for envy."'], bond: -3, mental: -4, stat: 'charm', val: 3, reply: { e: 'mad', t: ['…껐습니다  연습 가겠습니다', '...Off. Going to practice.'] } },
      ] } },
    { key: 'taeo', ep: 3, week: 10,
      lines: [
        { n: ['태오가 전화기를 들었다 놓기를 세 번째', "Taeo picks up the phone and puts it down. Third time."] },
        { e: 'sad', t: ['아버지요  "언제까지 할 거냐"고 하신 게 마지막 통화였습니다  2년 전', 'My father. "How long will you keep this up" — our last call. Two years ago.'] },
        { e: 'std', t: ['데뷔 날짜를… 말씀드려야 할까요', 'Should I... tell him the debut date.'] },
      ],
      choice: { a: [
        { t: ['"지금 걸어  내가 옆에 있을게"', '"Call now. I\'ll stand right here."'], bond: 14, mental: 12, reply: { e: 'joy', t: ['…받으셨습니다  "그래" 한마디  …그거면 됩니다', '...He answered. One word: "Okay." ...That\'s enough.'] } },
        { t: ['"1위 하고 걸어  그게 더 세"', '"Call after #1. Hits harder."'], bond: 4, stat: 'charm', val: 3, reply: { e: 'std', t: ['…1위  그럼 꼭 해야겠군요', "...#1. Then I have to get it."] } },
      ] } },

    /* ── 로운: 웃는 가면 ── */
    { key: 'rowoon', ep: 1, week: 3,
      lines: [
        { n: ['예능 연습 중  로운이 의자 개그를 하다 진짜로 넘어졌다', 'Variety practice. Rowoon did a chair gag and actually fell.'] },
        { e: 'joy', t: ['하하! 봤어요?! 이거 진짜 웃겼죠?!', 'Haha! Did you see?! That was hilarious, right?!'] },
        { e: 'sad', t: ['…팔꿈치요? 괜찮아요  웃겼으면 된 거예요', "...My elbow? It's fine. As long as it was funny."] },
      ],
      choice: { a: [
        { t: ['"안 웃겼어  아파 보였어"', '"It wasn\'t funny. It looked like it hurt."'], bond: 12, mental: 8, reply: { e: 'sad', t: ['…그런 말 처음 들어요  아프냐고', "...Nobody's ever asked. If it hurt."] } },
        { t: ['"좋아 그 감으로 카메라 앞에서도 해"', '"Good. Do that in front of the camera too."'], bond: -3, mental: -5, stat: 'charm', val: 4, reply: { e: 'joy', t: ['넵!! 더 세게 넘어질게요!!', "Yes!! I'll fall even harder!!"] } },
      ] } },
    { key: 'rowoon', ep: 2, week: 7,
      lines: [
        { n: ['비상계단  로운이 혼자 앉아 있다  웃지 않는 얼굴로', 'Emergency stairwell. Rowoon sits alone. Not smiling.'] },
        { e: 'std', t: ['…아 여기 계셨어요? 지금 표정은 못 본 걸로', '...Oh, you\'re here? Pretend you didn\'t see this face.'] },
        { e: 'sad', t: ['하루 종일 웃으면요 밤에 얼굴이 아파요  진짜로', 'If you smile all day, your face hurts at night. For real.'] },
      ],
      choice: { a: [
        { t: ['"여기선 안 웃어도 돼"', '"You don\'t have to smile here."'], bond: 14, mental: 12, reply: { e: 'std', t: ['…그럼 5분만요  5분만 안 웃을게요', "...Then five minutes. I'll not-smile for five minutes."] } },
        { t: ['"팬들은 웃는 로운을 원해"', '"Fans want the smiling Rowoon."'], bond: -6, mental: -8, stat: 'charm', val: 4, reply: { e: 'joy', t: ['…맞아요  자 웃는 로운 갑니다!', "...Right. Okay, smiling Rowoon, here we go!"] } },
      ] } },
    { key: 'rowoon', ep: 3, week: 11,
      lines: [
        { n: ['데뷔 전 마지막 카메라 테스트  로운이 잠깐 멈췄다', 'Last camera test before debut. Rowoon pauses.'] },
        { e: 'std', t: ['오늘은… 개그 말고 진짜 얘기 하나 해도 돼요?', 'Today... can I say one real thing instead of a gag?'] },
        { e: 'sad', t: ['"웃긴 애" 말고 그냥 "로운"으로도 좋아해 줄까요 사람들이', 'Would people like "Rowoon"? Not "the funny one." Just me.'] },
      ],
      choice: { a: [
        { t: ['"카메라 돌려  네 얘기 해"', '"Roll the camera. Tell your story."'], bond: 14, mental: 10, stat: 'charm', val: 3, reply: { e: 'joy', t: ['…했어요  안 웃겼는데 다들 조용했어요  좋은 조용이요', "...I did. Wasn't funny. Everyone went quiet. The good kind."] } },
        { t: ['"진짜 얘긴 나중에  지금은 캐릭터 유지"', '"Real talk later. Stay in character for now."'], bond: -5, mental: -6, reply: { e: 'joy', t: ['…넵! 캐릭터 유지! 하하!', '...Yep! In character! Haha!'] } },
      ] } },
  ];

  /* 프로듀서 — 50살, 90년대 반짝 댄스그룹 맨 뒷줄. 그림 img/p_{std,joy,sad,mad}.webp */
  const PRODUCER = {
    voice: .62,
    /* 프롤로그 — 20대 반짝 댄스그룹 → 식품회사 사장. 회식 뒤 혼자 홍대 놀이터에 갔다가 버스킹 넷을 발견, 명함 들고 쫓아다닌다 */
    prologue: [
      { p: 'std', n: ['1996년  5인조 댄스그룹 \'블루샤크\'  그해 신인상 이듬해 해체', '1996. Five-member dance group \'Blue Shark.\' Rookie of the Year, disbanded the next.'] },
      { p: 'std', t: ['나? 맨 뒤  오른쪽에서 두 번째  팔 흔드는 거', 'Me? Back row. Second from the right. The arm-wave guy.'] },
      { p: 'sad', t: ['그 뒤로 노래는 안 했어  30년  식품회사 차려서 \'사장님\' 소리 들으면서 살았지', 'Never sang again. Thirty years. Started a food company, got called \'Boss\' for a living.'] },
      { p: 'std', n: ['금요일 밤 회식 3차가 끝났다  태오는 택시를 안 타고 혼자 걸었다  홍대 놀이터까지', 'Friday night, the third round of the company dinner is over. Taeo skips the taxi and walks alone. All the way to the Hongdae playground.'] },
      { p: 'std', t: ['…술 깨러 온 거야  그냥', '...Just sobering up. That\'s all.'] },
      { p: 'std', n: ['놀이터 구석 버스킹 마지막 곡  지나가던 사람들이 하나둘 멈춰 선다  태오도 멈췄다', 'Corner of the playground, last song of a busking set. Passersby stop one by one. So does Taeo.'] },
      { p: 'joy', t: ['저거다  저 넷이다  내가 30년 동안 못 한 거', 'That\'s it. Those four. What I couldn\'t do for thirty years.'] },
      { p: 'std', n: ['노래가 끝나자 태오는 명함을 꺼내 들고 뛰었다  \'태오식품 대표이사\'  넷은 케이스를 들고 흩어졌다', 'When the song ended, Taeo pulled out a business card and ran. \'CEO, Taeo Foods.\' The four grabbed their cases and scattered.'] },
      { p: 'mad', t: ['야! 잠깐! 명함! 식품회사지만 명함만 받아!', 'Hey! Wait! The card! It says food company, but just take the card!'] },
      { p: 'std', n: ['다음 날도 그다음 날도 태오는 놀이터에 있었다  명함은 열두 장이 됐다', 'The next day, and the day after, Taeo was at that playground. Twelve cards later.'] },
      { p: 'std', t: ['…오늘은 한 명씩 얘기해 본다  도망가기 전에', '...Today I talk to them one at a time. Before they run.'] },
    ],
    intro: [
      { p: 'std', n: ['홍대 앞  버스킹이 끝난 골목에 기타 케이스 네 개가 놓여 있다', 'Hongdae street. Four guitar cases sit in an alley after a busking set.'] },
      { p: 'std', t: ['나 알아? …모르겠지  90년대에 좀 날렸어', 'Know me? ...Didn\'t think so. I was big in the \'90s.'] },
      { p: 'sad', t: ['맨 뒤에서  팔 흔드는 거  그게 나였어', 'In the back row. The arm-wave guy. That was me.'] },
      { p: 'mad', t: ['너희 유명해질 생각 없어? 12주 준다', 'You guys want to get famous or not? I\'ll give you twelve weeks.'] },
    ],
    taste: [
      { p: 'std', n: ['금요일 밤 국민 예능 게스트  방송 다음 날 홍대 앞 버스킹에 사람이 골목 끝까지 찼다', 'Friday night, guests on the nation\'s biggest variety show. Next day, the Hongdae busking crowd filled the alley to the end.'] },
      { p: 'joy', t: ['…봤지? 이게 인기 맛이야', '...See? That\'s what fame tastes like.'] },
    ],
    tasteEnd: [
      { p: 'std', n: ['그날 이후로 아무도 "방송 안 나가"라고 하지 않았다', 'After that day, nobody said "I\'m not doing TV" again.'] },
    ],
    refuse: [
      { p: 'mad', t: ['…나도 그랬어  맨 뒤에서 팔만 흔들면서', '...I was like that too. Waving my arm in the back row.'] },
    ],
    /* 실패 엔딩 — 45점 아래 */
    fail: [
      { p: 'sad', t: ['…다시 명함 돌려야겠네', "...Guess I'm handing out cards again."] },
      { p: 'std', t: ['놀이터는 안 없어져  다음 금요일에 보자', "The playground isn't going anywhere. See you next Friday."] },
    ],
  };

  /* 영입 — 홍대 앞 버스킹하는 애들을 프로듀서가 찾아가 설득한다. 카드마다 한 장면 */
  const RECRUIT = {
    lion: {
      lines: [
        { p: 'std', n: ['홍대 골목 끝  라이온이 기타 케이스를 닫으며 튜너를 들여다본다', 'End of the Hongdae alley. Lion closes his guitar case, staring at the tuner.'] },
        { e: 'std', t: ['90년대요? …그때 믹싱은 지금이랑 방식이 달랐을 텐데요', "The '90s? ...Mixing worked differently back then, didn't it."] },
      ],
      a: [
        { t: ['"네 코드 진행 넷째 마디에서 일부러 반음 내리지  그거 듣고 왔어"', '"Your progression — you drop a half step on bar four on purpose. That\'s why I\'m here."'], bond: 10,
          reply: { e: 'joy', t: ['…그걸 들으셨어요? 그건 아무도 못 알아채는데', '...You heard that? Nobody ever catches that.'] } },
        { t: ['"계약금 150  12주  싫으면 말고"', '"150 signing fee. Twelve weeks. Take it or leave it."'], bond: 2, fee: -50,
          reply: { e: 'std', t: ['…조건이 명확해서 좋네요  계산해 볼게요', '...Clear terms. I like that. Let me run the numbers.'] } },
      ],
      join: { e: 'std', t: ['해 볼게요  가설이니까요  틀리면 그때 나가고요', "I'll try. It's a hypothesis. If it's wrong, I leave then."] },
    },
    kairen: {
      lines: [
        { p: 'std', n: ['버스킹 마지막 곡  카이렌이 마이크를 던지듯 내려놓는다', 'Last song of the set. Kairen drops the mic like he\'s throwing it.'] },
        { e: 'mad', t: ['말 길게 하지 마  돈 얼마 있어?', "Don't make it long. How much money you got?"] },
      ],
      a: [
        { t: ['"말 안 해  무대 하나 잡아 줄게  거기서 얘기해"', '"I won\'t talk. I\'ll get you a stage. We talk there."'], bond: 10,
          reply: { e: 'joy', t: ['…오케이  무대에서 보자', '...Okay. See you on stage.'] } },
        { t: ['"200  대신 12주 동안 내 말 들어"', '"200. But for twelve weeks, you do what I say."'], bond: 2, fee: -50,
          reply: { e: 'mad', t: ['듣는 척은 해 줄게', "I'll pretend to listen."] } },
      ],
      join: { e: 'std', t: ['따라가 준다  느리면 내가 앞장선다', "I'll follow. If you're slow, I take the lead."] },
    },
    doyun: {
      lines: [
        { p: 'std', n: ['스틱을 돌리며 도윤이 먼저 뛰어온다  묻기도 전에', 'Twirling his sticks, Doyun runs over first. Before anyone asks.'] },
        { e: 'joy', t: ['우와 진짜 TV 나오셨어요?! 저 그거 알아요! …아니 몰라요! 근데 완전 좋아요!!', 'Whoa, you were really on TV?! I know it! ...No I don\'t! But I love it!!'] },
      ],
      a: [
        { t: ['"너 드럼 칠 때 웃는 거 카메라가 제일 좋아할 거야"', '"The way you smile behind the drums — cameras will love that most."'], bond: 10,
          reply: { e: 'joy', t: ['진짜요?! 저 카메라 앞에서 더 웃을 수 있어요!!', 'Really?! I can smile even harder for a camera!!'] } },
        { t: ['"계약금은 없어  대신 밥은 매일 사 줄게"', '"No signing fee. But I buy dinner every day."'], bond: 5,
          reply: { e: 'joy', t: ['밥이요?! 저 진짜 많이 먹는데 괜찮아요?!', 'Dinner?! I eat a LOT, is that okay?!'] } },
      ],
      join: { e: 'joy', t: ['저 할래요!! 언제부터요?! 지금요?!', "I'm in!! When do we start?! Now?!"] },
    },
    haru: {
      lines: [
        { p: 'std', n: ['하루는 맨 뒤에서 건반 뚜껑을 닫고 있었다  눈이 마주쳤다', 'Haru was in the back, closing the keyboard lid. Eyes met.'] },
        { e: 'sad', t: ['…죄송한데 저희를 왜 고르셨어요? 이유가 궁금해요', '...Sorry, but why us? I want to know the reason.'] },
      ],
      a: [
        { t: ['"네가 맨 뒤에서 세 명을 다 듣고 있더라  그게 필요해"', '"You were in the back listening to all three of them. I need that."'], bond: 10,
          reply: { e: 'joy', t: ['…그걸 보셨어요  아무도 안 보는데', '...You saw that. Nobody looks back there.'] } },
        { t: ['"이유는 없어  그냥 네 얼굴이 팔려"', '"No reason. Your face just sells."'], bond: -4, fee: -30,
          reply: { e: 'sad', t: ['…얼굴이요  네  알겠어요', '...My face. Right. Okay.'] } },
      ],
      join: { e: 'std', t: ['…같이 갈게요  이유는 제가 찾을게요', "...I'll come. I'll find the reason myself."] },
    },
  };

  /* 데뷔 뒤 한 줄 — 호감도 높으면(♥60↑) 위, 아니면 아래 */
  const EPILOGUE = {
    lion:   [['무대에서도 새벽처럼 불렀다  이제 혼자가 아니다', 'He sang on stage like he did at dawn. No longer alone.'], ['여전히 혼자 부를 때 가장 좋다', 'He still sings best alone.']],
    kairen: [['앞에서 끌고 뒤를 본다  넷이 한 박자다', 'He leads from the front and watches the back. Four, one beat.'], ['반 박자 앞에서 여전히 혼자다', 'Half a beat ahead, still alone.']],
    doyun:  [['맨 앞자리에 부모님이 있었다  도윤은 두 배로 췄다', 'His parents were in the front row. Doyun danced twice as hard.'], ['무릎은 아직 아프다  웃으며 춘다', 'The knee still hurts. He dances smiling.']],
    haru:   [['"얼굴만"은 이제 아무도 안 쓴다  브릿지는 하루의 것이다', 'Nobody writes "just a face" anymore. The bridge is Haru\'s.'], ['댓글은 안 본다  노래도 안 부른다', "He doesn't read comments. Doesn't sing either."]],
    jay:    [['후드 셋이 맨 앞줄에서 손을 올렸다  후드는 벗은 채로', 'Three hoodies raised a hand from the front row. Hoods off.'], ['가사는 빠졌고 크루는 안 왔다', 'The line got cut. The crew didn\'t come.']],
    yuan:   [['첫 소절은 유안의 목소리다  동생 몫이 아니라 제 몫으로', 'The first line is Yuan\'s voice. His share, not his brother\'s.'], ['여전히 도시락은 다섯 개다', 'He still packs five lunches.']],
    taeo:   [['아버지가 객석에 있었다  7년 만이다', 'His father was in the audience. First time in seven years.'], ['계약서는 주머니에 있다  아직 접힌 채로', 'The contract is in his pocket. Still folded.']],
    rowoon: [['안 웃는 로운도 좋아해 준다  5분씩', 'People like the not-smiling Rowoon too. Five minutes at a time.'], ['얼굴이 아프다  오늘도 웃는다', 'His face hurts. He smiles today too.']],
  };

  window.BBS = { LINES, EPISODES, EPILOGUE, PRODUCER, RECRUIT };
})();
