import * as React from "react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { motion } from "framer-motion"

interface SeveritySliderProps {
  value?: number
  onChange?: (value: number) => void
  label?: string
  min?: number
  max?: number
  marks?: string[]
  className?: string
}

export function SeveritySlider({
  value = 1,
  onChange,
  label = "Risk Level",
  min = 1,
  max = 10,
  marks = ["Low", "Medium", "High", "Critical"],
  className
}: SeveritySliderProps) {
  const getSeverityColor = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100
    if (percentage <= 25) return "text-blue-500 dark:text-blue-400"
    if (percentage <= 50) return "text-yellow-500 dark:text-yellow-400"
    if (percentage <= 75) return "text-orange-500 dark:text-orange-400"
    return "text-red-500 dark:text-red-400"
  }

  const getSeverityLabel = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100
    if (percentage <= 25) return marks[0]
    if (percentage <= 50) return marks[1]
    if (percentage <= 75) return marks[2]
    return marks[3]
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "text-2xl font-bold",
            getSeverityColor(value)
          )}
        >
          {value}
        </motion.div>
      </div>
      
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange?.(vals[0])}
          min={min}
          max={max}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between mt-2">
          {marks.map((mark, index) => (
            <span
              key={mark}
              className={cn(
                "text-xs",
                index === 0 && "text-blue-500 dark:text-blue-400",
                index === 1 && "text-yellow-500 dark:text-yellow-400",
                index === 2 && "text-orange-500 dark:text-orange-400",
                index === 3 && "text-red-500 dark:text-red-400"
              )}
            >
              {mark}
            </span>
          ))}
        </div>
      </div>
      
      <div className={cn(
        "text-sm font-medium px-3 py-1 rounded-full inline-block",
        value <= 3 && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        value > 3 && value <= 5 && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        value > 5 && value <= 7 && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        value > 7 && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      )}>
        {getSeverityLabel(value)} Risk
      </div>
    </div>
  )
}