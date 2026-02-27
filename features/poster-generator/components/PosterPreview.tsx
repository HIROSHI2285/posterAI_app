"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Download, RefreshCw, ImageIcon, Edit3, X, Wand2, ImagePlus, Upload, Type, Plus, Trash2, Check, Eraser, Square, FileText, Save, ChevronLeft } from "lucide-react"
import { TextEditCanvas, TextLayer } from "./TextEditCanvas"
import { useExport } from "../utils/useExport"
import { importProject, denormalizePosition, normalizePosition } from "../utils/projectStorage"
import { toast } from 'sonner'

interface PosterPreviewProps {
    imageUrl?: string
    isGenerating: boolean
    onRegenerate?: () => void
    modelMode?: 'production' | 'development'
    metadata?: any
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

export function PosterPreview({ imageUrl, isGenerating, onRegenerate, modelMode = 'production', metadata }: PosterPreviewProps) {
    const { data: session } = useSession()
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
    const displayImageUrl = editedImageUrl || imageUrl

    const [isUpscaling, setIsUpscaling] = useState(false)
    // 編集時モデル選択（'inherit' = 生成時のmodelModeを継承）
    const [editModelMode, setEditModelMode] = useState<'production' | 'development' | 'inherit'>('inherit')
    const { isExtracting, isExportingPptx, isExportingSlides, handleExtractBlueprint, handleExportPptx, handleExportSlides } = useExport()

    // 現在の編集モード
    const [currentMode, setCurrentMode] = useState<'none' | 'general' | 'insert' | 'text' | 'region'>('none')

    // プロジェクト復元用の初期レイヤーデータ
    const [initialTextLayers, setInitialTextLayers] = useState<TextLayer[]>([])
    const projectFileInputRef = useRef<HTMLInputElement>(null)

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
    // State Lift: テキストレイヤーをここで管理
    const [textLayers, setTextLayers] = useState<TextLayer[]>([])

    // ========== 保留中の編集内容 ==========
    const [pendingGeneralPrompt, setPendingGeneralPrompt] = useState("")
    const [pendingInsertImages, setPendingInsertImages] = useState<InsertImageItem[]>([])
    // TextEditCanvasからリフトアップしたため、pendingTextEditsは直接textLayersを操作するか、
    // あるいは「保留中」として扱うか。
    // 今回の要件「AI編集とアクションの分離」では、TextEditCanvasは「AI編集」の一部となる。
    // よって、TextEditCanvasでの変更は即座に textLayers に反映させる（Controlled Component化）のが自然。
    // ただし、既存の「保留リストに追加」フローを維持する場合、TextEditCanvas内での変更はローカルで、
    // 「追加」ボタンで親に通知する形になる。
    // User要件は「ボタン配置の整理」。
    // 保存ボタンを外に出すには、現在の最新の状態を常に親が知っている必要がある。
    // よって、TextEditCanvasは Controlled Mode をサポートすべき。

    const [pendingTextEdits, setPendingTextEdits] = useState<TextEditItem[]>([])
    const [pendingRegionEdits, setPendingRegionEdits] = useState<RegionEditItem[]>([])

    const [isApplyingAll, setIsApplyingAll] = useState(false)
    const [isProjectSaving, setIsProjectSaving] = useState(false) // 保存中ステート

    const hasPendingEdits = pendingGeneralPrompt || pendingInsertImages.length > 0 || pendingTextEdits.length > 0 || pendingRegionEdits.length > 0

    // プロジェクト保存処理 (TextEditCanvasから移動)
    const handleSaveProject = async () => {
        if (!displayImageUrl) return;
        setIsProjectSaving(true);
        try {
            // 画像サイズを取得するための非同期処理
            const img = new Image();
            img.src = displayImageUrl;
            await new Promise((resolve) => { img.onload = resolve });

            const width = img.naturalWidth;
            const height = img.naturalHeight;

            // ProjectLayerへの変換
            // Note: normalizePositionなどはimportが必要
            const layers: any[] = textLayers.map((layer, index) => ({
                id: `layer_${index}_${Date.now()}`,
                type: 'text',
                name: `Text ${index + 1}`,
                visible: true,
                locked: false,
                position: {
                    x: normalizePosition(layer.bbox.x, width),
                    y: normalizePosition(layer.bbox.y, height),
                    z: index
                },
                size: {
                    width: normalizePosition(layer.bbox.width, width),
                    height: normalizePosition(layer.bbox.height, height)
                },
                rotation: 0,
                opacity: 1,
                text: {
                    content: layer.content,
                    style: {
                        fontFamily: layer.style.fontFamily,
                        fontSize: layer.style.fontSize === 'small' ? 24 :
                            layer.style.fontSize === 'medium' ? 48 :
                                layer.style.fontSize === 'large' ? 72 : 96,
                        color: layer.style.color,
                        fontWeight: layer.style.fontWeight,
                        textAlign: layer.style.textAlign
                    }
                }
            }));

            const project: any = {
                version: "1.0.0",
                meta: {
                    title: "Poster Project",
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                },
                ...(metadata?.gemini_model_version && { gemini_model_version: metadata.gemini_model_version }),
                ...(metadata?.character_features && { character_features: metadata.character_features }),
                canvas: {
                    width: width,
                    height: height,
                    backgroundImage: {
                        type: 'url',
                        src: displayImageUrl
                    }
                },
                layers: layers
            };

            const { exportProject } = await import('../utils/projectStorage');
            await exportProject(project);

            // ToastはLayoutで設定済みなのでここでは不要、またはsonnerをimportして呼ぶ
            // import { toast } from 'sonner' が必要
            toast.success("プロジェクトを保存しました", {
                description: "ダウンロードフォルダを確認してください"
            });
        } catch (error) {
            console.error('Save failed:', error);
            toast.error("保存に失敗しました");
        } finally {
            setIsProjectSaving(false);
        }
    };

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


    // ========== プロジェクト復元 (JSON Import) ==========
    const handleProjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            if (confirm("現在の作業内容は失われますが、プロジェクトを開きますか？")) {
                const project = await importProject(file)

                // 1. 画像の復元
                if (project.canvas.backgroundImage?.src) {
                    setEditedImageUrl(project.canvas.backgroundImage.src)
                }

                // 2. レイヤーの復元 & 座標のデノーマライズ
                const width = project.canvas.width
                const height = project.canvas.height

                const restoredLayers = project.layers
                    .filter(l => l.type === 'text' && l.text)
                    .map(l => ({
                        content: l.text!.content,
                        originalContent: l.text!.content,
                        bbox: {
                            x: denormalizePosition(l.position.x, width),
                            y: denormalizePosition(l.position.y, height),
                            width: denormalizePosition(l.size.width, width),
                            height: denormalizePosition(l.size.height, height)
                        },
                        style: {
                            fontFamily: l.text!.style.fontFamily as any,
                            fontSize: l.text!.style.fontSize > 80 ? 'xlarge' :
                                l.text!.style.fontSize > 60 ? 'large' :
                                    l.text!.style.fontSize > 36 ? 'medium' : 'small', // Simple mapping back to UI options
                            color: l.text!.style.color,
                            fontWeight: l.text!.style.fontWeight as any,
                            textAlign: l.text!.style.textAlign as any
                        },
                        originalStyle: {
                            fontFamily: l.text!.style.fontFamily as any,
                            fontSize: l.text!.style.fontSize > 80 ? 'xlarge' :
                                l.text!.style.fontSize > 60 ? 'large' :
                                    l.text!.style.fontSize > 36 ? 'medium' : 'small',
                            color: l.text!.style.color,
                            fontWeight: l.text!.style.fontWeight as any,
                            textAlign: l.text!.style.textAlign as any
                        }
                    } as TextLayer))

                setInitialTextLayers(restoredLayers)

                // 3. 編集モードへ遷移せず、プレビュー状態で待機
                setCurrentMode('none')
                alert("プロジェクトを読み込みました")
            }
        } catch (error) {
            console.error("Project load failed:", error)
            alert("プロジェクトファイルの読み込みに失敗しました")
        } finally {
            if (projectFileInputRef.current) {
                projectFileInputRef.current.value = ''
            }
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
            const hasRegionEdits = pendingRegionEdits.length > 0;
            const hasInsertImages = pendingInsertImages.length > 0;
            const hasGeneralPrompt = !!pendingGeneralPrompt;
            const hasTextEdits = pendingTextEdits.length > 0;

            // Scenario 1: Only manual text edits (no API needed!)
            if (!hasRegionEdits && !hasInsertImages && !hasGeneralPrompt && hasTextEdits) {
                // UI is already updated via TextEditCanvas state
                handleClearPendingEdits()
                setCurrentMode('none')
                setIsApplyingAll(false)
                toast.success("テキストの編集を反映しました")
                return
            }

            // Scenario 2: General prompt exists, try Smart Edit (NLP text update)
            if (!hasRegionEdits && !hasInsertImages && hasGeneralPrompt) {
                try {
                    const smartEditRes = await fetch('/api/smart-edit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            layers: textLayers,
                            prompt: pendingGeneralPrompt,
                            modelMode: editModelMode === 'inherit' ? modelMode : editModelMode,
                        })
                    })

                    if (smartEditRes.ok) {
                        const smartData = await smartEditRes.json()
                        if (smartData.isTextEditOnly) {
                            setTextLayers(smartData.layers)
                            handleClearPendingEdits()
                            setCurrentMode('none')
                            setIsApplyingAll(false)
                            toast.success("スマートエディットを適用しました（画像再生成なし）")
                            return
                        }
                        console.log("Smart edit classification: requires image regeneration, falling back to unified-edit")
                    }
                } catch (e) {
                    console.error("Smart edit failed, falling back to unified edit", e)
                }
            }

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

            // 画像の本来のサイズを取得
            const getOriginalDimensions = (): Promise<{ width: number, height: number }> => {
                return new Promise((resolve) => {
                    const img = new Image()
                    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
                    img.onerror = () => resolve({ width: 0, height: 0 }) // フォールバック
                    img.src = displayImageUrl
                })
            }

            const dims = await getOriginalDimensions()

            console.log('🚀 Unified Edit Request:', {
                hasRegionEdits: !!regionEditsData,
                hasInsertImages: pendingInsertImages.length,
                hasTextEdits: pendingTextEdits.length,
                hasGeneralPrompt: !!pendingGeneralPrompt,
                originalDimensions: dims
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
                        isDelete: e.isDelete
                    })) : undefined,
                    insertImages: pendingInsertImages.length > 0 ? pendingInsertImages.map(e => ({
                        data: e.data,
                        usage: e.usage
                    })) : undefined,
                    regionEdits: regionEditsData,
                    generalPrompt: pendingGeneralPrompt || undefined,
                    modelMode: editModelMode === 'inherit' ? modelMode : editModelMode,
                    originalDimensions: dims.width > 0 ? dims : undefined,
                    metadata: metadata
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
                <CardTitle className="text-base font-semibold flex justify-between items-center w-full">
                    <span>プレビュー</span>
                    <div className="flex gap-2">
                        <input
                            ref={projectFileInputRef}
                            type="file"
                            accept=".json,.posterai"
                            onChange={handleProjectUpload}
                            className="hidden"
                        />
                        <Button
                            onClick={() => projectFileInputRef.current?.click()}
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-none"
                            title="プロジェクトを開く"
                        >
                            <Upload className="h-3 w-3 mr-1" />
                            開く
                        </Button>
                    </div>
                </CardTitle>
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
                                        <Button
                                            onClick={() => switchMode('none')}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 -ml-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 flex items-center gap-1"
                                            title="戻る"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            戻る
                                        </Button>
                                        <Edit3 className="h-4 w-4" />
                                        <span className="text-sm font-medium">プロンプト編集</span>
                                    </div>
                                </div>

                                {/* モード切り替えボタン */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        onClick={() => switchMode('insert')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#9333ea', color: 'white' }}
                                    >
                                        <ImagePlus className="h-3 w-3 mr-1" />
                                        画像挿入
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('text')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#16a34a', color: 'white' }}
                                    >
                                        <Type className="h-3 w-3 mr-1" />
                                        テキスト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('region')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#ec4899', color: 'white' }}
                                    >
                                        <Square className="h-3 w-3 mr-1" />
                                        矩形編集
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
                                    style={{ backgroundColor: '#f97316', color: 'white' }}
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
                                        <Button
                                            onClick={() => switchMode('none')}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 -ml-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100 flex items-center gap-1"
                                            title="戻る"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            戻る
                                        </Button>
                                        <ImagePlus className="h-4 w-4" />
                                        <span className="text-sm font-medium">画像挿入</span>
                                    </div>
                                </div>

                                {/* モード切り替えボタン */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        onClick={() => switchMode('general')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                    >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        プロンプト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('text')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#16a34a', color: 'white' }}
                                    >
                                        <Type className="h-3 w-3 mr-1" />
                                        テキスト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('region')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#ec4899', color: 'white' }}
                                    >
                                        <Square className="h-3 w-3 mr-1" />
                                        矩形編集
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
                                        style={{ backgroundColor: '#f97316', color: 'white' }}
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
                                        <Button
                                            onClick={() => switchMode('none')}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 -ml-2 text-pink-700 hover:text-pink-900 hover:bg-pink-100 flex items-center gap-1"
                                            title="戻る"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            戻る
                                        </Button>
                                        <Square className="h-4 w-4" />
                                        <span className="text-sm font-medium">矩形編集</span>
                                    </div>
                                </div>

                                {/* モード切り替えボタン */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        onClick={() => switchMode('general')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                    >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        プロンプト編集
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('insert')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#9333ea', color: 'white' }}
                                    >
                                        <ImagePlus className="h-3 w-3 mr-1" />
                                        画像挿入
                                    </Button>
                                    <Button
                                        onClick={() => switchMode('text')}
                                        size="sm"
                                        className="h-7 text-xs"
                                        style={{ backgroundColor: '#16a34a', color: 'white' }}
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
                                        style={{ backgroundColor: '#f97316', color: 'white' }}
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
                                initialLayers={initialTextLayers.length > 0 ? initialTextLayers : undefined}
                                layers={textLayers}
                                onLayersChange={setTextLayers}
                                onSave={(edits) => {
                                    // 編集データを保留リストにマージ（重複回避）
                                    setPendingTextEdits(prev => {
                                        const next = [...prev]
                                        edits.forEach(newEdit => {
                                            const existingIndex = next.findIndex(e => e.original === newEdit.original)
                                            if (existingIndex !== -1) {
                                                next[existingIndex] = { ...next[existingIndex], ...newEdit }
                                            } else {
                                                next.push({
                                                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                                    ...newEdit
                                                })
                                            }
                                        })
                                        return next
                                    })
                                    // Alert削除: UI上で分かるようにするか、Toastにする
                                }}
                                onCancel={() => switchMode('none')}
                                onModeChange={(mode) => switchMode(mode)}
                            />
                        )}

                        {/* 通常時のボタン群 (新レイアウト：横並び＆カラー復元) */}
                        {currentMode === 'none' && (
                            <div className="space-y-4">
                                {/* Group 1: AI編集ツール */}
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center">
                                        <Wand2 className="h-3 w-3 mr-1" /> AI編集
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            onClick={() => switchMode('general')}
                                            size="sm"
                                            className="flex-1"
                                            style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                        >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            プロンプト編集
                                        </Button>
                                        <Button
                                            onClick={() => switchMode('text')}
                                            size="sm"
                                            className="flex-1"
                                            style={{ backgroundColor: '#16a34a', color: 'white' }}
                                        >
                                            <Type className="h-4 w-4 mr-2" />
                                            テキスト編集
                                        </Button>
                                        <Button
                                            onClick={() => switchMode('region')}
                                            size="sm"
                                            className="flex-1"
                                            style={{ backgroundColor: '#ec4899', color: 'white' }}
                                        >
                                            <Square className="h-4 w-4 mr-2" />
                                            矩形編集
                                        </Button>
                                        <Button
                                            onClick={() => switchMode('insert')}
                                            size="sm"
                                            className="flex-1"
                                            style={{ backgroundColor: '#9333ea', color: 'white' }}
                                        >
                                            <ImagePlus className="h-4 w-4 mr-2" />
                                            画像挿入
                                        </Button>
                                    </div>
                                </div>

                                {/* Group 2: アクション */}
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center">
                                        <Check className="h-3 w-3 mr-1" /> アクション
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            onClick={onRegenerate}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-white"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            再生成
                                        </Button>

                                        <Button
                                            onClick={handleDownloadHQ}
                                            disabled={isUpscaling}
                                            size="sm"
                                            className="flex-1"
                                            style={{ backgroundColor: '#48a772', color: 'white' }}
                                        >
                                            {isUpscaling ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                            ダウンロード
                                        </Button>

                                        <Button
                                            onClick={handleSaveProject}
                                            disabled={isProjectSaving}
                                            size="sm"
                                            className="flex-1"
                                            style={{ backgroundColor: '#f97316', color: 'white' }}
                                        >
                                            {isProjectSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                            プロジェクト保存
                                        </Button>
                                    </div>
                                </div>
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
                                                    title={`${colorName} 色の領域`}
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

                                {/* 編集モデル選択 */}
                                <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded border">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">編集モデル:</label>
                                    <select
                                        value={editModelMode}
                                        onChange={(e) => setEditModelMode(e.target.value as 'production' | 'development' | 'inherit')}
                                        className="flex-1 text-xs border rounded px-2 py-1 bg-white"
                                    >
                                        <option value="inherit">生成時と同じ（{modelMode === 'production' ? 'Pro' : 'Flash'}）</option>
                                        <option value="production">Pro（高精度編集）</option>
                                        <option value="development">Flash（テキスト編集のみ）</option>
                                    </select>
                                </div>

                                <Button
                                    onClick={handleApplyAllEdits}
                                    disabled={isApplyingAll}
                                    className="w-full mt-3"
                                    style={{ backgroundColor: '#48a772', color: 'white' }}
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
                        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-sm text-muted-foreground mb-6">プレビューはここに表示されます</p>

                        <div className="flex flex-col items-center gap-2">
                            <p className="text-xs text-muted-foreground">保存したプロジェクトを開く</p>
                            <Button
                                onClick={() => projectFileInputRef.current?.click()}
                                variant="outline"
                                className="bg-white hover:bg-gray-100 border-dashed border-2 border-gray-300"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                プロジェクト(.json)を読み込む
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
