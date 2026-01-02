# Render デプロイガイド

**作成日**: 2026-01-02  
**目的**: Vercelのタイムアウト問題を回避し、安定した画像生成を実現

---

## ✅ ロールバック方法

**問題があればVercelに戻せます**:
- Vercelプロジェクトはそのまま残っています
- Gitタグ: `vercel-working-backup`

---

## 📝 Render 移行手順

### Step 1: Render アカウント作成

1. https://render.com にアクセス
2. **Get Started for Free** をクリック
3. **GitHub** でサインアップ

---

### Step 2: 新規 Web Service 作成

1. ダッシュボードで **New +** → **Web Service**
2. **Connect a repository** で `HIROSHI2285/posterAI_app` を選択
3. **Connect**

---

### Step 3: 設定

| 項目 | 設定値 |
|------|--------|
| **Name** | `poster-ai-app` |
| **Region** | `Singapore (Southeast Asia)` ※日本に近い |
| **Branch** | `main` |
| **Root Directory** | `posterai-app` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Free` |

---

### Step 4: 環境変数を設定

**Environment Variables** セクションで追加:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | [あなたのAPIキー] |
| `GOOGLE_CLIENT_ID` | [あなたのClient ID] |
| `GOOGLE_CLIENT_SECRET` | [あなたのClient Secret] |
| `NEXT_PUBLIC_SUPABASE_URL` | [あなたのSupabase URL] |
| `SUPABASE_SERVICE_KEY` | [あなたのService Key] |
| `NEXTAUTH_SECRET` | [あなたのSecret] |
| `PORT` | `3000` |

**NEXTAUTH_URL はデプロイ後に設定**

---

### Step 5: デプロイ

1. **Create Web Service** をクリック
2. ビルド開始（5-10分かかります）
3. 完了すると URL が発行される

---

### Step 6: NEXTAUTH_URL を設定

1. デプロイ完了後、URLを確認（例: `https://poster-ai-app.onrender.com`）
2. **Environment** → **Add Environment Variable**
3. `NEXTAUTH_URL` = `https://[発行されたURL]`
4. 自動で再デプロイ

---

### Step 7: Google OAuth リダイレクト URI を追加

1. https://console.cloud.google.com にアクセス
2. **APIとサービス** → **認証情報**
3. OAuth 2.0 クライアントを編集
4. **承認済みのリダイレクト URI** に追加:

```
https://[RenderのURL]/api/auth/callback/google
```

5. **保存**

---

### Step 8: 動作確認

1. RenderのURLにアクセス
2. コールドスタートで25-30秒待つ可能性あり
3. Googleでログイン
4. ポスター生成を実行
5. **タイムアウトなしで生成されれば成功！** 🎉

---

## 🔄 コールドスタート対策（オプション）

### UptimeRobot で Keep-Alive

1. https://uptimerobot.com でアカウント作成
2. **New Monitor** をクリック
3. 設定:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://[RenderのURL]/api/auth/session`
   - **Monitoring Interval**: 5 minutes
4. **Create Monitor**

これでRenderがスリープしなくなります。

---

## 📞 トラブルシューティング

### ビルドエラー

- **Root Directory** が `posterai-app` になっているか確認
- 環境変数がすべて設定されているか確認

### ログインできない

- `NEXTAUTH_URL` がRenderのURLになっているか確認
- Google OAuthのリダイレクトURIを確認

### 画像生成失敗

- `GEMINI_API_KEY` が正しいか確認
- Supabaseの `jobs` テーブルが存在するか確認
