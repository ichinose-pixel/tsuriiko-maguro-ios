import assert from 'node:assert/strict';
import {Game} from './model.js';
const g=new Game();g.start();g.cast();
let elapsed=0;while(g.s.phase!=='result'&&elapsed<30){g.move(.5+.35*Math.sin(elapsed*2));g.step(1/60);g.drain();elapsed+=1/60;}
assert.equal(g.s.phase,'result');const value=g.s.earnings;assert.ok(value>0);
const pending=new Game(g.save());assert.ok(pending.restored);assert.equal(pending.s.earnings,value);
assert.equal(pending.claim(),true);assert.equal(pending.s.money,value);assert.equal(pending.claim(),false);assert.equal(pending.s.money,value);
const claimed=new Game(pending.save());assert.ok(claimed.restored);assert.equal(claimed.claim(),false);assert.equal(claimed.s.money,value);
claimed.start();claimed.cast();for(let i=0;i<50;i++)claimed.step(1/60);const resumed=new Game(claimed.save());assert.equal(resumed.s.depth,claimed.s.depth);assert.equal(resumed.s.phase,claimed.s.phase);assert.deepEqual(resumed.s.caughtDetails,claimed.s.caughtDetails);
console.log(JSON.stringify({pendingRestore:true,claimExactlyOnce:true,claimedReload:true,midCastRestore:true,initialCastSeconds:elapsed,income:value}));
