// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { reentryRequests, profiles, exams, examAttempts } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// ✅ جلب طلبات الاستكمال
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('student_id')
    const examId = searchParams.get('exam_id')

    let query = db
      .select({
        id: reentryRequests.id,
        attempt_id: reentryRequests.attempt_id,
        student_id: reentryRequests.student_id,
        exam_id: reentryRequests.exam_id,
        status: reentryRequests.status,
        requested_at: reentryRequests.requested_at,
        reviewed_at: reentryRequests.reviewed_at,
        notes: reentryRequests.notes,
        student_name: profiles.full_name,
        student_phone: profiles.phone,
        exam_title: exams.title,
      })
      .from(reentryRequests)
      .leftJoin(profiles, eq(reentryRequests.student_id, profiles.id))
      .leftJoin(exams, eq(reentryRequests.exam_id, exams.id))
      .orderBy(desc(reentryRequests.requested_at))

    if (status) {
      query = query.where(eq(reentryRequests.status, status))
    } else if (studentId) {
      query = query.where(eq(reentryRequests.student_id, studentId))
    } else if (examId) {
      query = query.where(eq(reentryRequests.exam_id, examId))
    }

    const requests = await query

    return NextResponse.json(requests || [])
  } catch (error) {
    console.error('❌ Error fetching reentry requests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إنشاء طلب استكمال
export async function POST(request) {
  try {
    const body = await request.json()
    const { attempt_id, student_id, exam_id, notes } = body

    if (!attempt_id || !student_id || !exam_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ✅ التحقق من عدم وجود طلب سابق pending
    const existing = await db
      .select()
      .from(reentryRequests)
      .where(eq(reentryRequests.attempt_id, attempt_id))

    const pendingExists = existing?.some(r => r.status === 'pending')

    if (pendingExists) {
      return NextResponse.json({ error: 'لديك طلب قيد المراجعة بالفعل' }, { status: 400 })
    }

    // ✅ إنشاء الطلب
    const id = crypto.randomUUID()
    await db.insert(reentryRequests).values({
      id,
      attempt_id,
      student_id,
      exam_id,
      status: 'pending',
      notes: notes || '',
      requested_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      id,
      message: 'تم إرسال طلب الاستكمال بنجاح'
    })
  } catch (error) {
    console.error('❌ Error creating reentry request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ قبول/رفض طلب الاستكمال
export async function PUT(request) {
  try {
    const { request_id, status, reviewed_by } = await request.json()

    if (!request_id || !status) {
      return NextResponse.json({ error: 'Request ID and status required' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // ✅ جلب الطلب
    const requests = await db
      .select()
      .from(reentryRequests)
      .where(eq(reentryRequests.id, request_id))

    if (!requests || requests.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const req = requests[0]

    // ✅ تحديث حالة الطلب
    await db
      .update(reentryRequests)
      .set({
        status,
        reviewed_by: reviewed_by || null,
        reviewed_at: new Date(),
      })
      .where(eq(reentryRequests.id, request_id))

    // ✅ لو تم القبول، نسمح للطالب بالدخول
    if (status === 'approved') {
      await db
        .update(examAttempts)
        .set({
          status: 'in_progress',
          is_reentry_allowed: true,
          locked_reason: null,
        })
        .where(eq(examAttempts.id, req.attempt_id))
    }

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب'
    })
  } catch (error) {
    console.error('❌ Error updating reentry request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}