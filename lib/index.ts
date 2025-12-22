import { cn } from "@/lib/utils"

export type { ClassValue } from "clsx"

export { cn }

/**
 * クライアントサイドでのみ実行される関数
 */
export function isClient(): boolean {
    return typeof window !== "undefined"
}

/**
 * 安全に乱数を生成（SSR対応）
 */
export function safeRandom(): number {
    if (isClient()) {
        return Math.random()
    }
    return 0.5 // サーバーサイドではデフォルト値
}
