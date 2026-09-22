# 게시판 비밀번호를 숫자 4자리에서 "아무 글자 2~8자"로 (2026-09-23)

사장님 "글자도 쳐지게, 두 글자만 입력해도 되게". 저장소 함수의 숫자 4자리 검사를 푼다.
Supabase → SQL Editor → New query 에 붙여넣고 Run.

```sql
create or replace function create_post(p_nick text, p_body text, p_image text, p_pw text)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare new_id bigint;
begin
  if p_pw is null or char_length(p_pw) < 2 or char_length(p_pw) > 8 then
    raise exception '비밀번호는 2~8자입니다';
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
  if p_pw is not null and (char_length(p_pw) < 2 or char_length(p_pw) > 8) then
    raise exception '비밀번호는 2~8자입니다';
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

지우기 함수(delete_post·delete_post_comment)는 형식 검사가 없어 그대로. 옛 글의 숫자 4자리도 그대로 통한다.
