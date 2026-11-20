import * as THREE from './vendor/three.module.js';

// Prism paint: the iridescent rainbow of the player's glass reflection. Surfaces painted with it
// output pure, fully saturated hues that drift across space and time. The ASCII pass recognises
// those pure hues (one channel at full, one near zero) and glitches the characters drawn there.
export const prismTime = { value: 0 };

const cache = new Map();
export function prismMaterial(side = THREE.FrontSide) {
  if (cache.has(side)) return cache.get(side);
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, side, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uPrismTime = prismTime;
    shader.vertexShader = 'varying vec3 vPrismPos;\n' + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 prismWorld = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        prismWorld = instanceMatrix * prismWorld;
      #endif
      vPrismPos = ( modelMatrix * prismWorld ).xyz;`);
    shader.fragmentShader = 'uniform float uPrismTime;\nvarying vec3 vPrismPos;\n' + shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
      float prismHue = fract( dot( vPrismPos, vec3( 0.13, 0.09, 0.11 ) ) + uPrismTime * 0.18 );
      vec3 prismRgb = clamp( abs( mod( prismHue * 6.0 + vec3( 0.0, 4.0, 2.0 ), 6.0 ) - 3.0 ) - 1.0, 0.0, 1.0 );
      vec4 diffuseColor = vec4( prismRgb, opacity );`);
  };
  m.customProgramCacheKey = () => 'prism-paint';
  cache.set(side, m);
  return m;
}

// The same rainbow for 2D overlays: hue in [0,1) to an [r,g,b] triple.
export function prismRgb(h) {
  const f = (n) => { const k = (n + h * 6) % 6; return Math.round(255 * Math.max(0, Math.min(1, Math.abs(k - 3) - 1))); };
  return [f(0), f(4), f(2)];
}
