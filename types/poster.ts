// ポスターの用途
export type PosterPurpose = 'event-ad' | 'info' | 'sns' | 'photo-main' | 'illustration-main' | 'typography-main' | 'concept'

// ポスターのテイスト
export type PosterTaste =
    | 'professional'
    | 'modern'
    | 'pop'
    | 'elegant'
    | 'cool'
    | 'stylish'
    | 'colorful'
    | 'graffiti'
    | 'street'
    | 'natural'
    | 'organic'
    | 'japanese'
    | 'asian'
    | 'retro'
    | 'vintage'
    | 'minimal'

// レイアウトタイプ
export type PosterLayout = 'center' | 'split-horizontal' | 'split-vertical' | 'diagonal' | 'frame' | 'freeform'

// レイアウトの向き
export type LayoutOrientation = 'portrait' | 'landscape'

// 出力サイズ
export type OutputSize = 'b5' | 'a4' | 'b4' | 'a3' | 'custom'

// カスタムサイズの単位
export type CustomSizeUnit = 'px' | 'mm'

// ポスターフォームデータ
export interface PosterFormData {
    purpose: PosterPurpose
    outputSize: OutputSize
    orientation: LayoutOrientation
    taste: PosterTaste
    layout: PosterLayout
    mainColor: string
    mainTitle: string
    subTitle?: string
    freeText?: string
    sampleImage?: File | null
    sampleImageData?: string
    sampleImageName?: string
    materials?: File[]
    materialsData?: string[]
    materialsNames?: string[]
    customWidth?: number
    customHeight?: number
    customUnit?: CustomSizeUnit
    characterDescription?: string
    detailedPrompt?: string
    generationMode?: 'text-only' | 'image-reference'
    imageReferenceStrength?: 'strong' | 'normal' | 'weak'
}

// 出力サイズの定義（向き対応）- 175dpi設定
export const OUTPUT_SIZES = {
    b5: {
        portrait: { width: 1255, height: 1771 },
        landscape: { width: 1771, height: 1255 },
        label: 'B5サイズ',
        description: '182×257mm'
    },
    a4: {
        portrait: { width: 1448, height: 2047 },
        landscape: { width: 2047, height: 1448 },
        label: 'A4サイズ',
        description: '210×297mm'
    },
    b4: {
        portrait: { width: 1771, height: 2508 },
        landscape: { width: 2508, height: 1771 },
        label: 'B4サイズ',
        description: '257×364mm'
    },
    a3: {
        portrait: { width: 2047, height: 2894 },
        landscape: { width: 2894, height: 2047 },
        label: 'A3サイズ',
        description: '297×420mm'
    },
    custom: {
        portrait: { width: 1920, height: 1080 },
        landscape: { width: 1920, height: 1080 },
        label: 'カスタムサイズ',
        description: 'ピクセル指定可'
    },
} as const

// デザイン用途の定義
export const PURPOSES: { value: PosterPurpose; label: string; description: string }[] = [
    { value: 'event-ad', label: 'イベント・広告', description: 'イベント告知や広告用' },
    { value: 'info', label: '情報案内', description: '情報掲示や案内用' },
    { value: 'sns', label: 'SNS投稿', description: 'SNS投稿用' },
    { value: 'photo-main', label: '写真メイン', description: '写真を主役に' },
    { value: 'illustration-main', label: 'イラストメイン', description: 'イラストを主役に' },
    { value: 'typography-main', label: 'タイポグラフィメイン', description: '文字を主役に' },
    { value: 'concept', label: 'コンセプト型', description: 'コンセプト重視' },
]

// テイストの定義
export const TASTES: { value: PosterTaste; label: string }[] = [
    { value: 'professional', label: 'プロフェッショナル' },
    { value: 'modern', label: 'モダン' },
    { value: 'pop', label: 'ポップ' },
    { value: 'elegant', label: 'エレガント' },
    { value: 'cool', label: 'クール' },
    { value: 'stylish', label: 'スタイリッシュ' },
    { value: 'colorful', label: 'カラフル' },
    { value: 'graffiti', label: 'グラフィティ' },
    { value: 'street', label: 'ストリート' },
    { value: 'natural', label: 'ナチュラル' },
    { value: 'organic', label: 'オーガニック' },
    { value: 'japanese', label: '和風' },
    { value: 'asian', label: 'アジアン' },
    { value: 'retro', label: 'レトロ' },
    { value: 'vintage', label: 'ヴィンテージ' },
    { value: 'minimal', label: 'ミニマル' },
]

// レイアウトの定義
export const LAYOUTS: { value: PosterLayout; label: string; description: string }[] = [
    { value: 'center', label: '中央集中型', description: 'タイトルとイメージを中央に配置' },
    { value: 'split-horizontal', label: '左右分割型', description: 'テキストと画像を左右に配置' },
    { value: 'split-vertical', label: '上下分割型', description: '上部にタイトル、下部に詳細' },
    { value: 'diagonal', label: '対角線型', description: 'ダイナミックな斜め配置' },
    { value: 'frame', label: 'フレーム型', description: '中央にフレームを配置' },
    { value: 'freeform', label: 'フリーフォーム型', description: '自由な配置' },
]
