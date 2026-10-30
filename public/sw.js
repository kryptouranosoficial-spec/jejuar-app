/**
 * @file sw.js
 * @description Service Worker oficial do aplicativo Jejuar (PWA v2).
 * Implementa estratégia Network-First para scripts e páginas, eliminando qualquer retenção
 * de versões antigas no navegador, e mantém o motor de Web Push ativo em segundo plano.
 */

// Versão incrementada para forçar o descarte automático de caches antigos no celular (v3)
const CACHE_NAME = 'jejuar-pwa-v3';

// Ativos estáticos e página inicial essenciais para validação PWA offline
const RECURSOS_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

/**
 * Evento de Instalação: Baixa os ativos estáticos e força a ativação imediata (skipWaiting).
 */
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(RECURSOS_PRECACHE);
    }).then(() => {
      // Assume imediatamente o controle sem aguardar o fechamento das abas
      return self.skipWaiting();
    })
  );
});

/**
 * Evento de Ativação: Exclui permanentemente todos os caches antigos (v1 e outros)
 * e assume controle de todas as páginas abertas (clients.claim).
 */
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chavesCache) => {
      return Promise.all(
        chavesCache.map((chave) => {
          if (chave !== CACHE_NAME) {
            console.log('[SW] Purgando cache antigo obsoleto:', chave);
            return caches.delete(chave);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/**
 * Evento de Interceptação de Requisições (Fetch):
 * ESTRATÉGIA NETWORK-FIRST: Qualquer código JavaScript, HTML, CSS ou módulo do Vite
 * é SEMPRE buscado diretamente do servidor para garantir atualizações em tempo real.
 */
self.addEventListener('fetch', (evento) => {
  if (!evento.request.url.startsWith('http')) return;

  const url = new URL(evento.request.url);

  // Todo código executável, páginas e chamadas de API são sempre da Rede primeiro
  const deveBuscarDaRedePrimeiro = 
    evento.request.mode === 'navigate' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('@') ||
    url.pathname === '/';

  if (deveBuscarDaRedePrimeiro) {
    evento.respondWith(
      fetch(evento.request).catch(() => {
        // Fallback apenas se estiver totalmente offline
        return caches.match(evento.request) || caches.match('/index.html');
      })
    );
    return;
  }

  // Para imagens e ícones locais, Stale-While-Revalidate
  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      const fetchPromise = fetch(evento.request).then((respostaRede) => {
        if (respostaRede && respostaRede.status === 200) {
          const clone = respostaRede.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, clone));
        }
        return respostaRede;
      }).catch(() => respostaCache);

      return respostaCache || fetchPromise;
    })
  );
});

/**
 * Evento 'push' da Web Push API:
 * Acordado pelo sistema operacional (Android ou iOS) mesmo com o aplicativo fechado.
 */
self.addEventListener('push', (evento) => {
  let dados = {
    title: 'Jejuar 🔥',
    body: 'Seu corpo está em sincronia metabólica. Acompanhe sua evolução!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'jejuar-geral',
    data: { url: '/' }
  };

  if (evento.data) {
    try {
      const payload = evento.data.json();
      dados = { ...dados, ...payload };
    } catch {
      dados.body = evento.data.text();
    }
  }

  const opcoes = {
    body: dados.body,
    icon: dados.icon || '/icon-192.png',
    badge: dados.badge || '/icon-192.png',
    tag: dados.tag || 'jejuar-notificacao',
    renotify: true,
    requireInteraction: false,
    vibrate: [250, 100, 250, 100, 250],
    data: dados.data || { url: '/' },
    actions: dados.actions || [
      { action: 'abrir', title: 'Abrir App' }
    ]
  };

  evento.waitUntil(
    self.registration.showNotification(dados.title || 'Jejuar', opcoes)
  );
});

/**
 * Ação ao clicar na Notificação: Abre ou foca a janela do aplicativo no caminho correspondente.
 */
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const urlDestino = evento.notification.data?.url || '/';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((listaClientes) => {
      for (const cliente of listaClientes) {
        if (cliente.url.includes(self.location.origin) && 'focus' in cliente) {
          cliente.postMessage({ tipo: 'NOTIFICACAO_CLICADA', url: urlDestino });
          return cliente.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlDestino);
      }
    })
  );
});

/**
 * Evento 'pushsubscriptionchange':
 * Intercepta rotações automáticas de tokens de push pelo sistema operacional ou pelo Google FCM
 * e aciona a re-sincronização transparente.
 */
self.addEventListener('pushsubscriptionchange', (evento) => {
  console.log('[SW] Detectada alteração nativa na assinatura de push pelo navegador.');
  evento.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BJhZ8UVaICG-vfkI04dGhJKmk4OHkS0tglNs1IWDdSE0ScGdRfVUtpAeLuNyxwyhzu40SxkFMpcs3lzTubd6MgM')
    }).then((novaInscricao) => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
        for (const cliente of clientes) {
          cliente.postMessage({ tipo: 'PUSH_SUBSCRIPTION_CHANGED', subscription: novaInscricao });
        }
      });
    }).catch((err) => {
      console.warn('[SW] Erro ao renovar assinatura no pushsubscriptionchange:', err);
    })
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = self.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

