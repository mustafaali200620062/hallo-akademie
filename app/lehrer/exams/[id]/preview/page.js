'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerExamPreviewPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [error, setError] = useState(null)
  const [examId, setExamId] = useState(null)

  // ✅ حل الـ params في Next.js 15
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setExamId(resolved.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (examId) {
      checkUser()
    }
  }, [examId])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'Lehrer' && parsed.role !== 'Eigentümer') {
      router.push('/unauthorized')
      return
    }
    await fetchExam()
  }

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/preview?examId=${examId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setExam(data)
    } catch (error) {
      console.error('Error fetching exam:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg font-bold">
          ❌ {error}
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">الاختبار غير موجود</div>
      </div>
    )
  }

  const questions = exam.exam_questions || []

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">معاينة الاختبار</h1>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                👁️ وضع المعاينة
              </span>
            </div>
            <button
              onClick={() => router.push('/lehrer/exams')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h2>
          <p className="text-gray-600 mb-4 font-medium">{exam.description || 'لا يوجد وصف'}</p>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">📚 {exam.level_code}</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">👥 {exam.group_name}</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">⏱️ {exam.duration_minutes} دقيقة</span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">📊 {exam.total_points} نقطة</span>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">📝 {questions.length} سؤال</span>
          </div>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500 font-bold">
              <div className="text-4xl mb-2">📝</div>
              لا توجد أسئلة في هذا الاختبار
            </div>
          ) : (
            questions.map((question, index) => {
              let options = []
              let correctAnswers = []

              try {
                options = typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || [])
                correctAnswers = typeof question.correct_answers === 'string' ? JSON.parse(question.correct_answers) : (question.correct_answers || [])
              } catch (e) {
                options = []
                correctAnswers = []
              }

              return (
                <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      سؤال {index + 1} • {
                        question.question_type === 'multiple_choice' ? 'اختيار من متعدد' :
                        question.question_type === 'matching' ? 'مطابقة' :
                        question.question_type === 'image' ? 'صورة' :
                        question.question_type === 'audio' ? 'صوتي' : 'نص'
                      }
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">
                      {question.points} نقطة
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 font-medium">{question.question_text}</p>

                  {question.media_url && (
                    <div className="mb-4">
                      {question.question_type === 'audio' && (
                        <audio controls className="w-full">
                          <source src={question.media_url} type="audio/mpeg" />
                        </audio>
                      )}
                      {question.question_type === 'image' && (
                        <img src={question.media_url} alt="سؤال" className="max-w-full rounded-lg" />
                      )}
                    </div>
                  )}

                  {options && options.length > 0 && (
                    <div className="space-y-2">
                      {options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 border-2 rounded-lg font-medium ${
                            correctAnswers.includes(i)
                              ? 'bg-green-50 border-green-400 text-green-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          {correctAnswers.includes(i) ? '✅ ' : '⚪ '}
                          {typeof opt === 'object' ? `${opt.left} ← ${opt.right}` : opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-bold">💡 شرح: {question.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}