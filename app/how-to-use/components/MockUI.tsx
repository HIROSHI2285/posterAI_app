"use client"

import { Upload, Wand2, Image as ImageIcon, Type, Eraser, Download, Save, ArrowLeft, CheckCircle2, ChevronDown, Layers, MousePointer2 } from "lucide-react"

// ==========================================
// Mock 1: Upload Zone
// ==========================================
export function MockUpload() {
    return (
        <div className="w-full h-full bg-[#1a3d2e] rounded-xl border border-white/10 p-6 flex flex-col relative overflow-hidden group shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }} />

            {/* Window Controls */}
            <div className="flex gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/20 box-border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 box-border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 box-border border-green-500/50" />
            </div>

            {/* Main Drop Area */}
            <div className="flex-1 border-2 border-dashed border-white/20 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-4 relative group-hover:border-brand-acid/50 group-hover:bg-brand-acid/5 transition-all duration-500">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-8 h-8 text-green-100 group-hover:text-brand-acid transition-colors" />
                </div>
                <div className="text-center">
                    <p className="text-green-50 font-medium text-lg">画像をドロップ</p>
                    <p className="text-green-200/50 text-sm mt-1">または ファイルを選択</p>
                </div>

                {/* Floating "Files" decoration */}
                <div className="absolute top-10 right-10 w-16 h-20 bg-white/5 border border-white/10 rounded-lg transform rotate-12 blur-[1px]" />
                <div className="absolute bottom-10 left-10 w-24 h-16 bg-white/5 border border-white/10 rounded-lg transform -rotate-6 blur-[1px]" />
            </div>
        </div>
    )
}

// ==========================================
// Mock 2: Generator Sidebar & Settings
// ==========================================
export function MockSidebar() {
    return (
        <div className="w-full h-full bg-[#1a3d2e] rounded-xl border border-white/10 flex overflow-hidden shadow-2xl">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-white/10 bg-black/20 p-4 space-y-4 flex flex-col">
                <div className="h-4 w-1/2 bg-white/10 rounded mb-4" />

                {/* Label & Input */}
                <div className="space-y-1.5">
                    <div className="h-2 w-12 bg-white/20 rounded" />
                    <div className="h-8 w-full bg-white/5 border border-white/10 rounded flex items-center px-2">
                        <div className="h-3 w-3/4 bg-white/10 rounded" />
                    </div>
                </div>

                {/* Dropdowns */}
                <div className="space-y-1.5">
                    <div className="h-2 w-16 bg-white/20 rounded" />
                    <div className="h-8 w-full bg-white/5 border border-white/10 rounded flex items-center justify-between px-2">
                        <div className="h-3 w-1/2 bg-green-200/20 rounded" />
                        <ChevronDown className="w-3 h-3 text-white/20" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="h-2 w-20 bg-white/20 rounded" />
                    <div className="h-8 w-full bg-white/5 border border-white/10 rounded flex items-center justify-between px-2">
                        <div className="h-3 w-1/3 bg-green-200/20 rounded" />
                        <ChevronDown className="w-3 h-3 text-white/20" />
                    </div>
                </div>

                <div className="flex-1" />
                {/* Generate Button */}
                <div className="h-10 w-full bg-brand-acid rounded flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] animate-pulse-slow">
                    <Wand2 className="w-4 h-4 text-brand-black" />
                    <div className="h-3 w-16 bg-brand-black/20 rounded" />
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-[#152e24] relative p-6 flex items-center justify-center">
                {/* Progress Circle (Abstract) */}
                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-acid/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-acid border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-brand-acid font-bold">
                        AI
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2">
                    <div className="w-20 h-24 bg-white/5 rounded border border-white/10" />
                    <div className="w-20 h-24 bg-white/5 rounded border border-white/10" />
                </div>
            </div>
        </div>
    )
}

// ==========================================
// Mock 3: Editor Canvas
// ==========================================
export function MockEditor() {
    return (
        <div className="w-full h-full bg-[#1a3d2e] rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
            {/* Toolbar */}
            <div className="h-10 border-b border-white/10 bg-black/20 flex items-center px-4 justify-between">
                <ArrowLeft className="w-4 h-4 text-white/50" />
                <div className="flex gap-4">
                    <Save className="w-4 h-4 text-white/50" />
                    <Download className="w-4 h-4 text-brand-acid" />
                </div>
            </div>

            <div className="flex-1 flex relative">
                {/* Canvas Area */}
                <div className="flex-1 bg-[#0f241c] relative flex items-center justify-center p-8 overflow-hidden">
                    {/* The "Poster" Blueprint */}
                    <div className="aspect-[3/4] h-full bg-white/5 border border-brand-acid/30 relative backdrop-blur-sm group">
                        {/* Header Block */}
                        <div className="absolute top-[10%] left-[10%] right-[10%] h-[15%] bg-white/5 border border-dashed border-white/20 rounded flex items-center justify-center">
                            <Type className="w-6 h-6 text-white/20" />
                        </div>
                        {/* Image Block */}
                        <div className="absolute top-[30%] left-[10%] right-[10%] h-[40%] bg-brand-acid/5 border border-brand-acid/20 rounded flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-acid/10 to-transparent opacity-50" />
                            <ImageIcon className="w-8 h-8 text-brand-acid/50" />

                            {/* Selection Rect (Active Edit) */}
                            <div className="absolute top-4 left-4 right-12 bottom-8 border-2 border-brand-acid bg-brand-acid/10 rounded flex items-start justify-end p-1 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                                <div className="w-2 h-2 bg-brand-acid rounded-full translate-x-1/2 -translate-y-1/2" />
                                <div className="w-2 h-2 bg-brand-acid rounded-full translate-x-1/2 translate-y-full absolute bottom-0 right-0" />
                            </div>
                        </div>
                        {/* Footer Block */}
                        <div className="absolute bottom-[10%] left-[10%] right-[10%] h-[10%] bg-white/5 border border-dashed border-white/20 rounded" />

                        {/* Cursor */}
                        <MousePointer2 className="absolute top-[45%] right-[25%] w-6 h-6 text-brand-acid fill-brand-acid drop-shadow-lg transform -rotate-12" />
                    </div>
                </div>

                {/* Right Panel (Tools) */}
                <div className="w-14 border-l border-white/10 bg-black/20 flex flex-col items-center py-4 gap-6">
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded bg-brand-acid flex items-center justify-center text-brand-black shadow-[0_0_10px_rgba(204,255,0,0.4)] cursor-pointer">
                        <MousePointer2 className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer">
                        <Type className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer">
                        <Eraser className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    )
}
