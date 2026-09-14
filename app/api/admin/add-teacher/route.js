import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  try {
    const { email, full_name, password } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 })
    }

    // ✅ جلب دور المدرس
    const teacherRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Lehrer'))

    if (!teacherRole || teacherRole.length === 0) {
      return NextResponse.json({ error: 'Teacher role not found' }, { status: 404 })
    }

    // ✅ التحقق من وجود المدرس بالفعل
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 400 })
    }

    // ✅ إضافة المدرس (مع كلمة المرور الافتراضية 123123)
    await db.insert(profiles).values({
      id: crypto.randomUUID(),
      email,
      full_name,
      password: password || '123123',
      role_id: teacherRole[0].id,
      is_active: true,
      is_approved: true,
      created_at: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Teacher added successfully. Default password: 123123' 
    })
  } catch (error) {
    console.error('❌ Error adding teacher:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}