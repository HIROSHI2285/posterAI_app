import { supabaseAdmin } from './supabase'

export interface AuditLogEntry {
    actor_email: string
    action: string
    resource_type?: string
    resource_id?: string
    details?: Record<string, any>
    ip_address?: string
    user_agent?: string
    success?: boolean
}

/**
 * 監査ログを記録
 * @param entry 監査ログエントリー
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('audit_logs')
            .insert([{
                actor_email: entry.actor_email,
                action: entry.action,
                resource_type: entry.resource_type,
                resource_id: entry.resource_id,
                details: entry.details,
                ip_address: entry.ip_address,
                user_agent: entry.user_agent,
                success: entry.success !== undefined ? entry.success : true,
            }])

        if (error) {
            console.error('Failed to log audit event:', error)
            // 監査ログの失敗はアプリケーションを止めない
        }
    } catch (error) {
        console.error('Exception logging audit event:', error)
    }
}

/**
 * 監査ログを取得（管理者用）
 * @param options フィルタオプション
 */
export async function getAuditLogs(options?: {
    limit?: number
    offset?: number
    actorEmail?: string
    action?: string
}) {
    try {
        let query = supabaseAdmin
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })

        if (options?.actorEmail) {
            query = query.eq('actor_email', options.actorEmail)
        }

        if (options?.action) {
            query = query.eq('action', options.action)
        }

        if (options?.limit) {
            query = query.limit(options.limit)
        }

        if (options?.offset) {
            query = query.range(
                options.offset,
                options.offset + (options.limit || 50) - 1
            )
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching audit logs:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching audit logs:', error)
        return []
    }
}

/**
 * IPアドレスとUser-Agentを抽出するヘルパー
 */
export function extractRequestInfo(request: Request) {
    return {
        ip_address: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            undefined,
        user_agent: request.headers.get('user-agent') || undefined,
    }
}
