# PosterAI — Claude Code ガイドライン

> このファイルは Claude Code が必ず読み込むプロジェクト固有の指示書です。
> 作業開始前に必ずこのファイルを確認してください。

---

## 📁 プロジェクト構造

実際のアプリケーションコードは **`posterai-app/`** サブディレクトリ内にあります。

```
posterAI_app/
└── posterai-app/        ← Next.jsアプリ本体
    ├── app/             ← App Router（APIルートを含む）
    ├── features/        ← 機能別モジュール
    ├── lib/             ← ユーティリティ（Gemini APIクライアント等）
    ├── components/      ← 共通UIコンポーネント
    ├── types/           ← TypeScript型定義
    └── docs/            ← プロジェクトドキュメント（このファイルの場所）
```

---

## 🎯 プロジェクト概要

**PosterAI** — Google Gemini APIを活用したAI駆動のポスター生成Webアプリ
- **バージョン**: v2.0.0（2026年3月更新）
- **スタック**: Next.js 16 / TypeScript / Tailwind CSS 4 / Supabase
- **本番URL**: https://poster-ai-app.onrender.com

---

## 🔧 現在のAIモデル構成

環境変数で各モデルを切り替えられます（**再デプロイ不要**）。

| 環境変数 | 現在値 | 用途 |
|----------|--------|------|
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-flash-image-preview` | ポスター新規生成（4K） |
| `GEMINI_EDIT_MODEL` | `gemini-3-pro-image-preview` | 画像編集・Inpainting |
| `GEMINI_ANALYSIS_MODEL` | `gemini-3.1-pro-preview` | 画像解析・テキスト抽出 |
| `GEMINI_SMART_EDIT_MODEL` | `gemini-3.1-flash-lite-preview` | テキスト/画像変更の判定 |

> **編集モデルの移行**: `GEMINI_EDIT_MODEL` を変更するだけで即時切り替え可能。
> この設計は MODELS_AND_PRICING.md に記録済み。

---

## 🚨 主要課題：画像編集機能の不足（2026年4月時点）

**ユーザーの課題**: 8割AI生成・2割手動調整が必要だが、思った修正ができない

### 具体的な問題点

1. **Fabric.jsがインストール済みだが未使用**
   - `package.json` に `fabric: ^6.5.2` あり
   - 実コードでは一切 import・使用されていない
   - → ドラッグ&ドロップ、リアルタイムプレビューが実現できていない

2. **リアルタイムプレビューがない**
   - 「保留リスト追加 → API送信 → 結果確認」のフロー
   - 反映するまで見た目が分からず、試行錯誤にコスト・時間がかかる

3. **テキスト位置調整が困難**
   - プロンプトで「右に移動」と指示するのみ
   - ピクセル単位の精密調整不可、座標の手動入力UIなし

4. **累積編集で品質劣化**
   - 編集のたびに画像再生成 → 元の品質が徐々に失われる
   - 詳細は `docs/SEQUENTIAL_EDIT_LIMITATIONS.md` を参照

5. **編集の取り消し機能なし**
   - Undo/Redo なし。失敗したら前の状態に戻せない

---

## 📰 最新 Gemini Image API 情報（2026年4月時点）

### Gemini 2.5 Flash Image ⭐ 編集移行候補
**リリース**: 2026年2月19日

| 機能 | 内容 |
|------|------|
| 精密な局所編集 | 自然言語で特定領域を変更 |
| オブジェクト削除 | 人物・ロゴ等の完全削除 |
| 被写体のポーズ変更 | ポーズや向きを調整 |
| インペインティング | マスク領域内のピクセル生成 |
| アウトペインティング | マスク外の領域拡張 |
| マルチ画像マージ | 複数画像を1つに統合 |
| SynthID透かし | AI生成画像の自動証明 |

**価格**: $0.039/画像（約¥6）
**コスト削減**: 現在の `gemini-3-pro-image-preview`（$0.134）から **71%削減**

> **移行方法**: `.env` の `GEMINI_EDIT_MODEL=gemini-2.5-flash-image` に変更するだけ

### Gemini 3.1 Flash Image Preview（Nano Banana 2）✅ 使用中
**リリース**: 2026年2月26日

- 4K解像度、4-6秒で生成
- ベンチマーク Text-to-Image #1
- 新アスペクト比: 1:4, 4:1, 1:8, 8:1
- 最大14枚の参照画像対応（現在1枚のみ使用）
- 価格: $0.067/画像（1K）

### 廃止予定モデル 🚨
| モデル | 廃止日 | 対応 |
|--------|--------|------|
| 全 Imagen モデル | 2026年6月24日 | Nano Banana へ移行推奨 |
| Gemini 3 Pro Preview | 2026年3月9日 | 移行済み ✅ |

---

## 🎯 改善計画と優先順位

### 即時実施（環境変数変更のみ）
- [ ] **`GEMINI_EDIT_MODEL=gemini-2.5-flash-image` に変更してテスト**
  - 編集精度の向上確認
  - コスト71%削減の検証
  - インペインティング機能の評価

### 短期（1-2日）
- [ ] **Fabric.js 統合**（最優先・最大効果）
  - `TextEditCanvas.tsx` に Fabric.js Canvas を追加
  - テキストのドラッグ移動・リサイズ・回転
  - リアルタイムプレビューの実現
- [ ] **座標の手動入力UI**
  - X/Y座標、幅、高さの数値入力
  - 回転角度の調整

### 中期（1週間）
- [ ] **編集履歴（Undo/Redo）**
  - `useReducer` で状態管理
  - `Ctrl+Z / Ctrl+Y` 対応
- [ ] **フリーハンド・多角形選択**
  - Fabric.js のフリードローイング活用
  - マスク画像生成精度向上
- [ ] **新アスペクト比対応**（1:4, 4:1, 1:8, 8:1）

### 長期（アーキテクチャ変更）
- [ ] **ハイブリッド編集モデル**（`docs/LAYERING_ARCHITECTURE.md` 参照）
  - AI生成 80% + クライアント編集 20%
  - SVGレイヤーとして保存、最終出力時のみ合成
- [ ] **専用エディター画面** (`/editor`)
  - Canva/Figma 風UI
  - レイヤーパネル・ツールバー・プロパティパネル

---

## 📚 関連ドキュメント索引

| ファイル | 内容 |
|----------|------|
| `MODELS_AND_PRICING.md` | AIモデル構成・コスト詳細・環境変数一覧 |
| `SEQUENTIAL_EDIT_LIMITATIONS.md` | 累積編集の制約と回避策 |
| `LAYERING_ARCHITECTURE.md` | Fabric.js レイヤー化の詳細設計 |
| `DEVELOPMENT_LOG.md` | 開発履歴・試行錯誤の記録 |
| `SECURITY_IMPLEMENTATION.md` | セキュリティ実装の詳細 |
| `FUTURE_ROADMAP.md` | 将来の機能拡張計画 |
| `PRODUCT_VISION.md` | プロダクトビジョン |

---

## ⚠️ 作業時の注意事項

1. **編集APIの変更は `GEMINI_EDIT_MODEL` 環境変数で行う**
   - コード変更不要、`.env` の値を更新するだけ

2. **Fabric.js はインストール済み（未使用）**
   - `features/poster-generator/components/TextEditCanvas.tsx` に統合予定
   - import するだけで使用開始できる状態

3. **累積編集の品質劣化に注意**
   - 編集は一度にまとめて行うよう設計する
   - `SEQUENTIAL_EDIT_LIMITATIONS.md` の推奨ワークフローを参照

4. **認証はホワイトリスト方式**
   - `allowed_users` テーブル（Supabase）でアクセス制御
   - 管理画面: `/admin/users`

5. **レート制限**
   - デフォルト: 100回/日
   - 管理者画面から個別調整可能

---

*作成日: 2026-04-14*
*更新者: Claude Code (HIROSHI2285)*
