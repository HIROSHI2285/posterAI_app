# PosterAI - AI搭載ポスター生成ツール

Nano Banana Pro (Powered by Google Gemini) を活用した、プロ品質のポスター生成Webアプリケーション。

**本番URL**: [https://poster-ai-app.onrender.com](https://poster-ai-app.onrender.com)

![PosterAI](./public/posterai-logo.svg)

---

## 作成サンプル

<table>
  <tr>
    <td align="center">
      <img src="./public/samples/christmas_lottery.jpg" width="300" alt="クリスマス抽選会" /><br />
      <b>クリスマス抽選会</b>
    </td>
    <td align="center">
      <img src="./public/samples/grand_opening.jpg" width="300" alt="グランドオープン" /><br />
      <b>グランドオープン</b>
    </td>
  </tr>
</table>

---

## スクリーンショット

### TOPページ / ダッシュボード
![TOPページ](./public/samples/real_dashboard.png)

### 使い方ガイド

<table>
  <tr>
    <td align="center">
      <img src="./public/samples/real_standard_usage_jp.png" width="400" alt="テキスト生成" /><br />
      <b>テキストから生成</b>
    </td>
    <td align="center">
      <img src="./public/samples/real_ref_usage_jp.png" width="400" alt="画像参照" /><br />
      <b>画像参照 & 素材挿入</b>
    </td>
  </tr>
</table>

### AI編集スイート

<table>
  <tr>
    <td align="center">
      <img src="./public/samples/real_edit_prompt_jp.png" width="280" alt="プロンプト編集" /><br />
      <b>プロンプト再編集</b>
    </td>
    <td align="center">
      <img src="./public/samples/real_edit_rect_jp.png" width="280" alt="矩形編集" /><br />
      <b>矩形（領域）編集</b>
    </td>
    <td align="center">
      <img src="./public/samples/real_edit_text_jp.png" width="280" alt="テキスト編集" /><br />
      <b>テキスト編集</b>
    </td>
  </tr>
</table>

### プロジェクト保存 & 出力
![プロジェクト保存](./public/samples/real_save_project_jp_v2.png)

---

## 概要

PosterAIは、テキスト入力やサンプル画像から、AIが自動的に高品質なポスターデザインを生成するツールです。**Nano Banana 2** (Gemini 3.1 Flash Image) の最先端AI技術により、**4K高解像度**のプロフェッショナルなビジュアルを数分で作成できます。

**v2.0.0**では、Gemini 3.1 API Suiteへの完全移行を完了。**4K高解像度出力**、**キャラクターSeed永続化**、**smart-edit Flash-Lite化**によるAPIコスト87%削減を実現。

### 主な機能

- **AI画像生成**: Nano Banana 2（Gemini 3.1 Flash Image）による**4K高解像度**ポスター生成
- **高精度画像解析**: アップロード画像からデザイン要素（配色、構図、スタイル）を詳細抽出
- **2つの生成モード**:
  - **画像 + テキスト**: サンプル画像を参照して高再現性で生成
  - **テキストのみ**: 解析情報から新しいオリジナルデザインを生成
- **AIモデル選択機能**:
  - **本番モデル**: `gemini-3.1-flash-image-preview` (Nano Banana 2) — 4K生成
  - **開発モデル**: `gemini-2.5-flash-image` — 高速・低コスト
- **AI編集スイート**:
  - **テキスト編集**: Flash-Liteによる超低コストJSON更新（画像再生成なし）
  - **矩形（領域）編集**: Inpainting技術で指定範囲だけを修正・削除
  - **画像挿入**: ロゴや素材を後からレイアウトに追加
- **キャラクターSeed永続化**: 再生成時に同じSeedを使い回すことで同一キャラクターの再現を保証
- **高度なセキュリティ対策**: CSP、監査ログ、レート制限の実装

---

## プロジェクト構造

最新のNext.js App RouterとFeature-basedディレクトリ構成を採用しています。

```
posterai-app/
├── app/                      # Next.js App Router
│   ├── page.tsx             # TOPページ
│   ├── generate/            # ポスター生成ページ (メイン機能)
│   ├── how-to-use/          # 使い方ページ (UIモックアップ搭載)
│   ├── admin/               # 管理者ダッシュボード
│   └── api/                 # API Routes (Serverless)
├── components/              # 共通UIコンポーネント (Shadcn/ui)
├── features/                # 機能別モジュール
│   └── poster-generator/    # ポスター生成機能のコアロジック
├── lib/                     # ユーティリティ & クライアント
│   ├── gemini.ts           # Gemini API Client
│   ├── supabase.ts         # Supabase Client
│   └── job-store.ts        # ジョブ状態管理
├── public/                  # 静的アセット
│   └── samples/             # UIモックアップ画像
└── docs/                    # 開発ドキュメント
```

---

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router): フルスタックフレームワーク
- **React 18**: UIライブラリ
- **TypeScript**: 静的型付け
- **Tailwind CSS**: ユーティリティファーストCSS
- **Shadcn/ui**: アクセシビリティ対応コンポーネント
- **Lucide React**: アイコンセット

### バックエンド & AI
- **Nano Banana 2**: 画像生成 4K (Powered by Gemini 3.1 Flash Image)
  - `gemini-3.1-flash-image-preview`
- **Nano Banana Pro**: 画像編集・Inpainting (Powered by Gemini 3 Pro Image)
  - `gemini-3-pro-image-preview`
- **Gemini 3.1 Pro**: 高度解析（ブループリント抽出、テキスト層解析）
  - `gemini-3.1-pro-preview`
- **Gemini 3.1 Flash-Lite**: Smart Edit分類（超低コスト）
  - `gemini-3.1-flash-lite-preview`
- **NextAuth.js**: 認証基盤 (Google OAuth)
- **Supabase**: データベース (ユーザー管理、設定保存)
- **Vercel / Render**: デプロイ環境

---

## 使い方

1. **ログイン**: Googleアカウントでワンクリックログイン
2. **ダッシュボード**: 「新規作成」からスタート
3. **生成設定**:
   - **テキスト生成**: 「夏のフェス」「高級なカフェ」など作りたいイメージを入力
   - **画像参照**: 参考画像をアップロードし、「このスタイルで」と指示
4. **編集**: 生成された画像をAIエディタで微調整（文字変更、部分修正）
5. **保存**: プロジェクトとして保存 (`.json`) または 画像としてダウンロード (`.png`)

詳細は [使い方ページ](/how-to-use) をご覧ください。（TOPページと同様の没入感あるダークテーマで解説しています）

---

## 最新アップデート（v2.0.0）: Gemini 3.1完全最適化

2026年3月9日にすべての最適化を完了。「Gemini 3.1 階層型アーキテクチャ」により、**4K高解像度・キャラクター一貫性・APIコスト87%削減**を同時実現。

### モデル構成（v2.0.0確定版）

| レイヤー | モデル | 用途 | 単価目安 |
|---|---|---|---|
| **画像生成** | `gemini-3.1-flash-image-preview` | generate-poster | 約4K・約10円/枚 |
| **画像編集** | `gemini-3-pro-image-preview` | unified-edit, edit-region | 約4円/回 |
| **高度解析** | `gemini-3.1-pro-preview` | extract-blueprint | 約0.17円/回 |
| **軽量分類** | `gemini-3.1-flash-lite-preview` | smart-edit | 約0.005円/回 |

### v2.0.0 主要変更
- **4K化**: `imageSize: '2K'` → `'4K'`（コスト同じまま块質向上）
- **Seed永続化**: `character_features.seed`を再利用し同一キャラクターを再現
- **thinkingConfig追加**: smart-editにFlash-Liteの思考深度設定（分類精度向上）
- **flash-lite化**: smart-editをPro→Flash-Liteに変更（編集判定コスト**97%削減**）

| ワークフロー（1枚生成＋3回テキスト編集） | 移行前 | 現在（v2.0.0） | 削減率 |
|---|---|---|---|
| **合計APIコスト** | **約¥80** | **約¥10.015** | **約87.5%削減 🔥** |

詳細は [docs/MODELS_AND_PRICING.md](docs/MODELS_AND_PRICING.md) を参照。

---

## 開発者・管理者向け

### セットアップ

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数 (.env.local) の設定
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
...

# 3. 開発サーバー起動
npm run dev
```

### デプロイ

Render Web Servicesへのデプロイを推奨します。`main` ブランチへのプッシュで自動デプロイがトリガーされます。
