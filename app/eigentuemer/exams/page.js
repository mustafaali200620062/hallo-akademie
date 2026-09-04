'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [currentExamId, setCurrentExamId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: '',
    level_id: '',
    starts_at: '',
    ends_at: '',
    duration_minutes: '',
    total_points: '',
    material_type: 'text'
  })
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    media_type: 'text',
    media_url: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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
      const examsRes = await fetch('/api/exams')
      const examsData = await examsRes.json()
      if (examsRes.ok) setExams(examsData || [])

      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) setGroups(groupsData || [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إنشاء الاختبار بنجاح!')
      setCurrentExamId(data.id)
      setShowQuestions(true)
      setShowForm(false)
      await fetchData()

    } catch (error) {
      setError(error.message)
    }
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/exam-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: currentExamId,
          ...questionForm,
          options: questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'matching' ? questionForm.options : []
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إضافة السؤال بنجاح!')
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        media_type: 'text',
        media_url: ''
      })
      await fetchQuestions()

    } catch (error) {
      setError(error.message)
    }
  }

  const fetchQuestions = async () => {
    if (!currentExamId) return
    try {
      const res = await fetch(`/api/exam-questions?examId=${currentExamId}`)
      const data = await res.json()
      if (res.ok) setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleDeleteExam = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return

    try {
      const response = await fetch(`/api/exams?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      await fetchData()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleDeleteQuestion = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return

    try {
      const response = await fetch(`/api/exam-questions?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      await fetchQuestions()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options]
    newOptions[index] = value
    setQuestionForm({ ...questionForm, options: newOptions })
  }

  const addOption = () => {
    setQuestionForm({ ...questionForm, options: [...questionForm.options, ''] })
  }

  const removeOption = (index) => {
    const newOptions = questionForm.options.filter((_, i) => i !== index)
    setQuestionForm({ ...questionForm, options: newOptions })
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
      {/* الهيدر */}
      <div className="bg-yellow-400 text-black shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-extrabold">إدارة الاختبارات</h1>
            </div>
            <button 
              onClick={() => router.push('/eigentuemer')}
              className="bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ✅ {success}
          </div>
        )}

        {/* زر الإضافة */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 font-bold">إجمالي الاختبارات: <span className="font-extrabold">{exams.length}</span></p>
          {!showQuestions && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-extrabold hover:bg-yellow-500 transition-colors"
            >
              {showForm ? '× إلغاء' : '+ إضافة اختبار جديد'}
            </button>
          )}
          {showQuestions && (
            <button
              onClick={() => {
                setShowQuestions(false)
                setCurrentExamId(null)
                setQuestions([])
                setShowForm(false)
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-extrabold hover:bg-gray-700 transition-colors"
            >
              ← العودة للاختبارات
            </button>
          )}
        </div>

        {/* نموذج إضافة اختبار */}
        {showForm && !showQuestions && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">📝 اختبار جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الاختبار</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                    placeholder="اختبار المستوى A1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المدة (دقائق)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المجموعة المستهدفة</label>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    required
                    value={formData.level_id}
                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ البدء</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الدرجة الكلية</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  value={formData.total_points}
                  onChange={(e) => setFormData({ ...formData, total_points: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نوع مادة الاختبار</label>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {['PDF', 'صوت', 'صورة', 'نص'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="material_type"
                        value={type === 'PDF' ? 'pdf' : type === 'صوت' ? 'audio' : type === 'صورة' ? 'image' : 'text'}
                        checked={formData.material_type === (type === 'PDF' ? 'pdf' : type === 'صوت' ? 'audio' : type === 'صورة' ? 'image' : 'text')}
                        onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                        className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="font-medium text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  rows="3"
                  placeholder="وصف الاختبار..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-extrabold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/25"
              >
                ✅ إنشاء الاختبار
              </button>
            </form>
          </div>
        )}

        {/* نموذج إضافة أسئلة */}
        {showQuestions && currentExamId && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 flex items-center gap-2">
              📝 إضافة أسئلة
              <span className="text-sm font-bold text-gray-500">
                ({questions.length} سؤال)
              </span>
            </h2>

            <form onSubmit={handleAddQuestion} className="space-y-6">
              {/* نوع السؤال */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نوع السؤال</label>
                <select
                  value={questionForm.question_type}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                >
                  <option value="multiple_choice">اختيار من متعدد</option>
                  <option value="true_false">صح / خطأ</option>
                  <option value="text">إجابة نصية</option>
                  <option value="matching">مطابقة</option>
                  <option value="complete">أكمل</option>
                </select>
              </div>

              {/* نص السؤال */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نص السؤال</label>
                <textarea
                  required
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  rows="3"
                  placeholder="اكتب نص السؤال هنا..."
                />
              </div>

              {/* إضافة وسائط */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">إضافة وسائط (اختياري)</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="text"
                      checked={questionForm.media_type === 'text'}
                      onChange={() => setQuestionForm({ ...questionForm, media_type: 'text', media_url: '' })}
                      className="w-4 h-4 text-yellow-400"
                    />
                    <span className="font-medium text-gray-700">نص فقط</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="image"
                      checked={questionForm.media_type === 'image'}
                      onChange={() => setQuestionForm({ ...questionForm, media_type: 'image' })}
                      className="w-4 h-4 text-yellow-400"
                    />
                    <span className="font-medium text-gray-700">🖼️ صورة</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="audio"
                      checked={questionForm.media_type === 'audio'}
                      onChange={() => setQuestionForm({ ...questionForm, media_type: 'audio' })}
                      className="w-4 h-4 text-yellow-400"
                    />
                    <span className="font-medium text-gray-700">🎵 صوت</span>
                  </label>
                </div>
                {questionForm.media_type !== 'text' && (
                  <input
                    type="url"
                    value={questionForm.media_url}
                    onChange={(e) => setQuestionForm({ ...questionForm, media_url: e.target.value })}
                    className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                    placeholder="رابط الملف (صورة أو صوت)"
                  />
                )}
              </div>

              {/* الخيارات (لاختيار من متعدد و مطابقة) */}
              {(questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'matching') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الخيارات</label>
                  <div className="space-y-2">
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                          placeholder={`خيار ${index + 1}`}
                        />
                        {questionForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 font-bold transition-colors"
                  >
                    + إضافة خيار
                  </button>
                </div>
              )}

              {/* الإجابة الصحيحة */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {questionForm.question_type === 'true_false' ? 'الإجابة الصحيحة' : 
                   questionForm.question_type === 'text' ? 'الإجابة النموذجية' : 
                   questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'matching' ? 'الإجابة الصحيحة' :
                   'الإجابة الصحيحة'}
                </label>
                {questionForm.question_type === 'true_false' ? (
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  >
                    <option value="true">صح ✅</option>
                    <option value="false">خطأ ❌</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                    placeholder={
                      questionForm.question_type === 'multiple_choice' ? 'اكتب النص المطابق لأحد الخيارات' :
                      questionForm.question_type === 'text' ? 'اكتب الإجابة النموذجية' :
                      questionForm.question_type === 'matching' ? 'اكتب المطابقة الصحيحة' :
                      'الإجابة الصحيحة'
                    }
                  />
                )}
              </div>

              {/* الدرجة */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">درجة السؤال</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) })}
                  className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  placeholder="1"
                />
              </div>

              {/* شرح الإجابة */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">شرح الإجابة (اختياري)</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  rows="2"
                  placeholder="شرح الإجابة..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-extrabold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/25"
              >
                ✅ إضافة السؤال
              </button>
            </form>

            {/* قائمة الأسئلة المضافة */}
            {questions.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-xl font-extrabold mb-4 text-gray-900">📋 الأسئلة المضافة</h3>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={q.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-gray-900">سؤال {index + 1}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            {q.question_type === 'multiple_choice' ? 'اختيار من متعدد' :
                             q.question_type === 'true_false' ? 'صح/خطأ' :
                             q.question_type === 'text' ? 'نص' :
                             q.question_type === 'matching' ? 'مطابقة' :
                             q.question_type === 'complete' ? 'أكمل' : q.question_type}
                          </span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                            {q.points} نقطة
                          </span>
                          {q.media_type !== 'text' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                              {q.media_type === 'image' ? '🖼️' : '🎵'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 font-medium mt-1">{q.question_text}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {q.options.map((opt, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                        {q.correct_answer && (
                          <p className="text-sm text-green-600 font-bold mt-1">
                            ✅ الإجابة الصحيحة: {q.correct_answer}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* قائمة الاختبارات */}
        {!showQuestions && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">العنوان</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">المجموعة</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">المستوى</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">المدة</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">الأسئلة</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-bold">
                        <div className="text-4xl mb-2">📝</div>
                        لا توجد اختبارات
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-gray-900">{exam.title}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{exam.group_name || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            {exam.level_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{exam.duration_minutes} دقيقة</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {exam._count?.questions || 0}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            exam.status === 'active' ? 'bg-green-100 text-green-800' : 
                            exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {exam.status === 'active' ? '🟢 نشط' : 
                             exam.status === 'scheduled' ? '🟡 مجدول' : 
                             '⚪ منتهي'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setCurrentExamId(exam.id)
                              setShowQuestions(true)
                              fetchQuestions()
                            }}
                            className="text-yellow-600 hover:text-yellow-800 font-bold transition-colors mr-3"
                          >
                            ✏️ إضافة أسئلة
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-600 hover:text-red-800 font-bold transition-colors"
                          >
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}