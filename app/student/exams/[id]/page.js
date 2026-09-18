'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamSolvePage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState(null)
  const [studentId, setStudentId] = useState(null)
  const [examId, setExamId] = useState(null)
  const [reentryStatus, setReentryStatus] = useState(null)
  const [examEnded, setExamEnded] = useState(false)
  const [requestingReentry, setRequestingReentry] = useState(false)

  // ✅ حل params (Next.js 15)
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
    if (parsed.role !== 'Student') {
      router.push('/unauthorized')
      return
    }
    setStudentId(parsed.id)
    await fetchExam(parsed.id)
  }

  const fetchExam = async (sId) => {
    try {
      // ✅ جلب بيانات الاختبار
      const response = await fetch(`/api/student/exams?examId=${examId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setExam(data)

      // ✅ التحقق من انتهاء وقت الاختبار
      if (data.ends_at) {
        const now = new Date()
        const endTime = new Date(data.ends_at)
        if (now > endTime) {
          setExamEnded(true)
        }
      }

      // ✅ جلب محاولة الطالب
      const attemptsRes = await fetch(`/api/student/attempts?examId=${examId}&student_id=${sId}`)
      const attemptsData = await attemptsRes.json()

      if (attemptsRes.ok && attemptsData) {
        if (attemptsData.status === 'submitted') {
          router.push(`/student/exams/${examId}/result`)
          return
        }

        setAttempt(attemptsData)

        // ✅ جلب حالة طلب الاستكمال
        const reentryRes = await fetch(`/api/reentry-requests?student_id=${sId}&exam_id=${examId}`)
        const reentryData = await reentryRes.json()

        if (reentryRes.ok && reentryData.length > 0) {
          const latestRequest = reentryData[0]
          setReentryStatus(latestRequest.status)
        }

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
        // ✅ إنشاء محاولة جديدة
        const createRes = await fetch('/api/student/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: examId,
            student_id: sId
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

  // ✅ طلب استكمال الاختبار
  const handleRequestReentry = async () => {
    setRequestingReentry(true)
    try {
      const res = await fetch('/api/reentry-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          student_id: studentId,
          exam_id: examId,
          notes: 'الطالب يطلب استكمال الاختبار'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setReentryStatus('pending')
    } catch (error) {
      setError(error.message)
    } finally {
      setRequestingReentry(false)
    }
  }

  const handleSubmit = async () => {
    if (!confirm('هل أنت متأكد من تسليم الاختبار؟')) return

    try {
      const response = await fetch('/api/student/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          answers: answers,
          student_id: studentId
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

  // ✅ عد تنازلي للوقت
  useEffect(() => {
    if (timeLeft <= 0 || !attempt || attempt.status !== 'in_progress') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
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

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">الاختبار غير موجود</div>
      </div>
    )
  }

  // ✅ لو الاختبار انتهى أو مقفول
  if (examEnded || attempt.status === 'locked' || timeLeft <= 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            {examEnded ? 'انتهى وقت الاختبار' : 'الاختبار مغلق'}
          </h1>
          <p className="text-gray-600 mb-6 font-medium">
            {examEnded
              ? 'انتهى الوقت المخصص لهذا الاختبار.'
              : 'تم إغلاق الاختبار. يمكنك طلب استكمال من المدرس.'}
          </p>

          {reentryStatus === 'pending' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-800 font-bold">
                ⏳ طلبك قيد المراجعة من قبل المدرس
              </p>
            </div>
          )}

          {reentryStatus === 'rejected' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-800 font-bold">
                ❌ تم رفض طلب الاستكمال
              </p>
            </div>
          )}

          {!reentryStatus && (
            <button
              onClick={handleRequestReentry}
              disabled={requestingReentry}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {requestingReentry ? '⏳ جاري الإرسال...' : '📩 طلب استكمال الاختبار'}
            </button>
          )}

          <button
            onClick={() => router.push('/student/exams')}
            className="w-full mt-3 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            ← العودة للاختبارات
          </button>
        </div>
      </div>
    )
  }

  const questions = exam.exam_questions || []

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600 font-medium">{exam.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{timeLeft}</div>
              <div className="text-sm text-gray-500 font-bold">دقيقة متبقية</div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-6">
            {questions.map((question, index) => {
              let options = []
              try {
                options = typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || [])
                if (typeof options === 'string') options = JSON.parse(options)
              } catch (e) {
                options = []
              }

              return (
                <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      سؤال {index + 1}
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

                  <div className="space-y-2">
                    {question.question_type === 'multiple_choice' && options?.map((option, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => handleAnswer(question.id, option)}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700 font-medium">{option}</span>
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
              )
            })}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/student/exams')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition-colors"
            >
              ← العودة
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              ✅ تسليم الاختبار
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}