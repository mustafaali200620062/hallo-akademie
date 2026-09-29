'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function GamePlayPage({ params }) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState(null)

  // ✅ البيانات
  const [session, setSession] = useState(null)
  const [game, setGame] = useState(null)
  const [player, setPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])

  // ✅ حالة اللعب
  const [pairs, setPairs] = useState([])          // كل الأزواج
  const [solvedPairs, setSolvedPairs] = useState([]) // الأزواج اللي حلّها (indexes)
  const [rightItems, setRightItems] = useState([]) // الطرف الأيمن (مخلوط)
  const [selectedLeft, setSelectedLeft] = useState(null)
  const [selectedRight, setSelectedRight] = useState(null)

  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const pollingRef = useRef(null)

  // ✅ تحليل الـ sessionId
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setSessionId(resolved.sessionId)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (sessionId) {
      checkUser()
    }
  }, [sessionId])

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
    await fetchSessionData(parsed.id)
  }

  const fetchSessionData = useCallback(async (sId) => {
    if (!sId || !sessionId) return

    try {
      // ✅ جلب الجلسة
      const res = await fetch(`/api/teacher/games/session?session_id=${sessionId}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'خطأ')

      setSession(data.session)
      setGame(data.game)
      setTeams(data.teams || [])
      setPlayers(data.players || [])

      // ✅ نجد اللاعب الحالي
      const myPlayer = (data.players || []).find(p => p.student_id === sId)
      setPlayer(myPlayer || null)

      // ✅ لو مش منضم → نرجعه لصفحة الألعاب
      if (!myPlayer || !myPlayer.is_joined) {
        router.push('/student/games')
        return
      }

      // ✅ لو الجلسة اتقفلت → نرجعه
      if (data.session.status !== 'active') {
        router.push('/student/games')
        return
      }

      // ✅ لو أول مرة → نحضّر الأزواج
      if (pairs.length === 0 && data.game?.content) {
        const content = typeof data.game.content === 'string'
          ? JSON.parse(data.game.content)
          : data.game.content

        const pairsList = content.pairs || []
        setPairs(pairsList)

        // ✅ نخلط الطرف الأيمن
        const shuffledRight = pairsList
          .map((p, i) => ({ ...p.right, originalIndex: i }))
          .sort(() => Math.random() - 0.5)
        setRightItems(shuffledRight)
      }

      // ✅ نجلب الإجابات السابقة للاعب
      if (myPlayer) {
        await fetchMyAnswers(myPlayer.id)
      }

    } catch (err) {
      console.error('fetchSessionData error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId, router, pairs.length])

  // ✅ جلب الإجابات السابقة
  const fetchMyAnswers = async (playerId) => {
    try {
      // ✅ نجلب كل الإجابات من API
      const res = await fetch(`/api/student/games/answer?session_id=${sessionId}&player_id=${playerId}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setSolvedPairs(data.map(a => a.pair_index))
        }
      }
    } catch (e) {
      // نتجاهل لو ما اشتغلش
    }
  }

  // ✅ Live Update كل 3 ثواني
  useEffect(() => {
    if (!studentId || !sessionId) return

    pollingRef.current = setInterval(() => {
      fetchSessionData(studentId)
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [studentId, sessionId, fetchSessionData])

  // ✅ اختيار طرف أيسر
  const handleSelectLeft = (index) => {
    if (solvedPairs.includes(index)) return
    setSelectedLeft(index)
  }

  // ✅ اختيار طرف أيمن
  const handleSelectRight = (item) => {
    if (solvedPairs.includes(item.originalIndex)) return
    setSelectedRight(item)
  }

  // ✅ التحقق من المطابقة
  useEffect(() => {
    if (selectedLeft === null || selectedRight === null) return

    const checkMatch = async () => {
      const isMatch = selectedLeft === selectedRight.originalIndex

      if (isMatch) {
        // ✅ مطابقة صح
        await submitAnswer(selectedLeft)
        setSuccessMsg('✅ مطابقة صحيحة!')
        setTimeout(() => setSuccessMsg(null), 1500)
      } else {
        // ❌ غلط
        setError('❌ غير مطابق، حاول تاني')
        setTimeout(() => setError(null), 1500)
      }

      // ✅ reset
      setSelectedLeft(null)
      setSelectedRight(null)
    }

    checkMatch()
  }, [selectedLeft, selectedRight])

  // ✅ إرسال الإجابة
  const submitAnswer = async (pairIndex) => {
    if (submitting) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/student/games/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          pair_index: pairIndex,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      // ✅ نضيف الزوج للي حلّهم
      setSolvedPairs(prev => [...prev, pairIndex])

      // ✅ نحدّث النقاط فوراً
      await fetchSessionData(studentId)

    } catch (err) {
      console.error('submitAnswer error:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
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

  if (!game || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-bold text-gray-700">اللعبة مش متاحة</p>
          <button
            onClick={() => router.push('/student/games')}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold"
          >
            ← رجوع
          </button>
        </div>
      </div>
    )
  }

  const totalPairs = pairs.length
  const solvedCount = solvedPairs.length
  const progress = totalPairs > 0 ? (solvedCount / totalPairs) * 100 : 0

  // ✅ ترتيب المنافسين
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const myRank = sortedPlayers.findIndex(p => p.student_id === studentId) + 1

  // ✅ ترتيب الفرق
  const sortedTeams = [...teams].sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
  const myTeam = player?.team_id ? teams.find(t => t.id === player.team_id) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-purple-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm md:text-lg font-extrabold truncate">
                  🎮 {game.title}
                </h1>
                <p className="text-[10px] md:text-xs opacity-80 font-bold truncate">
                  {player.team?.team_name ? `👥 ${player.team.team_name}` : '👤 فردي'}
                </p>
              </div>
            </div>

            {/* نقاطي */}
            <div className="bg-yellow-400 text-black px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl text-center flex-shrink-0">
              <div className="text-lg md:text-2xl font-extrabold leading-none">
                {player.score || 0}
              </div>
              <div className="text-[9px] md:text-xs font-bold mt-0.5">نقاطي</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1">
              <span>التقدم: {solvedCount} / {totalPairs}</span>
              <span>#{myRank}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-yellow-300 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {/* رسائل */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-xl mb-3 font-bold text-sm md:text-base text-center fade-in-up">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border-2 border-green-300 text-green-700 px-3 md:px-4 py-2.5 md:py-3 rounded-xl mb-3 font-extrabold text-sm md:text-base text-center fade-in-up">
            {successMsg}
          </div>
        )}

        {/* ✅ لو اللعبة خلصت */}
        {solvedCount === totalPairs && totalPairs > 0 ? (
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-xl p-6 md:p-8 text-center mb-4 fade-in-up">
            <div className="text-6xl md:text-7xl mb-3 animate-bounce">🎉</div>
            <h2 className="text-xl md:text-3xl font-extrabold mb-2">
              خلصت كل الأزواج!
            </h2>
            <p className="text-sm md:text-base opacity-90 font-bold mb-4">
              {player.team ? `فريقك: ${player.team.team_name}` : 'أنت بطل!'}
            </p>
            <div className="bg-white/20 rounded-xl p-4 mb-4 inline-block">
              <div className="text-3xl md:text-4xl font-extrabold">{player.score}</div>
              <div className="text-xs md:text-sm font-bold opacity-90">نقطة</div>
            </div>
            <p className="text-xs md:text-sm font-bold">
              ⏳ في انتظار باقي اللاعبين
            </p>
          </div>
        ) : (
          <>
            {/* ═══ تعليمات ═══ */}
            <div className="bg-white rounded-2xl shadow-md p-3 md:p-4 mb-4 border border-gray-100">
              <p className="text-xs md:text-sm font-bold text-gray-700 text-center">
                💡 اضغط على كلمة من <span className="text-blue-600">اليسار</span> ثم على مطابقتها من <span className="text-purple-600">اليمين</span>
              </p>
            </div>

            {/* ═══ شبكة الأزواج ═══ */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* العمود الأيسر */}
              <div className="space-y-2 md:space-y-3">
                {pairs.map((pair, index) => {
                  const isSolved = solvedPairs.includes(index)
                  const isSelected = selectedLeft === index

                  return (
                    <button
                      key={`left-${index}`}
                      onClick={() => handleSelectLeft(index)}
                      disabled={isSolved}
                      className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all text-left ${
                        isSolved
                          ? 'bg-green-100 border-green-400 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-[0.98]'
                            : 'bg-white border-blue-300 hover:border-blue-500 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {isSolved && (
                        <div className="text-[10px] md:text-xs font-bold text-green-700 mb-1">✅ محلو</div>
                      )}
                      {pair.left?.type === 'image' ? (
                        <img
                          src={`/api/files/preview?key=${encodeURIComponent(pair.left.value)}`}
                          alt=""
                          className="w-full h-16 md:h-24 object-contain rounded"
                        />
                      ) : (
                        <div className={`text-xs md:text-base font-extrabold ${isSelected ? 'text-white' : 'text-gray-800'} truncate`}>
                          {pair.left?.value}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* العمود الأيمن */}
              <div className="space-y-2 md:space-y-3">
                {rightItems.map((item, idx) => {
                  const isSolved = solvedPairs.includes(item.originalIndex)
                  const isSelected = selectedRight?.originalIndex === item.originalIndex

                  return (
                    <button
                      key={`right-${idx}`}
                      onClick={() => handleSelectRight(item)}
                      disabled={isSolved}
                      className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all text-left ${
                        isSolved
                          ? 'bg-green-100 border-green-400 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-purple-500 border-purple-600 text-white shadow-lg scale-[0.98]'
                            : 'bg-white border-purple-300 hover:border-purple-500 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {isSolved && (
                        <div className="text-[10px] md:text-xs font-bold text-green-700 mb-1">✅ محلو</div>
                      )}
                      {item.type === 'image' ? (
                        <img
                          src={`/api/files/preview?key=${encodeURIComponent(item.value)}`}
                          alt=""
                          className="w-full h-16 md:h-24 object-contain rounded"
                        />
                      ) : (
                        <div className={`text-xs md:text-base font-extrabold ${isSelected ? 'text-white' : 'text-gray-800'} truncate`}>
                          {item.value}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ═══ لوحة المنافسين ═══ */}
        <div className="mt-4 md:mt-6 bg-white rounded-2xl shadow-md p-4 md:p-5 border border-gray-100">
          <h3 className="text-sm md:text-lg font-extrabold text-gray-800 mb-3 flex items-center gap-2">
            🏆 المنافسة
          </h3>

          {game.mode === 'teams' && sortedTeams.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2">الفرق:</p>
              <div className="space-y-2">
                {sortedTeams.map((team, i) => {
                  const isMyTeam = myTeam?.id === team.id
                  return (
                    <div
                      key={team.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg ${isMyTeam ? 'ring-2 ring-yellow-400' : ''}`}
                      style={{ backgroundColor: team.team_color + '15', borderLeft: `3px solid ${team.team_color}` }}
                    >
                      <span className="font-bold text-sm truncate flex items-center gap-1">
                        {i === 0 && '👑'} {team.team_name}
                        {isMyTeam && <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded">أنا</span>}
                      </span>
                      <span className="font-extrabold text-base" style={{ color: team.team_color }}>
                        {team.total_score || 0}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ترتيب اللاعبين */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">
              {game.mode === 'teams' ? 'لاعبين فريقك:' : 'اللاعبين:'}
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
              {sortedPlayers
                .filter(p => game.mode === 'solo' || p.team_id === player.team_id)
                .map((p, i) => {
                  const isMe = p.student_id === studentId
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg text-sm ${
                        isMe ? 'bg-yellow-100 border border-yellow-400' : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-bold truncate flex items-center gap-1">
                        <span className="text-gray-400 text-xs w-5 flex-shrink-0">#{i + 1}</span>
                        {p.student_name}
                        {isMe && <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded">أنا</span>}
                      </span>
                      <span className="font-extrabold text-base flex-shrink-0">{p.score || 0}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}