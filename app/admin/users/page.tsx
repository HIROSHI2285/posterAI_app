"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Trash2, CheckCircle, XCircle } from "lucide-react"
import type { AllowedUser } from "@/lib/supabase"

export default function AdminUsersPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<AllowedUser[]>([])
    const [loading, setLoading] = useState(true)
    const [newEmail, setNewEmail] = useState("")
    const [newName, setNewName] = useState("")
    const [adding, setAdding] = useState(false)

    // 認証チェック
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
        }
    }, [status, router])

    // ユーザーリスト取得
    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users")
            if (response.status === 403) {
                // 管理者権限がない場合
                alert("管理者権限が必要です")
                router.push("/generate")
                return
            }
            if (!response.ok) {
                throw new Error("Failed to fetch users")
            }
            const data = await response.json()
            setUsers(data.users)
        } catch (error) {
            console.error("Error fetching users:", error)
            alert("ユーザーリストの取得に失敗しました")
            router.push("/generate")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) {
            fetchUsers()
        }
    }, [session])

    // ユーザー追加
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) {
            alert("メールアドレスを入力してください")
            return
        }

        setAdding(true)
        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newEmail.trim(),
                    name: newName.trim() || null
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to add user")
            }

            setNewEmail("")
            setNewName("")
            fetchUsers()
            alert("✅ ユーザーを追加しました")
        } catch (error) {
            console.error("Error adding user:", error)
            alert(`ユーザーの追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setAdding(false)
        }
    }

    // ユーザー削除
    const handleDeleteUser = async (user: AllowedUser) => {
        if (!confirm(`${user.email} を削除しますか？`)) {
            return
        }

        try {
            const response = await fetch(
                `/api/admin/users?id=${user.id}&email=${encodeURIComponent(user.email)}`,
                { method: "DELETE" }
            )

            const data = await response.json()

            if (!response.ok) {
                alert(`❌ ${data.error || 'Failed to delete user'}`)
                return
            }

            fetchUsers()
            alert("✅ ユーザーを削除しました")
        } catch (error) {
            console.error("Error deleting user:", error)
            alert("ユーザーの削除に失敗しました")
        }
    }

    // ユーザーの有効/無効切り替え
    const handleToggleActive = async (user: AllowedUser) => {
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    is_active: !user.is_active
                })
            })

            if (!response.ok) {
                throw new Error("Failed to update user")
            }

            fetchUsers()
        } catch (error) {
            console.error("Error toggling user:", error)
            alert("ユーザーの更新に失敗しました")
        }
    }

    // ユーザーの管理者権限切り替え
    const handleToggleAdmin = async (user: AllowedUser) => {
        try {
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    target_email: user.email,
                    is_admin: !user.is_admin
                })
            })

            const data = await response.json()

            if (!response.ok) {
                alert(`❌ ${data.error || 'Failed to update user admin status'}`)
                return
            }

            fetchUsers()
            alert(`✅ ${user.email} の権限を${!user.is_admin ? '管理者' : '一般ユーザー'}に変更しました`)
        } catch (error) {
            console.error("Error toggling admin:", error)
            alert("権限の変更に失敗しました")
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-green-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
            </div>
        )
    }

    if (status === "unauthenticated") {
        return null
    }

    return (
        <div className="min-h-screen bg-green-50">
            {/* ヘッダー */}
            <header className="sticky top-0 z-50 bg-white border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* 左側：ロゴとナビゲーション */}
                        <div className="flex items-center gap-6">
                            {/* 戻るボタン */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/generate")}
                                className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">戻る</span>
                            </Button>

                            {/* ロゴ */}
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => router.push('/')}
                            >
                                <img
                                    src="/posterai-logo.svg"
                                    alt="PosterAI"
                                    className="h-10 sm:h-12"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        </div>

                        {/* 右側：ユーザー情報 */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 hidden sm:flex">
                                {session?.user?.image && (
                                    <img
                                        src={session.user.image}
                                        alt={session.user?.name || 'User'}
                                        className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                                    />
                                )}
                                {session?.user?.email && (
                                    <span className="text-foreground font-medium max-w-[150px] truncate text-sm">
                                        {session.user.email.split('@')[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* ユーザー追加フォーム */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                新しいユーザーを追加
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <Label htmlFor="email">メールアドレス *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="name">名前（任意）</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="山田 太郎"
                                    />
                                </div>
                                <Button type="submit" disabled={adding}>
                                    {adding ? "追加中..." : "ユーザーを追加"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ユーザーリスト */}
                    <Card>
                        <CardHeader>
                            <CardTitle>登録ユーザー ({users.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{user.email}</p>
                                                {user.is_active ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-gray-400" />
                                                )}
                                                {user.is_admin ? (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                                        管理者
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                                                        一般ユーザー
                                                    </span>
                                                )}
                                            </div>
                                            {user.name && (
                                                <p className="text-sm text-gray-600">{user.name}</p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={user.is_admin ? "admin" : "user"}
                                                onChange={(e) => {
                                                    const newAdminStatus = e.target.value === "admin"
                                                    if (newAdminStatus !== user.is_admin) {
                                                        handleToggleAdmin(user)
                                                    }
                                                }}
                                                className={`h-10 w-[140px] rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${user.is_admin
                                                    ? 'bg-blue-100 border-blue-300 text-blue-900 focus-visible:ring-blue-500'
                                                    : 'bg-gray-100 border-gray-300 text-gray-900 focus-visible:ring-gray-500'
                                                    }`}
                                            >
                                                <option value="admin">管理者</option>
                                                <option value="user">一般ユーザー</option>
                                            </select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleActive(user)}
                                            >
                                                {user.is_active ? "無効化" : "有効化"}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        登録ユーザーがいません
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
