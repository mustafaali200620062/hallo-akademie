'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden">
      {/* خلفية علم ألمانيا المتحرك */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-black animate-flag-wave" 
             style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600 animate-flag-wave" 
             style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400 animate-flag-wave" 
             style={{ animationDelay: '0.4s' }}></div>
        
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      </div>

      {/* البطاقة */}
      <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 text-center">
        {/* شريط ألوان علم ألمانيا */}
        <div className="flex h-2 rounded-t-lg overflow-hidden -mt-8 -mx-8">
          <div className="w-1/3 bg-black"></div>
          <div className="w-1/3 bg-red-600"></div>
          <div className="w-1/3 bg-yellow-400"></div>
        </div>

        <div className="pt-6">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">غير مصرح</h1>
          <p className="text-gray-600 font-bold mb-6">
            لا تملك الصلاحية للوصول إلى هذه الصفحة
          </p>
          
          <div className="space-y-3">
            {user ? (
              <>
                <p className="text-sm text-gray-500 font-bold">
                  أنت مسجل الدخول كـ: <span className="font-extrabold text-gray-700">
                    {user.email}
                  </span>
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem('user')
                    router.push('/login')
                  }}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  تسجيل خروج
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block w-full py-2 px-4 bg-black hover:bg-gray-800 text-white font-bold rounded-lg transition-colors"
              >
                العودة لتسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flag-wave {
          0% { transform: translateX(-5%) scaleY(1); }
          25% { transform: translateX(2%) scaleY(1.05); }
          50% { transform: translateX(5%) scaleY(1); }
          75% { transform: translateX(-2%) scaleY(0.95); }
          100% { transform: translateX(-5%) scaleY(1); }
        }

        .animate-flag-wave {
          animation: flag-wave 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}