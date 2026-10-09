const {chromium}=require(process.env.NODE_REPL_NODE_MODULE_DIRS+'/playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../../evidence');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,recordVideo:{dir:out,size:{width:390,height:844}}});
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>window.__diagnostics.metrics().audioState),'not-created');
 await page.screenshot({path:path.join(out,'01-harbor-390x844.png')});
 let ledger=[];
 // Test-only automation reads fish coordinates. It is not a novice playtest.
 async function cast(n){await page.locator('#cast').click();await page.waitForFunction(()=>Math.abs(Math.sin(window.__diagnostics.snapshot().spinner))<.12);await page.locator('#drop').click();let started=Date.now(),fullAt=0,landingAt=0;await page.waitForFunction(()=>window.__diagnostics.snapshot().phase==='up');
  await page.mouse.move(195,700);await page.mouse.down();let shot=false,landingShot=false;
  for(let k=0;k<170;k++){
   let s=await page.evaluate(()=>window.__diagnostics.snapshot());if(s.phase==='result')break;
   if(!fullAt&&s.caught.length>=4+s.capLevel)fullAt=Date.now();
   if(s.phase==='landing'){if(!landingAt)landingAt=Date.now();if(!landingShot&&s.landing>1.35){await page.screenshot({path:path.join(out,`landing-${n}.png`)});landingShot=true;}}
   if(s.phase==='up'){
    let targets=s.fish.filter(f=>!f.caught&&f.depth<=s.depth+1.3).sort((a,b)=>b.depth-a.depth);
    if(targets.length){let target=targets.find(f=>f.type>=3)||targets[0];await page.mouse.move(target.x*390,700);}
    if(!shot&&s.caught.some(x=>x>=3)){await page.screenshot({path:path.join(out,`0${n+1}-tuna-catch.png`)});shot=true;}
   }
   await page.waitForTimeout(100);
  }
  await page.mouse.up();await page.waitForFunction(()=>window.__diagnostics.snapshot().phase==='result',{timeout:10000});
  let end=await page.evaluate(()=>window.__diagnostics.snapshot());ledger.push({cast:n,castDepth:end.castDepth,caught:end.caught,caughtDetails:end.caughtDetails,earnings:end.earnings,money:end.money,seconds:(Date.now()-started)/1000,fullReturnSeconds:fullAt&&landingAt?(landingAt-fullAt)/1000:null});await page.screenshot({path:path.join(out,`result-${n}.png`)});await page.waitForTimeout(1100);return end;
 }
 let a=await cast(1);assert.ok(a.earnings>=420,'first aimed cast funds depth');await page.locator('#upgradeDepth').click();assert.equal(await page.evaluate(()=>window.__diagnostics.snapshot().depthLevel),1);
 await page.waitForTimeout(600);let b=await cast(2);assert.ok(b.caught.includes(4),'black tuna reachable second cast');
 await page.locator('#cast').click();await page.locator('#drop').click();await page.waitForTimeout(4000);await page.locator('#pause').click();let saved=await page.evaluate(()=>window.__diagnostics.snapshot());await page.reload();await page.waitForTimeout(500);let restored=await page.evaluate(()=>window.__diagnostics.snapshot());assert.equal(saved.depth,restored.depth);assert.equal(saved.money,restored.money);assert.equal(await page.locator('#pauseOverlay').isVisible(),true);await page.screenshot({path:path.join(out,'pause-resume.png')});await page.locator('#resume').click();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__diagnostics.metrics().paused),false);
 assert.equal(await page.evaluate(()=>window.__diagnostics.metrics().soundEnabled),false,'mute remains off after reload');await page.locator('#sound').click();assert.equal(await page.evaluate(()=>window.__diagnostics.metrics().audioState),'running');await page.locator('#sound').click();
 let metrics=await page.evaluate(()=>window.__diagnostics.metrics());let video=page.video();await context.close();let videoPath=await video.path();fs.renameSync(videoPath,path.join(out,'gameplay-review.webm'));
 const small=await browser.newContext({viewport:{width:320,height:568},deviceScaleFactor:1,isMobile:true,hasTouch:true});let p=await small.newPage();await p.goto('http://127.0.0.1:4173');await p.screenshot({path:path.join(out,'small-320x568.png')});let controls=await p.locator('button:visible').evaluateAll(es=>es.map(e=>{let r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,w:r.width,h:r.height};}));assert.ok(controls.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=320.1&&r.y+r.h<=568.1&&r.h>=44));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),320);await small.close();await browser.close();assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith('http://127.0.0.1:4173')));
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({testedAt:new Date().toISOString(),engine:'Chrome headless on Windows; emulated touch viewport, not real iPhone',automation:'Reads fish coordinates for repeatable verification. Not evidence of novice earnings, success rate, or experience.',ledger,metrics,controls,errors,networkRequests:requests,checks:['automated pursuit can fund depth','automated pursuit can reach black tuna','mid-cast save reload exact depth and money','resume paused after reload','no auto-start audio','320px controls on-screen >=44px','no horizontal overflow','no external requests','no JavaScript errors']},null,2));console.log(JSON.stringify({ledger,metrics,controls,errors},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
