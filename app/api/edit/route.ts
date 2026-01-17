import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from "@google/generative-ai"
import sharp from 'sharp'

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
        const { imageData, editPrompt, insertImagesData, insertImagesUsages } = body
        const insertImages: string[] = insertImagesData || []
        const insertUsages: string[] = insertImagesUsages || []

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

        const hasInsertImages = insertImages.length > 0
        console.log(`[Edit] 画像編集開始 - ユーザー: ${session.user.email}`)
        console.log(`[Edit] 編集プロンプト: ${editPrompt}`)
        console.log(`[Edit] 挿入画像数: ${insertImages.length}`)
        console.log(`[Edit] 挿入画像用途: ${insertUsages.join(', ')}`)

        // Gemini APIクライアントを初期化
        const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview"
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })


        // プロンプトを構築（画像挿入がある場合は統合プロンプト）
        let fullPrompt: string
        if (hasInsertImages) {
            // 各画像の用途を個別に記載
            const imageUsageDescriptions = insertImages.map((_, i) => {
                const usage = insertUsages[i] || '適切な位置に配置'
                return `【${i + 2}枚目の画像】${usage}`
            }).join('\n')

            fullPrompt = `以下の${insertImages.length + 1}枚の画像を使って、編集と画像挿入を同時に行ってください。

【1枚目の画像】ベース画像（ポスター）
この画像をベースにします。

${imageUsageDescriptions}

【編集指示】
${editPrompt}

【重要な注意事項】
1. 出力画像のサイズは必ずベース画像（1枚目）と同じサイズにしてください。挿入画像のサイズに合わせないでください（指示で明示的にサイズ変更を求められた場合を除く）
2. 編集指示に従ってベース画像を修正してください
3. 各挿入画像は上記で指定された用途に従って配置してください
4. 挿入する画像は、できるだけ元の形状・色・デザインを維持してください
5. 挿入画像を変形・歪曲しないでください
6. ベース画像のレイアウトやテキストを可能な限り維持してください
7. 挿入画像がベース画像に自然に馴染むよう、影や光の調整のみ行ってください
8. 高品質で自然な仕上がりになるよう調整してください`
        } else {
            fullPrompt = `【重要】この画像は既に編集済みの可能性があります。以下の新しい編集指示のみを適用してください。

【編集指示】
${editPrompt}

【厳守事項】
1. 編集指示で明示的に変更を求められた部分のみを修正してください
2. 編集指示に含まれていない要素（テキスト、レイアウト、色、画像、デザイン要素）は絶対に変更しないでください
3. この画像は以前の編集の結果である可能性が高いため、現在の画像の状態を完全に維持したまま、新しい編集指示のみを適用してください
4. 元の画像のスタイル、品質、解像度を完全に維持してください
5. 編集指示が曖昧な場合は、最小限の変更に留めてください
6. 自然な仕上がりになるよう、編集部分を周囲に馴染ませてください
7. 編集前の画像と編集後の画像で、指示された部分以外が変わっていないことを確認してください`
        }


        // 画像データを準備
        const base64Data = imageData.split(',')[1]
        const mimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/png'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contentParts: any[] = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]

        // 挿入画像を追加
        for (const insertImg of insertImages) {
            const insertBase64 = insertImg.split(',')[1]
            const insertMimeType = insertImg.match(/data:([^;]+);/)?.[1] || 'image/png'
            contentParts.push({
                inlineData: {
                    data: insertBase64,
                    mimeType: insertMimeType
                }
            })
        }

        // プロンプトを追加
        contentParts.push(fullPrompt)

        // 画像編集リクエストを送信
        const result = await model.generateContent(contentParts)

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

        // 元画像のサイズを取得してリサイズ
        console.log(`[Edit] 元画像サイズを取得中...`)
        const originalBuffer = Buffer.from(base64Data, 'base64')
        const originalMetadata = await sharp(originalBuffer).metadata()
        const originalWidth = originalMetadata.width
        const originalHeight = originalMetadata.height
        console.log(`[Edit] 元画像サイズ: ${originalWidth}x${originalHeight}`)

        // 編集済み画像を元のサイズにリサイズ
        const editedBase64 = editedImageData.split(',')[1]
        const editedBuffer = Buffer.from(editedBase64, 'base64')
        const editedMetadata = await sharp(editedBuffer).metadata()
        console.log(`[Edit] 編集後画像サイズ: ${editedMetadata.width}x${editedMetadata.height}`)

        let finalImageData = editedImageData
        if (originalWidth && originalHeight &&
            (editedMetadata.width !== originalWidth || editedMetadata.height !== originalHeight)) {
            console.log(`[Edit] サイズが異なるためリサイズ実行: ${editedMetadata.width}x${editedMetadata.height} -> ${originalWidth}x${originalHeight}`)
            const resizedBuffer = await sharp(editedBuffer)
                .resize(originalWidth, originalHeight, { fit: 'fill' })
                .toBuffer()
            const resizedBase64 = resizedBuffer.toString('base64')
            const editedMimeType = editedImageData.match(/data:([^;]+);/)?.[1] || 'image/png'
            finalImageData = `data:${editedMimeType};base64,${resizedBase64}`
            console.log(`[Edit] リサイズ完了`)
        }

        console.log(`[Edit] 編集完了`)

        return NextResponse.json({
            success: true,
            imageUrl: finalImageData
        })

    } catch (error) {
        console.error('[Edit] エラー:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '画像編集中にエラーが発生しました' },
            { status: 500 }
        )
    }
}
