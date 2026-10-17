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
npm run typecheck
npm run build
npm run preview
```

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
