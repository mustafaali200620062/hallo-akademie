'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentForumPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [levels, setLevels] = useState([])
  const [userLevel, setUserLevel] = useState(null)
  const [userLevelCode, setUserLevelCode] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    level_id: ''
  })
  const [commentData, setCommentData] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})

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
    setUserRole(parsed.role)
    setIsAdmin(['Eigentümer', 'Lehrer', 'Assistent'].includes(parsed.role))
    await fetchData(parsed)
  }

  const fetchData = async (user) => {
    try {
      const levelsRes = await fetch('/api/levels')
      const levelsData = await levelsRes.json()
      if (levelsRes.ok) setLevels(levelsData || [])

      let levelId = user.level_id || null
      let levelCode = null

      if (levelId && levelsData) {
        const userLevelData = levelsData.find(l => l.id === levelId)
        levelCode = userLevelData?.code || null
      }

      setUserLevel(levelId)
      setUserLevelCode(levelCode)

      setFormData(prev => ({ ...prev, level_id: levelId || '' }))

      const postsRes = await fetch('/api/forum/posts')
      const postsData = await postsRes.json()

      if (postsRes.ok) {
        if (isAdmin) {
          setPosts(postsData || [])
        } else {
          const filteredPosts = postsData.filter(p => p.level_id === levelId)
          setPosts(filteredPosts || [])
        }
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

    if (!isAdmin && formData.level_id !== userLevel) {
      setError('لا يمكنك النشر إلا في منتدى مستواك فقط')
      return
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'))

      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          author_id: userData.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم نشر المنشور بنجاح!')
      await fetchData(userData)
      setShowForm(false)
      setFormData({
        title: '',
        body: '',
        level_id: userLevel || ''
      })
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      setError(error.message)
    }
  }

  const handleComment = async (postId) => {
    const content = commentData[postId]
    if (!content || content.trim() === '') return

    try {
      const userData = JSON.parse(localStorage.getItem('user'))

      const response = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          body: content,
          author_id: userData.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setCommentData({ ...commentData, [postId]: '' })
      setExpandedComments(prev => ({ ...prev, [postId]: true }))
      await fetchData(userData)

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

      const userData = JSON.parse(localStorage.getItem('user'))
      await fetchData(userData)
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

      const userData = JSON.parse(localStorage.getItem('user'))
      await fetchData(userData)
    } catch (error) {
      setError(error.message)
    }
  }

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 60000)
    if (diff < 1) return 'الآن'
    if (diff < 60) return `منذ ${diff} دقيقة`
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`
    return date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-purple-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-extrabold truncate">المنتدى</h1>
              {userLevelCode && !isAdmin && (
                <span className="bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm font-bold flex-shrink-0">
                  📚 {userLevelCode}
                </span>
              )}
              {isAdmin && (
                <span className="bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm font-bold flex-shrink-0">
                  👑
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/student')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {/* ═══ Alerts ═══ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-xs md:text-sm fade-in-up">
            {success}
          </div>
        )}

        {!isAdmin && userLevelCode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-[11px] md:text-sm fade-in-up">
            ℹ️ يمكنك النشر والتعليق فقط في منتدى مستوى <strong>{userLevelCode}</strong>
          </div>
        )}

        {/* ═══ Composer Button ═══ */}
        {userLevel && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white rounded-2xl shadow-md p-3 md:p-4 mb-4 md:mb-6 border border-gray-100 hover:shadow-lg transition-shadow text-right flex items-center gap-3 active:scale-[0.99] card-touch"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm md:text-lg flex-shrink-0">
              {userRole?.charAt(0) || 'U'}
            </div>
            <span className="flex-1 text-gray-500 font-bold text-sm md:text-base">
              💬 ماذا تريد أن تنشر؟
            </span>
            <span className="bg-purple-600 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full font-extrabold text-xs md:text-sm">
              نشر
            </span>
          </button>
        )}

        {/* ═══ Composer Form ═══ */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-100 fade-in-up">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-extrabold text-gray-800">✏️ منشور جديد</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-700 text-xl md:text-2xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 md:px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900 font-bold text-sm md:text-base transition-colors"
                placeholder="عنوان المنشور..."
              />

              <textarea
                required
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-3.5 md:px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900 font-medium text-sm md:text-base transition-colors"
                rows="4"
                placeholder="محتوى المنشور..."
              />

              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">المستوى:</label>
                {isAdmin ? (
                  <select
                    required
                    value={formData.level_id}
                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                    className="w-full px-3.5 md:px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900 font-bold text-sm md:text-base"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.code} - {level.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-purple-50 border-2 border-purple-200 px-3.5 md:px-4 py-3 rounded-xl">
                    <span className="font-extrabold text-purple-700 text-sm md:text-base">
                      🔒 {userLevelCode} (مستواك فقط)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 md:px-8 py-3 rounded-xl font-extrabold transition-all active:scale-95 shadow-lg text-sm md:text-base btn-app"
              >
                ✅ نشر
              </button>
            </form>
          </div>
        )}

        {/* ═══ Posts ═══ */}
        <div className="space-y-3 md:space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center text-gray-500 border border-gray-100 fade-in-up">
              <div className="text-5xl md:text-6xl mb-4">💬</div>
              <p className="text-base md:text-xl font-extrabold">لا توجد منشورات</p>
              <p className="text-xs md:text-sm font-bold mt-2">كن أول من ينشر في هذا المنتدى!</p>
            </div>
          ) : (
            posts.map((post) => {
              const isExpanded = expandedComments[post.id]
              const commentsCount = post.comments?.length || 0

              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-md p-3.5 md:p-6 border border-gray-100 fade-in-up">

                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm md:text-lg flex-shrink-0">
                        {post.author_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-gray-900 text-sm md:text-base truncate">
                          {post.author_name || 'مستخدم'}
                        </p>
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-gray-500 flex-wrap">
                          <span className="font-medium whitespace-nowrap">{formatTime(post.created_at)}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                          <span className="px-1.5 md:px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[9px] md:text-xs font-bold whitespace-nowrap">
                            {post.level_code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 md:p-2 hover:bg-red-50 rounded-full flex-shrink-0 active:scale-90 text-sm md:text-base"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Post Body */}
                  <div className="mt-3 md:mt-3 md:mr-16">
                    <h3 className="text-base md:text-xl font-extrabold text-gray-900 mb-1.5 md:mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-700 font-medium whitespace-pre-wrap leading-relaxed text-xs md:text-base">
                      {post.body}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 md:mt-4 md:mr-16 flex items-center gap-4 md:gap-6 border-t border-gray-100 pt-2.5 md:pt-3">
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 md:gap-2 transition-colors font-bold text-xs md:text-sm active:scale-95 ${
                        isExpanded ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      💬 <span>{commentsCount}</span>
                    </button>
                    <button className="flex items-center gap-1.5 md:gap-2 text-gray-500 hover:text-green-600 transition-colors font-bold text-xs md:text-sm active:scale-95">
                      ❤️ <span>0</span>
                    </button>
                    <button className="flex items-center gap-1.5 md:gap-2 text-gray-500 hover:text-purple-600 transition-colors font-bold text-xs md:text-sm active:scale-95">
                      🔄 <span>0</span>
                    </button>
                  </div>

                  {/* Comments (Expandable) */}
                  {isExpanded && (
                    <div className="mt-3 md:mt-4 md:mr-16 border-t border-gray-100 pt-3 md:pt-4 fade-in-up">
                      <div className="space-y-2 md:space-y-3">
                        {commentsCount === 0 ? (
                          <p className="text-[11px] md:text-sm text-gray-400 font-medium text-center py-2">
                            لا توجد تعليقات — كن أول من يعلّق
                          </p>
                        ) : (
                          post.comments?.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2 md:gap-3 bg-gray-50 rounded-xl p-2.5 md:p-3">
                              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-white font-extrabold text-[10px] md:text-xs flex-shrink-0">
                                {comment.author_name?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                                  <span className="font-extrabold text-xs md:text-sm text-gray-900 truncate">
                                    {comment.author_name || 'مستخدم'}
                                  </span>
                                  <span className="text-[9px] md:text-xs text-gray-400 font-medium whitespace-nowrap">
                                    {formatTime(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 font-medium text-xs md:text-sm mt-0.5 break-words">
                                  {comment.body}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors text-[10px] md:text-xs flex-shrink-0 p-1 active:scale-90"
                              >
                                🗑️
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment */}
                      <div className="mt-2.5 md:mt-3 flex gap-1.5 md:gap-2">
                        <input
                          type="text"
                          value={commentData[post.id] || ''}
                          onChange={(e) => setCommentData({
                            ...commentData,
                            [post.id]: e.target.value
                          })}
                          className="flex-1 min-w-0 px-3 md:px-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-purple-500 text-gray-900 font-medium text-xs md:text-sm transition-colors"
                          placeholder="اكتب تعليقك..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(post.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-4 md:px-6 py-2 rounded-full font-extrabold text-xs md:text-sm transition-all active:scale-95 flex-shrink-0"
                        >
                          إرسال
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}