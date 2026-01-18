# マスク編集機能 フロントエンド実装ガイド

このドキュメントは、PosterPreview.tsxにマスク編集機能を追加するための詳細なステップバイステップガイドです。

---

## 前提条件

✅ **完成済み**:
- `/api/edit-region` APIエンドポイント
- 8領域対応
- 画像挿入統合

⏳ **実装が必要**:
- PosterPreview.tsx のフロントエンド部分

---

## 実装手順

### Step 1: Stateの追加

**場所**: PosterPreview.tsx の29-33行目付近（アップスケール状態の後）

**追加するコード**:
```typescript
// マスク編集用の状態
const [isMaskMode, setIsMaskMode] = useState(false)
const [maskEditPrompt, setMaskEditPrompt] = useState("")
const [brushSize, setBrushSize] = useState(20)
const [currentRegion, setCurrentRegion] = useState(1)
const [isDrawing, setIsDrawing] = useState(false)
const maskCanvasRef = useRef<HTMLCanvasElement>(null)
const regionColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080']
```

---

### Step 2: ハンドラー関数の追加

**場所**: handleCancelInsert関数の後、return文の前（208行目付近）

**追加するコード**:
```typescript
// マスク編集用のハンドラー
const handleMaskDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return

    const canvas = maskCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = regionColors[currentRegion - 1]
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
}

const handleClearMask = () => {
    if (!maskCanvasRef.current) return
    const ctx = maskCanvasRef.current.getContext('2d')!
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
}

const handleMaskEdit = async () => {
    if (!displayImageUrl || !maskEditPrompt.trim() || !maskCanvasRef.current) return

    setIsEditing(true)
    try {
        const maskImageData = maskCanvasRef.current.toDataURL('image/png')

        const response = await fetch('/api/edit-region', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageData: displayImageUrl,
                maskData: maskImageData,
                maskEditPrompt: maskEditPrompt.trim(),
                insertImagesData: insertImages.length > 0 ? insertImages.map(img => img.data) : undefined,
                insertImagesUsages: insertImages.length > 0 ? insertImages.map(img => img.usage) : undefined
            })
        })

        if (response.ok) {
            const data = await response.json()
            if (data.imageUrl) {
                setEditedImageUrl(data.imageUrl)
                setIsMaskMode(false)
                setMaskEditPrompt("")
                setInsertImages([])
                handleClearMask()
            } else {
                alert('マスク編集に失敗しました')
            }
        } else {
            const errorData = await response.json()
            alert(`マスク編集エラー: ${errorData.error || 'Unknown error'}`)
        }
    } catch (error) {
        console.error('Mask edit error:', error)
        alert('マスク編集中にエラーが発生しました')
    } finally {
        setIsEditing(false)
    }
}
```

---

### Step 3: UIの追加

**場所**: 挿入モードUIの後（420行目付近、編集モードボタンの前）

**追加するコード**:
```tsx
{/* マスク編集モード */}
{isMaskMode ? (
    <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        {/* ステップ1: 領域指定 */}
        <div className="border rounded p-3 bg-white">
            <h3 className="font-bold mb-2 text-sm">1. 編集箇所を指定</h3>
            
            {/* ブラシコントロール */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs">領域: {currentRegion}</span>
                    <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: regionColors[currentRegion - 1],
                        border: '2px solid black',
                        borderRadius: '4px'
                    }} />
                </div>
                <Button
                    onClick={() => setCurrentRegion(prev => Math.min(prev + 1, 8))}
                    size="sm"
                    variant="outline"
                >
                    次の領域 ({currentRegion}/8)
                </Button>
                <label className="text-xs">サイズ: {brushSize}px</label>
                <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24"
                />
                <Button onClick={handleClearMask} size="sm" variant="outline">
                    クリア
                </Button>
            </div>
            
            {/* Canvas */}
            <div style={{ position: 'relative' }} className="rounded overflow-hidden">
                {displayImageUrl && (
                    <>
                        <img 
                            src={displayImageUrl} 
                            alt="Preview" 
                            style={{ maxWidth: '100%', display: 'block' }}
                            onLoad={(e) => {
                                const img = e.target as HTMLImageElement
                                if (maskCanvasRef.current) {
                                    maskCanvasRef.current.width = img.width
                                    maskCanvasRef.current.height = img.height
                                }
                            }}
                        />
                        <canvas
                            ref={maskCanvasRef}
                            style={{ 
                                position: 'absolute', 
                                top: 0,
                                left: 0,
                                cursor: 'crosshair'
                            }}
                            onMouseDown={(e) => {
                                setIsDrawing(true)
                                handleMaskDraw(e)
                            }}
                            onMouseMove={handleMaskDraw}
                            onMouseUp={() => setIsDrawing(false)}
                            onMouseLeave={() => setIsDrawing(false)}
                        />
                    </>
                )}
            </div>
        </div>
        
        {/* ステップ2: 編集内容 */}
        <div className="border rounded p-3 bg-white">
            <h3 className="font-bold mb-2 text-sm">2. 編集内容を入力</h3>
            <Textarea
                value={maskEditPrompt}
                onChange={(e) => setMaskEditPrompt(e.target.value)}
                placeholder="例：
1: タイトルを『新年セール』に変更
2: 日付を『1/20』に変更
3: ロゴを削除"
                rows={5}
                className="text-sm"
            />
        </div>
        
        {/* ステップ3: 画像追加（任意）*/}
        {insertImages.length > 0 && (
            <div className="border rounded p-3 bg-blue-50">
                <h3 className="font-bold mb-2 text-sm">3. 挿入画像（{insertImages.length}枚）</h3>
                <div className="text-xs text-gray-600">
                    マスク編集と同時に画像を挿入します
                </div>
            </div>
        )}
        
        {/* 実行ボタン */}
        <div className="flex gap-2">
            <Button
                onClick={handleMaskEdit}
                disabled={!maskEditPrompt.trim() || isEditing}
                className="flex-1"
                style={{ backgroundColor: '#8b5cf6', color: 'white' }}
            >
                <Wand2 className="h-4 w-4 mr-2" />
                {isEditing ? '編集中...' : 'マスク編集を実行'}
            </Button>
            <Button
                onClick={() => {
                    setIsMaskMode(false)
                    setMaskEditPrompt("")
                    handleClearMask()
                }}
                variant="outline"
            >
                キャンセル
            </Button>
        </div>
    </div>
) : (
```

---

### Step 4: マスク編集ボタンの追加

**場所**: 編集モードボタンの横（427行目付近）

**既存のコードを見つける**:
```tsx
<Button
    onClick={() => setIsEditMode(true)}
    variant="outline"
    size="sm"
    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
>
    <Edit3 className="h-4 w-4 mr-2" />
    編集
</Button>
```

**その下に追加**:
```tsx
<Button
    onClick={() => setIsMaskMode(true)}
    variant="outline"
    size="sm"
    className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
>
    <ImageIcon className="h-4 w-4 mr-2" />
    マスク編集
</Button>
```

---

## 動作確認

### テスト手順

1. **アプリ起動**:
   ```
   npm run dev
   ```

2. **画像生成**:
   - ポスターを1枚生成

3. **マスク編集モード**:
   - 「マスク編集」ボタンをクリック
   - ブラシでタイトル部分をなぞる（赤色）
   - 「次の領域」をクリック
   - 日付部分をなぞる（青色）

4. **編集内容入力**:
   ```
   1: タイトルを「テスト」に変更
   2: 日付を削除
   ```

5. **実行**:
   - 「マスク編集を実行」をクリック
   - 編集された画像が表示されるはず

---

## トラブルシューティング

### Canvas が表示されない
- 画像のonLoadイベントでCanvas サイズを設定しているか確認
- maskCanvasRef.current が null でないか確認

### マスクが描画されない
- isDrawing が true になっているか確認
- handleMaskDraw が呼ばれているか console.log で確認

### API エラー
- `/api/edit-region` が存在するか確認
- リクエストボディが正しいか Network タブで確認

---

## 追加機能（オプション）

### タッチ対応（モバイル）

Canvas要素に追加:
```tsx
onTouchStart={(e) => {
    setIsDrawing(true)
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    })
    handleMaskDraw(mouseEvent as any)
}}
onTouchMove={(e) => {
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    })
    handleMaskDraw(mouseEvent as any)
}}
onTouchEnd={() => setIsDrawing(false)}
```

---

## 完了後

1. ビルド確認:
   ```
   npm run build
   ```

2. GitHubにプッシュ:
   ```
   git add -A
   git commit -m "feat: Add mask-based region editing UI"
   git push origin main
   ```

3. タスクリスト更新:
   - Phase 1-2 を完了にマーク

---

*Last Updated: 2026-01-18*
