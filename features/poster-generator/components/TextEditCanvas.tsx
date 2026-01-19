"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Save, Type, Loader2, ChevronDown, ChevronUp } from "lucide-react"

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

export function TextEditCanvas({ imageUrl, onSave, onCancel }: TextEditCanvasProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [textLayers, setTextLayers] = useState<TextLayer[]>([])
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

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

    // テキスト抽出の実行
    useEffect(() => {
        if (imageUrl) {
            extractTextLayers()
        }
    }, [imageUrl, extractTextLayers])

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

    // 保存処理（マスク編集APIを使用してテキストを差し替え）
    const handleSave = async () => {
        setIsSaving(true)
        try {
            // 編集内容をプロンプトとして構築
            const editPrompts = textLayers.map((layer, index) =>
                `${index + 1}: "${layer.content}"`
            ).join('\n')

            // マスク編集APIを使用
            const response = await fetch('/api/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: imageUrl,
                    prompt: `以下のテキストに変更してください:\n${editPrompts}`
                })
            })

            if (response.ok) {
                const data = await response.json()
                onSave(data.imageUrl || imageUrl)
            } else {
                // 編集APIが失敗した場合は元の画像を返す
                onSave(imageUrl)
            }
        } catch (err) {
            console.error('Save error:', err)
            onSave(imageUrl)
        } finally {
            setIsSaving(false)
        }
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
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
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
                <span className="text-xs text-gray-500">
                    {textLayers.length}個のテキストを検出
                </span>
            </div>

            {/* 2カラムレイアウト: 画像 | テキストリスト */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 左: 元画像（編集不可、参照用） */}
                <div className="border rounded bg-white overflow-hidden">
                    <div className="text-xs text-gray-500 p-2 bg-gray-100 border-b">
                        元画像（参照用）
                    </div>
                    <img
                        src={imageUrl}
                        alt="Original"
                        className="w-full h-auto"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                </div>

                {/* 右: テキストリスト（編集可能） */}
                <div className="border rounded bg-white overflow-hidden">
                    <div className="text-xs text-gray-500 p-2 bg-gray-100 border-b">
                        検出されたテキスト（クリックで編集）
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {textLayers.length === 0 && !isLoading && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                テキストが検出されませんでした
                            </div>
                        )}
                        {textLayers.map((layer, index) => (
                            <div
                                key={index}
                                className={`border-b last:border-b-0 ${expandedIndex === index ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                            >
                                {/* テキスト行 */}
                                <div
                                    className="p-3 cursor-pointer flex items-center justify-between gap-2"
                                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-xs text-white bg-green-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        <span
                                            className="text-sm truncate"
                                            style={{ color: layer.style.color }}
                                        >
                                            {layer.content}
                                        </span>
                                    </div>
                                    {expandedIndex === index ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    )}
                                </div>

                                {/* 展開時の編集パネル */}
                                {expandedIndex === index && (
                                    <div className="p-3 pt-0 space-y-3">
                                        {/* テキスト編集 */}
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">テキスト内容</label>
                                            <input
                                                type="text"
                                                value={layer.content}
                                                onChange={(e) => updateTextContent(index, e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                                placeholder="テキストを入力..."
                                            />
                                        </div>

                                        {/* スタイル編集 */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* 色 */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">色</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={layer.style.color}
                                                        onChange={(e) => updateTextStyle(index, 'color', e.target.value)}
                                                        className="w-8 h-8 rounded border cursor-pointer"
                                                    />
                                                    <span className="text-xs text-gray-500">{layer.style.color}</span>
                                                </div>
                                            </div>

                                            {/* サイズ */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">サイズ</label>
                                                <select
                                                    value={layer.style.fontSize}
                                                    onChange={(e) => updateTextStyle(index, 'fontSize', e.target.value)}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                >
                                                    <option value="small">小</option>
                                                    <option value="medium">中</option>
                                                    <option value="large">大</option>
                                                    <option value="xlarge">特大</option>
                                                </select>
                                            </div>

                                            {/* 太さ */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">太さ</label>
                                                <select
                                                    value={layer.style.fontWeight}
                                                    onChange={(e) => updateTextStyle(index, 'fontWeight', e.target.value)}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                >
                                                    <option value="normal">通常</option>
                                                    <option value="bold">太字</option>
                                                </select>
                                            </div>

                                            {/* フォント */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">フォント</label>
                                                <select
                                                    value={layer.style.fontFamily}
                                                    onChange={(e) => updateTextStyle(index, 'fontFamily', e.target.value)}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                >
                                                    <option value="sans-serif">ゴシック</option>
                                                    <option value="serif">明朝</option>
                                                    <option value="display">装飾</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 使い方ヒント */}
            <div className="text-xs bg-yellow-50 p-3 rounded border border-yellow-200">
                <div className="font-medium text-yellow-800 mb-1">📝 使い方</div>
                <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>編集したいテキストをクリックして展開</li>
                    <li>内容・色・サイズなどを変更</li>
                    <li><strong>すべての編集が終わったら</strong>「すべての変更を反映」ボタンを押す</li>
                </ol>
                <div className="mt-2 text-yellow-600">※ 保存は最後に1回だけ押してください</div>
            </div>

            {/* ボタンエリア */}
            <div className="flex gap-2">
                <Button
                    onClick={handleSave}
                    disabled={isLoading || isSaving}
                    className="flex-1"
                    style={{ backgroundColor: '#48a772', color: 'white' }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            処理中...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            すべての変更を反映
                        </>
                    )}
                </Button>
                <Button
                    onClick={onCancel}
                    variant="outline"
                    disabled={isSaving}
                >
                    <X className="h-4 w-4 mr-2" />
                    キャンセル
                </Button>
            </div>
        </div>
    )
}
