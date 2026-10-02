'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerReentryRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [processing, setProcessing] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [teacherId, setTeacherId] = useState(null)
  const [filter, setFilter] = useState('pending') // pending | approved | rejected | all

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
    setTeacherId(parsed.id)
    await fetchRequests()
  }

  const fetchRequests = async () => {
    try {
      // ✅ نجيب كل الطلبات (مش بس pending) عشان المدرس يشوف السجل
      const res = await fetch('/api/reentry-requests')
      const data = await res.json()
      if (res.ok) setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('حدث خطأ في جلب الطلبات')
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId, status) => {
    if (!confirm(`هل أنت متأكد من ${status === 'approved' ? 'قبول' : 'رفض'} الطلب؟`)) return

    setProcessing(requestId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/reentry-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status,
          reviewed_by: teacherId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(`✅ ${data.message || 'تم تحديث الطلب'}`)
      await fetchRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 60000)

    if (diff < 1) return 'الآن'
    if (diff < 60) return `منذ ${diff} دقيقة`
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`
    if (diff < 43200) return `منذ ${Math.floor(diff / 1440)} يوم`
    return date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getStatusBadge = (status) => {
    if (status === 'pending') return { text: '⏳ في انتظار المراجعة', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    if (status === 'approved') return { text: '✅ مقبول', cls: 'bg-green-100 text-green-800 border-green-300' }
    if (status === 'rejected') return { text: '❌ مرفوض', cls: 'bg-red-100 text-red-800 border-red-300' }
    return { text: status, cls: 'bg-gray-100 text-gray-700 border-gray-300' }
  }

  const getFilteredRequests = () => {
    if (filter === 'all') return requests
    return requests.filter(r => r.status === filter)
  }

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    all: requests.length,
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

  const filteredRequests = getFilteredRequests()

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-purple-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">📩 طلبات الاستكمال</h1>
              {counts.pending > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-extrabold flex-shrink-0 animate-pulse">
                  {counts.pending}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/lehrer')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← رجوع
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

        {/* ═══ Filter Tabs ═══ */}
        <div className="bg-white rounded-2xl shadow-md p-3 md:p-4 mb-4 md:mb-6 border border-gray-100">
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⏳ معلقة ({counts.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                filter === 'approved'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✅ مقبولة ({counts.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ❌ مرفوضة ({counts.rejected})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 الكل ({counts.all})
            </button>
          </div>
        </div>

        {/* ═══ Requests List ═══ */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center text-gray-500 fade-in-up">
            <div className="text-5xl md:text-6xl mb-4">📭</div>
            <p className="text-base md:text-xl font-extrabold">
              {filter === 'pending' ? 'لا توجد طلبات معلقة' : 'لا توجد طلبات في هذه الفئة'}
            </p>
            <p className="text-xs md:text-sm font-bold mt-2">
              {filter === 'pending' ? 'ستظهر طلبات الطلاب هنا عند إرسالها' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredRequests.map((request) => {
              const badge = getStatusBadge(request.status)
              const isPending = request.status === 'pending'

              return (
                <div key={request.id} className="bg-white rounded-2xl shadow-md p-4 md:p-5 border border-gray-100 fade-in-up">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm md:text-lg flex-shrink-0">
                        {request.student_name?.charAt(0) || 'S'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-gray-900 text-sm md:text-base truncate">
                          {request.student_name || 'طالب'}
                        </p>
                        {request.student_phone && (
                          <p className="text-[10px] md:text-xs text-gray-500 font-bold truncate" dir="ltr">
                            📱 {request.student_phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border ${badge.cls} flex-shrink-0`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-3 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bold">📝 الاختبار:</span>
                      <span className="text-gray-800 font-bold truncate">
                        {request.exam_title || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bold">🕐 وقت الطلب:</span>
                      <span className="text-gray-800 font-bold">
                        {formatDate(request.requested_at)}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-3 bg-gray-50 rounded-lg p-2.5 md:p-3 border border-gray-200">
                      <p className="text-[11px] md:text-xs font-bold text-gray-700 break-words">
                        💬 {request.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(request.id, 'approved')}
                        disabled={processing === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs md:text-sm active:scale-95"
                      >
                        {processing === request.id ? '⏳...' : '✅ قبول'}
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, 'rejected')}
                        disabled={processing === request.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs md:text-sm active:scale-95"
                      >
                        {processing === request.id ? '⏳...' : '❌ رفض'}
                      </button>
                    </div>
                  ) : (
                    <div className={`text-center py-2 rounded-lg text-xs md:text-sm font-bold ${
                      request.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {request.status === 'approved'
                        ? '✅ تم قبول الطلب — الطالب يقدر يكمل'
                        : '❌ تم رفض الطلب'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}