"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { ArrowLeft, LogOut, Users, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PosterForm } from "@/features/poster-generator/components/PosterForm"
import { PosterPreview } from "@/features/poster-generator/components/PosterPreview"
import type { PosterFormData } from "@/types/poster"
import { OUTPUT_SIZES } from "@/types/poster"
import { notifyPosterComplete, requestNotificationPermission } from "@/lib/notifications"

export default function GeneratePage() {
    const { data: session } = useSession()
    const [generatedImage, setGeneratedImage] = useState<string>()
    const [jobMetadata, setJobMetadata] = useState<any>()
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentFormData, setCurrentFormData] = useState<Partial<PosterFormData>>()
    const [progress, setProgress] = useState(0)
    const [isAdmin, setIsAdmin] = useState(false)

    // 管理者権限チェック
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await fetch('/api/admin/check')
                const data = await response.json()
                setIsAdmin(data.isAdmin)
            } catch (error) {
                console.error('Error checking admin status:', error)
                setIsAdmin(false)
            }
        }

        if (session) {
            checkAdmin()
        }
    }, [session])

    // ページロード時に通知許可をリクエスト
    useEffect(() => {
        requestNotificationPermission()
    }, [])

    /**
     * 生成された画像をサイズプリセットに合わせてリサイズ
     */
    const resizeImageToPreset = async (
        imageUrl: string,
        outputSize: string,
        orientation: string,
        customWidth?: number,
        customHeight?: number,
        customUnit?: string
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'

            img.onload = () => {
                // ターゲットサイズを取得
                let targetWidth: number
                let targetHeight: number

                if (outputSize === 'custom' && customWidth && customHeight) {
                    // カスタムサイズの場合
                    const mmToPx = (mm: number) => Math.round(mm * 6.89)
                    targetWidth = customUnit === 'mm' ? mmToPx(customWidth) : customWidth
                    targetHeight = customUnit === 'mm' ? mmToPx(customHeight) : customHeight
                } else {
                    // プリセットサイズの場合
                    const sizeConfig = OUTPUT_SIZES[outputSize as keyof typeof OUTPUT_SIZES]
                    if (!sizeConfig) {
                        resolve(imageUrl) // サイズ不明の場合はそのまま返す
                        return
                    }
                    const dims = sizeConfig[orientation as 'portrait' | 'landscape']
                    targetWidth = dims.width
                    targetHeight = dims.height
                }

                // 既に正しいサイズなら変換不要
                if (img.width === targetWidth && img.height === targetHeight) {
                    console.log(`[Resize] サイズ一致: ${img.width}×${img.height}px`)
                    resolve(imageUrl)
                    return
                }

                console.log(`[Resize] リサイズ実行: ${img.width}×${img.height}px → ${targetWidth}×${targetHeight}px`)

                // Canvasでリサイズ（アスペクト比を維持してカバーフィット）
                const canvas = document.createElement('canvas')
                canvas.width = targetWidth
                canvas.height = targetHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not available'))
                    return
                }

                // アスペクト比を計算
                const srcRatio = img.width / img.height
                const dstRatio = targetWidth / targetHeight

                let sx = 0, sy = 0, sw = img.width, sh = img.height

                if (srcRatio > dstRatio) {
                    // 元画像が横長 → 左右をクロップ
                    sw = img.height * dstRatio
                    sx = (img.width - sw) / 2
                } else {
                    // 元画像が縦長 → 上下をクロップ
                    sh = img.width / dstRatio
                    sy = (img.height - sh) / 2
                }

                // 高品質リサイズ設定
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'

                // 中心クロップしながらリサイズ
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)

                // 高画質PNGで出力
                const resizedUrl = canvas.toDataURL('image/png', 1.0)
                console.log(`[Resize] 完了: ${targetWidth}×${targetHeight}px（アスペクト比維持）`)
                resolve(resizedUrl)
            }

            img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
            img.src = imageUrl
        })
    }

    /**
     * ジョブのステータスをポーリング
     */
    const pollJobStatus = async (jobId: string): Promise<{ imageUrl: string, metadata?: any }> => {
        while (true) {
            const res = await fetch(`/api/jobs/${jobId}`)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                console.error('Job status fetch failed:', res.status, errorData)
                throw new Error(`ジョブステータスの取得に失敗しました: ${errorData.error || res.status}`)
            }

            const job = await res.json()

            // プログレス更新
            setProgress(job.progress)

            if (job.status === 'completed') {
                // ポスター生成完了通知
                notifyPosterComplete()
                return { imageUrl: job.imageUrl, metadata: job.metadata }
            }

            if (job.status === 'failed') {
                throw new Error(job.error || "生成に失敗しました")
            }

            // 2秒待機
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }

    const handleGenerate = async (formData: Partial<PosterFormData>) => {
        setIsGenerating(true)
        setProgress(0)
        setCurrentFormData(formData)

        try {
            // ファイルをbase64に変換する関数
            const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            };

            // リクエストデータを準備
            const requestData: any = {
                ...formData,
            };
            // detailedPromptはそのまま送信（バックエンドで処理）

            // サンプル画像の処理
            if (formData.sampleImage) {
                requestData.sampleImageData = await fileToBase64(formData.sampleImage);
                requestData.sampleImageName = formData.sampleImage.name;
                delete requestData.sampleImage;
            }

            // 素材画像の処理
            if (formData.materials && formData.materials.length > 0) {
                requestData.materialsData = await Promise.all(
                    formData.materials.map(file => fileToBase64(file))
                );
                requestData.materialsNames = formData.materials.map(file => file.name);
                delete requestData.materials;
            }

            console.log("API Request:", requestData)
            console.log("🔍 generationMode確認:", requestData.generationMode)

            // 1. ジョブ作成
            const createResponse = await fetch("/api/jobs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            })

            if (!createResponse.ok) {
                const errorData = await createResponse.json()

                // レート制限エラーの特別処理
                if (createResponse.status === 429) {
                    throw new Error(errorData.message || errorData.error || "本日の生成回数上限に達しました")
                }

                throw new Error(errorData.error || "ジョブ作成に失敗しました")
            }

            const { jobId, remaining, resetAt } = await createResponse.json()
            console.log(`Job created: ${jobId} (${remaining} remaining today)`)

            // 残り回数が少ない場合は警告表示
            if (remaining !== undefined && remaining < 10) {
                console.warn(`⚠️ 残り生成回数: ${remaining}回`)
            }

            // 2. ポーリングで完了を待つ
            const { imageUrl, metadata } = await pollJobStatus(jobId)

            // 3. 生成画像をプリセットサイズに強制リサイズ（サイズ・向きを厳守）
            const resizedUrl = await resizeImageToPreset(
                imageUrl,
                formData.outputSize || 'a4',
                formData.orientation || 'portrait',
                formData.customWidth,
                formData.customHeight,
                formData.customUnit
            )
            setGeneratedImage(resizedUrl)
            setJobMetadata(metadata)
            console.log("生成完了", metadata)

        } catch (error) {
            console.error("生成エラー:", error)
            const errorMessage = error instanceof Error ? error.message : "エラーが発生しました"
            alert(`画像生成エラー: ${errorMessage}\n\nGEMINI_API_KEYが.envファイルに設定されているか確認してください。`)
        } finally {
            setIsGenerating(false)
            setProgress(100)
        }
    }

    const handleRegenerate = () => {
        if (currentFormData) {
            handleGenerate(currentFormData)
        }
    }

    const handleReset = () => {
        setGeneratedImage(undefined)
        setCurrentFormData(undefined)
        setProgress(0)
        // ページをリロードしてフォームを完全にリセット
        window.location.reload()
    }

    return (
        <div className="min-h-screen bg-green-50">
            {/* ヘッダー */}
            <header className="sticky top-0 z-50 bg-white border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* 左側：ロゴとナビゲーション */}
                        <div className="flex items-center gap-6">
                            {/* TOPに戻るボタン */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = '/'}
                                className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700"
                            >
                                <Home className="h-4 w-4" />
                                <span className="hidden sm:inline">ホーム</span>
                            </Button>

                            {/* ロゴ */}
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.location.href = '/'}
                            >
                                <img
                                    src="/posterai-logo.svg"
                                    alt="PosterAI"
                                    className="h-10 sm:h-12"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        </div>

                        {/* 右側：ユーザー情報とアクション */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* ユーザー情報 */}
                            <div className="flex items-center gap-2 hidden sm:flex">
                                {session?.user?.image && (
                                    <img
                                        src={session.user.image}
                                        alt={session.user?.name || 'User'}
                                        className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                                    />
                                )}
                                {session?.user?.email && (
                                    <span className="text-foreground font-medium max-w-[150px] truncate text-sm">
                                        {session.user.email.split('@')[0]}
                                    </span>
                                )}
                            </div>

                            {/* ユーザー管理ボタン（管理者のみ表示） */}
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = '/admin/users'}
                                    className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline">ユーザー管理</span>
                                </Button>
                            )}

                            {/* ログアウトボタン */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">ログアウト</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ：左右2列レイアウト */}
            <div className="container mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
                    {/* 左側：フォーム（縦並び） */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-foreground">画像を生成</h2>
                            <p className="text-sm text-muted-foreground">テンプレートを選んで、テキストを入力すると自動で画像が生成されます</p>
                        </div>
                        <PosterForm
                            onGenerate={handleGenerate}
                            isGenerating={isGenerating}
                            onReset={handleReset}
                        />
                    </div>

                    {/* 右側：プレビューエリア */}
                    <div className="mt-16">
                        <PosterPreview
                            imageUrl={generatedImage}
                            isGenerating={isGenerating}
                            onRegenerate={handleRegenerate}
                            modelMode={currentFormData?.modelMode}
                            metadata={jobMetadata}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
