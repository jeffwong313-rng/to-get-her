/* To Get Her: start-up. */
(function(){
'use strict';
const TGH=window.TGH,$=s=>document.querySelector(s);
window.addEventListener('DOMContentLoaded',()=>{
  try{
    TGH.art.init($('#gl'));
    TGH.ui.init();
    $('#b-fast').onclick=()=>{TGH.game.settings.fast=!TGH.game.settings.fast;TGH.art.fast=TGH.game.settings.fast;$('#b-fast').classList.toggle('on',TGH.art.fast);TGH.game.save()};
    $('#b-zin').onclick=()=>TGH.art.setZoom(TGH.art.zoom*.85);
    $('#b-zout').onclick=()=>TGH.art.setZoom(TGH.art.zoom*1.18);
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
