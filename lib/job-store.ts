/**
 * ジョブストア - ポスター生成ジョブの管理
 * メモリ内でジョブを管理（サーバー再起動で消失）
 */

export interface PosterJob {
    id: string
    userId: string // ユーザーID（所有者）
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number // 0-100
    imageUrl?: string
    error?: string
    createdAt: number
    updatedAt: number
}

class JobStore {
    private jobs = new Map<string, PosterJob>()

    /**
     * 新しいジョブを作成
     */
    create(id: string, userId: string): PosterJob {
        const job: PosterJob = {
            id,
            userId,
            status: 'pending',
            progress: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        this.jobs.set(id, job)
        return job
    }

    /**
     * ジョブを取得
     */
    get(id: string): PosterJob | undefined {
        return this.jobs.get(id)
    }

    /**
     * ジョブを更新
     */
    update(id: string, updates: Partial<PosterJob>): void {
        const job = this.jobs.get(id)
        if (!job) {
            throw new Error(`Job ${id} not found`)
        }

        Object.assign(job, updates, { updatedAt: Date.now() })
        this.jobs.set(id, job)
    }

    /**
     * 古いジョブを削除（1時間以上前）
     */
    cleanup(): void {
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        for (const [id, job] of this.jobs) {
            if (job.createdAt < oneHourAgo) {
                this.jobs.delete(id)
                console.log(`Cleaned up old job: ${id}`)
            }
        }
    }

    /**
     * すべてのジョブ数を取得（デバッグ用）
     */
    size(): number {
        return this.jobs.size
    }
}

// シングルトンインスタンス（HMR対策）
// 開発環境でHMRが発生してもジョブが消えないようにglobalThisに保存
const globalForJobStore = globalThis as unknown as {
    jobStore: JobStore | undefined
}

export const jobStore = globalForJobStore.jobStore ?? new JobStore()

if (process.env.NODE_ENV !== 'production') {
    globalForJobStore.jobStore = jobStore
}

// 定期的なクリーンアップ（1時間毎）
if (typeof global !== 'undefined') {
    setInterval(() => {
        jobStore.cleanup()
    }, 60 * 60 * 1000)
}

