import * as THREE from './vendor/three.module.js';

const _fwd = new THREE.Vector3();
const _target = new THREE.Vector3();

export function reflectCamera(source, plane, camera) {
  camera.copy(source);
  const normal = plane.normal;
  camera.position.copy(source.position).addScaledVector(normal, -2 * plane.distanceToPoint(source.position));
  source.getWorldDirection(_fwd).reflect(normal);
  camera.up.set(0, 1, 0).applyQuaternion(source.quaternion).reflect(normal);
  _target.copy(camera.position).add(_fwd);
  camera.lookAt(_target);
  camera.updateMatrixWorld();
  return camera;
}

export class MapMirror {
  constructor(spec) {
    this.spec = spec;
    this.plane = new THREE.Plane(new THREE.Vector3(spec.nx, 0, spec.nz), -spec.nx * spec.x - spec.nz * spec.z);
    this.clipPlanes = [this.plane];
    this.target = new THREE.WebGLRenderTarget(256, 256);
    this.camera = new THREE.PerspectiveCamera();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        view: { value: this.target.texture },
        viewport: { value: new THREE.Vector2(256, 256) }
      },
      vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform sampler2D view;uniform vec2 viewport;void main(){vec2 uv=gl_FragCoord.xy/viewport;uv.x=1.0-uv.x;gl_FragColor=texture2D(view,uv);\n#include <colorspace_fragment>\n}',
      side: THREE.FrontSide
    });
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), this.material);
    this.face.position.set(spec.x, spec.y, spec.z);
    this.face.rotation.y = spec.nx > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.bounds = new THREE.Sphere(this.face.position.clone(), Math.hypot(spec.w, spec.h) / 2);
  }

  resize(w, h) {
    const scale = Math.min(1, 400 / Math.max(1, w));
    this.target.setSize(Math.max(64, Math.round(w * scale)), Math.max(64, Math.round(h * scale)));
    this.material.uniforms.viewport.value.set(w, h);
  }

  render(renderer, scene, source, frustum) {
    if (this.plane.distanceToPoint(source.position) < 0.025 || !frustum.intersectsSphere(this.bounds) || source.position.distanceTo(this.face.position) > 16) {
      return false;
    }
    reflectCamera(source, this.plane, this.camera);
    renderer.clippingPlanes = this.clipPlanes;
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    return true;
  }
}
