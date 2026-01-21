"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2, ImagePlus, Upload, Type, Plus, Trash2, Check, Eraser, Square } from "lucide-react"
import { TextEditCanvas } from "./TextEditCanvas"

interface PosterPreviewProps {
    imageUrl?: string
    isGenerating: boolean
    onRegenerate?: () => void
}

interface RegionEditItem {
    id: string
    region: {
        x: number
        y: number
        width: number
        height: number
        top: number      // %
        left: number     // %
        widthPercent: number   // %
        heightPercent: number  // %
        description: string
    }
    prompt: string
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
    isDelete?: boolean  // 削除フラグ
}

export function PosterPreview({ imageUrl, isGenerating, onRegenerate }: PosterPreviewProps) {
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
    const displayImageUrl = editedImageUrl || imageUrl

    const [isUpscaling, setIsUpscaling] = useState(false)

    // 現在の編集モード
    const [currentMode, setCurrentMode] = useState<'none' | 'general' | 'insert' | 'text' | 'region'>('none')

    // 各モードの一時入力状態
    const [tempGeneralPrompt, setTempGeneralPrompt] = useState("")
    const [tempInsertImages, setTempInsertImages] = useState<{ data: string, name: string, usage: string }[]>([])
    const insertFileInputRef = useRef<HTMLInputElement>(null)

    // 矩形選択用
    interface RectRegion {
        x: number
        y: number
        width: number
        height: number
    }
    const [tempRegionPrompt, setTempRegionPrompt] = useState("")
    const [currentRect, setCurrentRect] = useState<RectRegion | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null)
    const regionCanvasRef = useRef<HTMLCanvasElement>(null)
    const bgImageRef = useRef<HTMLImageElement | null>(null)

    // テキスト編集は currentMode: 'text' で管理

    // ========== 保留中の編集内容 ==========
    const [pendingGeneralPrompt, setPendingGeneralPrompt] = useState("")
    const [pendingInsertImages, setPendingInsertImages] = useState<InsertImageItem[]>([])
    const [pendingTextEdits, setPendingTextEdits] = useState<TextEditItem[]>([])
    const [pendingRegionEdits, setPendingRegionEdits] = useState<RegionEditItem[]>([])

    const [isApplyingAll, setIsApplyingAll] = useState(false)

    const hasPendingEdits = pendingGeneralPrompt || pendingInsertImages.length > 0 || pendingTextEdits.length > 0 || pendingRegionEdits.length > 0

    // 矩形領域の表示更新
    useEffect(() => {
        const canvas = regionCanvasRef.current
        if (!canvas || !bgImageRef.current) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 確定済みの矩形を表示
        pendingRegionEdits.forEach((edit, idx) => {
            const colors = ['rgba(255,0,0,0.3)', 'rgba(0,0,255,0.3)', 'rgba(0,255,0,0.3)', 'rgba(255,255,0,0.3)', 'rgba(255,0,255,0.3)']
            ctx.fillStyle = colors[idx % colors.length]
            ctx.fillRect(edit.region.x, edit.region.y, edit.region.width, edit.region.height)
            ctx.strokeStyle = colors[idx % colors.length].replace('0.3', '1')
            ctx.lineWidth = 2
            ctx.strokeRect(edit.region.x, edit.region.y, edit.region.width, edit.region.height)
        })

        // 現在描画中の矩形
        if (currentRect) {
            ctx.fillStyle = 'rgba(255,165,0,0.3)'
            ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
            ctx.strokeStyle = 'orange'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
            ctx.setLineDash([])
        }
    }, [pendingRegionEdits, currentRect])

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
            // クライアントサイドでCanvas APIを使ってアップスケール
            const img = new Image()
            img.crossOrigin = 'anonymous'

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
                img.src = displayImageUrl
            })

            const scale = 2
            const canvas = document.createElement('canvas')
            canvas.width = img.width * scale
            canvas.height = img.height * scale

            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas context not available')

            // 高品質なリサイズ設定
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            // PNG形式で高画質ダウンロード
            const upscaledUrl = canvas.toDataURL('image/png', 1.0)

            const link = document.createElement("a")
            link.href = upscaledUrl
            link.download = `poster-hq-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            console.log(`[Upscale] 完了: ${img.width}x${img.height} → ${canvas.width}x${canvas.height}`)
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

        // 入力フィールドをクリアするが、モードは維持
        setTempInsertImages([])
    }

    // ========== 矩形選択 ==========
    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = regionCanvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        }
    }

    const handleRegionMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e)
        setStartPoint(coords)
        setIsDragging(true)
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 })
    }

    const handleRegionMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !startPoint) return
        const coords = getCanvasCoordinates(e)
        const x = Math.min(startPoint.x, coords.x)
        const y = Math.min(startPoint.y, coords.y)
        const width = Math.abs(coords.x - startPoint.x)
        const height = Math.abs(coords.y - startPoint.y)
        setCurrentRect({ x, y, width, height })
    }

    const handleRegionMouseUp = () => {
        setIsDragging(false)
        setStartPoint(null)
        // currentRectはそのままにして確定用ボタンで追加
    }

    const handleClearCurrentRect = () => {
        setCurrentRect(null)
    }

    const handleAddRegionToQueue = () => {
        if (!currentRect || !tempRegionPrompt.trim()) {
            alert('矩形領域を選択してプロンプトを入力してください')
            return
        }
        if (currentRect.width < 10 || currentRect.height < 10) {
            alert('矩形領域が小さすぎます。もう少し大きく選択してください')
            return
        }

        const canvas = regionCanvasRef.current
        if (!canvas) return

        // 座標を相対位置に変換
        const top = (currentRect.y / canvas.height) * 100
        const left = (currentRect.x / canvas.width) * 100
        const widthPercent = (currentRect.width / canvas.width) * 100
        const heightPercent = (currentRect.height / canvas.height) * 100

        // 位置の説明を生成
        let description = `画像の`
        if (top < 33) description += '上部'
        else if (top < 66) description += '中央'
        else description += '下部'
        if (left < 33) description += '左側'
        else if (left < 66) description += '中央'
        else description += '右側'
        description += `（上から${top.toFixed(0)}%、左から${left.toFixed(0)}%の位置、幅${widthPercent.toFixed(0)}%、高さ${heightPercent.toFixed(0)}%の矩形領域）`

        setPendingRegionEdits(prev => [...prev, {
            id: Date.now().toString(),
            region: {
                x: currentRect.x,
                y: currentRect.y,
                width: currentRect.width,
                height: currentRect.height,
                top,
                left,
                widthPercent,
                heightPercent,
                description
            },
            prompt: tempRegionPrompt.trim()
        }])

        setTempRegionPrompt("")
        setCurrentRect(null)
    }

    // ========== 一般プロンプト ==========
    const handleAddGeneralPromptToQueue = () => {
        if (!tempGeneralPrompt.trim()) return
        setPendingGeneralPrompt(prev => prev ? prev + '\n' + tempGeneralPrompt.trim() : tempGeneralPrompt.trim())
        // 入力をクリアするが、モードは維持
        setTempGeneralPrompt("")
    }

    // ========== 保留編集の削除 ==========
    const removePendingInsertImage = (id: string) => {
        setPendingInsertImages(prev => prev.filter(item => item.id !== id))
    }

    const removePendingRegionEdit = (id: string) => {
        setPendingRegionEdits(prev => prev.filter(item => item.id !== id))
    }

    const removePendingTextEdit = (id: string) => {
        setPendingTextEdits(prev => prev.filter(item => item.id !== id))
    }

    const handleClearPendingEdits = () => {
        setPendingGeneralPrompt("")
        setPendingInsertImages([])
        setPendingTextEdits([])
        setPendingRegionEdits([])
        setCurrentRect(null)
    }

    // ========== すべての編集を一括適用 ==========
    const handleApplyAllEdits = async () => {
        if (!displayImageUrl || !hasPendingEdits) return
        setIsApplyingAll(true)

        try {
            // 矩形領域編集のデータを構築
            const regionEditsData = pendingRegionEdits.length > 0 ? pendingRegionEdits.map(edit => ({
                position: {
                    top: edit.region.top,
                    left: edit.region.left,
                    width: edit.region.widthPercent,
                    height: edit.region.heightPercent,
                    description: edit.region.description
                },
                prompt: edit.prompt
            })) : undefined

            console.log('🚀 Unified Edit Request:', {
                hasRegionEdits: !!regionEditsData,
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
                        fontSize: e.fontSize,
                        isDelete: e.isDelete  // 削除フラグを追加
                    })) : undefined,
                    insertImages: pendingInsertImages.length > 0 ? pendingInsertImages.map(e => ({
                        data: e.data,
                        usage: e.usage
                    })) : undefined,
                    regionEdits: regionEditsData,
                    generalPrompt: pendingGeneralPrompt || undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.imageUrl) {
                    setEditedImageUrl(data.imageUrl)
                    handleClearPendingEdits()
                    setCurrentMode('none')
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

    const switchMode = (mode: 'none' | 'general' | 'insert' | 'text' | 'region') => {
        // 一時入力は保持したまま、モードのみ切り替え
        handleClearCurrentRect()  // 矩形選択中の描画のみクリア
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
                                    const canvas = regionCanvasRef.current
                                    if (canvas) {
                                        canvas.width = img.naturalWidth
                                        canvas.height = img.naturalHeight
                                    }
                                }}
                            />
                            {editedImageUrl && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                    編集済み
                                </div>
                            )}

                            {/* 矩形選択用Canvas */}
                            <canvas
                                ref={regionCanvasRef}
                                className="absolute top-0 left-0"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    cursor: currentMode === 'region' ? 'crosshair' : 'default',
                                    pointerEvents: currentMode === 'region' ? 'auto' : 'none'
                                }}
                                onMouseDown={handleRegionMouseDown}
                                onMouseMove={handleRegionMouseMove}
                                onMouseUp={handleRegionMouseUp}
                                onMouseLeave={handleRegionMouseUp}
                            />
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

                                {/* モード切り替えボタン */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        onClick={() => switchMode('insert')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <ImagePlus className="h-3 w-3 mr-1" />
                                        画像挿入
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('text')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Type className="h-3 w-3 mr-1" />
                                        テキスト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('region')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Square className="h-3 w-3 mr-1" />
                                        矩形選択
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
                                    style={{ backgroundColor: '#48a772', color: 'white' }}
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

                                {/* モード切り替えボタン */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        onClick={() => switchMode('general')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        プロンプト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('text')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Type className="h-3 w-3 mr-1" />
                                        テキスト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('region')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Square className="h-3 w-3 mr-1" />
                                        矩形選択
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
                                        style={{ backgroundColor: '#48a772', color: 'white' }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        保留リストに追加（{tempInsertImages.filter(i => i.usage.trim()).length}/{tempInsertImages.length}件）
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* 矩形選択モード */}
                        {currentMode === 'region' && (
                            <div className="space-y-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-pink-700">
                                        <Square className="h-4 w-4" />
                                        <span className="text-sm font-medium">矩形選択編集</span>
                                    </div>
                                    <Button onClick={() => switchMode('none')} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* モード切り替えボタン */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        onClick={() => switchMode('general')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        プロンプト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('insert')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <ImagePlus className="h-3 w-3 mr-1" />
                                        画像挿入
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('text')}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Type className="h-3 w-3 mr-1" />
                                        テキスト編集
                                    </Button>
                                </div>

                                <p className="text-xs text-pink-600">
                                    画像上をドラッグして編集したい領域を選択してください
                                </p>

                                {currentRect && (
                                    <div className="p-2 bg-white rounded border text-xs">
                                        <span className="text-pink-700">
                                            選択中: 幅{((currentRect.width / (regionCanvasRef.current?.width || 1)) * 100).toFixed(0)}% × 高さ{((currentRect.height / (regionCanvasRef.current?.height || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                )}

                                <Textarea
                                    value={tempRegionPrompt}
                                    onChange={(e) => setTempRegionPrompt(e.target.value)}
                                    placeholder="選択した領域をどう変更しますか？&#10;例: この部分を削除する、背景を青空に変更"
                                    rows={2}
                                    className="bg-white text-sm"
                                />

                                <div className="flex gap-2">
                                    <Button onClick={handleClearCurrentRect} size="sm" variant="outline" className="flex-1 text-xs">
                                        選択クリア
                                    </Button>
                                    <Button
                                        onClick={handleAddRegionToQueue}
                                        disabled={!currentRect || !tempRegionPrompt.trim()}
                                        className="flex-1"
                                        style={{ backgroundColor: '#48a772', color: 'white' }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        追加（あと{Math.max(0, 5 - pendingRegionEdits.length)}可能）
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* テキスト編集モード */}
                        {currentMode === 'text' && (
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
                                            fontSize: edit.fontSize,
                                            isDelete: edit.isDelete  // 削除フラグを追加
                                        }])
                                    })
                                    // モードは閉じずに保持（ユーザーが手動で閉じる）
                                }}
                                onCancel={() => switchMode('none')}
                                onModeChange={(mode) => switchMode(mode)}
                            />
                        )}

                        {/* 通常時のボタン群 */}
                        {currentMode === 'none' && (
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
                                    onClick={() => switchMode('text')}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                                >
                                    <Type className="h-4 w-4 mr-1" />
                                    テキスト
                                </Button>
                                <Button
                                    onClick={() => switchMode('region')}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                                >
                                    <Wand2 className="h-4 w-4 mr-1" />
                                    範囲選択
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

                        {currentMode === 'none' && (
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

                                    {pendingRegionEdits.map((item, idx) => {
                                        const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#ff00ff']
                                        const colorNames = ['赤', '青', '緑', '黄', 'マゼンタ']
                                        const color = colors[idx % colors.length]
                                        const colorName = colorNames[idx % colorNames.length]
                                        return (
                                            <div key={item.id} className="flex items-start gap-2 p-2 bg-white rounded border">
                                                <div
                                                    style={{
                                                        width: 12,
                                                        height: 12,
                                                        backgroundColor: color,
                                                        borderRadius: '50%',
                                                        marginTop: 2,
                                                        flexShrink: 0,
                                                        border: '1px solid rgba(0,0,0,0.2)'
                                                    }}
                                                    title={`${colorName}色の領域`}
                                                />
                                                <span className="flex-1 break-words">
                                                    <span className="font-bold">領域{idx + 1}:</span> {item.prompt}
                                                </span>
                                                <Button
                                                    onClick={() => removePendingRegionEdit(item.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0 text-red-500"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )
                                    })}

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
