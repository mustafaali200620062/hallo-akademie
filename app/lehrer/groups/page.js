'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerGroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [groupStudents, setGroupStudents] = useState({})
  const [error, setError] = useState(null)

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
      // ✅ جلب جميع المجموعات
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()

      if (groupsRes.ok) {
        // ✅ تصفية المجموعات الخاصة بالمدرس
        const teacherGroups = groupsData.filter(g => g.teacher_id === teacherId)
        setGroups(teacherGroups || [])

        // ✅ جلب طلاب كل مجموعة
        const studentsMap = {}
        for (const group of teacherGroups) {
          const studentsRes = await fetch(`/api/groups/students?group_id=${group.id}`)
          const studentsData = await studentsRes.json()
          if (studentsRes.ok) {
            studentsMap[group.id] = studentsData || []
          }
        }
        setGroupStudents(studentsMap)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
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

        <div className="grid grid-cols-1 gap-6">
          {groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-bold">لا توجد مجموعات مخصصة لك</p>
              <p className="text-sm">سيتم إضافتك إلى مجموعات من قبل الإدارة</p>
            </div>
          ) : (
            groups.map((group) => {
              const students = groupStudents[group.id] || []
              return (
                <div key={group.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                        {group.level_code} - {group.level_title}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{group.description || 'لا يوجد وصف'}</p>
                  </div>
                  <div className="p-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3">
                      👨‍🎓 الطلاب ({students.length})
                    </h3>
                    <div className="space-y-2">
                      {students.length === 0 ? (
                        <p className="text-gray-500 text-sm font-bold">لا يوجد طلاب في هذه المجموعة</p>
                      ) : (
                        students.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900">{student.full_name}</span>
                              <span className="text-sm text-gray-500 font-bold" dir="ltr">
                                📱 {student.phone || 'رقم غير متوفر'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                {student.is_active ? '🟢 نشط' : '🔴 غير نشط'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}