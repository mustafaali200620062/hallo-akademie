'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamMonitorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teacherId, setTeacherId] = useState(null)
  const [teacherRole, setTeacherRole] = useState(null)
  const [error, setError] = useState(null)

  // ✅ الشاشة الحالية: 'exams' | 'students' | 'detail'
  const [view, setView] = useState('exams')

  // ✅ البيانات
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [students, setStudents] = useState([])
  const [counts, setCounts] = useState({ total: 0, in_progress: 0, submitted: 0 })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetail, setStudentDetail] = useState(null)

  // ✅ Live refresh
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (!['Lehrer', 'Eigentümer', 'Assistent'].includes(parsed.role)) {
      router.push('/unauthorized')
      return
    }
    setTeacherId(parsed.id)
    setTeacherRole(parsed.role)
  }, [])

  // ✅ تحميل قائمة الاختبارات
  const fetchExams = useCallback(async () => {
    if (!teacherId || !teacherRole) return
    try {
      const res = await fetch(`/api/teacher/monitor?teacher_id=${teacherId}&teacher_role=${teacherRole}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ')
      setExams(data.exams || [])
      setLastRefresh(new Date())
    } catch (e) {
      console.error('fetchExams error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [teacherId, teacherRole])

  // ✅ تحميل قائمة الطلاب في اختبار
  const fetchStudents = useCallback(async (examId, silent = false) => {
    if (!teacherId || !teacherRole) return
    try {
      const res = await fetch(`/api/teacher/monitor?teacher_id=${teacherId}&teacher_role=${teacherRole}&exam_id=${examId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ')
      setSelectedExam(data.exam)
      setStudents(data.students || [])
      setCounts(data.counts || { total: 0, in_progress: 0, submitted: 0 })
      setLastRefresh(new Date())
    } catch (e) {
      console.error('fetchStudents error:', e)
      if (!silent) setError(e.message)
    }
  }, [teacherId, teacherRole])

  // ✅ تحميل تفاصيل طالب
  const fetchStudentDetail = useCallback(async (examId, studentId, silent = false) => {
    if (!teacherId || !teacherRole) return
    try {
      const res = await fetch(`/api/teacher/monitor?teacher_id=${teacherId}&teacher_role=${teacherRole}&exam_id=${examId}&student_id=${studentId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ')
      setStudentDetail(data)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('fetchStudentDetail error:', e)
      if (!silent) setError(e.message)
    }
  }, [teacherId, teacherRole])

  // ✅ التحميل الأول
  useEffect(() => {
    if (teacherId && teacherRole) {
      fetchExams()
    }
  }, [teacherId, teacherRole, fetchExams])

  // ✅ Live Updates كل 10 ثواني
  useEffect(() => {
    if (!autoRefresh || !teacherId) return

    const interval = setInterval(() => {
      if (view === 'exams') {
        fetchExams()
      } else if (view === 'students' && selectedExam) {
        fetchStudents(selectedExam.id, true)
      } else if (view === 'detail' && selectedExam && selectedStudent) {
        fetchStudentDetail(selectedExam.id, selectedStudent.student_id, true)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, view, selectedExam, selectedStudent, teacherId, fetchExams, fetchStudents, fetchStudentDetail])

  // ✅ التنقلات
  const goToExam = (exam) => {
    setSelectedExam(exam)
    setView('students')
    fetchStudents(exam.id)
  }

  const goToStudent = (student) => {
    setSelectedStudent(student)
    setView('detail')
    fetchStudentDetail(selectedExam.id, student.student_id)
  }

  const goBack = () => {
    if (view === 'detail') {
      setView('students')
      setSelectedStudent(null)
      setStudentDetail(null)
      if (selectedExam) fetchStudents(selectedExam.id)
    } else if (view === 'students') {
      setView('exams')
      setSelectedExam(null)
      setStudents([])
      fetchExams()
    }
  }

  // ✅ حساب الوقت المستغرق
  const formatDuration = (start, end) => {
    if (!start) return '-'
    const s = new Date(start)
    const e = end ? new Date(end) : new Date()
    const mins = Math.floor((e - s) / 60000)
    const hrs = Math.floor(mins / 60)
    const m = mins % 60
    if (hrs > 0) return `${hrs} س ${m} د`
    return `${m} د`
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getStatusBadge = (status) => {
    if (status === 'in_progress') return { text: '🟢 بيحل', cls: 'bg-green-100 text-green-800 border-green-300' }
    if (status === 'submitted') return { text: '✅ سلم', cls: 'bg-blue-100 text-blue-800 border-blue-300' }
    if (status === 'locked') return { text: '🔒 مقفول', cls: 'bg-red-100 text-red-800 border-red-300' }
    return { text: '⚪ ' + status, cls: 'bg-gray-100 text-gray-800 border-gray-300' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* ═══ الهيدر ═══ */}
      <div className="bg-red-600 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-xl md:text-2xl font-bold">
                {view === 'exams' ? '👀 متابعة الاختبارات' :
                 view === 'students' ? `📋 ${selectedExam?.title || 'الطلاب'}` :
                 `👤 ${selectedStudent?.student_name || 'تفاصيل الطالب'}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {view !== 'exams' && (
                <button
                  onClick={goBack}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  ← العودة
                </button>
              )}
              <button
                onClick={() => router.push('/lehrer')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                🏠
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ شريط المعلومات ═══ */}
      <div className="bg-white border-b shadow-sm sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-bold text-gray-700">تحديث تلقائي (10 ثواني)</span>
            </label>
            {autoRefresh && (
              <span className="flex items-center gap-1 text-green-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-bold">
              آخر تحديث: {formatTime(lastRefresh)}
            </span>
            <button
              onClick={() => {
                if (view === 'exams') fetchExams()
                else if (view === 'students') fetchStudents(selectedExam.id)
                else fetchStudentDetail(selectedExam.id, selectedStudent.student_id)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold"
            >
              🔄 تحديث الآن
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-bold">
            ❌ {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ═══════════════════════════════════════════════ */}
        {/* الشاشة 1: قائمة الاختبارات النشطة */}
        {/* ═══════════════════════════════════════════════ */}
        {view === 'exams' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                الاختبارات النشطة حالياً ({exams.length})
              </h2>
              <p className="text-gray-600 text-sm font-bold">
                اضغط على أي اختبار لمشاهدة الطلاب اللي بيسلموا فيه
              </p>
            </div>

            {exams.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  مفيش اختبارات نشطة
                </h3>
                <p className="text-gray-500">
                  لما يبقى فيه اختبار بحالة "نشط"، هيظهر هنا
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map(exam => (
                  <button
                    key={exam.id}
                    onClick={() => goToExam(exam)}
                    className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all text-right border-2 border-transparent hover:border-green-400"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">{exam.title}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        {exam.level_code}
                      </span>
                    </div>
                    {exam.group_name && (
                      <p className="text-gray-600 text-sm font-bold mb-3">
                        👥 {exam.group_name}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-gray-900">{exam.total_students}</div>
                        <div className="text-xs text-gray-500">الإجمالي</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-green-700">{exam.in_progress}</div>
                        <div className="text-xs text-green-600">بيحلوا</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-blue-700">{exam.submitted}</div>
                        <div className="text-xs text-blue-600">سلموا</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* الشاشة 2: قائمة الطلاب في اختبار */}
        {/* ═══════════════════════════════════════════════ */}
        {view === 'students' && selectedExam && (
          <>
            {/* ✅ إحصائيات */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{counts.total}</div>
                <div className="text-sm text-gray-500 font-bold">إجمالي الطلاب</div>
              </div>
              <div className="bg-green-50 rounded-xl shadow p-4 text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-700">{counts.in_progress}</div>
                <div className="text-sm text-green-600 font-bold">🟢 بيحلوا الآن</div>
              </div>
              <div className="bg-blue-50 rounded-xl shadow p-4 text-center border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-700">{counts.submitted}</div>
                <div className="text-sm text-blue-600 font-bold">✅ سلموا</div>
              </div>
            </div>

            {/* ✅ قائمة الطلاب */}
            {students.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">مفيش طلاب دخلوا الاختبار</h3>
                <p className="text-gray-500">لسه محدش فتح الاختبار ده</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">الطالب</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">وقت الدخول</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">آخر نشاط</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">المدة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">الدرجة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map(s => {
                      const badge = getStatusBadge(s.status)
                      return (
                        <tr key={s.attempt_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{s.student_name}</div>
                            {s.student_phone && (
                              <div className="text-xs text-gray-500" dir="ltr">{s.student_phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-bold">
                            <div>{formatTime(s.started_at)}</div>
                            <div className="text-xs text-gray-400">{formatDate(s.started_at)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-bold">
                            {s.last_activity_at ? (
                              <>
                                <div>{formatTime(s.last_activity_at)}</div>
                                <div className="text-xs text-gray-400">{formatDate(s.last_activity_at)}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-700">
                            {formatDuration(s.started_at, s.submitted_at)}
                          </td>
                          <td className="px-4 py-3">
                            {s.status === 'submitted' ? (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                {s.total_score} / {selectedExam.total_points}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => goToStudent(s)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold"
                            >
                              👁️ تفاصيل
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* الشاشة 3: تفاصيل حل الطالب */}
        {/* ═══════════════════════════════════════════════ */}
        {view === 'detail' && studentDetail && (
          <>
            {/* ✅ معلومات الطالب */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {studentDetail.student?.full_name}
                  </h2>
                  {studentDetail.student?.phone && (
                    <p className="text-gray-500 text-sm font-bold" dir="ltr">
                      📱 {studentDetail.student.phone}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusBadge(studentDetail.attempt?.status).cls}`}>
                  {getStatusBadge(studentDetail.attempt?.status).text}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-bold">🕐 وقت الدخول</div>
                  <div className="font-bold text-gray-900 mt-1" dir="ltr">
                    {formatTime(studentDetail.attempt?.started_at)}
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(studentDetail.attempt?.started_at)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-bold">⏱️ آخر نشاط</div>
                  <div className="font-bold text-gray-900 mt-1" dir="ltr">
                    {studentDetail.attempt?.last_activity_at ? formatTime(studentDetail.attempt.last_activity_at) : '-'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {studentDetail.attempt?.last_activity_at ? formatDate(studentDetail.attempt.last_activity_at) : ''}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-bold">⏳ المدة</div>
                  <div className="font-bold text-gray-900 mt-1">
                    {formatDuration(studentDetail.attempt?.started_at, studentDetail.attempt?.submitted_at)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-bold">🎯 الدرجة</div>
                  <div className="font-bold text-gray-900 mt-1" dir="ltr">
                    {studentDetail.attempt?.status === 'submitted'
                      ? `${studentDetail.attempt.total_score} / ${selectedExam.total_points}`
                      : 'قيد الحل'}
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ الإجابات */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📝 الإجابات ({studentDetail.answers?.length || 0} سؤال)
              </h3>

              {(!studentDetail.answers || studentDetail.answers.length === 0) ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-gray-500 font-bold">لسه مجاوبش على أي سؤال</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentDetail.answers.map((ans, idx) => {
                    let options = []
                    try {
                      options = typeof ans.options === 'string' ? JSON.parse(ans.options) : (ans.options || [])
                      if (typeof options === 'string') options = JSON.parse(options)
                    } catch (e) { options = [] }

                    let studentAnswer = []
                    try {
                      studentAnswer = typeof ans.answer === 'string' ? JSON.parse(ans.answer) : (ans.answer || [])
                      if (typeof studentAnswer === 'string') studentAnswer = JSON.parse(studentAnswer)
                    } catch (e) { studentAnswer = [ans.answer] }

                    return (
                      <div key={ans.id} className={`p-4 rounded-lg border-2 ${
                        studentDetail.attempt?.status === 'submitted'
                          ? (ans.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50')
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">
                              {ans.question_order || idx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                              {ans.question_type === 'multiple_choice' ? 'اختيار متعدد' :
                               ans.question_type === 'image' ? 'صورة' :
                               ans.question_type === 'audio' ? 'صوت' :
                               ans.question_type === 'matching' ? 'مطابقة' : 'نص'}
                            </span>
                            {studentDetail.attempt?.status === 'submitted' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                ans.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                              }`}>
                                {ans.is_correct ? `✅ +${ans.awarded_points}` : `❌ 0`}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-bold" dir="ltr">
                            {formatTime(ans.updated_at || ans.answered_at)}
                          </span>
                        </div>

                        {ans.question_text && (
                          <p className="text-gray-800 font-bold mb-3 text-sm">{ans.question_text}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-1">✏️ إجابة الطالب:</div>
                            <div className="bg-white rounded-lg p-2 border border-gray-200">
                              {studentAnswer.map((a, i) => (
                                <div key={i} className="font-bold text-gray-800">
                                  {options[a] !== undefined && !isNaN(Number(a))
                                    ? options[a]
                                    : typeof a === 'object' ? JSON.stringify(a) : a}
                                </div>
                              ))}
                              {studentAnswer.length === 0 && (
                                <span className="text-gray-400 italic">لم يجب</span>
                              )}
                            </div>
                          </div>
                          {studentDetail.attempt?.status === 'submitted' && (
                            <div>
                              <div className="text-xs font-bold text-gray-500 mb-1">✅ الإجابة الصحيحة:</div>
                              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                                {(() => {
                                  let correct = []
                                  try {
                                    correct = typeof ans.correct_answers === 'string' ? JSON.parse(ans.correct_answers) : (ans.correct_answers || [])
                                    if (typeof correct === 'string') correct = JSON.parse(correct)
                                  } catch (e) { correct = [] }
                                  return correct.map((c, i) => (
                                    <div key={i} className="font-bold text-green-800">
                                      {options[c] !== undefined && !isNaN(Number(c))
                                        ? options[c]
                                        : typeof c === 'object' ? JSON.stringify(c) : c}
                                    </div>
                                  ))
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}