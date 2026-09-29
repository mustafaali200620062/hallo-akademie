import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents, profiles, studentPoints } from '@/db/schema'
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
        level_id: profiles.level_id,
      })
      .from(groupStudents)
      .leftJoin(profiles, eq(groupStudents.student_id, profiles.id))
      .where(eq(groupStudents.group_id, group_id))

    // ✅ جلب نقاط كل طالب
    const studentsWithPoints = await Promise.all(
      (students || []).map(async (student) => {
        try {
          const pointsData = await db
            .select()
            .from(studentPoints)
            .where(eq(studentPoints.student_id, student.student_id))

          return {
            ...student,
            total_points: pointsData[0]?.total_points || 0,
            exams_completed: pointsData[0]?.exams_completed || 0,
          }
        } catch (e) {
          return {
            ...student,
            total_points: 0,
            exams_completed: 0,
          }
        }
      })
    )

    return NextResponse.json(studentsWithPoints || [])
  } catch (error) {
    console.error('❌ Error fetching group students:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}