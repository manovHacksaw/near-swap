"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface LoadingScreenProps {
    className?: string
}

export default function LoadingScreen({ className = "" }: LoadingScreenProps) {
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])
    if(isLoading) return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black ${className}`}>
            <div className="relative w-64 h-64 animate-bounce">
                <Image
                    src="/loading.gif"
                    alt="Loading..."
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                />
            </div>
        </div>
    )
}