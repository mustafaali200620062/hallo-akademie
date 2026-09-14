import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, levels, joinRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const body = await request.json()
    const { phone, full_name, level } = body

    if (!phone || !full_name || !level) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // ✅ جلب دور الطالب
    const studentRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Student'))

    if (!studentRoles || studentRoles.length === 0) {
      return NextResponse.json({ error: 'Student role not found' }, { status: 500 })
    }

    // ✅ جلب المستوى
    const levelsData = await db
      .select()
      .from(levels)
      .where(eq(levels.code, level))

    if (!levelsData || levelsData.length === 0) {
      return NextResponse.json({ error: 'Level not found' }, { status: 400 })
    }

    const studentRole = studentRoles[0]
    const levelData = levelsData[0]

    // ✅ توليد معرفات
    const studentId = randomUUID()
    const requestId = randomUUID()

    // ✅ إنشاء حساب الطالب
    await db.insert(profiles).values({
      id: studentId,
      full_name: full_name,
      phone: phone,
      level_id: levelData.id,
      role_id: studentRole.id,
      is_active: false,
      is_approved: false,
      created_at: new Date(),
    })

    // ✅ إنشاء طلب انضمام
    await db.insert(joinRequests).values({
      id: requestId,
      student_id: studentId,
      level_id: levelData.id,
      status: 'pending',
      created_at: new Date(),
    })

    console.log('✅ تم تسجيل الطالب:', full_name, phone)

    return NextResponse.json({ 
      success: true, 
      message: 'Student registered successfully',
      student_id: studentId
    })
  } catch (error) {
    console.error('❌ خطأ في تسجيل الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}