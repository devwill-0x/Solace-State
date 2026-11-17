import * as THREE from './vendor/three.module.js';

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function sdCapsule(px, py, pz, ax, ay, az, bx, by, bz, rA, rB) {
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const apx = px - ax, apy = py - ay, apz = pz - az;
  const denom = abx * abx + aby * aby + abz * abz || 1;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / denom));
  const r = rA + (rB - rA) * t;
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return Math.hypot(dx, dy, dz) - r;
}

function sdEllipsoid(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const qx = (px - cx) / rx, qy = (py - cy) / ry, qz = (pz - cz) / rz;
  const k0 = Math.hypot(qx, qy, qz);
  if (k0 < 1e-6) return -Math.min(rx, ry, rz);
  const k1 = Math.hypot(qx / rx, qy / ry, qz / rz);
  return k0 * (k0 - 1) / k1;
}

// Continuous watertight human SDF so there are zero socket seams inside translucent glass
function sampleHumanSDF(px, py, pz) {
  // Cranium + sculpted jaw/chin + neck
  let d = sdEllipsoid(px, py, pz, 0, 0.725, 0.005, 0.082, 0.106, 0.092);
  d = smin(d, sdCapsule(px, py, pz, 0, 0.70, 0.02, 0, 0.618, 0.032, 0.068, 0.036), 0.022);
  d = smin(d, sdCapsule(px, py, pz, 0, 0.64, 0.00, 0, 0.51, -0.004, 0.044, 0.056), 0.026);

  // Upper shoulders / traps / pectoral mass / ribcage / waist / pelvis
  d = smin(d, sdCapsule(px, py, pz, -0.140, 0.445, -0.005, 0.140, 0.445, -0.005, 0.056, 0.056), 0.048);
  d = smin(d, sdEllipsoid(px, py, pz, 0, 0.355, 0.008, 0.132, 0.135, 0.090), 0.045);
  d = smin(d, sdCapsule(px, py, pz, 0, 0.39, 0.005, 0, 0.14, 0.002, 0.108, 0.088), 0.038);
  d = smin(d, sdEllipsoid(px, py, pz, 0, 0.045, 0.004, 0.106, 0.100, 0.084), 0.044);

  // Symmetric sculpted arms & hands
  const sx = Math.abs(px);
  const upperArm = sdCapsule(sx, py, pz, 0.148, 0.435, -0.005, 0.212, 0.215, -0.015, 0.050, 0.039);
  const foreArm = sdCapsule(sx, py, pz, 0.212, 0.215, -0.015, 0.208, 0.020, 0.045, 0.039, 0.026);
  const hand = sdEllipsoid(sx, py, pz, 0.205, -0.035, 0.062, 0.022, 0.052, 0.028);
  const arm = smin(smin(upperArm, foreArm, 0.025), hand, 0.018);
  d = smin(d, arm, 0.036);

  // Symmetric sculpted thighs, calves, ankles & feet
  const thigh = sdCapsule(sx, py, pz, 0.072, 0.035, 0.002, 0.082, -0.355, 0.016, 0.066, 0.048);
  const calf = sdCapsule(sx, py, pz, 0.082, -0.355, 0.016, 0.085, -0.735, -0.014, 0.049, 0.030);
  const foot = sdCapsule(sx, py, pz, 0.085, -0.745, -0.012, 0.088, -0.768, 0.085, 0.031, 0.023);
  const leg = smin(smin(thigh, calf, 0.024), foot, 0.022);
  d = smin(d, leg, 0.038);

  // Subtle organic liquid-glass ripple so internal studio light catches ribbons cleanly
  d += Math.sin(py * 11.0 + px * 5.0) * 0.0022;
  return d;
}

function buildUnifiedHumanGeometry() {
  const nx = 44, ny = 104, nz = 26;
  const x0 = -0.33, x1 = 0.33;
  const y0 = -0.84, y1 = 0.89;
  const z0 = -0.18, z1 = 0.20;
  const dx = (x1 - x0) / (nx - 1);
  const dy = (y1 - y0) / (ny - 1);
  const dz = (z1 - z0) / (nz - 1);

  const vals = new Float32Array(nx * ny * nz);
  const vIdx = (i, j, k) => (k * ny + j) * nx + i;
  for (let k = 0; k < nz; k++) {
    const z = z0 + k * dz;
    for (let j = 0; j < ny; j++) {
      const y = y0 + j * dy;
      for (let i = 0; i < nx; i++) {
        vals[vIdx(i, j, k)] = sampleHumanSDF(x0 + i * dx, y, z);
      }
    }
  }

  const cnx = nx - 1, cny = ny - 1, cnz = nz - 1;
  const cellVert = new Int32Array(cnx * cny * cnz).fill(-1);
  const positions = [];
  const cIdx = (i, j, k) => (k * cny + j) * cnx + i;

  const EDGES = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
  const CX = [0, 1, 0, 1, 0, 1, 0, 1];
  const CY = [0, 0, 1, 1, 0, 0, 1, 1];
  const CZ = [0, 0, 0, 0, 1, 1, 1, 1];
  const corner = new Float32Array(8);

  for (let k = 0; k < cnz; k++) {
    for (let j = 0; j < cny; j++) {
      for (let i = 0; i < cnx; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const val = vals[vIdx(i + CX[c], j + CY[c], k + CZ[c])];
          corner[c] = val;
          if (val < 0) mask |= (1 << c);
        }
        if (mask === 0 || mask === 255) continue;

        let sx = 0, sy = 0, sz = 0, cnt = 0;
        for (let e = 0; e < 12; e++) {
          const a = EDGES[e][0], b = EDGES[e][1];
          const va = corner[a], vb = corner[b];
          if ((va < 0) === (vb < 0)) continue;
          const t = va / (va - vb);
          sx += CX[a] + (CX[b] - CX[a]) * t;
          sy += CY[a] + (CY[b] - CY[a]) * t;
          sz += CZ[a] + (CZ[b] - CZ[a]) * t;
          cnt++;
        }
        if (cnt === 0) continue;
        const vertId = positions.length / 3;
        cellVert[cIdx(i, j, k)] = vertId;
        positions.push(
          x0 + (i + sx / cnt) * dx,
          y0 + (j + sy / cnt) * dy,
          z0 + (k + sz / cnt) * dz
        );
      }
    }
  }

  const indices = [];
  const pushQuad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) indices.push(a, d, c, a, c, b);
    else indices.push(a, b, c, a, c, d);
  };

  for (let k = 1; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const va = vals[vIdx(i, j, k)], vb = vals[vIdx(i + 1, j, k)];
        if ((va < 0) !== (vb < 0)) {
          pushQuad(
            cellVert[cIdx(i, j - 1, k - 1)],
            cellVert[cIdx(i, j,     k - 1)],
            cellVert[cIdx(i, j,     k    )],
            cellVert[cIdx(i, j - 1, k    )],
            va >= 0
          );
        }
      }
    }
  }

  for (let k = 1; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const va = vals[vIdx(i, j, k)], vb = vals[vIdx(i, j + 1, k)];
        if ((va < 0) !== (vb < 0)) {
          pushQuad(
            cellVert[cIdx(i - 1, j, k - 1)],
            cellVert[cIdx(i - 1, j, k    )],
            cellVert[cIdx(i,     j, k    )],
            cellVert[cIdx(i,     j, k - 1)],
            va >= 0
          );
        }
      }
    }
  }

  for (let k = 0; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const va = vals[vIdx(i, j, k)], vb = vals[vIdx(i, j, k + 1)];
        if ((va < 0) !== (vb < 0)) {
          pushQuad(
            cellVert[cIdx(i - 1, j - 1, k)],
            cellVert[cIdx(i,     j - 1, k)],
            cellVert[cIdx(i,     j,     k)],
            cellVert[cIdx(i - 1, j,     k)],
            va >= 0
          );
        }
      }
    }
  }

  // Volume-preserving Taubin smoothing so Surface Nets quads turn glass-smooth
  const vCount = positions.length / 3;
  const neighbors = Array.from({ length: vCount }, () => new Set());
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t], b = indices[t + 1], c = indices[t + 2];
    neighbors[a].add(b); neighbors[a].add(c);
    neighbors[b].add(a); neighbors[b].add(c);
    neighbors[c].add(a); neighbors[c].add(b);
  }
  const posArr = new Float32Array(positions);
  const tmpArr = new Float32Array(positions.length);
  const smoothPass = (src, dst, factor) => {
    for (let v = 0; v < vCount; v++) {
      const nb = neighbors[v];
      if (!nb.size) {
        dst[v * 3] = src[v * 3];
        dst[v * 3 + 1] = src[v * 3 + 1];
        dst[v * 3 + 2] = src[v * 3 + 2];
        continue;
      }
      let ax = 0, ay = 0, az = 0;
      for (const u of nb) {
        ax += src[u * 3];
        ay += src[u * 3 + 1];
        az += src[u * 3 + 2];
      }
      const inv = 1 / nb.size;
      dst[v * 3]     = src[v * 3]     + factor * (ax * inv - src[v * 3]);
      dst[v * 3 + 1] = src[v * 3 + 1] + factor * (ay * inv - src[v * 3 + 1]);
      dst[v * 3 + 2] = src[v * 3 + 2] + factor * (az * inv - src[v * 3 + 2]);
    }
  };
  for (let pass = 0; pass < 3; pass++) {
    smoothPass(posArr, tmpArr, 0.52);
    smoothPass(tmpArr, posArr, -0.54);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const VERTEX_SHADER = /* glsl */`
uniform float uTime;
uniform float uStride;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

vec3 deformHuman(vec3 p) {
  float breath = sin(uTime * 1.45) * 0.005 * smoothstep(0.18, 0.44, p.y) * smoothstep(0.56, 0.36, p.y);
  p.z += breath * sign(p.z + 0.001);
  p.xy *= 1.0 + breath * 0.35;

  // Seamless arm swing around shoulder pivot without separating mesh
  float armW = smoothstep(0.42, 0.14, p.y) * smoothstep(0.125, 0.185, abs(p.x));
  float armAng = uStride * 0.30 * sign(p.x) * armW;
  vec2 armRel = p.yz - vec2(0.45, -0.005);
  float ca = cos(armAng), sa = sin(armAng);
  p.y = 0.45 + armRel.x * ca - armRel.y * sa;
  p.z = -0.005 + armRel.x * sa + armRel.y * ca;

  // Seamless leg stride around hip pivot
  float legW = smoothstep(0.02, -0.35, p.y) * smoothstep(0.015, 0.055, abs(p.x));
  float legAng = -uStride * 0.24 * sign(p.x) * legW;
  vec2 legRel = p.yz - vec2(0.02, 0.0);
  float cl = cos(legAng), sl = sin(legAng);
  p.y = 0.02 + legRel.x * cl - legRel.y * sl;
  p.z = legRel.x * sl + legRel.y * cl;

  // Subtle molten liquid-glass undulation
  p.x += sin(p.y * 7.0 + uTime * 1.15) * 0.003;
  p.z += cos(p.y * 6.0 - uTime * 0.95) * 0.003;
  return p;
}

void main() {
  vec3 pos = deformHuman(position);
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

vec3 sampleStudio(vec3 dir, float time) {
  vec3 d = normalize(dir);
  // Crystal-clear dark slate backdrop
  vec3 col = vec3(0.075, 0.115, 0.175);

  // Flowing studio water/glass reflection ribbons
  float w1 = sin(d.x * 10.5 + sin(d.y * 7.5 + time * 0.52) * 2.5) * 0.5 + 0.5;
  float w2 = sin(d.y * 8.0 - d.x * 6.0 + time * 0.40) * 0.5 + 0.5;
  col += vec3(0.11, 0.16, 0.24) * pow(w1, 3.0);
  col += vec3(0.07, 0.12, 0.18) * pow(w2, 4.0);

  // High-contrast studio softboxes for liquid specular pools
  float key1 = smoothstep(0.75, 0.98, dot(d, normalize(vec3(-0.78, 0.56, 0.28))));
  float key2 = smoothstep(0.79, 0.99, dot(d, normalize(vec3(0.84, -0.32, 0.42))));
  float key3 = smoothstep(0.82, 0.99, dot(d, normalize(vec3(0.10, 0.95, -0.28))));

  col += vec3(0.96, 0.99, 1.06) * key1 * 1.05;
  col += vec3(0.95, 0.85, 0.72) * key2 * 0.88;
  col += vec3(0.68, 0.85, 1.06) * key3 * 0.82;

  float darkBand = smoothstep(0.15, 0.88, sin(d.y * 4.8 - d.x * 3.8 + 0.4));
  col *= mix(1.0, 0.26, darkBand * 0.62);
  return col;
}

vec3 spectrum(float t) {
  // Warm crimson -> gold -> luminous cyan -> cobalt blue -> violet
  vec3 a = vec3(0.52, 0.48, 0.56);
  vec3 b = vec3(0.48, 0.48, 0.44);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.02, 0.27, 0.63);
  return clamp(a + b * cos(6.28318 * (c * t + d)), 0.0, 1.0);
}

void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) N = -N;

  // Fluid surface tension normal ripple
  float wA = sin(vWorldPos.y * 10.5 + vWorldPos.x * 6.5 + uTime * 1.05);
  float wB = cos(vWorldPos.x * 11.5 - vWorldPos.y * 7.0 - uTime * 0.75);
  N = normalize(N + vec3(wA * 0.075 + wB * 0.045, wB * 0.055, -wA * 0.045));

  float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fresnel = pow(1.0 - ndv, 2.05);

  // Triple-wavelength chromatic refraction
  vec3 rDir = refract(-V, N, 1.0 / 1.16);
  vec3 gDir = refract(-V, N, 1.0 / 1.26);
  vec3 bDir = refract(-V, N, 1.0 / 1.37);
  if (dot(rDir, rDir) < 0.01) rDir = reflect(-V, N);
  if (dot(gDir, gDir) < 0.01) gDir = reflect(-V, N);
  if (dot(bDir, bDir) < 0.01) bDir = reflect(-V, N);

  vec3 envRefr = vec3(
    sampleStudio(rDir, uTime).r,
    sampleStudio(gDir, uTime).g,
    sampleStudio(bDir, uTime).b
  );
  vec3 envRefl = sampleStudio(reflect(-V, N), uTime);

  // Sweeping internal diagonal liquid-glass caustic ribbons + thick rim dispersion
  float rimMask = smoothstep(0.04, 0.65, 1.0 - ndv);
  float sweep = sin(vWorldPos.y * 5.2 - vWorldPos.x * 6.4 + N.x * 2.8 + sin(vWorldPos.x * 6.5 + uTime * 0.65) * 1.9);
  float interiorRibbon = pow(max(0.0, sweep), 2.3) * 0.78;
  float causticWave = sin(vWorldPos.y * 7.5 + vWorldPos.x * 4.5 + wA * 2.2 - uTime * 0.45);
  float bandStrength = clamp(
    pow(max(0.0, 0.5 + 0.5 * causticWave), 1.35) * rimMask * 0.95 + interiorRibbon,
    0.0,
    1.0
  );

  float dispPhase = vWorldPos.y * 1.45 - vWorldPos.x * 1.35 + (1.0 - ndv) * 1.6 + wA * 0.35 + uTime * 0.07;
  vec3 dispersion = pow(spectrum(dispPhase), vec3(0.86)) * 1.28;

  // Razor-sharp white wet-glass specular glints
  vec3 L1 = normalize(vec3(-0.68, 0.70, 0.62));
  vec3 L2 = normalize(vec3(0.76, -0.30, 0.68));
  float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 175.0);
  float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 125.0);
  float crispRim = pow(1.0 - ndv, 6.8);

  vec3 glassColor = mix(envRefr, envRefl, fresnel * 0.78);
  glassColor = mix(glassColor, dispersion, clamp(bandStrength * 0.86 + fresnel * 0.42, 0.0, 0.93));
  glassColor += dispersion * crispRim * 0.62;
  glassColor += vec3(1.0) * (spec1 * 1.55 + spec2 * 1.15 + crispRim * 0.92);

  float alpha = clamp(0.24 + fresnel * 0.68 + bandStrength * 0.50 + spec1 + spec2, 0.22, 0.96) * uOpacityScale;
  gl_FragColor = vec4(glassColor * alpha, alpha);
}
`;

export class GlassFigureRenderer {
  constructor() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power'
      });
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(300, 520, false);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 0);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(34, 300 / 520, 0.1, 20);
      this.camera.position.set(0, 0.02, 3.25);

      const humanGeo = buildUnifiedHumanGeometry();

      this.backMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uStride: { value: 0 },
          uOpacityScale: { value: 0.44 }
        },
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide
      });
      this.frontMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uStride: { value: 0 },
          uOpacityScale: { value: 0.96 }
        },
        transparent: true,
        depthWrite: true,
        side: THREE.FrontSide
      });

      this.group = new THREE.Group();
      const backMesh = new THREE.Mesh(humanGeo, this.backMat);
      const frontMesh = new THREE.Mesh(humanGeo, this.frontMat);
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
    const stride = state?.moving ? Math.sin((state.distance || 0) * 5.2) : Math.sin(time * 1.1) * 0.08;
    this.backMat.uniforms.uTime.value = time;
    this.frontMat.uniforms.uTime.value = time;
    this.backMat.uniforms.uStride.value = stride;
    this.frontMat.uniforms.uStride.value = stride;

    this.group.rotation.y = Math.sin(time * 0.42) * 0.28;
    this.group.rotation.z = Math.sin(time * 0.31) * 0.025;
    this.group.position.y = Math.sin(time * 1.1) * 0.02;

    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement;
  }
}

export function createGlassFigureModel(){
      const humanGeo = buildUnifiedHumanGeometry();

      const backMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uStride: { value: 0 },
          uOpacityScale: { value: 0.44 }
        },
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide
      });
      const frontMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uStride: { value: 0 },
          uOpacityScale: { value: 0.96 }
        },
        transparent: true,
        depthWrite: true,
        side: THREE.FrontSide
      });

      const group = new THREE.Group();
      const backMesh = new THREE.Mesh(humanGeo, backMat);
      const frontMesh = new THREE.Mesh(humanGeo, frontMat);
      backMesh.renderOrder = 1;
      frontMesh.renderOrder = 2;
      group.add(backMesh, frontMesh);

 humanGeo.computeBoundingBox();const bounds=humanGeo.boundingBox,center=bounds.getCenter(new THREE.Vector3());humanGeo.translate(-center.x,-center.y,-center.z);const scale=1.7/(bounds.max.y-bounds.min.y);group.scale.setScalar(scale);return {group,update(time,state){for(const material of [backMat,frontMat]){material.uniforms.uTime.value=time;material.uniforms.uStride.value=state.moving?Math.sin(state.distance*5.2):0;}}};
}
