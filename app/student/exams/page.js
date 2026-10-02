'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [reentryMap, setReentryMap] = useState({}) // examId → status
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'Student') {
      router.push('/unauthorized')
      return
    }
    await fetchExams(parsed.id)
  }

  const fetchExams = async (studentId) => {
    try {
      // ✅ 1. جلب الاختبارات
      const response = await fetch(`/api/student/exams?student_id=${studentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setExams(data || [])

      // ✅ 2. جلب كل طلبات الاستكمال للطالب
      const reentryRes = await fetch(`/api/reentry-requests/student?student_id=${studentId}`)
      const reentryData = await reentryRes.json()

      if (reentryRes.ok && Array.isArray(reentryData)) {
        // ✅ نعمل map: examId → status (الأحدث)
        const map = {}
        const sorted = reentryData.sort((a, b) =>
          new Date(b.requested_at || 0) - new Date(a.requested_at || 0)
        )
        for (const r of sorted) {
          if (!map[r.exam_id]) {
            map[r.exam_id] = r.status
          }
        }
        setReentryMap(map)
      }

    } catch (error) {
      console.error('Error fetching exams:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (exam) => {
    const attempt = exam.attempt
    const reentryStatus = reentryMap[exam.id]

    // ✅ لو الاختبار مخلص ومُسلّم
    if (attempt?.status === 'submitted') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">✅ تم التسليم</span>
    }

    // ✅ لو في محاولة in_progress
    if (attempt?.status === 'in_progress') {
      // ✅ لو مسموح له يكمل
      if (attempt.is_reentry_allowed === true) {
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">▶️ مسموح بالاستكمال</span>
      }

      // ✅ لو عنده طلب قيد المراجعة
      if (reentryStatus === 'pending') {
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold animate-pulse">⏳ انتظار موافقة</span>
      }

      // ✅ لو الطلب اترفض
      if (reentryStatus === 'rejected') {
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">❌ الطلب مرفوض</span>
      }

      // ✅ لسه خرج و مبعثش طلب
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">🚪 خرجت من الاختبار</span>
    }

    if (attempt?.status === 'locked') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">🔒 مغلق</span>
    }

    // ✅ لو الاختبار مش active
    if (exam.status !== 'active') {
      if (exam.status === 'scheduled') {
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">⏰ لم يبدأ بعد</span>
      }
      if (exam.status === 'ended') {
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">⚪ منتهي</span>
      }
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">📝 مسودة</span>
    }

    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">🟢 متاح</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-green-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">📝 الاختبارات</h1>
            </div>
            <button
              onClick={() => router.push('/student')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← رجوع
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center text-gray-500 fade-in-up">
              <div className="text-5xl md:text-6xl mb-4">📝</div>
              <p className="text-base md:text-lg font-bold">لا توجد اختبارات متاحة لك حالياً</p>
            </div>
          ) : (
            exams.map((exam) => {
              const attempt = exam.attempt
              const isActive = exam.status === 'active'
              const reentryStatus = reentryMap[exam.id]

              // ✅ يستطيع البدء
              const canStart = isActive && (!attempt || attempt.status === 'not_started')

              // ✅ عنده محاولة قيد الحل
              const isInProgress = attempt?.status === 'in_progress'

              // ✅ مسموح له يكمل
              const canContinue = isInProgress && attempt.is_reentry_allowed === true

              // ✅ عنده محاولة قيد الحل بس محتاج موافقة
              const needsReentry = isInProgress && !canContinue

              const isLocked = attempt?.status === 'locked'
              const isSubmitted = attempt?.status === 'submitted'

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-2xl shadow-md overflow-hidden transition-shadow fade-in-up ${
                    isActive ? 'hover:shadow-lg' : 'opacity-90'
                  }`}
                >
                  <div className="p-4 md:p-5">
                    {/* شارة المستوى + الحالة */}
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] md:text-xs font-bold">
                        {exam.level_code}
                      </span>
                      {getStatusBadge(exam)}
                    </div>

                    {/* العنوان */}
                    <h3 className="text-base md:text-xl font-extrabold text-gray-900 mb-1.5">
                      {exam.title}
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm mb-3 font-medium line-clamp-2">
                      {exam.description}
                    </p>

                    {/* التفاصيل */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 font-bold">
                      <span>⏱️ {exam.duration_minutes} دقيقة</span>
                      <span>📊 {exam.total_points} درجة</span>
                      <span>📅 {new Date(exam.starts_at).toLocaleDateString('ar-EG')}</span>
                    </div>

                    {/* النتيجة */}
                    {isSubmitted && (
                      <div className="mt-3 p-2.5 md:p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                        <span className="text-blue-700 font-extrabold text-sm md:text-base">
                          🎯 النتيجة: {attempt.total_score || 0} / {exam.total_points}
                        </span>
                      </div>
                    )}

                    {/* 🚀 بدء الاختبار */}
                    {canStart && (
                      <Link
                        href={`/student/exams/${exam.id}`}
                        className="mt-3 block text-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-extrabold transition-colors active:scale-95 text-sm md:text-base btn-app"
                      >
                        🚀 بدء الاختبار
                      </Link>
                    )}

                    {/* ▶️ استكمال (لو المدرس وافق) */}
                    {canContinue && (
                      <Link
                        href={`/student/exams/${exam.id}`}
                        className="mt-3 block text-center bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-extrabold transition-colors active:scale-95 text-sm md:text-base btn-app"
                      >
                        ▶️ استكمال الاختبار
                      </Link>
                    )}

                    {/* 🚪 محتاج موافقة */}
                    {needsReentry && (
                      <div className="mt-3">
                        {reentryStatus === 'pending' && (
                          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 md:p-4 text-center">
                            <div className="text-2xl mb-1 animate-pulse">⏳</div>
                            <p className="text-yellow-800 font-extrabold text-xs md:text-sm">
                              طلب الاستكمال قيد المراجعة
                            </p>
                            <p className="text-yellow-700 text-[10px] md:text-xs font-bold mt-1">
                              في انتظار موافقة المدرس
                            </p>
                          </div>
                        )}

                        {reentryStatus === 'rejected' && (
                          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 md:p-4 text-center">
                            <div className="text-2xl mb-1">❌</div>
                            <p className="text-red-800 font-extrabold text-xs md:text-sm">
                              تم رفض طلب الاستكمال
                            </p>
                            <Link
                              href={`/student/exams/${exam.id}`}
                              className="mt-2 inline-block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-extrabold text-[11px] md:text-xs active:scale-95"
                            >
                              🔄 أعد المحاولة
                            </Link>
                          </div>
                        )}

                        {!reentryStatus && (
                          <Link
                            href={`/student/exams/${exam.id}`}
                            className="block text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-extrabold transition-colors active:scale-95 text-sm md:text-base btn-app"
                          >
                            📩 اطلب استكمال
                          </Link>
                        )}
                      </div>
                    )}

                    {/* 🔒 مقفول */}
                    {isLocked && (
                      <div className="mt-3 text-center bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-extrabold text-xs md:text-sm">
                        ⛔ تم قفل الاختبار
                      </div>
                    )}

                    {/* غير متاح */}
                    {!isActive && !isSubmitted && !isInProgress && !isLocked && (
                      <div className="mt-3 text-center bg-gray-100 text-gray-600 px-4 py-3 rounded-xl font-bold text-xs md:text-sm">
                        {exam.status === 'scheduled' && '⏰ لم يبدأ بعد'}
                        {exam.status === 'ended' && '⚪ انتهى الاختبار'}
                        {exam.status === 'draft' && '📝 غير متاح'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}