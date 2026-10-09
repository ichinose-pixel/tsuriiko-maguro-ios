// Pure simulation and durable transactions. No browser, SDK, or wall clock dependency.
export const species = [
 {id:'sardine',name:'イワシ',value:80,color:'#b4e2dc',size:16,min:2,weight:[.2,.6],shape:'slender'},
 {id:'mackerel',name:'サバ',value:130,color:'#69c9b9',size:21,min:7,weight:[.8,1.7],shape:'striped'},
 {id:'bonito',name:'カツオ',value:240,color:'#4e99c1',size:28,min:26,weight:[3,8],shape:'bonito'},
 {id:'albacore',name:'ビンチョウ',value:420,color:'#a5c8ed',size:32,min:50,weight:[9,24],shape:'longfin'},
 {id:'bigeye',name:'メバチ',value:720,color:'#967cb9',size:37,min:75,weight:[20,60],shape:'bigeye'},
 {id:'yellowfin',name:'キハダ',value:1100,color:'#e3c658',size:40,min:99,weight:[28,75],shape:'sickle'},
 {id:'bluefin',name:'クロマグロ',value:1800,color:'#617aab',size:48,min:136,weight:[65,145],shape:'barrel'}
];
export const LIMITS={depthLevel:24,capLevel:5,history:20,fish:18};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round5=n=>Math.round(n/5)*5;
const phases=['ready','aim','down','up','landing','result'];
export class Game {
 constructor(raw){
  this.s={version:3,phase:'ready',money:0,depthLevel:0,capLevel:0,casts:0,totalFish:0,best:0,bestWeight:0,tuna:0,
   muted:true,volume:.65,reducedMotion:false,seed:1927,elapsed:0,x:.5,targetX:.5,depth:0,castDepth:18,
   fish:[],caught:[],caughtDetails:[],events:[],earnings:0,landing:0,spinner:0,flash:0,
   lastClaimedId:0,pending:null,newRecords:[],newSpecies:[],history:[],book:species.map(()=>({count:0,best:0})),
   entitlements:{adRemoval:false,source:'none'},firstUpgradeCast:0};
  this.restored=raw?this.restore(raw):false;
 }
 get capacity(){return 4+this.s.capLevel;}
 get maxDepth(){return 18+14*this.s.depthLevel;}
 get gearStage(){return Math.min(4,Math.floor(this.s.depthLevel/3));}
 cost(which){return which==='depth'?round5(300*1.47**this.s.depthLevel):round5(260*1.9**this.s.capLevel);}
 nextGoal(){
  const locked=species.find(sp=>sp.min>this.maxDepth*.96);
  if(locked)return {name:locked.name,depth:locked.min,type:species.indexOf(locked),text:`次は ${locked.name} · ${locked.min}m`};
  const target=[100,125,150,175,200,225].find(w=>w>this.s.bestWeight);
  return {name:'クロマグロ',depth:this.maxDepth,type:6,text:target?`大物記録 ${target}kgを目指す`:'クロマグロの自己ベストを更新'};
 }
 rand(){this.s.seed=(Math.imul(this.s.seed,1664525)+1013904223)>>>0;return this.s.seed/4294967296;}
 start(){
  if(this.s.phase!=='ready'||this.s.pending)return false;
  Object.assign(this.s,{phase:'aim',spinner:0,earnings:0,caught:[],caughtDetails:[],events:[],depth:0,x:.5,targetX:.5,landing:0,newRecords:[],newSpecies:[]});return true;
 }
 cast(){
  if(this.s.phase!=='aim')return false;
  const s=this.s,power=.9+.1*(1-Math.abs(Math.sin(s.spinner)));
  s.castDepth=this.maxDepth*power;s.phase='down';s.casts++;s.fish=[];s.seed=1927+s.casts*943;
  for(let i=0;i<LIMITS.fish;i++){
   const depth=2+i*(s.castDepth*.96-2)/(LIMITS.fish-1);
   let type=0;species.forEach((sp,n)=>{if(sp.min<=depth)type=n;});
   if(type>=2&&i%3===0)type--;
   let x=[.23,.5,.77][i%3]+(this.rand()-.5)*.12;if(type>=3)x=(i%2?.24:.76)+(this.rand()-.5)*.09;
   const sp=species[type],growth=1+Math.max(0,s.castDepth-sp.min-12)*.003;
   const weight=Math.round((sp.weight[0]+this.rand()*(sp.weight[1]-sp.weight[0]))*growth*10)/10;
   const value=round5(sp.value*(.85+.3*(weight/sp.weight[1])));
   const speed=(this.rand()>.5?1:-1)*(i%3===1?.006:.012+this.rand()*.009);
   s.fish.push({id:i,type,x,depth,weight,value,speed,caught:false,phase:this.rand()*6.28});
  }
  s.events.push({type:'cast',power});return true;
 }
 move(x){if(Number.isFinite(x))this.s.targetX=clamp(x,.06,.94);}
 upgrade(which){
  if(!['ready','aim'].includes(this.s.phase)||this.s.pending||!['depth','capacity'].includes(which))return false;
  const key=which==='depth'?'depthLevel':'capLevel';
  if(this.s[key]>=LIMITS[key]||this.s.money<this.cost(which))return false;
  this.s.money-=this.cost(which);this.s[key]++;
  if(!this.s.firstUpgradeCast)this.s.firstUpgradeCast=this.s.casts;
  this.s.events.push({type:'upgrade',which,stage:this.gearStage});return true;
 }
 step(dt){
  dt=clamp(dt,0,.05);const s=this.s;s.elapsed+=dt;s.flash=Math.max(0,s.flash-dt);
  if(s.phase==='aim')s.spinner+=dt*2.8;
  if(['down','up'].includes(s.phase)){
   s.x+=(s.targetX-s.x)*Math.min(1,dt*18);
   for(const f of s.fish){if(!f.caught){f.x+=f.speed*dt;if(f.x<.08||f.x>.92)f.speed*=-1;}}
   if(s.phase==='down'){
    s.depth+=s.castDepth/1.15*dt;
    if(s.depth>=s.castDepth){s.depth=s.castDepth;s.phase='up';s.events.push({type:'turn'});}
   }else{
    const full=s.caught.length>=this.capacity;
    s.depth-=(full?s.castDepth:s.castDepth/6.5)*dt*(s.flash>0&&!full?.25:1);
    if(!full)for(const f of s.fish){
     if(f.caught)continue;const sp=species[f.type];
     if(Math.abs(f.depth-s.depth)<s.castDepth*.032&&Math.abs(f.x-s.x)<.055+sp.size/1800){
      f.caught=true;s.caught.push(f.type);s.caughtDetails.push({type:f.type,weight:f.weight,value:f.value});
      s.events.push({type:'catch',fish:f.type,x:f.x,depth:f.depth});s.flash=f.type>=3?.28:.065;
      if(s.caught.length>=this.capacity)break;
     }
    }
    if(s.depth<=0){s.depth=0;s.phase='landing';s.landing=0;s.events.push({type:'land'});}
   }
  }else if(s.phase==='landing'){s.landing+=dt;if(s.landing>=2.4)this.finish();}
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
   if(d.version===1){
    const legacy=new Game();legacy.s.money=Number.isFinite(d.money)?Math.max(0,Math.min(d.money,1e9)):0;
    legacy.s.depthLevel=Math.min(24,Math.max(0,Math.floor(d.depthLevel||0)));legacy.s.capLevel=Math.min(5,Math.max(0,Math.floor(d.capLevel||0)));
    legacy.s.casts=Math.max(0,Math.floor(d.casts||0));legacy.s.lastClaimedId=legacy.s.casts;
    legacy.s.muted=d.muted!==false;legacy.s.best=Math.max(0,Number(d.best)||0);this.s=legacy.s;return true;
   }
   if(d.version!==3||!phases.includes(d.phase))return false;
   for(const k of ['money','depthLevel','capLevel','casts','totalFish','best','bestWeight','tuna','seed','elapsed','x','targetX','depth','castDepth','landing','spinner','flash','earnings','lastClaimedId'])if(!Number.isFinite(d[k])||d[k]<0)return false;
   if(['depthLevel','capLevel','casts','lastClaimedId'].some(k=>!Number.isInteger(d[k])))return false;
   if(!Array.isArray(d.newRecords)||!Array.isArray(d.newSpecies)||[...d.newRecords,...d.newSpecies].some(i=>!Number.isInteger(i)||!species[i]))return false;
   if(d.depthLevel>24||d.capLevel>5||d.money>1e12||d.x>1||d.targetX>1||d.castDepth<1||d.castDepth>354||d.depth>d.castDepth+.1||d.lastClaimedId>d.casts)return false;
   const validFish=f=>f&&Number.isInteger(f.type)&&species[f.type]&&Number.isFinite(f.weight)&&f.weight>0&&f.weight<1000&&Number.isFinite(f.value)&&f.value>=0&&f.value<1e6;
   if(!Array.isArray(d.fish)||d.fish.length>18||d.fish.some(f=>!validFish(f)||![f.x,f.depth,f.speed,f.phase].every(Number.isFinite)))return false;
   if(!Array.isArray(d.caught)||!Array.isArray(d.caughtDetails)||d.caught.length>4+d.capLevel||d.caughtDetails.length!==d.caught.length||d.caughtDetails.some((f,i)=>!validFish(f)||f.type!==d.caught[i]))return false;
   if(!Array.isArray(d.book)||d.book.length!==species.length||d.book.some(b=>!Number.isFinite(b.count)||b.count<0||!Number.isFinite(b.best)||b.best<0))return false;
   if(!Array.isArray(d.history)||d.history.length>20||d.history.some(h=>!Number.isFinite(h.value)||!Array.isArray(h.fish)||h.fish.some(f=>!validFish(f))))return false;
   if(d.phase==='result'){
    const p=d.pending;if(!p||p.castId!==d.casts||p.castId<=d.lastClaimedId||!Array.isArray(p.fish)||p.fish.length!==d.caughtDetails.length||p.fish.some((f,i)=>!validFish(f)||f.type!==d.caughtDetails[i].type||f.weight!==d.caughtDetails[i].weight||f.value!==d.caughtDetails[i].value)||p.value!==p.fish.reduce((n,f)=>n+f.value,0)+(p.fish.length?0:40))return false;
   }else if(d.pending)return false;
   this.s={...this.s,...d,events:[],volume:clamp(Number(d.volume)||0,0,1),muted:d.muted!==false,reducedMotion:!!d.reducedMotion,entitlements:{adRemoval:false,source:'none'}};return true;
  }catch{return false;}
 }
}
