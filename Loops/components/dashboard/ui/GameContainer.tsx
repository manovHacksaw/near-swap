"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GameContainerProps {
  children: React.ReactNode
  scrollable?: boolean
}

export default function GameContainer({ children, scrollable = true }: GameContainerProps) {
  return (
    <div className="flex-1 h-full">
      <Card
        className={cn(
          "w-full h-full bg-transparent rounded-none shadow-none p-0 gap-0 border-0",
          scrollable ? "overflow-y-auto no-scrollbar" : "overflow-y-hidden",
          "overflow-x-auto",
        )}
      >
                 <div className="h-full w-full">{children}</div>
      </Card>
    </div>
  )
}
