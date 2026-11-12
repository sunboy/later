# Brief: mascot concept sheet

## Goal
One self-contained HTML page, titled exactly "Later: mascot concepts", that lets the founder compare three mascot families side by side and see which one the UI lead recommends. He must be able to judge each at a glance: the chief and its crew, every state moving, small and large, on light and on dark.

## Read first
- `/home/user/later/design/ui-direction.md`, section 5.
- `/home/user/later/docs/architecture.md`, section 4h (the founder's words on the mascot).
- The first pass: `/home/user/later/design/mascots/concepts.html` and `mascots.css` (commit `a1c1a88`). Default: improve this file in place. Load the `artifact-design` skill before editing.

## The three concepts (do not change the ideas; improve the drawing)
1. **The Deck (recommended).** Chief "Keep" is a stack of three rounded cards with a folded top-right corner. Eyes are two vertical slots cut through the top card, filled with the surface colour behind. Crew are single cards with different cuts: Wren an index tab, Scout a clipped corner, Juno an arched top, Ledger a zigzag receipt edge.
2. **Floats.** Chief is a marker buoy on a waterline with a lamp; crew are smaller floats of different shapes.
3. **Hands.** Chief is two clock hands on a pivot inside a ring; crew are single hands on a dot.

## States, all eight, for each chief (CSS only, transform and opacity)
idle, listening, thinking, working, waiting on you, done, resting (later), error. For the Deck: idle breathes and blinks; listening lifts the fold and moves the two under-cards like a level meter; thinking shuffles the under-cards while the eyes look up; working narrows the eyes to a scanning dash and writes two lines; waiting raises a clay card behind the top card; done turns the second card citrus and closes the eyes into arcs; resting sinks behind a curved horizon, eyes shut, dimmed; error tilts the top card, one eye short, clay beneath. Each state must be recognisable in a still frame.

## Each concept shows, in a light panel and again in a dark panel
Chief at 168 px cycling through the states with the state name; chief at tab-bar size inside a mock tab bar; chief and four crew at 24 px; a grid of all eight chief states at about 58 px with labels; the four crew with names, each in a different state; one crew member assigned to a Space tile ("House move"). Then one verdict section: a comparison table on the criteria in ui-direction section 5 and the architect's list (uniqueness against Town, Grok Bot and Dots; 24 px and 200 px; chief and crew; states; assignment; cheap vector parts; trust beside money and mail), with the recommendation marked.

## Constraints
- Colours: Harbour only. Light: paper `#f7f3ee`, ink navy `#1f2a44`, clay `#b0532f`, citrus `#d6e46a`. Dark: surface `#121828`, body `#eeebe4`, clay `#e08a63`, citrus `#d6e46a`. Clay appears only for "waiting on you" and error; citrus only for "done".
- Type: Mona Sans and Martian Mono from Google Fonts, as in the prototype. No eyebrow headings, no tracked capitals, no pill chips.
- No aliens, animals, people or bare geometric figures. No gradients on the characters. No external images or libraries.
- `design/mascots/mascots.css` is the shared source for the Deck; `design/prototype-v3/src/mascot.css` is a copy. If you change the Deck's drawing or states, say so in your report so the prototype builder can copy it. Do not edit the prototype yourself.
- Reduced motion: all animation off, states still distinct.

## Known weaknesses of the first pass to fix
- The Deck's resting state reads as a grey block; make the sink behind the horizon obvious.
- The assigned crew card on the Space tile shows too little of itself.
- Floats and Hands are drawn more roughly than the Deck. They must be fair losers: bring them to the same finish.
- At 24 px, check the Deck's slots stay open on both themes.

## Verify (Playwright and Chromium are installed; do not install browsers)
Screenshots at 1440 and 390 wide; no horizontal page scroll; no console errors; every state visibly different in a still screenshot; text contrast at least 4.5:1; `prefers-reduced-motion` stops all animation.

## Publish
Artifact tool, `file_path` `/home/user/later/design/mascots/concepts.html`, `url` `https://claude.ai/artifact/4VHg8EV2nk5ozB3jDwb1eJ` (read it first, then publish to the same URL).

## Report back
The URL; screenshot paths (light panel, dark panel, 390 wide, the eight Deck states enlarged); what you changed from the first pass; any change to the shared Deck CSS; what you could not verify.
