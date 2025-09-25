"use client"

import MinesGame from "@/components/games/mines/MinesGame"

export default function MinesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        <MinesGame />
      </div>
    </div>
  )
}
