// Original gothic rock score. All instruments are synthesized locally with Web Audio.
const EIGHTH=60/96/2;
const ROOTS=[55,43.6535,36.7081,41.2034]; // A minor / F / D minor / E: the last chord carries G sharp.
const RIFF=[0,0,12,0,7,0,12,7,0,0,10,0,7,12,7,0];
const clamp=v=>Math.max(0,Math.min(1,v));
export class NightMusic{
 constructor(){this.ctx=null;this.enabled=false;this.mode='title';this.next=0;this.step=0;this.timer=null;this.buildAt=null;this.releaseAt=null;this.startAt=0;}
 setup(ctx){
  this.ctx=ctx;this.master=ctx.createGain();this.master.gain.value=0;
  const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.008;compressor.release.value=.18;
  const lowpass=ctx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=9200;
  this.master.connect(compressor).connect(lowpass).connect(ctx.destination);
  this.reverb=ctx.createConvolver();const impulse=ctx.createBuffer(2,ctx.sampleRate*2.1,ctx.sampleRate);for(let channel=0;channel<2;channel++){const a=impulse.getChannelData(channel);let seed=813+channel;for(let i=0;i<a.length;i++){seed=(seed*16807)%2147483647;a[i]=(seed/1073741824-1)*Math.pow(1-i/a.length,3)*.32;}}this.reverb.buffer=impulse;
  const wet=ctx.createGain();wet.gain.value=.23;this.reverb.connect(wet).connect(this.master);
  this.noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const n=this.noise.getChannelData(0);let seed=1827;for(let i=0;i<n.length;i++){seed=(seed*16807)%2147483647;n[i]=seed/1073741824-1;}
  this.guitars=[];for(const pan of [-.72,.72]){const input=ctx.createGain(),drive=ctx.createWaveShaper(),high=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),stereo=ctx.createStereoPanner();const curve=new Float32Array(4096);for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=Math.tanh(x*5.5)*.56;}drive.curve=curve;drive.oversample='2x';high.type='highpass';high.frequency.value=100;low.type='lowpass';low.frequency.value=3600;stereo.pan.value=pan;input.connect(drive).connect(high).connect(low).connect(stereo).connect(this.master);this.guitars.push(input);}
  this.startAt=ctx.currentTime;this.next=ctx.currentTime+.04;
 }
 async start(){try{if(!this.ctx){this.setup(new(window.AudioContext||window.webkitAudioContext)());this.timer=setInterval(()=>this.schedule(),80);}await this.ctx.resume();this.enabled=true;this.level();this.schedule();return true;}catch{return false;}}
 level(){if(this.ctx)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?(this.mode==='game'?.19:.38):0,this.ctx.currentTime,.5);}
 setMode(mode){this.mode=mode;this.level();}
 beginBuild(){if(!this.ctx)return;this.buildAt=this.ctx.currentTime;this.releaseAt=null;}
 toggle(){if(this.enabled){this.enabled=false;this.level();return Promise.resolve(false);}return this.start();}
 envelope(at,duration,volume,attack=.01){const g=this.ctx.createGain();g.gain.setValueAtTime(.00001,at);g.gain.exponentialRampToValueAtTime(Math.max(.00002,volume),at+attack);g.gain.exponentialRampToValueAtTime(.00001,at+duration);return g;}
 tone(hz,at,duration,volume,type='sine',destination=this.master,detune=0,attack=.015){const o=this.ctx.createOscillator(),g=this.envelope(at,duration,volume,attack);o.type=type;o.frequency.value=hz;o.detune.value=detune;o.connect(g).connect(destination);o.start(at);o.stop(at+duration+.05);return g;}
 bell(hz,at,volume){this.tone(hz,at,2.7,volume,'sine',this.master,0,.03);this.tone(hz*2.003,at,1.5,volume*.14,'sine',this.reverb);}
 organ(root,at,power,major=false){for(const ratio of [2,2*Math.pow(2,(major?4:3)/12),3,4])this.tone(root*ratio,at,4.6,power*.05,'triangle',this.reverb,0,.4);}
 guitar(root,at,sustain,power){for(let side=0;side<2;side++){const out=this.guitars[side],offset=side*.006;for(const ratio of [1,1.4983,2])this.tone(root*ratio,at+offset,sustain,power*.115/(ratio===1?1:1.7),'sawtooth',out,side?5:-5,.006);}}
 kick(at,power){const o=this.ctx.createOscillator(),g=this.envelope(at,.38,power*.68,.004);o.frequency.setValueAtTime(128,at);o.frequency.exponentialRampToValueAtTime(43,at+.16);o.connect(g).connect(this.master);o.start(at);o.stop(at+.42);}
 hiss(at,duration,volume,highpass){const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),g=this.envelope(at,duration,volume,.003);src.buffer=this.noise;filter.type='highpass';filter.frequency.value=highpass;src.connect(filter).connect(g).connect(this.master);src.start(at);src.stop(at+duration+.02);}
 snare(at,power){this.hiss(at,.19,power*.27,1500);this.tone(180,at,.12,power*.2,'triangle');}
 cymbal(at,power,open=false){this.hiss(at,open?1.3:.055,power*(open?.13:.065),open?4800:6800);}
 intensity(at){if(this.buildAt!==null)return clamp((at-this.buildAt-.8)/4.4);return clamp((at-this.startAt-5)/19)*.82;}
 beat(at,step){const part=step%16,bar=Math.floor(step/16)%4,root=ROOTS[bar],power=this.intensity(at);
  // The opening keeps the first motifs exposed; rhythm joins as the crow takes flight.
  if(step%2===0){const melody=[4,7,12,7,3,7,10,7];const semitone=(bar===3?[4,7,12,7,4,7,11,7]:melody)[(step/2)%8];this.bell(root*4*Math.pow(2,semitone/12),at,.085-power*.02);}
  if(part===0){this.organ(root,at,.55+power,bar===1||bar===3);this.tone(root,at,4.7,.045,'sine',this.master,0,.25);}
  if(power>.12&&part%2===0)this.tone(root,at,.35,.13*power,'triangle');
  if(power>.22){const semitone=RIFF[part]+(bar===3&&RIFF[part]===10?1:0);this.guitar(root*2*Math.pow(2,semitone/12),at,part===14?.65:.18+.16*power,power);}
  if(power>.35){if([0,6,8,11].includes(part))this.kick(at,power);if([4,12].includes(part))this.snare(at,power);if(part%2===0||power>.8)this.cymbal(at,power);}
  if(power>.8&&bar===3&&part>=13)this.snare(at,power*.5);
  if(power>.7&&part===0)this.cymbal(at,power,true);
 }
 schedule(){if(!this.ctx||!this.enabled||document.hidden)return;const now=this.ctx.currentTime;if(this.next<now-.5)this.next=now+.02;while(this.next<now+.2){this.beat(this.next,this.step++);this.next+=EIGHTH;}}
 shock(){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;this.releaseAt=at;if(this.buildAt===null)this.buildAt=at-5.2;else this.buildAt=Math.min(this.buildAt,at-5.2);this.kick(at,.9);this.cymbal(at,.9,true);this.guitar(110,at,1.4,.85);this.tone(880,at,.16,.055,'sawtooth');}
 tetherCut(){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;[523.25,659.25,783.99,1046.5].forEach((hz,i)=>this.tone(hz,at+i*.045,.55,.1,'sine'));}
 // A soft bristle swish; each brush colour has its own pentatonic note.
 paint(color=0,bloom=false){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;this.hiss(at,.11,.05,2600);this.tone([392,440,523.25,587.33,659.25,783.99][color%6],at,.35,bloom?.07:.035,'sine');if(bloom)[523.25,659.25,783.99,1046.5,1318.5].forEach((hz,i)=>this.bell(hz,at+.12+i*.11,.05));}
 switchLight(on){if(!this.ctx||!this.enabled)return;const at=this.ctx.currentTime;(on?[440,554.37,659.25,880]:[440,329.63,220]).forEach((hz,i)=>this.tone(hz,at+i*.06,.7,.09,'triangle'));}
}
