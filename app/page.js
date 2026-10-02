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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-6 md:py-12 px-3 md:px-4 overflow-hidden safe-top">

      {/* ═══ خلفية علم ألمانيا المتحركة ═══ */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-black md:animate-flag-wave" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600 md:animate-flag-wave" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400 md:animate-flag-wave" style={{ animationDelay: '0.4s' }}></div>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      </div>

      {/* ═══ البطاقة الشفافة ═══ */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 md:p-8">

          {/* شريط ألوان علم ألمانيا */}
          <div className="flex h-1 rounded-t-lg overflow-hidden -mt-5 md:-mt-8 -mx-5 md:-mx-8 mb-5 md:mb-6">
            <div className="w-1/3 bg-black"></div>
            <div className="w-1/3 bg-red-600"></div>
            <div className="w-1/3 bg-yellow-400"></div>
          </div>

          {/* ═══ Header ═══ */}
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center mb-3 md:mb-4">
              <img src="/logo.png" alt="Logo" className="h-20 md:h-28 w-auto object-contain" />
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2 md:mb-3 tracking-tight">
              Hallöchen Akademie
            </h1>
            <p className="text-sm md:text-lg font-bold text-white/70">
              منصة تعليم اللغة الألمانية
            </p>
          </div>

          {/* ═══ Content ═══ */}
          {user ? (
            <div className="space-y-4 md:space-y-5">

              {/* ترحيب */}
              <div className="bg-white/10 rounded-xl p-4 md:p-5 border border-white/20 backdrop-blur-sm">
                <p className="text-sm md:text-lg font-bold text-white/90 text-center">
                  مرحبا بك <span className="font-extrabold text-white text-base md:text-xl">
                    {profile?.full_name || user.name || user.email}
                  </span>
                </p>
                <p className="text-xs md:text-base font-bold text-white/60 mt-1 text-center">
                  الدور: <span className="font-extrabold text-white">
                    {profile?.role_name || user?.role || 'غير محدد'}
                  </span>
                </p>
              </div>

              {/* أزرار اللوحات حسب الدور */}
              <div className="flex flex-col gap-2 md:gap-3">
                {(profile?.role_name === 'Eigentümer' || user?.role === 'Eigentümer') && (
                  <Link
                    href="/eigentuemer"
                    className="w-full py-3.5 md:py-4 bg-black text-white text-base md:text-lg font-extrabold rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center btn-app"
                  >
                    👑 لوحة المالك
                  </Link>
                )}
                {(profile?.role_name === 'Lehrer' || user?.role === 'Lehrer') && (
                  <Link
                    href="/lehrer"
                    className="w-full py-3.5 md:py-4 bg-red-600 text-white text-base md:text-lg font-extrabold rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center btn-app"
                  >
                    👨‍🏫 لوحة المدرس
                  </Link>
                )}
                {(profile?.role_name === 'Assistent' || user?.role === 'Assistent') && (
                  <Link
                    href="/assistent"
                    className="w-full py-3.5 md:py-4 bg-yellow-400 text-black text-base md:text-lg font-extrabold rounded-xl hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center btn-app"
                  >
                    🤝 لوحة المساعد
                  </Link>
                )}
                {(profile?.role_name === 'Student' || user?.role === 'Student') && (
                  <Link
                    href="/student"
                    className="w-full py-3.5 md:py-4 bg-green-600 text-white text-base md:text-lg font-extrabold rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center btn-app"
                  >
                    👨‍🎓 لوحة الطالب
                  </Link>
                )}
              </div>

              {/* زر الخروج */}
              <button
                onClick={handleLogout}
                className="w-full py-3 md:py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm md:text-base font-extrabold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
              >
                🚪 تسجيل خروج
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <Link
                href="/login"
                className="block w-full py-3.5 md:py-4 bg-black text-white text-base md:text-xl font-extrabold rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center btn-app"
              >
                🔑 تسجيل الدخول
              </Link>
              <Link
                href="/register/student"
                className="block w-full py-3.5 md:py-4 bg-red-600 text-white text-base md:text-xl font-extrabold rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center btn-app"
              >
                📝 تسجيل طالب جديد
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Animations ═══ */}
      <style jsx>{`
        @keyframes flag-wave {
          0% { transform: translateX(-5%) scaleY(1); }
          25% { transform: translateX(2%) scaleY(1.05); }
          50% { transform: translateX(5%) scaleY(1); }
          75% { transform: translateX(-2%) scaleY(0.95); }
          100% { transform: translateX(-5%) scaleY(1); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-flag-wave {
          animation: flag-wave 6s ease-in-out infinite;
        }

        .fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}