'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function GameLivePage({ params }) {
  const router = useRouter()
  const [gameId, setGameId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState(null)
  const [session, setSession] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const prevScoresRef = useRef({})

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setGameId(resolved.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (gameId) {
      checkUser()
    }
  }, [gameId])

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
    await fetchData(parsed.id)
  }

  const fetchData = useCallback(async (tId) => {
    if (!tId || !gameId) return

    try {
      // ✅ جلب اللعبة
      const gameRes = await fetch(`/api/teacher/games?teacher_id=${tId}&game_id=${gameId}`)
      const gameData = await gameRes.json()
      if (!gameRes.ok) throw new Error(gameData.error || 'خطأ')
      setGame(gameData)

      // ✅ جلب الجلسة
      const sessionRes = await fetch(`/api/teacher/games/session?game_id=${gameId}`)
      const sessionData = await sessionRes.json()

      if (sessionRes.ok && sessionData.session) {
        setSession(sessionData.session)
        setTeams(sessionData.teams || [])
        setPlayers(sessionData.players || [])

        // ✅ حساب الوقت
        const start = new Date(sessionData.session.started_at).getTime()
        const now = Date.now()
        setElapsed(Math.floor((now - start) / 1000))

        // ✅ تشغيل التحديث التلقائي
      } else {
        // ✅ مفيش جلسة نشطة → نرجع لصفحة الإدارة
        router.push(`/lehrer/games/${gameId}`)
      }

      setLastUpdate(new Date())

    } catch (err) {
      console.error('fetchData error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId, router])

  // ✅ التحميل الأول
  useEffect(() => {
    if (gameId) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      if (userData.id) {
        fetchData(userData.id)
      }
    }
  }, [gameId, fetchData])

  // ✅ Live Update كل 3 ثواني
  useEffect(() => {
    if (!autoRefresh || !gameId) return

    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    const tId = userData.id
    if (!tId) return

    const interval = setInterval(() => {
      fetchData(tId)
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh, gameId, fetchData])

  // ✅ عداد الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ✅ إغلاق الجلسة
  const handleEnd = async () => {
    if (!confirm('⚠️ هل أنت متأكد من إغلاق اللعبة؟')) return

    const userData = JSON.parse(localStorage.getItem('user') || '{}')

    try {
      const res = await fetch('/api/teacher/games/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          session_id: session.id,
          teacher_id: userData.id,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ')

      router.push(`/lehrer/games/${gameId}`)

    } catch (err) {
      setError(err.message)
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-32 h-32 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-r-white animate-spin"></div>
          </div>
          <p className="mt-6 text-xl font-black text-white animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!game || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-bold">اللعبة مش شغالة حالياً</p>
          <button
            onClick={() => router.push(`/lehrer/games/${gameId}`)}
            className="mt-4 bg-red-600 px-6 py-2 rounded-lg font-bold"
          >
            ← رجوع
          </button>
        </div>
      </div>
    )
  }

  // ✅ ترتيب الفرق حسب النقاط (للوضع الجماعي)
  const sortedTeams = [...teams].sort((a, b) => (b.total_score || 0) - (a.total_score || 0))

  // ✅ ترتيب اللاعبين (للوضع الفردي)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))

  // ✅ إحصائيات
  const joinedCount = players.filter(p => p.is_joined).length
  const totalPlayers = players.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">

      {/* ═══ Header ═══ */}
      <div className="bg-black/40 backdrop-blur-lg border-b-2 border-red-500/30 sticky top-0 z-30 safe-top">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-10 md:h-14 w-10 md:w-14 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-3xl font-extrabold truncate">
                  🎮 {game.title}
                </h1>
                <p className="text-xs md:text-sm text-gray-400 font-bold">
                  {game.mode === 'teams' ? '👥 وضع الفرق' : '👤 وضع فردي'} • {totalPlayers} طالب ({joinedCount} منضم)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* عداد الوقت */}
              <div className="bg-red-600/90 px-3 md:px-5 py-2 md:py-3 rounded-xl text-center min-w-[70px] md:min-w-[110px]">
                <div className="text-lg md:text-3xl font-extrabold" dir="ltr">
                  {formatTime(elapsed)}
                </div>
                <div className="text-[9px] md:text-xs font-bold opacity-90">⏱️ الوقت</div>
              </div>

              {/* Live indicator */}
              <div className="hidden md:flex items-center gap-2 bg-green-600/90 px-4 py-3 rounded-xl">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                <span className="font-extrabold">مباشر</span>
              </div>

              {/* End button */}
              <button
                onClick={handleEnd}
                className="bg-red-600 hover:bg-red-700 px-3 md:px-5 py-2 md:py-3 rounded-xl font-extrabold transition-colors active:scale-95 text-sm md:text-base"
              >
                🛑 <span className="hidden md:inline">إغلاق</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-4 md:py-8">

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-4 font-bold">
            ❌ {error}
          </div>
        )}

        {/* ═══════════════════════════════ */}
        {/* وضع الفرق */}
        {/* ═══════════════════════════════ */}
        {game.mode === 'teams' && (
          <>
            {sortedTeams.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-7xl mb-4">👥</div>
                <p className="text-2xl font-bold text-gray-400">مفيش فرق</p>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${sortedTeams.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : sortedTeams.length <= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                {sortedTeams.map((team, index) => {
                  const teamPlayers = players.filter(p => p.team_id === team.id)
                  const isFirst = index === 0
                  return (
                    <div
                      key={team.id}
                      className={`rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl transition-all duration-500 ${
                        isFirst ? 'scale-100 md:scale-105 ring-4 ring-yellow-400' : ''
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${team.team_color}40 0%, ${team.team_color}15 100%)`,
                        borderTop: `5px solid ${team.team_color}`,
                      }}
                    >
                      {/* اسم الفريق */}
                      <div className="text-center mb-3 md:mb-4">
                        {isFirst && (
                          <div className="text-2xl md:text-4xl mb-1">👑</div>
                        )}
                        <div
                          className="text-sm md:text-xl font-extrabold truncate"
                          style={{ color: team.team_color }}
                        >
                          {team.team_name}
                        </div>
                      </div>

                      {/* النقاط */}
                      <div className="text-center mb-3 md:mb-4">
                        <div
                          className="text-4xl md:text-7xl font-extrabold tabular-nums"
                          style={{ color: team.team_color }}
                        >
                          {team.total_score || 0}
                        </div>
                        <div className="text-[10px] md:text-sm font-bold text-gray-400 mt-0.5">
                          نقطة
                        </div>
                      </div>

                      {/* اللاعبين */}
                      <div className="space-y-1 md:space-y-1.5 max-h-48 md:max-h-64 overflow-y-auto no-scrollbar">
                        {teamPlayers.map(player => (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between gap-2 text-[11px] md:text-sm rounded-lg px-2 py-1 ${
                              player.is_joined ? 'bg-white/10' : 'bg-white/5 opacity-50'
                            }`}
                          >
                            <span className="font-bold truncate">
                              {player.is_joined ? '🟢' : '⚪'} {player.student_name}
                            </span>
                            <span className="font-extrabold flex-shrink-0" style={{ color: team.team_color }}>
                              {player.score || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════ */}
        {/* وضع فردي */}
        {/* ═══════════════════════════════ */}
        {game.mode === 'solo' && (
          <>
            {sortedPlayers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-7xl mb-4">👤</div>
                <p className="text-2xl font-bold text-gray-400">مفيش لاعبين</p>
              </div>
            ) : (
              <>
                {/* Top 3 */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                  {[1, 0, 2].map((pos) => {
                    const player = sortedPlayers[pos]
                    if (!player) return <div key={pos}></div>
                    const medals = ['🥇', '🥈', '🥉']
                    const heights = ['h-40 md:h-52', 'h-32 md:h-44', 'h-28 md:h-40']
                    const colors = ['from-yellow-500/40 to-yellow-700/20 border-yellow-400', 'from-gray-300/40 to-gray-500/20 border-gray-300', 'from-orange-400/40 to-orange-600/20 border-orange-400']

                    const medalIdx = pos === 0 ? 0 : pos === 1 ? 1 : 2
                    const heightIdx = pos === 0 ? 0 : pos === 1 ? 1 : 2

                    return (
                      <div
                        key={player.id}
                        className={`bg-gradient-to-b ${colors[medalIdx]} backdrop-blur-md rounded-2xl md:rounded-3xl ${heights[heightIdx]} flex flex-col items-center justify-center p-3 md:p-5 border-2 shadow-2xl transition-all duration-500`}
                      >
                        <div className="text-3xl md:text-5xl mb-1 md:mb-2">{medals[medalIdx]}</div>
                        <div className="text-xs md:text-base font-extrabold text-center truncate w-full">
                          {player.student_name}
                        </div>
                        <div className="text-2xl md:text-4xl font-extrabold mt-1 md:mt-2">
                          {player.score || 0}
                        </div>
                        <div className="text-[10px] md:text-xs font-bold opacity-80">
                          نقطة
                        </div>
                        {!player.is_joined && (
                          <div className="text-[10px] text-gray-300 font-bold mt-1">⚪ لم ينضم</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* الباقي */}
                {sortedPlayers.length > 3 && (
                  <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 md:p-5 border border-white/10">
                    <h3 className="text-sm md:text-lg font-extrabold mb-3 text-gray-300">
                      🏆 باقي الترتيب
                    </h3>
                    <div className="space-y-1.5 md:space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                      {sortedPlayers.slice(3).map((player, idx) => (
                        <div
                          key={player.id}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg ${
                            player.is_joined ? 'bg-white/10' : 'bg-white/5 opacity-50'
                          }`}
                        >
                          <span className="text-gray-400 font-extrabold text-xs md:text-sm w-7 md:w-10 flex-shrink-0">
                            #{idx + 4}
                          </span>
                          <span className="font-bold text-sm md:text-base flex-1 truncate">
                            {player.is_joined ? '🟢' : '⚪'} {player.student_name}
                          </span>
                          <span className="font-extrabold text-sm md:text-base flex-shrink-0">
                            {player.score || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="text-center text-xs md:text-sm text-gray-500 font-bold mt-6 md:mt-8">
          آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG')} • تحديث تلقائي كل 3 ثواني
        </div>
      </div>
    </div>
  )
}