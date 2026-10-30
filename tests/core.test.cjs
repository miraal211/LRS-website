const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('../site/assets/js/app.js');
const d = JSON.parse(fs.readFileSync(path.join(__dirname,'../src/content.json'),'utf8'));
const retreat = d.events.find(e=>e.slug==='sacred-retreat-2');
test('Lahore midnight changes the date before UTC midnight',()=>{
  assert.equal(h.dayKey(new Date('2026-10-28T18:59:59Z')),'2026-10-28');
  assert.equal(h.dayKey(new Date('2026-10-28T19:00:00Z')),'2026-10-29');
});
test('overnight retreat stays current on the closing date',()=>{
  assert.equal(h.eventStatus(retreat,'2026-10-28'),'Upcoming');
  assert.equal(h.eventStatus(retreat,'2026-10-30'),'Today');
  assert.equal(h.eventStatus(retreat,'2026-10-31'),'Past event');
});
test('both-audience events appear for brothers and sisters, unknown audience is not guessed',()=>{
  assert.equal(h.audienceMatches(retreat,'brothers'),true);
  assert.equal(h.audienceMatches(retreat,'sisters'),true);
  assert.equal(h.audienceMatches(d.events.find(e=>e.audience==='unconfirmed'),'sisters'),false);
});
test('date, audience, venue and speaker search filters compose',()=>{
  const f={period:'week',audience:'sisters',venue:'all',search:''};
  assert.deepEqual(d.events.filter(e=>h.matchesEvent(e,f,'2026-10-28')).map(e=>e.slug),['sacred-retreat-2']);
  assert.equal(h.matchesEvent(retreat,{...f,venue:'female'},'2026-10-28'),false);
  assert.equal(d.events.filter(e=>h.matchesEvent(e,{period:'past',search:'zoha'},'2026-10-28')).length,1);
  assert.equal(h.matchesEvent(retreat,{period:'week'},'2026-11-01'),false);
});
test('daily rotation is stable and advances by Lahore day',()=>{
  assert.equal(h.verseIndex('2026-10-28',2),h.verseIndex('2026-10-28',2));
  assert.notEqual(h.verseIndex('2026-10-28',2),h.verseIndex('2026-10-29',2));
});
test('prayer-relative calendar event uses exclusive-end all-day date reminder',()=>{
  const ics=h.calendarText(retreat,new Date('2026-10-28T00:00:00Z'));
  assert.match(ics,/DTSTART;VALUE=DATE:20261029/);
  assert.match(ics,/DTEND;VALUE=DATE:20261031/);
  assert.match(ics.replace(/\r\n /g,''),/Date reminder only/);
  for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
});
test('timed calendar events convert PKT to UTC and do not invent end times',()=>{
  const ics=h.calendarText(d.events.find(e=>e.slug==='why-al-aqsa-still-calls-us'));
  assert.match(ics,/DTSTART:20261027T133000Z/);
  assert.doesNotMatch(ics,/DTEND/);
});
test('calendar text escapes syntax and folds multibyte content safely',()=>{
  const event={...retreat,title:'Faith, hope; care\\together',description:'مرحبا '.repeat(50)};
  const ics=h.calendarText(event);
  assert.ok(ics.includes('Faith\\, hope\\; care\\\\together'));
  for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  assert.ok(ics.replace(/\r\n /g,'').includes(event.description));
});
test('only dated, verified prayer data with a verifier is eligible',()=>{
  const row={date:'2026-10-28',verified:true,fajr:{jamaat:'05:30'}};
  assert.equal(h.verifiedSchedule({verifiedBy:'Mosque office',schedule:[row]},'2026-10-28'),row);
  assert.equal(h.verifiedSchedule({verifiedBy:'',schedule:[row]},'2026-10-28'),null);
  assert.equal(h.verifiedSchedule({verifiedBy:'Office',schedule:[row]},'2026-10-29'),null);
  assert.equal(h.displayTime('25:00'),'Not confirmed');
  assert.equal(h.displayTime('13:30'),'1:30 PM');
});
test('next jamaat skips elapsed and missing times',()=>{
  const row={date:'2026-10-28',fajr:{jamaat:'05:30'},zuhr:{jamaat:'13:30'},asr:{jamaat:null},isha:{jamaat:'20:00'}};
  assert.equal(h.nextPrayer(row,new Date('2026-10-28T09:00:00+05:00')).name,'zuhr');
  assert.equal(h.nextPrayer(row,new Date('2026-10-28T21:00:00+05:00')),null);
});
