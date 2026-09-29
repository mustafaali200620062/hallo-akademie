'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentGamesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState(null)
  const [game, setGame] = useState(null)
  const [session, setSession] = useState(null)
  const [player, setPlayer] = useState(null)
  const [teams, setTeams] = useState([])
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

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
    if (parsed.role !== 'Student') {
      router.push('/unauthorized')
      return
    }
    setStudentId(parsed.id)
    await fetchActiveGame(parsed.id)
  }

  const fetchActiveGame = async (sId) => {
    try {
      // ✅ 1. ابحث عن لعبة نشطة في جروبات الطالب
      const res = await fetch(`/api/teacher/games/session?student_id=${sId}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'خطأ')

      if (!data.session || !data.game) {
        // مفيش لعبة شغالة
        setGame(null)
        setSession(null)
        setPlayer(null)
        setLoading(false)
        return
      }

      setGame(data.game)
      setSession(data.session)
      setPlayer(data.player || null)

      // ✅ 2. لو في جلسة، نجيب الفرق
      if (data.session && data.session.id) {
        const sessionRes = await fetch(`/api/teacher/games/session?session_id=${data.session.id}`)
        const sessionData = await sessionRes.json()

        if (sessionRes.ok) {
          setTeams(sessionData.teams || [])
          // ✅ نحدث حالة اللاعب
          const myPlayer = (sessionData.players || []).find(p => p.student_id === sId)
          if (myPlayer) setPlayer(myPlayer)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('fetchActiveGame error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // ✅ Live update كل 5 ثواني
  useEffect(() => {
    if (!studentId) return

    const interval = setInterval(() => {
      fetchActiveGame(studentId)
    }, 5000)

    return () => clearInterval(interval)
  }, [studentId])

  // ✅ Join اللعبة
  const handleJoin = async (teamId = null) => {
    setJoining(true)
    setError(null)

    try {
      const res = await fetch('/api/student/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          student_id: studentId,
          team_id: teamId,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')

      // ✅ انتقل لصفحة اللعب
      router.push(`/student/games/${session.id}`)

    } catch (err) {
      setError(err.message)
      setJoining(false)
    }
  }

  // ✅ لو منضم → انتقل مباشرة للعب
  const handleContinuePlaying = () => {
    router.push(`/student/games/${session.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-purple-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">🎮 الألعاب</h1>
            </div>
            <button
              onClick={() => router.push('/student')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← رجوع
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* مفيش لعبة شغالة */}
        {/* ═══════════════════════════════════ */}
        {!game || !session ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center fade-in-up">
            <div className="text-6xl md:text-7xl mb-4">🎮</div>
            <h2 className="text-lg md:text-2xl font-extrabold text-gray-800 mb-2">
              لا توجد لعبة شغالة حالياً
            </h2>
            <p className="text-xs md:text-sm font-bold text-gray-500 mb-6">
              لما المدرس يبدأ لعبة، هتظهر هنا مباشرة
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-xs md:text-sm">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              <span>يتم التحديث تلقائياً...</span>
            </div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════ */}
            {/* فيه لعبة شغالة */}
            {/* ═══════════════════════════════════ */}

            {/* بانر اللعبة */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl shadow-xl p-5 md:p-6 mb-4 md:mb-6 fade-in-up">
              <div className="text-center mb-4">
                <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs md:text-sm font-bold mb-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-300 animate-pulse mr-1.5"></span>
                  مباشر الآن
                </div>
                <div className="text-5xl md:text-6xl mb-2 animate-bounce">🎮</div>
                <h2 className="text-xl md:text-3xl font-extrabold">
                  {game.title}
                </h2>
                <p className="text-sm md:text-base opacity-90 font-bold mt-2">
                  {game.mode === 'teams' ? '👥 وضع الفرق' : '👤 وضع فردي'} • 🎯 مطابقة
                </p>
              </div>
            </div>

            {/* ═══ الحالة 1: الطالب منضم بالفعل ═══ */}
            {player && player.is_joined ? (
              <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 mb-4 md:mb-6 fade-in-up">
                <div className="text-center mb-5">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-lg md:text-xl font-extrabold text-gray-800 mb-1">
                    أنت منضم للعبة!
                  </h3>
                  {player.team && (
                    <div
                      className="inline-block px-4 py-2 rounded-full font-extrabold text-sm md:text-base"
                      style={{
                        backgroundColor: player.team.team_color + '20',
                        color: player.team.team_color,
                        border: `2px solid ${player.team.team_color}`
                      }}
                    >
                      {player.team.team_name}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleContinuePlaying}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-base md:text-lg btn-app"
                >
                  🚀 ادخل اللعب
                </button>
              </div>
            ) : (
              /* ═══ الحالة 2: الطالب لسه منضمش ═══ */
              <>
                {/* الوضع الفردي */}
                {game.mode === 'solo' && (
                  <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 mb-4 md:mb-6 fade-in-up">
                    <div className="text-center mb-5">
                      <div className="text-5xl mb-3">🎯</div>
                      <h3 className="text-lg md:text-xl font-extrabold text-gray-800 mb-2">
                        مستعد للعب؟
                      </h3>
                      <p className="text-xs md:text-sm font-bold text-gray-500">
                        اضغط Join للانضمام وابدأ المنافسة
                      </p>
                    </div>

                    <button
                      onClick={() => handleJoin(null)}
                      disabled={joining}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-base md:text-lg btn-app"
                    >
                      {joining ? '⏳ جاري الانضمام...' : '✅ Join - انضم للعبة'}
                    </button>
                  </div>
                )}

                {/* الوضع الجماعي */}
                {game.mode === 'teams' && (
                  <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 mb-4 md:mb-6 fade-in-up">
                    <div className="text-center mb-5">
                      <div className="text-5xl mb-3">👥</div>
                      <h3 className="text-lg md:text-xl font-extrabold text-gray-800 mb-2">
                        اختر فريقك
                      </h3>
                      <p className="text-xs md:text-sm font-bold text-gray-500">
                        اضغط على اسم فريقك للانضمام
                      </p>
                    </div>

                    {teams.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-xs md:text-sm font-bold text-yellow-700">
                          ⏳ في انتظار تحديد الفرق من المدرس
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {teams.map(team => {
                          const teamPlayers = (sessionPlayersFromTeams || [])
                          const membersCount = team.members_count || 0

                          return (
                            <button
                              key={team.id}
                              onClick={() => handleJoin(team.id)}
                              disabled={joining}
                              className="p-4 md:p-5 rounded-2xl font-extrabold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                              style={{
                                background: `linear-gradient(135deg, ${team.team_color} 0%, ${team.team_color}dd 100%)`,
                                border: `3px solid ${team.team_color}`,
                              }}
                            >
                              <div className="text-3xl md:text-4xl mb-2">🎯</div>
                              <div className="text-sm md:text-base truncate">
                                {team.team_name}
                              </div>
                              {membersCount > 0 && (
                                <div className="text-[10px] md:text-xs opacity-90 mt-1 font-bold">
                                  {membersCount} عضو
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* نصيحة */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 text-center">
              <p className="text-[11px] md:text-xs font-bold text-blue-700">
                💡 الصفحة بتتحدث تلقائياً كل 5 ثواني
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}