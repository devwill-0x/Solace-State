import * as T from './vendor/three.module.js';
import {PEOPLE} from './game.js';
const skin=new T.MeshPhongMaterial({color:0xa8a8a8,shininess:18});
const hair=new T.MeshLambertMaterial({color:0x191919});
const dark=new T.MeshLambertMaterial({color:0x101010});
const ivory=new T.MeshPhongMaterial({color:0xbfbfbf,shininess:25});
function ball(parent,material,x,y,z,sx,sy,sz,detail=24){
 const m=new T.Mesh(new T.SphereGeometry(1,detail,detail),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
}
function limb(parent,material,a,b,r1=.07,r2=r1){
 const v1=new T.Vector3(...a),v2=new T.Vector3(...b),d=v2.clone().sub(v1);
 const m=new T.Mesh(new T.CylinderGeometry(r2,r1,d.length(),16),material);
 m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());parent.add(m);return m;
}
function stroke(parent,points,material,r=.008){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
 const mesh=new T.Mesh(new T.TubeGeometry(curve,24,r,6,false),material);parent.add(mesh);return mesh;
}
export function person(style=0){
 const root=new T.Group(),head=new T.Group(),body=new T.Group();
 root.add(body,head);head.position.y=1.57;
 const cloth=new T.MeshLambertMaterial({color:[0x424242,0x6a6a6a,0x888888][style]});
 ball(body,cloth,0,1.06,0,.31,.43,.18);
 for(const side of [-1,1]){
  limb(body,cloth,[side*.14,.83,0],[side*.14,.13,.015],.095,.115);
  ball(body,dark,side*.14,.085,.07,.105,.085,.19);
  limb(body,cloth,[side*.27,1.31,0],[side*.36,.97,.01],.082,.10);
  limb(body,cloth,[side*.36,.97,.01],[side*.33,.7,.07],.064,.078);
  ball(body,skin,side*.33,.66,.08,.065,.11,.04);
 }
 limb(body,skin,[0,1.27,0],[0,1.46,0],.10);
 // A sculpted surface makes the nose, cheeks, jaw and eye sockets part of one face.
 const geo=new T.SphereGeometry(1,72,56),pos=geo.attributes.position;
 const G=(x,y,cx,cy,wx,wy)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
 for(let i=0;i<pos.count;i++){
  let x=pos.getX(i)*.225,y=pos.getY(i)*.29,z=pos.getZ(i)*.20;
  x*=y<-.1?1+(y+.1)*1.1:1;
  if(z>0){
   const mask=Math.min(1,z/.09);
   z+=mask*(.105*G(x,y,0,-.008,.037,.105)+.048*G(x,y,0,-.054,.05,.033)
     +.03*(G(x,y,-.105,-.035,.065,.055)+G(x,y,.105,-.035,.065,.055))
     -.044*(G(x,y,-.085,.047,.05,.033)+G(x,y,.085,.047,.05,.033))
     -.025*G(x,y,0,-.135,.085,.022));
  }
  pos.setXYZ(i,x,y,z);
 }geo.computeVertexNormals();
 const face=new T.Mesh(geo,skin);head.add(face);
 ball(head,skin,-.218,0,0,.034,.066,.034);ball(head,skin,.218,0,0,.034,.066,.034);
 const lids=[];
 for(const side of [-1,1]){
  const x=side*.085;
  ball(head,ivory,x,.047,.18,.046,.018,.026);
  ball(head,dark,x,.047,.204,.015,.015,.009);
  ball(head,new T.MeshBasicMaterial({color:0xeeeeee}),x-.004,.052,.212,.004,.004,.003,8);
  const lid=ball(head,skin,x,.056,.21,.049,.002,.011);lids.push(lid);
  stroke(head,[[x-.045,.095,.171],[x,.108,.19],[x+.04,.099,.175]],hair,.012);
  ball(head,dark,side*.027,-.068,.269,.012,.006,.008,12);
 }
 const lips=new T.MeshPhongMaterial({color:0x555555,shininess:25});
 stroke(head,[[-.064,-.133,.18],[0,-.137,.211],[.064,-.133,.18]],lips,.01);
 const mouth=ball(head,dark,0,-.144,.206,.05,.003,.008);
 ball(head,skin,0,-.163,.197,.05,.011,.015);
 const cap=new T.Mesh(new T.SphereGeometry(1,36,24,0,Math.PI*2,0,style===2?1.8:1.34),hair);
 cap.scale.set(.236,.315,.212);cap.position.y=.018;head.add(cap);
 if(style===0){
  for(let i=0;i<6;i++){const lock=ball(head,hair,-.16+i*.052,.185-i*.007,.149,.04,.108,.053);lock.rotation.z=-.4;}
 }else if(style===1){
  // Soft hat and round glasses distinguish the second face.
  ball(head,cloth,0,.26,0,.25,.12,.22);
  for(const side of [-1,1]){
   const ring=new T.Mesh(new T.TorusGeometry(.058,.005,6,28),ivory);ring.position.set(side*.084,.05,.223);head.add(ring);
  }
  stroke(head,[[-.025,.05,.23],[0,.06,.232],[.025,.05,.23]],ivory,.004);
 }else{
  for(const side of [-1,1])ball(head,hair,side*.203,.01,-.025,.061,.31,.16);
  stroke(body,[[0,1.33,.19],[.12,1.15,.2],[.05,.88,.19]],ivory,.025);
 }
 function animate(time,talking=false,reduced=false){
  const blink=reduced?0:Math.max(0,1-Math.abs((time+style*.8)%4.7-.16)/.095);
  lids.forEach(l=>{l.scale.y=.002+blink*.023;l.position.y=.056-blink*.008;});
  mouth.scale.y=talking? .007+Math.abs(Math.sin(time*12))* .017:.003;
  if(!reduced){head.rotation.y=Math.sin(time*.53+style)*.045;head.rotation.z=Math.sin(time*.42)*.018;body.scale.y=1+Math.sin(time*1.4)*.004;}
 }
 return {root,head,body,mouth,animate};
}
function glassMaterial(){
 return new T.ShaderMaterial({
  transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:{value:0}},
  vertexShader:'varying vec3 vN; varying vec3 vP; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); vP=p.xyz; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*p; }',
  fragmentShader:'varying vec3 vN; varying vec3 vP; uniform float uTime; void main(){vec3 n=normalize(vN); float f=pow(1.-abs(dot(n,normalize(-vP))),1.75); float band=dot(n,vec3(.65,.4,.7))*4.+uTime*.08; vec3 rainbow=.58+.42*cos(6.28318*(band+vec3(0.,.33,.67))); vec3 c=mix(vec3(.78,.9,1.),rainbow,.8); float shine=pow(max(0.,dot(reflect(normalize(vP),n),normalize(vec3(-.6,.8,.6)))),28.); gl_FragColor=vec4(c*(.55+f*.6)+shine*.5,.035+f*.72+shine*.2); }'
 });
}
export class Cast{
 constructor(scene){
  this.actors=PEOPLE.map(p=>{const a=person(p.style);a.root.position.set(p.x,0,p.z);scene.add(a.root);return {...a,info:p};});
  this.glass=glassMaterial();this.player=new T.Group();scene.add(this.player);
  ball(this.player,this.glass,0,.9,0,.25,.4,.16);
  for(const side of [-1,1]){
   limb(this.player,this.glass,[side*.13,.7,0],[side*.13,.12,.02],.08,.09);
   ball(this.player,this.glass,side*.13,.07,-.06,.09,.07,.17);
  }
  this.arms=[];
  for(const side of [-1,1]){
   const arm=new T.Group();this.player.add(arm);arm.position.set(side*.24,1.28,-.08);
   limb(arm,this.glass,[0,0,0],[side*.1,-.17,-.22],.069,.075);
   limb(arm,this.glass,[side*.1,-.17,-.22],[side*.11,-.08,-.49],.043,.064);
   ball(arm,this.glass,side*.11,-.06,-.54,.072,.028,.10);
   for(let j=0;j<4;j++){
    const x=side*.11+(j-1.5)*.032,z=-.60,tip=-.7+Math.abs(j-1.5)*.024;
    limb(arm,this.glass,[x,-.06,z],[x,-.045,tip],.013,.016);
    ball(arm,this.glass,x,-.045,tip,.013,.015,.017,12);
   }
   limb(arm,this.glass,[side*.11-side*.06,-.06,-.52],[side*.11-side*.10,-.06,-.59],.018,.023);
   this.arms.push(arm);
  }
 }
 update(state,time,reduced,aspect=1.5){
  for(const a of this.actors){a.animate(time,false,reduced);const dx=state.player.x-a.info.x,dz=state.player.z-a.info.z;if(Math.hypot(dx,dz)<8)a.root.rotation.y=Math.atan2(dx,dz);}
  this.player.visible=state.started&&!state.conversation;this.player.position.set(state.player.x,0,state.player.z);this.player.rotation.y=state.player.yaw;
  this.glass.uniforms.uTime.value=reduced?0:time;
  this.arms.forEach((a,i)=>{a.position.x=(i?1:-1)*.24*Math.min(1,aspect*.9);a.scale.x=Math.min(1,aspect*1.4);a.rotation.x=state.inspect?.65:(state.moving&&!reduced?Math.sin(state.distance*6+i*Math.PI)*.08:0);});
 }
}
export class Portrait{
 constructor(){
  this.scene=new T.Scene();this.scene.background=new T.Color(0x020202);
  this.camera=new T.PerspectiveCamera(34,1,.05,10);
  this.scene.add(new T.AmbientLight(0xffffff,.7));
  const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(-2,3,3);this.scene.add(key);
  const fill=new T.DirectionalLight(0xaaaaaa,.65);fill.position.set(2,1,2);this.scene.add(fill);
  const rim=new T.DirectionalLight(0xffffff,2);rim.position.set(1,2,-1);this.scene.add(rim);
  this.people=PEOPLE.map(p=>{const a=person(p.style);this.scene.add(a.root);return a;});
 }
 render(renderer,state,time,aspect,reduced){
  const c=state.conversation,index=PEOPLE.findIndex(p=>p.id===c.id),isTalking=PEOPLE[index].lines[c.line].speaker!=='You';
  this.people.forEach((p,i)=>{p.root.visible=i===index;if(i===index)p.animate(time,isTalking,reduced);});
  this.camera.aspect=aspect;this.camera.position.set(aspect<.8?0:.035,1.59,aspect<.8?1.42:1.18);
  this.camera.lookAt(0,1.53,0);this.camera.updateProjectionMatrix();renderer.render(this.scene,this.camera);
 }
}

