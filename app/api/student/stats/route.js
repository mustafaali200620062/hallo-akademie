import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents, exams, examAttempts, studentPoints, groups } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // جلب المجموعات التي ينتمي لها الطالب
    const studentGroups = await db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.student_id, session.user.id))
      .all()

    const groupIds = studentGroups.map(g => g.group_id)

    // عدد المجموعات
    const groupsCount = groupIds.length

    // عدد الاختبارات المتاحة
    let examsCount = 0
    if (groupIds.length > 0) {
      const availableExams = await db
        .select()
        .from(exams)
        .where(inArray(exams.group_id, groupIds))
        .all()
      examsCount = availableExams.filter(e => e.status === 'active' || e.status === 'scheduled').length
    }

    // عدد الاختبارات المكتملة
    const completedExams = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.student_id, session.user.id),
        eq(examAttempts.status, 'submitted')
      ))
      .all()

    // النقاط والترتيب
    const points = await db
      .select()
      .from(studentPoints)
      .where(eq(studentPoints.student_id, session.user.id))
      .get()

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