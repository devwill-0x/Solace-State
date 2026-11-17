// Every visible surface is rebuilt from printable characters (or broken open
// with the Lightbreaker Sword to reveal the Heavenly 3D world), blended with
// liquid-glass distortion and transparent 3D glass mirror reflections.

const PALETTES=[
  null, // 0: monochrome print
  [255,95,185],  // 1: rose-magenta
  [255,175,75],  // 2: solar amber-gold
  [90,250,165],  // 3: emerald-mint
  [65,235,255],  // 4: electric cyan
  [105,155,255], // 5: celestial azure
  [180,105,255], // 6: ultraviolet-indigo
  [245,115,255], // 7: orchid-violet
  [245,250,255]  // 8: prismatic opal
];

export class Ascii {
  constructor(canvas,street){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.street=street;
    this.sample=document.createElement('canvas');this.read=this.sample.getContext('2d',{willReadFrequently:true,alpha:false});
    this.quality=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tears=[];
    this.resize();window.addEventListener('resize',()=>this.resize());
  }

  resize(){
    const w=innerWidth,h=innerHeight;this.width=w;this.height=h;
    const target=this.quality===0?(w<600?3.35:5.25):(w<600?5:7.7);
    this.cols=Math.max(70,Math.min(350,Math.round(w/target)));this.cw=w/this.cols;this.ch=this.cw*1.85;this.rows=Math.ceil(h/this.ch);
    const dpr=Math.min(devicePixelRatio||1,2);this.dpr=dpr;
    this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.imageSmoothingEnabled=false;
    this.sample.width=this.cols;this.sample.height=this.rows;
    this.street.resize(Math.min(w,1120),Math.min(h,700),w/h);this.makeAtlas();
  }

  makeAtlas(){
    this.tw=Math.ceil(this.cw*this.dpr);this.th=Math.ceil(this.ch*this.dpr);
    const a=document.createElement('canvas'),rowsPerPalette=16;
    a.width=this.tw*16;a.height=this.th*rowsPerPalette*PALETTES.length;
    const c=a.getContext('2d');
    c.font=`${Math.round(this.ch*this.dpr*.94)}px Consolas,'Courier New',monospace`;
    c.textAlign='center';c.textBaseline='middle';
    const ramps=[' .,:;/*%&#@',' .,:;/*%&@#',' .,:;/*%#&@',' .,:;/*%&#@'];
    for(let p=0;p<PALETTES.length;p++){
      const tint=PALETTES[p],yOff=p*rowsPerPalette*this.th;
      for(let i=0;i<256;i++){
        const v=i/255,level=Math.min(10,Math.floor(Math.pow(v,.71)*11)),char=ramps[i%4][level];
        const gray=Math.min(235,Math.round(80+Math.pow(v,.45)*155));
        if(!tint){
          c.fillStyle=`rgb(${gray},${gray},${Math.round(gray*.97)})`;
        }else{
          const mix=.42+.58*Math.pow(v,.55);
          const r=Math.min(255,Math.round(gray*.28+tint[0]*mix));
          const g=Math.min(255,Math.round(gray*.28+tint[1]*mix));
          const b=Math.min(255,Math.round(gray*.32+tint[2]*mix));
          c.fillStyle=`rgb(${r},${g},${b})`;
        }
        c.fillText(char,(i%16+.5)*this.tw,yOff+(Math.floor(i/16)+.5)*this.th);
      }
    }
    this.atlas=a;this.paletteHeight=16*this.th;
    this.colors=document.createElement('canvas');this.colors.width=this.tw*11;this.colors.height=this.th*64;
    const cc=this.colors.getContext('2d');cc.font=c.font;cc.textAlign='center';cc.textBaseline='middle';
    for(let color=0;color<64;color++){
      cc.fillStyle=`rgb(${(color>>4)*64+42},${((color>>2)&3)*64+42},${(color&3)*64+42})`;
      for(let k=0;k<11;k++)cc.fillText(ramps[0][k],(k+.5)*this.tw,(color+.5)*this.th);
    }
  }

  addSlashTear(dir=1,major=false){
    this.tears.push({
      dir,
      age:0,
      maxAge:major?3.8:2.4,
      spread:major?0.30:0.17,
      seed:Math.random()*100
    });
    if(this.tears.length>4)this.tears.shift();
  }

  traceTearPath(ctx,tear){
    const w=this.width,h=this.height;
    const progress=tear.age/tear.maxAge;
    const env=Math.min(1,tear.age*14)*Math.pow(Math.max(0,1-progress),.7);
    if(env<=.01)return false;
    const halfW=w*tear.spread*env;
    const x0=w*(tear.dir>0?.18:.82),y0=h*.20;
    const x1=w*(tear.dir>0?.82:.18),y1=h*.76;
    const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len;
    const segs=12,topPts=[],botPts=[];
    for(let i=0;i<=segs;i++){
      const t=i/segs;
      const arch=Math.sin(t*Math.PI);
      const jitter=(Math.sin(t*29+tear.seed)*0.3+0.7)*halfW*arch;
      const cx=x0+dx*t,cy=y0+dy*t;
      const jag=Math.sin(t*19+tear.seed*2.1)*12*env*arch;
      topPts.push([cx+nx*(jitter+jag),cy+ny*(jitter+jag)]);
      botPts.push([cx-nx*(jitter-jag),cy-ny*(jitter-jag)]);
    }
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    for(const [x,y] of topPts)ctx.lineTo(x,y);
    ctx.lineTo(x1,y1);
    for(let i=botPts.length-1;i>=0;i--)ctx.lineTo(botPts[i][0],botPts[i][1]);
    ctx.closePath();
    return env;
  }

  drawSwordOverlay(ctx,state,time){
    if(!state.quest?.sword||state.ride)return;
    const rt=state.runtime;
    const swing=rt?.swingTimer?rt.swingTimer/0.36:0;
    const w=this.width,h=this.height;
    const bobX=state.moving?Math.sin(state.distance*5.2)*8:Math.sin(time*1.5)*2;
    const bobY=state.moving?Math.abs(Math.cos(state.distance*5.2))*10:Math.cos(time*1.5)*3;

    ctx.save();
    if(swing>0){
      const dir=rt.swingDir||1;
      const p=1-swing;
      const cx=w*(dir>0?(0.85-p*0.72):(0.15+p*0.72));
      const cy=h*(0.72-Math.sin(p*Math.PI)*0.34);
      ctx.translate(cx,cy);
      ctx.rotate((dir>0?-1.35:1.35)+dir*p*1.9);

      // Luminous crescent slash trail
      ctx.save();
      ctx.globalCompositeOperation='screen';
      const arcG=ctx.createRadialGradient(0,-h*.18,8,0,-h*.18,h*.28);
      arcG.addColorStop(0,'rgba(255,255,255,0.85)');
      arcG.addColorStop(.45,'rgba(120,242,255,0.45)');
      arcG.addColorStop(1,'rgba(255,150,235,0)');
      ctx.fillStyle=arcG;ctx.beginPath();ctx.arc(0,-h*.18,h*.28,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }else{
      ctx.translate(w*.83+bobX,h*.95+bobY);
      ctx.rotate(-0.34+Math.sin(time*1.3)*0.02);
    }

    const len=Math.min(h*.44,320);
    // Crystalline translucent blade
    const bg=ctx.createLinearGradient(-16,-len,16,0);
    bg.addColorStop(0,'rgba(255,255,255,0.95)');
    bg.addColorStop(0.3,'rgba(145,244,255,0.85)');
    bg.addColorStop(0.65,'rgba(198,165,255,0.82)');
    bg.addColorStop(1,'rgba(255,220,155,0.9)');
    ctx.fillStyle=bg;
    ctx.beginPath();
    ctx.moveTo(0,-len);
    ctx.lineTo(13,-len*.18);
    ctx.lineTo(7,-8);
    ctx.lineTo(-7,-8);
    ctx.lineTo(-13,-len*.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.95)';
    ctx.lineWidth=1.6;
    ctx.stroke();

    // Inner prism ridge
    ctx.beginPath();ctx.moveTo(0,-len*.94);ctx.lineTo(0,-10);
    ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;ctx.stroke();

    // Crossguard & hilt
    ctx.fillStyle='#f6d992';
    ctx.fillRect(-26,-10,52,8);
    ctx.fillStyle='#2a2c38';
    ctx.fillRect(-5,-2,10,56);
    ctx.restore();
  }

  draw(state,time,dt){
    for(let i=this.tears.length-1;i>=0;i--){
      this.tears[i].age+=dt||0;
      if(this.tears[i].age>=this.tears[i].maxAge)this.tears.splice(i,1);
    }

    const ctx=this.ctx,w=this.width,h=this.height;
    const lightMode=!!(state.quest?.lightMode&&state.quest?.lightUnlocked);

    if(lightMode){
      // Switch = Heavenly Light: show the true illuminated 3D world cleanly without the dark ASCII mesh
      const heavenCanvas=this.street.render(state,time,dt,this.reduced,1.0);
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(heavenCanvas,0,0,w,h);
      ctx.imageSmoothingEnabled=false;
    }else{
      const source=this.street.render(state,time,dt,this.reduced,0.0),cols=this.cols,rows=this.rows;
      this.read.drawImage(source,0,0,cols,rows);
      const data=this.read.getImageData(0,0,cols,rows).data;
      ctx.fillStyle='#030303';ctx.fillRect(0,0,w,h);

      const cw=this.cw,ch=this.ch,tw=this.tw,th=this.th,palH=this.paletteHeight;
      for(let y=0;y<rows;y++){
        const py=(y+.5)*ch;
        for(let x=0;x<cols;x++){
          const px=(x+.5)*cw;
          let hole=0,warpX=0,warpY=0,hueShift=0,glassTint=0;

          const wave=Math.sin(x*.11+time*1.9)*Math.cos(y*.13-time*1.5);
          warpX+=wave*.38;
          warpY+=Math.cos(x*.09-y*.12+time*1.7)*.32;

          if(hole>.72)continue;

          const sx=Math.max(0,Math.min(cols-1,Math.round(x+warpX)));
          const sy=Math.max(0,Math.min(rows-1,Math.round(y+warpY)));
          const i=(sy*cols+sx)*4;
          const luma=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;
          const noise=((x*17+y*31)%13-6)*.7;
          const boost=glassTint>.12?glassTint*48:0;
          const value=Math.max(0,Math.min(255,Math.round((luma-18+boost)*1.38+noise)));
          if(value<7)continue;

          const drawX=x*cw+warpX*1.35,drawY=y*ch+warpY*1.35;
          if(glassTint<=.14&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>25){
            const color=((data[i]>>6)<<4)|((data[i+1]>>6)<<2)|(data[i+2]>>6),level=Math.min(10,Math.floor(Math.pow(value/255,.71)*11));
            ctx.drawImage(this.colors,level*tw,color*th,tw,th,drawX,drawY,cw,ch);
            continue;
          }
          let pal=0;
          if(glassTint>.14){
            const norm=((hueShift%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
            pal=1+(Math.floor((norm/(Math.PI*2))*8)%8);
          }
          if(hole>.08){
            ctx.globalAlpha=Math.max(.08,1-hole*1.25);
            ctx.drawImage(this.atlas,(value%16)*tw,pal*palH+Math.floor(value/16)*th,tw,th,drawX,drawY,cw,ch);
            ctx.globalAlpha=1;
          }else{
            ctx.drawImage(this.atlas,(value%16)*tw,pal*palH+Math.floor(value/16)*th,tw,th,drawX,drawY,cw,ch);
          }
        }
      }

      // Draw transparent glass reflection cleanly over mirror backdrop ASCII

      // Sword mesh-break rifts revealing the Heavenly 3D world inside the dark ASCII veil
      if(this.tears.length){
        const heavenCanvas=this.street.render(state,time,0,this.reduced,1.0);
        for(const tear of this.tears){
          ctx.save();
          const env=this.traceTearPath(ctx,tear);
          if(env){
            ctx.save();
            ctx.clip();
            ctx.imageSmoothingEnabled=true;
            ctx.drawImage(heavenCanvas,0,0,w,h);
                  ctx.restore();
            ctx.strokeStyle=`rgba(255,244,210,${0.92*env})`;
            ctx.lineWidth=3.5*env;
            ctx.shadowColor='#7eeeff';
            ctx.shadowBlur=18*env;
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.imageSmoothingEnabled=false;
      }
    }

    // Combat feedback flashes + first-person sword
    const rt=state.runtime;
    if(rt?.hurtFlash>0.01){
      const vg=ctx.createRadialGradient(w*.5,h*.5,Math.min(w,h)*.25,w*.5,h*.5,Math.max(w,h)*.72);
      vg.addColorStop(0,'rgba(0,0,0,0)');
      vg.addColorStop(1,`rgba(255,48,88,${rt.hurtFlash*0.45})`);
      ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
    }
    this.drawSwordOverlay(ctx,state,time);
  }

  toggle(){this.quality=1-this.quality;this.resize();return this.quality===0?'HIGH':'LOW';}
}
