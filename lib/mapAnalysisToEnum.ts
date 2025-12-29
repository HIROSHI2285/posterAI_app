import type { PosterPurpose, PosterTaste, PosterLayout } from '@/types/poster'

/**
 * フリーテキストから最適なenum値にマッピングする関数
 * 画像解析の結果をフォームの選択肢に変換
 */

/**
 * テキストから最適なPurposeを推測
 */
export function mapToPurpose(text: string): PosterPurpose {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('イベント') || lowerText.includes('event')) {
        return 'event-ad'
    }
    if (lowerText.includes('案内') || lowerText.includes('info') || lowerText.includes('情報')) {
        return 'info'
    }
    if (lowerText.includes('sns') || lowerText.includes('ソーシャル')) {
        return 'sns'
    }
    if (lowerText.includes('写真') || lowerText.includes('photo') || lowerText.includes('フォト')) {
        return 'photo-main'
    }
    if (lowerText.includes('イラスト') || lowerText.includes('illustration')) {
        return 'illustration-main'
    }
    if (lowerText.includes('タイポ') || lowerText.includes('文字') || lowerText.includes('typography')) {
        return 'typography-main'
    }
    if (lowerText.includes('コンセプト') || lowerText.includes('concept')) {
        return 'concept'
    }

    // デフォルトは広告
    return 'event-ad'
}

/**
 * テキストから最適なTasteを推測
 */
export function mapToTaste(text: string): PosterTaste {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('プロフェッショナル') || lowerText.includes('professional') || lowerText.includes('ビジネス')) {
        return 'professional'
    }
    if (lowerText.includes('モダン') || lowerText.includes('modern') || lowerText.includes('現代')) {
        return 'modern'
    }
    if (lowerText.includes('ポップ') || lowerText.includes('pop') || lowerText.includes('カラフル') || lowerText.includes('colorful')) {
        return 'pop'
    }
    if (lowerText.includes('エレガント') || lowerText.includes('elegant') || lowerText.includes('上品')) {
        return 'elegant'
    }
    if (lowerText.includes('クール') || lowerText.includes('cool')) {
        return 'cool'
    }
    if (lowerText.includes('スタイリッシュ') || lowerText.includes('stylish') || lowerText.includes('洗練')) {
        return 'stylish'
    }
    if (lowerText.includes('graffiti') || lowerText.includes('グラフィティ')) {
        return 'graffiti'
    }
    if (lowerText.includes('ストリート') || lowerText.includes('street')) {
        return 'street'
    }
    if (lowerText.includes('ナチュラル') || lowerText.includes('natural') || lowerText.includes('自然')) {
        return 'natural'
    }
    if (lowerText.includes('オーガニック') || lowerText.includes('organic')) {
        return 'organic'
    }
    if (lowerText.includes('和') || lowerText.includes('japanese') || lowerText.includes('日本')) {
        return 'japanese'
    }
    if (lowerText.includes('アジア') || lowerText.includes('asian')) {
        return 'asian'
    }
    if (lowerText.includes('レトロ') || lowerText.includes('retro') || lowerText.includes('ノスタルジック')) {
        return 'retro'
    }
    if (lowerText.includes('ビンテージ') || lowerText.includes('vintage')) {
        return 'vintage'
    }
    if (lowerText.includes('ミニマル') || lowerText.includes('minimal') || lowerText.includes('シンプル')) {
        return 'minimal'
    }

    // デフォルトはmodern
    return 'modern'
}

/**
 * テキストから最適なLayoutを推測
 */
export function mapToLayout(text: string): PosterLayout {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('中央') || lowerText.includes('center') || lowerText.includes('センター')) {
        return 'center'
    }
    if (lowerText.includes('左右') || lowerText.includes('水平') || lowerText.includes('horizontal')) {
        return 'split-horizontal'
    }
    if (lowerText.includes('上下') || lowerText.includes('垂直') || lowerText.includes('vertical') || lowerText.includes('二分割')) {
        return 'split-vertical'
    }
    if (lowerText.includes('斜め') || lowerText.includes('diagonal')) {
        return 'diagonal'
    }
    if (lowerText.includes('フレーム') || lowerText.includes('frame') || lowerText.includes('額')) {
        return 'frame'
    }

    // デフォルトはフリーフォーム
    return 'freeform'
}
