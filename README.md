# ECS Demo – React + TypeScript + Vite + Pixi

An experimental game prototype showcasing a simple Entity-Component-System (ECS) architecture rendered with PixiJS in a React app. The project explores input, movement, tile rendering, and procedural generation (Perlin noise) with a lightweight, modular codebase.

## Features
- ECS core with components (position, velocity, control, visual, tile) and systems (input, movement, render, tilemap)
- PixiJS rendering via @pixi/react
- Procedural noise generation (Perlin) for terrain/tiles
- Strict TypeScript configuration and ESLint setup
- Vite dev server and build pipeline

## Getting started
```bash
npm ci        # install deps
npm run dev   # start Vite dev server
npm run build # type-check (tsc -b) then Vite build
npm run preview
npm run lint
```

## Project structure
- src/lib/ecs/core.ts – minimal ECS engine utilities
- src/lib/ecs/components/* – data-only components
- src/lib/ecs/systems/* – systems operating over entities/components
- src/lib/ecs/lib/perlinNoise.ts – Perlin noise implementation (docs in docs/perlin-noise.md)
- src/ui/PixiGame.tsx – PixiJS scene in React
- src/engine/GameEngine.ts – integration wiring

## Documentation
- docs/perlin-noise.md – using Perlin noise in this project
- docs.md – how the game works and development workflow

## License
MIT (see LICENSE if provided)
