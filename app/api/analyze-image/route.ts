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

        // レート制限チェック（200回/日 - 生成より多く設定）
        const { allowed, remaining, resetAt } = rateLimiter.check(session.user.email, 200);
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

            // 画像解析モデル
            // 現在使用中: "gemini-3-pro-image-preview" ← プレビュー版、高精度 ✅
            // 
            // 理由:
            // - ポスター生成と同じモデルファミリーで統一
            // - 画像理解に特化した高精度
            // - GA版リリース時に一括移行
            // 
            // 将来の移行予定:
            // - "gemini-3-pro-image" (GA版) がリリースされたら移行
            // 
            // 他の選択肢:
            // - "gemini-1.5-pro" - GA版だがコスト高（$0.0028/回）
            // - "gemini-1.5-flash" - 安価で高速（$0.0001/回）
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
AI画像生成ツール（Imagen）で高精度に再現できるように、デザインの構成要素を極めて詳細かつ具体的に言語化して抽出してください。

以下のJSON形式で回答してください（JSONのみ、他のテキストは含めないでください）：

{
  "basicInfo": {
    "mainColor": "メインカラー（必ずHEX形式、例: #87CEEB）",
    "accentColors": ["アクセントカラー1（HEX、例: #FF6B6B）", "アクセントカラー2（HEX）"],
    "baseColor": "ベース/背景カラー（HEX形式、例: #FFFFFF）",
    "taste": "デザインスタイル（モダン、ミニマル、エレガント、カジュアル、レトロ、和風、ポップなど、できるだけ具体的に）",
    "layout": "レイアウト構成（中央揃え、左右分割、上下分割、三分割、グリッド、非対称など、配置比率も含めて）",
    "purpose": "想定される用途（イベント告知、商品広告、店内掲示、SNS投稿、チラシなど）",
    "mainTitle": "画像内に見えるメインタイトルやキャッチコピー（正確に転記、なければ空文字）"
  },
  "detailedDescription": "以下の番号付き構造で、AI画像生成で再現するための具体的な指示として記述してください（各項目は詳細に、合計800-1500文字程度）:

1. 全体的なデザイン・レイアウト
構成: レイアウトの分割方法を具体的に。例: \"上下二分割のレイアウト。上部60%はビジュアル重視エリア、下部40%は情報提示エリア。中央に垂直の視線誘導ライン。\"

配色: 
- メインカラー: 色の名称、使用箇所、面積比率、HEX値を明記。例: \"鮮やかなスカイブルー（#87CEEB）、背景全体の70%を占める\"
- アクセントカラー: 同様に詳細に。例: \"ビビッドなコーラルレッド（#FF6B6B）、CTAボタンと見出しに使用、全体の15%\"
- ベース: 例: \"純白（#FFFFFF）、テキストボックスと余白、15%\"

雰囲気: 全体的な印象を3つ以上の形容詞で。例: \"明るく、親しみやすく、プロフェッショナルで信頼感のある印象。清潔感と開放感を演出。\"

タイポグラフィ: フォントの種類、サイズ感、太さ、配置を具体的に。例: \"メインコピーは太字の明朝体（ウェイト700程度）、大きく目立つサイズ。サブテキストは細身のゴシック体（ウェイト300）、視認性重視の中サイズ。\"

2. ビジュアル要素（メイン画像・イラスト）
被写体: 登場人物や物体の詳細。例: \"30代前半の日本人女性。自然な笑顔、カジュアルなビジネス服装（白シャツ）、ヘッドセット装着、ノートパソコンに向かって楽しそうに会話している様子。明るい表情で目線はカメラ方向。\"

背景: 環境の詳細。例: \"明るい室内空間（リビングまたは書斎）。大きな窓から自然光が差し込む。観葉植物（モンステラ）が左側に配置。木製のデスクとモダンな椅子。ナチュラルで開放的な雰囲気。\"

構図: カメラアングル、被写体の配置。例: \"やや斜め上からのアングル。被写体は画面左寄り1/3に配置。右側2/3は背景とテキストスペース。三分割法に基づいた構図。\"

光と影: 照明の方向と質感。例: \"左側からの柔らかい自然光。顔に明るいハイライト。影は薄く、全体的にハイキーな明るさ。\"

3. テキスト要素
メインコピー: 
- 位置: 例: \"画面右上、中央揃え\"
- 文字: 例: \"自宅で はじめる 英会話\" （改行位置も正確に）
- スタイル: 例: \"太字、黒色（#000000）、大きなサイズ（画面高の10%程度）\"

サブコピー/キャッチフレーズ:
- 位置: 例: \"メインコピーの下、やや小さめ\"
- 文字: 例: \"初心者でも安心の個別レッスン\"
- スタイル: 例: \"中太、グレー（#666666）、中サイズ\"

特別な装飾テキスト:
- 位置: 例: \"右上角、斜め15度傾け\"
- 文字: 例: \"入会金無料！\"
- スタイル: 例: \"太字、黄色背景（#FFD700）に赤文字（#FF0000）、目立つサイズ\"

4. コンテンツ要素（情報ブロック）
レイアウト構成: ボックスやカードの配置。例: \"下部に等間隔で3つのブルーのボックス（#4A90E2）を横並び配置。各ボックスは角丸（10px）、白文字、内側に余白あり。\"

情報の内容:
- Point 1: アイコン（星マーク）+ \"経験豊富な講師陣\" + 説明文
- Point 2: アイコン（時計）+ \"24時間予約可能\" + 説明文
- Point 3: アイコン（チェック）+ \"無料体験レッスン\" + 説明文

5. CTA（行動喚起）要素
ボタン/帯: 
- 位置: 例: \"最下部、画面幅いっぱいの帯状\"
- 色: 例: \"濃いブルー（#003366）背景に黄色文字（#FFD700）\"
- 文字: 例: \"新規会員募集中！お申し込みはこちらから\"
- サイズ: 例: \"高さは画面の8%程度、目立つサイズ\"

追加要素: 
- QRコード、URL、電話番号、SNSアイコンなどの有無と配置

※すべての項目で、色は必ずHEX値を含めてください。
※配置は画面の%や相対位置で具体的に指定してください。
※この説明だけでAIが再現できるレベルで詳細に記述してください。"
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
