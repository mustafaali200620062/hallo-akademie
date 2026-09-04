'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ExamResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [exam, setExam] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchResult()
  }, [])

  const checkUser = async () => {
    const res = await fetch('/api/auth/session')
    const session = await res.json()
    if (!session?.user) {
      router.push('/login')
      return
    }
  }

  const fetchResult = async () => {
    try {
      // جلب نتيجة الاختبار
      const response = await fetch(`/api/student/exam-result?examId=${examId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setResult(data)
      setExam(data.exam)
    } catch (error) {
      console.error('Error fetching result:', error)
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

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || 'لم يتم العثور على النتيجة'}
        </div>
      </div>
    )
  }

  const { attempt, answers } = result
  const totalQuestions = answers?.length || 0
  const correctAnswers = answers?.filter(a => a.is_correct).length || 0
  const scorePercentage = attempt?.total_points > 0 ? Math.round((attempt.total_score / attempt.total_points) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* الهيدر */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{exam?.title}</h1>
            <p className="text-gray-600">{exam?.description}</p>
          </div>
        </div>

        {/* النتيجة */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{attempt?.total_score || 0}</div>
              <div className="text-sm text-gray-500">الدرجة</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{scorePercentage}%</div>
              <div className="text-sm text-gray-500">النسبة المئوية</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-500">إجابات صحيحة</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-500">إجابات خاطئة</div>
            </div>
          </div>
        </div>

        {/* المراجعة */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📖 مراجعة الإجابات</h2>
          <div className="space-y-4">
            {answers?.length === 0 ? (
              <p className="text-center text-gray-500">لا توجد إجابات</p>
            ) : (
              answers?.map((answer, index) => (
                <div key={index} className={`p-4 rounded-lg border ${answer.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">سؤال {index + 1}</p>
                      <p className="text-gray-700 mt-1">{answer.question_text}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                          إجابتك: {JSON.stringify(answer.answer)}
                        </p>
                        {!answer.is_correct && (
                          <p className="text-green-600">
                            الإجابة الصحيحة: {JSON.stringify(answer.correct_answer)}
                          </p>
                        )}
                        {answer.explanation && (
                          <p className="text-gray-600 mt-1 text-xs">
                            💡 {answer.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${answer.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {answer.is_correct ? '+' : '-'}{answer.awarded_points} نقطة
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => router.push('/student/exams')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              ← العودة للاختبارات
            </button>
            <button
              onClick={() => router.push('/student')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🏠 الصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}