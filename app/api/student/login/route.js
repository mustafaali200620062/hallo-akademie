import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, levels } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // ✅ جلب بيانات الطالب (بدون .get())
    const students = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        phone: profiles.phone,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        level_id: profiles.level_id,
        level_code: levels.code,
      })
      .from(profiles)
      .leftJoin(levels, eq(profiles.level_id, levels.id))
      .where(eq(profiles.phone, phone))

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'رقم الهاتف غير مسجل' }, { status: 404 })
    }

    const student = students[0]

    if (!student.is_active || !student.is_approved) {
      return NextResponse.json({ error: 'حسابك غير مفعل. يرجى الانتظار حتى قبول طلبك' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: student.id,
        full_name: student.full_name,
        phone: student.phone,
        level_id: student.level_id,
        level_code: student.level_code,
        is_active: student.is_active,
        is_approved: student.is_approved,
      }
    })
  } catch (error) {
    console.error('❌ خطأ في تسجيل دخول الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}