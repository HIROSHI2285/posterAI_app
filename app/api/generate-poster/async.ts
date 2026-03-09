import { GoogleGenerativeAI } from "@google/generative-ai"
import { jobStore } from "@/lib/job-store-supabase"
import type { PosterFormData } from "@/types/poster"
import { OUTPUT_SIZES } from "@/types/poster"

/**
 * 指定された幅・高さから最も近い Gemini API サポートのアスペクト比文字列を返す
 * サポート ratio: 1:1, 3:4, 4:3, 9:16, 16:9, 21:9, 3:2, 2:3, 5:4, 4:5
 */
function getClosestAspectRatio(width: number, height: number): string {
    const ratio = width / height
    const supported = [
        { str: '9:16', val: 9 / 16 },
        { str: '3:4', val: 3 / 4 },
        { str: '1:1', val: 1 / 1 },
        { str: '4:3', val: 4 / 3 },
        { str: '16:9', val: 16 / 9 },
    ]
    let closest = supported[0]
    let minDiff = Math.abs(ratio - closest.val)
    for (const candidate of supported) {
        const diff = Math.abs(ratio - candidate.val)
        if (diff < minDiff) {
            minDiff = diff
            closest = candidate
        }
    }
    return closest.str
}

/**
 * バックグラウンドでポスターを生成（非同期）
 */
export async function generatePosterAsync(
    jobId: string,
    formData: PosterFormData
): Promise<void> {
    try {
        // ステータス更新: processing
        await jobStore.update(jobId, {
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
            materialsUsages,
            customWidth,
            customHeight,
            customUnit,
            modelMode = 'production',  // モデル選択を追加
            characterDescription,
        } = formData

        // detailedPromptはユーザー入力のカスタム指示、またはサンプル画像解析結果

        // サンプル画像の有無を確認
        if (sampleImageData) {
            console.log(`[Job ${jobId}] サンプル画像を受信 (ファイル名: ${sampleImageName || 'unknown'})`)
        } else {
            console.log(`[Job ${jobId}] サンプル画像なし - テキストのみで生成`)
        }

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
            const mmToPx = (mm: number) => Math.round(mm * 6.89)
            dimensions = {
                width: (customUnit === 'mm' ? mmToPx(customWidth) : customWidth) as number,
                height: (customUnit === 'mm' ? mmToPx(customHeight) : customHeight) as number,
            }
        }

        if (!dimensions) {
            throw new Error("無効な向きです")
        }

        await jobStore.update(jobId, { progress: 20 })

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
            freeText,
            detailedPrompt, // サンプル画像の詳細情報を追加
            orientation,
            dimensions,
            aspectRatio,
            hasSampleImage: !!sampleImageData,
            sampleImageName,
            hasMaterials: !!(materialsData && materialsData.length > 0),
            materialsCount: materialsData?.length || 0,
            generationMode: formData.generationMode || (sampleImageData ? 'image-reference' : 'text-only'),
            imageReferenceStrength: formData.imageReferenceStrength || 'normal',
            characterDescription
        })

        // 素材画像の用途指示をプロンプトに追加（解析結果より優先）
        let finalPrompt = imagePrompt
        if (materialsUsages && materialsUsages.length > 0) {
            const usageInstructions = materialsUsages
                .map((usage: string, index: number) => {
                    if (usage && usage.trim()) {
                        return `【素材画像${index + 1}】${usage.trim()}`
                    }
                    return null
                })
                .filter(Boolean)
                .join('\n')

            if (usageInstructions) {
                finalPrompt = `【重要：素材画像の用途指示（最優先で適用してください）】
${usageInstructions}

${imagePrompt}`
                console.log(`[Job ${jobId}] 素材画像の用途指示を追加:`, usageInstructions)
            }
        }

        console.log(`[Job ${jobId}] 画像生成開始`)

        await jobStore.update(jobId, { progress: 30 })

        // モデル名をmodelModeに基づいて選択
        // production: gemini-3.1-flash-image-preview（最高品質・4K解像度・Flash価格）
        // development: gemini-2.5-flash-image（高速、テスト用）
        const modelName = modelMode === 'development'
            ? "gemini-2.5-flash-image"
            : (process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview")
        console.log(`[Job ${jobId}] 使用モデル: ${modelName} (モード: ${modelMode})`)

        // 選択サイズ・向きから最適なアスペクト比を決定
        const aspectRatioStr = getClosestAspectRatio(dimensions.width, dimensions.height)
        console.log(`[Job ${jobId}] 指定サイズ: ${dimensions.width}×${dimensions.height}px → APIアスペクト比: ${aspectRatioStr}`)

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: modelName
        })
        await jobStore.update(jobId, { progress: 50 })

        // 画像を生成（この部分が時間がかかる）
        await jobStore.update(jobId, { progress: 60 })

        // 生成モードに応じて入力を準備
        // サンプル画像がある場合はデフォルトでimage-referenceを使用（以前の動作に合わせる）
        const generationMode = formData.generationMode || (sampleImageData ? 'image-reference' : 'text-only')
        let generationInput: any

        console.log(`[Job ${jobId}] ===== 生成モード確認 =====`)
        console.log(`[Job ${jobId}] formData.generationMode: ${formData.generationMode}`)
        console.log(`[Job ${jobId}] 最終generationMode: ${generationMode}`)
        console.log(`[Job ${jobId}] sampleImageData存在: ${!!sampleImageData}`)
        console.log(`[Job ${jobId}] 素材画像数: ${materialsData?.length || 0}`)

        // 素材画像をinlineData形式に変換
        const materialInlineImages = (materialsData || []).map((data: string, index: number) => ({
            inlineData: {
                data: data.split(',')[1], // base64部分のみ
                mimeType: data.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
            }
        }))

        if (generationMode === 'image-reference' && sampleImageData) {
            // 画像参照モード: サンプル画像 + 素材画像 + テキストプロンプト
            generationInput = [
                finalPrompt, // テキストを先に配置
                {
                    inlineData: {
                        data: sampleImageData.split(',')[1], // base64部分のみ
                        mimeType: sampleImageData.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
                    }
                },
                ...materialInlineImages
            ]
            const imageDataSize = sampleImageData.split(',')[1].length
            console.log(`[Job ${jobId}] ✅ 画像参照モード: サンプル画像 + 素材${materialInlineImages.length}枚を含めて生成`)
            console.log(`[Job ${jobId}] 画像データサイズ: ${Math.round(imageDataSize / 1024)}KB`)
            console.log(`[Job ${jobId}] 入力: [テキストプロンプト, サンプル画像, 素材画像${materialInlineImages.length}枚]`)
        } else if (materialInlineImages.length > 0) {
            // テキスト + 素材画像モード: 素材画像 + テキストプロンプト
            generationInput = [
                finalPrompt,
                ...materialInlineImages
            ]
            console.log(`[Job ${jobId}] ✅ テキスト+素材モード: 素材${materialInlineImages.length}枚を含めて生成`)
        } else {
            // テキストのみモード: プロンプトのみ（画像は使用しない）
            generationInput = finalPrompt
            console.log(`[Job ${jobId}] ✅ テキストのみモード: プロンプトから新規生成`)
            console.log(`[Job ${jobId}] 入力: テキストプロンプトのみ（画像なし）`)
        }
        console.log(`[Job ${jobId}] ========================`)

        // imageConfig.aspectRatio でアスペクト比を厳守させる
        const imageConfig: Record<string, any> = { aspectRatio: aspectRatioStr }

        // 4K高解像度（Nano Banana 2 対応）
        if (modelName.includes('gemini-3.1-flash-image')) {
            imageConfig.imageSize = '4K';
        }

        // キャラクター一貫性のためのSeed設定
        // 前回のseedが渡されていれば再利用し、なければ新規生成
        let generatedSeed: number | undefined
        if (characterDescription) {
            const previousSeed = (formData as any)?.character_features?.seed
            generatedSeed = previousSeed ?? Math.floor(Math.random() * 1000000)
            imageConfig.seed = generatedSeed
            const isReused = !!previousSeed
            console.log(`[Job ${jobId}] キャラクター一貫性を有効化: Seed=${generatedSeed} (${isReused ? '再利用' : '新規生成'})`)
        }

        const result = await model.generateContent({
            contents: Array.isArray(generationInput)
                ? [{
                    role: 'user', parts: generationInput.map((item: any) =>
                        typeof item === 'string' ? { text: item } : item
                    )
                }]
                : [{ role: 'user', parts: [{ text: generationInput }] }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                // @ts-ignore - imageConfig は @google/generative-ai の型定義に未反映だが API は対応済み
                imageConfig,
            } as any,
        })
        await jobStore.update(jobId, { progress: 70 })

        const response = result.response
        await jobStore.update(jobId, { progress: 80 })

        // finishReasonをチェック
        const candidate = response.candidates?.[0]
        const finishReason = candidate?.finishReason

        console.log(`[Job ${jobId}] Gemini APIレスポンス:`)
        console.log(`  - finishReason: ${finishReason}`)
        console.log(`  - candidateCount: ${response.candidates?.length || 0}`)

        if (candidate) {
            console.log(`  - safetyRatings:`, JSON.stringify(candidate.safetyRatings, null, 2))
            console.log(`  - content parts:`, candidate.content?.parts?.length || 0)
        }

        // エラーチェック
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
            throw new Error("コンテンツポリシー違反: 生成されたコンテンツが安全性基準を満たしていません")
        }

        if (finishReason === 'OTHER' || !candidate?.content?.parts) {
            console.error(`[Job ${jobId}] 画像生成失敗の詳細:`)
            console.error(`  - finishReason: ${finishReason}`)
            console.error(`  - Full response:`, JSON.stringify(response, null, 2))
            throw new Error("画像生成に失敗しました。APIが画像を生成できませんでした。")
        }

        await jobStore.update(jobId, { progress: 85 })

        // レスポンスから画像データを取得
        let imageData: string | null = null

        if (response.candidates && response.candidates[0]) {
            const parts = response.candidates[0].content.parts

            if (Array.isArray(parts)) {
                for (const part of parts) {
                    if (part.inlineData) {
                        const base64Image = part.inlineData.data
                        const mimeType = part.inlineData.mimeType || "image/png"
                        imageData = `data:${mimeType};base64,${base64Image}`
                        console.log(`[Job ${jobId}] 画像生成成功:`, mimeType)
                        break
                    }
                }
            }
        }

        await jobStore.update(jobId, { progress: 90 })

        if (!imageData) {
            throw new Error("画像データが生成されませんでした")
        }

        await jobStore.update(jobId, { progress: 95 })

        // 完了
        await jobStore.update(jobId, {
            status: 'completed',
            progress: 100,
            imageUrl: imageData,
            // @ts-ignore - jobStore types may need update, but we pass metadata safely
            metadata: characterDescription ? {
                gemini_model_version: "3.1",
                character_features: {
                    seed: generatedSeed,
                    description: characterDescription
                }
            } : { gemini_model_version: "3.1" }
        })

        console.log(`[Job ${jobId}] 完了`)

    } catch (error) {
        console.error(`[Job ${jobId}] エラー:`, error)
        await jobStore.update(jobId, {
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
    detailedPrompt?: string
    orientation: 'portrait' | 'landscape'
    dimensions: { width: number; height: number }
    aspectRatio: string
    hasSampleImage: boolean
    sampleImageName?: string
    hasMaterials: boolean
    materialsCount: number
    generationMode?: 'text-only' | 'image-reference'
    imageReferenceStrength?: 'strong' | 'normal' | 'weak'
    characterDescription?: string
}): string {
    const {
        purpose,
        taste,
        layout,
        mainColor,
        mainTitle,
        subTitle,
        freeText,
        detailedPrompt,
        orientation,
        dimensions,
        hasSampleImage,
        generationMode = 'text-only',
        imageReferenceStrength = 'normal',
        characterDescription
    } = params

    const dimensionsText = orientation === 'landscape'
        ? 'landscape orientation (wider than tall)'
        : 'portrait orientation (taller than wide)'

    // 画像参照モード: 強度に応じたプロンプト
    if (generationMode === 'image-reference' && hasSampleImage) {
        // 強度に応じた比率設定
        const ratios = {
            strong: { image: 90, detail: 10 },
            normal: { image: 75, detail: 25 },
            weak: { image: 70, detail: 30 }
        }
        const ratio = ratios[imageReferenceStrength]

        let prompt = `【⚠️ 絶対厳守：ポスターの出力サイズ・向き指定】
出力サイズ: ${dimensions.width}×${dimensions.height}px
向き: ${orientation === 'landscape' ? '横向き（横幅 > 縦幅）' : '縦向き（縦幅 > 横幅）'}
アスペクト比: ${(dimensions.width / dimensions.height).toFixed(3)}

上記のサイズ・向きは、参照画像のアスペクト比よりも【最優先】で適用してください。
参照画像が${orientation === 'landscape' ? '縦長' : '横長'}であっても、必ず${orientation === 'landscape' ? '横長' : '縦長'}のキャンバスでデザインを構成してください。

この画像のデザインを${imageReferenceStrength === 'strong' ? '主な' : ''}参考として、以下の内容でポスターを生成してください。

出力サイズ: ${dimensions.width}×${dimensions.height}px（${orientation}）
タイトル: 「${mainTitle}」`

        if (subTitle) {
            prompt += `\nサブタイトル: 「${subTitle}」`
        }

        // ユーザー指定の設定を優先的に追加
        prompt += `\n\n【ユーザー指定の設定（優先）】`
        prompt += `\n配色: ${mainColor}`
        prompt += `\nスタイル: ${taste}`
        prompt += `\nレイアウト: ${layout}`

        if (freeText) {
            prompt += `\n\n【追加テキスト（最優先で反映）】\n${freeText}`
        }

        prompt += `\n\n【デザイン方針】
画像のビジュアルを${imageReferenceStrength === 'strong' ? '主要な' : ''}参考（約${ratio.image}%の重要度）としつつ、上記のユーザー指定を優先して反映：
- ユーザー指定の配色を最優先で使用
- ユーザー指定のスタイル・レイアウトを適用
- 画像からは構図やビジュアル要素を参考にする
- カスタム指示があれば必ず反映する`

        // 詳細プロンプトは強度に応じた重要度で追加
        if (detailedPrompt) {
            const detailDescriptions = {
                strong: '画像の視覚的要素を主としつつ、この情報も適度に考慮してください',
                normal: '画像の視覚的要素を主としつつ、この情報も考慮してください',
                weak: '画像とこの情報をバランスよく組み合わせてください'
            }

            prompt += `\n\n【詳細な仕様情報】
以下は画像から抽出された詳細情報です（約${ratio.detail}%の重要度）。
${detailDescriptions[imageReferenceStrength]}：

${detailedPrompt}

※ただし、上記のユーザー指定設定（配色、スタイル、レイアウト、カスタム指示）は必ず優先してください。`
        }

        prompt += `

【日本語テキスト品質（最重要・厳守）】
⚠️ 日本語の文字化けは絶対に許容されません。以下を必ず守ってください：

■ フォント選択
- 日本語テキストには必ず日本語対応フォント（Noto Sans JP、游ゴシック、ヒラギノ角ゴ、源ノ角ゴシック、Meiryo、MS ゴシック、小塚ゴシック、モトヤ）のみを使用
- 欧文フォント（Arial、Helvetica、Times New Roman等）を日本語に適用しないでください
- 装飾的すぎるフォントや手書き風フォントは日本語では避けてください

■ 文字化け防止
- 漢字・ひらがな・カタカナが正しく表示されることを確認してください
- 「□」「？」「●」などの代替文字が表示される場合は不可です
- 文字が切れたり、重なったり、歪んだりしないようにしてください
- 縦書き・横書きどちらの場合も文字が正しく配置されるようにしてください

■ 視認性とレイアウト
- タイトル、サブタイトル、本文で適切なサイズ階層を設けてください
- 十分な行間・文字間を確保し、詰まりすぎないようにしてください
- 背景色とのコントラストを十分に確保し、読みやすくしてください

上記のタイトルとテキストを組み込みながら、バランスの取れた高品質なポスターを作成してください。

【MANDATORY COMPOSITION RULE】
- Place all text and subjects at least 10% away from the BOTTOM edge.
- Ensure the entire design is contained within the frame with a safety margin.
- Do not crop the main subject or title.`

        return prompt
    }


    // テキストのみモード: 超詳細プロンプト
    let prompt = `【⚠️ 絶対厳守：ポスターの出力サイズ・向き指定】
出力サイズ: ${dimensions.width}×${dimensions.height}px
向き: ${orientation === 'landscape' ? '横向き（横幅 > 縦幅）' : '縦向き（縦幅 > 横幅）'}
アスペクト比: ${(dimensions.width / dimensions.height).toFixed(3)}

必ず上記の向き・アスペクト比でキャンバス全体を使いデザインを構成してください。

プロフェッショナルなポスターデザインを作成してください。

出力サイズ: ${dimensions.width}×${dimensions.height}px（${orientation}）
タイトル: 「${mainTitle}」`

    if (subTitle) {
        prompt += `\nサブタイトル: 「${subTitle}」`
    }

    prompt += `\n\n【ユーザー指定の設定（必ず反映）】
配色: ${mainColor}
スタイル: ${taste}
レイアウト: ${layout}`

    if (freeText) {
        prompt += `\n\n【追加テキスト（最優先で反映）】\n${freeText}`
    }

    if (characterDescription) {
        prompt += `\n\n【キャラクター指定（一貫性を保持すること）】
以下のキャラクターの特徴を正確に反映し、ポスター内に配置してください：
${characterDescription}`
    }

    // カスタム指示（detailedPrompt）は画像の有無に関係なく反映
    if (detailedPrompt) {
        if (hasSampleImage) {
            prompt += `\n\n【カスタム指示・デザイン仕様】
以下の指示に従って、デザインを作成してください：

${detailedPrompt}

※上記のカスタム指示とユーザー指定設定（配色、スタイル、レイアウト）を必ず優先して反映してください。`
        } else {
            prompt += `\n\n【カスタム指示（必ず反映）】
以下の指示に従って、デザインを作成してください：

${detailedPrompt}

※上記のカスタム指示を必ず反映してください。`
        }
    } else if (hasSampleImage) {
        prompt += `\n\n【デザイン参考情報】
アップロードされたサンプル画像から抽出された要素を参考にしてください：
- 配色とカラーパレット（メインカラー、アクセントカラー、背景色）
- 文字のスタイル（フォント、サイズ、配置、装飾要素）
- レイアウト構成（セクション分け、余白、コンテンツブロック、整列）
- ビジュアル要素（グラフィック、イラスト、アイコン、パターン、装飾）
- 全体の雰囲気とムード

※ただし、上記のユーザー指定設定（配色、スタイル、レイアウト）は必ず優先してください。`
    }

    prompt += `

【日本語テキスト品質（最重要・厳守）】
⚠️ 日本語の文字化けは絶対に許容されません。以下を必ず守ってください：

■ フォント選択
- 日本語テキストには必ず日本語対応フォント（Noto Sans JP、游ゴシック、ヒラギノ角ゴ、源ノ角ゴシック、Meiryo、MS ゴシック、小塚ゴシック、モトヤ）のみを使用
- 欧文フォント（Arial、Helvetica、Times New Roman等）を日本語に適用しないでください
- 装飾的すぎるフォントや手書き風フォントは日本語では避けてください

■ 文字化け防止
- 漢字・ひらがな・カタカナが正しく表示されることを確認してください
- 「□」「？」「●」などの代替文字が表示される場合は不可です
- 文字が切れたり、重なったり、歪んだりしないようにしてください
- 縦書き・横書きどちらの場合も文字が正しく配置されるようにしてください

■ 視認性とレイアウト
- タイトル、サブタイトル、本文で適切なサイズ階層を設けてください
- 十分な行間・文字間を確保し、詰まりすぎないようにしてください
- 背景色とのコントラストを十分に確保し、読みやすくしてください

キャンバス全体を埋める完成度の高いポスターを作成してください。

【MANDATORY COMPOSITION RULE】
- Place all text and subjects at least 10% away from the BOTTOM edge.
- Ensure the entire design is contained within the frame with a safety margin.
- Do not crop the main subject or title.`

    return prompt
}
