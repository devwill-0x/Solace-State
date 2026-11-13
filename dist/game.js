export const START={x:.1,z:7,yaw:0,pitch:0};
export function canWalk(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||z>10||z< -87.3||Math.abs(x)>3.22)return false;
 if(x>2.65&&z> -8.8&&z< -6.3)return false;
 if(x< -2.85&&z> -34&&z< -32)return false;
 return true;
}
export function createState(saved){
 const p=saved?.player,valid=p&&(saved?.realm==='meadow'?(Math.abs(p.x)<28&&p.z>-140&&p.z<-82):canWalk(p.x,p.z))&&Number.isFinite(p.yaw)&&Number.isFinite(p.pitch);
 return {player:valid?{x:p.x,z:p.z,yaw:p.yaw,pitch:Math.max(-1.2,Math.min(.7,p.pitch))}:{...START},
 realm:saved?.realm==='meadow'?'meadow':'street',started:!!saved?.started,paused:false,distance:0,moving:false,
 elapsed:Number.isFinite(saved?.elapsed)?Math.max(0,Math.min(1800,saved.elapsed)):0};
}
export function walk(s,f,r,dt){
 if(!s.started||s.paused||!Number.isFinite(dt)||dt<=0)return false;
 const p=s.player,l=Math.max(1,Math.hypot(f,r)),v=2.45*Math.min(dt,.1);
 const dx=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r)/l*v,dz=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r)/l*v;
 const allowed=(x,z)=>s.realm==='meadow'?Math.abs(x)<28&&z>-140&&z<-82:(canWalk(x,z)||(x<3.4&&x>3&&Math.abs(z+2)<1.02));
 let moved=false;if(allowed(p.x+dx,p.z)){p.x+=dx;moved||=dx!==0;}if(allowed(p.x,p.z+dz)){p.z+=dz;moved||=dz!==0;}
 if(s.realm!=='meadow'&&p.x>=3.12&&p.x-dx<3.12&&Math.abs(p.z+2)<1.02){const x=p.x;p.x=p.z+2;p.z=-85-(x-3.12);p.yaw+=Math.PI/2;s.realm='meadow';}
 else if(s.realm==='meadow'&&p.z>=-85&&p.z-dz<-85&&Math.abs(p.x)<1.02){const x=p.x;p.x=3.12-(p.z+85);p.z=x-2;p.yaw-=Math.PI/2;s.realm='street';}

 if(moved)s.distance+=Math.hypot(dx,dz);return moved;
}
export function serialize(s){return {player:{...s.player},started:s.started,elapsed:s.elapsed,realm:s.realm};}
