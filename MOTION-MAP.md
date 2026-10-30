# LRS immersive edition — motion map

This edition follows the original LRS homepage's section order and wording. A combined events section is inserted after Society Highlights. The four dated announcements and the recurring Surah Hadid circle share that one section. No separate brothers/sisters routes are generated. Verse-of-the-day remains on the Learn page, outside the original homepage layout.

The application code is written for LRS. References inform the visual language; this is not a pixel-identical clone or a claim that the reference sites' proprietary code was copied.

| Area | Reference / treatment | Actual implementation |
| --- | --- | --- |
| Arrival | User's mosque + Arabic greeting sequence; Lando-style branded arrival | Mosque rises into a gold/green sky, sunlight appears, logo / السلام عليكم / LRS stagger in, scene wipes out to reveal the campus film |
| Navigation | Lando Norris's compact floating navigation and immersive menu | Logo left, central rounded links, Menu right; gold oval follows hovered/focused link; full-screen menu reveal; Namaz Timings is inside menu only |
| Hero | Lando's large-scale typography and layered media | Staggered headline, video parallax, scroll-linked opacity, muted film controls |
| Pillars | Don't Board Me's How It Works process cards | Scroll-scrubbed rising and rotating cards, staged focus, ornamental orbit, progress line; horizontal card swipe on small screens |
| Society Highlights | Lando's image-led editorial treatment and GSAP hover patterns | Original titles/descriptions, floating pointer-following photograph, rotated thumbnail parallax, animated image lightbox |
| Events | Lando-style sideways progression | Pinned horizontal track driven by vertical scroll, container-based photo parallax, five slides, previous/next, pause/play, keyboard and touch controls |
| Prayer timings | User's scroll-driven sunlight request | MotionPath solar arc, scroll-scrubbed dawn/day/sunset/night, changes in sky, stars, moon and mosque light; current congregation times stay fixed to the published daily schedule |
| Memories | Lando's exploratory photo treatment; looping-gallery adaptation | Seamless endless image belt, direct dragging, arrow keys, animated photo opening; one clone only, no unlimited DOM growth |
| Philosophy | Scroll-paced editorial reading | Original text progressively gains opacity word by word; quote reveals inside an arch frame |
| FAQ | User's attached image | Numbered oval markers, text column, plus/minus at the right, multiple disclosures allowed, animated answer heights, dark green folded background |
| Collaborations | Continuous partner ribbon | Infinite locally bundled logo belt; pauses on hover/focus and when offscreen |
| Sponsors | Architectural/Islamic framing | Arch-shaped white cards, green text, gold outlines, scroll entrances and responsive magnetic hover |
| Contact | Original LRS contact layout | Staggered three-column entrances; simple direct email and telephone links |
| Footer / page loop | Continuous exploration, also reflected in Lusion's scroll-to-continue direction | Oversized LRS mark; deliberate continued scrolling after the footer fades back to the top; the ∞ button disables/enables the loop |
| Palestinian Cause | Requested documentary direction | Monochrome-to-colour imagery, large chapter typography, staggered archival initiatives, original LRS initiative text, new sourced humanitarian introduction and direct external action links |
| All sections | Coherent GSAP transitions | Masked heading entrances, gold geometric SVG border drawing, image movement, section opacity, button and cursor reactions |

## References inspected

- https://landonorris.com/ — page structure, navigation markup, content/media organisation.
- https://dontboardme.com/ — page and How It Works implementation: scroll-linked process-card position/rotation, pointer-reactive labels and mobile slider.
- https://www.awwwards.com/websites/sites_of_the_year/ — selection includes Lando Norris, Don't Board Me, Lusion and Igloo.
- https://lusion.co/ — visual-storytelling and scroll-to-continue structure.
- https://www.igloo.inc/ — requested directory reference; page had no readable content, so no claim of a detailed inspection.
- https://feelthewar.in.ua/ — returned HTTP 502/503 during this update. The Palestine treatment is an original documentary-style interpretation, not a verified reproduction of that site's interactions.
- https://lrs.lums.edu.pk/index.html — original homepage content and ordering.
- https://lrs.lums.edu.pk/palestine.html — original initiative copy, photographs and linked media.
- The attached FAQ reference — used for layout, not for its unrelated workspace questions.

## GSAP components actually used

Core timelines, stagger, keyframes/tweens, ticker, quickTo, matchMedia, context cleanup, easing and utilities; ScrollTrigger; SplitText; Flip; DrawSVGPlugin; Observer; MotionPathPlugin; CustomEase; ScrollToPlugin; Draggable.

API documentation: https://gsap.com/docs/v3/

`site/assets/js/experience.js` owns the visual interactions. `app.js` handles content interactions, Flip event filtering, calendar files, daily verses and gallery data. Every GSAP file is bundled locally.

## Motion behaviour

- Events advance after seven idle seconds when visible. Scrolling suspends the timer until the visitor pauses. Focus within event content and hovering the controls suspend it; Pause stops it. The slideshow never advances while the tab is hidden. Reduced-motion mode disables autoplay.
- Desktop events map vertical scroll onto horizontal movement. Small screens use native horizontal swiping, with the same arrow and slideshow controls.
- The solar sky follows scroll and settles back to actual Lahore light after leaving the section. Its motion does not change the published congregation times or claim to calculate prayer-start windows.
- The page loop waits for a deliberate extra downward scroll after the footer. It does not continuously pull the visitor away from footer links. Keyboard navigation does not trigger the loop.
- Native scroll and native dialogs are retained. No audio autoplays. Reduced-motion mode avoids the arrival sequence, pins, autoplay, moving cursor and continuous loops.

## Verification limit

The environment's managed preview service was unavailable. No rendered-browser or touch-device visual review is claimed. Automated content/structure, asset, syntax, prayer, calendar, plugin and actual local-server checks are supplied instead.
