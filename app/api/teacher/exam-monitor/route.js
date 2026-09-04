import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { examAttempts, exams, profiles } from '@/db/schema'
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

    // جلب جميع محاولات الطلاب لهذا الاختبار
    const attempts = await db
      .select({
        id: examAttempts.id,
        exam_id: examAttempts.exam_id,
        student_id: examAttempts.student_id,
        status: examAttempts.status,
        started_at: examAttempts.started_at,
        submitted_at: examAttempts.submitted_at,
        extra_minutes: examAttempts.extra_minutes,
        total_score: examAttempts.total_score,
        is_reentry_allowed: examAttempts.is_reentry_allowed,
        locked_reason: examAttempts.locked_reason,
        student_name: profiles.full_name,
        student_phone: profiles.phone,
        exam_title: exams.title,
        exam_duration: exams.duration_minutes,
      })
      .from(examAttempts)
      .leftJoin(profiles, eq(examAttempts.student_id, profiles.id))
      .leftJoin(exams, eq(examAttempts.exam_id, exams.id))
      .where(eq(examAttempts.exam_id, examId))
      .all()

    // حساب الوقت المنقضي لكل طالب
    const attemptsWithTime = attempts?.map(attempt => {
      let elapsedMinutes = 0
      let remainingMinutes = 0
      let status = attempt.status

      if (attempt.started_at && attempt.status === 'in_progress') {
        const now = new Date()
        const start = new Date(attempt.started_at)
        elapsedMinutes = Math.floor((now - start) / 60000)
        const totalMinutes = (attempt.exam_duration || 0) + (attempt.extra_minutes || 0)
        remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes)
        
        if (remainingMinutes <= 0) {
          status = 'expired'
        }
      }

      return {
        ...attempt,
        elapsed_minutes: elapsedMinutes,
        remaining_minutes: remainingMinutes,
        status: status
      }
    })

    return NextResponse.json(attemptsWithTime || [])
  } catch (error) {
    console.error('❌ خطأ في جلب متابعة الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { attempt_id, action, extra_minutes } = body

    if (!attempt_id) {
      return NextResponse.json({ error: 'Attempt ID required' }, { status: 400 })
    }

    // جلب المحاولة الحالية
    const attempt = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, attempt_id))
      .get()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (action === 'lock') {
      // قفل الاختبار
      await db
        .update(examAttempts)
        .set({
          status: 'locked',
          is_reentry_allowed: false,
          locked_reason: 'تم القفل من قبل المدرس'
        })
        .where(eq(examAttempts.id, attempt_id))
      
      return NextResponse.json({ success: true, message: 'تم قفل الاختبار' })
    }

    if (action === 'unlock') {
      // فتح الاختبار
      await db
        .update(examAttempts)
        .set({
          status: 'in_progress',
          is_reentry_allowed: true,
          locked_reason: null
        })
        .where(eq(examAttempts.id, attempt_id))
      
      return NextResponse.json({ success: true, message: 'تم فتح الاختبار' })
    }

    if (action === 'add_time' && extra_minutes) {
      // إضافة وقت إضافي
      await db
        .update(examAttempts)
        .set({
          extra_minutes: (attempt.extra_minutes || 0) + extra_minutes
        })
        .where(eq(examAttempts.id, attempt_id))
      
      return NextResponse.json({ success: true, message: `تم إضافة ${extra_minutes} دقيقة` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('❌ خطأ في تحديث متابعة الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}