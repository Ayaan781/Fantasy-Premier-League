# FPL Sidekick

A multi-page Fantasy Premier League advice prototype built with plain HTML, CSS and JavaScript.

## Quick start on Mac

Double-click `Start FPL Sidekick.command`. It opens the site in your default browser and starts a local server at <http://127.0.0.1:8000/> if one is not already running. Keep the Terminal window open while using the site; closing it stops the server.

If you prefer to start it yourself, open Terminal in this folder and run:

```sh
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/>. Using a local server keeps saved squads and review submissions on one browser origin. No install or framework is needed.

## Pages and features

- `index.html` — homepage and overview.
- `team.html` — full squad builder and submit-for-review flow.
- `how-it-works.html` — analysis inputs, review steps and limitations.
- `about.html` — concept story with clearly labelled placeholder copy.
- `review.html` — local demonstration of the reviewer queue, editable feedback and email draft.

The builder follows the official squad totals: 2 goalkeepers, 5 defenders, 5 midfielders and 3 forwards. Its starting XI requires 1 goalkeeper, 3–5 defenders, 2–5 midfielders and 1–3 forwards. Choosing one of the eight legal formations reshapes the four-player bench while preserving the full-squad totals. The £100.0m budget and three-per-club cap apply to all 15 players.

After a valid squad and email are submitted, the site shows individual player notes and a first-pass outlook using form, season points, minutes, expected points, availability and fixture difficulty across the next five gameweeks. It can suggest position-matched alternatives that fit the current budget. This is a transparent rules-based guide, not a guaranteed points prediction.

## Submission email and review limitations

The team form sends the manager’s email, full squad, fixture context and first-pass analysis to the Formspree endpoint configured in `app.js`. The visitor stays on the page; no mail app opens. Formspree processes the submission and forwards it to the recipient configured for that form. Confirm the recipient and any required verification in the Formspree dashboard before relying on delivery. The public form endpoint is not a secret; do not put private service credentials in frontend files.

The demo Review Desk and its edited feedback are still stored in the current browser’s `localStorage`. They do not sync across devices, and the Review Desk has no login or privacy protection. The reviewer’s final reply to the manager is still prepared as a draft and sent manually; the initial squad submission is the part that is emailed automatically.

This preview is local to your Mac. Before accepting public submissions, deploy the site and publish a clear privacy notice explaining Formspree’s role and data use. Replace the local Review Desk with a private shared workflow if you need to review submissions across devices. About Us copy is also placeholder text and should be replaced before launch.

## Player and fixture data

`players.js` contains the official FPL player and fixture snapshot from 23 September 2026. The builder loads this saved snapshot immediately. Refresh it from both official feeds by running:

```sh
sh refresh-data.sh
```

The refresh script retries temporary network failures, checks that both responses contain usable data, and replaces the snapshot only after a complete refresh succeeds. If the FPL feeds are unavailable, the existing snapshot is left in place and its update date stays visible in the builder.

Sources: <https://fantasy.premierleague.com/api/bootstrap-static/> and <https://fantasy.premierleague.com/api/fixtures/>. FPL Sidekick is an independent fan-made project and is not affiliated with the Premier League or Fantasy Premier League.
