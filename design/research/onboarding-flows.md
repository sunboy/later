# Onboarding flows: research, diagnosis and storyboard

Research for the Later front door, November 2026. Sources: the Appllama library of revenue-ranked iOS apps, walked screen by screen with every image viewed and the onboarding videos sampled frame by frame (2 frames a second). Downloads stayed in the session scratchpad and are not in this repository. This file is text only: it describes what screens do, and it does not reproduce their wording. Screen ids are Appllama ids (`app id / screen id`), so any screen can be looked up again.

Credits: 1361 before, 1241 after (120 spent).

Word counts are approximate (the visible words on the screen, excluding the status bar and system dialogs).

## 1. Apps walked in full

| App | Appllama id | Need it covers | Screens in onboarding (welcome + onboarding) |
|---|---|---|---|
| Duolingo | 570060128 | mascot-led, the reference for pacing | 3 + 32 |
| Finch | 1528595748 | mascot-led, the pet's birth as the reveal | 3 + 41 |
| Headspace | 493145008 | concept taught by doing, a character in a sky scene | 5 + 16 |
| Copilot Money | 1447330651 | account connection, read-only promise | 2 + 10 |
| Monarch | 1459319842 | account connection (weak reference) | 3 + 6 |
| ChatGPT | 6448311069 | AI assistant, value before the ask | 2 + 15 |
| Friends (Pengu) | 6462927800 | mascot-led, character fills the screen | 3 + 6 |
| Calm | 571800810 | shortest dark flow | 3 + 2 |
| Rocket Money | 1130616675 | connection drawn as an orbit, sample alerts | 3 + 17 |
| Duolingo ABC | 1440502568 | waiting state performed by the mascot | 3 + 10 |
| Tolan | 6477549878 | AI companion, dark, sound hinted, the wait as a show | 4 + 18 |
| Claude | 6473753684 | AI assistant, a mark that acts | 1 + 7 |
| Spark Mail | 997102246 | mail connection, concept carousel, staged ready screen | 26 |
| Opal | 1497465230 | dark, object as character, staged number reveal | 29 |
| Clash Royale | 1053012308 | forms floating over a living scene | 3 + 4 |
| Gizmo | 1610516671 | AI with a mascot, permissions as a checklist | 5 + 10 |
| Falou | 1460579936 | mascot in action, story held on one illustration | 31 |
| Fantastical | 718043190 | permissions checklist, calendar connection | 10 |
| Bites | 6475324072 | AI with a mascot that rises out of a hole | 4 + 20 |
| Wysa | 1166585565 | AI companion, typed voice, privacy on the asking step | 2 + 7 |
| Pingo AI | 6738882620 | a crew of four coloured characters | 3 + 16 |
| (Not Boring) Habits | 1593891243 | dark, wordless object beats, narrated wait | 10 + 13 |

Targeted screen sets, beyond the full walks: loading and waiting screens (about 20 apps), pairing a second device (PDF Expert, WhatsApp, Alfred, Runna, OurPact), "your plan is ready" reveals (Keiki, Hanzi, Betterment, Kids360), privacy promises (May, Chart AI, ShutEye), swipe tutorials (Productive, Herbi), calendar connection (Jamie, Timepage), sound announcements (Sparrow, Hearing Buddy), cards on dark grounds (Astroscope, Nebula, Moonly), and the motion of Superlist's and Sorted's onboarding videos.

## 2. Beat by beat

### Duolingo (570060128), 35 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_qzhwp | Splash: the owl's face fills half the width on full green | 1 | Face blinks | Nothing | The brand is a face, not a logo |
| spl_7vdk2 | Welcome: owl a quarter of the height, wordmark, short tagline, two stacked doors | ~8 | Owl idles | Picks new or returning | The two doors on the very first screen |
| onb_5m5dr | The owl greets you in a speech bubble | 4 | Bubble text types on | Continue | The character speaks before anything is asked |
| onb_ox1ln | Sets the length: a handful of questions before the first lesson | ~10 | Owl holds a clipboard | Continue | Expectation set in one line; the pose acts out the step |
| onb_2fasx to onb_l0chn | Questions asked by the owl, small at top left, with list rows | 6 to 10 | Bubble types; progress bar grows | Picks a row | Every question has a speaker |
| onb_4lm1v | Reaction beat after an answer | ~5 | Owl reacts | Continue | Acknowledgement: the character heard you |
| onb_5mcra | Building your course | ~10 | Owl reads, line fades in | Waits | The wait is acted by the character |
| onb_yzz8f, onb_v2a21 | Notification primer: mock dialog, arrow to Allow, then the real one | ~15 | Arrow bobs | Allow or Not now | The ask is rehearsed in the app's voice first |
| onb_n91os, onb_73umy | "Here is your first lesson", the owl with a lightbulb, large | ~8 | Sparkles | Start | The first value arrives within about 25 taps |
| onb_nsrjz, onb_8tasg | First word learned: a huge sticker stamps in; the owl jumps | ~4 | Stamp scales and pops | Continue | A physical reward with weight |

### Finch (1528595748), 44 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_7wts0 | Welcome; the one action is a verb from the product's world (hatch) | ~7 | Pet idles | Taps the verb | The CTA is part of the story |
| onb_ac3iv | Choose an egg: six coloured eggs around a grey bird | ~4 | Eggs wobble | Picks a colour | First interaction on the second screen, and it shapes the character |
| onb_f3u5m | The egg cracks, filling 40% of the screen | 0 | Cracks spread | Waits | Anticipation |
| onb_ijaxd | Birth reveal with a radial light burst | 4 | Burst rotates | Continue | A payoff before any form |
| onb_isxwd and after | Traits change the pet (it holds a heart, and so on) | ~8 | Pet changes pose | Picks traits | Every choice gets an immediate visible reaction |
| onb_vpgnl | The pet speaks in chat and asks your name; a stat toast appears | ~10 | Bubble, toast | Types a name | The character's voice carries the form |
| onb_d8kb6 | A ring loader around the pet while goals are made | ~6 | Ring fills | Waits | The character is inside the loader |
| survey run (about 14) | Long white survey with question marks over the pet | 15 to 30 | Very little | Taps rows | Weakness: length and white forms; the pet shrinks to 10% |

### Headspace (493145008), 21 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_n4l67, spl_zzdlf | Splash as a breath: the orange character rises from the bottom, then sinks | 2 each | Rises about 2 s, sinks about 2 s | Nothing | The splash is a tiny experience of the product |
| spl_6y1mt | Welcome on a full-bleed sky with the character at a third of the screen | ~8 | Clouds drift | Log in or sign up | A scene, not a page |
| onb_6xeao | Account step reframes the same world in a new sky colour | ~6 | Character smiles | Signs up | Each screen is a new framing of one world |
| onb_9xd9e to onb_ykqbv | Three-dot carousel of promises | 25 to 35 | Little | Swipes | Weaker: wordier, collage |
| onb_w0ot0 | Reminder ask: the character, 45% of the screen, holds a notification | ~12 | Eye peeks | Remind me or Maybe later | The permission is held by the character |
| onb_bxarh to onb_glqd6 | First exercise: the sky metaphor taught in two screens, then three breaths | ~6 a screen | Clouds, ring timer | Breathes | The concept is taught by doing, in very few words |

### Copilot Money (1447330651), 12 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_96hsq | Welcome over a dark isometric city; a demo escape at top right | ~6 | City pans | Sign up or demo | Rich dark scene; an escape hatch from screen one |
| onb_ygga6 | Waits while you verify in your mail app: mailbox and spinner | ~10 | Spinner | Leaves and returns | Honest about a step that happens elsewhere; auto-advances |
| onb_b2r8h | Link accounts, with the read-only promise in the subtitle | ~20 | Nothing | Links or tries demo | Trust stated on the asking step |
| onb_buhet | Explains why, with a graceful skip | ~25 | Sheet rises | Continue or skip | Skipping is respected |
| onb_df3xt | A sample alert above the notification toggle | ~15 | Nothing | Toggles | Shows what will arrive before asking |
| forms | Grey account and security forms | 20 to 40 | Nothing | Types | Weakness: the colour and character vanish after the welcome |

### ChatGPT (6448311069), 17 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_3kbv8 | Welcome with three plain honesty rows | ~60 | Nothing | Continue | Trust up front (but too many words) |
| onb_li26u, onb_opo2u | Use it as a guest; the answer streams in | ~15 | Text streams | Asks something | Value before any account |
| onb_b7a1a | Sign-in sheet rises only after value | ~10 | Sheet | Signs in | The ask follows the payoff |
| onb_reqny | A two-word title with the brand's pulsing dot | 2 | Dot pulses, text types | Continue | The mark behaves like a character |
| onb_t7upr | Notification ask framed around the assistant's work being finished | ~15 | Nothing | Allow | Permission tied to the assistant's job |

### Friends, Pengu (6462927800), 9 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_qpf7f | Full-bleed 3D scene; the penguin in the foreground fills half the screen | 1 | Parallax loop | Nothing | The world first |
| spl_dhumy | Sign in over a meadow; three characters fill about 65% of the screen | ~8 | Characters idle | Apple or Google | Characters dominate; buttons sit over the art |
| onb_r8aoa, onb_ipwoa | Age, with progress as a row of hearts | ~5 | The penguin blinks and winks | Picks | Character-themed progress; the mascot reacts |
| onb_ec9yc | A notification in the character's voice | ~10 | Nothing | Turn on or Maybe later | The ask sounds like the friend |
| onb_wimz1 | Share card for your first pet | ~6 | Nothing | Shares | Payoff in six screens |

### Tolan (6477549878), 22 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_fwdhq | Dark starfield, wordmark, one round arrow, no text button | ~4 | Stars drift | Taps the arrow | One persistent control |
| spl_lmvme | A lush alien scene; the character plays guitar at 45% of the screen; a small volume glyph sits under the arrow | ~4 | Character strums | Taps | Sound is announced in one glyph, not assumed |
| onb_3hnz9, onb_jinvo | Narration in caption pills at the bottom, one line at a time | ~8 a caption | Captions change every 2 s | Listens | Voice instead of headlines |
| onb_basmk to onb_1qey3 | The camera flies through space; a particle figure fills 60% | ~8 | Camera, particles | Taps | Cinematic, but still one idea a beat |
| onb_e1jgd | Notification primer: a card with a character peeking over its edge | ~10 | Peek | Allow | The character holds the ask |
| onb_no9p9 to onb_omz4d | Matching: a ring of lights orbits while captions explain | ~10 | Orbit | Waits | The wait is the show |

### Spark Mail (997102246), 26 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| onb_fwp5k | Sky gradient with the mark at a quarter of the screen; email field | ~8 | Nothing | Types or picks Google | Calm ground for a sensitive ask |
| onb_nf0xf to onb_1rjyi | Five concept beats, each one tilted floating card | ~15 each | Cards drift | Swipes | One object per concept |
| onb_xe27x | Verifying, a spinner on the sky | ~3 | Spinner | Waits | The ground stays while auth happens |
| onb_bdyn8, onb_x7ub4 | A statement in a bubble with a big cross and tick | ~12 | Nothing | Agrees or not | Two-tap personalisation |
| onb_9wm27 | Ready: three rows tick one by one | ~12 | Ticks land in sequence | Waits | The work is staged as a reveal |

### Opal (1497465230), 29 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| onb_j01b2 | Black screen, a rough rock at a third of the screen, tap to continue | 2 | Rock idles | Taps the scene | First interaction on screen one |
| onb_u92lp, onb_im9zk | The rock zooms, cracks, a glowing gem appears | ~10 | Zoom, crack, bloom | Taps | Anticipation, action, reveal |
| onb_25n4j | The gem speaks in the first person | ~6 | Glow breathes | Continue | An object becomes a character through light and voice |
| onb_5rl7x to onb_1xuyp | A conversation without bubbles; lines type in and old ones fade up | ~8 a line | Typing | Picks answers | Narrated voice carries the questions |
| onb_a2e80 | Permission primer: mock dialog, drawn arrow, a stays-on-your-phone line | ~20 | Arrow | Continue | Trust on the exact step |
| onb_if7uc, onb_0m8b4 | A pause beat, then numbers roll like a slot machine | ~8 | Numerals roll | Waits | The reveal is staged: pause, then roll |

### Wysa (1166585565), 10 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_wqjtq | Mascot centre; the greeting types on letter by letter; the arrow fades in last | ~10 | Typing, then the CTA | Taps the arrow | The control waits for the voice to finish |
| onb_av3fb | Asks a nickname; the privacy promise sits on this step; the mascot peeks over the field | ~20 | Peek | Types | Trust where it is needed, character next to the input |
| onb_3anna | Notification ask: a bell inside orbit rings, first-person voice | ~20 | Orbit dots | Allow | The ask is in the character's words |
| onb_6vpm5 | First chat on teal-navy with quick replies | ~30 | Messages arrive | Taps a reply | Lands in the product, talking |

### Bites (6475324072), 24 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_p17z9 | A dark oval hole on white | 0 | Nothing | Waits | Anticipation with nothing but a shape |
| spl_kms7e | The mascot's ears pop out of the hole | 0 | Ears pop | Waits | Action |
| spl_vbbbu | The mascot rises, confetti, welcome | ~8 | Rise, confetti | Starts | Reaction; the whole arc in three beats |
| onb_brutz | The mascot inside the app icon; feature tags orbit it | ~10 | Orbit | Continue | The product as a character at the centre of its powers |
| onb_222qc | All set: the mascot in sunglasses | ~4 | Pop | Continue | A character payoff |

### Pingo AI (6738882620), 19 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_5b9s2, spl_l2uwb | Four coloured dots pop in one by one, gain eyes, a cursor blinks | ~5 | Pop, blink | Nothing | A crew of four, told apart by colour alone |
| onb_qwjzf | Creating your plan: three rows tick green | ~12 | Ticks | Waits | Staged work |
| oth_nxgmu | Home: the four blobs centre stage with a single task | ~8 | Blobs idle | Starts the task | The crew lives on the first real screen; one thing at a time |
| survey | Plain white survey | 10 to 20 | Little | Taps | Weakness: the crew vanish during the questions |

### (Not Boring) Habits (1593891243), 23 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_akip4 to spl_z1otp | Nine wordless beats on black, one lit 3D object each, shards flying | 0 | Each object drops, rotates, shards burst, about 1.2 s a beat | Can skip | A whole intro with no words |
| onb_yi5fz to onb_akcx4 | One sentence a tap, embers drifting; the scene builds | ~8 | Embers | Taps to continue | Tap-to-advance narration |
| onb_1kbx2, onb_1m143 | Plotting your journey: a walking figure and a caption that changes every second | ~6 | Walk cycle | Waits | The wait told as a tiny story |

### Gizmo (1610516671), 15 screens

| Screen | What it does | Words | What moves | What the user does | What makes it good |
|---|---|---|---|---|---|
| spl_9ausw, spl_33tg6 | The mascot jumping, then asleep: poses as states | 0 | Hop | Nothing | States drawn as poses |
| spl_zm1gj | Welcome with the mascot at 30%, three doors | ~8 | Hop, blink | Picks a door | Doors under a living character |
| onb_akr12 to onb_gjxi9 | Every question attributed to the mascot by name | ~10 | Little | Picks | A speaker for every question |
| onb_sqc16, onb_sz02r | Permissions as a checklist that fills; the CTA enables when done | ~15 | Ticks | Grants each | Progress you can see on a sensitive step |

## 3. Synthesis

**Pacing.** The strong flows change something every 1 to 2 seconds while you watch, and ask for a tap every 2 to 4 seconds. Concept beats last about a second and a half (Not Boring, Superlist). The first real value lands between 5 taps (Calm) and about 25 (Duolingo). The long flows (Finch at 41, Opal at 29) survive only because the character reacts to every answer.

**Words per screen.** The best concept screens carry 1 to 8 words: Headspace about 6, Pengu 3 to 6, Calm 1 to 4, Not Boring none. Screens that pass 20 words (Headspace's carousel, ChatGPT's welcome, Monarch everywhere) are the ones nobody remembers. Explanations that must exist go behind a link or into one line on the step that needs them.

**How much of the screen the character occupies.** On the screens that sell, a third to two thirds: Pengu about 65%, Tolan 45 to 60%, Headspace 35 to 45%, Opal's gem 35 to 45%, Finch's egg 40%. When the mascot shrinks to a corner avatar (Duolingo and Falou surveys, Finch's survey) the screen turns into a form, and those are the weakest screens in each flow.

**Colour and illustration.** Every strong flow is full-bleed: a sky, a ground, a world. The ground carries the emotion (Calm's breathing gradient, Headspace's skies). Dark flows succeed with one glowing accent on a deep ground (Opal green, Not Boring amber, Tolan warm). Superlist and Headspace change the ground colour per beat, so colour itself is the transition. Nobody uses grey on white for a concept beat.

**Where the first interaction comes.** Screen one or two: Opal's tap on the rock, Finch's egg, Tolan's arrow, Not Boring's tap-to-continue. The first tap is on the scene, not on a form, and it causes something to happen to the character.

**Progress.** Themed, never a "Step n of m" counter: Pengu's hearts, Finch's section ticks, Gizmo's filling checklist. The weakest flow (Monarch) is the one with a text counter.

**How permission and connection asks are framed.** Four patterns repeat: the character holds or peeks over the ask (Headspace, Tolan, Wysa); a sample of what will arrive comes before the toggle (Copilot, Rocket, Pengu); the trust promise sits on the exact step that asks (Wysa, Opal, Copilot); a step that happens elsewhere is drawn honestly with the app waiting calmly (Copilot's mailbox, Claude's envelope, PDF Expert's laptop with a code, Alfred's two devices joined by a dotted path). There is always a graceful skip.

**How the reveal is staged.** Pause, then show: Opal's pause and slot roll, Spark's rows ticking one at a time, Finch's crack then burst, Bites' hole then ears then rise, Nebula's card of the day face down before it is turned. The reveal always has its own beat and its own sound-worthy moment.

**How sound and haptics are hinted.** Lightly. Tolan puts one volume glyph under the CTA; Sparrow and Hearing Buddy give sound its own beat because their product is sound. Nobody plays audio before a tap. The motion carries the rhythm that sound would punctuate: stamps, pops, ticks landing.

**How waits sell.** The character performs (Duolingo ABC's singing, Duolingo's reading owl), the wait is narrated (Not Boring, Tolan), or the work is staged as rows ticking (Spark, Pingo). Bare spinners on blank screens (Huckleberry, Steppa, Remodel, Rocket between steps) sell nothing.

## 4. What the weak flows do wrong

- **Forms on white after a rich welcome** (Copilot, Monarch, Finch's survey, Pingo's survey): the world disappears exactly when the user is asked for something.
- **Walls of words** (Monarch's social proof, ChatGPT's welcome rows, Remini's legal page, Falou's 30-word story captions).
- **The mascot as a corner avatar**: it is present but does nothing, so it reads as decoration.
- **Counters instead of progress** ("Step 3 of 6").
- **Spinners that sell nothing** between steps.
- **Celebrating nothing** (Rocket's full-screen congratulations after a single tap): reward without work cheapens the real payoff.
- **Explaining before showing**: concept carousels with paragraphs, where the strong flows act the concept out.

## 5. Ten rules for the Later front door

1. **Every screen is a scene.** A sky, a horizon and a ground, full-bleed, in colour. No floating card on empty grey. Taught by Headspace spl_6y1mt and onb_6xeao, Pengu spl_dhumy, Clash Royale onb_4btsm.
2. **Keep fills a third of the screen or more on every concept beat.** A corner avatar is a form. Taught by Pengu spl_dhumy (65%), Tolan spl_lmvme, Finch onb_f3u5m, and by contrast Duolingo onb_2fasx and Finch's survey.
3. **One idea, eight words or fewer.** Anything longer goes behind a link. Taught by Headspace onb_bxarh, Calm spl_sy5n4, Not Boring spl_akip4, and by contrast Monarch onb_qp5uc.
4. **The first tap is on the character, in the first two screens, and it makes something happen.** Taught by Opal onb_j01b2, Finch onb_ac3iv, Tolan spl_fwdhq.
5. **Anticipation, action, reaction, on every beat.** Something gathers, something happens, the character reacts. Taught by Bites spl_p17z9, spl_kms7e, spl_vbbbu, and Opal onb_u92lp to onb_im9zk.
6. **Teach by doing.** Each concept is a gesture the user performs on a card (tap, flick, hold), never a paragraph. Taught by Headspace onb_bxarh to onb_glqd6, Herbi onb_itm2s, Not Boring onb_yi5fz.
7. **Colour is the transition.** Each concept beat gets its own ground within the palette; the change of colour carries the cut. Taught by Superlist onb_yu6xt and Headspace onb_6xeao.
8. **The ask sits in the scene, with the character holding it and the promise on the same step.** Connection steps show what happens elsewhere honestly (the computer, the second device joined by a dotted path). Taught by Wysa onb_av3fb, Tolan onb_e1jgd, PDF Expert oth_4zdfv, Alfred onb_y6l4y, Copilot onb_b2r8h.
9. **The wait performs, and the reveal is staged.** Reading is the crew at work in orbit around Keep with a spend ring; what Keep found is dealt face down and turned one card at a time. Taught by Tolan onb_no9p9, Not Boring onb_1kbx2, Spark onb_9wm27, Opal onb_0m8b4, Nebula oth_4492b.
10. **Sound is announced, started by the first tap and synced to what lands.** One volume glyph on the title, a visible switch on every scene, and a sound on the frame a card lands, never in a loop. Taught by Tolan spl_lmvme, Duolingo onb_nsrjz (the stamp), Not Boring spl_akip4 (each object lands on a beat).

## 6. Diagnosis of the current front door

Viewed in headless Chromium at 390 and 1440, Harbour dark and light, every step (screenshots in the scratchpad, not committed).

The caller's hypothesis is right, and it is slightly worse than "sparse":

- **It is a wireframe.** Nine of the ten screens are a 28 px headline at top left, a line of grey text, and a form or a box. The middle 50 to 60% of the phone is empty paper. There is no ground, no horizon, no depth, no light. Dark is one flat navy; light is one flat grey-white.
- **Keep is a corner avatar.** Outside the title, Keep is 56 px in the top-left corner (about 7% of the screen's height) with the crew as 32 px chips beside it. Every lesson above says this is the size at which a mascot stops being a character. On the doors screen the hand is the biggest it gets, still under 20%.
- **The story does not tell a story.** The first concept beat shows two blank, outlined cards in the middle of an empty screen under a small headline. Nothing gathers, nothing happens, nobody reacts. The concept is stated, not acted.
- **No colour.** Clay appears only as a sliver behind Keep; citrus once, on the last screen. The palette's three meanings (needs you, crew, done) are never taught by the scenes.
- **Type that just sits there.** Headlines are left-aligned at the top, the same size on every screen, with no entrance, no rhythm, and no relationship to the picture.
- **Set-up is forms.** Mail, calendar and the school list are white rounded boxes with inputs, numbered rows and a brand-name checklist: exactly the pattern of the weak flows.
- **Waits sell nothing.** Reading shows four empty tiles and a thin meter; the reveal is a grid of four small white cards with crosses. Neither is staged.
- **No build of anticipation.** No beat holds back to deliver a payoff. The citrus "done" moment is a 5 px ring flash on a small card.
- **Sound has no visible relationship to motion.** There is a switch, but nothing lands on screen with enough weight to deserve a sound.

What is worth keeping: the facts (two doors, set-up on the computer, app password, private calendar link, by the emails they send, a capped first pass, routines paused), the Deck mascots and their states, the Web Audio synth, and the chrome API.

## 7. Storyboard (second pass: "Say later. It comes back ready.")

The first pass (horizon scenes acting out six ideas on blank cards) was judged lifeless: a stranger read it as "a cute inbox sorter with a snooze". The premise work in `premise/` replaced the content and kept the craft. Full reasoning: `premise/cold-read.md`, `premise/openings-teardown.md`, `premise/premise-and-script.md`, `premise/interaction-concepts.md`.

**Premise.** Everyone says "I'll do it later" and it rarely happens. Later is a personal AI agent that makes "later" a promise kept: you hand it a thing, it comes back at the time you chose, with the legwork done and waiting for your yes.

**Rules for this pass.**
- Keep speaks in the first person from the first screen, in speech bubbles, in the voice of `premise-and-script.md` section 2 (plain, exact, brief, owning, dry).
- The user's own words are on screen within twenty seconds. Every interaction acts on something of theirs.
- Doing verbs: find, compare, draft, chase, book. No sample emails before set-up.
- Before set-up there is no model. Anything "smart" is simple rules on the phone, and Keep says so.
- Each scene has its own composition and colour.
- The crew have fixed jobs everywhere, intro and app alike: Wren answers mail, Scout books and chases, Juno finds and compares, Ledger checks the money.

### The intro

| # | Scene | Keep says (exact words) | The user does | What they get back | Composition and sound |
|---|---|---|---|---|---|
| 1 | Title | (wordmark) Later. Say later. It comes back ready. | Taps (sound starts) | Keep climbs out of the horizon | Night sky; rise on the tap |
| 1b | Hello | I'm Keep. I'm an AI. / I hold on to things until they're due. My crew does the legwork. / What should I call you? | Types a name, or skips | Keep uses the name from now on | Speech bubble over a large Keep; a soft tick per word as it types on |
| 2 | Ask | (Nice to meet you, Sam.) What have you been putting off? | Types or dictates one thing; or taps one of three suggestions: Renew the car insurance, Reply to the school about the trip, Book the dentist | Their words written on a big blank card | Warm clay dusk; the card is the hero, Keep holds out its hand at the side |
| 2b | Hand over | Got it. That's off your mind and on mine. | Flicks the card up to Keep (or taps Hand it over) | Keep catches it and its fan thickens | Whoosh, then a thup as Keep catches |
| 3 | The plan | Ledger checks the money. This one's for Ledger. / (unclassified) I can't tell what kind of job this is yet. I'll keep it and ask you one question later. | Reads; taps Next | The crew member is dealt and holds the card; three legwork steps write on, labelled Plan; any date, person or amount found is shown back as a chip; a caption says: Simple rules on this phone for now. The legwork starts once I have a home. | Navy; the crew member is large beside the card; a tick per line written |
| 4 | When | When do you want it back? | Picks Tonight 19:00, Tomorrow 08:30, Saturday 10:00, or a time | The card sinks under the horizon with its time on it. Keep: Later. And I mean it. Caption: Until I have a home, it comes back when you next open me. | Dusk turning to night as it sinks; the later swoop |
| 5 | More | Anything else on your mind? | Adds up to four more in one line each, or That's all for now | Each line becomes a card, is dealt to a crew member and sinks with a time; Keep counts: 3 things off your mind. | Dawn; Keep's fan thickens per card; the count is large |
| 6 | Terms | I'll get things wrong sometimes. So nothing is sent, paid or deleted without your yes. | Holds the practice button on the approval form for their own first card | The form: When the legwork is ready, a yes looks like this. Then: Only practice. Nothing was sent. A Carry on button appears; nothing advances on its own | Citrus glow; hum while held |
| 7 | Doors | To do the legwork, I need a home. Yours, not ours. / About ten minutes on a computer: your Cloudflare account and your Anthropic key, billed to you up to a cap you set. | Set up my home / I already have Later / Look around first | Their cards wait under the horizon, each with its return time | Day; the ground holds their cards |

About 80 of Keep's words, plus the user's. Shortest path, as built: the title tap, a tap past Keep's second line, Skip the name, a suggestion, Hand it over, Next, a time, Carry on, That's all for now, the hold, Carry on: 11 taps and about 40 seconds to the doors, most of it Keep speaking and the cards moving.

### Set-up: every step names what it gives back

| Step | Keep or the crew say | What comes back |
|---|---|---|
| Computer | Set me up on a computer. / Open later.sh/go there and type this code. Your 3 things are safe on this phone. | Paired. Your 3 things are moving in. The dotted path lights card by card. Your key is capped at $60 a month. |
| Mail (Wren) | Can Wren read your mail? / To find what's open and draft replies, starting with "reply to the school". Nothing is sent or deleted without you; remove the app password to stop. | Wren shows two finds (example data, marked in the chrome) |
| Calendar (Scout) | Can Scout see your calendar? / To find free times and spot clashes, starting with "book the dentist". Read only; delete the private link to stop. | You're free Saturday morning. |
| School apps (Juno) | Only if a card mentions school or nursery: Juno can read the school's emails too. | Juno is watching for them. |
| Reading | I'm reading your recent mail, newest first. | Finds narrated as they land: Found a renewal date. Found who Priya is. The cap is small: $0.42 of $1.00. |
| What I found | Here's what I found. | Spaces with evidence and a first job each (example data); an editable list headed Here's what you told me. A Space you flick away stays gone in the app. |
| First deck | You said later. Here it is. | Their own first card is dealt first, its plan marked done and in progress (an example result), then two more. |

**Welcome back.** On the next open after a return time, or when Time passes is pressed in the chrome, Keep brings the card up: You said later. Here it is.

**Errors kept:** the computer goes quiet, the code expires, the wrong app password.

**Fixed from the cold read:** a card that is drawn is always live (tapping it does what the button does); the practice yes never skips its confirmation; a flicked-away Space stays gone in the app; mail is Wren's in the intro and in the app.

### Cold read of the second pass

Read as a stranger, at 390 in Harbour dark, on the typed path ("Call Priya about Saturday").

- **After 20 seconds** (title, then Keep's three lines): "An AI called Keep that holds on to the things I keep putting off until they're due, and has a crew that does the legwork for them."
- **After the intro** (to the doors): "I told it to call Priya about Saturday. It gave that to Wren, who answers my mail, with a plan: find my messages with Priya, draft the message, hold it for my yes. It comes back tonight at 19:00. It won't send, pay or delete anything without my yes. To actually start, it needs a home in my own account."
- **Verdict:** a personal AI agent that takes things off my plate and brings them back with the legwork done, waiting for my yes. "Done" is deliberately "ready for your yes".

What still reads weakly:
- Before set-up nothing real happens. The plan is honest but static, and the payoff (the first deck) uses example legwork.
- Mail and calendar still ask for an app password and a private link. The words around them are now human; the steps themselves are not.
- The reading, the Spaces and the finds are example data. The chrome says so, the phone does not, as briefed.
