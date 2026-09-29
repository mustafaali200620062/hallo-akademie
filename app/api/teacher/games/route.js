// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { games, groups, gameSessions, profiles } from '@/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ═══════════════════════════════════════════════
// GET — جلب كل ألعاب المدرس (أو ألعاب جروب معين)
// ═══════════════════════════════════════════════
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const groupId = searchParams.get('group_id')
    const gameId = searchParams.get('game_id')

    if (!teacherId) {
      return NextResponse.json({ error: 'teacher_id مطلوب' }, { status: 400 })
    }

    // ✅ جلب لعبة معينة
    if (gameId) {
      const gameData = await db
        .select()
        .from(games)
        .where(eq(games.id, gameId))

      if (!gameData || gameData.length === 0) {
        return NextResponse.json({ error: 'اللعبة غير موجودة' }, { status: 404 })
      }

      const game = gameData[0]

      // ✅ التحقق إن المدرس صاحب اللعبة
      if (game.teacher_id !== teacherId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }

      return NextResponse.json(game)
    }

    // ✅ جلب ألعاب المدرس (كلها أو حسب جروب)
    let query = db.select().from(games).where(eq(games.teacher_id, teacherId))

    const allGames = await db
      .select()
      .from(games)
      .where(eq(games.teacher_id, teacherId))
      .orderBy(desc(games.created_at))

    // ✅ لو محدد جروب معين، نفلتر
    let filtered = allGames
    if (groupId) {
      filtered = allGames.filter(g => g.group_id === groupId)
    }

    // ✅ نجيب اسم الجروب لكل لعبة
    const groupIds = [...new Set(filtered.map(g => g.group_id).filter(Boolean))]
    let groupsMap = {}
    if (groupIds.length > 0) {
      const groupsData = await db
        .select()
        .from(groups)
        .where(inArray(groups.id, groupIds))

      groupsMap = groupsData.reduce((acc, g) => {
        acc[g.id] = { name: g.name, level_id: g.level_id }
        return acc
      }, {})
    }

    const gamesWithGroups = filtered.map(g => ({
      ...g,
      group_name: groupsMap[g.group_id]?.name || 'بدون جروب',
    }))

    return NextResponse.json(gamesWithGroups || [])

  } catch (error) {
    console.error('❌ خطأ في جلب الألعاب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════
// POST — إنشاء لعبة جديدة
// ═══════════════════════════════════════════════
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      teacher_id,
      group_id,
      title,
      game_type,
      mode,
      content, // JSON string أو object
    } = body

    // ✅ التحقق من المدخلات
    if (!teacher_id || !group_id || !title) {
      return NextResponse.json(
        { error: 'teacher_id و group_id و title مطلوبة' },
        { status: 400 }
      )
    }

    if (!['solo', 'teams'].includes(mode || 'solo')) {
      return NextResponse.json(
        { error: 'mode يجب أن يكون solo أو teams' },
        { status: 400 }
      )
    }

    // ✅ التحقق من وجود الجروب وإنه بتاع المدرس
    const groupData = await db
      .select()
      .from(groups)
      .where(eq(groups.id, group_id))

    if (!groupData || groupData.length === 0) {
      return NextResponse.json({ error: 'الجروب غير موجود' }, { status: 404 })
    }

    if (groupData[0].teacher_id !== teacher_id) {
      return NextResponse.json(
        { error: 'لا يمكنك إنشاء ألعاب لجروبات مش بتاعتك' },
        { status: 403 }
      )
    }

    // ✅ التحقق من content
    let contentString = null
    if (content) {
      if (typeof content === 'string') {
        // لو string، نتأكد إنه JSON صحيح
        try {
          JSON.parse(content)
          contentString = content
        } catch (e) {
          return NextResponse.json(
            { error: 'content ليس JSON صحيح' },
            { status: 400 }
          )
        }
      } else {
        // لو object، نحوله string
        contentString = JSON.stringify(content)
      }
    }

    // ✅ إنشاء اللعبة
    const gameId = randomUUID()

    await db.insert(games).values({
      id: gameId,
      teacher_id,
      group_id,
      title: title.trim(),
      game_type: game_type || 'matching',
      mode: mode || 'solo',
      status: 'ready',        // جاهزة للعب
      content: contentString,
      created_at: new Date(),
      updated_at: new Date(),
    })

    // ✅ نرجع اللعبة الكاملة
    const newGame = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))

    return NextResponse.json({
      success: true,
      message: '✅ تم إنشاء اللعبة بنجاح',
      game: newGame[0],
    })

  } catch (error) {
    console.error('❌ خطأ في إنشاء اللعبة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════
// PUT — تعديل لعبة موجودة (قبل بدء الجلسة)
// ═══════════════════════════════════════════════
export async function PUT(request) {
  try {
    const body = await request.json()
    const {
      game_id,
      teacher_id,
      title,
      mode,
      content,
    } = body

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

    // ✅ التحقق من الصلاحيات
    if (game.teacher_id !== teacher_id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // ✅ ما ينفعش نعدل لعبة شغالة حالياً
    if (game.status === 'active') {
      return NextResponse.json(
        { error: 'لا يمكن تعديل لعبة شغالة. اقفل الجلسة الأول' },
        { status: 400 }
      )
    }

    // ✅ تجهيز التحديثات
    const updates = {
      updated_at: new Date(),
    }

    if (title !== undefined) updates.title = title.trim()
    if (mode !== undefined && ['solo', 'teams'].includes(mode)) updates.mode = mode

    if (content !== undefined) {
      if (typeof content === 'string') {
        try {
          JSON.parse(content)
          updates.content = content
        } catch (e) {
          return NextResponse.json(
            { error: 'content ليس JSON صحيح' },
            { status: 400 }
          )
        }
      } else {
        updates.content = JSON.stringify(content)
      }
    }

    // ✅ تحديث
    await db
      .update(games)
      .set(updates)
      .where(eq(games.id, game_id))

    return NextResponse.json({
      success: true,
      message: '✅ تم تحديث اللعبة',
    })

  } catch (error) {
    console.error('❌ خطأ في تعديل اللعبة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════
// DELETE — حذف لعبة
// ═══════════════════════════════════════════════
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('game_id')
    const teacherId = searchParams.get('teacher_id')

    if (!gameId || !teacherId) {
      return NextResponse.json(
        { error: 'game_id و teacher_id مطلوبان' },
        { status: 400 }
      )
    }

    // ✅ جلب اللعبة
    const gameData = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))

    if (!gameData || gameData.length === 0) {
      return NextResponse.json({ error: 'اللعبة غير موجودة' }, { status: 404 })
    }

    // ✅ التحقق من الصلاحيات
    if (gameData[0].teacher_id !== teacherId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // ✅ ما ينفعش نحذف لعبة شغالة
    if (gameData[0].status === 'active') {
      return NextResponse.json(
        { error: 'لا يمكن حذف لعبة شغالة. اقفل الجلسة الأول' },
        { status: 400 }
      )
    }

    // ✅ حذف اللعبة (الجلسات هتتحذف تلقائياً لأن فيها onDelete cascade)
    await db.delete(games).where(eq(games.id, gameId))

    return NextResponse.json({
      success: true,
      message: '✅ تم حذف اللعبة',
    })

  } catch (error) {
    console.error('❌ خطأ في حذف اللعبة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}