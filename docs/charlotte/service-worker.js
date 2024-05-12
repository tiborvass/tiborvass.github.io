const CACHE_NAME = 'site-cache-v1';
const urlsToCache = [
    'test.html',
    'https://github.com/tiborvass/dump/releases/download/test/media1.mp4'
];

self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            let total = urlsToCache.length;
            let cachedCount = 0;

            for (const url of urlsToCache) {
                // Fetch the resource manually
                const response = await fetch(url);

                // Clone the response stream to read and cache simultaneously
                const toCache = response.clone();
                const reader = toCache.body.getReader();
                const contentLength = +response.headers.get('Content-Length');
                let receivedLength = 0;  // received that many bytes at the moment

                // Create a new response stream to put into the cache
                const stream = new ReadableStream({
                    async start(controller) {
                        while (true) {
                            const {done, value} = await reader.read();  // read chunks
                            if (done) break;
                            receivedLength += value.length;
                            controller.enqueue(value);

                            // Send progress update
                            self.clients.matchAll().then(clients => {
                                clients.forEach(client => {
                                    client.postMessage({
                                        type: 'FETCH_PROGRESS',
                                        url: url,
                                        receivedLength: receivedLength,
                                        totalLength: contentLength
                                    });
                                });
                            });
                        }
                        controller.close();
                        reader.releaseLock();
                    }
                });

                await cache.put(url, new Response(stream, {headers: response.headers}));
                cachedCount++;
            }
        })()
    );
});
