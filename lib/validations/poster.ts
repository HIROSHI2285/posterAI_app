import { z } from 'zod'

/**
 * Zodバリデーションスキーマ
 * ポスター生成のリクエストデータを検証
 */

// 用途
export const PosterPurposeSchema = z.enum([
    'event-ad',
    'info',
    'sns',
    'photo-main',
    'illustration-main',
    'typography-main',
    'concept'
])

// テイスト
export const PosterTasteSchema = z.enum([
    'professional',
    'modern',
    'pop',
    'elegant',
    'cool',
    'stylish',
    'colorful',
    'graffiti',
    'street',
    'natural',
    'organic',
    'japanese',
    'asian',
    'retro',
    'vintage',
    'minimal'
])

// レイアウト
export const PosterLayoutSchema = z.enum([
    'center',
    'split-horizontal',
    'split-vertical',
    'diagonal',
    'frame',
    'freeform'
])

// 向き
export const LayoutOrientationSchema = z.enum(['portrait', 'landscape'])

// 出力サイズ
export const OutputSizeSchema = z.enum(['b5', 'a4', 'b4', 'a3', 'custom'])

// カスタム単位
export const CustomSizeUnitSchema = z.enum(['px', 'mm'])

// HEXカラーバリデーション
const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: 'カラーは#RRGGBB形式で指定してください'
})

// Base64画像データバリデーション
const Base64ImageSchema = z.string().regex(/^data:image\/(jpeg|jpg|png);base64,/, {
    message: '画像はJPEGまたはPNG形式のBase64エンコードデータである必要があります'
})

/**
 * ポスター生成リクエストのバリデーションスキーマ
 */
export const PosterGenerationSchema = z.object({
    // 必須フィールド
    purpose: PosterPurposeSchema,
    outputSize: OutputSizeSchema,
    orientation: LayoutOrientationSchema,
    taste: PosterTasteSchema,
    layout: PosterLayoutSchema,
    mainColor: HexColorSchema,
    mainTitle: z.string()
        .min(1, 'メインタイトルは必須です')
        .max(50, 'メインタイトルは50文字以内にしてください'),

    // オプションフィールド
    subTitle: z.string().max(100, 'サブタイトルは100文字以内にしてください').optional(),
    freeText: z.string().max(500, '自由記入欄は500文字以内にしてください').optional(),
    detailedPrompt: z.string().max(3000, '詳細指示は3000文字以内にしてください').optional(),

    // 画像データ（Base64）
    sampleImageData: Base64ImageSchema.optional(),
    sampleImageName: z.string().optional(),
    materialsData: z.array(Base64ImageSchema).max(5, '素材画像は最大5枚までです').optional(),
    materialsNames: z.array(z.string()).optional(),

    // カスタムサイズ
    customWidth: z.number()
        .int('幅は整数で指定してください')
        .positive('幅は正の数である必要があります')
        .max(10000, '幅は10000以下にしてください')
        .optional(),
    customHeight: z.number()
        .int('高さは整数で指定してください')
        .positive('高さは正の数である必要があります')
        .max(10000, '高さは10000以下にしてください')
        .optional(),
    customUnit: CustomSizeUnitSchema.optional(),

    // 生成モード
    generationMode: z.enum(['text-only', 'image-reference']).optional(),

    // 画像参照の強度
    imageReferenceStrength: z.enum(['strong', 'normal', 'weak']).optional(),
}).refine(
    (data) => {
        // カスタムサイズの場合、幅と高さが必須
        if (data.outputSize === 'custom') {
            return data.customWidth !== undefined && data.customHeight !== undefined && data.customUnit !== undefined
        }
        return true
    },
    {
        message: 'カスタムサイズを選択した場合、幅・高さ・単位を指定してください',
        path: ['outputSize']
    }
).refine(
    (data) => {
        // 素材画像がある場合、名前の配列も必要
        if (data.materialsData && data.materialsData.length > 0) {
            return data.materialsNames && data.materialsNames.length === data.materialsData.length
        }
        return true
    },
    {
        message: '素材画像とファイル名の数が一致しません',
        path: ['materialsData']
    }
)

// 型推論
export type PosterGenerationInput = z.infer<typeof PosterGenerationSchema>

/**
 * バリデーションヘルパー関数
 */
export function validatePosterGeneration(data: unknown) {
    return PosterGenerationSchema.safeParse(data)
}
