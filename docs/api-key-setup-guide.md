# Nano Banana 3.0 Pro API キー取得ガイド

## 🎯 Nano Banana 3.0 Pro とは

**Nano Banana 3.0 Pro**（正式名称: **Gemini 3 Pro Image Preview**）は、Googleの最先端AI画像生成モデルです。従来のNano Banana（Gemini 2.5 Flash Image）よりも高品質で、特にポスター作成に最適な機能を備えています。

### ✨ 主要機能（ポスター作成に最適）

| 機能 | 詳細 |
|------|------|
| **高精細テキストレンダリング** | ポスター内のテキストが鮮明で読みやすい（最重要） |
| **4K解像度対応** | 最大4K解像度で出力可能 |
| **高度な推論** | 複雑な指示を正確に理解 |
| **フォトリアリスティック** | プロフェッショナルな品質 |
| **マルチ画像結合** | 最大14枚の画像を合成可能 |
| **キャラクター一貫性** | 顔や特徴を複数の出力で維持 |

### 💰 料金

- **無料枠**: 1日あたり1,500回の呼び出し（新規ユーザー）
- **クレジットカード不要**: 無料枠内であれば課金なし
- **有料プラン**: 無料枠を超えた場合のみ課金

---

## 📝 APIキー取得方法（推奨: Google AI Studio）

### 方法1: Google AI Studio（最も簡単・推奨）

#### ステップ1: Google AI Studioにアクセス
1. ブラウザで [https://aistudio.google.com](https://aistudio.google.com) を開く
2. Googleアカウントでログイン

#### ステップ2: 利用規約に同意
1. 法的通知が表示された場合、内容を確認
2. 「同意する」にチェックを入れて「続行」をクリック

#### ステップ3: APIキーを作成
1. 左側メニューから **「Get API key」** または **「APIキーを作成」**（鍵のマーク）をクリック
2. 「**Create API Key in new project**」をクリック
   - 新規プロジェクトが自動的に作成されます
   - または既存のGoogle Cloudプロジェクトを選択

#### ステップ4: APIキーをコピー
1. APIキーが表示されたら **「コピー」** をクリック
2. メモ帳などに安全に保存
   - ⚠️ このAPIキーは二度と表示されない場合があるので、必ず保存してください

#### ステップ5: APIキーをテスト（任意）
画面に表示されたcurlコマンドをターミナルで実行して、APIキーが有効か確認できます。

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Test"}]}]}'
```

---

### 方法2: Vertex AI（企業向け・高度）

Google Cloud Platformを既に利用している場合はこちら。

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Vertex AI Studio を開く
3. Model Garden で「Gemini 3 Pro Image」を検索
4. APIを有効化してクレデンシャルを生成

---

### 方法3: サードパーティプラットフォーム

- **Kie.ai**: 開発者向けダッシュボードでAPIキーを管理
- **CometAPI**: 競争力のある価格設定
- **OpenRouter.ai**: 複数のAIモデルに統合アクセス

（初期段階では**Google AI Studio**を推奨）

---

## 🔧 PosterAI Appでの使用方法

### モデル識別子
```
gemini-3-pro-image-preview
```

### APIキーの設定（.env.local）
```bash
GEMINI_API_KEY=your_api_key_here
```

### TypeScript/JavaScript での使用例

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3-pro-image-preview" 
});

const result = await model.generateContent([
  `Create a modern event poster with the following details:
  - Main Title: Summer Festival 2024
  - Subtitle: July 20th
  - Color Scheme: Vibrant orange and blue
  - Style: Modern and dynamic
  Include professional typography and modern design elements.`
]);

const image = result.response.parts[0].image;
```

---

## ⚠️ 重要な注意事項

> [!WARNING]
> **APIキーのセキュリティ**
> - APIキーは絶対に公開リポジトリにコミットしないでください
> - `.gitignore` に `.env.local` を追加してください
> - APIキーは他人と共有しないでください

> [!TIP]
> **無料枠の活用**
> - 1日1,500回の呼び出しは、開発とテストに十分です
> - 本番環境で大量のリクエストが予想される場合は、有料プランへの移行を検討してください

> [!NOTE]
> **Preview版について**
> - Gemini 3 Pro Image Preview は現在プレビュー版です
> - 将来的にAPI仕様が変更される可能性があります
> - 安定版がリリースされたら移行を検討してください

---

## 🎯 次のステップ

1. ✅ Google AI Studioでアカウント作成
2. ✅ APIキーを取得
3. ✅ APIキーをメモ帳に保存
4. ✅ PosterAI Appの`.env.local`にAPIキーを設定
5. ✅ 実装を開始

これで準備完了です！🎉
