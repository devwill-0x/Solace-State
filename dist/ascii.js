// Every visible surface is rebuilt from printable characters, and the Colour Brush paints them.
// Shading picks a density glyph; strong silhouettes switch to
// line glyphs that follow the edge, so shapes read crisply. Saturated pixels keep their colour.
import { PAINT_COLORS, PRISM } from './journey.js';
import { prismRgb } from './prism.js';

const RAMP = [' ', '.', ',', ':', ';', '/', '*', '%', '&', '#', '@'];
const EDGES = ['|', '-', '/', '\\'];
const GLYPHS = [...RAMP, ...EDGES];
const GRAY_LEVELS = 48;
const CUBE = 6; // 6x6x6 colour cube for coloured glyphs
const hexRgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
// Glyph indices used when Prism paint glitches: # % @ & / | - \ :
const GLITCH = [9, 7, 10, 8, 5, 11, 12, 14, 3];
const hash = (a, b, c) => { const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return v - Math.floor(v); };

export class Ascii {
  constructor(canvas, street) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.street = street;
    this.sample = document.createElement('canvas'); this.read = this.sample.getContext('2d', { willReadFrequently: true, alpha: false });
    this.quality = 0; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.bursts = [];
    this.resize(); window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = innerWidth, h = innerHeight; this.width = w; this.height = h;
    const target = this.quality === 0 ? (w < 600 ? 3.35 : 5.25) : (w < 600 ? 5 : 7.7);
    this.cols = Math.max(70, Math.min(350, Math.round(w / target))); this.cw = w / this.cols; this.ch = this.cw * 1.85; this.rows = Math.ceil(h / this.ch);
    const dpr = Math.min(devicePixelRatio || 1, 2); this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.ctx.imageSmoothingEnabled = false;
    this.sample.width = this.cols; this.sample.height = this.rows;
    this.luma = new Float32Array(this.cols * this.rows); this.rowShift = new Int8Array(this.rows);
    // The held brush is rasterised onto this character-sized grid, then drawn as glyphs.
    // Brush characters are drawn 2.3x larger than the world's so the brush reads as a solid object in hand.
    this.bw = this.cw * 2.3; this.bh = this.ch * 2.3; this.bcols = Math.ceil(w / this.bw); this.brows = Math.ceil(h / this.bh);
    this.bigFont = `bold ${Math.round(this.bh * 0.92)}px Consolas,'Courier New',monospace`;
    this.mask = document.createElement('canvas'); this.mask.width = this.bcols; this.mask.height = this.brows;
    this.maskCtx = this.mask.getContext('2d', { willReadFrequently: true });
    this.street.resize(Math.min(w, 1120), Math.min(h, 700), w / h); this.makeAtlas(); this.makeVignette();
  }

  makeAtlas() {
    this.tw = Math.ceil(this.cw * this.dpr); this.th = Math.ceil(this.ch * this.dpr);
    const font = `${Math.round(this.ch * this.dpr * 0.94)}px Consolas,'Courier New',monospace`;
    const sheet = (rows, paint) => {
      const a = document.createElement('canvas'); a.width = this.tw * GLYPHS.length; a.height = this.th * rows;
      const c = a.getContext('2d'); c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let r = 0; r < rows; r++) { c.fillStyle = paint(r); GLYPHS.forEach((g, k) => c.fillText(g, (k + 0.5) * this.tw, (r + 0.5) * this.th)); }
      return a;
    };
    // Grey ink: dim glyphs stay legible, bright ones approach paper white.
    this.grayAtlas = sheet(GRAY_LEVELS, (r) => { const v = r / (GRAY_LEVELS - 1), g = Math.min(238, Math.round(78 + Math.pow(v, 0.45) * 160)); return `rgb(${g},${g},${Math.round(g * 0.97)})`; });
    this.colorAtlas = sheet(CUBE ** 3, (r) => { const q = (n) => Math.round(n / (CUBE - 1) * 215 + 40); return `rgb(${q(Math.floor(r / 36))},${q(Math.floor(r / 6) % 6)},${q(r % 6)})`; });
  }

  makeVignette() {
    const v = document.createElement('canvas'); v.width = 256; v.height = 256; const c = v.getContext('2d');
    const g = c.createRadialGradient(128, 128, 60, 128, 128, 182); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.38)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256); this.vignette = v;
  }

  // One glyph at a grid cell: colour from an [r,g,b] triple (normalised to full brightness) or grey.
  glyphColor(glyph, rgb, px, py) {
    const [r, g, b] = rgb, hi = Math.max(r, g, b, 1), k = 235 / hi, q = (c) => Math.min(5, Math.round(c * k / 51));
    this.ctx.drawImage(this.colorAtlas, glyph * this.tw, (q(r) * 36 + q(g) * 6 + q(b)) * this.th, this.tw, this.th, px, py, this.cw, this.ch);
  }
  glyphGray(glyph, value, px, py) {
    this.ctx.drawImage(this.grayAtlas, glyph * this.tw, Math.max(0, Math.min(GRAY_LEVELS - 1, value * GRAY_LEVELS >> 8)) * this.th, this.tw, this.th, px, py, this.cw, this.ch);
  }
  // A large brush character on a dark backing cell.
  bigGlyph(ch, rgb, px, py, backing = 0.88) {
    const c = this.ctx;
    if (backing) { c.fillStyle = `rgba(4,4,6,${backing})`; c.fillRect(px, py, this.bw + 0.5, this.bh + 0.5); }
    c.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; c.fillText(ch, px + this.bw / 2, py + this.bh / 2 + 1);
  }
  paintRgb(index, time, offset = 0) {
    return PAINT_COLORS[index].prism ? prismRgb((time * 0.35 + offset) % 1) : hexRgb(PAINT_COLORS[index].hex);
  }

  // A burst of paint droplets at the centre of view, in the brush colour.
  addPaintBurst(color, big = false) {
    this.bursts.push({ color, age: 0, big, seed: Math.random() * 100 });
    if (this.bursts.length > 8) this.bursts.shift();
  }

  // The Colour Brush in hand, drawn in characters: a grey handle, a bright ferrule and paint-loaded
  // bristles. Prism bristles shimmer through the rainbow and glitch like painted surfaces do.
  drawBrushOverlay(ctx, state, time) {
    if (state.ride || (state.realm !== 'paint' && !state.quest?.brush)) return;
    const rt = state.runtime, ci = rt?.brushColor ?? PRISM, prism = !!PAINT_COLORS[ci].prism;
    const w = this.width, h = this.height, cols = this.bcols, rows = this.brows, cw = this.bw, ch = this.bh;
    const stroke = rt?.brushSwing ? rt.brushSwing / 0.3 : 0, p = 1 - stroke;
    const bobX = state.moving ? Math.sin(state.distance * 5.2) * 7 : Math.sin(time * 1.3) * 2;
    const bobY = state.moving ? Math.abs(Math.cos(state.distance * 5.2)) * 9 : Math.cos(time * 1.3) * 3;
    const len = Math.min(h * 0.62, w * 0.75, 470), s = len / 470;
    // Rasterise: red channel = part (60 handle, 110 node, 165 ferrule, 220 bristle), green = shading/position.
    const m = this.maskCtx; m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, cols, rows);
    m.setTransform(1 / cw, 0, 0, 1 / ch, 0, 0);
    if (stroke > 0) { const k = Math.sin(p * Math.PI); m.translate(w * (0.78 - k * 0.2), h * (1.02 - k * 0.22)); m.rotate(-0.62 + k * 0.5); }
    else { m.translate(w * 0.8 + bobX, h * 1.04 + bobY); m.rotate(-0.55 + Math.sin(time * 1.1) * 0.02); }
    const across = (x0, x1, part) => { const g = m.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, `rgb(${part},20,0)`); g.addColorStop(0.45, `rgb(${part},255,0)`); g.addColorStop(1, `rgb(${part},30,0)`); return g; };
    m.fillStyle = across(-22 * s, 22 * s, 60); m.fillRect(-22 * s, -len * 0.62, 44 * s, len * 0.66);
    m.fillStyle = 'rgb(110,120,0)'; for (const t of [0.14, 0.32, 0.5]) m.fillRect(-23 * s, -len * t, 46 * s, 9 * s);
    m.fillStyle = across(-28 * s, 28 * s, 165); m.fillRect(-28 * s, -len * 0.73, 56 * s, len * 0.12);
    const top = -len * 0.72, tip = -len, along = m.createLinearGradient(0, top, 0, tip);
    along.addColorStop(0, 'rgb(220,0,0)'); along.addColorStop(1, 'rgb(220,255,0)'); m.fillStyle = along;
    m.beginPath(); m.moveTo(-30 * s, top); m.bezierCurveTo(-50 * s, top - len * 0.12, -16 * s, tip + len * 0.05, 0, tip);
    m.bezierCurveTo(16 * s, tip + len * 0.05, 50 * s, top - len * 0.12, 30 * s, top); m.closePath(); m.fill();
    const d = m.getImageData(0, 0, cols, rows).data, frame = Math.floor(time * 12);
    ctx.save(); ctx.font = this.bigFont; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const o = (y * cols + x) * 4; if (d[o + 3] < 110) continue;
      const part = d[o], g = d[o + 1], px = x * cw, py = y * ch;
      if (part < 85) { const v = Math.round(95 + g * 0.55); this.bigGlyph(g > 200 ? '|' : g > 90 ? '#' : '%', [v, v - 6, v - 16], px, py); }
      else if (part < 137) this.bigGlyph('=', [70, 66, 60], px, py);
      else if (part < 192) { const v = Math.round(150 + g * 0.4); this.bigGlyph(g > 160 ? '@' : '#', [v, v, v], px, py); }
      else {
        // Bristles: pale at the root, fully loaded with paint toward the tip.
        const t = g / 255, glyph = t > 0.85 ? '/' : t > 0.5 ? '%' : (x + y) % 2 ? '*' : '%';
        if (t < 0.22) { this.bigGlyph(glyph, [222, 214, 196], px, py); continue; }
        if (prism && hash(x, y, frame) < 0.14) { this.bigGlyph('#%@&/|-:'[(hash(y, x, frame) * 8) | 0], prismRgb(hash(x, frame, y)), px + (hash(frame, y, 1) < 0.3 ? cw * 0.4 : 0), py); continue; }
        this.bigGlyph(glyph, this.paintRgb(ci, time, t * 0.6 + y * 0.05), px, py);
      }
    }
    ctx.restore();
    // Reticle: a small character cross on the world grid showing exactly where the paint lands.
    const gcw = this.cw, gch = this.ch, cx = Math.floor(this.cols / 2), cy = Math.floor(this.rows / 2), rgb = this.paintRgb(ci, time);
    for (const [dx, dy, gl] of [[0, 0, 6], [-2, 0, 12], [2, 0, 12], [0, -1, 11], [0, 1, 11]]) {
      ctx.fillStyle = '#000'; ctx.fillRect((cx + dx) * gcw, (cy + dy) * gch, gcw, gch); this.glyphColor(gl, rgb, (cx + dx) * gcw, (cy + dy) * gch);
    }
  }

  // Paint droplets fly out from the reticle as characters: @ then * then . as they fade.
  drawBursts(ctx, dt, time) {
    const cols = this.bcols, rows = this.brows, cw = this.bw, ch = this.bh;
    ctx.save(); ctx.font = this.bigFont; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const bst = this.bursts[i]; bst.age += dt || 0;
      const life = bst.big ? 1.4 : 0.55, t = bst.age / life;
      if (t >= 1) { this.bursts.splice(i, 1); continue; }
      const n = bst.big ? 28 : 8, reach = (bst.big ? 0.42 : 0.1) * Math.min(this.width, this.height), glyph = t < 0.35 ? '@' : t < 0.7 ? '*' : '.';
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + bst.seed, dist = reach * Math.pow(t, 0.6) * (0.55 + ((k * 7 + bst.seed) % 5) / 10);
        const gx = Math.round((this.width / 2 + Math.cos(a) * dist) / cw), gy = Math.round((this.height / 2 + Math.sin(a) * dist * 0.8) / ch);
        if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
        this.bigGlyph(glyph, this.paintRgb(bst.color, time, k / n), gx * cw, gy * ch, 0);
      }
    }
    ctx.restore();
  }

  draw(state, time, dt) {
    const ctx = this.ctx, w = this.width, h = this.height;
    const lightMode = state.realm !== 'forest' && !!(state.quest?.lightMode && state.quest?.lightUnlocked);

    if (lightMode) {
      // Switch = Heavenly Light: show the true illuminated 3D world without the dark ASCII mesh.
      const heaven = this.street.render(state, time, dt, this.reduced, 1.0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(heaven, 0, 0, w, h); ctx.imageSmoothingEnabled = false;
    } else {
      const source = this.street.render(state, time, dt, this.reduced, 0.0), cols = this.cols, rows = this.rows;
      this.read.drawImage(source, 0, 0, cols, rows);
      const data = this.read.getImageData(0, 0, cols, rows).data, L = this.luma;
      for (let i = 0, n = cols * rows; i < n; i++) L[i] = data[i * 4] * 0.2126 + data[i * 4 + 1] * 0.7152 + data[i * 4 + 2] * 0.0722;

      ctx.fillStyle = '#030303'; ctx.fillRect(0, 0, w, h);
      // Soft colour wash: the scene itself, blurred by upscaling, glows faintly behind the glyphs.
      const mono = state.realm === 'street' || state.realm === 'platform' || state.realm === 'paint';
      ctx.globalAlpha = mono ? 0.07 : 0.17; ctx.imageSmoothingEnabled = true; ctx.drawImage(this.sample, 0, 0, w, h); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;

      const cw = this.cw, ch = this.ch, tw = this.tw, th = this.th, gray = this.grayAtlas, color = this.colorAtlas;
      // Glitch bands for Prism paint: a few rows slip sideways for a moment each frame.
      const frame = Math.floor(time * 14), shift = this.rowShift; shift.fill(0);
      if (!this.reduced) for (let b = 0; b < 3; b++) if (hash(frame, b, 3) < 0.45) {
        const start = (hash(frame, b, 7) * rows) | 0, len = 1 + ((hash(b, frame, 9) * 4) | 0), dx = Math.round((hash(frame, 11, b) - 0.5) * 7);
        for (let r = start; r < Math.min(rows, start + len); r++) shift[r] = dx;
      }
      const edgeK = cw / ch, edgeT = this.quality === 0 ? 330 : 380;
      for (let y = 0; y < rows; y++) {
        const drawY = y * ch, inner = y > 0 && y < rows - 1;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x, lum = L[i];
          const noise = ((x * 17 + y * 31) % 13 - 6) * 0.7;
          let value = Math.max(0, Math.min(255, Math.round((lum - 18) * 1.38 + noise)));
          if (value < 7) continue;
          let glyph = Math.min(10, Math.floor(Math.pow(value / 255, 0.71) * 11));
          if (inner && x > 0 && x < cols - 1 && value > 24) {
            const gx = L[i - cols + 1] + 2 * L[i + 1] + L[i + cols + 1] - L[i - cols - 1] - 2 * L[i - 1] - L[i + cols - 1];
            const gy = L[i + cols - 1] + 2 * L[i + cols] + L[i + cols + 1] - L[i - cols - 1] - 2 * L[i - cols] - L[i - cols + 1];
            if (Math.abs(gx) + Math.abs(gy) > edgeT) {
              // Gradient angle in screen space (cells are taller than wide); the edge runs perpendicular to it.
              let a = Math.atan2(gy * edgeK, gx); if (a < 0) a += Math.PI;
              glyph = a < 0.39 || a > 2.75 ? 11 : a < 1.18 ? 13 : a < 1.96 ? 12 : 14;
              // Outline strokes take the brightness of the lit side so silhouettes stay crisp, not dim.
              value = Math.max(value, Math.min(255, Math.round((Math.max(L[i - 1], L[i + 1], L[i - cols], L[i + cols]) - 18) * 1.38)));
            }
          }
          const o = i * 4, r = data[o], g = data[o + 1], b = data[o + 2], hi = Math.max(r, g, b), lo = Math.min(r, g, b);
          if (hi >= 225 && lo <= 30 && hi - lo >= 195) {
            // Prism paint: pure rainbow hues. Scramble some characters, slip glitch bands, add colour ghosts.
            const n = hash(x, y, frame), px = (x + shift[y]) * cw;
            const gl = !this.reduced && n < 0.16 ? GLITCH[(hash(y, x, frame) * GLITCH.length) | 0] : Math.max(glyph, 6);
            if (!this.reduced && n > 0.975) ctx.drawImage(gray, gl * tw, (GRAY_LEVELS - 1) * th, tw, th, px, drawY, cw, ch);
            else this.glyphColor(gl, [r, g, b], px, drawY);
            if (!this.reduced && n > 0.93 && n <= 0.975) { ctx.globalAlpha = 0.45; this.glyphColor(gl, n > 0.95 ? [255, 0, 200] : [0, 230, 255], px + cw, drawY); ctx.globalAlpha = 1; }
            continue;
          }
          if (hi - lo > 26) {
            // Coloured glyph: normalise the hue toward full brightness, density still carries the shading.
            const k = Math.min(2.6, 235 / Math.max(1, hi)), q = (c) => Math.min(5, Math.round(c * k / 51));
            ctx.drawImage(color, glyph * tw, (q(r) * 36 + q(g) * 6 + q(b)) * th, tw, th, x * cw, drawY, cw, ch);
          } else {
            ctx.drawImage(gray, glyph * tw, Math.min(GRAY_LEVELS - 1, value * GRAY_LEVELS >> 8) * th, tw, th, x * cw, drawY, cw, ch);
          }
        }
      }

      ctx.drawImage(this.vignette, 0, 0, w, h);
    }

    // Combat feedback, paint droplets and the brush in hand.
    const rt = state.runtime;
    if (rt?.hurtFlash > 0.01) {
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(255,48,88,${rt.hurtFlash * 0.45})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    }
    this.drawBursts(ctx, dt, time);
    this.drawBrushOverlay(ctx, state, time);
  }

  toggle() { this.quality = 1 - this.quality; this.resize(); return this.quality === 0 ? 'HIGH' : 'LOW'; }
}
