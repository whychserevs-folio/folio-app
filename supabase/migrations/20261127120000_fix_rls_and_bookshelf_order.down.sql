-- Rollback for 20261127120000_fix_rls_and_bookshelf_order.sql
-- Restores the previous policies exactly as they were on 2026-11-27.
-- (The dropped junk columns were empty and are not recreated.)

begin;

drop function if exists public.reorder_editions(uuid[]);

alter policy "Users can update their own editions"
  on public.editions
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own collection groups" on public.collection_groups;
create policy "Users can add their collection groups"    on public.collection_groups for insert to public with check (auth.uid() = user_id);
create policy "Users can remove their collection groups" on public.collection_groups for delete to public using (auth.uid() = user_id);
create policy "Users can update their collection groups" on public.collection_groups for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can view their collection groups"   on public.collection_groups for select to public using (auth.uid() = user_id);

create policy "Users can add their collection books"    on public.collection_books for insert to public with check (auth.uid() = user_id);
create policy "Users can remove their collection books" on public.collection_books for delete to public using (auth.uid() = user_id);
create policy "Users can update their collection books" on public.collection_books for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can view their collection books"   on public.collection_books for select to public using (auth.uid() = user_id);

drop policy if exists "Users manage their own subscription books" on public.subscription_books;

commit;
