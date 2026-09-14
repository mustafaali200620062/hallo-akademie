import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groups, groupStudents, exams, lessons, forumPosts, profiles } from '@/db/schema'
import { eq, and, count, inArray } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    // ✅ لو مفيش teacher_id، نرجع أصفار
    if (!teacherId) {
      return NextResponse.json({
        groups: 0,
        students: 0,
        exams: 0,
        pendingExams: 0,
        lessons: 0,
        forumPosts: 0
      })
    }

    // ✅ عدد المجموعات الخاصة بالمدرس
    const teacherGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.teacher_id, teacherId))

    const groupIds = teacherGroups.map(g => g.id)

    // ✅ عدد الطلاب في مجموعات المدرس
    let studentsCount = 0
    if (groupIds.length > 0) {
      const studentsInGroups = await db
        .select()
        .from(groupStudents)
        .where(inArray(groupStudents.group_id, groupIds))
      studentsCount = studentsInGroups.length
    }

    // ✅ عدد الاختبارات في مجموعات المدرس
    let examsCount = 0
    if (groupIds.length > 0) {
      const teacherExams = await db
        .select()
        .from(exams)
        .where(inArray(exams.group_id, groupIds))
      examsCount = teacherExams.length
    }

    // ✅ عدد الشروح
    const teacherLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.created_by, teacherId))

    // ✅ عدد منشورات المنتدى
    const teacherPosts = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.author_id, teacherId))

    return NextResponse.json({
      groups: teacherGroups.length || 0,
      students: studentsCount || 0,
      exams: examsCount || 0,
      pendingExams: 0,
      lessons: teacherLessons.length || 0,
      forumPosts: teacherPosts.length || 0,
    })
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات المدرس:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}