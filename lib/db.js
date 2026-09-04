// هذا الملف للاستخدام في Server Components فقط
// لا تستخدمه في Client Components

import { db } from '@/db'
import { profiles, roles, levels, groups, groupStudents, joinRequests } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// جلب بروفايل المستخدم
export async function getUserProfile(userId) {
  try {
    const result = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        phone: profiles.phone,
        email: profiles.email,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        role_name: roles.name,
        level_code: levels.code,
      })
      .from(profiles)
      .leftJoin(roles, eq(profiles.role_id, roles.id))
      .leftJoin(levels, eq(profiles.level_id, levels.id))
      .where(eq(profiles.id, userId))
      .get()

    return result
  } catch (error) {
    console.error('❌ خطأ في جلب البروفايل:', error)
    return null
  }
}

// جلب دور المستخدم
export async function getUserRole(userId) {
  try {
    const result = await db
      .select({ name: roles.name })
      .from(profiles)
      .leftJoin(roles, eq(profiles.role_id, roles.id))
      .where(eq(profiles.id, userId))
      .get()

    return result?.name || null
  } catch (error) {
    console.error('❌ خطأ في جلب الدور:', error)
    return null
  }
}

// جلب جميع الطلاب
export async function getStudents() {
  try {
    const studentRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Student'))
      .get()

    if (!studentRole) return []

    const students = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        phone: profiles.phone,
        email: profiles.email,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        last_seen_at: profiles.last_seen_at,
        created_at: profiles.created_at,
        level_code: levels.code,
      })
      .from(profiles)
      .leftJoin(levels, eq(profiles.level_id, levels.id))
      .where(eq(profiles.role_id, studentRole.id))
      .all()

    return students || []
  } catch (error) {
    console.error('❌ خطأ في جلب الطلاب:', error)
    return []
  }
}

// جلب طلبات الانضمام المعلقة
export async function getPendingRequests() {
  try {
    const requests = await db
      .select({
        id: joinRequests.id,
        created_at: joinRequests.created_at,
        status: joinRequests.status,
        student_id: joinRequests.student_id,
        student_name: profiles.full_name,
        student_phone: profiles.phone,
        level_code: levels.code,
      })
      .from(joinRequests)
      .leftJoin(profiles, eq(joinRequests.student_id, profiles.id))
      .leftJoin(levels, eq(joinRequests.level_id, levels.id))
      .where(eq(joinRequests.status, 'pending'))
      .all()

    return requests || []
  } catch (error) {
    console.error('❌ خطأ في جلب طلبات الانضمام:', error)
    return []
  }
}

// جلب المجموعات
export async function getGroups() {
  try {
    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        is_active: groups.is_active,
        created_at: groups.created_at,
        level_code: levels.code,
        level_title: levels.title,
      })
      .from(groups)
      .leftJoin(levels, eq(groups.level_id, levels.id))
      .all()

    return allGroups || []
  } catch (error) {
    console.error('❌ خطأ في جلب المجموعات:', error)
    return []
  }
}

export { db }