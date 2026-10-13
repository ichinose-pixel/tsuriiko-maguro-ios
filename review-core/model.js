import {rods,baits,hints,habitats,bands,locations} from './catalog.js?v=harbor-r8-e02a2ed';
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
  this.s={version:6,location:0,tripLocation:0,inputPower:1,journeyEligible:false,journey:{offshoreCasts:0,completed:null,seenEnding:false},legacyPendingSupport:false,legacyCapacityBonus:0,rodTier:0,returnElapsed:0,returnStartDepth:0,catchWait:0,upElapsed:0,phase:'ready',money:0,depthLevel:0,capLevel:0,casts:0,totalFish:0,best:0,bestWeight:0,tuna:0,
   muted:true,volume:.65,reducedMotion:false,seed:1927,elapsed:0,x:.5,targetX:.5,depth:0,castDepth:12,
   fish:[],caught:[],caughtDetails:[],events:[],earnings:0,landing:0,spinner:0,flash:0,
   lastClaimedId:0,pending:null,newRecords:[],newSpecies:[],history:[],book:species.map(()=>({count:0,best:0})),
   entitlements:{adRemoval:false,source:'none'},firstUpgradeCast:0,lastPurchase:null};
  this.restored=raw?this.restore(raw):false;
 }
 get castPower(){return .8+.2*(1-Math.abs(Math.sin(this.s.spinner)));}
 get capacity(){return 3+this.s.capLevel+this.s.legacyCapacityBonus;}
 get maxDepth(){return rods[this.s.rodTier].depth;}
 get gearStage(){return Math.min(4,Math.floor(this.s.depthLevel/3));}
 cost(which){const list=which==='depth'?rods:baits,tier=which==='depth'?this.s.rodTier:this.s.capLevel;return list[tier+1]?.price??Infinity;}
 nextGoal(){
  const s=this.s;if(s.journey.completed)return {type:6,text:'沖の150kg達成！ 次は自己記録 '+s.book[6].best.toFixed(1)+'kg',short:'釣行記録と手帳は続けられる',available:true};
  if(!this.offshoreUnlocked)return {type:2,text:s.rodTier<1?'沖へ向かうライトセットを買おう':'港近くであと'+Math.max(0,6-s.totalFish)+'尾 · 沖が開く',short:s.rodTier<1?'あと '+Math.max(0,rods[1].price-s.money)+'円':'釣果を受け取って出船先を増やそう'};
  if(s.location===0)return {type:2,text:'沖の回遊ポイントへ · 150kgのマグロを目指す',short:'近場は群れで資金を集める場所',available:true};
  const targets=[[3,2,2],[5,3,3],[6,4,4]];for(const [type,rod,bait]of targets){const kind=s.rodTier<rod?'rod':s.capLevel<bait?'bait':null;if(kind){const list=kind==='rod'?rods:baits,tier=(kind==='rod'?s.rodTier:s.capLevel)+1;return {type,kind,tier,text:species[type].name+'へ · '+list[tier].name,short:'あと '+Math.max(0,list[tier].price-s.money)+'円 · 竿と仕掛けを揃える'};}if(type!==6&&!s.book[type].count)return {type,text:species[type].name+'を選んで釣ろう',short:'小魚を見送って枠を残す',available:true};}
  return {type:6,text:'今回の沖でクロマグロ150kgを船に揚げる',short:'大きな影を選ぶ · 出会いは毎投',available:true};
 }
 get offshoreUnlocked(){return this.s.rodTier>=1&&this.s.totalFish>=6;}
 get locationInfo(){return locations[this.s.location];}
 selectLocation(id){if(![0,1].includes(id)||id===1&&!this.offshoreUnlocked||!['ready','aim'].includes(this.s.phase)||this.s.pending)return false;this.s.location=id;return true;}
 availableTypes(power=1,location=this.s.location){return locations[location].types.filter(type=>{const h=habitats[type];return this.s.rodTier>=h.rod&&this.s.capLevel>=h.bait&&this.maxDepth*power>h.from+1;});}
 shelfDepth(power=1){const types=this.availableTypes(power);return Math.min(this.maxDepth*power,Math.max(...types.map(type=>this.habitatTop(type,power))));}
 habitatTop(type,power){return type===6&&this.s.rodTier===5&&this.s.capLevel===5&&power>=.96?170:habitats[type].to;}
 gearEffect(kind,tier){const old=this.s[kind==='rod'?'rodTier':'capLevel'];this.s[kind==='rod'?'rodTier':'capLevel']=tier;const types=this.availableTypes(1),depth=this.shelfDepth(1);this.s[kind==='rod'?'rodTier':'capLevel']=old;return 'この場所の有効棚 '+Math.round(depth)+'m · '+types.map(i=>species[i].name).join('・')+(kind==='rod'?' / 大きめの個体・巻き上げの手数が増える':' / 保持枠と誘いが増える');}
 collectionGoal(){const missing=this.s.book.map((b,i)=>!b.count&&!this.s.pending?.fish.some(f=>f.type===i)?i:null).filter(i=>i!==null);return missing.length?'手帳の空欄 '+missing.length+'種 · '+species[missing[0]].name+'など':'手帳7種 · 釣り旅を重ねよう';}
 eligible(type,depth,power=1){const h=habitats[type];const trophy=type===6&&this.s.rodTier===5&&this.s.capLevel===5&&power>=.96;return this.s.rodTier>=h.rod&&this.s.capLevel>=h.bait&&depth>=h.from&&depth<=(trophy?170:h.to)&&depth<=this.maxDepth*power;}
 weightFor(type,power){const sp=species[type],r=Math.min(1,this.rand()+this.s.rodTier*.045);if(type===6){const max=this.s.rodTier>=5&&this.s.capLevel>=5&&power>=.96?280:this.s.rodTier>=4&&this.s.capLevel>=4?200:145;return Math.round((65+(max-65)*Math.pow(r,1.5))*10)/10;}return Math.round((sp.weight[0]+r*(sp.weight[1]-sp.weight[0]))*10)/10;}

 purchase(kind,tier){const list=kind==='rod'?rods:kind==='bait'?baits:null,key=kind==='rod'?'rodTier':'capLevel';if(!list||!['ready','aim'].includes(this.s.phase)||this.s.pending||tier!==this.s[key]+1||!list[tier]||this.s.money<list[tier].price)return false;this.s.money-=list[tier].price;this.s[key]=tier;this.s.lastPurchase={kind,tier,cast:this.s.casts};this.s.events.push({type:'upgrade',kind,tier});return true;}
 rand(){this.s.seed=(Math.imul(this.s.seed,1664525)+1013904223)>>>0;return this.s.seed/4294967296;}
 start(){
  if(this.s.phase!=='ready'||this.s.pending)return false;
  Object.assign(this.s,{phase:'aim',returnElapsed:0,returnStartDepth:0,catchWait:0,upElapsed:0,spinner:Math.PI/2,earnings:0,caught:[],caughtDetails:[],events:[],depth:0,x:.5,targetX:.5,landing:0,newRecords:[],newSpecies:[]});return true;
 }
 cast(){
  if(this.s.phase!=='aim')return false;
  const s=this.s,power=this.castPower;
  s.inputPower=power;s.tripLocation=s.location;s.journeyEligible=true;s.castDepth=this.shelfDepth(power);s.phase='down';s.casts++;s.fish=[];s.seed=1927+s.casts*943;
  if(s.location===1&&s.rodTier>=4&&s.capLevel>=4)s.journey.offshoreCasts++;
  const types=this.availableTypes(power),count=s.location===0?24:20;let i=0;
  const add=(type,depth,x,group,weightOverride)=>{if(s.location===1&&type>=3&&group!==0&&weightOverride===undefined){const wy=d=>16*d+1056*(1-Math.exp(-d/22)),h=habitats[type],top=Math.min(this.habitatTop(type,power),s.castDepth-.25);for(let attempt=0;attempt<24&&s.fish.some(f=>Math.abs(f.x-x)<.28&&Math.abs(wy(f.depth)-wy(depth))<42);attempt++){depth=h.from+this.rand()*(top-h.from);x=[.20,.5,.80][attempt%3];}}const sp=species[type],weight=weightOverride??this.weightFor(type,power),motion=habitats[type].motion,speed=[.026,.035,.083,.044,.023,.073,.055][type];s.fish.push({id:i++,type,x,anchor:x,depth,weight,value:round5(sp.value*(.85+.3*weight/sp.weight[1])*(1+s.rodTier*.06)),speed,caught:false,phase:group+this.rand()*.25,group,motion,catchAt:0});};
  const weighted=types.flatMap(type=>Array(s.location===0?type<2?5:2:type>=3?7:1).fill(type));
  for(let group=0;i<count;group++){
   const type=weighted[Math.floor(this.rand()*weighted.length)],h=habitats[type],top=Math.min(this.habitatTop(type,power),s.castDepth-.25),depth=h.from+this.rand()*(top-h.from),n=Math.min(s.location===0?h.school:type<3?2:h.school,count-i),lane=[.22,.78,.40,.63][group%4],phase=this.rand()*6.28;
   for(let k=0;k<n;k++)add(type,clamp(depth+k*.58,h.from,top),clamp(lane+(k-(n-1)/2)*.064,.13,.87),phase);
  }
  // A valid fish just before the turn: no long empty ascent even with rod-first purchases.
  const deepest=types.reduce((a,b)=>this.habitatTop(a,power)>this.habitatTop(b,power)?a:b);add(deepest,s.castDepth-.6,.5,0);
  const target=[6,5,4,3,2].find(type=>types.includes(type));
  if(target!==undefined){const depth=Math.min(this.habitatTop(target,power)-.5,s.castDepth-1.8);const guaranteed=target===6&&s.location===1&&s.rodTier>=4&&s.capLevel>=4&&!s.journey.completed&&s.journey.offshoreCasts>=2;add(target,depth,.70,2,guaranteed?155+Math.floor(this.rand()*21):undefined);}
  s.events.push({type:'cast',power});return true;
 }
 move(x){if(Number.isFinite(x)){if(Math.abs(x-this.s.targetX)>.002)this.steerHeat=.8;this.s.targetX=clamp(x,.06,.94);}}
 upgrade(which){return this.purchase(which==='depth'?'rod':'bait',(which==='depth'?this.s.rodTier:this.s.capLevel)+1);}
 step(dt){
  dt=clamp(dt,0,.05);this.steerHeat=Math.max(0,(this.steerHeat||0)-dt);const s=this.s;s.elapsed+=dt;s.flash=Math.max(0,s.flash-dt);s.catchWait=Math.max(0,s.catchWait-dt);
  if(s.phase==='aim')s.spinner+=dt*2.8;
  if(['down','up'].includes(s.phase)){
   s.x+=(s.targetX-s.x)*Math.min(1,dt*18);
   for(const f of s.fish){if(!f.caught){if(f.anchor===undefined)f.anchor=f.x;const pull=this.steerHeat>0&&Math.abs(f.depth-s.depth)<s.castDepth*.15?baits[s.capLevel].attract:0;f.anchor+=Math.sign(s.x-f.anchor)*pull*dt;const wave=s.elapsed*(f.type===2?1.5:.65)+f.phase;f.x=clamp(f.anchor+Math.sin(wave)*(f.type>=5?.12:f.type===2?.11:.042),f.type>=3?.2:.14,f.type>=3?.8:.86);f.speed=Math.cos(wave)*Math.abs(f.speed);}}
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
    }else s.depth-=s.castDepth/(6+10*(s.castDepth/200)**.75)*dt;
    if(!full&&s.catchWait<=0)for(const f of s.fish){
     if(f.caught)continue;const sp=species[f.type];
     if(Math.abs(f.depth-s.depth)<.6+s.castDepth*.009&&Math.abs(f.x-s.x)<.044+sp.size/1650){
      s.catchWait=Math.max(.25,.42-s.rodTier*.025);f.caught=true;s.caught.push(f.type);s.caughtDetails.push({type:f.type,weight:f.weight,value:f.value,depth:Math.round(f.depth*10)/10,power:Math.round(s.inputPower*100),place:locations[s.tripLocation].name+' · '+(bands.find(b=>f.depth<b.to)?.name||bands[3].name)});f.catchAt=s.elapsed;
      s.events.push({type:'catch',fish:f.type,x:f.x,depth:f.depth,value:f.value,index:s.caught.length-1});s.flash=f.type>=3?.28:.065;
      break;
     }
    }
    if(s.depth<=0){s.depth=0;s.phase='landing';s.landing=0;s.events.push({type:'land'});}
   }
  }else if(s.phase==='landing'){s.landing+=dt;if(s.landing>=.55+s.caught.length*.20)this.finish();}
 }
 finish(){
  const s=this.s;if(s.phase!=='landing'||s.pending||s.casts<=s.lastClaimedId)return false;
  const fishValue=s.caughtDetails.reduce((n,f)=>n+f.value,0),support=fishValue===0?10:0;
  s.earnings=fishValue+support;
  const bests=s.book.map(x=>x.best);s.newRecords=[];s.newSpecies=[];
  for(const f of s.caughtDetails){if(!s.book[f.type].count&&!s.newSpecies.includes(f.type))s.newSpecies.push(f.type);if(f.weight>bests[f.type]){bests[f.type]=f.weight;if(!s.newRecords.includes(f.type))s.newRecords.push(f.type);}}
  s.pending={location:s.tripLocation,journeyEligible:s.journeyEligible,castId:s.casts,value:s.earnings,support,fish:s.caughtDetails.map(f=>({...f}))};
  s.phase='result';s.events.push({type:'result',value:s.earnings});return true;
 }
 claim(){
  const s=this.s,p=s.pending;
  if(s.phase!=='result'||!p||p.castId<=s.lastClaimedId)return false;
  if(p.journeyEligible&&p.location===1&&!s.journey.completed){const trophy=p.fish.filter(f=>f.type===6&&f.weight>=150).sort((a,b)=>b.weight-a.weight)[0];if(trophy)s.journey.completed={castId:p.castId,weight:trophy.weight,value:p.value,fishCount:p.fish.length,location:locations[1].name};}
  s.money+=p.value;s.best=Math.max(s.best,p.value);s.totalFish+=p.fish.length;
  for(const f of p.fish){const b=s.book[f.type];b.count++;if(b.count===1){b.firstCast=p.castId;b.firstDate=new Date().toISOString().slice(0,10);b.firstPlace=f.place||null;b.firstDepth=f.depth??null;}if(f.weight>b.best){b.bestPlace=f.place||null;b.bestDepth=f.depth??null;b.bestCast=p.castId;}b.best=Math.max(b.best,f.weight);s.bestWeight=Math.max(s.bestWeight,f.weight);if(f.type>=3)s.tuna++;}
  s.history.unshift({location:p.location??null,castId:p.castId,value:p.value,fish:p.fish.map(f=>({...f})),depth:Math.round(s.castDepth),support:p.support});
  s.history=s.history.slice(0,LIMITS.history);s.lastClaimedId=p.castId;s.pending=null;s.legacyPendingSupport=false;s.phase='ready';
  s.events.push({type:'claimed',value:s.earnings});return true;
 }
 drain(){return this.s.events.splice(0);}
 save(){return JSON.stringify({...this.s,events:[]});}
 restore(raw){
  try{
   let d=typeof raw==='string'?JSON.parse(raw):raw;if(!d||typeof d!=='object')return false;
   if(d.version===4)d={...d,version:5,legacyPendingSupport:d.phase==='result'&&d.pending?.support===40};d={returnElapsed:0,returnStartDepth:0,legacyPendingSupport:false,...d};if(!Number.isFinite(d.returnElapsed)||d.returnElapsed<0||d.returnElapsed>2.4||!Number.isFinite(d.returnStartDepth)||d.returnStartDepth<0||d.returnStartDepth>200)return false;
   if(d.rodTier===undefined)d={...d,rodTier:Math.min(5,Math.ceil(d.depthLevel/4)),catchWait:0,upElapsed:0};
   if(!Number.isInteger(d.rodTier)||d.rodTier<0||d.rodTier>5||!Number.isFinite(d.catchWait)||d.catchWait<0||!Number.isFinite(d.upElapsed)||d.upElapsed<0)return false;
   if(d.version===5)d={...d,version:6,location:d.rodTier>=1&&d.totalFish>=6?1:0,tripLocation:0,inputPower:d.castDepth/rods[d.rodTier].depth,journeyEligible:false,journey:{offshoreCasts:0,completed:null,seenEnding:false}};
   if(![0,1].includes(d.location)||![0,1].includes(d.tripLocation)||typeof d.journeyEligible!=='boolean'||!Number.isFinite(d.inputPower)||d.inputPower<0||d.inputPower>1.001||!d.journey||!Number.isSafeInteger(d.journey.offshoreCasts)||d.journey.offshoreCasts<0||typeof d.journey.seenEnding!=='boolean')return false;
   const done=d.journey.completed;if(done&&(!Number.isSafeInteger(done.castId)||done.castId<1||done.castId>d.lastClaimedId||!Number.isFinite(done.weight)||done.weight<150||done.weight>280||!Number.isFinite(done.value)||done.value<0||!Number.isSafeInteger(done.fishCount)||done.fishCount<1||done.fishCount>8))return false;
   if(d.version!==6||![0,1].includes(d.legacyCapacityBonus)||!phases.includes(d.phase))return false;
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
    const p=d.pending;if(!p||p.castId!==d.casts||p.castId<=d.lastClaimedId||!Array.isArray(p.fish)||p.fish.length!==d.caughtDetails.length||p.fish.some((f,i)=>!validFish(f)||f.type!==d.caughtDetails[i].type||f.weight!==d.caughtDetails[i].weight||f.value!==d.caughtDetails[i].value)||p.value!==p.fish.reduce((n,f)=>n+f.value,0)+(p.fish.length?0:d.legacyPendingSupport?40:10))return false;
    if(d.earnings!==p.value||p.support!==(p.fish.length?0:d.legacyPendingSupport?40:10))return false;
   }else if(d.pending)return false;
   this.s={...this.s,...d,events:[],volume:clamp(Number(d.volume)||0,0,1),muted:d.muted!==false,reducedMotion:!!d.reducedMotion,entitlements:{adRemoval:false,source:'none'}};return true;
  }catch{return false;}
 }
}
