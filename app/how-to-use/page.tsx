'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Sparkles, Upload, Download, Palette, Layout, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function HowToUsePage() {
    const router = useRouter()

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
            {/* ヘッダー */}
            <header className="border-b border-gray-700 bg-gray-900 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            ホームに戻る
                        </Button>
                        <img
                            src="/posterai-logo.svg"
                            alt="PosterAI"
                            className="h-12 cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                            onClick={() => router.push('/')}
                        />
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="container mx-auto px-4 py-16">
                {/* タイトルセクション */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        PosterAIの使い方
                    </h1>
                    <p className="text-xl text-gray-400">
                        AIで簡単にプロ品質のポスターを作成する方法をステップバイステップで解説
                    </p>
                </div>

                {/* 基本的な使い方 */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <Sparkles className="text-green-400" />
                        基本的な使い方
                    </h2>

                    <div className="space-y-12">
                        {/* ステップ1: ログイン */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4">Googleアカウントでログイン</h3>
                                    <p className="text-gray-300">
                                        安全で簡単なGoogle認証でログインします。TOPページの「Googleで始める」ボタンをクリックしてください。
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ステップ2: ポスター生成ページ */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4">ポスター生成ページへ</h3>
                                    <p className="text-gray-300 mb-6">
                                        ログイン後、「Get Started」または「今すぐ生成」ボタンからポスター生成ページにアクセスします。
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ステップ3: フォーム入力 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4">基本情報を入力</h3>
                                    <p className="text-gray-300 mb-6">
                                        ポスターの基本情報を入力します：
                                    </p>
                                    <ul className="space-y-3 text-gray-300">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                            <span><strong>タイトル:</strong> ポスターのメインタイトル（必須）</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                            <span><strong>用途:</strong> イベント告知、SNS投稿など</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                            <span><strong>テイスト:</strong> シンプル、カラフル、モダンなど</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                            <span><strong>レイアウト:</strong> 中央揃え、左右分割など</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                            <span><strong>カラー:</strong> メインカラーを指定</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* サンプル画像から生成（メイン機能） */}
                <section className="mb-20">
                    <div className="bg-gray-800 rounded-3xl p-12 border-2 border-gray-700 mb-8">
                        <h2 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                            <Upload className="text-green-400" />
                            サンプル画像から生成 ⭐ メイン機能
                        </h2>
                        <p className="text-xl text-gray-200">
                            既存の画像をアップロードすると、AIが自動で色味やスタイルを解析し、新しいポスターに反映します。
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* サンプル画像ステップ1 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4">サンプル画像をアップロード</h3>
                                    <p className="text-gray-300 mb-6">
                                        「サンプル画像」セクションで参考にしたい画像をアップロードします。
                                    </p>
                                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                                        <ul className="space-y-2 text-gray-300">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="text-green-400" size={20} />
                                                対応形式: JPG, PNG, WebP
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="text-green-400" size={20} />
                                                推奨サイズ: 最大10MB
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="text-green-400" size={20} />
                                                高解像度推奨（より正確な解析）
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* サンプル画像ステップ2 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4">⭐ AIが自動解析して詳細プロンプトに反映</h3>
                                    <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-700">
                                        <p className="text-blue-200 font-semibold mb-2">🎯 PosterAIの目玉機能</p>
                                        <p className="text-gray-300">
                                            アップロードした画像をAIが自動的に解析し、<strong className="text-blue-200">「詳細指示（プロンプト）」</strong>に反映します。
                                            この詳細プロンプトを自由に編集・カスタマイズできるのが特徴です。
                                        </p>
                                    </div>

                                    <h4 className="text-lg font-bold text-white mb-4">🔍 AIが解析する要素：</h4>
                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                            <Palette className="text-blue-400 mb-2" />
                                            <h5 className="text-white font-bold mb-2">カラーパレット</h5>
                                            <p className="text-gray-400 text-sm">主要な色、アクセントカラー、配色比率を抽出</p>
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                            <Layout className="text-blue-400 mb-2" />
                                            <h5 className="text-white font-bold mb-2">レイアウトスタイル</h5>
                                            <p className="text-gray-400 text-sm">構図、要素の配置、バランスを分析</p>
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                            <Sparkles className="text-blue-400 mb-2" />
                                            <h5 className="text-white font-bold mb-2">雰囲気・テイスト</h5>
                                            <p className="text-gray-400 text-sm">デザインの全体的な雰囲気、スタイルを検出</p>
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                            <FileImage className="text-blue-400 mb-2" />
                                            <h5 className="text-white font-bold mb-2">詳細なデザイン要素</h5>
                                            <p className="text-gray-400 text-sm">フォントスタイル、装飾要素、質感など</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
                                        <h4 className="text-lg font-bold text-green-300 mb-3">✨ 詳細プロンプトに自動反映</h4>
                                        <p className="text-gray-300 mb-3">
                                            AIが解析した内容は、<strong>「詳細指示（プロンプト）」フィールド</strong>に自動的に入力されます。
                                        </p>
                                        <div className="bg-black rounded-lg p-4 mb-3 border border-gray-700">
                                            <p className="text-sm text-gray-400 mb-2">例: サンプル画像解析後のプロンプト</p>
                                            <code className="text-xs text-green-200">
                                                "クリスマスをテーマにした豪華なデザイン。メインカラーは深いグリーン(#1a5d3a)とゴールド(#d4af37)。中央にイラスト、上部にタイトル、下部に詳細情報を配置。オーナメントとキラキラした装飾を追加。エレガントで華やかな雰囲気。"
                                            </code>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                            <p className="text-gray-300 text-sm">
                                                このプロンプトは<strong className="text-green-300">自由に編集・追記・変更可能</strong>です！
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* サンプル画像ステップ3 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4">🔧 詳細プロンプトをカスタマイズして生成</h3>
                                    <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-700">
                                        <p className="text-blue-200 font-semibold mb-2">✨ 自由なカスタマイズが可能</p>
                                        <p className="text-gray-300">
                                            AIが生成した詳細プロンプトは、あなたのイメージに合わせて<strong className="text-blue-200">自由に編集・追加・変更</strong>できます。
                                        </p>
                                    </div>

                                    <p className="text-gray-300 mb-4">
                                        AIが抽出した設定をベースに、以下をカスタマイズできます：
                                    </p>
                                    <ul className="space-y-3 text-gray-300 mb-6">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-blue-400 mt-1" />
                                            <div>
                                                <strong className="text-white">タイトル:</strong> 新しい内容に変更
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-blue-400 mt-1" />
                                            <div>
                                                <strong className="text-white">色調整:</strong> サンプルベースまたは完全カスタム
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-blue-400 mt-1" />
                                            <div>
                                                <strong className="text-white">詳細プロンプト編集:</strong> 装飾要素、質感、雰囲気を詳しく指定
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="text-blue-400 mt-1" />
                                            <div>
                                                <strong className="text-white">生成実行:</strong> 「生成する」ボタンで生成開始
                                            </div>
                                        </li>
                                    </ul>

                                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
                                        <h4 className="text-base font-bold text-white mb-2">💡 カスタマイズ例</h4>
                                        <p className="text-sm text-gray-400 mb-2">元のプロンプト:</p>
                                        <code className="text-xs text-gray-400 block mb-3">"シンプルでモダンなデザイン"</code>
                                        <p className="text-sm text-gray-400 mb-2">カスタマイズ後:</p>
                                        <code className="text-xs text-blue-200 block">"シンプルでモダンなデザイン。<span className="text-green-300">幾何学的パターンを背景に追加。フォントは太めのサンセリフ体を使用。</span>"</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 生成サンプル画像 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-2xl font-bold text-white mb-6">✨ 実際の生成サンプル</h3>
                            <p className="text-gray-300 mb-6">PosterAIで生成されたポスターの例をご覧ください</p>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <img
                                        src="/samples/christmas_lottery.jpg"
                                        alt="クリスマス抽選会ポスター"
                                        className="rounded-xl shadow-2xl border-2 border-gray-700 w-full"
                                    />
                                    <p className="text-center text-gray-300 text-sm">イベントポスター例</p>
                                </div>
                                <div className="space-y-3">
                                    <img
                                        src="/samples/grand_opening.jpg"
                                        alt="グランドオープンポスター"
                                        className="rounded-xl shadow-2xl border-2 border-gray-700 w-full"
                                    />
                                    <p className="text-center text-gray-300 text-sm">店舗告知ポスター例</p>
                                </div>
                            </div>
                        </div>

                        {/* サンプル画像の利点 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-2xl font-bold text-white mb-6">サンプル画像機能の利点</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-blue-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">時間短縮</h4>
                                        <p className="text-gray-300 text-sm">ゼロから考える必要なし</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-blue-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">一貫性維持</h4>
                                        <p className="text-gray-300 text-sm">ブランドイメージを統一</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-blue-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">プロ品質</h4>
                                        <p className="text-gray-300 text-sm">AIによる最適化</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-blue-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">柔軟性</h4>
                                        <p className="text-gray-300 text-sm">自由なカスタマイズ可能</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* おすすめの使い方 */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <Sparkles className="text-yellow-400" />
                        おすすめの使い方
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* パターン1 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">🎪 イベントポスター作成</h3>
                            <p className="text-gray-300 mb-4">
                                セミナー、コンサート、展示会などのイベント告知に最適
                            </p>
                            <div className="bg-gray-900 rounded-lg p-4">
                                <p className="text-sm text-gray-400 mb-2">フロー:</p>
                                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                                    <li>過去の成功イベントポスターをサンプルに</li>
                                    <li>新しい日程・タイトルに変更</li>
                                    <li>同じテイストで統一感のあるシリーズ作成</li>
                                </ol>
                            </div>
                        </div>

                        {/* パターン2 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">📱 SNS投稿用画像</h3>
                            <p className="text-gray-300 mb-4">
                                Instagram, Twitter, Facebookなどの投稿に
                            </p>
                            <div className="bg-gray-900 rounded-lg p-4">
                                <p className="text-sm text-gray-400 mb-2">フロー:</p>
                                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                                    <li>ブランドカラーの既存画像をサンプルに</li>
                                    <li>縦向き/横向きを選択</li>
                                    <li>キャッチコピーを追加</li>
                                </ol>
                            </div>
                        </div>

                        {/* パターン3 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">🏪 店舗POP作成</h3>
                            <p className="text-gray-300 mb-4">
                                セール告知、新商品案内などの店内ポスター
                            </p>
                            <div className="bg-gray-900 rounded-lg p-4">
                                <p className="text-sm text-gray-400 mb-2">フロー:</p>
                                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                                    <li>店舗イメージの写真をサンプルに</li>
                                    <li>「ポップ」「カラフル」テイストを選択</li>
                                    <li>特典情報を追加</li>
                                </ol>
                            </div>
                        </div>

                        {/* パターン4 */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">📚 シリーズ物の作成</h3>
                            <p className="text-gray-300 mb-4">
                                連続講座、シリーズイベントなど統一感が重要な場合
                            </p>
                            <div className="bg-gray-900 rounded-lg p-4">
                                <p className="text-sm text-gray-400 mb-2">フロー:</p>
                                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                                    <li>第1回のポスターをサンプルに</li>
                                    <li>タイトルと日程だけ変更</li>
                                    <li>統一感のあるシリーズポスター完成</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips & ベストプラクティス */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8">💡 Tips & ベストプラクティス</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* DO */}
                        <div className="bg-gray-800 rounded-2xl p-8 border-2 border-gray-700">
                            <h3 className="text-2xl font-bold text-green-400 mb-6">✅ おすすめ</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                    <span className="text-gray-200">サンプル画像は高解像度を使用</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                    <span className="text-gray-200">メインカラーは3色以内に</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                    <span className="text-gray-200">タイトルは短く、インパクトのある言葉</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" />
                                    <span className="text-gray-200">サブタイトルで詳細を補足</span>
                                </li>
                            </ul>
                        </div>

                        {/* DON'T */}
                        <div className="bg-gray-800 rounded-2xl p-8 border-2 border-gray-700">
                            <h3 className="text-2xl font-bold text-red-400 mb-6">⚠️ 避けるべきこと</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1 flex-shrink-0">×</span>
                                    <span className="text-gray-200">テキストを詰め込みすぎない</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1 flex-shrink-0">×</span>
                                    <span className="text-gray-200">サンプル画像と全く異なるテイストは避ける</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1 flex-shrink-0">×</span>
                                    <span className="text-gray-200">低解像度の画像をアップロード</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1 flex-shrink-0">×</span>
                                    <span className="text-gray-200">複雑すぎるレイアウト</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 推奨サイズ */}
                    <div className="mt-8 bg-gray-800 rounded-2xl p-8 border border-gray-700">
                        <h3 className="text-2xl font-bold text-white mb-6">📐 推奨サイズ</h3>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="bg-gray-900 rounded-lg p-4 text-center">
                                <p className="text-white font-bold mb-2">Instagram</p>
                                <p className="text-gray-400 text-sm">縦向き</p>
                                <p className="text-green-400 text-sm">1080x1350</p>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4 text-center">
                                <p className="text-white font-bold mb-2">Twitter/X</p>
                                <p className="text-gray-400 text-sm">横向き</p>
                                <p className="text-green-400 text-sm">1200x675</p>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4 text-center">
                                <p className="text-white font-bold mb-2">A4印刷</p>
                                <p className="text-gray-400 text-sm">縦向き</p>
                                <p className="text-green-400 text-sm">2480×3508</p>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4 text-center">
                                <p className="text-white font-bold mb-2">ポスター</p>
                                <p className="text-gray-400 text-sm">縦向き</p>
                                <p className="text-green-400 text-sm">大サイズ</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8">❓ よくある質問</h2>

                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3">Q: サンプル画像なしでも生成できますか？</h3>
                            <p className="text-gray-300">
                                A: はい、テキストと設定だけでも生成できます。ただし、サンプル画像を使用すると、より一貫性のあるデザインが作成できます。
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3">Q: 生成に時間がかかるのはなぜ？</h3>
                            <p className="text-gray-300">
                                A: AIが高品質な画像を生成するため、30秒〜1分程度かかります。複雑なデザインほど時間がかかる場合があります。
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3">Q: 同じサンプル画像で何度も生成できますか？</h3>
                            <p className="text-gray-300 mb-3">
                                A: はい、タイトルやテイストを変えて何度でも生成できます。シリーズ物のポスター作成に便利です。
                            </p>
                            <p className="text-yellow-300 text-sm bg-gray-900 rounded-lg p-3 border border-gray-700">
                                ⚠️ 注意: 同じサンプル画像でも、再生成するたびにAIが新しい画像を生成するため、若干イメージが変わります。完全に同じ画像が必要な場合は、一度生成した画像を保存してください。
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3">Q: 商用利用は可能ですか？</h3>
                            <p className="text-gray-300">
                                A: 生成された画像は自由に利用できます。ただし、アップロードしたサンプル画像の著作権は元の所有者に帰属します。
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3">Q: 生成された画像のサイズを変更できますか？</h3>
                            <p className="text-gray-300">
                                A: 生成前に「出力サイズ」と「向き」を選択できます。縦向き・横向きを選択し、用途に応じたサイズで生成してください。
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3">Q: 1日に何回まで使用できますか？</h3>
                            <p className="text-gray-300 mb-3">
                                A: 1ユーザーあたり、1日に<strong className="text-green-400">最大100回</strong>までポスター生成が可能です。
                            </p>
                            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                <p className="text-sm text-gray-400 mb-2">📊 利用制限の詳細：</p>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span><strong className="text-white">画像生成</strong>: 100回/日</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span><strong className="text-white">画像解析</strong>: 制限なし（サンプル画像のアップロード）</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-400">ℹ️</span>
                                        <span>制限は毎日午前0時（JST）にリセットされます</span>
                                    </li>
                                </ul>
                            </div>
                            <p className="text-yellow-300 text-sm bg-gray-900 rounded-lg p-3 border border-gray-700 mt-3">
                                💡 ヒント: 残り回数は生成ページで確認できます。上限に達した場合は翌日0時まで待つか、管理者に制限緩和をご相談ください。
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <div className="text-center bg-gray-800 rounded-3xl p-12 border-2 border-gray-700">
                    <h2 className="text-3xl font-bold text-white mb-4">準備はできましたか？</h2>
                    <p className="text-xl text-gray-200 mb-8">
                        今すぐPosterAIでプロ品質のポスターを作成しましょう
                    </p>
                    <Button
                        size="lg"
                        onClick={() => router.push('/generate')}
                        className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6"
                    >
                        <Sparkles className="mr-2" />
                        ポスターを作成する
                    </Button>
                </div>
            </main>

            {/* フッター */}
            <footer className="border-t border-gray-700 bg-gray-900 py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        © 2025 PosterAI. Powered by Google Gemini AI.
                    </p>
                </div>
            </footer>
        </div>
    )
}
