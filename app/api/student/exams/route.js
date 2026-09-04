import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exams, examAttempts, groupStudents, levels, groups, examQuestions } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (examId) {
      // جلب اختبار محدد مع أسئلته
      const exam = await db
        .select({
          id: exams.id,
          title: exams.title,
          description: exams.description,
          duration_minutes: exams.duration_minutes,
          total_points: exams.total_points,
          starts_at: exams.starts_at,
          ends_at: exams.ends_at,
          status: exams.status,
          group_id: exams.group_id,
          level_id: exams.level_id,
          level_code: levels.code,
          level_title: levels.title,
          group_name: groups.name,
        })
        .from(exams)
        .leftJoin(levels, eq(exams.level_id, levels.id))
        .leftJoin(groups, eq(exams.group_id, groups.id))
        .where(eq(exams.id, examId))
        .get()

      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      // جلب أسئلة الاختبار
      const questions = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.exam_id, examId))
        .orderBy(examQuestions.question_order)
        .all()

      return NextResponse.json({ ...exam, exam_questions: questions || [] })
    }

    // جلب جميع الاختبارات المتاحة للطالب
    const studentGroups = await db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.student_id, session.user.id))
      .all()

    const groupIds = studentGroups.map(g => g.group_id)

    if (groupIds.length === 0) {
      return NextResponse.json([])
    }

    const availableExams = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        duration_minutes: exams.duration_minutes,
        total_points: exams.total_points,
        starts_at: exams.starts_at,
        ends_at: exams.ends_at,
        status: exams.status,
        group_id: exams.group_id,
        level_id: exams.level_id,
        level_code: levels.code,
        group_name: groups.name,
      })
      .from(exams)
      .leftJoin(levels, eq(exams.level_id, levels.id))
      .leftJoin(groups, eq(exams.group_id, groups.id))
      .where(inArray(exams.group_id, groupIds))
      .all()

    // جلب محاولات الطالب
    const attempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.student_id, session.user.id))
      .all()

    const attemptMap = {}
    attempts?.forEach(a => {
      attemptMap[a.exam_id] = { status: a.status, score: a.total_score }
    })

    const examsWithStatus = availableExams?.map(exam => ({
      ...exam,
      attempt: attemptMap[exam.id] || { status: 'not_started', score: 0 }
    })) || []

    return NextResponse.json(examsWithStatus)
  } catch (error) {
    console.error('❌ خطأ في جلب اختبارات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}