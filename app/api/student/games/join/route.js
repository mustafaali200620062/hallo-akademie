// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { gamePlayers, gameSessions, games, gameTeams } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// ═══════════════════════════════════════════════
// POST — انضمام طالب للعبة
// ═══════════════════════════════════════════════
export async function POST(request) {
  try {
    const body = await request.json()
    const { session_id, student_id, team_id } = body

    if (!session_id || !student_id) {
      return NextResponse.json(
        { error: 'session_id و student_id مطلوبان' },
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

    const session = sessionData[0]

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'اللعبة مش شغالة حالياً' },
        { status: 400 }
      )
    }

    // ✅ التحقق من اللعبة
    const gameData = await db
      .select()
      .from(games)
      .where(eq(games.id, session.game_id))

    if (!gameData || gameData.length === 0) {
      return NextResponse.json({ error: 'اللعبة غير موجودة' }, { status: 404 })
    }

    const game = gameData[0]

    // ✅ لو الوضع جماعي → لازم team_id
    if (game.mode === 'teams' && !team_id) {
      return NextResponse.json(
        { error: 'اختر فريق للانضمام' },
        { status: 400 }
      )
    }

    // ✅ لو في team_id → نتأكد إنه فريق في نفس الجلسة
    if (team_id) {
      const teamData = await db
        .select()
        .from(gameTeams)
        .where(and(
          eq(gameTeams.id, team_id),
          eq(gameTeams.session_id, session_id)
        ))

      if (!teamData || teamData.length === 0) {
        return NextResponse.json({ error: 'الفريق غير موجود' }, { status: 404 })
      }
    }

    // ✅ نبحث عن player (موجود من قبل لأنه بيتم إنشاؤه عند بدء الجلسة)
    const playerData = await db
      .select()
      .from(gamePlayers)
      .where(and(
        eq(gamePlayers.session_id, session_id),
        eq(gamePlayers.student_id, student_id)
      ))

    if (!playerData || playerData.length === 0) {
      // ✅ لو مش موجود (احتياط) → ننشئه
      const { randomUUID } = await import('crypto')
      await db.insert(gamePlayers).values({
        id: randomUUID(),
        session_id: session_id,
        student_id: student_id,
        team_id: team_id || null,
        score: 0,
        is_joined: true,
        joined_at: new Date(),
        created_at: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: '✅ تم الانضمام للعبة',
        is_new: true,
      })
    }

    const player = playerData[0]

    // ✅ نحدث حالة اللاعب
    await db
      .update(gamePlayers)
      .set({
        team_id: team_id || player.team_id || null,
        is_joined: true,
        joined_at: new Date(),
      })
      .where(eq(gamePlayers.id, player.id))

    return NextResponse.json({
      success: true,
      message: '✅ تم الانضمام للعبة',
      player_id: player.id,
    })

  } catch (error) {
    console.error('❌ خطأ في الانضمام:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════
// GET — التحقق من حالة الانضمام
// ═══════════════════════════════════════════════
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const studentId = searchParams.get('student_id')

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { error: 'session_id و student_id مطلوبان' },
        { status: 400 }
      )
    }

    const playerData = await db
      .select()
      .from(gamePlayers)
      .where(and(
        eq(gamePlayers.session_id, sessionId),
        eq(gamePlayers.student_id, studentId)
      ))

    if (!playerData || playerData.length === 0) {
      return NextResponse.json({ is_joined: false, player: null })
    }

    return NextResponse.json({
      is_joined: playerData[0].is_joined || false,
      player: playerData[0],
    })

  } catch (error) {
    console.error('❌ خطأ في التحقق:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}