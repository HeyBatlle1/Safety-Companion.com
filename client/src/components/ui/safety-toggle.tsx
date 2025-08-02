import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, X, Minus } from "lucide-react"
import { motion } from "framer-motion"

export type ToggleState = "yes" | "no" | "na"

interface SafetyToggleProps {
  value?: ToggleState
  onChange?: (value: ToggleState) => void
  label: string
  icon?: React.ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
}

export function SafetyToggle({
  value = "na",
  onChange,
  label,
  icon,
  required,
  disabled,
  className
}: SafetyToggleProps) {
  const options: { value: ToggleState; icon: React.ReactNode; color: string }[] = [
    { value: "yes", icon: <Check className="w-4 h-4" />, color: "bg-green-500" },
    { value: "no", icon: <X className="w-4 h-4" />, color: "bg-red-500" },
    { value: "na", icon: <Minus className="w-4 h-4" />, color: "bg-gray-400" }
  ]

  return (
    <div className={cn("flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      <div className="flex items-center space-x-3">
        {icon && <div className="text-gray-600 dark:text-gray-400">{icon}</div>}
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              value === option.value
                ? cn(option.color, "text-white shadow-lg")
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.icon}
          </motion.button>
        ))}
      </div>
    </div>
  )
}