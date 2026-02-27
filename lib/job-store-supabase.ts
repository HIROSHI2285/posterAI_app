/**
 * Supabaseベースのジョブストア
 * Vercelサーバーレス環境でもジョブ状態を永続化
 */

import { supabaseAdmin } from './supabase'

export interface PosterJob {
    id: string
    userId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    imageUrl?: string
    error?: string
    createdAt: number
    updatedAt: number
    metadata?: any
}

// Supabaseのカラム名（snake_case）からTypeScriptのプロパティ名（camelCase）へ変換
interface SupabaseJobRow {
    id: string
    user_id: string
    status: string
    progress: number
    image_url: string | null
    error: string | null
    created_at: string
    updated_at: string
    metadata: any | null
}

function rowToJob(row: SupabaseJobRow): PosterJob {
    return {
        id: row.id,
        userId: row.user_id,
        status: row.status as PosterJob['status'],
        progress: row.progress,
        imageUrl: row.image_url || undefined,
        error: row.error || undefined,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        metadata: row.metadata || undefined
    }
}

class SupabaseJobStore {
    /**
     * 新しいジョブを作成
     */
    async create(id: string, userId: string): Promise<PosterJob> {
        const { data, error } = await supabaseAdmin
            .from('jobs')
            .insert({
                id,
                user_id: userId,
                status: 'pending',
                progress: 0
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to create job:', error)
            throw new Error(`Failed to create job: ${error.message}`)
        }

        console.log(`✅ Job created in Supabase: ${id}`)
        return rowToJob(data)
    }

    /**
     * ジョブを取得
     */
    async get(id: string): Promise<PosterJob | undefined> {
        const { data, error } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                console.warn(`Job not found: ${id}`)
                return undefined
            }
            console.error('Failed to get job:', error)
            return undefined
        }

        return rowToJob(data)
    }

    /**
     * ジョブを更新
     */
    async update(id: string, updates: Partial<PosterJob>): Promise<void> {
        // camelCase → snake_case 変換
        const supabaseUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        }

        if (updates.status !== undefined) supabaseUpdates.status = updates.status
        if (updates.progress !== undefined) supabaseUpdates.progress = updates.progress
        if (updates.imageUrl !== undefined) supabaseUpdates.image_url = updates.imageUrl
        if (updates.error !== undefined) supabaseUpdates.error = updates.error
        if (updates.metadata !== undefined) supabaseUpdates.metadata = updates.metadata

        const { error } = await supabaseAdmin
            .from('jobs')
            .update(supabaseUpdates)
            .eq('id', id)

        if (error) {
            console.error('Failed to update job:', error)
            throw new Error(`Failed to update job: ${error.message}`)
        }

        console.log(`✅ Job updated: ${id}`, updates)
    }

    /**
     * 古いジョブを削除（1時間以上前）
     */
    async cleanup(): Promise<void> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { error, count } = await supabaseAdmin
            .from('jobs')
            .delete()
            .lt('created_at', oneHourAgo)

        if (error) {
            console.error('Failed to cleanup jobs:', error)
            return
        }

        if (count && count > 0) {
            console.log(`🧹 Cleaned up ${count} old jobs`)
        }
    }
}

// シングルトンインスタンス
export const jobStore = new SupabaseJobStore()
