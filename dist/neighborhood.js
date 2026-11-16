import * as THREE from './vendor/three.module.js';
import {batchStatic} from './batch.js';
export function buildNeighborhood(street){
 const g=new THREE.Group();street.scene.add(g);const materials=new Map();const mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshLambertMaterial({color:c}));return materials.get(c);};
 const box=(x,y,z,w,h,d,c=0x777777)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);g.add(m);return m;};
 const sphere=(x,y,z,r,c)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mat(c));m.position.set(x,y,z);g.add(m);return m;};
 const bench=(x,z)=>{box(x,.48,z,2,.16,.6,0xaaaaaa);box(x,.9,z-.23,2,.65,.12,0x858585);for(const dx of [-.75,.75])box(x+dx,.22,z,.12,.44,.45,0x555555);};
 // Two short side courtyards open up the formerly straight corridor.
 for(const [x,z] of [[-6.6,-13],[6.6,-22]]){box(x,.025,z,7,.05,8,0x646464);for(let k=-3;k<=3;k++){box(x+k,.06,z,.035,.025,8,0x999999);box(x,.06,z+k,7,.025,.035,0x999999);}for(const zz of [z-4,z+4])box(x,1.1,zz,7,2.2,.2,0x4a4a4a);box(Math.sign(x)*10.1,1.1,z,.2,2.2,8,0x4a4a4a);}
 // Tea square: a mature tree, benches and a tiny open-front pavilion.
 box(-7,1.8,-13,.45,3.6,.45,0x747474);for(let i=0;i<7;i++)sphere(-7+Math.cos(i*2.4)*1.1,3.7+(i%2)*.7,-13+Math.sin(i*2.4),1.25,0x919191);
 bench(-6,-10);bench(-8,-15.7);box(-9.6,1.3,-13,.35,2.6,3,0x939393);box(-8.8,2.8,-13,2.6,.22,3.6,0xb2b2b2);box(-9.1,.8,-13,1,.15,2.6,0xa0a0a0);
 // Moon garden: pond, stone banks, reeds and a sheltered seat.
 const water=new THREE.Mesh(new THREE.CircleGeometry(1.65,32),new THREE.MeshBasicMaterial({color:0x727e85}));water.rotation.x=-Math.PI/2;water.position.set(7,.08,-22);g.add(water);
 for(let i=0;i<18;i++){const a=i*Math.PI/9;sphere(7+Math.cos(a)*1.9,.24,-22+Math.sin(a)*1.9,.34,0x999999);}bench(7,-25.2);
 for(let i=0;i<12;i++)box(8.5+Math.sin(i)*.5,.5,-20.5+Math.cos(i)*.4,.035,1,.035,0xbcbcbc);
 // Warm pools of light and low lanterns make each junction readable.
 for(const [x,z] of [[-3.6,-9],[-3.6,-17],[3.6,-18],[3.6,-26]]){box(x,.65,z,.22,1.3,.22,0x858585);box(x,1.4,z,.48,.45,.48,0xdddddd);box(x,1.7,z,.65,.13,.65,0x777777);street.glow(x,z,3,4,.2);}
 // Portal entrances feel like doorways belonging to the street.
 for(const [z,c] of [[-2,0x7ba6ac],[-12,0xaa859b]]){box(3.2,.035,z,1.1,.05,2.6,c);for(const dz of [-1.35,1.35])box(3.65,1.9,z+dz,.22,3.8,.2,0x999999);box(3.65,3.85,z,.7,.22,3.1,0xbcbcbc);for(let i=0;i<4;i++)box(1.3+i*.5,.045,z,.25,.02,1.4,c);}
 // Parking bay and entry paving create recognizable stopping points.
 for(const x of [-2.85,-1.15])box(x,.03,-10,.06,.025,3.7,0xbcbcbc);box(-2,.03,-8.2,1.7,.025,.06,0xbcbcbc);
 for(let z=4;z<9;z+=.7)box(0,.035,z,5.8,.025,.08,0x969696);
 for(const z of [1,-14,-28]){street.curve([-3.4,4.3,z],[3.4,4.3,z],.55);for(let i=-2;i<=2;i++)street.lantern(i*1.25,3.6+Math.abs(i)*.13,z);}
 batchStatic(g);
}
