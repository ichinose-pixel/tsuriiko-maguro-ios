// Plays licensed recordings only. No oscillators or synthesized replacement sounds.
export const AUDIO_ASSETS={bgm:'audio/bgm.mp3',land:'audio/land.mp3',cast:'audio/cast.wav',reel:'audio/reel.wav',splash:'audio/splash.wav',catch:'audio/catch.wav',bigCatch:'audio/bigCatch.wav',ui:'audio/ui.wav',coin:'audio/coin.wav'};
const GAINS={bgm:.22,land:.38,cast:.44,reel:.13,splash:.30,catch:.22,bigCatch:.32,ui:.24,coin:.42};
export class RecordedAudio {
 constructor(volume){const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=volume;this.master.connect(this.ctx.destination);this.capture=this.ctx.createMediaStreamDestination();this.master.connect(this.capture);this.buffers={};this.loops={};this.retiring=new Set();this.voices=[];this.events=[];this.errors=[];this.active=false;this.phase='';this.volume=volume;this.duckUntil=0;this.lastCatch=-Infinity;this.maxVoices=0;this.generation=0;this.nextVoiceId=1;this.loading=Promise.all(Object.entries(AUDIO_ASSETS).map(async([k,url])=>{try{const r=await fetch(url);if(!r.ok)throw Error(r.status);this.buffers[k]=await this.ctx.decodeAudioData(await r.arrayBuffer());}catch(e){this.errors.push(k+': '+e.message);}}));}
 get state(){return this.ctx.state;}
 async resume(phase='aim'){this.phase=phase;this.active=true;const generation=++this.generation;await this.ctx.resume();await this.loading;if(generation!==this.generation||!this.active||this.ctx.state!=='running')return;this.loop('bgm',true);this.update(this.phase);}
 // Suspending a context alone would freeze old SE and replay them on unmute.
 // Discard every scheduled/playing source before suspension, including fading loops.
 suspend(){this.active=false;this.generation++;for(const v of [...this.voices,...Object.values(this.loops),...this.retiring])this.stopVoice(v);this.voices=[];this.loops={};this.retiring.clear();this.duckUntil=0;this.lastCatch=-Infinity;return this.ctx.suspend();}
 stopVoice(v){if(!v)return;v.ended=true;try{v.src.stop();}catch{}try{v.gain.disconnect();}catch{}this.retiring.delete(v);}
 setVolume(v){this.volume=v;this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.03);}
 source(key,loop=false){const buffer=this.buffers[key];if(!buffer||!this.active||this.ctx.state!=='running')return null;const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=buffer;src.loop=loop;gain.gain.value=GAINS[key]||.25;src.connect(gain).connect(this.master);const v={id:this.nextVoiceId++,key,src,gain,ended:false};src.onended=()=>{v.ended=true;this.retiring.delete(v);gain.disconnect();};src.start();this.events.push({id:v.id,key,time:performance.now()/1000});if(this.events.length>100)this.events.shift();return v;}
 loop(key,on){if(!on)return this.stopLoop(key);if(!this.loops[key])this.loops[key]=this.source(key,true);}
 stopLoop(key){const v=this.loops[key];if(!v)return;delete this.loops[key];this.retiring.add(v);const now=this.ctx.currentTime;v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.04);try{v.src.stop(now+.18);}catch{this.stopVoice(v);}}
 play(key){if(key==='upgrade'||key==='result')key='ui';if(!this.active)return;const now=this.ctx.currentTime;
  if(key==='catch'||key==='bigCatch'){if(now-this.lastCatch<.10)return;this.lastCatch=now;for(const v of this.voices.filter(v=>v.key==='catch'||v.key==='bigCatch'))this.stopVoice(v);}
  if(key==='land'){this.duckUntil=now+(this.buffers.land?.duration||5.23);}
  this.voices=this.voices.filter(v=>!v.ended);while(this.voices.length>=4)this.stopVoice(this.voices.shift());
  const v=this.source(key);if(!v)return;this.voices.push(v);this.maxVoices=Math.max(this.maxVoices,this.voices.length);
 }
 update(phase,haul=0){const previous=this.phase;this.phase=phase;if(!this.active)return;this.voices=this.voices.filter(v=>!v.ended);this.loop('reel',phase==='up');const reel=this.loops.reel;if(reel)reel.src.playbackRate.setTargetAtTime(1+Math.max(0,Math.min(1,haul))*.35,this.ctx.currentTime,.08);if(phase==='down'&&previous!=='down'){for(const v of this.voices.filter(v=>v.key==='land'))this.stopVoice(v);this.duckUntil=0;}const bgm=this.loops.bgm;if(bgm)bgm.gain.gain.setTargetAtTime(this.ctx.currentTime<this.duckUntil?.055:GAINS.bgm,this.ctx.currentTime,.12);}
 diagnostics(){return {reelRate:this.loops.reel?.src.playbackRate.value??null,state:this.state,active:this.active,phase:this.phase,generation:this.generation,decoded:Object.keys(this.buffers),errors:this.errors,voices:this.voices.filter(v=>!v.ended).length,voiceIds:this.voices.filter(v=>!v.ended).map(v=>({id:v.id,key:v.key})),maxVoices:this.maxVoices,loops:Object.keys(this.loops),retiringLoops:this.retiring.size,ducked:this.ctx.currentTime<this.duckUntil,events:this.events};}
}
