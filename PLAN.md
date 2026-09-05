# Flappy Dragon Build Plan

## Core gameplay
- Start screen with clear tap/click/Space instruction.
- Playing state with gravity, flap impulse, tilt, pipe spawning, collision, score, best score, and scrolling ground.
- Game over state with retry, score summary, and leaderboard panel.
- Deterministic `?demo` mode for visual verification.

## Risk slices
1. Canvas sizing and input lifecycle across mouse, touch, and keyboard.
2. Stable frame loop and collision math.
3. Generated art loading with graceful fallback drawing.
4. Responsive overlay composition at desktop and mobile widths.
5. Local leaderboard persistence and safe name handling.

## Verification criteria
- First screenshot shows a clearly playable start screen with dragon art and game framing.
- `?demo` screenshot shows the dragon in motion, pipes, score, and scrolling world.
- Game over can be reached and retry works.
- Leaderboard accepts a short player name, persists top scores in localStorage, and renders without backend dependency.
- `pnpm check` passes.
- Reduced-motion preference removes nonessential UI motion.
