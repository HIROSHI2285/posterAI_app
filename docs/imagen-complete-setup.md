# Imagen 3 設定完了ガイド

## ✅ あなたが設定する必要があるもの

### 1. サービスアカウントキー（JSON）の作成

APIキーだけでは **Vertex AI / Imagen 3 にアクセスできません**。  
サービスアカウントキー（JSON形式）が必要です。

#### 手順:

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. 左上メニュー → **「IAMと管理」** → **「サービスアカウント」**
3. **「サービスアカウントを作成」** をクリック
4. サービスアカウント名を入力（例: `posterai-imagen`）→ **「作成して続行」**
5. **ロールを選択**:
   - **「Vertex AI ユーザー」** を追加
   - **「サービス アカウント トークン作成者」** を追加
6. **「完了」** をクリック
7. 作成したサービスアカウントをクリック
8. **「キー」** タブ → **「鍵を追加」** → **「新しい鍵を作成」**
9. **「JSON」** を選択 → **「作成」**
10. **JSONファイルがダウンロードされます**（重要！安全に保管）

---

### 2. JSONファイルを安全な場所に配置

ダウンロードしたJSONファイルを以下の場所に配置してください:

```
c:\Users\pc\Desktop\anitigravity\posterAI_app\posterai-app\service-account-key.json
```

> [!WARNING]
> **セキュリティ警告**
> - このJSONファイルは絶対にGitにコミットしないでください
> - `.gitignore` に既に追加されているので安全です
> - 他人と共有しないでください

---

### 3. `.env` ファイルの設定

`.env` ファイルを以下の内容に**完全に書き換えてください**:

```bash
# Google Cloud プロジェクトID（Google Cloud Consoleで確認）
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here

# Google Cloud リージョン（デフォルト: us-central1）
GOOGLE_CLOUD_LOCATION=us-central1

# サービスアカウントキー（JSON）へのパス
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

#### プロジェクトIDの確認方法:

1. Google Cloud Console のトップページ
2. 画面上部のプロジェクト選択ボタンをクリック
3. プロジェクト名の下に表示される英数字の文字列（例: `my-project-123456`）

---

### 4. `.gitignore` の確認（既に設定済み）

`.gitignore` に以下が含まれているか確認:

```
.env*
*.json
service-account-key.json
```

✅ 既に設定されています！

---

## 🧪 設定の確認

### ステップ1: ファイル構造を確認

```
posterai-app/
├── .env                          ← ここに環境変数を設定
├── service-account-key.json      ← サービスアカウントキー（ダウンロードしたJSON）
├── app/
│   └── api/
│       └── generate-poster/
│           └── route.ts          ← Imagen 3 APIコード
```

### ステップ2: 開発サーバーを再起動

```bash
npm run dev
```

### ステップ3: ポスター生成をテスト

1. http://localhost:3000/generate にアクセス
2. フォームを入力
3. 「ポスターを生成」をクリック
4. 数秒待つ

---

## 🔍 トラブルシューティング

### エラー: "Google Cloud プロジェクトIDが設定されていません"

→ `.env` ファイルに `GOOGLE_CLOUD_PROJECT_ID` を追加してください

### エラー: "Google Cloud 認証情報が設定されていません"

→ `.env` ファイルに `GOOGLE_APPLICATION_CREDENTIALS` を追加してください

### エラー: "Permission denied" または "403 Forbidden"

→ サービスアカウントに正しいロール（**Vertex AI ユーザー**）が付与されているか確認

### エラー: "Billing account required"

→ Google Cloud で支払い情報を設定してください（$300無料トライアルあり）

---

## 💰 コスト管理

### 予想コスト

- 1枚の画像生成: 約 **$0.04** (約5円)
- $300 無料トライアル: 約 **7,500枚** の画像を生成可能

### 予算アラートの設定（推奨）

1. Google Cloud Console → **「お支払い」**
2. **「予算とアラート」** をクリック
3. **「予算を作成」** をクリック
4. 月額予算を設定（例: $10/月）
5. アラート閾値を設定（50%, 90%, 100%）

---

## 📋 チェックリスト

設定完了前に確認してください:

- [ ] Google Cloud で支払い情報を設定
- [ ] Vertex AI API を有効化
- [ ] サービスアカウントを作成
- [ ] サービスアカウントに「Vertex AI ユーザー」ロールを付与
- [ ] サービスアカウントキー（JSON）をダウンロード
- [ ] JSONファイルを `posterai-app/service-account-key.json` に配置
- [ ] `.env` ファイルに `GOOGLE_CLOUD_PROJECT_ID` を設定
- [ ] `.env` ファイルに `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json` を設定
- [ ] 開発サーバーを再起動 (`npm run dev`)

すべて完了したら、実際にポスター生成をテストしてください！🎉
