'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    groups: 0,
    exams: 0,
    completedExams: 0,
    totalPoints: 0,
    rank: '-'
  })
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

      const userLevelId = parsedUser?.level_id || null
      
      let levelCode = null
      if (userLevelId) {
        try {
          const levelRes = await fetch('/api/levels')
          const levelsData = await levelRes.json()
          if (Array.isArray(levelsData)) {
            const foundLevel = levelsData.find(l => l.id === userLevelId)
            levelCode = foundLevel?.code || null
          }
        } catch (error) {
          console.error('Error fetching levels:', error)
        }
      }

      setProfile({
        ...parsedUser,
        level_code: levelCode
      })

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
      const res = await fetch('/api/student/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
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

  const levelInfo = getLevelDisplay(profile?.level_code)
  const studentName = user?.name || user?.full_name || 'طالب'

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">المجموعات</p>
                    <p className="text-3xl font-extrabold text-gray-900">{stats.groups}</p>
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">الاختبارات المتاحة</p>
                    <p className="text-3xl font-extrabold text-gray-900">{stats.exams}</p>
                  </div>
                  <div className="text-4xl">📝</div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">الاختبارات المكتملة</p>
                    <p className="text-3xl font-extrabold text-gray-900">{stats.completedExams}</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">النقاط / الترتيب</p>
                    <p className="text-3xl font-extrabold text-gray-900">
                      {stats.totalPoints} / #{stats.rank}
                    </p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>
            </div>

            {/* قسم المستوى والأخطاء */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span className="font-extrabold text-lg text-gray-900">{stats.totalPoints}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-gray-600 font-bold">Rank</span>
                    <span className="font-extrabold text-lg text-gray-900">#{stats.rank}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-gray-600 font-bold">الاختبارات المكتملة</span>
                    <span className="font-extrabold text-lg text-gray-900">{stats.completedExams}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-gray-800">
                  ❌ أخطائي
                </h2>
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📖</div>
                  <p className="font-bold">لا توجد أخطاء مسجلة حتى الآن</p>
                  <p className="text-sm font-bold mt-2">ستظهر الأخطاء بعد حل الاختبارات</p>
                </div>
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

      {/* القائمة الجانبية - تدرج ألوان علم ألمانيا */}
      <div className="w-72 bg-gradient-to-t from-yellow-400/20 via-red-600/10 to-black/95 backdrop-blur-xl border-l border-white/10 text-white min-h-screen flex-shrink-0 shadow-2xl order-last overflow-y-auto relative z-10">
        {/* الهيدر */}
        <div className="p-6 border-b border-white/10">
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

        {/* الطالب */}
        <div className="p-6 border-b border-white/10">
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

        {/* قائمة التنقل */}
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