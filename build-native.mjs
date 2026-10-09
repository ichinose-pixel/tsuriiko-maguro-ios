import {build} from 'esbuild';import fs from 'node:fs';
fs.mkdirSync('www',{recursive:true});
await build({entryPoints:['./native-entry.js'],tsconfigRaw:{},bundle:true,format:'esm',target:'safari15',outfile:'www/game.js',minify:true,legalComments:'eof'});
fs.copyFileSync('index.html','www/index.html');fs.copyFileSync('style.css','www/style.css');
console.log('Bundled local iOS web assets; no remote server or CDN');
