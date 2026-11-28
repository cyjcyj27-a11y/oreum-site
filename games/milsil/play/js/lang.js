// 밀실 영문판 — ?lang=en 이면 화면 글자를 영어로 덧씌운다(game-english-overlay 메모 방식).
// 화면(HTML) 글자는 손대지 않고 MutationObserver 가 텍스트 마디를 그때그때 바꾼다. 게임 코드는 MS_EN 만 본다.
(function () {
  var EN = /[?&]lang=en\b/.test(location.search);
  var ZH = !EN && /[?&]lang=zh\b/.test(location.search);
  var XM = !EN && !ZH && location.search.match(/[?&]lang=(ja|pt|ru)\b/);
  var XL = XM ? XM[1] : '';
  window.MS_EN = EN;
  window.MS_ZH = ZH;
  window.MS_LG = EN ? 'en' : ZH ? 'zh' : XL || 'ko';
  window.MS_WIDE = XL === 'pt' || XL === 'ru';   // pt/ru use the English layout
  if (!EN && !ZH && !XL) return;
  if (XL) {
    var jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    var jsf = "local('Hiragino Mincho ProN'),local('Yu Mincho'),local('YuMincho'),local('MS Mincho'),local('Noto Serif JP'),local('Noto Serif CJK JP'),local('Source Han Serif JP'),";
    var lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    var jr = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var lr = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    var xs = document.createElement('style');
    if (XL === 'ja') {
      document.documentElement.lang = 'ja';
      document.documentElement.classList.add('ja');
      document.title = '密室';
      xs.textContent = "@font-face{font-family:'Ria';src:" + jf + ";unicode-range:" + jr + "}" +
        "@font-face{font-family:'Dokdo';src:" + jf + ";unicode-range:" + jr + "}" +
        "@font-face{font-family:'JaSerif';src:" + jsf + jf + ";unicode-range:" + jr + "}" +
        "html[lang=ja] *{word-break:normal!important}" +
        "html.ja .card p,html.ja .namecard,html.ja #endTxt,html.ja .photoback{font-family:JaSerif,'Nanum Myeongjo',Batang,serif}" +
        "html.ja #title h1{font-family:JaSerif,Dokdo,Ria,sans-serif;font-weight:700;letter-spacing:.12em;font-size:min(32vh,22vw)!important;line-height:1.1}";
    } else {
      document.documentElement.lang = XL === 'pt' ? 'pt-BR' : 'ru';
      document.documentElement.classList.add('en', XL);
      document.title = XL === 'pt' ? 'O QUARTO TRANCADO' : 'ЗАПЕРТАЯ КОМНАТА';
      xs.textContent = "@font-face{font-family:'Ria';src:" + lf + ";unicode-range:" + lr + "}" +
        "@font-face{font-family:'Dokdo';src:" + lf + ";unicode-range:" + lr + "}";
    }
    document.head.appendChild(xs);
  } else if (EN) {
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

  var DJ = {
    '작은 열쇠': '小さな鍵', '성냥': 'マッチ', '흰 종이': '白い紙', '태엽 열쇠': 'ゼンマイの鍵', '문 열쇠': 'ドアの鍵',
    '손전등': '懐中電灯', '태엽 손잡이': 'ゼンマイのハンドル', '수도 손잡이': '蛇口のハンドル', '작은 은열쇠': '小さな銀の鍵',
    '오븐 손잡이': 'オーブンのつまみ', '냉장고 열쇠': '冷蔵庫の鍵', '초대장': '招待状', '쇠 열쇠': '鉄の鍵', '필름 통': 'フィルムケース',
    '인화지': '印画紙', '작은 황동 열쇠': '小さな真鍮の鍵', '식은 홍차': '冷めた紅茶', '드라이버': 'ドライバー',
    '쪽지': '紙切れ', '현상된 사진': '現像した写真', '검은 장우산': '黒い長傘',
    '9월 24일 저녁 식사. 정순자는 부엌 쪽 끝. 한도현은 정순자 옆. 오병철은 창가 쪽 끝. 민재석은 남은 자리.':
      '9月24日 夕食。チョン・スンジャは台所側の端。ハン・ドヒョンはチョン・スンジャの隣。オ・ビョンチョルは窓側の端。ミン・ジェソクは残りの席。',
    '10월 1일 점심 식사. 오병철은 부엌 쪽 끝. 민재석은 오병철 옆. 한도현은 창가 쪽 끝. 정순자는 남은 자리.':
      '10月1日 昼食。オ・ビョンチョルは台所側の端。ミン・ジェソクはオ・ビョンチョルの隣。ハン・ドヒョンは窓側の端。チョン・スンジャは残りの席。',
    '식탁 위 촛불. 식탁 둘레 의자. 식탁 위 접시.': 'テーブルの上のろうそく。テーブルを囲む椅子。テーブルの上の皿。',
    '이 문은 우산 주인의 머리글자로 열린다.': 'この扉は、傘の持ち主のイニシャルで開く。',
    '손잡이 안쪽에 무언가 새겨져 있다. 어두워서 읽을 수 없다.': '持ち手の内側に何か彫られている。暗くて読めない。',
    '원고 조각': '原稿の切れ端',
    '「밀실」 3장 — 그날 밤 서재 문을 두드린 사람은 왼손에 젖은 우산을 들고 있었다.':
      '『密室』第3章——その夜、書斎の扉を叩いた者は、左手に濡れた傘を持っていた。',
    '찢어진 사진': '破れた写真', '이 서재의 문이다. 뒷면에 연필로 「9월 24일 밤」.': 'この書斎の扉だ。裏に鉛筆で「9月24日 夜」。',
    '편지': '手紙', '형님, 이번 원고만큼은 양보해 주십시오. 형님 이름이 아니어도 책은 팔립니다.':
      '兄さん、今回の原稿だけは譲ってください。兄さんの名前でなくても、本は売れます。',
    '영수증': '領収書', '우산 가게. 9월 24일 밤 9시 40분, 검은 장우산 1개.': '傘屋。9月24日 夜9時40分、黒い長傘 1本。',
    '형제 사진': '兄弟の写真', '젊은 날의 두 형제. 둘 다 만년필을 쥐었는데, 동생은 왼손이다.':
      '若い頃の兄弟。二人とも万年筆を握っているが、弟は左手だ。',
    '일기장': '日記帳', '11월 3일. 결혼기념일. 올해도 혼자다. 도현이가 또 원고 이야기를 꺼냈다.':
      '11月3日。結婚記念日。今年もひとりだ。ドヒョンがまた原稿の話を持ち出した。',
    '타다 남은 주문서': '燃え残った注文書', '…왼손잡이용 만년필 한 자루. 펜촉은 왼쪽으로 깎을 것. 주문자 한…':
      '……左利き用の万年筆を一本。ペン先は左向きに研ぐこと。注文者 ハン……',
    '생일 카드': '誕生日カード', '도현아, 생일 축하한다. 네 글씨는 여전히 나보다 낫구나. — 형':
      'ドヒョン、誕生日おめでとう。お前の字は相変わらず俺よりうまいな。——兄',
    '만년필': '万年筆', '펜촉이 왼손잡이용으로 비스듬히 깎였다. 작가의 것이 아니다.': 'ペン先が左利き用に斜めに研がれている。作家のものではない。',
    '9월 24일 밤, 서재 문 앞. 검은 장우산을 왼손에 든 남자의 뒷모습.': '9月24日の夜、書斎の扉の前。黒い長傘を左手に持った男の後ろ姿。',
    '장갑 한 짝': '片方の手袋', '왼손 장갑. 손가락에 형광 물감이 묻어 있다. 발자국과 같은 물감이다.':
      '左手の手袋。指に蛍光塗料がついている。足跡と同じ塗料だ。',
    '아직 젖어 있다. 손잡이 안쪽에 새긴 머리글자 ㅎ·ㄷ·ㅎ.': 'まだ濡れている。持ち手の内側に彫られたイニシャル H·D·H。',
    '초가 다 녹아 있다.': 'ろうそくが燃え尽きている。', '우산 하나가 아직 젖어 있다.': '傘が一本、まだ濡れている。',
    '코트 주머니는 비어 있다.': 'コートのポケットは空だ。', '파이프가 아직 따뜻하다.': 'パイプがまだ温かい。',
    '빈 원고지뿐이다.': '白紙の原稿用紙だけだ。', '식은 홍차.': '冷めた紅茶。', '안경집뿐이다.': '眼鏡ケースだけだ。',
    '보석함은 비어 있다.': '宝石箱は空だ。', '가운 주머니는 비어 있다.': 'ガウンのポケットは空だ。',
    '빈 병뿐이다.': '空き瓶ばかりだ。', '너무 어두워 잘 안 보인다.': '暗すぎてよく見えない。',
    '메모': 'メモ', '현상 → 정지 → 정착': '現像 → 停止 → 定着', '가운데 현상 · 왼쪽 정지 · 오른쪽 정착': '真ん中 現像 · 左 停止 · 右 定着',
    '「밀실」 마지막 장': '『密室』最終章', '범인은 끝까지 자기 손을 숨긴다. 그러나 비는 모든 것을 적신다.':
      '犯人は最後まで自分の手を隠す。だが、雨はすべてを濡らす。',
    '원고': '原稿', '괘종이 여섯 번 울리고, 긴 바늘이 바닥을 가리킬 때 그는 서재를 나섰다.':
      '柱時計が六回鳴り、長針が床を指したとき、彼は書斎を出た。',
    '사진 뒷면': '写真の裏', '1957. 5. 17. 도윤과 도현, 처음으로 원고를 끝낸 날.': '1957. 5. 17. ドユンとドヒョン、初めて原稿を書き上げた日。',
    '등불에 비추자 손잡이 안쪽에 새긴 머리글자가 드러났다. ㅎ·ㄷ·ㅎ': '灯りにかざすと、持ち手の内側に彫られたイニシャルが浮かび上がった。H·D·H',
    '민재석': 'ミン・ジェソク', '정순자': 'チョン・スンジャ', '오병철': 'オ・ビョンチョル', '한도현': 'ハン・ドヒョン', '지목': '指名',
    '책장 뒤 좁은 방에 작가가 있었다.': '本棚の裏の狭い部屋に、作家がいた。',
    '범인은 작가의 동생, 한도현.': '犯人は作家の弟、ハン・ドヒョン。',
    '형의 마지막 원고를 제 이름으로 내려고 형을 가뒀다.': '兄の最後の原稿を自分の名前で出すために、兄を閉じ込めたのだ。',
    '왼손잡이. 젖은 우산. 형보다 나은 글씨.': '左利き。濡れた傘。兄よりうまい字。',
    '비가 그쳤다.': '雨が止んだ。',
    '밀실': '密室', '가로로 보기': '横向きでプレイ'
  };

  var DP = {
    '작은 열쇠': 'Chave pequena', '성냥': 'Fósforos', '흰 종이': 'Papel em branco', '태엽 열쇠': 'Chave de corda', '문 열쇠': 'Chave da porta',
    '손전등': 'Lanterna', '태엽 손잡이': 'Manivela', '수도 손잡이': 'Registro da torneira', '작은 은열쇠': 'Chavinha de prata',
    '오븐 손잡이': 'Botão do forno', '냉장고 열쇠': 'Chave da geladeira', '초대장': 'Convite', '쇠 열쇠': 'Chave de ferro', '필름 통': 'Pote de filme',
    '인화지': 'Papel fotográfico', '작은 황동 열쇠': 'Chavinha de latão', '식은 홍차': 'Chá frio', '드라이버': 'Chave de fenda',
    '쪽지': 'Bilhete', '현상된 사진': 'Foto revelada', '검은 장우산': 'Guarda-chuva preto',
    '9월 24일 저녁 식사. 정순자는 부엌 쪽 끝. 한도현은 정순자 옆. 오병철은 창가 쪽 끝. 민재석은 남은 자리.':
      'Jantar de 24 de setembro. Jung Sunja na ponta da cozinha. Han Dohyun ao lado de Jung Sunja. Oh Byungchul na ponta da janela. Min Jaeseok fica no lugar que sobrou.',
    '10월 1일 점심 식사. 오병철은 부엌 쪽 끝. 민재석은 오병철 옆. 한도현은 창가 쪽 끝. 정순자는 남은 자리.':
      'Almoço de 1º de outubro. Oh Byungchul na ponta da cozinha. Min Jaeseok ao lado de Oh Byungchul. Han Dohyun na ponta da janela. Jung Sunja fica no lugar que sobrou.',
    '식탁 위 촛불. 식탁 둘레 의자. 식탁 위 접시.': 'Velas sobre a mesa. Cadeiras em volta da mesa. Pratos sobre a mesa.',
    '이 문은 우산 주인의 머리글자로 열린다.': 'Esta porta abre com as iniciais do dono do guarda-chuva.',
    '손잡이 안쪽에 무언가 새겨져 있다. 어두워서 읽을 수 없다.': 'Tem algo gravado dentro do cabo. Está escuro demais para ler.',
    '원고 조각': 'Pedaço de manuscrito',
    '「밀실」 3장 — 그날 밤 서재 문을 두드린 사람은 왼손에 젖은 우산을 들고 있었다.':
      'O Quarto Trancado, capítulo 3 — Quem bateu à porta do escritório naquela noite segurava um guarda-chuva molhado na mão esquerda.',
    '찢어진 사진': 'Foto rasgada', '이 서재의 문이다. 뒷면에 연필로 「9월 24일 밤」.': 'É a porta deste escritório. No verso, a lápis: "Noite de 24 de setembro".',
    '편지': 'Carta', '형님, 이번 원고만큼은 양보해 주십시오. 형님 이름이 아니어도 책은 팔립니다.':
      'Irmão, me deixe ficar com este manuscrito. O livro vende mesmo sem o seu nome.',
    '영수증': 'Recibo', '우산 가게. 9월 24일 밤 9시 40분, 검은 장우산 1개.': 'Loja de guarda-chuvas. 24 de setembro, 9h40 da noite. 1 guarda-chuva preto.',
    '형제 사진': 'Foto dos irmãos', '젊은 날의 두 형제. 둘 다 만년필을 쥐었는데, 동생은 왼손이다.':
      'Os dois irmãos quando jovens. Os dois seguram canetas-tinteiro, mas o mais novo usa a mão esquerda.',
    '일기장': 'Diário', '11월 3일. 결혼기념일. 올해도 혼자다. 도현이가 또 원고 이야기를 꺼냈다.':
      '3 de novembro. Aniversário de casamento. Mais um ano sem companhia. Dohyun voltou a falar do manuscrito.',
    '타다 남은 주문서': 'Pedido meio queimado', '…왼손잡이용 만년필 한 자루. 펜촉은 왼쪽으로 깎을 것. 주문자 한…':
      '...uma caneta-tinteiro para canhoto. Afiar a pena para a esquerda. Pedido de Han...',
    '생일 카드': 'Cartão de aniversário', '도현아, 생일 축하한다. 네 글씨는 여전히 나보다 낫구나. — 형':
      'Feliz aniversário, Dohyun. Sua letra continua melhor que a minha. — Seu irmão',
    '만년필': 'Caneta-tinteiro', '펜촉이 왼손잡이용으로 비스듬히 깎였다. 작가의 것이 아니다.': 'A pena foi afiada inclinada, para canhoto. Não é do escritor.',
    '9월 24일 밤, 서재 문 앞. 검은 장우산을 왼손에 든 남자의 뒷모습.': 'Noite de 24 de setembro, na porta do escritório. Um homem de costas, com um guarda-chuva preto na mão esquerda.',
    '장갑 한 짝': 'Uma luva', '왼손 장갑. 손가락에 형광 물감이 묻어 있다. 발자국과 같은 물감이다.':
      'Luva da mão esquerda. Tem tinta fluorescente nos dedos, a mesma tinta das pegadas.',
    '아직 젖어 있다. 손잡이 안쪽에 새긴 머리글자 ㅎ·ㄷ·ㅎ.': 'Ainda está molhado. Iniciais gravadas dentro do cabo: H·D·H.',
    '초가 다 녹아 있다.': 'A vela queimou até o fim.', '우산 하나가 아직 젖어 있다.': 'Um dos guarda-chuvas ainda está molhado.',
    '코트 주머니는 비어 있다.': 'Os bolsos do casaco estão vazios.', '파이프가 아직 따뜻하다.': 'O cachimbo ainda está quente.',
    '빈 원고지뿐이다.': 'Só papel de manuscrito em branco.', '식은 홍차.': 'Chá frio.', '안경집뿐이다.': 'Só um estojo de óculos.',
    '보석함은 비어 있다.': 'A caixa de joias está vazia.', '가운 주머니는 비어 있다.': 'Os bolsos do roupão estão vazios.',
    '빈 병뿐이다.': 'Só garrafas vazias.', '너무 어두워 잘 안 보인다.': 'Está escuro demais para enxergar.',
    '메모': 'Anotação', '현상 → 정지 → 정착': 'Revelador → Interruptor → Fixador', '가운데 현상 · 왼쪽 정지 · 오른쪽 정착': 'Meio: revelador · Esquerda: interruptor · Direita: fixador',
    '「밀실」 마지막 장': 'O Quarto Trancado, último capítulo', '범인은 끝까지 자기 손을 숨긴다. 그러나 비는 모든 것을 적신다.':
      'O culpado esconde a própria mão até o fim. Mas a chuva molha tudo.',
    '원고': 'Manuscrito', '괘종이 여섯 번 울리고, 긴 바늘이 바닥을 가리킬 때 그는 서재를 나섰다.':
      'O relógio bateu seis vezes e, quando o ponteiro grande apontou para o chão, ele saiu do escritório.',
    '사진 뒷면': 'Verso da foto', '1957. 5. 17. 도윤과 도현, 처음으로 원고를 끝낸 날.': '1957. 5. 17. Doyun e Dohyun, o dia em que terminaram o primeiro manuscrito.',
    '등불에 비추자 손잡이 안쪽에 새긴 머리글자가 드러났다. ㅎ·ㄷ·ㅎ': 'Contra a luz da lamparina, aparecem as iniciais gravadas dentro do cabo: H·D·H',
    '민재석': 'Min Jaeseok', '정순자': 'Jung Sunja', '오병철': 'Oh Byungchul', '한도현': 'Han Dohyun', '지목': 'ACUSAR',
    '책장 뒤 좁은 방에 작가가 있었다.': 'O escritor estava num quartinho atrás da estante.',
    '범인은 작가의 동생, 한도현.': 'O culpado: o irmão mais novo do escritor, Han Dohyun.',
    '형의 마지막 원고를 제 이름으로 내려고 형을 가뒀다.': 'Ele trancou o irmão para publicar o último manuscrito dele com o próprio nome.',
    '왼손잡이. 젖은 우산. 형보다 나은 글씨.': 'Canhoto. Guarda-chuva molhado. Letra melhor que a do irmão.',
    '비가 그쳤다.': 'A chuva parou.',
    '밀실': 'O QUARTO TRANCADO', '가로로 보기': 'Jogue na horizontal'
  };

  var DR = {
    '작은 열쇠': 'Маленький ключ', '성냥': 'Спички', '흰 종이': 'Чистый лист', '태엽 열쇠': 'Заводной ключ', '문 열쇠': 'Ключ от двери',
    '손전등': 'Фонарик', '태엽 손잡이': 'Заводная ручка', '수도 손잡이': 'Ручка крана', '작은 은열쇠': 'Серебряный ключик',
    '오븐 손잡이': 'Ручка духовки', '냉장고 열쇠': 'Ключ от холодильника', '초대장': 'Приглашение', '쇠 열쇠': 'Железный ключ', '필름 통': 'Кассета с плёнкой',
    '인화지': 'Фотобумага', '작은 황동 열쇠': 'Латунный ключик', '식은 홍차': 'Остывший чай', '드라이버': 'Отвёртка',
    '쪽지': 'Записка', '현상된 사진': 'Проявленное фото', '검은 장우산': 'Чёрный зонт',
    '9월 24일 저녁 식사. 정순자는 부엌 쪽 끝. 한도현은 정순자 옆. 오병철은 창가 쪽 끝. 민재석은 남은 자리.':
      'Ужин 24 сентября. Чон Сунджа — с краю у кухни. Хан Дохён — рядом с Чон Сунджа. О Бёнчхоль — с краю у окна. Мин Джэсок — на оставшемся месте.',
    '10월 1일 점심 식사. 오병철은 부엌 쪽 끝. 민재석은 오병철 옆. 한도현은 창가 쪽 끝. 정순자는 남은 자리.':
      'Обед 1 октября. О Бёнчхоль — с краю у кухни. Мин Джэсок — рядом с О Бёнчхолем. Хан Дохён — с краю у окна. Чон Сунджа — на оставшемся месте.',
    '식탁 위 촛불. 식탁 둘레 의자. 식탁 위 접시.': 'Свечи на столе. Стулья вокруг стола. Тарелки на столе.',
    '이 문은 우산 주인의 머리글자로 열린다.': 'Эта дверь открывается инициалами хозяина зонта.',
    '손잡이 안쪽에 무언가 새겨져 있다. 어두워서 읽을 수 없다.': 'Внутри ручки что-то вырезано. Слишком темно, не прочесть.',
    '원고 조각': 'Обрывок рукописи',
    '「밀실」 3장 — 그날 밤 서재 문을 두드린 사람은 왼손에 젖은 우산을 들고 있었다.':
      '«Запертая комната», глава 3 — Тот, кто постучал в дверь кабинета той ночью, держал мокрый зонт в левой руке.',
    '찢어진 사진': 'Порванное фото', '이 서재의 문이다. 뒷면에 연필로 「9월 24일 밤」.': 'Это дверь этого кабинета. На обороте карандашом: «Ночь 24 сентября».',
    '편지': 'Письмо', '형님, 이번 원고만큼은 양보해 주십시오. 형님 이름이 아니어도 책은 팔립니다.':
      'Брат, уступи мне хотя бы эту рукопись. Книга продастся и без твоего имени.',
    '영수증': 'Чек', '우산 가게. 9월 24일 밤 9시 40분, 검은 장우산 1개.': 'Магазин зонтов. 24 сентября, 9:40 вечера. Чёрный зонт, 1 шт.',
    '형제 사진': 'Фото братьев', '젊은 날의 두 형제. 둘 다 만년필을 쥐었는데, 동생은 왼손이다.':
      'Два брата в молодости. Оба держат перьевые ручки, но младший — в левой руке.',
    '일기장': 'Дневник', '11월 3일. 결혼기념일. 올해도 혼자다. 도현이가 또 원고 이야기를 꺼냈다.':
      '3 ноября. Годовщина свадьбы. И в этом году — в одиночестве. Дохён опять заговорил о рукописи.',
    '타다 남은 주문서': 'Обгоревший бланк заказа', '…왼손잡이용 만년필 한 자루. 펜촉은 왼쪽으로 깎을 것. 주문자 한…':
      '…одна перьевая ручка для левши. Перо заточить влево. Заказчик: Хан…',
    '생일 카드': 'Открытка ко дню рождения', '도현아, 생일 축하한다. 네 글씨는 여전히 나보다 낫구나. — 형':
      'Дохён, с днём рождения. Твой почерк всё ещё лучше моего. — Брат',
    '만년필': 'Перьевая ручка', '펜촉이 왼손잡이용으로 비스듬히 깎였다. 작가의 것이 아니다.': 'Перо заточено наискосок, под левую руку. Это ручка не писателя.',
    '9월 24일 밤, 서재 문 앞. 검은 장우산을 왼손에 든 남자의 뒷모습.': 'Ночь 24 сентября, у двери кабинета. Мужчина со спины, чёрный зонт в левой руке.',
    '장갑 한 짝': 'Одна перчатка', '왼손 장갑. 손가락에 형광 물감이 묻어 있다. 발자국과 같은 물감이다.':
      'Левая перчатка. На пальцах флуоресцентная краска — та же, что на следах.',
    '아직 젖어 있다. 손잡이 안쪽에 새긴 머리글자 ㅎ·ㄷ·ㅎ.': 'Ещё мокрый. Внутри ручки вырезаны инициалы: Х·Д·Х.',
    '초가 다 녹아 있다.': 'Свеча догорела до конца.', '우산 하나가 아직 젖어 있다.': 'Один зонт ещё мокрый.',
    '코트 주머니는 비어 있다.': 'Карманы пальто пусты.', '파이프가 아직 따뜻하다.': 'Трубка ещё тёплая.',
    '빈 원고지뿐이다.': 'Только чистые листы для рукописи.', '식은 홍차.': 'Остывший чай.', '안경집뿐이다.': 'Только футляр для очков.',
    '보석함은 비어 있다.': 'Шкатулка пуста.', '가운 주머니는 비어 있다.': 'Карманы халата пусты.',
    '빈 병뿐이다.': 'Только пустые бутылки.', '너무 어두워 잘 안 보인다.': 'Слишком темно, почти ничего не видно.',
    '메모': 'Заметка', '현상 → 정지 → 정착': 'Проявитель → Стоп-ванна → Фиксаж', '가운데 현상 · 왼쪽 정지 · 오른쪽 정착': 'В центре — проявитель · слева — стоп-ванна · справа — фиксаж',
    '「밀실」 마지막 장': '«Запертая комната», последняя глава', '범인은 끝까지 자기 손을 숨긴다. 그러나 비는 모든 것을 적신다.':
      'Преступник до конца прячет свою руку. Но дождь промочит всё.',
    '원고': 'Рукопись', '괘종이 여섯 번 울리고, 긴 바늘이 바닥을 가리킬 때 그는 서재를 나섰다.':
      'Часы пробили шесть раз, и когда длинная стрелка указала в пол, он вышел из кабинета.',
    '사진 뒷면': 'Оборот фото', '1957. 5. 17. 도윤과 도현, 처음으로 원고를 끝낸 날.': '1957. 5. 17. Доюн и Дохён — день, когда они впервые закончили рукопись.',
    '등불에 비추자 손잡이 안쪽에 새긴 머리글자가 드러났다. ㅎ·ㄷ·ㅎ': 'В свете лампы внутри ручки проступили вырезанные инициалы: Х·Д·Х',
    '민재석': 'Мин Джэсок', '정순자': 'Чон Сунджа', '오병철': 'О Бёнчхоль', '한도현': 'Хан Дохён', '지목': 'ОБВИНИТЬ',
    '책장 뒤 좁은 방에 작가가 있었다.': 'Писатель был в тесной комнатке за книжным шкафом.',
    '범인은 작가의 동생, 한도현.': 'Преступник — младший брат писателя, Хан Дохён.',
    '형의 마지막 원고를 제 이름으로 내려고 형을 가뒀다.': 'Он запер брата, чтобы издать его последнюю рукопись под своим именем.',
    '왼손잡이. 젖은 우산. 형보다 나은 글씨.': 'Левша. Мокрый зонт. Почерк лучше, чем у брата.',
    '비가 그쳤다.': 'Дождь закончился.',
    '밀실': 'ЗАПЕРТАЯ КОМНАТА', '가로로 보기': 'Поверните экран'
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
  else if (XL === 'ja') D = DJ;
  else if (XL === 'pt') D = DP;
  else if (XL === 'ru') D = DR;
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
