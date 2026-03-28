import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

// アスペクト比計算用のヘルパー関数（他のAPIルートと統一）
function getClosestAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    const supported = [
        { str: '9:16', val: 9 / 16 },
        { str: '3:4', val: 3 / 4 },
        { str: '1:1', val: 1 / 1 },
        { str: '4:3', val: 4 / 3 },
        { str: '16:9', val: 16 / 9 },
    ];
    let closest = supported[0];
    let minDiff = Math.abs(ratio - closest.val);
    for (const candidate of supported) {
        const diff = Math.abs(ratio - candidate.val);
        if (diff < minDiff) {
            minDiff = diff;
            closest = candidate;
        }
    }
    return closest.str;
}

interface TextEdit {
    original: string
    newContent: string
    color?: string
    fontSize?: string
    isDelete?: boolean
}

// RegionEdit を使っている箇所はないようですが、元のコードに型自体は存在していたため念のため残すか削除します
interface RegionEdit {
    position: {
        top: number
        left: number
        width: number
        height: number
        description: string
    }
    color: string
}

interface BoundingBox {
    yMin: number  // 0-1000 正規化値
    xMin: number
    yMax: number
    xMax: number
}

interface UnifiedEditRequest {
    imageData: string
    textEdits?: TextEdit[]
    insertImages?: { data: string, usage: string }[]
    maskData?: string
    maskPrompt?: string
    boundingBox?: BoundingBox   // 消去範囲の座標（オプション）
    isRemovalTask?: boolean     // オブジェクト消去が目的かどうか
    generalPrompt?: string
    modelMode?: 'production' | 'development'
    originalDimensions?: { width: number, height: number }
    metadata?: any
}

/**
 * Step 1: Gemini Pro を使ってオブジェクトの精密セグメンテーションマスクを取得する
 * 矩形の粗いマスクの代わりに、オブジェクト輪郭に沿った精密マスクPNGを返す
 */
async function getSegmentationMask(
    genAI: GoogleGenerativeAI,
    imageData: string,
    boundingBox: BoundingBox,
    objectDescription: string
): Promise<string | null> {
    try {
        console.log('🔬 Step 1: Segmentation analysis starting...')
        const analysisModel = genAI.getGenerativeModel({
            model: process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.1-pro-preview'
        })

        // バウンディングボックスを0-1000スケールで記述
        const bboxDesc = `[ymin=${boundingBox.yMin}, xmin=${boundingBox.xMin}, ymax=${boundingBox.yMax}, xmax=${boundingBox.xMax}] (0-1000 scale)`

        const segPrompt = `Identify and segment the object described below from the provided image.

Target region (bounding box): ${bboxDesc}
Object to segment: "${objectDescription}"

Return a JSON object with:
- "label": what the object is
- "box_2d": [ymin, xmin, ymax, xmax] in 0-1000 scale, as precise as possible
- "mask": a base64-encoded PNG (grayscale, 64x64) where pixels belonging to the object are WHITE (255) and background is BLACK (0)
- "confidence": 0.0-1.0

Return ONLY valid JSON, no markdown, no explanation.`

        const segResult = await analysisModel.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: segPrompt },
                    {
                        inlineData: {
                            data: imageData.split(',')[1],
                            mimeType: imageData.match(/data:([^;]+);/)?.[1] || 'image/png'
                        }
                    }
                ]
            }]
        })

        const rawText = segResult.response.text().trim()
        // JSONブロックの抽出（```json ... ``` でラップされている場合も対応）
        const jsonMatch = rawText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.warn('⚠️ Segmentation: No JSON found in response')
            return null
        }

        const segData = JSON.parse(jsonMatch[0])
        console.log(`✅ Segmentation done: label="${segData.label}", confidence=${segData.confidence}, box=${JSON.stringify(segData.box_2d)}`)

        if (!segData.mask || segData.confidence < 0.4) {
            console.warn(`⚠️ Segmentation: Low confidence (${segData.confidence}) or no mask. Falling back.`)
            return null
        }

        // base64マスクをdataURLとして返す
        return `data:image/png;base64,${segData.mask}`

    } catch (err) {
        console.error('❌ Segmentation step failed:', err)
        return null
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: UnifiedEditRequest = await request.json()
        const { imageData, textEdits, insertImages, maskData, maskPrompt, boundingBox, isRemovalTask, generalPrompt, modelMode = 'production', originalDimensions, metadata } = body

        if (!imageData) {
            return NextResponse.json({ error: '画像データが必要です' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            throw new Error('API key is not configured')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const modelName = modelMode === 'development'
            ? "gemini-2.5-flash-image"
            : (process.env.GEMINI_EDIT_MODEL || "gemini-3-pro-image-preview"); // Inpainting対応: 3.1は未対応のため3.0を維持

        console.log(`🎨 Unified Edit using model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        // プロンプト構築（編集の正確な実行 + 非指示領域の保持のバランス）
        const promptParts: string[] = []
        promptParts.push('You are an expert graphic designer editing the attached image.')
        promptParts.push('RULE 1 (HIGHEST PRIORITY): You MUST FULLY execute every edit instruction below. If asked to remove, delete, or erase something, you MUST completely remove it and fill the area naturally with the surrounding background.')
        promptParts.push('RULE 2: Areas NOT mentioned in the instructions below must remain unchanged. Preserve the overall composition, colors, and style of the original image for unaffected areas.')
        promptParts.push('RULE 3: Do NOT regenerate or reimagine the entire image. Only change what is explicitly requested.')

        if (textEdits && textEdits.length > 0) {
            promptParts.push('\n【Text Edits】')
            textEdits.forEach((edit, i) => {
                if (edit.isDelete) {
                    promptParts.push(`${i + 1}. REMOVE the text "${edit.original}" and fill naturally.`)
                } else {
                    promptParts.push(`${i + 1}. Replace "${edit.original}" with "${edit.newContent}" ${edit.color ? `, color: ${edit.color}` : ''}`)
                }
            })
        }

        if (maskData && maskPrompt) {
            const bboxText = boundingBox
                ? `Target coordinates (0-1000 scale): y_min=${boundingBox.yMin}, x_min=${boundingBox.xMin}, y_max=${boundingBox.yMax}, x_max=${boundingBox.xMax}`
                : ''

            if (isRemovalTask) {
                // 消去タスク専用: 明示的な削除指示
                promptParts.push('\n【OBJECT REMOVAL TASK】')
                promptParts.push('TASK: Complete object removal and seamless background reconstruction.')
                if (bboxText) promptParts.push(bboxText)
                promptParts.push(`The highlighted/masked region contains: ${maskPrompt}`)
                promptParts.push('REMOVE IT ENTIRELY from the image.')
                promptParts.push('Reconstruct the background as if this object NEVER EXISTED.')
                promptParts.push('Match surrounding textures, colors, gradients, and lighting EXACTLY.')
                promptParts.push('Do NOT blur, fade, darken, or partially remove. COMPLETE ERASURE AND RECONSTRUCTION required.')
                promptParts.push('The final result must look like a photo taken without the object ever being there.')
                console.log(`🗑️ Object REMOVAL mode: "${maskPrompt}" bbox=${bboxText}`)
            } else {
                // 通常の領域編集
                promptParts.push('\n【Region Specific Edit】')
                if (bboxText) promptParts.push(bboxText)
                promptParts.push(`Edit ONLY the masked/highlighted area: ${maskPrompt}`)
                promptParts.push('Apply the edit naturally, blending with the surrounding style and colors.')
            }
        }

        if (generalPrompt) {
            promptParts.push('\n【General Edit】\n' + generalPrompt)
        }

        if (insertImages && insertImages.length > 0) {
            promptParts.push('\n【Image Insertion】')
            insertImages.forEach((img, i) => promptParts.push(`Integrate image #${i + 1}: ${img.usage}`))
        }

        // キャラクター一貫性の維持
        const imageConfig: Record<string, any> = {}
        if (metadata?.character_features) {
            promptParts.push('\n【Character Consistency】')
            promptParts.push('Maintain appearance of: ' + metadata.character_features.description)
            if (metadata.character_features.seed) {
                imageConfig.seed = metadata.character_features.seed
            }
        }

        // 品質・サイズ要件
        promptParts.push('【Quality Requirements】')
        if (originalDimensions) {
            promptParts.push(`- Resolution: ${originalDimensions.width}x${originalDimensions.height}`)
            imageConfig.aspectRatio = getClosestAspectRatio(originalDimensions.width, originalDimensions.height)
        }
        promptParts.push('\n【MANDATORY COMPOSITION RULE】')
        promptParts.push('- Place all text and subjects at least 10% away from the BOTTOM edge.')
        promptParts.push('- Ensure the entire design is contained within the frame with a safety margin.')
        promptParts.push('- Do not crop the main subject or title.')

        // ----- Step 1 (消去時のみ): Gemini Pro でオブジェクトを精密セグメント認識 -----
        let finalMaskData = maskData  // デフォルトは矩形マスク
        if (isRemovalTask && maskData && maskPrompt && boundingBox) {
            const preciseMask = await getSegmentationMask(genAI, imageData, boundingBox, maskPrompt)
            if (preciseMask) {
                finalMaskData = preciseMask
                console.log('🎯 Using precise segmentation mask for inpainting')
            } else {
                console.log('↩️ Falling back to rectangular mask')
            }
        }

        // 修正ポイント1: parts 配列の要素をすべてオブジェクト形式にする
        const parts: any[] = [
            { text: promptParts.join('\n') },
            {
                inlineData: {
                    data: imageData.split(',')[1],
                    mimeType: imageData.match(/data:([^;]+);/)?.[1] || 'image/png'
                }
            }
        ]

        if (finalMaskData) {
            parts.push({
                inlineData: {
                    data: finalMaskData.split(',')[1],
                    mimeType: finalMaskData.match(/data:([^;]+);/)?.[1] || 'image/png'
                }
            })
        }

        if (insertImages) {
            insertImages.forEach((img) => {
                parts.push({
                    inlineData: {
                        data: img.data.split(',')[1],
                        mimeType: img.data.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
                    }
                })
            })
        }

        // Gemini 3.1 Flash Image Preview: imageConfig は generationConfig 内に配置
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: parts }],
            generationConfig: {
                // @ts-ignore
                responseModalities: ['IMAGE', 'TEXT'],
                ...(Object.keys(imageConfig).length > 0 && { imageConfig }),
            } as any,
        })

        const response = result.response
        let imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)

        if (!imagePart || !imagePart.inlineData) {
            throw new Error('AIが画像を生成しませんでした。プロンプトを見直してください。')
        }

        return NextResponse.json({
            success: true,
            imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
        })

    } catch (error: any) {
        console.error('Unified edit error:', error)
        return NextResponse.json(
            { error: `統合編集中にエラーが発生しました: ${error.message}` },
            { status: 500 }
        )
    }
}
