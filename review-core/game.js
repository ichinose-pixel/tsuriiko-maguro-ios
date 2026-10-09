import {RecordedAudio} from './audio-engine.js';
import {resultSummary} from './result-summary.js';
import {Game,species,LIMITS} from './model.js';
import {BRAND} from './brand.js';
import {createStorage,createMonetizationPort} from './platform.js';
const $=s=>document.querySelector(s);
let nativeStorage;try{nativeStorage=localStorage;}catch{nativeStorage=null;}
const store=window.__nativeHost?.storage||createStorage(nativeStorage,'tsuriiko.core-review.v1'),legacy=()=>null;
let game=new Game(store.load());if(!game.restored&&store.backup())game=new Game(store.backup());if(!game.restored&&legacy())game=new Game(legacy());
const monetization=createMonetizationPort();
document.title=BRAND.title;document.documentElement.style.setProperty('--accent',BRAND.accent);$('h1').textContent=BRAND.shortTitle;$('#titleName').innerHTML='釣りいこ！<br><em>マグロ大作戦</em>'; 
const canvas=$('#sea'),ctx=canvas.getContext('2d',{alpha:false});
let W=390,H=844,dpr=1,safeTop=0,safeBottom=0,last=0,paused=false,titleOpen=true,bookOpen=false,hidden=false,pointer=false,pointerX=0,audio=null,fx=[],toastUntil=0,lastSave=0,lastUI=0,frameTimes=[],saveOK=true,bookRevision='';
let suspensionGeneration=0;
let soundEnabled=!game.s.muted;
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduced=prefersReduced||game.s.reducedMotion;
function resize(){let r=$('#app').getBoundingClientRect(),style=getComputedStyle($('#app'));W=r.width;H=r.height;safeTop=parseFloat(style.paddingTop)||0;safeBottom=parseFloat(style.paddingBottom)||0;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);$('#app').style.setProperty('--waterline',((H<700?163:183)+safeTop)+'px');draw(game.s.elapsed);}
new ResizeObserver(resize).observe($('#app'));
async function save(){saveOK=await store.write(game.save());$('#saveStatus').textContent=saveOK?'自動保存':'この端末では保存できません';$('#saveNotice').textContent=saveOK?'釣りの途中から再開できます':'保存できないため、この画面を閉じると進捗を失う場合があります';return saveOK;}
function unlock(){if(!soundEnabled||paused||bookOpen)return;if(!audio)audio=new RecordedAudio(game.s.volume);audio.resume().catch(()=>{});}
function note(key){if(soundEnabled&&game.s.volume>0)audio?.play(key);}

function toast(text){$('#toast').textContent=text;$('#toast').style.opacity=1;toastUntil=game.s.elapsed+1.05;}
function setPaused(v){paused=v;pointer=false;save();last=0;if(v)audio?.suspend().catch(()=>{});else unlock();sync();}
function toggleSound(){soundEnabled=!soundEnabled;game.s.muted=!soundEnabled;if(!soundEnabled)audio?.suspend().catch(()=>{});else unlock();note('ui');save();sync();}
$('#pause').onclick=()=>setPaused(true);$('#titleSettings').onclick=()=>setPaused(true);$('#titleBook').onclick=()=>{bookOpen=true;renderBook();sync();};$('#resume').onclick=()=>setPaused(false);
$('#sound').onclick=toggleSound;$('#settingsSound').onclick=toggleSound;
$('#volume').oninput=e=>{game.s.volume=Number(e.target.value)/100;audio?.setVolume(game.s.volume);$('#volumeValue').value=Math.round(game.s.volume*100)+'%';save();};
$('#motion').onchange=e=>{game.s.reducedMotion=e.target.checked;reduced=prefersReduced||game.s.reducedMotion;save();draw(game.s.elapsed);};
$('#enter').onclick=()=>{titleOpen=false;paused=false;if(game.s.phase==='ready')game.start();unlock();save();sync();last=0;};
$('#toTitle').onclick=()=>{paused=false;titleOpen=true;pointer=false;audio?.suspend().catch(()=>{});save();sync();};
$('#cast').onclick=()=>{unlock();game.start();save();sync();};
$('#drop').onclick=()=>{unlock();game.cast();save();sync();};
$('#claim').onclick=async()=>{if(paused)return;const generation=suspensionGeneration,before=game.save();if(!game.claim())return;paused=true;$('#claim').disabled=true;const ok=await save();if(ok){note('coin');game.start();await save();}else{game=new Game(before);}paused=suspensionGeneration!==generation;$('#claim').disabled=false;sync();};
for(const [id,which] of [['upgradeDepth','depth'],['upgradeCapacity','capacity']])$('#'+id).onclick=()=>{unlock();if(game.upgrade(which)){note('upgrade');toast(which==='depth'?'道具を強化！ '+game.maxDepth+'mへ':'仕掛けを強化！');save();sync();}};
$('#bookButton').onclick=()=>{bookOpen=true;pointer=false;audio?.suspend().catch(()=>{});renderBook();sync();};
$('#closeBook').onclick=()=>{bookOpen=false;unlock();sync();};
function renderBook(){
 $('#bookSummary').textContent=`${game.s.book.filter(b=>b.count).length} / ${species.length}種 · 最大 ${game.s.bestWeight.toFixed(1)}kg`;
 $('#bookGrid').replaceChildren();species.forEach((sp,i)=>{const b=game.s.book[i],row=document.createElement('div');row.className='book-row'+(b.count?'':' locked');const icon=document.createElement('canvas');icon.width=150;icon.height=86;icon.setAttribute('aria-label',sp.name+'のシルエット');const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=sp.name;meta.textContent=b.count?`${b.count}尾 · 最大 ${b.best.toFixed(1)}kg`:`${sp.min}mから出会える`;info.append(name,meta);row.append(icon,info);$('#bookGrid').append(row);drawBookFish(icon,i,!!b.count);});
 $('#historyList').replaceChildren();for(const h of game.s.history.slice(0,10)){const row=document.createElement('div');row.className='history-row';const best=[...h.fish].sort((a,b)=>b.weight-a.weight)[0];row.textContent=`第${h.castId}投 · ¥${h.value.toLocaleString()} · ${best?species[best.type].name+' '+best.weight.toFixed(1)+'kg':'調査協力金'}`;$('#historyList').append(row);}
}
function aim(e){let r=canvas.getBoundingClientRect();game.move(game.s.targetX+(e.clientX-pointerX)/r.width*2.2);pointerX=e.clientX;}
$('#app').addEventListener('pointerdown',e=>{if(paused||titleOpen||bookOpen||e.target.closest('button,input'))return;if(['up','down'].includes(game.s.phase)){pointer=true;pointerX=e.clientX;$('#app').setPointerCapture(e.pointerId);unlock();}});
$('#app').addEventListener('pointermove',e=>{if(pointer&&!paused&&!titleOpen&&!bookOpen)aim(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#app').addEventListener(event,()=>pointer=false);
document.addEventListener('keydown',e=>{if(e.code==='Escape'){if(bookOpen){bookOpen=false;sync();}else setPaused(!paused);return;}if(paused||titleOpen||bookOpen)return;if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft')game.move(game.s.targetX-.12);if(e.code==='ArrowRight')game.move(game.s.targetX+.12);if(e.code==='Space'){unlock();if(game.s.phase==='aim')game.cast();else if(game.s.phase==='result'){$('#claim').click();}else game.start();save();sync();}});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden){if(['down','up','aim','landing'].includes(game.s.phase)&&!titleOpen)setPaused(true);save();audio?.suspend().catch(()=>{});}last=0;});
window.addEventListener('pagehide',()=>{audio?.suspend().catch(()=>{});save();});
function background(){suspensionGeneration++;pointer=false;hidden=true;paused=true;last=0;audio?.suspend().catch(()=>{});save();sync();}
// Resume remains paused and silent until an explicit user gesture.
window.addEventListener('nativeAudioInterrupted',()=>{background();hidden=document.hidden;});
function foreground(){hidden=document.hidden;last=0;sync();}
if(window.__nativeHost){window.__nativeHost.App.addListener('appStateChange',({isActive})=>isActive?foreground():background());window.__nativeHost.App.addListener('pause',background);window.__nativeHost.App.addListener('resume',foreground);}

function sync(){
 const s=game.s,active=['down','up','landing'].includes(s.phase),ready=s.phase==='ready',result=s.phase==='result',aiming=s.phase==='aim';
 $('#money').textContent='¥'+(s.money+landedValue()).toLocaleString();$('#capacity').textContent=`${s.caught.length} / ${game.capacity} 尾`;$('#depth').textContent=active?Math.ceil(s.depth)+' m':game.maxDepth+' m';
 $('#sound').textContent=soundEnabled?'音 ON':'音 OFF';$('#sound').setAttribute('aria-label',soundEnabled?'音をオフにする':'音をオンにする');$('#settingsSound').textContent=soundEnabled?'音をオフにする':'音をオンにする';
 $('#volume').value=Math.round(s.volume*100);$('#volumeValue').value=Math.round(s.volume*100)+'%';$('#motion').checked=s.reducedMotion;
 $('#result').hidden=!result;$('#upgrades').hidden=!(aiming&&s.casts>0);$('#cast').hidden=!ready;$('#claim').hidden=!result;$('#timing').hidden=!aiming;$('#steering').hidden=!active;
 $('#upgradeCapacity').hidden=false;$('#bookButton').hidden=!s.totalFish;
 $('#app').classList.toggle('on-title',titleOpen);$('#app').dataset.phase=s.phase;$('#app').classList.toggle('experienced',s.casts>1);
 $('#mission').textContent=game.nextGoal().text;
 if(result){const {best,isRecord,isDiscovery}=resultSummary(s);$('#resultTitle').textContent=best?species[best.type].name+'、水揚げ！':'次の一投につなげよう';$('#resultMoney').textContent='+ ¥'+s.earnings.toLocaleString();$('#resultDetail').textContent=best?`${best.weight.toFixed(1)}kg · 全${s.caught.length}尾の釣果`:'調査協力金 ¥40';$('#recordBadge').textContent=isDiscovery?'初めての魚を発見！':isRecord?'最大重量を更新！':'';}
 for(const [id,which] of [['upgradeDepth','depth'],['upgradeCapacity','capacity']]){const el=$('#'+id),level=which==='depth'?s.depthLevel:s.capLevel,max=which==='depth'?LIMITS.depthLevel:LIMITS.capLevel;el.disabled=s.money<game.cost(which)||level>=max;el.querySelector('b').textContent=level>=max?'最大強化':'¥'+game.cost(which).toLocaleString();el.querySelector('small').textContent=which==='depth'?`${game.maxDepth}m → ${game.maxDepth+2}m`:`${game.capacity}尾 → ${game.capacity+1}尾`;}
 $('#instruction').textContent=s.phase==='down'?'投下中':s.phase==='landing'?'水揚げ！':s.caught.length===game.capacity?'満杯 → 船へ':s.casts>1?'‹ 左右にスライド ›':'海を左右にドラッグして狙う';
 $('#timing').style.setProperty('--angle',(Math.sin(s.spinner)*135)+'deg');
 $('#titleOverlay').hidden=!titleOpen;$('#pauseOverlay').hidden=!paused;$('#bookOverlay').hidden=!bookOpen;
 $('#enter').textContent=s.phase==='result'?'釣果を確認する →':s.casts?'続きから →':'出航する →';$('#titleProgress').textContent=s.casts?`${game.maxDepth}m · ${s.book.filter(b=>b.count).length}種 · 所持金 ¥${s.money.toLocaleString()}`:'浅場から、マグロの海へ';
}

function path(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function line(points,color,width=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
function renderFish(c,x,y,type,t,scale=1,dir=1,glow=false,known=true){
 if(reduced)t=0;const sp=species[type],z=sp.size,shape=sp.shape;
 const h={slender:.2,striped:.28,bonito:.38,longfin:.30,bigeye:.44,sickle:.34,barrel:.49}[shape];
 c.save();c.translate(x,y);c.scale(dir*scale,scale);c.rotate(Math.sin(t*4)*.035);
 const fill=known?sp.color:'#365a70',fin=known?(type===5?'#ffda58':type===3?'#d9e6ef':'#397d9d'):'#365a70';
 function polygon(p,col){c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill();}
 function oval(x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill();}
 if(glow){c.shadowColor=type===5?'#ffd35f':'#a9d9ee';c.shadowBlur=reduced?4:13;}
 const wag=Math.sin(t*7)*z*.08,tail=type>=3?.64:.43;
 polygon([[-z*.58,0],[-z*1.05,-z*tail+wag],[-z*.84,0],[-z*1.05,z*tail+wag]],fin);
 c.beginPath();c.moveTo(z*.9,0);c.bezierCurveTo(z*.47,-z*h*1.5,-z*.45,-z*h*1.2,-z*.65,0);c.bezierCurveTo(-z*.38,z*h*1.2,z*.43,z*h*1.4,z*.9,0);c.fillStyle=fill;c.fill();c.shadowBlur=0;
 if(known){c.beginPath();c.moveTo(-z*.58,z*.025);c.quadraticCurveTo(z*.12,z*h*1.12,z*.84,z*.015);c.quadraticCurveTo(z*.16,z*h*.37,-z*.58,z*.025);c.fillStyle='#dfede2';c.fill();}
 if(shape==='sickle'){
  c.beginPath();c.moveTo(-z*.1,-z*.27);c.quadraticCurveTo(z*.25,-z*.82,z*.60,-z*.68);c.quadraticCurveTo(z*.18,-z*.56,z*.35,-z*.29);c.fillStyle=fin;c.fill();
  polygon([[z*.02,z*.13],[z*.49,z*.63],[z*.31,z*.2]],fin);
 }else{polygon([[-z*.15,-z*h*.8],[z*.04,-z*(shape==='barrel'?.72:.58)],[z*.35,-z*h*.73]],fin);}
 if(shape==='longfin')polygon([[z*.22,-z*.01],[-z*.62,z*.83],[-z*.22,z*.23]],fin);
 else polygon([[z*.2,0],[-z*.20,z*(shape==='bigeye'?.55:.4)],[z*.34,z*.14]],fin);
 if(known&&(shape==='bonito'||shape==='striped')){for(let i=0;i<5;i++){c.beginPath();c.moveTo(-z*.42+i*z*.16,shape==='bonito'?z*.1:-z*h*.7);c.lineTo(-z*.28+i*z*.16,shape==='bonito'?z*.31:-z*.03);c.strokeStyle='#205578';c.lineWidth=1.6;c.stroke();}}
 if(type>=3)for(let i=0;i<4;i++)polygon([[-z*.33-i*z*.07,-z*.15],[-z*.39-i*z*.07,-z*.28],[-z*.44-i*z*.07,-z*.13]],fin);
 let eye=shape==='bigeye'?z*.13:Math.max(2.5,z*.06);oval(z*.59,-z*.06,eye,eye,known?'#fff5d8':'#365a70');if(known)oval(z*.62,-z*.06,eye*.55,eye*.65,'#0a2b40');
 c.restore();
}
function fish(...args){renderFish(ctx,...args);}
function drawBookFish(canvas,type,known){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);renderFish(c,78,45,type,0,Math.min(1.5,58/species[type].size),1,false,known);}

// Fixed world scale: upgrading depth reveals more ocean, never shrinks fish.
const PIXELS_PER_METRE=82;
let camera=0,pops=[],saleNotes=0;
const surface=()=>(titleOpen?H*.40:Math.max(238+safeTop*.5,H*.34));
const waterBottom=()=>H-safeBottom-72;
function fishY(depth){return surface()+depth*PIXELS_PER_METRE-camera;}
function landedCount(){return game.s.phase==='result'?game.s.caught.length:game.s.phase==='landing'?Math.max(0,Math.min(game.s.caught.length,Math.floor((game.s.landing-.63)/.22)+1)):0;}
function landedValue(){return game.s.caughtDetails.slice(0,landedCount()).reduce((n,f)=>n+f.value,0);}
function boat(t){
 if(reduced)t=0;const s=game.s,landing=s.phase==='landing',lift=landing?Math.sin(Math.min(1,s.landing/.6)*Math.PI):0;
 ctx.save();ctx.translate(W*.5,surface()-camera-13+Math.sin(t*1.8)*2);ctx.rotate(Math.sin(t*1.5)*.016);let z=Math.min(1,W/360);ctx.scale(z,z);
 ellipse(0,19,110,9,'#086c8270');path([[-113,-7],[105,-7],[85,28],[-85,28]],'#fff3cf');path([[-108,1],[98,1],[89,15],[-96,15]],'#f36b3d');path([[-92,18],[88,18],[82,28],[-85,28]],'#153d63');
 path([[12,-10],[12,-58],[61,-58],[76,-10]],'#fff7dc');path([[21,-49],[51,-49],[62,-25],[21,-25]],'#246985');line([[41,-49],[41,-25]],'#faf4d7',4);path([[6,-56],[68,-56],[64,-65],[12,-65]],'#173f64');
 line([[-103,-8],[-103,-28],[-69,-28],[-69,-8]],'#fff7e3',3);line([[85,-8],[85,-30],[103,-30]],'#fff7e3',3);line([[-79,-9],[-85,-39]],'#174e70',4);line([[77,-9],[77,-69]],'#fff3cd',3);path([[77,-68],[106,-60],[77,-52]],'#ffc744');
 // Original animated angler: rain jacket, bucket hat and a bending rod.
 const arm=lift*20;path([[-54,-38],[-30,-39],[-24,-8],[-61,-8]],'#ffc744');path([[-53,-9],[-43,-9],[-44,1],[-57,1]],'#173f64');path([[-34,-9],[-24,-9],[-20,1],[-33,1]],'#173f64');
 ellipse(-43,-51,12,13,'#efb17b');path([[-59,-59],[-26,-59],[-29,-66],[-54,-66]],'#0c5974');ellipse(-42,-58,20,4,'#127695');ellipse(-36,-51,2,2,'#17364d');
 line([[-35,-32],[-19,-26-arm],[1,-33-arm]],'#efb17b',7);line([[-50,-30],[-30,-22],[-15,-32-arm]],'#efb17b',7);
 ctx.beginPath();ctx.moveTo(-14,-31-arm);ctx.quadraticCurveTo(28,-104-arm,65,-45+Math.min(22,s.caught.length*5)-arm);ctx.strokeStyle='#173f64';ctx.lineWidth=4;ctx.stroke();ellipse(-8,-35-arm,6,6,'#f4e9c5');ellipse(-8,-35-arm,3,3,'#de6b40');
 ctx.fillStyle='#173f64';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('釣りいこ！',0,14);ctx.restore();
}
function draw(t){
 const s=game.s,active=['down','up'].includes(s.phase);
 const target=active?Math.max(0,s.depth*PIXELS_PER_METRE-(H*.58-surface())):0;
 camera+=(target-camera)*.22;if(Math.abs(target-camera)<.02)camera=target;
 ctx.setTransform(dpr,0,0,dpr,0,0);const sy=surface()-camera;
 let sea=ctx.createLinearGradient(0,0,0,H);sea.addColorStop(0,'#36bdd0');sea.addColorStop(.55,'#168eb5');sea.addColorStop(1,'#12629c');ctx.fillStyle=sea;ctx.fillRect(0,0,W,H);
 if(sy>0){ctx.fillStyle='#a5e9ef';ctx.fillRect(0,0,W,sy);ellipse(W*.84,sy-113,30,30,'#fff4bc');path([[0,sy-15],[W*.12,sy-48],[W*.23,sy-23],[W*.39,sy-56],[W*.55,sy-20],[W,sy-10],[W,sy],[0,sy]],'#62bac3');}
 ctx.save();ctx.globalAlpha=.1;for(let i=0;i<5;i++)path([[i*100-60,sy],[i*100-12,sy],[i*100+180,H],[i*100+80,H]],'#c8ffff');ctx.restore();
 for(let i=0;i<4;i++){let y=sy+i*7;if(y<0)continue;ctx.beginPath();for(let x=-10;x<W+20;x+=5){let yy=y+Math.sin(x*.038+t*2+i)*2;x===-10?ctx.moveTo(x,yy):ctx.lineTo(x,yy);}ctx.strokeStyle=i<2?'#e4ffff':'#78dede66';ctx.lineWidth=i?2:4;ctx.stroke();}
 for(let m=1;!titleOpen&&m<game.maxDepth+2;m++){let y=fishY(m);if(y<120||y>H-55)continue;line([[W-25,y],[W-15,y]],'#e1ffff66',2);ctx.fillStyle='#e1ffffbb';ctx.font='bold 12px system-ui';ctx.textAlign='right';ctx.fillText(m+'m',W-30,y+4);}
 boat(t);
 if(sy>0){for(let i=0;i<3;i++){let x=W*.15+i*36+Math.sin(t*.5)*15,y=sy-108-i%2*12;line([[x-7,y+3],[x,y],[x+7,y+3]],'#23637b',2);}for(let i=0;i<3;i++){let x=W*.16+i*W*.32;ctx.beginPath();ctx.ellipse(x,sy+6,14+Math.sin(t*3+i)*4,3,0,0,Math.PI*2);ctx.strokeStyle='#d4ffff88';ctx.lineWidth=2;ctx.stroke();}}
 if(titleOpen){
  ctx.save();ctx.translate(W*.51,H*.55);ctx.rotate(-.18+Math.sin(t)*.025);fish(0,0,5,t,Math.min(3.05,W/135),-1,true);ctx.restore();
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ellipse(W*.5+Math.cos(a)*(W*.38),H*.55+Math.sin(a)*45,3,6,'#e8ffffb0');}
 }else if(active){
  for(const f of s.fish){let y=fishY(f.depth);if(!f.caught&&y>105&&y<H+55)fish(f.x*W,y,f.type,t+f.phase,1.18,f.speed>0?1:-1,f.type>=3);}
  const hx=s.x*W,hy=fishY(s.depth);ctx.beginPath();ctx.moveTo(W*.5+60,sy-54);ctx.quadraticCurveTo(hx-20,hy-100,hx,hy);ctx.strokeStyle='#fffde7';ctx.lineWidth=2.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(hx,hy-9);ctx.lineTo(hx,hy+9);ctx.quadraticCurveTo(hx+16,hy+21,hx+16,hy+1);ctx.strokeStyle='#ffe06f';ctx.lineWidth=5;ctx.stroke();
  for(let i=0;i<s.caught.length;i++){const type=s.caught[i],x=hx+(i%2?19:-19),y=hy+20+i*13;ctx.save();ctx.translate(x,y);ctx.rotate((i%2?1:-1)*.45+Math.sin(t*8+i)*.12);fish(0,0,type,t+i,1.12,i%2?1:-1,type>=3);ctx.restore();}
 }else if(s.phase==='landing'||s.phase==='result'){
  for(let i=0;i<s.caught.length;i++){
   const p=s.phase==='result'?1:Math.max(0,Math.min(1,(s.landing-i*.22)/.63));
   if(p<1){let x=s.x*W+(W*.5-22-s.x*W)*p,y=sy+27-125*Math.sin(p*Math.PI)-55*p;ctx.save();ctx.translate(x,y);ctx.rotate(-p*2.5);fish(0,0,s.caught[i],t+i,1.2,1,s.caught[i]>=3);ctx.restore();}
   else{fish(W*.5-30+i*14,sy-14-i*4,s.caught[i],0,.6,i%2?1:-1);let age=s.landing-(.63+i*.22);if(s.phase==='landing'&&age<.65){ctx.textAlign='center';ctx.font='900 25px system-ui';ctx.strokeStyle='#174d68';ctx.lineWidth=4;ctx.strokeText('+¥'+s.caughtDetails[i].value,W*.5,sy-70-age*45);ctx.fillStyle='#fff2a3';ctx.fillText('+¥'+s.caughtDetails[i].value,W*.5,sy-70-age*45);}}
  }
  const count=landedCount();if(count>saleNotes){saleNotes=count;note('coin');}
 }else{for(let i=0;i<8;i++){const x=((i*83+t*(i%2?13:-10))%(W+120)+W+120)%(W+120)-60;fish(x,sy+85+i*53,i===7?3:i%3,t+i,1.18,i%2?1:-1,i===7);}}
 for(let i=0;i<15;i++){let y=sy+((i*83-t*15)%900+900)%900;ctx.strokeStyle='#c7ffff44';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc((i*79)%W,y,2+i%3,0,6.28);ctx.stroke();}
 for(const p of pops){let age=t-p.at;if(age>1)continue;ctx.save();ctx.globalAlpha=1-age;ctx.textAlign='center';ctx.font='900 22px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#07597c';let y=fishY(p.depth)-25-age*36;ctx.strokeText('+¥'+p.value,p.x,y);ctx.fillStyle='#fff3a4';ctx.fillText('+¥'+p.value,p.x,y);ctx.restore();}pops=pops.filter(p=>t-p.at<1);
 for(const p of fx){let age=t-p.at;if(age>1)continue;ctx.globalAlpha=1-age;ellipse(p.x+Math.cos(p.a)*age*70,fishY(p.depth)+Math.sin(p.a)*age*50,3,3,p.big?'#ffde64':'#efffff');}ctx.globalAlpha=1;fx=fx.filter(p=>t-p.at<1);
}


function events(){for(const e of game.drain()){
 if(e.type==='catch'){
  note(e.fish>=3?'bigCatch':'catch'); pops.push({x:e.x*W,depth:e.depth,value:e.value,at:game.s.elapsed});if(e.fish>=2)toast(species[e.fish].name+' HIT！');
  for(let i=0;i<(reduced?4:14);i++)fx.push({x:e.x*W,depth:e.depth,a:i/14*6.28,at:game.s.elapsed,big:e.fish>=3});save();
 }
 if(e.type==='turn'&&game.s.casts===1)toast('海を左右にドラッグ');
 if(e.type==='cast')note('cast');
 if(e.type==='land'){note('splash');note('land');saleNotes=0;}
 if(e.type==='result'){note('result');save();}
 if(e.type==='cast'&&e.power>.985)toast('絶好の投下！');
}}
function frame(now){const rawDt=last?(now-last)/1000:0,dt=Math.min(rawDt,.05);last=now;
 if(!paused&&!hidden&&!titleOpen&&!bookOpen){game.step(dt);events();audio?.update(game.s.phase);if(game.s.elapsed>toastUntil)$('#toast').style.opacity=0;if(game.s.elapsed-lastSave>1&&['down','up','landing'].includes(game.s.phase)){save();lastSave=game.s.elapsed;}if(now-lastUI>90){sync();lastUI=now;}if(game.s.phase==='aim')$('#timing').style.setProperty('--angle',(Math.sin(game.s.spinner)*135)+'deg');draw(game.s.elapsed);if(rawDt>0){frameTimes.push(rawDt*1000);if(frameTimes.length>600)frameTimes.shift();}}
 
 if(titleOpen&&!paused&&!bookOpen){draw(now/1000);}
 requestAnimationFrame(frame);
}
// Diagnostics are read-only. Experience/balance tests must not use fish coordinates.
window.__diagnostics={snapshot:()=>JSON.parse(game.save()),audio:()=>audio?.diagnostics()||{state:'not-created'},metrics:()=>({canvas:[canvas.width,canvas.height],css:[W,H],dpr,safeTop,safeBottom,waterArea:waterBottom()-surface(),meanFrameMs:frameTimes.reduce((a,b)=>a+b,0)/(frameTimes.length||1),paused,titleOpen,bookOpen,audioState:audio?.state||'not-created',soundEnabled,saveOK}),monetization:()=>monetization.getEntitlement()};
resize();sync();requestAnimationFrame(frame);
