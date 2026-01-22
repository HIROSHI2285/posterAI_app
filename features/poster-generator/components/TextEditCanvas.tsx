"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X, Save, Type, Palette, Trash2, Plus, Sparkles, ImageIcon, RectangleHorizontal, ListPlus, ChevronDown, ChevronUp, Edit3, ImagePlus, Square } from 'lucide-react'

interface TextLayer {
    content: string
    originalContent: string  // 元のテキストを保持
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
    originalStyle: {
        fontFamily: 'serif' | 'sans-serif' | 'display'
        fontWeight: 'normal' | 'bold'
        fontSize: 'small' | 'medium' | 'large' | 'xlarge'
        color: string
        textAlign: 'left' | 'center' | 'right'
    }  // 元のスタイルを保持
}

export interface TextEditData {
    original: string
    newContent: string
    color?: string
    fontSize?: string
    isDelete?: boolean  // 削除フラグ
}

interface TextEditCanvasProps {
    imageUrl: string
    originalTexts?: string[]  // 元のテキスト一覧
    onSave: (edits: TextEditData[]) => void
    onCancel: () => void
    onModeChange?: (mode: 'general' | 'insert' | 'region') => void  // 他のモードへの切り替え
}

export function TextEditCanvas({ imageUrl, onSave, onCancel, onModeChange }: TextEditCanvasProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [textLayers, setTextLayers] = useState<TextLayer[]>([])
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [markedForDeletion, setMarkedForDeletion] = useState<Set<number>>(new Set())  // 削除対象のインデックス

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
            // 元のテキストとスタイルを保持
            const layersWithOriginal = (data.texts || []).map((layer: TextLayer) => ({
                ...layer,
                originalContent: layer.content,
                originalStyle: { ...layer.style }
            }))
            setTextLayers(layersWithOriginal)
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

    // 削除チェックボックスのトグル
    const toggleDeletion = (index: number) => {
        setMarkedForDeletion(prev => {
            const newSet = new Set(prev)
            if (newSet.has(index)) {
                newSet.delete(index)
            } else {
                newSet.add(index)
            }
            return newSet
        })
    }

    // 保存処理（編集データを返す）
    const handleSave = () => {
        const edits = getEditData()
        console.log(`📝 Text edits: ${edits.length} changes (${markedForDeletion.size} deletions)`)
        onSave(edits)
    }

    // 編集データを取得する共通関数
    const getEditData = (): TextEditData[] => {
        const edits: TextEditData[] = []

        textLayers.forEach((layer, index) => {
            // 削除対象の場合
            if (markedForDeletion.has(index)) {
                edits.push({
                    original: layer.originalContent,
                    newContent: '',  // 空にする
                    isDelete: true
                })
                return
            }

            // コンテンツまたはスタイルに変更があるかチェック
            const contentChanged = layer.content !== layer.originalContent
            const colorChanged = layer.style.color !== layer.originalStyle.color
            const sizeChanged = layer.style.fontSize !== layer.originalStyle.fontSize

            // 変更があった場合のみ追加
            if (contentChanged || colorChanged || sizeChanged) {
                edits.push({
                    original: layer.originalContent,
                    newContent: layer.content,
                    color: colorChanged ? layer.style.color : undefined,
                    fontSize: sizeChanged ? layer.style.fontSize : undefined
                })
            }
        })

        return edits
    }

    // モード切替時に自動保存して切り替え
    const handleModeChangeWithSave = (mode: 'general' | 'insert' | 'region') => {
        const edits = getEditData()
        if (edits.length > 0) {
            console.log(`📝 Auto-saving ${edits.length} text edits before mode switch`)
            onSave(edits)
        }
        onModeChange?.(mode)
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

            {/* モード切り替えボタン */}
            {onModeChange && (
                <div className="flex gap-1 flex-wrap">
                    <Button
                        onClick={() => handleModeChangeWithSave('general')}
                        size="sm"
                        className="h-7 text-xs"
                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                    >
                        <Edit3 className="h-3 w-3 mr-1" />
                        プロンプト編集
                    </Button>
                    <Button
                        onClick={() => handleModeChangeWithSave('insert')}
                        size="sm"
                        className="h-7 text-xs"
                        style={{ backgroundColor: '#9333ea', color: 'white' }}
                    >
                        <ImagePlus className="h-3 w-3 mr-1" />
                        画像挿入
                    </Button>
                    <Button
                        onClick={() => handleModeChangeWithSave('region')}
                        size="sm"
                        className="h-7 text-xs"
                        style={{ backgroundColor: '#ec4899', color: 'white' }}
                    >
                        <Square className="h-3 w-3 mr-1" />
                        矩形選択
                    </Button>
                </div>
            )}

            {/* テキストリスト（編集可能） */}
            <div className="border rounded bg-white overflow-hidden">
                <div className="text-xs text-gray-500 p-2 bg-gray-100 border-b flex justify-between">
                    <span>検出されたテキスト（クリックで編集）</span>
                    <span>{textLayers.length}個</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
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
                                className={`p-3 flex items-center justify-between gap-2 ${markedForDeletion.has(index) ? 'bg-red-50' : ''}`}
                            >
                                {/* 削除チェックボックス */}
                                <input
                                    type="checkbox"
                                    checked={markedForDeletion.has(index)}
                                    onChange={() => toggleDeletion(index)}
                                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 flex-shrink-0"
                                    title="チェックで削除"
                                />
                                <div
                                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                >
                                    <span className={`text-xs text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${markedForDeletion.has(index) ? 'bg-red-500' : 'bg-green-600'}`}>
                                        {index + 1}
                                    </span>
                                    <span
                                        className={`text-sm truncate ${markedForDeletion.has(index) ? 'line-through text-red-400' : ''}`}
                                        style={{ color: markedForDeletion.has(index) ? undefined : layer.style.color }}
                                    >
                                        {layer.content}
                                    </span>
                                </div>
                                {expandedIndex === index ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 cursor-pointer" onClick={() => setExpandedIndex(null)} />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 cursor-pointer" onClick={() => setExpandedIndex(index)} />
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

            {/* 使い方ヒント */}
            <div className="text-xs bg-yellow-50 p-3 rounded border border-yellow-200">
                <div className="font-medium text-yellow-800 mb-1">📝 使い方</div>
                <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>編集したいテキストをクリックして展開</li>
                    <li>内容・色・サイズなどを変更</li>
                    <li><strong>すべての編集が終わったら</strong>「保留リストに追加」ボタンを押す</li>
                </ol>
                <div className="mt-2 text-yellow-600">※ 複数の編集をまとめて実行できます</div>
            </div>

            {/* ボタンエリア */}
            <div className="flex gap-2">
                <Button
                    onClick={handleSave}
                    disabled={isLoading || isSaving}
                    className="flex-1"
                    style={{ backgroundColor: '#f97316', color: 'white' }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            処理中...
                        </>
                    ) : (
                        <>
                            <ListPlus className="h-4 w-4 mr-2" />
                            保留リストに追加
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
