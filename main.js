/* To Get Her: start-up. */
(function(){
'use strict';
const TGH=window.TGH,$=s=>document.querySelector(s);
/* ---------- install on phone ---------- */
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;document.querySelectorAll('.inst-btn').forEach(b=>b.style.display='')});
window.addEventListener('appinstalled',()=>{deferred=null;document.querySelectorAll('.inst-btn').forEach(b=>b.style.display='none');if(TGH.ui&&TGH.ui.toast)TGH.ui.toast('Installed! Open To Get Her from your home screen.')});
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
TGH.install={
  installed:()=>window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true,
  async go(){
    if(deferred){const d=deferred;deferred=null;d.prompt();try{await d.userChoice}catch(e){}return}
    let body;
    if(isIOS())body='<p>On iPhone or iPad:</p><ol><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (the square with an arrow pointing up).</li><li>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol><p>To Get Her will open full screen from its own icon and work offline.</p>';
    else body='<p>On Android:</p><ol><li>Open this page in <b>Chrome</b>.</li><li>Tap the <b>⋮</b> menu at the top right.</li><li>Tap <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.</li></ol><p>On a computer, look for the install icon at the right end of the address bar.</p>';
    TGH.ui.modalChoice('Install on your phone',body,[{label:'Got it',cls:'gold'}]);
  }
};
window.addEventListener('DOMContentLoaded',()=>{
  try{
    TGH.art.init($('#gl'));
    TGH.ui.init();
    document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('button')&&TGH.sound)TGH.sound.play('click')});
    $('#b-fast').onclick=()=>{TGH.game.settings.fast=!TGH.game.settings.fast;TGH.art.fast=TGH.game.settings.fast;$('#b-fast').classList.toggle('on',TGH.art.fast);TGH.game.save()};
    $('#b-zin').onclick=()=>TGH.art.setZoom(TGH.art.zoom*.85);
    $('#b-zout').onclick=()=>TGH.art.setZoom(TGH.art.zoom*1.18);
    $('#b-help').onclick=()=>TGH.help.open();$('#b-best').onclick=()=>{if(TGH.game.s)TGH.ui.bestiary()};
    $('#b-center').onclick=()=>{const h=TGH.game.active&&TGH.game.s&&TGH.game.s.run?TGH.game.active():null;if(h)TGH.art.focus(h.c,h.r)};
    $('#b-menu').onclick=()=>TGH.ui.settings();
    TGH.ui.showTitle();
    if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
  }catch(e){
    document.body.insertAdjacentHTML('beforeend','<pre style="position:fixed;inset:0;margin:0;padding:20px;background:#200;color:#fcc;z-index:99;white-space:pre-wrap">The game could not start:\n'+(e&&e.stack||e)+'</pre>');
    throw e;
  }
});
})();
