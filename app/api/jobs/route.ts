import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { jobStore } from '@/lib/job-store'
import { generatePosterAsync } from '../generate-poster/async'
import type { PosterFormData } from '@/types/poster'

/**
 * ジョブ作成API
 * POST /api/jobs
 */
export async function POST(request: Request) {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // リクエストボディを取得
        const formData: PosterFormData = await request.json()

        // Job IDを生成
        const jobId = crypto.randomUUID()

        // Jobをストアに保存
        jobStore.create(jobId)

        console.log(`Created job: ${jobId}`)

        // バックグラウンドで画像生成開始（非同期）
        generatePosterAsync(jobId, formData).catch(error => {
            console.error(`Job ${jobId} failed:`, error)
            jobStore.update(jobId, {
                status: 'failed',
                error: error.message || 'Unknown error occurred'
            })
        })

        // すぐにJob IDを返却
        return NextResponse.json({ jobId })

    } catch (error) {
        console.error('Job creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create job' },
            { status: 500 }
        )
    }
}
