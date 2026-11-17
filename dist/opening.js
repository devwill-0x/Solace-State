// Code-drawn silhouettes are sampled into ASCII, preserving the game's print texture.
export class Opening{
 constructor({canvas,stage,done,shock}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.stage=stage;this.done=done;this.shock=shock;this.ink=document.createElement('canvas');this.ink.width=480;this.ink.height=300;this.c=this.ink.getContext('2d',{willReadFrequently:true});this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.mode='title';this.age=0;this.last=0;this.acc=0;this.hit=false;this.bound=t=>this.frame(t);this.raf=requestAnimationFrame(this.bound);}
 play(){this.mode='film';this.age=0;this.hit=false;this.stage.dataset.phase='wires';}
 finish(){if(this.mode!=='film')return;this.mode='hidden';this.stage.hidden=true;this.done();}
 path(points,width=1,color='#929fa6'){const c=this.c;c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 crow(x,y,size,flight=0,horns=false){const c=this.c;c.save();c.translate(x,y);c.scale(size,size);c.fillStyle='#ccd2cc';c.beginPath();c.ellipse(0,-7,5,9,-.25,0,7);c.fill();c.beginPath();c.arc(2,-16,4,0,7);c.fill();c.beginPath();c.moveTo(5,-17);c.lineTo(11,-15);c.lineTo(5,-14);c.fill();c.beginPath();c.moveTo(-3,-2);c.lineTo(-8,7);c.lineTo(1,1);c.fill();
 if(flight){const flap=Math.sin(flight)*12;this.path([[-1,-11],[-12,-17-flap],[-25,-10-flap]],3,'#d4d9d1');this.path([[1,-10],[13,-17-flap],[23,-8-flap]],3,'#d4d9d1');}else{this.path([[-2,0],[-2,4],[-5,4]],1);this.path([[2,0],[3,4],[6,4]],1);}
 if(horns){c.fillStyle='#c0867e';for(const side of [-1,1]){c.beginPath();c.moveTo(2+side,-19);c.lineTo(2+side*6,-29);c.lineTo(2+side*4,-18);c.fill();}c.fillStyle='#ffdfbf';c.fillRect(3,-17,1,1);}c.restore();}
 draw(){const c=this.c,t=this.age,film=this.mode==='film',logo=film&&t>=5.2;c.fillStyle='#04070a';c.fillRect(0,0,480,300);
 if(!logo){for(let k=0;k<4;k++){const y=92+k*26;const points=[];for(let x=0;x<=480;x+=8)points.push([x,y+Math.sin(x/480*Math.PI)*10]);this.path(points,1,k===1?'#778895':'#394954');}
 for(const x of [58,427]){this.path([[x,30],[x,300]],4,'#73828b');for(const y of [65,89])this.path([[x-29,y],[x+29,y]],2,'#8b9699');for(const dx of [-20,0,20])this.path([[x+dx,61],[x+dx,72]],3,'#a8b1b0');}
 [141,186,257,302,342].forEach((x,i)=>{if(i===2&&film&&t>2)return;this.crow(x,103,1.05);});
 if(film&&t>2&&t<4.35){const f=Math.min(1,(t-2)/1.8);this.crow(257+f*107,103-Math.sin(f*Math.PI)*34-f*27,1.1,(t-2)*13);}
 if(film&&t>=3.8&&t<4.55){const strength=Math.sin((t-3.8)/.75*Math.PI);this.path([[361,64],[351,80],[369,76],[355,99],[378,90]],2,'#bbd5e7');c.fillStyle=`rgba(185,209,225,${strength*.07})`;c.fillRect(320,45,82,65);this.crow(365,87,1.15,4,true);}
 if(!this.reduced)for(let i=0;i<48;i++){const x=(i*61+t*13)%480,y=(i*37+t*58)%300;this.path([[x,y],[x-1,y+4]],.5,'#26333e');}
 }else{this.crow(236,145,4.3,0,true);this.path([[154,178],[326,178]],.6,'#58484b');}
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#040609';ctx.fillRect(0,0,w,h);
 const cw=w<600?4.2:6.2,ch=cw*1.65,cols=Math.ceil(w/cw),rows=Math.ceil(h/ch),scale=Math.max(480/w,300/h),pixels=c.getImageData(0,0,480,300).data;ctx.font=`${ch*.9}px Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const ix=Math.floor((x*cw-w/2)*scale+240),iy=Math.floor((y*ch-h/2)*scale+150);if(ix<0||ix>=480||iy<0||iy>=300)continue;const i=(iy*480+ix)*4,v=pixels[i]*.3+pixels[i+1]*.5+pixels[i+2]*.2;if(v<18)continue;ctx.fillStyle=pixels[i]>pixels[i+2]*1.1?'#bd9790':'#9aabb3';ctx.fillText(' .,:;/*%&#@'[Math.min(10,Math.floor(v/24))],(x+.5)*cw,(y+.5)*ch);}
 }
 frame(ms){const dt=Math.min(.1,(ms-(this.last||ms))/1000);this.last=ms;if(!document.hidden&&this.mode!=='hidden'){if(this.mode==='film'){this.age+=dt;if(this.age>=3.8&&!this.hit){this.hit=true;this.shock();}this.stage.dataset.phase=this.age>=5.2?'logo':this.age>=3.8?'shock':this.age>=2?'flight':'wires';if(this.age>=9){this.finish();}}else this.age+=dt;this.acc+=dt;if(this.acc>.065){this.acc=0;this.draw();}}this.raf=requestAnimationFrame(this.bound);}
}
