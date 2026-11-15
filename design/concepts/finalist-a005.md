# Later: concept

## 1. The idea in three sentences

Later is an AI helper you hand things to. You say "call the plumber about the leak", and it drafts the message, chases the people and checks the money. It comes back with one card at a time, and nothing goes out until you press and hold yes. Other agents are a chat you keep reading; here the screen rearranges around what needs you.

## 2. The organising model

Four things to learn:

1. **Keep** is the chief: a hand of cards with a face. It is the one place to talk, type or speak. It deals your **crew** (Wren answers mail, Scout chases people, Juno plans, Ledger checks money). They are AI; the app says so.
2. **Spaces** are the parts of your life (house move, taxes, a trip). Each has its own mail, memory, crew and budget.
3. **Cards** are how work reaches you: one card, one action. You can **Later** any card (it returns at the time you chose) or give **Your yes** (press and hold; the only way anything is sent, paid or deleted).
4. **Templates** are a Space someone else set up, which you start from.

How they relate: you tell Keep; it files the item in a Space and deals a crew member; the crew work; a card comes back; you say yes or Later.

**Decisions:** kept everything else (Keep, crew, rings, stacking, Harbour). **Cut** the Now / Next / Later layout (one more model to learn); Later survives as a verb and a shelf. **Merged** Threads into Spaces (each has a log) and Templates into creating a Space. **Demoted** the edition to the foot of Today.

## 3. Core screens

### 3.1 Today: the deck
**Job:** decide the next thing, across all Spaces, one card at a time. This is the only place cards are decided.
```
 Wren has a reply ready.             <- Keep, one line
 ┌ (W) House move · Reply to agent ┐  clay = needs you
 │ "Tuesday 10:00 works.…"          │
 │ [Later ▾]             [Review ▸] │
 └──────────────────────────────────┘
   ▒ Taxes: 2 forms   ▒ Trip: hotel    <- stacked behind
 Handled today: 5 things
 Later shelf: ▭ 6 pm  ▭ Sat
 (ring)(ring)(ring)        ◈ Keep
```
- **Later shelf:** card-backs with return times; tap one to bring it back now. Hidden when empty.
- **Grows:** a card due today grows and gets a filling bar. **Shrinks:** the crew line folds when something is urgent. **Appears:** new cards are dealt from Keep. **Empties:** "That's the lot", and the edition grows into the space.
- Keep shows state: clay card behind it when you are needed, citrus when done.

### 3.2 Keep: capture and talk
**Job:** say it once. Keep says where it filed it and who took it.
```
 ┌ ◈ Keep ──────────────────────┐
 │ "Call the plumber…" (🎤 hold)│
 │ [type…]  [share in] [photo]  │
 ├──────────────────────────────┤
 │ Filed to House move [change] │
 │ (Scout) is on it.            │
 └──────────────────────────────┘
 Crew: (W)(S)(J)(L)  tap = what it is doing
```
Keep grows from the fanned hand into this sheet; the crew card that took the job slides out.

### 3.3 Spaces: the overview
**Job:** see every part of life by how much it needs you. Nothing is decided here.
```
 (House●)(Taxes●)(Trip)(Mum)(+)     <- ring: tap = story of the week
 ┌ HOUSE MOVE ─────────── clay edge ┐
 │ (Scout) Reply drafted            │
 │ 3 of 9 steps ▓▓▓░░░░░░  [Review] │  <- opens this card in Today
 └──────────────────────────────────┘
 ┌ TAXES · 2 forms ┐ ┌ TRIP · quiet, next Sat ┐
```
- **Three gestures:** ring plays the story; tile body opens the Space; [Review] opens that card in Today's deck. Only Today decides cards.
- Size follows need: a Space with a card for you is large and clay-edged; a quiet one shrinks to a small tile with its crew card asleep and its next return time.
- "+" opens Templates or Start blank.

### 3.4 Inside a Space
**Job:** the plan and log for one part of life.
```
 ← House move        (ring)  [Ask about this]
 ● Book loft viewing  (Scout)   <- current step, large
   ○ Hire van  ○ Utilities      <- later steps, small
 Later here: Sat · Call landlord
 ▸ What I know here (editable)
```
The current step is large, later steps shrink, crew cards sit on their steps.

### 3.5 Your yes: the approval form
**Job:** one form for every send, payment, share or delete. It never changes shape.
```
 To / What:  dave@loftco.example
 "Tuesday 10:00 works…"
 ( HOLD TO CONFIRM ◉────── )
```
The words come from the exact arguments, not a model summary. Any change means a new hold. After the hold, outside the form, a strip may show "Sent in 30 s [Stop]" where an undo window exists (length is a backend decision). A biometric check may follow for new recipients, bulk actions and money. Neither changes the form.

### 3.6 Templates
**Job:** start a Space from someone else's.
```
 ┌ Moving house ┐ ┌ Tax year ┐ ┌ Trip ┐
 │ by @maker    │ │          │ │      │
 │ sample cards │ │          │ │      │
 │ needs: Gmail │ │          │ │      │
 │ Cannot send alone                   │
 └──────────────┘ [Start with this]  or [Start blank]
```
"Start with this" asks only for the connections shown.

**Off-app:** the widget shows the top card; notifications speak as Keep.

## 4. Features

**First version:**
- Keep (type, voice, share-in); Gmail and calendar; four crew roles.
- Spaces with plans, memory, spending cap; rings with story playback.
- Fixed card types, Later with shelf, Your yes.
- Three starter templates; widget; Keep-voiced notifications.

**Leave out:** interest feeds (v1 ships one daily piece), crew builders, bulk deletion, a template marketplace, a second chat tab.

## 5. Onboarding storyboard

**10 screens, about 2 minutes.** One headline, one line, one round button per screen. Keep is on every screen; Skip stays visible. Screen 1 explains the app before anything is asked. After that, each action is the user's own errand or a gesture they will use for real.

**1. Opening** (6 s)
- Headline: **An app that does things for you.**
- Line: Tell Keep what you need. Keep puts someone on it.
- Shown: Keep alone on navy. Moves: cards fan out, one blink, a slow breath. Sound: soft riffle. User: taps.
```
┌──────────────────┐
│     ◈ ◈ ◈ Keep   │
│ An app that does │
│ things for you.  │
│      ( → )       │
└──────────────────┘
```

**2. Say it once** (15 s)
- Headline: **Say it once.**
- Line: Something you have been putting off. Type it or speak it.
- Shown: Keep with a text line and two starters ("Call the plumber", "Book the dentist"). The user's words fold into a card; no AI is needed.
- Moves: the card flies onto a first pile. Sound: whoosh. User: types, speaks or taps a starter.
```
│ ◈ What have you been  │
│   putting off?        │
│ [type…] (🎤)          │
│ [Call plumber][Dentist]│
```

**3. The crew** (12 s)
- Headline: **Four AI helpers do the work.**
- Line: Wren writes mail, Scout chases, Juno plans, Ledger checks money.
- Shown: Keep deals four single cards, each with its own face. Moves: each does its job for a second. Sound: four deal-flicks, each a different pitch. User: taps.

**4. Spaces** (10 s)
- Headline: **One Space for each part of your life.**
- Line: House move, taxes, a trip. Each keeps its own mail, plans and helpers.
- Shown: three tiles slide up; the user's card lands in the closest. Sound: soft thud. User: taps.

**5. Cards** (10 s)
- Headline: **When it needs you, you get a card.**
- Line: One card, one decision. Here is a sample from Wren.
- Shown: a sample reply card, tagged "Sample". Moves: it grows, neighbours settle behind. Sound: deal-flick. User: taps.
```
│ When it needs you, a card.│
│ ┌ SAMPLE ───────────────┐ │
│ │ Wren · a reply        │ │
│ │ [Later]      [Review] │ │
```

**6. Later** (10 s)
- Headline: **Not now? Flick it down.**
- Line: It comes back when you said.
- Shown: the user's own card from screen 2, with a time chip "6 pm".
- Moves: flicked under a horizon, a clock spins, it rises back; a card-back stays on the Later shelf. Sound: swoosh, rising ping. User: flicks. It is a real Later and returns even if the app is closed.

**7. Your yes** (12 s)
- Headline: **Nothing leaves without your yes.**
- Line: Hold to confirm. Try it on a sample; nothing is sent.
- Shown: the real approval form, same shape and hold, tagged "Sample".
- Moves: ring fills; card lifts away; citrus flash. Sound: low hum, thunk, chime. User: presses and holds.
```
│ What: (sample)      │
│ ( HOLD ◉──────── )  │
```

**8. Get Keep ready** (15 s)
- Headline: **Let's get Keep working.**
- Line: It needs the AI that does the thinking, and a safe limit on what it can spend.
- Shown: a short checklist; the first row follows the payment decision and names no method. The limit starts at a default, shown on the first real card with a way to change it.
- Moves: rows tick off with a citrus mark. Sound: click per tick. User: completes the steps.

**9. Connect mail** (15 s)
- Headline: **Let Wren read your mail.**
- Line: Then your first card is about your real life. Disconnect any time.
- Shown: Gmail button; Wren leans in from the edge.
- Moves: Wren grabs a letter and runs it back. Sound: paper slide. User: connects, or taps "Not now".

**10. First useful moment** (up to 25 s)
- **Working:** Wren turns pages. Headline: **Looking through your recent mail.** Line: Only the last few days. After 25 s, move to Nothing found.
- **Finds.** Headline: **Wren found [N] things.** Line: The first one needs you. Shown: a real card with a drafted reply, dealt by Keep. Sound: deal-flick, chime. User: holds, or says Later.
- **Nothing found or mail skipped.** Headline: **Your first card is ready.** Line: Keep has turned your errand from screen 2 into a plan. Shown: that plan as a real card. User: holds or sets Later.
- After the first real card, Keep asks once: "Want a nudge when it comes back?" 

## 6. Look and feel

Harbour carries meaning only: **clay means it needs you, ink navy means structure and crew, citrus means done.** Nothing else uses them. Dark leads. Type is one characterful display face for headlines, a plain sans for work, a book serif for the edition. No eyebrow headings or floating pills. Motion behaves like paper cards: they deal, stack, settle with one overshoot, and sink under a horizon. Sound is short. Keep is a character that needs you: its state is the app's state.

## 7. Why this will work, and its biggest risk

**Why it works**
- A stranger can say what it does after screen 1; the rest uses their own errand.
- Cards look like decisions, not a list.
- The yes ritual makes safety felt.

**Biggest risk**
- Setup comes before the first real card, and a weak first find breaks the promise. Mitigation: the working state and the nothing-found path.
- Payment is open; the setup screen must stay short whatever the answer.
