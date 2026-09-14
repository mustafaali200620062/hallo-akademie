import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request) {
  try {
    const { group_id, student_id } = await request.json()

    if (!group_id || !student_id) {
      return NextResponse.json({ error: 'Group ID and Student ID are required' }, { status: 400 })
    }

    // ✅ التحقق من عدم وجود الطالب في المجموعة
    const existing = await db
      .select()
      .from(groupStudents)
      .where(and(
        eq(groupStudents.group_id, group_id),
        eq(groupStudents.student_id, student_id)
      ))

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'الطالب موجود بالفعل في هذه المجموعة' }, { status: 400 })
    }

    // ✅ إضافة الطالب للمجموعة
    await db.insert(groupStudents).values({
      id: crypto.randomUUID(),
      group_id,
      student_id,
      is_active: true,
      created_at: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      message: 'تم إضافة الطالب للمجموعة بنجاح' 
    })
  } catch (error) {
    console.error('❌ Error adding student to group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}