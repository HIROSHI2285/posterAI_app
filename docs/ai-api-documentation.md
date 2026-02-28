# AI画像生成API: Nano Banana（Gemini API）

## 📖 概要

Nano BananaはGoogle Gemini APIの画像生成機能の通称で、テキストから高品質な画像を生成できるAI APIです。

## 🎨 利用可能なモデル

### 1. Nano Banana (Gemini 3.1 Flash Image Preview)
- **特徴**: スピード、効率、高画質（デフォルト2K出力対応）
- **用途**: 高品質なポスター画像生成、Inpainting（部分再描画）
- **価格**: 非常に安価設定（旧Flash相当）

### 2. Nano Banana Pro (Gemini 3.1 Pro Preview)
- **特徴**: プロフェッショナルな推論・解析向け
- **機能**:
  - 詳細な画像メタデータ解析（レイアウト、カラー抽出）
  - Context Caching対応による連続編集時のコスト削減
  - テキストのみの置換・編集（Smart Editing）におけるJSON操作
  - キャラクター一貫性（表情や特徴の維持）の指示生成

## 🔧 主要機能

### 1. 画像生成
- テキストプロンプトから画像を生成
- 高品質な出力
- 数秒で結果を取得

### 2. 画像編集
- 既存画像の編集
- テキストプロンプトで要素を追加/削除/変更
- スタイル変更
- カラーグレーディング調整

### 3. マルチターン編集
- 会話形式で複数ステップの改善
- 段階的なブラッシュアップが可能

### 4. テキストレンダリング
- 画像内にシャープで読みやすいテキストを生成
- ポスター生成に最適

## 💻 API統合

### セットアップ
1. Google AI Studio または Kie.ai でAPIキーを取得
2. 環境変数に設定

```bash
GEMINI_API_KEY=your_api_key_here
```

### Python SDK
```python
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")

model = genai.GenerativeModel('gemini-3.1-flash-image-preview')

response = model.generate_content([
    "Create a modern event poster with vibrant colors",
    {"mime_type": "image/jpeg", "data": image_data}  # オプション
])

image = response.parts[0].image
```

### JavaScript/TypeScript SDK
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

const result = await model.generateContent([
  "Create a modern event poster with vibrant colors",
  // オプションで参照画像を追加可能
]);

const image = result.response.parts[0].image;
```

### REST API
```bash
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=API_KEY

{
  "contents": [{
    "parts": [{
      "text": "Create a modern event poster with vibrant colors"
    }]
  }]
}
```

## 💰 料金プラン

- **無料枠**: テスト用
- **Pay-as-you-go**: 使った分だけ課金
- **エンタープライズ**: ボリュームディスカウント

## 🎯 PosterAI への適用

### 推奨モデル
- **画像生成・Inpainting**: Gemini 3.1 Flash Image Preview (Nano Banana)
  - 2K高解像度出力
  - 安価かつ極めて高品質
  - キャラクター一貫性（Character Consistency）対応

- **解析・推論・テキスト編集**: Gemini 3.1 Pro Preview (Nano Banana Pro)
  - コンテキストキャッシングによる再解析コスト削減
  - 文字情報の精緻な置換処理（Smart Editing）

### プロンプト設計の考慮事項

ポスター生成のための効果的なプロンプト構造:
```
Create a [taste] [purpose] poster with the following details:
- Main Title: [mainTitle]
- Subtitle: [subTitle]
- Color Scheme: [mainColor]
- Layout: [layout]
- Style: [taste]
- Text: [freeText]
Include professional typography and modern design elements.
```

### 実装方針
1. Server Actions でAPI呼び出し（セキュリティのため）
2. ストリーミングレスポンスでリアルタイムフィードバック
3. エラーハンドリングとリトライロジック
4. 生成画像をCloudflare R2に保存

### PosterAI APIエンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/analyze-image` | POST | サンプル画像の解析とメタデータ抽出 |
| `/api/jobs` | POST | 世代別（画像生成等）の非同期ジョブ作成 |
| `/api/jobs/[id]` | GET | ジョブステータス・結果の取得 |
| `/api/unified-edit` | POST | Inpaintingによる画像再生成・キャラクター保持 |
| `/api/smart-edit` | POST | テキストのみの変更（画像生成を伴わないJSONの更新） |

### 新編集API構成 (Gemini 3.1移行後)

#### `/api/smart-edit`（テキストのみ編集）
```typescript
POST /api/smart-edit
Body: {
  prompt: string,      // 編集指示（人間言語）
  currentLayers: TextLayer[] // 現在のテキストレイヤー
}
Response: {
  isTextEditOnly: true,
  updatedLayers: TextLayer[] // アニメーション付きでそのまま反映される
}
```

#### `/api/unified-edit`（要素変更・矩形編集）
```typescript
POST /api/unified-edit
Body: {
  prompt: string,       // 編集指示
  image: string,        // 現行画像（base64）
  mask: string,         // マスク画像（base64）
  metadata?: Metadata   // 生成時のseed値など（Character Consistency）
}
Response: {
  jobId: string         // 非同期ジョブのID
}
```

## 📚 参考リンク

- [Gemini API Documentation](https://google.dev)
- [Image Generation Guide](https://ai.google.dev/gemini-api/docs/image-generation)
