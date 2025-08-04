import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ChevronRight, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SafetyCardProps {
  title: string
  description?: string
  children: React.ReactNode
  status?: "pending" | "in-progress" | "completed" | "failed"
  priority?: "low" | "medium" | "high" | "critical"
  expandable?: boolean
  defaultExpanded?: boolean
  className?: string
}

const statusConfig = {
  pending: {
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    label: "Pending"
  },
  "in-progress": {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    label: "In Progress"
  },
  completed: {
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Completed"
  },
  failed: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Failed"
  }
}

const priorityConfig = {
  low: { icon: null, color: "text-gray-500" },
  medium: { icon: null, color: "text-yellow-500" },
  high: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-orange-500" },
  critical: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-500" }
}

export function SafetyCard({
  title,
  description,
  children,
  status = "pending",
  priority = "medium",
  expandable = false,
  defaultExpanded = true,
  className
}: SafetyCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700",
          expandable && "cursor-pointer hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors"
        )}
        onClick={() => expandable && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {priority !== "low" && (
                <span className={priorityConfig[priority].color}>
                  {priorityConfig[priority].icon}
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            </div>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", statusConfig[status].color)}
            >
              {statusConfig[status].label}
            </Badge>
            {expandable && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}