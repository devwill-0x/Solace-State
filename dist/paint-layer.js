import * as THREE from './vendor/three.module.js';
import { PAINT_COLORS, MAX_SPLATS, PRISM } from './journey.js';
import { prismMaterial } from './prism.js';

// Lets the brush colour any scene: small objects take the paint whole, large surfaces (ground,
// walls, sidewalks) get brush splats. Colour survives the ASCII pass as colour glyphs; Prism paint
// renders as a drifting rainbow that the ASCII pass glitches.
// Painted pieces are keyed "<mesh index>:<instance>" by a deterministic scene traversal so saves restore them.
const WHOLE_LIMIT = 4.5;
const rnd = (n) => { const v = Math.sin(n * 91.17 + 12.9) * 43758.5453; return v - Math.floor(v); };

// Brush splats in two instanced meshes: solid colours and Prism.
export function createSplatMeshes(scene, max = MAX_SPLATS) {
  const geo = new THREE.CircleGeometry(1, 14);
  const solid = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }), max);
  const prism = new THREE.InstancedMesh(geo, prismMaterial(THREE.DoubleSide), max);
  for (const m of [solid, prism]) { m.count = 0; m.frustumCulled = false; m.userData.noPaint = true; scene.add(m); }
  const helper = new THREE.Object3D(), up = new THREE.Vector3(0, 0, 1), nrm = new THREE.Vector3(), color = new THREE.Color();
  let key = '';
  return (list, sizeBase = 0.32, sizeVar = 0.3) => {
    const k = list.length + ':' + (list.length ? list[list.length - 1].join(',') : '');
    if (k === key) return; key = k;
    let ns = 0, np = 0;
    list.forEach((s, i) => {
      nrm.set(s[3], s[4], s[5]).normalize();
      helper.position.set(s[0] + nrm.x * 0.015, s[1] + nrm.y * 0.015, s[2] + nrm.z * 0.015);
      helper.quaternion.setFromUnitVectors(up, nrm);
      const size = sizeBase + rnd(i * 3 + s[6]) * sizeVar; helper.scale.set(size, size * (0.75 + rnd(i) * 0.4), 1); helper.rotateZ(rnd(i + 5) * 6);
      helper.updateMatrix();
      if (PAINT_COLORS[s[6]].prism) prism.setMatrixAt(np++, helper.matrix);
      else { solid.setMatrixAt(ns, helper.matrix); solid.setColorAt(ns++, color.setHex(PAINT_COLORS[s[6]].hex)); }
    });
    solid.count = ns; prism.count = np;
    solid.instanceMatrix.needsUpdate = prism.instanceMatrix.needsUpdate = true;
    if (solid.instanceColor) solid.instanceColor.needsUpdate = true;
  };
}

export function createPaintLayer(scene) {
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh || o.userData.noPaint) return;
    const m = o.material;
    if (Array.isArray(m) || m.isShaderMaterial || m.transparent) return;
    meshes.push(o);
  });
  const syncSplats = createSplatMeshes(scene);

  const raycaster = new THREE.Raycaster(), center = new THREE.Vector2(0, 0), color = new THREE.Color();
  const m4 = new THREE.Matrix4(), scl = new THREE.Vector3(), grow = new THREE.Matrix4().makeScale(1.012, 1.012, 1.012);
  const applied = new Map(), skins = new Map(), solidSkin = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const sizeOf = (mesh, instanceId) => {
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    mesh.getWorldScale(scl); let s = Math.max(scl.x, scl.y, scl.z);
    if (instanceId != null) { mesh.getMatrixAt(instanceId, m4); scl.setFromMatrixScale(m4); s *= Math.max(scl.x, scl.y, scl.z); }
    return mesh.geometry.boundingSphere.radius * s;
  };
  // Instanced pieces share one material (often already coloured), so a painted instance gets a thin skin
  // drawn just over it: one instanced skin for solid colours, one for Prism.
  const skinFor = (mesh, kind) => {
    const id = kind + mesh.uuid;
    if (!skins.has(id)) {
      const skin = new THREE.InstancedMesh(mesh.geometry, kind === 'prism' ? prismMaterial() : solidSkin, mesh.count);
      skin.count = 0; skin.frustumCulled = false; skin.userData.noPaint = true; skin.userData.slots = new Map();
      mesh.parent.add(skin); skin.position.copy(mesh.position); skin.quaternion.copy(mesh.quaternion); skin.scale.copy(mesh.scale);
      skins.set(id, skin);
    }
    return skins.get(id);
  };
  const setSkin = (mesh, kind, ii, hex) => {
    const skin = skinFor(mesh, kind), slots = skin.userData.slots;
    if (hex !== null) {
      if (!slots.has(ii)) { mesh.getMatrixAt(ii, m4); m4.multiply(grow); skin.setMatrixAt(skin.count, m4); slots.set(ii, skin.count++); }
      if (kind === 'solid') { skin.setColorAt(slots.get(ii), color.setHex(hex)); skin.instanceColor.needsUpdate = true; }
    } else if (slots.has(ii)) {
      // Move the last skin into the freed slot.
      const slot = slots.get(ii), last = skin.count - 1; slots.delete(ii);
      if (slot !== last) {
        skin.getMatrixAt(last, m4); skin.setMatrixAt(slot, m4);
        if (kind === 'solid') { skin.getColorAt(last, color); skin.setColorAt(slot, color); skin.instanceColor.needsUpdate = true; }
        for (const [k, v] of slots) if (v === last) slots.set(k, slot);
      }
      skin.count = last;
    }
    skin.instanceMatrix.needsUpdate = true;
  };
  const tint = (key, c) => {
    const [mi, ii] = key.split(':').map(Number), mesh = meshes[mi];
    if (!mesh) return;
    const prism = !!PAINT_COLORS[c].prism;
    if (mesh.isInstancedMesh) {
      if (ii < 0 || ii >= mesh.count) return;
      setSkin(mesh, 'prism', ii, prism ? 0 : null);
      setSkin(mesh, 'solid', ii, prism ? null : PAINT_COLORS[c].hex);
      return;
    }
    // Materials are shared between meshes; give this one its own before tinting.
    mesh.userData.baseMaterial ??= mesh.material;
    if (prism) { mesh.material = prismMaterial(mesh.userData.baseMaterial.side); return; }
    mesh.userData.ownMaterial ??= mesh.userData.baseMaterial.clone();
    const own = mesh.userData.ownMaterial;
    own.color.setHex(PAINT_COLORS[c].hex);
    if (own.emissive) own.emissive.setHex(PAINT_COLORS[c].hex).multiplyScalar(0.22);
    mesh.material = own;
  };

  return {
    pick(camera) {
      raycaster.setFromCamera(center, camera); raycaster.far = 60;
      const hit = raycaster.intersectObjects(meshes, false).find((h) => shown(h.object));
      if (!hit) return null;
      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      if (hit.object.isInstancedMesh && hit.instanceId != null) { hit.object.getMatrixAt(hit.instanceId, m4); normal.transformDirection(m4); }
      normal.transformDirection(hit.object.matrixWorld);
      if (normal.dot(raycaster.ray.direction) > 0) normal.negate();
      const instanceId = hit.object.isInstancedMesh ? hit.instanceId : -1;
      const whole = sizeOf(hit.object, instanceId >= 0 ? instanceId : null) < WHOLE_LIMIT;
      return { key: meshes.indexOf(hit.object) + ':' + instanceId, whole, point: hit.point, normal, distance: hit.distance };
    },
    // Bring the scene in line with the saved canvas for this place.
    sync(canvas) {
      if (!canvas) return;
      for (const [key, c] of Object.entries(canvas.marks)) if (applied.get(key) !== c) { applied.set(key, c); tint(key, c); }
      syncSplats(canvas.splats);
    }
  };
}
