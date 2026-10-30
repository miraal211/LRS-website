/* LRS website: content and accessible interactions. All dates use Asia/Karachi. */
(function () {
  'use strict';
  const ZONE = 'Asia/Karachi';
  function dayKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const value = type => parts.find(p => p.type === type).value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  }
  function addDays(day, amount) {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
  function eventStatus(event, today = dayKey()) {
    if ((event.endDate || event.date) < today) return 'Past event';
    if (event.date <= today) return 'Today';
    return 'Upcoming';
  }
  function audienceMatches(event, requested) {
    return requested === 'all' || event.audience === requested || event.audience === 'both' || event.audience === 'everyone';
  }
  function matchesEvent(event, filters, today = dayKey()) {
    const query = (filters.search || '').trim().toLocaleLowerCase();
    const text = [event.title, event.subtitle, event.description, event.speaker, event.venue, event.category].join(' ').toLocaleLowerCase();
    if (query && !text.includes(query)) return false;
    if (!audienceMatches(event, filters.audience || 'all')) return false;
    if (filters.venue && filters.venue !== 'all' && event.venueGroup !== filters.venue) return false;
    const end = event.endDate || event.date;
    switch (filters.period) {
      case 'week': return end >= today && event.date <= addDays(today, 6);
      case 'upcoming': return end >= today;
      case 'past': return end < today;
      default: return true;
    }
  }
  function escapeICS(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
  function foldICS(line) {
    // RFC 5545 folds at 75 octets, without splitting a UTF-8 character.
    const encoder = new TextEncoder();
    let lines = [], current = '', bytes = 0;
    for (const char of line) {
      const size = encoder.encode(char).length;
      if (bytes + size > 75) { lines.push(current); current = ' '; bytes = 1; }
      current += char; bytes += size;
    }
    lines.push(current);
    return lines.join('\r\n');
  }
  function calendarText(event, now = new Date()) {
    const compact = day => day.replace(/-/g, '');
    const utc = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LRS Redesign//Community Events//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${event.slug}@lrs-redesign.local`, `DTSTAMP:${utc(now)}`, `SUMMARY:${escapeICS(event.title)}`];
    if (event.start && /^\d{2}:\d{2}$/.test(event.start)) {
      lines.push(`DTSTART:${utc(new Date(`${event.date}T${event.start}:00+05:00`))}`);
      if (event.end) lines.push(`DTEND:${utc(new Date(`${event.endDate || event.date}T${event.end}:00+05:00`))}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compact(event.date)}`, `DTEND;VALUE=DATE:${compact(addDays(event.endDate || event.date, 1))}`);
    }
    const note = event.start ? 'No end time supplied; confirm with the organisers.' : 'Date reminder only. Confirm exact prayer-relative times with the organisers.';
    lines.push(`DESCRIPTION:${escapeICS(`${event.description}\n${event.time} (Lahore / PKT)\n${note}\n${(event.notes || []).join('\n')}`)}`, `LOCATION:${escapeICS(event.venue)}`);
    if (event.registration) lines.push(`URL:${event.registration}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.map(foldICS).join('\r\n') + '\r\n';
  }
  function verseIndex(date, count) {
    const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
    return ((days % count) + count) % count;
  }
  function verifiedSchedule(prayers, today = dayKey()) {
    if (!prayers || !prayers.verifiedBy) return null;
    return (prayers.schedule || []).find(row => row.date === today && row.verified === true) || null;
  }
  function validTime(value) { return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
  function displayTime(value) {
    if (!validTime(value)) return 'Not confirmed';
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  }
  function nextPrayer(schedule, now = new Date()) {
    if (!schedule) return null;
    for (const name of ['fajr', 'zuhr', 'asr', 'maghrib', 'isha']) {
      const time = schedule[name]?.jamaat;
      if (!validTime(time)) continue;
      const at = new Date(`${schedule.date}T${time}:00+05:00`);
      if (at > now) return {name, at};
    }
    return null;
  }
  const helpers = {dayKey, addDays, eventStatus, audienceMatches, matchesEvent, calendarText, verseIndex, verifiedSchedule, displayTime, nextPrayer};
  if (typeof module !== 'undefined' && module.exports) module.exports = helpers;
  if (typeof document === 'undefined') return;
  const data = window.LRS_DATA;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let toastTimer;
  function toast(message) {
    const box = $('.toast');
    if (!box) return;
    clearTimeout(toastTimer); box.textContent = message; box.hidden = false;
    toastTimer = setTimeout(() => { box.hidden = true; }, 4500);
  }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const input = document.createElement('textarea');
        input.value = text; input.setAttribute('readonly', ''); input.style.position = 'fixed'; input.style.left = '-9999px';
        document.body.append(input); input.select();
        const succeeded = document.execCommand('copy'); input.remove();
        if (!succeeded) throw new Error('Clipboard not available');
      }
      toast('Copied to clipboard.');
    } catch { toast('Clipboard unavailable. Please select and copy the text manually.'); }
  }
  async function share(payload) {
    if (navigator.share && location.protocol !== 'file:') {
      try { await navigator.share(payload); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    await copy([payload.title, payload.text, payload.url].filter(Boolean).join('\n'));
  }

  // Header and mobile navigation.
  const menu = $('.menu-toggle'), nav = $('.main-nav');
  function closeMenu() { if (!menu) return; menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  $$('[data-year]').forEach(el => { el.textContent = dayKey().slice(0, 4); });

  // One editable event source powers every listing and detail page.
  function updateStatuses() {
    $$('[data-event]').forEach(card => {
      const e = data.events.find(e => e.slug === card.dataset.event);
      const status = $('[data-event-status]', card);
      if (e && status) status.textContent = eventStatus(e);
    });
    const detail = $('[data-event-detail]');
    if (detail) {
      const e = data.events.find(e => e.slug === detail.dataset.eventDetail);
      $('[data-detail-status]', detail).textContent = eventStatus(e);
      const registration = $('[data-registration]', detail);
      if (registration && eventStatus(e) === 'Past event') {
        registration.textContent = 'Original registration website ↗';
        $('[data-registration-note]', detail).textContent = 'This event has passed. This link is retained as part of the announcement archive.';
      }
    }
  }
  const feedRenders = [];
  $$('[data-event-feed]').forEach(feed => {
    const controls = $$('[data-filter]', feed);
    const locked = feed.dataset.lockedAudience;
    const params = new URLSearchParams(location.search);
    controls.forEach(control => {
      const key = control.dataset.filter;
      const initial = key === 'audience' && locked ? locked : (params.get(key) || (key === 'period' ? feed.dataset.initialPeriod : ''));
      if (control.tagName === 'SELECT') {
        if ([...control.options].some(o => o.value === initial)) control.value = initial;
      } else if (initial) control.value = initial;
    });
    function render(animate = false) {
      const filters = Object.fromEntries(controls.map(c => [c.dataset.filter, c.value]));
      if (locked) filters.audience = locked;
      const cards = $$('[data-event]', feed);
      const before = window.Flip && animate && !reducedMotion.matches ? Flip.getState(cards) : null;
      let count = 0;
      cards.forEach(card => {
        const event = data.events.find(e => e.slug === card.dataset.event);
        const show = !!event && matchesEvent(event, filters);
        card.hidden = !show;
        if (show) count++;
      });
      $('[data-result-count]', feed).textContent = `${count} ${count === 1 ? 'event' : 'events'}${locked ? ` for ${locked}` : ''}`;
      $('[data-empty]', feed).hidden = count > 0;
      if (before) Flip.from(before, {
        duration:.6, ease:'power3.inOut', stagger:.035, prune:true,
        onEnter:elements=>gsap.fromTo(elements,{opacity:0,y:20},{opacity:1,y:0,duration:.45}),
        onComplete:()=>window.ScrollTrigger?.refresh()
      });
      else window.ScrollTrigger?.refresh();
    }

    controls.forEach(c => c.addEventListener(c.tagName === 'INPUT' ? 'input' : 'change', () => render(true)));
    $('.reset-filters', feed).addEventListener('click', () => {
      controls.forEach(c => { c.value = c.dataset.filter === 'search' ? '' : (c.dataset.filter === 'audience' && locked ? locked : 'all'); });
      render(true);
    });
    feedRenders.push(render); render();
  });
  $$('[data-calendar]').forEach(button => button.addEventListener('click', () => {
    const event = data.events.find(e => e.slug === button.dataset.calendar);
    if (!event) return;
    const blob = new Blob([calendarText(event)], {type:'text/calendar;charset=utf-8'});
    const objectURL = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = objectURL; a.download = `${event.slug}.ics`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(objectURL), 1500);
    toast('Calendar file downloaded. Confirm event details before attending.');
  }));
  $('[data-share-event]')?.addEventListener('click', () => {
    const e = data.events.find(e => e.slug === $('[data-event-detail]').dataset.eventDetail);
    share({title:e.title,text:`${e.date} · ${e.time}\n${e.venue}`,url:location.protocol === 'file:' ? data.site.original : location.href});
  });

  // The solar scene and published timetable are managed in prayer-engine.js and motion.js.
  function updatePrayerTimes() {
    $$('[data-today]').forEach(el => { el.textContent = new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,day:'numeric',month:'short'}).format(new Date())+' · Lahore'; });
  }

  // Same curated verse for the entire Lahore calendar day.
  let currentVerse;
  function updateVerse() {
    if (!data.verses.length) return;
    currentVerse = data.verses[verseIndex(dayKey(),data.verses.length)];
    $$('[data-verse-arabic]').forEach(el => { el.textContent = currentVerse.arabic; });
    $$('[data-verse-translation]').forEach(el => { el.textContent = currentVerse.translation; });
    $$('[data-verse-reference]').forEach(el => { el.textContent = `Surah ${currentVerse.surah} · ${currentVerse.reference}`; });
    $$('[data-verse-credit]').forEach(el => { el.textContent = currentVerse.translator; });
    $$('[data-verse-source]').forEach(el => { el.href = currentVerse.source; });
  }
  const verseText = () => `${currentVerse.arabic}\n${currentVerse.translation}\nQuran ${currentVerse.reference}\n${currentVerse.translator}\n${currentVerse.source}`;
  $$('[data-copy-verse]').forEach(button => button.addEventListener('click', () => copy(verseText())));
  $$('[data-share-verse]').forEach(button => button.addEventListener('click', () => share({title:`Quran ${currentVerse.reference}`,text:verseText()})));
  $('[data-copy-email]')?.addEventListener('click', () => copy(data.site.email));

  // Native dialog provides focus trapping and Escape-to-close.
  const dialog = $('.dialog');
  let posterTrigger;
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-poster]');
    if (!button || !dialog) return;
    if (!dialog.showModal) { window.open(button.dataset.poster,'_blank','noopener'); return; }
    posterTrigger = button.closest('[data-clone]') ? $$('[data-poster]').find(el=>el.dataset.poster===button.dataset.poster&&!el.closest('[data-clone]')) || button : button;
    $('img',dialog).src = button.dataset.poster;
    $('img',dialog).alt = button.dataset.caption;
    $('.dialog-caption',dialog).textContent = button.dataset.caption;
    dialog.showModal();
    window.dispatchEvent(new CustomEvent('lrs:gallery-open'));
  });
  $('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close(); } });
  dialog?.addEventListener('close', () => posterTrigger?.focus());

  let lastDay = dayKey();
  function refreshDateSensitiveContent() {
    const today = dayKey();
    if (today !== lastDay) { lastDay=today; updateStatuses(); updateVerse(); feedRenders.forEach(render=>render()); }
    updatePrayerTimes();
  }
  updateStatuses(); updateVerse(); updatePrayerTimes();
  setInterval(refreshDateSensitiveContent,30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDateSensitiveContent();});
})();
