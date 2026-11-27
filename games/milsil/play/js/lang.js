// 밀실 영문판 — ?lang=en 이면 화면 글자를 영어로 덧씌운다(game-english-overlay 메모 방식).
// 화면(HTML) 글자는 손대지 않고 MutationObserver 가 텍스트 마디를 그때그때 바꾼다. 게임 코드는 MS_EN 만 본다.
(function () {
  var EN = /[?&]lang=en\b/.test(location.search);
  var ZH = !EN && /[?&]lang=zh\b/.test(location.search);
  window.MS_EN = EN;
  window.MS_ZH = ZH;
  if (!EN && !ZH) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.documentElement.classList.add('en');
    document.title = 'THE LOCKED ROOM';
  } else {
    document.documentElement.lang = 'zh-CN';
    document.documentElement.classList.add('zh');
    document.title = '密室';
    // Chinese glyphs: system CJK fonts added to the game font families, CJK range only
    var zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var zs = "local('Songti SC'),local('STSong'),local('SimSun'),local('Noto Serif SC'),local('Noto Serif CJK SC'),local('Source Han Serif SC'),";
    var zk = "local('Kaiti SC'),local('STKaiti'),local('KaiTi'),";
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var st = document.createElement('style');
    st.textContent = "@font-face{font-family:'Ria';src:" + zf + ";unicode-range:" + ur + "}" +
      "@font-face{font-family:'Dokdo';src:" + zf + ";unicode-range:" + ur + "}" +
      "@font-face{font-family:'ZhSerif';src:" + zs + zf + ";unicode-range:" + ur + "}" +
      "@font-face{font-family:'ZhKai';src:" + zk + zf + ";unicode-range:" + ur + "}" +
      "html[lang=zh-CN] *{word-break:normal!important}" +
      "html.zh .card p,html.zh .namecard,html.zh #endTxt,html.zh .photoback{font-family:ZhSerif,'Nanum Myeongjo',Batang,serif}" +
      "html.zh #title h1{font-family:ZhKai,Dokdo,Ria,sans-serif;font-weight:700;letter-spacing:.12em;font-size:min(32vh,22vw)!important;line-height:1.1}";
    document.head.appendChild(st);
  }

  var DZ = {
    // 소지품
    '작은 열쇠': '小钥匙', '성냥': '火柴', '흰 종이': '白纸', '태엽 열쇠': '发条钥匙', '문 열쇠': '门钥匙',
    '손전등': '手电筒', '태엽 손잡이': '发条摇柄', '수도 손잡이': '水龙头把手', '작은 은열쇠': '小银钥匙',
    '오븐 손잡이': '烤箱旋钮', '냉장고 열쇠': '冰箱钥匙', '초대장': '邀请函', '쇠 열쇠': '铁钥匙', '필름 통': '胶卷盒',
    '인화지': '相纸', '작은 황동 열쇠': '小黄铜钥匙', '식은 홍차': '凉掉的红茶', '드라이버': '螺丝刀',
    '쪽지': '纸条', '현상된 사진': '冲洗好的照片', '검은 장우산': '黑色长柄伞',
    '9월 24일 저녁 식사. 정순자는 부엌 쪽 끝. 한도현은 정순자 옆. 오병철은 창가 쪽 끝. 민재석은 남은 자리.':
      '9月24日 晚餐。郑顺子坐厨房那头。韩道焕坐郑顺子旁边。吴炳哲坐靠窗那头。闵在锡坐剩下的位子。',
    '10월 1일 점심 식사. 오병철은 부엌 쪽 끝. 민재석은 오병철 옆. 한도현은 창가 쪽 끝. 정순자는 남은 자리.':
      '10月1日 午餐。吴炳哲坐厨房那头。闵在锡坐吴炳哲旁边。韩道焕坐靠窗那头。郑顺子坐剩下的位子。',
    '식탁 위 촛불. 식탁 둘레 의자. 식탁 위 접시.': '桌上的蜡烛。桌边的椅子。桌上的盘子。',
    '이 문은 우산 주인의 머리글자로 열린다.': '这扇门要用伞主人的名字首字母打开。',
    '손잡이 안쪽에 무언가 새겨져 있다. 어두워서 읽을 수 없다.': '伞柄内侧好像刻着什么。太暗了，看不清。',
    // 단서
    '원고 조각': '手稿残页',
    '「밀실」 3장 — 그날 밤 서재 문을 두드린 사람은 왼손에 젖은 우산을 들고 있었다.':
      '《密室》第3章——那天夜里敲书房门的人，左手拿着一把湿伞。',
    '찢어진 사진': '撕破的照片', '이 서재의 문이다. 뒷면에 연필로 「9월 24일 밤」.': '是这间书房的门。背面用铅笔写着“9月24日夜”。',
    '편지': '信', '형님, 이번 원고만큼은 양보해 주십시오. 형님 이름이 아니어도 책은 팔립니다.':
      '哥，这次的稿子就让给我吧。就算不署你的名字，书也照样卖得出去。',
    '영수증': '收据', '우산 가게. 9월 24일 밤 9시 40분, 검은 장우산 1개.': '雨伞店。9月24日晚上9点40分，黑色长柄伞1把。',
    '형제 사진': '兄弟合照', '젊은 날의 두 형제. 둘 다 만년필을 쥐었는데, 동생은 왼손이다.':
      '年轻时的兄弟俩。两人都握着钢笔，弟弟用的是左手。',
    '일기장': '日记本', '11월 3일. 결혼기념일. 올해도 혼자다. 도현이가 또 원고 이야기를 꺼냈다.':
      '11月3日。结婚纪念日。今年又是一个人过。道焕又提起了稿子的事。',
    '타다 남은 주문서': '烧剩的订单', '…왼손잡이용 만년필 한 자루. 펜촉은 왼쪽으로 깎을 것. 주문자 한…':
      '……左手用钢笔一支。笔尖往左边磨。订购人 韩……',
    '생일 카드': '生日卡', '도현아, 생일 축하한다. 네 글씨는 여전히 나보다 낫구나. — 형':
      '道焕，生日快乐。你的字还是比我写得好。——哥',
    '만년필': '钢笔', '펜촉이 왼손잡이용으로 비스듬히 깎였다. 작가의 것이 아니다.': '笔尖为左手斜着磨过。不是作家的。',
    '9월 24일 밤, 서재 문 앞. 검은 장우산을 왼손에 든 남자의 뒷모습.': '9月24日夜，书房门前。一个左手拿着黑色长柄伞的男人的背影。',
    '장갑 한 짝': '一只手套', '왼손 장갑. 손가락에 형광 물감이 묻어 있다. 발자국과 같은 물감이다.':
      '左手手套。手指上沾着荧光颜料，和脚印上的是同一种。',
    '아직 젖어 있다. 손잡이 안쪽에 새긴 머리글자 ㅎ·ㄷ·ㅎ.': '还是湿的。伞柄内侧刻着首字母 H·D·H。',
    // 혼잣말
    '초가 다 녹아 있다.': '蜡烛已经烧完了。', '우산 하나가 아직 젖어 있다.': '有一把伞还是湿的。',
    '코트 주머니는 비어 있다.': '大衣口袋是空的。', '파이프가 아직 따뜻하다.': '烟斗还是温的。',
    '빈 원고지뿐이다.': '只有空白稿纸。', '식은 홍차.': '凉掉的红茶。', '안경집뿐이다.': '只有一个眼镜盒。',
    '보석함은 비어 있다.': '首饰盒是空的。', '가운 주머니는 비어 있다.': '睡袍口袋是空的。',
    '빈 병뿐이다.': '只有空瓶子。', '너무 어두워 잘 안 보인다.': '太暗了，看不清。',
    // 쪽지·메모
    '메모': '便条', '현상 → 정지 → 정착': '显影 → 停显 → 定影', '가운데 현상 · 왼쪽 정지 · 오른쪽 정착': '中间显影 · 左边停显 · 右边定影',
    '「밀실」 마지막 장': '《密室》最后一章', '범인은 끝까지 자기 손을 숨긴다. 그러나 비는 모든 것을 적신다.':
      '凶手到最后都藏着自己的手。可雨会打湿一切。',
    '원고': '手稿', '괘종이 여섯 번 울리고, 긴 바늘이 바닥을 가리킬 때 그는 서재를 나섰다.':
      '座钟敲了六下，长针指向地面时，他离开了书房。',
    '사진 뒷면': '照片背面', '1957. 5. 17. 도윤과 도현, 처음으로 원고를 끝낸 날.': '1957. 5. 17. 道允和道焕，第一次写完稿子的日子。',
    '등불에 비추자 손잡이 안쪽에 새긴 머리글자가 드러났다. ㅎ·ㄷ·ㅎ': '凑到灯下一照，伞柄内侧刻的首字母露了出来。H·D·H',
    // 용의자
    '민재석': '闵在锡', '정순자': '郑顺子', '오병철': '吴炳哲', '한도현': '韩道焕', '지목': '指认',
    // 엔딩
    '책장 뒤 좁은 방에 작가가 있었다.': '书架后的小房间里，找到了作家。',
    '범인은 작가의 동생, 한도현.': '凶手是作家的弟弟，韩道焕。',
    '형의 마지막 원고를 제 이름으로 내려고 형을 가뒀다.': '为了用自己的名字出版哥哥的最后一部稿子，他把哥哥关了起来。',
    '왼손잡이. 젖은 우산. 형보다 나은 글씨.': '左撇子。湿雨伞。比哥哥更好的字。',
    '비가 그쳤다.': '雨停了。',
    // 화면
    '밀실': '密室', '가로로 보기': '横屏查看'
  };

  var D = {
    // 소지품
    '작은 열쇠': 'Small key', '성냥': 'Matches', '흰 종이': 'Blank paper', '태엽 열쇠': 'Winding key', '문 열쇠': 'Door key',
    '손전등': 'Flashlight', '태엽 손잡이': 'Crank', '수도 손잡이': 'Tap handle', '작은 은열쇠': 'Small silver key',
    '오븐 손잡이': 'Oven knob', '냉장고 열쇠': 'Fridge key', '초대장': 'Invitation', '쇠 열쇠': 'Iron key', '필름 통': 'Film canister',
    '인화지': 'Photo paper', '작은 황동 열쇠': 'Small brass key', '식은 홍차': 'Cold tea', '드라이버': 'Screwdriver',
    '쪽지': 'Note', '현상된 사진': 'Developed photo', '검은 장우산': 'Black umbrella',
    '9월 24일 저녁 식사. 정순자는 부엌 쪽 끝. 한도현은 정순자 옆. 오병철은 창가 쪽 끝. 민재석은 남은 자리.':
      'Dinner, September 24. Jung Sunja at the kitchen end. Han Dohyun next to Jung Sunja. Oh Byungchul at the window end. Min Jaeseok takes the seat left over.',
    '10월 1일 점심 식사. 오병철은 부엌 쪽 끝. 민재석은 오병철 옆. 한도현은 창가 쪽 끝. 정순자는 남은 자리.':
      'Lunch, October 1. Oh Byungchul at the kitchen end. Min Jaeseok next to Oh Byungchul. Han Dohyun at the window end. Jung Sunja takes the seat left over.',
    '식탁 위 촛불. 식탁 둘레 의자. 식탁 위 접시.': 'Candles on the table. Chairs around the table. Plates on the table.',
    '이 문은 우산 주인의 머리글자로 열린다.': "This door opens with the umbrella owner's initials.",
    '손잡이 안쪽에 무언가 새겨져 있다. 어두워서 읽을 수 없다.': 'Something is carved inside the handle. Too dark to read.',
    // 단서
    '원고 조각': 'Manuscript scrap',
    '「밀실」 3장 — 그날 밤 서재 문을 두드린 사람은 왼손에 젖은 우산을 들고 있었다.':
      'The Locked Room, chapter 3 — The one who knocked on the study door that night held a wet umbrella in his left hand.',
    '찢어진 사진': 'Torn photo', '이 서재의 문이다. 뒷면에 연필로 「9월 24일 밤」.': 'The door of this study. On the back, in pencil: "Night of Sept 24."',
    '편지': 'Letter', '형님, 이번 원고만큼은 양보해 주십시오. 형님 이름이 아니어도 책은 팔립니다.':
      "Brother, let me have this one manuscript. The book will sell even without your name on it.",
    '영수증': 'Receipt', '우산 가게. 9월 24일 밤 9시 40분, 검은 장우산 1개.': 'Umbrella shop. Sept 24, 9:40 PM. One black umbrella.',
    '형제 사진': 'Photo of the brothers', '젊은 날의 두 형제. 둘 다 만년필을 쥐었는데, 동생은 왼손이다.':
      'The two brothers, young. Both hold fountain pens, but the younger one holds his in his left hand.',
    '일기장': 'Diary', '11월 3일. 결혼기념일. 올해도 혼자다. 도현이가 또 원고 이야기를 꺼냈다.':
      'November 3. Our wedding anniversary. Alone again this year. Dohyun brought up the manuscript again.',
    '타다 남은 주문서': 'Half-burnt order form', '…왼손잡이용 만년필 한 자루. 펜촉은 왼쪽으로 깎을 것. 주문자 한…':
      '...one fountain pen, nib ground for a left-handed writer. Ordered by Han...',
    '생일 카드': 'Birthday card', '도현아, 생일 축하한다. 네 글씨는 여전히 나보다 낫구나. — 형':
      'Happy birthday, Dohyun. Your handwriting is still better than mine. — Your brother',
    '만년필': 'Fountain pen', '펜촉이 왼손잡이용으로 비스듬히 깎였다. 작가의 것이 아니다.': "The nib is ground at a slant for a left hand. It is not the author's.",
    '9월 24일 밤, 서재 문 앞. 검은 장우산을 왼손에 든 남자의 뒷모습.': 'Night of Sept 24, outside the study door. A man from behind, a black umbrella in his left hand.',
    '장갑 한 짝': 'One glove', '왼손 장갑. 손가락에 형광 물감이 묻어 있다. 발자국과 같은 물감이다.':
      'A left-hand glove. Glowing paint on the fingers, the same paint as the footprints.',
    '아직 젖어 있다. 손잡이 안쪽에 새긴 머리글자 ㅎ·ㄷ·ㅎ.': 'Still wet. Initials carved inside the handle: H·D·H.',
    // 혼잣말
    '초가 다 녹아 있다.': 'The candle has burned all the way down.', '우산 하나가 아직 젖어 있다.': 'One umbrella is still wet.',
    '코트 주머니는 비어 있다.': 'The coat pockets are empty.', '파이프가 아직 따뜻하다.': 'The pipe is still warm.',
    '빈 원고지뿐이다.': 'Only blank manuscript paper.', '식은 홍차.': 'Cold tea.', '안경집뿐이다.': 'Just a glasses case.',
    '보석함은 비어 있다.': 'The jewelry box is empty.', '가운 주머니는 비어 있다.': 'The robe pockets are empty.',
    '빈 병뿐이다.': 'Only empty bottles.', '너무 어두워 잘 안 보인다.': 'Too dark to see much.',
    // 쪽지·메모
    '메모': 'Memo', '현상 → 정지 → 정착': 'Developer → Stop bath → Fixer', '가운데 현상 · 왼쪽 정지 · 오른쪽 정착': 'Middle: developer · Left: stop bath · Right: fixer',
    '「밀실」 마지막 장': 'The Locked Room, last page', '범인은 끝까지 자기 손을 숨긴다. 그러나 비는 모든 것을 적신다.':
      'The culprit hides his hand to the very end. But the rain soaks everything.',
    '원고': 'Manuscript', '괘종이 여섯 번 울리고, 긴 바늘이 바닥을 가리킬 때 그는 서재를 나섰다.':
      'The clock struck six times, and when the long hand pointed at the floor, he left the study.',
    '사진 뒷면': 'Back of the photo', '1957. 5. 17. 도윤과 도현, 처음으로 원고를 끝낸 날.': 'May 17, 1957. The day Doyun and Dohyun finished their first manuscript.',
    '등불에 비추자 손잡이 안쪽에 새긴 머리글자가 드러났다. ㅎ·ㄷ·ㅎ': 'Held to the lamp, the initials inside the handle appear: H·D·H',
    // 용의자
    '민재석': 'Min Jaeseok', '정순자': 'Jung Sunja', '오병철': 'Oh Byungchul', '한도현': 'Han Dohyun', '지목': 'ACCUSE',
    // 엔딩
    '책장 뒤 좁은 방에 작가가 있었다.': 'The author was in a narrow room behind the bookcase.',
    '범인은 작가의 동생, 한도현.': "The culprit: the author's younger brother, Han Dohyun.",
    '형의 마지막 원고를 제 이름으로 내려고 형을 가뒀다.': "He locked his brother away to publish his last manuscript under his own name.",
    '왼손잡이. 젖은 우산. 형보다 나은 글씨.': "Left-handed. A wet umbrella. Handwriting better than his brother's.",
    '비가 그쳤다.': 'The rain has stopped.',
    // 화면
    '밀실': 'THE LOCKED ROOM', '가로로 보기': 'Play in landscape'
  };
  if (ZH) D = DZ;
  window.MS_T = function (s) { return D[s] || s; };

  function tr(node) {
    var v = node.nodeValue;
    if (!v || !/[가-힣]/.test(v)) return;
    var k = v.trim();
    if (D[k]) node.nodeValue = v.replace(k, D[k]);
  }
  function walk(root) {
    if (root.nodeType === 3) { tr(root); return; }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) tr(n);
  }
  function boot() {
    walk(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') tr(m.target);
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
