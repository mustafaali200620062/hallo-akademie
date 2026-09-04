'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ في تسجيل الدخول')
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      setSuccess(true)

      setTimeout(() => {
        if (data.user.role === 'Eigentümer') {
          window.location.href = '/eigentuemer'
        } else if (data.user.role === 'Lehrer') {
          window.location.href = '/lehrer'
        } else if (data.user.role === 'Assistent') {
          window.location.href = '/assistent'
        } else if (data.user.role === 'Student') {
          window.location.href = '/student'
        } else {
          window.location.href = '/'
        }
      }, 800)

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-custom">
      {/* خلفية الصورة مع زووم بطيء */}
      <div className="absolute inset-0 w-full h-full">
        <div 
          className="absolute inset-0 w-full h-full bg-custom animate-slow-zoom"
        ></div>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      {/* البطاقة الشفافة */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* شريط ألوان علم ألمانيا */}
          <div className="flex h-1 rounded-t-lg overflow-hidden -mt-8 -mx-8 mb-6">
            <div className="w-1/3 bg-black"></div>
            <div className="w-1/3 bg-red-600"></div>
            <div className="w-1/3 bg-yellow-400"></div>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Hallöchen Akademie</h2>
            <p className="text-white/70 font-medium mt-1">تسجيل الدخول للإدارة</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-xl text-sm font-bold backdrop-blur-sm">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-white px-4 py-3 rounded-xl text-sm font-bold backdrop-blur-sm">
                ✅ تم تسجيل الدخول بنجاح! جاري التحويل...
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-white/80 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white/80 mb-1">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-white/60 hover:text-yellow-400 font-bold transition-colors">
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-extrabold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/25 disabled:opacity-50"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول →'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/50 font-bold">أو سجل باستخدام</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            تسجيل الدخول بـ Google
          </button>

          <div className="text-center mt-6">
            <p className="text-white/60 font-medium">
              ليس لديك حساب؟{' '}
              <Link href="/register/student" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
                سجل الآن
              </Link>
            </p>
          </div>

          <div className="text-center mt-4">
            <Link href="/login/student" className="text-sm text-white/50 hover:text-yellow-400 font-bold transition-colors">
              👨‍🎓 تسجيل دخول الطلاب (برقم الهاتف)
            </Link>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}