import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const teacherRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Lehrer'))

    if (!teacherRole || teacherRole.length === 0) {
      return NextResponse.json({ error: 'Teacher role not found' }, { status: 404 })
    }

    const teachers = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        email: profiles.email,
        phone: profiles.phone,
        password: profiles.password,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        created_at: profiles.created_at,
      })
      .from(profiles)
      .where(eq(profiles.role_id, teacherRole[0].id))
      .orderBy(asc(profiles.full_name))

    return NextResponse.json(teachers || [])
  } catch (error) {
    console.error('❌ Error fetching teachers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}