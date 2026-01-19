import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface TextLayer {
    content: string
    bbox: {
        x: number
        y: number
        width: number
        height: number
    }
    style: {
        fontFamily: 'serif' | 'sans-serif' | 'display'
        fontWeight: 'normal' | 'bold'
        fontSize: 'small' | 'medium' | 'large' | 'xlarge'
        color: string
        textAlign: 'left' | 'center' | 'right'
    }
}

interface ExtractTextLayersResponse {
    texts: TextLayer[]
}

const EXTRACTION_PROMPT = `
この画像から全てのテキストを検出し、以下のJSON形式で返してください。JSONのみを返し、他の説明は不要です。

{
  "texts": [
    {
      "content": "検出されたテキスト",
      "bbox": {
        "x": 0-1000の相対X座標（左端が0、右端が1000）,
        "y": 0-1000の相対Y座標（上端が0、下端が1000）,
        "width": 0-1000の相対幅,
        "height": 0-1000の相対高さ
      },
      "style": {
        "fontFamily": "serif" | "sans-serif" | "display",
        "fontWeight": "normal" | "bold",
        "fontSize": "small" | "medium" | "large" | "xlarge",
        "color": "#HEX形式",
        "textAlign": "left" | "center" | "right"
      }
    }
  ]
}

注意事項:
- すべてのテキストを必ず検出してください
- 座標は0-1000の相対値で返してください
- 色は必ず#から始まる6桁のHEX形式で返してください（例: #FF0000）
- fontFamilyはセリフ体（明朝体）ならserif、ゴシック体ならsans-serif、装飾的ならdisplayを選択
- fontSizeは画像全体に対する相対的な大きさで判断:
  - small: 画面の3%程度
  - medium: 画面の5%程度
  - large: 画面の8%程度
  - xlarge: 画面の12%以上
- textAlignは左寄せならleft、中央ならcenter、右寄せならright
`

export async function POST(request: NextRequest) {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { imageData } = await request.json()

        if (!imageData) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
        }

        // APIキーの確認
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set')
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        // Gemini Vision APIを使用してテキストを抽出
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp'
        })

        // Base64データの準備
        const base64Data = imageData.includes(',')
            ? imageData.split(',')[1]
            : imageData

        const result = await model.generateContent([
            { text: EXTRACTION_PROMPT },
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data
                }
            }
        ])

        const responseText = result.response.text()

        // JSONのパース（コードブロックがある場合は除去）
        let jsonText = responseText.trim()
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        let parsedResponse: ExtractTextLayersResponse
        try {
            parsedResponse = JSON.parse(jsonText)
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText)
            return NextResponse.json({
                error: 'Failed to parse text extraction response',
                rawResponse: responseText
            }, { status: 500 })
        }

        // レスポンスの検証
        if (!parsedResponse.texts || !Array.isArray(parsedResponse.texts)) {
            return NextResponse.json({
                error: 'Invalid response format',
                texts: []
            }, { status: 200 })
        }

        // 各テキストレイヤーの検証と正規化
        const normalizedTexts: TextLayer[] = parsedResponse.texts.map((text) => ({
            content: text.content || '',
            bbox: {
                x: Math.max(0, Math.min(1000, text.bbox?.x || 0)),
                y: Math.max(0, Math.min(1000, text.bbox?.y || 0)),
                width: Math.max(0, Math.min(1000, text.bbox?.width || 100)),
                height: Math.max(0, Math.min(1000, text.bbox?.height || 50))
            },
            style: {
                fontFamily: ['serif', 'sans-serif', 'display'].includes(text.style?.fontFamily)
                    ? text.style.fontFamily
                    : 'sans-serif',
                fontWeight: ['normal', 'bold'].includes(text.style?.fontWeight)
                    ? text.style.fontWeight
                    : 'normal',
                fontSize: ['small', 'medium', 'large', 'xlarge'].includes(text.style?.fontSize)
                    ? text.style.fontSize
                    : 'medium',
                color: /^#[0-9A-Fa-f]{6}$/.test(text.style?.color)
                    ? text.style.color
                    : '#000000',
                textAlign: ['left', 'center', 'right'].includes(text.style?.textAlign)
                    ? text.style.textAlign
                    : 'center'
            }
        }))

        return NextResponse.json({ texts: normalizedTexts })

    } catch (error) {
        console.error('Text extraction error:', error)
        return NextResponse.json({
            error: 'Text extraction failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
