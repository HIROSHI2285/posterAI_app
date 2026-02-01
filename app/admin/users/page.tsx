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
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
        } else if (status === "authenticated" && session?.user?.email !== "hiroshi.yamaguchi0510@gmail.com") {
            router.push("/")
        } else if (status === "authenticated") {
            fetchUsers()
        }
    }, [status, session, router])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/users")
            if (res.ok) {
                const data = await res.json()
                setUsers(Array.isArray(data) ? data : (data.users || []))
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail) return

        setAdding(true)
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newEmail, name: newName || newEmail.split("@")[0] }),
            })
            if (res.ok) {
                setNewEmail("")
                setNewName("")
                fetchUsers()
            }
        } catch (error) {
            console.error("Failed to add user:", error)
        } finally {
            setAdding(false)
        }
    }

    const handleDeleteUser = async (user: AllowedUser) => {
        if (!confirm(`${user.email} を削除してもよろしいですか？`)) return

        try {
            const res = await fetch(`/api/admin/users?id=${user.id}&email=${user.email}`, {
                method: "DELETE",
            })
            if (res.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error("Failed to delete user:", error)
        }
    }

    const handleToggleStatus = async (user: AllowedUser) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
            })
            if (res.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error("Failed to update user:", error)
        }
    }

    const handleUpdateLimit = async (user: AllowedUser, limit: number) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, daily_limit: limit }),
            })
            if (res.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error("Failed to update limit:", error)
        }
    }

    const handleUpdateTickets = async (user: AllowedUser, delta: number) => {
        const newCredit = Math.max(0, (user.one_time_credit || 0) + delta)
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, one_time_credit: newCredit }),
            })
            if (res.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error("Failed to update tickets:", error)
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#1c2e26] flex items-center justify-center">
                <RefreshCw className="h-10 w-10 text-[#a3ff12] animate-spin" />
            </div>
        )
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#1c2e26] text-white font-sans selection:bg-[#a3ff12] selection:text-black relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            {/* Main Content Container (relative to stay above grid) */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push("/")}
                            className="rounded-full bg-white/5 border-white/10 text-white/60 hover:text-white h-12 w-12"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
                            <p className="text-sm text-white/40 mt-1">ユーザー管理・権限設定</p>
                        </div>
                    </div>

                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                        <Input
                            placeholder="ユーザーを検索 (Email/Name)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 bg-white/5 border-none h-16 rounded-2xl text-lg placeholder:text-white/20 focus:ring-0"
                        />
                    </div>
                </div>

                {/* Invite/Add User Banner */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 mb-12 border-l-[6px] border-l-[#a3ff12]">
                    <form onSubmit={handleAddUser} className="flex flex-col md:flex-row items-end gap-6 text-sm">
                        <div className="flex-1 space-y-3">
                            <Label className="text-[#a3ff12] font-bold">メールアドレス (招待用)</Label>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="bg-black/20 border-white/10 h-14 rounded-xl text-lg"
                                required
                            />
                        </div>
                        <div className="flex-1 space-y-3">
                            <Label className="text-white/40 font-bold">表示名 (任意)</Label>
                            <Input
                                type="text"
                                placeholder="Taro Yamada"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-black/20 border-white/10 h-14 rounded-xl text-lg"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={adding}
                            className="bg-white/20 hover:bg-white/30 text-white/80 font-bold h-14 px-12 rounded-xl text-lg"
                        >
                            {adding ? <RefreshCw className="h-6 w-6 animate-spin" /> : "招待する"}
                        </Button>
                    </form>
                </div>

                {/* User Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-8">

                            {/* Card Header: Avatar & Info */}
                            <div className="flex items-start gap-4">
                                <div className="h-14 w-14 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-bold text-xl">
                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-xl font-bold break-all leading-tight">{user.email}</h3>
                                        {user.is_admin && (
                                            <span className="bg-[#ccff00]/20 text-[#ccff00] text-[10px] font-black px-2 py-0.5 rounded border border-[#ccff00]/30 uppercase">ADMIN</span>
                                        )}
                                    </div>
                                    <p className="text-white/40 text-xs mt-1">設定なし</p>
                                </div>
                            </div>

                            {/* Section: Daily Limit */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                                        <RefreshCw className="h-5 w-5 text-[#a3ff12]" />
                                        <span>1日の生成上限</span>
                                    </div>
                                    <div className="bg-black/40 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/5">
                                        <span className="text-white/40 text-xs font-bold">現在:</span>
                                        <span className="text-[#a3ff12] font-black">{user.daily_limit === 9999 ? "無制限" : `${user.daily_limit}回`}</span>
                                    </div>
                                </div>
                                <div className="bg-black/40 p-1.5 rounded-2xl flex items-center gap-1 border border-white/5">
                                    {[
                                        { label: "無制限", value: 9999 },
                                        { label: "10", value: 10 },
                                        { label: "30", value: 30 },
                                        { label: "100", value: 100 }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleUpdateLimit(user, opt.value)}
                                            className={cn(
                                                "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                                                user.daily_limit === opt.value
                                                    ? "bg-white/10 text-white ring-1 ring-white/20"
                                                    : "text-white/20 hover:text-white/40"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Tickets */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                                    <Ticket className="h-5 w-5 text-[#a3ff12]" />
                                    <span>所持チケット (残回数)</span>
                                </div>
                                <div className="bg-black/40 p-1.5 rounded-2xl flex items-center border border-white/5">
                                    <div className="flex-1 flex items-center justify-center gap-6 py-2 px-4 border-r border-white/10">
                                        <button
                                            onClick={() => handleUpdateTickets(user, -1)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                                        >
                                            <Minus className="h-5 w-5 text-white/60" />
                                        </button>
                                        <span className="text-3xl font-black">{user.one_time_credit || 0}</span>
                                        <button
                                            onClick={() => handleUpdateTickets(user, 1)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                                        >
                                            <Plus className="h-5 w-5 text-white/60" />
                                        </button>
                                    </div>
                                    <div className="px-6 flex flex-col items-center gap-1 opacity-60">
                                        <Check className="h-6 w-6 text-[#a3ff12]" />
                                        <span className="text-[10px] font-black uppercase text-[#a3ff12]">SAVED</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Status & Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <button
                                    onClick={() => handleToggleStatus(user)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl text-sm font-black italic flex items-center gap-2",
                                        user.is_active ? "text-[#a3ff12] hover:bg-[#a3ff12]/10" : "text-red-400 hover:bg-red-400/10"
                                    )}
                                >
                                    <div className={cn("h-2.5 w-2.5 rounded-full", user.is_active ? "bg-[#a3ff12]" : "bg-red-400")} />
                                    {user.is_active ? "有効 (Active)" : "無効 (Inactive)"}
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-[#a3ff12] hover:bg-white/10 transition-colors border border-white/5"
                                        title="管理者権限を切り替え"
                                        onClick={() => {/* Implement admin toggle if needed later */ }}
                                    >
                                        <Shield className="h-5 w-5" />
                                    </button>
                                    <button
                                        className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-red-500 hover:bg-white/10 transition-colors border border-white/5"
                                        onClick={() => handleDeleteUser(user)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
