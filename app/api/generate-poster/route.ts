import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { OUTPUT_SIZES } from "@/types/poster";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      purpose,
      outputSize,
      orientation = 'portrait',
      taste,
      layout,
      mainColor,
      mainTitle,
      subTitle,
      freeText,
      sampleImageData,
      sampleImageName,
      materialsData,
      materialsNames,
      customWidth,
      customHeight,
      customUnit,
    } = body;

    // バリデーション
    if (!mainTitle) {
      return NextResponse.json(
        { error: "メインタイトルは必須です" },
        { status: 400 }
      );
    }

    // APIキーの確認
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Gemini APIキーが設定されていません",
          message: ".envファイルにGEMINI_API_KEY（Google AI Studioで取得）を追加してください"
        },
        { status: 500 }
      );
    }

    // 出力サイズの取得
    const sizeConfig = OUTPUT_SIZES[outputSize as keyof typeof OUTPUT_SIZES];
    if (!sizeConfig) {
      return NextResponse.json(
        { error: "無効な出力サイズです" },
        { status: 400 }
      );
    }

    let dimensions = sizeConfig[orientation as 'portrait' | 'landscape'];

    // カスタムサイズの場合、mmをpxに変換（175 DPI: 1mm = 6.89px）
    if (outputSize === 'custom' && customWidth && customHeight) {
      const mmToPx = (mm: number) => Math.round(mm * 6.89);
      dimensions = {
        width: customUnit === 'mm' ? mmToPx(customWidth) : customWidth,
        height: customUnit === 'mm' ? mmToPx(customHeight) : customHeight,
      };
    }

    if (!dimensions) {
      return NextResponse.json(
        { error: "無効な向きです" },
        { status: 400 }
      );
    }

    // アスペクト比を計算
    const aspectRatio = (dimensions.width / dimensions.height).toFixed(3);

    // プロンプトを構築
    const imagePrompt = buildImagePrompt({
      purpose,
      taste,
      layout,
      mainColor,
      mainTitle,
      subTitle,
      freeText,
      orientation,
      dimensions,
      aspectRatio,
      hasSampleImage: !!sampleImageData,
      sampleImageName,
      hasMaterials: !!(materialsData && materialsData.length > 0),
      materialsCount: materialsData?.length || 0,
    });

    console.log("画像生成プロンプト:", imagePrompt);

    try {
      // Gemini 3 Pro Image Preview を使用
      // 
      // 理由: Imagen 4.0はDynamic Shared Quotaにより不安定
      // - テストで50%の失敗率
      // - 予測不可能なRESOURCE_EXHAUSTEDエラー
      // - 本番運用には不適切と判断
      // 
      // Preview版:
      // - 安定性: 100%
      // - コスト: ¥20/枚（A4、2K解像度）
      // - 信頼性が最優先
      // モデル名を環境変数から取得（正式版リリース時に変更可能）
      const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";  // 本番用
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName
      });

      // 画像を生成
      const result = await model.generateContent(imagePrompt);
      const response = result.response;

      console.log("API Response:", response);

      // finishReasonをチェック
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;

      console.log("Finish Reason:", finishReason);

      // エラーチェック
      if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
        return NextResponse.json(
          {
            error: "コンテンツポリシー違反",
            details: "生成されたコンテンツが安全性またはポリシーの基準を満たしていません。プロンプトを変更してください。",
            finishReason
          },
          { status: 400 }
        );
      }

      if (finishReason === 'OTHER' || !candidate?.content?.parts) {
        console.error("画像生成失敗 - content.parts が存在しません");
        console.error("Candidate content:", JSON.stringify(candidate?.content, null, 2));
        return NextResponse.json(
          {
            error: "画像生成に失敗しました",
            details: "APIが画像を生成できませんでした。プロンプトを変更するか、しばらく時間をおいて再試行してください。",
            finishReason: finishReason || "UNKNOWN"
          },
          { status: 500 }
        );
      }

      // レスポンスから画像データを取得
      let imageData: string | null = null;

      if (response.candidates && response.candidates[0]) {
        const parts = response.candidates[0].content.parts;

        if (Array.isArray(parts)) {
          for (const part of parts) {
            const partData = part as { inlineData?: { data: string; mimeType?: string } };
            if (partData.inlineData) {
              const base64Image = partData.inlineData.data;
              const mimeType = partData.inlineData.mimeType || "image/png";
              imageData = `data:${mimeType};base64,${base64Image}`;
              console.log("画像生成成功:", mimeType);
              break;
            }
          }
        }
      }

      if (!imageData) {
        console.error("Response structure:", JSON.stringify(response, null, 2));
        throw new Error("画像データが生成されませんでした");
      }

      return NextResponse.json({
        success: true,
        imageData: imageData,
        formData: body,
        message: "Gemini 3 Pro Image Preview で画像を生成しました",
      });

    } catch (apiError: any) {
      console.error("API エラー:", apiError);
      console.error("エラー詳細:", apiError.message);
      console.error("エラータイプ:", typeof apiError);
      console.error("エラー全体:", JSON.stringify(apiError, null, 2));

      if (apiError.stack) {
        console.error("スタック:", apiError.stack);
      }

      return NextResponse.json(
        {
          error: "画像生成に失敗しました",
          details: apiError.message || "不明なエラー",
          errorType: typeof apiError,
          hint: "モデル名またはAPIキーを確認してください"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("画像生成エラー:", error);
    return NextResponse.json(
      {
        error: "画像生成に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー"
      },
      { status: 500 }
    );
  }
}

/**
 * 画像生成用のプロンプトを構築
 */
function buildImagePrompt(params: {
  purpose: string;
  taste: string;
  layout: string;
  mainColor: string;
  mainTitle: string;
  subTitle?: string;
  freeText?: string;
  orientation: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  hasSampleImage?: boolean;
  sampleImageName?: string;
  hasMaterials?: boolean;
  materialsCount?: number;
}): string {
  const {
    purpose,
    taste,
    layout,
    mainColor,
    mainTitle,
    subTitle,
    freeText,
    orientation,
    dimensions,
    aspectRatio,
    hasSampleImage,
    sampleImageName,
    hasMaterials,
    materialsCount,
  } = params;

  const dimensionsText = orientation === 'landscape'
    ? 'landscape orientation (wider than tall)'
    : 'portrait orientation (taller than wide)';

  let prompt = `プロフェッショナルなポスターデザインを作成してください。

サイズ: ${dimensions.width}×${dimensions.height}px（${orientation}）
タイトル: 「${mainTitle}」`;

  if (subTitle) {
    prompt += `\nサブタイトル: 「${subTitle}」`;
  }

  if (freeText) {
    prompt += `\n追加テキスト: 「${freeText}」`;
  }

  prompt += `
配色: ${mainColor}
スタイル: ${taste}
レイアウト: ${layout}`;

  // サンプル画像参照を追加（日本語版）
  if (hasSampleImage) {
    prompt += `\n\n【重要】デザイン参考画像について:
アップロードされたサンプル画像が目指すべきビジュアルスタイルを示しています。以下の要素を注意深く分析し、忠実に再現してください:
- 配色とカラーパレット（メインカラー、アクセントカラー、背景色）
- 文字のスタイル（フォント、サイズ、配置、装飾要素）
- レイアウト構成（セクション分け、余白、コンテンツブロック、整列）
- ビジュアル要素（グラフィック、イラスト、アイコン、パターン、装飾）
- 全体の雰囲気とムード（お祭り的、プロフェッショナル、ポップ、エレガントなど）

これらのデザイン特性を忠実に再現しながら、指定されたタイトルとテキストを組み込んでください。`;
  }

  prompt += `\n\nキャンバス全体を埋める完成度の高いポスターを作成してください。余白なしでエッジまでデザインを広げてください。`;

  return prompt;
}
