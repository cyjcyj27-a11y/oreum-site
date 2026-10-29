// 모든 페이지가 열릴 때 assets/visit.js 가 부른다 → 누적 페이지뷰(pv_all) +1, 올라간 값을 돌려준다.
// 꼬리말 "N visits" 가 이 값을 쓴다. 예전엔 Abacus pvall + PV_BASE 였고, 시작값은 그 합으로 넣었다(2026-10-29).
// Abacus pvall 도 지표(stats.html)용으로 그대로 센다.
const ORIGIN = /^https:\/\/(www\.)?oreumgames\.com$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const ADD = "INSERT INTO counters (k, v) VALUES ('pv_all', 1) ON CONFLICT(k) DO UPDATE SET v = v + 1 RETURNING v";

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  if (origin && !ORIGIN.test(origin)) return new Response(null, { status: 403 });
  if (!env.DB) return new Response(null, { status: 204 });
  const row = await env.DB.prepare(ADD).first();
  return new Response(JSON.stringify({ value: row ? row.v : 0 }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
