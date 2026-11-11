import {comforts,bench,createState,move,nearest,interact,findPath,serialize} from './game.js';
import {Scene} from './scene.js';
const $=id=>document.getElementById(id),storageKey='solace-state-v1';
let saved;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
let state=createState(saved),scene=new Scene($('world')),last=0,time=0,stepTimer=0,saveTimer=0,breathUntil=0,dialogue=false,pendingItem=null,audio=null,muted=true,wasPaused=false;
const keys=new Set();
function save(){try{localStorage.setItem(storageKey,JSON.stringify(serialize(state)));}catch{}}
function updateJournal(){
  $('memories').replaceChildren(...comforts.map(item=>{
    const li=document.createElement('li'),found=state.found.has(item.id);li.className=found?'found':'';
    const icon=document.createElement('span');icon.className='memory-icon';icon.textContent=item.icon;
    const copy=document.createElement('span');copy.className='memory-copy';
    const title=document.createElement('strong');title.textContent=item.title;
    const hint=document.createElement('small');hint.textContent=found?'a little light, kept':item.hint;
    const check=document.createElement('span');check.className='memory-check';check.textContent=found?'✓':'·';
    copy.append(title,hint);li.append(icon,copy,check);return li;
  }));
  $('count').textContent=String(state.found.size).padStart(2,'0')+' / 05';$('progress').style.width=state.found.size/5*100+'%';
  if(state.found.size===5)$('pocket-note').textContent='You found five little reasons.\nMorning is waiting by the bench.';
}
function story(label,text,symbol='*',action=null){
  $('story-label').textContent=label;$('story-text').textContent=text;$('story-symbol').textContent=symbol;
  $('story-action').hidden=!action;
  if(action){$('story-action').textContent=action.text+'  →';$('story-action').onclick=action.fn;}
}
function clearDialogue(){dialogue=false;pendingItem=null;$('story-action').hidden=true;}
function begin(){state.started=true;$('intro').classList.add('leaving');setTimeout(()=>$('intro').hidden=true,850);story('THE PATH IS YOURS','A tiny bloom catches your eye beside the path. Walk toward a golden spark, then press E. Or simply click it.');$('world').focus({preventScroll:true});save();}
function finish(){
  document.body.classList.add('finished');$('chapter').textContent='CHAPTER 02 / THE WORLD, AGAIN';$('location').textContent='A little lighter.';$('weather-icon').textContent='☀';$('weather-label').replaceChildren(document.createTextNode('the rain is passing'),Object.assign(document.createElement('span'),{textContent:'the first light of morning'}));$('scene-caption').textContent='you made it to morning. that is something.';$('pocket-note').textContent='The world is still here.\nAnd so are you.';
}
function doInteract(){
  if(dialogue){clearDialogue();return;}
  const result=interact(state);if(!result)return;
  state.path=[];keys.clear();dialogue=true;updateJournal();save();
  if(result.ending){finish();story(result.label,result.text,'☼',{text:'Stay a little longer',fn:()=>{clearDialogue();story('YOU MADE IT TO MORNING','You sit. The cat settles beside you. Somewhere, a kettle begins to sing. There is nothing else you need to do right now.','☼');}});chime([261.63,329.63,392,523.25]);}
  else{story(result.label,result.text,result.icon,{text:result.locked?'Keep looking':'Keep wandering',fn:()=>{
    clearDialogue();
    if(state.found.size===5)story('ONE LAST QUIET MOMENT','Your pocket is full of little lights. There is a bench on the far side of the stream. Find it, sit down, and let morning come.','=');
    else story('A LITTLE LIGHT, KEPT',result.after||'The night is still yours to explore.',result.icon);
    $('world').focus({preventScroll:true});
  }});if(!result.revisited&&!result.locked)chime([293.66,369.99,440]);}
}
function breathe(){
  if(!state.started||state.ended||state.paused||time<breathUntil)return;
  state.path=[];keys.clear();clearDialogue();breathUntil=time+7;scene.breath=breathUntil;
  story('JUST THIS BREATH','Breathe in. Let your shoulders fall. Breathe out. You do not have to solve your whole life tonight.','~');chime([196,246.94]);
}
function setPause(value){if(!state.started)return;state.paused=value;keys.clear();$('pause-indicator').hidden=!value;$('pause').textContent=value?'▷':'Ⅱ';$('pause').setAttribute('aria-label',value?'Resume game':'Pause game');if(audio)audio.master.gain.setTargetAtTime(muted||value?0:.2,audio.ctx.currentTime,.4);}
function openHelp(){wasPaused=state.paused;setPause(true);$('help-dialog').showModal();}
$('begin').onclick=begin;$('help').onclick=openHelp;$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>setPause(wasPaused));
$('pause').onclick=()=>setPause(!state.paused);$('pause-indicator').onclick=()=>setPause(false);
$('restart').onclick=()=>{wasPaused=state.paused;setPause(true);$('reset-dialog').showModal();};
$('cancel-reset').onclick=()=>$('reset-dialog').close();$('reset-dialog').addEventListener('close',()=>setPause(wasPaused));
$('confirm-reset').onclick=()=>{wasPaused=false;$('reset-dialog').close();state=createState();document.body.classList.remove('finished');$('chapter').textContent='CHAPTER 01 / THE LONG NIGHT';$('location').textContent='The quiet between.';$('weather-icon').textContent='⋰';$('weather-label').innerHTML='a gentle rain<span>somewhere after midnight</span>';$('scene-caption').textContent='even the longest night has little lights.';$('pocket-note').innerHTML="You don't have to feel hopeful<br>to follow a little light.";$('intro').hidden=false;$('intro').classList.remove('leaving');clearDialogue();updateJournal();story('A MOMENT TO YOURSELF',"The world is asleep. You aren't. That's okay. There's a path, if you'd like to take it.");save();};
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('button,a,input,select,textarea')||document.querySelector('dialog[open]'))return;
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','e','enter','escape'].includes(key))e.preventDefault();
  if(key==='escape'){setPause(!state.paused);return;}
  if(key==='enter'&&!state.started){begin();return;}
  if(e.repeat&&(key==='e'||key==='enter'||key===' '))return;
  if(key==='e'||key==='enter'){doInteract();return;}if(key===' '){breathe();return;}
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){keys.add(key);state.path=[];pendingItem=null;if(dialogue)clearDialogue();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();save();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started)setPause(true);});
$('world').addEventListener('pointerdown',e=>{
  if(!state.started||state.ended||state.paused)return;
  $('world').focus({preventScroll:true});clearDialogue();keys.clear();const point=scene.point(e.clientX,e.clientY);
  const item=[...comforts,bench].find(c=>Math.hypot((c.x-point.x)*.7,c.y-point.y)<7);
  if(item){state.target={x:item.x,y:item.y+2};state.path=findPath(state.player,state.target);pendingItem=item;
    if(nearest(state)?.id===item.id){pendingItem=null;doInteract();}
  }else{state.target={x:Math.round(point.x),y:Math.round(point.y)};state.path=findPath(state.player,state.target);pendingItem=null;}
  if(!state.path.length&&!item&&point.y<43)story('A LITTLE CLOSER','The mountains can wait. Follow the path in the lower part of the valley, or click a golden spark.');
});
// A soft, original ambient bed. Audio begins only after an explicit click.
function initAudio(){
  const ctx=new(window.AudioContext||window.webkitAudioContext)(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
  for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.02;data[i]=brown*3;}
  const rain=ctx.createBufferSource();rain.buffer=buffer;rain.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;const rg=ctx.createGain();rg.gain.value=.23;rain.connect(filter).connect(rg).connect(master);rain.start();
  for(const frequency of [130.81,196,261.63]){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.value=.045;osc.connect(gain).connect(master);osc.start();}
  return {ctx,master};
}
$('sound').onclick=async()=>{try{if(!audio)audio=initAudio();await audio.ctx.resume();muted=!muted;audio.master.gain.setTargetAtTime(muted||state.paused?0:.2,audio.ctx.currentTime,.7);$('sound').setAttribute('aria-pressed',String(!muted));$('sound').innerHTML=`<span id="sound-icon">♪</span> SOUND ${muted?'OFF':'ON'}`;}catch{story('THE SOUND OF QUIET','Your browser could not start audio. The valley is just as welcoming in silence.');}};
function chime(notes){if(!audio||muted)return;notes.forEach((hz,i)=>{const o=audio.ctx.createOscillator(),g=audio.ctx.createGain(),t=audio.ctx.currentTime+i*.2;o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.04);g.gain.exponentialRampToValueAtTime(.001,t+2.5);o.connect(g).connect(audio.master);o.start(t);o.stop(t+2.6);});}
function frame(ms){
  const dt=Math.min((ms-last)/1000,.05);last=ms;if(!state.paused)time+=dt;
  state.walking=false;
  if(state.started&&!state.paused&&!state.ended&&!dialogue){
    stepTimer+=dt;
    const dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
    while(stepTimer>.045){stepTimer-=.045;
      if(dx||dy)state.walking=move(state,dx,dy);
      else if(state.path.length){const next=state.path.shift();state.player={...next};state.walking=true;}
    }
    if(pendingItem&&!state.path.length){const expected=pendingItem;pendingItem=null;if(nearest(state)?.id===expected.id)doInteract();}
  }else stepTimer=0;
  const item=state.started&&!dialogue&&!state.ended&&!state.paused?nearest(state):null;
  $('interaction-hint').hidden=!item;
  if(item){$('interaction-hint').querySelector('span').textContent=state.found.has(item.id)?'Stay a moment':item.action;$('interaction-hint').style.left=Math.min(82,Math.max(18,state.player.x/180*100))+'%';$('interaction-hint').style.top=(state.player.y-5)/90*100+'%';}
  $('world-coordinate').textContent=String(Math.round(state.player.x)).padStart(3,'0')+' : '+String(Math.round(state.player.y)).padStart(3,'0');
  scene.draw(state,time,dt);saveTimer+=dt;if(saveTimer>2){save();saveTimer=0;}
  requestAnimationFrame(frame);
}
updateJournal();if(state.started){$('intro').hidden=true;story('WELCOME BACK',state.found.size===5?'Your pocket is full of little lights. The bench across the stream is waiting.':'The valley kept your place. Your little lights are still here. Take your time.');}if(state.ended){finish();story('YOU MADE IT TO MORNING','You sit. The cat settles beside you. Somewhere, a kettle begins to sing. There is nothing else you need to do right now.','☼');}
requestAnimationFrame(frame);
