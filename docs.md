# Game Architecture and Development Workflow

This project is a small game experiment using an Entity-Component-System (ECS) architecture, rendered with PixiJS inside a React application. The focus is on clear separation of data (components), behavior (systems), and rendering.

## How the game works
- Entities: implicit IDs tracked by the ECS core (src/lib/ecs/core.ts).
- Components: data-only modules in src/lib/ecs/components/ (position, velocity, control, visual, tile).
- Systems: pure functions that iterate over entities with specific components:
  - input.ts – reads user input and updates control/intent state.
  - movement.ts – integrates velocity into position using delta time.
  - render.ts – maps component state to Pixi display objects via @pixi/react.
  - tilemapSystem.ts – generates and/or updates tile data; may use Perlin noise.
- Rendering: src/ui/PixiGame.tsx mounts a Pixi stage; React coordinates lifecycle, while Pixi renders sprites/tiles efficiently.
- Procedural generation: src/lib/ecs/lib/perlinNoise.ts provides 2D/3D Perlin noise in [0,1] for terrains, clouds, or variation.

## Data flow and update loop
1. Poll input (keyboard/mouse) and update control components.
2. Run movement to update positions from velocities.
3. Run tilemap/other world systems as needed.
4. Render system transforms component state into Pixi nodes; React drives frame updates.

## Development conventions
- TypeScript is strict; prefer explicit exported types and local inference.
- Keep components serializable; avoid storing functions/instances inside components.
- Systems are deterministic and side-effect free except for interacting with the ECS/world.
- Keep rendering concerns out of ECS systems; use adapters in render.ts.
- Use perlin-noise docs: docs/perlin-noise.md for patterns (FBM, seeding).

## Running and iterating
```bash
npm ci
npm run dev
npm run lint && npx tsc -b
```
- Change a system/component; hot-reload will reflect logic changes.
- For performance, reuse singletons (e.g., a PerlinNoise instance) and avoid re-creating Pixi objects each frame.

## Git workflow hints (using git status messages)
- Keep changes focused: modify one component/system per commit when possible.
- Use informative commit subjects that reflect intent, e.g.:
  - feat(ecs): add tile component and tilemap system
  - feat(render): integrate @pixi/react Sprite for entities with visual
  - chore(types): tighten Position to use number tuples
  - fix(movement): clamp dt to avoid tunneling on slow frames
- Before committing, ensure a clean status: run npm run lint and npx tsc -b, verify git status shows only intended changes.

## Extending the game
- Add new components to model state (e.g., Health, AIIntent).
- Write systems that operate on those components (e.g., ai.ts processing AIIntent -> Velocity).
- Expand tilemapSystem to use FBM octaves and thresholds to create biomes.
- Introduce simple tests with Vitest for logic-heavy systems (pure functions are test-friendly).
