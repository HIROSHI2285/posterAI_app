"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2, ImagePlus, Upload, Type, Plus } from "lucide-react"
import { TextEditCanvas } from "./TextEditCanvas"

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
    const [insertImages, setInsertImages] = useState<{ data: string, name: string, usage: string }[]>([])
    const [insertPrompt, setInsertPrompt] = useState("")
    const [isInserting, setIsInserting] = useState(false)
    const insertFileInputRef = useRef<HTMLInputElement>(null)
    const MAX_INSERT_IMAGES = 8

    // アップスケール状態
    const [isUpscaling, setIsUpscaling] = useState(false)

    // マスク編集用の状態
    const [isMaskMode, setIsMaskMode] = useState(false)
    const [brushSize, setBrushSize] = useState(20)
    const [currentRegion, setCurrentRegion] = useState(1)
    const [isDrawing, setIsDrawing] = useState(false)
    const maskCanvasRef = useRef<HTMLCanvasElement>(null)
    const bgImageRef = useRef<HTMLImageElement | null>(null)
    const regionColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF']
    // 領域ごとのプロンプト
    const [regionPrompts, setRegionPrompts] = useState<{ [key: number]: string }>({})

    // テキスト編集モード用の状態
    const [isTextEditMode, setIsTextEditMode] = useState(false)

    // 保留中の編集内容（一括適用用）
    const [pendingTextEdits, setPendingTextEdits] = useState<{ original: string, newContent: string, color?: string, fontSize?: string }[]>([])
    const [pendingInsertImages, setPendingInsertImages] = useState<{ data: string, usage: string }[]>([])
    const [pendingMaskOverlay, setPendingMaskOverlay] = useState<string | null>(null)
    const [pendingRegionPrompts, setPendingRegionPrompts] = useState<{ [key: number]: string }>({})
    const [pendingGeneralPrompt, setPendingGeneralPrompt] = useState<string>("")
    const [isApplyingAll, setIsApplyingAll] = useState(false)

    // 保留中の編集があるかどうか
    const hasPendingEdits = pendingTextEdits.length > 0 || pendingInsertImages.length > 0 || pendingMaskOverlay || pendingGeneralPrompt

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
                    insertImagesData: insertImages.length > 0 ? insertImages.map(img => img.data) : undefined,
                    insertImagesUsages: insertImages.length > 0 ? insertImages.map(img => img.usage) : undefined
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
                        { data: event.target?.result as string, name: file.name, usage: '' }
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

    // 編集を保留に追加するハンドラ
    const handleAddToQueue = (type: 'insert') => {
        if (type === 'insert' && insertImages.length > 0 && insertPrompt.trim()) {
            setPendingInsertImages(insertImages.map(img => ({ data: img.data, usage: insertPrompt })))
            setIsInsertMode(false)
            setInsertImages([])
            setInsertPrompt("")
        }
    }

    // マスク合成画像を作成（元画像の上にブラシ跡を重ねる）
    const createMaskOverlayImage = (): string | null => {
        if (!maskCanvasRef.current || !displayImageUrl) return null

        const tempCanvas = document.createElement('canvas')
        const maskCanvas = maskCanvasRef.current
        tempCanvas.width = maskCanvas.width
        tempCanvas.height = maskCanvas.height
        const ctx = tempCanvas.getContext('2d')
        if (!ctx) return null

        // 1. 元画像を描画
        if (bgImageRef.current) {
            ctx.drawImage(bgImageRef.current, 0, 0, tempCanvas.width, tempCanvas.height)
        }

        // 2. マスクを半透明で重ねる
        ctx.globalAlpha = 0.6
        ctx.drawImage(maskCanvas, 0, 0)

        return tempCanvas.toDataURL('image/png')
    }

    // マスク編集を保留に追加
    const handleAddMaskToQueue = () => {
        const hasPrompts = Object.values(regionPrompts).some(p => p.trim())
        if (maskCanvasRef.current && hasPrompts) {
            const overlayImage = createMaskOverlayImage()
            if (overlayImage) {
                setPendingMaskOverlay(overlayImage)
                setPendingRegionPrompts({ ...regionPrompts })
                setIsMaskMode(false)
                setRegionPrompts({})
                // マスクキャンバスをクリア
                const ctx = maskCanvasRef.current.getContext('2d')
                if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
            }
        }
    }

    // すべての編集を一括適用
    const handleApplyAllEdits = async () => {
        if (!displayImageUrl || !hasPendingEdits) return

        setIsApplyingAll(true)
        try {
            const response = await fetch('/api/unified-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: displayImageUrl,
                    textEdits: pendingTextEdits.length > 0 ? pendingTextEdits : undefined,
                    insertImages: pendingInsertImages.length > 0 ? pendingInsertImages : undefined,
                    maskOverlay: pendingMaskOverlay || undefined,
                    regionPrompts: Object.keys(pendingRegionPrompts).length > 0 ? pendingRegionPrompts : undefined,
                    generalPrompt: pendingGeneralPrompt || undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    // 保留中の編集をクリア
                    handleClearPendingEdits()
                } else {
                    alert('編集に失敗しました: 画像が生成されませんでした')
                }
            } else {
                const errorData = await response.json()
                alert(`編集に失敗しました: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Apply all edits error:', error)
            alert('編集中にエラーが発生しました')
        } finally {
            setIsApplyingAll(false)
        }
    }

    // 保留中の編集をクリア
    const handleClearPendingEdits = () => {
        setPendingTextEdits([])
        setPendingInsertImages([])
        setPendingMaskOverlay(null)
        setPendingRegionPrompts({})
        setPendingGeneralPrompt("")
    }

    // マスク編集用のハンドラー
    const handleMaskDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !maskCanvasRef.current) return

        const canvas = maskCanvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = regionColors[currentRegion - 1]
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
    }

    const handleClearMask = () => {
        if (!maskCanvasRef.current) return
        const ctx = maskCanvasRef.current.getContext('2d')!
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
    }

    const handleMaskEdit = async () => {
        const hasPrompts = Object.values(regionPrompts).some(p => p.trim())
        if (!displayImageUrl || !hasPrompts || !maskCanvasRef.current) return

        setIsEditing(true)
        try {
            // 元画像の上にマスクを重ねた合成画像を作成
            const overlayImage = createMaskOverlayImage()
            if (!overlayImage) {
                alert('マスク画像の作成に失敗しました')
                setIsEditing(false)
                return
            }

            // 領域ごとのプロンプトを構築
            const promptParts = Object.entries(regionPrompts)
                .filter(([_, prompt]) => prompt.trim())
                .map(([region, prompt]) => {
                    const colorNames = ['赤', '青', '緑', '黄', 'マゼンタ']
                    return `${colorNames[parseInt(region) - 1]}色で塗られた領域: ${prompt.trim()}`
                })

            const response = await fetch('/api/edit-region', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: displayImageUrl,
                    overlayImage: overlayImage,
                    regionPrompts: promptParts,
                    insertImagesData: insertImages.length > 0 ? insertImages.map(img => img.data) : undefined,
                    insertImagesUsages: insertImages.length > 0 ? insertImages.map(img => img.usage) : undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    setIsMaskMode(false)
                    setRegionPrompts({})
                    setInsertImages([])
                    handleClearMask()
                } else {
                    alert('マスク編集に失敗しました')
                }
            } else {
                const errorData = await response.json()
                alert(`マスク編集エラー: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Mask edit error:', error)
            alert('マスク編集中にエラーが発生しました')
        } finally {
            setIsEditing(false)
        }
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
                                        <div className="flex flex-wrap gap-2">
                                            {insertImages.map((img, index) => (
                                                <div key={index} className="relative group">
                                                    <img src={img.data} alt={`Insert ${index + 1}`} className="w-16 h-16 object-contain rounded border" />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-red-500 hover:bg-red-600 rounded-full"
                                                        onClick={() => removeInsertImage(index)}
                                                    >
                                                        <X className="h-3 w-3 text-white" />
                                                    </Button>
                                                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center truncate px-1">
                                                        {img.name.substring(0, 10)}
                                                    </span>
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

                                {/* 配置指示（1つのみ） */}
                                <Textarea
                                    value={insertPrompt}
                                    onChange={(e) => setInsertPrompt(e.target.value)}
                                    placeholder="配置場所や挿入方法を指定してください&#10;例: 右下にロゴとして配置&#10;例: 中央の人物をこの画像に差し替え&#10;例: 背景をこの画像に置き換え"
                                    rows={3}
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
                        ) : isTextEditMode ? (
                            /* テキスト編集モード */
                            <TextEditCanvas
                                imageUrl={displayImageUrl!}
                                onSave={(newImageUrl) => {
                                    setEditedImageUrl(newImageUrl)
                                    setIsTextEditMode(false)
                                }}
                                onCancel={() => setIsTextEditMode(false)}
                            />
                        ) : isMaskMode ? (
                            /* マスク編集モード */
                            <div className="space-y-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                <div className="flex items-center gap-2 text-pink-700">
                                    <Wand2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">マスク編集モード</span>
                                </div>

                                {/* ステップ1: 領域指定 */}
                                <div className="border rounded p-3 bg-white">
                                    <h3 className="font-bold mb-2 text-sm">1. 編集箇所を指定</h3>

                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">領域: {currentRegion}</span>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: regionColors[currentRegion - 1],
                                                border: '2px solid black',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                        <Button
                                            onClick={() => setCurrentRegion(prev => Math.min(prev + 1, 5))}
                                            size="sm"
                                            variant="outline"
                                        >
                                            次の領域 ({currentRegion}/5)
                                        </Button>
                                        <label className="text-xs">サイズ: {brushSize}px</label>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(Number(e.target.value))}
                                            className="w-24"
                                        />
                                        <Button onClick={handleClearMask} size="sm" variant="outline">
                                            クリア
                                        </Button>
                                    </div>

                                    <div style={{ position: 'relative' }} className="rounded overflow-hidden">
                                        {displayImageUrl && (
                                            <>
                                                <img
                                                    src={displayImageUrl}
                                                    alt="Preview"
                                                    style={{ maxWidth: '100%', display: 'block' }}
                                                    onLoad={(e) => {
                                                        const img = e.target as HTMLImageElement
                                                        if (maskCanvasRef.current) {
                                                            maskCanvasRef.current.width = img.width
                                                            maskCanvasRef.current.height = img.height
                                                        }
                                                    }}
                                                />
                                                <canvas
                                                    ref={maskCanvasRef}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        cursor: 'crosshair'
                                                    }}
                                                    onMouseDown={(e) => {
                                                        setIsDrawing(true)
                                                        handleMaskDraw(e)
                                                    }}
                                                    onMouseMove={handleMaskDraw}
                                                    onMouseUp={() => setIsDrawing(false)}
                                                    onMouseLeave={() => setIsDrawing(false)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ステップ2: 領域ごとの編集内容 */}
                                <div className="border rounded p-3 bg-white">
                                    <h3 className="font-bold mb-2 text-sm">2. 各領域の編集内容を入力</h3>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map(regionNum => (
                                            <div key={regionNum} className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ backgroundColor: regionColors[regionNum - 1] }}
                                                >
                                                    {regionNum}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={regionPrompts[regionNum] || ''}
                                                    onChange={(e) => setRegionPrompts(prev => ({
                                                        ...prev,
                                                        [regionNum]: e.target.value
                                                    }))}
                                                    placeholder={`領域${regionNum}の編集指示（例: タイトルを変更）`}
                                                    className="flex-1 text-sm p-2 border rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 塗った色に対応する領域の指示を入力してください
                                    </p>
                                </div>

                                {/* 実行ボタン */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAddMaskToQueue}
                                        disabled={!Object.values(regionPrompts).some(p => p.trim())}
                                        className="flex-1"
                                        variant="outline"
                                        style={{ borderColor: '#f97316', color: '#f97316' }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        編集リストに追加
                                    </Button>
                                    <Button
                                        onClick={handleMaskEdit}
                                        disabled={!Object.values(regionPrompts).some(p => p.trim()) || isEditing}
                                        className="flex-1"
                                        style={{ backgroundColor: '#ec4899', color: 'white' }}
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        {isEditing ? '編集中...' : '今すぐ実行'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsMaskMode(false)
                                            setRegionPrompts({})
                                            handleClearMask()
                                        }}
                                        variant="outline"
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
                                    onClick={() => setIsTextEditMode(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                                >
                                    <Type className="h-4 w-4 mr-2" />
                                    テキスト編集
                                </Button>
                                <Button
                                    onClick={() => setIsMaskMode(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                                >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    マスク編集
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

                            {/* 保留中の編集表示エリア */}
                        {hasPendingEdits && (
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-orange-700">📋 保留中の編集</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearPendingEdits}
                                        className="text-orange-600 hover:text-orange-800 h-6 px-2"
                                    >
                                        クリア
                                    </Button>
                                </div>
                                <div className="space-y-1 text-xs text-orange-600">
                                    {pendingTextEdits.length > 0 && (
                                        <div>✏️ テキスト編集: {pendingTextEdits.length}件</div>
                                    )}
                                    {pendingInsertImages.length > 0 && (
                                        <div>🖼️ 画像挿入: {pendingInsertImages.length}枚</div>
                                    )}
                                    {pendingMaskOverlay && (
                                        <div>🎭 マスク編集: {Object.keys(pendingRegionPrompts).length}領域</div>
                                    )}
                                    {pendingGeneralPrompt && (
                                        <div>📝 プロンプト編集: 設定済み</div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleApplyAllEdits}
                                    disabled={isApplyingAll}
                                    className="w-full mt-3"
                                    style={{ backgroundColor: '#f97316', color: 'white' }}
                                >
                                    {isApplyingAll ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            適用中...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            すべての編集を一括適用
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
