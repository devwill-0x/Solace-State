export const PEOPLE=[
 {id:'nagi',name:'Nagi',role:'THE NIGHT CLERK',x:-1.85,z:-7,style:0,lines:[
 {speaker:'Nagi',text:"The machine still thinks it's winter. Every coffee comes out warm."},
 {speaker:'You',text:"Maybe it knows something we don't."},
 {speaker:'Nagi',text:"Then I'll leave it like that."}]},
 {id:'ren',name:'Ren',role:'WAITING FOR THE FIRST TRAIN',x:1.85,z:-36,style:1,lines:[
 {speaker:'Ren',text:"I missed the last train. Best thing that happened all day."},
 {speaker:'You',text:"How's that?"},
 {speaker:'Ren',text:"Listen. You can hear the rain all the way down the street."}]},
 {id:'aya',name:'Aya',role:'THE EARLY RISER',x:-1.9,z:-67,style:2,lines:[
 {speaker:'Aya',text:"I come here before the city remembers to be loud."},
 {speaker:'You',text:"Does it always look like this?"},
 {speaker:'Aya',text:"Only when somebody stops long enough to see it."}]}
];
export const START={x:.1,z:7,yaw:0,pitch:0};
export function canWalk(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||z>10||z< -87.3||Math.abs(x)>3.22)return false;
 if(x>2.65&&z> -8.8&&z< -6.3)return false;
 if(x< -2.85&&z> -34&&z< -32)return false;
 return !PEOPLE.some(p=>Math.hypot(p.x-x,p.z-z)<.46);
}
export function createState(saved){
 const p=saved?.player,valid=p&&canWalk(p.x,p.z)&&Number.isFinite(p.yaw)&&Number.isFinite(p.pitch);
 return {player:valid?{x:p.x,z:p.z,yaw:p.yaw,pitch:Math.max(-1.2,Math.min(.7,p.pitch))}:{...START},
 started:!!saved?.started,paused:false,distance:0,moving:false,conversation:null,
 met:new Set(Array.isArray(saved?.met)?saved.met.filter(id=>PEOPLE.some(p=>p.id===id)):[]),
 conversations:saved?.conversations!==false,elapsed:Number.isFinite(saved?.elapsed)?Math.max(0,Math.min(1800,saved.elapsed)):0};
}
export function walk(s,f,r,dt){
 if(!s.started||s.paused||s.conversation||!Number.isFinite(dt)||dt<=0)return false;
 const p=s.player,l=Math.hypot(f,r)||1,v=2.45*Math.min(dt,.1);
 const dx=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r)/l*v,dz=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r)/l*v;
 let moved=false;if(canWalk(p.x+dx,p.z)){p.x+=dx;moved||=dx!==0;}if(canWalk(p.x,p.z+dz)){p.z+=dz;moved||=dz!==0;}
 if(moved)s.distance+=Math.hypot(dx,dz);return moved;
}
export function candidate(s){
 if(!s.started||s.paused||s.conversation||!s.conversations)return null;
 return PEOPLE.find(n=>{if(s.met.has(n.id))return false;const dx=n.x-s.player.x,dz=n.z-s.player.z,d=Math.hypot(dx,dz);return d<2.65&&(-Math.sin(s.player.yaw)*dx-Math.cos(s.player.yaw)*dz)/d>.38;})||null;
}
export function startConversation(s,id){
 if(!s.started||s.conversation||s.paused||!s.conversations||!PEOPLE.some(p=>p.id===id)||s.met.has(id))return false;
 s.met.add(id);s.conversation={id,line:0,age:0};return true;
}
export function nextLine(s){if(!s.conversation)return;const p=PEOPLE.find(p=>p.id===s.conversation.id);if(++s.conversation.line>=p.lines.length)s.conversation=null;else s.conversation.age=0;}
export function serialize(s){return {player:{...s.player},started:s.started,met:[...s.met],conversations:s.conversations,elapsed:s.elapsed};}
