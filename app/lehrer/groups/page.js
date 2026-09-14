'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerGroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [groupLessons, setGroupLessons] = useState([])
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
    await fetchGroups(parsed.id)
  }

  const fetchGroups = async (teacherId) => {
    try {
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()

      if (groupsRes.ok) {
        const teacherGroups = groupsData.filter(g => g.teacher_id === teacherId)
        setGroups(teacherGroups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      setError('حدث خطأ في جلب المجموعات')
    } finally {
      setLoading(false)
    }
  }

  // ✅ فتح تفاصيل المجموعة
  const openGroupDetails = async (group) => {
    setSelectedGroup(group)

    // جلب الطلاب
    try {
      const studentsRes = await fetch(`/api/groups/students?group_id=${group.id}`)
      const studentsData = await studentsRes.json()
      if (studentsRes.ok) setGroupStudents(studentsData || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }

    // جلب الشروح
    try {
      const lessonsRes = await fetch(`/api/groups/lessons?group_id=${group.id}`)
      const lessonsData = await lessonsRes.json()
      if (lessonsRes.ok) setGroupLessons(lessonsData || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  // ✅ حذف شرح من المجموعة
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشرح من المجموعة؟')) return

    try {
      const res = await fetch(`/api/groups/lessons?lesson_id=${lessonId}&group_id=${selectedGroup.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم حذف الشرح من المجموعة')
      await openGroupDetails(selectedGroup)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ معاينة شرح
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
              <h1 className="text-2xl font-bold">مجموعاتي</h1>
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

        {/* قائمة المجموعات */}
        {!selectedGroup && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-lg font-bold">لا توجد مجموعات مخصصة لك</p>
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => openGroupDetails(group)}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all text-right hover:scale-[1.02] border-2 border-transparent hover:border-red-400"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                    <span className="text-2xl">📚</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                    {group.level_code} - {group.level_title}
                  </span>
                  <p className="text-gray-600 text-sm mt-3">
                    {group.description || 'لا يوجد وصف'}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    اضغط لعرض التفاصيل ←
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* تفاصيل المجموعة */}
        {selectedGroup && (
          <div>
            <button
              onClick={() => setSelectedGroup(null)}
              className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
            >
              ← العودة للمجموعات
            </button>

            {/* معلومات المجموعة */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                  {selectedGroup.level_code} - {selectedGroup.level_title}
                </span>
              </div>
              <p className="text-gray-600 mt-2">{selectedGroup.description || 'لا يوجد وصف'}</p>
            </div>

            {/* الطلاب */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                👨‍🎓 الطلاب ({groupStudents.length})
              </h3>
              {groupStudents.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-4">لا يوجد طلاب</p>
              ) : (
                <div className="space-y-2">
                  {groupStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{student.full_name}</span>
                        <span className="text-sm text-gray-500 font-bold" dir="ltr">
                          📱 {student.phone || 'بدون رقم'}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {student.is_active ? '🟢 نشط' : '🔴 غير نشط'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* الشروح */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📖 الشروح ({groupLessons.length})
              </h3>
              {groupLessons.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-4">لا توجد شروح في هذه المجموعة</p>
              ) : (
                <div className="space-y-3">
                  {groupLessons.map((lesson) => (
                    <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-bold">
                            <span>📅 {formatDate(lesson.assigned_at || lesson.created_at)}</span>
                            <span>👤 {lesson.creator_name || 'الإدارة'}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {lesson.level_code}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(lesson.id)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm px-3 py-1 bg-blue-50 rounded-lg"
                          >
                            👁️ معاينة
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-800 font-bold text-sm px-3 py-1 bg-red-50 rounded-lg"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}