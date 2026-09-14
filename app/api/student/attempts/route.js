import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// ✅ جلب محاولة الطالب
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('student_id')

    if (!examId || !studentId) {
      return NextResponse.json({ error: 'Exam ID and Student ID required' }, { status: 400 })
    }

    const attempts = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.exam_id, examId),
        eq(examAttempts.student_id, studentId)
      ))

    return NextResponse.json(attempts.length > 0 ? attempts[0] : null)
  } catch (error) {
    console.error('❌ خطأ في جلب محاولات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إنشاء محاولة جديدة
export async function POST(request) {
  try {
    const body = await request.json()
    const { exam_id, student_id } = body

    if (!exam_id || !student_id) {
      return NextResponse.json({ error: 'Exam ID and Student ID required' }, { status: 400 })
    }

    // ✅ إنشاء محاولة جديدة
    const attemptId = crypto.randomUUID()
    await db.insert(examAttempts).values({
      id: attemptId,
      exam_id,
      student_id,
      status: 'in_progress',
      started_at: new Date(),
    })

    const newAttempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, attemptId))

    return NextResponse.json(newAttempts[0])
  } catch (error) {
    console.error('❌ خطأ في إنشاء محاولة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}