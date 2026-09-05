# Flappy Dragon — Design Direction

## Three stylistic approaches

### Theme Name: Storybook Ember Sky
Very warm illustrated arcade fantasy with tactile paper texture, painterly clouds, and a tiny dragon as the emotional anchor.
Probability: 0.06

### Theme Name: Alpine Clockwork Flight
A playful brass-and-ink mechanical world with clock towers, blueprint marks, and crisp retro instrument panels.
Probability: 0.03

### Theme Name: Moonlit Moss Arcade
A twilight forest canopy with bioluminescent flora, deep indigo air, and quiet luminous gameplay cues.
Probability: 0.08

## Selected approach: Storybook Ember Sky

### Design Movement
Contemporary storybook illustration fused with 1960s arcade poster composition: expressive silhouettes, tactile brush texture, and big readable shapes.

### Core Principles
1. Every gameplay cue should read instantly at a glance.
2. Warm texture and imperfect hand-inked edges should make the world feel crafted.
3. The dragon is the hero; interface chrome stays quiet and supportive.
4. Motion is snappy, physical, and a little theatrical without slowing play.

### Color Philosophy
Use an ember-orange signature against a cooling sky gradient. Apricot and coral create lift and energy; dusty violet mountains create depth; cream parchment panels provide a calm, tactile counterpoint for scores and instructions.

### Layout Paradigm
A full-bleed playfield framed by an offset parchment control rail on wider screens. The HUD sits in the sky as a small floating score ribbon, while menu and leaderboard cards overlap the lower edge like a printed game poster.

### Signature Elements
- Ember-orange tab corners and dragon wing accents.
- A faint paper grain and ink speckle overlay.
- Small “flight log” labels that make score and best-run information feel collectible.

### Interaction Philosophy
Tap, click, or press Space anywhere in the playfield. The interface gives immediate tactile feedback with a tiny scale response, short button press animation, and celebratory score stamp on new bests.

### Animation
The dragon tilts up into each flap and eases into a nose-down glide. Clouds and ruins scroll at two speeds. UI entrances use short spring-like opacity/translate transitions; reduced motion removes nonessential bobbing and drift.

### Typography System
Display: Fraunces 700/800 for storybook headlines and score numerals. Body: DM Sans 500/700 for controls and utility labels. Use uppercase tracking only for tiny metadata labels.

### Brand Essence
Flappy Dragon is a quick, replayable sky-arcade for players who want a charming challenge with more personality than a generic endless runner. Personality: spirited, handcrafted, cheeky.

### Brand Voice
Headlines are short and mischievous. CTAs are active and specific. Microcopy sounds like a tiny flight school logbook.
Example lines: “Keep your wings clear.” / “One more run. The clouds are waiting.”

### Wordmark & Logo
A compact flame-wing emblem: two curved wing strokes orbit a small ember diamond. It should work as a standalone favicon and as a stamped mark beside the Flappy Dragon wordmark.

### Signature Brand Color
Ember Orange — `#E96F45`, used for wing membranes, primary action states, and the live score accent.

## Style Decisions
- Prefer asymmetry over a centered dashboard layout.
- Keep the playfield visually dominant; controls should feel like printed labels.
- Use warm sky colors rather than neon or purple gradients.
- Keep the game readable at 360px wide and playable by keyboard, mouse, and touch.
