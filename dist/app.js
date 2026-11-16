import {createState,walk,serialize,startRide,endRide,updateRide} from './game.js';
const $=id=>document.getElementById(id),canvas=$('world'),menu=$('menu'),storageKey='solace-dream-v3',keys=new Set(),touches=new Map();
let saved;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
let state=createState(saved),ascii,time=0,last=0,renderAge=0,saveAge=0,drag=null,twoTap=null,audio=null,muted=true;
const touchMove={forward:0,right:0};
function save(){try{localStorage.setItem(storageKey,JSON.stringify(serialize(state)));}catch{}}
function clearInput(){keys.clear();drag=null;touches.clear();twoTap=null;touchMove.forward=0;touchMove.right=0;}
function soundLevel(){if(audio)audio.master.gain.setTargetAtTime(muted||state.paused?0:.24,audio.ctx.currentTime,.3);}
function setMenu(open){
 if(!open&&!ascii)return;
 clearInput();state.paused=open;$('leave-ride').hidden=!state.ride;
 if(open){if(document.pointerLockElement)document.exitPointerLock();$('begin').textContent=ascii?(state.started?(state.ride?'Continue the drive':'Keep walking'):'Walk into the night'):'Preparing the street?';$('restart').hidden=!state.started;if(!menu.open)menu.showModal();}
 else{state.started=true;if(menu.open)menu.close();canvas.focus({preventScroll:true});}
 soundLevel();save();
}
$('leave-ride').onclick=()=>{endRide(state);setMenu(false);};
$('begin').onclick=()=>setMenu(false);
menu.addEventListener('cancel',e=>{e.preventDefault();if(state.started)setMenu(false);});
$('restart').onclick=()=>{state=createState();setMenu(false);};
$('quality').onclick=()=>{if(ascii)$('quality').innerHTML='Text detail <span>'+(ascii.toggle()==='HIGH'?'Fine':'Coarse')+'</span>';};
window.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;
 const k=e.key.toLowerCase();
 if(k==='escape'){e.preventDefault();if(!e.repeat&&state.started)setMenu(!menu.open);return;}
 if(menu.open)return;
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(state.started&&!state.paused)keys.add(k);
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());save();});
window.addEventListener('blur',()=>{clearInput();save();});
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started)setMenu(true);});
document.addEventListener('pointerlockchange',()=>{
 const locked=document.pointerLockElement===canvas;document.body.classList.toggle('mouse-look',locked);
 if(!locked&&state.started&&!state.paused)setMenu(true);
});
function look(dx,dy,speed=.003){state.player.yaw-=dx*speed;state.player.pitch=Math.max(-1.2,Math.min(.7,state.player.pitch-dy*speed*.8));}
canvas.addEventListener('pointerdown',e=>{
 if(!state.started||state.paused)return;
 canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
 if(e.pointerType==='touch'){
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,side:e.clientX<innerWidth*.5?'move':'look'});
  if(touches.size===2)twoTap={time:performance.now(),valid:[...touches.values()].every(t=>Math.hypot(t.x-t.startX,t.y-t.startY)<12)};
 }else drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
});
canvas.addEventListener('pointermove',e=>{
 if(!state.started||state.paused)return;
 const touch=touches.get(e.pointerId);
 if(touch){
  const dx=e.clientX-touch.startX,dy=e.clientY-touch.startY;
  if(twoTap&&Math.hypot(dx,dy)>12)twoTap.valid=false;
  if(touch.side==='move'){const dead=v=>Math.abs(v)<9?0:Math.sign(v)*Math.min(1,(Math.abs(v)-9)/65);touchMove.forward=dead(-dy);touchMove.right=dead(dx);}
  else look(e.clientX-touch.x,e.clientY-touch.y,.005);
  touch.x=e.clientX;touch.y=e.clientY;return;
 }
 if(document.pointerLockElement===canvas)look(e.movementX,e.movementY,.0025);
 else if(drag){if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>3)drag.moved=true;look(e.clientX-drag.x,e.clientY-drag.y,.005);drag.x=e.clientX;drag.y=e.clientY;}
});
function pointerEnd(e){
 const touch=touches.get(e.pointerId);
 if(touch){
  if(e.type==='pointerup'&&twoTap?.valid&&performance.now()-twoTap.time<300){setMenu(true);return;}
  if(touch.side==='move'){touchMove.forward=0;touchMove.right=0;}
  touches.delete(e.pointerId);if(!touches.size)twoTap=null;save();return;
 }
 if(e.type==='pointerup'&&drag&&!drag.moved&&e.pointerType==='mouse'&&!state.paused){try{canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}}
 drag=null;save();
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,pointerEnd);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function createAudio(){
 const ctx=new(window.AudioContext||window.webkitAudioContext)(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
 const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
 for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.025;data[i]=brown*3;}
 const rain=ctx.createBufferSource();rain.buffer=buffer;rain.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1600;
 const gain=ctx.createGain();gain.gain.value=.4;rain.connect(filter).connect(gain).connect(master);rain.start();
 for(const hz of [65.41,130.81,196]){const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=hz;g.gain.value=.018;osc.connect(g).connect(master);osc.start();}return {ctx,master};
}
$('sound').onclick=async()=>{try{if(!audio)audio=createAudio();await audio.ctx.resume();muted=!muted;soundLevel();$('sound').setAttribute('aria-pressed',String(!muted));$('sound').innerHTML='Rain audio <span>'+(muted?'Off':'On')+'</span>';}catch{$('sound').textContent='Audio unavailable';}};
function frame(ms){
 const dt=Math.min((ms-last)/1000,.1);last=ms;
 if(!state.paused){time+=dt;if(state.started)state.elapsed+=dt;}
 if(state.started&&!state.paused){
  if(keys.has('arrowleft'))state.player.yaw+=dt*1.4;if(keys.has('arrowright'))state.player.yaw-=dt*1.4;
  state.sprinting=keys.has('shift')||Math.abs(touchMove.forward)>.98;
  state.moving=walk(state,Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))+touchMove.forward,Number(keys.has('d'))-Number(keys.has('a'))+touchMove.right,dt);
  updateRide(state,dt);if(startRide(state))clearInput();
 }else state.moving=false;
 saveAge+=dt;if(saveAge>5){save();saveAge=0;}
 renderAge+=dt;if(renderAge>=1/30){ascii.draw(state,time,state.paused?0:renderAge);renderAge=0;}
 requestAnimationFrame(frame);
}
async function boot(){try{
 const [{Street},{Ascii}]=await Promise.all([import('./street.js'),import('./ascii.js')]);const street=new Street();ascii=new Ascii(canvas,street);ascii.draw(state,0,0);
 $('loading').hidden=true;$('begin').disabled=false;if(!state.started)setMenu(true);$('game').dataset.ready='true';requestAnimationFrame(frame);
}catch(error){$('loading').hidden=true;if(menu.open)menu.close();$('fatal-error').hidden=false;$('fatal-message').textContent='This street needs WebGL. Enable hardware acceleration or try a current browser.';console.error(error);}}
boot();
