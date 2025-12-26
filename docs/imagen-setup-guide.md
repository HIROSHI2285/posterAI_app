# Google AI Studio Imagen 4.0 セットアップガイド

## 🎯 Imagen 4.0 とは

**Imagen 4.0** は、Googleの最新テキストから画像を生成するAIモデルです。高品質なポスター、イラスト、写真風の画像を生成できます。

### ✨ 主要機能

| 機能 | 詳細 |
|------|------|
| **高品質画像生成** | テキストプロンプトから高解像度画像を生成 |
| **テキストレンダリング** | ポスター内のテキストを正確に描画 |
| **多様なスタイル** | フォトリアリスティックからイラストまで対応 |
| **高速生成** | 数秒で画像を生成 |

---

## 📝 セットアップ手順

### ステップ 1: Google Cloud アカウントの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン
3. 新規プロジェクトを作成

### ステップ 2: 支払い情報の設定

> [!IMPORTANT]
> **Imagen 3 を使用するには支払い情報の登録が必須です**
> - 無料トライアル: $300 のクレジット（90日間有効）
> - クレジットカードまたはデビットカードが必要
> - 無料枠を超えない限り自動課金されません

#### 支払い設定の手順:

1. Google Cloud Console で左上のメニューを開く
2. **「お支払い」** をクリック
3. **「お支払いアカウントを管理」** をクリック
4. **「お支払い方法を追加」** をクリック
5. クレジットカード情報を入力:
   - カード番号
   - 有効期限
   - セキュリティコード
   - 請求先住所
6. **「保存」** をクリック

### ステップ 3: Vertex AI API の有効化

1. Google Cloud Console で **「APIとサービス」** → **「ライブラリ」** を開く
2. 検索バーで **「Vertex AI API」** を検索
3. **「Vertex AI API」** をクリック
4. **「有効にする」** をクリック

### ステップ 4: 認証情報の作成

#### 方法 A: サービスアカウントキー（推奨）

1. **「APIとサービス」** → **「認証情報」** を開く
2. **「認証情報を作成」** → **「サービスアカウント」** をクリック
3. サービスアカウント名を入力（例: `posterai-service-account`）
4. **「作成して続行」** をクリック
5. ロールを選択:
   - **「Vertex AI ユーザー」**
   - **「サービス アカウント トークン作成者」**
6. **「完了」** をクリック
7. 作成したサービスアカウントをクリック
8. **「キー」** タブ → **「鍵を追加」** → **「新しい鍵を作成」**
9. **「JSON」** を選択 → **「作成」**
10. JSON ファイルがダウンロードされます（安全に保管）

#### 方法 B: APIキー（シンプル）

1. **「APIとサービス」** → **「認証情報」** を開く
2. **「認証情報を作成」** → **「APIキー」** をクリック
3. APIキーが表示されるのでコピーして保存

---

## 🔧 PosterAI App での設定

### .env.local ファイル

```bash
# Google Cloud プロジェクト情報
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# 認証情報（方法Aの場合）
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# または認証情報（方法Bの場合）
GOOGLE_CLOUD_API_KEY=your-api-key
```

### プロジェクトIDの確認方法

1. Google Cloud Console のトップページ
2. 画面上部のプロジェクト名の横に表示されているID

---

## 💰 料金体系

### Imagen 4.0 料金（2025年1月時点）

| モデル | 料金 | 特徴 |
|--------|------|------|
| **Imagen 4.0 Fast** | $0.02 / 画像 | 高速生成、シンプルなプロンプト向け |
| **Imagen 4.0 Standard** | $0.04 / 画像 | **推奨** バランス型、ポスター生成に最適 |
| **Imagen 4.0 Ultra** | $0.06 / 画像 | 最高品質、詳細な指示に対応 |

**PosterAI App は Imagen 4.0 Standard を使用しています**

### 無料トライアル

- Google AI Studio では**1日50枚まで無料**で生成可能
- 制限を超える場合は API キーを購入

### コスト管理

1. **予算アラートを設定**
   - Google Cloud Console → **「お支払い」** → **「予算とアラート」**
   - 予算額を設定（例: $10/月）
   - アラート閾値を設定（例: 50%, 90%, 100%）

2. **割り当て制限を設定**
   - **「IAMと管理」** → **「割り当て」**
   - Vertex AI のリクエスト数を制限

---

## 🧪 動作確認

### cURLでのテスト

```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict \
  -d '{
    "instances": [
      {
        "prompt": "A beautiful sunset over mountains"
      }
    ],
    "parameters": {
      "sampleCount": 1
    }
  }'
```

---

## ⚠️ 重要な注意事項

> [!WARNING]
> **コスト管理**
> - 予算アラートを必ず設定してください
> - 開発中は生成回数を制限しましょう
> - 本番環境に移行する前にコストを見積もりましょう

> [!CAUTION]
> **認証情報のセキュリティ**
> - サービスアカウントキー（JSON）は絶対に公開しないでください
> - `.gitignore` に必ず追加してください
> - 環境変数として管理してください

> [!TIP]
> **開発のヒント**
> - 開発中はキャッシュを活用して API 呼び出しを減らす
> - テスト時は低解像度で生成してコストを削減
> - 本番環境では CDN を使って生成画像を配信

---

## 🎯 次のステップ

1. ✅ Google Cloud アカウント作成
2. ✅ 支払い情報を設定
3. ✅ Vertex AI API を有効化
4. ✅ サービスアカウントキーまたはAPIキーを作成
5. ✅ `.env.local` に認証情報を設定
6. ✅ PosterAI App のコードを Imagen 3 用に更新

準備完了です！🎉
