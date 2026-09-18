// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exams, examQuestions, levels, groups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    // ✅ جلب الاختبار
    const examsData = await db
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

    if (!examsData || examsData.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const exam = examsData[0]

    // ✅ جلب الأسئلة
    const questions = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.exam_id, examId))

    return NextResponse.json({
      ...exam,
      exam_questions: questions || []
    })
  } catch (error) {
    console.error('❌ Error fetching exam preview:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}