import { Sparkles, Zap, Palette, Download, Wand2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Clean Background - Canva Style */}

      {/* Header */}
      <header className="relative border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/posterai-logo.svg"
                alt="PosterAI"
                className="h-14"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <Button variant="outline" className="shadow-sm">
              ログイン
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-5xl mx-auto animate-fade-in">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                ✨ Powered by Gemini 3 Pro Image Preview
              </span>
            </div>

            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold font-display mb-8 leading-tight">
              <span className="text-primary">
                AIが生み出す
              </span>
              <br />
              <span className="text-foreground">
                プロ級ポスター
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              イベント告知、店内掲示、SNSサムネイルまで
              <br />
              <span className="font-semibold text-primary">たった数秒</span>で、誰でもプロフェッショナルなデザインを
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all bg-primary hover:bg-primary/90"
                asChild
              >
                <a href="/generate">
                  <Wand2 className="mr-2 h-5 w-5" />
                  無料で始める
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">10秒</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">平均生成時間</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">4K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">最大解像度</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">無制限</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">再作成回数</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold font-display mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              強力な機能
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              プロフェッショナルなデザインを簡単に
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-2xl">高速AI生成</CardTitle>
                <CardDescription className="text-base">
                  Gemini 3 Pro Image Previewによる超高速な画像生成。わずか数秒で完成。
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Palette className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">多彩なカスタマイズ</CardTitle>
                <CardDescription className="text-base">
                  6種類のレイアウト、6つのテイスト、10種類のフォントから自由に選択。
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-2xl">高品質ダウンロード</CardTitle>
                <CardDescription className="text-base">
                  PNG/JPEG形式で、A3、A4、SNS用など用途に応じたサイズで出力可能。
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-purple-600 to-blue-600 border-0 shadow-2xl">
            <CardContent className="p-12 text-center">
              <Sparkles className="h-16 w-16 text-white mx-auto mb-6 animate-pulse" />
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">
                今すぐ無料で始めよう
              </h3>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                クレジットカード不要。数秒で美しいポスターを作成できます。
              </p>
              <Button size="lg" variant="secondary" className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105" asChild>
                <a href="/generate">
                  <Wand2 className="mr-2 h-5 w-5" />
                  無料で作成を開始
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-12 bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">PosterAI</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 PosterAI. Powered by Gemini 3 Pro Image Preview.
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-purple-600 transition-colors">利用規約</a>
              <a href="#" className="hover:text-purple-600 transition-colors">プライバシー</a>
              <a href="#" className="hover:text-purple-600 transition-colors">お問い合わせ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
