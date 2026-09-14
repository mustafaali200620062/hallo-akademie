import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, joinRequests } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET() {
  try {
    // ✅ جلب دور الطالب
    const studentRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Student'))

    // ✅ جلب دور المدرس
    const teacherRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Lehrer'))

    // ✅ جلب دور المساعد
    const assistantRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Assistent'))

    // ✅ عدد الطلاب
    const studentCount = studentRole.length > 0
      ? await db.select({ count: count() }).from(profiles).where(eq(profiles.role_id, studentRole[0].id))
      : [{ count: 0 }]

    // ✅ عدد المدرسين
    const teacherCount = teacherRole.length > 0
      ? await db.select({ count: count() }).from(profiles).where(eq(profiles.role_id, teacherRole[0].id))
      : [{ count: 0 }]

    // ✅ عدد المساعدين
    const assistantCount = assistantRole.length > 0
      ? await db.select({ count: count() }).from(profiles).where(eq(profiles.role_id, assistantRole[0].id))
      : [{ count: 0 }]

    // ✅ عدد طلبات الانضمام المعلقة
    const pendingCount = await db
      .select({ count: count() })
      .from(joinRequests)
      .where(eq(joinRequests.status, 'pending'))

    return NextResponse.json({
      students: Number(studentCount[0]?.count || 0),
      teachers: Number(teacherCount[0]?.count || 0),
      assistants: Number(assistantCount[0]?.count || 0),
      pendingRequests: Number(pendingCount[0]?.count || 0),
      groups: 0,
      exams: 0,
      lessons: 0,
      forumPosts: 0,
    })
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}