import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Vercel Pro: 60秒まで延長可能
export const maxDuration = 60

/**
 * 画像挿入API
 * POST /api/insert
 * 
 * 入力: ベース画像 + 挿入画像 + 配置プロンプト
 * 出力: 合成済み画像
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
        const { baseImageData, insertImageData, insertPrompt } = body

        if (!baseImageData || !insertImageData || !insertPrompt) {
            return NextResponse.json(
                { error: 'ベース画像、挿入画像、配置プロンプトが必要です' },
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

        console.log(`[Insert] 画像挿入開始 - ユーザー: ${session.user.email}`)
        console.log(`[Insert] 配置プロンプト: ${insertPrompt}`)

        // Gemini APIクライアントを初期化
        const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview"
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })

        // 挿入用プロンプトを構築（元画像を維持しつつ馴染むように強調）
        const fullPrompt = `以下の2つの画像を合成してください。

【1枚目の画像】ベース画像（ポスター）
この画像の全体的なデザイン、レイアウト、テキスト、色合いを可能な限り維持してください。

【2枚目の画像】挿入する画像
この画像を以下の指示に従って、ベース画像に挿入・合成してください。

【配置指示】
${insertPrompt}

【重要な注意事項】
1. 挿入する画像は、できるだけ元の形状・色・デザインを維持してください
2. 挿入画像を変形・歪曲しないでください
3. ベース画像のレイアウトやテキストを可能な限り維持してください
4. 挿入画像がベース画像に自然に馴染むよう、影や光の調整のみ行ってください
5. 高品質で自然な仕上がりになるよう調整してください`

        // 画像データを準備
        const baseBase64 = baseImageData.split(',')[1]
        const baseMimeType = baseImageData.match(/data:([^;]+);/)?.[1] || 'image/png'

        const insertBase64 = insertImageData.split(',')[1]
        const insertMimeType = insertImageData.match(/data:([^;]+);/)?.[1] || 'image/png'

        // 画像挿入リクエストを送信（2つの画像 + プロンプト）
        const result = await model.generateContent([
            {
                inlineData: {
                    data: baseBase64,
                    mimeType: baseMimeType
                }
            },
            {
                inlineData: {
                    data: insertBase64,
                    mimeType: insertMimeType
                }
            },
            fullPrompt
        ])

        const response = result.response
        const candidate = response.candidates?.[0]
        const finishReason = candidate?.finishReason

        console.log(`[Insert] Gemini APIレスポンス - finishReason: ${finishReason}`)

        // エラーチェック
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
            return NextResponse.json(
                { error: 'コンテンツポリシー違反: 生成されたコンテンツが安全性基準を満たしていません' },
                { status: 400 }
            )
        }

        if (finishReason === 'OTHER' || !candidate?.content?.parts) {
            console.error(`[Insert] 画像挿入失敗:`, JSON.stringify(response, null, 2))
            return NextResponse.json(
                { error: '画像挿入に失敗しました。APIが画像を生成できませんでした。' },
                { status: 500 }
            )
        }

        // レスポンスから画像データを取得
        let insertedImageData: string | null = null

        if (response.candidates && response.candidates[0]) {
            const parts = response.candidates[0].content.parts

            if (Array.isArray(parts)) {
                for (const part of parts) {
                    if (part.inlineData) {
                        const base64Image = part.inlineData.data
                        const responseMimeType = part.inlineData.mimeType || "image/png"
                        insertedImageData = `data:${responseMimeType};base64,${base64Image}`
                        console.log(`[Insert] 画像挿入成功:`, responseMimeType)
                        break
                    }
                }
            }
        }

        if (!insertedImageData) {
            return NextResponse.json(
                { error: '合成された画像データが生成されませんでした' },
                { status: 500 }
            )
        }

        console.log(`[Insert] 挿入完了`)

        return NextResponse.json({
            success: true,
            imageUrl: insertedImageData
        })

    } catch (error) {
        console.error('[Insert] エラー:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '画像挿入中にエラーが発生しました' },
            { status: 500 }
        )
    }
}
