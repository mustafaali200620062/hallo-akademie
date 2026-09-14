import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, exams, levels, groups } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('student_id')

    if (!examId || !studentId) {
      return NextResponse.json({ error: 'Exam ID and Student ID required' }, { status: 400 })
    }

    // ✅ جلب محاولة الطالب
    const attempts = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.exam_id, examId),
        eq(examAttempts.student_id, studentId)
      ))

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const attempt = attempts[0]

    // ✅ جلب تفاصيل الاختبار
    const examsData = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        total_points: exams.total_points,
        level_code: levels.code,
        group_name: groups.name,
      })
      .from(exams)
      .leftJoin(levels, eq(exams.level_id, levels.id))
      .leftJoin(groups, eq(exams.group_id, groups.id))
      .where(eq(exams.id, examId))

    const exam = examsData.length > 0 ? examsData[0] : null

    // ✅ جلب الإجابات مع تفاصيل الأسئلة
    const answers = await db
      .select({
        id: studentAnswers.id,
        answer: studentAnswers.answer,
        is_correct: studentAnswers.is_correct,
        awarded_points: studentAnswers.awarded_points,
        question_text: examQuestions.question_text,
        correct_answer: examQuestions.correct_answer,
        explanation: examQuestions.explanation,
        points: examQuestions.points,
      })
      .from(studentAnswers)
      .leftJoin(examQuestions, eq(studentAnswers.question_id, examQuestions.id))
      .where(eq(studentAnswers.attempt_id, attempt.id))

    return NextResponse.json({
      attempt,
      exam,
      answers: answers || []
    })
  } catch (error) {
    console.error('❌ خطأ في جلب نتيجة الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}