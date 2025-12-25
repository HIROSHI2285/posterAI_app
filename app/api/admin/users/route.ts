import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllowedUsers, addAllowedUser, removeAllowedUser, toggleUserActive } from '@/lib/supabase'

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

        // 管理者権限チェック（最初に登録されたユーザーのみ）
        // TODO: より堅牢な権限管理を実装する場合はここを変更

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

        const body = await request.json()
        const { email, name } = body

        if (!email || typeof email !== 'string') {
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

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        const result = await removeAllowedUser(id)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to remove user' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing user:', error)
        return NextResponse.json(
            { error: 'Failed to remove user' },
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
