'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AssistentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    groups: 0,
    pendingRequests: 0,
    exams: 0,
    lessons: 0
  })
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [deleting, setDeleting] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

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

      if (parsedUser.role !== 'Assistent' && parsedUser.role !== 'Eigentümer') {
        router.push('/unauthorized')
        return
      }

      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      if (profileRes.ok) {
        setProfile(profileData)
      }

      await fetchStats()
      await fetchPendingRequests()

    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  const owner = { full_name: user?.name || user?.full_name || 'مساعد' }

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                    <p className="text-xs text-gray-600 font-bold">المجموعات</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.groups}</p>
                  </div>
                  <div className="text-2xl">📚</div>
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
                    <p className="text-xs text-gray-600 font-bold">الاختبارات</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.exams}</p>
                  </div>
                  <div className="text-2xl">📝</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">الشروح</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.lessons}</p>
                  </div>
                  <div className="text-2xl">📖</div>
                </div>
              </div>
            </div>

            {/* طلبات الانضمام */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  📋 طلبات الانضمام المعلقة
                  {stats.pendingRequests > 0 && (
                    <span className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {stats.pendingRequests} جديدة
                    </span>
                  )}
                </h2>
                <Link 
                  href="/assistent/requests"
                  className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors"
                >
                  عرض الكل ←
                </Link>
              </div>
              
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-bold">لا توجد طلبات انضمام معلقة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-colors border border-white/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-gray-900">
                            {request.student_name || 'طالب جديد'}
                          </span>
                          <span className="text-sm text-gray-500 font-bold" dir="ltr">
                            📱 {request.student_phone || 'رقم غير متوفر'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500 font-bold mt-1">
                          <span>📚 {request.level_code || 'غير محدد'}</span>
                          <span>🕐 {formatDate(request.created_at)}</span>
                        </div>
                      </div>
                      <Link
                        href="/assistent/requests"
                        className="text-sm bg-orange-500/80 text-white px-3 py-1 rounded-lg font-bold hover:bg-orange-600 transition-colors backdrop-blur-sm"
                      >
                        مراجعة
                      </Link>
                    </div>
                  ))}
                  {pendingRequests.length > 5 && (
                    <div className="text-center text-sm text-gray-500 font-bold pt-2">
                      + {pendingRequests.length - 5} طلبات أخرى
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">طلبات الانضمام</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/assistent/requests" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الطلبات ←
            </Link>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المجموعات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/assistent/groups" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المجموعات ←
            </Link>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الاختبارات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/assistent/exams" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الاختبارات ←
            </Link>
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المنتدى</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/assistent/forum" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المنتدى ←
            </Link>
          </div>
        )}
      </div>

      {/* القائمة الجانبية - تدرج ألوان علم ألمانيا (أزرق للمساعد) */}
      <div className="w-72 bg-gradient-to-t from-yellow-400/20 via-red-600/10 to-black/95 backdrop-blur-xl border-l border-white/10 text-white min-h-screen flex-shrink-0 shadow-2xl order-last overflow-y-auto relative z-10">
        {/* الهيدر */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider text-white">Hallöchen</span>
              <p className="text-[10px] font-bold text-white/50 tracking-widest">AKADEMIE</p>
            </div>
          </div>
        </div>

        {/* المساعد */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-2xl text-white font-extrabold shadow-lg shadow-blue-500/25">
              {owner?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{owner?.full_name || 'مساعد'}</p>
              <p className="text-sm font-bold text-blue-400">🤝 مساعد</p>
            </div>
          </div>
          <p className="text-sm font-bold text-white/40 mt-3">حالة المساعد مخفية</p>
        </div>

        {/* قائمة التنقل */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'dashboard' 
                ? 'bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> النشاط والعضوية
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'requests' 
                ? 'bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📋</span> طلبات الانضمام
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'groups' 
                ? 'bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📚</span> المجموعات
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'exams' 
                ? 'bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📝</span> الاختبارات
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'forum' 
                ? 'bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">💬</span> المنتدى
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