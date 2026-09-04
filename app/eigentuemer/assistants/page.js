'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssistantsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [assistants, setAssistants] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    checkUser()
    fetchAssistants()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
  }

  const fetchAssistants = async () => {
    try {
      const res = await fetch('/api/assistants')
      const data = await res.json()
      if (res.ok) {
        setAssistants(data || [])
      }
    } catch (error) {
      console.error('Error fetching assistants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/add-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إضافة المساعد بنجاح!')
      setShowForm(false)
      setFormData({ email: '', full_name: '' })
      await fetchAssistants()

    } catch (error) {
      setError(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المساعد؟')) return

    try {
      const response = await fetch(`/api/admin/remove-assistant?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      await fetchAssistants()
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
      <div className="bg-yellow-400 text-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-extrabold">إدارة المساعدين</h1>
            </div>
            <button 
              onClick={() => router.push('/eigentuemer')}
              className="bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
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

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 font-bold">
            {success}
          </div>
        )}

        {/* زر الإضافة */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 font-bold">عدد المساعدين: <span className="font-extrabold">{assistants.length}</span></p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-extrabold hover:bg-yellow-500 transition-colors"
          >
            {showForm ? '× إلغاء' : '+ إضافة مساعد جديد'}
          </button>
        </div>

        {/* نموذج الإضافة */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-extrabold mb-4 text-gray-800">إضافة مساعد جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-bold"
                  placeholder="assistant@example.com"
                />
                <p className="text-xs text-gray-500 font-bold mt-1">سيتم إرسال دعوة للتسجيل إلى هذا البريد</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-bold"
                  placeholder="أحمد محمد"
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-extrabold hover:bg-green-700 transition-colors"
              >
                ✅ إضافة المساعد
              </button>
            </form>
          </div>
        )}

        {/* قائمة المساعدين */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-black text-gray-700 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-gray-700 uppercase tracking-wider">البريد الإلكتروني</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-gray-700 uppercase tracking-wider">تاريخ التسجيل</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-gray-700 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assistants.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">🤝</div>
                      لا يوجد مساعدين
                    </td>
                  </tr>
                ) : (
                  assistants.map((assistant) => (
                    <tr key={assistant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-extrabold text-gray-900">{assistant.full_name}</td>
                      <td className="px-6 py-4 text-gray-600 font-bold">{assistant.email || 'غير متوفر'}</td>
                      <td className="px-6 py-4 text-gray-600 font-bold">
                        {new Date(assistant.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(assistant.id)}
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