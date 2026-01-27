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
    materialsUsages?: string[]
    customWidth?: number
    customHeight?: number
    customUnit?: CustomSizeUnit
    characterDescription?: string
    detailedPrompt?: string
    generationMode?: 'text-only' | 'image-reference'
    imageReferenceStrength?: 'strong' | 'normal' | 'weak'
    modelMode?: 'production' | 'development'  // AIモデル選択
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
export const TASTES: { value: PosterTaste; label: string; description: string; recommendedUses: string }[] = [
    { value: 'professional', label: 'プロフェッショナル', description: '信頼感のある配色とレイアウトで、堅実な印象を与えるデザイン', recommendedUses: 'ビジネスセミナー、会社説明会、学会発表、公式告知' },
    { value: 'modern', label: 'モダン', description: '無駄を削ぎ落とした現代的なスタイル。シンプルで洗練された印象', recommendedUses: '建築展、現代アート展、ITカンファレンス、新商品発表' },
    { value: 'pop', label: 'ポップ', description: '明るい色彩と元気な印象を与える親しみやすいデザイン', recommendedUses: '子供向けイベント、夏祭り、ワークショップ、セール広告' },
    { value: 'elegant', label: 'エレガント', description: '高級感のあるフォントや余白づかいで、上質な雰囲気を演出', recommendedUses: 'クラシックコンサート、美容サロン、ジュエリー展、ディナーショー' },
    { value: 'cool', label: 'クール', description: '寒色系やシャープな形状を用いた、知的でかっこいいイメージ', recommendedUses: 'テックイベント、eスポーツ大会、クラブイベント、深夜営業の告知' },
    { value: 'stylish', label: 'スタイリッシュ', description: 'トレンドを意識した配色やレイアウトで、センスの良さをアピール', recommendedUses: 'ファッションショー、美容室、カフェのメニュー、個展' },
    { value: 'colorful', label: 'カラフル', description: '多色使いで賑やかな印象。見る人の気分を高揚させるデザイン', recommendedUses: 'フードフェス、学園祭、パレード、地域のお祭り' },
    { value: 'graffiti', label: 'グラフィティ', description: 'ストリートアート風の大胆なスタイル。インパクト重視', recommendedUses: 'ダンスイベント、スケートボード大会、ライブハウス、ストリートファッション' },
    { value: 'street', label: 'ストリート', description: '都会的でラフな雰囲気。力強さとカルチャーを感じさせる', recommendedUses: 'ヒップホップイベント、各種パフォーマンス、スポーツ大会' },
    { value: 'natural', label: 'ナチュラル', description: '自然素材やアースカラーを彷彿とさせる、安らぎのあるデザイン', recommendedUses: 'オーガニックマルシェ、ヨガ教室、環境イベント、公園フェス' },
    { value: 'organic', label: 'オーガニック', description: '手書き風や柔らかい質感で、温かみのある優しい雰囲気', recommendedUses: 'カフェ、手作り市、パン屋、福祉イベント' },
    { value: 'japanese', label: '和風', description: '日本の伝統的な美意識を取り入れた、落ち着きのあるデザイン', recommendedUses: '初詣、お花見、和菓子店、旅館の案内、伝統工芸展' },
    { value: 'asian', label: 'アジアン', description: 'オリエンタルな装飾や色使いで、エキゾチックな雰囲気を演出', recommendedUses: 'エスニック料理店、旅行博、アジアン雑貨フェア' },
    { value: 'retro', label: 'レトロ', description: '懐かしさを感じる色合いやフォントで、ノスタルジックな世界観', recommendedUses: '昭和レトロ展、純喫茶、古着屋、地域復興イベント' },
    { value: 'vintage', label: 'ヴィンテージ', description: '色あせた質感や歴史を感じさせる、重厚感のあるデザイン', recommendedUses: 'アンティークフェア、バー、ジャズライブ、ウイスキー試飲会' },
    { value: 'minimal', label: 'ミニマル', description: '要素を極限まで減らし、メッセージをストレートに伝える', recommendedUses: '写真展、美術館、高級ブランド広告、ティーザー広告' },
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
