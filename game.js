import {resultSummary} from './result-summary.js';
import {Game,species,LIMITS} from './model.js';
import {BRAND} from './brand.js';
import {createStorage,createMonetizationPort} from './platform.js';
const $=s=>document.querySelector(s);
let nativeStorage;try{nativeStorage=localStorage;}catch{nativeStorage=null;}
const store=window.__nativeHost?.storage||createStorage(nativeStorage),legacy=()=>{try{return nativeStorage?.getItem('kuroshio.prototype.v1');}catch{return null;}};
let game=new Game(store.load());if(!game.restored&&store.backup())game=new Game(store.backup());if(!game.restored&&legacy())game=new Game(legacy());
const monetization=createMonetizationPort();
document.title=BRAND.title;document.documentElement.style.setProperty('--accent',BRAND.accent);$('h1').textContent=BRAND.shortTitle;$('#titleName').textContent=BRAND.shortTitle;
const canvas=$('#sea'),ctx=canvas.getContext('2d',{alpha:false});
let W=390,H=844,dpr=1,safeTop=0,safeBottom=0,last=0,paused=false,titleOpen=true,bookOpen=false,hidden=false,pointer=false,pointerX=0,audio=null,fx=[],toastUntil=0,lastSave=0,lastUI=0,frameTimes=[],saveOK=true,bookRevision='';
let suspensionGeneration=0;
let soundEnabled=!game.s.muted;
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduced=prefersReduced||game.s.reducedMotion;
function resize(){let r=$('#app').getBoundingClientRect(),style=getComputedStyle($('#app'));W=r.width;H=r.height;safeTop=parseFloat(style.paddingTop)||0;safeBottom=parseFloat(style.paddingBottom)||0;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);$('#app').style.setProperty('--waterline',((H<700?163:183)+safeTop)+'px');draw(game.s.elapsed);}
new ResizeObserver(resize).observe($('#app'));
async function save(){saveOK=await store.write(game.save());$('#saveStatus').textContent=saveOK?'自動保存':'この端末では保存できません';$('#saveNotice').textContent=saveOK?'釣りの途中から再開できます':'保存できないため、この画面を閉じると進捗を失う場合があります';return saveOK;}
function unlock(){if(!soundEnabled)return;if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audio=new AC();}if(audio&&audio.state!=='running'&&audio.state!=='closed'&&!paused&&!titleOpen&&!bookOpen)audio.resume().catch(()=>{});}
function note(f=440,d=.1,v=.045){if(!soundEnabled||game.s.volume<=0||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*1.3,audio.currentTime+d);g.gain.setValueAtTime(v*game.s.volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function toast(text){$('#toast').textContent=text;$('#toast').style.opacity=1;toastUntil=game.s.elapsed+1.05;}
function setPaused(v){paused=v;pointer=false;save();last=0;if(v)audio?.suspend().catch(()=>{});else unlock();sync();}
function toggleSound(){soundEnabled=!soundEnabled;game.s.muted=!soundEnabled;if(!soundEnabled)audio?.suspend().catch(()=>{});else unlock();note(540);save();sync();}
$('#pause').onclick=()=>setPaused(true);$('#titleSettings').onclick=()=>setPaused(true);$('#resume').onclick=()=>setPaused(false);
$('#sound').onclick=toggleSound;$('#settingsSound').onclick=toggleSound;
$('#volume').oninput=e=>{game.s.volume=Number(e.target.value)/100;$('#volumeValue').value=Math.round(game.s.volume*100)+'%';save();};
$('#motion').onchange=e=>{game.s.reducedMotion=e.target.checked;reduced=prefersReduced||game.s.reducedMotion;save();draw(game.s.elapsed);};
$('#enter').onclick=()=>{titleOpen=false;paused=false;if(game.s.phase==='ready')game.start();unlock();save();sync();last=0;};
$('#toTitle').onclick=()=>{paused=false;titleOpen=true;pointer=false;audio?.suspend().catch(()=>{});save();sync();};
$('#cast').onclick=()=>{unlock();game.start();save();sync();};
$('#drop').onclick=()=>{unlock();game.cast();save();sync();};
$('#claim').onclick=async()=>{if(paused)return;const generation=suspensionGeneration,before=game.save();if(!game.claim())return;paused=true;$('#claim').disabled=true;const ok=await save();if(ok){note(880,.25);game.start();await save();}else{game=new Game(before);}paused=suspensionGeneration!==generation;$('#claim').disabled=false;sync();};
for(const [id,which] of [['upgradeDepth','depth'],['upgradeCapacity','capacity']])$('#'+id).onclick=()=>{unlock();if(game.upgrade(which)){note(660,.2);toast(which==='depth'?'道具を強化！ '+game.maxDepth+'mへ':'仕掛けを強化！');save();sync();}};
$('#bookButton').onclick=()=>{bookOpen=true;pointer=false;audio?.suspend().catch(()=>{});renderBook();sync();};
$('#closeBook').onclick=()=>{bookOpen=false;unlock();sync();};
function renderBook(){
 $('#bookSummary').textContent=`${game.s.book.filter(b=>b.count).length} / ${species.length}種 · 最大 ${game.s.bestWeight.toFixed(1)}kg`;
 $('#bookGrid').replaceChildren();species.forEach((sp,i)=>{const b=game.s.book[i],row=document.createElement('div');row.className='book-row'+(b.count?'':' locked');const icon=document.createElement('canvas');icon.width=150;icon.height=86;icon.setAttribute('aria-label',sp.name+'のシルエット');const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=sp.name;meta.textContent=b.count?`${b.count}尾 · 最大 ${b.best.toFixed(1)}kg`:`${sp.min}mから出会える`;info.append(name,meta);row.append(icon,info);$('#bookGrid').append(row);drawBookFish(icon,i,!!b.count);});
 $('#historyList').replaceChildren();for(const h of game.s.history.slice(0,10)){const row=document.createElement('div');row.className='history-row';const best=[...h.fish].sort((a,b)=>b.weight-a.weight)[0];row.textContent=`第${h.castId}投 · ¥${h.value.toLocaleString()} · ${best?species[best.type].name+' '+best.weight.toFixed(1)+'kg':'調査協力金'}`;$('#historyList').append(row);}
}
function aim(e){let r=canvas.getBoundingClientRect();game.move(game.s.targetX+(e.clientX-pointerX)/r.width);pointerX=e.clientX;}
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
 $('#money').textContent='¥'+s.money.toLocaleString();$('#capacity').textContent=`${s.caught.length} / ${game.capacity} 尾`;$('#depth').textContent=active?Math.ceil(s.depth)+' m':game.maxDepth+' m';
 $('#sound').textContent=soundEnabled?'音 ON':'音 OFF';$('#sound').setAttribute('aria-label',soundEnabled?'音をオフにする':'音をオンにする');$('#settingsSound').textContent=soundEnabled?'音をオフにする':'音をオンにする';
 $('#volume').value=Math.round(s.volume*100);$('#volumeValue').value=Math.round(s.volume*100)+'%';$('#motion').checked=s.reducedMotion;
 $('#result').hidden=!result;$('#upgrades').hidden=!(aiming&&s.casts>0);$('#cast').hidden=!ready;$('#claim').hidden=!result;$('#timing').hidden=!aiming;$('#steering').hidden=!active;
 $('#upgradeCapacity').hidden=s.depthLevel<1;$('#bookButton').hidden=!s.totalFish;
 $('#app').classList.toggle('on-title',titleOpen);$('#app').dataset.phase=s.phase;$('#app').classList.toggle('experienced',s.casts>1);
 $('#mission').textContent=game.nextGoal().text;
 if(result){const {best,isRecord,isDiscovery}=resultSummary(s);$('#resultTitle').textContent=best?species[best.type].name+'、水揚げ！':'次の一投につなげよう';$('#resultMoney').textContent='+ ¥'+s.earnings.toLocaleString();$('#resultDetail').textContent=best?`${best.weight.toFixed(1)}kg · 全${s.caught.length}尾の釣果`:'調査協力金 ¥40';$('#recordBadge').textContent=isDiscovery?'初めての魚を発見！':isRecord?'最大重量を更新！':'';}
 for(const [id,which] of [['upgradeDepth','depth'],['upgradeCapacity','capacity']]){const el=$('#'+id),level=which==='depth'?s.depthLevel:s.capLevel,max=which==='depth'?LIMITS.depthLevel:LIMITS.capLevel;el.disabled=s.money<game.cost(which)||level>=max;el.querySelector('b').textContent=level>=max?'最大強化':'¥'+game.cost(which).toLocaleString();el.querySelector('small').textContent=which==='depth'?`${game.maxDepth}m → ${game.maxDepth+14}m`:`${game.capacity}尾 → ${game.capacity+1}尾`;}
 $('#instruction').textContent=s.phase==='down'?'投下中':s.phase==='landing'?'水揚げ・計測中':s.caught.length===game.capacity?'満杯 → 船へ':s.casts>1?'‹ 左右にスライド ›':'海を左右にドラッグして狙う';
 $('#needle').style.left=`${50+Math.sin(s.spinner)*46}%`;
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
  c.beginPath();c.moveTo(-z*.1,-z*.27);c.quadraticCurveTo(z*.25,-z*1.15,z*.60,-z*.92);c.quadraticCurveTo(z*.18,-z*.56,z*.35,-z*.29);c.fillStyle=fin;c.fill();
  polygon([[z*.02,z*.13],[z*.49,z*.89],[z*.31,z*.2]],fin);
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

const surface=()=>(H<700?163:183)+safeTop;
const waterBottom=()=>H-safeBottom-(game.s.casts>1?62:90);
function fishY(depth){return surface()+24+(waterBottom()-surface()-35)*depth/game.s.castDepth;}
function boat(t){if(reduced)t=0;let y=surface()-12,x=W*.5;ctx.save();ctx.translate(x,y+Math.sin(t*1.7)*2);ctx.scale(.85,.85);ctx.rotate(Math.sin(t*1.3)*.012);ellipse(0,20,88,7,'#103f5577');path([[-80,-6],[80,-6],[60,20],[-59,20]],'#e9e5cb');path([[-76,1],[74,1],[68,10],[-67,10]],[BRAND.hullStripe,'#389d9a','#3c73a5','#ba9553','#a181b2'][game.gearStage]);path([[-20,-10],[-18,-48],[24,-48],[42,-10]],'#f5ecda');path([[-11,-40],[17,-40],[27,-20],[-11,-20]],'#407d92');line([[3,-40],[3,-20]],'#d4dfd7',3);path([[-27,-47],[26,-47],[23,-55],[-22,-55]],'#163f53');line([[-54,-8],[-54,-22],[-30,-22]],'#eee4c3',3);line([[46,-11],[46,-46]],'#e8d9ba',3);path([[46,-44],[66,-40],[46,-34]],'#e77d51');ellipse(-36,-30,7,8,'#dca679');path([[-44,-25],[-33,-24],[-26,-8],[-47,-8]],'#344b62');ellipse(-36,-37,11,3,'#f0cc77');path([[-44,-37],[-41,-44],[-30,-44],[-27,-37]],'#edc477');if(game.gearStage>=1){ellipse(-23,-14,5,5,'#c6e3ea');line([[-62,-8],[-62,-29]],'#b6d6d9',3);}if(game.gearStage>=2){path([[-33,-53],[34,-53],[26,-61],[-28,-61]],'#8cb8c8');}if(game.gearStage>=3){line([[-45,-8],[-90,-48]],'#d8c58c',2);line([[48,-8],[92,-48]],'#d8c58c',2);}let tension=game.s.caught.some(i=>i>=3)&&game.s.phase==='up';let bend=game.s.flash>0?28:tension?14+Math.sin(t*8)*4:0;ctx.beginPath();ctx.moveTo(-29,-20);ctx.quadraticCurveTo(9,-91,49,-33+bend);ctx.strokeStyle=game.s.depthLevel?'#cee4e9':'#d9bb78';ctx.lineWidth=2.6+Math.min(1,game.s.capLevel*.2);ctx.stroke();line([[-35,-18],[-22,-22]],'#dca679',4);ctx.restore();}
function draw(t){ctx.setTransform(dpr,0,0,dpr,0,0);let sky=ctx.createLinearGradient(0,0,0,surface());sky.addColorStop(0,'#082e48');sky.addColorStop(.6,'#306274');sky.addColorStop(1,'#e5b781');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);ellipse(W*.83,surface()-50,24,24,'#f4ce8a');path([[0,surface()-22],[W*.12,surface()-47],[W*.26,surface()-28],[W*.41,surface()-54],[W*.6,surface()-18],[W,surface()-28],[W,surface()+15],[0,surface()+15]],'#416b75');path([[0,surface()-5],[W*.18,surface()-22],[W*.34,surface()-12],[W*.55,surface()-24],[W,surface()-7],[W,surface()+15],[0,surface()+15]],'#285865');let g=ctx.createLinearGradient(0,surface(),0,H);g.addColorStop(0,'#238da0');g.addColorStop(.35,'#126178');g.addColorStop(1,'#08293f');ctx.fillStyle=g;ctx.fillRect(0,surface(),W,H);ctx.save();ctx.globalAlpha=.05;for(let i=0;i<5;i++)path([[i*110-50+Math.sin(t*.2)*10,surface()],[i*110+10,surface()],[i*110+190,H],[i*110+80,H]],'#eafbee');ctx.restore();for(let i=0;i<7;i++){let y=surface()+i*7;ctx.beginPath();for(let x=-10;x<W+20;x+=5){let yy=y+Math.sin(x*.025+t*1.5+i)*2; x===-10?ctx.moveTo(x,yy):ctx.lineTo(x,yy);}ctx.strokeStyle=i<2?'#9bddcfaa':'#4eb8b533';ctx.lineWidth=2;ctx.stroke();}boat(t);
 const active=['down','up'].includes(game.s.phase);let s=game.s;
 if(active){
  for(let m=10;m<s.castDepth;m+=10){let y=fishY(m);line([[W-27,y],[W-21,y]],'#b4dfdf55',1);ctx.fillStyle='#d0eeeb88';ctx.font='10px system-ui';ctx.fillText(m+'m',W-21,y+3);}
  // Value is communicated by silhouette and colour; no per-fish price labels.
  for(let f of s.fish){if(!f.caught)fish(f.x*W,fishY(f.depth),f.type,t+f.phase,H<700?.86:1,f.speed>0?1:-1,f.type>=3);}
  let hx=s.x*W,hy=fishY(s.depth);
  ctx.beginPath();ctx.moveTo(W*.5+42,surface()-40);ctx.quadraticCurveTo((W*.5+hx)/2,surface()+40,hx,hy);ctx.strokeStyle='#fff5c3cc';ctx.lineWidth=s.caught.some(i=>i>=3)?2.1:1.5;ctx.stroke();
  if(s.phase==='up'){ctx.setLineDash([3,6]);ellipse(hx,hy,21,21,'#f4dc8615');ctx.beginPath();ctx.arc(hx,hy,21,0,Math.PI*2);ctx.strokeStyle='#f3de8677';ctx.stroke();ctx.setLineDash([]);}
  ctx.beginPath();ctx.moveTo(hx,hy-7);ctx.lineTo(hx,hy+6);ctx.quadraticCurveTo(hx+12,hy+14,hx+12,hy+2);ctx.strokeStyle='#fff0a6';ctx.lineWidth=3;ctx.stroke();
  let catchOrder=s.caught.map((type,i)=>({type,i})).sort((a,b)=>a.type-b.type);
  for(let {type,i} of catchOrder){let big=type>=3;let scale=(big?1.04:.75)*(H<700?.86:1);let offset=(i%2?1:-1)*(big?22:17);let x=Math.max(species[type].size*1.1,Math.min(W-species[type].size*1.1,hx+offset));let y=hy+(big?-26:18+i*10);fish(x,y,type,t+i,scale,i%2?1:-1,big);}
 }else if(s.phase==='landing'){
  let best=[...s.caughtDetails].sort((a,b)=>b.weight-a.weight)[0];
  for(let i=0;i<s.caught.length;i++){let p=Math.max(0,Math.min(1,(s.landing-i*.1)/.65));if(p<1){let x=s.x*W+(W*.5-s.x*W)*p,y=surface()+38-100*Math.sin(p*Math.PI);fish(x,y,s.caught[i],t+i,s.caught[i]>=3?1.04:.75,1,true);}}
  if(best&&s.landing>.65&&s.landing<1.05){fish(W*.5,surface()-17,best.type,t,1.1,1,true);}
  if(best&&s.landing>=1.05)showCatch(best,t,Math.min(1,(s.landing-1.05)*3),'船上計測');
 }else if(s.phase==='result'&&s.caughtDetails.length){showCatch([...s.caughtDetails].sort((a,b)=>b.weight-a.weight)[0],t,1,resultSummary(s).isRecord?'重量記録を更新！':'今回の大物');}
 else{for(let i=0;i<5;i++){let x=((i*83+t*(i%2?8:-5))%(W+100)+W+100)%(W+100)-50;fish(x,surface()+65+i*35,i===4?Math.max(0,species.findLastIndex(sp=>sp.min<=game.maxDepth*.86)):i%2,t+i,i===4?1:.7,i%2?1:-1,i===4);}}
 for(let i=0;i<18;i++){let x=(i*79+Math.sin(t*.7+i)*6)%W,y=surface()+((i*47-t*12)%(H-surface())+(H-surface()))%(H-surface());ctx.strokeStyle='#a7e4de25';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,1.5+i%3,0,6.28);ctx.stroke();}
 for(let p of fx){let age=t-p.at;if(age>1)continue;ctx.globalAlpha=1-age;let x=p.x+Math.cos(p.a)*age*60,y=p.y+Math.sin(p.a)*age*50+age*age*25;ellipse(x,y,p.big?3:2,p.big?3:2,p.big?'#ffdd6a':'#e8ffff');}ctx.globalAlpha=1;fx=fx.filter(p=>t-p.at<1);
}
function showCatch(best,t,alpha,label){
 let top=surface()+28,limit=H-safeBottom-(game.s.phase==='result'?185:225),space=Math.max(80,limit-top);
 let cy=top+Math.max(48,space*.43),scale=H<700?1.65:2.2;
 ctx.save();ctx.globalAlpha=alpha;ellipse(W*.5,cy+15,Math.min(130,W*.35),Math.min(60,space*.36),'#0b3048b8');
 for(let i=0;i<8;i++){let a=i/8*Math.PI*2+t*.12;line([[W*.5+Math.cos(a)*75,cy+Math.sin(a)*35],[W*.5+Math.cos(a)*95,cy+Math.sin(a)*48]],'#f4d58844',2);}
 fish(W*.5,cy,best.type,t*.45,scale,1,true);ctx.textAlign='center';ctx.fillStyle='#a8d1d7';ctx.font='11px system-ui';ctx.fillText(label,W*.5,top+8);
 if(game.s.phase==='landing'){ctx.fillStyle='#fff0ba';ctx.font='bold 20px system-ui';ctx.fillText(species[best.type].name,W*.5,cy+55);ctx.font='bold 26px system-ui';ctx.fillText(best.weight.toFixed(1)+' kg',W*.5,cy+85);ctx.font='14px system-ui';ctx.fillStyle='#f4d589';ctx.fillText('この1尾 ¥'+best.value.toLocaleString(),W*.5,cy+111);}
 else{ctx.font='bold 16px system-ui';ctx.fillStyle='#ffe098';ctx.fillText(best.weight.toFixed(1)+' kg',W*.5,cy+49);}
 ctx.restore();
}

function events(){for(const e of game.drain()){
 if(e.type==='catch'){
  note(e.fish>=3?720:440+e.fish*60,.12);if(e.fish>=2)toast(species[e.fish].name+' HIT！');
  for(let i=0;i<(reduced?4:14);i++)fx.push({x:e.x*W,y:fishY(e.depth),a:i/14*6.28,at:game.s.elapsed,big:e.fish>=3});save();
 }
 if(e.type==='turn'&&game.s.casts===1)toast('海を左右にドラッグ');
 if(e.type==='cast')note(280,.15);
 if(e.type==='land'){note(570,.2);for(let i=0;i<(reduced?6:24);i++)fx.push({x:W*.5,y:surface()+6,a:Math.PI+i/24*Math.PI,at:game.s.elapsed,big:false});}
 if(e.type==='result'){note(780,.2);save();}
 if(e.type==='cast'&&e.power>.985)toast('絶好の投下！');
}}
function frame(now){const rawDt=last?(now-last)/1000:0,dt=Math.min(rawDt,.05);last=now;
 if(!paused&&!hidden&&!titleOpen&&!bookOpen){game.step(dt);events();if(game.s.elapsed>toastUntil)$('#toast').style.opacity=0;if(game.s.elapsed-lastSave>1&&['down','up','landing'].includes(game.s.phase)){save();lastSave=game.s.elapsed;}if(now-lastUI>90){sync();lastUI=now;}if(game.s.phase==='aim')$('#needle').style.left=`${50+Math.sin(game.s.spinner)*46}%`;draw(game.s.elapsed);if(rawDt>0){frameTimes.push(rawDt*1000);if(frameTimes.length>600)frameTimes.shift();}}
 
 requestAnimationFrame(frame);
}
// Diagnostics are read-only. Experience/balance tests must not use fish coordinates.
window.__diagnostics={snapshot:()=>JSON.parse(game.save()),metrics:()=>({canvas:[canvas.width,canvas.height],css:[W,H],dpr,safeTop,safeBottom,waterArea:waterBottom()-surface(),meanFrameMs:frameTimes.reduce((a,b)=>a+b,0)/(frameTimes.length||1),paused,titleOpen,bookOpen,audioState:audio?.state||'not-created',soundEnabled,saveOK}),monetization:()=>monetization.getEntitlement()};
resize();sync();requestAnimationFrame(frame);
