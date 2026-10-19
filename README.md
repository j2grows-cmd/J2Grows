# J2Grows — Botanical Research & Management Simulation

J2Grows is a premium botanical research, cultivation, genetics and management game. Players start with a small home growing setup, establish a nursery, discover and breed unusual plants, develop propagation methods, automate production and eventually expand into a research institution.

## Current status

**Prototype 0.1 is under development** on the [agent/first-playable-foundation](https://github.com/j2grows-cmd/J2Grows/tree/agent/first-playable-foundation) branch. This first slice establishes the premium 2D interface, starter specimen data, navigation, collection filters, specimen records, basic research/upgrade interactions, and versioned browser-local saving with capped offline progress. The simulation and displayed economic values are still prototype-level.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local development URL (normally `http://localhost:5173`). To verify a production build:

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

## Connect the plant species library

The app reads species metadata from the public `species` table and image objects from the existing Supabase `plant-images` storage bucket. Species IDs match their storage folder names, and each table row stores its image object path. If the table is unavailable, the app falls back to listing Storage folders; if Supabase is not configured or cannot be reached, the local prototype catalogue and saved specimen data remain available.

Set these Codespaces repository secrets under **GitHub repository → Settings → Secrets and variables → Codespaces → New repository secret**:

- `VITE_SUPABASE_URL` — `https://lwaxzivcjzpmmantryor.supabase.co`
- `VITE_SUPABASE_ANON_KEY` — the project's **publishable** API key from Supabase **Project Settings → API Keys** (a legacy `anon` key also works)

Do not use a service-role or secret API key. After saving both secrets, rebuild/restart the Codespace so Vite can read them. For local development, copy `.env.example` to `.env.local` and set the same two values there; keep `.env.local` private and uncommitted.

## Genetics and economy foundation

The current development branch includes an initial, tuneable implementation of the 99-species base-price catalogue, six rarity tiers, rarity-weighted daily shop stock, £100 starting cash, rarity/method-based propagation costs, specimen valuation, and local save migration. Specimen values use health and maturity factors plus current variegation expression, inherited stability, genetics and discovery bonuses.

The genetics module models blended parental inheritance with bounded variation, hidden potential, environment-sensitive expression/reversion risk, observation records, research analysis, mutation categories and mutation-specific inheritance stability. Research data and the analysis workstation can improve discovery; neither guarantees a mutation. The greenhouse applies its settings to future growth rather than directly adding a price multiplier.

These mechanics are a playable foundation, not final balance. The 99 base prices and rarity assignments are the current research-informed draft; low-confidence entries, exact shop probabilities, mutation rates, research costs and valuation multipliers should be reviewed and tuned before release. Cultivar naming after stabilisation remains a design decision for a later stage. No database schema or live Supabase records are changed by this implementation.

## Current prototype interactions

- Navigate between Dashboard, Plant Catalogue, Breeding, Research, Greenhouse, Facilities, Staff, Shop and Finances.
- Search and filter individual specimens; open their records and toggle protection.
- Sell unprotected specimens and use funds for a starter facility upgrade or research project.
- Advance a simulated day to progress the prototype's research data and improve eligible plant-health values.
- Adjust the greenhouse's illustrative temperature and humidity controls.
- Save institution state automatically in browser local storage. On return, eligible prototype progress is calculated at one simulated day per ten minutes away, capped at fourteen days.

The prototype intentionally labels unfinished mechanics: plant artwork is stylised placeholder art, genetics and valuation are not yet a full simulation, and environmental controls do not yet alter plant health. Do not treat example prices, care values or research costs as final balance or real-world plant-care advice.

## Design documents

- [Game Design Specification](docs/GAME_DESIGN_SPEC.md) — approved product vision and mechanics.
- [Design Audit and Decisions](docs/DESIGN_AUDIT_AND_DECISIONS.md) — risks, resolved contradictions and first-playable acceptance criteria.
- [UI Blueprint](docs/UI_BLUEPRINT.md) — screen layouts and interaction rules.
- [Implementation Roadmap](docs/ROADMAP.md) — staged delivery plan.

## Development principles

- Keep simulation logic independent of UI and rendering.
- Use small, testable milestones rather than one enormous implementation.
- Clearly distinguish fictional genetics from real-world botanical facts.
- Reuse and validate existing plant catalogue data and artwork wherever practical.
- Never commit secrets or expose Supabase service-role credentials in client code.
- Keep the core game playable offline; online features must not gate solo progression.
