'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TeachersManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [allLevels, setAllLevels] = useState([])
  const [teacherLevelsMap, setTeacherLevelsMap] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    levels: []
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    checkUser()
    fetchAll()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'Eigentümer') {
      router.push('/unauthorized')
      return
    }
  }

  const fetchAll = async () => {
    try {
      const [teachersRes, levelsRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/levels')
      ])

      const teachersData = await teachersRes.json()
      const levelsData = await levelsRes.json()

      if (teachersRes.ok) setTeachers(teachersData || [])
      if (levelsRes.ok) setAllLevels(levelsData || [])

      if (teachersRes.ok && Array.isArray(teachersData)) {
        const levelsMap = {}
        for (const teacher of teachersData) {
          try {
            const tlRes = await fetch(`/api/admin/teacher-levels?teacher_id=${teacher.id}`)
            const tlData = await tlRes.json()
            if (tlRes.ok && Array.isArray(tlData)) {
              levelsMap[teacher.id] = tlData.map(item => item.level_id)
            } else {
              levelsMap[teacher.id] = []
            }
          } catch (e) {
            levelsMap[teacher.id] = []
          }
        }
        setTeacherLevelsMap(levelsMap)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLevelToggle = (levelId) => {
    setFormData(prev => {
      const isSelected = prev.levels.includes(levelId)
      return {
        ...prev,
        levels: isSelected
          ? prev.levels.filter(id => id !== levelId)
          : [...prev.levels, levelId]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (formData.levels.length === 0) {
      setError('⚠️ الرجاء اختيار مستوى واحد على الأقل')
      return
    }

    try {
      const response = await fetch('/api/admin/add-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          levels: formData.levels
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إضافة المدرس بنجاح! كلمة المرور الافتراضية: 123123')
      setShowForm(false)
      setFormData({ email: '', full_name: '', levels: [] })
      await fetchAll()
      setTimeout(() => setSuccess(null), 5000)

    } catch (error) {
      setError(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرس؟')) return

    setDeleting(id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/remove-teacher?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم حذف المدرس')
      await fetchAll()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setDeleting(null)
    }
  }

  const getLevelCodes = (teacherId) => {
    const levelIds = teacherLevelsMap[teacherId] || []
    if (levelIds.length === 0) return null
    return levelIds
      .map(id => allLevels.find(l => l.id === id)?.code)
      .filter(Boolean)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-bold truncate">إدارة المدرسين</h1>
            </div>
            <button
              onClick={() => router.push('/eigentuemer')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-4 font-bold text-xs md:text-sm fade-in-up">
            {success}
          </div>
        )}

        {/* Counter + Add Button */}
        <div className="mb-4 md:mb-6 flex justify-between items-center gap-2 flex-wrap">
          <p className="text-gray-600 font-bold text-xs md:text-base">
            عدد المدرسين: <span className="font-extrabold">{teachers.length}</span>
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 text-white px-4 md:px-6 py-2.5 md:py-2 rounded-lg font-bold hover:bg-red-700 transition-colors text-xs md:text-sm active:scale-95"
          >
            {showForm ? '× إلغاء' : '+ إضافة مدرس'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 fade-in-up">
            <h2 className="text-lg md:text-xl font-bold mb-4">إضافة مدرس جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-3.5 md:px-3 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base"
                  placeholder="teacher@example.com"
                  dir="ltr"
                />
                <p className="text-[11px] md:text-xs text-gray-500 mt-1">كلمة المرور الافتراضية: 123123</p>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="block w-full px-3.5 md:px-3 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base"
                  placeholder="أحمد محمد"
                />
              </div>

              {/* Levels */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-3">
                  🎓 المستويات التي سيدرّسها <span className="text-red-500">*</span>
                </label>

                {allLevels.length === 0 ? (
                  <p className="text-gray-500 text-xs md:text-sm font-bold">لا توجد مستويات متاحة</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {allLevels.map((level) => {
                      const isSelected = formData.levels.includes(level.id)
                      return (
                        <label
                          key={level.id}
                          className={`flex items-center gap-2 p-2.5 md:p-3 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-green-50 border-green-400 shadow-md'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleLevelToggle(level.id)}
                            className="w-5 h-5 text-green-600 rounded flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className={`font-extrabold text-sm md:text-base ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>
                              {level.code}
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500 font-bold truncate">{level.title}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}

                {formData.levels.length > 0 && (
                  <p className="text-[11px] md:text-xs text-green-700 font-bold mt-3">
                    ✅ تم اختيار {formData.levels.length} مستوى
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full md:w-auto bg-green-600 text-white px-6 py-3 md:py-2 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm md:text-base active:scale-95 btn-app"
              >
                ✅ إضافة المدرس
              </button>
            </form>
          </div>
        )}

        {/* Teachers List */}
        {teachers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center text-gray-500 fade-in-up">
            <div className="text-5xl md:text-6xl mb-4">👨‍🏫</div>
            <p className="text-base md:text-lg font-bold">لا يوجد مدرسين</p>
            <p className="text-xs md:text-sm font-bold mt-1">اضغط "إضافة مدرس" للبدء</p>
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الاسم</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">البريد الإلكتروني</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المستويات</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">كلمة المرور</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">تاريخ التسجيل</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teachers.map((teacher) => {
                      const levelCodes = getLevelCodes(teacher.id)
                      return (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-bold text-gray-900">{teacher.full_name}</td>
                          <td className="px-6 py-4 text-gray-600">{teacher.email || 'غير متوفر'}</td>
                          <td className="px-6 py-4">
                            {levelCodes && levelCodes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {levelCodes.map((code, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-extrabold"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs font-bold">بدون مستويات</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded font-mono text-sm font-bold">
                              {teacher.password || '123123'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatDate(teacher.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDelete(teacher.id)}
                              disabled={deleting === teacher.id}
                              className="text-red-600 hover:text-red-800 font-bold transition-colors disabled:opacity-50"
                            >
                              {deleting === teacher.id ? '⏳' : '🗑️'} حذف
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {teachers.map((teacher) => {
                const levelCodes = getLevelCodes(teacher.id)
                return (
                  <div key={teacher.id} className="bg-white rounded-xl shadow-lg p-4 fade-in-up">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md flex-shrink-0">
                        {teacher.full_name?.charAt(0) || 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {teacher.full_name}
                        </h3>
                        <p className="text-xs text-gray-500 font-bold truncate mt-0.5" dir="ltr">
                          📧 {teacher.email || 'غير متوفر'}
                        </p>
                      </div>
                    </div>

                    {/* Levels */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {levelCodes && levelCodes.length > 0 ? (
                        levelCodes.map((code, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-extrabold"
                          >
                            📚 {code}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-[11px] font-bold">بدون مستويات</span>
                      )}
                    </div>

                    {/* Info row */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 font-bold mb-0.5">🔑 كلمة المرور</p>
                        <p className="font-mono font-bold text-gray-900 truncate" dir="ltr">
                          {teacher.password || '123123'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 font-bold mb-0.5">📅 التسجيل</p>
                        <p className="font-bold text-gray-900">
                          {formatDate(teacher.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      disabled={deleting === teacher.id}
                      className="w-full bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      {deleting === teacher.id ? '⏳ جاري الحذف...' : '🗑️ حذف المدرس'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}