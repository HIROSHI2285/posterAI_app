import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { jobStore } from '@/lib/job-store-supabase'
import { rateLimiter } from '@/lib/rate-limiter'
import { getUserDailyLimit } from '@/lib/supabase'
import { validatePosterGeneration } from '@/lib/validations/poster'
import { generatePosterAsync } from '../generate-poster/async'
import type { PosterFormData } from '@/types/poster'

// Vercel Pro: 60秒まで延長可能（Hobbyプランでは無効）
export const maxDuration = 60

/**
 * ジョブ作成API
 * POST /api/jobs
 * 
 * Next.js after() APIを使用してレスポンス後もバックグラウンド処理を継続
 */
export async function POST(request: Request) {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions)
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // レート制限チェック（ユーザーのdaily_limitを取得）
        const userLimit = await getUserDailyLimit(session.user.email)
        const rateLimitKey = `${session.user.email}:generate`;
        const { allowed, remaining, resetAt } = rateLimiter.check(rateLimitKey, userLimit)

        if (!allowed) {
            const resetDate = new Date(resetAt)
            return NextResponse.json(
                {
                    error: '本日の生成回数上限に達しました。',
                    message: `リセット時刻: ${resetDate.toLocaleString('ja-JP')}`,
                    resetAt
                },
                { status: 429 }
            )
        }

        // リクエストボディを取得
        const body = await request.json()

        // Zodバリデーション
        const validation = validatePosterGeneration(body)

        if (!validation.success) {
            const errorDetails = validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message
            }))

            console.error('❌ バリデーションエラー:', JSON.stringify(errorDetails, null, 2))
            console.error('受信データ:', JSON.stringify(body, null, 2))

            return NextResponse.json(
                {
                    error: '入力データが不正です',
                    details: errorDetails
                },
                { status: 400 }
            )
        }

        const formData = validation.data

        // Job IDを生成
        const jobId = crypto.randomUUID()

        // Jobをストアに保存（Supabaseに非同期で保存）
        await jobStore.create(jobId, session.user.id!)

        console.log(`Created job: ${jobId} for user: ${session.user.email} (${remaining} remaining today)`)

        // after() API: レスポンス返却後もバックグラウンドで処理を継続
        // これによりVercel Hobbyプランでもタイムアウトを回避できる
        after(async () => {
            try {
                console.log(`[after] Starting background job: ${jobId}`)
                await generatePosterAsync(jobId, formData as any)
                console.log(`[after] Completed background job: ${jobId}`)
            } catch (error) {
                console.error(`[after] Job ${jobId} failed:`, error)
                await jobStore.update(jobId, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                })
            }
        })

        // すぐにJob IDと残り回数を返却
        return NextResponse.json({
            jobId,
            remaining,
            resetAt
        })

    } catch (error) {
        console.error('Job creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create job' },
            { status: 500 }
        )
    }
}

