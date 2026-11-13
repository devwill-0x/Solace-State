import {PEOPLE} from './game.js';
// This portrait was supplied directly by the user as the visual reference.
export const suppliedPortrait=String.raw`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡌⡸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠄⠒⠈⠉⠉⠑⠋⠑⢢⡜⢀⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠔⠀⠂⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠚⢒⠒⠒⠢⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣸⠛⠂⠑⢄⣀⣀⣀⠤⠐⠊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⢈⣂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢻⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠢⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣸⠭⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠘⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⡞⠈⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⢹⠀⠀⠀⢑⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣇⠀⠈⠂⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠧⠀⢑⠌⠀⡠⠐⠀⠂⠀⠀
⡀⠄⠀⠀⠘⢄⠀⠀⠀⠀⣴⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢭⢠⡄⡘⠀⠎⠀⠀⠀⠀
⠑⠂⠤⢀⠀⠿⠤⣤⡤⣾⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡝⢣⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⢠⢀⡧⠼⠀⠀⠀⡀⠀
⠀⠉⢳⠆⢱⠀⠀⠀⢠⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⡆⠳⠖⣶⠀⠀⠀⠀⢀⠀⠀⠀⠀⢀⡴⠉⠀⣀⣐⡁⠀
⠀⠀⠘⡄⠈⠢⢄⣀⣀⠘⣗⠄⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⢿⠀⠸⡟⣤⣀⠀⢠⡟⠛⠯⡁⢀⠖⠍⠘⡇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⣟⢿⣄⣀⣤⣖⣻⡻⠿⡿⢿⢴⠄⡔⠀⠀⣀⣠⣈⣭⣥⣆⣀⡀⠈⠀⣹⠀⢸⡇⠀⠀⡍⠁⢠⠃⢰⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡏⣄⡌⠉⠛⢻⣗⣛⠿⣶⣤⣀⣀⡿⠖⠀⠀⠉⣁⣹⣋⠙⢛⣛⡷⣎⢹⡠⢫⡇⠀⠀⠣⢸⠋⡁⠏⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠿⢥⣴⠄⠈⡟⠿⡳⢿⣿⣿⢏⡗⠶⠆⠰⠟⢋⠙⣿⣿⣿⣯⡟⠛⠻⠖⢸⠁⢀⡀⣼⠟⠁⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⠒⣄⢷⡀⠙⠢⣽⠓⢼⡷⠄⠦⡤⢤⠈⠛⠛⠛⠛⠹⠁⠀⠠⢰⠟⡀⠈⣼⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣾⠸⢧⠀⠀⠀⠀⣸⠠⠄⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⢀⢴⠞⣴⣧⢾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡇⠀⠀⣠⣿⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⣀⠔⠡⣎⡾⢫⠗⠠⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣄⠀⠈⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⣨⠃⡐⣻⠛⢃⣸⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣇⠀⢠⣄⣀⡀⠀⠀⠀⠀⢀⡔⠁⣰⠶⡇⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢦⠀⠂⠈⠙⠃⠀⠀⠀⠀⢠⢞⣡⣼⠁⠀⠀⠀⠀⠘⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠷⡄⠀⠀⠀⠀⠀⢀⠴⠷⢚⠃⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⡟⠒⠂⠐⠀⠐⣄⠀⠀⣼⠧⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⡾⠧⣼⣷⠀⠀⠀⠀⠀⠈⠀⡘⡜⢿⡮⢿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⠋⠀⠀⢻⣔⠀⠀⠀⠀⠀⠀⠀⢹⣡⡾⠀⠀⢹⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡏⠀⠀⠀⠀⠀⠹⣧⠀⠁⢀⣄⣠⣴⡾⠋⠀⠀⠀⣸⣟⠧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⡺⠿⡏⠀⠀⠀⠀⣠⡾⢻⢇⣶⣞⠽⠛⠁⠀⠀⠀⠀⠀⣿⠣⣻⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠶⠋⠁⠀⠘⣿⠀⠀⢀⣼⡟⢳⡸⣞⣼⡇⠀⠀⠀⠀⠀⠀⠀⣸⠇⠀⠈⠿⠪⣗⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠞⠉⠁⠀⠀⠀⠀⠀⢹⡆⢀⡾⠟⠀⠀⠉⠻⣿⠇⠀⠀⠀⠀⠀⢀⡾⠏⠀⠀⠀⠀⠀⠀⠀⠀⠁⠻⢶⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣴⢱⠀⠀⠀⠀⠀⠀⠀⠀⠸⢥⠎⠁⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⢀⣴⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢢⣄⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⠌⡿⠸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⠀⢀⡤⠞⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⡽⢿⡿⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡾⠘⣇⠰⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡴⣫⠞⠠⠂⠑⣥⠢
`.trim();
const DOTS=[[0,0,1],[0,1,2],[0,2,4],[1,0,8],[1,1,16],[1,2,32],[0,3,64],[1,3,128]];
export function textToDots(text){
 const lines=text.split('\n').map(l=>Array.from(l.replace(/\\$/,''))),cols=Math.max(...lines.map(l=>l.length));
 return {cols,rows:lines.length,cells:lines.map(line=>Array.from({length:cols},(_,i)=>{const n=line[i]?.codePointAt(0);return n>=0x2800&&n<=0x28ff?n-0x2800:0;}))};
}
function path(c,d,width=2,color='#d8d6d1',fill=null){
 const p=new Path2D(d);c.lineWidth=width;c.strokeStyle=color;if(fill){c.fillStyle=fill;c.fill(p);}c.stroke(p);
}
function eye(c,x,y,width,blink,style){
 c.save();c.translate(x,y);c.scale(width/70,1);
 if(blink>.5){path(c,'M-35 0 Q0 13 35 -4',3);c.restore();return;}
 path(c,'M-37 -2 Q-12 -17 13 -10 L36 -5 Q12 18 -12 11 Z',2,'#c8c8c8');
 path(c,'M-39 -3 Q-11 -19 14 -12 L40 -9 L32 -2 Q0 -9 -20 1 Z',1,'#ddd','#ddd');
 c.fillStyle='#c8c8c8';c.beginPath();c.ellipse(2,1,9,12,0,0,Math.PI*2);c.fill();
 c.fillStyle='#050505';c.beginPath();c.ellipse(3,1,3,9,0,0,Math.PI*2);c.fill();
 c.fillStyle='#fff';c.fillRect(-1,-5,3,3);
 path(c,'M-28 18 Q0 23 23 13',1,'#828282');
 if(style===2){path(c,'M33 -6 L48 -13 M31 -4 L45 -7',2);}
 c.restore();
}
function drawIllustration(c,style,time,talking,reduced){
 c.fillStyle='#030303';c.fillRect(0,0,600,700);
 const blink=!reduced&&((time+style)%5.3)<.13?1:0;
 const mouth=talking?Math.abs(Math.sin(time*9))*5:0;
 // Original ink drawings: angular cheeks, long necks, clothing and expressive eyes.
 path(c,'M78 694 L91 580 Q111 551 204 515 L244 490 L355 489 L394 514 Q489 542 522 580 L548 694',2.5);
 path(c,'M237 403 L237 483 L208 512 L274 581 L306 531 L344 569 L394 513 L361 480 L355 397',2.5);
 path(c,'M237 455 Q269 481 310 491 M350 443 L332 481',1.3,'#969696');
 path(c,'M209 512 L175 553 L224 558 L203 597 L273 686 M394 514 L424 554 L378 564 L410 598 L346 686',2);
 path(c,'M245 498 L305 531 L354 492 M306 534 L306 691',1.3);
 path(c,'M96 584 L126 695 M507 584 L483 695 M138 615 L173 607 M437 606 L474 616',1.3,'#959595');
 for(let i=0;i<5;i++){c.beginPath();c.ellipse(315,575+i*23,2,2,0,0,Math.PI*2);c.fillStyle='#ccc';c.fill();}
 // Ear and jaw contour.
 path(c,'M197 279 Q172 255 172 298 Q172 334 201 342 M187 287 Q181 308 195 320',2.3);
 path(c,'M404 270 Q426 255 425 291 Q421 326 401 332 M414 281 L410 309',2);
 path(c,'M199 270 L207 351 Q218 393 280 432 Q298 440 312 433 Q375 400 394 347 L404 263',2.6);
 path(c,'M208 352 L230 376 M385 348 L362 375',1.2,'#888');
 // Nose bridge, nose tip and quiet lips.
 path(c,'M298 268 L291 315 L278 338 Q291 343 299 340 M305 334 L312 337',1.8);
 path(c,'M280 373 Q292 368 302 372 Q311 370 319 374',2);
 if(mouth>1){c.beginPath();c.ellipse(299,377,12,mouth,0,0,Math.PI*2);c.strokeStyle='#aaa';c.lineWidth=1.5;c.stroke();}
 path(c,'M289 386 Q301 389 311 385 M281 412 L308 414',1,'#777');
 eye(c,247,278,68,blink,style);eye(c,353,274,65,blink,style);
 path(c,'M210 250 Q241 238 272 249 M321 245 Q350 232 387 241',4);
 if(style===1){
  // Ren: tousled fringe, wire spectacles, open collar.
  path(c,'M181 284 L165 237 L172 214 L155 183 L182 187 L171 153 L204 155 Q203 128 231 116 L225 98 L253 107 Q276 82 302 102 Q340 80 353 107 L384 97 L378 124 L409 126 L402 147 L429 158 L414 179 L436 199 L417 219 L421 253 L405 285',2.5);
  path(c,'M181 260 L202 226 L199 183 L220 220 L242 172 L244 229 L279 181 L267 243 L310 186 L307 229 L339 166 L351 225 L373 192 L384 240 L397 218 L405 268',2.3);
  path(c,'M202 143 L232 163 M260 119 L281 147 M321 114 L333 140 M370 139 L385 163',1.2,'#888');
  path(c,'M207 262 L282 258 L278 299 Q246 318 212 301 Z M316 257 L392 253 L388 297 Q354 311 322 298 Z M281 273 Q297 265 317 270 M207 270 L183 267 M391 266 L415 261',1.5);
  path(c,'M199 332 L198 360 M191 350 L205 349',2);
 }else{
  // Aya: long blunt hair, parted fringe, small earrings and high collar.
  path(c,'M166 541 Q180 467 169 364 Q145 283 165 189 Q181 108 249 93 Q333 66 390 119 Q437 151 435 235 Q429 357 454 529 L417 522 L403 455 L391 513',2.7);
  path(c,'M169 541 L197 520 L206 420 M175 346 L186 435 L181 494 M417 321 L426 439 L441 504',1.8);
  path(c,'M181 284 Q176 218 210 165 L217 243 L249 185 L253 248 L291 176 L292 240 L322 177 L336 241 L354 181 L378 239 L389 204 L405 273',2.4);
  path(c,'M189 184 Q207 124 255 113 M273 105 Q338 91 388 151 M413 168 L420 229 M198 382 L198 455',1.1,'#888');
  path(c,'M236 484 L266 511 L343 508 L360 480 M251 493 L271 525 L338 521 L352 491',2);
  for(const x of [188,414]){c.strokeStyle='#bbb';c.lineWidth=1.7;c.beginPath();c.ellipse(x,344,7,11,0,0,Math.PI*2);c.stroke();path(c,'M'+x+' 356 L'+x+' 378 M'+(x-6)+' 367 L'+(x+6)+' 367',1.5);}
 }
 // Sparse hatching lends the drawing the broken texture of the supplied dot art.
 for(let i=0;i<9;i++){path(c,'M'+(218+i*2)+' '+(351+i*3)+' l-3 10',.7,'#888');}
 for(let i=0;i<12;i++){path(c,'M'+(371+i*3)+' '+(550+i*4)+' l-4 16',.8,'#888');}
}
function sampleDots(canvas){
 const c=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height,d=c.getImageData(0,0,w,h).data;
 const cols=Math.floor(w/2),rows=Math.floor(h/4),cells=[];
 for(let y=0;y<rows;y++){const row=[];for(let x=0;x<cols;x++){let mask=0;for(const [dx,dy,bit] of DOTS){const i=((y*4+dy)*w+x*2+dx)*4;if(d[i]>65)mask|=bit;}row.push(mask);}cells.push(row);}
 return {cols,rows,cells};
}
export class DotPortraits{
 constructor(){
  this.supplied=textToDots(suppliedPortrait);this.ink=document.createElement('canvas');this.ink.width=600;this.ink.height=700;
  this.sample=document.createElement('canvas');this.sample.width=208;this.sample.height=244;
  this.cached=null;this.cacheKey='';this.mouthRow=suppliedPortrait.split('\n').findIndex(l=>l.includes('⢠⣄⣀⡀'));
  this.mouthCol=Array.from(suppliedPortrait.split('\n')[this.mouthRow]).join('').indexOf('⢠⣄⣀⡀');
 }
 draw(ctx,width,height,state,time,reduced){
  const person=PEOPLE.find(p=>p.id===state.conversation.id),talking=person.lines[state.conversation.line].speaker!=='You';
  let art=this.supplied;
  if(person.style!==0){
   const frame=reduced&&!talking?0:Math.floor(time*10),key=person.id+':'+frame+':'+talking;
   if(key!==this.cacheKey){const c=this.ink.getContext('2d');drawIllustration(c,person.style,time,talking,reduced);const s=this.sample.getContext('2d');s.drawImage(this.ink,0,0,this.sample.width,this.sample.height);this.cached=sampleDots(this.sample);this.cacheKey=key;}art=this.cached;
  }
  ctx.fillStyle='#030303';ctx.fillRect(0,0,width,height);
  const availableH=height*(width<600?.58:.66),availableW=width*(width<600?.95:.64);
  const unit=Math.min(availableW/(art.cols*2),availableH/(art.rows*4));
  const left=(width-art.cols*2*unit)/2,top=height*.12+(reduced?0:Math.sin(time*.5)*1.1);
  ctx.fillStyle='#c8c8c4';
  for(let y=0;y<art.rows;y++)for(let x=0;x<art.cols;x++){
   let mask=art.cells[y][x];
   // A tiny lower-lip movement preserves the supplied linework as the character speaks.
   if(person.style===0&&talking&&Math.sin(time*9)>.25&&y===this.mouthRow+1&&x>this.mouthCol&&x<this.mouthCol+4)mask|=9;
   if(!mask)continue;
   for(const [dx,dy,bit] of DOTS)if(mask&bit){
    ctx.beginPath();ctx.ellipse(left+(x*2+dx+.5)*unit,top+(y*4+dy+.5)*unit,unit*.37,unit*.39,0,0,Math.PI*2);ctx.fill();
   }
  }
 }
}
