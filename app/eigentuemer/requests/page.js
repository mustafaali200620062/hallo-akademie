'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [processing, setProcessing] = useState(null)

  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [editingPassword, setEditingPassword] = useState({})
  const [savingPassword, setSavingPassword] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    checkUser()
    fetchRequests()
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

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('حدث خطأ في جلب الطلبات')
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId, status) => {
    setProcessing(requestId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, status })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(`✅ تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`)
      await fetchRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleSavePassword = async (studentId) => {
    const newPassword = editingPassword[studentId]
    if (!newPassword || newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setSavingPassword(studentId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          password: newPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم تحديث كلمة المرور بنجاح')
      setEditingPassword(prev => {
        const copy = { ...prev }
        delete copy[studentId]
        return copy
      })
      await fetchRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(null)
    }
  }

  const handleCopy = async (studentId, password) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedId(studentId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
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
      minute: '2-digit'
    })
  }

  // ✅ مكون عرض كلمة المرور
  const PasswordDisplay = ({ request }) => {
    const hasPassword = request.student_password && request.student_password.length > 0
    const isVisible = visiblePasswords[request.student_id]
    const isEditing = editingPassword[request.student_id] !== undefined

    return (
      <div className="bg-gray-50 rounded-lg p-2.5 md:p-3 border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-600 font-bold text-xs md:text-sm">🔑 كلمة المرور:</span>

          {hasPassword ? (
            <>
              <span
                className="font-mono font-extrabold text-gray-900 bg-white px-2.5 md:px-3 py-1 rounded-lg border border-gray-300 text-xs md:text-sm"
                dir="ltr"
              >
                {isVisible ? request.student_password : '••••••••'}
              </span>

              <button
                type="button"
                onClick={() => setVisiblePasswords(prev => ({
                  ...prev,
                  [request.student_id]: !prev[request.student_id]
                }))}
                className="text-blue-600 hover:text-blue-800 font-bold text-sm px-2 py-1 rounded hover:bg-blue-50 active:scale-90 transition-transform"
                title={isVisible ? 'إخفاء' : 'إظهار'}
              >
                {isVisible ? '🙈' : '👁️'}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(request.student_id, request.student_password)}
                className="text-gray-600 hover:text-gray-800 font-bold text-sm px-2 py-1 rounded hover:bg-gray-100 active:scale-90 transition-transform"
                title="نسخ"
              >
                {copiedId === request.student_id ? '✅' : '📋'}
              </button>

              <button
                type="button"
                onClick={() => setEditingPassword(prev => ({
                  ...prev,
                  [request.student_id]: request.student_password
                }))}
                className="text-orange-600 hover:text-orange-800 font-bold text-xs px-2 py-1 rounded hover:bg-orange-50 active:scale-90 transition-transform"
                title="تعديل"
              >
                ✏️
              </button>
            </>
          ) : (
            <>
              <span className="text-red-600 font-bold text-xs md:text-sm">
                ⚠️ بدون كلمة مرور
              </span>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setEditingPassword(prev => ({
                    ...prev,
                    [request.student_id]: ''
                  }))}
                  className="bg-blue-600 text-white text-[11px] md:text-xs px-2.5 md:px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-transform"
                >
                  ✏️ تعيين
                </button>
              )}
            </>
          )}
        </div>

        {/* حقل التعديل */}
        {isEditing && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="text"
              value={editingPassword[request.student_id] || ''}
              onChange={(e) => setEditingPassword(prev => ({
                ...prev,
                [request.student_id]: e.target.value
              }))}
              placeholder="6 أحرف على الأقل"
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-900 font-mono flex-1 min-w-0"
              dir="ltr"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => handleSavePassword(request.student_id)}
              disabled={savingPassword === request.student_id}
              className="bg-green-600 text-white text-[11px] md:text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-transform"
            >
              {savingPassword === request.student_id ? '⏳' : '💾 حفظ'}
            </button>
            <button
              type="button"
              onClick={() => setEditingPassword(prev => {
                const copy = { ...prev }
                delete copy[request.student_id]
                return copy
              })}
              className="text-gray-500 hover:text-gray-700 text-xs font-bold px-2 py-1.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const otherRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-bold truncate">طلبات الانضمام</h1>
            </div>
            <button
              onClick={() => router.push('/eigentuemer')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-4 font-bold text-xs md:text-sm fade-in-up">
            {success}
          </div>
        )}

        {/* Counters */}
        <div className="flex justify-between items-center gap-2 mb-4 md:mb-6 flex-wrap">
          <p className="text-gray-600 font-bold text-xs md:text-base">
            طلبات معلقة: <span className="font-extrabold text-red-600">{pendingRequests.length}</span>
          </p>
          <p className="text-gray-600 font-bold text-xs md:text-base">
            إجمالي الطلبات: <span className="font-extrabold">{requests.length}</span>
          </p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2 flex-wrap">
              📋 طلبات بانتظار المراجعة
              <span className="bg-red-500 text-white text-[10px] md:text-xs px-2 py-1 rounded-full font-bold">
                {pendingRequests.length} جديدة
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-lg p-4 md:p-6 fade-in-up">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-bold text-gray-900">
                          {request.student_name || 'طالب جديد'}
                        </h3>
                        <span className="px-2 py-0.5 md:py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] md:text-xs font-bold">
                          في انتظار المراجعة
                        </span>
                      </div>

                      {/* معلومات */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-bold">📱:</span>
                          <span className="text-gray-700 font-bold truncate" dir="ltr">
                            {request.student_phone || 'غير متوفر'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-bold">📚:</span>
                          <span className="text-gray-700 font-bold">
                            {request.level_code || 'غير محدد'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-bold">🕐:</span>
                          <span className="text-gray-700 font-bold">
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Password */}
                      <PasswordDisplay request={request} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 mt-2 md:mt-0">
                      <button
                        onClick={() => handleRequest(request.id, 'approved')}
                        disabled={processing === request.id}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2.5 md:py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs md:text-sm active:scale-95"
                      >
                        {processing === request.id ? '⏳' : '✅'} قبول
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, 'rejected')}
                        disabled={processing === request.id}
                        className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2.5 md:py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs md:text-sm active:scale-95"
                      >
                        {processing === request.id ? '⏳' : '❌'} رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Requests */}
        {otherRequests.length > 0 && (
          <div>
            <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-gray-600">
              📜 الطلبات السابقة
            </h2>
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {otherRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow p-3 md:p-4 fade-in-up">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm md:text-base truncate">
                          {request.student_name || 'طالب جديد'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'approved' ? '✅ مقبول' : '❌ مرفوض'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-[11px] md:text-sm text-gray-500 font-bold mb-2">
                        <span dir="ltr">📱 {request.student_phone || '-'}</span>
                        <span>📚 {request.level_code || '-'}</span>
                        <span>🕐 {formatDate(request.created_at)}</span>
                      </div>

                      {request.status === 'approved' && (
                        <PasswordDisplay request={request} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {requests.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center text-gray-500 fade-in-up">
            <div className="text-5xl md:text-6xl mb-4">📭</div>
            <p className="text-base md:text-lg font-bold">لا توجد طلبات انضمام</p>
            <p className="text-xs md:text-sm font-bold mt-1">سيظهر الطلاب الجدد هنا عند التسجيل</p>
          </div>
        )}
      </div>
    </div>
  )
}