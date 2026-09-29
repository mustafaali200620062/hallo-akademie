// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { games, gameSessions, gameTeams, gamePlayers, groupStudents, profiles } from '@/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ═══════════════════════════════════════════════════════════
// ألوان الفرق الافتراضية (لو المدرس ماخترش)
// ═══════════════════════════════════════════════════════════
const DEFAULT_TEAM_COLORS = [
  '#3b82f6', // أزرق
  '#ef4444', // أحمر
  '#10b981', // أخضر
  '#f59e0b', // برتقالي
  '#8b5cf6', // بنفسجي
  '#ec4899', // وردي
  '#06b6d4', // سماوي
  '#84cc16', // ليموني
]

// ═══════════════════════════════════════════════════════════
// GET — جلب جلسة (للمدرس أو للطالب)
// ═══════════════════════════════════════════════════════════
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const gameId = searchParams.get('game_id')
    const teacherId = searchParams.get('teacher_id')
    const studentId = searchParams.get('student_id')

    // ✅ 1. جلب جلسة معينة + كل تفاصيلها
    if (sessionId) {
      const sessionData = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, sessionId))

      if (!sessionData || sessionData.length === 0) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
      }

      const session = sessionData[0]

      // ✅ جلب اللعبة
      const gameData = await db
        .select()
        .from(games)
        .where(eq(games.id, session.game_id))

      const game = gameData[0] || null

      // ✅ جلب الفرق
      const teams = await db
        .select()
        .from(gameTeams)
        .where(eq(gameTeams.session_id, sessionId))

      // ✅ جلب اللاعبين مع أسماء الطلاب
      const playersRaw = await db
        .select({
          id: gamePlayers.id,
          student_id: gamePlayers.student_id,
          team_id: gamePlayers.team_id,
          score: gamePlayers.score,
          is_joined: gamePlayers.is_joined,
          joined_at: gamePlayers.joined_at,
          student_name: profiles.full_name,
          student_phone: profiles.phone,
        })
        .from(gamePlayers)
        .leftJoin(profiles, eq(gamePlayers.student_id, profiles.id))
        .where(eq(gamePlayers.session_id, sessionId))

      // ✅ ترتيب الفرق حسب team_order
      const sortedTeams = (teams || []).sort((a, b) => (a.team_order || 0) - (b.team_order || 0))

      // ✅ تجميع اللاعبين حسب الفريق
      const playersWithTeams = (playersRaw || []).map(p => ({
        ...p,
        team: sortedTeams.find(t => t.id === p.team_id) || null,
      }))

      return NextResponse.json({
        success: true,
        session,
        game,
        teams: sortedTeams,
        players: playersWithTeams,
      })
    }

    // ✅ 2. البحث عن الجلسة النشطة للعبة معينة
    if (gameId) {
      const sessions = await db
        .select()
        .from(gameSessions)
        .where(and(
          eq(gameSessions.game_id, gameId),
          eq(gameSessions.status, 'active')
        ))
        .orderBy(desc(gameSessions.started_at))

      if (sessions.length === 0) {
        return NextResponse.json({ success: true, session: null })
      }

      const session = sessions[0]

      // ✅ جلب الفرق
      const teams = await db
        .select()
        .from(gameTeams)
        .where(eq(gameTeams.session_id, session.id))

      // ✅ جلب اللاعبين
      const playersRaw = await db
        .select({
          id: gamePlayers.id,
          student_id: gamePlayers.student_id,
          team_id: gamePlayers.team_id,
          score: gamePlayers.score,
          is_joined: gamePlayers.is_joined,
          student_name: profiles.full_name,
        })
        .from(gamePlayers)
        .leftJoin(profiles, eq(gamePlayers.student_id, profiles.id))
        .where(eq(gamePlayers.session_id, session.id))

      return NextResponse.json({
        success: true,
        session,
        teams: teams.sort((a, b) => (a.team_order || 0) - (b.team_order || 0)),
        players: playersRaw,
      })
    }

    // ✅ 3. جلب جلسات المدرس (كلها)
    if (teacherId) {
      const teacherGames = await db
        .select()
        .from(games)
        .where(eq(games.teacher_id, teacherId))

      const gameIds = teacherGames.map(g => g.id)

      if (gameIds.length === 0) {
        return NextResponse.json([])
      }

      const sessions = await db
        .select()
        .from(gameSessions)
        .where(inArray(gameSessions.game_id, gameIds))
        .orderBy(desc(gameSessions.started_at))
        .limit(50)

      return NextResponse.json(sessions || [])
    }

    // ✅ 4. البحث عن جلسة نشطة للطالب (لو اللعبة شغالة في جروبه)
    if (studentId) {
      // ✅ جلب الجروبات اللي فيها الطالب
      const studentGroups = await db
        .select()
        .from(groupStudents)
        .where(eq(groupStudents.student_id, studentId))

      const groupIds = studentGroups.map(gs => gs.group_id)

      if (groupIds.length === 0) {
        return NextResponse.json({ success: true, session: null, game: null })
      }

      // ✅ جلب الألعاب النشطة في جروباته
      const activeGames = await db
        .select()
        .from(games)
        .where(and(
          inArray(games.group_id, groupIds),
          eq(games.status, 'active')
        ))

      if (activeGames.length === 0) {
        return NextResponse.json({ success: true, session: null, game: null })
      }

      const activeGame = activeGames[0]

      // ✅ جلب الجلسة النشطة
      const sessions = await db
        .select()
        .from(gameSessions)
        .where(and(
          eq(gameSessions.game_id, activeGame.id),
          eq(gameSessions.status, 'active')
        ))

      if (sessions.length === 0) {
        return NextResponse.json({ success: true, session: null, game: null })
      }

      const session = sessions[0]

      // ✅ نشوف لو الطالب منضم فعلاً
      const playerData = await db
        .select()
        .from(gamePlayers)
        .where(and(
          eq(gamePlayers.session_id, session.id),
          eq(gamePlayers.student_id, studentId)
        ))

      return NextResponse.json({
        success: true,
        session,
        game: {
          id: activeGame.id,
          title: activeGame.title,
          game_type: activeGame.game_type,
          mode: activeGame.mode,
        },
        player: playerData[0] || null,
      })
    }

    return NextResponse.json({ error: 'محتاج session_id أو game_id أو teacher_id أو student_id' }, { status: 400 })

  } catch (error) {
    console.error('❌ خطأ في جلب الجلسة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════
// POST — بدء جلسة جديدة (للمدرس)
// ═══════════════════════════════════════════════════════════
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      action,
      game_id,
      teacher_id,
      session_id,
      teams_config,   // للوضع الجماعي: [{ name, color, student_ids: [] }]
      session_data,
    } = body

    // ═══════════════════════════════════════════
    // 1. بدء جلسة جديدة
    // ═══════════════════════════════════════════
    if (action === 'start') {
      if (!game_id || !teacher_id) {
        return NextResponse.json(
          { error: 'game_id و teacher_id مطلوبان' },
          { status: 400 }
        )
      }

      // ✅ جلب اللعبة
      const gameData = await db
        .select()
        .from(games)
        .where(eq(games.id, game_id))

      if (!gameData || gameData.length === 0) {
        return NextResponse.json({ error: 'اللعبة غير موجودة' }, { status: 404 })
      }

      const game = gameData[0]

      // ✅ التحقق من المدرس
      if (game.teacher_id !== teacher_id) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }

      // ✅ التحقق إن اللعبة مش شغالة حالياً
      if (game.status === 'active') {
        const existingSessions = await db
          .select()
          .from(gameSessions)
          .where(and(
            eq(gameSessions.game_id, game_id),
            eq(gameSessions.status, 'active')
          ))

        if (existingSessions.length > 0) {
          return NextResponse.json(
            { error: 'فيه جلسة شغالة حالياً. اقفلها الأول' },
            { status: 400 }
          )
        }
      }

      // ✅ التحقق من content
      if (!game.content) {
        return NextResponse.json(
          { error: 'اللعبة مفيهاش محتوى. عدّلها الأول' },
          { status: 400 }
        )
      }

      // ✅ جلب كل طلاب الجروب
      const groupStudentsList = await db
        .select()
        .from(groupStudents)
        .where(eq(groupStudents.group_id, game.group_id))

      const studentIds = groupStudentsList.map(gs => gs.student_id)

      if (studentIds.length === 0) {
        return NextResponse.json(
          { error: 'الجروب مفيهوش طلاب' },
          { status: 400 }
        )
      }

      // ✅ إنشاء الجلسة
      const sessionId = randomUUID()

      await db.insert(gameSessions).values({
        id: sessionId,
        game_id,
        status: 'active',
        started_at: new Date(),
        created_at: new Date(),
      })

      // ✅ تحديث حالة اللعبة
      await db
        .update(games)
        .set({ status: 'active', updated_at: new Date() })
        .where(eq(games.id, game_id))

      // ✅ إدارة الفرق (لو teams mode)
      let createdTeams = []

      if (game.mode === 'teams') {
        // ✅ لو المدرس بعت teams_config
        if (Array.isArray(teams_config) && teams_config.length > 0) {
          // ✅ إنشاء كل فريق
          for (let i = 0; i < teams_config.length; i++) {
            const team = teams_config[i]
            const teamId = randomUUID()

            await db.insert(gameTeams).values({
              id: teamId,
              session_id: sessionId,
              team_name: team.name || `فريق ${i + 1}`,
              team_color: team.color || DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length],
              team_order: i + 1,
              total_score: 0,
              created_at: new Date(),
            })

            createdTeams.push({
              id: teamId,
              name: team.name || `فريق ${i + 1}`,
              color: team.color || DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length],
              student_ids: team.student_ids || [],
            })
          }

          // ✅ إضافة اللاعبين لكل فريق
          for (const team of createdTeams) {
            for (const studentId of team.student_ids) {
              await db.insert(gamePlayers).values({
                id: randomUUID(),
                session_id: sessionId,
                student_id: studentId,
                team_id: team.id,
                score: 0,
                is_joined: false,
                created_at: new Date(),
              })
            }
          }

          // ✅ الطلاب اللي مش في أي فريق → نضيفهم كـ players بس من غير فريق
          const assignedStudents = createdTeams.flatMap(t => t.student_ids)
          const unassigned = studentIds.filter(id => !assignedStudents.includes(id))

          for (const studentId of unassigned) {
            await db.insert(gamePlayers).values({
              id: randomUUID(),
              session_id: sessionId,
              student_id: studentId,
              team_id: null,
              score: 0,
              is_joined: false,
              created_at: new Date(),
            })
          }
        } else {
          // ✅ مفيش teams_config → نوزع تلقائي على فريقين
          const team1Id = randomUUID()
          const team2Id = randomUUID()

          await db.insert(gameTeams).values({
            id: team1Id,
            session_id: sessionId,
            team_name: 'الفريق الأول',
            team_color: DEFAULT_TEAM_COLORS[0],
            team_order: 1,
            total_score: 0,
            created_at: new Date(),
          })

          await db.insert(gameTeams).values({
            id: team2Id,
            session_id: sessionId,
            team_name: 'الفريق الثاني',
            team_color: DEFAULT_TEAM_COLORS[1],
            team_order: 2,
            total_score: 0,
            created_at: new Date(),
          })

          // ✅ نوزع الطلاب بالتساوي
          for (let i = 0; i < studentIds.length; i++) {
            const teamId = i % 2 === 0 ? team1Id : team2Id
            await db.insert(gamePlayers).values({
              id: randomUUID(),
              session_id: sessionId,
              student_id: studentIds[i],
              team_id: teamId,
              score: 0,
              is_joined: false,
              created_at: new Date(),
            })
          }
        }
      } else {
        // ✅ الوضع الفردي → كل طالب يبقى player بدون فريق
        for (const studentId of studentIds) {
          await db.insert(gamePlayers).values({
            id: randomUUID(),
            session_id: sessionId,
            student_id: studentId,
            team_id: null,
            score: 0,
            is_joined: false,
            created_at: new Date(),
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: '✅ تم بدء اللعبة',
        session_id: sessionId,
      })
    }

    // ═══════════════════════════════════════════
    // 2. إغلاق جلسة
    // ═══════════════════════════════════════════
    if (action === 'end') {
      if (!session_id || !teacher_id) {
        return NextResponse.json(
          { error: 'session_id و teacher_id مطلوبان' },
          { status: 400 }
        )
      }

      // ✅ جلب الجلسة
      const sessionData = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, session_id))

      if (!sessionData || sessionData.length === 0) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
      }

      // ✅ جلب اللعبة والتحقق
      const gameData = await db
        .select()
        .from(games)
        .where(eq(games.id, sessionData[0].game_id))

      if (!gameData || gameData.length === 0) {
        return NextResponse.json({ error: 'اللعبة غير موجودة' }, { status: 404 })
      }

      if (gameData[0].teacher_id !== teacher_id) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }

      // ✅ تحديث الجلسة
      await db
        .update(gameSessions)
        .set({
          status: 'ended',
          ended_at: new Date(),
        })
        .where(eq(gameSessions.id, session_id))

      // ✅ تحديث حالة اللعبة
      await db
        .update(games)
        .set({ status: 'closed', updated_at: new Date() })
        .where(eq(games.id, gameData[0].id))

      return NextResponse.json({
        success: true,
        message: '✅ تم إغلاق الجلسة',
      })
    }

    // ═══════════════════════════════════════════
    // 3. تعديل الفرق (قبل بدء اللعب الفعلي أو بعده)
    // ═══════════════════════════════════════════
    if (action === 'update_teams') {
      if (!session_id || !teacher_id || !Array.isArray(teams_config)) {
        return NextResponse.json(
          { error: 'session_id و teacher_id و teams_config مطلوبين' },
          { status: 400 }
        )
      }

      // ✅ جلب الجلسة والتحقق
      const sessionData = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, session_id))

      if (!sessionData || sessionData.length === 0) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
      }

      const gameData = await db
        .select()
        .from(games)
        .where(eq(games.id, sessionData[0].game_id))

      if (!gameData || gameData.length === 0 || gameData[0].teacher_id !== teacher_id) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }

      // ✅ حذف الفرق الحالية
      await db
        .delete(gameTeams)
        .where(eq(gameTeams.session_id, session_id))

      // ✅ إعادة إنشاء الفرق
      for (let i = 0; i < teams_config.length; i++) {
        const team = teams_config[i]
        const teamId = randomUUID()

        await db.insert(gameTeams).values({
          id: teamId,
          session_id: session_id,
          team_name: team.name || `فريق ${i + 1}`,
          team_color: team.color || DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length],
          team_order: i + 1,
          total_score: 0,
          created_at: new Date(),
        })

        // ✅ نحدّث اللاعبين اللي في الفريق ده
        for (const studentId of (team.student_ids || [])) {
          await db
            .update(gamePlayers)
            .set({ team_id: teamId })
            .where(and(
              eq(gamePlayers.session_id, session_id),
              eq(gamePlayers.student_id, studentId)
            ))
        }
      }

      return NextResponse.json({
        success: true,
        message: '✅ تم تحديث الفرق',
      })
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })

  } catch (error) {
    console.error('❌ خطأ في عملية الجلسة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}