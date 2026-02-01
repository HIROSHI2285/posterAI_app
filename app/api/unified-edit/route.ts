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
    modelMode?: 'production' | 'development'
}

export async function POST(request: NextRequest) {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: UnifiedEditRequest = await request.json()
        const { imageData, textEdits, insertImages, regionEdits, generalPrompt, modelMode = 'production' } = body

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

        const modelName = modelMode === 'development'
            ? 'gemini-2.5-flash-image'
            : (process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview')

        console.log('🤖 Using Model:', modelName, `(Mode: ${modelMode})`)
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseModalities: ['Text', 'Image']
            } as any
        })
        // 統合プロンプトを構築（画像生成を明示的に要求）
        const promptParts: string[] = [
            '【画像編集タスク】',
            'この画像を以下の指示に従って編集し、編集後の画像を生成してください。',
            '**重要: 元画像と全く同じサイズ・解像度で出力してください。画像サイズを変更しないでください。**',
            '**重要: 必ず編集後の画像を出力してください。テキストでの説明は不要です。**',
            ''
        ]

        // 画像挿入を最優先で処理（gemini-2.5-flash-imageで確実に反映させるため）
        if (insertImages && insertImages.length > 0) {
            promptParts.push('')
            promptParts.push('='.repeat(50))
            promptParts.push('【最優先タスク: 画像の挿入・差し替え】')
            promptParts.push('='.repeat(50))
            promptParts.push('')
            promptParts.push(`🔴 **重要**: 元画像の後に${insertImages.length}枚の画像を添付しています。`)
            promptParts.push('これらの添付画像を使って、以下の指示通りに元画像を編集してください。')
            promptParts.push('')
            insertImages.forEach((img, i) => {
                promptParts.push(`📷 **添付画像${i + 1}**: ${img.usage}`)
            })
            promptParts.push('')
            promptParts.push('**処理手順**:')
            promptParts.push('ステップ1: 上記の配置指示を読み、どこをどう編集するか理解する')
            promptParts.push('ステップ2: 「差し替え」の場合は元画像から該当オブジェクトを削除する')
            promptParts.push('ステップ3: 添付画像を適切な位置・サイズで配置する')
            promptParts.push('ステップ4: 元画像のスタイルに自然に馴染ませる')
            promptParts.push('')
            promptParts.push('='.repeat(50))
        }

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
        promptParts.push('- **元画像と全く同じサイズ・解像度で出力（幅・高さを変更しない）**')
        promptParts.push('- 元画像の画質・スタイル・雰囲気を維持')
        promptParts.push('- 文字やロゴは読みやすさを維持')
        promptParts.push('')

        // 日本語文字化け対策を追加
        promptParts.push('【日本語テキスト品質（最重要・厳守）】')
        promptParts.push('⚠️ 日本語の文字化けは絶対に許容されません。以下を必ず守ってください：')
        promptParts.push('')
        promptParts.push('■ フォント選択')
        promptParts.push('- 日本語テキストには必ず日本語対応フォント（Noto Sans JP、游ゴシック、ヒラギノ角ゴ、源ノ角ゴシック、Meiryo、MS ゴシック、小塚ゴシック、モトヤ）のみを使用')
        promptParts.push('- 欧文フォント（Arial、Helvetica、Times New Roman等）を日本語に適用しないでください')
        promptParts.push('- 装飾的すぎるフォントや手書き風フォントは日本語では避けてください')
        promptParts.push('')
        promptParts.push('■ 文字化け防止')
        promptParts.push('- 漢字・ひらがな・カタカナが正しく表示されることを確認してください')
        promptParts.push('- 「□」「？」「●」などの代替文字が表示される場合は不可です')
        promptParts.push('- 文字が切れたり、重なったり、歪んだりしないようにしてください')
        promptParts.push('- 縦書き・横書きどちらの場合も文字が正しく配置されるようにしてください')
        promptParts.push('')
        promptParts.push('■ 視認性とレイアウト')
        promptParts.push('- タイトル、サブタイトル、本文で適切なサイズ階層を設けてください')
        promptParts.push('- 十分な行間・文字間を確保し、詰まりすぎないようにしてください')
        promptParts.push('- 背景色とのコントラストを十分に確保し、読みやすくしてください')
        promptParts.push('')

        promptParts.push('【最終指示】')
        promptParts.push('上記の編集内容をすべて反映した画像を1枚生成してください。')
        promptParts.push('**元画像と全く同じサイズ・解像度で出力してください。**')
        promptParts.push('テキストでの説明は不要です。編集後の画像のみを出力してください。')


        const fullPrompt = promptParts.join('\n')

        // 🔍 デバッグ: プロンプト内容を確認
        console.log('=== UNIFIED EDIT DEBUG ===')
        console.log('📝 Full Prompt:')
        console.log(fullPrompt)
        console.log('')

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

        console.log('🖼️ Base Image:')
        console.log('  - MIME:', imageData.match(/data:([^;]+);/)?.[1])
        console.log('  - Data Length:', imageData.split(',')[1]?.length || 0)

        // 挿入画像を追加
        if (insertImages && insertImages.length > 0) {
            console.log(`📷 Insert Images: ${insertImages.length} image(s)`)
            insertImages.forEach((img, idx) => {
                const mimeType = img.data.match(/data:([^;]+);/)?.[1] || 'image/png'
                const dataLength = img.data.split(',')[1]?.length || 0
                console.log(`  [${idx + 1}] Usage: "${img.usage}"`)
                console.log(`      MIME: ${mimeType}, Data Length: ${dataLength}`)

                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: img.data.split(',')[1]
                    }
                })
            })
        }

        console.log(`✅ Total Parts: ${parts.length} (1 text + ${parts.length - 1} images)`)
        console.log('=========================')

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
