'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EigentuemerGroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [levels, setLevels] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    level_id: '',
    teacher_id: '',
    description: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')

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
    if (parsed.role !== 'Eigentümer' && parsed.role !== 'Assistent') {
      router.push('/unauthorized')
      return
    }
  }

  const fetchData = async () => {
    try {
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) setGroups(groupsData || [])

      const levelsRes = await fetch('/api/levels')
      const levelsData = await levelsRes.json()
      if (levelsRes.ok) setLevels(levelsData || [])

      const teachersRes = await fetch('/api/teachers')
      const teachersData = await teachersRes.json()
      if (teachersRes.ok) setTeachers(teachersData || [])

      const studentsRes = await fetch('/api/students')
      const studentsData = await studentsRes.json()
      if (studentsRes.ok) setStudents(studentsData || [])

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
      const response = await fetch('/api/groups', {
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

  // ✅ فتح نافذة إدارة الطلاب
  const openStudentsModal = async (group) => {
    setSelectedGroup(group)
    await fetchGroupStudents(group.id)
  }

  // ✅ جلب طلاب المجموعة
  const fetchGroupStudents = async (groupId) => {
    try {
      const res = await fetch(`/api/groups/students?group_id=${groupId}`)
      const data = await res.json()
      if (res.ok) setGroupStudents(data || [])
    } catch (error) {
      console.error('Error fetching group students:', error)
    }
  }

  // ✅ إضافة طالب للمجموعة
  const handleAddStudent = async () => {
    if (!selectedStudent || !selectedGroup) return

    try {
      const res = await fetch('/api/groups/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: selectedGroup.id,
          student_id: selectedStudent,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إضافة الطالب للمجموعة')
      setSelectedStudent('')
      await fetchGroupStudents(selectedGroup.id)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ حذف طالب من المجموعة
  const handleRemoveStudent = async (studentId) => {
    if (!confirm('هل أنت متأكد من حذف الطالب من المجموعة؟')) return

    try {
      const res = await fetch(`/api/groups/remove-student?group_id=${selectedGroup.id}&student_id=${studentId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم حذف الطالب من المجموعة')
      await fetchGroupStudents(selectedGroup.id)
      setTimeout(() => setSuccess(null), 3000)
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
              <h1 className="text-2xl font-bold">إدارة المجموعات</h1>
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
          <p className="text-gray-600 font-bold">إجمالي المجموعات: <span className="font-extrabold">{groups.length}</span></p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            {showForm ? '× إلغاء' : '+ إضافة مجموعة جديدة'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">إضافة مجموعة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">اسم المجموعة</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="A1-01"
                />
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

              <div>
                <label className="block text-sm font-bold text-gray-700">المدرس المسؤول</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="">اختر المدرس (اختياري)</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows="2"
                  placeholder="وصف المجموعة..."
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                ✅ إنشاء المجموعة
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
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المدرس</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">📭</div>
                      لا توجد مجموعات
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{group.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {group.level_code} - {group.level_title}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-bold">
                        {group.teacher_name || 'غير معين'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${group.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {group.is_active ? 'نشطة' : 'غير نشطة'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openStudentsModal(group)}
                          className="text-blue-600 hover:text-blue-800 font-bold transition-colors mr-3"
                        >
                          👥 إدارة الطلاب
                        </button>
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

      {/* ✅ نافذة إدارة الطلاب */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                👥 طلاب مجموعة: {selectedGroup.name}
              </h2>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* إضافة طالب */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-700 mb-3">➕ إضافة طالب للمجموعة</h3>
                <div className="flex gap-2">
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-bold"
                  >
                    <option value="">اختر طالب</option>
                    {students
                      .filter(s => !groupStudents.some(gs => gs.student_id === s.id))
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.full_name} - {student.phone || 'بدون رقم'}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddStudent}
                    disabled={!selectedStudent}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* قائمة الطلاب */}
              <h3 className="font-bold text-gray-700 mb-3">
                📋 الطلاب في المجموعة ({groupStudents.length})
              </h3>
              {groupStudents.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-4">لا يوجد طلاب في هذه المجموعة</p>
              ) : (
                <div className="space-y-2">
                  {groupStudents.map((student) => (
                    <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-bold text-gray-900">{student.full_name}</p>
                        <p className="text-sm text-gray-500" dir="ltr">📱 {student.phone || 'بدون رقم'}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.student_id)}
                        className="text-red-600 hover:text-red-800 font-bold text-sm"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}