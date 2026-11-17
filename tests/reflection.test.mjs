import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {reflectCamera} from '../dist/reflection.js';
for(const nx of [-1,1])test('map reflection preserves camera distance, reverses the normal direction and keeps the tangent '+nx,()=>{
 const plane=new THREE.Plane(new THREE.Vector3(nx,0,0),-nx*3),source=new THREE.PerspectiveCamera(72,1.6,.01,160);source.position.set(3+nx*2,1.64,-4);source.rotation.set(-.2,nx*Math.PI/3,0);source.updateMatrixWorld();const remote=reflectCamera(source,plane,new THREE.PerspectiveCamera());assert.ok(Math.abs(plane.distanceToPoint(remote.position)+plane.distanceToPoint(source.position))<1e-10);assert.equal(remote.position.y,source.position.y);assert.equal(remote.position.z,source.position.z);const expected=source.getWorldDirection(new THREE.Vector3()).reflect(plane.normal);assert.ok(remote.getWorldDirection(new THREE.Vector3()).distanceTo(expected)<1e-10);assert.deepEqual(remote.projectionMatrix.elements,source.projectionMatrix.elements);
});
