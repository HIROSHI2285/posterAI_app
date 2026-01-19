# レイヤー化アーキテクチャ 詳細実装計画

## 🎯 目標

**「AIに描かせる」から「AIと共にデザインする」へのパラダイムシフト**

Gemini APIが出力する1枚のラスター画像を動的に分解し、Fabric.jsで自由に編集可能なレイヤー構造に再構築する。

---

## 📐 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        生成フェーズ                              │
├─────────────────────────────────────────────────────────────────┤
│  [プロンプト] → [Gemini 3.0 Pro] → [ラスター画像 (PNG)]          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        分解フェーズ                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐      │
│  │ Gemini Vision │   │    SAM 2      │   │   Inpaint     │      │
│  │ (メタデータ)  │   │ (セグメント)   │   │ (背景補完)    │      │
│  └───────────────┘   └───────────────┘   └───────────────┘      │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌───────────────────────────────────────────────────────┐      │
│  │              レイヤーデータ (JSON)                    │      │
│  │  - texts: [{content, bbox, style}]                    │      │
│  │  - objects: [{type, bbox, imagePNG}]                  │      │
│  │  - background: {imagePNG}                             │      │
│  └───────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        再構築フェーズ                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Fabric.js Canvas                      │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ 前面: fabric.IText (テキスト)                   │    │    │
│  │  ├─────────────────────────────────────────────────┤    │    │
│  │  │ 中間: fabric.Image (オブジェクト)              │    │    │
│  │  ├─────────────────────────────────────────────────┤    │    │
│  │  │ 背面: canvas.backgroundImage (背景)            │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        出力フェーズ                              │
├─────────────────────────────────────────────────────────────────┤
│  [PNG 出力] / [SVG 出力 (ベクター)] / [PDF 出力 (印刷用)]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Step A: メタデータの同時取得（Gemini Vision）

### 目的
生成した画像から「設計図」となるJSON形式のメタデータを抽出。

### Gemini Vision APIプロンプト

```typescript
const extractionPrompt = `
この画像を解析し、以下の情報をJSON形式で返してください。

{
  "texts": [
    {
      "content": "テキストの内容",
      "bbox": {
        "x": 0-1000の相対座標,
        "y": 0-1000の相対座標,
        "width": 0-1000の相対幅,
        "height": 0-1000の相対高さ
      },
      "style": {
        "fontFamily": "serif" | "sans-serif" | "display",
        "fontWeight": "bold" | "normal",
        "fontSize": "small" | "medium" | "large" | "xlarge",
        "color": "#HEX値",
        "textAlign": "left" | "center" | "right"
      }
    }
  ],
  "objects": [
    {
      "type": "person" | "animal" | "logo" | "product" | "shape",
      "description": "オブジェクトの説明",
      "bbox": {
        "x": 0-1000の相対座標,
        "y": 0-1000の相対座標,
        "width": 0-1000の相対幅,
        "height": 0-1000の相対高さ
      }
    }
  ],
  "background": {
    "type": "solid" | "gradient" | "image" | "pattern",
    "dominantColor": "#HEX値",
    "description": "背景の説明"
  }
}

注意:
- 座標は0-1000の相対値で返してください
- すべてのテキストを検出してください
- メインの被写体を必ず検出してください
`;
```

### APIエンドポイント

**ファイル**: `app/api/analyze-layers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface LayerMetadata {
  texts: Array<{
    content: string
    bbox: { x: number, y: number, width: number, height: number }
    style: {
      fontFamily: 'serif' | 'sans-serif' | 'display'
      fontWeight: 'bold' | 'normal'
      fontSize: 'small' | 'medium' | 'large' | 'xlarge'
      color: string
      textAlign: 'left' | 'center' | 'right'
    }
  }>
  objects: Array<{
    type: string
    description: string
    bbox: { x: number, y: number, width: number, height: number }
  }>
  background: {
    type: 'solid' | 'gradient' | 'image' | 'pattern'
    dominantColor: string
    description: string
  }
}

export async function POST(request: NextRequest) {
  const { imageData } = await request.json()
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  
  const result = await model.generateContent([
    { text: extractionPrompt },
    { inlineData: { mimeType: 'image/png', data: imageData.split(',')[1] } }
  ])
  
  const metadata: LayerMetadata = JSON.parse(result.response.text())
  
  return NextResponse.json({ metadata })
}
```

---

## 🔧 Step B: 背景の「穴埋め」と素材抽出

### B-1: オブジェクトのセグメンテーション（SAM 2）

**選択肢**:

| 方法 | メリット | デメリット |
|------|---------|-----------|
| **Meta SAM 2 API** | 高精度、最新 | 外部依存、コスト |
| **Replicate SAM 2** | 簡単API | 従量課金 |
| **remove.bg API** | 使いやすい | 背景のみ特化 |
| **セルフホスト** | 無料、制御可能 | GPU必要、複雑 |

**推奨**: 最初は **Replicate SAM 2** または **remove.bg** でMVP、後でセルフホスト検討。

**APIエンドポイント**: `app/api/segment-object/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { imageData, bbox } = await request.json()
  
  // Replicate SAM 2 API呼び出し
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'sam-2-version-id',
      input: {
        image: imageData,
        point_coords: [[bbox.x + bbox.width/2, bbox.y + bbox.height/2]],
        point_labels: [1]
      }
    })
  })
  
  const result = await response.json()
  return NextResponse.json({ segmentedImage: result.output })
}
```

### B-2: 背景のインペインティング

検出されたオブジェクトを削除し、Gemini/Imagen Inpaintで穴埋め。

```typescript
export async function POST(request: NextRequest) {
  const { imageData, objectMasks } = await request.json()
  
  // マスク画像を作成（オブジェクト部分を白で塗りつぶし）
  const maskImage = createMaskFromBboxes(objectMasks)
  
  // Gemini Inpaintで背景を補完
  const response = await fetch('/api/edit-region', {
    method: 'POST',
    body: JSON.stringify({
      imageData,
      maskData: maskImage,
      maskEditPrompt: '削除された領域を周囲の背景と自然に馴染むように補完してください'
    })
  })
  
  return NextResponse.json({ backgroundImage: await response.json() })
}
```

---

## 🔧 Step C: Fabric.js による再構築

### 座標変換ロジック

```typescript
// AI座標（0-1000）→ キャンバス座標への変換
function convertCoordinates(
  aiBbox: { x: number, y: number, width: number, height: number },
  canvasWidth: number,
  canvasHeight: number
) {
  return {
    x: (aiBbox.x / 1000) * canvasWidth,
    y: (aiBbox.y / 1000) * canvasHeight,
    width: (aiBbox.width / 1000) * canvasWidth,
    height: (aiBbox.height / 1000) * canvasHeight,
  }
}
```

### Fabric.js キャンバス構築

```typescript
import { fabric } from 'fabric'

interface LayerData {
  metadata: LayerMetadata
  backgroundImage: string
  objectImages: { [id: string]: string }
}

function buildFabricCanvas(
  canvasElement: HTMLCanvasElement,
  layerData: LayerData
) {
  const canvas = new fabric.Canvas(canvasElement)
  const { width, height } = canvas
  
  // 1. 背景レイヤー設定
  fabric.Image.fromURL(layerData.backgroundImage, (img) => {
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
      scaleX: width / img.width!,
      scaleY: height / img.height!
    })
  })
  
  // 2. オブジェクトレイヤー追加
  layerData.metadata.objects.forEach((obj, index) => {
    const coords = convertCoordinates(obj.bbox, width, height)
    const imageData = layerData.objectImages[`object_${index}`]
    
    fabric.Image.fromURL(imageData, (img) => {
      img.set({
        left: coords.x,
        top: coords.y,
        scaleX: coords.width / img.width!,
        scaleY: coords.height / img.height!,
        selectable: true,
        hasControls: true
      })
      canvas.add(img)
    })
  })
  
  // 3. テキストレイヤー追加
  layerData.metadata.texts.forEach((text) => {
    const coords = convertCoordinates(text.bbox, width, height)
    
    const fabricText = new fabric.IText(text.content, {
      left: coords.x,
      top: coords.y,
      fontSize: getFontSize(text.style.fontSize, height),
      fontFamily: getFontFamily(text.style.fontFamily),
      fontWeight: text.style.fontWeight,
      fill: text.style.color,
      textAlign: text.style.textAlign,
      selectable: true,
      editable: true
    })
    canvas.add(fabricText)
  })
  
  return canvas
}

// フォントサイズ変換
function getFontSize(size: string, canvasHeight: number): number {
  const ratios = { small: 0.03, medium: 0.05, large: 0.08, xlarge: 0.12 }
  return canvasHeight * (ratios[size] || 0.05)
}

// フォントファミリー変換
function getFontFamily(family: string): string {
  const fonts = {
    serif: 'Noto Serif JP',
    'sans-serif': 'Noto Sans JP',
    display: 'M PLUS Rounded 1c'
  }
  return fonts[family] || 'Noto Sans JP'
}
```

---

## 🎨 編集機能

### レイヤー別の編集可能性

| レイヤー | Fabric.js オブジェクト | 編集操作 |
|---------|----------------------|---------|
| **テキスト** | `fabric.IText` | 文字編集、フォント変更、色変更、サイズ変更 |
| **オブジェクト** | `fabric.Image` | 移動、拡大・縮小、回転、削除 |
| **背景** | `backgroundImage` | フィルター適用、AI再生成、差し替え |

### エクスポート機能

```typescript
// PNG出力
function exportPNG(canvas: fabric.Canvas): string {
  return canvas.toDataURL({ format: 'png', quality: 1 })
}

// SVG出力（ベクター）
function exportSVG(canvas: fabric.Canvas): string {
  return canvas.toSVG()
}

// PDF出力（jsPDF使用）
async function exportPDF(canvas: fabric.Canvas): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const imgData = canvas.toDataURL({ format: 'png', quality: 1 })
  pdf.addImage(imgData, 'PNG', 0, 0)
  return pdf.output('blob')
}
```

---

## 📋 実装フェーズ

### Phase 1: OCR情報のマッピング ✅ 完了

- [x] Gemini Vision APIでテキスト座標抽出 (`/api/extract-text-layers`)
- [x] プロンプトチューニング（精度向上）
- [x] Canvas `IText` オーバーレイ表示 (`TextEditCanvas.tsx`)
- [x] テキスト編集機能の動作確認

### Phase 2: オブジェクト分離（2週間）

- [ ] SAM 2 / remove.bg API統合
- [ ] バウンディングボックスからセグメンテーション
- [ ] 透過PNG抽出・保持
- [ ] Fabric.js `Image` オブジェクト追加

### Phase 3: 背景補完（1週間）

- [ ] マスク画像生成ロジック
- [ ] Inpaint API呼び出し
- [ ] きれいな背景レイヤー作成

### Phase 4: 統合UI（2週間）

- [ ] レイヤーパネルUI
- [ ] ドラッグ＆ドロップ操作
- [ ] エクスポート機能（PNG/SVG）

---

## 🚀 期待される効果

| 従来 | レイヤー化後 |
|------|-------------|
| 「文字が惜しい」→ AI再生成（ガチャ） | その場でタイピングして直すだけ |
| 「配置が惜しい」→ AI再生成（ガチャ） | マウスで数ピクセルずらすだけ |
| 「背景だけ変えたい」→ 全体再生成 | 背景レイヤーだけを新プロンプトで差し替え |

**完成度**: 85-90% → **95-100%完成ツール**

---

## 📚 参考資料

- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [SAM 2 (Segment Anything Model 2)](https://segment-anything.com/)
- [Replicate API](https://replicate.com/)
- [remove.bg API](https://www.remove.bg/api)
- [Google Fonts - 日本語フォント](https://fonts.google.com/?subset=japanese)

---

## 📝 次のアクション

**推奨される最初の一歩**:

> **「Gemini Vision APIを使って、生成した画像からテキストの座標（Bounding Box）と内容を正確に抽出するプロンプトの調整」**から着手。

これが安定すれば、Fabric.jsへの流し込みは一気に加速します。

---

*Created: 2026-01-19*
*Updated: 2026-01-19*
*Status: Phase 1完了、Phase 2以降は必要に応じて実装*
