import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, levels } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // جلب جميع الأعضاء مع أدوارهم ومستوياتهم
    const members = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        email: profiles.email,
        phone: profiles.phone,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        last_seen_at: profiles.last_seen_at,
        created_at: profiles.created_at,
        role_name: roles.name,
        level_code: levels.code,
        level_title: levels.title,
      })
      .from(profiles)
      .leftJoin(roles, eq(profiles.role_id, roles.id))
      .leftJoin(levels, eq(profiles.level_id, levels.id))
      .orderBy('created_at', 'desc')
      .all()

    return NextResponse.json(members || [])
  } catch (error) {
    console.error('❌ خطأ في جلب الأعضاء:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}