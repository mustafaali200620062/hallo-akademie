'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchExams()
  }, [])

  const checkUser = async () => {
    const res = await fetch('/api/auth/session')
    const session = await res.json()
    if (!session?.user) {
      router.push('/login')
      return
    }
  }

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/student/exams')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (attempt) => {
    if (!attempt || attempt.status === 'not_started') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">متاح</span>
    }
    if (attempt.status === 'in_progress') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد الحل</span>
    }
    if (attempt.status === 'submitted') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">تم التسليم</span>
    }
    if (attempt.status === 'locked') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">مغلق</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">غير معروف</span>
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
      <div className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">الاختبارات المتاحة</h1>
            </div>
            <button 
              onClick={() => router.push('/student')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>لا توجد اختبارات متاحة لك حالياً</p>
            </div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {exam.levels?.code}
                    </span>
                    {getStatusBadge(exam.attempt)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>⏱️ المدة: {exam.duration_minutes} دقيقة</p>
                    <p>📊 الدرجة: {exam.total_points}</p>
                    <p>📅 {new Date(exam.starts_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  {exam.attempt?.status === 'submitted' && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg text-center">
                      <span className="text-blue-700 font-bold">النتيجة: {exam.attempt.score} / {exam.total_points}</span>
                    </div>
                  )}
                  {exam.attempt?.status === 'not_started' && (
                    <Link 
                      href={`/student/exams/${exam.id}`}
                      className="mt-4 block text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      بدء الاختبار
                    </Link>
                  )}
                  {exam.attempt?.status === 'in_progress' && (
                    <Link 
                      href={`/student/exams/${exam.id}`}
                      className="mt-4 block text-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      استكمال الاختبار
                    </Link>
                  )}
                  {exam.attempt?.status === 'locked' && (
                    <div className="mt-4 text-center text-red-600 font-medium">
                      ⛔ تم قفل الاختبار
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}