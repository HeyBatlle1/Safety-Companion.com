import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const toast = React.useCallback((props: ToastProps) => {
    // Simple console logging for now - you can integrate with a proper toast system later
    const type = props.variant === "destructive" ? "error" : "info"
    console.log(`[${type.toUpperCase()}] ${props.title}: ${props.description}`)
    
    // You can also integrate with your existing ToastContainer here
    // For now, we'll just use browser notifications if available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(props.title || "Notification", {
        body: props.description,
        icon: "/favicon.ico"
      })
    }
  }, [])

  return { toast }
}