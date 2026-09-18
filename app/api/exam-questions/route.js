import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examQuestions } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ✅ جلب أسئلة الاختبار
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    const questions = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.exam_id, examId))
      .orderBy(asc(examQuestions.question_order))

    return NextResponse.json(questions || [])
  } catch (error) {
    console.error('❌ خطأ في جلب الأسئلة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إضافة سؤال جديد
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      exam_id,
      question_text,
      question_type,
      options,
      correct_answer,
      correct_answers,
      media_url,
      media_type,
      points,
      explanation
    } = body

    if (!exam_id || !question_text) {
      return NextResponse.json({ error: 'Exam ID and question text are required' }, { status: 400 })
    }

    // ✅ جلب عدد الأسئلة الحالي
    const existingQuestions = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.exam_id, exam_id))

    const questionOrder = (existingQuestions?.length || 0) + 1

    const id = randomUUID()

    await db.insert(examQuestions).values({
      id,
      exam_id,
      question_order: questionOrder,
      question_text,
      question_type: question_type || 'multiple_choice',
      media_url: media_url || null,
      media_type: media_type || null,
      options: options ? JSON.stringify(options) : null,
      correct_answer: correct_answer || null,
      correct_answers: correct_answers ? JSON.stringify(correct_answers) : null,
      points: parseInt(points) || 1,
      explanation: explanation || null,
      created_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      id,
      message: 'Question added successfully'
    })
  } catch (error) {
    console.error('❌ خطأ في إضافة السؤال:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حذف سؤال
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 })
    }

    await db.delete(examQuestions).where(eq(examQuestions.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في حذف السؤال:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}