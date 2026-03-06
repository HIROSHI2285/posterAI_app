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

// ================================
// Context Caching（インメモリ画像解析キャッシュ）
// ================================
interface CacheEntry {
    data: any;
    timestamp: number;
}

const analysisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10分

/**
 * 画像データからハッシュキーを生成（先頭200文字を使用）
 */
function getImageHash(imageData: string): string {
    // Base64データの先頭200文字をキーに（完全ハッシュより高速）
    const raw = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    return raw.substring(0, 200);
}

/**
 * キャッシュから画像解析結果を取得
 */
export function getCachedAnalysis(imageData: string): any | null {
    const key = getImageHash(imageData);
    const entry = analysisCache.get(key);
    if (!entry) return null;

    // TTL チェック
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        analysisCache.delete(key);
        return null;
    }
    console.log(`📦 Cache HIT for image analysis (age: ${Math.round((Date.now() - entry.timestamp) / 1000)}s)`);
    return entry.data;
}

/**
 * 画像解析結果をキャッシュに保存
 */
export function setCachedAnalysis(imageData: string, data: any): void {
    const key = getImageHash(imageData);
    analysisCache.set(key, { data, timestamp: Date.now() });

    // キャッシュサイズ制限（最大50エントリ）
    if (analysisCache.size > 50) {
        const oldestKey = analysisCache.keys().next().value;
        if (oldestKey) analysisCache.delete(oldestKey);
    }
    console.log(`📦 Cache SET for image analysis (total entries: ${analysisCache.size})`);
}

