'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Wand2, Palette, ImageIcon, LogOut, HelpCircle } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()

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
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img
              src="/posterai-logo.svg"
              alt="PosterAI"
              className="h-12"
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
            <nav className="flex items-center gap-4">
              <a
                href="/how-to-use"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium px-3 py-2 rounded-lg flex items-center gap-2"
                title="PosterAIの使い方"
              >
                <HelpCircle className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">PosterAIの使い方</span>
              </a>
            </nav>
          </div>

          {status === 'loading' ? (
            <div className="h-10 w-32 bg-white/20 animate-pulse rounded-lg" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user?.name || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-white/30 shadow-md"
                  />
                )}
                {session.user?.email && (
                  <span className="text-white font-medium max-w-[150px] truncate">
                    {session.user.email.split('@')[0]}
                  </span>
                )}
              </div>
              <Button
                asChild
                className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg px-6"
              >
                <a href="/generate">ポスター生成へ</a>
              </Button>
              <Button
                onClick={() => signOut()}
                className="bg-white/20 hover:bg-white/30 text-white font-medium"
              >
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => signIn('google')}
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
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* 左側: テキストコンテンツ */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-green-200 text-sm font-medium">
              <Wand2 className="w-4 h-4" />
              AI搭載のポスター生成ツール
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              AIが作る、
              <br />
              プロ品質のポスター
            </h1>

            <p className="text-xl md:text-2xl text-green-100 leading-relaxed">
              テキストを入力するだけで、Google Gemini AIが
              <br className="hidden md:block" />
              高品質なポスターデザインを数秒で生成します
            </p>

            <Button
              onClick={() => signIn('google', { callbackUrl: '/generate' })}
              size="lg"
              className="text-lg px-10 py-6 bg-green-500 hover:bg-green-600 text-white font-bold shadow-2xl flex items-center gap-2"
            >
              <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center p-1">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </span>
              Googleで始める
            </Button>
          </div>

          {/* 右側: ポスターモックアップ */}
          <div className="relative perspective-1000">
            <div className="grid grid-cols-2 gap-4" style={{ transform: 'perspective(1000px) rotateY(-5deg)' }}>
              {/* 左列 */}
              <div className="space-y-4">
                {/* ポスター1 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 border-4 border-white/50">
                  <img
                    src="/hero-poster-1.jpg"
                    alt="クリスマス抽選会ポスター"
                    className="w-full h-full object-cover aspect-[3/4]"
                  />
                </div>

                {/* ポスター2 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 border-4 border-white/50">
                  <img
                    src="/hero-poster-2.jpg"
                    alt="熱くなれ日本！熱×祭キャンペーンポスター"
                    className="w-full h-full object-cover aspect-[3/4]"
                  />
                </div>
              </div>

              {/* 右列 */}
              <div className="space-y-4 pt-12">
                {/* ポスター3 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 border-4 border-white/50">
                  <img
                    src="/hero-poster-3.jpg"
                    alt="××××スクエア グランドオープンポスター"
                    className="w-full h-full object-cover aspect-[3/4]"
                  />
                </div>

                {/* ポスター4 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 border-4 border-white/50">
                  <img
                    src="/hero-poster-4.jpg"
                    alt="マウンテンズレストランポスター"
                    className="w-full h-full object-cover aspect-[3/4]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 主な機能セクション */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-20">
          主な機能
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-10 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-10 h-10 text-green-200" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI画像生成</h3>
            <p className="text-lg text-green-100 leading-relaxed">Google Gemini 3 Proを使用した最先端のAI技術で、プロ品質の画像を生成</p>
          </div>

          <div className="text-center p-10 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center mx-auto mb-6">
              <Palette className="w-10 h-10 text-green-200" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">カスタマイズ可能</h3>
            <p className="text-lg text-green-100 leading-relaxed">カラーパレット、レイアウト、テイストなど、細かくカスタマイズ可能</p>
          </div>

          <div className="text-center p-10 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-green-200" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">画像解析</h3>
            <p className="text-lg text-green-100 leading-relaxed">サンプル画像をアップロードすれば、AIが自動でデザイン設定を抽出</p>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-20">
          使い方はとても簡単
        </h2>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg">1</div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Googleアカウントでログイン</h3>
              <p className="text-xl text-green-100">安全で簡単なGoogle認証でログイン</p>
            </div>
          </div>

          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg">2</div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">AIが自動生成</h3>
              <p className="text-xl text-green-100">数秒で高品質なポスターが完成</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/generate' })}
            size="lg"
            className="text-xl px-12 py-8 bg-green-500 hover:bg-green-600 text-white font-bold shadow-2xl flex items-center gap-2 mx-auto"
          >
            <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </span>
            今すぐ無料で始める
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
