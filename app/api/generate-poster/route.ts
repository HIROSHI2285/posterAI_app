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

    const dimensions = sizeConfig[orientation as 'portrait' | 'landscape'];
    if (!dimensions) {
      return NextResponse.json(
        { error: "無効な向きです" },
        { status: 400 }
      );
    }

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
      hasSampleImage: !!sampleImageData,
      sampleImageName,
      hasMaterials: !!(materialsData && materialsData.length > 0),
      materialsCount: materialsData?.length || 0,
    });

    console.log("画像生成プロンプト:", imagePrompt);

    try {
      // Google AI SDK初期化
      const genAI = new GoogleGenerativeAI(apiKey);

      // Gemini 3 Pro Image Previewモデルを使用
      const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-image-preview"
      });

      // 画像を生成
      const result = await model.generateContent(imagePrompt);
      const response = result.response;

      console.log("API Response:", response);

      // レスポンスから画像データを取得
      let imageData: string | null = null;

      if (response.candidates && response.candidates[0]) {
        for (const part of response.candidates[0].content.parts) {
          // @ts-ignore
          if (part.inlineData) {
            // @ts-ignore
            const base64Image = part.inlineData.data;
            // @ts-ignore
            const mimeType = part.inlineData.mimeType || "image/png";
            imageData = `data:${mimeType};base64,${base64Image}`;
            console.log("画像生成成功:", mimeType);
            break;
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
        message: "Gemini 3 Pro Image Previewで画像を生成しました",
      });

    } catch (apiError: any) {
      console.error("API エラー:", apiError);
      console.error("エラー詳細:", apiError.message);

      if (apiError.stack) {
        console.error("スタック:", apiError.stack);
      }

      return NextResponse.json(
        {
          error: "画像生成に失敗しました",
          details: apiError.message || "不明なエラー",
          hint: "Google AI StudioでAPIキーが有効か確認してください"
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
    hasSampleImage,
    sampleImageName,
    hasMaterials,
    materialsCount,
  } = params;

  const aspectRatio = orientation === 'landscape' ? 'horizontal (16:9)' : 'vertical (9:16)';

  let prompt = `Create a professional ${taste} style poster design for ${purpose}.

Design specifications:
- Main title: "${mainTitle}"`;

  if (subTitle) {
    prompt += `\n- Subtitle: "${subTitle}"`;
  }

  if (freeText) {
    prompt += `\n- Additional information: "${freeText}"`;
  }

  prompt += `
- Color scheme: Based on ${mainColor}, create a harmonious and eye-catching palette
- Layout: ${layout} composition  
- Style: ${taste}, professional, high quality, magazine-quality
- Orientation: ${aspectRatio}`;

  // サンプル画像の参照情報を追加
  if (hasSampleImage) {
    prompt += `\n- Reference: User has provided a sample image (${sampleImageName || 'sample'}) as design inspiration. Consider incorporating similar visual elements, layout, or style while maintaining originality.`;
  }

  // 素材画像の参照情報を追加
  if (hasMaterials && materialsCount && materialsCount > 0) {
    prompt += `\n- Materials: User has provided ${materialsCount} image material(s) to potentially incorporate into the design. Consider how these materials might enhance the final poster.`;
  }

  prompt += `
- Include decorative graphics, patterns, or illustrations that complement the theme
- Typography: Bold, clear, readable Japanese and English text
- Overall aesthetic: Modern, polished, visually striking
- Make the text prominent and easy to read
- High resolution, print-ready quality

Create a complete, finished poster design that is ready to use.`;

  return prompt;
}
