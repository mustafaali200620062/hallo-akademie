'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const submittedRef = useRef(false)

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
      const response = await fetch(`/api/student/exams?examId=${examId}&student_id=${sId}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setError(data.error)
          setLoading(false)
          return
        }
        throw new Error(data.error || 'حدث خطأ')
      }

      setExam(data)

      if (data.ends_at) {
        const now = new Date()
        const endTime = new Date(data.ends_at)
        if (now > endTime) {
          setExamEnded(true)
        }
      }

      const attemptsRes = await fetch(`/api/student/attempts?examId=${examId}&student_id=${sId}`)
      const attemptsData = await attemptsRes.json()

      if (attemptsRes.ok && attemptsData) {
        if (attemptsData.status === 'submitted') {
          router.push(`/student/exams/${examId}/result`)
          return
        }

        setAttempt(attemptsData)

        const reentryRes = await fetch(`/api/reentry-requests/student?student_id=${sId}&exam_id=${examId}`)
        const reentryData = await reentryRes.json()

        if (reentryRes.ok && reentryData.length > 0) {
          setReentryStatus(reentryData[0].status)
        }

        const elapsed = (Date.now() - new Date(attemptsData.started_at).getTime()) / 60000
        const remaining = data.duration_minutes + (attemptsData.extra_minutes || 0) - elapsed
        setTimeLeft(Math.max(0, Math.floor(remaining)))

        const answersRes = await fetch(`/api/student/answers?attemptId=${attemptsData.id}`)
        const answersData = await answersRes.json()

        const answersMap = {}
        answersData?.forEach(a => {
          try {
            answersMap[a.question_id] = JSON.parse(a.answer)
          } catch (e) {
            answersMap[a.question_id] = a.answer
          }
        })
        setAnswers(answersMap)

      } else {
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

  // ✅ التعامل مع الإجابات
  const handleAnswer = (questionId, value, isMultiple = false) => {
    if (isMultiple) {
      const current = Array.isArray(answers[questionId]) ? answers[questionId] : []
      const newValue = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      setAnswers({ ...answers, [questionId]: newValue })
    } else {
      setAnswers({ ...answers, [questionId]: value })
    }
  }

  // ✅ تسليم إجباري عند انتهاء الوقت
  const autoSubmit = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    setSubmitting(true)

    try {
      await fetch('/api/student/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          answers: answers,
          student_id: studentId,
          force_submit: true
        })
      })
      router.push(`/student/exams/${examId}/result`)
    } catch (error) {
      console.error('Auto-submit error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!confirm('هل أنت متأكد من تسليم الاختبار؟')) return
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    setSubmitting(true)

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
      submittedRef.current = false
      setSubmitted(false)
    } finally {
      setSubmitting(false)
    }
  }

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

  // ✅ عد تنازلي للوقت
  useEffect(() => {
    if (timeLeft <= 0 || !attempt || attempt.status !== 'in_progress') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          autoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [timeLeft, attempt])

  // ✅ منع الخروج من الصفحة
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (attempt && attempt.status === 'in_progress' && !submittedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [attempt])

  // ✅ شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  // ✅ شاشة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-4">{error}</h1>
          <button
            onClick={() => router.push('/student/exams')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            ← العودة للاختبارات
          </button>
        </div>
      </div>
    )
  }

  // ✅ شاشة التسليم
  if (submitting || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">جاري التسليم...</h1>
          <p className="text-gray-600 font-bold">يرجى الانتظار</p>
        </div>
      </div>
    )
  }

  // ✅ شاشة انتهاء الوقت / مغلق
  if (examEnded || attempt?.status === 'locked' || timeLeft <= 0) {
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
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-4">
              <div className="text-4xl mb-2 animate-pulse">⏳</div>
              <p className="text-yellow-800 font-extrabold text-lg">
                جاري مراجعة طلب استكمال الاختبار
              </p>
              <p className="text-yellow-700 text-sm font-bold mt-2">
                في انتظار موافقة المدرس
              </p>
            </div>
          )}

          {reentryStatus === 'rejected' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-4">
              <div className="text-4xl mb-2">❌</div>
              <p className="text-red-800 font-extrabold text-lg">تم رفض طلب الاستكمال</p>
            </div>
          )}

          {!reentryStatus && (
            <button
              onClick={handleRequestReentry}
              disabled={requestingReentry}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
            >
              {requestingReentry ? '⏳ جاري الإرسال...' : '📩 طلب استكمال الاختبار'}
            </button>
          )}

          <button
            onClick={() => router.push('/student/exams')}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            ← العودة للاختبارات
          </button>
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

  const questions = exam.exam_questions || []
  const totalTime = exam.duration_minutes + (attempt.extra_minutes || 0)
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  // ✅ تحذير لو الوقت أقل من 5 دقائق
  const isTimeWarning = timeLeft <= 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ✅ شريط الوقت العلوي */}
      <div className={`sticky top-0 z-50 shadow-lg ${isTimeWarning ? 'bg-red-600' : 'bg-green-600'} text-white transition-colors`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-lg font-bold">{exam.title}</h1>
              <p className="text-xs opacity-80 font-bold">{questions.length} سؤال • {exam.total_points} نقطة</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-extrabold ${isTimeWarning ? 'animate-pulse' : ''}`}>
                ⏱️ {timeLeft}
              </div>
              <div className="text-xs font-bold opacity-80">دقيقة متبقية</div>
            </div>
          </div>
          {/* شريط التقدم */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isTimeWarning ? 'bg-yellow-300' : 'bg-white'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ✅ تحذير الوقت */}
      {isTimeWarning && (
        <div className="bg-red-100 border-b-2 border-red-400 py-2 px-4 text-center">
          <p className="text-red-700 font-extrabold text-sm">
            ⚠️ تحذير: باقي أقل من 5 دقائق! سيتم التسليم تلقائياً عند انتهاء الوقت
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-6">
            {questions.map((question, index) => {
              let options = []
              let correctAnswers = []

              try {
                options = typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || [])
                if (typeof options === 'string') options = JSON.parse(options)
                correctAnswers = typeof question.correct_answers === 'string' ? JSON.parse(question.correct_answers) : (question.correct_answers || [])
                if (typeof correctAnswers === 'string') correctAnswers = JSON.parse(correctAnswers)
              } catch (e) {
                options = []
                correctAnswers = []
              }

              const isMultiple = Array.isArray(correctAnswers) && correctAnswers.length > 1

              return (
                <div key={question.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  {/* ✅ رأس السؤال */}
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-extrabold shadow-md">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {question.question_type === 'multiple_choice' ? 'اختيار من متعدد' :
                         question.question_type === 'matching' ? 'مطابقة' :
                         question.question_type === 'image' ? 'صورة' :
                         question.question_type === 'audio' ? 'مقطع صوتي' : 'نص'}
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-extrabold">
                      {question.points} نقطة
                    </span>
                  </div>

                  {/* ✅ نص السؤال */}
                  <p className="text-gray-800 mb-5 font-bold text-lg leading-relaxed">{question.question_text}</p>

                  {/* ✅ الصورة */}
                  {question.question_type === 'image' && question.media_url && (
                    <div className="mb-5 flex justify-center">
                      <img src={question.media_url} alt="سؤال" className="max-w-full max-h-96 rounded-xl shadow-md" />
                    </div>
                  )}

                  {/* ✅ الصوت */}
                  {question.question_type === 'audio' && question.media_url && (
                    <div className="mb-5">
                      <audio controls className="w-full rounded-xl">
                        <source src={question.media_url} type="audio/mpeg" />
                        متصفحك لا يدعم الصوت
                      </audio>
                    </div>
                  )}

                  {/* ✅ خيارات الاختيار من متعدد */}
                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {isMultiple && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                          <p className="text-blue-800 text-sm font-bold">
                            ℹ️ يمكنك اختيار أكثر من إجابة صحيحة
                          </p>
                        </div>
                      )}
                      {options?.map((option, i) => {
                        const currentAnswer = answers[question.id]
                        const isChecked = isMultiple
                          ? Array.isArray(currentAnswer) && currentAnswer.includes(option)
                          : currentAnswer === option

                        return (
                          <label
                            key={i}
                            className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-green-50 border-green-400 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type={isMultiple ? 'checkbox' : 'radio'}
                              name={`question-${question.id}`}
                              checked={isChecked}
                              onChange={() => handleAnswer(question.id, option, isMultiple)}
                              className="w-5 h-5 text-green-600 focus:ring-green-500"
                            />
                            <span className={`font-bold ${isChecked ? 'text-green-800' : 'text-gray-700'}`}>
                              {option}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* ✅ سؤال نصي */}
                  {question.question_type === 'text' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 font-medium"
                      rows="4"
                      placeholder="اكتب إجابتك هنا..."
                    />
                  )}

                  {/* ✅ سؤال المطابقة */}
                  {question.question_type === 'matching' && (
                    <div className="space-y-3">
                      {options?.map((pair, i) => (
                        <div key={i} className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
                            <span className="font-bold text-blue-800">{pair.left}</span>
                          </div>
                          <input
                            type="text"
                            value={answers[question.id]?.[i] || ''}
                            onChange={(e) => {
                              const current = answers[question.id] || {}
                              setAnswers({
                                ...answers,
                                [question.id]: { ...current, [i]: e.target.value }
                              })
                            }}
                            className="p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-center font-bold"
                            placeholder="اكتب الإجابة..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ✅ زر التسليم فقط */}
          <div className="mt-8 mb-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xl font-extrabold rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {submitting ? '⏳ جاري التسليم...' : '✅ تسليم الاختبار'}
            </button>
            <p className="text-center text-gray-500 text-xs font-bold mt-3">
              ⚠️ بعد التسليم لا يمكنك العودة للاختبار
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}