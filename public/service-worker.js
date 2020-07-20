const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/assets/db.js",
    "/manifest.webmanifest",
    "/assets/css/styles.css",
    "/assets/js/index.js",
    "/assets/icons/icon-192x192.png",
    "/assets/icons/icon-512x512.png",
]

const CACHE_NAME = "static-cache-v2"
const DATA_CACHE_NAME = "data-cache-v1"

// install
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache, storing files in array")
            return cache.addAll(FILES_TO_CACHE)
        })
    )

    self.skipWaiting()
})

// activate
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key)
                        return caches.delete(key)
                    }
                })
            )
        })
    )

    self.clients.claim()
})

// interecepts fetch instances
self.addEventListener("fetch", function (evt) {
    // caches responses to api requests
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then((cache) => {
                    return fetch(evt.request)
                        .then((response) => {
                            // If the response was good, clone it and store it in the cache.
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone())
                            }

                            return response
                        })
                        .catch((err) => {
                            // Network request failed, try to get it from the cache.
                            return cache.match(evt.request)
                        })
                })
                .catch((err) => console.log(err))
        )

        return
    }

    evt.respondWith(
        fetch(evt.request).catch(() => {
            return caches.match(evt.request).then((response) => {
                if (response) {
                    return response
                }
                // else return cached homepage for all requests for html pages
                else if (
                    evt.request.headers.get("accept").includes("text/html")
                ) {
                    return caches.match("/")
                }
            })
        })
    )

    // evt.respondWith(
    //     caches.open(CACHE_NAME).then((cache) => {
    //         return cache.match(evt.request).then((response) => {
    //             return response || fetch(evt.request)
    //         })
    //     })
    // )
})
