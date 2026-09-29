'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerGamesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filterGroup, setFilterGroup] = useState('all')
  const [groups, setGroups] = useState([])

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
    await fetchAll(parsed.id)
  }

  const fetchAll = async (teacherId) => {
    try {
      // ✅ جلب الجروبات
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) {
        const teacherGroups = groupsData.filter(g => g.teacher_id === teacherId)
        setGroups(teacherGroups || [])
      }

      // ✅ جلب الألعاب
      const gamesRes = await fetch(`/api/teacher/games?teacher_id=${teacherId}`)
      const gamesData = await gamesRes.json()
      if (gamesRes.ok) {
        setGames(gamesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (gameId, gameTitle) => {
    if (!confirm(`⚠️ هل أنت متأكد من حذف لعبة "${gameTitle}"؟`)) return

    setDeleting(gameId)
    setError(null)
    setSuccess(null)

    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      const res = await fetch(`/api/teacher/games?game_id=${gameId}&teacher_id=${userData.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')

      setSuccess('✅ تم حذف اللعبة')
      await fetchAll(userData.id)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'active') return { text: '🔴 شغالة الآن', cls: 'bg-red-100 text-red-800 border-red-300' }
    if (status === 'ready') return { text: '✅ جاهزة', cls: 'bg-green-100 text-green-800 border-green-300' }
    if (status === 'closed') return { text: '🔒 مقفولة', cls: 'bg-gray-100 text-gray-700 border-gray-300' }
    return { text: '📝 مسودة', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
  }

  const getModeBadge = (mode) => {
    if (mode === 'teams') return { text: '👥 فرق', cls: 'bg-purple-100 text-purple-800' }
    return { text: '👤 فردي', cls: 'bg-blue-100 text-blue-800' }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getFilteredGames = () => {
    if (filterGroup === 'all') return games
    return games.filter(g => g.group_id === filterGroup)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const filteredGames = getFilteredGames()

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-red-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">🎮 الألعاب</h1>
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

        {/* ═══ Top Bar: Count + Add Button ═══ */}
        <div className="bg-white rounded-2xl shadow-md p-3 md:p-4 mb-4 md:mb-6 border border-gray-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs md:text-sm font-bold text-gray-600">
              الإجمالي: <strong>{games.length}</strong>
            </span>
            <button
              onClick={() => router.push('/lehrer/games/create')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-extrabold text-xs md:text-sm transition-colors active:scale-95 flex items-center gap-1.5"
            >
              ➕ لعبة جديدة
            </button>
          </div>

          {/* Filter by Group */}
          {groups.length > 0 && (
            <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setFilterGroup('all')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                  filterGroup === 'all'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📚 الكل ({games.length})
              </button>
              {groups.map((group) => {
                const count = games.filter(g => g.group_id === group.id).length
                return (
                  <button
                    key={group.id}
                    onClick={() => setFilterGroup(group.id)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                      filterGroup === group.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {group.name} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ═══ Games List ═══ */}
        {filteredGames.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center text-gray-500 border border-gray-100 fade-in-up">
            <div className="text-5xl md:text-6xl mb-4">🎮</div>
            <p className="text-base md:text-xl font-extrabold">لا توجد ألعاب</p>
            <p className="text-xs md:text-sm font-bold mt-2 mb-5">ابدأ بإنشاء أول لعبة لمجموعاتك!</p>
            <button
              onClick={() => router.push('/lehrer/games/create')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-extrabold text-sm md:text-base transition-colors active:scale-95"
            >
              ➕ إنشاء لعبة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredGames.map((game) => {
              const statusBadge = getStatusBadge(game.status)
              const modeBadge = getModeBadge(game.mode)

              return (
                <div key={game.id} className="bg-white rounded-2xl shadow-md p-4 md:p-5 border border-gray-100 fade-in-up">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 text-base md:text-lg truncate">
                        🎮 {game.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 font-bold mt-1">
                        📚 {game.group_name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border ${statusBadge.cls}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>

                  {/* Info Badges */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${modeBadge.cls}`}>
                      {modeBadge.text}
                    </span>
                    <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-orange-100 text-orange-800">
                      🎯 مطابقة
                    </span>
                    <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-gray-100 text-gray-600">
                      📅 {formatDate(game.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/lehrer/games/${game.id}`)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-2 md:py-2.5 rounded-lg transition-colors text-xs md:text-sm active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      ⚙️ إدارة
                    </button>
                    <button
                      onClick={() => handleDelete(game.id, game.title)}
                      disabled={deleting === game.id || game.status === 'active'}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 md:py-2.5 px-3 md:px-4 rounded-lg transition-colors text-xs md:text-sm active:scale-95 disabled:opacity-40 flex items-center justify-center"
                      title={game.status === 'active' ? 'مش ممكن تحذف لعبة شغالة' : 'حذف'}
                    >
                      {deleting === game.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}