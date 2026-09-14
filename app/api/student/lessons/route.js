import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents, groupLessons, lessons, levels, profiles } from '@/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // ✅ جلب مجموعات الطالب
    const studentGroups = await db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.student_id, studentId))

    const groupIds = studentGroups.map(g => g.group_id)

    if (groupIds.length === 0) {
      return NextResponse.json([])
    }

    // ✅ جلب الشروح المرتبطة بمجموعات الطالب
    const studentLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        content: lessons.content,
        content_url: lessons.content_url,
        content_type: lessons.content_type,
        level_code: levels.code,
        creator_name: profiles.full_name,
        assigned_at: groupLessons.created_at,
        created_at: lessons.created_at,
      })
      .from(groupLessons)
      .leftJoin(lessons, eq(groupLessons.lesson_id, lessons.id))
      .leftJoin(levels, eq(lessons.level_id, levels.id))
      .leftJoin(profiles, eq(lessons.created_by, profiles.id))
      .where(inArray(groupLessons.group_id, groupIds))
      .orderBy(desc(groupLessons.created_at))

    return NextResponse.json(studentLessons || [])
  } catch (error) {
    console.error('❌ Error fetching student lessons:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}