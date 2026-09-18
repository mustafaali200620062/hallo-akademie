'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QuestionBuilder from './QuestionBuilder'

export default function LehrerExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [teacherId, setTeacherId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: '',
    level_id: '',
    starts_at_year: '',
    starts_at_month: '',
    starts_at_day: '',
    starts_at_hour: '',
    starts_at_minute: '',
    starts_at_ampm: 'AM',
    ends_at_year: '',
    ends_at_month: '',
    ends_at_day: '',
    ends_at_hour: '',
    ends_at_minute: '',
    ends_at_ampm: 'AM',
    duration_minutes: '',
    total_points: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

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
    setTeacherId(parsed.id)
    await fetchData(parsed.id)
  }

  const fetchData = async (tId) => {
    try {
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) {
        const teacherGroups = groupsData.filter(g => g.teacher_id === tId)
        setGroups(teacherGroups || [])
      }

      const examsRes = await fetch('/api/exams')
      const examsData = await examsRes.json()
      if (examsRes.ok) {
        const teacherExams = examsData.filter(e => e.created_by === tId)
        setExams(teacherExams || [])
      }

      const levelsRes = await fetch('/api/levels')
      const levelsData = await levelsRes.json()
      if (levelsRes.ok) setLevels(levelsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  // ✅ تحويل الوقت لصيغة 24 ساعة
  const to24Hour = (hour, ampm) => {
    let h = parseInt(hour)
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return h.toString().padStart(2, '0')
  }

  // ✅ تحديث الأسئلة
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  // ✅ إضافة سؤال جديد
  const addQuestion = (type) => {
    const baseQuestion = {
      question_text: '',
      question_type: type,
      options: ['', '', '', ''],
      correct_answers: [],
      media_url: '',
      media_type: '',
      points: 1,
      explanation: ''
    }

    if (type === 'matching') {
      baseQuestion.options = [{ left: '', right: '' }]
    }

    setQuestions([...questions, baseQuestion])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const startMonth = formData.starts_at_month.padStart(2, '0')
      const startDay = formData.starts_at_day.padStart(2, '0')
      const startDate = `${formData.starts_at_year}-${startMonth}-${startDay}T${to24Hour(formData.starts_at_hour, formData.starts_at_ampm)}:${formData.starts_at_minute.padStart(2, '0')}:00`

      const endMonth = formData.ends_at_month.padStart(2, '0')
      const endDay = formData.ends_at_day.padStart(2, '0')
      const endDate = `${formData.ends_at_year}-${endMonth}-${endDay}T${to24Hour(formData.ends_at_hour, formData.ends_at_ampm)}:${formData.ends_at_minute.padStart(2, '0')}:00`

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          group_id: formData.group_id,
          level_id: formData.level_id,
          starts_at: startDate,
          ends_at: endDate,
          duration_minutes: formData.duration_minutes,
          total_points: formData.total_points,
          created_by: teacherId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      const examId = data.id || data.exam?.id

      // إضافة الأسئلة
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        await fetch('/api/exam-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: examId,
            question_order: i + 1,
            question_type: q.question_type,
            question_text: q.question_text,
            media_url: q.media_url || null,
            media_type: q.media_type || null,
            options: JSON.stringify(q.options),
            correct_answers: JSON.stringify(q.correct_answers || []),
            correct_answer: JSON.stringify(q.correct_answers || []),
            points: q.points,
            explanation: q.explanation || '',
          })
        })
      }

      setSuccess('✅ تم إنشاء الاختبار بنجاح!')
      await fetchData(teacherId)
      setShowForm(false)
      setQuestions([])
      setFormData({
        title: '',
        description: '',
        group_id: '',
        level_id: '',
        starts_at_year: '',
        starts_at_month: '',
        starts_at_day: '',
        starts_at_hour: '',
        starts_at_minute: '',
        starts_at_ampm: 'AM',
        ends_at_year: '',
        ends_at_month: '',
        ends_at_day: '',
        ends_at_hour: '',
        ends_at_minute: '',
        ends_at_ampm: 'AM',
        duration_minutes: '',
        total_points: ''
      })
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ تغيير حالة الاختبار (تشغيل / إيقاف)
  const handleToggleStatus = async (examId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'scheduled' : 'active'

    try {
      const response = await fetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: examId,
          status: newStatus
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(`✅ تم ${newStatus === 'active' ? 'تشغيل' : 'إيقاف'} الاختبار`)
      await fetchData(teacherId)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return

    try {
      const response = await fetch(`/api/exams?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      await fetchData(teacherId)
    } catch (error) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">إدارة الاختبارات</h1>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 font-bold">
            {success}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 font-bold">
            إجمالي الاختبارات: <span className="font-extrabold">{exams.length}</span>
          </p>
          {groups.length > 0 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              {showForm ? '× إلغاء' : '+ إضافة اختبار جديد'}
            </button>
          )}
        </div>

        {showForm && groups.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">إضافة اختبار جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">عنوان الاختبار</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="اختبار المستوى A1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows="2"
                  placeholder="وصف الاختبار..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700">المجموعة</label>
                  <select
                    required
                    value={formData.group_id}
                    onChange={(e) => {
                      const group = groups.find(g => g.id === e.target.value)
                      setFormData({
                        ...formData,
                        group_id: e.target.value,
                        level_id: group?.level_id || ''
                      })
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">اختر المجموعة</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} - {group.level_code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">المستوى</label>
                  <select
                    required
                    value={formData.level_id}
                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.code} - {level.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* تاريخ البدء */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-2">📅 تاريخ البدء (Start Date)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <input
                      type="number"
                      min="2024"
                      max="2100"
                      required
                      value={formData.starts_at_year}
                      onChange={(e) => setFormData({ ...formData, starts_at_year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="2026"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Month</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={formData.starts_at_month}
                      onChange={(e) => setFormData({ ...formData, starts_at_month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="9"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={formData.starts_at_day}
                      onChange={(e) => setFormData({ ...formData, starts_at_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="18"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hour</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={formData.starts_at_hour}
                      onChange={(e) => setFormData({ ...formData, starts_at_hour: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="9"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minute</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      required
                      value={formData.starts_at_minute}
                      onChange={(e) => setFormData({ ...formData, starts_at_minute: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="30"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">AM/PM</label>
                  <select
                    value={formData.starts_at_ampm}
                    onChange={(e) => setFormData({ ...formData, starts_at_ampm: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    dir="ltr"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* تاريخ الانتهاء */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-2">📅 تاريخ الانتهاء (End Date)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <input
                      type="number"
                      min="2024"
                      max="2100"
                      required
                      value={formData.ends_at_year}
                      onChange={(e) => setFormData({ ...formData, ends_at_year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="2026"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Month</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={formData.ends_at_month}
                      onChange={(e) => setFormData({ ...formData, ends_at_month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="9"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={formData.ends_at_day}
                      onChange={(e) => setFormData({ ...formData, ends_at_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="18"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hour</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={formData.ends_at_hour}
                      onChange={(e) => setFormData({ ...formData, ends_at_hour: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="11"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minute</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      required
                      value={formData.ends_at_minute}
                      onChange={(e) => setFormData({ ...formData, ends_at_minute: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="30"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">AM/PM</label>
                  <select
                    value={formData.ends_at_ampm}
                    onChange={(e) => setFormData({ ...formData, ends_at_ampm: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    dir="ltr"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700">المدة (دقائق)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="60"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">الدرجة الكلية</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={formData.total_points}
                    onChange={(e) => setFormData({ ...formData, total_points: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="100"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* الأسئلة */}
              <div className="border-t-2 border-gray-200 pt-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  الأسئلة ({questions.length})
                </label>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button type="button" onClick={() => addQuestion('multiple_choice')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
                    + اختيار من متعدد
                  </button>
                  <button type="button" onClick={() => addQuestion('matching')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700">
                    + مطابقة
                  </button>
                  <button type="button" onClick={() => addQuestion('image')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                    + صورة
                  </button>
                  <button type="button" onClick={() => addQuestion('audio')} className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-700">
                    + صوتي
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <QuestionBuilder
                    key={idx}
                    question={q}
                    index={idx}
                    onUpdate={updateQuestion}
                    onDelete={(i) => setQuestions(questions.filter((_, index) => index !== i))}
                  />
                ))}

                {questions.length === 0 && (
                  <p className="text-gray-500 text-sm font-bold text-center py-4">
                    لم تضف أي أسئلة بعد.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                ✅ إنشاء الاختبار
              </button>
            </form>
          </div>
        )}

        {groups.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ⚠️ لا توجد مجموعات مخصصة لك. لا يمكنك إنشاء اختبارات.
          </div>
        )}

        {/* جدول الاختبارات */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المدة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">📝</div>
                      لا توجد اختبارات
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{exam.title}</td>
                      <td className="px-6 py-4 text-gray-600 font-bold">{exam.group_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {exam.level_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-bold">{exam.duration_minutes} دقيقة</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          exam.status === 'active' ? 'bg-green-100 text-green-800' : 
                          exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status === 'active' ? '✅ نشط' : 
                           exam.status === 'scheduled' ? '⏰ مجدول' : 
                           '⚪ منتهي'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => router.push(`/lehrer/exams/${exam.id}/preview`)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold hover:bg-blue-200 transition-colors text-sm"
                          >
                            👁️ معاينة
                          </button>
                          <button
                            onClick={() => handleToggleStatus(exam.id, exam.status)}
                            className={`px-3 py-1 rounded-lg font-bold transition-colors text-sm ${
                              exam.status === 'active'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {exam.status === 'active' ? '⏸️ إيقاف' : '▶️ تشغيل'}
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold hover:bg-red-200 transition-colors text-sm"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}