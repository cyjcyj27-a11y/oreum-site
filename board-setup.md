# 플레이 자랑 게시판 — 저장소 붙이는 법

게시판 화면(`board.html`)은 다 만들어져 있습니다.
아래 순서대로 하면 글과 사진이 실제로 저장됩니다. 10분이면 끝납니다.


> **댓글 기능**은 표를 하나 더 만들어야 합니다 → [board-comments-setup.md](board-comments-setup.md)
---

## 1. Supabase 가입 (직접 하셔야 하는 부분)

1. <https://supabase.com> 접속 → 오른쪽 위 **Start your project**
2. 깃허브 계정으로 로그인 (이미 쓰고 계신 그 계정)
3. **New project** 누르고
   - Name: `oreum-board` (아무거나 괜찮습니다)
   - Database Password: 아무거나 정하고 **어딘가 적어두세요**
   - Region: **Northeast Asia (Seoul)** ← 만든 뒤엔 못 바꿔요. 꼭 서울로 고르세요
4. 만들어지는 데 2분쯤 걸립니다

---

## 2. 표 만들기 (복사해서 붙여넣기만)

왼쪽 메뉴 **SQL Editor** → **New query** → 아래를 통째로 붙여넣고 **Run**

```sql
-- 비밀번호를 안전하게 저장하기 위한 준비
-- (Supabase는 이 도구를 extensions 라는 칸에 넣어두므로, 아래 함수들이 그 칸도 찾아보게 합니다)
create extension if not exists pgcrypto with schema extensions;

-- 글 표
create table if not exists posts (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nick        text,
  body        text not null default '',
  image_path  text,
  pw_hash     text not null,
  constraint  body_len check (char_length(body) <= 200),
  constraint  nick_len check (nick is null or char_length(nick) <= 12)
);
create index if not exists posts_recent on posts (created_at desc);

-- 아무나 읽을 수 있게, 그러나 표를 직접 고치지는 못하게 잠급니다
alter table posts enable row level security;
drop policy if exists "read all" on posts;
create policy "read all" on posts for select using (true);

-- 글쓰기는 이 함수로만 (비밀번호를 알아볼 수 없게 바꿔 저장합니다)
create or replace function create_post(p_nick text, p_body text, p_image text, p_pw text)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare new_id bigint;
begin
  if p_pw is null or p_pw !~ '^[0-9]{4}$' then
    raise exception '숫자 4자리가 필요합니다';
  end if;
  if char_length(coalesce(p_body, '')) > 200 then
    raise exception '200자까지만 쓸 수 있습니다';
  end if;
  if coalesce(p_body, '') = '' and p_image is null then
    raise exception '사진이나 글 중 하나는 있어야 합니다';
  end if;
  insert into posts (nick, body, image_path, pw_hash)
  values (nullif(trim(coalesce(p_nick, '')), ''), coalesce(p_body, ''), p_image,
          crypt(p_pw, gen_salt('bf')))
  returning id into new_id;
  return new_id;
end $$;

-- 지우기는 비밀번호가 맞을 때만
create or replace function delete_post(p_id bigint, p_pw text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare hit boolean;
begin
  delete from posts where id = p_id and pw_hash = crypt(p_pw, pw_hash)
  returning true into hit;
  return coalesce(hit, false);
end $$;

grant execute on function create_post(text, text, text, text) to anon;
grant execute on function delete_post(bigint, text) to anon;
```

---

## 3. 사진 보관함 만들기

1. 왼쪽 메뉴 **Storage** → **New bucket**
2. 이름 `board`, **Public bucket 켜기** → Save
3. 다시 **SQL Editor**에서 아래를 붙여넣고 Run

```sql
-- 사진은 아무나 올릴 수 있고, 아무나 볼 수 있게
drop policy if exists "board read" on storage.objects;
create policy "board read" on storage.objects
  for select using (bucket_id = 'board');

drop policy if exists "board write" on storage.objects;
create policy "board write" on storage.objects
  for insert with check (bucket_id = 'board');
```

---

## 4. 주소 두 줄 알려주기

왼쪽 맨 아래 톱니바퀴(⚙️) → **Settings** 에서 두 가지를 복사해서 알려주세요.

1. **General** 화면의 **Project URL** (`https://xxxxx.supabase.co` 모양)
2. **API Keys** 화면의 **Publishable key** (`sb_publishable_...` 로 시작)

두 값은 **공개되어도 안전한 값**입니다. 홈페이지 파일에 그대로 들어가고,
실제 권한은 위에서 만든 규칙이 지킵니다.

> ⚠️ 같은 화면 아래쪽의 **Secret keys** (`sb_secret_...`) 는 관리자 열쇠입니다.
> 홈페이지에 넣으면 누구든 자료를 통째로 지울 수 있으니 **절대 알려주지 마세요.**

이 두 줄을 받으면 제가 `board.html`에 넣고 올리겠습니다.

---

## 나중에 알아두면 좋은 것

- **광고 글 지우기**: Supabase의 **Table Editor → posts**에서 줄을 골라 지우면 됩니다.
- **무료 한도**: 사진 1GB, 한 달 전송 5GB. 사진은 올릴 때 자동으로 줄여 저장하므로
  한 장에 100~200KB 정도입니다. 수천 장까지 여유가 있습니다.
- **개인정보처리방침**: 게시판이 생기면 "이용자가 올린 사진과 글을 보관한다"는 내용을
  방침에 넣어야 합니다. 열기 전에 말씀해 주시면 함께 고쳐드리겠습니다.
