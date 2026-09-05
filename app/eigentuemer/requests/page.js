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

  useEffect(() => {
    checkUser()
    fetchRequests()
  }, [])

  // ✅ التعديل هنا
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
        body: JSON.stringify({
          request_id: requestId,
          status: status
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(`✅ تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`)
      await fetchRequests()
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
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const otherRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* الهيدر */}
      <div className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">طلبات الانضمام</h1>
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

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            طلبات معلقة: <span className="font-bold text-red-600">{pendingRequests.length}</span>
          </p>
          <p className="text-gray-600">
            إجمالي الطلبات: <span className="font-bold">{requests.length}</span>
          </p>
        </div>

        {/* الطلبات المعلقة */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📋 طلبات بانتظار المراجعة
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingRequests.length} جديدة
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {request.student_name || 'طالب جديد'}
                        </h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          في انتظار المراجعة
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📱:</span>
                          <span className="text-gray-700 font-medium" dir="ltr">
                            {request.student_phone || 'رقم غير متوفر'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📚:</span>
                          <span className="text-gray-700">
                            {request.level_code || 'غير محدد'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">🕐:</span>
                          <span className="text-gray-700">
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(request.id, 'approved')}
                        disabled={processing === request.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {processing === request.id ? '⏳' : '✅'} قبول
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, 'rejected')}
                        disabled={processing === request.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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

        {/* الطلبات السابقة */}
        {otherRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-600">
              📜 الطلبات السابقة
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {otherRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          {request.student_name || 'طالب جديد'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'approved' ? '✅ مقبول' : '❌ مرفوض'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                        <span>📱 {request.student_phone || '-'}</span>
                        <span>📚 {request.level_code || '-'}</span>
                        <span>🕐 {formatDate(request.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg">لا توجد طلبات انضمام</p>
            <p className="text-sm">سيظهر الطلاب الجدد هنا عند التسجيل</p>
          </div>
        )}
      </div>
    </div>
  )
}