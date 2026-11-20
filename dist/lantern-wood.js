import * as THREE from './vendor/three.module.js';
import {FOREST_VISTA_Z,STATIONS,TREES} from './forest.js';

function mesh(parent, geometry, material, x, y, z) {
  const node = new THREE.Mesh(geometry, material);
  node.position.set(x,y,z);
  parent.add(node);
  return node;
}

function glyphPoint(shape, t) {
  const angle = t * Math.PI * 2;
  if (shape === 'eye') return [Math.cos(angle) * 1.15, Math.sin(angle) * (.45 + .1 * Math.cos(angle * 2))];
  if (shape === 'crown') {
    const points = [[-1,-.55],[-1.12,.55],[-.45,.05],[0,.85],[.45,.05],[1.12,.55],[1,-.55],[-1,-.55]];
    const edge = t * (points.length - 1), index = Math.floor(edge);
    return points[index].map((value,i) => THREE.MathUtils.lerp(value,points[index+1][i],edge-index));
  }
  return [Math.cos(angle) * .83,Math.sin(angle) * .83];
}

export function buildLanternWood() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030710);
  scene.fog = new THREE.FogExp2(0x030710,.065);
  scene.add(new THREE.HemisphereLight(0x839bc9,0x273549,.95));
  const moon=new THREE.DirectionalLight(0x8baed9,1.2);
  moon.position.set(-6,11,-9);
  scene.add(moon);

  const bark = new THREE.MeshLambertMaterial({color:0x58636d});
  const needles = new THREE.MeshLambertMaterial({color:0x34514d});
  const ground = mesh(scene,new THREE.PlaneGeometry(70,80),new THREE.MeshLambertMaterial({color:0x333d36}),0,0,-104);
  ground.rotation.x = -Math.PI / 2;

  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.66,1,1,6),bark,TREES.length);
  const foliage = new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,6),needles,TREES.length * 2);
  const transform = new THREE.Object3D();
  TREES.forEach(({x,z,radius,height},i) => {
    transform.position.set(x,height/2,z);
    transform.scale.set(radius,height,radius);
    transform.updateMatrix();
    trunks.setMatrixAt(i,transform.matrix);
    for(let tier=0;tier<2;tier++){
      transform.position.set(x,height*(.72+tier*.2),z);
      transform.scale.set(height*(.25-tier*.06),height*.52,height*(.25-tier*.06));
      transform.updateMatrix();
      foliage.setMatrixAt(i*2+tier,transform.matrix);
    }
  });
  scene.add(trunks,foliage);

  const leaves=new THREE.InstancedMesh(new THREE.ConeGeometry(.18,.55,3),needles,160);
  for(let i=0;i<leaves.count;i++){
    const x=(i%2===0?1:-1)*(2.7+Math.abs(Math.sin(i*9.2))*5);
    const z=-84-Math.abs(Math.sin(i*3.69))*34;
    transform.position.set(x,.21,z);
    transform.rotation.set(Math.sin(i*2.3)*.54,i*.91,Math.cos(i*5.1)*.38);
    transform.scale.setScalar(.65+Math.abs(Math.cos(i*1.9))*.7);
    transform.updateMatrix();
    leaves.setMatrixAt(i,transform.matrix);
  }
  scene.add(leaves);

  const amber = new THREE.MeshBasicMaterial({color:0xffb75c});
  const stone = new THREE.MeshLambertMaterial({color:0x657075});
  const chip = new THREE.DodecahedronGeometry(.085,0);
  const marker = new THREE.DodecahedronGeometry(.22,0);
  const route = [[0,-86.6],...STATIONS.map(s=>[s.x,s.z]),[0,FOREST_VISTA_Z]];
  route.slice(1).forEach(([x,z],i)=>{
    const [lastX,lastZ]=route[i];
    for(let n=1;n<6;n++){
      const t=n/6;
      mesh(scene,chip,amber,THREE.MathUtils.lerp(lastX,x,t)+Math.sin(n*3)*.45,.08,THREE.MathUtils.lerp(lastZ,z,t));
    }
  });

  const gateGeometry = new THREE.BoxGeometry(.13,2.6,.22);
  const glimmer = new THREE.MeshBasicMaterial({color:0x8dd8ff});
  const aligned = new THREE.MeshBasicMaterial({color:0xedfff5});
  const stations = STATIONS.map((station,i)=>{
    const {x,z,gate,glyphX,shape}=station;
    mesh(scene,new THREE.CylinderGeometry(.63,.78,.15,9),stone,x,.075,z);
    const inset=mesh(scene,new THREE.TorusGeometry(.49,.036,8,32),amber,x,.165,z);
    inset.rotation.x=-Math.PI/2;
    mesh(scene,marker,amber,x,.24,z);
    const bars=new THREE.Group();
    scene.add(bars);
    for(let n=-13;n<=13;n++){
      const bar=mesh(bars,gateGeometry,bark,n*.51,1.22,gate);
      bar.rotation.z=Math.sin(n*7)*.09;
    }
    const fragments = new THREE.Group();
    scene.add(fragments);
    for(let n=0;n<38;n++){
      const [px,py]=glyphPoint(shape,n/38);
      // Points lie on separate depth planes. From the stone they share one projected outline.
      const depth=.64-i*.06+(.53+i*.12)*((n*11+i*3)%17)/16;
      const shard=mesh(fragments,chip,glimmer,x+(glyphX+px-x)*depth,1.64+py*depth,z+(gate-z)*depth);
      shard.scale.setScalar(depth);
      shard.rotation.set(n*.41,n*.98,n*.16);
    }
    return {bars,fragments};
  });

  const clearing=mesh(scene,new THREE.IcosahedronGeometry(.46,1),aligned,0,2.4,FOREST_VISTA_Z);
  clearing.visible=false;
  const beacon=new THREE.PointLight(0x9ad8ff,0,8,2);
  beacon.position.copy(clearing.position);
  scene.add(beacon);

  const lamp=new THREE.Group();
  const lampFrame=new THREE.MeshBasicMaterial({color:0x8d5f36});
  const lampCore=mesh(lamp,new THREE.OctahedronGeometry(.092),amber,0,0,0);
  for(const y of [-.125,.125])mesh(lamp,new THREE.CylinderGeometry(.118,.118,.036,6),lampFrame,0,y,0);
  const rail=new THREE.CylinderGeometry(.012,.012,.245,5);
  for(let i=0;i<6;i++)mesh(lamp,rail,lampFrame,Math.cos(i*Math.PI/3)*.109,0,Math.sin(i*Math.PI/3)*.109);
  mesh(lamp,new THREE.TorusGeometry(.07,.012,6,18),lampFrame,0,.178,0);
  const light=new THREE.PointLight(0xffc08a,19,11,2);
  lamp.add(light);
  scene.add(lamp);

  scene.userData.updateForest = (state,time,reduced) => {
    const progress=state.forest;
    const active=state.realm==='forest';
    for(const [i,{bars,fragments}] of stations.entries()){
      bars.visible=i>=progress.stage;
      fragments.visible=i<progress.stage||(i===progress.stage&&progress.hooded);
      for(const shard of fragments.children) shard.material=i<progress.stage?aligned:glimmer;
    }
    clearing.visible=progress.stage===STATIONS.length;
    beacon.intensity=clearing.visible?32:0;
    lamp.visible=active;
    if(!active)return;
    const {x,z,yaw,pitch}=state.player;
    const sway=state.moving&&!reduced ? Math.sin(state.distance*6)*.019 : 0;
    lamp.position.set(x-Math.sin(yaw)*.6+Math.cos(yaw)*.28,
      1.23+Math.sin(pitch)*.45+sway,z-Math.cos(yaw)*.6-Math.sin(yaw)*.28);
    lamp.rotation.y=yaw;
    lampCore.scale.setScalar(progress.hooded?.5:1);
    light.intensity=progress.hooded?1.1:24+(reduced?0:Math.sin(time*9)*1.05);
  };
  return scene;
}
