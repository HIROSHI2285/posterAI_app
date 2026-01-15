'use client'

import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, CheckCircle, Download, Edit3, Image, Wand2 } from 'lucide-react'

export default function HowToUsePage() {
    const router = useRouter()
    const { data: session } = useSession()

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
                backgroundColor: '#1a3d2e'
            }}
        >
            {/* ヘッダー - TOPページと同じ */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <a href="/" className="cursor-pointer">
                            <img
                                src="/posterai-logo.svg"
                                alt="PosterAI"
                                className="h-12"
                                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                            />
                        </a>
                        <nav className="hidden md:flex items-center gap-4">
                            <a
                                href="/how-to-use"
                                className="text-white bg-white/10 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
                            >
                                PosterAIの使い方
                            </a>
                        </nav>
                    </div>

                    {session ? (
                        <Button
                            asChild
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg px-6"
                        >
                            <a href="/generate">ポスター生成へ</a>
                        </Button>
                    ) : (
                        <Button
                            onClick={() => signIn('google', { callbackUrl: '/generate' })}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg px-6 flex items-center gap-2"
                        >
                            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1">
                                <svg className="w-full h-full" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </span>
                            ログイン
                        </Button>
                    )}
                </div>
            </header>

            {/* ヒーローセクション */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-green-200 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            煩雑なプロンプト設計も画像から自動抽出
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                            サンプル画像から
                            <br />
                            <span className="text-green-400">プロ品質のポスター</span>を
                            <br />
                            自動生成
                        </h1>

                        <p className="text-xl text-green-100 leading-relaxed">
                            参考にしたいデザインをアップロードするだけで、AIが自動解析。
                            複雑なプロンプト設計なしで、理想のポスターが完成します。
                        </p>

                        <Button
                            size="lg"
                            onClick={() => session ? router.push('/generate') : signIn('google', { callbackUrl: '/generate' })}
                            className="text-lg px-10 py-6 bg-green-500 hover:bg-green-600 text-white font-bold shadow-2xl flex items-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            無料で始める
                        </Button>
                    </div>

                    <div className="relative">
                        <img
                            src="/samples/guide_hero.png"
                            alt="PosterAI ヒーローイメージ"
                            className="w-full rounded-2xl shadow-2xl border border-white/20"
                        />
                    </div>
                </div>
            </section>

            {/* 使い方1：基本パターン */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <div className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-bold mb-6">
                        使い方 1：基本パターン
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        テキスト入力だけでポスター作成
                    </h2>
                    <p className="text-xl text-green-100">
                        サンプル画像がなくても、オプション選択とテキスト入力だけで高品質なポスターが完成
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    <div>
                        <img
                            src="/samples/guide_basic.png"
                            alt="基本パターン：テキスト入力でポスター作成"
                            className="w-full max-w-md mx-auto rounded-2xl"
                        />
                    </div>
                    <div className="space-y-6">
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">デザイン設定を選択</h3>
                                <p className="text-green-100">用途（イベント、広告など）、テイスト（モダン、ポップなど）、レイアウト、カラーを選択します。</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">テキストを入力</h3>
                                <p className="text-green-100">メインタイトルと追加テキスト（日時、場所、詳細など）を入力します。</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">生成ボタンをクリック</h3>
                                <p className="text-green-100">「ポスター生成」ボタンをクリックすると、AIが設定に基づいてポスターを生成します。</p>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                            <p className="text-blue-200 text-sm">
                                💡 <strong>ポイント：</strong>詳細指示（プロンプト）に具体的なイメージを記載すると、より希望に近いデザインが生成されます。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 使い方2：応用パターン */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <div className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-bold mb-6">
                        使い方 2：応用パターン（サンプル画像を使用）
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        サンプル画像から<span className="text-green-400">3ステップ</span>で再現
                    </h2>
                    <p className="text-xl text-green-100">
                        参考にしたいデザインがあれば、AIが自動解析してより精度の高いポスターを生成
                    </p>
                </div>

                <div className="space-y-24 max-w-6xl mx-auto">
                    {/* STEP 1 */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white text-2xl font-bold mb-6 shadow-lg">
                                1
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                サンプル画像をアップロード
                            </h3>
                            <p className="text-lg text-green-100 mb-6">
                                参考にしたいデザインやレイアウトの画像をドラッグ＆ドロップ。
                                既存のポスター、チラシ、Webデザインなど、どんな画像でもOKです。
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    PNG, JPG形式に対応
                                </li>
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    AIが自動で解析開始
                                </li>
                            </ul>
                        </div>
                        <div className="order-1 lg:order-2">
                            <img
                                src="/samples/guide_step1.png"
                                alt="STEP 1: サンプル画像をアップロード"
                                className="w-full max-w-md mx-auto rounded-2xl"
                            />
                        </div>
                    </div>

                    {/* STEP 2 */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <img
                                src="/samples/guide_step2.png"
                                alt="STEP 2: AIが自動解析"
                                className="w-full max-w-md mx-auto rounded-2xl"
                            />
                        </div>
                        <div>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500 text-white text-2xl font-bold mb-6 shadow-lg">
                                2
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                AIが自動でプロンプト生成
                            </h3>
                            <p className="text-lg text-green-100 mb-6">
                                アップロードされた画像をAIが詳細に分析。
                                色彩、レイアウト、フォント、デザインスタイルを自動で抽出し、
                                最適なプロンプトを生成します。
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-purple-400" />
                                    色彩パレットの自動抽出
                                </li>
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-purple-400" />
                                    レイアウト構造の分析
                                </li>
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-purple-400" />
                                    デザインスタイルの判定
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* STEP 3 */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 text-white text-2xl font-bold mb-6 shadow-lg">
                                3
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                ボタン一つでポスター完成！
                            </h3>
                            <p className="text-lg text-green-100 mb-6">
                                「ポスター生成」ボタンをクリックするだけで、
                                AIがあなた専用のオリジナルポスターを生成。
                                約30秒で高品質なデザインが完成します。
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-orange-400" />
                                    約30秒で生成完了
                                </li>
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-orange-400" />
                                    A4/A3/B4/B5サイズ対応
                                </li>
                                <li className="flex items-center gap-3 text-green-100">
                                    <CheckCircle className="h-5 w-5 text-orange-400" />
                                    縦向き・横向き選択可能
                                </li>
                            </ul>
                        </div>
                        <div className="order-1 lg:order-2">
                            <img
                                src="/samples/guide_step3.png"
                                alt="STEP 3: ポスター完成"
                                className="w-full max-w-md mx-auto rounded-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 新機能セクション */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <div className="inline-block bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-purple-500/30">
                        🚀 NEW v1.3.0
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        生成後も自由に編集
                    </h2>
                    <p className="text-xl text-green-100">
                        ポスター生成後も、編集・画像挿入で理想のデザインに仕上げられます
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* 編集機能 */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="w-full h-48 mb-6 overflow-hidden rounded-2xl">
                            <img
                                src="/samples/guide_edit.png"
                                alt="編集機能"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                                <Edit3 className="h-5 w-5 text-blue-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white">画像編集</h3>
                        </div>
                        <p className="text-green-100 mb-4">
                            生成後のポスターを自由に編集。背景色の変更、テキストの修正、要素の追加など、AIが指示通りに修正します。
                        </p>
                        <ul className="space-y-2 text-sm text-green-200">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                背景・色の変更
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                テキストの編集
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                要素の追加・削除
                            </li>
                        </ul>
                    </div>

                    {/* 挿入機能 */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="w-full h-48 mb-6 overflow-hidden rounded-2xl">
                            <img
                                src="/samples/guide_insert.png"
                                alt="画像挿入機能"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                                <Image className="h-5 w-5 text-purple-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white">画像挿入</h3>
                        </div>
                        <p className="text-green-100 mb-4">
                            ロゴ、商品写真、人物画像などを自然に合成。最大5枚まで同時挿入可能で、AIが影や光を自動調整します。
                        </p>
                        <ul className="space-y-2 text-sm text-green-200">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                最大5枚同時挿入
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                自然な合成処理
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                配置位置の指定可能
                            </li>
                        </ul>
                    </div>

                    {/* ダウンロード機能 */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="w-full h-48 mb-6 overflow-hidden rounded-2xl">
                            <img
                                src="/samples/guide_download.png"
                                alt="高画質ダウンロード"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                                <Download className="h-5 w-5 text-green-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white">高画質DL</h3>
                        </div>
                        <p className="text-green-100 mb-4">
                            ダウンロード時に自動で2倍アップスケール。350 DPIの印刷対応品質で出力され、商業印刷にも対応できます。
                        </p>
                        <ul className="space-y-2 text-sm text-green-200">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                350 DPI高解像度
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                商業印刷対応
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                追加コストなし
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* サンプル画像ギャラリー */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        生成されたポスターサンプル
                    </h2>
                    <p className="text-xl text-green-100">
                        PosterAIで実際に生成されたポスターの例をご覧ください
                    </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                        <img
                            src="/hero-poster-1.jpg"
                            alt="クリスマス抽選会ポスター"
                            className="w-full h-auto"
                        />
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                        <img
                            src="/hero-poster-2.jpg"
                            alt="熱くなれ日本！キャンペーンポスター"
                            className="w-full h-auto"
                        />
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                        <img
                            src="/hero-poster-3.jpg"
                            alt="グランドオープンポスター"
                            className="w-full h-auto"
                        />
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                        <img
                            src="/hero-poster-4.jpg"
                            alt="レストランポスター"
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            </section>

            {/* アプリスクリーンショット */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        シンプルで使いやすいインターフェース
                    </h2>
                    <p className="text-xl text-green-100">
                        直感的な操作で、誰でもすぐに使いこなせます
                    </p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 max-w-5xl mx-auto">
                    <img
                        src="/samples/app_screenshot_main.png"
                        alt="PosterAI 画面スクリーンショット"
                        className="w-full"
                    />
                </div>
            </section>

            {/* FAQ セクション */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        よくある質問
                    </h2>
                </div>

                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-2">Q: 1日に何回まで使用できますか？</h3>
                        <p className="text-green-100">
                            A: デフォルトで<strong className="text-green-400">30回/日</strong>まで画像生成が可能です。
                            画像解析は100回/日、編集・挿入機能は無制限でご利用いただけます。
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-2">Q: サンプル画像がなくても使えますか？</h3>
                        <p className="text-green-100">
                            A: はい、使えます。サンプル画像なしでも、テキスト入力とオプション選択のみでポスターを生成できます。
                            ただし、サンプル画像があるとより精度の高いデザインが生成されます。
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-2">Q: 生成したポスターの著作権は？</h3>
                        <p className="text-green-100">
                            A: 生成されたポスターは商用利用可能です。ただし、サンプル画像に第三者の著作物が含まれる場合は、
                            その著作権に注意してご利用ください。
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA セクション */}
            <section className="container mx-auto px-4 py-20">
                <div className="bg-gradient-to-r from-green-600/50 to-green-500/50 backdrop-blur-md rounded-3xl p-12 text-center border border-white/20 max-w-4xl mx-auto">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        今すぐPosterAIを始めよう
                    </h2>
                    <p className="text-xl text-green-100 mb-8">
                        サンプル画像をアップロードして、あなただけのオリジナルポスターを作成しましょう
                    </p>
                    <Button
                        size="lg"
                        onClick={() => session ? router.push('/generate') : signIn('google', { callbackUrl: '/generate' })}
                        className="bg-white hover:bg-gray-100 text-green-600 font-bold text-lg px-10 py-6 shadow-xl"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        無料でポスターを作成
                    </Button>
                </div>
            </section>

            {/* フッター */}
            <footer className="border-t border-white/10 bg-black/20 py-10">
                <div className="container mx-auto px-4 text-center text-green-200">
                    <p className="text-lg">© 2025 PosterAI. All Rights Reserved h.yamaguchi</p>
                </div>
            </footer>
        </div>
    )
}
