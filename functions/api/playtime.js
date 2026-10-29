// 대문 꼬리말 "누적 플레이시간" 이 읽는다 → { minutes }. 1분씩 엣지에 담아 D1 읽기를 아낀다.
export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default, key = new Request(new URL('/api/playtime', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let minutes = 0;
  if (env.DB) {
    const row = await env.DB.prepare("SELECT v FROM counters WHERE k = 'play_min'").first();
    minutes = row ? row.v : 0;
  }
  const res = new Response(JSON.stringify({ minutes }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
  });
  waitUntil(cache.put(key, res.clone()));
  return res;
}
