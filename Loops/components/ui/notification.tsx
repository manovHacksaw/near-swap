"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"

export type NotificationType = "success" | "error" | "warning" | "info"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id">) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationItem({ notification, onRemove }: { notification: Notification, onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-600/20 border-green-500/30"
      case "error":
        return "bg-red-600/20 border-red-500/30"
      case "warning":
        return "bg-yellow-600/20 border-yellow-500/30"
      case "info":
        return "bg-blue-600/20 border-blue-500/30"
    }
  }

  return (
    <div
      className={`
        ${getBgColor()}
        border rounded-xl p-4 backdrop-blur-md
        transform transition-all duration-300 ease-in-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm">
            {notification.title}
          </h4>
          <p className="text-white/80 text-sm mt-1">
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-white/90 hover:text-white text-sm underline mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Helper functions for common notifications
export const notify = {
  success: (title: string, message: string, options?: Partial<Notification>) => {
    const { addNotification } = useNotifications()
    addNotification({ type: "success", title, message, ...options })
  },
  
  error: (title: string, message: string, options?: Partial<Notification>) => {
    const { addNotification } = useNotifications()
    addNotification({ type: "error", title, message, ...options })
  },
  
  warning: (title: string, message: string, options?: Partial<Notification>) => {
    const { addNotification } = useNotifications()
    addNotification({ type: "warning", title, message, ...options })
  },
  
  info: (title: string, message: string, options?: Partial<Notification>) => {
    const { addNotification } = useNotifications()
    addNotification({ type: "info", title, message, ...options })
  }
}
