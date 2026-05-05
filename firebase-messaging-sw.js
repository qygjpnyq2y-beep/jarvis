// Firebase Messaging Service Worker for JARVIS
// This file MUST be at the root of your hosting domain

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase config will be passed via messaging.getToken() or postMessage
// For now, we initialize with a placeholder and update dynamically
let firebaseConfig = null;

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      const messaging = firebase.messaging();
      
      // Handle background messages
      messaging.onBackgroundMessage(function(payload) {
        console.log('[JARVIS SW] Background message:', payload);
        
        const title = payload.notification?.title || 'JARVIS';
        const options = {
          body: payload.notification?.body || '',
          icon: payload.data?.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.data?.tag || 'jarvis-notification',
          data: {
            url: payload.data?.url || '/',
            ...payload.data
          },
          actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
          vibrate: [100, 50, 100]
        };
        
        return self.registration.showNotification(title, options);
      });
    } catch (e) {
      console.error('[JARVIS SW] Init error:', e);
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[JARVIS SW] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Focus existing tab if open
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf(urlToOpen) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[JARVIS SW] Notification dismissed:', event.notification.tag);
});
