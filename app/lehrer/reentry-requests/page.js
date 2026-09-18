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
      const res = await fetch('/api/reentry-requests?status=pending')
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

      setSuccess(`✅ ${data.message}`)
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
      <div className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">طلبات استكمال الاختبارات</h1>
            </div>
            <button
              onClick={() => router.push('/lehrer')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
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

        <div className="mb-6">
          <p className="text-gray-600 font-bold">
            طلبات معلقة: <span className="font-extrabold text-red-600">{requests.length}</span>
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl font-extrabold">لا توجد طلبات استكمال</p>
            <p className="text-sm font-bold mt-2">ستظهر طلبات الطلاب هنا عند إرسالها</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-extrabold text-gray-900">
                        {request.student_name || 'طالب'}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                        ⏳ في انتظار المراجعة
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm font-bold">
                      <span className="text-gray-600">📱 {request.student_phone || '-'}</span>
                      <span className="text-gray-600">📝 {request.exam_title || '-'}</span>
                      <span className="text-gray-600">🕐 {formatDate(request.requested_at)}</span>
                    </div>
                    {request.notes && (
                      <p className="mt-2 text-gray-700 font-medium text-sm bg-gray-50 p-2 rounded">
                        💬 {request.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(request.id, 'approved')}
                      disabled={processing === request.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing === request.id ? '⏳' : '✅'} قبول
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, 'rejected')}
                      disabled={processing === request.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing === request.id ? '⏳' : '❌'} رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}