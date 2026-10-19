# J2Grows — Implementation Audit

**Reviewed:** 2026-10-19  
**Branch:** `agent/first-playable-foundation`  
**Scope:** Static review of `src/App.tsx`, `src/data.ts`, `src/supabase.ts`, app configuration, README and design/roadmap documents.  
**Verification:** GitHub Actions `Prototype checks` passed for commit `786c6b812a96c927b0480f07822cef32542324a6` (TypeScript typecheck and production build). This is not a substitute for browser/runtime, gameplay or Supabase integration tests.

This is a findings log, not a claim that all issues are fixed. Priority means: **P0** blocks the intended core loop; **P1** materially breaks or contradicts a feature; **P2** quality, robustness or documentation debt.

## P0 — Core gameplay blocker

### A01. New game has no way to acquire its first plant
- **Evidence:** Fresh saves and Reset Game now correctly create `specimens: []`, £1,000, 0 research and Day 1. The Catalogue's species library only renders information cards. There is no buy/acquire action or starter plant grant. Breeding requires two existing specimens and selling requires one.
- **Impact:** The player can advance days and gain research, but cannot enter the plant-care, specimen, breeding or sales loop. The tutorial's specimen step redirects to the catalogue, which still has no acquisition action.
- **Recommended fix:** Add an explicit, affordable starter-plant acquisition flow (with a real cash deduction, unique specimen ID and starting specimen defaults) or a first-run choice that grants/lets the player buy one. Add an empty-state call to action and test the full new-game loop.

## P1 — Gameplay logic, state and UI inconsistencies

### A02. Breeding UI cost and duration disagree with actual behaviour
- **Evidence:** `BreedingPage` displays “Research cost 250 cash” and “Duration 1 simulated day”; the button says £100; `runCross` deducts £100 and creates the offspring immediately.
- **Impact:** The player is shown conflicting prices and a misleading duration.
- **Recommended fix:** Define one source of truth for cost and duration. For this prototype, label the £100 as the actual cost and remove the unused duration claim, or implement a queued experiment with the displayed cost and duration.

### A03. Research projects never finish
- **Evidence:** `startResearch` deducts £250 and sets `projectStarted=true`. `advanceDay` adds research data but never advances/completes Mutation Analysis. The button remains “Project in progress” indefinitely; the flag is only reset by a new game.
- **Impact:** The core research interaction has no outcome, completion, unlock or meaningful progression.
- **Recommended fix:** Represent a project with explicit status/progress/start day/cost and a completion condition; update the research tree and show a result when complete. Until then, describe it as a one-time placeholder rather than a timed project.

### A04. Specimen IDs can collide after selling and breeding
- **Evidence:** New offspring IDs use `specimens.length + 1` as their numeric suffix. Collection length is not a monotonic ID counter; selling a plant can make the same suffix be generated again.
- **Impact:** Duplicate IDs can break React keys, specimen selection and identity/provenance.
- **Recommended fix:** Use `crypto.randomUUID()` or a persisted monotonic counter, with collision validation and a migration strategy.

### A05. Facility upgrades charge money but do not persist or affect the facility
- **Evidence:** Facilities' purchase callback only subtracts cash and announces success. No purchased-upgrade state is stored, displayed or included in `GameSave`.
- **Impact:** The player can repeatedly pay for the same upgrade without receiving a durable benefit; reload loses the supposed purchase.
- **Recommended fix:** Add owned-upgrade state to the save, disable/reprice owned upgrades, and connect each upgrade to a visible effect. Otherwise label the cards as non-purchasable previews.

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

### A17. Automated checks do not cover gameplay
- **Evidence:** CI runs TypeScript typecheck and a Vite production build only; there is no test runner or unit/integration/browser test suite.
- **Impact:** Build success cannot catch duplicate IDs, reset/new-game dead ends, wrong costs, non-persistent controls or research that never completes.
- **Recommended fix:** Add tests for new game/reset, acquisition, unique IDs, sale, breeding cost/compatibility, research completion, save validation/migration and reload persistence. Add a browser smoke test for the first playable loop.

## Suggested repair order

1. **A01** — first plant acquisition; otherwise the new-game state is a softlock.
2. **A02, A03, A04** — correct breeding, research and identity rules.
3. **A05, A06, A07, A08** — durable state and coherent simulation.
4. **A09, A10, A11** — catalogue robustness and truthful connection status.
5. **A12, A13, A15, A16, A17** — tutorial/UI/documentation and regression coverage.

## Scope and confidence

This audit was performed against the branch files and latest available CI result. It is a static review; the application was not launched in a browser here, the live Supabase project was not queried directly, and long-session/offline behaviours were not exercised manually. Treat findings about code paths as high confidence and runtime impact as requiring reproduction tests where noted.
