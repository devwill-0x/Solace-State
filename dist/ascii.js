// Every visible surface is rebuilt from printable characters (or broken open
// with the Lightbreaker Sword to reveal the Heavenly 3D world), blended with
// liquid-glass distortion and 3D glass reflections.

export class Ascii {
  constructor(canvas, street) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.street = street;
    this.sample = document.createElement('canvas');
    this.read = this.sample.getContext('2d', { willReadFrequently: true, alpha: false });
    this.quality = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tears = [];
    this.highRes = false;
    this.levelLut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      this.levelLut[i] = Math.min(10, Math.floor(Math.pow(i / 255, 0.71) * 11));
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.width = w;
    this.height = h;
    const target = this.quality === 0 ? (w < 600 ? 3.35 : 5.25) : (w < 600 ? 5 : 7.7);
    this.cols = Math.max(70, Math.min(350, Math.round(w / target)));
    this.cw = w / this.cols;
    this.ch = this.cw * 1.85;
    this.rows = Math.ceil(h / this.ch);
    // Keep the output and glyph sheets within browser canvas limits.
    const dpr = Math.min(devicePixelRatio || 1, 2, 4096 / Math.max(w, h), Math.sqrt(12000000 / (w * h)));
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.frameImg = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    this.frame32 = new Uint32Array(this.frameImg.data.buffer);
    this.sample.width = this.cols;
    this.sample.height = this.rows;
    this._sinX1 = new Float32Array(this.cols);
    this._cosX2 = new Float32Array(this.cols);
    this._sinX2 = new Float32Array(this.cols);
    this._cosY1 = new Float32Array(this.rows);
    this._cosY2 = new Float32Array(this.rows);
    this._sinY2 = new Float32Array(this.rows);
    this.syncResolution(this.highRes, true);
    this.makeAtlas();
  }

  syncResolution(needHighRes, force = false) {
    if (!force && this.highRes === needHighRes) return;
    this.highRes = needHighRes;
    const w = this.width, h = this.height, aspect = w / h;
    if (needHighRes) {
      this.street.resize(Math.min(w, 1120), Math.min(h, 700), aspect);
    } else {
      this.street.resize(this.cols, this.rows, aspect);
    }
  }

  makeAtlas() {
    const tw = Math.ceil(this.cw * this.dpr);
    const th = Math.ceil(this.ch * this.dpr);
    this.tw = tw;
    this.th = th;
    const font = `${Math.round(this.ch * this.dpr * 0.94)}px Consolas,'Courier New',monospace`;
    const ramps = [' .,:;/*%&#@', ' .,:;/*%&@#', ' .,:;/*%#&@', ' .,:;/*%&#@'];

    const a = document.createElement('canvas');
    a.width = tw * 16;
    a.height = th * 16;
    const c = a.getContext('2d', { alpha: false });
    c.fillStyle = '#030303';
    c.fillRect(0, 0, a.width, a.height);
    c.font = font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < 256; i++) {
      const v = i / 255;
      const char = ramps[i & 3][this.levelLut[i]];
      const gray = Math.min(235, Math.round(80 + Math.pow(v, 0.45) * 155));
      c.fillStyle = `rgb(${gray},${gray},${Math.round(gray * 0.97)})`;
      c.fillText(char, ((i & 15) + 0.5) * tw, ((i >> 4) + 0.5) * th);
    }
    const aData = new Uint32Array(c.getImageData(0, 0, a.width, a.height).data.buffer);
    const bg32 = aData[0];
    this.bg32 = bg32;

    const tileSize = tw * th;
    const extractTile = (src, srcW, ox, oy) => {
      const out = new Uint32Array(tileSize);
      for (let ry = 0; ry < th; ry++) {
        const sRow = (oy + ry) * srcW + ox;
        const dRow = ry * tw;
        for (let rx = 0; rx < tw; rx++) out[dRow + rx] = src[sRow + rx];
      }
      return out;
    };

    this.monoTiles = new Array(256);
    for (let i = 0; i < 256; i++) {
      this.monoTiles[i] = extractTile(aData, a.width, (i & 15) * tw, (i >> 4) * th);
    }

    const colCanvas = document.createElement('canvas');
    const colorColumns = 8;
    colCanvas.width = tw * 11 * colorColumns;
    colCanvas.height = th * 8;
    const cc = colCanvas.getContext('2d', { alpha: false });
    cc.fillStyle = '#030303';
    cc.fillRect(0, 0, colCanvas.width, colCanvas.height);
    cc.font = font;
    cc.textAlign = 'center';
    cc.textBaseline = 'middle';
    for (let color = 0; color < 64; color++) {
      cc.fillStyle = `rgb(${(color >> 4) * 64 + 42},${((color >> 2) & 3) * 64 + 42},${(color & 3) * 64 + 42})`;
      for (let k = 0; k < 11; k++) cc.fillText(ramps[0][k], ((color % colorColumns) * 11 + k + 0.5) * tw, (Math.floor(color / colorColumns) + 0.5) * th);
    }
    const cData = new Uint32Array(cc.getImageData(0, 0, colCanvas.width, colCanvas.height).data.buffer);
    this.colorTiles = new Array(64 * 11);
    for (let color = 0; color < 64; color++) {
      for (let k = 0; k < 11; k++) {
        this.colorTiles[color * 11 + k] = extractTile(cData, colCanvas.width, ((color % colorColumns) * 11 + k) * tw, Math.floor(color / colorColumns) * th);
      }
    }
  }

  addSlashTear(dir = 1, major = false) {
    this.tears.push({
      dir,
      age: 0,
      maxAge: major ? 3.8 : 2.4,
      spread: major ? 0.30 : 0.17,
      seed: Math.random() * 100
    });
    if (this.tears.length > 4) this.tears.shift();
  }

  traceTearPath(ctx, tear) {
    const w = this.width, h = this.height;
    const progress = tear.age / tear.maxAge;
    const env = Math.min(1, tear.age * 14) * Math.pow(Math.max(0, 1 - progress), 0.7);
    if (env <= 0.01) return false;
    const halfW = w * tear.spread * env;
    const x0 = w * (tear.dir > 0 ? 0.18 : 0.82), y0 = h * 0.20;
    const x1 = w * (tear.dir > 0 ? 0.82 : 0.18), y1 = h * 0.76;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const segs = 12, topPts = [], botPts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const arch = Math.sin(t * Math.PI);
      const jitter = (Math.sin(t * 29 + tear.seed) * 0.3 + 0.7) * halfW * arch;
      const cx = x0 + dx * t, cy = y0 + dy * t;
      const jag = Math.sin(t * 19 + tear.seed * 2.1) * 12 * env * arch;
      topPts.push([cx + nx * (jitter + jag), cy + ny * (jitter + jag)]);
      botPts.push([cx - nx * (jitter - jag), cy - ny * (jitter - jag)]);
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for (const [x, y] of topPts) ctx.lineTo(x, y);
    ctx.lineTo(x1, y1);
    for (let i = botPts.length - 1; i >= 0; i--) ctx.lineTo(botPts[i][0], botPts[i][1]);
    ctx.closePath();
    return env;
  }

  drawSwordOverlay(ctx, state, time) {
    if (!state.quest?.sword || state.ride) return;
    const rt = state.runtime;
    const swing = rt?.swingTimer ? rt.swingTimer / 0.36 : 0;
    const w = this.width, h = this.height;
    const bobX = state.moving ? Math.sin(state.distance * 5.2) * 8 : Math.sin(time * 1.5) * 2;
    const bobY = state.moving ? Math.abs(Math.cos(state.distance * 5.2)) * 10 : Math.cos(time * 1.5) * 3;

    ctx.save();
    if (swing > 0) {
      const dir = rt.swingDir || 1;
      const p = 1 - swing;
      const cx = w * (dir > 0 ? (0.85 - p * 0.72) : (0.15 + p * 0.72));
      const cy = h * (0.72 - Math.sin(p * Math.PI) * 0.34);
      ctx.translate(cx, cy);
      ctx.rotate((dir > 0 ? -1.35 : 1.35) + dir * p * 1.9);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const arcG = ctx.createRadialGradient(0, -h * 0.18, 8, 0, -h * 0.18, h * 0.28);
      arcG.addColorStop(0, 'rgba(255,255,255,0.85)');
      arcG.addColorStop(0.45, 'rgba(120,242,255,0.45)');
      arcG.addColorStop(1, 'rgba(255,150,235,0)');
      ctx.fillStyle = arcG;
      ctx.beginPath();
      ctx.arc(0, -h * 0.18, h * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.translate(w * 0.83 + bobX, h * 0.95 + bobY);
      ctx.rotate(-0.34 + Math.sin(time * 1.3) * 0.02);
    }

    const len = Math.min(h * 0.44, 320);
    const bg = ctx.createLinearGradient(-16, -len, 16, 0);
    bg.addColorStop(0, 'rgba(255,255,255,0.95)');
    bg.addColorStop(0.3, 'rgba(145,244,255,0.85)');
    bg.addColorStop(0.65, 'rgba(198,165,255,0.82)');
    bg.addColorStop(1, 'rgba(255,220,155,0.9)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(13, -len * 0.18);
    ctx.lineTo(7, -8);
    ctx.lineTo(-7, -8);
    ctx.lineTo(-13, -len * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -len * 0.94);
    ctx.lineTo(0, -10);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f6d992';
    ctx.fillRect(-26, -10, 52, 8);
    ctx.fillStyle = '#2a2c38';
    ctx.fillRect(-5, -2, 10, 56);
    ctx.restore();
  }

  draw(state, time, dt) {
    for (let i = this.tears.length - 1; i >= 0; i--) {
      this.tears[i].age += dt || 0;
      if (this.tears[i].age >= this.tears[i].maxAge) this.tears.splice(i, 1);
    }

    const ctx = this.ctx, w = this.width, h = this.height;
    const lightMode = !!(state.quest?.lightMode && state.quest?.lightUnlocked);
    const hasTears = this.tears.length > 0;
    this.syncResolution(lightMode || hasTears);

    if (lightMode) {
      const heavenCanvas = this.street.render(state, time, dt, this.reduced, 1.0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(heavenCanvas, 0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
    } else {
      const source = this.street.render(state, time, dt, this.reduced, 0.0);
      const cols = this.cols, rows = this.rows;
      this.read.drawImage(source, 0, 0, cols, rows);
      const data = this.read.getImageData(0, 0, cols, rows).data;

      const dpr = this.dpr;
      const cwPx = this.cw * dpr, chPx = this.ch * dpr, warpScale = 1.35 * dpr;
      const tw = this.tw, th = this.th;
      const outW = this.canvas.width, outH = this.canvas.height;
      const frame32 = this.frame32, bg32 = this.bg32;
      const monoTiles = this.monoTiles, colorTiles = this.colorTiles, levelLut = this.levelLut;
      const sinX1 = this._sinX1, cosX2 = this._cosX2, sinX2 = this._sinX2;
      const cosY1 = this._cosY1, cosY2 = this._cosY2, sinY2 = this._sinY2;

      const t1 = time * 1.9, t2 = time * 1.5, t3 = time * 1.7;
      for (let x = 0; x < cols; x++) {
        sinX1[x] = Math.sin(x * 0.11 + t1) * 0.38;
        const a = x * 0.09 + t3;
        cosX2[x] = Math.cos(a) * 0.32;
        sinX2[x] = Math.sin(a) * 0.32;
      }
      for (let y = 0; y < rows; y++) {
        cosY1[y] = Math.cos(y * 0.13 - t2);
        const b = y * 0.12;
        cosY2[y] = Math.cos(b);
        sinY2[y] = Math.sin(b);
      }

      // Single-pass Uint32 tile blitting replaces ~20,000 ctx.drawImage calls with 1 putImageData
      frame32.fill(bg32);

      const maxCol = cols - 1, maxRow = rows - 1;
      for (let y = 0; y < rows; y++) {
        const cy1 = cosY1[y], cy2 = cosY2[y], sy2 = sinY2[y];
        const baseY = y * chPx;
        const y31 = y * 31;
        for (let x = 0; x < cols; x++) {
          const warpX = sinX1[x] * cy1;
          const warpY = cosX2[x] * cy2 + sinX2[x] * sy2;

          let sx = (x + warpX + 0.5) | 0;
          if (sx < 0) sx = 0; else if (sx > maxCol) sx = maxCol;
          let sy = (y + warpY + 0.5) | 0;
          if (sy < 0) sy = 0; else if (sy > maxRow) sy = maxRow;

          const i = (sy * cols + sx) << 2;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
          const noise = (((x * 17 + y31) % 13) - 6) * 0.7;
          let value = ((luma - 18) * 1.38 + noise + 0.5) | 0;
          if (value < 7) continue;
          if (value > 255) value = 255;

          const drawX = (x * cwPx + warpX * warpScale) | 0;
          const drawY = (baseY + warpY * warpScale) | 0;

          const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
          const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
          const tile = (maxC - minC > 25)
            ? colorTiles[((((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6)) * 11) + levelLut[value]]
            : monoTiles[value];

          const rx0 = drawX < 0 ? -drawX : 0;
          const rx1 = drawX + tw > outW ? outW - drawX : tw;
          const ry0 = drawY < 0 ? -drawY : 0;
          const ry1 = drawY + th > outH ? outH - drawY : th;
          for (let ry = ry0; ry < ry1; ry++) {
            const dRow = (drawY + ry) * outW + drawX;
            const sRow = ry * tw;
            for (let rx = rx0; rx < rx1; rx++) {
              const px = tile[sRow + rx];
              if (px !== bg32) frame32[dRow + rx] = px;
            }
          }
        }
      }
      ctx.putImageData(this.frameImg, 0, 0);

      if (hasTears) {
        const heavenCanvas = this.street.render(state, time, 0, this.reduced, 1.0);
        for (const tear of this.tears) {
          ctx.save();
          const env = this.traceTearPath(ctx, tear);
          if (env) {
            ctx.save();
            ctx.clip();
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(heavenCanvas, 0, 0, w, h);
            ctx.restore();
            ctx.strokeStyle = `rgba(255,244,210,${0.92 * env})`;
            ctx.lineWidth = 3.5 * env;
            ctx.shadowColor = '#7eeeff';
            ctx.shadowBlur = 18 * env;
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.imageSmoothingEnabled = false;
      }
    }

    const rt = state.runtime;
    if (rt?.hurtFlash > 0.01) {
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(255,48,88,${rt.hurtFlash * 0.45})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }
    this.drawSwordOverlay(ctx, state, time);
  }

  toggle() {
    this.quality = 1 - this.quality;
    this.resize();
    return this.quality === 0 ? 'HIGH' : 'LOW';
  }
}
