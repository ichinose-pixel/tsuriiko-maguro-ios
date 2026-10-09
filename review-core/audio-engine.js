// Plays licensed recordings only. No oscillators or synthesized replacement sounds.
export const AUDIO_ASSETS={bgm:'audio/bgm.mp3',land:'audio/land.mp3',cast:'audio/cast.wav',reel:'audio/reel.wav',splash:'audio/splash.wav',catch:'audio/catch.wav',bigCatch:'audio/bigCatch.wav',ui:'audio/ui.wav',coin:'audio/coin.wav'};
const GAINS={bgm:.22,land:.38,cast:.44,reel:.13,splash:.30,catch:.22,bigCatch:.32,ui:.24,coin:.42};
export class RecordedAudio {
 constructor(volume){const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=volume;this.master.connect(this.ctx.destination);this.capture=this.ctx.createMediaStreamDestination();this.master.connect(this.capture);this.buffers={};this.loops={};this.voices=[];this.events=[];this.errors=[];this.active=false;this.phase='';this.volume=volume;this.duckUntil=0;this.lastCatch=-1;this.maxVoices=0;this.loading=Promise.all(Object.entries(AUDIO_ASSETS).map(async([k,url])=>{try{const r=await fetch(url);if(!r.ok)throw Error(r.status);this.buffers[k]=await this.ctx.decodeAudioData(await r.arrayBuffer());}catch(e){this.errors.push(k+': '+e.message);}}));}
 get state(){return this.ctx.state;}
 async resume(){this.active=true;await this.ctx.resume();await this.loading;if(this.active&&this.ctx.state==='running')this.loop('bgm',true);}
 suspend(){this.active=false;this.stopLoop('reel');return this.ctx.suspend();}
 setVolume(v){this.volume=v;this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.03);}
 source(key,loop=false){const buffer=this.buffers[key];if(!buffer||!this.active||this.ctx.state!=='running')return null;const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=buffer;src.loop=loop;gain.gain.value=GAINS[key]||.25;src.connect(gain).connect(this.master);src.start();this.events.push({key,time:performance.now()/1000});if(this.events.length>100)this.events.shift();return {key,src,gain,ended:false};}
 loop(key,on){if(!on)return this.stopLoop(key);if(!this.loops[key])this.loops[key]=this.source(key,true);}
 stopLoop(key){const v=this.loops[key];if(!v)return;delete this.loops[key];const now=this.ctx.currentTime;v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.04);try{v.src.stop(now+.18);}catch{}}
 play(key){if(key==='upgrade'||key==='result')key='ui';if(!this.active)return;const now=this.ctx.currentTime;
  if(key==='catch'||key==='bigCatch'){if(now-this.lastCatch<.10)return;this.lastCatch=now;for(const v of this.voices.filter(v=>v.key==='catch'||v.key==='bigCatch')){try{v.src.stop();}catch{}}}
  if(key==='land'){this.duckUntil=now+(this.buffers.land?.duration||5.23);}
  this.voices=this.voices.filter(v=>!v.ended);while(this.voices.length>=4){const old=this.voices.shift();try{old.src.stop();}catch{}}
  const v=this.source(key);if(!v)return;v.src.onended=()=>v.ended=true;this.voices.push(v);this.maxVoices=Math.max(this.maxVoices,this.voices.length);
 }
 update(phase){if(!this.active)return;this.voices=this.voices.filter(v=>!v.ended);this.loop('reel',phase==='up');if(phase==='down'&&this.phase!=='down'){for(const v of this.voices.filter(v=>v.key==='land')){try{v.src.stop();}catch{}}this.duckUntil=0;}this.phase=phase;const bgm=this.loops.bgm;if(bgm)bgm.gain.gain.setTargetAtTime(this.ctx.currentTime<this.duckUntil?.055:GAINS.bgm,this.ctx.currentTime,.12);}
 diagnostics(){return {state:this.state,decoded:Object.keys(this.buffers),errors:this.errors,voices:this.voices.filter(v=>!v.ended).length,maxVoices:this.maxVoices,loops:Object.keys(this.loops),events:this.events};}
}
