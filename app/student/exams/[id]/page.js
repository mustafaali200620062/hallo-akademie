'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ExamSolvePage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchExam()
  }, [])

  const checkUser = async () => {
    const res = await fetch('/api/auth/session')
    const session = await res.json()
    if (!session?.user) {
      router.push('/login')
      return
    }
  }

  const fetchExam = async () => {
    try {
      // جلب بيانات الاختبار
      const response = await fetch(`/api/student/exams?examId=${examId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setExam(data)

      // جلب محاولة الطالب
      const attemptsRes = await fetch(`/api/student/attempts?examId=${examId}`)
      const attemptsData = await attemptsRes.json()

      if (attemptsRes.ok && attemptsData) {
        if (attemptsData.status === 'submitted') {
          router.push(`/student/exams/${examId}/result`)
          return
        }
        if (attemptsData.status === 'locked') {
          setError('⛔ هذا الاختبار مغلق ولا يمكنك الدخول إليه')
          setLoading(false)
          return
        }
        setAttempt(attemptsData)
        // حساب الوقت المتبقي
        const elapsed = (Date.now() - new Date(attemptsData.started_at).getTime()) / 60000
        const remaining = data.duration_minutes + (attemptsData.extra_minutes || 0) - elapsed
        setTimeLeft(Math.max(0, Math.floor(remaining)))
        
        // جلب الإجابات السابقة
        const answersRes = await fetch(`/api/student/answers?attemptId=${attemptsData.id}`)
        const answersData = await answersRes.json()
        
        const answersMap = {}
        answersData?.forEach(a => {
          answersMap[a.question_id] = a.answer
        })
        setAnswers(answersMap)
        
      } else {
        // إنشاء محاولة جديدة
        const createRes = await fetch('/api/student/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: examId
          })
        })
        const newAttempt = await createRes.json()

        if (!createRes.ok) {
          throw new Error(newAttempt.error || 'حدث خطأ')
        }
        setAttempt(newAttempt)
        setTimeLeft(data.duration_minutes)
      }

    } catch (error) {
      console.error('Error fetching exam:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    })
  }

  const handleSubmit = async () => {
    if (!confirm('هل أنت متأكد من تسليم الاختبار؟')) return

    try {
      const response = await fetch('/api/student/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          answers: answers
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      router.push(`/student/exams/${examId}/result`)
    } catch (error) {
      setError(error.message)
    }
  }

  // عد تنازلي للوقت
  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // تسليم تلقائي عند انتهاء الوقت
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [timeLeft, attempt])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">الاختبار غير موجود</div>
      </div>
    )
  }

  const questions = exam.exam_questions || []

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* الهيدر */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600">{exam.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{timeLeft}</div>
              <div className="text-sm text-gray-500">دقيقة متبقية</div>
            </div>
          </div>
        </div>

        {/* الأسئلة */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    سؤال {index + 1}
                  </h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    {question.points} نقطة
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{question.question_text}</p>

                {question.media_url && (
                  <div className="mb-4">
                    {question.question_type === 'audio' && (
                      <audio controls className="w-full">
                        <source src={question.media_url} type="audio/mpeg" />
                        متصفحك لا يدعم الصوت
                      </audio>
                    )}
                    {question.question_type === 'image' && (
                      <img src={question.media_url} alt="سؤال" className="max-w-full rounded-lg" />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {question.question_type === 'multiple_choice' && question.options?.map((option, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswer(question.id, option)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}

                  {question.question_type === 'text' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      rows="3"
                      placeholder="اكتب إجابتك هنا..."
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/student/exams')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              ← العودة
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ✅ تسليم الاختبار
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}