/* Möbius strip: r(u,v) = ((R+v cos(u/2))cos u,
 (R+v cos(u/2))sin u, v sin(u/2)). (0,v) ~ (2π,-v).
 A small, depth-sorted 3D mathematical illustration, not a second player. */
(function(){
"use strict";
function start(){
 const host=document.querySelector("[data-mobius-study]"),canvas=host?.querySelector("[data-mobius-canvas]");
 if(!host||!canvas||host.dataset.mobiusReady==="true")return;
 const ctx=canvas.getContext("2d");if(!ctx)return;
 const reduce=matchMedia("(prefers-reduced-motion: reduce)");
 let width=120,height=65,visible=true,raf=0,last=0,phase=0,tx=0,ty=0,hx=0,hy=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const N=96,M=6;
 function size(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);}
 function draw(){
   const az=.22+phase*.30+hx*.35,tilt=.62+hy*.18;
   const ca=Math.cos(az),sa=Math.sin(az),ct=Math.cos(tilt),st=Math.sin(tilt);
   function point(u,v){
     const R=1.8,x=(R+v*Math.cos(u/2))*Math.cos(u),y=(R+v*Math.cos(u/2))*Math.sin(u),z=v*Math.sin(u/2);
     const a=x*ca-y*sa,b=x*sa+y*ca;return [a,b*ct-z*st,b*st+z*ct];
   }
   const scale=Math.min(width/5.25,height/4.1),points=[],cells=[];
   for(let i=0;i<=N;i++){const u=i*2*Math.PI/N;points.push(Array.from({length:M+1},(_,j)=>point(u,-.60+1.2*j/M)));}
   for(let i=0;i<N;i++)for(let j=0;j<M;j++){
     const q=[points[i][j],points[i+1][j],points[i+1][j+1],points[i][j+1]];
     cells.push({q,z:q.reduce((sum,p)=>sum+p[2],0)/4});
   }
   cells.sort((a,b)=>a.z-b.z);ctx.clearRect(0,0,width,height);
   for(const cell of cells){
     const alpha=clamp(.23+(cell.z+2)*.13,.15,.75);
     ctx.beginPath();cell.q.forEach((p,i)=>{const x=width/2+p[0]*scale,y=height/2+p[1]*scale;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();
     ctx.fillStyle="rgba(208,178,129,"+alpha+")";ctx.fill();ctx.strokeStyle="rgba(245,226,184,.43)";ctx.lineWidth=.32;ctx.stroke();
   }
   host.dataset.mobiusReady="true";
 }
 function frame(now){raf=0;if(!visible||document.hidden)return;if(!last||now-last>=33||reduce.matches){if(!reduce.matches){phase+=last?Math.min((now-last)/1000,.06):0;hx+=(tx-hx)*.12;hy+=(ty-hy)*.12;}else{phase=0;hx=hy=0;}last=now;draw();}if(!reduce.matches)wake();}
 function wake(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
 host.addEventListener("pointermove",e=>{const r=host.getBoundingClientRect();tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);wake();});
 host.addEventListener("pointerleave",()=>{tx=ty=0;});
 if("IntersectionObserver"in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){last=0;wake();}}).observe(host);
 if("ResizeObserver"in window)new ResizeObserver(()=>{size();wake();}).observe(canvas);else window.addEventListener("resize",()=>{size();wake();});
 document.addEventListener("visibilitychange",()=>{last=0;wake();});reduce.addEventListener("change",()=>{last=0;wake();});size();wake();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
