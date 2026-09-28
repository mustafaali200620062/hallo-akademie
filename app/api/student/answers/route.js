import { NextResponse } from 'next/server'
import { db } from '@/db'
import { studentAnswers, examAttempts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ✅ جلب إجابات الطالب
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID required' }, { status: 400 })
    }

    const answers = await db
      .select()
      .from(studentAnswers)
      .where(eq(studentAnswers.attempt_id, attemptId))

    return NextResponse.json(answers || [])
  } catch (error) {
    console.error('❌ خطأ في جلب إجابات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حفظ إجابة واحدة (live) + تحديث last_activity_at
export async function POST(request) {
  try {
    const body = await request.json()
    const { attempt_id, question_id, answer } = body

    if (!attempt_id || !question_id) {
      return NextResponse.json(
        { error: 'Attempt ID and Question ID are required' },
        { status: 400 }
      )
    }

    const answerJson = typeof answer === 'string' ? answer : JSON.stringify(answer)

    // ✅ هل الإجابة موجودة بالفعل؟
    const existing = await db
      .select()
      .from(studentAnswers)
      .where(and(
        eq(studentAnswers.attempt_id, attempt_id),
        eq(studentAnswers.question_id, question_id)
      ))

    if (existing && existing.length > 0) {
      // ✅ تحديث الإجابة الموجودة
      await db
        .update(studentAnswers)
        .set({
          answer: answerJson,
          answered_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(studentAnswers.id, existing[0].id))
    } else {
      // ✅ إدخال إجابة جديدة
      await db.insert(studentAnswers).values({
        id: randomUUID(),
        attempt_id,
        question_id,
        answer: answerJson,
        is_correct: false,           // هيتحدد وقت التسليم
        awarded_points: 0,           // هيتحدد وقت التسليم
        answered_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    // ✅ تحديث last_activity_at في المحاولة
    await db
      .update(examAttempts)
      .set({
        last_activity_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(examAttempts.id, attempt_id))

    return NextResponse.json({
      success: true,
      message: 'Answer saved'
    })
  } catch (error) {
    console.error('❌ خطأ في حفظ الإجابة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}