-- Run once in a new Supabase project's SQL editor. No service-role key is used by the app.
create table public.records (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('report','prospect','draft','profile')),
 title text not null check(length(title) between 1 and 200),
 payload jsonb not null default '{}'::jsonb,
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index records_owner_kind on public.records(owner_id,kind);
alter table public.records enable row level security;
create policy own_records on public.records for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
grant select,insert,update,delete on public.records to authenticated;
create table public.ai_requests(owner_id uuid not null references auth.users(id) on delete cascade,id uuid not null,created_at timestamptz not null default now(),primary key(owner_id,id));
alter table public.ai_requests enable row level security;
create index ai_requests_owner_date on public.ai_requests(owner_id,created_at);
-- Atomic daily quota and duplicate-request prevention across all server instances.
create function public.claim_ai_request(request_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid();
begin
 if uid is null then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if exists(select 1 from ai_requests where owner_id=uid and id=request_id) then return false;end if;
 if (select count(*) from ai_requests where owner_id=uid and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC') >= 20 then return false;end if;
 insert into ai_requests(owner_id,id) values(uid,request_id);
 return true;
end;$$;
revoke all on function public.claim_ai_request(uuid) from public;
grant execute on function public.claim_ai_request(uuid) to authenticated;
