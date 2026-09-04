'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LehrerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    groups: 0,
    students: 0,
    exams: 0,
    pendingExams: 0,
    lessons: 0,
    forumPosts: 0
  })
  const [activeTab, setActiveTab] = useState('dashboard')
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

      if (parsedUser.role !== 'Lehrer' && parsedUser.role !== 'Eigentümer') {
        router.push('/unauthorized')
        return
      }

      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      if (profileRes.ok) {
        setProfile(profileData)
      }

      await fetchStats()

    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/teacher/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
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

  const teacherName = user?.name || user?.full_name || 'مدرس'

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
                    <p className="text-xs text-gray-600 font-bold">المجموعات</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.groups}</p>
                  </div>
                  <div className="text-2xl">📚</div>
                </div>
              </div>
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
                    <p className="text-xs text-gray-600 font-bold">الاختبارات</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.exams}</p>
                  </div>
                  <div className="text-2xl">📝</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold">قيد الانتظار</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.pendingExams}</p>
                  </div>
                  <div className="text-2xl">⏳</div>
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

            {/* قسم النشاطات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
                  📋 آخر النشاطات
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-sm font-bold text-gray-700">تم إنشاء اختبار جديد</p>
                      <p className="text-xs text-gray-500 font-bold">منذ ساعتين</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                    <span className="text-2xl">📖</span>
                    <div>
                      <p className="text-sm font-bold text-gray-700">تم إضافة شرح جديد</p>
                      <p className="text-xs text-gray-500 font-bold">منذ 5 ساعات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="text-sm font-bold text-gray-700">رد جديد في المنتدى</p>
                      <p className="text-xs text-gray-500 font-bold">منذ يوم</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
                  📊 أداء الطلاب
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">متوسط الدرجات</span>
                    <span className="text-sm font-extrabold text-green-600">85%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">نسبة الإكمال</span>
                    <span className="text-sm font-extrabold text-blue-600">72%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">الطلاب النشطون</span>
                    <span className="text-sm font-extrabold text-yellow-600">{stats.students}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'groups' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">مجموعاتي</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/groups" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المجموعات ←
            </Link>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الاختبارات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/exams" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الاختبارات ←
            </Link>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">👀</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">متابعة الاختبارات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/exam-monitor" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المتابعة ←
            </Link>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">النتائج</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/results" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى النتائج ←
            </Link>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الشروح</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/lessons" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الشروح ←
            </Link>
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المنتدى</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/forum" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المنتدى ←
            </Link>
          </div>
        )}
      </div>

      {/* القائمة الجانبية - تدرج ألوان علم ألمانيا (أحمر) */}
      <div className="w-72 bg-gradient-to-t from-yellow-400/20 via-red-600/10 to-black/95 backdrop-blur-xl border-l border-white/10 text-white min-h-screen flex-shrink-0 shadow-2xl order-last overflow-y-auto relative z-10">
        {/* الهيدر */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/25">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider text-white">Hallöchen</span>
              <p className="text-[10px] font-bold text-white/50 tracking-widest">AKADEMIE</p>
            </div>
          </div>
        </div>

        {/* المدرس */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-2xl text-white font-extrabold shadow-lg shadow-red-500/25">
              {teacherName.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{teacherName}</p>
              <p className="text-sm font-bold text-red-400">👨‍🏫 مدرس</p>
            </div>
          </div>
          <p className="text-sm font-bold text-white/40 mt-3">حالة المدرس مخفية</p>
        </div>

        {/* قائمة التنقل */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'dashboard' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> النشاط والعضوية
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'groups' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📚</span> مجموعاتي
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'exams' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📝</span> الاختبارات
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'monitor' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">👀</span> متابعة الاختبارات
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'results' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> النتائج
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'lessons' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📖</span> الشروح
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'forum' 
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20' 
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