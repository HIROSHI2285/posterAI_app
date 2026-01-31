"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, UserPlus, Trash2, Shield, Ticket, RefreshCw, Search, Power, Plus, Minus, Save, UserCheck, UserX, Check, AlertCircle } from "lucide-react"
import type { AllowedUser } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function AdminUsersPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<AllowedUser[]>([])
    const [loading, setLoading] = useState(true)
    const [newEmail, setNewEmail] = useState("")
    const [newName, setNewName] = useState("")
    const [adding, setAdding] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [updating, setUpdating] = useState<string | null>(null)
    const [pendingCredits, setPendingCredits] = useState<Record<string, number>>({})
    const [pendingDailyLimits, setPendingDailyLimits] = useState<Record<string, number>>({})

    // Authentication Check
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
        }
    }, [status, router])

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users")
            if (response.status === 403) {
                alert("管理者権限が必要です")
                router.push("/generate")
                return
            }
            if (!response.ok) throw new Error("Failed to fetch users")
            const data = await response.json()
            setUsers(data.users)
            // Initialize pending settings
            const initialCredits: Record<string, number> = {}
            const initialLimits: Record<string, number> = {}
            data.users.forEach((u: AllowedUser) => {
                initialCredits[u.id] = u.one_time_credit || 0
                initialLimits[u.id] = u.daily_limit || 0
            })
            setPendingCredits(initialCredits)
            setPendingDailyLimits(initialLimits)
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchUsers()
    }, [session])

    // Add User
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) return

        setAdding(true)
        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() || null })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to add user")
            }

            setNewEmail("")
            setNewName("")
            fetchUsers()
        } catch (error) {
            alert(`追加失敗: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setAdding(false)
        }
    }

    // Update Daily Limit (Buttons)
    const handleUpdateLimit = async (id: string, newLimit: number) => {
        setUpdating(id)
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, daily_limit: newLimit })
            })
            await fetchUsers()
        } finally {
            setUpdating(null)
        }
    }

    // Update Daily Limit (Custom Input)
    const handleCustomLimitChange = (id: string, value: string) => {
        const val = parseInt(value)
        if (!isNaN(val) && val >= 0) {
            setPendingDailyLimits(prev => ({ ...prev, [id]: val }))
        } else if (value === "") {
            setPendingDailyLimits(prev => ({ ...prev, [id]: undefined }))
        }
    }

    const handleSaveCustomLimit = async (user: AllowedUser) => {
        const limitToSet = pendingDailyLimits[user.id]
        if (limitToSet === undefined || limitToSet === user.daily_limit) return

        setUpdating(user.id)
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, daily_limit: limitToSet })
            })
            await fetchUsers()
        } catch (error) { console.error(error) } finally { setUpdating(null) }
    }

    // Update Credits (Local State)
    const adjustPendingCredit = (id: string, delta: number) => {
        setPendingCredits(prev => {
            const current = prev[id] ?? users.find(u => u.id === id)?.one_time_credit ?? 0
            const next = Math.max(0, current + delta)
            return { ...prev, [id]: next }
        })
    }

    // Save Credits (API)
    const handleSaveCredit = async (user: AllowedUser) => {
        const creditToSet = pendingCredits[user.id]
        if (creditToSet === undefined) return
        if (creditToSet === user.one_time_credit) return // No change

        setUpdating(user.id)
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, one_time_credit: creditToSet })
            })
            await fetchUsers()
        } catch (error) {
            console.error(error)
            alert("クレジット更新エラー")
        } finally {
            setUpdating(null)
        }
    }

    // Toggle Active/Admin/Delete
    const handleToggleAdmin = async (user: AllowedUser) => {
        const newStatus = !user.is_admin
        const action = newStatus ? "管理者権限を付与" : "管理者権限を剥奪"

        if (user.email === session?.user?.email) {
            alert("自分自身の管理者権限は変更できません")
            return
        }

        if (!confirm(`${user.email} に${action}しますか？`)) return

        try {
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    target_email: user.email,
                    is_admin: newStatus
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to update admin status")
            }

            fetchUsers()
        } catch (error) {
            console.error(error)
            alert(`エラー: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    const handleToggleActive = async (user: AllowedUser) => {
        if (user.email === session?.user?.email) {
            alert("自分自身の有効/無効は変更できません")
            return
        }

        try {
            await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, is_active: !user.is_active })
            })
            fetchUsers()
        } catch (error) { console.error(error) }
    }

    const handleDeleteUser = async (user: AllowedUser) => {
        if (!confirm(`${user.email} を削除しますか？`)) return
        try {
            await fetch(`/api/admin/users?id=${user.id}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" })
            fetchUsers()
        } catch (error) { console.error(error) }
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#1a3d2e] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#ccff00] border-r-2 border-r-transparent"></div>
            </div>
        )
    }

    if (status === "unauthenticated") return null

    return (
        <div
            className="min-h-screen font-sans selection:bg-[#ccff00] selection:text-[#1a3d2e] pb-24 text-white relative isolate overflow-x-hidden"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
                backgroundColor: '#1a3d2e'
            }}
        >
            {/* Background Ambient Effects - Subtler */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 right-0 w-[80vw] h-[80vh] bg-[#ccff00]/5 blur-[150px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[60vw] h-[60vh] bg-[#1a3d2e]/80 blur-[100px] rounded-full transform -translate-x-1/3 translate-y-1/3" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="container mx-auto px-6 py-12 relative z-10 max-w-7xl">

                {/* Header Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/generate")}
                            className="text-white/80 hover:text-[#ccff00] hover:bg-white/5 rounded-full h-12 w-12 border border-white/10 backdrop-blur-sm transition-all"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight font-display text-white drop-shadow-sm mb-1.5">User Management</h1>
                            <p className="text-white/50 text-sm font-medium tracking-wider uppercase">ユーザー管理・権限設定</p>
                        </div>
                    </div>
                    <div className="group flex items-center gap-3 w-full md:w-auto bg-black/20 p-2 pl-4 rounded-xl border border-white/5 focus-within:border-[#ccff00]/30 focus-within:bg-black/30 transition-all backdrop-blur-md shadow-sm">
                        <Search className="h-4 w-4 text-white/40 group-focus-within:text-[#ccff00] transition-colors" />
                        <input
                            type="text"
                            placeholder="ユーザーを検索 (Email/Name)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 h-10 w-full md:w-64 px-1 font-medium"
                        />
                    </div>
                </div>

                {/* Invite Card - Clean & Wide */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-16 shadow-xl backdrop-blur-md relative overflow-hidden">
                    {/* Decorative subtle stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ccff00] opacity-80" />

                    <div className="relative z-10 flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-1 w-full space-y-2">
                            <Label className="text-xs font-bold text-[#ccff00] uppercase tracking-wider pl-1">メールアドレス (招待用)</Label>
                            <Input
                                value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="bg-black/20 border-white/10 h-12 rounded-lg text-white placeholder:text-white/20 focus:border-[#ccff00]/50 focus:bg-black/30 font-medium text-base px-4 transition-all"
                            />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                            <Label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">表示名 (任意)</Label>
                            <Input
                                value={newName} onChange={(e) => setNewName(e.target.value)}
                                placeholder="Taro Yamada"
                                className="bg-black/20 border-white/10 h-12 rounded-lg text-white placeholder:text-white/20 focus:border-[#ccff00]/50 focus:bg-black/30 font-medium text-base px-4 transition-all"
                            />
                        </div>
                        <Button
                            onClick={handleAddUser}
                            disabled={adding || !newEmail}
                            className="h-12 px-8 min-w-[140px] bg-[#ccff00] text-[#1a3d2e] font-bold text-base rounded-lg hover:bg-[#b3e600] transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
                        >
                            {adding ? "送信中..." : "招待する"}
                        </Button>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => {
                        const currentLimit = user.daily_limit;
                        const pendingLimit = pendingDailyLimits[user.id];
                        const isPendingDaily = pendingLimit !== undefined && pendingLimit !== currentLimit;

                        const currentCredit = user.one_time_credit || 0;
                        const pendingCredit = pendingCredits[user.id];
                        const isPendingCredit = pendingCredit !== undefined && pendingCredit !== currentCredit;

                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    "group relative flex flex-col justify-between min-h-[420px] border rounded-2xl p-6 transition-all duration-300 shadow-lg backdrop-blur-md overflow-hidden",
                                    user.is_active
                                        ? "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                        : "bg-red-900/10 border-red-500/20 opacity-70"
                                )}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/5 relative z-10 min-h-[80px]">
                                    <div className="flex items-start gap-3 w-full overflow-hidden">
                                        <div className={cn(
                                            "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold shadow-md ring-1 mt-1",
                                            user.is_admin
                                                ? "bg-[#ccff00] text-[#1a3d2e] ring-[#ccff00]/50"
                                                : "bg-white/10 text-white/70 ring-white/10"
                                        )}>
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-1">
                                            {/* Updated: break-all and whitespace-normal ensures email never overflows */}
                                            <p className="font-bold text-white text-base leading-snug break-all whitespace-normal mb-1" title={user.email}>
                                                {user.email}
                                            </p>
                                            <p className="text-xs text-white/40 font-medium">{user.name || "設定なし"}</p>
                                        </div>
                                    </div>
                                    {user.is_admin && (
                                        <div className="shrink-0 bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            ADMIN
                                        </div>
                                    )}
                                </div>

                                {/* Controls Body */}
                                <div className="space-y-6 flex-1 relative z-10">

                                    {/* Daily Limit Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-white/70 flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 text-[#ccff00]" /> 1日の生成上限
                                            </span>
                                            {/* Current Setting Display for Clarity */}
                                            <div className="text-sm font-mono text-white/90 bg-black/20 px-3 py-1 rounded border border-white/5">
                                                現在: <span className="font-bold text-[#ccff00] text-base">{currentLimit === 0 ? "無制限" : `${currentLimit}回`}</span>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                            <div className="grid grid-cols-4 gap-1.5 mb-2">
                                                {[0, 10, 30].map(limit => (
                                                    <button
                                                        key={limit}
                                                        onClick={() => handleUpdateLimit(user.id, limit)}
                                                        className={cn(
                                                            "h-9 rounded-lg text-xs font-bold transition-all border",
                                                            user.daily_limit === limit
                                                                ? "bg-[#ccff00] text-[#1a3d2e] border-[#ccff00] shadow-sm"
                                                                : "bg-transparent text-white/60 border-transparent hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        {limit === 0 ? "無制限" : limit}
                                                    </button>
                                                ))}
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="手動"
                                                        value={pendingLimit ?? ""}
                                                        onChange={(e) => handleCustomLimitChange(user.id, e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomLimit(user)}
                                                        className={cn(
                                                            "w-full h-9 border rounded-lg text-xs text-center focus:outline-none transition-all font-bold",
                                                            isPendingDaily
                                                                ? "bg-white/10 border-white/40 text-white ring-1 ring-[#ccff00]/50"
                                                                : "bg-transparent border-white/5 text-white/40 focus:border-[#ccff00]/50"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            {/* Save Button Slot */}
                                            {isPendingDaily && (
                                                <button
                                                    onClick={() => handleSaveCustomLimit(user)}
                                                    className="w-full h-8 rounded-lg bg-[#ccff00] text-[#1a3d2e] text-xs font-bold hover:bg-[#b3e600] transition-all flex items-center justify-center gap-1.5 animate-pulse"
                                                >
                                                    <Save className="h-3.5 w-3.5" /> 変更を保存 (Save Change)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ticket Section */}
                                    <div>
                                        <span className="text-xs font-bold text-white/50 flex items-center gap-2 mb-2">
                                            <Ticket className="h-3.5 w-3.5 text-[#ccff00]" /> 所持チケット (残回数)
                                        </span>

                                        <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center justify-between shadow-inner relative">

                                            <div className="flex items-center gap-4 flex-1 justify-center z-10">
                                                <button
                                                    onClick={() => adjustPendingCredit(user.id, -1)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-white/70"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>

                                                <div className="min-w-[60px] text-center">
                                                    <span className={cn(
                                                        "text-2xl font-mono font-bold tracking-tight transition-colors drop-shadow-sm",
                                                        isPendingCredit ? "text-[#ccff00]" : "text-white"
                                                    )}>
                                                        {pendingCredit ?? currentCredit}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => adjustPendingCredit(user.id, 1)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-white/70"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="pl-3 border-l border-white/10 z-10 min-w-[70px] flex justify-center">
                                                {isPendingCredit ? (
                                                    <button
                                                        onClick={() => handleSaveCredit(user)}
                                                        className="h-8 px-3 rounded-lg bg-[#ccff00] text-[#1a3d2e] text-[10px] font-bold hover:bg-[#b3e600] active:scale-95 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)] flex items-center gap-1 animate-pulse"
                                                    >
                                                        <Save className="h-3 w-3" /> SET
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-[9px] font-bold text-[#ccff00]/80 select-none opacity-50">
                                                        <Check className="h-4 w-4 mb-0.5" />
                                                        SAVED
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/5 relative z-10">
                                    <button
                                        onClick={() => handleToggleActive(user)}
                                        className={cn(
                                            "flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg transition-all border",
                                            user.is_active
                                                ? "bg-[#ccff00]/5 text-[#ccff00] border-[#ccff00]/20 hover:bg-[#ccff00]/10"
                                                : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                        )}
                                    >
                                        {user.is_active ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                                        {user.is_active ? "有効 (Active)" : "停止中 (Suspended)"}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleAdmin(user)}
                                            className={cn(
                                                "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                                                user.is_admin
                                                    ? "text-[#ccff00] bg-[#ccff00]/10 hover:bg-[#ccff00]/20 border border-[#ccff00]/20"
                                                    : "text-white/20 hover:text-white hover:bg-white/10 border border-transparent"
                                            )}
                                            title={user.is_admin ? "管理者権限を剥奪" : "管理者権限を付与"}
                                        >
                                            <Shield className="h-3.5 w-3.5" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            className="h-8 w-8 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                                            title="削除"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-32 flex flex-col items-center justify-center text-white/30">
                        <Search className="h-12 w-12 mb-4 opacity-50" />
                        <p className="font-display text-xl">No users found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
