import fs from 'node:fs';
const files=["art.js","audio-engine.js","brand.js","game.js","index.html","model.js","persistence.js","platform.js","result-summary.js","style.css","audio/bgm.mp3","audio/bigCatch.wav","audio/cast.wav","audio/catch.wav","audio/coin.wav","audio/CREDITS.txt","audio/land.mp3","audio/reel.wav","audio/splash.wav","audio/ui.wav"];
fs.mkdirSync('web-dist',{recursive:true});
for(const name of files){const dest='web-dist/'+name;fs.mkdirSync(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});fs.copyFileSync(name,dest);}
console.log('Static web release built in web-dist ('+files.length+' files)');
