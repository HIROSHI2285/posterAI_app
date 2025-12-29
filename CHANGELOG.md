# Changelog

All notable changes to the PosterAI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2025-12-29] - UI/UX改善

### Changed

#### How-to-useページのダークテーマ復元
- **背景**: ライトテーマからダークテーマに復元
  - メイン背景: ダークグリーン (`#1a3d2e`) + グリッドパターン (`rgba(255, 255, 255, 0.03)`)
  - カード背景: 完全不透明な `bg-gray-800` / `bg-gray-900`
- **透明エフェクトの完全削除**:
  - すべてのグラデーション透明背景を削除 (`bg-gradient-to-r from-green-600/20 to-blue-600/20` など)
  - すべての透明ボーダーを削除 (`border-white/10`, `border-white/20` など)
  - ホバー時の透明エフェクトを削除 (`hover:border-green-400/50` など)
- **視認性の向上**:
  - すべてのボーダーを `border-gray-700` に統一
  - テキストカラーを高コントラストに調整 (`text-white`, `text-gray-300`)
  - すべてのカードとコンテンツボックスを完全不透明に変更

#### ヘッダーの統一化
- **画像生成ページと会員管理ページのヘッダーを統一**:
  - ロゴサイズ: `h-10 sm:h-12` (レスポンシブ対応)
  - ボタンサイズ: `size="sm"` に統一
  - 戻るボタン: 小画面では「戻る」テキストを非表示 (`hidden sm:inline`)
  - 会員管理ページから不要な仕切り線とタイトルを削除
- **統一されたスタイル**:
  - パディング: `px-6 py-4`
  - ホバーエフェクト: `hover:bg-green-50 hover:text-green-700`
  - ユーザー情報表示の統一

### Added

#### ロゴのクリック機能
- **全ページのヘッダーロゴにクリック機能を追加**:
  - 画像生成ページ (`/generate`)
  - 会員管理ページ (`/admin/users`)
  - How-to-useページ (`/how-to-use`)
- **追加された機能**:
  - `cursor-pointer`: ポインターカーソル表示
  - `hover:opacity-80`: ホバー時の視覚フィードバック
  - `transition-opacity`: スムーズなアニメーション
  - `onClick`: TOPページ (`/`) への遷移

### Removed

#### How-to-useページから削除
- すべてのグラデーション透明背景エフェクト
- すべての透明ボーダー (`/10`, `/20`, `/30`, `/40`, `/50`)
- すべてのホバー時透明エフェクト
- 「おすすめの使い方」セクションのホバーボーダー変化エフェクト

#### 会員管理ページから削除
- ロゴとタイトルの間の仕切り線 (`border-l`)
- ページタイトル表示 (「ユーザー管理」)

---

## Previous Changes

(以前の変更履歴はここに記載)
