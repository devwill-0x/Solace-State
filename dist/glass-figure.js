import * as THREE from './vendor/three.module.js';

// C-infinity smooth closed 3D tilted figure-8 glass ribbon using a holonomy-corrected
// parallel-transport (Bishop) frame so twists are silky smooth with zero pinches or seams.
function sampleFigureCurve(u) {
  const t = u * Math.PI * 2;
  // Sweeping asymmetric S-ribbon figure-8 sculpture in 3D space
  const x = 0.25 * Math.sin(2 * t) + 0.14 * Math.sin(t + 0.65);
  const y = 0.72 * Math.cos(t) + 0.08 * Math.sin(2 * t + 0.4);
  const z = 0.28 * Math.sin(t - 0.35) - 0.10 * Math.cos(2 * t);
  return new THREE.Vector3(x, y, z);
}

function sampleTangent(u) {
  const eps = 1e-4;
  return sampleFigureCurve(u + eps).sub(sampleFigureCurve(u - eps)).normalize();
}

function buildGlassRibbonGeometry(tubularSegments = 260, radialSegments = 32) {
  const pts = [];
  const tangents = [];
  const normals = [];
  const binormals = [];

  let prevT = sampleTangent(0);
  let n = new THREE.Vector3(0, 0, 1);
  if (Math.abs(prevT.dot(n)) > 0.9) n.set(1, 0, 0);
  n.addScaledVector(prevT, -n.dot(prevT)).normalize();

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const pos = sampleFigureCurve(u);
    const t = sampleTangent(u);
    if (i > 0) {
      const axis = new THREE.Vector3().crossVectors(prevT, t);
      if (axis.lengthSq() > 1e-10) {
        axis.normalize();
        const angle = Math.acos(Math.max(-1, Math.min(1, prevT.dot(t))));
        n.applyAxisAngle(axis, angle);
      }
    }
    n.addScaledVector(t, -n.dot(t)).normalize();
    const b = new THREE.Vector3().crossVectors(t, n).normalize();
    pts.push(pos);
    tangents.push(t);
    normals.push(n.clone());
    binormals.push(b);
    prevT = t;
  }

  // Distribute closed-loop holonomy smoothly so u=0 and u=1 join with zero seam.
  const n0 = normals[0];
  const nEnd = normals[tubularSegments];
  const holonomy = Math.atan2(new THREE.Vector3().crossVectors(nEnd, n0).dot(tangents[0]), nEnd.dot(n0));

  const positions = [];
  const vNormals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const twist = u * Math.PI * 2.0 + holonomy * u + Math.sin(u * Math.PI * 2.0) * 0.4;
    const c = Math.cos(twist), s = Math.sin(twist);
    const nRot = normals[i].clone().multiplyScalar(c).addScaledVector(binormals[i], s);
    const bRot = binormals[i].clone().multiplyScalar(c).addScaledVector(normals[i], -s);

    const width = 0.142 + 0.048 * Math.sin(u * Math.PI * 2.0 + 0.7) + 0.018 * Math.cos(u * Math.PI * 4.0);
    const thick = 0.036 + 0.009 * Math.cos(u * Math.PI * 2.0);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      const px = Math.sign(cosT) * Math.pow(Math.abs(cosT), 0.72) * width;
      const py = Math.sign(sinT) * Math.pow(Math.abs(sinT), 0.88) * thick;
      const p = pts[i].clone().addScaledVector(nRot, px).addScaledVector(bRot, py);
      positions.push(p.x, p.y, p.z);

      const nx = Math.sign(cosT) * Math.pow(Math.abs(cosT), 0.28) / width;
      const ny = Math.sign(sinT) * Math.pow(Math.abs(sinT), 0.12) / thick;
      const norm = nRot.clone().multiplyScalar(nx).addScaledVector(bRot, ny).normalize();
      vNormals.push(norm.x, norm.y, norm.z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      // Outward-facing CCW winding
      indices.push(a, d, b, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(vNormals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

const VERTEX_SHADER = /* glsl */`
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos += normal * (sin(uv.x * 12.56637 + uTime * 1.1) * 0.003);
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAGMENT_SHADER = /* glsl */`
uniform float uTime;
uniform float uOpacityScale;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

vec3 sampleStudio(vec3 dir, float time) {
  vec3 d = normalize(dir);
  // Deep slate-navy base matching the mirror glass
  vec3 col = vec3(0.09, 0.13, 0.19);

  // Subtle wavy liquid-water internal reflection bands across clear glass
  float water = sin(d.x * 12.0 + sin(d.y * 8.0 + time * 0.55) * 2.4) * 0.5 + 0.5;
  col += vec3(0.11, 0.16, 0.22) * pow(water, 3.5);

  // Studio softbox highlights at oblique reflection angles
  float key1 = smoothstep(0.76, 0.98, dot(d, normalize(vec3(-0.78, 0.54, 0.30))));
  float key2 = smoothstep(0.80, 0.99, dot(d, normalize(vec3(0.82, -0.35, 0.44))));
  float key3 = smoothstep(0.82, 0.99, dot(d, normalize(vec3(0.12, 0.94, -0.30))));

  col += vec3(0.95, 0.98, 1.05) * key1 * 0.95;
  col += vec3(0.95, 0.84, 0.72) * key2 * 0.85;
  col += vec3(0.65, 0.82, 1.05) * key3 * 0.75;

  float darkBand = smoothstep(0.2, 0.85, sin(d.y * 5.0 - d.x * 3.5));
  col *= mix(1.0, 0.32, darkBand * 0.55);
  return col;
}

vec3 spectrum(float t) {
  vec3 a = vec3(0.52, 0.48, 0.55);
  vec3 b = vec3(0.48, 0.48, 0.45);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.03, 0.28, 0.62);
  return clamp(a + b * cos(6.28318 * (c * t + d)), 0.0, 1.0);
}

void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) N = -N;

  float wave = sin(vWorldPos.y * 11.0 + vWorldPos.x * 7.0 + uTime * 1.1) * 0.055
             + cos(vWorldPos.x * 13.0 - vWorldPos.z * 9.0 - uTime * 0.8) * 0.04;
  N = normalize(N + vec3(wave, wave * 0.5, -wave * 0.3));

  float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fresnel = pow(1.0 - ndv, 2.2);

  vec3 rDir = refract(-V, N, 1.0 / 1.18);
  vec3 gDir = refract(-V, N, 1.0 / 1.26);
  vec3 bDir = refract(-V, N, 1.0 / 1.35);
  if (dot(rDir, rDir) < 0.01) rDir = reflect(-V, N);
  if (dot(gDir, gDir) < 0.01) gDir = reflect(-V, N);
  if (dot(bDir, bDir) < 0.01) bDir = reflect(-V, N);

  vec3 envRefr = vec3(
    sampleStudio(rDir, uTime).r,
    sampleStudio(gDir, uTime).g,
    sampleStudio(bDir, uTime).b
  );
  vec3 envRefl = sampleStudio(reflect(-V, N), uTime);

  // Chromatic dispersion caustics concentrated at bent rims & undulating liquid bands
  float bendMask = smoothstep(0.06, 0.72, 1.0 - ndv);
  float causticWave = sin(vUv.x * 16.0 + vWorldPos.y * 5.8 + sin(vWorldPos.x * 7.5 + uTime * 0.7) * 2.4 + wave * 9.0);
  float bandStrength = pow(max(0.0, 0.5 + 0.5 * causticWave), 1.45) * bendMask;
  float dispPhase = vUv.x * 2.6 + (1.0 - ndv) * 1.85 + wave * 3.8 + causticWave * 0.28 + uTime * 0.06;
  vec3 dispersion = spectrum(dispPhase);
  dispersion = pow(dispersion, vec3(0.88)) * 1.25;

  // Razor-sharp wet glass specular highlights + thin white edge glint
  vec3 L1 = normalize(vec3(-0.65, 0.72, 0.65));
  vec3 L2 = normalize(vec3(0.75, -0.35, 0.68));
  float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 180.0);
  float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 130.0);
  float crispRim = pow(1.0 - ndv, 7.2);

  vec3 glassColor = mix(envRefr, envRefl, fresnel * 0.75);
  glassColor = mix(glassColor, dispersion, clamp(bandStrength * 0.88 + fresnel * 0.46, 0.0, 0.94));
  glassColor += dispersion * crispRim * 0.65;
  glassColor += vec3(1.0) * (spec1 * 1.5 + spec2 * 1.15 + crispRim * 0.95);

  // Clear dark-slate interior in flat-facing areas; rich opaque caustic/specular rims
  float alpha = clamp(0.18 + fresnel * 0.78 + bandStrength * 0.45 + spec1 + spec2, 0.16, 0.98) * uOpacityScale;
  gl_FragColor = vec4(glassColor, alpha);
}
`;

export class GlassFigureRenderer {
  constructor() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power'
      });
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(300, 520, false);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x212d3c, 1);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x212d3c);
      this.camera = new THREE.PerspectiveCamera(34, 300 / 520, 0.1, 20);
      this.camera.position.set(0, 0.0, 3.25);

      const geometry = buildGlassRibbonGeometry(260, 32);
      this.backMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: { uTime: { value: 0 }, uOpacityScale: { value: 0.58 } },
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide
      });
      this.frontMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: { uTime: { value: 0 }, uOpacityScale: { value: 0.94 } },
        transparent: true,
        depthWrite: true,
        side: THREE.FrontSide
      });

      this.group = new THREE.Group();
      const backMesh = new THREE.Mesh(geometry, this.backMat);
      const frontMesh = new THREE.Mesh(geometry, this.frontMat);
      backMesh.renderOrder = 1;
      frontMesh.renderOrder = 2;
      this.group.add(backMesh, frontMesh);
      this.scene.add(this.group);
      this.ready = true;
    } catch {
      this.ready = false;
    }
  }

  render(time, state) {
    if (!this.ready) return null;
    this.backMat.uniforms.uTime.value = time;
    this.frontMat.uniforms.uTime.value = time;
    const walkSway = state?.moving ? Math.sin((state.distance || 0) * 4.5) * 0.16 : 0;
    this.group.rotation.y = Math.sin(time * 0.42) * 0.34 + walkSway;
    this.group.rotation.z = Math.sin(time * 0.31) * 0.05;
    this.group.position.y = Math.sin(time * 1.1) * 0.025;
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement;
  }
}
