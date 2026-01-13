"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2 } from "lucide-react"

interface PosterPreviewProps {
    imageUrl?: string
    isGenerating: boolean
    onRegenerate?: () => void
}

export function PosterPreview({ imageUrl, isGenerating, onRegenerate }: PosterPreviewProps) {
    const [isEditMode, setIsEditMode] = useState(false)
    const [editPrompt, setEditPrompt] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)

    // 表示する画像（編集済みがあればそちらを優先）
    const displayImageUrl = editedImageUrl || imageUrl

    const handleDownload = () => {
        if (!displayImageUrl) return

        const link = document.createElement("a")
        link.href = displayImageUrl
        link.download = `poster-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleEdit = async () => {
        if (!displayImageUrl || !editPrompt.trim()) return

        setIsEditing(true)
        try {
            const response = await fetch('/api/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: displayImageUrl,
                    editPrompt: editPrompt.trim()
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    setIsEditMode(false)
                    setEditPrompt("")
                } else {
                    alert('編集に失敗しました: 画像が生成されませんでした')
                }
            } else {
                const errorData = await response.json()
                alert(`編集に失敗しました: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Edit error:', error)
            alert('編集中にエラーが発生しました')
        } finally {
            setIsEditing(false)
        }
    }

    const handleCancelEdit = () => {
        setIsEditMode(false)
        setEditPrompt("")
    }

    return (
        <Card className="border border-gray-300 bg-white">
            <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                <CardTitle className="text-base font-semibold">プレビュー</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {isGenerating || isEditing ? (
                    <div className="flex flex-col items-center justify-center min-h-[550px] bg-gray-50 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-sm text-muted-foreground">
                            {isEditing ? '画像を編集中...' : '画像を生成中...'}
                        </p>
                    </div>
                ) : displayImageUrl ? (
                    <div className="space-y-3">
                        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                            <img
                                src={displayImageUrl}
                                alt="Generated poster"
                                className="w-full h-auto"
                            />
                            {editedImageUrl && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                    編集済み
                                </div>
                            )}
                        </div>

                        {/* 編集モード */}
                        {isEditMode ? (
                            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Edit3 className="h-4 w-4" />
                                    <span className="text-sm font-medium">画像編集モード</span>
                                </div>
                                <Textarea
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="修正内容を入力してください&#10;例: 背景を夕焼けに変更してください&#10;例: 右下にロゴを追加してください&#10;例: 文字の色を赤に変更してください"
                                    rows={4}
                                    className="bg-white"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleEdit}
                                        disabled={!editPrompt.trim()}
                                        size="sm"
                                        className="flex-1"
                                        style={{ backgroundColor: '#48a772', color: 'white' }}
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        編集を適用
                                    </Button>
                                    <Button
                                        onClick={handleCancelEdit}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        キャンセル
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setIsEditMode(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    編集
                                </Button>
                                <Button
                                    onClick={onRegenerate}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    再生成
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                    style={{ backgroundColor: '#48a772', color: 'white' }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    ダウンロード
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[550px] bg-gray-50 rounded-lg">
                        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">プレビューはここに表示されます</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
