'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamMonitorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [students, setStudents] = useState([])
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
      const res = await fetch(`/api/teacher/exam-monitor?examId=${examId}`)
      const data = await res.json()
      if (res.ok) {
        setStudents(data || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('حدث خطأ في جلب بيانات الطلاب')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'not_started': { color: 'bg-gray-100 text-gray-800', label: 'لم يبدأ' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'قيد الحل' },
      'submitted': { color: 'bg-green-100 text-green-800', label: 'تم التسليم' },
      'locked': { color: 'bg-red-100 text-red-800', label: 'مغلق' },
      'expired': { color: 'bg-red-100 text-red-800', label: 'انتهى الوقت' }
    }
    const info = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <span className={`px-2 py-1 rounded-full text-xs ${info.color}`}>{info.label}</span>
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
      <div className="bg-yellow-500 text-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">متابعة الاختبارات</h1>
            </div>
            <button 
              onClick={() => router.push('/lehrer')}
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
                        ? 'bg-yellow-100 border border-yellow-400' 
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

          {/* قائمة الطلاب */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              👨‍🎓 الطلاب
              {selectedExam && (
                <span className="text-sm font-normal text-gray-500">
                  في {exams.find(e => e.id === selectedExam)?.title}
                </span>
              )}
            </h2>
            {!selectedExam ? (
              <p className="text-gray-500 text-center py-8">اختر اختباراً لعرض الطلاب</p>
            ) : students.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا يوجد طلاب في هذا الاختبار</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الطالب</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الحالة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الوقت المتبقي</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{student.student_name}</div>
                          <div className="text-xs text-gray-500">{student.student_phone}</div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                        <td className="px-4 py-3">
                          {student.status === 'in_progress' ? (
                            <span className="font-bold text-yellow-600">{student.remaining_minutes || 0} د</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {student.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                const minutes = prompt('كم دقيقة تريد إضافتها؟', '5')
                                if (minutes && !isNaN(minutes)) {
                                  fetch(`/api/teacher/exam-monitor`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      attempt_id: student.id,
                                      action: 'add_time',
                                      extra_minutes: parseInt(minutes)
                                    })
                                  }).then(() => handleExamSelect(selectedExam))
                                }
                              }}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              + وقت
                            </button>
                          )}
                          {student.status === 'locked' && (
                            <button
                              onClick={() => {
                                fetch(`/api/teacher/exam-monitor`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    attempt_id: student.id,
                                    action: 'unlock'
                                  })
                                }).then(() => handleExamSelect(selectedExam))
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              فتح
                            </button>
                          )}
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