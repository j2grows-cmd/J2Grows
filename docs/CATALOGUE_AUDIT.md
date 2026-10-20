# Live Supabase catalogue audit

**Audited:** 20 October 2026
**Project:** `lwaxzivcjzpmmantryor`
**Scope:** `public.species` and `storage.objects` in the connected Supabase project.

## Findings before metadata alignment

- `public.species`: 99 rows and 99 unique IDs; no blank names, invalid slug IDs, or duplicate normalized names.
- All 99 rows had a non-empty artwork path, and every configured `image_path` matched an object in the `plant-images` bucket.
- 98 rows used the standard `species/<slug>/hero.png` path. `philodendron-pink-princess` uses a valid legacy UUID filename and is handled by an explicit path override in the app.
- 94 rows lacked `scientific_name`, `difficulty`, `rarity`, light, humidity, water and researched traits. Family and summary were populated.
- 97 rarity values did not match the source economy table: most were null, with existing values for Dragon Scale, Anthurium Luxurians and Pink Princess also inconsistent.
- The version-controlled economy catalogue contains 100 entries; 99 match remote rows by normalized display name. `Monstera Deliciosa` is absent remotely, and the Alocasia Frydek row uses the legacy ID `alocasia-frydek` rather than `alocasia-frydek-variegated`.

## Applied remediation

- Synchronized all matched remote rarity values to the version-controlled economy catalogue.
- Filled missing difficulty with the neutral default `Moderate`.
- Replaced missing care fields with the explicit placeholder `Not recorded`, and empty traits with `Not yet researched` rather than inventing species facts.
- Left all 94 missing scientific names null; they need botanical research and should not be guessed from common/trade names.
- Verified after migration: 99 rows, 99 unique IDs, zero missing rarity values, zero missing difficulty values, 94 explicitly unresearched care profiles, 94 placeholder trait arrays, and 94 missing scientific names.

## Remaining catalogue work

1. Research and verify scientific names and care profiles for the 94 incomplete records.
2. Add `Monstera Deliciosa` only after an approved artwork object is available.
3. Decide whether to migrate the legacy Alocasia Frydek ID. Do not rename it without a save/specimen-ID compatibility plan.
4. Keep the runtime audit in `src/game/supabase-catalog.ts` and re-run the SQL audit after each content batch.

The rarity values are game economy classifications, not a claim of objective market rarity. Care placeholders intentionally remain visible until researched.
