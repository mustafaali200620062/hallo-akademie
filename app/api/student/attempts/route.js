import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    // جلب محاولة الطالب
    const attempt = await db
      .select()
      .from(examAttempts)
      .where(and(
        eq(examAttempts.exam_id, examId),
        eq(examAttempts.student_id, session.user.id)
      ))
      .get()

    return NextResponse.json(attempt || null)
  } catch (error) {
    console.error('❌ خطأ في جلب محاولات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exam_id } = body

    if (!exam_id) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    // إنشاء محاولة جديدة
    const attemptId = crypto.randomUUID()
    await db.insert(examAttempts).values({
      id: attemptId,
      exam_id,
      student_id: session.user.id,
      status: 'in_progress',
      started_at: new Date().toISOString()
    })

    const newAttempt = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, attemptId))
      .get()

    return NextResponse.json(newAttempt)
  } catch (error) {
    console.error('❌ خطأ في إنشاء محاولة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}