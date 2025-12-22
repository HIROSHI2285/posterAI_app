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

            // Gemini Pro Visionモデルを使用
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });

            // Base64データをパーツに変換
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0];

            const imageParts = [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ];

            const prompt = `この画像を詳しく分析し、ポスターデザインの設定を抽出してください。

以下のJSON形式で回答してください（JSONのみ、他のテキストは含めないでください）：

{
  "mainColor": "抽出したメインカラー（例: #48a772）",
  "taste": "デザインスタイル（モダン, ミニマル, ポップ, エレガント, ビンテージ, カジュアル, プロフェッショナル, など）",
  "layout": "レイアウト構成（中央揃え, 左揃え, 右揃え, 対称, 非対称, など）",
  "mainTitle": "画像内に見えるメインテキストまたはタイトル（もしあれば）",
  "purpose": "デザインの目的（イベント告知, 広告, 店内掲示, SNS投稿, など）",
  "additionalNotes": "その他の重要なデザイン要素や特徴"
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
            console.error("API エラー:", apiError);
            return NextResponse.json(
                {
                    error: "画像解析に失敗しました",
                    details: apiError.message || "不明なエラー"
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
