# PosterAI デザインシステム

このドキュメントでは、PosterAI アプリケーション全体で使用されるデザインシステムとスタイルガイドラインを定義します。

---

## カラーパレット

### ダークテーマ（デフォルト）

#### 背景色
- **メイン背景**: `#1a3d2e` (ダークグリーン)
- **グリッドパターン**: `rgba(255, 255, 255, 0.03)` (非常に薄い白)
- **カード背景 (濃)**: `bg-gray-900` (`#111827`)
- **カード背景 (中)**: `bg-gray-800` (`#1f2937`)
- **ヘッダー/フッター**: `bg-gray-900`

#### テキストカラー
- **プライマリ**: `text-white` (`#ffffff`)
- **セカンダリ**: `text-gray-300` (`#d1d5db`)
- **ターシャリ**: `text-gray-400` (`#9ca3af`)
- **無効/ヒント**: `text-gray-500` (`#6b7280`)

#### アクセントカラー
- **グリーン (メイン)**: `text-green-400`, `border-green-400`
- **ブルー**: `text-blue-400`
- **イエロー (警告)**: `text-yellow-300`
- **レッド (エラー)**: `text-red-400`

#### ボーダー
- **標準**: `border-gray-700` (`#374151`)
- **ヘッダー/フッター**: `border-gray-700`

### ライトテーマ（一部ページ）

#### 背景色
- **メイン背景**: `bg-green-50`
- **カード背景**: `bg-white`

---

## タイポグラフィ

### 見出し

```tsx
// h1 - ページタイトル
className="text-4xl md:text-5xl font-bold text-white mb-4"

// h2 - セクションタイトル
className="text-3xl md:text-4xl font-bold text-white mb-6"

// h3 - サブセクションタイトル
className="text-xl md:text-2xl font-bold text-white mb-4"
```

### 本文

```tsx
// 標準テキスト
className="text-gray-300"

// 小さいテキスト
className="text-sm text-gray-400"

// 説明テキスト
className="text-base text-gray-300"
```

---

## コンポーネントスタイル

### ヘッダー

**統一仕様** (全ページ共通):

```tsx
<header className="sticky top-0 z-50 bg-white border-b">
  <div className="container mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      {/* 左側：ナビゲーション + ロゴ */}
      <div className="flex items-center gap-6">
        {/* 戻るボタン / ホームボタン */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">テキスト</span>
        </Button>

        {/* ロゴ (クリック可能) */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.location.href = '/'}
        >
          <img
            src="/posterai-logo.svg"
            alt="PosterAI"
            className="h-10 sm:h-12"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* 右側：ユーザー情報 + アクション */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ユーザー情報 */}
        <div className="flex items-center gap-2 hidden sm:flex">
          <img className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm" />
          <span className="text-foreground font-medium max-w-[150px] truncate text-sm">
            {email}
          </span>
        </div>
      </div>
    </div>
  </div>
</header>
```

### カード

**ダークテーマページ**:

```tsx
// 標準カード
className="bg-gray-800 rounded-2xl p-8 border border-gray-700"

// 濃色カード (ネスト用)
className="bg-gray-900 rounded-lg p-6 border border-gray-700"

// 特殊カード (ネスト深い)
className="bg-gray-900 rounded-lg p-4 border border-gray-700"
```

**重要な原則**:
- ✅ **完全不透明**: すべての背景は `/opacity` を使用しない
- ✅ **視認性優先**: 高コントラストを維持
- ❌ **透明エフェクト禁止**: `bg-*/XX`, `border-*/XX` は使用しない
- ❌ **ブラーエフェクト禁止**: `backdrop-blur` は使用しない

### ボタン

```tsx
// プライマリボタン
className="bg-green-600 hover:bg-green-700 text-white"

// セカンダリボタン
className="bg-gray-200 hover:bg-gray-300 text-gray-900"

// ゴーストボタン
className="bg-transparent hover:bg-green-50 text-green-700"

// サイズ
size="sm"  // 小: ヘッダーなど
size="default"  // 標準
size="lg"  // 大: CTA
```

---

## レイアウト

### コンテナ

```tsx
// メインコンテナ
className="container mx-auto px-4 sm:px-6 py-8"

// セクション間隔
className="space-y-8"  // 標準
className="space-y-12" // 大きめ
className="space-y-20" // セクション区切り
```

### グリッド

```tsx
// 2カラム
className="grid md:grid-cols-2 gap-8"

// 3カラム
className="grid md:grid-cols-3 gap-6"

// 4カラム
className="grid md:grid-cols-4 gap-4"
```

---

## インタラクション

### ホバーエフェクト

```tsx
// カード (ホバーなし - 静的)
className="bg-gray-800 rounded-2xl p-8 border border-gray-700"

// リンク/ボタン
className="hover:bg-green-50 hover:text-green-700 transition-colors"

// ロゴ/画像
className="cursor-pointer hover:opacity-80 transition-opacity"
```

### トランジション

```tsx
// 標準
className="transition-all"
className="transition-colors"
className="transition-opacity"

// デュレーション (デフォルト: 150ms)
className="duration-200"
className="duration-300"
```

---

## レスポンシブデザイン

### ブレークポイント

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### 使用例

```tsx
// テキストサイズ
className="text-3xl md:text-4xl lg:text-5xl"

// スペーシング
className="px-4 sm:px-6 lg:px-8"

// 表示/非表示
className="hidden sm:flex"
className="block md:hidden"

// ロゴサイズ
className="h-10 sm:h-12"
```

---

## アクセシビリティ

### カラーコントラスト

- **テキスト on ダーク背景**: 最低コントラスト比 4.5:1
- **大きいテキスト (18pt+)**: 最低コントラスト比 3:1
- **ボーダー**: 明確に区別できる色を使用

### フォーカス状態

```tsx
className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
```

### セマンティックHTML

- 適切な見出しレベル (`h1`, `h2`, `h3`)
- `<header>`, `<main>`, `<footer>`, `<nav>` などのランドマーク
- `alt` 属性の適切な使用

---

## ベストプラクティス

### ✅ DO

1. **完全不透明な背景を使用**
   ```tsx
   className="bg-gray-800"  // ✅
   ```

2. **高コントラストを維持**
   ```tsx
   className="text-white"  // ✅ on dark background
   ```

3. **統一されたスペーシング**
   ```tsx
   className="p-8"  // ✅ 8の倍数
   ```

4. **レスポンシブ対応**
   ```tsx
   className="h-10 sm:h-12"  // ✅
   ```

### ❌ DON'T

1. **透明エフェクトを使用しない**
   ```tsx
   className="bg-gray-800/50"  // ❌
   className="backdrop-blur-md"  // ❌
   ```

2. **低コントラストを避ける**
   ```tsx
   className="text-gray-400"  // ❌ on gray background
   ```

3. **不統一なスペーシング**
   ```tsx
   className="p-7"  // ❌ 避ける
   ```

4. **過度なアニメーション**
   ```tsx
   className="animate-bounce"  // ❌ 静的なUIでは不要
   ```

---

## 更新履歴

- **2025-12-29**: 初版作成、ダークテーマ仕様を定義
