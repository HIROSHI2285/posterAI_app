"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Save, RotateCcw, Type, Loader2 } from "lucide-react"

interface TextLayer {
    content: string
    bbox: {
        x: number
        y: number
        width: number
        height: number
    }
    style: {
        fontFamily: 'serif' | 'sans-serif' | 'display'
        fontWeight: 'normal' | 'bold'
        fontSize: 'small' | 'medium' | 'large' | 'xlarge'
        color: string
        textAlign: 'left' | 'center' | 'right'
    }
}

interface TextEditCanvasProps {
    imageUrl: string
    onSave: (newImageUrl: string) => void
    onCancel: () => void
}

// フォントファミリーの変換
function getFontFamily(family: string): string {
    const fonts: Record<string, string> = {
        serif: 'Noto Serif JP, serif',
        'sans-serif': 'Noto Sans JP, sans-serif',
        display: 'M PLUS Rounded 1c, sans-serif'
    }
    return fonts[family] || 'Noto Sans JP, sans-serif'
}

// フォントサイズの変換（キャンバス高さに対する比率）
function getFontSize(size: string, canvasHeight: number): number {
    const ratios: Record<string, number> = {
        small: 0.03,
        medium: 0.05,
        large: 0.08,
        xlarge: 0.12
    }
    return Math.round(canvasHeight * (ratios[size] || 0.05))
}

// 座標変換（0-1000 → キャンバスピクセル）
function convertCoordinates(
    bbox: { x: number, y: number, width: number, height: number },
    canvasWidth: number,
    canvasHeight: number
) {
    return {
        x: (bbox.x / 1000) * canvasWidth,
        y: (bbox.y / 1000) * canvasHeight,
        width: (bbox.width / 1000) * canvasWidth,
        height: (bbox.height / 1000) * canvasHeight
    }
}

export function TextEditCanvas({ imageUrl, onSave, onCancel }: TextEditCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [textLayers, setTextLayers] = useState<TextLayer[]>([])
    const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

    // テキスト抽出API呼び出し
    const extractTextLayers = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/extract-text-layers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: imageUrl })
            })

            if (!response.ok) {
                throw new Error('Text extraction failed')
            }

            const data = await response.json()
            setTextLayers(data.texts || [])
        } catch (err) {
            console.error('Extract error:', err)
            setError('テキストの抽出に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }, [imageUrl])

    // 背景画像のロード
    useEffect(() => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            setBackgroundImage(img)
            // キャンバスサイズを画像に合わせる（最大800px幅）
            const scale = Math.min(800 / img.width, 1)
            setCanvasSize({
                width: Math.round(img.width * scale),
                height: Math.round(img.height * scale)
            })
        }
        img.src = imageUrl
    }, [imageUrl])

    // テキスト抽出の実行
    useEffect(() => {
        if (imageUrl) {
            extractTextLayers()
        }
    }, [imageUrl, extractTextLayers])

    // キャンバスの再描画
    useEffect(() => {
        if (!canvasRef.current || !backgroundImage) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 背景画像を描画
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height)

        // テキストレイヤーを描画
        textLayers.forEach((layer, index) => {
            const coords = convertCoordinates(layer.bbox, canvasSize.width, canvasSize.height)
            const fontSize = getFontSize(layer.style.fontSize, canvasSize.height)

            // 選択状態の場合はハイライト
            if (index === selectedTextIndex) {
                ctx.strokeStyle = '#3b82f6'
                ctx.lineWidth = 2
                ctx.strokeRect(coords.x - 5, coords.y - 5, coords.width + 10, coords.height + 10)
                ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
                ctx.fillRect(coords.x - 5, coords.y - 5, coords.width + 10, coords.height + 10)
            }

            // テキストを描画
            ctx.font = `${layer.style.fontWeight} ${fontSize}px ${getFontFamily(layer.style.fontFamily)}`
            ctx.fillStyle = layer.style.color
            ctx.textAlign = layer.style.textAlign as CanvasTextAlign
            ctx.textBaseline = 'top'

            // テキスト配置の調整
            let textX = coords.x
            if (layer.style.textAlign === 'center') {
                textX = coords.x + coords.width / 2
            } else if (layer.style.textAlign === 'right') {
                textX = coords.x + coords.width
            }

            ctx.fillText(layer.content, textX, coords.y)
        })
    }, [backgroundImage, textLayers, selectedTextIndex, canvasSize])

    // クリックでテキスト選択
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // クリック位置に該当するテキストを探す
        for (let i = textLayers.length - 1; i >= 0; i--) {
            const layer = textLayers[i]
            const coords = convertCoordinates(layer.bbox, canvasSize.width, canvasSize.height)

            if (x >= coords.x - 10 && x <= coords.x + coords.width + 10 &&
                y >= coords.y - 10 && y <= coords.y + coords.height + 10) {
                setSelectedTextIndex(i)
                return
            }
        }
        setSelectedTextIndex(null)
    }

    // ダブルクリックで編集モード
    const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (selectedTextIndex !== null) {
            setEditingIndex(selectedTextIndex)
        }
    }

    // テキスト内容の更新
    const updateTextContent = (index: number, newContent: string) => {
        setTextLayers(prev => prev.map((layer, i) =>
            i === index ? { ...layer, content: newContent } : layer
        ))
    }

    // スタイルの更新
    const updateTextStyle = (index: number, styleKey: string, value: string) => {
        setTextLayers(prev => prev.map((layer, i) =>
            i === index ? { ...layer, style: { ...layer.style, [styleKey]: value } } : layer
        ))
    }

    // 保存処理
    const handleSave = () => {
        if (!canvasRef.current) return
        const dataUrl = canvasRef.current.toDataURL('image/png')
        onSave(dataUrl)
    }

    // エラー表示
    if (error) {
        return (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600">{error}</p>
                <Button onClick={onCancel} variant="outline" size="sm" className="mt-2">
                    キャンセル
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">テキスト編集モード</span>
                {isLoading && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        解析中...
                    </span>
                )}
            </div>

            {/* キャンバスエリア */}
            <div className="border rounded bg-white overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onClick={handleCanvasClick}
                    onDoubleClick={handleCanvasDoubleClick}
                    className="cursor-pointer"
                    style={{ maxWidth: '100%', height: 'auto' }}
                />
            </div>

            {/* 選択中のテキストのプロパティパネル */}
            {selectedTextIndex !== null && textLayers[selectedTextIndex] && (
                <div className="p-3 bg-white rounded border space-y-3">
                    <div className="text-sm font-medium text-gray-700">
                        選択中: "{textLayers[selectedTextIndex].content}"
                    </div>

                    {/* テキスト内容編集 */}
                    {editingIndex === selectedTextIndex ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={textLayers[selectedTextIndex].content}
                                onChange={(e) => updateTextContent(selectedTextIndex, e.target.value)}
                                onBlur={() => setEditingIndex(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                                className="w-full p-2 border rounded text-sm"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingIndex(selectedTextIndex)}
                            className="w-full"
                        >
                            テキストを編集
                        </Button>
                    )}

                    {/* スタイル編集 */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* 色 */}
                        <div>
                            <label className="text-xs text-gray-500">色</label>
                            <input
                                type="color"
                                value={textLayers[selectedTextIndex].style.color}
                                onChange={(e) => updateTextStyle(selectedTextIndex, 'color', e.target.value)}
                                className="w-full h-8 rounded border cursor-pointer"
                            />
                        </div>

                        {/* フォントサイズ */}
                        <div>
                            <label className="text-xs text-gray-500">サイズ</label>
                            <select
                                value={textLayers[selectedTextIndex].style.fontSize}
                                onChange={(e) => updateTextStyle(selectedTextIndex, 'fontSize', e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                <option value="small">小</option>
                                <option value="medium">中</option>
                                <option value="large">大</option>
                                <option value="xlarge">特大</option>
                            </select>
                        </div>

                        {/* フォントウェイト */}
                        <div>
                            <label className="text-xs text-gray-500">太さ</label>
                            <select
                                value={textLayers[selectedTextIndex].style.fontWeight}
                                onChange={(e) => updateTextStyle(selectedTextIndex, 'fontWeight', e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                <option value="normal">通常</option>
                                <option value="bold">太字</option>
                            </select>
                        </div>

                        {/* フォントファミリー */}
                        <div>
                            <label className="text-xs text-gray-500">フォント</label>
                            <select
                                value={textLayers[selectedTextIndex].style.fontFamily}
                                onChange={(e) => updateTextStyle(selectedTextIndex, 'fontFamily', e.target.value)}
                                className="w-full p-1 border rounded text-sm"
                            >
                                <option value="sans-serif">ゴシック</option>
                                <option value="serif">明朝</option>
                                <option value="display">装飾</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* ヒント */}
            {selectedTextIndex === null && !isLoading && textLayers.length > 0 && (
                <p className="text-xs text-gray-500">
                    テキストをクリックして選択、ダブルクリックで編集
                </p>
            )}

            {/* ボタンエリア */}
            <div className="flex gap-2">
                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1"
                    style={{ backgroundColor: '#48a772', color: 'white' }}
                >
                    <Save className="h-4 w-4 mr-2" />
                    保存
                </Button>
                <Button
                    onClick={onCancel}
                    variant="outline"
                >
                    <X className="h-4 w-4 mr-2" />
                    キャンセル
                </Button>
            </div>
        </div>
    )
}
