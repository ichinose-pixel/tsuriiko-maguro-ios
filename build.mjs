import fs from 'node:fs';
let summary=fs.readFileSync('result-summary.js','utf8').replace(/export /g,'');
let platform=fs.readFileSync('platform.js','utf8').replace(/export /g,'');
let brand=fs.readFileSync('brand.js','utf8').replace(/export /g,'');
let h=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8'),model=fs.readFileSync('model.js','utf8').replace(/export /g,''),js=fs.readFileSync('game.js','utf8').replace(/^import[^\n]+\n/gm,'');
h=h.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('<script type="module" src="game.js"></script>',`<script type="module">${summary}\n${brand}\n${model}\n${platform}\n${js}</script>`);fs.writeFileSync('play-offline.html',h);console.log('Standalone playable build',Buffer.byteLength(h),'bytes');
