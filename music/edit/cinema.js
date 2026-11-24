/* Continuous scroll scenes and reversible project navigation. */
(function(){
"use strict";
function init(){
 const root=document.querySelector(".ed#top");if(!root||root.dataset.cinema==="true")return;
 root.dataset.cinema="true";
 const reduced=matchMedia("(prefers-reduced-motion: reduce)"),fine=matchMedia("(hover:hover) and (pointer:fine)");
 // Context cues never intercept pointer events or replace the native cursor.
 const tip=document.createElement("div");tip.className="ed-context-cue";tip.setAttribute("aria-hidden","true");document.body.append(tip);
 const cues=[["[data-record-stage]","ROTATE / 拖动"],["[data-page-drag],[data-cover-drag]","TURN / 翻页"],["[data-atlas-scene]","ORBIT / 旋转"],["[data-prototype-stage]","DRAG / 浏览"]];
 function hide(){tip.removeAttribute("data-visible");}
 root.addEventListener("pointermove",event=>{if(!fine.matches||reduced.matches||event.pointerType!=="mouse"||!(event.target instanceof Element)){hide();return;}const el=event.target;if(el.closest("a,button,input,video,[popover],.ed-atlas-node,.ed-book-toc-item,.ed-native-gallery")){hide();return;}
 const cue=cues.find(([selector])=>el.closest(selector));if(!cue){hide();return;}tip.textContent=cue[1];tip.style.left=Math.min(innerWidth-125,event.clientX+17)+"px";tip.style.top=Math.max(8,Math.min(innerHeight-38,event.clientY+18))+"px";tip.dataset.visible="true";},{passive:true});
 root.addEventListener("pointerleave",hide);window.addEventListener("scroll",hide,{passive:true});window.addEventListener("blur",hide);
 // Save only local navigation state, never personal data or audio.
 const key="jasmine-edit-return-v1";
 function save(event){if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;const a=event.target instanceof Element&&event.target.closest("a[href]");if(!a)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||!url.pathname.includes("/projects/"))return;
 const id=url.pathname.split("/").filter(Boolean).pop(),book=a.closest("[data-book]"),proto=a.closest("[data-prototypes]");let slot=null,group=null;
 if(book){slot=book.querySelector(".ed-book-radio:checked")?.dataset.slot;group="book";}else if(proto){slot=proto.querySelector("[data-prototype-choice]:checked")?.dataset.prototypeChoice;group="prototype";}
 if(group&&slot!=null)try{sessionStorage.setItem(key,JSON.stringify({id,group,slot,y:scrollY,at:Date.now()}));}catch{}
 }
 root.addEventListener("click",save);
 function restore(){
   const url=new URL(location.href),requested=url.searchParams.get("resume"),back=performance.getEntriesByType("navigation")[0]?.type==="back_forward";if(!requested&&!back)return;
   let saved=null;try{saved=JSON.parse(sessionStorage.getItem(key)||"null");}catch{}
   const id=requested||saved?.id;if(!id||!/^[a-zA-Z0-9_-]+$/.test(id))return;
   const book=root.querySelector("[data-book=practice]"),proto=root.querySelector("[data-prototypes]");
   const spread=Array.from(book?.querySelectorAll(".ed-book-spread")||[]).find(el=>Array.from(el.querySelectorAll("a[href]")).some(a=>a.getAttribute("href")?.includes("/projects/"+id+"/")));
   let target=null;
   if(spread&&book){const slot=spread.dataset.panel,input=book.querySelector('.ed-book-radio[data-slot="'+slot+'"]');if(input){book.dataset.restoring="true";input.click();delete book.dataset.restoring;target=book;}}
   else if(proto){const entry=Array.from(proto.querySelectorAll("[data-prototype-entry]")).find(el=>Array.from(el.querySelectorAll("a[href]")).some(a=>a.getAttribute("href")?.includes("/projects/"+id+"/")));if(entry){proto.querySelector('[data-prototype-choice="'+entry.dataset.prototypeEntry+'"]')?.click();target=entry;}}
   if(requested){url.searchParams.delete("resume");history.replaceState(history.state,"",url.pathname+url.search+url.hash);}
   if(target&&saved&&saved.id===id&&Date.now()-saved.at<86400000&&Number.isFinite(saved.y)){requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo({top:saved.y,behavior:"instant"})));}
   else if(target&&requested)requestAnimationFrame(()=>target.scrollIntoView({block:"start",behavior:"instant"}));
 }
 restore();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();