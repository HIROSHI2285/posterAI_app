"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { ArrowLeft, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PosterForm } from "@/features/poster-generator/components/PosterForm"
import { PosterPreview } from "@/features/poster-generator/components/PosterPreview"
import type { PosterFormData } from "@/types/poster"

export default function GeneratePage() {
    const { data: session } = useSession()
    const [generatedImage, setGeneratedImage] = useState<string>()
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentFormData, setCurrentFormData] = useState<Partial<PosterFormData>>()
    const [progress, setProgress] = useState(0)

    /**
     * ジョブのステータスをポーリング
     */
    const pollJobStatus = async (jobId: string): Promise<string> => {
        while (true) {
            const res = await fetch(`/api/jobs/${jobId}`)

            if (!res.ok) {
                throw new Error("ジョブステータスの取得に失敗しました")
            }

            const job = await res.json()

            // プログレス更新
            setProgress(job.progress)

            if (job.status === 'completed') {
                return job.imageUrl
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

            // detailedPromptとfreeTextを結合
            const combinedFreeText = [
                formData.freeText,
                formData.detailedPrompt
            ].filter(Boolean).join('\n\n');

            // リクエストデータを準備
            const requestData: any = {
                ...formData,
                freeText: combinedFreeText || formData.freeText,
            };
            delete requestData.detailedPrompt;

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
            const imageUrl = await pollJobStatus(jobId)

            // 3. 画像を表示
            setGeneratedImage(imageUrl)
            console.log("生成完了")

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
                                onClick={() => window.location.href = '/'}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                トップに戻る
                            </Button>

                            {/* ロゴ */}
                            <div className="flex items-center gap-2">
                                <img
                                    src="/posterai-logo.svg"
                                    alt="PosterAI"
                                    className="h-12"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        </div>

                        {/* 右側：ユーザー情報 */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {session?.user?.image && (
                                    <img
                                        src={session.user.image}
                                        alt={session.user?.name || 'User'}
                                        className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm"
                                    />
                                )}
                                {session?.user?.email && (
                                    <span className="text-foreground font-medium max-w-[150px] truncate">
                                        {session.user.email.split('@')[0]}
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="h-4 w-4" />
                                ログアウト
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
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
