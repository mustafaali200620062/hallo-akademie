'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerLessonsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lessons, setLessons] = useState([])
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    content_url: '',
    content_type: 'text',
    group_id: '',
    level_id: '',
    is_published: false
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
    await fetchData(parsed.id)
  }

  const fetchData = async (teacherId) => {
    try {
      // ✅ جلب مجموعات المدرس
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) {
        const teacherGroups = groupsData.filter(g => g.teacher_id === teacherId)
        setGroups(teacherGroups || [])
      }

      // ✅ جلب الشروح
      const lessonsRes = await fetch('/api/lessons')
      const lessonsData = await lessonsRes.json()
      if (lessonsRes.ok) {
        const teacherLessons = lessonsData.filter(l => l.created_by === teacherId)
        setLessons(teacherLessons || [])
      }

      // ✅ جلب المستويات
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

  // ✅ إضافة شرح يدوي
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const userData = JSON.parse(localStorage.getItem('user'))

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: userData.id,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إضافة الشرح بنجاح!')
      await fetchData(userData.id)
      setShowForm(false)
      setFormData({
        title: '',
        description: '',
        content: '',
        content_url: '',
        content_type: 'text',
        group_id: '',
        level_id: '',
        is_published: false
      })

    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ حذف شرح
  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشرح؟')) return

    try {
      const response = await fetch(`/api/lessons?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      const userData = JSON.parse(localStorage.getItem('user'))
      await fetchData(userData.id)
    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ معاينة ملف
  const handlePreview = async (lessonId) => {
    try {
      const res = await fetch(`/api/files/${lessonId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      window.open(data.url, '_blank', 'noopener,noreferrer')
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
      <div className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">الشرح</h1>
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
            إجمالي الشروح: <span className="font-extrabold">{lessons.length}</span>
          </p>
          {groups.length > 0 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              {showForm ? '× إلغاء' : '+ إضافة شرح جديد'}
            </button>
          )}
        </div>

        {showForm && groups.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">إضافة شرح جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">عنوان الشرح</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="عنوان الشرح"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows="2"
                  placeholder="وصف الشرح..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">المحتوى (نص)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows="4"
                  placeholder="محتوى الشرح..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700">نوع المحتوى</label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="text">نص</option>
                    <option value="pdf">PDF</option>
                    <option value="image">صورة</option>
                    <option value="audio">مقطع صوتي</option>
                    <option value="video">فيديو</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">رابط الملف (اختياري)</label>
                  <input
                    type="url"
                    value={formData.content_url}
                    onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="text-sm font-bold text-gray-700">نشر الشرح فوراً</label>
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                ✅ إضافة الشرح
              </button>
            </form>
          </div>
        )}

        {groups.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ⚠️ لا توجد مجموعات مخصصة لك. لا يمكنك إنشاء شروح.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lessons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">📚</div>
                      لا توجد شروح
                    </td>
                  </tr>
                ) : (
                  lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{lesson.title}</td>
                      <td className="px-6 py-4 text-gray-600 font-bold">{lesson.group_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {lesson.level_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                          {lesson.content_type === 'text' ? 'نص' :
                           lesson.content_type === 'pdf' ? 'PDF' :
                           lesson.content_type === 'image' ? 'صورة' :
                           lesson.content_type === 'audio' ? 'صوتي' :
                           lesson.content_type === 'video' ? 'فيديو' : lesson.content_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${lesson.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {lesson.is_published ? 'منشور' : 'مسودة'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lesson.content_url && (
                          <button
                            onClick={() => handlePreview(lesson.id)}
                            className="text-blue-600 hover:text-blue-800 font-bold transition-colors mr-3"
                          >
                            👁️ معاينة
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(lesson.id)}
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
      </div>
    </div>
  )
}