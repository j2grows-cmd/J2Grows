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

### A06. Greenhouse and staff controls are transient
- **Evidence:** Temperature, humidity and auto-care state live inside `GreenhousePage`; staff auto-care and training state live inside `StaffPage`. These components unmount on navigation, so their local state resets. They are not included in the save.
- **Impact:** Controls appear to accept changes but do not retain them, and auto-care/training have no simulation effect.
- **Recommended fix:** Lift real settings into application state and save them. If they are intentionally decorative, disable them or label them as visual-only directly beside the controls.

### A07. “Advance day” has no coherent time/economy model
- **Evidence:** Every click adds 25 research and improves some plant health; it does not apply growth stages, costs, research completion, plant needs or greenhouse conditions. Offline progress separately grants the same research and health increments.
- **Impact:** Repeated clicks are a free resource exploit; the displayed simulation is not connected to most management systems.
- **Recommended fix:** Centralise day progression in a simulation function with explicit rules and tests. Separate research points from cash costs, define health/growth rules, and make manual/offline progression use the same rules.

### A08. Save validation is too shallow
- **Evidence:** `loadGameSave` checks top-level types and `Array.isArray(specimens)`, then trusts each specimen's fields and numeric ranges. Malformed but parseable local data can introduce missing health, invalid species IDs or bad values into the UI.
- **Impact:** A stale or manually corrupted save can cause rendering errors or invalid gameplay.
- **Recommended fix:** Validate/migrate each field against a schema, clamp bounded values, reject invalid specimen records, and retain a recoverable backup before replacing a bad save.

### A09. Empty image paths can produce blank plant artwork
- **Evidence:** Storage fallback calls `makeStorageSpecies(name, "")` when a folder has no recognised image. `PlantArt` then receives an empty image type and renders a generic artwork container without a known CSS art class or image.
- **Impact:** Catalogue entries may appear blank.
- **Recommended fix:** Use a guaranteed fallback artwork key when no valid image URL exists, and validate image paths and URL responses.

### A10. Supabase row data is trusted without runtime validation
- **Evidence:** `fromSpeciesRow` assumes `row.traits` is a non-null array and `row.image_path` is a usable string, although TypeScript's `SpeciesRow` type does not validate API payloads at runtime.
- **Impact:** Unexpected nulls or schema drift can throw during catalogue mapping or create broken image URLs.
- **Recommended fix:** Validate and normalise each row at the network boundary; default null traits to `[]`, validate image paths, and fall back per record rather than failing the whole catalogue.

### A11. Catalogue labels overstate what was loaded
- **Evidence:** The library header always reports “species folders”, even when rows came from the `species` table. The “Supabase connected” label reflects a successful metadata path, not validation that every image loaded.
- **Impact:** Users can misdiagnose missing metadata/images and misunderstand the source.
- **Recommended fix:** Report the actual source (table, Storage-folder fallback, or local data) and distinguish metadata connection from image availability.

## P2 — Product and documentation gaps

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

### A15. Offline progression policy is inconsistent with the design baseline
- **Evidence:** `loadGameSave` caps offline progress at 14 days. The design audit calls for generous transparent progress and says any cap must be explicitly explained; the return message reports days applied but does not mention the cap.
- **Impact:** Long absences silently stop progressing after the cap, which may surprise players.
- **Recommended fix:** Keep the cap only if intentional, disclose it in settings/help and the return summary, and define which systems progress offline.

### A16. Design documents disagree about implementation status
- **Evidence:** `docs/GAME_DESIGN_SPEC.md` and `docs/DESIGN_AUDIT_AND_DECISIONS.md` still say implementation has not started / no UI code is authorised, while `README.md` and `docs/ROADMAP.md` describe the prototype as implemented.
- **Impact:** The repository's own documentation gives contradictory project status.
- **Recommended fix:** Mark the design documents as the approved baseline for implementation, separate design approval status from code status, and link this audit as the current implementation review.

### A17. Automated checks — partially addressed
- **Previous evidence:** CI relied only on TypeScript typechecking and a production build.
- **Current state:** Node's test runner is configured and regression tests now cover genetics, observation thresholds, trait targeting and specimen UUID generation/collision handling.
- **Remaining gap:** No browser-level end-to-end smoke test yet covers fresh game → acquire → propagate → save/reload, and some findings still require integration/runtime coverage.

## Suggested repair order

1. **A01** — first plant acquisition; otherwise the new-game state is a softlock.
2. **A02, A03, A04** — correct breeding, research and identity rules.
3. **A06, A07, A08** — greenhouse/staff state, coherent simulation and save validation.
4. **A09, A10, A11** — catalogue robustness and truthful connection status.
5. **A12, A13, A15, A16, A17** — tutorial/UI/documentation and regression coverage.

## Scope and confidence

This audit was performed against the branch files and latest available CI result. It is a static review; the application was not launched in a browser here, the live Supabase project was not queried directly, and long-session/offline behaviours were not exercised manually. Treat findings about code paths as high confidence and runtime impact as requiring reproduction tests where noted.
