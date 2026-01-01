# PosterAI 譲渡・移行ガイド

アプリケーションを別のオーナー（会社・個人）に譲渡する際の手順書です。

---

## 📋 移行チェックリスト

- [ ] 1. GitHubリポジトリの移行
- [ ] 2. Google Cloud (GCP) の設定
- [ ] 3. Supabase の移行
- [ ] 4. Vercel の移行（デプロイ先）
- [ ] 5. Google OAuth の設定変更
- [ ] 6. ドメイン移行（該当する場合）

---

## 1. GitHubリポジトリの移行

### オプションA: リポジトリの転送（推奨）

1. **Settings** → **General** → 最下部の **Danger Zone**
2. **Transfer ownership** をクリック
3. 新しいオーナーのGitHubユーザー名を入力
4. 確認して転送

### オプションB: フォーク＋クローン

新オーナーがフォークして独自リポジトリとして管理。

---

## 2. Google Cloud (GCP) の設定

### 新オーナーが必要なもの

1. **Google Cloud アカウント**
2. **新しいプロジェクト**を作成

### 手順

#### 2.1 Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. **Create API Key** をクリック
3. 新しいAPIキーをコピー

#### 2.2 Google OAuth クライアントの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIs & Services** → **Credentials**
3. **Create credentials** → **OAuth client ID**
4. **Application type**: Web application
5. **Authorized redirect URIs** に追加:
   - `http://localhost:3000/api/auth/callback/google` (開発)
   - `https://your-domain.com/api/auth/callback/google` (本番)
6. **Client ID** と **Client Secret** をメモ

---

## 3. Supabase の移行

### オプションA: 新規プロジェクト作成（推奨）

#### 3.1 新しいSupabaseプロジェクト

1. [Supabase](https://supabase.com/) で新アカウント/ログイン
2. **New Project** を作成
3. リージョン選択（推奨: 東京 `ap-northeast-1`）

#### 3.2 テーブル作成

SQLエディタで以下を実行:

```sql
-- ユーザー管理テーブル
CREATE TABLE allowed_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  daily_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Service role can do anything" ON allowed_users
  FOR ALL USING (auth.role() = 'service_role');
```

#### 3.3 初期管理者の追加

```sql
INSERT INTO allowed_users (email, is_admin, is_active)
VALUES ('new-admin@company.com', true, true);
```

#### 3.4 認証情報の取得

1. **Settings** → **API**
2. 以下をメモ:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **service_role key** (`SUPABASE_SERVICE_KEY`)

### オプションB: 既存プロジェクトの転送

Supabaseは組織レベルでの転送が可能。
1. **Organization Settings** → **Members** で新オーナーを追加
2. **Owner** 権限を付与
3. 旧オーナーを削除

---

## 4. Vercel の移行

### 4.1 新しいVercelプロジェクト

1. [Vercel](https://vercel.com/) で新アカウント/ログイン
2. **Import Project** → GitHubリポジトリを選択
3. **Framework Preset**: Next.js

### 4.2 環境変数の設定

**Settings** → **Environment Variables** で以下を設定:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio APIキー |
| `NEXTAUTH_URL` | `https://your-domain.com` | 本番URL |
| `NEXTAUTH_SECRET` | (ランダム文字列) | `openssl rand -base64 32` で生成 |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | OAuth Client Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase URL |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | Supabase Service Role Key |

### 4.3 ドメイン設定（オプション）

1. **Settings** → **Domains**
2. カスタムドメインを追加
3. DNSレコードを設定

---

## 5. Google OAuth の更新

新ドメインでOAuth認証を動作させるには:

1. [Google Cloud Console](https://console.cloud.google.com/) → **Credentials**
2. OAuth 2.0 クライアントを編集
3. **Authorized redirect URIs** を更新:
   ```
   https://new-domain.com/api/auth/callback/google
   ```
4. **Authorized JavaScript origins** を更新:
   ```
   https://new-domain.com
   ```

---

## 6. 譲渡完了後の確認事項

### 動作確認チェックリスト

- [ ] TOPページが表示される
- [ ] Googleログインが動作する
- [ ] 管理者がユーザー管理ページにアクセスできる
- [ ] ポスター生成が動作する
- [ ] サンプル画像解析が動作する

### 旧オーナーが削除すべきもの

1. 旧Gemini APIキーを無効化
2. 旧OAuth認証情報を削除
3. 旧Supabaseプロジェクトを削除（必要に応じて）

---

## 📞 サポート

移行時に問題が発生した場合は、GitHubのIssuesで報告してください。

---

**作成日**: 2026-01-02  
**バージョン**: 1.0
