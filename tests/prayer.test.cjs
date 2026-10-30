const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../site/assets/js/prayer-engine.js');
const data=require('../src/content.json');
const {gsap}=require('../site/assets/vendor/gsap.min.js');

test('bundled GSAP is executable and completes a real day timeline',()=>{
  assert.equal(gsap.version,'3.13.0');
  const proxy={minute:0};const now=engine.state(data.prayers,new Date('2026-10-29T16:15:00+05:00'));
  const tl=gsap.timeline({paused:true}).to(proxy,{minute:now.times.sunset+130,duration:5.4}).to(proxy,{minute:now.minutes,duration:2.3});
  tl.progress(1);assert.equal(proxy.minute,975);tl.kill();
});
test('local date is Lahore date, including UTC midnight boundary',()=>{
  assert.deepEqual(engine.local(new Date('2026-10-29T20:02:30Z')),{date:'2026-10-30',minutes:62.5});
});
test('published half-month boundaries and PM conversions are correct',()=>{
  const first=engine.schedule(data.prayers,'2026-10-15'),second=engine.schedule(data.prayers,'2026-10-16');
  assert.equal(first.fajr,320);assert.equal(second.fajr,330);
  assert.equal(first.asr,990);assert.equal(second.asr,975);
  assert.equal(second.isha,1155);assert.equal(second.zuhr,810);
});
test('sunrise and sunset are plausible and Maghrib follows original sunset +1 rule',()=>{
  const t=engine.schedule(data.prayers,'2026-10-29');
  assert.ok(t.sunrise>360&&t.sunrise<400);
  assert.ok(t.sunset>1020&&t.sunset<1060);
  assert.equal(t.maghrib,Math.floor(t.sunset)+1);
  assert.ok(t.sunrise<t.solarNoon&&t.solarNoon<t.sunset);
});
test('next jamaat rolls into tomorrow and across month/year timetable boundaries',()=>{
  const endMonth=engine.state(data.prayers,new Date('2026-10-31T23:58:00+05:00'));
  assert.equal(endMonth.next.name,'fajr');assert.equal(endMonth.next.time,'5:40 AM');assert.equal(endMonth.next.minutes,342);
  const endYear=engine.state(data.prayers,new Date('2026-12-31T23:59:00+05:00'));
  assert.equal(endYear.next.at.toISOString(),'2027-01-01T01:20:00.000Z');
});
test('sunrise clears Fajr highlight; exact jamaat switches highlight and next prayer',()=>{
  const morning=engine.state(data.prayers,new Date('2026-10-29T09:00:00+05:00'));
  assert.equal(morning.current,null);assert.equal(morning.next.name,'zuhr');
  const asr=engine.state(data.prayers,new Date('2026-10-29T16:15:00+05:00'));
  assert.equal(asr.current,'asr');assert.equal(asr.next.name,'maghrib');
});
test('solar path rises, culminates, sets and hides at night',()=>{
  const t=engine.schedule(data.prayers,'2026-10-29');
  const rise=engine.sky(t.sunrise,t),mid=engine.sky((t.sunrise+t.sunset)/2,t),set=engine.sky(t.sunset,t),night=engine.sky(60,t);
  assert.equal(rise.x,10);assert.ok(Math.abs(set.x-90)<1e-9);assert.ok(mid.y<rise.y&&mid.y<set.y);
  assert.equal(night.sunOpacity,0);assert.equal(night.daylight,0);assert.equal(night.phase,'Night');
});
test('all 24 published timetable rows and all solar days of leap year are supported',()=>{
  assert.equal(data.prayers.publishedRows.length,24);
  for(let date='2028-01-01';date<'2029-01-01';date=engine.addDay(date,1)){
    const t=engine.schedule(data.prayers,date);
    assert.ok(t.fajr<t.sunrise&&t.sunrise<t.zuhr&&t.zuhr<t.asr&&t.asr<t.maghrib&&t.maghrib<t.isha,date);
  }
});

test('bundled MotionPath and CustomEase work offline for the scroll-driven solar arc',()=>{
  const {MotionPathPlugin}=require('../site/assets/vendor/MotionPathPlugin.min.js');
  const {CustomEase}=require('../site/assets/vendor/CustomEase.min.js');
  gsap.registerPlugin(MotionPathPlugin,CustomEase);
  CustomEase.create('lrs-test','0.22,1,0.36,1');
  const raw=MotionPathPlugin.getRawPath('M50,420 Q500,-200 950,420');
  const rise=MotionPathPlugin.getPositionOnPath(raw,0),noon=MotionPathPlugin.getPositionOnPath(raw,.5),set=MotionPathPlugin.getPositionOnPath(raw,1);
  assert.ok(rise.x<noon.x&&noon.x<set.x);
  assert.ok(noon.y<rise.y&&noon.y<set.y);
  const ease=gsap.parseEase('lrs-test');assert.equal(ease(0),0);assert.equal(ease(1),1);assert.ok(ease(.5)>.5);
});
