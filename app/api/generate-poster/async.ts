import { GoogleGenerativeAI } from "@google/generative-ai"
import { jobStore } from "@/lib/job-store"
import type { PosterFormData } from "@/types/poster"
import { OUTPUT_SIZES } from "@/types/poster"

/**
 * バックグラウンドでポスターを生成（非同期）
 */
export async function generatePosterAsync(
    jobId: string,
    formData: PosterFormData
): Promise<void> {
    try {
        // ステータス更新: processing
        jobStore.update(jobId, {
            status: 'processing',
            progress: 10
        })

        const {
            purpose,
            outputSize,
            orientation = 'portrait',
            taste,
            layout,
            mainColor,
            mainTitle,
            subTitle,
            freeText,
            detailedPrompt,
            sampleImageData,
            sampleImageName,
            materialsData,
            materialsNames,
            customWidth,
            customHeight,
            customUnit,
        } = formData

        // detailedPromptとfreeTextを結合
        const combinedFreeText = [freeText, detailedPrompt]
            .filter(Boolean)
            .join('\n\n') || freeText

        // APIキーの取得
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            throw new Error("Gemini APIキーが設定されていません")
        }

        // 出力サイズの取得
        const sizeConfig = OUTPUT_SIZES[outputSize as keyof typeof OUTPUT_SIZES]
        if (!sizeConfig) {
            throw new Error("無効な出力サイズです")
        }

        let dimensions: { width: number; height: number } | undefined = sizeConfig[orientation as 'portrait' | 'landscape']

        // カスタムサイズの場合、mmをpxに変換
        if (outputSize === 'custom' && customWidth && customHeight) {
            const mmToPx = (mm: number) => Math.round(mm * 11.811)
            dimensions = {
                width: (customUnit === 'mm' ? mmToPx(customWidth) : customWidth) as number,
                height: (customUnit === 'mm' ? mmToPx(customHeight) : customHeight) as number,
            }
        }

        if (!dimensions) {
            throw new Error("無効な向きです")
        }

        jobStore.update(jobId, { progress: 20 })

        // アスペクト比を計算
        const aspectRatio = (dimensions.width / dimensions.height).toFixed(3)

        // プロンプトを構築
        const imagePrompt = buildImagePrompt({
            purpose,
            taste,
            layout,
            mainColor,
            mainTitle,
            subTitle,
            freeText: combinedFreeText,
            orientation,
            dimensions,
            aspectRatio,
            hasSampleImage: !!sampleImageData,
            sampleImageName,
            hasMaterials: !!(materialsData && materialsData.length > 0),
            materialsCount: materialsData?.length || 0,
        })

        console.log(`[Job ${jobId}] 画像生成開始`)

        jobStore.update(jobId, { progress: 30 })

        // Google AI SDK初期化
        const genAI = new GoogleGenerativeAI(apiKey)
        jobStore.update(jobId, { progress: 40 })

        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-image-preview"
        })
        jobStore.update(jobId, { progress: 50 })

        // 画像を生成（この部分が時間がかかる）
        jobStore.update(jobId, { progress: 60 })
        const result = await model.generateContent(imagePrompt)
        jobStore.update(jobId, { progress: 70 })

        const response = result.response
        jobStore.update(jobId, { progress: 80 })

        // finishReasonをチェック
        const candidate = response.candidates?.[0]
        const finishReason = candidate?.finishReason

        console.log(`[Job ${jobId}] Finish Reason:`, finishReason)

        // エラーチェック
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
            throw new Error("コンテンツポリシー違反: 生成されたコンテンツが安全性基準を満たしていません")
        }

        if (finishReason === 'OTHER' || !candidate?.content?.parts) {
            throw new Error("画像生成に失敗しました。APIが画像を生成できませんでした。")
        }

        jobStore.update(jobId, { progress: 85 })

        // レスポンスから画像データを取得
        let imageData: string | null = null

        if (response.candidates && response.candidates[0]) {
            const parts = response.candidates[0].content.parts

            if (Array.isArray(parts)) {
                for (const part of parts) {
                    // @ts-ignore
                    if (part.inlineData) {
                        // @ts-ignore
                        const base64Image = part.inlineData.data
                        // @ts-ignore
                        const mimeType = part.inlineData.mimeType || "image/png"
                        imageData = `data:${mimeType};base64,${base64Image}`
                        console.log(`[Job ${jobId}] 画像生成成功:`, mimeType)
                        break
                    }
                }
            }
        }

        jobStore.update(jobId, { progress: 90 })

        if (!imageData) {
            throw new Error("画像データが生成されませんでした")
        }

        jobStore.update(jobId, { progress: 95 })

        // 完了
        jobStore.update(jobId, {
            status: 'completed',
            progress: 100,
            imageUrl: imageData
        })

        console.log(`[Job ${jobId}] 完了`)

    } catch (error) {
        console.error(`[Job ${jobId}] エラー:`, error)
        jobStore.update(jobId, {
            status: 'failed',
            progress: 0,
            error: error instanceof Error ? error.message : '不明なエラーが発生しました'
        })
    }
}

/**
 * 画像生成用のプロンプトを構築
 */
function buildImagePrompt(params: {
    purpose: string
    taste: string
    layout: string
    mainColor: string
    mainTitle: string
    subTitle?: string
    freeText?: string
    orientation: string
    dimensions: { width: number; height: number }
    aspectRatio: string
    hasSampleImage?: boolean
    sampleImageName?: string
    hasMaterials?: boolean
    materialsCount?: number
}): string {
    const {
        purpose,
        taste,
        layout,
        mainColor,
        mainTitle,
        subTitle,
        freeText,
        orientation,
        dimensions,
        aspectRatio,
        hasSampleImage,
        sampleImageName,
        hasMaterials,
        materialsCount,
    } = params

    const dimensionsText = orientation === 'landscape'
        ? 'landscape orientation (wider than tall)'
        : 'portrait orientation (taller than wide)'

    let prompt = `プロフェッショナルなポスターデザインを作成してください。

サイズ: ${dimensions.width}×${dimensions.height}px（${orientation}）
タイトル: 「${mainTitle}」`

    if (subTitle) {
        prompt += `\nサブタイトル: 「${subTitle}」`
    }

    if (freeText) {
        prompt += `\n追加テキスト: 「${freeText}」`
    }

    prompt += `
配色: ${mainColor}
スタイル: ${taste}
レイアウト: ${layout}`

    // サンプル画像参照を追加
    if (hasSampleImage) {
        prompt += `\n\n【重要】デザイン参考画像について:
アップロードされたサンプル画像が目指すべきビジュアルスタイルを示しています。以下の要素を注意深く分析し、忠実に再現してください:
- 配色とカラーパレット（メインカラー、アクセントカラー、背景色）
- 文字のスタイル（フォント、サイズ、配置、装飾要素）
- レイアウト構成（セクション分け、余白、コンテンツブロック、整列）
- ビジュアル要素（グラフィック、イラスト、アイコン、パターン、装飾）
- 全体の雰囲気とムード（お祭り的、プロフェッショナル、ポップ、エレガントなど）

これらのデザイン特性を忠実に再現しながら、指定されたタイトルとテキストを組み込んでください。`
    }

    prompt += `\n\nキャンバス全体を埋める完成度の高いポスターを作成してください。余白なしでエッジまでデザインを広げてください。`

    return prompt
}
