-- Rollback for 20261127150000_integrity_indexes_username.sql
begin;

alter table public.editions           drop constraint if exists editions_display_style_check;
alter table public.subscription_books drop constraint if exists subscription_books_status_check;
alter table public.subscriptions      drop constraint if exists subscriptions_frequency_check;
alter table public.subscriptions      drop constraint if exists subscriptions_status_check;

do $$
declare t text;
begin
  foreach t in array array['profiles','collections','books','physical_copies',
                           'collection_groups','preorders','editions']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
  end loop;
end $$;
drop function if exists public.set_updated_at();

drop index if exists public.books_user_id_idx, public.editions_book_id_idx,
  public.physical_copies_user_id_idx, public.collections_user_id_idx,
  public.collection_books_book_id_idx, public.collection_books_user_id_idx,
  public.collection_groups_user_id_idx, public.universes_user_id_idx,
  public.series_user_id_idx, public.series_universe_id_idx,
  public.series_books_book_id_idx, public.series_books_user_id_idx,
  public.tbr_books_book_id_idx, public.dnf_books_book_id_idx,
  public.edition_photos_edition_id_idx, public.edition_photos_user_id_idx,
  public.preorders_user_id_idx, public.subscription_books_sub_id_idx,
  public.subscription_books_user_id_idx;

drop function if exists public.username_available(text);

commit;
