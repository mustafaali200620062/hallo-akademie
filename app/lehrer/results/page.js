'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [results, setResults] = useState([])
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
      const userData = JSON.parse(localStorage.getItem('user'))
      
      // جلب اختبارات المدرس
      const examsRes = await fetch('/api/exams')
      const examsData = await examsRes.json()
      if (examsRes.ok) {
        const teacherExams = examsData.filter(e => e.created_by === userData?.id)
        setExams(teacherExams || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleExamSelect = async (examId) => {
    setSelectedExam(examId)
    try {
      const res = await fetch(`/api/exam-results?examId=${examId}`)
      const data = await res.json()
      if (res.ok) {
        setResults(data || [])
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setError('حدث خطأ في جلب النتائج')
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
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">نتائج الطلاب</h1>
            </div>
            <button 
              onClick={() => router.push('/lehrer')}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* قائمة الاختبارات */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">📋 اختباراتي</h2>
            {exams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد اختبارات</p>
            ) : (
              <div className="space-y-2">
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => handleExamSelect(exam.id)}
                    className={`w-full text-right p-3 rounded-lg transition-colors ${
                      selectedExam === exam.id 
                        ? 'bg-blue-100 border border-blue-400' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{exam.title}</div>
                    <div className="text-sm text-gray-500">
                      {exam.level_code} • {exam.duration_minutes} دقيقة
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {exam.status === 'active' ? '🟢 نشط' : exam.status === 'scheduled' ? '🟡 مجدول' : '⚪ منتهي'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* النتائج */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              📊 النتائج
              {selectedExam && (
                <span className="text-sm font-normal text-gray-500">
                  {exams.find(e => e.id === selectedExam)?.title}
                </span>
              )}
            </h2>
            {!selectedExam ? (
              <p className="text-gray-500 text-center py-8">اختر اختباراً لعرض النتائج</p>
            ) : results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد نتائج لهذا الاختبار</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الطالب</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الدرجة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">النسبة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{result.student_name}</div>
                          <div className="text-xs text-gray-500">{result.student_phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold">{result.total_score} / {result.total_points}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            result.percentage >= 80 ? 'bg-green-100 text-green-800' :
                            result.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {result.status === 'submitted' ? '✅ مسلم' : result.status === 'in_progress' ? '⏳ قيد الحل' : '⏸️ لم يبدأ'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}