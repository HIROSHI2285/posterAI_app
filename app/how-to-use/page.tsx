'use client'

import { useRouter } from 'next/navigation'
import { signIn, useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, CheckCircle, Download, Edit3, Image as ImageIcon, Wand2, HelpCircle, Layers, FileBox, Save, LogOut, MousePointer2, Type, Eraser, Move } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { BrowserFrame } from './components/BrowserFrame'


export default function HowToUsePage() {
    const router = useRouter()
    const { data: session } = useSession()

    return (
        <div
            className="min-h-screen text-white overflow-x-hidden selection:bg-brand-acid selection:text-brand-black font-sans"
            style={{
                backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
                backgroundSize: '30px 30px',
                backgroundColor: '#1a3d2e'
            }}
        >
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="cursor-pointer relative w-48 h-12">
                            <Image
                                src="/posterai-logo.svg"
                                alt="PosterAI"
                                fill
                                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                                priority
                            />
                        </Link>
                        <nav className="hidden md:flex items-center gap-4">
                            <Link
                                href="/how-to-use"
                                className="text-white bg-white/10 transition-all duration-200 font-medium px-4 py-2 rounded-lg pointer-events-none"
                            >
                                PosterAIの使い方
                            </Link>
                        </nav>
                    </div>

                    {session ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {session.user?.image && (
                                    <div className="relative w-10 h-10 rounded-full border-2 border-white/20 shadow-sm overflow-hidden">
                                        <Image
                                            src={session.user.image}
                                            alt={session.user?.name || 'User'}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                )}
                            </div>
                            <Button
                                asChild
                                className="bg-brand-acid text-brand-black hover:bg-brand-acidHover font-bold shadow-md hover:shadow-lg transition-all px-6"
                            >
                                <Link href="/generate">ダッシュボード</Link>
                            </Button>
                            <Button
                                onClick={() => signOut()}
                                variant="ghost"
                                className="text-green-200 hover:text-white hover:bg-white/10 font-medium"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => signIn('google', { callbackUrl: '/generate' })}
                            className="bg-brand-acid text-brand-black hover:bg-brand-acidHover font-bold shadow-md hover:shadow-lg transition-all px-6 flex items-center gap-2"
                        >
                            ログイン
                        </Button>
                    )}
                </div>
            </header>

            {/* ヒーローセクション */}
            <section className="container mx-auto px-6 py-20 relative overflow-visible">
                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-acid/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-brand-acid text-sm font-medium shadow-lg">
                            <Sparkles className="w-4 h-4" />
                            Master Guide
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                            PosterAI<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-acid to-green-400">完全ガイド</span>
                        </h1>

                        <p className="text-xl text-green-100/90 leading-relaxed font-light">
                            生成から編集、そして保存まで。<br />
                            Nano Banana Proの力を最大限に引き出す、<br />
                            プロフェッショナルなワークフローを解説します。
                        </p>

                        <Button
                            size="lg"
                            onClick={() => session ? router.push('/generate') : signIn('google', { callbackUrl: '/generate' })}
                            className="bg-brand-acid text-brand-black hover:bg-brand-acidHover font-bold text-lg px-8 py-6 shadow-[0_0_30px_-5px_rgba(204,255,0,0.4)] transition-all hover:scale-105"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            今すぐ使ってみる
                        </Button>
                    </div>

                    <div className="relative md:mt-0 mt-10">
                        {/* Using actual dashboard screenshot for Hero */}
                        <div className="absolute inset-0 bg-brand-acid/5 rounded-3xl blur-2xl scale-95" />
                        <div className="relative w-full rounded-2xl shadow-2xl skew-y-1">
                            <BrowserFrame
                                src="/samples/real_dashboard.png?v=5"
                                alt="PosterAI Dashboard"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>



            {/* FEATURE SHOWCASE: GENERATION */}
            <section className="container mx-auto px-6 py-24 border-t border-white/5">
                <div className="mb-16">
                    <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                        あらゆるニーズに応える<br />
                        <span className="text-brand-acid">生成スタイル</span>
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl">
                        テキスト指示だけでゼロから生み出すことも、既存の画像をベースに再構築することも可能です。
                    </p>
                </div>

                <div className="space-y-24">
                    {/* SCENARIO 1: Standard Usage */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center group">
                        <div className="order-2 lg:order-1 relative">
                            <div className="absolute inset-0 bg-blue-500/10 blur-3xl opacity-20 -z-10" />
                            <BrowserFrame
                                src="/samples/real_standard_usage.png?v=4"
                                alt="Standard Text Generation"
                            />
                        </div>
                        <div className="order-1 lg:order-2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                <Sparkles className="w-3 h-3" />
                                通常の使用方法
                            </div>
                            <h3 className="text-2xl font-bold text-white">テキストから無限のアイデアを</h3>
                            <p className="text-green-100/70 leading-relaxed">
                                「夏の音楽フェスのポスター」「高級感のあるカフェのメニュー」など、<br />作りたいもののイメージを言葉で入力するだけ。<br />
                                Nano Banana Proの高度な文脈理解により、意図を汲み取った<br />高品質なデザインを提案します。
                            </p>
                        </div>
                    </div>

                    {/* SCENARIO 2: Image Reference & Insertion */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center group">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-acid/10 text-brand-acid text-xs font-bold uppercase tracking-wider rounded-full">
                                <ImageIcon className="w-3 h-3" />
                                画像参照 & 素材挿入
                            </div>
                            <h3 className="text-2xl font-bold text-white">ビジュアル指示でより具体的に</h3>
                            <p className="text-green-100/70 leading-relaxed">
                                <b>参考画像機能:</b> 参考にしたい画像や雰囲気の近い画像をアップロードして、<br />「解析されたプロンプト」を利用して指示が可能。<br />
                                <b>画像挿入機能:</b> ロゴや商品写真など、デザインに必ず含めたい素材を<br />そのまま指定位置に配置して生成できます。
                            </p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-acid/10 blur-3xl opacity-20 -z-10" />
                            <BrowserFrame
                                src="/samples/real_ref_usage.png?v=4"
                                alt="Image Reference & Insertion"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURE SHOWCASE: EDITING SUITE */}
            <section className="container mx-auto px-6 py-24 border-t border-white/5 bg-white/[0.02]">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                        プロ仕様の<br />
                        <span className="text-purple-400">AI編集スイート</span>
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        生成して終わりではありません。細部へのこだわりを、AIが強力にサポートします。
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Feature 1: Prompt Edit */}
                    <div className="bg-[#0f1014] border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors group">
                        <div className="mb-6 overflow-hidden rounded-lg border border-white/5 relative aspect-video">
                            <Image
                                src="/samples/real_edit_prompt.png?v=4"
                                alt="Prompt Editing"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-3">
                            <Edit3 className="w-5 h-5 text-purple-400" />
                            プロンプト再編集
                        </h4>
                        <p className="text-sm text-green-100/60 leading-relaxed">
                            生成された画像の結果を見て、プロンプトを微調整。「もう少し明るく」「文字を大きく」といった追加指示で、理想通りの仕上がりに近づけます。
                        </p>
                    </div>

                    {/* Feature 2: Inpainting (Rect) */}
                    <div className="bg-[#0f1014] border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors group">
                        <div className="mb-6 overflow-hidden rounded-lg border border-white/5 relative aspect-video">
                            <Image
                                src="/samples/real_edit_rect.png?v=4"
                                alt="Region Editing"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-3">
                            <MousePointer2 className="w-5 h-5 text-purple-400" />
                            矩形（領域）編集
                        </h4>
                        <p className="text-sm text-green-100/60 leading-relaxed">
                            「ここだけ直したい」を実現。画像を矩形選択し、その部分だけをAIに描き直させることができます（Inpainting機能）。不要なオブジェクトの消去にも最適。
                        </p>
                    </div>

                    {/* Feature 3: Text Edit */}
                    <div className="bg-[#0f1014] border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors group">
                        <div className="mb-6 overflow-hidden rounded-lg border border-white/5 relative aspect-video">
                            <Image
                                src="/samples/real_edit_text.png?v=4"
                                alt="Text Editing"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-3">
                            <Type className="w-5 h-5 text-purple-400" />
                            テキスト編集
                        </h4>
                        <p className="text-sm text-green-100/60 leading-relaxed">
                            AIが生成した文字を直接編集可能。フォントの変更、サイズの調整、誤字の修正など、デザインツールとしての基本機能も完備しています。
                        </p>
                    </div>

                    {/* Feature 4: Insert Image in Editor */}
                    <div className="bg-[#0f1014] border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors group">
                        <div className="mb-6 overflow-hidden rounded-lg border border-white/5 relative aspect-video">
                            <Image
                                src="/samples/real_edit_insert.png?v=4"
                                alt="Image Insertion in Editor"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-3">
                            <Layers className="w-5 h-5 text-purple-400" />
                            あとから画像追加
                        </h4>
                        <p className="text-sm text-green-100/60 leading-relaxed">
                            編集画面でいつでも画像を追加可能。QRコードやスポンサーロゴなど、後から配置が必要になった素材も柔軟にレイアウトできます。
                        </p>
                    </div>
                </div>
            </section>

            {/* FEATURE SHOWCASE: SAVE & EXPORT */}
            <section className="container mx-auto px-6 py-24 border-t border-white/5">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute inset-0 bg-green-500/10 blur-3xl opacity-20 -z-10" />
                        <BrowserFrame
                            src="/samples/real_save_project.png?v=4"
                            alt="Project Saving"
                        />
                    </div>
                    <div className="order-1 lg:order-2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-300 text-xs font-bold uppercase tracking-wider rounded-full">
                            <Save className="w-3 h-3" />
                            プロジェクト保存 & 出力
                        </div>
                        <h3 className="text-2xl font-bold text-white">プロジェクト保存機能でいつでも再開</h3>
                        <p className="text-green-100/70 leading-relaxed">
                            気に入ったデザインや、シリーズ化したい画像は<br />「プロジェクト保存」機能でJSON形式で保存可能。<br />後から読み込んで再編集できます。<br />
                            完成した画像は、印刷にも耐えうる高解像度（350dpi相当）の<br />PNG/JPGとしてダウンロードできます。
                        </p>
                    </div>
                </div>
            </section>



            {/* FAQ (Restored & Enhanced) */}
            <section className="container mx-auto px-6 py-24 border-t border-white/10 bg-black/10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        よくある質問
                    </h2>
                    <p className="text-green-100/60">困ったときのQ&Aガイド</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/5 hover:border-brand-acid/20 transition-all group">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-4">
                            <span className="text-brand-acid font-display text-2xl">Q.</span>
                            生成された画像の著作権と免責事項は？
                        </h3>
                        <div className="pl-10 space-y-4 text-green-100/80 leading-relaxed">
                            <p>
                                生成されたポスターの権利はユーザーに帰属し、商用利用も可能です。
                            </p>
                            <p>
                                ただし、当サービスの利用により生成された画像によって生じたいかなる損害やトラブル（著作権侵害等を含む）についても、運営者は一切の責任を負いません。
                            </p>
                            <p className="border-t border-white/10 pt-4 text-sm text-green-100/60">
                                ※AI生成物の性質上、既存の著作物と類似する可能性が完全には否定できないため、公開・商用利用の際はご自身の責任と判断においてご利用ください。 特に他者の著作物をサンプル画像として使用する場合は権利関係に十分ご注意ください。
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-8 border border-white/5 hover:border-brand-acid/20 transition-all group">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-4">
                            <span className="text-brand-acid font-display text-2xl">Q.</span>
                            1日に何回まで使えますか？
                        </h3>
                        <div className="pl-10 space-y-2 text-green-100/80 leading-relaxed">
                            <p>
                                現在、ベータ版として以下の制限を設けさせていただいています。
                            </p>
                            <ul className="list-disc list-outside ml-4 space-y-1">
                                <li>画像生成：<span className="text-white">30回 / 日</span></li>
                                <li>画像解析：<span className="text-white">30回 / 日</span></li>
                            </ul>
                            <p className="text-sm mt-2 pt-2 border-t border-white/10">
                                ※ 編集機能（文字の打ち替え、レイヤー操作など）に制限はありません。
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-8 border border-white/5 hover:border-brand-acid/20 transition-all group">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-4">
                            <span className="text-brand-acid font-display text-2xl">Q.</span>
                            うまく希望通りの画像が出ないときは？
                        </h3>
                        <div className="pl-10 space-y-2 text-green-100/80 leading-relaxed">
                            <p>以下のテクニックをお試しください：</p>
                            <ul className="list-disc list-outside ml-4 space-y-1">
                                <li>「画像参照モード」を使い、イメージに近い画像を読み込ませる</li>
                                <li>「ラフ画」を手書きで書いて読み込ませる（構図の指示に最適）</li>
                                <li>プロンプトに具体的な色や雰囲気（例：「高級感のある」「ポップな」）を含める</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-8 border border-white/5 hover:border-brand-acid/20 transition-all group">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-4">
                            <span className="text-brand-acid font-display text-2xl">Q.</span>
                            編集はまとめて行った方が良いですか？
                        </h3>
                        <div className="pl-10 space-y-2 text-green-100/80 leading-relaxed">
                            <p>
                                はい、**「プロンプト変更」「矩形選択」「テキスト修正」などは、一度にまとめて指示を行う**ことをおすすめします。
                            </p>
                            <p>
                                修正のたびにAIが画像を再生成するため、まとめて指示を出すことで生成回数（クレジット）を節約できます。<br />
                                さらには、AI（Nano Banana Pro）が全体の変更意図を一度に理解できるため、**より正確で理想に近い結果が出やすくなる**というメリットもあります。
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-8 border border-white/5 hover:border-brand-acid/20 transition-all group">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-4">
                            <span className="text-brand-acid font-display text-2xl">Q.</span>
                            プロジェクトの保存方法がわかりません
                        </h3>
                        <div className="pl-10 space-y-2 text-green-100/80 leading-relaxed">
                            <p>
                                編集画面の右下にある「プロジェクト保存」アイコンボタンをクリックしてください。
                                <code className="bg-black/30 px-2 py-0.5 rounded mx-1 text-sm border border-white/10">.json</code> 形式のファイルがダウンロードされます。
                            </p>
                            <p>
                                再開する際は、プレビュー内の「プロジェクトを読み込む」からそのファイルを選択してください。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 border-t border-white/10 bg-black/20">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center mb-10">
                        <div className="relative h-16 w-60 opacity-80 filter brightness-0 invert">
                            <Image
                                src="/posterai-logo.svg"
                                alt="PosterAI"
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-green-200/80">© 2025 PosterAI. Crafted with Intelligence.</p>
                </div>
            </footer>
        </div >
    )
}


