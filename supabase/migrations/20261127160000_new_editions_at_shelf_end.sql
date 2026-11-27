-- Folio: new editions go at the END of the bookcase, not the front.
-- Applied to project zlehilklyxywtkfvmmmh on 2026-11-27.
-- Inserts that don't set a position (sort_order / shelf_index left at their
-- default 0) are placed after the user's last book, on their last shelf.
-- Covers every path: Add Book, + Add edition, received pre-order / box book.
-- Rollback:
--   drop trigger if exists editions_place_at_end on public.editions;
--   drop function if exists public.editions_place_at_end();

create or replace function public.editions_place_at_end()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  last_sort int;
  last_shelf int;
begin
  if coalesce(new.sort_order, 0) = 0 or coalesce(new.shelf_index, 0) = 0 then
    select coalesce(max(e.sort_order), 0), coalesce(max(e.shelf_index), 0)
      into last_sort, last_shelf
      from public.editions e
     where e.user_id = new.user_id;

    if coalesce(new.sort_order, 0) = 0 then
      new.sort_order := last_sort + 1;
    end if;
    if coalesce(new.shelf_index, 0) = 0 then
      new.shelf_index := last_shelf;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists editions_place_at_end on public.editions;
create trigger editions_place_at_end
  before insert on public.editions
  for each row execute function public.editions_place_at_end();
