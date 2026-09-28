'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TeachersManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [allLevels, setAllLevels] = useState([])
  const [teacherLevelsMap, setTeacherLevelsMap] = useState({}) // { teacherId: [levelIds] }
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    levels: []
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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
      // ✅ جلب المدرسين + المستويات بالتوازي
      const [teachersRes, levelsRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/levels')
      ])

      const teachersData = await teachersRes.json()
      const levelsData = await levelsRes.json()

      if (teachersRes.ok) setTeachers(teachersData || [])
      if (levelsRes.ok) setAllLevels(levelsData || [])

      // ✅ جلب مستويات كل مدرس
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

    } catch (error) {
      setError(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرس؟')) return

    try {
      const response = await fetch(`/api/admin/remove-teacher?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      await fetchAll()
    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ عرض أسماء المستويات
  const getLevelCodes = (teacherId) => {
    const levelIds = teacherLevelsMap[teacherId] || []
    if (levelIds.length === 0) return null
    return levelIds
      .map(id => allLevels.find(l => l.id === id)?.code)
      .filter(Boolean)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
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
              <h1 className="text-2xl font-bold">إدارة المدرسين</h1>
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

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 font-bold">عدد المدرسين: <span className="font-extrabold">{teachers.length}</span></p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
          >
            {showForm ? '× إلغاء' : '+ إضافة مدرس جديد'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">إضافة مدرس جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="teacher@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">كلمة المرور الافتراضية: 123123</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="أحمد محمد"
                />
              </div>

              {/* ✅ المستويات */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  🎓 المستويات التي سيدرّسها <span className="text-red-500">*</span>
                </label>

                {allLevels.length === 0 ? (
                  <p className="text-gray-500 text-sm font-bold">لا توجد مستويات متاحة</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allLevels.map((level) => {
                      const isSelected = formData.levels.includes(level.id)
                      return (
                        <label
                          key={level.id}
                          className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-green-50 border-green-400 shadow-md'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleLevelToggle(level.id)}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                          <div>
                            <div className={`font-extrabold ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>
                              {level.code}
                            </div>
                            <div className="text-xs text-gray-500 font-bold">{level.title}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}

                {formData.levels.length > 0 && (
                  <p className="text-xs text-green-700 font-bold mt-3">
                    ✅ تم اختيار {formData.levels.length} مستوى
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                ✅ إضافة المدرس
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">👨‍🏫</div>
                      لا يوجد مدرسين
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => {
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
                          {new Date(teacher.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            className="text-red-600 hover:text-red-800 font-bold transition-colors"
                          >
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}