# Later: a concept

## 1. The idea in three sentences

Later is a small team of AI helpers that does your life admin: tell it once, they get on with it, and a card comes back only when they need your yes. A chat agent waits to be asked and answers in text; here the work goes on while you are away and returns as something you can act on. The screen is a deck that rearranges around what needs you, led by Keep, the card mascot.

## 2. The organising model

Five things to learn.

1. **Keep**: the chief, a hand of cards. Talk, type or speak to Keep; it files your words and puts someone on it.
2. **Crew**: Wren (mail), Scout (chases people, checks the web), Juno (plans, books), Ledger (money). Each is one card. Said once: they are AI.
3. **Spaces**: one per part of life (house move, taxes). Each has its own mail, memory, budget and crew.
4. **Cards**: the only way the crew asks anything of you. One action each.
5. **Your yes**: press and hold on the fixed approval form. Nothing is sent, paid or deleted without it.

**Later** is a verb: swipe a card down and it returns when you choose.

What I did:
- **Kept**: Keep, crew, Spaces, Cards, Your yes, Later, rings, card stacking, Harbour.
- **Cut**: Now, Next, Later as a layout. It makes the user sort by time. Today has three plain parts.
- **Merged**: Threads into Spaces (a Talk bar in each) and Keep (its sheet). Templates into Spaces ("Start from one").
- **Moved**: the edition to the foot of Today.

| Option (3 best) | Not a list | Learnable | Shows work | Spaces strong | Total |
|---|---|---|---|---|---|
| A. Chat plus cards | 1 | 3 | 1 | 1 | 6 |
| B. Today deck, living tiles (chosen) | 3 | 3 | 3 | 3 | 12 |
| C. Spaces-first panels | 2 | 1 | 2 | 2 | 7 |

B's weakness: one deck can hide a Space going late, so a card may carry a due date and a Space tile rises when one is near.

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
 └─▒─────────────────────────┘ 2 stacked below
 Crew: Scout chasing venue · Ledger ✓
 ── The edition · 6 pieces · 5 min ──
        [ Keep: hand of cards ]
```
Context changes:
- A card with a due date **grows** with a filling bar; others shrink to a peek.
- A new urgent card is **dealt from Keep**, so you see who sent it.
- Crew work **shrinks to one line**; finished work turns citrus, then leaves.
- Deck empty: it folds to "That's the lot" and the edition grows, if there is one. With no edition, a single line offers "Follow a topic".

### 3.2 Your yes (overlay)

```
 ┌ Send to dave@loftco.example ─┐
 │ Subject: Tuesday 10:00       │
 │ "Hi Dave, Tuesday at 10..."  │
 │ ( ◉ hold to say yes )        │
 └──────────────────────────────┘
```
Fixed layout; recipient and words are the exact arguments, never a model summary. Nothing added: no undo, no delay.

### 3.3 Spaces

Living tiles, not rows. The tile with most need is largest.

```
 Spaces                          + Start one
 ┌────────────────────┐ ┌──────────┐
 │ House move   ● 2   │ │ Taxes    │
 │ Juno: 3 quotes in  │ │ Ledger   │
 │ [card][card]  ◔    │ │ ◑        │
 └────────────────────┘ └──────────┘
 ┌──────────┐ ┌─────────────────────┐
 │Mum's 70th│ │ Side project resting│
 └──────────┘ └─────────────────────┘
 Start from a template: Moving · Trip · Taxes
```
The ring is the share of that Space's open jobs done. A Space with a waiting card rises; a quiet one shrinks. A ring plays its story: what was done since you last looked.

### 3.4 Inside a Space

One hero, three quiet chips.

```
 < House move              (o) story
 Juno: "3 quotes in. One needs you."
 [Loft quote] [Deposit]  <- stack
 Wren read 4 mails · Scout chasing venue
 [Memory 5 facts] [£ $3.20 of $10] [Share]
 ┌ Talk to the crew ──────────(mic)┐
 │ You: move the date to the 21st  │
 │ Juno: "Changed. Rechecking."    │
 └─────────────────────────────────┘
```
Job: see this part of life, talk to its crew, correct what they know. The stack grows when something needs you and folds to "Nothing waiting". Memory opens as editable text; the money chip shows spend against the cap set at install. The conversation is shown, one exchange, expandable.

### 3.5 Keep sheet

Listening moves the under-cards like a level meter; thinking shuffles them; done turns the top card citrus.

### 3.6 The edition

Serif text straight on the page, each piece under its source, finite, ending "That is the edition." It fills only from newsletters the user forwards or topics they follow. Before that, Today shows one line: "Follow a topic or forward a newsletter".

## 4. Features

**First version:** Keep (type, voice, photo); four crew roles; mail by IMAP app password, advanced path via the user's own Google client; calendar read-only by iCal address; Spaces with memory and a spend cap; one-action cards with optional due date; hold-to-approve; Later; daily deck; a simple edition; rings with story playback; templates (start, share); notifications in Keep's voice;  The widget is designed first: one line in Keep's voice, one card, one button.

**Leave out:** a Threads tab, custom crew building, a template marketplace, a 3D world, undo or send delay, agent-authored layout beyond a fixed component set.

## 5. Onboarding storyboard

Context: the app is served by the user's own backend after install and pairing (architecture 4f), so the key and spend cap already exist. The story is not setup. It is 8 screens, about 65 seconds, then the first real card about 30 seconds later: **under two minutes to the first useful moment, with no account work in between.** Mail comes later, as a card. Skip is on every screen.

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

**A2. Tell Keep** (10 s)
Headline: **Tell Keep. Messy is fine.**
Support: One thing on your mind. Type it or tap one.
Shown: Keep, a field, chips "Plan a birthday", "Reply to a landlord", "Sort my taxes". Moves: your words fold into one card. Sound: a tick. User: types or taps. This is real: Keep starts work on it at once and it becomes the first Space. Skipped: a template Space.
```
 Tell Keep. Messy is fine.
 [ type here...    ]
 (Plan a birthday) (Sort my taxes)
```

**A3. Meet your crew** (10 s)
Headline: **Keep puts someone on it.**
Support: Four AI helpers. Each has one job.
Shown: Keep deals the four; the one suited to your errand lifts. User: taps one to see its job.
```
 [Wren mail][Scout chase][Juno plans][Ledger money]
```

**A4. Spaces** (9 s)
Headline: **One Space for each part of life.**
Support: A house move, a trip, taxes. Each has its own mail, plans and helper.
Shown: your errand card flies into a new Space titled with your words; its crew card tucks in.

**A5. They get on with it** (9 s)
Headline: **Then they get on with it.**
Support: Helpers read, draft and chase while you are away.
Shown: your Space's crew card with three plain steps taken from your words ("Looking up options", "Drafting", "Checking"), ticking in turn. Real step names, no invented messages. Sound: pencil scratch.

**A6. Cards** (8 s)
Headline: **You only get a card when it needs you.**
Support: One thing to do on each.
Shown: a card for your Space lands on a deck with one overshoot, its button reading "Look". User: taps to flip it.

**A7. Your yes** (12 s)
Headline: **Nothing goes out without your yes.**
Support: Hold to send. Try it. Nothing is sent.
Shown: the same approval form as 3.2, same layout and same hold. Only the values differ: "Send to: nobody (practice)", the body is your errand's title. Moves: ring fills while held; a stamp lands. Sound: hum, then thunk. User: holds.
```
 ┌ Send to nobody (practice) ───┐
 │ Subject: <your errand>       │
 │ "<your words>"               │
 │ ( ◉ hold to say yes )        │
 └──────────────────────────────┘
```

**A8. Later, and templates** (8 s)
Headline: **Not now? Say later.**
Support: It comes back when you choose. Or start from someone else's Space.
Shown: a card sinks, rises at 6 pm in fast-forward; then three template cards. User: flicks the card; picks a template or skips.

**First useful moment** (about 30 s after A8)
Today opens. Keep's real first result on the user's own errand arrives as a card: for example, a short plan or a list of options with one button. If slow, the Space shows "Juno is on it" and a notification brings the card. If the call fails, Keep says "I could not reach the AI. Check your key in Settings" and Today shows the template Space.

**After that, as cards from Keep, never a gate:**
- "Let Wren read your mail": guided app-password steps, ticking off; if blocked, the advanced path. Onboarding ingestion is capped (architecture D13, default $5) and shown on the money chip.
- "Want a morning read?": pick a topic or forward a newsletter, which fills the edition.
- "Add Later to your Home Screen": needed for notifications on iPhone.

## 6. Look and feel

Harbour carries meaning only: clay means it needs you, ink navy means structure and crew, citrus means done. Dark leads; Light keeps the same roles on warm paper. Type is one confident humanist sans for deciding, a book serif for the edition, and no small uppercase labels above headings. Cards are tactile: a paper edge and a shadow that deepens with the stack. Motion settles like real objects (deal, overshoot once, rest) and explains each change of state. Sounds are short zips and ticks. Keep is a character that needs you: it holds the work, and its state is the app's state.

## 7. Why it will work, and the biggest risk

**Why it will work**
- One line says what it is, then each concept appears once, on the user's own errand.
- Cards with real words and one action give a reason to act.
- Five concepts, one yes, meaningful colour.

**Biggest risk**
- The first real card must be good; a weak one turns the story into a broken promise.
- Install happens before the app, outside this storyboard; the mascot must stay useful after week one.
