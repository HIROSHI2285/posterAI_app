import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { jobStore } from '@/lib/job-store'

/**
 * ジョブステータス取得API
 * GET /api/jobs/:id
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: jobId } = await params

        // ジョブを取得
        const job = jobStore.get(jobId)

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            )
        }

        // ジョブステータスを返却
        return NextResponse.json(job)

    } catch (error) {
        console.error('Job status error:', error)
        return NextResponse.json(
            { error: 'Failed to get job status' },
            { status: 500 }
        )
    }
}
