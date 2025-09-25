"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white",
          "bg-gradient-to-r from-[#6b21a8] via-[#a855f7] to-[#6b21a8]",
          "shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          className,
        )}
      >
        {/* Subtle glow */}
        <span className="absolute inset-0 rounded-full bg-white/10 blur-[2px]" aria-hidden="true" />

        {/* Shimmer glint */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <span className="absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 animate-[shimmerSlide_2.2s_ease_infinite]" />
        </span>

        <span className="relative z-10 flex items-center gap-2">{children}</span>

        <style jsx>{`
          @keyframes shimmerSlide {
            0% { transform: translateX(0); opacity: 0; }
            10% { opacity: .25; }
            50% { transform: translateX(300%); opacity: .35; }
            90% { opacity: .15; }
            100% { transform: translateX(300%); opacity: 0; }
          }
        `}</style>
      </button>
    )
  },
)

ShimmerButton.displayName = "ShimmerButton"

export { ShimmerButton } 