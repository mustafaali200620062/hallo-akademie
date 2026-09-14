import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groupStudents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('group_id')
    const student_id = searchParams.get('student_id')

    if (!group_id || !student_id) {
      return NextResponse.json({ error: 'Group ID and Student ID are required' }, { status: 400 })
    }

    // ✅ حذف الطالب من المجموعة
    await db
      .delete(groupStudents)
      .where(and(
        eq(groupStudents.group_id, group_id),
        eq(groupStudents.student_id, student_id)
      ))

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الطالب من المجموعة بنجاح' 
    })
  } catch (error) {
    console.error('❌ Error removing student from group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}