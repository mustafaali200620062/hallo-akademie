// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, studentPoints, studentErrors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ✅ تحويل أي قيمة لـ array
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

// ✅ تطبيع النص
const normalizeText = (v) => {
  if (v === null || v === undefined) return ''
  return String(v).trim().toLowerCase().replace(/\s+/g, ' ')
}

// ✅ استخراج قائمة الخيارات (نصوص فقط) من options
const getOptionsList = (options) => {
  let parsed = options
  try {
    if (typeof options === 'string') parsed = JSON.parse(options)
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)
  } catch (e) {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map(o => {
    if (typeof o === 'string') return o
    if (o && typeof o === 'object' && o.left) return o.left
    return String(o)
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { attempt_id, answers, student_id, force_submit } = body

    if (!attempt_id || !student_id) {
      return NextResponse.json({ error: 'Attempt ID and Student ID are required' }, { status: 400 })
    }

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

    if (attempt.status === 'submitted') {
      return NextResponse.json({
        success: true,
        message: 'تم التسليم بالفعل',
        already_submitted: true,
        total_score: attempt.total_score
      })
    }

    // ✅ حذف أي إجابات قديمة
    await db.delete(studentAnswers).where(eq(studentAnswers.attempt_id, attempt_id))

    let totalScore = 0

    if (answers && typeof answers === 'object') {
      for (const [questionId, answer] of Object.entries(answers)) {
        const questions = await db
          .select()
          .from(examQuestions)
          .where(eq(examQuestions.id, questionId))

        if (!questions || questions.length === 0) continue

        const question = questions[0]

        // ✅ الإجابات الصحيحة (ممكن تكون فهارس أو نصوص)
        const correctAnswersRaw = toArray(question.correct_answers).length > 0
          ? toArray(question.correct_answers)
          : toArray(question.correct_answer)

        // ✅ قائمة الخيارات النصية
        const optionsList = getOptionsList(question.options)

        // ✅ تحويل الإجابات الصحيحة إلى نصوص (نفس صيغة الطالب)
        // لو الإجابة رقم → نجيبه من optionsList
        // لو نص → نسيبه زي ما هو
        const correctTexts = correctAnswersRaw.map(ca => {
          const asNum = Number(ca)
          if (!isNaN(asNum) && Number.isInteger(asNum) && optionsList[asNum] !== undefined) {
            return normalizeText(optionsList[asNum])
          }
          return normalizeText(ca)
        }).filter(Boolean).sort()

        // ✅ تحويل إجابات الطالب إلى نصوص موحدة
        const answerList = Array.isArray(answer) ? answer : [answer]
        const answerTexts = answerList.map(a => normalizeText(a)).filter(Boolean).sort()

        // ✅ المقارنة النهائية (نص بنص)
        let isCorrect = false
        if (correctTexts.length > 0 && answerTexts.length > 0) {
          // لو نفس العدد وكل العناصر متطابقة
          isCorrect = correctTexts.length === answerTexts.length &&
            correctTexts.every((v, i) => v === answerTexts[i])
        }

        const awardedPoints = isCorrect ? (question.points || 1) : 0
        totalScore += awardedPoints

        console.log(`📝 Q ${questionId}:`)
        console.log(`   correctRaw:`, correctAnswersRaw)
        console.log(`   correctTexts:`, correctTexts)
        console.log(`   answerRaw:`, answerList)
        console.log(`   answerTexts:`, answerTexts)
        console.log(`   isCorrect: ${isCorrect}, points: ${awardedPoints}`)

        await db.insert(studentAnswers).values({
          id: randomUUID(),
          attempt_id: attempt_id,
          question_id: questionId,
          answer: JSON.stringify(answer),
          is_correct: isCorrect,
          awarded_points: awardedPoints,
          answered_at: new Date(),
        })

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

    await db
      .update(examAttempts)
      .set({
        status: 'submitted',
        submitted_at: new Date(),
        total_score: totalScore,
        is_reentry_allowed: false,
      })
      .where(eq(examAttempts.id, attempt_id))

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