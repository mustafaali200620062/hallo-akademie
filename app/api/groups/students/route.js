import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('group_id')

    if (!group_id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // ✅ جلب طلاب المجموعة
    const students = await db
      .select({
        id: groupStudents.id,
        student_id: groupStudents.student_id,
        full_name: profiles.full_name,
        phone: profiles.phone,
        email: profiles.email,
        is_active: profiles.is_active,
      })
      .from(groupStudents)
      .leftJoin(profiles, eq(groupStudents.student_id, profiles.id))
      .where(eq(groupStudents.group_id, group_id))

    return NextResponse.json(students || [])
  } catch (error) {
    console.error('❌ Error fetching group students:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}