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
            : (process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview");

        const model = genAI.getGenerativeModel({ model: modelName })

        // プロンプト構築
        const promptParts: string[] = []
        promptParts.push('【CRITICAL INSTRUCTION】')
        promptParts.push('You are an expert graphic designer. Your task is to EDIT the attached reference image.')
        promptParts.push('You MUST strictly apply the exact changes requested below.')
        promptParts.push('Preserve the original art style, layout, background, and characters exactly as they are, EXCEPT where a specific edit is requested.')

        if (textEdits && textEdits.length > 0) {
            promptParts.push('\n【TEXT REPLACEMENT REQUESTS - HIGH PRIORITY】')
            textEdits.forEach((edit, i) => {
                if (edit.isDelete) {
                    promptParts.push(`- REMOVE the text "${edit.original}" completely and naturally fill the background.`)
                } else {
                    promptParts.push(`- REPLACE the EXACT text "${edit.original}" with NEW TEXT: "${edit.newContent}" ${edit.color ? `(Color: ${edit.color})` : ''}`)
                }
            })
        }

        if (maskData && maskPrompt) {
            promptParts.push('\n【REGION SPECIFIC EDIT (MASKED AREA) - STRICT】')
            promptParts.push(`- Edit ONLY the masked area according to this instruction: ${maskPrompt}`)
        }

        if (generalPrompt) {
            promptParts.push('\n【GENERAL EDIT REQUEST - STRICT】')
            promptParts.push('- ' + generalPrompt)
        }

        if (insertImages && insertImages.length > 0) {
            promptParts.push('\n【IMAGE INSERTION - STRICT】')
            insertImages.forEach((img, i) => promptParts.push(`- Integrate image #${i + 1} logically into the scene: ${img.usage}`))
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

        if (modelName.includes('gemini-3.1-flash-image')) {
            imageConfig.imageSize = '2K';
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

        // 修正ポイント2: responseModalities の大文字小文字と構造の修正
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: parts }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                // @ts-ignore
                imageConfig: Object.keys(imageConfig).length > 0 ? imageConfig : undefined
            } as any
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
