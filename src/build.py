"""Build every static page using Python's standard library. Run: python3 src/build.py."""
from pathlib import Path
import json
import html
from datetime import date

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
DATA = json.loads((ROOT / 'src/content.json').read_text())
BASE = './'
PAGES = []

def esc(value):
    return html.escape(str(value), quote=True)

def url(route=''):
    if route.startswith(('http', 'mailto:', 'tel:')):
        return route
    path, sep, query = route.partition('?')
    path, hash_sep, anchor = path.partition('#')
    target = BASE + (path.strip('/') + '/' if path.strip('/') else '') + 'index.html'
    return target + (('?' + query) if sep else '') + (('#' + anchor) if hash_sep else '')

def asset(path):
    return BASE + 'assets/' + path

def link(route, text, cls='text-link', extra=''):
    return f'<a href="{esc(url(route))}" class="{cls}" {extra}>{text}<span aria-hidden="true">↗</span></a>'



def intro(kicker,title,description,route='',extra=''):
    return f'<section class="page-intro"><div class="wrap"><div class="breadcrumb"><a href="{url()}">Home</a><span aria-hidden="true">/</span><span>{esc(kicker)}</span></div><p class="eyebrow">{esc(kicker)}</p><h1>{title}</h1><p class="lead">{description}</p>{extra}</div></section>'

def section_head(kicker,title,action='',description=''):
    return f'<div class="section-head"><div><p class="eyebrow">{kicker}</p><h2>{title}</h2></div>{action or (f"<p class=muted>{description}</p>" if description else "")}</div>'

def audience(e):
    return {'sisters':'Sisters','brothers':'Brothers','both':'Brothers & sisters','everyone':'Everyone','unconfirmed':'Audience to confirm'}[e['audience']]

def date_label(e):
    return date.fromisoformat(e['date']).strftime('%d %b %Y')


def event_card(e):
    return f'''<article class="event-card reveal" data-event="{e['slug']}" data-date="{e['date']}">{art(e)}<div class="card-body"><div class="card-meta"><span class="tag">{e['category']}</span><span class="tag">{audience(e)}</span><span class="tag gold-tag" data-event-status>Event</span></div><h3><a href="{url('events/'+e['slug'])}">{esc(e['title'])}</a></h3><div class="event-info"><span>{date_label(e)} · {esc(e['time'])}</span><span>{esc(e['venue'])}</span></div>{link('events/'+e['slug'],'View event')}</div></article>'''

def event_feed(events=None, initial='all', locked='', compact=False):
    events = DATA['events'] if events is None else events
    filters = f'''<div class="filter-panel"><div class="filters"><div class="field search"><label for="search">Search events</label><input id="search" type="search" placeholder="Title, speaker, or venue…" data-filter="search"></div><div class="field"><label for="period">When</label><select id="period" data-filter="period"><option value="all">All dates</option><option value="week">Next 7 days</option><option value="upcoming">Upcoming</option><option value="past">Past events</option></select></div><div class="field"><label for="audience">Audience</label><select id="audience" data-filter="audience" {'disabled' if locked else ''}><option value="all">All audiences</option><option value="brothers">Brothers</option><option value="sisters">Sisters</option></select></div><div class="field"><label for="venue">Venue</label><select id="venue" data-filter="venue"><option value="all">All venues</option><option value="male">Male side</option><option value="female">Female side</option><option value="mosque">Mosque · shared / to confirm</option><option value="campus">Other campus venues</option></select></div></div><div class="filter-toolbar"><span data-result-count role="status" aria-live="polite">{len(events)} events</span><button class="reset-filters" type="button">Reset filters</button></div></div>'''
    return f'<div class="{"home-feed" if compact else "event-feed"}" data-event-feed data-initial-period="{initial}" data-locked-audience="{locked}">{filters}<div class="grid">'+''.join(event_card(e) for e in events)+f'<div class="empty-state" hidden data-empty><h3>A quieter moment.</h3><p>No events match these filters. Try another date range, explore recurring programmes, or contact LRS for the latest updates.</p><div class="spaced">{link("programmes/exploring-surah-hadid","Explore regular circles")}</div></div></div></div>'





def resource(title, label, desc, route, icon='✧'):
    return f'<article class="resource-card reveal"><span class="resource-icon" aria-hidden="true">{icon}</span><p class="eyebrow">{label}</p><h3>{title}</h3><p>{desc}</p>{link(route,"Explore")}</article>'

def join():
    return f'<section class="join-band"><div class="wrap"><div><p class="eyebrow">There is a place for you here</p><h2 class="spaced">Come as you are.</h2><p>Attend a circle, ask a question, or help make something meaningful happen.</p></div>{link("get-involved","Find your place","btn")}</div></section>'




def mosque():
    return intro('Mosque & Community','A place to pray.<br><em>A place to belong.</em>','Find prayer information, regular circles, and community activities across the LUMS masjid spaces.',extra=f'<nav class="anchor-nav" aria-label="Mosque sections"><a href="#timings">Prayer timings</a><a href="#spaces">Our spaces</a><a href="#circles">Regular circles</a><a href="#visiting">Visiting</a></nav>')+f'''<section class="section" id="timings"><div class="wrap">{prayer_scene()}</div></section><section class="section bg-sage" id="spaces"><div class="wrap">{section_head('Find your community','Two spaces. <em>A shared purpose.</em>')}<div class="grid two"><article class="venue-card"><p class="eyebrow">Brothers</p><h3>Brothers’ activities</h3><p>Explore relevant gatherings and events, including retreats with separate arrangements.</p>{link('mosque/brothers','Explore activities','btn')}</article><article class="venue-card"><p class="eyebrow">Sisters</p><h3>Sisters’ activities</h3><p>Quran circles, halaqas, and community gatherings, including activities on the female side of the masjid.</p>{link('mosque/sisters','Explore activities','btn')}</article></div></div></section><section class="section" id="circles"><div class="wrap split"><div><p class="eyebrow">Keep coming back</p><h2 class="spaced">Regular circles.<br><em>Lasting connections.</em></h2><p class="muted spaced">Programme pages bring the schedule and venue together. Confirm the next session, especially around exams and semester breaks.</p></div><div>{programme_card()}</div></div></section><section class="section bg-sage" id="visiting"><div class="wrap split"><div class="prose"><p class="eyebrow">Your first visit</p><h2>A little preparation.<br><em>A warm beginning.</em></h2><p>Read the event’s audience, location, and registration details. If a room or entrance is unclear, ask the organisers before you arrive.</p><p>Keep phones silent in prayer spaces, follow the mosque’s posted guidance, and respect others’ privacy when taking photographs.</p>{link('contact','Ask LRS a question')}</div><div class="map-panel"><p class="eyebrow">On campus</p><h3>LUMS · DHA, Lahore</h3><p>Confirm the appropriate masjid entrance, room, and campus access arrangements with the organisers. Accessibility and facility details have not yet been supplied.</p>{link('https://www.google.com/maps/search/?api=1&query=LUMS+Mosque+Lahore','Find the mosque on Maps','btn secondary')}</div></div></section>'''


def audience_page(kind):
    name='Sisters' if kind=='sisters' else 'Brothers'
    return intro(name+'’ activities',f'Faith. Friendship.<br><em>{name} in community.</em>',f'Find activities relevant to {kind}, with each event’s venue and arrangements shown clearly.')+f'<section class="section"><div class="wrap">{section_head("Your community agenda","Gather, learn, <em>reconnect.</em>")}{event_feed(locked=kind)}</div></section>'+ (f'<section class="section bg-sage"><div class="wrap narrow">{section_head("A weekly rhythm","Explore Surah <em>Hadid.</em>")}{programme_card()}</div></section>' if kind=='sisters' else f'<section class="section bg-sage"><div class="wrap narrow prose"><p class="eyebrow">Regular gatherings</p><h2>Looking for a <em>weekly circle?</em></h2><p>A confirmed brothers’ recurring schedule has not been supplied yet. Contact LRS for current halaqas and other regular activities.</p>{link("contact","Ask about regular programmes","btn")}</div></section>')+join()


def agenda():
    rows=''.join(f'<article class="agenda-row" data-event="{e["slug"]}"><div class="date">{date_label(e)}</div><div><h3><a href="{url("events/"+e["slug"])}">{e["title"]}</a></h3><p>{e["time"]} · {e["venue"]}</p></div>{link("events/"+e["slug"],"Details")}</article>' for e in sorted(DATA['events'],key=lambda e:e['date'],reverse=True))
    return intro('Event agenda','Your community,<br><em>in the calendar.</em>','All supplied dated events, newest first. Recurring programmes have separate pages until individual sessions are confirmed.')+f'<section class="section"><div class="wrap">{rows}<div class="spaced">{link("events","Back to event filters")}</div></div></section>'

def event_detail(e):
    detail_art=art(e,'detail-art')
    registration = f'<a class="btn" href="{e["registration"]}" data-registration>Registration website ↗</a><p class="fine spaced" data-registration-note>Registration is required. Availability is managed by the organisers.</p>' if e['registration'] else '<p class="fine">No registration link was supplied for this event.</p>'
    return intro(e['category'],esc(e['title']),esc(e['subtitle']))+f'''<section class="section" data-event-detail="{e['slug']}"><div class="wrap detail-grid"><article><div class="card-meta"><span class="tag">{audience(e)}</span><span class="tag gold-tag" data-detail-status>Event announcement</span></div>{detail_art}<p class="detail-description">{esc(e['description'])}</p>{''.join('<p class=detail-description>'+esc(paragraph)+'</p>' for paragraph in e.get('body',[]))}{('<h2 class="spaced" style="font-size:30px">With</h2><p class="spaced">'+esc(e['speaker'])+'</p>') if e['speaker'] else ''}<ul class="details-list">{''.join('<li>'+esc(n)+'</li>' for n in e['notes'])}</ul><p class="source-note">Details transcribed from the announcement supplied for this redesign. Confirm any unclear access or venue arrangements with LRS.</p></article><aside class="detail-sidebar" aria-label="Event information"><dl><dt>Date</dt><dd>{date_label(e)}{(' – '+date.fromisoformat(e['endDate']).strftime('%d %b')) if e['endDate'] != e['date'] else ''}</dd><dt>Time · Lahore</dt><dd>{esc(e['time'])}</dd><dt>Location</dt><dd>{esc(e['venue'])}</dd><dt>Audience</dt><dd>{audience(e)}</dd></dl><div class="stack">{registration}<button class="btn secondary" type="button" data-calendar="{e['slug']}">Add to calendar ↓</button><button class="reset-filters" type="button" data-share-event>Share this event ↗</button></div>{('<p class="fine spaced">Calendar entry is a date reminder; exact prayer-relative start and end times must be confirmed.</p>') if not e['start'] else '<p class="fine spaced">Calendar entry includes the announced start time. No end time was supplied.</p>'}<hr class="rule">{link('mailto:faith@lums.edu.pk','Ask the organisers')}</aside></div></section>'''



def learn():
    return intro('Learn & reflect','A little knowledge.<br><em>A deeper connection.</em>','Explore society resources and established reading destinations. Take a question with you, and make space for reflection.')+f'''<section class="section"><div class="wrap"><div class="grid">{resource('Tafakkur','Think tank','Explore an initiative for young thinkers and civilisational inquiry.','tafakkur')}{resource('Publications','LRS writing','Find the society’s publication archive.','publications','≋')}{resource('Surah Hadid','Quran circle','Read and reflect with the sisters’ weekly circle.','programmes/exploring-surah-hadid','۞')}</div></div></section>{verse()}<section class="section"><div class="wrap">{section_head('A starting point','Explore further.')}<div class="grid">{resource('Quran.com','External resource','Read the Quran, explore translations, and listen to recitation.','https://quran.com','۞')}{resource('Yaqeen Institute','External resource','Explore Islamic research and educational resources.','https://yaqeeninstitute.org','≋')}{resource('Making room for reflection','Reading guide','A practical introduction to preparing for a reading circle.','learn/making-room-for-reflection','✧')}</div></div></section>'''

def archive_page(which):
    if which=='tafakkur':
        tracks=''.join(f'<article class="venue-card"><p class="eyebrow">Track {i}</p><h3>{title}</h3><p>{desc}</p></article>' for i,(title,desc) in enumerate([('Economics','Institutions, resources, and the questions behind prosperity.'),('International politics','Power, diplomacy, and the Muslim world’s place in global affairs.'),('Technology','Innovation, knowledge, and ethical choices in a changing world.'),('Education','Learning, critical inquiry, and civilisational renewal.')],1))
        return intro('Tafakkur','Think deeply.<br><em>Build thoughtfully.</em>','Tafakkur is LRS’s Muslim civilisational think tank: an initiative for young people to engage with contemporary questions through an Islamic framework.')+f'<section class="section"><div class="wrap split"><div class="prose"><p class="eyebrow">2026 edition · 15 August</p><h2>Ideas into <em>inquiry.</em></h2><p>The inaugural programme brought together nominated students aged 16–19 for masterclasses, policy labs, and collaborative problem-solving.</p><p>This edition has concluded. Enquiries about future editions can be directed to the programme team.</p>{link("mailto:tafakkur.lrs@gmail.com","Contact the Tafakkur team","btn")}</div><div class="venue-card"><p class="eyebrow">The day’s structure</p><h3>Learn. Discuss. Present.</h3><p>Expert-led sessions opened into team debate, case-study work, and presentations, followed by a closing panel and awards.</p>{link("https://lrs.lums.edu.pk/tafakkur.html","Original programme archive")}</div></div></section><section class="section bg-sage"><div class="wrap">{section_head("Four areas of inquiry","Questions worth <em>exploring.</em>")}<div class="grid two">{tracks}</div><p class="source-note">Programme facts: <a href="https://lrs.lums.edu.pk/tafakkur.html">LRS Tafakkur archive</a>.</p></div></section>'
    return intro('Publications','Words to return to.<br><em>Ideas to carry forward.</em>','Explore writing and reflections from the LRS publication archive.')+f'<section class="section"><div class="wrap grid two">{resource("The Call","Magazine · Fall 2015","A collection of campus voices, reflections, and literary work.","https://lrs.lums.edu.pk/img/Publications/1/The%20Call.pdf","≋")}{resource("LRS Newsletter","February 2018","A window into the society’s sessions and community life.","https://lrs.lums.edu.pk/img/Publications/2/feb-newsletter-2018-1.pdf","≋")}</div><div class="wrap"><p class="source-note">PDFs remain hosted by LRS. If a document is unavailable, try the <a href="https://lrs.lums.edu.pk/publications.html">original publications page</a>.</p></div></section>'+join()

def reflection():
    return intro('Reading guide','Making room<br><em>for reflection.</em>','A short, practical guide to approaching a reading circle. This is an editorial guide for the redesign, not a scholarly tafsir.')+f'<section class="section"><article class="wrap narrow prose"><h2>Before the circle</h2><p>Read the announced passage and note any questions. Look up the venue and confirm the session time before attending.</p><h2>During the conversation</h2><p>Listen carefully, ask sincerely, and allow others space to speak. Keep a distinction between the Quranic text, a named translation, scholarly explanation, and personal reflection.</p><h2>Afterwards</h2><p>Return to the passage in context. If something remains unclear, ask the teacher or consult the resources they recommend.</p>{link("programmes/exploring-surah-hadid","Explore the Surah Hadid circle","btn")}</article></section>'

def palestine():
    e=next(e for e in DATA['events'] if e['slug']=='why-al-aqsa-still-calls-us')
    return intro('Palestine & solidarity','A call to care.<br><em>A responsibility to learn.</em>','A space for LRS’s Palestine-related conversations, solidarity initiatives, and community engagement.')+f'''<section class="section"><div class="wrap split"><div class="prose"><p class="eyebrow">Sada-e-Haq · A Call for Solidarity</p><h2>Why Al Aqsa<br><em>still calls us.</em></h2><p>The Day 2 gathering invited students to reflect on Al Aqsa’s place in faith and the continuing call to solidarity with Palestine.</p><p>With Ustaz Abdul Rehman Siddiqui and Mufti Atta-ur-Rehman from Al-Burhan Institute.</p>{link('events/'+e['slug'],'Read the event announcement','btn')}</div><div>{event_card(e)}</div></div></section><section class="section bg-sage"><div class="wrap">{section_head('Learn. Reflect. Participate.','Stay connected to <em>the work.</em>')}<div class="grid">{resource('Attend a conversation','Community','Find announced talks and discussions in the event directory.','events')}{resource('Explore existing initiatives','LRS archive','Visit the Palestinian Cause section on the existing LRS website.','https://lrs.lums.edu.pk/palestine.html')}{resource('Offer your time','Get involved','Ask LRS about current solidarity and service opportunities.','get-involved')}</div></div></section>'''

def lrf(edition=None):
    if edition:
        info={
            '3.0':('30 January – 1 February 2026','The third edition brought students together for scholarship, creativity, and community. Its programme included research and essays, entrepreneurship, visual storytelling, an Islamic quiz, calligraphy, debate, and recitation.'),
            '2.0':('Edition retrospective','The second edition’s archive brings together team and individual competitions: Islamic knowledge, ethical enterprise, creative work, calligraphy, debate, and recitation.'),
            '1.0':('The inaugural edition','The first edition combined religious-themed competitions with community activities, sports, and workshops in Tajweed and calligraphy.')
        }
        date_text,description=info[edition]
        source='https://lrs.lums.edu.pk/lrf'+edition+'.html'
        return intro('LUMS Religious Festival',f'LRF <em>{edition}.</em>',date_text)+f'<section class="section"><div class="wrap split"><div class="prose"><p class="eyebrow">From the festival archive</p><h2>Learning beyond<br><em>the classroom.</em></h2><p>{description}</p>{link(source,"Explore this edition’s archive","btn")}</div><div class="venue-card"><p class="eyebrow">Revisit the programme</p><h3>Categories, guides & memories</h3><p>Find the edition’s original details and linked resources on the society website. Historical registration information is retained there as an archive.</p>{link("lrf","All editions")}</div></div></section>'
    return intro('LUMS Religious Festival','A space for<br><em>bigger conversations.</em>','Explore the society’s festival editions: opportunities for students to learn, create, and connect.')+f'<section class="section"><div class="wrap grid">'+''.join(resource('LRF '+n,'Edition archive','Revisit the programme and its original resources.','lrf/'+n) for n in ['3.0','2.0','1.0'])+'</div></section>'

def involvement():
    return intro('Get involved','Bring your questions.<br><em>Bring yourself.</em>','There are many ways to be part of the LRS community. Start with a gathering, a conversation, or an offer to help.')+f'''<section class="section"><div class="wrap grid">{resource('Attend','01 · Take a first step','Find an event, check its audience and registration requirements, and come along.','events')}{resource('Volunteer','02 · Offer your time','Tell LRS what you enjoy: writing, design, event support, outreach, or community service.','mailto:faith@lums.edu.pk?subject=Volunteering%20with%20LRS')}{resource('Collaborate','03 · Build together','Share an idea for a programme, workshop, or community initiative.','mailto:faith@lums.edu.pk?subject=Collaboration%20enquiry')}</div></section><section class="section bg-sage"><div class="wrap split"><div class="prose"><p class="eyebrow">Society membership</p><h2>Your next step<br><em>starts with a hello.</em></h2><p>Membership applications follow the society’s recruitment cycle. Contact the team to ask about current openings and participation opportunities.</p>{link('mailto:faith@lums.edu.pk?subject=LRS%20membership%20enquiry','Ask about membership','btn')}</div><div>{faq()}</div></div></section>'''

def contact():
    return intro('Contact & FAQs','Let’s start<br><em>a conversation.</em>','Questions about attending, volunteering, or collaborating? Reach out through the official society email.')+f'''<section class="section"><div class="wrap split"><div class="prose"><p class="eyebrow">Official contact</p><h2 style="font-size:clamp(28px,4vw,48px)"><a href="mailto:faith@lums.edu.pk">faith@lums.edu.pk</a></h2><p>LUMS, DHA, Lahore Cantt, 54792<br>Lahore, Pakistan</p><div class="button-row">{link('mailto:faith@lums.edu.pk','Email LRS','btn')}<button class="btn secondary" type="button" data-copy-email>Copy email</button></div><p class="fine">For an event enquiry, include its title and date. Confirm campus access and the exact venue with the organisers.</p></div><div class="map-panel"><p class="eyebrow">Find your way</p><h3>LUMS campus</h3><p>Use the map to locate campus, then follow the event’s meeting-point guidance.</p>{link('https://www.google.com/maps/search/?api=1&query=LUMS+Lahore','Open campus map','btn secondary')}</div></div></section><section class="section bg-sage"><div class="wrap narrow">{section_head('A few helpful answers','Before you <em>join us.</em>')}{faq()}</div></section>'''

def privacy():
    return intro('Privacy','A simpler,<br><em>quieter website.</em>','How this downloadable version handles information.')+f'<section class="section"><article class="wrap narrow prose"><h2>No account required</h2><p>This version has no login, analytics, advertising trackers, or newsletter database. Event filters and scene selection run in your browser.</p><h2>External destinations</h2><p>Registration, email, maps, and learning links open external services. Those services have their own privacy practices. Registration information is not collected by this website.</p><h2>Calendar and sharing</h2><p>Calendar files are generated locally when requested. Copy buttons use the clipboard only after you click them; sharing uses your device’s share dialog where supported.</p><h2>Hosting</h2><p>A future hosting provider may keep ordinary request logs. The site owner should update this notice if analytics, embedded media, forms, or other services are added.</p><h2>Contact</h2><p>For society-related questions, email <a href="mailto:faith@lums.edu.pk">faith@lums.edu.pk</a>.</p></article></section>'

def not_found():
    return intro('404 · Page not found','A little off<br><em>the beaten path.</em>','This page may have moved. Return home or explore the community agenda.')+f'<section class="section"><div class="wrap button-row">{link("","Back home","btn")}{link("events","Explore events","btn secondary")}</div></section>'

def write(route,title,desc,render):
    global BASE
    BASE='../'*len(route.split('/')) if route else './'
    output=SITE/route/'index.html'
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(layout(route,title,desc,render()),encoding='utf-8')
    PAGES.append(str(output.relative_to(SITE)))

def main():
    write('','Home','Faith, reflection, and community at LUMS. Explore prayer information, events, and learning circles.',home)
    for route,title,render in [('about','About LRS',about),('mosque','Mosque & Community',mosque),('mosque/timings','Prayer Timings',timings),('events','Events & Archive',events_page),('events/agenda','Event Agenda',agenda),('learn','Learn & Reflect',learn),('tafakkur','Tafakkur',lambda:archive_page('tafakkur')),('publications','Publications',lambda:archive_page('publications')),('learn/making-room-for-reflection','Making Room for Reflection',reflection),('palestine','Palestine & Solidarity',palestine),('lrf','LRF',lrf),('get-involved','Get Involved',involvement),('contact','Contact & FAQs',contact),('privacy','Privacy',privacy),('404','Page Not Found',not_found)]:
        write(route,title,title+' · LUMS Religious Society',render)
    write('gallery','Moments & Memories','Community photographs from the original LRS website.',lambda:intro('Moments & memories','Shared moments.<br><em>A living community.</em>','Capturing the memorable moments, communal bonds, and spiritual spirit across our sessions. Select an image to view it in full.')+f'<section class="section"><div class="wrap">{gallery()}<p class="source-note">Photographs from the original LRS website archive.</p></div></section>')
    for e in DATA['events']:
        write('events/'+e['slug'],e['title'],e['description'],lambda e=e:event_detail(e))
    for p in DATA['programmes']:
        write('programmes/'+p['slug'],p['title'],p['description'],lambda p=p:programme(p))
    for edition in ['3.0','2.0','1.0']:
        write('lrf/'+edition,'LRF '+edition,'LRF edition archive',lambda edition=edition:lrf(edition))
    (SITE/'assets/js/data.js').write_text('/* Generated from src/content.json. Edit the source and rebuild. */\nwindow.LRS_DATA = '+json.dumps(DATA,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    (ROOT/'src/routes.json').write_text(json.dumps(PAGES,indent=2)+'\n')
    # Root entry point works by double-clicking, with no web server or build required.
    (ROOT/'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=site/index.html"><title>LRS website</title></head><body><p><a href="site/index.html">Open the LRS website</a></p></body></html>')
    print(f'Built {len(PAGES)} pages in {SITE}')

if __name__=='__main__':
    import sys
    from redesign import install
    install(sys.modules[__name__])
    from experience import install as install_experience
    install_experience(sys.modules[__name__])
    main()
