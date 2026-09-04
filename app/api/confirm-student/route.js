import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, joinRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  try {
    const body = await request.json()
    const { phone, full_name, level } = body

    if (!phone || !full_name || !level) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // البحث عن الطالب
    const student = await db
      .select()
      .from(profiles)
      .where(eq(profiles.phone, phone))
      .get()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // تحديث حالة الطلب
    await db
      .update(joinRequests)
      .set({ status: 'pending' })
      .where(eq(joinRequests.student_id, student.id))

    return NextResponse.json({ 
      success: true, 
      message: 'Student confirmed successfully' 
    })
  } catch (error) {
    console.error('❌ خطأ في تأكيد تسجيل الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}