/* Perspective-projected Möbius surface, with evidence-linked native nodes. */
(function(){
"use strict";
function init(){
 const stage=document.querySelector("[data-atlas-scene]"),canvas=stage?.querySelector("[data-atlas-surface]");
 if(!stage||!canvas||stage.dataset.atlasReady==="true")return;
 const ctx=canvas.getContext("2d");if(!ctx)return;
 const root=stage.closest(".ed-method-atlas"),reduced=matchMedia("(prefers-reduced-motion: reduce)");
 const clamp=(v,l,h)=>Math.min(h,Math.max(l,v));let w=1,h=1,raf=0,last=0,visible=true,yaw=.36,pitch=.57,ty=yaw,tp=pitch,drag=null,phase=0,selected=0;
 const inputs=Array.from(root.querySelectorAll("[data-domain]"));
 function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.8);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);wake();}
 function draw(){
   ctx.clearRect(0,0,w,h);
   const N=96,M=9,R=1.42,half=.48,scale=Math.min(w,h)*.23,cx=w*.5,cy=h*.53;
   const ca=Math.cos(yaw),sa=Math.sin(yaw),ct=Math.cos(pitch),st=Math.sin(pitch);
   const pts=[],cells=[];
   function point(u,v){const x=(R+v*Math.cos(u/2))*Math.cos(u),y=(R+v*Math.cos(u/2))*Math.sin(u),z=v*Math.sin(u/2);
     const X=x*ca-y*sa,Y=x*sa+y*ca,Z=z;const b=Y*ct-Z*st,c=Y*st+Z*ct;const perspective=5.5/(5.5-c);
     return [cx+X*scale*perspective,cy+b*scale*perspective,c];
   }
   for(let i=0;i<=N;i++)pts.push(Array.from({length:M+1},(_,j)=>point(i*Math.PI*2/N,-half+half*2*j/M)));
   for(let i=0;i<N;i++)for(let j=0;j<M;j++){const q=[pts[i][j],pts[i+1][j],pts[i+1][j+1],pts[i][j+1]];cells.push({q,z:q.reduce((sum,v)=>sum+v[2],0)/4,u:i/N});}
   cells.sort((a,b)=>a.z-b.z);
   // A continuous moving highlight follows the actual single surface.
   const focus=selected/5;
   for(const cell of cells){let delta=Math.abs(cell.u-focus);delta=Math.min(delta,1-delta);
     const glow=Math.exp(-delta*delta*105),wave=Math.pow(Math.max(0,Math.cos((cell.u-phase)*Math.PI*2)),16);
     const alpha=clamp(.12+(cell.z+1.8)*.105+glow*.27+wave*.06,.08,.68);
     ctx.beginPath();cell.q.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
     ctx.fillStyle="rgba(191,164,111,"+alpha+")";ctx.fill();ctx.strokeStyle="rgba(238,219,177,"+(.24+glow*.27)+")";ctx.lineWidth=.5;ctx.stroke();
   }
   // Trace the single boundary: two revolutions of the parameter connect both edges.
   ctx.beginPath();for(let i=0;i<=N*2;i++){const u=i*Math.PI*2/N,q=point(u,half);if(i===0)ctx.moveTo(q[0],q[1]);else ctx.lineTo(q[0],q[1]);}ctx.strokeStyle="rgba(237,209,153,.75)";ctx.lineWidth=1;ctx.stroke();
   stage.dataset.atlasReady="true";
 }
 function frame(t){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(!reduced.matches){yaw+=(ty-yaw)*.12;pitch+=(tp-pitch)*.12;if(!drag){ty+=dt*.075;phase=(phase+dt*.09)%1;}}else{yaw=ty;pitch=tp;}draw();if(!reduced.matches)wake();}
 function wake(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
 root.addEventListener("change",e=>{const i=inputs.indexOf(e.target);if(i<0)return;selected=i;ty+=.40;wake();});
 stage.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest("label"))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);stage.dataset.dragging="true";});
 stage.addEventListener("pointermove",e=>{if(!drag||drag.id!==e.pointerId)return;ty+=(e.clientX-drag.x)*.012;tp=clamp(tp+(e.clientY-drag.y)*.012,-1.15,1.15);drag.x=e.clientX;drag.y=e.clientY;wake();});
 function stop(){drag=null;delete stage.dataset.dragging;}
 ["pointerup","pointercancel","lostpointercapture"].forEach(e=>stage.addEventListener(e,stop));
 stage.addEventListener("keydown",e=>{if(e.target!==stage||!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home"].includes(e.key))return;e.preventDefault();if(e.key==="Home"){ty=.36;tp=.57;}else if(e.key==="ArrowLeft")ty-=.28;else if(e.key==="ArrowRight")ty+=.28;else tp=clamp(tp+(e.key==="ArrowUp"?-.20:.20),-1.15,1.15);wake();});
 if("ResizeObserver"in window)new ResizeObserver(size).observe(canvas);else window.addEventListener("resize",size);
 if("IntersectionObserver"in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;last=0;if(visible)wake();}).observe(stage);
 document.addEventListener("visibilitychange",()=>{last=0;wake();});reduced.addEventListener("change",wake);size();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
