"use client"

import React, { createContext, useContext, useState, useMemo } from "react"

export type SidebarSection =
  | "home"
  | "duel-poker"
  | "scratchcards"
  | "crash"
  | "blackjack"
  | "live"
  | "slots"
  | "sports"
  | "stats"
  | "docs"
  | "support"
  | "affiliates"
  | string

export type UIMode = "casino" | "nearmarket"

interface UIContextValue {
  selectedSection: SidebarSection
  setSelectedSection: (s: SidebarSection) => void
  mode: UIMode
  setMode: (m: UIMode) => void
}

const UIContext = createContext<UIContextValue | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [selectedSection, setSelectedSection] = useState<SidebarSection>("home")
  const [mode, setMode] = useState<UIMode>("casino")

  const value = useMemo(
    () => ({ selectedSection, setSelectedSection, mode, setMode }),
    [selectedSection, mode],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error("useUI must be used within a UIProvider")
  return ctx
} 