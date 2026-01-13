import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sharp from 'sharp'

// Vercel Pro: 60秒まで延長可能
export const maxDuration = 60

/**
 * 画像アップスケールAPI
 * POST /api/upscale
 * 
 * 入力: 元画像 + スケール倍率
 * 出力: アップスケール済み画像
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
        const { imageData, scale = 2 } = body

        if (!imageData) {
            return NextResponse.json(
                { error: '画像データが必要です' },
                { status: 400 }
            )
        }

        // スケール倍率の検証（1.5〜3倍まで）
        const actualScale = Math.min(Math.max(scale, 1.5), 3)

        console.log(`[Upscale] アップスケール開始 - ユーザー: ${session.user.email}`)
        console.log(`[Upscale] スケール倍率: ${actualScale}x`)

        // 画像データを準備
        const base64Data = imageData.split(',')[1]
        const mimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/png'
        const inputBuffer = Buffer.from(base64Data, 'base64')

        // 元画像のサイズを取得
        const metadata = await sharp(inputBuffer).metadata()
        const originalWidth = metadata.width || 1024
        const originalHeight = metadata.height || 1024
        console.log(`[Upscale] 元画像サイズ: ${originalWidth}x${originalHeight}`)

        // 新しいサイズを計算
        const newWidth = Math.round(originalWidth * actualScale)
        const newHeight = Math.round(originalHeight * actualScale)
        console.log(`[Upscale] アップスケール後サイズ: ${newWidth}x${newHeight}`)

        // Lanczos3アルゴリズムでアップスケール（PNG無圧縮で高画質維持）
        const upscaledBuffer = await sharp(inputBuffer)
            .resize(newWidth, newHeight, {
                kernel: sharp.kernel.lanczos3,
                fit: 'fill'
            })
            .png({ compressionLevel: 0 })
            .toBuffer()

        // Base64にエンコード
        const upscaledBase64 = upscaledBuffer.toString('base64')
        const upscaledImageData = `data:image/png;base64,${upscaledBase64}`

        console.log(`[Upscale] アップスケール完了`)

        return NextResponse.json({
            success: true,
            imageUrl: upscaledImageData,
            originalSize: { width: originalWidth, height: originalHeight },
            upscaledSize: { width: newWidth, height: newHeight },
            scale: actualScale
        })

    } catch (error) {
        console.error('[Upscale] エラー:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'アップスケール中にエラーが発生しました' },
            { status: 500 }
        )
    }
}
