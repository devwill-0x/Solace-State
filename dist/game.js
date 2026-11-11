export const WIDTH = 180, HEIGHT = 90;
export const comforts = [
  { id:'flower', x:60, y:67, icon:'*', title:'A stubborn bloom', hint:'beside the winding path', action:'Notice the flower', label:'A STUBBORN LITTLE THING', text:'A flower, growing through a crack in the stone. No one told it this was a difficult place to bloom. You decide to take that personally. In a good way.', after:'It is still growing. So are you.' },
  { id:'cat', x:38, y:49, icon:'&', title:'An unlikely friend', hint:'under the old pine', action:'Say hello', label:'SOMEONE IS GLAD YOU CAME', text:'The cat looks at you as if you are late for an appointment you never made. Then it leans into your hand. For a moment, you are exactly where you are supposed to be.', after:'A small purr follows you down the path.' },
  { id:'lantern', x:87, y:51, icon:'i', title:'A borrowed light', hint:'where the path turns', action:'Light the lantern', label:'ENOUGH FOR THE NEXT STEP', text:'There is a little oil left in the lantern. You strike a match. It does not light the whole valley. Just the next few steps. That turns out to be enough.', after:'The path feels a little less lonely now.' },
  { id:'window', x:143, y:49, icon:'#', title:'A distant song', hint:'a window across the stream', action:'Listen for a while', label:'LIFE, GOING ON', text:'From an open window: a radio, a kettle, someone singing a little out of tune. Ordinary life. Somehow, tonight, it sounds like a promise.', after:'You carry a little of the melody with you.' },
  { id:'boat', x:129, y:74, icon:'v', title:'A lighter heart', hint:'at the edge of the stream', action:'Let the paper boat go', label:'SOME THINGS CAN BE SET DOWN', text:'You fold a scrap of paper into a boat. You do not write your worries on it. You know what they are. The stream takes it gently. You let it.', after:'Some things are yours to carry. Some can float away.' }
];
export const bench = {id:'bench', x:158, y:68, icon:'=', title:'A place to rest', action:'Sit until morning'};
export function createState(saved){
  const found = new Set(Array.isArray(saved?.found) ? saved.found.filter(id=>comforts.some(c=>c.id===id)) : []);
  const player = saved?.player && isWalkable(saved.player.x,saved.player.y) ? {x:saved.player.x,y:saved.player.y} : {x:43,y:73};
  return {player, found, started:!!saved?.started, ended:!!saved?.ended && found.size===5, paused:false, target:null, path:[], steps:0};
}
export function isWalkable(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<12||x>169||y<43||y>80)return false;
  // The stream can only be crossed at the footbridge.
  const river=110+Math.sin(y*.12)*4;
  if(Math.abs(x-river)<6 && (y<59||y>65))return false;
  // Keep the cottage solid, but its lit window within reach.
  if(x>137&&x<156&&y>40&&y<47)return false;
  return true;
}
export function move(state,dx,dy){
  if(!state.started||state.ended||state.paused)return false;
  const length=Math.hypot(dx,dy)||1, x=state.player.x+dx/length, y=state.player.y+dy/length;
  let moved=false;
  if(isWalkable(x,state.player.y)){state.player.x=x;moved=true;}
  if(isWalkable(state.player.x,y)){state.player.y=y;moved=true;}
  if(moved)state.steps++;
  return moved;
}
export function nearest(state){
  const options=[...comforts,bench];
  return options.filter(c=>Math.hypot((c.x-state.player.x)*.7,c.y-state.player.y)<6).sort((a,b)=>Math.hypot(a.x-state.player.x,a.y-state.player.y)-Math.hypot(b.x-state.player.x,b.y-state.player.y))[0]||null;
}
export function interact(state){
  if(!state.started||state.paused||state.ended)return null;
  const item=nearest(state);
  if(!item)return null;
  if(item.id==='bench'){
    if(state.found.size<comforts.length)return {...item,label:'THERE IS TIME',text:'A bench overlooking the water. A good place to return to. There are still little lights out there, waiting to be found.',locked:true};
    state.ended=true;state.path=[];return {...item,label:'CHAPTER 02 / THE WORLD, AGAIN',text:'Nothing is magically fixed. But the sky is getting lighter. You have a song, a small purr, a flower, a little light, and room to breathe. For this morning, that is enough.',ending:true};
  }
  if(state.found.has(item.id))return {...item,text:item.after,revisited:true};
  state.found.add(item.id);return item;
}
export function findPath(from,to){
  // A small breadth-first search makes tap-to-walk find the bridge naturally.
  const sx=Math.round(from.x),sy=Math.round(from.y),tx=Math.round(to.x),ty=Math.round(to.y);
  if(!isWalkable(tx,ty))return [];
  const key=(x,y)=>y*WIDTH+x,start=key(sx,sy),end=key(tx,ty),queue=[[sx,sy]],previous=new Map([[start,null]]);
  for(let n=0;n<queue.length;n++){
    const [x,y]=queue[n],k=key(x,y);if(k===end)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,nk=key(nx,ny);
      if(!previous.has(nk)&&isWalkable(nx,ny)){previous.set(nk,k);queue.push([nx,ny]);}
    }
  }
  if(!previous.has(end))return [];
  const path=[];for(let k=end;k!==start; k=previous.get(k))path.push({x:k%WIDTH,y:Math.floor(k/WIDTH)});
  return path.reverse();
}
export function serialize(state){return {player:state.player,found:[...state.found],started:state.started,ended:state.ended};}
