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

## 7. Storyboard

The world: one horizon, the brand's own line. Above it is now; below it is later. Keep stands on the horizon. Things that can wait sink below the line and rise back. Each concept beat has its own sky within Harbour: clay for the pile that needs you, navy for the crew, deep night for later, a citrus glow for yes. Designed dark first; light keeps the same composition on pale skies with ink characters.

Composition, 390 × 844: the sentence sits in the upper sky, centred, 32 to 36 px. Keep stands on the horizon at about 58% of the height, 200 to 230 px tall (a quarter of the height, over half the width). The crew are cards of their own cut, each with its own colour from the palette family (Wren clay, Scout citrus, Juno periwinkle, Ledger sand) and dark eyes, so they read apart at any size. The ground below the horizon carries the controls. A sound switch sits top right on every scene; concept beats show five small card pips as progress, set-up shows the crew standing on the horizon as they are dealt.

| # | Screen | One idea | The sentence | Composition | What Keep does | The user's action | Sound | Reference pattern |
|---|---|---|---|---|---|---|---|---|
| 1 | Title | Later is a place things go and come back from | Later | Night sky, glowing horizon line, wordmark above | Climbs up out of the horizon, blinks, fans | Tap anywhere (a small volume glyph under the hint) | The tap unlocks audio; a rise as Keep hops | Bites spl_p17z9 to spl_vbbbu, Tolan spl_lmvme |
| 2 | The pile | Life sends you a lot | Life sends you a lot. | Clay dusk sky; a dozen glyph cards fall onto Keep | Braces (anticipation), gets buried and knocked askew (action), peeks out (reaction) | Tap to continue | A tick as each card lands, rising in pitch, then a thump | Not Boring spl_akip4, Superlist onb_yu6xt |
| 3 | The crew | Keep and the crew sort it | Keep and the crew sort it. | Navy sky; four crew cards along the horizon; the pile above Keep | Shuffles (thinking), deals four crew out of the fan, then the pile flies to them in four stacks; snaps wide open (done) | Tap Keep | A deal per crew card, a stepped deal per card sorted, then done | Pingo spl_5b9s2, Finch onb_ac3iv (tap the character) |
| 4 | Only what needs you | You see only what needs you | Only what needs you. | The stacks sink below the horizon; one clay card rises, large, centre | Leans and looks at the card (waiting) | Tap the card: it turns over to citrus | A sink, a rise, then done | Nebula oth_4492b, Spark onb_9wm27 |
| 5 | Later | Not now? It goes to later and comes back | Not now? Flick it down. | Night falls as the card sinks under the horizon; a moon arc; then the card rises again at dawn | Sinks to half height (rest), then pops back up | Flick the card down (or tap Later) | The later swoop, then the back chime as it returns | Headspace spl_n4l67 (rise and sink), Herbi onb_itm2s |
| 6 | Your yes | Nothing leaves without your yes | Nothing leaves without your yes. | Navy sky with a citrus glow on the horizon; a send card held in front of Keep | Listens with its dog-ear up, then snaps open as the card flies | Press and hold the yes button; afterwards the line says it was only practice and nothing was sent | A rising hum while held, done as it leaves | Opal onb_im9zk (hold back, then release), Duolingo onb_nsrjz |
| 7 | Doors | It runs in your own account | Yours. In your own account. | Day sky; Keep and the four crew together on the horizon | Waves the dog-ear (idle), crew hop in turn | Set up mine, or I already have Later; Look around first | A small rise on press | Duolingo spl_7vdk2, Gizmo spl_zm1gj |
| 8 | Computer | Set-up happens on your computer, then this phone pairs | Set it up on a computer. | A big laptop on the horizon with the address and code on its screen; Keep peeks over the lid; a dotted path from laptop to phone | Peeks and thinks while waiting; listens while scanning; done when paired | Waits (Simulate), Scan, Carry on | Rise when the code appears; a tick per dot; done when paired | PDF Expert oth_4zdfv, Alfred onb_y6l4y, Copilot onb_ygga6 |
| 9 | Paired (the last phase of the computer screen) | The key and the cap live on the computer | Paired. | Ledger is dealt onto the horizon beside Keep holding a coin card | Deals Ledger | Carry on | Deal, done | Bites onb_222qc |
| 10 | Mail | Wren reads your mail; nothing is sent without you | Connect your mail. | Wren large beside Keep, holding an envelope card; the field sits on the ground | Deals Wren in; Wren holds out the envelope; on success Wren hops | Paste the app password, Connect, or Skip | Deal, a tick on paste, done | Wysa onb_av3fb (character over the field), Copilot onb_b2r8h |
| 11 | Calendar | Scout reads your calendar by its private link | Add your calendar. | Scout large holding a calendar card | Deals Scout | Paste the link, Add, or Skip | Deal, done | Jamie onb_k7qrg, Timepage onb_0zqwe |
| 12 | School | Other apps come in by the emails they send | School apps too? | Juno large holding a mortarboard card | Deals Juno | Yes, or Not now | Deal, done | Spark onb_bdyn8 (agree in one tap) |
| 13 | Reading | The first pass is small and capped | Keep is reading. | Keep centre in the sky; the crew orbit it; cards stream up from the horizon into Keep and out to the crew; a ring around Keep fills as spend against the cap | Working: squared up, eyes scanning | Watch (Simulate finish) | Soft ticks as cards land, done at the end | Tolan onb_no9p9, Bites onb_brutz, Not Boring onb_1kbx2 |
| 14 | What Keep found | Keep proposes Spaces; you keep or flick them away | Keep found 4 Spaces. | Four cards dealt face down in a fan; they turn one by one to show a glyph, a name and the crew who will hold it | Deals, then looks at each as it turns | Flick away the ones you do not want; Keep these | A tick per turn, rising; the later swoop on a flick; done | Opal onb_0m8b4, Nebula oth_4492b, Astroscope oth_d3j87 |
| 15 | First deck | One thing at a time, routines paused | Your first deck. | Keep deals three cards into a stack on the ground | Deals, then done | Open Today | Three deals, done | Pingo oth_nxgmu |

Taps from the first screen to the first deck on the happy path: 16 (title, five concept gestures, a door, three on the computer, two each for mail and calendar, one for school, one to keep the Spaces). The concept beats can be skipped from the top bar, which takes it to 10.

As built, the computer step carries its phases (waiting, code, scanning, expired, paired) on one screen, so the prototype has 14 steps for these 15 rows.

Reduced motion: every beat is built so its last frame tells the story on its own (the pile on Keep, the crew with their stacks, the single clay card, the card half below the horizon with its return time, the sent card with a tick), and the gestures are also plain buttons.
