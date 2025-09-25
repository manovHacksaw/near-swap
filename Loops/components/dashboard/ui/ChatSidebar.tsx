"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Send, MessageSquare, Wifi, WifiOff, Users, AlertCircle } from "lucide-react"

interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: number
  type: 'message' | 'system' | 'userJoined' | 'userLeft'
  isOwn?: boolean
}

interface WebSocketMessage {
  type: 'message' | 'userJoined' | 'userLeft' | 'joined' | 'error' | 'pong'
  username?: string
  message?: string
  timestamp?: number
}

interface OnlineUser {
  username: string
  timestamp: number
}

export default function ChatSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isJoining, setIsJoining] = useState<boolean>(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [error, setError] = useState<string>("")
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // WebSocket URL - adjust this to match your backend URL
  const WS_URL = 'wss://loops-chat-ws.kaushiksamadder2003.workers.dev/chat'

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages],
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [sortedMessages.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
    }
  }, [])

  // Generate a random username if none provided
  useEffect(() => {
    if (!username) {
      const randomUsername = `Player${Math.floor(Math.random() * 10000)}`
      setUsername(randomUsername)
    }
  }, [username])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')
    setError("")

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        setError("")

        // Join the chat with username
        if (username) {
          ws.send(JSON.stringify({ type: 'join', username }))
          setIsJoining(true)
        }

        // Start ping interval for connection health
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Ping every 30 seconds
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)

          switch (data.type) {
            case 'joined':
              setIsJoining(false)
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                username: 'System',
                message: data.message || `Welcome ${data.username}!`,
                timestamp: data.timestamp || Date.now(),
                type: 'system',
                isOwn: false
              }])
              break

            case 'message':
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                username: data.username === username ? 'You' : data.username || 'Unknown',
                message: data.message || '',
                timestamp: data.timestamp || Date.now(),
                type: 'message',
                isOwn: data.username === username
              }])
              break

            case 'userJoined':
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                username: 'System',
                message: `${data.username} joined the chat`,
                timestamp: data.timestamp || Date.now(),
                type: 'userJoined',
                isOwn: false
              }])
              break

            case 'userLeft':
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                username: 'System',
                message: `${data.username} left the chat`,
                timestamp: data.timestamp || Date.now(),
                type: 'userLeft',
                isOwn: false
              }])
              break

            case 'error':
              setError(data.message || 'An error occurred')
              setIsJoining(false)
              break

            case 'pong':
              // Connection is healthy
              break
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        setIsJoining(false)

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Connection error. Retrying...')
        setConnectionStatus('disconnected')
      }

    } catch (err) {
      console.error('Failed to connect to WebSocket:', err)
      setError('Failed to connect to chat server')
      setConnectionStatus('disconnected')
    }
  }, [username])

  // Connect when component mounts or username changes
  useEffect(() => {
    if (username && username !== '') {
      connectWebSocket()
    }
  }, [username, connectWebSocket])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    try {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message: trimmed
      }))
      setInput("")
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getMessageStyle = (message: ChatMessage) => {
    // System messages (join/leave notifications)
    if (message.type === 'system' || message.type === 'userJoined' || message.type === 'userLeft') {
      return {
        container: "bg-blue-500/20 border-blue-500/30 mx-4",
        alignment: "text-center"
      }
    }

    // User's own messages (right-aligned, different color)
    if (message.isOwn) {
      return {
        container: "bg-green-500/80 border-green-600 text-black ml-8",
        alignment: "text-right"
      }
    }

    // Other users' messages (left-aligned, default styling)
    return {
      container: "bg-secondary/40 border-border mr-8",
      alignment: "text-left"
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 bottom-0 z-40 w-80 h-full border-l border-border bg-background/70 backdrop-blur rounded-l-3xl flex flex-col",
      )}
      aria-label="All Chat sidebar"
    >
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
          <MessageSquare className="h-4 w-4 opacity-80" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">All Chat</span>
            {getConnectionIcon()}
          </div>
          <div className="text-xs text-foreground/60">
            {isConnected ? `Connected as ${username}` : 'Connecting...'}
          </div>
        </div>
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-foreground/60">
            <Users className="h-3 w-3" />
            {onlineUsers.length}
          </div>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-500/20 border-b border-red-500/30">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedMessages.map((m) => {
          const style = getMessageStyle(m)
          return (
            <div key={m.id} className={cn(
              "rounded-xl border p-3 max-w-[85%]",
              style.container,
              style.alignment
            )}>
              {/* Only show username for non-system messages */}
              {(m.type === 'message') && (
                <div className={cn(
                  "flex items-center justify-between mb-1",
                  m.isOwn ? "flex-row-reverse" : "flex-row"
                )}>
                  <span className={cn(
                    "text-xs font-medium",
                    m.isOwn ? "text-black" : "text-foreground/80"
                  )}>
                    {m.username}
                  </span>
                  <span className={cn(
                    "text-[10px]",
                    m.isOwn ? "text-black/60" : "text-foreground/50"
                  )}>
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className={cn(
                "text-sm whitespace-pre-wrap break-words",
                m.isOwn ? "text-black" : "text-foreground/90"
              )}>
                {m.message}
              </div>
            </div>
          )
        })}

        {isJoining && (
          <div className="text-center text-xs text-foreground/60 py-2">
            Joining chat...
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        {isConnected ? (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 h-10 rounded-xl bg-background/60 border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              disabled={isJoining}
            />
            <Button
              size="sm"
              className="h-10 px-3"
              onClick={handleSend}
              disabled={isJoining || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-xs text-foreground/60 py-2">
            {connectionStatus === 'connecting' ? 'Connecting to chat...' : 'Disconnected'}
          </div>
        )}
      </div>
    </aside>
  )
}