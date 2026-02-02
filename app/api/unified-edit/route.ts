import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface TextEdit {
    original: string
    newContent: string
    color?: string
    fontSize?: string
    isDelete?: boolean
}

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
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: UnifiedEditRequest = await request.json()
        const { imageData, textEdits, insertImages, maskData, maskPrompt, generalPrompt, modelMode = 'production', originalDimensions } = body

        if (!imageData) {
            return NextResponse.json(
                { error: '画像データが必要です' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            throw new Error('API key is not configured')
        }

        const genAI = new GoogleGenerativeAI(apiKey)

        // 新規生成と同様のモデル選択ロジック
        const modelName = modelMode === 'development'
            ? "gemini-2.5-flash-image"
            : (process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview");

        console.log(`🎨 Unified Edit using model: ${modelName} (Mode: ${modelMode})`)
        const model = genAI.getGenerativeModel({ model: modelName })

        const promptParts: any[] = []
        promptParts.push('You are an expert graphic designer. Please edit the attached image according to the following instructions.')
        promptParts.push('')

        if (textEdits && textEdits.length > 0) {
            promptParts.push('【Text Edits】')
            textEdits.forEach((edit, i) => {
                let instruction = ''
                if (edit.isDelete) {
                    instruction = `${i + 1}. REMOVE the text "${edit.original}" entirely from the image. Fill the area where the text was located with a natural, seamless background that matches the surrounding colors and textures perfectly.`
                } else {
                    instruction = `${i + 1}. Replace "${edit.original}" with "${edit.newContent}"`
                    if (edit.color) instruction += `, change color to ${edit.color}`
                    if (edit.fontSize) instruction += `, change size to ${edit.fontSize}`
                }
                promptParts.push(instruction)
            })
            promptParts.push('')
        }

        if (maskData && maskPrompt) {
            promptParts.push('【Region Specific Edit】')
            promptParts.push(`Edit ONLY the area indicated by the mask. Instruction: ${maskPrompt}`)
            promptParts.push('Maintain the overall style and composition of the image, only modifying the specified region.')
            promptParts.push('')
        }

        if (generalPrompt) {
            promptParts.push('【General Edit】')
            promptParts.push(generalPrompt)
            promptParts.push('')
        }

        if (insertImages && insertImages.length > 0) {
            promptParts.push('【Image Insertion】')
            insertImages.forEach((img, i) => {
                promptParts.push(`Integrated attached image #${i + 1} as requested: ${img.usage}`)
            })
            promptParts.push('')
        }

        promptParts.push('【Quality Requirements】')
        if (originalDimensions) {
            promptParts.push(`- OUTPUT RESOLUTION: The output image MUST be exactly ${originalDimensions.width}x${originalDimensions.height} pixels.`)
        }
        promptParts.push('- ASPECT RATIO: Maintain the exact same aspect ratio as the input image. DO NOT crop or resize.')
        promptParts.push('- PIXEL PRESERVATION: Do NOT modify any pixels outside of the requested edit areas. Keep the background and other elements identical.')
        promptParts.push('- TEXT LAYOUT: Ensure that the existing text layout remains valid. NO shifting of elements that were not requested to be changed.')
        promptParts.push('- STRICT REMOVAL: When asked to delete text, ensure no traces or shadows of the original characters remain. The background must be perfectly and naturally restored.')
        promptParts.push('- QUALITY: Maintain high resolution and professional quality.')

        const fullPrompt = promptParts.join('\n')
        console.log('Unified edit prompt (No mojibake mitigation):', fullPrompt.substring(0, 500))

        const parts: any[] = [
            fullPrompt,
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
                        mimeType: img.data.match(/data:([^;]+);/)?.[1] || 'image/png'
                    }
                })
            })
        }

        const result = await model.generateContent(parts)
        const response = result.response

        let imageBlob = null
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0]
            if (candidate.content && candidate.content.parts) {
                imageBlob = candidate.content.parts.find((part: any) => part.inlineData)
            }
        }

        if (!imageBlob || !imageBlob.inlineData) {
            const textResponse = response.text()
            console.error('No image in response. Text:', textResponse?.substring(0, 500))
            throw new Error('AI did not return an image. It might have returned text instead.')
        }

        const editedImageUrl = `data:${imageBlob.inlineData.mimeType};base64,${imageBlob.inlineData.data}`

        return NextResponse.json({
            success: true,
            imageUrl: editedImageUrl
        })

    } catch (error: any) {
        console.error('Unified edit error:', error)
        const errorMessage = error.message || 'Unknown error'
        return NextResponse.json(
            { error: `統合編集中にエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        )
    }
}
