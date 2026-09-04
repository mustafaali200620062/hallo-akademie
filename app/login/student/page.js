'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ في تسجيل الدخول')
      }

      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.phone + '@student.com',
        role: 'Student',
        level_id: data.user.level_id,
        phone: data.user.phone
      }))

      setSuccess(true)

      setTimeout(() => {
        router.push('/student')
      }, 500)

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-black animate-flag-wave" 
             style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600 animate-flag-wave" 
             style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400 animate-flag-wave" 
             style={{ animationDelay: '0.4s' }}></div>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="flex h-2 rounded-t-lg overflow-hidden -mt-8 -mx-8">
          <div className="w-1/3 bg-black"></div>
          <div className="w-1/3 bg-red-600"></div>
          <div className="w-1/3 bg-yellow-400"></div>
        </div>

        <div className="pt-4">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Hallöchen Akademie</h2>
          <div className="text-center mt-2">
            <span className="inline-block bg-black text-white text-xs px-3 py-1 rounded-full font-extrabold">
              تسجيل الدخول للطلاب
            </span>
          </div>
          <p className="mt-2 text-center text-sm font-bold text-gray-600">سجل دخول برقم الهاتف</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              ✅ تم تسجيل الدخول بنجاح! جاري التحويل...
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700">رقم الهاتف</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 font-bold"
              placeholder="+201234567890"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-extrabold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/register/student" className="text-sm text-black hover:text-red-600 font-extrabold">
            ليس لديك حساب؟ سجل الآن
          </a>
          <span className="mx-2 text-gray-300">|</span>
          <a href="/login" className="text-sm text-black hover:text-red-600 font-extrabold">
            تسجيل الدخول للإدارة
          </a>
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