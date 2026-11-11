import {createState,walk,nearby,notice,serialize,stops} from './game.js';
const $=id=>document.getElementById(id),key='solace-state-street-v2';
let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
let state=createState(saved),ascii,street,time=0,last=0,renderTime=0,saveTime=0,dialogue=false,storyUntil=0,breathUntil=0,muted=true,audio,drag=null,wasPaused=false;
const keys=new Set(),touch=matchMedia('(pointer: coarse)').matches;
function save(){try{localStorage.setItem(key,JSON.stringify(serialize(state)));}catch{}}
function tell(label,text,duration=0){$('narrative-label').textContent=label;$('narrative-text').textContent=text;storyUntil=duration?time+duration:0;}
function updatePocket(){const n=state.found.size;$('pocket').replaceChildren(document.createTextNode(Array.from({length:4},(_,i)=>i<n?'*':'·').join(' ')),Object.assign(document.createElement('span'),{textContent:`${n} / 4 LITTLE LIGHTS`}));}
function begin(){if(!ascii)return;state.started=true;$('intro').classList.add('leaving');setTimeout(()=>{if(state.started)$('intro').hidden=true;},750);$('crosshair').hidden=false;$('mobile-controls').hidden=false;tell('AFTER THE LAST TRAIN',"No hurry. Follow the street. There is a warm light by the vending machine.",10);$('world').focus({preventScroll:true});save();}
function releaseMouse(){if(document.pointerLockElement)document.exitPointerLock();}
function pause(value){if(!state.started)return;state.paused=value;keys.clear();if(value)releaseMouse();$('pause-screen').hidden=!value;if(audio)audio.master.gain.setTargetAtTime(muted||value?0:.28,audio.ctx.currentTime,.3);}
function finish(){releaseMouse();$('district').textContent='夜明け / FIRST LIGHT';$('clock').textContent='05:08 AM';$('crosshair').hidden=true;$('mobile-controls').hidden=true;$('walk-controls').hidden=true;}
function advance(){dialogue=false;$('continue').hidden=true;if(state.ended)tell('YOU MADE IT TO MORNING','The street is still here. And so are you.');else if(state.found.size===4)tell('A LITTLE LIGHTER','Four little comforts. Follow the lane to the shrine. Morning will meet you there.',10);else tell('A LITTLE LIGHT, KEPT','There are ordinary miracles down this street. Take your time.',6);$('world').focus({preventScroll:true});}
function interact(){if(dialogue){advance();return;}const item=notice(state);if(!item)return;keys.clear();dialogue=true;releaseMouse();tell(item.title.toUpperCase(),item.text);$('continue').hidden=false;$('continue').textContent=item.ending?'[ stay a little longer ]':'[ keep walking ↗ ]';if(item.ending)finish();if(!item.revisited&&!item.locked)chime(item.ending?[220,261.63,329.63,440]:[261.63,329.63,392]);updatePocket();save();}
function breathe(){if(!state.started||state.paused||state.ended||dialogue||time<breathUntil)return;keys.clear();breathUntil=time+7;$('breathing').hidden=false;$('breathing').querySelector('span').textContent='breathe in';tell('JUST THIS MOMENT','You do not have to solve your whole life tonight.',8);}
function openHelp(){wasPaused=state.paused;pause(true);$('pause-screen').hidden=true;$('help-dialog').showModal();}
$('help').onclick=openHelp;$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>pause(wasPaused));$('resume').onclick=()=>pause(false);$('begin').onclick=begin;$('continue').onclick=advance;$('interact').onclick=interact;
$('restart').onclick=()=>{if(!confirm('Begin the walk again? Your four little lights will be cleared.'))return;state=createState();dialogue=false;breathUntil=0;$('breathing').hidden=true;$('help-dialog').close();$('intro').hidden=false;$('intro').classList.remove('leaving');$('crosshair').hidden=true;$('continue').hidden=true;$('mobile-controls').hidden=true;$('walk-controls').hidden=false;$('district').innerHTML='雨のあと <span class="translation">AFTER THE RAIN</span>';$('clock').textContent='02:17 AM';tell('','');wasPaused=false;pause(false);$('pause-screen').hidden=true;updatePocket();save();};
$('quality').onclick=()=>{if(ascii)$('quality').innerHTML=`DENSITY <span>${ascii.toggle()}</span>`;};
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select'))return;
  const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' ','escape'].includes(k))e.preventDefault();
  if(k==='escape'){if(state.started)pause(!state.paused);return;}
  if(e.target.matches('button')&&['enter',' '].includes(k))return;
  if(k==='enter'&&!state.started){begin();return;}
  if(k==='e'&&!e.repeat){interact();return;}if(k===' '&&!e.repeat){breathe();return;}
  if(!dialogue&&!state.paused)keys.add(k);
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());save();});window.addEventListener('blur',()=>{keys.clear();save();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started&&!state.ended)pause(true);});
const canvas=$('world');
canvas.addEventListener('pointerdown',e=>{if(!state.started||state.ended||state.paused||dialogue)return;canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,moved:false,pointerId:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
  if(!state.started||state.ended||state.paused||dialogue)return;
  if(document.pointerLockElement===canvas){state.player.yaw-=e.movementX*.0025;state.player.pitch=Math.max(-.65,Math.min(.65,state.player.pitch-e.movementY*.002));}
  else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;state.player.yaw-=dx*.005;state.player.pitch=Math.max(-.65,Math.min(.65,state.player.pitch-dy*.003));drag.x=e.clientX;drag.y=e.clientY;}
});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&e.pointerType==='mouse'&&state.started&&!state.ended&&!state.paused&&!dialogue){try{const result=canvas.requestPointerLock?.();result?.catch?.(()=>{});}catch{}}drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const button of document.querySelectorAll('[data-move]')){
  const release=()=>{keys.delete(button.dataset.move);button.classList.remove('active');};
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(!dialogue&&!state.paused){keys.add(button.dataset.move);button.classList.add('active');}});button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
function createAudio(){
  const ctx=new(window.AudioContext||window.webkitAudioContext)(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.025;data[i]=brown*3;}
  const rain=ctx.createBufferSource();rain.buffer=buffer;rain.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1600;const gain=ctx.createGain();gain.gain.value=.4;rain.connect(filter).connect(gain).connect(master);rain.start();
  for(const hz of [65.41,130.81,196]){const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=hz;g.gain.value=.018;osc.connect(g).connect(master);osc.start();}return {ctx,master};
}
$('sound').onclick=async()=>{try{if(!audio)audio=createAudio();await audio.ctx.resume();muted=!muted;audio.master.gain.setTargetAtTime(muted||state.paused?0:.28,audio.ctx.currentTime,.6);$('sound').setAttribute('aria-pressed',String(!muted));$('sound').innerHTML=`SOUND <span>${muted?'OFF':'ON'}</span>`;}catch{tell('A QUIETER NIGHT','Audio could not start in this browser. You can still walk the street in silence.',6);}};
function chime(notes){if(!audio||muted)return;notes.forEach((hz,i)=>{const o=audio.ctx.createOscillator(),g=audio.ctx.createGain(),t=audio.ctx.currentTime+i*.24;o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.06);g.gain.exponentialRampToValueAtTime(.001,t+2.8);o.connect(g).connect(audio.master);o.start(t);o.stop(t+3);});}
function frame(ms){
  const dt=Math.min((ms-last)/1000,.1);last=ms;if(!state.paused)time+=dt;
  const p=state.player;
  if(state.started&&!state.paused&&!state.ended&&!dialogue){
    if(keys.has('arrowleft'))p.yaw+=dt*1.4;if(keys.has('arrowright'))p.yaw-=dt*1.4;
    const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')),strafe=Number(keys.has('d'))-Number(keys.has('a'));
    state.moving=walk(state,forward,strafe,dt);
  }else state.moving=false;
  const item=state.started&&!state.paused&&!state.ended&&!dialogue?nearby(state):null;$('interact-prompt').hidden=!item;if(item)$('interact-label').textContent=state.found.has(item.id)?'Stay a moment':item.action;
  if(breathUntil>time){$('breathing').querySelector('span').textContent=breathUntil-time>3.5?'breathe in':'breathe out';}else $('breathing').hidden=true;
  if(storyUntil&&time>storyUntil&&!dialogue){tell('','');storyUntil=0;}
  saveTime+=dt;if(saveTime>1){save();saveTime=0;}
  renderTime+=dt;if(renderTime>=1/30){ascii.draw(state,time,renderTime);renderTime=0;}
  requestAnimationFrame(frame);
}
async function boot(){try{
  const [{Street},{Ascii}]=await Promise.all([import('./street.js'),import('./ascii.js')]);street=new Street();ascii=new Ascii(canvas,street);ascii.draw(state,0,0);$('loading').hidden=true;$('begin').disabled=false;$('begin').textContent='[ begin walking → ]';
  if(state.started){$('intro').hidden=true;$('crosshair').hidden=state.ended;$('mobile-controls').hidden=state.ended;tell('THE STREET KEPT YOUR PLACE','The rain has not quite stopped. Your little lights are still here.',7);}if(state.ended){finish();tell('YOU MADE IT TO MORNING','The street is still here. And so are you.');}updatePocket();
  $('game').dataset.ready='true';requestAnimationFrame(frame);
}catch(error){$('loading').hidden=true;$('fatal-error').hidden=false;$('fatal-message').textContent='This street needs WebGL to render its ASCII world. Try enabling hardware acceleration or opening it in a current browser.';console.error(error);}}
boot();
