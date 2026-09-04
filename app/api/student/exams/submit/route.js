import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, studentPoints } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { attempt_id, answers } = body

    if (!attempt_id || !answers) {
      return NextResponse.json({ error: 'Attempt ID and answers are required' }, { status: 400 })
    }

    // التحقق من أن المحاولة خاصة بالطالب
    const attempt = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.id, attempt_id),
        eq(examAttempts.student_id, session.user.id)
      ))
      .get()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'This attempt is not in progress' }, { status: 400 })
    }

    let totalScore = 0

    // حفظ الإجابات وحساب الدرجات
    for (const [questionId, answer] of Object.entries(answers)) {
      // جلب السؤال للحصول على الإجابة الصحيحة
      const question = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.id, questionId))
        .get()

      if (!question) continue

      const isCorrect = answer === question.correct_answer
      const awardedPoints = isCorrect ? question.points : 0
      totalScore += awardedPoints

      // حفظ الإجابة
      const answerId = crypto.randomUUID()
      await db.insert(studentAnswers).values({
        id: answerId,
        attempt_id: attempt_id,
        question_id: questionId,
        answer: JSON.stringify(answer),
        is_correct: isCorrect,
        awarded_points: awardedPoints,
        answered_at: new Date().toISOString()
      })
    }

    // تحديث حالة المحاولة
    await db
      .update(examAttempts)
      .set({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        total_score: totalScore
      })
      .where(eq(examAttempts.id, attempt_id))

    // تحديث نقاط الطالب
    const existingPoints = await db
      .select()
      .from(studentPoints)
      .where(eq(studentPoints.student_id, session.user.id))
      .get()

    if (existingPoints) {
      await db
        .update(studentPoints)
        .set({
          total_points: (existingPoints.total_points || 0) + totalScore,
          exams_completed: (existingPoints.exams_completed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .where(eq(studentPoints.student_id, session.user.id))
    } else {
      await db.insert(studentPoints).values({
        student_id: session.user.id,
        total_points: totalScore,
        exams_completed: 1,
        updated_at: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      total_score: totalScore,
      message: 'Exam submitted successfully' 
    })
  } catch (error) {
    console.error('❌ خطأ في تسليم الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}