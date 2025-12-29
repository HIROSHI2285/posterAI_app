"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, RefreshCw, ImageIcon } from "lucide-react"

interface PosterPreviewProps {
    imageUrl?: string
    isGenerating: boolean
    onRegenerate?: () => void
}

export function PosterPreview({ imageUrl, isGenerating, onRegenerate }: PosterPreviewProps) {
    const handleDownload = () => {
        if (!imageUrl) return

        const link = document.createElement("a")
        link.href = imageUrl
        link.download = `poster-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Card className="border border-gray-300 bg-white">
            <CardHeader className="py-3 px-4 rounded-t-lg" style={{ backgroundColor: '#48a772', color: 'white' }}>
                <CardTitle className="text-base font-semibold">プレビュー</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center min-h-[550px] bg-gray-50 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-sm text-muted-foreground">画像を生成中...</p>
                    </div>
                ) : imageUrl ? (
                    <div className="space-y-3">
                        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                            <img
                                src={imageUrl}
                                alt="Generated poster"
                                className="w-full h-auto"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={onRegenerate}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                再生成
                            </Button>
                            <Button
                                onClick={handleDownload}
                                variant="default"
                                size="sm"
                                className="flex-1"
                                style={{ backgroundColor: '#48a772', color: 'white' }}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                ダウンロード
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[550px] bg-gray-50 rounded-lg">
                        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">プレビューはここに表示されます</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
