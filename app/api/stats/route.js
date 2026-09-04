import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, joinRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // عدد الطلاب
    const studentRole = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'Student')).get()
    const students = await db.select({ count: profiles.id }).from(profiles).where(eq(profiles.role_id, studentRole.id)).all()

    // عدد المدرسين
    const teacherRole = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'Lehrer')).get()
    const teachers = await db.select({ count: profiles.id }).from(profiles).where(eq(profiles.role_id, teacherRole.id)).all()

    // عدد المساعدين
    const assistantRole = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'Assistent')).get()
    const assistants = await db.select({ count: profiles.id }).from(profiles).where(eq(profiles.role_id, assistantRole.id)).all()

    // عدد طلبات الانضمام المعلقة
    const pending = await db.select({ count: joinRequests.id }).from(joinRequests).where(eq(joinRequests.status, 'pending')).all()

    return NextResponse.json({
      students: students.length || 0,
      teachers: teachers.length || 0,
      assistants: assistants.length || 0,
      pendingRequests: pending.length || 0
    })
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}