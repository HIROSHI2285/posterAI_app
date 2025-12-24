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

            // Gemini 3 Pro Image Preview（画像生成と同じモデル）を使用
            const model = genAI.getGenerativeModel({
                model: "gemini-3-pro-image-preview"
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
  "detailedDescription": "以下の構成で200-400文字程度の詳細説明:

1. 全体的なデザイン・レイアウト
   - 構成: レイアウトの分割方法（例: 上下二分割、上部60%はビジュアル、下部40%は情報）
   - 配色: メインカラー、アクセントカラー、ベースカラーとその使い方
   - 雰囲気: 全体的な印象（明るい、親しみやすい、プロフェッショナルなど）
   - タイポグラフィ: フォントの種類と使い分け（明朝体、ゴシック体など）

2. ビジュアル要素（上部・中央セクション）
   - 人物・被写体: 登場人物の特徴や様子
   - 背景: 背景の雰囲気や要素
   - メインコピー: 主要なテキストの配置と内容
   - キャッチ: 目を引く要素の配置

3. コンテンツ要素（中央・下部セクション）
   - レイアウト構成: ブロック分割やカラム構成
   - 情報の配置: ポイントや説明の並び方
   - CTA要素: 行動を促す要素の配置と強調方法
   - フッター: 下部の帯やURL、連絡先情報

例:
'上下二分割のレイアウトで上部（約60%）はビジュアル重視、下部（約40%）は情報提示。メインカラーは清潔感のあるスカイブルー（#87CEEB）、アクセントにイエロー（#FFD700）を使用。30代女性がヘッドセットで笑顔で会話する写真を配置し、左側に明朝体で「自宅ではじめる英会話」のメインコピー。下部は3カラムレイアウトでブルーのボックス内に特徴を記載。フッター部分は濃いブルー背景に黄色文字でCTA「新規会員募集中！お申し込みはこちらから」とURL配置。明るく親しみやすい雰囲気。'"
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
