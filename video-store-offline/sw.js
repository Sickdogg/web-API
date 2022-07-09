self.addEventListener('install', e => {
 e.waitUntil(
   caches.open('video-store').then(function(cache) {
     return cache.addAll([
       '/video-store-offline/',
       '/video-store-offline/index.html',
       '/video-store-offline/index.js',
       '/video-store-offline/style.css'
     ]);
   })
 );
});

self.addEventListener('fetch', e => {
  console.log("fetch監聽:",e.request.url);
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
