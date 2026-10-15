-- Run the entire file in one SQL request. All fixtures are rolled back.
begin;
insert into auth.users (id) values
  ('ff000000-0000-0000-0000-000000000001'),
  ('ff000000-0000-0000-0000-000000000002'),
  ('ff000000-0000-0000-0000-000000000003');
insert into public.portal_companies (id, name) values
  ('ff000000-0000-0000-0000-000000000011','RLS test A'),
  ('ff000000-0000-0000-0000-000000000012','RLS test B');
insert into public.portal_memberships (user_id, company_id) values
  ('ff000000-0000-0000-0000-000000000001','ff000000-0000-0000-0000-000000000011'),
  ('ff000000-0000-0000-0000-000000000002','ff000000-0000-0000-0000-000000000012');
do $$ begin
  if has_table_privilege('anon','public.portal_companies','SELECT')
    or has_table_privilege('anon','public.portal_memberships','SELECT') then
    raise exception 'Anonymous customer reads are allowed';
  end if;
  if has_table_privilege('authenticated','public.portal_memberships','INSERT')
    or has_table_privilege('authenticated','public.portal_memberships','UPDATE')
    or has_table_privilege('authenticated','public.portal_memberships','DELETE')
    or has_table_privilege('authenticated','public.portal_companies','INSERT')
    or has_table_privilege('authenticated','public.portal_companies','UPDATE')
    or has_table_privilege('authenticated','public.portal_companies','DELETE') then
    raise exception 'Clients can change authorization';
  end if;
end $$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"ff000000-0000-0000-0000-000000000001","role":"authenticated","user_metadata":{"role":"admin","company_id":"ff000000-0000-0000-0000-000000000012"}}';
do $$ begin
  if (select count(*) from public.portal_companies) <> 1
    or not exists (select 1 from public.portal_companies where name='RLS test A')
    or (select count(*) from public.portal_memberships) <> 1 then
    raise exception 'Company A isolation failed';
  end if;
  if exists (select 1 from public.portal_companies where name='RLS test B') then
    raise exception 'Cross-company access allowed';
  end if;
end $$;

set local request.jwt.claims = '{"sub":"ff000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$ begin
  if (select count(*) from public.portal_companies) <> 1
    or not exists (select 1 from public.portal_companies where name='RLS test B') then
    raise exception 'Company B isolation failed';
  end if;
end $$;

set local request.jwt.claims = '{"sub":"ff000000-0000-0000-0000-000000000003","role":"authenticated"}';
do $$ begin
  if exists (select 1 from public.portal_companies)
    or exists (select 1 from public.portal_memberships) then
    raise exception 'Unassigned account can read customers';
  end if;
end $$;

reset role;
update public.portal_memberships set status='suspended'
  where user_id='ff000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims = '{"sub":"ff000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$ begin
  if exists (select 1 from public.portal_companies) then
    raise exception 'Suspended account can read company';
  end if;
end $$;
reset role;
update public.portal_memberships set status='active'
  where user_id='ff000000-0000-0000-0000-000000000001';
update public.portal_companies set active=false
  where id='ff000000-0000-0000-0000-000000000011';
set local role authenticated;
do $$ begin
  if exists (select 1 from public.portal_companies) then
    raise exception 'Inactive company is visible';
  end if;
end $$;
reset role;
rollback;
select 'Portal RLS: all assertions passed; fixtures rolled back' as result;
