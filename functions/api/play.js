// 게임 화면을 보고 있는 1분마다 assets/game-events.js 가 부른다 (본문 = 게임 이름).
// Abacus 와 따로, 우리 D1 에 누적 플레이 시간(play_min)과 게임별 분(min_<게임>)을 센다 (2026-10-29).
// D1 이 안 붙어 있으면 조용히 넘어간다. 표(D1 oreum-counter, 바인딩 DB):
//   CREATE TABLE IF NOT EXISTS counters (k TEXT PRIMARY KEY, v INTEGER NOT NULL DEFAULT 0);
const ORIGIN = /^https:\/\/(www\.)?oreumgames\.com$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const ADD = "INSERT INTO counters (k, v) VALUES (?1, 1) ON CONFLICT(k) DO UPDATE SET v = v + 1";

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  if (origin && !ORIGIN.test(origin)) return new Response(null, { status: 403 });
  if (!env.DB) return new Response(null, { status: 204 });
  const g = (await request.text()).slice(0, 40).replace(/[^\w-]/g, '_') || 'home';
  await env.DB.batch([env.DB.prepare(ADD).bind('play_min'), env.DB.prepare(ADD).bind('min_' + g)]);
  return new Response(null, { status: 204 });
}
