'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentLessonsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lessons, setLessons] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
    fetchLessons()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
  }

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      // تصفية الدروس المنشورة فقط
      const publishedLessons = data.filter(l => l.is_published === true)
      setLessons(publishedLessons || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
      setError(error.message)
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
      {/* الهيدر */}
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-extrabold">دروسي</h1>
            </div>
            <button 
              onClick={() => router.push('/student')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
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
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📚</div>
              <p className="font-bold">لا توجد شروح متاحة لك حالياً</p>
            </div>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                      {lesson.level_code}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                      {lesson.content_type === 'text' ? '📝 نص' :
                       lesson.content_type === 'pdf' ? '📄 PDF' :
                       lesson.content_type === 'image' ? '🖼️ صورة' :
                       lesson.content_type === 'audio' ? '🎵 صوتي' :
                       lesson.content_type === 'video' ? '🎬 فيديو' : lesson.content_type}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">{lesson.title}</h3>
                  <p className="text-gray-600 text-sm font-bold mb-3">{lesson.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
                    <span>📅 {new Date(lesson.created_at).toLocaleDateString('ar-EG')}</span>
                    <span>👤 {lesson.created_by_name || 'غير معروف'}</span>
                  </div>
                  {lesson.content_url && (
                    <a 
                      href={lesson.content_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-blue-600 hover:text-blue-800 text-sm font-extrabold"
                    >
                      🔗 عرض الملف
                    </a>
                  )}
                  {lesson.content && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 font-bold max-h-32 overflow-y-auto">
                      {lesson.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}