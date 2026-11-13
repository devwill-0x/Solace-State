import {createState,walk,candidate,startConversation,nextLine,serialize,PEOPLE} from './game.js';
const $=id=>document.getElementById(id),storageKey='solace-dream-v3',keys=new Set();
let saved;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
let state=createState(saved),ascii,street,time=0,last=0,renderAge=0,saveAge=0,dwell=0,dwellId=null,drag=null,wasPaused=false,audio=null,muted=true;
function save(){try{localStorage.setItem(storageKey,JSON.stringify(serialize(state)));}catch{}}
function release(){if(document.pointerLockElement)document.exitPointerLock();}
function clearKeys(){keys.clear();document.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('active'));}
function sync(){
 const c=state.conversation;$('cutscene').hidden=!c;document.body.classList.toggle('in-conversation',!!c);
 $('mobile-controls').hidden=!state.started||!!c;$('crosshair').hidden=!state.started||!!c;
 $('encounters').checked=state.conversations;
 if(c){const p=PEOPLE.find(p=>p.id===c.id),line=p.lines[c.line];$('speaker').textContent=line.speaker;$('speaker-role').textContent=line.speaker==='You'?'A PASSING DREAM':p.role;$('line-text').textContent=line.text.slice(0,Math.floor(c.age*32));$('line-number').textContent=String(c.line+1).padStart(2,'0')+' / 03';}
}
function begin(){if(!ascii)return;state.started=true;$('intro').hidden=true;sync();$('world').focus({preventScroll:true});save();}
function setPause(value){if(!state.started)return;state.paused=value;clearKeys();if(value)release();$('pause-screen').hidden=!value;if(audio)audio.master.gain.setTargetAtTime(muted||value?0:.24,audio.ctx.currentTime,.3);}
function leaveConversation(){state.conversation=null;clearKeys();sync();save();$('world').focus({preventScroll:true});}
function advance(){if(!state.conversation)return;const c=state.conversation,p=PEOPLE.find(p=>p.id===c.id);if(c.age*32<p.lines[c.line].text.length){c.age=p.lines[c.line].text.length/32;sync();return;}nextLine(state);sync();save();}
$('begin').onclick=begin;$('next-line').onclick=advance;$('skip-scene').onclick=leaveConversation;$('resume').onclick=()=>setPause(false);
$('help').onclick=()=>{wasPaused=state.paused;setPause(true);$('pause-screen').hidden=true;$('help-dialog').showModal();};
$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();
$('help-dialog').addEventListener('close',()=>setPause(wasPaused));
$('encounters').onchange=e=>{state.conversations=e.target.checked;if(!state.conversations)leaveConversation();save();};
$('restart').onclick=()=>{if(!confirm('Start a fresh walk?'))return;state=createState();state.started=true;wasPaused=false;$('help-dialog').close();$('intro').hidden=true;dwell=0;dwellId=null;sync();save();};
$('quality').onclick=()=>{if(ascii)$('quality').innerHTML='DENSITY <span>'+ascii.toggle()+'</span>';};
function inspect(){if(state.started&&!state.paused&&!state.conversation){state.inspect=!state.inspect;$('body-view').setAttribute('aria-pressed',String(!!state.inspect));}}
$('body-view').onclick=inspect;
window.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select'))return;
 const k=e.key.toLowerCase();
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','b',' ','escape'].includes(k))e.preventDefault();
 if(k==='escape'){if(state.conversation)leaveConversation();else setPause(!state.paused);return;}
 if(e.target.matches('button')&&['enter',' '].includes(k))return;
 if(k==='enter'&&!state.started){begin();return;}
 if(state.conversation){if(['enter',' '].includes(k)&&!e.repeat)advance();return;}
 if(k==='b'&&!e.repeat){inspect();return;}
 if(state.started&&!state.paused)keys.add(k);
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());save();});
window.addEventListener('blur',()=>{clearKeys();save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started)setPause(true);});
const canvas=$('world');
canvas.addEventListener('pointerdown',e=>{if(!state.started||state.paused||state.conversation)return;canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
 if(!state.started||state.paused||state.conversation)return;
 if(document.pointerLockElement===canvas){state.player.yaw-=e.movementX*.0025;state.player.pitch=Math.max(-1.2,Math.min(.7,state.player.pitch-e.movementY*.002));}
 else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;state.player.yaw-=dx*.005;state.player.pitch=Math.max(-1.2,Math.min(.7,state.player.pitch-dy*.003));drag.x=e.clientX;drag.y=e.clientY;}
});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&e.pointerType==='mouse'&&!state.conversation&&!state.paused){try{canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}}drag=null;});
canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const button of document.querySelectorAll('[data-move]')){
 const stop=()=>{keys.delete(button.dataset.move);button.classList.remove('active');save();};
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(!state.paused&&!state.conversation){keys.add(button.dataset.move);button.classList.add('active');}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,stop);
}
function createAudio(){
 const ctx=new(window.AudioContext||window.webkitAudioContext)(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
 const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
 for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.025;data[i]=brown*3;}
 const rain=ctx.createBufferSource();rain.buffer=buffer;rain.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1600;
 const gain=ctx.createGain();gain.gain.value=.4;rain.connect(filter).connect(gain).connect(master);rain.start();
 for(const hz of [65.41,130.81,196]){const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=hz;g.gain.value=.018;osc.connect(g).connect(master);osc.start();}return {ctx,master};
}
$('sound').onclick=async()=>{try{if(!audio)audio=createAudio();await audio.ctx.resume();muted=!muted;audio.master.gain.setTargetAtTime(muted||state.paused?0:.24,audio.ctx.currentTime,.5);$('sound').setAttribute('aria-pressed',String(!muted));$('sound').innerHTML='SOUND <span>'+(muted?'OFF':'ON')+'</span>';}catch{$('sound').textContent='AUDIO UNAVAILABLE';}};
function frame(ms){
 const dt=Math.min((ms-last)/1000,.1);last=ms;
 if(!state.paused){time+=dt;if(state.started)state.elapsed+=dt;}
 if(state.started&&!state.paused&&!state.conversation){
  if(keys.has('arrowleft'))state.player.yaw+=dt*1.4;if(keys.has('arrowright'))state.player.yaw-=dt*1.4;
  state.moving=walk(state,Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')),Number(keys.has('d'))-Number(keys.has('a')),dt);
  const person=candidate(state);
  if(person){if(dwellId===person.id)dwell+=dt;else{dwellId=person.id;dwell=0;}if(dwell>.9){startConversation(state,person.id);clearKeys();release();dwell=0;sync();save();}}
  else{dwell=0;dwellId=null;}
 }else state.moving=false;
 if(state.conversation&&!state.paused){const c=state.conversation;c.age+=dt;const text=PEOPLE.find(p=>p.id===c.id).lines[c.line].text;if(c.age>Math.max(5,text.length/15+1.8))nextLine(state);sync();}
 saveAge+=dt;if(saveAge>1){save();saveAge=0;}
 renderAge+=dt;if(renderAge>=1/30){ascii.draw(state,time,state.paused?0:renderAge);renderAge=0;}
 if(state.elapsed>220)$('clock').textContent='BEFORE MORNING';
 requestAnimationFrame(frame);
}
async function boot(){try{
 const [{Street},{Ascii}]=await Promise.all([import('./street.js'),import('./ascii.js')]);street=new Street();ascii=new Ascii(canvas,street);ascii.draw(state,0,0);
 $('loading').hidden=true;$('begin').disabled=false;$('begin').textContent='Enter the dream  ↗';$('intro').hidden=state.started;sync();$('game').dataset.ready='true';requestAnimationFrame(frame);
}catch(error){$('loading').hidden=true;$('fatal-error').hidden=false;$('fatal-message').textContent='This dream needs WebGL. Enable hardware acceleration or try a current browser.';console.error(error);}}
boot();
