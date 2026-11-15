# Later: a concept

## 1. The idea in three sentences

Later is a small team of AI helpers that does your life admin: tell it once, they get on with it, and a card comes back only when they need your yes. A chat agent waits to be asked and answers in text; here the work goes on while you are away and returns as something you can act on. The screen is a deck that rearranges around what needs you, led by Keep, the card mascot.

## 2. The organising model

Five things to learn.

1. **Keep**: the chief, a hand of cards. Talk, type or speak to Keep; it files your words and puts someone on it.
2. **Crew**: Wren (mail), Scout (chases, checks the web), Juno (plans, books), Ledger (money). One card each, all AI.
3. **Spaces**: one per part of life, each with its own mail, memory, budget and crew.
4. **Cards**: the only way the crew asks anything of you. One action each.
5. **Your yes**: press and hold on the fixed approval form. Nothing is sent, paid or deleted without it.

**Later** is a verb: swipe a card down and it returns when you choose.

What I did:
- **Kept**: Keep, crew, Spaces, Cards, Your yes, Later, rings, stacking, Harbour.
- **Cut**: Now, Next, Later as a layout.
- **Merged**: Threads into Spaces (a Talk bar in each) and the Keep sheet. Templates into Spaces ("Start from one").
- **Moved**: the edition to the foot of Today.
- **Changed**: the ring means story playback only, never progress.

I chose a Today deck over chat-plus-cards (shows no work) and Spaces-first panels (hard to learn). A card may carry a due date, so a late Space is not hidden.

## 3. Core screens

Two tabs, Today and Spaces. Keep sits bottom centre on both.

### 3.1 Today: what needs me?

```
 Tuesday                    (o)(o)(o)(o)
 "Two need you. Wren drafted the reply to Dave."
 ┌───────────────────────────┐
 │▓clay  Dave: loft viewing  │ <- hero card
 │ Wren drafted a reply      │
 │ "Tuesday 10:00 works..."  │
 │     [ Look, then send ]   │ <- the one action
 │  later v                  │
 └─▒─────────────────────────┘ 1 more below
 Crew: Scout chasing venue · Ledger ✓
        [ Keep: hand of cards ]
```
- A card with a due date **grows**, with a filling bar; others shrink to a peek.
- Urgent cards are **dealt from Keep**.
- Crew work **shrinks to one line**; finished work turns citrus, then leaves.
- Deck empty: it folds and the edition grows.

### 3.2 Your yes (overlay)

```
 ┌ Send to dave@loftco.example ─┐
 │ "Hi Dave, Tuesday at 10..."  │
 │ ( ◉ hold to say yes )        │
 └──────────────────────────────┘
```
Fixed layout; recipient and words are the exact arguments, never a model summary. No undo, no delay.

### 3.3 Spaces

Job: see at a glance which part of life needs you. Order is the user's and never moves. Size follows need.

```
 Spaces                          + Start one
 ┌───────────────────────────────────────┐
 │ House move  (◔◔◔)         clay edge   │ <- large: cards waiting
 │ Juno: 3 quotes in                     │
 │ ┌Loft quote┐ ┌Deposit┐  [Look]        │
 └───────────────────────────────────────┘
 ┌──────────────┐ ┌ Taxes · due 5d ─────┐
 │ Mum's 70th   │ │ Ledger: 1 doc       │ <- medium: one card or date
 │ Resting      │ │ [card]              │
 └──────────────┘ └─────────────────────┘
 Side project · resting   <- chip
 Start from one: [Moving] [Trip] [Taxes]
```
- **Size**: cards waiting makes a large tile showing the top card; one card or a near date, medium; nothing waiting, a one-line chip. 
- **Ring**: story playback only, never progress.
- **Template card** (tap "Moving"): author, crew, six starter cards, a cap you choose, no author mail or memory, and [ Start this Space ]. Sharing yours lists what leaves (crew, card titles) and what stays (mail, memory, money), then a hold-to-yes.

### 3.4 Inside a Space

```
 < House move              (o) story
 Juno: "3 quotes in. One needs you."
 [Loft quote] [Deposit]  <- stack
 [Memory 5 facts] [£ 3.20 of cap] [Share]
 ┌ Talk to the crew ──────────(mic)┐
 │ You: move the date to the 21st  │
 │ Juno: "Changed. Rechecking."    │
 └─────────────────────────────────┘
```
Job: see this part of life, talk to its crew, correct what they know. The stack grows when something needs you.

### 3.5 Keep sheet

Job: say anything, anywhere.

Under a listening Keep: your words, mic, type and photo buttons, and "Filing to: House move [change]".
Listening moves the under-cards like a level meter; done turns the top card citrus.

### 3.6 The edition

Serif pieces under their source, finite, fed by forwarded newsletters or followed topics. Each has Open, Ask Keep, Later, Save to Space.

### 3.7 The widget (designed first)

One line in Keep's voice, one card, one button, Look. Hold-to-yes never happens in a widget or notification.

## 4. Features

**First version:** Keep (type, voice, photo); four crew roles; AI access connected once, payer-neutral; mail connection; read-only calendar by iCal address; Spaces with memory and a user-set spend cap; one-action cards with optional due date; hold-to-approve; Later; daily deck; simple edition; rings; templates (start, share); notifications in Keep's voice; the widget.

**Mail is the least proven promise.** The app-password route needs 2-Step Verification, is unavailable on some Workspace and Advanced Protection accounts, and IMAP from a Worker is an unresolved spike (architecture doc). So Wren's first card offers "Connect Gmail" through the user's own Google client, or "Forward mail to Wren", which works anywhere.

**Leave out:** a Threads tab, custom crew, a template marketplace, a 3D world, undo or send delay.

## 5. Onboarding storyboard

It runs from first open to the first useful moment: 9 screens, about 80 seconds, then the first real card about 30 seconds later. Concept first, setup last: A1 to A8 explain the app around the user's own errand, which Keep holds; A9 connects AI access so the errand can run. Nothing before A9 claims work is happening.

**A1. Opening** (6 s)
Headline: **An app that does things for you.**
Support: Tell it once. A team of AI helpers gets it done.
Shown: Keep centre, clay glow. Moves: cards fan out. Sound: soft zip. User: taps Next.
```
 ┌────────────────────────┐
 │       ▒ ◔ ◔ ▒  Keep    │
 │ An app that does       │
 │ things for you.        │
 │ Tell it once. A team   │
 │ of AI helpers gets it  │
 │ done.        ( Next )  │
 └────────────────────────┘
```

**A2. Tell Keep** (12 s)
Headline: **Tell Keep. Messy is fine.**
Support: One thing on your mind. Type it or tap one.
Shown: a field and chips "Plan a birthday", "Plan a trip", "Pack for a move". Moves: your words fold into a card in Keep's hand. Sound: tick. User: types or taps.
```
 Tell Keep. Messy is fine.
 [ type here...    ]
 (Plan a birthday) (Plan a trip)
 (Pack for a move)
```

**A3. Meet your crew** (9 s)
Headline: **Keep puts someone on it.**
Support: Four AI helpers. Each has one job.
Shown: Keep deals Wren, Scout, Juno and Ledger; the one for your errand lifts. Moves: each flips with a bounce. Sound: four rising ticks. User: taps one to see its job.

**A4. Spaces** (8 s)
Headline: **One Space for each part of life.**
Support: A house move, a trip, taxes. Each has its own mail, plans and helper.
Shown: your errand card flies into a new Space titled with your words. Moves: the tile grows around it. Sound: soft whoosh, thud. User: none.

**A5. They do the work** (8 s)
Headline: **Then they get to work.**
Support: Helpers read, draft and chase while you are away.
Shown: the crew card with one future-tense line from your errand: "Juno will draft a plan for your trip." It claims nothing is running, since nothing is yet. Moves: the line types out. Sound: pencil scratch. User: none.

**A6. Cards** (8 s)
Headline: **You only get a card when it needs you.**
Support: One thing to do on each.
Shown: a card labelled "Example" lands with one overshoot; button "Look". Sound: card slap. User: taps to flip it.
```
 ┌ Example ────────────────┐
 │ Juno: choose a date     │
 │       [ Look ]          │
 └─────────────────────────┘
```

**A7. Your yes** (12 s)
Headline: **Nothing goes out without your yes.**
Support: Hold to try it. Nothing is sent.
Shown: the approval form in its fixed layout. Practice values are plain: recipient "Nobody (practice)", a "Practice" stamp, button "hold to practise". The real form shows a real recipient and "hold to say yes". Practice never reaches the policy gate. Moves: ring fills while held; a stamp lands. Sound: hum, thunk. User: holds.
```
 ┌ Send to Nobody (practice) ─┐
 │ Subject: <your errand>     │
 │ ( ◉ hold to practise )     │
 └────────────────────────────┘
```

**A8. Later, and templates** (8 s)
Headline: **Not now? Say later.**
Support: It comes back when you choose. Or start from someone else's Space.
Shown: a card sinks, rises at 6 pm in fast-forward; then template cards Moving, Trip, Taxes. Sound: low sink, bright chime. User: flicks the card; picks a template or skips.

**A9. Connect your AI** (about 20 s)
Headline: **Give Keep its brain.**
Support: Keep needs one to start your errand.
Shown: your errand card beside whichever connection routes the product supports, and a spend cap you set. Moves: the card slides into the Space and Juno lifts. Sound: click, zip. User: connects and sets a cap. If they cannot, Keep says "I'll start when you do" and the card waits.

**First useful moment** (about 30 s after A9)
Today opens. The first card is made by the AI from the user's own words, so it needs no mail. For "Plan a trip" it is a three-step plan; its one button, "Start step 1", hands that step to the right crew member.  If the words were thin, the card is one tap question. If the call fails, Keep says "I could not reach the AI. Check AI access in Settings."

**After that, as cards, never a gate:** "Let Wren read your mail", "Want a morning read?", "Add Later to your Home Screen".

## 6. Look and feel

Harbour carries meaning only: clay means it needs you, ink navy means structure and crew, citrus means done. Dark leads; Light keeps the roles on warm paper. Type is one confident humanist sans for deciding and a book serif for the edition, with no small uppercase labels above headings. Cards are tactile: a paper edge, a shadow that deepens with the stack. Motion settles like real objects (deal, overshoot once, rest). Sounds are short zips and ticks. Keep is a character that needs you: its state is the app's state.

## 7. Why it will work, and the biggest risk

**Why it will work**
- One line says what it is; each concept appears once, on the user's own errand.
- Cards with real words and one action give a reason to act.
- Five concepts, one yes, meaningful colour, and Spaces whose size shows need.

**Biggest risk**
- The first real card must be good; a weak one turns the story into a broken promise.
- Mail, the core promise, rests on the least proven connection.
