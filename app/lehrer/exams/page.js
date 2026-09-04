'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: '',
    level_id: '',
    starts_at: '',
    ends_at: '',
    duration_minutes: '',
    total_points: ''
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchData()
  }, [])

  const checkUser = async () => {
    const res = await fetch('/api/auth/session')
    const session = await res.json()
    if (!session?.user) {
      router.push('/login')
      return
    }
  }

  const fetchData = async () => {
    try {
      // جلب المجموعات التي يدرسها المدرس
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) {
        // تصفية المجموعات للمدرس الحالي
        const userRes = await fetch('/api/auth/session')
        const session = await userRes.json()
        const teacherGroups = groupsData.filter(g => g.teacher_id === session?.user?.id)
        setGroups(teacherGroups || [])
      }

      // جلب الاختبارات التي أنشأها المدرس
      const examsRes = await fetch('/api/exams')
      const examsData = await examsRes.json()
      if (examsRes.ok) {
        const userRes = await fetch('/api/auth/session')
        const session = await userRes.json()
        const teacherExams = examsData.filter(e => e.created_by === session?.user?.id)
        setExams(teacherExams || [])
      }

      // جلب المستويات
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

      await fetchData()
      setShowForm(false)
      setFormData({
        title: '',
        description: '',
        group_id: '',
        level_id: '',
        starts_at: '',
        ends_at: '',
        duration_minutes: '',
        total_points: ''
      })

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

      await fetchData()
    } catch (error) {
      setError(error.message)
    }
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
      {/* الهيدر */}
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

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* زر الإضافة */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">إجمالي الاختبارات: <span className="font-bold">{exams.length}</span></p>
          {groups.length > 0 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              {showForm ? '× إلغاء' : '+ إضافة اختبار جديد'}
            </button>
          )}
        </div>

        {/* نموذج الإضافة */}
        {showForm && groups.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">إضافة اختبار جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">عنوان الاختبار</label>
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
                <label className="block text-sm font-medium text-gray-700">الوصف</label>
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
                  <label className="block text-sm font-medium text-gray-700">المجموعة</label>
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
                  <label className="block text-sm font-medium text-gray-700">المستوى</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ البدء</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">المدة (دقائق)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">الدرجة الكلية</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={formData.total_points}
                    onChange={(e) => setFormData({ ...formData, total_points: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ إنشاء الاختبار
              </button>
            </form>
          </div>
        )}

        {groups.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
            ⚠️ لا توجد مجموعات مخصصة لك. لا يمكنك إنشاء اختبارات.
          </div>
        )}

        {/* قائمة الاختبارات */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      لا توجد اختبارات
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{exam.title}</td>
                      <td className="px-6 py-4 text-gray-600">{exam.group_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {exam.level_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{exam.duration_minutes} دقيقة</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${exam.status === 'active' ? 'bg-green-100 text-green-800' : exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {exam.status === 'active' ? 'نشط' : exam.status === 'scheduled' ? 'مجدول' : 'منتهي'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
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