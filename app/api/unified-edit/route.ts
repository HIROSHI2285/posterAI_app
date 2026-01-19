import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface TextEdit {
    original: string
    newContent: string
    color?: string
    fontSize?: string
}

interface UnifiedEditRequest {
    imageData: string
    textEdits?: TextEdit[]
    insertImages?: { data: string, usage: string }[]
    maskData?: string
    maskPrompt?: string
}

export async function POST(request: NextRequest) {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: UnifiedEditRequest = await request.json()
        const { imageData, textEdits, insertImages, maskData, maskPrompt } = body

        if (!imageData) {
            return NextResponse.json(
                { error: '画像データが必要です' },
                { status: 400 }
            )
        }

        // Gemini API初期化
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'APIキーが設定されていません' },
                { status: 500 }
            )
        }

        const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp'
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseModalities: ['Text', 'Image']
            } as any
        })

        // 統合プロンプトを構築
        const promptParts: string[] = ['この画像を以下の指示に従って編集してください。\n']

        // テキスト編集の指示
        if (textEdits && textEdits.length > 0) {
            promptParts.push('【テキスト変更】')
            textEdits.forEach((edit, i) => {
                let instruction = `${i + 1}. 「${edit.original}」を「${edit.newContent}」に変更`
                if (edit.color) instruction += `、色を${edit.color}に変更`
                if (edit.fontSize) instruction += `、サイズを${edit.fontSize}に変更`
                promptParts.push(instruction)
            })
            promptParts.push('')
        }

        // 画像挿入の指示
        if (insertImages && insertImages.length > 0) {
            promptParts.push('【画像挿入】')
            insertImages.forEach((img, i) => {
                promptParts.push(`${i + 1}. ${img.usage}`)
            })
            promptParts.push('')
        }

        // マスク編集の指示
        if (maskData && maskPrompt) {
            promptParts.push('【マスク領域の編集】')
            promptParts.push(maskPrompt)
            promptParts.push('')
            promptParts.push('マスク画像の色分け:')
            promptParts.push('- 赤色 = 領域1')
            promptParts.push('- 青色 = 領域2')
            promptParts.push('- 緑色 = 領域3')
            promptParts.push('- 黄色 = 領域4')
            promptParts.push('- マゼンタ = 領域5')
            promptParts.push('')
        }

        promptParts.push('【重要な注意】')
        promptParts.push('1. 指定された編集のみを行い、それ以外の部分は変更しないでください')
        promptParts.push('2. 元の画像のスタイル、品質、解像度を維持してください')
        promptParts.push('3. 編集箇所が自然に馴染むようにしてください')

        const fullPrompt = promptParts.join('\n')

        // 画像データを準備
        const parts: any[] = [
            { text: fullPrompt },
            {
                inlineData: {
                    mimeType: imageData.match(/data:([^;]+);/)?.[1] || 'image/png',
                    data: imageData.split(',')[1]
                }
            }
        ]

        // マスク画像を追加
        if (maskData) {
            parts.push({
                inlineData: {
                    mimeType: maskData.match(/data:([^;]+);/)?.[1] || 'image/png',
                    data: maskData.split(',')[1]
                }
            })
        }

        // 挿入画像を追加
        if (insertImages && insertImages.length > 0) {
            insertImages.forEach((img) => {
                parts.push({
                    inlineData: {
                        mimeType: img.data.match(/data:([^;]+);/)?.[1] || 'image/png',
                        data: img.data.split(',')[1]
                    }
                })
            })
        }

        console.log('Unified edit prompt:', fullPrompt.substring(0, 500))

        const result = await model.generateContent(parts)
        const response = result.response

        // 画像データを探す
        let imageBlob = null
        if (response.candidates && response.candidates.length > 0) {
            const responseParts = response.candidates[0].content?.parts || []
            for (const part of responseParts) {
                if (part.inlineData) {
                    imageBlob = part.inlineData
                    break
                }
            }
        }

        if (!imageBlob) {
            const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text
            console.error('No image in response. Text:', textResponse?.substring(0, 200))
            return NextResponse.json(
                { error: '画像生成に失敗しました。AIが画像を返しませんでした。' },
                { status: 500 }
            )
        }

        const editedImageUrl = `data:${imageBlob.mimeType};base64,${imageBlob.data}`

        return NextResponse.json({
            imageUrl: editedImageUrl,
            success: true
        })

    } catch (error) {
        console.error('Unified edit error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `統合編集中にエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        )
    }
}
