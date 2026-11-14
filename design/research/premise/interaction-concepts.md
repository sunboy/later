# Front door: interaction concepts for the premise

Interaction study, 14 Nov 2026. Read with `design/research/onboarding-flows.md`, `design/ui-direction.md` and `docs/architecture.md` 4b to 4h. Played in headless Chromium at 390 and 1440: the front door, Today, Spaces, Keep, voice capture and Simulate. Concepts only.

## 1. Why the intro feels dead

The diagnosis is right, with three refinements.

- **No nouns.** Today is alive because it is full of names, dates and people: Dave, the loft, Tuesday at 10, Mum's 70th. The intro has none. The pile is twelve icons. "Only what needs you" is a clay rectangle with a receipt glyph. "Flick it down" sends nothing to no time. The yes you hold is an arrow, then you are told it was practice.
- **The copy talks about the product, not you.** Every headline is a claim ("Keep and the crew sort it"). None is a question, so nothing asks for anything of yours.
- **Nothing persists.** After six beats your state equals the title's. Keep performs in front of you; "Tap Keep" starts a show you already know the end of.
- **Time is faked.** The promise is that things come back at the right time. The intro squeezes later into a 1.5-second dawn, so it never makes a promise it has to keep.
- **The best moment is hidden.** Voice capture in the app (ramble about Bishop's and the piano, get three filed cards) is the most alive thing in the prototype. The intro should start there.

Where the diagnosis overstates: input alone does not fix it. Finch's survey is all input and is its weakest stretch. What works is the user's own words coming back changed, and kept.

## 2. Eight concepts

**1. Hand one over.** "What do you keep meaning to do?" *Gives:* one sentence, typed or spoken. *Gets:* it as a card, with day, person and Space picked out. *Crew:* the matching crew member steps up and takes it. *Promise:* delegation, once. *No backend:* date phrases, names, a keyword table. *Risk:* thin; blank-line freeze.

**2. Empty your head.** "What's on your mind?" Each line lifts off as a card into Keep's fan, which thickens. *Gets:* "5 things off your mind." *Crew:* Keep's under-cards act as a level meter while you type. *Promise:* relief, the real emotional job. *No backend:* split on lines, full stops, "and". *Risk:* feels like a to-do app.

**3. Above or below the line (new).** Your cards stand on the horizon; flick each up (this week) or down (later). Down asks "Back when?" *Gets:* your week split, return times printed on card backs. *Crew:* Keep catches what sinks. *Promise:* the core mechanic, on your own things. *No backend:* device clock and chips. *Risk:* needs items first.

**4. The kept promise.** One card goes down with a real time, say 18:00. *Gets:* it really comes back: on the next open after that time, and once set up, as a push. *Crew:* Keep sinks holding it and rises with it. *Promise:* the first promise is kept. *No backend:* local storage, checked on open; browsers cannot schedule local notifications, so say so. *Risk:* unseen if nobody returns.

**5. Your crew assembles.** Pick parts of your life from chips (Home, School, Work, Money, Health, A move, A trip, own words). Each deals a Space and a crew member onto the horizon. *Gets:* your Spaces, in your names. *Promise:* a team made for you. *No backend:* a list. *Risk:* survey; empty Spaces.

**6. Who never waits (new).** "Whose messages should never wait?" Up to three names or roles; each becomes a person card held by a crew member. *Gets:* "Wren will watch for Mum." *Promise:* protective and personal, and the reason to connect mail. *No backend:* text. *Risk:* privacy unease before trust.

**7. Set the rhythm.** Drag the sun along the horizon: wake, deck time, stop. The clock places "now". *Gets:* "Your deck at 07:45, the edition at 20:00." *Crew:* they sleep below the line at your stop time. *Promise:* fits your day. *No backend:* settings. *Risk:* configuration posing as delight.

**8. Dog-ear it (new, unique to cards).** Write on a blank card, then fold its corner down with your thumb, Keep's own fold. It gains eye slots and becomes a tiny crew member carrying your words. *Gets:* a creature made of your sentence. *Promise:* "keep" as a verb you perform. *No backend:* a gesture. *Risk:* slow; needs a button alternative.

## 3. Three flows

Shared on-device logic, honest and local: split on lines, full stops and "and then"; dates (today, tonight, tomorrow, weekdays, "by Friday", "next week", numerals) resolved against the clock; people from mid-sentence capitals plus Mum, Dad and common roles; Spaces from a keyword table (school, pay, tax, move, flight, birthday, dentist); unmatched to Inbox. Said once: "Sorted on this phone with simple rules. Keep reads properly after setup." Stored on the device only. Voice only where recognition is truly on-device (spike R8); otherwise the keyboard's own dictation.

### Flow A: Unload (2 + 3)

1. **Title.** Keep climbs out of the horizon holding out a blank card: "What's on your mind?" Tap Keep; sound starts. (1 tap, 3 s)
2. **Unload.** Blank card, cursor; prompts cycle as kinds, never sample text ("a call", "something for school"). Each Return lifts the card with their words into Keep's fan; a tick per landing, rising in pitch; pips read "3 off your mind". "That's all for now" appears after one. (about 5 taps, 60 s)
3. **Sort.** Keep shuffles 1.2 s, then deals cards face up along the horizon with chips for what the rules caught (Fri, Mum, a Space glyph in crew colour). Tap a chip to correct. (1 tap, 8 s)
4. **The line.** "Which need you this week?" Flick up or down; down offers three "Back when?" chips from its date and sinks with the later swoop, time on its back. (about 7 taps, 30 s)
5. **Your horizon.** "2 need you. 3 come back; the first at 18:00." Keep's eyes close to arcs; done sound.
6. **Bridge.** "These live on this phone. To bring them back on time, and find the ones you didn't tell me, I need a home." Set up mine / Keep them here for now / Look around. (1 tap)

About 15 taps, 2 minutes; minimum 5 taps, 40 s. On pairing the phone sends its cards straight to the user's new backend; they become the first cards in their Spaces, and the deck opens on one of theirs.

### Flow B: One thing, back at six (1 + 4)

1. "Give me one thing you keep meaning to do." (1 tap)
2. They type or speak; the card forms in their words, cleaned by rule ("I need to" stripped). (1 tap, 20 s)
3. Keep holds it up; day, person and Space slide out as tags; the matching crew member hops in and takes it. (1 tap)
4. "When shall I bring it back?" In an hour (15:40), this evening (18:00), tomorrow (08:30). (1 tap)
5. It sinks; a small clock on the horizon reads 18:00. "Before setup I can only show you when you open me. With a home I can tap you at 18:00, and find the rest myself." Set up mine. (1 tap)
6. Next open after 18:00, it rises with the back chime: "You asked for this at 18:00." After setup the backend owns the timer and sends a push.

About 5 taps, 40 s.

### Flow C: Your life, staffed (5 + 6)

1. "What are you juggling?" Each chip deals a Space and crew member, one deal sound each. (about 4 taps)
2. Optional rename: "Home" to "Elm Road move". (0 to 2)
3. "Whose messages should never wait?" Each name tucks into a Space: "I'll watch for Mum." (about 3)
4. Optional: one thing per Space. (0 to 4)
5. Tiles read "Waiting for your mail"; Set up mine. (1)

About 10 taps, 90 s.

## 4. Recommendation

**Flow A.** Its first minute is relief, the product's real feeling, and it leaves the user holding a sorted pile that is theirs.

- **From B:** the earliest card sent down carries a real time, and that time is the reason to set up. It returns on next open, and as a push once set up. B's one-card path serves anyone who types only once.
- **From C:** names the rules found become a "never wait" list with one confirming tap ("Watch for Mum?"); Spaces emerge from items, not a menu.

**Cut:** beats 2 to 6 as they stand (icon pile, "Tap Keep" sort, wordless clay card, flick to nowhere, practice hold); the five-pip progress; "Yours. In your own account." before the user has given anything (move it to the computer step); the canned "Keep found 4 Spaces"; the generic envelope in "Your first deck". Keep the title climb, horizon, sound, crew colours, and the hold for the first real send.

## 5. Keeping setup personal

- **Computer.** The laptop reads "Your 5 things are safe on this phone." On pairing, the cards travel the dotted path into the new home, one tick each.
- **Mail.** Wren holds the user's card that names a person: "Mum emails you? I'll watch for her." The promise sits here: nothing sent without your yes.
- **Calendar.** Scout holds the dated card: "Friday's on your list. I'll check what else is on Friday." No dated card: tomorrow.
- **Other apps.** Only if a card matched school, nursery or club: "Does the nursery app email you? Juno can read those." Otherwise skipped.
- **Reading pass.** The user's cards orbit Keep with the crew; captions name them ("Looking for anything about the piano"). Their keywords really seed the capped first pass; the spend ring stays honest.
- **What Keep found.** Matches to their own items turn first ("Bishop's Move wrote on Tuesday: that's your piano card"), then new finds, then Spaces under the user's names. Unmatched items say so plainly. The first deck opens on one of their cards, with the first return time showing.
