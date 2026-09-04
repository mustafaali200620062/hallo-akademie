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
    fetchData()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
  }

  const fetchData = async () => {
    try {
      // جلب بيانات الطالب
      const userData = JSON.parse(localStorage.getItem('user'))
      
      // جلب إحصائيات الطالب
      const statsRes = await fetch('/api/student/stats')
      const statsData = await statsRes.json()
      if (statsRes.ok) {
        setStudentData({
          ...userData,
          ...statsData
        })
      }

      // جلب أخطاء الطالب
      const errorsRes = await fetch('/api/student/errors')
      const errorsData = await errorsRes.json()
      if (errorsRes.ok) {
        setErrors(errorsData || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* الهيدر */}
      <div className="bg-yellow-400 text-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">مستوايا</h1>
            </div>
            <button 
              onClick={() => router.push('/student')}
              className="bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* بطاقة المستوى */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">📊 مستواي</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">المستوى</span>
                  <span className="font-bold text-blue-600">
                    {studentData?.level || 'غير محدد'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">النقاط</span>
                  <span className="font-bold">{studentData?.totalPoints || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">الترتيب</span>
                  <span className="font-bold">#{studentData?.rank || '-'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">الاختبارات المكتملة</span>
                  <span className="font-bold">{studentData?.completedExams || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* الأخطاء */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                ❌ أخطائي
                <span className="text-sm font-normal text-gray-500">
                  ({errors.length} خطأ)
                </span>
              </h2>
              {errors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>ليس لديك أخطاء حتى الآن</p>
                  <p className="text-sm mt-2">استمر في التعلم!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.map((errorItem, index) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">سؤال {index + 1}</p>
                          <p className="text-gray-700 mt-1">{errorItem.question_text}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-red-600">
                              إجابتك: {JSON.stringify(errorItem.student_answer)}
                            </p>
                            <p className="text-green-600">
                              الإجابة الصحيحة: {JSON.stringify(errorItem.correct_answer)}
                            </p>
                            {errorItem.explanation && (
                              <p className="text-gray-600 mt-1 text-xs">
                                💡 {errorItem.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}