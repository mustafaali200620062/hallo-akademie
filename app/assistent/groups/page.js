'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssistentGroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [teachers, setTeachers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    level_id: '',
    teacher_id: '',
    description: ''
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
      // جلب المجموعات
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) setGroups(groupsData || [])

      // ✅ جلب المستويات - مع Fallback
      try {
        const levelsRes = await fetch('/api/levels')
        const levelsData = await levelsRes.json()
        if (levelsRes.ok && levelsData.length > 0) {
          setLevels(levelsData)
        } else {
          setLevels([
            { id: '1', code: 'A1', title: 'مبتدئ' },
            { id: '2', code: 'A2', title: 'أساسي' },
            { id: '3', code: 'B1', title: 'متوسط' },
            { id: '4', code: 'B2', title: 'فوق متوسط' }
          ])
        }
      } catch (levelError) {
        console.error('Error fetching levels:', levelError)
        setLevels([
          { id: '1', code: 'A1', title: 'مبتدئ' },
          { id: '2', code: 'A2', title: 'أساسي' },
          { id: '3', code: 'B1', title: 'متوسط' },
          { id: '4', code: 'B2', title: 'فوق متوسط' }
        ])
      }

      // ✅ جلب المدرسين - مع Fallback لو فشل
      try {
        const teachersRes = await fetch('/api/teachers')
        const teachersData = await teachersRes.json()
        if (teachersRes.ok && teachersData.length > 0) {
          setTeachers(teachersData)
        } else {
          // ✅ Fallback: جلب المدرسين من API أخرى أو استخدام بيانات افتراضية
          console.warn('No teachers found from API, using fallback')
          setTeachers([])
        }
      } catch (teacherError) {
        console.error('Error fetching teachers:', teacherError)
        setTeachers([])
      }

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

    if (!formData.level_id) {
      setError('يرجى اختيار المستوى')
      return
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacher_id: formData.teacher_id || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إنشاء المجموعة بنجاح!')
      await fetchData()
      setShowForm(false)
      setFormData({
        name: '',
        level_id: '',
        teacher_id: '',
        description: ''
      })

    } catch (error) {
      setError(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return

    try {
      const response = await fetch(`/api/groups?id=${id}`, {
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
      {/* الهيدر */}
      <div className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">إدارة المجموعات</h1>
            </div>
            <button 
              onClick={() => router.push('/assistent')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
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
          <p className="text-gray-600 font-bold">
            إجمالي المجموعات: <span className="font-extrabold">{groups.length}</span>
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            {showForm ? '× إلغاء' : '+ إضافة مجموعة جديدة'}
          </button>
        </div>

        {/* نموذج الإضافة */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">📚 مجموعة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  اسم المجموعة *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  placeholder="مثال: A1-01"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  المستوى *
                </label>
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

              {/* ✅ اختيار المدرس - مع عرض المدرسين المتاحين */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  المدرس المسؤول
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                >
                  <option value="">اختر المدرس (اختياري)</option>
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name || teacher.name || 'مدرس'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>⚠️ لا يوجد مدرسين متاحين</option>
                  )}
                </select>
                {teachers.length === 0 && (
                  <p className="text-sm text-yellow-600 font-bold mt-1">
                    ⚠️ لا يوجد مدرسين مسجلين حالياً
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-900 font-medium transition-colors"
                  rows="3"
                  placeholder="وصف المجموعة..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-extrabold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/25"
              >
                ✅ إنشاء المجموعة
              </button>
            </form>
          </div>
        )}

        {/* قائمة المجموعات */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    المستوى
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    المدرس
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">📭</div>
                      لا توجد مجموعات
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-gray-900">{group.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {group.level_code} - {group.level_title}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {group.teacher_name || 'غير معين'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          group.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {group.is_active ? '✅ نشطة' : '❌ غير نشطة'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(group.id)}
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