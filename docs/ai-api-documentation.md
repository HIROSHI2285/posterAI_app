# AI画像生成API: Nano Banana（Gemini API）

## 📖 概要

Nano BananaはGoogle Gemini APIの画像生成機能の通称で、テキストから高品質な画像を生成できるAI APIです。

## 🎨 利用可能なモデル

### 1. Nano Banana (Gemini 2.5 Flash Image)
- **特徴**: スピード、効率、高ボリューム、低レイテンシに最適化
- **用途**: 高速生成が求められるアプリケーション
- **価格**: 約 $0.02/画像

### 2. Nano Banana Pro (Gemini 3 Pro Image Preview)
- **特徴**: プロフェッショナルな制作向け
- **機能**:
  - 高度な推論
  - 複雑な指示への対応
  - 高精細なテキストレンダリング
  - 最大4K解像度対応
  - キャラクター一貫性（表情や特徴の維持）
  - マルチ画像結合

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

model = genai.GenerativeModel('gemini-2.5-flash-image')

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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

const result = await model.generateContent([
  "Create a modern event poster with vibrant colors",
  // オプションで参照画像を追加可能
]);

const image = result.response.parts[0].image;
```

### REST API
```bash
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=API_KEY

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
- **初期フェーズ**: Gemini 2.5 Flash Image (Nano Banana)
  - 高速生成
  - コスト効率が良い
  - リアルタイムプレビューに最適

- **プレミアム機能**: Gemini 3 Pro Image Preview (Nano Banana Pro)
  - 4K解像度出力
  - より高品質なテキストレンダリング
  - プロフェッショナルな用途

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

## 📚 参考リンク

- [Gemini API Documentation](https://google.dev)
- [Image Generation Guide](https://ai.google.dev/gemini-api/docs/image-generation)
