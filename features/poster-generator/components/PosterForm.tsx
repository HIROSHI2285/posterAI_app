"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    PURPOSES,
    TASTES,
    LAYOUTS,
    OUTPUT_SIZES,
    type PosterFormData
} from "@/types/poster"
import { Wand2, Upload, FileImage, X } from "lucide-react"
import { mapToTaste, mapToLayout, mapToPurpose } from "@/lib/mapAnalysisToEnum"
import { notifyFileUploaded, notifyAnalysisComplete } from "@/lib/notifications"

interface PosterFormProps {
    onGenerate?: (formData: Partial<PosterFormData>) => void
    isGenerating?: boolean
    onReset?: () => void
}

const CHAR_LIMITS = {
    mainTitle: 50,
    freeText: 2000,  // イベント詳細、ルール、注意事項などを含められるように拡張
}

export function PosterForm({ onGenerate, isGenerating = false, onReset }: PosterFormProps) {
    const [formData, setFormData] = useState<Partial<PosterFormData>>({
        purpose: "event-ad",
        outputSize: "a4",
        orientation: "portrait",
        taste: "modern",
        layout: "center",
        mainColor: "#5d48a8",
        customWidth: 1920,
        customHeight: 1080,
        customUnit: "px",
    })

    const [errors, setErrors] = useState<{
        mainTitle?: string
        freeText?: string
    }>({})

    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // mm to px conversion at 300 DPI: 1mm = 11.811 pixels
    const mmToPx = (mm: number): number => Math.round(mm * 11.811)
    const pxToMm = (px: number): number => Math.round(px / 11.811)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const newErrors: typeof errors = {}

        if (!formData.mainTitle) {
            newErrors.mainTitle = "メインタイトルは必須です"
        } else if (formData.mainTitle.length > CHAR_LIMITS.mainTitle) {
            newErrors.mainTitle = `メインタイトルは${CHAR_LIMITS.mainTitle}文字以内で入力してください`
        }

        if (formData.freeText && formData.freeText.length > CHAR_LIMITS.freeText) {
            newErrors.freeText = `追加テキストは${CHAR_LIMITS.freeText}文字以内で入力してください`
        }

        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) {
            return
        }

        if (onGenerate) {
            onGenerate(formData)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* 基本設定 */}
            <Card className="border border-gray-300 bg-white">
                <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                    <CardTitle className="text-base font-semibold">基本設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 pb-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="purpose" className="text-sm font-medium">デザイン用途</Label>
                        <Select
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                            required
                            className="w-full"
                        >
                            {PURPOSES.map(purpose => (
                                <option key={purpose.value} value={purpose.value}>
                                    {purpose.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="taste" className="text-sm font-medium">テイスト</Label>
                        <Select
                            id="taste"
                            value={formData.taste}
                            onChange={(e) => setFormData({ ...formData, taste: e.target.value as any })}
                            required
                            className="w-full"
                        >
                            {TASTES.map(taste => (
                                <option key={taste.value} value={taste.value}>
                                    {taste.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="layout" className="text-sm font-medium">レイアウト</Label>
                        <Select
                            id="layout"
                            value={formData.layout}
                            onChange={(e) => setFormData({ ...formData, layout: e.target.value as any })}
                            required
                            className="w-full"
                        >
                            {LAYOUTS.map(layout => (
                                <option key={layout.value} value={layout.value}>
                                    {layout.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* テキスト内容 */}
            <Card className="border border-gray-300 bg-white">
                <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                    <CardTitle className="text-base font-semibold">テキスト内容</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 pb-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="mainTitle" className="text-sm font-medium">
                            メインタイトル <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="mainTitle"
                            type="text"
                            placeholder="例: 夏祭り2024"
                            value={formData.mainTitle || ""}
                            onChange={(e) => {
                                setFormData({ ...formData, mainTitle: e.target.value })
                                if (errors.mainTitle) {
                                    setErrors({ ...errors, mainTitle: undefined })
                                }
                            }}
                            className={errors.mainTitle ? 'border-red-500' : ''}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {formData.mainTitle?.length || 0} / {CHAR_LIMITS.mainTitle}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="freeText" className="text-sm font-medium">追加テキスト</Label>
                        <Textarea
                            id="freeText"
                            placeholder="例: 場所、日時、詳細情報など"
                            value={formData.freeText || ""}
                            onChange={(e) => {
                                setFormData({ ...formData, freeText: e.target.value })
                                if (errors.freeText) {
                                    setErrors({ ...errors, freeText: undefined })
                                }
                            }}
                            rows={6}
                            className={errors.freeText ? 'border-red-500' : ''}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {formData.freeText?.length || 0} / {CHAR_LIMITS.freeText}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 詳細指示（プロンプト） */}
            <Card className="border border-gray-300 bg-white">
                <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                    <CardTitle className="text-base font-semibold">詳細指示（プロンプト）</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 pb-4">
                    {/* カスタム指示テキスト */}
                    <div className="space-y-1.5">
                        <Label htmlFor="detailedPrompt" className="text-sm font-medium">
                            カスタム指示
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            入れたい人物・キャラクター、素材、背景、イメージ、季節感などを自由に指定
                        </p>
                        <Textarea
                            id="detailedPrompt"
                            rows={10}
                            value={formData.detailedPrompt || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, detailedPrompt: e.target.value })
                            }
                            placeholder="例：&#10;・人物：笑顔の若い女性、カジュアルな服装、手を振っているポーズ&#10;・背景：桜の花びらが舞う背景、春らしい明るい雰囲気&#10;・装飾：和風の装飾要素、グラデーション効果&#10;・その他：温かみのある色調、柔らかい光"
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            人物・キャラクター、季節感、素材、背景イメージ、装飾要素、雰囲気など、具体的に記述してください
                        </p>
                    </div>

                    {/* メインカラー */}
                    <div className="space-y-2">
                        <Label htmlFor="mainColor" className="text-sm font-medium">メインカラー</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="mainColor"
                                type="color"
                                value={formData.mainColor}
                                onChange={(e) => setFormData({ ...formData, mainColor: e.target.value })}
                                className="w-20 h-12 cursor-pointer rounded-lg border-2 border-gray-300 p-1"
                                required
                            />
                            <Input
                                type="text"
                                value={formData.mainColor}
                                onChange={(e) => setFormData({ ...formData, mainColor: e.target.value })}
                                className="flex-1 font-mono text-sm border-gray-300"
                                placeholder="#5d48a8"
                            />
                        </div>

                        {/* カラーパレット */}
                        <div className="space-y-1.5 mt-3">
                            <p className="text-xs text-muted-foreground">プリセットカラー</p>
                            <div className="grid grid-cols-6 gap-2">
                                {[
                                    '#FFFFFF', '#000000', '#FF0000', '#FFFF00',
                                    '#0000FF', '#00FF00', '#FF00FF', '#00FFFF',
                                    '#FFA500', '#800080', '#808080', '#FFC0CB'
                                ].map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mainColor: color })}
                                        className={`w-full h-10 rounded-lg border-2 transition-all hover:scale-110 ${formData.mainColor === color
                                            ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                                            : color === '#FFFFFF' ? 'border-gray-400 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 出力サイズ */}
            < Card className="border border-gray-300 bg-white" >
                <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                    <CardTitle className="text-base font-semibold">出力サイズ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 pb-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="outputSize" className="text-sm font-medium">サイズプリセット</Label>
                        <Select
                            id="outputSize"
                            value={formData.outputSize}
                            onChange={(e) => setFormData({ ...formData, outputSize: e.target.value as any })}
                            required
                            className="w-full"
                        >
                            {Object.entries(OUTPUT_SIZES).map(([key, size]) => (
                                <option key={key} value={key}>
                                    {size.label} ({size.description})
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">向き</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, orientation: "portrait" })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.orientation === "portrait"
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="relative">
                                    <div
                                        className="w-14 h-20 rounded-lg shadow-sm transition-all"
                                        style={{
                                            background: formData.orientation === "portrait"
                                                ? 'linear-gradient(135deg, #48a772 0%, #3d8a5f 100%)'
                                                : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                                        }}
                                    ></div>
                                </div>
                                <span className={`text-xs font-medium ${formData.orientation === "portrait" ? 'text-primary' : 'text-muted-foreground'}`}>縦向き</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, orientation: "landscape" })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.orientation === "landscape"
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="relative">
                                    <div
                                        className="w-20 h-14 rounded-lg shadow-sm transition-all"
                                        style={{
                                            background: formData.orientation === "landscape"
                                                ? 'linear-gradient(135deg, #48a772 0%, #3d8a5f 100%)'
                                                : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                                        }}
                                    ></div>
                                </div>
                                <span className={`text-xs font-medium ${formData.orientation === "landscape" ? 'text-primary' : 'text-muted-foreground'}`}>横向き</span>
                            </button>
                        </div>
                    </div>

                    {formData.outputSize === 'custom' && (
                        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-gray-300">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">カスタムサイズ</Label>
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Convert current values to px if switching from mm
                                            if (formData.customUnit === 'mm') {
                                                setFormData({
                                                    ...formData,
                                                    customUnit: 'px',
                                                    customWidth: mmToPx(formData.customWidth || 163),
                                                    customHeight: mmToPx(formData.customHeight || 91)
                                                })
                                            } else {
                                                setFormData({ ...formData, customUnit: 'px' })
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${formData.customUnit === 'px' || !formData.customUnit
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        ピクセル (px)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Convert current values to mm if switching from px
                                            if (formData.customUnit === 'px' || !formData.customUnit) {
                                                setFormData({
                                                    ...formData,
                                                    customUnit: 'mm',
                                                    customWidth: pxToMm(formData.customWidth || 1920),
                                                    customHeight: pxToMm(formData.customHeight || 1080)
                                                })
                                            } else {
                                                setFormData({ ...formData, customUnit: 'mm' })
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${formData.customUnit === 'mm'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        ミリメートル (mm)
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="customWidth" className="text-xs">
                                        幅 {formData.customUnit === 'mm' ? '(mm)' : '(px)'}
                                    </Label>
                                    <Input
                                        id="customWidth"
                                        type="number"
                                        min={formData.customUnit === 'mm' ? 10 : 100}
                                        max={formData.customUnit === 'mm' ? 693 : 8192}
                                        value={formData.customWidth || (formData.customUnit === 'mm' ? 163 : 1920)}
                                        onChange={(e) => setFormData({ ...formData, customWidth: parseInt(e.target.value) })}
                                        className="text-center border-gray-300"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="customHeight" className="text-xs">
                                        高さ {formData.customUnit === 'mm' ? '(mm)' : '(px)'}
                                    </Label>
                                    <Input
                                        id="customHeight"
                                        type="number"
                                        min={formData.customUnit === 'mm' ? 10 : 100}
                                        max={formData.customUnit === 'mm' ? 693 : 8192}
                                        value={formData.customHeight || (formData.customUnit === 'mm' ? 91 : 1080)}
                                        onChange={(e) => setFormData({ ...formData, customHeight: parseInt(e.target.value) })}
                                        className="text-center border-gray-300"
                                    />
                                </div>
                            </div>
                            {/* Reference conversion display */}
                            {formData.customWidth && formData.customHeight && (
                                <p className="text-xs text-muted-foreground text-center">
                                    {formData.customUnit === 'mm'
                                        ? `≈ ${mmToPx(formData.customWidth)} × ${mmToPx(formData.customHeight)} px (300 DPI)`
                                        : `≈ ${pxToMm(formData.customWidth)} × ${pxToMm(formData.customHeight)} mm (300 DPI)`
                                    }
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card >

            {/* ファイルアップロード */}
            < Card className="border border-gray-300 bg-white" >
                <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                    <CardTitle className="text-base font-semibold">ファイルアップロード</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 pb-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">サンプル画像</Label>
                        <p className="text-xs text-muted-foreground mb-2">参考にしたいデザインやレイアウトの画像をアップロード（自動解析します）</p>
                        <div
                            onClick={() => document.getElementById('sampleImageInput')?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-gray-50/50 transition-all min-h-[100px]"
                        >
                            <input
                                id="sampleImageInput"
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp"
                                onChange={async (e) => {
                                    const files = e.target.files
                                    if (files && files[0]) {
                                        const file = files[0]
                                        setFormData({ ...formData, sampleImage: file })

                                        // 画像を自動解析
                                        setIsAnalyzing(true)
                                        try {
                                            const reader = new FileReader()
                                            reader.onload = async (event) => {
                                                try {
                                                    const imageData = event.target?.result as string

                                                    const response = await fetch('/api/analyze-image', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ imageData })
                                                    })

                                                    if (response.ok) {
                                                        const data = await response.json()
                                                        if (data.success && data.analysis) {
                                                            setFormData(prev => {
                                                                // 自動マッピング: フリーテキストをenum値に変換
                                                                const mappedTaste = data.analysis.basicInfo?.taste
                                                                    ? mapToTaste(data.analysis.basicInfo.taste)
                                                                    : prev.taste
                                                                const mappedLayout = data.analysis.basicInfo?.layout
                                                                    ? mapToLayout(data.analysis.basicInfo.layout)
                                                                    : prev.layout
                                                                const mappedPurpose = data.analysis.basicInfo?.purpose
                                                                    ? mapToPurpose(data.analysis.basicInfo.purpose)
                                                                    : prev.purpose

                                                                return {
                                                                    ...prev,
                                                                    mainColor: data.analysis.basicInfo?.mainColor || prev.mainColor,
                                                                    taste: mappedTaste,
                                                                    layout: mappedLayout,
                                                                    purpose: mappedPurpose,
                                                                    // メインタイトル: ユーザー入力がある場合はそれを優先
                                                                    mainTitle: prev.mainTitle || data.analysis.basicInfo?.mainTitle || prev.mainTitle,
                                                                    // 詳細説明を詳細指示フィールドに追加
                                                                    detailedPrompt: data.analysis.detailedDescription || prev.detailedPrompt
                                                                }
                                                            })
                                                            // ブラウザ通知
                                                            notifyAnalysisComplete()
                                                            alert('✨ デザイン要素を抽出しました！\n\n詳細指示フィールドに構成要素が記載されています。\n内容を確認して、必要に応じて編集してください。')
                                                        } else {
                                                            console.error('画像解析エラー: データ形式が不正です', data)
                                                            alert('画像解析に失敗しました。\n画像は保持されますが、自動入力は行われませんでした。')
                                                        }
                                                    } else {
                                                        // エラーレスポンスの詳細を取得
                                                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                                                        console.error('画像解析エラー:', response.status, errorData)
                                                        alert(`画像解析に失敗しました (${response.status})\n${errorData.error || errorData.details || '不明なエラー'}\n\n画像は保持されますが、自動入力は行われませんでした。`)
                                                    }
                                                } catch (error) {
                                                    console.error('画像解析処理エラー:', error)
                                                    alert('画像解析中にエラーが発生しました。\n画像は保持されますが、自動入力は行われませんでした。')
                                                } finally {
                                                    setIsAnalyzing(false)
                                                }
                                            }
                                            reader.onerror = () => {
                                                console.error('ファイル読み込みエラー')
                                                alert('画像ファイルの読み込みに失敗しました。')
                                                setIsAnalyzing(false)
                                            }
                                            reader.readAsDataURL(file)
                                        } catch (error) {
                                            console.error('解析エラー:', error)
                                            alert('画像解析の初期化に失敗しました。')
                                            setIsAnalyzing(false)
                                        }
                                    }
                                }}
                                className="hidden"
                            />
                            {isAnalyzing ? (
                                <>
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-1"></div>
                                    <p className="text-xs text-center text-primary font-medium">解析中...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                                        <Upload className="h-5 w-5 text-primary" />
                                    </div>
                                    <p className="text-xs text-center text-foreground font-medium">クリック</p>
                                    <p className="text-xs text-center text-muted-foreground">PNG, JPG</p>
                                </>
                            )}
                        </div>
                        {formData.sampleImage && (
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs border border-gray-300">
                                <FileImage className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="truncate flex-1">{formData.sampleImage.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, sampleImage: null })}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ボタン */}
            <div className="flex gap-3">
                <Button
                    type="submit"
                    size="lg"
                    className="flex-[2] text-lg py-8"
                    style={{ backgroundColor: '#48a772', color: 'white' }}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin mr-2 h-6 w-6 border-3 border-white border-t-transparent rounded-full" />
                            生成中...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-6 w-6" />
                            ポスター生成
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="flex-1 text-lg py-8 border-2"
                    onClick={onReset}
                    disabled={isGenerating}
                >
                    <X className="mr-2 h-6 w-6" />
                    リセット
                </Button>
            </div>
        </form>
    )
}
