/* LRS immersive motion edition. Original implementation, GSAP 3.13.0.
   References and per-section motion choices: MOTION-MAP.md. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const g=window.gsap;if(!g)return;
  g.registerPlugin(ScrollTrigger,SplitText,Flip,DrawSVGPlugin,Observer,MotionPathPlugin,CustomEase,ScrollToPlugin,Draggable);
  CustomEase.create('lrs','0.22,1,0.36,1');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const dur=n=>reduce.matches?0:n;
  const mm=g.matchMedia();
  const activeAnimations=[];
  const header=$('.race-nav');
  const updateHeader=()=>header.classList.toggle('is-scrolled',scrollY>50);
  updateHeader();ScrollTrigger.create({start:0,end:'max',onUpdate:updateHeader});
  g.to('.page-progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.2}});

  // Floating navigation: a moving gold oval follows pointer and keyboard focus.
  const capsule=$('.nav-capsule'),shade=$('.nav-shade');
  if(capsule){
    const show=a=>{const r=a.getBoundingClientRect(),p=capsule.getBoundingClientRect();g.to(shade,{x:r.left-p.left,width:r.width,opacity:1,duration:dur(.4),ease:'lrs',overwrite:true});};
    $$('.nav-pill').forEach(a=>{a.addEventListener('mouseenter',()=>show(a));a.addEventListener('focus',()=>show(a));});
    const hide=()=>{if(!capsule.contains(document.activeElement))g.to(shade,{opacity:0,duration:dur(.25)});};
    capsule.addEventListener('mouseleave',hide);capsule.addEventListener('focusout',()=>requestAnimationFrame(hide));
  }
  const menu=$('#main-menu'),menuTrigger=$('.race-menu');let menuTL,returnOverflow='';
  function closeMenu(){
    if(!menu.open)return;menuTL?.kill();
    g.to(menu,{clipPath:'inset(0 0 100% 0 round 0 0 40% 40%)',opacity:0,duration:dur(.5),ease:'power3.inOut',onComplete:()=>{
      menu.close();document.documentElement.style.overflow=returnOverflow;menuTrigger.setAttribute('aria-expanded','false');menuTrigger.focus();
    }});
  }
  menuTrigger.addEventListener('click',()=>{
    g.killTweensOf(menu);returnOverflow=document.documentElement.style.overflow;menu.showModal();document.documentElement.style.overflow='hidden';menuTrigger.setAttribute('aria-expanded','true');
    menuTL=g.timeline({defaults:{ease:'lrs'}})
      .fromTo(menu,{clipPath:'inset(0 0 100% 0 round 0 0 40% 40%)',opacity:1},{clipPath:'inset(0 0 0% 0 round 0 0 0% 0%)',duration:dur(.8)})
      .fromTo($$('.menu-item',menu),{y:40,opacity:0,rotationX:-15},{y:0,opacity:1,rotationX:0,stagger:reduce.matches?0:.04,duration:dur(.7)},reduce.matches?0:.15)
      .fromTo($('.menu-emblem',menu),{scale:.7,rotation:-35,opacity:0},{scale:1,rotation:0,opacity:1,duration:dur(1)},'<');
  });
  $('.menu-close').addEventListener('click',closeMenu);menu.addEventListener('cancel',e=>{e.preventDefault();closeMenu();});

  // Mosque arrival -> logo and greeting -> campus video. Content is never scroll-locked.
  const film=$('.hero-film video'),filmButton=$('.film-control'),arrival=$('.arrival');
  let filmWanted=!reduce.matches,filmInView=true;
  const syncFilm=()=>{if(!filmButton)return;filmButton.textContent=film.paused?'▷':'Ⅱ';filmButton.setAttribute('aria-pressed',String(!film.paused));filmButton.setAttribute('aria-label',film.paused?'Play background film':'Pause background film');};
  const playFilm=()=>{if(film&&filmWanted&&filmInView&&!document.hidden&&!reduce.matches)film.play().catch(syncFilm);};
  if(film){
    film.addEventListener('play',syncFilm);film.addEventListener('pause',syncFilm);
    filmButton.addEventListener('click',()=>{filmWanted=film.paused;if(filmWanted){film.style.display='block';film.play().catch(syncFilm);}else film.pause();});
    new IntersectionObserver(([e])=>{filmInView=e.isIntersecting;if(filmInView)playFilm();else film.pause();}).observe(film);
    document.addEventListener('visibilitychange',()=>document.hidden?film.pause():playFilm());
  }
  let arrivalTL;
  const revealHero=()=>{
    playFilm();
    if(!$('.original-hero'))return;
    g.timeline({defaults:{ease:'lrs'}})
      .fromTo('.hero-heading h1>span',{yPercent:100,opacity:0,rotation:3},{yPercent:0,opacity:1,rotation:0,duration:dur(1.2),stagger:reduce.matches?0:.12})
      .fromTo('.hero-description,.hero-heading .eyebrow,.hero-notice',{y:25,opacity:0},{y:0,opacity:1,duration:dur(.9),stagger:reduce.matches?0:.08},reduce.matches?0:.6);
  };
  if(arrival&&!reduce.matches){
    g.set(arrival,{display:'block'});
    arrivalTL=g.timeline({defaults:{ease:'lrs'},onComplete:()=>{arrival.remove();ScrollTrigger.refresh();}})
      .fromTo('.arrival-mosque',{yPercent:20,scale:1.13,opacity:0},{yPercent:0,scale:1,opacity:1,duration:1.15})
      .fromTo('.arrival-sun',{y:120,opacity:0},{y:0,opacity:1,duration:1.2},0)
      .fromTo('.arrival-logo,.arrival-arabic,.arrival-lrs',{y:30,opacity:0},{y:0,opacity:1,duration:.8,stagger:.15},.35)
      .fromTo('.arrival-line',{scaleX:0},{scaleX:1,duration:1.9,ease:'power1.inOut'},.3)
      .to('.arrival-mosque',{yPercent:20,opacity:0,scale:1.07,duration:.9},2.2)
      .to('.arrival-identity',{y:-40,opacity:0,duration:.65},2.3)
      .to(arrival,{clipPath:'inset(0 0 100% 0 round 0 0 45% 45%)',duration:1,ease:'power4.inOut'},2.55)
      .call(revealHero,[],2.65);
  }else{arrival?.remove();revealHero();}
  reduce.addEventListener('change',()=>{if(reduce.matches){arrivalTL?.kill();arrival?.remove();if(film)film.pause();if($('.original-hero'))g.set('.hero-heading h1>span,.hero-description,.hero-heading .eyebrow,.hero-notice',{clearProps:'all'});}});

  // Horizontal event chapter. Native swipe works without GSAP; desktop scroll pins the rail.
  $$('.event-journey').forEach(section=>{
    const shell=$('.journey-shell',section),windowEl=$('.journey-window',section),track=$('.journey-track',section),cards=$$('.journey-card',section),play=$('[data-journey-play]',section);
    let index=0,scrollTween,auto=!reduce.matches,autoClock,inside=false,focused=false,controlsHover=false,scrolling=false,scrollTimer;
    if(auto){play.textContent='Ⅱ';play.setAttribute('aria-label','Pause event slideshow');play.setAttribute('aria-pressed','true');}
    const count=cards.length;
    const status=()=>{const today=LRSPrayer.local().date;cards.forEach(card=>{const e=LRS_DATA.events.find(e=>e.slug===card.dataset.featuredEvent);if(!e){$('[data-slide-status]',card).textContent='Recurring programme';return;}$('[data-slide-status]',card).textContent=(e.endDate||e.date)<today?'From the archive':e.date<=today?'Today':'Upcoming';});};status();setInterval(status,60000);
    function paint(progress){
      index=Math.min(count-1,Math.max(0,Math.round(progress*(count-1))));
      $('.journey-counter',section).textContent=`${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
      g.set($('.journey-progress span',section),{scaleX:(index+1)/count});
      cards.forEach((c,i)=>{c.inert=i!==index;c.setAttribute('aria-hidden',String(i!==index));});
    }
    function stopAuto(){auto=false;autoClock?.kill();play.textContent='▶';play.setAttribute('aria-label','Play event slideshow');play.setAttribute('aria-pressed','false');}
    function nextClock(){
      autoClock?.kill();if(!auto||!inside||focused||controlsHover||document.hidden||scrolling||reduce.matches)return;
      autoClock=g.delayedCall(7,()=>{go((index+1)%count,false);nextClock();});
    }
    function go(next,manual=true){
      next=(next+count)%count;if(manual)stopAuto();
      const st=scrollTween?.scrollTrigger;
      if(st){g.to(window,{scrollTo:{y:st.start+(st.end-st.start)*next/(count-1),autoKill:true},duration:dur(1.15),ease:'power2.inOut'});}
      else g.to(windowEl,{scrollTo:{x:cards[next].offsetLeft,autoKill:true},duration:dur(.85),ease:'lrs'});
    }
    $('[data-journey-prev]',section).addEventListener('click',()=>go(index-1));$('[data-journey-next]',section).addEventListener('click',()=>go(index+1));
    play.addEventListener('click',()=>{if(auto)stopAuto();else{auto=true;focused=false;play.textContent='Ⅱ';play.setAttribute('aria-label','Pause event slideshow');play.setAttribute('aria-pressed','true');nextClock();}});
    windowEl.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?count-1:index+(e.key==='ArrowRight'?1:-1));}});
    function userScroll(){scrolling=true;autoClock?.kill();clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{scrolling=false;nextClock();},1800);}
    section.addEventListener('wheel',userScroll,{passive:true});section.addEventListener('touchstart',userScroll,{passive:true});
    $('.journey-controls',section).addEventListener('mouseenter',()=>{controlsHover=true;nextClock();});$('.journey-controls',section).addEventListener('mouseleave',()=>{controlsHover=false;nextClock();});
    section.addEventListener('focusin',e=>{focused=e.target!==play;nextClock();});section.addEventListener('focusout',()=>requestAnimationFrame(()=>{focused=section.contains(document.activeElement)&&document.activeElement!==play;nextClock();}));
    windowEl.addEventListener('scroll',()=>{if(!scrollTween)paint(windowEl.scrollLeft/Math.max(1,track.scrollWidth-windowEl.clientWidth));});
    new IntersectionObserver(([e])=>{inside=e.intersectionRatio>.55;nextClock();},{threshold:[0,.55,1]}).observe(shell);
    document.addEventListener('visibilitychange',nextClock);
    mm.add('(min-width: 1001px) and (prefers-reduced-motion: no-preference)',()=>{
      section.classList.add('journey-enhanced');windowEl.scrollLeft=0;
      const distance=()=>track.scrollWidth-windowEl.clientWidth;
      scrollTween=g.to(track,{x:()=>-distance(),ease:'none',scrollTrigger:{trigger:section,start:'top top',end:()=>'+='+distance(),pin:shell,scrub:.85,invalidateOnRefresh:true,onUpdate:self=>paint(self.progress)}});
      const touchObserver=Observer.create({target:windowEl,type:'touch',lockAxis:true,tolerance:50,preventDefault:false,ignore:'button,a',onLeft:self=>{if(self.axis==='x')go(index+1);},onRight:self=>{if(self.axis==='x')go(index-1);}});
      cards.forEach(card=>g.fromTo($('.journey-photo',card),{xPercent:-7,scale:1.14},{xPercent:7,ease:'none',scrollTrigger:{trigger:card,containerAnimation:scrollTween,start:'left right',end:'right left',scrub:true}}));
      return()=>{touchObserver.kill();scrollTween=null;section.classList.remove('journey-enhanced');cards.forEach(c=>{c.inert=false;c.removeAttribute('aria-hidden');});g.set(track,{clearProps:'transform'});};
    });
    paint(0);
    reduce.addEventListener('change',()=>{if(reduce.matches)stopAuto();});
  });

  // The light follows scroll; the six congregation time labels remain the real schedule.
  $$('.original-prayer').forEach(section=>{
    const p=LRS_DATA.prayers,engine=LRSPrayer,frame=$('.solar-frame',section),sun=$('.solar-sun',section),proxy={minute:0};
    let actual=engine.state(p),scrubbing=false;
    const rawPath=MotionPathPlugin.getRawPath('M50,420 Q500,-200 950,420');
    function paint(minute){
      const sky=engine.sky(minute,actual.times),day=sky.daylight,m=sky.minute;
      const warmth=Math.max(0,1-Math.min(Math.abs(m-actual.times.sunrise),Math.abs(m-actual.times.sunset))/90);
      const top=g.utils.interpolate('#05172c','#477f83',day),bottom=g.utils.interpolate('#0a3134',warmth>.25?'#df9f5e':'#d6d9ad',day);
      g.set($('.solar-sky',section),{background:`linear-gradient(${top},${bottom})`});
      const point=MotionPathPlugin.getPositionOnPath(rawPath,g.utils.clamp(0,1,sky.progress));
      g.set(sun,{left:point.x/10+'%',top:point.y/500*72+'%',opacity:sky.sunOpacity,scale:.8+warmth*.4});
      g.set($('.solar-moon',section),{opacity:1-day,rotation:m/60});g.set($('.solar-stars',section),{opacity:1-day});
      g.set($('.solar-haze',section),{opacity:warmth*day});g.set($('.solar-night-glow',section),{opacity:(1-day)*.8});
      g.set($('.solar-mosque',section),{filter:`brightness(${.35+day*.6}) saturate(${.45+day*.3})`});
    }
    function update(){
      actual=engine.state(p);
      $$('[data-solar-time]',section).forEach(el=>el.textContent=engine.format(el.dataset.solarTime==='jummah'?engine.minuteOf(p.jummah):actual.times[el.dataset.solarTime]));
      $$('[data-solar-prayer]',section).forEach(el=>el.classList.toggle('is-current',el.dataset.solarPrayer===actual.current));
      section.setAttribute('aria-label',`Published LUMS jamaat timetable. Lahore time ${engine.format(actual.minutes)}. The sun is a scroll-driven illustration.`);
      if(!scrubbing){proxy.minute=actual.minutes;paint(proxy.minute);}
    }
    update();setInterval(update,30000);
    mm.add({desktop:'(min-width: 1001px)',motion:'(prefers-reduced-motion: no-preference)'},ctx=>{
      if(!ctx.conditions.motion)return;
      const desktop=ctx.conditions.desktop;
      g.from($('.solar-content>div:first-child',section),{y:45,opacity:0,duration:1,ease:'lrs',scrollTrigger:{trigger:section,start:'top 75%',once:true}});
      g.from($$('.solar-prayer',section),{y:30,opacity:0,stagger:.08,duration:.7,scrollTrigger:{trigger:section,start:'top 35%',once:true}});
      const setLive=()=>{scrubbing=false;g.to(proxy,{minute:actual.minutes,duration:1.2,ease:'power2.inOut',onUpdate:()=>paint(proxy.minute)});};
      const tween=g.fromTo(proxy,{minute:actual.times.sunrise-60},{minute:actual.times.sunset+160,ease:'none',immediateRender:false,onUpdate:()=>paint(proxy.minute),scrollTrigger:{trigger:section,start:desktop?'top top':'top 60%',end:desktop?'+=140%':'bottom 20%',pin:desktop?frame:false,scrub:.6,onEnter:()=>{scrubbing=true;},onEnterBack:()=>{scrubbing=true;},onLeave:setLive,onLeaveBack:setLive}});
      return()=>{tween.kill();scrubbing=false;update();};
    });
  });

  // Infinite gallery / partner ribbons. Bounded DOM: one duplicate, no growing content.
  function endless(root,beltSelector,setSelector,speed,draggable=false){
    const belt=$(beltSelector,root),set=$(setSelector,root);if(!belt||!set)return;
    let offset=0,width=set.getBoundingClientRect().width,inView=false,hover=false,focused=false,dragging=false,wasDragged=false,base=0,startX=0;
    const clone=set.cloneNode(true);clone.dataset.clone='true';clone.setAttribute('aria-hidden','true');$$('button,a',clone).forEach(el=>el.tabIndex=-1);belt.append(clone);
    const wrap=()=>{width=Math.max(1,set.getBoundingClientRect().width);offset=reduce.matches?0:(offset===0?0:g.utils.wrap(-width,0,offset));g.set(belt,{x:offset});};
    const tick=(time,delta)=>{if(inView&&!hover&&!focused&&!dragging&&!document.hidden&&!reduce.matches){offset-=speed*Math.min(delta,50)/1000;wrap();}};
    g.ticker.add(tick);new IntersectionObserver(([e])=>inView=e.isIntersecting).observe(root);
    root.addEventListener('mouseenter',()=>hover=true);root.addEventListener('mouseleave',()=>hover=false);
    root.addEventListener('focusin',e=>{focused=true;if(e.target!==root){const rect=e.target.getBoundingClientRect(),parent=root.getBoundingClientRect();offset=g.utils.clamp(Math.min(0,parent.width-width),0,offset+parent.left+parent.width/2-rect.left-rect.width/2);g.set(belt,{x:offset});}});
    root.addEventListener('focusout',()=>requestAnimationFrame(()=>focused=root.contains(document.activeElement)));
    if(draggable){
      const proxy=document.createElement('div');
      const drag=Draggable.create(proxy,{type:'x',trigger:root,allowNativeTouchScrolling:true,dragClickables:true,minimumMovement:8,
        onPress(){dragging=true;wasDragged=false;base=offset;startX=this.x;},
        onDrag(){wasDragged=true;offset=base+this.x-startX;wrap();},
        onRelease(){dragging=false;setTimeout(()=>wasDragged=false,100);}})[0];
      if(reduce.matches)drag.disable();
      root.addEventListener('click',e=>{if(wasDragged){e.preventDefault();e.stopImmediatePropagation();}},true);
      root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const target={x:offset};g.to(target,{x:offset+(e.key==='ArrowRight'?-290:290),duration:dur(.7),ease:'lrs',onUpdate:()=>{offset=target.x;wrap();}});}});
      reduce.addEventListener('change',()=>{if(reduce.matches){drag.disable();offset=0;g.set(belt,{x:0});clone.hidden=true;root.style.overflowX='auto';}else{drag.enable();clone.hidden=false;root.style.overflowX='';}});
    }
    if(reduce.matches){clone.hidden=true;root.style.overflowX='auto';}
    reduce.addEventListener('change',()=>{clone.hidden=reduce.matches;if(reduce.matches){offset=0;g.set(belt,{x:0});root.style.overflowX='auto';}else root.style.overflowX='';});
    new ResizeObserver(wrap).observe(set);
  }
  $$('.memory-loop').forEach(el=>endless(el,'.memory-belt','.memory-set',32,true));
  $$('.partner-loop').forEach(el=>endless(el,'.partner-belt','.partner-set',25));

  // Native disclosures keep keyboard support and allow more than one open answer.
  $$('.sculpted-faq details').forEach(details=>{
    const answer=$('.faq-answer',details);
    $('summary',details).addEventListener('click',e=>{
      if(reduce.matches)return;e.preventDefault();if(g.isTweening(answer))return;
      if(details.open)g.to(answer,{height:0,opacity:0,duration:.4,ease:'power2.inOut',onComplete:()=>{details.open=false;g.set(answer,{clearProps:'all'});ScrollTrigger.refresh();}});
      else{details.open=true;g.fromTo(answer,{height:0,opacity:0},{height:'auto',opacity:1,duration:.65,ease:'lrs',onComplete:()=>{g.set(answer,{clearProps:'all'});ScrollTrigger.refresh();}});}
    });
  });

  // Pop-up image transitions build on app.js's native focus-trapped dialog.
  const imageDialog=$('.dialog');
  window.addEventListener('lrs:gallery-open',()=>{g.killTweensOf(imageDialog);g.fromTo(imageDialog,{opacity:0,scale:.85,y:30},{opacity:1,scale:1,y:0,duration:dur(.6),ease:'lrs'});g.fromTo($('img',imageDialog),{clipPath:'inset(50% 0 50% 0)'},{clipPath:'inset(0% 0 0% 0)',duration:dur(.7),ease:'power3.inOut'});});
  const closeImage=()=>g.to(imageDialog,{opacity:0,scale:.92,y:15,duration:dur(.28),onComplete:()=>imageDialog.close()});
  imageDialog.addEventListener('cancel',e=>{e.preventDefault();closeImage();});
  $('[data-close-dialog]').addEventListener('click',e=>{e.stopImmediatePropagation();closeImage();},true);

  // Focused artistic motion systems: each main section has a distinct treatment.
  mm.add('(prefers-reduced-motion: no-preference)',()=>{
    const splits=[];
    $$('.immersive main h2,.page-intro h1').filter(el=>!el.closest('.journey-card,.original-prayer')).forEach(el=>{
      splits.push(SplitText.create(el,{type:'lines',mask:'lines',autoSplit:true,onSplit:self=>g.from(self.lines,{yPercent:105,rotation:2,opacity:0,duration:1.1,ease:'lrs',stagger:.12,scrollTrigger:{trigger:el,start:'top 88%',once:true}})}));
    });
    if($('.original-hero')){
      g.to('.original-hero .hero-film',{yPercent:18,scale:1.08,ease:'none',scrollTrigger:{trigger:'.original-hero',start:'top top',end:'bottom top',scrub:1}});
      g.to('.hero-heading',{yPercent:15,opacity:.15,ease:'none',scrollTrigger:{trigger:'.original-hero',start:'20% top',end:'bottom top',scrub:.8}});
      g.fromTo('.scroll-symbol',{y:-5},{y:5,duration:1.2,repeat:-1,yoyo:true,ease:'sine.inOut'});
    }
    $$('.islamic-border').forEach(svg=>g.fromTo($$('path',svg),{drawSVG:'0%'},{drawSVG:'100%',duration:2.2,ease:'power2.inOut',scrollTrigger:{trigger:svg.parentElement,start:'top 80%',once:true}}));
    $$('.rosette').filter(el=>!el.closest('.menu-emblem')).forEach(svg=>g.to(svg,{rotation:70,ease:'none',scrollTrigger:{trigger:svg.closest('section')||svg,start:'top bottom',end:'bottom top',scrub:1.5}}));
    $$('.highlight-row').forEach(row=>{
      g.from(row,{y:60,opacity:0,duration:1,ease:'lrs',scrollTrigger:{trigger:row,start:'top 90%',once:true}});
      g.fromTo($('.highlight-thumb',row),{y:20,rotation:-5},{y:-20,rotation:5,ease:'none',scrollTrigger:{trigger:row,start:'top bottom',end:'bottom top',scrub:1}});
    });
    $$('.philosophy-reading').forEach(el=>{
      const split=SplitText.create(el,{type:'words',onSplit:self=>g.fromTo(self.words,{opacity:.15},{opacity:1,stagger:.09,ease:'none',scrollTrigger:{trigger:el,start:'top 78%',end:'bottom 45%',scrub:.5}})});splits.push(split);
    });
    if($('.faq-folds'))g.to('.faq-folds',{xPercent:5,yPercent:8,rotation:2,ease:'none',scrollTrigger:{trigger:'.faq-section',start:'top bottom',end:'bottom top',scrub:1.3}});
    $$('.sculpted-faq details').forEach(row=>g.from(row,{y:30,opacity:0,duration:.8,ease:'lrs',scrollTrigger:{trigger:row,start:'top 93%',once:true}}));
    $$('.sponsor-cards a,.contact-columns>div,.action-card,.resource-card,.venue-card').forEach((el,i)=>g.from(el,{y:50,opacity:0,rotation:i%2?2:-2,duration:1,ease:'lrs',scrollTrigger:{trigger:el,start:'top 93%',once:true}}));
    $$('.philosophy-quote').forEach(el=>g.from(el,{clipPath:'inset(30% 0 30% 0 round 50% 50% 0 0)',scale:.9,opacity:0,duration:1.4,ease:'lrs',scrollTrigger:{trigger:el,start:'top 80%',once:true}}));
    g.from('.footer-word',{yPercent:50,opacity:0,duration:1.4,ease:'lrs',scrollTrigger:{trigger:'.original-footer',start:'top 85%',once:true}});
    $$('.section').filter(el=>!el.matches('.original-pillars,.original-highlights,.faq-section')).forEach(el=>{
      g.fromTo(el,{opacity:.65},{opacity:1,ease:'none',scrollTrigger:{trigger:el,start:'top 95%',end:'top 40%',scrub:.5}});
    });
    // Documentary pacing for Palestine: monochrome to colour, large type and chapter reveals.
    if($('.palestine-opening')){
      g.fromTo('.solidarity-image',{scale:1.15,yPercent:-5},{scale:1,yPercent:15,ease:'none',scrollTrigger:{trigger:'.palestine-opening',start:'top top',end:'bottom top',scrub:1}});
      g.fromTo('.solidarity-image img',{filter:'grayscale(1)'},{filter:'grayscale(0)',ease:'none',scrollTrigger:{trigger:'.palestine-opening',start:'top top',end:'bottom top',scrub:1}});
      g.from('.palestine-opening h1>*',{y:80,opacity:0,stagger:.18,duration:1.4,ease:'lrs'});
      const text=$('.humanitarian-copy');g.from(text,{y:60,opacity:0,duration:1.3,ease:'lrs',scrollTrigger:{trigger:text,start:'top 85%',once:true}});
      $$('.event-details-card').forEach((card,i)=>{
        const image=$('img,video',card);if(image)g.from(image,{clipPath:i%2?'inset(0 0 0 100%)':'inset(0 100% 0 0)',duration:1.25,ease:'power3.inOut',scrollTrigger:{trigger:card,start:'top 70%',once:true}});
        g.from($$('.card-label,h2,p,.event-card-link',card),{y:35,opacity:0,stagger:.1,duration:1,ease:'lrs',scrollTrigger:{trigger:card,start:'top 75%',once:true}});
      });
    }
    return()=>splits.forEach(s=>s.revert());
  });
  mm.add('(min-width: 1001px) and (prefers-reduced-motion: no-preference)',()=>{
    $$('.pillar-process').forEach(process=>{
      process.classList.add('process-enhanced');const cards=$$('.process-card',process),bar=$('.process-indicator i',process);
      g.set(cards,{transformPerspective:1000});g.set(cards.slice(1),{x:350,y:650,rotation:30,opacity:0});
      const tl=g.timeline({scrollTrigger:{trigger:process,start:'top 15%',end:'+=190%',pin:true,scrub:.8,invalidateOnRefresh:true}});
      cards.forEach((card,i)=>{g.set(card,{zIndex:i+1});if(i){tl.to(cards[i-1],{x:-440,y:60,rotation:-17,scale:.83,opacity:.45,duration:1},i-1)
        .to(card,{x:0,y:0,rotation:0,opacity:1,duration:1,ease:'power2.out'},i-1)
        .to(bar,{scaleX:(i+1)/cards.length,duration:1,ease:'none'},i-1);}});
      tl.to(cards[cards.length-1],{rotation:-3,y:-10,duration:.4});
    });
    return()=>$$('.pillar-process').forEach(p=>p.classList.remove('process-enhanced'));
  });

  // Cursor affordances, floating highlight photographs and responsive magnetic controls.
  mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
    const cursor=$('.custom-cursor'),label=$('span',cursor),cleanup=[];
    const moveX=g.quickTo(cursor,'x',{duration:.2,ease:'power3'}),moveY=g.quickTo(cursor,'y',{duration:.2,ease:'power3'});
    g.set(cursor,{xPercent:-50,yPercent:-50});
    const move=e=>{moveX(e.clientX);moveY(e.clientY);g.set(cursor,{opacity:1});};
    const leave=()=>g.set(cursor,{opacity:0});document.addEventListener('pointermove',move);document.addEventListener('pointerleave',leave);
    const over=e=>{const a=e.target.closest('a,button,summary,[data-cursor]');cursor.classList.toggle('is-hover',!!a);label.textContent=a?.dataset.cursor||'';g.to(cursor,{width:a?46:14,height:a?46:14,duration:.25,overwrite:'auto'});};
    document.addEventListener('pointerover',over);
    $$('.highlight-row').forEach(row=>{
      const preview=$('.hover-preview');
      const enter=()=>{$('img',preview).src=row.dataset.preview;g.fromTo(preview,{autoAlpha:0,scale:.7,rotation:-8},{autoAlpha:1,scale:1,rotation:4,duration:.5,ease:'lrs'});};
      const follow=e=>{g.to(preview,{x:Math.min(innerWidth-330,e.clientX+30),y:Math.max(15,Math.min(innerHeight-400,e.clientY-160)),duration:.6,ease:'power3',overwrite:'auto'});};
      const exit=()=>g.to(preview,{autoAlpha:0,scale:.9,rotation:-5,duration:.3});
      row.addEventListener('mouseenter',enter);row.addEventListener('mousemove',follow);row.addEventListener('mouseleave',exit);
      cleanup.push(()=>{row.removeEventListener('mouseenter',enter);row.removeEventListener('mousemove',follow);row.removeEventListener('mouseleave',exit);});
    });
    $$('.btn,.race-menu,.highlight-link,.sponsor-cards a,.action-card').forEach(el=>{
      const move=e=>{const r=el.getBoundingClientRect();g.to(el,{x:(e.clientX-r.left-r.width/2)*.08,y:(e.clientY-r.top-r.height/2)*.1,duration:.4,overwrite:'auto'});};
      const exit=()=>g.to(el,{x:0,y:0,duration:.8,ease:'elastic.out(1,.5)'});
      el.addEventListener('pointermove',move);el.addEventListener('pointerleave',exit);
      cleanup.push(()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',exit);g.set(el,{clearProps:'transform'});});
    });
    return()=>{cleanup.forEach(fn=>fn());document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);document.removeEventListener('pointerover',over);g.set(cursor,{opacity:0});};
  });

  // Deliberate overscroll beyond the footer loops home. Footer remains reachable and usable.
  const loopButton=$('.loop-toggle');let loopEnabled=true,loopCooldown=0,bottomSince=0,touchStart=null;
  function loop(){if(!loopEnabled||reduce.matches||menu.open||imageDialog.open||Date.now()<loopCooldown)return;loopCooldown=Date.now()+2200;g.to('main,.original-footer',{opacity:0,duration:.25,onComplete:()=>{window.scrollTo(0,0);ScrollTrigger.update();g.to('main,.original-footer',{opacity:1,duration:.5});}});}
  if(loopButton){
    loopButton.addEventListener('click',()=>{loopEnabled=!loopEnabled;loopButton.setAttribute('aria-pressed',String(loopEnabled));loopButton.setAttribute('aria-label',(loopEnabled?'Disable':'Enable')+' looping page scroll');});
    const atBottom=()=>scrollY+innerHeight>=document.documentElement.scrollHeight-3;
    addEventListener('scroll',()=>{if(atBottom()){if(!bottomSince)bottomSince=Date.now();}else bottomSince=0;},{passive:true});
    addEventListener('wheel',e=>{if(e.deltaY>25&&!e.ctrlKey&&!e.metaKey&&atBottom()&&bottomSince&&Date.now()-bottomSince>600)loop();},{passive:true});
    addEventListener('touchstart',e=>{touchStart=atBottom()?e.touches[0].clientY:null;},{passive:true});
    addEventListener('touchend',e=>{if(touchStart!==null&&touchStart-e.changedTouches[0].clientY>70&&atBottom())loop();touchStart=null;},{passive:true});
  }
  // Smooth internal anchors without replacing native scrolling or trapping visitors.
  $$('a[href^="#"]').filter(a=>!a.classList.contains('skip')).forEach(a=>a.addEventListener('click',e=>{const target=$(a.getAttribute('href'));if(target){e.preventDefault();g.to(window,{scrollTo:{y:target,offsetY:85},duration:dur(1),ease:'lrs'});}}));
  window.addEventListener('load',()=>ScrollTrigger.refresh());document.fonts?.ready.then(()=>ScrollTrigger.refresh());
})();
