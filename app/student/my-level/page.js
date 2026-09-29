'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentMyLevelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState(null)
  const [errors, setErrors] = useState([])
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
    await fetchData(parsed.id)
  }

  const fetchData = async (studentId) => {
    try {
      // ✅ استخدام API واحد بدل اتنين
      const res = await fetch(`/api/student/dashboard?student_id=${studentId}`)

      if (!res.ok) {
        throw new Error(`فشل التحميل (${res.status})`)
      }

      const data = await res.json()

      setStudentData({
        level: data.student?.level_code || 'غير محدد',
        level_title: data.student?.level_title || '',
        totalPoints: data.stats?.total_points || 0,
        rank: data.stats?.level_rank || '-',
        rank_badge: data.stats?.level_rank_badge || null,
        completedExams: data.stats?.completed_exams || 0,
        availableExams: data.stats?.available_exams || 0,
        groupName: data.group?.name || 'بدون جروب',
      })

      setErrors(data.errors || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  // ✅ تحويل الترتيب لعلامة
  const formatRank = (rank, badge) => {
    if (rank === null || rank === undefined || rank === '-') return '-'
    const crown = badge === 'crown' ? ' 👑' : badge === 'duplicate' ? ' 🔁' : ''
    return `#${rank}${crown}`
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
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header متناسق ═══ */}
      <div className="bg-yellow-400 text-black shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">مستوايا</h1>
              <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold flex-shrink-0">
                📊
              </span>
            </div>
            <button
              onClick={() => router.push('/student')}
              className="bg-black/20 hover:bg-black/40 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← رجوع
            </button>
          </div>
        </div>
      </div>

      {/* ═══ المحتوى ═══ */}
      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        {/* ═══ بطاقة المستوى ═══ */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 border border-gray-100 fade-in-up">
          <h2 className="text-base md:text-xl font-extrabold mb-4 flex items-center gap-2 text-gray-800">
            📊 مستواي
          </h2>

          <div className="space-y-2.5 md:space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-bold text-xs md:text-sm">المستوى</span>
              <span className="font-extrabold text-blue-600 text-sm md:text-base">
                {studentData?.level}
                {studentData?.level_title && (
                  <span className="text-gray-500 font-bold text-xs md:text-sm mr-1">
                    - {studentData.level_title}
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-bold text-xs md:text-sm">الجروب</span>
              <span className="font-extrabold text-gray-900 text-sm md:text-base truncate">
                {studentData?.groupName}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-bold text-xs md:text-sm">النقاط</span>
              <span className="font-extrabold text-gray-900 text-base md:text-lg">
                {studentData?.totalPoints}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-bold text-xs md:text-sm">الترتيب (المستوى)</span>
              <span className="font-extrabold text-gray-900 text-base md:text-lg">
                {formatRank(studentData?.rank, studentData?.rank_badge)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-bold text-xs md:text-sm">الاختبارات المكتملة</span>
              <span className="font-extrabold text-gray-900 text-base md:text-lg">
                {studentData?.completedExams}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-bold text-xs md:text-sm">الاختبارات المتاحة</span>
              <span className="font-extrabold text-gray-900 text-base md:text-lg">
                {studentData?.availableExams}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ الأخطاء ═══ */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-gray-100 fade-in-up">
          <h2 className="text-base md:text-xl font-extrabold mb-4 flex items-center gap-2 text-gray-800">
            ❌ أخطائي
            <span className="text-xs md:text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {errors.length}
            </span>
          </h2>

          {errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-5xl md:text-6xl mb-4">🎉</div>
              <p className="text-base md:text-lg font-bold">ليس لديك أخطاء حتى الآن</p>
              <p className="text-xs md:text-sm font-bold mt-2">استمر في التعلم!</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {errors.map((errorItem, index) => (
                <div key={errorItem.id || index} className="border-2 border-red-200 rounded-xl p-3.5 md:p-4 bg-red-50 fade-in-up">
                  <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] md:text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      📝 {errorItem.exam_title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      سؤال {index + 1}
                    </span>
                  </div>

                  <p className="text-gray-800 font-bold mb-3 text-xs md:text-sm leading-relaxed">
                    {errorItem.question_text}
                  </p>

                  <div className="space-y-1.5 text-[11px] md:text-xs">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-gray-500 font-bold">إجابتك:</span>
                      <span className="text-red-700 font-bold">
                        {Array.isArray(errorItem.student_answer)
                          ? errorItem.student_answer.join('، ')
                          : String(errorItem.student_answer)}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-gray-500 font-bold">الإجابة الصحيحة:</span>
                      <span className="text-green-700 font-bold">
                        {Array.isArray(errorItem.correct_answer)
                          ? errorItem.correct_answer.join('، ')
                          : String(errorItem.correct_answer)}
                      </span>
                    </div>
                    {errorItem.explanation && (
                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <p className="text-gray-700 text-[10px] md:text-xs font-bold">
                          💡 {errorItem.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}