import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, studentPoints } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request) {
  try {
    const body = await request.json()
    const { attempt_id, answers, student_id } = body

    if (!attempt_id || !answers || !student_id) {
      return NextResponse.json({ error: 'Attempt ID, answers, and student ID are required' }, { status: 400 })
    }

    // ✅ التحقق من أن المحاولة خاصة بالطالب
    const attempts = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.id, attempt_id),
        eq(examAttempts.student_id, student_id)
      ))

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const attempt = attempts[0]

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'This attempt is not in progress' }, { status: 400 })
    }

    let totalScore = 0

    // ✅ حفظ الإجابات وحساب الدرجات
    for (const [questionId, answer] of Object.entries(answers)) {
      const questions = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.id, questionId))

      if (!questions || questions.length === 0) continue

      const question = questions[0]
      const isCorrect = answer === question.correct_answer
      const awardedPoints = isCorrect ? question.points : 0
      totalScore += awardedPoints

      // ✅ حفظ الإجابة
      await db.insert(studentAnswers).values({
        id: crypto.randomUUID(),
        attempt_id: attempt_id,
        question_id: questionId,
        answer: JSON.stringify(answer),
        is_correct: isCorrect,
        awarded_points: awardedPoints,
        answered_at: new Date(),
      })
    }

    // ✅ تحديث حالة المحاولة
    await db
      .update(examAttempts)
      .set({
        status: 'submitted',
        submitted_at: new Date(),
        total_score: totalScore
      })
      .where(eq(examAttempts.id, attempt_id))

    // ✅ تحديث نقاط الطالب
    const existingPointsData = await db
      .select()
      .from(studentPoints)
      .where(eq(studentPoints.student_id, student_id))

    if (existingPointsData && existingPointsData.length > 0) {
      const existingPoints = existingPointsData[0]
      await db
        .update(studentPoints)
        .set({
          total_points: (existingPoints.total_points || 0) + totalScore,
          exams_completed: (existingPoints.exams_completed || 0) + 1,
          updated_at: new Date()
        })
        .where(eq(studentPoints.student_id, student_id))
    } else {
      await db.insert(studentPoints).values({
        student_id: student_id,
        total_points: totalScore,
        exams_completed: 1,
        created_at: new Date(),
        updated_at: new Date(),
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