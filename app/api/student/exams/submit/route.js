// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, studentAnswers, examQuestions, studentPoints, studentErrors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ✅ فك التداخل المتعدد للـ JSON
const deepParse = (val) => {
  if (val === null || val === undefined) return null
  let parsed = val
  let attempts = 0
  while (typeof parsed === 'string' && attempts < 10) {
    try {
      parsed = JSON.parse(parsed)
    } catch (e) {
      break
    }
    attempts++
  }
  return parsed
}

// ✅ تحويل لأي حاجة → array
const toArray = (val) => {
  const parsed = deepParse(val)
  if (parsed === null || parsed === undefined) return []
  if (Array.isArray(parsed)) return parsed
  return [parsed]
}

// ✅ تطبيع النص
const normalizeText = (v) => {
  if (v === null || v === undefined) return ''
  return String(v).trim().toLowerCase().replace(/\s+/g, ' ')
}

// ✅ استخراج قائمة الخيارات (نصوص) من options
const getOptionsList = (options) => {
  const parsed = deepParse(options)
  if (!Array.isArray(parsed)) return []
  return parsed.map(o => {
    if (typeof o === 'string') return o
    if (o && typeof o === 'object' && o.left !== undefined) return o.left
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

    // ✅ حذف الإجابات القديمة (احتياط)
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

        // ✅ فك التداخل للـ correct_answers
        const correctRaw = toArray(question.correct_answers).length > 0
          ? toArray(question.correct_answers)
          : toArray(question.correct_answer)

        // ✅ قائمة الخيارات
        const optionsList = getOptionsList(question.options)

        console.log(`\n📝 ===== Question ${questionId} =====`)
        console.log(`   type: ${question.question_type}`)
        console.log(`   options (parsed):`, optionsList)
        console.log(`   correctRaw:`, correctRaw)
        console.log(`   student answer:`, answer)

        // ✅ تحويل الإجابات الصحيحة إلى نصوص
        // - لو رقم → جيب النص من optionsList
        // - لو نص → خليه
        const correctTexts = correctRaw.map(ca => {
          // حاول تحويله لرقم
          const asNum = Number(ca)
          if (!isNaN(asNum) && Number.isInteger(asNum) && optionsList[asNum] !== undefined) {
            return normalizeText(optionsList[asNum])
          }
          return normalizeText(ca)
        }).filter(Boolean).sort()

        // ✅ تحويل إجابات الطالب إلى نصوص
        // - لو رقم → جيب النص من optionsList
        // - لو نص → خليه
        const answerList = Array.isArray(answer) ? answer : [answer]
        const answerTexts = answerList.map(a => {
          const asNum = Number(a)
          if (!isNaN(asNum) && Number.isInteger(asNum) && optionsList[asNum] !== undefined) {
            return normalizeText(optionsList[asNum])
          }
          return normalizeText(a)
        }).filter(Boolean).sort()

        console.log(`   correctTexts:`, correctTexts)
        console.log(`   answerTexts:`, answerTexts)

        // ✅ المقارنة النهائية (نص بنص بعد الترتيب)
        let isCorrect = false
        if (correctTexts.length > 0 && answerTexts.length > 0) {
          isCorrect = correctTexts.length === answerTexts.length &&
            correctTexts.every((v, i) => v === answerTexts[i])
        }

        console.log(`   ✅ isCorrect: ${isCorrect}`)

        const awardedPoints = isCorrect ? (question.points || 1) : 0
        totalScore += awardedPoints

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
            correct_answer: JSON.stringify(correctRaw),
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