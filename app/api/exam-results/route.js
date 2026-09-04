import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

    // جلب جميع محاولات الطلاب للاختبار
    const results = await db
      .select({
        id: examAttempts.id,
        student_id: examAttempts.student_id,
        total_score: examAttempts.total_score,
        status: examAttempts.status,
        submitted_at: examAttempts.submitted_at,
        student_name: profiles.full_name,
        student_phone: profiles.phone,
      })
      .from(examAttempts)
      .leftJoin(profiles, eq(examAttempts.student_id, profiles.id))
      .where(eq(examAttempts.exam_id, examId))
      .all()

    // جلب تفاصيل الاختبار للحصول على total_points
    const { exams } = await import('@/db/schema')
    const exam = await db
      .select({
        total_points: exams.total_points,
      })
      .from(exams)
      .where(eq(exams.id, examId))
      .get()

    const totalPoints = exam?.total_points || 0

    const formattedResults = results.map(r => ({
      ...r,
      total_points: totalPoints,
      percentage: totalPoints > 0 ? Math.round((r.total_score / totalPoints) * 100) : 0
    }))

    return NextResponse.json(formattedResults || [])
  } catch (error) {
    console.error('❌ خطأ في جلب نتائج الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}