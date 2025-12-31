/**
 * エラーハンドリングユーティリティ
 * 本番環境では詳細なエラー情報を隠蔽し、セキュリティを向上
 */

const isProduction = process.env.NODE_ENV === 'production'

export interface SanitizedError {
    message: string
    code?: string
    details?: any
}

/**
 * エラーをサニタイズして安全な形式で返す
 * @param error 元のエラーオブジェクト
 * @param publicMessage ユーザーに表示する公開メッセージ（オプション）
 */
export function sanitizeError(
    error: any,
    publicMessage?: string
): SanitizedError {
    if (isProduction) {
        // 本番環境では一般的なメッセージのみ返す
        return {
            message: publicMessage || 'サービスでエラーが発生しました。しばらくしてから再度お試しください。',
            code: 'INTERNAL_ERROR'
        }
    } else {
        // 開発環境では詳細を返す（デバッグ用）
        return {
            message: error?.message || publicMessage || 'Unknown error',
            code: error?.code || 'UNKNOWN',
            details: {
                name: error?.name,
                stack: error?.stack,
                ...error
            }
        }
    }
}

/**
 * APIエラーレスポンスを生成
 */
export function createErrorResponse(
    error: any,
    status: number = 500,
    publicMessage?: string
): { error: SanitizedError; status: number } {
    return {
        error: sanitizeError(error, publicMessage),
        status
    }
}

/**
 * よくあるエラーパターンのヘルパー
 */
export const ErrorMessages = {
    UNAUTHORIZED: '認証が必要です',
    FORBIDDEN: 'アクセス権限がありません',
    NOT_FOUND: 'リソースが見つかりません',
    BAD_REQUEST: '不正なリクエストです',
    RATE_LIMIT: 'リクエスト回数の上限に達しました',
    INTERNAL_ERROR: 'サーバーエラーが発生しました',
    VALIDATION_ERROR: '入力内容を確認してください',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません'
} as const
