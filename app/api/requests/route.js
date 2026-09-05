import { NextResponse } from 'next/server'
import { db } from '@/db'
import { joinRequests, profiles, levels } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

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
      .orderBy(desc(joinRequests.created_at))

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

    const requestData = await db
      .select()
      .from(joinRequests)
      .where(eq(joinRequests.id, request_id))

    if (!requestData || requestData.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const student = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, requestData[0].student_id))

    if (!student || student.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (status === 'approved') {
      await db
        .update(profiles)
        .set({
          is_active: true,
          is_approved: true
        })
        .where(eq(profiles.id, requestData[0].student_id))

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
      await db
        .delete(joinRequests)
        .where(eq(joinRequests.id, request_id))

      await db
        .delete(profiles)
        .where(eq(profiles.id, requestData[0].student_id))

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