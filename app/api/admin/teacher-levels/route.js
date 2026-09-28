// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { teacherLevels } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ✅ جلب مستويات مدرس معين
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacher_id is required' },
        { status: 400 }
      )
    }

    const levels = await db
      .select()
      .from(teacherLevels)
      .where(eq(teacherLevels.teacher_id, teacherId))

    return NextResponse.json(levels || [])
  } catch (error) {
    console.error('❌ خطأ في جلب مستويات المدرس:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ تحديث مستويات مدرس (استبدال)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { teacher_id, level_ids } = body

    if (!teacher_id || !Array.isArray(level_ids)) {
      return NextResponse.json(
        { error: 'teacher_id and level_ids (array) are required' },
        { status: 400 }
      )
    }

    // ✅ حذف المستويات القديمة
    await db
      .delete(teacherLevels)
      .where(eq(teacherLevels.teacher_id, teacher_id))

    // ✅ إضافة الجديدة
    for (const levelId of level_ids) {
      await db.insert(teacherLevels).values({
        id: crypto.randomUUID(),
        teacher_id,
        level_id: levelId,
        created_at: new Date(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في تحديث مستويات المدرس:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}