 // boiler plate code
 if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
         navigator.serviceWorker.register('service-worker.js').then(reg => {
            console.log('Hello world from service-worker.js!')
         });
     });
 }

//  if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('./service-worker.js')
//       .then(() => navigator.serviceWorker.ready)
//       .then(registration => {
//         if ('SyncManager' in window) {
//           registration.sync.register('sync-transactions');
//         }
//       })
//   }

 const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/index.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
  ];
  
  const CACHE_NAME = 'static-cache-v2';
  const DATA_CACHE_NAME = 'data-cache-v1';
  
  // install
  self.addEventListener('install', function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log('Your files were pre-cached successfully!');
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  
  self.addEventListener('activate', function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log('Removing old cache data', key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  
// fetch - makes our serviceworker as proxy, when online will get the newest files, if offline it will get from cache
  self.addEventListener('fetch', function(evt) {
    // cache successful requests to the API
    if (evt.request.url.includes('/api/')) {
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    // if the request is not for the API, serve static assets using 'offline-first' approach.
    evt.respondWith(
      caches.match(evt.request).then(function(response) {
        return response || fetch(evt.request);
      })
    );
  });

 