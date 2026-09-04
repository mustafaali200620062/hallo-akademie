'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentForumPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [levels, setLevels] = useState([])
  const [userLevel, setUserLevel] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    level_id: ''
  })
  const [commentData, setCommentData] = useState({})
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
    setUserRole(parsed.role)
    setIsAdmin(['Eigentümer', 'Lehrer', 'Assistent'].includes(parsed.role))
  }

  const fetchData = async () => {
    try {
      // جلب مستوى الطالب
      const profileRes = await fetch('/api/profile')
      const profile = await profileRes.json()
      const levelId = profile?.level_id || null
      setUserLevel(levelId)
      setSelectedLevel(levelId)

      // جلب المنشورات
      const postsRes = await fetch('/api/forum/posts')
      const postsData = await postsRes.json()
      if (postsRes.ok) {
        // تصفية المنشورات حسب مستوى الطالب
        const filteredPosts = postsData.filter(p => p.level_id === levelId || !p.level_id)
        setPosts(filteredPosts || [])
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

  const handleLevelChange = (levelId) => {
    setSelectedLevel(levelId)
    // تصفية المنشورات حسب المستوى المختار
    const filtered = posts.filter(p => p.level_id === levelId)
    setPosts(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/forum/posts', {
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
        body: '',
        level_id: ''
      })

    } catch (error) {
      setError(error.message)
    }
  }

  const handleComment = async (postId) => {
    const content = commentData[postId]
    if (!content || content.trim() === '') return

    try {
      const response = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          body: content
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setCommentData({ ...commentData, [postId]: '' })
      await fetchData()

    } catch (error) {
      setError(error.message)
    }
  }

  const deletePost = async (postId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return

    try {
      const response = await fetch(`/api/forum/posts?id=${postId}`, {
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

  const deleteComment = async (commentId) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return

    try {
      const response = await fetch(`/api/forum/comments?id=${commentId}`, {
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

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 60000)
    if (diff < 1) return 'الآن'
    if (diff < 60) return `منذ ${diff} دقيقة`
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`
    return date.toLocaleDateString('ar-EG')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  const levelOptions = levels.filter(l => l.id === userLevel || isAdmin)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* الهيدر */}
      <div className="bg-purple-600 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-extrabold">المنتدى</h1>
              {isAdmin && selectedLevel && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                  👑 إدارة
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* اختيار المستوى */}
              <select
                value={selectedLevel || ''}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white"
              >
                {levels.map((level) => (
                  <option key={level.id} value={level.id} className="text-black">
                    {level.code} - {level.title}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => router.push('/student')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                ← العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 font-bold">
            {error}
          </div>
        )}

        {/* زر إضافة منشور - تصميم تويتر */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg">
              {userRole?.charAt(0) || 'U'}
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex-1 text-right text-gray-500 hover:text-gray-700 font-bold transition-colors text-lg"
            >
              {showForm ? '✖ إلغاء' : '💬 ماذا تريد أن تنشر؟'}
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-extrabold text-sm transition-colors"
              >
                نشر
              </button>
            )}
          </div>
        </div>

        {/* نموذج الإضافة - تصميم انيق */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900 font-bold text-lg transition-colors"
                  placeholder="عنوان المنشور..."
                />
              </div>

              <div>
                <textarea
                  required
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900 font-medium transition-colors"
                  rows="4"
                  placeholder="محتوى المنشور..."
                />
              </div>

              <div className="flex gap-4">
                <select
                  required
                  value={formData.level_id}
                  onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900 font-bold"
                >
                  <option value="">اختر المستوى</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.code} - {level.title}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-extrabold transition-all transform hover:scale-[1.02]"
                >
                  ✅ نشر
                </button>
              </div>
            </form>
          </div>
        )}

        {/* المنشورات - تصميم تويتر */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500 border border-gray-100">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl font-extrabold">لا توجد منشورات</p>
              <p className="text-sm font-bold mt-2">كن أول من ينشر في هذا المنتدى!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                {/* رأس المنشور */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg">
                      {post.author_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900">{post.author_name || 'مستخدم'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">{formatTime(post.created_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          {post.level_code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                  >
                    🗑️
                  </button>
                </div>

                {/* محتوى المنشور */}
                <div className="mt-3 mr-16">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">{post.body}</p>
                </div>

                {/* أزرار التفاعل */}
                <div className="mt-4 mr-16 flex items-center gap-6 border-t border-gray-100 pt-3">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-bold text-sm">
                    💬 <span>{post.comments?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors font-bold text-sm">
                    ❤️ <span>0</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors font-bold text-sm">
                    🔄 <span>0</span>
                  </button>
                </div>

                {/* التعليقات */}
                <div className="mt-4 mr-16 border-t border-gray-100 pt-4">
                  <div className="space-y-3">
                    {post.comments?.length === 0 ? (
                      <p className="text-sm text-gray-400 font-medium">لا توجد تعليقات</p>
                    ) : (
                      post.comments?.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-white font-extrabold text-xs">
                            {comment.author_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-gray-900">
                                {comment.author_name || 'مستخدم'}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                {formatTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 font-medium text-sm">{comment.body}</p>
                          </div>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* إضافة تعليق */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={commentData[post.id] || ''}
                      onChange={(e) => setCommentData({
                        ...commentData,
                        [post.id]: e.target.value
                      })}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-purple-500 text-gray-900 font-medium transition-colors"
                      placeholder="اكتب تعليقك..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-2 rounded-full font-extrabold text-sm transition-all"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}