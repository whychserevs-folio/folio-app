-- Folio: save the bookshelf layout (order + which shelf) in one call.
-- Applied to project zlehilklyxywtkfvmmmh on 2026-11-27.
-- Additive only: a new function; no table or data changes.
-- Rollback: drop function if exists public.save_shelf_layout(uuid[], int[]);

create or replace function public.save_shelf_layout(
  p_edition_ids uuid[],
  p_shelf_indexes int[]
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.editions e
  set sort_order = o.ord::int,
      shelf_index = greatest(coalesce(o.shelf, 0), 0),
      updated_at = now()
  from unnest(p_edition_ids, p_shelf_indexes) with ordinality as o(id, shelf, ord)
  where e.id = o.id
    and e.user_id = auth.uid();
$$;

revoke all on function public.save_shelf_layout(uuid[], int[]) from public, anon;
grant execute on function public.save_shelf_layout(uuid[], int[]) to authenticated;
