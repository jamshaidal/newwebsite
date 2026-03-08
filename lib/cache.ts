type CacheItem = {
    data: any
    expiry: number
}

const cache = new Map<string, CacheItem>()

export function setCache(key: string, data: any, ttlSeconds: number) {

    cache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000
    })

}

export function getCache(key: string) {

    const item = cache.get(key)

    if (!item) return null

    if (Date.now() > item.expiry) {
        cache.delete(key)
        return null
    }

    return item.data
}
