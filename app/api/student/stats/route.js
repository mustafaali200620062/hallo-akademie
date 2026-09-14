import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents, exams, examAttempts, studentPoints } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET(request) {
  try {
    // ✅ جلب بيانات الطالب من localStorage (مش من session)
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    // لو مفيش student_id، نرجع أصفار
    if (!studentId) {
      return NextResponse.json({
        groups: 0,
        exams: 0,
        completedExams: 0,
        totalPoints: 0,
        rank: '-'
      })
    }

    // ✅ جلب المجموعات التي ينتمي لها الطالب
    const studentGroups = await db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.student_id, studentId))

    const groupIds = studentGroups.map(g => g.group_id)

    // ✅ عدد المجموعات
    const groupsCount = groupIds.length

    // ✅ عدد الاختبارات المتاحة
    let examsCount = 0
    if (groupIds.length > 0) {
      const availableExams = await db
        .select()
        .from(exams)
        .where(inArray(exams.group_id, groupIds))
      examsCount = availableExams.filter(e => e.status === 'active' || e.status === 'scheduled').length
    }

    // ✅ عدد الاختبارات المكتملة
    const completedExams = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.student_id, studentId),
        eq(examAttempts.status, 'submitted')
      ))

    // ✅ النقاط والترتيب
    const pointsData = await db
      .select()
      .from(studentPoints)
      .where(eq(studentPoints.student_id, studentId))

    const points = pointsData.length > 0 ? pointsData[0] : null

    return NextResponse.json({
      groups: groupsCount || 0,
      exams: examsCount || 0,
      completedExams: completedExams.length || 0,
      totalPoints: points?.total_points || 0,
      rank: points?.rank || '-'
    })
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}