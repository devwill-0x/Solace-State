// Every visible surface is rebuilt from printable characters, blended with
// liquid-glass distortion, drifting non-ASCII aura pockets, a look-down rainbow
// body aura, and full-body prismatic mirror reflections.
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
const STREET_AURA_NODES=[
  {x:-1.8,y:1.55,z:2.5,kind:0,hue:0},
  {x:2.0,y:1.35,z:-6.5,kind:1,hue:1.1},
  {x:-5.6,y:1.65,z:-13.0,kind:2,hue:2.2},
  {x:-1.7,y:1.5,z:-16.5,kind:3,hue:3.3},
  {x:5.6,y:1.55,z:-22.0,kind:4,hue:4.4},
  {x:1.8,y:1.5,z:-26.0,kind:5,hue:5.2},
  {x:0,y:1.85,z:-33.5,kind:0,hue:3.9}
];
const REALM_AURA_NODES=[
  {x:-3.2,y:1.7,z:-90,kind:1,hue:.8},
  {x:3.2,y:1.8,z:-95,kind:3,hue:2.4},
  {x:0,y:2.1,z:-102,kind:0,hue:4.2}
];

export class Ascii {
  constructor(canvas,street){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.street=street;
    this.sample=document.createElement('canvas');this.read=this.sample.getContext('2d',{willReadFrequently:true,alpha:false});
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
  computePockets(state,time){
    const w=this.width,h=this.height,pockets=[];
    const nodes=state.realm==='street'?STREET_AURA_NODES:REALM_AURA_NODES;
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i];
      const wx=n.x+Math.sin(time*.45+i*1.7)*.42,wy=n.y+Math.cos(time*.55+i*1.1)*.24,wz=n.z+Math.sin(time*.3+i)*.5;
      const proj=this.street.projectPoint?.(wx,wy,wz);
      if(!proj||proj.depth>24||proj.u<-.25||proj.u>1.25||proj.v<-.25||proj.v>1.25)continue;
      const fade=Math.max(0,Math.min(1,(24-proj.depth)/15))*Math.min(1,proj.depth/1.4);
      const r=Math.max(36,Math.min(w*.21,(w*.23)/Math.max(1.8,proj.depth*.42)))*(.88+.14*Math.sin(time*.9+i*2));
      pockets.push({x:proj.u*w,y:proj.v*h,r,strength:fade*.9,hue:(n.hue+time*.35)%(Math.PI*2),kind:n.kind,seed:i+1});
    }
    for(let k=0;k<2;k++){
      const phase=time*.18+k*3.14;
      const px=w*(.22+.56*(.5+.5*Math.sin(phase*1.1+k))),py=h*(.26+.44*(.5+.5*Math.cos(phase*.85+k*2)));
      const r=Math.min(w,h)*(.105+.028*Math.sin(time*.6+k));
      pockets.push({x:px,y:py,r,strength:.70,hue:(time*.4+k*2.4)%(Math.PI*2),kind:(k*3+1)%6,seed:k+10});
    }
    return pockets;
  }
  drawAuraPocket(ctx,p,time){
    const {x,y,r,strength,hue,kind}=p;
    if(strength<=.02)return;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    const deg=Math.round((hue/(Math.PI*2))*360)%360;
    const g=ctx.createRadialGradient(x,y,r*.04,x,y,r);
    g.addColorStop(0,`hsla(${(deg+180)%360},100%,92%,${.76*strength})`);
    g.addColorStop(.22,`hsla(${(deg+140)%360},96%,68%,${.62*strength})`);
    g.addColorStop(.45,`hsla(${(deg+290)%360},95%,64%,${.50*strength})`);
    g.addColorStop(.70,`hsla(${(deg+45)%360},95%,62%,${.32*strength})`);
    g.addColorStop(1,`hsla(${deg},90%,55%,0)`);
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();

    if(kind===3||kind===0){
      for(let i=-4;i<=4;i++){
        const ry=y+i*r*.16+Math.sin(time*2.4+i)*4;
        const rw=r*(1-Math.abs(i)/5.2)*(.75+.25*Math.sin(time*1.9+i*1.3));
        const rh=Math.max(2,r*.045);
        const rg=ctx.createRadialGradient(x,ry,0,x,ry,rw);
        rg.addColorStop(0,`hsla(${(deg+50+i*25)%360},100%,85%,${.42*strength})`);
        rg.addColorStop(1,`hsla(${(deg+190)%360},100%,65%,0)`);
        ctx.fillStyle=rg;
        ctx.fillRect(x-rw,ry-rh,rw*2,rh*2);
      }
    }
    if(kind===1||kind===5){
      const rays=12;
      for(let i=0;i<rays;i++){
        const a=(i/rays)*Math.PI*2+time*.22,len=r*(.72+.26*Math.sin(time*1.7+i*2.1));
        ctx.strokeStyle=`hsla(${(deg+i*30)%360},98%,76%,${.28*strength})`;
        ctx.lineWidth=2.2;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();
      }
    }
    for(let i=0;i<8;i++){
      const a=i*.785+time*(.35+(i%3)*.12),dist=r*(.22+.52*((Math.sin(time*.8+i*1.9)+1)*.5));
      const ox=x+Math.cos(a)*dist,oy=y+Math.sin(a)*dist,or=Math.max(2,r*(.04+.025*(i%3)));
      const og=ctx.createRadialGradient(ox,oy,0,ox,oy,or*2.4);
      og.addColorStop(0,`hsla(${(deg+i*45)%360},100%,90%,${.65*strength})`);
      og.addColorStop(1,`hsla(${(deg+i*45)%360},100%,65%,0)`);
      ctx.fillStyle=og;ctx.beginPath();ctx.arc(ox,oy,or*2.4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  drawHumanoidAura(ctx,cx,cy,figH,time,state,isMirror=false){
    const w=figH*.46,headR=figH*.095,headY=cy-figH*.36,chestY=cy-figH*.14,hipY=cy+figH*.08;
    const stride=state.moving?Math.sin(state.distance*5.5):Math.sin(time*1.2)*.15;
    const breath=.5+.5*Math.sin(time*1.8);
    ctx.save();
    ctx.globalCompositeOperation='screen';

    const rayR=figH*(.78+.08*breath);
    const numRays=28;
    for(let i=0;i<numRays;i++){
      const a=(i/numRays)*Math.PI*2+time*.14;
      const rLen=rayR*(.68+.32*Math.sin(i*3.7+time*1.6));
      const hue=(i*(360/numRays)+time*28)%360;
      const grad=ctx.createLinearGradient(cx,chestY,cx+Math.cos(a)*rLen,chestY+Math.sin(a)*rLen);
      grad.addColorStop(0,`hsla(${hue},100%,88%,.46)`);
      grad.addColorStop(.55,`hsla(${(hue+40)%360},98%,68%,.24)`);
      grad.addColorStop(1,`hsla(${(hue+80)%360},95%,55%,0)`);
      ctx.strokeStyle=grad;
      ctx.lineWidth=Math.max(2,figH*.028*(1+.4*Math.sin(i*1.9+time)));
      ctx.beginPath();ctx.moveTo(cx,chestY);ctx.lineTo(cx+Math.cos(a)*rLen,chestY+Math.sin(a)*rLen);ctx.stroke();
    }

    const shells=[
      {scale:1.58,color:`hsla(${(48+time*18)%360},100%,68%,.26)`},
      {scale:1.36,color:`hsla(${(280+time*18)%360},96%,66%,.34)`},
      {scale:1.18,color:`hsla(${(345+time*18)%360},98%,68%,.42)`},
      {scale:1.04,color:`hsla(${(168+time*18)%360},100%,66%,.52)`}
    ];
    for(const s of shells){
      const rx=w*s.scale,ry=figH*.54*s.scale;
      const ag=ctx.createRadialGradient(cx,cy-figH*.04,rx*.12,cx,cy-figH*.04,Math.max(rx,ry));
      ag.addColorStop(0,s.color);
      ag.addColorStop(.72,s.color);
      ag.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ag;
      ctx.beginPath();ctx.ellipse(cx,cy-figH*.04,rx,ry,0,0,Math.PI*2);ctx.fill();
    }

    const drawLimb=(x0,y0,x1,y1,r0,r1,hueOff)=>{
      const lg=ctx.createLinearGradient(x0,y0,x1,y1);
      lg.addColorStop(0,`hsla(${(185+hueOff+time*22)%360},98%,76%,.72)`);
      lg.addColorStop(.5,`hsla(${(305+hueOff+time*22)%360},95%,72%,.68)`);
      lg.addColorStop(1,`hsla(${(52+hueOff+time*22)%360},100%,82%,.75)`);
      ctx.strokeStyle=lg;ctx.lineCap='round';ctx.lineWidth=(r0+r1);
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    };
    for(const side of [-1,1]){
      const swing=side*stride*figH*.055;
      const hipX=cx+side*w*.19,kneeX=hipX+swing*.4,kneeY=hipY+figH*.18,footX=hipX+swing,footY=cy+figH*.44;
      drawLimb(hipX,hipY,kneeX,kneeY,w*.09,w*.075,side*35);
      drawLimb(kneeX,kneeY,footX,footY,w*.075,w*.06,side*55+40);
    }
    const torsoGrad=ctx.createRadialGradient(cx,chestY,figH*.02,cx,cy-figH*.04,figH*.32);
    torsoGrad.addColorStop(0,'rgba(255,255,255,.96)');
    torsoGrad.addColorStop(.28,`hsla(${(175+time*25)%360},100%,78%,.82)`);
    torsoGrad.addColorStop(.62,`hsla(${(295+time*25)%360},96%,64%,.65)`);
    torsoGrad.addColorStop(1,`hsla(${(235+time*25)%360},92%,48%,0)`);
    ctx.fillStyle=torsoGrad;
    ctx.beginPath();ctx.ellipse(cx,cy-figH*.07,w*.34,figH*.24,0,0,Math.PI*2);ctx.fill();

    for(const side of [-1,1]){
      const armSwing=-side*stride*figH*.05;
      const shX=cx+side*w*.32,shY=cy-figH*.22;
      const elX=cx+side*w*.44+armSwing*.5,elY=cy-figH*.05;
      const haX=cx+side*w*.48+armSwing,haY=cy+figH*.11;
      drawLimb(shX,shY,elX,elY,w*.075,w*.065,side*45+90);
      drawLimb(elX,elY,haX,haY,w*.065,w*.055,side*45+150);
    }

    const headHalo=ctx.createRadialGradient(cx,headY,headR*.2,cx,headY,headR*2.1);
    headHalo.addColorStop(0,`hsla(${(190+time*20)%360},100%,92%,.9)`);
    headHalo.addColorStop(.45,`hsla(${(275+time*20)%360},96%,70%,.65)`);
    headHalo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=headHalo;ctx.beginPath();ctx.arc(cx,headY,headR*2.1,0,Math.PI*2);ctx.fill();

    if(isMirror){
      const innerShadow=ctx.createRadialGradient(cx,headY,0,cx,headY,headR*.95);
      innerShadow.addColorStop(0,'rgba(14,10,38,.62)');
      innerShadow.addColorStop(.75,'rgba(38,22,88,.35)');
      innerShadow.addColorStop(1,'rgba(90,180,255,0)');
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=innerShadow;ctx.beginPath();ctx.ellipse(cx,headY,headR*.82,headR*1.05,0,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='screen';
    }

    const starR=figH*(.11+.025*breath);
    const star=ctx.createRadialGradient(cx,chestY,0,cx,chestY,starR*2.2);
    star.addColorStop(0,'rgba(255,255,255,.98)');
    star.addColorStop(.25,`hsla(${(55+time*35)%360},100%,85%,.85)`);
    star.addColorStop(.6,`hsla(${(180+time*35)%360},100%,70%,.42)`);
    star.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=star;ctx.beginPath();ctx.arc(cx,chestY,starR*2.2,0,Math.PI*2);ctx.fill();

    for(let i=-5;i<=5;i++){
      const wy=cy+i*figH*.075+Math.sin(time*2.6+i)*3;
      const ww=w*(.85-Math.abs(i)*.09)*(.7+.3*Math.sin(time*2.1+i*1.4));
      const wg=ctx.createLinearGradient(cx-ww,wy,cx+ww,wy);
      wg.addColorStop(0,'rgba(0,0,0,0)');
      wg.addColorStop(.5,`hsla(${(48+i*32+time*30)%360},100%,86%,.36)`);
      wg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=wg;ctx.fillRect(cx-ww,wy-1.5,ww*2,3);
    }
    ctx.restore();
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

    const pockets=this.computePockets(state,time);
    const mirrors=this.street.projectMirrors?.(state)||[];
    const pitch=state.player?.pitch||0;
    const lookDown=Math.max(0,Math.min(1,(-pitch-.08)/.58));

    for(const p of pockets)this.drawAuraPocket(ctx,p,time);
    const downAura=lookDown>.01?this.drawLookDownAura(ctx,state,time,lookDown):null;

    for(const m of mirrors){
      const mx=m.u0*w,my=m.v0*h,mw=m.w*w,mh=m.h*h;
      ctx.save();
      ctx.beginPath();ctx.rect(mx,my,mw,mh);ctx.clip();
      const bg=ctx.createLinearGradient(mx,my,mx+mw,my+mh);
      bg.addColorStop(0,'rgba(18,12,34,.92)');
      bg.addColorStop(.5,'rgba(28,16,46,.88)');
      bg.addColorStop(1,'rgba(12,18,38,.94)');
      ctx.fillStyle=bg;ctx.fillRect(mx,my,mw,mh);
      this.drawHumanoidAura(ctx,m.rx*w,m.ry*h,Math.max(mh*.62,Math.min(mh*.92,m.figH*h)),time,state,true);
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

        for(let k=0;k<pockets.length;k++){
          const p=pockets[k],dx=px-p.x,dy=py-p.y,d2=dx*dx+dy*dy,r2=p.r*p.r;
          if(d2<r2*2.1){
            const d=Math.sqrt(d2),t=Math.max(0,1-d/(p.r*1.42));
            const ripple=Math.sin(d*.18-time*4.2+p.seed)*t*2.6;
            const inv=1/(d+8);
            warpX+=(dx*inv*ripple-dy*inv*t*1.8)*p.strength;
            warpY+=(dy*inv*ripple+dx*inv*t*1.8)*p.strength;
            const core=Math.max(0,1-d/(p.r*.78))*p.strength;
            if(core>hole)hole=core;
            if(t*p.strength>glassTint){
              glassTint=t*p.strength;
              hueShift=p.hue+Math.atan2(dy,dx)*.5+d*.02;
            }
          }
        }

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
          const pad=28;
          if(px>=mx0-pad&&px<=mx1+pad&&py>=my0-pad&&py<=my1+pad){
            const inX=px>=mx0&&px<=mx1,inY=py>=my0&&py<=my1;
            if(inX&&inY){
              const edge=Math.min(px-mx0,mx1-px,py-my0,my1-py)/Math.max(8,Math.min(mx1-mx0,my1-my0)*.18);
              hole=Math.max(hole,Math.min(.92,edge*.92));
              glassTint=Math.max(glassTint,.9);
              hueShift=time*1.5+(py-my0)*.04;
            }else{
              const dEdge=Math.hypot(px<mx0?mx0-px:px>mx1?px-mx1:0,py<my0?my0-py:py>my1?py-my1:0);
              const t=Math.max(0,1-dEdge/pad);
              warpX+=Math.sin(py*.15+time*3.5)*t*2.2;
              warpY+=Math.cos(px*.15-time*3.2)*t*2.2;
              if(t>glassTint){glassTint=t;hueShift=time+dEdge*.1;}
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
