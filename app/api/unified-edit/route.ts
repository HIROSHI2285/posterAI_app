import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface TextEdit {
    original: string
    newContent: string
    color?: string
    fontSize?: string
    isDelete?: boolean  // 削除フラグ
}

interface RegionEdit {
    position: {
        top: number
        left: number
        width: number
        height: number
        description: string
    }
    prompt: string
}

interface UnifiedEditRequest {
    imageData: string
    textEdits?: TextEdit[]
    insertImages?: { data: string, usage: string }[]
    regionEdits?: RegionEdit[]
    generalPrompt?: string
}

export async function POST(request: NextRequest) {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: UnifiedEditRequest = await request.json()
        const { imageData, textEdits, insertImages, regionEdits, generalPrompt } = body

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

        const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'  // テスト用
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseModalities: ['Text', 'Image']
            } as any
        })

        // 統合プロンプトを構築
        const promptParts: string[] = ['この画像を以下の指示に従って編集してください。\n']

        // 全般的なプロンプト
        if (generalPrompt) {
            promptParts.push('【全般的な編集】')
            promptParts.push(generalPrompt)
            promptParts.push('')
        }

        // テキスト編集の指示
        if (textEdits && textEdits.length > 0) {
            const deletions = textEdits.filter(e => e.isDelete)
            const changes = textEdits.filter(e => !e.isDelete)

            // テキスト変更
            if (changes.length > 0) {
                promptParts.push('【テキスト変更】')
                changes.forEach((edit, i) => {
                    let instruction = `${i + 1}. 「${edit.original}」を「${edit.newContent}」に変更`
                    if (edit.color) instruction += `、色を${edit.color}に変更`
                    if (edit.fontSize) instruction += `、サイズを${edit.fontSize}に変更`
                    promptParts.push(instruction)
                })
                promptParts.push('')
            }

            // テキスト削除
            if (deletions.length > 0) {
                promptParts.push('')
                promptParts.push('='.repeat(50))
                promptParts.push('【重要: テキストの削除】')
                promptParts.push('='.repeat(50))
                promptParts.push('')
                promptParts.push('以下のテキストを画像から完全に削除してください。')
                promptParts.push('**削除後は、背景と周囲のデザインに自然に馴染むように補正してください。**')
                promptParts.push('')
                deletions.forEach((edit, i) => {
                    promptParts.push(`${i + 1}. 「${edit.original}」を削除`)
                })
                promptParts.push('')
                promptParts.push('**厳守事項**:')
                promptParts.push('1. テキストを完全に削除してください')
                promptParts.push('2. 削除した箇所は周囲の背景・デザインに馴染むように塗りつぶしてください')
                promptParts.push('3. 空白を残さず、自然な見た目にしてください')
                promptParts.push('')
                promptParts.push('='.repeat(50))
            }
        }

        // 画像挿入の指示
        if (insertImages && insertImages.length > 0) {
            promptParts.push('')
            promptParts.push('='.repeat(50))
            promptParts.push('【重要: 画像の挿入・差し替え】')
            promptParts.push('='.repeat(50))
            promptParts.push('')
            promptParts.push(`以下に${insertImages.length}枚の画像を添付しています。`)
            promptParts.push('**これらの画像を必ず元画像に合成・挿入してください。**')
            promptParts.push('')
            insertImages.forEach((img, i) => {
                promptParts.push(`【画像${i + 1}番の使用方法】`)
                promptParts.push(`${img.usage}`)
                promptParts.push('')
            })
            promptParts.push('**厳守事項**:')
            promptParts.push('1. 上記の指示通りに画像を配置・合成してください')
            promptParts.push('2. 画像のサイズは指示に合わせて適切に調整してください')
            promptParts.push('3. 画像の品質を保ちながら、元画像と自然に馴染むように処理してください')
            promptParts.push('')
            promptParts.push('='.repeat(50))
        }

        // 矩形領域編集の指示
        if (regionEdits && regionEdits.length > 0) {
            console.log('🎯 Region Edit Detected:')
            console.log('  - Region count:', regionEdits.length)

            promptParts.push('')
            promptParts.push('='.repeat(50))
            promptParts.push('【重要: 矩形領域限定編集】')
            promptParts.push('='.repeat(50))
            promptParts.push('')
            promptParts.push('以下の指定された矩形領域のみを編集してください。')
            promptParts.push('**指定領域以外は絶対に変更しないでください。1ピクセルも変更禁止です。**')
            promptParts.push('')

            const colorNames = ['赤', '青', '緑', '黄', 'マゼンタ']
            regionEdits.forEach((edit, idx) => {
                const colorName = colorNames[idx % colorNames.length]
                promptParts.push(`【${colorName}色の領域${idx + 1}】`)
                promptParts.push(`位置: ${edit.position.description}`)
                promptParts.push(`  - 上端から ${edit.position.top.toFixed(1)}%`)
                promptParts.push(`  - 左端から ${edit.position.left.toFixed(1)}%`)
                promptParts.push(`  - 幅: ${edit.position.width.toFixed(1)}%`)
                promptParts.push(`  - 高さ: ${edit.position.height.toFixed(1)}%`)
                promptParts.push(`編集内容: ${edit.prompt}`)
                promptParts.push('')
            })

            promptParts.push('**厳守事項**:')
            promptParts.push('1. 上記の矩形領域「のみ」を編集してください')
            promptParts.push('2. 指定領域外は1ピクセルも変更しないでください')
            promptParts.push('3. 編集領域と非編集領域の境界は自然に馴染むように処理してください')
            promptParts.push('4. 元画像の解像度、画質、全体的なスタイルを維持してください')
            promptParts.push('')
            promptParts.push('='.repeat(50))
        }

        // 品質要件を追加
        promptParts.push('')
        promptParts.push('【品質要件】')
        promptParts.push('- 元画像の画質・スタイル・雰囲気を維持')
        promptParts.push('- 文字やロゴは読みやすさを維持')


        const fullPrompt = promptParts.join('\n')

        // 画像データを準備（1枚のみ）
        const parts: any[] = [
            { text: fullPrompt },
            {
                inlineData: {
                    mimeType: imageData.match(/data:([^;]+);/)?.[1] || 'image/png',
                    data: imageData.split(',')[1]
                }
            }
        ]

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

        // 詳細なレスポンスログ
        console.log('=== Gemini API Response Details ===')
        console.log('Candidates count:', response.candidates?.length || 0)
        console.log('Finish reason:', response.candidates?.[0]?.finishReason)
        console.log('Safety ratings:', JSON.stringify(response.candidates?.[0]?.safetyRatings))
        console.log('Parts count:', response.candidates?.[0]?.content?.parts?.length || 0)

        // 各パートの型を確認
        if (response.candidates?.[0]?.content?.parts) {
            response.candidates[0].content.parts.forEach((part: any, idx: number) => {
                console.log(`Part ${idx}:`, {
                    hasText: !!part.text,
                    hasInlineData: !!part.inlineData,
                    textPreview: part.text?.substring(0, 100)
                })
            })
        }

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
            console.error('❌ No image in response!')
            console.error('Full response:', JSON.stringify(response, null, 2))
            console.error('Text response:', textResponse?.substring(0, 500))
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
