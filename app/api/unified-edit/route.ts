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

interface UnifiedEditRequest {
    imageData: string
    textEdits?: TextEdit[]
    insertImages?: { data: string, usage: string }[]
    maskData?: string
    maskPrompt?: string
    generalPrompt?: string
    modelMode?: 'production' | 'development'
    originalDimensions?: { width: number, height: number }
    metadata?: any
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: UnifiedEditRequest = await request.json()
        const { imageData, textEdits, insertImages, maskData, maskPrompt, generalPrompt, modelMode = 'production', originalDimensions, metadata } = body

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
            promptParts.push('\n【Region Specific Edit】')
            promptParts.push(`Edit ONLY the masked area: ${maskPrompt}`)
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

        if (maskData) {
            parts.push({
                inlineData: {
                    data: maskData.split(',')[1],
                    mimeType: maskData.match(/data:([^;]+);/)?.[1] || 'image/png'
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
