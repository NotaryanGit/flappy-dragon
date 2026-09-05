# Flappy Dragon Structure

The React layer is the picture frame and owns the top-level mount. `client/src/components/GameCanvas.tsx` owns the canvas lifecycle, input listeners, render loop, overlays, and local leaderboard UI. Gameplay state is kept in plain objects inside the component so the loop remains responsive and independent of React rerenders.

The game uses a 2D HTML canvas because the source brief explicitly calls for a self-contained HTML5 Canvas widget. The generated dragon sprite and sky texture are loaded as optional art layers; procedural shapes remain as an intentional fallback so the game is still playable while generated assets are loading. `client/src/App.tsx` renders only the game route. `embed.js` exposes a lightweight `mountFlappyDragon` helper for a plain HTML host.
