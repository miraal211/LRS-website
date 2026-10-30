# LRS — Immersive Green / White / Gold Edition

Extract into a new folder and open `lrs-complete/index.html`. No JSON extension, installation, internet connection or localhost is needed for the bundled website. External archives, registration pages, donation pages and linked Palestine videos require internet access.

## This update

The homepage retains the original section order and all 23 checked source paragraphs, adding one combined events sequence after Society Highlights. The original introduction, pillars, highlight entries, prayer-section wording, memories description, philosophy, FAQs, collaborations, sponsors and contact content are retained. No invented promotional copy is inserted in those sections.

The navigation is inspired by Lando Norris's floating layout. Gold oval shading follows hover/focus. Prayer timings are inside the menu, not in the top navigation. The opening animates a mosque, the logo, LRS and السلام عليكم before revealing the campus video.

The events sequence contains all four dated announcements plus Exploring Surah Hadid. It scrolls sideways as the desktop page scrolls down; on mobile it swipes horizontally. Slideshow autoplay, pause/play, arrows and keyboard controls are included. Separate brothers/sisters pages have been removed; relevant audience/location details remain within each event.

Pillars use scroll-controlled rising/rotating cards inspired by Don't Board Me's process section. The sun follows scroll along a curved path, with changing sky, moon, stars and mosque lighting. Other treatments include a draggable infinite memories gallery, image hover previews, animated lightboxes, heading/paragraph opacity transitions, SVG Islamic borders, looping partner logos, the referenced numbered FAQ and a controllable end-of-page loop.

The Palestine page retains original LRS initiative content and adds a sourced humanitarian introduction and action links. Donations go directly to UNRWA's official website; this project collects no payments.

Read `MOTION-MAP.md` for the section-by-section design choices, source references and interaction behaviour.

## Run

- Double-click `index.html` in the extracted `lrs-complete` folder.
- VS Code: open `LRS.code-workspace`, select **LRS - Open in Chrome (no server needed)** or Edge, then press F5.
- Optional Node server: run `npm start` in this folder and open the exact printed address. No `npm install` is required.
- Optional Python server on Windows: `py -m http.server 8000 --directory site`, run from this folder.

See `START-HERE.md` for the complete launch instructions.

## Edit

| Location | Purpose |
| --- | --- |
| `src/experience.py` | Current homepage, navigation, menu, events track, FAQ, prayer markup and Palestine templates |
| `src/redesign.py` | Shared constants/media helpers and retained secondary-page templates |
| `src/build.py` | Standard-library Python generator and route definitions |
| `src/content.json` | Events, programme, verses and published mosque timetable |
| `src/original-home-content.json` | Original homepage content regression contract |
| `src/palestine-original-body.html` | Retained original LRS Palestine initiative content |
| `site/assets/js/experience.js` | All current GSAP motion systems |
| `site/assets/js/app.js` | Content filters, Flip reflow, calendars, sharing and gallery data |
| `site/assets/js/prayer-engine.js` | Lahore date/time, published schedule and solar calculations |
| `site/assets/css/experience.css` | Current visual design, ornament and responsive layouts |
| `site/assets/css/styles.css`, `cinematic.css` | Shared/base component styles used by secondary pages |
| `site/assets/css/experience-fonts.css` | Local Syne, Bodoni Moda and Amiri fonts |
| `site/assets/vendor/` | Local GSAP core, nine plugins and SunCalc |
| `site/assets/media/` | Local original LRS photos, highlight artwork, logo and video |
| `scripts/serve.mjs` | Optional local Node HTTP server, including video ranges |
| `.vscode/launch.json` | Direct-file and optional server browser launch settings |

After changing content or Python templates, run `py src/build.py` (or `python3 src/build.py`). CSS and JavaScript can be edited directly. Generated HTML and `data.js` are already included.

HTML, CSS and JavaScript power the site. Python only regenerates pages; Node is optional for the server/tests. No React/TypeScript/framework setup is required.

## Prayer and event data

The timetable is a snapshot of the original LRS schedule recorded on 30 October 2026, not a live administration feed. Fajr, Asr and Isha follow its half-month rows; Zuhr/Jummah are 1:30 PM; Maghrib uses sunset plus one minute, as on the original site. SunCalc uses the original mosque coordinates. All dates use Asia/Karachi. Update the timetable source when the mosque changes it.

The highlighted card represents the most recent scheduled congregation, not a statement about the legal end of a prayer window. Fajr's highlight clears at sunrise. Scroll changes the illustrative sky, not the actual time labels.

The dated announcements are 2026; their status changes automatically to archive items after their dates. The Surah Hadid programme has no invented next confirmed session. Unknown audience/meeting-point information remains explicitly unconfirmed.

## Routes

25 pages: Home, About, Events, Agenda, four event details, Mosque, Prayer Timings, Surah Hadid programme, Learn & Reflect, reflection guide, Tafakkur, Publications, Palestine, LRF overview, three LRF editions, Gallery, Get Involved, Contact, Privacy and 404. `src/routes.json` has their exact paths. Learning pages from the previous edition remain accessible separately; they are not additional homepage sections.

## Checks

```text
node --test tests/*.test.cjs
python tests/check_site.py
python tests/content_contract.py
```

These cover data/calendar behaviour, Lahore date boundaries and solar calculations, the actual local HTTP server and video byte ranges, local links/assets/landmarks, original homepage paragraph retention, section order, menu placement, combined event structure and donation destination.

The managed browser preview service was unavailable. Rendered desktop/mobile appearance and VS Code's GUI launch were not verified here. The code should be visually checked in your browser before publication.

Third-party copyright notices are retained. See `THIRD-PARTY-NOTICES.md` and `src/asset-sources.json` for provenance.
