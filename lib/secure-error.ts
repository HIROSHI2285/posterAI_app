/**
 * セキュアなエラーレスポンスを生成するユーティリティ
 * 本番環境では詳細なエラー情報を隠す
 */

const isProduction = process.env.NODE_ENV === 'production'

/**
 * APIエラーレスポンス用のセキュアなエラーメッセージを生成
 * 本番環境ではスタックトレースや内部エラー詳細を隠す
 */
export function getSecureErrorMessage(error: unknown, publicMessage: string): {
    message: string
    details?: string
} {
    if (isProduction) {
        // 本番環境では汎用的なエラーメッセージのみ返す
        return { message: publicMessage }
    }

    // 開発環境では詳細を表示
    return {
        message: publicMessage,
        details: error instanceof Error ? error.message : String(error)
    }
}

/**
 * APIレスポンス用のセキュアなエラーオブジェクトを生成
 */
export function createSecureErrorResponse(
    error: unknown,
    publicMessage: string,
    statusCode: number = 500
): { body: object; status: number } {
    const { message, details } = getSecureErrorMessage(error, publicMessage)

    // 本番環境ではログにのみ詳細を記録
    if (isProduction && error instanceof Error) {
        console.error(`[SecureError] ${publicMessage}:`, error.message)
    }

    return {
        body: details ? { error: message, details } : { error: message },
        status: statusCode
    }
}

/**
 * サニタイズされたユーザー入力を返す
 * XSS攻撃防止用
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

/**
 * ログ出力用にセンシティブ情報をマスク
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
        return '*'.repeat(data.length)
    }
    return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars)
}

/**
 * メールアドレスをマスク
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!domain) return maskSensitiveData(email)

    const maskedLocal = local.length > 2
        ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
        : '*'.repeat(local.length)

    return `${maskedLocal}@${domain}`
}
