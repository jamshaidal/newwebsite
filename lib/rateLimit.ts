type RateItem = {
    count: number
    expiry: number
}

const requests = new Map<string, RateItem>()

const LIMIT = 10        // max requests
const WINDOW = 60       // seconds

export function checkRateLimit(ip: string) {

    const now = Date.now()
    const item = requests.get(ip)

    if (!item) {
        requests.set(ip, {
            count: 1,
            expiry: now + WINDOW * 1000
        })
        return true
    }

    if (now > item.expiry) {
        requests.set(ip, {
            count: 1,
            expiry: now + WINDOW * 1000
        })
        return true
    }

    if (item.count >= LIMIT) {
        return false
    }

    item.count++
    return true
}
