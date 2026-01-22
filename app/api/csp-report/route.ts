import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-log'

/**
 * CSP違反レポートを受信してログに記録するエンドポイント
 * セキュリティ監視のために使用
 */
export async function POST(request: NextRequest) {
    try {
        const report = await request.json()

        // CSP違反をログに記録
        console.warn('[CSP Report] Violation detected:', {
            documentUri: report['csp-report']?.['document-uri'],
            violatedDirective: report['csp-report']?.['violated-directive'],
            blockedUri: report['csp-report']?.['blocked-uri'],
            sourceFile: report['csp-report']?.['source-file'],
            lineNumber: report['csp-report']?.['line-number'],
        })

        // 監査ログに記録
        await logAuditEvent({
            actor_email: 'system',
            action: 'security.csp_violation',
            success: false,
            details: {
                document_uri: report['csp-report']?.['document-uri'],
                violated_directive: report['csp-report']?.['violated-directive'],
                blocked_uri: report['csp-report']?.['blocked-uri'],
            }
        })

        return NextResponse.json({ received: true }, { status: 204 })
    } catch {
        // エラーでも204を返す（攻撃者に情報を与えない）
        return NextResponse.json({ received: true }, { status: 204 })
    }
}
