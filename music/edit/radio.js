/* Shared native audio controller. */
(function(){
const init=()=>(function initializeRadio(doc){
  const audio=doc.getElementById("ed-radio-audio"),root=doc.querySelector(".ed");
  if(!audio||!root||audio.dataset.radioReady==="true")return;
  audio.dataset.radioReady="true";
  let failed=false;
  const nodes=selector=>Array.from(root.querySelectorAll(selector));
  const format=seconds=>Number.isFinite(seconds)&&seconds>=0?Math.floor(seconds/60)+":"+String(Math.floor(seconds%60)).padStart(2,"0"):"0:00";
  const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
  function sync(){
    const playing=!audio.paused&&!audio.ended&&!failed;
    root.dataset.radioPlaying=String(playing);
    nodes("[data-radio-toggle]").forEach(button=>{button.setAttribute("aria-label",playing?"暂停音乐":"播放音乐");button.setAttribute("aria-pressed",String(playing));});
    const len=duration(),time=Number.isFinite(audio.currentTime)?audio.currentTime:0;
    nodes("[data-radio-elapsed]").forEach(el=>{el.textContent=format(time);});
    nodes("[data-radio-duration]").forEach(el=>{el.textContent=format(len);});
    nodes("[data-radio-seek]").forEach(el=>{el.max=String(len||1);el.disabled=!len;el.value=String(Math.min(time,len||1));});
    nodes("[data-radio-volume]").forEach(el=>{el.value=String(audio.muted?0:audio.volume);});
    nodes("[data-radio-status]").forEach(el=>{el.textContent=failed?"音频加载失败，可重试":"I NEED U / VOL. 01";});
  }
  audio.volume=.65;
  root.addEventListener("click",event=>{
    if(!event.target.closest?.("[data-radio-toggle]"))return;
    failed=false;
    if(!audio.paused&&!audio.ended){audio.pause();sync();return;}
    if(audio.ended)audio.currentTime=0;
    try{const result=audio.play();if(result&&typeof result.catch==="function")result.catch(()=>{failed=true;sync();});}
    catch{failed=true;sync();}
    sync();
  });
  root.addEventListener("input",event=>{
    const el=event.target;
    if(el.matches("[data-radio-seek]")&&duration()){audio.currentTime=Math.max(0,Math.min(duration(),Number(el.value)||0));sync();}
    else if(el.matches("[data-radio-volume]")){audio.muted=false;audio.volume=Math.max(0,Math.min(1,Number(el.value)||0));sync();}
  });
  ["play","playing","pause","ended","loadedmetadata","durationchange","timeupdate","seeking","seeked","volumechange","emptied"].forEach(name=>audio.addEventListener(name,()=>{if(name==="play"||name==="playing")failed=false;sync();}));
  audio.addEventListener("error",()=>{failed=true;sync();});
  sync();
})(document);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.addEventListener("pageshow",init);
})();
