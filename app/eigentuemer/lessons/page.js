'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LessonsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lessons, setLessons] = useState([])
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncLevel, setSyncLevel] = useState('')
  const [showSyncForm, setShowSyncForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level_id: '',
    group_id: '',
    is_published: false
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
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'Eigentümer' && parsed.role !== 'Lehrer') {
      router.push('/unauthorized')
      return
    }
  }

  const fetchData = async () => {
    try {
      const lessonsRes = await fetch('/api/lessons')
      const lessonsData = await lessonsRes.json()
      if (lessonsRes.ok) setLessons(lessonsData || [])

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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace('.pdf', '') })
      }
    } else {
      setError('يرجى اختيار ملف PDF فقط')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUploading(true)

    if (!selectedFile) {
      setError('يرجى اختيار ملف PDF')
      setUploading(false)
      return
    }

    try {
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      uploadData.append('title', formData.title)
      uploadData.append('description', formData.description)
      uploadData.append('level_id', formData.level_id)
      uploadData.append('group_id', formData.group_id)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في الرفع')
      }

      setSuccess('✅ تم رفع الملف بنجاح!')
      setShowForm(false)
      setSelectedFile(null)
      setFormData({
        title: '',
        description: '',
        level_id: '',
        group_id: '',
        is_published: false
      })
      await fetchData()

    } catch (error) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  // ✅ دالة المزامنة مع R2
  const handleSyncR2 = async () => {
    if (!syncLevel) {
      setError('يرجى اختيار المستوى أولاً')
      return
    }

    setSyncing(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/r2/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level_id: syncLevel })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ في المزامنة')
      }

      setSuccess(`✅ ${data.message}`)
      await fetchData()
      setSyncLevel('')
      setShowSyncForm(false)
      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      setError(error.message)
    } finally {
      setSyncing(false)
    }
  }

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

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return

    try {
      const response = await fetch(`/api/lessons?id=${id}`, {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">إدارة الشروح</h1>
            </div>
            <button
              onClick={() => router.push('/eigentuemer')}
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

        <div className="mb-6 flex flex-wrap justify-between items-center gap-2">
          <p className="text-gray-600 font-bold">إجمالي الشروح: <span className="font-extrabold">{lessons.length}</span></p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSyncForm(!showSyncForm)
                setShowForm(false)
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              {showSyncForm ? '× إلغاء' : '🔄 مزامنة مع R2'}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm)
                setShowSyncForm(false)
              }}
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              {showForm ? '× إلغاء' : '+ رفع ملف PDF جديد'}
            </button>
          </div>
        </div>

        {/* ✅ نموذج المزامنة مع R2 */}
        {showSyncForm && (
          <div className="bg-blue-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-200">
            <h2 className="text-xl font-bold mb-4 text-blue-900">🔄 مزامنة الملفات من Cloudflare R2</h2>
            <p className="text-sm text-blue-700 mb-4">
              هيتم جلب كل الملفات الموجودة في مجلد <code className="bg-blue-100 px-2 py-0.5 rounded">lessons/</code> على R2 وإضافتها للمنصة.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اختر المستوى للمزامنة *</label>
                <select
                  value={syncLevel}
                  onChange={(e) => setSyncLevel(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl text-gray-900 font-bold"
                >
                  <option value="">اختر المستوى</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.code} - {level.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSyncR2}
                disabled={syncing || !syncLevel}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-extrabold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {syncing ? '⏳ جاري المزامنة...' : '🔄 بدء المزامنة'}
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">رفع ملف PDF جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ملف PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white file:font-bold hover:file:bg-gray-800"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-600 font-bold">
                    ✅ تم اختيار: {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الشرح</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="عنوان الشرح"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الوصف (اختياري)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows="2"
                  placeholder="وصف مختصر..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    required
                    value={formData.level_id}
                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.code} - {level.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المجموعة (اختياري)</label>
                  <select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">كل المجموعات</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} - {group.level_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publish"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="publish" className="text-sm font-bold text-gray-700">نشر الشرح فوراً</label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-extrabold rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
              >
                {uploading ? '⏳ جاري الرفع...' : '📤 رفع الملف'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lessons.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">📚</div>
                      لا توجد شروح
                    </td>
                  </tr>
                ) : (
                  lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{lesson.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {lesson.level_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-bold">{lesson.group_name || 'الكل'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${lesson.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {lesson.is_published ? '✅ منشور' : '⏸️ مسودة'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePreview(lesson.id)}
                          className="text-blue-600 hover:text-blue-800 font-bold transition-colors mr-3"
                        >
                          👁️ معاينة
                        </button>
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