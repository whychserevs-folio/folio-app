-- Folio: username check, foreign-key indexes, updated_at triggers, value checks.
-- Applied to project zlehilklyxywtkfvmmmh on 2026-11-27.
-- Additive only. Existing data was checked against every constraint first.
-- Rollback: see 20261127150000_integrity_indexes_username.down.sql

begin;

-- 1. Sign-up "username taken" check. The app looked up other users' profiles,
--    which RLS (correctly) hides, so the check always passed. This function
--    only answers yes/no and exposes nothing else.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- 2. Indexes for foreign keys / per-user lookups (none existed for most).
create index if not exists books_user_id_idx              on public.books (user_id);
create index if not exists editions_book_id_idx           on public.editions (book_id);
create index if not exists physical_copies_user_id_idx    on public.physical_copies (user_id);
create index if not exists collections_user_id_idx        on public.collections (user_id);
create index if not exists collection_books_book_id_idx   on public.collection_books (book_id);
create index if not exists collection_books_user_id_idx   on public.collection_books (user_id);
create index if not exists collection_groups_user_id_idx  on public.collection_groups (user_id);
create index if not exists universes_user_id_idx          on public.universes (user_id);
create index if not exists series_user_id_idx             on public.series (user_id);
create index if not exists series_universe_id_idx         on public.series (universe_id);
create index if not exists series_books_book_id_idx       on public.series_books (book_id);
create index if not exists series_books_user_id_idx       on public.series_books (user_id);
create index if not exists tbr_books_book_id_idx          on public.tbr_books (book_id);
create index if not exists dnf_books_book_id_idx          on public.dnf_books (book_id);
create index if not exists edition_photos_edition_id_idx  on public.edition_photos (edition_id);
create index if not exists edition_photos_user_id_idx     on public.edition_photos (user_id);
create index if not exists preorders_user_id_idx          on public.preorders (user_id);
create index if not exists subscription_books_sub_id_idx  on public.subscription_books (subscription_id);
create index if not exists subscription_books_user_id_idx on public.subscription_books (user_id);

-- 3. Keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','collections','books','physical_copies',
                           'collection_groups','preorders','editions']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- 4. Only the values the app actually writes (prevents typo'd states).
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('Active', 'Paused', 'Cancelled'));
alter table public.subscriptions
  add constraint subscriptions_frequency_check
  check (frequency is null or frequency in ('Monthly', 'Bi-Monthly', 'Quarterly'));
alter table public.subscription_books
  add constraint subscription_books_status_check
  check (status is null or status in ('Ordered', 'Shipped', 'Received'));
alter table public.editions
  add constraint editions_display_style_check
  check (display_style is null or display_style in ('spine', 'cover', 'edge', 'stack'));

commit;
