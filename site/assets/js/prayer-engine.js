/* Published LRS jama'at timetable + SunCalc solar-day visualisation. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../vendor/suncalc.js'));
  else root.LRSPrayer = factory(root.SunCalc);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (SunCalc) {
  'use strict';
  const ZONE = 'Asia/Karachi', names = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
  function local(now = new Date()) {
    const p = new Intl.DateTimeFormat('en-GB', {timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
    const get = k => p.find(x => x.type === k).value;
    return {date:`${get('year')}-${get('month')}-${get('day')}`,minutes:Number(get('hour'))*60+Number(get('minute'))+Number(get('second'))/60};
  }
  function addDay(date, n) { const d = new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
  function minuteOf(time, pm = false) {
    const [h,m] = time.split(':').map(Number); return (pm ? h%12+12 : h)*60+m;
  }
  function format(minutes) {
    const m = ((Math.floor(minutes)%1440)+1440)%1440, h = Math.floor(m/60);
    return `${h%12||12}:${String(m%60).padStart(2,'0')} ${h<12?'AM':'PM'}`;
  }
  function schedule(prayers, date) {
    const [,month,day] = date.split('-').map(Number);
    const row = prayers.publishedRows.find(r => r.month === month && r.day === (day < 16 ? 1 : 16));
    if (!row) throw new Error('No published LRS timetable for '+date);
    const solar = SunCalc.getTimes(new Date(date+'T12:00:00+05:00'), prayers.latitude, prayers.longitude);
    const sunrise = local(solar.sunrise).minutes, sunset = local(solar.sunset).minutes;
    return {date,sunrise,sunset,solarNoon:local(solar.solarNoon).minutes,
      fajr:minuteOf(row.fajr),zuhr:minuteOf(prayers.zuhr),asr:minuteOf(row.asr,true),
      maghrib:Math.floor(sunset)+1,isha:minuteOf(row.isha,true)};
  }
  function state(prayers, now = new Date()) {
    const {date,minutes} = local(now), times = schedule(prayers,date);
    let current = 'isha';
    for (const name of names) if (minutes >= times[name]) current = name;
    // Sunrise is not a prayer, and Fajr does not remain highlighted after sunrise.
    if (minutes >= times.sunrise && minutes < times.zuhr) current = null;
    let nextName = names.find(name => times[name] > minutes), nextDate = date, nextTimes = times;
    if (!nextName) { nextName='fajr'; nextDate=addDay(date,1); nextTimes=schedule(prayers,nextDate); }
    const at = new Date(nextDate+'T00:00:00+05:00'); at.setTime(at.getTime()+nextTimes[nextName]*60000);
    return {date,minutes,times,current,next:{name:nextName,at,minutes:Math.max(0,Math.ceil((at-now)/60000)),time:format(nextTimes[nextName])}};
  }
  function sky(minute, times) {
    const m = ((minute%1440)+1440)%1440, span=times.sunset-times.sunrise;
    const progress=(m-times.sunrise)/span;
    const daylight=Math.max(0,Math.min(1,(m-times.sunrise+45)/60,(times.sunset+45-m)/60));
    const phase=m<times.sunrise-45?'Night':m<times.sunrise+35?'First light':m<times.solarNoon?'Morning':m<times.sunset-65?'Afternoon':m<times.sunset+40?'Sunset':'Night';
    return {minute:m,progress,daylight,phase,x:10+80*Math.max(0,Math.min(1,progress)),y:76-61*Math.sin(Math.PI*Math.max(0,Math.min(1,progress))),sunOpacity:progress>=-.04&&progress<=1.04?Math.max(0,Math.min(1,(progress+.04)/.04,(1.04-progress)/.04)):0};
  }
  return {local,addDay,minuteOf,format,schedule,state,sky,names};
});
