# Task: a concept for "Later", a personal AI agent app — the app idea, its core screens and features, and its onboarding

You are proposing a product and design CONCEPT. No code. Rough is fine. Words, a storyboard, and simple text wireframes (ASCII or markdown boxes) are the deliverable.

## What the product is (the founder's own words)

"It is a personal AI agent like any other AI agent out there... In general, we all boil down to some sort of AI agent orchestration layer in the backend, giving agents all the necessary tools they need to complete tasks, and with the computer it might have access to. That's all personal AI agents these days really are. And definitely with connectors for apps too, like Gmail. The premise is very simple, but the differentiation that we're bringing here is the organisation and the UI/UX layer, which all other chat-based AI agents are not offering at this point. So we go that OpenClaw sort of route in customisation, but then we give the value on top through the UI/UX layer."

On how users pay for the AI: "We're not fully decided on that bring-your-own-API-key idea. I think that is an entry point for us, because there are customers using Claude subscriptions already, so we might want to use that." Treat this as open. Do not build your concept around it.

On the experience: "It's like a very visual AI agent, which means that the UI should not be static at all times, but sort of a generative UI feel in which components grow, components shrink in size, or new components arise based on the context."

The other agents he means: Meta Muse, Claude Duet, OpenAI Dots, Grok Bot, Instinct, Town, OpenClaw, and Wajo (whose mascot is called Fo). All are chat-first.

## What already exists and what the founder thinks of it

The product is called Later. These concepts exist in the current prototype. You may keep, rename, merge, cut or replace any of them, but say what you did and why:

- **Keep**, the mascot and chief agent: a fanned hand of cards with a face on the top card. It replaces the usual plus button and is the one place to talk, type or capture by voice. It has a **crew** of agents (Wren, Scout, Juno, Ledger), each a single card, which it assigns to work. The founder: "The mascot deck is really good. The faces for now are looking good."
- **Spaces**: one per part of life (house move, school, taxes, a trip, a side project), each with its own mail, plans, memory and crew.
- **Cards**: when something needs the user, an agent hands them a card with the one action on it. Cards stack; a short daily deck.
- **Later**: anything can be set aside with a return time and comes back.
- **Your yes**: nothing is sent, paid or deleted without an explicit press-and-hold on a fixed, recognisable approval form.
- **Templates**: a Space someone else set up that you can start from and share your own.
- **Today**: the deck of what needs you, a quiet line on what the crew is doing, and a readable "edition" of bite-sized snippets from newsletters and followed interests.
- **Threads**: one chat per Space plus one with Keep.
- **Space rings** with story-style playback, which the founder called "beautiful"; and card-stacking animations he liked.
- Colour: a palette called Harbour (clay for what needs you, ink navy for structure and the crew, a citrus pop for done). "Harbour Dark is really looking good. Harbour Light might require more work."

Things the founder has said across many rounds (his words):
- Wanted: "use colour in a manner that makes sense… two primary colours and one colour that complements it for pop", "classy", "depth", "modern", "trendy and fun to use", "character and a tactile feel", "premium".
- Rejected looks: "too much colour without a real brand character"; then "too minimal… just a list of items, it doesn't look like anything the user might want to take an action against. It doesn't have a life to it."; an all-black effects-heavy look ("I wanted inspiration from those libraries, not literally the whole app"); "classic AI slop fonts"; "eyebrow headings are AI slop"; "popup pills… overused and intrusive".
- On structure: "The Now, Next, Later model needs further thought. Are we complicating design with that approach?" and "Spaces is still the weakest screen."
- On onboarding attempts: "too cluttered and too much happening. The synthetic texts in the examples are also confusing."; "the whole flow looks lifeless… not conveying the message that it's a personal AI agent which will help them organise their life better"; "We are asking a user to do arbitrary actions on an app onboarding without clearly explaining what the app is about in simple terms."
- What he asked for in onboarding: "Screen by screen, the user should gain familiarity about each feature of the app, starting with an opening screen that says something like 'An app that does things for you' and then introduces things like spaces, the mascot, agents, templates, cards etc with subtle animations and fun movements." "Use the mascot and animations as the core language in the onboarding to make the app fun, intuitive and an instant sell." "With the mascot moving around and with subtle zippy sounds."
- On "creating a world": a built 3D harbour scene was rejected as "too overboard and unnecessary… so abstract". What he meant: "first look at what our app is all about and what the key concepts in our app are, like those spaces, the cards, templates… How do we simply introduce them to the user by using subtle colours, graphics, images, animations."
- References he pointed to: immersive onboarding in Tolan and Acorns; the big social apps for disciplined colour; a video arguing that every premium app has a genre (quiet, character, atmosphere, data, loud), that "a mascot sitting in the corner is decoration; a character that needs you is a product", and that apps you barely open should design the widget first, the notification second and the app last.

## Research you should read before proposing

All paths are absolute. Read what is useful; you are not required to agree with any of it.
- /home/user/later/design/research/agent-onboarding-flows.md — how the other AI agents onboard, paired with immersive onboardings such as Tolan and Acorns, with a table matching each Later concept to a reference technique.
- /home/user/later/design/research/video-notes.md — the founder's two reference videos.
- /home/user/later/design/research/feature-tour-research.md — how apps introduce themselves and their features.
- /home/user/later/design/research/premise/cold-read.md — a stranger's reaction to an earlier onboarding.
- /home/user/later/design/research/premise/openings-teardown.md — how 33 apps establish their premise.
- /home/user/later/design/ui-direction.md — the current interface direction.
- /home/user/later/docs/architecture.md sections 1 and 4a to 4h — product decisions so far. Fixed facts from it: the app must never send, pay or delete without the user's explicit yes; agents may only describe the interface as typed data chosen from a fixed set of components, never markup; consent screens never change shape.
You cannot open the prototype's screens in this task; work from the descriptions above and the documents.

## What to deliver (one document)

1. **The idea in three sentences**: what this app is, said the way a user would say it to a friend; and the one thing that makes it different from a chat-based agent.
2. **The organising model**: the few concepts a user has to learn, each in one line, and how they relate. Fewer is better. Say which existing concepts you kept, merged, renamed or cut.
3. **The core screens**: for each main screen (about five to seven), its job in one line and a text wireframe. Show what a user can act on. Show where the mascot and agents live and what they do there. Show where the interface changes with context (what grows, shrinks or appears, and why).
4. **Features**: the short list a first version needs, each in one line, and what you would leave out.
5. **Onboarding storyboard**: screen by screen from first open to the first useful moment. For each screen: the headline and one supporting line, exactly as written; what is shown; what moves; the sound if any; what the user does, if anything. It must explain plainly what the app is before asking the user to do anything, and make each key concept familiar, simply, using subtle colour, graphics and animation. Include a text wireframe for at least the first screen and three others. Say how many screens and roughly how many seconds.
6. **Look and feel in a paragraph**: colour use, type character, motion, the mascot's role. No brand-new palette is needed; say how colour carries meaning.
7. **Why this will work, and its biggest risk**: three lines each.

Keep the whole document under 1,800 words. Plain words. No hype. Do not write code or HTML. Do not invent user numbers, quotes or testimonials.

## What "good" looks like

A person who has never heard of the product reads the onboarding storyboard and can say what the app does and name its main concepts. The core screens look like things a user would want to act on, with life in them, and not like a list or a dashboard. The concept is simple enough to explain in a minute and specific enough that a designer could start drawing screens from it tomorrow.
