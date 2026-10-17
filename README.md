# FLORALAB — Botanical Genetics Laboratory

A botanical genetics idle/incremental tycoon about cultivating rare plants, discovering fictional genetic traits, breeding new varieties, and building an advanced research laboratory.

## Project reboot

This repository is the clean foundation for the new FLORALAB codebase. The previous prototype is a reference for reusable ideas and assets; it is not the architecture we must preserve.

### Product goals

- A satisfying idle/incremental progression loop.
- Genetics with understandable inheritance, mutations, breeding, and discovery.
- An immersive, premium 3D botanical laboratory.
- A catalogue-first design that can reuse the existing plant catalogue and artwork where appropriate.
- Browser-playable from GitHub Codespaces, with Windows desktop support planned from the beginning.
- Single-player first; online rankings and other multiplayer features can follow once the core loop is reliable.

## Proposed technical foundation

- TypeScript
- React and Vite for the browser UI
- Three.js / React Three Fiber for the 3D lab
- Zustand or a similarly lightweight state store for UI state
- Vitest for deterministic simulation tests
- Electron for a Windows desktop build in a later milestone

Keep simulation logic independent of rendering and UI. Model game data, genetics, progression, persistence, and presentation as separate layers so they can be tested and iterated without coupling.

## Milestones

1. **Foundation:** runnable browser app, project conventions, lint/type-check/test/build scripts, and a polished visual shell.
2. **Playable loop:** acquire specimens, inspect traits, run research, breed or clone, record discoveries, earn currency, and buy upgrades.
3. **Genetics:** deterministic inheritance rules, seeded randomness for tests, mutation tables, genotype/phenotype separation, and documented balance parameters.
4. **Idle progression:** offline progress with caps, reliable versioned saves, meaningful upgrades, and clear feedback.
5. **3D laboratory:** beautiful interactive space with specimen displays and research equipment that responds to player progression.
6. **Catalogue and artwork:** import and validate reusable plant data and Supabase artwork paths, including graceful fallbacks.
7. **Desktop and online features:** package for Windows; add account/cloud/ranking features only after the single-player experience is stable.

## Development principles

- Keep the game runnable at every milestone.
- Prefer small, verifiable changes over one enormous rewrite.
- Add tests for economy, genetics, saves, and progression rules.
- Never commit secrets. Use environment variables and a documented example env file.
- Treat plant traits as game mechanics and clearly separate fictional genetics from real-world botanical advice.
- Keep the previous repository untouched while this reboot is developed.

## Getting started

The app scaffold and scripts will be added in the first implementation milestone. Once present, the README will include verified installation, development, testing, and build commands.
