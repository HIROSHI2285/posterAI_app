# モデル監視・移行計画

**作成日**: 2025-12-29  
**目的**: 安定版リリース時の円滑な移行

---

## 📋 現在の構成

### 使用中のモデル

| 用途 | 現在のモデル | 状態 | 理由 |
|------|------------|------|------|
| **画像解析** | gemini-3-pro-image-preview | ⚠️ Preview版 | 高精度、ポスター生成と統一 |
| **ポスター生成** | gemini-3-pro-image-preview | ⚠️ Preview版 | 最高品質 |

**統一のメリット**:
- ✅ 同じモデルファミリーで一貫性
- ✅ GA版リリース時に一括移行可能
- ✅ コスト最適化

---

## 🔍 監視対象

### 1. Gemini 3 Pro Image の GA版リリース

**監視方法**:
- Google AI ブログをチェック
- Vertex AI リリースノートを確認
- Google Cloud コンソールで利用可能なモデル一覧を確認

**確認URL**:
- https://ai.google.dev/gemini-api/docs/models/gemini
- https://cloud.google.com/vertex-ai/generative-ai/docs/release-notes
- https://blog.google/technology/ai/

**チェック頻度**: 月1回

---

## 🚀 移行トリガー

以下のいずれかが発生したら移行を検討：

### 優先度：高 ⭐⭐⭐
1. **GA版リリース**: `gemini-3-pro-image` (GA) がリリース
2. **廃止通知**: `gemini-3-pro-image-preview` の廃止アナウンス

### 優先度：中 ⭐⭐
3. **品質向上**: GA版の品質がPreview版を上回る
4. **新機能**: GA版に有用な新機能追加

### 優先度：低 ⭐
5. **コスト変更**: Preview版の料金が大幅に上がる

---

## 📝 移行手順（準備済み）

### Step 1: モデル名の変更（5分）

#### ファイル1: `app/api/generate-poster/async.ts`
```typescript
// Before
model: "gemini-3-pro-image-preview"

// After
model: "gemini-3-pro-image"  // またはリリースされた正式名
```

#### ファイル2: `app/api/generate-poster/route.ts`
```typescript
// Before
model: "gemini-3-pro-image-preview"

// After
model: "gemini-3-pro-image"  // またはリリースされた正式名
```

### Step 2: テスト（10分）
```bash
npm run dev
```

ブラウザで以下を確認:
- [ ] ログイン可能
- [ ] ポスター生成が正常に動作
- [ ] 画像品質が維持または向上
- [ ] エラーがない

### Step 3: ドキュメント更新（5分）
- [ ] `README.md` のモデル名更新
- [ ] `docs/MODELS_AND_PRICING.md` 更新
- [ ] `CHANGELOG.md` に記録

### Step 4: デプロイ（10分）
```bash
npm run build
# デプロイ実行
```

**合計所要時間**: 約30分

---

## 📊 移行判断基準

### GA版に移行すべきケース

| 条件 | 判断 |
|------|------|
| GA版がリリースされた | ✅ 移行 |
| 品質が同等以上 | ✅ 移行 |
| 料金が同じかそれ以下 | ✅ 移行 |
| Preview版廃止通知 | ✅ 即座に移行 |

### Preview版を維持すべきケース

| 条件 | 判断 |
|------|------|
| GA版の品質が劣る | ❌ 移行しない |
| GA版の料金が大幅に高い | ❌ 移行しない |
| GA版に機能制限がある | ❌ 移行しない |

---

## 🔔 アラート設定

### 監視項目

1. **Google AI ブログ**
   - RSS: https://blog.google/technology/ai/rss/
   - 新しいモデルリリースを監視

2. **Vertex AI リリースノート**
   - URL: https://cloud.google.com/vertex-ai/generative-ai/docs/release-notes
   - 月1回確認

3. **API エラーログ**
   - Preview版の廃止警告メッセージを監視
   - `deprecated` や `sunset` などのキーワード

---

## 📅 定期チェックスケジュール

### 月次チェック（毎月1日）

**チェック内容**:
- [ ] Google AI ブログで新モデル発表を確認
- [ ] Vertex AI リリースノートを確認
- [ ] API エラーログに警告がないか確認

**記録場所**: このファイルの最下部に追記

---

## 🎯 代替移行先

GA版がリリースされない場合の代替案：

### オプション1: Gemini 3 Flash Image (GA)
- コスト重視
- 速度重視
- 品質は若干劣る可能性

### オプション2: Imagen 4.0 (Vertex AI)
- 最高品質
- コスト高（$0.04/回）
- Vertex AI SDKへの移行が必要

### オプション3: Gemini 2.0 Flash
- 安定版
- コスト安
- 品質は劣る

---

## 📝 移行履歴ログ

### 2025-12-29
- **状態**: `gemini-3-pro-image-preview` を使用開始
- **理由**: 最高品質のポスター生成のため
- **次回確認**: 2026-01-29

### （今後の移行はここに記録）

---

## 🚨 緊急時の対応

### Preview版が突然利用不可になった場合

**即座に実施**:
1. `gemini-3-pro` に切り替え（5分）
2. 動作確認（10分）
3. ユーザーに品質低下の可能性を通知

**その後の対応**:
- GA版の確認
- Imagen 4.0への移行を検討
- 恒久的な解決策を実装

---

## 💡 Tips

### モデル名の確認方法

```bash
# Google AI SDK で利用可能なモデルを確認
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: YOUR_API_KEY"
```

### 最新情報の取得

```bash
# Google Cloud CLI でモデル一覧
gcloud ai models list --region=us-central1
```

---

## ✅ チェックリスト（移行時）

### 移行前確認
- [ ] GA版がリリースされたことを確認
- [ ] 料金を確認（Preview版と同等以下）
- [ ] ドキュメントで機能差分を確認
- [ ] バックアップ取得

### 移行実施
- [ ] コード変更（2ファイル）
- [ ] ローカルでテスト
- [ ] ステージング環境でテスト
- [ ] 本番デプロイ

### 移行後確認
- [ ] エラーログ確認
- [ ] 生成品質確認
- [ ] パフォーマンス確認
- [ ] ドキュメント更新

---

**最終更新**: 2025-12-29  
**次回確認予定**: 2026-01-29
