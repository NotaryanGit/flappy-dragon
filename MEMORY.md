# Flappy Dragon Memory

The game is implemented as a single responsive HTML5 canvas experience in `GameCanvas.tsx`, matching the source brief's self-contained widget requirement. Generated art loads from lifecycle-safe `/manus-storage/...` URLs, and procedural fallbacks keep the scene playable if those images have not finished loading.

The start scene was visually verified at desktop width: the dragon sits to the right of the headline rather than obscuring the copy. The `?demo` flag auto-launches gameplay so the screenshot pass shows the dragon, moving pipes, score rail, ground strip, and flight hint. TypeScript checking passes. An old Vite log entry mentioned the removed inline SVG noise declaration; the stylesheet now uses a safe repeating-linear-gradient texture and subsequent HMR logs are clean.

The leaderboard intentionally uses localStorage because the current project is frontend-only and no backend feature was enabled. The UI and data shape are ready to swap to `/api/scores` later without changing the game loop.
