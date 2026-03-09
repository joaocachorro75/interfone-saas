/**
 * Interfone Digital - Service Worker
 * Responsável por: PWA, Push Notifications, Cache, Background Sync
 */

const CACHE_NAME = 'interfone-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/ringtone.mp3',
  '/sounds/calling.mp3',
  '/offline.html'
];

// Instalação - Cacheia assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.error('[SW] Erro ao cachear:', err);
      })
  );
  self.skipWaiting();
});

// Ativação - Limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deletando cache antigo:', name);
              return caches.delete(name);
            })
        );
      })
  );
  self.clients.claim();
});

// Fetch - Serve do cache quando offline
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;
  
  // Ignora WebSocket e WebRTC
  if (event.request.url.includes('ws') || 
      event.request.url.includes('wss') ||
      event.request.url.includes('turn')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(fetchResponse => {
            // Não cacheia API calls
            if (event.request.url.includes('/api/')) {
              return fetchResponse;
            }
            
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return fetchResponse;
          })
          .catch(() => {
            // Fallback para offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// ============================================
// PUSH NOTIFICATIONS - Chamadas recebidas
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  const data = event.data.json();
  const title = data.title || 'Chamada no interfone';
  const options = {
    body: data.body || 'Você está sendo chamado',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72.png',
    tag: 'call-' + data.callId,
    requireInteraction: true,
    actions: [
      {
        action: 'accept',
        title: '📞 Atender',
        icon: '/icons/accept.png'
      },
      {
        action: 'reject',
        title: '❌ Recusar',
        icon: '/icons/reject.png'
      }
    ],
    data: {
      url: '/?action=incoming&callId=' + data.callId + '&from=' + data.from
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  if (action === 'accept') {
    // Abre o app e atende
    event.waitUntil(
      self.clients.openWindow(notificationData.url + '&action=accept')
    );
  } else if (action === 'reject') {
    // Manda rejction para o servidor
    event.waitUntil(
      fetch('/api/calls/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: notificationData.callId
        })
      })
    );
  } else {
    // Clique simples - abre o app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then(clientList => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return self.clients.openWindow('/');
        })
    );
  }
});

// Background Sync - Quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calls') {
    event.waitUntil(syncCalls());
  }
});

async function syncCalls() {
  // Sincroniza chamadas pendentes quando volta online
  const pending = await indexedDB.open('pending-calls');
  console.log('[SW] Sincronizando chamadas pendentes...');
}

// Mensagens do Client (main thread)
self.addEventListener('message', (event) => {
  if (event.data === 'keepAlive') {
    // Mantém SW ativo
    console.log('[SW] Keep alive');
  }
  
  if (event.data.type === 'CALL_ENDED') {
    // Fecha notificações de chamada
    self.registration.getNotifications({ tag: 'call-' + event.data.callId })
      .then(notifications => {
        notifications.forEach(n => n.close());
      });
  }
});

// Periodic Background Sync (Chrome Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-messages') {
    event.waitUntil(checkNewMessages());
  }
});

async function checkNewMessages() {
  // Verifica mensagens/conectividade em background
  console.log('[SW] Check de mensagens em background');
}
