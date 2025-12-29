"use client"

import { useRef, useState } from "react"
import { Upload, X, FileImage, File as FileIcon } from "lucide-react"
import { Button } from "./button"

interface FileUploadProps {
    accept: string
    multiple?: boolean
    maxFiles?: number
    label: string
    description?: string
    onFilesChange: (files: File[]) => void
}

export function FileUpload({
    accept,
    multiple = false,
    maxFiles = 1,
    label,
    description,
    onFilesChange
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return

        const fileArray = Array.from(newFiles).slice(0, multiple ? maxFiles : 1)
        setFiles(fileArray)
        onFilesChange(fileArray)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index)
        setFiles(newFiles)
        onFilesChange(newFiles)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">{label}</label>
                {description && (
                    <span className="text-xs text-muted-foreground">{description}</span>
                )}
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    relative border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all
                    ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                            クリックまたはドラッグ&ドロップ
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {accept.split(',').map(ext => ext.trim().toUpperCase()).join(', ')}
                            {multiple && ` • 最大${maxFiles}ファイル`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ファイルリスト */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                            {file.type.startsWith('image/') ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                    <FileIcon className="h-6 w-6 text-primary" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile(index)
                                }}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
