'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, CheckCircle, Download, Edit3, Image, Upload, Wand2 } from 'lucide-react'

export default function HowToUsePage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* ヘッダー */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        <img src="/logo.png" alt="PosterAI" className="h-8" />
                        <span className="text-xl font-bold text-green-600">PosterAI</span>
                    </div>
                    <Button
                        onClick={() => router.push('/generate')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        今すぐ始める <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* ヒーローセクション */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                ✨ 煩雑なプロンプト設計も画像から自動抽出
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                サンプル画像から<br />
                                <span className="text-green-600">プロ品質のポスター</span>を<br />
                                自動生成
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                参考にしたいデザインをアップロードするだけで、AIが自動解析。
                                複雑なプロンプト設計なしで、理想のポスターが完成します。
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => router.push('/generate')}
                                    className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6"
                                >
                                    <Sparkles className="mr-2" />
                                    無料で始める
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="/samples/guide_hero.png"
                                alt="PosterAI ヒーローイメージ"
                                className="w-full rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 3ステップセクション */}
            <section className="py-20 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            たった<span className="text-green-600">3ステップ</span>でポスター完成
                        </h2>
                        <p className="text-xl text-gray-600">
                            複雑な操作は一切不要。誰でも簡単にプロ品質のポスターを作成できます
                        </p>
                    </div>

                    <div className="space-y-24">
                        {/* STEP 1 */}
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-2xl font-bold mb-6">
                                    1
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    サンプル画像をアップロード
                                </h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    参考にしたいデザインやレイアウトの画像をドラッグ＆ドロップ。
                                    既存のポスター、チラシ、Webデザインなど、どんな画像でもOKです。
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        PNG, JPG形式に対応
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        AIが自動で解析開始
                                    </li>
                                </ul>
                            </div>
                            <div className="order-1 lg:order-2">
                                <img
                                    src="/samples/guide_step1.png"
                                    alt="STEP 1: サンプル画像をアップロード"
                                    className="w-full max-w-md mx-auto"
                                />
                            </div>
                        </div>

                        {/* STEP 2 */}
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <img
                                    src="/samples/guide_step2.png"
                                    alt="STEP 2: AIが自動解析"
                                    className="w-full max-w-md mx-auto"
                                />
                            </div>
                            <div>
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mb-6">
                                    2
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    AIが自動でプロンプト生成
                                </h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    アップロードされた画像をAIが詳細に分析。
                                    色彩、レイアウト、フォント、デザインスタイルを自動で抽出し、
                                    最適なプロンプトを生成します。
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-purple-500" />
                                        色彩パレットの自動抽出
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-purple-500" />
                                        レイアウト構造の分析
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-purple-500" />
                                        デザインスタイルの判定
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* STEP 3 */}
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 text-2xl font-bold mb-6">
                                    3
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    ボタン一つでポスター完成！
                                </h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    「ポスター生成」ボタンをクリックするだけで、
                                    AIがあなた専用のオリジナルポスターを生成。
                                    約30秒で高品質なデザインが完成します。
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-orange-500" />
                                        約30秒で生成完了
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-orange-500" />
                                        A4/A3/B4/B5サイズ対応
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-600">
                                        <CheckCircle className="h-5 w-5 text-orange-500" />
                                        縦向き・横向き選択可能
                                    </li>
                                </ul>
                            </div>
                            <div className="order-1 lg:order-2">
                                <img
                                    src="/samples/guide_step3.png"
                                    alt="STEP 3: ポスター完成"
                                    className="w-full max-w-md mx-auto"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 新機能セクション */}
            <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            🚀 NEW v1.3.0
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            生成後も自由に編集
                        </h2>
                        <p className="text-xl text-gray-600">
                            ポスター生成後も、編集・画像挿入で理想のデザインに仕上げられます
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* 編集機能 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                            <div className="w-full h-48 mb-6 overflow-hidden rounded-xl">
                                <img
                                    src="/samples/guide_edit.png"
                                    alt="編集機能"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Edit3 className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">画像編集</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                生成後のポスターを自由に編集。背景色の変更、テキストの修正、要素の追加など、AIが指示通りに修正します。
                            </p>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    背景・色の変更
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    テキストの編集
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    要素の追加・削除
                                </li>
                            </ul>
                        </div>

                        {/* 挿入機能 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                            <div className="w-full h-48 mb-6 overflow-hidden rounded-xl">
                                <img
                                    src="/samples/guide_insert.png"
                                    alt="画像挿入機能"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Image className="h-5 w-5 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">画像挿入</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                ロゴ、商品写真、人物画像などを自然に合成。最大5枚まで同時挿入可能で、AIが影や光を自動調整します。
                            </p>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    最大5枚同時挿入
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    自然な合成処理
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    配置位置の指定可能
                                </li>
                            </ul>
                        </div>

                        {/* ダウンロード機能 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                            <div className="w-full h-48 mb-6 overflow-hidden rounded-xl">
                                <img
                                    src="/samples/guide_download.png"
                                    alt="高画質ダウンロード"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Download className="h-5 w-5 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">高画質DL</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                ダウンロード時に自動で2倍アップスケール。350 DPIの印刷対応品質で出力され、商業印刷にも対応できます。
                            </p>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    350 DPI高解像度
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    商業印刷対応
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    追加コストなし
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* アプリスクリーンショット */}
            <section className="py-20 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            シンプルで使いやすいインターフェース
                        </h2>
                        <p className="text-xl text-gray-600">
                            直感的な操作で、誰でもすぐに使いこなせます
                        </p>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                        <img
                            src="/samples/app_screenshot_main.png"
                            alt="PosterAI 画面スクリーンショット"
                            className="w-full"
                        />
                    </div>
                </div>
            </section>

            {/* FAQ セクション */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            よくある質問
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Q: 1日に何回まで使用できますか？</h3>
                            <p className="text-gray-600">
                                A: デフォルトで<strong className="text-green-600">30回/日</strong>まで画像生成が可能です。
                                画像解析は100回/日、編集・挿入機能は無制限でご利用いただけます。
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Q: サンプル画像がなくても使えますか？</h3>
                            <p className="text-gray-600">
                                A: はい、使えます。サンプル画像なしでも、テキスト入力とオプション選択のみでポスターを生成できます。
                                ただし、サンプル画像があるとより精度の高いデザインが生成されます。
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Q: 生成したポスターの著作権は？</h3>
                            <p className="text-gray-600">
                                A: 生成されたポスターは商用利用可能です。ただし、サンプル画像に第三者の著作物が含まれる場合は、
                                その著作権に注意してご利用ください。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA セクション */}
            <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-green-700">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        今すぐPosterAIを始めよう
                    </h2>
                    <p className="text-xl text-green-100 mb-8">
                        サンプル画像をアップロードして、あなただけのオリジナルポスターを作成しましょう
                    </p>
                    <Button
                        size="lg"
                        onClick={() => router.push('/generate')}
                        className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6"
                    >
                        <Sparkles className="mr-2" />
                        無料でポスターを作成
                    </Button>
                </div>
            </section>

            {/* フッター */}
            <footer className="bg-gray-900 py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        © 2025 PosterAI. Powered by Google Gemini AI.
                    </p>
                </div>
            </footer>
        </div>
    )
}
