import Image from "next/image"
import { Heart, Play } from "lucide-react"
import React from "react"

interface GameSlotCardProps {
  title: string
  provider?: string
  imageSrc: string
  highlighted?: boolean
  onClick?: () => void
}

export default function GameSlotCard({ title, provider, imageSrc, highlighted = false, onClick }: GameSlotCardProps) {
  return (
    <div onClick={onClick} className="group relative h-64 w-56 shrink-0 sm:h-72 sm:w-72 rounded-3xl overflow-hidden cursor-pointer select-none">
        <Image src={imageSrc} alt={title} fill className="object-cover" priority={false} />

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/80" />

      {/* highlight badge */}
      {highlighted && (
        <div className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30">
          <Heart className="h-4 w-4 text-white" fill="white" />
        </div>
      )}
  
      {/* play button appears on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* bottom text */}
      {/* <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="rounded-2xl px-3 py-2 bg-black/30 backdrop-blur-md border border-white/10">
          <div className="text-white font-extrabold leading-tight text-[15px] tracking-wide uppercase line-clamp-2">{title}</div>
          {provider && <div className="text-white/70 text-[11px] mt-0.5">{provider}</div>}
        </div>
      </div> */}

      {/* subtle border glow */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10 group-hover:ring-white/20" />
    </div>
  )
} 