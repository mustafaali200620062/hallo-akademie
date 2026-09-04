'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()

        if (profileRes.ok) {
          setProfile(profileData)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
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

      {/* المحتوى */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white/95 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20 text-center">
          <div className="flex h-2 rounded-t-lg overflow-hidden -mt-10 -mx-10">
            <div className="w-1/3 bg-black"></div>
            <div className="w-1/3 bg-red-600"></div>
            <div className="w-1/3 bg-yellow-400"></div>
          </div>

          <div className="pt-8">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Logo" className="h-28 w-auto object-contain" />
            </div>

            <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Hallöchen Akademie
            </h1>
            <p className="text-xl font-bold text-gray-600 mb-8">
              منصة تعليم اللغة الألمانية
            </p>

            {user ? (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <p className="text-lg font-bold text-gray-700">
                    مرحبا بك <span className="font-extrabold text-gray-900 text-xl">{profile?.full_name || user.name || user.email}</span>
                  </p>
                  <p className="text-md font-bold text-gray-500 mt-1">
                    الدور: <span className="font-extrabold text-black">{profile?.role_name || user?.role || 'غير محدد'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  {(profile?.role_name === 'Eigentümer' || user?.role === 'Eigentümer') && (
                    <Link href="/eigentuemer" className="px-8 py-3 bg-black text-white text-lg font-extrabold rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      لوحة المالك
                    </Link>
                  )}
                  {(profile?.role_name === 'Lehrer' || user?.role === 'Lehrer') && (
                    <Link href="/lehrer" className="px-8 py-3 bg-red-600 text-white text-lg font-extrabold rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      لوحة المدرس
                    </Link>
                  )}
                  {(profile?.role_name === 'Assistent' || user?.role === 'Assistent') && (
                    <Link href="/assistent" className="px-8 py-3 bg-yellow-400 text-black text-lg font-extrabold rounded-xl hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      لوحة المساعد
                    </Link>
                  )}
                  {(profile?.role_name === 'Student' || user?.role === 'Student') && (
                    <Link href="/student" className="px-8 py-3 bg-blue-600 text-white text-lg font-extrabold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      لوحة الطالب
                    </Link>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-lg font-extrabold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  تسجيل خروج
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                  <Link href="/login" className="px-8 py-4 bg-black text-white text-xl font-extrabold rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    تسجيل الدخول
                  </Link>
                  <Link href="/register/student" className="px-8 py-4 bg-red-600 text-white text-xl font-extrabold rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    تسجيل طالب جديد
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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