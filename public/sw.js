const CACHE_NAME = 'wasim-store-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://picsum.photos/seed/store/192/192',
  'https://picsum.photos/seed/store/512/512'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'নতুন নোটিফিকেশন', body: 'আপনার স্টোর থেকে একটি নতুন খবর আছে!' };
  const options = {
    body: data.body,
    icon: 'https://picsum.photos/seed/store/192/192',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
