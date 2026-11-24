/* Motion direction: only decorative layers and leaf content are animated. Native inputs, navigation and audio are untouched. */
(function(){
 "use strict";
 function init(){
   var root=document.querySelector(".ed");
   if(!root||root.dataset.motionReady==="true")return;
   root.dataset.motionReady="true";
   var reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
   var fine=window.matchMedia("(pointer:fine)");
   var hero=root.querySelector(".ed-studio-hero"),light=root.querySelector(".ed-motion-light"),orbits=root.querySelector(".ed-motion-orbits");
   var flash=root.querySelector(".ed-chapter-flash"),flashNumber=flash&&flash.querySelector("[data-motion-number]"),flashTitle=flash&&flash.querySelector("[data-motion-title]");
   var activeAnimations=new WeakMap(),seen=new WeakSet(),lastFlash=0;
   function animate(el,frames,options){
     if(!el||reduced.matches||!el.animate||!el.getClientRects().length)return;
     var old=activeAnimations.get(el);if(old)old.cancel();
     var a=el.animate(frames,options);activeAnimations.set(el,a);
     a.onfinish=function(){if(activeAnimations.get(el)===a)activeAnimations.delete(el);};
     return a;
   }
   var ease="cubic-bezier(.22,.8,.22,1)";
   function title(el,delay){
     animate(el,[{clipPath:"inset(0 0 100% 0)",translate:"0 40px",opacity:.1},{clipPath:"inset(0 0 0 0)",translate:"0 0",opacity:1}],{duration:850,delay:delay||0,easing:ease,fill:"backwards"});
   }
   function enter(el,delay,dx){
     animate(el,[{opacity:.08,translate:(dx||0)+"px 28px"},{opacity:1,translate:"0 0"}],{duration:620,delay:delay||0,easing:ease,fill:"backwards"});
   }
   function revealHeading(el){
     if(seen.has(el))return;seen.add(el);
     var heading=el.querySelector("h2");if(heading)title(heading,0);
     var p=el.querySelector("p");if(p)enter(p,160,18);
     el.classList.add("ed-motion-heading-seen");
   }
   if(hero){
     hero.querySelectorAll(".ed-title-line").forEach(function(el,i){title(el,120+i*170);});
     hero.querySelectorAll(".ed-overline,.ed-hero-name,.ed-hero-cn,.ed-hero-intro,.ed-hero-actions").forEach(function(el,i){enter(el,80+i*90,-18);});
     enter(hero.querySelector(".ed-studio-object"),260,48);
   }
   if("IntersectionObserver"in window){
     var observer=new IntersectionObserver(function(entries){
       entries.forEach(function(e){if(!e.isIntersecting)return;observer.unobserve(e.target);if(e.target.matches(".ed-section-head,.ed-signoff-main"))revealHeading(e.target);else if(e.target.matches(".ed-kicker"))animate(e.target,[{clipPath:"inset(0 100% 0 0)",opacity:.45},{clipPath:"inset(0 0 0 0)",opacity:1}],{duration:780,easing:ease,fill:"backwards"});else enter(e.target,0,22);});
     },{threshold:.15});
     root.querySelectorAll(".ed-kicker,.ed-section-head,.ed-signoff-main,.ed-education-spread article,.ed-competition-spread article,.ed-honor-heading,.ed-essay summary").forEach(function(el){observer.observe(el);});
   }
   var chapters=Array.from(root.querySelectorAll(".ed-nav a[data-chapter]"));
   function showFlash(link){
     if(!flash||!flashNumber||!flashTitle||reduced.matches)return;
     var index=chapters.indexOf(link);if(index<0)return;
     lastFlash=performance.now();
     flashNumber.textContent=String(index).padStart(2,"0");
     flashTitle.textContent=link.dataset.english||"HOME";
     animate(flash,[{opacity:0,clipPath:"inset(0 100% 0 0)",translate:"-35px 0"},{opacity:1,clipPath:"inset(0 0 0 0)",translate:"0 0",offset:.30},{opacity:1,clipPath:"inset(0 0 0 0)",translate:"0 0",offset:.72},{opacity:0,clipPath:"inset(0 0 0 100%)",translate:"35px 0"}],{duration:1050,easing:"ease-in-out"});
   }
   root.addEventListener("click",function(e){
     if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
     var link=e.target instanceof Element&&e.target.closest("a[href^='#']");
     if(!link)return;
     var id=link.getAttribute("href").slice(1);
     var nav=chapters.find(function(c){return c.dataset.chapter===id;});
     if(nav)showFlash(nav);
   });
   root.addEventListener("change",function(e){
     if(!(e.target instanceof HTMLInputElement)||reduced.matches)return;
     if(e.target.matches(".ed-choice")){
       var wrap=e.target.closest(".ed-native-switch");if(!wrap)return;
       var panel=wrap.querySelector('.ed-switch-panel[data-panel="'+e.target.dataset.slot+'"]');if(!panel)return;
       requestAnimationFrame(function(){
         if(panel.closest(".ed-book"))return;
         title(panel.querySelector(".ed-shelf-main h3,.ed-journey-intro h3")||panel.querySelector("h3"),0);
         panel.querySelectorAll(".ed-shelf-meta,.ed-shelf-story>div,.ed-journey-metrics,.ed-journey-detail").forEach(function(el,i){enter(el,Math.min(i,6)*65,36);});
         var media=panel.closest(".ed-book")?null:panel.querySelector(".ed-media-frame,.ed-workflow");animate(media,[{clipPath:"inset(0 100% 0 0)",opacity:.3},{clipPath:"inset(0 0 0 0)",opacity:1}],{duration:580,easing:ease});
       });
     }
     if(e.target.matches("[data-media-slot]")){
       var g=e.target.closest(".ed-native-gallery");if(!g)return;
       requestAnimationFrame(function(){g.querySelectorAll('[data-media-panel="'+e.target.dataset.mediaSlot+'"] img').forEach(function(el){animate(el,[{clipPath:"inset(0 100% 0 0)",opacity:.25},{clipPath:"inset(0 0 0 0)",opacity:1}],{duration:450,easing:ease});});});
     }
   });
   var raf=0,x=50,y=42,tx=50,ty=42,px=0,py=0,visible=true;
   function paint(){
     raf=0;if(reduced.matches||!hero||!visible)return;
     x+=(tx-x)*.12;y+=(ty-y)*.12;
     if(light){light.style.setProperty("--mx",x+"%");light.style.setProperty("--my",y+"%");}
     var scroll=hero.closest("[data-cinema-ready=true]")?Number(hero.dataset.sceneProgress||0):Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight)));
     if(orbits)orbits.style.transform="translate3d("+((x-50)*.8)+"px,"+((y-42)*.65+scroll*145)+"px,0) rotate("+scroll*20+"deg)";
     if(light)light.style.transform="translateY("+scroll*110+"px)";hero.style.setProperty("--hero-scroll",String(scroll));
     if(Math.abs(tx-x)+Math.abs(ty-y)>.1)wake();
   }
   function wake(){if(!raf&&!reduced.matches&&visible)raf=requestAnimationFrame(paint);}
   if(hero){
     hero.addEventListener("pointermove",function(e){if(!fine.matches)return;var r=hero.getBoundingClientRect();tx=100*(e.clientX-r.left)/r.width;ty=100*(e.clientY-r.top)/r.height;wake();});
     hero.addEventListener("pointerleave",function(){tx=50;ty=42;wake();});
     window.addEventListener("scroll",wake,{passive:true});window.addEventListener("resize",wake);
     if("IntersectionObserver"in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)wake();}).observe(hero);
     wake();
   }
   reduced.addEventListener("change",function(){if(reduced.matches){(root.getAnimations?root.getAnimations({subtree:true}):[]).forEach(function(a){if(a instanceof Animation&&a.effect&&activeAnimations.get(a.effect.target)===a)a.cancel();});if(light)light.style.transform="";if(orbits)orbits.style.transform="";if(hero)hero.style.removeProperty("--hero-scroll");}else wake();});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
 window.addEventListener("pageshow",init);
})();
