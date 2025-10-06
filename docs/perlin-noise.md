# Perlin Noise (TypeScript) – Usage Guide

Source: src/lib/ecs/lib/perlinNoise.ts exports class PerlinNoise implementing 2D/3D classic Perlin noise. Values are in [0, 1].

## Quick start
```ts
import { PerlinNoise } from '@/lib/ecs/lib/perlinNoise' // or relative path

const noise = new PerlinNoise()

// 2D noise at world coords (x, y)
const value2D = noise.noise(12.3, 45.6)

// 3D noise, e.g., add time for animation
const t = performance.now() * 0.001
const value3D = noise.noise(12.3, 45.6, t)
```

## Typical patterns
- Tilemaps/heightmaps
```ts
const noise = new PerlinNoise()
const scale = 0.08 // smaller => smoother, larger => more detail
const width = 100, height = 100
const heights: number[][] = []
for (let y = 0; y < height; y++) {
  const row: number[] = []
  for (let x = 0; x < width; x++) {
    const v = noise.noise(x * scale, y * scale) // 0..1
    row.push(v)
  }
  heights.push(row)
}
```

- Animated clouds/water
```ts
const noise = new PerlinNoise()
function sample(x: number, y: number, time: number) {
  return noise.noise(x * 0.2, y * 0.2, time * 0.05)
}
```

- Octaves (fractal Brownian motion)
```ts
function fbm(noise: PerlinNoise, x: number, y: number, octaves = 4) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise.noise(x * freq, y * freq)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm // still ~0..1
}
```

## Reproducibility (seeding)
This implementation shuffles its permutation table using Math.random() in the constructor, so different instances yield different patterns. For deterministic results:
- Create once and reuse the instance
- Or seed Math.random() before construction with a deterministic PRNG (e.g., seedrandom)
```ts
import seedrandom from 'seedrandom'
seedrandom('my-seed', { global: true })
const noise = new PerlinNoise() // deterministic across runs with same seed
```

## Performance tips
- Cache and reuse a single PerlinNoise instance.
- Prefer scaling input coordinates rather than upscaling output.
- For large grids, precompute into a buffer once and sample from it.

## Value range and mapping
- noise.noise(...) returns [0, 1].
- Map to other ranges: v * (max - min) + min.
- Thresholding example: const solid = v > 0.6

## Integration notes
- Works in both logic and rendering layers. Keep ECS logic in src/lib/ecs; isolate rendering in Pixi components.
- For Pixi animations, pass time as z to evolve noise smoothly over frames.

## API reference
- class PerlinNoise
  - noise(x: number, y: number, z?: number): number – Returns smooth noise in [0, 1]. z defaults to 0.
