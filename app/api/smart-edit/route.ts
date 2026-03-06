import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { layers, prompt, modelMode = 'production' } = body

        if (!layers || !prompt) {
            return NextResponse.json(
                { error: 'レイヤーデータとプロンプトが必要です' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            throw new Error('API key is not configured')
        }

        const genAI = new GoogleGenerativeAI(apiKey)

        // テキスト判定・JSON更新は軽量モデルで十分（コスト約90%削減）
        const modelName = process.env.GEMINI_SMART_EDIT_MODEL || "gemini-3.1-flash-lite-preview"

        console.log(`🧠 Smart Edit using model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        const systemInstruction = `You are an expert graphic design assistant analyzing a user's edit request.
The user wants to edit a poster. You have the current text layers (JSON) and the user's prompt.
Your task is to determine if the user's request is strictly about modifying TEXT (content, font size, color, font family, text position) OR if it requires modifying the actual image background/graphics.

IMPORTANT CLASSIFICATION RULES:
- Requests to REMOVE, DELETE, or ERASE any visual element (QRコード, ロゴ, 画像, 人物, 背景の一部 etc.) are ALWAYS image edits (isTextEditOnly: false).
- Words like "消して", "消す", "削除", "なくして", "除去", "remove", "delete", "erase" applied to ANY non-text element → isTextEditOnly: false.
- Requests about text content changes only (e.g. "タイトルを変えて", "change title to XXX", "テキストを赤にして") → isTextEditOnly: true.
- Requests about background, colors of the image, adding/removing objects → isTextEditOnly: false.

If the request is strictly about text (e.g. "change title to XXX", "make text red", "delete the subtitle text"):
1. Set "isTextEditOnly" to true.
2. Provide the "updatedLayers" array reflecting the changes.

If the request requires changing the image itself (e.g. "make the background darker", "add a cat", "remove the QR code", "QRコードを消して"):
1. Set "isTextEditOnly" to false.
2. "updatedLayers" can be omitted or null.

Respond ONLY with a JSON object in this exact format, with no markdown formatting:
{
  "isTextEditOnly": boolean,
  "updatedLayers": [ ... ]
}`

        console.log(`🧠 Smart Edit prompt: "${body.prompt}"`)
        const userPrompt = `Layers:\n${JSON.stringify(layers, null, 2)}\n\nPrompt:\n${prompt}`

        const result = await model.generateContent({
            contents: [
                { role: 'user', parts: [{ text: systemInstruction }, { text: userPrompt }] }
            ],
            generationConfig: {
                // Ensure the response is pure JSON
                responseMimeType: "application/json",
            }
        })

        const response = result.response
        const textResponse = response.text()

        if (!textResponse) {
            throw new Error("No response from AI")
        }

        try {
            const parsed = JSON.parse(textResponse)
            console.log(`🧠 Smart Edit result: isTextEditOnly=${parsed.isTextEditOnly} (prompt: "${prompt.substring(0, 50)}")`)
            return NextResponse.json({
                success: true,
                isTextEditOnly: parsed.isTextEditOnly,
                layers: parsed.updatedLayers || layers
            })
        } catch (e) {
            console.error("Failed to parse JSON response:", textResponse)
            throw new Error("AI returned invalid JSON")
        }

    } catch (error: any) {
        console.error('Smart edit error:', error)
        const errorMessage = error.message || 'Unknown error'
        return NextResponse.json(
            { error: `スマートエディット中にエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        )
    }
}
