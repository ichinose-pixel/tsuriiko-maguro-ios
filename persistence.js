// Fresh release namespace. Never read, migrate, modify or delete previous saves.
import {Game} from './model.js';
export function storageKeys(scope='release'){
 return {target:scope==='review'?'tsuriiko.core-release202610.v1':'tsuriiko.game.release202610.v1'};
}
const blocked=reason=>({status:'blocked',reason});
export function openSave(storage,scope='release'){
 const keys=storageKeys(scope);let error=null;
 const fail=reason=>{error=reason;return blocked(reason);};
 const session={keys,get error(){return error;},write(payload){
  if(error)return false;
  if(!new Game(payload).restored){fail('保存する内容を確認できないため停止しました。');return false;}
  try{
   const previous=storage.getItem(keys.target);
   if(previous!==null&&previous!==payload){storage.setItem(keys.target+'.backup',previous);if(storage.getItem(keys.target+'.backup')!==previous)throw Error('backup verification');}
   storage.setItem(keys.target,payload);if(storage.getItem(keys.target)!==payload)throw Error('write verification');return true;
  }catch{fail('保存できないため釣りを停止しました。空き容量やブラウザの保存設定を確認し、再読み込みしてください。');return false;}
 }};
 try{
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')return {...fail('保存機能を利用できません。保存設定を確認して再読み込みしてください。'),session};
  const target=storage.getItem(keys.target);
  if(target!==null){const game=new Game(target);return game.restored?{status:'ready',game,session}:{...fail('保存データを確認できません。過去の状態へ戻さず停止しました。'),session};}
  if(storage.getItem(keys.target+'.backup')!==null)return {...fail('保存の控えが見つかりました。データを保護するため復旧を待っています。'),session};
  const game=new Game();if(!session.write(game.save()))return {status:'blocked',reason:error,session};
  return {status:'new',game,session};
 }catch{return {...fail('保存データの読み書きができません。データを残して停止しました。'),session};}
}
