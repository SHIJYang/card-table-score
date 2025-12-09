// public/sw.js
const CACHE_NAME = 'mediapipe-hand-v1'
const MEDIAPIPE_URLS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm/',
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
]

// 缓存所有 MediaPipe 相关资源（包括子资源）
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // 只缓存 MediaPipe 相关请求
  if (
    MEDIAPIPE_URLS.some((prefix) => url.startsWith(prefix)) &&
    event.request.destination === 'script' || 
    event.request.destination === 'wasm' ||
    url.endsWith('.task')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          return cached || fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone())
            }
            return response
          })
        })
      })
    )
  }
})