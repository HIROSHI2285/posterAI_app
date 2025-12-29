# セキュリティガイドライン

**最終更新**: 2025-12-29

---

## 🔒 機密情報の管理

### 絶対にGitにコミットしてはいけないもの

1. **APIキー**
   - `GEMINI_API_KEY`
   - その他のAPI認証情報

2. **Google Cloudの認証情報**
   - `vertex-key.json`
   - サービスアカウントキー（JSON）
   - `google-credentials.json`

3. **環境変数ファイル**
   - `.env`
   - `.env.local`
   - `.env.production`

4. **Personal Access Token**
   - GitHub PAT
   - その他のトークン

---

## ✅ 安全な管理方法

### 1. .env ファイルの使用

**正しい使い方**:
```bash
# .envファイルに記載（gitignore対象）
GEMINI_API_KEY=your_actual_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

**確認**:
```bash
# .envがgitignoreされているか確認
git check-ignore .env
# → .env と表示されればOK
```

---

### 2. .env.example の活用

**テンプレート用ファイル**（Gitにコミット可能）:
```bash
# .env.example
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
```

**セットアップ時**:
```bash
# 新しい環境で
cp .env.example .env
# その後、.envに実際の値を記入
```

---

## 🛡️ Pre-Commitフックの設定

### 自動チェックの有効化

Pre-commitフックが`.git/hooks/pre-commit`に設置されています。

**機能**:
- APIキーパターンを検出（AIza...）
- GitHub PATを検出（ghp_...）
- Private keyを検出
- .envファイルのコミットを防止
- vertex-key.jsonのコミットを防止

**テスト**:
```bash
# テストファイルを作成
echo "GEMINI_API_KEY=AIzaSyTESTKEY123" > test.txt
git add test.txt
git commit -m "test"
# → ❌ ERROR: Google API Key detected!
```

---

## 🚨 誤ってコミットしてしまった場合

### 即座に対応

1. **コミット直後（pushする前）**
   ```bash
   # 最新のコミットを取り消し
   git reset HEAD~1
   # ファイルから機密情報を削除
   # 再度add & commit
   ```

2. **pushした後**
   ```bash
   # 機密情報を無効化
   # - Google AI Studio で新しいAPIキーを生成
   # - 古いキーを削除
   
   # Git履歴をクリーンアップ
   git checkout --orphan clean-branch
   git add -A
   git commit -m "Clean history"
   git branch -D main
   git branch -m main
   git push -f origin main
   ```

3. **GitHub Push Protectionでブロックされた場合**
   - ✅ これは正常な動作
   - 機密情報を削除してから再度push

---

## 📋 コミット前チェックリスト

コミット前に必ず確認：

- [ ] `git diff` で変更内容を確認
- [ ] APIキーが含まれていないか確認
- [ ] .envファイルが含まれていないか確認
- [ ] vertex-key.jsonが含まれていないか確認
- [ ] ドキュメントに実際のAPIキーを記載していないか確認

---

## 🔍 検出パターン

Pre-commitフックが検出するパターン：

| 種類 | パターン | 例 |
|------|---------|-----|
| Google API Key | `AIza[0-9A-Za-z_-]{35}` | AIzaSyCvP7... |
| GitHub PAT | `ghp_[0-9a-zA-Z]{36}` | ghp_dSI04lF... |
| Private Key | `BEGIN PRIVATE KEY` | -----BEGIN... |
| .env file | `.env$` | .env |
| Service Account | `vertex-key.json` | vertex-key.json |

---

## 🎯 ベストプラクティス

### 1. 環境変数の階層

```
.env.example      ← Git管理 (テンプレート)
.env              ← Git除外 (実際の値)
.env.local        ← Git除外 (ローカル開発)
.env.production   ← Git除外 (本番環境)
```

### 2. ドキュメントでの記載

**❌ 悪い例**:
```markdown
APIキー: AIzaSyCvP7duJADVM-gEwZBAEpTL6pjfAPnCsWw
```

**✅ 良い例**:
```markdown
APIキー: `your_gemini_api_key_here`
または
APIキー: AIzaSyXXXXXXXXXXXXXXXXXX (マスク済み)
```

### 3. コードレビュー

プルリクエスト時：
- 機密情報が含まれていないか確認
- .gitignoreが適切か確認
- 環境変数が正しく使用されているか確認

---

## 📚 参考資料

### 公式ドキュメント

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [.gitignore patterns](https://git-scm.com/docs/gitignore)

### 関連ツール

- **git-secrets**: AWSなどの機密情報を検出
- **pre-commit**: 多様なpre-commitフックのフレームワーク
- **TruffleHog**: Git履歴から機密情報を検出

---

## ✅ セキュリティチェックリスト（月次）

定期的に確認：

- [ ] .gitignoreが最新か
- [ ] Pre-commitフックが動作しているか
- [ ] 不要なAPIキーを削除したか
- [ ] アクセストークンをローテーションしたか
- [ ] チームメンバーがガイドラインを理解しているか

---

**重要**: セキュリティは一度設定したら終わりではありません。継続的な注意が必要です。
