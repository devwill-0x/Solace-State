// Every visible surface is rebuilt from printable characters, like a luminance print.
export class Ascii {
  constructor(canvas,street){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.street=street;this.sample=document.createElement('canvas');this.read=this.sample.getContext('2d',{willReadFrequently:true,alpha:false});this.quality=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resize();window.addEventListener('resize',()=>this.resize());}
  resize(){
    const w=innerWidth,h=innerHeight;this.width=w;this.height=h;const target=this.quality===0?(w<600?3.35:5.25):(w<600?5:7.7);
    this.cols=Math.max(70,Math.min(350,Math.round(w/target)));this.cw=w/this.cols;this.ch=this.cw*1.85;this.rows=Math.ceil(h/this.ch);
    const dpr=Math.min(devicePixelRatio||1,2);this.dpr=dpr;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.imageSmoothingEnabled=false;
    this.sample.width=this.cols;this.sample.height=this.rows;this.street.resize(this.cols,this.rows,w/h);this.makeAtlas();
  }
  makeAtlas(){
    this.tw=Math.ceil(this.cw*this.dpr);this.th=Math.ceil(this.ch*this.dpr);const a=document.createElement('canvas');a.width=this.tw*16;a.height=this.th*16;const c=a.getContext('2d');c.font=`${Math.round(this.ch*this.dpr*.94)}px Consolas,'Courier New',monospace`;c.textAlign='center';c.textBaseline='middle';
    const ramps=[' .,:;/*%&#@',' .,:;/*%&@#',' .,:;/*%#&@',' .,:;/*%&#@'];
    for(let i=0;i<256;i++){const v=i/255,level=Math.min(10,Math.floor(Math.pow(v,.71)*11)),char=ramps[i%4][level],gray=Math.min(225,Math.round(80+Math.pow(v,.45)*150));c.fillStyle=`rgb(${gray},${gray},${Math.round(gray*.97)})`;c.fillText(char,(i%16+.5)*this.tw,(Math.floor(i/16)+.5)*this.th);}
    this.atlas=a;
    this.colors=document.createElement('canvas');this.colors.width=this.tw*11;this.colors.height=this.th*64;const cc=this.colors.getContext('2d');cc.font=c.font;cc.textAlign='center';cc.textBaseline='middle';for(let color=0;color<64;color++){cc.fillStyle=`rgb(${(color>>4)*64+42},${((color>>2)&3)*64+42},${(color&3)*64+42})`;for(let k=0;k<11;k++)cc.fillText(ramps[0][k],(k+.5)*this.tw,(color+.5)*this.th);}


  }
  draw(state,time,dt){
    const source=this.street.render(state,time,dt,this.reduced),cols=this.cols,rows=this.rows;this.read.drawImage(source,0,0,cols,rows);const data=this.read.getImageData(0,0,cols,rows).data,ctx=this.ctx;
    ctx.fillStyle='#030303';ctx.fillRect(0,0,this.width,this.height);
    ctx.font=`${this.ch*.94}px Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=(y*cols+x)*4,luma=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;
      // Dither the shading slightly, so plaster and rain have the grain of a print.
      const noise=((x*17+y*31)%13-6)*.7,value=Math.max(0,Math.min(255,Math.round((luma-18)*1.38+noise)));
      if(value<7)continue;
      if(Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>25){const color=((data[i]>>6)<<4)|((data[i+1]>>6)<<2)|(data[i+2]>>6),level=Math.min(10,Math.floor(Math.pow(value/255,.71)*11));ctx.drawImage(this.colors,level*this.tw,color*this.th,this.tw,this.th,x*this.cw,y*this.ch,this.cw,this.ch);continue;}
      ctx.drawImage(this.atlas,(value%16)*this.tw,Math.floor(value/16)*this.th,this.tw,this.th,x*this.cw,y*this.ch,this.cw,this.ch);
    }

  }
  toggle(){this.quality=1-this.quality;this.resize();return this.quality===0?'HIGH':'LOW';}
}
