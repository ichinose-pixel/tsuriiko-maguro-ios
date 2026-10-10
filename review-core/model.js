import {rods,baits,hints} from './catalog.js?v=harbor-r2';
// Pure simulation and durable transactions. No browser, SDK, or wall clock dependency.
export const species = [
 {id:'sardine',name:'イワシ',value:20,color:'#b4e2dc',size:24,min:0.5,weight:[.2,.6],shape:'slender'},
 {id:'mackerel',name:'サバ',value:30,color:'#69c9b9',size:29,min:2,weight:[.8,1.7],shape:'striped'},
 {id:'bonito',name:'カツオ',value:50,color:'#4e99c1',size:34,min:4.8,weight:[3,8],shape:'bonito'},
 {id:'albacore',name:'ビンチョウ',value:100,color:'#a5c8ed',size:38,min:6.2,weight:[9,24],shape:'longfin'},
 {id:'bigeye',name:'メバチ',value:150,color:'#967cb9',size:42,min:10,weight:[20,60],shape:'bigeye'},
 {id:'yellowfin',name:'キハダ',value:200,color:'#83b4cd',size:45,min:14,weight:[28,75],shape:'sickle'},
 {id:'bluefin',name:'クロマグロ',value:300,color:'#617aab',size:49,min:18,weight:[65,145],shape:'barrel'}
];
export const LIMITS={depthLevel:24,capLevel:5,history:20,fish:100};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round5=n=>Math.round(n/5)*5;
const phases=['ready','aim','down','up','landing','result'];
export class Game {
 constructor(raw){
  this.s={version:4,legacyCapacityBonus:0,rodTier:0,returnElapsed:0,returnStartDepth:0,catchWait:0,upElapsed:0,phase:'ready',money:0,depthLevel:0,capLevel:0,casts:0,totalFish:0,best:0,bestWeight:0,tuna:0,
   muted:true,volume:.65,reducedMotion:false,seed:1927,elapsed:0,x:.5,targetX:.5,depth:0,castDepth:12,
   fish:[],caught:[],caughtDetails:[],events:[],earnings:0,landing:0,spinner:0,flash:0,
   lastClaimedId:0,pending:null,newRecords:[],newSpecies:[],history:[],book:species.map(()=>({count:0,best:0})),
   entitlements:{adRemoval:false,source:'none'},firstUpgradeCast:0};
  this.restored=raw?this.restore(raw):false;
 }
 get capacity(){return 3+this.s.capLevel+this.s.legacyCapacityBonus;}
 get maxDepth(){return rods[this.s.rodTier].depth;}
 get gearStage(){return Math.min(4,Math.floor(this.s.depthLevel/3));}
 cost(which){const list=which==='depth'?rods:baits,tier=which==='depth'?this.s.rodTier:this.s.capLevel;return list[tier+1]?.price??Infinity;}
 nextGoal(){const type=this.s.book.findIndex(b=>!b.count);return {type:type<0?6:type,text:type<0?'次は、自己記録を超える一尾へ':species[type].name+'を探そう'};}
 purchase(kind,tier){const list=kind==='rod'?rods:kind==='bait'?baits:null,key=kind==='rod'?'rodTier':'capLevel';if(!list||!['ready','aim'].includes(this.s.phase)||this.s.pending||tier!==this.s[key]+1||!list[tier]||this.s.money<list[tier].price)return false;this.s.money-=list[tier].price;this.s[key]=tier;this.s.events.push({type:'upgrade',kind,tier});return true;}
 rand(){this.s.seed=(Math.imul(this.s.seed,1664525)+1013904223)>>>0;return this.s.seed/4294967296;}
 start(){
  if(this.s.phase!=='ready'||this.s.pending)return false;
  Object.assign(this.s,{phase:'aim',returnElapsed:0,returnStartDepth:0,catchWait:0,upElapsed:0,spinner:0,earnings:0,caught:[],caughtDetails:[],events:[],depth:0,x:.5,targetX:.5,landing:0,newRecords:[],newSpecies:[]});return true;
 }
 cast(){
  if(this.s.phase!=='aim')return false;
  const s=this.s,power=1;
  s.castDepth=this.maxDepth*power;s.phase='down';s.casts++;s.fish=[];s.seed=1927+s.casts*943;
  const count=15+Math.floor(s.castDepth/4);
  for(let i=0;i<count;i++){
   const depth=1.2+(i+.3+this.rand()*.5)/count*(s.castDepth-1.4);
   const pool=depth<20?[0,0,1,1]:depth<60?[1,2,2,3]:depth<120?[2,3,3,4]:[3,4,4,4];
   let type=pool[Math.floor(this.rand()*pool.length)];if(type===3&&s.capLevel<2)type=2;if(type===4&&s.rodTier<2)type=2;
   if(depth>9&&(s.capLevel>=3||s.book[5].count||s.book[6].count)&&this.rand()<.24)type=this.rand()<.48?5:6;
   const sp=species[type],growth=1+Math.max(0,s.castDepth-60)*.002;
   const weight=Math.round((sp.weight[0]+this.rand()*(sp.weight[1]-sp.weight[0]))*growth*10)/10;
   const x=[.17,.83,.30,.70][i%4]+(this.rand()-.5)*.15,speed=(this.rand()>.5?1:-1)*[.026,.038,.075,.045,.025,.065,.052][type];
   s.fish.push({id:i,type,x,anchor:x,depth,weight,value:round5(sp.value*(.85+.3*weight/sp.weight[1])),speed,caught:false,phase:this.rand()*6.28});
  }
  s.events.push({type:'cast',power});return true;
 }
 move(x){if(Number.isFinite(x)){if(Math.abs(x-this.s.targetX)>.002)this.steerHeat=.8;this.s.targetX=clamp(x,.06,.94);}}
 upgrade(which){return this.purchase(which==='depth'?'rod':'bait',(which==='depth'?this.s.rodTier:this.s.capLevel)+1);}
 step(dt){
  dt=clamp(dt,0,.05);this.steerHeat=Math.max(0,(this.steerHeat||0)-dt);const s=this.s;s.elapsed+=dt;s.flash=Math.max(0,s.flash-dt);s.catchWait=Math.max(0,s.catchWait-dt);
  if(s.phase==='aim')s.spinner+=dt*2.8;
  if(['down','up'].includes(s.phase)){
   s.x+=(s.targetX-s.x)*Math.min(1,dt*18);
   for(const f of s.fish){if(!f.caught){if(f.anchor===undefined)f.anchor=f.x;const pull=this.steerHeat>0&&Math.abs(f.depth-s.depth)<s.castDepth*.15?baits[s.capLevel].attract:0;f.anchor+=Math.sign(s.x-f.anchor)*pull*dt;const wave=s.elapsed*(f.type===2?1.5:.65)+f.phase;f.x=clamp(f.anchor+Math.sin(wave)*(f.type>=5?.12:.055),f.type>=3?.2:.14,f.type>=3?.8:.86);f.speed=Math.cos(wave)*Math.abs(f.speed);}}
   if(s.phase==='down'){
    // Depth upgrade reveals more ocean while keeping the first interaction close.
    s.depth+=s.castDepth/(1.6+Math.sqrt(s.castDepth)*.2)*dt;
    if(s.depth>=s.castDepth){s.depth=s.castDepth;s.phase='up';s.events.push({type:'turn'});}
   }else{
    const full=s.caught.length>=this.capacity;s.upElapsed+=dt;
    if(full){
     if(!s.returnStartDepth){s.returnStartDepth=s.depth;s.returnElapsed=0;s.events.push({type:'full'});}
     s.returnElapsed=Math.min(2.4,s.returnElapsed+dt);const progress=s.returnElapsed/2.4;
     s.depth=s.returnStartDepth*(1-(.25*progress+.75*progress*progress));
    }else s.depth-=s.castDepth/(6+24*(s.castDepth/200)**.75)*dt;
    if(!full&&s.catchWait<=0)for(const f of s.fish){
     if(f.caught)continue;const sp=species[f.type];
     if(Math.abs(f.depth-s.depth)<.6+s.castDepth*.009&&Math.abs(f.x-s.x)<.07+sp.size/1100){
      s.catchWait=.42;f.caught=true;s.caught.push(f.type);s.caughtDetails.push({type:f.type,weight:f.weight,value:f.value});
      s.events.push({type:'catch',fish:f.type,x:f.x,depth:f.depth,value:f.value});s.flash=f.type>=3?.28:.065;
      break;
     }
    }
    if(s.depth<=0){s.depth=0;s.phase='landing';s.landing=0;s.events.push({type:'land'});}
   }
  }else if(s.phase==='landing'){s.landing+=dt;if(s.landing>=.94+s.caught.length*.28)this.finish();}
 }
 finish(){
  const s=this.s;if(s.phase!=='landing'||s.pending||s.casts<=s.lastClaimedId)return false;
  const fishValue=s.caughtDetails.reduce((n,f)=>n+f.value,0),support=fishValue===0?40:0;
  s.earnings=fishValue+support;
  const bests=s.book.map(x=>x.best);s.newRecords=[];s.newSpecies=[];
  for(const f of s.caughtDetails){if(!s.book[f.type].count&&!s.newSpecies.includes(f.type))s.newSpecies.push(f.type);if(f.weight>bests[f.type]){bests[f.type]=f.weight;if(!s.newRecords.includes(f.type))s.newRecords.push(f.type);}}
  s.pending={castId:s.casts,value:s.earnings,support,fish:s.caughtDetails.map(f=>({...f}))};
  s.phase='result';s.events.push({type:'result',value:s.earnings});return true;
 }
 claim(){
  const s=this.s,p=s.pending;
  if(s.phase!=='result'||!p||p.castId<=s.lastClaimedId)return false;
  s.money+=p.value;s.best=Math.max(s.best,p.value);s.totalFish+=p.fish.length;
  for(const f of p.fish){const b=s.book[f.type];b.count++;b.best=Math.max(b.best,f.weight);s.bestWeight=Math.max(s.bestWeight,f.weight);if(f.type>=3)s.tuna++;}
  s.history.unshift({castId:p.castId,value:p.value,fish:p.fish.map(f=>({...f})),depth:Math.round(s.castDepth),support:p.support});
  s.history=s.history.slice(0,LIMITS.history);s.lastClaimedId=p.castId;s.pending=null;s.phase='ready';
  s.events.push({type:'claimed',value:s.earnings});return true;
 }
 drain(){return this.s.events.splice(0);}
 save(){return JSON.stringify({...this.s,events:[]});}
 restore(raw){
  try{
   let d=typeof raw==='string'?JSON.parse(raw):raw;if(!d||typeof d!=='object')return false;
   d={returnElapsed:0,returnStartDepth:0,...d};if(!Number.isFinite(d.returnElapsed)||d.returnElapsed<0||d.returnElapsed>2.4||!Number.isFinite(d.returnStartDepth)||d.returnStartDepth<0||d.returnStartDepth>200)return false;
   if(d.rodTier===undefined)d={...d,rodTier:Math.min(5,Math.ceil(d.depthLevel/4)),catchWait:0,upElapsed:0};
   if(!Number.isInteger(d.rodTier)||d.rodTier<0||d.rodTier>5||!Number.isFinite(d.catchWait)||d.catchWait<0||!Number.isFinite(d.upElapsed)||d.upElapsed<0)return false;
   if(d.version!==4||![0,1].includes(d.legacyCapacityBonus)||!phases.includes(d.phase))return false;
   if(typeof d.muted!=='boolean'||typeof d.reducedMotion!=='boolean'||typeof d.volume!=='number'||!Number.isFinite(d.volume)||d.volume<0||d.volume>1)return false;
   for(const k of ['money','depthLevel','capLevel','casts','totalFish','best','bestWeight','tuna','seed','elapsed','x','targetX','depth','castDepth','landing','spinner','flash','earnings','lastClaimedId'])if(!Number.isFinite(d[k])||d[k]<0)return false;
   if(['money','depthLevel','capLevel','casts','lastClaimedId','totalFish','tuna','seed'].some(k=>!Number.isSafeInteger(d[k])))return false;
   if(!Array.isArray(d.newRecords)||!Array.isArray(d.newSpecies)||[...d.newRecords,...d.newSpecies].some(i=>!Number.isInteger(i)||!species[i]))return false;
   if(d.depthLevel>24||d.capLevel>5||d.money>1e12||d.x>1||d.targetX>1||d.castDepth<0||d.castDepth>200.001||d.depth>d.castDepth+.1||d.lastClaimedId>d.casts)return false;
   const validFish=f=>f&&Number.isInteger(f.type)&&species[f.type]&&Number.isFinite(f.weight)&&f.weight>0&&f.weight<1000&&Number.isFinite(f.value)&&f.value>=0&&f.value<1e6;
   if(!Array.isArray(d.fish)||d.fish.length>100||d.fish.some(f=>!validFish(f)||![f.x,f.depth,f.speed,f.phase].every(Number.isFinite)||f.x<0||f.x>1||f.depth<0||f.depth>d.castDepth+.1||typeof f.caught!=='boolean'||(f.anchor!==undefined&&(!Number.isFinite(f.anchor)||f.anchor<0||f.anchor>1))))return false;
   if(!Array.isArray(d.caught)||!Array.isArray(d.caughtDetails)||d.caught.length>3+d.capLevel+d.legacyCapacityBonus||d.caughtDetails.length!==d.caught.length||d.caughtDetails.some((f,i)=>!validFish(f)||f.type!==d.caught[i]))return false;
   if(!Array.isArray(d.book)||d.book.length!==species.length||d.book.some(b=>!Number.isSafeInteger(b.count)||b.count<0||!Number.isFinite(b.best)||b.best<0))return false;
   if(!Array.isArray(d.history)||d.history.length>20||d.history.some(h=>!Number.isFinite(h.value)||!Array.isArray(h.fish)||h.fish.some(f=>!validFish(f))))return false;
   if(d.phase==='result'){
    const p=d.pending;if(!p||p.castId!==d.casts||p.castId<=d.lastClaimedId||!Array.isArray(p.fish)||p.fish.length!==d.caughtDetails.length||p.fish.some((f,i)=>!validFish(f)||f.type!==d.caughtDetails[i].type||f.weight!==d.caughtDetails[i].weight||f.value!==d.caughtDetails[i].value)||p.value!==p.fish.reduce((n,f)=>n+f.value,0)+(p.fish.length?0:40))return false;
    if(d.earnings!==p.value||p.support!==(p.fish.length?0:40))return false;
   }else if(d.pending)return false;
   this.s={...this.s,...d,events:[],volume:clamp(Number(d.volume)||0,0,1),muted:d.muted!==false,reducedMotion:!!d.reducedMotion,entitlements:{adRemoval:false,source:'none'}};return true;
  }catch{return false;}
 }
}
