import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, AlertTriangle } from "lucide-react"

interface HazardOption {
  value: string
  label: string
  severity: "low" | "medium" | "high" | "critical"
}

interface HazardSelectorProps {
  options: HazardOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  allowMultiple?: boolean
  required?: boolean
  placeholder?: string
  className?: string
}

const severityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

export function HazardSelector({
  options,
  value = [],
  onChange,
  allowMultiple = true,
  required,
  placeholder = "Select hazards...",
  className
}: HazardSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedValue: string) => {
    if (allowMultiple) {
      const newValue = value.includes(selectedValue)
        ? value.filter(v => v !== selectedValue)
        : [...value, selectedValue]
      onChange?.(newValue)
    } else {
      onChange?.([selectedValue])
      setOpen(false)
    }
  }

  const selectedOptions = options.filter(opt => value.includes(opt.value))

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[44px] p-3"
          >
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className={cn("text-xs", severityColors[option.severity])}
                    >
                      {option.label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </div>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search hazards..." />
            <CommandEmpty>No hazards found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{option.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn("ml-2 text-xs", severityColors[option.severity])}
                  >
                    {option.severity}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {required && (
        <p className="text-xs text-muted-foreground mt-1">* Required field</p>
      )}
    </div>
  )
}