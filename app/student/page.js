'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [group, setGroup] = useState({ id: null, name: null })
  const [stats, setStats] = useState({
    available_exams: 0,
    completed_exams: 0,
    total_points: 0,
    level_rank: null,
    level_rank_badge: null,
    group_rank: null,
    group_rank_badge: null,
  })
  const [errors, setErrors] = useState([])
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

      if (parsedUser.role !== 'Student') {
        router.push('/unauthorized')
        return
      }

      setProfile(parsedUser)
      await fetchDashboard(parsedUser.id)

    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async (sId) => {
    try {
      const res = await fetch(`/api/student/dashboard?student_id=${sId}`)
      const data = await res.json()
      if (res.ok) {
        setProfile(data.student)
        setGroup(data.group || { id: null, name: null })
        setStats(data.stats || {})
        setErrors(data.errors || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const getLevelDisplay = (levelCode) => {
    const levels = {
      'A1': { label: 'A1 - مبتدئ', color: 'bg-green-100 text-green-800' },
      'A2': { label: 'A2 - أساسي', color: 'bg-blue-100 text-blue-800' },
      'B1': { label: 'B1 - متوسط', color: 'bg-yellow-100 text-yellow-800' },
      'B2': { label: 'B2 - فوق متوسط', color: 'bg-purple-100 text-purple-800' }
    }
    return levels[levelCode] || { label: levelCode || 'غير محدد', color: 'bg-gray-100 text-gray-800' }
  }

  const formatRankBadge = (rank, badge) => {
    if (rank === null || rank === undefined) return '-'
    const crown = badge === 'crown' ? ' 👑' : badge === 'duplicate' ? ' 🔁' : ''
    return `#${rank}${crown}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
        </div>
      </div>
    )
  }

  const levelInfo = getLevelDisplay(profile?.level_code)
  const studentName = user?.name || user?.full_name || profile?.full_name || 'طالب'

  return (
    <div className="min-h-screen relative bg-custom flex flex-row">
      <div className="absolute inset-0 w-full h-full bg-custom"></div>
      <div className="absolute inset-0 w-full h-full bg-black/30 blur-overlay"></div>

      <div className="flex-1 p-6 overflow-y-auto order-first relative z-10 main-content-mobile">
        {activeTab === 'dashboard' && (
          <>
            {/* ═══ بطاقات الإحصائيات ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 card-mobile">

              {/* ✅ 1. Group */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold uppercase tracking-wider">Group</p>
                    <p className="text-xl font-extrabold text-gray-900 mt-1">
                      {group.name || 'بدون جروب'}
                    </p>
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
              </div>

              {/* ✅ 2. الاختبارات المتاحة */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">الاختبارات المتاحة</p>
                    <p className="text-3xl font-extrabold text-gray-900">{stats.available_exams || 0}</p>
                  </div>
                  <div className="text-4xl">📝</div>
                </div>
              </div>

              {/* ✅ 3. الاختبارات المكتملة */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">الاختبارات المكتملة</p>
                    <p className="text-3xl font-extrabold text-gray-900">{stats.completed_exams || 0}</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>

              {/* ✅ 4. الترتيب على المستوى */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">الترتيب / النقاط</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">
                      {formatRankBadge(stats.level_rank, stats.level_rank_badge)} / {stats.total_points || 0}
                    </p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>
            </div>

            {/* ═══ Rank + الأخطاء ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 card-mobile">

              {/* ✅ صندوق Rank */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-gray-800">
                  📊 Rank
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-gray-600 font-bold">Level</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${levelInfo.color}`}>
                      {levelInfo.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-gray-600 font-bold">النقاط</span>
                    <span className="font-extrabold text-lg text-gray-900">{stats.total_points || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-gray-600 font-bold">Rank (Group)</span>
                    <span className="font-extrabold text-lg text-gray-900">
                      {formatRankBadge(stats.group_rank, stats.group_rank_badge)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ صندوق الأخطاء */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-gray-800">
                  ❌ أخطائي ({errors.length})
                </h2>

                {errors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📖</div>
                    <p className="font-bold">لا توجد أخطاء مسجلة حتى الآن</p>
                    <p className="text-sm font-bold mt-2">ستظهر الأخطاء بعد حل الاختبارات</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {errors.map((err, idx) => (
                      <div key={err.id || idx} className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            📝 {err.exam_title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {formatDate(err.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2">
                          {err.question_text}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex gap-2">
                            <span className="text-gray-500 font-bold">إجابتك:</span>
                            <span className="text-red-700 font-bold">
                              {Array.isArray(err.student_answer)
                                ? err.student_answer.join('، ')
                                : String(err.student_answer)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-gray-500 font-bold">الصح:</span>
                            <span className="text-green-700 font-bold">
                              {Array.isArray(err.correct_answer)
                                ? err.correct_answer.join('، ')
                                : String(err.correct_answer)}
                            </span>
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

        {activeTab === 'lessons' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">دروسي</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/student/lessons" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الدروس ←
            </Link>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">الاختبارات</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/student/exams" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى الاختبارات ←
            </Link>
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">المنتدى</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/student/forum" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى المنتدى ←
            </Link>
          </div>
        )}

        {activeTab === 'my-level' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30 shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-extrabold mb-2 text-gray-900">Rank</h3>
            <p className="font-bold text-gray-500">جاري التطوير...</p>
            <Link href="/student/my-level" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-extrabold transition-colors">
              الذهاب إلى Rank ←
            </Link>
          </div>
        )}
      </div>

      {/* القائمة الجانبية */}
      <div className="w-72 bg-gradient-to-t from-yellow-400/20 via-red-600/10 to-black/95 backdrop-blur-xl border-l border-white/10 text-white min-h-screen flex-shrink-0 shadow-2xl order-last overflow-y-auto relative z-10 sidebar-mobile">
        <div className="p-6 border-b border-white/10 sidebar-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/25">
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-2xl text-white font-extrabold shadow-lg shadow-green-500/25">
              {studentName.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{studentName}</p>
              <p className="text-sm font-bold text-green-400">👨‍🎓 طالب</p>
            </div>
          </div>
          <div className="mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${levelInfo.color}`}>
              {levelInfo.label}
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'dashboard' 
                ? 'bg-green-400/20 text-green-400 shadow-lg shadow-green-500/10 border border-green-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> النشاط والعضوية
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'lessons' 
                ? 'bg-green-400/20 text-green-400 shadow-lg shadow-green-500/10 border border-green-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📚</span> دروسي
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'exams' 
                ? 'bg-green-400/20 text-green-400 shadow-lg shadow-green-500/10 border border-green-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📝</span> الاختبارات
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'forum' 
                ? 'bg-green-400/20 text-green-400 shadow-lg shadow-green-500/10 border border-green-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">💬</span> المنتدى
          </button>
          <button
            onClick={() => setActiveTab('my-level')}
            className={`w-full text-right px-4 py-3 text-base font-extrabold rounded-xl transition-all duration-300 flex items-center gap-4 ${
              activeTab === 'my-level' 
                ? 'bg-green-400/20 text-green-400 shadow-lg shadow-green-500/10 border border-green-400/20' 
                : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
            }`}
          >
            <span className="text-xl">📊</span> Rank
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