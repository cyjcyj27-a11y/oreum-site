// ─────────────────────────────────────────────────────────────
// 구글 애널리틱스 (GA4) — 나라·유입 경로·체류를 정확히 봅니다.
// 숫자는 analytics.google.com 에서 봅니다. 홈페이지 푸터의 방문자 수는
// 아래 Abacus 카운터가 그리므로, 둘은 각자 맡은 일이 다릅니다.
//
// 맨 위에 둡니다. 아래 코드에 무슨 일이 생겨도 이건 먼저 실행되도록.
// ─────────────────────────────────────────────────────────────
(function () {
 try {
  var GA_ID = 'G-SSBQ2WTHGG';
  // 내 컴퓨터에서 열어보는 건 지표에 안 넣습니다
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:') return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  (document.head || document.documentElement).appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  // ── 동의 모드 (Consent Mode v2) ──
  // 유럽은 동의를 받기 전에는 쿠키를 심을 수 없습니다. 이 신호를 아예 안 보내면
  // 구글이 유럽 방문자를 광고 대상에서 통째로 빼버립니다(2024년 3월 구글 정책).
  // 그래서 유럽만 "아직 동의 안 받음"으로, 나머지 나라는 "허용"으로 미리 알려둡니다.
  // 나라 판별은 구글이 접속 지역으로 알아서 합니다. 우리가 확인할 필요가 없습니다.
  //
  // 이렇게 두면 유럽 방문자도 쿠키 없이 계속 집계되고,
  // 나중에 광고를 달아 동의 팝업을 켜면 그때부터 광고 기능까지 살아납니다.
  // ※ config 보다 반드시 먼저 실행돼야 합니다.
  var EEA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE',
             'IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE',
             'GB','CH'];
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: EEA,
    wait_for_update: 500
  });
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
  });

  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
 } catch (e) {}   // 여기서 터져도 아래 방문 집계는 그대로 돌아가야 합니다
})();

// 방문 집계 — 쿠키 없이 Abacus 카운터만 씁니다. IP도 개인정보도 모으지 않습니다.
// 예전에는 이 코드가 홈에만 있어서, 홍보 링크를 타고 게임이나 커뮤니티로 바로 들어온 사람은
// 방문 수·유입 경로·국가에서 통째로 빠졌습니다. 이제 두 사이트의 모든 페이지에 함께 넣습니다.
// 같은 브라우저는 하루에 한 번만 세고(localStorage), 그 뒤로는 값만 읽어옵니다.
//
// oreumgames.com 과 play.oreumgames.com 은 브라우저가 서로 다른 곳으로 취급해서
// "하루 한 번" 표시를 나눠 갖습니다. 그래서 우리 사이트에서 넘어온 방문은 세지 않습니다.
// (이미 넘어오기 전 페이지에서 셌으니, 안 그러면 한 사람이 두 번 잡힙니다)
(function () {
  var base = 'https://abacus.jasoncameron.dev/';
  // 주의: "같은 도메인 안에서 넘어온 것"까지 빼면 안 됩니다.
  // 옛 주소(/board.html 등)는 새 주소로 넘겨주는데, 그때 넘어온 곳이 우리 주소로 찍힙니다.
  // 그걸 빼버리면 이미 홍보에 쓴 옛 링크로 들어온 사람이 통째로 사라집니다.
  // 같은 도메인 안에서는 아래 localStorage 표시가 이미 중복을 막아주므로,
  // 여기서는 "다른 쪽 도메인에서 넘어온 경우"만 뺍니다.
  var refHost = (function () { try { return new URL(document.referrer).hostname; } catch (e) { return ''; } })();
  var fromUs = /(^|\.)oreumgames\.com$/.test(refHost) && refHost !== location.hostname;

  // 저장소를 못 쓰면(시크릿 모드·저장소 차단) "하루 한 번"을 지킬 방법이 없습니다.
  // 그대로 세면 새로고침할 때마다 숫자가 부풀기 때문에, 이럴 땐 세지 않고 읽기만 합니다.
  var store = null;
  try {
    localStorage.setItem('oreum_probe', '1');
    localStorage.removeItem('oreum_probe');
    store = localStorage;
  } catch (e) { store = null; }

  // 한 번 실패하면 화면에 숫자가 아예 안 나옵니다. 통신은 가끔 실패하므로 몇 번 더 두드립니다.
  // 세는 요청(hit)은 중복으로 세면 안 되니 딱 한 번만 보내고, 읽기(get)만 다시 시도합니다.
  function get(u, tries) {
    tries = tries || 0;
    return fetch(u)
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () {
        var readOnly = u.indexOf('/get/') > -1;
        if (!readOnly || tries >= 3) return null;
        return new Promise(function (done) {
          setTimeout(function () { done(get(u, tries + 1)); }, 400 * (tries + 1));
        });
      });
  }
  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var today = ymd(new Date());
  // 내 컴퓨터에서 열어보는 건 방문 수에 넣지 않습니다 (숫자를 직접 부풀리지 않도록)
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';

  // 카운터 하나를 "오늘 한 번만" 세고 값을 받아옵니다.
  // 표시(flag)는 세는 데 성공했을 때만 남깁니다.
  //  - 미리 남기면: 세기 실패한 방문이 그날 영영 사라집니다 (과소 집계)
  //  - 두 카운터가 표시 하나를 같이 쓰면: 한쪽만 실패해도 다음 방문에 성공한 쪽이 또 +1 됩니다 (과대 집계)
  // 그래서 카운터마다 표시를 따로 둡니다.
  function countOnce(flag, key) {
    var done = store ? store.getItem(flag) === today : true;
    var skip = local || fromUs || done;
    var hitUrl = base + 'hit/oreumgames/' + key;
    var getUrl = base + 'get/oreumgames/' + key;
    if (skip) return get(getUrl);
    // 표시를 먼저 남기고 요청합니다.
    // 응답을 기다렸다 남기면, 답이 오기 전에 다른 페이지로 넘어간 사람이
    // 다음 페이지에서 또 세어집니다(한 사람이 페이지마다 한 번씩).
    if (store) { try { store.setItem(flag, today); } catch (e) {} }
    return get(hitUrl).then(function (v) {
      if (v) return v;
      // 못 셌으면 표시를 지워 다음 방문에 다시 시도합니다
      if (store) { try { store.removeItem(flag); } catch (e) {} }
      return get(getUrl);   // 세지는 못했지만 화면에 숫자는 보여줍니다
    });
  }

  // oreum_day 는 나중에 생긴 표시입니다. 오늘 이미 세어진 브라우저가 새 코드를 처음 받을 때
  // 표시가 없다는 이유로 하루치를 한 번 더 세지 않도록, 옛 표시를 물려받습니다.
  if (store) {
    try {
      if (store.getItem('oreum_counted') === today && !store.getItem('oreum_day')) {
        store.setItem('oreum_day', today);
      }
    } catch (e) {}
  }

  Promise.all([
    countOnce('oreum_counted', 'total'),
    countOnce('oreum_day', 'day_' + today)
  ]).then(function (res) {
    var total = res[0], todays = res[1];
    if (!total) return;
    // 방문자 수 표시는 홈 푸터에만 있습니다. 다른 페이지에는 없으니 그냥 넘어갑니다.
    var el = document.getElementById('visitCount');
    if (!el) return;
    var en = document.documentElement.lang === 'en';
    el.textContent = en
      ? (todays ? todays.value : 0) + ' visitors today · ' + total.value + ' in total'
      : '오늘 방문자수 ' + (todays ? todays.value : 0) + ' 전체 방문자수 ' + total.value;
    el.hidden = false;
  });

  // ── 지표 — 신규/재방문(⑤)과 유입 경로(②). 화면 표시는 없고 대시보드(stats.html)에서 봅니다. ──
  // 위와 같은 원칙입니다. 세는 데 성공한 뒤에 표시를 남깁니다.
  // (먼저 남기면 그날 그 지표를 영영 못 셉니다)
  function onceToday(flag, k) {
    if (!store || fromUs || local) return;   // 저장소가 없거나, 우리 사이트에서 넘어온 방문이면 세지 않습니다
    // 표시를 먼저 남기고 요청합니다 (위 countOnce 와 같은 이유).
    // 특히 나라는 접속 지역 조회를 먼저 하느라 몇 초가 걸려서,
    // 그 사이에 다른 페이지로 넘어가면 페이지마다 한 번씩 세어졌습니다.
    try { if (store.getItem(flag) === today) return; store.setItem(flag, today); } catch (e) { return; }
    get(base + 'hit/oreumgames/' + k).then(function (v) {
      if (v) return;
      try { store.removeItem(flag); } catch (e) {}   // 못 셌으면 다음에 다시 시도
    });
  }

  // ⑤ 재방문 — 처음 온 브라우저면 표시만 남기고, 다른 날 다시 온 거면 재방문으로 셉니다.
  // (신규 수는 대시보드에서 "전체 − 재방문"으로 계산합니다 — 그래야 기존 방문자도 신규로 잡힙니다)
  if (store) {
    var first = null;
    try { first = store.getItem('oreum_first'); } catch (e) {}
    if (!first) { try { store.setItem('oreum_first', today); } catch (e) {} }
    else if (first !== today) { onceToday('oreum_ret', 'returning'); }
  }

  // ② 유입 경로 — 어디서 눌러 들어왔나 (하루 1회)
  var r = (document.referrer || '').toLowerCase(), src;
  if (!r) src = 'direct';
  else if (/tiktok|musical\.ly/.test(r)) src = 'tiktok';
  else if (/instagram|(^|\/\/|\.)ig\./.test(r)) src = 'instagram';
  else if (/threads\.net|threads\.com/.test(r)) src = 'threads';
  // r 은 호스트가 아니라 주소 전체("https://x.com/…")입니다. 그래서 //x.com 형태도 잡아야 합니다.
  // 이게 빠져 있어서 X에서 온 사람이 전부 "기타"로 새고 있었습니다 (트윗 링크는 t.co 로 나갑니다)
  else if (/(^|\/\/|\.)x\.com|twitter|(^|\/\/|\.)t\.co/.test(r)) src = 'x';
  else if (/kakao|kko|daum/.test(r)) src = 'kakao';
  else if (/youtube|youtu\.be/.test(r)) src = 'youtube';
  else if (/facebook|fb\.com|fb\.me/.test(r)) src = 'facebook';
  else if (/google|naver|bing|search|yahoo|duckduckgo|zum/.test(r)) src = 'search';
  else if (r.indexOf('oreumgames.com') > -1) src = 'direct';
  else src = 'other';
  onceToday('oreum_src', 'src_' + src);

  // ── 국가별 — 실제 접속 지역을 봅니다. 하루 1회.
  //
  // 중요: 방문 수 집계(위)는 이미 끝난 뒤에 이걸 합니다.
  // 나라를 못 알아내도 방문 수는 절대 안 없어집니다. 나라만 "기타"로 갈 뿐입니다.
  //
  // 예전에는 브라우저 시간대로 나라를 추측했는데, 그러면 에콰도르가 미국으로 잡히고
  // 이집트·예멘 같은 나라는 아예 구분이 안 됐습니다. 이제 접속 지역을 직접 확인합니다.
  // (나라 글자 두 개만 받아옵니다. 주소나 개인정보는 저장하지 않습니다)

  // 대시보드에서 읽어올 수 있게, 아는 나라만 그대로 쓰고 나머지는 기타로 모읍니다.
  var KNOWN = ('KR US JP TW CN HK SG MY TH PH VN ID IN PK BD GB IE FR DE ES IT NL PL RO RU TR ' +
               'SE NO FI CZ HU GR PT UA CA AU NZ MX BR AR CL CO PE EC EG SA AE YE IQ IR MA ' +
               'DZ TN NG KE ZA').split(' ');

  // 목록에 없는 유럽 나라(덴마크·오스트리아·스위스 등)를 그냥 "기타"로 버리면
  // 유럽에서 온 사람이 어디에도 안 잡힙니다. 유럽이면 "기타 유럽"으로 모읍니다.
  var EU_ETC = ('AT BE BG CY CZ DK EE FI HR HU IE IS LI LT LU LV MT NL RS SI SK ' +
                'AL BA MD ME MK UA BY GE AM AZ').split(' ');
  function countCountry(code) {
    if (KNOWN.indexOf(code) === -1) code = (EU_ETC.indexOf(code) > -1) ? 'EU' : 'ETC';
    onceToday('oreum_cc', 'cc_' + code);
  }

  // 시간대로 알아내는 옛 방식 — 접속 지역 확인이 막혔을 때만 씁니다 (안 하는 것보단 낫습니다)
  var tz = ''; try { tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || ''; } catch (e) {}
  var tzMap = {
    'Asia/Seoul': 'KR', 'Asia/Pyongyang': 'KR', 'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN', 'Asia/Urumqi': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN',
    'Asia/Taipei': 'TW', 'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'HK',
    'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Kuching': 'MY',
    'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
    'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Pontianak': 'ID', 'Asia/Jayapura': 'ID',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
    'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD',
    'Africa/Cairo': 'EG', 'Asia/Aden': 'YE', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE',
    'Asia/Baghdad': 'IQ', 'Asia/Tehran': 'IR', 'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR',
    'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN',
    'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA',
    'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
    'Europe/Amsterdam': 'NL', 'Europe/Warsaw': 'PL', 'Europe/Bucharest': 'RO',
    'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
    'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Helsinki': 'FI',
    'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU', 'Europe/Athens': 'GR', 'Europe/Lisbon': 'PT',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
    'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
    'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX',
    'America/Sao_Paulo': 'BR', 'America/Bahia': 'BR', 'America/Fortaleza': 'BR',
    'America/Guayaquil': 'EC', 'America/Bogota': 'CO', 'America/Lima': 'PE',
    'America/Santiago': 'CL', 'America/Argentina/Buenos_Aires': 'AR'
  };
  // 미국 시간대 — 예전에는 "America/로 시작하면 전부 미국"이라 에콰도르·콜롬비아 같은
  // 중남미 방문자가 몽땅 미국으로 잡혔습니다. 이제 미국은 아래 목록으로만 셉니다.
  var US_TZ = /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Nome|Sitka|Yakutat|Adak|Menominee|Indiana\/|Kentucky\/|North_Dakota\/)|^Pacific\/(Honolulu|Midway|Guam|Pago_Pago)/;
  function guessByTimezone() {
    var cc = tzMap[tz];
    if (!cc) {
      if (US_TZ.test(tz)) cc = 'US';
      else if (tz.indexOf('Europe/') === 0) cc = 'EU';       // 나머지 유럽 묶음
      else cc = 'ETC';
    }
    return cc;
  }

  // 오늘 이미 셌으면 접속 지역을 물어볼 것도 없습니다 (쓸데없는 요청을 안 보냅니다)
  var ccDone = false;
  try { ccDone = !store || fromUs || store.getItem('oreum_cc') === today; } catch (e) { ccDone = true; }

  if (!ccDone && !local) {
    var settled = false;
    var settle = function (code) {
      if (settled) return;
      settled = true;
      countCountry(code);
    };
    // 어느 쪽이든 못 받으면 옛 방식(시간대)으로라도 반드시 셉니다
    var giveUp = setTimeout(function () { settle(guessByTimezone()); }, 2500);
    var done = function (code) { clearTimeout(giveUp); settle(code); };

    fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'cors' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(0); })
      .then(function (t) {
        var m = t.match(/loc=([A-Z]{2})/);
        if (!m) throw 0;
        done(m[1]);
      })
      .catch(function () {
        // 첫 번째가 막히면 다른 곳으로 한 번 더 (광고 차단기가 특정 주소만 막는 경우가 있습니다)
        return fetch('https://get.geojs.io/v1/ip/country.json', { mode: 'cors' })
          .then(function (r) { return r.ok ? r.json() : Promise.reject(0); })
          .then(function (j) {
            if (!j || !/^[A-Z]{2}$/.test(j.country)) throw 0;
            done(j.country);
          })
          .catch(function () { done(guessByTimezone()); });
      });
  } else if (!local) {
    countCountry(guessByTimezone());   // 이미 센 날이면 onceToday에서 바로 걸러집니다
  }
})();
