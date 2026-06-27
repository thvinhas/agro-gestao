const CACHE = 'gestao-leiteira-v1'
const STATIC_ASSETS = [
  '/',
  '/lancamentos',
  '/login',
  '/manifest.json',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls (Supabase) → Network-first, fallback to cache
  if (url.hostname !== self.location.hostname) {
    event.respondWith(networkFirst(request))
    return
  }

  // Next.js static assets → Cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation → Network-first (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // Everything else → Network-first
  event.respondWith(networkFirst(request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      return caches.match('/')
    }
    return new Response('Offline', { status: 503 })
  }
}
