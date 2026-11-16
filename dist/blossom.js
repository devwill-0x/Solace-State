import * as THREE from './vendor/three.module.js';
export function buildBlossom(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xb4daf5);scene.fog=new THREE.Fog(0xc8d7ee,65,155);
 scene.add(new THREE.HemisphereLight(0xfff1fa,0x586c44,2.5));const sun=new THREE.DirectionalLight(0xffe6d0,2);sun.position.set(-20,30,-95);scene.add(sun);
 const materials=new Map();const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));return materials.get(color);};
 const add=(g,c,x,y,z)=>{const m=new THREE.Mesh(g,mat(c));m.position.set(x,y,z);scene.add(m);return m;};
 const land=add(new THREE.PlaneGeometry(240,240),0x739c67,0,0,-120);land.rotation.x=-Math.PI/2;
 const path=add(new THREE.PlaneGeometry(3,60),0xc6b6a9,0,.015,-112);path.rotation.x=-Math.PI/2;
 for(let i=0;i<11;i++){const h=18+(i%4)*7,x=(i-5)*14,z=-155-(i%3)*12;add(new THREE.ConeGeometry(18,h,7),[0x78899e,0x8e9bab,0x657b92][i%3],x,h/2,z);add(new THREE.ConeGeometry(6,h*.33,7),0xe9edf3,x,h*.835,z);}
 const trunk=new THREE.CylinderGeometry(.18,.35,3.8,8),crown=new THREE.IcosahedronGeometry(1.6,2);
 for(let i=0;i<22;i++){const side=i%2?1:-1,x=side*(4+(i%5)*1.5),z=-93-Math.floor(i/2)*4.2;add(trunk,0x68464c,x,1.9,z);for(let j=0;j<7;j++){const a=j*2.4;add(crown,[0xf5a9ce,0xffc9dc,0xe68db6][(i+j)%3],x+Math.cos(a)*1.3,3.5+(j%3)*.5,z+Math.sin(a)*1.3);}}
 const pond=add(new THREE.CircleGeometry(5,40),0x74bed1,14,.025,-113);pond.rotation.x=-Math.PI/2;pond.scale.x=1.5;
 const rock=new THREE.IcosahedronGeometry(.65,0);for(let i=0;i<18;i++){const a=i*Math.PI/9;add(rock,0x7f8290,14+Math.cos(a)*7.6,.3,-113+Math.sin(a)*5.2);}
 const petalGeo=new THREE.BufferGeometry(),positions=new Float32Array(750*3);for(let i=0;i<750;i++){positions[i*3]=Math.sin(i*127.1)*20;positions[i*3+1]=.04;positions[i*3+2]=-88-(i*1.618%50);}petalGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));scene.add(new THREE.Points(petalGeo,new THREE.PointsMaterial({color:0xffc3df,size:.13})));
 return scene;
}
