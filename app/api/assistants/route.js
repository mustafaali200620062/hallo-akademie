import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    // ✅ جلب دور المساعد
    const assistantRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Assistent'))

    if (!assistantRole || assistantRole.length === 0) {
      return NextResponse.json([])
    }

    // ✅ جلب جميع المساعدين
    const assistants = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        email: profiles.email,
        phone: profiles.phone,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        created_at: profiles.created_at,
      })
      .from(profiles)
      .where(eq(profiles.role_id, assistantRole[0].id))
      .orderBy(asc(profiles.full_name))

    return NextResponse.json(assistants || [])
  } catch (error) {
    console.error('❌ خطأ في جلب المساعدين:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}