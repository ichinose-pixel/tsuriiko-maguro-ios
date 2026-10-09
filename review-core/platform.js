// A native preferences adapter can later implement this same storage contract.
export function createStorage(storage,key='tsuriiko.game.v3'){
 return {
  load(){try{return storage.getItem(key)||storage.getItem(key+'.backup');}catch{return null;}},
  backup(){try{return storage.getItem(key+'.backup');}catch{return null;}},
  write(payload){try{const previous=storage.getItem(key);if(previous)storage.setItem(key+'.backup',previous);storage.setItem(key,payload);return true;}catch{return false;}},
  key
 };
}
export const AD_POLICY=Object.freeze({interstitialPlacement:'after_claim_only',neverInterrupt:['aim','down','up','landing','result'],removalScope:'all_forced_ads',optionalRewardForOwners:'same_daily_limit_without_video'});
// No SDK, network, product IDs, purchase button, or simulated paid entitlement.
export function createMonetizationPort(){return Object.freeze({
 async getEntitlement(){return {adRemoval:false,source:'none',connected:false};},
 async restorePurchases(){return {status:'not_connected'};},
 async showInterstitial(){return {status:'not_connected'};},
 async showRewarded(){return {status:'not_connected',rewardGranted:false};}
 });}
