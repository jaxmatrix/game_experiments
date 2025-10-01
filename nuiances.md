# Nuances, Ordering Pitfalls, and Subtle Runtime Behaviors
_A living reference of "it compiles, but the runtime may betray you" moments for this Pixi.js + React + ECS setup._

> Most of these are not syntax errors; they are sequencing or lifecycle ordering issues that can silently produce missing visuals, warnings, or WebGL errors.

---
## 1. Pixi Graphics Command Order
### Issue
`new Graphics().fill(0xffffff).rect(0,0,10,10);` renders **nothing** in Pixi v8.

### Why
`fill()` finalizes the current path(s) collected so far. If no shape path exists when `fill()` is called, it has no effect. Subsequent `rect()` does NOT retroactively adopt that fill.

### Correct
```ts
new Graphics().rect(0, 0, 10, 10).fill({ color: 0xffffff });
```

### Related
- To stroke then fill: define shape → `.stroke({ width: 2, color })` → `.fill({ color })`.
- Calling `.clear()` wipes previous geometry + styles; you must re-specify both shape and fill after clearing.

---
## 2. Manual Render vs Ticker Render (Double Rendering)
### Issue
Calling `app.render()` manually **and** relying on the ticker auto-render in the same frame can cause state races and internal WebGL warnings (e.g., uniform location errors).

### Rule
Pick ONE of:
1. Trust Pixi's ticker auto-render (default). Only mutate scene objects in ticker callback.
2. Disable/avoid auto-render and call `app.render()` once per frame yourself.

### Symptom
Flicker, duplicate logs per frame, or intermittent `uniformMatrix3fv` WebGL errors during teardown.

---
## 3. React Strict Mode Double Mount
### Issue
In development, React mounts → unmounts → mounts again. Any side-effectful init (creating a Pixi Application) runs twice, with destruction sandwiched in between.

### Consequences
- Second init may see partially torn GL state.
- Rapid destroy→init can surface internal Pixi program rebind errors.

### Mitigations
- Singleton engine (module-level or global).
- Ref counting on mounts; defer destroy by `requestAnimationFrame` until sure no remount occurs.
- Avoid per-frame React state updates (keep engine outside React’s reconciliation concerns).

---
## 4. Destruction Ordering of Pixi Resources
### Issue
Destroying the Pixi `Application` while a ticker callback still references display objects or while asynchronous GPU compilation steps are pending can trigger WebGL errors like:
`INVALID_OPERATION: uniformMatrix3fv: location is not from the associated program`.

### Correct Order
1. Remove ticker callback(s).
2. Optionally detach input / event listeners.
3. Call `app.destroy()` with appropriate flags.
4. Null references to large structures for GC.

### Anti-Pattern
```ts
app.destroy();
app.ticker.remove(cb); // too late
```

---
## 5. Resizing Canvas
### Issue
Simultaneously setting `canvas.width/height` AND calling `renderer.resize()` can cause redundant context reallocations (and occasionally state resets mid-frame).

### Preferred
```ts
app.renderer.resize(newWidth, newHeight);
```
Pixi updates the underlying canvas for you.

### Follow-up
Recalculate dependent layout (background shapes, hit areas) only AFTER successful resize.

---
## 6. Graphics Layering Assumptions
### Issue
Assuming insertion order always matches render stacking when later using `zIndex` or filters without enabling `sortableChildren`.

### Note
If you start using `zIndex`, you must set `container.sortableChildren = true;` or the changes won’t visibly reorder.

---
## 7. Input Listener Duplication (HMR / Multiple Bundles)
### Issue
Top-level `window.addEventListener` in a module is executed once per actual module instance. Under Hot Module Replacement (HMR), the module may reload, stacking listeners.

### Mitigation
```ts
if (!(window as any).__ECS_INPUT__) {
  (window as any).__ECS_INPUT__ = true;
  window.addEventListener('keydown', ...);
  window.addEventListener('keyup', ...);
}
```

### Test Edge Case
Losing window focus mid-key leaves a stale key state. Add a `blur` listener to reset.

---
## 8. Velocity Reset vs Increment Ordering
### Issue
In movement system:
```ts
vel.x = 0; vel.y = 0; // reset
// apply input
```
If this reset line accidentally moves below the input mapping, velocity from previous frame persists and accumulates.

### Symptom
Player accelerates uncontrollably.

### Rule
Reset → Map input → Apply to position.

---
## 9. Position Update Axis Mix-up
### Issue
`pos.x += vel.x; pos.x += vel.y;` (typo) results in diagonal bias & no Y movement.

### Fix
`pos.y += vel.y;`

### Lesson
Prefer writing small invariant tests for math systems.

---
## 10. Deferred Asset Usage
### Issue
Creating Sprites BEFORE `await Assets.load(...)` completes (or using `Texture.from` on a not-yet-loaded resource) may produce flashing or blank textures (usually replaced later, but timing-dependent).

### Rule
Always isolate an async asset bootstrap phase BEFORE scene construction. Record readiness with a promise or state flag.

---
## 11. Frame Delta Misuse
### Issue
Using constant per-frame increments (`speed = 2`) makes motion framerate-dependent. On 144Hz screens objects move faster than on 60Hz.

### Correction
```ts
app.ticker.add((ticker) => {
  const dt = ticker.deltaMS / 16.6667; // normalize
  pos.x += vel.x * dt;
});
```

### Caveat
Use smoothing or clamping for huge delta spikes (tab restore / debugger pause).

---
## 12. React useEffect Dependency Pitfall
### Issue
Leaving `[]` dependencies while referencing changing props (like `width`/`height`) leads to stale values.

### Current Pattern
Separate effect for init (empty array) and a second effect for resize (depends on `[width,height,isInitialized]`). This is correct.

### Pitfall
Combining into one without proper deps can cause missed resize or duplicate init.

---
## 13. Conditional Resize Ordering
### Issue
Resizing BEFORE all children are present and then mutating children sizes may cause one frame of incorrect layout or culling if relying on bounds.

### Fix
Resize → Recompute layout → (optionally) force rerender (Pixi auto-render covers it).

---
## 14. Using Destroyed Display Objects
### Issue
Holding a reference to a `Graphics` object after its parent application is destroyed and re-adding it to a new stage can produce silent failures (no render, internal warnings) because internal GPU buffers were invalidated.

### Rule
Never reuse display objects across distinct `Application` lifecycles unless you manually manage reinitialization.

---
## 15. WebGL Uniform Errors During Teardown
### Cause Cluster
- Double init/destroy cycle (Strict Mode / logic bug)
- Manual `app.render()` after `destroy()`
- Pending async program compilation finishing after resources gone

### Prevention Checklist
| Action | Done? |
|--------|-------|
| Remove ticker callback before destroy | ✔ | 
| Null engine references after destroy | ✔ |
| Avoid manual render calls post-destroy | ✔ |
| Use singleton / ref counting | Recommended |

---
## 16. GC Pressure from Frequent Graphics Instantiation
### Issue
Recreating many `Graphics` every frame (instead of mutating existing) causes garbage churn and potential stutter.

### Rule
Create once → reuse; if shape changes drastically, consider `clear()` + re-draw.

---
## 17. Mutation During Iteration
### Issue
Adding/removing children from a `Container` while iterating through its `children` array manually can skip or repeat objects.

### Rule
Clone reference or collect ops first:
```ts
for (const child of [...container.children]) { /* safe */ }
```

---
## 18. Ticker Callback Context Loss
### Issue
Using a class method directly (`this.app.ticker.add(this.tick)`) is fine if `tick` is an arrow property. If it were a prototype method (non-arrow) and you forgot to bind, `this` would be undefined in strict mode.

### Rule
Use arrow functions for ticker/system callbacks or explicit `.bind(this)`.

---
## 19. Z-Ordering vs Creation Order vs Interaction
### Issue
Relying on creation order for both visual stacking AND hit testing becomes brittle when you later sort or insert dynamically.

### Strategy
Adopt explicit layer containers early: `backgroundLayer`, `entityLayer`, `uiLayer`.

---
## 20. React State in the Frame Loop
### Issue
Calling `setState` inside the ticker every frame triggers React rerenders at 60+ FPS → UI jank.

### Fix
- Keep frame loop purely imperative.
- Aggregate stats and update React at throttled intervals (e.g., every 250ms).

---
## 21. Missing Focus Handling for Input
### Issue
Alt-tabbing while holding a movement key leaves it stuck as `true` in the `keyboard` map.

### Fix
`window.addEventListener('blur', () => { for (const k in keyboard) keyboard[k] = false; });`

---
## 22. Mutation After Destroy Guard
### Issue
A stray async callback referencing `this.app.stage` after destruction throws or no-ops silently.

### Pattern
```ts
if (!this.app) return; // guard early in all async continuations
```

---
## 23. Transient High-DPI Scaling Artifacts
### Issue
Changing `resolution` manually without redrawing vector Graphics can cause blurriness until next shape command.

### Tip
If dynamically changing resolution: re-issue renderable path (e.g., via `clear()` + re-draw) or call `renderer.resize()` which triggers recalculations.

---
## 24. Hidden Typos in CSS Affect Layout
### Issue
In `index.css`: `widht: 100vw;` (typo) → body not actually spanning width → unexpected canvas layout constraints in certain flex/parent layouts.

### Fix
Correct to `width: 100vw;`.

---
## 25. Infinite Ticker Additions
### Issue
Calling `app.ticker.add(this.tick)` multiple times (e.g., re-entry into `gameLoop()`) stacks duplicates; callback runs N times per frame.

### Mitigation
Track a boolean `loopStarted` or remove before add:
```ts
if (!this.loopStarted) { app.ticker.add(this.tick); this.loopStarted = true; }
```

---
## 26. Ordering of Scene Construction vs Input Availability
### Issue
If systems run a frame BEFORE `setupScene()` finishes (e.g., async asset awaits splitting timing), movement or render system queries could fail (no entity). Currently safe because setup completes synchronously before loop registration.

### Guard (for future async):
```ts
if (!this.player) return; // inside systems that assume existence
```

---
## 27. Reassigning Canvas Element
### Issue
Passing a new `<canvas>` element to an already-initialized Pixi `Application` without destroying the old one is unsupported; you must either:
- Destroy and recreate Application, or
- Keep one stable canvas node.

### Pitfall
React portals or conditional rendering accidentally swapping out the canvas DOM node.

---
## 28. Using `console.log` Inside Ticker (Performance)
### Issue
Logging every frame (`console.log('Tick')`) can throttle the loop and obscure real performance.

### Approach
Add a conditional sampler:
```ts
if (ticker.lastTime % 60 < 1) console.log('sample');
```

---
## 29. Silent Failure of Off-Screen Coordinates
### Issue
Moving objects with no camera/clamping logic can push them fully off-canvas; visually appears “missing sprite.” Not a render failure.

### Add Temporary Bounds Clamp
```ts
pos.x = Math.max(0, Math.min(stageWidth - w, pos.x));
```

---
## 30. Race Between Resize and Background Redraw
### Issue
Calling `resize()` repeatedly in quick succession (e.g., window drag) while re-drawing the background each time can cause churn.

### Optimization
Debounce expensive redraw content while still letting `renderer.resize()` run eagerly for crisp scaling.

---
## Maintenance Notes
- Review this file when upgrading Pixi or refactoring lifecycle code.
- Add new entries when a “why is nothing rendering?” moment occurs.

---
## Quick Checklist (Pre-Commit)
| Check | OK? |
|-------|-----|
| Graphics: shape before fill | ☐ |
| No manual + auto render mix | ☐ |
| Ticker added once | ☐ |
| Destroy removes ticker first | ☐ |
| Resize uses renderer.resize only | ☐ |
| Input listeners guarded | ☐ |
| Strict Mode safe (idempotent init) | ☐ |
| Delta time used (if speed-sensitive) | ☐ |
| No frame `console.log` spam | ☐ |
| CSS typos fixed | ☐ |

---
_Amend or extend as patterns evolve._
