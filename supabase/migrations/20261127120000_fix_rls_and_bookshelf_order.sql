-- Folio: RLS fixes, schema cleanup, bookshelf ordering RPC
-- Applied to project zlehilklyxywtkfvmmmh on 2026-11-27.
-- Rollback: see 20261127120000_fix_rls_and_bookshelf_order.down.sql

begin;

-- 1. subscription_books had RLS enabled but NO policies, so every app
--    read/write was denied. Allow owners full access, and only against
--    subscriptions they own.
create policy "Users manage their own subscription books"
  on public.subscription_books
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions s
      where s.id = subscription_books.subscription_id
        and s.user_id = auth.uid()
    )
  );

-- 2. collection_books had four loose `public` policies alongside the strict
--    "Users manage their own collection books" policy. Permissive policies are
--    OR'ed, so the loose ones let a user link their collection to another
--    user's book_id. Drop the loose ones; the strict ALL policy remains.
drop policy if exists "Users can add their collection books"    on public.collection_books;
drop policy if exists "Users can remove their collection books" on public.collection_books;
drop policy if exists "Users can update their collection books" on public.collection_books;
drop policy if exists "Users can view their collection books"   on public.collection_books;

-- 3. collection_groups only had loose `public` policies (collection_id was
--    never checked for ownership). Replace with one strict policy.
drop policy if exists "Users can add their collection groups"    on public.collection_groups;
drop policy if exists "Users can remove their collection groups" on public.collection_groups;
drop policy if exists "Users can update their collection groups" on public.collection_groups;
drop policy if exists "Users can view their collection groups"   on public.collection_groups;

create policy "Users manage their own collection groups"
  on public.collection_groups
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.collections c
      where c.id = collection_groups.collection_id
        and c.user_id = auth.uid()
    )
  );

-- 4. editions UPDATE only checked user_id, so book_id could be repointed at
--    another user's book. Mirror the INSERT policy's ownership check.
alter policy "Users can update their own editions"
  on public.editions
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.books b
      where b.id = editions.book_id
        and b.user_id = auth.uid()
    )
  );

-- 5. Junk columns created by a mis-quoted ALTER TABLE. Verified empty
--    (0 non-null values) before dropping. The real columns are untouched.
alter table public.editions drop column if exists "position_x integer default 0";
alter table public.editions drop column if exists "position_y integer default 0";
alter table public.editions drop column if exists "shelf_index integer default 0";

-- 6. Bookshelf ordering: persist a full drag-and-drop order in one call.
--    SECURITY INVOKER so RLS applies; the user_id filter is belt-and-braces.
create or replace function public.reorder_editions(p_edition_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.editions e
  set sort_order = o.ord::int,
      updated_at = now()
  from unnest(p_edition_ids) with ordinality as o(id, ord)
  where e.id = o.id
    and e.user_id = auth.uid();
$$;

revoke all on function public.reorder_editions(uuid[]) from public, anon;
grant execute on function public.reorder_editions(uuid[]) to authenticated;

commit;
