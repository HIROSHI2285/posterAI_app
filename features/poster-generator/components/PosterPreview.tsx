"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2, ImagePlus, Upload, Type } from "lucide-react"
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
    const MAX_INSERT_IMAGES = 5

    // アップスケール状態
    const [isUpscaling, setIsUpscaling] = useState(false)

    // マスク編集用の状態
    const [isMaskMode, setIsMaskMode] = useState(false)
    const [maskEditPrompt, setMaskEditPrompt] = useState("")
    const [brushSize, setBrushSize] = useState(20)
    const [currentRegion, setCurrentRegion] = useState(1)
    const [isDrawing, setIsDrawing] = useState(false)
    const maskCanvasRef = useRef<HTMLCanvasElement>(null)
    const regionColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF']

    // テキスト編集モード用の状態
    const [isTextEditMode, setIsTextEditMode] = useState(false)

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
        if (!displayImageUrl || !maskEditPrompt.trim() || !maskCanvasRef.current) return

        setIsEditing(true)
        try {
            const maskImageData = maskCanvasRef.current.toDataURL('image/png')

            const response = await fetch('/api/edit-region', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: displayImageUrl,
                    maskData: maskImageData,
                    maskEditPrompt: maskEditPrompt.trim(),
                    insertImagesData: insertImages.length > 0 ? insertImages.map(img => img.data) : undefined,
                    insertImagesUsages: insertImages.length > 0 ? insertImages.map(img => img.usage) : undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    setIsMaskMode(false)
                    setMaskEditPrompt("")
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
                                        <div className="space-y-3">
                                            {insertImages.map((img, index) => (
                                                <div key={index} className="p-2 bg-white rounded border">
                                                    <div className="flex items-center gap-2 mb-2">
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
                                                    <input
                                                        type="text"
                                                        placeholder="用途: 例) 中央に大きく配置、ロゴとして右下に配置"
                                                        value={img.usage}
                                                        onChange={(e) => {
                                                            setInsertImages(prev => prev.map((item, i) =>
                                                                i === index ? { ...item, usage: e.target.value } : item
                                                            ))
                                                        }}
                                                        className="w-full text-xs p-2 border rounded bg-white"
                                                    />
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

                                {/* ステップ2: 編集内容 */}
                                <div className="border rounded p-3 bg-white">
                                    <h3 className="font-bold mb-2 text-sm">2. 編集内容を入力</h3>
                                    <Textarea
                                        value={maskEditPrompt}
                                        onChange={(e) => setMaskEditPrompt(e.target.value)}
                                        placeholder="例：&#10;1: タイトルを『新年セール』に変更&#10;2: 日付を『1/20』に変更&#10;3: ロゴを削除"
                                        rows={5}
                                        className="text-sm"
                                    />
                                </div>

                                {/* 実行ボタン */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleMaskEdit}
                                        disabled={!maskEditPrompt.trim() || isEditing}
                                        className="flex-1"
                                        style={{ backgroundColor: '#ec4899', color: 'white' }}
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        {isEditing ? '編集中...' : 'マスク編集を実行'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsMaskMode(false)
                                            setMaskEditPrompt("")
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
