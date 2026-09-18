import { NextResponse } from 'next/server'
import { db } from '@/db'
import { studentAnswers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID required' }, { status: 400 })
    }

    // ✅ جلب إجابات الطالب (بدون .all())
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