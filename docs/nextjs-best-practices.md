# Next.js 15 App Router ベストプラクティス

## 🏗️ プロジェクト構造

### 推奨ディレクトリ構成
```
posterai-app/
├── app/                      # App Router コア
│   ├── (marketing)/         # ルートグループ（URLに影響なし）
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (dashboard)/         # 別のルートグループ
│   ├── api/                 # API Routes
│   ├── layout.tsx           # ルートレイアウト
│   └── globals.css
├── components/              # 共有UIコンポーネント
│   ├── ui/                  # shadcn/ui コンポーネント
│   └── shared/              # カスタム共有コンポーネント
├── features/                # 機能ベースのモジュール
│   ├── poster-generator/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── actions.ts       # Server Actions
│   └── auth/
├── lib/                     # ユーティリティと設定
│   ├── db.ts               # データベース接続
│   ├── storage.ts          # ストレージ設定
│   └── utils.ts            # 共通ユーティリティ
├── public/                  # 静的ファイル
└── types/                   # TypeScript型定義
```

## 🎯 コア原則

### 1. Server Components をデフォルトに
- App Routerでは全コンポーネントがデフォルトでServer Componentsになる
- Server Componentsは:
  - サーバー側でレンダリング
  - クライアントに送るJavaScriptを最小化
  - Time to Interactive (TTI) を改善
  - より良いキャッシング
- Client Componentsは必要な場合のみ `"use client"` で指定

### 2. レンダリング戦略の選択
- **SSG (Static Site Generation)**: 完全に静的なコンテンツ（マーケティングページ等）
- **ISR (Incremental Static Regeneration)**: 定期的に更新されるコンテンツ（ブログ等）
- **SSR (Server-Side Rendering)**: ユーザー固有のリアルタイムデータ（ダッシュボード等）
- **PPR (Partial Prerendering)**: 静的とリアルタイムが混在するページ（実験的機能）
- **CSR (Client-Side Rendering)**: 高度なインタラクティブ性が求められ、SEOが不要な場合

### 3. パフォーマンス最適化

#### キャッシングと再検証
- Next.js 15ではGET Route HandlersとClient Router Cacheがデフォルトで非キャッシュに変更
- 明示的にキャッシュをオプトインする必要がある

#### Dynamic Imports
```typescript
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
})
```

#### 画像最適化
```typescript
import Image from 'next/image'

<Image
  src="/poster.jpg"
  alt="Generated Poster"
  width={800}
  height={600}
  priority // Above the fold の画像に使用
/>
```

#### Turbopack
- Next.js 15から導入されたRustベースのバンドラー
- 高速な開発とビルドパフォーマンス

### 4. SEO最適化

#### Metadata API
```typescript
// app/page.tsx
export const metadata = {
  title: 'PosterAI - AI Poster Generator',
  description: 'Create professional posters with AI',
  openGraph: {
    title: 'PosterAI',
    description: 'Create professional posters with AI',
    images: ['/og-image.jpg'],
  },
}
```

#### 動的メタデータ
```typescript
export async function generateMetadata({ params }) {
  return {
    title: `Poster ${params.id}`,
  }
}
```

### 5. Next.js 15 固有の機能

#### 非同期リクエストAPI
- `cookies()`, `headers()`, `params`, `searchParams` が非同期APIに
- React 19 RCとの統合

```typescript
// Next.js 14
const cookieStore = cookies()

// Next.js 15
const cookieStore = await cookies()
```

## 🔧 PosterAI への適用

### 推奨アーキテクチャ

1. **メインページ（ポスター生成）**: SSR または CSR
   - ユーザー入力を多用するためClient Componentsを活用
   - AI生成は Server Actions で処理

2. **ギャラリー**: ISR
   - 定期的に更新されるコンテンツ
   - 軽量な静的ページとして配信

3. **認証**: Server Components + Server Actions
   - Better Auth を使用
   - セキュアな認証フロー

### パフォーマンス目標
- Time to Interactive (TTI) < 3秒
- Largest Contentful Paint (LCP) < 2.5秒
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1
