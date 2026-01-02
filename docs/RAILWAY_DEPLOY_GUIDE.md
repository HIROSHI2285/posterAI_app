# Railway デプロイガイド

**作成日**: 2026-01-02  
**目的**: Vercelのタイムアウト問題を回避し、安定した画像生成を実現

---

## 📋 概要

| 項目 | 内容 |
|------|------|
| **移行先** | Railway (無料プラン) |
| **タイムアウト** | なし（画像生成に十分） |
| **無料枠** | 500 CPU時間/月（約500枚/月） |
| **作業時間** | 約15分 |

---

## 🔧 事前準備

### 必要なもの

1. **GitHubアカウント**（既にあり ✅）
2. **環境変数の値**（Vercelで設定済みのもの）

### 環境変数一覧（控えておく）

| 変数名 | 取得場所 |
|--------|----------|
| `GEMINI_API_KEY` | Google AI Studio |
| `GOOGLE_CLIENT_ID` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `SUPABASE_SERVICE_KEY` | Supabase |
| `NEXTAUTH_SECRET` | 自分で生成済み |

---

## 📝 手順

### Step 1: Railway アカウント作成

1. https://railway.app にアクセス
2. **Login** → **Login with GitHub** をクリック
3. GitHubで認証を許可

---

### Step 2: 新規プロジェクト作成

1. ダッシュボードで **New Project** をクリック
2. **Deploy from GitHub repo** を選択
3. リポジトリ一覧から `HIROSHI2285/posterAI_app` を選択
4. **Configure** 画面が表示される

---

### Step 3: Root Directory を設定

1. **Settings** タブをクリック
2. **General** → **Root Directory** を見つける
3. `posterai-app` と入力
4. 保存

**重要**: これを設定しないとビルドが失敗します

---

### Step 4: 環境変数を設定

1. **Variables** タブをクリック
2. **New Variable** をクリックして以下を追加:

```
GEMINI_API_KEY = [あなたのAPIキー]
GOOGLE_CLIENT_ID = [あなたのClient ID]
GOOGLE_CLIENT_SECRET = [あなたのClient Secret]
NEXT_PUBLIC_SUPABASE_URL = [あなたのSupabase URL]
SUPABASE_SERVICE_KEY = [あなたのService Key]
NEXTAUTH_SECRET = [あなたのSecret]
PORT = 3000
```

**NEXTAUTH_URL はまだ設定しない**（URLが決まってから）

---

### Step 5: デプロイ開始

1. **Deployments** タブをクリック
2. 自動でデプロイが開始されます
3. ビルド完了まで待つ（2-5分）

---

### Step 6: 公開URLを取得

1. デプロイ完了後、**Settings** → **Public Networking** を確認
2. **Generate Domain** をクリック
3. URLが発行される（例: `posterai-app-production.up.railway.app`）

---

### Step 7: NEXTAUTH_URL を設定

1. **Variables** タブに戻る
2. **New Variable** で追加:

```
NEXTAUTH_URL = https://[発行されたURL]
```

例: `https://posterai-app-production.up.railway.app`

3. 自動で再デプロイが開始される

---

### Step 8: Google OAuth リダイレクトURI を追加

1. https://console.cloud.google.com にアクセス
2. **APIとサービス** → **認証情報**
3. OAuth 2.0 クライアントを編集
4. **承認済みのリダイレクト URI** に追加:

```
https://[RailwayのURL]/api/auth/callback/google
```

5. **保存**

---

### Step 9: 動作確認

1. RailwayのURLにアクセス
2. Googleでログイン
3. ポスター生成を実行
4. **画像が正常に生成されれば成功！** 🎉

---

## ⚠️ 注意事項

### Vercelとの併用について

- Vercelのプロジェクトはそのまま残しておいてOK
- 本番運用はRailwayを使用
- Vercelは予備として保持

### Google OAuthについて

- Railwayに移行後、**GoogleのリダイレクトURI**を更新する必要あり
- Vercel用のURIも残しておいてOK（両方動く）

### 無料枠について

- 500 CPU時間/月 = 約500枚の画像生成
- 月末に使い切るとサービス一時停止
- 翌月1日に自動復活

---

## 🔗 参考リンク

- Railway: https://railway.app
- Railway ドキュメント: https://docs.railway.app
- Google Cloud Console: https://console.cloud.google.com
- Supabase: https://supabase.com

---

## 📞 トラブルシューティング

### ビルドエラーが発生した場合

1. **Root Directory** が `posterai-app` に設定されているか確認
2. **環境変数** がすべて設定されているか確認
3. Railwayのログを確認

### ログインできない場合

1. `NEXTAUTH_URL` がRailwayのURLになっているか確認
2. Google Cloud ConsoleのリダイレクトURIを確認
3. 数分待ってから再試行

### 画像生成が失敗する場合

1. `GEMINI_API_KEY` が正しいか確認
2. Google AI Studioでクォータを確認
3. Supabaseの `jobs` テーブルが存在するか確認

---

**このガイドは `docs/RAILWAY_DEPLOY_GUIDE.md` に保存されています**
