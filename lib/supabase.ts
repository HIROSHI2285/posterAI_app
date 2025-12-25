import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase Admin Client
 * Service Role権限でデータベースにアクセス
 * サーバー側のみで使用（クライアント側では使用しない）
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

/**
 * AllowedUserテーブルの型定義
 */
export interface AllowedUser {
    id: string
    email: string
    name: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

/**
 * ユーザーがアクセス許可されているかチェック
 * @param email ユーザーのメールアドレス
 * @returns アクセス許可されている場合true
 */
export async function checkUserAccess(email: string): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('is_active')
            .eq('email', email)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // ユーザーが見つからない
                console.warn(`User not in allow-list: ${email}`)
                return false
            }
            console.error('Error checking user access:', error)
            return false
        }

        if (!data) {
            console.warn(`User not in allow-list: ${email}`)
            return false
        }

        return data.is_active === true
    } catch (error) {
        console.error('Error checking user access:', error)
        return false
    }
}

/**
 * 全ての許可ユーザーを取得（管理画面用）
 */
export async function getAllowedUsers(): Promise<AllowedUser[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching allowed users:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching allowed users:', error)
        return []
    }
}

/**
 * 新しいユーザーを追加（管理画面用）
 */
export async function addAllowedUser(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from('allowed_users')
            .insert([
                {
                    email,
                    name: name || null,
                    is_active: true
                }
            ])

        if (error) {
            console.error('Error adding allowed user:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error adding allowed user:', error)
        return { success: false, error: String(error) }
    }
}

/**
 * ユーザーを削除（管理画面用）
 */
export async function removeAllowedUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from('allowed_users')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error removing allowed user:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error removing allowed user:', error)
        return { success: false, error: String(error) }
    }
}

/**
 * ユーザーの有効/無効を切り替え（管理画面用）
 */
export async function toggleUserActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from('allowed_users')
            .update({ is_active: isActive })
            .eq('id', id)

        if (error) {
            console.error('Error toggling user active status:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error toggling user active status:', error)
        return { success: false, error: String(error) }
    }
}
