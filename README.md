# J2Grows — Botanical Research & Management Simulation

J2Grows is a premium botanical research, cultivation, genetics and management game. Players start with a small home growing setup, establish a profitable nursery, discover and breed unusual plants, develop tissue culture, automate production, and expand into a recognised research institution.

## Current status

**Design discovery is complete. Implementation has not started.** The agreed direction is recorded in [the Game Design Specification](docs/GAME_DESIGN_SPEC.md), with delivery phases in [the implementation roadmap](docs/ROADMAP.md).

## Product pillars

- **Discovery:** genetic traits, rare phenotypes, breeding lines and stable cultivars.
- **Cultivation:** plant growth, environmental conditions, health and propagation.
- **Automation:** staff, equipment and connected production chains.
- **Enterprise:** sales, contracts, market demand and institutional growth.

The game should be accessible to new players while providing meaningful depth for long-term optimisation. It is single-player first, with optional online features planned after the offline core is reliable.

## Intended technical direction

- TypeScript
- React + Vite for the browser experience
- Three.js / React Three Fiber for the 3D laboratory
- Deterministic tests for simulation rules
- Electron for a later Windows desktop build

These are proposed choices, not a verified scaffold. The first implementation milestone must establish a runnable app and verified commands before the README claims the project can be built or run.

## Development principles

- Keep simulation logic independent of UI and rendering.
- Use small, testable milestones rather than one enormous implementation.
- Clearly distinguish fictional genetics from real-world botanical facts.
- Reuse and validate existing plant catalogue data and artwork wherever practical.
- Never commit secrets or expose Supabase service-role credentials in client code.
- Keep the core game playable offline; online features must not gate solo progression.

## Design documents

- [Game Design Specification](docs/GAME_DESIGN_SPEC.md) — canonical product vision and approved mechanics.
- [Design Audit and Decisions](docs/DESIGN_AUDIT_AND_DECISIONS.md) — contradictions resolved, risks, remaining gates and first-playable acceptance criteria.
- [UI Blueprint](docs/UI_BLUEPRINT.md) — catalogue-first screens, navigation, interaction rules and implementation order.
- [Implementation Roadmap](docs/ROADMAP.md) — staged development phases and release gates.

## Start here

1. Read [docs/GAME_DESIGN_SPEC.md](docs/GAME_DESIGN_SPEC.md).
2. Review [docs/ROADMAP.md](docs/ROADMAP.md).
3. Resolve the listed open decisions and approve the first-playable scope.
4. Only then begin the runnable browser foundation.

The app scaffold and verified development commands will be documented after the first implementation milestone.
