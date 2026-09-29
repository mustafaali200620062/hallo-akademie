'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

export default function GameManagePage({ params }) {
  const router = useRouter()
  const [gameId, setGameId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [session, setSession] = useState(null)
  const [sessionTeams, setSessionTeams] = useState([])
  const [sessionPlayers, setSessionPlayers] = useState([])
  const [teacherId, setTeacherId] = useState(null)

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)

  // ✅ إدارة الفرق
  const [teams, setTeams] = useState([
    { name: 'الفريق الأول', color: '#3b82f6', student_ids: [] },
    { name: 'الفريق الثاني', color: '#ef4444', student_ids: [] },
  ])

  const [activeTeamIndex, setActiveTeamIndex] = useState(0)

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
    setTeacherId(parsed.id)
    await fetchGame(parsed.id)
  }

  const fetchGame = async (tId) => {
    try {
      // ✅ جلب اللعبة
      const res = await fetch(`/api/teacher/games?teacher_id=${tId}&game_id=${gameId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ')

      setGame(data)

      // ✅ جلب طلاب المجموعة
      const studentsRes = await fetch(`/api/groups/students?group_id=${data.group_id}`)
      const studentsData = await studentsRes.json()
      if (studentsRes.ok) setGroupStudents(studentsData || [])

      // ✅ جلب الجلسة النشطة
      if (data.status === 'active') {
        const sessionRes = await fetch(`/api/teacher/games/session?game_id=${gameId}`)
        const sessionData = await sessionRes.json()
        if (sessionRes.ok && sessionData.session) {
          setSession(sessionData.session)
          setSessionTeams(sessionData.teams || [])
          setSessionPlayers(sessionData.players || [])
        }
      }

    } catch (err) {
      console.error('fetchGame error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════
  // إدارة الفرق (لما الوضع جماعي)
  // ═══════════════════════════════════════
  const addTeam = () => {
    if (teams.length >= 6) {
      setError('الحد الأقصى 6 فرق')
      return
    }
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
    setTeams(prev => [
      ...prev,
      {
        name: `الفريق ${prev.length + 1}`,
        color: colors[prev.length % colors.length],
        student_ids: []
      }
    ])
  }

  const removeTeam = (index) => {
    if (teams.length <= 2) {
      setError('لازم فريقين على الأقل')
      return
    }
    setTeams(prev => prev.filter((_, i) => i !== index))
    if (activeTeamIndex >= teams.length - 1) {
      setActiveTeamIndex(0)
    }
  }

  const updateTeamName = (index, name) => {
    setTeams(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], name }
      return copy
    })
  }

  const toggleStudentInTeam = (studentId) => {
    setTeams(prev => {
      const copy = [...prev]
      const team = copy[activeTeamIndex]
      const isIn = team.student_ids.includes(studentId)

      // ✅ شيل الطالب من كل الفرق الأول
      for (let i = 0; i < copy.length; i++) {
        copy[i] = {
          ...copy[i],
          student_ids: copy[i].student_ids.filter(id => id !== studentId)
        }
      }

      // ✅ ضيفه في الفريق النشط لو مكانش فيه
      if (!isIn) {
        copy[activeTeamIndex] = {
          ...copy[activeTeamIndex],
          student_ids: [...copy[activeTeamIndex].student_ids, studentId]
        }
      }

      return copy
    })
  }

  // ✅ خلط عشوائي
  const shuffleTeams = () => {
    const shuffled = [...groupStudents].sort(() => Math.random() - 0.5)
    const newTeams = teams.map(t => ({ ...t, student_ids: [] }))

    shuffled.forEach((student, i) => {
      const teamIdx = i % newTeams.length
      newTeams[teamIdx].student_ids.push(student.student_id)
    })

    setTeams(newTeams)
    setSuccess('🎲 تم الخلط العشوائي!')
    setTimeout(() => setSuccess(null), 2000)
  }

  // ✅ مسح التعيينات
  const clearTeams = () => {
    setTeams(prev => prev.map(t => ({ ...t, student_ids: [] })))
  }

  // ═══════════════════════════════════════
  // بدء اللعب
  // ═══════════════════════════════════════
  const handleStart = async () => {
    setError(null)
    setSuccess(null)

    // ✅ تحقق
    if (!game.content) {
      setError('اللعبة مفيهاش محتوى')
      return
    }

    // ✅ لو teams، لازم كل الطلاب يكونوا موزعين
    if (game.mode === 'teams') {
      const totalAssigned = teams.reduce((sum, t) => sum + t.student_ids.length, 0)
      if (totalAssigned !== groupStudents.length) {
        if (!confirm(`⚠️ فيه ${groupStudents.length - totalAssigned} طالب مش موزع. تكمل؟`)) {
          return
        }
      }
    }

    setStarting(true)

    try {
      const body = {
        action: 'start',
        game_id: gameId,
        teacher_id: teacherId,
      }

      if (game.mode === 'teams') {
        body.teams_config = teams
      }

      const res = await fetch('/api/teacher/games/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')

      setSuccess('✅ تم بدء اللعبة!')

      // ✅ نحدث البيانات
      setTimeout(async () => {
        await fetchGame(teacherId)
        router.push(`/lehrer/games/${gameId}/live`)
      }, 800)

    } catch (err) {
      setError(err.message)
      setStarting(false)
    }
  }

  // ═══════════════════════════════════════
  // إغلاق اللعبة
  // ═══════════════════════════════════════
  const handleEnd = async () => {
    if (!confirm('⚠️ هل أنت متأكد من إغلاق اللعبة؟ الطلاب مش هيقدروا يلعبوا تاني.')) return

    setEnding(true)
    setError(null)

    try {
      const res = await fetch('/api/teacher/games/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          session_id: session.id,
          teacher_id: teacherId,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')

      setSuccess('✅ تم إغلاق اللعبة')
      await fetchGame(teacherId)
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      setError(err.message)
    } finally {
      setEnding(false)
    }
  }

  // ✅ تحليل محتوى اللعبة
  const parseContent = () => {
    if (!game?.content) return { pairs: [] }
    try {
      return typeof game.content === 'string' ? JSON.parse(game.content) : game.content
    } catch (e) {
      return { pairs: [] }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })
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

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-bold text-gray-700">اللعبة غير موجودة</p>
          <button
            onClick={() => router.push('/lehrer/games')}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-bold"
          >
            ← رجوع
          </button>
        </div>
      </div>
    )
  }

  const content = parseContent()
  const pairs = content.pairs || []
  const isActive = game.status === 'active'

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className={`${isActive ? 'bg-red-600' : 'bg-red-600'} text-white shadow-lg sticky top-0 z-30 safe-top`}>
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">⚙️ {game.title}</h1>
              {isActive && (
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold flex-shrink-0 animate-pulse">
                  🔴 مباشر
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/lehrer/games')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← رجوع
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {/* Alerts */}
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

        {/* ═══════════════════════════════════ */}
        {/* 1. لو اللعبة شغالة → شاشة التحكم */}
        {/* ═══════════════════════════════════ */}
        {isActive && session ? (
          <>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-5 md:p-6 mb-4 md:mb-6 fade-in-up">
              <div className="text-center">
                <div className="text-4xl md:text-5xl mb-2 animate-pulse">🎮</div>
                <h2 className="text-lg md:text-2xl font-extrabold">اللعبة شغالة الآن!</h2>
                <p className="text-xs md:text-sm opacity-90 font-bold mt-1">
                  بدأت: {formatDate(session.started_at)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => router.push(`/lehrer/games/${gameId}/live`)}
                  className="bg-white text-green-700 font-extrabold py-3 rounded-xl shadow-md transition-all active:scale-95 text-sm md:text-base"
                >
                  📺 شاشة العرض
                </button>
                <button
                  onClick={handleEnd}
                  disabled={ending}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm md:text-base"
                >
                  {ending ? '⏳...' : '🛑 إغلاق'}
                </button>
              </div>
            </div>

            {/* إحصائيات الفرق */}
            {game.mode === 'teams' && sessionTeams.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 fade-in-up">
                <h3 className="text-base md:text-lg font-extrabold mb-3 text-gray-800">
                  🏆 النتائج المباشرة
                </h3>
                <div className="space-y-2">
                  {sessionTeams.map(team => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: team.team_color + '20', borderLeft: `4px solid ${team.team_color}` }}
                    >
                      <span className="font-extrabold text-gray-800 text-sm md:text-base">
                        {team.team_name}
                      </span>
                      <span className="font-extrabold text-lg md:text-xl" style={{ color: team.team_color }}>
                        {team.total_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* ═══════════════════════════════════ */}
            {/* 2. لو اللعبة مش شغالة → التفاصيل */}
            {/* ═══════════════════════════════════ */}

            {/* معلومات اللعبة */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 fade-in-up">
              <h2 className="text-base md:text-lg font-extrabold mb-3 text-gray-800">
                📋 معلومات اللعبة
              </h2>
              <div className="space-y-2 text-sm md:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-bold">الوضع:</span>
                  <span className="font-extrabold">
                    {game.mode === 'teams' ? '👥 فرق' : '👤 فردي'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-bold">عدد الأزواج:</span>
                  <span className="font-extrabold">{pairs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-bold">عدد الطلاب:</span>
                  <span className="font-extrabold">{groupStudents.length}</span>
                </div>
              </div>
            </div>

            {/* إدارة الفرق (لو teams) */}
            {game.mode === 'teams' && (
              <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 fade-in-up">
                <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
                  <h3 className="text-base md:text-lg font-extrabold text-gray-800">
                    👥 إدارة الفرق ({teams.length})
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={shuffleTeams}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
                    >
                      🎲 خلط
                    </button>
                    <button
                      onClick={clearTeams}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
                    >
                      🗑️ مسح
                    </button>
                  </div>
                </div>

                {/* Team Tabs */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-1">
                  {teams.map((team, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTeamIndex(i)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 active:scale-95 ${
                        activeTeamIndex === i ? 'text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                      style={activeTeamIndex === i ? { backgroundColor: team.color } : {}}
                    >
                      {team.name} ({team.student_ids.length})
                    </button>
                  ))}
                  <button
                    onClick={addTeam}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-green-100 text-green-700 whitespace-nowrap flex-shrink-0 active:scale-95"
                  >
                    ➕ فريق
                  </button>
                </div>

                {/* Team Name + Delete */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={teams[activeTeamIndex]?.name || ''}
                    onChange={(e) => updateTeamName(activeTeamIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold focus:outline-none"
                    style={{ borderColor: teams[activeTeamIndex]?.color }}
                  />
                  <button
                    onClick={() => removeTeam(activeTeamIndex)}
                    disabled={teams.length <= 2}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40 active:scale-95"
                  >
                    🗑️
                  </button>
                </div>

                {/* Students List */}
                <p className="text-xs text-gray-500 font-bold mb-2">
                  اضغط على الطالب لإضافته/إزالته من الفريق النشط:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto no-scrollbar">
                  {groupStudents.map(student => {
                    const teamIndex = teams.findIndex(t => t.student_ids.includes(student.student_id))
                    const inTeam = teamIndex >= 0
                    const teamColor = inTeam ? teams[teamIndex].color : null
                    const teamName = inTeam ? teams[teamIndex].name : null

                    return (
                      <button
                        key={student.student_id}
                        onClick={() => toggleStudentInTeam(student.student_id)}
                        className="p-2.5 rounded-lg text-right text-xs font-bold border-2 transition-all active:scale-95"
                        style={{
                          backgroundColor: inTeam ? teamColor + '20' : 'white',
                          borderColor: inTeam ? teamColor : '#e5e7eb'
                        }}
                      >
                        <div className="font-extrabold text-gray-900 truncate">
                          {student.full_name}
                        </div>
                        {inTeam && (
                          <div className="text-[10px] mt-0.5 font-bold truncate" style={{ color: teamColor }}>
                            {teamName}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* معاينة الأزواج */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 fade-in-up">
              <h3 className="text-base md:text-lg font-extrabold mb-3 text-gray-800">
                🎯 الأزواج ({pairs.length})
              </h3>
              <div className="space-y-2">
                {pairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-bold text-gray-500 flex-shrink-0">#{i + 1}</span>
                    <PairPreview value={pair.left} color="blue" />
                    <span className="text-gray-400 flex-shrink-0">↔</span>
                    <PairPreview value={pair.right} color="red" />
                  </div>
                ))}
              </div>
            </div>

            {/* زر بدء اللعب */}
            <button
              onClick={handleStart}
              disabled={starting || pairs.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-base md:text-lg btn-app fade-in-up"
            >
              {starting ? '⏳ جاري البدء...' : '🚀 ابدأ اللعبة'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// مكون معاينة الأزواج
// ═══════════════════════════════════════════════
function PairPreview({ value, color }) {
  if (!value) return <span className="text-gray-400">-</span>

  if (value.type === 'image') {
    return (
      <img
        src={`/api/files/preview?key=${encodeURIComponent(value.value)}`}
        alt=""
        className="w-12 h-12 md:w-16 md:h-16 object-contain rounded bg-white border border-gray-200 flex-shrink-0"
      />
    )
  }

  return (
    <span className={`text-xs md:text-sm font-bold truncate ${color === 'blue' ? 'text-blue-700' : 'text-red-700'}`}>
      {value.value}
    </span>
  )
}