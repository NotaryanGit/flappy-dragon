# Flappy Dragon artwork

The game uses three repository-owned native-transparent right-facing airborne PNG frames: `dragon-side-down.png`, `dragon-side-half-up.png`, and `dragon-side-up.png`. The canvas cycles them explicitly at runtime in a down → half-up → up → half-up loop, so wing movement is continuous and does not depend on animated-WebP playback. The same frame sequence drives the pre-flight mascot.
