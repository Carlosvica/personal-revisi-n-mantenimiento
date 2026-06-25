// Service Worker — Contrato de Mantenimiento Clauger
// v2: el documento se busca SIEMPRE en la red cuando hay internet (network-first),
// para que las actualizaciones se vean al instante. Sin conexión usa la copia guardada.
const CACHE = 'clauger-mantenimiento-v2';
const ASSETS = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-mask-192.png', './icon-mask-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).catch(function(){}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var isDoc = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isDoc) {
    // NETWORK-FIRST: con internet, siempre la última versión
    e.respondWith(
      fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        return resp;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
  } else {
    // CACHE-FIRST para iconos/recursos
    e.respondWith(
      caches.match(e.request).then(function(cached){
        return cached || fetch(e.request).then(function(resp){
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          return resp;
        });
      })
    );
  }
});
