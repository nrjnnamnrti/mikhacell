const CACHE_NAME = 'mikha-cell-cache-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192px-v2.png',
    './icon-512px-v2.png'
];

// Install Event: Menyimpan aset penting ke dalam cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache berhasil dibuka');
                // Menggunakan catch untuk menghindari error jika file ikon belum diupload
                return cache.addAll(ASSETS_TO_CACHE).catch((err) => console.log('Sebagian aset gagal di-cache (wajar jika ikon belum ada):', err));
            })
    );
    self.skipWaiting();
});

// Activate Event: Membersihkan cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Strategi Network-First (Coba ambil dari internet dulu untuk pembaruan, jika offline baru ambil dari Cache)
self.addEventListener('fetch', (event) => {
    // Abaikan request dari ekstensi Chrome atau skema non-http/https
    if (!(event.request.url.indexOf('http') === 0)) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Pastikan response valid sebelum di-cache
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone response dan simpan ke cache agar jika offline nanti file sudah yang terbaru
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Jika offline atau gagal fetch, ambil file yang ada di cache
                return caches.match(event.request);
            })
    );
});
