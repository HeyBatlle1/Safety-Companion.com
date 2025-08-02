import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PhotoUploadProps {
  value?: string[]
  onChange?: (value: string[]) => void
  label?: string
  maxPhotos?: number
  compressForMobile?: boolean
  className?: string
}

export function PhotoUpload({
  value = [],
  onChange,
  label = "Add Photos",
  maxPhotos = 3,
  compressForMobile = true,
  className
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const newPhotos: string[] = []
      
      for (const file of files) {
        if (value.length + newPhotos.length >= maxPhotos) break
        
        // Convert to base64
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        
        newPhotos.push(base64)
      }

      onChange?.([...value, ...newPhotos])
    } catch (error) {
      // Error handling
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = value.filter((_, i) => i !== index)
    onChange?.(newPhotos)
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxPhotos} photos
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence>
          {value.map((photo, index) => (
            <motion.div
              key={photo}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {value.length < maxPhotos && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="aspect-square"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Add Photo
                    </span>
                  </>
                )}
              </div>
            </Button>
          </motion.div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        capture="environment"
      />

      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Upload className="h-3 w-3" />
        <span>Tap to upload or take photo</span>
      </div>
    </div>
  )
}