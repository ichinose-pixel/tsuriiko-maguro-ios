import assert from 'node:assert/strict';
import {Game} from './model.js';
const timings=[];
for(const level of [0,1,2]){
 const g=new Game();g.s.depthLevel=level;g.start();g.cast();let elapsed=0;
 while(g.s.phase==='down'&&elapsed<4){g.step(1/60);elapsed+=1/60;}
 assert.equal(g.s.phase,'up');assert.equal(g.s.caught.length,0,'No catches during descent');
 assert.ok(elapsed<=2.1,'Initial upgrades must keep descent below 2.1 seconds');
 const restored=new Game(g.save());assert.ok(restored.restored);assert.equal(restored.s.depth,g.s.depth);
 timings.push({depth:g.maxDepth,seconds:elapsed});
}
console.log(JSON.stringify({fullDepthDescent:timings}));
