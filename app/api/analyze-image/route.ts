import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { imageData } = body;

        if (!imageData) {
            return NextResponse.json(
                { error: "画像データが必要です" },
                { status: 400 }
            );
        }

        // APIキーの確認
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                {
                    error: "Gemini APIキーが設定されていません",
                    message: ".envファイルにGEMINI_API_KEYを追加してください"
                },
                { status: 500 }
            );
        }

        try {
            // Google AI SDK初期化
            const genAI = new GoogleGenerativeAI(apiKey);

            // 画像解析モデル
            // 旧モデル（問題があれば戻す）: "gemini-3-pro-image-preview"
            // 新モデル（推奨・無料）: "gemini-2.0-flash-exp"
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp"
            });

            // Base64データをパーツに変換
            console.log("=== 画像データ解析開始 ===");
            console.log("画像データ長:", imageData.length);
            console.log("画像データプレフィックス:", imageData.substring(0, 50));

            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0];

            console.log("MIME Type:", mimeType);
            console.log("Base64データ長:", base64Data?.length);

            if (!base64Data) {
                throw new Error("Base64データの抽出に失敗しました");
            }

            const imageParts = [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ];

            const prompt = `この画像はポスターまたはデザイン作品です。
AI画像生成ツールやデザインツールで再現できるように、デザインの構成要素を詳細に言語化して抽出してください。

以下のJSON形式で回答してください（JSONのみ、他のテキストは含めないでください）：

{
  "basicInfo": {
    "mainColor": "メインカラー（HEX形式、例: #87CEEB）",
    "accentColors": ["アクセントカラー1（HEX）", "アクセントカラー2（HEX）"],
    "baseColor": "ベースカラー（HEX形式）",
    "taste": "デザインスタイル（モダン、ミニマル、エレガント、カジュアル、レトロなど）",
    "layout": "レイアウト構成（中央揃え、左右分割、上下分割、グリッドなど）",
    "purpose": "想定される用途（イベント告知、広告、店内掲示、SNS投稿など）",
    "mainTitle": "画像内に見えるメインタイトルやキャッチコピー（もしあれば）"
  },
  "detailedDescription": "以下の番号付き構造で記述してください:

1. 全体的なデザイン・レイアウト
構成: （レイアウトの分割方法。例: 上下二分割のレイアウト。上部（約60%）はビジュアル重視、下部（約40%）は情報提示の構成。）

配色: 
メインカラー：（色の説明とHEX値）
アクセントカラー：（色の説明とHEX値）
ベース：（色の説明とHEX値）

雰囲気: （全体的な印象。例: 明るく、親しみやすく、プロフェッショナルな印象。）

タイポグラフィ: （フォントの種類と使い分け。例: メインコピーは上品な明朝体、情報部分は視認性の高いゴシック体を使用。）

2. ビジュアル要素（上部セクション）
人物: （登場人物の特徴や様子。例: 30代前後の日本人女性。笑顔でヘッドセットを装着し、ノートパソコンに向かって楽しそうに会話している。）

背景: （背景の雰囲気や要素。例: 明るい室内（リビングまたは書斎）。観葉植物が見え、自然光が差し込むナチュラルな雰囲気。）

メインコピー: （主要なテキストの配置と内容。例: 左側に大きく配置。「自宅で はじめる 英会話」の文字。）

キャッチ: （目を引く要素の配置。例: 右上に「入会金無料！」の斜め配置のテキスト。）

3. コンテンツ要素（中央・下部セクション）
レイアウト構成: （ブロック分割やカラム構成の詳細。例: 等間隔に並んだ3つのブルーのボックス内に情報を配置。）

ポイント/情報の配置: （各セクションの内容。例: Point 1: ～、Point 2: ～、Point 3: ～）

フッター/CTA: （下部の行動喚起要素。例: 帯部分: 濃いブルーの背景に黄色の文字で「新規会員募集中！お申し込みはこちらから」。誘導: 公式サイトのURLと、検索窓のアイコン。）

※各項目は具体的に記述し、色はHEX値を含めてください。"
}`;

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = result.response;
            const text = response.text();

            console.log("画像解析結果（生）:", text);

            // JSONを抽出
            let analysisData;
            try {
                // コードブロックを削除してJSONをパース
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysisData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("JSON形式のデータが見つかりません");
                }
            } catch (parseError) {
                console.error("JSON解析エラー:", parseError);
                console.error("元のテキスト:", text);
                return NextResponse.json(
                    {
                        error: "画像解析結果の解析に失敗しました",
                        details: text
                    },
                    { status: 500 }
                );
            }

            console.log("解析データ:", analysisData);

            return NextResponse.json({
                success: true,
                analysis: analysisData,
                message: "画像を解析しました"
            });

        } catch (apiError: any) {
            console.error("=== API エラー詳細 ===");
            console.error("エラーメッセージ:", apiError.message);
            console.error("エラースタック:", apiError.stack);
            console.error("エラーオブジェクト全体:", JSON.stringify(apiError, null, 2));
            return NextResponse.json(
                {
                    error: "画像解析に失敗しました",
                    details: apiError.message || "不明なエラー",
                    errorType: apiError.constructor.name
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("画像解析エラー:", error);
        return NextResponse.json(
            {
                error: "画像解析に失敗しました",
                details: error instanceof Error ? error.message : "不明なエラー"
            },
            { status: 500 }
        );
    }
}
