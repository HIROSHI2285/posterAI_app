"use client"

import { useState } from "react"
import { Wand2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PosterForm } from "@/features/poster-generator/components/PosterForm"
import { PosterPreview } from "@/features/poster-generator/components/PosterPreview"
import type { PosterFormData } from "@/types/poster"

export default function GeneratePage() {
    const [generatedImage, setGeneratedImage] = useState<string>()
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentFormData, setCurrentFormData] = useState<Partial<PosterFormData>>()

    const handleGenerate = async (formData: Partial<PosterFormData>) => {
        setIsGenerating(true)
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

            // detailedPromptとfreeTextを結合（フロントエンドで処理）
            const combinedFreeText = [
                formData.freeText,
                formData.detailedPrompt
            ].filter(Boolean).join('\n\n');

            // フォームデータを準備（ファイルをbase64に変換）
            const requestData: any = {
                ...formData,
                freeText: combinedFreeText || formData.freeText,
            };
            delete requestData.detailedPrompt;

            // サンプル画像の処理
            if (formData.sampleImage) {
                requestData.sampleImageData = await fileToBase64(formData.sampleImage);
                requestData.sampleImageName = formData.sampleImage.name;
                delete requestData.sampleImage; // File オブジェクトを削除
            }

            // 素材画像の処理
            if (formData.materials && formData.materials.length > 0) {
                requestData.materialsData = await Promise.all(
                    formData.materials.map(file => fileToBase64(file))
                );
                requestData.materialsNames = formData.materials.map(file => file.name);
                delete requestData.materials; // File オブジェクトを削除
            }

            const response = await fetch("/api/generate-poster", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "画像生成に失敗しました")
            }

            if (data.imageData) {
                setGeneratedImage(data.imageData);
                console.log("生成成功:", data.message);
                if (data.textResponse) {
                    console.log("AIの説明:", data.textResponse);
                }
            } else {
                throw new Error("画像データが取得できませんでした");
            }

        } catch (error) {
            console.error("生成エラー:", error)
            const errorMessage = error instanceof Error ? error.message : "エラーが発生しました";
            alert(`画像生成エラー: ${errorMessage}\n\nGEMINI_API_KEYが.envファイルに設定されているか確認してください。`);
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRegenerate = () => {
        if (currentFormData) {
            handleGenerate(currentFormData)
        }
    }

    return (
        <div className="min-h-screen bg-green-50">
            {/* ヘッダー */}
            <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" asChild>
                            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                トップに戻る
                            </a>
                        </Button>
                        <div className="flex items-center">
                            <img
                                src="/posterai-logo.svg"
                                alt="PosterAI"
                                className="h-16"
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        <div className="w-24"></div>
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
                        <PosterForm onGenerate={handleGenerate} isGenerating={isGenerating} />
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
