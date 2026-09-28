'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/register/student')
  }, [router])

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-black"></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600"></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400"></div>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 text-center">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-20 w-auto object-contain mx-auto mb-4 animate-pulse"
        />
        <p className="text-white text-lg font-extrabold">
          جاري التحويل...
        </p>
        <div className="mt-4 flex justify-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
        </div>
      </div>
    </div>
  )
}