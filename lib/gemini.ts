import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Imagen 4.0を使用して画像を生成
 */
export async function generateImage(prompt: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: "imagen-4.0-generate-001"
        });

        const result = await model.generateContent([prompt]);
        const response = result.response;

        // 画像データを取得
        if (response.candidates && response.candidates[0]?.content?.parts) {
            const imagePart = response.candidates[0].content.parts.find(
                (part: any) => part.inlineData
            );

            if (imagePart?.inlineData) {
                // Base64エンコードされた画像データを返す
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
        }

        throw new Error("画像の生成に失敗しました");
    } catch (error) {
        console.error("画像生成エラー:", error);
        throw error;
    }
}

/**
 * ポスター生成用のプロンプトを構築
 */
export function buildPosterPrompt(params: {
    purpose: string;
    taste: string;
    layout: string;
    mainColor: string;
    mainTitle: string;
    subTitle?: string;
    freeText?: string;
    outputSize: { width: number; height: number };
}): string {
    const {
        purpose,
        taste,
        layout,
        mainColor,
        mainTitle,
        subTitle,
        freeText,
        outputSize,
    } = params;

    return `Create a professional ${taste} poster for ${purpose} with the following specifications:

Layout: ${layout}
Main Color: ${mainColor}
Main Title: "${mainTitle}"
${subTitle ? `Subtitle: "${subTitle}"` : ""}
${freeText ? `Additional Text: "${freeText}"` : ""}

Output size: ${outputSize.width}×${outputSize.height}px

Design Requirements:
- Modern and visually appealing
- Clear, legible typography
- Professional composition
- Harmonious color scheme based on ${mainColor}
- ${taste} style aesthetic
- High-quality, crisp text rendering
- Balanced white space

Please generate a complete, production-ready poster design.`;
}
