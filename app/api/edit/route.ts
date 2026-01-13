import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Vercel Pro: 60秒まで延長可能
export const maxDuration = 60

/**
 * 画像編集API
 * POST /api/edit
 * 
 * 入力: 元画像 + 編集プロンプト
 * 出力: 編集済み画像
 */
export async function POST(request: Request) {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions)
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // リクエストボディを取得
        const body = await request.json()
        const { imageData, editPrompt } = body

        if (!imageData || !editPrompt) {
            return NextResponse.json(
                { error: '画像データと編集プロンプトが必要です' },
                { status: 400 }
            )
        }

        // APIキーの取得
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini APIキーが設定されていません' },
                { status: 500 }
            )
        }

        console.log(`[Edit] 画像編集開始 - ユーザー: ${session.user.email}`)
        console.log(`[Edit] 編集プロンプト: ${editPrompt}`)

        // Gemini APIクライアントを初期化
        const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview"
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })

        // 編集用プロンプトを構築
        const fullPrompt = `この画像を以下の指示に従って編集してください。指定された部分以外は変更しないでください。

【編集指示】
${editPrompt}

【重要な注意】
- 指示された部分のみを修正し、それ以外の要素（レイアウト、テキスト、その他のビジュアル要素）は可能な限り維持してください
- 元の画像のスタイルと品質を維持してください
- 自然な仕上がりになるよう調整してください`

        // 画像データを準備
        const base64Data = imageData.split(',')[1]
        const mimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/png'

        // 画像編集リクエストを送信
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            },
            fullPrompt
        ])

        const response = result.response
        const candidate = response.candidates?.[0]
        const finishReason = candidate?.finishReason

        console.log(`[Edit] Gemini APIレスポンス - finishReason: ${finishReason}`)

        // エラーチェック
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
            return NextResponse.json(
                { error: 'コンテンツポリシー違反: 生成されたコンテンツが安全性基準を満たしていません' },
                { status: 400 }
            )
        }

        if (finishReason === 'OTHER' || !candidate?.content?.parts) {
            console.error(`[Edit] 画像編集失敗:`, JSON.stringify(response, null, 2))
            return NextResponse.json(
                { error: '画像編集に失敗しました。APIが画像を生成できませんでした。' },
                { status: 500 }
            )
        }

        // レスポンスから画像データを取得
        let editedImageData: string | null = null

        if (response.candidates && response.candidates[0]) {
            const parts = response.candidates[0].content.parts

            if (Array.isArray(parts)) {
                for (const part of parts) {
                    if (part.inlineData) {
                        const base64Image = part.inlineData.data
                        const responseMimeType = part.inlineData.mimeType || "image/png"
                        editedImageData = `data:${responseMimeType};base64,${base64Image}`
                        console.log(`[Edit] 画像編集成功:`, responseMimeType)
                        break
                    }
                }
            }
        }

        if (!editedImageData) {
            return NextResponse.json(
                { error: '編集された画像データが生成されませんでした' },
                { status: 500 }
            )
        }

        console.log(`[Edit] 編集完了`)

        return NextResponse.json({
            success: true,
            imageUrl: editedImageData
        })

    } catch (error) {
        console.error('[Edit] エラー:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '画像編集中にエラーが発生しました' },
            { status: 500 }
        )
    }
}
