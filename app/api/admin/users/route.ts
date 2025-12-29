import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllowedUsers, addAllowedUser, removeAllowedUser, toggleUserActive, toggleUserAdmin, checkUserAdmin, updateUserDailyLimit } from '@/lib/supabase'
import { adminLimiter } from '@/lib/rate-limit'
import { logAuditEvent, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET: 全ての許可ユーザーを取得
 */
export async function GET(request: Request) {
    try {
        // レート制限チェック（100リクエスト/分）
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const { success, remaining } = adminLimiter.check(100, ip)

        if (!success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': '100',
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '60',
                    }
                }
            )
        }

        // 認証チェック
        const session = await getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 管理者権限チェック
        const isAdmin = await checkUserAdmin(session.user.email)
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        const users = await getAllowedUsers()

        return NextResponse.json(
            { users },
            {
                headers: {
                    'X-RateLimit-Limit': '100',
                    'X-RateLimit-Remaining': String(remaining),
                }
            }
        )
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

/**
 * POST: 新しいユーザーを追加
 */
export async function POST(request: Request) {
    try {
        // 認証チェック
        const session = await getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 管理者権限チェック
        const isAdmin = await checkUserAdmin(session.user.email)
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { email, name } = body

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const result = await addAllowedUser(email, name)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to add user' },
                { status: 400 }
            )
        }

        // 監査ログ記録
        const requestInfo = extractRequestInfo(request)
        await logAuditEvent({
            actor_email: session.user.email,
            action: 'user.created',
            resource_type: 'user',
            resource_id: email,
            details: { name },
            ...requestInfo
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error adding user:', error)
        return NextResponse.json(
            { error: 'Failed to add user' },
            { status: 500 }
        )
    }
}

/**
 * DELETE: ユーザーを削除
 */
export async function DELETE(request: Request) {
    try {
        // 認証チェック
        const session = await getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 管理者権限チェック
        const isAdmin = await checkUserAdmin(session.user.email)
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const targetEmail = searchParams.get('email')

        if (!id || !targetEmail) {
            return NextResponse.json(
                { error: 'ID and email are required' },
                { status: 400 }
            )
        }

        const result = await removeAllowedUser(id, targetEmail, session.user.email)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to delete user' },
                { status: 400 }
            )
        }

        // 監査ログ記録
        const requestInfo = extractRequestInfo(request)
        await logAuditEvent({
            actor_email: session.user.email,
            action: 'user.deleted',
            resource_type: 'user',
            resource_id: id,
            details: { targetEmail },
            ...requestInfo
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/admin/users
 * ユーザー情報の更新（is_active または daily_limit）
 */
export async function PATCH(request: Request) {
    try {
        // 認証チェック
        const session = await getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 管理者権限チェック
        const isAdmin = await checkUserAdmin(session.user.email)
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // daily_limitの更新
        if (body.id && body.daily_limit !== undefined) {
            const result = await updateUserDailyLimit(body.id, body.daily_limit)
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 400 })
            }
            return NextResponse.json({ success: true })
        }

        // is_activeの更新
        if (body.id && body.is_active !== undefined) {
            const { id, is_active } = body
            const result = await toggleUserActive(id, is_active)

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Failed to update user' },
                    { status: 400 }
                )
            }

            // 監査ログ記録
            const requestInfo = extractRequestInfo(request)
            await logAuditEvent({
                actor_email: session.user.email,
                action: 'user.status.changed',
                resource_type: 'user',
                resource_id: id,
                details: { newStatus: is_active ? 'active' : 'inactive' },
                ...requestInfo
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    } catch (error) {
        console.error('PATCH /api/admin/users error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PUT: ユーザーの管理者権限を切り替え
 */
export async function PUT(request: Request) {
    try {
        // 認証チェック
        const session = await getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 管理者権限チェック
        const isAdmin = await checkUserAdmin(session.user.email)
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { id, target_email, is_admin } = body

        if (!id || !target_email || typeof is_admin !== 'boolean') {
            return NextResponse.json(
                { error: 'ID, target_email, and is_admin are required' },
                { status: 400 }
            )
        }

        const result = await toggleUserAdmin(id, target_email, session.user.email, is_admin)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to update user admin status' },
                { status: 400 }
            )
        }

        // 監査ログ記録
        const requestInfo = extractRequestInfo(request)
        await logAuditEvent({
            actor_email: session.user.email,
            action: 'user.role.changed',
            resource_type: 'user',
            resource_id: id,
            details: {
                targetEmail: target_email,
                newRole: is_admin ? 'admin' : 'user'
            },
            ...requestInfo
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating user admin status:', error)
        return NextResponse.json(
            { error: 'Failed to update user admin status' },
            { status: 500 }
        )
    }
}
