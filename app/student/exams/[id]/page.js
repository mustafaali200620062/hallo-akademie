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

      // ✅ Logs للتشخيص
      console.log('=== EXAM DATA ===')
      console.log('Exam title:', data.title)
      console.log('Exam status:', data.status)
      console.log('Questions count:', data.exam_questions?.length)
      data.exam_questions?.forEach((q, i) => {
        console.log(`--- Q${i + 1} ---`)
        console.log('  type:', q.question_type)
        console.log('  text:', q.question_text)
        console.log('  media_url:', q.media_url)
        console.log('  media_type:', q.media_type)
        console.log('  options:', q.options)
        console.log('  correct_answers:', q.correct_answers)
      })

      setExam(data)

      if (data.status !== 'active' && data.ends_at) {
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
    if (!confirm('Sind Sie sicher, dass Sie die Prüfung abgeben möchten?')) return
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
          notes: 'Student möchte die Prüfung fortsetzen'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-bold">Laden...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className="text-5xl md:text-6xl mb-4">⚠️</div>
          <h1 className="text-lg md:text-xl font-extrabold text-gray-900 mb-4">{error}</h1>
          <button
            onClick={() => router.push('/student/exams')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            ← Zurück zu den Prüfungen
          </button>
        </div>
      </div>
    )
  }

  if (submitting || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Wird abgegeben...</h1>
          <p className="text-gray-600 font-bold">Bitte warten</p>
        </div>
      </div>
    )
  }

  const shouldBlock = (
    attempt?.status === 'locked' ||
    (attempt?.status === 'in_progress' && timeLeft <= 0) ||
    (examEnded && exam?.status !== 'active')
  )

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className="text-5xl md:text-6xl mb-4">⏰</div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-2">
            {examEnded ? 'Prüfungszeit abgelaufen' : 'Prüfung geschlossen'}
          </h1>
          <p className="text-gray-600 mb-6 font-medium text-sm md:text-base">
            {examEnded
              ? 'Die Zeit für diese Prüfung ist abgelaufen.'
              : 'Die Prüfung wurde geschlossen. Sie können die Fortsetzung beantragen.'}
          </p>

          {reentryStatus === 'pending' && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 md:p-6 mb-4">
              <div className="text-4xl mb-2 animate-pulse">⏳</div>
              <p className="text-yellow-800 font-extrabold text-base md:text-lg">
                Fortsetzungsantrag wird geprüft
              </p>
              <p className="text-yellow-700 text-xs md:text-sm font-bold mt-2">
                Warten auf Genehmigung des Lehrers
              </p>
            </div>
          )}

          {reentryStatus === 'rejected' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 md:p-6 mb-4">
              <div className="text-4xl mb-2">❌</div>
              <p className="text-red-800 font-extrabold text-base md:text-lg">Antrag abgelehnt</p>
            </div>
          )}

          {!reentryStatus && attempt && (
            <button
              onClick={handleRequestReentry}
              disabled={requestingReentry}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
            >
              {requestingReentry ? '⏳ Wird gesendet...' : '📩 Fortsetzung beantragen'}
            </button>
          )}

          <button
            onClick={() => router.push('/student/exams')}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            ← Zurück zu den Prüfungen
          </button>
        </div>
      </div>
    )
  }

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Prüfung nicht gefunden</div>
      </div>
    )
  }

  const questions = exam.exam_questions || []
  const totalTime = exam.duration_minutes + (attempt.extra_minutes || 0)
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0
  const isTimeWarning = timeLeft <= 5 && timeLeft > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={`sticky top-0 z-50 shadow-lg ${isTimeWarning ? 'bg-red-600' : 'bg-green-600'} text-white transition-colors`}>
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-lg font-bold truncate" dir="ltr">{exam.title}</h1>
              <p className="text-[10px] md:text-xs opacity-80 font-bold" dir="ltr">
                {questions.length} Fragen • {exam.total_points} Punkte
              </p>
            </div>
            <div className="text-center ml-2">
              <div className={`text-xl md:text-3xl font-extrabold ${isTimeWarning ? 'animate-pulse' : ''}`} dir="ltr">
                ⏱️ {timeLeft} Min
              </div>
              <div className="text-[10px] md:text-xs font-bold opacity-80">verbleibend</div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5 md:h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isTimeWarning ? 'bg-yellow-300' : 'bg-white'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {isTimeWarning && (
        <div className="bg-red-100 border-b-2 border-red-400 py-2 px-3 md:px-4 text-center">
          <p className="text-red-700 font-extrabold text-xs md:text-sm" dir="ltr">
            ⚠️ Weniger als 5 Minuten! Automatische Abgabe erfolgt.
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-4 md:space-y-6">
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
                <div key={question.id} className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-3 md:mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-extrabold shadow-md text-sm md:text-base">
                        {index + 1}
                      </div>
                      <div className="text-sm md:text-base font-bold text-gray-800" dir="ltr">
                        {question.question_type === 'multiple_choice' ? 'Multiple Choice' :
                         question.question_type === 'matching' ? 'Zuordnung' :
                         question.question_type === 'image' ? 'Bild' :
                         question.question_type === 'audio' ? 'Hörverstehen' : 'Text'}
                      </div>
                    </div>
                    <span className="px-2 md:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs md:text-sm font-extrabold whitespace-nowrap" dir="ltr">
                      {question.points} {question.points === 1 ? 'Punkt' : 'Punkte'}
                    </span>
                  </div>

                  <p className="text-gray-800 mb-4 md:mb-5 font-bold text-base md:text-lg leading-relaxed" dir="ltr">{question.question_text}</p>

                  {/* ✅ الصورة مع Debug */}
                  {question.question_type === 'image' && (
                    <div className="mb-5">
                      {question.media_url ? (
                        <div className="flex justify-center bg-gray-50 rounded-xl p-3 md:p-4">
                          <img
                            src={question.media_url}
                            alt="Frage"
                            className="max-w-full max-h-80 md:max-h-[500px] rounded-xl shadow-md object-contain"
                            onError={(e) => {
                              console.error('❌ Image failed to load:', question.media_url)
                              e.target.style.border = '2px solid red'
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded:', question.media_url?.substring(0, 100))
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-center">
                          <p className="text-red-700 font-bold text-sm">
                            ⚠️ Keine Bild-URL für diese Frage
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ الصوت مع Debug */}
                  {question.question_type === 'audio' && (
                    <div className="mb-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 md:p-4">
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg md:text-xl">
                          🎵
                        </div>
                        <span className="font-bold text-blue-800 text-sm md:text-base" dir="ltr">
                          Hören Sie sich die Audiodatei an
                        </span>
                      </div>
                      {question.media_url ? (
                        <audio
                          controls
                          className="w-full"
                          controlsList="nodownload"
                          onContextMenu={(e) => e.preventDefault()}
                          onError={(e) => console.error('❌ Audio failed:', question.media_url)}
                        >
                          <source src={question.media_url} type="audio/mpeg" />
                          Ihr Browser unterstützt kein Audio
                        </audio>
                      ) : (
                        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 text-center">
                          <p className="text-red-700 font-bold text-sm">
                            ⚠️ Keine Audio-URL für diese Frage
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2 md:space-y-3">
                      {isMultiple && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                          <p className="text-blue-800 text-xs md:text-sm font-bold" dir="ltr">
                            ℹ️ Mehrere richtige Antworten möglich
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
                            className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all ${
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
                              className="w-4 h-4 md:w-5 md:h-5 text-green-600 focus:ring-green-500 flex-shrink-0"
                            />
                            <span className={`font-bold text-sm md:text-base ${isChecked ? 'text-green-800' : 'text-gray-700'}`} dir="ltr">
                              {option}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {question.question_type === 'text' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-gray-900 font-medium text-sm md:text-base"
                      rows="3"
                      placeholder="Schreiben Sie Ihre Antwort hier..."
                      dir="ltr"
                    />
                  )}

                  {question.question_type === 'matching' && (
                    <div className="space-y-2 md:space-y-3">
                      {options?.map((pair, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 md:gap-3">
                          <div className="p-2 md:p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-center flex items-center justify-center">
                            <span className="font-bold text-blue-800 text-xs md:text-sm" dir="ltr">{pair.left}</span>
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
                            className="p-2 md:p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 text-center font-bold text-xs md:text-sm"
                            placeholder="Antwort..."
                            dir="ltr"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 md:mt-8 mb-6 md:mb-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-base md:text-xl font-extrabold rounded-xl md:rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {submitting ? '⏳ Wird abgegeben...' : '✅ Prüfung abgeben'}
            </button>
            <p className="text-center text-gray-500 text-[10px] md:text-xs font-bold mt-2 md:mt-3" dir="ltr">
              ⚠️ Nach der Abgabe können Sie nicht zurückkehren
            </p>
          </div>
        </form>
      </div>

      <style jsx global>{`
        audio::-webkit-media-controls-enclosure {
          border-radius: 12px;
        }
        audio::-webkit-media-controls-panel {
          background-color: #eff6ff;
        }
      `}</style>
    </div>
  )
}