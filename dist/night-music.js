// Original generative score: suspended piano notes above a soft, unresolved drone.
export class NightMusic{
 constructor(){this.ctx=null;this.enabled=false;this.mode='title';this.next=0;this.step=0;this.timer=null;}
 async start(){try{if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=0;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2300;this.master.connect(filter).connect(this.ctx.destination);
 const delay=this.ctx.createDelay(2),feedback=this.ctx.createGain(),wet=this.ctx.createGain();delay.delayTime.value=.64;feedback.gain.value=.28;wet.gain.value=.19;this.master.connect(delay);delay.connect(feedback).connect(delay);delay.connect(wet).connect(filter);
 for(const hz of [55,82.41,110.12]){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=.055;o.connect(g).connect(this.master);o.start();}
 this.next=this.ctx.currentTime;this.timer=setInterval(()=>this.schedule(),120);}
 await this.ctx.resume();this.enabled=true;this.level();this.schedule();return true;}catch{return false;}}
 level(){if(this.ctx)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?(this.mode==='game'?.1:.29):0,this.ctx.currentTime,.65);}
 setMode(mode){this.mode=mode;this.level();}
 toggle(){if(this.enabled){this.enabled=false;this.level();return Promise.resolve(false);}return this.start();}
 note(hz,at,duration=2.8,volume=.12,type='sine'){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.035);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g).connect(this.master);o.start(at);o.stop(at+duration+.1);}
 schedule(){if(!this.ctx||!this.enabled||document.hidden)return;const now=this.ctx.currentTime;if(this.next<now-.5)this.next=now;const melody=[220,329.63,246.94,0,293.66,440,329.63,0,220,349.23,293.66,246.94,196,293.66,220,0];while(this.next<now+.5){const hz=melody[this.step++%melody.length];if(hz){this.note(hz,this.next);this.note(hz*2.003,this.next,1.5,.018);}this.next+=.82;}}
 shock(){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;this.note(880,at,.18,.13,'sawtooth');this.note(1174.66,at+.04,.2,.08,'triangle');this.note(110,at+.12,.65,.09);}
 slash(hit=false){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;this.note(hit?740:523.25,at,.16,.11,'triangle');if(hit)this.note(1046.5,at+.03,.24,.10,'sine');}
 tetherCut(){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;[523.25,659.25,783.99,1046.5].forEach((hz,i)=>this.note(hz,at+i*.045,.55,.12,'sine'));}
 switchLight(on){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;(on?[440,554.37,659.25,880]:[440,329.63,220]).forEach((hz,i)=>this.note(hz,at+i*.06,.7,.11,'triangle'));}
}
