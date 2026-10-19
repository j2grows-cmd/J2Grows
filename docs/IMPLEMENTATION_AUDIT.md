# J2Grows — Implementation Audit

**Reviewed:** 2026-10-19  
**Branch:** `agent/first-playable-foundation`  
**Scope:** Static review of `src/App.tsx`, `src/data.ts`, `src/supabase.ts`, app configuration, README and design/roadmap documents.  
**Verification:** The development branch has added gameplay unit tests and UUID-specific regression tests. The latest workflow status must be checked against the current branch head; a green typecheck/build is not a substitute for browser/runtime or Supabase integration tests.

This is a findings log, not a claim that all issues are fixed. Priority means: **P0** blocks the intended core loop; **P1** materially breaks or contradicts a feature; **P2** quality, robustness or documentation debt.

## P0 — Core gameplay blocker

### A01. First-plant acquisition — resolved on the development branch
- **Previous evidence:** The catalogue appeared to expose species cards without an acquisition action.
- **Current state:** The Shop calls `purchaseSpecies` → `acquireSpecies`, which checks funds, deducts the actual species price and creates a juvenile specimen. The tutorial starter path also creates a protected mature demonstration specimen.
- **Remaining check:** Browser-test a fresh game and reset flow end-to-end; static inspection alone does not prove every UI route is reachable.

### A02. Breeding cost and duration — materially resolved on the development branch
- **Previous evidence:** The UI showed conflicting costs and implied immediate offspring despite a displayed duration.
- **Current state:** `runCross` charges the calculated cost, reserves both parents and queues a `BreedingProject` for a completion day. Offspring are created when day progression processes the completed project. Targeted breeding's added cost and failure risk are applied in the project logic.
- **Remaining check:** Browser-test cancellation, completion and batch breeding, and keep the displayed cost/duration aligned with the shared helpers.

### A03. Mutation Analysis completion — resolved on the development branch
- **Previous evidence:** Mutation Analysis could remain marked in progress indefinitely.
- **Current state:** The project stores its target and start day; day progression completes it after three simulated days, records the result, and clears the active project state. The load path preserves a still-active project and its target when eligible.
- **Remaining check:** Browser-test completion and offline-save edge cases.

### A04. Specimen ID collisions — resolved on the development branch
- **Previous evidence:** IDs were assembled from timestamps, random fragments or the number of specimens, so collisions were possible, particularly across rapid batch creation and after sales.
- **Current state:** All interactive specimen creation paths now call `createUniqueSpecimenId`, which generates validated UUIDs and retries collisions. This covers shop acquisition, tutorial propagation, normal propagation (including multi-cutting batches), breeding offspring and batch-breeding offspring.
- **Save compatibility:** Existing specimen IDs and lineage references are not rewritten. The existing save/load and manual-slot paths continue to serialise and restore those fields as stored.
- **Tests:** Added tests for UUID format, collision retry, bounded failure and preserving legacy IDs.

### A05. Facility upgrades — resolved on the development branch
- **Previous evidence:** Facility purchases only charged cash and announced success; most upgrades had no durable level or gameplay effect.
- **Current state:** Added save-version 5 with migration defaults for older saves and manual save slots. Propagation bench, Environmental controller and Analysis workstation levels are capped at three, displayed in Facilities, and priced progressively. Purchases validate the upgrade, current level and available funds before charging.
- **Gameplay effects:** Each Propagation bench level shortens propagation phases by one day (minimum one day); each Environmental controller level adds five points to simulated light, nutrition and humidity, capped at 100; the Analysis workstation continues to influence mutation odds and analysis.
- **Running costs:** Owned levels contribute weekly operating costs charged on every seventh simulation day. Costs are shown/announced when an upgrade is purchased.
- **Tests:** Added coverage for progressive prices, invalid/underfunded/max-level purchases, environmental bounds, propagation duration, running costs, and old-save level migration.
- **Remaining check:** Confirm CI and browser-test purchase → save/reload → effect → seventh-day operating cost.

### A06. Staff state and greenhouse settings — implemented on the development branch
- **Previous evidence:** Staff care/training controls were transient and did not affect gameplay; greenhouse slider edits could be lost before pressing Apply.
- **Current state:** Added save-version 6 with migration defaults for old saves, local autosave and manual save-slot support for staff care and training state. Greenhouse temperature/humidity/auto-care controls now update the saved app state immediately; the separate Apply button has been removed and the UI explains that changes take effect immediately.
- **Gameplay effects:** Routine staff care buffers poor environmental conditions to a minimum care-condition score of 55. Each completed training level (maximum 3) raises that floor by 5, capped at 75. Training costs £25 and takes three simulated days per level. The assistant's routine care costs £8 each simulated week while enabled; pausing it removes the wage and care buffer.
- **Offline progress:** Staff training advances with eligible offline simulated days, and the resulting training level is preserved in the migrated save.
- **Tests:** Added unit coverage for legacy/malformed staff-state normalization, care buffering, pausing care, training cost/eligibility/duration/completion, level cap, and weekly wages.
- **CI:** Passed on code commit `bc358b86` (`npm test`, `npm run typecheck`, `npm run build`).
- **Remaining check:** Browser-test greenhouse edit → navigate away/reload → settings retained, plus training completion and weekly costs.

### A07. Online and offline day progression — implemented on the development branch
- **Shared simulation:** Offline catch-up now queues elapsed simulated days through the same `advanceDay` function used by the live game, one day per render/state update. This applies plant health and growth, propagation phases, mutation events, breeding completion/failure, Mutation Analysis completion, staff training, and weekly operating costs using the same rules.
- **Timing:** One in-game day is earned for every complete real-life hour away. Offline catch-up is capped at 14 simulated days (336 hours); partial hours do not earn a day.
- **Settings:** The enabled/disabled preference is stored in save version 7 and appears in Game Settings. Disabled offline progression applies no catch-up days. Existing save versions 1–6 migrate with offline progression enabled by default.
- **Tests:** Added `tests/offline-progress.test.mjs` for hourly thresholds, the 14-day cap, disabled mode, and invalid/backwards timestamps.
- **CI:** Passed on implementation commit `b3834ff9` (`npm test`, `npm run typecheck`, `npm run build`).
- **Remaining check:** Browser-level validation of a return from a long absence, settings persistence, and queued daily progression.

### A08. Save validation is too shallow — implemented on the development branch
- **Previous evidence:** `loadGameSave` checked only a few top-level types and trusted specimen fields and numeric ranges. Malformed but parseable local data could introduce invalid records and values into gameplay.
- **Current state:** Added `src/game/save-validation.ts` to validate supported save envelopes (versions 1–8), drop malformed and duplicate specimen records, clamp health/value/variegation and genetic/environment fields, sanitize propagation and genetics data, and reject malformed breeding projects. Invalid top-level saves are backed up before the app falls back to a fresh game. Recoverable saves are backed up before repairs are autosaved.
- **Manual slots:** Slot loading now normalizes each slot independently, preserves valid slots when another is malformed, clamps values and filters invalid specimens/projects, and backs up the original manual-slot payload before normalization. Analysis references are restored only when their specimen still exists.
- **User feedback:** The app announces when it has recovered a save and reports what was repaired or skipped.
- **Tests:** Added regression tests for supported legacy versions, invalid envelopes, duplicate/malformed specimens, clamping and malformed manual slots.
- **Verification:** GitHub Actions passed `npm test`, `npm run typecheck` and `npm run build` on implementation commit `c6650acb00d6c3b70f9a4ccd182f17615b61f30e`.
- **Remaining check:** Browser-test recovery against deliberately corrupted localStorage and verify that backup data can be inspected/restored through a future recovery UI.

### A09. Empty image paths can produce blank plant artwork — implemented on the development branch
- **Previous evidence:** Storage fallback called `makeStorageSpecies(name, "")` for folders without a recognised image, while `PlantArt` could render an unhelpful or blank generic illustration. Database rows with an empty image path could also produce a public URL for an empty path.
- **Current state:** Added `src/game/plant-artwork.ts` to select existing CSS botanical illustrations by plant slug/genus (Alocasia, Monstera/Rhaphidophora, Philodendron/Epipremnum/Pothos/Scindapsus, Anthurium/Syngonium), with a premium hero illustration as the final fallback. Existing local artwork is preserved, and valid remote image URLs take priority.
- **Broken remote images:** `PlantArt` now detects image-load failures and switches to the genus-matched illustration rather than leaving a broken image. The Supabase catalogue loader avoids generating a public URL when the image path is empty. No Supabase data or storage was changed.
- **Tests:** Added `tests/plant-artwork.test.mjs` covering genus matching, unknown-species fallback, valid image priority, local artwork preference and invalid/missing URLs.
- **Verification:** GitHub Actions passed `npm test`, `npm run typecheck` and `npm run build` on implementation commit `5e3e73ea71fb98dfef8ef9123e0b951504d721d3`.
- **Remaining check:** Browser-test real catalogue entries with missing and broken image objects, including the visual quality of each fallback class.
### A10. Supabase row data is trusted without runtime validation — implemented on the development branch
- **Previous evidence:** `fromSpeciesRow` assumed `traits` was an array and `image_path` was a usable string, although TypeScript types do not validate network payloads at runtime.
- **Current state:** Added `src/game/supabase-catalog.ts` to validate unknown rows at the network boundary. Rows need a safe slug-like ID and non-empty name; optional metadata is normalized to null, unknown difficulty/rarity values are discarded, traits are filtered/deduplicated, and image paths are restricted to supported image extensions without traversal, absolute paths, query fragments or backslashes.
- **Recovery behaviour:** Malformed and duplicate rows are skipped individually while valid neighbours are retained. If the table returns no valid rows, the loader falls back to Storage folders; if those are unavailable, it uses the local prototype catalogue. Invalid row counts are logged for diagnosis. Storage file selection also checks that entries are actual files with supported image extensions.
- **Tests:** Added `tests/supabase-catalog.test.mjs` for valid rows, missing/null fields, invalid IDs/names, unsafe image paths, unexpected enums, mixed malformed rows and duplicate IDs.
- **Verification:** GitHub Actions passed `npm test`, `npm run typecheck` and `npm run build` on implementation commit `142d166162175fa9f9d1186365fea8aa9737e25c`.
- **Remaining check:** Browser-test the fallback behaviour against malformed table responses and Storage errors; no live Supabase data or configuration was changed.
### A11. Catalogue labels overstate what was loaded — implemented on the development branch
- **Previous evidence:** The library always said “species folders” and “Connected”, even when the data came from the `species` table; neither label communicated image load failures.
- **Current state:** `loadSpeciesCatalog` now returns a precise source: `supabase-table`, `storage-folders`, or `local`. The Species Library displays that source and labels remote catalogue status as “Metadata loaded” rather than implying all images succeeded. Settings uses the same accurate source names.
- **Image status:** The library reports remote images loaded, fallback artwork in use, and images still loading. The existing image error handler switches broken URLs to genus-matched CSS artwork and reports that state to the library.
- **Tests:** Added `src/game/catalogue-status.ts` and `tests/catalogue-status.test.mjs` to cover all source labels and counts for loaded, pending, broken and local/fallback artwork.
- **Verification:** GitHub Actions passed `npm test`, `npm run typecheck` and `npm run build` on implementation commit `7e2a1fcf50688a026cf86a17d36acbf0b939a2ac`.
- **Remaining check:** Browser-test real catalogue entries and broken image URLs to confirm the status display updates correctly. No live Supabase data or configuration was changed.
### A12. Tutorial promises actions the game does not yet support
- **Evidence:** The guide discusses managing plants, breeding and research, but a fresh save starts with no specimens and has no acquisition flow. The greenhouse and research steps also describe controls/projects whose outcomes are placeholders.
- **Impact:** Players can follow the guide and still hit dead ends.
- **Recommended fix:** Align tutorial text with implemented mechanics, and add contextual next actions/empty states after the starter-plant flow exists.

### A13. Several interface controls are placeholders
- **Evidence:** Notification bell only displays a generic “caught up” toast; profile chip only displays a toast; family tree action says it is planned; “Apply environment” announces that controls do not affect health. Some “View all”/section-header actions are visual-only.
- **Impact:** Buttons look functional but do not perform the action implied by their labels.
- **Recommended fix:** Either wire each control to a real behaviour or present it as disabled/coming soon. Audit all buttons, links and select controls for a meaningful outcome.

### A14. Prototype data and intended initial scope differ
- **Evidence:** The design calls for three fully supported starter species (Philodendron, Alocasia and Monstera), while the local catalogue contains six entries including Anthurium; this is acceptable as demo data but is not a curated, implemented three-species starter loop. The current save starts with zero specimens.
- **Impact:** The prototype's available content and its stated first-playable design are not aligned.
- **Recommended fix:** Decide whether the first game should start empty and let the player acquire plants, or start with a guided starter specimen. Update the design and onboarding to match.

### A15. Offline progression cap and disclosure — partially resolved
- **Current state:** The 14-day cap is intentional and disclosed in Game Settings alongside the one-day-per-hour rate and the simulation systems that advance. The return notice reports the number of simulated days applied.
- **Remaining check:** Verify the return notice and cap behaviour in a browser after a long absence; the settings disclosure is implemented.

### A16. Design documents disagree about implementation status
- **Evidence:** `docs/GAME_DESIGN_SPEC.md` and `docs/DESIGN_AUDIT_AND_DECISIONS.md` still say implementation has not started / no UI code is authorised, while `README.md` and `docs/ROADMAP.md` describe the prototype as implemented.
- **Impact:** The repository's own documentation gives contradictory project status.
- **Recommended fix:** Mark the design documents as the approved baseline for implementation, separate design approval status from code status, and link this audit as the current implementation review.

### A17. Automated checks — partially addressed
- **Previous evidence:** CI relied only on TypeScript typechecking and a production build.
- **Current state:** Node's test runner is configured and regression tests now cover genetics, observation thresholds, trait targeting and specimen UUID generation/collision handling.
- **Remaining gap:** No browser-level end-to-end smoke test yet covers fresh game → acquire → propagate → save/reload, and some findings still require integration/runtime coverage.

### A18. Offset propagation allowed from immature specimens — resolved on the development branch
- **Previous evidence:** Division / offset propagation was available from any living, unreserved specimen, including corms and juveniles.
- **Decision:** Offsets may only be taken from plants at the `Mature` or `Breeding-ready` stage. Corm, seedling, juvenile and growing specimens must develop before producing offsets.
- **Current state:** The propagation action now checks the specimen's growth stage and explains that the plant must reach maturity first when blocked for this reason. Other propagation methods retain their existing eligibility rules.
- **Tests:** Added a stage eligibility regression test covering Corm, Seedling, Juvenile, Growing, Mature, Breeding-ready and unknown stages.
- **Verification:** GitHub Actions passed `npm test`, `npm run typecheck` and `npm run build` on implementation commit `5da5f0d5ee462f9966a3e9ffca72caf82858e153`.

## Suggested repair order

1. **A01** — first plant acquisition; otherwise the new-game state is a softlock.
2. **A02, A03, A04** — correct breeding, research and identity rules.
3. **A07, A08** — reconcile offline simulation and validate imported save state.
4. **A09, A10, A11** — catalogue robustness and truthful connection status.
5. **A12, A13, A15, A16, A17** — tutorial/UI/documentation and regression coverage.

## Scope and confidence

This audit was performed against the branch files and latest available CI result. It is a static review; the application was not launched in a browser here, the live Supabase project was not queried directly, and long-session/offline behaviours were not exercised manually. Treat findings about code paths as high confidence and runtime impact as requiring reproduction tests where noted.
