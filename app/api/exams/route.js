import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exams, levels, groups, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// ✅ جلب جميع الاختبارات
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const levelId = searchParams.get('levelId')

    let query = db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        group_id: exams.group_id,
        level_id: exams.level_id,
        created_by: exams.created_by,
        starts_at: exams.starts_at,
        ends_at: exams.ends_at,
        duration_minutes: exams.duration_minutes,
        total_points: exams.total_points,
        status: exams.status,
        settings: exams.settings,
        created_at: exams.created_at,
        level_code: levels.code,
        level_title: levels.title,
        group_name: groups.name,
        creator_name: profiles.full_name,
      })
      .from(exams)
      .leftJoin(levels, eq(exams.level_id, levels.id))
      .leftJoin(groups, eq(exams.group_id, groups.id))
      .leftJoin(profiles, eq(exams.created_by, profiles.id))
      .orderBy(desc(exams.created_at))

    if (groupId) {
      query = query.where(eq(exams.group_id, groupId))
    } else if (levelId) {
      query = query.where(eq(exams.level_id, levelId))
    }

    const allExams = await query

    return NextResponse.json(allExams || [])
  } catch (error) {
    console.error('❌ Error fetching exams:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إنشاء اختبار جديد
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      group_id,
      level_id,
      starts_at,
      ends_at,
      duration_minutes,
      total_points,
      created_by
    } = body

    if (!title || !group_id || !level_id || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }

    const [newExam] = await db.insert(exams).values({
      id: crypto.randomUUID(),
      title,
      description: description || '',
      group_id,
      level_id,
      created_by: created_by || null,
      starts_at: new Date(starts_at),
      ends_at: new Date(ends_at),
      duration_minutes: parseInt(duration_minutes),
      total_points: parseFloat(total_points) || 0,
      status: 'scheduled',
      created_at: new Date(),
    }).returning()

    return NextResponse.json({
      success: true,
      id: newExam.id,
      exam: newExam
    })
  } catch (error) {
    console.error('❌ Error creating exam:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ تحديث حالة الاختبار (تشغيل / إيقاف)
export async function PUT(request) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Exam ID and status are required' }, { status: 400 })
    }

    if (!['active', 'scheduled', 'ended', 'draft'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await db.update(exams).set({ status }).where(eq(exams.id, id))

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('❌ Error updating exam status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حذف اختبار
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    await db.delete(exams).where(eq(exams.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting exam:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}