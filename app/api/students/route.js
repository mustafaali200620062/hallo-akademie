// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const studentRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Student'))
      .limit(1)

    if (!studentRole || studentRole.length === 0) {
      return NextResponse.json({ error: 'Student role not found' }, { status: 404 })
    }

    const studentRoleId = studentRole[0].id

    const students = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        phone: profiles.phone,
        email: profiles.email,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        created_at: profiles.created_at,
        last_seen_at: profiles.last_seen_at,
      })
      .from(profiles)
      .where(eq(profiles.role_id, studentRoleId))

    return NextResponse.json(students)
  } catch (error) {
    console.error('❌ خطأ في جلب الطلاب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}