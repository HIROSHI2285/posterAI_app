# PosterAI - AI Poster Generator

AIを活用してプロフェッショナルなポスターを数秒で生成するWebアプリケーション。

## ✨ 特徴

- **AI画像生成**: Google Cloud Imagen 3を使用した高品質なポスター生成
- **カスタマイズ可能**: 用途、スタイル、レイアウト、カラーなど多彩なオプション
- **高速**: 数秒でプロ級のポスターを生成
- **モダンUI**: Tailwind CSSとshadcn/uiを使用した美しいインターフェース

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Cloud Imagen 3の設定

**詳しい手順**: [imagen-complete-setup.md](./docs/imagen-complete-setup.md)

#### 必要なもの:
- Google Cloudアカウント（$300無料トライアルあり）
- Vertex AI APIの有効化
- サービスアカウントキー（JSON）

#### 環境変数の設定:

`.env` ファイルを作成して以下を追加:

```bash
# Google Cloud プロジェクトID
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Google Cloud リージョン
GOOGLE_CLOUD_LOCATION=us-central1

# サービスアカウントキーへのパス
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📚 ドキュメント

- [Imagen 3 完全セットアップガイド](./docs/imagen-complete-setup.md) - サービスアカウント作成から設定まで
- [Imagen 3 概要](./docs/imagen-setup-guide.md) - Imagen 3の機能と料金

## 🏗️ 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **スタイリング**: Tailwind CSS 4
- **UI コンポーネント**: shadcn/ui
- **AI モデル**: Google Cloud Imagen 3
- **言語**: TypeScript

## 💰 料金

- **無料トライアル**: $300 クレジット（約7,500枚の画像生成可能）
- **1画像あたり**: 約 $0.04 (約5円)

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストを歓迎します！
