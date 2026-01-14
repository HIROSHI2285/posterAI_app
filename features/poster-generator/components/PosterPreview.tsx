"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2, ImagePlus, Upload } from "lucide-react"

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

    // 画像挿入モード用の状態（複数画像対応）
    const [isInsertMode, setIsInsertMode] = useState(false)
    const [insertImages, setInsertImages] = useState<{ data: string, name: string }[]>([])
    const [insertPrompt, setInsertPrompt] = useState("")
    const [isInserting, setIsInserting] = useState(false)
    const insertFileInputRef = useRef<HTMLInputElement>(null)
    const MAX_INSERT_IMAGES = 5

    // アップスケール状態
    const [isUpscaling, setIsUpscaling] = useState(false)

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

    // 高画質ダウンロード（2倍アップスケール）
    const handleDownloadHQ = async () => {
        if (!displayImageUrl) return

        setIsUpscaling(true)
        try {
            const response = await fetch('/api/upscale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: displayImageUrl,
                    scale: 2
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    const link = document.createElement("a")
                    link.href = data.imageUrl
                    link.download = `poster-hq-${Date.now()}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                } else {
                    alert('アップスケールに失敗しました')
                }
            } else {
                const errorData = await response.json()
                alert(`アップスケールに失敗しました: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Upscale error:', error)
            alert('アップスケール中にエラーが発生しました')
        } finally {
            setIsUpscaling(false)
        }
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
                    editPrompt: editPrompt.trim(),
                    // 画像が添付されていれば同時に挿入
                    insertImagesData: insertImages.length > 0 ? insertImages.map(img => img.data) : undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    setIsEditMode(false)
                    setEditPrompt("")
                    setInsertImages([]) // 挿入画像もクリア
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
        setInsertImages([]) // 挿入画像もクリア
    }

    // 画像挿入関連のハンドラー（複数画像対応）
    const handleInsertImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            const remainingSlots = MAX_INSERT_IMAGES - insertImages.length
            const filesToProcess = Array.from(files).slice(0, remainingSlots)

            filesToProcess.forEach(file => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    setInsertImages(prev => [
                        ...prev,
                        { data: event.target?.result as string, name: file.name }
                    ])
                }
                reader.readAsDataURL(file)
            })
        }
        // 入力をリセット（同じファイルを再選択可能に）
        if (insertFileInputRef.current) {
            insertFileInputRef.current.value = ''
        }
    }

    const removeInsertImage = (index: number) => {
        setInsertImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleInsert = async () => {
        if (!displayImageUrl || insertImages.length === 0 || !insertPrompt.trim()) return

        setIsInserting(true)
        try {
            const response = await fetch('/api/insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseImageData: displayImageUrl,
                    insertImagesData: insertImages.map(img => img.data),
                    insertPrompt: insertPrompt.trim()
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    setIsInsertMode(false)
                    setInsertImages([])
                    setInsertPrompt("")
                } else {
                    alert('画像挿入に失敗しました: 画像が生成されませんでした')
                }
            } else {
                const errorData = await response.json()
                alert(`画像挿入に失敗しました: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Insert error:', error)
            alert('画像挿入中にエラーが発生しました')
        } finally {
            setIsInserting(false)
        }
    }

    const handleCancelInsert = () => {
        setIsInsertMode(false)
        setInsertImages([])
        setInsertPrompt("")
    }

    return (
        <Card className="border border-gray-300 bg-white">
            <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                <CardTitle className="text-base font-semibold">プレビュー</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {isGenerating || isEditing || isInserting ? (
                    <div className="flex flex-col items-center justify-center min-h-[550px] bg-gray-50 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-sm text-muted-foreground">
                            {isInserting ? '画像を挿入中...' : isEditing ? '画像を編集中...' : '画像を生成中...'}
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

                        {/* 編集モード（画像挿入も同時対応） */}
                        {isEditMode ? (
                            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Edit3 className="h-4 w-4" />
                                    <span className="text-sm font-medium">編集モード</span>
                                </div>

                                <Textarea
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="修正内容を入力してください0;&#10;例: 背景を夕焼けに変更してください&#10;例: 文字の色を赤に変更してください&#10;例: 右下にロゴを配置してください"
                                    rows={6}
                                    className="bg-white text-sm"
                                />

                                {/* 画像追加オプション（任意） */}
                                <input
                                    ref={insertFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleInsertImageUpload}
                                    className="hidden"
                                />

                                {insertImages.length > 0 && (
                                    <div className="p-2 bg-white rounded border">
                                        <div className="text-xs text-gray-500 mb-1">追加画像（最大5枚）</div>
                                        <div className="space-y-1">
                                            {insertImages.map((img, index) => (
                                                <div key={index} className="flex items-center gap-2 p-1 bg-gray-50 rounded text-xs">
                                                    <img src={img.data} alt={`${index + 1}`} className="w-8 h-8 object-contain rounded" />
                                                    <span className="flex-1 truncate">{img.name}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => removeInsertImage(index)} className="h-6 w-6 p-0">
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ボタンエリア: 左に画像追加、右に編集+キャンセル */}
                                <div className="flex gap-2">
                                    {/* 左側: 画像追加ボタン */}
                                    <div className="flex-1">
                                        {insertImages.length < MAX_INSERT_IMAGES && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-full min-h-[72px]"
                                                onClick={() => insertFileInputRef.current?.click()}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <Upload className="h-5 w-5" />
                                                    <span className="text-xs">{insertImages.length === 0 ? '画像追加' : `追加(${insertImages.length}/5)`}</span>
                                                </div>
                                            </Button>
                                        )}
                                    </div>

                                    {/* 右側: 編集+キャンセル（縦並び） */}
                                    <div className="flex-1 space-y-2">
                                        <Button
                                            onClick={handleEdit}
                                            disabled={!editPrompt.trim()}
                                            size="sm"
                                            className="w-full"
                                            style={{ backgroundColor: '#48a772', color: 'white' }}
                                        >
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            {insertImages.length > 0 ? '編集+挿入' : '編集を適用'}
                                        </Button>
                                        <Button
                                            onClick={handleCancelEdit}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            キャンセル
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : isInsertMode ? (
                            /* 画像挿入モード */
                            <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 text-purple-700">
                                    <ImagePlus className="h-4 w-4" />
                                    <span className="text-sm font-medium">画像挿入モード（最大5枚）</span>
                                </div>

                                {/* 挿入画像アップロード */}
                                <div className="space-y-2">
                                    <input
                                        ref={insertFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleInsertImageUpload}
                                        className="hidden"
                                    />

                                    {/* アップロード済み画像リスト */}
                                    {insertImages.length > 0 && (
                                        <div className="space-y-2">
                                            {insertImages.map((img, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                                                    <img src={img.data} alt={`Insert ${index + 1}`} className="w-10 h-10 object-contain rounded" />
                                                    <span className="text-xs flex-1 truncate">{img.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeInsertImage(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 追加ボタン */}
                                    {insertImages.length < MAX_INSERT_IMAGES && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => insertFileInputRef.current?.click()}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            {insertImages.length === 0 ? '挿入する画像をアップロード' : `画像を追加（あと${MAX_INSERT_IMAGES - insertImages.length}枚）`}
                                        </Button>
                                    )}
                                </div>

                                {/* 配置指示 */}
                                <Textarea
                                    value={insertPrompt}
                                    onChange={(e) => setInsertPrompt(e.target.value)}
                                    placeholder="配置場所や挿入方法を指定してください&#10;【挿入】&#10;例: 右下に自然に配置してください&#10;例: 中央上部にロゴとして配置&#10;【差し替え】&#10;例: 現在の人物をこの画像に差し替え&#10;例: 背景をこの画像に置き換え"
                                    rows={4}
                                    className="bg-white"
                                />

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleInsert}
                                        disabled={insertImages.length === 0 || !insertPrompt.trim()}
                                        size="sm"
                                        className="flex-1"
                                        style={{ backgroundColor: '#9333ea', color: 'white' }}
                                    >
                                        <ImagePlus className="h-4 w-4 mr-2" />
                                        挿入を適用
                                    </Button>
                                    <Button
                                        onClick={handleCancelInsert}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        キャンセル
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 flex-wrap">
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
                                    onClick={() => setIsInsertMode(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                                >
                                    <ImagePlus className="h-4 w-4 mr-2" />
                                    画像挿入
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
                                    onClick={handleDownloadHQ}
                                    disabled={isUpscaling}
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                    style={{ backgroundColor: '#48a772', color: 'white' }}
                                >
                                    {isUpscaling ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            処理中...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            ダウンロード
                                        </>
                                    )}
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
