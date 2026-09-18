// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { reentryRequests } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const examId = searchParams.get('exam_id')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    let query = db
      .select()
      .from(reentryRequests)
      .where(studentId && examId
        ? and(eq(reentryRequests.student_id, studentId), eq(reentryRequests.exam_id, examId))
        : eq(reentryRequests.student_id, studentId))

    const requests = await query

    return NextResponse.json(requests || [])
  } catch (error) {
    console.error('❌ Error fetching student reentry requests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}