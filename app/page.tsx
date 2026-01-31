'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Wand2, Palette, ImageIcon, LogOut, ArrowRight, Zap, Layers } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
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
            <div className="relative w-48 h-12">
              <Image
                src="/posterai-logo.svg"
                alt="PosterAI"
                fill
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                priority
              />
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/how-to-use"
                className="text-green-100 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
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
                {session.user?.email && (
                  <span className="text-green-100 font-medium max-w-[150px] truncate hidden md:inline">
                    {session.user.email.split('@')[0]}
                  </span>
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
                ログアウト
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => signIn('google', { callbackUrl: '/generate' })}
              className="bg-brand-acid text-brand-black hover:bg-brand-acidHover font-bold shadow-md hover:shadow-lg transition-all px-6 flex items-center gap-2"
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

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 container mx-auto flex flex-col items-center text-center overflow-visible">
        {/* Ambient Glow - Multi-layered for depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-brand-acid/10 via-brand-acid/5 to-transparent rounded-[100%] blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

        <div className="relative z-10 animate-fade-in space-y-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg hover:border-brand-acid/30 transition-colors cursor-default group">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-acid opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-acid shadow-[0_0_10px_#ccff00]"></span>
            </span>
            <span className="text-sm font-medium text-green-50 tracking-wide group-hover:text-brand-acid transition-colors">New: Nano Banana Pro 搭載</span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.95] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            ポスター制作を <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-acid via-green-300 to-emerald-400 animate-gradient-x bg-[length:200%_auto]">
              魔法のように。
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-green-100/90 max-w-2xl mx-auto leading-relaxed font-light tracking-wide text-shadow-sm">
            美しさと知性を兼ね備えた、次世代のデザインパートナー。<br />
            <span className="font-semibold text-white">Nano Banana Pro</span> が、あなたのアイデアを<br className="hidden md:block" />
            かつてないクオリティのポスターへと昇華させます。<br />
            数時間かかっていた作業を、<span className="text-brand-acid font-medium">数秒で完了</span>します。
          </p>

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button
              onClick={() => signIn('google', { callbackUrl: '/generate' })}
              size="lg"
              className="group relative h-16 px-12 rounded-full bg-brand-acid text-brand-black hover:bg-brand-acidHover font-bold text-xl shadow-[0_0_40px_-10px_rgba(204,255,0,0.6)] hover:shadow-[0_0_60px_-10px_rgba(204,255,0,0.8)] transition-all hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
              <div className="relative flex items-center gap-2">
                無料で始める
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-16 px-10 rounded-full border-white/20 text-white bg-transparent hover:bg-white/5 font-bold text-lg backdrop-blur-md transition-all hover:scale-105 hover:border-white/40"
            >
              <Link href="/how-to-use">使い方を見る</Link>
            </Button>
          </div>
        </div>

        {/* Floating Glass Cubes (Decorative) */}
        <div className="absolute top-[20%] -right-[5%] w-72 h-72 rounded-3xl bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl border border-white/10 shadow-2xl hidden lg:block animate-float mix-blend-overlay opacity-50 rotate-12 pointer-events-none" />
        <div className="absolute bottom-[20%] -left-[5%] w-48 h-48 rounded-full bg-gradient-to-tr from-brand-acid/5 to-transparent backdrop-blur-xl border border-white/5 hidden lg:block animate-float animation-delay-2000 pointer-events-none blur-sm" />
      </section>

      {/* Gallery (Static & Color) - Fluid Layout */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 skew-y-1 transform origin-top-left scale-110 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px bg-white/20 flex-1" />
            <span className="text-green-200/60 uppercase tracking-widest text-sm font-semibold">Generated by PosterAI</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i, idx) => (
              <div
                key={idx}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 flex items-end justify-center pb-6">
                  <span className="text-white text-sm font-bold tracking-wider translate-y-4 group-hover:translate-y-0 transition-transform duration-300">VIEW DESIGN</span>
                </div>
                <Image
                  src={`/hero-poster-${i}.jpg`}
                  alt="Poster"
                  fill
                  className="object-cover transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-700 ease-out shadow-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid - Glassmorphism */}
      <section className="py-32 px-6 container mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-acid/5 to-transparent opacity-30 pointer-events-none" />

        <div className="text-center mb-24 space-y-6 relative z-10">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white tracking-tight">
            Why <span className="text-brand-acid">PosterAI?</span>
          </h2>
          <p className="text-green-100/80 max-w-2xl mx-auto text-xl font-light">
            プロ品質のマーケティング素材を作成するために必要なすべてがここに。<br />
            <span className="text-white font-medium">圧倒的なクオリティとスピード</span>を体験してください。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-10">
          {/* Card 1: Large */}
          <div className="md:col-span-2 p-10 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 hover:border-brand-acid/30 transition-all hover:bg-white/10 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-110 group-hover:rotate-6">
              <Wand2 className="w-64 h-64 text-brand-acid" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-brand-acid flex items-center justify-center mb-8 text-brand-black shadow-[0_10px_20px_rgba(204,255,0,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Wand2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 text-white">AIによる自動生成</h3>
              <p className="text-green-100/90 leading-relaxed max-w-lg text-lg">
                Nano Banana Proモデルを活用し、あなたの文脈を理解して、明確でインパクトのあるデザインを生成します。ニュアンス、感情、ブランドボイスを理解します。
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-10 rounded-[2.5rem] bg-gradient-to-bl from-white/10 to-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-400/30 transition-all hover:bg-white/10 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-8 text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-[0_10px_20px_rgba(59,130,246,0.2)]">
                <Palette className="w-7 h-7" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 text-white">スマートスタイリング</h3>
              <p className="text-green-100/80 leading-relaxed">
                一貫性のあるカラーパレットとタイポグラフィシステムを自動的に適用。
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-10 rounded-[2.5rem] bg-gradient-to-tr from-white/10 to-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/30 transition-all hover:bg-white/10 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-8 text-purple-400 group-hover:scale-110 transition-transform duration-500 shadow-[0_10px_20px_rgba(168,85,247,0.2)]">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 text-white">画像解析・抽出</h3>
              <p className="text-green-100/80 leading-relaxed">
                どんなデザインもリバースエンジニアリング。サンプル画像から設計図を抽出。
              </p>
            </div>
          </div>

          {/* Card 4: Large */}
          <div className="md:col-span-2 p-10 rounded-[2.5rem] bg-gradient-to-tl from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 hover:border-orange-400/30 transition-all hover:bg-white/10 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] group relative overflow-hidden md:col-start-2">
            <div className="absolute -bottom-10 -left-10 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-125">
              <Layers className="w-64 h-64 text-orange-500" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-8 text-orange-500 shadow-[0_10px_20px_rgba(249,115,22,0.2)] -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="font-display text-3xl font-bold mb-4 text-white">圧倒的なスピード</h3>
                <p className="text-green-100/90 leading-relaxed text-lg">
                  アイデアからダウンロードまで数秒。印刷用やデジタル配信用の高解像度PNGやPDFで即座にエクスポートできます。
                </p>
              </div>
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
    </div>
  )
}
