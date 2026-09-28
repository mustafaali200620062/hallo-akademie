// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, studentPoints, studentErrors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ✅ دالة مساعدة: تحويل أي قيمة لـ array of strings
const toArray = (val) => {
  if (val === null || val === undefined) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
      return [parsed]
    } catch (e) {
      return [val]
    }
  }
  return [val]
}

// ✅ تطبيع الإجابة لمقارنة موحدة
const normalizeValue = (v) => {
  return String(v).trim().toLowerCase().replace(/\s+/g, ' ')
}

// ✅ استخراج الخيارات من options + فهرسة
const getOptionsList = (options) => {
  let parsed = options
  try {
    if (typeof options === 'string') parsed = JSON.parse(options)
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)
  } catch (e) {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map(o => (typeof o === 'string' ? o : (o?.left ?? String(o)))).filter(Boolean)
}

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

    // ✅ حذف أي إجابات قديمة (احتياط من auto-submit ثم manual)
    await db.delete(studentAnswers).where(eq(studentAnswers.attempt_id, attempt_id))

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

        // ✅ الإجابات الصحيحة
        const correctAnswersRaw = toArray(question.correct_answers).length > 0
          ? toArray(question.correct_answers)
          : toArray(question.correct_answer)

        // ✅ الخيارات لعمل الفهرسة
        const optionsList = getOptionsList(question.options)

        // ✅ قائمة قيم مقبولة للتصحيح (تشمل: النص + الفهرس)
        const correctValues = new Set()
        for (const ca of correctAnswersRaw) {
          // النص الأصلي
          correctValues.add(normalizeValue(ca))
          // لو رقم → ياخد النص من options
          const asNum = Number(ca)
          if (!isNaN(asNum) && optionsList[asNum] !== undefined) {
            correctValues.add(normalizeValue(optionsList[asNum]))
          }
          // لو نص → يدور على الفهرس
          const idx = optionsList.findIndex(o => normalizeValue(o) === normalizeValue(ca))
          if (idx !== -1) {
            correctValues.add(normalizeValue(idx))
          }
        }

        // ✅ الإجابات اللي الطالب اختارها
        const answerList = Array.isArray(answer) ? answer : [answer]
        const answerValues = new Set()
        for (const a of answerList) {
          answerValues.add(normalizeValue(a))
          const asNum = Number(a)
          if (!isNaN(asNum) && optionsList[asNum] !== undefined) {
            answerValues.add(normalizeValue(optionsList[asNum]))
          }
          const idx = optionsList.findIndex(o => normalizeValue(o) === normalizeValue(a))
          if (idx !== -1) {
            answerValues.add(normalizeValue(idx))
          }
        }

        // ✅ المقارنة النهائية
        let isCorrect = false
        if (correctValues.size > 0 && answerValues.size > 0) {
          // كل عنصر في answerValues موجود في correctValues والعكس
          const allMatch = [...answerValues].every(v => correctValues.has(v))
            && [...correctValues].every(v => answerValues.has(v))
          isCorrect = allMatch
        }

        const awardedPoints = isCorrect ? (question.points || 1) : 0
        totalScore += awardedPoints

        // ✅ حفظ الإجابة
        await db.insert(studentAnswers).values({
          id: randomUUID(),
          attempt_id: attempt_id,
          question_id: questionId,
          answer: JSON.stringify(answer),
          is_correct: isCorrect,
          awarded_points: awardedPoints,
          answered_at: new Date(),
        })

        // ✅ تسجيل الخطأ
        if (!isCorrect) {
          await db.insert(studentErrors).values({
            id: randomUUID(),
            student_id,
            question_id: questionId,
            attempt_id,
            student_answer: JSON.stringify(answer),
            correct_answer: JSON.stringify(correctAnswersRaw),
            created_at: new Date(),
          })
        }
      }
    }

    // ✅ تحديث المحاولة
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