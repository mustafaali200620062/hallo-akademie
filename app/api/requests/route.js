import { NextResponse } from 'next/server'
import { db } from '@/db'
import { joinRequests, profiles, roles, levels } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const requests = await db
      .select({
        id: joinRequests.id,
        student_id: joinRequests.student_id,
        level_id: joinRequests.level_id,
        status: joinRequests.status,
        created_at: joinRequests.created_at,
        student_name: profiles.full_name,
        student_phone: profiles.phone,
        level_code: levels.code,
        level_title: levels.title,
      })
      .from(joinRequests)
      .leftJoin(profiles, eq(joinRequests.student_id, profiles.id))
      .leftJoin(levels, eq(joinRequests.level_id, levels.id))
      .orderBy('created_at', 'desc')
      .all()

    return NextResponse.json(requests || [])
  } catch (error) {
    console.error('❌ خطأ في جلب الطلبات:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { request_id, status } = body

    if (!request_id || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // جلب بيانات الطلب
    const requestData = await db
      .select()
      .from(joinRequests)
      .where(eq(joinRequests.id, request_id))
      .get()

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // جلب بيانات الطالب
    const student = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, requestData.student_id))
      .get()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (status === 'approved') {
      // قبول: تحديث حالة الطالب
      await db
        .update(profiles)
        .set({
          is_active: 1,
          is_approved: 1
        })
        .where(eq(profiles.id, requestData.student_id))

      // تحديث حالة الطلب
      await db
        .update(joinRequests)
        .set({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .where(eq(joinRequests.id, request_id))

      return NextResponse.json({ 
        success: true, 
        message: 'Student approved successfully',
        action: 'approved'
      })

    } else {
      // رفض: حذف الطالب وطلب الانضمام
      
      // 1. حذف طلب الانضمام
      await db
        .delete(joinRequests)
        .where(eq(joinRequests.id, request_id))

      // 2. حذف الطالب من profiles
      await db
        .delete(profiles)
        .where(eq(profiles.id, requestData.student_id))

      return NextResponse.json({ 
        success: true, 
        message: 'Student rejected and removed successfully',
        action: 'rejected'
      })
    }

  } catch (error) {
    console.error('❌ خطأ في تحديث الطلب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}