import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { imageData, overlayImage, regionPrompts, insertImagesData, insertImagesUsages } = await request.json()

        // バリデーション
        if (!imageData || !overlayImage) {
            return NextResponse.json(
                { error: '必須パラメータが不足しています（元画像とオーバーレイ画像が必要です）' },
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

        // 領域のプロンプトを結合
        const regionPromptsText = Array.isArray(regionPrompts)
            ? regionPrompts.join('\n')
            : ''

        // 画像挿入がある場合
        const hasInsertImages = insertImagesData && insertImagesData.length > 0
        const insertImages = hasInsertImages ? insertImagesData : []
        const insertUsages = hasInsertImages ? (insertImagesUsages || []) : []

        // プロンプト構築（Geminiアドバイスに従う）
        let fullPrompt: string

        if (hasInsertImages) {
            const imageUsageDescriptions = insertImages.map((_: string, i: number) => {
                const usage = insertUsages[i] || '適切な位置に配置'
                return `【画像${i + 1}】${usage}`
            }).join('\n')

            fullPrompt = `以下の2枚の画像を使って編集を行ってください。

【画像1】元の画像
【画像2】編集対象を色で示した画像（色で塗られた部分が編集対象）

【編集指示】
${regionPromptsText}

【挿入画像の用途】
${imageUsageDescriptions}

【重要な注意】
1. 2枚目の画像で色が塗られた領域のみを編集してください
2. それ以外の部分は1ピクセルも変更しないでください
3. 元の画像のスタイル、品質、解像度を完全に維持してください
4. 編集箇所が周囲と自然に馴染むようにしてください
5. 挿入画像は指定された用途に従って配置してください`
        } else {
            fullPrompt = `以下の2枚の画像を使って編集を行ってください。

【画像1】元の画像
【画像2】編集対象を色で示した画像（色で塗られた部分が編集対象）

【編集指示】
${regionPromptsText}

【重要な注意】
1. 2枚目の画像で色が塗られた領域のみを編集してください
2. それ以外の部分は1ピクセルも変更しないでください
3. 元の画像のスタイル、品質、解像度を完全に維持してください
4. 編集箇所が周囲と自然に馴染むようにしてください`
        }

        // 画像データを準備（元画像とオーバーレイ画像の2枚）
        const baseImageBase64 = imageData.split(',')[1]
        const overlayImageBase64 = overlayImage.split(',')[1]
        const baseMimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/png'
        const overlayMimeType = overlayImage.match(/data:([^;]+);/)?.[1] || 'image/png'

        // Gemini APIにリクエスト
        const parts: any[] = [
            { text: fullPrompt },
            {
                inlineData: {
                    mimeType: baseMimeType,
                    data: baseImageBase64
                }
            },
            {
                inlineData: {
                    mimeType: overlayMimeType,
                    data: overlayImageBase64
                }
            }
        ]

        // 挿入画像を追加
        if (hasInsertImages) {
            insertImages.forEach((imgData: string) => {
                const imgBase64 = imgData.split(',')[1]
                const imgMimeType = imgData.match(/data:([^;]+);/)?.[1] || 'image/png'
                parts.push({
                    inlineData: {
                        mimeType: imgMimeType,
                        data: imgBase64
                    }
                })
            })
        }

        console.log('Mask edit prompt:', fullPrompt.substring(0, 500))

        const result = await model.generateContent(parts)
        const response = result.response

        // 応答の詳細をログ出力
        console.log('Gemini response candidates:', JSON.stringify(response.candidates?.length || 0))

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
            // テキスト応答がある場合はログ出力
            const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text
            console.error('No image in response. Text response:', textResponse?.substring(0, 200))
            return NextResponse.json(
                { error: '画像生成に失敗しました。AIが画像を返しませんでした。' },
                { status: 500 }
            )
        }

        // Base64エンコードして返す
        const editedImageUrl = `data:${imageBlob.mimeType};base64,${imageBlob.data}`

        return NextResponse.json({
            imageUrl: editedImageUrl,
            success: true
        })

    } catch (error) {
        console.error('Edit region error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `領域編集中にエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        )
    }
}
