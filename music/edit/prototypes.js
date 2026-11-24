/* Kinetic prototype gallery. Native radios own selection; drag only changes spatial presentation. */
(function(){
"use strict";
function init(){
 const root=document.querySelector("[data-prototypes]");if(!root||root.dataset.prototypesReady==="true")return;
 const stage=root.querySelector("[data-prototype-stage]"),inputs=Array.from(root.querySelectorAll("[data-prototype-choice]")),objects=Array.from(root.querySelectorAll("[data-prototype-object]"));
 if(!stage||inputs.length<2||objects.length!==inputs.length)return;
 const N=inputs.length,mod=(i)=>((i%N)+N)%N,selected=()=>Math.max(0,inputs.findIndex(x=>x.checked));
 let drag=null,suppress=false;
 function reset(){objects.forEach(o=>{o.style.removeProperty("--slot");o.style.removeProperty("--depth");o.style.removeProperty("z-index");o.style.removeProperty("--face-bright");});delete stage.dataset.dragging;}
 function choose(i){inputs[mod(i)]?.click();}
 function paint(shift){
   const center=selected()+shift;
   objects.forEach((o,i)=>{let delta=((i-center+N/2)%N+N)%N-N/2,depth=Math.abs(delta);o.style.setProperty("--slot",String(delta));o.style.setProperty("--depth",String(depth));o.style.zIndex=String(Math.round(30-depth*8));o.style.setProperty("--face-bright",String(Math.max(.62,1-depth*.19)));});
 }
 root.querySelectorAll("[data-prototype-step]").forEach(b=>b.addEventListener("click",()=>choose(selected()+Number(b.dataset.prototypeStep))));
 stage.addEventListener("keydown",e=>{if(e.target!==stage||!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();choose(e.key==="Home"?0:e.key==="End"?N-1:selected()+(e.key==="ArrowRight"?1:-1));});
 stage.addEventListener("pointerdown",e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,shift:0,active:false};});
 stage.addEventListener("pointermove",e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.active){if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(dy))return;drag.active=true;stage.dataset.dragging="true";stage.setPointerCapture(e.pointerId);}drag.shift=Math.max(-2,Math.min(2,-dx/Math.max(80,stage.clientWidth*.23)));paint(drag.shift);});
 function end(e,cancel){if(!drag||drag.id!==e.pointerId)return;const v=drag;drag=null;if(!v.active)return;suppress=true;setTimeout(()=>{suppress=false;},350);let step=Math.abs(v.shift)>.28?Math.sign(v.shift)*Math.max(1,Math.round(Math.abs(v.shift))):0;delete stage.dataset.dragging;if(!cancel&&step)choose(selected()+step);requestAnimationFrame(reset);}
 stage.addEventListener("pointerup",e=>end(e,false));stage.addEventListener("pointercancel",e=>end(e,true));stage.addEventListener("lostpointercapture",e=>end(e,true));
 stage.addEventListener("pointerleave",e=>{if(drag&&!drag.active)end(e,true);});
 stage.addEventListener("click",e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();suppress=false;}},true);
 stage.addEventListener("dragstart",e=>e.preventDefault());
 root.addEventListener("change",e=>{if(inputs.includes(e.target)&&!drag)requestAnimationFrame(reset);});
 // Reading drives the spatial stage, not the other way around.
 const rows=Array.from(root.querySelectorAll("[data-prototype-entry]"));
 let scrollFrame=0;
 function syncReading(){scrollFrame=0;if(drag||innerWidth<=760||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
   const rect=root.getBoundingClientRect(),line=innerHeight*.44;
   if(rect.top>line||rect.bottom<line)return;
   let best=-1,dist=Infinity;
   rows.forEach((row,i)=>{const r=row.getBoundingClientRect(),distance=line<r.top?r.top-line:line>r.bottom?line-r.bottom:0;if(distance<dist){dist=distance;best=i;}});
   if(best>=0&&dist<innerHeight*.30&&best!==selected())choose(best);
 }
 window.addEventListener("scroll",()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(syncReading);},{passive:true});
 root.dataset.prototypesReady="true";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
