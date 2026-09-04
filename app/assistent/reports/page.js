'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssistentReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchData()
  }, [])

  const checkUser = async () => {
    const res = await fetch('/api/auth/session')
    const session = await res.json()
    if (!session?.user) {
      router.push('/login')
      return
    }
  }

  const fetchData = async () => {
    try {
      // جلب جميع الطلاب
      const studentsRes = await fetch('/api/students')
      const studentsData = await studentsRes.json()
      if (studentsRes.ok) setStudents(studentsData || [])

      // جلب جميع الاختبارات
      const examsRes = await fetch('/api/exams')
      const examsData = await examsRes.json()
      if (examsRes.ok) setExams(examsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const getExamResults = (examId) => {
    // في النسخة الكاملة، هنضيف جلب النتائج
    return []
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
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">التقارير</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* تقارير الطلاب */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              👨‍🎓 تقارير الطلاب
            </h2>
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا يوجد طلاب</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <span className="font-medium text-gray-900">{student.full_name}</span>
                      <span className="text-sm text-gray-500 block">{student.email || student.phone}</span>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded-full ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.is_active ? '✅ نشط' : '❌ غير نشط'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* تقارير الاختبارات */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📝 نتائج الاختبارات
            </h2>
            {exams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد اختبارات</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {exams.map((exam) => (
                  <div key={exam.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{exam.title}</span>
                      <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {exam.level_code}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>📅 {new Date(exam.created_at).toLocaleDateString('ar-EG')}</span>
                      <span className="mx-2">•</span>
                      <span>⏱️ {exam.duration_minutes} دقيقة</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {exam._count?.students || 0} طالب • {exam._count?.submissions || 0} تسليم
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}