import Image from 'next/image'
import { cn } from "@/lib/utils"

interface BrowserFrameProps {
    src: string
    alt: string
    className?: string
    priority?: boolean
}

export function BrowserFrame({ src, alt, className, priority = false }: BrowserFrameProps) {
    return (
        <div className={cn("rounded-xl overflow-hidden border border-white/10 bg-[#0f1014] shadow-2xl", className)}>
            {/* Browser Toolbar */}
            <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                {/* Fake URL Bar */}
                <div className="ml-4 flex-1 max-w-sm h-5 bg-black/20 rounded-md border border-white/5 flex items-center px-3 text-[10px] text-white/30 font-medium font-mono">
                    posterai.app/generate
                </div>
            </div>

            {/* Screenshot Content */}
            <div className="relative aspect-[16/10] w-full bg-black/40">
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover"
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, 80vw"
                />
            </div>
        </div>
    )
}
