import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/gemini';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if necessary

export const maxDuration = 60; // Allow longer timeout for complex analysis

// Define the expected JSON structure schema for the prompt
const BLUEPRINT_SCHEMA = `
{
  "version": "1.0",
  "meta": {
    "title": "Poster Title",
    "generatedAt": "ISO Date",
    "description": "Brief description"
  },
  "dimensions": {
    "width": number,
    "height": number,
    "unit": "px"
  },
  "background": {
    "type": "solid" | "gradient" | "image",
    "value": "hex code or url",
    "opacity": number
  },
  "layers": [
    {
      "id": "unique_id",
      "type": "text",
      "content": "Text content",
      "position": { "x": number, "y": number, "z": number },
      "size": { "width": number, "height": number },
      "rotation": number,
      "style": {
        "fontFamily": "Font Name",
        "fontSize": number,
        "color": "#hex",
        "fontWeight": "bold" | "normal",
        "textAlign": "left" | "center" | "right",
        "backgroundColor": "#hex or null"
      }
    },
    {
      "type": "image",
      "src": "base64...",
      "position": { "x": number, "y": number, "z": number },
      "size": { "width": number, "height": number },
      "rotation": number
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request Body
    const { image, textLayers } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // 3. Initialize Gemini Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 3.1 Pro Preview for high reasoning capabilities and accuracy
    const modelName = process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.1-pro-preview'
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // 4. Construct Prompt
    const prompt = `
      Analyze this poster image and extracting its design blueprint into a strict JSON format.
      
      This JSON will be used to reconstruct the poster in PowerPoint or Google Slides, so coordinate accuracy is critical.
      
      Requirements:
      1.  **Dimensions**: Estimate the canvas width and height (typically based on standard A4 or the image ratio).
      2.  **Background**: Identify the main background color or image.
      3.  **Layers**: Separate the design into distinct layers (Text, Images, Shapes).
      4.  **Text Layers**: 
          - Extract all visible text.
          - specific font families if recognizable (e.g., Serif, Sans-Serif, Handwriting), default to "Arial" if unsure.
          - specific hex colors.
          - approximate bounding box (x, y, width, height) relative to the top-left corner.
      5.  **Image Layers**: 
          - Identify main subject images or graphics separate from the background if possible.
          - (Note: We cannot separate pixels perfectly here, but identify their bounding boxes).
      
      Input Context (Use this to improve text accuracy):
      ${JSON.stringify(textLayers, null, 2)}

      Output Schema:
      ${BLUEPRINT_SCHEMA}
    `;

    // 5. キャッシュチェック（同じ画像の連続解析を回避）
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const cached = getCachedAnalysis(base64Data);
    if (cached) {
      console.log('📦 Blueprint: Cache HIT - API呼び出しをスキップ');
      return NextResponse.json(cached);
    }

    // 6. Call API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png",
        },
      },
    ]);

    const responseText = result.response.text();

    // 6. Return JSON
    // Parse it first to ensure valid JSON before returning
    try {
      const jsonResponse = JSON.parse(responseText);
      // キャッシュに保存
      setCachedAnalysis(base64Data, jsonResponse);
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw Response:", responseText);
      return NextResponse.json({
        error: 'Failed to parse AI response',
        raw: responseText
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Blueprint Extraction Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal Server Error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
