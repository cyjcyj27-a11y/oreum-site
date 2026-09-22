# 게시판 글·댓글에 접속 IP 앞 두 자리 붙이기 (2026-09-23)

디시인사이드처럼 이름 옆에 `(121.165)` 꼴로 보입니다. **앞 두 자리만 저장**하고
전체 IP 는 어디에도 남기지 않습니다. 옛 글은 빈칸, 실행한 뒤 올라오는 글부터 붙습니다.

Supabase → **SQL Editor → New query** 에 아래를 통째로 붙여넣고 **Run**.

```sql
-- 1. 열 추가 (글·댓글)
alter table posts         add column if not exists ip_tag text;
alter table post_comments add column if not exists ip_tag text;

-- 2. 요청 헤더에서 접속 IP 를 읽어 앞 두 자리만 돌려주는 함수
--    IPv4  121.165.12.34  → 121.165
--    IPv6  2001:e60:...   → 2001:e60
create or replace function public.ip_tag_from_headers()
returns text language plpgsql stable set search_path = public as $$
declare h json; ip text;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    return null;
  end;
  if h is null then return null; end if;
  ip := coalesce(h->>'cf-connecting-ip', split_part(h->>'x-forwarded-for', ',', 1));
  ip := trim(coalesce(ip, ''));
  if ip = '' then return null; end if;
  if position(':' in ip) > 0 then
    return split_part(ip, ':', 1) || ':' || split_part(ip, ':', 2);
  end if;
  return split_part(ip, '.', 1) || '.' || split_part(ip, '.', 2);
end $$;

-- 3. 글쓰기 함수: ip_tag 도 같이 저장
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
  insert into posts (nick, body, image_path, pw_hash, ip_tag)
  values (nullif(trim(coalesce(p_nick, '')), ''), coalesce(p_body, ''), p_image,
          crypt(p_pw, gen_salt('bf')), ip_tag_from_headers())
  returning id into new_id;
  return new_id;
end $$;

-- 4. 댓글 함수: ip_tag 도 같이 저장
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
  insert into post_comments (post_id, nick, body, has_pw, pw_hash, ip_tag)
  values (p_post,
          nullif(trim(coalesce(p_nick, '')), ''),
          trim(p_body),
          p_pw is not null,
          case when p_pw is null then null else crypt(p_pw, gen_salt('bf')) end,
          ip_tag_from_headers())
  returning id into new_id;
  return new_id;
end $$;
```

실행한 뒤 확인: 게시판에서 글 하나 올리고 이름 옆에 `(숫자.숫자)` 가 붙으면 끝.
빈칸이면 헤더가 안 온 것이니 알려 주세요(Table Editor → posts → ip_tag 열 확인).
