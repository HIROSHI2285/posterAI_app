import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimiter } from "@/lib/rate-limiter";

// ファイルサイズとMIMEタイプの定数
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // レート制限チェック（100回/日）
        const { allowed, remaining, resetAt } = rateLimiter.check(session.user.email, 100);
        if (!allowed) {
            return NextResponse.json(
                {
                    error: "本日の画像解析回数上限に達しました",
                    message: `制限は ${new Date(resetAt).toLocaleString('ja-JP')} にリセットされます`
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { imageData } = body;

        if (!imageData) {
            return NextResponse.json(
                { error: "画像データが必要です" },
                { status: 400 }
            );
        }

        // ファイルサイズ検証
        if (imageData.length > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: "ファイルサイズが大きすぎます",
                    message: "最大10MBまでアップロード可能です"
                },
                { status: 413 }
            );
        }

        // MIMEタイプ検証
        const mimeTypeMatch = imageData.match(/data:([^;]+);/);
        const mimeType = mimeTypeMatch?.[1];

        if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
            return NextResponse.json(
                {
                    error: "サポートされていないファイル形式です",
                    message: "JPEG, PNG, WebP, GIF形式のみサポートしています"
                },
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

            // モデル名を環境変数から取得（正式版リリース時に変更可能）
            // デフォルト: gemini-3-pro-image-preview (プレビュー版)
            // 正式版リリース後: 環境変数 GEMINI_IMAGE_MODEL を変更するだけで移行可能
            const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
            const model = genAI.getGenerativeModel({
                model: modelName
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
AI画像生成ツール（Imagen）で高精度に再現できるように、デザインの構成要素を極めて詳細かつ具体的に言語化して抽出してください。
特に「レイアウトの比率」「フォントの雰囲気」「配色の正確性」はピクセルパーフェクトな再現を目指すために最重要です。

以下のJSON形式で回答してください（JSONのみ、他のテキストは含めないでください）：

{
  "basicInfo": {
    "mainColor": "メインカラー（必ずHEX形式、例: #87CEEB）",
    "accentColors": ["アクセントカラー1（HEX、例: #FF6B6B）", "アクセントカラー2（HEX）", "アクセントカラー3（HEX、あれば）"],
    "baseColor": "ベース/背景カラー（HEX形式、例: #FFFFFF）",
    "taste": "デザインスタイル（モダン、ミニマル、エレガント、カジュアル、レトロ、和風、ポップなど、できるだけ具体的に。複数の形容詞を組み合わせて）",
    "layout": "レイアウト構成（中央揃え、左右分割、上下分割、三分割、グリッド、非対称など。配置比率を%で明記）",
    "purpose": "想定される用途（イベント告知、商品広告、店内掲示、SNS投稿、チラシなど）",
    "mainTitle": "画像内に見えるメインタイトルやキャッチコピー（正確に転記、改行位置も含めて。なければ空文字）"
  },
  "detailedDescription": "以下の番号付き構造で、AI画像生成（Imagen）で完璧に再現するための超詳細な指示として記述してください。各項目は可能な限り具体的に、**合計4500文字以内（最大5000文字厳守）**で記述：

1. 厳密なレイアウト構成と比率（最重要）
- 画面分割: 画面をどのように分割しているか、正確なパーセンテージで記述。例: \\"上部ヘッダー領域(15%)、中央メインビジュアル領域(55%)、下部情報領域(30%)の3段構成\\"
- グリッドシステム: 根底にあるグリッド構造（2カラム、3カラム、黄金比など）。例: \\"左右12%のマージンを確保した中央1カラム構成\\"
- 重なりと奥行き: 要素の重なり順（Z-index的視点）。例: \\"背景写真の上に半透明の黒帯レイヤー(不透明度40%)を重ね、その上に白文字を配置\\"

2. 配色システムとカラーコード
- メインカラー: 色名、正確なHEX値、使用箇所、面積比率。
- アクセントカラー: 強調色、ボタン色、装飾色。
- ベースカラー: 背景色、余白の色。
- グラデーション: 開始色・終了色・方向・種類（線形/円形）。
- 陰影色彩: 影の色（単なる黒ではなく、環境光を含んだ色など）。

3. タイポグラフィと文字組（再現性を左右する要素）
- タイトル: フォントのカテゴリ（明朝、ゴシック、セリフ、サンセリフ、手書き、筆文字）、ウェイト（太さ）、字間（トラッキング）、行間（リーディング）。例: \\"極太のサンセリフ体（Impact風）。字間は詰め気味。\\"
- フォントの質感: 境界線の処理（シャープ、ラウンド、グランジ）、エフェクト（縁取り、影、光彩、立体化）。
- 日本語フォントの特徴: 「はね」「はらい」の特徴、モダンか古典的か。

4. アートスタイル・画風・質感（詳細に）
- 具体的なスタイル: \\"水彩画風\\"、\\"切り絵風\\"、\\"3Dレンダリング\\"、\\"フラットデザイン\\"、\\"浮世絵風\\"など。
- ブラシタッチ: 筆致の荒さ、方向、滲み具合。
- マテリアル感: 紙のザラつき、金属の光沢、プラスチックの質感、布の織り目。
- ライティング: 光源の位置、強さ、色温度（暖色/寒色）、硬さ（ハードライト/ソフトライト）。

5. ビジュアル要素の詳細描写（メイン画像・イラスト）
- 被写体: 「誰が」「何をしているか」「どこで」「どのような表情で」。服装、髪型、持ち物まで詳細に。
- 構図: カメラアングル（俯瞰、アオリ、正面）、被写体のサイズと位置、視線誘導。
- 背景要素: 具体的な描き込み内容。ボケ味（被写界深度）の有無。

6. 装飾要素・グラフィックパーツ
- アイコン・アイコンセット: スタイル（線画、塗りつぶし）、サイズ、色。
- フレーム・枠: 線の太さ、種類（実線、点線、二重線）、角の処理（直角、角丸）。
- あしらい: キラキラ、集中線、植物モチーフ、幾何学模様などの位置と形状。

7. テキスト要素の配置と内容（すべて網羅）
- メインコピー: 内容、位置、サイズ感。
- サブコピー: 内容、位置。
- 詳細情報: 日時、場所、価格などの具体的なテキスト配置。
- CTAボタン: 形状、色、テキスト、位置。

8. 最終仕上げ・エフェクト
- フィルター効果: 全体的な色調補正（セピア、モノクロ、彩度アップ、コントラスト調整）。
- テクスチャオーバーレイ: ノイズ、グランジ、和紙などの全体テクスチャ。

※すべての色は必ずHEX値（#XXXXXX形式）で記載
※位置・サイズは画面比%または具体的なpx値で記載
※この説明のみでAI画像生成ツールが完璧に再現できるレベルで超詳細に記述
※曖昧な表現は避け、数値と具体例を多用してください"
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
