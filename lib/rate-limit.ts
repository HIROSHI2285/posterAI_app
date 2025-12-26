import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
    uniqueTokenPerInterval: number
    interval: number
}

export function rateLimit(options: RateLimitOptions) {
    const tokenCache = new LRUCache<string, number[]>({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    })

    return {
        check: (limit: number, token: string): { success: boolean; remaining: number } => {
            const tokenCount = tokenCache.get(token) || [0]
            const currentUsage = tokenCount[0]

            if (currentUsage >= limit) {
                return { success: false, remaining: 0 }
            }

            tokenCache.set(token, [currentUsage + 1])

            return {
                success: true,
                remaining: limit - (currentUsage + 1),
            }
        },
    }
}

// 管理者API用のレート制限（100リクエスト/分）
export const adminLimiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60 * 1000,
})

// 一般API用のレート制限（100リクエスト/分）
export const apiLimiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60 * 1000,
})
