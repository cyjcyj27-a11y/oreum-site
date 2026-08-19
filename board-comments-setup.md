# 게시판 댓글 — 저장소에 표 하나 추가하기

게시판 글마다 **댓글(200자)** 을 달 수 있게 하는 준비입니다.
화면 쪽은 이미 다 만들어져 있고, 아래 SQL만 한 번 돌리면 실제로 저장됩니다. **3분이면 끝납니다.**

표만 따로 만들어서 기존 글(`posts`)·미니게임 소감(`labs_comments`)과 섞이지 않게 합니다.

---

## 붙여넣기만 하면 됩니다

Supabase 접속 → 왼쪽 메뉴 **SQL Editor** → **New query** → 아래를 통째로 붙여넣고 **Run**

```sql
-- 비밀번호를 알아볼 수 없게 바꿔 저장하기 위한 준비 (이미 깔려 있으면 그냥 넘어갑니다)
create extension if not exists pgcrypto with schema extensions;

-- 댓글 표
create table if not exists post_comments (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  post_id     bigint not null references posts(id) on delete cascade,
  nick        text,
  body        text not null,
  has_pw      boolean not null default false,
  pw_hash     text,
  constraint  c_body_len check (char_length(body) between 1 and 200),
  constraint  c_nick_len check (nick is null or char_length(nick) <= 12)
);
-- 글 하나의 댓글을 시간순으로 빨리 찾기 위한 색인
create index if not exists post_comments_by_post
  on post_comments (post_id, created_at);

-- 아무나 읽을 수 있게, 그러나 표를 직접 고치지는 못하게 잠급니다
alter table post_comments enable row level security;
drop policy if exists "read all" on post_comments;
create policy "read all" on post_comments for select using (true);

-- 쓰기는 이 함수로만
create or replace function create_post_comment(p_post bigint, p_nick text, p_body text, p_pw text)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare new_id bigint;
begin
  if coalesce(trim(p_body), '') = '' then
    raise exception '댓글을 적어주세요';
  end if;
  if char_length(p_body) > 200 then
    raise exception '200자까지만 쓸 수 있습니다';
  end if;
  if p_pw is not null and p_pw !~ '^[0-9]{4}$' then
    raise exception '숫자 4자리로 넣어주세요';
  end if;
  if not exists (select 1 from posts where id = p_post) then
    raise exception '없는 글입니다';
  end if;
  insert into post_comments (post_id, nick, body, has_pw, pw_hash)
  values (p_post,
          nullif(trim(coalesce(p_nick, '')), ''),
          trim(p_body),
          p_pw is not null,
          case when p_pw is null then null else crypt(p_pw, gen_salt('bf')) end)
  returning id into new_id;
  return new_id;
end $$;

-- 지우기는 숫자 4자리가 맞을 때만
create or replace function delete_post_comment(p_id bigint, p_pw text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare hit boolean;
begin
  delete from post_comments
   where id = p_id and pw_hash is not null and pw_hash = crypt(p_pw, pw_hash)
  returning true into hit;
  return coalesce(hit, false);
end $$;

grant execute on function create_post_comment(bigint, text, text, text) to anon;
grant execute on function delete_post_comment(bigint, text) to anon;
```

끝입니다. 게시판을 새로고침하면 댓글이 저장되기 시작합니다.

---

## 알아두면 좋은 것

- **이 SQL을 돌리기 전에도 게시판은 멀쩡히 돌아갑니다.** 댓글 칸만 "댓글은 아직 준비 중이에요"
  라고 조용히 뜹니다. 급하지 않으면 나중에 하셔도 됩니다.
- **숫자 4자리는 안 넣어도 됩니다.** 넣은 사람만 나중에 자기 댓글을 지울 수 있습니다.
  글 남기는 문턱을 낮추려고 일부러 선택사항으로 두었습니다.
- **글을 지우면 그 글의 댓글도 같이 지워집니다** (`on delete cascade`).
- **광고 댓글 지우기**: Supabase **Table Editor → post_comments** 에서 줄을 골라 지우면 됩니다.
- 미니게임 소감(`labs_comments`)과는 **다른 표**입니다. 서로 영향 없습니다.
