import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkUserAdmin } from '@/lib/supabase'

/**
 * GET: 現在のユーザーが管理者かどうかをチェック
 */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                { isAdmin: false },
                { status: 200 }
            )
        }

        const isAdmin = await checkUserAdmin(session.user.email)

        return NextResponse.json({ isAdmin })
    } catch (error) {
        console.error('Error checking admin status:', error)
        return NextResponse.json(
            { isAdmin: false },
            { status: 200 }
        )
    }
}
