import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { studentAnswers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID required' }, { status: 400 })
    }

    // جلب إجابات الطالب
    const answers = await db
      .select()
      .from(studentAnswers)
      .where(eq(studentAnswers.attempt_id, attemptId))
      .all()

    return NextResponse.json(answers || [])
  } catch (error) {
    console.error('❌ خطأ في جلب إجابات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}