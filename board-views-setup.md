# 게시판 글 조회수 (2026-10-14)

글 제목을 눌러 펼칠 때마다 그 글 숫자가 1 올라갑니다. 같은 사람이 여러 번 봐도 셉니다.
게시판 화면에는 안 띄웁니다. 숫자는 `post_views` 표에만 있고, 방문자(공개 키)는 이 표를 못 읽습니다.

## SQL (Supabase → SQL Editor → New query → 붙여넣고 Run)

```sql
-- 글마다 조회수 한 줄. 글을 지우면 같이 지워집니다
create table if not exists public.post_views (
  post_id     bigint primary key references public.posts(id) on delete cascade,
  views       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

-- 방문자는 이 표를 읽지도 고치지도 못하게 잠급니다
alter table public.post_views enable row level security;
revoke all on public.post_views from anon, authenticated;

-- 숫자 올리기는 이 함수로만
create or replace function public.bump_post_view(p_id bigint)
returns void language sql security definer set search_path = public as $$
  insert into post_views (post_id, views)
  select p_id, 1 where exists (select 1 from posts where id = p_id)
  on conflict (post_id) do update
    set views = post_views.views + 1, updated_at = now();
$$;
revoke all on function public.bump_post_view(bigint) from public;
grant execute on function public.bump_post_view(bigint) to anon;

-- 사장님이 대시보드에서 볼 표 (제목·글쓴이·조회수). 방문자는 못 읽습니다
create or replace view public.post_views_list as
  select p.id, p.created_at, coalesce(p.nick, '루루') as nick,
         split_part(p.body, chr(10), 1) as title,
         coalesce(v.views, 0) as views
  from public.posts p left join public.post_views v on v.post_id = p.id
  order by p.created_at desc;
revoke all on public.post_views_list from anon, authenticated;
```

## 보는 법

SQL Editor 에서 아래를 Run 하면 글마다 조회수가 나옵니다.

```sql
select * from post_views_list;
```

많이 본 순서로 보려면:

```sql
select * from post_views_list order by views desc;
```

## 순서

이 SQL 을 먼저 돌린 다음 사이트를 올립니다.
SQL 전에 사이트가 먼저 올라가도 게시판은 멀쩡합니다(숫자만 안 셈).
