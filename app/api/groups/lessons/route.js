import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupLessons, lessons, levels, profiles } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// ✅ جلب شروح المجموعة
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    const groupLessonsList = await db
      .select({
        id: groupLessons.id,
        lesson_id: groupLessons.lesson_id,
        group_id: groupLessons.group_id,
        assigned_at: groupLessons.created_at,
        title: lessons.title,
        description: lessons.description,
        content_url: lessons.content_url,
        content_type: lessons.content_type,
        level_code: levels.code,
        creator_name: profiles.full_name,
        created_at: lessons.created_at,
      })
      .from(groupLessons)
      .leftJoin(lessons, eq(groupLessons.lesson_id, lessons.id))
      .leftJoin(levels, eq(lessons.level_id, levels.id))
      .leftJoin(profiles, eq(lessons.created_by, profiles.id))
      .where(eq(groupLessons.group_id, groupId))
      .orderBy(desc(groupLessons.created_at))

    // ✅ نرجع lesson_id كـ id عشان المعاينة تشتغل
    const formatted = (groupLessonsList || []).map(item => ({
      ...item,
      id: item.lesson_id,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('❌ Error fetching group lessons:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حذف شرح من المجموعة
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lesson_id')
    const groupId = searchParams.get('group_id')

    if (!lessonId || !groupId) {
      return NextResponse.json({ error: 'Lesson ID and Group ID required' }, { status: 400 })
    }

    await db
      .delete(groupLessons)
      .where(and(
        eq(groupLessons.lesson_id, lessonId),
        eq(groupLessons.group_id, groupId)
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting group lesson:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}