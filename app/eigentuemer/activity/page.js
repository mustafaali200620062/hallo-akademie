'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ActivityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchActivities()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
  }

  const fetchActivities = async () => {
    try {
      // جلب النشاطات من API (مؤقتاً بيانات وهمية)
      setActivities([
        { id: 1, type: 'student_joined', user: 'أحمد محمد', action: 'سجل في المنصة', time: 'منذ 5 دقائق', icon: '👨‍🎓' },
        { id: 2, type: 'exam_created', user: 'مدرس 1', action: 'أنشأ اختبار جديد', time: 'منذ ساعة', icon: '📝' },
        { id: 3, type: 'teacher_added', user: 'المالك', action: 'أضاف مدرس جديد', time: 'منذ ساعتين', icon: '👨‍🏫' },
        { id: 4, type: 'group_created', user: 'المساعد', action: 'أنشأ مجموعة جديدة', time: 'منذ 3 ساعات', icon: '📚' },
        { id: 5, type: 'lesson_added', user: 'مدرس 2', action: 'أضاف شرح جديد', time: 'منذ 5 ساعات', icon: '📖' },
        { id: 6, type: 'student_joined', user: 'سارة علي', action: 'سجلت في المنصة', time: 'منذ يوم', icon: '👩‍🎓' },
      ])
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('حدث خطأ في جلب النشاطات')
    } finally {
      setLoading(false)
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
      <div className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">النشاطات</h1>
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

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🔄 سجل النشاطات
            <span className="text-sm font-normal text-gray-500">
              ({activities.length} نشاط)
            </span>
          </h2>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>لا توجد نشاطات حتى الآن</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="text-3xl">{activity.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{activity.user}</span>
                      <span className="text-gray-600">{activity.action}</span>
                    </div>
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activity.type === 'student_joined' ? 'bg-green-100 text-green-800' :
                      activity.type === 'exam_created' ? 'bg-blue-100 text-blue-800' :
                      activity.type === 'teacher_added' ? 'bg-red-100 text-red-800' :
                      activity.type === 'group_created' ? 'bg-yellow-100 text-yellow-800' :
                      activity.type === 'lesson_added' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.type === 'student_joined' ? 'تسجيل' :
                       activity.type === 'exam_created' ? 'اختبار' :
                       activity.type === 'teacher_added' ? 'مدرس' :
                       activity.type === 'group_created' ? 'مجموعة' :
                       activity.type === 'lesson_added' ? 'شرح' : 'نشاط'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}