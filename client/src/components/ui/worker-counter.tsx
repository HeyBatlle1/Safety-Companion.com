import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface WorkerCounterProps {
  value?: number
  onChange?: (value: number) => void
  label?: string
  min?: number
  max?: number
  className?: string
}

export function WorkerCounter({
  value = 0,
  onChange,
  label = "Workers Present",
  min = 0,
  max = 50,
  className
}: WorkerCounterProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange?.(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > min) {
      onChange?.(value - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0
    if (newValue >= min && newValue <= max) {
      onChange?.(newValue)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          {label}
        </label>
        <span className="text-xs text-muted-foreground">
          Max: {max}
        </span>
      </div>

      <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-10 w-10"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex-1 mx-4 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <input
                type="number"
                value={value}
                onChange={handleInputChange}
                min={min}
                max={max}
                className="w-full text-center text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Visual indicator bar */}
      <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Safety thresholds */}
      <div className="mt-2 flex justify-between text-xs">
        <span className={cn(
          "font-medium",
          value <= 10 && "text-green-600 dark:text-green-400"
        )}>
          Low Risk (&lt;=10)
        </span>
        <span className={cn(
          "font-medium",
          value > 10 && value <= 25 && "text-yellow-600 dark:text-yellow-400"
        )}>
          Medium (11-25)
        </span>
        <span className={cn(
          "font-medium",
          value > 25 && "text-red-600 dark:text-red-400"
        )}>
          High (&gt;25)
        </span>
      </div>
    </div>
  )
}