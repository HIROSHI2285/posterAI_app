"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2, ImagePlus, Upload, Type, Plus, Trash2, Check, Eraser } from "lucide-react"
import { TextEditCanvas } from "./TextEditCanvas"

interface PosterPreviewProps {
    imageUrl?: string
    isGenerating: boolean
    onRegenerate?: () => void
}

interface MaskEditItem {
    id: string
    maskData: string
    prompt: string
    color: string
}

interface InsertImageItem {
    id: string
    data: string
    name: string
    usage: string
}

interface TextEditItem {
    id: string
    original: string
    newContent: string
    color?: string
    fontSize?: string
}

export function PosterPreview({ imageUrl, isGenerating, onRegenerate }: PosterPreviewProps) {
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
    const displayImageUrl = editedImageUrl || imageUrl

    const [isUpscaling, setIsUpscaling] = useState(false)

    // 現在の編集モード
    const [currentMode, setCurrentMode] = useState<'none' | 'general' | 'insert' | 'text' | 'mask'>('none')

    // 各モードの一時入力状態
    const [tempGeneralPrompt, setTempGeneralPrompt] = useState("")
    const [tempInsertImages, setTempInsertImages] = useState<{ data: string, name: string, usage: string }[]>([])
    const insertFileInputRef = useRef<HTMLInputElement>(null)

    // マスク編集用
    const [tempMaskPrompt, setTempMaskPrompt] = useState("")
    const [brushSize, setBrushSize] = useState(20)
    const [isDrawing, setIsDrawing] = useState(false)
    const [isEraser, setIsEraser] = useState(false)
    const maskCanvasRef = useRef<HTMLCanvasElement>(null)
    const committedMaskCanvasRef = useRef<HTMLCanvasElement>(null)
    const bgImageRef = useRef<HTMLImageElement | null>(null)
    const regionColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF']

    // テキスト編集モード
    const [isTextEditMode, setIsTextEditMode] = useState(false)

    // ========== 保留中の編集内容 ==========
    const [pendingGeneralPrompt, setPendingGeneralPrompt] = useState("")
    const [pendingInsertImages, setPendingInsertImages] = useState<InsertImageItem[]>([])
    const [pendingTextEdits, setPendingTextEdits] = useState<TextEditItem[]>([])
    const [pendingMaskEdits, setPendingMaskEdits] = useState<MaskEditItem[]>([])

    const [isApplyingAll, setIsApplyingAll] = useState(false)

    const hasPendingEdits = pendingGeneralPrompt || pendingInsertImages.length > 0 || pendingTextEdits.length > 0 || pendingMaskEdits.length > 0

    const getCurrentColor = useCallback(() => {
        return regionColors[pendingMaskEdits.length % regionColors.length]
    }, [pendingMaskEdits.length])

    // 確定済みマスクの表示更新
    useEffect(() => {
        const canvas = committedMaskCanvasRef.current
        if (!canvas || !bgImageRef.current) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const loadPromises = pendingMaskEdits.map(edit => {
            return new Promise<void>((resolve) => {
                const img = new Image()
                img.onload = () => {
                    ctx.globalAlpha = 0.5
                    ctx.drawImage(img, 0, 0)
                    ctx.globalAlpha = 1.0
                    resolve()
                }
                img.onerror = () => resolve()
                img.src = edit.maskData
            })
        })

        Promise.all(loadPromises)
    }, [pendingMaskEdits])

    // ========== ダウンロード ==========
    const handleDownload = () => {
        if (!displayImageUrl) return
        const link = document.createElement("a")
        link.href = displayImageUrl
        link.download = `poster-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleDownloadHQ = async () => {
        if (!displayImageUrl) return
        setIsUpscaling(true)
        try {
            const response = await fetch('/api/upscale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: displayImageUrl, scale: 2 })
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

    // ========== 画像挿入（1画像1プロンプト形式） ==========
    const handleInsertImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    setTempInsertImages(prev => [
                        ...prev,
                        { data: event.target?.result as string, name: file.name, usage: "" }
                    ])
                }
                reader.readAsDataURL(file)
            })
        }
        if (insertFileInputRef.current) insertFileInputRef.current.value = ''
    }

    const updateImageUsage = (index: number, usage: string) => {
        setTempInsertImages(prev => prev.map((img, i) =>
            i === index ? { ...img, usage } : img
        ))
    }

    const removeTemporaryImage = (index: number) => {
        setTempInsertImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleAddImagesToQueue = () => {
        const validImages = tempInsertImages.filter(img => img.usage.trim())
        if (validImages.length === 0) {
            alert('少なくとも1つの画像に用途を入力してください')
            return
        }

        validImages.forEach(img => {
            setPendingInsertImages(prev => [...prev, {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                data: img.data,
                name: img.name,
                usage: img.usage.trim()
            }])
        })

        setTempInsertImages([])
        setCurrentMode('none')
    }

    // ========== マスク描画 ==========
    const handleMaskDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !maskCanvasRef.current) return

        const canvas = maskCanvasRef.current
        const rect = canvas.getBoundingClientRect()

        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY

        const ctx = canvas.getContext('2d')!

        if (isEraser) {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalCompositeOperation = 'source-over'
        } else {
            ctx.fillStyle = getCurrentColor()
            ctx.globalAlpha = 1.0
            ctx.beginPath()
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    const handleClearCurrentMask = () => {
        if (!maskCanvasRef.current) return
        const ctx = maskCanvasRef.current.getContext('2d')!
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
    }

    const handleAddMaskToQueue = () => {
        if (!maskCanvasRef.current || !tempMaskPrompt.trim()) return

        const ctx = maskCanvasRef.current.getContext('2d')!
        const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
        const hasContent = imageData.data.some((val, i) => i % 4 === 3 && val > 0)

        if (!hasContent) {
            alert('マスク領域を描画してください')
            return
        }

        const maskData = maskCanvasRef.current.toDataURL('image/png')
        const color = getCurrentColor()

        setPendingMaskEdits(prev => [...prev, {
            id: Date.now().toString(),
            maskData,
            prompt: tempMaskPrompt.trim(),
            color
        }])

        setTempMaskPrompt("")
        handleClearCurrentMask()
    }

    // ========== 一般プロンプト ==========
    const handleAddGeneralPromptToQueue = () => {
        if (!tempGeneralPrompt.trim()) return
        setPendingGeneralPrompt(prev => prev ? prev + '\n' + tempGeneralPrompt.trim() : tempGeneralPrompt.trim())
        setTempGeneralPrompt("")
        setCurrentMode('none')
    }

    // ========== 保留編集の削除 ==========
    const removePendingInsertImage = (id: string) => {
        setPendingInsertImages(prev => prev.filter(item => item.id !== id))
    }

    const removePendingMaskEdit = (id: string) => {
        setPendingMaskEdits(prev => prev.filter(item => item.id !== id))
    }

    const removePendingTextEdit = (id: string) => {
        setPendingTextEdits(prev => prev.filter(item => item.id !== id))
    }

    const handleClearPendingEdits = () => {
        setPendingGeneralPrompt("")
        setPendingInsertImages([])
        setPendingTextEdits([])
        setPendingMaskEdits([])

        if (committedMaskCanvasRef.current) {
            const ctx = committedMaskCanvasRef.current.getContext('2d')
            if (ctx) ctx.clearRect(0, 0, committedMaskCanvasRef.current.width, committedMaskCanvasRef.current.height)
        }
    }

    // ========== マスク合成 ==========
    const createCombinedMaskData = async (): Promise<{ maskOverlay: string, maskPrompt: string } | null> => {
        if (!bgImageRef.current || pendingMaskEdits.length === 0) return null

        // 画像の幅と高さを安全に取得
        const imgWidth = bgImageRef.current.naturalWidth || bgImageRef.current.width
        const imgHeight = bgImageRef.current.naturalHeight || bgImageRef.current.height

        if (!imgWidth || !imgHeight) {
            console.error('❌ Image dimensions not available')
            alert('画像が読み込まれていません。少し待ってから再度お試しください。')
            return null
        }

        const maskOnlyCanvas = document.createElement('canvas')
        maskOnlyCanvas.width = imgWidth
        maskOnlyCanvas.height = imgHeight
        const maskCtx = maskOnlyCanvas.getContext('2d')!

        for (const edit of pendingMaskEdits) {
            await new Promise<void>((resolve) => {
                const img = new Image()
                img.onload = () => {
                    maskCtx.drawImage(img, 0, 0)
                    resolve()
                }
                img.onerror = () => resolve()
                img.src = edit.maskData
            })
        }

        const overlayCanvas = document.createElement('canvas')
        overlayCanvas.width = imgWidth
        overlayCanvas.height = imgHeight
        const overlayCtx = overlayCanvas.getContext('2d')!

        overlayCtx.drawImage(bgImageRef.current, 0, 0)
        overlayCtx.globalAlpha = 0.7
        overlayCtx.drawImage(maskOnlyCanvas, 0, 0)
        overlayCtx.globalAlpha = 1.0

        const maskOverlay = overlayCanvas.toDataURL('image/png')

        const colorNames = ['赤', '青', '緑', '黄', 'マゼンタ']
        const maskPrompt = pendingMaskEdits.map((edit) => {
            const colorIndex = regionColors.indexOf(edit.color)
            const colorName = colorIndex >= 0 ? colorNames[colorIndex] : '指定色'
            return `【${colorName}色の領域】${edit.prompt}`
        }).join('\n')

        return { maskOverlay, maskPrompt }
    }

    // ========== すべての編集を一括適用 ==========
    const handleApplyAllEdits = async () => {
        if (!displayImageUrl || !hasPendingEdits) return
        setIsApplyingAll(true)

        try {
            let maskData: string | undefined
            let maskPrompt: string | undefined

            if (pendingMaskEdits.length > 0) {
                const result = await createCombinedMaskData()
                if (result) {
                    maskData = result.maskOverlay
                    maskPrompt = result.maskPrompt
                }
            }

            console.log('🚀 Unified Edit Request:', {
                hasMaskEdits: !!maskData,
                hasInsertImages: pendingInsertImages.length,
                hasTextEdits: pendingTextEdits.length,
                hasGeneralPrompt: !!pendingGeneralPrompt
            })

            const response = await fetch('/api/unified-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: displayImageUrl,
                    textEdits: pendingTextEdits.length > 0 ? pendingTextEdits.map(e => ({
                        original: e.original,
                        newContent: e.newContent,
                        color: e.color,
                        fontSize: e.fontSize
                    })) : undefined,
                    insertImages: pendingInsertImages.length > 0 ? pendingInsertImages.map(e => ({
                        data: e.data,
                        usage: e.usage
                    })) : undefined,
                    maskData: maskData,
                    maskPrompt: maskPrompt,
                    generalPrompt: pendingGeneralPrompt || undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    handleClearPendingEdits()
                    setCurrentMode('none')
                    if (maskCanvasRef.current) {
                        const ctx = maskCanvasRef.current.getContext('2d')
                        if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
                    }
                } else {
                    alert('編集に失敗しました: 画像が生成されませんでした')
                }
            } else {
                const errorData = await response.json()
                console.error('❌ API Error:', errorData)
                alert(`編集に失敗しました: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('❌ Apply all edits error:', error)
            alert('編集中にエラーが発生しました')
        } finally {
            setIsApplyingAll(false)
        }
    }

    const switchMode = (mode: 'none' | 'general' | 'insert' | 'text' | 'mask') => {
        setTempGeneralPrompt("")
        setTempInsertImages([])
        setTempMaskPrompt("")
        handleClearCurrentMask()
        setCurrentMode(mode)
    }

    return (
        <Card className="border border-gray-300 bg-white">
            <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                <CardTitle className="text-base font-semibold">プレビュー</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {isGenerating || isApplyingAll ? (
                    <div className="flex flex-col items-center justify-center min-h-[550px] bg-gray-50 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-sm text-muted-foreground">
                            {isApplyingAll ? '編集を適用中...' : '画像を生成中...'}
                        </p>
                    </div>
                ) : displayImageUrl ? (
                    <div className="space-y-3">
                        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                            <img
                                ref={bgImageRef}
                                src={displayImageUrl}
                                alt="Preview"
                                className="w-full h-auto block"
                                onLoad={(e) => {
                                    const img = e.target as HTMLImageElement
                                        ;[maskCanvasRef.current, committedMaskCanvasRef.current].forEach(canvas => {
                                            if (canvas) {
                                                canvas.width = img.naturalWidth
                                                canvas.height = img.naturalHeight
                                            }
                                        })
                                }}
                            />
                            {editedImageUrl && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                    編集済み
                                </div>
                            )}

                            <canvas
                                ref={committedMaskCanvasRef}
                                className="absolute top-0 left-0 pointer-events-none"
                                style={{ width: '100%', height: '100%' }}
                            />

                            {currentMode === 'mask' && (
                                <canvas
                                    ref={maskCanvasRef}
                                    className="absolute top-0 left-0"
                                    style={{ width: '100%', height: '100%', cursor: isEraser ? 'cell' : 'crosshair' }}
                                    onMouseDown={(e) => {
                                        setIsDrawing(true)
                                        handleMaskDraw(e)
                                    }}
                                    onMouseMove={handleMaskDraw}
                                    onMouseUp={() => setIsDrawing(false)}
                                    onMouseLeave={() => setIsDrawing(false)}
                                />
                            )}
                        </div>

                        {/* プロンプト編集モード */}
                        {currentMode === 'general' && (
                            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <Edit3 className="h-4 w-4" />
                                        <span className="text-sm font-medium">プロンプト編集</span>
                                    </div>
                                    <Button onClick={() => switchMode('none')} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Textarea
                                    value={tempGeneralPrompt}
                                    onChange={(e) => setTempGeneralPrompt(e.target.value)}
                                    placeholder="画像全体に対する編集指示を入力..."
                                    rows={3}
                                    className="bg-white text-sm"
                                />
                                <Button
                                    onClick={handleAddGeneralPromptToQueue}
                                    disabled={!tempGeneralPrompt.trim()}
                                    className="w-full"
                                    style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    保留リストに追加
                                </Button>
                            </div>
                        )}

                        {/* 画像挿入モード（1画像1プロンプト） */}
                        {currentMode === 'insert' && (
                            <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-purple-700">
                                        <ImagePlus className="h-4 w-4" />
                                        <span className="text-sm font-medium">画像挿入</span>
                                    </div>
                                    <Button onClick={() => switchMode('none')} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <input
                                    ref={insertFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleInsertImageUpload}
                                    className="hidden"
                                />

                                {tempInsertImages.length > 0 && (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {tempInsertImages.map((img, index) => (
                                            <div key={index} className="p-2 bg-white rounded border space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <img src={img.data} alt="" className="w-16 h-16 object-contain rounded border flex-shrink-0" />
                                                    <div className="flex-1 text-xs truncate">{img.name}</div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-red-500 flex-shrink-0"
                                                        onClick={() => removeTemporaryImage(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Input
                                                    value={img.usage}
                                                    onChange={(e) => updateImageUsage(index, e.target.value)}
                                                    placeholder="この画像の用途（例: 右下にロゴとして配置）"
                                                    className="bg-white text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => insertFileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    画像を選択
                                </Button>

                                {tempInsertImages.length > 0 && (
                                    <Button
                                        onClick={handleAddImagesToQueue}
                                        className="w-full"
                                        style={{ backgroundColor: '#9333ea', color: 'white' }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        保留リストに追加（{tempInsertImages.filter(i => i.usage.trim()).length}/{tempInsertImages.length}件）
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* マスク編集モード */}
                        {currentMode === 'mask' && (
                            <div className="space-y-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-pink-700">
                                        <Wand2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">マスク編集</span>
                                    </div>
                                    <Button onClick={() => switchMode('none')} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                    <div className="flex items-center gap-1 px-2 py-1 border rounded bg-white">
                                        <div style={{ width: 14, height: 14, backgroundColor: getCurrentColor(), borderRadius: '50%' }} />
                                        <span>現在の色</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>サイズ:</span>
                                        <input
                                            type="range"
                                            min="5"
                                            max="80"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(Number(e.target.value))}
                                            className="w-20"
                                        />
                                        <span>{brushSize}px</span>
                                    </div>
                                    <Button
                                        variant={isEraser ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setIsEraser(!isEraser)}
                                        className="h-7 text-xs"
                                    >
                                        <Eraser className="h-3 w-3 mr-1" />
                                        消しゴム
                                    </Button>
                                    <Button onClick={handleClearCurrentMask} size="sm" variant="outline" className="h-7 text-xs">
                                        クリア
                                    </Button>
                                </div>

                                <Textarea
                                    value={tempMaskPrompt}
                                    onChange={(e) => setTempMaskPrompt(e.target.value)}
                                    placeholder="塗りつぶした領域をどう変更しますか？&#10;例: 背景を青空に変更"
                                    rows={2}
                                    className="bg-white text-sm"
                                />

                                <Button
                                    onClick={handleAddMaskToQueue}
                                    disabled={!tempMaskPrompt.trim()}
                                    className="w-full"
                                    style={{ backgroundColor: '#ec4899', color: 'white' }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    保留リストに追加（あと{Math.max(0, 5 - pendingMaskEdits.length)}つ可能）
                                </Button>
                            </div>
                        )}

                        {/* テキスト編集モード */}
                        {isTextEditMode && (
                            <TextEditCanvas
                                imageUrl={displayImageUrl!}
                                onSave={(edits) => {
                                    // 編集データを保留リストに追加
                                    edits.forEach(edit => {
                                        setPendingTextEdits(prev => [...prev, {
                                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                            original: edit.original,
                                            newContent: edit.newContent,
                                            color: edit.color,
                                            fontSize: edit.fontSize
                                        }])
                                    })
                                    setIsTextEditMode(false)
                                }}
                                onCancel={() => setIsTextEditMode(false)}
                            />
                        )}

                        {/* 通常時のボタン群 */}
                        {currentMode === 'none' && !isTextEditMode && (
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    onClick={() => switchMode('general')}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    プロンプト
                                </Button>
                                <Button
                                    onClick={() => setIsTextEditMode(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                                >
                                    <Type className="h-4 w-4 mr-1" />
                                    テキスト
                                </Button>
                                <Button
                                    onClick={() => switchMode('mask')}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                                >
                                    <Wand2 className="h-4 w-4 mr-1" />
                                    マスク
                                </Button>
                                <Button
                                    onClick={() => switchMode('insert')}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                                >
                                    <ImagePlus className="h-4 w-4 mr-1" />
                                    画像挿入
                                </Button>
                            </div>
                        )}

                        {currentMode === 'none' && !isTextEditMode && (
                            <div className="flex gap-2">
                                <Button onClick={onRegenerate} variant="outline" size="sm" className="flex-1">
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    再生成
                                </Button>
                                <Button
                                    onClick={handleDownloadHQ}
                                    disabled={isUpscaling}
                                    size="sm"
                                    className="flex-1"
                                    style={{ backgroundColor: '#48a772', color: 'white' }}
                                >
                                    {isUpscaling ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                                    {isUpscaling ? '処理中...' : 'ダウンロード'}
                                </Button>
                            </div>
                        )}

                        {/* 編集内容パネル */}
                        {hasPendingEdits && (
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-300">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-orange-800">📋 保留中の編集</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearPendingEdits}
                                        className="text-orange-600 hover:text-orange-800 h-6 px-2 text-xs"
                                    >
                                        すべてクリア
                                    </Button>
                                </div>

                                <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                                    {pendingGeneralPrompt && (
                                        <div className="flex items-start gap-2 p-2 bg-white rounded border">
                                            <Edit3 className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                            <span className="flex-1 break-words">{pendingGeneralPrompt}</span>
                                            <Button
                                                onClick={() => setPendingGeneralPrompt("")}
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-red-500"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {pendingInsertImages.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <img src={item.data} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                                            <span className="flex-1 truncate">{item.usage}</span>
                                            <Button
                                                onClick={() => removePendingInsertImage(item.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-red-500"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    {pendingMaskEdits.map((item, idx) => (
                                        <div key={item.id} className="flex items-start gap-2 p-2 bg-white rounded border">
                                            <div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: '50%', marginTop: 2, flexShrink: 0 }} />
                                            <span className="flex-1 break-words">
                                                <span className="font-bold">領域{idx + 1}:</span> {item.prompt}
                                            </span>
                                            <Button
                                                onClick={() => removePendingMaskEdit(item.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-red-500"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    {pendingTextEdits.map((item) => (
                                        <div key={item.id} className="flex items-start gap-2 p-2 bg-white rounded border">
                                            <Type className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                            <span className="flex-1">「{item.original}」→「{item.newContent}」</span>
                                            <Button
                                                onClick={() => removePendingTextEdit(item.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-red-500"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
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
                                            編集を適用中...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            すべての編集を反映
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
