import {drawBoat,drawFish} from './art.js?v=harbor-r3';
import {species} from './model.js?v=harbor-r3';
export const SCALE=16;
// A continuous world transform magnifies the first metres without band-boundary jumps.
export const worldY=d=>d<=0?d*40:16*d+528*(1-Math.exp(-d/22));
export function worldDepth(y){if(y<=0)return y/40;let d=y/25;for(let i=0;i<5;i++)d-=(worldY(d)-y)/(16+24*Math.exp(-d/22));return Math.max(0,d);}
const ellipse=(c,x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
const line=(c,pts,col,w=2)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
const poly=(c,pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
const gradient=(c,y1,y2,a,b)=>{const g=c.createLinearGradient(0,y1,0,y2);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
export function harbor(c,w,h,t){
 const water=h*.46; c.fillStyle=gradient(c,0,water,'#fff0c6','#aedcd0');c.fillRect(0,0,w,h);
 // Hazy headlands, backlit clouds and the village occupy distinct distance planes.
 ellipse(c,w*.82,water*.63,32,32,'#fff8dc');
 c.save();c.globalAlpha=.35;for(let i=0;i<4;i++){const x=w*(.12+i*.29),y=water*(.33+(i%2)*.16);ellipse(c,x,y,46,7,'#fffdf0');ellipse(c,x+23,y-5,22,10,'#fffdf0');}c.restore();
 poly(c,[[0,water-20],[w*.08,water-64],[w*.22,water-90],[w*.43,water-53],[w*.60,water-66],[w*.79,water-25],[w,water-43],[w,water],[0,water]],'#8eb8ac');
 poly(c,[[0,water-18],[w*.15,water-45],[w*.36,water-12],[w*.69,water-36],[w*.83,water-57],[w,water-14],[w,water],[0,water]],'#649691');
 for(let i=0;i<8;i++){const x=i*w/7-22,y=water-24-(i%3)*7,bw=w/8;
 poly(c,[[x,y],[x+bw,y],[x+bw,y+26],[x,y+26]],i%2?'#f0d3a3':'#dce1c3');poly(c,[[x+bw,y],[x+bw+11,y-6],[x+bw+11,y+22],[x+bw,y+26]],'#9da88e');
 poly(c,[[x-4,y],[x+bw*.45,y-13],[x+bw+4,y],[x+bw,y+3],[x,y+3]],i%2?'#a96849':'#416c70');poly(c,[[x+bw*.45,y-13],[x+bw*.45+12,y-17],[x+bw+15,y-6],[x+bw+4,y]],i%2?'#c1885c':'#66888a');
 c.fillStyle='#496f71';c.fillRect(x+6,y+8,8,13);c.fillRect(x+bw-13,y+8,7,8);line(c,[[x+6,y+9],[x+14,y+9]],'#f9edc7',1);line(c,[[x-2,y+4],[x+bw+1,y+4]],'#81795866',1);
 }
 c.fillStyle=gradient(c,water,h,'#3caaa8','#073e50');c.fillRect(0,water,w,h-water);
 // Broken building reflections follow the water rather than a mirrored static image.
 for(let j=0;j<9;j++)for(let i=0;i<7;i++){const x=i*w/6+Math.sin(t*.65+j*.8)*4,y=water+4+j*5;c.fillStyle=i%2?'#f0d3a316':'#183f4b14';c.fillRect(x,y,22-j,2);}
 for(let j=0;j<28;j++){const y=water+12+j*j*.65,x=(Math.sin(j*17)*.5+.5)*w;line(c,[[x+Math.sin(t*.3+j)*6,y],[x+22+j*.8+Math.sin(t*.3+j)*6,y]],j%4?'#abe1cd1e':'#f5edc050',1+j*.02);}
 // Mooring dock: top boards, shaded fascia, posts and coiled rope.
 poly(c,[[0,water+19],[w*.29,water+10],[w*.34,water+28],[0,water+44]],'#aa8156');poly(c,[[0,water+44],[w*.34,water+28],[w*.34,water+37],[0,water+55]],'#4e4b3b');
 for(let i=0;i<8;i++){const x=i*w*.044;line(c,[[x,water+20-i*1.2],[x+5,water+42-i*2]],'#635a4266',1);line(c,[[x+2,water+22-i*1.2],[x+7,water+39-i*2]],'#e5bc7f66',1);}
 for(let i=0;i<3;i++){const x=i*w*.13+7,y=water+27-i*3;c.fillStyle=gradient(c,y,y+70,'#93714d','#455046');c.fillRect(x,y,10,65);ellipse(c,x+5,y,6,3,'#dbc393');line(c,[[x+3,y+6],[x+3,y+47]],'#d4ad7755',1);ellipse(c,x+5,y+66,12,3,'#153b4433');}
 for(let j=0;j<3;j++){c.strokeStyle='#d2b789';c.lineWidth=1.5;c.beginPath();c.ellipse(w*.13,water+24,10-j*2,4-j*.5,-.15,0,Math.PI*2);c.stroke();}
 line(c,[[w*.29,water+23],[w*.41,water+45]],'#d5c494',1.5);
 drawBoat(c,{x:w*.55,y:water+34,t,scale:Math.min(w/315,1.18),phase:'ready',caught:0,reduced:false});
 for(let i=0;i<3;i++){const x=w*.18+i*35+Math.sin(t*.35)*10,y=water-97+i%2*9;line(c,[[x-6,y+3],[x,y],[x+6,y+3]],'#457579',1.5);}
 c.save();c.globalAlpha=.75;drawFish(c,w*.47,h*.67,6,t,Math.min(w/145,2.6),1,true,species,false);c.restore();
}
export function gear(c,w,h,kind,tier){
 c.clearRect(0,0,w,h);c.save();c.translate(w*.5,h*.52);const scale=Math.min(w/175,h/110);c.scale(scale,scale);
 if(kind==='rod'){
  const gold=['#67887d','#c69851','#408e9b','#b75d43','#7479b0','#c69a41'][tier],big=12+tier*1.4;
  ellipse(c,-4,45,69,5,'#46533c12');
  c.strokeStyle='#243e47';c.lineWidth=3.2+tier*.35;c.beginPath();c.moveTo(-66,37);c.quadraticCurveTo(8,-30,72,-40);c.stroke();c.strokeStyle=gold;c.lineWidth=1.5;c.stroke();
  for(let i=0;i<6;i++){const x=-30+i*19,y=6-i*8.1;c.strokeStyle='#c2d5ce';c.lineWidth=1.2;c.beginPath();c.ellipse(x,y,3-i*.25,3.5-i*.27,-.65,0,Math.PI*2);c.stroke();line(c,[[x-4,y+3],[x-2,y]],'#344b50',1.5);}
  line(c,[[-72,42],[-42,17]],tier>2?'#334448':'#b58c57',9);line(c,[[-71,40],[-44,18]],tier>2?'#738985':'#e0be82',2);
  for(let i=0;i<5;i++)line(c,[[-67+i*4,39-i*3.5],[-65+i*4,42-i*3.5]],tier>2?'#1c343e':'#8e6948',1);
  if(tier<2){ellipse(c,-39,32,big,big*.85,'#244c53');ellipse(c,-39,31,big-3,big*.62,gold);ellipse(c,-39,31,5,8,'#d8e0cb');line(c,[[-50,23],[-26,27],[-26,38]],'#c7d6cb',1.8);}
  else{poly(c,[[-56,19],[-28,13],[-23,37],[-51,44]],'#304851');ellipse(c,-50,31,8,13,gold);ellipse(c,-27,25,9,13,gold);c.fillStyle='#ccd9c9';c.fillRect(-47,21,18,18);for(let j=0;j<7;j++)line(c,[[-47,22+j*2],[-29,19+j*2]],tier>3?'#b5c5a6':'#92afb1',1);ellipse(c,-27,25,5,8,'#607d7c');}
  line(c,[[-30,33],[-19,44]],'#294b50',3);ellipse(c,-17,45,6,3,'#1b3c45');line(c,[[71,-40],[63,25]],'#91b3a7',1);
  poly(c,[[63,24],[68,34],[64,44],[58,36]],tier>3?'#baaa79':'#93a7a3');line(c,[[63,26],[63,41]],'#e5e6ca',1.5);
 }else{
  ellipse(c,1,46,65,6,'#46533c18');poly(c,[[-65,-16],[41,-28],[68,-13],[-40,1]],'#e5c490');poly(c,[[-59,-16],[40,-23],[59,-13],[-39,-3]],'#536c5b');poly(c,[[-65,-16],[-40,1],[-40,43],[-65,25]],'#956d46');poly(c,[[-40,1],[68,-13],[68,28],[-40,43]],'#c69761');line(c,[[-37,10],[65,-3]],'#efcfa1',3);
  for(let j=0;j<3;j++){line(c,[[-36,18+j*8],[64,5+j*8]],'#8e69455a',1);ellipse(c,-29+j*40,27-j*5,7,1,'#8e694544');}
  const colors=['#e8b7a1','#c48873','#d1dcd1','#9dc3bd','#9ca99c','#80a8a9'];
  for(let i=0;i<5;i++){const x=-31+i*17,y=-11+(i%2)*5;if(tier<2){ellipse(c,x,y,7,4,colors[tier]);line(c,[[x-4,y-2],[x+2,y+1],[x-2,y+3]],'#f9ddbc',1.5);}else drawFish(c,x,y,tier>3?1:0,0,.28,1,true,species,true);}
  // Hook traces visually distinguish larger live-bait rigs from the shrimp tray.
  const n=tier<2?3:1;for(let i=0;i<n;i++){const x=47+i*9;line(c,[[x,-33],[x-5,4]],'#ccd8cc',1);c.strokeStyle='#405f61';c.lineWidth=1.5;c.beginPath();c.arc(x-3,4,3,0,Math.PI);c.stroke();}ellipse(c,54,18,5,7,tier>3?'#d7ad58':'#b8c7b6');
 }c.restore();
}
export function shopInterior(c,w,h){
 c.save();c.scale(w/390,h/135);
 c.fillStyle=gradient(c,0,135,'#203e40','#537466');c.fillRect(0,0,390,135);
 poly(c,[[0,0],[23,12],[23,123],[0,135]],'#172f32');poly(c,[[367,12],[390,0],[390,135],[367,123]],'#29453e');
 for(let i=0;i<11;i++){const x=23+i*33;line(c,[[x,12],[x,124]],'#b9bc8c18',1);for(let j=0;j<3;j++)line(c,[[x+6,20+j*29],[x+7,36+j*29]],'#c3c69810',1);}
 c.fillStyle='#70553c';c.fillRect(0,0,390,11);line(c,[[0,11],[390,11]],'#b38e5b',2);
 // Open sunlit window behind the tackle rack, with thick jambs.
 c.fillStyle='#274849';c.fillRect(154,17,66,67);c.fillStyle=gradient(c,20,82,'#e8e7ba','#65aba2');c.fillRect(160,21,54,57);poly(c,[[160,62],[178,49],[194,58],[214,53],[214,78],[160,78]],'#7caca0');line(c,[[187,20],[187,80]],'#b79963',4);line(c,[[160,48],[214,48]],'#b79963',3);line(c,[[152,83],[223,83]],'#d8b981',4);
 poly(c,[[160,83],[214,83],[251,126],[189,126]],'#eddda519');
 for(let i=0;i<5;i++){const x=29+i*23;line(c,[[x,109],[x+19,17]],['#d6ba78','#96b2ab','#c8955b','#97b5b3','#b29e6b'][i],2.5);line(c,[[x,108],[x+4,90]],'#a98251',5);ellipse(c,x+5,81,7+i*.5,7,'#203f45');ellipse(c,x+5,81,5,5,['#d8b86a','#9ab9b0'][i%2]);ellipse(c,x+5,81,2,3,'#2b5360');}
 line(c,[[17,94],[148,94]],'#8a6845',5);line(c,[[17,91],[148,91]],'#c9aa77',2);
 c.save();c.translate(294,43);c.rotate(-.035);c.fillStyle='#102e3255';c.fillRect(-56,-21,118,44);c.fillStyle=gradient(c,-24,20,'#f4e2b0','#c8ac72');c.fillRect(-58,-24,116,42);c.strokeStyle='#a3814e';c.lineWidth=2;c.strokeRect(-55,-21,110,36);c.fillStyle='#33554e';c.font='800 17px sans-serif';c.textAlign='center';c.fillText('潮風釣具店',0,3);c.restore();
 for(let i=0;i<4;i++){const x=241+i*29;line(c,[[x,70],[x,87]],'#9eb5a1',1);ellipse(c,x,89,3,7,['#deaa62','#afc4b7','#ad6f4b','#ddc68c'][i]);}
 c.fillStyle='#463f31';c.fillRect(230,99,137,8);line(c,[[228,98],[369,98]],'#bc9b64',3);
 for(let i=0;i<3;i++){const x=245+i*40;poly(c,[[x,109],[x+27,106],[x+33,111],[x+5,115]],'#d6b782');poly(c,[[x+5,115],[x+33,111],[x+33,125],[x+5,129]],['#ae7e4e','#648575','#ac7652'][i]);line(c,[[x+7,119],[x+29,116]],'#efe2b366',1);}
 poly(c,[[0,124],[390,124],[390,135],[0,135]],'#91643f');line(c,[[0,124],[390,124]],'#dfbd83',3);line(c,[[0,130],[390,130]],'#77563b',1);c.restore();
}
const stops=[[0,[45,174,169]],[20,[28,139,154]],[60,[18,91,123]],[120,[15,52,82]],[205,[7,27,49]]];
function color(depth){let i=0;while(i<stops.length-2&&depth>stops[i+1][0])i++;const a=stops[i],b=stops[i+1],k=Math.max(0,Math.min(1,(depth-a[0])/(b[0]-a[0])));return `rgb(${a[1].map((v,j)=>Math.round(v+(b[1][j]-v)*k)).join(',')})`;}
export function sea(c,w,h,t,camera,surface,top=0){
 for(let y=0;y<h;y+=6){c.fillStyle=color(worldDepth(y+camera-surface));c.fillRect(0,y,w,7);}
 const sy=surface-camera;if(sy>0){c.fillStyle=gradient(c,0,sy,'#f6deb0','#a8dcd0');c.fillRect(0,0,w,sy);ellipse(c,w*.84,sy-42,24,24,'#fff3c2');}
 c.save();c.globalAlpha=Math.max(0,.055-camera/15000);for(let i=0;i<4;i++)poly(c,[[i*w*.35-40,sy],[i*w*.35+12,sy],[i*w*.35+160,h],[i*w*.35+70,h]],'#dcf7c6');c.restore();
 // Particles and distant schools have world depths; the world changes with depth.
 const from=Math.max(0,Math.floor(worldDepth(camera-surface)/5));for(let k=from;k<from+Math.ceil(h/SCALE/5)+3;k++){const depth=k*5,y=surface+worldY(depth)-camera;for(let j=0;j<3;j++){const x=(Math.sin(k*19+j*3)*.5+.5)*w+Math.sin(t*.2+j)*7;ellipse(c,x,y+j*9,depth>120?1.5:1,depth>120?2:1.5,depth>120?'#99bcce42':'#e9f4d644');}if(k%3===1){c.save();c.globalAlpha=.14;for(let j=0;j<4;j++)drawFish(c,w*(.2+(k%4)*.15)+j*16+Math.sin(t*.35+k)*20,y+j%2*7,k<12?1:3,t,.30,k%2?1:-1,false,species,false);c.restore();}}
 // No seafloor objects are repeated through the water column.
 const bottom=surface+worldY(214)-camera;if(bottom<h+80){poly(c,[[0,bottom+5],[w*.2,bottom-18],[w*.5,bottom+10],[w*.8,bottom-12],[w,bottom],[w,h],[0,h]],'#0c2434');}
 for(let depth=0;depth<=200;depth+=10){const y=surface+worldY(depth)-camera;if(y<top+143||y>h-125)continue;line(c,[[w-23,y],[w-12,y]],'#c5e8df77',1);c.font='600 12px sans-serif';c.fillStyle='#c7e9e0';c.textAlign='right';c.fillText(depth+'m',w-29,y+4);}
}
