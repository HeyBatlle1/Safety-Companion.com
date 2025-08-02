import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  segments?: { label: string; value: number }[]
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  segments,
  className
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const isComplete = percentage === 100

  const getProgressColor = () => {
    if (percentage < 25) return "from-red-400 to-red-600"
    if (percentage < 50) return "from-orange-400 to-orange-600"
    if (percentage < 75) return "from-yellow-400 to-yellow-600"
    if (percentage < 100) return "from-blue-400 to-blue-600"
    return "from-green-400 to-green-600"
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2">
            {showPercentage && (
              <motion.span
                key={percentage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-bold text-gray-900 dark:text-gray-100"
              >
                {Math.round(percentage)}%
              </motion.span>
            )}
            {isComplete && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </motion.div>
            )}
          </div>
        </div>
      )}

      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 bg-gradient-to-r rounded-full",
            getProgressColor()
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Segments overlay */}
        {segments && segments.length > 0 && (
          <div className="absolute inset-0 flex">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 border-r border-white dark:border-gray-800"
                style={{ width: `${(segment.value / max) * 100}%` }}
              >
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {segment.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {segments && <div className="h-4" />} {/* Spacer for segment labels */}
    </div>
  )
}