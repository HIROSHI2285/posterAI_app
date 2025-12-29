# PosterAI 開発履歴

## プロジェクト概要

AIを活用した自動ポスター生成アプリケーション。Google Gemini APIを使用して、テキストプロンプトから高品質なポスターデザインを生成します。

**開発期間:** 2025年12月22日  
**リポジトリ:** https://github.com/HIROSHI2285/posterAI_app

---

## 主要な実装機能

### 1. 基本的なポスター生成機能

#### 実装内容
- Google Gemini API (`gemini-3-pro-image-preview`) を使用した画像生成
- Next.js 15 (App Router) による実装
- TypeScript による型安全な実装

#### 技術スタック
- **フレームワーク:** Next.js 15
- **言語:** TypeScript
- **スタイリング:** Tailwind CSS
- **UIコンポーネント:** Radix UI (Shadcn UI)
- **AI API:** Google Gemini API

---

### 2. フォームコントロールの強化

#### Phase 1: 素材画像アップロード機能の検討

**当初の計画:**
- 素材画像をアップロードして生成プロンプトに反映させる機能

**技術的制限の発見:**
- `gemini-3-pro-image-preview` モデルは画像入力を直接受け付けない
- 特に人物やキャラクターの**直接的な再現が不可能**
- このモデルはテキストプロンプトのみで画像を生成

**設計変更:**
- 素材画像アップロード機能を削除
- テキストベースの詳細指示に切り替え

#### Phase 2: キャラクター/人物説明フィールドの追加

**実装:**
- `characterDescription` フィールドを `PosterFormData` 型に追加
- テキストエリアで人物・キャラクターの詳細を入力可能に
- プレースホルダー例：「笑顔の若い女性、カジュアルな服装、手を振っているポーズ」

**後の統合:**
- このフィールドは後に「詳細指示（プロンプト）」フィールドに統合

#### Phase 3: 詳細指示（プロンプト）フィールドの実装

**仕様:**
- 人物、素材、背景、イメージ、季節感などを自由に指定
- 6行→10行のテキストエリア
- キャラクター説明フィールドと統合

**実装の試行錯誤:**

**試行1: APIプロンプトへの直接統合**
```typescript
if (detailedPrompt) {
    prompt += `\n\nDetailed Instructions (IMPORTANT - Follow these carefully):\n${detailedPrompt}`;
}
```
- **結果:** エラー発生 `"model output must contain either output text or tool calls, these cannot both be empty"`
- **原因:** プロンプト形式の問題、または安全性フィルター

**試行2: シンプルな統合**
```typescript
if (detailedPrompt) {
    prompt += `\n- Custom requirements: ${detailedPrompt}`;
}
```
- **結果:** 同様のエラー
- **問題:** バックエンドでの処理が不安定

**最終解決策: フロントエンド統合アプローチ**
```typescript
// app/generate/page.tsx
const combinedFreeText = [
    formData.freeText,
    formData.detailedPrompt
].filter(Boolean).join('\n\n');

const requestData: any = { 
    ...formData,
    freeText: combinedFreeText || formData.freeText,
};
delete requestData.detailedPrompt;
```

**成功のポイント:**
- フロントエンドで `detailedPrompt` と `freeText` を結合
- 既存の `freeText` フィールドとしてAPIに送信
- バックエンドは変更不要（安定性確保）

#### Phase 4: メインカラー選択のUI/UX改善

**実装内容:**

1. **カラーピッカーの追加**
   - HTML5 `<input type="color">` による自由な色選択
   - 現在の色のスウォッチ表示
   - 16進数カラーコードの表示と手動入力

2. **プリセットカラーパレット**
   - **初期バージョン:** 中間色の12色パレット
   - **改善要望:** 「白や黒や赤、黄等の原色がいい」
   - **最終バージョン:** 原色ベースの12色パレット
     - 白 (#FFFFFF)、黒 (#000000)、赤 (#FF0000)、黄 (#FFFF00)
     - 青 (#0000FF)、緑 (#00FF00)、マゼンタ (#FF00FF)、シアン (#00FFFF)
     - オレンジ (#FFA500)、紫 (#800080)、グレー (#808080)、ピンク (#FFC0CB)

3. **インタラクション**
   - 選択中の色はリング表示でハイライト
   - ホバー時に拡大アニメーション (`hover:scale-110`)
   - 白色は特別な境界線処理

---

### 3. 画像解析機能の統合

#### 実装内容
- サンプル画像アップロード時に自動解析
- `gemini-1.5-flash` モデルを使用
- デザインパラメータの自動抽出

#### 抽出されるパラメータ
- `mainColor`: メインカラー
- `taste`: デザインスタイル
- `layout`: レイアウト構成
- `mainTitle`: 画像内のテキスト
- `purpose`: デザインの目的

#### API実装
```typescript
// app/api/analyze-image/route.ts
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});
```

---

### 4. セキュリティ対策

#### 環境変数の保護
- `.gitignore` に `.env*` を追加
- `.env.example` を作成（実際の値は含まない）
- APIキーなどの機密情報をGitにコミットしない

#### 使用している環境変数
```
GEMINI_API_KEY=your_gemini_api_key_here
```

**注意:** 当初、Google Cloud関連の環境変数も必要だと誤認していたが、実際には `GEMINI_API_KEY` のみを使用（Google AI Studio）。

---

## 遭遇した技術的課題と解決策

### 1. CSS Parsing Error

**問題:**
```
@import rules must precede all rules aside from @charset and @layer statements
```

**原因:**
- Google Fontsの `@import` がファイルの中央（59行目）に配置されていた
- CSSでは `@import` は `@charset` と `@layer` 以外のルールより前に配置する必要がある

**解決策:**
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');

@layer base {
  /* ... */
}
```

**実装:**
1. 59行目の `@import` を削除
2. ファイル先頭（2行目）に移動
3. コミット: `fix: Move @import to top of globals.css to fix CSS parsing error`

---

### 2. Detailed Prompt機能の実装エラー

**問題:**
```
Error: model output must contain either output text or tool calls, these cannot both be empty
```

**試行錯誤:**

1. **試行1:** APIプロンプトに直接追加
   - プロンプト構造を変更
   - 結果: エラー発生

2. **試行2:** シンプルな形式で追加
   - `Custom requirements:` として追加
   - 結果: 同じエラー

3. **試行3:** バックエンドでの統合
   - `freeText` と `detailedPrompt` をバックエンドで結合
   - 結果: エラー継続

**最終解決策:**
- **フロントエンドで統合**
- `app/generate/page.tsx` でフィールドを結合
- バックエンドは既存の `freeText` として処理
- APIプロンプト構造は変更なし

**成功の理由:**
- バックエンドロジックに変更を加えない
- 既存の動作している部分を保持
- リスクを最小化

---

### 3. ポートの競合

**問題:**
```
Port 3000 is in use
```

**原因:**
- 複数の `node` プロセスが起動していた
- 開発サーバーの再起動時に旧プロセスが残存

**解決策:**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
npm run dev
```

---

### 4. Gitの状態管理

#### Detached HEAD状態

**問題:**
```
HEAD detached at 2ce1412
```

**原因:**
- 特定のコミットに `git checkout` で移動
- ブランチではなくコミットIDを指定

**解決策:**
```bash
git checkout main
```

#### 変更の取り消し

**問題が発生した際の復元:**
```bash
git reset --hard HEAD    # 全ての変更を破棄
git checkout <commit>    # 特定のコミットに戻る
```

---

## GitHubとの連携

### 初期セットアップ

**SSH接続エラー:**
```
git@github.com: Permission denied (publickey)
```

**解決策:**
- SSHからHTTPSに切り替え
```bash
git remote remove origin
git remote add origin https://github.com/HIROSHI2285/posterAI_app.git
git push -u origin main
```

### コミット履歴

1. **初回コミット:**
   ```
   feat: Add PosterAI app with UI improvements - detailed prompt field, color palette, and form enhancements
   ```

2. **ドキュメント追加:**
   ```
   docs: Add README and .env.example with GEMINI_API_KEY setup instructions
   ```

3. **CSS修正:**
   ```
   fix: Move @import to top of globals.css to fix CSS parsing error
   ```

4. **詳細プロンプト実装:**
   ```
   feat: Implement detailed prompt feature by merging with freeText on frontend
   ```

---

## UIコンポーネントの構造

### PosterForm.tsx

**主要セクション:**

1. **デザイン設定カード**
   - デザイン用途（Select）
   - テイスト（Select）
   - レイアウト（Select）

2. **テキスト内容カード**
   - メインタイトル（Input, 50文字制限）
   - 追加テキスト（Textarea, 500文字制限）

3. **詳細指示（プロンプト）カード** ⭐ NEW
   - カスタム指示（Textarea, 10行）
   - メインカラー（カラーピッカー + パレット）

4. **出力サイズカード**
   - サイズプリセット（Select）
   - 向き（Portrait/Landscape）
   - カスタムサイズ（幅/高さ入力）

5. **ファイルアップロードカード**
   - サンプル画像（自動解析対応）

---

## 学んだベストプラクティス

### 1. 段階的な実装

- 複雑な機能は小さなステップに分割
- 各ステップで動作確認
- 問題が発生したら前の動作する状態に戻る

### 2. フロントエンドvsバックエンド

- バックエンドの変更はリスクが高い
- 可能な限りフロントエンドで処理
- APIの構造は安定させる

### 3. Git管理

- こまめにコミット
- 意味のあるコミットメッセージ
- 動作する状態を保存

### 4. デバッグ手法

- `console.log` でデータフローを確認
- エラーメッセージを詳細に読む
- 一度に1つの変更のみテスト

### 5. ユーザーフィードバック

- 実際の使用感を重視
- 「原色がいい」→ すぐに変更
- UIの直感性を優先

---

## 今後の拡張可能性

### 短期的な改善案

1. **プリセットスタイル**
   - よく使う設定を保存
   - ワンクリックで適用

2. **画像履歴**
   - 過去に生成した画像を保存
   - 再生成・編集機能

3. **エクスポート機能**
   - 複数の形式でダウンロード（PNG, PDF, SVG）
   - 高解像度出力オプション

### 長期的な機能追加

1. **テンプレートシステム**
   - 業種別テンプレート
   - カスタマイズ可能な要素

2. **コラボレーション機能**
   - チームでの共有
   - コメント・フィードバック

3. **AI学習**
   - ユーザーの好みを学習
   - パーソナライズされた提案

---

## まとめ

PosterAIは、AIを活用した直感的なポスター生成ツールとして、以下を達成しました：

✅ **安定した画像生成機能**  
✅ **柔軟なカスタマイズオプション**  
✅ **使いやすいUI/UX**  
✅ **セキュアな実装**  

技術的な課題を乗り越え、ユーザーフィードバックを反映した改善を重ねることで、実用的なアプリケーションを完成させることができました。

**開発者:** HIROSHI2285  
**完成日:** 2025年12月22日  
**リポジトリ:** https://github.com/HIROSHI2285/posterAI_app
