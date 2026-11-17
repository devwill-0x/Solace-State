// Every visible surface is rebuilt from printable characters, blended with
// liquid-glass distortion, a look-down rainbow
// body aura, and 3D iridescent glass mirror reflections.
import {GlassFigureRenderer} from './glass-figure.js';
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
    this.glassFigure=new GlassFigureRenderer();
    this.quality=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    this.street.resize(this.cols,this.rows,w/h);this.makeAtlas();
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
  drawGlassFigure(ctx,mx,my,mw,mh,cx,cy,figH,time,state){
    const glassCanvas=this.glassFigure?.render(time,state);
    if(glassCanvas){
      const gw=glassCanvas.width,gh=glassCanvas.height;
      const drawH=Math.max(mh*.86,Math.min(mh*1.04,figH*1.12));
      const drawW=drawH*(gw/gh);
      const dx=Math.max(mx-drawW*.12,Math.min(mx+mw-drawW*.88,cx-drawW*.5));
      const dy=cy-drawH*.5;
      ctx.drawImage(glassCanvas,dx,dy,drawW,drawH);
      return;
    }
    const halo=ctx.createRadialGradient(cx,cy,figH*.05,cx,cy,figH*.55);
    halo.addColorStop(0,'rgba(120,185,255,.32)');halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.ellipse(cx,cy,figH*.22,figH*.46,0,0,Math.PI*2);ctx.fill();
  }
  drawLookDownAura(ctx,state,time,lookDown){
    if(lookDown<=.01)return 0;
    const w=this.width,h=this.height;
    const cx=w*.5+Math.sin(state.distance*3.5)*w*.018;
    const cy=h*(1.08-lookDown*.46);
    const radius=Math.min(w,h)*(.34+lookDown*.26);
    ctx.save();
    ctx.globalCompositeOperation='screen';

    const numRays=26;
    for(let i=0;i<numRays;i++){
      const a=-Math.PI+(i/(numRays-1))*Math.PI*1.35-.175*Math.PI+Math.sin(time*.4+i)*.04;
      const len=radius*(.85+.35*Math.sin(time*1.8+i*2.3));
      const hue=(i*16+time*32)%360;
      const rg=ctx.createLinearGradient(cx,cy,cx+Math.cos(a)*len,cy+Math.sin(a)*len);
      rg.addColorStop(0,`hsla(${hue},100%,90%,${.55*lookDown})`);
      rg.addColorStop(.5,`hsla(${(hue+50)%360},98%,68%,${.32*lookDown})`);
      rg.addColorStop(1,`hsla(${(hue+95)%360},95%,55%,0)`);
      ctx.strokeStyle=rg;ctx.lineWidth=3+2*Math.sin(i+time*2);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*len,cy+Math.sin(a)*len);ctx.stroke();
    }

    const g=ctx.createRadialGradient(cx,cy,radius*.04,cx,cy,radius);
    const baseHue=(time*24)%360;
    g.addColorStop(0,`rgba(255,255,255,${.92*lookDown})`);
    g.addColorStop(.16,`hsla(${(baseHue+165)%360},100%,74%,${.78*lookDown})`);
    g.addColorStop(.34,`hsla(${(baseHue+330)%360},98%,68%,${.64*lookDown})`);
    g.addColorStop(.54,`hsla(${(baseHue+265)%360},96%,64%,${.50*lookDown})`);
    g.addColorStop(.76,`hsla(${(baseHue+48)%360},100%,68%,${.34*lookDown})`);
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(cx,cy,radius*1.08,radius*.88,0,0,Math.PI*2);ctx.fill();

    const stride=Math.sin(state.distance*5.2);
    for(const side of [-1,1]){
      const fx=cx+side*radius*.24,fy=cy-radius*(.18+side*stride*.12);
      const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,radius*.24);
      fg.addColorStop(0,`hsla(${(baseHue+(side<0?180:300))%360},100%,92%,${.72*lookDown})`);
      fg.addColorStop(.5,`hsla(${(baseHue+(side<0?220:45))%360},98%,68%,${.38*lookDown})`);
      fg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(fx,fy,radius*.16,radius*.24,side*-.15,0,Math.PI*2);ctx.fill();
    }

    for(let r=1;r<=4;r++){
      const phase=((time*.85+r*.25)%1);
      const rw=radius*(.3+phase*.85),rh=rw*.52;
      ctx.strokeStyle=`hsla(${(baseHue+r*65)%360},100%,80%,${(1-phase)*.45*lookDown})`;
      ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(cx,cy,rw,rh,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    return {cx,cy,radius,lookDown};
  }
  draw(state,time,dt){
    const source=this.street.render(state,time,dt,this.reduced),cols=this.cols,rows=this.rows;
    this.read.drawImage(source,0,0,cols,rows);
    const data=this.read.getImageData(0,0,cols,rows).data,ctx=this.ctx;
    const w=this.width,h=this.height;
    ctx.fillStyle='#030303';ctx.fillRect(0,0,w,h);

    const mirrors=this.street.projectMirrors?.(state)||[];
    const pitch=state.player?.pitch||0;
    const lookDown=Math.max(0,Math.min(1,(-pitch-.08)/.58));

    const downAura=lookDown>.01?this.drawLookDownAura(ctx,state,time,lookDown):null;

    for(const m of mirrors){
      const mx=m.u0*w,my=m.v0*h,mw=m.w*w,mh=m.h*h;
      ctx.save();
      ctx.beginPath();ctx.rect(mx,my,mw,mh);ctx.clip();
      ctx.fillStyle='#212d3c';ctx.fillRect(mx,my,mw,mh);
      this.drawGlassFigure(ctx,mx,my,mw,mh,m.rx*w,m.ry*h,Math.max(mh*.62,Math.min(mh*.9,m.figH*h)),time,state);
      ctx.strokeStyle='rgba(190,220,255,.35)';ctx.lineWidth=1.5;ctx.strokeRect(mx+1,my+1,mw-2,mh-2);
      ctx.restore();
    }

    const cw=this.cw,ch=this.ch,tw=this.tw,th=this.th,palH=this.paletteHeight;
    for(let y=0;y<rows;y++){
      const py=(y+.5)*ch;
      for(let x=0;x<cols;x++){
        const px=(x+.5)*cw;
        let hole=0,warpX=0,warpY=0,hueShift=0,glassTint=0;

        const wave=Math.sin(x*.11+time*1.9)*Math.cos(y*.13-time*1.5);
        warpX+=wave*.38;
        warpY+=Math.cos(x*.09-y*.12+time*1.7)*.32;

        if(downAura){
          const dx=px-downAura.cx,dy=(py-downAura.cy)*1.18,d=Math.hypot(dx,dy),r=downAura.radius;
          if(d<r*1.35){
            const t=Math.max(0,1-d/(r*1.35))*downAura.lookDown;
            const ripple=Math.sin(d*.16-time*4.8)*t*3.1;
            const inv=1/(d+10);
            warpX+=dx*inv*ripple;warpY+=dy*inv*ripple;
            const core=Math.max(0,1-d/(r*.76))*downAura.lookDown*.92;
            if(core>hole)hole=core;
            if(t>glassTint){glassTint=t;hueShift=Math.atan2(dy,dx)+time*1.2+d*.015;}
          }
        }

        for(let mIdx=0;mIdx<mirrors.length;mIdx++){
          const m=mirrors[mIdx],mx0=m.u0*w,mx1=m.u1*w,my0=m.v0*h,my1=m.v1*h;
          const pad=14;
          if(px>=mx0-pad&&px<=mx1+pad&&py>=my0-pad&&py<=my1+pad){
            const inX=px>=mx0&&px<=mx1,inY=py>=my0&&py<=my1;
            if(inX&&inY){
              hole=1;
            }else{
              const dEdge=Math.hypot(px<mx0?mx0-px:px>mx1?px-mx1:0,py<my0?my0-py:py>my1?py-my1:0);
              const t=Math.max(0,1-dEdge/pad);
              warpX+=Math.sin(py*.15+time*3.5)*t*1.6;
              warpY+=Math.cos(px*.15-time*3.2)*t*1.6;
              if(t*.65>glassTint){glassTint=t*.65;hueShift=time+dEdge*.12;}
            }
          }
        }

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
  }
  toggle(){this.quality=1-this.quality;this.resize();return this.quality===0?'HIGH':'LOW';}
}
