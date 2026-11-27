-- Folio: remember the colours extracted from each edition's cover, so the
-- generated spine matches the cover and is only computed once per cover.
-- Applied to project zlehilklyxywtkfvmmmh on 2026-11-27. Additive only.
-- Shape: {"v":1,"bg":"#RRGGBB","text":"#RRGGBB","accent":"#RRGGBB"|null,"src":"<cover url>"}
-- Rollback: alter table public.editions drop column if exists spine_colors;

alter table public.editions add column if not exists spine_colors jsonb;
