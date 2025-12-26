# PosterAI App

<div align="center">
  <h3>🎨 AI画像解析 × AI画像生成で実現する次世代ポスター自動生成アプリ</h3>
  <p>サンプル画像から自動でデザインを抽出し、Google Gemini API（Imagen 4.0）で高品質なポスターを生成</p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
</div>

---

## 📸 スクリーンショット

### ホームページ
<div align="center">
  <img src="public/screenshot-home.png" alt="PosterAI ホームページ"/>
</div>

### ポスター生成ページ
<div align="center">
  <img src="docs/screenshots/generate-page-updated.png" alt="ポスター生成ページ"/>
  <p><em>わずか数秒でプロフェッショナルなポスターデザインを生成</em></p>
</div>

---

## ✨ 生成例

<div align="center">
  <img src="docs/screenshots/example-poster-1.jpg" alt="クリスマス抽選会ポスター" width="300"/>
  <img src="docs/screenshots/example-poster-2.jpg" alt="フリーマーケットポスター" width="300"/>
  
  <p><em>Imagen 4.0による高品質なテキストレンダリング（95%精度）</em></p>
</div>

---

## 🌟 主な機能

### 🎯 目玉機能：サンプル画像解析

**既存のポスターやデザインをアップロードすると、AIが自動でデザイン要素を抽出！**

#### どうやって使うの？

1. **サンプル画像をアップロード**
   - ポスター、チラシ、デザイン画像をドラッグ&ドロップ
   - JPEG、PNG対応

2. **AIが自動解析（Gemini 3 Pro Image Preview使用）**
   ```
   解析される要素：
   ✅ 配色（メインカラー、アクセントカラー、ベースカラー）
   ✅ レイアウト構成（分割方法、配置比率）
   ✅ デザインテイスト（モダン、エレガント、ポップなど）
   ✅ テキスト要素（位置、サイズ、スタイル）
   ✅ ビジュアル要素（人物、背景、構図、照明）
   ✅ コンテンツ構成（情報ブロック、CTA要素）
   ```

3. **フォームに自動入力**
   - 解析結果が各入力欄に自動反映
   - 必要に応じて微調整可能

4. **同じテイストのポスターを生成**
   - 抽出されたデザイン要素を基に新しいポスターを生成
   - 元のデザインを再現しながら、テキストや内容を変更可能

#### なぜ便利？

- ✅ **デザイン知識不要** - 参考画像があれば誰でも使える
- ✅ **時間短縮** - 手動設定の手間を大幅削減
- ✅ **統一感** - シリーズポスターの作成が簡単
- ✅ **学習機能** - 好きなデザインを分析して再利用

---

### その他の充実機能

- 📝 **テキストプロンプトからポスター生成**
  - タイトル、説明文から自動でデザイン生成
  - Imagen 4.0による高精度テキストレンダリング（95%）

- 🎨 **カスタマイズ可能なデザイン設定**
  - **用途選択**: イベント告知、商品広告、店内掲示、SNS投稿、チラシ、その他
  - **テイスト選択**: モダン、ミニマル、ポップ、エレガント、レトロ、和風、カジュアル、ビジネス
  - **レイアウト選択**: 中央揃え、左右分割、上下分割、三分割、グリッド、非対称
  - **カラーパレット**: 原色12色のプリセット + カスタムカラーピッカー

- 📐 **柔軟な出力サイズ**
  - プリセット: A3, A4, B4, B5
  - カスタムサイズ対応（px/mm単位切り替え）
  - 最大2048×2048px（2K解像度）

- 💬 **詳細指示プロンプト**
  - 人物・キャラクターの詳細指定
  - 背景、イメージ、季節感の設定
  - 装飾要素、雰囲気の指定

- 🔄 **リセット機能**
  - ワンクリックでフォームと生成画像をクリア

- 🔐 **Google OAuth認証**
  - セキュアなログイン
  - セッション管理

- 👥 **ユーザー管理システム**
  - 管理者/一般ユーザーの2段階権限
  - ユーザーごとのアクセス制御
  - 監査ログ機能

- ⚡ **レート制限**
  - 100リクエスト/分のAPI保護
  - IPベースの制限

---

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 15 (App Router, Turbopack)
- **言語**: TypeScript 5.0
- **スタイリング**: Tailwind CSS v4
- **UIコンポーネント**: Radix UI, Lucide React
- **フォーム管理**: React Hook Form + Zod

### バックエンド
- **認証**: NextAuth.js v4 (Google OAuth)
- **データベース**: Supabase (PostgreSQL)
- **セキュリティ**: 
  - Next.js セキュリティヘッダー
  - レート制限（100req/min）
  - Row Level Security (RLS)
  - 監査ログシステム

### AI/ML
- **AI API**: Google Gemini API
  - `imagen-4.0-generate-001` - ポスター画像生成（Imagen 4.0 Standard）
  - `gemini-3-pro-image-preview` - サンプル画像解析（Gemini 3 Pro）

---

## 🚀 セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/HIROSHI2285/posterAI_app.git
cd posterAI_app/posterai-app
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集して必要なAPIキーを設定：

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

**APIキーの取得方法:**

#### Gemini API Key
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. 生成されたAPIキーをコピー

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. OAuth 2.0クライアントIDを作成
3. 認証済みのリダイレクトURIに `http://localhost:3000/api/auth/callback/google` を追加

#### Supabase
1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. プロジェクトURLとService Roleキーを取得
3. `supabase_rls_policies.sql` と `audit_logs_table.sql` を実行してテーブルを作成

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 📖 使い方

### ベーシックな使い方

1. **デザイン設定**
   - 用途を選択（例: イベント告知）
   - テイストを選択（例: モダン）
   - レイアウトを選択（例: 中央揃え）
   - メインカラーを選択

2. **テキスト入力**
   - メインタイトル（必須）: 例「夏祭り2025」
   - サブタイトル（任意）: 例「地域最大級の夏イベント」
   - 追加テキスト（任意）: 日時、場所などの詳細情報

3. **詳細指示（オプション）**
   - 人物: 例「浴衣を着た20代女性、笑顔で花火を見上げる」
   - 背景: 例「夜空に打ち上げ花火、屋台が並ぶお祭り会場」
   - イメージ: 例「賑やか、華やか、夏らしい雰囲気」

4. **出力サイズ選択**
   - プリセット（A4など）を選択
   - またはカスタムサイズを入力

5. **生成**
   - 「ポスター生成」ボタンをクリック
   - 数秒〜10秒でAIが画像を生成
   - ダウンロードボタンで保存

### アドバンスド：サンプル画像解析を使う

1. **「サンプル画像から設定を抽出」セクションを開く**

2. **画像をアップロード**
   - ファイル選択ボタンをクリック
   - またはドラッグ&ドロップ
   - 対応形式: JPEG, PNG

3. **「解析」ボタンをクリック**
   - AIが画像を分析（約2-5秒）
   - 詳細なデザイン情報を抽出

4. **自動入力された設定を確認**
   - 用途、テイスト、レイアウトが自動選択
   - メインカラー、アクセントカラーが設定
   - 詳細説明が「カスタムプロンプト」に入力

5. **必要に応じて調整**
   - タイトルを変更
   - 色を微調整
   - レイアウトを変更

6. **生成開始**
   - 元のデザインと同じテイストのポスターが生成される

---

## 💰 料金

### API使用料金

| 項目 | モデル | 価格/回 |
|------|--------|---------|
| 画像生成 | Imagen 4.0 Standard | $0.04 (約6円) |
| 画像解析 | Gemini 3 Pro Image Preview | $0.006 (約1円) |

**月間コスト例**:
- 軽量使用（50枚生成 + 20回解析）: 約318円/月
- 中程度（200枚 + 100回）: 約1,290円/月
- 大量使用（1000枚 + 500回）: 約6,450円/月

詳細は [`docs/api-pricing-and-limits.md`](docs/api-pricing-and-limits.md) を参照。

---

## プロジェクト構造

```
posterai-app/
├── app/
│   ├── api/
│   │   ├── admin/              # 管理者API
│   │   │   ├── check/          # 管理者チェック
│   │   │   └── users/          # ユーザー管理
│   │   ├── analyze-image/      # 画像解析API
│   │   ├── auth/               # NextAuth認証
│   │   ├── generate-poster/    # ポスター生成API
│   │   └── jobs/               # ジョブステータス
│   ├── admin/                   # 管理者ページ
│   │   └── users/              # ユーザー管理UI
│   ├── generate/                # メイン生成ページ
│   └── page.tsx                 # ランディングページ
├── components/
│   └── ui/                      # 再利用可能UIコンポーネント
├── features/
│   └── poster-generator/
│       └── components/          # ポスター生成フォーム
├── lib/
│   ├── auth.ts                  # NextAuth設定
│   ├── gemini.ts                # Gemini API設定
│   ├── supabase.ts              # Supabase設定
│   ├── rate-limit.ts            # レート制限
│   └── audit-log.ts             # 監査ログ
├── types/
│   ├── poster.ts                # ポスター型定義
│   └── next-auth.d.ts           # NextAuth型拡張
├── docs/
│   ├── api-pricing-and-limits.md   # API料金と制限
│   └── imagen-setup-guide.md       # Imagen セットアップガイド
├── public/                      # 静的ファイル
└── README.md                    # このファイル
```

---

## 🔐 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GEMINI_API_KEY` | Google AI Studio APIキー | ✅ |
| `NEXTAUTH_URL` | NextAuthのベースURL | ✅ |
| `NEXTAUTH_SECRET` | NextAuthのシークレットキー | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | ✅ |
| `SUPABASE_SERVICE_KEY` | Supabase Service Roleキー | ✅ |

---

## 🔒 セキュリティ

### 実装済みセキュリティ機能

#### 認証・認可
- ✅ Google OAuth 2.0認証
- ✅ 2段階権限システム（管理者/一般ユーザー）
- ✅ セッション管理
- ✅ 自己権限変更防止

#### API保護
- ✅ レート制限（100リクエスト/分）
- ✅ IPアドレスベース制限
- ✅ 管理者APIの保護

#### データベース
- ✅ Supabase Row Level Security (RLS)
- ✅ Service Roleキーによるバックエンド専用アクセス

#### セキュリティヘッダー
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security
- ✅ Referrer-Policy
- ✅ Permissions-Policy

#### 監査ログ
- ✅ 全ユーザー操作を記録
- ✅ IP アドレス、User-Agent記録
- ✅ 成功/失敗のステータス記録

**セキュリティスコア**: **A (95/100)**

---

## ビルド

本番用ビルドを作成：

```bash
npm run build
npm start
```

---

## 📝 ドキュメント

- [API料金と制限](docs/api-pricing-and-limits.md)
- [Imagen セットアップガイド](docs/imagen-setup-guide.md)

---

## 🤝 コントリビューション

プルリクエストは歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

---

## ライセンス

MIT

---

## 作者

**HIROSHI2285**

---

## 🔗 リンク

- [GitHub Repository](https://github.com/HIROSHI2285/posterAI_app)
- [Google AI Studio](https://aistudio.google.com/)
- [Imagen Documentation](https://deepmind.google/technologies/imagen/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 📞 サポート

問題が発生した場合は、[Issues](https://github.com/HIROSHI2285/posterAI_app/issues) を開いてください。

---

<div align="center">
  <p>Made with ❤️ using Next.js and Google Gemini API</p>
</div>
