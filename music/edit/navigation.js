/* Standalone navigation enhancement: independent of React hydration. */
(function () {
  "use strict";
  function init() {
    var root = document.getElementById("top");
    var header = root && root.querySelector(".ed-header");
    var nav = header && header.querySelector(".ed-nav");
    if (!root || !header || !nav || header.dataset.navReady === "true") return;
    var links = Array.from(nav.querySelectorAll("a[data-chapter]"));
    var chapters = links.map(function (link) {
      return { id: link.dataset.chapter, link: link, section: document.getElementById(link.dataset.chapter) };
    }).filter(function (item) { return item.section; });
    var progress = header.querySelector(".ed-reading-progress");
    var marker = header.querySelector(".ed-nav-marker");
    var label = header.querySelector(".ed-current-chapter");
    var frame = 0, current = "", lock = "", timer = 0;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The archive uses a continuous paper field; only the prologue and sign-off have dark navigation.
    var dark = new Set(["top", "about"]);
    function positionMarker() {
      var item = chapters.find(function (c) { return c.id === current; });
      if (!item || !marker) return;
      marker.style.width = item.link.offsetWidth + "px";
      marker.style.transform = "translateX(" + item.link.offsetLeft + "px)";
    }
    function paint(id, reveal) {
      var item = chapters.find(function (c) { return c.id === id; });
      if (!item) return;
      var changed = current !== id;
      current = id;
      header.dataset.active = id;
      header.dataset.theme = dark.has(id) ? "dark" : "light";
      chapters.forEach(function (c) {
        if (c.id === id) c.link.setAttribute("aria-current", "location");
        else c.link.removeAttribute("aria-current");
      });
      if (label) label.textContent = String(chapters.indexOf(item)).padStart(2, "0") + " / " + item.link.dataset.english;
      positionMarker();
      if (changed && reveal && nav.scrollWidth > nav.clientWidth) {
        var left = item.link.offsetLeft, right = left + item.link.offsetWidth;
        if (left < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth)
          nav.scrollTo({ left: Math.max(0, left - (nav.clientWidth - item.link.offsetWidth) / 2), behavior: reduced.matches ? "instant" : "smooth" });
      }
    }
    function clearLock() { lock = ""; window.clearTimeout(timer); }
    function sync() {
      frame = 0;
      var y = window.scrollY;
      var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (progress) progress.style.transform = "scaleX(" + (max ? Math.min(1, Math.max(0,y/max)) : 0) + ")";
      var line = Math.max(header.getBoundingClientRect().bottom + 20, Math.min(window.innerHeight * .3, 240));
      var id = "top";
      chapters.forEach(function(c) { if (c.id !== "top" && c.section.getBoundingClientRect().top <= line) id = c.id; });
      if (max > 0 && y >= max - 4) id = chapters[chapters.length - 1].id;
      if (lock) {
        if (id === lock) clearLock();
        else { paint(lock, true); return; }
      }
      paint(id, true);
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(sync); }
    function choose(id) {
      if (!chapters.some(function(c) { return c.id === id; })) return;
      clearLock();
      lock = id;
      paint(id, true);
      timer = window.setTimeout(function() { clearLock(); schedule(); }, 1800);
      schedule();
    }
    root.addEventListener("click", function(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target instanceof Element && e.target.closest("a[href^='#']");
      if (!link) return;
      var id = link.getAttribute("href").slice(1);
      choose(id === "honors" ? "campus" : id);
    });
    window.addEventListener("hashchange", function() {
      var id = location.hash.slice(1) || "top";
      choose(id === "honors" ? "campus" : id);
    });
    window.addEventListener("scroll", schedule, {passive:true});
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", function() { clearLock(); schedule(); }, {passive:true});
    window.addEventListener("touchstart", function() { clearLock(); schedule(); }, {passive:true});
    window.addEventListener("keydown", function(e) {
      if (["PageDown","PageUp","Home","End","ArrowDown","ArrowUp"," "].includes(e.key) && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement)) { clearLock(); schedule(); }
    });
    if ("ResizeObserver" in window) {
      var observer = new ResizeObserver(schedule);
      observer.observe(root);
      observer.observe(nav);
      chapters.forEach(function(c) { observer.observe(c.section); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    header.dataset.navReady = "true";
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
  window.addEventListener("pageshow", init);
})();

/* Native media keyboard and video cleanup. */
(function(){
  function pauseHidden(root){root.querySelectorAll("video").forEach(function(v){if(!v.getClientRects().length)v.pause();});}
  document.addEventListener("change",function(e){
    if(!(e.target instanceof HTMLInputElement))return;
    if(e.target.matches("[data-media-slot]")){var g=e.target.closest(".ed-native-gallery");if(g){var reset=g.querySelector('[data-zoom-slot="100"]');if(reset)reset.checked=true;pauseHidden(g);}}
    if(e.target.matches(".ed-choice")){var shelf=e.target.closest(".ed-shelf");if(shelf)pauseHidden(shelf);}
  });
  document.addEventListener("toggle",function(e){var el=e.target;if(el instanceof HTMLElement&&el.matches(".ed-native-viewer")){var g=el.closest(".ed-native-gallery");if(g)pauseHidden(g);}},true);
  document.addEventListener("keydown",function(e){
    if(!["ArrowLeft","ArrowRight"].includes(e.key)||e.target instanceof HTMLVideoElement||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
    var open=document.querySelector(".ed-native-viewer:popover-open");
    var g=open?open.closest(".ed-native-gallery"):e.target instanceof Element?e.target.closest(".ed-native-gallery"):null;
    if(!g)return;
    var slides=Array.from(g.querySelectorAll(":scope > input[data-media-slot]")),i=slides.findIndex(function(r){return r.checked;});
    var next=slides[i+(e.key==="ArrowRight"?1:-1)];
    if(next){e.preventDefault();next.click();}
  });
})();
