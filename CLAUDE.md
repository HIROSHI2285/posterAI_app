# PosterAI — Claude Code 必読ガイド

> **重要**: 作業開始前に必ず `docs/CLAUDE.md` を読んでください。
> プロジェクトの課題・改善計画・最新API情報がすべてそこにあります。

---

## クイックリファレンス

### プロジェクト
- **アプリ**: AI駆動ポスター生成 (Google Gemini API)
- **スタック**: Next.js 16 / TypeScript / Tailwind CSS 4 / Supabase
- **バージョン**: v2.0.0

### 最重要課題（2026年4月）
**画像編集機能の不足** — 8割AI生成・2割手動調整が必要だが思った修正ができない

### 対応済み ✅（2026-04-14）
- 編集モデルを `gemini-2.5-flash-image` に移行（コスト71%削減・編集精度向上）
- `PosterPreview.tsx` の未定義変数 `editModelMode` によるビルドエラーを修正

### モデル環境変数（現在の設定）
```env
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview    # 生成（最新・使用中）
GEMINI_EDIT_MODEL=gemini-2.5-flash-image             # 編集 ✅ 2026-04-14 移行済み
GEMINI_ANALYSIS_MODEL=gemini-3.1-pro-preview          # 解析
GEMINI_SMART_EDIT_MODEL=gemini-3.1-flash-lite-preview # 判定
```

### 重要な発見
- **Fabric.js がインストール済みだが未使用**（`package.json` に `fabric: ^6.5.2`）→ 次の改善候補
- **`GEMINI_EDIT_MODEL` を変えるだけで編集モデルを切り替え可能**（再デプロイ不要）
- **Imagen モデルが2026年6月24日に廃止予定**（対応不要、既にNano Banana使用中）
- **ロールバック**: `GEMINI_EDIT_MODEL=gemini-3-pro-image-preview` で元に戻せる

---

## 詳細情報

`docs/CLAUDE.md` を参照してください：
- 現在の課題の詳細
- 最新API情報（Gemini 2.5 Flash Image 等）
- 改善計画と優先順位
- 関連ドキュメント索引

---

*作成日: 2026-04-14 / 最終更新: 2026-04-14*
