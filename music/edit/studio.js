/* A small standalone WebGL scene: no CDN, no React hydration dependency. */
(function(){
  "use strict";
  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  function start(){
    var root=document.querySelector(".ed-studio-hero"),stage=root&&root.querySelector("[data-record-stage]");
    if(!stage||stage.dataset.initialized==="true")return;
    stage.dataset.initialized="true";stage.dataset.recordVersion="5.10.0";
    var mount=stage.querySelector("[data-record-mount]"),reset=root.querySelector("[data-record-reset]"),audio=document.getElementById("ed-radio-audio");
    var yaw=-.38,pitch=.48,targetY=yaw,targetX=pitch,drag=null,spin=0,playing=false,last=0,raf=0,visible=true,idle=0,hoverX=0,hoverY=0,glLost=false,lastReport=0;
    function syncAudio(){playing=!!audio&&!audio.paused&&!audio.ended&&!audio.error;}
    if(audio){["play","playing","pause","ended","error","emptied"].forEach(function(e){audio.addEventListener(e,syncAudio)});syncAudio();}
    if(reset)reset.addEventListener("click",function(){targetY=yaw=-.38;targetX=pitch=.48;hoverX=hoverY=0;stage.dataset.recordYaw=String(yaw);stage.dataset.recordPitch=String(pitch);});

    function hit(e){
      if(!stage.isConnected||stage.closest("[hidden]")||document.querySelector("dialog[open]"))return false;
      const rect=stage.getBoundingClientRect();
      if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return false;
      const target=e.target instanceof Element?e.target:null;
      if(target?.closest("button,a,input,label,.ed-header,.ed-radio,[popover]"))return false;
      return rect.width>0&&rect.height>0;
    }
    function fallback(){
      if(stage.dataset.webgl==="fallback")return;
      stage.dataset.webgl="fallback";
      var disc=stage.querySelector(".ed-studio-disc"),fx=34,fy=-18,fd=null;
      if(!disc)return;
      function paint(x,y){disc.style.setProperty("--record-x",x+"deg");disc.style.setProperty("--record-y",y+"deg");stage.dataset.recordPitch=String(x*Math.PI/180);stage.dataset.recordYaw=String(y*Math.PI/180);}
      paint(fx,fy);
      function fallbackDown(e){if(e.button!==0||fd||!hit(e))return;e.preventDefault();fd={id:e.pointerId,x:e.clientX,y:e.clientY};try{stage.setPointerCapture(e.pointerId);}catch(_){}stage.dataset.dragging="true";stage.dataset.recordDragEvents="0";}
      function fallbackMove(e){if(!fd||fd.id!==e.pointerId)return;if(e.cancelable)e.preventDefault();fy+=.75*(e.clientX-fd.x);fx=Math.max(-80,Math.min(80,fx+.75*(e.clientY-fd.y)));fd.x=e.clientX;fd.y=e.clientY;paint(fx,fy);stage.dataset.recordDragEvents=String(Number(stage.dataset.recordDragEvents||0)+1);}
      function fallbackEnd(e){if(!fd||(e&&e.pointerId!=null&&e.pointerId!==fd.id))return;var id=fd.id;fd=null;delete stage.dataset.dragging;try{if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);}catch(_){}paint(fx,fy);}
      window.addEventListener("pointerdown",fallbackDown,{capture:true,passive:false});
      window.addEventListener("pointermove",fallbackMove,{capture:true,passive:false});
      window.addEventListener("pointerup",fallbackEnd,true);window.addEventListener("pointercancel",fallbackEnd,true);window.addEventListener("blur",()=>fallbackEnd());
      stage.addEventListener("lostpointercapture",fallbackEnd);
      stage.addEventListener("keydown",function(e){if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();if(e.key==="ArrowLeft")fy-=12;if(e.key==="ArrowRight")fy+=12;if(e.key==="ArrowUp")fx=Math.max(-75,fx-12);if(e.key==="ArrowDown")fx=Math.min(75,fx+12);paint(fx,fy);});
      if(reset)reset.addEventListener("click",function(){fx=34;fy=-18;paint(fx,fy);});
    }

    var canvas=document.createElement("canvas");canvas.setAttribute("aria-hidden","true");
    var gl;
    try{gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false});}catch(e){fallback();return;}
    if(!gl||!mount){fallback();return;}
    var vert="attribute vec3 aPos;attribute vec3 aNormal;uniform vec2 uRotation;uniform float uAspect;uniform float uSpin;uniform float uKind;uniform float uCamera;uniform float uFloat;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vWorld;vec3 rx(vec3 p,float a){return vec3(p.x,p.y*cos(a)-p.z*sin(a),p.y*sin(a)+p.z*cos(a));}vec3 ry(vec3 p,float a){return vec3(p.x*cos(a)+p.z*sin(a),p.y,-p.x*sin(a)+p.z*cos(a));}vec3 rz(vec3 p,float a){return vec3(p.x*cos(a)-p.y*sin(a),p.x*sin(a)+p.y*cos(a),p.z);}void main(){vLocal=aPos;vec3 p=aPos;vec3 n=aNormal;if(uKind<.5){p=rz(p,uSpin);n=rz(n,uSpin);}p=ry(rx(p,uRotation.x),uRotation.y);n=ry(rx(n,uRotation.x),uRotation.y);vNormal=n;vWorld=p;p.y+=uFloat;float d=uCamera-p.z;gl_Position=vec4(p.x*2.96/uAspect,p.y*2.96,1.03*d-0.28,d);}";
    var frag="precision highp float;\nuniform float uKind;uniform float uCamera;uniform float uLight;\nvarying vec3 vLocal;varying vec3 vNormal;varying vec3 vWorld;\nvoid main(){\n if(uKind>.5){gl_FragColor=vec4(.78,.67,.48,.24);return;}\n float r=length(vLocal.xy),a=atan(vLocal.y,vLocal.x);\n vec3 N=normalize(vNormal),V=normalize(vec3(0.,0.,uCamera)-vWorld);\n vec3 L=normalize(vec3(-1.4+uLight*.9,1.5,2.2));\n vec3 H=normalize(L+V),L2=normalize(vec3(1.4,-.7,1.0));\n float ndl=max(dot(N,L),0.),rim=pow(1.-abs(dot(N,V)),3.);\n float spec=pow(max(dot(N,H),0.),42.);\n float spec2=pow(max(dot(N,normalize(L2+V)),0.),12.);\n float groove=.5+.5*sin(r*265.+sin(r*55.)*.23);\n float band=.5+.5*sin(r*24.);\n float streak=pow(max(0.,cos(a-1.17-uLight*.45+r*.22)),22.)+\n pow(max(0.,cos(a+2.0-uLight*.28-r*.32)),36.);\n vec3 col=vec3(.012,.016,.015)+vec3(.034,.037,.033)*groove;\n col+=vec3(.40,.43,.39)*streak*(.12+.88*groove)*(.65+.35*band);\n col+=vec3(.09,.13,.10)*spec2+vec3(.30,.26,.19)*spec;\n if(r>.47&&r<.57)col*=.73;\n if(r<.48){\n   col=vec3(.87,.82,.70);\n   col*=.94+.06*band;\n   float edge=1.-smoothstep(.003,.008,abs(r-.418));\n   col=mix(col,vec3(.21,.32,.25),edge*.75);\n   float line=1.-smoothstep(.003,.008,abs(vLocal.y-.13));\n   if(abs(vLocal.x)<.22)col=mix(col,vec3(.15,.22,.16),line);\n   float slit=1.-smoothstep(.003,.008,abs(vLocal.x+.09));\n   if(vLocal.y<.08&&vLocal.y>-.15)col=mix(col,vec3(.15,.22,.16),slit);\n   col+=vec3(.05,.045,.025)*spec;\n }\n if(r>1.47)col=mix(col,vec3(.10,.12,.10),.45);\n col*=.65+.55*ndl;col+=vec3(.17,.21,.16)*rim;\n gl_FragColor=vec4(col,1.);\n}";
    function shader(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    var program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vert));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){console.warn("Jasmine record scene:",e);fallback();return;}
    var vertices=[],segments=240,R=1.51,inner=.045,z=.028;
    function p(r,a,z){return [r*Math.cos(a),r*Math.sin(a),z];}
    function put(p,n){vertices.push(p[0],p[1],p[2],n[0],n[1],n[2]);}
    function tri(a,b,c,n){put(a,n);put(b,n);put(c,n);}
    for(var i=0;i<segments;i++){
      var a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
      [z,-z].forEach(function(f){var n=[0,0,f>0?1:-1];tri(p(inner,a,f),p(R-.025,a,f),p(R-.025,b,f),n);tri(p(inner,a,f),p(R-.025,b,f),p(inner,b,f),n);var ba=[Math.cos((a+b)/2)*.707,Math.sin((a+b)/2)*.707,f>0?.707:-.707];tri(p(R-.025,a,f),p(R,a,f*.30),p(R,b,f*.30),ba);tri(p(R-.025,a,f),p(R,b,f*.30),p(R-.025,b,f),ba);});
      var n=[Math.cos((a+b)/2),Math.sin((a+b)/2),0];tri(p(R,a,z*.30),p(R,a,-z*.30),p(R,b,-z*.30),n);tri(p(R,a,z*.30),p(R,b,-z*.30),p(R,b,z*.30),n);
    }
    var discCount=vertices.length/6,orbitStart=discCount;
    for(var j=0;j<=180;j++){var a=j*2*Math.PI/180;put([1.84*Math.cos(a),1.84*Math.sin(a)*.70,1.84*Math.sin(a)*.45],[0,0,1]);}
    var orbitCount=vertices.length/6-orbitStart;
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.useProgram(program);
    var pos=gl.getAttribLocation(program,"aPos"),normal=gl.getAttribLocation(program,"aNormal");gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(normal,3,gl.FLOAT,false,24,12);
    var rot=gl.getUniformLocation(program,"uRotation"),aspect=gl.getUniformLocation(program,"uAspect"),spinU=gl.getUniformLocation(program,"uSpin"),kind=gl.getUniformLocation(program,"uKind"),camera=gl.getUniformLocation(program,"uCamera"),floatU=gl.getUniformLocation(program,"uFloat"),lightU=gl.getUniformLocation(program,"uLight");
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    mount.appendChild(canvas);stage.dataset.webgl="ready";
    function size(){var r=stage.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);}
    function draw(t){raf=0;if(glLost||!stage.isConnected||!visible||document.hidden)return;var dt=last?Math.min((t-last)/1000,.05):0;last=t;var k=(drag||reduced.matches)?1:1-Math.pow(.001,dt);yaw+=(targetY-yaw)*k;pitch+=(targetX-pitch)*k;if(!reduced.matches)idle+=dt;if(playing||!reduced.matches)spin=(spin+dt*(playing?3.49:.22))%(Math.PI*2);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);var scroll=reduced.matches?0:root.closest("[data-cinema-ready=true]")?Number(root.dataset.sceneProgress||0):Math.max(0,Math.min(1,-root.getBoundingClientRect().top/Math.max(1,root.offsetHeight)));gl.uniform1f(camera,5.4);gl.uniform1f(floatU,reduced.matches?0:Math.sin(idle*.8)*.095);gl.uniform1f(lightU,reduced.matches?0:Math.sin(idle*.42)*.7+hoverY);gl.uniform2f(rot,pitch+(reduced.matches?0:Math.sin(idle*.85)*.12+hoverX),yaw+(reduced.matches?0:Math.sin(idle*.65)*.20+hoverY));gl.uniform1f(aspect,canvas.width/canvas.height);gl.uniform1f(spinU,spin);gl.uniform1f(kind,0);gl.drawArrays(gl.TRIANGLES,0,discCount);gl.flush();
      if(t-lastReport>100||reduced.matches){stage.dataset.recordYaw=yaw.toFixed(4);stage.dataset.recordPitch=pitch.toFixed(4);stage.dataset.recordSpin=spin.toFixed(4);stage.dataset.recordPlaying=String(playing);lastReport=t;}
      if(playing||!reduced.matches||Math.abs(yaw-targetY)>.001||Math.abs(pitch-targetX)>.001)raf=requestAnimationFrame(draw);}
    function wake(){if(!glLost&&!raf&&stage.isConnected&&visible&&!document.hidden){last=0;raf=requestAnimationFrame(draw);}}
    function redraw(){if(glLost||!stage.isConnected)return;visible=true;if(raf)cancelAnimationFrame(raf);raf=0;draw(performance.now());}
    function fit(){if(glLost)return;size();wake();}
    if("ResizeObserver"in window)new ResizeObserver(fit).observe(stage);else window.addEventListener("resize",fit);
    if("IntersectionObserver"in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)wake();},{rootMargin:"100px"}).observe(stage);
    document.addEventListener("visibilitychange",wake);window.addEventListener("pageshow",function(){visible=stage.getBoundingClientRect().bottom>0&&stage.getBoundingClientRect().top<innerHeight;wake();});
    // Follow pointer coordinates directly, independently of animation easing and scroll pinning.
    function begin(e){
      if(glLost||e.button!==0||drag||!hit(e))return;
      e.preventDefault();
      drag={id:e.pointerId,x:e.clientX,y:e.clientY};hoverX=hoverY=0;
      try{stage.setPointerCapture(e.pointerId);}catch(_){}
      stage.dataset.dragging="true";stage.dataset.recordDragEvents="0";visible=true;redraw();
    }
    function move(e){
      if(glLost||!drag||e.pointerId!==drag.id)return;
      if(e.cancelable)e.preventDefault();
      targetY=yaw+(e.clientX-drag.x)*.014;
      targetX=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag.y)*.014));
      yaw=targetY;pitch=targetX;drag.x=e.clientX;drag.y=e.clientY;
      stage.dataset.recordYaw=String(yaw);stage.dataset.recordPitch=String(pitch);
      stage.dataset.recordDragEvents=String(Number(stage.dataset.recordDragEvents||0)+1);
      visible=true;redraw();
    }
    function end(e){
      if(!drag||(e&&e.pointerId!=null&&e.pointerId!==drag.id))return;
      const id=drag.id;drag=null;delete stage.dataset.dragging;
      try{if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);}catch(_){}
      wake();
    }
    window.addEventListener("pointerdown",begin,{capture:true,passive:false});
    window.addEventListener("pointermove",move,{capture:true,passive:false});
    window.addEventListener("pointerup",end,true);
    window.addEventListener("pointercancel",end,true);
    window.addEventListener("blur",()=>end());
    stage.addEventListener("lostpointercapture",end);
    stage.addEventListener("pointermove",function(e){if(glLost||drag||e.pointerType!=="mouse")return;var rect=stage.getBoundingClientRect();hoverY=((e.clientX-rect.left)/rect.width-.5)*.36;hoverX=((e.clientY-rect.top)/rect.height-.5)*.28;wake();});
    stage.addEventListener("pointerleave",function(){hoverX=hoverY=0;wake();});
    stage.addEventListener("keydown",function(e){if(glLost||!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();if(e.key==="ArrowLeft")targetY-=.25;if(e.key==="ArrowRight")targetY+=.25;if(e.key==="ArrowUp")targetX=Math.max(-1.25,targetX-.2);if(e.key==="ArrowDown")targetX=Math.min(1.25,targetX+.2);yaw=targetY;pitch=targetX;stage.dataset.recordYaw=String(yaw);stage.dataset.recordPitch=String(pitch);redraw();});
    if(reset)reset.addEventListener("click",redraw);if(audio){audio.addEventListener("play",wake);audio.addEventListener("playing",wake);audio.addEventListener("pause",wake);}
    reduced.addEventListener("change",wake);canvas.addEventListener("webglcontextlost",function(e){e.preventDefault();if(raf)cancelAnimationFrame(raf);raf=0;visible=false;glLost=true;canvas.remove();fallback();});fit();
  }
  function init(){start();}
  window.__jasmineRecordInit=init;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("pageshow",init);
})();
