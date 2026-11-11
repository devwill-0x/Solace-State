import {WIDTH as W, HEIGHT as H, comforts, bench} from './game.js';
const palette=['#0e1713','#263825','#3b4e31','#53643b','#6c7b4b','#91a16b','#b9bf8a','#e2be7e','#f3db9f','#4c6660'];
const chars=Array.from({length:H},()=>Array(W).fill(' '));
const colors=Array.from({length:H},()=>Array(W).fill(0));
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
function put(x,y,c,color=3){x=Math.round(x);y=Math.round(y);if(x>=0&&x<W&&y>=0&&y<H){chars[y][x]=c;colors[y][x]=color}}
function text(x,y,s,color=4){[...s].forEach((c,i)=>{if(c!==' ')put(x+i,y,c,color)})}
function tree(x,y,size=16,color=3){
  for(let j=0;j<size;j++){
    const width=Math.floor(j*.47),yy=y-size+j;
    for(let i=-width;i<=width;i++){
      if(hash(x+i,yy)>.18)put(x+i,yy, i===-width?'/':i===width?'\\':'.:;*+%#'[Math.floor(hash(i+j,x)*8)],Math.max(1,color-(hash(i,yy)>.68?1:0)));
    }
  }
  text(x-1,y,'| |',color);text(x-2,y+1,'/| |\\',Math.max(1,color-1));
}
function build(){
  // A landscape drawn character by character: sky, moon, mountains, pines, river.
  for(let y=3;y<49;y++)for(let x=2;x<W-2;x++){
    if(hash(x,y)>.988)put(x,y,hash(y,x)>.7?'+':'.',y<30?4:2);
    const moon=Math.pow((x-137)/11.6,2)+Math.pow((y-16)/7,2);
    if(moon<1){let c=' .:oO@'[Math.min(5,Math.floor((1-moon)*4+2))];put(x,y,c,moon>.85?5:6);if(hash(x,y)>.84)put(x,y,':',5)}
  }
  for(let x=0;x<W;x++){
    const ridge=31+Math.sin(x*.046)*9+Math.sin(x*.13)*3;
    for(let y=Math.floor(ridge);y<55;y++)if(hash(x,y)>.24)put(x,y,'.:;,/\\'[Math.floor(hash(x+5,y)*6)],1+(y<ridge+2?1:0));
  }
  for(let x=0;x<W;x++){
    const ridge=44+Math.sin(x*.034+2)*6+Math.sin(x*.092)*4;
    for(let y=Math.floor(ridge);y<63;y++)if(hash(x,y)>.3)put(x,y,',.;:~'[Math.floor(hash(x+2,y)*5)],2);
  }
  for(let y=50;y<84;y++)for(let x=0;x<W;x++){
    const path=58+Math.sin(y*.11)*17+(76-y)*.45;
    const delta=Math.abs(x-path);
    if(delta<7)put(x,y,hash(x,y)>.5?'.':':',3);
    else if(hash(x,y)>.55)put(x,y,hash(x,y)>.9?'"':hash(x,y)>.78?';':'.',hash(x,y)>.88?3:2);
    const river=110+Math.sin(y*.12)*4;
    if(Math.abs(x-river)<6){put(x,y,hash(x,y)>.7?'~':hash(x,y)>.45?'-':'.',9)}
    else if(Math.abs(x-river)<7.5)put(x,y,':',4);
  }
  for(let y=83;y<H;y++)for(let x=0;x<W;x++)if(hash(x,y)>.65)put(x,y,'.:,'[Math.floor(hash(y,x)*3)],1);
  // Distant trees establish depth; foreground trees frame the walkable valley.
  [[5,48,20,2],[18,46,16,2],[28,48,23,2],[43,44,14,2],[56,48,18,2],[68,45,13,2],[81,47,20,2],[96,46,18,2],[120,47,14,2],[168,48,23,2],[178,50,28,2]].forEach(a=>tree(...a));
  [[2,68,39,4],[14,58,31,4],[25,54,24,3],[173,68,32,4],[179,79,43,3],[7,82,33,3]].forEach(a=>tree(...a));
  // A little cottage. There is still someone awake inside.
  text(140,33,'___/\\___',4);text(137,34,'__/::::::::\\__',4);
  text(134,35,'__/::::::::::::::\\',4);text(133,36,'/__________________\\',5);
  text(135,37,'| . . . . . . . . |',3);text(135,38,'| . . . . . . . . |',3);
  text(135,39,'| . +---+ . . __. |',4);text(135,40,'| . |###| . .|  | |',4);
  text(135,41,'| . |###| . .|  | |',4);text(135,42,'| . +---+ . .|o | |',4);
  text(135,43,'|____________|__|_|',4);text(134,44,'/___________________\\',2);
  for(let y=40;y<42;y++)text(140,y,'###',7);
  text(148,33,'||',3);text(148,32,'||',3);text(148,31,'::',2);
  // Footbridge and its handrails.
  for(let y=59;y<=65;y++){text(100,y,'====================',y===59||y===65?5:3);}
  text(100,58,'|  |  |  |  |  |  |',4);text(100,64,'|  |  |  |  |  |  |',4);
  // The quiet bench and a tiny garden.
  text(153,66,'+---------+',4);text(153,67,'|=========|',4);text(153,68,'| |     | |',4);text(153,69,'|         |',3);
  text(58,68,'\\|/ \\|/',4);text(61,69,'|',3);
  text(36,48,'/\\_/\\',5);text(36,49,'( o.o )',5);text(37,50,'> ^ <',4);
  text(85,47,' .-. ',4);text(85,48,' |*| ',5);text(85,49,' [=] ',4);text(87,50,'|',4);text(87,51,'|',3);
  text(126,74,'\\__/',6);text(127,73,'/\\',5);
  text(29,76,'..',3);text(28,77,'(____)',3);
}
build();
export class Scene{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.dawn=0;this.breath=0;this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  resize(){const {width,height}=this.canvas.getBoundingClientRect();this.width=width;this.height=height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=width*dpr;this.canvas.height=height*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.cw=width/W;this.ch=height/H;}
  point(clientX,clientY){const r=this.canvas.getBoundingClientRect();return {x:(clientX-r.left)/r.width*W,y:(clientY-r.top)/r.height*H};}
  draw(state,time,delta){
    const ctx=this.ctx,cw=this.cw,ch=this.ch,w=this.width,h=this.height;
    this.dawn+=(Number(state.ended)-this.dawn)*Math.min(delta*.22,.1);
    ctx.fillStyle=this.dawn>.01?`rgb(${11+this.dawn*26},${19+this.dawn*25},${16+this.dawn*14})`:'#0b1311';ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(137*cw,18*ch,0,137*cw,18*ch,58*cw);glow.addColorStop(0,`rgba(174,183,112,${.045+this.dawn*.08})`);glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.font=`${Math.max(5,cw*1.55)}px 'Consolas','Courier New',monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    const px=state.player.x,py=state.player.y;
    // Group glyphs by color to keep an entire ASCII landscape inexpensive to draw.
    for(let color=1;color<palette.length;color++){
      ctx.fillStyle=palette[color];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(colors[y][x]===color&&chars[y][x]!==' '){
        let alpha=1;
        if(color<5&&state.started){const d=Math.hypot((x-px)*.65,y-py);alpha=d<18?1: .76+this.dawn*.24;}
        ctx.globalAlpha=alpha;ctx.fillText(chars[y][x],x*cw,y*ch);
      }
    }
    ctx.globalAlpha=1;
    if(this.dawn>.01){const dawn=ctx.createLinearGradient(0,0,0,h*.7);dawn.addColorStop(0,`rgba(226,175,112,${this.dawn*.2})`);dawn.addColorStop(.7,`rgba(226,175,112,${this.dawn*.06})`);dawn.addColorStop(1,'transparent');ctx.fillStyle=dawn;ctx.fillRect(0,0,w,h);}
    if(!this.reduced&& !state.paused){ctx.fillStyle='#9ba58a';ctx.globalAlpha=.14*(1-this.dawn);for(let i=0;i<55;i++){const rx=hash(i,6)*W,ry=(hash(i,7)*H+time*(3+hash(i,8)*3))%H;ctx.fillText(',',rx*cw,ry*ch);}ctx.globalAlpha=1;}
    for(const item of comforts){
      const found=state.found.has(item.id),g=ctx.createRadialGradient(item.x*cw,item.y*ch,0,item.x*cw,item.y*ch,(found?10:7)*cw);g.addColorStop(0,`rgba(225,189,114,${found?.13:.065})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect((item.x-12)*cw,(item.y-12)*ch,24*cw,24*ch);
      ctx.fillStyle=found?'#f0d097':'#cfb881';ctx.globalAlpha=found||this.reduced?1:.7+Math.sin(time*1.7+item.x)*.25;ctx.font=`${Math.max(9,cw*2.4)}px 'Consolas',monospace`;ctx.fillText(found?'·':'+',item.x*cw,(item.y-4)*ch);ctx.globalAlpha=1;
    }
    if(state.found.size===5){ctx.fillStyle='#f0d097';ctx.font=`${Math.max(9,cw*2.4)}px monospace`;ctx.fillText('*',bench.x*cw,(bench.y-6)*ch);}
    if(state.target&&state.path.length){ctx.fillStyle='#b8b38a';ctx.globalAlpha=.45;ctx.font=`${Math.max(8,cw*2)}px monospace`;ctx.fillText('×',state.target.x*cw,state.target.y*ch);ctx.globalAlpha=1;}
    if(state.started){
      const breathing=this.breath>time? Math.sin((this.breath-time)*1.3)**2:0;
      const g=ctx.createRadialGradient(px*cw,py*ch,0,px*cw,py*ch,(14+breathing*12)*cw);g.addColorStop(0,'#edc48028');g.addColorStop(.5,'#edc48009');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect((px-30)*cw,(py-30)*ch,60*cw,60*ch);
      ctx.fillStyle='#eddaab';ctx.shadowColor='#edc480';ctx.shadowBlur=7;ctx.font=`${Math.max(7,cw*1.85)}px 'Consolas',monospace`;
      const walk=state.path.length||state.walking?Math.sin(time*11):0;
      ctx.fillText('o',px*cw,(py-2)*ch);ctx.fillText('/|\\',px*cw,(py-.6)*ch);ctx.fillText(Math.abs(walk)>.5?'/ >':'/ \\',px*cw,(py+.8)*ch);ctx.shadowBlur=0;
      if(state.found.has('cat')){ctx.fillStyle='#bab792';ctx.font=`${Math.max(6,cw*1.5)}px monospace`;ctx.fillText('^.^',(px-4)*cw,(py+1)*ch);}
    }
    if(!state.started){const fade=ctx.createLinearGradient(0,0,w,0);fade.addColorStop(0,'#0b131191');fade.addColorStop(.4,'#0b131118');fade.addColorStop(1,'transparent');ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);}
    // Soft vignette keeps the scene feeling like an old, illuminated terminal.
    const vignette=ctx.createRadialGradient(w*.5,h*.5,h*.25,w*.5,h*.5,w*.65);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#060d095e');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }
}
