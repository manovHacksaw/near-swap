import React from "react"
import clsx from "clsx"

interface NeonGradientCardProps {
  className?: string
  children: React.ReactNode
}

/**
 * NeonGradientCard renders a container with a subtle animated neon gradient border.
 * Place arbitrary children inside the card body.
 */
export default function NeonGradientCard({ className, children }: NeonGradientCardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl p-[1px]",
        "bg-[radial-gradient(1200px_circle_at_var(--x,50%)_var(--y,50%),rgba(99,102,241,0.35),transparent_40%),linear-gradient(135deg,rgba(99,102,241,0.35),rgba(236,72,153,0.35))]",
        "transition-[--x,--y] duration-200 ease-out",
        className
      )}
      onMouseMove={(e) => {
        const target = e.currentTarget as HTMLDivElement
        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        target.style.setProperty("--x", `${x}px`)
        target.style.setProperty("--y", `${y}px`)
      }}
    >
      <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
        {children}
      </div>
    </div>
  )
} 