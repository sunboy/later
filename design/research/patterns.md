# Later design pass 3: patterns by screen type

Each line names the evidence by `app_id/screen_id` (see apps.md for app names). "Adopt" is what Later does with it. Pattern, not pixels: no layouts, art or copy are reproduced.

## Cross-app synthesis

- **Quiet chrome, one accent.** The calmest winners (Perplexity 1668000334, Structured 1499198946) keep chrome neutral and spend one hue only on the active state, selection, focus and progress. Colour lives in content (Structured colours items, not chrome). Later: Space colours are content; the chrome has exactly one accent.
- **Say what will happen before it happens.** Copilot's trial rail (1447330651/pay_sa0o5), Perplexity's connector capability list (1668000334/oth_3swfx), Copilot's sample notification above its toggle (1447330651/onb_df3xt) and Spark's AI consent card (997102246/oth_rwwgf) all show consequence before commitment. Later: approvals and template install render the exact action and its schedule.
- **Finite, counted work.** "1/3" in the header (6479685003/oth_y41r4), "25/512 reviewed" (1476380919/oth_2vran), "Day 1 / 28" (6748603301/oth_ql6h5), "1 of 12" (1081530898/oth_n4ie8). Later: every deck shows n of N and has a designed end.
- **Empty time and empty lists are designed.** Structured writes gaps as content ("Unlock potential in 8h 40m", 1499198946/oth_xnbyf); empty states pair one mark, one line and one action (997102246/oth_xaabc, 1276437113/oth_ddnko). Later: no blank card bodies; every empty state says how it fills.
- **Configuration as a sentence.** Otter (1276437113/onb_1ax13) and Otter's usage line (1276437113/oth_p6qtm). Later: permission summaries and budget lines read as sentences.
- **What all of them do badly (our opening):** none shows *why* an AI action is or is not allowed to run unattended. Later shows the reversibility class and the untrusted-content reason on every approval.

## Per screen type

- **Daily summary / briefing deck.** Finite list with progress (6748603301/oth_ql6h5), one hero number per card (6741707862/oth_howbz), timeline gaps labelled (1499198946/oth_xnbyf). Adopt: Brief card with a day rail whose free time is written as a plan; deck counter and segment bar; cards fill with real content and a provenance strip, never blank space.
- **Swipe-to-decide stack.** Three-control row under the stack with a small centred undo (1586862022/spl_3igbj, 6479685003/oth_y41r4); stamp labels on the tilting card (6479685003/oth_xm067); progress chip "n reviewed" (1586862022/spl_3igbj). Adopt: keep our five-button row (it carries snooze and mute, which D18 requires as explicit buttons) but make undo the small centre control; add the live "draft will say" preview so the card has no empty middle.
- **AI-written draft review and send.** Spark's generated draft with Adjust and Insert (997102246/oth_g4ksq) and the adjust sheet of tone options (997102246/oth_q73ud). Adopt: tone chips stay inline (fewer steps than a sheet); send is a separate, labelled control naming the recipient.
- **Projects / areas overview.** Full-bleed colour tiles with title bottom-left (6459996442/oth_q13ps); goal progress stated with pace (6745416564/oth_wlsz6); Spark's counted bundles (997102246/oth_xm4na). Adopt: Focus tiles with cover art, ordered by need, quiet Spaces stacked into a counted pile.
- **Project detail with board and timeline.** Structured's task detail takes the item colour in its header (1499198946/oth_68fol); Otter's tabs for one item (1276437113/oth_dh3eq). Adopt: compact coloured hero, lenses as a segmented control, an append-only activity log section (D6), budget as a sentence.
- **Voice capture and transcript.** Recording happens on the destination note (1276437113/oth_41dbq); processing checklist ending in a done state (6670175056/oth_wdrix); a source sheet offering other inputs (6670175056/oth_3m66d). Adopt: idle screen offers type / paste / forward alongside the mic, lists recent captures with where they were filed, and gives three example phrasings.
- **Onboarding with connection, working moment, read-back.** Provider rows with a read-only promise directly under the title (1447330651/onb_gksw0); demo escape (1447330651/onb_b2r8h); one question per step with a thin progress bar and "Step n of N" (1276437113/onb_skshv); "Is this true for you?" No/Yes statement (997102246/onb_bdyn8); setup checklist of what was prepared (997102246/onb_9wm27); plan read-back before notifications (1499198946/onb_0pz8o). Adopt all of these; the desktop right panel builds the user's Spaces live as they are found.
- **Budget / spend.** Spark's quota card with refill date (997102246/oth_sn9tg); Otter's sentence meter (1276437113/oth_p6qtm). Adopt: hero figure labelled as an estimate, pace line, per-Space meters with cap editing in a sheet.
- **Approvals / consequential action.** Spark's assistant lists exactly which items an action touches before Archive / Skip (997102246/oth_hear6); confirmation sheets preview the artefact as others will see it (780890907/oth_lahzy); destructive steps name the consequence (1575903244/oth_1htty). Adopt: approval card rendered from tool arguments: app, action, recipient, full content, reversibility class; "Always allow" only for reversible actions on runs that read no untrusted content, with the reason shown when it is withheld.
- **Chat opened from an item.** Otter's chat scoped to one conversation with three suggested prompts (1276437113/oth_363fg); Perplexity's step disclosure and inline sources (1668000334/oth_t1yt6) and follow-ups (1668000334/oth_p8bd9); Spark's in-chat proposal with item list (997102246/oth_hear6). Adopt: the card is pinned at the top as context; answers carry source chips; proposals in chat turn into Drafts or Approvals, never direct sends.
- **Weekly review.** Phase name and horizon (1370327708/oth_1u36n), a one-sentence week summary above bars (1621800675/oth_7tla4), finite "1 of 12" deck (1081530898/oth_n4ie8). Adopt: one card per Space with progress, what moved, what stalled and one proposal (keep, pause, archive, nudge), decided with the same swipe component as Triage.
- **Template gallery and install.** Filter chips over a featured template and rails (1381520124/oth_1rsug); category groups with counts (1338769645/oth_gbmqo); detail that previews the output above one CTA (1337666644/oth_amh79); connector capability list (1668000334/oth_3swfx); "what happens when" rail (1447330651/pay_sa0o5). Adopt: install screen lists every connector scope, permission class, schedule (installed paused), model and monthly budget, plus sample cards the template produces.

## Components

- **Tab bar.** Pill bar with a separate floating primary button (1499198946/oth_xnbyf, 1276437113/onb_xmynk). Kept.
- **Sheets.** Title row with close, selectable rows with a check, locked rows with a lock glyph (1668000334/oth_0v7ef). Snooze rows put the label left and the resolved time right (997102246/oth_zahbw).
- **Progress.** Thin top bar plus "Step n of N" text (1276437113/onb_skshv); counted pills for goals (6745416564/oth_wlsz6).
- **Avatars.** Circles with a surface-coloured ring; initials when no portrait (6445827140/oth_wad3x, 1131203560/oth_78bl8). Later: one flat portrait style for known people, initials for people we have no memory of, a building mark for organisations.
- **Toasts.** Confirmations sit at the bottom edge above the controls, away from the title (frame-stepped 6748599950/oth_nb031 and the platform convention). Later moves phone toasts off the header.

## Material and motion (added after founder feedback: glass, gloss, springs)

Who taught it: Opal (1497465230) for material and depth, TIDE (1077776989/oth_jjyoq) and Pocket Casts (414834813/oth_8dtlo) for glass chrome over imagery, Spark (997102246) and Flashka (6748599950/oth_nb031, frame-stepped) for sheet and card motion.

- **Glass needs colour behind it.** Opal never puts glass over grey: a glow or artwork sits behind every translucent surface (1497465230/oth_jsci1, oth_p2341). Later: each screen gets a soft backdrop built from its Space colours; Today blends the colours of the Spaces in the deck.
- **Two or three tiers, not blur everywhere.** Opal's tiles are thin translucent panels with a hairline light border and a faint top highlight (oth_gbmxf, oth_313tk); its key prompt gets a luminous rim (oth_90b92); its tab bar is a thinner floating glass pill (oth_jsci1). Later: tiers `--glass-card`, `--glass-chrome`, `--glass-sheet`.
- **Sheets take the tint of what they cover.** Green glass over green artwork, red glass for "Leave early?" (oth_81yhu, oth_bxcas). Later: approval sheets and the install sheet tint toward their Space colour; destructive confirms tint toward risk.
- **Hold to confirm.** "Hold to start" and "Hold to leave" make a consequential action a deliberate press with visible fill (oth_81yhu, oth_bxcas). Later: actions that can't be undone use a hold-to-confirm bar.
- **Gloss is one highlight, not chrome.** Opal's primary pill has a soft iridescent edge (onb_akxn1) and its LCD timer a single specular band (oth_og7u1). Later: one specular top edge per card and a sheen that follows the drag on the deck card.
- **Numbers roll in.** The big-number reveal rolls like a picker with neighbours faded (onb_0m8b4). Later: counters and progress ease in on entrance only, never on data being read.
- **Copy arrives in beats.** Opal's onboarding types lines in and dims the previous ones (onb_tvdoy, onb_46zet). Later: onboarding read-back keeps earlier answers dimmed above the current step.

## Template sharing (growth loop)

- **Templates are a main destination.** Canva puts Templates in the tab bar (897446215/oth_8wdnc) with a search field, filter chips that open sheets of preview tiles (oth_uu5xf), a type rail and a trending carousel (oth_katvg). Later: Templates is a tab.
- **Creator profiles.** Avatar with verified mark, one-line bio, a stats row, Follow plus share, then a grid of works with counts (1164423781/oth_d6z2q, 1086101495/oth_tl17f, 6481115809/oth_w4clb). Later: creator page with installs, templates and a Reviewed mark per template.
- **Sharing a public link.** A preview card of the shared item, toggles for what is included, a primary share action and a way to disable the public link (6741517781/oth_qrkgm, 281796108/oth_ppn0i). Later: "Share as template" ends on a preview of the public page, include/exclude list, copy link, and Stop sharing.
- **Remix.** Template pages offer "Use template" and "Remix" (copy, then edit before installing), as video template apps do (1381520124/oth_1rsug). Later: Remix opens the install screen with every field editable.
