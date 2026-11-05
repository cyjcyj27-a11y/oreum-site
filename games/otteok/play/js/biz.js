// 회사 키우기(4장부터): 공장 라인은 1초마다, 가맹 도시는 하루 끝마다 돈을 번다. 기업가치 1조면 나스닥.
(function () {
  const B = (window.BIZ = {});
  const D = DATA;
  const sv = () => G.save;
  // 나라(진출 나라 수 세기)
  const CC = { seoul: 'KR', busan: 'KR', incheon: 'KR', daegu: 'KR', daejeon: 'KR', gwangju: 'KR', jeju: 'KR', tokyo: 'JP', osaka: 'JP', shanghai: 'CN', hongkong: 'HK', bangkok: 'TH', singapore: 'SG',
    sydney: 'AU', dubai: 'AE', paris: 'FR', london: 'GB', saopaulo: 'BR', toronto: 'CA', la: 'US', newyork: 'US' };

  B.lines = () => sv().lines || (sv().lines = []); // 산 라인(떡 종류) 순서
  B.cities = () => sv().cities || (sv().cities = {});
  B.lineCost = () => D.FAC.base * Math.pow(D.FAC.grow, B.lines().length);
  B.lineRate = (k) => D.FAC.rate * Math.pow(D.FAC.rgrow, k);
  B.mul = () => D.FUP.reduce((m, u) => m * (G.gear(u.k) ? u.mul : 1), 1);
  // 원/초. all 이 아니면 고장 난 라인은 뺀다
  B.rate = (all) => B.lines().reduce((a, t, k) => a + (all || !(window.FACT && FACT.down(k)) ? B.lineRate(k) : 0), 0) * B.mul();
  B.roy = () => D.CITY.reduce((a, c) => a + (B.cities()[c.k] ? c.roy : 0), 0); // 원/하루
  B.stores = function () {
    const ch = sv().ch;
    return (ch < 3 ? 1 : ch < 4 ? 12 : 48) + D.CITY.reduce((a, c) => a + (B.cities()[c.k] ? c.stores : 0), 0);
  };
  B.countries = function () { const s = { KR: 1 }; D.CITY.forEach((c) => { if (B.cities()[c.k]) s[CC[c.k]] = 1; }); return Object.keys(s).length; };
  // 기업가치: 공장이 실제로 생산해 번 돈이 쌓일수록 오르고(고장 나면 덜 오른다), 낸 가맹점이 더해진다
  B.value = () => (sv().mna || 0) + (sv().made || 0) * D.FAC.valMade + D.CITY.reduce((a, c) => a + (B.cities()[c.k] ? c.stores : 0), 0) * D.FAC.valStore;
  B.on = () => sv().ch >= 4;
  // 다음에 놓을 레일의 떡: 아직 레일이 없는 떡부터, 다 있으면 차례로 하나 더(빈자리 8칸까지)
  B.MAX = 8;
  B.free = function () {
    if (B.lines().length >= B.MAX) return [];
    const ts = D.typesUpTo(sv().ch), t = ts.find((x) => B.lines().indexOf(x) < 0);
    return [t || ts[B.lines().length % ts.length]];
  };

  B.buyLine = function () {
    const t = B.free()[0], c = B.lineCost();
    if (!t || sv().coins < c) return null;
    sv().coins -= c; B.lines().push(t); G.store();
    return t;
  };
  B.buyCity = function (k) {
    const c = D.CITY.find((x) => x.k === k);
    if (!c || B.cities()[k] || c.ch > sv().ch || sv().coins < c.price) return false;
    sv().coins -= c.price; B.cities()[k] = 1; G.store();
    return true;
  };

  // 하루 도는 동안 공장 수입(G.flowStep 에서)
  let acc = 0, hudT = 0, saveT = 0;
  B.step = function (dt) {
    const r = B.rate();
    if (!r) return;
    acc += r * dt;
    if (acc >= 1) {
      const w = Math.floor(acc); acc -= w;
      const s = sv(); s.coins += w; s.total += w; s.made = (s.made || 0) + w; s.chSales = (s.chSales || 0) + w;
      if (G.flow.day) G.flow.day.factory = (G.flow.day.factory || 0) + w;
    }
    hudT += dt;
    if (hudT > 0.3) { hudT = 0; UI.coin(); UI.bizHud(); }
    saveT += dt; if (saveT > 10) { saveT = 0; G.store(); }
  };
  // 하루 끝 로열티
  B.payRoyalty = function () {
    const r = B.roy();
    if (!r) return 0;
    const s = sv(); s.coins += r; s.total += r; s.chSales = (s.chSales || 0) + r;
    return r;
  };
})();
