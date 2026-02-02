import { GoogleGenerativeAI } from "@google/generative-ai";

// GoogleGenerativeAI の初期化は各関数内でオンデマンドに行う（起動負荷軽減のため）
let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI() {
    if (!genAIInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            // ここでスローするとインポート時に落ちる可能性があるが、
            // 呼び出し時（オンデマンド）に実行されるため安全
            throw new Error('GEMINI_API_KEY is not set');
        }
        genAIInstance = new GoogleGenerativeAI(apiKey);
    }
    return genAIInstance;
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
