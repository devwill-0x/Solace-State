import {Opening} from './opening.js';
import {NightMusic} from './night-music.js';
import {createStory} from './story-ui.js';
import {createState,walk,serialize,startRide,endRide,updateRide} from './game.js';
import {ARENAS,TETHERS,TETHER_GOAL,createRuntimeCombat,performSlash,updateCombat,toggleLightMode} from './combat.js';

const $=id=>document.getElementById(id),canvas=$('world'),menu=$('menu'),storageKey='solace-dream-v3',keys=new Set(),touches=new Map();
let saved;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
let state=createState(saved),ascii,time=0,last=0,renderAge=0,saveAge=0,drag=null,twoTap=null,audio=null,muted=true,sceneDirty=true;
state.runtime=createRuntimeCombat();
const touchMove={forward:0,right:0};
const music=new NightMusic();let musicDeclined=false,titleActive=true;
try{musicDeclined=localStorage.getItem('solace-music')==='off';}catch{}
window.addEventListener('resize',()=>sceneDirty=true);
state.paused=true;

function syncMusicButton(){$('title-sound').textContent=music.enabled?'Music / On':musicDeclined?'Music / Off':'Music / Enable';$('title-sound').setAttribute('aria-pressed',String(music.enabled));$('music-toggle').textContent=music.enabled?'Music On':'Music Off';$('music-toggle').setAttribute('aria-pressed',String(music.enabled));}
function rememberMusic(){musicDeclined=!music.enabled;try{localStorage.setItem('solace-music',musicDeclined?'off':'on');}catch{}syncMusicButton();}
const opening=new Opening({canvas:$('opening-art'),stage:$('title-screen'),shock:()=>{music.shock();$('opening-caption').textContent='A crow touches the wire. A spark. A crow with devil horns appears above the name devwill.';},done:()=>{titleActive=false;$('title-screen').classList.remove('playing');music.setMode('game');setMenu(false);}});
async function enterNight(){if(!ascii||opening.mode==='film')return;clearInput();state.paused=true;if(menu.open)menu.close();soundLevel();if(!musicDeclined)await music.start();music.setMode('title');music.beginBuild();syncMusicButton();$('title-screen').classList.add('playing');$('skip-opening').hidden=false;$('opening-caption').textContent='Crows wait on a power line. One takes flight.';opening.play();$('skip-opening').focus({preventScroll:true});}
$('enter-night').onclick=enterNight;
$('skip-opening').onclick=()=>opening.finish();
$('title-sound').onclick=async()=>{await music.toggle();rememberMusic();};
$('replay-opening').onclick=()=>{titleActive=true;if(menu.open)menu.close();$('title-screen').hidden=false;enterNight();};

function save(){try{localStorage.setItem(storageKey,JSON.stringify(serialize(state)));}catch{}}
function clearInput(){keys.clear();drag=null;touches.clear();twoTap=null;touchMove.forward=0;touchMove.right=0;}
function soundLevel(){if(audio)audio.master.gain.setTargetAtTime(muted||state.paused?0:.24,audio.ctx.currentTime,.3);}

function triggerSlash(){
  const res=performSlash(state,state.runtime,time);
  if(!res)return;
  ascii?.addSlashTear(state.runtime.swingDir,res.cutTethers.length>0||res.tierUnlocked);
  if(res.cutTethers.length)music.tetherCut();
  else music.slash(res.hitEnemies.length>0);
  if(res.switchJustUnlocked)music.switchLight(true);
  save();
}

function flipSwitch(){
  if(!state.quest?.lightUnlocked)return;
  const on=toggleLightMode(state);
  music.switchLight(on);
  ascii?.addSlashTear(1,true);
  if(state.runtime){
    state.runtime.banner=on?'Switch: Heavenly Light Revealed':'Switch: Dark ASCII Mesh Restored';
    state.runtime.bannerTimer=2.5;
  }
  save();
}

const story=createStory({
  getState:()=>state,
  save,
  pause:value=>{clearInput();sceneDirty=true;state.paused=value;music.setMode(value?'title':'game');if(value&&document.pointerLockElement)document.exitPointerLock();if(!value){if(!state.started){state.paused=true;menu.showModal();}else canvas.focus({preventScroll:true});}soundLevel();},
  onSwordClaimed:()=>{ascii?.addSlashTear(1,true);music.tetherCut();},
  onTetherCut:res=>{ascii?.addSlashTear(-1,true);music.tetherCut();if(res.switchJustUnlocked){state.runtime.banner='Mesh broken! Heavenly Switch unlocked [T]';state.runtime.bannerTimer=4.2;music.switchLight(true);}}
});

function setMenu(open){
  if(titleActive)return;
  if(story.isOpen())story.close();
  if(!open&&!ascii)return;
  clearInput();sceneDirty=true;state.paused=open;$('leave-ride').hidden=!state.ride;
  if(open){$('music-toggle').textContent=music.enabled?'Music On':'Music Off';if(document.pointerLockElement)document.exitPointerLock();$('begin').textContent=ascii?(state.started?(state.ride?'Continue the drive':'Keep walking'):'Walk into the night'):'Preparing the street...';$('restart').hidden=!state.started;if(!menu.open)menu.showModal();}
  else{state.started=true;if(menu.open)menu.close();canvas.focus({preventScroll:true});}
  music.setMode(open?'title':'game');soundLevel();save();
}
$('leave-ride').onclick=()=>{endRide(state);setMenu(false);};
$('begin').onclick=()=>setMenu(false);
menu.addEventListener('cancel',e=>{e.preventDefault();if(state.started)setMenu(false);});
$('restart').onclick=()=>{if(!confirm('Start over and clear your recovered memories?'))return;state=createState();state.runtime=createRuntimeCombat();setMenu(false);};
$('music-toggle').onclick=async()=>{await music.toggle();rememberMusic();$('music-toggle').textContent=music.enabled?'Music On':'Music Off';};
$('quality').onclick=()=>{sceneDirty=true;if(ascii)$('quality').innerHTML='Text detail <span>'+(ascii.toggle()==='HIGH'?'Fine':'Coarse')+'</span>';};
$('slash-btn').onclick=e=>{e.stopPropagation();triggerSlash();canvas.focus({preventScroll:true});};
$('veil-switch').onclick=e=>{e.stopPropagation();flipSwitch();canvas.focus({preventScroll:true});};

window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;
  const k=e.key.toLowerCase();
  if(titleActive){if(k==='escape'&&opening.mode==='film'){e.preventDefault();opening.finish();}return;}
  if(k==='escape'&&story.isOpen()){e.preventDefault();story.close();return;}
  if(story.isOpen())return;
  if(k==='e'&&!e.repeat&&!state.paused){e.preventDefault();story.open();return;}
  if((k==='f'||k===' ')&&!e.repeat&&!state.paused&&!menu.open){e.preventDefault();if(state.quest?.sword)triggerSlash();return;}
  if((k==='t'||k==='tab')&&!e.repeat&&!state.paused&&!menu.open){if(state.quest?.lightUnlocked){e.preventDefault();flipSwitch();}return;}
  if(k==='escape'){e.preventDefault();if(!e.repeat&&state.started)setMenu(!menu.open);return;}
  if(menu.open)return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(state.started&&!state.paused)keys.add(k);
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());save();});
window.addEventListener('blur',()=>{clearInput();save();});
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{music.level();if(document.hidden&&state.started&&!titleActive)setMenu(true);});
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
  }else{
    if(document.pointerLockElement===canvas&&e.button===0){triggerSlash();return;}
    drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
  }
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
  if(e.type==='pointerup'&&drag&&!drag.moved&&e.pointerType==='mouse'&&!state.paused){
    if(state.quest?.sword)triggerSlash();
    try{canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}
  }
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

function updateHud(){
  const hud=$('hud'),show=!titleActive&&state.started&&!state.ride;
  hud.hidden=!show;
  const banner=$('hud-banner');
  if(!show){banner.hidden=true;return;}
  const q=state.quest,rt=state.runtime,cuts=q.tethers.length;
  const arena=ARENAS.find(a=>a.id===state.realm);
  if(!q.sword){
    $('hud-objective').textContent='Find the Sword — Western Tea Courtyard';
  }else if(arena){
    const foes=rt.enemies.filter(e=>e.alive).length;
    const roomTethers=TETHERS.filter(t=>t.realm===arena.id&&!q.tethers.includes(t.id)).length;
    $('hud-objective').textContent=foes||roomTethers
      ? `${arena.name}  •  Foes: ${foes}  •  Tethers: ${roomTethers}`
      : arena.next
        ? `${arena.name} Cleared  •  North Progressive Portal Open`
        : `${arena.name} Purified  •  Tethers: ${cuts}/${TETHERS.length}`;
  }else if(!q.lightUnlocked){
    $('hud-objective').textContent=`Bad Tethers: ${cuts} / ${TETHER_GOAL}  •  Battle Portal: East Alley`;
  }else{
    $('hud-objective').textContent=`Tethers Cut: ${cuts} / ${TETHERS.length}  •  Portals Tier ${q.portalTier}/3`;
  }
  $('slash-btn').hidden=!q.sword;
  const sw=$('veil-switch');
  sw.hidden=!q.lightUnlocked;
  if(q.lightUnlocked){
    sw.classList.toggle('on',!!q.lightMode);
    sw.textContent=q.lightMode?'Switch: Heavenly Light [T]':'Switch: ASCII Mesh [T]';
  }
  const showHp=!!arena||rt.hp<rt.maxHp;
  $('hud-hp-wrap').hidden=!showHp;
  $('hud-hp-fill').style.width=`${Math.max(0,Math.min(100,(rt.hp/rt.maxHp)*100))}%`;
  banner.hidden=!(rt.bannerTimer>0);
  if(rt.bannerTimer>0)banner.textContent=rt.banner;
}

function frame(ms){
  const dt=Math.min((ms-last)/1000,.1);last=ms;
  if(!state.paused){time+=dt;if(state.started)state.elapsed+=dt;}
  if(state.started&&!state.paused){
    if(keys.has('arrowleft'))state.player.yaw+=dt*1.4;if(keys.has('arrowright'))state.player.yaw-=dt*1.4;
    if(keys.has('q')||keys.has('pagedown'))state.player.pitch=Math.max(-1.2,state.player.pitch-dt*1.1);
    if(keys.has('z')||keys.has('pageup'))state.player.pitch=Math.min(.7,state.player.pitch+dt*1.1);
    state.sprinting=keys.has('shift')||Math.abs(touchMove.forward)>.98;
    state.moving=walk(state,Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))+touchMove.forward,Number(keys.has('d'))-Number(keys.has('a'))+touchMove.right,dt);
    updateRide(state,dt);if(startRide(state))clearInput();
  }else state.moving=false;
  updateCombat(state,state.runtime,dt,time);
  story.update();updateHud();if(titleActive)$('interact').hidden=true;
  saveAge+=dt;if(saveAge>5){save();saveAge=0;}
  renderAge=titleActive?0:renderAge+dt;if(!titleActive&&renderAge>=1/30){if(!state.paused||sceneDirty){ascii.draw(state,time,state.paused?0:renderAge);sceneDirty=false;}renderAge=0;}
  requestAnimationFrame(frame);
}

async function boot(){
  try{
    const [{Street},{Ascii}]=await Promise.all([import('./street.js'),import('./ascii.js')]);
    const street=new Street();ascii=new Ascii(canvas,street);ascii.draw(state,0,0);
    syncMusicButton();$('loading').hidden=true;$('begin').disabled=false;$('enter-night').disabled=false;
    $('enter-night').textContent=state.started?'Return to the night':'Enter the night';
    $('title-save').textContent=state.started?'YOUR WALK IS WAITING':'A MEMORY OF MORNING';
    $('game').dataset.ready='true';requestAnimationFrame(frame);
  }catch(error){
    $('loading').hidden=true;if(menu.open)menu.close();$('title-screen').hidden=true;$('fatal-error').hidden=false;
    $('fatal-message').textContent='This street needs WebGL. Enable hardware acceleration or try a current browser.';console.error(error);
  }
}
boot();
