import * as THREE from './vendor/three.module.js';
import {batchStatic} from './batch.js';
export function buildDream(w){const scene=new THREE.Scene();scene.background=new THREE.Color(w.sky);scene.fog=new THREE.Fog(w.sky,35,110);scene.add(new THREE.HemisphereLight(0xffecff,0x283049,2.4));const sun=new THREE.DirectionalLight(0xffdedd,2);sun.position.set(-10,20,-90);scene.add(sun);
 const mats=new Map(),material=(color,basic=false)=>{const key=color+':'+basic;if(!mats.has(key))mats.set(key,basic?new THREE.MeshBasicMaterial({color}):new THREE.MeshLambertMaterial({color}));return mats.get(key);};
 const add=(geo,color,x,y,z,basic=false)=>{const m=new THREE.Mesh(geo,material(color,basic));m.position.set(x,y,z);scene.add(m);return m;};
 const box=(x,y,z,a,b,c,color)=>add(new THREE.BoxGeometry(a,b,c),color,x,y,z);
 const ground=add(new THREE.CircleGeometry(30,48),w.ground,0,-.05,-100);ground.rotation.x=-Math.PI/2;
 for(let i=0;i<17;i++)box(0,.02,-85-i*1.65,1.6,.04,1.25,0xbfc3ce);
 const animated=[];
 if(w.id==='prism'){
  for(let i=0;i<38;i++){const a=i*2.4,rad=6+(i%5)*2.3;const m=add(new THREE.OctahedronGeometry(1,0),i%2?0x75dbe9:0x8e90e8,Math.cos(a)*rad,2+(i%4),-101+Math.sin(a)*rad);m.scale.set(.7,2+(i%4),.7);m.rotation.z=Math.sin(i)*.25;}
  for(let i=0;i<5;i++){const ring=add(new THREE.TorusGeometry(5+i*1.8,.055,5,48),0x9ff2ee,0,.08,-101,true);ring.rotation.x=-Math.PI/2;}
  const moon=add(new THREE.IcosahedronGeometry(3,2),0xb7eeff,-8,14,-117,true);animated.push(moon);
 }else if(w.id==='dunes'){
  for(let i=0;i<16;i++){const a=i*2.4;const m=add(new THREE.ConeGeometry(2.5,6,4),i%2?0xcda1ba:0xeac28e,Math.cos(a)*14,10+(i%3)*2,-103+Math.sin(a)*14);m.rotation.z=Math.PI;}
  for(let i=0;i<10;i++){const m=add(new THREE.SphereGeometry(4,14,8),0xbd886d,(i%2?1:-1)*(7+i%3*3),-.6,-92-i*3);m.scale.y=.35;}
  for(const x of [-6,6]){box(x,3,-107,.6,6,.6,0xead7b5);box(x,6,-107,4,.3,.8,0xffdbaf);}const orb=add(new THREE.TorusGeometry(4,.13,8,48),w.color,0,11,-119,true);animated.push(orb);
 }else if(w.id==='isles'){
  for(let i=0;i<14;i++){const a=i*2.4,x=Math.cos(a)*20,z=-105+Math.sin(a)*18,y=3+(i%5)*2;add(new THREE.CylinderGeometry(2.8,1.5,.6,7),0xabb2df,x,y,z);const underside=add(new THREE.ConeGeometry(2.8,4,7),0x585c94,x,y-2,z);underside.rotation.z=Math.PI;add(new THREE.OctahedronGeometry(.5),0xd3edff,x,y+1.8,z,true);}
  for(let i=0;i<4;i++){const ring=add(new THREE.TorusGeometry(4,.11,7,48),0xa5ccff,0,7+i*.4,-111,true);ring.rotation.x=i*.6;animated.push(ring);}
 }else if(w.id==='mycelium'){
  for(let i=0;i<35;i++){const a=i*2.4,rad=5+(i%6)*2,x=Math.cos(a)*rad,z=-101+Math.sin(a)*rad,h=2+(i%4);add(new THREE.CylinderGeometry(.16,.35,h,8),0xa4d8ca,x,h/2,z);const cap=add(new THREE.SphereGeometry(1.8,14,8,0,Math.PI*2,0,Math.PI/2),i%2?0xc981c9:0x59c4b4,x,h,z);for(let k=0;k<4;k++)add(new THREE.SphereGeometry(.12,6,4),0xe2ffcc,x+Math.cos(k)*1.1,h+.7,z+Math.sin(k)*1.1,true);}
  for(let i=0;i<20;i++){const orb=add(new THREE.SphereGeometry(.07,5,4),0xc6ffc2,Math.sin(i*9)*9,1+(i%5)*.7,-90-i,true);animated.push(orb);}
 }else{
  for(let i=0;i<12;i++){const a=i*2.4,x=Math.cos(a)*12,z=-103+Math.sin(a)*12;add(new THREE.CylinderGeometry(.5,.7,5+i%3,10),0xb8b19b,x,2.5,z);const gear=new THREE.Group();gear.position.set(x,6+i%3,z);scene.add(gear);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.4,.19,7,24),material(w.color));gear.add(ring);for(let j=0;j<12;j++){const tooth=new THREE.Mesh(new THREE.BoxGeometry(.3,.5,.3),material(w.color));tooth.position.set(Math.cos(j*Math.PI/6)*1.5,Math.sin(j*Math.PI/6)*1.5,0);tooth.rotation.z=j*Math.PI/6-Math.PI/2;gear.add(tooth);}animated.push(gear);}
  const clock=add(new THREE.TorusGeometry(4,.3,10,48),0xffe5a0,0,9,-116,true);animated.push(clock);
 }
 // A consistent altar makes the purpose of each strange place readable.
 add(new THREE.CylinderGeometry(1.8,2.1,.35,8),0x707f99,0,.15,-96);add(new THREE.CylinderGeometry(.65,.9,1,6),0x9aa6bd,0,.7,-96);
 const runes=[];for(let i=0;i<3;i++){const rune=add(new THREE.OctahedronGeometry(.35,0),w.color,(i-1)*.9,1.7,-96,true);runes.push(rune);}
 const arch=add(new THREE.TorusGeometry(2.1,.08,6,40),w.color,0,2.5,-98,true);animated.push(arch);
 // Fine floating particles provide depth without thousands of separate meshes.
 const points=new Float32Array(200*3);for(let i=0;i<200;i++)points.set([Math.sin(i*37)*28,3+(i%13),-85-(i*1.73%45)],i*3);const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(points,3));scene.add(new THREE.Points(pg,new THREE.PointsMaterial({color:w.color,size:.075})));
 // Keep the animated and puzzle meshes out of static batching.
 const dynamic=new THREE.Group();scene.add(dynamic);for(const m of [...animated,...runes])dynamic.attach(m);batchStatic(scene);
 scene.userData.update=(time,reduced,puzzle)=>{for(let i=0;i<animated.length;i++){if(!reduced)animated[i].rotation.y=time*.12*(i%2?1:-1);}for(let i=0;i<runes.length;i++){runes[i].rotation.y=(puzzle?.values?.[i]||0)*Math.PI/2;runes[i].scale.setScalar(puzzle?.solved?1.4:1);}};
 return scene;
}
