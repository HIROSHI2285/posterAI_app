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
    is_admin: boolean
    daily_limit: number
    one_time_credit: number
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
        console.log('🔍 [Supabase] Checking access for email:', email)

        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('is_active')
            .ilike('email', email)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`⚠️ [Supabase] User not in allow-list: ${email}`)
                return false
            }
            console.error('❌ [Supabase] Error checking user access:', error)
            return false
        }

        if (!data) {
            console.warn(`⚠️ [Supabase] No data returned for: ${email}`)
            return false
        }

        console.log(`✅ [Supabase] User found:`, { email, is_active: data.is_active })
        return data.is_active === true
    } catch (error) {
        console.error('❌ [Supabase] Exception:', error)
        return false
    }
}

/**
 * ユーザーが管理者権限を持っているかチェック
 * @param email ユーザーのメールアドレス
 * @returns 管理者権限がある場合true
 */
export async function checkUserAdmin(email: string): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('is_admin, is_active')
            .eq('email', email)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`User not found: ${email}`)
                return false
            }
            console.error('Error checking admin status:', error)
            return false
        }

        if (!data) {
            return false
        }

        return data.is_active === true && data.is_admin === true
    } catch (error) {
        console.error('Error checking admin status:', error)
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
 * @param id - 削除するユーザーのID
 * @param targetEmail - 削除するユーザーのメールアドレス
 * @param adminEmail - 操作を実行する管理者のメールアドレス
 */
export async function removeAllowedUser(
    id: string,
    targetEmail: string,
    adminEmail: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 対象ユーザーの情報を取得
        const { data: userData } = await supabaseAdmin
            .from('allowed_users')
            .select('is_admin, is_active')
            .eq('id', id)
            .single()

        // 自己削除の場合
        if (targetEmail === adminEmail) {
            // 自分が管理者で、かつ最後の管理者の場合は削除不可
            if (userData?.is_admin && userData?.is_active) {
                const adminCount = await countActiveAdmins()
                if (adminCount <= 1) {
                    return {
                        success: false,
                        error: '最後の管理者は自分を削除できません'
                    }
                }
                // 他に管理者がいれば自己削除を許可
            }
        }

        // 対象ユーザーが管理者かチェック（他者を削除する場合）
        if (targetEmail !== adminEmail && userData?.is_admin && userData?.is_active) {
            const adminCount = await countActiveAdmins()
            if (adminCount <= 1) {
                return {
                    success: false,
                    error: '最後の管理者を削除することはできません'
                }
            }
        }

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

/**
 * アクティブな管理者の数を取得
 */
async function countActiveAdmins(): Promise<number> {
    try {
        const { count, error } = await supabaseAdmin
            .from('allowed_users')
            .select('*', { count: 'exact', head: true })
            .eq('is_admin', true)
            .eq('is_active', true)

        if (error) {
            console.error('Error counting admins:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('Error counting admins:', error)
        return 0
    }
}

/**
 * ユーザーの管理者権限を切り替え（管理画面用）
 * @param id - 対象ユーザーのID
 * @param targetEmail - 対象ユーザーのメールアドレス
 * @param adminEmail - 操作を実行する管理者のメールアドレス
 * @param isAdmin - 設定する管理者フラグ
 */
export async function toggleUserAdmin(
    id: string,
    targetEmail: string,
    adminEmail: string,
    isAdmin: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        // 自己権限変更の防止
        if (targetEmail === adminEmail) {
            return {
                success: false,
                error: '自分自身の権限は変更できません'
            }
        }

        // 最後の管理者を削除しようとしている場合
        if (!isAdmin) {
            const adminCount = await countActiveAdmins()
            if (adminCount <= 1) {
                return {
                    success: false,
                    error: '最後の管理者を削除することはできません'
                }
            }
        }

        const { error } = await supabaseAdmin
            .from('allowed_users')
            .update({ is_admin: isAdmin })
            .eq('id', id)

        if (error) {
            console.error('Error toggling user admin status:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error toggling user admin status:', error)
        return { success: false, error: String(error) }
    }
}


/**
 * ユーザーのdaily_limitを取得
 * @param email ユーザーのメールアドレス
 * @returns daily_limit (デフォルト: 30)
 */
export async function getUserDailyLimit(email: string): Promise<number> {
    try {
        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('daily_limit')
            .eq('email', email)
            .single()

        if (error || !data) {
            console.warn(`Daily limit not found for ${email}, using default: 30`)
            return 30
        }

        return data.daily_limit || 30
    } catch (error) {
        console.error('Error getting daily limit:', error)
        return 30
    }
}

/**
 * ユーザーのdaily_limitを更新
 * @param id ユーザーID
 * @param newLimit 新しい上限値 (1-9999)
 */
export async function updateUserDailyLimit(
    id: string,
    newLimit: number
): Promise<{ success: boolean; error?: string }> {
    try {
        if (newLimit < 0 || newLimit > 9999) {
            return { success: false, error: 'Limit must be between 0 and 9999' }
        }

        const { error } = await supabaseAdmin
            .from('allowed_users')
            .update({ daily_limit: newLimit })
            .eq('id', id)

        if (error) {
            console.error('Error updating daily limit:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating daily limit:', error)
        return { success: false, error: String(error) }
    }
}


/**
 * ユーザーのone_time_creditを取得
 */
export async function getUserOneTimeCredit(email: string): Promise<number> {
    try {
        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('one_time_credit')
            .eq('email', email)
            .single()

        if (error || !data) {
            return 0
        }

        return data.one_time_credit || 0
    } catch (error) {
        console.error('Error getting one time credit:', error)
        return 0
    }
}

/**
 * ユーザーのone_time_creditを更新（管理者用：絶対値指定）
 */
export async function updateUserOneTimeCredit(
    id: string,
    amount: number
): Promise<{ success: boolean; error?: string }> {
    try {
        if (amount < 0) {
            return { success: false, error: 'Credit cannot be negative' }
        }

        const { error } = await supabaseAdmin
            .from('allowed_users')
            .update({ one_time_credit: amount })
            .eq('id', id)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

/**
 * ユーザーのone_time_creditを消費（API用：-1する）
 */
export async function decrementUserOneTimeCredit(email: string): Promise<boolean> {
    try {
        // 現在のクレジットを取得
        const { data, error } = await supabaseAdmin
            .from('allowed_users')
            .select('one_time_credit')
            .eq('email', email)
            .single()

        if (error || !data || (data.one_time_credit || 0) <= 0) {
            return false
        }

        const newCredit = data.one_time_credit - 1

        // 更新
        const { error: updateError } = await supabaseAdmin
            .from('allowed_users')
            .update({ one_time_credit: newCredit })
            .eq('email', email)

        if (updateError) {
            console.error('Error decrementing credit:', updateError)
            return false
        }

        return true
    } catch (error) {
        console.error('Error decrementing credit:', error)
        return false
    }
}
