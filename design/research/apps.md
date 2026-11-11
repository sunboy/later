# Later design pass 3: app shortlist

Source: Appllama MCP, studied 2026-11-11. Screen ids are durable (`app_id/screen_id`, open with `get_screen`).
Third-party screenshots were downloaded to a scratch folder for study only and are not in this repo. Nothing here copies an app's copy, art or branding; these are notes on structure.

No founder boards existed (`list_my_boards` returned none), so the shortlist below is ours.

## Walked in full (every screen, images viewed in journey order)

| App | app_id | Screens | Why it is on the list |
|---|---|---|---|
| Spark Mail | 997102246 | 75 | Closest category neighbour: AI email assistant. Onboarding with account connection, inbox bundling, an assistant that proposes actions with the exact affected items, draft adjust sheet, snooze sheets, empty states, AI quota card. |
| Structured | 1499198946 | 25 | Best-in-class day timeline (items sized by duration, gaps written as content) and a personalised plan read-back at the end of onboarding. Calm, finite daily surface. |
| Perplexity | 1668000334 | 27 | Quiet chrome with a single accent, answer layout with step disclosure and inline sources, model picker sheet, Spaces creation, and a connector detail page that lists every capability before "Add". |
| Otter | 1276437113 | 30 | Voice capture: recording happens on the note itself, item detail with Summary / Transcript / Chat tabs, chat scoped to one item with suggested prompts, usage meter written as a sentence, configuration written as a sentence. |
| Copilot Money | 1447330651 | 13 | Account linking with the read-only promise under the title, demo-mode escape, a sample notification shown before the toggle, and a "what happens when" timeline rail. |

Total walked: 170 screens.

## Targeted reference sets (search_screens / get_element_screens)

| Need | Query | Screens viewed | Strongest ids |
|---|---|---|---|
| Swipe-to-decide stack | semantic "swipe card stack…", keyword "swipe" | 16 | 1586862022/spl_3igbj, 6479685003/oth_y41r4, 1476380919/oth_nl71v, 6479685003/oth_xm067, 1476380919/oth_2vran, 872564448/oth_v7dfr |
| Daily plan / briefing home | keyword "daily", screen_type home | 9 | 6748603301/oth_ql6h5, 6741707862/oth_howbz, 6504798650/onb_sdk1i |
| Capture sources and processing | semantic (matched Summary AI) | 5 | 6670175056/oth_3m66d, 6670175056/oth_wdrix, 6670175056/oth_qwdco |
| Confirming a consequential action | keyword "confirm" | 6 | 780890907/oth_lahzy, 1575903244/oth_1htty, 1586861768/oth_0exbe |
| Avatars and people | element brand-art / Circular Profile Avatar | 6 | 333903271/oth_nreh9, 6445827140/oth_wad3x, 1131203560/oth_78bl8 |
| Progress and identity tiles | semantic "project cards with colour cover…" | 7 | 6745416564/oth_wlsz6, 6459996442/oth_q13ps, 6747273681/oth_f1xyy |
| Weekly review | keyword "weekly" | 8 | 1370327708/oth_1u36n, 1621800675/oth_7tla4, 1081530898/oth_n4ie8 |
| Template gallery and detail | keyword "template" | 7 | 1381520124/oth_1rsug, 1338769645/oth_gbmqo, 1337666644/oth_amh79 |
| Generation sheet and toasts (video, 20 frames) | element banners-toasts | 1 flow | 6748599950/oth_nb031 |

Total studied this pass: about 235 screens plus one frame-stepped video.

## Credits

Balance 1,438 at start; 1,401 after research (37 calls).
