import test from 'node:test';import assert from 'node:assert/strict';
import {createPreferencesStorage} from '../native-storage.js';import {resultSummary} from '../result-summary.js';
const fallback={load:()=>null,backup:()=>null};
test('corrupt primary never replaces the valid recovery snapshot',async()=>{
 const data=new Map([['tsuriiko.game.v3','bad'],['tsuriiko.game.v3.backup','good']]);const p={get:async({key})=>({value:data.get(key)||null}),set:async({key,value})=>data.set(key,value)};
 const s=await createPreferencesStorage(p,fallback,'tsuriiko.game.v3',v=>v!=='bad');assert.equal(s.load(),'good');await s.write('new');assert.equal(data.get('tsuriiko.game.v3.backup'),'good');
});
test('record badge belongs to displayed fish, not another species',()=>{
 const s={caughtDetails:[{type:6,weight:115.6},{type:4,weight:78}],newRecords:[4],newSpecies:[]};
 assert.equal(resultSummary(s).best.weight,115.6);assert.equal(resultSummary(s).isRecord,false);
 s.newRecords.push(6);assert.equal(resultSummary(s).isRecord,true);
});
test('native writes stay ordered and retain a separately recoverable backup',async()=>{
 const data=new Map(),calls=[];const preferences={async get({key}){return {value:data.get(key)||null}},async set({key,value}){await new Promise(r=>setTimeout(r,value==='first'?8:1));data.set(key,value);calls.push([key,value]);}};
 const store=await createPreferencesStorage(preferences,fallback);await Promise.all([store.write('first'),store.write('claimed'),store.write('next-cast')]);
 assert.equal(store.load(),'next-cast');assert.equal(store.backup(),'claimed');assert.equal(data.get(store.key),'next-cast');assert.equal(data.get(store.key+'.backup'),'claimed');assert.equal(await store.flush(),true);
});
test('native failure is reported and does not advance memory; next write retries',async()=>{
 let fail=true;const data=new Map([['tsuriiko.game.v3','old']]);const p={get:async({key})=>({value:data.get(key)||null}),set:async({key,value})=>{if(fail&&key==='tsuriiko.game.v3')throw Error('disk');data.set(key,value)}};const s=await createPreferencesStorage(p,fallback);assert.equal(await s.write('new'),false);assert.equal(s.load(),'old');fail=false;assert.equal(await s.write('new'),true);assert.equal(s.load(),'new');
});
test('native initialization failure must not silently reset progression',async()=>{
 await assert.rejects(createPreferencesStorage({get:async()=>{throw Error('unavailable')}},fallback));
});
test('imports only own web save once; native takes precedence afterward',async()=>{
 const data=new Map();const p={get:async({key})=>({value:data.get(key)||null}),set:async({key,value})=>data.set(key,value)};
 const s=await createPreferencesStorage(p,{load:()=> 'own-save',backup:()=>null});assert.equal(s.load(),'own-save');await s.write('native-new');const r=await createPreferencesStorage(p,{load:()=> 'stale-web',backup:()=>null});assert.equal(r.load(),'native-new');
});
