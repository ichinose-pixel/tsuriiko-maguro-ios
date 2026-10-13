// Display derivatives of the original project-specific imagegen PNGs.
// Keep the original PNGs beside them for traceability. No remote/CDN dependency.
export const painted={harbor:null,angler:null,bluefin:null};
export const artStatus={loaded:[],failed:[]};
export const artReady=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries({harbor:'harbor-display.webp',angler:'angler-display.webp',bluefin:'bluefin-display.webp'}).map(async([key,file])=>{
 const img=new Image();img.decoding='async';img.src=new URL('./assets/generated/'+file,import.meta.url).href;
 try{await img.decode();painted[key]=img;artStatus.loaded.push(key);}catch{artStatus.failed.push(key);}
}));
export function cover(c,img,w,h){const scale=Math.max(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;c.drawImage(img,(w-dw)*.5,(h-dh)*.48,dw,dh);}
export function paintedHarbor(c,w,h,t,reduced){if(!painted.harbor)return false;cover(c,painted.harbor,w,h);
 // The foreground hull is a masked portion of the same original painting. A subpixel bob keeps its edge joined.
 if(!reduced){const img=painted.harbor,scale=Math.max(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale,ox=(w-dw)*.5,oy=(h-dh)*.48,bob=Math.sin(t*1.5)*.65;c.save();c.translate(ox,oy+bob);c.scale(scale,scale);c.beginPath();[[.46,.53],[.48,.49],[.57,.48],[.585,.455],[.61,.45],[.71,.451],[.73,.48],[.78,.501],[.824,.519],[.827,.566],[.81,.598],[.744,.613],[.57,.6],[.48,.573]].forEach(([x,y],i)=>i?c.lineTo(x*img.width,y*img.height):c.moveTo(x*img.width,y*img.height));c.closePath();c.clip();c.drawImage(img,0,0);c.restore();}
 // Only light on the water moves; the painted buildings and boat remain stable.
 if(!reduced){c.save();c.strokeStyle='#fff0be';c.lineWidth=.8;for(let i=0;i<15;i++){const x=(Math.sin(i*81.1)*.5+.5)*w,y=h*(.64+(i%7)*.041);c.globalAlpha=.045+.06*(.5+.5*Math.sin(t*1.4+i));c.beginPath();c.moveTo(x+Math.sin(t*.3+i)*3,y);c.lineTo(x+12+(i%4)*5+Math.sin(t*.3+i)*3,y);c.stroke();}c.restore();}return true;
}
export function paintedFish(c,w,h){if(!painted.bluefin)return false;const img=painted.bluefin,scale=Math.min(w*.92/img.width,h*.86/img.height),dw=img.width*scale,dh=img.height*scale;c.save();c.translate(w*.51,h*.53);c.scale(-1,1);c.drawImage(img,-dw/2,-dh/2,dw,dh);c.restore();return true;}
