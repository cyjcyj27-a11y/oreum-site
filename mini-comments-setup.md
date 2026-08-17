# 소감 한마디 — 저장소 붙이는 법

`/games/mini/` 의 각 게임 카드 안에 있는 "플레이해본 소감 한마디" 창 이야기입니다.
화면은 다 만들어져 있습니다. 아래 SQL 한 번만 돌리면 실제로 저장됩니다. **2분이면 끝납니다.**

새로 가입할 것은 없습니다. 홈페이지 게시판이 이미 쓰고 있는 **같은 Supabase 계정**을 씁니다.
표(`labs_comments`)만 따로 만들어서 게시판 글과 섞이지 않게 합니다.

---

## 할 일 — SQL 한 번 돌리기

1. <https://supabase.com> 로그인 → 프로젝트 `oreum-board` 열기
2. 왼쪽 메뉴 **SQL Editor** → **New query**
3. 아래를 통째로 붙여넣고 **Run**

```sql
-- 비밀번호를 알아볼 수 없게 바꿔 저장하기 위한 준비 (이미 깔려 있으면 그냥 넘어갑니다)
create extension if not exists pgcrypto with schema extensions;

-- 소감 표
create table if not exists labs_comments (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  slug        text not null,              -- 어느 게임의 소감인지 (폴더 이름)
  nick        text,
  body        text not null,
  has_pw      boolean not null default false,
  pw_hash     text,
  constraint body_len check (char_length(body) between 1 and 200),
  constraint nick_len check (nick is null or char_length(nick) <= 12),
  constraint slug_len check (char_length(slug) between 1 and 60)
);
create index if not exists labs_comments_recent
  on labs_comments (slug, created_at desc);

-- 아무나 읽을 수 있게, 그러나 표를 직접 고치지는 못하게 잠급니다
alter table labs_comments enable row level security;
drop policy if exists "read all" on labs_comments;
create policy "read all" on labs_comments for select using (true);

-- 쓰기는 이 함수로만
create or replace function create_labs_comment(p_slug text, p_nick text, p_body text, p_pw text)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare new_id bigint;
begin
  if coalesce(trim(p_body), '') = '' then
    raise exception '한마디를 적어주세요';
  end if;
  if char_length(p_body) > 200 then
    raise exception '200자까지만 쓸 수 있습니다';
  end if;
  if p_pw is not null and p_pw !~ '^[0-9]{4}$' then
    raise exception '숫자 4자리로 넣어주세요';
  end if;
  insert into labs_comments (slug, nick, body, has_pw, pw_hash)
  values (p_slug,
          nullif(trim(coalesce(p_nick, '')), ''),
          trim(p_body),
          p_pw is not null,
          case when p_pw is null then null else crypt(p_pw, gen_salt('bf')) end)
  returning id into new_id;
  return new_id;
end $$;

-- 지우기는 숫자 4자리가 맞을 때만
create or replace function delete_labs_comment(p_id bigint, p_pw text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare hit boolean;
begin
  delete from labs_comments
   where id = p_id and pw_hash is not null and pw_hash = crypt(p_pw, pw_hash)
  returning true into hit;
  return coalesce(hit, false);
end $$;

grant execute on function create_labs_comment(text, text, text, text) to anon;
grant execute on function delete_labs_comment(bigint, text) to anon;
```

끝입니다. 페이지를 새로고침하면 소감이 저장되기 시작합니다.

---

## 알아두면 좋은 것

- **숫자 4자리는 안 넣어도 됩니다.** 넣은 사람만 나중에 자기 소감을 지울 수 있습니다.
  한마디 남기는 문턱을 낮추려고 일부러 선택사항으로 두었습니다.
- **광고 글 지우기**: Supabase **Table Editor → labs_comments** 에서 줄을 골라 지우면 됩니다.
- **어느 게임 소감인지**는 `slug` 칸으로 구분합니다. 값은 게임 폴더 이름과 같습니다 (예: `knife-duel-v7`).
- **개인정보처리방침**: 이용자가 남긴 글을 보관하게 되므로, 게시판과 같은 문구가 방침에 이미 있는지
  한 번 확인하는 것이 좋습니다.
