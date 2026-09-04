'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EigentuemerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    assistants: 0,
    pendingRequests: 0,
    online: 0,
    groups: 0,
    exams: 0,
    lessons: 0,
    forumPosts: 0
  })
  const [pendingRequests, setPendingRequests] = useState([])
  const [members, setMembers] = useState([])
  const [deleting, setDeleting] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      if (parsedUser.role !== 'Eigentümer') {
        router.push('/unauthorized')
        return
      }

      await fetchAllData()
      const interval = setInterval(fetchAllData, 30000)
      return () => clearInterval(interval)

    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchPendingRequests(),
      fetchMembers()
    ])
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (res.ok) {
        const online = members.filter(m => isOnline(m.last_seen_at)).length
        setStats({
          ...data,
          online: online || 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch('/api/requests')
      const data = await res.json()
      if (res.ok) {
        setPendingRequests(data.filter(r => r.status === 'pending') || [])
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members')
      const data = await res.json()
      if (res.ok) {
        setMembers(data || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const handleRequest = async (requestId, status) => {
    setProcessing(requestId)
    setActionMessage(null)

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

      setActionMessage(`✅ تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`)
      await fetchAllData()
      
      setTimeout(() => setActionMessage(null), 3000)

    } catch (error) {
      setActionMessage(`❌ ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteMember = async (memberId, memberName) => {
    if (!confirm(`⚠️ هل أنت متأكد من حذف "${memberName}" من المنصة؟\nسيتم حذف جميع بياناته ولا يمكن استعادتها.`)) return

    setDeleting(memberId)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/admin/remove-student?id=${memberId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setActionMessage(`✅ تم حذف "${memberName}" بنجاح`)
      await fetchAllData()
      
      setTimeout(() => setActionMessage(null), 3000)

    } catch (error) {
      setActionMessage(`❌ فشل الحذف: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOnline = (lastSeenAt) => {
    if (!lastSeenAt) return false
    const now = new Date()
    const lastSeen = new Date(lastSeenAt)
    const diffMinutes = (now - lastSeen) / 60000
    return diffMinutes < 5
  }

  const getRoleBadge = (role) => {
    const roleMap = {
      'Eigentümer': { color: 'bg-yellow-400 text-black', label: '👑 مالك' },
      'Lehrer': { color: 'bg-red-500 text-white', label: '👨‍🏫 مدرس' },
      'Assistent': { color: 'bg-blue-500 text-white', label: '🤝 مساعد' },
      'Student': { color: 'bg-green-500 text-white', label: '👨‍🎓 طالب' }
    }
    const info = roleMap[role] || { color: 'bg-gray-500 text-white', label: role }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${info.color}`}>{info.label}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <img 
              src="/logo.png" 
              alt="Loading" 
              className="w-32 h-32 object-contain animate-pulse"
            />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-black animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-600 border-l-yellow-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
          <div className="mt-2 flex justify-center gap-1">
            <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    )
  }

  const owner = members.find(m => m.role_name === 'Eigentümer')

  return (
    <div className="min-h-screen relative bg-custom flex flex-row">
      {/* ✅ خلفية ثابتة مع بلور خفيف */}
      <div className="absolute inset-0 w-full h-full bg-custom"></div>
      <div className="absolute inset-0 w-full h-full bg-black/30 blur-overlay"></div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 p-6 overflow-y-auto order-first relative z-10">
        {activeTab === 'dashboard' && (
          <>
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">الطلاب</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.students}</p>
                  </div>
                  <div className="text-2xl">👨‍🎓</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">المدرسين</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.teachers}</p>
                  </div>
                  <div className="text-2xl">👨‍🏫</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">المساعدين</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.assistants}</p>
                  </div>
                  <div className="text-2xl">🤝</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">طلبات الانضمام</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.pendingRequests}</p>
                  </div>
                  <div className="text-2xl">📋</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">المجموعات</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.groups}</p>
                  </div>
                  <div className="text-2xl">📚</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">الاختبارات</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.exams}</p>
                  </div>
                  <div className="text-2xl">📝</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">الشرح</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.lessons}</p>
                  </div>
                  <div className="text-2xl">📖</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">المنتدى</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.forumPosts}</p>
                  </div>
                  <div className="text-2xl">💬</div>
                </div>
              </div>
            </div>

            {/* طلبات الانضمام */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  📋 طلبات الانضمام
                  {stats.pendingRequests > 0 && (
                    <span className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {stats.pendingRequests} جديدة
                    </span>
                  )}
                </h2>
                <Link href="/eigentuemer/requests" className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors">
                  عرض الكل ←
                </Link>
              </div>
              
              {pendingRequests.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-bold">لا توجد طلبات انضمام معلقة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 4).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors border border-white/30">
                      <div>
                        <p className="font-bold text-gray-900">{request.student_name || 'طالب جديد'}</p>
                        <p className="text-sm text-gray-500" dir="ltr">📱 {request.student_phone || 'رقم غير متوفر'}</p>
                      </div>
                      <Link
                        href="/eigentuemer/requests"
                        className="text-sm bg-orange-500/80 text-white px-3 py-1 rounded-lg font-bold hover:bg-orange-600 transition-colors backdrop-blur-sm"
                      >
                        مراجعة
                      </Link>
                    </div>
                  ))}
                  {pendingRequests.length > 4 && (
                    <div className="text-center text-sm text-gray-500 font-bold pt-2">
                      + {pendingRequests.length - 4} طلبات أخرى
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* قائمة الأعضاء */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200/50">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  👥 الأعضاء
                  <span className="text-sm font-bold text-gray-500">
                    ({members.length} عضو)
                  </span>
                </h2>
              </div>
              
              <div className="p-4">
                {members.length === 0 ? (
                  <div className="text-center py-8 font-bold text-gray-500">
                    لا يوجد أعضاء
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-md hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md">
                                {member.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <span className="font-extrabold text-gray-900">
                                  {member.full_name || 'غير معروف'}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    isOnline(member.last_seen_at) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {isOnline(member.last_seen_at) ? '🟢 متصل' : '⚫ غير متصل'}
                                  </span>
                                  <span className="text-xs text-gray-500 font-bold">
                                    📚 {member.level_code || '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-500 font-bold mt-2 mr-14">
                              <span>📱 {member.phone || '-'}</span>
                              <span>📅 {formatDate(member.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {member.is_active ? '✅ مفعل' : '❌ غير مفعل'}
                            </span>
                            {member.role_name !== 'Eigentümer' && (
                              <button
                                onClick={() => handleDeleteMember(member.id, member.full_name)}
                                disabled={deleting === member.id}
                                className="bg-red-500/80 hover:bg-red-600 text-white font-bold px-3 py-1 rounded-lg transition-colors disabled:opacity-50 text-sm flex items-center gap-1 backdrop-blur-sm"
                              >
                                {deleting === member.id ? '⏳' : '🗑️'} حذف
                              </button>
                            )}
                            {member.role_name === 'Eigentümer' && (
                              <span className="text-xs text-gray-400 font-bold">👑 مالك</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">طلبات الانضمام</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/requests" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الطلبات ←
            </Link>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المجموعات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/groups" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المجموعات ←
            </Link>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المدرسين</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/teachers" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المدرسين ←
            </Link>
          </div>
        )}

        {activeTab === 'assistants' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المساعدين</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/assistants" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المساعدين ←
            </Link>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الاختبارات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/exams" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الاختبارات ←
            </Link>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الشرح</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/lessons" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الشرح ←
            </Link>
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المنتدى</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/forum" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المنتدى ←
            </Link>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">النشاطات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/eigentuemer/activity" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى النشاطات ←
            </Link>
          </div>
        )}
      </div>

      {/* القائمة الجانبية - تدرج ألوان علم ألمانيا (أصفر/أحمر/أسود للمالك) */}
      <div className="w-72 bg-gradient-to-t from-yellow-400/20 via-red-600/10 to-black/95 backdrop-blur-xl border-l border-white/10 text-white min-h-screen flex-shrink-0 shadow-2xl order-last overflow-y-auto relative z-10">
        {/* الهيدر */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider text-white">Hallöchen</span>
              <p className="text-[10px] font-bold text-white/50 tracking-widest">AKADEMIE</p>
            </div>
          </div>
        </div>

        {/* المالك */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-2xl text-black font-extrabold shadow-lg shadow-yellow-500/25">
              {owner?.full_name?.charAt(0) || 'M'}
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{owner?.full_name || 'مالك'}</p>
              <p className="text-sm font-bold text-yellow-400">👑 مالك</p>
            </div>
          </div>
          <p className="text-sm font-bold text-white/40 mt-3">حالة المالك مخفية</p>
        </div>

        {/* قائمة التنقل */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'dashboard' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> النشاط والعضوية
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'requests' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📋</span> طلبات الانضمام
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'groups' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📚</span> المجموعات
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'teachers' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">👨‍🏫</span> المدرسين
          </button>
          <button
            onClick={() => setActiveTab('assistants')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'assistants' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">🤝</span> المساعدين
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'exams' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📝</span> الاختبارات
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'lessons' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📖</span> الشرح
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'forum' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">💬</span> المنتدى
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'activity' 
                ? 'bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border border-yellow-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> النشاطات
          </button>
        </nav>

        {/* زر الخروج - Logout */}
        <div className="absolute bottom-0 w-72 p-6 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('user')
              router.push('/login')
            }}
            className="w-full text-right px-4 py-3 text-base font-extrabold text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all duration-300 flex items-center gap-4 hover:scale-[1.02] group"
          >
            <span className="text-xl group-hover:rotate-12 transition-transform duration-300">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}