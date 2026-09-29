'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterStudentPage() {
  const router = useRouter()
  const [step, setStep] = useState('phone')
  const [mode, setMode] = useState('register')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [level, setLevel] = useState('A1')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
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

      setMessage('✅ تم تسجيل الدخول بنجاح! جاري التحويل...')

      setTimeout(() => {
        router.push('/student')
      }, 500)

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      setLoading(false)
      return
    }

    try {
      const checkRes = await fetch(`/api/check-phone?phone=${encodeURIComponent(phone)}`)
      const checkData = await checkRes.json()

      if (checkRes.ok && checkData.exists) {
        setError('رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول.')
        setLoading(false)
        return
      }

      const registerRes = await fetch('/api/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          full_name: fullName,
          level,
          password
        })
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerData.error || 'حدث خطأ')
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      localStorage.setItem('temp_otp', generatedOtp)
      localStorage.setItem('temp_phone', phone)

      setMessage(`تم إرسال الكود: ${generatedOtp}`)
      setStep('otp')

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const savedOtp = localStorage.getItem('temp_otp')
      const savedPhone = localStorage.getItem('temp_phone')

      if (!savedOtp || !savedPhone) {
        setError('انتهت صلاحية الكود، يرجى المحاولة مرة أخرى')
        setStep('phone')
        setLoading(false)
        return
      }

      if (otp !== savedOtp) {
        setError('الكود غير صحيح')
        setLoading(false)
        return
      }

      if (phone !== savedPhone) {
        setError('رقم الهاتف غير مطابق')
        setLoading(false)
        return
      }

      const confirmRes = await fetch('/api/confirm-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          full_name: fullName,
          level,
          password
        })
      })

      const confirmData = await confirmRes.json()

      if (!confirmRes.ok) {
        throw new Error(confirmData.error || 'حدث خطأ')
      }

      localStorage.removeItem('temp_otp')
      localStorage.removeItem('temp_phone')

      setStep('wait')
      setMessage('✅ تم تأكيد رقم الهاتف! في انتظار قبول المدير...')

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-6 md:py-12 px-3 md:px-4 overflow-hidden safe-top">

      {/* ═══ خلفية علم ألمانيا ═══ */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-black md:animate-flag-wave" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600 md:animate-flag-wave" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400 md:animate-flag-wave" style={{ animationDelay: '0.4s' }}></div>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      </div>

      {/* ═══ البطاقة ═══ */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 md:p-8">

          {/* شريط ألوان العلم */}
          <div className="flex h-1 rounded-t-lg overflow-hidden -mt-5 md:-mt-8 -mx-5 md:-mx-8 mb-5 md:mb-6">
            <div className="w-1/3 bg-black"></div>
            <div className="w-1/3 bg-red-600"></div>
            <div className="w-1/3 bg-yellow-400"></div>
          </div>

          {/* ═══ Header ═══ */}
          <div className="text-center mb-5 md:mb-8">
            <div className="flex justify-center mb-3 md:mb-4">
              <img src="/logo.png" alt="Logo" className="h-14 md:h-16 w-auto object-contain" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Hallöchen Akademie</h2>
            <p className="text-white/70 font-bold mt-1 text-sm md:text-base">
              {mode === 'login' ? 'تسجيل دخول الطالب' : 'تسجيل طالب جديد'}
            </p>
          </div>

          {/* ═══ Mode Switcher ═══ */}
          <div className="flex gap-2 md:gap-3 mb-5 md:mb-6">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 md:py-2 rounded-xl font-extrabold text-xs md:text-sm transition-all active:scale-95 ${
                mode === 'register'
                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/25'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/20'
              }`}
            >
              📝 تسجيل جديد
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 md:py-2 rounded-xl font-extrabold text-xs md:text-sm transition-all active:scale-95 ${
                mode === 'login'
                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/25'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/20'
              }`}
            >
              🔑 تسجيل دخول
            </button>
          </div>

          {/* ═══ Error / Message ═══ */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold backdrop-blur-sm mb-4 fade-in-up">
              ❌ {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/20 border border-green-500/50 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold backdrop-blur-sm mb-4 fade-in-up">
              {message}
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* وضع تسجيل الدخول */}
          {/* ═══════════════════════════════════════════ */}
          {mode === 'login' && (
            <form className="space-y-4 md:space-y-5" onSubmit={handleStudentLogin}>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="+201234567890"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg md:text-xl active:scale-90 transition-transform"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 md:py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-extrabold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-500/25 disabled:opacity-50 btn-app"
              >
                {loading ? 'جاري تسجيل الدخول...' : '🔑 تسجيل الدخول'}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs md:text-sm text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                >
                  ليس لديك حساب؟ سجل الآن
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* التسجيل — خطوة البيانات */}
          {/* ═══════════════════════════════════════════ */}
          {mode === 'register' && step === 'phone' && (
            <form className="space-y-3.5 md:space-y-4" onSubmit={sendOtp}>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="أحمد محمد"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="+201234567890"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  المستوى
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                >
                  <option value="A1" className="text-black">A1 - مبتدئ</option>
                  <option value="A2" className="text-black">A2 - أساسي</option>
                  <option value="B1" className="text-black">B1 - متوسط</option>
                  <option value="B2" className="text-black">B2 - فوق متوسط</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="6 أحرف على الأقل"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg md:text-xl active:scale-90 transition-transform"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-[11px] md:text-xs text-red-400 font-bold mt-1">⚠️ 6 أحرف على الأقل</p>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="أعد كتابة كلمة المرور"
                  dir="ltr"
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[11px] md:text-xs text-red-400 font-bold mt-1">⚠️ كلمتا المرور غير متطابقتين</p>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && password.length >= 6 && (
                  <p className="text-[11px] md:text-xs text-green-400 font-bold mt-1">✅ متطابقتان</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 md:py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-extrabold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-500/25 disabled:opacity-50 btn-app"
              >
                {loading ? 'جاري الإرسال...' : '📱 إرسال كود التحقق'}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs md:text-sm text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                >
                  لديك حساب بالفعل؟ سجل دخول
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* OTP */}
          {/* ═══════════════════════════════════════════ */}
          {mode === 'register' && step === 'otp' && (
            <form className="space-y-4 md:space-y-5" onSubmit={verifyOtp}>

              <div>
                <label className="block text-xs md:text-sm font-bold text-white/80 mb-1.5">
                  كود التحقق
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3.5 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 font-medium text-center text-xl md:text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="_ _ _ _ _ _"
                  dir="ltr"
                  maxLength="6"
                />
                <p className="mt-2 text-[11px] md:text-xs text-white/50 font-bold text-center">
                  تم إرسال الكود إلى رقم {phone}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 md:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-extrabold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-green-500/25 disabled:opacity-50 btn-app"
              >
                {loading ? 'جاري التحقق...' : '✅ تأكيد الكود'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-xs md:text-sm text-yellow-400 hover:text-yellow-300 font-bold transition-colors py-2"
              >
                ← العودة لتعديل البيانات
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* Waiting ═══ */}
          {/* ═══════════════════════════════════════════ */}
          {mode === 'register' && step === 'wait' && (
            <div className="text-center py-6 md:py-8 fade-in-up">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-5 md:p-6 backdrop-blur-sm">
                <div className="text-4xl mb-3 animate-bounce">⏳</div>
                <h3 className="text-lg md:text-xl font-extrabold text-white">في انتظار القبول</h3>
                <p className="mt-2 text-white/70 font-medium text-sm md:text-base">تم إرسال طلب الانضمام إلى الإدارة</p>
                <p className="mt-1 text-xs md:text-sm text-white/50 font-bold">سيتم إشعارك عند قبول طلبك</p>
                <div className="mt-4 animate-pulse">
                  <div className="h-1 bg-yellow-400 rounded-full w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Footer Link ═══ */}
          <div className="text-center mt-4 md:mt-5 pt-3 md:pt-4 border-t border-white/10">
            <Link href="/login" className="text-xs md:text-sm text-white/50 hover:text-yellow-400 font-bold transition-colors">
              🔐 تسجيل الدخول للإدارة
            </Link>
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

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-flag-wave {
          animation: flag-wave 6s ease-in-out infinite;
        }

        .animate-bounce {
          animation: bounce 1s infinite;
        }

        .fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}