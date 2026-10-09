// One serial writer: a later autosave can never overtake a claimed reward.
export async function createPreferencesStorage(preferences, fallback, key='tsuriiko.game.v3', isValid=()=>true) {
 const [current, backup]=await Promise.all([preferences.get({key}),preferences.get({key:key+'.backup'})]);
 let value=current.value, prior=backup.value, tail=Promise.resolve(true);
 if(value&&!isValid(value))value=null;
 if(prior&&!isValid(prior))prior=null;
 if(!value&&prior)value=prior;
 if(!value&&(current.value||backup.value))throw new Error('Native saves are invalid; preserve them for recovery');
 // Import only this game's web save, never another app's preferences.
 if(!value&&!prior){const web=fallback.load(),old=fallback.backup();value=web&&isValid(web)?web:old&&isValid(old)?old:null;prior=old&&isValid(old)?old:null;if(value)await preferences.set({key,value});}
 return {key,kind:'native-preferences',load:()=>value||prior,backup:()=>prior,
  write(payload){const operation=tail.then(async()=>{try{if(value)await preferences.set({key:key+'.backup',value});await preferences.set({key,value:payload});prior=value;value=payload;return true;}catch{return false;}});tail=operation;return operation;},
  flush:()=>tail
 };
}
