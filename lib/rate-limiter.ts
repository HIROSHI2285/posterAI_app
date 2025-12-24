/**
 * レート制限 - ユーザー毎の使用量制限
 * メモリ内で管理（サーバー再起動でリセット）
 */

interface RateLimitRecord {
    count: number
    resetAt: number // タイムスタンプ
}

class RateLimiter {
    private records = new Map<string, RateLimitRecord>()

    /**
     * レート制限をチェック
     * @param identifier ユーザーID（email推奨）
     * @param limit 制限回数（デフォルト: 100回/日）
     * @returns { allowed: boolean, remaining: number, resetAt: number }
     */
    check(identifier: string, limit: number = 100): {
        allowed: boolean
        remaining: number
        resetAt: number
    } {
        const now = Date.now()
        const record = this.records.get(identifier)

        // レコードがないか、リセット時刻を過ぎている場合は新規作成
        if (!record || now >= record.resetAt) {
            const resetAt = this.getNextResetTime()
            this.records.set(identifier, {
                count: 1,
                resetAt
            })
            return {
                allowed: true,
                remaining: limit - 1,
                resetAt
            }
        }

        // 制限を超えている場合
        if (record.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: record.resetAt
            }
        }

        // カウントアップ
        record.count++
        this.records.set(identifier, record)

        return {
            allowed: true,
            remaining: limit - record.count,
            resetAt: record.resetAt
        }
    }

    /**
     * 次のリセット時刻を取得（翌日0時）
     */
    private getNextResetTime(): number {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return tomorrow.getTime()
    }

    /**
     * 古いレコードを削除（クリーンアップ）
     */
    cleanup(): void {
        const now = Date.now()
        for (const [identifier, record] of this.records) {
            if (now >= record.resetAt) {
                this.records.delete(identifier)
            }
        }
    }

    /**
     * 特定ユーザーの使用状況を取得
     */
    getUsage(identifier: string, limit: number = 100): {
        used: number
        remaining: number
        resetAt: number
    } {
        const now = Date.now()
        const record = this.records.get(identifier)

        if (!record || now >= record.resetAt) {
            return {
                used: 0,
                remaining: limit,
                resetAt: this.getNextResetTime()
            }
        }

        return {
            used: record.count,
            remaining: Math.max(0, limit - record.count),
            resetAt: record.resetAt
        }
    }
}

// シングルトンインスタンス
export const rateLimiter = new RateLimiter()

// 定期的なクリーンアップ（1時間毎）
if (typeof global !== 'undefined') {
    setInterval(() => {
        rateLimiter.cleanup()
    }, 60 * 60 * 1000)
}
