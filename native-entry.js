import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {App} from '@capacitor/app';
import {createStorage} from './platform.js';
import {createPreferencesStorage} from './native-storage.js';
import {Game} from './model.js';
if(Capacitor.isNativePlatform()) {
 try {
  let web;try{web=localStorage;}catch{}
  window.__nativeHost={storage:await createPreferencesStorage(Preferences,createStorage(web),'tsuriiko.game.v3',raw=>new Game(raw).restored),App};
 } catch {
  document.body.textContent='保存データを読み込めませんでした。アプリを終了して開き直してください。';
  throw new Error('Native storage initialization failed; game not started');
 }
}
await import('./game.js');
