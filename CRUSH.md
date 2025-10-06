CRUSH.md – Repo playbook for agents

Build, run, test
- Install: npm ci (preferred) or npm install
- Dev server: npm run dev (Vite)
- Build: npm run build (tsc -b then vite build)
- Preview built app: npm run preview
- Lint all: npm run lint
- Type-check only: npx tsc -b --pretty false
- Test: no test framework configured. If you add Vitest: npm i -D vitest @vitest/ui jsdom; add scripts: "test": "vitest", "test:ui": "vitest --ui". Run a single test: npx vitest run path/to/file.test.ts -t "test name".

Project conventions
- Language/stack: React 19 + TypeScript, Vite, Pixi (@pixi/react, pixi.js), Tailwind 4 + @tailwindcss/vite.
- Module format: ESM ("type": "module"). Use import/export; no require.
- TS config: strict true; noUnusedLocals/Parameters on. DOM libs enabled; bundler moduleResolution; noEmit. Prefer explicit types for public APIs; allow type inference locally.
- Paths/imports: use relative imports from src (no custom tsconfig paths). Keep imports ordered: std libs, third-party, absolute project, then relative; group and separate by blank lines.
- JSX: react-jsx runtime. Components/functions are pure, side-effect free where possible.
- Naming: PascalCase for React components/types; camelCase for variables/functions; UPPER_SNAKE for constants. Filenames: *.ts for logic, *.tsx for React; component files PascalCase.tsx.
- State/data: keep ECS types in src/lib/ecs (components, systems) following existing structure; avoid mixing rendering and ECS logic.
- Error handling: prefer narrowing and early returns. Never swallow errors; log with context or surface to caller. For async in UI, catch and set error state; avoid throwing in render.
- ESLint: configured via eslint.config.js with @eslint/js, typescript-eslint, react-hooks, react-refresh. Fix issues before commit. Consider upgrading to type-aware rules (see README.md “Expanding the ESLint configuration”).
- Formatting: follow ESLint rules and TypeScript defaults. 2-space indent, single quotes or consistent import quotes per eslint, trailing commas where valid ES allows. Keep files free of unused symbols.
- React hooks: obey rules-of-hooks, exhaustive-deps; memoize callbacks/values used by Pixi props to prevent unnecessary re-renders.
- Pixi: prefer @pixi/react components; isolate imperative Pixi API behind small wrappers; avoid direct DOM assumptions.

Repo automations/rules
- No Cursor/Copilot custom rules present. If added later, mirror key constraints here.
- Do not commit secrets. Never log tokens or keys. Use environment via Vite: VITE_* variables from .env (not committed).

Contribution flow
- Create small, typed modules; add unit tests with Vitest if you introduce logic-heavy code. Run: npm run lint && npx tsc -b before committing.
