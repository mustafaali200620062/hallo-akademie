import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  try {
    const { email, full_name } = await request.json()

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

    // ✅ إضافة المدرس
    await db.insert(profiles).values({
      email,
      full_name,
      role_id: teacherRole[0].id,
      is_active: true,
      is_approved: true,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Teacher added successfully' 
    })
  } catch (error) {
    console.error('❌ Error adding teacher:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}