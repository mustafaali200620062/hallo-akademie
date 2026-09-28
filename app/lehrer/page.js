'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LehrerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ groups: 0, students: 0, exams: 0, lessons: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [studentPerformance, setStudentPerformance] = useState([])
  const [strugglingStudents, setStrugglingStudents] = useState([])
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

      if (parsedUser.role !== 'Lehrer' && parsedUser.role !== 'Eigentümer') {
        router.push('/unauthorized')
        return
      }

      await fetchDashboard(parsedUser.id, parsedUser.role)

    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async (tId, tRole) => {
    try {
      const res = await fetch(`/api/teacher/dashboard?teacher_id=${tId}&teacher_role=${tRole}`)
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats || { groups: 0, students: 0, exams: 0, lessons: 0 })
        setRecentActivity(data.recentActivity || [])
        setStudentPerformance(data.studentPerformance || [])
        setStrugglingStudents(data.strugglingStudents || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  // ✅ دالة تحويل الوقت لصيغة "منذ..."
  const timeAgo = (dateStr) => {
    if (!dateStr) return ''

    const now = new Date()
    const past = new Date(dateStr)
    const seconds = Math.floor((now - past) / 1000)

    if (seconds < 60) return 'منذ لحظات'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `منذ ${hours} ساعة`
    const days = Math.floor(hours / 24)
    if (days < 30) return `منذ ${days} يوم`
    const months = Math.floor(days / 30)
    if (months < 12) return `منذ ${months} شهر`
    return `منذ ${Math.floor(months / 12)} سنة`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-32 h-32 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-black animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-600 border-l-yellow-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const teacherName = user?.name || user?.full_name || 'مدرس'

  return (
    <div className="min-h-screen relative bg-custom flex flex-row">
      <div className="absolute inset-0 w-full h-full bg-custom"></div>
      <div className="absolute inset-0 w-full h-full bg-black/30 blur-overlay"></div>

      <div className="flex-1 p-6 overflow-y-auto order-first relative z-10 main-content-mobile">

        {/* ═══════════════ DASHBOARD ═══════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* ✅ الإحصائيات (4 بس) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 card-mobile">
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
                    <p className="text-xs text-gray-600 font-bold">الشرح</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.lessons}</p>
                  </div>
                  <div className="text-2xl">📖</div>
                </div>
              </div>
            </div>

            {/* ✅ آخر النشاطات + أداء الطلاب */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 card-mobile mb-6">

              {/* آخر النشاطات */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
                  📋 آخر النشاطات
                </h2>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-gray-500 font-bold py-4">
                      مفيش نشاطات بعد
                    </p>
                  ) : (
                    recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                        <span className="text-2xl">{activity.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate">
                            {activity.text}
                          </p>
                          <p className="text-xs text-gray-500 font-bold">
                            {timeAgo(activity.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* أداء الطلاب لكل مجموعة */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
                  📊 أداء الطلاب
                </h2>
                <div className="space-y-3">
                  {studentPerformance.length === 0 ? (
                    <p className="text-center text-gray-500 font-bold py-4">
                      مفيش مجموعات بعد
                    </p>
                  ) : (
                    studentPerformance.map((perf, idx) => (
                      <div key={idx} className="p-3 bg-white/50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-extrabold text-gray-800">
                            📚 {perf.group_name}
                          </span>
                          <span className="text-xs text-gray-500 font-bold">
                            {perf.students_count} طالب
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white rounded-lg p-2">
                            <div className="text-[10px] text-gray-500 font-bold">متوسط الدرجات</div>
                            <div className={`text-lg font-extrabold ${
                              perf.avg_score >= 70 ? 'text-green-600' :
                              perf.avg_score >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {perf.avg_score}%
                            </div>
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-2">
                            <div className="text-[10px] text-gray-500 font-bold">نسبة الإكمال</div>
                            <div className={`text-lg font-extrabold ${
                              perf.completion_rate >= 70 ? 'text-green-600' :
                              perf.completion_rate >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {perf.completion_rate}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ✅ الطلاب المتأخرين */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
                ⚠️ الطلاب المتأخرين ({strugglingStudents.length})
              </h2>

              {strugglingStudents.length === 0 ? (
                <p className="text-center text-green-600 font-bold py-4">
                  ✅ كل الطلاب في المستوى المطلوب!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {strugglingStudents.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-extrabold flex-shrink-0">
                          {s.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 font-bold">
                            📚 {s.group_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-extrabold">
                          {s.reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════ باقي التابات (زي ما هي) ═══════════════ */}

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
            <p className="font-bold text-gray-500">شاهد الطلاب اللي بيحلوا الاختبارات حالياً</p>
            <Link href="/lehrer/exams/monitor" className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors">
              الذهاب إلى المتابعة ←
            </Link>
          </div>
        )}

        {activeTab === 'reentry' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📩</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">طلبات استكمال الاختبارات</h3>
            <p className="font-bold text-gray-500">راجع طلبات الطلاب من هنا</p>
            <Link
              href="/lehrer/reentry-requests"
              className="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              الذهاب إلى الطلبات ←
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
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الشرح</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/lehrer/lessons" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الشرح ←
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

      {/* ═══════════════ السايدبار ═══════════════ */}
      <div className="w-72 bg-gradient-to-t from-yellow-400/20 via-red-600/10 to-black/95 backdrop-blur-xl border-l border-white/10 text-white min-h-screen flex-shrink-0 shadow-2xl order-last overflow-y-auto relative z-10 sidebar-mobile">
        <div className="p-6 border-b border-white/10 sidebar-header">
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

        <div className="p-6 border-b border-white/10 sidebar-user">
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
            onClick={() => setActiveTab('reentry')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'reentry'
                ? 'bg-red-400/20 text-red-400 shadow-lg shadow-red-500/10 border border-red-400/20'
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📩</span> طلبات الاستكمال
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
            <span className="text-xl">📖</span> الشرح
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

        <div className="absolute bottom-0 w-72 p-6 border-t border-white/10 sidebar-footer">
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