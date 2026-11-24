/* Subtle signal field, independent from React hydration. */
(function(){
"use strict";
function init(){
 const root=document.querySelector(".ed");
 if(!root||root.dataset.exhibitionReady==="true")return;
 root.dataset.exhibitionReady="true";
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const story=root.querySelector("[data-signal-story]");
 const audio=document.getElementById("ed-radio-audio");
 const fields=Array.from(root.querySelectorAll("canvas[data-signal]")).map(canvas=>{
   const ctx=canvas.getContext("2d");if(!ctx)return null;
   return {canvas,ctx,hero:canvas.dataset.signal==="hero",visible:true,w:1,h:1,dpr:1,px:0,py:0,tx:0,ty:0};
 }).filter(Boolean);
 if(!fields.length)return;
 if(story&&fields.some(f=>!f.hero)&&!reduced.matches)story.dataset.spatialReady="true";
 let raf=0,last=0,phase=0;
 const progress=()=>{if(!story)return 0;const sticky=story.querySelector(".ed-signal-sticky");return clamp((sticky.getBoundingClientRect().top-story.getBoundingClientRect().top)/Math.max(1,story.offsetHeight-sticky.offsetHeight),0,1);};
 function size(f){const r=f.canvas.getBoundingClientRect();f.w=Math.max(1,r.width);f.h=Math.max(1,r.height);f.dpr=Math.min(devicePixelRatio||1,1.75);f.canvas.width=Math.round(f.w*f.dpr);f.canvas.height=Math.round(f.h*f.dpr);f.ctx.setTransform(f.dpr,0,0,f.dpr,0,0);}
 function draw(f,t,q){
   const {ctx,w,h,hero}=f;ctx.clearRect(0,0,w,h);
   f.px+=(f.tx-f.px)*.08;f.py+=(f.ty-f.py)*.08;
   const playing=audio&&!audio.paused&&!audio.ended&&!audio.error;
   const amp=(playing?.95:.52)*(hero?1:1+q*.7);
   const cols=w<650?30:54,rows=w<650?15:23;
   const focal=Math.min(w,h)*(.72+q*.25),camera=4.8-q*1.15,angle=.57+q*.30+f.py*.10;
   const cx=w*(hero ? .73 : .5)+f.px*24,cy=h*(hero ? .83 : .58)+f.py*14;
   const points=[];
   for(let j=0;j<rows;j++){
     const z=-2.7+5.4*j/(rows-1);
     for(let i=0;i<cols;i++){
       const x=-4.8+9.6*i/(cols-1);
       const pulse=Math.sin(x*1.55-z*1.1-t*1.7)*.36+Math.sin(x*.78+z*2.2+t*.8)*.19;
       const y=pulse*amp;
       const yy=y*Math.cos(angle)-z*Math.sin(angle),zz=y*Math.sin(angle)+z*Math.cos(angle);
       const scale=focal/Math.max(1,camera-zz);
       const sx=cx+x*scale,sy=cy-yy*scale;
       points.push({x:sx,y:sy,r:clamp(scale*.011,.55,3.2),alpha:clamp(.14+(j/(rows-1))*.5+(pulse+.55)*.19,.12,.93),warm:pulse>.36});
     }
   }
   ctx.lineWidth=.6;
   for(let j=0;j<rows;j+=3){ctx.beginPath();for(let i=0;i<cols;i++){const p=points[j*cols+i];if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle="rgba(141,185,148,.12)";ctx.stroke();}
   for(const p of points){if(p.x<-5||p.x>w+5||p.y<-5||p.y>h+5)continue;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.warm?"rgba(229,191,136,"+p.alpha+")":"rgba(157,204,165,"+p.alpha+")";ctx.fill();}
 }
 function frame(now){raf=0;if(document.hidden)return;const q=progress();if(story){story.style.setProperty("--signal-progress",String(q));story.style.setProperty("--signal-text-y",(-q*64)+"px");story.style.setProperty("--signal-depth-y",(q*90)+"px");}if(!last||now-last>=32||reduced.matches){if(!reduced.matches)phase+=last?Math.min((now-last)/1000,.07):0;last=now;fields.forEach(f=>{if(f.visible)draw(f,phase,f.hero?clamp(-f.canvas.getBoundingClientRect().top/f.h,0,1):q);});}if(!reduced.matches&&fields.some(f=>f.visible))wake();}
 function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
 fields.forEach(f=>{size(f);const parent=f.canvas.parentElement;parent.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||reduced.matches)return;const r=parent.getBoundingClientRect();f.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);f.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);wake();});parent.addEventListener("pointerleave",()=>{f.tx=f.ty=0;});if("ResizeObserver"in window)new ResizeObserver(()=>{size(f);wake();}).observe(f.canvas);if("IntersectionObserver"in window)new IntersectionObserver(es=>{f.visible=es[0].isIntersecting;if(f.visible){last=0;wake();}},{rootMargin:"50px"}).observe(f.canvas);});
 window.addEventListener("scroll",wake,{passive:true});window.addEventListener("resize",()=>{fields.forEach(size);wake();});document.addEventListener("visibilitychange",()=>{last=0;wake();});reduced.addEventListener("change",()=>{if(story){if(reduced.matches)delete story.dataset.spatialReady;else if(fields.some(f=>!f.hero))story.dataset.spatialReady="true";}wake();});wake();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();window.addEventListener("pageshow",init);
})();
