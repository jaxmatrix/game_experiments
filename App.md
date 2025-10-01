# ecs-demo Application Overview

## 1. Purpose & Current State
This project is a lightweight experiment combining:
- **React** (for mounting a `<canvas>` via `PixiGame` component)
- **PixiJS v8** (for rendering 2D graphics)
- A minimal **Entity–Component–System (ECS)** implementation (custom, in `src/lib/ecs`)
- Basic keyboard-driven movement for a single controllable entity

Primary goal: Demonstrate an ECS-managed game loop driving Pixi-rendered objects with clean separation of concerns.

---
## 2. High-Level Architecture
| Layer | Responsibility | Key Files |
|-------|----------------|-----------|
| UI Mount | Provides a canvas & handles lifecycle inside React | `src/ui/PixiGame.tsx` |
| Engine Orchestration | Initializes Pixi, constructs scene, starts ticker, owns ECS | `src/engine/GameEngine.ts` |
| ECS Core | Entities, components, querying | `src/lib/ecs/core.ts` |
| Components | Pure data holders | `components/*.ts` |
| Systems | Mutate component state each frame | `systems/*.ts` |
| Rendering Coupling | Syncs ECS state -> Pixi Graphics | `systems/render.ts` |

Interaction Flow (per frame):
1. Pixi ticker invokes `tick` callback (registered in `GameEngine`).
2. Input system samples global keyboard state → updates `ControllableComponent` flags.
3. Movement system applies velocity based on control state → updates `PositionComponent`.
4. Render system copies ECS position into Pixi `Graphics` display objects.
5. Pixi automatically renders the stage.

---
## 3. ECS Design Details
### 3.1 Entities
- Each `Entity` gets a UUID via `crypto.randomUUID()`.
- Components stored in a `Map<Function, Component>` keyed by constructor.
- Query method: `EntityManager.getEntityWith(...componentClasses)` returns entities possessing *all* requested component types (simple linear scan, acceptable for small demos).

### 3.2 Components
| Component | Purpose | Fields |
|-----------|---------|--------|
| `PositionComponent` | Spatial coordinates | `x`, `y` |
| `VelocityComponent` | Per-frame delta | `x`, `y` |
| `ControllableComponent` | Input state flags | `isUpPressed`, `isDownPressed`, `isLeftPressed`, `isRightPressed` |
| `VisualComponent` | Bridge ECS ↔ Pixi | `gap`, `boxSize`, `graphic` (a `PIXI.Graphics` reference) |

All components are mutable plain objects—no immutability or change tracking layer.

### 3.3 Systems
| System | Reads | Writes | Responsibility |
|--------|-------|--------|----------------|
| `InputSystem` | Global `keyboard` object | `ControllableComponent` flags | Poll keyboard and map to directional intent |
| `MovementSystem` | `ControllableComponent`, `VelocityComponent`, `PositionComponent` | `VelocityComponent`, `PositionComponent` | Set velocity from input; apply velocity to position |
| `RenderSystem` | `PositionComponent`, `VisualComponent` | Pixi `Graphics` transform | Mirror ECS coordinates into render objects |

---
## 4. Rendering & Game Loop
Originally the engine manually called `app.render()` after attaching a ticker. This dual approach risked timing issues. The refactor now:
- Registers a single `tick` callback with `app.ticker`.
- Lets Pixi internally handle render scheduling (auto-render each tick).
- Removes manual `update()` method.
- Ensures the ticker callback is explicitly removed before destroying the application to avoid WebGL calls on freed resources.

### 4.1 Why This Matters
A previously encountered error: `uniformWebGL: INVALID_OPERATION: uniformMatrix3fv: location is not from the associated program` was likely caused by a render call hitting after program/resource disposal or during a mid-frame state change. Eliminating mixed manual + automatic rendering reduces that risk.

---
## 5. Input Handling
- Global `keyboard` dictionary updated via `window` listeners (`keydown` / `keyup`).
- No debouncing or focus handling; if the window loses focus while a key is pressed, state may desync (a known common caveat). Potential improvement: reset all keys on `blur`.

---
## 6. Scene Composition
`setupScene()` builds:
- Background rectangle sized to initial canvas.
- Grid of boxes (10 rows × 16 columns) using `PIXI.Graphics` (each small rect). Suitable for small counts; for larger grids, a `ParticleContainer` or instancing strategy would be better.
- Player square (`playerGraphic`) with distinct color.
- Player entity gets `Controllable`, `Visual`, `Velocity`, and `Position` components.

Resize currently:
- Calls `renderer.resize(width, height)` (correct approach in Pixi v8).
- Rebuilds the background rectangle bounds.
- Includes placeholder code referencing children indexes for stars/text that are not actually created; these lines are effectively no-ops right now (could be cleaned up or fully implemented).

---
## 7. Recent Fixes & Rationale
| Change | File | Rationale |
|--------|------|-----------|
| Removed manual `app.render()` & `update()` method | `GameEngine.ts` | Avoid double rendering & GL state race conditions |
| Added cached `tick` callback & ticker removal on destroy | `GameEngine.ts` | Prevent late-frame uniform calls after destruction |
| Simplified resize (removed direct canvas width/height mutation) | `GameEngine.ts` | Let Pixi manage backing buffer; reduce potential context resets |
| Removed unused imports (`Text`, `Sprite`, `Assets`) | `GameEngine.ts` | Clean lint warnings |
| Fixed movement logic (`pos.y += vel.y`) | `movement.ts` | Y axis update bug (was adding Y velocity to X twice) |

---
## 8. Potential Improvements
### 8.1 ECS Enhancements
- Add component removal & entity destruction APIs.
- Cache query results or introduce an index for scalability.
- Support system execution order config & delta time injection.

### 8.2 Rendering
- Batch grid squares into a single `Graphics` draw or use a `RenderTexture` for static background.
- Introduce camera abstraction instead of directly writing to `Graphics.x/y`.

### 8.3 Input
- Add gamepad support and/or event-based command queue.
- Normalize diagonal movement speed (currently faster due to vector addition if both keys pressed, once diagonal velocity introduced).

### 8.4 Architecture
- Abstract Pixi behind a `RendererAdapter` to enable alternative backends (e.g., WebGPU in future). 
- Add a lightweight dependency injection or service registry for systems.

### 8.5 Tooling & Quality
- Add unit tests for systems (pure logic = easy to test).
- Enable ESLint rules for unused fields, cyclomatic complexity, etc.
- Add type guards to ensure `getComponent` returns non-null without throwing.

### 8.6 Performance (Future Scaling)
- Switch from per-entity `Graphics` objects to shared meshes for large numbers of sprites.
- Integrate a spatial hash or quadtree if collision/visibility culling is added.

---
## 9. Known Gaps / Cleanup Targets
| Item | Impact | Suggested Action |
|------|--------|------------------|
| Hardcoded magic numbers (grid size, colors) | Low | Centralize in config module |
| Unused star/text reposition code in `resize()` | Low | Remove or implement starfield/text |
| Global keyboard map never reset on blur | Medium | Add `window.addEventListener('blur', ...)` to clear keys |
| No delta time usage | Medium (future) | Pass `deltaMS` from ticker to movement scaling |
| No bounds checking for player movement | Low | Clamp position to stage dimensions |

---
## 10. Suggested Next Steps (Actionable)
1. Introduce delta time: `this.app.ticker.add((ticker) => movementSystem.update(deltaMS))`.
2. Extract constants (grid layout, colors) to `config.ts`.
3. Write small Jest/Vitest tests for `MovementSystem` and `InputSystem` logic.
4. Add an entity removal method to `EntityManager` for lifecycle control.
5. Implement a simple HUD overlay (fps, entity count) using Pixi `Text` or React overlay.

---
## 11. Running & Development Notes
Scripts (from `package.json`):
- `dev`: Starts Vite dev server.
- `build`: Type-check + bundle.
- `preview`: Serves production build.

Pixi v8 expects modern browsers; ensure hardware acceleration isn’t disabled.

### React Strict Mode
If enabled in the root (not shown here), expect double-mount of `PixiGame` in development. The engine currently tolerates this due to instance checks, but destruction ordering should still be watched.

---
## 12. Error Root Cause Summary (Historical)
The WebGL uniform error was almost certainly triggered by:
- Mixed manual + automatic rendering OR
- Ticker callback firing during/after `Application.destroy()`
Refactor removed those conditions.

---
## 13. Glossary
| Term | Meaning |
|------|---------|
| ECS | Architectural pattern separating data (components) from behavior (systems) operating over entities |
| Ticker | Pixi's frame scheduler; invokes callbacks each animation frame |
| DisplayObject | Base Pixi class for renderable scene graph nodes |

---
## 14. Current Health Snapshot
- Build: Clean (no TypeScript errors in modified files)
- Lint: Previously unused imports resolved
- Runtime: Should render grid + controllable square; movement now applies on both axes correctly

---
## 15. Attribution / Licensing
All code appears original to this project; no embedded third-party shaders or assets beyond Pixi's NPM package.

---
## 16. Quick Reference: Engine Lifecycle
```mermaid
graph TD
A[PixiGame mounted] --> B[GameEngine.init]
B --> C[Pixi Application created]
C --> D[Scene setup]
D --> E[Register ticker callback]
E --> F[Per-frame Systems Execute]
F --> G[Pixi Auto Render]
G --> F
B -->|Resize| H[renderer.resize]
A -->|Unmount| Z[destroy(): remove ticker & destroy app]
```

---
## 17. Final Notes
This codebase is an excellent foundation for experimenting with ECS patterns atop Pixi. The next meaningful evolution would be introducing more gameplay concerns (collisions, animations, resource loading pipeline) while keeping systems pure and data-driven.

Feel free to request follow-up tasks (tests, config extraction, delta time integration) and they can be implemented directly.
