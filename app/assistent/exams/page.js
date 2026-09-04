'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssistentExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchExams()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
  }

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams')
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
              <h1 className="text-2xl font-bold">الاختبارات</h1>
            </div>
            <button 
              onClick={() => router.push('/assistent')}
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
              <p>لا توجد اختبارات</p>
            </div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {exam.level_code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      exam.status === 'active' ? 'bg-green-100 text-green-800' :
                      exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exam.status === 'active' ? '🟢 نشط' :
                       exam.status === 'scheduled' ? '🟡 مجدول' :
                       '⚪ منتهي'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>📚 {exam.group_name || 'مجموعة غير محددة'}</p>
                    <p>⏱️ {exam.duration_minutes} دقيقة</p>
                    <p>📊 {exam.total_points} نقطة</p>
                    <p>📅 {new Date(exam.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}