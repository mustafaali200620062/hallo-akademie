// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { gamePlayers, gameAnswers, gameSessions, games, gameTeams } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ═══════════════════════════════════════════════
// POST — إرسال إجابة (مطابقة صح)
// ═══════════════════════════════════════════════
export async function POST(request) {
  try {
    const body = await request.json()
    const { session_id, student_id, pair_index } = body

    if (!session_id || !student_id || pair_index === undefined) {
      return NextResponse.json(
        { error: 'session_id و student_id و pair_index مطلوبان' },
        { status: 400 }
      )
    }

    // ✅ التحقق من الجلسة
    const sessionData = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, session_id))

    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
    }

    if (sessionData[0].status !== 'active') {
      return NextResponse.json(
        { error: 'اللعبة مش شغالة حالياً' },
        { status: 400 }
      )
    }

    // ✅ جلب اللاعب
    const playerData = await db
      .select()
      .from(gamePlayers)
      .where(and(
        eq(gamePlayers.session_id, session_id),
        eq(gamePlayers.student_id, student_id)
      ))

    if (!playerData || playerData.length === 0) {
      return NextResponse.json({ error: 'أنت مش منضم للعبة' }, { status: 403 })
    }

    const player = playerData[0]

    if (!player.is_joined) {
      return NextResponse.json({ error: 'لازم تنضم الأول' }, { status: 403 })
    }

    // ✅ نتأكد إن الزوج مش محلو قبل كده
    const existingAnswers = await db
      .select()
      .from(gameAnswers)
      .where(and(
        eq(gameAnswers.session_id, session_id),
        eq(gameAnswers.player_id, player.id),
        eq(gameAnswers.pair_index, pair_index)
      ))

    if (existingAnswers.length > 0) {
      return NextResponse.json({
        success: false,
        message: '⚠️ لقد أجبت على هذا الزوج من قبل',
        already_answered: true,
      })
    }

    // ✅ نسجل الإجابة
    await db.insert(gameAnswers).values({
      id: randomUUID(),
      session_id: session_id,
      player_id: player.id,
      pair_index: pair_index,
      is_correct: true,
      answered_at: new Date(),
      created_at: new Date(),
    })

    // ✅ نحدث نقاط اللاعب (في وضع solo)
    const gameData = await db
      .select()
      .from(games)
      .where(eq(games.id, sessionData[0].game_id))

    const game = gameData[0]
    const newPlayerScore = (player.score || 0) + 1

    await db
      .update(gamePlayers)
      .set({ score: newPlayerScore })
      .where(eq(gamePlayers.id, player.id))

    // ✅ لو teams → نحدث نقاط الفريق كمان
    if (game?.mode === 'teams' && player.team_id) {
      const teamData = await db
        .select()
        .from(gameTeams)
        .where(eq(gameTeams.id, player.team_id))

      if (teamData.length > 0) {
        // ✅ نجمع كل نقاط اللاعبين في الفريق
        const teamPlayers = await db
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.team_id, player.team_id))

        const totalScore = teamPlayers.reduce((sum, p) => {
          // ✅ اللاعب الحالي أخد +1
          if (p.id === player.id) {
            return sum + newPlayerScore
          }
          return sum + (p.score || 0)
        }, 0)

        await db
          .update(gameTeams)
          .set({ total_score: totalScore })
          .where(eq(gameTeams.id, player.team_id))
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ إجابة صحيحة!',
      new_score: newPlayerScore,
    })

  } catch (error) {
    console.error('❌ خطأ في تسجيل الإجابة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}