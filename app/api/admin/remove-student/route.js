import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, joinRequests, examAttempts, studentPoints, groupStudents } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(request) {
  try {
    console.log('🔍 بداية طلب حذف الطالب...')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    console.log('📝 معرف الطالب:', id)

    if (!id) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // جلب دور الطالب
    const studentRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Student'))
      .get()

    if (!studentRole) {
      return NextResponse.json({ error: 'Student role not found' }, { status: 500 })
    }

    // التحقق من أن المستهدف طالب
    const student = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .get()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.role_id !== studentRole.id) {
      return NextResponse.json({ error: 'Target is not a student' }, { status: 400 })
    }

    console.log('👤 جاري حذف الطالب:', student.full_name)

    // 1. حذف طلبات الانضمام المرتبطة
    console.log('🗑️ حذف طلبات الانضمام...')
    await db
      .delete(joinRequests)
      .where(eq(joinRequests.student_id, id))

    // 2. حذف محاولات الاختبارات
    console.log('🗑️ حذف محاولات الاختبارات...')
    await db
      .delete(examAttempts)
      .where(eq(examAttempts.student_id, id))

    // 3. حذف نقاط الطالب
    console.log('🗑️ حذف نقاط الطالب...')
    await db
      .delete(studentPoints)
      .where(eq(studentPoints.student_id, id))

    // 4. حذف ربط الطالب بالمجموعات
    console.log('🗑️ حذف ربط الطالب بالمجموعات...')
    await db
      .delete(groupStudents)
      .where(eq(groupStudents.student_id, id))

    // 5. حذف الطالب نفسه
    console.log('🗑️ حذف الطالب...')
    await db
      .delete(profiles)
      .where(eq(profiles.id, id))

    console.log('✅ تم حذف الطالب بنجاح!')

    return NextResponse.json({ 
      success: true, 
      message: 'Student removed successfully' 
    })
  } catch (error) {
    console.error('❌ خطأ في حذف الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}