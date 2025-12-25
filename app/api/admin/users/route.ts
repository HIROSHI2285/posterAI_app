import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllowedUsers, addAllowedUser, removeAllowedUser, toggleUserActive, toggleUserAdmin, checkUserAdmin } from '@/lib/supabase'

/**
 * GET: 全ての許可ユーザーを取得
 */
export async function GET() {
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

        const users = await getAllowedUsers()

        return NextResponse.json({ users })
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

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            )
        }

        const result = await removeAllowedUser(id)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to delete user' },
                { status: 400 }
            )
        }

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
 * PATCH: ユーザーの有効/無効を切り替え
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
        const { id, is_active } = body

        if (!id || typeof is_active !== 'boolean') {
            return NextResponse.json(
                { error: 'ID and is_active are required' },
                { status: 400 }
            )
        }

        const result = await toggleUserActive(id, is_active)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to update user' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
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
        const { id, is_admin } = body

        if (!id || typeof is_admin !== 'boolean') {
            return NextResponse.json(
                { error: 'ID and is_admin are required' },
                { status: 400 }
            )
        }

        const result = await toggleUserAdmin(id, is_admin)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to update user admin status' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating user admin status:', error)
        return NextResponse.json(
            { error: 'Failed to update user admin status' },
            { status: 500 }
        )
    }
}
