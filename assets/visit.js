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
  var fromUs = /(^|\.)oreumgames\.com$/.test(
    (function () { try { return new URL(document.referrer).hostname; } catch (e) { return ''; } })()
  );

  // 저장소를 못 쓰면(시크릿 모드·저장소 차단) "하루 한 번"을 지킬 방법이 없습니다.
  // 그대로 세면 새로고침할 때마다 숫자가 부풀기 때문에, 이럴 땐 세지 않고 읽기만 합니다.
  var store = null;
  try {
    localStorage.setItem('oreum_probe', '1');
    localStorage.removeItem('oreum_probe');
    store = localStorage;
  } catch (e) { store = null; }

  function get(u) {
    return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var today = ymd(new Date());
  // 내 컴퓨터에서 열어보는 건 방문 수에 넣지 않습니다 (숫자를 직접 부풀리지 않도록)
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';
  var counted = local || fromUs || (store ? store.getItem('oreum_counted') === today : true);
  var act = counted ? 'get' : 'hit';

  Promise.all([
    get(base + act + '/oreumgames/total'),
    get(base + act + '/oreumgames/day_' + today)
  ]).then(function (res) {
    if (!counted && store) { try { store.setItem('oreum_counted', today); } catch (e) {} }

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
  function hit(k) { if (local) return; try { fetch(base + 'hit/oreumgames/' + k, { mode: 'cors' }).catch(function () {}); } catch (e) {} }
  function onceToday(flag, k) {
    if (!store || fromUs) return;      // 저장소가 없거나, 우리 사이트에서 넘어온 방문이면 세지 않습니다
    try { if (store.getItem(flag) === today) return; store.setItem(flag, today); } catch (e) { return; }
    hit(k);
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
  else if (/(^|\.)x\.com|twitter|(^|\.)t\.co/.test(r)) src = 'x';
  else if (/kakao|kko|daum/.test(r)) src = 'kakao';
  else if (/youtube|youtu\.be/.test(r)) src = 'youtube';
  else if (/facebook|fb\.com|fb\.me/.test(r)) src = 'facebook';
  else if (/google|naver|bing|search|yahoo|duckduckgo|zum/.test(r)) src = 'search';
  else if (r.indexOf('oreumgames.com') > -1) src = 'direct';
  else src = 'other';
  onceToday('oreum_src', 'src_' + src);

  // ── 국가별 (영문판 지원) — 방문자의 시간대로 나라를 추정합니다. IP 수집 없이 즉시, 하루 1회. ──
  var tz = ''; try { tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || ''; } catch (e) {}
  var tzMap = {
    'Asia/Seoul': 'KR', 'Asia/Pyongyang': 'KR', 'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN', 'Asia/Urumqi': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN',
    'Asia/Taipei': 'TW', 'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'HK',
    'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Kuching': 'MY',
    'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
    'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Pontianak': 'ID', 'Asia/Jayapura': 'ID',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
    'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Kathmandu': 'IN', 'Asia/Colombo': 'IN', 'Asia/Yangon': 'TH',
    // 중동 — 이집트·예멘·사우디 등에서 실제로 들어옵니다
    'Africa/Cairo': 'ME', 'Asia/Aden': 'ME', 'Asia/Riyadh': 'ME', 'Asia/Dubai': 'ME',
    'Asia/Kuwait': 'ME', 'Asia/Qatar': 'ME', 'Asia/Bahrain': 'ME', 'Asia/Muscat': 'ME',
    'Asia/Baghdad': 'ME', 'Asia/Tehran': 'ME', 'Asia/Amman': 'ME', 'Asia/Beirut': 'ME',
    'Asia/Damascus': 'ME', 'Asia/Jerusalem': 'ME', 'Europe/Istanbul': 'ME', 'Asia/Istanbul': 'ME',
    'Europe/London': 'GB', 'Europe/Dublin': 'GB', 'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
    'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
    'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX',
    'America/Sao_Paulo': 'BR', 'America/Bahia': 'BR', 'America/Fortaleza': 'BR'
  };
  // 미국 시간대 — 예전에는 "America/로 시작하면 전부 미국"이라 에콰도르·콜롬비아 같은
  // 중남미 방문자가 몽땅 미국으로 잡혔습니다. 이제 미국은 아래 목록으로만 셉니다.
  var US_TZ = /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Nome|Sitka|Yakutat|Adak|Menominee|Indiana\/|Kentucky\/|North_Dakota\/)|^Pacific\/(Honolulu|Midway|Guam|Pago_Pago)/;
  var cc = tzMap[tz];
  if (!cc) {
    if (US_TZ.test(tz)) cc = 'US';
    else if (tz.indexOf('America/') === 0) cc = 'LATAM';   // 나머지 미주는 중남미
    else if (tz.indexOf('Europe/') === 0) cc = 'EU';       // 나머지 유럽 묶음
    else if (tz.indexOf('Africa/') === 0) cc = 'AF';       // 아프리카 묶음
    else if (tz.indexOf('Australia/') === 0 || tz.indexOf('Pacific/') === 0) cc = 'AU';
    else cc = 'ETC';
  }
  onceToday('oreum_cc', 'cc_' + cc);
})();
