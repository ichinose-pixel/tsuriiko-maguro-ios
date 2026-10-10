import {drawBoat,drawFish} from './art.js?v=harbor-r2';
import {species} from './model.js?v=harbor-r2';
export const SCALE=16;
// A continuous world transform magnifies the first metres without band-boundary jumps.
export const worldY=d=>d<=0?d*40:16*d+528*(1-Math.exp(-d/22));
export function worldDepth(y){if(y<=0)return y/40;let d=y/25;for(let i=0;i<5;i++)d-=(worldY(d)-y)/(16+24*Math.exp(-d/22));return Math.max(0,d);}
const ellipse=(c,x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
const line=(c,pts,col,w=2)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
const poly=(c,pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
const gradient=(c,y1,y2,a,b)=>{const g=c.createLinearGradient(0,y1,0,y2);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
export function harbor(c,w,h,t){
 const water=h*.46;c.fillStyle=gradient(c,0,water,'#ffe8b5','#b1dfd1');c.fillRect(0,0,w,h);ellipse(c,w*.79,water*.56,37,37,'#fff4cf');
 poly(c,[[0,water-22],[w*.13,water-75],[w*.29,water-31],[w*.48,water-60],[w*.73,water-20],[w,water-39],[w,water],[0,water]],'#609f9f');
 for(let i=0;i<7;i++){const x=i*w/6-18,y=water-30-(i%3)*9;c.fillStyle=i%2?'#f1d8a8':'#c9dfcb';c.fillRect(x,y,37,32);poly(c,[[x-4,y],[x+18,y-12],[x+41,y]],i%2?'#bc6c49':'#486f79');c.fillStyle='#527681';c.fillRect(x+6,y+10,8,13);c.fillRect(x+24,y+10,7,9);}
 c.fillStyle=gradient(c,water,h,'#37a9aa','#064957');c.fillRect(0,water,w,h-water);
 for(let j=0;j<20;j++){const y=water+15+j*j*1.6;line(c,[[Math.sin(j*4+t*.2)*w*.3,y],[w*.56+Math.sin(j+t*.3)*w*.3,y]],j%3?'#b1f0d01a':'#e5e9b644',1+j*.06);}
 c.fillStyle='#436e6b';c.fillRect(0,water+25,w*.3,12);for(let i=0;i<3;i++){c.fillStyle='#684c37';c.fillRect(i*w*.11+8,water+24,9,66);line(c,[[i*w*.11+8,water+26],[i*w*.11+17,water+26]],'#ecd1a0',3);}
 drawBoat(c,{x:w*.55,y:water+34,t,scale:Math.min(w/315,1.18),phase:'ready',caught:0,reduced:false});
 for(let i=0;i<3;i++){const x=w*.22+i*35+Math.sin(t*.35)*10,y=water-99+i%2*9;line(c,[[x-6,y+3],[x,y],[x+6,y+3]],'#457579',1.7);}
 c.save();c.globalAlpha=.72;drawFish(c,w*.46,h*.67,6,t,Math.min(w/145,2.6),1,true,species,false);c.restore();
}
export function gear(c,w,h,kind,tier){
 c.clearRect(0,0,w,h);c.save();c.translate(w*.5,h*.52);const scale=Math.min(w/175,h/110);c.scale(scale,scale);
 if(kind==='rod'){
  const gold=['#62836e','#c79950','#4f9f9d','#bb704c','#858dc2','#deba61'][tier];
  c.strokeStyle='#163d47';c.lineWidth=5;c.beginPath();c.moveTo(-66,37);c.quadraticCurveTo(8,-30,72,-40);c.stroke();c.strokeStyle=gold;c.lineWidth=2;c.stroke();
  for(let i=0;i<5;i++){c.strokeStyle='#a7cec7';c.lineWidth=1;c.beginPath();c.arc(-30+i*23,6-i*10,3,0,Math.PI*2);c.stroke();}line(c,[[-72,42],[-42,17]],'#b98749',9);line(c,[[-71,40],[-44,18]],'#e4bd78',3);
  ellipse(c,-39,32,17,15,'#163b49');ellipse(c,-39,32,12,11,gold);ellipse(c,-39,32,6,8,'#e7e7c9');line(c,[[-41,33],[-23,43]],'#274c55',3);ellipse(c,-21,44,4,3,'#244450');line(c,[[70,-39],[62,35]],'#accbc0',1);ellipse(c,62,38,5,9,'#8fa4a2');
 }else{
  poly(c,[[-65,-16],[41,-28],[68,-13],[-40,1]],'#e6c28c');poly(c,[[-65,-16],[-40,1],[-40,43],[-65,25]],'#97673d');poly(c,[[-40,1],[68,-13],[68,28],[-40,43]],'#c99557');line(c,[[-37,10],[65,-3]],'#f3d89d',3);
  for(let i=0;i<6;i++){const x=-30+i*15,y=-13+i%2*5;if(tier<2){ellipse(c,x,y,7,4,'#e1a087');line(c,[[x-4,y],[x+3,y+2]],'#fbe4b1',1);}else{drawFish(c,x,y,0,0,.3,1,true,species,true);}}
  line(c,[[47,-29],[57,-50],[72,-45],[62,-23]],'#d4ddd1',2);ellipse(c,55,9,6,6,'#f0d483');
 }c.restore();
}
export function shopInterior(c,w,h){
 c.save();c.scale(w/390,h/135);w=390;h=135;
 c.fillStyle=gradient(c,0,h,'#163d43','#345950');c.fillRect(0,0,w,h);for(let i=0;i<8;i++){line(c,[[i*w/7,0],[i*w/7,h]],'#b5b98918',2);}c.fillStyle='#a7764b';c.fillRect(0,h*.65,w,8);c.fillRect(0,h*.94,w,8);
 for(let i=0;i<5;i++){const x=w*.12+i*21;line(c,[[x,100],[x+18,12]],i%2?'#dbbd76':'#88b7ad',3);ellipse(c,x+4,76,7,7,'#d0b677');ellipse(c,x+4,76,3,4,'#31505b');}
 c.save();c.translate(w*.7,h*.45);c.rotate(-.05);c.fillStyle='#f7e9bd';c.fillRect(-54,-27,108,47);c.fillStyle='#34554e';c.font='800 17px sans-serif';c.textAlign='center';c.fillText('潮風釣具店',0,3);c.restore();
 for(let i=0;i<3;i++){c.fillStyle=['#b18150','#507e70','#bc7651'][i];c.fillRect(w*.55+i*47,h*.73,38,22);line(c,[[w*.55+i*47,h*.74],[w*.55+i*47+38,h*.74]],'#ead1a0',3);}
 c.fillStyle='#be8a55';c.fillRect(0,h-10,w,10);line(c,[[0,h-10],[w,h-10]],'#f0ca8c',3);c.restore();
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
