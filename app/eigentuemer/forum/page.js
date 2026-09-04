'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EigentuemerForumPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [levels, setLevels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    level_id: ''
  })
  const [commentData, setCommentData] = useState({})
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
      // جلب جميع المنشورات (المالك يرى كل شيء)
      const postsRes = await fetch('/api/forum/posts')
      const postsData = await postsRes.json()
      if (postsRes.ok) setPosts(postsData || [])

      // جلب جميع المستويات
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
      <div className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">المنتدى</h1>
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

        {/* زر الإضافة */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">إجمالي المنشورات: <span className="font-bold">{posts.length}</span></p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showForm ? '× إلغاء' : '+ منشور جديد'}
          </button>
        </div>

        {/* نموذج الإضافة */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">منشور جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">العنوان</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="عنوان المنشور"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">المحتوى</label>
                <textarea
                  required
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows="4"
                  placeholder="محتوى المنشور..."
                />
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

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ نشر
              </button>
            </form>
          </div>
        )}

        {/* المنشورات */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>لا توجد منشورات في المنتدى</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        👤 {post.author_name || 'مستخدم'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {post.level_code}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    🗑️
                  </button>
                </div>

                <p className="mt-4 text-gray-700 whitespace-pre-wrap">{post.body}</p>

                {/* التعليقات */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">
                    💬 التعليقات ({post.comments?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {post.comments?.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3 flex justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.author_name || 'مستخدم'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.body}</p>
                        </div>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-600 hover:text-red-800 transition-colors text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="اكتب تعليقك..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
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