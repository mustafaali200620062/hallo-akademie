// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, studentPoints, studentErrors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request) {
  try {
    const body = await request.json()
    const { attempt_id, answers, student_id, force_submit } = body

    if (!attempt_id || !student_id) {
      return NextResponse.json({ error: 'Attempt ID and Student ID are required' }, { status: 400 })
    }

    // ✅ جلب المحاولة
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

    // ✅ لو مسلم بالفعل، نرجع نجاح
    if (attempt.status === 'submitted') {
      return NextResponse.json({
        success: true,
        message: 'تم التسليم بالفعل',
        already_submitted: true,
        total_score: attempt.total_score
      })
    }

    let totalScore = 0

    // ✅ حفظ الإجابات وحساب الدرجات
    if (answers && typeof answers === 'object') {
      for (const [questionId, answer] of Object.entries(answers)) {
        const questions = await db
          .select()
          .from(examQuestions)
          .where(eq(examQuestions.id, questionId))

        if (!questions || questions.length === 0) continue

        const question = questions[0]

        // ✅ استخراج الإجابات الصحيحة
        let correctAnswers = []
        try {
          correctAnswers = typeof question.correct_answers === 'string'
            ? JSON.parse(question.correct_answers)
            : (question.correct_answers || [])
          if (typeof correctAnswers === 'string') correctAnswers = JSON.parse(correctAnswers)
        } catch (e) {
          correctAnswers = []
        }

        // ✅ مقارنة الإجابات
        let isCorrect = false
        let awardedPoints = 0

        if (Array.isArray(correctAnswers) && correctAnswers.length > 0) {
          // لو الإجابة مصفوفة (اختيار متعدد)
          if (Array.isArray(answer)) {
            const correctSet = correctAnswers.map(a => String(a)).sort().join(',')
            const answerSet = answer.map(a => String(a)).sort().join(',')
            isCorrect = correctSet === answerSet
          } else {
            // لو الإجابة واحدة
            isCorrect = correctAnswers.map(a => String(a)).includes(String(answer))
          }
        } else {
          // نص عادي
          isCorrect = String(answer).trim() === String(question.correct_answer || '').trim()
        }

        awardedPoints = isCorrect ? (question.points || 1) : 0
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

        // ✅ تسجيل الخطأ لو غلط
        if (!isCorrect) {
          await db.insert(studentErrors).values({
            id: crypto.randomUUID(),
            student_id,
            question_id: questionId,
            attempt_id,
            student_answer: JSON.stringify(answer),
            correct_answer: JSON.stringify(correctAnswers),
            created_at: new Date(),
          })
        }
      }
    }

    // ✅ تحديث حالة المحاولة
    await db
      .update(examAttempts)
      .set({
        status: 'submitted',
        submitted_at: new Date(),
        total_score: totalScore,
        is_reentry_allowed: false,
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
      forced: force_submit || false,
      message: 'Exam submitted successfully'
    })
  } catch (error) {
    console.error('❌ خطأ في تسليم الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}